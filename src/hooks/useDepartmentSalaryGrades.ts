import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    callFetchDepartmentSalaryGrades,
    callCreateDepartmentSalaryGrade,
    callUpdateDepartmentSalaryGrade,
    callDeleteDepartmentSalaryGrade,
    callRestoreDepartmentSalaryGrade,
} from "@/config/api";

import { notify } from "@/components/common/notification/notify";

import type {
    IDepartmentSalaryGrade,
    ICreateDepartmentSalaryGradeReq,
    IUpdateDepartmentSalaryGradeReq,
} from "@/types/backend";

/* =====================================================
   1. FETCH LIST
===================================================== */
export const useDepartmentSalaryGradesQuery = (departmentJobTitleId?: number) =>
    useQuery({
        queryKey: ["department-salary-grades", departmentJobTitleId],
        enabled: !!departmentJobTitleId,
        queryFn: async () => {
            const res = await callFetchDepartmentSalaryGrades(departmentJobTitleId!);
            if (!res?.data) return [];
            return res.data;
        },
    });

/* =====================================================
   2. CREATE
===================================================== */
export const useCreateDepartmentSalaryGradeMutation = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (payload: ICreateDepartmentSalaryGradeReq) => {
            const res = await callCreateDepartmentSalaryGrade(payload);
            if (!res?.data) throw new Error("Không thể tạo bậc lương");
            return res.data;
        },
        onSuccess: (_res, payload) => {
            notify.created("Tạo bậc lương phòng ban thành công!");
            queryClient.invalidateQueries({
                queryKey: ["department-salary-grades", payload.departmentJobTitleId],
            });
        },
        onError: (err: any) => notify.error(err?.message || "Lỗi tạo bậc lương"),
    });
};

/* =====================================================
   3. UPDATE
===================================================== */
export const useUpdateDepartmentSalaryGradeMutation = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (payload: {
            id: number;
            departmentJobTitleId: number;
            gradeLevel: number;
        }) => {
            const res = await callUpdateDepartmentSalaryGrade(payload.id, {
                gradeLevel: payload.gradeLevel,
            });
            if (!res?.data) throw new Error("Không thể cập nhật bậc lương");
            return res.data;
        },
        onSuccess: (_res, payload) => {
            notify.updated("Cập nhật bậc lương thành công");
            queryClient.invalidateQueries({
                queryKey: ["department-salary-grades", payload.departmentJobTitleId],
            });
        },
        onError: (err: any) => notify.error(err?.message || "Lỗi cập nhật"),
    });
};

/* =====================================================
   4. DELETE (SOFT DELETE)
===================================================== */
export const useDeleteDepartmentSalaryGradeMutation = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (payload: { id: number; departmentJobTitleId: number }) => {
            await callDeleteDepartmentSalaryGrade(payload.id); // Không check statusCode
            return true;
        },
        onSuccess: (_res, payload) => {
            notify.deleted("Đã xoá bậc lương");
            queryClient.invalidateQueries({
                queryKey: ["department-salary-grades", payload.departmentJobTitleId],
            });
        },
        onError: (err: any) =>
            notify.error(err?.message || "Không thể xoá bậc lương"),
    });
};


/* =====================================================
   5. RESTORE (NEW)
===================================================== */
export const useRestoreDepartmentSalaryGradeMutation = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (payload: { id: number; departmentJobTitleId: number }) => {
            const res = await callRestoreDepartmentSalaryGrade(payload.id);
            if (!res?.data) throw new Error("Không thể khôi phục bậc lương");
            return res.data;
        },
        onSuccess: (_res, payload) => {
            notify.success("Khôi phục bậc lương thành công");
            queryClient.invalidateQueries({
                queryKey: ["department-salary-grades", payload.departmentJobTitleId],
            });
        },
        onError: (err: any) => notify.error(err?.message || "Không thể khôi phục"),
    });
};
