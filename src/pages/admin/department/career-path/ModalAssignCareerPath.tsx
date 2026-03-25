import { useEffect, useState } from "react";
import { Form, Row, Col, Alert, Spin, Typography } from "antd";
import {
    ModalForm,
    ProFormSelect,
    ProFormTextArea,
    ProFormDatePicker,
} from "@ant-design/pro-components";
import dayjs from "dayjs";

import {
    useAssignCareerPathMutation,
    useUpdateEmployeeCareerPathMutation,
} from "@/hooks/useEmployeeCareerPaths";
import { callFetchUser, callFetchUserPositions, callGetCareerPathTemplatesByDepartment } from "@/config/api";
import type { ICareerPath, ICareerPathTemplate, IEmployeeCareerPath } from "@/types/backend";

const { Text } = Typography;

const T = {
    ink: "#0a0a0b", ink3: "#636366", ink4: "#aeaeb2",
    s1: "#fafafa", s2: "#f5f5f7",
    line: "rgba(0,0,0,0.06)",
    acc: "#0066ff", accSoft: "rgba(0,102,255,0.07)", accBord: "rgba(0,102,255,0.18)",
    green: "#34c759", greenSoft: "rgba(52,199,89,0.08)", greenBord: "rgba(52,199,89,0.22)",
    orange: "#ff9500",
    red: "#ff3b30",
};

// ── Helper format date an toàn ────────────────────────────────────
const safeFormatDate = (val: any): string | undefined => {
    if (!val) return undefined;
    const d = dayjs(val);
    return d.isValid() ? d.format("YYYY-MM-DD") : undefined;
};

interface IProps {
    open: boolean;
    onClose: () => void;
    dataInit?: IEmployeeCareerPath | null;
    departmentId: number;
    onSuccess: () => void;
}

const ModalAssignCareerPath = ({ open, onClose, dataInit, departmentId, onSuccess }: IProps) => {
    const [form] = Form.useForm();
    const isEdit = Boolean(dataInit?.id);

    const [templates, setTemplates] = useState<ICareerPathTemplate[]>([]);
    const [loadingTemplates, setLoadingTemplates] = useState(false);

    const [loadingPosition, setLoadingPosition] = useState(false);
    const [detectedCareerPathId, setDetectedCareerPathId] = useState<number | undefined>(undefined);
    const [detectedJobTitle, setDetectedJobTitle] = useState<string>("");
    const [detectedLevelCode, setDetectedLevelCode] = useState<string>("");

    const [selectedTemplateId, setSelectedTemplateId] = useState<number | undefined>(undefined);
    const [stepMatchWarning, setStepMatchWarning] = useState(false);
    const [notFound, setNotFound] = useState(false);

    const { mutate: assign, isPending: isAssigning } = useAssignCareerPathMutation();
    const { mutate: update, isPending: isUpdating } = useUpdateEmployeeCareerPathMutation();

    // ── Load templates ────────────────────────────────────────────
    useEffect(() => {
        if (!open || !departmentId) return;

        const loadTemplates = async () => {
            setLoadingTemplates(true);
            try {
                const res = await callGetCareerPathTemplatesByDepartment(departmentId);
                setTemplates(res?.data ?? []);
            } catch {
                setTemplates([]);
            } finally {
                setLoadingTemplates(false);
            }
        };

        loadTemplates();

        if (isEdit && dataInit) {
            form.setFieldsValue({ note: dataInit.note });
            setDetectedJobTitle(dataInit.currentStep?.jobTitleName ?? "");
            setDetectedLevelCode(dataInit.currentStep?.positionLevelCode ?? "");
            setSelectedTemplateId(dataInit.template?.id);
        } else {
            form.resetFields();
            setDetectedCareerPathId(undefined);
            setDetectedJobTitle("");
            setDetectedLevelCode("");
            setSelectedTemplateId(undefined);
            setStepMatchWarning(false);
            setNotFound(false);
        }
    }, [open, dataInit]);

    // ── Detect vị trí hiện tại khi chọn nhân viên ────────────────
    const handleUserChange = async (userId: number) => {
        setDetectedCareerPathId(undefined);
        setDetectedJobTitle("");
        setDetectedLevelCode("");
        setStepMatchWarning(false);
        setNotFound(false);
        form.setFieldValue("currentCareerPathId", undefined);

        if (!userId) return;

        try {
            setLoadingPosition(true);
            const res = await callFetchUserPositions(userId);
            const positions = res?.data ?? [];

            const position =
                positions.find((p) => p.source === "DEPARTMENT" && p.active) ??
                positions.find((p) => p.active);

            if (!position?.jobTitle?.id) {
                setNotFound(true);
                return;
            }

            const allSteps = templates.flatMap((t) => t.steps ?? []);
            const matchedStep = allSteps.find(
                (s) => s.jobTitleName === position.jobTitle?.nameVi
            );

            setDetectedJobTitle(position.jobTitle.nameVi ?? "");
            setDetectedLevelCode(position.jobTitle.positionCode ?? "");

            if (matchedStep) {
                setDetectedCareerPathId(matchedStep.careerPathId);
                form.setFieldValue("currentCareerPathId", matchedStep.careerPathId);
                validateStepInTemplate(selectedTemplateId, matchedStep.careerPathId);
            } else {
                setNotFound(true);
            }
        } catch {
            setNotFound(true);
        } finally {
            setLoadingPosition(false);
        }
    };

    const validateStepInTemplate = (templateId?: number, careerPathId?: number) => {
        if (!templateId || !careerPathId) { setStepMatchWarning(false); return; }
        const template = templates.find((t) => t.id === templateId);
        const hasStep = template?.steps?.some((s) => s.careerPathId === careerPathId);
        setStepMatchWarning(!hasStep);
    };

    const handleTemplateChange = (templateId: number) => {
        setSelectedTemplateId(templateId);
        validateStepInTemplate(templateId, detectedCareerPathId);
    };

    const selectedTemplate = templates.find((t) => t.id === selectedTemplateId);

    // ── Submit ────────────────────────────────────────────────────
    const handleFinish = async (values: any) => {
        if (isEdit) {
            update(
                { id: dataInit!.id!, data: { note: values.note } as any },
                { onSuccess }
            );
        } else {
            assign(
                {
                    userId: values.userId,
                    templateId: values.templateId,
                    currentCareerPathId: values.currentCareerPathId,
                    // [FIX] dùng safeFormatDate — tránh "Invalid Date"
                    startDate: safeFormatDate(values.startDate),
                    note: values.note,
                },
                { onSuccess }
            );
        }
    };

    return (
        <ModalForm
            title={isEdit ? "Cập nhật lộ trình cá nhân" : "Gán lộ trình cho nhân viên"}
            open={open}
            form={form}
            onFinish={handleFinish}
            modalProps={{
                onCancel: onClose,
                afterClose: () => {
                    form.resetFields();
                    setDetectedCareerPathId(undefined);
                    setDetectedJobTitle("");
                    setDetectedLevelCode("");
                    setSelectedTemplateId(undefined);
                    setStepMatchWarning(false);
                    setNotFound(false);
                },
                destroyOnClose: true,
                width: 640,
                maskClosable: false,
                confirmLoading: isAssigning || isUpdating,
            }}
            submitter={{
                searchConfig: {
                    submitText: isEdit ? "Cập nhật" : "Gán lộ trình",
                    resetText: "Hủy",
                },
            }}
        >
            <Form.Item name="currentCareerPathId" hidden><input /></Form.Item>

            <Row gutter={[16, 12]}>

                {/* ── Edit mode info ── */}
                {isEdit && dataInit && (
                    <Col span={24}>
                        <div style={{
                            padding: "12px 14px", background: T.s1,
                            border: `1px solid ${T.line}`, borderRadius: 8,
                        }}>
                            <Text style={{ fontSize: 12, color: T.ink4, display: "block", marginBottom: 4 }}>Nhân viên</Text>
                            <Text style={{ fontSize: 13, fontWeight: 600, color: T.ink }}>
                                {dataInit.user?.name}
                                <span style={{ fontWeight: 400, color: T.ink4, marginLeft: 6 }}>{dataInit.user?.email}</span>
                            </Text>
                            <Text style={{ fontSize: 12, color: T.ink4, display: "block", marginTop: 8, marginBottom: 4 }}>Lộ trình / Bước hiện tại</Text>
                            <Text style={{ fontSize: 13, fontWeight: 600, color: T.acc }}>{dataInit.template?.name}</Text>
                            <Text style={{ fontSize: 12, color: T.ink3, marginLeft: 8 }}>
                                → {dataInit.currentStep?.jobTitleName} ({dataInit.currentStep?.positionLevelCode})
                            </Text>
                            <Text style={{ fontSize: 11, color: T.ink4, display: "block", marginTop: 4 }}>
                                Bước {dataInit.currentStepOrder}/{dataInit.totalSteps}
                            </Text>
                        </div>
                    </Col>
                )}

                {/* ── Chọn nhân viên ── */}
                {!isEdit && (
                    <Col span={24}>
                        <ProFormSelect
                            name="userId"
                            label="Nhân viên"
                            placeholder="Chọn nhân viên"
                            rules={[{ required: true, message: "Vui lòng chọn nhân viên" }]}
                            fieldProps={{
                                showSearch: true,
                                onChange: (val) => handleUserChange(val as number),
                                suffixIcon: loadingPosition ? <Spin size="small" /> : undefined,
                            }}
                            request={async (params) => {
                                const res = await callFetchUser(
                                    `page=1&size=100${params.keyWords ? `&filter=name~'${params.keyWords}'` : ""}`
                                );
                                return (res?.data?.result ?? []).map((u: any) => ({
                                    label: `${u.name} — ${u.email}`,
                                    value: u.id,
                                }));
                            }}
                        />
                    </Col>
                )}

                {/* ── Loading / Vị trí phát hiện ── */}
                {!isEdit && loadingPosition && (
                    <Col span={24}>
                        <div style={{
                            display: "flex", alignItems: "center", gap: 8,
                            padding: "10px 14px", background: T.s1,
                            border: `1px dashed ${T.line}`, borderRadius: 8,
                        }}>
                            <Spin size="small" />
                            <Text style={{ fontSize: 12.5, color: T.ink4 }}>Đang xác định vị trí hiện tại...</Text>
                        </div>
                    </Col>
                )}

                {!isEdit && !loadingPosition && detectedJobTitle && (
                    <Col span={24}>
                        <div style={{
                            display: "flex", alignItems: "center", gap: 10,
                            padding: "10px 14px", background: T.accSoft,
                            border: `1px solid ${T.accBord}`, borderRadius: 8,
                        }}>
                            <div style={{ width: 7, height: 7, borderRadius: "50%", background: T.acc, flexShrink: 0 }} />
                            <div style={{ flex: 1 }}>
                                <Text style={{ fontSize: 11, color: T.acc, fontWeight: 600, display: "block", marginBottom: 2 }}>
                                    VỊ TRÍ HIỆN TẠI (tự động phát hiện)
                                </Text>
                                <Text style={{ fontSize: 13, fontWeight: 600, color: T.ink }}>{detectedJobTitle}</Text>
                                {detectedLevelCode && (
                                    <span style={{
                                        marginLeft: 8, padding: "1px 7px", borderRadius: 4,
                                        background: T.acc, fontSize: 10, fontWeight: 700, color: "#fff",
                                    }}>
                                        {detectedLevelCode}
                                    </span>
                                )}
                            </div>
                        </div>
                    </Col>
                )}

                {!isEdit && notFound && !loadingPosition && (
                    <Col span={24}>
                        <Alert type="warning" showIcon style={{ borderRadius: 8 }}
                            message="Không tìm thấy vị trí hiện tại của nhân viên. Vui lòng kiểm tra UserPosition." />
                    </Col>
                )}

                {/* ── Chọn template ── */}
                {!isEdit && (
                    <Col span={24}>
                        <ProFormSelect
                            name="templateId"
                            label="Lộ trình"
                            placeholder={
                                loadingTemplates ? "Đang tải..." :
                                    templates.length === 0 ? "Phòng ban chưa có lộ trình" :
                                        "Chọn lộ trình cho nhân viên"
                            }
                            rules={[{ required: true, message: "Vui lòng chọn lộ trình" }]}
                            options={templates.map((t) => ({ label: t.name, value: t.id }))}
                            fieldProps={{
                                loading: loadingTemplates,
                                disabled: templates.length === 0,
                                onChange: (val) => handleTemplateChange(val as number),
                            }}
                        />
                    </Col>
                )}

                {/* ── Preview steps ── */}
                {!isEdit && selectedTemplate && (
                    <Col span={24}>
                        <div style={{
                            padding: "10px 14px", background: T.s1,
                            border: `1px solid ${T.line}`, borderRadius: 8,
                        }}>
                            <Text style={{
                                fontSize: 10, fontWeight: 700, color: T.ink4,
                                letterSpacing: 0.8, textTransform: "uppercase",
                                display: "block", marginBottom: 8,
                            }}>
                                Các bước trong lộ trình
                            </Text>
                            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                                {selectedTemplate.steps?.map((step, i) => {
                                    const isCurrent = step.careerPathId === detectedCareerPathId;
                                    return (
                                        <div key={i} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                                            <span style={{
                                                padding: "3px 10px", borderRadius: 6,
                                                background: isCurrent ? T.accSoft : T.s2,
                                                border: `1px solid ${isCurrent ? T.accBord : T.line}`,
                                                fontSize: 11, fontWeight: isCurrent ? 700 : 400,
                                                color: isCurrent ? T.acc : T.ink3,
                                            }}>
                                                {step.positionLevelCode && (
                                                    <span style={{ marginRight: 4, fontWeight: 700 }}>{step.positionLevelCode}</span>
                                                )}
                                                {step.jobTitleName}
                                                {step.durationMonths && (
                                                    <span style={{ marginLeft: 4, color: T.ink4, fontWeight: 400 }}>
                                                        ({step.durationMonths}th)
                                                    </span>
                                                )}
                                            </span>
                                            {i < (selectedTemplate.steps?.length ?? 0) - 1 && (
                                                <span style={{ color: T.ink4, fontSize: 10 }}>→</span>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </Col>
                )}

                {/* ── Cảnh báo bước không khớp ── */}
                {!isEdit && stepMatchWarning && (
                    <Col span={24}>
                        <Alert type="warning" showIcon style={{ borderRadius: 8 }}
                            message="Vị trí hiện tại của nhân viên không có trong lộ trình này. Hãy chọn lộ trình phù hợp." />
                    </Col>
                )}

                {/* ── Ngày bắt đầu + Ghi chú ── */}
                {!isEdit && (
                    <Col span={12}>
                        <ProFormDatePicker
                            name="startDate"
                            label="Ngày bắt đầu"
                            placeholder="Mặc định: hôm nay"
                            fieldProps={{
                                style: { width: "100%" },
                                format: "DD/MM/YYYY",
                                // ← KHÔNG đặt value ở đây để tránh conflict
                            }}
                        />
                    </Col>
                )}

                <Col span={isEdit ? 24 : 12}>
                    <ProFormTextArea
                        name="note"
                        label="Ghi chú"
                        placeholder="Ghi chú thêm về lộ trình..."
                        fieldProps={{ rows: 3 }}
                    />
                </Col>

            </Row>
        </ModalForm>
    );
};

export default ModalAssignCareerPath;