import React from "react";
import PageContainer from "@/components/common/data-table/PageContainer";
import StorageDashboard from "../accounting-dossiers/components/StorageDashboard";

const AccountingReportsPage: React.FC = () => {
    return (
        <PageContainer title="Tổng quan chứng từ kế toán" contentClassName="px-4 sm:px-8 py-5">
            <StorageDashboard />
        </PageContainer>
    );
};

export default AccountingReportsPage;
