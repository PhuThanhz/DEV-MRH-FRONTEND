import { useRef } from "react";
import { CloseOutlined, UserOutlined, ApartmentOutlined, TeamOutlined, ArrowUpOutlined } from "@ant-design/icons";
import type { Node, Edge } from "reactflow";

interface Props {
    nodeId: string | null;
    nodes: Node[];
    edges: Edge[];
    anchorPos?: { x: number; y: number } | null;
    onClose: () => void;
    isMobile?: boolean;
    isTablet?: boolean;
}

const MiniPanel = ({ nodeId, nodes, edges, anchorPos, onClose, isMobile = false, isTablet = false }: Props) => {
    const panelRef = useRef<HTMLDivElement>(null);

    const PANEL_W = isMobile ? 200 : 228;
    const PANEL_H = 280;
    const ARROW_W = 9;
    const OFFSET = 6;
    const NODE_W = isMobile ? 160 : isTablet ? 185 : 220;
    const NODE_H = isMobile ? 120 : isTablet ? 150 : 185;

    if (!nodeId) return null;
    const node = nodes.find((n) => n.id === nodeId);
    if (!node) return null;

    const parentEdge = edges.find((e) => e.target === nodeId);
    const parentNode = parentEdge ? nodes.find((n) => n.id === parentEdge.source) : null;
    const parentTitle = parentNode?.data.title as string | undefined;
    const parentHolder = parentNode?.data.holderName as string | undefined;
    const directChildren = edges.filter((e) => e.source === nodeId).length;

    const countDescendants = (id: string): number => {
        const children = edges.filter((e) => e.source === id).map((e) => e.target);
        return children.reduce((acc, cid) => acc + 1 + countDescendants(cid), 0);
    };
    const totalDescendants = countDescendants(nodeId);

    const { title, levelCode, holderName, isGoal } = node.data as {
        title: string; levelCode?: string; holderName?: string; isGoal?: boolean;
    };

    // ── Tính vị trí + hướng arrow ────────────────────────────────────────────
    const computeLayout = () => {
        if (!anchorPos) {
            return {
                panelStyle: { position: "absolute" as const, bottom: 16, right: 16 },
                arrowStyle: { display: "none" } as React.CSSProperties,
                arrowInnerStyle: { display: "none" } as React.CSSProperties,
            };
        }

        const container = panelRef.current?.closest(".react-flow") as HTMLElement | null;
        const containerW = container?.offsetWidth ?? window.innerWidth;
        const containerH = container?.offsetHeight ?? window.innerHeight;

        const spaceRight = containerW - anchorPos.x;
        const flipLeft = spaceRight < PANEL_W + ARROW_W + OFFSET + 16;

        let left: number;
        let arrowLeft: number;
        let arrowBorder: React.CSSProperties;
        let arrowInnerBorder: React.CSSProperties;

        if (flipLeft) {
            left = anchorPos.x - NODE_W - PANEL_W - ARROW_W - OFFSET * 2;
            arrowLeft = left + PANEL_W;
            arrowBorder = { borderLeft: "8px solid rgba(226,232,240,0.9)", borderRight: "none" };
            arrowInnerBorder = { borderLeft: "7px solid #ffffff", borderRight: "none", left: -9 };
        } else {
            left = anchorPos.x + OFFSET;
            arrowLeft = left - ARROW_W;
            arrowBorder = { borderRight: "8px solid rgba(226,232,240,0.9)", borderLeft: "none" };
            arrowInnerBorder = { borderRight: "7px solid #ffffff", borderLeft: "none", left: 1 };
        }

        if (left < 8) left = 8;
        if (left + PANEL_W > containerW - 8) left = containerW - PANEL_W - 8;

        let top = anchorPos.y + NODE_H / 2 - PANEL_H / 2;
        if (top < 50) top = 50;
        if (top + PANEL_H > containerH - 8) top = containerH - PANEL_H - 8;

        const arrowTop = top + 16;

        return {
            panelStyle: { position: "absolute" as const, top, left, bottom: "auto", right: "auto" },
            arrowStyle: {
                position: "absolute" as const,
                top: arrowTop, left: arrowLeft,
                width: 0, height: 0,
                borderTop: "7px solid transparent",
                borderBottom: "7px solid transparent",
                zIndex: 21,
                ...arrowBorder,
            } as React.CSSProperties,
            arrowInnerStyle: {
                position: "absolute" as const,
                top: arrowTop + 1, left: arrowLeft + 1,
                width: 0, height: 0,
                borderTop: "6px solid transparent",
                borderBottom: "6px solid transparent",
                zIndex: 22,
                ...arrowInnerBorder,
            } as React.CSSProperties,
        };
    };

    const { panelStyle, arrowStyle, arrowInnerStyle } = computeLayout();

    const fs = {
        label: isMobile ? 9 : 10,
        value: isMobile ? 12 : 12.5,
        title: isMobile ? 13 : 14,
        badge: isMobile ? 8 : 9,
        icon: isMobile ? 10 : 11,
        subValue: isMobile ? 10.5 : 11,
    };

    // ── Row cho stat đơn giản (cấp dưới / tổng) ──────────────────────────────
    const StatRow = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) => (
        <div style={{
            display: "flex", alignItems: "center", gap: 8,
            padding: "5px 0",
            borderTop: "1px solid #f1f5f9",
        }}>
            <span style={{ color: "#cbd5e1", flexShrink: 0 }}>{icon}</span>
            <span style={{ fontSize: fs.label, color: "#94a3b8", fontFamily: "'Be Vietnam Pro',sans-serif", flex: 1 }}>
                {label}
            </span>
            <span style={{ fontSize: fs.label + 1, fontWeight: 700, color: "#475569", fontFamily: "'Be Vietnam Pro',sans-serif" }}>
                {value}
            </span>
        </div>
    );

    return (
        <>
            <style>{`
                @keyframes panelIn {
                    from { opacity: 0; transform: scale(0.96) translateY(4px); }
                    to   { opacity: 1; transform: scale(1) translateY(0); }
                }
            `}</style>

            {/* Arrow border */}
            <div style={arrowStyle} />
            {/* Arrow fill */}
            <div style={arrowInnerStyle} />

            {/* Panel */}
            <div
                ref={panelRef}
                style={{
                    ...panelStyle,
                    zIndex: 20,
                    width: PANEL_W,
                    background: "#ffffff",
                    border: "1px solid #e2e8f0",
                    borderRadius: 12,
                    boxShadow: "0 8px 32px rgba(15,23,42,0.10), 0 2px 8px rgba(15,23,42,0.06)",
                    overflow: "hidden",
                    animation: "panelIn 0.18s ease",
                }}
            >
                {/* ── Header ── */}
                <div style={{
                    padding: isMobile ? "10px 11px 8px" : "11px 13px 9px",
                    background: "linear-gradient(135deg, #fff5f7 0%, #fafafa 100%)",
                    borderBottom: "1px solid #f1f5f9",
                    display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8,
                }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                        {/* Badges */}
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 5 }}>
                            {levelCode && (
                                <span style={{
                                    fontSize: fs.badge, fontWeight: 700,
                                    fontFamily: "'JetBrains Mono',monospace",
                                    letterSpacing: "0.08em", color: "#e8637a",
                                    background: "#fff0f3", border: "1px solid #fecdd3",
                                    borderRadius: 5, padding: "2px 6px",
                                    textTransform: "uppercase",
                                }}>
                                    {levelCode}
                                </span>
                            )}
                            {isGoal && (
                                <span style={{
                                    fontSize: fs.badge, fontWeight: 700,
                                    fontFamily: "'Be Vietnam Pro',sans-serif",
                                    background: "#f5f0ff", color: "#7c3aed",
                                    border: "1px solid #ddd6fe",
                                    borderRadius: 5, padding: "2px 6px",
                                }}>
                                    🎯 Mục tiêu
                                </span>
                            )}
                        </div>
                        {/* Title */}
                        <div style={{
                            fontSize: fs.title, fontWeight: 800, color: "#0f172a",
                            fontFamily: "'Be Vietnam Pro',sans-serif",
                            lineHeight: 1.3, letterSpacing: "-0.01em",
                        }}>
                            {title}
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        style={{
                            background: "#f8fafc", border: "1px solid #e2e8f0",
                            cursor: "pointer", color: "#94a3b8",
                            width: 22, height: 22, flexShrink: 0,
                            display: "flex", alignItems: "center", justifyContent: "center",
                            borderRadius: 6, transition: "all 0.12s",
                            padding: 0,
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background = "#f1f5f9";
                            e.currentTarget.style.color = "#334155";
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = "#f8fafc";
                            e.currentTarget.style.color = "#94a3b8";
                        }}
                    >
                        <CloseOutlined style={{ fontSize: 9 }} />
                    </button>
                </div>

                {/* ── Người phụ trách ── */}
                <div style={{
                    padding: isMobile ? "9px 11px" : "10px 13px",
                    borderBottom: "1px solid #f1f5f9",
                    background: "#fff",
                }}>
                    <div style={{
                        fontSize: fs.label, color: "#94a3b8",
                        fontFamily: "'Be Vietnam Pro',sans-serif",
                        marginBottom: 5, display: "flex", alignItems: "center", gap: 5,
                    }}>
                        <UserOutlined style={{ fontSize: fs.icon - 1 }} />
                        Người phụ trách
                    </div>
                    {holderName ? (
                        <div style={{
                            display: "flex", alignItems: "center", gap: 8,
                            background: "#f8fafc", border: "1px solid #e2e8f0",
                            borderRadius: 8, padding: "6px 9px",
                        }}>
                            <div style={{
                                width: isMobile ? 22 : 26, height: isMobile ? 22 : 26,
                                borderRadius: 7, flexShrink: 0,
                                background: "linear-gradient(135deg, #f43f5e, #fb923c)",
                                display: "flex", alignItems: "center", justifyContent: "center",
                            }}>
                                <UserOutlined style={{ fontSize: isMobile ? 10 : 11, color: "#fff" }} />
                            </div>
                            <span style={{
                                fontSize: fs.value, fontWeight: 700, color: "#0f172a",
                                fontFamily: "'Be Vietnam Pro',sans-serif",
                                lineHeight: 1.3, wordBreak: "break-word",
                            }}>
                                {holderName}
                            </span>
                        </div>
                    ) : (
                        <div style={{
                            display: "flex", alignItems: "center", gap: 8,
                            background: "#f8fafc", border: "1px dashed #e2e8f0",
                            borderRadius: 8, padding: "6px 9px",
                        }}>
                            <div style={{
                                width: isMobile ? 22 : 26, height: isMobile ? 22 : 26,
                                borderRadius: 7, flexShrink: 0,
                                background: "#f1f5f9", border: "1.5px dashed #e2e8f0",
                                display: "flex", alignItems: "center", justifyContent: "center",
                            }}>
                                <UserOutlined style={{ fontSize: isMobile ? 10 : 11, color: "#cbd5e1" }} />
                            </div>
                            <span style={{
                                fontSize: fs.subValue, color: "#94a3b8",
                                fontStyle: "italic", fontFamily: "'Be Vietnam Pro',sans-serif",
                            }}>
                                Chưa có người phụ trách
                            </span>
                        </div>
                    )}
                </div>

                {/* ── Cấp trên trực tiếp ── */}
                <div style={{
                    padding: isMobile ? "9px 11px" : "10px 13px",
                    borderBottom: "1px solid #f1f5f9",
                    background: "#fff",
                }}>
                    <div style={{
                        fontSize: fs.label, color: "#94a3b8",
                        fontFamily: "'Be Vietnam Pro',sans-serif",
                        marginBottom: 5, display: "flex", alignItems: "center", gap: 5,
                    }}>
                        <ArrowUpOutlined style={{ fontSize: fs.icon - 1 }} />
                        Cấp trên trực tiếp
                    </div>
                    {parentNode ? (
                        <div style={{
                            background: "#f8fafc", border: "1px solid #e2e8f0",
                            borderRadius: 8, padding: "6px 9px",
                        }}>
                            <div style={{
                                fontSize: fs.value, fontWeight: 700, color: "#0f172a",
                                fontFamily: "'Be Vietnam Pro',sans-serif",
                                lineHeight: 1.3, marginBottom: 2,
                            }}>
                                {parentTitle}
                            </div>
                            {parentHolder ? (
                                <div style={{
                                    fontSize: fs.subValue, color: "#64748b",
                                    fontFamily: "'Be Vietnam Pro',sans-serif", fontWeight: 500,
                                }}>
                                    {parentHolder}
                                </div>
                            ) : (
                                <div style={{
                                    fontSize: fs.subValue, color: "#94a3b8",
                                    fontFamily: "'Be Vietnam Pro',sans-serif", fontStyle: "italic",
                                }}>
                                    Chưa có người phụ trách
                                </div>
                            )}
                        </div>
                    ) : (
                        <div style={{
                            background: "#f8fafc", border: "1px dashed #e2e8f0",
                            borderRadius: 8, padding: "6px 9px",
                        }}>
                            <span style={{
                                fontSize: fs.subValue, color: "#94a3b8",
                                fontStyle: "italic", fontFamily: "'Be Vietnam Pro',sans-serif",
                            }}>
                                Không có
                            </span>
                        </div>
                    )}
                </div>

                {/* ── Stats: cấp dưới + tổng ── */}
                <div style={{ padding: isMobile ? "5px 11px 7px" : "5px 13px 8px", background: "#fafafa" }}>
                    <StatRow
                        icon={<ApartmentOutlined style={{ fontSize: fs.icon }} />}
                        label="Cấp dưới trực tiếp"
                        value={`${directChildren} vị trí`}
                    />
                    <StatRow
                        icon={<TeamOutlined style={{ fontSize: fs.icon }} />}
                        label="Tổng cấp dưới"
                        value={`${totalDescendants} vị trí`}
                    />
                </div>
            </div>
        </>
    );
};

export default MiniPanel;