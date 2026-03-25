import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    callFetchUserPositions,
    callCreateUserPosition,
    callDeleteUserPosition,
} from "@/config/api";
import type { IUserPosition } from "@/types/backend";
import { notify } from "@/components/common/notification/notify";

/* ===== GET LIST ===== */
export const useUserPositionsQuery = (userId?: number) => {
    return useQuery({
        queryKey: ["user-positions", userId],
        enabled: !!userId,
        queryFn: async () => {
            const res = await callFetchUserPositions(userId!);
            // interceptor đã unwrap 1 lần → res = IBackendRes → res.data = IUserPosition[]
            return (res as any)?.data ?? [];
        },
    });
};

/* ===== CREATE ===== */
export const useCreateUserPositionMutation = () => {
    const client = useQueryClient();
    return useMutation({
        mutationFn: async ({
            userId,
            data,
        }: {
            userId: number;
            data: {
                source: string;
                companyJobTitleId?: number;
                departmentJobTitleId?: number;
                sectionJobTitleId?: number;
            };
        }) => {
            const res = await callCreateUserPosition(userId, data);
            // interceptor đã unwrap → res = IBackendRes → res.data = IUserPosition
            return (res as any)?.data ?? null;
        },
        onSuccess: (_data, variables) => {
            notify.created("Gán chức danh thành công");
            client.invalidateQueries({ queryKey: ["user-positions", variables.userId] });
        },
        onError: (err: any) => {
            notify.error(err?.response?.data?.message || "Lỗi gán chức danh");
        },
    });
};

/* ===== DELETE ===== */
export const useDeleteUserPositionMutation = (userId?: number) => {
    const client = useQueryClient();
    return useMutation({
        mutationFn: async (id: number) => {
            await callDeleteUserPosition(id);
        },
        onSuccess: () => {
            notify.deleted("Đã xóa chức danh");
            client.invalidateQueries({ queryKey: ["user-positions", userId] });
        },
        onError: (err: any) => {
            notify.error(err?.response?.data?.message || "Lỗi xóa chức danh");
        },
    });
};