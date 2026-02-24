// ======================================================================
//  HOOK SALARY MODULE — CHUẨN HOÀN TOÀN
// ======================================================================

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import {
    callFetchSalaryMatrix,
    callUpsertSalaryStructure,
} from "@/config/api";

import type {
    ISalaryMatrix,
    ISalaryStructure,
    IReqSalaryStructure,
} from "@/types/backend";

import { notify } from "@/components/common/notification/notify";

// ======================================================================
// 1) LẤY BẢNG MA TRẬN LƯƠNG (JOB_TITLE × GRADE)
// ======================================================================

export const useSalaryMatrixQuery = (departmentId?: number) => {
    return useQuery({
        queryKey: ["salary-matrix", departmentId],
        enabled: !!departmentId,
        queryFn: async () => {
            const res = await callFetchSalaryMatrix(departmentId!);

            if (!res?.data) {
                throw new Error("Không thể tải bảng khung lương");
            }

            return res.data as ISalaryMatrix[];
        },
    });
};

// ======================================================================
// 2) LẤY CẤU TRÚC LƯƠNG TỪ LOCAL MATRIX (KHÔNG GỌI API!)
// ======================================================================

export const useLocalSalaryStructure = (
    matrix?: ISalaryMatrix[],
    jobTitleId?: number,
    gradeLevel?: number
): ISalaryStructure | null => {
    if (!matrix || !jobTitleId || !gradeLevel) return null;

    const row = matrix.find((r) => r.jobTitleId === jobTitleId);
    if (!row) return null;

    const cell = row.grades.find((g) => g.gradeLevel === gradeLevel);
    return cell?.structure ?? null;
};

// ======================================================================
// 3) UPSERT CẤU TRÚC LƯƠNG (THÁNG + GIỜ)
// ======================================================================

export const useUpsertSalaryStructureMutation = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (body: IReqSalaryStructure) => {
            const res = await callUpsertSalaryStructure(body);

            if (!res?.data) {
                throw new Error(res?.message || "Không thể lưu cấu trúc lương");
            }

            return res.data;
        },

        onSuccess: () => {
            notify.success("Đã lưu cấu trúc lương");

            // CHỈ cần reload lại bảng matrix
            queryClient.invalidateQueries({ queryKey: ["salary-matrix"] });
        },

        onError: (error: any) => {
            notify.error(error?.message || "Lỗi khi lưu cấu trúc lương");
        },
    });
};
