import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    callFetchPermissionContent,
    callCreatePermissionContent,
    callUpdatePermissionContent,
    callDeletePermissionContent,
    callTogglePermissionContent,
} from "@/config/api";

import type {
    IPermissionContent,
    ICreatePermissionContentReq,
    IUpdatePermissionContentReq,
    IModelPaginate,
} from "@/types/backend";

import { notify } from "@/components/common/notification/notify";

/* ===================== LIST ===================== */
export const usePermissionContentQuery = (query: string) => {
    return useQuery({
        queryKey: ["permission-content", query],
        enabled: !!query,
        queryFn: async () => {
            const res = await callFetchPermissionContent(query);
            if (!res?.data) {
                throw new Error("Không thể tải nội dung phân quyền");
            }
            return res.data as IModelPaginate<IPermissionContent>;
        },
    });
};

/* ===================== CREATE ===================== */
export const useCreatePermissionContentMutation = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: ICreatePermissionContentReq) => {
            const res = await callCreatePermissionContent(data);
            if (!res?.data) {
                throw new Error(res?.message || "Không thể tạo nội dung");
            }
            return res;
        },
        onSuccess: () => {
            notify.created("Tạo nội dung phân quyền thành công");
            queryClient.invalidateQueries({
                queryKey: ["permission-content"],
                exact: false,
            });
        },
        onError: (err: any) => {
            notify.error(err.message || "Lỗi khi tạo nội dung");
        },
    });
};

/* ===================== UPDATE ===================== */
export const useUpdatePermissionContentMutation = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (payload: {
            id: string | number;
            data: IUpdatePermissionContentReq;
        }) => {
            const res = await callUpdatePermissionContent(
                payload.id,
                payload.data
            );
            if (!res?.data) {
                throw new Error("Không thể cập nhật nội dung");
            }
            return res;
        },
        onSuccess: () => {
            notify.updated("Cập nhật nội dung thành công");
            queryClient.invalidateQueries({
                queryKey: ["permission-content"],
                exact: false,
            });
        },
        onError: (err: any) => {
            notify.error(err.message || "Lỗi khi cập nhật nội dung");
        },
    });
};

/* ===================== DELETE (SOFT) ===================== */
export const useDeletePermissionContentMutation = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string | number) => {
            const res = await callDeletePermissionContent(id);
            if (!res?.statusCode || res.statusCode !== 200) {
                throw new Error("Không thể xoá nội dung");
            }
            return res;
        },
        onSuccess: () => {
            notify.deleted("Xoá nội dung thành công");
            queryClient.invalidateQueries({
                queryKey: ["permission-content"],
                exact: false,
            });
        },
        onError: (err: any) => {
            notify.error(err.message || "Lỗi khi xoá nội dung");
        },
    });
};

/* ===================== TOGGLE ACTIVE ===================== */
export const useTogglePermissionContentMutation = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string | number) => {
            const res = await callTogglePermissionContent(id);
            if (!res?.statusCode || res.statusCode !== 200) {
                throw new Error("Không thể bật / tắt nội dung");
            }
            return res;
        },
        onSuccess: () => {
            notify.updated("Cập nhật trạng thái nội dung thành công");
            queryClient.invalidateQueries({
                queryKey: ["permission-content"],
                exact: false,
            });
        },
    });
};
