import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import PageContainer from "@/components/common/data-table/PageContainer";
import OrgChartFlow from "./OrgChartFlow";
import { useEffect } from "react";
import { useCompanyByIdQuery } from "@/hooks/useCompanies";

const CompanyOrgChartPage = () => {
    const { companyId } = useParams();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const id = Number(companyId);

    const companyNameParam = searchParams.get("companyName") || "";
    const { data: companyData } = useCompanyByIdQuery(id && !companyNameParam ? String(id) : undefined);
    const companyName = companyNameParam || companyData?.name || "";

    // Ensure the page always starts at the very top (React Router sometimes preserves scroll position)
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    if (!id) return null;

    return (
        <PageContainer
            title=""
            fullHeight={true}
            contentClassName="px-1 sm:px-3 py-1 flex-1 min-h-0"
        >
            <OrgChartFlow 
                ownerType="COMPANY" 
                ownerId={id} 
                chartTitle={companyName ? `Sơ đồ tổ chức - ${companyName}` : "Sơ đồ tổ chức công ty"}
                onClose={() => navigate("/admin/company")}
            />
        </PageContainer>
    );
};

export default CompanyOrgChartPage;
