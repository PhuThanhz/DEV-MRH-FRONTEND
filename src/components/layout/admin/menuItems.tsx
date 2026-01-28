import {
    AppstoreOutlined,
    UserOutlined,
    ApiOutlined,
    ExceptionOutlined,
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
        {
            type: "group",
            label: "TỔNG QUAN",
        },

        {
            label: <Link to="/admin">Dashboard</Link>,
            key: "/admin",
            icon: <AppstoreOutlined />,
        },

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

    ];

    return full;
};
