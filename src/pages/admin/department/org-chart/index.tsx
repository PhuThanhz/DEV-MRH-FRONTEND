import { useParams, useSearchParams } from "react-router-dom";
import PageContainer from "@/components/common/data-table/PageContainer";
// Import thẳng từ company để dùng chung
import OrgChartFlow from "@/pages/admin/company/org-chart/OrgChartFlow";

const DepartmentOrgChartPage = () => {
    const { departmentId } = useParams();
    const [searchParams] = useSearchParams();

    const id = Number(departmentId);
    const departmentName = searchParams.get("departmentName") ?? "Sơ đồ tổ chức";

    if (!id) return null;

    return (
        <PageContainer title={`Sơ đồ tổ chức — ${departmentName}`}>
            <OrgChartFlow
                ownerType="DEPARTMENT"
                ownerId={id}
            />
        </PageContainer>
    );
};

export default DepartmentOrgChartPage;