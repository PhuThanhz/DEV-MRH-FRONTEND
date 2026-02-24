import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    callFetchCompanyProcedure,
    callCreateCompanyProcedure,
    callUpdateCompanyProcedure,
    callToggleActiveCompanyProcedure,
} from "@/config/api";
import type { ICompanyProcedure, IModelPaginate } from "@/types/backend";
import { notify } from "@/components/common/notification/notify";

/* ===================== FETCH LIST ===================== */
export const useCompanyProceduresQuery = (query: string) => {
    return useQuery({
        queryKey: ["company-procedures", query],
        queryFn: async () => {
            const res = await callFetchCompanyProcedure(query);
            if (!res?.data)
                throw new Error("Không thể lấy danh sách quy trình công ty");
            return res.data as IModelPaginate<ICompanyProcedure>;
        },
    });
};

/* ===================== FETCH BY ID ===================== */
export const useCompanyProcedureByIdQuery = (id?: string) => {
    return useQuery({
        queryKey: ["company-procedure", id],
        enabled: !!id,
        queryFn: async () => {
            if (!id) throw new Error("Thiếu ID quy trình");
            const res = await callFetchCompanyProcedure(`filter=id:${id}`);
            if (!res?.data?.result?.length)
                throw new Error("Không tìm thấy thông tin quy trình");
            return res.data.result[0] as ICompanyProcedure;
        },
    });
};

/* ===================== CREATE ===================== */
export const useCreateCompanyProcedureMutation = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: ICompanyProcedure) => {
            const res = await callCreateCompanyProcedure(data);
            if (!res?.data)
                throw new Error(res?.message || "Không thể tạo quy trình");
            return res;
        },
        onSuccess: (res) => {
            notify.created(res?.message || "Tạo quy trình thành công");
            queryClient.invalidateQueries({ queryKey: ["company-procedures"] });
        },
        onError: (error: any) => {
            notify.error(error.message || "Lỗi khi tạo quy trình");
        },
    });
};

/* ===================== UPDATE ===================== */
export const useUpdateCompanyProcedureMutation = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: ICompanyProcedure) => {
            const res = await callUpdateCompanyProcedure(data);
            if (!res?.data)
                throw new Error(res?.message || "Không thể cập nhật quy trình");
            return res;
        },
        onSuccess: (res, variables) => {
            notify.updated(res?.message || "Cập nhật quy trình thành công");
            queryClient.invalidateQueries({ queryKey: ["company-procedures"] });
            if (variables?.id) {
                queryClient.invalidateQueries({ queryKey: ["company-procedure", variables.id] });
            }
        },
        onError: (error: any) => {
            notify.error(error.message || "Lỗi khi cập nhật quy trình");
        },
    });
};

/* ===================== TOGGLE ACTIVE ===================== */
export const useToggleActiveCompanyProcedureMutation = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            const res = await callToggleActiveCompanyProcedure(id);
            if (!res?.statusCode || res.statusCode !== 200) {
                throw new Error(res?.message || "Không thể cập nhật trạng thái quy trình");
            }
            return res.data;
        },
        onSuccess: () => {
            notify.updated("Cập nhật trạng thái quy trình thành công");
            queryClient.invalidateQueries({ queryKey: ["company-procedures"], exact: false });
        },
        onError: (error: any) => {
            notify.error(error.message || "Lỗi khi cập nhật trạng thái");
        },
    });
};
