import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    callFetchDocumentCategory,
    callFetchDocumentCategoryActive,
    callFetchDocumentCategoryMappingProcedure,
    callCreateDocumentCategory,
    callUpdateDocumentCategory,
    callToggleActiveDocumentCategory,
} from "@/config/api";
import type { IDocumentCategory, IModelPaginate } from "@/types/backend";
import { notify } from "@/components/common/notification/notify";

/* ===================== FETCH LIST ===================== */
export const useDocumentCategoriesQuery = (query: string) => {
    return useQuery({
        queryKey: ["document-categories", query],
        queryFn: async () => {
            const res = await callFetchDocumentCategory(query);
            if (!res?.data) throw new Error("Không thể lấy danh sách danh mục văn bản");
            return res.data as IModelPaginate<IDocumentCategory>;
        },
    });
};

/* ===================== FETCH ACTIVE (dropdown) ===================== */
export const useDocumentCategoriesActiveQuery = () => {
    return useQuery({
        queryKey: ["document-categories-active"],
        queryFn: async () => {
            const res = await callFetchDocumentCategoryActive();
            if (!res?.data) throw new Error("Không thể lấy danh sách danh mục");
            return res.data as IDocumentCategory[];
        },
    });
};

/* ===================== FETCH MAPPING PROCEDURE (dropdown form tạo văn bản) ===================== */
export const useDocumentCategoriesMappingQuery = () => {
    return useQuery({
        queryKey: ["document-categories-mapping"],
        queryFn: async () => {
            const res = await callFetchDocumentCategoryMappingProcedure();
            if (!res?.data) throw new Error("Không thể lấy danh sách danh mục mapping");
            return res.data as IDocumentCategory[];
        },
    });
};

/* ===================== CREATE ===================== */
export const useCreateDocumentCategoryMutation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (data: IDocumentCategory) => {
            const res = await callCreateDocumentCategory(data);
            if (!res?.data) throw new Error(res?.message || "Không thể tạo danh mục");
            return res;
        },
        onSuccess: (res) => {
            notify.created(res?.message || "Tạo danh mục thành công");
            queryClient.invalidateQueries({ queryKey: ["document-categories"] });
            queryClient.invalidateQueries({ queryKey: ["document-categories-active"] });
            queryClient.invalidateQueries({ queryKey: ["document-categories-mapping"] });
        },
        onError: (error: any) => {
            notify.error(error.message || "Lỗi khi tạo danh mục");
        },
    });
};

/* ===================== UPDATE ===================== */
export const useUpdateDocumentCategoryMutation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, data }: { id: number; data: IDocumentCategory }) => {
            const res = await callUpdateDocumentCategory(id, data);
            if (!res?.data) throw new Error(res?.message || "Không thể cập nhật danh mục");
            return res;
        },
        onSuccess: (res) => {
            notify.updated(res?.message || "Cập nhật danh mục thành công");
            queryClient.invalidateQueries({ queryKey: ["document-categories"] });
            queryClient.invalidateQueries({ queryKey: ["document-categories-active"] });
            queryClient.invalidateQueries({ queryKey: ["document-categories-mapping"] });
        },
        onError: (error: any) => {
            notify.error(error.message || "Lỗi khi cập nhật danh mục");
        },
    });
};

/* ===================== TOGGLE ACTIVE ===================== */
export const useToggleActiveDocumentCategoryMutation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: number) => {
            const res = await callToggleActiveDocumentCategory(id);
            if (res?.statusCode && Number(res.statusCode) >= 400) {
                throw new Error(res?.message || "Không thể cập nhật trạng thái");
            }
            return res;
        },
        onSuccess: () => {
            notify.updated("Cập nhật trạng thái thành công");
            queryClient.invalidateQueries({ queryKey: ["document-categories"] });
            queryClient.invalidateQueries({ queryKey: ["document-categories-active"] });
            queryClient.invalidateQueries({ queryKey: ["document-categories-mapping"] });
        },
        onError: (error: any) => {
            notify.error(error.message || "Lỗi khi cập nhật trạng thái");
        },
    });
};
