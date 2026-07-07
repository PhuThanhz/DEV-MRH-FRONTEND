import React from "react";
import PageContainer from "@/components/common/data-table/PageContainer";
import StorageDashboard from "../accounting-dossiers/components/StorageDashboard";

const AccountingReportsPage: React.FC = () => {
    return (
        <PageContainer title="Báo cáo & Thống kê">
            <StorageDashboard />
        </PageContainer>
    );
};

export default AccountingReportsPage;
