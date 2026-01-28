import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    callFetchUser,
    callCreateUser,
    callUpdateUser,
    callDeleteUser,
} from "@/config/api";
import type { IUser, IModelPaginate } from "@/types/backend";
import { notify } from "@/components/common/notification/notify";

export const useUsersQuery = (query: string) => {
    return useQuery({
        queryKey: ["users", query],
        queryFn: async () => {
            const res = await callFetchUser(query);
            if (!res?.data) throw new Error("Không thể lấy danh sách người dùng");
            return res.data as IModelPaginate<IUser>;
        },
    });
};

export const useUserByIdQuery = (id?: string) => {
    return useQuery({
        queryKey: ["user", id],
        enabled: !!id,
        queryFn: async () => {
            if (!id) throw new Error("Thiếu ID người dùng");
            const res = await callFetchUser(`filter=id:${id}`);
            if (!res?.data?.result?.length)
                throw new Error("Không tìm thấy thông tin người dùng");
            return res.data.result[0] as IUser;
        },
    });
};

export const useCreateUserMutation = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (user: IUser) => {
            const res = await callCreateUser(user);
            if (!res?.data)
                throw new Error(res?.message || "Không thể tạo người dùng");
            return res;
        },
        onSuccess: (res) => {
            notify.created(res?.message || "Tạo người dùng thành công");
            queryClient.invalidateQueries({ queryKey: ["users"] });
        },
        onError: (error: any) => {
            notify.error(error.message || "Lỗi khi tạo người dùng");
        },
    });
};

export const useUpdateUserMutation = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (user: IUser) => {
            const res = await callUpdateUser(user);
            if (!res?.data)
                throw new Error(res?.message || "Không thể cập nhật người dùng");
            return res;
        },
        onSuccess: (res, variables) => {
            notify.updated(res?.message || "Cập nhật người dùng thành công");
            queryClient.invalidateQueries({ queryKey: ["users"] });
            if (variables?.id) {
                queryClient.invalidateQueries({ queryKey: ["user", variables.id] });
            }
        },
        onError: (error: any) => {
            notify.error(error.message || "Lỗi khi cập nhật người dùng");
        },
    });
};

export const useDeleteUserMutation = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            const res = await callDeleteUser(id);
            if (!res?.statusCode || res.statusCode !== 200) {
                throw new Error(res?.message || "Không thể xóa người dùng");
            }
            return res.data;
        },
        onSuccess: () => {
            notify.deleted("Xóa người dùng thành công");
            queryClient.invalidateQueries({ queryKey: ["users"], exact: false });
        },
        onError: (error: any) => {
            notify.error(error.message || "Lỗi khi xóa người dùng");
        },
    });
};
