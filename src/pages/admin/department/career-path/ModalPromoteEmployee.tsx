import { useEffect, useState } from "react";
import { Form, Row, Col, Alert, Typography } from "antd";
import {
    ModalForm,
    ProFormDatePicker,
    ProFormTextArea,
} from "@ant-design/pro-components";
import { ArrowRightOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { usePromoteEmployeeMutation } from "@/hooks/useEmployeeCareerPaths";
import type { IEmployeeCareerPath } from "@/types/backend";
import { T, Badge } from "./ModalEmployeeDetail";
import ConfirmModal from "@/components/common/modal/ConfirmModal";

const { Text } = Typography;

const safeFormatDate = (val: any): string => {
    const d = dayjs(val);
    return d.isValid() ? d.format("YYYY-MM-DD") : dayjs().format("YYYY-MM-DD");
};

const getInitials = (name?: string): string => {
    if (!name) return "?";
    return name.trim().split(/\s+/).map((w) => w[0]).slice(-2).join("").toUpperCase();
};

interface IProps {
    open: boolean;
    onClose: () => void;
    dataInit?: IEmployeeCareerPath | null;
    onSuccess: () => void;
}

const ModalPromoteEmployee = ({ open, onClose, dataInit, onSuccess }: IProps) => {
    const [form] = Form.useForm();
    const { mutate: promote, isPending } = usePromoteEmployeeMutation();

    // ── State cho confirm modal ──────────────────────────────────────────────
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [pendingValues, setPendingValues] = useState<any>(null);

    useEffect(() => {
        if (!open) return;
        form.resetFields();
        form.setFieldsValue({ promotedAt: dayjs() });
    }, [open]);

    // Bước 1: form submit → mở confirm thay vì call API ngay
    const handleFinish = async (values: any) => {
        if (!dataInit?.id) return;
        setPendingValues(values);
        setConfirmOpen(true);
    };

    // Bước 2: user bấm "Xác nhận" trong ConfirmModal → call API
    const handleConfirm = () => {
        if (!dataInit?.id || !pendingValues) return;
        const promotedAt = safeFormatDate(pendingValues.promotedAt);
        promote(
            { id: dataInit.id, data: { promotedAt, note: pendingValues.note } },
            {
                onSuccess: () => {
                    setConfirmOpen(false);
                    setPendingValues(null);
                    onSuccess();
                },
            }
        );
    };

    const handleCancelConfirm = () => {
        setConfirmOpen(false);
        setPendingValues(null);
    };

    const currentStep = dataInit?.currentStep;
    const nextStep = dataInit?.nextStep;
    const canPromote = !!nextStep;

    const progressPct =
        dataInit?.currentStepOrder && dataInit?.totalSteps
            ? Math.round((dataInit.currentStepOrder / dataInit.totalSteps) * 100)
            : 0;

    return (
        <>
            <ModalForm
                title="Thăng tiến nhân viên"
                open={open}
                form={form}
                onFinish={handleFinish}
                modalProps={{
                    onCancel: onClose,
                    afterClose: () => form.resetFields(),
                    destroyOnClose: true,
                    width: "min(560px, 95vw)",
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
                            maxHeight: "82vh",
                            overflowY: "auto",
                        },
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
                            background: canPromote ? T.acc : T.s2,
                            borderColor: canPromote ? T.acc : T.line,
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
                {/* ── Employee info card ── */}
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
                            borderBottom: `1px solid ${T.line}`,
                            display: "flex",
                            alignItems: "center",
                            gap: 12,
                            flexWrap: "wrap",
                        }}>
                            <div style={{
                                width: 40,
                                height: 40,
                                borderRadius: "50%",
                                background: T.accSoft,
                                border: `1px solid ${T.accBord}`,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: 13,
                                fontWeight: 600,
                                color: T.acc,
                                flexShrink: 0,
                            }}>
                                {getInitials(dataInit.user?.name)}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <Text style={{
                                    fontSize: 14,
                                    fontWeight: 600,
                                    color: T.ink,
                                    display: "block",
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    whiteSpace: "nowrap",
                                }}>
                                    {dataInit.user?.name ?? "—"}
                                </Text>
                                <Text style={{
                                    fontSize: 12,
                                    color: T.ink3,
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    whiteSpace: "nowrap",
                                    display: "block",
                                }}>
                                    {dataInit.user?.email ?? ""}
                                </Text>
                            </div>
                            <Badge color={T.green} bg={T.greenSoft} border={T.greenBord}>
                                Đang hoạt động
                            </Badge>
                        </div>

                        {/* Career path body */}
                        <div style={{ padding: "16px 16px 14px" }}>
                            {dataInit.template?.name && (
                                <Text style={{
                                    fontSize: 11,
                                    color: T.ink4,
                                    display: "block",
                                    marginBottom: 12,
                                }}>
                                    Lộ trình:{" "}
                                    <span style={{ color: T.acc, fontWeight: 500 }}>
                                        {dataInit.template.name}
                                    </span>
                                </Text>
                            )}

                            <div style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 8,
                                flexWrap: "wrap",
                            }}>
                                {/* Current step */}
                                <div style={{
                                    flex: "1 1 120px",
                                    minWidth: 0,
                                    padding: "12px 14px",
                                    background: T.accSoft,
                                    border: `1px solid ${T.accBord}`,
                                    borderRadius: 10,
                                }}>
                                    <Text style={{
                                        display: "block",
                                        fontSize: 10,
                                        fontWeight: 600,
                                        color: T.acc,
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
                                    <Text style={{
                                        fontSize: 14,
                                        fontWeight: 600,
                                        color: T.ink,
                                        display: "block",
                                        overflow: "hidden",
                                        textOverflow: "ellipsis",
                                        whiteSpace: "nowrap",
                                    }}>
                                        {currentStep?.jobTitleName ?? "—"}
                                    </Text>
                                    {currentStep?.positionLevelCode && (
                                        <div style={{ marginTop: 6 }}>
                                            <Badge color={T.acc} bg={T.accSoft} border={T.accBord}>
                                                {currentStep.positionLevelCode}
                                            </Badge>
                                        </div>
                                    )}
                                </div>

                                {/* Arrow */}
                                <div style={{
                                    width: 28,
                                    height: 28,
                                    borderRadius: "50%",
                                    background: T.white,
                                    border: `1px solid ${T.line}`,
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    flexShrink: 0,
                                }}>
                                    <ArrowRightOutlined style={{ fontSize: 11, color: T.ink4 }} />
                                </div>

                                {/* Next step */}
                                <div style={{
                                    flex: "1 1 120px",
                                    minWidth: 0,
                                    padding: "12px 14px",
                                    background: nextStep ? T.violetSoft : T.s2,
                                    border: `1px solid ${nextStep ? T.violetBord : T.line}`,
                                    borderRadius: 10,
                                }}>
                                    <Text style={{
                                        display: "block",
                                        fontSize: 10,
                                        fontWeight: 600,
                                        color: nextStep ? T.violet : T.ink4,
                                        textTransform: "uppercase",
                                        letterSpacing: "0.06em",
                                        marginBottom: 5,
                                    }}>
                                        Sau thăng tiến
                                    </Text>
                                    {nextStep ? (
                                        <>
                                            <Text style={{
                                                fontSize: 14,
                                                fontWeight: 600,
                                                color: T.ink,
                                                display: "block",
                                                overflow: "hidden",
                                                textOverflow: "ellipsis",
                                                whiteSpace: "nowrap",
                                            }}>
                                                {nextStep.jobTitleName}
                                            </Text>
                                            {nextStep.positionLevelCode && (
                                                <div style={{ marginTop: 6 }}>
                                                    <Badge color={T.violet} bg={T.violetSoft} border={T.violetBord}>
                                                        {nextStep.positionLevelCode}
                                                    </Badge>
                                                </div>
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
                                            background: `linear-gradient(90deg, ${T.acc}, ${T.violet})`,
                                            borderRadius: 99,
                                        }} />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* ── Warning: top of path ── */}
                {dataInit && !nextStep && (
                    <Alert
                        type="warning"
                        showIcon
                        style={{ borderRadius: 8, marginBottom: 16 }}
                        message="Nhân viên đã ở bước cao nhất trong lộ trình. Không thể thăng tiến thêm."
                    />
                )}

                {/* ── Form ── */}
                <Row gutter={[14, 0]}>
                    <Col xs={24} sm={12}>
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

                    <Col xs={24} sm={12}>
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
                                        background: T.s2,
                                        border: `1px solid ${T.line}`,
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        flexShrink: 0,
                                    }}>
                                        <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
                                            <circle cx="7" cy="7" r="5.5" stroke={T.ink3} strokeWidth="1.1" />
                                            <path d="M7 4.5V7L9 9" stroke={T.ink3} strokeWidth="1.2" strokeLinecap="round" />
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

            {/* ── Confirm Modal ── */}
            <ConfirmModal
                open={confirmOpen}
                variant="success"
                title="Xác nhận thăng tiến"
                description={`Bạn có chắc chắn muốn thăng tiến nhân viên này lên bước tiếp theo không?`}
                targetName={dataInit?.user?.name}
                okText="Thăng tiến"
                cancelText="Quay lại"
                loading={isPending}
                onConfirm={handleConfirm}
                onCancel={handleCancelConfirm}
            />
        </>
    );
};

export default ModalPromoteEmployee;