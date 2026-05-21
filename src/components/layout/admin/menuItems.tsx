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
    TrophyOutlined, CheckCircleOutlined,
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

    const checkPermission = (perm: any) =>
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
        checkPermission(ALL_PERMISSIONS.POSITION_LEVELS.GET_PAGINATE) ||
        checkPermission(ALL_PERMISSIONS.JOB_TITLES.GET_PAGINATE) ||
        checkPermission(ALL_PERMISSIONS.PROCEDURES.GET_PAGINATE) ||
        checkPermission(ALL_PERMISSIONS.JOB_DESCRIPTIONS.GET_PAGINATE) ||
        hasEmployeeGroup;

    const hasConfigGroup =
        checkPermission(ALL_PERMISSIONS.PROCESS_ACTIONS.GET_PAGINATE) ||
        checkPermission(ALL_PERMISSIONS.PERMISSION_CATEGORY.GET_PAGINATE);

    const hasQuyTrinhSubgroup =
        checkPermission(ALL_PERMISSIONS.PROCEDURES.GET_PAGINATE) ||
        checkPermission(ALL_PERMISSIONS.JOB_DESCRIPTIONS.GET_PAGINATE);

    // ✅ THÊM MỚI
    const hasVanBanGroup =
        checkPermission(ALL_PERMISSIONS.DOCUMENT_CATEGORIES.GET_PAGINATE) ||
        checkPermission(ALL_PERMISSIONS.DOCUMENTS.GET_PAGINATE);

    const hasEvaluationGroup =
        checkPermission(ALL_PERMISSIONS.EVALUATION.GET_TEMPLATES) ||
        checkPermission(ALL_PERMISSIONS.EVALUATION.GET_PERIODS) ||
        checkPermission(ALL_PERMISSIONS.EVALUATION.GET_MY_RECORDS);

    const full = [
        // ===================== TỔNG QUAN =====================
        ...(checkPermission(ALL_PERMISSIONS.DASHBOARD.GET_SUMMARY)
            ? [{ type: "group", label: "TỔNG QUAN" }]
            : []),
        ...(checkPermission(ALL_PERMISSIONS.DASHBOARD.GET_SUMMARY)
            ? [
                {
                    label: <Link to="/admin">Dashboard</Link>,
                    key: "/admin",
                    icon: <AppstoreOutlined />,
                },
            ]
            : []),

        // ===================== NGƯỜI DÙNG & PHÂN QUYỀN =====================
        ...(hasUserGroup
            ? [{ type: "group", label: "NGƯỜI DÙNG & PHÂN QUYỀN" }]
            : []),

        ...(checkPermission(ALL_PERMISSIONS.USERS.GET_PAGINATE)
            ? [
                {
                    label: <Link to="/admin/user">Người dùng</Link>,
                    key: "/admin/user",
                    icon: <UserOutlined />,
                },
            ]
            : []),
        ...(checkPermission(ALL_PERMISSIONS.ROLES.GET_PAGINATE)
            ? [
                {
                    label: <Link to="/admin/role">Vai trò</Link>,
                    key: "/admin/role",
                    icon: <ExceptionOutlined />,
                },
            ]
            : []),
        ...(checkPermission(ALL_PERMISSIONS.PERMISSIONS.GET_PAGINATE)
            ? [
                {
                    label: <Link to="/admin/permission">Quyền hạn</Link>,
                    key: "/admin/permission",
                    icon: <ApiOutlined />,
                },
            ]
            : []),

        // ===================== TỔ CHỨC =====================
        ...(hasOrgGroup
            ? [{ type: "group", label: "TỔ CHỨC" }]
            : []),

        ...(hasEmployeeGroup
            ? [
                {
                    label: <Link to="/admin/employees">Nhân viên</Link>,
                    key: "/admin/employees",
                    icon: <TeamOutlined />,
                },
            ]
            : []),

        // Nhóm con: Công ty & Cấu trúc tổ chức
        ...(checkPermission(ALL_PERMISSIONS.COMPANIES.GET_PAGINATE) ||
            checkPermission(ALL_PERMISSIONS.DEPARTMENTS.GET_PAGINATE) ||
            checkPermission(ALL_PERMISSIONS.SECTIONS.GET_PAGINATE)
            ? [
                {
                    type: "subgroup",
                    label: "Công ty & Cấu trúc tổ chức",
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

        // Nhóm con: Chức danh & Bậc
        ...(checkPermission(ALL_PERMISSIONS.POSITION_LEVELS.GET_PAGINATE) ||
            checkPermission(ALL_PERMISSIONS.JOB_TITLES.GET_PAGINATE)
            ? [
                {
                    type: "subgroup",
                    label: "Chức danh & Bậc",
                    icon: <OrderedListOutlined />,
                    children: [
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
                    ],
                },
            ]
            : []),

        // Nhóm con: Quy trình & Đánh giá
        ...(hasQuyTrinhSubgroup
            ? [
                {
                    type: "subgroup",
                    label: "Quy trình & Đánh giá",
                    icon: <FileDoneOutlined />,
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
                    ],
                },
            ]
            : []),

        // ===================== CẤU HÌNH QUY TRÌNH =====================
        ...(hasConfigGroup
            ? [{ type: "group", label: "CẤU HÌNH QUY TRÌNH" }]
            : []),

        ...(checkPermission(ALL_PERMISSIONS.PROCESS_ACTIONS.GET_PAGINATE)
            ? [
                {
                    label: <Link to="/admin/process-action">Raci</Link>,
                    key: "/admin/process-action",
                    icon: <ClusterOutlined />,
                },
            ]
            : []),

        ...(checkPermission(ALL_PERMISSIONS.PERMISSION_CATEGORY.GET_PAGINATE)
            ? [
                {
                    label: <Link to="/admin/permission-categories">Danh mục phân quyền</Link>,
                    key: "/admin/permission-categories",
                    icon: <FileTextOutlined />,
                },
            ]
            : []),

        // ===================== QUẢN LÝ VĂN BẢN =====================
        ...(hasVanBanGroup
            ? [{ type: "group", label: "QUẢN LÝ VĂN BẢN" }]
            : []),

        ...(checkPermission(ALL_PERMISSIONS.DOCUMENT_CATEGORIES.GET_PAGINATE)
            ? [
                {
                    label: <Link to="/admin/document-categories">Danh mục loại văn bản</Link>,
                    key: "/admin/document-categories",
                    icon: <FolderOpenOutlined />,
                },
            ]
            : []),

        ...(checkPermission(ALL_PERMISSIONS.DOCUMENTS.GET_PAGINATE)
            ? [
                {
                    label: <Link to="/admin/documents">Văn bản</Link>,
                    key: "/admin/documents",
                    icon: <FileOutlined />,
                },
            ]
            : []),

        // ===================== ĐÁNH GIÁ HQCV =====================
        ...(hasEvaluationGroup
            ? [{ type: "group", label: "ĐÁNH GIÁ HQCV" }]
            : []),

        ...(checkPermission(ALL_PERMISSIONS.EVALUATION.GET_TEMPLATES)
            ? [
                {
                    label: <Link to="/admin/evaluation/templates">Mẫu đánh giá</Link>,
                    key: "/admin/evaluation/templates",
                    icon: <FileTextOutlined />,
                },
            ]
            : []),

        ...(checkPermission(ALL_PERMISSIONS.EVALUATION.GET_PERIODS)
            ? [
                {
                    label: <Link to="/admin/evaluation/periods">Kỳ đánh giá</Link>,
                    key: "/admin/evaluation/periods",
                    icon: <OrderedListOutlined />,
                },
            ]
            : []),

        // "Đánh giá của tôi" — hiển thị cho tất cả user đã đăng nhập (không cần quyền đặc biệt)
        {
            label: <Link to="/admin/evaluation/my-records">Đánh giá của tôi</Link>,
            key: "/admin/evaluation/my-records",
            icon: <TrophyOutlined />,
        },
        
        // "Quản lý chấm điểm" — Quản lý trực tiếp chấm cho nhân viên
        {
            label: <Link to="/admin/evaluation/manager/pending">Quản lý chấm điểm</Link>,
            key: "/admin/evaluation/manager/pending",
            icon: <TeamOutlined />,
        },
        
        // "Phê duyệt đánh giá" — Quản lý gián tiếp phê duyệt
        {
            label: <Link to="/admin/evaluation/approval/pending">Phê duyệt đánh giá</Link>,
            key: "/admin/evaluation/approval/pending",
            icon: <CheckCircleOutlined />,
        },

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
