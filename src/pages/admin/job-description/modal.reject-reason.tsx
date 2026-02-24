import { Modal, Form, Input, Button } from "antd";

interface RejectReasonModalProps {
    open: boolean;
    onCancel: () => void;
    onSubmit: (reason: string) => void;
}

const ModalRejectReason = ({ open, onCancel, onSubmit }: RejectReasonModalProps) => {
    const [form] = Form.useForm();

    return (
        <Modal
            open={open}
            title="Lý do từ chối"
            footer={null}
            destroyOnClose
            onCancel={() => {
                form.resetFields();
                onCancel();
            }}
        >
            <Form
                form={form}
                layout="vertical"
                onFinish={(values) => {
                    onSubmit(values.reason);
                    form.resetFields();
                }}
            >
                <Form.Item
                    label="Nhập lý do từ chối"
                    name="reason"
                    rules={[{ required: true, message: "Vui lòng nhập lý do" }]}
                >
                    <Input.TextArea rows={4} placeholder="Nhập lý do tại đây..." />
                </Form.Item>

                <div style={{ textAlign: "right" }}>
                    <Button onClick={onCancel}>Hủy</Button>
                    <Button type="primary" htmlType="submit" style={{ marginLeft: 8 }}>
                        Gửi lý do
                    </Button>
                </div>
            </Form>
        </Modal>
    );
};

export default ModalRejectReason;
