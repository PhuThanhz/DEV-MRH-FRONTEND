import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
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
} from "@ant-design/icons";
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

const PINK = "#1677ff";
const PINK_HOVER = "#4096ff";

const TemplateDetailPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const templateId = Number(id);

    const [template, setTemplate] = useState<IEvaluationTemplate | null>(null);
    const [sections, setSections] = useState<ITemplateSection[]>([]);
    const [selectedSectionId, setSelectedSectionId] = useState<number | null>(null);
    const [loading, setLoading] = useState<boolean>(false);

    // Modals state
    const [isSectionModalOpen, setIsSectionModalOpen] = useState(false);
    const [editingSection, setEditingSection] = useState<ITemplateSection | null>(null);
    const [sectionForm] = Form.useForm();

    const [isCriteriaModalOpen, setIsCriteriaModalOpen] = useState(false);
    const [editingCriteria, setEditingCriteria] = useState<ITemplateCriteria | null>(null);
    const [criteriaForm] = Form.useForm();

    const [isLevelsModalOpen, setIsLevelsModalOpen] = useState(false);
    const [activeCriteria, setActiveCriteria] = useState<ITemplateCriteria | null>(null);
    const [levelsForm] = Form.useForm();

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

            // Validate that every criterion has all 5 levels fully configured
            for (const crit of criteriaList) {
                const configuredLevels = crit.levels || [];
                const validLevels = configuredLevels.filter((l: any) => l.description && l.description.trim() !== "");
                if (validLevels.length < 5) {
                    notify.error(`Tiêu chí "${crit.name}" thuộc phần "${sec.name}" chưa được cấu hình đầy đủ 5 mức điểm!`);
                    return;
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
            const msg = error?.response?.data?.message || error?.message || "Lỗi kích hoạt mẫu đánh giá";
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
            const msg = error?.response?.data?.message || error?.message || "Lỗi xóa phần trong template";
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
            const msg = error?.response?.data?.message || error?.message || "Lỗi lưu thông tin phần";
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
        criteriaForm.resetFields();
        criteriaForm.setFieldsValue({ displayOrder: activeCriteriaList.length + 1 });
        setIsCriteriaModalOpen(true);
    };

    const handleEditCriteriaClick = (crit: ITemplateCriteria) => {
        setEditingCriteria(crit);
        criteriaForm.setFieldsValue({
            name: crit.name,
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
            const msg = error?.response?.data?.message || error?.message || "Lỗi xóa tiêu chí";
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

        if (total > maxWeight + 0.0001) {
            notify.error(`Tổng trọng số của các tiêu chí không được vượt quá trọng số của phần (${Math.round(maxWeight * 100)}%)!`);
            return;
        }

        const payload = {
            name: values.name,
            measurementMethod: values.measurementMethod,
            weight: newWeightDecimal, // convert percentage back to decimal
            displayOrder: values.displayOrder,
        };

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
            const msg = error?.response?.data?.message || error?.message || "Lỗi lưu tiêu chí";
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

    return (
        <Spin spinning={loading}>
            <div style={{ padding: "24px", minHeight: "calc(100vh - 100px)", background: "#f8f9fa" }}>
                {/* Header Section */}
                <div style={{ marginBottom: "20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <Button 
                            icon={<ArrowLeftOutlined />} 
                            onClick={() => navigate("/admin/evaluation/templates")}
                            style={{ borderRadius: 6 }}
                        />
                        <div>
                            <Title level={4} style={{ margin: 0, fontWeight: 700 }}>
                                Thiết lập tiêu chí: {template?.name}
                            </Title>
                            <Text type="secondary">
                                {template?.description || "Không có mô tả"}
                            </Text>
                        </div>
                    </div>
                    <Space>
                        <Tag color={template?.type === "STAFF" ? "blue" : "purple"}>
                            {template?.type === "STAFF" ? "Nhân viên" : "Quản lý"}
                        </Tag>
                        <Tag color={template?.status === "ACTIVE" ? "success" : template?.status === "ARCHIVED" ? "error" : "default"}>
                            {template?.status === "ACTIVE" ? "Đang áp dụng" : template?.status === "ARCHIVED" ? "Lưu trữ" : "Bản nháp"}
                        </Tag>
                        {template?.status === "DRAFT" && (
                            <Access permission={ALL_PERMISSIONS.EVALUATION.PUBLISH_TEMPLATE} hideChildren>
                                <Popconfirm
                                    title="Kích hoạt mẫu đánh giá?"
                                    description="Lưu ý: Mẫu sau khi kích hoạt sẽ không thể chỉnh sửa cấu trúc nữa."
                                    onConfirm={handlePublish}
                                    okText="Đồng ý"
                                    cancelText="Hủy"
                                >
                                    <Button 
                                        type="primary" 
                                        icon={<CheckCircleOutlined />} 
                                        style={{ borderRadius: 6, background: "#389e0d", borderColor: "#389e0d" }}
                                    >
                                        Kích hoạt mẫu
                                    </Button>
                                </Popconfirm>
                            </Access>
                        )}
                    </Space>
                </div>

                {/* Weights Alert Banner */}
                {sections.length > 0 && !isSectionsWeightValid && (
                    <Alert
                        message={
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                <WarningOutlined style={{ color: "#faad14" }} />
                                <Text style={{ color: "#8a6d3b", fontWeight: 500 }}>
                                    Cảnh báo: Tổng trọng số các Phần phải bằng 100%. Hiện tại: {(sumSectionWeights * 100).toFixed(0)}%
                                </Text>
                            </div>
                        }
                        type="warning"
                        showIcon={false}
                        style={{ marginBottom: "20px", borderRadius: 8, border: "1px solid #ffe58f", background: "#fffbe6" }}
                    />
                )}

                <Row gutter={24}>
                    {/* Left Panel: Sections List */}
                    <Col xs={24} lg={8}>
                        <Card 
                            title={
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                    <span style={{ fontWeight: 600, fontSize: 15 }}>Các phần cấu trúc</span>
                                    {template?.status === "DRAFT" && (
                                        <Access permission={ALL_PERMISSIONS.EVALUATION.CREATE_SECTION} hideChildren>
                                            <Button 
                                                type="primary" 
                                                size="small" 
                                                icon={<PlusOutlined />}
                                                onClick={handleAddSectionClick}
                                                style={{ 
                                                    borderRadius: 6, 
                                                    background: PINK, 
                                                    borderColor: PINK 
                                                }}
                                            >
                                                Thêm phần
                                            </Button>
                                        </Access>
                                    )}
                                </div>
                            }
                            styles={{ body: { padding: "12px" } }}
                            style={{ borderRadius: 12, border: "1px solid #e5e7eb", boxShadow: "0 2px 8px rgba(0,0,0,0.02)" }}
                        >
                            {sections.length === 0 ? (
                                <div style={{ textAlign: "center", padding: "40px 0", color: "#9ca3af" }}>
                                    Chưa có phần nào được thiết lập.
                                </div>
                            ) : (
                                <Space direction="vertical" style={{ width: "100%" }} size={8}>
                                    {sections.map((sec) => {
                                        const isSelected = sec.id === selectedSectionId;
                                        return (
                                            <div
                                                key={sec.id}
                                                onClick={() => sec.id && setSelectedSectionId(sec.id)}
                                                style={{
                                                    padding: "12px 16px",
                                                    borderRadius: 8,
                                                    border: isSelected ? "1.5px solid #1677ff" : "1px solid #e5e7eb",
                                                    background: isSelected ? "#e6f4ff" : "#fff",
                                                    cursor: "pointer",
                                                    transition: "all 0.2s ease",
                                                    display: "flex",
                                                    justifyContent: "space-between",
                                                    alignItems: "center",
                                                }}
                                            >
                                                <div style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
                                                    <span style={{ fontWeight: 600, color: isSelected ? "#0958d9" : "#111827" }}>
                                                        Phần {sec.code}: {sec.name}
                                                    </span>
                                                    <span style={{ fontSize: 12, color: "#6b7280" }}>
                                                        Trọng số: {(sec.weight * 100).toFixed(0)}% | Thứ tự: {sec.displayOrder}
                                                    </span>
                                                </div>
                                                {template?.status === "DRAFT" && (
                                                    <Space size={8} onClick={(e) => e.stopPropagation()}>
                                                        <Access permission={ALL_PERMISSIONS.EVALUATION.UPDATE_SECTION} hideChildren>
                                                            <Button 
                                                                size="small" 
                                                                icon={<EditOutlined style={{ fontSize: 13 }} />}
                                                                onClick={(e) => handleEditSectionClick(sec, e)}
                                                                style={{ borderRadius: 4 }}
                                                            />
                                                        </Access>
                                                        <Access permission={ALL_PERMISSIONS.EVALUATION.DELETE_SECTION} hideChildren>
                                                            <Popconfirm
                                                                title="Xác nhận xóa phần này cùng toàn bộ tiêu chí trực thuộc?"
                                                                okText="Xóa"
                                                                cancelText="Hủy"
                                                                onConfirm={(e) => sec.id && handleDeleteSection(sec.id, e as any)}
                                                            >
                                                                <Button 
                                                                    size="small" 
                                                                    danger 
                                                                    icon={<DeleteOutlined style={{ fontSize: 13 }} />}
                                                                    style={{ borderRadius: 4 }}
                                                                />
                                                            </Popconfirm>
                                                        </Access>
                                                    </Space>
                                                )}
                                            </div>
                                        );
                                    })}
                                </Space>
                            )}
                        </Card>
                    </Col>

                    {/* Right Panel: Selected Section Criteria & Levels */}
                    <Col xs={24} lg={16}>
                        {selectedSectionId ? (
                            <Card
                                title={
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                        <div>
                                            <span style={{ fontWeight: 700, fontSize: 15 }}>
                                                Tiêu chí trực thuộc (Phần {activeSection?.code})
                                            </span>
                                            {activeCriteriaList.length > 0 && (
                                                <div style={{ display: "inline-flex", alignItems: "center", gap: 12, marginLeft: 16, verticalAlign: "middle" }}>
                                                    <span style={{ fontSize: 13, color: "#64748b", fontWeight: 500 }}>
                                                        Đã phân bổ: <strong style={{ color: "#0f172a" }}>{Math.round(sumCriteriaWeights * 100)}%</strong> trên {Math.round((activeSection?.weight ?? 0) * 100)}%
                                                    </span>
                                                    <Progress
                                                        percent={Number(((sumCriteriaWeights / (activeSection?.weight ?? 1)) * 100).toFixed(0))}
                                                        showInfo={false}
                                                        strokeColor={isCriteriaWeightValid ? "#10b981" : (sumCriteriaWeights > (activeSection?.weight ?? 0) ? "#ef4444" : "#f59e0b")}
                                                        style={{ width: 80, margin: 0 }}
                                                        size={[80, 6]}
                                                    />
                                                </div>
                                            )}
                                        </div>
                                        {template?.status === "DRAFT" && (
                                            <Access permission={ALL_PERMISSIONS.EVALUATION.CREATE_CRITERIA} hideChildren>
                                                <Button
                                                    type="primary"
                                                    icon={<PlusOutlined />}
                                                    onClick={handleAddCriteriaClick}
                                                    style={{
                                                        borderRadius: 6,
                                                        background: PINK,
                                                        borderColor: PINK,
                                                    }}
                                                >
                                                    Thêm tiêu chí
                                                </Button>
                                            </Access>
                                        )}
                                    </div>
                                }
                                style={{ borderRadius: 12, border: "1px solid #e5e7eb", boxShadow: "0 2px 8px rgba(0,0,0,0.02)" }}
                            >
                                {activeCriteriaList.length === 0 ? (
                                    <div style={{ textAlign: "center", padding: "60px 0", color: "#9ca3af" }}>
                                        Chưa có tiêu chí nào cho phần này. Hãy nhấn "Thêm tiêu chí" để xây dựng cấu trúc.
                                    </div>
                                ) : (
                                    <Space direction="vertical" style={{ width: "100%" }} size={16}>
                                        {activeCriteriaList.map((crit: any) => (
                                            <div
                                                key={crit.id}
                                                style={{
                                                    background: "#ffffff",
                                                    border: "1px solid #e2e8f0",
                                                    borderRadius: 12,
                                                    padding: "20px",
                                                    boxShadow: "0 1px 3px rgba(0,0,0,0.01), 0 1px 2px rgba(0,0,0,0.02)",
                                                }}
                                            >
                                                {/* Header Row */}
                                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, marginBottom: 12 }}>
                                                    <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                                                        <span style={{ fontWeight: 700, fontSize: 16, color: "#0f172a" }}>
                                                            {crit.name}
                                                        </span>
                                                        <Tag style={{ borderRadius: 6, border: "1px solid #e2e8f0", background: "#f8fafc", color: "#475569", fontWeight: 600, fontSize: 12, padding: "2px 8px" }}>
                                                            Trọng số: {(crit.weight * 100).toFixed(0)}%
                                                        </Tag>
                                                    </div>

                                                    {template?.status === "DRAFT" && (
                                                        <Space size={8}>
                                                            <Access permission={ALL_PERMISSIONS.EVALUATION.CREATE_LEVEL} hideChildren>
                                                                <Button
                                                                    size="middle"
                                                                    icon={<TrophyOutlined style={{ color: "#64748b" }} />}
                                                                    onClick={() => handleConfigureLevels(crit)}
                                                                    style={{
                                                                        borderRadius: 8,
                                                                        borderColor: "#cbd5e1",
                                                                        background: "#ffffff",
                                                                        color: "#334155",
                                                                        fontWeight: 600,
                                                                        fontSize: 13,
                                                                    }}
                                                                >
                                                                    Mức điểm (1-5)
                                                                </Button>
                                                            </Access>
                                                            <Access permission={ALL_PERMISSIONS.EVALUATION.UPDATE_CRITERIA} hideChildren>
                                                                <Button
                                                                    size="middle"
                                                                    icon={<EditOutlined style={{ color: "#475569" }} />}
                                                                    onClick={() => handleEditCriteriaClick(crit)}
                                                                    style={{ borderRadius: 8, borderColor: "#cbd5e1", background: "#ffffff" }}
                                                                />
                                                            </Access>
                                                            <Access permission={ALL_PERMISSIONS.EVALUATION.DELETE_CRITERIA} hideChildren>
                                                                <Popconfirm
                                                                    title="Bạn chắc chắn muốn xóa tiêu chí này?"
                                                                    okText="Xóa"
                                                                    cancelText="Hủy"
                                                                    onConfirm={() => crit.id && handleDeleteCriteria(crit.id)}
                                                                >
                                                                    <Button
                                                                        size="middle"
                                                                        icon={<DeleteOutlined style={{ color: "#ef4444" }} />}
                                                                        style={{ borderRadius: 8, borderColor: "#cbd5e1", background: "#ffffff" }}
                                                                    />
                                                                </Popconfirm>
                                                            </Access>
                                                        </Space>
                                                    )}
                                                </div>

                                                {/* Measurement Method */}
                                                <div style={{ marginBottom: 16, background: "#f8fafc", padding: "10px 14px", borderRadius: 8, border: "1px solid #f1f5f9" }}>
                                                    <span style={{ fontWeight: 600, color: "#475569", fontSize: 13 }}>Phương pháp đo lường: </span>
                                                    <span style={{ color: "#0f172a", fontSize: 13 }}>{crit.measurementMethod || "—"}</span>
                                                </div>

                                                {/* Levels Definition Panel */}
                                                <div style={{ background: "#f8fafc", padding: "16px", borderRadius: 10, border: "1px solid #e2e8f0" }}>
                                                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 12 }}>
                                                        <TrophyOutlined style={{ color: "#64748b", fontSize: 13 }} />
                                                        <span style={{ fontWeight: 700, fontSize: 11, color: "#475569", letterSpacing: "0.05em", textTransform: "uppercase" }}>
                                                            Định nghĩa mức điểm đánh giá (1-5)
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
                                                            <span>Chưa thiết lập mô tả mức điểm cho tiêu chí này. Vui lòng bấm nút <Text strong style={{ color: "#334155" }}>"Mức điểm (1-5)"</Text> phía trên để bổ sung.</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </Space>
                                )}
                            </Card>
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
                destroyOnClose
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
                        rules={[{ required: true, message: "Ký hiệu không được để trống" }]}
                    >
                        <Input placeholder="Nhập chữ cái đại diện..." />
                    </Form.Item>
                    <Form.Item
                        name="name"
                        label="Tên phần"
                        rules={[{ required: true, message: "Tên phần không được để trống" }]}
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
                title={editingCriteria ? "Cập nhật tiêu chí" : "Thêm tiêu chí mới"}
                open={isCriteriaModalOpen}
                onCancel={() => setIsCriteriaModalOpen(false)}
                footer={null}
                destroyOnClose
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
                        rules={[{ required: true, message: "Tên tiêu chí không được để trống" }]}
                    >
                        <Input placeholder="Ví dụ: Năng suất công việc, Kỹ năng giao tiếp..." />
                    </Form.Item>
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
                title={`Cấu hình mô tả mức điểm (1-5): ${activeCriteria?.name}`}
                open={isLevelsModalOpen}
                onCancel={() => setIsLevelsModalOpen(false)}
                footer={null}
                width={650}
                destroyOnClose
            >
                <Form
                    form={levelsForm}
                    layout="vertical"
                    onFinish={handleLevelsFormSubmit}
                >
                    {[1, 2, 3, 4, 5].map((lvl) => (
                        <div key={lvl}>
                            <Form.Item name={`levelId_${lvl}`} hidden>
                                <Input />
                            </Form.Item>
                            <Form.Item
                                name={`levelDescription_${lvl}`}
                                label={`Mức điểm ${lvl}`}
                                rules={[{ required: true, message: `Vui lòng nhập mô tả cho mức điểm ${lvl}` }]}
                            >
                                <Input.TextArea rows={2} placeholder={`Nhập mô tả cụ thể về chất lượng/năng lực đạt được mức điểm ${lvl}...`} />
                            </Form.Item>
                        </div>
                    ))}
                    <Form.Item style={{ textAlign: "right", marginBottom: 0 }}>
                        <Space>
                            <Button onClick={() => setIsLevelsModalOpen(false)}>Hủy</Button>
                            <Button type="primary" htmlType="submit" style={{ background: PINK, borderColor: PINK }}>
                                Lưu cấu hình
                            </Button>
                        </Space>
                    </Form.Item>
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
