import { useParams, useSearchParams } from "react-router-dom";
import PageContainer from "@/components/common/data-table/PageContainer";
import OrgChartFlow from "./OrgChartFlow";
import { useEffect, useState } from "react";
import { callFetchCompanyById } from "@/config/api";

const CompanyOrgChartPage = () => {
    const { companyId } = useParams();
    const [searchParams] = useSearchParams();
    const id = Number(companyId);

    const [companyName, setCompanyName] = useState<string>(
        searchParams.get("companyName") || ""
    );

    // Ensure the page always starts at the very top (React Router sometimes preserves scroll position)
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    useEffect(() => {
        if (!id) return;
        if (companyName) return; // Already initialized from URL

        const fetchCompany = async () => {
            try {
                const res = await callFetchCompanyById(String(id));
                setCompanyName(res.data?.name || "");
            } catch (err) {
                console.error("Fetch company error:", err);
            }
        };

        fetchCompany();
    }, [id, companyName]);

    if (!id) return null;

    return (
        <PageContainer
            title={
                companyName
                    ? `Sơ đồ tổ chức - ${companyName}`
                    : "Sơ đồ tổ chức công ty"
            }
        >
            <OrgChartFlow ownerType="COMPANY" ownerId={id} />
        </PageContainer>
    );
};

export default CompanyOrgChartPage;