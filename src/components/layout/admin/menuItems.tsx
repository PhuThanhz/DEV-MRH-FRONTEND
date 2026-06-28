import {
    AppstoreOutlined,
    UserOutlined,
    ApiOutlined,
    ExceptionOutlined,
    BankOutlined,
    TeamOutlined,
    ClusterOutlined,
    OrderedListOutlined,
    FileTextOutlined,
    FileDoneOutlined,
    FolderOpenOutlined,
    FileOutlined,
    QrcodeOutlined,
    TrophyOutlined, CheckCircleOutlined, SettingOutlined,
    AccountBookOutlined,
} from "@ant-design/icons";
import { Link } from "react-router-dom";
import { ALL_PERMISSIONS } from "@/config/permissions";

interface Permission {
    apiPath: string;
    method: string;
}

export const generateMenuItems = (permissions: Permission[] | undefined) => {
    const ACL_ENABLE = import.meta.env.VITE_ACL_ENABLE;

    if (!permissions?.length && ACL_ENABLE !== "false") {
        return [];
    }

    const checkPermission = (perm: Permission) =>
        permissions?.find(
            (item) =>
                item.apiPath === perm.apiPath && item.method === perm.method
        ) || ACL_ENABLE === "false";

    // ── pre-check từng nhóm ──
    const hasUserGroup =
        checkPermission(ALL_PERMISSIONS.USERS.GET_PAGINATE) ||
        checkPermission(ALL_PERMISSIONS.ROLES.GET_PAGINATE) ||
        checkPermission(ALL_PERMISSIONS.PERMISSIONS.GET_PAGINATE);

    const hasEmployeeGroup =
        checkPermission(ALL_PERMISSIONS.USERS.GET_PAGINATE);

    const hasOrgGroup =
        checkPermission(ALL_PERMISSIONS.COMPANIES.GET_PAGINATE) ||
        checkPermission(ALL_PERMISSIONS.DEPARTMENTS.GET_PAGINATE) ||
        checkPermission(ALL_PERMISSIONS.SECTIONS.GET_PAGINATE) ||
        checkPermission(ALL_PERMISSIONS.PROCEDURES.GET_PAGINATE) ||
        checkPermission(ALL_PERMISSIONS.JOB_DESCRIPTIONS.GET_PAGINATE) ||
        hasEmployeeGroup;

    const hasConfigGroup =
        checkPermission(ALL_PERMISSIONS.PROCESS_ACTIONS.GET_PAGINATE) ||
        checkPermission(ALL_PERMISSIONS.PERMISSION_CATEGORY.GET_PAGINATE) ||
        checkPermission(ALL_PERMISSIONS.DOCUMENT_CATEGORIES.GET_PAGINATE) ||
        checkPermission(ALL_PERMISSIONS.POSITION_LEVELS.GET_PAGINATE) ||
        checkPermission(ALL_PERMISSIONS.JOB_TITLES.GET_PAGINATE) ||
        checkPermission(ALL_PERMISSIONS.ACCOUNTING_DOCUMENT_CATEGORIES.GET_PAGINATE);

    const hasQuyTrinhSubgroup =
        checkPermission(ALL_PERMISSIONS.PROCEDURES.GET_PAGINATE) ||
        checkPermission(ALL_PERMISSIONS.JOB_DESCRIPTIONS.GET_PAGINATE);

    // ✅ THÊM MỚI
    const hasVanBanGroup =
        checkPermission(ALL_PERMISSIONS.DOCUMENTS.GET_PAGINATE) ||
        checkPermission(ALL_PERMISSIONS.DOCUMENT_FOLDERS.GET_TREE);

    const hasKeToanGroup =
        checkPermission(ALL_PERMISSIONS.ACCOUNTING_DOSSIERS.GET_PAGINATE) ||
        checkPermission(ALL_PERMISSIONS.ACCOUNTING_DOCUMENTS.GET_PAGINATE);

    const hasEvaluationGroup =
        checkPermission(ALL_PERMISSIONS.EVALUATION.GET_TEMPLATES) ||
        checkPermission(ALL_PERMISSIONS.EVALUATION.GET_PERIODS) ||
        checkPermission(ALL_PERMISSIONS.EVALUATION.GET_COMPLETED_SUMMARY) ||
        checkPermission(ALL_PERMISSIONS.EVALUATION.GET_MY_RECORDS) ||
        checkPermission(ALL_PERMISSIONS.EVALUATION.GET_MANAGER_RECORDS);


    const full = [
        // ===================== TỔNG QUAN =====================
        ...(checkPermission(ALL_PERMISSIONS.DASHBOARD.GET_SUMMARY)
            ? [
                {
                    label: <Link to="/admin">Tổng quan</Link>,
                    key: "/admin",
                    icon: <AppstoreOutlined />,
                },
            ]
            : []),

        // ===================== TỔ CHỨC =====================
        // Nhóm con: Công ty & Cấu trúc tổ chức
        ...(checkPermission(ALL_PERMISSIONS.COMPANIES.GET_PAGINATE) ||
            checkPermission(ALL_PERMISSIONS.DEPARTMENTS.GET_PAGINATE) ||
            checkPermission(ALL_PERMISSIONS.SECTIONS.GET_PAGINATE)
            ? [
                {
                    type: "subgroup",
                    label: "Cấu trúc tổ chức",
                    icon: <BankOutlined />,
                    children: [
                        ...(checkPermission(ALL_PERMISSIONS.COMPANIES.GET_PAGINATE)
                            ? [
                                {
                                    label: <Link to="/admin/company">Công ty</Link>,
                                    key: "/admin/company",
                                },
                            ]
                            : []),
                        ...(checkPermission(ALL_PERMISSIONS.DEPARTMENTS.GET_PAGINATE)
                            ? [
                                {
                                    label: <Link to="/admin/departments">Phòng ban</Link>,
                                    key: "/admin/departments",
                                },
                            ]
                            : []),
                        ...(checkPermission(ALL_PERMISSIONS.SECTIONS.GET_PAGINATE)
                            ? [
                                {
                                    label: <Link to="/admin/sections">Bộ phận</Link>,
                                    key: "/admin/sections",
                                },
                            ]
                            : []),
                    ],
                },
            ]
            : []),

        // ===================== NGƯỜI DÙNG & PHÂN QUYỀN =====================
        ...(hasUserGroup || hasEmployeeGroup
            ? [
                {
                    type: "subgroup",
                    label: "Quản lý người dùng",
                    icon: <UserOutlined />,
                    children: [
                        ...(hasEmployeeGroup
                            ? [
                                {
                                    label: <Link to="/admin/employees">Nhân viên</Link>,
                                    key: "/admin/employees",
                                },
                            ]
                            : []),
                        ...(checkPermission(ALL_PERMISSIONS.USERS.GET_PAGINATE)
                            ? [
                                {
                                    label: <Link to="/admin/user">Người dùng</Link>,
                                    key: "/admin/user",
                                },
                            ]
                            : []),
                        ...(checkPermission(ALL_PERMISSIONS.ROLES.GET_PAGINATE)
                            ? [
                                {
                                    label: <Link to="/admin/role">Vai trò</Link>,
                                    key: "/admin/role",
                                },
                            ]
                            : []),
                        ...(checkPermission(ALL_PERMISSIONS.PERMISSIONS.GET_PAGINATE)
                            ? [
                                {
                                    label: <Link to="/admin/permission">Quyền hạn</Link>,
                                    key: "/admin/permission",
                                },
                            ]
                            : []),
                    ],
                },
            ]
            : []),

        // ===================== TÀI LIỆU & QUY ĐỊNH =====================
        ...(hasQuyTrinhSubgroup || hasVanBanGroup
            ? [
                {
                    type: "subgroup",
                    label: "Tài liệu & Quy định",
                    icon: <FolderOpenOutlined />,
                    children: [
                        ...(checkPermission(ALL_PERMISSIONS.PROCEDURES.GET_PAGINATE)
                            ? [
                                {
                                    label: <Link to="/admin/procedures">Quy trình</Link>,
                                    key: "/admin/procedures",
                                },
                            ]
                            : []),
                        ...(checkPermission(ALL_PERMISSIONS.JOB_DESCRIPTIONS.GET_PAGINATE)
                            ? [
                                {
                                    label: <Link to="/admin/job-descriptions">Mô tả công việc</Link>,
                                    key: "/admin/job-descriptions",
                                },
                            ]
                            : []),
                        ...(checkPermission(ALL_PERMISSIONS.DOCUMENTS.GET_PAGINATE)
                            ? [
                                {
                                    label: <Link to="/admin/documents">Văn bản</Link>,
                                    key: "/admin/documents",
                                },
                            ]
                            : []),
                        ...(checkPermission(ALL_PERMISSIONS.DOCUMENT_FOLDERS.GET_TREE)
                            ? [
                                {
                                    label: <Link to="/admin/personal-drive">Kho lưu trữ cá nhân</Link>,
                                    key: "/admin/personal-drive",
                                },
                            ]
                            : []),
                    ],
                },
            ]
            : []),

        // ===================== KẾ TOÁN & TÀI CHÍNH =====================
        ...(hasKeToanGroup
            ? [
                {
                    type: "subgroup",
                    label: "Kế toán & Tài chính",
                    icon: <AccountBookOutlined />,
                    children: [
                        ...(checkPermission(ALL_PERMISSIONS.ACCOUNTING_DOSSIERS.GET_PAGINATE)
                            ? [
                                {
                                    label: <Link to="/admin/accounting-dossiers">Bộ chứng từ kế toán</Link>,
                                    key: "/admin/accounting-dossiers",
                                },
                            ]
                            : []),
                        ...(checkPermission(ALL_PERMISSIONS.ACCOUNTING_DOCUMENTS.GET_PAGINATE)
                            ? [
                                {
                                    label: <Link to="/admin/accounting-documents">Chứng từ kế toán</Link>,
                                    key: "/admin/accounting-documents",
                                },
                            ]
                            : []),
                    ],
                },
            ]
            : []),

        // ===================== ĐÁNH GIÁ HQCV =====================

        ...(hasEvaluationGroup
            ? [
                {
                    type: "subgroup",
                    label: "Nghiệp vụ đánh giá",
                    icon: <FileDoneOutlined />,
                    children: [
                        ...(checkPermission(ALL_PERMISSIONS.EVALUATION.GET_TEMPLATES)
                            ? [
                                {
                                    label: <Link to="/admin/evaluation/templates">Mẫu đánh giá</Link>,
                                    key: "/admin/evaluation/templates",
                                },
                            ]
                            : []),

                        ...(checkPermission(ALL_PERMISSIONS.EVALUATION.GET_PERIODS)
                            ? [
                                {
                                    label: <Link to="/admin/evaluation/periods">Kỳ đánh giá</Link>,
                                    key: "/admin/evaluation/periods",
                                },
                            ]
                            : []),

                        // Quy trình thực hiện đánh giá (Gộp 3 tab)
                        ...(checkPermission(ALL_PERMISSIONS.EVALUATION.GET_MY_RECORDS) || checkPermission(ALL_PERMISSIONS.EVALUATION.GET_MANAGER_RECORDS)
                            ? [
                                {
                                    label: <Link to="/admin/evaluation/process">Tiến trình đánh giá</Link>,
                                    key: "/admin/evaluation/process",
                                },
                            ]
                            : []),

                        // "Tổng hợp Kết quả" — Dành cho Giám đốc / HR
                        ...(checkPermission(ALL_PERMISSIONS.EVALUATION.GET_COMPLETED_SUMMARY)
                            ? [
                                {
                                    label: <Link to="/admin/evaluation/summary">Báo cáo tổng hợp</Link>,
                                    key: "/admin/evaluation/summary",
                                },
                            ]
                            : []),
                    ],
                },
            ]
            : []),

        // ===================== CẤU HÌNH & DANH MỤC =====================
        ...(hasConfigGroup
            ? [
                {
                    type: "subgroup",
                    label: "Cấu hình & Danh mục",
                    icon: <SettingOutlined />,
                    children: [
                        ...(checkPermission(ALL_PERMISSIONS.PROCESS_ACTIONS.GET_PAGINATE)
                            ? [
                                {
                                    label: <Link to="/admin/process-action">Raci</Link>,
                                    key: "/admin/process-action",
                                },
                            ]
                            : []),

                        ...(checkPermission(ALL_PERMISSIONS.PERMISSION_CATEGORY.GET_PAGINATE)
                            ? [
                                {
                                    label: <Link to="/admin/permission-categories">Danh mục phân quyền</Link>,
                                    key: "/admin/permission-categories",
                                },
                            ]
                            : []),

                        ...(checkPermission(ALL_PERMISSIONS.DOCUMENT_CATEGORIES.GET_PAGINATE)
                            ? [
                                {
                                    label: <Link to="/admin/document-categories">Danh mục loại văn bản</Link>,
                                    key: "/admin/document-categories",
                                },
                            ]
                            : []),

                        ...(checkPermission(ALL_PERMISSIONS.POSITION_LEVELS.GET_PAGINATE)
                            ? [
                                {
                                    label: <Link to="/admin/position-levels">Bậc chức danh</Link>,
                                    key: "/admin/position-levels",
                                },
                            ]
                            : []),

                        ...(checkPermission(ALL_PERMISSIONS.JOB_TITLES.GET_PAGINATE)
                            ? [
                                {
                                    label: <Link to="/admin/job-titles">Chức danh</Link>,
                                    key: "/admin/job-titles",
                                },
                            ]
                            : []),

                        ...(checkPermission(ALL_PERMISSIONS.ACCOUNTING_DOCUMENT_CATEGORIES.GET_PAGINATE)
                            ? [
                                {
                                    label: <Link to="/admin/accounting-document-categories">Loại chứng từ kế toán</Link>,
                                    key: "/admin/accounting-document-categories",
                                },
                            ]
                            : []),
                    ],
                },
            ]
            : []),

        // ===================== CÔNG CỤ =====================
        { type: "group", label: "CÔNG CỤ" },
        {
            label: "",
            key: "qr-scanner-toggle",
            icon: <QrcodeOutlined />,
        },
    ];

    return full;
};
