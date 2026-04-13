import { useEffect, useState } from "react";
import { Form, Row, Col, Button, Typography, InputNumber, Select, Alert } from "antd";
import { ModalForm, ProFormText, ProFormTextArea } from "@ant-design/pro-components";
import { PlusOutlined, DeleteOutlined } from "@ant-design/icons";
import { useParams } from "react-router-dom";

import {
    useCreateCareerPathTemplateMutation,
    useUpdateCareerPathTemplateMutation,
} from "@/hooks/useCareerPathTemplates";
import { callGetCareerPathByDepartment } from "@/config/api";
import type { ICareerPath, ICareerPathTemplate } from "@/types/backend";

const { Text } = Typography;

const T = {
    ink: "#0d0d10",
    ink2: "#232329",
    ink3: "#4a4a54",
    ink4: "#8a8a96",
    ink5: "#b8b8c2",
    ink6: "#dcdce6",
    white: "#ffffff",
    s1: "#f7f7fa",
    s2: "#efeff4",
    line: "rgba(0,0,0,0.06)",
    lineMed: "rgba(0,0,0,0.10)",
    acc: "#2563eb",
    accSoft: "rgba(37,99,235,0.06)",
    accBord: "rgba(37,99,235,0.16)",
    violet: "#6d28d9",
    violetSoft: "rgba(109,40,217,0.06)",
    violetBord: "rgba(109,40,217,0.16)",
    green: "#16a34a",
    greenSoft: "rgba(22,163,74,0.06)",
    greenBord: "rgba(22,163,74,0.16)",
    amber: "#b45309",
    amberSoft: "rgba(180,83,9,0.06)",
    amberBord: "rgba(180,83,9,0.18)",
    slate: "#475569",
    slateSoft: "rgba(71,85,105,0.06)",
    slateBord: "rgba(71,85,105,0.16)",
    red: "#dc2626",
    redSoft: "rgba(220,38,38,0.06)",
    redBord: "rgba(220,38,38,0.16)",
};

const getLevelStyle = (code?: string): React.CSSProperties => {
    if (!code) return {};
    const map: Record<string, { bg: string; bd: string; txt: string }> = {
        S: { bg: T.accSoft, bd: T.accBord, txt: T.acc },
        M: { bg: T.violetSoft, bd: T.violetBord, txt: T.violet },
        T: { bg: T.greenSoft, bd: T.greenBord, txt: T.green },
        D: { bg: T.amberSoft, bd: T.amberBord, txt: T.amber },
    };
    const c = map[code[0]?.toUpperCase()] ?? { bg: T.slateSoft, bd: T.slateBord, txt: T.slate };
    return {
        display: "inline-flex",
        alignItems: "center",
        padding: "1px 5px",
        borderRadius: 4,
        background: c.bg,
        border: `1px solid ${c.bd}`,
        fontSize: 10,
        fontWeight: 700,
        color: c.txt,
        letterSpacing: 0.2,
        whiteSpace: "nowrap",
        flexShrink: 0,
        lineHeight: "16px",
    };
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
                    .map((s) => ({ careerPathId: s.careerPathId, durationMonths: s.durationMonths }))
            );
        } else {
            form.resetFields();
            setSteps([{ careerPathId: undefined }]);
        }
    }, [open, dataInit]);

    const addStep = () => setSteps((prev) => [...prev, { careerPathId: undefined }]);
    const removeStep = (i: number) => setSteps((prev) => prev.filter((_, idx) => idx !== i));
    const updateStep = (i: number, field: keyof StepForm, value: any) =>
        setSteps((prev) => prev.map((s, idx) => (idx === i ? { ...s, [field]: value } : s)));

    const validateSteps = (): string | null => {
        if (steps.length === 0) return "Cần ít nhất 1 vị trí trong lộ trình";
        for (let i = 0; i < steps.length; i++) {
            if (!steps[i].careerPathId) return `Vị trí ${i + 1}: chưa chọn chức danh`;
        }
        const ids = steps.map((s) => s.careerPathId);
        if (new Set(ids).size !== ids.length) return "Các vị trí không được trùng chức danh";
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
    const getOptions = (currentId?: number) =>
        careerPaths
            .filter((cp) => !usedIds.has(cp.id) || cp.id === currentId)
            .map((cp) => ({
                label: cp.jobTitleName,
                value: cp.id,
                levelCode: cp.positionLevelCode,
            }));

    const getCpById = (id?: number) => careerPaths.find((cp) => cp.id === id);

    return (
        <ModalForm
            title={isEdit ? "Cập nhật lộ trình thăng tiến" : "Tạo lộ trình thăng tiến"}
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
                // Responsive: desktop 780px, mobile 95vw
                width: "min(780px, 95vw)",
                maskClosable: false,
                confirmLoading: isPending,
                styles: {
                    header: {
                        borderBottom: `1px solid ${T.line}`,
                        paddingBottom: 16,
                        marginBottom: 0,
                    },
                    body: {
                        paddingTop: 20,
                        // Scroll nội dung bên trong modal trên mobile
                        maxHeight: "80vh",
                        overflowY: "auto",
                    },
                },
            }}
            submitter={{
                searchConfig: {
                    submitText: isEdit ? "Cập nhật" : "Tạo lộ trình",
                    resetText: "Hủy",
                },
                submitButtonProps: {
                    style: {
                        background: T.acc,
                        borderColor: T.acc,
                        fontWeight: 500,
                        height: 36,
                        borderRadius: 8,
                        paddingInline: 20,
                    },
                },
                resetButtonProps: {
                    style: { height: 36, borderRadius: 8, borderColor: T.line, color: T.ink3 },
                },
            }}
        >
            <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>

                {/* ── Tên + mô tả: mobile xếp dọc, desktop nằm ngang ── */}
                <Row gutter={[16, 0]}>
                    <Col xs={24} sm={14}>
                        <ProFormText
                            name="name"
                            label="Tên lộ trình"
                            placeholder="VD: Lộ trình Chuyên viên Tuyển dụng..."
                            rules={[{ required: true, message: "Vui lòng nhập tên lộ trình" }]}
                            fieldProps={{ size: "middle" }}
                        />
                    </Col>
                    <Col xs={24} sm={10}>
                        <ProFormTextArea
                            name="description"
                            label="Mô tả"
                            placeholder="Mô tả ngắn về lộ trình..."
                            fieldProps={{ rows: 1, style: { resize: "none" } }}
                        />
                    </Col>
                </Row>

                {/* ── Danh sách vị trí ── */}
                <div>
                    {/* Header */}
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            marginBottom: 10,
                            flexWrap: "wrap",
                            gap: 8,
                        }}
                    >
                        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                            <Text style={{ fontSize: 13, fontWeight: 600, color: T.ink2 }}>
                                Các vị trí
                            </Text>
                            <Text style={{ fontSize: 11, color: T.ink4 }}>· từ thấp đến cao</Text>
                            {steps.length > 0 && (
                                <span
                                    style={{
                                        fontSize: 11,
                                        fontWeight: 600,
                                        color: T.acc,
                                        background: T.accSoft,
                                        border: `1px solid ${T.accBord}`,
                                        borderRadius: 20,
                                        padding: "1px 8px",
                                    }}
                                >
                                    {steps.length} vị trí
                                </span>
                            )}
                        </div>
                        <Button
                            size="small"
                            icon={<PlusOutlined style={{ fontSize: 11 }} />}
                            onClick={addStep}
                            style={{
                                borderRadius: 7,
                                borderColor: T.accBord,
                                color: T.acc,
                                background: T.accSoft,
                                fontSize: 12,
                                height: 30,
                                paddingInline: 12,
                                fontWeight: 500,
                                flexShrink: 0,
                            }}
                        >
                            Thêm vị trí
                        </Button>
                    </div>

                    {steps.length === 0 && (
                        <Alert
                            type="warning"
                            showIcon
                            message="Lộ trình cần ít nhất 1 vị trí"
                            style={{ borderRadius: 8, marginBottom: 10 }}
                        />
                    )}

                    {/* ── Step rows ── */}
                    <div
                        style={{
                            border: `1px solid ${T.line}`,
                            borderRadius: 10,
                            overflow: "hidden",
                        }}
                    >
                        {steps.map((step, index) => {
                            const isLast = index === steps.length - 1;
                            const isSingle = steps.length === 1;
                            const showDuration = !isLast || isSingle;

                            return (
                                <div
                                    key={index}
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 8,
                                        // Mobile: padding nhỏ hơn chút
                                        padding: "10px 10px",
                                        background: T.white,
                                        borderBottom: isLast ? "none" : `1px solid ${T.line}`,
                                        minWidth: 0,
                                        overflow: "hidden",
                                    }}
                                >
                                    {/* Step number */}
                                    <div
                                        style={{
                                            width: 24,
                                            height: 24,
                                            borderRadius: "50%",
                                            flexShrink: 0,
                                            background: T.s2,
                                            border: `1px solid ${T.ink6}`,
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            fontSize: 11,
                                            fontWeight: 700,
                                            color: T.ink4,
                                        }}
                                    >
                                        {index + 1}
                                    </div>

                                    {/* Select — chiếm phần còn lại */}
                                    <div style={{ flex: 1, minWidth: 0, overflow: "hidden" }}>
                                        <Select
                                            style={{ width: "100%" }}
                                            placeholder="Chọn chức danh..."
                                            showSearch
                                            loading={loadingPaths}
                                            value={step.careerPathId ?? undefined}
                                            filterOption={(input, opt) =>
                                                (opt?.label as string ?? "")
                                                    .toLowerCase()
                                                    .includes(input.toLowerCase())
                                            }
                                            optionRender={(opt) => (
                                                <div
                                                    style={{
                                                        display: "flex",
                                                        alignItems: "center",
                                                        gap: 7,
                                                        padding: "2px 0",
                                                    }}
                                                >
                                                    {opt.data.levelCode && (
                                                        <span style={getLevelStyle(opt.data.levelCode)}>
                                                            {opt.data.levelCode}
                                                        </span>
                                                    )}
                                                    <span style={{ fontSize: 13, color: T.ink2 }}>
                                                        {opt.data.label}
                                                    </span>
                                                </div>
                                            )}
                                            labelRender={({ value }) => {
                                                const found = careerPaths.find((c) => c.id === value);
                                                if (!found)
                                                    return (
                                                        <span style={{ color: T.ink4 }}>
                                                            Chọn chức danh...
                                                        </span>
                                                    );
                                                return (
                                                    <div
                                                        style={{
                                                            display: "flex",
                                                            alignItems: "center",
                                                            gap: 6,
                                                            width: "100%",
                                                            overflow: "hidden",
                                                        }}
                                                    >
                                                        {found.positionLevelCode && (
                                                            <span style={getLevelStyle(found.positionLevelCode)}>
                                                                {found.positionLevelCode}
                                                            </span>
                                                        )}
                                                        <span
                                                            style={{
                                                                fontSize: 13,
                                                                color: T.ink2,
                                                                fontWeight: 500,
                                                                overflow: "hidden",
                                                                textOverflow: "ellipsis",
                                                                whiteSpace: "nowrap",
                                                                minWidth: 0,
                                                            }}
                                                        >
                                                            {found.jobTitleName}
                                                        </span>
                                                    </div>
                                                );
                                            }}
                                            options={getOptions(step.careerPathId)}
                                            onChange={(val) => updateStep(index, "careerPathId", val)}
                                        />
                                    </div>

                                    {/* Duration — mobile: thu nhỏ còn 90px */}
                                    {showDuration && (
                                        <div style={{ flexShrink: 0, width: "clamp(80px, 15vw, 110px)" }}>
                                            <InputNumber
                                                style={{ width: "100%" }}
                                                min={1}
                                                max={120}
                                                placeholder="Tháng"
                                                value={step.durationMonths}
                                                addonAfter={
                                                    <span style={{ fontSize: 11, color: T.ink4 }}>
                                                        th
                                                    </span>
                                                }
                                                onChange={(val) =>
                                                    updateStep(index, "durationMonths", val ?? undefined)
                                                }
                                            />
                                        </div>
                                    )}

                                    {/* Delete */}
                                    {steps.length > 1 && (
                                        <button
                                            onClick={() => removeStep(index)}
                                            style={{
                                                width: 28,
                                                height: 28,
                                                borderRadius: 7,
                                                flexShrink: 0,
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                border: `1px solid ${T.redBord}`,
                                                background: T.redSoft,
                                                color: T.red,
                                                cursor: "pointer",
                                                fontSize: 12,
                                            }}
                                        >
                                            <DeleteOutlined style={{ fontSize: 12 }} />
                                        </button>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    {/* ── Preview ── */}
                    {steps.some((s) => s.careerPathId) && (
                        <div
                            style={{
                                marginTop: 12,
                                padding: "10px 14px",
                                background: T.s1,
                                border: `1px solid ${T.line}`,
                                borderRadius: 10,
                            }}
                        >
                            <Text
                                style={{
                                    fontSize: 10,
                                    color: T.ink4,
                                    fontWeight: 700,
                                    letterSpacing: 0.8,
                                    textTransform: "uppercase",
                                    display: "block",
                                    marginBottom: 8,
                                }}
                            >
                                Xem trước lộ trình
                            </Text>
                            {/* flexWrap để preview tự xuống dòng trên mobile */}
                            <div
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    flexWrap: "wrap",
                                    gap: 5,
                                }}
                            >
                                {steps.map((step, i) => {
                                    const cp = getCpById(step.careerPathId);
                                    if (!cp) return null;
                                    const isLastStep = i === steps.length - 1;
                                    return (
                                        <div
                                            key={i}
                                            style={{ display: "flex", alignItems: "center", gap: 5 }}
                                        >
                                            <div
                                                style={{
                                                    display: "inline-flex",
                                                    alignItems: "center",
                                                    gap: 5,
                                                    padding: "4px 10px 4px 7px",
                                                    borderRadius: 8,
                                                    background: T.white,
                                                    border: `1px solid ${T.line}`,
                                                    // Ngăn badge bị co trên mobile
                                                    flexShrink: 0,
                                                }}
                                            >
                                                {cp.positionLevelCode && (
                                                    <span style={getLevelStyle(cp.positionLevelCode)}>
                                                        {cp.positionLevelCode}
                                                    </span>
                                                )}
                                                <span
                                                    style={{
                                                        fontSize: 12,
                                                        fontWeight: 500,
                                                        color: T.ink2,
                                                        // Truncate tên dài trên mobile
                                                        maxWidth: "clamp(80px, 25vw, 160px)",
                                                        overflow: "hidden",
                                                        textOverflow: "ellipsis",
                                                        whiteSpace: "nowrap",
                                                    }}
                                                >
                                                    {cp.jobTitleName}
                                                </span>
                                                {step.durationMonths && !isLastStep && (
                                                    <span
                                                        style={{
                                                            padding: "1px 6px",
                                                            borderRadius: 5,
                                                            background: T.amberSoft,
                                                            border: `1px solid ${T.amberBord}`,
                                                            fontSize: 10,
                                                            fontWeight: 600,
                                                            color: T.amber,
                                                            flexShrink: 0,
                                                        }}
                                                    >
                                                        {step.durationMonths}th
                                                    </span>
                                                )}
                                            </div>
                                            {!isLastStep && (
                                                <Text
                                                    style={{
                                                        fontSize: 10,
                                                        color: T.ink6,
                                                        lineHeight: 1,
                                                        flexShrink: 0,
                                                    }}
                                                >
                                                    →
                                                </Text>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </ModalForm>
    );
};

export default ModalCareerPathTemplate;