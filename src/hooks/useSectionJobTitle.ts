/* ============================================
   SECTION - JOB TITLE HOOKS
   Chuẩn backend hiện tại (list thuần + restore)
============================================ */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    callFetchJobTitlesBySection,
    callCreateSectionJobTitle,
    callDeleteSectionJobTitle,
    callRestoreSectionJobTitle,
} from "@/config/api";
import { notify } from "@/components/common/notification/notify";

/* ======================================================
   1) FETCH LIST ACTIVE JOB TITLES OF SECTION
====================================================== */
export const useSectionJobTitlesQuery = (sectionId?: number) => {
    return useQuery({
        queryKey: ["section-job-titles", sectionId],
        enabled: !!sectionId,
        queryFn: async () => {
            if (!sectionId) throw new Error("Thiếu ID bộ phận");
            const res = await callFetchJobTitlesBySection(sectionId);
            return res.data ?? [];
        },
    });
};

/* ======================================================
   2) CREATE ASSIGN JOB TITLE → SECTION
   (tự động reactivate nếu đã inactive)
====================================================== */
export const useCreateSectionJobTitleMutation = () => {
    const qc = useQueryClient();

    return useMutation({
        mutationFn: (body: { sectionId: number; jobTitleId: number }) =>
            callCreateSectionJobTitle(body),

        onSuccess: (_, payload) => {
            notify.created("Gán chức danh thành công");
            qc.invalidateQueries({ queryKey: ["section-job-titles", payload.sectionId] });
        },

        onError: (err: any) => {
            notify.error(err?.response?.data?.message || "Lỗi khi gán chức danh");
        },
    });
};

/* ======================================================
   3) DELETE ASSIGNED JOB TITLE (SOFT DELETE / DEACTIVATE)
====================================================== */
export const useDeleteSectionJobTitleMutation = () => {
    const qc = useQueryClient();

    return useMutation({
        mutationFn: (params: { id: number; sectionId: number }) =>
            callDeleteSectionJobTitle(params.id),

        onSuccess: (_, params) => {
            notify.deleted("Đã hủy gán chức danh khỏi bộ phận");
            qc.invalidateQueries({ queryKey: ["section-job-titles", params.sectionId] });
        },

        onError: (err: any) => {
            notify.error(err?.response?.data?.message || "Lỗi khi hủy gán chức danh");
        },
    });
};
/* ======================================================
   4) RESTORE SECTION JOB TITLE (REACTIVATE)
====================================================== */
export const useRestoreSectionJobTitleMutation = () => {
    const qc = useQueryClient();

    return useMutation({
        mutationFn: (payload: { id: number; sectionId: number }) =>
            callRestoreSectionJobTitle(payload.id),

        onSuccess: (_res, payload) => {
            notify.success("Đã khôi phục chức danh vào bộ phận");
            qc.invalidateQueries({
                queryKey: ["section-job-titles", payload.sectionId],
            });
        },

        onError: (err: any) => {
            notify.error(err?.response?.data?.message || "Lỗi khi khôi phục chức danh");
        },
    });
};