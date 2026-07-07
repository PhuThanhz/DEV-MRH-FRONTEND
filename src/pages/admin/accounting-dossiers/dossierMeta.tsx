import React from "react";
import { Tag, DatePicker } from "antd";
import {
    PlusOutlined,
    FileTextOutlined,
    SendOutlined,
    CheckCircleOutlined,
    CloseCircleOutlined,
    StopOutlined,
    RollbackOutlined,
    ClockCircleOutlined,
    CodeOutlined,
    InboxOutlined,
    HistoryOutlined,
    ReloadOutlined,
} from "@ant-design/icons";
import type {
    AccountingDossierStatus,
    IUser,
    IAccountingDossierApprovalStep,
    IAccountingDossierAuditLog,
} from "@/types/backend";
import { formatDateTime } from "./dossierUtils";
import type { SubmitApprovalStep } from "./dossierUtils";

export const PAGE_SIZE_OPTIONS = [10, 20, 50];
export const { RangePicker } = DatePicker;

export const statusMeta: Record<AccountingDossierStatus, { label: string; color: string }> = {
    DRAFT: { label: "Nháp", color: "default" },
    SUBMITTED: { label: "Đã chuyển", color: "processing" },
    RETURN_REQUESTED: { label: "Yêu cầu hoàn", color: "warning" },
    RETURNED: { label: "Hoàn chứng từ", color: "orange" },
    APPROVED: { label: "Đã duyệt", color: "success" },
    REJECTED: { label: "Không duyệt", color: "error" },
    TERMINATED: { label: "Chấm dứt", color: "red" },
    IN_REVIEW: { label: "Đang duyệt", color: "processing" },
    ARCHIVED: { label: "Lưu trữ", color: "purple" },
};

export const auditActionMeta: Record<string, { label: string; tone: string; icon: React.ReactNode }> = {
    CREATE_DOSSIER: { label: "Tạo bộ chứng từ", tone: "#1677ff", icon: <PlusOutlined /> },
    ADD_DOCUMENT_ITEM: { label: "Thêm chứng từ con", tone: "#1677ff", icon: <FileTextOutlined /> },
    SUBMIT_DOSSIER: { label: "Gửi duyệt và cấp mã", tone: "#722ed1", icon: <SendOutlined /> },
    APPROVE_DOSSIER_STEP: { label: "Phê duyệt một bước", tone: "#52c41a", icon: <CheckCircleOutlined /> },
    APPROVE_DOSSIER_FINAL: { label: "Phê duyệt cuối cùng", tone: "#389e0d", icon: <CheckCircleOutlined /> },
    REJECT_DOSSIER: { label: "Từ chối duyệt", tone: "#f5222d", icon: <CloseCircleOutlined /> },
    TERMINATE_DOSSIER: { label: "Chấm dứt xử lý", tone: "#cf1322", icon: <StopOutlined /> },
    REQUEST_RETURN_DOSSIER: { label: "Yêu cầu hoàn chứng từ", tone: "#fa8c16", icon: <RollbackOutlined /> },
    ACCEPT_RETURN_DOSSIER: { label: "Đồng ý hoàn chứng từ", tone: "#fa8c16", icon: <RollbackOutlined /> },
    REJECT_RETURN_DOSSIER: { label: "Từ chối hoàn chứng từ", tone: "#f5222d", icon: <CloseCircleOutlined /> },
    CHECK_DOCUMENT_ITEM_VALID: { label: "Xác nhận chứng từ hợp lệ", tone: "#52c41a", icon: <CheckCircleOutlined /> },
    CHECK_DOCUMENT_ITEM_NEED_SUPPLEMENT: { label: "Yêu cầu bổ sung chứng từ", tone: "#faad14", icon: <ClockCircleOutlined /> },
    CHECK_DOCUMENT_ITEM_INVALID: { label: "Đánh dấu chứng từ không hợp lệ", tone: "#f5222d", icon: <CloseCircleOutlined /> },
    CHECK_DOCUMENT_ITEM_NOT_REQUIRED: { label: "Không yêu cầu kiểm tra", tone: "#8c8c8c", icon: <StopOutlined /> },
    SYNC_TO_TEMPLATE: { label: "Đồng bộ thành mẫu", tone: "#13c2c2", icon: <CodeOutlined /> },
    REJECT_SYNC_TO_TEMPLATE: { label: "Từ chối đồng bộ mẫu", tone: "#f5222d", icon: <CloseCircleOutlined /> },
    ARCHIVE_DOSSIER: { label: "Đưa vào lưu trữ", tone: "#722ed1", icon: <InboxOutlined /> },
    BULK_APPROVE_DOSSIER: { label: "Duyệt hàng loạt", tone: "#52c41a", icon: <CheckCircleOutlined /> },
    BULK_REJECT_DOSSIER: { label: "Từ chối hàng loạt", tone: "#f5222d", icon: <CloseCircleOutlined /> },
    BULK_CHECK_DOCUMENTS: { label: "Kiểm tra chứng từ hàng loạt", tone: "#1677ff", icon: <FileTextOutlined /> },
};

export const targetTypeLabel: Record<string, string> = {
    DOSSIER: "Bộ chứng từ",
    APPROVAL_STEP: "Bước duyệt",
    DOCUMENT_ITEM: "Chứng từ con",
    DOSSIER_DOCUMENT: "Chứng từ con",
    DOSSIER_CATEGORY: "Mẫu bộ chứng từ",
    BULK_ACTION: "Thao tác hàng loạt",
};

export const getAuditActionMeta = (actionType?: string) => {
    if (!actionType) {
        return { label: "Thao tác", tone: "#1677ff", icon: <HistoryOutlined /> };
    }
    return auditActionMeta[actionType] || {
        label: actionType
            .toLowerCase()
            .split("_")
            .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
            .join(" "),
        tone: "#1677ff",
        icon: <HistoryOutlined />,
    };
};

export const getApproverTypeLabel = (type?: string) => {
    if (type === "DEPARTMENT_MANAGER") return "Trưởng bộ phận";
    if (type === "ACCOUNTANT") return "Kế toán";
    if (type === "CHIEF_ACCOUNTANT") return "Kế toán trưởng";
    return type || "Người duyệt";
};

export const getApprovalStepStatusMeta = (status?: string) => {
    if (status === "APPROVED") {
        return { label: "Đã duyệt", color: "success", border: "#bbf7d0", background: "#f0fdf4", icon: <CheckCircleOutlined /> };
    }
    if (status === "REJECTED") {
        return { label: "Từ chối", color: "error", border: "#fecaca", background: "#fef2f2", icon: <CloseCircleOutlined /> };
    }
    if (status === "CURRENT") {
        return { label: "Đang xử lý", color: "processing", border: "#bfdbfe", background: "#eff6ff", icon: <ReloadOutlined spin /> };
    }
    return { label: "Chờ duyệt", color: "default", border: "#e5e7eb", background: "#f8fafc", icon: <ClockCircleOutlined /> };
};

export const getUserDisplayName = (user?: IUser) => {
    if (!user) return "";
    return `${user.name || user.email || user.id}${user.email ? ` (${user.email})` : ""}`;
};

export const userHasRoleKeyword = (user: IUser, keywords: string[]) => {
    const roleName = user.role?.name?.toUpperCase() || "";
    return keywords.some((keyword) => roleName.includes(keyword));
};

export const getApproverOptions = (users: IUser[], approverType: SubmitApprovalStep["approverType"]) => {
    const activeUsers = users.filter((item) => item.active !== false);
    let filtered: IUser[] = [];
    if (approverType === "DEPARTMENT_MANAGER") {
        filtered = activeUsers.filter((item) => userHasRoleKeyword(item, ["DEPARTMENT_MANAGER", "TRUONG", "MANAGER"]));
        return filtered.length > 0 ? filtered : activeUsers;
    }
    if (approverType === "ACCOUNTANT") {
        filtered = activeUsers.filter((item) => userHasRoleKeyword(item, ["ACCOUNTANT", "KETOAN", "KE_TOAN"]) && !userHasRoleKeyword(item, ["CHIEF", "TRUONG"]));
        return filtered.length > 0 ? filtered : activeUsers;
    }
    if (approverType === "CHIEF_ACCOUNTANT") {
        filtered = activeUsers.filter((item) => userHasRoleKeyword(item, ["CHIEF", "KETOAN_TRUONG", "KE_TOAN_TRUONG"]));
        return filtered.length > 0 ? filtered : activeUsers;
    }
    return activeUsers;
};

export const getApprovalActorDisplay = (step: IAccountingDossierApprovalStep, users: IUser[]) => {
    const matchedUser = users.find((item) => String(item.id) === String(step.approverUserId || ""));
    if (matchedUser) return getUserDisplayName(matchedUser);
    if (step.approverName) return step.approverName;
    if (step.approverUserId) return step.approverUserId;
    return "Chưa gán người duyệt";
};

export const TAG_STYLE: React.CSSProperties = {
    borderRadius: 3, margin: 0, fontWeight: 600,
    fontSize: 11, lineHeight: "20px", padding: "0 8px",
};

export const SectionHeading = ({ icon, label }: { icon: React.ReactNode; label: string }) => (
    <div style={{ display: "flex", alignItems: "center", gap: 6, margin: "0 0 10px" }}>
        <span style={{ color: "#1677ff", fontSize: 11, display: "flex", lineHeight: 1 }}>{icon}</span>
        <div style={{ fontSize: 10, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.08em", whiteSpace: "nowrap" }}>
            {label}
        </div>
        <div style={{ flex: 1, height: "0.5px", background: "#e5e7eb" }} />
    </div>
);

export const Field = ({ label, children, span }: { label: string; children: React.ReactNode; span?: number }) => (
    <div style={{ gridColumn: span ? `span ${span}` : undefined, minWidth: 0, overflow: "hidden" }}>
        <div style={{ fontSize: 10, color: "#9ca3af", fontWeight: 500, display: "block", marginBottom: 3 }}>
            {label}
        </div>
        <div style={{ fontSize: 13, color: "#111827", fontWeight: 500, display: "flex", alignItems: "center", gap: 5, minHeight: 22, overflow: "hidden", wordBreak: "break-word" }}>
            {children}
        </div>
    </div>
);

export const getAuditStatusLabel = (status?: string | null) => {
    if (!status) return "-";
    return statusMeta[status as AccountingDossierStatus]?.label || status;
};

export const renderAuditChange = (label: string, before?: string | null, after?: string | null) => {
    if (!before && !after) return null;
    return (
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <span style={{ minWidth: 78, color: "#6b7280", fontWeight: 600 }}>{label}</span>
            <Tag style={{ margin: 0, borderRadius: 999 }}>{before || "Trống"}</Tag>
            <span style={{ color: "#9ca3af" }}>→</span>
            <Tag color="processing" style={{ margin: 0, borderRadius: 999 }}>{after || "Trống"}</Tag>
        </div>
    );
};

export const buildAuditTimelineItem = (item: IAccountingDossierAuditLog) => {
    const meta = getAuditActionMeta(item.actionType);
    const targetLabel = item.targetType ? (targetTypeLabel[item.targetType] || item.targetType) : "";
    const hasDetails = item.fromStatus || item.toStatus || item.targetType || item.targetId || item.beforeValue || item.afterValue;

    return {
        color: meta.tone,
        dot: (
            <div
                style={{
                    width: 28,
                    height: 28,
                    borderRadius: 14,
                    display: "grid",
                    placeItems: "center",
                    color: meta.tone,
                    background: `${meta.tone}14`,
                    border: `1px solid ${meta.tone}40`,
                    fontSize: 14,
                }}
            >
                {meta.icon}
            </div>
        ),
        children: (
            <div
                style={{
                    background: "#fff",
                    border: "1px solid #edf0f5",
                    borderRadius: 10,
                    padding: "14px 16px",
                    boxShadow: "0 6px 18px rgba(15, 23, 42, 0.04)",
                    marginBottom: 8,
                }}
            >
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start" }}>
                    <div style={{ minWidth: 0 }}>
                        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                            <span style={{ fontSize: 16, fontWeight: 700, color: "#1f2937" }}>{meta.label}</span>
                            <Tag color="blue" style={{ margin: 0, borderRadius: 999, fontSize: 11 }}>{item.actionType}</Tag>
                        </div>
                        <div style={{ marginTop: 6, color: "#4b5563", lineHeight: 1.55, fontSize: 14 }}>
                            {item.note || "Không có ghi chú"}
                        </div>
                    </div>
                    <div style={{ color: "#6b7280", fontSize: 13, whiteSpace: "nowrap", paddingTop: 2 }}>
                        {formatDateTime(item.createdAt)}
                    </div>
                </div>

                {hasDetails && (
                    <div
                        style={{
                            marginTop: 12,
                            padding: "10px 12px",
                            borderRadius: 8,
                            background: "#f8fafc",
                            display: "flex",
                            flexDirection: "column",
                            gap: 8,
                            color: "#4b5563",
                            fontSize: 13,
                        }}
                    >
                        {(item.fromStatus || item.toStatus) &&
                            renderAuditChange("Trạng thái", getAuditStatusLabel(item.fromStatus), getAuditStatusLabel(item.toStatus))}
                        {(item.targetType || item.targetId) && (
                            <div>
                                <span style={{ color: "#6b7280", fontWeight: 600 }}>Đối tượng: </span>
                                <span>{targetLabel || "-"}{item.targetId ? ` #${item.targetId}` : ""}</span>
                            </div>
                        )}
                        {renderAuditChange("Dữ liệu", item.beforeValue, item.afterValue)}
                    </div>
                )}

                <div style={{ marginTop: 10, display: "flex", gap: 10, flexWrap: "wrap", color: "#6b7280", fontSize: 12 }}>
                    <span>Người thao tác: <strong style={{ color: "#374151" }}>{item.createdBy || "-"}</strong></span>
                    <span>IP: {item.ipAddress === "0:0:0:0:0:0:0:1" ? "localhost" : item.ipAddress || "-"}</span>
                </div>
            </div>
        ),
    };
};
