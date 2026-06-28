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
    callCreateDocumentShareToken,
    callFetchDocumentShareTokens,
    callRevokeDocumentShareToken,
    callSendDocumentShareEmail,
    callFetchDocumentShareTokenAccessLogs,
    callMarkDocumentRead,
    callGetNextDocumentCode,
} from "@/config/api";
import type {
    IDocument,
    IDocumentRequest,
    IModelPaginate,
    IResShareTokenDTO,
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

/* ===================== MARK READ ===================== */
export const useMarkDocumentReadMutation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: number) => {
            const res = await callMarkDocumentRead(id);
            if (res?.statusCode && Number(res.statusCode) >= 400) {
                throw new Error(res?.message || "Không thể cập nhật trạng thái đã xem");
            }
            return res;
        },
        onSuccess: (_, id) => {
            queryClient.invalidateQueries({ queryKey: ["document", id] });
        },
        onError: (error: any) => {
            console.error("Lỗi khi đánh dấu đã xem:", error);
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

/* ===================== FETCH NEXT CODE ===================== */
export const useGetNextDocumentCodeQuery = (companyId: number | null, categoryId: number | undefined, year: number | null) => {
    return useQuery({
        queryKey: ["next-document-code", companyId, categoryId, year],
        enabled: !!companyId && !!categoryId && !!year,
        queryFn: async () => {
            if (!companyId || !categoryId || !year) throw new Error("Thiếu tham số");
            const res = await callGetNextDocumentCode(companyId, categoryId, year);
            return res?.data?.code || null;
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

/* ===================== FETCH SHARE TOKENS ===================== */
export const useDocumentShareTokensQuery = (documentId?: number, enabled = true) => {
    return useQuery({
        queryKey: ["document-share-tokens", documentId],
        enabled: !!documentId && enabled,
        queryFn: async () => {
            const res = await callFetchDocumentShareTokens(documentId!);
            return (res.data as IResShareTokenDTO[]) ?? [];
        },
    });
};

/* ===================== CREATE SHARE TOKEN ===================== */
export const useCreateDocumentShareTokenMutation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({
            documentId,
            data,
        }: {
            documentId: number;
            data: Omit<any, "procedureType">;
        }) => {
            const res = await callCreateDocumentShareToken(documentId, data);
            if (!res?.data) throw new Error(res?.message || "Không thể tạo link chia sẻ");
            return res.data as IResShareTokenDTO;
        },
        onSuccess: (_, variables) => {
            notify.created("Tạo link chia sẻ thành công");
            queryClient.invalidateQueries({
                queryKey: ["document-share-tokens", variables.documentId],
            });
        },
        onError: (error: any) => {
            notify.error(error.message || "Lỗi khi tạo link chia sẻ");
        },
    });
};

/* ===================== REVOKE SHARE TOKEN ===================== */
export const useRevokeDocumentShareTokenMutation = (documentId?: number) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (tokenId: number) => {
            const res = await callRevokeDocumentShareToken(tokenId);
            if (res?.statusCode && Number(res.statusCode) >= 400) {
                throw new Error(res?.message || "Thu hồi thất bại");
            }
            return res;
        },
        onSuccess: () => {
            notify.deleted("Thu hồi link chia sẻ thành công");
            queryClient.invalidateQueries({
                queryKey: ["document-share-tokens", documentId],
            });
        },
        onError: (error: any) => {
            notify.error(error.message || "Lỗi khi thu hồi link chia sẻ");
        },
    });
};

/* ===================== GỬI EMAIL SHARE TOKEN ===================== */
export const useSendDocumentShareEmailMutation = () => {
    return useMutation({
        mutationFn: async ({ tokenId, email }: { tokenId: number; email: string }) => {
            const res = await callSendDocumentShareEmail(tokenId, email);
            if (res?.statusCode && Number(res.statusCode) >= 400) {
                throw new Error(res?.message || "Gửi email thất bại");
            }
            return res;
        },
        onSuccess: () => {
            notify.updated("Gửi email thành công!");
        },
        onError: (error: any) => {
            notify.error(error.message || "Lỗi khi gửi email");
        },
    });
};

/* ===================== ACCESS LOGS CỦA SHARE TOKEN ===================== */
export const useDocumentShareTokenAccessLogsQuery = (tokenId?: number, enabled = true) => {
    return useQuery({
        queryKey: ["document-share-token-logs", tokenId],
        enabled: !!tokenId && enabled,
        queryFn: async () => {
            const res = await callFetchDocumentShareTokenAccessLogs(tokenId!);
            return (res.data as any[]) ?? [];
        },
    });
};