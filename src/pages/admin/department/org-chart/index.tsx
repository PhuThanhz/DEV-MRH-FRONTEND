import { useParams, useSearchParams } from "react-router-dom";
import { useDepartmentByIdQuery } from "@/hooks/useDepartments";
import PageContainer from "@/components/common/data-table/PageContainer";
import OrgChartFlow from "@/pages/admin/company/org-chart/OrgChartFlow";
import DeptPageNav from "@/components/common/navigation/DeptPageNav";
import { useDeptNavPages } from "@/hooks/useDeptNavPages"; // ← thêm

const DepartmentOrgChartPage = () => {
    const { departmentId } = useParams();
    const { data: department } = useDepartmentByIdQuery(Number(departmentId));
    const [searchParams] = useSearchParams();

    const id = Number(departmentId);
    const departmentName = searchParams.get("departmentName") || department?.name || "";

    const deptNavPages = useDeptNavPages(); // ← thêm

    if (!id) return null;

    return (
        <PageContainer title={`Sơ đồ tổ chức${departmentName ? ` — ${departmentName}` : ""}`}>
            <OrgChartFlow
                ownerType="DEPARTMENT"
                ownerId={id}
            />
            <DeptPageNav pages={deptNavPages} /> {/* ← thêm pages prop */}
        </PageContainer>
    );
};

export default DepartmentOrgChartPage;