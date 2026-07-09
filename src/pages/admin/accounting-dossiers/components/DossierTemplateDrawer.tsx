import React, { useEffect, useState } from "react";
import {
    Button,
    Col,
    Drawer,
    Form,
    Input,
    Row,
    Select,
    Space,
    Switch,
    message,
    Typography,
    Divider,
    Checkbox,
    Tag,
    Table,
    Modal
} from "antd";
import type { ColumnsType } from "antd/es/table";
import {
    DeleteOutlined,
    PlusOutlined,
    EditOutlined
} from "@ant-design/icons";
import type {
    AccountingDossierCategoryMode,
    IAccountingDossierCategory,
    IAccountingDocumentCategory,
    ICompany,
    IAccountingDossierCategoryRequest
} from "@/types/backend";
import {
    callCreateAccountingDossierCategory,
    callFetchAccountingDocumentCategoryActive,
    callUpdateAccountingDossierCategory,
    callFetchAccountingDossierCategories,
    callToggleAccountingDossierCategoryActive
} from "@/config/api";
import { getModalWidth, MODAL_BODY_SCROLL } from "@/utils/responsive";
import { useDepartmentsByCompanyQuery } from "@/hooks/useDepartments";
import { type TemplateFormValues } from "../dossierUtils";

const DossierTemplateDrawer = ({
    open,
    companies,
    onClose,
    canCreate = false,
    canUpdate = false,
    canToggleActive = false,
}: {
    open: boolean;
    companies: ICompany[];
    onClose: () => void;
    canCreate?: boolean;
    canUpdate?: boolean;
    canToggleActive?: boolean;
}) => {
    const [form] = Form.useForm<TemplateFormValues>();
    const [rows, setRows] = useState<IAccountingDossierCategory[]>([]);
    const [docCategories, setDocCategories] = useState<IAccountingDocumentCategory[]>([]);
    const [loading, setLoading] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing] = useState<IAccountingDossierCategory | null>(null);
    const scope = Form.useWatch("scope", form);

    const loadData = async () => {
        setLoading(true);
        try {
            const [templateRes, docCatRes] = await Promise.all([
                callFetchAccountingDossierCategories("page=1&size=200&sort=categoryName,asc"),
                callFetchAccountingDocumentCategoryActive(),
            ]);
            setRows((templateRes as any)?.data?.result || []);
            setDocCategories((docCatRes as any)?.data || []);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (open) loadData();
    }, [open]);

    const openCreate = () => {
        setEditing(null);
        form.setFieldsValue({ scope: "GLOBAL", active: true, documentCategoryIds: [], documentCategoryItems: [] });
        setModalOpen(true);
    };

    const openEdit = (record: IAccountingDossierCategory) => {
        setEditing(record);
        form.setFieldsValue({
            categoryCode: record.categoryCode,
            categoryName: record.categoryName,
            description: record.description,
            scope: (record.scope as "GLOBAL" | "COMPANY") || "GLOBAL",
            companyId: record.companyId || undefined,
            active: record.active,
            documentCategoryIds: record.documentCategories?.map((item) => item.id) || [],
            documentCategoryItems: record.documentCategories?.map((item: any) => ({
                documentCategoryId: item.id,
                required: item.required ?? true,
            })) || [],
        });
        setModalOpen(true);
    };

    const saveTemplate = async () => {
        const values = await form.validateFields();
        const payload: IAccountingDossierCategoryRequest = {
            categoryCode: values.categoryCode?.trim(),
            categoryName: values.categoryName.trim(),
            description: values.description?.trim(),
            scope: values.scope,
            companyId: values.scope === "COMPANY" ? values.companyId : null,
            active: values.active ?? true,
            documentCategoryItems: values.documentCategoryItems?.map((item, index) => ({
                documentCategoryId: item.documentCategoryId,
                required: item.required ?? true,
                sortOrder: index,
            })) || [],
        };
        if (editing?.id) {
            await callUpdateAccountingDossierCategory(editing.id, payload);
        } else {
            await callCreateAccountingDossierCategory(payload);
        }
        setModalOpen(false);
        await loadData();
    };

    const columns: ColumnsType<IAccountingDossierCategory> = [
        {
            title: "Mã mẫu",
            dataIndex: "categoryCode",
            width: 130,
        },
        {
            title: "Tên mẫu",
            dataIndex: "categoryName",
            render: (value, record) => (
                <Space direction="vertical" size={0}>
                    <span className="font-medium">{value}</span>
                    <span className="text-xs text-gray-500">{record.description || "-"}</span>
                </Space>
            ),
        },
        {
            title: "Phạm vi",
            width: 110,
            render: (_, record) => record.scope === "COMPANY" ? "Công ty" : "Toàn hệ thống",
        },
        {
            title: "Loại CT",
            width: 90,
            render: (_, record) => {
                const total = record.documentCategories?.length || 0;
                const required = record.documentCategories?.filter((item: any) => item.required !== false).length || 0;
                return <Tag color="blue">{required}/{total}</Tag>;
            },
        },
        {
            title: "Version",
            dataIndex: "version",
            width: 90,
            render: (value) => `v${value || 1}`,
        },
        {
            title: "Trạng thái",
            dataIndex: "active",
            width: 110,
            render: (active) => active ? <Tag color="green">Đang dùng</Tag> : <Tag>Ngưng</Tag>,
        },
        {
            title: "Thao tác",
            fixed: "right",
            width: 130,
            render: (_, record) => (
                <Space size={4}>
                    {canUpdate && <Button size="small" icon={<EditOutlined />} onClick={() => openEdit(record)} />}
                    {canToggleActive && (
                        <Button
                            size="small"
                            onClick={async () => {
                                if (!record.id) return;
                                await callToggleAccountingDossierCategoryActive(record.id, !record.active);
                                await loadData();
                            }}
                        >
                            {record.active ? "Ngưng" : "Bật"}
                        </Button>
                    )}
                </Space>
            ),
        },
    ];

    return (
        <Drawer
            title="Mẫu bộ chứng từ"
            open={open}
            onClose={onClose}
            width={getModalWidth(900)}
            extra={canCreate ? <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>Tạo mẫu</Button> : null}
        >
            <Table<IAccountingDossierCategory>
                rowKey={(record) => String(record.id)}
                loading={loading}
                dataSource={rows}
                columns={columns}
                size="small"
                scroll={{ x: 1550 }}
                pagination={false}
            />

            <Modal
                open={modalOpen}
                title={editing ? "Cập nhật mẫu bộ chứng từ" : "Tạo mẫu bộ chứng từ"}
                okText="Lưu mẫu"
                cancelText="Hủy"
                onCancel={() => setModalOpen(false)}
                onOk={saveTemplate}
                width={getModalWidth(720)}
                styles={{ body: MODAL_BODY_SCROLL }}
                destroyOnClose
            >
                <Form form={form} layout="vertical" className="mt-4" initialValues={{ scope: "GLOBAL", active: true }}>
                    <Row gutter={16}>
                        <Col xs={24} md={8}>
                            <Form.Item label="Mã mẫu" name="categoryCode">
                                <Input placeholder="Tự sinh nếu bỏ trống" />
                            </Form.Item>
                        </Col>
                        <Col xs={24} md={16}>
                            <Form.Item
                                label="Tên mẫu"
                                name="categoryName"
                                rules={[{ required: true, message: "Nhập tên mẫu" }]}
                            >
                                <Input placeholder="VD: Bộ chứng từ thanh toán nhà cung cấp" />
                            </Form.Item>
                        </Col>
                        <Col xs={24} md={12}>
                            <Form.Item label="Phạm vi" name="scope" rules={[{ required: true }]}>
                                <Select
                                    options={[
                                        { value: "GLOBAL", label: "Toàn hệ thống" },
                                        { value: "COMPANY", label: "Theo công ty" },
                                    ]}
                                />
                            </Form.Item>
                        </Col>
                        {scope === "COMPANY" && (
                            <Col xs={24} md={12}>
                                <Form.Item
                                    label="Công ty áp dụng"
                                    name="companyId"
                                    rules={[{ required: true, message: "Chọn công ty áp dụng" }]}
                                >
                                    <Select
                                        showSearch
                                        optionFilterProp="label"
                                        options={companies.map((company) => ({
                                            value: company.id,
                                            label: company.name,
                                        }))}
                                    />
                                </Form.Item>
                            </Col>
                        )}
                        <Col xs={24}>
                            <div className="mb-2 font-medium">Danh sách loại chứng từ trong mẫu</div>
                            <Form.List name="documentCategoryItems">
                                {(fields, { add, remove }) => (
                                    <Space direction="vertical" className="w-full" size={8}>
                                        {fields.map(({ key, name, ...restField }) => (
                                            <Row key={key} gutter={12} className="items-start rounded bg-gray-50 p-2">
                                                <Col xs={24} md={15}>
                                                    <Form.Item
                                                        {...restField}
                                                        name={[name, "documentCategoryId"]}
                                                        rules={[{ required: true, message: "Chọn loại chứng từ" }]}
                                                        className="mb-0"
                                                    >
                                                        <Select
                                                            showSearch
                                                            optionFilterProp="label"
                                                            placeholder="Chọn loại chứng từ"
                                                            options={docCategories.map((item) => ({
                                                                value: item.id,
                                                                label: item.categoryName,
                                                            }))}
                                                        />
                                                    </Form.Item>
                                                </Col>
                                                <Col xs={16} md={6}>
                                                    <Form.Item
                                                        {...restField}
                                                        name={[name, "required"]}
                                                        valuePropName="checked"
                                                        className="mb-0"
                                                        initialValue
                                                    >
                                                        <Switch checkedChildren="Bắt buộc" unCheckedChildren="Tùy chọn" />
                                                    </Form.Item>
                                                </Col>
                                                <Col xs={8} md={3} className="text-right">
                                                    <Button danger type="text" icon={<DeleteOutlined />} onClick={() => remove(name)} />
                                                </Col>
                                            </Row>
                                        ))}
                                        <Button
                                            type="dashed"
                                            block
                                            icon={<PlusOutlined />}
                                            onClick={() => add({ required: true })}
                                        >
                                            Thêm loại chứng từ
                                        </Button>
                                    </Space>
                                )}
                            </Form.List>
                        </Col>
                        <Col xs={24}>
                            <Form.Item label="Mô tả" name="description">
                                <Input.TextArea rows={2} />
                            </Form.Item>
                        </Col>
                        <Col xs={24}>
                            <Form.Item label="Đang sử dụng" name="active" valuePropName="checked">
                                <Switch />
                            </Form.Item>
                        </Col>
                    </Row>
                </Form>
            </Modal>
        </Drawer>
    );
};

export default DossierTemplateDrawer;
