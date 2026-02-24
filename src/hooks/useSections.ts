import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    callFetchSection,
    callCreateSection,
    callUpdateSection,
    callDeleteSection,
    callActiveSection,
    callInactiveSection,
} from "@/config/api";

import type { ISection, IModelPaginate } from "@/types/backend";
import { notify } from "@/components/common/notification/notify";

// ======================================================
// FETCH LIST WITH PAGINATION
// ======================================================
export const useSectionsQuery = (query: string) => {
    return useQuery({
        queryKey: ["sections", query],
        queryFn: async () => {
            const res = await callFetchSection(query);
            if (!res?.data) throw new Error("Không thể lấy danh sách bộ phận");
            return res.data as IModelPaginate<ISection>;
        },
    });
};

// ======================================================
// FETCH ONE BY ID
// ======================================================
export const useSectionByIdQuery = (id?: number) => {
    return useQuery({
        queryKey: ["section", id],
        enabled: !!id,
        queryFn: async () => {
            if (!id) throw new Error("Thiếu ID bộ phận");
            const res = await callFetchSection(`filter=id:${id}`);
            if (!res?.data?.result?.length)
                throw new Error("Không tìm thấy bộ phận");
            return res.data.result[0] as ISection;
        },
    });
};

// ======================================================
// CREATE SECTION
// ======================================================
export const useCreateSectionMutation = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (body: any) => {
            const res = await callCreateSection(body);
            if (!res?.data)
                throw new Error(res?.message || "Không thể tạo bộ phận");
            return res;
        },
        onSuccess: (res) => {
            notify.created(res?.message || "Tạo bộ phận thành công");
            queryClient.invalidateQueries({ queryKey: ["sections"] });
        },
        onError: (err: any) => {
            notify.error(err.message || "Lỗi khi tạo bộ phận");
        },
    });
};

// ======================================================
// UPDATE SECTION
// ======================================================
export const useUpdateSectionMutation = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (body: any) => {
            const res = await callUpdateSection(body);
            if (!res?.data)
                throw new Error(res?.message || "Không thể cập nhật bộ phận");
            return res;
        },
        onSuccess: (res, payload) => {
            notify.updated(res?.message || "Cập nhật bộ phận thành công");
            queryClient.invalidateQueries({ queryKey: ["sections"] });
            if (payload?.id)
                queryClient.invalidateQueries({ queryKey: ["section", payload.id] });
        },
        onError: (err: any) =>
            notify.error(err.message || "Lỗi khi cập nhật bộ phận"),
    });
};

// ======================================================
// DELETE SECTION (SOFT DELETE = status = 0)
// ======================================================
export const useDeleteSectionMutation = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: number) => {
            const res = await callDeleteSection(id);
            if (!res?.statusCode || res.statusCode !== 200) {
                throw new Error(res?.message || "Không thể xóa bộ phận");
            }
            return res.data;
        },
        onSuccess: () => {
            notify.deleted("Xóa bộ phận thành công");
            queryClient.invalidateQueries({ queryKey: ["sections"], exact: false });
        },
        onError: (err: any) =>
            notify.error(err.message || "Lỗi khi xóa bộ phận"),
    });
};

// ======================================================
// ACTIVE SECTION
// ======================================================
export const useActiveSectionMutation = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: number) => {
            const res = await callActiveSection(id);
            return res;
        },
        onSuccess: (_, id) => {
            notify.success("Kích hoạt bộ phận thành công");
            queryClient.invalidateQueries({ queryKey: ["sections"] });
            queryClient.invalidateQueries({ queryKey: ["section", id] });
        },
        onError: () => notify.error("Không thể kích hoạt bộ phận"),
    });
};

// ======================================================
// INACTIVE SECTION
// ======================================================
export const useInactiveSectionMutation = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: number) => {
            const res = await callInactiveSection(id);
            return res;
        },
        onSuccess: (_, id) => {
            notify.success("Vô hiệu hoá bộ phận thành công");
            queryClient.invalidateQueries({ queryKey: ["sections"] });
            queryClient.invalidateQueries({ queryKey: ["section", id] });
        },
        onError: () => notify.error("Không thể vô hiệu hóa bộ phận"),
    });
};
