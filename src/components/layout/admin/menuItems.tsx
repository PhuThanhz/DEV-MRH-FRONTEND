import {
    AppstoreOutlined,
    UserOutlined,
    ApiOutlined,
    ExceptionOutlined,
    BankOutlined,
    TeamOutlined,
    ClusterOutlined,
    OrderedListOutlined,
    ApartmentOutlined,
    StarOutlined,
    FileTextOutlined,
    FileDoneOutlined, // thêm icon mới nếu cần cho subgroup
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

    const full = [
        // ===================== TỔNG QUAN =====================
        {
            type: "group",
            label: "TỔNG QUAN",
        },
        {
            label: <Link to="/admin">Dashboard</Link>,
            key: "/admin",
            icon: <AppstoreOutlined />,
        },

        // ===================== NGƯỜI DÙNG & PHÂN QUYỀN =====================
        {
            type: "group",
            label: "NGƯỜI DÙNG & PHÂN QUYỀN",
        },
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

        // ===================== TỔ CHỨC (GROUP LẠI CHO GỌN) =====================
        {
            type: "group",
            label: "TỔ CHỨC",
        },

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
        {
            type: "subgroup",
            label: "Quy trình & Đánh giá",
            icon: <FileDoneOutlined />,
            children: [
                ...(checkPermission(ALL_PERMISSIONS.COMPANY_PROCEDURES.GET_PAGINATE)
                    ? [
                        {
                            label: <Link to="/admin/company-procedures">Quy trình công ty</Link>,
                            key: "/admin/company-procedures",
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

        // ===================== CẤU HÌNH QUY TRÌNH =====================
        {
            type: "group",
            label: "CẤU HÌNH QUY TRÌNH",
        },

        ...(checkPermission(ALL_PERMISSIONS.PROCESS_ACTIONS.GET_PAGINATE)
            ? [
                {
                    label: <Link to="/admin/process-action">Raci</Link>,
                    key: "/admin/process-action",
                    icon: <ClusterOutlined />,
                },
            ]
            : []),
        /* ===================== PERMISSION CATEGORIES ===================== */
        ...(checkPermission(ALL_PERMISSIONS.PERMISSION_CATEGORY.GET_PAGINATE)
            ? [
                {
                    label: <Link to="/admin/permission-categories">Danh mục phân quyền</Link>,
                    key: "/admin/permission-categories",
                    icon: <FileTextOutlined />,
                },
            ]
            : []),



    ];

    return full;
};