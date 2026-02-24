// ======================================================================
//     HOOK SALARY MODULE — HOÀN CHỈNH & ĐỒNG BỘ VỚI BACKEND
// ======================================================================

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import {
    callFetchSalaryMatrix,
    callGetSalaryStructure,
    callUpsertSalaryStructure,
} from "@/config/api";

import type {
    ISalaryMatrix,
    ISalaryStructure,
    IReqSalaryStructure,
} from "@/types/backend";

import { notify } from "@/components/common/notification/notify";

// ======================================================================
// 1) LẤY BẢNG KHUNG LƯƠNG 2 CHIỀU THEO PHÒNG BAN
// ======================================================================

export const useSalaryMatrixQuery = (departmentId?: number) => {
    return useQuery({
        queryKey: ["salary-matrix", departmentId],
        enabled: !!departmentId,
        queryFn: async () => {
            const res = await callFetchSalaryMatrix(departmentId!);
            if (!res?.data)
                throw new Error("Không thể tải bảng khung lương");
            return res.data as ISalaryMatrix[];
        },
    });
};

// ======================================================================
// 2) LẤY 1 CẤU TRÚC LƯƠNG CỤ THỂ (DÙNG CHO EDIT Ô)
// ======================================================================
// Backend chỉ có API GET /salary-structures/{id}
// => FE phải truyền id (nếu muốn load cấu trúc tồn tại)
// ======================================================================

export const useSalaryStructureQuery = (structureId?: number) => {
    return useQuery({
        queryKey: ["salary-structure", structureId],
        enabled: !!structureId,
        queryFn: async () => {
            const res = await callGetSalaryStructure(structureId!);
            return res?.data ?? null;
        },
    });
};

// ======================================================================
// 3) UPSERT CẤU TRÚC LƯƠNG (THÁNG + GIỜ)
// ======================================================================

export const useUpsertSalaryStructureMutation = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (body: IReqSalaryStructure) => {
            const res = await callUpsertSalaryStructure(body);
            if (!res?.data)
                throw new Error(res?.message || "Không thể lưu cấu trúc lương");
            return res.data;
        },

        onSuccess: () => {
            notify.success("Đã lưu cấu trúc lương");
            queryClient.invalidateQueries({ queryKey: ["salary-matrix"] });
            queryClient.invalidateQueries({ queryKey: ["salary-structure"] });
        },

        onError: (error: any) => {
            notify.error(error?.message || "Lỗi khi lưu cấu trúc lương");
        },
    });
};
