import { useEffect } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useDepartmentByIdQuery } from "@/hooks/useDepartments";
import PageContainer from "@/components/common/data-table/PageContainer";
import OrgChartFlow from "@/pages/admin/company/org-chart/OrgChartFlow";
import DeptPageNav from "@/components/common/navigation/DeptPageNav";
import { useDeptNavPages } from "@/hooks/useDeptNavPages"; // ← thêm

const DepartmentOrgChartPage = () => {
    const { departmentId } = useParams();
    const { data: department } = useDepartmentByIdQuery(Number(departmentId));
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    const id = Number(departmentId);
    const departmentName = searchParams.get("departmentName") || department?.name || "";

    const deptNavPages = useDeptNavPages(); // ← thêm

    useEffect(() => {
        if (departmentId && searchParams.get("modal") === "position-chart") {
            const nextParams = new URLSearchParams(searchParams);
            nextParams.delete("modal");
            const query = nextParams.toString();
            navigate(
                `/admin/departments/${departmentId}/position-chart${query ? `?${query}` : ""}`,
                { replace: true }
            );
        }
    }, [departmentId, navigate, searchParams]);

    if (!id) return null;

    return (
        <PageContainer 
            title=""
            fullHeight={true}
            contentClassName="px-1 sm:px-3 py-1 flex-1 min-h-0"
        >
            <OrgChartFlow
                ownerType="DEPARTMENT"
                ownerId={id}
                chartTitle={`Sơ đồ tổ chức${departmentName ? ` — ${departmentName}` : ""}`}
                onClose={() => navigate("/admin/departments")}
            />
            <DeptPageNav pages={deptNavPages} /> {/* ← thêm pages prop */}
        </PageContainer>
    );
};

export default DepartmentOrgChartPage;
