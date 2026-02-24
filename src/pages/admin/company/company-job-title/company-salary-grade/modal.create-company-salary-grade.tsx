// src/pages/admin/company/company-job-title/company-salary-grade/modal.create-company-salary-grade.tsx

import { Modal, Form, InputNumber, Typography } from "antd";
const { Text } = Typography;

interface Props {
    open: boolean;
    onClose: () => void;
    onSubmit: (values: { gradeLevel: number }) => void;
    loading?: boolean;
    initialGrade?: number;
}

const ModalCreateCompanySalaryGrade = ({
    open,
    onClose,
    onSubmit,
    loading = false,
    initialGrade = 1,
}: Props) => {
    const [form] = Form.useForm();

    return (
        <Modal
            title="Thêm bậc lương mới"
            open={open}
            onCancel={onClose}
            onOk={() => form.submit()}
            confirmLoading={loading}
            okText="Tạo mới"
        >
            <Form
                form={form}
                layout="vertical"
                initialValues={{ gradeLevel: initialGrade }}
                onFinish={(values) => onSubmit(values)}
            >
                <Form.Item
                    name="gradeLevel"
                    label="Bậc lương"
                    rules={[
                        { required: true, message: "Vui lòng nhập bậc lương" },
                        { type: "number", min: 1, message: "Bậc lương phải ≥ 1" },
                    ]}
                >
                    <InputNumber style={{ width: "100%" }} min={1} />
                </Form.Item>

                <Text type="secondary">
                    Gợi ý hệ thống: <b>{initialGrade}</b>
                </Text>
            </Form>
        </Modal>
    );
};

export default ModalCreateCompanySalaryGrade;
