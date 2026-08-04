import React from "react";
import { DatePicker, Form, Input, Modal, Typography } from "antd";
import { FieldTimeOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { useRequestTaskExtensionMutation } from "@/hooks/useTasks";
import { useResponsiveModalWidth } from "@/utils/responsive";

const { Text } = Typography;

interface Props {
    open: boolean;
    taskId: number | null;
    currentDueDate?: string;
    onClose: () => void;
}

interface ExtensionFormValues {
    requestedDueDate: dayjs.Dayjs;
    reason: string;
}

export const TaskRequestExtensionModal: React.FC<Props> = ({ open, taskId, currentDueDate, onClose }) => {
    const modalWidth = useResponsiveModalWidth(520);
    const [form] = Form.useForm<ExtensionFormValues>();
    const requestMutation = useRequestTaskExtensionMutation();

    const resetAndClose = () => {
        form.resetFields();
        onClose();
    };

    const handleSubmit = async () => {
        try {
            const values = await form.validateFields();
            if (!taskId) return;

            await requestMutation.mutateAsync({
                id: taskId,
                data: {
                    requestedDueDate: values.requestedDueDate.toISOString(),
                    reason: values.reason.trim(),
                },
            });

            resetAndClose();
        } catch {
            // Ant Design hiển thị lỗi xác thực ngay tại trường nhập liệu.
        }
    };

    return (
        <Modal
            title={
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span
                        style={{
                            width: 32,
                            height: 32,
                            borderRadius: 8,
                            background: "#fff7ed",
                            display: "grid",
                            placeItems: "center",
                            color: "#d97706",
                        }}
                    >
                        <FieldTimeOutlined />
                    </span>
                    <span>
                        <Text strong style={{ display: "block" }}>Xin gia hạn hạn chót</Text>
                        <Text type="secondary" style={{ fontSize: 12.5 }}>
                            Gửi đề xuất hạn chót mới, chờ Người giao việc duyệt
                        </Text>
                    </span>
                </div>
            }
            open={open}
            onCancel={resetAndClose}
            onOk={handleSubmit}
            confirmLoading={requestMutation.isPending}
            okText="Gửi yêu cầu"
            cancelText="Hủy"
            width={modalWidth}
            centered
            destroyOnHidden
        >
            <Form form={form} layout="vertical" requiredMark={false} validateTrigger={["onBlur", "onSubmit"]}>
                {currentDueDate && (
                    <Text type="secondary" style={{ display: "block", marginBottom: 12, fontSize: 12.5 }}>
                        Hạn chót hiện tại: <b>{dayjs(currentDueDate).format("HH:mm DD/MM/YYYY")}</b>
                    </Text>
                )}

                <Form.Item
                    name="requestedDueDate"
                    label={<b>Hạn chót đề xuất</b>}
                    rules={[
                        { required: true, message: "Vui lòng chọn hạn chót đề xuất" },
                        {
                            validator: (_, value) => {
                                if (!value) return Promise.resolve();
                                if (currentDueDate && !value.isAfter(dayjs(currentDueDate))) {
                                    return Promise.reject(new Error("Hạn chót đề xuất phải muộn hơn hạn chót hiện tại"));
                                }
                                return Promise.resolve();
                            },
                        },
                    ]}
                >
                    <DatePicker
                        showTime
                        format="HH:mm DD/MM/YYYY"
                        style={{ width: "100%", borderRadius: 8 }}
                        disabledDate={(current) => current && current < dayjs().startOf("day")}
                    />
                </Form.Item>

                <Form.Item
                    name="reason"
                    label={<b>Lý do xin gia hạn</b>}
                    rules={[{ required: true, whitespace: true, message: "Vui lòng nhập lý do xin gia hạn" }]}
                >
                    <Input.TextArea
                        rows={4}
                        maxLength={2000}
                        placeholder="Nêu rõ khó khăn/phát sinh khiến cần gia hạn..."
                    />
                </Form.Item>
            </Form>
        </Modal>
    );
};
