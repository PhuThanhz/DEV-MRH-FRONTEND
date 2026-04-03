import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    callFetchJobDescriptions,
    callFetchJobDescriptionById,
    callCreateJobDescription,
    callUpdateJobDescription,
    callDeleteJobDescription,
    callFetchMyJobDescriptions,
    callFetchPublishedJobDescriptions,  // ← thêm
    callFetchRejectedJobDescriptions,   // ← thêm
    callFetchAllJobDescriptions,
} from "@/config/api";

import type { IJobDescription, IModelPaginate } from "@/types/backend";
import { notify } from "@/components/common/notification/notify";


/* ===================== FETCH LIST ===================== */

export const useJobDescriptionsQuery = (query: string) => {
    return useQuery({
        queryKey: ["job-descriptions", query],
        queryFn: async () => {
            const res = await callFetchJobDescriptions(query);
            if (!res || res.statusCode !== 200)
                throw new Error(res?.message || "Không thể lấy danh sách Job Description");
            return res.data as IModelPaginate<IJobDescription>;
        }
    });
};


/* ===================== FETCH BY ID ===================== */

export const useJobDescriptionByIdQuery = (id?: number) => {
    return useQuery({
        queryKey: ["job-description", id],
        enabled: !!id,
        queryFn: async () => {
            if (!id) throw new Error("Thiếu ID Job Description");
            const res = await callFetchJobDescriptionById(id);
            if (!res?.data)
                throw new Error("Không tìm thấy Job Description");
            return res.data as IJobDescription;
        },
    });
};


/* ===================== CREATE ===================== */

export const useCreateJobDescriptionMutation = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: IJobDescription) => {
            const res = await callCreateJobDescription(data);
            if (!res?.data)
                throw new Error(res?.message || "Không thể tạo Job Description");
            return res;
        },
        onSuccess: (res) => {
            notify.created(res?.message || "Tạo Job Description thành công");
            queryClient.invalidateQueries({ queryKey: ["job-descriptions"] });
            queryClient.invalidateQueries({ queryKey: ["my-job-descriptions"] }); // ✅ thêm
        },
        onError: (error: any) => {
            notify.error(error.message || "Lỗi khi tạo Job Description");
        },
    });
};


/* ===================== UPDATE ===================== */

export const useUpdateJobDescriptionMutation = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, data }: { id: number; data: IJobDescription }) => {
            const res = await callUpdateJobDescription(id, data);
            if (!res?.data)
                throw new Error(res?.message || "Không thể cập nhật Job Description");
            return res;
        },
        onSuccess: (res, variables) => {
            notify.updated(res?.message || "Cập nhật Job Description thành công");
            queryClient.invalidateQueries({ queryKey: ["job-descriptions"] });
            queryClient.invalidateQueries({ queryKey: ["my-job-descriptions"] }); // ✅ thêm
            if (variables?.id) {
                queryClient.invalidateQueries({ queryKey: ["job-description", variables.id] });
            }
        },
        onError: (error: any) => {
            notify.error(error.message || "Lỗi khi cập nhật Job Description");
        },
    });
};


/* ===================== DELETE ===================== */

export const useDeleteJobDescriptionMutation = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: number) => {
            const res = await callDeleteJobDescription(id);
            if (!res?.statusCode || res.statusCode !== 200)
                throw new Error(res?.message || "Không thể xóa Job Description");
            return res.data;
        },
        onSuccess: () => {
            notify.deleted("Xóa Job Description thành công");
            queryClient.invalidateQueries({ queryKey: ["job-descriptions"], exact: false });
            queryClient.invalidateQueries({ queryKey: ["my-job-descriptions"] }); // ✅ thêm
        },
        onError: (error: any) => {
            notify.error(error.message || "Lỗi khi xóa Job Description");
        },
    });
};


/* ===================== FETCH MY JD ===================== */

export const useMyJobDescriptionsQuery = (query: string) => {
    return useQuery({
        queryKey: ["my-job-descriptions", query],
        queryFn: async () => {
            const res = await callFetchMyJobDescriptions(query);
            if (!res || res.statusCode !== 200)
                throw new Error(res?.message || "Không thể lấy danh sách JD của tôi");
            return res.data as IModelPaginate<IJobDescription>;
        }
    });
};

/* ===================== FETCH PUBLISHED JD ===================== */

export const usePublishedJobDescriptionsQuery = (query: string) => {
    return useQuery({
        queryKey: ["published-job-descriptions", query],
        queryFn: async () => {
            const res = await callFetchPublishedJobDescriptions(query);
            if (!res || res.statusCode !== 200)
                throw new Error(res?.message || "Không thể lấy danh sách JD đã published");
            return res.data as IModelPaginate<IJobDescription>;
        }
    });
};


/* ===================== FETCH REJECTED JD ===================== */

export const useRejectedJobDescriptionsQuery = (query: string) => {
    return useQuery({
        queryKey: ["rejected-job-descriptions", query],
        queryFn: async () => {
            const res = await callFetchRejectedJobDescriptions(query);
            if (!res || res.statusCode !== 200)
                throw new Error(res?.message || "Không thể lấy danh sách JD bị rejected");
            return res.data as IModelPaginate<IJobDescription>;
        }
    });
};


/* ===================== FETCH ALL JD ===================== */

export const useAllJobDescriptionsQuery = (query: string) => {
    return useQuery({
        queryKey: ["all-job-descriptions", query],
        queryFn: async () => {
            const res = await callFetchAllJobDescriptions(query);
            if (!res || res.statusCode !== 200)
                throw new Error(res?.message || "Không thể lấy toàn bộ danh sách JD");
            return res.data as IModelPaginate<IJobDescription>;
        }
    });
};