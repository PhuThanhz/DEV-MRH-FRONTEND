export type EvaluationDetailRole = "MANAGER" | "APPROVER";

const EVALUATION_DETAIL_LINK = /^\/admin\/evaluation\/(manager|approval)\/records\/(\d+)(?:\?.*)?$/i;

export const buildEvaluationDrawerLink = (recordId: number | string, role: EvaluationDetailRole) => {
    const params = new URLSearchParams({
        tab: "PENDING_EVAL",
        recordId: String(recordId),
        detailRole: role,
    });
    return `/admin/evaluation/process?${params.toString()}`;
};

export const resolveNotificationActionLink = (actionLink?: string) => {
    if (!actionLink) return undefined;
    const match = actionLink.match(EVALUATION_DETAIL_LINK);
    if (!match) return actionLink;

    const role: EvaluationDetailRole = match[1].toLowerCase() === "manager"
        ? "MANAGER"
        : "APPROVER";
    return buildEvaluationDrawerLink(match[2], role);
};
