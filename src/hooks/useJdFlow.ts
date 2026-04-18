import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    callFetchJdFlow,
    callFetchJdFlowLogs,
    callFetchJdFlowInbox,
    callFetchJdApprovers,
    callSubmitJdFlow,
    callApproveJdFlow,
    callRejectJdFlow,
    callIssueJdFlow,
    callFetchJdIssuers,
    callRecallJdFlow,
} from "@/config/api";

import type {
    IJDFlowLog,
    IJDApprover,
    IJdInbox
} from "@/types/backend";

/* ===================== JD FLOW ===================== */

export const useJdFlowQuery = (jdId?: number) => {
    return useQuery({
        queryKey: ["jd-flow", jdId],
        enabled: !!jdId,
        staleTime: 1000 * 30,
        queryFn: async () => {
            if (!jdId) return null;
            const res = await callFetchJdFlow(jdId);
            if (!res || res.statusCode !== 200) {
                throw new Error(res?.message || "Không thể lấy JD Flow");
            }
            return res.data;
        },
    });
};

/* ===================== JD FLOW LOGS ===================== */

export const useJdFlowLogsQuery = (jdId?: number) => {
    return useQuery<IJDFlowLog[]>({
        queryKey: ["jd-flow-logs", jdId],
        enabled: !!jdId,
        staleTime: 1000 * 30,
        queryFn: async (): Promise<IJDFlowLog[]> => {
            if (!jdId) return [];
            const res = await callFetchJdFlowLogs(jdId);
            if (!res || res.statusCode !== 200) {
                throw new Error(res?.message || "Không thể lấy lịch sử JD Flow");
            }
            return res.data ?? [];
        },
    });
};

/* ===================== JD FLOW INBOX ===================== */

export const useJdFlowInboxQuery = () => {
    return useQuery<IJdInbox[]>({
        queryKey: ["jd-flow-inbox"],
        staleTime: 1000 * 30,
        queryFn: async (): Promise<IJdInbox[]> => {
            const res = await callFetchJdFlowInbox();
            if (!res || res.statusCode !== 200) {
                throw new Error(res?.message || "Không thể lấy danh sách JD cần duyệt");
            }
            return res.data ?? [];
        },
    });
};

/* ===================== JD APPROVERS ===================== */

export const useJdApproversQuery = (enabled: boolean = true) => {
    return useQuery<IJDApprover[]>({
        queryKey: ["jd-approvers"],
        enabled,
        staleTime: 1000 * 60,
        queryFn: async (): Promise<IJDApprover[]> => {
            const res = await callFetchJdApprovers();
            if (!res || res.statusCode !== 200) {
                throw new Error(res?.message || "Không thể lấy danh sách người duyệt JD");
            }
            return res.data ?? [];
        },
    });
};

/* ===================== SUBMIT JD - ĐÃ CẬP NHẬT ===================== */
/* ===================== SUBMIT JD ===================== */

export const useSubmitJdFlowMutation = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: callSubmitJdFlow,   // backend call phải nhận IReqSubmitJdFlow

        onSuccess: (_, variables) => {
            const jdId = variables.jdId;

            queryClient.invalidateQueries({ queryKey: ["jd-flow", jdId] });
            queryClient.invalidateQueries({ queryKey: ["jd-flow-logs", jdId] });
            queryClient.invalidateQueries({ queryKey: ["jd-flow-inbox"] });
            queryClient.invalidateQueries({ queryKey: ["job-descriptions"] });
            queryClient.invalidateQueries({ queryKey: ["my-job-descriptions"] });
        },
    });
};

/* ===================== APPROVE JD ===================== */

export const useApproveJdFlowMutation = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: callApproveJdFlow,
        onSuccess: (_, variables) => {
            const jdId = variables.jdId;
            queryClient.invalidateQueries({ queryKey: ["jd-flow", jdId] });
            queryClient.invalidateQueries({ queryKey: ["jd-flow-logs", jdId] });
            queryClient.invalidateQueries({ queryKey: ["jd-flow-inbox"] });
            queryClient.invalidateQueries({ queryKey: ["job-descriptions"] });
            queryClient.invalidateQueries({ queryKey: ["my-job-descriptions"] });
        },
    });
};

/* ===================== REJECT JD ===================== */

export const useRejectJdFlowMutation = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: callRejectJdFlow,
        onSuccess: (_, variables) => {
            const jdId = variables.jdId;
            queryClient.invalidateQueries({ queryKey: ["jd-flow", jdId] });
            queryClient.invalidateQueries({ queryKey: ["jd-flow-logs", jdId] });
            queryClient.invalidateQueries({ queryKey: ["jd-flow-inbox"] });
            queryClient.invalidateQueries({ queryKey: ["job-descriptions"] });
            queryClient.invalidateQueries({ queryKey: ["my-job-descriptions"] });
        },
    });
};

/* ===================== ISSUE JD ===================== */

export const useIssueJdFlowMutation = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: callIssueJdFlow,
        onSuccess: (_, variables) => {
            const jdId = variables.jdId;
            queryClient.invalidateQueries({ queryKey: ["jd-flow", jdId] });
            queryClient.invalidateQueries({ queryKey: ["jd-flow-logs", jdId] });
            queryClient.invalidateQueries({ queryKey: ["jd-flow-inbox"] });
            queryClient.invalidateQueries({ queryKey: ["job-descriptions"] });
            queryClient.invalidateQueries({ queryKey: ["my-job-descriptions"] });
        },
    });
};

/* ===================== JD ISSUERS ===================== */

export const useJdIssuersQuery = (enabled: boolean = true) => {
    return useQuery<IJDApprover[]>({
        queryKey: ["jd-issuers"],
        enabled,
        staleTime: 1000 * 60,
        queryFn: async (): Promise<IJDApprover[]> => {
            const res = await callFetchJdIssuers();
            if (!res || res.statusCode !== 200) {
                throw new Error(res?.message || "Không thể lấy danh sách người ban hành JD");
            }
            return res.data ?? [];
        },
    });
};

/* ===================== RECALL JD ===================== */

export const useRecallJdFlowMutation = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: { jdId: number }) => callRecallJdFlow(data.jdId),
        onSuccess: (_, variables) => {
            const jdId = variables.jdId;
            queryClient.invalidateQueries({ queryKey: ["jd-flow", jdId] });
            queryClient.invalidateQueries({ queryKey: ["jd-flow-logs", jdId] });
            queryClient.invalidateQueries({ queryKey: ["jd-flow-inbox"] });
            queryClient.invalidateQueries({ queryKey: ["job-descriptions"] });
            queryClient.invalidateQueries({ queryKey: ["my-job-descriptions"] });
        },
    });
};