import { useEffect, useState, useCallback, useMemo } from "react";
import {
    Modal, Form, Input, Select, DatePicker,
    Button, Spin, Alert, Tag,
} from "antd";
import { PlusOutlined, MinusCircleOutlined } from "@ant-design/icons";
import type {
    IJobDescription, ICompany, IDepartment,
    IDepartmentJobTitle, IOrgChart, IOrgNode,
} from "@/types/backend";
import {
    useCreateJobDescriptionMutation,
    useUpdateJobDescriptionMutation,
    useJobDescriptionByIdQuery,
} from "@/hooks/useJobDescriptions";
import {
    callFetchCompany,
    callFetchDepartmentsByCompany,
    callFetchCompanyJobTitlesOfDepartment,
    callFetchOrgCharts,
    callFetchOrgNodes,
} from "@/config/api";
import dayjs from "dayjs";
import dagre from "dagre";

import ReactFlow, {
    Background,
    Controls,
    Handle,
    Position,
    type Node,
    type Edge,
    type NodeChange,
    type EdgeChange,
    applyNodeChanges,
    applyEdgeChanges,
    type EdgeProps,
} from "reactflow";
import "reactflow/dist/style.css";

const { TextArea } = Input;

const ACCENT = "#e8637a";

const MODAL_TABS = [
    { key: "1", label: "I. Thông tin chung" },
    { key: "2", label: "II. Sơ đồ vị trí" },
    { key: "3", label: "III. Mô tả công việc" },
    { key: "4", label: "IV. Yêu cầu vị trí" },
];

const NODE_W = 190;
const NODE_H = 80;

// ─── Org Edge ────────────────────────────────────────────────────────────────
const OrgEdge = ({ id, sourceX, sourceY, targetX, targetY }: EdgeProps) => {
    const midY = (sourceY + targetY) / 2;
    const d = `M ${sourceX} ${sourceY} L ${sourceX} ${midY} L ${targetX} ${midY} L ${targetX} ${targetY}`;
    return <path id={id} d={d} fill="none" stroke="#000000" strokeWidth={1.5} />;
};

interface SelectableNodeData {
    label: string;
    levelCode: string;
    selected: boolean;
    matched: boolean;
    onToggle: (id: number) => void;
    nodeId: number;
}

const SelectableNode = ({ data }: { data: SelectableNodeData }) => {
    const isSelected = data.selected;
    const isMatched = data.matched && !data.selected;

    const borderColor = isSelected ? "#3b82f6" : isMatched ? "#f59e0b" : "#e5e7eb";
    const bgColor = isSelected ? "#eff6ff" : isMatched ? "#fffbeb" : "#ffffff";
    const boxShadow = isSelected
        ? "0 8px 24px rgba(59,130,246,.15), 0 0 0 3px rgba(59,130,246,.10)"
        : isMatched
            ? "0 8px 24px rgba(245,158,11,.12), 0 0 0 3px rgba(245,158,11,.10)"
            : "0 1px 4px rgba(0,0,0,.06)";
    const accentBg = isSelected
        ? "#3b82f6"
        : isMatched
            ? "#f59e0b"
            : "linear-gradient(90deg, #1f2937 0%, #6b7280 100%)";
    const textColor = isSelected ? "#1d4ed8" : isMatched ? "#92400e" : "#111827";
    const footerBg = isSelected ? "#dbeafe" : isMatched ? "#fef3c7" : "#fafafa";

    return (
        <>
            <Handle type="target" position={Position.Top}
                style={{ background: "#d1d5db", width: 6, height: 6, border: "none" }} />
            <div
                onClick={() => data.onToggle(data.nodeId)}
                style={{
                    width: NODE_W, background: bgColor, borderRadius: 10,
                    border: `2px solid ${borderColor}`, boxShadow,
                    overflow: "hidden", cursor: "pointer", transition: "all 0.18s ease",
                }}
            >
                <div style={{ height: 3, background: accentBg }} />
                <div style={{
                    height: NODE_H - 3 - 34, padding: "0 14px",
                    display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                    <span style={{
                        fontFamily: "'Outfit', 'Nunito', 'Segoe UI', sans-serif",
                        fontWeight: 600, fontSize: 12.5, color: textColor,
                        textAlign: "center", lineHeight: 1.55, letterSpacing: "0.01em",
                        display: "-webkit-box", WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical", overflow: "hidden",
                    }}>
                        {data.label}
                    </span>
                </div>
                <div style={{
                    height: 34, borderTop: "1px solid #f3f4f6", background: footerBg,
                    padding: "0 12px", display: "flex", alignItems: "center",
                    justifyContent: "center", gap: 6,
                }}>
                    {data.levelCode && (
                        <span style={{
                            fontSize: 10, fontWeight: 700,
                            fontFamily: "'Outfit', monospace",
                            letterSpacing: "0.08em", textTransform: "uppercase",
                            color: isSelected ? "#1d4ed8" : isMatched ? "#92400e" : "#e8637a",
                            background: isSelected ? "#bfdbfe" : isMatched ? "#fde68a" : "#fff0f3",
                            border: `1px solid ${isSelected ? "#93c5fd" : isMatched ? "#fcd34d" : "#ffd6dd"}`,
                            borderRadius: 20, padding: "1px 10px", lineHeight: "18px",
                        }}>
                            {data.levelCode}
                        </span>
                    )}
                    {data.levelCode && isSelected && (
                        <div style={{ width: 1, height: 12, background: "#e5e7eb", flexShrink: 0 }} />
                    )}
                    {isSelected && (
                        <span style={{
                            fontSize: 10, fontWeight: 700, color: "#1d4ed8",
                            background: "#bfdbfe", border: "1px solid #93c5fd",
                            borderRadius: 20, padding: "1px 8px", lineHeight: "18px",
                        }}>
                            ✓ Đã chọn
                        </span>
                    )}
                </div>
            </div>
            <Handle type="source" position={Position.Bottom}
                style={{ background: "#d1d5db", width: 6, height: 6, border: "none" }} />
        </>
    );
};

// ─── Dagre layout ─────────────────────────────────────────────────────────────
const getLayoutedElements = (nodes: Node[], edges: Edge[]) => {
    const g = new dagre.graphlib.Graph();
    g.setGraph({ rankdir: "TB", ranksep: 80, nodesep: 60 });
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

interface Props {
    open: boolean;
    onClose: () => void;
    editRecord: IJobDescription | null;
}

export default function ModalJobDescription({ open, onClose, editRecord }: Props) {
    const [form] = Form.useForm();
    const isEdit = !!editRecord;

    const jdId = useMemo(() => {
        if (!editRecord) return undefined;
        return (editRecord as any).id ?? (editRecord as any).jdId;
    }, [editRecord]);

    const { data: fullJd, isLoading: loadingFullJd } = useJobDescriptionByIdQuery(
        isEdit && open ? jdId : undefined
    );

    const [companies, setCompanies] = useState<ICompany[]>([]);
    const [departments, setDepartments] = useState<IDepartment[]>([]);
    const [jobTitles, setJobTitles] = useState<IDepartmentJobTitle[]>([]);

    const [loadingCompanies, setLoadingCompanies] = useState(false);
    const [loadingDepartments, setLoadingDepartments] = useState(false);
    const [loadingJobTitles, setLoadingJobTitles] = useState(false);

    const [selectedCompanyId, setSelectedCompanyId] = useState<number | null>(null);
    const [selectedDepartmentId, setSelectedDepartmentId] = useState<number | null>(null);
    const [selectedJobTitleName, setSelectedJobTitleName] = useState<string | null>(null);

    const [charts, setCharts] = useState<IOrgChart[]>([]);
    const [rawNodes, setRawNodes] = useState<IOrgNode[]>([]);
    const [loadingChart, setLoadingChart] = useState(false);
    const [selectedChartId, setSelectedChartId] = useState<number | null>(null);
    const [selectedNodeIds, setSelectedNodeIds] = useState<number[]>([]);

    const [rfNodes, setRfNodes] = useState<Node[]>([]);
    const [rfEdges, setRfEdges] = useState<Edge[]>([]);

    const nodeTypes = useMemo(() => ({ selectableNode: SelectableNode }), []);
    const edgeTypes = useMemo(() => ({ orgEdge: OrgEdge }), []);

    const createMutation = useCreateJobDescriptionMutation();
    const updateMutation = useUpdateJobDescriptionMutation();
    const isPending = createMutation.isPending || updateMutation.isPending;

    const [activeTab, setActiveTab] = useState("1");

    const handleToggleNode = useCallback((nodeId: number) => {
        setSelectedNodeIds((prev) =>
            prev.includes(nodeId) ? prev.filter((id) => id !== nodeId) : [...prev, nodeId]
        );
    }, []);

    const buildRfNodes = useCallback((
        raw: IOrgNode[],
        selectedIds: number[],
        onToggle: (id: number) => void,
        matchedName: string | null = null,
    ): { nodes: Node[]; edges: Edge[] } => {
        const rfN: Node[] = raw.map((n) => ({
            id: String(n.id),
            type: "selectableNode",
            position: { x: n.posX ?? 0, y: n.posY ?? 0 },
            data: {
                label: n.name ?? n.title ?? `Node #${n.id}`,
                levelCode: n.levelCode ?? n.level ?? "",
                selected: selectedIds.includes(n.id),
                matched: matchedName
                    ? (n.name ?? n.title ?? "").toLowerCase() === matchedName.toLowerCase()
                    : false,
                onToggle,
                nodeId: n.id,
            } satisfies SelectableNodeData,
        }));

        const rfE: Edge[] = raw
            .filter((n) => n.parentId)
            .map((n) => ({
                id: `e-${n.parentId}-${n.id}`,
                source: String(n.parentId),
                target: String(n.id),
                type: "orgEdge",
            }));

        const { nodes: laid } = getLayoutedElements(rfN, rfE);
        return {
            nodes: laid.map((node) => {
                const saved = raw.find((n) => String(n.id) === node.id);
                if (saved?.posX != null && saved?.posY != null)
                    return { ...node, position: { x: saved.posX, y: saved.posY } };
                return node;
            }),
            edges: rfE,
        };
    }, []);

    // Sync rfNodes khi selectedNodeIds thay đổi
    useEffect(() => {
        if (rawNodes.length === 0) return;
        setRfNodes((prev) =>
            prev.map((n) => ({
                ...n,
                data: {
                    ...n.data,
                    selected: selectedNodeIds.includes(n.data.nodeId),
                    matched: selectedJobTitleName
                        ? n.data.label.toLowerCase() === selectedJobTitleName.toLowerCase()
                        : false,
                    onToggle: handleToggleNode,
                },
            }))
        );
    }, [selectedNodeIds, selectedJobTitleName, handleToggleNode, rawNodes.length]);

    // Load companies khi mở modal
    useEffect(() => {
        if (!open) return;
        setLoadingCompanies(true);
        callFetchCompany("page=1&size=500")
            .then((res: any) => setCompanies(res?.data?.result ?? []))
            .finally(() => setLoadingCompanies(false));
    }, [open]);

    // Reset state khi đóng modal
    useEffect(() => {
        if (!open) {
            form.resetFields();
            setActiveTab("1");
            setSelectedCompanyId(null);
            setSelectedDepartmentId(null);
            setSelectedJobTitleName(null);
            setDepartments([]);
            setJobTitles([]);
            setCharts([]);
            setRawNodes([]);
            setRfNodes([]);
            setRfEdges([]);
            setSelectedChartId(null);
            setSelectedNodeIds([]);
            setLoadingChart(false);
        }
    }, [open, form]);

    // Prefill form khi edit
    useEffect(() => {
        if (!open || !isEdit || !fullJd) return;

        form.setFieldsValue({
            code: fullJd.code,
            reportTo: fullJd.reportTo,
            belongsTo: fullJd.belongsTo,
            collaborateWith: fullJd.collaborateWith,
            effectiveDate: fullJd.effectiveDate ? dayjs(fullJd.effectiveDate) : null,
            companyId: fullJd.companyId,
            departmentId: fullJd.departmentId,
            departmentJobTitleId: fullJd.departmentJobTitleId,
            knowledge: fullJd.requirements?.knowledge ?? null,
            experience: fullJd.requirements?.experience ?? null,
            skills: fullJd.requirements?.skills ?? null,
            qualities: fullJd.requirements?.qualities ?? null,
            otherRequirements: fullJd.requirements?.otherRequirements ?? null,
            tasks: fullJd.tasks?.length
                ? fullJd.tasks
                : [{ orderNo: 1, title: "", content: "" }],
        });

        if (fullJd.companyId) setSelectedCompanyId(fullJd.companyId);
        if (fullJd.departmentId) setSelectedDepartmentId(fullJd.departmentId);

        const prefillRelated = async () => {
            setLoadingChart(true);
            try {
                const promises: Promise<any>[] = [];

                if (fullJd.companyId) {
                    promises.push(
                        callFetchDepartmentsByCompany(fullJd.companyId)
                            .then((res: any) => setDepartments(res?.data ?? []))
                    );
                }

                if (fullJd.departmentId) {
                    promises.push(
                        callFetchCompanyJobTitlesOfDepartment(fullJd.departmentId)
                            .then((res: any) => {
                                const jts: IDepartmentJobTitle[] = res?.data ?? [];
                                setJobTitles(jts);
                                const matched = jts.find((jt) => jt.id === fullJd.departmentJobTitleId);
                                if (matched) setSelectedJobTitleName(matched.jobTitle?.nameVi ?? null);
                            })
                    );
                    promises.push(
                        callFetchOrgCharts(
                            `filter=departmentId='${fullJd.departmentId}'&page=1&pageSize=50`
                        ).then((res: any) => setCharts(res?.data?.result ?? []))
                    );
                }

                await Promise.all(promises);

                if (fullJd.positions?.length) {
                    const firstChartId = fullJd.positions[0].chartId;
                    setSelectedChartId(firstChartId);
                    const preSelectedIds = fullJd.positions.map((p) => p.nodeId);
                    setSelectedNodeIds(preSelectedIds);

                    const res = await callFetchOrgNodes(firstChartId) as any;
                    const raw: IOrgNode[] = res?.data ?? [];
                    setRawNodes(raw);

                    const { nodes: built, edges } = buildRfNodes(raw, preSelectedIds, handleToggleNode);
                    setRfNodes(built);
                    setRfEdges(edges);
                }
            } finally {
                setLoadingChart(false);
            }
        };

        prefillRelated();
    }, [open, isEdit, fullJd]); // eslint-disable-line

    // Init form khi tạo mới
    useEffect(() => {
        if (!open || isEdit) return;
        form.setFieldsValue({
            tasks: [{ orderNo: 1, title: "", content: "" }],
        });
    }, [open, isEdit, form]);

    // ─── Handlers ────────────────────────────────────────────────────────────
    const handleCompanyChange = useCallback(async (companyId: number) => {
        setSelectedCompanyId(companyId);
        setSelectedDepartmentId(null);
        setDepartments([]);
        setJobTitles([]);
        setCharts([]);
        setRawNodes([]);
        setRfNodes([]);
        setRfEdges([]);
        setSelectedChartId(null);
        setSelectedNodeIds([]);
        setSelectedJobTitleName(null);
        form.setFieldsValue({ departmentId: undefined, departmentJobTitleId: undefined });

        setLoadingDepartments(true);
        try {
            const res = await callFetchDepartmentsByCompany(companyId) as any;
            setDepartments(res?.data ?? []);
        } finally {
            setLoadingDepartments(false);
        }
    }, [form]);

    const handleDepartmentChange = useCallback(async (departmentId: number) => {
        setSelectedDepartmentId(departmentId);
        setJobTitles([]);
        setCharts([]);
        setRawNodes([]);
        setRfNodes([]);
        setRfEdges([]);
        setSelectedChartId(null);
        setSelectedNodeIds([]);
        setSelectedJobTitleName(null);
        form.setFieldsValue({ departmentJobTitleId: undefined });

        setLoadingJobTitles(true);
        setLoadingChart(true);
        try {
            const [jtRes, chartRes] = await Promise.all([
                callFetchCompanyJobTitlesOfDepartment(departmentId),
                callFetchOrgCharts(`filter=departmentId='${departmentId}'&page=1&pageSize=50`),
            ]) as any[];
            setJobTitles(jtRes?.data ?? []);
            setCharts(chartRes?.data?.result ?? []);
        } finally {
            setLoadingJobTitles(false);
            setLoadingChart(false);
        }
    }, [form]);

    const handleChartChange = useCallback(async (chartId: number) => {
        setSelectedChartId(chartId);
        setRawNodes([]);
        setRfNodes([]);
        setRfEdges([]);
        setSelectedNodeIds([]);

        const res = await callFetchOrgNodes(chartId) as any;
        const raw: IOrgNode[] = res?.data ?? [];
        setRawNodes(raw);

        const { nodes: built, edges } = buildRfNodes(raw, [], handleToggleNode);
        setRfNodes(built);
        setRfEdges(edges);
    }, [buildRfNodes, handleToggleNode]);

    // ─── Submit ──────────────────────────────────────────────────────────────
    const handleSubmit = async () => {
        try {
            const values = await form.validateFields();

            const positions = selectedNodeIds.map((nodeId) => {
                const n = rawNodes.find((x) => x.id === nodeId);
                return {
                    chartId: selectedChartId!,
                    nodeId,
                    nodeName: n?.name ?? n?.title ?? undefined,
                    levelCode: n?.levelCode ?? n?.level ?? undefined,
                };
            });

            const payload: IJobDescription = {
                code: values.code,
                reportTo: values.reportTo,
                belongsTo: values.belongsTo,
                collaborateWith: values.collaborateWith,
                effectiveDate: values.effectiveDate
                    ? dayjs(values.effectiveDate).toISOString()
                    : undefined,
                companyId: values.companyId,
                departmentId: values.departmentId,
                departmentJobTitleId: values.departmentJobTitleId,
                requirements: {
                    knowledge: values.knowledge ?? null,
                    experience: values.experience ?? null,
                    skills: values.skills ?? null,
                    qualities: values.qualities ?? null,
                    otherRequirements: values.otherRequirements ?? null,
                },
                tasks: (values.tasks ?? []).map((t: any, idx: number) => ({
                    ...t, orderNo: idx + 1,
                })),
                positions,
            };

            if (isEdit && jdId) {
                await updateMutation.mutateAsync({ id: jdId, data: payload });
            } else {
                await createMutation.mutateAsync(payload);
            }
            onClose();
        } catch {
            // validation errors handled by form
        }
    };

    // ─── Tab navigation ──────────────────────────────────────────────────────
    const currentTabIndex = MODAL_TABS.findIndex((t) => t.key === activeTab);
    const isLastTab = activeTab === MODAL_TABS[MODAL_TABS.length - 1].key;

    // Tất cả tabs đều click được tự do
    const handleTabClick = (tabKey: string) => {
        setActiveTab(tabKey);
    };

    const goToNextTab = () => {
        if (currentTabIndex < MODAL_TABS.length - 1) {
            setActiveTab(MODAL_TABS[currentTabIndex + 1].key);
        }
    };

    // ─── Render Tab 2 content ─────────────────────────────────────────────────
    const renderTab2 = () => {
        if (loadingChart) {
            return (
                <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: 300 }}>
                    <Spin tip="Đang tải sơ đồ..." />
                </div>
            );
        }

        if (!selectedDepartmentId && !isEdit) {
            return (
                <Alert
                    message="Chọn phòng ban ở tab Thông tin chung để hiện sơ đồ"
                    type="info" showIcon
                />
            );
        }

        if (charts.length === 0 && !isEdit) {
            return (
                <Alert
                    message="Phòng ban này chưa có sơ đồ tổ chức"
                    type="warning" showIcon
                />
            );
        }

        if (isEdit && charts.length === 0 && rfNodes.length === 0) {
            return (
                <Alert
                    message="Không có dữ liệu sơ đồ tổ chức cho JD này"
                    type="info" showIcon
                />
            );
        }

        return (
            <>
                {charts.length > 0 && (
                    <div style={{ marginBottom: 12 }}>
                        <div style={{ fontSize: 13, fontWeight: 500, color: "#6b7280", marginBottom: 4 }}>
                            Chọn sơ đồ
                        </div>
                        <Select
                            style={{ width: "100%" }}
                            placeholder="Chọn sơ đồ tổ chức"
                            value={selectedChartId ?? undefined}
                            onChange={handleChartChange}
                            options={charts.map((c) => ({
                                value: c.id, label: c.name,
                            }))}
                        />
                    </div>
                )}

                {!selectedChartId && charts.length > 0 && (
                    <Alert
                        message="Chọn sơ đồ tổ chức để xem và chỉnh sửa vị trí"
                        type="info" showIcon
                    />
                )}

                {selectedChartId && (
                    <>
                        {rfNodes.length === 0 ? (
                            <Alert
                                message="Sơ đồ này chưa có node nào"
                                type="warning" showIcon
                            />
                        ) : (
                            <div style={{
                                height: 460, border: "1px solid #e5e7eb",
                                borderRadius: 10, overflow: "hidden",
                                background: "#f8f9fb",
                            }}>
                                <ReactFlow
                                    nodes={rfNodes} edges={rfEdges}
                                    nodeTypes={nodeTypes} edgeTypes={edgeTypes}
                                    nodesDraggable={false} nodesConnectable={false}
                                    elementsSelectable={false}
                                    onNodesChange={(changes: NodeChange[]) =>
                                        setRfNodes((nds) => applyNodeChanges(changes, nds))
                                    }
                                    onEdgesChange={(changes: EdgeChange[]) =>
                                        setRfEdges((eds) => applyEdgeChanges(changes, eds))
                                    }
                                    fitView fitViewOptions={{ padding: 0.2 }}
                                    minZoom={0.3} maxZoom={1.5}
                                    defaultEdgeOptions={{ type: "orgEdge" }}
                                >
                                    <Background color="#e5e7eb" gap={20} />
                                    <Controls showInteractive={false} />
                                </ReactFlow>
                            </div>
                        )}

                        {selectedNodeIds.length > 0 && (
                            <div style={{ marginTop: 12 }}>
                                <div style={{ fontSize: 12, color: "#9ca3af", marginBottom: 6 }}>
                                    Đã chọn {selectedNodeIds.length} vị trí:
                                </div>
                                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                                    {selectedNodeIds.map((nid) => {
                                        const n = rawNodes.find((x) => x.id === nid);
                                        return (
                                            <Tag
                                                key={nid} color="blue" closable
                                                onClose={() =>
                                                    setSelectedNodeIds((prev) =>
                                                        prev.filter((id) => id !== nid)
                                                    )
                                                }
                                            >
                                                {n?.name ?? n?.title ?? `#${nid}`}
                                            </Tag>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </>
                )}
            </>
        );
    };

    // ─── Render ──────────────────────────────────────────────────────────────
    return (
        <Modal
            open={open}
            onCancel={onClose}
            title={
                <span style={{
                    fontFamily: "'Outfit','Nunito','Segoe UI',sans-serif",
                    fontWeight: 700, fontSize: 15,
                }}>
                    {isEdit ? "Chỉnh sửa Job Description" : "Tạo Job Description mới"}
                </span>
            }
            width={1000}
            style={{ top: 20 }}
            styles={{ body: { padding: "20px 24px 8px", background: "#f5f6fa" } }}
            footer={
                <div style={{
                    display: "flex",
                    justifyContent: "flex-end",
                    alignItems: "center",
                    gap: 8,
                    padding: "12px 4px 4px",
                }}>
                    <Button onClick={onClose} disabled={isPending}>
                        Hủy
                    </Button>

                    {/* Nút Tiếp theo — ẩn ở tab cuối */}
                    {!isLastTab && (
                        <button
                            onClick={goToNextTab}
                            style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 6,
                                padding: "0 18px",
                                height: 32,
                                borderRadius: 6,
                                border: `1.5px solid ${ACCENT}`,
                                background: "#fff",
                                color: ACCENT,
                                fontSize: 13,
                                fontWeight: 600,
                                fontFamily: "'Outfit','Nunito','Segoe UI',sans-serif",
                                cursor: "pointer",
                                transition: "all 0.18s ease",
                                letterSpacing: "0.01em",
                            }}
                            onMouseEnter={(e) => {
                                (e.currentTarget as HTMLButtonElement).style.background = ACCENT;
                                (e.currentTarget as HTMLButtonElement).style.color = "#fff";
                            }}
                            onMouseLeave={(e) => {
                                (e.currentTarget as HTMLButtonElement).style.background = "#fff";
                                (e.currentTarget as HTMLButtonElement).style.color = ACCENT;
                            }}
                        >
                            Tiếp theo
                            <svg
                                width="14" height="14" viewBox="0 0 14 14"
                                fill="none" xmlns="http://www.w3.org/2000/svg"
                                style={{ flexShrink: 0 }}
                            >
                                <path
                                    d="M3 7H11M8 4L11 7L8 10"
                                    stroke="currentColor" strokeWidth="1.6"
                                    strokeLinecap="round" strokeLinejoin="round"
                                />
                            </svg>
                        </button>
                    )}

                    {(isEdit || isLastTab) && (
                        <Button
                            type="primary"
                            onClick={handleSubmit}
                            loading={isPending}
                            style={{ background: ACCENT, borderColor: ACCENT }}
                        >
                            {isEdit ? "Cập nhật" : "Tạo mới"}
                        </Button>
                    )}
                </div>
            }
            destroyOnClose
        >
            {isEdit && loadingFullJd ? (
                <div style={{
                    display: "flex", justifyContent: "center",
                    alignItems: "center", height: 400,
                }}>
                    <Spin size="large" tip="Đang tải dữ liệu..." />
                </div>
            ) : (
                <>
                    {/* ── Tab bar ── */}
                    <div style={{
                        display: "flex", gap: 4, marginBottom: 16,
                        background: "#fff", borderRadius: 12, padding: 6,
                        border: "1px solid #eef0f5",
                        boxShadow: "0 1px 4px rgba(0,0,0,.04)",
                    }}>
                        {MODAL_TABS.map((tab) => {
                            const isActive = activeTab === tab.key;

                            return (
                                <button
                                    key={tab.key}
                                    onClick={() => handleTabClick(tab.key)}
                                    style={{
                                        flex: 1,
                                        padding: "9px 12px",
                                        borderRadius: 8,
                                        fontSize: 13,
                                        fontWeight: isActive ? 700 : 500,
                                        color: isActive ? "#fff" : "#6b7280",
                                        background: isActive ? ACCENT : "transparent",
                                        border: "none",
                                        cursor: "pointer",
                                        transition: "all 0.18s ease",
                                        fontFamily: "'Outfit','Nunito','Segoe UI',sans-serif",
                                        boxShadow: isActive ? "0 2px 8px rgba(232,99,122,.35)" : "none",
                                    }}
                                >
                                    {tab.label}
                                </button>
                            );
                        })}
                    </div>

                    <Form form={form} layout="vertical">
                        <div style={{
                            background: "#fff", borderRadius: 12,
                            border: "1px solid #eef0f5",
                            boxShadow: "0 2px 8px rgba(0,0,0,.04)",
                            padding: "16px 20px",
                            minHeight: 500,
                        }}>

                            {/* ── TAB 1 ── */}
                            <div style={{ display: activeTab === "1" ? "block" : "none" }}>
                                <div className="grid grid-cols-2 gap-x-4 pt-2">
                                    <Form.Item
                                        name="companyId" label="Công ty"
                                        rules={[{ required: true, message: "Chọn công ty" }]}
                                    >
                                        <Select
                                            showSearch optionFilterProp="label"
                                            placeholder="Chọn công ty"
                                            loading={loadingCompanies}
                                            disabled={isEdit}
                                            onChange={handleCompanyChange}
                                            options={companies.map((c) => ({ value: c.id, label: c.name }))}
                                        />
                                    </Form.Item>

                                    <Form.Item
                                        name="departmentId" label="Phòng ban"
                                        rules={[{ required: true, message: "Chọn phòng ban" }]}
                                    >
                                        <Select
                                            showSearch optionFilterProp="label"
                                            placeholder={
                                                isEdit ? "Phòng ban"
                                                    : selectedCompanyId ? "Chọn phòng ban"
                                                        : "Chọn công ty trước"
                                            }
                                            disabled={isEdit || !selectedCompanyId}
                                            loading={loadingDepartments}
                                            onChange={handleDepartmentChange}
                                            options={departments.map((d) => ({ value: d.id, label: d.name }))}
                                        />
                                    </Form.Item>

                                    <Form.Item
                                        name="departmentJobTitleId" label="Chức danh"
                                        rules={[{ required: true, message: "Chọn chức danh" }]}
                                    >
                                        <Select
                                            showSearch optionFilterProp="label"
                                            placeholder={
                                                isEdit ? "Chức danh"
                                                    : selectedDepartmentId ? "Chọn chức danh"
                                                        : "Chọn phòng ban trước"
                                            }
                                            disabled={isEdit || !selectedDepartmentId}
                                            loading={loadingJobTitles}
                                            onChange={(val) => {
                                                if (!isEdit) {
                                                    const jt = jobTitles.find((j) => j.id === val);
                                                    setSelectedJobTitleName(jt?.jobTitle?.nameVi ?? null);
                                                }
                                            }}
                                            options={jobTitles.map((jt) => ({
                                                value: jt.id,
                                                label: jt.jobTitle?.nameVi ?? `ID ${jt.id}`,
                                            }))}
                                        />
                                    </Form.Item>

                                    <Form.Item
                                        name="code" label="Mã JD"
                                        rules={[{ required: true, message: "Nhập mã JD" }]}
                                    >
                                        <Input placeholder="VD: JD-001" disabled={isEdit} />
                                    </Form.Item>

                                    <Form.Item
                                        name="reportTo" label="Cấp quản lý trực tiếp"
                                        rules={[{ required: true, message: "Nhập thông tin" }]}
                                    >
                                        <Input placeholder="VD: Trưởng phòng Nhân sự" />
                                    </Form.Item>

                                    <Form.Item
                                        name="belongsTo" label="Trực thuộc bộ phận"
                                        rules={[{ required: true, message: "Nhập thông tin" }]}
                                    >
                                        <Input placeholder="VD: Phòng Hành chính Nhân sự" />
                                    </Form.Item>

                                    <Form.Item name="effectiveDate" label="Ngày hiệu lực">
                                        <DatePicker
                                            className="w-full"
                                            format="DD/MM/YYYY"
                                            placeholder="Chọn ngày"
                                        />
                                    </Form.Item>
                                </div>

                                <Form.Item
                                    name="collaborateWith" label="Phối hợp công tác với"
                                    rules={[{ required: true, message: "Nhập thông tin" }]}
                                >
                                    <Input placeholder="VD: Phòng Kế toán, Phòng Kinh doanh..." />
                                </Form.Item>
                            </div>

                            {/* ── TAB 2 ── */}
                            <div style={{ display: activeTab === "2" ? "block" : "none" }}>
                                <div className="pt-2">
                                    {renderTab2()}
                                </div>
                            </div>

                            {/* ── TAB 3 ── */}
                            <div style={{ display: activeTab === "3" ? "block" : "none" }}>
                                <div className="pt-2">
                                    <Form.List name="tasks">
                                        {(fields, { add, remove }) => (
                                            <>
                                                {fields.map(({ key, name, ...restField }, index) => (
                                                    <div
                                                        key={key}
                                                        className="border border-gray-200 rounded-lg p-3 mb-3 bg-gray-50"
                                                    >
                                                        <div className="flex items-center justify-between mb-2">
                                                            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                                                Nhiệm vụ #{index + 1}
                                                            </span>
                                                            {fields.length > 1 && (
                                                                <Button
                                                                    type="text" danger size="small"
                                                                    icon={<MinusCircleOutlined />}
                                                                    onClick={() => remove(name)}
                                                                />
                                                            )}
                                                        </div>
                                                        <Form.Item
                                                            {...restField}
                                                            name={[name, "title"]}
                                                            label="Tiêu đề"
                                                            rules={[{ required: true, message: "Nhập tiêu đề" }]}
                                                            className="mb-2"
                                                        >
                                                            <Input placeholder="VD: Lập kế hoạch hàng tuần" />
                                                        </Form.Item>
                                                        <Form.Item
                                                            {...restField}
                                                            name={[name, "content"]}
                                                            label="Nội dung"
                                                            rules={[{ required: true, message: "Nhập nội dung" }]}
                                                            className="mb-0"
                                                        >
                                                            <TextArea rows={2} placeholder="Mô tả chi tiết nhiệm vụ..." />
                                                        </Form.Item>
                                                    </div>
                                                ))}
                                                <Button
                                                    type="dashed" block icon={<PlusOutlined />}
                                                    onClick={() =>
                                                        add({ orderNo: fields.length + 1, title: "", content: "" })
                                                    }
                                                >
                                                    Thêm nhiệm vụ
                                                </Button>
                                            </>
                                        )}
                                    </Form.List>
                                </div>
                            </div>

                            {/* ── TAB 4 ── */}
                            <div style={{ display: activeTab === "4" ? "block" : "none" }}>
                                <div className="pt-2 grid grid-cols-2 gap-x-4">
                                    <Form.Item name="knowledge" label="Kiến thức">
                                        <TextArea rows={4} placeholder="Yêu cầu kiến thức..." />
                                    </Form.Item>
                                    <Form.Item name="experience" label="Kinh nghiệm">
                                        <TextArea rows={4} placeholder="Yêu cầu kinh nghiệm..." />
                                    </Form.Item>
                                    <Form.Item name="skills" label="Kỹ năng">
                                        <TextArea rows={4} placeholder="Yêu cầu kỹ năng..." />
                                    </Form.Item>
                                    <Form.Item name="qualities" label="Phẩm chất">
                                        <TextArea rows={4} placeholder="Phẩm chất cần có..." />
                                    </Form.Item>
                                    <Form.Item
                                        name="otherRequirements"
                                        label="Yêu cầu khác"
                                        className="col-span-2"
                                    >
                                        <TextArea rows={3} placeholder="Các yêu cầu khác (nếu có)..." />
                                    </Form.Item>
                                </div>
                            </div>

                        </div>
                    </Form>
                </>
            )}
        </Modal>
    );
}