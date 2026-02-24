import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    callFetchCompanySalaryGrades,
    callCreateCompanySalaryGrade,
    callUpdateCompanySalaryGrade,
    callDeleteCompanySalaryGrade,
    callRestoreCompanySalaryGrade
} from "@/config/api";
import { notify } from "@/components/common/notification/notify";

import type { ICompanySalaryGrade } from "@/types/backend";

/* =====================================================
   1. FETCH LIST
===================================================== */
export const useCompanySalaryGradesQuery = (companyJobTitleId?: number) => {
    return useQuery({
        queryKey: ["company-salary-grades", companyJobTitleId],
        enabled: !!companyJobTitleId,
        queryFn: async () => {
            const res = await callFetchCompanySalaryGrades(companyJobTitleId!);
            if (!res?.data) throw new Error("Không thể tải danh sách bậc lương");
            return res.data;
        }
    });
};

/* =====================================================
   2. CREATE 
===================================================== */
export const useCreateCompanySalaryGradeMutation = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (payload: { companyJobTitleId: number; gradeLevel: number }) => {
            const res = await callCreateCompanySalaryGrade(payload);
            if (!res.data) throw new Error("Không thể tạo bậc lương");
            return res.data;
        },
        onSuccess: (_res, payload) => {
            notify.created("Thêm bậc lương thành công");
            queryClient.invalidateQueries({
                queryKey: ["company-salary-grades", payload.companyJobTitleId],
            });
        },
        onError: (err: any) => notify.error(err.message)
    });
};

/* =====================================================
   3. UPDATE 
===================================================== */
export const useUpdateCompanySalaryGradeMutation = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (payload: { id: number; gradeLevel: number; companyJobTitleId: number }) => {
            const res = await callUpdateCompanySalaryGrade(payload.id, {
                gradeLevel: payload.gradeLevel,
            });
            if (!res.data) throw new Error("Không thể cập nhật bậc lương");
            return res.data;
        },
        onSuccess: (_res, payload) => {
            notify.updated("Cập nhật thành công");
            queryClient.invalidateQueries({
                queryKey: ["company-salary-grades", payload.companyJobTitleId],
            });
        },
        onError: (err: any) => notify.error(err.message)
    });
};

/* =====================================================
   4. DELETE (SOFT)
===================================================== */
export const useDeleteCompanySalaryGradeMutation = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (payload: { id: number; companyJobTitleId: number }) => {
            await callDeleteCompanySalaryGrade(payload.id); // Không kiểm tra statusCode
            return true;
        },
        onSuccess: (_res, payload) => {
            notify.deleted("Đã xoá bậc lương");
            queryClient.invalidateQueries({
                queryKey: ["company-salary-grades", payload.companyJobTitleId],
            });
        },
        onError: (err: any) =>
            notify.error(err?.message || "Không thể xoá bậc lương"),
    });
};


/* =====================================================
   5. RESTORE (NEW)
===================================================== */
export const useRestoreCompanySalaryGradeMutation = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (payload: { id: number; companyJobTitleId: number }) => {
            const res = await callRestoreCompanySalaryGrade(payload.id);
            if (!res?.data) throw new Error("Không thể khôi phục bậc lương");
            return res.data;
        },
        onSuccess: (_res, payload) => {
            notify.success("Khôi phục thành công");
            queryClient.invalidateQueries({
                queryKey: ["company-salary-grades", payload.companyJobTitleId],
            });
        },
        onError: (err: any) => notify.error(err.message)
    });
};
