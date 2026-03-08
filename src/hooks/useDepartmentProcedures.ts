import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    callFetchDepartmentProcedures,
    callCreateDepartmentProcedure,
    callUpdateDepartmentProcedure,
    callDeleteDepartmentProcedure,
} from "@/config/api";

import type {
    IDepartmentProcedure,
    IModelPaginate,
} from "@/types/backend";

/* ===================== FETCH LIST ===================== */
export const useDepartmentProceduresQuery = (query: string) => {
    return useQuery({
        queryKey: ["department-procedures", query],

        queryFn: async () => {
            const res = await callFetchDepartmentProcedures(query);

            if (!res?.data) {
                throw new Error("Không thể lấy danh sách quy trình phòng ban");
            }

            return res.data as IModelPaginate<IDepartmentProcedure>;
        },
    });
};

/* ===================== CREATE ===================== */
export const useCreateDepartmentProcedureMutation = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: IDepartmentProcedure) =>
            callCreateDepartmentProcedure(data),

        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ["department-procedures"],
            });
        },
    });
};

/* ===================== UPDATE ===================== */
export const useUpdateDepartmentProcedureMutation = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: IDepartmentProcedure) =>
            callUpdateDepartmentProcedure(data),

        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ["department-procedures"],
            });
        },
    });
};

/* ===================== DELETE ===================== */
export const useDeleteDepartmentProcedureMutation = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: number) =>
            callDeleteDepartmentProcedure(id),

        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ["department-procedures"],
            });
        },
    });
};