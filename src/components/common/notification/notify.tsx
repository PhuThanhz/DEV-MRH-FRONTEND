import type { ReactNode } from "react";
import toast from "react-hot-toast";
import {
    CheckCircleFilled,
    CloseOutlined,
    ExclamationCircleFilled,
    InfoCircleFilled,
    WarningFilled,
} from "@ant-design/icons";

type NotifyVariant = "success" | "error" | "warning" | "info";
type NotifyOptions = {
    id?: string;
    toastId?: string;
    title?: string;
    duration?: number;
};

const TOAST_REMOVE_DELAY = 120;
const DEFAULT_DURATION: Record<NotifyVariant, number> = {
    success: 2600,
    info: 3200,
    warning: 4000,
    error: 5000,
};

const GENERIC_TITLES = new Set([
    "thành công",
    "có lỗi xảy ra",
    "đã xảy ra lỗi",
    "cần kiểm tra",
    "thông tin",
]);

const SUCCESS_ACTIONS: Array<[RegExp, string]> = [
    [/^tạo(?:\s+|$)/i, "Đã tạo "],
    [/^thêm(?:\s+|$)/i, "Đã thêm "],
    [/^cập nhật(?:\s+|$)/i, "Đã cập nhật "],
    [/^x[oó]a(?:\s+|$)/i, "Đã xoá "],
    [/^gán(?:\s+|$)/i, "Đã gán "],
    [/^hủy gán(?:\s+|$)/i, "Đã huỷ gán "],
    [/^khôi phục(?:\s+|$)/i, "Đã khôi phục "],
    [/^kích hoạt(?:\s+|$)/i, "Đã kích hoạt "],
    [/^ngừng kích hoạt(?:\s+|$)/i, "Đã ngừng kích hoạt "],
    [/^vô hiệu(?: hóa| hoá)(?:\s+|$)/i, "Đã vô hiệu hoá "],
    [/^lưu(?:\s+|$)/i, "Đã lưu "],
    [/^gửi(?:\s+|$)/i, "Đã gửi "],
    [/^ban hành(?:\s+|$)/i, "Đã ban hành "],
    [/^phê duyệt(?:\s+|$)/i, "Đã phê duyệt "],
    [/^duyệt(?:\s+|$)/i, "Đã duyệt "],
    [/^từ chối(?:\s+|$)/i, "Đã từ chối "],
    [/^thu hồi(?:\s+|$)/i, "Đã thu hồi "],
    [/^chia sẻ(?:\s+|$)/i, "Đã chia sẻ "],
    [/^di chuyển(?:\s+|$)/i, "Đã di chuyển "],
    [/^xuất(?:\s+|$)/i, "Đã xuất "],
    [/^nộp(?:\s+|$)/i, "Đã nộp "],
    [/^trả lại(?:\s+|$)/i, "Đã trả lại "],
    [/^kết nối(?:\s+|$)/i, "Đã kết nối "],
    [/^căn chỉnh(?:\s+|$)/i, "Đã căn chỉnh "],
    [/^gia hạn\s*/i, "Đã gia hạn"],
    [/^điều chuyển\s*/i, "Đã điều chuyển"],
    [/^tải (?:file|tệp)\s*/i, "Đã tải tệp"],
    [/^upload\s*/i, "Đã tải tệp lên"],
];

const normalizeVocabulary = (value: unknown) => String(value ?? "")
    .replace(/\bjob description\b/gi, "mô tả công việc")
    .replace(/\bprocess action\b/gi, "hành động quy trình")
    .replace(/\bbulk create\b/gi, "tạo hàng loạt")
    .replace(/\bupload(?:ed|ing)?\b/gi, "tải tệp lên")
    .replace(/\btemplate\b/gi, "mẫu")
    .replace(/\bdeadline\b/gi, "hạn chót")
    .replace(/\bpreview\b/gi, "xem trước")
    .replace(/\bfile\b/gi, "tệp")
    .replace(/\blink\b/gi, "liên kết")
    .replace(/\brole\b/gi, "vai trò")
    .replace(/\bnode\b/gi, "vị trí");

const cleanText = (value: string) => normalizeVocabulary(value)
    .trim()
    .replace(/\s+/g, " ")
    .replace(/!+(?=\s|$)/g, ".")
    .replace(/\.{2,}/g, ".");

const withoutTerminalPunctuation = (value: string) => value.replace(/[.!?]+$/g, "").trim();

const asSentence = (value: string) => {
    const cleaned = cleanText(value);
    if (!cleaned) return "";
    return /[.!?]$/.test(cleaned) ? cleaned : `${cleaned}.`;
};

const lowerFirst = (value: string) => value
    ? `${value.charAt(0).toLocaleLowerCase("vi-VN")}${value.slice(1)}`
    : value;

const splitFirstSentence = (value: string) => {
    const cleaned = cleanText(value);
    const match = cleaned.match(/^(.+?)[.!?](?:\s+|$)(.*)$/);
    if (!match) return { first: withoutTerminalPunctuation(cleaned), rest: "" };
    return {
        first: withoutTerminalPunctuation(match[1]),
        rest: asSentence(match[2] || ""),
    };
};

const isGenericTitle = (value?: string) => {
    if (!value) return true;
    return GENERIC_TITLES.has(withoutTerminalPunctuation(cleanText(value)).toLocaleLowerCase("vi-VN"));
};

const successTitleFrom = (message: string) => {
    const { first } = splitFirstSentence(message);
    const compact = first.replace(/\s+thành công$/i, "").trim();

    if (/^đăng nhập$/i.test(compact)) return "Đăng nhập thành công";
    if (/^đã\s+/i.test(compact)) return compact;

    const createCountMatch = compact.match(/^tạo thành công\s+(.+)$/i);
    if (createCountMatch) return `Đã tạo ${createCountMatch[1]}`;

    for (const [pattern, replacement] of SUCCESS_ACTIONS) {
        if (!pattern.test(compact)) continue;
        const remainder = compact.replace(pattern, "").trim();
        const separator = replacement.endsWith(" ") || !remainder ? "" : " ";
        return `${replacement}${separator}${lowerFirst(remainder)}`.trim();
    }

    return compact && !/thành công/i.test(compact) && compact.length <= 72
        ? compact
        : "Đã hoàn tất thao tác";
};

const successDescriptionFrom = (message: string, title: string) => {
    const { rest } = splitFirstSentence(message);
    if (rest) return rest;
    const normalizedTitle = title.toLocaleLowerCase("vi-VN");
    if (normalizedTitle.includes("đăng nhập")) return "Bạn đang được chuyển đến trang làm việc.";
    if (normalizedTitle.startsWith("đã tạo") || normalizedTitle.startsWith("đã thêm")) {
        return "Thông tin mới đã được lưu trên hệ thống.";
    }
    if (normalizedTitle.startsWith("đã cập nhật") || normalizedTitle.startsWith("đã lưu")) {
        return "Các thay đổi đã được lưu.";
    }
    if (normalizedTitle.startsWith("đã xoá") || normalizedTitle.startsWith("đã hủy") || normalizedTitle.startsWith("đã huỷ")) {
        return "Thay đổi đã được cập nhật trên hệ thống.";
    }
    return "Thay đổi đã được áp dụng.";
};

const errorCopyFrom = (message: string) => {
    const cleaned = cleanText(message);
    const { first, rest } = splitFirstSentence(cleaned);
    const genericError = /^(?:có|đã) lỗi xảy ra|^đã xảy ra lỗi|^lỗi xảy ra$/i.test(first);
    if (genericError) {
        const action = first.match(/(?:khi|lúc)\s+(.+)$/i)?.[1];
        return {
            title: action ? `Không thể ${lowerFirst(action)}` : "Không thể hoàn tất thao tác",
            description: rest || "Hệ thống chưa thể xử lý yêu cầu. Vui lòng thử lại.",
        };
    }
    if (/mất kết nối|lỗi kết nối|không thể kết nối/i.test(first)) {
        return {
            title: "Không thể kết nối hệ thống",
            description: rest || "Vui lòng kiểm tra kết nối mạng và thử lại.",
        };
    }
    if (/unauthorized|forbidden|access denied/i.test(first)) {
        return {
            title: "Bạn không có quyền thực hiện",
            description: "Liên hệ quản trị viên nếu bạn cần quyền cho thao tác này.",
        };
    }
    if (/\bnot found\b/i.test(first)) {
        return {
            title: "Không tìm thấy dữ liệu",
            description: "Dữ liệu có thể đã được thay đổi hoặc không còn tồn tại. Vui lòng tải lại trang.",
        };
    }
    if (/\b(?:invalid|bad request|validation failed)\b/i.test(first)) {
        return {
            title: "Thông tin chưa hợp lệ",
            description: "Vui lòng kiểm tra thông tin đã nhập và thử lại.",
        };
    }
    if (/phiên đăng nhập.*(?:hết hạn|không hợp lệ)/i.test(first)) {
        return {
            title: "Phiên đăng nhập đã hết hạn",
            description: rest || "Vui lòng đăng nhập lại để tiếp tục.",
        };
    }
    if (/request failed|network error|internal server error|status code|unexpected error|fetch failed/i.test(first)) {
        return {
            title: "Không thể hoàn tất thao tác",
            description: "Hệ thống chưa thể xử lý yêu cầu. Vui lòng thử lại hoặc liên hệ quản trị viên.",
        };
    }
    if (/không có quyền|không đủ quyền|từ chối truy cập/i.test(first)) {
        return {
            title: "Bạn không có quyền thực hiện",
            description: rest || asSentence(first),
        };
    }
    if (/không được|bắt buộc|phải |vui lòng |chưa (?:được|có)|không hợp lệ/i.test(first)) {
        return {
            title: "Thông tin chưa hợp lệ",
            description: rest ? `${asSentence(first)} ${rest}` : asSentence(first),
        };
    }

    const failedAction = first.match(/^(?:lỗi(?: khi)?\s+)(.+)$/i)?.[1]
        || first.match(/^(.+?)\s+(?:thất bại|không thành công)$/i)?.[1];
    if (failedAction) {
        return {
            title: `Không thể ${lowerFirst(failedAction)}`,
            description: rest || "Vui lòng thử lại. Nếu lỗi vẫn tiếp diễn, hãy liên hệ quản trị viên.",
        };
    }
    if (/^không thể\s+/i.test(first)) {
        return {
            title: first,
            description: rest || "Vui lòng thử lại. Nếu lỗi vẫn tiếp diễn, hãy liên hệ quản trị viên.",
        };
    }
    return {
        title: "Không thể hoàn tất thao tác",
        description: rest ? `${asSentence(first)} ${rest}` : asSentence(first),
    };
};

const isInputValidationMessage = (message: string) => {
    const cleaned = cleanText(message);
    if (/^không thể\s+/i.test(cleaned) || /vui lòng thử lại/i.test(cleaned)) return false;
    return /^(?:vui lòng|chỉ chấp nhận)|\b(?:bắt buộc|không được|phải có|phải trước|chưa chọn|chưa nhập|không hợp lệ|ít nhất|tối đa)\b/i.test(cleaned);
};

const warningTitleFrom = (message: string) => {
    const { first } = splitFirstSentence(message);
    if (/file|tệp|định dạng|dung lượng|kích thước/i.test(first)) return "Tệp chưa hợp lệ";
    if (/^không có (?:dữ liệu|nhân sự|kết quả)/i.test(first)) return "Không có dữ liệu phù hợp";
    if (/vui lòng|bắt buộc|chưa chọn|chưa nhập|thiếu/i.test(first)) return "Cần bổ sung thông tin";
    if (/^chỉ |không thể|không được/i.test(first)) return "Thao tác chưa phù hợp";
    return "Cần kiểm tra thông tin";
};

const resolveNotifyCopy = (
    variant: NotifyVariant,
    message: string,
    requestedTitle?: string,
) => {
    const cleanedMessage = cleanText(message || "");
    if (!cleanedMessage) {
        if (variant === "success") {
            return { title: "Đã hoàn tất thao tác", description: "Thay đổi đã được áp dụng." };
        }
        if (variant === "error") {
            return {
                title: "Không thể hoàn tất thao tác",
                description: "Hệ thống chưa thể xử lý yêu cầu. Vui lòng thử lại.",
            };
        }
        if (variant === "warning") {
            return { title: "Cần kiểm tra thông tin", description: "Vui lòng kiểm tra lại trước khi tiếp tục." };
        }
        return { title: "Thông tin cập nhật", description: "Trạng thái hiện tại đã được cập nhật." };
    }
    if (requestedTitle && !isGenericTitle(requestedTitle)) {
        return {
            title: withoutTerminalPunctuation(cleanText(requestedTitle)),
            description: asSentence(cleanedMessage),
        };
    }

    if (variant === "success") {
        const title = successTitleFrom(cleanedMessage);
        return { title, description: successDescriptionFrom(cleanedMessage, title) };
    }
    if (variant === "error") return errorCopyFrom(cleanedMessage);
    if (variant === "warning") {
        return { title: warningTitleFrom(cleanedMessage), description: asSentence(cleanedMessage) };
    }

    const { first, rest } = splitFirstSentence(cleanedMessage);
    if (/^đã\s+/i.test(first) && first.length <= 72) {
        return { title: first, description: rest || "Trạng thái hiện tại đã được cập nhật." };
    }
    return { title: "Thông tin cập nhật", description: asSentence(cleanedMessage) };
};

const variantConfig: Record<NotifyVariant, {
    icon: ReactNode;
    iconBg: string;
    iconColor: string;
    border: string;
    progress: string;
}> = {
    success: {
        icon: <CheckCircleFilled />,
        iconBg: "#ecfdf5",
        iconColor: "#10b981",
        border: "#bbf7d0",
        progress: "#10b981",
    },
    error: {
        icon: <ExclamationCircleFilled />,
        iconBg: "#fef2f2",
        iconColor: "#ef4444",
        border: "#fecaca",
        progress: "#ef4444",
    },
    warning: {
        icon: <WarningFilled />,
        iconBg: "#fffbeb",
        iconColor: "#d97706",
        border: "#fde68a",
        progress: "#d97706",
    },
    info: {
        icon: <InfoCircleFilled />,
        iconBg: "#eff6ff",
        iconColor: "#2563eb",
        border: "#bfdbfe",
        progress: "#2563eb",
    },
};

const renderToastCard = ({
    id,
    title,
    message,
    variant,
    duration,
}: {
    id: string;
    title: string;
    message: string;
    variant: NotifyVariant;
    duration: number;
}) => {
    const config = variantConfig[variant];

    return (
        <div
            role={variant === "error" || variant === "warning" ? "alert" : "status"}
            aria-live={variant === "error" || variant === "warning" ? "assertive" : "polite"}
            style={{
                width: "min(420px, calc(100vw - 32px))",
                position: "relative",
                overflow: "hidden",
                borderRadius: 10,
                background: "#ffffff",
                border: `1px solid ${config.border}`,
                boxShadow: "0 10px 26px rgba(15, 23, 42, 0.13)",
                padding: "12px 14px 14px",
                fontFamily: "var(--ant-font-family), Inter, -apple-system, BlinkMacSystemFont, sans-serif",
            }}
        >
            <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                <div
                    style={{
                        width: 32,
                        height: 32,
                        flex: "0 0 auto",
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        borderRadius: 8,
                        background: config.iconBg,
                        color: config.iconColor,
                        fontSize: 16,
                    }}
                >
                    {config.icon}
                </div>

                <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                        <div style={{ minWidth: 0, flex: 1 }}>
                            <div style={{ color: "#0f172a", fontSize: 14, fontWeight: 760, lineHeight: 1.35 }}>
                                {title}
                            </div>
                            <div style={{ marginTop: 2, color: "#475569", fontSize: 12.5, fontWeight: 500, lineHeight: 1.5 }}>
                                {message}
                            </div>
                        </div>

                        <button
                            type="button"
                            aria-label="Đóng thông báo"
                            onClick={() => toast.dismiss(id)}
                            style={{
                                width: 26,
                                height: 26,
                                flex: "0 0 auto",
                                display: "inline-flex",
                                alignItems: "center",
                                justifyContent: "center",
                                border: 0,
                                borderRadius: 8,
                                background: "#f8fafc",
                                color: "#94a3b8",
                                cursor: "pointer",
                                padding: 0,
                            }}
                        >
                            <CloseOutlined style={{ fontSize: 11 }} />
                        </button>
                    </div>
                </div>
            </div>

            <div
                style={{
                    position: "absolute",
                    left: 0,
                    right: 0,
                    bottom: 0,
                    height: 2,
                    background: "#f1f5f9",
                }}
            >
                <div
                    style={{
                        height: "100%",
                        width: "100%",
                        transformOrigin: "left center",
                        background: config.progress,
                        animation: `lotus-toast-progress ${duration}ms linear forwards`,
                    }}
                />
            </div>
        </div>
    );
};

const openToast = (variant: NotifyVariant, message: string, opts?: NotifyOptions) => {
    const resolvedVariant = variant === "error" && isInputValidationMessage(message)
        ? "warning"
        : variant;
    const duration = opts?.duration ?? DEFAULT_DURATION[resolvedVariant];
    const copy = resolveNotifyCopy(resolvedVariant, message, opts?.title);

    return toast.custom(
        (t) => renderToastCard({
            id: String(t.id),
            title: copy.title,
            message: copy.description,
            variant: resolvedVariant,
            duration,
        }),
        {
            id: opts?.id ?? opts?.toastId,
            duration,
            removeDelay: TOAST_REMOVE_DELAY,
            position: "top-right",
        }
    );
};

export const notify = {
    success: (msg: string, opts?: NotifyOptions) => openToast("success", msg, opts),
    error: (msg: string, opts?: NotifyOptions) => openToast("error", msg, opts),
    info: (msg: string, opts?: NotifyOptions) => openToast("info", msg, opts),
    warning: (msg: string, opts?: NotifyOptions) => openToast("warning", msg, opts),
    loading: (msg: string, opts?: NotifyOptions) => {
        const id = toast.loading(cleanText(msg), {
            id: opts?.id ?? opts?.toastId,
            position: "top-right",
            removeDelay: TOAST_REMOVE_DELAY,
            style: {
                width: "min(420px, calc(100vw - 32px))",
                borderRadius: 10,
                background: "#ffffff",
                color: "#0f172a",
                border: "1px solid #e2e8f0",
                boxShadow: "0 10px 26px rgba(15, 23, 42, 0.13)",
                padding: "12px 14px",
                fontSize: 12.5,
                fontWeight: 600,
                fontFamily: "var(--ant-font-family), Inter, -apple-system, BlinkMacSystemFont, sans-serif",
            },
        });
        return () => toast.dismiss(id);
    },
    created: (msg: string, opts?: NotifyOptions) => openToast("success", msg, opts),
    updated: (msg: string, opts?: NotifyOptions) => openToast("success", msg, opts),
    deleted: (msg: string, opts?: NotifyOptions) => openToast("success", msg, opts),
    pushNotification: (title: string, msg: string, opts?: NotifyOptions) =>
        toast.custom(
            (t) => renderToastCard({
                id: String(t.id),
                title: withoutTerminalPunctuation(cleanText(title)) || "Thông tin cập nhật",
                message: asSentence(msg),
                variant: "info",
                duration: opts?.duration ?? 3200,
            }),
            {
                id: opts?.id ?? opts?.toastId,
                duration: opts?.duration ?? 3200,
                removeDelay: TOAST_REMOVE_DELAY,
                position: "top-right",
            }
        ),
};
