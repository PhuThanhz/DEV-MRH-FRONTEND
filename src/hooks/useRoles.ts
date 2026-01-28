import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    callFetchRole,
    callFetchRoleById,
    callCreateRole,
    callUpdateRole,
    callDeleteRole,
} from "@/config/api";
import type { IRole, IModelPaginate } from "@/types/backend";
import { notify } from "@/components/common/notification/notify";

// Lấy danh sách vai trò (phân trang, tìm kiếm, sắp xếp,...)
export const useRolesQuery = (query: string) => {
    return useQuery({
        queryKey: ["roles", query],
        queryFn: async () => {
            const res = await callFetchRole(query);
            if (!res?.data) throw new Error("Không thể lấy danh sách vai trò");
            return res.data as IModelPaginate<IRole>;
        },
    });
};

// Lấy chi tiết vai trò theo ID
export const useRoleByIdQuery = (id?: string) => {
    return useQuery({
        queryKey: ["role", id],
        enabled: !!id,
        queryFn: async () => {
            if (!id) throw new Error("Thiếu ID vai trò");
            const res = await callFetchRoleById(id);
            if (!res?.data) throw new Error("Không thể lấy thông tin vai trò");
            return res.data as IRole;
        },
    });
};

// Tạo mới vai trò
export const useCreateRoleMutation = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (role: IRole) => {
            const res = await callCreateRole(role);
            if (!res?.data) throw new Error(res?.message || "Không thể tạo vai trò");
            return res;
        },
        onSuccess: (res) => {
            notify.created(res?.message || "Tạo vai trò thành công");
            queryClient.invalidateQueries({ queryKey: ["roles"] });
        },
        onError: (error: any) => {
            notify.error(error.message || "Lỗi khi tạo vai trò");
        },
    });
};

// Cập nhật vai trò
export const useUpdateRoleMutation = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ role, id }: { role: IRole; id: string }) => {
            const res = await callUpdateRole(role, id);
            if (!res?.data)
                throw new Error(res?.message || "Không thể cập nhật vai trò");
            return res;
        },
        onSuccess: (res, variables) => {
            notify.updated(res?.message || "Cập nhật vai trò thành công");
            queryClient.invalidateQueries({ queryKey: ["roles"] });
            queryClient.invalidateQueries({ queryKey: ["role", variables.id] });
        },
        onError: (error: any) => {
            notify.error(error.message || "Lỗi khi cập nhật vai trò");
        },
    });
};

// Xóa vai trò
export const useDeleteRoleMutation = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            const res = await callDeleteRole(id);
            if (!res?.statusCode || res.statusCode !== 200) {
                throw new Error(res?.message || "Không thể xóa vai trò");
            }
            return res.data;
        },
        onSuccess: (res) => {
            notify.deleted("Xóa vai trò thành công");
            queryClient.invalidateQueries({ queryKey: ["roles"], exact: false });
        },
        onError: (error: any) => {
            notify.error(error.message || "Lỗi khi xóa vai trò");
        },
    });
};
