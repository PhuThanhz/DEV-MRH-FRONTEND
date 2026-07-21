import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
    callCheckDossierDocument,
    callFetchAllDossierDocuments,
    callFetchAccountingDossiers,
    callFetchDossierDocuments,
    callAddDossierDocument,
    callUpdateDossierDocument,
    callDeleteDossierDocument,
} from "@/config/api";
import type {
    IAccountingDossier,
    IAccountingDossierDocument,
    IAccountingDossierDocumentCheckRequest,
    IAccountingDossierDocumentRequest,
    IModelPaginate,
} from "@/types/backend";
import { notify } from "@/components/common/notification/notify";

const DOSSIER_DOCS_KEY = "dossier-documents";
const ALL_ACCOUNTING_DOSSIER_DOCS_KEY = "accounting-dossier-documents";
const FALLBACK_DOCUMENT_FETCH_CONCURRENCY = 8;

const sortByNewestDocument = (a: IAccountingDossierDocument, b: IAccountingDossierDocument) => {
    const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    if (dateA !== dateB) return dateB - dateA;
    return Number(b.id || 0) - Number(a.id || 0);
};

/** Giữ phương án dự phòng không tạo hàng trăm request cùng lúc khi endpoint tổng hợp lỗi. */
const mapWithConcurrency = async <T, R>(
    items: T[],
    worker: (item: T) => Promise<R>,
    limit = FALLBACK_DOCUMENT_FETCH_CONCURRENCY,
): Promise<R[]> => {
    const results = new Array<R>(items.length);
    let nextIndex = 0;
    const workerCount = Math.min(limit, items.length);

    await Promise.all(Array.from({ length: workerCount }, async () => {
        while (nextIndex < items.length) {
            const index = nextIndex++;
            results[index] = await worker(items[index]);
        }
    }));

    return results;
};

export const useDossierDocumentsQuery = (dossierId?: number) => {
    return useQuery({
        queryKey: [DOSSIER_DOCS_KEY, dossierId],
        enabled: !!dossierId,
        queryFn: async () => {
            if (!dossierId) return [];
            const res = await callFetchDossierDocuments(dossierId);
            return [...((res?.data ?? []) as IAccountingDossierDocument[])].sort(sortByNewestDocument);
        },
    });
};

export const useAllDossierDocumentsQuery = (query: string) => {
    return useQuery({
        queryKey: [ALL_ACCOUNTING_DOSSIER_DOCS_KEY, query],
        queryFn: async () => {
            try {
                const res = await callFetchAllDossierDocuments(query);
                if (!res?.data) throw new Error("Không thể lấy danh sách chứng từ con");
                return res.data as IModelPaginate<IAccountingDossierDocument>;
            } catch (error) {
                return fetchDossierDocumentsFallback(query);
            }
        },
    });
};

const fetchDossierDocumentsFallback = async (query: string): Promise<IModelPaginate<IAccountingDossierDocument>> => {
    const params = new URLSearchParams(query);
    const current = Number(params.get("current") || "1");
    const pageSize = Number(params.get("pageSize") || "10");
    const keyword = (params.get("keyword") || "").trim().toLowerCase();
    const dossierCode = (params.get("dossierCode") || "").trim().toLowerCase();
    const fileStatus = (params.get("fileStatus") || "ALL").toUpperCase();
    const filter = params.get("filter") || "";
    const companyId = Number(params.get("dossier.company.id") || "") || undefined;
    const departmentId = Number(params.get("dossier.department.id") || "") || undefined;
    const categoryId = Number(params.get("accountingCategory.id") || "") || undefined;
    const createdFrom = params.get("createdAt>=");
    const createdTo = params.get("createdAt<=");

    const dossierRes = await callFetchAccountingDossiers("current=1&pageSize=200");
    const dossiers = (dossierRes?.data?.result || []) as IAccountingDossier[];
    const onlyCompletedDossiers = filter.includes("dossier.status='APPROVED'") || filter.includes("dossier.status='ARCHIVED'");
    const eligibleDossiers = dossiers
        .filter((dossier) => !companyId || dossier.company?.id === companyId)
        .filter((dossier) => !departmentId || dossier.department?.id === departmentId)
        .filter((dossier) => !onlyCompletedDossiers || dossier.status === "APPROVED" || dossier.status === "ARCHIVED")
        .filter((dossier) => !dossierCode || dossier.dossierCode?.toLowerCase().includes(dossierCode));
    const docGroups = await mapWithConcurrency(
        eligibleDossiers,
        async (dossier) => {
                if (!dossier.id) return [];
                try {
                    const res = await callFetchDossierDocuments(dossier.id);
                    return ((res?.data || []) as IAccountingDossierDocument[]).map((doc) => ({
                        ...doc,
                        dossierId: dossier.id,
                        dossierCode: dossier.dossierCode || undefined,
                        dossierContent: dossier.content,
                        dossierStatus: dossier.status,
                        dossierStorageStatus: dossier.storageStatus,
                        company: dossier.company,
                        department: dossier.department,
                        section: dossier.section,
                    }));
                } catch {
                    return [];
                }
        },
    );

    const allDocs = docGroups
        .flat()
        .filter((doc) => doc.active !== false)
        .filter((doc) => !categoryId || doc.accountingCategory?.id === categoryId)
        .filter((doc) => {
            const createdAt = doc.createdAt ? new Date(doc.createdAt).getTime() : undefined;
            if (createdFrom && createdAt && createdAt < new Date(createdFrom).getTime()) return false;
            if (createdTo && createdAt && createdAt > new Date(createdTo).getTime()) return false;
            return true;
        })
        .filter((doc) => {
            if (fileStatus === "HAS_FILE") {
                return Boolean(doc.fileUrl || doc.externalLink || doc.document?.id);
            }
            if (fileStatus === "MISSING_FILE") {
                return !doc.fileUrl && !doc.externalLink && !doc.document?.id;
            }
            return true;
        })
        .filter((doc) => {
            if (!keyword) return true;
            return [
                doc.documentName,
                doc.documentType,
                doc.createdBy,
                doc.dossierCode,
                doc.dossierContent,
                doc.invoiceNumber,
                doc.invoiceContent,
                doc.partnerName,
                doc.document?.documentCode,
                doc.company?.name,
                doc.department?.name,
                doc.accountingCategory?.categoryName,
                doc.accountingCategory?.categoryCode,
                doc.accountingCategory?.symbol,
            ]
                .filter(Boolean)
                .some((value) => String(value).toLowerCase().includes(keyword));
        });

    const sortedDocs = allDocs.sort(sortByNewestDocument);
    const start = (current - 1) * pageSize;
    const pageItems = sortedDocs.slice(start, start + pageSize);
    return {
        meta: {
            page: current,
            pageSize,
            pages: Math.ceil(allDocs.length / pageSize),
            total: allDocs.length,
        },
        result: pageItems,
    };
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
            queryClient.invalidateQueries({ queryKey: [ALL_ACCOUNTING_DOSSIER_DOCS_KEY], exact: false });
        },
        onError: (error: any) => {
            if (error?.error === "DUPLICATE_INVOICE_WARNING") {
                return;
            }
            notify.error(error?.message || "Không thể thêm chứng từ con");
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
            queryClient.invalidateQueries({ queryKey: [ALL_ACCOUNTING_DOSSIER_DOCS_KEY], exact: false });
        },
        onError: (error: any) => {
            if (error?.error === "DUPLICATE_INVOICE_WARNING") {
                return;
            }
            notify.error(error?.message || "Không thể cập nhật chứng từ con");
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
            queryClient.invalidateQueries({ queryKey: [ALL_ACCOUNTING_DOSSIER_DOCS_KEY], exact: false });
        },
        onError: (error: any) => {
            notify.error(error?.message || "Không thể xoá chứng từ con");
        },
    });
};

export const useCheckDossierDocumentMutation = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({
            dossierId,
            docId,
            data,
        }: {
            dossierId: number;
            docId: number;
            data: IAccountingDossierDocumentCheckRequest;
        }) => {
            const res = await callCheckDossierDocument(dossierId, docId, data);
            if (!res?.data) throw new Error(res?.message || "Không thể cập nhật trạng thái kiểm tra");
            return res;
        },
        onSuccess: (res, variables) => {
            notify.updated(res?.message || "Cập nhật trạng thái kiểm tra thành công");
            queryClient.invalidateQueries({ queryKey: [DOSSIER_DOCS_KEY, variables.dossierId] });
            queryClient.invalidateQueries({ queryKey: [ALL_ACCOUNTING_DOSSIER_DOCS_KEY], exact: false });
            queryClient.invalidateQueries({ queryKey: ["accounting-dossier", variables.dossierId] });
            queryClient.invalidateQueries({ queryKey: ["accounting-dossier-logs", variables.dossierId] });
        },
        onError: (error: any) => {
            notify.error(error?.message || "Không thể cập nhật trạng thái kiểm tra");
        },
    });
};
