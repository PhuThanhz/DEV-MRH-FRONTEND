import React, { useEffect, useMemo, useState } from "react";
import {
    Button,
    Col,
    DatePicker,
    Drawer,
    Form,
    Input,
    InputNumber,
    Modal,
    Popconfirm,
    Row,
    Select,
    Space,
    Switch,
    Table,
    Tag,
    Tooltip,
    Timeline,
    Upload,
    message,
    Dropdown,
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
    UploadOutlined,
    EyeOutlined,
    GlobalOutlined,
    BankOutlined,
    CalendarOutlined,
    CodeOutlined,
    CheckCircleOutlined,
    CloseCircleOutlined,
    CloseOutlined,
    ApartmentOutlined,
    AppstoreOutlined,
    FileTextOutlined,
    InboxOutlined,
    ClockCircleOutlined,
    StopOutlined,
    MoreOutlined,
} from "@ant-design/icons";
import dayjs, { type Dayjs } from "dayjs";
import { useSearchParams } from "react-router-dom";
import PageContainer from "@/components/common/data-table/PageContainer";
import { DetailModal } from "@/components/common/modal/detail";
import SearchFilter from "@/components/common/filter/SearchFilter";
import TabBar from "@/components/common/tabs/TabBar";
import { useDepartmentsByCompanyQuery } from "@/hooks/useDepartments";
import { getModalWidth, MODAL_BODY_SCROLL } from "@/utils/responsive";
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
    callFetchUser,
    callUploadSingleFile,
} from "@/config/api";
import { ALL_PERMISSIONS } from "@/config/permissions";
import useAccess from "@/hooks/useAccess";
import { useAppSelector } from "@/redux/hooks";
import { useSectionsByDepartmentQuery } from "@/hooks/useSections";
import {
    useAccountingDossiersQuery,
    useAccountingDossiersPendingMyApprovalQuery,
    useCreateAccountingDossierMutation,
    useDeleteAccountingDossierMutation,
    useAccountingDossierLogsQuery,
    useRequestReturnAccountingDossierMutation,
    useUpdateAccountingDossierMutation,
    useSubmitAccountingDossierMutation,
    useAccountingDossierApprovalStepsQuery,
    useApproveAccountingDossierMutation,
    useRejectAccountingDossierMutation,
    useTerminateAccountingDossierMutation,
    useHandleReturnResponseAccountingDossierMutation,
    useAccountingDossierByIdQuery,
    useBulkApproveAccountingDossiersMutation,
    useBulkCheckDossierDocumentsMutation,
    useRejectAccountingDossierTemplateSyncMutation,
    useArchiveAccountingDossierMutation,
} from "@/hooks/useAccountingDossiers";
import type {
    AccountingDossierCategoryMode,
    AccountingDossierDocumentType,
    AccountingDossierStatus,
    IAccountingDossier,
    IAccountingDossierCategory,
    IAccountingDossierCategoryRequest,
    IAccountingDossierAuditLog,
    IAccountingDossierApprovalStep,
    IAccountingDocumentCategory,
    IAccountingDossierRequest,
    ICompany,
    IUser,
} from "@/types/backend";
import DossierDocumentList from "./components/DossierDocumentList";
import { notify } from "@/components/common/notification/notify";
import {
    type DossierFormValues,
    type SubmitApprovalStep,
    type TemplateFormValues,
    buildPayload,
    formatDateTime,
    splitFileUrls,
    getFileDisplayName,
    inferDocumentNameFromFile,
    normalizeSearchText,
    isInvoiceCategory
} from "./dossierUtils";

// Types moved to dossierUtils.ts

import {
    PAGE_SIZE_OPTIONS,
    statusMeta,
    auditActionMeta,
    targetTypeLabel,
    getAuditActionMeta,
    getApproverTypeLabel,
    getApprovalStepStatusMeta,
    getUserDisplayName,
    userHasRoleKeyword,
    getApproverOptions,
    getApprovalActorDisplay,
    TAG_STYLE,
    SectionHeading,
    Field,
    getAuditStatusLabel,
    renderAuditChange,
    buildAuditTimelineItem,
    RangePicker
} from "./dossierMeta";
import {
    editableStatuses,
    returnRequestableStatuses,
    getDossierViewerContext
} from "./dossierContext";
import type { DossierPerms, DossierContext } from "./dossierContext";



import AccountingDossierModal from "./components/AccountingDossierModal";

// TemplateFormValues moved to dossierUtils.ts

import DossierTemplateDrawer from "./components/DossierTemplateDrawer";

const AccountingDossierPage = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [keyword, setKeyword] = useState("");
    const [modalOpen, setModalOpen] = useState(false);
    const [templateDrawerOpen, setTemplateDrawerOpen] = useState(false);
    const [editingDossier, setEditingDossier] = useState<IAccountingDossier | null>(null);
    const [logDossier, setLogDossier] = useState<IAccountingDossier | null>(null);
    const [companies, setCompanies] = useState<ICompany[]>([]);
    const [viewDossier, setViewDossier] = useState<IAccountingDossier | null>(null);
    const [approvalHistoryOpen, setApprovalHistoryOpen] = useState(false);
    const [activeTabKey, setActiveTabKey] = useState<string>("ALL");
    const [storageStatusFilter, setStorageStatusFilter] = useState<string | undefined>();
    const [departmentFilter, setDepartmentFilter] = useState<number | undefined>();
    const [retentionDateFilter, setRetentionDateFilter] = useState<dayjs.Dayjs | null>(null);
    const [companyFilter, setCompanyFilter] = useState<number | undefined>();
    const [categoryFilter, setCategoryFilter] = useState<number | undefined>();
    const [createdRange, setCreatedRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null);
    const [activeDossierCategories, setActiveDossierCategories] = useState<IAccountingDossierCategory[]>([]);

    const user = useAppSelector((state) => state.account.user);
    const isSuperAdmin = (user.role?.name?.toUpperCase() || "") === "SUPER_ADMIN";

    // Quyền thao tác: đọc từ permission role thực sự nắm (khớp endpoint backend), không đoán qua tên role.
    const perms: DossierPerms = {
        approve: useAccess(ALL_PERMISSIONS.ACCOUNTING_DOSSIERS.APPROVE),
        reject: useAccess(ALL_PERMISSIONS.ACCOUNTING_DOSSIERS.REJECT),
        terminate: useAccess(ALL_PERMISSIONS.ACCOUNTING_DOSSIERS.TERMINATE),
        archive: useAccess(ALL_PERMISSIONS.ACCOUNTING_DOSSIERS.ARCHIVE),
        requestReturn: useAccess(ALL_PERMISSIONS.ACCOUNTING_DOSSIERS.REQUEST_RETURN),
        returnResponse: useAccess(ALL_PERMISSIONS.ACCOUNTING_DOSSIERS.RETURN_RESPONSE),
        checkDoc: useAccess(ALL_PERMISSIONS.ACCOUNTING_DOSSIERS.CHECK_DOCUMENT),
        rejectSync: useAccess(ALL_PERMISSIONS.ACCOUNTING_DOSSIERS.SYNC_TEMPLATE_REJECT),
    };

    // Có tham gia luồng duyệt: có bất kỳ quyền duyệt/kiểm tra nào → hiện tab "Chờ tôi duyệt".
    const isApproverRole = isSuperAdmin || perms.approve || perms.reject || perms.terminate || perms.checkDoc || perms.returnResponse;

    const [viewMode, setViewMode] = useState<"MY_TASKS" | "ALL_DOSSIERS">("MY_TASKS");
    const [myTasksTab, setMyTasksTab] = useState<"PENDING_ME" | "CREATED_BY_ME">("PENDING_ME");

    useEffect(() => {
        if (!isApproverRole) {
            setViewMode("MY_TASKS");
            setMyTasksTab("CREATED_BY_ME");
        } else {
            setViewMode("MY_TASKS");
            setMyTasksTab("PENDING_ME");
        }
    }, [isApproverRole]);

    const isPendingMeMode = viewMode === "MY_TASKS" && myTasksTab === "PENDING_ME";

    const query = useMemo(
        () => {
            const filters: string[] = [];
            
            if (viewMode === "MY_TASKS" && myTasksTab === "CREATED_BY_ME") {
                filters.push(`creatorId:${user.id}`);
            }

            if (viewMode === "ALL_DOSSIERS" || (viewMode === "MY_TASKS" && myTasksTab === "CREATED_BY_ME")) {
                if (activeTabKey === "DRAFT") {
                    filters.push("status='DRAFT'");
                } else if (activeTabKey === "PENDING") {
                    filters.push("(status='SUBMITTED' or status='IN_REVIEW' or status='RETURN_REQUESTED')");
                } else if (activeTabKey === "RETURNED") {
                    filters.push("status='RETURNED'");
                } else if (activeTabKey === "APPROVED") {
                    filters.push("(status='APPROVED' or status='ARCHIVED')");
                } else if (activeTabKey === "REJECTED") {
                    filters.push("(status='REJECTED' or status='TERMINATED')");
                }
            }

            if (companyFilter) filters.push(`company.id:${companyFilter}`);
            if (categoryFilter) filters.push(`dossierCategory.id:${categoryFilter}`);
            if (createdRange) {
                filters.push(`createdAt>='${createdRange[0].startOf("day").toISOString()}'`);
                filters.push(`createdAt<='${createdRange[1].endOf("day").toISOString()}'`);
            }
            const filterQuery = filters.length > 0 ? `&filter=${filters.join(" and ")}` : "";
            let queryStr = `page=${page}&size=${pageSize}&sort=createdAt,desc${filterQuery}`;
            if (storageStatusFilter) queryStr += `&storageStatus=${storageStatusFilter}`;
            if (departmentFilter) queryStr += `&departmentId=${departmentFilter}`;
            if (retentionDateFilter) {
                queryStr += `&retentionYear=${retentionDateFilter.year()}&retentionMonth=${retentionDateFilter.month() + 1}&retentionDay=${retentionDateFilter.date()}`;
            }
            return queryStr;
        },
        [categoryFilter, companyFilter, createdRange, page, pageSize, activeTabKey, storageStatusFilter, departmentFilter, retentionDateFilter, viewMode, myTasksTab, user.id]
    );

    const { data: deptsData } = useDepartmentsByCompanyQuery(companyFilter || 0);
    const departments = deptsData || [];

    const { data: allData, isFetching: isFetchingAll, refetch: refetchAll } = useAccountingDossiersQuery(query, { enabled: !isPendingMeMode });
    const { data: pendingData, isFetching: isFetchingPending, refetch: refetchPending } = useAccountingDossiersPendingMyApprovalQuery(query, { enabled: isPendingMeMode });
    const { data: myPendingData, refetch: refetchMyPending } = useAccountingDossiersPendingMyApprovalQuery("pageSize:100", { enabled: isApproverRole });

    const pendingIds = useMemo(() => new Set(myPendingData?.result?.map(d => d.id).filter(Boolean) || []), [myPendingData]);

    const data = isPendingMeMode ? pendingData : allData;
    const isFetching = isPendingMeMode ? isFetchingPending : isFetchingAll;
    const refetch = () => {
        if (isPendingMeMode) {
            refetchPending();
        } else {
            refetchAll();
        }
        if (isApproverRole) {
            refetchMyPending();
        }
    };

    const createMutation = useCreateAccountingDossierMutation();
    const updateMutation = useUpdateAccountingDossierMutation();
    const deleteMutation = useDeleteAccountingDossierMutation();
    const submitMutation = useSubmitAccountingDossierMutation();
    const requestReturnMutation = useRequestReturnAccountingDossierMutation();
    const { data: logs = [], isFetching: loadingLogs } = useAccountingDossierLogsQuery(logDossier?.id);
    const { data: approvalSteps = [] } = useAccountingDossierApprovalStepsQuery(viewDossier?.id);
    const approveMutation = useApproveAccountingDossierMutation();
    const rejectMutation = useRejectAccountingDossierMutation();
    const terminateMutation = useTerminateAccountingDossierMutation();
    const returnResponseMutation = useHandleReturnResponseAccountingDossierMutation();
    const archiveMutation = useArchiveAccountingDossierMutation();
    const rejectSyncMutation = useRejectAccountingDossierTemplateSyncMutation();
    
    const { data: currentDossier } = useAccountingDossierByIdQuery(viewDossier?.id);
    const routeDossierId = Number(searchParams.get("dossierId") || "");
    const { data: routeDossier } = useAccountingDossierByIdQuery(routeDossierId || undefined);
    const bulkApproveMutation = useBulkApproveAccountingDossiersMutation();
    const bulkCheckDocsMutation = useBulkCheckDossierDocumentsMutation();

    useEffect(() => {
        setApprovalHistoryOpen(false);
    }, [viewDossier?.id]);

    const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

    const [actionModal, setActionModal] = useState<{
        open: boolean;
        type: "APPROVE" | "REJECT" | "TERMINATE" | "REQUEST_RETURN" | "RETURN_ACCEPT" | "RETURN_REJECT" | "ARCHIVE" | "REJECT_SYNC";
        dossierId: number;
    } | null>(null);
    const [actionNote, setActionNote] = useState("");

    useEffect(() => {
        if (!routeDossier) return;
        setViewDossier(routeDossier);
        setSearchParams((prev) => {
            const next = new URLSearchParams(prev);
            next.delete("dossierId");
            return next;
        }, { replace: true });
    }, [routeDossier, setSearchParams]);

    const handleConfirmAction = async () => {
        if (!actionModal) return;
        const { type, dossierId } = actionModal;

        if ((type === "REJECT" || type === "TERMINATE") && !actionNote.trim()) {
            notify.error("Lý do thực hiện hành động này là bắt buộc.");
            return;
        }

        try {
            if (type === "APPROVE") {
                await approveMutation.mutateAsync({ id: dossierId, note: actionNote });
            } else if (type === "REJECT") {
                await rejectMutation.mutateAsync({ id: dossierId, note: actionNote });
            } else if (type === "TERMINATE") {
                await terminateMutation.mutateAsync({ id: dossierId, note: actionNote });
            } else if (type === "REQUEST_RETURN") {
                await requestReturnMutation.mutateAsync({ id: dossierId, note: actionNote });
            } else if (type === "RETURN_ACCEPT") {
                await returnResponseMutation.mutateAsync({ id: dossierId, action: "ACCEPT", note: actionNote });
            } else if (type === "RETURN_REJECT") {
                await returnResponseMutation.mutateAsync({ id: dossierId, action: "REJECT", note: actionNote });
            } else if (type === "ARCHIVE") {
                await archiveMutation.mutateAsync({ id: dossierId, note: actionNote });
            } else if (type === "REJECT_SYNC") {
                await rejectSyncMutation.mutateAsync({ id: dossierId, note: actionNote });
            }

            setActionModal(null);
            setActionNote("");
            refetch();
        } catch (err) {
            // Already handled
        }
    };

    const [submitDossierId, setSubmitDossierId] = useState<number | null>(null);
    const [customSteps, setCustomSteps] = useState<SubmitApprovalStep[]>([]);
    const [usersList, setUsersList] = useState<IUser[]>([]);

    useEffect(() => {
        callFetchCompany("page=1&size=200&sort=name,asc")
            .then((res) => setCompanies((res as any)?.data?.result || []))
            .catch(() => setCompanies([]));
        callFetchAccountingDossierCategoryActive()
            .then((res) => setActiveDossierCategories((res as any)?.data || []))
            .catch(() => setActiveDossierCategories([]));
        callFetchUser("page=1&size=500&sort=email,asc")
            .then((res) => setUsersList((res as any)?.data?.result || []))
            .catch(() => setUsersList([]));
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
                                documentType: doc.documentType || "OTHER",
                                fileUrl: doc.fileUrl,
                                externalLink: doc.externalLink,
                                invoiceDate: doc.invoiceDate ? doc.invoiceDate.toISOString() : undefined,
                                invoiceNumber: doc.invoiceNumber,
                                invoiceContent: doc.invoiceContent,
                                partnerName: doc.partnerName,
                                partnerType: doc.partnerType,
                                amount: doc.amount,
                                currency: doc.currency || "VND",
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
            render: (status: AccountingDossierStatus, record) => {
                const meta = statusMeta[status] || { label: status, color: "default" };
                const isPendingMe = pendingIds.has(record.id!);
                return (
                    <Space direction="vertical" size={2} style={{ display: "flex", alignItems: "center" }}>
                        <Tag color={meta.color} style={{ minWidth: 100, textAlign: "center", margin: 0 }}>
                            {meta.label}
                        </Tag>
                        {isPendingMe && (
                            <Tag color="warning" style={{ minWidth: 100, textAlign: "center", margin: 0 }}>
                                Chờ bạn duyệt
                            </Tag>
                        )}
                    </Space>
                );
            },
        },
        {
            title: "Lưu trữ",
            width: 140,
            render: (_, record) =>
                record.storageStatus === "EXPIRED" ? (
                    <Tag color="red" style={{ minWidth: 80, textAlign: "center", margin: 0 }}>Hết hạn</Tag>
                ) : record.storageStatus === "ARCHIVED" || record.status === "ARCHIVED" ? (
                    <Tag color="purple" style={{ minWidth: 80, textAlign: "center", margin: 0 }}>Lưu kho</Tag>
                ) : (
                    <Tag color="green" style={{ minWidth: 80, textAlign: "center", margin: 0 }}>Trong hạn</Tag>
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
            width: 140,
            render: (_, record) => {
                const isCreator = user?.id === record.creatorId;
                const canEdit = editableStatuses.includes(record.status) && isCreator;
                const canRequestReturn = returnRequestableStatuses.includes(record.status) && isCreator;

                const canApproveQuick = isPendingMeMode && ["SUBMITTED", "IN_REVIEW"].includes(record.status);
                const canRejectQuick = isPendingMeMode && ["SUBMITTED", "IN_REVIEW"].includes(record.status);
                const canTerminateQuick = isPendingMeMode && (perms.terminate || isSuperAdmin) && ["SUBMITTED", "IN_REVIEW"].includes(record.status);
                const canArchiveQuick = record.status === "APPROVED" && (perms.archive || isSuperAdmin);

                const menuItems = [];

                if (canApproveQuick) {
                    menuItems.push({
                        key: "approve",
                        label: "Phê duyệt nhanh",
                        onClick: () => setActionModal({ open: true, type: "APPROVE", dossierId: record.id! })
                    });
                }
                if (canRejectQuick) {
                    menuItems.push({
                        key: "reject",
                        label: "Từ chối nhanh",
                        danger: true,
                        onClick: () => setActionModal({ open: true, type: "REJECT", dossierId: record.id! })
                    });
                }
                if (canRequestReturn) {
                    menuItems.push({
                        key: "request-return",
                        label: "Yêu cầu hoàn trả",
                        onClick: () => {
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
                        }
                    });
                }
                if (canEdit) {
                    menuItems.push({
                        key: "submit",
                        label: "Chuyển chứng từ",
                        onClick: () => {
                            if (record.id) {
                                setSubmitDossierId(record.id);
                                setCustomSteps([
                                    { stepOrder: 1, stepName: "Trưởng bộ phận duyệt", approverType: "DEPARTMENT_MANAGER", approverUserId: undefined },
                                    { stepOrder: 2, stepName: "Kế toán kiểm tra", approverType: "ACCOUNTANT", approverUserId: undefined },
                                    { stepOrder: 3, stepName: "Kế toán trưởng duyệt", approverType: "CHIEF_ACCOUNTANT", approverUserId: undefined }
                                ]);
                            }
                        }
                    });
                    menuItems.push({
                        key: "edit",
                        label: "Chỉnh sửa",
                        onClick: () => handleOpenEdit(record)
                    });
                }

                menuItems.push({
                    key: "logs",
                    label: "Nhật ký lịch sử",
                    onClick: () => setLogDossier(record)
                });

                if (canTerminateQuick) {
                    menuItems.push({
                        key: "terminate",
                        label: "Chấm dứt xử lý",
                        danger: true,
                        onClick: () => setActionModal({ open: true, type: "TERMINATE", dossierId: record.id! })
                    });
                }

                if (canArchiveQuick) {
                    menuItems.push({
                        key: "archive",
                        label: "Đưa vào lưu trữ",
                        onClick: () => setActionModal({ open: true, type: "ARCHIVE", dossierId: record.id! })
                    });
                }

                if (canEdit) {
                    menuItems.push({
                        key: "delete",
                        label: "Xóa cứng",
                        danger: true,
                        onClick: () => {
                            Modal.confirm({
                                title: "Xác nhận xoá bộ chứng từ?",
                                content: "Hành động này không thể hoàn tác.",
                                okText: "Xoá",
                                okButtonProps: { danger: true },
                                cancelText: "Hủy",
                                onOk: () => record.id && deleteMutation.mutate(record.id)
                            });
                        }
                    });
                }

                return (
                    <Space size="small">
                        <Tooltip title="Xem chi tiết">
                            <Button
                                data-guide-id="accounting-dossier-detail-button"
                                type="text"
                                size="small"
                                icon={<EyeOutlined style={{ color: "#1677ff", fontSize: 16 }} />}
                                onClick={() => setViewDossier(record)}
                            />
                        </Tooltip>
                        {menuItems.length > 0 && (
                            <Dropdown menu={{ items: menuItems }} trigger={["click"]}>
                                <Button
                                    type="text"
                                    size="small"
                                    icon={<MoreOutlined style={{ fontSize: 16, color: "#595959" }} />}
                                />
                            </Dropdown>
                        )}
                    </Space>
                );
            },
        },
    ];

    const filter = (
        <div className="flex w-full flex-col gap-3">
            <SearchFilter
                searchPlaceholder="Tìm mã, nội dung, đơn vị"
                showFilterButton={false}
                showAddButton={true}
                showResetButton={true}
                onSearch={setKeyword}
                onReset={() => {
                    setKeyword("");
                    setActiveTabKey("ALL");
                    setCompanyFilter(undefined);
                    setCategoryFilter(undefined);
                    setStorageStatusFilter(undefined);
                    setDepartmentFilter(undefined);
                    setRetentionDateFilter(null);
                    setCreatedRange(null);
                    setPage(1);
                    refetch();
                }}
                addLabel="Tạo bộ chứng từ"
                onAddClick={handleOpenCreate}
                addPermission={ALL_PERMISSIONS.ACCOUNTING_DOSSIERS.CREATE}
                guideSearchId="accounting-dossier-search-input"
                guideAddId="accounting-dossier-add-button"
                extraButtons={
                    <Access permission={ALL_PERMISSIONS.ACCOUNTING_DOSSIERS.CREATE} hideChildren>
                        <Button
                            style={{ height: 40, borderRadius: 10, fontSize: 14 }}
                            onClick={() => setTemplateDrawerOpen(true)}
                        >
                            Mẫu bộ chứng từ
                        </Button>
                    </Access>
                }
            />
            <Space wrap>
                <Select
                    allowClear
                    showSearch
                    placeholder="Công ty"
                    optionFilterProp="label"
                    style={{ width: 240 }}
                    value={companyFilter}
                    onChange={(value) => {
                        setCompanyFilter(value);
                        setPage(1);
                    }}
                    options={companies.map((company) => ({
                        value: company.id,
                        label: company.name,
                    }))}
                />
                <Select
                    allowClear
                    placeholder="Lưu trữ"
                    style={{ width: 140 }}
                    value={storageStatusFilter}
                    onChange={(value) => {
                        setStorageStatusFilter(value);
                        setPage(1);
                    }}
                    options={[
                        { label: "Đang lưu trữ", value: "IN_RETENTION" },
                        { label: "Hết hạn", value: "EXPIRED" },
                        { label: "Lưu kho", value: "ARCHIVED" },
                    ]}
                />
                <DatePicker
                    placeholder="Ngày lưu trữ"
                    format="DD/MM/YYYY"
                    value={retentionDateFilter}
                    onChange={(value) => {
                        setRetentionDateFilter(value as dayjs.Dayjs | null);
                        setPage(1);
                    }}
                    style={{ width: 140 }}
                />
                <Select
                    allowClear
                    showSearch
                    placeholder="Phòng ban"
                    optionFilterProp="label"
                    style={{ width: 180 }}
                    value={departmentFilter}
                    onChange={(value) => {
                        setDepartmentFilter(value);
                        setPage(1);
                    }}
                    options={departments.map((dept: any) => ({
                        value: dept.id,
                        label: dept.name,
                    }))}
                />
                <Select
                    allowClear
                    showSearch
                    placeholder="Mẫu bộ chứng từ"
                    optionFilterProp="label"
                    style={{ width: 260 }}
                    value={categoryFilter}
                    onChange={(value) => {
                        setCategoryFilter(value);
                        setPage(1);
                    }}
                    options={activeDossierCategories.map((category) => ({
                        value: category.id,
                        label: category.categoryName,
                    }))}
                />
                <RangePicker
                    value={createdRange}
                    format="DD/MM/YYYY"
                    onChange={(value) => {
                        setCreatedRange(value as [dayjs.Dayjs, dayjs.Dayjs] | null);
                        setPage(1);
                    }}
                />
            </Space>
        </div>
    );

    return (
        <PageContainer title="Bộ chứng từ kế toán" filter={filter}>
            {isApproverRole && (
                <div style={{ marginBottom: 20, display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #f0f0f0", paddingBottom: 10 }}>
                    <div style={{ display: "flex", gap: 16 }}>
                        <Button
                            type="default"
                            onClick={() => {
                                setViewMode("MY_TASKS");
                                setPage(1);
                            }}
                            style={{ 
                                fontWeight: 600, 
                                borderRadius: 6,
                                background: viewMode === "MY_TASKS" ? "#E8356D" : "#ffffff",
                                color: viewMode === "MY_TASKS" ? "#ffffff" : "#636366",
                                borderColor: viewMode === "MY_TASKS" ? "#E8356D" : "#d9d9d9",
                            }}
                        >
                            Việc của tôi
                        </Button>
                        <Button
                            type="default"
                            onClick={() => {
                                setViewMode("ALL_DOSSIERS");
                                setPage(1);
                            }}
                            style={{ 
                                fontWeight: 600, 
                                borderRadius: 6,
                                background: viewMode === "ALL_DOSSIERS" ? "#E8356D" : "#ffffff",
                                color: viewMode === "ALL_DOSSIERS" ? "#ffffff" : "#636366",
                                borderColor: viewMode === "ALL_DOSSIERS" ? "#E8356D" : "#d9d9d9",
                            }}
                        >
                            Tất cả bộ chứng từ
                        </Button>
                    </div>
                </div>
            )}

            {viewMode === "MY_TASKS" && isApproverRole && (
                <div style={{ marginBottom: 16 }}>
                    <TabBar
                        activeKey={myTasksTab}
                        onChange={(key) => {
                            setMyTasksTab(key as any);
                            setPage(1);
                        }}
                        tabs={[
                            { key: "PENDING_ME", label: "Cần tôi phê duyệt / kiểm tra", icon: <ClockCircleOutlined /> },
                            { key: "CREATED_BY_ME", label: "Bộ chứng từ tôi đã tạo", icon: <FileTextOutlined /> },
                        ]}
                    />
                </div>
            )}

            {(viewMode === "ALL_DOSSIERS" || (viewMode === "MY_TASKS" && myTasksTab === "CREATED_BY_ME")) && (
                <div style={{ marginBottom: 16 }}>
                    <TabBar
                        activeKey={activeTabKey}
                        onChange={(key) => {
                            setActiveTabKey(key);
                            setPage(1);
                        }}
                        tabs={[
                            { key: "ALL", label: "Tất cả", icon: <AppstoreOutlined /> },
                            { key: "DRAFT", label: "Bản nháp", icon: <FileTextOutlined /> },
                            { key: "PENDING", label: "Đang chờ duyệt", icon: <ClockCircleOutlined /> },
                            { key: "RETURNED", label: "Cần bổ sung (Bị trả về)", icon: <RollbackOutlined /> },
                            { key: "APPROVED", label: "Đã duyệt / Lưu trữ", icon: <CheckCircleOutlined /> },
                            { key: "REJECTED", label: "Từ chối / Chấm dứt", icon: <CloseCircleOutlined /> },
                        ]}
                    />
                </div>
            )}
            {selectedRowKeys.length > 0 && (
                <div style={{ marginBottom: 12, display: "flex", gap: 8, alignItems: "center" }}>
                    <span style={{ color: "#555" }}>
                        Đã chọn <strong>{selectedRowKeys.length}</strong> bộ chứng từ
                    </span>
                    <Popconfirm
                        title={`Duyệt ${selectedRowKeys.length} bộ chứng từ đã chọn?`}
                        description="Thao tác này sẽ duyệt hàng loạt bộ chứng từ đang ở bước phê duyệt của bạn."
                        okText="Duyệt hàng loạt"
                        cancelText="Hủy"
                        onConfirm={async () => {
                            await bulkApproveMutation.mutateAsync({ ids: selectedRowKeys.map(Number) });
                            setSelectedRowKeys([]);
                        }}
                    >
                        <Button
                            type="primary"
                            icon={<CheckCircleOutlined />}
                            loading={bulkApproveMutation.isPending}
                        >
                            Duyệt hàng loạt
                        </Button>
                    </Popconfirm>
                    <Button onClick={() => setSelectedRowKeys([])} size="small">
                        Bỏ chọn tất cả
                    </Button>
                </div>
            )}
            <Table<IAccountingDossier>
                rowKey={(record) => String(record.id)}
                columns={columns}
                dataSource={rows}
                loading={isFetching || deleteMutation.isPending}
                scroll={{ x: 1550 }}
                rowSelection={{
                    selectedRowKeys,
                    onChange: (keys) => setSelectedRowKeys(keys),
                    getCheckboxProps: (record) => ({
                        disabled: record.status !== "SUBMITTED" && record.status !== "IN_REVIEW",
                    }),
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

            <Modal
                open={!!viewDossier}
                onCancel={() => setViewDossier(null)}
                width={860}
                centered
                destroyOnClose
                closeIcon={<CloseOutlined style={{ fontSize: 16 }} />}
                styles={{
                    content: { borderRadius: 12, overflow: "hidden", padding: 0 },
                    body: { padding: 0, maxHeight: "calc(100vh - 220px)", overflowY: "auto" },
                    header: { padding: "12px 20px 10px", marginBottom: 0, borderBottom: "0.5px solid #f0f0f0" },
                    footer: { padding: "10px 20px", borderTop: "0.5px solid #f0f0f0", marginTop: 0 },
                }}
                title={
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{ width: 34, height: 34, borderRadius: 6, background: "#e6f4ff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                            <FileTextOutlined style={{ fontSize: 15, color: "#1677ff" }} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ margin: 0, fontSize: 14, fontWeight: 600, color: "#1f2937" }}>Chi tiết bộ chứng từ</div>
                            <div style={{ fontSize: 12, fontWeight: 400, color: "#6b7280", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                {currentDossier?.content || viewDossier?.content || "---"}
                            </div>
                        </div>
                    </div>
                }
                footer={(() => {
                    const activeDossier = currentDossier || viewDossier;
                    if (!activeDossier) return null;
                    const ctx = getDossierViewerContext(user, activeDossier, approvalSteps, perms);

                    const footerButtons = [];

                    footerButtons.push(
                        <Button key="close" onClick={() => setViewDossier(null)} style={{ borderRadius: 3, fontSize: 13 }}>
                            Đóng
                        </Button>
                    );

                    if (ctx.canApprove) {
                        footerButtons.push(
                            <Button
                                key="reject"
                                danger
                                onClick={() => setActionModal({ open: true, type: "REJECT", dossierId: activeDossier.id! })}
                                style={{ borderRadius: 3, fontSize: 13 }}
                            >
                                Từ chối
                            </Button>,
                            <Button
                                key="approve"
                                type="primary"
                                onClick={() => setActionModal({ open: true, type: "APPROVE", dossierId: activeDossier.id! })}
                                style={{ borderRadius: 3, fontSize: 13 }}
                            >
                                Phê duyệt
                            </Button>
                        );
                    }

                    if (ctx.canRequestReturn) {
                        footerButtons.push(
                            <Button
                                key="request-return"
                                onClick={() => setActionModal({ open: true, type: "REQUEST_RETURN", dossierId: activeDossier.id! })}
                                style={{ borderRadius: 3, fontSize: 13 }}
                            >
                                Yêu cầu hoàn trả
                            </Button>
                        );
                    }

                    if (activeDossier.status === "RETURN_REQUESTED" && (ctx.isCurrentApprover || ctx.isSuperAdmin)) {
                        footerButtons.push(
                            <Button
                                key="return-reject"
                                danger
                                onClick={() => setActionModal({ open: true, type: "RETURN_REJECT", dossierId: activeDossier.id! })}
                                style={{ borderRadius: 3, fontSize: 13 }}
                            >
                                Từ chối yêu cầu hoàn
                            </Button>,
                            <Button
                                key="return-accept"
                                type="primary"
                                onClick={() => setActionModal({ open: true, type: "RETURN_ACCEPT", dossierId: activeDossier.id! })}
                                style={{ borderRadius: 3, fontSize: 13 }}
                            >
                                Đồng ý hoàn trả
                            </Button>
                        );
                    }

                    if (ctx.canTerminate) {
                        footerButtons.push(
                            <Button
                                key="terminate"
                                danger
                                type="primary"
                                onClick={() => setActionModal({ open: true, type: "TERMINATE", dossierId: activeDossier.id! })}
                                style={{ borderRadius: 3, fontSize: 13 }}
                            >
                                Chấm dứt xử lý
                            </Button>
                        );
                    }

                    if (ctx.canArchive) {
                        footerButtons.push(
                            <Button
                                key="archive"
                                type="primary"
                                onClick={() => setActionModal({ open: true, type: "ARCHIVE", dossierId: activeDossier.id! })}
                                style={{ borderRadius: 3, fontSize: 13, backgroundColor: "#722ed1", borderColor: "#722ed1" }}
                            >
                                Đưa vào lưu trữ
                            </Button>
                        );
                    }

                    if (ctx.canRejectSync) {
                        footerButtons.push(
                            <Button
                                key="reject-sync"
                                danger
                                onClick={() => setActionModal({ open: true, type: "REJECT_SYNC", dossierId: activeDossier.id! })}
                                style={{ borderRadius: 3, fontSize: 13 }}
                            >
                                Từ chối đồng bộ mẫu
                            </Button>
                        );
                    }

                    return <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>{footerButtons}</div>;
                })()}
            >
                {(currentDossier || viewDossier) && (
                    (() => {
                        const activeDossier = currentDossier || viewDossier;
                        if (!activeDossier) return null;
                        const ctx = getDossierViewerContext(user, activeDossier, approvalSteps, perms);
                        const canViewApprovalProgress = ctx.isSuperAdmin || ctx.isCreator || ctx.isAssignedApprover || perms.approve || perms.reject || perms.terminate;
                        const canReviewChildDocuments = ctx.canReviewChildDocs;
                        const currentStep = approvalSteps.find((s) => s.status === "CURRENT");
                        const currentStepHint = currentStep?.approverType === "DEPARTMENT_MANAGER"
                            ? "Bước hiện tại là Trưởng bộ phận: chỉ duyệt/từ chối bộ hồ sơ tổng, chưa kiểm tra từng chứng từ con."
                            : currentStep?.approverType === "ACCOUNTANT"
                                ? "Bước hiện tại là Kế toán: kiểm tra từng chứng từ con, đánh dấu hợp lệ/cần bổ sung rồi phê duyệt."
                                : currentStep?.approverType === "CHIEF_ACCOUNTANT"
                                    ? "Bước hiện tại là Kế toán trưởng: duyệt cuối bộ hồ sơ sau khi kế toán đã kiểm tra chứng từ."
                                    : undefined;
                        return (
                            <div style={{ display: "flex", flexDirection: "row", alignItems: "flex-start", padding: "16px 20px 18px 24px" }}>
                                <div style={{ flex: 1, minWidth: 0 }}>

                                    <SectionHeading icon={<ApartmentOutlined />} label="Thông tin chung" />

                                    {/* Tên bộ chứng từ */}
                                    <div style={{ marginBottom: 12 }}>
                                        <div style={{ fontSize: 10, color: "#9ca3af", fontWeight: 500, display: "block", marginBottom: 3 }}>
                                            Nội dung bộ chứng từ
                                        </div>
                                        <div style={{ fontSize: 15, fontWeight: 600, color: "#111827" }}>
                                            {activeDossier.content || "--"}
                                        </div>
                                    </div>

                                    {/* Row 1: Trạng thái, Mã, Danh mục */}
                                    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: "10px 16px", marginBottom: 12 }}>
                                        <Field label="Trạng thái">
                                            <Tag color={statusMeta[activeDossier.status]?.color || "default"} style={TAG_STYLE}>
                                                {statusMeta[activeDossier.status]?.label || activeDossier.status}
                                            </Tag>
                                        </Field>
                                        <Field label="Mã bộ chứng từ">
                                            {activeDossier.dossierCode ? (
                                                <Tooltip title={activeDossier.dossierCode}>
                                                    <Tag color="blue" style={{ ...TAG_STYLE, maxWidth: "100%", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", display: "inline-block" }}>
                                                        {activeDossier.dossierCode}
                                                    </Tag>
                                                </Tooltip>
                                            ) : (
                                                <span style={{ color: "#9ca3af" }}>--</span>
                                            )}
                                        </Field>
                                        <Field label="Loại chứng từ">
                                            <Tag color="purple" style={TAG_STYLE}>
                                                {activeDossier.categoryMode === "TEMPLATE" ? "Theo mẫu" : "Phi cấu trúc"}
                                            </Tag>
                                        </Field>
                                    </div>

                                    {/* Row 2: Công ty, Phòng ban, Danh mục */}
                                    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: "10px 16px", marginBottom: 16 }}>
                                        <Field label="Công ty">
                                            <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={activeDossier.company?.name}>
                                                {activeDossier.company?.name || "--"}
                                            </span>
                                        </Field>
                                        <Field label="Phòng ban">
                                            <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={activeDossier.department?.name}>
                                                {activeDossier.department?.name || "--"}
                                            </span>
                                        </Field>
                                        <Field label="Danh mục">
                                            {activeDossier.categoryMode === "TEMPLATE" ? activeDossier.dossierCategory?.name : (activeDossier.customCategoryName || "--")}
                                        </Field>
                                    </div>

                                    {currentStepHint && ["SUBMITTED", "IN_REVIEW"].includes(activeDossier.status) && (
                                        <div style={{
                                            border: "1px solid #c7d2fe",
                                            background: "linear-gradient(to right, #eff6ff, #f5f3ff)",
                                            color: "#3730a3",
                                            borderRadius: 10,
                                            padding: "10px 14px",
                                            fontSize: 13,
                                            fontWeight: 500,
                                            lineHeight: 1.4,
                                            marginBottom: 16,
                                        }}>
                                            {currentStepHint}
                                        </div>
                                    )}

                                    <div style={{ marginBottom: 14 }}>
                                        <SectionHeading icon={<FileTextOutlined />} label="Tài liệu đính kèm" />
                                        <div style={{ background: "#fafafa", borderRadius: 8, padding: 12, border: "1px solid #f0f0f0" }}>
                                            <DossierDocumentList
                                                dossier={activeDossier}
                                                editable={editableStatuses.includes(activeDossier.status)}
                                                reviewable={canReviewChildDocuments}
                                                variant="compact"
                                            />
                                        </div>
                                    </div>

                                    {approvalSteps && approvalSteps.length > 0 && (
                                        <div style={{ marginBottom: 14 }}>
                                            <SectionHeading icon={<CheckCircleOutlined />} label="Phê duyệt" />
                                            <div style={{
                                                display: "flex",
                                                flexDirection: "column",
                                                border: "1px solid #f0f0f0",
                                                borderRadius: 8,
                                                background: "#fafafa",
                                                padding: 12,
                                            }}>
                                                <div style={{
                                                    display: "flex",
                                                    alignItems: "center",
                                                    justifyContent: "space-between",
                                                    gap: 12,
                                                }}>
                                                    <div style={{ minWidth: 0, color: "#475569", fontSize: 13, lineHeight: 1.45 }}>
                                                        <strong style={{ color: "#0f172a", fontSize: 14 }}>{approvalSteps.length} bước duyệt</strong>
                                                        {currentStep ? (
                                                            <span style={{ color: "#64748b" }}> · Đang ở bước: <strong style={{ color: "#3b82f6" }}>{currentStep.stepName || getApproverTypeLabel(currentStep.approverType)}</strong></span>
                                                        ) : (
                                                            <span style={{ color: "#64748b" }}> · Đã có lịch sử xử lý</span>
                                                        )}
                                                    </div>
                                                    <Button
                                                        icon={<HistoryOutlined />}
                                                        onClick={() => setApprovalHistoryOpen(true)}
                                                        disabled={!canViewApprovalProgress}
                                                        size="small"
                                                        style={{ borderRadius: 6, fontWeight: 500, fontSize: 12 }}
                                                    >
                                                        Lịch sử duyệt
                                                    </Button>
                                                </div>
                                                <div style={{ display: "flex", gap: 6, marginTop: 12 }}>
                                                    {approvalSteps.map((step) => {
                                                        const isCurrent = step.status === "CURRENT";
                                                        const isApproved = step.status === "APPROVED";
                                                        const isRejected = step.status === "REJECTED" || step.status === "RETURNED";
                                                        let dotColor = "#e2e8f0"; // pending
                                                        if (isCurrent) dotColor = "#3b82f6";
                                                        if (isApproved) dotColor = "#22c55e";
                                                        if (isRejected) dotColor = "#ef4444";
                                                        return (
                                                            <Tooltip key={step.id} title={`${step.stepName || getApproverTypeLabel(step.approverType)} (${getApprovalStepStatusMeta(step.status).label})`}>
                                                                <div style={{
                                                                    height: 4,
                                                                    flex: 1,
                                                                    borderRadius: 9999,
                                                                    background: dotColor,
                                                                    transition: "all 0.3s ease",
                                                                    boxShadow: isCurrent ? "0 0 8px rgba(59, 130, 246, 0.5)" : "none",
                                                                }} />
                                                            </Tooltip>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })()
                )}
            </Modal>

            <Modal
                title={`Lịch sử duyệt${(currentDossier || viewDossier)?.dossierCode ? ` - ${(currentDossier || viewDossier)?.dossierCode}` : ""}`}
                open={approvalHistoryOpen}
                onCancel={() => setApprovalHistoryOpen(false)}
                footer={[
                    <Button key="close" onClick={() => setApprovalHistoryOpen(false)}>
                        Đóng
                    </Button>,
                ]}
                width={860}
            >
                <Table<IAccountingDossierApprovalStep>
                    rowKey="id"
                    size="small"
                    pagination={false}
                    dataSource={approvalSteps}
                    columns={[
                        {
                            title: "Bước",
                            width: 90,
                            render: (_, step) => <Tag style={{ margin: 0 }}>Bước {step.stepOrder}</Tag>,
                        },
                        {
                            title: "Nội dung",
                            dataIndex: "stepName",
                            render: (value, step) => (
                                <div>
                                    <div style={{ fontWeight: 650, color: "#111827" }}>
                                        {value || getApproverTypeLabel(step.approverType)}
                                    </div>
                                    <div style={{ color: "#64748b", fontSize: 12 }}>
                                        {getApproverTypeLabel(step.approverType)}
                                    </div>
                                </div>
                            ),
                        },
                        {
                            title: "Người duyệt / nick",
                            width: 250,
                            render: (_, step) => (
                                <div style={{ color: "#334155", fontWeight: 600, wordBreak: "break-word" }}>
                                    {getApprovalActorDisplay(step, usersList)}
                                </div>
                            ),
                        },
                        {
                            title: "Kết quả",
                            width: 130,
                            render: (_, step) => {
                                const status = getApprovalStepStatusMeta(step.status);
                                return <Tag color={status.color} style={{ margin: 0 }}>{status.label}</Tag>;
                            },
                        },
                        {
                            title: "Thời điểm",
                            width: 150,
                            render: (_, step) => step.actedAt ? dayjs(step.actedAt).format("DD/MM/YYYY HH:mm") : <span style={{ color: "#94a3b8" }}>Chưa xử lý</span>,
                        },
                        {
                            title: "Ý kiến",
                            dataIndex: "actionNote",
                            render: (value) => value || <span style={{ color: "#94a3b8" }}>-</span>,
                        },
                    ]}
                />
            </Modal>

            <Modal
                title={
                    actionModal?.type === "APPROVE" ? "Phê duyệt bộ chứng từ" :
                        actionModal?.type === "REJECT" ? "Từ chối bộ chứng từ" :
                            actionModal?.type === "TERMINATE" ? "Chấm dứt bộ chứng từ" :
                                actionModal?.type === "REQUEST_RETURN" ? "Yêu cầu hoàn trả bộ chứng từ" :
                                    actionModal?.type === "RETURN_ACCEPT" ? "Chấp nhận yêu cầu hoàn trả" :
                                        actionModal?.type === "RETURN_REJECT" ? "Từ chối yêu cầu hoàn trả" :
                                            actionModal?.type === "ARCHIVE" ? "Đưa bộ chứng từ vào lưu trữ" :
                                                "Từ chối đồng bộ danh mục mẫu"
                }
                open={!!actionModal?.open}
                onOk={handleConfirmAction}
                onCancel={() => {
                    setActionModal(null);
                    setActionNote("");
                }}
                okText="Xác nhận"
                cancelText="Hủy"
                confirmLoading={
                    approveMutation.isPending ||
                    rejectMutation.isPending ||
                    terminateMutation.isPending ||
                    requestReturnMutation.isPending ||
                    returnResponseMutation.isPending ||
                    archiveMutation.isPending ||
                    rejectSyncMutation.isPending
                }
            >
                <div style={{ padding: "10px 0" }}>
                    <p style={{ marginBottom: 8 }}>
                        {(actionModal?.type === "REJECT" || actionModal?.type === "TERMINATE") ? (
                            <span style={{ color: "red" }}>* Lý do thực hiện (Bắt buộc):</span>
                        ) : (
                            "Ý kiến / Lý do thực hiện (Tùy chọn):"
                        )}
                    </p>
                    <Input.TextArea
                        rows={4}
                        placeholder="Nhập nội dung ý kiến hoặc lý do thực hiện..."
                        value={actionNote}
                        onChange={(e) => setActionNote(e.target.value)}
                    />
                </div>
            </Modal>

            <Modal
                title="Xác nhận gửi duyệt bộ chứng từ"
                open={submitDossierId !== null}
                onCancel={() => {
                    setSubmitDossierId(null);
                    setCustomSteps([]);
                }}
                footer={[
                    <Button key="cancel" onClick={() => { setSubmitDossierId(null); setCustomSteps([]); }}>
                        Hủy
                    </Button>,
                    <Button
                        key="submit"
                        type="primary"
                        onClick={async () => {
                            if (submitDossierId) {
                                const missingApprover = customSteps.some((step) => !step.approverUserId);
                                if (missingApprover) {
                                    message.warning("Vui lòng chọn đủ người duyệt trước khi gửi");
                                    return;
                                }
                                await submitMutation.mutateAsync({ id: submitDossierId, customSteps });
                                setSubmitDossierId(null);
                                setCustomSteps([]);
                            }
                        }}
                        loading={submitMutation.isPending}
                        disabled={customSteps.length === 0 || customSteps.some((step) => !step.approverUserId)}
                    >
                        Xác nhận gửi duyệt
                    </Button>
                ]}
                width={720}
            >
                {(() => {
                    const dossierToSubmit = data?.result?.find((d) => d.id === submitDossierId);
                    const returnCount = dossierToSubmit?.returnCount || 0;
                    return (
                        <div style={{ padding: "10px 0" }}>
                            {returnCount >= 2 && (
                                <div style={{
                                    border: "1px solid #ffe58f",
                                    backgroundColor: "#fffbe6",
                                    padding: "10px 14px",
                                    borderRadius: 6,
                                    color: "#d46b08",
                                    fontSize: 13,
                                    marginBottom: 16,
                                    lineHeight: 1.45,
                                }}>
                                    <strong>Cảnh báo hoàn trả ({returnCount} lần):</strong> Bộ chứng từ này đã bị trả về {returnCount} lần. Theo quy định, nếu bị hoàn trả từ 3 lần trở đi, hệ thống sẽ tự động bắt buộc duyệt qua bước Trưởng bộ phận ở lần nộp tiếp theo để tăng cường chất lượng hồ sơ.
                                </div>
                            )}
                            <p style={{ color: "#5f6673", marginBottom: 18, lineHeight: 1.6 }}>
                                Chọn đúng người duyệt cho từng bước trước khi gửi. Hệ thống sẽ gửi bộ chứng từ tới đúng người được chọn và ghi nhận trong tiến trình phê duyệt.
                            </p>

                            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                                {customSteps.map((step, index) => (
                                    <div
                                        key={index}
                                        style={{
                                            display: "flex",
                                            alignItems: "flex-start",
                                            gap: 12,
                                            background: "#fafafa",
                                            padding: "14px 16px",
                                            borderRadius: 8,
                                            border: "1px solid #e8e8e8"
                                        }}
                                    >
                                        <div style={{ minWidth: 42 }}>
                                            <Tag color="blue" style={{ margin: 0 }}>Bước {index + 1}</Tag>
                                        </div>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ fontWeight: 600, fontSize: 15, color: "#1f2937" }}>
                                                {step.stepName}
                                            </div>
                                            <div style={{ marginTop: 4, color: "#6b7280", fontSize: 13 }}>
                                                {step.approverType === "DEPARTMENT_MANAGER" && "Chọn trưởng bộ phận/người quản lý sẽ duyệt bước đầu."}
                                                {step.approverType === "ACCOUNTANT" && "Chọn kế toán viên phụ trách kiểm tra chứng từ con."}
                                                {step.approverType === "CHIEF_ACCOUNTANT" && "Chọn kế toán trưởng duyệt cuối."}
                                            </div>
                                            <Select
                                                showSearch
                                                allowClear
                                                placeholder="Chọn người duyệt"
                                                value={step.approverUserId}
                                                optionFilterProp="label"
                                                style={{ width: "100%", marginTop: 10 }}
                                                options={getApproverOptions(usersList, step.approverType).map((approver) => ({
                                                    value: approver.id,
                                                    label: getUserDisplayName(approver),
                                                }))}
                                                onChange={(value) => {
                                                    setCustomSteps((prev) =>
                                                        prev.map((item, stepIndex) =>
                                                            stepIndex === index ? { ...item, approverUserId: value } : item
                                                        )
                                                    );
                                                }}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })()}
            </Modal>

            <Drawer
                title={
                    <div>
                        <div style={{ fontSize: 20, fontWeight: 800, color: "#1f2937" }}>
                            Nhật ký bộ chứng từ
                        </div>
                        <div style={{ marginTop: 4, fontSize: 13, color: "#6b7280", fontWeight: 500 }}>
                            {logDossier?.dossierCode || "Chưa cấp mã"} · {logs.length} thao tác
                        </div>
                    </div>
                }
                open={!!logDossier}
                onClose={() => setLogDossier(null)}
                width={680}
                styles={{
                    body: {
                        background: "#f6f8fb",
                        padding: "20px 22px 28px",
                    },
                }}
            >
                {loadingLogs ? (
                    <div style={{ padding: 24, textAlign: "center", color: "#6b7280" }}>Đang tải nhật ký...</div>
                ) : logs.length === 0 ? (
                    <div
                        style={{
                            padding: 28,
                            textAlign: "center",
                            background: "#fff",
                            border: "1px dashed #d9e0ea",
                            borderRadius: 12,
                            color: "#6b7280",
                        }}
                    >
                        Chưa có nhật ký cho bộ chứng từ này.
                    </div>
                ) : (
                    <Timeline
                        style={{ marginTop: 4 }}
                        items={logs.map(buildAuditTimelineItem)}
                    />
                )}
            </Drawer>
        </PageContainer>
    );
};

export default AccountingDossierPage;
