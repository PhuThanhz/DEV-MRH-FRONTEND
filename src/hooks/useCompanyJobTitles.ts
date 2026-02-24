// src/hooks/useCompanyJobTitles.ts

/* ============================================
   COMPANY - JOB TITLE HOOKS
   Gán / hủy / khôi phục / list jobTitle gán trực tiếp ở công ty
============================================ */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    callFetchCompanyJobTitlesByCompany, // ✅ API tổng hợp (company + department + section)
    callCreateCompanyJobTitle,
    callDeleteCompanyJobTitle,
    callRestoreCompanyJobTitle,
} from "@/config/api";
import { notify } from "@/components/common/notification/notify";

/* =====================================================
   1. FETCH JOB TITLES GÁN TRỰC TIẾP Ở CÔNG TY (source=COMPANY)
===================================================== */
export const useCompanyJobTitlesQuery = (companyId?: number) => {
    return useQuery({
        queryKey: ["company-job-titles", companyId],
        enabled: !!companyId,
        queryFn: async () => {
            if (!companyId) throw new Error("Thiếu ID công ty");

            const res = await callFetchCompanyJobTitlesByCompany(companyId);

            // Chỉ lấy jobTitle gán TRỰC TIẾP ở cấp công ty (source === "COMPANY")
            return (res.data ?? [])
                .filter((x: any) => x.source === "COMPANY")
                .map((x: any) => ({
                    ...x,
                    jobTitle: x.jobTitle,
                }));
        },
    });
};

/* =====================================================
   2. GÁN CHỨC DANH VÀO CÔNG TY
===================================================== */
export const useCreateCompanyJobTitleMutation = () => {
    const qc = useQueryClient();

    return useMutation({
        mutationFn: (payload: { companyId: number; jobTitleId: number }) =>
            callCreateCompanyJobTitle(payload),

        onSuccess: (_res, payload) => {
            notify.success("Gán chức danh vào công ty thành công");
            qc.invalidateQueries({
                queryKey: ["company-job-titles", payload.companyId],
            });
        },

        onError: (err: any) => {
            notify.error(err?.response?.data?.message || "Lỗi khi gán chức danh vào công ty");
        },
    });
};

/* =====================================================
   3. HỦY GÁN CHỨC DANH (DEACTIVATE)
===================================================== */
export const useDeleteCompanyJobTitleMutation = () => {
    const qc = useQueryClient();

    return useMutation({
        mutationFn: (payload: { id: number; companyId: number }) =>
            callDeleteCompanyJobTitle(payload.id),

        onSuccess: (_res, payload) => {
            notify.success("Đã hủy gán chức danh khỏi công ty");
            qc.invalidateQueries({
                queryKey: ["company-job-titles", payload.companyId],
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
export const useRestoreCompanyJobTitleMutation = () => {
    const qc = useQueryClient();

    return useMutation({
        mutationFn: (payload: { id: number; companyId: number }) =>
            callRestoreCompanyJobTitle(payload.id),

        onSuccess: (_res, payload) => {
            notify.success("Đã khôi phục chức danh vào công ty");
            qc.invalidateQueries({
                queryKey: ["company-job-titles", payload.companyId],
            });
        },

        onError: (err: any) => {
            notify.error(err?.response?.data?.message || "Lỗi khi khôi phục chức danh");
        },
    });
};