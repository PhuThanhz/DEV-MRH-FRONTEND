import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useDepartmentByIdQuery } from "@/hooks/useDepartments";
import PageContainer from "@/components/common/data-table/PageContainer";
import DeptPageNav from "@/components/common/navigation/DeptPageNav";
import { useDeptNavPages } from "@/hooks/useDeptNavPages";
import LotusDetailDrawer from "@/components/common/drawer/LotusDetailDrawer";
import { PATHS } from "@/constants/paths";
import PermissionViewModal from "./components/PermissionViewModal";

const DepartmentPermissionPage = () => {
    const navigate = useNavigate();
    const { departmentId } = useParams<{ departmentId: string }>();
    const { data: department } = useDepartmentByIdQuery(Number(departmentId));
    const [searchParams] = useSearchParams();
    const departmentName = searchParams.get("departmentName") || department?.name || "";
    const deptNavPages = useDeptNavPages();

    return (
        <PageContainer title={`Phân quyền${departmentName ? ` — ${departmentName}` : ""}`}>
            <div className="min-h-[80vh] bg-[#f8f9fb]" />

            <LotusDetailDrawer
                open
                onClose={() => navigate(PATHS.ADMIN.DEPARTMENT)}
                keyboard={false}
                destroyOnClose={false}
            >
                <div className="flex h-full flex-col bg-[#f8f9fb]">
                    <div className="border-b border-gray-100 bg-white px-6 py-5 sm:px-8">
                        <div className="flex items-center gap-3">
                            <span className="h-8 w-1 rounded-full bg-[#e84373]" />
                            <h2 className="m-0 text-[24px] font-bold leading-8 text-slate-950 sm:text-[28px]">
                                Phân quyền{departmentName ? ` — ${departmentName}` : ""}
                            </h2>
                        </div>
                    </div>
                    <div className="min-h-0 flex-1 overflow-auto px-6 py-6 sm:px-8">
                        <PermissionViewModal
                            departmentId={Number(departmentId)}
                            departmentName={departmentName}
                        />
                    </div>
                </div>
            </LotusDetailDrawer>

            <DeptPageNav pages={deptNavPages} />
        </PageContainer>
    );
};

export default DepartmentPermissionPage;
