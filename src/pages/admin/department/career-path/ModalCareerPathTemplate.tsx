import { useEffect, useState } from "react";
import { Form, Row, Col, Button, Typography, InputNumber, Select, Alert } from "antd";
import { ModalForm, ProFormText, ProFormTextArea } from "@ant-design/pro-components";
import { PlusOutlined, DeleteOutlined, ArrowDownOutlined } from "@ant-design/icons";
import { useParams } from "react-router-dom";

import {
    useCreateCareerPathTemplateMutation,
    useUpdateCareerPathTemplateMutation,
} from "@/hooks/useCareerPathTemplates";
import { callGetCareerPathByDepartment } from "@/config/api";
import type { ICareerPath, ICareerPathTemplate } from "@/types/backend";

const { Text } = Typography;

const T = {
    ink: "#0a0a0b", ink2: "#2c2c2e", ink3: "#636366", ink4: "#aeaeb2",
    white: "#ffffff", s1: "#fafafa", s2: "#f5f5f7",
    line: "rgba(0,0,0,0.06)",
    acc: "#0066ff", accSoft: "rgba(0,102,255,0.07)", accBord: "rgba(0,102,255,0.18)",
    green: "#34c759",
    red: "#ff3b30",
};

interface StepForm {
    careerPathId?: number;
    durationMonths?: number;
}

interface IProps {
    open: boolean;
    onClose: () => void;
    dataInit?: ICareerPathTemplate | null;
    onSuccess: () => void;
}

const ModalCareerPathTemplate = ({ open, onClose, dataInit, onSuccess }: IProps) => {
    const { departmentId } = useParams();
    const [form] = Form.useForm();
    const isEdit = Boolean(dataInit?.id);

    const [careerPaths, setCareerPaths] = useState<ICareerPath[]>([]);
    const [loadingPaths, setLoadingPaths] = useState(false);
    const [steps, setSteps] = useState<StepForm[]>([{ careerPathId: undefined }]);

    const createMutation = useCreateCareerPathTemplateMutation();
    const updateMutation = useUpdateCareerPathTemplateMutation();

    const isPending = createMutation.isPending || updateMutation.isPending;

    // ── Load chức danh phòng ban ──────────────────────────────────
    useEffect(() => {
        if (!open || !departmentId) return;
        const load = async () => {
            setLoadingPaths(true);
            try {
                const res = await callGetCareerPathByDepartment(Number(departmentId));
                setCareerPaths(res?.data ?? []);
            } catch {
                setCareerPaths([]);
            } finally {
                setLoadingPaths(false);
            }
        };
        load();
    }, [open, departmentId]);

    // ── Fill form khi edit ────────────────────────────────────────
    useEffect(() => {
        if (!open) return;
        if (isEdit && dataInit) {
            form.setFieldsValue({ name: dataInit.name, description: dataInit.description });
            setSteps(
                (dataInit.steps ?? []).map((s) => ({
                    careerPathId: s.careerPathId,
                    durationMonths: s.durationMonths,
                }))
            );
        } else {
            form.resetFields();
            setSteps([{ careerPathId: undefined }]);
        }
    }, [open, dataInit]);

    // ── Step handlers ─────────────────────────────────────────────
    const addStep = () =>
        setSteps((prev) => [...prev, { careerPathId: undefined }]);

    const removeStep = (i: number) =>
        setSteps((prev) => prev.filter((_, idx) => idx !== i));

    const updateStep = (i: number, field: keyof StepForm, value: any) =>
        setSteps((prev) => prev.map((s, idx) => idx === i ? { ...s, [field]: value } : s));

    // ── Validate ──────────────────────────────────────────────────
    const validateSteps = (): string | null => {
        if (steps.length === 0) return "Cần ít nhất 1 bước";
        for (let i = 0; i < steps.length; i++) {
            if (!steps[i].careerPathId) return `Bước ${i + 1}: chưa chọn chức danh`;
        }
        const ids = steps.map((s) => s.careerPathId);
        if (new Set(ids).size !== ids.length) return "Các bước không được trùng chức danh";
        return null;
    };

    // ── Submit ────────────────────────────────────────────────────
    const handleFinish = async (values: any) => {
        const err = validateSteps();
        if (err) return false;

        const payload = {
            name: values.name,
            description: values.description,
            departmentId: Number(departmentId),
            steps: steps.map((s, i) => ({
                stepOrder: i + 1,
                careerPathId: s.careerPathId!,
                durationMonths: s.durationMonths,
            })),
        };

        if (isEdit && dataInit?.id) {
            await updateMutation.mutateAsync({ id: dataInit.id, data: payload });
        } else {
            await createMutation.mutateAsync(payload);
        }

        onSuccess();
        return true;
    };

    // ── Options ───────────────────────────────────────────────────
    const usedIds = new Set(steps.map((s) => s.careerPathId).filter(Boolean));

    const getOptions = (currentCareerPathId?: number) =>
        careerPaths
            .filter((cp) => !usedIds.has(cp.id) || cp.id === currentCareerPathId)
            .map((cp) => ({
                label: `${cp.jobTitleName} (${cp.positionLevelCode ?? "—"})`,
                value: cp.id,
            }));

    return (
        <ModalForm
            title={isEdit ? "Cập nhật template lộ trình" : "Tạo template lộ trình"}
            open={open}
            form={form}
            onFinish={handleFinish}
            modalProps={{
                onCancel: onClose,
                afterClose: () => {
                    form.resetFields();
                    setSteps([{ careerPathId: undefined }]);
                },
                destroyOnClose: true,
                width: 660,
                maskClosable: false,
                confirmLoading: isPending,
            }}
            submitter={{
                searchConfig: {
                    submitText: isEdit ? "Cập nhật" : "Tạo template",
                    resetText: "Hủy",
                },
            }}
        >
            <Row gutter={[16, 12]}>
                {/* Tên */}
                <Col span={16}>
                    <ProFormText
                        name="name"
                        label="Tên lộ trình"
                        placeholder="VD: Lộ trình Tuyển dụng..."
                        rules={[{ required: true, message: "Nhập tên lộ trình" }]}
                    />
                </Col>

                {/* Mô tả */}
                <Col span={24}>
                    <ProFormTextArea
                        name="description"
                        label="Mô tả (tùy chọn)"
                        placeholder="Mô tả thêm..."
                        fieldProps={{ rows: 2 }}
                    />
                </Col>

                {/* Các bước */}
                <Col span={24}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                        <Text style={{ fontSize: 13, fontWeight: 600, color: T.ink2 }}>
                            Các bước thăng tiến
                        </Text>
                        <Button size="small" icon={<PlusOutlined />} onClick={addStep}
                            style={{
                                borderRadius: 6, borderColor: T.accBord,
                                color: T.acc, background: T.accSoft, fontSize: 12,
                            }}
                        >
                            Thêm bước
                        </Button>
                    </div>

                    {steps.length === 0 && (
                        <Alert type="warning" showIcon style={{ borderRadius: 8, marginBottom: 8 }}
                            message="Cần ít nhất 1 bước" />
                    )}

                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        {steps.map((step, index) => {
                            const isLast = index === steps.length - 1;
                            return (
                                <div key={index}>
                                    <div style={{
                                        padding: "12px 14px", background: T.s1,
                                        border: `1px solid ${step.careerPathId ? T.accBord : T.line}`,
                                        borderRadius: 10, transition: "border-color 0.15s",
                                    }}>
                                        {/* Header */}
                                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                                            <span style={{
                                                width: 22, height: 22, borderRadius: "50%",
                                                background: step.careerPathId ? T.accSoft : T.s2,
                                                border: `1.5px solid ${step.careerPathId ? T.accBord : T.line}`,
                                                display: "flex", alignItems: "center", justifyContent: "center",
                                                fontSize: 10, fontWeight: 700,
                                                color: step.careerPathId ? T.acc : T.ink4,
                                                flexShrink: 0,
                                            }}>
                                                {index + 1}
                                            </span>
                                            <Text style={{ fontSize: 12, fontWeight: 600, color: T.ink3, flex: 1 }}>
                                                Bước {index + 1}
                                                {isLast && (
                                                    <span style={{ marginLeft: 6, fontSize: 10, color: T.green, fontWeight: 500 }}>
                                                        (đỉnh lộ trình)
                                                    </span>
                                                )}
                                            </Text>
                                            {steps.length > 1 && (
                                                <Button type="text" size="small" danger
                                                    icon={<DeleteOutlined />}
                                                    onClick={() => removeStep(index)}
                                                    style={{ borderRadius: 6, height: 24, width: 24 }} />
                                            )}
                                        </div>

                                        <Row gutter={[10, 0]}>
                                            {/* Chức danh */}
                                            <Col span={isLast ? 24 : 14}>
                                                <Text style={{ fontSize: 11, color: T.ink4, fontWeight: 500, display: "block", marginBottom: 4 }}>
                                                    Chức danh <span style={{ color: T.red }}>*</span>
                                                </Text>
                                                <Select
                                                    style={{ width: "100%" }}
                                                    placeholder="Chọn chức danh"
                                                    showSearch loading={loadingPaths}
                                                    value={step.careerPathId}
                                                    options={getOptions(step.careerPathId)}
                                                    filterOption={(input, opt) =>
                                                        (opt?.label ?? "").toLowerCase().includes(input.toLowerCase())
                                                    }
                                                    onChange={(val) => updateStep(index, "careerPathId", val)}
                                                    size="small"
                                                />
                                            </Col>

                                            {/* Số tháng — không hiện ở bước cuối */}
                                            {!isLast && (
                                                <Col span={10}>
                                                    <Text style={{ fontSize: 11, color: T.ink4, fontWeight: 500, display: "block", marginBottom: 4 }}>
                                                        Thời gian dự kiến (tháng)
                                                    </Text>
                                                    <InputNumber
                                                        style={{ width: "100%" }}
                                                        min={1} max={120}
                                                        placeholder="VD: 12"
                                                        value={step.durationMonths}
                                                        onChange={(val) => updateStep(index, "durationMonths", val ?? undefined)}
                                                        size="small"
                                                    />
                                                </Col>
                                            )}
                                        </Row>
                                    </div>

                                    {/* Arrow connector */}
                                    {!isLast && (
                                        <div style={{ display: "flex", justifyContent: "center", padding: "3px 0" }}>
                                            <ArrowDownOutlined style={{ fontSize: 12, color: T.ink4 }} />
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </Col>
            </Row>
        </ModalForm>
    );
};

export default ModalCareerPathTemplate;