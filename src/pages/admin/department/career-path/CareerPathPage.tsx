import { useState } from "react";
import { useSearchParams } from "react-router-dom";
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
type TabKey = "careerpath" | "template" | "employee";

const CareerPathPage = () => {
    const [searchParams] = useSearchParams();
    const departmentName = searchParams.get("departmentName") || "—";
    const [activeKey, setActiveKey] = useState<TabKey>("careerpath");

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

    return (
        <PageContainer title={`Lộ trình thăng tiến — ${departmentName}`}>

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

            <DeptPageNav pages={deptNavPages} />
        </PageContainer>
    );
};

export default CareerPathPage;