import { useParams, useSearchParams } from "react-router-dom";
import PageContainer from "@/components/common/data-table/PageContainer";
import ProcedureTable from "@/pages/admin/procedures/components/ProcedureTable";
import DeptPageNav from "@/components/common/navigation/DeptPageNav";
import { useDeptNavPages } from "@/hooks/useDeptNavPages"; // ← thêm

const DepartmentProceduresPage = () => {
    const { departmentId } = useParams();
    const [searchParams] = useSearchParams();
    const departmentName = searchParams.get("departmentName");

    const deptNavPages = useDeptNavPages(); // ← thêm

    return (
        <PageContainer
            title={`Quy trình phòng ban${departmentName ? " — " + departmentName : ""}`}
        >
            <ProcedureTable
                type="DEPARTMENT"
                departmentId={Number(departmentId)}
            />
            <DeptPageNav pages={deptNavPages} /> {/* ← sửa */}
        </PageContainer>
    );
};

export default DepartmentProceduresPage;