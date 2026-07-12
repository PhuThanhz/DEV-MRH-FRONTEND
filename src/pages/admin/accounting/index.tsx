import { useState, useEffect, useMemo } from "react";
import {
    Badge,
    Button,
    Dropdown,
    Empty,
    Form,
    Input,
    Layout,
    Avatar,
    Modal,
    Popconfirm,
    Select,
    Space,
    Spin,
    Table,
    Tag,
    Tooltip,
    Tree,
    Drawer
} from "antd";
import {
    ApartmentOutlined,
    AuditOutlined,
    BankOutlined,
    ClearOutlined,
    EditOutlined,
    DeleteOutlined,
    EyeOutlined,
    FileDoneOutlined,
    FileExcelOutlined,
    PlusOutlined,
    SearchOutlined,
    FolderOutlined,
    FolderOpenOutlined,
    MoreOutlined,
    FolderAddOutlined,
    FilterOutlined,
    LockOutlined,
    UnlockOutlined,
    UserOutlined
} from "@ant-design/icons";
import type { ProColumns } from "@ant-design/pro-components";
import type { DataNode } from "antd/es/tree";
import dayjs from "dayjs";
import queryString from "query-string";

import PageContainer from "@/components/common/data-table/PageContainer";
import SearchFilter from "@/components/common/filter/SearchFilter";
import DataTable from "@/components/common/data-table";

import type { IAccountingDossier, IAccountingDossierDocument, IDocument, IDocumentFolder } from "@/types/backend";
import useAccess from "@/hooks/useAccess";
import { useIsMobile } from "@/hooks/useIsMobile";
import { getModalWidth } from "@/utils/responsive";
import { ALL_PERMISSIONS } from "@/config/permissions";
import { PAGINATION_CONFIG } from "@/config/pagination";
import { useAccountingDocumentCategoryActiveQuery } from "@/hooks/useAccountingDocumentCategories";
import {
    useAccountingDocumentsQuery,
    useDeleteAccountingDocumentMutation,
    useAccountingFoldersQuery,
    useCreateAccountingFolderMutation,
    useUpdateAccountingFolderMutation,
    useDeleteAccountingFolderMutation,
    useLockAccountingDocumentMutation
} from "@/hooks/useAccountingDocuments";
import { useAllDossierDocumentsQuery } from "@/hooks/useDossierDocuments";
import { useAccountingDossierByIdQuery } from "@/hooks/useAccountingDossiers";
import { useDepartmentsByCompanyQuery } from "@/hooks/useDepartments";
import {
    callFetchCompany,
    callExportAccountingDocuments,
    callFetchUsersCrossCompany,
    callFetchUser,
    callFetchFolderTree,
    callFetchFolderDocuments,
} from "@/config/api";

import ModalAccountingDoc from "./ModalAccountingDoc";
import ViewDetailDocument from "../document/view.document";
import DossierDocumentList from "../accounting-dossiers/components/DossierDocumentList";

const { Sider, Content } = Layout;
const ACCOUNTING_DOC_CATEGORY_CODE = "ACCOUNTING_DOC";

type AccountingFolderNode = IDocumentFolder & { id: number };
type AccountingListRow = IAccountingDossierDocument & { sourceType: "DOSSIER"; rowKey: string };
type CompanyOption = {
    id: number;
    name: string;
};
type ReconcileUser = {
    id: string;
    name?: string;
    email?: string;
    companyName?: string;
    departmentName?: string;
    employeeCode?: string;
};

const CURRENT_YEAR = dayjs().year();
const YEAR_OPTIONS = Array.from({ length: 6 }, (_, index) => {
    const year = CURRENT_YEAR - index;
    return { label: String(year), value: year };
});

const MONTH_OPTIONS = Array.from({ length: 12 }, (_, index) => {
    const month = index + 1;
    return { label: `Tháng ${String(month).padStart(2, "0")}`, value: month };
});

const STATUS_OPTIONS = [
    { label: "Tất cả tình trạng file", value: "ALL" },
    { label: "Có tệp", value: "HAS_FILE" },
    { label: "Chưa có tệp", value: "MISSING_FILE" },
];

const VALIDITY_OPTIONS = [
    { label: "Tất cả hiệu lực", value: "ALL" },
    { label: "Còn hiệu lực", value: "EFFECTIVE" },
    { label: "Đã hủy", value: "CANCELLED" },
];

const filterItemStyle = { minWidth: 0 };
const getValidityLabel = (active?: boolean) => active ? "Còn hiệu lực" : "Đã hủy";
const CHECK_STATUS_LABEL: Record<string, { color: string; label: string }> = {
    PENDING: { color: "default", label: "Chờ kiểm tra" },
    VALID: { color: "success", label: "Hợp lệ" },
    NEED_SUPPLEMENT: { color: "warning", label: "Cần bổ sung" },
    INVALID: { color: "error", label: "Không hợp lệ" },
    NOT_REQUIRED: { color: "blue", label: "Không yêu cầu" },
};

const buildDocumentFileUrl = (fileName: string) =>
    `/api/v1/files/public?folder=documents&fileName=${encodeURIComponent(fileName)}`;

const splitDossierFileUrls = (value?: string) =>
    value?.split(",").map((item) => item.trim()).filter(Boolean) ?? [];

const DOSSIER_STATUS_LABEL: Record<string, { color: string; label: string }> = {
    APPROVED: { color: "success", label: "Đã duyệt" },
    ARCHIVED: { color: "purple", label: "Đã lưu trữ" },
};

const AccountingDocumentPage = () => {
    const isCompact = useIsMobile(1180);
    const canCreate = useAccess(ALL_PERMISSIONS.ACCOUNTING_DOCUMENTS.CREATE);
    const canView = useAccess(ALL_PERMISSIONS.ACCOUNTING_DOCUMENTS.GET_BY_ID);
    const canUpdate = useAccess(ALL_PERMISSIONS.ACCOUNTING_DOCUMENTS.UPDATE);
    const canDelete = useAccess(ALL_PERMISSIONS.ACCOUNTING_DOCUMENTS.DELETE);

    const [openModal, setOpenModal] = useState(false);
    const [openViewModal, setOpenViewModal] = useState(false);
    const [dataInit, setDataInit] = useState<IDocument | null>(null);
    const [viewDossierId, setViewDossierId] = useState<number | undefined>();
    const [openDossierModal, setOpenDossierModal] = useState(false);

    const [searchValue, setSearchValue] = useState("");
    const [current, setCurrent] = useState(PAGINATION_CONFIG.DEFAULT_PAGE);
    const [pageSize, setPageSize] = useState(PAGINATION_CONFIG.DEFAULT_PAGE_SIZE);

    const [companies, setCompanies] = useState<CompanyOption[]>([]);
    const [selectedCompanyId, setSelectedCompanyId] = useState<number | undefined>();
    const [selectedDepartmentId, setSelectedDepartmentId] = useState<number | undefined>();
    const [selectedCategoryId, setSelectedCategoryId] = useState<number | undefined>();
    const [selectedYear, setSelectedYear] = useState<number>(CURRENT_YEAR);
    const [selectedMonth, setSelectedMonth] = useState<number | undefined>();
    const [selectedStatus, setSelectedStatus] = useState("ALL");
    const [selectedValidity, setSelectedValidity] = useState("ALL");
    const [selectedLockStatus, setSelectedLockStatus] = useState("ALL");
    const [selectedFolderId, setSelectedFolderId] = useState<number | undefined>();
    const [filtersOpen, setFiltersOpen] = useState(false);

    // Folder Modals
    const [isFolderModalVisible, setIsFolderModalVisible] = useState(false);
    const [folderForm] = Form.useForm();
    const [folderParentId, setFolderParentId] = useState<number | null>(null);
    const [editingFolderId, setEditingFolderId] = useState<number | null>(null);

    // Reconciliation drawer
    const [reconcileOpen, setReconcileOpen] = useState(false);
    const [reconcileSearch, setReconcileSearch] = useState("");
    const [reconcileUsers, setReconcileUsers] = useState<ReconcileUser[]>([]);
    const [reconcileUserId, setReconcileUserId] = useState<string | undefined>();
    const [reconcileUserName, setReconcileUserName] = useState("");
    const [reconcileFolders, setReconcileFolders] = useState<IDocumentFolder[]>([]);
    const [reconcileFolderId, setReconcileFolderId] = useState<number | undefined>();
    const [reconcileDocs, setReconcileDocs] = useState<IDocument[]>([]);
    const [loadingReconcileUsers, setLoadingReconcileUsers] = useState(false);
    const [loadingReconcileFolders, setLoadingReconcileFolders] = useState(false);
    const [loadingReconcileDocs, setLoadingReconcileDocs] = useState(false);
    const [reconcileUserNotice, setReconcileUserNotice] = useState("");

    const deleteMutation = useDeleteAccountingDocumentMutation();
    const createFolderMutation = useCreateAccountingFolderMutation();
    const updateFolderMutation = useUpdateAccountingFolderMutation();
    const deleteFolderMutation = useDeleteAccountingFolderMutation();
    const lockMutation = useLockAccountingDocumentMutation();

    const fetchCompanies = async () => {
        try {
            const res = await callFetchCompany("page=1&size=100");
            if (res?.data?.result) {
                const companyOptions = res.data.result
                    .filter((company) => company.id != null)
                    .map((company) => ({ id: company.id as number, name: company.name }));
                setCompanies(companyOptions);
                if (companyOptions.length > 0) {
                    setSelectedCompanyId(companyOptions[0].id);
                }
            }
        } catch (error) {
            console.error("Không thể tải danh sách công ty:", error);
        }
    };

    useEffect(() => {
        fetchCompanies();
    }, []);

    const { data: folderTree } = useAccountingFoldersQuery(selectedCompanyId as number);
    const { data: departments = [] } = useDepartmentsByCompanyQuery(selectedCompanyId as number);
    const { data: accountingCategories = [] } = useAccountingDocumentCategoryActiveQuery();
    const { data: viewDossier, isFetching: isFetchingViewDossier } = useAccountingDossierByIdQuery(viewDossierId);

    useEffect(() => {
        setSelectedDepartmentId(undefined);
        setSelectedFolderId(undefined);
        setCurrent(1);
    }, [selectedCompanyId]);

    useEffect(() => {
        if (!reconcileOpen || !selectedCompanyId) return;

        const timer = window.setTimeout(async () => {
            setLoadingReconcileUsers(true);
            setReconcileUserNotice("");
            try {
                const baseParams = {
                    page: 1,
                    size: 50,
                    companyId: selectedCompanyId,
                    ...(reconcileSearch.trim() && { search: reconcileSearch.trim() }),
                };
                const params = queryString.stringify({
                    ...baseParams,
                    ...(selectedDepartmentId && { departmentId: selectedDepartmentId }),
                });
                const res = await callFetchUsersCrossCompany(params);
                let users = res.data?.result || [];

                if (selectedDepartmentId && users.length === 0) {
                    const companyParams = queryString.stringify(baseParams);
                    const companyRes = await callFetchUsersCrossCompany(companyParams);
                    users = companyRes.data?.result || [];
                    setReconcileUserNotice(
                        users.length > 0
                            ? "Phòng ban này chưa có nhân viên được gán trực tiếp, đang hiển thị nhân viên toàn công ty."
                            : "Không tìm thấy nhân viên trong công ty/phòng ban đã chọn."
                    );
                }

                if (users.length === 0) {
                    const scopeParams = queryString.stringify({
                        page: 1,
                        size: 50,
                        ...(reconcileSearch.trim() && { search: reconcileSearch.trim() }),
                    });
                    const scopeRes = await callFetchUsersCrossCompany(scopeParams);
                    users = scopeRes.data?.result || [];
                    setReconcileUserNotice(
                        users.length > 0
                            ? "Không thấy nhân viên trong công ty/phòng ban đang chọn, đang hiển thị nhân viên trong phạm vi bạn có quyền truy cập."
                            : "Không tìm thấy nhân viên phù hợp."
                    );
                }

                // Fallback cuối: dùng admin API để tìm user khi tất cả cross-company đều trả về rỗng
                if (users.length === 0) {
                    const adminParams = queryString.stringify({
                        page: 1,
                        size: 50,
                        companyId: selectedCompanyId,
                        ...(reconcileSearch.trim() && { search: reconcileSearch.trim() }),
                    });
                    const adminRes = await callFetchUser(adminParams);
                    const adminUsers = (adminRes.data?.result || []).map((u: any) => ({
                        id: u.id,
                        name: u.name,
                        email: u.email,
                        companyName: u.company?.name,
                        departmentName: u.department?.name,
                        employeeCode: u.employeeCode,
                    }));
                    users = adminUsers;
                    setReconcileUserNotice(
                        users.length > 0
                            ? "Không tìm thấy nhân viên qua phạm vi quyền, đang hiển thị kết quả tìm kiếm toàn hệ thống."
                            : "Không tìm thấy nhân viên phù hợp trong hệ thống."
                    );
                }

                setReconcileUsers(users);
                console.log("[Reconcile] Users loaded:", users.length, users);
            } catch (error: unknown) {
                setReconcileUsers([]);
                setReconcileUserNotice(
                    error instanceof Error
                        ? error.message
                        : "Không thể tải danh sách nhân viên. Vui lòng kiểm tra quyền truy cập."
                );
            } finally {
                setLoadingReconcileUsers(false);
            }
        }, 250);

        return () => window.clearTimeout(timer);
    }, [reconcileOpen, selectedCompanyId, selectedDepartmentId, reconcileSearch]);

    useEffect(() => {
        setReconcileUserId(undefined);
        setReconcileUserName("");
        setReconcileFolders([]);
        setReconcileFolderId(undefined);
        setReconcileDocs([]);
        setReconcileUserNotice("");
    }, [selectedCompanyId, selectedDepartmentId]);

    const periodRange = useMemo(() => {
        const start = selectedMonth
            ? dayjs(`${selectedYear}-${String(selectedMonth).padStart(2, "0")}-01`).startOf("month")
            : dayjs(`${selectedYear}-01-01`).startOf("year");
        const end = selectedMonth ? start.endOf("month") : start.endOf("year");
        return { start, end };
    }, [selectedMonth, selectedYear]);

    const dossierDocumentQueryParams = {
        current,
        pageSize,
        ...(selectedCompanyId && { "dossier.company.id": selectedCompanyId }),
        ...(selectedDepartmentId && { "dossier.department.id": selectedDepartmentId }),
        ...(selectedCategoryId && { "accountingCategory.id": selectedCategoryId }),
        ...(selectedYear && { "createdAt>=": periodRange.start.toISOString(), "createdAt<=": periodRange.end.toISOString() }),
        ...(selectedStatus !== "ALL" && { fileStatus: selectedStatus }),
        dossierStatus: "APPROVED,ARCHIVED",
        ...(searchValue.trim() && { keyword: searchValue.trim() }),
    };
    const dossierDocumentQueryStr = queryString.stringify(dossierDocumentQueryParams);
    const { data: dossierDocumentPageData, isLoading: isLoadingDossierDocuments } = useAllDossierDocumentsQuery(dossierDocumentQueryStr);
    const dossierDocuments = dossierDocumentPageData?.result || [];
    const totalDossierDocuments = dossierDocumentPageData?.meta.total || 0;

    const selectedDepartmentName = departments.find((department) => department.id === selectedDepartmentId)?.name || "Tất cả phòng ban";
    const activeFilterCount = [
        selectedDepartmentId,
        selectedCategoryId,
        selectedMonth,
        selectedStatus !== "ALL",
        selectedYear !== CURRENT_YEAR,
    ].filter(Boolean).length;

    const tableRows: AccountingListRow[] = useMemo(() => {
        return dossierDocuments.map((item) => ({
            ...item,
            sourceType: "DOSSIER" as const,
            rowKey: `dossier-${item.id}`,
        }));
    }, [dossierDocuments]);

    const totalRows = totalDossierDocuments;

    const columns: ProColumns<AccountingListRow>[] = [
        {
            title: "Bộ chứng từ",
            dataIndex: "dossierCode",
            width: 170,
            render: (dom, entity) => (
                <Space direction="vertical" size={4}>
                    <Button
                        type="link"
                        size="small"
                        onClick={() => {
                            if (entity.dossierId) {
                                setViewDossierId(entity.dossierId);
                                setOpenDossierModal(true);
                            }
                        }}
                    >
                        <Tag color="magenta" style={{ fontSize: 13, padding: "4px 8px", borderRadius: 6, margin: 0, cursor: "pointer" }}>
                            {entity.dossierCode || `BCT-${entity.dossierId}`}
                        </Tag>
                    </Button>
                </Space>
            ),
        },
        {
            title: "Số hóa đơn / Mã lưu",
            dataIndex: "invoiceNumber",
            width: 180,
            render: (_, entity) => (
                <Space direction="vertical" size={2}>
                    <span style={{ fontWeight: 600, color: "#1f2937" }}>
                        {entity.invoiceNumber || "---"}
                    </span>
                    {entity.document?.documentCode && (
                        <span style={{ fontSize: 11, color: "#9ca3af" }}>
                            {entity.document.documentCode}
                        </span>
                    )}
                </Space>
            )
        },
        {
            title: "Nhà cung cấp",
            dataIndex: "partnerName",
            width: 180,
            render: (_, entity) => (
                <span style={{ color: "#374151" }}>
                    {entity.partnerName || "---"}
                </span>
            )
        },
        {
            title: "Số tiền",
            dataIndex: "amount",
            width: 140,
            render: (_, entity) => (
                <span style={{ fontWeight: 600, color: "#059669" }}>
                    {entity.amount ? `${new Intl.NumberFormat('vi-VN').format(entity.amount)} ${entity.currency || 'VND'}` : "---"}
                </span>
            )
        },
        {
            title: "Tên chứng từ",
            dataIndex: "documentName",
            width: 360,
            render: (dom, entity) => (
                <Space direction="vertical" size={3} style={{ maxWidth: 340 }}>
                    <span
                        title={entity.documentName}
                        style={{
                            display: "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical",
                            overflow: "hidden",
                            fontWeight: 600,
                            color: "#111827",
                            lineHeight: 1.35,
                        }}
                    >
                        {entity.documentName}
                    </span>
                    <span style={{ color: "#6b7280", fontSize: 12 }}>
                        {entity.dossierContent || "Bộ chứng từ chưa có nội dung"}
                    </span>
                </Space>
            ),
        },
        {
            title: "Loại CT",
            dataIndex: ["accountingCategory", "categoryName"],
            width: 135,
            render: (_, entity) => (
                <Tag color="processing" style={{ borderRadius: 6 }}>
                    {entity.accountingCategory?.symbol || entity.accountingCategory?.categoryName || "Chưa chọn"}
                </Tag>
            ),
        },
        {
            title: "Phòng ban",
            dataIndex: ["department", "name"],
            width: 180,
            render: (_, entity) => (
                <Space direction="vertical" size={0} style={{ maxWidth: '100%' }}>
                    <span style={{ fontWeight: 500, display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={entity.department?.name || "Chưa gán"}>
                        {entity.department?.name || "Chưa gán"}
                    </span>
                    <span
                        style={{
                            color: "#8c8c8c",
                            fontSize: 11,
                            display: "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical",
                            overflow: "hidden",
                            lineHeight: 1.3
                        }}
                        title={entity.company?.name || ""}
                    >
                        {entity.company?.name || ""}
                    </span>
                </Space>
            ),
        },
        {
            title: "Người tải lên",
            dataIndex: "createdBy",
            width: 150,
            render: (_, entity) => (
                <Space>
                    <div style={{ width: 24, height: 24, borderRadius: "50%", background: "#e6f4ff", color: "#1677ff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold", fontSize: 12 }}>
                        {(entity.createdBy || "A")[0].toUpperCase()}
                    </div>
                    <span style={{ fontWeight: 500 }}>{entity.createdBy || "System"}</span>
                </Space>
            ),
        },
        {
            title: "Ngày tạo",
            dataIndex: "issuedDate",
            width: 105,
            render: (dom, entity) => (
                <>{dayjs(entity.invoiceDate || entity.createdAt).format("DD/MM/YYYY")}</>
            ),
        },
        {
            title: "Trạng thái",
            dataIndex: "active",
            width: 145,
            render: (_, entity) => {
                const checkMeta = CHECK_STATUS_LABEL[entity.checkStatus || "PENDING"] || CHECK_STATUS_LABEL.PENDING;
                return (
                    <Space direction="vertical" size={4}>
                        <Tag color={checkMeta.color} style={{ borderRadius: 6, margin: 0, fontWeight: 600 }}>
                            {checkMeta.label}
                        </Tag>
                        {entity.dossierStatus && <Tag style={{ margin: 0 }}>{entity.dossierStatus}</Tag>}
                    </Space>
                );
            },
        },

        {
            title: "Hành động",
            align: "center",
            width: 150,
            fixed: "right",
            hideInSearch: true,
            render: (dom, entity) => (
                <Space size={4} align="center">
                    <Tooltip title="Xem nguyên bộ chứng từ">
                        <Button
                            type="text"
                            size="small"
                            icon={<FileDoneOutlined style={{ color: "#722ed1", fontSize: 16 }} />}
                            onClick={() => {
                                if (entity.dossierId) {
                                    setViewDossierId(entity.dossierId);
                                    setOpenDossierModal(true);
                                }
                            }}
                        />
                    </Tooltip>
                    {canView && (
                        <Tooltip title="Mở file/link đầu tiên của chứng từ con">
                            <Button
                                type="text"
                                size="small"
                                icon={<EyeOutlined style={{ color: "#1677ff", fontSize: 16 }} />}
                                onClick={() => {
                                    const firstFile = splitDossierFileUrls(entity.fileUrl)[0];
                                    const firstUrl = entity.externalLink || (firstFile ? buildDocumentFileUrl(firstFile) : undefined);
                                    if (firstUrl) {
                                        window.open(firstUrl, "_blank");
                                    } else {
                                        Modal.info({
                                            title: "Chưa có file/link",
                                            content: "Chứng từ con này đang nằm trong bộ hồ sơ nhưng chưa có file hoặc link đính kèm.",
                                        });
                                    }
                                }}
                            />
                        </Tooltip>
                    )}
                </Space>
            ),
        },
    ];

    const buildTreeData = (items?: IDocumentFolder[]): DataNode[] => {
        if (!items) return [];
        return items
            .filter((item): item is AccountingFolderNode => item.id != null)
            .map((item) => ({
                key: item.id,
                title: (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {item.folderName} <span style={{ color: '#8c8c8c', fontSize: '12px' }}>({item.documentCount || 0})</span>
                        </span>
                        {canCreate && (
                            <Dropdown
                                trigger={['click']}
                                menu={{
                                    items: [
                                        {
                                            key: 'add_sub',
                                            icon: <FolderAddOutlined />,
                                            label: 'Thêm thư mục con',
                                            onClick: (e) => {
                                                e.domEvent.stopPropagation();
                                                setFolderParentId(item.id);
                                                setEditingFolderId(null);
                                                folderForm.resetFields();
                                                setIsFolderModalVisible(true);
                                            }
                                        },
                                        {
                                            key: 'edit',
                                            icon: <EditOutlined />,
                                            label: 'Đổi tên',
                                            onClick: (e) => {
                                                e.domEvent.stopPropagation();
                                                setEditingFolderId(item.id);
                                                folderForm.setFieldsValue({ folderName: item.folderName });
                                                setIsFolderModalVisible(true);
                                            }
                                        },
                                        {
                                            key: 'delete',
                                            icon: <DeleteOutlined />,
                                            label: 'Xoá',
                                            danger: true,
                                            onClick: (e) => {
                                                e.domEvent.stopPropagation();
                                                Modal.confirm({
                                                    title: 'Xác nhận xoá thư mục',
                                                    content: `Bạn có chắc muốn xoá thư mục "${item.folderName}"? Không thể khôi phục lại.`,
                                                    okText: 'Xoá',
                                                    cancelText: 'Huỷ',
                                                    okButtonProps: { danger: true },
                                                    onOk: () => deleteFolderMutation.mutate(item.id)
                                                });
                                            }
                                        }
                                    ]
                                }}
                            >
                                <Button
                                    type="text"
                                    size="small"
                                    icon={<MoreOutlined />}
                                    onClick={e => e.stopPropagation()}
                                />
                            </Dropdown>
                        )}
                    </div>
                ),
                icon: ({ expanded }) => expanded ? <FolderOpenOutlined style={{ color: '#faad14' }} /> : <FolderOutlined style={{ color: '#faad14' }} />,
                children: buildTreeData(item.children),
            }));
    };

    const treeData = useMemo(() => {
        if (!folderTree) return [];

        const sortNodes = (nodes: IDocumentFolder[]): IDocumentFolder[] => {
            const sorted = [...nodes].sort((a, b) => {
                const nameA = a.folderName || "";
                const nameB = b.folderName || "";
                // Sort descending so "Năm 2026" appears before "Năm 2025"
                return nameB.localeCompare(nameA);
            });

            sorted.forEach(node => {
                if (node.children && node.children.length > 0) {
                    node.children = sortNodes(node.children);
                }
            });
            return sorted;
        };

        const sortedTree = sortNodes(folderTree);
        return buildTreeData(sortedTree);
    }, [folderTree]);
    const resetFilters = () => {
        setSearchValue("");
        setSelectedDepartmentId(undefined);
        setSelectedCategoryId(undefined);
        setSelectedYear(CURRENT_YEAR);
        setSelectedMonth(undefined);
        setSelectedStatus("ALL");
        setSelectedValidity("ALL");
        setSelectedLockStatus("ALL");
        setSelectedFolderId(undefined);
        setCurrent(1);
    };

    const handleSaveFolder = async () => {
        try {
            const values = await folderForm.validateFields();
            if (editingFolderId) {
                await updateFolderMutation.mutateAsync({ id: editingFolderId, data: { ...values, companyId: selectedCompanyId } });
            } else {
                await createFolderMutation.mutateAsync({ ...values, parentId: folderParentId, companyId: selectedCompanyId });
            }
            setIsFolderModalVisible(false);
        } catch (error) {
            console.error("Không thể lưu thư mục kế toán:", error);
        }
    };

    const buildReconcileTreeData = (items?: IDocumentFolder[]): DataNode[] => {
        if (!items) return [];
        return items
            .filter((item) => item.id != null)
            .map((item) => ({
                key: item.id as number,
                title: (
                    <Space>
                        <span>{item.folderName}</span>
                        <Tag color="default" style={{ marginInlineEnd: 0 }}>{item.documentCount || 0}</Tag>
                    </Space>
                ),
                icon: ({ expanded }) => expanded
                    ? <FolderOpenOutlined style={{ color: "#faad14" }} />
                    : <FolderOutlined style={{ color: "#faad14" }} />,
                children: buildReconcileTreeData(item.children),
            }));
    };

    const reconcileTreeData = useMemo(() => buildReconcileTreeData(reconcileFolders), [reconcileFolders]);

    const handleSelectReconcileUser = async (userId?: string) => {
        const user = reconcileUsers.find((item) => item.id === userId);
        setReconcileUserId(userId);
        setReconcileUserName(user?.name || "");
        setReconcileFolders([]);
        setReconcileFolderId(undefined);
        setReconcileDocs([]);

        if (!userId) return;
        setLoadingReconcileFolders(true);
        try {
            const res = await callFetchFolderTree(userId);
            const folders = res.data || [];
            setReconcileFolders(folders);
            if (folders[0]?.id) {
                setReconcileFolderId(folders[0].id);
            }
        } catch {
            setReconcileFolders([]);
        } finally {
            setLoadingReconcileFolders(false);
        }
    };

    useEffect(() => {
        if (!reconcileOpen || !reconcileFolderId) return;

        const fetchDocs = async () => {
            setLoadingReconcileDocs(true);
            try {
                const res = await callFetchFolderDocuments(reconcileFolderId);
                setReconcileDocs((res.data || []).filter(
                    (doc) => doc.category?.categoryCode === ACCOUNTING_DOC_CATEGORY_CODE
                ));
            } catch {
                setReconcileDocs([]);
            } finally {
                setLoadingReconcileDocs(false);
            }
        };

        fetchDocs();
    }, [reconcileOpen, reconcileFolderId]);

    const handleCreateFromEmployeeDocument = (record: IDocument) => {
        setDataInit({
            documentName: record.documentName,
            issuedDate: record.issuedDate || dayjs().toISOString(),
            fileUrls: record.fileUrls || [],
            folder: selectedFolderId ? { id: selectedFolderId, folderName: "" } : undefined,
            accountingCategory: record.accountingCategory || (
                selectedCategoryId
                    ? accountingCategories.find((item) => item.id === selectedCategoryId)
                    : undefined
            ),
        } as IDocument);
        setReconcileOpen(false);
        setOpenModal(true);
    };

    const filter = (
        <div className="flex w-full flex-col gap-3">
            <SearchFilter
                searchPlaceholder="Mã hồ sơ, nội dung, người tải..."
                showAddButton={false}
                showFilterButton={false}
                showResetButton={true}
                activeFilterCount={activeFilterCount}
                onSearch={(val) => {
                    setSearchValue(val);
                    setCurrent(1);
                }}
                onReset={resetFilters}
                extraButtons={
                    <Tag color="blue" style={{ margin: 0, padding: "8px 12px", borderRadius: 8, height: 40, display: "flex", alignItems: "center" }}>
                        Chứng từ được tạo trong bộ chứng từ
                    </Tag>
                }
                guideSearchId="accounting-doc-search-input"
            />

            <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 4 }}>
                <Button
                    icon={<FilterOutlined />}
                    type={filtersOpen ? "primary" : "default"}
                    onClick={() => setFiltersOpen((open) => !open)}
                    style={{ height: 40, borderRadius: 10, display: "flex", alignItems: "center" }}
                >
                    Bộ lọc
                </Button>
            </div>

            {filtersOpen && (
                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: isCompact
                            ? "repeat(auto-fit, minmax(180px, 1fr))"
                            : "repeat(auto-fit, minmax(180px, 1fr))",
                        gap: 12,
                        background: "#f9fafb",
                        border: "1px solid #e5e7eb",
                        borderRadius: 12,
                        padding: "16px 20px",
                        marginTop: 4,
                    }}
                >
                    <div style={filterItemStyle}>
                        <Select
                            style={{ width: "100%", height: 40 }}
                            value={selectedCompanyId}
                            onChange={(value) => setSelectedCompanyId(value)}
                            options={companies.map(c => ({ label: c.name, value: c.id }))}
                            placeholder="Lọc theo công ty"
                            suffixIcon={<BankOutlined />}
                        />
                    </div>
                    <div style={filterItemStyle}>
                        <Select
                            allowClear
                            showSearch
                            optionFilterProp="label"
                            style={{ width: "100%", height: 40 }}
                            value={selectedDepartmentId}
                            onChange={(value) => {
                                setSelectedDepartmentId(value);
                                setCurrent(1);
                            }}
                            options={departments.map(department => ({ label: department.name, value: department.id }))}
                            placeholder="Lọc theo phòng ban"
                            suffixIcon={<ApartmentOutlined />}
                        />
                    </div>
                    <div style={filterItemStyle}>
                        <Select
                            style={{ width: "100%", height: 40 }}
                            value={selectedYear}
                            onChange={(value) => {
                                setSelectedYear(value);
                                setCurrent(1);
                            }}
                            options={YEAR_OPTIONS}
                            placeholder="Năm"
                        />
                    </div>
                    <div style={filterItemStyle}>
                        <Select
                            allowClear
                            style={{ width: "100%", height: 40 }}
                            value={selectedMonth}
                            onChange={(value) => {
                                setSelectedMonth(value);
                                setCurrent(1);
                            }}
                            options={MONTH_OPTIONS}
                            placeholder="Kỳ / tháng"
                        />
                    </div>
                    <div style={filterItemStyle}>
                        <Select
                            allowClear
                            showSearch
                            optionFilterProp="label"
                            style={{ width: "100%", height: 40 }}
                            value={selectedCategoryId}
                            onChange={(value) => {
                                setSelectedCategoryId(value);
                                setCurrent(1);
                            }}
                            options={accountingCategories.map(category => ({
                                label: category.categoryName,
                                value: category.id,
                            }))}
                            placeholder="Loại chứng từ kế toán"
                        />
                    </div>
                    <div style={filterItemStyle}>
                        <Select
                            style={{ width: "100%", height: 40 }}
                            value={selectedStatus}
                            onChange={(value) => {
                                setSelectedStatus(value);
                                setCurrent(1);
                            }}
                            options={STATUS_OPTIONS}
                            placeholder="Tình trạng file"
                        />
                    </div>
                </div>
            )}
        </div>
    );

    return (
        <PageContainer title="Chứng từ Kế toán" filter={filter}>
            <Layout style={{ background: '#fff', padding: 0, borderRadius: 8, minHeight: 620, border: "1px solid #eef0f4" }}>
                    <Sider width={0} collapsed style={{ display: "none" }}>
                        <Space direction="vertical" size={16} style={{ width: "100%" }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 12, borderBottom: '1px dashed #e5e7eb' }}>
                                <span style={{ fontWeight: 700, fontSize: 15, color: '#374151' }}>
                                    <FolderOpenOutlined style={{ color: '#ff5fa2', marginRight: 6 }} /> Thư mục lưu trữ
                                </span>
                                {canCreate && (
                                    <Tooltip title="Tạo thư mục gốc">
                                        <Button
                                            type="text"
                                            size="small"
                                            icon={<PlusOutlined style={{ color: '#ff5fa2' }} />}
                                            style={{ background: '#fff0f6' }}
                                            onClick={() => {
                                                setFolderParentId(null);
                                                setEditingFolderId(null);
                                                folderForm.resetFields();
                                                setIsFolderModalVisible(true);
                                            }}
                                        />
                                    </Tooltip>
                                )}
                            </div>

                            {folderTree && folderTree.length > 0 ? (
                                <Tree
                                    blockNode
                                    treeData={treeData}
                                    selectedKeys={selectedFolderId ? [String(selectedFolderId)] : []}
                                    onSelect={(selectedKeys) => {
                                        if (selectedKeys.length > 0) {
                                            setSelectedFolderId(Number(selectedKeys[0]));
                                            setCurrent(1);
                                        } else {
                                            setSelectedFolderId(undefined);
                                        }
                                    }}
                                    style={{ background: 'transparent' }}
                                />
                            ) : (
                                <Empty
                                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                                    description={<span style={{ color: '#9ca3af', fontSize: 13 }}>Chưa có thư mục nào</span>}
                                />
                            )}
                        </Space>
                    </Sider>


                    <Content style={{ padding: '16px 20px', background: '#fff', width: "100%" }}>
                        <div style={{ marginBottom: 16, display: "flex", justifyContent: "space-between", gap: 16, alignItems: "center" }}>
                            <Space direction="vertical" size={2}>
                                <span style={{ fontSize: 18, fontWeight: 800, color: "#111827" }}>
                                    Danh sách chứng từ
                                </span>
                                <span style={{ color: "#6b7280" }}>
                                    {totalRows} chứng từ thuộc bộ · {selectedMonth ? `Tháng ${String(selectedMonth).padStart(2, "0")}` : "Cả năm"} {selectedYear} · {selectedDepartmentName}
                                </span>
                            </Space>
                            <Space wrap style={{ justifyContent: "flex-end" }}>
                                {searchValue && <Tag color="blue">Tìm: {searchValue}</Tag>}
                                {selectedStatus !== "ALL" && <Tag color="orange">{STATUS_OPTIONS.find((item) => item.value === selectedStatus)?.label}</Tag>}
                            </Space>
                        </div>

                        <DataTable
                            rowKey="rowKey"
                            loading={isLoadingDossierDocuments}
                            columns={columns}
                            dataSource={tableRows}
                            pagination={{
                                current,
                                pageSize,
                                total: selectedStatus === "ALL" ? totalRows : tableRows.length,
                                showSizeChanger: true,
                                onChange: (page, size) => {
                                    setCurrent(page);
                                    setPageSize(size);
                                },
                            }}
                        />
                    </Content>
                </Layout>

            {openModal && (
                <ModalAccountingDoc
                    open={openModal}
                    setOpen={setOpenModal}
                    dataInit={dataInit}
                    setDataInit={setDataInit}
                />
            )}

            <ViewDetailDocument
                open={openViewModal}
                onClose={setOpenViewModal}
                dataInit={dataInit}
                setDataInit={setDataInit}
                isAccounting={true}
            />

            <Drawer
                title="Đối soát chứng từ nhân viên"
                open={reconcileOpen}
                onClose={() => setReconcileOpen(false)}
                width={getModalWidth(980)}
                destroyOnClose
            >
                <Space direction="vertical" size={16} style={{ width: "100%" }}>
                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns: isCompact ? "1fr" : "1fr 1fr 1.2fr",
                            gap: 12,
                        }}
                    >
                        <Select
                            showSearch
                            optionFilterProp="label"
                            value={selectedCompanyId}
                            onChange={(value) => setSelectedCompanyId(value)}
                            options={companies.map((company) => ({ label: company.name, value: company.id }))}
                            placeholder="Chọn công ty"
                            suffixIcon={<BankOutlined />}
                        />
                        <Select
                            allowClear
                            showSearch
                            optionFilterProp="label"
                            value={selectedDepartmentId}
                            onChange={(value) => {
                                setSelectedDepartmentId(value);
                                setCurrent(1);
                            }}
                            options={departments.map((department) => ({ label: department.name, value: department.id }))}
                            placeholder="Chọn phòng ban"
                            suffixIcon={<ApartmentOutlined />}
                        />
                        <Input
                            allowClear
                            value={reconcileSearch}
                            onChange={(event) => setReconcileSearch(event.target.value)}
                            placeholder="Tìm nhân viên theo tên hoặc email..."
                            prefix={<SearchOutlined style={{ color: "#9ca3af" }} />}
                        />
                    </div>

                    <Select
                        allowClear
                        showSearch
                        loading={loadingReconcileUsers}
                        value={reconcileUserId}
                        onChange={handleSelectReconcileUser}
                        optionFilterProp="labelText"
                        placeholder="Chọn nhân viên cần lấy chứng từ"
                        style={{ width: "100%" }}
                        options={reconcileUsers.map((user) => ({
                            value: user.id,
                            labelText: `${user.name || ""} ${user.email || ""} ${user.companyName || ""} ${user.departmentName || ""} ${user.employeeCode || ""}`,
                            label: (
                                <Space>
                                    <Avatar size="small" icon={<UserOutlined />}>
                                        {user.name?.[0]}
                                    </Avatar>
                                    <Space direction="vertical" size={0}>
                                        <Space size={6}>
                                            <span>{user.name}</span>
                                            <span style={{ color: "#8c8c8c" }}>{user.email}</span>
                                        </Space>
                                        <span style={{ color: "#8c8c8c", fontSize: 12 }}>
                                            {[user.companyName, user.departmentName].filter(Boolean).join(" - ") || "Chưa gán đơn vị"}
                                        </span>
                                    </Space>
                                </Space>
                            ),
                        }))}
                        notFoundContent={
                            loadingReconcileUsers
                                ? <Spin size="small" />
                                : (reconcileUserNotice || "Không có nhân viên")
                        }
                    />

                    {reconcileUserNotice && (
                        <Tag color={reconcileUsers.length > 0 ? "gold" : "red"} style={{ width: "fit-content", whiteSpace: "normal" }}>
                            {reconcileUserNotice}
                        </Tag>
                    )}

                    {reconcileUserId ? (
                        <Layout style={{ minHeight: 460, background: "#fff", border: "1px solid #eef0f4", borderRadius: 8 }}>
                            <Sider width={300} breakpoint="lg" collapsedWidth={0} style={{ background: "#fff", borderRight: "1px solid #eef0f4", padding: 12 }}>
                                <Space direction="vertical" size={12} style={{ width: "100%" }}>
                                    <div>
                                        <div style={{ fontWeight: 700, color: "#111827" }}>{reconcileUserName}</div>
                                        <div style={{ fontSize: 12, color: "#6b7280" }}>Kho cá nhân của nhân viên</div>
                                    </div>
                                    {loadingReconcileFolders ? (
                                        <div style={{ textAlign: "center", padding: 24 }}>
                                            <Spin />
                                        </div>
                                    ) : reconcileTreeData.length > 0 ? (
                                        <Tree
                                            showIcon
                                            blockNode
                                            defaultExpandAll
                                            treeData={reconcileTreeData}
                                            selectedKeys={reconcileFolderId ? [reconcileFolderId] : []}
                                            onSelect={(keys) => {
                                                setReconcileFolderId(keys.length > 0 ? Number(keys[0]) : undefined);
                                            }}
                                        />
                                    ) : (
                                        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Nhân viên chưa có thư mục" />
                                    )}
                                </Space>
                            </Sider>
                            <Content style={{ padding: 16, background: "#fff" }}>
                                <Table<IDocument>
                                    rowKey={(record) => String(record.id)}
                                    loading={loadingReconcileDocs}
                                    dataSource={reconcileDocs}
                                    pagination={{ pageSize: 6 }}
                                    locale={{ emptyText: "Thư mục này chưa có chứng từ kế toán" }}
                                    columns={[
                                        {
                                            title: "Tài liệu trong thư mục",
                                            dataIndex: "documentName",
                                            render: (_, record) => (
                                                <Space direction="vertical" size={2}>
                                                    <Space>
                                                        <FileDoneOutlined style={{ color: record.fileUrls?.length ? "#1677ff" : "#9ca3af" }} />
                                                        <span style={{ fontWeight: 600 }}>{record.documentName}</span>
                                                        {record.isShortcut && <Tag color="blue">Lối tắt</Tag>}
                                                    </Space>
                                                    <span style={{ color: "#6b7280", fontSize: 12 }}>
                                                        {record.documentCode} · {record.fileUrls?.length || 0} tệp
                                                    </span>
                                                </Space>
                                            ),
                                        },
                                        {
                                            title: "Ngày tải",
                                            dataIndex: "createdAt",
                                            width: 120,
                                            render: (date) => date ? dayjs(date).format("DD/MM/YYYY") : "--",
                                        },
                                        {
                                            title: "Thao tác",
                                            width: 140,
                                            align: "center" as const,
                                            render: (_, record) => (
                                                <Button
                                                    type="primary"
                                                    size="small"
                                                    disabled={!record.fileUrls || record.fileUrls.length === 0}
                                                    onClick={() => handleCreateFromEmployeeDocument(record)}
                                                >
                                                    Lấy chứng từ
                                                </Button>
                                            ),
                                        },
                                    ]}
                                />
                            </Content>
                        </Layout>
                    ) : (
                        <Empty
                            image={Empty.PRESENTED_IMAGE_SIMPLE}
                            description="Chọn công ty, phòng ban rồi chọn nhân viên để xem kho chứng từ cá nhân"
                        />
                    )}
                </Space>
            </Drawer>

            <Modal
                title={editingFolderId ? "Đổi tên thư mục" : "Tạo thư mục mới"}
                open={isFolderModalVisible}
                onOk={handleSaveFolder}
                onCancel={() => setIsFolderModalVisible(false)}
                okText="Lưu"
                cancelText="Huỷ"
                confirmLoading={createFolderMutation.isPending || updateFolderMutation.isPending}
            >
                <Form form={folderForm} layout="vertical">
                    <Form.Item
                        name="folderName"
                        label="Tên thư mục"
                        rules={[{ required: true, message: 'Vui lòng nhập tên thư mục' }]}
                    >
                        <Input placeholder="VD: Năm 2026, Tháng 06..." autoFocus />
                    </Form.Item>
                </Form>
            </Modal>

            <Modal
                title={`Chi tiết bộ chứng từ: ${viewDossier?.dossierCode || ""}`}
                open={openDossierModal}
                onCancel={() => {
                    setOpenDossierModal(false);
                    setViewDossierId(undefined);
                }}
                footer={null}
                width={getModalWidth(1000)}
                destroyOnClose
            >
                <Spin spinning={isFetchingViewDossier}>
                    {viewDossier ? (
                        <Space direction="vertical" size={16} style={{ width: "100%", marginTop: 12 }}>
                            <div style={{ background: "#f9fafb", padding: 16, borderRadius: 8, border: "1px solid #e5e7eb" }}>
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                                    <div>
                                        <div style={{ color: "#6b7280", fontSize: 12 }}>Nội dung</div>
                                        <div style={{ fontWeight: 600 }}>{viewDossier.content}</div>
                                    </div>
                                    <div>
                                        <div style={{ color: "#6b7280", fontSize: 12 }}>Ngày lập</div>
                                        <div style={{ fontWeight: 600 }}>{viewDossier.createdAt ? dayjs(viewDossier.createdAt).format("DD/MM/YYYY HH:mm") : "--"}</div>
                                    </div>
                                    <div>
                                        <div style={{ color: "#6b7280", fontSize: 12 }}>Người lập</div>
                                        <div style={{ fontWeight: 600 }}>{viewDossier.createdBy || "--"}</div>
                                    </div>
                                    <div>
                                        <div style={{ color: "#6b7280", fontSize: 12 }}>Trạng thái</div>
                                        <div>
                                            <Tag color={DOSSIER_STATUS_LABEL[viewDossier.status]?.color || "default"}>
                                                {DOSSIER_STATUS_LABEL[viewDossier.status]?.label || viewDossier.status}
                                            </Tag>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <DossierDocumentList dossier={viewDossier} editable={false} reviewable={false} />
                        </Space>
                    ) : (
                        <Empty description="Không tìm thấy dữ liệu bộ chứng từ" />
                    )}
                </Spin>
            </Modal>
        </PageContainer>
    );
};

export default AccountingDocumentPage;
