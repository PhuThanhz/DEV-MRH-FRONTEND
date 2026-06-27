import { useEffect, useMemo, useState } from "react";
import {
    Button,
    Col,
    Drawer,
    Form,
    Input,
    List,
    Modal,
    Popconfirm,
    Row,
    Select,
    Space,
    Switch,
    Table,
    Tag,
    Tooltip,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import {
    DeleteOutlined,
    EditOutlined,
    HistoryOutlined,
    PlusOutlined,
    ReloadOutlined,
    RollbackOutlined,
    SendOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import PageContainer from "@/components/common/data-table/PageContainer";
import Access from "@/components/share/access";
import {
    callAddDossierDocument,
    callCreateAccountingDossierCategory,
    callFetchAccountingDocumentCategoryActive,
    callFetchAccountingDossierCategories,
    callFetchAccountingDossierCategoryActive,
    callFetchCompany,
    callToggleAccountingDossierCategoryActive,
    callUpdateAccountingDossierCategory,
} from "@/config/api";
import { ALL_PERMISSIONS } from "@/config/permissions";
import { useDepartmentsByCompanyQuery } from "@/hooks/useDepartments";
import { useSectionsByDepartmentQuery } from "@/hooks/useSections";
import {
    useAccountingDossiersQuery,
    useCreateAccountingDossierMutation,
    useDeleteAccountingDossierMutation,
    useAccountingDossierLogsQuery,
    useRequestReturnAccountingDossierMutation,
    useUpdateAccountingDossierMutation,
    useSubmitAccountingDossierMutation,
} from "@/hooks/useAccountingDossiers";
import type {
    AccountingDossierCategoryMode,
    AccountingDossierStatus,
    IAccountingDossier,
    IAccountingDossierCategory,
    IAccountingDossierCategoryRequest,
    IAccountingDocumentCategory,
    IAccountingDossierRequest,
    ICompany,
} from "@/types/backend";
import DossierDocumentList from "./components/DossierDocumentList";

type DossierFormValues = {
    content: string;
    categoryMode: AccountingDossierCategoryMode;
    dossierCategoryId?: number;
    customCategoryName?: string;
    syncCategoryRequested?: boolean;
    companyId: number;
    departmentId: number;
    sectionId?: number;
    documents?: Array<{
        accountingCategoryId: number;
        documentName: string;
    }>;
};

const PAGE_SIZE_OPTIONS = [10, 20, 50];

const statusMeta: Record<AccountingDossierStatus, { label: string; color: string }> = {
    DRAFT: { label: "Nháp", color: "default" },
    SUBMITTED: { label: "Đã chuyển", color: "processing" },
    RETURN_REQUESTED: { label: "Yêu cầu hoàn", color: "warning" },
    RETURNED: { label: "Hoàn chứng từ", color: "orange" },
    APPROVED: { label: "Đã duyệt", color: "success" },
    REJECTED: { label: "Không duyệt", color: "error" },
    TERMINATED: { label: "Chấm dứt", color: "red" },
    IN_REVIEW: { label: "Đang duyệt", color: "processing" },
    ARCHIVED: { label: "Lưu trữ", color: "purple" },
};

const editableStatuses: AccountingDossierStatus[] = ["DRAFT", "RETURNED"];
const returnRequestableStatuses: AccountingDossierStatus[] = ["SUBMITTED", "IN_REVIEW", "RETURN_REQUESTED"];

const buildPayload = (values: DossierFormValues): IAccountingDossierRequest => ({
    content: values.content?.trim(),
    categoryMode: values.categoryMode,
    dossierCategoryId: values.categoryMode === "TEMPLATE" ? values.dossierCategoryId : undefined,
    customCategoryName:
        values.categoryMode === "UNSTRUCTURED"
            ? values.customCategoryName?.trim()
            : undefined,
    syncCategoryRequested:
        values.categoryMode === "UNSTRUCTURED"
            ? !!values.syncCategoryRequested
            : false,
    companyId: values.companyId,
    departmentId: values.departmentId,
    sectionId: values.sectionId,
});

const formatDateTime = (value?: string | null) => {
    if (!value) return "-";
    return dayjs(value).format("DD/MM/YYYY HH:mm");
};

const AccountingDossierModal = ({
    open,
    companies,
    initialValues,
    loading,
    onCancel,
    onSubmit,
}: {
    open: boolean;
    companies: ICompany[];
    initialValues?: IAccountingDossier | null;
    loading?: boolean;
    onCancel: () => void;
    onSubmit: (values: DossierFormValues) => void;
}) => {
    const [form] = Form.useForm<DossierFormValues>();
    const selectedCompanyId = Form.useWatch("companyId", form);
    const selectedDepartmentId = Form.useWatch("departmentId", form);
    const selectedCategoryMode = Form.useWatch("categoryMode", form);

    const { data: departments = [], isFetching: loadingDepartments } =
        useDepartmentsByCompanyQuery(selectedCompanyId);
    const { data: sections = [], isFetching: loadingSections } =
        useSectionsByDepartmentQuery(selectedDepartmentId);

    const [categories, setCategories] = useState<any[]>([]);
    const [dossierCategories, setDossierCategories] = useState<IAccountingDossierCategory[]>([]);
    const [loadingCats, setLoadingCats] = useState(false);
    const [loadingDossierCats, setLoadingDossierCats] = useState(false);

    useEffect(() => {
        if (!open) return;
        setLoadingCats(true);
        callFetchAccountingDocumentCategoryActive()
            .then((res) => setCategories((res as any)?.data || []))
            .catch(() => setCategories([]))
            .finally(() => setLoadingCats(false));
        setLoadingDossierCats(true);
        callFetchAccountingDossierCategoryActive()
            .then((res) => setDossierCategories((res as any)?.data || []))
            .catch(() => setDossierCategories([]))
            .finally(() => setLoadingDossierCats(false));
    }, [open]);

    useEffect(() => {
        if (!open) return;

        form.setFieldsValue({
            content: initialValues?.content || "",
            categoryMode: initialValues?.categoryMode || "TEMPLATE",
            dossierCategoryId: initialValues?.dossierCategory?.id,
            customCategoryName: initialValues?.customCategoryName || undefined,
            syncCategoryRequested: !!initialValues?.syncCategoryRequested,
            companyId: initialValues?.company?.id,
            departmentId: initialValues?.department?.id,
            sectionId: initialValues?.section?.id,
            documents: [], // always clear list when open
        });
    }, [form, initialValues, open]);

    const handleCancel = () => {
        form.resetFields();
        onCancel();
    };

    return (
        <Modal
            open={open}
            title={initialValues?.id ? "Cập nhật bộ chứng từ" : "Tạo bộ chứng từ"}
            width={900}
            centered
            destroyOnClose
            onCancel={handleCancel}
            footer={[
                <Button key="cancel" onClick={handleCancel}>
                    Hủy
                </Button>,
                <Button
                    key="submit"
                    type="primary"
                    loading={loading}
                    onClick={() => form.submit()}
                >
                    Lưu nháp
                </Button>,
            ]}
        >
            <Form
                form={form}
                layout="vertical"
                initialValues={{ categoryMode: "TEMPLATE", syncCategoryRequested: false }}
                onFinish={onSubmit}
                onValuesChange={(changed) => {
                    if ("companyId" in changed) {
                        form.setFieldsValue({ departmentId: undefined, sectionId: undefined });
                    }
                    if ("departmentId" in changed) {
                        form.setFieldsValue({ sectionId: undefined });
                    }
                    if (changed.categoryMode === "TEMPLATE") {
                        form.setFieldsValue({
                            dossierCategoryId: undefined,
                            customCategoryName: undefined,
                            syncCategoryRequested: false,
                            documents: [],
                        });
                    }
                    if (changed.categoryMode === "UNSTRUCTURED") {
                        form.setFieldsValue({ dossierCategoryId: undefined });
                    }
                }}
            >
                <Row gutter={[16, 0]}>
                    <Col xs={24} md={12}>
                        <Form.Item
                            label="Công ty"
                            name="companyId"
                            rules={[{ required: true, message: "Vui lòng chọn công ty" }]}
                        >
                            <Select
                                showSearch
                                placeholder="Chọn công ty"
                                optionFilterProp="label"
                                options={companies.map((company) => ({
                                    value: company.id,
                                    label: company.name,
                                }))}
                            />
                        </Form.Item>
                    </Col>
                    <Col xs={24} md={12}>
                        <Form.Item
                            label="Phòng ban"
                            name="departmentId"
                            rules={[{ required: true, message: "Vui lòng chọn phòng ban" }]}
                        >
                            <Select
                                showSearch
                                placeholder="Chọn phòng ban"
                                optionFilterProp="label"
                                loading={loadingDepartments}
                                disabled={!selectedCompanyId}
                                options={departments.map((department) => ({
                                    value: department.id,
                                    label: department.name,
                                }))}
                            />
                        </Form.Item>
                    </Col>
                    <Col xs={24} md={12}>
                        <Form.Item label="Bộ phận" name="sectionId">
                            <Select
                                allowClear
                                showSearch
                                placeholder="Chọn bộ phận"
                                optionFilterProp="label"
                                loading={loadingSections}
                                disabled={!selectedDepartmentId}
                                options={sections.map((section) => ({
                                    value: section.id,
                                    label: section.name,
                                }))}
                            />
                        </Form.Item>
                    </Col>
                    <Col xs={24} md={12}>
                        <Form.Item
                            label="Danh mục bộ chứng từ"
                            name="categoryMode"
                            rules={[{ required: true, message: "Vui lòng chọn danh mục" }]}
                        >
                            <Select
                                options={[
                                    { value: "TEMPLATE", label: "Theo mẫu" },
                                    { value: "UNSTRUCTURED", label: "Phi cấu trúc" },
                                ]}
                            />
                        </Form.Item>
                    </Col>
                    {selectedCategoryMode === "TEMPLATE" && (
                        <Col xs={24} md={12}>
                            <Form.Item
                                label="Mẫu bộ chứng từ"
                                name="dossierCategoryId"
                                rules={[{ required: true, message: "Vui lòng chọn mẫu bộ chứng từ" }]}
                            >
                                <Select
                                    showSearch
                                    loading={loadingDossierCats}
                                    placeholder="Chọn mẫu do admin/kế toán khai báo"
                                    optionFilterProp="label"
                                    options={dossierCategories.map((item) => ({
                                        value: item.id,
                                        label: `${item.categoryName}${item.version ? ` (v${item.version})` : ""}`,
                                    }))}
                                />
                            </Form.Item>
                        </Col>
                    )}
                    {selectedCategoryMode === "UNSTRUCTURED" && (
                        <>
                            <Col xs={24} md={16}>
                                <Form.Item
                                    label="Tên danh mục phi cấu trúc"
                                    name="customCategoryName"
                                    rules={[
                                        {
                                            required: true,
                                            message: "Vui lòng nhập tên danh mục",
                                        },
                                    ]}
                                >
                                    <Input placeholder="VD: Hồ sơ thanh toán phát sinh" />
                                </Form.Item>
                            </Col>
                            <Col xs={24} md={8}>
                                <Form.Item
                                    label="Đề xuất lưu thành mẫu"
                                    name="syncCategoryRequested"
                                    valuePropName="checked"
                                >
                                    <Switch />
                                </Form.Item>
                            </Col>
                        </>
                    )}
                    <Col span={24}>
                        <Form.Item
                            label="Nội dung"
                            name="content"
                            rules={[
                                { required: true, message: "Vui lòng nhập nội dung" },
                                { max: 1000, message: "Nội dung tối đa 1000 ký tự" },
                            ]}
                        >
                            <Input.TextArea
                                rows={2}
                                placeholder="Nhập nội dung bộ chứng từ"
                                showCount
                                maxLength={1000}
                            />
                        </Form.Item>
                    </Col>

                    {!initialValues?.id && selectedCategoryMode === "UNSTRUCTURED" && (
                        <Col span={24}>
                            <div className="font-semibold mb-2 mt-4 text-gray-700">Danh sách chứng từ phát sinh</div>
                            <Form.List name="documents">
                                {(fields, { add, remove }) => (
                                    <>
                                        {fields.map(({ key, name, ...restField }) => (
                                            <Row key={key} gutter={16} className="mb-2 items-start bg-gray-50 p-2 rounded">
                                                <Col span={8}>
                                                    <Form.Item
                                                        {...restField}
                                                        name={[name, 'accountingCategoryId']}
                                                        rules={[{ required: true, message: 'Chọn loại' }]}
                                                        className="mb-0"
                                                    >
                                                        <Select
                                                            placeholder="Loại chứng từ"
                                                            showSearch
                                                            optionFilterProp="label"
                                                            options={categories.map(c => ({ value: c.id, label: c.categoryName }))}
                                                        />
                                                    </Form.Item>
                                                </Col>
                                                <Col span={14}>
                                                    <Form.Item
                                                        {...restField}
                                                        name={[name, 'documentName']}
                                                        rules={[{ required: true, message: 'Nhập tên' }]}
                                                        className="mb-0"
                                                    >
                                                        <Input placeholder="Tên chứng từ (VD: Hóa đơn đỏ)" />
                                                    </Form.Item>
                                                </Col>
                                                <Col span={2} className="flex justify-center mt-1">
                                                    <Button danger type="text" icon={<DeleteOutlined />} onClick={() => remove(name)} />
                                                </Col>
                                            </Row>
                                        ))}
                                        <Form.Item className="mb-0 mt-2">
                                            <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                                                Thêm dòng chứng từ
                                            </Button>
                                        </Form.Item>
                                    </>
                                )}
                            </Form.List>
                        </Col>
                    )}
                    {initialValues?.id && (
                        <Col span={24}>
                            <div className="mt-4 rounded border border-gray-200 bg-gray-50 p-3">
                                <DossierDocumentList
                                    dossier={initialValues}
                                    editable={editableStatuses.includes(initialValues.status)}
                                />
                            </div>
                        </Col>
                    )}
                </Row>
            </Form>
        </Modal>
    );
};

type TemplateFormValues = {
    categoryCode?: string;
    categoryName: string;
    description?: string;
    scope: "GLOBAL" | "COMPANY";
    companyId?: number;
    active?: boolean;
    documentCategoryIds?: number[];
};

const DossierTemplateDrawer = ({
    open,
    companies,
    onClose,
}: {
    open: boolean;
    companies: ICompany[];
    onClose: () => void;
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
        form.setFieldsValue({ scope: "GLOBAL", active: true, documentCategoryIds: [] });
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
            documentCategoryIds: values.documentCategoryIds || [],
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
            render: (_, record) => <Tag color="blue">{record.documentCategories?.length || 0}</Tag>,
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
                    <Button size="small" icon={<EditOutlined />} onClick={() => openEdit(record)} />
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
                </Space>
            ),
        },
    ];

    return (
        <Drawer
            title="Mẫu bộ chứng từ"
            open={open}
            onClose={onClose}
            width={900}
            extra={<Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>Tạo mẫu</Button>}
        >
            <Table<IAccountingDossierCategory>
                rowKey={(record) => String(record.id)}
                loading={loading}
                dataSource={rows}
                columns={columns}
                size="small"
                scroll={{ x: 900 }}
                pagination={false}
            />

            <Modal
                open={modalOpen}
                title={editing ? "Cập nhật mẫu bộ chứng từ" : "Tạo mẫu bộ chứng từ"}
                okText="Lưu mẫu"
                cancelText="Hủy"
                onCancel={() => setModalOpen(false)}
                onOk={saveTemplate}
                width={720}
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
                            <Form.Item label="Danh sách loại chứng từ trong mẫu" name="documentCategoryIds">
                                <Select
                                    mode="multiple"
                                    showSearch
                                    optionFilterProp="label"
                                    placeholder="Chọn các loại chứng từ cần có trong mẫu"
                                    options={docCategories.map((item) => ({
                                        value: item.id,
                                        label: item.categoryName,
                                    }))}
                                />
                            </Form.Item>
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

const AccountingDossierPage = () => {
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [keyword, setKeyword] = useState("");
    const [modalOpen, setModalOpen] = useState(false);
    const [templateDrawerOpen, setTemplateDrawerOpen] = useState(false);
    const [editingDossier, setEditingDossier] = useState<IAccountingDossier | null>(null);
    const [logDossier, setLogDossier] = useState<IAccountingDossier | null>(null);
    const [companies, setCompanies] = useState<ICompany[]>([]);

    const query = useMemo(
        () => `page=${page}&size=${pageSize}&sort=createdAt,desc`,
        [page, pageSize]
    );

    const { data, isFetching, refetch } = useAccountingDossiersQuery(query);
    const createMutation = useCreateAccountingDossierMutation();
    const updateMutation = useUpdateAccountingDossierMutation();
    const deleteMutation = useDeleteAccountingDossierMutation();
    const submitMutation = useSubmitAccountingDossierMutation();
    const requestReturnMutation = useRequestReturnAccountingDossierMutation();
    const { data: logs = [], isFetching: loadingLogs } = useAccountingDossierLogsQuery(logDossier?.id);

    useEffect(() => {
        callFetchCompany("page=1&size=200&sort=name,asc")
            .then((res) => setCompanies((res as any)?.data?.result || []))
            .catch(() => setCompanies([]));
    }, []);

    const rows = useMemo(() => {
        const source = data?.result || [];
        const normalizedKeyword = keyword.trim().toLowerCase();
        if (!normalizedKeyword) return source;

        return source.filter((item) => {
            const searchText = [
                item.dossierCode,
                item.content,
                item.dossierCategory?.name,
                item.customCategoryName,
                item.company?.name,
                item.department?.name,
                item.section?.name,
            ]
                .filter(Boolean)
                .join(" ")
                .toLowerCase();

            return searchText.includes(normalizedKeyword);
        });
    }, [data?.result, keyword]);

    const handleOpenCreate = () => {
        setEditingDossier(null);
        setModalOpen(true);
    };

    const handleOpenEdit = (record: IAccountingDossier) => {
        setEditingDossier(record);
        setModalOpen(true);
    };

    const handleSubmit = async (values: DossierFormValues) => {
        const payload = buildPayload(values);

        if (editingDossier?.id) {
            updateMutation.mutate(
                { id: editingDossier.id, data: payload },
                { onSuccess: () => setModalOpen(false) }
            );
            return;
        }

        createMutation.mutate(payload, {
            onSuccess: async (res) => {
                const newId = res?.data?.id;
                if (newId && values.categoryMode === "UNSTRUCTURED" && values.documents && values.documents.length > 0) {
                    try {
                        await Promise.all(values.documents.map(doc =>
                            callAddDossierDocument(newId, {
                                accountingCategoryId: doc.accountingCategoryId,
                                documentName: doc.documentName,
                            })
                        ));
                    } catch (e) {
                        // ignore if some fail, user can retry inside
                    }
                }
                setModalOpen(false);
                refetch();
            }
        });
    };

    const columns: ColumnsType<IAccountingDossier> = [
        {
            title: "Mã bộ",
            dataIndex: "dossierCode",
            width: 160,
            render: (value?: string | null) =>
                value ? <span className="font-medium">{value}</span> : <Tag>Chưa cấp mã</Tag>,
        },
        {
            title: "Nội dung",
            dataIndex: "content",
            width: 280,
            render: (value: string) => (
                <Tooltip title={value}>
                    <span className="line-clamp-2">{value}</span>
                </Tooltip>
            ),
        },
        {
            title: "Danh mục",
            width: 180,
            render: (_, record) =>
                record.categoryMode === "UNSTRUCTURED"
                    ? record.customCategoryName || "Phi cấu trúc"
                    : (
                        <Space direction="vertical" size={0}>
                            <span>{record.dossierCategory?.name || "Theo mẫu"}</span>
                            {record.dossierCategoryVersion && (
                                <span className="text-xs text-gray-500">v{record.dossierCategoryVersion}</span>
                            )}
                        </Space>
                    ),
        },
        {
            title: "Đơn vị",
            width: 220,
            render: (_, record) => (
                <Space direction="vertical" size={0}>
                    <span>{record.company?.name || "-"}</span>
                    <span className="text-xs text-gray-500">{record.department?.name || "-"}</span>
                </Space>
            ),
        },
        {
            title: "Trạng thái",
            dataIndex: "status",
            width: 140,
            render: (status: AccountingDossierStatus) => {
                const meta = statusMeta[status] || { label: status, color: "default" };
                return <Tag color={meta.color}>{meta.label}</Tag>;
            },
        },
        {
            title: "Lưu trữ",
            width: 140,
            render: (_, record) =>
                record.storageStatus === "EXPIRED" ? (
                    <Tag color="red">Hết hạn</Tag>
                ) : (
                    <Tag color="green">Trong hạn</Tag>
                ),
        },
        {
            title: "Ngày tạo",
            dataIndex: "createdAt",
            width: 160,
            render: formatDateTime,
        },
        {
            title: "Thao tác",
            key: "actions",
            fixed: "right",
            width: 220,
            render: (_, record) => {
                const canEdit = editableStatuses.includes(record.status);
                const canRequestReturn = returnRequestableStatuses.includes(record.status);

                return (
                    <Space size={4}>
                        <Access
                            permission={ALL_PERMISSIONS.ACCOUNTING_DOSSIERS.UPDATE}
                            hideChildren
                        >
                            <Popconfirm
                                title="Chuyển chứng từ và cấp mã hệ thống?"
                                okText="Chuyển chứng từ"
                                cancelText="Hủy"
                                disabled={!canEdit}
                                onConfirm={() => record.id && submitMutation.mutate(record.id)}
                            >
                                <Tooltip title={canEdit ? "Chuyển chứng từ" : "Đã chuyển"}>
                                    <Button
                                        type="primary"
                                        ghost
                                        size="small"
                                        icon={<SendOutlined />}
                                        disabled={!canEdit}
                                        loading={submitMutation.isPending && submitMutation.variables === record.id}
                                    />
                                </Tooltip>
                            </Popconfirm>
                        </Access>
                        <Access
                            permission={ALL_PERMISSIONS.ACCOUNTING_DOSSIERS.UPDATE}
                            hideChildren
                        >
                            <Tooltip title="Nhật ký">
                                <Button
                                    size="small"
                                    icon={<HistoryOutlined />}
                                    onClick={() => setLogDossier(record)}
                                />
                            </Tooltip>
                        </Access>
                        <Access
                            permission={ALL_PERMISSIONS.ACCOUNTING_DOSSIERS.UPDATE}
                            hideChildren
                        >
                            <Tooltip title={canRequestReturn ? "Yêu cầu hoàn chứng từ" : "Chỉ yêu cầu hoàn khi đã chuyển"}>
                                <Button
                                    size="small"
                                    icon={<RollbackOutlined />}
                                    disabled={!canRequestReturn}
                                    loading={requestReturnMutation.isPending && requestReturnMutation.variables?.id === record.id}
                                    onClick={() => {
                                        let note = "";
                                        Modal.confirm({
                                            title: "Yêu cầu hoàn chứng từ",
                                            content: (
                                                <Input.TextArea
                                                    rows={3}
                                                    placeholder="Nhập lý do yêu cầu hoàn chứng từ"
                                                    onChange={(event) => {
                                                        note = event.target.value;
                                                    }}
                                                />
                                            ),
                                            okText: "Gửi yêu cầu",
                                            cancelText: "Hủy",
                                            onOk: () => record.id && requestReturnMutation.mutate({ id: record.id, note }),
                                        });
                                    }}
                                />
                            </Tooltip>
                        </Access>
                        <Access
                            permission={ALL_PERMISSIONS.ACCOUNTING_DOSSIERS.UPDATE}
                            hideChildren
                        >
                            <Tooltip title={canEdit ? "Sửa" : "Chỉ sửa khi nháp/hoàn"}>
                                <Button
                                    size="small"
                                    icon={<EditOutlined />}
                                    disabled={!canEdit}
                                    onClick={() => handleOpenEdit(record)}
                                />
                            </Tooltip>
                        </Access>
                        <Access
                            permission={ALL_PERMISSIONS.ACCOUNTING_DOSSIERS.DELETE}
                            hideChildren
                        >
                            <Popconfirm
                                title="Xoá cứng bộ chứng từ này?"
                                okText="Xoá"
                                cancelText="Hủy"
                                okButtonProps={{ danger: true }}
                                disabled={!canEdit}
                                onConfirm={() => record.id && deleteMutation.mutate(record.id)}
                            >
                                <Tooltip title={canEdit ? "Xoá cứng" : "Chỉ xoá khi nháp/hoàn"}>
                                    <Button
                                        danger
                                        size="small"
                                        icon={<DeleteOutlined />}
                                        disabled={!canEdit}
                                    />
                                </Tooltip>
                            </Popconfirm>
                        </Access>
                    </Space>
                );
            },
        },
    ];

    const filter = (
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <Space wrap>
                <Input.Search
                    allowClear
                    placeholder="Tìm mã, nội dung, đơn vị"
                    style={{ width: 280, maxWidth: "100%" }}
                    onSearch={setKeyword}
                    onChange={(event) => setKeyword(event.target.value)}
                />
                <Button icon={<ReloadOutlined />} onClick={() => refetch()}>
                    Tải lại
                </Button>
            </Space>
            <Access permission={ALL_PERMISSIONS.ACCOUNTING_DOSSIERS.CREATE} hideChildren>
                <Space wrap>
                    <Button onClick={() => setTemplateDrawerOpen(true)}>
                        Mẫu bộ chứng từ
                    </Button>
                    <Button type="primary" icon={<PlusOutlined />} onClick={handleOpenCreate}>
                        Tạo bộ chứng từ
                    </Button>
                </Space>
            </Access>
        </div>
    );

    return (
        <PageContainer title="Bộ chứng từ kế toán" filter={filter}>
            <Table<IAccountingDossier>
                rowKey={(record) => String(record.id)}
                columns={columns}
                dataSource={rows}
                loading={isFetching || deleteMutation.isPending}
                scroll={{ x: 1280 }}
                expandable={{
                    expandedRowRender: (record) => (
                        <div className="px-4 py-2 bg-gray-50 rounded">
                            <DossierDocumentList
                                dossier={record}
                                editable={editableStatuses.includes(record.status)}
                            />
                        </div>
                    ),
                    rowExpandable: () => true,
                }}
                pagination={{
                    current: data?.meta?.page || page,
                    pageSize: data?.meta?.pageSize || pageSize,
                    total: data?.meta?.total || 0,
                    showSizeChanger: true,
                    pageSizeOptions: PAGE_SIZE_OPTIONS.map(String),
                    onChange: (nextPage, nextPageSize) => {
                        setPage(nextPage);
                        setPageSize(nextPageSize);
                    },
                    showTotal: (total) => `${total} bộ chứng từ`,
                }}
            />

            <AccountingDossierModal
                open={modalOpen}
                companies={companies}
                initialValues={editingDossier}
                loading={createMutation.isPending || updateMutation.isPending}
                onCancel={() => setModalOpen(false)}
                onSubmit={handleSubmit}
            />

            <DossierTemplateDrawer
                open={templateDrawerOpen}
                companies={companies}
                onClose={() => setTemplateDrawerOpen(false)}
            />

            <Drawer
                title={`Nhật ký bộ chứng từ ${logDossier?.dossierCode || "chưa cấp mã"}`}
                open={!!logDossier}
                onClose={() => setLogDossier(null)}
                width={520}
            >
                <List
                    loading={loadingLogs}
                    dataSource={logs}
                    locale={{ emptyText: "Chưa có nhật ký" }}
                    renderItem={(item) => (
                        <List.Item>
                            <List.Item.Meta
                                title={
                                    <Space>
                                        <Tag color="blue">{item.actionType}</Tag>
                                        <span>{formatDateTime(item.createdAt)}</span>
                                    </Space>
                                }
                                description={
                                    <Space direction="vertical" size={2}>
                                        <span>{item.note || "-"}</span>
                                        <span className="text-xs text-gray-500">
                                            User: {item.createdBy || "-"} • IP: {item.ipAddress || "-"}
                                        </span>
                                    </Space>
                                }
                            />
                        </List.Item>
                    )}
                />
            </Drawer>
        </PageContainer>
    );
};

export default AccountingDossierPage;
