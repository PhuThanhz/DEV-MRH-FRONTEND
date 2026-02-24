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
export const useAssignPermissionMutation = (contentId: number) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: IAssignPermissionReq) => {
            const res = await callAssignPermission(contentId, data);
            if (!res) {
                throw new Error("Không thể gán quyền");
            }
            return res;
        },
        onSuccess: () => {
            notify.updated("Cập nhật phân quyền thành công");
            queryClient.invalidateQueries({
                queryKey: ["permission-matrix", contentId],
            });
        },
        onError: (err: any) => {
            notify.error(err.message || "Lỗi khi gán quyền");
        },
    });
};
