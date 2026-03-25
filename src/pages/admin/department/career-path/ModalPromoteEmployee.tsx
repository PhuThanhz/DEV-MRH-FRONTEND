import { useEffect } from "react";
import { Form, Row, Col, Alert, Typography } from "antd";
import {
    ModalForm,
    ProFormDatePicker,
    ProFormTextArea,
} from "@ant-design/pro-components";
import { RiseOutlined, ArrowRightOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { usePromoteEmployeeMutation } from "@/hooks/useEmployeeCareerPaths";
import type { IEmployeeCareerPath } from "@/types/backend";

const { Text } = Typography;

const T = {
    ink: "#0a0a0b", ink3: "#636366", ink4: "#aeaeb2",
    s1: "#fafafa", s2: "#f5f5f7",
    line: "rgba(0,0,0,0.06)",
    acc: "#0066ff", accSoft: "rgba(0,102,255,0.07)", accBord: "rgba(0,102,255,0.18)",
    green: "#34c759", greenSoft: "rgba(52,199,89,0.08)", greenBord: "rgba(52,199,89,0.22)",
    purple: "#af52de", purpleSoft: "rgba(175,82,222,0.08)", purpleBord: "rgba(175,82,222,0.22)",
};

// ── Helper: chuyển dayjs/string/undefined → "YYYY-MM-DD" an toàn ─
const safeFormatDate = (val: any): string => {
    const d = dayjs(val);
    return d.isValid() ? d.format("YYYY-MM-DD") : dayjs().format("YYYY-MM-DD");
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

    useEffect(() => {
        if (!open) return;
        form.resetFields();
        // Set default hôm nay dạng dayjs object — ProFormDatePicker nhận dayjs
        form.setFieldsValue({ promotedAt: dayjs() });
    }, [open]);

    const handleFinish = async (values: any) => {
        if (!dataInit?.id) return;

        const promotedAt = safeFormatDate(values.promotedAt);

        promote(
            {
                id: dataInit.id,
                data: { promotedAt, note: values.note },
            },
            { onSuccess }
        );
    };

    const currentStep = dataInit?.currentStep;
    const nextStep = dataInit?.nextStep;

    return (
        <ModalForm
            title={
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <RiseOutlined style={{ color: T.green }} />
                    <span style={{ fontSize: 15, fontWeight: 600, color: T.ink }}>
                        Thăng tiến nhân viên
                    </span>
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
            }}
            submitter={{
                searchConfig: { submitText: "Xác nhận thăng tiến", resetText: "Hủy" },
                submitButtonProps: {
                    style: { background: T.green, borderColor: T.green },
                },
            }}
        >
            {/* ── Thông tin nhân viên ── */}
            {dataInit && (
                <div style={{
                    padding: "14px 16px",
                    background: T.s1,
                    border: `1px solid ${T.line}`,
                    borderRadius: 10,
                    marginBottom: 20,
                }}>
                    <Text style={{ fontSize: 12, fontWeight: 600, color: T.ink3, display: "block", marginBottom: 10 }}>
                        {dataInit.user?.name ?? "—"}
                        <span style={{ fontWeight: 400, color: T.ink4, marginLeft: 6 }}>
                            {dataInit.user?.email}
                        </span>
                    </Text>

                    {/* From → To */}
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        {/* Bước hiện tại */}
                        <div style={{
                            flex: 1, padding: "8px 12px",
                            background: T.accSoft, border: `1px solid ${T.accBord}`,
                            borderRadius: 8,
                        }}>
                            <Text style={{ fontSize: 10, color: T.acc, fontWeight: 600, display: "block", marginBottom: 3 }}>
                                HIỆN TẠI — Bước {dataInit.currentStepOrder}/{dataInit.totalSteps}
                            </Text>
                            <Text style={{ fontSize: 13, fontWeight: 600, color: T.ink }}>
                                {currentStep?.jobTitleName ?? "—"}
                            </Text>
                            {currentStep?.positionLevelCode && (
                                <span style={{
                                    marginLeft: 6, padding: "1px 6px", borderRadius: 4,
                                    background: T.acc, fontSize: 10, fontWeight: 700, color: "#fff",
                                }}>
                                    {currentStep.positionLevelCode}
                                </span>
                            )}
                        </div>

                        <ArrowRightOutlined style={{ color: T.green, fontSize: 16, flexShrink: 0 }} />

                        {/* Bước tiếp theo */}
                        <div style={{
                            flex: 1, padding: "8px 12px",
                            background: T.greenSoft, border: `1px solid ${T.greenBord}`,
                            borderRadius: 8,
                        }}>
                            <Text style={{ fontSize: 10, color: T.green, fontWeight: 600, display: "block", marginBottom: 3 }}>
                                SAU THĂNG TIẾN
                            </Text>
                            {nextStep ? (
                                <>
                                    <Text style={{ fontSize: 13, fontWeight: 600, color: T.ink }}>
                                        {nextStep.jobTitleName}
                                    </Text>
                                    {nextStep.positionLevelCode && (
                                        <span style={{
                                            marginLeft: 6, padding: "1px 6px", borderRadius: 4,
                                            background: T.green, fontSize: 10, fontWeight: 700, color: "#fff",
                                        }}>
                                            {nextStep.positionLevelCode}
                                        </span>
                                    )}
                                </>
                            ) : (
                                <Text style={{ fontSize: 12, color: T.ink4, fontStyle: "italic" }}>
                                    Đỉnh lộ trình
                                </Text>
                            )}
                        </div>
                    </div>

                    {/* Tên lộ trình */}
                    {dataInit.template?.name && (
                        <Text style={{ fontSize: 11, color: T.ink4, display: "block", marginTop: 8 }}>
                            Lộ trình: <strong style={{ color: T.acc }}>{dataInit.template.name}</strong>
                        </Text>
                    )}
                </div>
            )}

            {/* ── Cảnh báo nếu không có bước tiếp theo ── */}
            {dataInit && !nextStep && (
                <Alert
                    type="warning"
                    showIcon
                    style={{ borderRadius: 8, marginBottom: 16 }}
                    message="Nhân viên đã ở bước cao nhất trong lộ trình. Không thể thăng tiến thêm."
                />
            )}

            {/* ── Form ── */}
            <Row gutter={[16, 0]}>
                <Col span={12}>
                    <ProFormDatePicker
                        name="promotedAt"
                        label="Ngày thăng tiến"
                        placeholder="Chọn ngày"
                        rules={[{ required: true, message: "Vui lòng chọn ngày thăng tiến" }]}
                        fieldProps={{
                            style: { width: "100%" },
                            format: "DD/MM/YYYY",
                            // ← KHÔNG đặt value ở đây — để form.setFieldsValue quản lý
                        }}
                    />
                </Col>

                <Col span={12}>
                    {nextStep?.durationMonths && (
                        <div style={{
                            padding: "8px 12px",
                            background: T.s2,
                            border: `1px solid ${T.line}`,
                            borderRadius: 8,
                            marginTop: 28,
                        }}>
                            <Text style={{ fontSize: 11, color: T.ink4, display: "block" }}>
                                Thời gian dự kiến bước tiếp theo
                            </Text>
                            <Text style={{ fontSize: 13, fontWeight: 600, color: T.ink3 }}>
                                {nextStep.durationMonths} tháng
                            </Text>
                        </div>
                    )}
                </Col>

                <Col span={24}>
                    <ProFormTextArea
                        name="note"
                        label="Ghi chú"
                        placeholder="Lý do thăng tiến, nhận xét về nhân viên..."
                        fieldProps={{ rows: 3 }}
                    />
                </Col>
            </Row>
        </ModalForm>
    );
};

export default ModalPromoteEmployee;