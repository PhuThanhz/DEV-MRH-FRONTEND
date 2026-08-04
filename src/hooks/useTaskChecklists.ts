import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { notify } from "@/components/common/notification/notify";
import {
    callCreateTaskChecklist,
    callDeleteTaskChecklist,
    callFetchTaskChecklists,
    callToggleTaskChecklist,
    callUpdateTaskChecklist,
} from "@/config/api";
import type {
    IReqCreateTaskChecklistDTO,
    IReqUpdateTaskChecklistDTO,
    IResTaskChecklistDTO,
} from "@/types/backend";
import { TASKS_QUERY_KEY } from "./useTasks";

export const TASK_CHECKLISTS_KEY = "task-checklists";

export const useTaskChecklistsQuery = (taskId: number | null | undefined) => {
    return useQuery<IResTaskChecklistDTO[]>({
        queryKey: [TASK_CHECKLISTS_KEY, taskId],
        queryFn: async () => {
            if (!taskId) return [];
            const res = await callFetchTaskChecklists(taskId);
            if (res && res.data && Array.isArray(res.data)) {
                return res.data;
            }
            return [];
        },
        enabled: !!taskId,
    });
};

export const useCreateTaskChecklistMutation = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ taskId, data }: { taskId: number; data: IReqCreateTaskChecklistDTO }) => {
            const res = await callCreateTaskChecklist(taskId, data);
            if (res && res.data) {
                return res.data;
            }
            throw new Error(res?.message || "Không thể thêm mục kiểm tra");
        },
        onSuccess: (_, variables) => {
            notify.success("Thêm mục kiểm tra thành công");
            queryClient.invalidateQueries({ queryKey: [TASK_CHECKLISTS_KEY, variables.taskId] });
            queryClient.invalidateQueries({ queryKey: [TASKS_QUERY_KEY, "detail", variables.taskId] });
        },
        onError: (error: any) => {
            notify.error("Thêm mục kiểm tra thất bại", error?.message || "Có lỗi xảy ra");
        },
    });
};

export const useUpdateTaskChecklistMutation = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ taskId, checklistId, data }: { taskId: number; checklistId: number; data: IReqUpdateTaskChecklistDTO }) => {
            const res = await callUpdateTaskChecklist(taskId, checklistId, data);
            if (res && res.data) {
                return res.data;
            }
            throw new Error(res?.message || "Không thể cập nhật mục kiểm tra");
        },
        onSuccess: (_, variables) => {
            notify.success("Cập nhật mục kiểm tra thành công");
            queryClient.invalidateQueries({ queryKey: [TASK_CHECKLISTS_KEY, variables.taskId] });
            queryClient.invalidateQueries({ queryKey: [TASKS_QUERY_KEY, "detail", variables.taskId] });
        },
        onError: (error: any) => {
            notify.error("Cập nhật mục kiểm tra thất bại", error?.message || "Có lỗi xảy ra");
        },
    });
};

export const useToggleTaskChecklistMutation = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ taskId, checklistId, isCompleted }: { taskId: number; checklistId: number; isCompleted: boolean }) => {
            if (!taskId || isNaN(Number(taskId))) {
                throw new Error("Mã tác vụ không hợp lệ");
            }
            const res = await callToggleTaskChecklist(taskId, checklistId, isCompleted);
            if (res && res.data) {
                return res.data;
            }
            throw new Error(res?.message || "Không thể chuyển trạng thái mục kiểm tra");
        },
        onSuccess: (_, variables) => {
            notify.success(variables.isCompleted ? "Đã đánh dấu hoàn thành bước kiểm tra!" : "Đã bỏ đánh dấu bước kiểm tra!");
            queryClient.invalidateQueries({ queryKey: [TASK_CHECKLISTS_KEY, variables.taskId] });
            queryClient.invalidateQueries({ queryKey: [TASKS_QUERY_KEY, "detail", variables.taskId] });
        },
        onError: (error: any) => {
            notify.error("Thao tác thất bại", error?.message || "Có lỗi xảy ra");
        },
    });
};

export const useDeleteTaskChecklistMutation = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ taskId, checklistId }: { taskId: number; checklistId: number }) => {
            const res = await callDeleteTaskChecklist(taskId, checklistId);
            return res;
        },
        onSuccess: (_, variables) => {
            notify.success("Xóa mục kiểm tra thành công");
            queryClient.invalidateQueries({ queryKey: [TASK_CHECKLISTS_KEY, variables.taskId] });
            queryClient.invalidateQueries({ queryKey: [TASKS_QUERY_KEY, "detail", variables.taskId] });
        },
        onError: (error: any) => {
            notify.error("Xóa mục kiểm tra thất bại", error?.message || "Có lỗi xảy ra");
        },
    });
};
