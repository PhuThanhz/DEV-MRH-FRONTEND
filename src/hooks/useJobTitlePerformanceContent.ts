// src/hooks/useJobTitlePerformanceContent.ts

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import {
    callFetchJobTitlePerformanceContent,
    callCreateJobTitlePerformanceContent,
    callUpdateJobTitlePerformanceContent,
    callDisableJobTitlePerformanceContent,
    callRestoreJobTitlePerformanceContent,
} from "@/config/api";

import type {
    IJobTitlePerformanceContent,
    IReqJobTitlePerformanceContent,
} from "@/types/backend";

import { notify } from "@/components/common/notification/notify";

/* ============================================================
   FETCH LIST — ALWAYS RETURN ARRAY
   ============================================================ */
export const useJobTitlePerformanceContentQuery = (
    ownerLevel?: string,
    ownerJobTitleId?: number
) => {
    return useQuery<IJobTitlePerformanceContent[]>({
        queryKey: ["job-title-performance-content", ownerLevel, ownerJobTitleId],
        enabled: !!ownerLevel && !!ownerJobTitleId,

        queryFn: async () => {
            const res = await callFetchJobTitlePerformanceContent(
                ownerLevel!,
                ownerJobTitleId!
            );

            const raw = res?.data;

            if (Array.isArray(raw)) return raw;
            if (raw && Array.isArray((raw as any).result)) {
                return (raw as any).result;
            }

            return [];
        },
    });
};

/* ============================================================
   CREATE
   ============================================================ */
export const useCreateJobTitlePerformanceContentMutation = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (payload: IReqJobTitlePerformanceContent) => {
            const res = await callCreateJobTitlePerformanceContent(payload);
            return res.data;
        },

        onSuccess: (_, payload) => {
            notify.created("Tạo nội dung đánh giá thành công");

            queryClient.invalidateQueries({
                queryKey: [
                    "job-title-performance-content",
                    payload.ownerLevel,
                    payload.ownerJobTitleId,
                ],
            });
        },
    });
};

/* ============================================================
   UPDATE
   ============================================================ */
export const useUpdateJobTitlePerformanceContentMutation = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (params: { id: number; payload: IReqJobTitlePerformanceContent }) => {
            const res = await callUpdateJobTitlePerformanceContent(
                params.id,
                params.payload
            );
            return res.data;
        },

        onSuccess: (_, params) => {
            notify.updated("Cập nhật nội dung thành công");

            queryClient.invalidateQueries({
                queryKey: [
                    "job-title-performance-content",
                    params.payload.ownerLevel,
                    params.payload.ownerJobTitleId,
                ],
            });
        },
    });
};

/* ============================================================
   DISABLE
   ============================================================ */
export const useDisableJobTitlePerformanceContentMutation = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id }: { id: number }) => {
            // BE trả String → không có statusCode
            await callDisableJobTitlePerformanceContent(id);
        },

        onSuccess: () => {
            notify.deleted("Đã vô hiệu nội dung đánh giá");

            queryClient.invalidateQueries({
                queryKey: ["job-title-performance-content"],
            });
        },
    });
};

/* ============================================================
   RESTORE
   ============================================================ */
export const useRestoreJobTitlePerformanceContentMutation = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id }: { id: number }) => {
            await callRestoreJobTitlePerformanceContent(id);
        },

        onSuccess: () => {
            notify.success("Đã khôi phục nội dung đánh giá");

            queryClient.invalidateQueries({
                queryKey: ["job-title-performance-content"],
            });
        },
    });
};
