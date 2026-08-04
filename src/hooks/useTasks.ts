import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { notify } from "@/components/common/notification/notify";
import {
    callApproveTask,
    callCancelTask,
    callCreateTask,
    callDecideTaskExtension,
    callDeleteTask,
    callFetchTaskById,
    callFetchTaskCalendar,
    callFetchTasks,
    callRequestTaskExtension,
    callSubmitTaskResult,
    callUpdateTask,
    callUpdateTaskDueDate,
    callUpdateTaskStatus,
} from "@/config/api";
import type {
    IReqApproveTaskDTO,
    IReqCreateTaskDTO,
    IReqDecideTaskExtensionDTO,
    IReqRequestTaskExtensionDTO,
    IReqSubmitResultDTO,
    IReqUpdateTaskDTO,
} from "@/types/backend";

export const TASKS_QUERY_KEY = "tasks";

export const useTasksQuery = (
    query: string,
    tab: string = "ALL",
    enabled: boolean = true
) => {
    return useQuery({
        queryKey: [TASKS_QUERY_KEY, query, tab],
        queryFn: async () => {
            const res = await callFetchTasks(query, tab);
            if (res && res.data) {
                return res.data;
            }
            return {
                meta: { page: 1, pageSize: 10, pages: 0, total: 0 },
                result: [],
            };
        },
        enabled,
    });
};

export const useTaskCalendarQuery = (
    from: string,
    to: string,
    tab: string = "ALL",
    filter?: string
) => {
    return useQuery({
        queryKey: [TASKS_QUERY_KEY, "calendar", from, to, tab, filter || ""],
        queryFn: async () => {
            const res = await callFetchTaskCalendar(from, to, tab, filter);
            if (res && res.data) {
                return res.data;
            }
            throw new Error(res?.message || "Không thể tải dữ liệu lịch tác vụ");
        },
        enabled: Boolean(from && to),
    });
};

export const useTaskDetailQuery = (id: number | null | undefined) => {
    return useQuery({
        queryKey: [TASKS_QUERY_KEY, "detail", id],
        queryFn: async () => {
            if (!id) return null;
            const res = await callFetchTaskById(id);
            if (res && res.data) {
                return res.data;
            }
            throw new Error(res?.message || "Không thể tải chi tiết tác vụ");
        },
        enabled: !!id,
    });
};

export const useCreateTaskMutation = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: IReqCreateTaskDTO) => {
            const res = await callCreateTask(data);
            if (res && res.data) {
                return res.data;
            }
            throw new Error(res?.message || "Không thể tạo mới tác vụ");
        },
        onSuccess: () => {
            notify.success("Tạo tác vụ mới thành công");
            queryClient.invalidateQueries({ queryKey: [TASKS_QUERY_KEY] });
        },
        onError: (error: any) => {
            notify.error("Tạo tác vụ thất bại", error?.message || "Có lỗi xảy ra");
        },
    });
};

export const useUpdateTaskMutation = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, data }: { id: number; data: IReqUpdateTaskDTO }) => {
            const res = await callUpdateTask(id, data);
            if (res && res.data) {
                return res.data;
            }
            throw new Error(res?.message || "Không thể cập nhật tác vụ");
        },
        onMutate: async ({ id, data }) => {
            // Cancel outgoing queries for tasks to avoid optimistic update overwrite
            await queryClient.cancelQueries({ queryKey: [TASKS_QUERY_KEY] });

            // Snapshot previous queries data for rollback
            const previousQueries = queryClient.getQueriesData({ queryKey: [TASKS_QUERY_KEY] });

            // Optimistically patch target task in cache
            queryClient.setQueriesData({ queryKey: [TASKS_QUERY_KEY] }, (oldData: any) => {
                if (!oldData || !Array.isArray(oldData.result)) return oldData;
                return {
                    ...oldData,
                    result: oldData.result.map((task: any) =>
                        task.id === id
                            ? {
                                  ...task,
                                  ...data,
                                  dueDate: data.dueDate !== undefined ? data.dueDate : task.dueDate,
                              }
                            : task
                    ),
                };
            });

            return { previousQueries };
        },
        onError: (error: any, _, context: any) => {
            notify.error("Cập nhật tác vụ thất bại", error?.message || "Có lỗi xảy ra");
            if (context?.previousQueries) {
                context.previousQueries.forEach(([key, value]: [any, any]) => {
                    queryClient.setQueryData(key, value);
                });
            }
        },
        onSuccess: (_, variables) => {
            notify.success("Cập nhật tác vụ thành công");
            queryClient.invalidateQueries({ queryKey: [TASKS_QUERY_KEY, "detail", variables.id] });
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: [TASKS_QUERY_KEY] });
        },
    });
};

export const useUpdateTaskStatusMutation = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, status }: { id: number; status: string }) => {
            const res = await callUpdateTaskStatus(id, status);
            if (res && res.data) {
                return res.data;
            }
            throw new Error(res?.message || "Không thể chuyển trạng thái tác vụ");
        },
        onMutate: async ({ id, status }) => {
            // Cancel outgoing queries to avoid overwriting optimistic status update
            await queryClient.cancelQueries({ queryKey: [TASKS_QUERY_KEY] });

            // Snapshot current cache states
            const previousQueries = queryClient.getQueriesData({ queryKey: [TASKS_QUERY_KEY] });

            // Optimistically update status in task list cache
            queryClient.setQueriesData({ queryKey: [TASKS_QUERY_KEY] }, (oldData: any) => {
                if (!oldData || !Array.isArray(oldData.result)) return oldData;
                return {
                    ...oldData,
                    result: oldData.result.map((task: any) =>
                        task.id === id ? { ...task, status } : task
                    ),
                };
            });

            return { previousQueries };
        },
        onError: (error: any, _, context: any) => {
            notify.error("Thao tác thất bại", error?.message || "Có lỗi xảy ra");
            if (context?.previousQueries) {
                context.previousQueries.forEach(([key, value]: [any, any]) => {
                    queryClient.setQueryData(key, value);
                });
            }
        },
        onSuccess: (_, variables) => {
            notify.success("Chuyển trạng thái tác vụ thành công");
            queryClient.invalidateQueries({ queryKey: [TASKS_QUERY_KEY, "detail", variables.id] });
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: [TASKS_QUERY_KEY] });
        },
    });
};

export const useUpdateTaskDueDateMutation = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, dueDate }: { id: number; dueDate: string | null }) => {
            const res = await callUpdateTaskDueDate(id, dueDate);
            if (res && res.data) {
                return res.data;
            }
            throw new Error(res?.message || "Không thể cập nhật hạn chót tác vụ");
        },
        onMutate: async ({ id, dueDate }) => {
            await queryClient.cancelQueries({ queryKey: [TASKS_QUERY_KEY] });

            const previousQueries = queryClient.getQueriesData({ queryKey: [TASKS_QUERY_KEY] });

            queryClient.setQueriesData({ queryKey: [TASKS_QUERY_KEY] }, (oldData: any) => {
                if (!oldData || !Array.isArray(oldData.result)) return oldData;
                return {
                    ...oldData,
                    result: oldData.result.map((task: any) =>
                        task.id === id ? { ...task, dueDate } : task
                    ),
                };
            });

            return { previousQueries };
        },
        onError: (error: any, _, context: any) => {
            notify.error("Cập nhật hạn chót thất bại", error?.message || "Có lỗi xảy ra");
            if (context?.previousQueries) {
                context.previousQueries.forEach(([key, value]: [any, any]) => {
                    queryClient.setQueryData(key, value);
                });
            }
        },
        onSuccess: (_, variables) => {
            notify.success("Cập nhật hạn chót tác vụ thành công");
            queryClient.invalidateQueries({ queryKey: [TASKS_QUERY_KEY, "detail", variables.id] });
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: [TASKS_QUERY_KEY] });
        },
    });
};

export const useCancelTaskMutation = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: number) => {
            const res = await callCancelTask(id);
            return res;
        },
        onSuccess: (_, id) => {
            notify.success("Hủy tác vụ thành công");
            queryClient.invalidateQueries({ queryKey: [TASKS_QUERY_KEY] });
            queryClient.invalidateQueries({ queryKey: [TASKS_QUERY_KEY, "detail", id] });
        },
        onError: (error: any) => {
            notify.error("Hủy tác vụ thất bại", error?.message || "Có lỗi xảy ra");
        },
    });
};

export const useDeleteTaskMutation = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: number) => {
            const res = await callDeleteTask(id);
            return res;
        },
        onSuccess: (_, id) => {
            notify.success("Xóa tác vụ thành công");
            queryClient.invalidateQueries({ queryKey: [TASKS_QUERY_KEY] });
            queryClient.invalidateQueries({ queryKey: [TASKS_QUERY_KEY, "detail", id] });
        },
        onError: (error: any) => {
            notify.error("Xóa tác vụ thất bại", error?.message || "Có lỗi xảy ra");
        },
    });
};

export const useSubmitTaskResultMutation = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, data }: { id: number; data: IReqSubmitResultDTO }) => {
            const res = await callSubmitTaskResult(id, data);
            if (res && res.data) {
                return res.data;
            }
            throw new Error(res?.message || "Không thể nộp báo cáo kết quả");
        },
        onSuccess: (_, variables) => {
            notify.success("Nộp báo cáo kết quả thành công, đã gửi yêu cầu nghiệm thu!");
            queryClient.invalidateQueries({ queryKey: [TASKS_QUERY_KEY] });
            queryClient.invalidateQueries({ queryKey: [TASKS_QUERY_KEY, "detail", variables.id] });
        },
        onError: (error: any) => {
            notify.error("Thao tác thất bại", error?.message || "Có lỗi xảy ra");
        },
    });
};

export const useTaskByIdQuery = useTaskDetailQuery;

export const useApproveTaskMutation = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, data }: { id: number; data: IReqApproveTaskDTO }) => {
            const res = await callApproveTask(id, data);
            if (res && res.data) {
                return res.data;
            }
            throw new Error(res?.message || "Không thể phê duyệt tác vụ");
        },
        onSuccess: (_, variables) => {
            const isApproved = variables.data.decision === "APPROVE";
            notify.success(
                isApproved ? "Đã phê duyệt nghiệm thu tác vụ!" : "Đã trả lại tác vụ yêu cầu làm lại!"
            );
            queryClient.invalidateQueries({ queryKey: [TASKS_QUERY_KEY] });
            queryClient.invalidateQueries({ queryKey: [TASKS_QUERY_KEY, "detail", variables.id] });
        },
        onError: (error: any) => {
            notify.error("Thao tác phê duyệt thất bại", error?.message || "Có lỗi xảy ra");
        },
    });
};

export const useRequestTaskExtensionMutation = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, data }: { id: number; data: IReqRequestTaskExtensionDTO }) => {
            const res = await callRequestTaskExtension(id, data);
            if (res && res.data) {
                return res.data;
            }
            throw new Error(res?.message || "Không thể gửi yêu cầu gia hạn");
        },
        onSuccess: (_, variables) => {
            notify.success("Đã gửi yêu cầu gia hạn, chờ Người giao việc duyệt!");
            queryClient.invalidateQueries({ queryKey: [TASKS_QUERY_KEY] });
            queryClient.invalidateQueries({ queryKey: [TASKS_QUERY_KEY, "detail", variables.id] });
        },
        onError: (error: any) => {
            notify.error("Gửi yêu cầu gia hạn thất bại", error?.message || "Có lỗi xảy ra");
        },
    });
};

export const useDecideTaskExtensionMutation = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({
            id,
            extensionId,
            data,
        }: {
            id: number;
            extensionId: number;
            data: IReqDecideTaskExtensionDTO;
        }) => {
            const res = await callDecideTaskExtension(id, extensionId, data);
            if (res && res.data) {
                return res.data;
            }
            throw new Error(res?.message || "Không thể xử lý yêu cầu gia hạn");
        },
        onSuccess: (_, variables) => {
            const isApproved = variables.data.decision === "APPROVE";
            notify.success(isApproved ? "Đã duyệt gia hạn tác vụ!" : "Đã từ chối yêu cầu gia hạn!");
            queryClient.invalidateQueries({ queryKey: [TASKS_QUERY_KEY] });
            queryClient.invalidateQueries({ queryKey: [TASKS_QUERY_KEY, "detail", variables.id] });
        },
        onError: (error: any) => {
            notify.error("Xử lý yêu cầu gia hạn thất bại", error?.message || "Có lỗi xảy ra");
        },
    });
};
