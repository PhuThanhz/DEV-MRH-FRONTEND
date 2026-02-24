import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { ICompany, IModelPaginate } from "@/types/backend";
import {
    callFetchCompany,
    callCreateCompany,
    callUpdateCompany,
    callInactiveCompany,
    callActiveCompany,
} from "@/config/api";
import { notify } from "@/components/common/notification/notify";

// GET LIST
export const useCompaniesQuery = (query: string) => {
    return useQuery({
        queryKey: ["companies", query],
        queryFn: async () => {
            const res = await callFetchCompany(query);
            return res.data as IModelPaginate<ICompany>;
        },
    });
};

// CREATE
export const useCreateCompanyMutation = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: callCreateCompany,
        onSuccess: () => {
            notify.created("Tạo công ty thành công");
            qc.invalidateQueries({ queryKey: ["companies"] });
        },
    });
};

// UPDATE
export const useUpdateCompanyMutation = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: callUpdateCompany,
        onSuccess: () => {
            notify.updated("Cập nhật công ty thành công");
            qc.invalidateQueries({ queryKey: ["companies"] });
        },
    });
};

// INACTIVE
export const useInactiveCompanyMutation = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: number) => callInactiveCompany(id),
        onSuccess: () => {
            notify.updated("Đã vô hiệu hóa công ty");
            qc.invalidateQueries({ queryKey: ["companies"] });
        },
    });
};

// ACTIVE
export const useActiveCompanyMutation = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: number) => callActiveCompany(id),
        onSuccess: () => {
            notify.updated("Đã kích hoạt lại công ty");
            qc.invalidateQueries({ queryKey: ["companies"] });
        },
    });
};
