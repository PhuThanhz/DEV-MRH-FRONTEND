import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    callFetchDocuments,
    callFetchDocumentById,
    callCreateDocument,
    callUpdateDocument,
    callToggleActiveDocument,
    callDeleteDocument,
    callFetchDocumentsByCategory,
    callFetchDocumentsByDepartment,
} from "@/config/api";
import type {
    IDocument,
    IDocumentRequest,
    IModelPaginate,
} from "@/types/backend";
import { notify } from "@/components/common/notification/notify";

/* ===================== FETCH LIST ===================== */
export const useDocumentsQuery = (query: string) => {
    return useQuery({
        queryKey: ["documents", query],
        queryFn: async () => {
            const res = await callFetchDocuments(query);
            if (!res?.data) throw new Error("Không thể lấy danh sách văn bản");
            return res.data as IModelPaginate<IDocument>;
        },
    });
};

/* ===================== FETCH BY ID ===================== */
export const useDocumentByIdQuery = (id?: number) => {
    return useQuery({
        queryKey: ["document", id],
        enabled: !!id,
        queryFn: async () => {
            if (!id) throw new Error("Thiếu ID văn bản");
            const res = await callFetchDocumentById(id);
            if (!res?.data) throw new Error("Không tìm thấy văn bản");
            return res.data as IDocument;
        },
    });
};

/* ===================== FETCH BY CATEGORY ===================== */
export const useDocumentsByCategoryQuery = (categoryId?: number) => {
    return useQuery({
        queryKey: ["documents-by-category", categoryId],
        enabled: !!categoryId,
        queryFn: async () => {
            if (!categoryId) throw new Error("Thiếu ID danh mục");
            const res = await callFetchDocumentsByCategory(categoryId);
            if (!res?.data) throw new Error("Không thể lấy danh sách văn bản theo danh mục");
            return res.data as IDocument[];
        },
    });
};

/* ===================== FETCH BY DEPARTMENT ===================== */
export const useDocumentsByDepartmentQuery = (departmentId?: number) => {
    return useQuery({
        queryKey: ["documents-by-department", departmentId],
        enabled: !!departmentId,
        queryFn: async () => {
            if (!departmentId) throw new Error("Thiếu ID phòng ban");
            const res = await callFetchDocumentsByDepartment(departmentId);
            if (!res?.data) throw new Error("Không thể lấy danh sách văn bản theo phòng ban");
            return res.data as IDocument[];
        },
    });
};

/* ===================== CREATE ===================== */
export const useCreateDocumentMutation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (data: IDocumentRequest) => {
            const res = await callCreateDocument(data);
            if (!res?.data) throw new Error(res?.message || "Không thể tạo văn bản");
            return res;
        },
        onSuccess: (res) => {
            notify.created(res?.message || "Tạo văn bản thành công");
            queryClient.invalidateQueries({ queryKey: ["documents"] });
        },
        onError: (error: any) => {
            notify.error(error.message || "Lỗi khi tạo văn bản");
        },
    });
};

/* ===================== UPDATE ===================== */
export const useUpdateDocumentMutation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, data }: { id: number; data: IDocumentRequest }) => {
            const res = await callUpdateDocument(id, data);
            if (!res?.data) throw new Error(res?.message || "Không thể cập nhật văn bản");
            return res;
        },
        onSuccess: (res, variables) => {
            notify.updated(res?.message || "Cập nhật văn bản thành công");
            queryClient.invalidateQueries({ queryKey: ["documents"] });
            queryClient.invalidateQueries({ queryKey: ["document", variables.id] });
        },
        onError: (error: any) => {
            notify.error(error.message || "Lỗi khi cập nhật văn bản");
        },
    });
};

/* ===================== TOGGLE ACTIVE ===================== */
export const useToggleActiveDocumentMutation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: number) => {
            const res = await callToggleActiveDocument(id);
            if (res?.statusCode && Number(res.statusCode) >= 400) {
                throw new Error(res?.message || "Không thể cập nhật trạng thái");
            }
            return res;
        },
        onSuccess: () => {
            notify.updated("Cập nhật trạng thái thành công");
            queryClient.invalidateQueries({ queryKey: ["documents"], exact: false });
        },
        onError: (error: any) => {
            notify.error(error.message || "Lỗi khi cập nhật trạng thái");
        },
    });
};

/* ===================== DELETE ===================== */
export const useDeleteDocumentMutation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: number) => {
            const res = await callDeleteDocument(id);
            if (res?.statusCode && Number(res.statusCode) >= 400) {
                throw new Error(res?.message || "Không thể xoá văn bản");
            }
            return res;
        },
        onSuccess: () => {
            notify.deleted("Xoá văn bản thành công");
            queryClient.invalidateQueries({ queryKey: ["documents"], exact: false });
        },
        onError: (error: any) => {
            notify.error(error.message || "Lỗi khi xoá văn bản");
        },
    });
};