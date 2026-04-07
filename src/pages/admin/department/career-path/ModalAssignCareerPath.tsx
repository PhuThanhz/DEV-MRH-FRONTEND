import { useEffect, useState } from "react";
import { Form, Row, Col, Alert, Spin, Typography, Select } from "antd";
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
import type { ICareerPathTemplate, IEmployeeCareerPath } from "@/types/backend";

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
};

// ── Helper format date ────────────────────────────────────────────
const safeFormatDate = (val: any): string | undefined => {
    if (!val) return undefined;
    const d = dayjs(val);
    return d.isValid() ? d.format("YYYY-MM-DD") : undefined;
};

// ── Avatar initials ───────────────────────────────────────────────
const getInitials = (name?: string) =>
    (name ?? "?").trim().split(/\s+/).map((w) => w[0]).slice(-2).join("").toUpperCase();

const AVATAR_COLORS = [T.acc, T.violet, T.green, T.amber, T.slate];
const avatarColor = (name?: string) =>
    name ? AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length] : T.slate;

// ── Level badge ───────────────────────────────────────────────────
const LevelBadge = ({ code }: { code?: string }) => {
    if (!code) return null;
    const first = code[0]?.toUpperCase();
    const colors: Record<string, { bg: string; bd: string; txt: string }> = {
        S: { bg: T.accSoft, bd: T.accBord, txt: T.acc },
        M: { bg: T.violetSoft, bd: T.violetBord, txt: T.violet },
        T: { bg: T.greenSoft, bd: T.greenBord, txt: T.green },
        D: { bg: T.amberSoft, bd: T.amberBord, txt: T.amber },
    };
    const c = colors[first] ?? { bg: T.slateSoft, bd: T.slateBord, txt: T.slate };
    return (
        <span style={{
            padding: "1px 6px", borderRadius: 4,
            background: c.bg, border: `1px solid ${c.bd}`,
            fontSize: 10, fontWeight: 700, color: c.txt,
            letterSpacing: 0.2, whiteSpace: "nowrap",
        }}>
            {code}
        </span>
    );
};

// ── Props ─────────────────────────────────────────────────────────
interface IProps {
    open: boolean;
    onClose: () => void;
    dataInit?: IEmployeeCareerPath | null;
    departmentId: number;
    onSuccess: () => void;
}

// ── User option shape ─────────────────────────────────────────────
interface IUserOption {
    id: number;
    name: string;
    email: string;
    jobTitleName?: string;
    positionCode?: string;
}

const ModalAssignCareerPath = ({ open, onClose, dataInit, departmentId, onSuccess }: IProps) => {
    const [form] = Form.useForm();
    const isEdit = Boolean(dataInit?.id);

    const [templates, setTemplates] = useState<ICareerPathTemplate[]>([]);
    const [loadingTemplates, setLoadingTemplates] = useState(false);
    const [userOptions, setUserOptions] = useState<IUserOption[]>([]);
    const [loadingUsers, setLoadingUsers] = useState(false);

    const [loadingPosition, setLoadingPosition] = useState(false);
    const [detectedCareerPathId, setDetectedCareerPathId] = useState<number | undefined>(undefined);
    const [detectedJobTitle, setDetectedJobTitle] = useState<string>("");
    const [detectedLevelCode, setDetectedLevelCode] = useState<string>("");

    const [selectedTemplateId, setSelectedTemplateId] = useState<number | undefined>(undefined);
    const [stepMatchWarning, setStepMatchWarning] = useState(false);
    const [notFound, setNotFound] = useState(false);

    const { mutate: assign, isPending: isAssigning } = useAssignCareerPathMutation();
    const { mutate: update, isPending: isUpdating } = useUpdateEmployeeCareerPathMutation();

    // ── Load templates + users ────────────────────────────────────
    useEffect(() => {
        if (!open || !departmentId) return;

        // Load templates
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

        // Load users với positions
        const loadUsers = async () => {
            setLoadingUsers(true);
            try {
                const res = await callFetchUser("page=1&size=200");
                const users = res?.data?.result ?? [];
                // Map sang IUserOption, lấy position đầu tiên active
                const opts: IUserOption[] = users.map((u: any) => {
                    const activePos = u.positions?.find((p: any) => p.active) ?? u.positions?.[0];
                    return {
                        id: u.id,
                        name: u.name,
                        email: u.email,
                        jobTitleName: activePos?.jobTitleNameVi ?? activePos?.jobTitle?.nameVi,
                        positionCode: activePos?.positionCode ?? activePos?.jobTitle?.positionCode,
                    };
                });
                setUserOptions(opts);
            } catch {
                setUserOptions([]);
            } finally {
                setLoadingUsers(false);
            }
        };

        loadTemplates();
        if (!isEdit) loadUsers();

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

    // ── Detect vị trí khi chọn nhân viên ─────────────────────────
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
                positions.find((p: any) => p.source === "DEPARTMENT" && p.active) ??
                positions.find((p: any) => p.active);

            if (!position?.jobTitle?.id) { setNotFound(true); return; }

            const allSteps = templates.flatMap((t) => t.steps ?? []);
            const matchedStep = allSteps.find((s) => s.jobTitleName === position.jobTitle?.nameVi);

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
            update({ id: dataInit!.id!, data: { note: values.note } as any }, { onSuccess });
        } else {
            assign({
                userId: values.userId,
                templateId: values.templateId,
                currentCareerPathId: values.currentCareerPathId,
                startDate: safeFormatDate(values.startDate),
                note: values.note,
            }, { onSuccess });
        }
    };

    const resetState = () => {
        form.resetFields();
        setDetectedCareerPathId(undefined);
        setDetectedJobTitle("");
        setDetectedLevelCode("");
        setSelectedTemplateId(undefined);
        setStepMatchWarning(false);
        setNotFound(false);
    };

    return (
        <ModalForm
            title={isEdit ? "Cập nhật lộ trình cá nhân" : "Gán lộ trình cho nhân viên"}
            open={open}
            form={form}
            onFinish={handleFinish}
            modalProps={{
                onCancel: onClose,
                afterClose: resetState,
                destroyOnClose: true,
                width: 600,
                maskClosable: false,
                confirmLoading: isAssigning || isUpdating,
                styles: {
                    header: { borderBottom: `1px solid ${T.line}`, paddingBottom: 16, marginBottom: 0 },
                    body: { paddingTop: 20 },
                },
            }}
            submitter={{
                searchConfig: {
                    submitText: isEdit ? "Cập nhật" : "Gán lộ trình",
                    resetText: "Hủy",
                },
                submitButtonProps: {
                    style: {
                        background: T.acc, borderColor: T.acc,
                        fontWeight: 500, height: 36, borderRadius: 8, paddingInline: 20,
                    },
                },
                resetButtonProps: {
                    style: { height: 36, borderRadius: 8, borderColor: T.line, color: T.ink3 },
                },
            }}
        >
            <Form.Item name="currentCareerPathId" hidden><input /></Form.Item>

            <Row gutter={[16, 12]}>

                {/* ── Edit mode: info card ── */}
                {isEdit && dataInit && (
                    <Col span={24}>
                        <div style={{
                            border: `1px solid ${T.line}`, borderRadius: 12,
                            overflow: "hidden", background: T.white,
                        }}>
                            {/* Avatar + tên */}
                            <div style={{
                                padding: "12px 16px", background: T.s1,
                                borderBottom: `1px solid ${T.line}`,
                                display: "flex", alignItems: "center", gap: 12,
                            }}>
                                <div style={{
                                    width: 38, height: 38, borderRadius: "50%", flexShrink: 0,
                                    background: avatarColor(dataInit.user?.name),
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                    fontSize: 13, fontWeight: 700, color: T.white,
                                }}>
                                    {getInitials(dataInit.user?.name)}
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <Text style={{ fontSize: 14, fontWeight: 600, color: T.ink, display: "block" }}>
                                        {dataInit.user?.name}
                                    </Text>
                                    <Text style={{ fontSize: 12, color: T.ink4 }}>
                                        {dataInit.user?.email}
                                    </Text>
                                </div>
                            </div>
                            {/* Info rows */}
                            <div style={{ padding: "12px 16px" }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "7px 0", borderBottom: `1px solid ${T.line}` }}>
                                    <Text style={{ fontSize: 12, color: T.ink4, fontWeight: 500 }}>Lộ trình</Text>
                                    <Text style={{ fontSize: 13, fontWeight: 600, color: T.acc }}>{dataInit.template?.name}</Text>
                                </div>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "7px 0", borderBottom: `1px solid ${T.line}` }}>
                                    <Text style={{ fontSize: 12, color: T.ink4, fontWeight: 500 }}>Vị trí hiện tại</Text>
                                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                        <LevelBadge code={dataInit.currentStep?.positionLevelCode} />
                                        <Text style={{ fontSize: 13, color: T.ink2 }}>{dataInit.currentStep?.jobTitleName}</Text>
                                    </div>
                                </div>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "7px 0" }}>
                                    <Text style={{ fontSize: 12, color: T.ink4, fontWeight: 500 }}>Tiến độ</Text>
                                    <Text style={{ fontSize: 12, color: T.ink3, fontWeight: 500 }}>
                                        Bước {dataInit.currentStepOrder}/{dataInit.totalSteps}
                                    </Text>
                                </div>
                            </div>
                        </div>
                    </Col>
                )}

                {/* ── Chọn nhân viên (custom Select với avatar + chức danh) ── */}
                {!isEdit && (
                    <Col span={24}>
                        <Form.Item
                            name="userId"
                            label={<Text style={{ fontSize: 13, fontWeight: 500, color: T.ink2 }}>Nhân viên</Text>}
                            rules={[{ required: true, message: "Vui lòng chọn nhân viên" }]}
                        >
                            <Select
                                showSearch
                                loading={loadingUsers}
                                placeholder="Tìm tên hoặc email..."
                                suffixIcon={loadingPosition ? <Spin size="small" /> : undefined}
                                onChange={(val) => handleUserChange(val as number)}
                                filterOption={(input, option) => {
                                    const u = userOptions.find((o) => o.id === option?.value);
                                    if (!u) return false;
                                    const q = input.toLowerCase();
                                    return (
                                        u.name.toLowerCase().includes(q) ||
                                        u.email.toLowerCase().includes(q) ||
                                        (u.jobTitleName ?? "").toLowerCase().includes(q)
                                    );
                                }}
                                optionLabelProp="label"
                                style={{ width: "100%" }}
                                dropdownStyle={{ padding: "4px 0" }}
                            >
                                {userOptions.map((u) => (
                                    <Select.Option key={u.id} value={u.id} label={u.name}>
                                        <div style={{
                                            display: "flex", alignItems: "center",
                                            gap: 10, padding: "4px 0",
                                        }}>
                                            {/* Avatar */}
                                            <div style={{
                                                width: 32, height: 32, borderRadius: "50%", flexShrink: 0,
                                                background: avatarColor(u.name),
                                                display: "flex", alignItems: "center", justifyContent: "center",
                                                fontSize: 11, fontWeight: 700, color: T.white,
                                            }}>
                                                {getInitials(u.name)}
                                            </div>
                                            {/* Info */}
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                                    <Text style={{ fontSize: 13, fontWeight: 600, color: T.ink }}>
                                                        {u.name}
                                                    </Text>
                                                    {u.positionCode && <LevelBadge code={u.positionCode} />}
                                                </div>
                                                <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 1 }}>
                                                    <Text style={{ fontSize: 11, color: T.ink4 }}>{u.email}</Text>
                                                    {u.jobTitleName && (
                                                        <>
                                                            <span style={{ color: T.ink6, fontSize: 10 }}>·</span>
                                                            <Text style={{ fontSize: 11, color: T.ink3 }}>{u.jobTitleName}</Text>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </Select.Option>
                                ))}
                            </Select>
                        </Form.Item>
                    </Col>
                )}

                {/* ── Detecting position ── */}
                {!isEdit && loadingPosition && (
                    <Col span={24}>
                        <div style={{
                            display: "flex", alignItems: "center", gap: 8,
                            padding: "10px 14px", background: T.s1,
                            border: `1px dashed ${T.ink6}`, borderRadius: 8,
                        }}>
                            <Spin size="small" />
                            <Text style={{ fontSize: 12.5, color: T.ink4 }}>Đang xác định vị trí hiện tại...</Text>
                        </div>
                    </Col>
                )}

                {/* ── Vị trí phát hiện ── */}
                {!isEdit && !loadingPosition && detectedJobTitle && (
                    <Col span={24}>
                        <div style={{
                            display: "flex", alignItems: "center", gap: 10,
                            padding: "10px 14px", background: T.accSoft,
                            border: `1px solid ${T.accBord}`, borderRadius: 8,
                        }}>
                            <div style={{
                                width: 8, height: 8, borderRadius: "50%",
                                background: T.acc, flexShrink: 0,
                            }} />
                            <div style={{ flex: 1 }}>
                                <Text style={{
                                    fontSize: 10, color: T.acc, fontWeight: 700,
                                    display: "block", marginBottom: 3,
                                    letterSpacing: 0.6, textTransform: "uppercase",
                                }}>
                                    Vị trí hiện tại
                                </Text>
                                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                    <Text style={{ fontSize: 13, fontWeight: 600, color: T.ink }}>
                                        {detectedJobTitle}
                                    </Text>
                                    <LevelBadge code={detectedLevelCode} />
                                </div>
                            </div>
                        </div>
                    </Col>
                )}

                {/* ── Không tìm thấy vị trí ── */}
                {!isEdit && notFound && !loadingPosition && (
                    <Col span={24}>
                        <Alert type="warning" showIcon style={{ borderRadius: 8 }}
                            message="Không tìm thấy vị trí hiện tại của nhân viên. Vui lòng kiểm tra UserPosition." />
                    </Col>
                )}

                {/* ── Chọn lộ trình ── */}
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

                {/* ── Preview các bước ── */}
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
                                                display: "inline-flex", alignItems: "center", gap: 5,
                                                padding: "4px 10px", borderRadius: 6,
                                                background: isCurrent ? T.accSoft : T.s2,
                                                border: `1px solid ${isCurrent ? T.accBord : T.line}`,
                                                fontSize: 11, fontWeight: isCurrent ? 700 : 400,
                                                color: isCurrent ? T.acc : T.ink3,
                                            }}>
                                                {step.positionLevelCode && (
                                                    <span style={{
                                                        fontSize: 10, fontWeight: 700,
                                                        color: isCurrent ? T.acc : T.ink4,
                                                    }}>
                                                        {step.positionLevelCode}
                                                    </span>
                                                )}
                                                {step.jobTitleName}
                                                {step.durationMonths && (
                                                    <span style={{
                                                        padding: "1px 5px", borderRadius: 4,
                                                        background: T.amberSoft, border: `1px solid ${T.amberBord}`,
                                                        fontSize: 10, fontWeight: 600, color: T.amber,
                                                    }}>
                                                        {step.durationMonths}th
                                                    </span>
                                                )}
                                            </span>
                                            {i < (selectedTemplate.steps?.length ?? 0) - 1 && (
                                                <Text style={{ fontSize: 10, color: T.ink6 }}>→</Text>
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
                            fieldProps={{ style: { width: "100%" }, format: "DD/MM/YYYY" }}
                        />
                    </Col>
                )}

                <Col span={isEdit ? 24 : 12}>
                    <ProFormTextArea
                        name="note"
                        label="Ghi chú"
                        placeholder="Ghi chú thêm về lộ trình..."
                        fieldProps={{ rows: 3, style: { resize: "none" } }}
                    />
                </Col>

            </Row>
        </ModalForm>
    );
};

export default ModalAssignCareerPath;