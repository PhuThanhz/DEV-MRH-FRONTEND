import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    callAssignEmployeeCareerPath,
    callUpdateEmployeeCareerPath,
    callPromoteEmployee,
    callSetEmployeeCareerPathStatus,
    callGetEmployeeCareerPathByUser,
    callGetEmployeeCareerPathsByDepartment,
    callGetUpcomingPromotions,
    callGetEmployeeCareerPathHistory,
} from "@/config/api";
import type {
    IEmployeeCareerPath,
    IEmployeeCareerPathHistory,
    IReqAssignCareerPath,
    IReqPromoteEmployee,
} from "@/types/backend";
import { notify } from "@/components/common/notification/notify";

/* =====================================================
   QUERIES
===================================================== */

/** Lấy lộ trình của 1 nhân viên theo userId */
export const useEmployeeCareerPathByUserQuery = (userId?: number) => {
    return useQuery({
        queryKey: ["employee-career-path", "user", userId],
        enabled: !!userId,
        queryFn: async () => {
            const res = await callGetEmployeeCareerPathByUser(userId!);
            if (!res?.data) throw new Error("Chưa có lộ trình thăng tiến");
            return res.data as IEmployeeCareerPath;
        },
    });
};

/** Lấy danh sách lộ trình của toàn phòng ban */
export const useEmployeeCareerPathsByDepartmentQuery = (departmentId?: number) => {
    return useQuery({
        queryKey: ["employee-career-paths", "department", departmentId],
        enabled: !!departmentId,
        queryFn: async () => {
            const res = await callGetEmployeeCareerPathsByDepartment(departmentId!);
            if (!res?.data) throw new Error("Không thể lấy danh sách lộ trình");
            return res.data as IEmployeeCareerPath[];
        },
    });
};

/** Danh sách nhân viên sắp đến hạn thăng tiến */
export const useUpcomingPromotionsQuery = (withinDays: number = 30) => {
    return useQuery({
        queryKey: ["employee-career-paths", "upcoming", withinDays],
        queryFn: async () => {
            const res = await callGetUpcomingPromotions(withinDays);
            if (!res?.data) throw new Error("Không thể lấy danh sách sắp thăng tiến");
            return res.data as IEmployeeCareerPath[];
        },
    });
};

/** Lịch sử thăng tiến của 1 nhân viên */
export const useEmployeeCareerPathHistoryQuery = (userId?: number) => {
    return useQuery({
        queryKey: ["employee-career-path-history", userId],
        enabled: !!userId,
        queryFn: async () => {
            const res = await callGetEmployeeCareerPathHistory(userId!);
            if (!res?.data) throw new Error("Không thể lấy lịch sử thăng tiến");
            return res.data as IEmployeeCareerPathHistory[];
        },
    });
};

/* =====================================================
   MUTATIONS
===================================================== */

/** HR gán lộ trình cho nhân viên */
export const useAssignCareerPathMutation = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: IReqAssignCareerPath) => {
            const res = await callAssignEmployeeCareerPath(data);
            if (!res?.data) throw new Error(res?.message || "Không thể gán lộ trình");
            return res;
        },
        onSuccess: (res, variables) => {
            notify.created(res?.message || "Gán lộ trình thành công");
            queryClient.invalidateQueries({
                queryKey: ["employee-career-paths", "department"],
            });
            queryClient.invalidateQueries({
                queryKey: ["employee-career-path", "user", variables.userId],
            });
        },
        onError: (error: any) => {
            notify.error(error.message || "Lỗi khi gán lộ trình");
        },
    });
};

/** HR cập nhật lộ trình (target, note, expected date) */
export const useUpdateEmployeeCareerPathMutation = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, data }: { id: number; data: IReqAssignCareerPath }) => {
            const res = await callUpdateEmployeeCareerPath(id, data);
            if (!res?.data) throw new Error(res?.message || "Không thể cập nhật lộ trình");
            return res;
        },
        onSuccess: (res, variables) => {
            notify.updated(res?.message || "Cập nhật lộ trình thành công");
            queryClient.invalidateQueries({
                queryKey: ["employee-career-paths", "department"],
            });
            queryClient.invalidateQueries({
                queryKey: ["employee-career-path", "user", variables.data.userId],
            });
        },
        onError: (error: any) => {
            notify.error(error.message || "Lỗi khi cập nhật lộ trình");
        },
    });
};

/** HR thực hiện thăng tiến nhân viên */
export const usePromoteEmployeeMutation = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, data }: { id: number; data: IReqPromoteEmployee }) => {
            const res = await callPromoteEmployee(id, data);
            if (!res?.data) throw new Error(res?.message || "Không thể thăng tiến");
            return res;
        },
        onSuccess: (res) => {
            notify.updated(res?.message || "Thăng tiến thành công");
            queryClient.invalidateQueries({
                queryKey: ["employee-career-paths"],
            });
            queryClient.invalidateQueries({
                queryKey: ["employee-career-path-history"],
            });
        },
        onError: (error: any) => {
            notify.error(error.message || "Lỗi khi thăng tiến nhân viên");
        },
    });
};

/** HR đổi trạng thái lộ trình (tạm dừng / mở lại) */
export const useSetCareerPathStatusMutation = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, status }: { id: number; status: number }) => {
            const res = await callSetEmployeeCareerPathStatus(id, status);
            return res;
        },
        onSuccess: () => {
            notify.updated("Cập nhật trạng thái thành công");
            queryClient.invalidateQueries({
                queryKey: ["employee-career-paths"],
            });
        },
        onError: (error: any) => {
            notify.error(error.message || "Lỗi khi cập nhật trạng thái");
        },
    });
};