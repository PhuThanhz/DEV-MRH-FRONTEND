import { callFetchCompany } from "@/config/api";
import type { ICompany } from "@/types/backend";

export const PERIOD_COMPANY_OPTIONS_QUERY_KEY = ["evaluation-period-company-options"] as const;

export interface PeriodCompanyOption {
    label: string;
    value: number;
}

export const fetchPeriodCompanyOptions = async (): Promise<PeriodCompanyOption[]> => {
    const response = await callFetchCompany("page=1&size=200&sort=name,asc");

    return (response?.data?.result ?? [])
        .filter((company: ICompany): company is ICompany & { id: number } => typeof company.id === "number")
        .map((company) => ({
            label: company.name,
            value: company.id,
        }));
};
