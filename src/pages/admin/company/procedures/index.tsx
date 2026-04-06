import { useParams, useSearchParams } from "react-router-dom";
import PageContainer from "@/components/common/data-table/PageContainer";
import ProcedureTable from "@/pages/admin/procedures/components/ProcedureTable";

const CompanyProceduresPage = () => {
    const { companyId } = useParams();
    const [searchParams] = useSearchParams();
    const companyName = searchParams.get("companyName");

    return (
        <PageContainer
            title={`Quy trình công ty${companyName ? " - " + companyName : ""}`}
        >
            <ProcedureTable
                type="COMPANY"
                companyId={Number(companyId)}
            />
        </PageContainer>
    );
};

export default CompanyProceduresPage;