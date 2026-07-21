import React, { useEffect, useMemo, useState } from "react";
import {
    Button,
    DatePicker,
    Empty,
    Form,
    Input,
    InputNumber,
    Modal,
    Popconfirm,
    Select,
    Space,
    Table,
    Tag,
    Tooltip,
    Typography,
    Upload,
} from "antd";
import {
    CheckCircleOutlined,
    DeleteOutlined,
    EditOutlined,
    ExclamationCircleOutlined,
    EyeOutlined,
    PlusOutlined,
    UploadOutlined,
    PaperClipOutlined,
    FileTextOutlined,
} from "@ant-design/icons";
import { notify } from "@/components/common/notification/notify";
import type { ColumnsType } from "antd/es/table";
import type {
    IAccountingDossier,
    IAccountingDossierDocument,
    IAccountingDossierDocumentCheckRequest,
    AccountingDossierDocumentType,
    IAccountingDocumentCategory,
} from "@/types/backend";
import dayjs from "dayjs";
import {
    useAddDossierDocumentMutation,
    useCheckDossierDocumentMutation,
    useDeleteDossierDocumentMutation,
    useDossierDocumentsQuery,
    useUpdateDossierDocumentMutation,
} from "@/hooks/useDossierDocuments";
import { useBulkCheckDossierDocumentsMutation } from "@/hooks/useAccountingDossiers";
import { callFetchAccountingDocumentCategoryActive, callUploadSingleFile } from "@/config/api";
import FileSection from "../../procedures/components/file-section.procedure";
import ActionButton from "@/components/common/ui/ActionButton";

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

const REVIEW_STATUS_OPTIONS = [
    { value: "VALID", label: "Hợp lệ", color: "success" },
    { value: "NEED_SUPPLEMENT", label: "Cần bổ sung", color: "warning" },
    { value: "INVALID", label: "Không hợp lệ", color: "error" },
    { value: "NOT_REQUIRED", label: "Không yêu cầu", color: "blue" },
] as const;

interface Props {
    dossier: IAccountingDossier;
    editable: boolean;
    canCreate?: boolean;
    canUpdate?: boolean;
    canDelete?: boolean;
    reviewable?: boolean;
    variant?: "table" | "compact";
}

type DocumentFormValues = {
    accountingCategoryId: number;
    documentName: string;
    documentType?: AccountingDossierDocumentType;
    fileUrl?: string;
    externalLink?: string;
    invoiceDate?: dayjs.Dayjs;
    invoiceNumber?: string;
    invoiceContent?: string;
    partnerName?: string;
    partnerType?: "SUPPLIER" | "CUSTOMER" | "OTHER";
    amount?: number;
    currency?: string;
};

type ReviewFormValues = IAccountingDossierDocumentCheckRequest;

const splitFileUrls = (value?: string) =>
    value?.split(",").map((item) => item.trim()).filter(Boolean) ?? [];

const getFileDisplayName = (value?: string) => {
    if (!value) return "";
    const cleanValue = value.split("?")[0];
    return cleanValue.split("/").filter(Boolean).pop() || value;
};

const buildDocumentFileUrl = (fileName: string) =>
    `/api/v1/files/public?folder=documents&fileName=${encodeURIComponent(fileName)}`;

const DossierDocumentList: React.FC<Props> = ({
    dossier,
    editable,
    canCreate,
    canUpdate,
    canDelete,
    reviewable = false,
    variant = "table",
}) => {
    const [documentForm] = Form.useForm<DocumentFormValues>();
    const [reviewForm] = Form.useForm<ReviewFormValues>();
    const editingFileUrl = Form.useWatch("fileUrl", documentForm);
    const [modalOpen, setModalOpen] = useState(false);
    const [reviewModalOpen, setReviewModalOpen] = useState(false);
    const [editingDoc, setEditingDoc] = useState<IAccountingDossierDocument | null>(null);
    const [reviewingDoc, setReviewingDoc] = useState<IAccountingDossierDocument | null>(null);
    const [categories, setCategories] = useState<IAccountingDocumentCategory[]>([]);
    const [loadingCats, setLoadingCats] = useState(false);

    const { data: docs = [], isFetching } = useDossierDocumentsQuery(dossier.id);
    const sortedDocs = useMemo(() => [...docs].sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        if (dateA !== dateB) return dateB - dateA;
        return Number(b.id || 0) - Number(a.id || 0);
    }), [docs]);
    const addMutation = useAddDossierDocumentMutation();
    const updateMutation = useUpdateDossierDocumentMutation();
    const deleteMutation = useDeleteDossierDocumentMutation();
    const checkMutation = useCheckDossierDocumentMutation();
    const bulkCheckMutation = useBulkCheckDossierDocumentsMutation();

    const [selectedDocIds, setSelectedDocIds] = useState<React.Key[]>([]);
    const [bulkCheckStatus, setBulkCheckStatus] = useState<string | undefined>();
    const [bulkCheckNote, setBulkCheckNote] = useState<string>("");

    const [editingCheckNotes, setEditingCheckNotes] = useState<Record<number, string>>({});
    const canCreateDocument = editable && (canCreate ?? editable);
    const canUpdateDocument = editable && (canUpdate ?? editable);
    const canDeleteDocument = editable && (canDelete ?? editable);

    const handleInlineCheck = (docId: number, checkStatus: string, currentNote: string) => {
        checkMutation.mutate({
            dossierId: dossier.id!,
            docId,
            data: {
                checkStatus,
                note: currentNote || undefined
            }
        });
        if (checkStatus === "VALID" || checkStatus === "NOT_REQUIRED") {
            setEditingCheckNotes(prev => {
                const next = { ...prev };
                delete next[docId];
                return next;
            });
        } else {
            setEditingCheckNotes(prev => ({ ...prev, [docId]: currentNote }));
        }
    };

    const handleSaveNote = (docId: number, checkStatus: string, note: string) => {
        if (!note.trim() && (checkStatus === "NEED_SUPPLEMENT" || checkStatus === "INVALID")) {
            notify.warning("Lý do bắt buộc đối với trạng thái Bổ sung / Không hợp lệ");
            return;
        }
        checkMutation.mutate({
            dossierId: dossier.id!,
            docId,
            data: {
                checkStatus,
                note
            }
        }, {
            onSuccess: () => {
                setEditingCheckNotes(prev => {
                    const next = { ...prev };
                    delete next[docId];
                    return next;
                });
            }
        });
    };

    const reviewOptions = useMemo(() => {
        if (dossier.categoryMode === "TEMPLATE") {
            return REVIEW_STATUS_OPTIONS.filter((item) => item.value !== "NOT_REQUIRED");
        }
        return REVIEW_STATUS_OPTIONS;
    }, [dossier.categoryMode]);

    useEffect(() => {
        if (!reviewModalOpen) {
            reviewForm.resetFields();
        }
    }, [reviewForm, reviewModalOpen]);

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
        documentForm.resetFields();
        await loadCategories();
        setModalOpen(true);
    };

    const handleOpenEdit = async (record: IAccountingDossierDocument) => {
        setEditingDoc(record);
        await loadCategories();
        documentForm.setFieldsValue({
            accountingCategoryId: record.accountingCategory?.id,
            documentName: record.documentName,
            documentType: record.documentType || "OTHER",
            fileUrl: record.fileUrl || undefined,
            externalLink: record.externalLink || undefined,
            invoiceDate: record.invoiceDate ? dayjs(record.invoiceDate) : undefined,
            invoiceNumber: record.invoiceNumber || undefined,
            invoiceContent: record.invoiceContent || undefined,
            partnerName: record.partnerName || undefined,
            partnerType: (record.partnerType as "SUPPLIER" | "CUSTOMER" | "OTHER") || undefined,
            amount: record.amount ?? undefined,
            currency: record.currency || "VND",
        });
        setModalOpen(true);
    };

    const handleOpenReview = (record: IAccountingDossierDocument) => {
        setReviewingDoc(record);
        reviewForm.setFieldsValue({
            checkStatus: "VALID",
            note: record.checkNote || undefined,
        });
        setReviewModalOpen(true);
    };

    const handleSubmitDocument = async () => {
        const values = await documentForm.validateFields();
        if (!dossier.id) return;
        const payload = {
            ...values,
            invoiceDate: values.invoiceDate ? values.invoiceDate.toISOString() : undefined,
        };

        if (editingDoc?.id) {
            updateMutation.mutate(
                { dossierId: dossier.id, docId: editingDoc.id, data: payload },
                {
                    onSuccess: () => setModalOpen(false),
                    onError: (error: any) => {
                        if (error?.error === "DUPLICATE_INVOICE_WARNING") {
                            Modal.error({
                                title: "Trùng lặp hóa đơn",
                                content: error?.message || "Số hóa đơn đã tồn tại trên hệ thống. Không được phép lưu trùng lặp hóa đơn.",
                                okText: "Đã hiểu",
                            });
                        } else {
                            notify.error(error?.message || "Không thể cập nhật chứng từ con");
                        }
                    }
                }
            );
            return;
        }

        addMutation.mutate(
            { dossierId: dossier.id, data: payload },
            {
                onSuccess: () => setModalOpen(false),
                onError: (error: any) => {
                    if (error?.error === "DUPLICATE_INVOICE_WARNING") {
                        Modal.error({
                            title: "Trùng lặp hóa đơn",
                            content: error?.message || "Số hóa đơn đã tồn tại trên hệ thống. Không được phép lưu trùng lặp hóa đơn.",
                            okText: "Đã hiểu",
                        });
                    } else {
                        notify.error(error?.message || "Không thể thêm chứng từ con");
                    }
                }
            }
        );
    };

    const handleSubmitReview = async () => {
        const values = await reviewForm.validateFields();
        if (!dossier.id || !reviewingDoc?.id) return;

        checkMutation.mutate(
            {
                dossierId: dossier.id,
                docId: reviewingDoc.id,
                data: values,
            },
            { onSuccess: () => setReviewModalOpen(false) }
        );
    };

    const handleDelete = (docId: number) => {
        if (!dossier.id) return;
        deleteMutation.mutate({ dossierId: dossier.id, docId });
    };

    const renderDocumentActions = (record: IAccountingDossierDocument) => (
        <Space size={4} wrap>
            {(canUpdateDocument || canDeleteDocument) && (
                <>
                    {canUpdateDocument && (
                        <ActionButton
                            variant="edit"
                            tooltip="Sửa chứng từ"
                            icon={<EditOutlined />}
                            aria-label="Sửa chứng từ"
                            onClick={() => handleOpenEdit(record)}
                        />
                    )}
                    {canDeleteDocument && (
                        <Popconfirm
                            title="Xoá chứng từ con này?"
                            okText="Xoá"
                            cancelText="Hủy"
                            okButtonProps={{ danger: true }}
                            onConfirm={() => record.id && handleDelete(record.id)}
                        >
                            <ActionButton
                                variant="danger"
                                tooltip="Xóa chứng từ"
                                icon={<DeleteOutlined />}
                                aria-label="Xóa chứng từ"
                            />
                        </Popconfirm>
                    )}
                </>
            )}
        </Space>
    );

    const columns: ColumnsType<IAccountingDossierDocument> = [
        {
            title: "Tên chứng từ",
            dataIndex: "documentName",
            key: "documentName",
            width: 210,
            render: (v) => <Text strong style={{ display: "block", wordBreak: "break-word", whiteSpace: "normal", lineHeight: 1.35 }}>{v}</Text>,
        },
        {
            title: "Loại chứng từ",
            dataIndex: "accountingCategory",
            key: "category",
            width: 180,
            render: (cat) => (
                <Text style={{ display: "block", lineHeight: 1.35, wordBreak: "break-word" }}>
                    {cat?.categoryName ?? <Text type="secondary">—</Text>}
                </Text>
            ),
        },
        {
            title: "Định dạng",
            dataIndex: "documentType",
            key: "documentType",
            width: 110,
            render: (v) => <Tag style={{ margin: 0 }}>{DOCUMENT_TYPE_OPTIONS.find((item) => item.value === v)?.label ?? v ?? "Khác"}</Tag>,
        },
        {
            title: "Trạng thái kiểm tra",
            dataIndex: "checkStatus",
            key: "checkStatus",
            width: reviewable ? 260 : 155,
            render: (v, record) => {
                const s = CHECK_STATUS_MAP[v as string] ?? { color: "default", label: v || "PENDING" };
                
                if (reviewable) {
                    const isDraftCheck = editingCheckNotes[record.id!] !== undefined;
                    const currentNote = isDraftCheck ? editingCheckNotes[record.id!] : (record.checkNote || "");
                    const isRejectOrSupplement = v === "NEED_SUPPLEMENT" || v === "INVALID";

                    return (
                        <Space direction="vertical" size={4} style={{ width: "100%" }}>
                            <Space size={4} wrap>
                                <Button
                                    size="small"
                                    type={v === "VALID" ? "primary" : "default"}
                                    style={{
                                        borderColor: "#52c41a",
                                        color: v === "VALID" ? "#fff" : "#52c41a",
                                        backgroundColor: v === "VALID" ? "#52c41a" : "#fff",
                                        fontSize: 11,
                                        height: 22,
                                        padding: "0 6px"
                                    }}
                                    onClick={() => handleInlineCheck(record.id!, "VALID", record.checkNote || "")}
                                >
                                    Hợp lệ
                                </Button>
                                <Button
                                    size="small"
                                    type={v === "NEED_SUPPLEMENT" ? "primary" : "default"}
                                    style={{
                                        borderColor: "#faad14",
                                        color: v === "NEED_SUPPLEMENT" ? "#fff" : "#faad14",
                                        backgroundColor: v === "NEED_SUPPLEMENT" ? "#faad14" : "#fff",
                                        fontSize: 11,
                                        height: 22,
                                        padding: "0 6px"
                                    }}
                                    onClick={() => handleInlineCheck(record.id!, "NEED_SUPPLEMENT", record.checkNote || "")}
                                >
                                    Bổ sung
                                </Button>
                                <Button
                                    size="small"
                                    type={v === "INVALID" ? "primary" : "default"}
                                    style={{
                                        borderColor: "#ff4d4f",
                                        color: v === "INVALID" ? "#fff" : "#ff4d4f",
                                        backgroundColor: v === "INVALID" ? "#ff4d4f" : "#fff",
                                        fontSize: 11,
                                        height: 22,
                                        padding: "0 6px"
                                    }}
                                    onClick={() => handleInlineCheck(record.id!, "INVALID", record.checkNote || "")}
                                >
                                    Không hợp lệ
                                </Button>
                            </Space>
                            
                            {(isRejectOrSupplement || isDraftCheck) && (
                                <div style={{ display: "flex", gap: 4, width: "100%" }}>
                                    <Input
                                        size="small"
                                        placeholder="Lý do bắt buộc..."
                                        style={{ fontSize: 11, height: 22, flex: 1 }}
                                        value={currentNote}
                                        onChange={(e) => setEditingCheckNotes(prev => ({ ...prev, [record.id!]: e.target.value }))}
                                        onBlur={() => handleSaveNote(record.id!, v, currentNote)}
                                        onPressEnter={() => handleSaveNote(record.id!, v, currentNote)}
                                    />
                                    <Button
                                        size="small"
                                        type="primary"
                                        style={{ height: 22, fontSize: 11 }}
                                        onClick={() => handleSaveNote(record.id!, v, currentNote)}
                                    >
                                        Lưu
                                    </Button>
                                </div>
                            )}

                            {!isRejectOrSupplement && record.checkNote && (
                                <Text type="secondary" style={{ fontSize: 11 }}>Ghi chú: {record.checkNote}</Text>
                            )}
                        </Space>
                    );
                }

                return (
                    <Space direction="vertical" size={2}>
                        <Tag color={s.color}>{s.label}</Tag>
                        {record.checkNote ? (
                            <Tooltip title={record.checkNote}>
                                <Text type="secondary" className="max-w-[150px] truncate" style={{ fontSize: 11 }}>
                                    {record.checkNote}
                                </Text>
                            </Tooltip>
                        ) : null}
                    </Space>
                );
            },
        },
        {
            title: "File/link",
            key: "fileLink",
            width: 250,
            render: (_, record) => {
                const urls = record.fileUrl ? record.fileUrl.split(",").map(s => s.trim()).filter(Boolean) : [];
                return (
                    <Space direction="vertical" size={2} style={{ width: "100%" }}>
                        {urls.map((url, idx) => (
                            <Text key={idx} ellipsis={{ tooltip: url }} style={{ maxWidth: 230, color: "#334155" }}>
                                {getFileDisplayName(url)}
                            </Text>
                        ))}
                        {record.externalLink ? (
                            <Text type="secondary" ellipsis={{ tooltip: record.externalLink }} style={{ maxWidth: 230 }}>
                                {record.externalLink}
                            </Text>
                        ) : null}
                        {urls.length === 0 && !record.externalLink ? <Text type="secondary">—</Text> : null}
                    </Space>
                );
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
                      width: 120,
                      render: (_: unknown, record: IAccountingDossierDocument) => renderDocumentActions(record),
                  },
              ]
            : []),
    ];

    return (
        <div className="flex flex-col gap-3">
            <style>{`
                .accounting-dossier-doc-table {
                    border-top: 1px solid #f1f5f9;
                }
                .accounting-dossier-doc-table .ant-table {
                    color: #0f172a;
                }
                .accounting-dossier-doc-table .ant-table-thead > tr > th {
                    background: #f8fafc !important;
                    color: #475569 !important;
                    font-size: 12px;
                    font-weight: 700 !important;
                    border-bottom: 1px solid #f1f5f9 !important;
                }
                .accounting-dossier-doc-table .ant-table-tbody > tr > td {
                    padding-top: 14px !important;
                    padding-bottom: 14px !important;
                    border-bottom: 1px solid #f1f5f9 !important;
                    vertical-align: top;
                }
                .accounting-dossier-doc-table .ant-table-tbody > tr:hover > td {
                    background: #fafbfd !important;
                }
                .accounting-dossier-doc-compact {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(min(100%, 340px), 1fr));
                    gap: 12px;
                    padding: 4px 18px 18px;
                }
                .accounting-dossier-doc-card {
                    border: 1px solid #e8edf4;
                    border-radius: 10px;
                    background: #fff;
                    padding: 12px 14px;
                    min-width: 0;
                    align-self: start;
                }
                .accounting-dossier-doc-card:hover {
                    border-color: #d7e1ee;
                    background: #fcfdff;
                }
                .accounting-dossier-doc-card-title {
                    color: #0f172a;
                    font-size: 14px;
                    font-weight: 800;
                    line-height: 1.35;
                    word-break: break-word;
                    letter-spacing: -0.01em;
                }
                .accounting-dossier-doc-meta {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    margin-top: 9px;
                    font-size: 12px;
                    color: #64748b;
                }
                .accounting-dossier-doc-file {
                    margin-top: 8px;
                    padding: 0;
                    min-width: 0;
                }
            `}</style>
            <div className="flex items-center justify-between gap-3 px-6 pt-4">
                <Text strong style={{ color: "#0f172a", fontSize: 14 }}>
                    Danh sách chứng từ con <Tag color={docs.length === 0 ? "default" : "blue"} style={{ marginLeft: 6, borderRadius: 9999, fontWeight: 700 }}>{docs.length}</Tag>
                </Text>
                {canCreateDocument && (
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

            {selectedDocIds.length > 0 && reviewable && (
                <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", marginBottom: 4 }}>
                    <span style={{ fontSize: 12, color: "#555" }}>
                        Đã chọn <strong>{selectedDocIds.length}</strong> chứng từ
                    </span>
                    <Select
                        size="small"
                        placeholder="Chọn trạng thái"
                        style={{ width: 160 }}
                        value={bulkCheckStatus}
                        onChange={setBulkCheckStatus}
                        options={REVIEW_STATUS_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
                    />
                    <Input
                        size="small"
                        placeholder="Ghi chú (tùy chọn)"
                        style={{ width: 180 }}
                        value={bulkCheckNote}
                        onChange={(e) => setBulkCheckNote(e.target.value)}
                    />
                    <Popconfirm
                        title={`Cập nhật ${selectedDocIds.length} chứng từ?`}
                        disabled={!bulkCheckStatus}
                        okText="Xác nhận"
                        cancelText="Hủy"
                        onConfirm={async () => {
                            if (!bulkCheckStatus) return;
                            await bulkCheckMutation.mutateAsync({
                                dossierId: dossier.id!,
                                documentIds: selectedDocIds.map(Number),
                                checkStatus: bulkCheckStatus,
                                note: bulkCheckNote || undefined,
                            });
                            setSelectedDocIds([]);
                            setBulkCheckStatus(undefined);
                            setBulkCheckNote("");
                        }}
                    >
                        <Button
                            size="small"
                            type="primary"
                            loading={bulkCheckMutation.isPending}
                            disabled={!bulkCheckStatus}
                            icon={<CheckCircleOutlined />}
                        >
                            Áp dụng
                        </Button>
                    </Popconfirm>
                    <Button size="small" onClick={() => setSelectedDocIds([])}>Bỏ chọn</Button>
                </div>
            )}

            {variant === "compact" ? (
                <div className="accounting-dossier-doc-compact">
                    {isFetching ? (
                        <div style={{ gridColumn: "1 / -1", color: "#64748b", fontSize: 13, padding: "12px 0" }}>
                            Đang tải chứng từ...
                        </div>
                    ) : docs.length === 0 ? (
                        <div style={{ gridColumn: "1 / -1" }}>
                            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Chưa có chứng từ con nào" />
                        </div>
                    ) : (
                        sortedDocs.map((doc) => {
                            const status = CHECK_STATUS_MAP[doc.checkStatus as string] ?? { color: "default", label: doc.checkStatus || "Chờ kiểm tra" };
                            const fileUrls = splitFileUrls(doc.fileUrl);
                            return (
                                <article key={doc.id} className="accounting-dossier-doc-card">
                                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10 }}>
                                        <div style={{ minWidth: 0 }}>
                                            <div className="accounting-dossier-doc-card-title">{doc.documentName || "Chưa đặt tên"}</div>
                                            <div style={{ marginTop: 4, color: "#64748b", fontSize: 12, lineHeight: 1.4 }}>
                                                {doc.accountingCategory?.categoryName || "Chưa phân loại"}
                                            </div>
                                        </div>
                                        {(canUpdateDocument || canDeleteDocument) && <div style={{ flexShrink: 0 }}>{renderDocumentActions(doc)}</div>}
                                    </div>

                                    {reviewable ? (
                                        <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 6 }}>
                                            <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                                                <Button
                                                    size="small"
                                                    type={doc.checkStatus === "VALID" ? "primary" : "default"}
                                                    style={{
                                                        borderColor: "#52c41a",
                                                        color: doc.checkStatus === "VALID" ? "#fff" : "#52c41a",
                                                        backgroundColor: doc.checkStatus === "VALID" ? "#52c41a" : "#fff",
                                                        fontSize: 10,
                                                        height: 22,
                                                        padding: "0 6px"
                                                    }}
                                                    onClick={() => handleInlineCheck(doc.id!, "VALID", doc.checkNote || "")}
                                                >
                                                    Hợp lệ
                                                </Button>
                                                <Button
                                                    size="small"
                                                    type={doc.checkStatus === "NEED_SUPPLEMENT" ? "primary" : "default"}
                                                    style={{
                                                        borderColor: "#faad14",
                                                        color: doc.checkStatus === "NEED_SUPPLEMENT" ? "#fff" : "#faad14",
                                                        backgroundColor: doc.checkStatus === "NEED_SUPPLEMENT" ? "#faad14" : "#fff",
                                                        fontSize: 10,
                                                        height: 22,
                                                        padding: "0 6px"
                                                    }}
                                                    onClick={() => handleInlineCheck(doc.id!, "NEED_SUPPLEMENT", doc.checkNote || "")}
                                                >
                                                    Bổ sung
                                                </Button>
                                                <Button
                                                    size="small"
                                                    type={doc.checkStatus === "INVALID" ? "primary" : "default"}
                                                    style={{
                                                        borderColor: "#ff4d4f",
                                                        color: doc.checkStatus === "INVALID" ? "#fff" : "#ff4d4f",
                                                        backgroundColor: doc.checkStatus === "INVALID" ? "#ff4d4f" : "#fff",
                                                        fontSize: 10,
                                                        height: 22,
                                                        padding: "0 6px"
                                                    }}
                                                    onClick={() => handleInlineCheck(doc.id!, "INVALID", doc.checkNote || "")}
                                                >
                                                    Không hợp lệ
                                                </Button>
                                            </div>
                                            
                                            {((doc.checkStatus === "NEED_SUPPLEMENT" || doc.checkStatus === "INVALID") || editingCheckNotes[doc.id!] !== undefined) && (
                                                <div style={{ display: "flex", gap: 4, width: "100%", marginTop: 4 }}>
                                                    <Input
                                                        size="small"
                                                        placeholder="Lý do bắt buộc..."
                                                        style={{ fontSize: 10, height: 22, flex: 1 }}
                                                        value={editingCheckNotes[doc.id!] !== undefined ? editingCheckNotes[doc.id!] : (doc.checkNote || "")}
                                                        onChange={(e) => setEditingCheckNotes(prev => ({ ...prev, [doc.id!]: e.target.value }))}
                                                        onBlur={() => handleSaveNote(doc.id!, doc.checkStatus || "", editingCheckNotes[doc.id!] !== undefined ? editingCheckNotes[doc.id!] : (doc.checkNote || ""))}
                                                        onPressEnter={() => handleSaveNote(doc.id!, doc.checkStatus || "", editingCheckNotes[doc.id!] !== undefined ? editingCheckNotes[doc.id!] : (doc.checkNote || ""))}
                                                    />
                                                    <Button
                                                        size="small"
                                                        type="primary"
                                                        style={{ height: 22, fontSize: 10 }}
                                                        onClick={() => handleSaveNote(doc.id!, doc.checkStatus || "", editingCheckNotes[doc.id!] !== undefined ? editingCheckNotes[doc.id!] : (doc.checkNote || ""))}
                                                    >
                                                        Lưu
                                                    </Button>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="accounting-dossier-doc-meta">
                                            <span style={{ display: "inline-flex", alignItems: "center", gap: 5, color: status.color === "success" ? "#389e0d" : status.color === "warning" ? "#d48806" : status.color === "error" ? "#cf1322" : "#64748b", fontWeight: 650 }}>
                                                <span style={{ width: 6, height: 6, borderRadius: "50%", background: status.color === "success" ? "#52c41a" : status.color === "warning" ? "#faad14" : status.color === "error" ? "#ff4d4f" : "#94a3b8" }} />
                                                {status.label}
                                            </span>
                                            {fileUrls.length > 1 && <span>· {fileUrls.length} tệp đính kèm</span>}
                                        </div>
                                    )}

                                    {(fileUrls.length > 0 || doc.externalLink || doc.checkNote) && (
                                        <div className="accounting-dossier-doc-file">
                                            <Space direction="vertical" size={6} style={{ width: "100%" }}>
                                                {fileUrls.length > 0 && <FileSection fileNames={fileUrls} folder="documents" variant="compact" />}
                                                {doc.externalLink ? (
                                                    <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                                                        <FileTextOutlined style={{ color: "#64748b", fontSize: 13, flexShrink: 0 }} />
                                                        <Text type="secondary" ellipsis={{ tooltip: doc.externalLink }} style={{ flex: 1, fontSize: 12 }}>
                                                            Liên kết đính kèm
                                                        </Text>
                                                        <Button size="small" onClick={() => window.open(doc.externalLink, "_blank", "noopener,noreferrer")} style={{ borderRadius: 6, fontWeight: 600 }}>
                                                            Mở liên kết
                                                        </Button>
                                                    </div>
                                                ) : null}
                                                {doc.checkNote ? (
                                                    <div style={{ fontSize: 12, color: "#64748b", marginTop: 4, borderTop: "1px dashed #e2e8f0", paddingTop: 4 }}>
                                                        Ghi chú: {doc.checkNote}
                                                    </div>
                                                ) : null}
                                            </Space>
                                        </div>
                                    )}
                                </article>
                            );
                        })
                    )}
                </div>
            ) : (
                <Table
                    rowKey="id"
                    size="small"
                    className="accounting-dossier-doc-table"
                    loading={isFetching}
                    columns={columns}
                    dataSource={sortedDocs}
                    pagination={false}
                    tableLayout="fixed"
                    scroll={{ x: 920 }}
                    rowSelection={reviewable ? {
                        selectedRowKeys: selectedDocIds,
                        onChange: (keys) => setSelectedDocIds(keys),
                    } : undefined}
                    locale={{ emptyText: "Chưa có chứng từ con nào" }}
                />
            )}

            <Modal
                open={modalOpen}
                title={editingDoc ? "Sửa chứng từ con" : "Thêm chứng từ con"}
                okText={editingDoc ? "Lưu" : "Thêm"}
                cancelText="Hủy"
                onCancel={() => setModalOpen(false)}
                onOk={handleSubmitDocument}
                confirmLoading={addMutation.isPending || updateMutation.isPending}
                destroyOnHidden
                width={560}
            >
                <Form
                    form={documentForm}
                    layout="vertical"
                    className="mt-4"
                    initialValues={{ documentType: "OTHER", currency: "VND" }}
                >
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

                    <Form.Item name="fileUrl" hidden>
                        <Input />
                    </Form.Item>

                    <Form.Item label="File đã tải">
                        <div className="rounded border border-gray-200 bg-gray-50 p-2">
                            <Space direction="vertical" size={8} className="w-full">
                                {splitFileUrls(editingFileUrl).length > 0 ? (
                                    <div className="flex flex-wrap gap-2">
                                        {splitFileUrls(editingFileUrl).map((url) => (
                                            <Tooltip key={url} title={url}>
                                                <Tag
                                                    color="blue"
                                                    className="m-0 flex max-w-[230px] items-center gap-1 truncate px-2 py-1"
                                                >
                                                    <span className="truncate">{getFileDisplayName(url)}</span>
                                                    <Button
                                                        type="link"
                                                        size="small"
                                                        className="h-auto p-0"
                                                        icon={<EyeOutlined />}
                                                        onClick={() => window.open(buildDocumentFileUrl(url), "_blank")}
                                                    />
                                                </Tag>
                                            </Tooltip>
                                        ))}
                                    </div>
                                ) : (
                                    <Text type="secondary">Chưa có file nội bộ</Text>
                                )}
                                <Upload
                                    multiple={true}
                                    showUploadList={false}
                                    customRequest={async ({ file, onSuccess, onError }) => {
                                        try {
                                            const res = await callUploadSingleFile(file, "documents");
                                            if (res?.data?.fileName) {
                                                const currentVal = documentForm.getFieldValue("fileUrl") || "";
                                                const newVal = currentVal ? `${currentVal}, ${res.data.fileName}` : res.data.fileName;
                                                documentForm.setFieldsValue({ fileUrl: newVal });
                                                notify.success("Tải tệp thành công.");
                                                onSuccess?.("ok");
                                            } else {
                                                notify.error("Không thể tải tệp");
                                                onError?.(new Error("Lỗi tải file"));
                                            }
                                        } catch (e) {
                                            notify.error("Không thể tải tệp");
                                            onError?.(e instanceof Error ? e : new Error("Lỗi tải file"));
                                        }
                                    }}
                                >
                                    <Button size="small" icon={<UploadOutlined />}>
                                        Tải thêm file
                                    </Button>
                                </Upload>
                            </Space>
                        </div>
                    </Form.Item>

                    <Form.Item name="externalLink" label="Link bên ngoài">
                        <Input placeholder="VD: https://..." />
                    </Form.Item>

                    <div className="mb-3 mt-4 font-semibold text-gray-700">Thông tin hóa đơn</div>
                    <Form.Item name="invoiceDate" label="Ngày hóa đơn">
                        <DatePicker className="w-full" format="DD/MM/YYYY" />
                    </Form.Item>

                    <Form.Item name="invoiceNumber" label="Số hóa đơn">
                        <Input placeholder="VD: 00012345" />
                    </Form.Item>

                    <Form.Item name="invoiceContent" label="Nội dung hóa đơn">
                        <Input placeholder="VD: Dịch vụ cloud tháng 6/2026" />
                    </Form.Item>

                    <Form.Item name="partnerName" label="Đối tác">
                        <Input placeholder="Tên nhà cung cấp/khách hàng" />
                    </Form.Item>

                    <Space className="w-full" align="start" size={12}>
                        <Form.Item name="partnerType" label="Loại đối tác" className="flex-1">
                            <Select
                                allowClear
                                options={[
                                    { value: "SUPPLIER", label: "Nhà cung cấp" },
                                    { value: "CUSTOMER", label: "Khách hàng" },
                                    { value: "OTHER", label: "Khác" },
                                ]}
                            />
                        </Form.Item>
                        <Form.Item name="amount" label="Số tiền" className="flex-1">
                            <InputNumber className="w-full" min={0} precision={2} />
                        </Form.Item>
                        <Form.Item name="currency" label="Tiền tệ" className="w-[110px]">
                            <Select
                                options={[
                                    { value: "VND", label: "VND" },
                                    { value: "USD", label: "USD" },
                                ]}
                            />
                        </Form.Item>
                    </Space>
                </Form>
            </Modal>

            <Modal
                open={reviewModalOpen}
                title={reviewingDoc ? `Kiểm tra: ${reviewingDoc.documentName}` : "Kiểm tra chứng từ"}
                okText="Lưu kết quả"
                cancelText="Hủy"
                onCancel={() => setReviewModalOpen(false)}
                onOk={handleSubmitReview}
                confirmLoading={checkMutation.isPending}
                destroyOnHidden
                width={600}
            >
                <Form form={reviewForm} layout="vertical" className="mt-4">
                    <Form.Item
                        name="checkStatus"
                        label="Kết quả kiểm tra"
                        rules={[{ required: true, message: "Vui lòng chọn kết quả kiểm tra" }]}
                    >
                        <Select
                            options={reviewOptions.map((item) => ({
                                value: item.value,
                                label: item.label,
                            }))}
                        />
                    </Form.Item>

                    <Form.Item
                        noStyle
                        shouldUpdate={(prev, cur) => prev.checkStatus !== cur.checkStatus}
                    >
                        {() => {
                            const currentStatus = reviewForm.getFieldValue("checkStatus");
                            const needNote = currentStatus === "NEED_SUPPLEMENT" || currentStatus === "INVALID";

                            return (
                                <Form.Item
                                    name="note"
                                    label="Ghi chú"
                                    rules={[
                                        {
                                            validator: async (_, value) => {
                                                if (!needNote) {
                                                    return Promise.resolve();
                                                }
                                                if (String(value || "").trim()) {
                                                    return Promise.resolve();
                                                }
                                                return Promise.reject(
                                                    new Error("Vui lòng nhập ghi chú cho trạng thái này")
                                                );
                                            },
                                        },
                                    ]}
                                >
                                    <Input.TextArea
                                        rows={4}
                                        placeholder={
                                            needNote
                                                ? "Nhập lý do bổ sung hoặc không hợp lệ"
                                                : "Nhập ghi chú nếu cần"
                                        }
                                    />
                                </Form.Item>
                            );
                        }}
                    </Form.Item>

                    <div className="mt-2 flex items-start gap-2 rounded-md border border-blue-100 bg-blue-50 px-3 py-2 text-sm text-blue-700">
                        <ExclamationCircleOutlined className="mt-0.5" />
                        <span>
                            Chứng từ theo mẫu không có tùy chọn <b>Không yêu cầu</b>. Trạng thái
                            <b> Cần bổ sung</b> và <b>Không hợp lệ</b> bắt buộc có ghi chú.
                        </span>
                    </div>
                </Form>
            </Modal>
        </div>
    );
};

export default DossierDocumentList;
