import { useParams } from "react-router-dom";
import PageContainer from "@/components/common/data-table/PageContainer";
import OrgChartFlow from "./OrgChartFlow";
import { useEffect, useState } from "react";
import { callFetchCompanyById } from "@/config/api";

const CompanyOrgChartPage = () => {
    const { companyId } = useParams();
    const id = Number(companyId);

    const [companyName, setCompanyName] = useState<string>("");

    useEffect(() => {
        if (!id) return;

        const fetchCompany = async () => {
            try {
                const res = await callFetchCompanyById(String(id));
                setCompanyName(res.data?.name || "");
            } catch (err) {
                console.error("Fetch company error:", err);
            }
        };

        fetchCompany();
    }, [id]);

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