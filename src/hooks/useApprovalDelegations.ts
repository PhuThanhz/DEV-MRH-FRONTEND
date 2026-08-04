import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { notification } from "antd";
import {
    callCreateApprovalDelegation,
    callFetchMyApprovalDelegations,
    callFetchDelegationsToMe,
    callRevokeApprovalDelegation,
} from "@/config/api";
import type { IReqCreateApprovalDelegationDTO } from "@/types/backend";

export const MY_DELEGATIONS_KEY = "my-approval-delegations";
export const DELEGATIONS_TO_ME_KEY = "approval-delegations-delegated-to-me";

export const useMyApprovalDelegationsQuery = () => {
    return useQuery({
        queryKey: [MY_DELEGATIONS_KEY],
        queryFn: async () => {
            const res = await callFetchMyApprovalDelegations();
            if (res && res.data) {
                return res.data;
            }
            return [];
        },
    });
};

export const useDelegationsToMeQuery = () => {
    return useQuery({
        queryKey: [DELEGATIONS_TO_ME_KEY],
        queryFn: async () => {
            const res = await callFetchDelegationsToMe();
            if (res && res.data) {
                return res.data;
            }
            return [];
        },
    });
};

export const useCreateApprovalDelegationMutation = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: IReqCreateApprovalDelegationDTO) => {
            const res = await callCreateApprovalDelegation(data);
            if (res && res.data) {
                return res.data;
            }
            throw new Error(res?.message || "Không thể tạo mới ủy quyền duyệt");
        },
        onSuccess: () => {
            notification.success({ message: "Tạo mới ủy quyền duyệt thành công!" });
            queryClient.invalidateQueries({ queryKey: [MY_DELEGATIONS_KEY] });
        },
        onError: (error: any) => {
            notification.error({
                message: "Tạo ủy quyền thất bại",
                description: error?.message || "Có lỗi xảy ra",
            });
        },
    });
};

export const useRevokeApprovalDelegationMutation = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: number) => {
            const res = await callRevokeApprovalDelegation(id);
            return res;
        },
        onSuccess: () => {
            notification.success({ message: "Thu hồi ủy quyền thành công!" });
            queryClient.invalidateQueries({ queryKey: [MY_DELEGATIONS_KEY] });
        },
        onError: (error: any) => {
            notification.error({
                message: "Thu hồi ủy quyền thất bại",
                description: error?.message || "Có lỗi xảy ra",
            });
        },
    });
};
