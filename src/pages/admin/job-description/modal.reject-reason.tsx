import { Modal, Form, Input, Button, Spin } from "antd";
import { useState } from "react";

interface RejectReasonModalProps {
    open: boolean;
    onCancel: () => void;
    onSubmit: (reason: string) => void;
    loading?: boolean; // optional: nếu parent có loading async
}

const ModalRejectReason = ({
    open,
    onCancel,
    onSubmit,
    loading = false,
}: RejectReasonModalProps) => {
    const [form] = Form.useForm();
    const [submitting, setSubmitting] = useState(false);

    const handleFinish = async (values: { reason: string }) => {
        setSubmitting(true);
        try {
            await onSubmit(values.reason.trim());
            form.resetFields();
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Modal
            title="Lý do từ chối JD"
            open={open}
            onCancel={() => {
                form.resetFields();
                onCancel();
            }}
            footer={null}
            destroyOnClose
            width={600} // rộng hơn một chút cho TextArea
            centered
            afterOpenChange={(visible) => {
                if (visible) {
                    setTimeout(() => form.getFieldInstance("reason")?.focus(), 100); // auto focus
                }
            }}
        >
            <Form
                form={form}
                layout="vertical"
                onFinish={handleFinish}
                initialValues={{ reason: "" }}
            >
                <Form.Item
                    label="Vui lòng nhập lý do từ chối (chi tiết để người tạo JD hiểu rõ)"
                    name="reason"
                    rules={[
                        { required: true, message: "Lý do từ chối không được để trống" },
                        { min: 10, message: "Lý do nên ít nhất 10 ký tự để rõ ràng" },
                    ]}
                >
                    <Input.TextArea
                        rows={5}
                        placeholder="Ví dụ: Không phù hợp với yêu cầu kinh nghiệm, thiếu kỹ năng lãnh đạo đội nhóm, hoặc nội dung chưa rõ ràng về trách nhiệm..."
                        disabled={submitting || loading}
                        showCount
                        maxLength={1000}
                    />
                </Form.Item>

                <div style={{ textAlign: "right", marginTop: 24 }}>
                    <Button
                        onClick={() => {
                            form.resetFields();
                            onCancel();
                        }}
                        disabled={submitting || loading}
                    >
                        Hủy
                    </Button>
                    <Button
                        type="primary"
                        danger
                        htmlType="submit"
                        loading={submitting || loading}
                        disabled={submitting || loading}
                        style={{ marginLeft: 12 }}
                    >
                        Gửi từ chối
                    </Button>
                </div>
            </Form>
        </Modal>
    );
};

export default ModalRejectReason;