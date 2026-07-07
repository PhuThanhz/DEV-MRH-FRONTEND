import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
    callCreateAccountingDossier,
    callDeleteAccountingDossier,
    callFetchAccountingDossierById,
    callFetchAccountingDossierLogs,
    callFetchAccountingDossiers,
    callFetchDossiersPendingMyApproval,
    callRequestReturnAccountingDossier,
    callSubmitAccountingDossier,
    callUpdateAccountingDossier,
    callApproveAccountingDossier,
    callRejectAccountingDossier,
    callTerminateAccountingDossier,
    callHandleReturnResponseAccountingDossier,
    callFetchAccountingDossierApprovalSteps,
    callBulkApproveAccountingDossiers,
    callBulkCheckDossierDocuments,
    callArchiveAccountingDossier,
    callRefreshExpiredAccountingDossierStorage,
    callFetchAccountingDossierStorageSummary,
    callFetchAccountingDossierPendingByRole,
    callFetchAccountingDossierReportByStatus,
    callFetchAccountingDossierReportByDepartment,
    callFetchAccountingDossierReportByCategory,
    callRejectAccountingDossierTemplateSync,
} from "@/config/api";
import type {
    IAccountingDossier,
    IAccountingDossierAuditLog,
    IAccountingDossierRequest,
    IAccountingDossierApprovalStep,
    IModelPaginate,
    IAccountingDossierStorageSummary,
    IAccountingDossierReportRow,
} from "@/types/backend";
import { notify } from "@/components/common/notification/notify";

const ACCOUNTING_DOSSIERS_KEY = "accounting-dossiers";

export const useAccountingDossiersQuery = (query: string, options?: { enabled?: boolean }) => {
    return useQuery({
        queryKey: [ACCOUNTING_DOSSIERS_KEY, query],
        enabled: options?.enabled ?? true,
        queryFn: async () => {
            const res = await callFetchAccountingDossiers(query);
            if (!res?.data) {
                throw new Error("Không thể lấy danh sách bộ chứng từ kế toán");
            }
            return res.data as IModelPaginate<IAccountingDossier>;
        },
    });
};

export const useAccountingDossiersPendingMyApprovalQuery = (query: string, options?: { enabled?: boolean }) => {
    return useQuery({
        queryKey: ["accounting-dossiers-pending", query],
        enabled: options?.enabled ?? true,
        queryFn: async () => {
            const res = await callFetchDossiersPendingMyApproval(query);
            if (!res?.data) {
                throw new Error("Không thể lấy danh sách bộ chứng từ chờ duyệt");
            }
            return res.data as IModelPaginate<IAccountingDossier>;
        },
    });
};

export const useAccountingDossierByIdQuery = (id?: number) => {
    return useQuery({
        queryKey: ["accounting-dossier", id],
        enabled: !!id,
        queryFn: async () => {
            if (!id) throw new Error("Thiếu ID bộ chứng từ");
            const res = await callFetchAccountingDossierById(id);
            if (!res?.data) throw new Error("Không tìm thấy bộ chứng từ");
            return res.data as IAccountingDossier;
        },
    });
};

export const useAccountingDossierLogsQuery = (id?: number) => {
    return useQuery({
        queryKey: ["accounting-dossier-logs", id],
        enabled: !!id,
        queryFn: async () => {
            if (!id) return [];
            const res = await callFetchAccountingDossierLogs(id);
            return (res?.data ?? []) as IAccountingDossierAuditLog[];
        },
    });
};

export const useCreateAccountingDossierMutation = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: IAccountingDossierRequest) => {
            const res = await callCreateAccountingDossier(data);
            if (!res?.data) throw new Error(res?.message || "Không thể tạo bộ chứng từ");
            return res;
        },
        onSuccess: (res) => {
            notify.created(res?.message || "Tạo bộ chứng từ thành công");
            queryClient.invalidateQueries({ queryKey: [ACCOUNTING_DOSSIERS_KEY], exact: false });
        },
        onError: (error: any) => {
            notify.error(error?.message || "Lỗi khi tạo bộ chứng từ");
        },
    });
};

export const useUpdateAccountingDossierMutation = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, data }: { id: number; data: IAccountingDossierRequest }) => {
            const res = await callUpdateAccountingDossier(id, data);
            if (!res?.data) throw new Error(res?.message || "Không thể cập nhật bộ chứng từ");
            return res;
        },
        onSuccess: (res, variables) => {
            notify.updated(res?.message || "Cập nhật bộ chứng từ thành công");
            queryClient.invalidateQueries({ queryKey: [ACCOUNTING_DOSSIERS_KEY], exact: false });
            queryClient.invalidateQueries({ queryKey: ["accounting-dossier", variables.id] });
        },
        onError: (error: any) => {
            notify.error(error?.message || "Lỗi khi cập nhật bộ chứng từ");
        },
    });
};

export const useDeleteAccountingDossierMutation = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: number) => {
            const res = await callDeleteAccountingDossier(id);
            if (res?.statusCode && Number(res.statusCode) >= 400) {
                throw new Error(res?.message || "Không thể xoá bộ chứng từ");
            }
            return res;
        },
        onSuccess: () => {
            notify.deleted("Xoá bộ chứng từ thành công");
            queryClient.invalidateQueries({ queryKey: [ACCOUNTING_DOSSIERS_KEY], exact: false });
        },
        onError: (error: any) => {
            notify.error(error?.message || "Lỗi khi xoá bộ chứng từ");
        },
    });
};

export const useSubmitAccountingDossierMutation = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (variables: { id: number; customSteps?: any[] }) => {
            const res = await callSubmitAccountingDossier(variables.id, { customSteps: variables.customSteps });
            if (!res?.data) throw new Error(res?.message || "Không thể chuyển xử lý bộ chứng từ");
            return res;
        },
        onSuccess: (res, variables) => {
            notify.success(res?.message || "Chuyển xử lý bộ chứng từ thành công");
            queryClient.invalidateQueries({ queryKey: [ACCOUNTING_DOSSIERS_KEY], exact: false });
            queryClient.invalidateQueries({ queryKey: ["accounting-dossier", variables.id] });
        },
        onError: (error: any) => {
            notify.error(error?.message || "Lỗi khi chuyển xử lý bộ chứng từ");
        },
    });
};

export const useRequestReturnAccountingDossierMutation = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, note }: { id: number; note?: string }) => {
            const res = await callRequestReturnAccountingDossier(id, note);
            if (!res?.data) throw new Error(res?.message || "Không thể gửi yêu cầu hoàn chứng từ");
            return res;
        },
        onSuccess: (res, variables) => {
            notify.success(res?.message || "Đã gửi yêu cầu hoàn chứng từ");
            queryClient.invalidateQueries({ queryKey: [ACCOUNTING_DOSSIERS_KEY], exact: false });
            queryClient.invalidateQueries({ queryKey: ["accounting-dossier", variables.id] });
            queryClient.invalidateQueries({ queryKey: ["accounting-dossier-logs", variables.id] });
        },
        onError: (error: any) => {
            notify.error(error?.message || "Lỗi khi gửi yêu cầu hoàn chứng từ");
        },
    });
};

export const useApproveAccountingDossierMutation = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, note }: { id: number; note?: string }) => {
            const res = await callApproveAccountingDossier(id, note);
            if (!res?.data) throw new Error(res?.message || "Không thể phê duyệt bộ chứng từ");
            return res;
        },
        onSuccess: (res, variables) => {
            notify.success("Phê duyệt bộ chứng từ thành công");
            queryClient.invalidateQueries({ queryKey: [ACCOUNTING_DOSSIERS_KEY], exact: false });
            queryClient.invalidateQueries({ queryKey: ["accounting-dossier", variables.id] });
            queryClient.invalidateQueries({ queryKey: ["accounting-dossier-approval-steps", variables.id] });
            queryClient.invalidateQueries({ queryKey: ["accounting-dossier-logs", variables.id] });
        },
        onError: (error: any) => {
            notify.error(error?.message || "Lỗi khi phê duyệt bộ chứng từ");
        },
    });
};

export const useRejectAccountingDossierMutation = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, note }: { id: number; note: string }) => {
            const res = await callRejectAccountingDossier(id, note);
            if (!res?.data) throw new Error(res?.message || "Không thể từ chối bộ chứng từ");
            return res;
        },
        onSuccess: (res, variables) => {
            notify.success("Từ chối bộ chứng từ thành công");
            queryClient.invalidateQueries({ queryKey: [ACCOUNTING_DOSSIERS_KEY], exact: false });
            queryClient.invalidateQueries({ queryKey: ["accounting-dossier", variables.id] });
            queryClient.invalidateQueries({ queryKey: ["accounting-dossier-approval-steps", variables.id] });
            queryClient.invalidateQueries({ queryKey: ["accounting-dossier-logs", variables.id] });
        },
        onError: (error: any) => {
            notify.error(error?.message || "Lỗi khi từ chối bộ chứng từ");
        },
    });
};

export const useTerminateAccountingDossierMutation = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, note }: { id: number; note: string }) => {
            const res = await callTerminateAccountingDossier(id, note);
            if (!res?.data) throw new Error(res?.message || "Không thể chấm dứt bộ chứng từ");
            return res;
        },
        onSuccess: (res, variables) => {
            notify.success("Chấm dứt bộ chứng từ thành công");
            queryClient.invalidateQueries({ queryKey: [ACCOUNTING_DOSSIERS_KEY], exact: false });
            queryClient.invalidateQueries({ queryKey: ["accounting-dossier", variables.id] });
            queryClient.invalidateQueries({ queryKey: ["accounting-dossier-approval-steps", variables.id] });
            queryClient.invalidateQueries({ queryKey: ["accounting-dossier-logs", variables.id] });
        },
        onError: (error: any) => {
            notify.error(error?.message || "Lỗi khi chấm dứt bộ chứng từ");
        },
    });
};

export const useHandleReturnResponseAccountingDossierMutation = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, action, note }: { id: number; action: string; note?: string }) => {
            const res = await callHandleReturnResponseAccountingDossier(id, action, note);
            if (!res?.data) throw new Error(res?.message || "Không thể phản hồi yêu cầu hoàn trả");
            return res;
        },
        onSuccess: (res, variables) => {
            notify.success("Phản hồi yêu cầu hoàn trả thành công");
            queryClient.invalidateQueries({ queryKey: [ACCOUNTING_DOSSIERS_KEY], exact: false });
            queryClient.invalidateQueries({ queryKey: ["accounting-dossier", variables.id] });
            queryClient.invalidateQueries({ queryKey: ["accounting-dossier-approval-steps", variables.id] });
            queryClient.invalidateQueries({ queryKey: ["accounting-dossier-logs", variables.id] });
        },
        onError: (error: any) => {
            notify.error(error?.message || "Lỗi khi phản hồi yêu cầu hoàn trả");
        },
    });
};

export const useAccountingDossierApprovalStepsQuery = (id?: number) => {
    return useQuery({
        queryKey: ["accounting-dossier-approval-steps", id],
        enabled: !!id,
        queryFn: async () => {
            if (!id) return [];
            const res = await callFetchAccountingDossierApprovalSteps(id);
            return (res?.data ?? []) as IAccountingDossierApprovalStep[];
        },
    });
};

export const useBulkApproveAccountingDossiersMutation = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (variables: { ids: number[]; note?: string }) => {
            const res = await callBulkApproveAccountingDossiers(variables.ids, variables.note);
            if (!res?.data) throw new Error(res?.message || "Lỗi duyệt hàng loạt");
            return res;
        },
        onSuccess: () => {
            notify.success("Duyệt hàng loạt thành công");
            queryClient.invalidateQueries({ queryKey: [ACCOUNTING_DOSSIERS_KEY], exact: false });
        },
        onError: (error: any) => {
            notify.error(error?.message || "Lỗi khi duyệt hàng loạt");
        },
    });
};

export const useBulkCheckDossierDocumentsMutation = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (variables: {
            dossierId: number;
            documentIds: number[];
            checkStatus: string;
            note?: string;
        }) => {
            await callBulkCheckDossierDocuments(
                variables.dossierId,
                variables.documentIds,
                variables.checkStatus,
                variables.note
            );
        },
        onSuccess: (_, variables) => {
            notify.success("Cập nhật trạng thái chứng từ thành công");
            queryClient.invalidateQueries({ queryKey: ["dossier-documents", variables.dossierId] });
        },
        onError: (error: any) => {
            notify.error(error?.message || "Lỗi khi kiểm tra hàng loạt chứng từ");
        },
    });
};

export const useArchiveAccountingDossierMutation = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, note }: { id: number; note?: string }) => {
            const res = await callArchiveAccountingDossier(id, note);
            if (!res?.data) throw new Error(res?.message || "Không thể lưu trữ bộ chứng từ");
            return res;
        },
        onSuccess: (res, variables) => {
            notify.success(res?.message || "Lưu trữ bộ chứng từ thành công");
            queryClient.invalidateQueries({ queryKey: [ACCOUNTING_DOSSIERS_KEY], exact: false });
            queryClient.invalidateQueries({ queryKey: ["accounting-dossier", variables.id] });
        },
        onError: (error: any) => {
            notify.error(error?.message || "Lỗi khi lưu trữ bộ chứng từ");
        },
    });
};

export const useRefreshExpiredAccountingDossierStorageMutation = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async () => {
            const res = await callRefreshExpiredAccountingDossierStorage();
            if (res?.statusCode && Number(res.statusCode) >= 400) {
                throw new Error(res?.message || "Không thể làm mới trạng thái lưu trữ");
            }
            return res;
        },
        onSuccess: (res) => {
            notify.success(`Đã cập nhật ${res?.data || 0} bộ chứng từ hết hạn lưu trữ`);
            queryClient.invalidateQueries({ queryKey: [ACCOUNTING_DOSSIERS_KEY], exact: false });
            queryClient.invalidateQueries({ queryKey: ["accounting-dossier-storage-summary"] });
        },
        onError: (error: any) => {
            notify.error(error?.message || "Lỗi khi làm mới trạng thái lưu trữ");
        },
    });
};

export const useAccountingDossierStorageSummaryQuery = () => {
    return useQuery({
        queryKey: ["accounting-dossier-storage-summary"],
        queryFn: async () => {
            const res = await callFetchAccountingDossierStorageSummary();
            return res?.data as IAccountingDossierStorageSummary;
        },
    });
};

export const useAccountingDossierPendingByRoleQuery = () => {
    return useQuery({
        queryKey: ["accounting-dossier-pending-by-role"],
        queryFn: async () => {
            const res = await callFetchAccountingDossierPendingByRole();
            return (res?.data ?? []) as IAccountingDossierReportRow[];
        },
    });
};

export const useAccountingDossierReportByStatusQuery = () => {
    return useQuery({
        queryKey: ["accounting-dossier-report-by-status"],
        queryFn: async () => {
            const res = await callFetchAccountingDossierReportByStatus();
            return (res?.data ?? []) as IAccountingDossierReportRow[];
        },
    });
};

export const useAccountingDossierReportByDepartmentQuery = () => {
    return useQuery({
        queryKey: ["accounting-dossier-report-by-department"],
        queryFn: async () => {
            const res = await callFetchAccountingDossierReportByDepartment();
            return (res?.data ?? []) as IAccountingDossierReportRow[];
        },
    });
};

export const useAccountingDossierReportByCategoryQuery = () => {
    return useQuery({
        queryKey: ["accounting-dossier-report-by-category"],
        queryFn: async () => {
            const res = await callFetchAccountingDossierReportByCategory();
            return (res?.data ?? []) as IAccountingDossierReportRow[];
        },
    });
};

export const useRejectAccountingDossierTemplateSyncMutation = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, note }: { id: number; note?: string }) => {
            const res = await callRejectAccountingDossierTemplateSync(id, note);
            if (!res?.data) throw new Error(res?.message || "Không thể từ chối đồng bộ mẫu");
            return res;
        },
        onSuccess: (res, variables) => {
            notify.success(res?.message || "Từ chối đồng bộ mẫu thành công");
            queryClient.invalidateQueries({ queryKey: [ACCOUNTING_DOSSIERS_KEY], exact: false });
            queryClient.invalidateQueries({ queryKey: ["accounting-dossier", variables.id] });
        },
        onError: (error: any) => {
            notify.error(error?.message || "Lỗi khi từ chối đồng bộ mẫu");
        },
    });
};
