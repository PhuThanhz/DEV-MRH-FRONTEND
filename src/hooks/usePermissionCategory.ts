import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    callFetchPermissionCategory,
    callFetchPermissionCategoryById,
    callCreatePermissionCategory,
    callUpdatePermissionCategory,
    callDeletePermissionCategory,
} from "@/config/api";
import type {
    IPermissionCategory,
    IPermissionCategoryRequest,
    IModelPaginate,
} from "@/types/backend";
import { notify } from "@/components/common/notification/notify";

/* ===================== LIST ===================== */
export const usePermissionCategoryQuery = (query: string) => {
    return useQuery({
        queryKey: ["permission-category", query],
        queryFn: async () => {
            const res = await callFetchPermissionCategory(query);
            if (!res?.data) {
                throw new Error("Không thể tải danh mục phân quyền");
            }
            return res.data as IModelPaginate<IPermissionCategory>;
        },
    });
};

/* ===================== GET BY ID ===================== */
export const usePermissionCategoryByIdQuery = (id: number | null) =>
    useQuery({
        queryKey: ["permission-category-detail", id],
        queryFn: async () => {
            const res = await callFetchPermissionCategoryById(id!);
            if (!res?.data) throw new Error("Không thể lấy chi tiết danh mục");
            return res.data as IPermissionCategory;
        },
        enabled: !!id,
    });

/* ===================== CREATE ===================== */
export const useCreatePermissionCategoryMutation = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: IPermissionCategoryRequest) => {
            const res = await callCreatePermissionCategory(data);
            if (!res?.data) {
                throw new Error(res?.message || "Không thể tạo danh mục");
            }
            return res;
        },
        onSuccess: () => {
            notify.created("Tạo danh mục phân quyền thành công");
            queryClient.invalidateQueries({
                queryKey: ["permission-category"],
                exact: false,
            });
        },
        onError: (err: any) => {
            notify.error(err.message || "Không thể tạo danh mục");
        },
    });
};

/* ===================== UPDATE ===================== */
export const useUpdatePermissionCategoryMutation = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (payload: {
            id: string | number;
            data: IPermissionCategoryRequest;
        }) => {
            const res = await callUpdatePermissionCategory(
                payload.id,
                payload.data
            );
            if (!res?.data) {
                throw new Error("Không thể cập nhật danh mục");
            }
            return res;
        },
        onSuccess: () => {
            notify.updated("Cập nhật danh mục thành công");
            queryClient.invalidateQueries({
                queryKey: ["permission-category"],
                exact: false,
            });
        },
        onError: (err: any) => {
            notify.error(err.message || "Không thể cập nhật danh mục");
        },
    });
};

/* ===================== DELETE (SOFT) ===================== */
export const useDeletePermissionCategoryMutation = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string | number) => {
            const res = await callDeletePermissionCategory(id);
            if (!res?.statusCode || res.statusCode !== 200) {
                throw new Error(res?.message || "Không thể ngưng sử dụng");
            }
            return res.data;
        },
        onSuccess: () => {
            notify.deleted("Ngưng sử dụng danh mục thành công");
            queryClient.invalidateQueries({
                queryKey: ["permission-category"],
                exact: false,
            });
        },
        onError: (err: any) => {
            notify.error(err.message || "Không thể ngưng danh mục");
        },
    });
};