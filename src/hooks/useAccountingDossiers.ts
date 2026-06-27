import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
    callCreateAccountingDossier,
    callDeleteAccountingDossier,
    callFetchAccountingDossierById,
    callFetchAccountingDossierLogs,
    callFetchAccountingDossiers,
    callRequestReturnAccountingDossier,
    callSubmitAccountingDossier,
    callUpdateAccountingDossier,
} from "@/config/api";
import type {
    IAccountingDossier,
    IAccountingDossierAuditLog,
    IAccountingDossierRequest,
    IModelPaginate,
} from "@/types/backend";
import { notify } from "@/components/common/notification/notify";

const ACCOUNTING_DOSSIERS_KEY = "accounting-dossiers";

export const useAccountingDossiersQuery = (query: string) => {
    return useQuery({
        queryKey: [ACCOUNTING_DOSSIERS_KEY, query],
        queryFn: async () => {
            const res = await callFetchAccountingDossiers(query);
            if (!res?.data) {
                throw new Error("Không thể lấy danh sách bộ chứng từ kế toán");
            }
            return res.data as IModelPaginate<IAccountingDossier>;
        },
    });
};

export const useAccountingDossierByIdQuery = (id?: number) => {
    return useQuery({
        queryKey: ["accounting-dossier", id],
        enabled: !!id,
        queryFn: async () => {
            if (!id) throw new Error("Thiếu ID bộ chứng từ");
            const res = await callFetchAccountingDossierById(id);
            if (!res?.data) throw new Error("Không tìm thấy bộ chứng từ");
            return res.data as IAccountingDossier;
        },
    });
};

export const useAccountingDossierLogsQuery = (id?: number) => {
    return useQuery({
        queryKey: ["accounting-dossier-logs", id],
        enabled: !!id,
        queryFn: async () => {
            if (!id) return [];
            const res = await callFetchAccountingDossierLogs(id);
            return (res?.data ?? []) as IAccountingDossierAuditLog[];
        },
    });
};

export const useCreateAccountingDossierMutation = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: IAccountingDossierRequest) => {
            const res = await callCreateAccountingDossier(data);
            if (!res?.data) throw new Error(res?.message || "Không thể tạo bộ chứng từ");
            return res;
        },
        onSuccess: (res) => {
            notify.created(res?.message || "Tạo bộ chứng từ thành công");
            queryClient.invalidateQueries({ queryKey: [ACCOUNTING_DOSSIERS_KEY], exact: false });
        },
        onError: (error: any) => {
            notify.error(error?.message || "Lỗi khi tạo bộ chứng từ");
        },
    });
};

export const useUpdateAccountingDossierMutation = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, data }: { id: number; data: IAccountingDossierRequest }) => {
            const res = await callUpdateAccountingDossier(id, data);
            if (!res?.data) throw new Error(res?.message || "Không thể cập nhật bộ chứng từ");
            return res;
        },
        onSuccess: (res, variables) => {
            notify.updated(res?.message || "Cập nhật bộ chứng từ thành công");
            queryClient.invalidateQueries({ queryKey: [ACCOUNTING_DOSSIERS_KEY], exact: false });
            queryClient.invalidateQueries({ queryKey: ["accounting-dossier", variables.id] });
        },
        onError: (error: any) => {
            notify.error(error?.message || "Lỗi khi cập nhật bộ chứng từ");
        },
    });
};

export const useDeleteAccountingDossierMutation = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: number) => {
            const res = await callDeleteAccountingDossier(id);
            if (res?.statusCode && Number(res.statusCode) >= 400) {
                throw new Error(res?.message || "Không thể xoá bộ chứng từ");
            }
            return res;
        },
        onSuccess: () => {
            notify.deleted("Xoá bộ chứng từ thành công");
            queryClient.invalidateQueries({ queryKey: [ACCOUNTING_DOSSIERS_KEY], exact: false });
        },
        onError: (error: any) => {
            notify.error(error?.message || "Lỗi khi xoá bộ chứng từ");
        },
    });
};

export const useSubmitAccountingDossierMutation = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: number) => {
            const res = await callSubmitAccountingDossier(id);
            if (!res?.data) throw new Error(res?.message || "Không thể chuyển xử lý bộ chứng từ");
            return res;
        },
        onSuccess: (res, id) => {
            notify.success(res?.message || "Chuyển xử lý bộ chứng từ thành công");
            queryClient.invalidateQueries({ queryKey: [ACCOUNTING_DOSSIERS_KEY], exact: false });
            queryClient.invalidateQueries({ queryKey: ["accounting-dossier", id] });
        },
        onError: (error: any) => {
            notify.error(error?.message || "Lỗi khi chuyển xử lý bộ chứng từ");
        },
    });
};

export const useRequestReturnAccountingDossierMutation = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, note }: { id: number; note?: string }) => {
            const res = await callRequestReturnAccountingDossier(id, note);
            if (!res?.data) throw new Error(res?.message || "Không thể gửi yêu cầu hoàn chứng từ");
            return res;
        },
        onSuccess: (res, variables) => {
            notify.success(res?.message || "Đã gửi yêu cầu hoàn chứng từ");
            queryClient.invalidateQueries({ queryKey: [ACCOUNTING_DOSSIERS_KEY], exact: false });
            queryClient.invalidateQueries({ queryKey: ["accounting-dossier", variables.id] });
            queryClient.invalidateQueries({ queryKey: ["accounting-dossier-logs", variables.id] });
        },
        onError: (error: any) => {
            notify.error(error?.message || "Lỗi khi gửi yêu cầu hoàn chứng từ");
        },
    });
};
