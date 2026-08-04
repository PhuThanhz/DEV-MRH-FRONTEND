import dayjs from "dayjs";
import type { IResApprovalDelegationDTO, IResTaskDTO, IResTaskDetailDTO } from "@/types/backend";

export interface TaskPerms {
    create: boolean;
    update: boolean;
    updateStatus: boolean;
    cancel: boolean;
    delete: boolean;
    submitResult: boolean;
    approve: boolean;
    requestExtension: boolean;
    decideExtension: boolean;
}

export interface TaskContext {
    isCreator: boolean;
    isAssignee: boolean;
    isCollaborator: boolean;
    isObserver: boolean;
    isDelegate: boolean;
    isSuperAdmin: boolean;
    isAdmin: boolean;
    canEdit: boolean;
    canReassignAssignee: boolean;
    canCancel: boolean;
    canDelete: boolean;
    canStart: boolean;
    canSubmitResult: boolean;
    canApprove: boolean;
    canReject: boolean;
    canRequestExtension: boolean;
    canDecideExtension: boolean;
}

export const getTaskViewerContext = (
    user: any,
    task: IResTaskDTO | IResTaskDetailDTO | null,
    perms: TaskPerms,
    myDelegations: IResApprovalDelegationDTO[] = []
): TaskContext => {
    if (!user || !task) {
        return {
            isCreator: false,
            isAssignee: false,
            isCollaborator: false,
            isObserver: false,
            isDelegate: false,
            isSuperAdmin: false,
            isAdmin: false,
            canEdit: false,
            canReassignAssignee: false,
            canCancel: false,
            canDelete: false,
            canStart: false,
            canSubmitResult: false,
            canApprove: false,
            canReject: false,
            canRequestExtension: false,
            canDecideExtension: false,
        };
    }

    const currentUserId = String(user.id || "");
    const roleName = user.role?.name?.toUpperCase() || "";
    const isSuperAdmin = roleName === "SUPER_ADMIN";
    const isAdmin = isSuperAdmin || roleName === "ADMIN_SUB_1";
    const isCreator = currentUserId === String(task.creatorId || "");
    const isAssignee = currentUserId === String(task.assigneeId || "");

    const detailTask = task as IResTaskDetailDTO;
    const isCollaborator = detailTask.collaborators
        ? detailTask.collaborators.some((c) => String(c.userId || "") === currentUserId)
        : false;

    const isObserver = detailTask.observers
        ? detailTask.observers.some((o) => String(o.userId || "") === currentUserId)
        : false;

    // Check if current user is an active delegate for task's creator
    const now = dayjs();
    const isDelegate = myDelegations.some((d) => {
        if (d.status !== "ACTIVE") return false;
        if (String(d.delegatorUserId || "") !== String(task.creatorId || "")) return false;
        const validFrom = d.validFrom ? dayjs(d.validFrom) : dayjs(0);
        const validTo = d.validTo ? dayjs(d.validTo) : dayjs().add(100, "years");
        return (now.isAfter(validFrom) || now.isSame(validFrom)) && (now.isBefore(validTo) || now.isSame(validTo));
    });

    const status = task.status;
    const isTerminal = ["COMPLETED", "CANCELLED"].includes(status);

    // Sửa nội dung/thời gian chỉ cho phép khi TODO, IN_PROGRESS, REWORK (khóa khi PENDING_REVIEW, COMPLETED, CANCELLED)
    const canEdit = ["TODO", "IN_PROGRESS", "REWORK"].includes(status) && (isCreator || isAdmin) && perms.update;
    // Đổi người thực hiện chính là thao tác nhạy cảm — chỉ cho phép trước khi ai đó bắt đầu làm.
    const canReassignAssignee = status === "TODO" && (isCreator || isAdmin) && perms.update;
    const canCancel = !isTerminal && (isCreator || isAdmin) && perms.cancel;
    // Ràng buộc #5: Nút Xóa Task chỉ hiện khi TODO
    const canDelete = status === "TODO" && (isCreator || isAdmin) && perms.delete;

    // Người giao việc không được bắt đầu thay cho người thực hiện chính.
    const canStart = status === "TODO" && isAssignee && perms.updateStatus;
    const canSubmitResult = ["IN_PROGRESS", "REWORK"].includes(status) && (isAssignee || isAdmin) && perms.submitResult;

    // Nút Duyệt / Từ chối (Rework): Creator, Delegate được ủy quyền, hoặc Super Admin
    const canApprove = status === "PENDING_REVIEW" && (isCreator || isDelegate || isAdmin) && perms.approve;
    const canReject = status === "PENDING_REVIEW" && (isCreator || isDelegate || isAdmin) && perms.approve;

    // Xin gia hạn: chỉ Người thực hiện chính, khi đang làm hoặc bị yêu cầu làm lại.
    const canRequestExtension = ["IN_PROGRESS", "REWORK"].includes(status) && (isAssignee || isAdmin) && perms.requestExtension;
    // Duyệt/Từ chối gia hạn: Creator, Delegate hoặc Admin (còn có yêu cầu PENDING hay không do UI tự kiểm tra khi hiển thị).
    const canDecideExtension = (isCreator || isDelegate || isAdmin) && perms.decideExtension;

    return {
        isCreator,
        isAssignee,
        isCollaborator,
        isObserver,
        isDelegate,
        isSuperAdmin,
        isAdmin,
        canEdit,
        canReassignAssignee,
        canCancel,
        canDelete,
        canStart,
        canSubmitResult,
        canApprove,
        canReject,
        canRequestExtension,
        canDecideExtension,
    };
};

export const getAllowedStatusTransitions = (viewerContext: TaskContext, currentStatus: string): string[] => {
    const allowed: string[] = [];
    if (currentStatus === "TODO" && viewerContext.canStart) {
        allowed.push("IN_PROGRESS");
    }
    if ((currentStatus === "IN_PROGRESS" || currentStatus === "REWORK") && viewerContext.canSubmitResult) {
        allowed.push("PENDING_REVIEW");
    }
    if (currentStatus === "PENDING_REVIEW") {
        if (viewerContext.canApprove) {
            allowed.push("COMPLETED");
        }
        if (viewerContext.canReject) {
            allowed.push("IN_PROGRESS");
        }
    }
    return allowed;
};

export const canTransitionTask = (viewerContext: TaskContext, fromStatus: string, toStatus: string): boolean => {
    const allowed = getAllowedStatusTransitions(viewerContext, fromStatus);
    return allowed.includes(toStatus);
};
