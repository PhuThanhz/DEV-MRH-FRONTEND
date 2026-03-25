import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    callGetCareerPathTemplatesByDepartment,
    callCreateCareerPathTemplate,
    callUpdateCareerPathTemplate,
    callDeactivateCareerPathTemplate,
    callActivateCareerPathTemplate,
} from "@/config/api";
import { notify } from "@/components/common/notification/notify";
import type { ICareerPathTemplate, ICareerPathTemplateRequest } from "@/types/backend";

/* =====================================================
   QUERIES
===================================================== */

/** Lấy tất cả template theo phòng ban (bao gồm inactive) */
export const useCareerPathTemplatesByDepartmentQuery = (departmentId?: number) => {
    return useQuery({
        queryKey: ["career-path-templates", departmentId],
        enabled: !!departmentId,
        queryFn: async () => {
            const res = await callGetCareerPathTemplatesByDepartment(departmentId!);
            return (res?.data ?? []) as ICareerPathTemplate[];
        },
    });
};

/* =====================================================
   MUTATIONS
===================================================== */

/** Tạo template mới */
export const useCreateCareerPathTemplateMutation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (data: ICareerPathTemplateRequest) => {
            const res = await callCreateCareerPathTemplate(data);
            if (!res?.data) throw new Error(res?.message || "Tạo template thất bại");
            return res;
        },
        onSuccess: (res) => {
            notify.created(res?.message || "Tạo template thành công");
            queryClient.invalidateQueries({ queryKey: ["career-path-templates"] });
        },
        onError: (err: any) => {
            notify.error(err.message || "Lỗi khi tạo template");
        },
    });
};

/** Cập nhật template */
export const useUpdateCareerPathTemplateMutation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, data }: { id: number; data: ICareerPathTemplateRequest }) => {
            const res = await callUpdateCareerPathTemplate(id, data);
            if (!res?.data) throw new Error(res?.message || "Cập nhật thất bại");
            return res;
        },
        onSuccess: (res) => {
            notify.updated(res?.message || "Cập nhật template thành công");
            queryClient.invalidateQueries({ queryKey: ["career-path-templates"] });
        },
        onError: (err: any) => {
            notify.error(err.message || "Lỗi khi cập nhật template");
        },
    });
};

/** Vô hiệu hoá template */
export const useDeactivateCareerPathTemplateMutation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: number) => {
            return callDeactivateCareerPathTemplate(id);
        },
        onSuccess: () => {
            notify.updated("Đã tắt template");
            queryClient.invalidateQueries({ queryKey: ["career-path-templates"] });
        },
        onError: (err: any) => {
            notify.error(err?.response?.data?.message || "Lỗi khi tắt template");
        },
    });
};

/** Kích hoạt lại template */
export const useActivateCareerPathTemplateMutation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: number) => {
            return callActivateCareerPathTemplate(id);
        },
        onSuccess: () => {
            notify.updated("Đã bật lại template");
            queryClient.invalidateQueries({ queryKey: ["career-path-templates"] });
        },
        onError: (err: any) => {
            notify.error(err?.response?.data?.message || "Lỗi khi bật template");
        },
    });
};