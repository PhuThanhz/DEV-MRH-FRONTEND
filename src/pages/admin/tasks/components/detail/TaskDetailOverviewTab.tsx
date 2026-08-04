import React from "react";
import {
    Card,
    Typography,
    Space,
    Alert,
    Input,
    Button,
    Avatar,
    Progress,
    Tag,
    Popconfirm,
} from "antd";
import {
    ApartmentOutlined,
    BankOutlined,
    BookOutlined,
    CalendarOutlined,
    CheckCircleOutlined,
    FieldTimeOutlined,
    FileDoneOutlined,
    FileTextOutlined,
    FlagOutlined,
    PaperClipOutlined,
    UserOutlined,
} from "@ant-design/icons";
import type { IResTaskDetailDTO, IResTaskExtensionRequestDTO, ITaskParticipantDTO } from "@/types/backend";
import { TASK_PRIORITY_META, TASK_STATUS_META, renderTaskStatusTag, renderTaskPriorityTag } from "../../taskMeta";
import { formatDateTime } from "../../taskUtils";
import type { TaskContext } from "../../taskContext";

const { Title, Text, Paragraph } = Typography;

interface Props {
    task: IResTaskDetailDTO;
    checklistPercent: number;
    completedChecklists: number;
    totalChecklists: number;
    attachmentCount: number;
    discussionCount: number;
    recentActivities: any[];
    onNavigateTab: (key: string) => void;
    showReworkInput: boolean;
    setShowReworkInput: (show: boolean) => void;
    reworkReason: string;
    setReworkReason: (reason: string) => void;
    handleRework: () => void;
    isReworkPending: boolean;
    pendingExtension: IResTaskExtensionRequestDTO | null;
    viewerContext: TaskContext;
    showRejectExtensionInput: boolean;
    setShowRejectExtensionInput: (show: boolean) => void;
    rejectExtensionNote: string;
    setRejectExtensionNote: (note: string) => void;
    handleApproveExtension: () => void;
    handleRejectExtension: () => void;
    isDecideExtensionPending: boolean;
}

interface InfoStatProps {
    icon: React.ReactNode;
    label: string;
    value: React.ReactNode;
    span?: "normal" | "double" | "full";
}

const InfoStat: React.FC<InfoStatProps> = ({
    icon,
    label,
    value,
    span = "normal",
}) => (
    <article className="task-info-stat" data-span={span}>
        <div className="task-info-stat__icon">
            {icon}
        </div>
        <div className="task-info-stat__copy">
            <Text className="task-info-stat__label">
                {label}
            </Text>
            <Text strong className="task-info-stat__value">
                {value}
            </Text>
        </div>
    </article>
);

const ROLE_META: Record<string, { label: string; color: string; bg: string; border: string; avatarBg: string }> = {
    CREATOR: { label: "Người giao việc", color: "#334155", bg: "#f8fafc", border: "#e2e8f0", avatarBg: "#475569" },
    ASSIGNEE: { label: "Người thực hiện chính", color: "#9f1239", bg: "#fff1f2", border: "#fecdd3", avatarBg: "#be123c" },
    COLLABORATOR: { label: "Người phối hợp", color: "#0369a1", bg: "#f0f9ff", border: "#bae6fd", avatarBg: "#0284c7" },
    OBSERVER: { label: "Người quan sát", color: "#15803d", bg: "#f0fdf4", border: "#bbf7d0", avatarBg: "#16a34a" },
};

const ParticipantRow: React.FC<{
    name: string;
    avatar?: string;
    role: keyof typeof ROLE_META;
}> = ({ name, avatar, role }) => {
    const meta = ROLE_META[role] || { label: role, color: "#334155", bg: "#f8fafc", border: "#e2e8f0", avatarBg: "#64748b" };
    return (
        <div
            style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "8px 12px",
                borderRadius: 10,
                backgroundColor: meta.bg,
                border: `1px solid ${meta.border}`,
                marginBottom: 6,
            }}
        >
            <Avatar
                src={avatar}
                size={32}
                style={{
                    backgroundColor: meta.avatarBg,
                    color: "#ffffff",
                    fontWeight: 700,
                    fontSize: 12,
                    flexShrink: 0,
                    boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
                }}
            >
                {(name || "?").charAt(0).toUpperCase()}
            </Avatar>
            <div style={{ minWidth: 0, flex: 1 }}>
                <Text strong style={{ fontSize: 13, color: "#0f172a", display: "block" }} ellipsis>
                    {name || "Chưa xác định"}
                </Text>
            </div>
            <span
                style={{
                    fontSize: 10.5,
                    fontWeight: 650,
                    padding: "2px 8px",
                    borderRadius: 6,
                    backgroundColor: "#ffffff",
                    color: meta.color,
                    border: `1px solid ${meta.border}`,
                    whiteSpace: "nowrap",
                }}
            >
                {meta.label}
            </span>
        </div>
    );
};

export const TaskDetailOverviewTab: React.FC<Props> = ({
    task,
    checklistPercent,
    completedChecklists,
    totalChecklists,
    attachmentCount,
    discussionCount,
    recentActivities,
    onNavigateTab,
    showReworkInput,
    setShowReworkInput,
    reworkReason,
    setReworkReason,
    handleRework,
    isReworkPending,
    pendingExtension,
    viewerContext,
    showRejectExtensionInput,
    setShowRejectExtensionInput,
    rejectExtensionNote,
    setRejectExtensionNote,
    handleApproveExtension,
    handleRejectExtension,
    isDecideExtensionPending,
}) => {
    const MAX_COLLAB_SHOW = 3;
    const collaborators = task.collaborators || [];
    const shownCollaborators = collaborators.slice(0, MAX_COLLAB_SHOW);
    const restCollaborators = collaborators.length - MAX_COLLAB_SHOW;

    const MAX_OBSERVER_SHOW = 2;
    const observers = task.observers || [];
    const shownObservers = observers.slice(0, MAX_OBSERVER_SHOW);
    const restObservers = observers.length - MAX_OBSERVER_SHOW;
    const statusMeta = TASK_STATUS_META[task.status];
    const priorityMeta = TASK_PRIORITY_META[task.priority];

    const submissions = (task as any).submissions || [];
    const latestSubmission = submissions.length > 0 ? submissions[submissions.length - 1] : null;

    return (
        <div className="task-overview-grid">
            {/* General Info Card */}
            <Card size="small" className="task-overview-main" style={{ borderRadius: 12 }}>
                {task.status === "PENDING_REVIEW" && (
                    <div
                        style={{
                            marginBottom: 18,
                            padding: "16px",
                            borderRadius: 12,
                            background: "#f8fafc",
                            border: "1px solid #e2e8f0",
                            boxShadow: "0 1px 3px rgba(15, 23, 42, 0.04)",
                        }}
                    >
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12, flexWrap: "wrap", gap: 10 }}>
                            <Space align="center" size={10}>
                                <div
                                    style={{
                                        width: 34,
                                        height: 34,
                                        borderRadius: 8,
                                        background: "#eff6ff",
                                        border: "1px solid #dbeafe",
                                        display: "grid",
                                        placeItems: "center",
                                        flexShrink: 0,
                                    }}
                                >
                                    <FileDoneOutlined style={{ fontSize: 18, color: "#2563eb" }} />
                                </div>
                                <div>
                                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                        <Text strong style={{ fontSize: 14, color: "#0f172a", lineHeight: 1.2 }}>
                                            Báo cáo kết quả chờ nghiệm thu
                                        </Text>
                                        <Tag color="blue" style={{ borderRadius: 6, margin: 0, fontSize: 11, fontWeight: 600 }}>
                                            Lần nộp #{latestSubmission?.submissionRound || 1}
                                        </Tag>
                                    </div>
                                    <Text type="secondary" style={{ fontSize: 11.5, color: "#64748b" }}>
                                        Vui lòng kiểm tra báo cáo bên dưới trước khi Phê duyệt nghiệm thu
                                    </Text>
                                </div>
                            </Space>

                            <Button
                                type="default"
                                size="small"
                                icon={<PaperClipOutlined style={{ color: "#2563eb" }} />}
                                onClick={() => onNavigateTab("attachments")}
                                style={{
                                    borderRadius: 8,
                                    borderColor: "#cbd5e1",
                                    fontSize: 12,
                                    fontWeight: 600,
                                    color: "#334155",
                                    background: "#ffffff",
                                    boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
                                }}
                            >
                                Tệp đính kèm ({attachmentCount})
                            </Button>
                        </div>

                        {latestSubmission ? (
                            <div style={{ background: "#ffffff", padding: "14px 16px", borderRadius: 10, border: "1px solid #e2e8f0" }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                                    <Text strong style={{ fontSize: 12.5, color: "#334155", display: "flex", alignItems: "center", gap: 6 }}>
                                        <FileTextOutlined style={{ color: "#2563eb" }} />
                                        Mô tả kết quả thực hiện:
                                    </Text>
                                    {latestSubmission.createdAt && (
                                        <Text type="secondary" style={{ fontSize: 11, color: "#94a3b8" }}>
                                            {formatDateTime(latestSubmission.createdAt)}
                                        </Text>
                                    )}
                                </div>
                                <Paragraph style={{ margin: 0, fontSize: 13, color: "#0f172a", whiteSpace: "pre-wrap", fontWeight: 450, lineHeight: 1.5 }}>
                                    {latestSubmission.resultSummary || (task as any).latestResultSummary || "Đã nộp báo cáo kết quả."}
                                </Paragraph>

                                {latestSubmission.deliverables && (
                                    <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px solid #f1f5f9", display: "flex", alignItems: "baseline", gap: 6 }}>
                                        <Text strong style={{ fontSize: 11.5, color: "#64748b", flexShrink: 0 }}>Minh chứng / Nơi lưu: </Text>
                                        <Text style={{ fontSize: 12.5, color: "#2563eb", fontWeight: 500, wordBreak: "break-all" }}>
                                            {latestSubmission.deliverables}
                                        </Text>
                                    </div>
                                )}

                                {latestSubmission.issues && (
                                    <div style={{ marginTop: 8, paddingTop: 8, borderTop: "1px solid #f1f5f9", display: "flex", alignItems: "baseline", gap: 6 }}>
                                        <Text strong style={{ fontSize: 11.5, color: "#64748b", flexShrink: 0 }}>Ghi chú / Rủi ro: </Text>
                                        <Text style={{ fontSize: 12.5, color: "#475569", fontWeight: 450 }}>
                                            {latestSubmission.issues}
                                        </Text>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div style={{ background: "#ffffff", padding: "14px 16px", borderRadius: 10, border: "1px solid #e2e8f0" }}>
                                <Text style={{ fontSize: 13, color: "#0f172a" }}>
                                    {(task as any).latestResultSummary || "Nhân viên đã gửi báo cáo kết quả công việc."}
                                </Text>
                            </div>
                        )}
                    </div>
                )}

                <div className="task-overview-main__heading">
                    <div className="task-work-content-heading">
                        <Title level={3}>Nội dung công việc</Title>
                    </div>
                </div>

                <section
                    className="task-execution-summary"
                    aria-labelledby="task-execution-summary-label"
                >
                    <Text
                        id="task-execution-summary-label"
                        className="task-meta-section-label"
                    >
                        Thông tin thực hiện
                    </Text>
                    <div className="task-info-stats">
                        <InfoStat
                            icon={<CheckCircleOutlined style={{ color: "#475569" }} />}
                            label="Trạng thái"
                            value={renderTaskStatusTag(task.status, task.overdue, "default", task.isOnTime)}
                        />
                        <InfoStat
                            icon={<FlagOutlined style={{ color: "#475569" }} />}
                            label="Độ ưu tiên"
                            value={renderTaskPriorityTag(task.priority)}
                        />
                        <InfoStat
                            icon={<FieldTimeOutlined style={{ color: "#475569" }} />}
                            label="Số giờ dự kiến"
                            value={
                                task.estimatedHours !== undefined
                                    && task.estimatedHours !== null
                                    ? `${task.estimatedHours} giờ`
                                    : "Chưa thiết lập"
                            }
                        />
                        <InfoStat
                            icon={<UserOutlined style={{ color: "#475569" }} />}
                            label="Người thực hiện chính"
                            value={
                                <Space align="center" size={6}>
                                    <Avatar
                                        size={25}
                                        src={task.assigneeAvatar}
                                        style={{ backgroundColor: "#be123c", color: "#ffffff", fontWeight: 700, fontSize: 12 }}
                                    >
                                        {(task.assigneeName || "?").charAt(0).toUpperCase()}
                                    </Avatar>
                                    <Text strong style={{ fontSize: 13, color: "#0f172a" }}>
                                        {task.assigneeName || "Chưa phân công"}
                                    </Text>
                                </Space>
                            }
                        />
                        <InfoStat
                            icon={<CalendarOutlined style={{ color: "#475569" }} />}
                            label="Thời gian thực hiện"
                            span="double"
                            value={`${formatDateTime(task.startDate)} → ${formatDateTime(task.dueDate)}`}
                        />
                        <InfoStat
                            icon={<BankOutlined style={{ color: "#475569" }} />}
                            label="Công ty"
                            value={task.companyName || "Chưa xác định"}
                        />
                        <InfoStat
                            icon={<ApartmentOutlined style={{ color: "#475569" }} />}
                            label="Phòng ban"
                            span="double"
                            value={task.departmentName || "Chưa xác định"}
                        />
                        <InfoStat
                            icon={<BookOutlined style={{ color: "#475569" }} />}
                            label="Nhiệm vụ JD"
                            span="full"
                            value={
                                task.jobDescriptionTaskTitle
                                    ? task.jobDescriptionTaskItemContent
                                        ? `${task.jobDescriptionTaskTitle} — ${task.jobDescriptionTaskItemContent}`
                                        : task.jobDescriptionTaskTitle
                                    : "Công việc phát sinh ngoài JD"
                            }
                        />
                    </div>
                </section>

                <section className="task-description-panel" aria-labelledby="task-description-label">
                    <Text id="task-description-label" className="task-description-label">
                        Mô tả chi tiết
                    </Text>
                    {task.description ? (
                        <Paragraph className="task-description-text">
                            {task.description}
                        </Paragraph>
                    ) : (
                        <Paragraph className="task-description-empty">
                            Người giao việc chưa cung cấp mô tả chi tiết.
                        </Paragraph>
                    )}
                </section>
            </Card>

            {/* Rework Alert & Input */}
            {task.status === "REWORK" && task.reworkReason && (
                <Alert
                    className="task-overview-alert"
                    message="Yêu Cầu Làm Lại (REWORK)"
                    description={task.reworkReason}
                    type="error"
                    showIcon
                    style={{ borderRadius: 10 }}
                />
            )}

            {showReworkInput && (
                <Card className="task-overview-alert" size="small" style={{ borderColor: "#ff4d4f", borderRadius: 12, background: "#fff2f0" }}>
                    <Title level={5} style={{ color: "#ff4d4f", margin: "0 0 8px 0" }}>
                        Lý Do Yêu Cầu Làm Lại
                    </Title>
                    <Input.TextArea
                        rows={3}
                        placeholder="Nhập lý do chi tiết yêu cầu người làm sửa lại..."
                        value={reworkReason}
                        onChange={(e) => setReworkReason(e.target.value)}
                        style={{ marginBottom: 12, borderRadius: 8 }}
                    />
                    <Space align="center">
                        <Button
                            type="primary"
                            danger
                            onClick={handleRework}
                            loading={isReworkPending}
                            style={{ borderRadius: 8 }}
                        >
                            Gửi Yêu Cầu Rework
                        </Button>
                        <Button onClick={() => setShowReworkInput(false)} style={{ borderRadius: 8 }}>
                            Hủy
                        </Button>
                    </Space>
                </Card>
            )}

            {/* Pending Extension Request Banner — hiển thị cho cả Người thực hiện lẫn Người giao việc */}
            {pendingExtension && (
                <Card
                    className="task-overview-alert"
                    size="small"
                    style={{ borderRadius: 12, border: "1.5px solid #fde68a", background: "#fffbeb" }}
                >
                    <Space align="start" size={10} style={{ width: "100%" }}>
                        <FieldTimeOutlined style={{ fontSize: 20, color: "#d97706", marginTop: 2 }} />
                        <div style={{ flex: 1 }}>
                            <Text strong style={{ fontSize: 13.5, color: "#92400e", display: "block" }}>
                                {pendingExtension.requestedByName || "Người thực hiện"} xin gia hạn hạn chót đến{" "}
                                {formatDateTime(pendingExtension.requestedDueDate)}
                            </Text>
                            <Text style={{ fontSize: 12.5, color: "#78350f", display: "block", marginTop: 4 }}>
                                Lý do: {pendingExtension.reason}
                            </Text>
                            {pendingExtension.currentDueDate && (
                                <Text type="secondary" style={{ fontSize: 11.5, display: "block", marginTop: 2 }}>
                                    Hạn chót hiện tại: {formatDateTime(pendingExtension.currentDueDate)}
                                </Text>
                            )}
                        </div>
                        {viewerContext.canDecideExtension && (
                            <Space>
                                <Popconfirm
                                    title="Xác nhận duyệt gia hạn"
                                    description="Hạn chót tác vụ sẽ được cập nhật theo đề xuất. Bạn chắc chắn chứ?"
                                    onConfirm={handleApproveExtension}
                                    okText="Duyệt"
                                    cancelText="Đóng"
                                >
                                    <Button
                                        type="primary"
                                        size="small"
                                        loading={isDecideExtensionPending}
                                        style={{ backgroundColor: "#16a34a", borderColor: "transparent", borderRadius: 6 }}
                                    >
                                        Duyệt
                                    </Button>
                                </Popconfirm>
                                <Button
                                    danger
                                    size="small"
                                    onClick={() => setShowRejectExtensionInput(!showRejectExtensionInput)}
                                    style={{ borderRadius: 6 }}
                                >
                                    Từ chối
                                </Button>
                            </Space>
                        )}
                    </Space>
                </Card>
            )}

            {showRejectExtensionInput && (
                <Card className="task-overview-alert" size="small" style={{ borderColor: "#ff4d4f", borderRadius: 12, background: "#fff2f0" }}>
                    <Title level={5} style={{ color: "#ff4d4f", margin: "0 0 8px 0" }}>
                        Lý Do Từ Chối Gia Hạn
                    </Title>
                    <Input.TextArea
                        rows={3}
                        placeholder="Nhập lý do từ chối yêu cầu gia hạn..."
                        value={rejectExtensionNote}
                        onChange={(e) => setRejectExtensionNote(e.target.value)}
                        style={{ marginBottom: 12, borderRadius: 8 }}
                    />
                    <Space align="center">
                        <Button
                            type="primary"
                            danger
                            onClick={handleRejectExtension}
                            loading={isDecideExtensionPending}
                            style={{ borderRadius: 8 }}
                        >
                            Gửi Từ Chối
                        </Button>
                        <Button onClick={() => setShowRejectExtensionInput(false)} style={{ borderRadius: 8 }}>
                            Hủy
                        </Button>
                    </Space>
                </Card>
            )}

            {/* Participants Card */}
            <Card
                className="task-overview-people"
                size="small"
                title={
                    <Text strong style={{ fontSize: 13.5, color: "#0f172a" }}>
                        Phân công & theo dõi
                    </Text>
                }
                style={{ borderRadius: 12 }}
            >
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    <ParticipantRow name={task.creatorName || ""} avatar={task.creatorAvatar} role="CREATOR" />
                    <ParticipantRow name={task.assigneeName || ""} avatar={task.assigneeAvatar} role="ASSIGNEE" />

                    {shownCollaborators.map((c: ITaskParticipantDTO) => (
                        <ParticipantRow key={c.id} name={c.userName} avatar={c.userAvatar} role="COLLABORATOR" />
                    ))}
                    {restCollaborators > 0 && (
                        <Text type="secondary" style={{ fontSize: 12, paddingLeft: 42 }}>
                            và {restCollaborators} người phối hợp khác
                        </Text>
                    )}

                    {shownObservers.map((o: ITaskParticipantDTO) => (
                        <ParticipantRow key={o.id} name={o.userName} avatar={o.userAvatar} role="OBSERVER" />
                    ))}
                    {restObservers > 0 && (
                        <Text type="secondary" style={{ fontSize: 12, paddingLeft: 42 }}>
                            và {restObservers} người quan sát khác
                        </Text>
                    )}
                </div>
            </Card>

            <section className="task-overview-workbench">
                <header>
                    <div>
                        <Text strong>Tiến độ & hoạt động</Text>
                        <Text type="secondary">
                            Tóm tắt nhanh tình trạng thực hiện của tác vụ
                        </Text>
                    </div>
                </header>

                <div className="task-overview-workbench__grid">
                    <div className="task-progress-panel">
                        {totalChecklists > 0 ? (
                            <>
                                <div className="task-progress-panel__heading">
                                    <div>
                                        <Text type="secondary">Tiến độ checklist</Text>
                                        <strong>{checklistPercent}%</strong>
                                    </div>
                                    <Text type="secondary">
                                        {completedChecklists}/{totalChecklists} mục hoàn thành
                                    </Text>
                                </div>
                                <Progress
                                    percent={checklistPercent}
                                    showInfo={false}
                                    strokeColor="#e8356d"
                                    trailColor="#f1f5f9"
                                    size="small"
                                />

                                <button
                                    type="button"
                                    className="task-progress-action-btn"
                                    onClick={() => onNavigateTab("checklist")}
                                >
                                    <span>Xem & quản lý checklist ({completedChecklists}/{totalChecklists})</span>
                                    <span>→</span>
                                </button>
                            </>
                        ) : (
                            <div style={{ display: "flex", flexDirection: "column", height: "100%", justifyContent: "center" }}>
                                <div style={{ marginBottom: 8 }}>
                                    <Text strong style={{ color: "#334155", display: "block", fontSize: 13 }}>
                                        Không có danh sách việc cần làm
                                    </Text>
                                    <Text type="secondary" style={{ fontSize: 12 }}>
                                        Tác vụ này không yêu cầu theo dõi các mục công việc nhỏ.
                                    </Text>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="task-activity-panel">
                        <div className="task-activity-panel__heading">
                            <Text strong>Hoạt động gần đây</Text>
                            <button type="button" onClick={() => onNavigateTab("discussion")}>
                                Xem tất cả
                            </button>
                        </div>

                        {recentActivities.length > 0 ? (
                            <div className="task-activity-list">
                                {recentActivities.map((activity: any) => (
                                    <div key={activity.id} className="task-activity-item">
                                        <span className="task-activity-item__dot" />
                                        <div>
                                            <Text strong>
                                                {activity.type === "AUDIT_LOG"
                                                    ? "Cập nhật hệ thống"
                                                    : activity.userName || "Thành viên"}
                                            </Text>
                                            <Text ellipsis>{activity.content}</Text>
                                        </div>
                                        <time>{formatDateTime(activity.createdAt)}</time>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="task-activity-empty">
                                Chưa có trao đổi hoặc cập nhật nào.
                            </div>
                        )}
                    </div>
                </div>
            </section>
        </div>
    );
};

export default TaskDetailOverviewTab;
