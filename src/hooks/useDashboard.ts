import { keepPreviousData, useQuery } from "@tanstack/react-query";
import {
    callFetchDashboardSummary,
    callFetchDepartmentCompleteness,
    callFetchDepartmentCompletenessOverview,
    type DepartmentCompletenessParams,
} from "@/config/api";
import type {
    IDashboardSummary,
    IDepartmentCompleteness,
    IDepartmentCompletenessOverview,
    IModelPaginate,
} from "@/types/backend";

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

export const useDepartmentCompletenessQuery = (params: DepartmentCompletenessParams = {}) => {
    return useQuery({
        queryKey: ["dashboard-department-completeness", params],
        queryFn: async () => {
            const res = await callFetchDepartmentCompleteness(params);

            if (!res?.data) {
                throw new Error("Không lấy được completeness");
            }

            return res.data as IModelPaginate<IDepartmentCompleteness>;
        },
        placeholderData: keepPreviousData,
    });
};

export const useDepartmentCompletenessOverviewQuery = () => {
    return useQuery({
        queryKey: ["dashboard-department-completeness-overview"],
        queryFn: async () => {
            const res = await callFetchDepartmentCompletenessOverview();
            if (!res?.data) {
                throw new Error("Không lấy được tổng quan completeness");
            }
            return res.data as IDepartmentCompletenessOverview;
        },
    });
};
