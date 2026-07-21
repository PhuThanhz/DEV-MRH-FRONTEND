import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    callFetchProcedures,
    callFetchProcedureById,
    callCreateProcedure,
    callUpdateProcedure,
    callDeleteProcedure,
    callToggleActiveProcedure,
    callFetchProcedureHistory,
    callFetchProceduresByDepartment,
    callFetchProceduresBySection,
    callFetchProceduresByCompany,
    callFetchCompanyProceduresWithFilter,
    callFetchDepartmentProceduresWithFilter,
    callFetchConfidentialProceduresWithFilter,
    callReviseProcedure,
    callFetchProcedureAccessList,
    callRevokeProcedureAccess,
    callShareProcedure,
    callFetchSentShareLog,
    callFetchReceivedShareLog,
    callFetchAllShareLog,
    callCreateShareToken,
    callFetchShareTokens,
    callRevokeShareToken,
    callPublicViewProcedure,
    callPublicVerifyPin,
    callFetchShareTokenAccessLogs,
    callSendShareEmail
} from "@/config/api";
import type {
    IModelPaginate,
    IProcedure,
    IProcedureHistory,
    IProcedureRequest,
    ProcedureType,
    IAccessDTO,
    IShareLogDTO,
    ICreateShareTokenRequest,
    IResShareTokenDTO,
    IResPublicProcedureDTO,
} from "@/types/backend";
import { notify } from "@/components/common/notification/notify";

/* ===================== FETCH LIST ===================== */
export const useProceduresQuery = (type: ProcedureType, query: string) => {
    return useQuery({
        queryKey: ["procedures", type, query],
        queryFn: async () => {
            const res = await callFetchProcedures(type, query);
            if (!res?.data) {
                throw new Error("Không thể lấy danh sách quy trình");
            }
            return res.data as IModelPaginate<IProcedure>;
        },
    });
};

/* ===================== FETCH BY ID ===================== */
export const useProcedureByIdQuery = (type: ProcedureType, id?: number) => {
    return useQuery({
        queryKey: ["procedure", type, id],
        enabled: !!id,
        queryFn: async () => {
            if (!id) throw new Error("Thiếu ID quy trình");
            const res = await callFetchProcedureById(type, id);
            if (!res?.data) {
                throw new Error("Không tìm thấy quy trình");
            }
            return res.data as IProcedure;
        },
    });
};

/* ===================== FETCH BY DEPARTMENT ===================== */
export const useProceduresByDepartmentQuery = (
    type: ProcedureType,
    departmentId?: number
) => {
    return useQuery({
        queryKey: ["procedures-by-department", type, departmentId],
        enabled: !!departmentId,
        queryFn: async () => {
            if (!departmentId) throw new Error("Thiếu ID phòng ban");
            const res = await callFetchProceduresByDepartment(type, departmentId);
            if (!res?.data) {
                throw new Error("Không thể lấy danh sách quy trình theo phòng ban");
            }
            return res.data as IProcedure[];
        },
    });
};

/* ===================== FETCH BY SECTION ===================== */
export const useProceduresBySectionQuery = (
    type: ProcedureType,
    sectionId?: number
) => {
    return useQuery({
        queryKey: ["procedures-by-section", type, sectionId],
        enabled: !!sectionId,
        queryFn: async () => {
            if (!sectionId) throw new Error("Thiếu ID bộ phận");
            const res = await callFetchProceduresBySection(type, sectionId);
            if (!res?.data) {
                throw new Error("Không thể lấy danh sách quy trình theo bộ phận");
            }
            return res.data as IProcedure[];
        },
    });
};

/* ===================== FETCH HISTORY ===================== */
export const useProcedureHistoryQuery = (type: ProcedureType, id?: number) => {
    return useQuery({
        queryKey: ["procedure-history", type, id],
        enabled: !!id,
        queryFn: async () => {
            if (!id) throw new Error("Thiếu ID quy trình");
            const res = await callFetchProcedureHistory(type, id);
            if (!res?.data) {
                throw new Error("Không thể lấy lịch sử quy trình");
            }
            return res.data as IProcedureHistory[];
        },
    });
};

/* ===================== CREATE ===================== */
export const useCreateProcedureMutation = (type: ProcedureType) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: IProcedureRequest) => {
            const res = await callCreateProcedure(type, data);
            if (!res?.data) {
                throw new Error(res?.message || "Không thể tạo quy trình");
            }
            return res;
        },
        onSuccess: (res) => {
            notify.created(res?.message || "Tạo quy trình thành công");
            queryClient.invalidateQueries({ queryKey: ["procedures", type] });
        },
        onError: (error: any) => {
            notify.error(error.message || "Không thể tạo quy trình");
        },
    });
};

/* ===================== UPDATE ===================== */
export const useUpdateProcedureMutation = (type: ProcedureType) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, data }: { id: number; data: IProcedureRequest }) => {
            const res = await callUpdateProcedure(type, id, data);
            if (!res?.data) {
                throw new Error(res?.message || "Không thể cập nhật quy trình");
            }
            return res;
        },
        onSuccess: (res, variables) => {
            notify.updated(res?.message || "Cập nhật quy trình thành công");
            queryClient.invalidateQueries({ queryKey: ["procedures", type] });
            queryClient.invalidateQueries({ queryKey: ["procedure", type, variables.id] });
            queryClient.invalidateQueries({ queryKey: ["procedure-history", type, variables.id] });
        },
        onError: (error: any) => {
            notify.error(error.message || "Không thể cập nhật quy trình");
        },
    });
};

/* ===================== DELETE ===================== */
export const useDeleteProcedureMutation = (type: ProcedureType) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: number) => {
            const res = await callDeleteProcedure(type, id);
            if (res?.statusCode && Number(res.statusCode) >= 400) {
                throw new Error(res?.message || "Không thể xoá quy trình");
            }
            return res;
        },
        onSuccess: () => {
            notify.deleted("Xoá quy trình thành công");
            queryClient.invalidateQueries({ queryKey: ["procedures", type] });
        },
        onError: (error: any) => {
            notify.error(error.message || "Không thể xoá quy trình");
        },
    });
};

/* ===================== TOGGLE ACTIVE ===================== */
export const useToggleActiveProcedureMutation = (type: ProcedureType) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: number) => {
            const res = await callToggleActiveProcedure(type, id);
            if (res?.statusCode && Number(res.statusCode) >= 400) {
                throw new Error(res?.message || "Không thể cập nhật trạng thái quy trình");
            }
            return res;
        },
        onSuccess: () => {
            notify.updated("Cập nhật trạng thái quy trình thành công");
            queryClient.invalidateQueries({ queryKey: ["procedures", type], exact: false });
        },
        onError: (error: any) => {
            notify.error(error.message || "Không thể cập nhật trạng thái");
        },
    });
};

/* ===================== FETCH BY COMPANY ===================== */
export const useProceduresByCompanyQuery = (
    type: ProcedureType,
    companyId?: number
) => {
    return useQuery({
        queryKey: ["procedures-by-company", type, companyId],
        enabled: !!companyId,
        queryFn: async () => {
            if (!companyId) throw new Error("Thiếu ID công ty");
            const res = await callFetchProceduresByCompany(type, companyId);
            if (!res?.data) {
                throw new Error("Không thể lấy danh sách quy trình theo công ty");
            }
            return res.data as IProcedure[];
        },
    });
};

/* ===================== FETCH COMPANY WITH FILTER ===================== */
export const useCompanyProceduresWithFilterQuery = (query: string, enabled = true) => {
    return useQuery({
        queryKey: ["procedures-company-filter", query],
        enabled,
        queryFn: async () => {
            const res = await callFetchCompanyProceduresWithFilter(query);
            if (!res?.data) throw new Error("Không thể lấy danh sách quy trình công ty");
            return res.data as IModelPaginate<IProcedure>;
        },
    });
};

/* ===================== FETCH DEPARTMENT WITH FILTER ===================== */
export const useDepartmentProceduresWithFilterQuery = (query: string, enabled = true) => {
    return useQuery({
        queryKey: ["procedures-department-filter", query],
        enabled,
        queryFn: async () => {
            const res = await callFetchDepartmentProceduresWithFilter(query);
            if (!res?.data) throw new Error("Không thể lấy danh sách quy trình phòng ban");
            return res.data as IModelPaginate<IProcedure>;
        },
    });
};

/* ===================== FETCH CONFIDENTIAL WITH FILTER ===================== */
export const useConfidentialProceduresWithFilterQuery = (query: string, enabled = true) => {
    return useQuery({
        queryKey: ["procedures-confidential-filter", query],
        enabled,
        queryFn: async () => {
            const res = await callFetchConfidentialProceduresWithFilter(query);
            if (!res?.data) throw new Error("Không thể lấy danh sách quy trình bảo mật");
            return res.data as IModelPaginate<IProcedure>;
        },
    });
};

/* ===================== REVISE (TẠO PHIÊN BẢN MỚI) ===================== */
export const useReviseProcedureMutation = (type: ProcedureType) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, data }: { id: number; data: IProcedureRequest }) => {
            const res = await callReviseProcedure(type, id, data);
            if (!res?.data) {
                throw new Error(res?.message || "Không thể tạo phiên bản mới");
            }
            return res;
        },
        onSuccess: (res, variables) => {
            notify.updated(res?.message || "Tạo phiên bản mới thành công");
            queryClient.invalidateQueries({ queryKey: ["procedures", type] });
            queryClient.invalidateQueries({ queryKey: ["procedure", type, variables.id] });
            queryClient.invalidateQueries({ queryKey: ["procedure-history", type, variables.id] });
        },
        onError: (error: any) => {
            notify.error(error.message || "Không thể tạo phiên bản mới");
        },
    });
};

/* ===================== SHARE ===================== */
// Backend trả ResponseEntity<Void> nên không có data trong response
// → check lỗi theo statusCode thay vì !res?.data
export const useShareProcedureMutation = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, userIds }: { id: number; userIds: string[] }) => {
            const res = await callShareProcedure(id, userIds);
            if (res?.statusCode && Number(res.statusCode) >= 400) {
                throw new Error(res?.message || "Không thể chia sẻ");
            }
            return res;
        },
        onSuccess: (_, variables) => {
            notify.updated("Chia sẻ quy trình thành công");
            queryClient.invalidateQueries({ queryKey: ["procedure-access", variables.id] });
        },
        onError: (error: any) => {
            notify.error(error.message || "Không thể chia sẻ quy trình");
        },
    });
};

/* ===================== ACCESS LIST ===================== */
export const useProcedureAccessListQuery = (id?: number, enabled = true) => {
    return useQuery({
        queryKey: ["procedure-access", id],
        enabled: !!id && enabled,
        queryFn: async () => {
            const res = await callFetchProcedureAccessList(id!);
            return (res.data as IAccessDTO[]) ?? [];
        },
    });
};

/* ===================== REVOKE ===================== */
// Thêm check lỗi từ response để onError chạy đúng khi backend trả 403/404
export const useRevokeProcedureAccessMutation = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, userId }: { id: number; userId: string }) => {
            const res = await callRevokeProcedureAccess(id, userId);
            if (res?.statusCode && Number(res.statusCode) >= 400) {
                throw new Error(res?.message || "Thu hồi thất bại");
            }
            return res;
        },
        onSuccess: (_, variables) => {
            notify.deleted("Thu hồi quyền thành công");
            queryClient.invalidateQueries({ queryKey: ["share-log-sent"] });
            queryClient.invalidateQueries({ queryKey: ["share-log-received"] });
            queryClient.invalidateQueries({ queryKey: ["share-log-all"] });
            queryClient.invalidateQueries({ queryKey: ["procedure-access", variables.id] });
        },
        onError: (error: any) => {
            notify.error(error?.message || "Không thể thu hồi");
        },
    });
};

/* ===================== SHARE LOG — ĐÃ GỬI ===================== */
export const useSentShareLogQuery = (enabled = true) => {
    return useQuery({
        queryKey: ["share-log-sent"],
        enabled,
        queryFn: async () => {
            const res = await callFetchSentShareLog();
            return (res.data as IShareLogDTO[]) ?? [];
        },
    });
};

/* ===================== SHARE LOG — ĐÃ NHẬN ===================== */
export const useReceivedShareLogQuery = (enabled = true) => {
    return useQuery({
        queryKey: ["share-log-received"],
        enabled,
        queryFn: async () => {
            const res = await callFetchReceivedShareLog();
            return (res.data as IShareLogDTO[]) ?? [];
        },
    });
};

/* ===================== SHARE LOG — TẤT CẢ (ADMIN) ===================== */
export const useAllShareLogQuery = (query: string, enabled = true) => {
    return useQuery({
        queryKey: ["share-log-all", query],
        enabled,
        queryFn: async () => {
            const res = await callFetchAllShareLog(query);
            return (res.data as IModelPaginate<IShareLogDTO>) ?? { result: [], meta: {} };
        },
    });
};
/* ===================== FETCH SHARE TOKENS ===================== */
export const useShareTokensQuery = (
    procedureId?: number,
    procedureType?: string,
    enabled = true
) => {
    return useQuery({
        queryKey: ["share-tokens", procedureId, procedureType],
        enabled: !!procedureId && !!procedureType && enabled,
        queryFn: async () => {
            const res = await callFetchShareTokens(procedureId!, procedureType!);
            return (res.data as IResShareTokenDTO[]) ?? [];
        },
    });
};

/* ===================== CREATE SHARE TOKEN ===================== */
export const useCreateShareTokenMutation = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({
            procedureId,
            data,
        }: {
            procedureId: number;
            data: ICreateShareTokenRequest;
        }) => {
            const res = await callCreateShareToken(procedureId, data);
            if (!res?.data) {
                throw new Error(res?.message || "Không thể tạo link chia sẻ");
            }
            return res.data as IResShareTokenDTO;
        },
        onSuccess: (_, variables) => {
            notify.created("Tạo liên kết chia sẻ thành công");
            queryClient.invalidateQueries({
                queryKey: ["share-tokens", variables.procedureId],
            });
        },
        onError: (error: any) => {
            notify.error(error.message || "Không thể tạo liên kết chia sẻ");
        },
    });
};

/* ===================== REVOKE SHARE TOKEN ===================== */
export const useRevokeShareTokenMutation = (procedureId?: number) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (tokenId: number) => {
            const res = await callRevokeShareToken(tokenId);
            if (res?.statusCode && Number(res.statusCode) >= 400) {
                throw new Error(res?.message || "Thu hồi thất bại");
            }
            return res;
        },
        onSuccess: () => {
            notify.deleted("Thu hồi liên kết chia sẻ thành công");
            queryClient.invalidateQueries({
                queryKey: ["share-tokens", procedureId],
            });
        },
        onError: (error: any) => {
            notify.error(error.message || "Không thể thu hồi liên kết chia sẻ");
        },
    });
};

/* ===================== PUBLIC VIEW (không cần JWT) ===================== */
export const usePublicViewQuery = (token?: string) => {
    return useQuery({
        queryKey: ["public-view", token],
        enabled: !!token,
        retry: false,
        queryFn: async () => {
            const res = await callPublicViewProcedure(token!);
            if (!res?.data) throw new Error("Không tìm thấy quy trình");
            return res.data;
        },
    });
};

/* ===================== PUBLIC VERIFY PIN ===================== */
export const usePublicVerifyPinMutation = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ token, pin }: { token: string; pin: string }) => {
            const res = await callPublicVerifyPin(token, pin);
            if (!res?.data) {
                throw new Error(res?.message || "PIN không đúng");
            }
            return res.data as IResPublicProcedureDTO;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({
                queryKey: ["public-view", variables.token],
            });
        },
        onError: (error: any) => {
            notify.error(error.message || "Mã PIN không đúng");
        },
    });
};
/* ===================== ACCESS LOGS CỦA SHARE TOKEN ===================== */
export const useShareTokenAccessLogsQuery = (tokenId?: number, enabled = true) => {
    return useQuery({
        queryKey: ["share-token-access-logs", tokenId],
        enabled: !!tokenId && enabled,
        queryFn: async () => {
            const res = await callFetchShareTokenAccessLogs(tokenId!);
            return (res.data as any[]) ?? [];
        },
    });
};
/* ===================== GỬI EMAIL SHARE TOKEN ===================== */
export const useSendShareEmailMutation = () => {
    return useMutation({
        mutationFn: async ({ tokenId, email }: { tokenId: number; email: string }) => {
            const res = await callSendShareEmail(tokenId, email);
            if (res?.statusCode && Number(res.statusCode) >= 400) {
                throw new Error(res?.message || "Gửi email thất bại");
            }
            return res;
        },
        onSuccess: () => {
            notify.updated("Gửi email thành công.");
        },
        onError: (error: any) => {
            notify.error(error.message || "Không thể gửi email");
        },
    });
};
