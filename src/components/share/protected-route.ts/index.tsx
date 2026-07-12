import { Navigate } from "react-router-dom";
import { useAppSelector } from "@/redux/hooks";
import NotFound from "@/components/share/not.found";
import Loading from "@/components/common/loading/loading";

const RoleBaseRoute = ({ children }: any) => {
    const user = useAppSelector((state) => state.account.user);
    const roleName = user?.role?.name?.toUpperCase() || "";

    const isAdmin = roleName.includes("ADMIN");
    const isEmployee = roleName === "EMPLOYEE";
    const isDeptManager = roleName === "DEPARTMENT_MANAGER" || roleName === "ADMIN_SUB_3";
    const isAccountingRole = roleName.includes("ACCOUNTANT")
        || roleName.includes("KETOAN")
        || roleName.includes("KẾ TOÁN");
    const isDirector = roleName.includes("DIRECTOR") || roleName.includes("GIAMDOC") || roleName.includes("GIAM_DOC");

    if (!isAdmin && !isEmployee && !isDeptManager && !isAccountingRole && !isDirector) {
        return <NotFound />;
    }

    return <>{children}</>;
};

const ProtectedRoute = ({ children }: any) => {
    const { isAuthenticated, isLoading } = useAppSelector((state) => state.account);

    if (isLoading) return <Loading />;

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    return <RoleBaseRoute>{children}</RoleBaseRoute>;
};

export default ProtectedRoute;
