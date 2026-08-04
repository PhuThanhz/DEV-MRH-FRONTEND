import React from "react";
import {
    Card,
    Space,
    Typography,
    Upload,
    Button,
    Tag,
    Collapse,
    Avatar,
} from "antd";
import {
    UploadOutlined,
    FileImageOutlined,
    FilePdfOutlined,
    FileWordOutlined,
    FileExcelOutlined,
    FileZipOutlined,
    FileTextOutlined,
    EyeOutlined,
    DownloadOutlined,
    BookOutlined,
    TeamOutlined,
} from "@ant-design/icons";
import type { TaskContext } from "../../taskContext";
import { formatDateTime, formatFileSize } from "../../taskUtils";
import type {
    IResTaskAttachmentDTO,
    TaskStatusType,
} from "@/types/backend";
import ActionButton from "@/components/common/ui/ActionButton";

const { Text, Paragraph } = Typography;

interface Props {
    attachments: IResTaskAttachmentDTO[];
    resultSubmissions: any[];
    viewerContext: TaskContext;
    taskStatus: TaskStatusType;
    handleGuidanceFileUpload: (options: any) => void;
    handleWorkingFileUpload: (options: any) => void;
    uploadingFile: boolean;
    isRegisterPending: boolean;
}

const ALLOWED_ATTACHMENT_EXT = ".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.webp";

const cleanFileName = (fileName: string): string => {
    if (!fileName) return "Untitled";
    return fileName.replace(/^\d+[-_]/, "");
};

const getFileIconAndBg = (fileName: string) => {
    const ext = fileName?.split(".").pop()?.toLowerCase() || "";
    if (["png", "jpg", "jpeg", "gif", "webp", "svg"].includes(ext)) {
        return {
            icon: <FileImageOutlined style={{ fontSize: 20, color: "#ec4899" }} />,
            bgColor: "#fce7f3",
            borderColor: "#fbcfe8",
        };
    }
    if (ext === "pdf") {
        return {
            icon: <FilePdfOutlined style={{ fontSize: 20, color: "#ef4444" }} />,
            bgColor: "#fee2e2",
            borderColor: "#fca5a5",
        };
    }
    if (["doc", "docx"].includes(ext)) {
        return {
            icon: <FileWordOutlined style={{ fontSize: 20, color: "#2563eb" }} />,
            bgColor: "#dbeafe",
            borderColor: "#bfdbfe",
        };
    }
    if (["xls", "xlsx", "csv"].includes(ext)) {
        return {
            icon: <FileExcelOutlined style={{ fontSize: 20, color: "#16a34a" }} />,
            bgColor: "#dcfce7",
            borderColor: "#bbf7d0",
        };
    }
    if (["zip", "rar", "7z"].includes(ext)) {
        return {
            icon: <FileZipOutlined style={{ fontSize: 20, color: "#d97706" }} />,
            bgColor: "#fef3c7",
            borderColor: "#fde68a",
        };
    }
    return {
        icon: <FileTextOutlined style={{ fontSize: 20, color: "#64748b" }} />,
        bgColor: "#f1f5f9",
        borderColor: "#e2e8f0",
    };
};

export const TaskDetailAttachmentsTab: React.FC<Props> = ({
    attachments,
    resultSubmissions,
    viewerContext,
    taskStatus,
    handleGuidanceFileUpload,
    handleWorkingFileUpload,
    uploadingFile,
    isRegisterPending,
}) => {
    const isTerminal = taskStatus === "COMPLETED" || taskStatus === "CANCELLED";
    const canUploadGuidance =
        !isTerminal && (viewerContext.isCreator || viewerContext.isAdmin);
    const canUploadWorking =
        !isTerminal &&
        (viewerContext.isAssignee ||
            viewerContext.isCollaborator ||
            viewerContext.isAdmin);

    const guidanceAttachments = attachments.filter(
        (attachment) =>
            attachment.attachmentCategory === "GUIDANCE" &&
            !attachment.isResultAttachment
    );
    const workingAttachments = attachments.filter(
        (attachment) =>
            attachment.attachmentCategory === "WORKING" &&
            !attachment.isResultAttachment
    );

    const renderAttachmentCard = (att: IResTaskAttachmentDTO) => {
        const { icon, bgColor, borderColor } = getFileIconAndBg(att.fileName);
        const displayName = cleanFileName(att.fileName);
        const uploaderName = att.uploadedByName;

        return (
            <div
                key={att.id || att.fileName}
                style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "12px 16px",
                    backgroundColor: "#ffffff",
                    borderRadius: 12,
                    border: "1px solid #e2e8f0",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
                    transition: "all 0.2s ease",
                    gap: 16,
                }}
            >
                <div style={{ display: "flex", alignItems: "center", gap: 14, minWidth: 0, flex: 1 }}>
                    <div
                        style={{
                            width: 42,
                            height: 42,
                            borderRadius: 10,
                            backgroundColor: bgColor,
                            border: `1px solid ${borderColor}`,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                        }}
                    >
                        {icon}
                    </div>
                    <div style={{ minWidth: 0, flex: 1 }}>
                        <a
                            href={`/api/v1/files/view?fileName=${att.fileName}`}
                            target="_blank"
                            rel="noreferrer"
                            style={{
                                fontSize: 13.5,
                                fontWeight: 600,
                                color: "#0f172a",
                                display: "block",
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                            }}
                            title={att.fileName}
                        >
                            {displayName}
                        </a>
                        <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 4, flexWrap: "wrap" }}>
                            <Text type="secondary" style={{ fontSize: 12, color: "#64748b" }}>
                                {formatFileSize(att.fileSize)}
                            </Text>
                            {uploaderName && (
                                <span style={{ fontSize: 11.5, color: "#64748b", display: "inline-flex", alignItems: "center", gap: 4 }}>
                                    <Avatar size={16} style={{ backgroundColor: "#ec4899", fontSize: 9 }}>
                                        {uploaderName.charAt(0).toUpperCase()}
                                    </Avatar>
                                    <span>Tải lên bởi: <strong>{uploaderName}</strong></span>
                                </span>
                            )}
                            {att.createdAt && (
                                <Text type="secondary" style={{ fontSize: 11.5, color: "#94a3b8" }}>
                                    • {formatDateTime(att.createdAt)}
                                </Text>
                            )}
                        </div>
                    </div>
                </div>
                <Space size={6} className="task-attachment-file__actions">
                    <ActionButton
                        variant="view"
                        tooltip="Xem tập tin"
                        aria-label={`Xem ${displayName}`}
                        icon={<EyeOutlined />}
                        href={`/api/v1/files/view?fileName=${att.fileName}`}
                        target="_blank"
                    />
                    <ActionButton
                        variant="download"
                        tooltip="Tải tập tin về máy"
                        aria-label={`Tải ${displayName}`}
                        icon={<DownloadOutlined />}
                        href={`/api/v1/files/download?fileName=${att.fileName}`}
                        target="_blank"
                    />
                </Space>
            </div>
        );
    };

    const renderSubmissionContent = (sub: any) => (
        <div className="task-submission-report">
            <div className="task-submission-report__section">
                <Text className="task-submission-report__label">Kết quả đã hoàn thành</Text>
                <Paragraph>{sub.resultSummary}</Paragraph>
            </div>

            {sub.deliverables && (
                <div className="task-submission-report__section">
                    <Text className="task-submission-report__label">Sản phẩm bàn giao / liên kết</Text>
                    <Paragraph>{sub.deliverables}</Paragraph>
                </div>
            )}

            {(sub.issues || sub.nextSteps) && (
                <div className="task-submission-report__grid">
                    {sub.issues && (
                        <div className="task-submission-report__section" data-kind="issue">
                            <Text className="task-submission-report__label">Ghi chú bàn giao</Text>
                            <Paragraph>{sub.issues}</Paragraph>
                        </div>
                    )}
                    {sub.nextSteps && (
                        <div className="task-submission-report__section">
                            <Text className="task-submission-report__label">Lưu ý bàn giao / bước tiếp theo</Text>
                            <Paragraph>{sub.nextSteps}</Paragraph>
                        </div>
                    )}
                </div>
            )}

            {sub.decision && (
                <Tag color={sub.decision === "APPROVE" ? "green" : "red"}>
                    Quyết định: {sub.decision} {sub.decisionReason ? `(${sub.decisionReason})` : ""}
                </Tag>
            )}

            {sub.attachments && sub.attachments.length > 0 && (
                <div className="task-submission-report__attachments">
                    <Text strong>Tệp minh chứng ({sub.attachments.length})</Text>
                    {sub.attachments.map((att: IResTaskAttachmentDTO) => renderAttachmentCard(att))}
                </div>
            )}
        </div>
    );

    const renderAttachmentGroup = ({
        title,
        description,
        items,
        icon,
        canUpload,
        uploadLabel,
        handleUpload,
        emptyText,
        kind,
    }: {
        title: string;
        description: string;
        items: IResTaskAttachmentDTO[];
        icon: React.ReactNode;
        canUpload: boolean;
        uploadLabel: string;
        handleUpload: (options: any) => void;
        emptyText: string;
        kind: "guidance" | "working";
    }) => (
        <Card
            size="small"
            className="task-attachment-group"
            data-kind={kind}
            title={
                <div className="task-attachment-group__heading">
                    <span className="task-attachment-group__icon">{icon}</span>
                    <span>
                        <Text strong>{title} ({items.length})</Text>
                        <Text type="secondary">{description}</Text>
                    </span>
                </div>
            }
            extra={
                canUpload ? (
                    <Upload customRequest={handleUpload} showUploadList={false} accept={ALLOWED_ATTACHMENT_EXT}>
                        <Button
                            type="primary"
                            size="small"
                            icon={<UploadOutlined />}
                            loading={uploadingFile || isRegisterPending}
                        >
                            {uploadLabel}
                        </Button>
                    </Upload>
                ) : null
            }
        >
            {items.length > 0 ? (
                <div className="task-attachment-group__list">
                    {items.map((attachment) => renderAttachmentCard(attachment))}
                </div>
            ) : (
                <div className="task-attachment-group__empty">
                    <Text type="secondary">{emptyText}</Text>
                </div>
            )}
        </Card>
    );

    const collapseItems = resultSubmissions.map((sub: any) => ({
        key: String(sub.id),
        label: (
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
                <span style={{ fontWeight: 600 }}>
                    Vòng Báo Cáo #{sub.submissionRound} - Nộp bởi {sub.submittedByName || sub.submittedBy}
                </span>
                <Text type="secondary" style={{ fontSize: 12 }}>
                    {formatDateTime(sub.submittedAt)}
                </Text>
            </div>
        ),
        children: renderSubmissionContent(sub),
    }));

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {renderAttachmentGroup({
                title: "Tài liệu giao việc",
                description: "Quy định, biểu mẫu và tài liệu hướng dẫn do Người giao việc cung cấp.",
                items: guidanceAttachments,
                icon: <BookOutlined />,
                canUpload: canUploadGuidance,
                uploadLabel: "Tải tài liệu giao việc",
                handleUpload: handleGuidanceFileUpload,
                emptyText: "Người giao việc chưa cung cấp tài liệu hướng dẫn.",
                kind: "guidance",
            })}

            {renderAttachmentGroup({
                title: "Tệp làm việc chung",
                description: "Tài liệu đang xử lý, bản nháp và tệp phối hợp của nhân viên.",
                items: workingAttachments,
                icon: <TeamOutlined />,
                canUpload: canUploadWorking,
                uploadLabel: "Thêm tệp làm việc",
                handleUpload: handleWorkingFileUpload,
                emptyText: "Chưa có tệp làm việc chung nào được tải lên.",
                kind: "working",
            })}

            {/* Submissions History Card */}
            {resultSubmissions.length > 0 && (
                <Card
                    size="small"
                    title={
                        <Text strong style={{ fontSize: 14, color: "#0f172a" }}>
                            Lịch Sử Báo Cáo Kết Quả Nghiệm Thu ({resultSubmissions.length} vòng)
                        </Text>
                    }
                    style={{ borderRadius: 12, border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}
                >
                    {resultSubmissions.length > 2 ? (
                        <Collapse defaultActiveKey={[String(resultSubmissions[resultSubmissions.length - 1].id)]} items={collapseItems} />
                    ) : (
                        resultSubmissions.map((sub: any) => (
                            <Card
                                key={sub.id}
                                type="inner"
                                size="small"
                                title={`Vòng Báo Cáo #${sub.submissionRound} - Nộp bởi ${sub.submittedByName || sub.submittedBy}`}
                                extra={<Text type="secondary" style={{ fontSize: 12 }}>{formatDateTime(sub.submittedAt)}</Text>}
                                style={{ marginBottom: 12, borderRadius: 10 }}
                            >
                                {renderSubmissionContent(sub)}
                            </Card>
                        ))
                    )}
                </Card>
            )}
        </div>
    );
};

export default TaskDetailAttachmentsTab;
