import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    callFetchSectionSalaryGrades,
    callCreateSectionSalaryGrade,
    callUpdateSectionSalaryGrade,
    callDeleteSectionSalaryGrade,
    callRestoreSectionSalaryGrade,
} from "@/config/api";

import type {
    ISectionSalaryGrade,
    ICreateSectionSalaryGradeReq,
    IUpdateSectionSalaryGradeReq,
} from "@/types/backend";
import { notify } from "@/components/common/notification/notify";

/* =====================================================
   1. FETCH LIST
===================================================== */
export const useSectionSalaryGradesQuery = (sectionJobTitleId?: number) =>
    useQuery({
        queryKey: ["section-salary-grades", sectionJobTitleId],
        enabled: !!sectionJobTitleId,
        queryFn: async () => {
            const res = await callFetchSectionSalaryGrades(sectionJobTitleId!);
            return res?.data ?? [];
        },
    });

/* =====================================================
   2. CREATE
===================================================== */
export const useCreateSectionSalaryGradeMutation = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (payload: ICreateSectionSalaryGradeReq) => {
            const res = await callCreateSectionSalaryGrade(payload);
            return res.data;
        },
        onSuccess: (_res, payload) => {
            notify.created("Đã tạo bậc lương mới");
            queryClient.invalidateQueries({
                queryKey: ["section-salary-grades", payload.sectionJobTitleId],
            });
        },
        onError: (err: any) => notify.error(err?.message),
    });
};

/* =====================================================
   3. UPDATE  (FIXED)
===================================================== */
interface UpdateSectionGradePayload extends IUpdateSectionSalaryGradeReq {
    id: number;
    sectionJobTitleId: number; // FE ONLY
}

export const useUpdateSectionSalaryGradeMutation = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (payload: UpdateSectionGradePayload) => {
            const res = await callUpdateSectionSalaryGrade(payload.id, {
                gradeLevel: payload.gradeLevel,
            });
            return res.data;
        },
        onSuccess: (_res, payload) => {
            notify.updated("Cập nhật bậc lương thành công");
            queryClient.invalidateQueries({
                queryKey: ["section-salary-grades", payload.sectionJobTitleId],
            });
        },
        onError: (err: any) => notify.error(err?.message),
    });
};

/* =====================================================
   4. DELETE (SOFT)
===================================================== */
export const useDeleteSectionSalaryGradeMutation = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (payload: { id: number; sectionJobTitleId: number }) => {
            await callDeleteSectionSalaryGrade(payload.id);
        },
        onSuccess: (_res, payload) => {
            notify.deleted("Đã xoá bậc lương");
            queryClient.invalidateQueries({
                queryKey: ["section-salary-grades", payload.sectionJobTitleId],
            });
        },
        onError: () => notify.error("Không thể xoá bậc lương"),
    });
};

/* =====================================================
   5. RESTORE (SOFT RESTORE)
===================================================== */
export const useRestoreSectionSalaryGradeMutation = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (payload: { id: number; sectionJobTitleId: number }) => {
            const res = await callRestoreSectionSalaryGrade(payload.id);
            return res.data;
        },
        onSuccess: (_res, payload) => {
            notify.success("Khôi phục bậc lương thành công");
            queryClient.invalidateQueries({
                queryKey: ["section-salary-grades", payload.sectionJobTitleId],
            });
        },
        onError: (err: any) =>
            notify.error(err?.message || "Không thể khôi phục bậc lương"),
    });
};
