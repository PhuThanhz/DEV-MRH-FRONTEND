import { CloseOutlined, UserOutlined, ApartmentOutlined, TeamOutlined, ArrowUpOutlined } from "@ant-design/icons";
import type { Node, Edge } from "reactflow";

interface Props {
    nodeId: string | null;
    nodes: Node[];
    edges: Edge[];
    onClose: () => void;
}

const MiniPanel = ({ nodeId, nodes, edges, onClose }: Props) => {
    if (!nodeId) return null;

    const node = nodes.find((n) => n.id === nodeId);
    if (!node) return null;

    // cấp trên trực tiếp
    const parentEdge = edges.find((e) => e.target === nodeId);
    const parentNode = parentEdge ? nodes.find((n) => n.id === parentEdge.source) : null;
    const parentTitle = parentNode?.data.title as string | undefined;
    const parentHolder = parentNode?.data.holderName as string | undefined;

    // số cấp dưới trực tiếp
    const directChildren = edges.filter((e) => e.source === nodeId).length;

    // tổng cấp dưới (đệ quy)
    const countDescendants = (id: string): number => {
        const children = edges.filter((e) => e.source === id).map((e) => e.target);
        return children.reduce((acc, cid) => acc + 1 + countDescendants(cid), 0);
    };
    const totalDescendants = countDescendants(nodeId);

    const { title, levelCode, holderName, isGoal } = node.data as {
        title: string;
        levelCode?: string;
        holderName?: string;
        isGoal?: boolean;
    };

    const Row = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) => (
        <div style={{ display: "flex", alignItems: "flex-start", gap: 8, padding: "6px 0", borderBottom: "1px solid #f3f4f6" }}>
            <span style={{ color: "#9ca3af", marginTop: 1, flexShrink: 0 }}>{icon}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 10, color: "#9ca3af", fontFamily: "'Be Vietnam Pro',sans-serif", marginBottom: 1 }}>
                    {label}
                </div>
                <div style={{ fontSize: 12, fontWeight: 600, color: "#111827", fontFamily: "'Be Vietnam Pro',sans-serif", wordBreak: "break-word" }}>
                    {value}
                </div>
            </div>
        </div>
    );

    return (
        <div style={{
            position: "absolute", bottom: 16, right: 16, zIndex: 20,
            width: 240,
            background: "#ffffff",
            border: "1px solid #e8ecf0",
            borderRadius: 12,
            boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
            overflow: "hidden",
            animation: "panelIn 0.15s ease",
        }}>
            <style>{`@keyframes panelIn { from { opacity:0; transform:translateY(6px) } to { opacity:1; transform:translateY(0) } }`}</style>

            {/* Header */}
            <div style={{
                padding: "10px 12px 8px",
                borderBottom: "1px solid #f3f4f6",
                display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8,
            }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                    {levelCode && (
                        <span style={{
                            display: "inline-block", marginBottom: 4,
                            fontSize: 9, fontWeight: 600,
                            fontFamily: "'JetBrains Mono',monospace",
                            letterSpacing: "0.08em", color: "#e8637a",
                            background: "#fff0f3", border: "1px solid #ffd6e0",
                            borderRadius: 4, padding: "1px 6px",
                            textTransform: "uppercase",
                        }}>
                            {levelCode}
                        </span>
                    )}
                    {isGoal && (
                        <span style={{
                            display: "inline-block", marginBottom: 4, marginLeft: levelCode ? 4 : 0,
                            fontSize: 9, fontWeight: 700,
                            fontFamily: "'Be Vietnam Pro',sans-serif",
                            background: "#f5f0ff", color: "#7c3aed",
                            border: "1px solid #ddd6fe",
                            borderRadius: 4, padding: "1px 6px",
                        }}>
                            🎯 Mục tiêu
                        </span>
                    )}
                    <div style={{
                        fontSize: 13, fontWeight: 700, color: "#111827",
                        fontFamily: "'Be Vietnam Pro',sans-serif",
                        lineHeight: 1.4,
                    }}>
                        {title}
                    </div>
                </div>
                <button
                    onClick={onClose}
                    style={{
                        background: "none", border: "none", cursor: "pointer",
                        color: "#9ca3af", padding: 2, flexShrink: 0,
                        display: "flex", alignItems: "center",
                        borderRadius: 4, transition: "color 0.1s",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = "#374151")}
                    onMouseLeave={(e) => (e.currentTarget.style.color = "#9ca3af")}
                >
                    <CloseOutlined style={{ fontSize: 11 }} />
                </button>
            </div>

            {/* Body */}
            <div style={{ padding: "4px 12px 8px" }}>
                <Row
                    icon={<UserOutlined style={{ fontSize: 11 }} />}
                    label="Người phụ trách"
                    value={holderName
                        ? <span>{holderName}</span>
                        : <span style={{ color: "#9ca3af", fontStyle: "italic", fontWeight: 400 }}>Chưa có</span>
                    }
                />
                <Row
                    icon={<ArrowUpOutlined style={{ fontSize: 11 }} />}
                    label="Cấp trên trực tiếp"
                    value={
                        parentNode ? (
                            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                                <span>{parentTitle}</span>
                                {parentHolder
                                    ? <span style={{ fontSize: 11, fontWeight: 400, color: "#6b7280" }}>{parentHolder}</span>
                                    : <span style={{ fontSize: 11, fontWeight: 400, color: "#9ca3af", fontStyle: "italic" }}>Chưa có người phụ trách</span>
                                }
                            </div>
                        ) : (
                            <span style={{ color: "#9ca3af", fontStyle: "italic", fontWeight: 400 }}>Không có</span>
                        )
                    }
                />
                <Row
                    icon={<ApartmentOutlined style={{ fontSize: 11 }} />}
                    label="Cấp dưới trực tiếp"
                    value={<span>{directChildren} vị trí</span>}
                />
                <div style={{ padding: "6px 0" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <TeamOutlined style={{ fontSize: 11, color: "#9ca3af" }} />
                        <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 10, color: "#9ca3af", fontFamily: "'Be Vietnam Pro',sans-serif", marginBottom: 1 }}>
                                Tổng cấp dưới
                            </div>
                            <div style={{ fontSize: 12, fontWeight: 600, color: "#111827", fontFamily: "'Be Vietnam Pro',sans-serif" }}>
                                {totalDescendants} vị trí
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MiniPanel;