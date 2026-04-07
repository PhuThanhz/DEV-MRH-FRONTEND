import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import PageContainer from "@/components/common/data-table/PageContainer";
import DeptPageNav from "@/components/common/navigation/DeptPageNav";
import { useDeptNavPages } from "@/hooks/useDeptNavPages";
import PositionChartModal from "./PositionChartModal";

const PositionChartPage = () => {
    const { departmentId } = useParams<{ departmentId: string }>();
    const [searchParams] = useSearchParams();
    const departmentName = searchParams.get("departmentName") || "";
    const deptNavPages = useDeptNavPages();
    const navigate = useNavigate();

    return (
        <PageContainer title={`Bản đồ chức danh — ${departmentName}`}>
            <PositionChartModal
                open={true}
                onClose={() => navigate(
                    `/admin/departments/${departmentId}/org-chart?${searchParams.toString()}`,
                    { replace: true }
                )}
                departmentId={Number(departmentId)}
                departmentName={departmentName}
            />
            <DeptPageNav pages={deptNavPages} />
        </PageContainer>
    );
};

export default PositionChartPage;