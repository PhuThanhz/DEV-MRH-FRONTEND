import { useAppSelector } from "@/redux/hooks";
import DashboardPage from "./dashboard";
import WelcomePage from "./WelcomePage";
import { ALL_PERMISSIONS } from "@/config/permissions";

const DashboardOrWelcome = () => {
    const permissions = useAppSelector(
        state => state.account.user?.role?.permissions || []
    );

    const hasDashboard = permissions.some(
        (item: any) =>
            item.apiPath === ALL_PERMISSIONS.DASHBOARD.GET_SUMMARY.apiPath &&
            item.method === ALL_PERMISSIONS.DASHBOARD.GET_SUMMARY.method &&
            item.module === ALL_PERMISSIONS.DASHBOARD.GET_SUMMARY.module
    );

    return hasDashboard ? <DashboardPage /> : <WelcomePage />;
};

export default DashboardOrWelcome;