import { useState } from "react";
import { useDepartmentByIdQuery } from "@/hooks/useDepartments";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { ApartmentOutlined, FileTextOutlined, UserOutlined } from "@ant-design/icons";

import PageContainer from "@/components/common/data-table/PageContainer";
import Access from "@/components/share/access";
import { ALL_PERMISSIONS } from "@/config/permissions";
import useAccess from "@/hooks/useAccess";
import CareerPathTab from "../career-path/careerpathtab/CareerPathTab";
import CareerPathTemplateTab from "./CareerPathTemplateTab";
import EmployeeCareerPathTab from "./EmployeeCareerPathTab";
import DeptPageNav from "@/components/common/navigation/DeptPageNav";
import { useDeptNavPages } from "@/hooks/useDeptNavPages";
import TabBar, { type TabItem } from "@/components/common/tabs/TabBar";
import LotusDetailDrawer from "@/components/common/drawer/LotusDetailDrawer";
type TabKey = "careerpath" | "template" | "employee";

const CareerPathPage = () => {
    const { departmentId } = useParams();
    const { data: department } = useDepartmentByIdQuery(Number(departmentId));
    const [searchParams] = useSearchParams();
    const departmentName = searchParams.get("departmentName") || department?.name || "";
    const [activeKey, setActiveKey] = useState<TabKey>("careerpath");
    const navigate = useNavigate();
    const [open, setOpen] = useState(true);

    const canViewDepartment = useAccess(ALL_PERMISSIONS.EMPLOYEE_CAREER_PATHS.GET_BY_DEPARTMENT);
    const canViewOwn = useAccess(ALL_PERMISSIONS.EMPLOYEE_CAREER_PATHS.GET_BY_USER);
    const canViewEmployee = canViewDepartment || canViewOwn;

    const deptNavPages = useDeptNavPages();

    const tabs: TabItem<TabKey>[] = [
        {
            key: "careerpath",
            label: "Chức danh",
            icon: <ApartmentOutlined />,
            permission: ALL_PERMISSIONS.CAREER_PATHS.GET_BY_DEPARTMENT,
        },
        {
            key: "template",
            label: "Lộ trình thăng tiến tiêu chuẩn",
            icon: <FileTextOutlined />,
            permission: ALL_PERMISSIONS.CAREER_PATH_TEMPLATES.GET_ALL,
        },
        {
            key: "employee",
            label: "Lộ trình thăng tiến cá nhân - IDP",
            icon: <UserOutlined />,
            hidden: !canViewEmployee,
        },
    ];

    const handleClose = () => {
        setOpen(false);
        setTimeout(() => navigate(-1), 300);
    };

    return (
        <PageContainer title="">
            <LotusDetailDrawer
                open={open}
                onClose={handleClose}
                height="calc(100vh - 16px)"
            >
                <div style={{ padding: "24px 32px", height: "100%", overflow: "auto", background: "#f8f9fb" }}>
                    <div style={{ fontSize: 24, fontWeight: 700, color: "#1e293b", marginBottom: 24 }}>
                        {`Lộ trình thăng tiến${departmentName && departmentName !== "—" ? ` — ${departmentName}` : ""}`}
                    </div>
                    <div style={{ marginBottom: 16 }}>
                        <TabBar tabs={tabs} activeKey={activeKey} onChange={setActiveKey} />
                    </div>

                    {activeKey === "careerpath" && (
                        <Access permission={ALL_PERMISSIONS.CAREER_PATHS.GET_BY_DEPARTMENT}>
                            <CareerPathTab />
                        </Access>
                    )}
                    {activeKey === "template" && (
                        <Access permission={ALL_PERMISSIONS.CAREER_PATH_TEMPLATES.GET_ALL}>
                            <CareerPathTemplateTab />
                        </Access>
                    )}
                    {activeKey === "employee" && canViewEmployee && (
                        <EmployeeCareerPathTab viewMode={canViewDepartment ? "department" : "own"} />
                    )}
                </div>
            </LotusDetailDrawer>

            <DeptPageNav pages={deptNavPages} />
        </PageContainer>
    );
};

export default CareerPathPage;
