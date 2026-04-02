import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { Button, message } from "antd";
import { PlusOutlined, ReloadOutlined, ApartmentOutlined } from "@ant-design/icons";
import { unstable_batchedUpdates } from "react-dom";

import ReactFlow, {
    Background,
    Controls,
    MiniMap,
    addEdge,
    useReactFlow,
    ReactFlowProvider,
    type Node,
    type Edge,
    type Connection,
    type NodeChange,
    type EdgeChange,
    applyNodeChanges,
    applyEdgeChanges,
    type EdgeProps,
} from "reactflow";
import "reactflow/dist/style.css";
import dagre from "dagre";

import { useOrgChartsQuery, useCreateOrgChartMutation } from "@/hooks/useOrgCharts";
import {
    useCreateOrgNodeMutation,
    useUpdateOrgNodeMutation,
    useDeleteOrgNodeMutation,
} from "@/hooks/useOrgNodes";
import Access from "@/components/share/access";
import { ALL_PERMISSIONS } from "@/config/permissions";
import { callFetchOrgNodes, callUpdateOrgNode, callFetchJobDescriptions } from "@/config/api";
import ModalNode, { type BulkNodeItem } from "./modal.node";
import OrgNodeCard, { type OrgNodeData } from "./OrgNodeCard";

// ✅ Import ViewJobDescription thật — chỉnh path cho đúng project của bạn
import ViewJobDescription, { type EnrichedJD } from "../../job-description/view.job-description/index";

interface Props {
    ownerType: "COMPANY" | "DEPARTMENT";
    ownerId: number;
}

interface IOrgNode {
    id: number;
    name?: string | null;
    level?: string | null;
    holderName?: string | null;
    isGoal?: boolean;
    parentId?: number | null;
    posX?: number | null;
    posY?: number | null;
    jobDescriptionId?: number | null;
}

// ── Edge renderer ─────────────────────────────────────────────────────────────
const OrgEdge = ({ id, sourceX, sourceY, targetX, targetY, data }: EdgeProps) => {
    const midY = (sourceY + targetY) / 2;
    const d = `M ${sourceX} ${sourceY} L ${sourceX} ${midY} L ${targetX} ${midY} L ${targetX} ${targetY}`;
    const edgeType: string = data?.edgeType ?? "none";
    const stroke =
        edgeType === "ancestor" ? "#60a5fa" :
            edgeType === "descendant" ? "#f59e0b" :
                "#94a3b8";
    const strokeWidth = edgeType === "none" ? 1.5 : 2.5;
    const strokeOpacity = edgeType === "none" && data?.dimmed ? 0.15 : edgeType === "none" ? 0.85 : 1;
    const strokeDasharray = edgeType === "ancestor" ? "6 4" : undefined;
    return (
        <path id={id} d={d} fill="none"
            stroke={stroke} strokeWidth={strokeWidth}
            strokeOpacity={strokeOpacity} strokeDasharray={strokeDasharray}
            style={{ transition: "stroke 0.15s, stroke-width 0.15s, stroke-opacity 0.15s" }}
        />
    );
};

// ── Layout ────────────────────────────────────────────────────────────────────
const NODE_W = 200;
const NODE_H = 130;

const getLayoutedElements = (nodes: Node[], edges: Edge[]) => {
    const g = new dagre.graphlib.Graph();
    g.setGraph({ rankdir: "TB", ranksep: 100, nodesep: 60 });
    g.setDefaultEdgeLabel(() => ({}));
    nodes.forEach((n) => g.setNode(n.id, { width: NODE_W, height: NODE_H }));
    edges.forEach((e) => g.setEdge(e.source, e.target));
    dagre.layout(g);
    return {
        nodes: nodes.map((n) => {
            const pos = g.node(n.id);
            return { ...n, position: { x: pos.x - NODE_W / 2, y: pos.y - NODE_H / 2 } };
        }),
        edges,
    };
};

const EDGE_DEFAULTS = { type: "orgEdge" } satisfies Partial<Edge>;

// ── Graph traversal ───────────────────────────────────────────────────────────
const getAncestorIds = (nodeId: string, edges: Edge[]): Set<string> => {
    const result = new Set<string>();
    let current = nodeId;
    for (; ;) {
        const p = edges.find((e) => e.target === current);
        if (!p) break;
        result.add(p.source);
        current = p.source;
    }
    return result;
};

const getDescendantIds = (nodeId: string, edges: Edge[]): Set<string> => {
    const result = new Set<string>();
    const queue = [nodeId];
    while (queue.length > 0) {
        const cur = queue.shift()!;
        for (const e of edges) {
            if (e.source === cur) { result.add(e.target); queue.push(e.target); }
        }
    }
    return result;
};

// ── Pure highlight calculator ─────────────────────────────────────────────────
const applyHighlight = (
    nodes: Node[], edges: Edge[], hoveredId: string | null,
): { nodes: Node[]; edges: Edge[] } => {
    if (!hoveredId) {
        return {
            nodes: nodes.map((n) =>
                n.data.highlightState === "idle" ? n : { ...n, data: { ...n.data, highlightState: "idle" } }
            ),
            edges: edges.map((e) =>
                !e.data?.edgeType || (e.data.edgeType === "none" && !e.data.dimmed)
                    ? e : { ...e, data: { edgeType: "none", dimmed: false } }
            ),
        };
    }
    const ancestorIds = getAncestorIds(hoveredId, edges);
    const descendantIds = getDescendantIds(hoveredId, edges);
    const relatedIds = new Set([hoveredId, ...ancestorIds, ...descendantIds]);

    const newNodes = nodes.map((n) => {
        const hs: OrgNodeData["highlightState"] =
            n.id === hoveredId ? "active" :
                ancestorIds.has(n.id) ? "ancestor" :
                    descendantIds.has(n.id) ? "descendant" : "dimmed";
        return n.data.highlightState === hs ? n : { ...n, data: { ...n.data, highlightState: hs } };
    });

    const newEdges = edges.map((e) => {
        const isAnc =
            (ancestorIds.has(e.source) || e.source === hoveredId) &&
            (ancestorIds.has(e.target) || e.target === hoveredId) &&
            !descendantIds.has(e.source);
        const isDes =
            (descendantIds.has(e.target) || e.target === hoveredId) &&
            (descendantIds.has(e.source) || e.source === hoveredId) &&
            !ancestorIds.has(e.target);
        const edgeType = isAnc ? "ancestor" : isDes ? "descendant" : "none";
        const dimmed = !relatedIds.has(e.source) && !relatedIds.has(e.target);
        if (e.data?.edgeType === edgeType && e.data?.dimmed === dimmed) return e;
        return { ...e, data: { edgeType, dimmed } };
    });

    return { nodes: newNodes, edges: newEdges };
};

// ─────────────────────────────────────────────────────────────────────────────

const OrgChartInner = ({ ownerType, ownerId }: Props) => {
    const query = ownerType === "COMPANY" ? `filter=companyId:${ownerId}` : `filter=departmentId:${ownerId}`;
    const { fitView } = useReactFlow();

    // ✅ Thay jdPosition giả bằng jdRecord thật (chỉ cần id)
    const [jdOpen, setJdOpen] = useState(false);
    const [jdRecord, setJdRecord] = useState<EnrichedJD | null>(null);

    const [jdOptions, setJdOptions] = useState<{ value: number; label: string }[]>([]);
    const { data } = useOrgChartsQuery(query);
    const createChart = useCreateOrgChartMutation();
    const createNode = useCreateOrgNodeMutation();
    const updateNode = useUpdateOrgNodeMutation();
    const deleteNode = useDeleteOrgNodeMutation();

    const [chartId, setChartId] = useState<number | null>(null);
    const [nodes, setNodes] = useState<Node[]>([]);
    const [edges, setEdges] = useState<Edge[]>([]);
    const [openModal, setOpenModal] = useState(false);
    const [editingNode, setEditingNode] = useState<Node | null>(null);
    const [pendingSaves, setPendingSaves] = useState<Map<string, { x: number; y: number }>>(new Map());
    const [isSaving, setIsSaving] = useState(false);

    const nodesRef = useRef<Node[]>([]);
    const edgesRef = useRef<Edge[]>([]);
    nodesRef.current = nodes;
    edgesRef.current = edges;

    const nodeTypes = useMemo(() => ({ orgNode: OrgNodeCard }), []);
    const edgeTypes = useMemo(() => ({ orgEdge: OrgEdge }), []);

    const applyHighlightNow = useCallback((hoveredId: string | null) => {
        const { nodes: n, edges: e } = applyHighlight(nodesRef.current, edgesRef.current, hoveredId);
        unstable_batchedUpdates(() => { setNodes(n); setEdges(e); });
    }, []);

    useEffect(() => {
        callFetchJobDescriptions("filter=status='PUBLISHED'&page=1&pageSize=200")
            .then((res) => {
                const list = (res.data as any)?.result ?? [];
                setJdOptions(list.map((jd: any) => ({
                    value: jd.id,
                    label: `${jd.code}${jd.jobTitleName ? " — " + jd.jobTitleName : ""}`,
                })));
            }).catch(() => { });
    }, []);

    useEffect(() => {
        if (nodes.length === 0) return;
        const t = setTimeout(() => fitView({ padding: 0.08, minZoom: 0.75, maxZoom: 0.9, duration: 400 }), 50);
        return () => clearTimeout(t);
    }, [nodes.length]); // eslint-disable-line

    useEffect(() => {
        setChartId(null); setNodes([]); setEdges([]); setPendingSaves(new Map());
    }, [ownerId]);

    useEffect(() => {
        if (!data) return;
        const chart = data?.result?.[0];
        if (chart?.id) { setChartId(chart.id); loadNodes(chart.id); }
        else if (data?.meta !== undefined) handleCreateChart();
    }, [data]); // eslint-disable-line

    const handleCreateChart = useCallback(async () => {
        try {
            const res = await createChart.mutateAsync({
                name: "Sơ đồ tổ chức", chartType: ownerType,
                ...(ownerType === "COMPANY" ? { companyId: ownerId } : { departmentId: ownerId }),
            });
            const id = (res as any)?.id ?? (res as any)?.data?.id ?? (res as any)?.result?.id;
            if (id) { setChartId(id); setNodes([]); setEdges([]); }
        } catch { }
    }, [ownerType, ownerId]); // eslint-disable-line

    const loadNodes = useCallback(async (id: number) => {
        const res = await callFetchOrgNodes(id);
        const raw = res.data as any;
        const nodeList: IOrgNode[] = Array.isArray(raw) ? raw : Array.isArray(raw?.data) ? raw.data : [];

        const rfNodes: Node[] = nodeList.map((n) => ({
            id: String(n.id), type: "orgNode", position: { x: 0, y: 0 },
            data: {
                title: n.name ?? "Position",
                levelCode: n.level ?? "",
                holderName: n.holderName ?? "",
                isGoal: n.isGoal ?? false,
                // ✅ Lưu jobDescriptionId thật từ API vào node.data
                jobDescriptionId: n.jobDescriptionId ?? null,
                highlightState: "idle",
                onEdit: () => { }, onDelete: () => { }, onJD: () => { },
                onMouseEnter: () => { }, onMouseLeave: () => { },
            } as OrgNodeData,
        }));

        const rfEdges: Edge[] = nodeList.filter((n) => n.parentId).map((n) => ({
            id: `e-${n.parentId}-${n.id}`, source: String(n.parentId), target: String(n.id),
            ...EDGE_DEFAULTS, data: { edgeType: "none", dimmed: false },
        }));

        const { nodes: dagreNodes, edges: dagreEdges } = getLayoutedElements(rfNodes, rfEdges);
        const finalNodes = dagreNodes.map((node) => {
            const saved = nodeList.find((n) => String(n.id) === node.id);
            return saved?.posX != null && saved?.posY != null
                ? { ...node, position: { x: saved.posX, y: saved.posY } }
                : node;
        });

        const withCbs = finalNodes.map((node) => {
            // ✅ Lấy jobDescriptionId từ node.data đã được set ở rfNodes
            const jdId = node.data.jobDescriptionId as number | null;

            return {
                ...node,
                data: {
                    ...node.data,
                    onEdit: () => handleOpenEdit(node),
                    onDelete: () => handleDeleteNode(Number(node.id), id),
                    onJD: () => {
                        // ✅ Nếu node có JD thật → mở ViewJobDescription
                        // Nếu không có → thông báo
                        if (jdId) {
                            setJdRecord({ id: jdId } as EnrichedJD);
                            setJdOpen(true);
                        } else {
                            message.info("Vị trí này chưa được gắn JD nào.");
                        }
                    },
                    onMouseEnter: () => applyHighlightNow(node.id),
                    onMouseLeave: () => applyHighlightNow(null),
                } as OrgNodeData,
            };
        });

        unstable_batchedUpdates(() => { setNodes(withCbs); setEdges(dagreEdges); });
    }, [ownerType, applyHighlightNow]); // eslint-disable-line

    const handleNodeDragStop = useCallback((_: unknown, node: Node) => {
        setPendingSaves((prev) => { const next = new Map(prev); next.set(node.id, { x: node.position.x, y: node.position.y }); return next; });
    }, []);

    const handleSavePositions = useCallback(async () => {
        if (!chartId || pendingSaves.size === 0) return;
        setIsSaving(true);
        const count = pendingSaves.size;
        try {
            await Promise.all(Array.from(pendingSaves.entries()).map(([nodeId, pos]) =>
                callUpdateOrgNode({ id: Number(nodeId), posX: Math.round(pos.x), posY: Math.round(pos.y) })
            ));
            setPendingSaves(new Map());
            message.success(`Đã lưu vị trí ${count} node!`);
        } catch { message.error("Lưu vị trí thất bại, thử lại nhé!"); }
        finally { setIsSaving(false); }
    }, [chartId, pendingSaves]);

    const handleResetPositions = useCallback(async () => {
        if (!chartId) return;
        setPendingSaves(new Map());
        await loadNodes(chartId);
        message.success("Đã khôi phục vị trí đã lưu!");
    }, [chartId, loadNodes]);

    const handleAutoLayout = useCallback(() => {
        if (nodes.length === 0) return;
        const { nodes: laid } = getLayoutedElements(nodes.map((n) => ({ ...n, position: { x: 0, y: 0 } })), edges);
        setNodes(laid.map((node) => ({ ...node, data: nodesRef.current.find((n) => n.id === node.id)?.data ?? node.data })));
        setPendingSaves((prev) => { const next = new Map(prev); laid.forEach((n) => next.set(n.id, { x: n.position.x, y: n.position.y })); return next; });
        setTimeout(() => fitView({ padding: 0.08, minZoom: 0.75, maxZoom: 0.9, duration: 400 }), 50);
        message.success("Đã căn chỉnh sơ đồ!");
    }, [nodes, edges, fitView]);

    const handleConnect = useCallback(async (connection: Connection) => {
        if (!chartId || !connection.source || !connection.target) return;
        setEdges((eds) => addEdge({ ...connection, ...EDGE_DEFAULTS }, eds));
        await updateNode.mutateAsync({ id: Number(connection.target), parentId: Number(connection.source) });
        message.success("Đã kết nối node!");
    }, [chartId, updateNode]);

    const onNodesChange = useCallback((changes: NodeChange[]) => setNodes((nds) => applyNodeChanges(changes, nds)), []);
    const onEdgesChange = useCallback((changes: EdgeChange[]) => setEdges((eds) => applyEdgeChanges(changes, eds)), []);

    const handleDeleteNode = useCallback(async (nodeId: number, cId: number) => {
        await deleteNode.mutateAsync(nodeId); loadNodes(cId);
    }, [deleteNode, loadNodes]);

    const handleOpenEdit = useCallback((node: Node) => { setEditingNode(node); setOpenModal(true); }, []);

    const handleSubmit = useCallback(async (values: {
        title: string; levelCode: string; holderName?: string;
        parentId?: number | null; isGoal?: boolean; jobDescriptionId?: number | null;
    }) => {
        if (!chartId) return;
        if (editingNode) {
            await updateNode.mutateAsync({
                id: Number(editingNode.id), name: values.title, level: values.levelCode,
                holderName: values.holderName ?? null, parentId: values.parentId ?? null,
                isGoal: values.isGoal ?? false, jobDescriptionId: values.jobDescriptionId ?? null,
            });
        } else {
            await createNode.mutateAsync({
                chartId, name: values.title, level: values.levelCode,
                holderName: values.holderName ?? null, parentId: values.parentId ?? null,
                isGoal: values.isGoal ?? false, jobDescriptionId: values.jobDescriptionId ?? null,
            });
        }
        setOpenModal(false); setEditingNode(null); loadNodes(chartId);
    }, [chartId, editingNode, createNode, updateNode, loadNodes]);

    const handleBulkSubmit = useCallback(async (items: BulkNodeItem[]) => {
        if (!chartId) return;
        setOpenModal(false);
        const createdIds = new Map<number, number>();
        let successCount = 0;
        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            try {
                const parentId = item.existingParentId != null
                    ? item.existingParentId
                    : item.parentIndex !== null
                        ? (createdIds.get(item.parentIndex) ?? null)
                        : null;
                const res = await createNode.mutateAsync({
                    chartId, name: item.title, level: item.levelCode,
                    holderName: item.holderName ?? null, parentId,
                    isGoal: false, jobDescriptionId: null,
                });
                const newId = (res as any)?.id ?? (res as any)?.data?.id ?? (res as any)?.result?.id;
                if (newId) createdIds.set(i, Number(newId));
                successCount++;
            } catch { }
        }
        message.success(`Đã tạo ${successCount}/${items.length} node!`);
        loadNodes(chartId);
    }, [chartId, createNode, loadNodes]);

    const handleCloseModal = useCallback(() => { setOpenModal(false); setEditingNode(null); }, []);

    return (
        <div style={{
            height: "calc(100vh - 160px)", minHeight: 600,
            background: "#f8f9fb", borderRadius: 12,
            position: "relative", border: "1px solid #e8ecf0", overflow: "hidden",
        }}>
            <div style={{ position: "absolute", top: 12, right: 12, zIndex: 10, display: "flex", gap: 8 }}>
                <Access permission={ALL_PERMISSIONS.ORG_NODES.UPDATE} hideChildren>
                    {pendingSaves.size > 0 && (
                        <Button loading={isSaving} onClick={handleSavePositions}
                            style={{ borderColor: "#faad14", color: "#faad14", fontWeight: 600 }}>
                            Lưu vị trí ({pendingSaves.size})
                        </Button>
                    )}
                </Access>
                <Access permission={ALL_PERMISSIONS.ORG_NODES.UPDATE} hideChildren>
                    <Button icon={<ReloadOutlined />} onClick={handleResetPositions}
                        style={{ borderColor: "#d1d5db", color: "#6b7280", fontWeight: 500 }}>Hoàn tác</Button>
                </Access>
                <Access permission={ALL_PERMISSIONS.ORG_NODES.UPDATE} hideChildren>
                    <Button icon={<ApartmentOutlined />} onClick={handleAutoLayout}
                        style={{ borderColor: "#d1d5db", color: "#6b7280", fontWeight: 500 }}>Tự căn chỉnh</Button>
                </Access>
                <Access permission={ALL_PERMISSIONS.ORG_NODES.CREATE} hideChildren>
                    <Button icon={<PlusOutlined />} onClick={() => { setEditingNode(null); setOpenModal(true); }}
                        style={{ background: "#e8637a", borderColor: "#e8637a", color: "#fff", fontWeight: 600, boxShadow: "0 2px 8px rgba(232,99,122,.3)" }}>
                        Thêm vị trí
                    </Button>
                </Access>
            </div>
            <ReactFlow
                nodes={nodes} edges={edges}
                nodeTypes={nodeTypes} edgeTypes={edgeTypes}
                nodesDraggable nodesConnectable elementsSelectable
                onNodesChange={onNodesChange} onEdgesChange={onEdgesChange}
                onNodeDragStop={handleNodeDragStop} onConnect={handleConnect}
                minZoom={0.2} maxZoom={2} defaultEdgeOptions={EDGE_DEFAULTS}
            >
                <MiniMap nodeColor="#fda4af" maskColor="rgba(0,0,0,0.04)" style={{ borderRadius: 8 }} />
                <Controls showInteractive={false} />
                <Background color="#e5e7eb" gap={20} />
            </ReactFlow>

            <ModalNode
                open={openModal} onClose={handleCloseModal}
                onSubmit={handleSubmit}
                onBulkSubmit={handleBulkSubmit}
                nodes={nodes} jdOptions={jdOptions}
                initialValues={editingNode ? {
                    title: editingNode.data.title as string,
                    levelCode: editingNode.data.levelCode as string,
                    holderName: (editingNode.data.holderName as string) ?? "",
                    isGoal: (editingNode.data.isGoal as boolean) ?? false,
                    jobDescriptionId: (editingNode.data.jobDescriptionId as number) ?? null,
                    parentId: (() => {
                        const pe = edges.find((e) => e.target === editingNode.id);
                        return pe ? Number(pe.source) : null;
                    })(),
                } : undefined}
                isEditing={!!editingNode}
            />

            {/* ✅ Thay Drawer + JDViewDetail giả bằng ViewJobDescription thật */}
            <ViewJobDescription
                open={jdOpen}
                onClose={() => { setJdOpen(false); setJdRecord(null); }}
                record={jdRecord}
            />
        </div>
    );
};

const OrgChartFlow = (props: Props) => (
    <ReactFlowProvider><OrgChartInner {...props} /></ReactFlowProvider>
);

export default OrgChartFlow;