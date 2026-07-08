import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    callFetchDepartmentObjectives,
    callCreateDepartmentObjective,
    callDeleteDepartmentObjective,
    callFetchDepartmentMissionSummary,
    callFetchDepartmentMissionVersions,
    callPublishDepartmentObjective
} from "@/config/api";

import type { IDepartmentMissionTree, ICreateDepartmentMissionReq, IDepartmentMissionSummary, IDepartmentMissionVersion } from "@/types/backend";
import { notify } from "@/components/common/notification/notify";

/* ======================================================
   FETCH DEPARTMENT OBJECTIVES TREE
   ====================================================== */

export const useDepartmentObjectivesQuery = (departmentId?: number) => {
    return useQuery<IDepartmentMissionTree>({
        queryKey: ["department-objectives", departmentId],

        enabled: !!departmentId,

        queryFn: async () => {
            if (!departmentId) {
                throw new Error("Thiếu departmentId");
            }

            const res = await callFetchDepartmentObjectives(departmentId);

            if (!res || res.statusCode !== 200 || !res.data) {
                throw new Error(res?.message || "Không thể lấy mục tiêu phòng ban");
            }

            return res.data as IDepartmentMissionTree;
        },
    });
};


/* ======================================================
   CREATE OBJECTIVE
   ====================================================== */

export const useCreateDepartmentObjectiveMutation = () => {
    const queryClient = useQueryClient();

    return useMutation({
        // CHỈNH: dùng ICreateDepartmentMissionReq thay vì IDepartmentMissionTree
        mutationFn: async (payload: ICreateDepartmentMissionReq) => {
            const res = await callCreateDepartmentObjective(payload);

            if (!res || res.statusCode !== 201) {
                throw new Error(res?.message || "Không thể tạo mục tiêu phòng ban");
            }

            return res;
        },

        onSuccess: (res) => {
            notify.created(res?.message || "Tạo mục tiêu phòng ban thành công");

            queryClient.invalidateQueries({
                queryKey: ["department-objectives"],
                exact: false,
            });
            queryClient.invalidateQueries({
                queryKey: ["department-mission-summary"],
                exact: false,
            });
        },

        onError: (error: any) => {
            notify.error(error.message || "Lỗi khi tạo mục tiêu phòng ban");
        },
    });
};


/* ======================================================
   DELETE OBJECTIVE
   ====================================================== */

export const useDeleteDepartmentObjectiveMutation = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: number) => {
            const res = await callDeleteDepartmentObjective(id);

            if (!res || res.statusCode !== 200) {
                throw new Error(res?.message || "Không thể xóa mục tiêu");
            }

            return res.data;
        },

        onSuccess: () => {
            notify.deleted("Xóa mục tiêu thành công");

            queryClient.invalidateQueries({
                queryKey: ["department-objectives"],
                exact: false,
            });
            queryClient.invalidateQueries({
                queryKey: ["department-mission-summary"],
                exact: false,
            });
        },

        onError: (error: any) => {
            notify.error(error.message || "Lỗi khi xóa mục tiêu");
        },
    });
};

/* ======================================================
   PUBLISH OBJECTIVE (Ban hành)
   ====================================================== */

export const usePublishDepartmentObjectiveMutation = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (payload: {
            departmentId: number;
            title?: string;
            changeSummary?: string;
            effectiveDate?: string;
        }) => {
            const res = await callPublishDepartmentObjective(payload.departmentId, {
                title: payload.title,
                changeSummary: payload.changeSummary,
                effectiveDate: payload.effectiveDate,
            });

            if (!res || res.statusCode !== 200) {
                throw new Error(res?.message || "Không thể ban hành mục tiêu phòng ban");
            }

            return res;
        },

        onSuccess: (res) => {
            notify.success(res?.message || "Ban hành mục tiêu phòng ban thành công");

            queryClient.invalidateQueries({
                queryKey: ["department-objectives"],
                exact: false,
            });
            queryClient.invalidateQueries({
                queryKey: ["department-mission-summary"],
                exact: false,
            });
            queryClient.invalidateQueries({
                queryKey: ["department-mission-versions"],
                exact: false,
            });
        },

        onError: (error: any) => {
            notify.error(error.message || "Lỗi khi ban hành mục tiêu phòng ban");
        },
    });
};

/* ======================================================
   FETCH SUMMARY
   ====================================================== */

export const useDepartmentMissionSummaryQuery = () => {
    return useQuery<IDepartmentMissionSummary[]>({
        queryKey: ["department-mission-summary"],
        queryFn: async () => {
            const res = await callFetchDepartmentMissionSummary();
            if (!res || res.statusCode !== 200 || !res.data) {
                throw new Error(res?.message || "Không thể lấy danh sách tổng hợp");
            }
            return res.data;
        },
    });
};

export const useDepartmentMissionVersionsQuery = (departmentId?: number) => {
    return useQuery<IDepartmentMissionVersion[]>({
        queryKey: ["department-mission-versions", departmentId],
        enabled: !!departmentId,
        queryFn: async () => {
            if (!departmentId) {
                throw new Error("Thiếu departmentId");
            }
            const res = await callFetchDepartmentMissionVersions(departmentId);
            if (!res || res.statusCode !== 200 || !res.data) {
                throw new Error(res?.message || "Không thể lấy lịch sử version");
            }
            return res.data;
        },
    });
};
