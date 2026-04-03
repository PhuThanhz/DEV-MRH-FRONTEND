import { useState } from "react";
import { useSearchParams } from "react-router-dom";

import PageContainer from "@/components/common/data-table/PageContainer";
import Access from "@/components/share/access";
import { ALL_PERMISSIONS } from "@/config/permissions";
import useAccess from "@/hooks/useAccess";
import CareerPathTab from "./CareerPathTab";
import CareerPathTemplateTab from "./CareerPathTemplateTab";
import EmployeeCareerPathTab from "./EmployeeCareerPathTab";

type TabKey = "careerpath" | "template" | "employee";

const T = {
    ink: "#0a0a0b", ink3: "#636366", ink4: "#aeaeb2",
    white: "#ffffff", s2: "#f5f5f7",
    line: "rgba(0,0,0,0.06)",
};

const CareerPathPage = () => {
    const [searchParams] = useSearchParams();
    const departmentName = searchParams.get("departmentName") || "—";
    const [activeKey, setActiveKey] = useState<TabKey>("careerpath");

    const canViewDepartment = useAccess(ALL_PERMISSIONS.EMPLOYEE_CAREER_PATHS.GET_BY_DEPARTMENT);
    const canViewOwn = useAccess(ALL_PERMISSIONS.EMPLOYEE_CAREER_PATHS.GET_BY_USER);
    const canViewEmployee = canViewDepartment || canViewOwn;

    const tabStyle = (active: boolean): React.CSSProperties => ({
        padding: "7px 20px", borderRadius: 7,
        border: "none", cursor: "pointer", fontSize: 13,
        fontWeight: active ? 600 : 400,
        color: active ? T.ink : T.ink3,
        background: active ? T.white : "transparent",
        boxShadow: active
            ? "0 1px 4px rgba(0,0,0,0.08), 0 0 0 0.5px rgba(0,0,0,0.05)"
            : "none",
        transition: "all 0.15s cubic-bezier(.4,0,.2,1)",
        outline: "none", letterSpacing: -0.1,
    });

    return (
        <PageContainer title={`Lộ trình thăng tiến — ${departmentName}`}>
            {/* ── Tab bar ── */}
            <div style={{
                display: "inline-flex",
                background: T.s2, borderRadius: 10,
                padding: 4, gap: 2,
                border: `1px solid ${T.line}`,
                marginBottom: 20,
            }}>
                {/* Tab: Chức danh */}
                <Access permission={ALL_PERMISSIONS.CAREER_PATHS.GET_BY_DEPARTMENT} hideChildren>
                    <button onClick={() => setActiveKey("careerpath")} style={tabStyle(activeKey === "careerpath")}>
                        Chức danh
                    </button>
                </Access>

                {/* Tab: Lộ trình tiêu chuẩn */}
                <Access permission={ALL_PERMISSIONS.CAREER_PATH_TEMPLATES.GET_ALL} hideChildren>
                    <button onClick={() => setActiveKey("template")} style={tabStyle(activeKey === "template")}>
                        Lộ trình thăng tiến tiêu chuẩn
                    </button>
                </Access>

                {/* Tab: IDP — hiện nếu có 1 trong 2 permission */}
                {canViewEmployee && (
                    <button onClick={() => setActiveKey("employee")} style={tabStyle(activeKey === "employee")}>
                        Lộ trình thăng tiến cá nhân - IDP
                    </button>
                )}
            </div>

            {/* ── Content ── */}
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
        </PageContainer>
    );
};

export default CareerPathPage;