import { useQuery } from "@tanstack/react-query";
import { callFetchDashboardSummary } from "@/config/api";
import type { IDashboardSummary } from "@/types/backend";

export const useDashboardSummaryQuery = () => {
    return useQuery({
        queryKey: ["dashboard-summary"],
        queryFn: async () => {
            const res = await callFetchDashboardSummary();

            if (!res?.data) {
                throw new Error("Không lấy được dashboard");
            }

            return res.data as IDashboardSummary; // ✅ đúng style project
        },
    });
};