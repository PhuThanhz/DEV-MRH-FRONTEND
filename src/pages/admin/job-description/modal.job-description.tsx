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
const ACCENT_LIGHT = "#fff0f3";
const ACCENT_BORDER = "#ffd6dd";

const MODAL_TABS = [
    { key: "1", label: "I. Thông tin chung" },
    { key: "2", label: "II. Sơ đồ vị trí công việc" },
    { key: "3", label: "III. Mô tả công việc" },
    { key: "4", label: "IV. Yêu cầu đối với vị trí" },
];

const NODE_W = 190;
const NODE_H = 80;

// ─── Elbow edge ───────────────────────────────────────────────────────────────
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
    const accentBg = isSelected ? "#3b82f6" : isMatched ? "#f59e0b" : "linear-gradient(90deg, #1f2937 0%, #6b7280 100%)";
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
                    padding: "0 12px", display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                }}>
                    {data.levelCode && (
                        <span style={{
                            fontSize: 10, fontWeight: 700, fontFamily: "'Outfit', monospace",
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
    ): Node[] => {
        const rfN: Node[] = raw.map((n) => ({
            id: String(n.id),
            type: "selectableNode",
            position: { x: n.posX ?? 0, y: n.posY ?? 0 },
            data: {
                label: n.name ?? n.title ?? `Node #${n.id}`,
                levelCode: n.levelCode ?? n.level ?? "",
                selected: selectedIds.includes(n.id),
                // ✅ FIX: dùng === thay vì includes để chỉ highlight node khớp chính xác
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
        return laid.map((node) => {
            const saved = raw.find((n) => String(n.id) === node.id);
            if (saved?.posX != null && saved?.posY != null)
                return { ...node, position: { x: saved.posX, y: saved.posY } };
            return node;
        });
    }, []);

    useEffect(() => {
        if (rawNodes.length === 0) return;
        setRfNodes(
            buildRfNodes(rawNodes, selectedNodeIds, handleToggleNode, selectedJobTitleName)
                .map((n) => ({
                    ...n,
                    data: {
                        ...n.data,
                        selected: selectedNodeIds.includes(n.data.nodeId),
                        // ✅ FIX: dùng === thay vì includes để chỉ highlight node khớp chính xác
                        matched: selectedJobTitleName
                            ? n.data.label.toLowerCase() === selectedJobTitleName.toLowerCase()
                            : false,
                    },
                }))
        );
    }, [selectedNodeIds, rawNodes, handleToggleNode, buildRfNodes, selectedJobTitleName]);

    // ── Load companies on open ────────────────────────────────────────────────
    useEffect(() => {
        if (!open) return;
        setLoadingCompanies(true);
        callFetchCompany("page=1&size=500")
            .then((res: any) => setCompanies(res?.data?.result ?? []))
            .finally(() => setLoadingCompanies(false));
    }, [open]);

    const handleCompanyChange = useCallback(async (companyId: number) => {
        setSelectedCompanyId(companyId);
        setSelectedDepartmentId(null);
        setDepartments([]); setJobTitles([]);
        setCharts([]); setRawNodes([]); setRfNodes([]); setRfEdges([]);
        setSelectedChartId(null); setSelectedNodeIds([]);
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
        setCharts([]); setRawNodes([]); setRfNodes([]); setRfEdges([]);
        setSelectedChartId(null); setSelectedNodeIds([]);
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
        setRawNodes([]); setRfNodes([]); setRfEdges([]);
        setSelectedNodeIds([]);

        const res = await callFetchOrgNodes(chartId) as any;
        const raw: IOrgNode[] = res?.data ?? [];
        setRawNodes(raw);

        const built = buildRfNodes(raw, [], () => { });
        const edges: Edge[] = raw
            .filter((n) => n.parentId)
            .map((n) => ({
                id: `e-${n.parentId}-${n.id}`,
                source: String(n.parentId),
                target: String(n.id),
                type: "orgEdge",
            }));
        setRfNodes(built);
        setRfEdges(edges);
    }, [buildRfNodes]);

    // ── Prefill on edit ───────────────────────────────────────────────────────
    useEffect(() => {
        if (!open) return;

        if (editRecord) {
            form.setFieldsValue({
                code: editRecord.code,
                reportTo: editRecord.reportTo,
                belongsTo: editRecord.belongsTo,
                collaborateWith: editRecord.collaborateWith,
                status: editRecord.status,
                effectiveDate: editRecord.effectiveDate ? dayjs(editRecord.effectiveDate) : null,
                companyId: editRecord.companyId,
                departmentId: editRecord.departmentId,
                departmentJobTitleId: editRecord.departmentJobTitleId,
                knowledge: editRecord.requirements?.knowledge ?? null,
                experience: editRecord.requirements?.experience ?? null,
                skills: editRecord.requirements?.skills ?? null,
                qualities: editRecord.requirements?.qualities ?? null,
                otherRequirements: editRecord.requirements?.otherRequirements ?? null,
                tasks: editRecord.tasks?.length
                    ? editRecord.tasks
                    : [{ orderNo: 1, title: "", content: "" }],
            });

            if (editRecord.companyId) setSelectedCompanyId(editRecord.companyId);
            if (editRecord.departmentId) setSelectedDepartmentId(editRecord.departmentId);

            const prefill = async () => {
                const promises: Promise<any>[] = [];

                if (editRecord.companyId) {
                    promises.push(
                        callFetchDepartmentsByCompany(editRecord.companyId)
                            .then((res: any) => setDepartments(res?.data ?? []))
                    );
                }

                if (editRecord.departmentId) {
                    promises.push(
                        callFetchCompanyJobTitlesOfDepartment(editRecord.departmentId)
                            .then((res: any) => {
                                const jts: IDepartmentJobTitle[] = res?.data ?? [];
                                setJobTitles(jts);
                                const matched = jts.find((jt) => jt.id === editRecord.departmentJobTitleId);
                                if (matched) setSelectedJobTitleName(matched.jobTitle?.nameVi ?? null);
                            })
                    );
                    promises.push(
                        callFetchOrgCharts(
                            `filter=departmentId='${editRecord.departmentId}'&page=1&pageSize=50`
                        ).then((res: any) => setCharts(res?.data?.result ?? []))
                    );
                }

                await Promise.all(promises);

                if (editRecord.positions?.length) {
                    const firstChartId = editRecord.positions[0].chartId;
                    setSelectedChartId(firstChartId);
                    const preSelectedIds = editRecord.positions.map((p) => p.nodeId);
                    setSelectedNodeIds(preSelectedIds);

                    const res = await callFetchOrgNodes(firstChartId) as any;
                    const raw: IOrgNode[] = res?.data ?? [];
                    setRawNodes(raw);

                    const built = buildRfNodes(raw, preSelectedIds, handleToggleNode);
                    const edges: Edge[] = raw
                        .filter((n) => n.parentId)
                        .map((n) => ({
                            id: `e-${n.parentId}-${n.id}`,
                            source: String(n.parentId),
                            target: String(n.id),
                            type: "orgEdge",
                        }));
                    setRfNodes(built);
                    setRfEdges(edges);
                }
            };

            prefill();

        } else {
            form.resetFields();
            form.setFieldsValue({
                status: "DRAFT",
                tasks: [{ orderNo: 1, title: "", content: "" }],
            });
            setSelectedCompanyId(null); setSelectedDepartmentId(null);
            setSelectedJobTitleName(null);
            setDepartments([]); setJobTitles([]);
            setCharts([]); setRawNodes([]); setRfNodes([]); setRfEdges([]);
            setSelectedChartId(null); setSelectedNodeIds([]);
            setActiveTab("1");
        }
    }, [open, editRecord]); // eslint-disable-line

    // ── Submit ────────────────────────────────────────────────────────────────
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
                status: values.status,
                effectiveDate: values.effectiveDate ? dayjs(values.effectiveDate).toISOString() : undefined,
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
                tasks: (values.tasks ?? []).map((t: any, idx: number) => ({ ...t, orderNo: idx + 1 })),
                positions,
            };

            if (isEdit && editRecord?.id) {
                await updateMutation.mutateAsync({ id: editRecord.id, data: payload });
            } else {
                await createMutation.mutateAsync(payload);
            }
            onClose();
        } catch {
            // validation errors handled by form
        }
    };

    return (
        <Modal
            open={open}
            onCancel={onClose}
            title={
                <span style={{ fontFamily: "'Outfit','Nunito','Segoe UI',sans-serif", fontWeight: 700, fontSize: 15 }}>
                    {isEdit ? "Chỉnh sửa Job Description" : "Tạo Job Description mới"}
                </span>
            }
            width={1000}
            style={{ top: 20 }}
            styles={{ body: { padding: "20px 24px 8px", background: "#f5f6fa" } }}
            footer={
                <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, padding: "12px 4px 4px" }}>
                    <Button onClick={onClose} disabled={isPending}>Hủy</Button>
                    <Button
                        type="primary"
                        onClick={handleSubmit}
                        loading={isPending}
                        style={{ background: ACCENT, borderColor: ACCENT }}
                    >
                        {isEdit ? "Cập nhật" : "Tạo mới"}
                    </Button>
                </div>
            }
            destroyOnClose
        >
            {/* Tab bar */}
            <div style={{
                display: "flex", gap: 4, marginBottom: 16,
                background: "#fff", borderRadius: 12, padding: 6,
                border: "1px solid #eef0f5", boxShadow: "0 1px 4px rgba(0,0,0,.04)",
            }}>
                {MODAL_TABS.map((tab) => {
                    const isActive = activeTab === tab.key;
                    return (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key)}
                            style={{
                                flex: 1, padding: "9px 12px", borderRadius: 8,
                                fontSize: 13, fontWeight: isActive ? 700 : 500,
                                color: isActive ? "#fff" : "#6b7280",
                                background: isActive ? ACCENT : "transparent",
                                border: "none", cursor: "pointer",
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

                    {/* ── TAB 1: Thông tin chung ── */}
                    <div style={{ display: activeTab === "1" ? "block" : "none" }}>
                        <div className="grid grid-cols-2 gap-x-4 pt-2">
                            <Form.Item name="companyId" label="Công ty" rules={[{ required: true, message: "Chọn công ty" }]}>
                                <Select
                                    showSearch optionFilterProp="label"
                                    placeholder="Chọn công ty"
                                    loading={loadingCompanies}
                                    onChange={handleCompanyChange}
                                    options={companies.map((c) => ({ value: c.id, label: c.name }))}
                                />
                            </Form.Item>

                            <Form.Item name="departmentId" label="Phòng ban" rules={[{ required: true, message: "Chọn phòng ban" }]}>
                                <Select
                                    showSearch optionFilterProp="label"
                                    placeholder={selectedCompanyId ? "Chọn phòng ban" : "Chọn công ty trước"}
                                    disabled={!selectedCompanyId}
                                    loading={loadingDepartments}
                                    onChange={handleDepartmentChange}
                                    options={departments.map((d) => ({ value: d.id, label: d.name }))}
                                />
                            </Form.Item>

                            <Form.Item name="departmentJobTitleId" label="Chức danh" rules={[{ required: true, message: "Chọn chức danh" }]}>
                                <Select
                                    showSearch optionFilterProp="label"
                                    placeholder={selectedDepartmentId ? "Chọn chức danh" : "Chọn phòng ban trước"}
                                    disabled={!selectedDepartmentId}
                                    loading={loadingJobTitles}
                                    onChange={(val) => {
                                        const jt = jobTitles.find((j) => j.id === val);
                                        setSelectedJobTitleName(jt?.jobTitle?.nameVi ?? null);
                                    }}
                                    options={jobTitles.map((jt) => ({
                                        value: jt.id,
                                        label: jt.jobTitle?.nameVi ?? `ID ${jt.id}`,
                                    }))}
                                />
                            </Form.Item>

                            <Form.Item name="code" label="Mã JD" rules={[{ required: true, message: "Nhập mã JD" }]}>
                                <Input placeholder="VD: JD-001" />
                            </Form.Item>

                            <Form.Item name="reportTo" label="Cấp quản lý trực tiếp" rules={[{ required: true, message: "Nhập thông tin" }]}>
                                <Input placeholder="VD: Trưởng phòng Nhân sự" />
                            </Form.Item>

                            <Form.Item name="belongsTo" label="Trực thuộc bộ phận" rules={[{ required: true, message: "Nhập thông tin" }]}>
                                <Input placeholder="VD: Phòng Hành chính Nhân sự" />
                            </Form.Item>

                            <Form.Item name="effectiveDate" label="Ngày hiệu lực">
                                <DatePicker className="w-full" format="DD/MM/YYYY" placeholder="Chọn ngày" />
                            </Form.Item>

                            <Form.Item name="status" label="Trạng thái" rules={[{ required: true, message: "Chọn trạng thái" }]}>
                                <Select options={[
                                    { value: "DRAFT", label: "Nháp" },
                                    { value: "PENDING", label: "Chờ duyệt" },
                                    { value: "APPROVED", label: "Đã duyệt" },
                                    { value: "REJECTED", label: "Từ chối" },
                                ]} />
                            </Form.Item>
                        </div>

                        <Form.Item name="collaborateWith" label="Phối hợp công tác với" rules={[{ required: true, message: "Nhập thông tin" }]}>
                            <Input placeholder="VD: Phòng Kế toán, Phòng Kinh doanh..." />
                        </Form.Item>
                    </div>

                    {/* ── TAB 2: Sơ đồ vị trí ── */}
                    <div style={{ display: activeTab === "2" ? "block" : "none" }}>
                        <div className="pt-2">
                            {!selectedDepartmentId ? (
                                <Alert message="Chọn phòng ban ở tab Thông tin chung để hiện sơ đồ" type="info" showIcon />
                            ) : loadingChart ? (
                                <div className="flex justify-center py-10"><Spin tip="Đang tải sơ đồ..." /></div>
                            ) : charts.length === 0 ? (
                                <Alert message="Phòng ban này chưa có sơ đồ tổ chức" type="warning" showIcon />
                            ) : (
                                <>
                                    <div className="mb-3">
                                        <div className="text-sm font-medium text-gray-600 mb-1">Chọn sơ đồ</div>
                                        <Select
                                            style={{ width: "100%" }}
                                            placeholder="Chọn sơ đồ tổ chức"
                                            value={selectedChartId ?? undefined}
                                            onChange={handleChartChange}
                                            options={charts.map((c) => ({ value: c.id, label: c.name }))}
                                        />
                                    </div>

                                    {selectedChartId && (
                                        <>
                                            {rfNodes.length === 0 ? (
                                                <Alert message="Sơ đồ này chưa có node nào" type="warning" showIcon />
                                            ) : (
                                                <div style={{
                                                    height: 460, border: "1px solid #e5e7eb",
                                                    borderRadius: 10, overflow: "hidden", background: "#f8f9fb",
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
                                                <div className="mt-3">
                                                    <div className="text-xs text-gray-500 mb-1">
                                                        Đã chọn {selectedNodeIds.length} vị trí:
                                                    </div>
                                                    <div className="flex flex-wrap gap-1">
                                                        {selectedNodeIds.map((nid) => {
                                                            const n = rawNodes.find((x) => x.id === nid);
                                                            return (
                                                                <Tag key={nid} color="blue" closable
                                                                    onClose={() =>
                                                                        setSelectedNodeIds((prev) => prev.filter((id) => id !== nid))
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
                            )}
                        </div>
                    </div>

                    {/* ── TAB 3: Nhiệm vụ ── */}
                    <div style={{ display: activeTab === "3" ? "block" : "none" }}>
                        <div className="pt-2">
                            <Form.List name="tasks">
                                {(fields, { add, remove }) => (
                                    <>
                                        {fields.map(({ key, name, ...restField }, index) => (
                                            <div key={key} className="border border-gray-200 rounded-lg p-3 mb-3 bg-gray-50">
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                                        Nhiệm vụ #{index + 1}
                                                    </span>
                                                    {fields.length > 1 && (
                                                        <Button type="text" danger size="small"
                                                            icon={<MinusCircleOutlined />}
                                                            onClick={() => remove(name)}
                                                        />
                                                    )}
                                                </div>
                                                <Form.Item
                                                    {...restField} name={[name, "title"]} label="Tiêu đề"
                                                    rules={[{ required: true, message: "Nhập tiêu đề" }]}
                                                    className="mb-2"
                                                >
                                                    <Input placeholder="VD: Lập kế hoạch hàng tuần" />
                                                </Form.Item>
                                                <Form.Item
                                                    {...restField} name={[name, "content"]} label="Nội dung"
                                                    rules={[{ required: true, message: "Nhập nội dung" }]}
                                                    className="mb-0"
                                                >
                                                    <TextArea rows={2} placeholder="Mô tả chi tiết nhiệm vụ..." />
                                                </Form.Item>
                                            </div>
                                        ))}
                                        <Button type="dashed" block icon={<PlusOutlined />}
                                            onClick={() => add({ orderNo: fields.length + 1, title: "", content: "" })}
                                        >
                                            Thêm nhiệm vụ
                                        </Button>
                                    </>
                                )}
                            </Form.List>
                        </div>
                    </div>

                    {/* ── TAB 4: Yêu cầu ── */}
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
                            <Form.Item name="otherRequirements" label="Yêu cầu khác" className="col-span-2">
                                <TextArea rows={3} placeholder="Các yêu cầu khác (nếu có)..." />
                            </Form.Item>
                        </div>
                    </div>

                </div>
            </Form>
        </Modal>
    );
}