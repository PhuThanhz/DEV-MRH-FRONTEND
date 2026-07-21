import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    callFetchAccountingDocumentCategories,
    callFetchAccountingDocumentCategoryActive,
    callFetchAccountingDocumentCategoryById,
    callCreateAccountingDocumentCategory,
    callUpdateAccountingDocumentCategory,
    callToggleActiveAccountingDocumentCategory,
    callDeleteAccountingDocumentCategory,
} from "@/config/api";
import type {
    IAccountingDocumentCategory,
    IAccountingDocumentCategoryRequest,
    IModelPaginate,
} from "@/types/backend";
import { notify } from "@/components/common/notification/notify";

const QUERY_KEY = "accounting-document-categories";

/* ===================== FETCH LIST (phân trang) ===================== */
export const useAccountingDocumentCategoriesQuery = (query: string) => {
    return useQuery({
        queryKey: [QUERY_KEY, query],
        queryFn: async () => {
            const res = await callFetchAccountingDocumentCategories(query);
            if (!res?.data) throw new Error("Không thể lấy danh sách loại chứng từ kế toán");
            return res.data as IModelPaginate<IAccountingDocumentCategory>;
        },
    });
};

/* ===================== FETCH ACTIVE (dropdown) ===================== */
export const useAccountingDocumentCategoryActiveQuery = () => {
    return useQuery({
        queryKey: [`${QUERY_KEY}-active`],
        queryFn: async () => {
            const res = await callFetchAccountingDocumentCategoryActive();
            if (!res?.data) throw new Error("Không thể lấy danh sách loại chứng từ");
            return res.data as IAccountingDocumentCategory[];
        },
    });
};

/* ===================== FETCH BY ID ===================== */
export const useAccountingDocumentCategoryByIdQuery = (id: number | null) => {
    return useQuery({
        queryKey: [QUERY_KEY, id],
        queryFn: async () => {
            if (!id) return null;
            const res = await callFetchAccountingDocumentCategoryById(id);
            if (!res?.data) throw new Error("Không thể lấy thông tin loại chứng từ");
            return res.data as IAccountingDocumentCategory;
        },
        enabled: !!id,
    });
};

/* ===================== CREATE ===================== */
export const useCreateAccountingDocumentCategoryMutation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (data: IAccountingDocumentCategoryRequest) => {
            const res = await callCreateAccountingDocumentCategory(data);
            if (!res?.data) throw new Error(res?.message || "Không thể tạo loại chứng từ");
            return res;
        },
        onSuccess: (res) => {
            notify.created(res?.message || "Tạo loại chứng từ kế toán thành công");
            queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
        },
        onError: (error: any) => {
            notify.error(error.message || "Không thể tạo loại chứng từ kế toán");
        },
    });
};

/* ===================== UPDATE ===================== */
export const useUpdateAccountingDocumentCategoryMutation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({
            id,
            data,
        }: {
            id: number;
            data: IAccountingDocumentCategoryRequest;
        }) => {
            const res = await callUpdateAccountingDocumentCategory(id, data);
            if (!res?.data) throw new Error(res?.message || "Không thể cập nhật loại chứng từ");
            return res;
        },
        onSuccess: (res) => {
            notify.updated(res?.message || "Cập nhật loại chứng từ kế toán thành công");
            queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
        },
        onError: (error: any) => {
            notify.error(error.message || "Không thể cập nhật loại chứng từ kế toán");
        },
    });
};

/* ===================== TOGGLE ACTIVE ===================== */
export const useToggleActiveAccountingDocumentCategoryMutation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: number) => {
            const res = await callToggleActiveAccountingDocumentCategory(id);
            if (res?.statusCode && Number(res.statusCode) >= 400) {
                throw new Error(res?.message || "Không thể cập nhật trạng thái");
            }
            return res;
        },
        onSuccess: () => {
            notify.updated("Cập nhật trạng thái thành công");
            queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
        },
        onError: (error: any) => {
            notify.error(error.message || "Không thể cập nhật trạng thái");
        },
    });
};

/* ===================== DELETE ===================== */
export const useDeleteAccountingDocumentCategoryMutation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: number) => {
            const res = await callDeleteAccountingDocumentCategory(id);
            if (res?.statusCode && Number(res.statusCode) >= 400) {
                throw new Error(res?.message || "Không thể xóa loại chứng từ");
            }
            return res;
        },
        onSuccess: () => {
            notify.deleted("Xóa loại chứng từ kế toán thành công");
            queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
        },
        onError: (error: any) => {
            notify.error(error.message || "Không thể xóa loại chứng từ kế toán");
        },
    });
};
