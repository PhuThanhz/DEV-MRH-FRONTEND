import React from "react";
import { Card, Typography } from "antd";
import { useDraggable } from "@dnd-kit/core";
import type { IResTaskDTO } from "@/types/backend";
import {
    renderTaskPriorityTag,
    renderTaskStatusTag,
    renderParticipantAvatarStack,
    renderTaskChecklistProgress,
    PRIORITY_COLORS,
} from "../../taskMeta";
import { formatDateOnly, getRelativeDueDateMeta } from "../../taskUtils";
import { ClockCircleOutlined, FieldTimeOutlined, BookOutlined } from "@ant-design/icons";

const { Text } = Typography;

export interface TaskCardProps {
    task: IResTaskDTO;
    onSelectTask: (t: IResTaskDTO) => void;
    showAssigneeName?: boolean;
    showContext?: boolean;
    style?: React.CSSProperties;
    className?: string;
    isDragging?: boolean;
}

export const TaskCard: React.FC<TaskCardProps> = React.memo(
    ({
        task,
        onSelectTask,
        showAssigneeName = true,
        showContext = true,
        style,
        className,
        isDragging = false,
    }) => {
        const priorityColor = PRIORITY_COLORS[task.priority] || "#94a3b8";
        const isRework = task.status === "REWORK";

        return (
            <Card
                size="small"
                hoverable
                onClick={() => onSelectTask(task)}
                className={className}
                style={{
                    borderRadius: 12,
                    border: isRework ? "1.5px solid #ff4d4f" : "1px solid #e2e8f0",
                    boxShadow: isDragging
                        ? "0 16px 32px -8px rgba(15, 23, 42, 0.16)"
                        : "0 1px 3px rgba(15, 23, 42, 0.04), 0 4px 6px -2px rgba(15, 23, 42, 0.02)",
                    background: isRework ? "#fff2f0" : "#ffffff",
                    position: "relative",
                    overflow: "hidden",
                    cursor: "pointer",
                    transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
                    ...style,
                }}
                styles={{ body: { padding: "13px 14px 12px 16px" } }}
            >
                {/* Left vertical accent line for Priority */}
                <div
                    style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        bottom: 0,
                        width: 3.5,
                        backgroundColor: priorityColor,
                    }}
                />

                {/* Header: Priority Tag (Left) & Status Tag (Right) */}
                <div
                    style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        gap: 6,
                        marginBottom: 8,
                        flexWrap: "wrap",
                    }}
                >
                    {renderTaskPriorityTag(task.priority)}
                    <div style={{ display: "flex", gap: 4, alignItems: "center", flexShrink: 0 }}>
                        {renderTaskStatusTag(task.status, task.overdue)}
                    </div>
                </div>

                {/* Task Title */}
                <Text
                    strong
                    style={{
                        fontSize: 13.5,
                        color: "#0f172a",
                        fontWeight: 650,
                        lineHeight: "1.4",
                        display: "block",
                        letterSpacing: "-0.01em",
                    }}
                >
                    {task.title}
                </Text>

                {/* Job Description Title / Context (if present) */}
                {showContext && task.jobDescriptionTaskTitle && (
                    <div
                        style={{
                            marginTop: 6,
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 5,
                            maxWidth: "100%",
                            padding: "2.5px 8px",
                            borderRadius: 6,
                            backgroundColor: "#f8fafc",
                            border: "1px solid #e2e8f0",
                        }}
                    >
                        <BookOutlined style={{ fontSize: 10.5, color: "#64748b", flexShrink: 0 }} />
                        <Text
                            ellipsis
                            style={{
                                fontSize: 10.5,
                                color: "#475569",
                                fontWeight: 600,
                                lineHeight: 1.2,
                            }}
                        >
                            <span style={{ color: "#94a3b8", fontWeight: 700, marginRight: 3 }}>JD:</span>
                            {task.jobDescriptionTaskItemContent
                                ? `${task.jobDescriptionTaskTitle} — ${task.jobDescriptionTaskItemContent}`
                                : task.jobDescriptionTaskTitle}
                        </Text>
                    </div>
                )}

                {/* Checklist / Progress */}
                {renderTaskChecklistProgress(
                    task.progress,
                    task.checklistDoneCount,
                    task.checklistTotalCount,
                    { width: "100%" }
                )}

                {/* Footer: Participant Avatars + Name & Due Date */}
                <div
                    style={{
                        marginTop: 11,
                        paddingTop: 9,
                        borderTop: "1px dashed #f1f5f9",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        gap: 8,
                    }}
                >
                    <div style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0, flex: 1 }}>
                        {renderParticipantAvatarStack(task, { showAssigneeName })}
                    </div>

                    {task.dueDate && (() => {
                        const dateMeta = getRelativeDueDateMeta(task.dueDate, task.status === "COMPLETED");
                        const isOverdue = dateMeta.status === "overdue";
                        const isToday = dateMeta.status === "today";
                        const isTomorrow = dateMeta.status === "tomorrow";

                        let color = "#475569";
                        let bg = "#f8fafc";
                        let border = "#e2e8f0";

                        if (isOverdue) {
                            color = "#dc2626";
                            bg = "#fef2f2";
                            border = "#fecaca";
                        } else if (isToday) {
                            color = "#059669";
                            bg = "#ecfdf5";
                            border = "#a7f3d0";
                        } else if (isTomorrow) {
                            color = "#0284c7";
                            bg = "#f0f9ff";
                            border = "#bae6fd";
                        }

                        return (
                            <span
                                style={{
                                    fontSize: 10.5,
                                    fontWeight: 650,
                                    color,
                                    backgroundColor: bg,
                                    border: `1px solid ${border}`,
                                    padding: "2px 7px",
                                    borderRadius: 6,
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: 4,
                                    flexShrink: 0,
                                    fontVariantNumeric: "tabular-nums",
                                }}
                            >
                                {isOverdue ? (
                                    <ClockCircleOutlined style={{ fontSize: 10.5, color: "#dc2626" }} />
                                ) : (
                                    <FieldTimeOutlined style={{ fontSize: 10.5 }} />
                                )}
                                {dateMeta.text}
                            </span>
                        );
                    })()}
                </div>
            </Card>
        );
    },
    (prevProps, nextProps) =>
        prevProps.task.id === nextProps.task.id &&
        prevProps.task.status === nextProps.task.status &&
        prevProps.task.priority === nextProps.task.priority &&
        prevProps.task.title === nextProps.task.title &&
        prevProps.task.progress === nextProps.task.progress &&
        prevProps.task.checklistDoneCount === nextProps.task.checklistDoneCount &&
        prevProps.task.checklistTotalCount === nextProps.task.checklistTotalCount &&
        prevProps.task.overdue === nextProps.task.overdue &&
        prevProps.task.assigneeName === nextProps.task.assigneeName &&
        prevProps.task.collaboratorCount === nextProps.task.collaboratorCount &&
        prevProps.task.dueDate === nextProps.task.dueDate &&
        prevProps.task.assigneeAvatar === nextProps.task.assigneeAvatar &&
        prevProps.task.jobDescriptionTaskTitle === nextProps.task.jobDescriptionTaskTitle &&
        prevProps.isDragging === nextProps.isDragging &&
        prevProps.showAssigneeName === nextProps.showAssigneeName &&
        prevProps.showContext === nextProps.showContext &&
        prevProps.onSelectTask === nextProps.onSelectTask
);

export const DraggableTaskCard: React.FC<{
    task: IResTaskDTO;
    onSelectTask: (t: IResTaskDTO) => void;
    showAssigneeName?: boolean;
    showContext?: boolean;
}> = React.memo(({ task, onSelectTask, showAssigneeName, showContext }) => {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
        id: String(task.id),
        data: { task },
    });

    const style: React.CSSProperties = {
        transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
        opacity: isDragging ? 0.6 : 1,
        marginBottom: 10,
        cursor: "grab",
        touchAction: "none",
        transition: isDragging ? "none" : "box-shadow 0.2s ease",
    };

    return (
        <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
            <TaskCard
                task={task}
                onSelectTask={onSelectTask}
                showAssigneeName={showAssigneeName}
                showContext={showContext}
                isDragging={isDragging}
            />
        </div>
    );
});
