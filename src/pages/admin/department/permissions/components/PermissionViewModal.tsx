import { useEffect, useState, useMemo } from "react";
import { Spin } from "antd";
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

/* ─────────────────────────────────────────────
   CONSTANTS
───────────────────────────────────────────── */
const ACCENT = "#e8637a";

const PALETTE = [
    { bg: "#f6ffed", border: "#b7eb8f", color: "#389e0d" },
    { bg: "#e6f4ff", border: "#91caff", color: "#0958d9" },
    { bg: "#fff7e6", border: "#ffd591", color: "#d46b08" },
    { bg: "#fff0f6", border: "#ffadd2", color: "#c41d7f" },
    { bg: "#f9f0ff", border: "#d3adf7", color: "#531dab" },
    { bg: "#e6fffb", border: "#87e8de", color: "#08979c" },
    { bg: "#f5f5f5", border: "#d9d9d9", color: "#595959" },
];

const getPalette = (index: number) => PALETTE[index % PALETTE.length];

/* ─────────────────────────────────────────────
   TABLE BASE STYLES
───────────────────────────────────────────── */
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

/* ─────────────────────────────────────────────
   PROPS
───────────────────────────────────────────── */
interface Props {
    departmentId: number;
    departmentName: string;
}

/* ─────────────────────────────────────────────
   COMPONENT
───────────────────────────────────────────── */
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

    /* ── actionMap: code → { style, action } ── */
    const actionMap = useMemo(() => {
        const map: Record<string, { style: (typeof PALETTE)[0]; action: IProcessAction }> = {};
        processActions.forEach((a, i) => {
            if (a.code) map[a.code] = { style: getPalette(i), action: a };
        });
        return map;
    }, [processActions]);

    /* ── Load process actions (1 lần) ── */
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

    /* ── Load categories khi departmentId đổi ── */
    useEffect(() => {
        if (!departmentId || isNaN(departmentId)) return;

        setLoadingCat(true);
        setErrorCat(null);
        setCategories([]);
        setSelectedId(null);
        setMatrix(null);

        callFetchPermissionCategoriesByDepartment(departmentId)
            .then((res: any) => {
                const list: IPermissionCategory[] = res?.data ?? [];
                const safe = Array.isArray(list) ? list : [];
                setCategories(safe);
                if (safe.length > 0 && safe[0].id != null) {
                    setSelectedId(safe[0].id!);
                }
            })
            .catch(() => {
                setCategories([]);
                setErrorCat("Không thể tải danh mục phân quyền.");
            })
            .finally(() => setLoadingCat(false));
    }, [departmentId]);

    /* ── Load matrix khi selectedId đổi ── */
    useEffect(() => {
        if (selectedId == null) return;

        setLoadingMatrix(true);
        setErrorMatrix(null);
        setMatrix(null);

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

    /* ─────────────────────────────────────────────
       RENDER BADGE
    ───────────────────────────────────────────── */
    const renderBadge = (code: string | null) => {
        if (!code) return <span style={{ color: "#d9d9d9", fontSize: 16 }}>—</span>;

        const entry = actionMap[code];
        const style = entry?.style ?? { bg: "#f5f5f5", border: "#d9d9d9", color: "#595959" };

        return (
            <span
                style={{
                    display: "inline-block",
                    padding: "3px 10px",
                    borderRadius: 5,
                    background: style.bg,
                    border: `1px solid ${style.border}`,
                    color: style.color,
                    fontWeight: 700,
                    fontSize: 12,
                    letterSpacing: 0.4,
                }}
            >
                {code}
            </span>
        );
    };

    /* ─────────────────────────────────────────────
       RENDER LEGEND
    ───────────────────────────────────────────── */
    const renderLegend = () => {
        if (processActions.length === 0) return null;

        return (
            <div
                style={{
                    marginBottom: 20,
                    borderRadius: 8,
                    border: "1px solid #f0f0f0",
                    overflow: "hidden",
                }}
            >
                {/* Toggle header */}
                <button
                    onClick={() => setLegendOpen((v) => !v)}
                    style={{
                        width: "100%",
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        padding: "10px 16px",
                        background: "#fafafa",
                        border: "none",
                        borderBottom: legendOpen ? "1px solid #f0f0f0" : "none",
                        cursor: "pointer",
                        fontWeight: 600,
                        fontSize: 13,
                        color: "#555",
                        textAlign: "left",
                    }}
                >
                    <span
                        style={{
                            display: "inline-block",
                            transform: legendOpen ? "rotate(90deg)" : "rotate(0deg)",
                            transition: "transform 0.18s",
                            fontSize: 10,
                            color: "#999",
                        }}
                    >
                        ▶
                    </span>
                    Giải thích các mức quyền (click để xem)
                </button>

                {/* Content — grid cards */}
                {legendOpen && (
                    <div
                        style={{
                            padding: "16px 20px",
                            background: "#fff",
                            display: "grid",
                            gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
                            gap: "12px 20px",
                        }}
                    >
                        {processActions.map((a, i) => {
                            const s = getPalette(i);
                            return (
                                <div
                                    key={a.code}
                                    style={{
                                        display: "flex",
                                        alignItems: "flex-start",
                                        gap: 10,
                                        padding: "10px 14px",
                                        borderRadius: 8,
                                        background: s.bg,
                                        border: `1px solid ${s.border}`,
                                    }}
                                >
                                    {/* Badge */}
                                    <span
                                        style={{
                                            flexShrink: 0,
                                            display: "inline-block",
                                            padding: "2px 10px",
                                            borderRadius: 5,
                                            background: "#fff",
                                            border: `1.5px solid ${s.border}`,
                                            color: s.color,
                                            fontWeight: 800,
                                            fontSize: 12,
                                            letterSpacing: 0.5,
                                            marginTop: 1,
                                        }}
                                    >
                                        {a.code}
                                    </span>

                                    {/* Text */}
                                    <div>
                                        <div
                                            style={{
                                                fontWeight: 700,
                                                fontSize: 13,
                                                color: s.color,
                                                lineHeight: 1.3,
                                            }}
                                        >
                                            {a.name ?? a.code}
                                        </div>
                                        {a.shortDescription && (
                                            <div
                                                style={{
                                                    fontSize: 12,
                                                    color: "#666",
                                                    marginTop: 3,
                                                    lineHeight: 1.5,
                                                }}
                                            >
                                                {a.shortDescription}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        );
    };

    /* ─────────────────────────────────────────────
       RENDER MATRIX TABLE
    ───────────────────────────────────────────── */
    const renderTable = () => {
        if (loadingMatrix || loadingActions) {
            return (
                <div style={{ textAlign: "center", padding: 56 }}>
                    <Spin size="large" />
                </div>
            );
        }

        if (errorMatrix) {
            return (
                <div style={{ color: "#ff4d4f", padding: "12px 0" }}>
                    {errorMatrix}
                </div>
            );
        }

        if (!matrix) return null;

        if (matrix.rows.length === 0) {
            return (
                <div style={{ color: "#888", padding: "16px 0" }}>
                    Danh mục này chưa có nội dung phân quyền.
                </div>
            );
        }

        return (
            <div
                style={{
                    overflowX: "auto",
                    borderRadius: 8,
                    border: "1px solid #f0f0f0",
                    boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
                }}
            >
                <table
                    style={{
                        width: "100%",
                        borderCollapse: "collapse",
                        tableLayout: "auto",
                    }}
                >
                    <thead>
                        <tr>
                            <th
                                style={{
                                    ...baseThStyle,
                                    position: "sticky",
                                    left: 0,
                                    zIndex: 4,
                                    minWidth: 160,
                                    borderRight: "1px solid #f0f0f0",
                                }}
                            >
                                Danh mục
                            </th>
                            <th
                                style={{
                                    ...baseThStyle,
                                    position: "sticky",
                                    left: 160,
                                    zIndex: 4,
                                    minWidth: 260,
                                    borderRight: "2px solid #e8e8e8",
                                }}
                            >
                                Nội dung chi tiết
                            </th>
                            {matrix.columns.map((col) => (
                                <th
                                    key={col.departmentJobTitleId}
                                    style={{
                                        ...baseThStyle,
                                        textAlign: "center",
                                        minWidth: 110,
                                        zIndex: 2,
                                    }}
                                >
                                    {col.jobTitleName}
                                </th>
                            ))}
                        </tr>
                    </thead>

                    <tbody>
                        {matrix.rows.map((row, rowIdx) => {
                            const cellMap = new Map(
                                row.cells.map((c) => [
                                    c.departmentJobTitleId,
                                    c.processActionCode,
                                ])
                            );
                            const rowBg = rowIdx % 2 === 0 ? "#fff" : "#fafafa";

                            return (
                                <tr key={row.contentId}>
                                    <td
                                        style={{
                                            ...baseTdStyle,
                                            position: "sticky",
                                            left: 0,
                                            zIndex: 1,
                                            background: rowBg,
                                            fontWeight: 500,
                                            whiteSpace: "nowrap",
                                            borderRight: "1px solid #f0f0f0",
                                            color: "#333",
                                        }}
                                    >
                                        {matrix.categoryName}
                                    </td>
                                    <td
                                        style={{
                                            ...baseTdStyle,
                                            position: "sticky",
                                            left: 160,
                                            zIndex: 1,
                                            background: rowBg,
                                            borderRight: "2px solid #e8e8e8",
                                            whiteSpace: "normal",
                                            maxWidth: 280,
                                            color: "#444",
                                        }}
                                    >
                                        {row.contentName}
                                    </td>
                                    {matrix.columns.map((col) => (
                                        <td
                                            key={col.departmentJobTitleId}
                                            style={{
                                                ...baseTdStyle,
                                                textAlign: "center",
                                                background: rowBg,
                                            }}
                                        >
                                            {renderBadge(
                                                cellMap.get(col.departmentJobTitleId) ?? null
                                            )}
                                        </td>
                                    ))}
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        );
    };

    /* ─────────────────────────────────────────────
       MAIN RENDER
    ───────────────────────────────────────────── */
    return (
        <div>
            {/* ── HEADER ── */}
            <div
                style={{
                    marginBottom: 20,
                    padding: "14px 18px",
                    borderRadius: 10,
                    border: "1px solid #ffd6d9",
                    background: "#fff5f7",
                }}
            >
                <div style={{ fontSize: 12, color: ACCENT, fontWeight: 500 }}>
                    Phân quyền phòng ban
                </div>
                <div style={{ fontSize: 18, fontWeight: 700, color: "#1a1a1a" }}>
                    {departmentName}
                </div>
            </div>

            {/* ── LEGEND ── */}
            {renderLegend()}

            {/* ── CATEGORY TABS ── */}
            {loadingCat ? (
                <div style={{ padding: 32, textAlign: "center" }}>
                    <Spin />
                </div>
            ) : errorCat ? (
                <div style={{ color: "#ff4d4f", padding: "8px 0" }}>{errorCat}</div>
            ) : categories.length === 0 ? (
                <div style={{ color: "#888", padding: "8px 0" }}>
                    Phòng ban chưa có danh mục phân quyền.
                </div>
            ) : (
                <>
                    <div
                        style={{
                            display: "flex",
                            gap: 8,
                            flexWrap: "wrap",
                            marginBottom: 16,
                        }}
                    >
                        {categories.map((cat) => {
                            const active = cat.id === selectedId;
                            return (
                                <button
                                    key={cat.id}
                                    onClick={() =>
                                        cat.id != null && setSelectedId(cat.id)
                                    }
                                    style={{
                                        padding: "7px 16px",
                                        borderRadius: 6,
                                        border: active
                                            ? `2px solid ${ACCENT}`
                                            : "1px solid #d9d9d9",
                                        background: active ? "#fff0f2" : "#fff",
                                        color: active ? ACCENT : "#555",
                                        fontWeight: active ? 700 : 400,
                                        cursor: "pointer",
                                        fontSize: 13,
                                        transition: "all 0.15s",
                                        whiteSpace: "nowrap",
                                    }}
                                >
                                    {cat.name}
                                </button>
                            );
                        })}
                    </div>

                    {/* ── TABLE TITLE ── */}
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                            marginBottom: 12,
                        }}
                    >
                        <div
                            style={{
                                width: 4,
                                height: 18,
                                borderRadius: 2,
                                background: ACCENT,
                                flexShrink: 0,
                            }}
                        />
                        <span
                            style={{
                                fontWeight: 700,
                                fontSize: 14,
                                color: "#1a1a1a",
                            }}
                        >
                            Bảng phân quyền chi tiết
                        </span>
                    </div>

                    {renderTable()}
                </>
            )}
        </div>
    );
};

export default PermissionViewModal;