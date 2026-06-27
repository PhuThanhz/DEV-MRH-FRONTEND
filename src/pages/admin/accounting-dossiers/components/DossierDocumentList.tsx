import React, { useState } from "react";
import {
    Button,
    Form,
    Input,
    Modal,
    Popconfirm,
    Select,
    Space,
    Table,
    Tag,
    Tooltip,
    Typography,
} from "antd";
import { DeleteOutlined, EditOutlined, PlusOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import type { IAccountingDossier, IAccountingDossierDocument, IAccountingDocumentCategory } from "@/types/backend";
import {
    useAddDossierDocumentMutation,
    useDeleteDossierDocumentMutation,
    useDossierDocumentsQuery,
    useUpdateDossierDocumentMutation,
} from "@/hooks/useDossierDocuments";
import { callFetchAccountingDocumentCategoryActive } from "@/config/api";

const { Text } = Typography;

const CHECK_STATUS_MAP: Record<string, { color: string; label: string }> = {
    PENDING: { color: "default", label: "Chờ kiểm tra" },
    VALID: { color: "success", label: "Hợp lệ" },
    NEED_SUPPLEMENT: { color: "warning", label: "Cần bổ sung" },
    INVALID: { color: "error", label: "Không hợp lệ" },
    NOT_REQUIRED: { color: "blue", label: "Không yêu cầu" },
};

const DOCUMENT_TYPE_OPTIONS = [
    { value: "PDF", label: "PDF" },
    { value: "EXCEL", label: "Excel" },
    { value: "WORD", label: "Word" },
    { value: "PPT", label: "PowerPoint" },
    { value: "CSV", label: "CSV" },
    { value: "XML", label: "XML" },
    { value: "PNG", label: "PNG" },
    { value: "JPG", label: "JPG" },
    { value: "VIDEO_LINK", label: "Video/link" },
    { value: "NAS_PATH", label: "Ổ lưu trữ/NAS" },
    { value: "OTHER", label: "Khác" },
];

interface Props {
    dossier: IAccountingDossier;
    editable: boolean;
}

const DossierDocumentList: React.FC<Props> = ({ dossier, editable }) => {
    const [form] = Form.useForm();
    const [modalOpen, setModalOpen] = useState(false);
    const [editingDoc, setEditingDoc] = useState<IAccountingDossierDocument | null>(null);
    const [categories, setCategories] = useState<IAccountingDocumentCategory[]>([]);
    const [loadingCats, setLoadingCats] = useState(false);

    const { data: docs = [], isFetching } = useDossierDocumentsQuery(dossier.id);
    const addMutation = useAddDossierDocumentMutation();
    const updateMutation = useUpdateDossierDocumentMutation();
    const deleteMutation = useDeleteDossierDocumentMutation();

    const loadCategories = async () => {
        if (categories.length > 0) return;
        setLoadingCats(true);
        try {
            const res = await callFetchAccountingDocumentCategoryActive();
            setCategories(res?.data ?? []);
        } catch {
            // ignore
        } finally {
            setLoadingCats(false);
        }
    };

    const handleOpenAdd = async () => {
        setEditingDoc(null);
        form.resetFields();
        await loadCategories();
        setModalOpen(true);
    };

    const handleOpenEdit = async (record: IAccountingDossierDocument) => {
        setEditingDoc(record);
        await loadCategories();
        form.setFieldsValue({
            accountingCategoryId: record.accountingCategory?.id,
            documentName: record.documentName,
            documentType: record.documentType || "OTHER",
        });
        setModalOpen(true);
    };

    const handleSubmit = async () => {
        const values = await form.validateFields();
        if (!dossier.id) return;

        if (editingDoc?.id) {
            updateMutation.mutate(
                { dossierId: dossier.id, docId: editingDoc.id, data: values },
                { onSuccess: () => setModalOpen(false) }
            );
        } else {
            addMutation.mutate(
                { dossierId: dossier.id, data: values },
                { onSuccess: () => setModalOpen(false) }
            );
        }
    };

    const handleDelete = (docId: number) => {
        if (!dossier.id) return;
        deleteMutation.mutate({ dossierId: dossier.id, docId });
    };

    const columns: ColumnsType<IAccountingDossierDocument> = [
        {
            title: "Tên chứng từ",
            dataIndex: "documentName",
            key: "documentName",
            render: (v) => <Text strong>{v}</Text>,
        },
        {
            title: "Loại chứng từ",
            dataIndex: "accountingCategory",
            key: "category",
            render: (cat) => cat?.categoryName ?? <Text type="secondary">—</Text>,
        },
        {
            title: "Định dạng",
            dataIndex: "documentType",
            key: "documentType",
            width: 130,
            render: (v) => DOCUMENT_TYPE_OPTIONS.find((item) => item.value === v)?.label ?? v ?? "Khác",
        },
        {
            title: "Trạng thái kiểm tra",
            dataIndex: "checkStatus",
            key: "checkStatus",
            width: 160,
            render: (v) => {
                const s = CHECK_STATUS_MAP[v] ?? { color: "default", label: v };
                return <Tag color={s.color}>{s.label}</Tag>;
            },
        },
        {
            title: "Người tạo",
            dataIndex: "createdBy",
            key: "createdBy",
            width: 140,
            render: (v) => v ?? <Text type="secondary">—</Text>,
        },
        ...(editable
            ? [
                {
                    title: "Thao tác",
                    key: "actions",
                    width: 100,
                    render: (_: unknown, record: IAccountingDossierDocument) => (
                        <Space size={4}>
                            <Tooltip title="Sửa">
                                <Button
                                    size="small"
                                    icon={<EditOutlined />}
                                    onClick={() => handleOpenEdit(record)}
                                />
                            </Tooltip>
                            <Popconfirm
                                title="Xoá chứng từ con này?"
                                okText="Xoá"
                                cancelText="Hủy"
                                okButtonProps={{ danger: true }}
                                onConfirm={() => record.id && handleDelete(record.id)}
                            >
                                <Tooltip title="Xoá">
                                    <Button danger size="small" icon={<DeleteOutlined />} />
                                </Tooltip>
                            </Popconfirm>
                        </Space>
                    ),
                },
            ]
            : []),
    ];

    return (
        <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
                <Text strong>
                    Danh sách chứng từ con{" "}
                    <Tag color={docs.length === 0 ? "red" : "blue"}>{docs.length}</Tag>
                </Text>
                {editable && (
                    <Button
                        type="primary"
                        size="small"
                        icon={<PlusOutlined />}
                        onClick={handleOpenAdd}
                    >
                        Thêm chứng từ
                    </Button>
                )}
            </div>

            <Table
                rowKey="id"
                size="small"
                loading={isFetching}
                columns={columns}
                dataSource={docs}
                pagination={false}
                locale={{ emptyText: "Chưa có chứng từ con nào" }}
            />

            <Modal
                open={modalOpen}
                title={editingDoc ? "Sửa chứng từ con" : "Thêm chứng từ con"}
                okText={editingDoc ? "Lưu" : "Thêm"}
                cancelText="Hủy"
                onCancel={() => setModalOpen(false)}
                onOk={handleSubmit}
                confirmLoading={addMutation.isPending || updateMutation.isPending}
                destroyOnClose
                width={560}
            >
                <Form form={form} layout="vertical" className="mt-4" initialValues={{ documentType: "OTHER" }}>
                    <Form.Item
                        name="accountingCategoryId"
                        label="Loại chứng từ"
                        rules={[{ required: true, message: "Vui lòng chọn loại chứng từ" }]}
                    >
                        <Select
                            showSearch
                            loading={loadingCats}
                            placeholder="Chọn loại chứng từ"
                            optionFilterProp="label"
                            options={categories.map((c) => ({
                                value: c.id,
                                label: c.categoryName,
                            }))}
                        />
                    </Form.Item>

                    <Form.Item
                        name="documentName"
                        label="Tên chứng từ"
                        rules={[{ required: true, message: "Nhập tên chứng từ" }]}
                    >
                        <Input placeholder="VD: Hóa đơn đỏ tháng 6/2026" />
                    </Form.Item>

                    <Form.Item
                        name="documentType"
                        label="Định dạng"
                        rules={[{ required: true, message: "Vui lòng chọn định dạng chứng từ" }]}
                    >
                        <Select options={DOCUMENT_TYPE_OPTIONS} />
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};

export default DossierDocumentList;
