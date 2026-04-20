import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    callFetchUserPositions,
    callCreateUserPosition,
    callDeleteUserPosition,
} from "@/config/api";
import type { IUserPosition } from "@/types/backend";
import { notify } from "@/components/common/notification/notify";

/* ===== GET LIST ===== */
export const useUserPositionsQuery = (userId?: string) => {  // ✅ string
    return useQuery({
        queryKey: ["user-positions", userId],
        enabled: !!userId,
        queryFn: async () => {
            const res = await callFetchUserPositions(userId!);
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
            userId: string;  // ✅ string
            data: {
                source: string;
                companyJobTitleId?: number;
                departmentJobTitleId?: number;
                sectionJobTitleId?: number;
            };
        }) => {
            const res = await callCreateUserPosition(userId, data);
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
export const useDeleteUserPositionMutation = (userId?: string) => {  // ✅ string
    const client = useQueryClient();
    return useMutation({
        mutationFn: async (id: string) => {
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