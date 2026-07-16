import { lazy, startTransition, Suspense, useEffect, useMemo, useRef, useState } from "react";
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
    Alert,
    Spin,
    Image,
    Badge,
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
    QrcodeOutlined,
    DownloadOutlined,
    ArrowRightOutlined,
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
    callFetchDossierDocuments,
    callFetchCompany,
    callToggleAccountingDossierCategoryActive,
    callUpdateAccountingDossierCategory,
    callFetchUsersCrossCompany,
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
    usePreviewWorkflowQuery,
    useClaimAccountingDossierMutation,
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
import DossierDocumentList from "./components/DossierDocumentList";




// TemplateFormValues moved to dossierUtils.ts

// Chỉ tải các khối thao tác nặng khi người dùng mở chúng.
const AccountingDossierModal = lazy(() => import("./components/AccountingDossierModal"));
const loadDossierTemplateDrawer = () => import("./components/DossierTemplateDrawer");
const DossierTemplateDrawer = lazy(loadDossierTemplateDrawer);

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
    const [qrDossier, setQrDossier] = useState<IAccountingDossier | null>(null);
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
    const currentRoleName = (user.role?.name || "").trim().toUpperCase().replace(/[\s-]+/g, "_");
    const isSuperAdmin = currentRoleName === "SUPER_ADMIN";
    const isEmployeeRole = currentRoleName === "EMPLOYEE";

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
    const canViewDossierDetail = useAccess(ALL_PERMISSIONS.ACCOUNTING_DOSSIERS.GET_BY_ID);
    const canUpdateDossier = useAccess(ALL_PERMISSIONS.ACCOUNTING_DOSSIERS.UPDATE);
    const canDeleteDossier = useAccess(ALL_PERMISSIONS.ACCOUNTING_DOSSIERS.DELETE);
    const canSubmitDossier = useAccess(ALL_PERMISSIONS.ACCOUNTING_DOSSIERS.SUBMIT);
    const canViewDossierLogs = useAccess(ALL_PERMISSIONS.ACCOUNTING_DOSSIERS.GET_LOGS);
    const canCreateDossierCategory = useAccess(ALL_PERMISSIONS.ACCOUNTING_DOSSIERS.CREATE_CATEGORY);
    const canUpdateDossierCategory = useAccess(ALL_PERMISSIONS.ACCOUNTING_DOSSIERS.UPDATE_CATEGORY);
    const canDeleteDossierCategory = useAccess(ALL_PERMISSIONS.ACCOUNTING_DOSSIERS.DELETE_CATEGORY);
    const canToggleDossierCategoryActive = useAccess(ALL_PERMISSIONS.ACCOUNTING_DOSSIERS.TOGGLE_CATEGORY_ACTIVE);
    const canCreateDossierDocument = useAccess(ALL_PERMISSIONS.ACCOUNTING_DOSSIERS.CREATE_DOCUMENT);
    const canUpdateDossierDocument = useAccess(ALL_PERMISSIONS.ACCOUNTING_DOSSIERS.UPDATE_DOCUMENT);
    const canDeleteDossierDocument = useAccess(ALL_PERMISSIONS.ACCOUNTING_DOSSIERS.DELETE_DOCUMENT);
    const canBulkApproveDossiers = useAccess(ALL_PERMISSIONS.ACCOUNTING_DOSSIERS.BULK_APPROVE);
    const canClaimDossier = useAccess(ALL_PERMISSIONS.ACCOUNTING_DOSSIERS.CLAIM);

    // Có tham gia luồng duyệt: có bất kỳ quyền duyệt/kiểm tra nào → hiện tab "Chờ tôi duyệt".
    const isApproverRole = !isEmployeeRole && (isSuperAdmin || perms.approve || perms.reject || perms.terminate || perms.checkDoc || perms.returnResponse);
    const canInspectFullApprovalFlow = !isEmployeeRole && (isApproverRole || isSuperAdmin);

    const [viewMode, setViewMode] = useState<"MY_TASKS" | "ALL_DOSSIERS">("MY_TASKS");
    const [myTasksTab, setMyTasksTab] = useState<"PENDING_ME" | "CREATED_BY_ME" | "INVOLVED_ME">("PENDING_ME");

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
            const queryParams: string[] = [];

            if (viewMode === "MY_TASKS" && myTasksTab === "CREATED_BY_ME" && user.id) {
                queryParams.push(`creatorId=${encodeURIComponent(user.id)}`);
            }
            if (viewMode === "MY_TASKS" && myTasksTab === "INVOLVED_ME" && user.id) {
                queryParams.push(`approverUserId=${encodeURIComponent(user.id)}`);
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
            const extraQuery = queryParams.length > 0 ? `&${queryParams.join("&")}` : "";
            let queryStr = `page=${page}&size=${pageSize}&sort=createdAt,desc&sort=id,desc${filterQuery}${extraQuery}`;
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
    const { data: myPendingData, refetch: refetchMyPending } = useAccountingDossiersPendingMyApprovalQuery("page=1&size=100&sort=createdAt,desc&sort=id,desc", { enabled: isApproverRole && !isPendingMeMode });

    const pendingIds = useMemo(() => {
        const list = isPendingMeMode ? pendingData?.result : myPendingData?.result;
        return new Set(list?.map(d => d.id).filter(Boolean) || []);
    }, [isPendingMeMode, pendingData, myPendingData]);

    const pendingMeCount = useMemo(() => {
        if (isPendingMeMode) {
            return pendingData?.meta?.total ?? pendingData?.result?.length ?? 0;
        }
        return myPendingData?.meta?.total ?? myPendingData?.result?.length ?? 0;
    }, [isPendingMeMode, pendingData, myPendingData]);

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
    const { data: qrDossierDetail, isFetching: loadingQrDossier } = useAccountingDossierByIdQuery(qrDossier?.id);
    const { data: editingDossierDetail } = useAccountingDossierByIdQuery(editingDossier?.id);
    const routeDossierId = Number(searchParams.get("dossierId") || "");
    const { data: routeDossier } = useAccountingDossierByIdQuery(routeDossierId || undefined);
    const bulkApproveMutation = useBulkApproveAccountingDossiersMutation();
    const bulkCheckDocsMutation = useBulkCheckDossierDocumentsMutation();

    useEffect(() => {
        setApprovalHistoryOpen(false);
    }, [viewDossier?.id]);

    const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

    useEffect(() => {
        setSelectedRowKeys([]);
    }, [viewMode, myTasksTab, activeTabKey, page, pageSize]);

    const [actionModal, setActionModal] = useState<{
        open: boolean;
        type: "APPROVE" | "REJECT" | "TERMINATE" | "REQUEST_RETURN" | "RETURN_ACCEPT" | "RETURN_REJECT" | "ARCHIVE" | "REJECT_SYNC";
        dossierId: number;
    } | null>(null);
    const [actionNote, setActionNote] = useState("");
    const [selectedNextApproverId, setSelectedNextApproverId] = useState<string | undefined>();
    const { data: actionApprovalSteps = [], isFetching: loadingActionApprovalSteps } = useAccountingDossierApprovalStepsQuery(
        actionModal?.type === "APPROVE" ? actionModal.dossierId : undefined
    );

    useEffect(() => {
        if (!routeDossier) return;
        setViewDossier(routeDossier);
        setSearchParams((prev) => {
            const next = new URLSearchParams(prev);
            next.delete("dossierId");
            return next;
        }, { replace: true });
    }, [routeDossier, setSearchParams]);

    useEffect(() => {
        const tab = searchParams.get("tab");
        const mode = searchParams.get("viewMode");
        const storageStatus = searchParams.get("storageStatus");
        const myTasks = searchParams.get("myTasksTab");

        let updated = false;
        if (tab && tab !== activeTabKey) {
            setActiveTabKey(tab);
            updated = true;
        }
        if (mode && (mode === "MY_TASKS" || mode === "ALL_DOSSIERS") && mode !== viewMode) {
            setViewMode(mode);
            updated = true;
        }
        if (storageStatus && storageStatus !== storageStatusFilter) {
            setStorageStatusFilter(storageStatus);
            updated = true;
        }
        if (myTasks && (myTasks === "PENDING_ME" || myTasks === "CREATED_BY_ME" || myTasks === "INVOLVED_ME") && myTasks !== myTasksTab) {
            setMyTasksTab(myTasks);
            updated = true;
        }

        if (updated) {
            setSearchParams((prev) => {
                const next = new URLSearchParams(prev);
                next.delete("tab");
                next.delete("viewMode");
                next.delete("storageStatus");
                next.delete("myTasksTab");
                return next;
            }, { replace: true });
        }
    }, [searchParams, setSearchParams, activeTabKey, viewMode, storageStatusFilter, myTasksTab]);

    const handleConfirmAction = async () => {
        if (!actionModal) return;
        const { type, dossierId } = actionModal;

        if ((type === "REJECT" || type === "TERMINATE") && !actionNote.trim()) {
            notify.error("Lý do thực hiện hành động này là bắt buộc.");
            return;
        }
        if (type === "APPROVE" && shouldChooseNextApprover && !selectedNextApproverId) {
            notify.error("Vui lòng chọn người tiếp nhận bước kế tiếp.");
            return;
        }

        try {
            if (type === "APPROVE") {
                await approveMutation.mutateAsync({ id: dossierId, note: actionNote, nextApproverUserId: selectedNextApproverId });
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
            setSelectedNextApproverId(undefined);
            refetch();
        } catch (err) {
            // Already handled
        }
    };

    const [submitDossierId, setSubmitDossierId] = useState<number | null>(null);
    const [customSteps, setCustomSteps] = useState<SubmitApprovalStep[]>([]);
    const [usersList, setUsersList] = useState<IUser[]>([]);
    const [submitDossierDocWarning, setSubmitDossierDocWarning] = useState<string>("");
    const initialLookupLoaded = useRef(false);
    const approvalUsersLoaded = useRef(false);

    const claimMutation = useClaimAccountingDossierMutation();

    const { data: previewData, isFetching: loadingPreview } = usePreviewWorkflowQuery(
        submitDossierId ?? 0,
        submitDossierId !== null
    );

    useEffect(() => {
        if (previewData && previewData.steps) {
            setCustomSteps(
                previewData.steps.map((step: any) => ({
                    stepKey: step.stepKey,
                    stepOrder: step.stepOrder,
                    stepName: step.stepName,
                    approverType: step.approverStrategy === "REQUESTER_MANAGER" || step.stepKey === "REQUESTER_MANAGER" || step.stepKey === "DEPARTMENT_MANAGER"
                        ? "DEPARTMENT_MANAGER"
                        : step.approverStrategy === "COMPANY_DIRECTOR" || step.stepKey === "DIRECTOR"
                        ? "DIRECTOR"
                        : step.stepKey === "ACCOUNTANT"
                        ? "ACCOUNTANT"
                        : step.stepKey === "CHIEF_ACCOUNTANT"
                        ? "CHIEF_ACCOUNTANT"
                        : step.approverStrategy === "USER_SELECTABLE"
                        ? "USER_SELECTABLE"
                        : step.approverStrategy,
                    approverUserId: step.approverUserId || undefined,
                    required: step.required,
                    assigneeLabel: step.assigneeLabel,
                    approverStrategy: step.approverStrategy
                }))
            );
        } else {
            setCustomSteps([]);
        }
    }, [previewData]);

    useEffect(() => {
        if (initialLookupLoaded.current) return;
        initialLookupLoaded.current = true;

        // Chỉ lấy dữ liệu cần cho bộ lọc danh sách; không kéo sẵn 500 người dùng ở đây.
        void Promise.all([
            callFetchCompany("page=1&size=1000&sort=name,asc").catch(() => null),
            callFetchAccountingDossierCategoryActive().catch(() => null),
        ]).then(([companyRes, categoryRes]) => {
            setCompanies((companyRes as any)?.data?.result || []);
            setActiveDossierCategories((categoryRes as any)?.data || []);
        });
    }, []);

    useEffect(() => {
        const needsApprovalUsers = !!viewDossier || (!!submitDossierId && canInspectFullApprovalFlow) || actionModal?.type === "APPROVE";
        if (!needsApprovalUsers || approvalUsersLoaded.current) return;
        approvalUsersLoaded.current = true;

        // Danh sách người duyệt chỉ phục vụ phần chi tiết/điều chỉnh luồng duyệt.
        void callFetchUsersCrossCompany("page=1&size=500&sort=email,asc")
            .then((res) => setUsersList((res as any)?.data?.result || []))
            .catch(() => {
                approvalUsersLoaded.current = false;
                setUsersList([]);
            });
    }, [viewDossier, submitDossierId, canInspectFullApprovalFlow, actionModal?.type]);

    const canStepBeClaimed = (step: SubmitApprovalStep) =>
        step.approverStrategy === "COMPANY_ROLE" || step.approverType === "ACCOUNTANT" || step.approverType === "CHIEF_ACCOUNTANT";

    const getVisibleSubmitSteps = (steps: SubmitApprovalStep[]) =>
        canInspectFullApprovalFlow
            ? steps
            : steps.filter((step) => !!step.approverUserId || canStepBeClaimed(step)).slice(0, 1);

    const hasActionableSubmitRecipient = (steps: SubmitApprovalStep[]) => {
        const firstStep = getVisibleSubmitSteps(steps)[0];
        if (!firstStep) return false;
        return !!firstStep.approverUserId || canStepBeClaimed(firstStep);
    };

    const canSubmitCurrentPreview = () => {
        if (!previewData) return false;
        return canInspectFullApprovalFlow ? !!previewData.valid : hasActionableSubmitRecipient(customSteps);
    };

    const ensureDossierHasDocuments = async (dossierId: number) => {
        try {
            const res = await callFetchDossierDocuments(dossierId);
            const payload = (res as any)?.data;
            const docs = Array.isArray(payload)
                ? payload
                : Array.isArray(payload?.data)
                ? payload.data
                : [];
            return Array.isArray(docs) && docs.length > 0;
        } catch {
            setSubmitDossierDocWarning("Chưa kiểm tra được danh sách chứng từ con. Vui lòng tải lại trang hoặc mở chi tiết bộ chứng từ để kiểm tra trước khi gửi.");
            return false;
        }
    };

    const looksLikeUuid = (value?: string) =>
        !!value && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value.trim());

    const getSubmitStepRecipientLabel = (step: SubmitApprovalStep) => {
        if (step.assigneeLabel && !looksLikeUuid(step.assigneeLabel)) {
            return step.assigneeLabel;
        }
        if (step.approverType === "DEPARTMENT_MANAGER") return "Trưởng bộ phận trực tiếp";
        if (step.approverType === "ACCOUNTANT") return "Nhóm Kế toán tiếp nhận";
        if (step.approverType === "CHIEF_ACCOUNTANT") return "Kế toán trưởng";
        if (step.approverType === "DIRECTOR") return "Giám đốc";
        return step.assigneeLabel || "Người tiếp nhận đã được hệ thống xác định";
    };

    const currentActionStep = useMemo(() => {
        if (actionModal?.type !== "APPROVE") return undefined;
        return actionApprovalSteps.find((step) => step.status === "CURRENT");
    }, [actionModal?.type, actionApprovalSteps]);

    const nextActionStep = useMemo(() => {
        if (!currentActionStep) return undefined;
        return actionApprovalSteps
            .filter((step) => step.stepOrder > currentActionStep.stepOrder && step.status !== "SKIPPED")
            .sort((a, b) => a.stepOrder - b.stepOrder)[0];
    }, [actionApprovalSteps, currentActionStep]);

    const nextActionStepCandidates = useMemo(() => {
        if (!nextActionStep) return [];
        const eligibleIds = (nextActionStep.eligibleApproverIds || "")
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean);
        if (eligibleIds.length > 0) {
            return usersList.filter((item) => eligibleIds.includes(String(item.id)));
        }
        if (nextActionStep.approverUserId) {
            return usersList.filter((item) => String(item.id) === String(nextActionStep.approverUserId));
        }
        const nextStepName = (nextActionStep.stepName || "").toLowerCase();
        if (nextActionStep.approverType === "CUSTOM" && nextStepName.includes("kế toán")) {
            return getApproverOptions(usersList, "ACCOUNTANT");
        }
        return getApproverOptions(usersList, nextActionStep.approverType as SubmitApprovalStep["approverType"]);
    }, [nextActionStep, usersList]);

    const shouldChooseNextApprover = actionModal?.type === "APPROVE"
        && !!nextActionStep
        && !nextActionStep.approverUserId
        && nextActionStepCandidates.length > 1;

    useEffect(() => {
        if (actionModal?.type !== "APPROVE") {
            setSelectedNextApproverId(undefined);
            return;
        }
        if (nextActionStep?.approverUserId) {
            setSelectedNextApproverId(undefined);
            return;
        }
        if (nextActionStepCandidates.length === 1) {
            setSelectedNextApproverId(String(nextActionStepCandidates[0].id));
            return;
        }
        setSelectedNextApproverId(undefined);
    }, [actionModal?.type, actionModal?.dossierId, nextActionStep?.id, nextActionStep?.approverUserId, nextActionStepCandidates]);

    const splitDisplayName = (label?: string) => {
        const value = label || "";
        const match = value.match(/^(.*?)\s*\((.*?)\)\s*$/);
        if (match) {
            return { name: match[1], email: match[2] };
        }
        return { name: value, email: "" };
    };

    const getPersonPreview = (person?: any, fallbackLabel?: string) => {
        const fallback = splitDisplayName(fallbackLabel);
        return {
            name: person?.name || fallback.name || "Chưa xác định",
            email: person?.email || fallback.email || "",
            roleName: person?.roleName || "",
            jobTitleName: person?.jobTitleName || "",
            positionLevelCode: person?.positionLevelCode || "",
            companyName: person?.companyName || "",
            departmentName: person?.departmentName || "",
            sectionName: person?.sectionName || "",
        };
    };

    const renderWorkflowPersonCard = (
        label: string,
        person: any,
        fallbackLabel: string | undefined,
        tone: "sender" | "receiver"
    ) => {
        const info = getPersonPreview(person, fallbackLabel);
        const isReceiver = tone === "receiver";
        const metaItems = [
            info.jobTitleName,
            info.positionLevelCode ? `Cấp bậc ${info.positionLevelCode}` : "",
            info.companyName,
            info.departmentName,
            info.sectionName,
        ].filter(Boolean);

        return (
            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: "96px 36px minmax(0, 1fr) auto",
                    alignItems: "center",
                    gap: 12,
                    padding: "12px 14px",
                    border: "1px solid #e5e7eb",
                    borderLeft: `3px solid ${isReceiver ? "#c2185b" : "#d7dce5"}`,
                    background: isReceiver ? "#fbfbfc" : "#ffffff",
                    borderRadius: 10,
                }}
            >
                <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                        {label}
                    </div>
                    <div style={{ marginTop: 2, fontSize: 12, color: "#8a94a6", fontWeight: 500 }}>
                        {isReceiver ? "Bước kế tiếp" : "Người lập"}
                    </div>
                </div>
                <span
                    style={{
                        width: 36,
                        height: 36,
                        borderRadius: "50%",
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: isReceiver ? "#c2185b" : "#6b7280",
                        background: "#f8fafc",
                        border: "1px solid #e2e8f0",
                        flex: "0 0 auto",
                    }}
                >
                    {isReceiver ? <SendOutlined /> : <FileTextOutlined />}
                </span>
                <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 14, lineHeight: 1.35, fontWeight: 700, color: "#1a1a1a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {info.name}
                    </div>
                    {metaItems.length > 0 && (
                        <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginTop: 7 }}>
                            {metaItems.map((item) => (
                                <Tag
                                    key={item}
                                    style={{
                                        fontSize: 10,
                                        lineHeight: "18px",
                                        padding: "0 6px",
                                        margin: 0,
                                        borderRadius: 5,
                                        color: "#4b5563",
                                        borderColor: "#e5e7eb",
                                        background: "#f8fafc",
                                        fontWeight: 600,
                                    }}
                                >
                                    {item}
                                </Tag>
                            ))}
                        </div>
                    )}
                </div>
                {isReceiver && (
                    <Tag style={{ margin: 0, borderRadius: 999, padding: "2px 8px", fontSize: 11, fontWeight: 700, color: "#c2185b", borderColor: "#e7b5cc", background: "#fff" }}>
                        Tiếp nhận
                    </Tag>
                )}
            </div>
        );
    };

    const rows = useMemo(() => {
        const source = data?.result || [];
        const normalizedKeyword = keyword.trim().toLowerCase();
        const sorted = viewMode === "MY_TASKS"
            ? [...source]
            : [...source].sort((a, b) => {
                const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
                const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
                if (dateA !== dateB) return dateB - dateA;
                return Number(b.id || 0) - Number(a.id || 0);
            });
        if (!normalizedKeyword) return sorted;

        return sorted.filter((item) => {
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
    }, [data?.result, keyword, myTasksTab, viewMode]);

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
                                Đến lượt bạn
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
            width: 170,
            render: (_, record) => {
                const isCreator = user?.id === record.creatorId;
                const canEdit = editableStatuses.includes(record.status) && isCreator && canUpdateDossier;
                const canDelete = editableStatuses.includes(record.status) && isCreator && canDeleteDossier;
                const canSubmit = editableStatuses.includes(record.status) && isCreator && canSubmitDossier;
                const canRequestReturn = returnRequestableStatuses.includes(record.status) && isCreator && perms.requestReturn;

                const canApproveQuick = isPendingMeMode && perms.approve && ["SUBMITTED", "IN_REVIEW"].includes(record.status);
                const canRejectQuick = isPendingMeMode && perms.reject && ["SUBMITTED", "IN_REVIEW"].includes(record.status);
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
                if (canSubmit) {
                    menuItems.push({
                        key: "submit",
                        label: "Gửi duyệt",
                        onClick: () => {
                            if (record.id) {
                                setSubmitDossierDocWarning("");
                                setSubmitDossierId(record.id);
                            }
                        }
                    });
                }
                if (canEdit) {
                    menuItems.push({
                        key: "edit",
                        label: "Chỉnh sửa",
                        onClick: () => handleOpenEdit(record)
                    });
                }

                if (canViewDossierLogs) {
                    menuItems.push({
                        key: "logs",
                        label: "Nhật ký lịch sử",
                        onClick: () => setLogDossier(record)
                    });
                }

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

                if (canDelete) {
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
                        {canViewDossierDetail && (
                            <Tooltip title={record.qrToken ? "Xem mã QR bộ chứng từ" : "Mã QR được cấp khi chuyển xử lý bộ chứng từ"}>
                                <Button
                                    type="text"
                                    size="small"
                                    disabled={!record.qrToken}
                                    icon={<QrcodeOutlined style={{ color: record.qrToken ? "#722ed1" : undefined, fontSize: 16 }} />}
                                    onClick={() => setQrDossier(record)}
                                />
                            </Tooltip>
                        )}
                        {canViewDossierDetail && (
                            <Tooltip title="Xem chi tiết">
                                <Button
                                    data-guide-id="accounting-dossier-detail-button"
                                    type="text"
                                    size="small"
                                    icon={<EyeOutlined style={{ color: "#1677ff", fontSize: 16 }} />}
                                    onClick={() => setViewDossier(record)}
                                />
                            </Tooltip>
                        )}
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
                    <Access permission={ALL_PERMISSIONS.ACCOUNTING_DOSSIERS.GET_CATEGORIES} hideChildren>
                        <Button
                            style={{ height: 40, borderRadius: 10, fontSize: 14 }}
                            onPointerEnter={() => void loadDossierTemplateDrawer()}
                            onFocus={() => void loadDossierTemplateDrawer()}
                            onClick={() => {
                                void loadDossierTemplateDrawer();
                                startTransition(() => setTemplateDrawerOpen(true));
                            }}
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
                            {
                                key: "PENDING_ME",
                                label: "Cần tôi phê duyệt / kiểm tra",
                                icon: (
                                    <Badge
                                        count={pendingMeCount}
                                        overflowCount={99}
                                        size="small"
                                        offset={[8, -6]}
                                        style={{
                                            backgroundColor: pendingMeCount > 0 ? "#c2185b" : "#d1d5db",
                                            boxShadow: "0 0 0 1px #fff",
                                        }}
                                    >
                                        <ClockCircleOutlined />
                                    </Badge>
                                )
                            },
                            { key: "INVOLVED_ME", label: "Đã xử lý", icon: <HistoryOutlined /> },
                            { key: "CREATED_BY_ME", label: "Bộ chứng từ tôi đã tạo", icon: <FileTextOutlined /> },
                        ]}
                    />
                </div>
            )}

            {!isApproverRole && (
                <div style={{ marginBottom: 12 }}>
                    <Button
                        type="default"
                        icon={<FileTextOutlined />}
                        style={{
                            height: 40,
                            borderRadius: 8,
                            fontWeight: 600,
                            color: "#c2185b",
                            borderColor: "#ff8fc4",
                            background: "#fff7fb",
                        }}
                    >
                        Bộ chứng từ tôi đã tạo
                    </Button>
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
                            { key: "ALL", label: isApproverRole || viewMode === "ALL_DOSSIERS" ? "Tất cả" : "Tất cả hồ sơ của tôi", icon: <AppstoreOutlined /> },
                            { key: "DRAFT", label: "Bản nháp", icon: <FileTextOutlined /> },
                            { key: "PENDING", label: "Đang xử lý", icon: <ClockCircleOutlined /> },
                            { key: "RETURNED", label: "Cần bổ sung (Bị trả về)", icon: <RollbackOutlined /> },
                            { key: "APPROVED", label: "Đã duyệt / Lưu trữ", icon: <CheckCircleOutlined /> },
                            { key: "REJECTED", label: "Từ chối / Chấm dứt", icon: <CloseCircleOutlined /> },
                        ]}
                    />
                </div>
            )}
            {selectedRowKeys.length > 0 && canBulkApproveDossiers && isPendingMeMode && (
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
                rowSelection={canBulkApproveDossiers && isPendingMeMode ? {
                    selectedRowKeys,
                    onChange: (keys) => setSelectedRowKeys(keys),
                    getCheckboxProps: (record) => ({
                        disabled: !pendingIds.has(record.id!) || (record.status !== "SUBMITTED" && record.status !== "IN_REVIEW"),
                    }),
                } : undefined}
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

            {modalOpen && (
                <Suspense fallback={<Spin fullscreen tip="Đang tải biểu mẫu bộ chứng từ..." />}>
                    <AccountingDossierModal
                        open={modalOpen}
                        companies={companies}
                        initialValues={editingDossierDetail || editingDossier}
                        loading={createMutation.isPending || updateMutation.isPending}
                        onCancel={() => setModalOpen(false)}
                        onSubmit={handleSubmit}
                    />
                </Suspense>
            )}

            {templateDrawerOpen && (
                <Suspense fallback={null}>
                    <DossierTemplateDrawer
                        open={templateDrawerOpen}
                        companies={companies}
                        onClose={() => setTemplateDrawerOpen(false)}
                        canCreate={isSuperAdmin || canCreateDossierCategory}
                        canUpdate={isSuperAdmin || canUpdateDossierCategory}
                        canDelete={isSuperAdmin || canDeleteDossierCategory}
                        canToggleActive={isSuperAdmin || canToggleDossierCategoryActive}
                        isSuperAdmin={isSuperAdmin}
                    />
                </Suspense>
            )}

            <Modal
                open={!!viewDossier}
                onCancel={() => setViewDossier(null)}
                width={1040}
                centered
                destroyOnHidden
                closeIcon={<CloseOutlined style={{ fontSize: 16 }} />}
                styles={{
                    content: { borderRadius: 16, overflow: "hidden", padding: 0 },
                    body: { padding: 0, maxHeight: "calc(100vh - 180px)", overflowY: "auto" },
                    header: { padding: "16px 22px 14px", marginBottom: 0, borderBottom: "1px solid #f1f5f9" },
                    footer: { padding: "10px 20px", borderTop: "0.5px solid #f0f0f0", marginTop: 0 },
                }}
                title={
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{ width: 38, height: 38, borderRadius: 10, background: "#fff0f6", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                            <FileTextOutlined style={{ fontSize: 18, color: "#e8256b" }} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "#0f172a" }}>
                                {currentDossier?.dossierCode || viewDossier?.dossierCode || "Chi tiết bộ chứng từ"}
                            </div>
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

                    const currentStep = approvalSteps.find((s) => s.status === "CURRENT");
                    const canClaim = ["SUBMITTED", "IN_REVIEW"].includes(activeDossier.status) &&
                        currentStep && !currentStep.approverUserId && (
                            canClaimDossier && (ctx.isSuperAdmin ||
                            (currentStep.approverType === "ACCOUNTANT" && userHasRoleKeyword(user as any, ["ACCOUNTANT", "KETOAN", "KE_TOAN"])) ||
                            (currentStep.approverType === "CHIEF_ACCOUNTANT" && userHasRoleKeyword(user as any, ["CHIEF", "KETOAN_TRUONG", "KE_TOAN_TRUONG"])))
                        );

                    if (canClaim) {
                        footerButtons.push(
                            <Button
                                key="claim"
                                type="primary"
                                onClick={() => {
                                    Modal.confirm({
                                        title: "Nhận xử lý bộ chứng từ",
                                        content: "Bạn muốn nhận xử lý bước duyệt này cho tài khoản của bạn chứ?",
                                        okText: "Nhận việc",
                                        cancelText: "Hủy",
                                        onOk: () => claimMutation.mutate(activeDossier.id!),
                                    });
                                }}
                                loading={claimMutation.isPending}
                                style={{ borderRadius: 3, fontSize: 13, background: "#52c41a", borderColor: "#52c41a" }}
                            >
                                Nhận việc (Claim)
                            </Button>
                        );
                    }

                    footerButtons.push(
                        <Button key="close" onClick={() => setViewDossier(null)} style={{ borderRadius: 3, fontSize: 13 }}>
                            Đóng
                        </Button>
                    );

                    if (ctx.canReject) {
                        footerButtons.push(
                            <Button
                                key="reject"
                                danger
                                onClick={() => setActionModal({ open: true, type: "REJECT", dossierId: activeDossier.id! })}
                                style={{ borderRadius: 3, fontSize: 13 }}
                            >
                                Từ chối
                            </Button>
                        );
                    }

                    if (ctx.canApprove) {
                        footerButtons.push(
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

                    if (ctx.canReturnResponse) {
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
                                style={{ borderRadius: 6, fontSize: 13, backgroundColor: "#e8256b", borderColor: "#e8256b" }}
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
                        const canReviewChildDocuments = ctx.canReviewChildDocs;
                        const currentStep = approvalSteps.find((s) => s.status === "CURRENT");
                        const currentStepHint = currentStep?.approverType === "DEPARTMENT_MANAGER"
                            ? "Bước hiện tại là Trưởng bộ phận: chỉ duyệt/từ chối bộ hồ sơ tổng, chưa kiểm tra từng chứng từ con."
                            : currentStep?.approverType === "ACCOUNTANT"
                                ? "Bước hiện tại là Kế toán: kiểm tra từng chứng từ con, đánh dấu hợp lệ/cần bổ sung rồi phê duyệt."
                                : currentStep?.approverType === "CHIEF_ACCOUNTANT"
                                    ? "Bước hiện tại là Kế toán trưởng: duyệt bước kiểm tra sau khi kế toán đã kiểm tra chứng từ."
                                    : currentStep?.approverType === "DIRECTOR"
                                        ? "Bước hiện tại là Giám đốc: duyệt cuối bộ hồ sơ để hoàn thành quy trình."
                                        : undefined;
                        return (
                            <div style={{ display: "flex", alignItems: "flex-start", gap: 24, padding: "22px 24px 26px", flexWrap: "wrap" }}>
                                <div style={{ flex: "1 1 680px", minWidth: 0 }}>

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
                                                editable={editableStatuses.includes(activeDossier.status) && ctx.isCreator}
                                                canCreate={canCreateDossierDocument}
                                                canUpdate={canUpdateDossierDocument}
                                                canDelete={canDeleteDossierDocument}
                                                reviewable={canReviewChildDocuments}
                                                variant="compact"
                                            />
                                        </div>
                                    </div>

                                    {approvalSteps && approvalSteps.length > 0 && (
                                        <div style={{ marginBottom: 14, paddingTop: 2 }}>
                                            <SectionHeading icon={<CheckCircleOutlined />} label="Phê duyệt" />
                                            <div style={{
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "space-between",
                                                gap: 16,
                                                minHeight: 32,
                                            }}>
                                                <div style={{ minWidth: 0, color: "#64748b", fontSize: 13, lineHeight: 1.45 }}>
                                                    <strong style={{ color: "#0f172a", fontSize: 14 }}>{approvalSteps.length} bước duyệt</strong>
                                                    {currentStep ? (
                                                        <span style={{ color: "#64748b" }}> · Đang chờ <strong style={{ color: "#2563eb" }}>{currentStep.stepName || getApproverTypeLabel(currentStep.approverType)}</strong></span>
                                                    ) : (
                                                        <span style={{ color: "#64748b" }}> · {['APPROVED', 'ARCHIVED'].includes(activeDossier.status) ? 'Đã hoàn tất' : 'Đã có lịch sử xử lý'}</span>
                                                    )}
                                                </div>
                                                <Button
                                                    type="text"
                                                    icon={<HistoryOutlined />}
                                                    onClick={() => setApprovalHistoryOpen(true)}
                                                    size="small"
                                                    style={{ color: "#1677ff", border: "1px solid #bae0ff", background: "#f0f8ff", borderRadius: 7, fontWeight: 650, fontSize: 12, flexShrink: 0, paddingInline: 10, height: 30 }}
                                                >
                                                    Xem lịch sử
                                                </Button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <aside
                                    style={{
                                        width: 154,
                                        flexShrink: 0,
                                        minHeight: 180,
                                        borderLeft: "1px solid #eef2f7",
                                        paddingLeft: 20,
                                        display: "flex",
                                        flexDirection: "column",
                                        alignItems: "center",
                                        gap: 10,
                                    }}
                                >
                                    {activeDossier.qrCode ? (
                                        <>
                                            <div style={{ padding: 6, background: "#fff", border: "1px solid #e2e8f0", borderRadius: 8, lineHeight: 0 }}>
                                                <Image
                                                    src={`data:image/png;base64,${activeDossier.qrCode}`}
                                                    alt={`Mã QR ${activeDossier.dossierCode || "bộ chứng từ"}`}
                                                    width={112}
                                                    height={112}
                                                    preview={{ mask: <EyeOutlined /> }}
                                                    style={{ borderRadius: 4, objectFit: "contain" }}
                                                />
                                            </div>
                                            <div style={{ display: "flex", alignItems: "center", gap: 5, color: "#64748b", fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" }}>
                                                <QrcodeOutlined style={{ color: "#e8256b", fontSize: 12 }} /> Mã QR
                                            </div>
                                            <Tooltip title={activeDossier.dossierCode}>
                                                <Tag color="magenta" style={{ margin: 0, maxWidth: 132, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                                    {activeDossier.dossierCode}
                                                </Tag>
                                            </Tooltip>
                                            <span style={{ color: "#94a3b8", fontSize: 11, textAlign: "center", lineHeight: 1.4 }}>
                                                Quét để tra cứu nhanh bộ chứng từ
                                            </span>
                                            <Button
                                                size="small"
                                                icon={<DownloadOutlined />}
                                                onClick={() => {
                                                    const link = document.createElement("a");
                                                    link.href = `data:image/png;base64,${activeDossier.qrCode}`;
                                                    link.download = `QR_${activeDossier.dossierCode || activeDossier.id}.png`;
                                                    link.click();
                                                }}
                                                style={{ borderRadius: 6, fontSize: 11, width: "100%" }}
                                            >
                                                Tải QR
                                            </Button>
                                        </>
                                    ) : (
                                        <>
                                            <div style={{ width: 112, height: 112, borderRadius: 8, background: "#f8fafc", border: "1px dashed #cbd5e1", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                                <QrcodeOutlined style={{ color: "#cbd5e1", fontSize: 34 }} />
                                            </div>
                                            <span style={{ color: "#94a3b8", fontSize: 11, textAlign: "center", lineHeight: 1.45 }}>
                                                Mã QR được tạo khi bộ chứng từ được chuyển xử lý.
                                            </span>
                                        </>
                                    )}
                                </aside>
                            </div>
                        );
                    })()
                )}
            </Modal>

            <Modal
                title={`Mã QR bộ chứng từ${qrDossier?.dossierCode ? `: ${qrDossier.dossierCode}` : ""}`}
                open={!!qrDossier}
                onCancel={() => setQrDossier(null)}
                footer={<Button onClick={() => setQrDossier(null)}>Đóng</Button>}
                width={420}
                destroyOnHidden
            >
                <Spin spinning={loadingQrDossier}>
                    {qrDossierDetail?.qrCode ? (
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14, padding: "16px 0" }}>
                            <img
                                src={`data:image/png;base64,${qrDossierDetail.qrCode}`}
                                alt={`Mã QR ${qrDossierDetail.dossierCode || "bộ chứng từ"}`}
                                style={{ width: 240, height: 240, objectFit: "contain" }}
                            />
                            <Tag color="magenta" style={{ margin: 0, fontSize: 13 }}>
                                {qrDossierDetail.dossierCode || `BCT-${qrDossierDetail.id}`}
                            </Tag>
                            <Button
                                onClick={() => {
                                    const link = document.createElement("a");
                                    link.href = `data:image/png;base64,${qrDossierDetail.qrCode}`;
                                    link.download = `QR_${qrDossierDetail.dossierCode || qrDossierDetail.id}.png`;
                                    link.click();
                                }}
                            >
                                Tải ảnh QR
                            </Button>
                        </div>
                    ) : !loadingQrDossier ? (
                        <div style={{ textAlign: "center", padding: "24px 0", color: "#64748b" }}>
                            Bộ chứng từ này chưa có mã QR. Mã QR được tạo khi bộ được chuyển xử lý và cấp mã BCT.
                        </div>
                    ) : null}
                </Spin>
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
                getContainer={() => document.body}
                zIndex={1300}
                onOk={handleConfirmAction}
                onCancel={() => {
                    setActionModal(null);
                    setActionNote("");
                    setSelectedNextApproverId(undefined);
                }}
                okText="Xác nhận"
                cancelText="Hủy"
                okButtonProps={{
                    disabled: actionModal?.type === "APPROVE" && (loadingActionApprovalSteps || (shouldChooseNextApprover && !selectedNextApproverId)),
                }}
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
                    {actionModal?.type === "APPROVE" && (
                        <div
                            style={{
                                border: "1px solid #f9a8d4",
                                background: "#fff7fb",
                                borderRadius: 8,
                                padding: 12,
                                marginBottom: 14,
                            }}
                        >
                            <div style={{ fontSize: 12, fontWeight: 800, color: "#be185d", textTransform: "uppercase", marginBottom: 6 }}>
                                Sau khi duyệt chuyển đến
                            </div>
                            {loadingActionApprovalSteps ? (
                                <Spin size="small" />
                            ) : nextActionStep ? (
                                <>
                                    <div style={{ fontSize: 15, fontWeight: 800, color: "#111827" }}>
                                        {nextActionStep.stepName || getApproverTypeLabel(nextActionStep.approverType)}
                                    </div>
                                    {nextActionStep.approverUserId ? (
                                        <div style={{ marginTop: 6, color: "#64748b", fontWeight: 600 }}>
                                            {getApprovalActorDisplay(nextActionStep, usersList)}
                                        </div>
                                    ) : shouldChooseNextApprover ? (
                                        <Select
                                            style={{ width: "100%", marginTop: 10 }}
                                            placeholder="Chọn kế toán viên tiếp nhận"
                                            value={selectedNextApproverId}
                                            onChange={setSelectedNextApproverId}
                                            options={nextActionStepCandidates.map((candidate) => ({
                                                value: String(candidate.id),
                                                label: getUserDisplayName(candidate),
                                            }))}
                                            showSearch
                                            optionFilterProp="label"
                                        />
                                    ) : nextActionStepCandidates.length === 1 ? (
                                        <div style={{ marginTop: 6, color: "#64748b", fontWeight: 600 }}>
                                            {getUserDisplayName(nextActionStepCandidates[0])}
                                        </div>
                                    ) : (
                                        <div style={{ marginTop: 6, color: "#64748b", fontWeight: 600 }}>
                                            Chuyển vào hàng đợi {getApproverTypeLabel(nextActionStep.approverType)}
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div style={{ color: "#64748b", fontWeight: 600 }}>
                                    Đây là bước duyệt cuối cùng của bộ chứng từ.
                                </div>
                            )}
                        </div>
                    )}
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
                title={
                    <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                        <div style={{ width: 3, height: 18, borderRadius: 2, background: "linear-gradient(180deg, #e91e8c, #c2185b)" }} />
                        <span style={{ fontSize: 15, fontWeight: 700, color: "#1a1a1a" }}>Gửi duyệt bộ chứng từ</span>
                    </div>
                }
                open={submitDossierId !== null}
                onCancel={() => {
                    setSubmitDossierId(null);
                    setCustomSteps([]);
                    setSubmitDossierDocWarning("");
                }}
                footer={[
                    <Button key="cancel" onClick={() => { setSubmitDossierId(null); setCustomSteps([]); setSubmitDossierDocWarning(""); }}>
                        Hủy
                    </Button>,
                    <Button
                        key="submit"
                        type="primary"
                        style={{
                            background: "#c2185b",
                            borderColor: "#c2185b",
                            boxShadow: "0 8px 18px rgba(194, 24, 91, 0.18)",
                        }}
                        onClick={async () => {
                            if (submitMutation.isPending) return;
                            if (submitDossierId) {
                                const hasMissingRequiredApprover = getVisibleSubmitSteps(customSteps).some((step) => {
                                    const canBeClaimed = canStepBeClaimed(step);
                                    return step.required && !step.approverUserId && !canBeClaimed;
                                });
                                if (hasMissingRequiredApprover) {
                                    message.warning("Vui lòng chọn đủ người duyệt cho các bước bắt buộc");
                                    return;
                                }
                                const hasDocuments = await ensureDossierHasDocuments(submitDossierId);
                                if (!hasDocuments) {
                                    setSubmitDossierDocWarning("Bộ chứng từ này chưa có chứng từ con. Vui lòng thêm ít nhất 1 hóa đơn, phiếu chi hoặc file hồ sơ trước khi gửi duyệt.");
                                    return;
                                }
                                setSubmitDossierDocWarning("");
                                await submitMutation.mutateAsync({ id: submitDossierId, customSteps });
                                setSubmitDossierId(null);
                                setCustomSteps([]);
                            }
                        }}
                        loading={submitMutation.isPending}
                        disabled={
                            loadingPreview ||
                            submitMutation.isPending ||
                            !canSubmitCurrentPreview() ||
                            customSteps.length === 0 ||
                            getVisibleSubmitSteps(customSteps).some((step) => {
                                const canBeClaimed = canStepBeClaimed(step);
                                return step.required && !step.approverUserId && !canBeClaimed;
                            })
                        }
                    >
                        Xác nhận gửi duyệt
                    </Button>
                ]}
                width={640}
                styles={{ body: { paddingTop: 8 } }}
            >
                {(() => {
                    const dossierToSubmit = data?.result?.find((d) => d.id === submitDossierId);
                    const returnCount = dossierToSubmit?.returnCount || 0;
                    const senderLabel = [user.name, user.email].filter(Boolean).join(" · ") || user.id || "Người gửi hiện tại";
                    const visibleSubmitSteps = getVisibleSubmitSteps(customSteps);
                    const getPreviewStep = (step?: SubmitApprovalStep) =>
                        step ? previewData?.steps?.find((item: any) => item.stepOrder === step.stepOrder) : undefined;
                    const firstVisiblePreviewStep = getPreviewStep(visibleSubmitSteps[0]);
                    return (
                        <div style={{ padding: "4px 0" }}>
                            {submitDossierDocWarning && (
                                <Alert
                                    type="warning"
                                    showIcon
                                    message={submitDossierDocWarning}
                                    style={{ marginBottom: 12 }}
                                />
                            )}
                            {returnCount >= 2 && (
                                <Alert
                                    type="warning"
                                    showIcon
                                    style={{ marginBottom: 14 }}
                                    message={`Hồ sơ đã bị trả về ${returnCount} lần`}
                                    description="Nếu tiếp tục bị trả về, hệ thống sẽ yêu cầu Trưởng bộ phận kiểm tra trước khi gửi lại."
                                />
                            )}

                            {loadingPreview ? (
                                <div style={{ padding: "40px 0", textAlign: "center" }}>
                                    <Spin tip="Đang tải cấu trúc luồng duyệt..." />
                                </div>
                            ) : (
                                <>
                                    {previewData && (
                                        <div style={{ marginBottom: 14 }}>
                                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 10 }}>
                                                <Tag style={{ fontSize: 12, padding: "2px 8px", margin: 0, borderRadius: 6, color: "#374151", borderColor: "#d1d5db", background: "#fff" }}>
                                                    {canInspectFullApprovalFlow
                                                        ? previewData.source === "WORKFLOW_TEMPLATE_V2"
                                                            ? `${previewData.templateName} · v${previewData.templateVersion}`
                                                            : "Luồng mặc định"
                                                        : "Luồng duyệt chứng từ"}
                                                </Tag>
                                                <span style={{ color: "#6b7280", fontSize: 13 }}>
                                                    {canInspectFullApprovalFlow ? `${customSteps.length} bước duyệt` : "Xác nhận điểm tiếp nhận"}
                                                </span>
                                            </div>

                                            {canInspectFullApprovalFlow ? (
                                                <>
                                                    {previewData.blockingErrors?.map((err: string, idx: number) => (
                                                        <Alert key={`err-${idx}`} message={err} type="error" showIcon style={{ marginBottom: 8 }} />
                                                    ))}
                                                    {previewData.warnings?.map((warn: string, idx: number) => (
                                                        <Alert key={`warn-${idx}`} message={warn} type="warning" showIcon style={{ marginBottom: 8 }} />
                                                    ))}
                                                </>
                                            ) : previewData.blockingErrors?.length && !hasActionableSubmitRecipient(customSteps) ? (
                                                <Alert
                                                    type="error"
                                                    showIcon
                                                    style={{ marginBottom: 8 }}
                                                    message="Hệ thống chưa xác định được người tiếp nhận hồ sơ. Vui lòng báo quản trị viên kiểm tra cấu hình luồng duyệt."
                                                />
                                            ) : null}
                                        </div>
                                    )}

                                    <div
                                        style={{
                                            border: "1px solid #e5e7eb",
                                            borderRadius: 10,
                                            background: "#ffffff",
                                            overflow: "hidden",
                                            marginBottom: canInspectFullApprovalFlow ? 12 : 0,
                                        }}
                                    >
                                        <div
                                            style={{
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "space-between",
                                                gap: 12,
                                                padding: "12px 14px",
                                                borderBottom: "1px solid #e5e7eb",
                                                background: "#fafafa",
                                            }}
                                        >
                                            <div style={{ display: "flex", alignItems: "center", gap: 9, minWidth: 0 }}>
                                                <div style={{ width: 3, height: 18, borderRadius: 2, background: "#c2185b", flex: "0 0 auto" }} />
                                                <div style={{ minWidth: 0 }}>
                                                    <div style={{ fontSize: 13, fontWeight: 700, color: "#1a1a1a" }}>
                                                        Xác nhận điểm tiếp nhận
                                                    </div>
                                                    <div style={{ marginTop: 1, fontSize: 12, color: "#8a94a6" }}>
                                                        Hồ sơ sẽ được chuyển đến người nhận kế tiếp
                                                    </div>
                                                </div>
                                            </div>
                                            <Tag style={{ margin: 0, borderRadius: 999, fontSize: 11, fontWeight: 600, color: "#374151", borderColor: "#d1d5db", background: "#fff" }}>
                                                Bước đầu tiên
                                            </Tag>
                                        </div>
                                        <div style={{ display: "flex", flexDirection: "column", gap: 8, padding: 12 }}>
                                            {renderWorkflowPersonCard("Từ", previewData?.sender, senderLabel, "sender")}
                                            {visibleSubmitSteps[0] && (
                                                <>
                                                    <div
                                                        aria-hidden="true"
                                                        style={{
                                                            width: 24,
                                                            height: 24,
                                                            borderRadius: "50%",
                                                            display: "flex",
                                                            alignItems: "center",
                                                            justifyContent: "center",
                                                            color: "#6b7280",
                                                            background: "#fff",
                                                            border: "1px solid #d1d5db",
                                                            marginLeft: 111,
                                                        }}
                                                    >
                                                        <ArrowRightOutlined style={{ transform: "rotate(90deg)", fontSize: 11 }} />
                                                    </div>
                                                    {renderWorkflowPersonCard(
                                                        "Gửi đến",
                                                        firstVisiblePreviewStep?.assignee,
                                                        getSubmitStepRecipientLabel(visibleSubmitSteps[0]),
                                                        "receiver"
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    {canInspectFullApprovalFlow && (
                                    <div style={{ display: "grid", gap: 8 }}>
                                        {visibleSubmitSteps.map((step, index) => {
                                            const previewStep = getPreviewStep(step);
                                            const isResolved = !!previewStep?.approverUserId;
                                            const canBeClaimed = canStepBeClaimed(step);
                                            const needsManualPick = step.required && !step.approverUserId && !canBeClaimed;
                                            const statusColor = isResolved ? "#16a34a" : canBeClaimed ? "#2563eb" : needsManualPick ? "#dc2626" : "#6b7280";
                                            const statusText = isResolved
                                                ? "Tự động xác định"
                                                : canBeClaimed
                                                ? "Vào hàng đợi"
                                                : needsManualPick
                                                ? "Cần chọn người"
                                                : "Tùy chọn";
                                            
                                            return (
                                                <div
                                                    key={index}
                                                    style={{
                                                        display: "grid",
                                                        gridTemplateColumns: "38px minmax(0, 1fr) 170px",
                                                        alignItems: "center",
                                                        gap: 12,
                                                        background: "#fff",
                                                        padding: "10px 12px",
                                                        borderRadius: 8,
                                                        border: needsManualPick ? "1px solid #fecaca" : "1px solid #e5e7eb"
                                                    }}
                                                >
                                                    <div style={{
                                                        width: 30,
                                                        height: 30,
                                                        borderRadius: 8,
                                                        background: "#f3f6fb",
                                                        color: "#1f2937",
                                                        display: "grid",
                                                        placeItems: "center",
                                                        fontWeight: 700
                                                    }}>
                                                        {index + 1}
                                                    </div>
                                                    <div style={{ minWidth: 0 }}>
                                                        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                                                            <span style={{ fontWeight: 600, fontSize: 15, color: "#1f2937" }}>
                                                                {step.stepName}
                                                            </span>
                                                            {step.slaMinutes && (
                                                                <Tag color="orange" style={{ margin: 0, fontSize: 11 }}>{step.slaMinutes / 60}h</Tag>
                                                            )}
                                                            <span style={{ color: statusColor, fontSize: 12, fontWeight: 650 }}>{statusText}</span>
                                                        </div>
                                                        <div style={{ marginTop: 3, color: "#6b7280", fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                                            {isResolved
                                                                ? getSubmitStepRecipientLabel(step)
                                                                : canBeClaimed
                                                                ? "Nhóm có quyền sẽ nhận xử lý sau khi gửi"
                                                                : step.approverStrategy === "USER_SELECTABLE"
                                                                ? "Người lập chọn người duyệt cho bước này trước khi gửi"
                                                                : "Chọn người duyệt cho bước này"}
                                                        </div>
                                                    </div>
                                                    <div>
                                                        {!isResolved && (
                                                                <Select
                                                                    showSearch
                                                                    allowClear
                                                                    placeholder={canBeClaimed ? "Không bắt buộc" : "Chọn người"}
                                                                    value={step.approverUserId}
                                                                    optionFilterProp="label"
                                                                    style={{ width: "100%" }}
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
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                    )}
                                </>
                            )}
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
