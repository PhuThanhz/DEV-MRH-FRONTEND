import { useEffect } from "react";
import { Form, Row, Col, Alert, Typography } from "antd";
import {
    ModalForm,
    ProFormDatePicker,
    ProFormTextArea,
} from "@ant-design/pro-components";
import { ArrowRightOutlined, RiseOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { usePromoteEmployeeMutation } from "@/hooks/useEmployeeCareerPaths";
import type { IEmployeeCareerPath } from "@/types/backend";

const { Text } = Typography;

// ── Design tokens: white + soft pink ─────────────────────────────────────────
const T = {
    ink: "#1a1a1e",
    ink2: "#3c3c42",
    ink3: "#6c6c72",
    ink4: "#aeaeb4",
    white: "#ffffff",
    s1: "#fafafa",
    s2: "#f5f5f7",
    line: "rgba(0,0,0,0.07)",
    lineSub: "rgba(0,0,0,0.04)",

    // Pink accent
    pinkBg: "#fbeaf0",
    pinkBord: "#f4c0d1",
    pinkText: "#72243e",
    pinkMid: "#993556",
    pinkStrong: "#d4537e",

    // Warm coral — next step card (no green/blue)
    coralBg: "#faece7",
    coralBord: "#f5c4b3",
    coralText: "#4a1b0c",
    coralMid: "#993c1d",

    red: "#e24b4a",
};

// ── Helpers ───────────────────────────────────────────────────────────────────
const safeFormatDate = (val: any): string => {
    const d = dayjs(val);
    return d.isValid() ? d.format("YYYY-MM-DD") : dayjs().format("YYYY-MM-DD");
};

const getInitials = (name?: string): string => {
    if (!name) return "?";
    return name.trim().split(/\s+/).map((w) => w[0]).slice(-2).join("").toUpperCase();
};

// ── Props ─────────────────────────────────────────────────────────────────────
interface IProps {
    open: boolean;
    onClose: () => void;
    dataInit?: IEmployeeCareerPath | null;
    onSuccess: () => void;
}

// ── Component ─────────────────────────────────────────────────────────────────
const ModalPromoteEmployee = ({ open, onClose, dataInit, onSuccess }: IProps) => {
    const [form] = Form.useForm();
    const { mutate: promote, isPending } = usePromoteEmployeeMutation();

    useEffect(() => {
        if (!open) return;
        form.resetFields();
        form.setFieldsValue({ promotedAt: dayjs() });
    }, [open]);

    const handleFinish = async (values: any) => {
        if (!dataInit?.id) return;
        const promotedAt = safeFormatDate(values.promotedAt);
        promote(
            { id: dataInit.id, data: { promotedAt, note: values.note } },
            { onSuccess }
        );
    };

    const currentStep = dataInit?.currentStep;
    const nextStep = dataInit?.nextStep;
    const canPromote = !!nextStep;

    const progressPct =
        dataInit?.currentStepOrder && dataInit?.totalSteps
            ? Math.round((dataInit.currentStepOrder / dataInit.totalSteps) * 100)
            : 0;

    return (
        <ModalForm
            title={
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{
                        width: 34,
                        height: 34,
                        borderRadius: "50%",
                        background: T.pinkBg,
                        border: `1px solid ${T.pinkBord}`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                    }}>
                        <RiseOutlined style={{ color: T.pinkMid, fontSize: 15 }} />
                    </div>
                    <div>
                        <div style={{ fontSize: 15, fontWeight: 600, color: T.ink, lineHeight: 1.3 }}>
                            Thăng tiến nhân viên
                        </div>
                        <div style={{ fontSize: 12, color: T.ink3, fontWeight: 400 }}>
                            Xác nhận bước tiếp theo trong lộ trình
                        </div>
                    </div>
                </div>
            }
            open={open}
            form={form}
            onFinish={handleFinish}
            modalProps={{
                onCancel: onClose,
                afterClose: () => form.resetFields(),
                destroyOnClose: true,
                width: 560,
                maskClosable: false,
                confirmLoading: isPending,
                styles: {
                    header: {
                        borderBottom: `1px solid ${T.line}`,
                        paddingBottom: 16,
                        marginBottom: 0,
                    },
                    body: { paddingTop: 20 },
                },
            }}
            submitter={{
                searchConfig: {
                    submitText: "Xác nhận thăng tiến",
                    resetText: "Hủy",
                },
                submitButtonProps: {
                    disabled: !canPromote,
                    style: {
                        background: canPromote ? T.pinkMid : "#e8e8ea",
                        borderColor: canPromote ? T.pinkMid : "#e8e8ea",
                        color: canPromote ? "#fff" : T.ink4,
                        fontWeight: 500,
                        height: 36,
                        borderRadius: 8,
                        paddingInline: 20,
                    },
                },
                resetButtonProps: {
                    style: {
                        height: 36,
                        borderRadius: 8,
                        borderColor: T.line,
                        color: T.ink3,
                    },
                },
            }}
        >
            {/* ── Employee info card ──────────────────────────────────────── */}
            {dataInit && (
                <div style={{
                    border: `1px solid ${T.line}`,
                    borderRadius: 12,
                    overflow: "hidden",
                    marginBottom: 20,
                    background: T.white,
                }}>
                    {/* Header: avatar + name */}
                    <div style={{
                        padding: "13px 16px",
                        background: T.s1,
                        borderBottom: `1px solid ${T.lineSub}`,
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                    }}>
                        <div style={{
                            width: 40,
                            height: 40,
                            borderRadius: "50%",
                            background: T.pinkBg,
                            border: `1px solid ${T.pinkBord}`,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: 13,
                            fontWeight: 600,
                            color: T.pinkMid,
                            flexShrink: 0,
                        }}>
                            {getInitials(dataInit.user?.name)}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <Text style={{ fontSize: 14, fontWeight: 600, color: T.ink, display: "block" }}>
                                {dataInit.user?.name ?? "—"}
                            </Text>
                            <Text style={{ fontSize: 12, color: T.ink3 }}>
                                {dataInit.user?.email ?? ""}
                            </Text>
                        </div>
                        {/* Status badge */}
                        <div style={{
                            padding: "3px 10px",
                            borderRadius: 20,
                            background: T.pinkBg,
                            border: `1px solid ${T.pinkBord}`,
                            fontSize: 11,
                            fontWeight: 500,
                            color: T.pinkMid,
                            whiteSpace: "nowrap",
                        }}>
                            Đang hoạt động
                        </div>
                    </div>

                    {/* Career path body */}
                    <div style={{ padding: "16px 16px 14px" }}>
                        {/* Template label */}
                        {dataInit.template?.name && (
                            <Text style={{
                                fontSize: 11,
                                color: T.ink4,
                                display: "block",
                                marginBottom: 12,
                            }}>
                                Lộ trình:{" "}
                                <span style={{ color: T.pinkMid, fontWeight: 500 }}>
                                    {dataInit.template.name}
                                </span>
                            </Text>
                        )}

                        {/* Step cards */}
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            {/* Current step */}
                            <div style={{
                                flex: 1,
                                padding: "12px 14px",
                                background: T.pinkBg,
                                border: `1px solid ${T.pinkBord}`,
                                borderRadius: 10,
                            }}>
                                <Text style={{
                                    display: "block",
                                    fontSize: 10,
                                    fontWeight: 600,
                                    color: T.pinkMid,
                                    textTransform: "uppercase",
                                    letterSpacing: "0.06em",
                                    marginBottom: 5,
                                }}>
                                    Hiện tại
                                    {dataInit.currentStepOrder && dataInit.totalSteps && (
                                        <span style={{ fontWeight: 400, opacity: 0.7, marginLeft: 4 }}>
                                            · Bước {dataInit.currentStepOrder}/{dataInit.totalSteps}
                                        </span>
                                    )}
                                </Text>
                                <Text style={{ fontSize: 14, fontWeight: 600, color: T.pinkText, display: "block" }}>
                                    {currentStep?.jobTitleName ?? "—"}
                                </Text>
                                {currentStep?.positionLevelCode && (
                                    <span style={{
                                        display: "inline-block",
                                        marginTop: 6,
                                        padding: "2px 8px",
                                        borderRadius: 4,
                                        background: T.pinkMid,
                                        color: "#fff",
                                        fontSize: 10,
                                        fontWeight: 700,
                                        letterSpacing: "0.04em",
                                    }}>
                                        {currentStep.positionLevelCode}
                                    </span>
                                )}
                            </div>

                            {/* Arrow icon */}
                            <div style={{
                                width: 28,
                                height: 28,
                                borderRadius: "50%",
                                background: T.white,
                                border: `1px solid ${T.pinkBord}`,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                flexShrink: 0,
                            }}>
                                <ArrowRightOutlined style={{ fontSize: 11, color: T.pinkStrong }} />
                            </div>

                            {/* Next step */}
                            <div style={{
                                flex: 1,
                                padding: "12px 14px",
                                background: nextStep ? T.coralBg : T.s2,
                                border: `1px solid ${nextStep ? T.coralBord : T.line}`,
                                borderRadius: 10,
                            }}>
                                <Text style={{
                                    display: "block",
                                    fontSize: 10,
                                    fontWeight: 600,
                                    color: nextStep ? T.coralMid : T.ink4,
                                    textTransform: "uppercase",
                                    letterSpacing: "0.06em",
                                    marginBottom: 5,
                                }}>
                                    Sau thăng tiến
                                </Text>
                                {nextStep ? (
                                    <>
                                        <Text style={{ fontSize: 14, fontWeight: 600, color: T.coralText, display: "block" }}>
                                            {nextStep.jobTitleName}
                                        </Text>
                                        {nextStep.positionLevelCode && (
                                            <span style={{
                                                display: "inline-block",
                                                marginTop: 6,
                                                padding: "2px 8px",
                                                borderRadius: 4,
                                                background: T.coralMid,
                                                color: "#fff",
                                                fontSize: 10,
                                                fontWeight: 700,
                                                letterSpacing: "0.04em",
                                            }}>
                                                {nextStep.positionLevelCode}
                                            </span>
                                        )}
                                    </>
                                ) : (
                                    <Text style={{ fontSize: 13, color: T.ink4, fontStyle: "italic" }}>
                                        Đỉnh lộ trình
                                    </Text>
                                )}
                            </div>
                        </div>

                        {/* Progress bar */}
                        {dataInit.currentStepOrder && dataInit.totalSteps && (
                            <div style={{ marginTop: 14 }}>
                                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                                    <Text style={{ fontSize: 11, color: T.ink4 }}>Tiến trình lộ trình</Text>
                                    <Text style={{ fontSize: 11, color: T.ink3, fontWeight: 500 }}>
                                        Bước {dataInit.currentStepOrder} / {dataInit.totalSteps}
                                    </Text>
                                </div>
                                <div style={{
                                    height: 4,
                                    background: T.s2,
                                    borderRadius: 99,
                                    overflow: "hidden",
                                }}>
                                    <div style={{
                                        width: `${progressPct}%`,
                                        height: "100%",
                                        background: `linear-gradient(90deg, ${T.pinkBord}, ${T.pinkMid})`,
                                        borderRadius: 99,
                                    }} />
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ── Warning: top of path ────────────────────────────────────── */}
            {dataInit && !nextStep && (
                <Alert
                    type="warning"
                    showIcon
                    style={{ borderRadius: 8, marginBottom: 16 }}
                    message="Nhân viên đã ở bước cao nhất trong lộ trình. Không thể thăng tiến thêm."
                />
            )}

            {/* ── Form ────────────────────────────────────────────────────── */}
            <Row gutter={[14, 0]}>
                <Col span={12}>
                    <ProFormDatePicker
                        name="promotedAt"
                        label="Ngày thăng tiến"
                        placeholder="Chọn ngày"
                        rules={[{ required: true, message: "Vui lòng chọn ngày thăng tiến" }]}
                        fieldProps={{
                            style: { width: "100%" },
                            format: "DD/MM/YYYY",
                        }}
                    />
                </Col>

                <Col span={12}>
                    {nextStep?.durationMonths ? (
                        <div style={{ marginTop: 28 }}>
                            <div style={{
                                padding: "9px 14px",
                                background: T.s1,
                                border: `1px solid ${T.line}`,
                                borderRadius: 8,
                                display: "flex",
                                alignItems: "center",
                                gap: 10,
                            }}>
                                <div style={{
                                    width: 28,
                                    height: 28,
                                    borderRadius: "50%",
                                    background: T.pinkBg,
                                    border: `1px solid ${T.pinkBord}`,
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    flexShrink: 0,
                                }}>
                                    <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
                                        <circle cx="7" cy="7" r="5.5" stroke={T.pinkMid} strokeWidth="1.1" />
                                        <path d="M7 4.5V7L9 9" stroke={T.pinkMid} strokeWidth="1.2" strokeLinecap="round" />
                                    </svg>
                                </div>
                                <div>
                                    <Text style={{ fontSize: 10, color: T.ink4, display: "block" }}>
                                        Thời gian dự kiến
                                    </Text>
                                    <Text style={{ fontSize: 13, fontWeight: 600, color: T.ink2 }}>
                                        {nextStep.durationMonths} tháng
                                    </Text>
                                </div>
                            </div>
                        </div>
                    ) : null}
                </Col>

                <Col span={24}>
                    <ProFormTextArea
                        name="note"
                        label="Ghi chú"
                        placeholder="Lý do thăng tiến, nhận xét về nhân viên..."
                        fieldProps={{ rows: 3, style: { resize: "none" } }}
                    />
                </Col>
            </Row>
        </ModalForm>
    );
};

export default ModalPromoteEmployee;