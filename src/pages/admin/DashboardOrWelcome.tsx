import { lazy, Suspense } from "react";
import { Navigate } from "react-router-dom";
import { Skeleton } from "antd";
import { useAppSelector } from "@/redux/hooks";
import { ALL_PERMISSIONS } from "@/config/permissions";
import { PATHS } from "@/constants/paths";

// Dashboard có chart và nhiều phần thống kê; chỉ tải khi người dùng thực sự được vào trang này.
const DashboardPage = lazy(() => import("./dashboard/dashboard"));

const DashboardLoading = () => (
    <div style={{ padding: 24 }}>
        <Skeleton active paragraph={{ rows: 8 }} />
    </div>
);

const DashboardView = () => (
    <Suspense fallback={<DashboardLoading />}>
        <DashboardPage />
    </Suspense>
);

const DashboardOrWelcome = () => {
    const permissions = useAppSelector(
        state => state.account.user?.role?.permissions || []
    );
    const roleName = useAppSelector(
        state => state.account.user?.role?.name?.toUpperCase() || ""
    );

    if (roleName === "SUPER_ADMIN" || import.meta.env.VITE_ACL_ENABLE === "false") {
        return <DashboardView />;
    }

    const hasPermission = (permission: { apiPath: string; method: string; module: string }) =>
        permissions.some(
            (item: any) =>
                item.apiPath === permission.apiPath &&
                item.method === permission.method &&
                item.module === permission.module
        );

    const hasDashboard = hasPermission(ALL_PERMISSIONS.DASHBOARD.GET_SUMMARY);
    const hasAccountingDossiers = hasPermission(ALL_PERMISSIONS.ACCOUNTING_DOSSIERS.GET_PAGINATE);
    const hasAccountingDocuments = hasPermission(ALL_PERMISSIONS.ACCOUNTING_DOCUMENTS.GET_PAGINATE);

    if (hasDashboard) {
        return <DashboardView />;
    }

    if (hasAccountingDossiers) {
        return <Navigate to={PATHS.ADMIN.ACCOUNTING_DOSSIERS} replace />;
    }

    if (hasAccountingDocuments) {
        return <Navigate to={PATHS.ADMIN.ACCOUNTING_DOCUMENTS} replace />;
    }

    const hasOverview = permissions.some(
        (item: any) =>
            item.module === ALL_PERMISSIONS.DASHBOARD.GET_SUMMARY.module
    );

    return hasOverview ? <Navigate to={PATHS.ADMIN.OVERVIEW} replace /> : <Navigate to="/" replace />;
};

export default DashboardOrWelcome;
