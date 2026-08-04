import React, { useMemo, useState } from "react";
import {
    Avatar,
    Button,
    Card,
    Empty,
    Input,
    Timeline,
    Typography,
} from "antd";
import {
    AuditOutlined,
    CommentOutlined,
    SendOutlined,
    UnorderedListOutlined,
} from "@ant-design/icons";
import type { TaskContext } from "../../taskContext";
import { formatDateTime } from "../../taskUtils";
import { TaskSegmentedControl } from "../common/TaskSegmentedControl";

const { Text, Paragraph } = Typography;

interface Props {
    comments: any[];
    viewerContext: TaskContext;
    commentInput: string;
    setCommentInput: (val: string) => void;
    handleAddComment: () => void;
    isCreateCommentPending: boolean;
}

const getTimestamp = (value?: string) => {
    if (!value) return 0;
    const timestamp = new Date(value).getTime();
    return Number.isNaN(timestamp) ? 0 : timestamp;
};

export const TaskDetailDiscussionTab: React.FC<Props> = ({
    comments,
    viewerContext,
    commentInput,
    setCommentInput,
    handleAddComment,
    isCreateCommentPending,
}) => {
    const [filterType, setFilterType] = useState<"ALL" | "COMMENT" | "AUDIT_LOG">("ALL");

    const newestFirstComments = useMemo(
        () =>
            [...comments].sort(
                (left, right) =>
                    getTimestamp(right.createdAt) - getTimestamp(left.createdAt) ||
                    Number(right.id || 0) - Number(left.id || 0)
            ),
        [comments]
    );

    const filteredComments = useMemo(() => {
        if (filterType === "ALL") return newestFirstComments;
        return newestFirstComments.filter((comment) => comment.type === filterType);
    }, [newestFirstComments, filterType]);

    const commentCount = useMemo(
        () => comments.filter((comment) => comment.type === "COMMENT").length,
        [comments]
    );
    const auditCount = useMemo(
        () => comments.filter((comment) => comment.type === "AUDIT_LOG").length,
        [comments]
    );

    return (
        <Card size="small" className="task-discussion-card">
            <header className="task-discussion-header">
                <div>
                    <Text strong>Thảo luận và nhật ký</Text>
                    <Text type="secondary">Hoạt động mới nhất được hiển thị trước.</Text>
                </div>
                <TaskSegmentedControl
                    className="task-discussion-filter"
                    value={filterType}
                    onChange={setFilterType}
                    options={[
                        {
                            label: `Tất cả ${comments.length}`,
                            value: "ALL",
                            icon: <UnorderedListOutlined />,
                        },
                        {
                            label: `Thảo luận ${commentCount}`,
                            value: "COMMENT",
                            icon: <CommentOutlined />,
                        },
                        {
                            label: `Nhật ký ${auditCount}`,
                            value: "AUDIT_LOG",
                            icon: <AuditOutlined />,
                        },
                    ]}
                    ariaLabel="Lọc hoạt động tác vụ"
                />
            </header>

            {!viewerContext.isObserver && (
                <div className="task-comment-composer">
                    <Input.TextArea
                        variant="borderless"
                        autoSize={{ minRows: 2, maxRows: 5 }}
                        placeholder="Viết nội dung trao đổi với người tham gia tác vụ..."
                        value={commentInput}
                        onChange={(event) => setCommentInput(event.target.value)}
                        onPressEnter={(event) => {
                            if (!event.shiftKey && commentInput.trim()) {
                                event.preventDefault();
                                handleAddComment();
                            }
                        }}
                    />
                    <div className="task-comment-composer__footer">
                        <div />
                        <Button
                            type="primary"
                            icon={<SendOutlined />}
                            onClick={handleAddComment}
                            loading={isCreateCommentPending}
                            disabled={!commentInput.trim()}
                            className="task-comment-submit-btn"
                        >
                            Gửi trao đổi
                        </Button>
                    </div>
                </div>
            )}

            {filteredComments.length > 0 ? (
                <Timeline
                    className="task-discussion-timeline"
                    items={filteredComments.map((comment: any, index) => {
                        const isAuditLog = comment.type === "AUDIT_LOG";
                        const displayName = comment.userName || "Thành viên";
                        return {
                            dot: isAuditLog ? (
                                <span className="task-activity-dot is-audit">
                                    <AuditOutlined />
                                </span>
                            ) : (
                                <span className="task-activity-dot is-comment">
                                    <CommentOutlined />
                                </span>
                            ),
                            children: (
                                <article
                                    className="task-discussion-entry"
                                    data-kind={isAuditLog ? "audit" : "comment"}
                                    data-latest={index === 0 ? "true" : "false"}
                                >
                                    <div className="task-discussion-entry__header">
                                        <div className="task-discussion-entry__identity">
                                            {!isAuditLog && (
                                                <Avatar
                                                    src={comment.userAvatar}
                                                    size={26}
                                                    className="task-entry-avatar"
                                                >
                                                    {displayName.charAt(0).toUpperCase()}
                                                </Avatar>
                                            )}
                                            <Text strong className="task-entry-name">
                                                {isAuditLog ? "Nhật ký hệ thống" : displayName}
                                            </Text>
                                            {index === 0 && (
                                                <span className="task-discussion-entry__latest">
                                                    Mới nhất
                                                </span>
                                            )}
                                        </div>
                                        <time dateTime={comment.createdAt}>
                                            {formatDateTime(comment.createdAt)}
                                        </time>
                                    </div>
                                    <Paragraph className="task-entry-content">{comment.content}</Paragraph>
                                </article>
                            ),
                        };
                    })}
                />
            ) : (
                <Empty
                    className="task-discussion-empty"
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description="Chưa có hoạt động trong mục này"
                />
            )}
        </Card>
    );
};

export default TaskDetailDiscussionTab;
