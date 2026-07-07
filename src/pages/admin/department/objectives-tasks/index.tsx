import { useMemo } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import PageContainer from "@/components/common/data-table/PageContainer";
import DeptPageNav from "@/components/common/navigation/DeptPageNav";
import { useDeptNavPages } from "@/hooks/useDeptNavPages";
import { PATHS } from "@/constants/paths";
import LotusDetailDrawer from "@/components/common/drawer/LotusDetailDrawer";
import DepartmentMissionDetail from "./components/DepartmentMissionDetail";

const DepartmentObjectivesPage = () => {
    const navigate = useNavigate();
    const { departmentId } = useParams();
    const [searchParams] = useSearchParams();
    const idNumber = departmentId ? Number(departmentId) : undefined;
    const deptNavPages = useDeptNavPages();

    const departmentName = useMemo(() => {
        return searchParams.get("departmentName") || "";
    }, [searchParams]);

    return (
        <PageContainer title="Mục tiêu - Nhiệm vụ phòng ban">
            <div className="min-h-[80vh] bg-[#f8f9fb]" />

            <LotusDetailDrawer
                open
                onClose={() => navigate(PATHS.ADMIN.DEPARTMENT)}
                keyboard={false}
                destroyOnClose={false}
            >
                <DepartmentMissionDetail
                    departmentId={idNumber}
                    departmentName={departmentName}
                    showEditAction={false}
                />
            </LotusDetailDrawer>

            {/* FLOATING NAV */}
            <DeptPageNav pages={deptNavPages} />
        </PageContainer>
    );
};

export default DepartmentObjectivesPage;
