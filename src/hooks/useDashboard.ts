import { useQuery } from "@tanstack/react-query";
import { callFetchDashboardSummary, callFetchDepartmentCompleteness } from "@/config/api";
import type { IDashboardSummary, IDepartmentCompleteness } from "@/types/backend";

export const useDashboardSummaryQuery = () => {
    return useQuery({
        queryKey: ["dashboard-summary"],
        queryFn: async () => {
            const res = await callFetchDashboardSummary();

            if (!res?.data) {
                throw new Error("Không lấy được dashboard");
            }

            return res.data as IDashboardSummary;
        },
    });
};

export const useDepartmentCompletenessQuery = () => {
    return useQuery({
        queryKey: ["dashboard-department-completeness"],
        queryFn: async () => {
            const res = await callFetchDepartmentCompleteness();

            if (!res?.data) {
                throw new Error("Không lấy được completeness");
            }

            return res.data as IDepartmentCompleteness[];
        },
    });
};