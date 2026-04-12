import { Tooltip, Popconfirm } from "antd";
import { DeleteOutlined, EditOutlined, FileTextOutlined, UserOutlined } from "@ant-design/icons";
import { Handle, Position } from "reactflow";
import { useState, useRef } from "react";

if (typeof document !== "undefined" && !document.getElementById("org-chart-fonts")) {
    const link = document.createElement("link");
    link.id = "org-chart-fonts";
    link.rel = "stylesheet";
    link.href = "https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;600;700;800&family=JetBrains+Mono:wght@600&display=swap";
    document.head.appendChild(link);
}

export interface OrgNodeData {
    title: string;
    levelCode: string;
    holderName?: string;
    isGoal?: boolean;
    jobDescriptionId?: number | null;
    allowEdit?: boolean;
    allowDelete?: boolean;
    isMobile?: boolean;
    isTablet?: boolean;
    onEdit: () => void;
    onDelete: () => void;
    onJD?: () => void;
    onSelect?: () => void;
    onMouseEnter?: () => void;
    onMouseLeave?: () => void;
    highlightState?: "idle" | "active" | "ancestor" | "descendant" | "dimmed";
    isSelected?: boolean;
}

const T = "0.15s ease";
const TRANS = `border-color ${T}, box-shadow ${T}, opacity ${T}, transform ${T}`;

const BORDER_CFG = {
    idle: { borderColor: "#94a3b8", borderStyle: "solid" as const, borderWidth: "1.5px", boxShadow: "none", opacity: 1, scale: "scale(1)" },
    active: { borderColor: "#d97706", borderStyle: "solid" as const, borderWidth: "2px", boxShadow: "0 0 0 3px rgba(217,119,6,0.18), 0 6px 24px rgba(217,119,6,0.14)", opacity: 1, scale: "scale(1.03)" },
    ancestor: { borderColor: "#3b82f6", borderStyle: "dashed" as const, borderWidth: "2px", boxShadow: "0 0 0 3px rgba(59,130,246,0.12)", opacity: 1, scale: "scale(1)" },
    descendant: { borderColor: "#f59e0b", borderStyle: "solid" as const, borderWidth: "1.5px", boxShadow: "0 0 0 2px rgba(245,158,11,0.16)", opacity: 1, scale: "scale(1)" },
    dimmed: { borderColor: "#e5e7eb", borderStyle: "solid" as const, borderWidth: "1.5px", boxShadow: "none", opacity: 0.3, scale: "scale(1)" },
} as const;

const SEL_BORDER = "#f9a8b4";
const SEL_SHADOW = "0 0 0 3px rgba(232,99,122,0.10)";

const OrgNodeCard = ({ data }: { data: OrgNodeData }) => {
    const [cardHover, setCardHover] = useState(false);
    const [jdHover, setJdHover] = useState(false);
    const [editHover, setEditHover] = useState(false);
    const [deleteHover, setDeleteHover] = useState(false);
    const leaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    // ── Responsive sizing từ data prop (được truyền từ loadNodes) ────────────
    const isMobile = data.isMobile ?? false;
    const isTablet = data.isTablet ?? false;

    const NODE_W = isMobile ? 158 : isTablet ? 182 : 220;
    const NODE_H = isMobile ? 118 : isTablet ? 148 : 185;

    // Font sizes
    const titleSize = isMobile ? 12 : isTablet ? 13.5 : 14.5;
    const holderSize = isMobile ? 10 : isTablet ? 10.5 : 11;
    const levelSize = isMobile ? 8 : isTablet ? 8.5 : 9.5;
    const jdBtnSize = isMobile ? 9 : isTablet ? 9.5 : 10;
    const actionBtnW = isMobile ? 22 : 26;
    const actionBtnH = isMobile ? 22 : 26;
    const actionIconS = isMobile ? 9 : 11;
    const holderIconW = isMobile ? 20 : 24;
    const holderIconH = isMobile ? 20 : 24;
    const footerH = isMobile ? 28 : 34;
    const headerH = isMobile ? 3 : 4;
    const cardPadT = isMobile ? "7px 9px 6px" : isTablet ? "8px 10px 7px" : "10px 12px 8px";
    const cardGap = isMobile ? 5 : 7;

    const hasHolder = !!data.holderName;
    const hasLevel = !!data.levelCode;
    const isSimple = !hasHolder && !hasLevel;
    const hs = data.highlightState ?? "idle";
    const bc = BORDER_CFG[hs];

    const showEdit = data.allowEdit !== false;
    const showDelete = data.allowDelete !== false;
    const showActions = showEdit || showDelete;

    const borderColor = data.isSelected
        ? SEL_BORDER
        : hs === "idle" && data.isGoal
            ? "#e9d8fd"
            : bc.borderColor;

    const boxShadow = data.isSelected ? SEL_SHADOW : bc.boxShadow;

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

    const headerBar = data.isGoal
        ? "linear-gradient(90deg,#c084fc,#e9d8fd)"
        : "linear-gradient(90deg,#e2e8f0,#f1f5f9)";

    const cardBg = data.isGoal
        ? "linear-gradient(160deg,#fdf8ff 0%,#f5f0ff 100%)"
        : "#ffffff";

    return (
        <>
            <Handle
                type="target"
                position={Position.Top}
                style={{ background: "transparent", border: "none", width: 1, height: 1, top: 0 }}
            />

            <div
                style={{ position: "relative" }}
                onMouseEnter={handleCardMouseEnter}
                onMouseLeave={handleCardMouseLeave}
            >
                {/* ── Action buttons ── */}
                {showActions && (
                    <div
                        onMouseEnter={handleMouseEnter}
                        onMouseLeave={handleMouseLeave}
                        style={{
                            position: "absolute",
                            top: isMobile ? -10 : -13,
                            right: isMobile ? -4 : -6,
                            display: "flex",
                            gap: 4,
                            zIndex: 10,
                            opacity: cardHover ? 1 : 0,
                            transform: cardHover ? "translateY(0)" : "translateY(5px)",
                            transition: "opacity 0.15s ease, transform 0.15s ease",
                            pointerEvents: cardHover ? "auto" : "none",
                        }}
                    >
                        {showEdit && (
                            <Tooltip title="Chỉnh sửa" placement="top">
                                <button
                                    onClick={(e) => { e.stopPropagation(); data.onEdit(); }}
                                    onMouseEnter={() => { handleMouseEnter(); setEditHover(true); }}
                                    onMouseLeave={() => { handleMouseLeave(); setEditHover(false); }}
                                    style={{
                                        width: actionBtnW, height: actionBtnH,
                                        borderRadius: "50%",
                                        background: editHover ? "#1e293b" : "#fff",
                                        border: "1.5px solid #e5e7eb",
                                        cursor: "pointer",
                                        display: "flex", alignItems: "center", justifyContent: "center",
                                        color: editHover ? "#fff" : "#9ca3af",
                                        padding: 0,
                                        boxShadow: "0 2px 8px rgba(0,0,0,.10)",
                                        transition: "all 0.15s ease",
                                    }}
                                >
                                    <EditOutlined style={{ fontSize: actionIconS }} />
                                </button>
                            </Tooltip>
                        )}

                        {showDelete && (
                            <Popconfirm
                                title="Xóa vị trí này?"
                                description="Các node con sẽ mất liên kết cha."
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
                                        background: deleteHover ? "#ef4444" : "#fff",
                                        border: `1.5px solid ${deleteHover ? "#ef4444" : "#e5e7eb"}`,
                                        cursor: "pointer",
                                        display: "flex", alignItems: "center", justifyContent: "center",
                                        color: deleteHover ? "#fff" : "#9ca3af",
                                        padding: 0,
                                        boxShadow: "0 2px 8px rgba(0,0,0,.10)",
                                        transition: "all 0.15s ease",
                                    }}
                                >
                                    <DeleteOutlined style={{ fontSize: actionIconS }} />
                                </button>
                            </Popconfirm>
                        )}
                    </div>
                )}

                {/* ── Card body ── */}
                <div
                    onClick={handleCardClick}
                    style={{
                        width: NODE_W,
                        minHeight: NODE_H,
                        background: cardBg,
                        borderRadius: isMobile ? 10 : 14,
                        border: `${bc.borderWidth} ${bc.borderStyle} ${borderColor}`,
                        boxShadow,
                        overflow: "hidden",
                        cursor: data.onSelect ? "pointer" : "default",
                        display: "flex", flexDirection: "column",
                        opacity: bc.opacity, transform: bc.scale,
                        transition: TRANS, willChange: "transform, opacity",
                    }}
                >
                    {isSimple ? (
                        /* ── Simple mode (no holder, no level) ── */
                        <div style={{
                            flex: 1, margin: isMobile ? 3 : 4,
                            borderRadius: isMobile ? 7 : 10,
                            border: `${bc.borderWidth} ${bc.borderStyle} ${borderColor}`,
                            display: "flex", alignItems: "center", justifyContent: "center",
                            padding: isMobile ? "8px 10px" : "12px 14px",
                            transition: `border-color ${T}`,
                        }}>
                            <span style={{
                                fontFamily: "'Be Vietnam Pro','Segoe UI',sans-serif",
                                fontWeight: 700,
                                fontSize: isMobile ? 13 : 15.5,
                                color: "#111827",
                                lineHeight: 1.4,
                                letterSpacing: "-0.01em",
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
                    ) : (
                        /* ── Full mode ── */
                        <>
                            {/* Header bar */}
                            <div style={{ height: headerH, flexShrink: 0, background: headerBar }} />

                            {/* Content area */}
                            <div style={{
                                flex: 1,
                                padding: cardPadT,
                                display: "flex", flexDirection: "column",
                                gap: cardGap, overflow: "hidden",
                            }}>
                                {/* Goal badge row */}
                                <div style={{ height: isMobile ? 16 : 20, flexShrink: 0, display: "flex", alignItems: "center" }}>
                                    {data.isGoal && (
                                        <span style={{
                                            fontSize: isMobile ? 8 : 9,
                                            fontWeight: 700,
                                            fontFamily: "'Be Vietnam Pro',sans-serif",
                                            background: "linear-gradient(135deg,#f5f0ff,#ede9fe)",
                                            color: "#7c3aed",
                                            border: "1px solid #ddd6fe",
                                            borderRadius: 5,
                                            padding: isMobile ? "1px 5px" : "2px 7px",
                                            letterSpacing: "0.04em",
                                            flexShrink: 0,
                                        }}>
                                            🎯 Mục tiêu
                                        </span>
                                    )}
                                </div>

                                {/* Title */}
                                <div style={{ flex: 1, overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                    <span style={{
                                        fontFamily: "'Be Vietnam Pro','Segoe UI',sans-serif",
                                        fontWeight: 600,
                                        fontSize: titleSize,
                                        color: "#111827",
                                        lineHeight: 1.5,
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

                                {/* Holder row */}
                                {hasHolder ? (
                                    <div style={{
                                        minHeight: isMobile ? 28 : 34,
                                        flexShrink: 0,
                                        display: "flex", alignItems: "center", gap: isMobile ? 6 : 8,
                                        background: "#ffffff",
                                        border: "1.5px solid #e5e7eb",
                                        borderRadius: isMobile ? 6 : 8,
                                        padding: isMobile ? "4px 7px" : "6px 10px",
                                    }}>
                                        <div style={{
                                            width: holderIconW, height: holderIconH,
                                            borderRadius: isMobile ? 6 : 8,
                                            flexShrink: 0,
                                            display: "flex", alignItems: "center", justifyContent: "center",
                                            background: "linear-gradient(135deg,#f43f5e,#fb923c)",
                                        }}>
                                            <UserOutlined style={{ fontSize: isMobile ? 9 : 11, color: "#fff" }} />
                                        </div>
                                        <span style={{
                                            fontFamily: "'Be Vietnam Pro',sans-serif",
                                            fontSize: holderSize,
                                            fontWeight: 700,
                                            color: "#374151",
                                            overflow: "hidden",
                                            display: "-webkit-box",
                                            WebkitLineClamp: 2,
                                            WebkitBoxOrient: "vertical",
                                            lineHeight: 1.35,
                                            wordBreak: "break-word",
                                        }}>
                                            {data.holderName}
                                        </span>
                                    </div>
                                ) : (
                                    <div style={{
                                        height: isMobile ? 28 : 34,
                                        flexShrink: 0,
                                        display: "flex", alignItems: "center", gap: isMobile ? 6 : 8,
                                        background: "#fafafa",
                                        border: "1px dashed #e5e7eb",
                                        borderRadius: isMobile ? 6 : 8,
                                        padding: isMobile ? "0 7px" : "0 10px",
                                    }}>
                                        <div style={{
                                            width: holderIconW, height: holderIconH,
                                            borderRadius: isMobile ? 6 : 8,
                                            flexShrink: 0,
                                            display: "flex", alignItems: "center", justifyContent: "center",
                                            background: "#f1f5f9",
                                            border: "1.5px dashed #e2e8f0",
                                        }}>
                                            <UserOutlined style={{ fontSize: isMobile ? 9 : 11, color: "#cbd5e1" }} />
                                        </div>
                                        <span style={{
                                            fontFamily: "'Be Vietnam Pro',sans-serif",
                                            fontSize: isMobile ? 9.5 : 11,
                                            fontWeight: 400,
                                            color: "#9ca3af",
                                            fontStyle: "italic",
                                        }}>
                                            {isMobile ? "Chưa có P.trách" : "Chưa có người phụ trách"}
                                        </span>
                                    </div>
                                )}
                            </div>

                            {/* Footer */}
                            <div style={{
                                height: footerH,
                                flexShrink: 0,
                                borderTop: "1px solid #f3f4f6",
                                background: "#fafafa",
                                padding: isMobile ? "0 8px" : "0 12px",
                                display: "flex", alignItems: "center", justifyContent: "space-between",
                            }}>
                                {hasLevel ? (
                                    <span style={{
                                        fontSize: levelSize,
                                        fontWeight: 600,
                                        fontFamily: "'JetBrains Mono',monospace",
                                        letterSpacing: "0.08em",
                                        color: "#e8637a",
                                        background: "linear-gradient(135deg,#fff0f3,#ffe4ea)",
                                        border: "1px solid #ffd6e0",
                                        borderRadius: 5,
                                        padding: isMobile ? "1px 5px" : "2px 8px",
                                        textTransform: "uppercase",
                                        flexShrink: 0,
                                        maxWidth: isMobile ? 72 : 100,
                                        overflow: "hidden",
                                        textOverflow: "ellipsis",
                                        whiteSpace: "nowrap",
                                    }}>
                                        {data.levelCode}
                                    </span>
                                ) : <span />}

                                {data.jobDescriptionId ? (
                                    <button
                                        onClick={(e) => { e.stopPropagation(); data.onJD?.(); }}
                                        onMouseEnter={() => setJdHover(true)}
                                        onMouseLeave={() => setJdHover(false)}
                                        style={{
                                            display: "flex", alignItems: "center", gap: isMobile ? 3 : 4,
                                            fontSize: jdBtnSize,
                                            fontWeight: 600,
                                            fontFamily: "'Be Vietnam Pro',sans-serif",
                                            letterSpacing: "0.05em",
                                            color: jdHover ? "#374151" : "#6b7280",
                                            background: jdHover ? "#f3f4f6" : "#ffffff",
                                            border: `1px solid ${jdHover ? "#d1d5db" : "#e5e7eb"}`,
                                            borderRadius: 5,
                                            cursor: "pointer",
                                            padding: isMobile ? "2px 6px" : "3px 10px",
                                            transition: "all 0.15s ease",
                                            boxShadow: jdHover ? "0 1px 4px rgba(0,0,0,.08)" : "none",
                                        }}
                                    >
                                        <FileTextOutlined style={{ fontSize: isMobile ? 8 : 9 }} />
                                        {isMobile ? "JD" : "Xem JD"}
                                    </button>
                                ) : <span />}
                            </div>
                        </>
                    )}
                </div>
            </div>

            <Handle
                type="source"
                position={Position.Bottom}
                style={{ background: "transparent", border: "none", width: 1, height: 1, bottom: 0 }}
            />
        </>
    );
};

export default OrgNodeCard;