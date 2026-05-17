import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import {
    callFetchOrgNodes,
    callCreateOrgNode,
    callUpdateOrgNode,
    callDeleteOrgNode,
    callCreateOrgNodeBulkTree,  // ⭐ THÊM
    callUpdateOrgNodePositions,
} from "@/config/api";

import { notify } from "@/components/common/notification/notify";
import type { IBackendRes, IReqCreateNodeTree } from "@/types/backend"; // ⭐ THÊM IReqCreateNodeTree

/* ===================== ORG NODES ===================== */

export const useOrgNodesQuery = (chartId: number) => {

    return useQuery<any[]>({

        queryKey: ["orgNodes", chartId],

        queryFn: async () => {

            const res = await callFetchOrgNodes(chartId);

            const backendRes = res.data as IBackendRes<any[]> | undefined;

            return backendRes?.data ?? [];

        },

        enabled: !!chartId

    });

};


/* ===================== CREATE NODE (single) ===================== */

export const useCreateOrgNodeMutation = () => {

    const queryClient = useQueryClient();

    return useMutation<any, Error, any>({

        mutationFn: async (data: any) => {

            const res = await callCreateOrgNode(data);

            const backendRes = res.data as IBackendRes<any> | undefined;

            return backendRes?.data;

        },

        onSuccess: () => {

            notify.created("Tạo node thành công");

            queryClient.invalidateQueries({
                queryKey: ["orgNodes"]
            });

        }

    });

};


/* ===================== CREATE NODE BULK TREE ===================== */

export const useCreateOrgNodeBulkTreeMutation = () => {

    const queryClient = useQueryClient();

    return useMutation<any, Error, IReqCreateNodeTree[]>({

        mutationFn: async (data: IReqCreateNodeTree[]) => {

            const res = await callCreateOrgNodeBulkTree(data);

            const backendRes = res.data as IBackendRes<any[]> | undefined;

            return backendRes?.data;

        },

        onSuccess: () => {

            notify.created("Tạo hàng loạt node thành công");

            queryClient.invalidateQueries({
                queryKey: ["orgNodes"]
            });

        }

    });

};


/* ===================== UPDATE NODE ===================== */

export const useUpdateOrgNodeMutation = () => {

    const queryClient = useQueryClient();

    return useMutation<any, Error, any>({

        mutationFn: async (data: any) => {

            const res = await callUpdateOrgNode(data);

            const backendRes = res.data as IBackendRes<any> | undefined;

            return backendRes?.data;

        },

        onSuccess: () => {

            notify.updated("Cập nhật node thành công");

            queryClient.invalidateQueries({
                queryKey: ["orgNodes"]
            });

        }

    });

};


/* ===================== UPDATE NODE POSITIONS (BULK) ===================== */

export const useUpdateOrgNodePositionsMutation = () => {

    const queryClient = useQueryClient();

    return useMutation<any, Error, { id: number; posX: number; posY: number }[]>({

        mutationFn: async (data: { id: number; posX: number; posY: number }[]) => {

            const res = await callUpdateOrgNodePositions(data);

            const backendRes = res.data as IBackendRes<any> | undefined;

            return backendRes?.data;

        },

        onSuccess: () => {

            notify.updated("Cập nhật vị trí thành công");

            queryClient.invalidateQueries({
                queryKey: ["orgNodes"]
            });

        }

    });

};


/* ===================== DELETE NODE ===================== */

export const useDeleteOrgNodeMutation = () => {

    const queryClient = useQueryClient();

    return useMutation<void, Error, number>({

        mutationFn: async (id: number) => {

            const res = await callDeleteOrgNode(id);

            return res.data;

        },

        onSuccess: () => {

            notify.deleted("Xóa node thành công");

            queryClient.invalidateQueries({
                queryKey: ["orgNodes"]
            });

        }

    });

};

