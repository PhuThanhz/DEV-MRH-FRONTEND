import fs from "node:fs";
import path from "node:path";
import ts from "typescript";

const rootDir = path.resolve(process.cwd(), "src");
const notificationModule = path.normalize("components/common/notification/notify.tsx");
const supportedExtensions = new Set([".ts", ".tsx"]);
const notifyMethods = new Set([
    "success",
    "error",
    "warning",
    "info",
    "created",
    "updated",
    "deleted",
    "loading",
    "pushNotification",
]);

const copyRules = [
    {
        code: "generic-copy",
        pattern: /\b(?:có lỗi xảy ra|đã xảy ra lỗi|oops)\b|^(?:thành công|cần kiểm tra|thông tin|lỗi)[.!]?$/i,
        message: "Dùng kết quả hoặc hành động cụ thể, không dùng câu lỗi chung chung.",
    },
    {
        code: "exclamation-mark",
        pattern: /!+/,
        message: "Thông báo sản phẩm không dùng dấu chấm than.",
    },
    {
        code: "mixed-language",
        pattern: /\b(?:upload|file|template|role|node|preview|bulk create|process action|deadline|job description|link)\b/i,
        message: "Dùng thuật ngữ tiếng Việt theo bảng từ vựng thông báo.",
    },
    {
        code: "failure-phrasing",
        pattern: /^(?:(?:có\s+)?lỗi(?: khi)?\s+)|\bthất bại\b/i,
        message: "Viết theo mẫu “Không thể + hành động”, không dùng “Lỗi khi” hoặc “thất bại”.",
    },
];

const walk = (directory) => fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) return walk(fullPath);
    return supportedExtensions.has(path.extname(entry.name)) ? [fullPath] : [];
});

const literalText = (node) => {
    if (!node) return "";
    if (ts.isStringLiteralLike(node)) return node.text;
    if (ts.isTemplateExpression(node)) {
        return [node.head.text, ...node.templateSpans.map((span) => span.literal.text)].join(" ");
    }
    if (ts.isBinaryExpression(node)) return `${literalText(node.left)} ${literalText(node.right)}`.trim();
    if (ts.isParenthesizedExpression(node)) return literalText(node.expression);
    return "";
};

const violations = [];
let fileCount = 0;
let callCount = 0;

for (const filePath of walk(rootDir)) {
    const relativePath = path.relative(rootDir, filePath);
    const sourceText = fs.readFileSync(filePath, "utf8");
    const scriptKind = filePath.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS;
    const sourceFile = ts.createSourceFile(filePath, sourceText, ts.ScriptTarget.Latest, true, scriptKind);
    let hasNotification = false;

    const visit = (node) => {
        if (
            ts.isCallExpression(node)
            && ts.isPropertyAccessExpression(node.expression)
            && ts.isIdentifier(node.expression.expression)
            && node.expression.expression.text === "notify"
            && notifyMethods.has(node.expression.name.text)
        ) {
            callCount += 1;
            hasNotification = true;

            if (path.normalize(relativePath) !== notificationModule) {
                const copy = literalText(node.arguments[0]);
                const position = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile));
                if (copy) {
                    for (const rule of copyRules) {
                        if (rule.pattern.test(copy)) {
                            violations.push({
                                file: relativePath,
                                line: position.line + 1,
                                code: rule.code,
                                message: rule.message,
                                copy: copy.replace(/\s+/g, " ").trim(),
                            });
                        }
                    }
                    if (
                        node.expression.name.text === "error"
                        && !/^không thể\s+/i.test(copy)
                        && /^(?:vui lòng|chỉ chấp nhận)|\b(?:bắt buộc|không được|phải có|phải trước|chưa chọn|chưa nhập)\b/i.test(copy)
                    ) {
                        violations.push({
                            file: relativePath,
                            line: position.line + 1,
                            code: "validation-severity",
                            message: "Dữ liệu thiếu hoặc chưa hợp lệ phải dùng notify.warning, không dùng notify.error.",
                            copy: copy.replace(/\s+/g, " ").trim(),
                        });
                    }
                }

                const options = node.arguments[1];
                if (options && ts.isObjectLiteralExpression(options)) {
                    const titleProperty = options.properties.find((property) => (
                        ts.isPropertyAssignment(property)
                        && (
                            (ts.isIdentifier(property.name) && property.name.text === "title")
                            || (ts.isStringLiteral(property.name) && property.name.text === "title")
                        )
                    ));
                    if (titleProperty && ts.isPropertyAssignment(titleProperty)) {
                        const titleCopy = literalText(titleProperty.initializer);
                        for (const rule of copyRules) {
                            if (titleCopy && rule.pattern.test(titleCopy)) {
                                violations.push({
                                    file: relativePath,
                                    line: position.line + 1,
                                    code: `title-${rule.code}`,
                                    message: `Tiêu đề: ${rule.message}`,
                                    copy: titleCopy.replace(/\s+/g, " ").trim(),
                                });
                            }
                        }
                    }
                }
            }
        }
        ts.forEachChild(node, visit);
    };

    visit(sourceFile);
    if (hasNotification) fileCount += 1;
}

if (violations.length > 0) {
    console.error(`Phát hiện ${violations.length} lỗi nội dung thông báo:`);
    for (const violation of violations) {
        console.error(
            `${violation.file}:${violation.line} [${violation.code}] ${violation.message}\n  “${violation.copy}”`,
        );
    }
    process.exitCode = 1;
} else {
    console.log(`Đã kiểm tra ${callCount} thông báo trong ${fileCount} tệp: không có lỗi nội dung tĩnh.`);
}
