import { useState } from "react";
import { BankOutlined, ApartmentOutlined, LockOutlined } from "@ant-design/icons";
import ProcedureTable from "./components/ProcedureTable";
import PageContainer from "@/components/common/data-table/PageContainer";

type TabType = "COMPANY" | "DEPARTMENT" | "CONFIDENTIAL";

const tabs: { key: TabType; label: string; icon: React.ReactNode }[] = [
    { key: "COMPANY", label: "Quy trình công ty", icon: <BankOutlined /> },
    { key: "DEPARTMENT", label: "Quy trình phòng ban", icon: <ApartmentOutlined /> },
    { key: "CONFIDENTIAL", label: "Quy trình bảo mật", icon: <LockOutlined /> },
];

const ProcedureAdminPage = () => {
    const [activeTab, setActiveTab] = useState<TabType>("COMPANY");

    return (
        <PageContainer title="Quản lý quy trình">
            <div style={{
                display: "inline-flex",
                background: "#e5e5ea",
                borderRadius: 10,
                padding: 2,
                marginBottom: 24,
                gap: 2,
            }}>
                {tabs.map((tab) => {
                    const isActive = activeTab === tab.key;
                    return (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key)}
                            style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 6,
                                padding: "6px 16px",
                                borderRadius: 8,
                                border: "none",
                                cursor: "pointer",
                                fontSize: 13,
                                fontWeight: isActive ? 500 : 400,
                                letterSpacing: "-0.01em",
                                transition: "all 0.15s ease",
                                background: isActive ? "#ffffff" : "transparent",
                                color: isActive ? "#000000" : "#3c3c43",
                                boxShadow: isActive
                                    ? "0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.08)"
                                    : "none",
                            }}
                        >
                            {tab.icon}
                            {tab.label}
                        </button>
                    );
                })}
            </div>

            <div style={{
                background: "#fff",
                borderRadius: 12,
                border: "1px solid #e5e5ea",
                padding: 20,
            }}>
                {activeTab === "COMPANY" && <ProcedureTable type="COMPANY" />}
                {activeTab === "DEPARTMENT" && <ProcedureTable type="DEPARTMENT" />}
                {activeTab === "CONFIDENTIAL" && <ProcedureTable type="CONFIDENTIAL" />}
            </div>
        </PageContainer>
    );
};

export default ProcedureAdminPage;