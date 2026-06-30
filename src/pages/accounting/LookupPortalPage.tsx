import React, { lazy, Suspense, useState, useEffect, useRef } from "react";
import { Input, Typography, Empty, Spin, Tag, Tooltip, Select, Badge, Skeleton } from "antd";
import {
    SearchOutlined, ArrowLeftOutlined, DownloadOutlined, PrinterOutlined,
    FileTextOutlined, FilterOutlined, CalendarOutlined, CheckCircleFilled,
    MinusCircleFilled, CloseOutlined, SlidersOutlined, InboxOutlined,
} from "@ant-design/icons";
import { callFetchAccountingDocuments } from "@/config/api";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import { PATHS } from "@/constants/paths";
import { useAccountingDocumentCategoryActiveQuery } from "@/hooks/useAccountingDocumentCategories";
import LotusCharmAssistant from "@/components/common/navigation/LotusCharmAssistant";
import { downloadUrlAsBlob, getFileNameFromUrl } from "@/config/download-url";

const { Text } = Typography;
const loadInlinePdfViewer = () => import("./InlinePdfViewer");
const InlinePdfViewer = lazy(loadInlinePdfViewer);

// ── Tokens ──────────────────────────────────────────
const T = {
    white: "#ffffff",
    bg: "#fafafa",
    border: "#ebebeb",
    borderFocus: "#d0d0d0",
    text: "#2f3746",
    textSub: "#667085",
    textMute: "#a6afbd",
    hover: "#f5f5f5",
    selected: "#ffffff",
    selectedBorder: "#e7ebf0",
    accentLine: "#8b96a7",
    accentSoft: "#f8fafc",
    accentBorder: "#e2e8f0",
    statusNeutral: "#758195",
    codeFont: "'SF Mono', 'Fira Code', 'Consolas', monospace",
    sans: "'Inter', 'Segoe UI', -apple-system, sans-serif",
};

const CURRENT_YEAR = dayjs().year();
const YEAR_OPTIONS = Array.from({ length: 6 }, (_, i) => ({ label: `${CURRENT_YEAR - i}`, value: CURRENT_YEAR - i }));
const MONTH_OPTIONS = Array.from({ length: 12 }, (_, i) => ({ label: `Tháng ${String(i + 1).padStart(2, "0")}`, value: i + 1 }));
type ValidityFilter = "all" | "effective" | "cancelled";

const VALIDITY_LABELS: Record<ValidityFilter, string> = {
    all: "Tất cả",
    effective: "Còn hiệu lực",
    cancelled: "Đã hủy",
};

const WORKFLOW_STATUS_LABELS: Record<string, string> = {
    DRAFT: "Nháp",
    PENDING_APPROVAL: "Chờ duyệt",
    APPROVED: "Đã duyệt",
    REJECTED: "Từ chối",
    ACCOUNTED: "Đã hạch toán",
    LOCKED: "Đã khóa sổ",
};

const DOCUMENT_STATUS_LABELS: Record<string, string> = {
    ACTIVE: "Đã lưu hồ sơ",
    INACTIVE: "Ngưng sử dụng",
    DRAFT: "Nháp",
    PUBLISHED: "Đã ban hành",
    ARCHIVED: "Đã lưu trữ",
};

const getValidityLabel = (active?: boolean) => active ? "Còn hiệu lực" : "Đã hủy";
const isWorkflowStatus = (status?: string) => !!status && ["PENDING_APPROVAL", "APPROVED", "REJECTED"].includes(status);
const getDocumentStatusLabel = (status?: string) => status ? DOCUMENT_STATUS_LABELS[status] || WORKFLOW_STATUS_LABELS[status] || status : "Chưa có";
const getWorkflowStatusLabel = (status?: string) => status ? WORKFLOW_STATUS_LABELS[status] || status : "Chưa có";
const buildDocumentFileUrl = (fileName?: string | null) => {
    if (!fileName) return null;
    if (/^https?:\/\//i.test(fileName)) return fileName;
    // Strip legacy /uploads/ or /storage/ prefix stored in DB
    const normalized = fileName.replace(/^\/+/, "").replace(/^(?:uploads|storage)\//, "");
    const folder = normalized.includes("/") ? normalized.split("/").slice(0, -1).join("/") : "documents";
    const name = normalized.includes("/") ? normalized.split("/").pop()! : normalized;
    return `${import.meta.env.VITE_BACKEND_URL}/api/v1/files/public?fileName=${encodeURIComponent(name)}&folder=${encodeURIComponent(folder)}`;
};

const getStatusColor = (status?: string) => {
    switch (status) {
        case "DRAFT": return { color: "#64748b", bg: "#f8fafc", border: "#cbd5e1" };
        case "PENDING_APPROVAL": return { color: "#d97706", bg: "#fffbeb", border: "#fcd34d" };
        case "REJECTED": return { color: "#dc2626", bg: "#fef2f2", border: "#fca5a5" };
        case "APPROVED": case "ACCOUNTED": case "PUBLISHED": case "ACTIVE": return { color: "#059669", bg: "#ecfdf5", border: "#6ee7b7" };
        case "LOCKED": case "ARCHIVED": return { color: "#7c3aed", bg: "#f5f3ff", border: "#c4b5fd" };
        case "INACTIVE": return { color: "#dc2626", bg: "#fef2f2", border: "#fca5a5" };
        default: return { color: "#0284c7", bg: "#f0f9ff", border: "#bae6fd" };
    }
};

// ── SubComponents ────────────────────────────────────
const Kbd = ({ children }: { children: string }) => (
    <span style={{
        padding: "1px 5px", borderRadius: 4,
        border: `1px solid ${T.border}`, background: T.hover,
        fontSize: 11, fontFamily: T.codeFont, color: T.textSub,
        lineHeight: "18px", display: "inline-block",
    }}>{children}</span>
);

const MetaChip = ({ label, value }: { label: string; value: string }) => (
    <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
        <span style={{ fontSize: 10.5, color: T.textMute, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</span>
        <span style={{ fontSize: 13.5, fontWeight: 560, color: T.text }}>{value}</span>
    </div>
);

// ── Main ─────────────────────────────────────────────
const LookupPortalPage = () => {
    const navigate = useNavigate();
    const [query, setQuery] = useState("");
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState<any[]>([]);
    const [selectedDoc, setSelectedDoc] = useState<any | null>(null);
    const [selectedIndex, setSelectedIndex] = useState(-1);
    const [filterOpen, setFilterOpen] = useState(false);
    const [filterCategory, setFilterCategory] = useState<number | undefined>();
    const [filterValidity, setFilterValidity] = useState<ValidityFilter>("all");
    const [filterYear, setFilterYear] = useState<number | undefined>();
    const [filterMonth, setFilterMonth] = useState<number | undefined>();

    const inputRef = useRef<any>(null);
    const { data: categories = [] } = useAccountingDocumentCategoryActiveQuery();

    const activeFilterCount = [filterCategory, filterValidity !== "all", filterYear, filterMonth].filter(Boolean).length;

    // ── Fetch ──────────────────────────────────────────
    useEffect(() => {
        const run = async () => {
            setLoading(true);
            try {
                let qs = `current=1&pageSize=50`;
                if (query.trim()) qs += `&keyword=${encodeURIComponent(query.trim())}`;
                if (filterValidity !== "all") {
                    qs += `&validity=${filterValidity === "effective" ? "EFFECTIVE" : "CANCELLED"}`;
                }
                if (filterCategory) qs += `&accountingCategory.id=${filterCategory}`;
                if (filterYear) {
                    const s = (filterMonth
                        ? dayjs(`${filterYear}-${String(filterMonth).padStart(2, "0")}-01`).startOf("month")
                        : dayjs(`${filterYear}-01-01`).startOf("year")).toISOString();
                    const e = (filterMonth
                        ? dayjs(`${filterYear}-${String(filterMonth).padStart(2, "0")}-01`).endOf("month")
                        : dayjs(`${filterYear}-12-31`).endOf("year")).toISOString();
                    qs += `&issuedDate>=${s}&issuedDate<=${e}`;
                }
                const res = await callFetchAccountingDocuments(qs);
                const data: any[] = res?.data?.result || (Array.isArray(res?.data) ? res.data : []);

                setResults(data);
                if (data.length > 0) { setSelectedIndex(0); setSelectedDoc(data[0]); }
                else { setSelectedIndex(-1); setSelectedDoc(null); }
            } catch (e) { console.error(e); }
            finally { setLoading(false); }
        };
        const t = setTimeout(run, 280);
        return () => clearTimeout(t);
    }, [query, filterCategory, filterValidity, filterYear, filterMonth]);

    // ── Keyboard ───────────────────────────────────────
    useEffect(() => {
        const h = (e: KeyboardEvent) => {
            if (!results.length) return;
            if (e.key === "ArrowDown") {
                e.preventDefault();
                setSelectedIndex(p => { const n = Math.min(p + 1, results.length - 1); setSelectedDoc(results[n]); return n; });
            } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setSelectedIndex(p => { const n = Math.max(p - 1, 0); setSelectedDoc(results[n]); return n; });
            }
        };
        window.addEventListener("keydown", h);
        return () => window.removeEventListener("keydown", h);
    }, [results]);

    useEffect(() => { setTimeout(() => inputRef.current?.focus(), 80); }, []);

    const resetFilters = () => {
        setFilterCategory(undefined);
        setFilterValidity("all");
        setFilterYear(undefined);
        setFilterMonth(undefined);
    };

    const getExt = (url: string) => url.split(".").pop()?.toLowerCase() ?? "";
    const isImage = (url: string) => ["jpg", "jpeg", "png", "gif", "webp"].includes(getExt(url));
    const isPdf = (url: string) => getExt(url) === "pdf";
    const fileUrl = selectedDoc?.fileUrls?.[0] ?? null;
    const absoluteFileUrl = buildDocumentFileUrl(fileUrl);

    useEffect(() => {
        if (fileUrl && isPdf(fileUrl)) void loadInlinePdfViewer();
    }, [fileUrl]);

    const handleOpenFile = () => {
        if (absoluteFileUrl) window.open(absoluteFileUrl, "_blank", "noopener,noreferrer");
    };

    const handleDownload = async () => {
        if (!absoluteFileUrl) return;
        try {
            await downloadUrlAsBlob(
                absoluteFileUrl,
                fileUrl?.split("/").pop() || getFileNameFromUrl(absoluteFileUrl, selectedDoc?.documentCode || "chung-tu")
            );
        } catch (error) {
            console.error("Download failed", error);
            handleOpenFile();
        }
    };

    return (
        <div style={{ display: "flex", width: "100vw", height: "100vh", overflow: "hidden", background: T.white, fontFamily: T.sans }}>
            <style>{`
                * { box-sizing: border-box; }
                @keyframes slideIn {
                    from { opacity: 0; transform: translateY(-6px); }
                    to   { opacity: 1; transform: translateY(0); }
                }
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to   { opacity: 1; }
                }
                .doc-item { transition: all 0.15s; }
                .doc-item:hover { background: ${T.hover}; }
                .doc-item.sel { background: #f0f9ff !important; border-color: #bae6fd !important; box-shadow: 0 2px 6px rgba(14,165,233,0.06); }
                .filter-row { display: flex; flex-direction: column; gap: 6px; }
                .filter-row label { font-size: 11px; font-weight: 600; color: ${T.textMute}; text-transform: uppercase; letter-spacing: 0.06em; }
                .action-btn {
                    display: flex; align-items: center; justify-content: center;
                    width: 34px; height: 34px; border-radius: 8px;
                    border: 1px solid ${T.border}; background: ${T.white};
                    cursor: pointer; color: ${T.textSub};
                    transition: all 0.15s;
                }
                .action-btn:hover { background: ${T.hover}; border-color: ${T.borderFocus}; color: ${T.text}; }
                input:focus { outline: none; }
            `}</style>

            {/* ══ LEFT PANEL ═══════════════════════════════ */}
            <div style={{
                width: 360,
                flexShrink: 0,
                height: "100%",
                background: T.white,
                borderRight: `1px solid ${T.border}`,
                display: "flex",
                flexDirection: "column",
            }}>
                {/* Header */}
                <div style={{ padding: "18px 16px 0" }}>
                    <button
                        onClick={() => navigate(PATHS.ADMIN.ROOT)}
                        style={{
                            display: "flex", alignItems: "center", gap: 6,
                            background: "none", border: "none", cursor: "pointer",
                            color: T.textSub, fontSize: 12.5, padding: "0 0 12px", fontFamily: T.sans,
                        }}
                    >
                        <ArrowLeftOutlined style={{ fontSize: 11 }} />
                        Trở về Admin
                    </button>

                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                        <div>
                            <div style={{ fontSize: 15, fontWeight: 650, color: T.text, letterSpacing: "-0.2px" }}>
                                Tra Cứu Chứng Từ
                            </div>
                            <div style={{ fontSize: 12, color: T.textMute, marginTop: 1 }}>
                                {loading ? "Đang tải..." : `${results.length} chứng từ`}
                            </div>
                        </div>
                        <Badge count={activeFilterCount} size="small" color="#94a3b8" offset={[-2, 2]}>
                            <button
                                onClick={() => setFilterOpen(o => !o)}
                                style={{
                                    display: "flex", alignItems: "center", gap: 5,
                                    padding: "6px 10px", borderRadius: 7,
                                    border: `1px solid ${filterOpen ? "#94a3b8" : T.border}`,
                                    background: filterOpen ? T.accentSoft : T.white,
                                    color: filterOpen ? T.text : T.textSub,
                                    cursor: "pointer", fontSize: 12.5, fontWeight: 500,
                                    fontFamily: T.sans, transition: "all 0.15s",
                                }}
                            >
                                <SlidersOutlined style={{ fontSize: 12 }} />
                                Lọc
                            </button>
                        </Badge>
                    </div>

                    <div style={{
                        fontSize: 10.5,
                        color: T.textMute,
                        fontWeight: 700,
                        letterSpacing: "0.08em",
                        textTransform: "uppercase",
                        margin: "0 0 6px 2px",
                    }}>
                        Tra cứu nhanh
                    </div>

                    {/* Search */}
                    <div style={{
                        display: "flex", alignItems: "center", gap: 10,
                        border: "1px solid #e5e5ea", borderRadius: 10,
                        padding: "0 14px", background: T.white,
                        transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
                        marginBottom: 16,
                        minHeight: 52,
                        boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
                    }}
                        onFocus={e => {
                            e.currentTarget.style.borderColor = "#111827"; // stark black focus
                            e.currentTarget.style.boxShadow = "0 0 0 1px #111827, 0 4px 14px rgba(0,0,0,0.05)";
                        }}
                        onBlur={e => {
                            e.currentTarget.style.borderColor = "#e5e5ea";
                            e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.02)";
                        }}
                    >
                        <span style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                        }}>
                            <SearchOutlined style={{ color: "#a1a1aa", fontSize: 18, transition: "color 0.2s" }} />
                        </span>
                        <input
                            ref={inputRef}
                            placeholder="Tìm số CT, nội dung, phòng ban..."
                            value={query}
                            onChange={e => setQuery(e.target.value)}
                            style={{
                                flex: 1, border: "none", background: "transparent",
                                padding: "14px 0", fontSize: 15, fontFamily: T.sans,
                                color: "#111827",
                                fontWeight: 500,
                                minWidth: 0,
                                outline: "none",
                            }}
                            onFocus={e => {
                                const icon = e.currentTarget.previousElementSibling?.querySelector('span');
                                if (icon) icon.style.color = "#111827";
                            }}
                            onBlur={e => {
                                const icon = e.currentTarget.previousElementSibling?.querySelector('span');
                                if (icon) icon.style.color = "#a1a1aa";
                            }}
                        />
                        {loading && <Spin size="small" />}
                        {query && !loading && (
                            <button onClick={() => setQuery("")} style={{ background: "none", border: "none", cursor: "pointer", color: "#a1a1aa", padding: 0, display: "flex", transition: "color 0.2s" }}
                                onMouseEnter={e => e.currentTarget.style.color = "#111827"}
                                onMouseLeave={e => e.currentTarget.style.color = "#a1a1aa"}
                            >
                                <CloseOutlined style={{ fontSize: 14 }} />
                            </button>
                        )}
                    </div>

                    {/* ── Filter Panel ──────────────────────── */}
                    {filterOpen && (
                        <div style={{
                            border: `1px solid ${T.border}`, borderRadius: 10,
                            padding: "14px 14px 12px",
                            marginBottom: 10, background: T.bg,
                            animation: "slideIn 0.15s ease",
                            display: "flex", flexDirection: "column", gap: 12,
                        }}>
                            <div className="filter-row">
                                <label>Loại chứng từ</label>
                                <Select
                                    allowClear showSearch optionFilterProp="label"
                                    size="small" style={{ width: "100%" }}
                                    value={filterCategory}
                                    onChange={v => setFilterCategory(v)}
                                    placeholder="Tất cả"
                                    options={(categories as any[]).map(c => ({ label: c.categoryName, value: c.id }))}
                                />
                            </div>
                            <div className="filter-row">
                                <label>Kỳ chứng từ</label>
                                <div style={{ display: "flex", gap: 6 }}>
                                    <Select allowClear size="small" style={{ flex: 1 }}
                                        value={filterYear} onChange={v => { setFilterYear(v); if (!v) setFilterMonth(undefined); }}
                                        placeholder="Năm" options={YEAR_OPTIONS}
                                        suffixIcon={<CalendarOutlined style={{ fontSize: 11 }} />}
                                    />
                                    <Select allowClear disabled={!filterYear} size="small" style={{ flex: 1 }}
                                        value={filterMonth} onChange={v => setFilterMonth(v)}
                                        placeholder="Tháng" options={MONTH_OPTIONS}
                                    />
                                </div>
                            </div>
                            <div className="filter-row">
                                <label>Hiệu lực</label>
                                <div style={{ display: "flex", gap: 6 }}>
                                    {(["all", "effective", "cancelled"] as const).map(s => (
                                        <button key={s} onClick={() => setFilterValidity(s)} style={{
                                            flex: 1, padding: "5px 0", borderRadius: 6, fontSize: 12, cursor: "pointer",
                                            border: `1px solid ${filterValidity === s ? "#94a3b8" : T.border}`,
                                            background: filterValidity === s ? T.accentSoft : T.white,
                                            color: filterValidity === s ? T.text : T.textSub,
                                            fontFamily: T.sans, fontWeight: filterValidity === s ? 600 : 400,
                                            transition: "all 0.12s",
                                        }}>
                                            {VALIDITY_LABELS[s]}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            {activeFilterCount > 0 && (
                                <button onClick={resetFilters} style={{
                                    background: "none", border: "none", cursor: "pointer",
                                    fontSize: 12, color: T.textSub, padding: 0, fontFamily: T.sans,
                                    display: "flex", alignItems: "center", gap: 5, alignSelf: "flex-start",
                                }}>
                                    <FilterOutlined style={{ fontSize: 11 }} />
                                    Xóa bộ lọc
                                </button>
                            )}
                        </div>
                    )}
                </div>

                {/* Divider */}
                <div style={{ height: 1, background: T.border, margin: "4px 0 0" }} />

                {/* ── List ─────────────────────────────────── */}
                <div style={{ flex: 1, overflowY: "auto", padding: "8px 8px 24px" }}>
                    {results.length > 0 ? results.map((item, idx) => {
                        const isSel = selectedIndex === idx;
                        return (
                            <div
                                key={item.id}
                                className={`doc-item${isSel ? " sel" : ""}`}
                                onClick={() => { setSelectedIndex(idx); setSelectedDoc(item); }}
                                style={{
                                    borderRadius: 8, padding: "10px 12px",
                                    cursor: "pointer", marginBottom: 2,
                                    border: `1px solid ${isSel ? T.selectedBorder : "transparent"}`,
                                    position: "relative", overflow: "hidden",
                                    background: isSel ? T.selected : "transparent",
                                }}
                            >
                                {isSel && (
                                    <div style={{
                                        position: "absolute", left: 0, top: 0, bottom: 0,
                                        width: 4, background: "#0ea5e9",
                                    }} />
                                )}
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4, paddingLeft: isSel ? 6 : 0 }}>
                                    <span style={{
                                        fontFamily: T.codeFont, fontSize: 12.5, fontWeight: 650,
                                        color: T.text, letterSpacing: "0.02em",
                                    }}>
                                        {item.documentCode}
                                    </span>
                                    <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: item.active ? T.statusNeutral : T.textMute }}>
                                        {item.active
                                            ? <CheckCircleFilled style={{ fontSize: 10 }} />
                                            : <MinusCircleFilled style={{ fontSize: 10 }} />}
                                        {getValidityLabel(item.active)}
                                    </span>
                                </div>
                                <div style={{
                                    paddingLeft: isSel ? 6 : 0,
                                    fontSize: 12.5, color: T.textSub,
                                    display: "-webkit-box", WebkitLineClamp: 2,
                                    WebkitBoxOrient: "vertical", overflow: "hidden",
                                    lineHeight: 1.45, marginBottom: 6,
                                }}>
                                    {item.documentName || "Không có tiêu đề"}
                                </div>
                                <div style={{ paddingLeft: isSel ? 6 : 0, display: "flex", justifyContent: "space-between", fontSize: 11.5, color: T.textMute }}>
                                    <span style={{ display: "flex", alignItems: "center", gap: 3 }}>
                                        <CalendarOutlined style={{ fontSize: 10 }} />
                                        {item.issuedDate ? dayjs(item.issuedDate).format("DD/MM/YYYY") : "—"}
                                    </span>
                                    <span style={{ maxWidth: 110, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                        {item.accountingCategory?.categoryName || item.department?.name || ""}
                                    </span>
                                </div>
                            </div>
                        );
                    }) : (
                        <div style={{ padding: "60px 16px", textAlign: "center" }}>
                            {loading ? <Spin /> : (
                                <Empty
                                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                                    description={
                                        <span style={{ fontSize: 13, color: T.textMute }}>
                                            {query || activeFilterCount ? "Không tìm thấy kết quả" : "Nhập từ khóa để tìm kiếm"}
                                        </span>
                                    }
                                />
                            )}
                        </div>
                    )}
                </div>

                {/* Footer hint */}
                <div style={{ padding: "10px 16px", borderTop: `1px solid ${T.border}`, display: "flex", gap: 12, alignItems: "center" }}>
                    <span style={{ fontSize: 11, color: T.textMute }}>Di chuyển</span>
                    <Kbd>↑</Kbd> <Kbd>↓</Kbd>
                </div>
            </div>

            {/* ══ RIGHT PANEL ══════════════════════════════ */}
            <div style={{ flex: 1, display: "flex", flexDirection: "column", background: T.bg, overflow: "hidden", minWidth: 0 }}>
                {selectedDoc ? (
                    <div style={{ display: "flex", flexDirection: "column", height: "100%", animation: "fadeIn 0.2s ease" }}>

                        {/* ── Top Bar ── */}
                        <div style={{
                            background: T.white,
                            borderBottom: `1px solid ${T.border}`,
                            padding: "16px 28px",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "flex-start",
                            flexShrink: 0,
                        }}>
                            <div style={{ flex: 1, minWidth: 0 }}>
                                {/* Code + status row */}
                                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                                    <span style={{
                                        fontFamily: T.codeFont, fontSize: 12.5, fontWeight: 650,
                                        color: T.text, background: T.accentSoft,
                                        padding: "3px 9px", borderRadius: 6,
                                        border: `1px solid ${T.accentBorder}`,
                                        letterSpacing: "0.02em",
                                    }}>
                                        {selectedDoc.documentCode}
                                    </span>
                                    <Tag style={{ borderRadius: 5, fontSize: 11, margin: 0, fontWeight: 600, color: selectedDoc.active ? "#059669" : "#dc2626", borderColor: selectedDoc.active ? "#a7f3d0" : "#fecaca", background: selectedDoc.active ? "#ecfdf5" : "#fef2f2" }}>
                                        {getValidityLabel(selectedDoc.active)}
                                    </Tag>
                                    {selectedDoc.status && (() => {
                                        const sc = getStatusColor(selectedDoc.status);
                                        return (
                                            <Tag style={{ borderRadius: 5, fontSize: 11, margin: 0, fontWeight: 600, color: sc.color, borderColor: sc.border, background: sc.bg }}>
                                                {isWorkflowStatus(selectedDoc.status)
                                                    ? getWorkflowStatusLabel(selectedDoc.status)
                                                    : getDocumentStatusLabel(selectedDoc.status)}
                                            </Tag>
                                        );
                                    })()}
                                </div>

                                {/* Title */}
                                <div style={{ fontSize: 18, fontWeight: 650, color: T.text, letterSpacing: "-0.2px", lineHeight: 1.3, marginBottom: 14 }}>
                                    {selectedDoc.documentName}
                                </div>

                                {/* Meta row */}
                                <div style={{ display: "flex", gap: 32, flexWrap: "wrap" }}>
                                    <MetaChip label="Ngày chứng từ" value={selectedDoc.issuedDate ? dayjs(selectedDoc.issuedDate).format("DD/MM/YYYY") : "—"} />
                                    <MetaChip label="Loại chứng từ" value={selectedDoc.accountingCategory?.categoryName || "—"} />
                                    <MetaChip label="Hiệu lực" value={getValidityLabel(selectedDoc.active)} />
                                    {selectedDoc.status && (
                                        <MetaChip
                                            label={isWorkflowStatus(selectedDoc.status) ? "Trạng thái duyệt" : "Trạng thái hồ sơ"}
                                            value={isWorkflowStatus(selectedDoc.status)
                                                ? getWorkflowStatusLabel(selectedDoc.status)
                                                : getDocumentStatusLabel(selectedDoc.status)}
                                        />
                                    )}
                                    {selectedDoc.department?.name && <MetaChip label="Phòng ban" value={selectedDoc.department.name} />}
                                    {selectedDoc.department?.companyName && <MetaChip label="Công ty" value={selectedDoc.department.companyName} />}
                                    <MetaChip label="Tệp đính kèm" value={`${selectedDoc.fileUrls?.length || 0} file`} />
                                </div>
                            </div>

                            {/* Actions */}
                            <div style={{ display: "flex", gap: 8, flexShrink: 0, marginLeft: 24, alignItems: "center" }}>
                                <Tooltip title={absoluteFileUrl ? "Mở file để in" : "Chưa có file để in"}>
                                    <button className="action-btn" onClick={handleOpenFile} disabled={!absoluteFileUrl} style={{ opacity: absoluteFileUrl ? 1 : 0.45, cursor: absoluteFileUrl ? "pointer" : "not-allowed" }}>
                                        <PrinterOutlined style={{ fontSize: 15 }} />
                                    </button>
                                </Tooltip>
                                <Tooltip title={absoluteFileUrl ? "Tải xuống" : "Chưa có file để tải"}>
                                    <button className="action-btn" onClick={handleDownload} disabled={!absoluteFileUrl} style={{ opacity: absoluteFileUrl ? 1 : 0.45, cursor: absoluteFileUrl ? "pointer" : "not-allowed" }}>
                                        <DownloadOutlined style={{ fontSize: 15 }} />
                                    </button>
                                </Tooltip>
                                <button style={{
                                    padding: "8px 18px", borderRadius: 8,
                                    background: "#0ea5e9", border: "1px solid #0284c7",
                                    color: "#ffffff", fontWeight: 600, fontSize: 13.5,
                                    cursor: "pointer", fontFamily: T.sans,
                                    transition: "all 0.15s",
                                    boxShadow: "0 1px 2px rgba(14, 165, 233, 0.2)",
                                }}
                                    onClick={() => navigate(`${PATHS.ADMIN.ACCOUNTING_DOCUMENTS}?search=${selectedDoc.documentCode}`)}
                                    onMouseEnter={e => { e.currentTarget.style.background = "#0284c7"; }}
                                    onMouseLeave={e => { e.currentTarget.style.background = "#0ea5e9"; }}
                                >
                                    Chi tiết
                                </button>
                            </div>
                        </div>

                        {/* ── Preview Area ── */}
                        <div style={{ flex: 1, overflow: "auto", padding: "20px 28px 28px" }}>
                            <div style={{
                                height: "100%",
                                background: T.white,
                                borderRadius: 10,
                                border: `1px solid ${T.border}`,
                                overflow: "hidden",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                minHeight: 320,
                            }}>
                                {fileUrl ? (
                                    isImage(fileUrl) ? (
                                        <img
                                            src={absoluteFileUrl || ""}
                                            alt="Preview"
                                            style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }}
                                        />
                                    ) : isPdf(fileUrl) ? (
                                        <Suspense fallback={
                                            <div style={{ width: "100%", height: "100%", minHeight: 560, padding: 24, boxSizing: "border-box" }}>
                                                <Skeleton active paragraph={{ rows: 8 }} />
                                            </div>
                                        }>
                                            <InlinePdfViewer fileUrl={absoluteFileUrl || ""} onOpen={handleOpenFile} onDownload={handleDownload} />
                                        </Suspense>
                                    ) : (
                                        <div style={{ textAlign: "center", padding: 40 }}>
                                            <FileTextOutlined style={{ fontSize: 40, color: T.textMute, marginBottom: 12 }} />
                                            <div style={{ fontSize: 14, color: T.textSub, marginBottom: 16 }}>Định dạng này chưa hỗ trợ xem trước</div>
                                            <button onClick={handleDownload} style={{
                                                padding: "8px 16px", borderRadius: 7,
                                                border: `1px solid ${T.border}`, background: T.white,
                                                cursor: "pointer", fontSize: 13, color: T.text, fontFamily: T.sans,
                                                display: "flex", alignItems: "center", gap: 6,
                                            }}>
                                                <DownloadOutlined /> Tải về để xem
                                            </button>
                                        </div>
                                    )
                                ) : (
                                    <div style={{ textAlign: "center", padding: 48 }}>
                                        <InboxOutlined style={{ fontSize: 44, color: T.textMute, display: "block", marginBottom: 12 }} />
                                        <div style={{ fontSize: 14, fontWeight: 560, color: T.textSub, marginBottom: 6 }}>
                                            Chưa có tệp đính kèm
                                        </div>
                                        <div style={{ fontSize: 13, color: T.textMute }}>
                                            Chứng từ <span style={{ fontFamily: T.codeFont, color: T.text }}>{selectedDoc.documentCode}</span> chưa đính kèm file gốc
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ) : (
                    // Empty state — no document selected
                    <div style={{
                        flex: 1, display: "flex", flexDirection: "column",
                        alignItems: "center", justifyContent: "center",
                        gap: 12, padding: 40, animation: "fadeIn 0.3s ease",
                    }}>
                        <div style={{
                            width: 56, height: 56, borderRadius: 14,
                            background: T.accentSoft, border: `1px solid ${T.accentBorder}`,
                            display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 4,
                        }}>
                            <SearchOutlined style={{ fontSize: 24, color: "#64748b" }} />
                        </div>
                        <div style={{ fontSize: 16, fontWeight: 650, color: T.text, letterSpacing: "-0.1px" }}>
                            Cổng Tra Cứu Chứng Từ Kế Toán
                        </div>
                        <div style={{ fontSize: 13.5, color: T.textSub, maxWidth: 320, textAlign: "center", lineHeight: 1.55 }}>
                            Chọn một chứng từ từ danh sách bên trái, hoặc nhập từ khóa để tìm kiếm
                        </div>
                        <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                            <Kbd>↑</Kbd><Kbd>↓</Kbd>
                            <span style={{ fontSize: 12, color: T.textMute, alignSelf: "center" }}>để điều hướng</span>
                        </div>
                    </div>
                )}
            </div>

            {/* ── Lotus Charm ── */}
            <LotusCharmAssistant />
        </div>
    );
};

export default LookupPortalPage;
