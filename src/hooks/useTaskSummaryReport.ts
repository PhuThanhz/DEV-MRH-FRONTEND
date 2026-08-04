import { useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { notification } from "antd";
import { callFetchTaskSummaryReport, callExportTaskSummaryReport, type ITaskSummaryReportFilters } from "@/config/api";

export const TASK_SUMMARY_REPORT_KEY = "task-summary-report";

export const useTaskSummaryReportQuery = (filters: ITaskSummaryReportFilters) => {
    const query = useQuery({
        queryKey: [TASK_SUMMARY_REPORT_KEY, filters],
        queryFn: async () => {
            const res = await callFetchTaskSummaryReport(filters);
            if (res && res.data) {
                return res.data;
            }
            return null;
        },
    });

    useEffect(() => {
        if (query.isError) {
            notification.error({
                message: "Không thể tải báo cáo tổng kết công việc",
                description: (query.error as any)?.message || "Có lỗi xảy ra khi tải báo cáo",
            });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [query.isError, query.error]);

    return query;
};

export const useExportTaskSummaryReportMutation = () => {
    return useMutation({
        mutationFn: async (filters: ITaskSummaryReportFilters) => {
            const res = await callExportTaskSummaryReport(filters);
            return res;
        },
        onError: (error: any) => {
            notification.error({
                message: "Xuất báo cáo Excel thất bại",
                description: error?.message || "Có lỗi xảy ra khi tải tập tin Excel",
            });
        },
    });
};
