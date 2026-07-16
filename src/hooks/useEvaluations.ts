import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type {
    IEvaluationRecord,
    IResScoreDTO,
    IResCommentDTO,
    IResTrainingPlanDTO,
    IEvaluationHistory,
    IBatchApproveResponse,
    IModelPaginate,
    IPeriodProgress
} from "@/types/backend";
import {
    callFetchEvaluationRecordById,
    callFetchMyEvaluationRecords,
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
    callFetchCompletedSummary,
    callEmployeeConfirmRecord,
    callFetchRecordHistory,
    callFetchPeriodProgress
} from "@/config/api";
import { notify } from "@/components/common/notification/notify";

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

export const useEvaluationRecordQuery = (id: number) => {
    return useQuery({
        queryKey: ["evaluation-record", id],
        queryFn: async () => {
            const res = await callFetchEvaluationRecordById(id);
            if (!res?.data) throw new Error("Không lấy được dữ liệu bản đánh giá");
            return res.data;
        },
        enabled: !!id,
    });
};

export const useMyEvaluationRecordsQuery = () => {
    return useQuery({
        queryKey: ["my-evaluation-records"],
        queryFn: async () => {
            const res = await callFetchMyEvaluationRecords();
            return res?.data || [];
        },
    });
};

export const useManagerRecordsQuery = () => {
    return useQuery({
        queryKey: ["manager-evaluation-records"],
        queryFn: async () => {
            const res = await callFetchManagerRecords();
            return res?.data || [];
        },
    });
};

export const usePendingManagerRecordsQuery = () => {
    return useQuery({
        queryKey: ["pending-manager-evaluation-records"],
        queryFn: async () => {
            const res = await callFetchPendingManagerRecords();
            return res?.data || [];
        },
    });
};

export const useApprovalRecordsQuery = () => {
    return useQuery({
        queryKey: ["approval-evaluation-records"],
        queryFn: async () => {
            const res = await callFetchApprovalRecords();
            return res?.data || [];
        },
    });
};

export const usePendingApprovalRecordsQuery = () => {
    return useQuery({
        queryKey: ["pending-approval-evaluation-records"],
        queryFn: async () => {
            const res = await callFetchPendingApprovalRecords();
            return res?.data || [];
        },
    });
};

export const useCompletedSummaryQuery = (
    periodId?: number,
    departmentId?: number,
    companyId?: number,
    sectionId?: number,
    page: number = 1,
    size: number = 15
) => {
    return useQuery({
        queryKey: ["evaluation-completed-summary", periodId, departmentId, companyId, sectionId, page, size],
        queryFn: async () => {
            const res = await callFetchCompletedSummary(periodId, departmentId, companyId, sectionId, page, size);
            if (!res?.data) throw new Error("Không tải được tổng hợp kết quả");
            return res.data;
        },
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
            notify.success("Nộp bản tự đánh giá thành công!");
            qc.invalidateQueries({ queryKey: ["evaluation-record", recordId] });
            qc.invalidateQueries({ queryKey: ["my-evaluation-records"] });
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
            notify.success("Đã gửi bản đánh giá lên bước duyệt cấp trên!");
            qc.invalidateQueries({ queryKey: ["evaluation-record", recordId] });
            qc.invalidateQueries({ queryKey: ["pending-manager-evaluation-records"] });
            qc.invalidateQueries({ queryKey: ["manager-evaluation-records"] });
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
            notify.success("Lưu kế hoạch đào tạo thành công!");
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
            notify.success("Duyệt cấp trên và hoàn tất bản đánh giá thành công!");
            qc.invalidateQueries({ queryKey: ["evaluation-record", variables.recordId] });
            qc.invalidateQueries({ queryKey: ["pending-approval-evaluation-records"] });
            qc.invalidateQueries({ queryKey: ["approval-evaluation-records"] });
            qc.invalidateQueries({ queryKey: ["evaluation-completed-summary"] });
        },
    });
};

export const useRejectRecordMutation = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (variables: { recordId: number; reason: string }) =>
            callRejectRecord(variables.recordId, variables.reason),
        onSuccess: (_, variables) => {
            notify.success("Đã trả lại bản đánh giá thành công!");
            qc.invalidateQueries({ queryKey: ["evaluation-record", variables.recordId] });
            qc.invalidateQueries({ queryKey: ["pending-approval-evaluation-records"] });
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
            reason?: string;
            cascade?: boolean;
        }) => callExtendEvaluationRecordDeadline(data),
        onSuccess: () => {
            notify.success("Gia hạn deadline thành công!");
            qc.invalidateQueries({ queryKey: ["evaluation-record"] });
        },
    });
};

export const useEmployeeConfirmRecordMutation = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (recordId: number) => callEmployeeConfirmRecord(recordId),
        onSuccess: (_, recordId) => {
            notify.success("Đã xác nhận kết quả đánh giá!");
            qc.invalidateQueries({ queryKey: ["evaluation-record", recordId] });
            qc.invalidateQueries({ queryKey: ["my-evaluation-records"] });
        },
    });
};
