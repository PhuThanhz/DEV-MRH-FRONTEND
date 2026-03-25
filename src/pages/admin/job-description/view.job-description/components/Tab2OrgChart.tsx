import { Spin } from "antd";
import ReactFlow, { Background, Controls, type Node, type Edge } from "reactflow";
import "reactflow/dist/style.css";
import OrgFlowNode from "./OrgFlowNode";
import OrgEdge from "./OrgEdge";
import { useMemo } from "react";

const ACCENT = "#e8637a";

interface Props {
    loading: boolean;
    nodes: Node[];
    edges: Edge[];
}

const Tab2OrgChart = ({ loading, nodes, edges }: Props) => {
    const nodeTypes = useMemo(() => ({ orgFlowNode: OrgFlowNode }), []);
    const edgeTypes = useMemo(() => ({ orgEdge: OrgEdge }), []);

    return (
        <div style={{
            background: "#fff", borderRadius: 14,
            border: "1px solid #eef0f5",
            boxShadow: "0 2px 10px rgba(0,0,0,.045)", overflow: "hidden",
        }}>
            <div style={{
                padding: "14px 20px", borderBottom: "1px solid #f3f4f6",
                display: "flex", alignItems: "center", justifyContent: "space-between",
            }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: "#9ca3af", letterSpacing: "0.1em", textTransform: "uppercase" }}>
                    Sơ đồ tổ chức
                </span>
                <div style={{ display: "flex", gap: 14 }}>
                    {[{ color: "#9ca3af", label: "Vị trí khác" }, { color: ACCENT, label: "Vị trí JD này" }].map((item) => (
                        <div key={item.label} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: "#6b7280" }}>
                            <span style={{ width: 7, height: 7, borderRadius: "50%", background: item.color }} />
                            {item.label}
                        </div>
                    ))}
                </div>
            </div>

            {loading ? (
                <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: 420 }}>
                    <Spin tip="Đang tải sơ đồ..." />
                </div>
            ) : nodes.length === 0 ? (
                <div style={{ padding: 40, textAlign: "center", color: "#9ca3af" }}>
                    Phòng ban này chưa có sơ đồ tổ chức
                </div>
            ) : (
                <div style={{ height: 460 }}>
                    <ReactFlow
                        nodes={nodes} edges={edges}
                        nodeTypes={nodeTypes} edgeTypes={edgeTypes}
                        fitView fitViewOptions={{ padding: 0.25 }}
                        nodesDraggable={false} nodesConnectable={false}
                        elementsSelectable={false} zoomOnScroll panOnDrag
                        minZoom={0.3} maxZoom={1.5}
                        proOptions={{ hideAttribution: true }}
                    >
                        <Background color="#f3f4f6" gap={20} />
                        <Controls showInteractive={false} />
                    </ReactFlow>
                </div>
            )}
        </div>
    );
};

export default Tab2OrgChart;