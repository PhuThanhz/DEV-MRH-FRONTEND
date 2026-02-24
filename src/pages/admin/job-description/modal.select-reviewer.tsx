import { Modal, Select, Form, Button } from "antd";
import { useState } from "react";

export interface Reviewer {
    name: string;
    title: string;
}

const reviewersMock: Reviewer[] = [
    { name: "Nguyễn Văn A", title: "Trưởng phòng Hành chính - Nhân sự" },
    { name: "Lê Thị B", title: "Giám đốc Nhân sự" },
    { name: "CEO", title: "Tổng Giám đốc" },
];

interface Props {
    open: boolean;
    onCancel: () => void;
    onSubmit: (reviewer: Reviewer) => void;
}

const ModalSelectReviewer = ({ open, onCancel, onSubmit }: Props) => {
    const [form] = Form.useForm();

    return (
        <Modal
            open={open}
            title="Chọn người duyệt"
            onCancel={() => {
                form.resetFields();
                onCancel();
            }}
            footer={null}
            destroyOnClose
        >
            <Form
                form={form}
                layout="vertical"
                onFinish={(values) => {
                    const reviewer = reviewersMock.find(
                        (x) => x.name === values.reviewer
                    );
                    if (reviewer) onSubmit(reviewer);
                    form.resetFields();
                }}
            >
                <Form.Item
                    label="Người duyệt"
                    name="reviewer"
                    rules={[{ required: true, message: "Vui lòng chọn người duyệt!" }]}
                >
                    <Select placeholder="Chọn người duyệt">
                        {reviewersMock.map((r) => (
                            <Select.Option key={r.name} value={r.name}>
                                {r.name} — {r.title}
                            </Select.Option>
                        ))}
                    </Select>
                </Form.Item>

                <div style={{ textAlign: "right" }}>
                    <Button onClick={onCancel}>Hủy</Button>
                    <Button type="primary" htmlType="submit" style={{ marginLeft: 8 }}>
                        Gửi duyệt
                    </Button>
                </div>
            </Form>
        </Modal>
    );
};

export default ModalSelectReviewer;
