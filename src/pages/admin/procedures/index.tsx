import { useState, useMemo, useEffect } from "react";
import { BankOutlined, ApartmentOutlined, LockOutlined } from "@ant-design/icons";
import ProcedureTable from "./components/ProcedureTable";
import PageContainer from "@/components/common/data-table/PageContainer";
import { ALL_PERMISSIONS } from "@/config/permissions";
import useAccess from "@/hooks/useAccess";

type TabType = "COMPANY" | "DEPARTMENT" | "CONFIDENTIAL";

const ProcedureAdminPage = () => {
    // ===================== PERMISSION =====================
    const canViewCompany = useAccess(ALL_PERMISSIONS.PROCEDURE_COMPANY.GET_PAGINATE);
    const canViewDepartment = useAccess(ALL_PERMISSIONS.PROCEDURE_DEPARTMENT.GET_PAGINATE);

    const canViewConfidential = useAccess(ALL_PERMISSIONS.PROCEDURE_CONFIDENTIAL.GET_PAGINATE);

    // ===================== BUILD TABS =====================
    const tabs = useMemo(() => {
        return [
            canViewCompany && {
                key: "COMPANY" as TabType,
                label: "Quy trình công ty",
                icon: <BankOutlined />,
            },
            canViewDepartment && {
                key: "DEPARTMENT" as TabType,
                label: "Quy trình phòng ban",
                icon: <ApartmentOutlined />,
            },
            canViewConfidential && {
                key: "CONFIDENTIAL" as TabType,
                label: "Quy trình bảo mật",
                icon: <LockOutlined />,
            },
        ].filter(Boolean) as { key: TabType; label: string; icon: React.ReactNode }[];
    }, [canViewCompany, canViewDepartment, canViewConfidential]);

    // ===================== ACTIVE TAB =====================
    const [activeTab, setActiveTab] = useState<TabType>("COMPANY");

    // 🔥 FIX: auto chọn tab hợp lệ
    useEffect(() => {
        if (!tabs.length) return;

        if (!tabs.find(t => t.key === activeTab)) {
            setActiveTab(tabs[0].key);
        }
    }, [tabs, activeTab]);

    // 🔥 Nếu không có quyền gì
    if (!tabs.length) {
        return (
            <PageContainer title="Quản lý quy trình">
                <div style={{ padding: 24 }}>
                    Bạn không có quyền truy cập
                </div>
            </PageContainer>
        );
    }

    return (
        <PageContainer title="Quản lý quy trình">
            {/* TAB */}
            <div
                style={{
                    display: "inline-flex",
                    background: "#e5e5ea",
                    borderRadius: 10,
                    padding: 2,
                    marginBottom: 24,
                    gap: 2,
                }}
            >
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
                                    ? "0 1px 3px rgba(0,0,0,0.12)"
                                    : "none",
                            }}
                        >
                            {tab.icon}
                            {tab.label}
                        </button>
                    );
                })}
            </div>

            {/* CONTENT */}
            <div
                style={{
                    background: "#fff",
                    borderRadius: 12,
                    border: "1px solid #e5e5ea",
                    padding: 20,
                }}
            >
                {activeTab === "COMPANY" && canViewCompany && (
                    <ProcedureTable type="COMPANY" />
                )}

                {activeTab === "DEPARTMENT" && canViewDepartment && (
                    <ProcedureTable type="DEPARTMENT" />
                )}

                {activeTab === "CONFIDENTIAL" && canViewConfidential && (
                    <ProcedureTable type="CONFIDENTIAL" />
                )}
            </div>
        </PageContainer>
    );
};

export default ProcedureAdminPage;