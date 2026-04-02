import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    callFetchEmployees,
    callFetchEmployeeById,
    callCreateEmployee,
    callUpdateEmployee,
    callDeleteEmployee,
} from "@/config/api";

import type {
    IEmployee,
    IModelPaginate,
    ICreateEmployeeReq,
    IUpdateEmployeeReq,
} from "@/types/backend";

import { notify } from "@/components/common/notification/notify";

// ======================================================
// GET LIST
// ======================================================
export const useEmployeesQuery = (query: string) => {
    return useQuery({
        queryKey: ["employees", query],
        queryFn: async () => {
            const res = await callFetchEmployees(query);
            if (!res?.data) throw new Error("Không thể lấy danh sách nhân viên");
            return res.data as IModelPaginate<IEmployee>;
        },
    });
};

// ======================================================
// GET DETAIL
// ======================================================
export const useEmployeeByIdQuery = (id?: number) => {
    return useQuery({
        queryKey: ["employee", id],
        enabled: !!id,
        queryFn: async () => {
            if (!id) throw new Error("Thiếu ID nhân viên");

            const res = await callFetchEmployeeById(id);

            if (!res?.data)
                throw new Error("Không tìm thấy thông tin nhân viên");

            return res.data as IEmployee;
        },
    });
};

// ======================================================
// CREATE
// ======================================================
export const useCreateEmployeeMutation = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: ICreateEmployeeReq) => {
            const res = await callCreateEmployee(data);
            if (!res?.data)
                throw new Error(res?.message || "Không thể tạo nhân viên");
            return res;
        },
        onSuccess: (res) => {
            notify.created(res?.message || "Tạo nhân viên thành công");
            queryClient.invalidateQueries({ queryKey: ["employees"] });
        },
        onError: (error: any) => {
            notify.error(error.message || "Lỗi khi tạo nhân viên");
        },
    });
};

// ======================================================
// UPDATE
// ======================================================
export const useUpdateEmployeeMutation = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: IUpdateEmployeeReq) => {
            const res = await callUpdateEmployee(data);
            if (!res?.data)
                throw new Error(res?.message || "Không thể cập nhật nhân viên");
            return res;
        },
        onSuccess: (res, variables) => {
            notify.updated(res?.message || "Cập nhật nhân viên thành công");

            queryClient.invalidateQueries({ queryKey: ["employees"] });

            if (variables?.id) {
                queryClient.invalidateQueries({
                    queryKey: ["employee", variables.id],
                });
            }
        },
        onError: (error: any) => {
            notify.error(error.message || "Lỗi khi cập nhật nhân viên");
        },
    });
};

// ======================================================
// DELETE
// ======================================================
export const useDeleteEmployeeMutation = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: number) => {
            const res = await callDeleteEmployee(id);

            if (!res?.statusCode || res.statusCode !== 200) {
                throw new Error(res?.message || "Không thể xóa nhân viên");
            }

            return res.data;
        },
        onSuccess: () => {
            notify.deleted("Xóa nhân viên thành công");

            queryClient.invalidateQueries({
                queryKey: ["employees"],
                exact: false,
            });
        },
        onError: (error: any) => {
            notify.error(error.message || "Lỗi khi xóa nhân viên");
        },
    });
};