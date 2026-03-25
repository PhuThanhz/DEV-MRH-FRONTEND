import { useEffect, useState } from "react";
import { Form, Row, Col, Button, Typography, InputNumber, Select, Alert } from "antd";
import { ModalForm, ProFormText, ProFormTextArea } from "@ant-design/pro-components";
import { PlusOutlined, DeleteOutlined, TrophyOutlined } from "@ant-design/icons";
import { useParams } from "react-router-dom";

import {
    useCreateCareerPathTemplateMutation,
    useUpdateCareerPathTemplateMutation,
} from "@/hooks/useCareerPathTemplates";
import { callGetCareerPathByDepartment } from "@/config/api";
import type { ICareerPath, ICareerPathTemplate } from "@/types/backend";

const { Text } = Typography;

const T = {
    ink: "#0a0a0b", ink2: "#2c2c2e", ink3: "#636366", ink4: "#aeaeb2", ink5: "#d1d1d6",
    white: "#ffffff", s1: "#fafafa", s2: "#f5f5f7",
    line: "rgba(0,0,0,0.06)", lineMed: "rgba(0,0,0,0.10)",
    acc: "#0066ff", accSoft: "rgba(0,102,255,0.07)", accBord: "rgba(0,102,255,0.18)",
    green: "#1a7a3a", greenSoft: "rgba(26,122,58,0.07)", greenBord: "rgba(26,122,58,0.20)",
    red: "#ff3b30",
    amber: "#b45309", amberSoft: "rgba(245,158,11,0.08)", amberBord: "rgba(245,158,11,0.25)",
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

    useEffect(() => {
        if (!open) return;
        if (isEdit && dataInit) {
            form.setFieldsValue({ name: dataInit.name, description: dataInit.description });
            setSteps(
                (dataInit.steps ?? [])
                    .sort((a, b) => a.stepOrder - b.stepOrder)
                    .map((s) => ({
                        careerPathId: s.careerPathId,
                        durationMonths: s.durationMonths,
                    }))
            );
        } else {
            form.resetFields();
            setSteps([{ careerPathId: undefined }]);
        }
    }, [open, dataInit]);

    const addStep = () => setSteps((prev) => [...prev, { careerPathId: undefined }]);
    const removeStep = (i: number) => setSteps((prev) => prev.filter((_, idx) => idx !== i));
    const updateStep = (i: number, field: keyof StepForm, value: any) =>
        setSteps((prev) => prev.map((s, idx) => idx === i ? { ...s, [field]: value } : s));

    const validateSteps = (): string | null => {
        if (steps.length === 0) return "Cần ít nhất 1 bước trong lộ trình";
        for (let i = 0; i < steps.length; i++) {
            if (!steps[i].careerPathId) return `Bước ${i + 1}: chưa chọn chức danh`;
        }
        const ids = steps.map((s) => s.careerPathId);
        if (new Set(ids).size !== ids.length) return "Các bước không được trùng chức danh";
        return null;
    };

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
            title={
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{
                        width: 28, height: 28, borderRadius: 8,
                        background: T.accSoft, border: `1px solid ${T.accBord}`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                        <TrophyOutlined style={{ fontSize: 14, color: T.acc }} />
                    </div>
                    <span style={{ fontSize: 15, fontWeight: 600, color: T.ink }}>
                        {isEdit ? "Cập nhật lộ trình thăng tiến" : "Tạo lộ trình thăng tiến"}
                    </span>
                </div>
            }
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
                width: 760,
                maskClosable: false,
                confirmLoading: isPending,
            }}
            submitter={{
                searchConfig: {
                    submitText: isEdit ? "Cập nhật" : "Tạo lộ trình",
                    resetText: "Hủy",
                },
            }}
        >
            <Row gutter={[16, 0]}>
                {/* ── Tên lộ trình ── */}
                <Col span={16}>
                    <ProFormText
                        name="name"
                        label="Tên lộ trình"
                        placeholder="VD: Lộ trình Chuyên viên Tuyển dụng..."
                        rules={[{ required: true, message: "Vui lòng nhập tên lộ trình" }]}
                        fieldProps={{ size: "middle" }}
                    />
                </Col>

                {/* ── Mô tả ── */}
                <Col span={24}>
                    <ProFormTextArea
                        name="description"
                        label="Mô tả"
                        placeholder="Mô tả mục tiêu, đối tượng áp dụng của lộ trình này..."
                        fieldProps={{ rows: 2 }}
                    />
                </Col>

                {/* ── Các bước ── */}
                <Col span={24}>
                    <div style={{
                        display: "flex", alignItems: "center",
                        justifyContent: "space-between", marginBottom: 12,
                    }}>
                        <div>
                            <Text style={{ fontSize: 13.5, fontWeight: 600, color: T.ink2 }}>
                                Các bước trong lộ trình
                            </Text>
                            <Text style={{ fontSize: 12, color: T.ink4, marginLeft: 8 }}>
                                Sắp xếp từ cấp thấp → cấp cao
                            </Text>
                        </div>
                        <Button
                            size="small" icon={<PlusOutlined />} onClick={addStep}
                            style={{
                                borderRadius: 7, borderColor: T.accBord,
                                color: T.acc, background: T.accSoft,
                                fontSize: 12, height: 30, paddingInline: 12,
                            }}
                        >
                            Thêm bước
                        </Button>
                    </div>

                    {steps.length === 0 && (
                        <Alert type="warning" showIcon style={{ borderRadius: 8, marginBottom: 10 }}
                            message="Lộ trình cần ít nhất 1 bước" />
                    )}

                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                        {steps.map((step, index) => {
                            const isTarget = index === steps.length - 1;
                            const filled = Boolean(step.careerPathId);

                            return (
                                <div key={index}>
                                    <div style={{
                                        display: "flex", alignItems: "stretch",
                                        borderRadius: 10, overflow: "hidden",
                                        border: `1px solid ${filled
                                            ? isTarget ? T.amberBord : T.accBord
                                            : T.line}`,
                                        transition: "border-color 0.15s",
                                        background: T.white,
                                    }}>
                                        {/* Thanh màu bên trái */}
                                        <div style={{
                                            width: 4, flexShrink: 0,
                                            background: filled
                                                ? isTarget ? "#f59e0b" : T.acc
                                                : T.ink5,
                                            opacity: filled ? 0.7 : 0.2,
                                        }} />

                                        <div style={{ flex: 1, padding: "12px 14px" }}>
                                            {/* Header bước */}
                                            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                                                <span style={{
                                                    width: 24, height: 24, borderRadius: "50%",
                                                    background: filled
                                                        ? isTarget ? T.amberSoft : T.accSoft
                                                        : T.s2,
                                                    border: `1.5px solid ${filled
                                                        ? isTarget ? T.amberBord : T.accBord
                                                        : T.line}`,
                                                    display: "flex", alignItems: "center", justifyContent: "center",
                                                    fontSize: 10, fontWeight: 700,
                                                    color: filled
                                                        ? isTarget ? T.amber : T.acc
                                                        : T.ink4,
                                                    flexShrink: 0,
                                                }}>
                                                    {index + 1}
                                                </span>

                                                <Text style={{ fontSize: 12.5, fontWeight: 600, color: T.ink3, flex: 1 }}>
                                                    Bước {index + 1}
                                                    {isTarget && (
                                                        <span style={{
                                                            marginLeft: 8, fontSize: 11,
                                                            color: T.amber, fontWeight: 500,
                                                        }}>
                                                            — Vị trí mục tiêu
                                                        </span>
                                                    )}
                                                </Text>

                                                {steps.length > 1 && (
                                                    <Button
                                                        type="text" size="small" danger
                                                        icon={<DeleteOutlined style={{ fontSize: 12 }} />}
                                                        onClick={() => removeStep(index)}
                                                        style={{ borderRadius: 6, height: 26, width: 26, display: "flex", alignItems: "center", justifyContent: "center" }}
                                                    />
                                                )}
                                            </div>

                                            <Row gutter={[12, 0]}>
                                                {/* Chức danh */}
                                                <Col span={isTarget ? 24 : 15}>
                                                    <Text style={{ fontSize: 11.5, color: T.ink4, fontWeight: 500, display: "block", marginBottom: 5 }}>
                                                        Chức danh / Cấp bậc <span style={{ color: T.red }}>*</span>
                                                    </Text>
                                                    <Select
                                                        style={{ width: "100%" }}
                                                        placeholder="Chọn chức danh..."
                                                        showSearch
                                                        loading={loadingPaths}
                                                        value={step.careerPathId}
                                                        options={getOptions(step.careerPathId)}
                                                        filterOption={(input, opt) =>
                                                            (opt?.label ?? "").toLowerCase().includes(input.toLowerCase())
                                                        }
                                                        onChange={(val) => updateStep(index, "careerPathId", val)}
                                                    />
                                                </Col>

                                                {/* Thời gian — ẩn ở bước cuối */}
                                                {!isTarget && (
                                                    <Col span={9}>
                                                        <Text style={{ fontSize: 11.5, color: T.ink4, fontWeight: 500, display: "block", marginBottom: 5 }}>
                                                            Thời gian tối thiểu (tháng)
                                                        </Text>
                                                        <InputNumber
                                                            style={{ width: "100%" }}
                                                            min={1} max={120}
                                                            placeholder="VD: 12"
                                                            value={step.durationMonths}
                                                            onChange={(val) => updateStep(index, "durationMonths", val ?? undefined)}
                                                        />
                                                    </Col>
                                                )}
                                            </Row>
                                        </div>
                                    </div>

                                    {/* Connector */}
                                    {index < steps.length - 1 && (
                                        <div style={{
                                            display: "flex", alignItems: "center",
                                            justifyContent: "center", height: 20, gap: 6,
                                        }}>
                                            <div style={{ width: 1, height: "100%", background: T.line }} />
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