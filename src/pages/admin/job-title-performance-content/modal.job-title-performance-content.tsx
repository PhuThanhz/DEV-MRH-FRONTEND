// src/pages/admin/company/company-job-title/job-title-performance-content/modal.job-title-performance-content.tsx

import { Modal, Form, Input, Select } from "antd";

interface Props {
    open: boolean;
    onClose: () => void;
    onSubmit: (values: any) => void;
    loading?: boolean;
    initialValues?: any;
    salaryGrades: { id: number; gradeLevel: number }[];
}

const ModalJobTitlePerformanceContent = ({
    open,
    onClose,
    onSubmit,
    loading = false,
    initialValues,
    salaryGrades,
}: Props) => {
    const [form] = Form.useForm();

    return (
        <Modal
            title={initialValues ? "Cập nhật nội dung đánh giá" : "Thêm nội dung đánh giá"}
            open={open}
            onCancel={onClose}
            onOk={() => form.submit()}
            confirmLoading={loading}
            okText={initialValues ? "Cập nhật" : "Tạo mới"}
        >
            <Form
                form={form}
                layout="vertical"
                initialValues={initialValues}
                onFinish={onSubmit}
            >
                {/* BẬC LƯƠNG */}
                <Form.Item
                    name="salaryGradeId"
                    label="Bậc lương"
                    rules={[{ required: true, message: "Vui lòng chọn bậc lương" }]}
                >
                    <Select placeholder="Chọn bậc lương">
                        {salaryGrades.map((g) => (
                            <Select.Option key={g.id} value={g.id}>
                                Bậc {g.gradeLevel}
                            </Select.Option>
                        ))}
                    </Select>
                </Form.Item>

                <Form.Item name="contentA" label="Nội dung A">
                    <Input.TextArea rows={3} />
                </Form.Item>

                <Form.Item name="contentB" label="Nội dung B">
                    <Input.TextArea rows={3} />
                </Form.Item>

                <Form.Item name="contentC" label="Nội dung C">
                    <Input.TextArea rows={3} />
                </Form.Item>

                <Form.Item name="contentD" label="Nội dung D">
                    <Input.TextArea rows={3} />
                </Form.Item>
            </Form>
        </Modal>
    );
};

export default ModalJobTitlePerformanceContent;
