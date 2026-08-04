import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { notification } from "antd";
import { callCreateTaskComment, callFetchTaskComments } from "@/config/api";
import type { IReqCreateTaskCommentDTO } from "@/types/backend";
import { TASKS_QUERY_KEY } from "./useTasks";

export const TASK_COMMENTS_KEY = "task-comments";

export const useTaskCommentsQuery = (taskId: number | null | undefined) => {
    return useQuery({
        queryKey: [TASK_COMMENTS_KEY, taskId],
        queryFn: async () => {
            if (!taskId) return [];
            const res = await callFetchTaskComments(taskId);
            if (res && res.data) {
                return res.data;
            }
            return [];
        },
        enabled: !!taskId,
    });
};

export const useCreateTaskCommentMutation = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ taskId, data }: { taskId: number; data: IReqCreateTaskCommentDTO }) => {
            const res = await callCreateTaskComment(taskId, data);
            if (res && res.data) {
                return res.data;
            }
            throw new Error(res?.message || "Không thể đăng bình luận");
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: [TASK_COMMENTS_KEY, variables.taskId] });
            queryClient.invalidateQueries({ queryKey: [TASKS_QUERY_KEY, "detail", variables.taskId] });
        },
        onError: (error: any) => {
            notification.error({
                message: "Đăng bình luận thất bại",
                description: error?.message || "Có lỗi xảy ra",
            });
        },
    });
};
