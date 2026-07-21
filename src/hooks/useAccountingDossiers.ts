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
    callFetchAccountingDossierDashboardMetrics,
    callFetchAccountingDossierPendingByRole,
    callFetchAccountingDossierReportByStatus,
    callFetchAccountingDossierReportByDepartment,
    callFetchAccountingDossierCategoryActive,
    callFetchAccountingDossierReportByCategory,
    callRejectAccountingDossierTemplateSync,
    callPreviewWorkflow,
    callClaimAccountingDossier,
    callScanSlaOverdue,
    callFetchWorkflowTemplates,
    callCreateWorkflowTemplate,
    callUpdateWorkflowTemplateDraft,
    callValidateWorkflowTemplate,
    callPublishWorkflowTemplate,
    callDeactivateWorkflowTemplate,
    callReactivateWorkflowTemplate,
    callCopyWorkflowTemplateToDraft,
    callFetchDelegations,
    callCreateDelegation,
    callActivateDelegation,
    callRevokeDelegation,
} from "@/config/api";
import type {
    IAccountingDossier,
    IAccountingDossierAuditLog,
    IAccountingDossierRequest,
    IAccountingDossierApprovalStep,
    IModelPaginate,
    IAccountingDossierStorageSummary,
    IAccountingDossierReportRow,
    IAccountingDossierCategory,
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
            notify.success(res?.message || "Tạo bộ chứng từ thành công");
            queryClient.invalidateQueries({ queryKey: [ACCOUNTING_DOSSIERS_KEY], exact: false });
        },
        onError: (error: any) => {
            notify.error(error?.message || "Không thể tạo bộ chứng từ");
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
            notify.error(error?.message || "Không thể cập nhật bộ chứng từ");
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
            notify.error(error?.message || "Không thể xoá bộ chứng từ");
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
            notify.error(error?.message || "Không thể chuyển xử lý bộ chứng từ");
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
            notify.error(error?.message || "Không thể gửi yêu cầu hoàn chứng từ");
        },
    });
};

export const useApproveAccountingDossierMutation = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, note, nextApproverUserId }: { id: number; note?: string; nextApproverUserId?: string }) => {
            const res = await callApproveAccountingDossier(id, note, nextApproverUserId);
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
            notify.error(error?.message || "Không thể phê duyệt bộ chứng từ");
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
            notify.error(error?.message || "Không thể từ chối bộ chứng từ");
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
            notify.error(error?.message || "Không thể chấm dứt bộ chứng từ");
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
            notify.error(error?.message || "Không thể phản hồi yêu cầu hoàn trả");
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
            notify.error(error?.message || "Không thể duyệt hàng loạt");
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
            notify.error(error?.message || "Không thể kiểm tra hàng loạt chứng từ");
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
            notify.error(error?.message || "Không thể lưu trữ bộ chứng từ");
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
            notify.error(error?.message || "Không thể làm mới trạng thái lưu trữ");
        },
    });
};

export const useAccountingDossierStorageSummaryQuery = (companyId?: number) => {
    return useQuery({
        queryKey: ["accounting-dossier-storage-summary", companyId],
        queryFn: async () => {
            const res = await callFetchAccountingDossierStorageSummary(companyId);
            return res?.data as IAccountingDossierStorageSummary;
        },
    });
};

export const useAccountingDossierPendingByRoleQuery = (companyId?: number) => {
    return useQuery({
        queryKey: ["accounting-dossier-pending-by-role", companyId],
        queryFn: async () => {
            const res = await callFetchAccountingDossierPendingByRole(companyId);
            return (res?.data ?? []) as IAccountingDossierReportRow[];
        },
    });
};

export const useAccountingDossierReportByStatusQuery = (companyId?: number) => {
    return useQuery({
        queryKey: ["accounting-dossier-report-by-status", companyId],
        queryFn: async () => {
            const res = await callFetchAccountingDossierReportByStatus(companyId);
            return (res?.data ?? []) as IAccountingDossierReportRow[];
        },
    });
};

export const useAccountingDossierReportByDepartmentQuery = (companyId?: number) => {
    return useQuery({
        queryKey: ["accounting-dossier-report-by-department", companyId],
        queryFn: async () => {
            const res = await callFetchAccountingDossierReportByDepartment(companyId);
            return (res?.data ?? []) as IAccountingDossierReportRow[];
        },
    });
};

export const useAccountingDossierReportByCategoryQuery = (companyId?: number) => {
    return useQuery({
        queryKey: ["accounting-dossier-report-by-category", companyId],
        queryFn: async () => {
            const res = await callFetchAccountingDossierReportByCategory(companyId);
            return (res?.data ?? []) as IAccountingDossierReportRow[];
        },
    });
};

export const useAccountingDossierCategoryActiveQuery = () => {
    return useQuery({
        queryKey: ["accounting-dossier-categories-active"],
        queryFn: async () => {
            const res = await callFetchAccountingDossierCategoryActive();
            if (!res?.data) {
                throw new Error("Không thể lấy danh sách danh mục hoạt động");
            }
            return (res.data ?? []) as IAccountingDossierCategory[];
        },
    });
};

export interface IAccountingDossierDashboardMetrics {
    summary: IAccountingDossierStorageSummary;
    pendingByRole: IAccountingDossierReportRow[];
    byStatus: IAccountingDossierReportRow[];
    byDepartment: IAccountingDossierReportRow[];
    categories: IAccountingDossierCategory[];
}

export const useAccountingDossierDashboardMetricsQuery = (companyId?: number) => {
    return useQuery({
        queryKey: ["accounting-dossier-dashboard-metrics", companyId],
        queryFn: async () => {
            const res = await callFetchAccountingDossierDashboardMetrics(companyId);
            if (!res?.data) {
                throw new Error("Không thể lấy dữ liệu tổng hợp Dashboard");
            }
            return res.data as IAccountingDossierDashboardMetrics;
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
            notify.error(error?.message || "Không thể từ chối đồng bộ mẫu");
        },
    });
};

// --- Accounting Approval Workflow Hooks (Phase 2-5) ---
export const usePreviewWorkflowQuery = (dossierId: number, enabled = true) => {
    return useQuery({
        queryKey: ["accounting-dossier-preview", dossierId],
        queryFn: async () => {
            const res = await callPreviewWorkflow(dossierId);
            return res?.data;
        },
        enabled: enabled && !!dossierId,
        retry: false,
        staleTime: 0,
        refetchOnMount: "always",
        refetchOnWindowFocus: false,
    });
};

export const useClaimAccountingDossierMutation = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: number) => {
            const res = await callClaimAccountingDossier(id);
            if (res?.statusCode && Number(res.statusCode) >= 400) {
                throw new Error(res?.message || "Không thể nhận xử lý");
            }
            return res;
        },
        onSuccess: (res, id) => {
            notify.success(res?.message || "Nhận xử lý bộ chứng từ thành công");
            queryClient.invalidateQueries({ queryKey: [ACCOUNTING_DOSSIERS_KEY], exact: false });
            queryClient.invalidateQueries({ queryKey: ["accounting-dossier", id] });
            queryClient.invalidateQueries({ queryKey: ["accounting-dossier-approval-steps", id] });
        },
        onError: (error: any) => {
            notify.error(error?.message || "Không thể nhận xử lý bộ chứng từ");
        },
    });
};

export const useFetchWorkflowTemplatesQuery = () => {
    return useQuery({
        queryKey: ["accounting-workflow-templates"],
        queryFn: async () => {
            const res = await callFetchWorkflowTemplates();
            return res?.data || [];
        },
    });
};

const getWorkflowMutationError = (error: any, fallback: string) => {
    const message = error?.message;
    const rawMessage = Array.isArray(message)
        ? message.filter(Boolean).join(" · ")
        : typeof message === "string" ? message.trim() : "";

    if (rawMessage.includes("WORKFLOW_AMBIGUOUS")) {
        return rawMessage
            .replace(/\s*\(WORKFLOW_AMBIGUOUS\)\s*/g, "")
            .replace(/\s*\[?WORKFLOW_AMBIGUOUS\]?\s*/g, "");
    }
    return rawMessage || fallback;
};

export const useCreateWorkflowTemplateMutation = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: any) => {
            const res = await callCreateWorkflowTemplate(data);
            if (!res?.data) throw new Error(res?.message || "Không thể tạo mẫu luồng duyệt");
            return res;
        },
        onSuccess: (res) => {
            notify.success(res?.message || "Tạo mẫu luồng duyệt thành công");
            queryClient.invalidateQueries({ queryKey: ["accounting-workflow-templates"] });
        },
        onError: (error: any) => {
            notify.error(getWorkflowMutationError(error, "Không thể tạo mẫu luồng duyệt"));
        },
    });
};

export const useUpdateWorkflowTemplateDraftMutation = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, data }: { id: number; data: any }) => {
            const res = await callUpdateWorkflowTemplateDraft(id, data);
            if (!res?.data) throw new Error(res?.message || "Không thể cập nhật nháp");
            return res;
        },
        onSuccess: (res) => {
            notify.success(res?.message || "Cập nhật bản nháp thành công");
            queryClient.invalidateQueries({ queryKey: ["accounting-workflow-templates"] });
        },
        onError: (error: any) => {
            notify.error(getWorkflowMutationError(error, "Không thể cập nhật bản nháp"));
        },
    });
};

export const usePublishWorkflowTemplateMutation = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: number) => {
            const res = await callPublishWorkflowTemplate(id);
            if (res?.statusCode && Number(res.statusCode) >= 400) {
                throw new Error(res?.message || "Không thể kích hoạt");
            }
            return res;
        },
        onSuccess: (res) => {
            notify.success(res?.message || "Kích hoạt mẫu luồng duyệt thành công");
            queryClient.invalidateQueries({ queryKey: ["accounting-workflow-templates"] });
        },
        onError: (error: any) => {
            notify.error(getWorkflowMutationError(error, "Không thể kích hoạt mẫu luồng duyệt"));
        },
    });
};

export const useDeactivateWorkflowTemplateMutation = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: number) => {
            const res = await callDeactivateWorkflowTemplate(id);
            if (res?.statusCode && Number(res.statusCode) >= 400) {
                throw new Error(res?.message || "Không thể ngưng hiệu lực");
            }
            return res;
        },
        onSuccess: (res) => {
            notify.success(res?.message || "Ngưng hiệu lực mẫu luồng duyệt thành công");
            queryClient.invalidateQueries({ queryKey: ["accounting-workflow-templates"] });
        },
        onError: (error: any) => {
            notify.error(error?.message || "Không thể ngưng hiệu lực mẫu luồng duyệt");
        },
    });
};

export const useReactivateWorkflowTemplateMutation = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: number) => {
            const res = await callReactivateWorkflowTemplate(id);
            if (!res?.data) throw new Error(res?.message || "Không thể kích hoạt lại luồng duyệt");
            return res;
        },
        onSuccess: (res) => {
            notify.success(res?.message || "Kích hoạt lại luồng duyệt thành công");
            queryClient.invalidateQueries({ queryKey: ["accounting-workflow-templates"] });
        },
        onError: (error: any) => {
            notify.error(getWorkflowMutationError(error, "Không thể kích hoạt lại luồng duyệt"));
        },
    });
};

export const useCopyWorkflowTemplateToDraftMutation = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: number) => {
            const res = await callCopyWorkflowTemplateToDraft(id);
            if (!res?.data) throw new Error(res?.message || "Không thể sao chép luồng duyệt");
            return res;
        },
        onSuccess: (res) => {
            notify.success(res?.message || "Đã tạo bản nháp từ luồng duyệt");
            queryClient.invalidateQueries({ queryKey: ["accounting-workflow-templates"] });
        },
        onError: (error: any) => {
            notify.error(getWorkflowMutationError(error, "Không thể sao chép luồng duyệt"));
        },
    });
};

export const useFetchDelegationsQuery = (query: string) => {
    return useQuery({
        queryKey: ["accounting-approval-delegations", query],
        queryFn: async () => {
            const res = await callFetchDelegations(query);
            return res?.data || { result: [], meta: { page: 1, pageSize: 10, pages: 0, total: 0 } };
        },
    });
};

export const useCreateDelegationMutation = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: any) => {
            const res = await callCreateDelegation(data);
            if (!res?.data) throw new Error(res?.message || "Không thể tạo ủy quyền");
            return res;
        },
        onSuccess: (res) => {
            notify.success(res?.message || "Tạo ủy quyền thành công");
            queryClient.invalidateQueries({ queryKey: ["accounting-approval-delegations"] });
        },
        onError: (error: any) => {
            notify.error(error?.message || "Không thể tạo ủy quyền");
        },
    });
};

export const useActivateDelegationMutation = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: number) => {
            const res = await callActivateDelegation(id);
            if (res?.statusCode && Number(res.statusCode) >= 400) {
                throw new Error(res?.message || "Không thể kích hoạt ủy quyền");
            }
            return res;
        },
        onSuccess: (res) => {
            notify.success(res?.message || "Kích hoạt ủy quyền thành công");
            queryClient.invalidateQueries({ queryKey: ["accounting-approval-delegations"] });
        },
        onError: (error: any) => {
            notify.error(error?.message || "Không thể kích hoạt ủy quyền");
        },
    });
};

export const useRevokeDelegationMutation = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: number) => {
            const res = await callRevokeDelegation(id);
            if (res?.statusCode && Number(res.statusCode) >= 400) {
                throw new Error(res?.message || "Không thể thu hồi ủy quyền");
            }
            return res;
        },
        onSuccess: (res) => {
            notify.success(res?.message || "Thu hồi ủy quyền thành công");
            queryClient.invalidateQueries({ queryKey: ["accounting-approval-delegations"] });
        },
        onError: (error: any) => {
            notify.error(error?.message || "Không thể thu hồi ủy quyền");
        },
    });
};
