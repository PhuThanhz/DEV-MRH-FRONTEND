import { useParams } from "react-router-dom";
import PageContainer from "@/components/common/data-table/PageContainer";
import OrgChartFlow from "./OrgChartFlow";

const CompanyOrgChartPage = () => {

    const { companyId } = useParams();

    const id = Number(companyId);

    if (!id) return null;

    return (

        <PageContainer title="Sơ đồ tổ chức công ty">

            <OrgChartFlow
                ownerType="COMPANY"
                ownerId={id}
            />

        </PageContainer>

    );
};

export default CompanyOrgChartPage;