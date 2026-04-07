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
    onEdit: () => void;
    onDelete: () => void;
    onJD?: () => void;
    onSelect?: () => void;       // 👈 click vào thân card
    onMouseEnter?: () => void;
    onMouseLeave?: () => void;
    highlightState?: "idle" | "active" | "ancestor" | "descendant" | "dimmed";
    isSelected?: boolean;        // 👈 đang được chọn bởi search / mini panel
}

const NODE_W = 220;
const NODE_H = 185;

const T = "0.15s ease";
const TRANS = `border-color ${T}, box-shadow ${T}, opacity ${T}, transform ${T}`;

const BORDER_CFG = {
    idle: { borderColor: "#94a3b8", borderStyle: "solid" as const, borderWidth: "1.5px", boxShadow: "none", opacity: 1, scale: "scale(1)" },
    active: { borderColor: "#d97706", borderStyle: "solid" as const, borderWidth: "2px", boxShadow: "0 0 0 3px rgba(217,119,6,0.18), 0 6px 24px rgba(217,119,6,0.14)", opacity: 1, scale: "scale(1.03)" },
    ancestor: { borderColor: "#3b82f6", borderStyle: "dashed" as const, borderWidth: "2px", boxShadow: "0 0 0 3px rgba(59,130,246,0.12)", opacity: 1, scale: "scale(1)" },
    descendant: { borderColor: "#f59e0b", borderStyle: "solid" as const, borderWidth: "1.5px", boxShadow: "0 0 0 2px rgba(245,158,11,0.16)", opacity: 1, scale: "scale(1)" },
    dimmed: { borderColor: "#e5e7eb", borderStyle: "solid" as const, borderWidth: "1.5px", boxShadow: "none", opacity: 0.3, scale: "scale(1)" },
} as const;

// selected: hồng nhạt cùng tông app, không nổi
const SEL_BORDER = "#f9a8b4";
const SEL_SHADOW = "0 0 0 3px rgba(232,99,122,0.10)";

const OrgNodeCard = ({ data }: { data: OrgNodeData }) => {
    const [cardHover, setCardHover] = useState(false);
    const [jdHover, setJdHover] = useState(false);
    const [editHover, setEditHover] = useState(false);
    const [deleteHover, setDeleteHover] = useState(false);
    const leaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

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

    const handleMouseEnter = () => { if (leaveTimer.current) clearTimeout(leaveTimer.current); setCardHover(true); };
    const handleMouseLeave = () => { leaveTimer.current = setTimeout(() => setCardHover(false), 80); };
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
            <Handle type="target" position={Position.Top}
                style={{ background: "transparent", border: "none", width: 1, height: 1, top: 0 }} />

            <div style={{ position: "relative" }}
                onMouseEnter={handleCardMouseEnter}
                onMouseLeave={handleCardMouseLeave}
            >
                {showActions && (
                    <div
                        onMouseEnter={handleMouseEnter}
                        onMouseLeave={handleMouseLeave}
                        style={{
                            position: "absolute", top: -13, right: -6,
                            display: "flex", gap: 4, zIndex: 10,
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
                                        width: 26, height: 26, borderRadius: "50%",
                                        background: editHover ? "#1e293b" : "#fff",
                                        border: "1.5px solid #e5e7eb", cursor: "pointer",
                                        display: "flex", alignItems: "center", justifyContent: "center",
                                        color: editHover ? "#fff" : "#9ca3af",
                                        padding: 0, boxShadow: "0 2px 8px rgba(0,0,0,.10)",
                                        transition: "all 0.15s ease",
                                    }}
                                >
                                    <EditOutlined style={{ fontSize: 11 }} />
                                </button>
                            </Tooltip>
                        )}
                        {showDelete && (
                            <Popconfirm
                                title="Xóa vị trí này?" description="Các node con sẽ mất liên kết cha."
                                okText="Xóa" cancelText="Hủy" okButtonProps={{ danger: true }}
                                onConfirm={(e) => { e?.stopPropagation(); data.onDelete(); }}
                                onPopupClick={(e) => e.stopPropagation()}
                            >
                                <button
                                    onClick={(e) => e.stopPropagation()}
                                    onMouseEnter={() => { handleMouseEnter(); setDeleteHover(true); }}
                                    onMouseLeave={() => { handleMouseLeave(); setDeleteHover(false); }}
                                    style={{
                                        width: 26, height: 26, borderRadius: "50%",
                                        background: deleteHover ? "#ef4444" : "#fff",
                                        border: `1.5px solid ${deleteHover ? "#ef4444" : "#e5e7eb"}`,
                                        cursor: "pointer",
                                        display: "flex", alignItems: "center", justifyContent: "center",
                                        color: deleteHover ? "#fff" : "#9ca3af",
                                        padding: 0, boxShadow: "0 2px 8px rgba(0,0,0,.10)",
                                        transition: "all 0.15s ease",
                                    }}
                                >
                                    <DeleteOutlined style={{ fontSize: 11 }} />
                                </button>
                            </Popconfirm>
                        )}
                    </div>
                )}

                <div
                    onClick={handleCardClick}
                    style={{
                        width: NODE_W, minHeight: NODE_H,
                        background: cardBg, borderRadius: 14,
                        border: `${bc.borderWidth} ${bc.borderStyle} ${borderColor}`,
                        boxShadow,
                        overflow: "hidden",
                        cursor: data.onSelect ? "pointer" : "default",
                        display: "flex", flexDirection: "column",
                        opacity: bc.opacity, transform: bc.scale,
                        transition: TRANS, willChange: "transform, opacity",
                    }}>

                    {isSimple ? (
                        <div style={{
                            flex: 1, margin: 4, borderRadius: 10,
                            border: `${bc.borderWidth} ${bc.borderStyle} ${borderColor}`,
                            display: "flex", alignItems: "center", justifyContent: "center",
                            padding: "12px 14px", transition: `border-color ${T}`,
                        }}>
                            <span style={{
                                fontFamily: "'Be Vietnam Pro','Segoe UI',sans-serif",
                                fontWeight: 700, fontSize: 15.5, color: "#111827",
                                lineHeight: 1.4, letterSpacing: "-0.01em", textAlign: "center",
                                display: "-webkit-box", WebkitLineClamp: 3,
                                WebkitBoxOrient: "vertical", overflow: "hidden", width: "100%",
                            }}>
                                {data.title}
                            </span>
                        </div>
                    ) : (
                        <>
                            <div style={{ height: 4, flexShrink: 0, background: headerBar }} />

                            <div style={{ flex: 1, padding: "10px 12px 8px", display: "flex", flexDirection: "column", gap: 7, overflow: "hidden" }}>
                                <div style={{ height: 20, flexShrink: 0, display: "flex", alignItems: "center" }}>
                                    {data.isGoal && (
                                        <span style={{
                                            fontSize: 9, fontWeight: 700,
                                            fontFamily: "'Be Vietnam Pro',sans-serif",
                                            background: "linear-gradient(135deg,#f5f0ff,#ede9fe)",
                                            color: "#7c3aed", border: "1px solid #ddd6fe",
                                            borderRadius: 5, padding: "2px 7px",
                                            letterSpacing: "0.04em", flexShrink: 0,
                                        }}>
                                            🎯 Mục tiêu
                                        </span>
                                    )}
                                </div>

                                <div style={{ flex: 1, overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                    <span style={{
                                        fontFamily: "'Be Vietnam Pro','Segoe UI',sans-serif",
                                        fontWeight: 600, fontSize: 14.5, color: "#111827",
                                        lineHeight: 1.5, letterSpacing: "-0.01em", textAlign: "center",
                                        display: "-webkit-box", WebkitLineClamp: 3,
                                        WebkitBoxOrient: "vertical", overflow: "hidden", width: "100%",
                                    }}>
                                        {data.title}
                                    </span>
                                </div>

                                {hasHolder ? (
                                    <div style={{
                                        minHeight: 34, flexShrink: 0,
                                        display: "flex", alignItems: "center", gap: 8,
                                        background: "#ffffff", border: "1.5px solid #e5e7eb",
                                        borderRadius: 8, padding: "6px 10px",
                                    }}>
                                        <div style={{
                                            width: 24, height: 24, borderRadius: 8, flexShrink: 0,
                                            display: "flex", alignItems: "center", justifyContent: "center",
                                            background: "linear-gradient(135deg,#f43f5e,#fb923c)",
                                        }}>
                                            <UserOutlined style={{ fontSize: 11, color: "#fff" }} />
                                        </div>
                                        <span style={{
                                            fontFamily: "'Be Vietnam Pro',sans-serif",
                                            fontSize: 11, fontWeight: 700, color: "#374151",
                                            overflow: "hidden", display: "-webkit-box",
                                            WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
                                            lineHeight: 1.35, wordBreak: "break-word",
                                        }}>
                                            {data.holderName}
                                        </span>
                                    </div>
                                ) : (
                                    <div style={{
                                        height: 34, flexShrink: 0,
                                        display: "flex", alignItems: "center", gap: 8,
                                        background: "#fafafa", border: "1px dashed #e5e7eb",
                                        borderRadius: 8, padding: "0 10px",
                                    }}>
                                        <div style={{
                                            width: 24, height: 24, borderRadius: 8, flexShrink: 0,
                                            display: "flex", alignItems: "center", justifyContent: "center",
                                            background: "#f1f5f9", border: "1.5px dashed #e2e8f0",
                                        }}>
                                            <UserOutlined style={{ fontSize: 11, color: "#cbd5e1" }} />
                                        </div>
                                        <span style={{
                                            fontFamily: "'Be Vietnam Pro',sans-serif",
                                            fontSize: 11, fontWeight: 400, color: "#9ca3af", fontStyle: "italic",
                                        }}>
                                            Chưa có người phụ trách
                                        </span>
                                    </div>
                                )}
                            </div>

                            <div style={{
                                height: 34, flexShrink: 0,
                                borderTop: "1px solid #f3f4f6",
                                background: "#fafafa", padding: "0 12px",
                                display: "flex", alignItems: "center", justifyContent: "space-between",
                            }}>
                                {hasLevel ? (
                                    <span style={{
                                        fontSize: 9.5, fontWeight: 600,
                                        fontFamily: "'JetBrains Mono',monospace",
                                        letterSpacing: "0.08em", color: "#e8637a",
                                        background: "linear-gradient(135deg,#fff0f3,#ffe4ea)",
                                        border: "1px solid #ffd6e0",
                                        borderRadius: 5, padding: "2px 8px",
                                        textTransform: "uppercase", flexShrink: 0,
                                        maxWidth: 100, overflow: "hidden",
                                        textOverflow: "ellipsis", whiteSpace: "nowrap",
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
                                            display: "flex", alignItems: "center", gap: 4,
                                            fontSize: 10, fontWeight: 600,
                                            fontFamily: "'Be Vietnam Pro',sans-serif",
                                            letterSpacing: "0.05em",
                                            color: jdHover ? "#374151" : "#6b7280",
                                            background: jdHover ? "#f3f4f6" : "#ffffff",
                                            border: `1px solid ${jdHover ? "#d1d5db" : "#e5e7eb"}`,
                                            borderRadius: 5, cursor: "pointer", padding: "3px 10px",
                                            transition: "all 0.15s ease",
                                            boxShadow: jdHover ? "0 1px 4px rgba(0,0,0,.08)" : "none",
                                        }}
                                    >
                                        <FileTextOutlined style={{ fontSize: 9 }} />
                                        Xem JD
                                    </button>
                                ) : <span />}
                            </div>
                        </>
                    )}
                </div>
            </div>

            <Handle type="source" position={Position.Bottom}
                style={{ background: "transparent", border: "none", width: 1, height: 1, bottom: 0 }} />
        </>
    );
};

export default OrgNodeCard;