import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import {
    Space,
    Card,
    Button,
    Tag,
    Typography,
    Row,
    Col,
    Modal,
    Form,
    Input,
    InputNumber,
    message,
    Spin,
    Divider,
    Alert,
    Tooltip,
    Popconfirm,
    Progress,
} from "antd";
import {
    ArrowLeftOutlined,
    PlusOutlined,
    EditOutlined,
    DeleteOutlined,
    WarningOutlined,
    CheckCircleOutlined,
    BookOutlined,
    OrderedListOutlined,
    TrophyOutlined,
    UpOutlined,
    UserOutlined,
    ClockCircleOutlined,
    DownOutlined,
    LeftOutlined,
    RightOutlined,
    AlignLeftOutlined,
    InfoCircleOutlined,
} from "@ant-design/icons";
import { getModalWidth } from "@/utils/responsive";
import {
    callFetchEvaluationTemplateById,
    callCreateTemplateSection,
    callUpdateTemplateSection,
    callDeleteTemplateSection,
    callCreateTemplateCriteria,
    callUpdateTemplateCriteria,
    callDeleteTemplateCriteria,
    callCreateCriteriaLevel,
    callUpdateCriteriaLevel,
    callPublishEvaluationTemplate,
} from "@/config/api";
import type { IEvaluationTemplate, ITemplateSection, ITemplateCriteria, ITemplateCriteriaLevel } from "@/types/backend";
import { notify } from "@/components/common/notification/notify";
import Access from "@/components/share/access";
import { ALL_PERMISSIONS } from "@/config/permissions";

const { Title, Text, Paragraph } = Typography;

const PINK = "#e8637a";
const PINK_HOVER = "#db4f67";

const TemplateDetailPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const templateId = Number(id);

    const [template, setTemplate] = useState<IEvaluationTemplate | null>(null);
    const [sections, setSections] = useState<ITemplateSection[]>([]);
    const [selectedSectionId, setSelectedSectionId] = useState<number | null>(null);
    const [loading, setLoading] = useState<boolean>(false);

    // ── UX Feature 5: Collapse panels ──────────────────────────────────
    const [leftPanelCollapsed, setLeftPanelCollapsed] = useState(false);
    const [rightPanelCollapsed, setRightPanelCollapsed] = useState(false);

    // ── UX Feature 4: Drag & drop state ───────────────────────────────
    const [dragOverId, setDragOverId] = useState<number | null>(null);
    const dragSrcIdRef = React.useRef<number | null>(null);

    // Modals state
    const [isSectionModalOpen, setIsSectionModalOpen] = useState(false);
    const [editingSection, setEditingSection] = useState<ITemplateSection | null>(null);
    const [sectionForm] = Form.useForm();

    const [isCriteriaModalOpen, setIsCriteriaModalOpen] = useState(false);
    const [editingCriteria, setEditingCriteria] = useState<ITemplateCriteria | null>(null);
    const [selectedParentCriteriaId, setSelectedParentCriteriaId] = useState<number | null>(null);
    const [collapsedCriteriaIds, setCollapsedCriteriaIds] = useState<number[]>([]);
    const [criteriaForm] = Form.useForm();

    const [isLevelsModalOpen, setIsLevelsModalOpen] = useState(false);
    const [activeCriteria, setActiveCriteria] = useState<ITemplateCriteria | null>(null);
    const [levelsForm] = Form.useForm();

    const toggleCriteriaCollapse = (critId: number) => {
        setCollapsedCriteriaIds(prev =>
            prev.includes(critId) ? prev.filter(id => id !== critId) : [...prev, critId]
        );
    };

    // ── UX Feature 2: Auto-distribute section weights ──────────────────
    const handleAutoDistribute = () => {
        if (sections.length === 0) return;
        const each = Math.floor(100 / sections.length);
        const remainder = 100 - each * sections.length;
        const updated = sections.map((sec, idx) => ({
            ...sec,
            weight: (each + (idx === 0 ? remainder : 0)) / 100,
        }));
        setSections(updated);
        // Persist each section weight via API
        updated.forEach(async (sec) => {
            if (!sec.id) return;
            try {
                const { callUpdateTemplateSection } = await import("@/config/api");
                await callUpdateTemplateSection(sec.id, {
                    code: sec.code,
                    name: sec.name,
                    weight: sec.weight,
                    displayOrder: sec.displayOrder,
                });
            } catch (_) {
                // silent – loadData will reconcile
            }
        });
        message.success("Đã phân bổ đều trọng số cho các phần!");
        setTimeout(() => loadData(), 600);
    };

    // ── UX Feature 4: Drag & drop handlers ────────────────────────────
    const handleDragStart = (e: React.DragEvent, secId: number) => {
        dragSrcIdRef.current = secId;
        e.dataTransfer.effectAllowed = "move";
    };
    const handleDragOver = (e: React.DragEvent, secId: number) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
        setDragOverId(secId);
    };
    const handleDragLeave = () => setDragOverId(null);
    const handleDrop = async (e: React.DragEvent, targetId: number) => {
        e.preventDefault();
        setDragOverId(null);
        const srcId = dragSrcIdRef.current;
        if (!srcId || srcId === targetId) return;
        const srcIdx = sections.findIndex(s => s.id === srcId);
        const tgtIdx = sections.findIndex(s => s.id === targetId);
        if (srcIdx < 0 || tgtIdx < 0) return;
        const reordered = [...sections];
        const [moved] = reordered.splice(srcIdx, 1);
        reordered.splice(tgtIdx, 0, moved);
        // Assign new displayOrder
        const withOrder = reordered.map((s, i) => ({ ...s, displayOrder: i + 1 }));
        setSections(withOrder);
        // Persist new orders
        withOrder.forEach(async (sec) => {
            if (!sec.id) return;
            try {
                const { callUpdateTemplateSection } = await import("@/config/api");
                await callUpdateTemplateSection(sec.id, {
                    code: sec.code,
                    name: sec.name,
                    weight: sec.weight,
                    displayOrder: sec.displayOrder,
                });
            } catch (_) {}
        });
        message.success("Đã sắp xếp lại thứ tự phần!");
    };
    const handleDragEnd = () => { setDragOverId(null); dragSrcIdRef.current = null; };

    const loadData = async () => {
        setLoading(true);
        try {
            const res = await callFetchEvaluationTemplateById(templateId);
            if (res?.data) {
                setTemplate(res.data);
                const fetchedSections: ITemplateSection[] = res.data.sections ?? [];
                setSections(fetchedSections);
                
                // Keep selected section active if it still exists
                if (fetchedSections.length > 0) {
                    if (!selectedSectionId || !fetchedSections.some(s => s.id === selectedSectionId)) {
                        setSelectedSectionId(fetchedSections[0].id ?? null);
                    }
                } else {
                    setSelectedSectionId(null);
                }
            }
        } catch (error) {
            notify.error("Lỗi tải chi tiết mẫu đánh giá");
        } finally {
            setLoading(false);
        }
    };

    const handlePublish = async () => {
        if (!templateId) return;

        // 1. Validate that sections are not empty
        if (sections.length === 0) {
            notify.error("Mẫu đánh giá phải có ít nhất một phần cấu trúc!");
            return;
        }

        // 2. Validate total weight of sections is exactly 100%
        const totalSecWeight = Math.round(sections.reduce((acc, s) => acc + (s.weight ?? 0), 0) * 100);
        if (totalSecWeight !== 100) {
            notify.error(`Tổng trọng số các phần cấu trúc phải bằng 100%! Hiện tại: ${totalSecWeight}%`);
            return;
        }

        // 3. For each section, validate criteria and levels completeness
        for (const sec of sections) {
            const criteriaList = sec.criteria || [];
            if (!Number.isFinite(sec.weight) || (sec.weight ?? 0) <= 0) {
                notify.error(`Phần "${sec.name}" phải có trọng số lớn hơn 0%!`);
                return;
            }
            if (criteriaList.length === 0) {
                notify.error(`Phần "${sec.name}" phải có ít nhất một tiêu chí!`);
                return;
            }

            // Validate sum of criteria weights matches section weight
            const sumCritWeight = Math.round(criteriaList.reduce((acc: number, c: any) => acc + (c.weight ?? 0), 0) * 100);
            const secWeight = Math.round((sec.weight ?? 0) * 100);
            if (sumCritWeight !== secWeight) {
                notify.error(`Tổng trọng số tiêu chí trong phần "${sec.name}" phải bằng ${secWeight}%. Hiện tại: ${sumCritWeight}%`);
                return;
            }

            // If a criterion has sub-criteria, scoring is configured on the children.
            for (const crit of criteriaList) {
                if (!Number.isFinite(crit.weight) || (crit.weight ?? 0) <= 0) {
                    notify.error(`Tiêu chí "${crit.name}" phải có trọng số lớn hơn 0%!`);
                    return;
                }
                const criteriaToValidate = crit.subCriteria?.length ? crit.subCriteria : [crit];
                for (const criteria of criteriaToValidate) {
                    const configuredLevels = criteria.levels || [];
                    const validLevels = new Set(configuredLevels
                        .filter((l: any) => l.description?.trim() && [1, 2, 3, 4, 5].includes(l.level))
                        .map((l: any) => l.level));
                    if (configuredLevels.length !== 5 || validLevels.size !== 5) {
                        const criteriaLabel = crit.subCriteria?.length
                            ? `Mục con "${criteria.name}" của tiêu chí "${crit.name}"`
                            : `Tiêu chí "${criteria.name}"`;
                        notify.error(`${criteriaLabel} thuộc phần "${sec.name}" chưa được cấu hình đầy đủ 5 mức điểm!`);
                        return;
                    }
                }
            }
        }

        setLoading(true);
        try {
            const res = await callPublishEvaluationTemplate(templateId);
            if (res?.data) {
                notify.success("Kích hoạt mẫu đánh giá thành công!");
                loadData();
            }
        } catch (error: any) {
            const msg = error?.message || error?.response?.data?.message || "Lỗi kích hoạt mẫu đánh giá";
            notify.error(msg);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (templateId) {
            loadData();
        }
    }, [templateId]);

    // Section actions
    const handleAddSectionClick = () => {
        setEditingSection(null);
        sectionForm.resetFields();
        sectionForm.setFieldsValue({ displayOrder: sections.length + 1 });
        setIsSectionModalOpen(true);
    };

    const handleEditSectionClick = (sec: ITemplateSection, e: React.MouseEvent) => {
        e.stopPropagation();
        setEditingSection(sec);
        sectionForm.setFieldsValue({
            code: sec.code,
            name: sec.name,
            weight: sec.weight != null ? Math.round(sec.weight * 100) : undefined, // display as percentage integer
            displayOrder: sec.displayOrder,
        });
        setIsSectionModalOpen(true);
    };

    const handleDeleteSection = async (sectionId: number, e: React.MouseEvent) => {
        e.stopPropagation();
        try {
            await callDeleteTemplateSection(sectionId);
            notify.success("Xóa phần thành công");
            loadData();
        } catch (error: any) {
            const msg = error?.message || error?.response?.data?.message || "Lỗi xóa phần trong template";
            notify.error(msg);
        }
    };

    const handleSectionFormSubmit = async (values: any) => {
        const newWeightDecimal = Number(values.weight) / 100;

        // Validate total weight doesn't exceed 100% (1.0)
        let total = 0;
        sections.forEach(s => {
            if (s.id !== editingSection?.id) {
                total += s.weight ?? 0;
            }
        });
        total += newWeightDecimal;

        if (total > 1.0001) {
            notify.error("Tổng trọng số của các phần không được vượt quá 100%!");
            return;
        }

        const payload = {
            code: values.code,
            name: values.name,
            weight: newWeightDecimal, // convert percentage back to decimal
            displayOrder: values.displayOrder,
        };

        try {
            if (editingSection?.id) {
                await callUpdateTemplateSection(editingSection.id, payload);
                notify.success("Cập nhật phần thành công");
            } else {
                await callCreateTemplateSection(templateId, payload);
                notify.success("Thêm phần mới thành công");
            }
            setIsSectionModalOpen(false);
            loadData();
        } catch (error: any) {
            const msg = error?.message || error?.response?.data?.message || "Lỗi lưu thông tin phần";
            notify.error(msg);
        }
    };

    const onSectionFinishFailed = ({ errorFields }: any) => {
        const firstError = errorFields[0]?.errors[0];
        if (firstError) notify.error(firstError);
    };

    // Criteria actions
    const activeSection = sections.find(s => s.id === selectedSectionId);
    const activeCriteriaList = activeSection?.criteria ?? [];

    const handleAddCriteriaClick = () => {
        if (!selectedSectionId) return;
        setEditingCriteria(null);
        setSelectedParentCriteriaId(null);
        criteriaForm.resetFields();
        criteriaForm.setFieldsValue({ displayOrder: activeCriteriaList.length + 1 });
        setIsCriteriaModalOpen(true);
    };

    const handleAddSubCriteriaClick = (parentCrit: ITemplateCriteria) => {
        setEditingCriteria(null);
        setSelectedParentCriteriaId(parentCrit.id!);
        criteriaForm.resetFields();
        criteriaForm.setFieldsValue({ displayOrder: (parentCrit.subCriteria?.length || 0) + 1 });
        setIsCriteriaModalOpen(true);
    };

    const handleEditCriteriaClick = (crit: ITemplateCriteria, parentId: number | null = null) => {
        setEditingCriteria(crit);
        setSelectedParentCriteriaId(parentId);
        criteriaForm.setFieldsValue({
            name: crit.name,
            description: crit.description,
            measurementMethod: crit.measurementMethod,
            weight: crit.weight != null ? Math.round(crit.weight * 100) : undefined, // display as percentage integer
            displayOrder: crit.displayOrder,
        });
        setIsCriteriaModalOpen(true);
    };

    const handleDeleteCriteria = async (criteriaId: number) => {
        try {
            await callDeleteTemplateCriteria(criteriaId);
            notify.success("Xóa tiêu chí thành công");
            loadData();
        } catch (error: any) {
            const msg = error?.message || error?.response?.data?.message || "Lỗi xóa tiêu chí";
            notify.error(msg);
        }
    };

    const handleCriteriaFormSubmit = async (values: any) => {
        if (!selectedSectionId) return;
        const newWeightDecimal = Number(values.weight) / 100;

        // Find the active section and its maximum weight limit
        const activeSec = sections.find(s => s.id === selectedSectionId);
        const maxWeight = activeSec?.weight ?? 0;

        // Validate total weight of criteria doesn't exceed section weight
        let total = 0;
        const criteriaList = activeSec?.criteria ?? [];
        criteriaList.forEach((c: any) => {
            if (c.id !== editingCriteria?.id) {
                total += c.weight ?? 0;
            }
        });
        total += newWeightDecimal;

        if (!selectedParentCriteriaId && total > maxWeight + 0.0001) {
            notify.error(`Tổng trọng số của các tiêu chí không được vượt quá trọng số của phần (${Math.round(maxWeight * 100)}%)!`);
            return;
        }

        const payload: any = {
            name: values.name,
            description: values.description || "",
            measurementMethod: values.measurementMethod || "",
            weight: selectedParentCriteriaId ? 0 : newWeightDecimal, // convert percentage back to decimal
            displayOrder: values.displayOrder,
        };
        
        if (selectedParentCriteriaId) {
            payload.parentCriteria = { id: selectedParentCriteriaId };
        }

        try {
            if (editingCriteria?.id) {
                await callUpdateTemplateCriteria(editingCriteria.id, payload);
                notify.success("Cập nhật tiêu chí thành công");
            } else {
                await callCreateTemplateCriteria(selectedSectionId, payload);
                notify.success("Thêm tiêu chí thành công");
            }
            setIsCriteriaModalOpen(false);
            loadData();
        } catch (error: any) {
            const msg = error?.message || error?.response?.data?.message || "Lỗi lưu tiêu chí";
            notify.error(msg);
        }
    };

    const onCriteriaFinishFailed = ({ errorFields }: any) => {
        const firstError = errorFields[0]?.errors[0];
        if (firstError) notify.error(firstError);
    };

    // Levels configuration
    const handleConfigureLevels = (crit: ITemplateCriteria) => {
        setActiveCriteria(crit);
        levelsForm.resetFields();

        // Preset standard 5 levels
        const existingLevels = crit.levels ?? [];
        const levelsObj: Record<string, any> = {};
        for (let i = 1; i <= 5; i++) {
            const found = existingLevels.find((l: any) => l.level === i);
            levelsObj[`levelDescription_${i}`] = found ? found.description : "";
            levelsObj[`levelId_${i}`] = found ? found.id : null;
        }
        levelsForm.setFieldsValue(levelsObj);
        setIsLevelsModalOpen(true);
    };

    const handleLevelsFormSubmit = async (values: any) => {
        if (!activeCriteria?.id) return;

        try {
            for (let i = 1; i <= 5; i++) {
                const levelId = values[`levelId_${i}`];
                const desc = values[`levelDescription_${i}`] ?? "";
                const payload = {
                    level: i,
                    description: desc,
                };

                if (levelId) {
                    await callUpdateCriteriaLevel(levelId, payload);
                } else {
                    await callCreateCriteriaLevel(activeCriteria.id, payload);
                }
            }
            notify.success("Cấu hình mức điểm thành công");
            setIsLevelsModalOpen(false);
            loadData();
        } catch (error) {
            notify.error("Lỗi lưu cấu hình mức điểm");
        }
    };

    // Computations for UI indicators
    const sumSectionWeights = sections.reduce((acc, s) => acc + (s.weight ?? 0), 0);
    const sumCriteriaWeights = activeCriteriaList.reduce((acc: number, c: any) => acc + (c.weight ?? 0), 0);

    const isSectionsWeightValid = Math.abs(sumSectionWeights - 1.0) < 0.0001;
    const isCriteriaWeightValid = activeSection 
        ? Math.abs(sumCriteriaWeights - activeSection.weight) < 0.0001 
        : false;

    // ── Derived status helpers ────────────────────────────────────────
    const weightPct        = Math.round(sumSectionWeights * 100);
    const weightStatus: "ok" | "over" | "under" =
        isSectionsWeightValid ? "ok" : sumSectionWeights > 1 ? "over" : "under";
    const weightBarColor =
        weightStatus === "ok"    ? "linear-gradient(90deg,#10b981,#34d399)" :
        weightStatus === "over"  ? "linear-gradient(90deg,#ef4444,#f97316)" :
                                   "linear-gradient(135deg,#e8637a 0%,#f97daa 100%)";
    const weightBorderColor =
        weightStatus === "ok"   ? "#bbf7d0" :
        weightStatus === "over" ? "#fecaca" : "rgba(232,99,122,.25)";
    const weightChipBg    =
        weightStatus === "ok"   ? { bg: "#dcfce7", color: "#15803d" } :
        weightStatus === "over" ? { bg: "#fee2e2", color: "#b91c1c" } :
                                  { bg: "#fff0f2", color: PINK };

    return (
        <Spin spinning={loading}>
            {/* ── Global scoped styles ── */}
            <style>{`
                .hrm-back-btn:hover { background: #f8fafc !important; border-color: #cbd5e1 !important; color: #374151 !important; }
                .hrm-activate-btn:hover:not(:disabled) { opacity: 0.9; transform: translateY(-1px); }
                .hrm-sec-card:hover { border-color: rgba(232,99,122,.35) !important; box-shadow: 0 4px 16px rgba(232,99,122,.1) !important; }
                .hrm-sec-card.active { border-color: ${PINK} !important; background: #fff5f7 !important; }
                .hrm-sec-card.dragover { border-color: ${PINK} !important; border-style: dashed !important; background: #fff0f2 !important; transform: scale(1.01); }
                .hrm-crit-card { transition: box-shadow 150ms ease; }
                .hrm-crit-card:hover { box-shadow: 0 4px 20px rgba(0,0,0,.07) !important; }
                .hrm-auto-btn:hover { background: #ffe4e9 !important; }
                .hrm-section-pill:hover { border-color: rgba(232,99,122,.45) !important; color: ${PINK} !important; }
                .hrm-panel-collapse-btn:hover { background: #f1f5f9 !important; }
                .hrm-add-btn:hover { opacity: 0.88; }
            `}</style>

            <div style={{ padding: "24px", minHeight: "calc(100vh - 100px)", background: "#f1f5f9" }}>

                {/* ══════════ HEADER ══════════ */}
                <div style={{
                    background: "#fff",
                    borderRadius: 12,
                    border: "1px solid #e2e8f0",
                    boxShadow: "0 1px 6px rgba(0,0,0,.05)",
                    marginBottom: 16,
                    overflow: "hidden",
                    position: "relative",
                }}>
                    {/* Left accent bar */}
                    <div style={{
                        position: "absolute", top: 0, left: 0, bottom: 0, width: 4,
                        background: "linear-gradient(180deg,#e8637a,#f97daa)",
                        borderRadius: "12px 0 0 12px",
                    }} />

                    <div style={{ padding: "18px 24px 14px 28px" }}>
                        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 20 }}>
                            {/* Left: back + title */}
                            <div style={{ display: "flex", gap: 12, flex: 1, minWidth: 0, alignItems: "flex-start" }}>
                                <Tooltip title="Quay lại">
                                    <button
                                        className="hrm-back-btn"
                                        onClick={() => navigate("/admin/evaluation/templates")}
                                        style={{
                                            width: 34, height: 34, borderRadius: 8,
                                            border: "1px solid #e2e8f0",
                                            background: "#f8fafc",
                                            cursor: "pointer",
                                            display: "flex", alignItems: "center", justifyContent: "center",
                                            flexShrink: 0, marginTop: 1,
                                            transition: "all 150ms ease",
                                            color: "#64748b",
                                            fontSize: 16, fontWeight: 500,
                                        }}
                                    >
                                        <ArrowLeftOutlined style={{ fontSize: 13 }} />
                                    </button>
                                </Tooltip>

                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontSize: 11, color: "#94a3b8", fontWeight: 500, marginBottom: 3, letterSpacing: ".02em", textTransform: "uppercase" }}>
                                        Mẫu đánh giá / Thiết lập tiêu chí
                                    </div>
                                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 4 }}>
                                        <span style={{ fontSize: 17, fontWeight: 800, color: "#0f172a", letterSpacing: "-.025em", lineHeight: 1.3 }}>
                                            {template?.name ?? "—"}
                                        </span>
                                        <span style={{
                                            padding: "2px 9px", borderRadius: 6,
                                            fontSize: 11, fontWeight: 700, letterSpacing: ".03em",
                                            background: template?.type === "STAFF" ? "#eff6ff" : "#f5f3ff",
                                            color: template?.type === "STAFF" ? "#1d4ed8" : "#7c3aed",
                                            border: `1px solid ${template?.type === "STAFF" ? "#bfdbfe" : "#ddd6fe"}`,
                                        }}>
                                            {template?.type === "STAFF" ? "Nhân viên" : "Quản lý"}
                                        </span>
                                        <span style={{
                                            padding: "2px 9px", borderRadius: 6,
                                            fontSize: 11, fontWeight: 700, letterSpacing: ".03em",
                                            background: template?.status === "ACTIVE" ? "#dcfce7" : template?.status === "ARCHIVED" ? "#fee2e2" : "#f8fafc",
                                            color: template?.status === "ACTIVE" ? "#15803d" : template?.status === "ARCHIVED" ? "#b91c1c" : "#64748b",
                                            border: `1px solid ${template?.status === "ACTIVE" ? "#bbf7d0" : template?.status === "ARCHIVED" ? "#fecaca" : "#e2e8f0"}`,
                                        }}>
                                            {template?.status === "ACTIVE" ? "Đang áp dụng" : template?.status === "ARCHIVED" ? "Lưu trữ" : "Bản nháp"}
                                        </span>
                                    </div>
                                    {template?.description && (
                                        <p style={{ margin: 0, fontSize: 13, color: "#64748b", lineHeight: 1.55, maxWidth: 580 }}>
                                            {template.description}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Right: Activate CTA */}
                            {template?.status === "DRAFT" && (
                                <Access permission={ALL_PERMISSIONS.EVALUATION.PUBLISH_TEMPLATE} hideChildren>
                                    <Popconfirm
                                        title="Kích hoạt mẫu đánh giá?"
                                        description="Mẫu sau khi kích hoạt sẽ không thể chỉnh sửa cấu trúc nữa."
                                        onConfirm={handlePublish}
                                        okText="Đồng ý"
                                        cancelText="Hủy"
                                        placement="bottomRight"
                                    >
                                        <Button
                                            type="primary"
                                            icon={<CheckCircleOutlined />}
                                            className="hrm-activate-btn"
                                            disabled={!isSectionsWeightValid}
                                            style={{
                                                borderRadius: 8,
                                                background: isSectionsWeightValid ? PINK : undefined,
                                                borderColor: isSectionsWeightValid ? PINK : undefined,
                                                fontWeight: 700, fontSize: 13,
                                                height: 36,
                                                boxShadow: isSectionsWeightValid ? `0 4px 14px rgba(232,99,122,.35)` : "none",
                                                transition: "all 200ms ease",
                                            }}
                                        >
                                            Kích hoạt mẫu
                                        </Button>
                                    </Popconfirm>
                                </Access>
                            )}
                        </div>

                        {/* Meta row */}
                        <div style={{
                            display: "flex", gap: 18, marginTop: 12,
                            paddingTop: 10, borderTop: "1px solid #f1f5f9",
                            fontSize: 12, color: "#94a3b8",
                        }}>
                            {(template?.createdBy || template?.createdAt) && (
                                <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
                                    <UserOutlined style={{ fontSize: 11 }} />
                                    <span style={{ color: "#64748b" }}>Tạo bởi</span>
                                    <span style={{ color: "#334155", fontWeight: 600 }}>{template.createdBy}</span>
                                    {template.createdAt && <span style={{ color: "#cbd5e1" }}>• {dayjs(template.createdAt).format("DD/MM/YYYY HH:mm")}</span>}
                                </span>
                            )}
                            {(template?.updatedBy || template?.updatedAt) && (
                                <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
                                    <ClockCircleOutlined style={{ fontSize: 11 }} />
                                    <span style={{ color: "#64748b" }}>Cập nhật</span>
                                    <span style={{ color: "#334155", fontWeight: 600 }}>{template.updatedBy}</span>
                                    {template.updatedAt && <span style={{ color: "#cbd5e1" }}>• {dayjs(template.updatedAt).format("DD/MM/YYYY HH:mm")}</span>}
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {/* ══════════ WEIGHT STATS ROW (MINIMALIST) ══════════ */}
                {sections.length > 0 && (
                    <div style={{ marginBottom: 24, marginTop: 8 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 12, flexWrap: "wrap", gap: 16 }}>
                            <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
                                <h3 style={{ fontSize: 13, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.06em", margin: 0 }}>
                                    Tổng trọng số
                                </h3>
                                <span style={{ fontSize: 28, fontWeight: 700, color: weightChipBg.color, lineHeight: 0.8, letterSpacing: "-0.02em" }}>
                                    {weightPct}%
                                </span>
                            </div>
                            
                            {/* Section Pills */}
                            <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                                {sections.map(sec => (
                                    <button key={sec.id}
                                        onClick={() => sec.id && setSelectedSectionId(sec.id)}
                                        style={{
                                            fontSize: 13, fontWeight: 600, padding: "4px 16px", borderRadius: 999,
                                            background: sec.id === selectedSectionId ? "#fff0f2" : "#ffffff",
                                            color: sec.id === selectedSectionId ? "#e8637a" : "#64748b",
                                            border: `1px solid ${sec.id === selectedSectionId ? "rgba(232,99,122,.3)" : "#e2e8f0"}`,
                                            boxShadow: sec.id === selectedSectionId ? "0 2px 4px rgba(232,99,122,.05)" : "0 1px 2px rgba(0,0,0,.02)",
                                            cursor: "pointer", transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)"
                                        }}
                                    >
                                        {sec.code} <span style={{ opacity: sec.id === selectedSectionId ? 0.9 : 0.6, marginLeft: 4, fontSize: 12 }}>{Math.round((sec.weight ?? 0) * 100)}%</span>
                                    </button>
                                ))}
                                
                                {/* Auto-distribute */}
                                {template?.status === "DRAFT" && weightStatus !== "ok" && (
                                    <Tooltip title="Tự động chia đều 100% cho tất cả phần">
                                        <button onClick={handleAutoDistribute} style={{
                                            fontSize: 12, fontWeight: 600, padding: "5px 12px", borderRadius: 6,
                                            background: "transparent", border: "1px dashed #cbd5e1", color: "#64748b", cursor: "pointer",
                                            transition: "all 0.2s"
                                        }}>
                                            Chia đều
                                        </button>
                                    </Tooltip>
                                )}
                            </div>
                        </div>

                        {/* Ultra-thin Minimalist Progress Bar */}
                        <div style={{ height: 4, background: "#f1f5f9", borderRadius: 4, overflow: "hidden" }}>
                            <div style={{
                                height: "100%", width: `${Math.min(weightPct, 100)}%`,
                                background: weightBarColor, borderRadius: 4,
                                transition: "width 0.6s cubic-bezier(0.16, 1, 0.3, 1)"
                            }} />
                        </div>
                    </div>
                )}

                <Row gutter={16}>
                    {/* ══════════ LEFT PANEL: Section List ══════════ */}
                    <Col xs={24} lg={leftPanelCollapsed ? { flex: "48px" } : (rightPanelCollapsed ? { flex: "auto" } : { span: 8 })}
                        style={{ transition: "all 0.3s cubic-bezier(.4,0,.2,1)", minWidth: 0 }}
                    >
                        <div style={{
                            background: leftPanelCollapsed ? "#fafafa" : "#fff",
                            borderRadius: 12,
                            border: "1px solid #e2e8f0",
                            boxShadow: "0 1px 4px rgba(0,0,0,.04)",
                            overflow: "hidden",
                            height: "100%",
                        }}>
                            {/* Panel header */}
                            {!leftPanelCollapsed ? (
                                <div style={{
                                    display: "flex", alignItems: "center", justifyContent: "space-between",
                                    padding: "12px 16px",
                                    borderBottom: "1px solid #f1f5f9",
                                    background: "#fafafa",
                                }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                        <div style={{
                                            width: 3, height: 16, borderRadius: 2,
                                            background: PINK,
                                        }} />
                                        <span style={{ fontWeight: 700, fontSize: 13, color: "#0f172a", letterSpacing: "-.01em" }}>Phần cấu trúc</span>
                                        {sections.length > 0 && (
                                            <span style={{
                                                display: "inline-flex", alignItems: "center", justifyContent: "center",
                                                width: 20, height: 20, borderRadius: 999,
                                                background: "#f1f5f9", color: "#64748b",
                                                fontSize: 11, fontWeight: 700,
                                            }}>{sections.length}</span>
                                        )}
                                    </div>
                                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                        {template?.status === "DRAFT" && (
                                            <Access permission={ALL_PERMISSIONS.EVALUATION.CREATE_SECTION} hideChildren>
                                                <Button
                                                    type="primary"
                                                    size="small"
                                                    icon={<PlusOutlined />}
                                                    onClick={handleAddSectionClick}
                                                    className="hrm-add-btn"
                                                    style={{
                                                        borderRadius: 7, background: PINK, borderColor: PINK,
                                                        fontWeight: 600, fontSize: 12, height: 30,
                                                    }}
                                                >
                                                    Thêm phần
                                                </Button>
                                            </Access>
                                        )}
                                        <Tooltip title="Thu gọn">
                                            <button className="hrm-panel-collapse-btn"
                                                onClick={() => setLeftPanelCollapsed(true)}
                                                style={{
                                                    width: 28, height: 28, borderRadius: 7,
                                                    border: "1px solid #e2e8f0", background: "#fff",
                                                    cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                                                    color: "#94a3b8", transition: "all 150ms ease",
                                                }}
                                            >
                                                <LeftOutlined style={{ fontSize: 10 }} />
                                            </button>
                                        </Tooltip>
                                    </div>
                                </div>
                            ) : (
                                <Tooltip title="Mở rộng panel phần" placement="right">
                                    <div 
                                        onClick={() => setLeftPanelCollapsed(false)}
                                        style={{
                                            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-start",
                                            height: "100%", minHeight: 400, cursor: "pointer", width: "100%",
                                            paddingTop: 16, gap: 16
                                        }}
                                    >
                                        <RightOutlined style={{ fontSize: 14, color: "#94a3b8" }} />
                                        <div style={{ writingMode: "vertical-rl", fontWeight: 700, color: "#94a3b8", letterSpacing: 2, fontSize: 12 }}>
                                            PHẦN CẤU TRÚC
                                        </div>
                                    </div>
                                </Tooltip>
                            )}

                            {/* Section list */}
                            {!leftPanelCollapsed && (
                                <div style={{ padding: "10px 12px" }}>
                                    {sections.length === 0 ? (
                                        <div style={{
                                            textAlign: "center", padding: "48px 0",
                                            color: "#94a3b8", fontSize: 13,
                                        }}>
                                            <OrderedListOutlined style={{ fontSize: 28, marginBottom: 8, display: "block", color: "#cbd5e1" }} />
                                            Chưa có phần nào. Nhấn "Thêm phần" để bắt đầu.
                                        </div>
                                    ) : (
                                        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                                            {sections.map((sec) => {
                                                const isSelected = sec.id === selectedSectionId;
                                                const isDragOver = dragOverId === sec.id;
                                                const critCount = sec.criteria?.length ?? 0;
                                                return (
                                                    <div
                                                        key={sec.id}
                                                        className={`hrm-sec-card${isSelected ? " active" : ""}${isDragOver ? " dragover" : ""}`}
                                                        draggable={template?.status === "DRAFT"}
                                                        onDragStart={(e) => sec.id && handleDragStart(e, sec.id)}
                                                        onDragOver={(e) => sec.id && handleDragOver(e, sec.id)}
                                                        onDragLeave={handleDragLeave}
                                                        onDrop={(e) => sec.id && handleDrop(e, sec.id)}
                                                        onDragEnd={handleDragEnd}
                                                        onClick={() => sec.id && setSelectedSectionId(sec.id)}
                                                        style={{
                                                            display: "flex", alignItems: "center", gap: 0,
                                                            borderRadius: 8,
                                                            border: `1.5px solid ${isSelected ? PINK : "#e2e8f0"}`,
                                                            background: isSelected ? "#fff5f7" : "#fff",
                                                            cursor: template?.status === "DRAFT" ? "grab" : "pointer",
                                                            transition: "all 150ms ease",
                                                            overflow: "hidden",
                                                        }}
                                                    >
                                                        {/* Active accent bar */}
                                                        <div style={{
                                                            width: 3, alignSelf: "stretch", flexShrink: 0,
                                                            background: isSelected ? PINK : "transparent",
                                                            transition: "background 150ms ease",
                                                        }} />

                                                        <div style={{ flex: 1, padding: "10px 12px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, minWidth: 0 }}>
                                                            <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                                                                {/* Drag handle */}
                                                                {template?.status === "DRAFT" && (
                                                                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2, opacity: 0.3, flexShrink: 0 }}>
                                                                        {[0,1,2,3].map(i => (
                                                                            <span key={i} style={{ width: 3, height: 3, borderRadius: "50%", background: "#475569", display: "block" }} />
                                                                        ))}
                                                                    </div>
                                                                )}
                                                                {/* Code badge */}
                                                                <span style={{
                                                                    width: 28, height: 28, borderRadius: 6, flexShrink: 0,
                                                                    background: isSelected ? PINK : "#f1f5f9",
                                                                    color: isSelected ? "#fff" : "#475569",
                                                                    display: "inline-flex", alignItems: "center", justifyContent: "center",
                                                                    fontWeight: 800, fontSize: 13, transition: "all 150ms ease",
                                                                }}>
                                                                    {sec.code}
                                                                </span>
                                                                <div style={{ minWidth: 0 }}>
                                                                    <div style={{
                                                                        fontWeight: 600, fontSize: 13,
                                                                        color: isSelected ? "#9a1932" : "#1e293b",
                                                                        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                                                                    }}>
                                                                        {sec.name}
                                                                    </div>
                                                                    <div style={{ fontSize: 11, color: "#94a3b8", display: "flex", gap: 8 }}>
                                                                        <span style={{ fontWeight: 600, color: isSelected ? PINK : "#64748b" }}>{Math.round((sec.weight ?? 0) * 100)}%</span>
                                                                        <span>·</span>
                                                                        <span>{critCount} tiêu chí</span>
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            {template?.status === "DRAFT" && (
                                                                <div style={{ display: "flex", gap: 4 }} onClick={(e) => e.stopPropagation()}>
                                                                    <Access permission={ALL_PERMISSIONS.EVALUATION.UPDATE_SECTION} hideChildren>
                                                                        <Tooltip title="Chỉnh sửa">
                                                                            <Button
                                                                                size="small"
                                                                                icon={<EditOutlined style={{ fontSize: 11 }} />}
                                                                                onClick={(e) => handleEditSectionClick(sec, e)}
                                                                                style={{ borderRadius: 6, width: 26, height: 26, border: "1px solid #e2e8f0", background: "#f8fafc" }}
                                                                            />
                                                                        </Tooltip>
                                                                    </Access>
                                                                    <Access permission={ALL_PERMISSIONS.EVALUATION.DELETE_SECTION} hideChildren>
                                                                        <Popconfirm
                                                                            title="Xóa phần này cùng toàn bộ tiêu chí?"
                                                                            okText="Xóa" cancelText="Hủy"
                                                                            onConfirm={(e) => sec.id && handleDeleteSection(sec.id, e as any)}
                                                                        >
                                                                            <Button
                                                                                size="small" danger
                                                                                icon={<DeleteOutlined style={{ fontSize: 11 }} />}
                                                                                style={{ borderRadius: 6, width: 26, height: 26 }}
                                                                            />
                                                                        </Popconfirm>
                                                                    </Access>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </Col>

                    {/* ══════════ RIGHT PANEL: Criteria ══════════ */}
                    <Col xs={24} lg={leftPanelCollapsed ? { flex: "auto" } : (rightPanelCollapsed ? { flex: "48px" } : { span: 16 })}
                        style={{ transition: "all 0.3s cubic-bezier(.4,0,.2,1)", minWidth: 0 }}
                    >
                        {selectedSectionId ? (
                            <div style={{
                                background: rightPanelCollapsed ? "#fafafa" : "#fff",
                                borderRadius: 12,
                                border: "1px solid #e2e8f0",
                                boxShadow: "0 1px 4px rgba(0,0,0,.04)",
                                overflow: "hidden",
                                height: "100%",
                            }}>
                                {/* Right panel header */}
                                {!rightPanelCollapsed ? (
                                    <div style={{
                                        display: "flex", alignItems: "center", justifyContent: "space-between",
                                        padding: "12px 20px",
                                        borderBottom: "1px solid #f1f5f9",
                                        background: "#fafafa",
                                    }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", flex: 1 }}>
                                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                                <div style={{ width: 3, height: 16, borderRadius: 2, background: PINK }} />
                                                <span style={{ fontWeight: 700, fontSize: 13, color: "#0f172a" }}>
                                                    Tiêu chí — <span style={{ color: PINK }}>Phần {activeSection?.code}: {activeSection?.name}</span>
                                                </span>
                                            </div>
                                            {activeCriteriaList.length > 0 && (
                                                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                                    <span style={{ fontSize: 11, color: "#94a3b8" }}>
                                                        {Math.round(sumCriteriaWeights * 100)}% / {Math.round((activeSection?.weight ?? 0) * 100)}%
                                                    </span>
                                                    <div style={{ width: 80, height: 5, background: "#f1f5f9", borderRadius: 999, overflow: "hidden" }}>
                                                        <div style={{
                                                            height: "100%",
                                                            width: `${Math.min(Number(((sumCriteriaWeights / (activeSection?.weight ?? 1)) * 100).toFixed(0)), 100)}%`,
                                                            background: isCriteriaWeightValid ? "#10b981" : sumCriteriaWeights > (activeSection?.weight ?? 0) ? "#ef4444" : "#f59e0b",
                                                            borderRadius: 999, transition: "width .4s ease",
                                                        }} />
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                        <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                                            {template?.status === "DRAFT" && (
                                                <Access permission={ALL_PERMISSIONS.EVALUATION.CREATE_CRITERIA} hideChildren>
                                                    <Button
                                                        type="primary"
                                                        size="small"
                                                        icon={<PlusOutlined />}
                                                        onClick={handleAddCriteriaClick}
                                                        className="hrm-add-btn"
                                                        style={{
                                                            borderRadius: 7, background: PINK, borderColor: PINK,
                                                            fontWeight: 600, fontSize: 12, height: 30,
                                                        }}
                                                    >
                                                        Thêm tiêu chí
                                                    </Button>
                                                </Access>
                                            )}
                                            <Tooltip title="Thu gọn">
                                                <button className="hrm-panel-collapse-btn"
                                                    onClick={() => setRightPanelCollapsed(true)}
                                                    style={{
                                                        width: 28, height: 28, borderRadius: 7,
                                                        border: "1px solid #e2e8f0", background: "#fff",
                                                        cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                                                        color: "#94a3b8", transition: "all 150ms ease",
                                                    }}
                                                >
                                                    <RightOutlined style={{ fontSize: 10 }} />
                                                </button>
                                            </Tooltip>
                                        </div>
                                    </div>
                                ) : (
                                    <Tooltip title="Mở rộng panel tiêu chí" placement="left">
                                        <div 
                                            onClick={() => setRightPanelCollapsed(false)}
                                            style={{
                                                display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-start",
                                                height: "100%", minHeight: 400, cursor: "pointer", width: "100%",
                                                paddingTop: 16, gap: 16
                                            }}
                                        >
                                            <LeftOutlined style={{ fontSize: 14, color: "#94a3b8" }} />
                                            <div style={{ writingMode: "vertical-rl", fontWeight: 700, color: "#94a3b8", letterSpacing: 2, fontSize: 12 }}>
                                                TIÊU CHÍ ĐÁNH GIÁ
                                            </div>
                                        </div>
                                    </Tooltip>
                                )}
                                {rightPanelCollapsed ? null : activeCriteriaList.length === 0 ? (
                                    <div style={{ textAlign: "center", padding: "72px 0", color: "#94a3b8", fontSize: 13 }}>
                                        <BookOutlined style={{ fontSize: 32, display: "block", marginBottom: 10, color: "#cbd5e1" }} />
                                        Chưa có tiêu chí nào. Nhấn "Thêm tiêu chí" để bắt đầu.
                                    </div>
                                ) : (
                                    <div style={{ padding: "14px 16px", display: "flex", flexDirection: "column", gap: 10 }}>
                                        {activeCriteriaList.map((crit: any, critIndex: number) => {
                                            const criteriaNo = critIndex + 1;
                                            const lvlOk = !crit.subCriteria?.length && (crit.levels?.filter((l: any) => l.description?.trim()).length ?? 0) >= 5;
                                            return (
                                                <div
                                                    key={crit.id}
                                                    className="hrm-crit-card"
                                                    style={{
                                                        background: "#fff",
                                                        border: "1px solid #e2e8f0",
                                                        borderRadius: 8,
                                                        padding: "12px 16px",
                                                    }}
                                                >
                                                {/* Header Row */}
                                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
                                                    <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", minWidth: 0, flex: 1 }}>
                                                        {/* Number badge */}
                                                        <span style={{
                                                            flexShrink: 0,
                                                            color: "#0f172a",
                                                            fontWeight: 800, fontSize: 16,
                                                            fontFamily: "monospace",
                                                        }}>
                                                            {criteriaNo < 10 ? `0${criteriaNo}` : criteriaNo}.
                                                        </span>
                                                        <div style={{ fontWeight: 600, fontSize: 15, color: "#0f172a" }}>
                                                            {crit.name}
                                                        </div>
                                                        {/* Inline Metadata */}
                                                        <div style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 13, color: "#64748b", marginLeft: 4 }}>
                                                            <span style={{ color: "#334155", fontWeight: 500 }}>
                                                                Trọng số: {(crit.weight * 100).toFixed(0)}%
                                                            </span>
                                                            <span style={{ color: "#e2e8f0" }}>•</span>
                                                            {crit.subCriteria?.length > 0 ? (
                                                                <span>{crit.subCriteria.length} mục con</span>
                                                            ) : (
                                                                <span style={{ 
                                                                    padding: "2px 8px", borderRadius: 6, fontSize: 12, fontWeight: 600,
                                                                    background: lvlOk ? "#dcfce7" : "#ffedd5",
                                                                    color: lvlOk ? "#16a34a" : "#ea580c"
                                                                }}>
                                                                    {lvlOk ? "Đủ mức điểm" : "Thiếu mức điểm"}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>

                                                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                                        {template?.status === "DRAFT" && (
                                                            <Space size={8}>
                                                            {(!crit.subCriteria || crit.subCriteria.length === 0) && (
                                                                <Access permission={ALL_PERMISSIONS.EVALUATION.CREATE_LEVEL} hideChildren>
                                                                    <div
                                                                        onClick={() => handleConfigureLevels(crit)}
                                                                        style={{ 
                                                                            display: "flex", alignItems: "center", gap: 6,
                                                                            padding: "4px 10px", borderRadius: 6, cursor: "pointer",
                                                                            background: "#ffffff", border: "1px solid #e2e8f0",
                                                                            color: "#475569", fontWeight: 600, fontSize: 13,
                                                                            transition: "all 0.2s"
                                                                        }}
                                                                        onMouseEnter={(e) => { e.currentTarget.style.background = "#f8fafc"; e.currentTarget.style.borderColor = "#cbd5e1"; }}
                                                                        onMouseLeave={(e) => { e.currentTarget.style.background = "#ffffff"; e.currentTarget.style.borderColor = "#e2e8f0"; }}
                                                                    >
                                                                        <TrophyOutlined />
                                                                        <span>Mức điểm</span>
                                                                    </div>
                                                                </Access>
                                                            )}
                                                            <Access permission={ALL_PERMISSIONS.EVALUATION.CREATE_CRITERIA} hideChildren>
                                                                <div
                                                                    onClick={() => handleAddSubCriteriaClick(crit)}
                                                                    style={{ 
                                                                        display: "flex", alignItems: "center", gap: 6,
                                                                        padding: "4px 10px", borderRadius: 6, cursor: "pointer",
                                                                        background: "#ffffff", border: "1px solid #e2e8f0",
                                                                        color: "#475569", fontWeight: 600, fontSize: 13,
                                                                        transition: "all 0.2s"
                                                                    }}
                                                                    onMouseEnter={(e) => { e.currentTarget.style.background = "#f8fafc"; e.currentTarget.style.borderColor = "#cbd5e1"; }}
                                                                    onMouseLeave={(e) => { e.currentTarget.style.background = "#ffffff"; e.currentTarget.style.borderColor = "#e2e8f0"; }}
                                                                >
                                                                    <PlusOutlined />
                                                                    <span>Mục con</span>
                                                                </div>
                                                            </Access>
                                                            <Access permission={ALL_PERMISSIONS.EVALUATION.UPDATE_CRITERIA} hideChildren>
                                                                <div
                                                                    onClick={() => handleEditCriteriaClick(crit)}
                                                                    style={{ 
                                                                        display: "flex", alignItems: "center", justifyContent: "center",
                                                                        width: 28, height: 28, borderRadius: 6, cursor: "pointer",
                                                                        color: "#d97706", transition: "all 0.2s",
                                                                        background: "transparent"
                                                                    }}
                                                                    onMouseEnter={(e) => { e.currentTarget.style.background = "#fef3c7"; }}
                                                                    onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                                                                >
                                                                    <EditOutlined style={{ fontSize: 14 }} />
                                                                </div>
                                                            </Access>
                                                            <Access permission={ALL_PERMISSIONS.EVALUATION.DELETE_CRITERIA} hideChildren>
                                                                <Popconfirm
                                                                    title="Xóa tiêu chí?"
                                                                    okText="Xóa"
                                                                    cancelText="Hủy"
                                                                    onConfirm={() => crit.id && handleDeleteCriteria(crit.id)}
                                                                >
                                                                    <div
                                                                        style={{ 
                                                                            display: "flex", alignItems: "center", justifyContent: "center",
                                                                            width: 28, height: 28, borderRadius: 6, cursor: "pointer",
                                                                            color: "#ef4444", transition: "all 0.2s",
                                                                            background: "transparent"
                                                                        }}
                                                                        onMouseEnter={(e) => { e.currentTarget.style.background = "#fee2e2"; }}
                                                                        onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                                                                    >
                                                                        <DeleteOutlined style={{ fontSize: 14 }} />
                                                                    </div>
                                                                </Popconfirm>
                                                            </Access>
                                                            </Space>
                                                        )}
                                                        {/* Collapse Toggle */}
                                                        {crit.subCriteria?.length > 0 && (
                                                            <div 
                                                                onClick={() => toggleCriteriaCollapse(crit.id)}
                                                                style={{ 
                                                                    display: "flex", alignItems: "center", justifyContent: "center",
                                                                    width: 28, height: 28, borderRadius: 6, cursor: "pointer",
                                                                    color: "#64748b", transition: "all 0.2s",
                                                                    border: "1px solid transparent", background: "transparent"
                                                                }}
                                                                onMouseEnter={(e) => {
                                                                    e.currentTarget.style.background = "#f1f5f9";
                                                                    e.currentTarget.style.color = "#0f172a";
                                                                }}
                                                                onMouseLeave={(e) => {
                                                                    e.currentTarget.style.background = "transparent";
                                                                    e.currentTarget.style.color = "#64748b";
                                                                }}
                                                            >
                                                                {collapsedCriteriaIds.includes(crit.id) ? <RightOutlined style={{ fontSize: 12 }} /> : <DownOutlined style={{ fontSize: 12 }} />}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                {crit.description && (
                                                    <div style={{ marginTop: 12, color: "#475569", fontSize: 13, lineHeight: "1.5", display: "flex", gap: 8, alignItems: "flex-start" }}>
                                                        <AlignLeftOutlined style={{ marginTop: 3, fontSize: 13, opacity: 0.6 }} />
                                                        <span>{crit.description}</span>
                                                    </div>
                                                )}
                                                
                                                {crit.measurementMethod && (
                                                    <div style={{ 
                                                        marginTop: crit.description ? 6 : 12,
                                                        marginBottom: crit.subCriteria?.length ? 8 : 0, 
                                                        color: "#475569", fontSize: 13, display: "flex", gap: 8, alignItems: "flex-start", lineHeight: "1.5"
                                                    }}>
                                                        <InfoCircleOutlined style={{ marginTop: 3, fontSize: 13, opacity: 0.6 }} />
                                                        <span>{crit.measurementMethod}</span>
                                                    </div>
                                                )}

                                                {/* Levels Definition Panel */}
                                                {false && (!crit.subCriteria || crit.subCriteria.length === 0) && (
                                                    <div style={{ background: "#f8fafc", padding: "16px", borderRadius: 10, border: "1px solid #e2e8f0" }}>
                                                        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 12 }}>
                                                            <TrophyOutlined style={{ color: "#64748b", fontSize: 13 }} />
                                                            <span style={{ fontWeight: 700, fontSize: 11, color: "#475569", letterSpacing: "0.05em", textTransform: "uppercase" }}>
                                                                Định nghĩa mức điểm đánh giá
                                                            </span>
                                                        </div>

                                                    {crit.levels && crit.levels.length > 0 ? (
                                                        <div style={{
                                                            display: "flex",
                                                            width: "100%",
                                                            border: "1px solid #e2e8f0",
                                                            borderRadius: 10,
                                                            background: "#ffffff",
                                                            overflow: "hidden",
                                                            boxShadow: "0 1px 2px rgba(0,0,0,0.01)"
                                                        }}>
                                                            {[1, 2, 3, 4, 5].map((lvl, index) => {
                                                                const levelData = crit.levels?.find((l: any) => l.level === lvl);
                                                                return (
                                                                    <div
                                                                        key={lvl}
                                                                        style={{
                                                                            flex: 1,
                                                                            padding: "16px",
                                                                            borderRight: index < 4 ? "1px solid #e2e8f0" : "none",
                                                                            display: "flex",
                                                                            flexDirection: "column",
                                                                            minHeight: 110,
                                                                            background: "#ffffff",
                                                                        }}
                                                                    >
                                                                        <div style={{ display: "flex", alignItems: "center", gap: 8, borderBottom: "1px solid #f1f5f9", paddingBottom: 8, marginBottom: 10 }}>
                                                                            <span style={{
                                                                                display: "inline-flex",
                                                                                alignItems: "center",
                                                                                justifyContent: "center",
                                                                                width: 20,
                                                                                height: 20,
                                                                                borderRadius: "50%",
                                                                                background: levelData?.description ? "#f1f5f9" : "#f8fafc",
                                                                                color: levelData?.description ? "#0f172a" : "#94a3b8",
                                                                                fontWeight: 700,
                                                                                fontSize: 11,
                                                                                border: "1px solid " + (levelData?.description ? "#cbd5e1" : "#e2e8f0")
                                                                            }}>{lvl}</span>
                                                                            <span style={{ fontWeight: 700, color: "#1e293b", fontSize: 13 }}>Mức {lvl}</span>
                                                                        </div>

                                                                        <Tooltip title={levelData?.description}>
                                                                            <span style={{
                                                                                fontSize: 12,
                                                                                color: levelData?.description ? "#334155" : "#94a3b8",
                                                                                lineHeight: 1.5,
                                                                                overflow: "hidden",
                                                                                textOverflow: "ellipsis",
                                                                                WebkitLineClamp: 3,
                                                                                display: "-webkit-box",
                                                                                WebkitBoxOrient: "vertical",
                                                                                fontStyle: levelData?.description ? "normal" : "italic"
                                                                            }}>
                                                                                {levelData?.description || "Chưa thiết lập"}
                                                                            </span>
                                                                        </Tooltip>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    ) : (
                                                        <div style={{
                                                            border: "1px dashed #cbd5e1",
                                                            borderRadius: 8,
                                                            padding: "16px",
                                                            textAlign: "center",
                                                            background: "#ffffff",
                                                            color: "#64748b",
                                                            fontSize: 13
                                                        }}>
                                                            <TrophyOutlined style={{ color: "#94a3b8", fontSize: 18, marginBottom: 6, display: "block" }} />
                                                            <span>Chưa thiết lập mô tả mức điểm cho tiêu chí này. Vui lòng bấm nút <Text strong style={{ color: "#334155" }}>"Mức điểm"</Text> phía trên để bổ sung.</span>
                                                        </div>
                                                    )}
                                                </div>
                                                )}
                                                
                                                {/* Sub Criteria Render Loop */}
                                                {crit.subCriteria && crit.subCriteria.length > 0 && !collapsedCriteriaIds.includes(crit.id) && (
                                                    <div style={{ marginTop: 16, borderTop: "1px solid #f1f5f9", paddingTop: 12 }}>
                                                        <div style={{ width: "100%" }}>
                                                            {crit.subCriteria.map((sub: any, subIndex: number) => {
                                                                const subNo = `${criteriaNo}.${subIndex + 1}`;
                                                                const isLast = subIndex === crit.subCriteria.length - 1;
                                                                const subLvlOk = (sub.levels?.filter((l: any) => l.description?.trim()).length ?? 0) >= 5;
                                                                return (
                                                                <div
                                                                    key={sub.id}
                                                                    style={{
                                                                        background: "transparent",
                                                                        borderBottom: isLast ? "none" : "1px solid #f8fafc",
                                                                        padding: "12px 8px",
                                                                        transition: "background 0.2s",
                                                                    }}
                                                                >
                                                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16 }}>
                                                                        <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
                                                                            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: sub.measurementMethod ? 4 : 0 }}>
                                                                                <span style={{
                                                                                    fontWeight: 800,
                                                                                    fontSize: 14,
                                                                                    color: "#0f172a",
                                                                                    minWidth: 28,
                                                                                    fontFamily: "monospace",
                                                                                }}>
                                                                                    {subNo}
                                                                                </span>
                                                                                <span style={{ fontWeight: 600, fontSize: 14, color: "#1e293b" }}>
                                                                                    {sub.name}
                                                                                </span>
                                                                                <span style={{ 
                                                                                    padding: "2px 8px", borderRadius: 6, fontSize: 12, fontWeight: 600, marginLeft: 4,
                                                                                    background: subLvlOk ? "#dcfce7" : "#ffedd5",
                                                                                    color: subLvlOk ? "#16a34a" : "#ea580c"
                                                                                }}>
                                                                                    {subLvlOk ? "Đủ mức điểm" : "Thiếu mức điểm"}
                                                                                </span>
                                                                            </div>
                                                                            {sub.measurementMethod && (
                                                                                <div style={{ fontSize: 13, color: "#64748b", paddingLeft: 38, marginTop: 4, display: "flex", gap: 6, alignItems: "flex-start" }}>
                                                                                    <InfoCircleOutlined style={{ marginTop: 2, fontSize: 12, opacity: 0.7 }} />
                                                                                    <span>{sub.measurementMethod}</span>
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                        
                                                                        {template?.status === "DRAFT" && (
                                                                            <div style={{ display: "flex", gap: 8, opacity: 0.8, transition: "opacity 0.2s" }} onMouseEnter={(e) => e.currentTarget.style.opacity = '1'} onMouseLeave={(e) => e.currentTarget.style.opacity = '0.8'}>
                                                                                <Access permission={ALL_PERMISSIONS.EVALUATION.CREATE_LEVEL} hideChildren>
                                                                                    <div
                                                                                        onClick={() => handleConfigureLevels(sub)}
                                                                                        style={{ 
                                                                                            display: "flex", alignItems: "center", gap: 6,
                                                                                            padding: "2px 8px", borderRadius: 6, cursor: "pointer",
                                                                                            background: "#ffffff", border: "1px solid #e2e8f0",
                                                                                            color: "#475569", fontWeight: 600, fontSize: 12,
                                                                                            transition: "all 0.2s"
                                                                                        }}
                                                                                        onMouseEnter={(e) => { e.currentTarget.style.background = "#f8fafc"; e.currentTarget.style.borderColor = "#cbd5e1"; }}
                                                                                        onMouseLeave={(e) => { e.currentTarget.style.background = "#ffffff"; e.currentTarget.style.borderColor = "#e2e8f0"; }}
                                                                                    >
                                                                                        <TrophyOutlined style={{ fontSize: 13 }} />
                                                                                        <span>Mức điểm</span>
                                                                                    </div>
                                                                                </Access>
                                                                                <Access permission={ALL_PERMISSIONS.EVALUATION.UPDATE_CRITERIA} hideChildren>
                                                                                    <div
                                                                                        onClick={() => handleEditCriteriaClick(sub, crit.id)}
                                                                                        style={{ 
                                                                                            display: "flex", alignItems: "center", justifyContent: "center",
                                                                                            width: 26, height: 26, borderRadius: 6, cursor: "pointer",
                                                                                            color: "#d97706", transition: "all 0.2s",
                                                                                            background: "transparent"
                                                                                        }}
                                                                                        onMouseEnter={(e) => { e.currentTarget.style.background = "#fef3c7"; }}
                                                                                        onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                                                                                    >
                                                                                        <EditOutlined style={{ fontSize: 13 }} />
                                                                                    </div>
                                                                                </Access>
                                                                                <Access permission={ALL_PERMISSIONS.EVALUATION.DELETE_CRITERIA} hideChildren>
                                                                                    <Popconfirm
                                                                                        title="Bạn chắc chắn muốn xóa mục con này?"
                                                                                        okText="Xóa"
                                                                                        cancelText="Hủy"
                                                                                        onConfirm={() => sub.id && handleDeleteCriteria(sub.id)}
                                                                                    >
                                                                                        <div
                                                                                            style={{ 
                                                                                                display: "flex", alignItems: "center", justifyContent: "center",
                                                                                                width: 26, height: 26, borderRadius: 6, cursor: "pointer",
                                                                                                color: "#ef4444", transition: "all 0.2s",
                                                                                                background: "transparent"
                                                                                            }}
                                                                                            onMouseEnter={(e) => { e.currentTarget.style.background = "#fee2e2"; }}
                                                                                            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                                                                                        >
                                                                                            <DeleteOutlined style={{ fontSize: 13 }} />
                                                                                        </div>
                                                                                    </Popconfirm>
                                                                                </Access>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            )})}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )})}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <Card style={{ borderRadius: 12, border: "1px solid #e5e7eb" }}>
                                <div style={{ textAlign: "center", padding: "100px 0", color: "#9ca3af" }}>
                                    Hãy chọn một "Phần cấu trúc" ở danh mục bên trái để xem và thiết lập tiêu chí.
                                </div>
                            </Card>
                        )}
                    </Col>
                </Row>
            </div>

            {/* Modal Section Form */}
            <Modal
                title={editingSection ? "Cập nhật phần" : "Thêm phần mới"}
                open={isSectionModalOpen}
                onCancel={() => setIsSectionModalOpen(false)}
                footer={null}
                destroyOnHidden
            >
                <Form
                    form={sectionForm}
                    layout="vertical"
                    onFinish={handleSectionFormSubmit}
                    onFinishFailed={onSectionFinishFailed}
                    className="modal-form-no-errors"
                >
                    <Form.Item
                        name="code"
                        label="Ký hiệu phần (ví dụ: A, B, C...)"
                        rules={[
                            { required: true, message: "Ký hiệu không được để trống" },
                            { max: 10, message: "Ký hiệu không được vượt quá 10 ký tự!" }
                        ]}
                    >
                        <Input placeholder="Nhập chữ cái đại diện..." />
                    </Form.Item>
                    <Form.Item
                        name="name"
                        label="Tên phần"
                        rules={[
                            { required: true, message: "Tên phần không được để trống" },
                            { max: 200, message: "Tên phần không được vượt quá 200 ký tự!" }
                        ]}
                    >
                        <Input placeholder="Ví dụ: Đánh giá HQCV, Đánh giá Thái độ..." />
                    </Form.Item>
                    <Form.Item
                        name="weight"
                        label="Trọng số phần (%)"
                        rules={[
                            { required: true, message: "Trọng số không được để trống" },
                            {
                                pattern: /^(0|[1-9][0-9]?|100)$/,
                                message: "Trọng số phải là số nguyên từ 0 đến 100%"
                            }
                        ]}
                    >
                        <Input placeholder="Ví dụ: 40" />
                    </Form.Item>
                    <Form.Item
                        name="displayOrder"
                        label="Thứ tự hiển thị"
                        rules={[{ required: true, message: "Thứ tự không được để trống" }]}
                    >
                        <InputNumber style={{ width: "100%" }} min={1} />
                    </Form.Item>
                    <Form.Item style={{ textAlign: "right", marginBottom: 0 }}>
                        <Space>
                            <Button onClick={() => setIsSectionModalOpen(false)}>Hủy</Button>
                            <Button type="primary" htmlType="submit" style={{ background: PINK, borderColor: PINK }}>
                                Lưu
                            </Button>
                        </Space>
                    </Form.Item>
                </Form>
            </Modal>

            {/* Modal Criteria Form */}
            <Modal
                title={editingCriteria ? (selectedParentCriteriaId ? "Cập nhật tiêu chí con" : "Cập nhật tiêu chí") : (selectedParentCriteriaId ? "Thêm tiêu chí con" : "Thêm tiêu chí mới")}
                open={isCriteriaModalOpen}
                onCancel={() => setIsCriteriaModalOpen(false)}
                footer={null}
                destroyOnHidden
            >
                <Form
                    form={criteriaForm}
                    layout="vertical"
                    onFinish={handleCriteriaFormSubmit}
                    onFinishFailed={onCriteriaFinishFailed}
                    className="modal-form-no-errors"
                >
                    <Form.Item
                        name="name"
                        label="Tên tiêu chí"
                        rules={[
                            { required: true, message: "Tên tiêu chí không được để trống" },
                            { max: 300, message: "Tên tiêu chí không được vượt quá 300 ký tự!" }
                        ]}
                    >
                        <Input placeholder="Ví dụ: Năng suất công việc, Kỹ năng giao tiếp..." />
                    </Form.Item>
                    
                    <Form.Item
                        name="description"
                        label="Nội dung / Mô tả chi tiết"
                    >
                        <Input.TextArea rows={3} placeholder="Mô tả cụ thể về tiêu chí này (không bắt buộc)..." />
                    </Form.Item>

                    {!selectedParentCriteriaId && (
                        <>
                            <Form.Item
                                name="measurementMethod"
                                label="Phương pháp đo lường"
                                rules={[{ required: true, message: "Phương pháp đo lường không được để trống" }]}
                            >
                                <Input placeholder="Ví dụ: Dựa trên số lượng task hoàn thành đúng hạn..." />
                            </Form.Item>
                            
                            <Form.Item
                                name="weight"
                                label="Trọng số tiêu chí (%)"
                                rules={[
                                    { required: true, message: "Trọng số không được để trống" },
                                    {
                                        pattern: /^(0|[1-9][0-9]?|100)$/,
                                        message: "Trọng số phải là số nguyên từ 0 đến 100%"
                                    }
                                ]}
                            >
                                <Input placeholder="Ví dụ: 25" />
                            </Form.Item>
                        </>
                    )}
                    
                    <Form.Item
                        name="displayOrder"
                        label="Thứ tự hiển thị"
                        rules={[{ required: true, message: "Thứ tự không được để trống" }]}
                    >
                        <InputNumber style={{ width: "100%" }} min={1} />
                    </Form.Item>
                    <Form.Item style={{ textAlign: "right", marginBottom: 0 }}>
                        <Space>
                            <Button onClick={() => setIsCriteriaModalOpen(false)}>Hủy</Button>
                            <Button type="primary" htmlType="submit" style={{ background: PINK, borderColor: PINK }}>
                                Lưu
                            </Button>
                        </Space>
                    </Form.Item>
                </Form>
            </Modal>

            {/* Modal Levels Form */}
            <Modal
                title={
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <TrophyOutlined style={{ color: PINK }} />
                        <span>Cấu hình mô tả mức điểm: <span style={{ color: "#0f172a" }}>{activeCriteria?.name}</span></span>
                    </div>
                }
                open={isLevelsModalOpen}
                onCancel={() => setIsLevelsModalOpen(false)}
                footer={null}
                width={getModalWidth(900)}
                style={{ top: 30 }}
                destroyOnHidden
            >
                <Form
                    form={levelsForm}
                    layout="vertical"
                    onFinish={handleLevelsFormSubmit}
                >
                    <div style={{ display: "flex", flexDirection: "column", gap: 16, paddingTop: 16, paddingBottom: 16 }}>
                        {[1, 2, 3, 4, 5].map((lvl) => (
                            <div key={lvl} style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
                                <div style={{ 
                                    width: 100, flexShrink: 0, 
                                    display: "flex", alignItems: "center", gap: 8, 
                                    fontWeight: 700, fontSize: 14, color: PINK,
                                    paddingTop: 10
                                }}>
                                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: PINK }} />
                                    Mức {lvl}
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <Form.Item name={`levelId_${lvl}`} hidden>
                                        <Input />
                                    </Form.Item>
                                    <Form.Item
                                        name={`levelDescription_${lvl}`}
                                        rules={[{ required: true, message: `Vui lòng nhập mô tả` }]}
                                        style={{ marginBottom: 0 }}
                                    >
                                        <Input.TextArea 
                                            autoSize={{ minRows: 2, maxRows: 8 }} 
                                            placeholder={`Mô tả chi tiết chất lượng, năng lực để đạt được mức điểm ${lvl}...`} 
                                            style={{ background: "#f8fafc", borderRadius: 8, padding: 10, fontSize: 14 }} 
                                        />
                                    </Form.Item>
                                </div>
                            </div>
                        ))}
                    </div>
                    
                    <div style={{ padding: "16px", background: "#fff0f2", borderRadius: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div style={{ fontSize: 13, color: PINK, fontWeight: 500 }}>
                            <InfoCircleOutlined style={{ marginRight: 6 }} />
                            Viết mô tả rõ ràng để người đánh giá dễ dàng đối chiếu
                        </div>
                        <Space>
                            <Button onClick={() => setIsLevelsModalOpen(false)} style={{ borderRadius: 6, fontWeight: 500 }}>Hủy</Button>
                            <Button type="primary" htmlType="submit" style={{ background: PINK, borderColor: PINK, borderRadius: 6, fontWeight: 500 }}>
                                Lưu cấu hình
                            </Button>
                        </Space>
                    </div>
                </Form>
            </Modal>
            <style>{`
                .modal-form-no-errors .ant-form-item-explain,
                .modal-form-no-errors .ant-form-item-explain-error,
                .modal-form-no-errors .ant-form-item-margin-offset {
                    display: none !important;
                }
            `}</style>
        </Spin>
    );
};

export default TemplateDetailPage;
