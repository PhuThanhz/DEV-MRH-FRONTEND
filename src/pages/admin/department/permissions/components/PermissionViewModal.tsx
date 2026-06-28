import { useEffect, useState, useMemo } from "react";
import { Input, Spin, Tooltip } from "antd";
import { SearchOutlined } from "@ant-design/icons";
import {
    callFetchPermissionCategoriesByDepartment,
    callFetchPermissionMatrixByCategory,
    callFetchProcessActions,
} from "@/config/api";

import type {
    IPermissionCategory,
    IPermissionCategoryMatrix,
    IProcessAction,
} from "@/types/backend";

const ACCENT = "#e8637a";
const HOVER_BG = "#f5f5f5";
const HOVER_TEXT = "#1a1a1a";
const STYLE_PINK = { bg: "#ffffff", border: "#ffd6d9", color: "#e8637a" };

const PALETTE = [
    { bg: "transparent", border: "#fecdd3", color: "#e8637a" } // Elegant Ghost Style
];

const getPalette = () => PALETTE[0];

const baseThStyle: React.CSSProperties = {
    padding: "10px 14px",
    background: "#ffffff",
    borderBottom: "2px solid #f0f0f0",
    fontWeight: 600,
    fontSize: 13,
    whiteSpace: "nowrap",
    textAlign: "left",
    position: "sticky",
    top: 0,
    zIndex: 2,
};

const baseTdStyle: React.CSSProperties = {
    padding: "10px 14px",
    borderBottom: "1px solid #f0f0f0",
    fontSize: 13,
    verticalAlign: "middle",
};

interface Props {
    departmentId: number;
    departmentName: string;
}

const PermissionViewModal = ({ departmentId, departmentName }: Props) => {
    const [categories, setCategories] = useState<IPermissionCategory[]>([]);
    const [selectedId, setSelectedId] = useState<number | null>(null);
    const [matrix, setMatrix] = useState<IPermissionCategoryMatrix | null>(null);
    const [processActions, setProcessActions] = useState<IProcessAction[]>([]);

    const [loadingCat, setLoadingCat] = useState(false);
    const [loadingMatrix, setLoadingMatrix] = useState(false);
    const [loadingActions, setLoadingActions] = useState(false);

    const [errorCat, setErrorCat] = useState<string | null>(null);
    const [errorMatrix, setErrorMatrix] = useState<string | null>(null);

    const [legendOpen, setLegendOpen] = useState(false);

    // ── Detect mobile ──────────────────────────────────────────────────────────
    const [isMobile, setIsMobile] = useState(() => window.innerWidth < 640);
    useEffect(() => {
        const handler = () => setIsMobile(window.innerWidth < 640);
        window.addEventListener("resize", handler);
        return () => window.removeEventListener("resize", handler);
    }, []);

    // ── Hover column highlight ─────────────────────────────────────────────────
    const [hoveredColId, setHoveredColId] = useState<number | null>(null);

    // ── Search filter theo tên chức danh (column) ──────────────────────────────
    const [searchText, setSearchText] = useState("");

    // ── Lọc columns theo searchText ────────────────────────────────────────────
    const filteredColumns = useMemo(() => {
        if (!matrix) return [];
        if (!searchText.trim()) return matrix.columns;
        return matrix.columns.filter((col) =>
            col.jobTitleName?.toLowerCase().includes(searchText.toLowerCase())
        );
    }, [matrix, searchText]);

    const actionMap = useMemo(() => {
        const map: Record<string, { style: (typeof PALETTE)[0]; action: IProcessAction }> = {};
        processActions.forEach((a) => {
            if (a.code) map[a.code] = { style: PALETTE[0], action: a };
        });
        return map;
    }, [processActions]);

    useEffect(() => {
        setLoadingActions(true);
        callFetchProcessActions("page=1&size=100")
            .then((res: any) => {
                const list = res?.data?.result ?? [];
                setProcessActions(Array.isArray(list) ? list : []);
            })
            .catch(() => setProcessActions([]))
            .finally(() => setLoadingActions(false));
    }, []);

    useEffect(() => {
        if (!departmentId || isNaN(departmentId)) return;
        setLoadingCat(true);
        setErrorCat(null);
        setCategories([]);
        setSelectedId(null);
        setMatrix(null);
        setSearchText("");

        callFetchPermissionCategoriesByDepartment(departmentId)
            .then((res: any) => {
                const list: IPermissionCategory[] = res?.data ?? [];
                const safe = Array.isArray(list) ? list : [];
                setCategories(safe);
                if (safe.length > 0 && safe[0].id != null) setSelectedId(safe[0].id!);
            })
            .catch(() => {
                setCategories([]);
                setErrorCat("Không thể tải danh mục phân quyền.");
            })
            .finally(() => setLoadingCat(false));
    }, [departmentId]);

    useEffect(() => {
        if (selectedId == null) return;
        setLoadingMatrix(true);
        setErrorMatrix(null);
        setMatrix(null);
        setSearchText(""); // reset search khi đổi category

        callFetchPermissionMatrixByCategory(selectedId)
            .then((res: any) => {
                const data: IPermissionCategoryMatrix | null = res?.data ?? null;
                if (!data || !Array.isArray(data.rows) || !Array.isArray(data.columns)) {
                    setMatrix(null);
                    return;
                }
                setMatrix(data);
            })
            .catch(() => {
                setMatrix(null);
                setErrorMatrix("Không thể tải ma trận phân quyền.");
            })
            .finally(() => setLoadingMatrix(false));
    }, [selectedId]);

    // ── Badge với Tooltip hiện tên + mô tả ────────────────────────────────────
    const renderBadge = (code: string | null) => {
        if (!code) return <span style={{ color: "#e2e8f0", fontSize: 16 }}>—</span>;

        const entry = actionMap[code];
        const action = entry?.action;
        const style = entry?.style || STYLE_PINK;

        const badge = (
            <span style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "3px 8px",
                borderRadius: 4,
                background: style.bg,
                border: `1px solid ${style.border}`,
                color: style.color,
                fontWeight: 600,
                fontSize: 12,
                fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
                letterSpacing: 0.5,
                cursor: action ? "help" : "default",
            }}>
                {code}
            </span>
        );

        if (!action) return badge;

        return (
            <Tooltip
                title={
                    <div style={{ fontSize: 12, lineHeight: 1.6 }}>
                        <div style={{ fontWeight: 700, marginBottom: 2 }}>
                            {action.name ?? code}
                        </div>
                        {action.shortDescription && (
                            <div style={{ opacity: 0.85 }}>{action.shortDescription}</div>
                        )}
                    </div>
                }
                placement="top"
                mouseEnterDelay={0.15}
            >
                {badge}
            </Tooltip>
        );
    };

    const renderLegend = () => {
        if (processActions.length === 0) return null;
        return (
            <div style={{
                marginBottom: 24,
                borderRadius: 8,
                background: "#ffffff",
                border: "1px solid #e2e8f0",
                boxShadow: "0 1px 2px rgba(0,0,0,0.02)",
            }}>
                <button
                    onClick={() => setLegendOpen((v) => !v)}
                    style={{
                        width: "100%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "12px 18px",
                        background: "#f8fafc",
                        border: "none",
                        borderBottom: legendOpen ? "1px solid #e2e8f0" : "none",
                        borderRadius: legendOpen ? "8px 8px 0 0" : "8px",
                        cursor: "pointer",
                        outline: "none",
                        transition: "background 0.15s",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "#f1f5f9")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "#f8fafc")}
                >
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: "#334155" }}>
                            Chú giải phân quyền
                        </span>
                        <span style={{ fontSize: 12, color: "#94a3b8", fontWeight: 400 }}>
                            (Click để {legendOpen ? "thu gọn" : "xem chi tiết"})
                        </span>
                    </div>
                    <span style={{
                        transform: legendOpen ? "rotate(180deg)" : "rotate(0deg)",
                        transition: "transform 0.2s",
                        fontSize: 10,
                        color: "#94a3b8",
                    }}>
                        ▼
                    </span>
                </button>

                {legendOpen && (
                    <div style={{
                        padding: "20px 24px",
                        background: "#ffffff",
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                        gap: "20px 32px",
                        borderRadius: "0 0 8px 8px",
                    }}>
                        {processActions.map((a) => (
                            <div key={a.code} style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                                <span style={{
                                    flexShrink: 0,
                                    display: "inline-flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    width: 40,
                                    padding: "4px 0",
                                    borderRadius: 6,
                                    background: actionMap[a.code]?.style.bg || "transparent",
                                    border: `1px solid ${actionMap[a.code]?.style.border || "#fecdd3"}`,
                                    color: actionMap[a.code]?.style.color || "#e8637a",
                                    fontWeight: 700,
                                    fontSize: 11,
                                    fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
                                }}>
                                    {a.code}
                                </span>
                                <div>
                                    <div style={{ fontWeight: 600, fontSize: 13, color: "#0f172a", lineHeight: 1.3 }}>
                                        {a.name ?? a.code}
                                    </div>
                                    {a.shortDescription && (
                                        <div style={{ fontSize: 12, color: "#64748b", marginTop: 4, lineHeight: 1.5 }}>
                                            {a.shortDescription}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        );
    };

    const renderTable = () => {
        if (loadingMatrix || loadingActions) {
            return <div style={{ textAlign: "center", padding: 56 }}><Spin size="large" /></div>;
        }
        if (errorMatrix) {
            return <div style={{ color: "#ff4d4f", padding: "12px 0" }}>{errorMatrix}</div>;
        }
        if (!matrix) return null;
        if (matrix.rows.length === 0) {
            return <div style={{ color: "#888", padding: "16px 0" }}>Danh mục này chưa có nội dung phân quyền.</div>;
        }

        // Không có cột nào khớp search
        if (filteredColumns.length === 0) {
            return (
                <div style={{
                    textAlign: "center",
                    padding: "32px 0",
                    color: "#bbb",
                    fontStyle: "italic",
                    fontSize: 14,
                    border: "1px solid #f0f0f0",
                    borderRadius: 8,
                }}>
                    Không tìm thấy chức danh nào khớp với "<strong style={{ color: "#888" }}>{searchText}</strong>"
                </div>
            );
        }

        const COL1_W = isMobile ? 0 : 120;
        const COL2_W = isMobile ? 160 : 200;

        return (
            <div style={{
                overflowX: "auto",
                borderRadius: 8,
                border: "1px solid #f0f0f0",
                boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
                scrollbarWidth: "thin",
                scrollbarColor: "#e0e0e0 transparent",
                WebkitOverflowScrolling: "touch",
            }}>
                <table style={{
                    minWidth: COL1_W + COL2_W + filteredColumns.length * 110,
                    width: "100%",
                    borderCollapse: "collapse",
                    tableLayout: "auto",
                }}>
                    <thead>
                        <tr>
                            {/* Đã gỡ bỏ cột Danh mục vì nó trùng lặp với Tab Category đã chọn phía trên */}

                            <th style={{
                                ...baseThStyle,
                                position: "sticky",
                                left: 0,
                                zIndex: 4,
                                minWidth: COL2_W,
                                maxWidth: COL2_W,
                                width: COL2_W,
                                borderRight: "2px solid #e8e8e8",
                                background: "#ffffff",
                            }}>
                                Nội dung chi tiết
                            </th>

                            {/* Chỉ render các cột đã filter */}
                            {filteredColumns.map((col) => {
                                const isHovered = hoveredColId === col.departmentJobTitleId;
                                return (
                                    <th
                                        key={col.departmentJobTitleId}
                                        onMouseEnter={() => setHoveredColId(col.departmentJobTitleId)}
                                        onMouseLeave={() => setHoveredColId(null)}
                                        style={{
                                            ...baseThStyle,
                                            textAlign: "center",
                                            minWidth: 110,
                                            zIndex: 2,
                                            background: isHovered ? HOVER_BG : "#ffffff",
                                            color: isHovered ? HOVER_TEXT : "#1a1a1a",
                                            transition: "background 0.15s, color 0.15s",
                                            cursor: "default",
                                            borderBottom: isHovered
                                                ? `2px solid ${HOVER_TEXT}`
                                                : "2px solid #f0f0f0",
                                        }}
                                    >
                                        {col.jobTitleName}
                                    </th>
                                );
                            })}
                        </tr>
                    </thead>

                    <tbody>
                        {matrix.rows.map((row, rowIdx) => {
                            const cellMap = new Map(
                                row.cells.map((c) => [c.departmentJobTitleId, c.processActionCode])
                            );
                            const rowBg = rowIdx % 2 === 0 ? "#fff" : "#fafafa";

                            return (
                                <tr key={row.contentId}>
                                    {/* Đã gỡ bỏ cột Danh mục */}

                                    <td style={{
                                        ...baseTdStyle,
                                        position: "sticky",
                                        left: 0,
                                        zIndex: 1,
                                        background: rowBg,
                                        borderRight: "2px solid #e8e8e8",
                                        whiteSpace: "normal",
                                        minWidth: COL2_W,
                                        maxWidth: COL2_W,
                                        width: COL2_W,
                                        color: "#444",
                                        boxShadow: "2px 0 4px -2px rgba(0,0,0,0.06)",
                                    }}>
                                        {row.contentName}
                                    </td>

                                    {/* Chỉ render cell của các cột đã filter */}
                                    {filteredColumns.map((col) => {
                                        const isHovered = hoveredColId === col.departmentJobTitleId;
                                        return (
                                            <td
                                                key={col.departmentJobTitleId}
                                                onMouseEnter={() => setHoveredColId(col.departmentJobTitleId)}
                                                onMouseLeave={() => setHoveredColId(null)}
                                                style={{
                                                    ...baseTdStyle,
                                                    textAlign: "center",
                                                    background: isHovered ? HOVER_BG : rowBg,
                                                    transition: "background 0.15s",
                                                }}
                                            >
                                                {renderBadge(cellMap.get(col.departmentJobTitleId) ?? null)}
                                            </td>
                                        );
                                    })}
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        );
    };

    return (
        <div>
            {/* ── LEGEND ── */}
            {renderLegend()}

            {/* ── CATEGORY TABS ── */}
            {loadingCat ? (
                <div style={{ padding: 32, textAlign: "center" }}><Spin /></div>
            ) : errorCat ? (
                <div style={{ color: "#ff4d4f", padding: "8px 0" }}>{errorCat}</div>
            ) : categories.length === 0 ? (
                <div style={{ color: "#888", padding: "8px 0" }}>Phòng ban chưa có danh mục phân quyền.</div>
            ) : (
                <>
                    <div style={{
                        overflowX: "auto",
                        overflowY: "hidden",
                        WebkitOverflowScrolling: "touch",
                        scrollbarWidth: "none",
                        msOverflowStyle: "none",
                        marginBottom: 16,
                    }}>
                        <div style={{ display: "flex", gap: 8, width: "max-content", padding: "2px 0" }}>
                            {categories.map((cat) => {
                                const active = cat.id === selectedId;
                                return (
                                    <button
                                        key={cat.id}
                                        onClick={() => {
                                            cat.id != null && setSelectedId(cat.id);
                                            setSearchText("");
                                        }}
                                        style={{
                                            padding: "8px 16px",
                                            borderRadius: 6,
                                            border: active ? `1px solid ${ACCENT}` : "1px solid transparent",
                                            background: active ? "#fff1f4" : "transparent",
                                            color: active ? ACCENT : "#4b5563",
                                            fontWeight: active ? 600 : 500,
                                            cursor: "pointer",
                                            fontSize: 13,
                                            transition: "all 0.15s",
                                            whiteSpace: "nowrap",
                                            flexShrink: 0,
                                        }}
                                        onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = "#f3f4f6"; }}
                                        onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = "transparent"; }}
                                    >
                                        {cat.name}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* ── TABLE TITLE + SEARCH theo chức danh ── */}
                    <div style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        marginBottom: 12,
                        flexWrap: "wrap",
                    }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <div style={{ width: 4, height: 18, borderRadius: 2, background: ACCENT, flexShrink: 0 }} />
                            <span style={{ fontWeight: 700, fontSize: 14, color: "#1a1a1a" }}>
                                Bảng phân quyền chi tiết
                            </span>
                        </div>

                        {/* Search box — lọc theo tên chức danh (cột) */}
                        <Input
                            prefix={<SearchOutlined style={{ color: "#bbb", fontSize: 13 }} />}
                            placeholder="Tìm chức danh..."
                            allowClear
                            size="small"
                            value={searchText}
                            onChange={(e) => setSearchText(e.target.value)}
                            style={{
                                width: isMobile ? "100%" : 220,
                                marginLeft: isMobile ? 0 : "auto",
                                borderRadius: 6,
                                fontSize: 13,
                            }}
                        />

                        {/* Hiển thị số cột đang lọc nếu đang search */}
                        {searchText.trim() && matrix && (
                            <span style={{ fontSize: 12, color: "#888" }}>
                                Hiển thị {filteredColumns.length}/{matrix.columns.length} chức danh
                            </span>
                        )}

                        {isMobile && filteredColumns.length > 1 && (
                            <span style={{ fontSize: 11, color: "#aaa" }}>
                                ← vuốt để xem thêm →
                            </span>
                        )}
                    </div>

                    {renderTable()}
                </>
            )}
        </div>
    );
};

export default PermissionViewModal;