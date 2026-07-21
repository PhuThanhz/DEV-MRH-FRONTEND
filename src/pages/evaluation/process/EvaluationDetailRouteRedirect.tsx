import { Navigate, useParams } from "react-router-dom";
import { buildEvaluationDrawerLink, type EvaluationDetailRole } from "@/components/common/notification/notificationNavigation";

interface EvaluationDetailRouteRedirectProps {
    role: EvaluationDetailRole;
}

const EvaluationDetailRouteRedirect = ({ role }: EvaluationDetailRouteRedirectProps) => {
    const { id } = useParams<{ id: string }>();
    if (!id || !/^\d+$/.test(id)) {
        return <Navigate to="/admin/evaluation/process?tab=PENDING_EVAL" replace />;
    }
    return <Navigate to={buildEvaluationDrawerLink(id, role)} replace />;
};

export default EvaluationDetailRouteRedirect;
