import { useParams, useSearchParams } from "react-router-dom";
import PageContainer from "@/components/common/data-table/PageContainer";
import DeptPageNav from "@/components/common/navigation/DeptPageNav";
import { useDeptNavPages } from "@/hooks/useDeptNavPages";
import PositionChartModal from "./PositionChartModal";

const PositionChartPage = () => {
    const { departmentId } = useParams<{ departmentId: string }>();
    const [searchParams] = useSearchParams();
    const departmentName = searchParams.get("departmentName") || "";
    const deptNavPages = useDeptNavPages();

    return (
        <PageContainer title={`Bản đồ chức danh — ${departmentName}`}>
            {/* Render nội dung modal thẳng vào trang, không cần open/onClose */}
            <PositionChartModal
                open={true}
                onClose={() => { }}
                departmentId={Number(departmentId)}
                departmentName={departmentName}
            />
            <DeptPageNav pages={deptNavPages} />
        </PageContainer>
    );
};

export default PositionChartPage;