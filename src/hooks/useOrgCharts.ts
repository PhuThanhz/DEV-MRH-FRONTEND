import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    callFetchOrgCharts,
    callCreateOrgChart,
    callUpdateOrgChart,
    callDeleteOrgChart,
} from "@/config/api";
import { notify } from "@/components/common/notification/notify";
import type { IOrgChart } from "@/types/backend";
/* ===================== ORG CHART ===================== */

export const useOrgChartsQuery = (query: string) => {
    return useQuery({
        queryKey: ["orgCharts", query],
        queryFn: async () => {
            const res = await callFetchOrgCharts(query);
            return res.data;
        },
    });
};

export const useCreateOrgChartMutation = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: IOrgChart) => {
            const res = await callCreateOrgChart(data);
            if (!res?.data) throw new Error("Không thể tạo sơ đồ");
            return res;
        },
        onSuccess: () => {
            notify.created("Tạo sơ đồ tổ chức thành công");
            queryClient.invalidateQueries({ queryKey: ["orgCharts"] });
        },
    });
};

export const useUpdateOrgChartMutation = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: IOrgChart) => {
            const res = await callUpdateOrgChart(data);
            if (!res?.data) throw new Error("Không thể cập nhật sơ đồ");
            return res;
        },
        onSuccess: () => {
            notify.updated("Cập nhật sơ đồ tổ chức thành công");
            queryClient.invalidateQueries({ queryKey: ["orgCharts"] });
        },
    });
};

export const useDeleteOrgChartMutation = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: number) => {
            const res = await callDeleteOrgChart(id);
            return res;
        },
        onSuccess: () => {
            notify.deleted("Xóa sơ đồ tổ chức thành công");
            queryClient.invalidateQueries({ queryKey: ["orgCharts"] });
        },
    });
};