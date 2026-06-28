import { useParams, useSearchParams } from "react-router-dom";
import { useDepartmentByIdQuery } from "@/hooks/useDepartments";
import PageContainer from "@/components/common/data-table/PageContainer";
import DeptPageNav from "@/components/common/navigation/DeptPageNav";
import { useDeptNavPages } from "@/hooks/useDeptNavPages";
import PermissionViewModal from "./components/PermissionViewModal";

const DepartmentPermissionPage = () => {
    const { departmentId } = useParams<{ departmentId: string }>();
    const { data: department } = useDepartmentByIdQuery(Number(departmentId));
    const [searchParams] = useSearchParams();
    const departmentName = searchParams.get("departmentName") || department?.name || "";
    const deptNavPages = useDeptNavPages();

    return (
        <PageContainer title={`Phân quyền${departmentName ? ` — ${departmentName}` : ""}`}>
            <PermissionViewModal
                departmentId={Number(departmentId)}
                departmentName={departmentName}
            />
            <DeptPageNav pages={deptNavPages} />
        </PageContainer>
    );
};

export default DepartmentPermissionPage;