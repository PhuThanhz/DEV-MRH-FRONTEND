/* ===================== PERMISSION ASSIGNMENT ===================== */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    callGetPermissionMatrix,
    callAssignPermission,
} from "@/config/api";

import type {
    IPermissionMatrix,
    IAssignPermissionReq,
} from "@/types/backend";

import { notify } from "@/components/common/notification/notify";

/* ===================== GET MATRIX ===================== */
export const usePermissionMatrixQuery = (contentId?: number) => {
    return useQuery({
        queryKey: ["permission-matrix", contentId],
        enabled: !!contentId,
        queryFn: async () => {
            const res = await callGetPermissionMatrix(contentId!);
            if (!res?.data) {
                throw new Error("Không thể tải ma trận phân quyền");
            }
            return res.data as IPermissionMatrix;
        },
    });
};

/* ===================== ASSIGN ===================== */
export const useAssignPermissionMutation = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (payload: {
            contentId: number;
            data: IAssignPermissionReq;
        }) => {
            const res = await callAssignPermission(
                payload.contentId,
                payload.data
            );
            return res;
        },
        onSuccess: (_, variables) => {
            notify.updated("Cập nhật phân quyền thành công");
            queryClient.invalidateQueries({
                queryKey: ["permission-matrix", variables.contentId],
            });
        },
        onError: (err: any) => {
            notify.error(err.message || "Lỗi khi gán quyền");
        },
    });
};
