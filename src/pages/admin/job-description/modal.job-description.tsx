import { useEffect, useState, useCallback, useMemo } from "react";
import { useIsMobile } from "@/components/common/modal/detail";
import {
    Modal, Form, Input, Select, DatePicker,
    Button, Spin, Alert, Tag, Popconfirm,
} from "antd";
import {
    ArrowLeftOutlined,
    ArrowRightOutlined,
    DeleteOutlined,
    DownOutlined,
    PlusOutlined,
} from "@ant-design/icons";
import type {
    IJobDescription, ICompany, IDepartment,
    IDepartmentJobTitle, IOrgChart, IOrgNode,
} from "@/types/backend";
import {
    useCreateJobDescriptionMutation,
    useUpdateJobDescriptionMutation,
    useJobDescriptionByIdQuery,
} from "@/hooks/useJobDescriptions";
import { useCompaniesQuery } from "@/hooks/useCompanies";
import { useDepartmentsByCompanyQuery } from "@/hooks/useDepartments";
import { useCompanyJobTitlesOfDepartmentQuery } from "@/hooks/useDepartmentJobTitles";
import { useOrgChartsQuery } from "@/hooks/useOrgCharts";
import { useOrgNodesQuery } from "@/hooks/useOrgNodes";
import useAccess from "@/hooks/useAccess";
import { ALL_PERMISSIONS } from "@/config/permissions";
import { useAppSelector } from "@/redux/hooks";
import dayjs from "dayjs";
import dagre from "dagre";
import LotusDetailDrawer from "@/components/common/drawer/LotusDetailDrawer";

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
    { key: "1", label: "Thông tin chung" },
    { key: "2", label: "Sơ đồ vị trí" },
    { key: "3", label: "Mô tả công việc" },
    { key: "4", label: "Yêu cầu vị trí" },
];

const NODE_W = 190;
const NODE_H = 80;
// ─── TaskItem (collapsible) ───────────────────────────────────────────────────
interface TaskItemProps {
    name: number;
    restField: any;
    index: number;
    canRemove: boolean;
    onRemove: () => void;
    accent: string;
}

const TaskItem = ({ name, restField, index, canRemove, onRemove, accent }: TaskItemProps) => {
    const [collapsed, setCollapsed] = useState(false);

    return (
        <article className={`overflow-hidden rounded-xl border bg-white transition-shadow duration-200 ${collapsed ? "border-gray-200" : "border-gray-200 shadow-sm"}`}>
            <button
                type="button"
                className={`flex w-full items-center justify-between gap-4 border-0 px-4 py-3 text-left transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#e8637a]/30 ${collapsed ? "bg-gray-50 hover:bg-gray-100" : "bg-white hover:bg-gray-50"}`}
                onClick={() => setCollapsed((v) => !v)}
                aria-expanded={!collapsed}
            >
                <div className="flex min-w-0 items-center gap-3">
                    <span style={{
                        width: 26, height: 26,
                        borderRadius: 7,
                        background: accent,
                        color: "#fff",
                        fontSize: 11,
                        fontWeight: 700,
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                        fontFamily: "'Outfit','Nunito','Segoe UI',sans-serif",
                    }}>
                        {index + 1}
                    </span>
                    <span className="truncate text-[13px] font-semibold text-gray-800">
                        Nhiệm vụ {index + 1}
                    </span>
                </div>

                <span className="flex shrink-0 items-center gap-2 text-xs font-medium text-gray-400">
                    {collapsed ? "Mở rộng" : "Thu gọn"}
                    <DownOutlined className={`text-[11px] transition-transform duration-200 ${collapsed ? "-rotate-90" : "rotate-0"}`} />
                </span>
            </button>

            {!collapsed ? (
                <div className="border-t border-gray-100">
                    <div className="px-4 pb-1 pt-4 sm:px-5">
                    <Form.Item
                        {...restField}
                        name={[name, "title"]}
                        label="Tiêu đề"
                        rules={[{ required: true, message: "Nhập tiêu đề" }]}
                        style={{ marginBottom: 10 }}
                    >
                        <Input placeholder="VD: Lập kế hoạch hàng tuần" />
                    </Form.Item>
                    <Form.Item
                        {...restField}
                        name={[name, "content"]}
                        label="Nội dung"
                        rules={[{ required: true, message: "Nhập nội dung" }]}
                        style={{ marginBottom: 12 }}
                    >
                        <Input.TextArea
                            autoSize={{ minRows: 2, maxRows: 10 }}
                            placeholder="Mô tả chi tiết nhiệm vụ..."
                        />
                    </Form.Item>
                    </div>

                    {canRemove ? (
                        <div className="flex justify-end border-t border-gray-100 bg-gray-50/70 px-3 py-2 sm:px-4">
                            <Popconfirm
                                title={`Xóa nhiệm vụ ${index + 1}?`}
                                description="Nội dung của nhiệm vụ này sẽ bị xóa khỏi biểu mẫu."
                                okText="Xóa nhiệm vụ"
                                cancelText="Giữ lại"
                                okButtonProps={{ danger: true }}
                                onConfirm={onRemove}
                            >
                                <Button type="text" danger icon={<DeleteOutlined />}>
                                    Xóa nhiệm vụ
                                </Button>
                            </Popconfirm>
                        </div>
                    ) : null}
                </div>
            ) : null}
        </article>
    );
};
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
    const isMobile = useIsMobile();
    const isEdit = !!editRecord;

    const isSuperAdmin = useAppSelector((state) => state.account?.user?.role?.name === "SUPER_ADMIN");
    const hasIssuePermission = useAccess(ALL_PERMISSIONS.JD_FLOW.ISSUE);
    const canPublishDirectly = isSuperAdmin || hasIssuePermission;

    const jdId = useMemo(() => {
        if (!editRecord) return undefined;
        return (editRecord as any).id ?? (editRecord as any).jdId;
    }, [editRecord]);

    const { data: fullJd, isLoading: loadingFullJd } = useJobDescriptionByIdQuery(
        isEdit && open ? jdId : undefined
    );

    const [selectedCompanyId, setSelectedCompanyId] = useState<number | null>(null);
    const [selectedDepartmentId, setSelectedDepartmentId] = useState<number | null>(null);
    const [selectedJobTitleName, setSelectedJobTitleName] = useState<string | null>(null);

    const { data: companiesData, isLoading: loadingCompanies } = useCompaniesQuery("page=1&size=500", open);
    const companies = companiesData?.result ?? [];

    const { data: departments = [], isLoading: loadingDepartments } = useDepartmentsByCompanyQuery(open && selectedCompanyId ? selectedCompanyId : 0);

    const { data: departmentJobTitlesData = [], isLoading: loadingJobTitles } = useCompanyJobTitlesOfDepartmentQuery(open && selectedDepartmentId ? selectedDepartmentId : 0);
    const jobTitles = departmentJobTitlesData;

    const [selectedChartId, setSelectedChartId] = useState<number | null>(null);
    const [selectedNodeIds, setSelectedNodeIds] = useState<number[]>([]);

    const { data: orgChartsRes, isLoading: loadingOrgCharts } = useOrgChartsQuery(
        open && selectedDepartmentId ? `filter=departmentId='${selectedDepartmentId}'&page=1&pageSize=50` : ""
    );
    const charts = useMemo(() => (orgChartsRes as any)?.result ?? [], [orgChartsRes]);

    const { data: rawNodesData, isLoading: loadingNodes } = useOrgNodesQuery(
        open && selectedChartId ? selectedChartId : 0
    );
    const rawNodes = useMemo(() => rawNodesData ?? [], [rawNodesData]);
    const loadingChart = loadingOrgCharts || loadingNodes;

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

    // Reset state khi mở/đóng modal
    useEffect(() => {
        if (open) {
            if (!isEdit) {
                form.resetFields();
            }
        } else {
            setActiveTab("1");
            setSelectedCompanyId(null);
            setSelectedDepartmentId(null);
            setSelectedJobTitleName(null);
            setRfNodes([]);
            setRfEdges([]);
            setSelectedChartId(null);
            setSelectedNodeIds([]);
        }
    }, [open, isEdit, form]);

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
        if (fullJd.positions?.length) {
            setSelectedChartId(fullJd.positions[0].chartId);
            setSelectedNodeIds(fullJd.positions.map((p) => p.nodeId));
        }
    }, [open, isEdit, fullJd]);

    useEffect(() => {
        if (fullJd?.departmentJobTitleId && departmentJobTitlesData.length > 0) {
            const matched = departmentJobTitlesData.find((jt) => jt.id === fullJd.departmentJobTitleId);
            if (matched) setSelectedJobTitleName(matched.jobTitle?.nameVi ?? null);
        }
    }, [fullJd?.departmentJobTitleId, departmentJobTitlesData]);

    useEffect(() => {
        if (rawNodes.length > 0) {
            const { nodes: built, edges } = buildRfNodes(rawNodes as IOrgNode[], selectedNodeIds, handleToggleNode);
            setRfNodes(built);
            setRfEdges(edges);
        } else {
            setRfNodes((prev) => (prev.length > 0 ? [] : prev));
            setRfEdges((prev) => (prev.length > 0 ? [] : prev));
        }
    }, [rawNodes, buildRfNodes, handleToggleNode]);

    // Init form khi tạo mới
    useEffect(() => {
        if (!open || isEdit) return;
        form.setFieldsValue({
            tasks: [{ orderNo: 1, title: "", content: "" }],
        });
    }, [open, isEdit, form]);

    // ─── Handlers ────────────────────────────────────────────────────────────
    const handleCompanyChange = useCallback((companyId: number) => {
        setSelectedCompanyId(companyId);
        setSelectedDepartmentId(null);
        setSelectedChartId(null);
        setSelectedNodeIds([]);
        setSelectedJobTitleName(null);
        form.setFieldsValue({ departmentId: undefined, departmentJobTitleId: undefined });
    }, [form]);

    const handleDepartmentChange = useCallback((departmentId: number) => {
        setSelectedDepartmentId(departmentId);
        setSelectedChartId(null);
        setSelectedNodeIds([]);
        setSelectedJobTitleName(null);
        form.setFieldsValue({ departmentJobTitleId: undefined });
    }, [form]);

    const handleChartChange = useCallback((chartId: number) => {
        setSelectedChartId(chartId);
        setSelectedNodeIds([]);
    }, []);

    // ─── Submit ──────────────────────────────────────────────────────────────
    const handleSubmit = async (publishDirectly = false) => {
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
                version: fullJd?.version, // ✅ Thêm version để hỗ trợ Optimistic Locking
                publishDirectly,
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

    const goToPreviousTab = () => {
        if (currentTabIndex > 0) {
            setActiveTab(MODAL_TABS[currentTabIndex - 1].key);
        }
    };

    const handleRequestClose = () => {
        if (isPending) return;
        if (!form.isFieldsTouched()) {
            onClose();
            return;
        }

        Modal.confirm({
            title: "Rời khỏi biểu mẫu?",
            content: "Các thông tin chưa lưu sẽ bị mất.",
            okText: "Rời khỏi",
            cancelText: "Tiếp tục chỉnh sửa",
            okButtonProps: { danger: true },
            onOk: onClose,
        });
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
                            options={charts.map((c: any) => ({
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
    const renderActionButtons = () => (
        <div className="flex flex-wrap items-center gap-2">
            {currentTabIndex > 0 ? (
                <Button
                    icon={<ArrowLeftOutlined />}
                    onClick={goToPreviousTab}
                    disabled={isPending}
                    className="!h-10 !rounded-lg !border-gray-200 !bg-white !px-4 !font-semibold !text-gray-700 !shadow-none hover:!border-gray-300 hover:!bg-gray-50 hover:!text-gray-950"
                >
                    Quay lại
                </Button>
            ) : null}

            {!isLastTab ? (
                <Button
                    type="primary"
                    icon={<ArrowRightOutlined />}
                    iconPosition="end"
                    onClick={goToNextTab}
                    disabled={isPending}
                    className="!h-10 !rounded-lg !border-[#e8637a] !bg-[#e8637a] !px-5 !font-semibold !shadow-[0_4px_12px_rgba(232,99,122,0.22)] hover:!border-[#d94c66] hover:!bg-[#d94c66] active:!translate-y-px"
                >
                    Tiếp theo
                </Button>
            ) : null}

            {isEdit && isLastTab ? (
                <>
                    <Button
                        type="primary"
                        onClick={() => handleSubmit(false)}
                        loading={isPending}
                        className="!h-10 !rounded-lg !border-[#e8637a] !bg-[#e8637a] !px-5 !font-semibold !shadow-[0_4px_12px_rgba(232,99,122,0.22)] hover:!border-[#d94c66] hover:!bg-[#d94c66] active:!translate-y-px"
                    >
                        Cập nhật
                    </Button>

                    {canPublishDirectly ? (
                        <Button
                            type="primary"
                            onClick={() => handleSubmit(true)}
                            loading={isPending}
                            className="!h-10 !rounded-lg !border-[#389e0d] !bg-[#389e0d] !px-5 !font-semibold hover:!border-[#237804] hover:!bg-[#237804] active:!translate-y-px"
                        >
                            Ban hành ngay
                        </Button>
                    ) : null}
                </>
            ) : null}

            {!isEdit && isLastTab ? (
                <>
                    <Button
                        type="primary"
                        onClick={() => handleSubmit(false)}
                        loading={isPending}
                        className="!h-10 !rounded-lg !border-[#e8637a] !bg-[#e8637a] !px-5 !font-semibold !shadow-[0_4px_12px_rgba(232,99,122,0.22)] hover:!border-[#d94c66] hover:!bg-[#d94c66] active:!translate-y-px"
                    >
                        Tạo bản nháp
                    </Button>

                    {canPublishDirectly ? (
                        <Button
                            type="primary"
                            onClick={() => handleSubmit(true)}
                            loading={isPending}
                            className="!h-10 !rounded-lg !border-[#389e0d] !bg-[#389e0d] !px-5 !font-semibold hover:!border-[#237804] hover:!bg-[#237804] active:!translate-y-px"
                        >
                            Ban hành ngay
                        </Button>
                    ) : null}
                </>
            ) : null}
        </div>
    );

    return (
        <LotusDetailDrawer
            open={open}
            onClose={handleRequestClose}
            maskClosable={!isPending}
            keyboard={!isPending}
            closeAriaLabel={isEdit ? "Đóng chỉnh sửa mô tả công việc" : "Đóng tạo mô tả công việc"}
        >
            <div className="job-description-form-drawer flex h-full flex-col bg-white font-['Outfit','Nunito','Segoe_UI',sans-serif]">
                <header className="shrink-0 border-b border-gray-100 bg-white px-5 pb-5 pt-5 sm:px-8">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <div>
                            <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#e8637a]">
                                <span className="h-1.5 w-1.5 rounded-full bg-[#e8637a]" />
                                Mô tả công việc
                            </div>
                            <h2 className="mb-0 mt-2 text-[26px] font-bold leading-8 tracking-[-0.02em] text-gray-950 sm:text-[30px] sm:leading-9">
                                {isEdit ? "Chỉnh sửa mô tả công việc" : "Tạo mô tả công việc mới"}
                            </h2>
                            <p className="mb-0 mt-2 text-[13px] text-gray-500">
                                Hoàn thiện thông tin qua 4 bước, sau đó lưu bản nháp hoặc ban hành.
                            </p>
                        </div>
                        <div className="rounded-lg bg-[#fff3f5] border border-[#f8d7df] px-3.5 py-2 text-xs font-semibold text-[#c94d66]">
                            Bước {currentTabIndex + 1} / {MODAL_TABS.length}
                        </div>
                    </div>
                </header>

                <nav className="shrink-0 border-b border-gray-100 bg-white px-4 py-3 sm:px-8" aria-label="Các bước tạo mô tả công việc">
                    <div className="mx-auto w-full max-w-[1320px] overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                        <div className="grid min-w-[720px] grid-cols-4 gap-1.5 rounded-xl border border-gray-100 bg-gray-50 p-1.5">
                            {MODAL_TABS.map((tab, tabIndex) => {
                                const isActive = activeTab === tab.key;
                                const isCompleted = tabIndex < currentTabIndex;
                                return (
                                    <button
                                        key={tab.key}
                                        type="button"
                                        onClick={() => handleTabClick(tab.key)}
                                        className={`flex min-w-0 items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e8637a]/30 ${
                                            isActive
                                                ? "border-[#f3c4cf] bg-white text-gray-950 shadow-[0_3px_12px_rgba(148,80,96,0.10)]"
                                                : isCompleted
                                                    ? "border-transparent bg-[#fff3f5] text-[#ad4258] hover:bg-[#ffe9ee]"
                                                    : "border-transparent bg-transparent text-gray-500 hover:bg-white hover:text-gray-800"
                                        }`}
                                        aria-current={isActive ? "step" : undefined}
                                    >
                                        <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-xs font-bold tabular-nums ${
                                            isActive
                                                ? "bg-[#e8637a] text-white"
                                                : isCompleted
                                                    ? "bg-[#f8d7df] text-[#ad4258]"
                                                    : "bg-white text-gray-400 shadow-sm"
                                        }`}>
                                            {tabIndex + 1}
                                        </span>
                                        <span className="truncate text-[13px] font-semibold">{tab.label}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </nav>

                <main className="min-h-0 flex-1 overflow-auto bg-[#f8f9fb] px-4 py-5 sm:px-8 sm:py-7">
                    <div className="mx-auto w-full max-w-[1320px]">
            {isEdit && loadingFullJd ? (
                <div style={{
                    display: "flex", justifyContent: "center",
                    alignItems: "center", height: 400,
                }}>
                    <Spin size="large" tip="Đang tải dữ liệu..." />
                </div>
            ) : (
                    <Form form={form} layout="vertical">
                        <div style={{
                            background: "#fff", borderRadius: 12,
                            border: "1px solid #eef0f5",
                            boxShadow: "0 2px 8px rgba(0,0,0,.04)",
                            padding: "16px 20px",
                            minHeight: 520,
                        }}>

                            {/* ── TAB 1 ── */}
                            <div style={{ display: activeTab === "1" ? "block" : "none" }}>
                                <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: "0 16px", paddingTop: 8 }}>
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
                                            style={{ width: "100%" }}
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
                            {/* ── TAB 3 ── */}
                            <div style={{ display: activeTab === "3" ? "block" : "none" }}>
                                <div className="pt-2">
                                    <Form.List name="tasks">
                                        {(fields, { add, remove }) => {
                                            const MAX_TASKS = 10;
                                            return (
                                                <div style={{ position: "relative" }}>
                                                    {/* Header: số đếm + floating add button */}
                                                    <div style={{
                                                        display: "flex",
                                                        alignItems: "center",
                                                        justifyContent: "space-between",
                                                        gap: 8,
                                                        marginBottom: 12,
                                                    }}>
                                                        <span style={{
                                                            fontSize: 12,
                                                            fontWeight: 600,
                                                            color: "#6b7280",
                                                            fontFamily: "'Outfit','Nunito','Segoe UI',sans-serif",
                                                            letterSpacing: "0.04em",
                                                            textTransform: "uppercase",
                                                            whiteSpace: "nowrap",
                                                            overflow: "hidden",
                                                            textOverflow: "ellipsis",
                                                            minWidth: 0,
                                                        }}>
                                                            Danh sách nhiệm vụ
                                                        </span>
                                                        <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                                                            <span style={{
                                                                fontSize: 12,
                                                                color: fields.length >= MAX_TASKS ? "#ef4444" : "#9ca3af",
                                                                fontWeight: 500,
                                                                whiteSpace: "nowrap",
                                                            }}>
                                                                {fields.length}/{MAX_TASKS}
                                                            </span>
                                                            <button
                                                                type="button"
                                                                disabled={fields.length >= MAX_TASKS}
                                                                onClick={() =>
                                                                    fields.length < MAX_TASKS &&
                                                                    add({ orderNo: fields.length + 1, title: "", content: "" })
                                                                }
                                                                style={{
                                                                    display: "inline-flex",
                                                                    alignItems: "center",
                                                                    gap: 5,
                                                                    padding: "5px 12px",
                                                                    borderRadius: 6,
                                                                    border: `1.5px solid ${fields.length >= MAX_TASKS ? "#e5e7eb" : ACCENT}`,
                                                                    background: fields.length >= MAX_TASKS ? "#f9fafb" : "#fff",
                                                                    color: fields.length >= MAX_TASKS ? "#d1d5db" : ACCENT,
                                                                    fontSize: 12,
                                                                    fontWeight: 600,
                                                                    cursor: fields.length >= MAX_TASKS ? "not-allowed" : "pointer",
                                                                    transition: "all 0.18s ease",
                                                                    fontFamily: "'Outfit','Nunito','Segoe UI',sans-serif",
                                                                    whiteSpace: "nowrap",
                                                                    flexShrink: 0,
                                                                }}
                                                                onMouseEnter={(e) => {
                                                                    if (fields.length >= MAX_TASKS) return;
                                                                    e.currentTarget.style.background = ACCENT;
                                                                    e.currentTarget.style.color = "#fff";
                                                                }}
                                                                onMouseLeave={(e) => {
                                                                    if (fields.length >= MAX_TASKS) return;
                                                                    e.currentTarget.style.background = "#fff";
                                                                    e.currentTarget.style.color = ACCENT;
                                                                }}
                                                            >
                                                                <PlusOutlined style={{ fontSize: 11 }} />
                                                                Thêm nhiệm vụ
                                                            </button>
                                                        </div>
                                                    </div>

                                                    {/* Danh sách nhiệm vụ có collapse */}
                                                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                                                        {fields.map(({ key, name, ...restField }, index) => (
                                                            <TaskItem
                                                                key={key}
                                                                name={name}
                                                                restField={restField}
                                                                index={index}
                                                                canRemove={fields.length > 1}
                                                                onRemove={() => remove(name)}
                                                                accent={ACCENT}
                                                            />
                                                        ))}
                                                    </div>

                                                    {fields.length === 0 && (
                                                        <div style={{
                                                            textAlign: "center",
                                                            padding: "40px 0",
                                                            color: "#9ca3af",
                                                            fontSize: 13,
                                                        }}>
                                                            Chưa có nhiệm vụ nào. Nhấn "Thêm nhiệm vụ" để bắt đầu.
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        }}
                                    </Form.List>
                                </div>
                            </div>

                            {/* ── TAB 4 ── */}
                            <div style={{ display: activeTab === "4" ? "block" : "none" }}>
                                <div style={{ paddingTop: 8, display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: "0 16px" }}>
                                    <Form.Item name="knowledge" label="Kiến thức">
                                        <TextArea autoSize={{ minRows: 4, maxRows: 12 }} placeholder="Yêu cầu kiến thức..." />
                                    </Form.Item>
                                    <Form.Item name="experience" label="Kinh nghiệm">
                                        <TextArea autoSize={{ minRows: 4, maxRows: 12 }} placeholder="Yêu cầu kinh nghiệm..." />
                                    </Form.Item>
                                    <Form.Item name="skills" label="Kỹ năng">
                                        <TextArea autoSize={{ minRows: 4, maxRows: 12 }} placeholder="Yêu cầu kỹ năng..." />
                                    </Form.Item>
                                    <Form.Item name="qualities" label="Phẩm chất">
                                        <TextArea autoSize={{ minRows: 4, maxRows: 12 }} placeholder="Phẩm chất cần có..." />
                                    </Form.Item>
                                    <Form.Item
                                        name="otherRequirements"
                                        label="Yêu cầu khác"
                                        style={{ gridColumn: isMobile ? "1" : "1 / -1" }}
                                    >
                                        <TextArea autoSize={{ minRows: 3, maxRows: 12 }} placeholder="Các yêu cầu khác (nếu có)..." />
                                    </Form.Item>
                                </div>
                            </div>

                        </div>
                    </Form>
            )}
                    </div>
                </main>

                <footer className="shrink-0 border-t border-gray-100 bg-white px-4 py-3.5 sm:px-8">
                    <div className="mx-auto flex w-full max-w-[1320px] items-center justify-between gap-3">
                        <Button
                            type="text"
                            onClick={handleRequestClose}
                            disabled={isPending}
                            className="!h-10 !rounded-lg !px-4 !font-medium !text-gray-500 hover:!bg-gray-100 hover:!text-gray-800"
                        >
                            Hủy
                        </Button>

                        {renderActionButtons()}
                    </div>
                </footer>
            </div>
        </LotusDetailDrawer>
    );
}
