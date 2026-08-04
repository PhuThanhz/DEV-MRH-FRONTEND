import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type {
    IEvaluationRecord,
    IResScoreDTO,
    IResCommentDTO,
    IResTrainingPlanDTO,
    IEvaluationHistory,
    IBatchApproveResponse,
    IModelPaginate,
    IPeriodProgress,
    IManagerDashboard,
    IApproverDashboard,
    IEvaluationTemplate,
    IEvaluationPeriod,
} from "@/types/backend";
import {
    callFetchEvaluationRecordById,
    callFetchMyEvaluationRecords,
    callFetchAllEvaluationRecords,
    callFetchEvaluationTaskCounts,
    callFetchManagerRecords,
    callFetchPendingManagerRecords,
    callFetchApprovalRecords,
    callFetchPendingApprovalRecords,
    callEmployeeSaveScore,
    callEmployeeSubmitRecord,
    callEmployeeSaveSelfReview,
    callManagerSaveScore,
    callManagerSubmitRecord,
    callManagerSaveFeedback,
    callSaveTrainingPlan,
    callApproverSaveScore,
    callApproveRecord,
    callRejectRecord,
    callBatchApproveRecords,
    callExtendEvaluationRecordDeadline,
    callReassignEvaluators,
    callFetchCompletedSummary,
    callEmployeeConfirmRecord,
    callFetchRecordHistory,
    callFetchPeriodProgress,
    callFetchManagerDashboard,
    callFetchApproverDashboard,
    callFetchEvaluationPeriods,
    callActivateEvaluationPeriod,
    callCloseEvaluationPeriod,
    callAdjustEvaluationPeriodStartDate,
    callFetchTemplatesInPeriod,
    callAddTemplateToPeriod,
    callRemoveTemplateFromPeriod,
    callFetchEmployeesInPeriod,
    callAddEmployeeToPeriod,
    callCancelPeriodEmployee,
    callFetchEvaluationTemplateById,
    callCreateTemplateSection,
    callUpdateTemplateSection,
    callDeleteTemplateSection,
    callCreateTemplateCriteria,
    callUpdateTemplateCriteria,
    callDeleteTemplateCriteria,
    callCreateCriteriaLevel,
    callUpdateCriteriaLevel,
    callPublishEvaluationTemplate,
    callFetchEvaluationTemplates,
    callFetchEvaluationPeriodById,
    callFetchEvaluationGradeDistribution,
    callCreateEvaluationTemplate,
    callUpdateEvaluationTemplate,
    callCreateEvaluationPeriod,
    callUpdateEvaluationPeriod,
} from "@/config/api";
import { notify } from "@/components/common/notification/notify";

type EvaluationTemplateMutationPayload = Pick<
    IEvaluationTemplate,
    "name" | "type" | "description" | "status"
> & {
    company: { id: number };
    targetJobTitles?: { id: number }[];
};

type EvaluationPeriodMutationPayload = Pick<IEvaluationPeriod, "name" | "description"> & {
    employeeStartDate?: string | null;
    employeeDeadline?: string | null;
    managerDeadline?: string | null;
    approvalDeadline?: string | null;
    company: { id: number };
};

// ═══════════════════════════════════════════════════════════════════════════
// QUERIES
// ═══════════════════════════════════════════════════════════════════════════

export const usePeriodProgressQuery = (periodId: number) => {
    return useQuery({
        queryKey: ["period-progress", periodId],
        queryFn: async () => {
            const res = await callFetchPeriodProgress(periodId);
            if (!res?.data) throw new Error("Không lấy được tiến độ kỳ đánh giá");
            return res.data;
        },
        enabled: !!periodId,
    });
};

export const useManagerDashboardQuery = (periodId?: number, enabled = true) => {
    return useQuery({
        queryKey: ["manager-dashboard", periodId ?? null],
        queryFn: async () => {
            const res = await callFetchManagerDashboard(periodId);
            if (!res?.data) throw new Error("Không lấy được dashboard quản lý");
            return res.data as IManagerDashboard;
        },
        enabled,
    });
};

export const useApproverDashboardQuery = (periodId?: number, enabled = true) => {
    return useQuery({
        queryKey: ["approver-dashboard", periodId ?? null],
        queryFn: async () => {
            const res = await callFetchApproverDashboard(periodId);
            if (!res?.data) throw new Error("Không lấy được dashboard người phê duyệt");
            return res.data as IApproverDashboard;
        },
        enabled,
    });
};

export const useEvaluationRecordQuery = (id: number) => {
    return useQuery({
        queryKey: ["evaluation-record", id],
        queryFn: async () => {
            const res = await callFetchEvaluationRecordById(id);
            if (!res?.data) throw new Error("Không lấy được dữ liệu bản đánh giá");
            return res.data;
        },
        enabled: !!id,
        staleTime: 5 * 60 * 1000,
        refetchOnWindowFocus: false,
    });
};

export const useMyEvaluationRecordsQuery = (enabled = true) => {
    return useQuery({
        queryKey: ["my-evaluation-records"],
        queryFn: async () => {
            const res = await callFetchMyEvaluationRecords();
            return res?.data || [];
        },
        enabled,
    });
};

export const useAllEvaluationRecordsQuery = (enabled = true) => {
    return useQuery({
        queryKey: ["all-evaluation-records"],
        queryFn: async () => {
            const res = await callFetchAllEvaluationRecords();
            return res?.data || [];
        },
        enabled,
        staleTime: 30 * 1000,
    });
};

export const useEvaluationTaskCountsQuery = (enabled = true) => {
    return useQuery({
        queryKey: ["evaluation-task-counts"],
        queryFn: async () => {
            const res = await callFetchEvaluationTaskCounts();
            return res?.data;
        },
        enabled,
        staleTime: 30 * 1000,
    });
};

export const useManagerRecordsQuery = (enabled = true) => {
    return useQuery({
        queryKey: ["manager-evaluation-records"],
        queryFn: async () => {
            const res = await callFetchManagerRecords();
            return res?.data || [];
        },
        enabled,
        staleTime: 30 * 1000,
    });
};

export const usePendingManagerRecordsQuery = (enabled = true) => {
    return useQuery({
        queryKey: ["pending-manager-evaluation-records"],
        queryFn: async () => {
            const res = await callFetchPendingManagerRecords();
            return res?.data || [];
        },
        enabled,
        staleTime: 30 * 1000,
    });
};

export const useApprovalRecordsQuery = (enabled = true) => {
    return useQuery({
        queryKey: ["approval-evaluation-records"],
        queryFn: async () => {
            const res = await callFetchApprovalRecords();
            return res?.data || [];
        },
        enabled,
        staleTime: 30 * 1000,
    });
};

export const usePendingApprovalRecordsQuery = (enabled = true) => {
    return useQuery({
        queryKey: ["pending-approval-evaluation-records"],
        queryFn: async () => {
            const res = await callFetchPendingApprovalRecords();
            return res?.data || [];
        },
        enabled,
        staleTime: 30 * 1000,
    });
};

export const useCompletedSummaryQuery = (
    periodId?: number,
    departmentId?: number,
    companyId?: number,
    sectionId?: number,
    page: number = 1,
    size: number = 15,
    searchText?: string,
    filterGrade?: string
) => {
    return useQuery({
        queryKey: ["evaluation-completed-summary", periodId, departmentId, companyId, sectionId, page, size, searchText, filterGrade],
        queryFn: async () => {
            const res = await callFetchCompletedSummary(periodId, departmentId, companyId, sectionId, page, size, searchText, filterGrade);
            if (!res?.data) throw new Error("Không tải được tổng hợp kết quả");
            return res.data;
        },
    });
};

export const useEvaluationPeriodsQuery = (query: string = "") => {
    return useQuery({
        queryKey: ["evaluation-periods", query],
        queryFn: async () => {
            const res = await callFetchEvaluationPeriods(query);
            return res?.data;
        },
    });
};

export const useEvaluationPeriodDetailQuery = (periodId: number) => {
    return useQuery({
        queryKey: ["evaluation-period", periodId],
        queryFn: async () => {
            const res = await callFetchEvaluationPeriodById(periodId);
            if (!res?.data) throw new Error("Không tải được thông tin kỳ đánh giá");
            return res.data;
        },
        enabled: !!periodId,
    });
};

export const useGradeDistributionQuery = (periodId: number) => {
    return useQuery({
        queryKey: ["evaluation-grade-distribution", periodId],
        queryFn: async () => {
            const res = await callFetchEvaluationGradeDistribution(periodId);
            return res?.data || [];
        },
        enabled: !!periodId,
    });
};

export const useEvaluationRecordHistoryQuery = (recordId: number) => {
    return useQuery({
        queryKey: ["evaluation-record-history", recordId],
        queryFn: async () => {
            const res = await callFetchRecordHistory(recordId);
            return res?.data || [];
        },
        enabled: !!recordId,
    });
};

// ═══════════════════════════════════════════════════════════════════════════
// MUTATIONS
// ═══════════════════════════════════════════════════════════════════════════

export const useEmployeeSaveScoreMutation = () => {
    return useMutation({
        mutationFn: (variables: { recordId: number; criteriaId: number; score: number }) =>
            callEmployeeSaveScore(variables.recordId, variables.criteriaId, variables.score),
    });
};

export const useEmployeeSubmitMutation = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (recordId: number) => callEmployeeSubmitRecord(recordId),
        onSuccess: (_, recordId) => {
            notify.success("Nộp bản tự đánh giá thành công.");
            qc.invalidateQueries({ queryKey: ["evaluation-record", recordId] });
            qc.invalidateQueries({ queryKey: ["my-evaluation-records"] });
            qc.invalidateQueries({ queryKey: ["all-evaluation-records"] });
            qc.invalidateQueries({ queryKey: ["evaluation-task-counts"] });
        },
    });
};

export const useEmployeeSaveSelfReviewMutation = () => {
    return useMutation({
        mutationFn: (variables: { recordId: number; content: string }) =>
            callEmployeeSaveSelfReview(variables.recordId, variables.content),
    });
};

export const useManagerSaveScoreMutation = () => {
    return useMutation({
        mutationFn: (variables: { recordId: number; criteriaId: number; score: number }) =>
            callManagerSaveScore(variables.recordId, variables.criteriaId, variables.score),
    });
};

export const useManagerSubmitMutation = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (recordId: number) => callManagerSubmitRecord(recordId),
        onSuccess: (_, recordId) => {
            notify.success("Đã gửi bản đánh giá lên bước quản lý gián tiếp duyệt.");
            qc.invalidateQueries({ queryKey: ["evaluation-record", recordId] });
            qc.invalidateQueries({ queryKey: ["pending-manager-evaluation-records"] });
            qc.invalidateQueries({ queryKey: ["manager-evaluation-records"] });
            qc.invalidateQueries({ queryKey: ["all-evaluation-records"] });
            qc.invalidateQueries({ queryKey: ["evaluation-task-counts"] });
        },
    });
};

export const useManagerSaveFeedbackMutation = () => {
    return useMutation({
        mutationFn: (variables: { recordId: number; content: string }) =>
            callManagerSaveFeedback(variables.recordId, variables.content),
    });
};

export const useSaveTrainingPlanMutation = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (variables: { recordId: number; data: any }) =>
            callSaveTrainingPlan(variables.recordId, variables.data),
        onSuccess: (_, variables) => {
            notify.success("Lưu kế hoạch đào tạo thành công.");
            qc.invalidateQueries({ queryKey: ["evaluation-record", variables.recordId] });
        },
    });
};

export const useApproverSaveScoreMutation = () => {
    return useMutation({
        mutationFn: (variables: { recordId: number; criteriaId: number; score: number }) =>
            callApproverSaveScore(variables.recordId, variables.criteriaId, variables.score),
    });
};

export const useApproveRecordMutation = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (variables: { recordId: number; overrideReason?: string }) =>
            callApproveRecord(variables.recordId, variables.overrideReason),
        onSuccess: (_, variables) => {
            notify.success("Đã phê duyệt và hoàn tất bản đánh giá.");
            qc.invalidateQueries({ queryKey: ["evaluation-record", variables.recordId] });
            qc.invalidateQueries({ queryKey: ["pending-approval-evaluation-records"] });
            qc.invalidateQueries({ queryKey: ["approval-evaluation-records"] });
            qc.invalidateQueries({ queryKey: ["evaluation-completed-summary"] });
            qc.invalidateQueries({ queryKey: ["all-evaluation-records"] });
            qc.invalidateQueries({ queryKey: ["evaluation-task-counts"] });
        },
    });
};

export const useRejectRecordMutation = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (variables: { recordId: number; reason: string }) =>
            callRejectRecord(variables.recordId, variables.reason),
        onSuccess: (_, variables) => {
            notify.success("Đã trả lại bản đánh giá thành công.");
            qc.invalidateQueries({ queryKey: ["evaluation-record", variables.recordId] });
            qc.invalidateQueries({ queryKey: ["pending-approval-evaluation-records"] });
            qc.invalidateQueries({ queryKey: ["all-evaluation-records"] });
            qc.invalidateQueries({ queryKey: ["evaluation-task-counts"] });
        },
    });
};

export const useBatchApproveRecordsMutation = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (ids: number[]) => callBatchApproveRecords(ids),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["pending-approval-evaluation-records"] });
            qc.invalidateQueries({ queryKey: ["approval-evaluation-records"] });
            qc.invalidateQueries({ queryKey: ["evaluation-completed-summary"] });
            qc.invalidateQueries({ queryKey: ["all-evaluation-records"] });
            qc.invalidateQueries({ queryKey: ["evaluation-task-counts"] });
        },
    });
};

export const useExtendRecordDeadlineMutation = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (data: {
            recordIds: number[];
            phase: "EMPLOYEE" | "MANAGER" | "APPROVAL";
            deadline: string;
            recordDeadlines?: { recordId: number; deadline: string }[];
            phaseDeadlines?: { phase: "EMPLOYEE" | "MANAGER" | "APPROVAL"; deadline: string }[];
            reason?: string;
            cascade?: boolean;
        }) => callExtendEvaluationRecordDeadline(data),
        onSuccess: () => {
            notify.success("Đã gia hạn thời gian xử lý");
            qc.invalidateQueries({ queryKey: ["period-employees"] });
            qc.invalidateQueries({ queryKey: ["evaluation-record"] });
            qc.invalidateQueries({ queryKey: ["my-evaluation-records"] });
            qc.invalidateQueries({ queryKey: ["all-evaluation-records"] });
            qc.invalidateQueries({ queryKey: ["pending-manager-evaluation-records"] });
            qc.invalidateQueries({ queryKey: ["pending-approval-evaluation-records"] });
            qc.invalidateQueries({ queryKey: ["evaluation-record-history"] });
        },
        onError: (error: any) => {
            const message = Array.isArray(error?.message) ? error.message.join(". ") : error?.message;
            notify.error(message || "Không thể gia hạn thời gian xử lý");
        },
    });
};

export const useReassignEvaluatorsMutation = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (data: {
            recordIds: number[];
            evaluatorRole: "DIRECT_MANAGER" | "INDIRECT_MANAGER";
            newEvaluatorUserId: string;
            reason?: string;
        }) => callReassignEvaluators(data),
        onSuccess: () => {
            notify.success("Đã điều chuyển người xử lý");
            qc.invalidateQueries({ queryKey: ["period-employees"] });
            qc.invalidateQueries({ queryKey: ["all-evaluation-records"] });
            qc.invalidateQueries({ queryKey: ["pending-manager-evaluation-records"] });
            qc.invalidateQueries({ queryKey: ["pending-approval-evaluation-records"] });
            qc.invalidateQueries({ queryKey: ["evaluation-record-history"] });
            qc.invalidateQueries({ queryKey: ["evaluation-task-counts"] });
        },
        onError: (error: any) => {
            const message = Array.isArray(error?.message) ? error.message.join(". ") : error?.message;
            notify.error(message || "Không thể điều chuyển người xử lý");
        },
    });
};

export const useEmployeeConfirmRecordMutation = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (recordId: number) => callEmployeeConfirmRecord(recordId),
        onSuccess: (_, recordId) => {
            notify.success("Đã xác nhận kết quả đánh giá.");
            qc.invalidateQueries({ queryKey: ["evaluation-record", recordId] });
            qc.invalidateQueries({ queryKey: ["my-evaluation-records"] });
            qc.invalidateQueries({ queryKey: ["all-evaluation-records"] });
            qc.invalidateQueries({ queryKey: ["evaluation-task-counts"] });
        },
    });
};

// ═══════════════════════════════════════════════════════════════════════════
// PERIOD DETAIL HOOKS
// ═══════════════════════════════════════════════════════════════════════════

export const useTemplatesInPeriodQuery = (periodId: number) => {
    return useQuery({
        queryKey: ["period-templates", periodId],
        queryFn: async () => {
            const res = await callFetchTemplatesInPeriod(periodId);
            return res?.data || [];
        },
        enabled: !!periodId,
    });
};

export const useEvaluationTemplatesQuery = (query: string = "page=1&size=100", enabled = true) => {
    return useQuery({
        queryKey: ["evaluation-templates", query],
        queryFn: async () => {
            const res = await callFetchEvaluationTemplates(query);
            if (!res?.data) throw new Error("Không tải được danh sách mẫu đánh giá");
            return res.data;
        },
        enabled,
    });
};

export const useCreateEvaluationTemplateMutation = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (data: EvaluationTemplateMutationPayload) => {
            const res = await callCreateEvaluationTemplate(data);
            if (!res?.data) throw new Error(res?.message || "Không thể tạo mẫu đánh giá");
            return res;
        },
        onSuccess: () => {
            notify.success("Tạo mẫu đánh giá thành công");
            qc.invalidateQueries({ queryKey: ["evaluation-templates"] });
        },
        onError: (error: any) => {
            notify.error(error?.response?.data?.message || error?.message || "Không thể tạo mẫu đánh giá");
        },
    });
};

export const useUpdateEvaluationTemplateMutation = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (variables: { id: number; data: EvaluationTemplateMutationPayload }) => {
            const res = await callUpdateEvaluationTemplate(variables.id, variables.data);
            if (!res?.data) throw new Error(res?.message || "Không thể cập nhật mẫu đánh giá");
            return res;
        },
        onSuccess: (_, variables) => {
            notify.success("Cập nhật mẫu đánh giá thành công");
            qc.invalidateQueries({ queryKey: ["evaluation-templates"] });
            qc.invalidateQueries({ queryKey: ["evaluation-template", variables.id] });
        },
        onError: (error: any) => {
            notify.error(error?.response?.data?.message || error?.message || "Không thể cập nhật mẫu đánh giá");
        },
    });
};

export const useEmployeesInPeriodQuery = (periodId: number) => {
    return useQuery({
        queryKey: ["period-employees", periodId],
        queryFn: async () => {
            const res = await callFetchEmployeesInPeriod(periodId);
            return res?.data || [];
        },
        enabled: !!periodId,
    });
};

export const useAddTemplateToPeriodMutation = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (variables: { periodId: number; templateId: number }) =>
            callAddTemplateToPeriod(variables.periodId, variables.templateId),
        onSuccess: (_, variables) => {
            notify.success("Đã thêm mẫu đánh giá vào kỳ");
            qc.invalidateQueries({ queryKey: ["period-templates", variables.periodId] });
        },
    });
};

export const useRemoveTemplateFromPeriodMutation = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (variables: { periodId: number; templateId: number }) =>
            callRemoveTemplateFromPeriod(variables.periodId, variables.templateId),
        onSuccess: (_, variables) => {
            notify.success("Đã xóa mẫu đánh giá khỏi kỳ");
            qc.invalidateQueries({ queryKey: ["period-templates", variables.periodId] });
        },
    });
};

export const useAddEmployeeToPeriodMutation = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (variables: { periodId: number; data: any }) =>
            callAddEmployeeToPeriod(variables.periodId, variables.data),
        onSuccess: (_, variables) => {
            notify.success("Đã thêm nhân sự vào kỳ");
            qc.invalidateQueries({ queryKey: ["period-employees", variables.periodId] });
        },
    });
};

export const useCancelPeriodEmployeeMutation = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (variables: { id: number; periodId: number }) =>
            callCancelPeriodEmployee(variables.id),
        onSuccess: (_, variables) => {
            notify.success("Đã hủy lượt đánh giá của nhân sự");
            qc.invalidateQueries({ queryKey: ["period-employees", variables.periodId] });
        },
    });
};

// ═══════════════════════════════════════════════════════════════════════════
// TEMPLATE DETAIL HOOKS
// ═══════════════════════════════════════════════════════════════════════════

export const useEvaluationTemplateByIdQuery = (id: number) => {
    return useQuery({
        queryKey: ["evaluation-template", id],
        queryFn: async () => {
            const res = await callFetchEvaluationTemplateById(id);
            if (!res?.data) throw new Error("Không thể lấy thông tin mẫu đánh giá");
            return res.data;
        },
        enabled: !!id,
    });
};

export const useCreateTemplateSectionMutation = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (variables: { templateId: number; data: any }) =>
            callCreateTemplateSection(variables.templateId, variables.data),
        onSuccess: (_, variables) => {
            notify.success("Thêm phần đánh giá thành công");
            qc.invalidateQueries({ queryKey: ["evaluation-template", variables.templateId] });
        },
    });
};

export const useUpdateTemplateSectionMutation = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (variables: { sectionId: number; templateId: number; data: any }) =>
            callUpdateTemplateSection(variables.sectionId, variables.data),
        onSuccess: (_, variables) => {
            notify.success("Cập nhật phần đánh giá thành công");
            qc.invalidateQueries({ queryKey: ["evaluation-template", variables.templateId] });
        },
    });
};

export const useDeleteTemplateSectionMutation = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (variables: { sectionId: number; templateId: number }) =>
            callDeleteTemplateSection(variables.sectionId),
        onSuccess: (_, variables) => {
            notify.success("Đã xóa phần đánh giá");
            qc.invalidateQueries({ queryKey: ["evaluation-template", variables.templateId] });
        },
    });
};

export const useCreateTemplateCriteriaMutation = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (variables: { sectionId: number; templateId: number; data: any }) =>
            callCreateTemplateCriteria(variables.sectionId, variables.data),
        onSuccess: (_, variables) => {
            notify.success("Thêm tiêu chí thành công");
            qc.invalidateQueries({ queryKey: ["evaluation-template", variables.templateId] });
        },
    });
};

export const useUpdateTemplateCriteriaMutation = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (variables: { criteriaId: number; templateId: number; data: any }) =>
            callUpdateTemplateCriteria(variables.criteriaId, variables.data),
        onSuccess: (_, variables) => {
            notify.success("Cập nhật tiêu chí thành công");
            qc.invalidateQueries({ queryKey: ["evaluation-template", variables.templateId] });
        },
    });
};

export const useDeleteTemplateCriteriaMutation = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (variables: { criteriaId: number; templateId: number }) =>
            callDeleteTemplateCriteria(variables.criteriaId),
        onSuccess: (_, variables) => {
            notify.success("Đã xóa tiêu chí");
            qc.invalidateQueries({ queryKey: ["evaluation-template", variables.templateId] });
        },
    });
};

export const useCreateCriteriaLevelMutation = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (variables: { criteriaId: number; templateId: number; data: any }) =>
            callCreateCriteriaLevel(variables.criteriaId, variables.data),
        onSuccess: (_, variables) => {
            notify.success("Thêm mức điểm thành công");
            qc.invalidateQueries({ queryKey: ["evaluation-template", variables.templateId] });
        },
    });
};

export const useUpdateCriteriaLevelMutation = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (variables: { levelId: number; templateId: number; data: any }) =>
            callUpdateCriteriaLevel(variables.levelId, variables.data),
        onSuccess: (_, variables) => {
            notify.success("Cập nhật mức điểm thành công");
            qc.invalidateQueries({ queryKey: ["evaluation-template", variables.templateId] });
        },
    });
};

export const usePublishTemplateMutation = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (templateId: number) => callPublishEvaluationTemplate(templateId),
        onSuccess: (_, templateId) => {
            notify.success("Đã xuất bản mẫu đánh giá thành công");
            qc.invalidateQueries({ queryKey: ["evaluation-template", templateId] });
        },
    });
};

export const useActivateEvaluationPeriodMutation = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: number) => callActivateEvaluationPeriod(id),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["evaluation-periods"] });
        },
    });
};

export const useCreateEvaluationPeriodMutation = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (data: EvaluationPeriodMutationPayload) => {
            const res = await callCreateEvaluationPeriod(data);
            if (!res?.data) throw new Error(res?.message || "Không thể tạo kỳ đánh giá");
            return res;
        },
        onSuccess: () => {
            notify.success("Tạo kỳ đánh giá thành công");
            qc.invalidateQueries({ queryKey: ["evaluation-periods"] });
        },
        onError: (error: any) => {
            notify.error(error?.response?.data?.message || error?.message || "Không thể tạo kỳ đánh giá");
        },
    });
};

export const useUpdateEvaluationPeriodMutation = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (variables: { id: number; data: EvaluationPeriodMutationPayload }) => {
            const res = await callUpdateEvaluationPeriod(variables.id, variables.data);
            if (!res?.data) throw new Error(res?.message || "Không thể cập nhật kỳ đánh giá");
            return res;
        },
        onSuccess: (_, variables) => {
            notify.success("Cập nhật kỳ đánh giá thành công");
            qc.invalidateQueries({ queryKey: ["evaluation-periods"] });
            qc.invalidateQueries({ queryKey: ["evaluation-period", variables.id] });
        },
        onError: (error: any) => {
            notify.error(error?.response?.data?.message || error?.message || "Không thể cập nhật kỳ đánh giá");
        },
    });
};

export const useCloseEvaluationPeriodMutation = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: number) => callCloseEvaluationPeriod(id),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["evaluation-periods"] });
        },
    });
};

export const useAdjustEvaluationPeriodStartDateMutation = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (variables: { id: number; employeeStartDate: string }) =>
            callAdjustEvaluationPeriodStartDate(variables.id, { employeeStartDate: variables.employeeStartDate }),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["evaluation-periods"] });
        },
    });
};
