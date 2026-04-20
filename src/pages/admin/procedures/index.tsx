import { useState, useMemo, useEffect } from "react";
import { BankOutlined, ApartmentOutlined, LockOutlined } from "@ant-design/icons";
import ProcedureTable from "./components/ProcedureTable";
import ConfidentialProcedureView from "./components/ConfidentialProcedureView";  // ← thêm
import PageContainer from "@/components/common/data-table/PageContainer";
import { ALL_PERMISSIONS } from "@/config/permissions";
import useAccess from "@/hooks/useAccess";
import TabBar from "@/components/common/tabs/TabBar";
import type { TabItem } from "@/components/common/tabs/TabBar";

type TabType = "COMPANY" | "DEPARTMENT" | "CONFIDENTIAL";

const ProcedureAdminPage = () => {
    // ===================== PERMISSION =====================
    const canViewCompany = useAccess(ALL_PERMISSIONS.PROCEDURE_COMPANY.GET_PAGINATE);
    const canViewDepartment = useAccess(ALL_PERMISSIONS.PROCEDURE_DEPARTMENT.GET_PAGINATE);
    const canViewConfidential = useAccess(ALL_PERMISSIONS.PROCEDURE_CONFIDENTIAL.GET_PAGINATE);

    // ===================== BUILD TABS =====================
    const tabs = useMemo<TabItem<TabType>[]>(() => {
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
        ].filter(Boolean) as TabItem<TabType>[];
    }, [canViewCompany, canViewDepartment, canViewConfidential]);

    // ===================== ACTIVE TAB =====================
    const [activeTab, setActiveTab] = useState<TabType>("COMPANY");

    useEffect(() => {
        if (!tabs.length) return;
        if (!tabs.find(t => t.key === activeTab)) {
            setActiveTab(tabs[0].key);
        }
    }, [tabs, activeTab]);

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
            <div style={{ marginBottom: 24 }}>
                <TabBar tabs={tabs} activeKey={activeTab} onChange={setActiveTab} />
            </div>

            {/* CONTENT */}
            {activeTab === "COMPANY" && canViewCompany && (
                <ProcedureTable type="COMPANY" />
            )}
            {activeTab === "DEPARTMENT" && canViewDepartment && (
                <ProcedureTable type="DEPARTMENT" />
            )}
            {/* ← đổi từ ProcedureTable type="CONFIDENTIAL" thành ConfidentialProcedureView */}
            {activeTab === "CONFIDENTIAL" && canViewConfidential && (
                <ConfidentialProcedureView />
            )}
        </PageContainer>
    );
};

export default ProcedureAdminPage;