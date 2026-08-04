import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
    callFetchTaskAttachments,
    callRegisterTaskAttachment,
    callUploadSingleFile,
} from "@/config/api";
import { notify } from "@/components/common/notification/notify";
import type { IReqRegisterTaskAttachmentDTO } from "@/types/backend";
import { TASKS_QUERY_KEY } from "./useTasks";

export const TASK_ATTACHMENTS_KEY = "task-attachments";

export const useTaskAttachmentsQuery = (taskId: number | null | undefined) => {
    return useQuery({
        queryKey: [TASK_ATTACHMENTS_KEY, taskId],
        queryFn: async () => {
            if (!taskId) return [];
            const res = await callFetchTaskAttachments(taskId);
            if (res && res.data) {
                return res.data;
            }
            return [];
        },
        enabled: !!taskId,
    });
};

export const useRegisterTaskAttachmentMutation = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ taskId, data }: { taskId: number; data: IReqRegisterTaskAttachmentDTO }) => {
            const res = await callRegisterTaskAttachment(taskId, data);
            if (res && res.data) {
                return res.data;
            }
            throw new Error(res?.message || "Không thể đăng ký file đính kèm");
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: [TASK_ATTACHMENTS_KEY, variables.taskId] });
            queryClient.invalidateQueries({ queryKey: [TASKS_QUERY_KEY, "detail", variables.taskId] });
        },
        onError: (error: any) => {
            notify.error("Không thể lưu tệp đính kèm", error?.message || "Có lỗi xảy ra");
        },
    });
};

export const useUploadTaskAttachmentFileMutation = () => {
    return useMutation({
        mutationFn: async ({
            file,
            folder = "task",
        }: {
            file: File;
            folder?: string;
        }) => {
            const res = await callUploadSingleFile(file, folder);
            if (res?.data?.fileName) {
                return res;
            }
            throw new Error(res?.message || "Không thể tải tệp lên");
        },
    });
};
