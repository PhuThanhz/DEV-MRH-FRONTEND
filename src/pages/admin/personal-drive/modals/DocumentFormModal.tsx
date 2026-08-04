import React from "react";
import { Modal, Form, Input, Select, Radio, Space, Button } from "antd";
import type { UploadFile } from "antd";

interface DocumentFormModalProps {
    open: boolean;
    form: any;
    categories: any[];
    accountingCategories: any[];
    uploadedFiles: UploadFile[];
    onCancel: () => void;
    onSubmit: (values: any) => Promise<void>;
}

const DEFAULT_DOCUMENT_KIND = "NORMAL";

export const DocumentFormModal: React.FC<DocumentFormModalProps> = ({
    open,
    form,
    categories,
    accountingCategories,
    uploadedFiles,
    onCancel,
    onSubmit,
}) => {
    return (
        <Modal
            title="Khởi tạo hồ sơ tài liệu lưu trữ"
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
                    label="Mã tài liệu (Tự sinh)"
                    rules={[
                        { required: true, message: "Vui lòng nhập mã tài liệu" },
                        { whitespace: true, message: "Mã tài liệu không được chỉ chứa khoảng trắng" },
                        { pattern: /^[A-Z0-9_-]+$/i, message: "Mã tài liệu chỉ chứa chữ, số, dấu gạch ngang (-) và gạch dưới (_)" },
                    ]}
                >
                    <Input placeholder="Mã định danh duy nhất" maxLength={100} />
                </Form.Item>

                <Form.Item
                    name="documentKind"
                    label="Loại hồ sơ"
                    rules={[{ required: true, message: "Vui lòng chọn loại hồ sơ" }]}
                >
                    <Radio.Group
                        optionType="button"
                        buttonStyle="solid"
                        options={[
                            { label: "Tài liệu cá nhân", value: DEFAULT_DOCUMENT_KIND },
                            { label: "Chứng từ kế toán", value: "ACCOUNTING" },
                        ]}
                    />
                </Form.Item>

                <Form.Item noStyle shouldUpdate={(prev, cur) => prev.documentKind !== cur.documentKind}>
                    {({ getFieldValue }) => getFieldValue("documentKind") === "ACCOUNTING" ? (
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
                    ) : (
                        <Form.Item
                            name="categoryId"
                            label="Danh mục tài liệu"
                            rules={[{ required: true, message: "Vui lòng chọn danh mục tài liệu" }]}
                        >
                            <Select placeholder="Chọn danh mục tài liệu">
                                {categories.map((c) => (
                                    <Select.Option key={c.id} value={c.id}>
                                        [{c.categoryCode}] {c.categoryName}
                                    </Select.Option>
                                ))}
                            </Select>
                        </Form.Item>
                    )}
                </Form.Item>

                <Form.Item name="note" label="Ghi chú thêm">
                    <Input.TextArea rows={3} placeholder="Mô tả nội dung tài liệu..." maxLength={500} />
                </Form.Item>

                {uploadedFiles.length > 0 && (
                    <div style={{ padding: "8px 12px", background: "#f8fafc", border: "1px solid #cbd5e1", borderRadius: 6, marginBottom: 20 }}>
                        <span style={{ fontSize: 12, color: "#64748b" }}>File đã upload: </span>
                        <span style={{ fontWeight: 500, fontSize: 13 }}>{uploadedFiles[0].name}</span>
                    </div>
                )}

                <Form.Item style={{ textAlign: "right", marginBottom: 0 }}>
                    <Space>
                        <Button onClick={onCancel}>Huỷ</Button>
                        <Button type="primary" htmlType="submit">Xác nhận Lưu trữ</Button>
                    </Space>
                </Form.Item>
            </Form>
        </Modal>
    );
};

export default React.memo(DocumentFormModal);
