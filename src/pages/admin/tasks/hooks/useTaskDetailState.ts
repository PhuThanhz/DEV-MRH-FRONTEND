import { useMemo, useState } from "react";
import {
    useTaskByIdQuery,
    useUpdateTaskStatusMutation,
    useCancelTaskMutation,
    useDeleteTaskMutation,
    useApproveTaskMutation,
    useDecideTaskExtensionMutation,
} from "@/hooks/useTasks";
import {
    useTaskChecklistsQuery,
    useCreateTaskChecklistMutation,
    useToggleTaskChecklistMutation,
    useDeleteTaskChecklistMutation,
} from "@/hooks/useTaskChecklists";
import { useDelegationsToMeQuery } from "@/hooks/useApprovalDelegations";
import {
    useTaskCommentsQuery,
    useCreateTaskCommentMutation,
} from "@/hooks/useTaskComments";
import {
    useTaskAttachmentsQuery,
    useRegisterTaskAttachmentMutation,
    useUploadTaskAttachmentFileMutation,
} from "@/hooks/useTaskAttachments";
import type { TaskAttachmentCategoryType } from "@/types/backend";
import { getTaskViewerContext, type TaskPerms } from "../taskContext";
import { notify } from "@/components/common/notification/notify";

const ALLOWED_ATTACHMENT_EXTENSIONS = ["pdf", "doc", "docx", "xls", "xlsx", "jpg", "jpeg", "png", "webp"];
const MAX_ATTACHMENT_SIZE_BYTES = 50 * 1024 * 1024;

export const useTaskDetailState = (
    taskId: number | null,
    user: any,
    perms: TaskPerms,
    onClose: () => void
) => {
    const { data: task, isLoading } = useTaskByIdQuery(taskId);
    const { data: checklists = [] } = useTaskChecklistsQuery(taskId);
    const { data: comments = [] } = useTaskCommentsQuery(taskId);
    const { data: attachments = [] } = useTaskAttachmentsQuery(taskId);
    const { data: myDelegations = [] } = useDelegationsToMeQuery();

    const checklistAssignableUsers = useMemo(() => {
        const seenUserIds = new Set<string>();
        const assignableUsers: Array<{ id: string; name: string }> = [];

        const addUser = (id?: string | number | null, name?: string | null) => {
            if (id === undefined || id === null || !name) return;

            const normalizedId = String(id);
            if (seenUserIds.has(normalizedId)) return;

            seenUserIds.add(normalizedId);
            assignableUsers.push({ id: normalizedId, name });
        };

        addUser(task?.assigneeId, task?.assigneeName);
        (task?.collaborators || []).forEach((collaborator: any) => {
            addUser(collaborator.userId, collaborator.userName);
        });

        return assignableUsers;
    }, [task]);

    const [submitModalOpen, setSubmitModalOpen] = useState(false);
    const [reworkReason, setReworkReason] = useState("");
    const [showReworkInput, setShowReworkInput] = useState(false);
    const [extensionModalOpen, setExtensionModalOpen] = useState(false);
    const [rejectExtensionNote, setRejectExtensionNote] = useState("");
    const [showRejectExtensionInput, setShowRejectExtensionInput] = useState(false);
    const [commentInput, setCommentInput] = useState("");
    const [newChecklistTitle, setNewChecklistTitle] = useState("");
    const [newChecklistAssignedUser, setNewChecklistAssignedUser] = useState<string | undefined>(undefined);
    const [uploadingFile, setUploadingFile] = useState(false);

    const updateStatusMutation = useUpdateTaskStatusMutation();
    const cancelMutation = useCancelTaskMutation();
    const deleteMutation = useDeleteTaskMutation();
    const approveMutation = useApproveTaskMutation();
    const decideExtensionMutation = useDecideTaskExtensionMutation();

    const createChecklistMutation = useCreateTaskChecklistMutation();
    const toggleChecklistMutation = useToggleTaskChecklistMutation();
    const deleteChecklistMutation = useDeleteTaskChecklistMutation();

    const createCommentMutation = useCreateTaskCommentMutation();
    const registerAttachmentMutation = useRegisterTaskAttachmentMutation();
    const uploadAttachmentMutation = useUploadTaskAttachmentFileMutation();

    const viewerContext = getTaskViewerContext(user, task || null, perms, myDelegations);
    const currentUserId = String(user?.id || "");

    const pendingExtension = (task?.extensionRequests || []).find((ext) => ext.status === "PENDING") || null;

    const totalChecklists = checklists.length;
    const completedChecklists = checklists.filter((c: any) => c.isCompleted).length;
    const uncompletedChecklists = totalChecklists - completedChecklists;
    const checklistPercent = totalChecklists > 0 ? Math.round((completedChecklists / totalChecklists) * 100) : 0;

    const handleStartTask = async () => {
        if (!task) return;
        await updateStatusMutation.mutateAsync({ id: task.id, status: "IN_PROGRESS" });
    };

    const handleApprove = async () => {
        if (!task) return;
        await approveMutation.mutateAsync({ id: task.id, data: { decision: "APPROVE" } });
    };

    const handleRework = async () => {
        if (!task || !reworkReason.trim()) return;
        await approveMutation.mutateAsync({
            id: task.id,
            data: { decision: "REWORK", reworkReason: reworkReason.trim() },
        });
        setReworkReason("");
        setShowReworkInput(false);
    };

    const handleApproveExtension = async () => {
        if (!task || !pendingExtension) return;
        await decideExtensionMutation.mutateAsync({
            id: task.id,
            extensionId: pendingExtension.id,
            data: { decision: "APPROVE" },
        });
    };

    const handleRejectExtension = async () => {
        if (!task || !pendingExtension || !rejectExtensionNote.trim()) return;
        await decideExtensionMutation.mutateAsync({
            id: task.id,
            extensionId: pendingExtension.id,
            data: { decision: "REJECT", decisionNote: rejectExtensionNote.trim() },
        });
        setRejectExtensionNote("");
        setShowRejectExtensionInput(false);
    };

    const handleCancel = async () => {
        if (!task) return;
        await cancelMutation.mutateAsync(task.id);
    };

    const handleDelete = async () => {
        if (!task) return;
        await deleteMutation.mutateAsync(task.id);
        onClose();
    };

    const handleAddChecklist = async () => {
        if (!task || !newChecklistTitle.trim()) return;
        await createChecklistMutation.mutateAsync({
            taskId: task.id,
            data: {
                title: newChecklistTitle.trim(),
                assignedUserId: newChecklistAssignedUser,
            },
        });
        setNewChecklistTitle("");
        setNewChecklistAssignedUser(undefined);
    };

    const handleAddComment = async () => {
        if (!task || !commentInput.trim()) return;
        await createCommentMutation.mutateAsync({
            taskId: task.id,
            data: { content: commentInput.trim() },
        });
        setCommentInput("");
    };

    const handleFileUpload = async (
        options: any,
        attachmentCategory: Exclude<TaskAttachmentCategoryType, "RESULT">
    ) => {
        if (!task) return;
        const { file, onSuccess, onError } = options;

        const ext = (file.name as string).split(".").pop()?.toLowerCase() || "";
        if (!ALLOWED_ATTACHMENT_EXTENSIONS.includes(ext)) {
            notify.error(
                `Chỉ chấp nhận định dạng: ${ALLOWED_ATTACHMENT_EXTENSIONS.join(", ")}`,
                { title: "Định dạng tệp không được hỗ trợ" }
            );
            onError?.(new Error("Invalid file extension"));
            return;
        }
        if (file.size > MAX_ATTACHMENT_SIZE_BYTES) {
            notify.error("Mỗi tệp tối đa 50 MB", { title: "Tệp vượt quá dung lượng cho phép" });
            onError?.(new Error("File too large"));
            return;
        }

        setUploadingFile(true);
        try {
            const res = await uploadAttachmentMutation.mutateAsync({
                file,
                folder: "task",
            });
            if (res && res.data) {
                const uploadedFileName = res.data.fileName;
                await registerAttachmentMutation.mutateAsync({
                    taskId: task.id,
                    data: {
                        fileName: uploadedFileName,
                        folder: "task",
                        fileSize: file.size,
                        attachmentCategory,
                    },
                });
                onSuccess?.("OK");
            }
        } catch (err: any) {
            onError?.(err);
        } finally {
            setUploadingFile(false);
        }
    };

    const handleGuidanceFileUpload = (options: any) =>
        handleFileUpload(options, "GUIDANCE");

    const handleWorkingFileUpload = (options: any) =>
        handleFileUpload(options, "WORKING");

    return {
        task,
        isLoading,
        checklists,
        comments,
        attachments,
        checklistAssignableUsers,
        viewerContext,
        currentUserId,
        submitModalOpen,
        setSubmitModalOpen,
        reworkReason,
        setReworkReason,
        showReworkInput,
        setShowReworkInput,
        extensionModalOpen,
        setExtensionModalOpen,
        rejectExtensionNote,
        setRejectExtensionNote,
        showRejectExtensionInput,
        setShowRejectExtensionInput,
        pendingExtension,
        commentInput,
        setCommentInput,
        newChecklistTitle,
        setNewChecklistTitle,
        newChecklistAssignedUser,
        setNewChecklistAssignedUser,
        uploadingFile,
        totalChecklists,
        completedChecklists,
        uncompletedChecklists,
        checklistPercent,
        updateStatusMutation,
        approveMutation,
        decideExtensionMutation,
        cancelMutation,
        deleteMutation,
        createChecklistMutation,
        toggleChecklistMutation,
        deleteChecklistMutation,
        createCommentMutation,
        registerAttachmentMutation,
        handleStartTask,
        handleApprove,
        handleRework,
        handleApproveExtension,
        handleRejectExtension,
        handleCancel,
        handleDelete,
        handleAddChecklist,
        handleAddComment,
        handleGuidanceFileUpload,
        handleWorkingFileUpload,
    };
};
