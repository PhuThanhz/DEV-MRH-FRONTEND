/* ============================================
   DEPARTMENT - JOB TITLE HOOKS
   Gán / hủy / khôi phục / list jobTitle gán trực tiếp ở phòng ban
============================================ */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    callFetchCompanyJobTitlesOfDepartment,
    callCreateDepartmentJobTitle,
    callDeleteDepartmentJobTitle,
    callRestoreDepartmentJobTitle,
    callFetchJobTitlesWithAssignStatus,
} from "@/config/api";
import { notify } from "@/components/common/notification/notify";
import type { IJobTitleAssignStatus } from "@/types/backend";

/* =====================================================
   1. FETCH JOB TITLES GÁN TRỰC TIẾP Ở PHÒNG BAN (source=DEPARTMENT)
===================================================== */
export const useDepartmentJobTitlesQuery = (departmentId?: number) => {
    return useQuery({
        queryKey: ["department-job-titles", departmentId],
        enabled: !!departmentId,
        queryFn: async () => {
            if (!departmentId) throw new Error("Thiếu ID phòng ban");

            const res = await callFetchCompanyJobTitlesOfDepartment(departmentId);

            // ⚠️ Chỉ lấy jobTitle gán TRỰC TIẾP ở phòng ban
            return (res.data ?? [])
                .filter((x: any) => x.source === "DEPARTMENT")
                .map((x: any) => ({
                    ...x,
                    jobTitle: x.jobTitle,
                }));
        },
    });
};

/* =====================================================
   2. GÁN CHỨC DANH VÀO PHÒNG BAN
===================================================== */
export const useCreateDepartmentJobTitleMutation = () => {
    const qc = useQueryClient();

    return useMutation({
        mutationFn: (payload: { departmentId: number; jobTitleId: number }) =>
            callCreateDepartmentJobTitle(payload),

        onSuccess: (_res, payload) => {
            notify.success("Gán chức danh thành công");
            qc.invalidateQueries({
                queryKey: ["department-job-titles", payload.departmentId],
            });
        },

        onError: (err: any) => {
            notify.error(err?.response?.data?.message || "Lỗi khi gán chức danh");
        },
    });
};

/* =====================================================
   3. HỦY GÁN CHỨC DANH (DEACTIVATE)
===================================================== */
export const useDeleteDepartmentJobTitleMutation = () => {
    const qc = useQueryClient();

    return useMutation({
        mutationFn: (payload: { id: number; departmentId: number }) =>
            callDeleteDepartmentJobTitle(payload.id),

        onSuccess: (_res, payload) => {
            notify.success("Đã hủy gán chức danh khỏi phòng ban");
            qc.invalidateQueries({
                queryKey: ["department-job-titles", payload.departmentId],
            });
        },

        onError: (err: any) => {
            notify.error(err?.response?.data?.message || "Lỗi khi hủy gán chức danh");
        },
    });
};

/* =====================================================
   4. KHÔI PHỤC GÁN CHỨC DANH (REACTIVATE)
===================================================== */
export const useRestoreDepartmentJobTitleMutation = () => {
    const qc = useQueryClient();

    return useMutation({
        mutationFn: (payload: { id: number; departmentId: number }) =>
            callRestoreDepartmentJobTitle(payload.id),

        onSuccess: (_res, payload) => {
            notify.success("Đã khôi phục chức danh vào phòng ban");
            qc.invalidateQueries({
                queryKey: ["department-job-titles", payload.departmentId],
            });
        },

        onError: (err: any) => {
            notify.error(err?.response?.data?.message || "Lỗi khi khôi phục chức danh");
        },
    });
};

/* =====================================================
   5. FETCH JOB TITLES KÈM TRẠNG THÁI GÁN (CHO MODAL)
   - Hỗ trợ filter: search, status, band, level
   - Hỗ trợ phân trang: page, size
===================================================== */
export interface IJobTitleAssignStatusParams {
    search?: string;
    status?: string;
    band?: string;
    level?: number;
    page?: number;
    size?: number;
}

export const useJobTitlesWithAssignStatusQuery = (
    departmentId?: number,
    params?: IJobTitleAssignStatusParams
) => {
    return useQuery({
        queryKey: ["job-titles-assign-status", departmentId, params],
        enabled: !!departmentId,
        queryFn: async () => {
            if (!departmentId) throw new Error("Thiếu ID phòng ban");

            const res = await callFetchJobTitlesWithAssignStatus(departmentId, params);

            // res.data là IModelPaginate<IJobTitleAssignStatus>
            return res.data ?? null;
        },
    });
};