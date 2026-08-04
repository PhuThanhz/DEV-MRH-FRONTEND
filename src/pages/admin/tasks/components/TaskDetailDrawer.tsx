import React, { useState } from "react";
import {
    Button,
    Space,
    Typography,
    Popconfirm,
    Tabs,
    Popover,
} from "antd";
import {
    CheckCircleOutlined,
    DeleteOutlined,
    EditOutlined,
    ExclamationCircleOutlined,
    FieldTimeOutlined,
    FileTextOutlined,
    PlayCircleOutlined,
    StopOutlined,
    MoreOutlined,
} from "@ant-design/icons";
import LotusDetailDrawer from "@/components/common/drawer/LotusDetailDrawer";
import type { TaskPerms } from "../taskContext";
import { useTaskDetailState } from "../hooks/useTaskDetailState";
import { TaskSubmitResultModal } from "./TaskSubmitResultModal";
import { TaskRequestExtensionModal } from "./TaskRequestExtensionModal";
import { TaskDetailOverviewTab } from "./detail/TaskDetailOverviewTab";
import { TaskDetailChecklistTab } from "./detail/TaskDetailChecklistTab";
import { TaskDetailAttachmentsTab } from "./detail/TaskDetailAttachmentsTab";
import { TaskDetailDiscussionTab } from "./detail/TaskDetailDiscussionTab";
import "../TaskWorkspace.css";

const { Title, Text } = Typography;

interface Props {
    open: boolean;
    taskId: number | null;
    onClose: () => void;
    onEdit: () => void;
    user: any;
    perms: TaskPerms;
}

export const TaskDetailDrawer: React.FC<Props> = ({
    open,
    taskId,
    onClose,
    onEdit,
    user,
    perms,
}) => {
    const [activeTabKey, setActiveTabKey] = useState("overview");

    const {
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
    } = useTaskDetailState(taskId, user, perms, onClose);

    React.useEffect(() => {
        if (activeTabKey === "checklist" && totalChecklists === 0) {
            setActiveTabKey("overview");
        }
    }, [activeTabKey, totalChecklists]);

    if (!task) {
        return (
            <LotusDetailDrawer open={open} onClose={onClose} destroyOnClose>
                <div style={{ padding: 32, textAlign: "center" }}>
                    {isLoading ? <p>Đang tải thông tin tác vụ...</p> : <p>Không tìm thấy tác vụ</p>}
                </div>
            </LotusDetailDrawer>
        );
    }

    const resultSubmissions = task.submissions || [];
    const generalAttachmentCount = attachments.filter(
        (attachment) =>
            attachment.attachmentCategory !== "RESULT" &&
            !attachment.isResultAttachment
    ).length;
    const totalAttachmentsCount = generalAttachmentCount + resultSubmissions.length;
    const hasManagementActions =
        viewerContext.canEdit || viewerContext.canCancel || viewerContext.canDelete;

    const managementActions = (
        <div className="task-management-menu">
            <Text className="task-management-menu__label">Quản lý tác vụ</Text>
            {viewerContext.canEdit && (
                <Button type="text" icon={<EditOutlined />} onClick={onEdit}>
                    Chỉnh sửa thông tin
                </Button>
            )}
            {viewerContext.canCancel && (
                <Popconfirm
                    title="Bạn có chắc chắn muốn hủy tác vụ này?"
                    onConfirm={handleCancel}
                    okText="Hủy tác vụ"
                    cancelText="Đóng"
                >
                    <Button type="text" danger icon={<StopOutlined />}>
                        Hủy tác vụ
                    </Button>
                </Popconfirm>
            )}
            {viewerContext.canDelete && (
                <Popconfirm
                    title="Bạn có chắc chắn muốn xóa vĩnh viễn tác vụ này?"
                    onConfirm={handleDelete}
                    okText="Xóa vĩnh viễn"
                    cancelText="Đóng"
                >
                    <Button type="text" danger icon={<DeleteOutlined />}>
                        Xóa vĩnh viễn
                    </Button>
                </Popconfirm>
            )}
        </div>
    );

    const tabItems = [
        {
            key: "overview",
            label: <span className="task-tab-label">Tổng quan</span>,
            children: (
                <TaskDetailOverviewTab
                    task={task}
                    checklistPercent={checklistPercent}
                    completedChecklists={completedChecklists}
                    totalChecklists={totalChecklists}
                    attachmentCount={totalAttachmentsCount}
                    discussionCount={comments.length}
                    recentActivities={comments.slice(0, 4)}
                    onNavigateTab={setActiveTabKey}
                    showReworkInput={showReworkInput}
                    setShowReworkInput={setShowReworkInput}
                    reworkReason={reworkReason}
                    setReworkReason={setReworkReason}
                    handleRework={handleRework}
                    isReworkPending={approveMutation.isPending}
                    pendingExtension={pendingExtension}
                    viewerContext={viewerContext}
                    showRejectExtensionInput={showRejectExtensionInput}
                    setShowRejectExtensionInput={setShowRejectExtensionInput}
                    rejectExtensionNote={rejectExtensionNote}
                    setRejectExtensionNote={setRejectExtensionNote}
                    handleApproveExtension={handleApproveExtension}
                    handleRejectExtension={handleRejectExtension}
                    isDecideExtensionPending={decideExtensionMutation.isPending}
                />
            ),
        },
        ...(totalChecklists > 0
            ? [
                  {
                      key: "checklist",
                      label: (
                          <span className="task-tab-label">
                              <span>Việc cần làm</span>
                              {uncompletedChecklists > 0 && (
                                  <span className="task-tab-count">{uncompletedChecklists}</span>
                              )}
                          </span>
                      ),
                      children: (
                          <TaskDetailChecklistTab
                              taskId={task.id}
                              checklists={checklists}
                              completedChecklists={completedChecklists}
                              totalChecklists={totalChecklists}
                              checklistPercent={checklistPercent}
                              viewerContext={viewerContext}
                              currentUserId={currentUserId}
                              assignableUsers={checklistAssignableUsers}
                              newChecklistTitle={newChecklistTitle}
                              setNewChecklistTitle={setNewChecklistTitle}
                              newChecklistAssignedUser={newChecklistAssignedUser}
                              setNewChecklistAssignedUser={setNewChecklistAssignedUser}
                              handleAddChecklist={handleAddChecklist}
                              isCreatePending={createChecklistMutation.isPending}
                              toggleChecklistMutation={toggleChecklistMutation}
                              deleteChecklistMutation={deleteChecklistMutation}
                          />
                      ),
                  },
              ]
            : []),
        {
            key: "attachments",
            label: (
                <span className="task-tab-label">
                    <span>Tài liệu & kết quả</span>
                    {totalAttachmentsCount > 0 && (
                        <span className="task-tab-count">{totalAttachmentsCount}</span>
                    )}
                </span>
            ),
            children: (
                <TaskDetailAttachmentsTab
                    attachments={attachments}
                    resultSubmissions={resultSubmissions}
                    viewerContext={viewerContext}
                    taskStatus={task.status}
                    handleGuidanceFileUpload={handleGuidanceFileUpload}
                    handleWorkingFileUpload={handleWorkingFileUpload}
                    uploadingFile={uploadingFile}
                    isRegisterPending={registerAttachmentMutation.isPending}
                />
            ),
        },
        {
            key: "discussion",
            label: (
                <span className="task-tab-label">
                    <span>Trao đổi</span>
                    {comments.length > 0 && (
                        <span className="task-tab-count">{comments.length}</span>
                    )}
                </span>
            ),
            children: (
                <TaskDetailDiscussionTab
                    comments={comments}
                    viewerContext={viewerContext}
                    commentInput={commentInput}
                    setCommentInput={setCommentInput}
                    handleAddComment={handleAddComment}
                    isCreateCommentPending={createCommentMutation.isPending}
                />
            ),
        },
    ];

    return (
        <LotusDetailDrawer open={open} onClose={onClose} destroyOnClose>
            <div className="task-detail-shell">
                {/* Header Bar */}
                <div
                    className="task-detail-header"
                    style={{
                        padding: "18px 24px",
                        borderBottom: "1px solid #f1f5f9",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        background: "linear-gradient(180deg, #fff1f2 0%, #ffffff 60px, #ffffff 100%)",
                        borderTopLeftRadius: 24,
                        borderTopRightRadius: 24,
                    }}
                >
                    <Space align="center" className="task-detail-heading">
                        <div className="task-detail-heading__icon">
                            <FileTextOutlined />
                        </div>
                        <div className="task-detail-heading__copy">
                            <Text className="task-detail-eyebrow">Mã tác vụ: TV-{String(task.id).padStart(3, "0")}</Text>
                            <Title level={4} style={{ margin: 0 }}>
                                {task.title}
                            </Title>
                            <Text type="secondary" style={{ fontSize: 12 }}>
                                Theo dõi tiến độ, trao đổi và nghiệm thu kết quả
                            </Text>
                        </div>
                    </Space>

                    {/* Action Buttons Header */}
                    <Space wrap className="task-detail-actions">
                        {!viewerContext.isObserver && (
                            <>
                                {viewerContext.canStart && (
                                    <Button
                                        type="primary"
                                        icon={<PlayCircleOutlined />}
                                        onClick={handleStartTask}
                                        loading={updateStatusMutation.isPending}
                                        style={{ height: 36, borderRadius: 8, fontWeight: 600 }}
                                    >
                                        Bắt đầu làm
                                    </Button>
                                )}

                                {viewerContext.canSubmitResult && (
                                    <Button
                                        type="primary"
                                        className="task-submit-result-button"
                                        icon={<CheckCircleOutlined />}
                                        onClick={() => setSubmitModalOpen(true)}
                                        style={{
                                            height: 36,
                                            borderRadius: 8,
                                            fontWeight: 600,
                                            background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                                            borderColor: "transparent",
                                            boxShadow: "0 2px 6px rgba(16, 185, 129, 0.25)",
                                        }}
                                    >
                                        Nộp báo cáo kết quả
                                    </Button>
                                )}

                                {viewerContext.canApprove && (
                                    <Popconfirm
                                        title="Xác nhận nghiệm thu tác vụ"
                                        description="Tác vụ sẽ chuyển sang trạng thái Hoàn thành và không thể hoàn tác. Bạn chắc chắn chứ?"
                                        onConfirm={handleApprove}
                                        okText="Nghiệm thu"
                                        cancelText="Đóng"
                                    >
                                        <Button
                                            type="primary"
                                            icon={<CheckCircleOutlined />}
                                            loading={approveMutation.isPending}
                                            style={{
                                                height: 36,
                                                borderRadius: 8,
                                                fontWeight: 600,
                                                backgroundColor: "#16a34a",
                                                borderColor: "transparent",
                                                boxShadow: "0 2px 6px rgba(22, 163, 74, 0.25)",
                                            }}
                                        >
                                            Nghiệm thu
                                        </Button>
                                    </Popconfirm>
                                )}

                                {viewerContext.canReject && (
                                    <Button
                                        danger
                                        icon={<ExclamationCircleOutlined />}
                                        onClick={() => {
                                            setActiveTabKey("overview");
                                            setShowReworkInput(!showReworkInput);
                                        }}
                                        style={{ height: 36, borderRadius: 8, fontWeight: 600 }}
                                    >
                                        Yêu cầu làm lại
                                    </Button>
                                )}

                                {viewerContext.canRequestExtension && !pendingExtension && (
                                    <Button
                                        icon={<FieldTimeOutlined />}
                                        onClick={() => setExtensionModalOpen(true)}
                                        style={{ height: 36, borderRadius: 8, fontWeight: 600, color: "#d97706", borderColor: "#fde68a" }}
                                    >
                                        Xin gia hạn
                                    </Button>
                                )}

                                {viewerContext.canDecideExtension && pendingExtension && (
                                    <>
                                        <Popconfirm
                                            title="Xác nhận duyệt gia hạn"
                                            description="Hạn chót tác vụ sẽ được cập nhật theo đề xuất của người thực hiện. Bạn chắc chắn chứ?"
                                            onConfirm={handleApproveExtension}
                                            okText="Duyệt"
                                            cancelText="Đóng"
                                        >
                                            <Button
                                                type="primary"
                                                icon={<CheckCircleOutlined />}
                                                loading={decideExtensionMutation.isPending}
                                                style={{
                                                    height: 36,
                                                    borderRadius: 8,
                                                    fontWeight: 600,
                                                    backgroundColor: "#16a34a",
                                                    borderColor: "transparent",
                                                }}
                                            >
                                                Duyệt gia hạn
                                            </Button>
                                        </Popconfirm>
                                        <Button
                                            danger
                                            icon={<ExclamationCircleOutlined />}
                                            onClick={() => {
                                                setActiveTabKey("overview");
                                                setShowRejectExtensionInput(!showRejectExtensionInput);
                                            }}
                                            style={{ height: 36, borderRadius: 8, fontWeight: 600 }}
                                        >
                                            Từ chối gia hạn
                                        </Button>
                                    </>
                                )}

                                {hasManagementActions && (
                                    <Popover
                                        placement="bottomRight"
                                        trigger="click"
                                        content={managementActions}
                                    >
                                        <Button
                                            className="task-more-button"
                                            icon={<MoreOutlined />}
                                            aria-label="Mở menu quản lý tác vụ"
                                            style={{ height: 36, borderRadius: 8, fontWeight: 600 }}
                                        >
                                            Quản lý
                                        </Button>
                                    </Popover>
                                )}
                            </>
                        )}
                    </Space>
                </div>

                {/* Content Body with Sticky Tabs */}
                <div className="task-detail-body">
                    <Tabs
                        className="task-detail-tabs"
                        activeKey={activeTabKey}
                        onChange={setActiveTabKey}
                        items={tabItems}
                        style={{ width: "100%" }}
                    />
                </div>
            </div>

            {/* Submit Result Modal */}
            <TaskSubmitResultModal
                open={submitModalOpen}
                taskId={task.id}
                onClose={() => setSubmitModalOpen(false)}
            />

            {/* Request Extension Modal */}
            <TaskRequestExtensionModal
                open={extensionModalOpen}
                taskId={task.id}
                currentDueDate={task.dueDate}
                onClose={() => setExtensionModalOpen(false)}
            />
        </LotusDetailDrawer>
    );
};

export default TaskDetailDrawer;
