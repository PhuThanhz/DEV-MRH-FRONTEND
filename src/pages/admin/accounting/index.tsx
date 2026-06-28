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
import DataTable from "@/components/common/data-table";

import type { IDocument, IDocumentFolder } from "@/types/backend";
import useAccess from "@/hooks/useAccess";
import { useIsMobile } from "@/hooks/useIsMobile";
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
import { useDepartmentsByCompanyQuery } from "@/hooks/useDepartments";
import {
    callFetchCompany,
    callExportAccountingDocuments,
    callFetchUsersCrossCompany,
    callFetchUser,
    callFetchFolderTree,
    callFetchFolderDocuments,
} from "@/config/api";
import * as XLSX from "xlsx";

import ModalAccountingDoc from "./ModalAccountingDoc";
import ViewDetailDocument from "../document/view.document";

const { Sider, Content } = Layout;
const ACCOUNTING_DOC_CATEGORY_CODE = "ACCOUNTING_DOC";

type AccountingFolderNode = IDocumentFolder & { id: number };
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

const AccountingDocumentPage = () => {
    const isCompact = useIsMobile(1180);
    const canCreate = useAccess(ALL_PERMISSIONS.ACCOUNTING_DOCUMENTS.CREATE);
    const canView = useAccess(ALL_PERMISSIONS.ACCOUNTING_DOCUMENTS.GET_BY_ID);
    const canUpdate = useAccess(ALL_PERMISSIONS.ACCOUNTING_DOCUMENTS.UPDATE);
    const canDelete = useAccess(ALL_PERMISSIONS.ACCOUNTING_DOCUMENTS.DELETE);

    const [openModal, setOpenModal] = useState(false);
    const [openViewModal, setOpenViewModal] = useState(false);
    const [dataInit, setDataInit] = useState<IDocument | null>(null);

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

    const queryParams = {
        current,
        pageSize,
        ...(selectedCompanyId && { "department.company.id": selectedCompanyId }),
        ...(selectedDepartmentId && { "department.id": selectedDepartmentId }),
        ...(selectedCategoryId && { "accountingCategory.id": selectedCategoryId }),
        ...(selectedYear && { "issuedDate>=": periodRange.start.toISOString(), "issuedDate<=": periodRange.end.toISOString() }),
        ...(selectedFolderId && { "folder.id": selectedFolderId }),
        ...(selectedValidity !== "ALL" && { validity: selectedValidity }),
        ...(selectedLockStatus !== "ALL" && { isLocked: selectedLockStatus === "LOCKED" }),
        ...(searchValue.trim() && { keyword: searchValue.trim() }),
    };

    const queryStr = queryString.stringify(queryParams);
    const { data: pageData, isLoading } = useAccountingDocumentsQuery(queryStr);
    const documents = pageData?.result || [];
    const totalDocuments = pageData?.meta.total || 0;
    const selectedDepartmentName = departments.find((department) => department.id === selectedDepartmentId)?.name || "Tất cả phòng ban";
    const activeFilterCount = [
        selectedDepartmentId,
        selectedCategoryId,
        selectedMonth,
        selectedStatus !== "ALL",
        selectedValidity !== "ALL",
        selectedLockStatus !== "ALL",
        selectedYear !== CURRENT_YEAR,
    ].filter(Boolean).length;

    const filteredDocuments = useMemo(() => {
        const result = documents;

        if (selectedStatus === "HAS_FILE") {
            return result.filter((item) => item.fileUrls && item.fileUrls.length > 0);
        }

        if (selectedStatus === "MISSING_FILE") {
            return result.filter((item) => !item.fileUrls || item.fileUrls.length === 0);
        }

        return result;
    }, [documents, selectedStatus]);

    const columns: ProColumns<IDocument>[] = [
        {
            title: "Mã lưu hồ sơ",
            dataIndex: "documentCode",
            width: 140,
            render: (dom, entity) => (
                <Tag color="geekblue" style={{ fontSize: 13, padding: "4px 8px", borderRadius: 6 }}>
                    {entity.documentCode}
                </Tag>
            ),
        },
        {
            title: "Tên chứng từ",
            dataIndex: "documentName",
            width: 320,
            render: (dom, entity) => (
                <Space direction="vertical" size={3} style={{ maxWidth: 300 }}>
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
                        {entity.folder?.folderName || "Chưa xếp thư mục"}
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
                        title={entity.department?.companyName || ""}
                    >
                        {entity.department?.companyName || ""}
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
                <>{entity.issuedDate ? dayjs(entity.issuedDate).format("DD/MM/YYYY") : ""}</>
            ),
        },
        {
            title: "Hiệu lực",
            dataIndex: "active",
            width: 115,
            render: (_, entity) => (
                <Tag color={entity.active ? "success" : "default"} style={{ borderRadius: 6, margin: 0, fontWeight: 600 }}>
                    {getValidityLabel(entity.active)}
                </Tag>
            ),
        },

        {
            title: "Hành động",
            align: "center",
            width: 150,
            fixed: "right",
            hideInSearch: true,
            render: (dom, entity) => (
                <Space size={4} align="center">
                    {canView && (
                        <Button
                            type="text"
                            size="small"
                            icon={<EyeOutlined style={{ color: "#1677ff", fontSize: 16 }} />}
                            onClick={() => {
                                setDataInit(entity);
                                setOpenViewModal(true);
                            }}
                        />
                    )}
                    {canUpdate && !entity.isLocked && (
                        <Button
                            type="text"
                            size="small"
                            icon={<EditOutlined style={{ color: "#fa8c16", fontSize: 16 }} />}
                            onClick={() => {
                                setDataInit(entity);
                                setOpenModal(true);
                            }}
                        />
                    )}
                    {canDelete && !entity.isLocked && (
                        <Popconfirm
                            title={`Bạn có chắc muốn xoá chứng từ này?`}
                            onConfirm={() => entity.id && deleteMutation.mutate(entity.id)}
                            okText="Xoá"
                            cancelText="Huỷ"
                        >
                            <Button
                                type="text"
                                size="small"
                                icon={<DeleteOutlined style={{ color: "#ff4d4f", fontSize: 16 }} />}
                            />
                        </Popconfirm>
                    )}
                    {/* Nút khoá dành cho Kế toán */}
                    {canUpdate && (
                        <Popconfirm
                            title={entity.isLocked ? "Mở khoá chứng từ này để nhân viên có thể sửa?" : "Khoá chứng từ này lại?"}
                            onConfirm={() => entity.id && lockMutation.mutate({ id: entity.id, lockStatus: !entity.isLocked })}
                            okText="Đồng ý"
                            cancelText="Huỷ"
                        >
                            <Button
                                type="text"
                                size="small"
                                icon={entity.isLocked
                                    ? <LockOutlined style={{ color: "#cf1322", fontSize: 16 }} />
                                    : <UnlockOutlined style={{ color: "#8c8c8c", fontSize: 16 }} />}
                                title={entity.isLocked ? `Đã khoá bởi ${entity.lockedBy}` : "Chưa khoá"}
                            />
                        </Popconfirm>
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

    return (
        <PageContainer title="Chứng từ Kế toán">
            <Space direction="vertical" size={16} style={{ width: "100%" }}>
                <div
                    style={{
                        background: "#fff",
                        border: "1px solid #eef0f4",
                        borderRadius: 8,
                        padding: 12,
                    }}
                >
                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns: isCompact ? "1fr" : "minmax(420px, 1fr) auto",
                            gap: 10,
                            alignItems: "center",
                        }}
                    >
                        <div style={filterItemStyle}>
                            <Input
                                size="large"
                                placeholder="Mã hồ sơ, nội dung, người tải..."
                                value={searchValue}
                                onChange={(e) => {
                                    setSearchValue(e.target.value);
                                    setCurrent(1);
                                }}
                                allowClear
                                prefix={<SearchOutlined style={{ color: "#9ca3af" }} />}
                            />
                        </div>
                        <Space
                            size={8}
                            wrap={isCompact}
                            style={{ justifyContent: isCompact ? "flex-start" : "flex-end", whiteSpace: "nowrap" }}
                        >
                            <Badge count={activeFilterCount} size="small">
                                <Button
                                    icon={<FilterOutlined />}
                                    type={filtersOpen ? "primary" : "default"}
                                    onClick={() => setFiltersOpen((open) => !open)}
                                >
                                    Bộ lọc
                                </Button>
                            </Badge>
                            <Tooltip title="Xuất danh sách đang lọc">
                                <Button
                                    icon={<FileExcelOutlined />}
                                    onClick={async () => {
                                        try {
                                            const res = await callExportAccountingDocuments(queryStr);
                                            if (res && res.data && Array.isArray(res.data)) {
                                                // Format data for Excel
                                                const excelData = res.data.map((doc, index) => ({
                                                    "STT": index + 1,
                                                    "Mã chứng từ": doc.documentCode || "",
                                                    "Nội dung / Diễn giải": doc.documentName || "",
                                                    "Ngày tạo": doc.issuedDate ? dayjs(doc.issuedDate).format("DD/MM/YYYY") : "",
                                                    "Người nhập": doc.createdBy || "",
                                                    "Ngày nhập hệ thống": doc.createdAt ? dayjs(doc.createdAt).format("DD/MM/YYYY HH:mm") : "",
                                                    "Hiệu lực": getValidityLabel(doc.active)
                                                }));

                                                const worksheet = XLSX.utils.json_to_sheet(excelData);
                                                const workbook = XLSX.utils.book_new();
                                                XLSX.utils.book_append_sheet(workbook, worksheet, "Chứng từ kế toán");

                                                // Make header bold
                                                const range = XLSX.utils.decode_range(worksheet['!ref'] || "A1:G1");
                                                for (let C = range.s.c; C <= range.e.c; ++C) {
                                                    const address = XLSX.utils.encode_col(C) + "1";
                                                    if (!worksheet[address]) continue;
                                                    worksheet[address].s = { font: { bold: true } };
                                                }

                                                // Auto adjust column widths
                                                const colWidths = [
                                                    { wch: 5 }, // STT
                                                    { wch: 20 }, // Mã
                                                    { wch: 40 }, // Nội dung
                                                    { wch: 15 }, // Ngày tạo
                                                    { wch: 20 }, // Người nhập
                                                    { wch: 20 }, // Ngày nhập hệ thống
                                                    { wch: 15 } // Hiệu lực
                                                ];
                                                worksheet['!cols'] = colWidths;

                                                XLSX.writeFile(workbook, "accounting_documents.xlsx");
                                            }
                                        } catch (error) {
                                            console.error("Export error:", error);
                                        }
                                    }}
                                >
                                    Xuất Excel
                                </Button>
                            </Tooltip>
                            <Tooltip title="Chọn nhân viên để lấy chứng từ từ kho cá nhân">
                                <Button
                                    icon={<AuditOutlined />}
                                    onClick={() => {
                                        setFiltersOpen(true);
                                        setReconcileOpen(true);
                                    }}
                                >
                                    Đối soát
                                </Button>
                            </Tooltip>
                            {canCreate && (
                                <Button
                                    icon={<PlusOutlined />}
                                    style={{
                                        height: 40,
                                        borderRadius: 10,
                                        backgroundColor: "#ff5fa2",
                                        color: "#fff",
                                        border: "none",
                                        fontWeight: 600,
                                        fontSize: 14,
                                        boxShadow: "0 2px 8px rgba(255, 95, 162, 0.35)",
                                        paddingInline: 18,
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 6,
                                        whiteSpace: "nowrap",
                                        flexShrink: 0,
                                        transition: "all 0.2s ease",
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.backgroundColor = "#ff4b97";
                                        e.currentTarget.style.boxShadow = "0 4px 14px rgba(255, 95, 162, 0.5)";
                                        e.currentTarget.style.transform = "translateY(-1px)";
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.backgroundColor = "#ff5fa2";
                                        e.currentTarget.style.boxShadow = "0 2px 8px rgba(255, 95, 162, 0.35)";
                                        e.currentTarget.style.transform = "translateY(0)";
                                    }}
                                    onClick={() => {
                                        setDataInit(selectedFolderId ? { folder: { id: selectedFolderId, folderName: "" } } as IDocument : null);
                                        setOpenModal(true);
                                    }}
                                >
                                    Thêm chứng từ
                                </Button>
                            )}
                        </Space>
                    </div>

                    {filtersOpen && (
                        <div
                            style={{
                                display: "grid",
                                gridTemplateColumns: isCompact
                                    ? "repeat(auto-fit, minmax(180px, 1fr))"
                                    : "1.3fr 1.15fr 90px 140px 1fr 150px 145px auto",
                                gap: 10,
                                alignItems: "center",
                                borderTop: "1px solid #eef0f4",
                                marginTop: 12,
                                paddingTop: 12,
                            }}
                        >
                            <div style={filterItemStyle}>
                                <Select
                                    style={{ width: "100%" }}
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
                                    style={{ width: "100%" }}
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
                                    style={{ width: "100%" }}
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
                                    style={{ width: "100%" }}
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
                                    style={{ width: "100%" }}
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
                                    style={{ width: "100%" }}
                                    value={selectedStatus}
                                    onChange={(value) => {
                                        setSelectedStatus(value);
                                        setCurrent(1);
                                    }}
                                    options={STATUS_OPTIONS}
                                    placeholder="Tình trạng file"
                                />
                            </div>
                            <div style={filterItemStyle}>
                                <Select
                                    style={{ width: "100%" }}
                                    value={selectedValidity}
                                    onChange={(value) => {
                                        setSelectedValidity(value);
                                        setCurrent(1);
                                    }}
                                    options={VALIDITY_OPTIONS}
                                    placeholder="Hiệu lực"
                                />
                            </div>
                            <div style={filterItemStyle}>
                                <Select
                                    style={{ width: "100%" }}
                                    value={selectedLockStatus}
                                    onChange={(value) => {
                                        setSelectedLockStatus(value);
                                        setCurrent(1);
                                    }}
                                    options={[
                                        { label: "Tất cả trạng thái", value: "ALL" },
                                        { label: "Chờ thu thập", value: "UNLOCKED" },
                                        { label: "Đã khoá", value: "LOCKED" },
                                    ]}
                                    placeholder="Trạng thái thu thập"
                                />
                            </div>
                            <Tooltip title="Đưa bộ lọc về kỳ hiện tại">
                                <Button icon={<ClearOutlined />} onClick={resetFilters}>
                                    Xóa lọc
                                </Button>
                            </Tooltip>
                        </div>
                    )}
                </div>

                <Layout style={{ background: '#fff', padding: 0, borderRadius: 8, minHeight: 620, border: "1px solid #eef0f4" }}>
                    <Sider width={280} style={{ background: '#fff', borderRight: '1px solid #eef0f4', padding: 16 }}>
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


                    <Content style={{ padding: '16px 20px', background: '#fff' }}>
                        <div style={{ marginBottom: 16, display: "flex", justifyContent: "space-between", gap: 16, alignItems: "center" }}>
                            <Space direction="vertical" size={2}>
                                <span style={{ fontSize: 18, fontWeight: 800, color: "#111827" }}>
                                    Danh sách chứng từ
                                </span>
                                <span style={{ color: "#6b7280" }}>
                                    {totalDocuments} chứng từ · {selectedMonth ? `Tháng ${String(selectedMonth).padStart(2, "0")}` : "Cả năm"} {selectedYear} · {selectedDepartmentName}
                                </span>
                            </Space>
                            <Space wrap style={{ justifyContent: "flex-end" }}>
                                {searchValue && <Tag color="blue">Tìm: {searchValue}</Tag>}
                                {selectedStatus !== "ALL" && <Tag color="orange">{STATUS_OPTIONS.find((item) => item.value === selectedStatus)?.label}</Tag>}
                                {selectedValidity !== "ALL" && <Tag color="green">{VALIDITY_OPTIONS.find((item) => item.value === selectedValidity)?.label}</Tag>}
                            </Space>
                        </div>

                        <DataTable
                            rowKey="id"
                            loading={isLoading}
                            columns={columns}
                            dataSource={filteredDocuments}
                            pagination={{
                                current,
                                pageSize,
                                total: selectedStatus === "ALL" ? totalDocuments : filteredDocuments.length,
                                showSizeChanger: true,
                                onChange: (page, size) => {
                                    setCurrent(page);
                                    setPageSize(size);
                                },
                            }}
                        />
                    </Content>
                </Layout>
            </Space>

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
                width={980}
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
                            <Sider width={300} style={{ background: "#fff", borderRight: "1px solid #eef0f4", padding: 12 }}>
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
        </PageContainer>
    );
};

export default AccountingDocumentPage;
