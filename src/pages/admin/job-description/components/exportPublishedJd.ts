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

// ── Helpers ────────────────────────────────────────────────────────────────────
const fmt = (v?: string | null) => v ?? "";
const fmtDate = (v?: string | null) => v ? dayjs(v).format("DD/MM/YYYY") : "";

const toLines = (val?: string): string[] => {
    if (!val) return [];
    return val.split(/\n|•/).map(x => x.trim().replace(/^-\s*/, "")).filter(Boolean);
};

// ── Border presets ─────────────────────────────────────────────────────────────
const BD_THIN = { style: "thin", color: { rgb: "B0BEC5" } };
const BD_MED = { style: "medium", color: { rgb: "455A64" } };
const BD_OUTER = { top: BD_MED, bottom: BD_MED, left: BD_MED, right: BD_MED };
const BD_ALL = { top: BD_THIN, bottom: BD_THIN, left: BD_THIN, right: BD_THIN };

// ── Fill presets (Professional Navy/Blue scheme) ───────────────────────────────
const FILL_NAVY = { fgColor: { rgb: "1E3A5F" }, patternType: "solid" }; // dark navy header
const FILL_BLUE_LT = { fgColor: { rgb: "E8EEF6" }, patternType: "solid" }; // light blue section
const FILL_GREY = { fgColor: { rgb: "F3F4F6" }, patternType: "solid" }; // alternating row
const FILL_WHITE = { fgColor: { rgb: "FFFFFF" }, patternType: "solid" };

// ── Font presets ───────────────────────────────────────────────────────────────
const F = {
    white_bold_12: { name: "Arial", sz: 12, bold: true, color: { rgb: "FFFFFF" } },
    white_bold_11: { name: "Arial", sz: 11, bold: true, color: { rgb: "FFFFFF" } },
    white_bold_10: { name: "Arial", sz: 10, bold: true, color: { rgb: "FFFFFF" } },
    dark_bold_11: { name: "Arial", sz: 11, bold: true, color: { rgb: "1E3A5F" } },
    dark_bold_10: { name: "Arial", sz: 10, bold: true, color: { rgb: "1E3A5F" } },
    navy_bold_10: { name: "Arial", sz: 10, bold: true, color: { rgb: "1E3A5F" } },
    dark_10: { name: "Arial", sz: 10, color: { rgb: "1F2937" } },
    grey_10: { name: "Arial", sz: 10, color: { rgb: "6B7280" } },
};

// ── Alignment presets ──────────────────────────────────────────────────────────
const AL = {
    cc: { horizontal: "center", vertical: "center", wrapText: true },
    lc: { horizontal: "left", vertical: "center", wrapText: true },
    lt: { horizontal: "left", vertical: "top", wrapText: true },
    lc_nw: { horizontal: "left", vertical: "center" },
};

// ── Cell builder ───────────────────────────────────────────────────────────────
type WS = Record<string, any>;

function cell(
    ws: WS,
    r: number, ci: number,
    value: string | number,
    font: object,
    fill: object,
    alignment: object,
    border: object,
) {
    const addr = `${colLetter(ci)}${r + 1}`;
    ws[addr] = {
        v: value,
        t: typeof value === "number" ? "n" : "s",
        s: { font, fill, alignment, border },
    };
}

function blankCell(ws: WS, r: number, ci: number, fill: object = FILL_WHITE, border: object = BD_ALL) {
    const addr = `${colLetter(ci)}${r + 1}`;
    if (!ws[addr]) {
        ws[addr] = { v: "", t: "s", s: { font: F.dark_10, fill, alignment: AL.lc, border } };
    }
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

const colLetter = (i: number) => {
    if (i < 26) return String.fromCharCode(65 + i);
    return String.fromCharCode(64 + Math.floor(i / 26)) + String.fromCharCode(65 + (i % 26));
};

// ── Main export ────────────────────────────────────────────────────────────────
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

    // ════════════════════════════════════════════════════
    // ROW 0–1 : Header block  [Company | Title | Meta]
    // ════════════════════════════════════════════════════
    // Company name — A0:B1
    merge(ws, r, 0, r + 1, 1);
    cell(ws, r, 0,
        fmt(jd.companyName ?? "CÔNG TY CỔ PHẦN V LOTUS HOLDINGS"),
        F.dark_bold_11, FILL_WHITE, AL.cc, BD_OUTER,
    );
    blankCell(ws, r, 1, FILL_WHITE, BD_OUTER);
    blankCell(ws, r + 1, 0, FILL_WHITE, BD_OUTER);
    blankCell(ws, r + 1, 1, FILL_WHITE, BD_OUTER);

    // Title "MÔ TẢ CÔNG VIỆC" — C0:D1
    merge(ws, r, 2, r + 1, 3);
    cell(ws, r, 2, "MÔ TẢ CÔNG VIỆC", F.white_bold_12, FILL_NAVY, AL.cc, BD_OUTER);
    fillRange(ws, r, 3, 3, FILL_NAVY, BD_OUTER);
    fillRange(ws, r + 1, 2, 3, FILL_NAVY, BD_OUTER);

    // Meta — E0:G0, E1:G1
    const metaItems = [
        `Mã số: ${fmt(jd.code)}`,
        `Lần ban hành: ${fmt(String(jd.version ?? "01"))}`,
        `Ngày hiệu lực: ${fmtDate(jd.effectiveDate)}`,
        "Số trang: 01/01",
    ];
    metaItems.slice(0, 2).forEach((txt, i) => {
        merge(ws, r + i, 4, r + i, 6);
        cell(ws, r + i, 4, txt, F.dark_10, FILL_WHITE, AL.lc, BD_ALL);
        fillRange(ws, r + i, 5, 6, FILL_WHITE, BD_ALL);
    });
    rh(ws, r, 24);
    rh(ws, r + 1, 20);
    r += 2;

    // Row 2,3 = meta 3,4
    metaItems.slice(2).forEach((txt, i) => {
        merge(ws, r + i, 0, r + i, 3);
        blankCell(ws, r + i, 0, FILL_WHITE, BD_ALL);
        fillRange(ws, r + i, 1, 3, FILL_WHITE, BD_ALL);
        merge(ws, r + i, 4, r + i, 6);
        cell(ws, r + i, 4, txt, F.dark_10, FILL_WHITE, AL.lc, BD_ALL);
        fillRange(ws, r + i, 5, 6, FILL_WHITE, BD_ALL);
        rh(ws, r + i, 20);
    });
    r += 2;

    // ════════════════════════════════════════════════════
    // BẢNG MÔ TẢ CÔNG VIỆC CHI TIẾT
    // ════════════════════════════════════════════════════
    merge(ws, r, 0, r, 6);
    cell(ws, r, 0, "BẢNG MÔ TẢ CÔNG VIỆC CHI TIẾT", F.dark_bold_11, FILL_BLUE_LT, AL.cc, BD_OUTER);
    fillRange(ws, r, 1, 6, FILL_BLUE_LT, BD_OUTER);
    rh(ws, r, 26); r++;

    // Chức vụ
    cell(ws, r, 0, "Chức vụ", F.dark_bold_10, FILL_GREY, AL.lc_nw, BD_ALL);
    merge(ws, r, 1, r, 6);
    cell(ws, r, 1, fmt(jd.jobTitleName), F.navy_bold_10, FILL_WHITE, AL.lc, BD_ALL);
    fillRange(ws, r, 2, 6, FILL_WHITE, BD_ALL);
    rh(ws, r, 24); r++;

    // Phòng ban / Trực thuộc
    cell(ws, r, 0, "Phòng Ban/Bộ phận", F.dark_bold_10, FILL_GREY, AL.lc, BD_ALL);
    merge(ws, r, 1, r, 2);
    cell(ws, r, 1, fmt(jd.departmentName), F.dark_bold_10, FILL_WHITE, AL.lc, BD_ALL);
    blankCell(ws, r, 2, FILL_WHITE, BD_ALL);
    cell(ws, r, 3, "Trực thuộc", F.dark_bold_10, FILL_GREY, AL.lc, BD_ALL);
    merge(ws, r, 4, r, 6);
    cell(ws, r, 4, fmt(jd.belongsTo), F.dark_10, FILL_WHITE, AL.lc, BD_ALL);
    fillRange(ws, r, 5, 6, FILL_WHITE, BD_ALL);
    rh(ws, r, 26); r++;

    // Cấp quản lý / Tác nghiệp
    cell(ws, r, 0, "Cấp quản lý trực tiếp", F.dark_bold_10, FILL_GREY, AL.lc, BD_ALL);
    merge(ws, r, 1, r, 2);
    cell(ws, r, 1, fmt(jd.reportTo), F.dark_10, FILL_WHITE, AL.lc, BD_ALL);
    blankCell(ws, r, 2, FILL_WHITE, BD_ALL);
    cell(ws, r, 3, "Tác nghiệp với Bộ phận/Phòng ban", F.dark_bold_10, FILL_GREY, AL.lc, BD_ALL);
    merge(ws, r, 4, r, 6);
    cell(ws, r, 4, fmt(jd.collaborateWith), F.dark_10, FILL_WHITE, AL.lc, BD_ALL);
    fillRange(ws, r, 5, 6, FILL_WHITE, BD_ALL);
    rh(ws, r, 30); r++;

    // ════════════════════════════════════════════════════
    // I. SƠ ĐỒ VỊ TRÍ
    // ════════════════════════════════════════════════════
    merge(ws, r, 0, r, 6);
    cell(ws, r, 0, "I. SƠ ĐỒ VỊ TRÍ CÔNG VIỆC", F.dark_bold_11, FILL_BLUE_LT, AL.lc_nw, BD_OUTER);
    fillRange(ws, r, 1, 6, FILL_BLUE_LT, BD_OUTER);
    rh(ws, r, 22); r++;

    const posText = jd.positions?.length
        ? jd.positions.map(p =>
            `• ${p.nodeName ?? `Node #${p.nodeId}`}${p.levelCode ? ` (${p.levelCode})` : ""}`
        ).join("\n")
        : "(Chưa có sơ đồ vị trí)";
    merge(ws, r, 0, r + 4, 6);
    cell(ws, r, 0, posText, F.dark_10, FILL_WHITE, AL.lt, BD_OUTER);
    for (let ri = r; ri <= r + 4; ri++) {
        fillRange(ws, ri, 1, 6, FILL_WHITE, BD_OUTER);
        rh(ws, ri, 18);
    }
    r += 5;

    // ════════════════════════════════════════════════════
    // II. MÔ TẢ CÔNG VIỆC (Tasks)
    // ════════════════════════════════════════════════════
    merge(ws, r, 0, r, 6);
    cell(ws, r, 0, "II. MÔ TẢ CÔNG VIỆC", F.dark_bold_11, FILL_BLUE_LT, AL.lc_nw, BD_OUTER);
    fillRange(ws, r, 1, 6, FILL_BLUE_LT, BD_OUTER);
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
            cell(ws, r, 0, content, F.dark_10, FILL_WHITE, AL.lt, BD_ALL);
            fillRange(ws, r, 1, 6, FILL_WHITE, BD_ALL);
            rh(ws, r, hpt); r++;
        });
    }

    // ════════════════════════════════════════════════════
    // III. YÊU CẦU ĐỐI VỚI VỊ TRÍ
    // ════════════════════════════════════════════════════
    merge(ws, r, 0, r, 6);
    cell(ws, r, 0, "III. YÊU CẦU ĐỐI VỚI VỊ TRÍ", F.dark_bold_11, FILL_BLUE_LT, AL.lc_nw, BD_OUTER);
    fillRange(ws, r, 1, 6, FILL_BLUE_LT, BD_OUTER);
    rh(ws, r, 22); r++;

    // Table header
    cell(ws, r, 0, "STT", F.white_bold_10, FILL_NAVY, AL.cc, BD_ALL);
    cell(ws, r, 1, "Nhóm yêu cầu", F.white_bold_10, FILL_NAVY, AL.cc, BD_ALL);
    merge(ws, r, 2, r, 6);
    cell(ws, r, 2, "Chi tiết", F.white_bold_10, FILL_NAVY, AL.cc, BD_ALL);
    fillRange(ws, r, 3, 6, FILL_NAVY, BD_ALL);
    rh(ws, r, 22); r++;

    const req = jd.requirements;
    const groups: [string, string | undefined][] = [
        ["Kiến thức", req?.knowledge],
        ["Kinh nghiệm", req?.experience],
        ["Kỹ năng", req?.skills],
        ["Phẩm chất", req?.qualities],
        ["Yêu cầu khác", req?.otherRequirements],
    ];

    let stt = 1;
    const rowFills = [FILL_WHITE, FILL_GREY];
    groups.forEach(([label, val]) => {
        const lines = toLines(val);
        const content = lines.length ? lines.map(l => `- ${l}`).join("\n") : "—";
        const hpt = Math.max(28, lines.length * 16);
        const bg = rowFills[(stt - 1) % 2];

        cell(ws, r, 0, stt, F.dark_bold_10, bg, AL.cc, BD_ALL);
        cell(ws, r, 1, label, F.dark_bold_10, bg, AL.lc, BD_ALL);
        merge(ws, r, 2, r, 6);
        cell(ws, r, 2, content, F.dark_10, FILL_WHITE, AL.lt, BD_ALL);
        fillRange(ws, r, 3, 6, FILL_WHITE, BD_ALL);
        rh(ws, r, hpt); r++;
        stt++;
    });

    // ════════════════════════════════════════════════════
    // Spacer
    // ════════════════════════════════════════════════════
    merge(ws, r, 0, r, 6);
    blankCell(ws, r, 0, FILL_WHITE, {});
    fillRange(ws, r, 1, 6, FILL_WHITE, {});
    rh(ws, r, 14); r++;

    // ════════════════════════════════════════════════════
    // SIGN BLOCK — 2 cột rõ ràng: A:C | E:G (D là khoảng trống giữa)
    // Layout: A(0)–C(2) = NGƯỜI GIAO VIỆC | D(3) blank | E(4)–G(6) = NGƯỜI NHẬN VIỆC
    // ════════════════════════════════════════════════════

    // ── Header row ──
    merge(ws, r, 0, r, 2);
    cell(ws, r, 0, "NGƯỜI GIAO VIỆC", F.white_bold_10, FILL_NAVY, AL.cc, BD_ALL);
    fillRange(ws, r, 1, 2, FILL_NAVY, BD_ALL);

    // Cột D (3) — khoảng trống giữa
    blankCell(ws, r, 3, FILL_WHITE, {});

    merge(ws, r, 4, r, 6);
    cell(ws, r, 4, "NGƯỜI NHẬN VIỆC", F.white_bold_10, FILL_NAVY, AL.cc, BD_ALL);
    fillRange(ws, r, 5, 6, FILL_NAVY, BD_ALL);
    rh(ws, r, 22); r++;

    // ── Chức danh row ──
    merge(ws, r, 0, r, 2);
    cell(ws, r, 0, "Chức danh: TỔNG GIÁM ĐỐC", F.dark_bold_10, FILL_WHITE, AL.lc, BD_ALL);
    fillRange(ws, r, 1, 2, FILL_WHITE, BD_ALL);

    blankCell(ws, r, 3, FILL_WHITE, {});

    merge(ws, r, 4, r, 6);
    cell(ws, r, 4, `Chức danh: ${fmt(jd.jobTitleName)}`, F.dark_bold_10, FILL_WHITE, AL.lc, BD_ALL);
    fillRange(ws, r, 5, 6, FILL_WHITE, BD_ALL);
    rh(ws, r, 20); r++;

    // ── Dòng ghi chú nhỏ (ngày ký) ──
    merge(ws, r, 0, r, 2);
    cell(ws, r, 0, "Ngày      tháng      năm", F.grey_10, FILL_WHITE, AL.cc, BD_ALL);
    fillRange(ws, r, 1, 2, FILL_WHITE, BD_ALL);

    blankCell(ws, r, 3, FILL_WHITE, {});

    merge(ws, r, 4, r, 6);
    cell(ws, r, 4, "Ngày      tháng      năm", F.grey_10, FILL_WHITE, AL.cc, BD_ALL);
    fillRange(ws, r, 5, 6, FILL_WHITE, BD_ALL);
    rh(ws, r, 18); r++;

    // ── Blank signature rows x4 ──
    for (let i = 0; i < 4; i++) {
        merge(ws, r, 0, r, 2);
        cell(ws, r, 0, i === 1 ? "(Ký và ghi rõ họ tên)" : "", F.grey_10, FILL_WHITE, AL.cc, i === 1 ? BD_ALL : BD_ALL);
        fillRange(ws, r, 1, 2, FILL_WHITE, BD_ALL);

        blankCell(ws, r, 3, FILL_WHITE, {});

        merge(ws, r, 4, r, 6);
        cell(ws, r, 4, i === 1 ? "(Ký và ghi rõ họ tên)" : "", F.grey_10, FILL_WHITE, AL.cc, BD_ALL);
        fillRange(ws, r, 5, 6, FILL_WHITE, BD_ALL);
        rh(ws, r, 18); r++;
    }

    // ── Họ và tên row ──
    merge(ws, r, 0, r, 2);
    cell(ws, r, 0, "Họ và tên: LÊ VÂN MÂY", F.dark_bold_10, FILL_WHITE, AL.lc, BD_ALL);
    fillRange(ws, r, 1, 2, FILL_WHITE, BD_ALL);

    blankCell(ws, r, 3, FILL_WHITE, {});

    merge(ws, r, 4, r, 6);
    cell(ws, r, 4, "Họ và tên:", F.dark_bold_10, FILL_WHITE, AL.lc, BD_ALL);
    fillRange(ws, r, 5, 6, FILL_WHITE, BD_ALL);
    rh(ws, r, 20); r++;

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