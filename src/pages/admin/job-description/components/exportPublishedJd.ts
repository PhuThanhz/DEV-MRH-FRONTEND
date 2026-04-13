// npm install xlsx-js-style
import XLSXStyle from "xlsx-js-style";
import { saveAs } from "file-saver";
import dayjs from "dayjs";
import type { IJobDescription, IJDFlowLog } from "@/types/backend";

type EnrichedJD = IJobDescription & {
    companyName?: string;
    departmentName?: string;
    jobTitleName?: string;
};

const fmt = (v?: string | null) => v ?? "";
const fmtDate = (v?: string | null) => v ? dayjs(v).format("DD/MM/YYYY") : "";

const toLines = (val?: string): string[] => {
    if (!val) return [];
    return val.split(/\n|•/).map(x => x.trim().replace(/^-\s*/, "")).filter(Boolean);
};

const BD_THIN = { style: "thin", color: { rgb: "BFBFBF" } };
const BD_MED = { style: "medium", color: { rgb: "595959" } };
const BD_OUTER = { top: BD_MED, bottom: BD_MED, left: BD_MED, right: BD_MED };
const BD_ALL = { top: BD_THIN, bottom: BD_THIN, left: BD_THIN, right: BD_THIN };
const BD_NONE = {};

const FILL_WHITE = { fgColor: { rgb: "FFFFFF" }, patternType: "solid" };
const FILL_LIGHT = { fgColor: { rgb: "F7F7F7" }, patternType: "solid" };
const FILL_SECTION_ORANGE = { fgColor: { rgb: "FDE9D9" }, patternType: "solid" };

const F = {
    black_bold_12: { name: "Arial", sz: 12, bold: true, color: { rgb: "000000" } },
    black_bold_11: { name: "Arial", sz: 11, bold: true, color: { rgb: "000000" } },
    black_bold_10: { name: "Arial", sz: 10, bold: true, color: { rgb: "000000" } },
    black_10: { name: "Arial", sz: 10, color: { rgb: "000000" } },
    grey_10: { name: "Arial", sz: 10, color: { rgb: "595959" } },
};

const AL = {
    cc: { horizontal: "center", vertical: "center", wrapText: true },
    lc: { horizontal: "left", vertical: "center", wrapText: true },
    lt: { horizontal: "left", vertical: "top", wrapText: true },
    lc_nw: { horizontal: "left", vertical: "center" },
};

type WS = Record<string, any>;

const colLetter = (i: number) => {
    if (i < 26) return String.fromCharCode(65 + i);
    return String.fromCharCode(64 + Math.floor(i / 26)) + String.fromCharCode(65 + (i % 26));
};

function cell(
    ws: WS, r: number, ci: number, value: string | number,
    font: object, fill: object, alignment: object, border: object,
) {
    const addr = `${colLetter(ci)}${r + 1}`;
    ws[addr] = { v: value, t: typeof value === "number" ? "n" : "s", s: { font, fill, alignment, border } };
}

function blankCell(ws: WS, r: number, ci: number, fill: object = FILL_WHITE, border: object = BD_ALL) {
    const addr = `${colLetter(ci)}${r + 1}`;
    if (!ws[addr]) ws[addr] = { v: "", t: "s", s: { font: F.black_10, fill, alignment: AL.lc, border } };
}

function fillRange(ws: WS, r: number, c1: number, c2: number, fill: object, border: object = BD_ALL) {
    for (let ci = c1; ci <= c2; ci++) blankCell(ws, r, ci, fill, border);
}

function merge(ws: WS, r1: number, c1: number, r2: number, c2: number) {
    if (!ws["!merges"]) ws["!merges"] = [];
    ws["!merges"].push({ s: { r: r1, c: c1 }, e: { r: r2, c: c2 } });
}

function rh(ws: WS, ri: number, hpt: number) {
    if (!ws["!rows"]) ws["!rows"] = [];
    ws["!rows"][ri] = { hpt };
}

export const exportJdToExcel = (jd: EnrichedJD, _logs: IJDFlowLog[] = []) => {
    const ws: WS = {};
    ws["!merges"] = [];
    ws["!rows"] = [];

    // Cols: A(0) B(1) C(2) D(3) E(4) F(5) G(6)
    ws["!cols"] = [
        { wch: 22 }, // A
        { wch: 26 }, // B
        { wch: 18 }, // C
        { wch: 16 }, // D
        { wch: 22 }, // E
        { wch: 12 }, // F
        { wch: 16 }, // G
    ];

    let r = 0;

    // ══════════════════════════════════════════
    // ROW 0–3 : Header block (4 rows)
    //   A:B  rows 0-3 → Company name
    //   C:D  rows 0-3 → MÔ TẢ CÔNG VIỆC
    //   E:G  row 0    → Mã số
    //   E:G  row 1    → Lần ban hành
    //   E:G  row 2    → Ngày hiệu lực
    //   E:G  row 3    → Số trang
    // ══════════════════════════════════════════
    const metaItems = [
        `Mã số: ${fmt(jd.code)}`,
        `Lần ban hành: ${fmt(String(jd.version ?? "01"))}`,
        `Ngày hiệu lực: ${fmtDate(jd.effectiveDate)}`,
        "Số trang: 01/01",
    ];

    // A:B rows 0-3 → Company name
    merge(ws, 0, 0, 3, 1);
    cell(ws, 0, 0,
        fmt(jd.companyName ?? "CÔNG TY CỔ PHẦN V LOTUS HOLDINGS"),
        F.black_bold_11, FILL_WHITE, AL.cc, BD_OUTER,
    );
    for (let ri = 0; ri <= 3; ri++) blankCell(ws, ri, 1, FILL_WHITE, BD_OUTER);

    // C:D rows 0-3 → MÔ TẢ CÔNG VIỆC
    merge(ws, 0, 2, 3, 3);
    cell(ws, 0, 2, "MÔ TẢ CÔNG VIỆC", F.black_bold_12, FILL_LIGHT, AL.cc, BD_OUTER);
    for (let ri = 0; ri <= 3; ri++) blankCell(ws, ri, 3, FILL_LIGHT, BD_OUTER);

    // E:G rows 0-3 → 4 meta items
    metaItems.forEach((txt, i) => {
        merge(ws, i, 4, i, 6);
        cell(ws, i, 4, txt, F.black_10, FILL_WHITE, AL.lc, BD_ALL);
        fillRange(ws, i, 5, 6, FILL_WHITE, BD_ALL);
        rh(ws, i, 22);
    });

    r = 4;

    // ══════════════════════════════════════════
    // BẢNG MÔ TẢ CÔNG VIỆC CHI TIẾT — màu cam nhạt
    // ══════════════════════════════════════════
    merge(ws, r, 0, r, 6);
    cell(ws, r, 0, "BẢNG MÔ TẢ CÔNG VIỆC CHI TIẾT",
        F.black_bold_11, FILL_SECTION_ORANGE, AL.cc, BD_OUTER);
    fillRange(ws, r, 1, 6, FILL_SECTION_ORANGE, BD_OUTER);
    rh(ws, r, 26); r++;

    // Chức vụ
    cell(ws, r, 0, "Chức vụ", F.black_bold_10, FILL_LIGHT, AL.lc_nw, BD_ALL);
    merge(ws, r, 1, r, 6);
    cell(ws, r, 1, fmt(jd.jobTitleName), F.black_bold_10, FILL_WHITE, AL.lc, BD_ALL);
    fillRange(ws, r, 2, 6, FILL_WHITE, BD_ALL);
    rh(ws, r, 24); r++;

    // Phòng ban / Trực thuộc
    cell(ws, r, 0, "Phòng Ban/Bộ phận", F.black_bold_10, FILL_LIGHT, AL.lc, BD_ALL);
    merge(ws, r, 1, r, 2);
    cell(ws, r, 1, fmt(jd.departmentName), F.black_10, FILL_WHITE, AL.lc, BD_ALL);
    blankCell(ws, r, 2, FILL_WHITE, BD_ALL);
    cell(ws, r, 3, "Trực thuộc", F.black_bold_10, FILL_LIGHT, AL.lc, BD_ALL);
    merge(ws, r, 4, r, 6);
    cell(ws, r, 4, fmt(jd.belongsTo), F.black_10, FILL_WHITE, AL.lc, BD_ALL);
    fillRange(ws, r, 5, 6, FILL_WHITE, BD_ALL);
    rh(ws, r, 26); r++;

    // Cấp quản lý / Tác nghiệp
    cell(ws, r, 0, "Cấp quản lý trực tiếp", F.black_bold_10, FILL_LIGHT, AL.lc, BD_ALL);
    merge(ws, r, 1, r, 2);
    cell(ws, r, 1, fmt(jd.reportTo), F.black_10, FILL_WHITE, AL.lc, BD_ALL);
    blankCell(ws, r, 2, FILL_WHITE, BD_ALL);
    cell(ws, r, 3, "Tác nghiệp với Bộ phận/Phòng ban", F.black_bold_10, FILL_LIGHT, AL.lc, BD_ALL);
    merge(ws, r, 4, r, 6);
    cell(ws, r, 4, fmt(jd.collaborateWith), F.black_10, FILL_WHITE, AL.lc, BD_ALL);
    fillRange(ws, r, 5, 6, FILL_WHITE, BD_ALL);
    rh(ws, r, 30); r++;

    // ══════════════════════════════════════════
    // I. SƠ ĐỒ VỊ TRÍ
    // ══════════════════════════════════════════
    merge(ws, r, 0, r, 6);
    cell(ws, r, 0, "I. SƠ ĐỒ VỊ TRÍ CÔNG VIỆC",
        F.black_bold_11, FILL_LIGHT, AL.lc_nw, BD_OUTER);
    fillRange(ws, r, 1, 6, FILL_LIGHT, BD_OUTER);
    rh(ws, r, 22); r++;

    const posText = jd.positions?.length
        ? jd.positions.map(p =>
            `• ${p.nodeName ?? `Node #${p.nodeId}`}${p.levelCode ? ` (${p.levelCode})` : ""}`
        ).join("\n")
        : "(Chưa có sơ đồ vị trí)";
    merge(ws, r, 0, r + 4, 6);
    cell(ws, r, 0, posText, F.black_10, FILL_WHITE, AL.lt, BD_OUTER);
    for (let ri = r; ri <= r + 4; ri++) {
        fillRange(ws, ri, 1, 6, FILL_WHITE, BD_OUTER);
        rh(ws, ri, 18);
    }
    r += 5;

    // ══════════════════════════════════════════
    // II. MÔ TẢ CÔNG VIỆC
    // ══════════════════════════════════════════
    merge(ws, r, 0, r, 6);
    cell(ws, r, 0, "II. MÔ TẢ CÔNG VIỆC",
        F.black_bold_11, FILL_LIGHT, AL.lc_nw, BD_OUTER);
    fillRange(ws, r, 1, 6, FILL_LIGHT, BD_OUTER);
    rh(ws, r, 22); r++;

    const tasks = (jd.tasks ?? []).slice().sort((a, b) => a.orderNo - b.orderNo);
    if (!tasks.length) {
        merge(ws, r, 0, r, 6);
        cell(ws, r, 0, "(Chưa có nhiệm vụ nào)", F.grey_10, FILL_WHITE, AL.cc, BD_ALL);
        fillRange(ws, r, 1, 6, FILL_WHITE, BD_ALL);
        rh(ws, r, 20); r++;
    } else {
        tasks.forEach((task, i) => {
            const lines = toLines(task.content);
            const titleLine = `${i + 1}. ${task.title ?? ""}`;
            const bodyLines = lines.map(l => `- ${l}`).join("\n");
            const content = bodyLines ? `${titleLine}\n${bodyLines}` : titleLine;
            const hpt = Math.max(36, (lines.length + 1) * 15);
            merge(ws, r, 0, r, 6);
            cell(ws, r, 0, content, F.black_10, FILL_WHITE, AL.lt, BD_ALL);
            fillRange(ws, r, 1, 6, FILL_WHITE, BD_ALL);
            rh(ws, r, hpt); r++;
        });
    }

    // ══════════════════════════════════════════
    // III. YÊU CẦU ĐỐI VỚI VỊ TRÍ
    // Không có STT/Nhóm — mỗi nhóm: 1 row label + 1 row content, full width
    // ══════════════════════════════════════════
    merge(ws, r, 0, r, 6);
    cell(ws, r, 0, "III. YÊU CẦU ĐỐI VỚI VỊ TRÍ",
        F.black_bold_11, FILL_LIGHT, AL.lc_nw, BD_OUTER);
    fillRange(ws, r, 1, 6, FILL_LIGHT, BD_OUTER);
    rh(ws, r, 22); r++;

    const req = jd.requirements;
    const groups: [string, string | undefined][] = [
        ["Kiến thức", req?.knowledge],
        ["Kinh nghiệm", req?.experience],
        ["Kỹ năng", req?.skills],
        ["Phẩm chất", req?.qualities],
        ["Yêu cầu khác", req?.otherRequirements],
    ];

    groups.forEach(([label, val]) => {
        const lines = toLines(val);
        const content = lines.length ? lines.map(l => `- ${l}`).join("\n") : "—";
        const hpt = Math.max(28, lines.length * 16);

        // Label header — full width, nền light
        merge(ws, r, 0, r, 6);
        cell(ws, r, 0, label, F.black_bold_10, FILL_LIGHT, AL.lc_nw, BD_ALL);
        fillRange(ws, r, 1, 6, FILL_LIGHT, BD_ALL);
        rh(ws, r, 20); r++;

        // Content — full width, nền trắng
        merge(ws, r, 0, r, 6);
        cell(ws, r, 0, content, F.black_10, FILL_WHITE, AL.lt, BD_ALL);
        fillRange(ws, r, 1, 6, FILL_WHITE, BD_ALL);
        rh(ws, r, hpt); r++;
    });

    // ══════════════════════════════════════════
    // Spacer
    // ══════════════════════════════════════════
    merge(ws, r, 0, r, 6);
    blankCell(ws, r, 0, FILL_WHITE, BD_NONE);
    fillRange(ws, r, 1, 6, FILL_WHITE, BD_NONE);
    rh(ws, r, 14); r++;

    // ══════════════════════════════════════════
    // SIGN BLOCK
    // Không có màu xám, không có ngày tháng
    // Layout: Header | Chức danh | (5 rows ký) | Họ và tên
    // Left A:C (cols 0-2) | Right D:G (cols 3-6)
    // ══════════════════════════════════════════

    // Header labels
    merge(ws, r, 0, r, 2);
    cell(ws, r, 0, "NGƯỜI GIAO VIỆC", F.black_bold_10, FILL_WHITE, AL.cc, BD_OUTER);
    fillRange(ws, r, 1, 2, FILL_WHITE, BD_OUTER);
    merge(ws, r, 3, r, 6);
    cell(ws, r, 3, "NGƯỜI NHẬN VIỆC", F.black_bold_10, FILL_WHITE, AL.cc, BD_OUTER);
    fillRange(ws, r, 4, 6, FILL_WHITE, BD_OUTER);
    rh(ws, r, 22); r++;

    // Chức danh
    merge(ws, r, 0, r, 2);
    cell(ws, r, 0, "Chức danh: TỔNG GIÁM ĐỐC", F.black_bold_10, FILL_WHITE, AL.lc, BD_OUTER);
    fillRange(ws, r, 1, 2, FILL_WHITE, BD_OUTER);
    merge(ws, r, 3, r, 6);
    cell(ws, r, 3, `Chức danh: ${fmt(jd.jobTitleName)}`, F.black_bold_10, FILL_WHITE, AL.lc, BD_OUTER);
    fillRange(ws, r, 4, 6, FILL_WHITE, BD_OUTER);
    rh(ws, r, 22); r++;

    // 5 rows trống để ký tên
    for (let i = 0; i < 5; i++) {
        merge(ws, r, 0, r, 2);
        blankCell(ws, r, 0, FILL_WHITE, BD_OUTER);
        fillRange(ws, r, 1, 2, FILL_WHITE, BD_OUTER);
        merge(ws, r, 3, r, 6);
        blankCell(ws, r, 3, FILL_WHITE, BD_OUTER);
        fillRange(ws, r, 4, 6, FILL_WHITE, BD_OUTER);
        rh(ws, r, 18); r++;
    }

    // Họ và tên
    merge(ws, r, 0, r, 2);
    cell(ws, r, 0, "Họ và tên: LÊ VÂN MÂY", F.black_bold_10, FILL_WHITE, AL.lc, BD_OUTER);
    fillRange(ws, r, 1, 2, FILL_WHITE, BD_OUTER);
    merge(ws, r, 3, r, 6);
    cell(ws, r, 3, "Họ và tên:", F.black_bold_10, FILL_WHITE, AL.lc, BD_OUTER);
    fillRange(ws, r, 4, 6, FILL_WHITE, BD_OUTER);
    rh(ws, r, 22); r++;

    // ── Finalize ──────────────────────────────────────────────────────────────
    ws["!ref"] = `A1:G${r + 1}`;

    const wb = XLSXStyle.utils.book_new();
    XLSXStyle.utils.book_append_sheet(wb, ws, "Mô Tả Công Việc");

    const buffer = XLSXStyle.write(wb, { bookType: "xlsx", type: "array" });
    const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    const safeName = (jd.jobTitleName ?? jd.code ?? "JD").replace(/[/\\?%*:|"<>]/g, "-");
    saveAs(blob, `JD_${safeName}_${dayjs().format("YYYYMMDD")}.xlsx`);
};