import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    callFetchJobTitle,
    callCreateJobTitle,
    callUpdateJobTitle,
    callDeleteJobTitle,
} from "@/config/api";

import type { IBackendRes, IModelPaginate, IJobTitle } from "@/types/backend";
import { notify } from "@/components/common/notification/notify";

/* ===================== GET PAGINATE ===================== */
export const useJobTitlesQuery = (query: string) => {
    return useQuery({
        queryKey: ["job-titles", query],
        queryFn: async () => {
            const res = await callFetchJobTitle(query);
            const backend = res as IBackendRes<IModelPaginate<IJobTitle>>;
            return backend.data ?? {
                meta: { page: 1, pageSize: 10, pages: 0, total: 0 },
                result: [],
            };
        },
    });
};

/* ===================== CREATE ===================== */
export const useCreateJobTitleMutation = () => {
    const client = useQueryClient();

    return useMutation({
        mutationFn: async (data: any) => {
            const res = await callCreateJobTitle(data);
            return (res as IBackendRes<IJobTitle>).data;
        },
        onSuccess: () => {
            notify.created("Tạo chức danh thành công");
            client.invalidateQueries({ queryKey: ["job-titles"] });
        },
    });
};

/* ===================== UPDATE ===================== */
export const useUpdateJobTitleMutation = () => {
    const client = useQueryClient();

    return useMutation({
        mutationFn: async (data: any) => {
            const res = await callUpdateJobTitle(data);
            return (res as IBackendRes<IJobTitle>).data;
        },
        onSuccess: () => {
            notify.updated("Cập nhật chức danh thành công");
            client.invalidateQueries({ queryKey: ["job-titles"] });
        },
    });
};

/* ===================== DELETE (soft delete = active:false) ===================== */
export const useDeleteJobTitleMutation = () => {
    const client = useQueryClient();

    return useMutation({
        mutationFn: async (id: number) => {
            await callDeleteJobTitle(id);
        },
        onSuccess: () => {
            notify.deleted("Ngừng kích hoạt chức danh");
            client.invalidateQueries({ queryKey: ["job-titles"] });
        },
    });
};
