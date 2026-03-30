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

const PINK = "#e91e8c";
const PINK_BG = "#fbeaf0";
const PINK_BD = "#f4c0d1";
const PINK_TXT = "#993556";

const T = {
    ink: "#0a0a0b", ink2: "#2c2c2e", ink3: "#636366", ink4: "#aeaeb2", ink5: "#d1d1d6",
    white: "#ffffff", s1: "#fafafa", s2: "#f5f5f7",
    line: "rgba(0,0,0,0.06)", lineMed: "rgba(0,0,0,0.10)",
    red: "#ff3b30",
    amber: "#b45309", amberSoft: "rgba(245,158,11,0.08)", amberBord: "rgba(245,158,11,0.28)",
};

// ── Label HR chuẩn theo vị trí trong lộ trình ────────────────────
const getPositionLabel = (isFirst: boolean, isLast: boolean, isSingle: boolean) => {
    if (isSingle) return { label: "Vị trí duy nhất", color: T.amber, bg: T.amberSoft, bd: T.amberBord };
    if (isFirst) return { label: "Vị trí khởi điểm", color: "#185FA5", bg: "#EAF0FB", bd: "#B5CDEF" };
    if (isLast) return { label: "Vị trí mục tiêu", color: T.amber, bg: T.amberSoft, bd: T.amberBord };
    return null;
};

// ── Level badge màu theo prefix ──────────────────────────────────
const getLevelBadgeStyle = (code?: string): React.CSSProperties => {
    if (!code) return {};
    const prefix = code[0]?.toUpperCase();
    const map: Record<string, { bg: string; bd: string; txt: string }> = {
        S: { bg: "#EAF0FB", bd: "#B5CDEF", txt: "#1A4A8A" },
        M: { bg: "#EEEDFE", bd: "#AFA9EC", txt: "#3C3489" },
        T: { bg: "#E1F5EE", bd: "#5DCAA5", txt: "#085041" },
        D: { bg: "#FAEEDA", bd: "#FAC775", txt: "#633806" },
    };
    const c = map[prefix] ?? { bg: "#F1EFE8", bd: "#B4B2A9", txt: "#444441" };
    return {
        display: "inline-flex", alignItems: "center",
        padding: "2px 6px", borderRadius: 5,
        background: c.bg, border: `0.5px solid ${c.bd}`,
        fontSize: 10, fontWeight: 600, color: c.txt,
        lineHeight: 1.4, letterSpacing: 0.2, flexShrink: 0,
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

    // ── Load career paths khi mở modal ───────────────────────────
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

    // ── Điền dữ liệu khi edit ────────────────────────────────────
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

    // ── CRUD steps ───────────────────────────────────────────────
    const addStep = () => setSteps((prev) => [...prev, { careerPathId: undefined }]);
    const removeStep = (i: number) => setSteps((prev) => prev.filter((_, idx) => idx !== i));
    const updateStep = (i: number, field: keyof StepForm, value: any) =>
        setSteps((prev) => prev.map((s, idx) => idx === i ? { ...s, [field]: value } : s));

    // ── Validate ─────────────────────────────────────────────────
    const validateSteps = (): string | null => {
        if (steps.length === 0) return "Cần ít nhất 1 vị trí trong lộ trình";
        for (let i = 0; i < steps.length; i++) {
            if (!steps[i].careerPathId) return `Vị trí ${i + 1}: chưa chọn chức danh`;
        }
        const ids = steps.map((s) => s.careerPathId);
        if (new Set(ids).size !== ids.length) return "Các vị trí không được trùng chức danh";
        return null;
    };

    // ── Submit ───────────────────────────────────────────────────
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

    // ── Options cho Select ───────────────────────────────────────
    // label phải là string để filterOption hoạt động đúng
    // levelCode là extra field riêng chỉ dùng trong optionRender
    const usedIds = new Set(steps.map((s) => s.careerPathId).filter(Boolean));
    const getOptions = (currentId?: number) =>
        careerPaths
            .filter((cp) => !usedIds.has(cp.id) || cp.id === currentId)
            .map((cp) => ({
                label: cp.jobTitleName,          // string — filterOption dùng field này
                value: cp.id,                    // number
                levelCode: cp.positionLevelCode, // extra — optionRender dùng
            }));

    const getCpById = (id?: number) => careerPaths.find((cp) => cp.id === id);

    return (
        <ModalForm
            title={
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{
                        width: 30, height: 30, borderRadius: 9,
                        background: PINK_BG, border: `1px solid ${PINK_BD}`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        flexShrink: 0,
                    }}>
                        <TrophyOutlined style={{ fontSize: 15, color: PINK_TXT }} />
                    </div>
                    <div>
                        <div style={{ fontSize: 15, fontWeight: 600, color: T.ink, lineHeight: 1.3 }}>
                            {isEdit ? "Cập nhật lộ trình thăng tiến" : "Tạo lộ trình thăng tiến"}
                        </div>
                        <div style={{ fontSize: 11.5, color: T.ink4, fontWeight: 400, lineHeight: 1.4 }}>
                            Xác định các vị trí và thời gian thăng tiến tối thiểu
                        </div>
                    </div>
                </div>
            }
            open={open}
            form={form}
            onFinish={handleFinish}
            modalProps={{
                onCancel: onClose,
                afterClose: () => { form.resetFields(); setSteps([{ careerPathId: undefined }]); },
                destroyOnClose: true,
                width: 720,
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
            <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>

                {/* ── Thông tin cơ bản ── */}
                <div style={{
                    background: T.s1, border: `0.5px solid ${T.line}`,
                    borderRadius: 12, padding: "16px 18px",
                }}>
                    <Text style={{
                        fontSize: 10.5, fontWeight: 600, color: T.ink4,
                        letterSpacing: 0.6, textTransform: "uppercase",
                        display: "block", marginBottom: 14,
                    }}>
                        Thông tin lộ trình
                    </Text>
                    <Row gutter={[16, 0]}>
                        <Col span={16}>
                            <ProFormText
                                name="name"
                                label="Tên lộ trình"
                                placeholder="VD: Lộ trình Chuyên viên Tuyển dụng..."
                                rules={[{ required: true, message: "Vui lòng nhập tên lộ trình" }]}
                                fieldProps={{ size: "middle" }}
                            />
                        </Col>
                        <Col span={24}>
                            <ProFormTextArea
                                name="description"
                                label="Mô tả"
                                placeholder="Mô tả mục tiêu, đối tượng áp dụng của lộ trình này..."
                                fieldProps={{ rows: 2 }}
                            />
                        </Col>
                    </Row>
                </div>

                {/* ── Danh sách vị trí ── */}
                <div>
                    {/* Section header */}
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <Text style={{ fontSize: 13.5, fontWeight: 600, color: T.ink2 }}>
                                Các vị trí trong lộ trình
                            </Text>
                            <Text style={{ fontSize: 11.5, color: T.ink4 }}>
                                — từ thấp đến cao
                            </Text>
                            {steps.length > 0 && (
                                <span style={{
                                    fontSize: 11, fontWeight: 500,
                                    color: PINK_TXT, background: PINK_BG,
                                    border: `0.5px solid ${PINK_BD}`,
                                    borderRadius: 20, padding: "1px 8px",
                                }}>
                                    {steps.length} vị trí
                                </span>
                            )}
                        </div>
                        <Button
                            size="small"
                            icon={<PlusOutlined style={{ fontSize: 11 }} />}
                            onClick={addStep}
                            style={{
                                borderRadius: 7, borderColor: PINK_BD,
                                color: PINK_TXT, background: PINK_BG,
                                fontSize: 12, height: 30, paddingInline: 12, fontWeight: 500,
                            }}
                        >
                            Thêm vị trí
                        </Button>
                    </div>

                    {steps.length === 0 && (
                        <Alert
                            type="warning" showIcon
                            message="Lộ trình cần ít nhất 1 vị trí"
                            style={{ borderRadius: 8, marginBottom: 12 }}
                        />
                    )}

                    {/* Timeline list */}
                    <div style={{ display: "flex", flexDirection: "column" }}>
                        {steps.map((step, index) => {
                            const isFirst = index === 0;
                            const isLast = index === steps.length - 1;
                            const isSingle = steps.length === 1;
                            const filled = Boolean(step.careerPathId);
                            const cp = getCpById(step.careerPathId);
                            const pos = getPositionLabel(isFirst, isLast, isSingle);

                            const accentBar = (isLast || isSingle) ? T.amber : "#3B8BD4";
                            const accentBorder = filled
                                ? (isLast || isSingle) ? T.amberBord : "#B5CDEF"
                                : T.line;

                            return (
                                <div key={index} style={{ display: "flex", alignItems: "stretch" }}>

                                    {/* ── Timeline track ── */}
                                    <div style={{
                                        width: 36, display: "flex", flexDirection: "column",
                                        alignItems: "center", flexShrink: 0, paddingTop: 16,
                                    }}>
                                        <div style={{
                                            width: 22, height: 22, borderRadius: "50%",
                                            background: filled
                                                ? (isLast || isSingle) ? T.amberSoft : "#EAF0FB"
                                                : T.s2,
                                            border: `1.5px solid ${filled
                                                ? (isLast || isSingle) ? T.amberBord : "#B5CDEF"
                                                : T.line}`,
                                            display: "flex", alignItems: "center", justifyContent: "center",
                                            fontSize: 10, fontWeight: 700,
                                            color: filled
                                                ? (isLast || isSingle) ? T.amber : "#185FA5"
                                                : T.ink5,
                                            flexShrink: 0, zIndex: 1,
                                        }}>
                                            {index + 1}
                                        </div>
                                        {!isLast && (
                                            <div style={{
                                                flex: 1, width: 1.5, minHeight: 16,
                                                background: filled ? accentBar : T.ink5,
                                                opacity: filled ? 0.22 : 0.1,
                                                marginTop: 3,
                                            }} />
                                        )}
                                    </div>

                                    {/* ── Card ── */}
                                    <div style={{ flex: 1, paddingBottom: isLast ? 0 : 10 }}>
                                        <div style={{
                                            background: T.white,
                                            border: `0.5px solid ${accentBorder}`,
                                            borderRadius: 10, overflow: "hidden",
                                            transition: "border-color 0.15s",
                                        }}>
                                            {/* Top accent bar */}
                                            <div style={{
                                                height: 3,
                                                background: filled ? accentBar : T.ink5,
                                                opacity: filled ? 0.6 : 0.1,
                                            }} />

                                            <div style={{ padding: "11px 14px" }}>
                                                {/* Card header row */}
                                                <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 10 }}>
                                                    {pos && (
                                                        <span style={{
                                                            fontSize: 10, fontWeight: 600,
                                                            color: pos.color, background: pos.bg,
                                                            border: `0.5px solid ${pos.bd}`,
                                                            borderRadius: 5, padding: "2px 7px",
                                                            letterSpacing: 0.2, flexShrink: 0,
                                                        }}>
                                                            {pos.label}
                                                        </span>
                                                    )}

                                                    {filled && cp && (
                                                        <div style={{ display: "flex", alignItems: "center", gap: 5, flex: 1, minWidth: 0 }}>
                                                            {cp.positionLevelCode && (
                                                                <span style={getLevelBadgeStyle(cp.positionLevelCode)}>
                                                                    {cp.positionLevelCode}
                                                                </span>
                                                            )}
                                                            <Text ellipsis style={{ fontSize: 12.5, fontWeight: 500, color: T.ink2 }}>
                                                                {cp.jobTitleName}
                                                            </Text>
                                                            {step.durationMonths && !isLast && (
                                                                <span style={{
                                                                    fontSize: 10, fontWeight: 500,
                                                                    color: "#7A5C00", background: "#FEF3C7",
                                                                    border: "0.5px solid #FCD34D",
                                                                    borderRadius: 5, padding: "1px 5px", flexShrink: 0,
                                                                }}>
                                                                    {step.durationMonths}th
                                                                </span>
                                                            )}
                                                        </div>
                                                    )}

                                                    {steps.length > 1 && (
                                                        <Button
                                                            type="text" size="small" danger
                                                            icon={<DeleteOutlined style={{ fontSize: 11 }} />}
                                                            onClick={() => removeStep(index)}
                                                            style={{
                                                                marginLeft: "auto", borderRadius: 6,
                                                                height: 24, width: 24,
                                                                display: "flex", alignItems: "center", justifyContent: "center",
                                                                flexShrink: 0,
                                                            }}
                                                        />
                                                    )}
                                                </div>

                                                {/* Fields */}
                                                <Row gutter={[10, 0]}>
                                                    <Col span={isLast && !isSingle ? 24 : 15}>
                                                        <Text style={{ fontSize: 11, color: T.ink4, fontWeight: 500, display: "block", marginBottom: 5 }}>
                                                            Chức danh / Cấp bậc <span style={{ color: T.red }}>*</span>
                                                        </Text>
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
                                                                <div style={{ display: "flex", alignItems: "center", gap: 7, padding: "2px 0" }}>
                                                                    {opt.data.levelCode && (
                                                                        <span style={getLevelBadgeStyle(opt.data.levelCode)}>
                                                                            {opt.data.levelCode}
                                                                        </span>
                                                                    )}
                                                                    <span style={{ fontSize: 13, color: T.ink2 }}>
                                                                        {opt.data.label}
                                                                    </span>
                                                                </div>
                                                            )}
                                                            options={getOptions(step.careerPathId)}
                                                            onChange={(val) => updateStep(index, "careerPathId", val)}
                                                        />
                                                    </Col>

                                                    {/* Thời gian — ẩn ở vị trí cuối (trừ khi chỉ có 1) */}
                                                    {(!isLast || isSingle) && (
                                                        <Col span={9}>
                                                            <Text style={{ fontSize: 11, color: T.ink4, fontWeight: 500, display: "block", marginBottom: 5 }}>
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
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* ── Preview lộ trình ── */}
                    {steps.some((s) => s.careerPathId) && (
                        <div style={{
                            marginTop: 16, padding: "10px 14px",
                            background: T.s1, border: `0.5px solid ${T.line}`,
                            borderRadius: 10,
                        }}>
                            <Text style={{
                                fontSize: 10.5, color: T.ink4, fontWeight: 600,
                                letterSpacing: 0.5, textTransform: "uppercase",
                                display: "block", marginBottom: 8,
                            }}>
                                Xem trước lộ trình
                            </Text>
                            <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 4 }}>
                                {steps.map((step, i) => {
                                    const cp = getCpById(step.careerPathId);
                                    if (!cp) return null;
                                    const isLastStep = i === steps.length - 1;
                                    return (
                                        <div key={i} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                                            <div style={{
                                                display: "flex", alignItems: "center", gap: 4,
                                                padding: "3px 9px 3px 5px", borderRadius: 8,
                                                background: T.white, border: `0.5px solid ${T.lineMed}`,
                                            }}>
                                                {cp.positionLevelCode && (
                                                    <span style={getLevelBadgeStyle(cp.positionLevelCode)}>
                                                        {cp.positionLevelCode}
                                                    </span>
                                                )}
                                                <span style={{ fontSize: 12, fontWeight: 500, color: T.ink2 }}>
                                                    {cp.jobTitleName}
                                                </span>
                                                {step.durationMonths && !isLastStep && (
                                                    <span style={{
                                                        fontSize: 10, fontWeight: 500,
                                                        color: "#7A5C00", background: "#FEF3C7",
                                                        border: "0.5px solid #FCD34D",
                                                        borderRadius: 5, padding: "1px 5px", marginLeft: 2,
                                                    }}>
                                                        {step.durationMonths}th
                                                    </span>
                                                )}
                                            </div>
                                            {!isLastStep && (
                                                <span style={{ fontSize: 10, color: T.ink5, lineHeight: 1 }}>→</span>
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