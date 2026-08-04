import React, { useEffect } from "react";
import { Modal, Form, Input, Space, Button } from "antd";
import type { IDocumentFolder } from "@/types/backend";

interface FolderModalProps {
    open: boolean;
    editingFolder: IDocumentFolder | null;
    parentFolderId: number | null;
    onCancel: () => void;
    onSubmit: (values: { folderName: string }) => Promise<void>;
}

export const FolderModal: React.FC<FolderModalProps> = ({
    open,
    editingFolder,
    onCancel,
    onSubmit,
}) => {
    const [form] = Form.useForm();

    useEffect(() => {
        if (open) {
            form.setFieldsValue({
                folderName: editingFolder ? editingFolder.folderName : "",
            });
        }
    }, [open, editingFolder, form]);

    return (
        <Modal
            title={editingFolder ? "Đổi tên thư mục" : "Tạo thư mục mới"}
            open={open}
            onCancel={onCancel}
            footer={null}
            destroyOnHidden
        >
            <Form
                form={form}
                layout="vertical"
                onFinish={onSubmit}
                style={{ marginTop: 12 }}
            >
                <Form.Item
                    name="folderName"
                    label="Tên thư mục"
                    rules={[
                        { required: true, message: "Vui lòng nhập tên thư mục" },
                        { whitespace: true, message: "Tên thư mục không được chỉ chứa khoảng trắng" },
                    ]}
                >
                    <Input placeholder="Nhập tên thư mục" maxLength={100} autoFocus />
                </Form.Item>
                <Form.Item style={{ textAlign: "right", marginBottom: 0 }}>
                    <Space>
                        <Button onClick={onCancel}>Huỷ</Button>
                        <Button type="primary" htmlType="submit">Lưu lại</Button>
                    </Space>
                </Form.Item>
            </Form>
        </Modal>
    );
};

export default React.memo(FolderModal);
