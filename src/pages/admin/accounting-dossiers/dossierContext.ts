import type {
    AccountingDossierStatus,
    IAccountingDossier,
    IAccountingDossierApprovalStep,
} from "@/types/backend";

export const editableStatuses: AccountingDossierStatus[] = ["DRAFT", "RETURNED"];
export const returnRequestableStatuses: AccountingDossierStatus[] = ["SUBMITTED", "IN_REVIEW", "RETURN_REQUESTED"];

export interface DossierPerms {
    approve: boolean;
    reject: boolean;
    terminate: boolean;
    archive: boolean;
    requestReturn: boolean;
    returnResponse: boolean;
    checkDoc: boolean;
    rejectSync: boolean;
}

export interface DossierContext {
    isCreator: boolean;
    isSuperAdmin: boolean;
    isCurrentApprover: boolean;
    isAssignedApprover: boolean;
    canApprove: boolean;
    canReject: boolean;
    canRequestReturn: boolean;
    canReturnResponse: boolean;
    canTerminate: boolean;
    canArchive: boolean;
    canRejectSync: boolean;
    canReviewChildDocs: boolean;
}

// Quyền thao tác gate bằng permission (role thực sự nắm) + đúng lượt duyệt (approverUserId của bước hiện tại).
// Không đoán qua tên role để tránh nhận nhầm (vd "KETOAN_TRUONG".includes("KETOAN")).
export const getDossierViewerContext = (
    user: any,
    dossier: IAccountingDossier | null,
    approvalSteps: IAccountingDossierApprovalStep[],
    perms: DossierPerms
): DossierContext => {
    if (!user) {
        return {
            isCreator: false,
            isSuperAdmin: false,
            isCurrentApprover: false,
            isAssignedApprover: false,
            canApprove: false,
            canReject: false,
            canRequestReturn: false,
            canReturnResponse: false,
            canTerminate: false,
            canArchive: false,
            canRejectSync: false,
            canReviewChildDocs: false,
        };
    }

    const isSuperAdmin = (user.role?.name?.toUpperCase() || "") === "SUPER_ADMIN";
    const isCreator = user.id === dossier?.creatorId;

    const currentStep = approvalSteps.find((s) => s.status === "CURRENT");
    // Đúng lượt của tôi = tôi là người được gán bước hiện tại (super admin toàn quyền).
    const isCurrentApprover = isSuperAdmin
        || (!!currentStep?.approverUserId && String(currentStep.approverUserId) === String(user.id));
    const isAssignedApprover = approvalSteps.some((step) => String(step.approverUserId || "") === String(user.id || ""));

    const status = dossier?.status || "DRAFT";
    const inReview = ["SUBMITTED", "IN_REVIEW"].includes(status);

    const canApprove = inReview && isCurrentApprover && perms.approve;
    const canReject = inReview && isCurrentApprover && perms.reject;
    const canRequestReturn = ["SUBMITTED", "IN_REVIEW", "RETURN_REQUESTED"].includes(status) && (isCreator || isSuperAdmin) && perms.requestReturn;
    const canReturnResponse = status === "RETURN_REQUESTED" && (isCurrentApprover || isSuperAdmin) && perms.returnResponse;
    const canTerminate = ["SUBMITTED", "IN_REVIEW", "RETURN_REQUESTED"].includes(status) && perms.terminate;
    const canArchive = status === "APPROVED" && perms.archive;
    const canRejectSync = dossier?.categoryMode === "UNSTRUCTURED" && dossier?.syncCategoryRequested === true && perms.rejectSync;
    const canReviewChildDocs = inReview && currentStep?.approverType === "ACCOUNTANT" && isCurrentApprover && perms.checkDoc;

    return {
        isCreator,
        isSuperAdmin,
        isCurrentApprover,
        isAssignedApprover,
        canApprove,
        canReject,
        canRequestReturn,
        canReturnResponse,
        canTerminate,
        canArchive,
        canRejectSync,
        canReviewChildDocs,
    };
};
