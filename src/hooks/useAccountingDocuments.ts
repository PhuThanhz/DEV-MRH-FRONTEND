import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    callFetchAccountingDocuments,
    callFetchAccountingDocumentById,
    callCreateAccountingDocument,
    callUpdateAccountingDocument,
    callDeleteAccountingDocument,
    callFetchAccountingFolderTree,
    callCreateAccountingFolder,
    callUpdateAccountingFolder,
    callDeleteAccountingFolder,
    callFetchAccountingDocumentAudits,
    callLockAccountingDocument,
} from "@/config/api";
import type {
    IAccountingDocumentRequest,
    IDocument,
    IModelPaginate,
    IDocumentFolder,
    IDocumentAudit
} from "@/types/backend";
import { notify } from "@/components/common/notification/notify";

/* ===================== FETCH LIST ===================== */
export const useAccountingDocumentsQuery = (query: string) => {
    return useQuery({
        queryKey: ["accounting-documents", query],
        queryFn: async () => {
            const res = await callFetchAccountingDocuments(query);
            if (!res?.data) throw new Error("Không thể lấy danh sách chứng từ kế toán");
            return res.data as IModelPaginate<IDocument>;
        },
    });
};

/* ===================== FETCH BY ID ===================== */
export const useAccountingDocumentByIdQuery = (id?: number) => {
    return useQuery({
        queryKey: ["accounting-document", id],
        enabled: !!id,
        queryFn: async () => {
            if (!id) throw new Error("Thiếu ID chứng từ");
            const res = await callFetchAccountingDocumentById(id);
            if (!res?.data) throw new Error("Không tìm thấy chứng từ");
            return res.data as IDocument;
        },
    });
};

/* ===================== FETCH AUDITS ===================== */
export const useAccountingDocumentAuditsQuery = (id?: number) => {
    return useQuery({
        queryKey: ["accounting-document-audits", id],
        enabled: !!id,
        queryFn: async () => {
            if (!id) throw new Error("Thiếu ID chứng từ");
            const res = await callFetchAccountingDocumentAudits(id);
            if (!res?.data) throw new Error("Không tìm thấy lịch sử");
            return res.data as IDocumentAudit[];
        },
    });
};

/* ===================== CREATE ===================== */
export const useCreateAccountingDocumentMutation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (data: IAccountingDocumentRequest) => {
            const res = await callCreateAccountingDocument(data);
            if (!res?.data) throw new Error(res?.message || "Không thể tạo chứng từ");
            return res;
        },
        onSuccess: (res) => {
            notify.created(res?.message || "Tạo chứng từ thành công");
            queryClient.invalidateQueries({ queryKey: ["accounting-documents"] });
        },
        onError: (error: any) => {
            notify.error(error.message || "Không thể tạo chứng từ");
        },
    });
};

/* ===================== UPDATE ===================== */
export const useUpdateAccountingDocumentMutation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, data }: { id: number; data: IAccountingDocumentRequest }) => {
            const res = await callUpdateAccountingDocument(id, data);
            if (!res?.data) throw new Error(res?.message || "Không thể cập nhật chứng từ");
            return res;
        },
        onSuccess: (res, variables) => {
            notify.updated(res?.message || "Cập nhật chứng từ thành công");
            queryClient.invalidateQueries({ queryKey: ["accounting-documents"] });
            queryClient.invalidateQueries({ queryKey: ["accounting-document", variables.id] });
        },
        onError: (error: any) => {
            notify.error(error.message || "Không thể cập nhật chứng từ");
        },
    });
};

/* ===================== DELETE ===================== */
export const useDeleteAccountingDocumentMutation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: number) => {
            const res = await callDeleteAccountingDocument(id);
            if (res?.statusCode && Number(res.statusCode) >= 400) {
                throw new Error(res?.message || "Không thể xoá chứng từ");
            }
            return res;
        },
        onSuccess: () => {
            notify.deleted("Xoá chứng từ thành công");
            queryClient.invalidateQueries({ queryKey: ["accounting-documents"], exact: false });
        },
        onError: (error: any) => {
            notify.error(error.message || "Không thể xoá chứng từ");
        },
    });
};


/* ===================== LOCK ===================== */
export const useLockAccountingDocumentMutation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, lockStatus }: { id: number; lockStatus: boolean }) => {
            const res = await callLockAccountingDocument(id, lockStatus);
            if (res?.statusCode && Number(res.statusCode) >= 400) {
                throw new Error(res?.message || "Không thể cập nhật trạng thái khoá");
            }
            return res;
        },
        onSuccess: (res, variables) => {
            notify.success(variables.lockStatus ? "Đã khoá chứng từ" : "Đã mở khoá chứng từ");
            queryClient.invalidateQueries({ queryKey: ["accounting-documents"], exact: false });
            queryClient.invalidateQueries({ queryKey: ["accounting-document", variables.id] });
        },
        onError: (error: any) => {
            notify.error(error.message || "Không thể cập nhật trạng thái");
        },
    });
};

/* ===================== FOLDERS ===================== */
export const useAccountingFoldersQuery = (companyId: number) => {
    return useQuery({
        queryKey: ["accounting-folders", companyId],
        enabled: !!companyId,
        queryFn: async () => {
            const res = await callFetchAccountingFolderTree(companyId);
            return res.data as IDocumentFolder[];
        },
    });
};

export const useCreateAccountingFolderMutation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (data: any) => {
            const res = await callCreateAccountingFolder(data);
            if (!res?.data) throw new Error(res?.message || "Không thể tạo thư mục");
            return res;
        },
        onSuccess: () => {
            notify.created("Tạo thư mục thành công");
            queryClient.invalidateQueries({ queryKey: ["accounting-folders"] });
        },
        onError: (error: any) => {
            notify.error(error.message || "Không thể tạo thư mục");
        },
    });
};

export const useUpdateAccountingFolderMutation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, data }: { id: number; data: any }) => {
            const res = await callUpdateAccountingFolder(id, data);
            if (!res?.data) throw new Error(res?.message || "Không thể cập nhật thư mục");
            return res;
        },
        onSuccess: () => {
            notify.updated("Cập nhật thư mục thành công");
            queryClient.invalidateQueries({ queryKey: ["accounting-folders"] });
        },
        onError: (error: any) => {
            notify.error(error.message || "Không thể cập nhật thư mục");
        },
    });
};

export const useDeleteAccountingFolderMutation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: number) => {
            const res = await callDeleteAccountingFolder(id);
            if (res?.statusCode && Number(res.statusCode) >= 400) {
                throw new Error(res?.message || "Không thể xoá thư mục");
            }
            return res;
        },
        onSuccess: () => {
            notify.deleted("Xoá thư mục thành công");
            queryClient.invalidateQueries({ queryKey: ["accounting-folders"], exact: false });
        },
        onError: (error: any) => {
            notify.error(error.message || "Không thể xoá thư mục");
        },
    });
};
