import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    callFetchPositionLevel,
    callFetchPositionLevelById,
    callCreatePositionLevel,
    callUpdatePositionLevel,
    callDeletePositionLevel,
    callActivePositionLevel,
} from "@/config/api";

import type { IBackendRes, IModelPaginate, IPositionLevel } from "@/types/backend";
import { notify } from "@/components/common/notification/notify";

export const usePositionLevelsQuery = (query: string, enabled = true) => {
    return useQuery({
        queryKey: ["position-levels", query],
        enabled,
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

// ← THÊM MỚI
export const usePositionLevelByIdQuery = (id?: number) => {
    return useQuery({
        queryKey: ["position-level", id],
        enabled: !!id,
        queryFn: async () => {
            if (!id) throw new Error("Thiếu ID");
            const res = await callFetchPositionLevelById(id);
            if (!res?.data) throw new Error("Không tìm thấy bậc chức danh");
            return res.data as IPositionLevel;
        },
    });
};

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
        onError: (err: any) => {
            notify.error(err?.message || "Không thể tạo bậc chức danh");
        },
    });
};

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
        onError: (err: any) => {
            notify.error(err?.message || "Không thể cập nhật bậc chức danh");
        },
    });
};

export const useDeletePositionLevelMutation = () => {
    const client = useQueryClient();
    return useMutation({
        mutationFn: async (id: number) => {
            await callDeletePositionLevel(id);
        },
        onSuccess: () => {
            notify.deleted("Ngừng kích hoạt thành công");
            client.invalidateQueries({ queryKey: ["position-levels"] });
        },
    });
};

export const useActivePositionLevelMutation = () => {
    const client = useQueryClient();
    return useMutation({
        mutationFn: async (id: number) => {
            await callActivePositionLevel(id);
        },
        onSuccess: () => {
            notify.updated("Kích hoạt lại thành công");
            client.invalidateQueries({ queryKey: ["position-levels"] });
        },
    });
};
