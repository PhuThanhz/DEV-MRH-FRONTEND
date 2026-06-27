import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
    callFetchDossierDocuments,
    callAddDossierDocument,
    callUpdateDossierDocument,
    callDeleteDossierDocument,
} from "@/config/api";
import type { IAccountingDossierDocument, IAccountingDossierDocumentRequest } from "@/types/backend";
import { notify } from "@/components/common/notification/notify";

const DOSSIER_DOCS_KEY = "dossier-documents";

export const useDossierDocumentsQuery = (dossierId?: number) => {
    return useQuery({
        queryKey: [DOSSIER_DOCS_KEY, dossierId],
        enabled: !!dossierId,
        queryFn: async () => {
            if (!dossierId) return [];
            const res = await callFetchDossierDocuments(dossierId);
            return (res?.data ?? []) as IAccountingDossierDocument[];
        },
    });
};

export const useAddDossierDocumentMutation = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ dossierId, data }: { dossierId: number; data: IAccountingDossierDocumentRequest }) => {
            const res = await callAddDossierDocument(dossierId, data);
            if (!res?.data) throw new Error(res?.message || "Không thể thêm chứng từ con");
            return res;
        },
        onSuccess: (res, variables) => {
            notify.created(res?.message || "Thêm chứng từ con thành công");
            queryClient.invalidateQueries({ queryKey: [DOSSIER_DOCS_KEY, variables.dossierId] });
        },
        onError: (error: any) => {
            notify.error(error?.message || "Lỗi khi thêm chứng từ con");
        },
    });
};

export const useUpdateDossierDocumentMutation = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ dossierId, docId, data }: { dossierId: number; docId: number; data: IAccountingDossierDocumentRequest }) => {
            const res = await callUpdateDossierDocument(dossierId, docId, data);
            if (!res?.data) throw new Error(res?.message || "Không thể cập nhật chứng từ con");
            return res;
        },
        onSuccess: (res, variables) => {
            notify.updated(res?.message || "Cập nhật chứng từ con thành công");
            queryClient.invalidateQueries({ queryKey: [DOSSIER_DOCS_KEY, variables.dossierId] });
        },
        onError: (error: any) => {
            notify.error(error?.message || "Lỗi khi cập nhật chứng từ con");
        },
    });
};

export const useDeleteDossierDocumentMutation = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ dossierId, docId }: { dossierId: number; docId: number }) => {
            const res = await callDeleteDossierDocument(dossierId, docId);
            if (res?.statusCode && Number(res.statusCode) >= 400) {
                throw new Error(res?.message || "Không thể xoá chứng từ con");
            }
            return { dossierId };
        },
        onSuccess: (data) => {
            notify.deleted("Xoá chứng từ con thành công");
            queryClient.invalidateQueries({ queryKey: [DOSSIER_DOCS_KEY, data.dossierId] });
        },
        onError: (error: any) => {
            notify.error(error?.message || "Lỗi khi xoá chứng từ con");
        },
    });
};
