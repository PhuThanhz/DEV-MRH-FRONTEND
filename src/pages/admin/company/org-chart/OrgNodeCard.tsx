import { Tooltip, Popconfirm, Dropdown, type MenuProps } from "antd";
import { DeleteOutlined, EditOutlined, FileTextOutlined, UserOutlined, PlusOutlined, ApartmentOutlined, ThunderboltOutlined } from "@ant-design/icons";
import { Handle, Position } from "reactflow";
import { memo, useState, useRef } from "react";
import { ORG_CHART_NODE_SIZE } from "./orgChartConstants";

export interface OrgNodeData {
    title: string;
    levelCode: string;
    holderName?: string;
    isGoal?: boolean;
    jobDescriptionId?: number | null;
    allowEdit?: boolean;
    allowDelete?: boolean;
    allowCreate?: boolean;
    isMobile?: boolean;
    isTablet?: boolean;
    isSmallLaptop?: boolean;
    viewMode?: "compact" | "full";
    onEdit: () => void;
    onDelete: () => void;
    onAddChild?: (action?: "department" | "position" | "bulk") => void;
    onJD?: () => void;
    onSelect?: () => void;
    onMouseEnter?: () => void;
    onMouseLeave?: () => void;
    highlightState?: "idle" | "active" | "ancestor" | "descendant" | "dimmed";
    isSelected?: boolean;
    childCount?: number;
    isCollapsed?: boolean;
    onToggleCollapse?: () => void;
}

const T = "0.2s cubic-bezier(0.4, 0, 0.2, 1)";
const TRANS = `border-color ${T}, box-shadow ${T}, opacity ${T}, transform ${T}`;
const HIDDEN_HANDLE_STYLE: React.CSSProperties = {
    background: "transparent",
    border: "none",
    width: 1,
    height: 1,
};
const CARD_WRAP_STYLE: React.CSSProperties = { position: "relative" };

const ACCENT_COLORS = {
    idle: { shadow: "0 4px 12px -2px rgba(15, 23, 42, 0.03), 0 2px 6px -1px rgba(15, 23, 42, 0.02)" },
    active: { shadow: "0 8px 24px -4px rgba(217, 119, 6, 0.12), 0 4px 12px -2px rgba(217, 119, 6, 0.08)" },
    ancestor: { shadow: "0 8px 20px -4px rgba(59, 130, 246, 0.08), 0 4px 10px -2px rgba(59, 130, 246, 0.04)" },
    descendant: { shadow: "0 8px 20px -4px rgba(245, 158, 11, 0.08), 0 4px 10px -2px rgba(245, 158, 11, 0.04)" },
    dimmed: { shadow: "none" }
} as const;

// Beautiful colorful band styles mapped from standard level prefixes
const getBandStyle = (code: string): { bg: string; border: string; color: string } => {
    if (!code) return { bg: "#f1f5f9", border: "1px solid #cbd5e1", color: "#334155" };
    const cleanCode = code.trim().toUpperCase();

    // Core Executives/BOD/CEO/GMS get extremely premium Gold/Amber theme
    if (cleanCode === "CEO" || cleanCode === "BOD" || cleanCode === "GMS" || cleanCode.startsWith("DIR") || cleanCode.startsWith("PRES")) {
        return { bg: "#fffbeb", border: "1px solid #fde047", color: "#a16207" }; // Gold
    }

    const prefix = cleanCode.charAt(0);
    const map: Record<string, { bg: string; border: string; color: string }> = {
        M: { bg: "#fdf2f8", border: "1px solid #fbcfe8", color: "#be185d" }, // Management (Rose)
        S: { bg: "#faf5ff", border: "1px solid #e9d5ff", color: "#7e22ce" }, // Specialist (Violet)
        P: { bg: "#f0fdf4", border: "1px solid #bbf7d0", color: "#15803d" }, // Project (Green)
        E: { bg: "#fff7ed", border: "1px solid #fed7aa", color: "#c2410c" }, // Executive (Orange)
        T: { bg: "#eff6ff", border: "1px solid #bfdbfe", color: "#1d4ed8" }, // Technical (Blue)
    };
    return map[prefix] ?? { bg: "#f8fafc", border: "1px solid #cbd5e1", color: "#475569" };
};

const OrgNodeCard = ({ data }: { data: OrgNodeData }) => {
    const [cardHover, setCardHover] = useState(false);
    const [jdHover, setJdHover] = useState(false);
    const [editHover, setEditHover] = useState(false);
    const [deleteHover, setDeleteHover] = useState(false);
    const [addHover, setAddHover] = useState(false);
    const leaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    const isMobile = data.isMobile ?? false;
    const isTablet = data.isTablet ?? false;
    const isSmallLaptop = data.isSmallLaptop ?? false;
    const isCompactMode = data.viewMode === "compact";

    const hasHolder = !!data.holderName;
    const hasLevel = !!data.levelCode;

    // If a node does not have a level code, it represents a Department structural node
    const isDepartment = !data.levelCode;

    const nodeSize = isCompactMode
        ? isMobile
            ? ORG_CHART_NODE_SIZE.compactMobile
            : isTablet
                ? ORG_CHART_NODE_SIZE.compactTablet
                : isSmallLaptop
                    ? ORG_CHART_NODE_SIZE.compactSmallLaptop
                    : ORG_CHART_NODE_SIZE.compactDesktop
        : isMobile
            ? ORG_CHART_NODE_SIZE.mobile
            : isTablet
                ? ORG_CHART_NODE_SIZE.tablet
                : isSmallLaptop
                    ? ORG_CHART_NODE_SIZE.smallLaptop
                    : ORG_CHART_NODE_SIZE.desktop;
    const NODE_W = nodeSize.width;
    const NODE_H = nodeSize.height;
    
    // Adjust height for department nodes (which lack holder info) to remove excess empty space
    const CARD_H = isDepartment ? NODE_H - 46 : NODE_H;

    // Font sizes (increased for maximum legibility, title slightly adjusted to fit)
    const titleSize = isMobile ? 12.5 : isTablet ? 13.5 : isSmallLaptop ? 14 : 15;
    const holderSize = isMobile ? 9.5 : isTablet ? 10.2 : isSmallLaptop ? 10.5 : 11;
    const levelSize = isMobile ? 8.5 : isTablet ? 9.5 : 10;
    const jdBtnSize = isMobile ? 9.5 : isTablet ? 10 : 11;
    const actionBtnW = isMobile ? 22 : 25;
    const actionBtnH = isMobile ? 22 : 25;
    const actionIconS = isMobile ? 9 : 10.5;
    const holderIconW = isMobile ? 18 : 22;
    const holderIconH = isMobile ? 18 : 22;
    const cardPad = isMobile ? "10px 12px" : isTablet ? "12px 14px" : "14px 16px";
    const cardGap = isMobile ? 4 : 6;

    const isSimple = isCompactMode;

    const hs = data.highlightState ?? "idle";
    const accent = ACCENT_COLORS[hs];

    const showEdit = data.allowEdit !== false;
    const showDelete = data.allowDelete !== false;
    const showCreate = data.allowCreate !== false;
    const showActions = showEdit || showDelete || showCreate;

    // Pure white background for ALL cards as requested
    const cardBg = "#ffffff";

    // Dynamic border colors based on active / highlight states
    let cardBorderColor = "#cbd5e1"; // Sleek crisp standard border
    let cardShadow: string = accent.shadow;

    // Border highlights (1.5px thick, extremely crisp)
    if (data.isSelected) {
        cardBorderColor = "#1677ff"; // Vibrant blue focus border
        cardShadow = "0 8px 24px rgba(22, 119, 255, 0.15), 0 4px 12px rgba(22, 119, 255, 0.08)";
    } else if (isDepartment) {
        cardBorderColor = "#b7c7da";
        cardShadow = "0 10px 28px -18px rgba(15, 23, 42, 0.28), 0 2px 8px rgba(15, 23, 42, 0.04)";
    } else if (hs === "active") {
        cardBorderColor = "#fbbf24";
    } else if (hs === "ancestor") {
        cardBorderColor = "#3b82f6";
    } else if (hs === "descendant") {
        cardBorderColor = "#f59e0b";
    } else if (hs === "dimmed") {
        cardBorderColor = "#f1f5f9";
    }

    const handleMouseEnter = () => {
        if (leaveTimer.current) clearTimeout(leaveTimer.current);
        setCardHover(true);
    };
    const handleMouseLeave = () => {
        leaveTimer.current = setTimeout(() => setCardHover(false), 80);
    };
    const handleCardMouseEnter = () => { handleMouseEnter(); data.onMouseEnter?.(); };
    const handleCardMouseLeave = () => { handleMouseLeave(); data.onMouseLeave?.(); };

    const handleCardClick = (e: React.MouseEvent) => {
        if ((e.target as HTMLElement).closest("button")) return;
        data.onSelect?.();
    };

    const quickAddMenu: MenuProps = {
        items: [
            { key: "department", icon: <ApartmentOutlined />, label: "Thêm phòng ban con" },
            { key: "position", icon: <UserOutlined />, label: "Thêm chức danh" },
            { key: "bulk", icon: <ThunderboltOutlined />, label: "Tạo hàng loạt trong phòng ban này" },
        ],
        onClick: ({ key, domEvent }) => {
            domEvent.stopPropagation();
            data.onAddChild?.(key as "department" | "position" | "bulk");
        },
    };

    const addButton = (
        <button
            onClick={(e) => {
                if (isDepartment) return;
                e.stopPropagation();
                data.onAddChild?.("position");
            }}
            onMouseEnter={() => { handleMouseEnter(); setAddHover(true); }}
            onMouseLeave={() => { handleMouseLeave(); setAddHover(false); }}
            style={{
                width: actionBtnW, height: actionBtnH,
                borderRadius: "50%",
                background: addHover ? "#10b981" : "#ffffff",
                border: "1px solid #cbd5e1",
                cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: addHover ? "#ffffff" : "#475569",
                padding: 0,
                boxShadow: "0 4px 10px rgba(0,0,0,0.08)",
                transition: "all 0.12s ease",
            }}
        >
            <PlusOutlined style={{ fontSize: actionIconS }} />
        </button>
    );

    return (
        <>
            <Handle
                type="target"
                position={Position.Top}
                style={{ ...HIDDEN_HANDLE_STYLE, top: 0 }}
            />

            <div
                style={CARD_WRAP_STYLE}
                onMouseEnter={handleCardMouseEnter}
                onMouseLeave={handleCardMouseLeave}
            >
                {/* ── Floating Capsule Action Buttons ── */}
                {showActions && (
                    <div
                        onMouseEnter={handleMouseEnter}
                        onMouseLeave={handleMouseLeave}
                        style={{
                            position: "absolute",
                            top: isMobile ? -10 : -13,
                            right: isMobile ? -2 : -4,
                            display: "flex",
                            gap: 5,
                            zIndex: 10,
                            opacity: cardHover ? 1 : 0,
                            transform: cardHover ? "translateY(0) scale(1)" : "translateY(4px) scale(0.95)",
                            transition: "all 0.15s cubic-bezier(0.16, 1, 0.3, 1)",
                            pointerEvents: cardHover ? "auto" : "none",
                        }}
                    >
                        {showCreate && (
                            isDepartment ? (
                                <Dropdown menu={quickAddMenu} trigger={["click"]} placement="bottomRight" overlayStyle={{ zIndex: 2600 }}>
                                    <span>
                                        <Tooltip title="Thêm trong phòng ban" placement="top">
                                            {addButton}
                                        </Tooltip>
                                    </span>
                                </Dropdown>
                            ) : (
                                <Tooltip title="Thêm cấp dưới" placement="top">
                                    {addButton}
                                </Tooltip>
                            )
                        )}

                        {showEdit && (
                            <Tooltip title="Chỉnh sửa" placement="top">
                                <button
                                    onClick={(e) => { e.stopPropagation(); data.onEdit(); }}
                                    onMouseEnter={() => { handleMouseEnter(); setEditHover(true); }}
                                    onMouseLeave={() => { handleMouseLeave(); setEditHover(false); }}
                                    style={{
                                        width: actionBtnW, height: actionBtnH,
                                        borderRadius: "50%",
                                        background: editHover ? "#1677ff" : "#ffffff",
                                        border: "1px solid #cbd5e1",
                                        cursor: "pointer",
                                        display: "flex", alignItems: "center", justifyContent: "center",
                                        color: editHover ? "#ffffff" : "#475569",
                                        padding: 0,
                                        boxShadow: "0 4px 10px rgba(0,0,0,0.08)",
                                        transition: "all 0.12s ease",
                                    }}
                                >
                                    <EditOutlined style={{ fontSize: actionIconS }} />
                                </button>
                            </Tooltip>
                        )}

                        {showDelete && (
                            <Popconfirm
                                title="Xóa vị trí này?"
                                description="Các vị trí con trực thuộc sẽ mất liên kết cha."
                                okText="Xóa" cancelText="Hủy"
                                okButtonProps={{ danger: true }}
                                onConfirm={(e) => { e?.stopPropagation(); data.onDelete(); }}
                                onPopupClick={(e) => e.stopPropagation()}
                            >
                                <button
                                    onClick={(e) => e.stopPropagation()}
                                    onMouseEnter={() => { handleMouseEnter(); setDeleteHover(true); }}
                                    onMouseLeave={() => { handleMouseLeave(); setDeleteHover(false); }}
                                    style={{
                                        width: actionBtnW, height: actionBtnH,
                                        borderRadius: "50%",
                                        background: deleteHover ? "#ef4444" : "#ffffff",
                                        border: `1px solid ${deleteHover ? "#ef4444" : "#cbd5e1"}`,
                                        cursor: "pointer",
                                        display: "flex", alignItems: "center", justifyContent: "center",
                                        color: deleteHover ? "#ffffff" : "#475569",
                                        padding: 0,
                                        boxShadow: "0 4px 10px rgba(0,0,0,0.08)",
                                        transition: "all 0.12s ease",
                                    }}
                                >
                                    <DeleteOutlined style={{ fontSize: actionIconS }} />
                                </button>
                            </Popconfirm>
                        )}
                    </div>
                )}

                {/* ── Symmetrical Premium Card Body ── */}
                <div
                    onClick={handleCardClick}
                    style={{
                        width: NODE_W,
                        minHeight: CARD_H,
                        background: cardBg,
                        borderRadius: 12,
                        // Clean solid uniform border for all cards
                        border: `1.5px solid ${cardBorderColor}`,
                        boxShadow: cardShadow,
                        position: "relative",
                        overflow: "hidden",
                        cursor: data.onSelect ? "pointer" : "default",
                        display: "flex", flexDirection: "column",
                        opacity: hs === "dimmed" ? 0.4 : 1,
                        filter: hs === "dimmed" ? "grayscale(100%)" : "none",
                        transform: hs === "active" ? "scale(1.02)" : "scale(1)",
                        transition: TRANS,
                        willChange: "transform, opacity, filter",
                    }}
                >
                    {isSimple ? (
                        /* ── Symmetrical Compact Mode (Unused) ── */
                        <div style={{
                            flex: 1,
                            padding: "8px 10px",
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            justifyContent: "center",
                            position: "relative",
                        }}>
                            <span style={{
                                fontFamily: "'Be Vietnam Pro','Segoe UI',sans-serif",
                                fontWeight: 800,
                                fontSize: isMobile ? 12 : isTablet ? 13.5 : 15,
                                color: "#0f172a",
                                lineHeight: 1.35,
                                letterSpacing: "-0.01em",
                                textAlign: "center",
                            }}>
                                {data.title}
                            </span>
                        </div>
                    ) : (
                        /* ── Symmetrical Dashboard Mode (Beautifully Segmented) ── */
                        <>
                            {isDepartment ? (
                                /* ── Department Card Layout ── */
                                <div style={{
                                    flex: 1,
                                    padding: isMobile ? "12px 12px 13px" : isTablet ? "14px 15px 16px" : "16px 18px 18px",
                                    display: "flex",
                                    flexDirection: "column",
                                    justifyContent: "space-between",
                                    gap: 12,
                                    position: "relative",
                                    background: "linear-gradient(180deg, #ffffff 0%, #fbfdff 100%)",
                                }}>
                                    <div style={{
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "space-between",
                                        gap: 10,
                                        width: "100%",
                                    }}>
                                        <div style={{
                                            display: "inline-flex",
                                            alignItems: "center",
                                            gap: 6,
                                            background: "#f8fafc",
                                            border: "1px solid #dbeafe",
                                            borderRadius: 8,
                                            padding: isMobile ? "3px 7px" : "4px 8px",
                                            color: "#2563eb",
                                            fontSize: isMobile ? 9 : 10.5,
                                            fontWeight: 800,
                                            fontFamily: "'Be Vietnam Pro',sans-serif",
                                            letterSpacing: "0.02em",
                                        }}>
                                            <ApartmentOutlined style={{ fontSize: isMobile ? 10 : 12 }} />
                                            Phòng ban
                                        </div>
                                        {(data.childCount ?? 0) > 0 && (
                                            <span style={{
                                                fontFamily: "'JetBrains Mono','Be Vietnam Pro',monospace",
                                                fontSize: isMobile ? 9 : 10.5,
                                                fontWeight: 700,
                                                color: "#64748b",
                                                background: "#f1f5f9",
                                                border: "1px solid #e2e8f0",
                                                borderRadius: 7,
                                                padding: isMobile ? "2px 6px" : "3px 7px",
                                            }}>
                                                {data.childCount}
                                            </span>
                                        )}
                                    </div>

                                    <div style={{
                                        flex: 1,
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        width: "100%",
                                        padding: "2px 0",
                                    }}>
                                        <span style={{
                                            fontFamily: "'Be Vietnam Pro','Segoe UI',sans-serif",
                                            fontWeight: 850,
                                            fontSize: titleSize + 1,
                                            color: "#0f172a",
                                            lineHeight: 1.35,
                                            textAlign: "center",
                                            display: "-webkit-box",
                                            WebkitLineClamp: 3,
                                            WebkitBoxOrient: "vertical",
                                            overflow: "hidden",
                                            width: "100%",
                                        }}>
                                            {data.title}
                                        </span>
                                    </div>

                                    <div style={{
                                        height: 1,
                                        width: "42%",
                                        alignSelf: "center",
                                        background: "linear-gradient(90deg, transparent, #cbd5e1, transparent)",
                                    }} />
                                </div>
                            ) : (
                                /* ── 👤 Premium Position/Job Title Card Layout ── */
                                <>
                                    {/* Card Body content (Padded) */}
                                    <div style={{
                                        padding: cardPad,
                                        display: "flex", flexDirection: "column",
                                        gap: cardGap,
                                        overflow: "hidden",
                                        flex: 1,
                                        justifyContent: "space-between",
                                    }}>
                                        {/* Header row: Level badge */}
                                        <div style={{
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "flex-end",
                                            height: isMobile ? 16 : 20,
                                            flexShrink: 0,
                                            width: "100%",
                                        }}>
                                            {/* Hide level/grade badge ONLY when in compact mode! */}
                                            {hasLevel && !isCompactMode ? (() => {
                                                const badgeStyle = getBandStyle(data.levelCode);
                                                return (
                                                    <span style={{
                                                        fontSize: levelSize,
                                                        fontWeight: 700,
                                                        fontFamily: "'JetBrains Mono',monospace",
                                                        letterSpacing: "0.05em",
                                                        color: badgeStyle.color,
                                                        background: badgeStyle.bg,
                                                        border: badgeStyle.border,
                                                        borderRadius: 5,
                                                        padding: isMobile ? "1px 5px" : "2px 8px",
                                                        textTransform: "uppercase",
                                                        maxWidth: isMobile ? 60 : 80,
                                                        overflow: "hidden",
                                                        textOverflow: "ellipsis",
                                                        whiteSpace: "nowrap",
                                                    }}>
                                                        {data.levelCode}
                                                    </span>
                                                );
                                            })() : null}
                                        </div>

                                        {/* Job Title (Centered, 15px Extra Bold) */}
                                        <div style={{
                                            flex: 1,
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            width: "100%",
                                            margin: "4px 0",
                                        }}>
                                            <span style={{
                                                fontFamily: "'Be Vietnam Pro','Segoe UI',sans-serif",
                                                fontWeight: 800,
                                                fontSize: titleSize,
                                                color: "#0f172a",
                                                lineHeight: 1.35,
                                                letterSpacing: "-0.01em",
                                                textAlign: "center",
                                                display: "-webkit-box",
                                                WebkitLineClamp: isMobile ? 2 : 3,
                                                WebkitBoxOrient: "vertical",
                                                overflow: "hidden",
                                                width: "100%",
                                            }}>
                                                {data.title}
                                            </span>
                                        </div>

                                        {/* Holder Block (Centered User Chip - ONLY show if NOT in compact mode!) */}
                                        <div style={{
                                            display: "flex",
                                            flexDirection: "column",
                                            alignItems: "center",
                                            width: "100%",
                                            flexShrink: 0,
                                            gap: 5,
                                        }}>
                                            {!isCompactMode && (
                                                <div style={{ display: "flex", justifyContent: "center", width: "100%" }}>
                                                    {hasHolder ? (
                                                        <div style={{
                                                            minHeight: isMobile ? 22 : 28,
                                                            display: "inline-flex",
                                                            alignItems: "center",
                                                            gap: isMobile ? 4 : 5,
                                                            background: "#ffffff",
                                                            border: "1px solid #cbd5e1",
                                                            borderRadius: 20,
                                                            padding: isMobile ? "2px 6px" : "3px 10px",
                                                            maxWidth: "100%",
                                                        }}>
                                                            <div style={{
                                                                width: holderIconW, height: holderIconH,
                                                                borderRadius: "50%",
                                                                flexShrink: 0,
                                                                display: "flex", alignItems: "center", justifyContent: "center",
                                                                background: "linear-gradient(135deg, #6366f1, #a855f7)",
                                                                color: "#ffffff",
                                                                fontSize: isMobile ? 9 : 10,
                                                                fontWeight: 700,
                                                            }}>
                                                                {data.holderName?.charAt(0).toUpperCase()}
                                                            </div>
                                                            <span style={{
                                                                fontFamily: "'Be Vietnam Pro',sans-serif",
                                                                fontSize: holderSize,
                                                                fontWeight: 700,
                                                                color: "#1e293b",
                                                                lineHeight: 1.3,
                                                                textAlign: "left",
                                                                whiteSpace: "nowrap",
                                                                overflow: "hidden",
                                                                textOverflow: "ellipsis",
                                                            }}>
                                                                {data.holderName ?? ""}
                                                            </span>
                                                        </div>
                                                    ) : (
                                                        <div style={{
                                                            height: isMobile ? 22 : 28,
                                                            display: "inline-flex",
                                                            alignItems: "center",
                                                            gap: isMobile ? 5 : 6,
                                                            background: "#ffffff",
                                                            border: "1px dashed #cbd5e1",
                                                            borderRadius: 20,
                                                            padding: isMobile ? "0 8px" : "0 12px",
                                                            maxWidth: "100%",
                                                        }}>
                                                            <div style={{
                                                                width: holderIconW, height: holderIconH,
                                                                borderRadius: "50%",
                                                                flexShrink: 0,
                                                                display: "flex", alignItems: "center", justifyContent: "center",
                                                                background: "#f1f5f9",
                                                                border: "1px dashed #cbd5e1",
                                                            }}>
                                                                <UserOutlined style={{ fontSize: isMobile ? 8 : 9, color: "#94a3b8" }} />
                                                            </div>
                                                            <span style={{
                                                                fontFamily: "'Be Vietnam Pro',sans-serif",
                                                                fontSize: isMobile ? 9.5 : 10.5,
                                                                fontWeight: 500,
                                                                color: "#64748b",
                                                                fontStyle: "italic",
                                                            }}>
                                                                Chưa bổ nhiệm
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Full-width elegant footer block (Only if JD exists) */}
                                    {data.jobDescriptionId ? (
                                        <div style={{
                                            background: "#f8fafc",
                                            borderTop: "1px solid #f1f5f9",
                                            padding: isMobile ? "6px 0" : "8px 0",
                                            display: "flex",
                                            justifyContent: "center",
                                            width: "100%",
                                            marginTop: "auto",
                                            flexShrink: 0,
                                        }}>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); data.onJD?.(); }}
                                                onMouseEnter={() => setJdHover(true)}
                                                onMouseLeave={() => setJdHover(false)}
                                                style={{
                                                    display: "flex", alignItems: "center", gap: 4,
                                                    fontSize: jdBtnSize,
                                                    fontWeight: 700,
                                                    fontFamily: "'Be Vietnam Pro',sans-serif",
                                                    color: jdHover ? "#1677ff" : "#475569",
                                                    background: jdHover ? "#e6f4ff" : "#ffffff",
                                                    border: `1px solid ${jdHover ? "#91caee" : "#cbd5e1"}`,
                                                    borderRadius: 6,
                                                    cursor: "pointer",
                                                    padding: isMobile ? "3px 8px" : "4px 12px",
                                                    transition: "all 0.15s ease",
                                                }}
                                            >
                                                <FileTextOutlined style={{ fontSize: isMobile ? 8 : 9 }} />
                                                Mô tả công việc
                                            </button>
                                        </div>
                                    ) : null}
                                </>
                            )}
                        </>
                    )}
                </div>

                {/* ── Circular Sleek Expand/Collapse Button (Only for Department Cards with children, overlapping bottom border) ── */}
                {isDepartment && data.childCount && data.childCount > 0 ? (
                    <button
                        onClick={(e) => { e.stopPropagation(); data.onToggleCollapse?.(); }}
                        style={{
                            position: "absolute",
                            bottom: -11,
                            left: "50%",
                            transform: "translateX(-50%)",
                            zIndex: 10,
                            width: 22,
                            height: 22,
                            borderRadius: "50%",
                            background: "#ffffff",
                            border: `1.5px solid ${data.isCollapsed ? "#1677ff" : "#cbd5e1"}`,
                            color: data.isCollapsed ? "#1677ff" : "#4b5563",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            boxShadow: "0 2px 6px rgba(0,0,0,0.06)",
                            transition: "all 0.15s ease",
                            padding: 0,
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.borderColor = "#1677ff";
                            e.currentTarget.style.color = "#1677ff";
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor = data.isCollapsed ? "#1677ff" : "#cbd5e1";
                            e.currentTarget.style.color = data.isCollapsed ? "#1677ff" : "#4b5563";
                        }}
                    >
                        {data.isCollapsed ? (
                            <span style={{ fontSize: 9, fontWeight: 800 }}>▼</span>
                        ) : (
                            <span style={{ fontSize: 9, fontWeight: 800 }}>▲</span>
                        )}
                    </button>
                ) : null}
            </div>

            <Handle
                type="source"
                position={Position.Bottom}
                style={{ ...HIDDEN_HANDLE_STYLE, bottom: 0 }}
            />
        </>
    );
};

export default memo(OrgNodeCard);
