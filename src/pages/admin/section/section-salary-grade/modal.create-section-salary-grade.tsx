// src/pages/admin/section/section-salary-grade/modal.create-section-salary-grade.tsx

import { Modal, Form, InputNumber, Typography } from "antd";
const { Text } = Typography;

interface Props {
    open: boolean;
    onClose: () => void;
    initialGrade: number;
    isCreating: boolean;
    onFinish: (values: { gradeLevel: number }) => void;
}

const ModalCreateSectionSalaryGrade = ({
    open,
    onClose,
    initialGrade,
    isCreating,
    onFinish,
}: Props) => {
    const [form] = Form.useForm();

    return (
        <Modal
            title="Thêm bậc lương mới"
            open={open}
            onCancel={onClose}
            onOk={() => form.submit()}
            confirmLoading={isCreating}
            okText="Tạo"
            cancelText="Hủy"
        >
            <Form form={form} layout="vertical" onFinish={onFinish}>
                <Form.Item
                    name="gradeLevel"
                    label="Bậc lương"
                    initialValue={initialGrade}
                    rules={[{ required: true, message: "Vui lòng nhập bậc lương" }]}
                >
                    <InputNumber min={1} style={{ width: "100%" }} />
                </Form.Item>

                <Text type="secondary">Gợi ý: Bậc {initialGrade}</Text>
            </Form>
        </Modal>
    );
};

export default ModalCreateSectionSalaryGrade;
