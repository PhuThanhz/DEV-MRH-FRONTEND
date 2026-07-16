import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    callFetchDepartment,
    callFetchDepartmentById,
    callCreateDepartment,
    callUpdateDepartment,
    callDeleteDepartment,
    callFetchDepartmentsByCompany,
} from "@/config/api";

import type {
    IDepartment,
    IModelPaginate,
    ICreateDepartmentReq,
    IUpdateDepartmentReq,
} from "@/types/backend";

import { notify } from "@/components/common/notification/notify";

/* =====================================================
   GET PAGINATED LIST
===================================================== */
export const useDepartmentsQuery = (query: string, enabled = true) => {
    return useQuery<IModelPaginate<IDepartment>>({
        queryKey: ["departments", query],
        enabled,
        queryFn: async () => {
            const res = await callFetchDepartment(query);
            const finalData = res?.data;
            if (!finalData) {
                throw new Error("Không thể lấy danh sách phòng ban");
            }
            return finalData;
        },
    });
};

/* =====================================================
   GET BY ID
===================================================== */
export const useDepartmentByIdQuery = (id?: number) => {
    return useQuery<IDepartment>({
        queryKey: ["department", id],
        enabled: typeof id === "number",
        queryFn: async () => {
            if (typeof id !== "number") {
                throw new Error("Thiếu ID phòng ban");
            }
            const res = await callFetchDepartmentById(id);
            const finalData = res?.data;
            if (!finalData) {
                throw new Error("Không tìm thấy phòng ban");
            }
            return finalData;
        },
    });
};

/* =====================================================
   GET BY COMPANY ID (cascade select)
===================================================== */
export const useDepartmentsByCompanyQuery = (companyId: number) => {
    return useQuery<IDepartment[]>({
        queryKey: ["departments", "by-company", companyId],
        enabled: !!companyId,
        queryFn: async () => {
            const res = await callFetchDepartmentsByCompany(companyId);
            if (!res?.data) {
                throw new Error("Không thể lấy danh sách phòng ban theo công ty");
            }
            return res.data;
        },
    });
};

/* =====================================================
   CREATE
===================================================== */
export const useCreateDepartmentMutation = () => {
    const qc = useQueryClient();

    return useMutation({
        mutationFn: (data: ICreateDepartmentReq) =>
            callCreateDepartment(data),
        onSuccess: () => {
            notify.created("Tạo phòng ban thành công");
            qc.invalidateQueries({ queryKey: ["departments"] });
        },
        onError: (err: any) => {
            notify.error(err?.message || "Lỗi khi tạo phòng ban");
        },
    });
};

/* =====================================================
   UPDATE
===================================================== */
export const useUpdateDepartmentMutation = () => {
    const qc = useQueryClient();

    return useMutation({
        mutationFn: ({
            id,
            data,
        }: {
            id: number;
            data: IUpdateDepartmentReq;
        }) => callUpdateDepartment(id, data),
        onSuccess: () => {
            notify.updated("Cập nhật phòng ban thành công");
            qc.invalidateQueries({ queryKey: ["departments"] });
        },
        onError: (err: any) => {
            notify.error(err?.message || "Lỗi khi cập nhật phòng ban");
        },
    });
};

/* =====================================================
   DELETE (SOFT DELETE)
===================================================== */
export const useDeleteDepartmentMutation = () => {
    const qc = useQueryClient();

    return useMutation({
        mutationFn: (id: number) => callDeleteDepartment(id),
        onSuccess: () => {
            notify.deleted("Đã tắt phòng ban");
            qc.invalidateQueries({ queryKey: ["departments"] });
        },
        onError: (err: any) => {
            notify.error(err?.message || "Lỗi khi xoá phòng ban");
        },
    });
};
