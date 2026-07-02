import { Navigate } from "react-router-dom";
import { useAppSelector } from "@/redux/hooks";
import DashboardPage from "./dashboard/dashboard";
import { ALL_PERMISSIONS } from "@/config/permissions";
import { PATHS } from "@/constants/paths";

const DashboardOrWelcome = () => {
    const permissions = useAppSelector(
        state => state.account.user?.role?.permissions || []
    );
    const roleName = useAppSelector(
        state => state.account.user?.role?.name?.toUpperCase() || ""
    );

    if (roleName === "SUPER_ADMIN" || import.meta.env.VITE_ACL_ENABLE === "false") {
        return <DashboardPage />;
    }

    const hasDashboard = permissions.some(
        (item: any) =>
            item.apiPath === ALL_PERMISSIONS.DASHBOARD.GET_SUMMARY.apiPath &&
            item.method === ALL_PERMISSIONS.DASHBOARD.GET_SUMMARY.method &&
            item.module === ALL_PERMISSIONS.DASHBOARD.GET_SUMMARY.module
    );

    return hasDashboard ? <DashboardPage /> : <Navigate to={PATHS.ADMIN.OVERVIEW} replace />;
};

export default DashboardOrWelcome;
