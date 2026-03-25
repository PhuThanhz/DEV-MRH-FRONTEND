import { useState } from "react";
import { useSearchParams } from "react-router-dom";

import PageContainer from "@/components/common/data-table/PageContainer";
import CareerPathTab from "./CareerPathTab";
import CareerPathTemplateTab from "./CareerPathTemplateTab";
import EmployeeCareerPathTab from "./EmployeeCareerPathTab";

type TabKey = "careerpath" | "template" | "employee";

const TABS: { key: TabKey; label: string }[] = [
    { key: "careerpath", label: "Chức danh" },
    { key: "template", label: "Lộ trình thăng tiến tiêu chuẩn" },
    { key: "employee", label: "Lộ trình thăng tiến cá nhân - IDP" },
];

const T = {
    ink: "#0a0a0b", ink3: "#636366", ink4: "#aeaeb2",
    white: "#ffffff", s2: "#f5f5f7",
    line: "rgba(0,0,0,0.06)",
};

const CareerPathPage = () => {
    const [searchParams] = useSearchParams();
    const departmentName = searchParams.get("departmentName") || "—";
    const [activeKey, setActiveKey] = useState<TabKey>("careerpath");

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
                {TABS.map((tab) => {
                    const active = activeKey === tab.key;
                    return (
                        <button
                            key={tab.key}
                            onClick={() => setActiveKey(tab.key)}
                            style={{
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
                            }}
                        >
                            {tab.label}
                        </button>
                    );
                })}
            </div>

            {/* ── Content ── */}
            {activeKey === "careerpath" && <CareerPathTab />}
            {activeKey === "template" && <CareerPathTemplateTab />}
            {activeKey === "employee" && <EmployeeCareerPathTab />}
        </PageContainer>
    );
};

export default CareerPathPage;




// vị trí hiện tại - ngày bổ nhiệm - thời gian dự kiến - thời gian đảm nhiệm vị trí hiện tại 
// lịch sử thăng tiến -> quá trình công tác