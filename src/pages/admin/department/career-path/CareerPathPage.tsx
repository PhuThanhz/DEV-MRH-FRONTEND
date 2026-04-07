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

type TabKey = "careerpath" | "template" | "employee";

const CareerPathPage = () => {
    const [searchParams] = useSearchParams();
    const departmentName = searchParams.get("departmentName") || "—";
    const [activeKey, setActiveKey] = useState<TabKey>("careerpath");

    const canViewDepartment = useAccess(ALL_PERMISSIONS.EMPLOYEE_CAREER_PATHS.GET_BY_DEPARTMENT);
    const canViewOwn = useAccess(ALL_PERMISSIONS.EMPLOYEE_CAREER_PATHS.GET_BY_USER);
    const canViewEmployee = canViewDepartment || canViewOwn;

    const deptNavPages = useDeptNavPages();

    const tabStyle = (active: boolean): React.CSSProperties => ({
        display: "inline-flex",
        alignItems: "center",
        gap: 7,
        padding: "7px 18px",
        borderRadius: 8,
        border: `1.5px solid ${active ? "#E8356D" : "transparent"}`,
        cursor: "pointer",
        fontSize: 13,
        fontWeight: active ? 600 : 400,
        color: active ? "#E8356D" : "#636366",
        background: active ? "#ffffff" : "transparent",
        outline: "none",
        transition: "all 0.15s cubic-bezier(.4,0,.2,1)",
        letterSpacing: -0.1,
        whiteSpace: "nowrap",
    });

    return (
        <PageContainer title={`Lộ trình thăng tiến — ${departmentName}`}>

            {/* Tab bar — đứng độc lập */}
            <div style={{ marginBottom: 16 }}>
                <div style={{
                    display: "inline-flex",
                    background: "#f2f2f7",
                    borderRadius: 10,
                    padding: 3,
                    gap: 2,
                }}>
                    <Access permission={ALL_PERMISSIONS.CAREER_PATHS.GET_BY_DEPARTMENT} hideChildren>
                        <button onClick={() => setActiveKey("careerpath")} style={tabStyle(activeKey === "careerpath")}>
                            <ApartmentOutlined />
                            Chức danh
                        </button>
                    </Access>

                    <Access permission={ALL_PERMISSIONS.CAREER_PATH_TEMPLATES.GET_ALL} hideChildren>
                        <button onClick={() => setActiveKey("template")} style={tabStyle(activeKey === "template")}>
                            <FileTextOutlined />
                            Lộ trình thăng tiến tiêu chuẩn
                        </button>
                    </Access>

                    {canViewEmployee && (
                        <button onClick={() => setActiveKey("employee")} style={tabStyle(activeKey === "employee")}>
                            <UserOutlined />
                            Lộ trình thăng tiến cá nhân - IDP
                        </button>
                    )}
                </div>
            </div>

            {/* Content — các tab tự có card riêng */}
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