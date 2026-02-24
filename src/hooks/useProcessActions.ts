/* ===================== PROCESS ACTIONS ===================== */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    callFetchProcessActions,
    callCreateProcessAction,
    callUpdateProcessAction,
    callDeleteProcessAction,
} from "@/config/api";
import type { IProcessAction } from "@/types/backend";
import type { IModelPaginate } from "@/types/backend";
import { notify } from "@/components/common/notification/notify";

export const useProcessActionsQuery = (query: string) =>
    useQuery({
        queryKey: ["process-actions", query],
        queryFn: async () => {
            const res = await callFetchProcessActions(query);
            if (!res?.data) throw new Error("Không thể lấy danh sách Process Action");
            return res.data as IModelPaginate<IProcessAction>;
        },
    });

export const useCreateProcessActionMutation = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: callCreateProcessAction,
        onSuccess: () => {
            notify.created("Tạo Process Action thành công");
            qc.invalidateQueries({ queryKey: ["process-actions"] });
        },
        onError: (e: any) => notify.error(e.message),
    });
};

export const useUpdateProcessActionMutation = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: callUpdateProcessAction,
        onSuccess: () => {
            notify.updated("Cập nhật Process Action thành công");
            qc.invalidateQueries({ queryKey: ["process-actions"] });
        },
        onError: (e: any) => notify.error(e.message),
    });
};

export const useDeleteProcessActionMutation = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: callDeleteProcessAction,
        onSuccess: () => {
            notify.deleted("Xóa Process Action thành công");
            qc.invalidateQueries({ queryKey: ["process-actions"] });
        },
        onError: (e: any) => notify.error(e.message),
    });
};
