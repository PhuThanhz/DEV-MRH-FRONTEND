import React, { useEffect } from "react";
import { Modal, Form, Input, Select, Tag, Space, Button } from "antd";
import { EditOutlined } from "@ant-design/icons";
import type { IDocument } from "@/types/backend";

interface DocumentEditModalProps {
    open: boolean;
    editingDoc: IDocument | null;
    categories: any[];
    accountingCategories: any[];
    onCancel: () => void;
    onSubmit: (values: any) => Promise<void>;
}

const ACCOUNTING_DOC_CATEGORY_CODE = "ACCOUNTING_DOC";

export const DocumentEditModal: React.FC<DocumentEditModalProps> = ({
    open,
    editingDoc,
    categories,
    accountingCategories,
    onCancel,
    onSubmit,
}) => {
    const [form] = Form.useForm();

    useEffect(() => {
        if (open && editingDoc) {
            form.setFieldsValue({
                documentName: editingDoc.documentName,
                documentCode: editingDoc.documentCode,
                categoryId: editingDoc.category?.id,
                accountingCategoryId: editingDoc.accountingCategory?.id,
                note: editingDoc.note,
            });
        }
    }, [open, editingDoc, form]);

    const isAccountingDoc = editingDoc?.category?.categoryCode === ACCOUNTING_DOC_CATEGORY_CODE;

    return (
        <Modal
            title={
                <Space>
                    <EditOutlined style={{ color: "#d97706" }} />
                    <span>Chỉnh sửa hồ sơ tài liệu</span>
                </Space>
            }
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
                    name="documentName"
                    label="Tên tài liệu"
                    rules={[
                        { required: true, message: "Vui lòng nhập tên tài liệu" },
                        { whitespace: true, message: "Tên tài liệu không được chỉ chứa khoảng trắng" },
                    ]}
                >
                    <Input placeholder="Tên hiển thị của tài liệu" maxLength={250} />
                </Form.Item>

                <Form.Item
                    name="documentCode"
                    label="Mã tài liệu"
                    rules={[
                        { required: true, message: "Vui lòng nhập mã tài liệu" },
                        { whitespace: true, message: "Mã tài liệu không được chỉ chứa khoảng trắng" },
                        { pattern: /^[A-Z0-9_-]+$/i, message: "Mã tài liệu chỉ chứa chữ, số, dấu gạch ngang (-) và gạch dưới (_)" },
                    ]}
                >
                    <Input placeholder="Mã định danh duy nhất" maxLength={100} />
                </Form.Item>

                {isAccountingDoc ? (
                    <>
                        <Form.Item label="Nhóm hồ sơ">
                            <Tag style={{ backgroundColor: "#fff0f6", color: "#c41d7f", border: "1px solid #ffadd2", borderRadius: 6, margin: 0 }}>
                                Chứng từ kế toán
                            </Tag>
                        </Form.Item>
                        <Form.Item
                            name="accountingCategoryId"
                            label="Loại chứng từ kế toán"
                            rules={[{ required: true, message: "Vui lòng chọn loại chứng từ kế toán" }]}
                        >
                            <Select placeholder="Chọn loại chứng từ kế toán">
                                {accountingCategories.map((c) => (
                                    <Select.Option key={c.id} value={c.id}>
                                        {c.symbol ? `[${c.symbol}] ` : ""}{c.categoryName}
                                    </Select.Option>
                                ))}
                            </Select>
                        </Form.Item>
                    </>
                ) : (
                    <Form.Item
                        name="categoryId"
                        label="Danh mục phân loại"
                        rules={[{ required: true, message: "Vui lòng chọn danh mục phân loại" }]}
                    >
                        <Select placeholder="Chọn danh mục loại tài liệu">
                            {categories.map((c) => (
                                <Select.Option key={c.id} value={c.id}>
                                    [{c.categoryCode}] {c.categoryName}
                                </Select.Option>
                            ))}
                        </Select>
                    </Form.Item>
                )}

                <Form.Item name="note" label="Ghi chú thêm">
                    <Input.TextArea rows={3} placeholder="Mô tả nội dung tài liệu..." maxLength={500} />
                </Form.Item>

                <Form.Item style={{ textAlign: "right", marginBottom: 0 }}>
                    <Space>
                        <Button onClick={onCancel}>Huỷ</Button>
                        <Button type="primary" htmlType="submit">Cập nhật</Button>
                    </Space>
                </Form.Item>
            </Form>
        </Modal>
    );
};

export default React.memo(DocumentEditModal);
