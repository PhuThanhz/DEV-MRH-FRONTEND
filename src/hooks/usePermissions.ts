import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    callFetchPermission,
    callFetchPermissionById,
    callCreatePermission,
    callUpdatePermission,
    callDeletePermission,
} from "@/config/api";
import type { IPermission, IModelPaginate } from "@/types/backend";
import { notify } from "@/components/common/notification/notify";

// Lấy danh sách quyền
export const usePermissionsQuery = (query: string) => {
    return useQuery({
        queryKey: ["permissions", query],
        queryFn: async () => {
            const res = await callFetchPermission(query);
            if (!res?.data) throw new Error("Không thể lấy danh sách quyền");
            return res.data as IModelPaginate<IPermission>;
        },
    });
};
// Lấy chi tiết quyền theo ID
export const usePermissionByIdQuery = (id?: string) => {
    return useQuery({
        queryKey: ["permission", id],
        enabled: !!id,
        queryFn: async () => {
            if (!id) throw new Error("Thiếu ID quyền");
            const res = await callFetchPermissionById(id);
            if (!res?.data) throw new Error("Không thể lấy thông tin quyền");
            return res.data as IPermission;
        },
    });
};

// Tạo mới quyền (Create)
export const useCreatePermissionMutation = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (permission: IPermission) => {
            const res = await callCreatePermission(permission);
            if (!res?.data)
                throw new Error(res?.message || "Không thể tạo quyền");
            return res;
        },
        onSuccess: (res) => {
            notify.created(res?.message || "Tạo quyền thành công");
            queryClient.invalidateQueries({ queryKey: ["permissions"] });
        },
        onError: (error: any) => {
            notify.error(error.message || "Lỗi khi tạo quyền");
        },
    });
};

// Cập nhật quyền (Update)
export const useUpdatePermissionMutation = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ permission, id }: { permission: IPermission; id: string }) => {
            const res = await callUpdatePermission(permission, id);
            if (!res?.data)
                throw new Error(res?.message || "Không thể cập nhật quyền");
            return res;
        },
        onSuccess: (res) => {
            notify.updated(res?.message || "Cập nhật quyền thành công");
            queryClient.invalidateQueries({ queryKey: ["permissions"] });
        },
        onError: (error: any) => {
            notify.error(error.message || "Lỗi khi cập nhật quyền");
        },
    });
};

// Xóa quyền (Delete)
export const useDeletePermissionMutation = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            const res = await callDeletePermission(id);
            if (!res?.statusCode || res.statusCode !== 200) {
                throw new Error(res?.message || "Không thể xóa quyền");
            }
            return res.data;
        },
        onSuccess: () => {
            notify.deleted("Xóa quyền thành công");
            queryClient.invalidateQueries({ queryKey: ["permissions"], exact: false });
        },
        onError: (error: any) => {
            notify.error(error.message || "Lỗi khi xóa quyền");
        },
    });
};
