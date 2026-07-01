import { Navigate } from "react-router-dom";
import { useAppSelector } from "@/redux/hooks";
import NotFound from "@/components/share/not.found";
import Loading from "@/components/common/loading/loading";

const RoleBaseRoute = ({ children }: any) => {
    const user = useAppSelector((state) => state.account.user);
    const roleName = user?.role?.name?.toUpperCase() || "";

    const isAdmin = roleName.includes("ADMIN");
    const isEmployee = roleName === "EMPLOYEE";
    const isDeptManager = roleName === "DEPARTMENT_MANAGER";

    if (!isAdmin && !isEmployee && !isDeptManager) {
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
