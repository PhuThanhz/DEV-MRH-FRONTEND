import { useCallback, useMemo, useState } from "react";
import ReactFlow, {
    Background,
    Controls,
    MiniMap,
    Handle,
    Position,
    applyNodeChanges,
    applyEdgeChanges,
    ReactFlowProvider,
} from "reactflow";

import type {
    Node,
    Edge,
    NodeProps,
    NodeChange,
    EdgeChange,
} from "reactflow";

import "reactflow/dist/style.css";
import dagre from "dagre";
import type { CSSProperties } from "react";

// ===========================================================
// POSITIONS DATA - Tất cả các vị trí trong sơ đồ
// ===========================================================
const POSITIONS = [
    // Cấp cao nhất
    { id: "gms", nameVN: "GMS", levelCode: "TOP", color: "#ffffff" },
    { id: "bod", nameVN: "BOD", levelCode: "TOP", color: "#ffffff" },

    // Ban kiểm soát
    { id: "auditInternal", nameVN: "Ban kiểm soát nội bộ", levelCode: "CTRL", color: "#ffffff" },
    { id: "auditRisk", nameVN: "Kiểm soát tuân thủ", levelCode: "CTRL", color: "#ffffff" },
    { id: "auditEnv", nameVN: "Kiểm soát rủi ro", levelCode: "CTRL", color: "#ffffff" },

    // C-Level
    { id: "ceo", nameVN: "CHỦ TỊCH\nHĐQT/ CEO", levelCode: "C-LEVEL", color: "#ffffff" },
    { id: "coo", nameVN: "Giám đốc điều hành\nCOO", levelCode: "C-LEVEL", color: "#ffffff" },

    // Trợ lý & Chuyên môn
    { id: "assistant", nameVN: "Ban Trợ lý - thư ký", levelCode: "SUPPORT", color: "#ffffff" },
    { id: "legalAdvisor", nameVN: "Ban quản trị Vận và nghề nghiệp", levelCode: "SUPPORT", color: "#ffffff" },
    { id: "expertAdvisor", nameVN: "Ban Dự án Chuyên đồi số", levelCode: "SUPPORT", color: "#ffffff" },

    // Các phòng ban chính - BU (Business Units)
    { id: "bu1", nameVN: "BU1", levelCode: "BU", color: "#ffffff" },
    { id: "bu2", nameVN: "BU2", levelCode: "BU", color: "#ffffff" },
    { id: "bu3", nameVN: "BU3", levelCode: "BU", color: "#ffffff" },

    // Giám đốc vận hành BU
    { id: "buOpsDirector", nameVN: "Giám đốc Vận hành", levelCode: "DIR", color: "#ffffff" },
    { id: "buOpsDeputy", nameVN: "Trợ lý Giám đốc\nVận hành", levelCode: "DEP", color: "#ffffff" },

    // Các nhãn hàng thuộc BU
    { id: "unias", nameVN: "Nhãn Unias", levelCode: "BRAND", color: "#ffffff" },
    { id: "tokyo", nameVN: "Nhãn Tokyo", levelCode: "BRAND", color: "#ffffff" },
    { id: "chayeda", nameVN: "Nhãn Chayeda Premium", levelCode: "BRAND", color: "#ffffff" },
    { id: "meruhime", nameVN: "Nhãn Meruhime Urban", levelCode: "BRAND", color: "#ffffff" },
    { id: "cornhibaya", nameVN: "Nhãn Corn Hibiaya", levelCode: "BRAND", color: "#ffffff" },
    { id: "conserve", nameVN: "Nhãn Conserve", levelCode: "BRAND", color: "#ffffff" },
    { id: "yoshitoya", nameVN: "Nhãn Yoshitoya", levelCode: "BRAND", color: "#ffffff" },
    { id: "coldmania", nameVN: "Nhãn Cold Mania", levelCode: "BRAND", color: "#ffffff" },

    // Marketing
    { id: "marketing", nameVN: "Marketing", levelCode: "DEPT", color: "#ffffff" },
    { id: "mktDirector", nameVN: "Giám đốc MKT", levelCode: "DIR", color: "#ffffff" },
    { id: "digitalMkt", nameVN: "Trưởng phòng Digital\nMKT & CRM", levelCode: "MGR", color: "#ffffff" },
    { id: "qlBu2", nameVN: "Trưởng phòng QL\ndự án phát triển sản\nphẩm BU2", levelCode: "MGR", color: "#ffffff" },
    { id: "marketResearch", nameVN: "Trưởng phòng\nThời kỳ - Sáng tạo", levelCode: "MGR", color: "#ffffff" },
    { id: "brandMkt", nameVN: "Trưởng phòng\nBrand MKT", levelCode: "MGR", color: "#ffffff" },

    // BDR (Business Development & Research)
    { id: "bdr", nameVN: "BDR", levelCode: "DEPT", color: "#ffffff" },
    { id: "bdrDirector", nameVN: "Giám đốc BDR", levelCode: "DIR", color: "#ffffff" },
    { id: "businessDev", nameVN: "Trưởng phòng\nBusiness\nDevelopment", levelCode: "MGR", color: "#ffffff" },
    { id: "kando", nameVN: "Trưởng phòng\nKando", levelCode: "MGR", color: "#ffffff" },
    { id: "opsInspection", nameVN: "Trưởng phòng\nKiểm soát vận hành", levelCode: "MGR", color: "#ffffff" },

    // HCNS (Hành chính Nhân sự)
    { id: "hcns", nameVN: "HCNS", levelCode: "DEPT", color: "#ffffff" },
    { id: "hcnsDirector", nameVN: "Giám đốc Nhân sự", levelCode: "DIR", color: "#ffffff" },
    { id: "fgdNhanSu", nameVN: "PGĐ Nhân sự", levelCode: "DEP", color: "#ffffff" },
    { id: "adminOps", nameVN: "Trưởng phòng\nHành chính\nNhân sự", levelCode: "MGR", color: "#ffffff" },

    // Legal
    { id: "legal", nameVN: "Legal", levelCode: "DEPT", color: "#ffffff" },
    { id: "legalDirector", nameVN: "Giám đốc Pháp lý", levelCode: "DIR", color: "#ffffff" },
    { id: "legalHead", nameVN: "Trưởng phòng\nPháp lý", levelCode: "MGR", color: "#ffffff" },

    // Xây dựng dự án
    { id: "construction", nameVN: "Xây dựng dự án", levelCode: "DEPT", color: "#ffffff" },
    { id: "constructionDirector", nameVN: "Giám đốc\nXây dựng dự án", levelCode: "DIR", color: "#ffffff" },
    { id: "projectDev", nameVN: "Trưởng phòng\nXây dựng dự án", levelCode: "MGR", color: "#ffffff" },
    { id: "projectPlan", nameVN: "Trưởng phòng\nPhân tích\nmặt bằng", levelCode: "MGR", color: "#ffffff" },

    // Tài chính kế toán
    { id: "finance", nameVN: "Tài chính\nkế toán", levelCode: "DEPT", color: "#ffffff" },
    { id: "financeDirector", nameVN: "Giám đốc Tài chính", levelCode: "DIR", color: "#ffffff" },
    { id: "accountingSbu", nameVN: "Trưởng phòng Kế\ntoán SBU FnB", levelCode: "MGR", color: "#ffffff" },
    { id: "accountingHead", nameVN: "Trưởng phòng\nTài chính", levelCode: "MGR", color: "#ffffff" },
    { id: "accountingVljr", nameVN: "Kế toán trưởng\nVLJR", levelCode: "MGR", color: "#ffffff" },
    { id: "accountingTyl", nameVN: "Kế toán trưởng\nTYL", levelCode: "MGR", color: "#ffffff" },
    { id: "accountingSbuPlan", nameVN: "Phố Phóng Kế\ntoán SBU FnB\nthiết kế và phát\ntriển", levelCode: "MGR", color: "#ffffff" },

    // Thư mua
    { id: "procurement", nameVN: "Thu mua", levelCode: "DEPT", color: "#ffffff" },
    { id: "procurementDirector", nameVN: "Giám đốc Thu mua", levelCode: "DIR", color: "#ffffff" },
    { id: "procurementHead", nameVN: "Trưởng phòng\nThu mua", levelCode: "MGR", color: "#ffffff" },

    // Bottom sections
    { id: "vnOps", nameVN: "KHỐI VẬN HÀNH", levelCode: "DIVISION", color: "#ffffff" },
    { id: "support", nameVN: "KHỐI HỖ TRỢ", levelCode: "DIVISION", color: "#ffffff" },

    // Soản thảo, R&D, QC
    { id: "rdSection", nameVN: "SOẢN THẢO", levelCode: "SECTION", color: "#ffffff" },
    { id: "rdDept", nameVN: "R&D", levelCode: "SECTION", color: "#ffffff" },
    { id: "qcSection", nameVN: "QC DUYỆT", levelCode: "SECTION", color: "#ffffff" },
];

// ===========================================================
// ORG STRUCTURE - Cấu trúc tổ chức với parent-child
// ===========================================================
const ORG = [
    // Top level
    { id: "n1", pos: "gms", parent: null },
    { id: "n2", pos: "bod", parent: "n1" },

    // Ban kiểm soát
    { id: "n3", pos: "auditInternal", parent: null },
    { id: "n4", pos: "auditRisk", parent: "n3" },
    { id: "n5", pos: "auditEnv", parent: "n3" },

    // CEO level
    { id: "n6", pos: "ceo", parent: "n2" },
    { id: "n7", pos: "coo", parent: "n6" },

    // CEO direct reports (Trợ lý, Ban quản trị, Dự án)
    { id: "n8", pos: "assistant", parent: "n6" },
    { id: "n9", pos: "legalAdvisor", parent: "n6" },
    { id: "n10", pos: "expertAdvisor", parent: "n6" },

    // BU Units under COO
    { id: "n11", pos: "bu1", parent: "n7" },
    { id: "n12", pos: "bu2", parent: "n7" },
    { id: "n13", pos: "bu3", parent: "n7" },

    // Marketing under COO
    { id: "n14", pos: "marketing", parent: "n7" },
    { id: "n15", pos: "mktDirector", parent: "n14" },
    { id: "n16", pos: "digitalMkt", parent: "n15" },
    { id: "n17", pos: "qlBu2", parent: "n15" },
    { id: "n18", pos: "marketResearch", parent: "n15" },
    { id: "n19", pos: "brandMkt", parent: "n15" },

    // BDR under COO
    { id: "n20", pos: "bdr", parent: "n7" },
    { id: "n21", pos: "bdrDirector", parent: "n20" },
    { id: "n22", pos: "businessDev", parent: "n21" },
    { id: "n23", pos: "kando", parent: "n21" },
    { id: "n24", pos: "opsInspection", parent: "n21" },

    // HCNS under COO
    { id: "n25", pos: "hcns", parent: "n7" },
    { id: "n26", pos: "hcnsDirector", parent: "n25" },
    { id: "n27", pos: "fgdNhanSu", parent: "n26" },
    { id: "n28", pos: "adminOps", parent: "n27" },

    // Legal under COO
    { id: "n29", pos: "legal", parent: "n7" },
    { id: "n30", pos: "legalDirector", parent: "n29" },
    { id: "n31", pos: "legalHead", parent: "n30" },

    // Construction under COO
    { id: "n32", pos: "construction", parent: "n7" },
    { id: "n33", pos: "constructionDirector", parent: "n32" },
    { id: "n34", pos: "projectDev", parent: "n33" },
    { id: "n35", pos: "projectPlan", parent: "n33" },

    // Finance under COO
    { id: "n36", pos: "finance", parent: "n7" },
    { id: "n37", pos: "financeDirector", parent: "n36" },
    { id: "n38", pos: "accountingSbu", parent: "n37" },
    { id: "n39", pos: "accountingHead", parent: "n37" },
    { id: "n40", pos: "accountingVljr", parent: "n38" },
    { id: "n41", pos: "accountingTyl", parent: "n38" },
    { id: "n42", pos: "accountingSbuPlan", parent: "n38" },

    // Procurement under COO
    { id: "n43", pos: "procurement", parent: "n7" },
    { id: "n44", pos: "procurementDirector", parent: "n43" },
    { id: "n45", pos: "procurementHead", parent: "n44" },

    // BU Operations
    { id: "n46", pos: "buOpsDirector", parent: "n11" },
    { id: "n47", pos: "buOpsDeputy", parent: "n46" },

    // Brands under BU
    { id: "n48", pos: "unias", parent: "n47" },
    { id: "n49", pos: "tokyo", parent: "n47" },
    { id: "n50", pos: "chayeda", parent: "n47" },
    { id: "n51", pos: "meruhime", parent: "n47" },
    { id: "n52", pos: "cornhibaya", parent: "n47" },
    { id: "n53", pos: "conserve", parent: "n47" },
    { id: "n54", pos: "yoshitoya", parent: "n47" },
    { id: "n55", pos: "coldmania", parent: "n47" },

    // Bottom divisions
    { id: "n56", pos: "vnOps", parent: null },
    { id: "n57", pos: "support", parent: null },

    // Bottom sections
    { id: "n58", pos: "rdSection", parent: null },
    { id: "n59", pos: "rdDept", parent: null },
    { id: "n60", pos: "qcSection", parent: null },
];

// ===========================================================
// HELPER FUNCTIONS
// ===========================================================
const getRelatedNodes = (id: string) => {
    const ancestors = new Set<string>();
    const descendants = new Set<string>();

    let node = ORG.find((n) => n.id === id);
    while (node?.parent) {
        ancestors.add(node.parent);
        node = ORG.find((n) => n.id === node?.parent);
    }

    const queue = [id];
    while (queue.length) {
        const cur = queue.shift()!;
        const children = ORG.filter((n) => n.parent === cur);
        children.forEach((c) => {
            descendants.add(c.id);
            queue.push(c.id);
        });
    }

    return { current: id, ancestors, descendants };
};

// ===========================================================
// CUSTOM NODE COMPONENT
// ===========================================================
const LotusOrgNode = ({
    data,
    id,
}: NodeProps<{
    label: string;
    level?: string;
    color?: string;
    onHover?: (id: string | null) => void;
    isHighlighted?: boolean | null;
    highlightType?: 'current' | 'ancestor' | 'descendant' | null;
}>) => {
    const isDivision = data.level === "DIVISION" || data.level === "SECTION";
    const isTop = data.level === "TOP";
    const isCEO = id === "n6";

    const nodeStyle = (() => {
        if (data.isHighlighted === false) return { opacity: 0.3, transform: 'scale(1)' };
        if (data.isHighlighted == null) return { opacity: 1, transform: 'scale(1)' };

        switch (data.highlightType) {
            case 'current':
                return { transform: 'scale(1.08)', border: '3px solid #1976d2', boxShadow: '0 0 20px rgba(25,118,210,0.6)' };
            case 'ancestor':
                return { transform: 'scale(1.04)', border: '2.5px solid #ff9800', boxShadow: '0 0 16px rgba(255,152,0,0.5)' };
            case 'descendant':
                return { transform: 'scale(1.02)', border: '2px solid #42a5f5', boxShadow: '0 0 12px rgba(66,165,245,0.4)' };
            default:
                return { transform: 'scale(1)' };
        }
    })();

    const boxStyle: CSSProperties = {
        width: isDivision ? 180 : 160,
        minHeight: isDivision ? 50 : (isTop ? 65 : 70),
        padding: isDivision ? "8px 12px" : "10px 14px",
        borderRadius: isDivision ? 8 : 12,
        background: "rgba(255, 255, 255, 0.95)",
        backdropFilter: "blur(10px)",
        WebkitBackdropFilter: "blur(10px)",
        border: data.isHighlighted ? nodeStyle.border : "2px solid rgba(226, 232, 240, 0.8)",
        boxShadow: nodeStyle.boxShadow || "0 8px 32px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.5)",
        textAlign: "center",
        transition: "all 0.35s cubic-bezier(0.4, 0, 0.2, 1)",
        cursor: "pointer",
        fontSize: isDivision ? 12 : (isCEO ? 15 : 13),
        fontWeight: isCEO ? 800 : (isTop ? 700 : 600),
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        whiteSpace: "pre-line",
        lineHeight: 1.3,
        transform: nodeStyle.transform,
        opacity: nodeStyle.opacity,
        color: "#1e293b",
        position: "relative",
        overflow: "hidden",
    } as CSSProperties;

    return (
        <>
            {!isDivision && <Handle type="target" position={Position.Top} style={{ opacity: 0 }} />}

            <div
                style={boxStyle}
                onMouseEnter={() => data.onHover?.(id)}
                onMouseLeave={() => data.onHover?.(null)}
            >
                {/* Shine overlay effect */}
                <div style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    height: "50%",
                    background: "linear-gradient(180deg, rgba(255,255,255,0.6) 0%, rgba(255,255,255,0) 100%)",
                    borderRadius: "12px 12px 0 0",
                    pointerEvents: "none",
                }} />

                <div style={{ position: "relative", zIndex: 1 }}>
                    {data.label}
                </div>
            </div>

            {!isDivision && <Handle type="source" position={Position.Bottom} style={{ opacity: 0 }} />}
        </>
    );
};

const nodeTypes = { lotus: LotusOrgNode };

// ===========================================================
// DAGRE LAYOUT với điều chỉnh cho sơ đồ phức tạp
// ===========================================================
const getLayouted = (nodes: Node[], edges: Edge[]) => {
    const graph = new dagre.graphlib.Graph();
    graph.setGraph({
        rankdir: "TB",
        nodesep: 80,      // Khoảng cách ngang giữa các node
        ranksep: 120,     // Khoảng cách dọc giữa các tầng
        edgesep: 40,      // Khoảng cách giữa các edge
        marginx: 50,
        marginy: 50,
    });
    graph.setDefaultEdgeLabel(() => ({}));

    // Set node dimensions
    nodes.forEach((n) => {
        const pos = POSITIONS.find(p => p.id === n.data.posId);
        const isDivision = pos?.levelCode === "DIVISION" || pos?.levelCode === "SECTION";
        graph.setNode(n.id, {
            width: isDivision ? 180 : 160,
            height: isDivision ? 50 : 70
        });
    });

    edges.forEach((e) => graph.setEdge(e.source, e.target));

    dagre.layout(graph);

    const layoutedNodes = nodes.map((n) => {
        const pos = graph.node(n.id);
        const posData = POSITIONS.find(p => p.id === n.data.posId);
        const isDivision = posData?.levelCode === "DIVISION" || posData?.levelCode === "SECTION";

        return {
            ...n,
            position: {
                x: pos.x - (isDivision ? 90 : 80),
                y: pos.y - (isDivision ? 25 : 35)
            },
        };
    });

    return { nodes: layoutedNodes, edges };
};

// ===========================================================
// MAIN COMPONENT
// ===========================================================
const LotusHoldingsOrgChart = () => {
    const [hovered, setHovered] = useState<string | null>(null);

    const baseNodes = useMemo(
        () =>
            ORG.map((o) => {
                const pos = POSITIONS.find((p) => p.id === o.pos)!;

                return {
                    id: o.id,
                    type: "lotus",
                    position: { x: 0, y: 0 },
                    data: {
                        label: pos.nameVN,
                        level: pos.levelCode,
                        color: pos.color,
                        posId: o.pos,
                        onHover: setHovered,
                    },
                };
            }),
        []
    );

    const baseEdges = useMemo(
        () =>
            ORG.filter((o) => o.parent).map((o) => ({
                id: `e-${o.parent}-${o.id}`,
                source: o.parent!,
                target: o.id,
                type: "smoothstep",
                style: { stroke: "#90a4ae", strokeWidth: 2 },
                animated: false,
            })),
        []
    );

    const { nodes: layoutNodes, edges: layoutEdges } = useMemo(
        () => getLayouted(baseNodes, baseEdges),
        [baseNodes, baseEdges]
    );

    const [nodes, setNodes] = useState<Node[]>(layoutNodes);
    const [edges, setEdges] = useState<Edge[]>(layoutEdges);

    const relations = useMemo(() => (hovered ? getRelatedNodes(hovered) : null), [hovered]);

    // Update nodes with highlight info
    const displayedNodes = useMemo(() => {
        return nodes.map((node) => {
            let isHighlighted: boolean | null = null;
            let highlightType: 'current' | 'ancestor' | 'descendant' | null = null;

            if (relations) {
                if (node.id === relations.current) {
                    isHighlighted = true;
                    highlightType = 'current';
                } else if (relations.ancestors.has(node.id)) {
                    isHighlighted = true;
                    highlightType = 'ancestor';
                } else if (relations.descendants.has(node.id)) {
                    isHighlighted = true;
                    highlightType = 'descendant';
                } else {
                    isHighlighted = false;
                }
            }

            return {
                ...node,
                data: {
                    ...node.data,
                    isHighlighted,
                    highlightType,
                },
            };
        });
    }, [nodes, relations]);

    // Update edges with highlight
    const highlightedEdges = useMemo(() => {
        return edges.map((edge) => {
            let style = { ...edge.style };
            let animated = false;

            if (relations) {
                const isSourceCurrent = edge.source === relations.current;
                const isTargetCurrent = edge.target === relations.current;
                const isSourceAncestor = relations.ancestors.has(edge.source);
                const isTargetAncestor = relations.ancestors.has(edge.target);
                const isSourceDescendant = relations.descendants.has(edge.source);
                const isTargetDescendant = relations.descendants.has(edge.target);

                if ((isSourceAncestor && isTargetCurrent) || (isSourceAncestor && isTargetAncestor)) {
                    style = { ...style, stroke: '#ff9800', strokeWidth: 3 };
                    animated = true;
                } else if (isSourceCurrent && isTargetDescendant) {
                    style = { ...style, stroke: '#1976d2', strokeWidth: 3 };
                    animated = true;
                } else if (isSourceDescendant && isTargetDescendant) {
                    style = { ...style, stroke: '#42a5f5', strokeWidth: 2.5 };
                    animated = true;
                } else {
                    style = { ...style, opacity: 0.2 };
                }
            }

            return { ...edge, style, animated };
        });
    }, [edges, relations]);

    const onNodesChange = useCallback(
        (changes: NodeChange[]) => setNodes((nds) => applyNodeChanges(changes, nds)),
        []
    );

    const onEdgesChange = useCallback(
        (changes: EdgeChange[]) => setEdges((eds) => applyEdgeChanges(changes, eds)),
        []
    );

    return (
        <ReactFlowProvider>
            <div style={{ width: "100%", height: "100vh", background: "#fafafa" }}>
                <ReactFlow
                    nodes={displayedNodes}
                    edges={highlightedEdges}
                    nodeTypes={nodeTypes}
                    fitView
                    fitViewOptions={{ padding: 0.2 }}
                    minZoom={0.1}
                    maxZoom={2}
                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChange}
                    nodesDraggable={true}
                    nodesConnectable={false}
                    elementsSelectable={true}
                >
                    <Background gap={20} color="#e0e0e0" />
                    <Controls />
                    <MiniMap
                        nodeColor={(node) => {
                            const pos = POSITIONS.find(p => p.id === node.data.posId);
                            return pos?.color || "#fff";
                        }}
                        maskColor="rgba(0,0,0,0.1)"
                    />

                    {/* Header Panel */}
                    <div style={{
                        position: "absolute",
                        top: 20,
                        left: 20,
                        zIndex: 5,
                        background: "white",
                        padding: "16px 28px",
                        borderRadius: 12,
                        boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
                        border: "2px solid #e3f2fd",
                    }}>

                    </div>
                </ReactFlow>

                <div style={{
                    position: "absolute",
                    bottom: 20,
                    right: 20,
                    zIndex: 10,
                    background: "white",
                    padding: "10px 16px",
                    borderRadius: 8,
                    boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                    fontSize: 11,
                }}>
                    <div style={{ marginBottom: 4 }}>
                        <span style={{ display: "inline-block", width: 12, height: 12, background: "#1976d2", marginRight: 6, borderRadius: 2 }}></span>
                        Current (hover)
                    </div>
                    <div style={{ marginBottom: 4 }}>
                        <span style={{ display: "inline-block", width: 12, height: 12, background: "#ff9800", marginRight: 6, borderRadius: 2 }}></span>
                        Cấp trên
                    </div>
                    <div>
                        <span style={{ display: "inline-block", width: 12, height: 12, background: "#42a5f5", marginRight: 6, borderRadius: 2 }}></span>
                        Cấp dưới
                    </div>
                </div>
            </div>
        </ReactFlowProvider>
    );
};

export default LotusHoldingsOrgChart;