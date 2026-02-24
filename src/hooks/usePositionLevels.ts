// src/hooks/usePositionLevels.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    callFetchPositionLevel,
    callCreatePositionLevel,
    callUpdatePositionLevel,
    callDeletePositionLevel,
    callActivePositionLevel,
} from "@/config/api";

import type { IBackendRes, IModelPaginate, IPositionLevel } from "@/types/backend";
import { notify } from "@/components/common/notification/notify";

/* =====================================================
    GET PAGINATE
   ===================================================== */
export const usePositionLevelsQuery = (query: string) => {
    return useQuery({
        queryKey: ["position-levels", query],
        queryFn: async () => {
            const res = await callFetchPositionLevel(query);
            const backend = res as IBackendRes<IModelPaginate<IPositionLevel>>;

            return backend.data ?? {
                meta: { page: 1, pageSize: 10, pages: 0, total: 0 },
                result: [],
            };
        },
    });
};

/* =====================================================
    CREATE
   ===================================================== */
export const useCreatePositionLevelMutation = () => {
    const client = useQueryClient();

    return useMutation({
        mutationFn: async (data: any) => {
            const res = await callCreatePositionLevel(data);
            return (res as IBackendRes<IPositionLevel>).data;
        },
        onSuccess: () => {
            notify.created("Tạo bậc chức danh thành công");
            client.invalidateQueries({ queryKey: ["position-levels"] });
        },
    });
};

/* =====================================================
    UPDATE
   ===================================================== */
export const useUpdatePositionLevelMutation = () => {
    const client = useQueryClient();

    return useMutation({
        mutationFn: async (data: any) => {
            const res = await callUpdatePositionLevel(data);
            return (res as IBackendRes<IPositionLevel>).data;
        },
        onSuccess: () => {
            notify.updated("Cập nhật bậc chức danh thành công");
            client.invalidateQueries({ queryKey: ["position-levels"] });
        },
    });
};

/* =====================================================
    DELETE (soft delete) → backend trả null
   ===================================================== */
export const useDeletePositionLevelMutation = () => {
    const client = useQueryClient();

    return useMutation({
        mutationFn: async (id: number) => {
            await callDeletePositionLevel(id); // BE trả null → không cần return
        },
        onSuccess: () => {
            notify.deleted("Ngừng kích hoạt thành công");
            client.invalidateQueries({ queryKey: ["position-levels"] });
        },
    });
};

/* =====================================================
    ACTIVE → backend cũng trả null
   ===================================================== */
export const useActivePositionLevelMutation = () => {
    const client = useQueryClient();

    return useMutation({
        mutationFn: async (id: number) => {
            await callActivePositionLevel(id); // BE trả null → không cần return
        },
        onSuccess: () => {
            notify.updated("Kích hoạt lại thành công");
            client.invalidateQueries({ queryKey: ["position-levels"] });
        },
    });
};
