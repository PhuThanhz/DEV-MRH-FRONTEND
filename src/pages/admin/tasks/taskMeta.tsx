import React from "react";
import { Tag, Avatar, Tooltip, Space, Progress } from "antd";
import {
    CheckCircleOutlined,
    ClockCircleOutlined,
    CloseCircleOutlined,
    ExclamationCircleOutlined,
    FieldTimeOutlined,
    SyncOutlined,
} from "@ant-design/icons";
import type { TaskPriorityType, TaskStatusType } from "@/types/backend";

export interface StatusMetaConfig {
    label: string;
    color: string;
    icon?: React.ReactNode;
}

export const TASK_STATUS_META: Record<TaskStatusType, StatusMetaConfig> = {
    TODO: {
        label: "Chưa thực hiện",
        color: "default",
    },
    IN_PROGRESS: {
        label: "Đang thực hiện",
        color: "processing",
    },
    PENDING_REVIEW: {
        label: "Chờ nghiệm thu",
        color: "warning",
    },
    COMPLETED: {
        label: "Hoàn thành",
        color: "success",
    },
    REWORK: {
        label: "Yêu cầu làm lại",
        color: "error",
    },
    CANCELLED: {
        label: "Đã hủy",
        color: "default",
    },
};

type TaskStatusTagVariant = "default" | "table";

export const renderTaskStatusTag = (
    status: TaskStatusType,
    overdue?: boolean,
    variant: TaskStatusTagVariant = "default",
    isOnTime?: boolean
) => {
    const meta = TASK_STATUS_META[status] || {
        label: status,
        color: "default",
    };

    const isOverdue = !!overdue && status !== "COMPLETED" && status !== "CANCELLED";
    const isTableVariant = variant === "table";
    const showOnTimeSuffix = status === "COMPLETED" && isOnTime !== undefined;

    let label = meta.label;
    if (isOverdue) {
        label = `${meta.label} (Quá hạn)`;
    } else if (showOnTimeSuffix) {
        label = `${meta.label} (${isOnTime ? "Đúng hạn" : "Trễ hạn"})`;
    }

    return (
        <Tag
            color={isTableVariant ? undefined : isOverdue ? "error" : showOnTimeSuffix && !isOnTime ? "warning" : meta.color}
            className={[
                "task-status-tag",
                isTableVariant ? "task-status-tag--table" : "",
                isOverdue ? "is-overdue" : "",
            ]
                .filter(Boolean)
                .join(" ")}
            data-status={status}
            style={{
                margin: 0,
                fontSize: 11,
                minWidth: 130,
                height: 26,
                borderRadius: 8,
                fontWeight: 600,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                textAlign: "center",
                whiteSpace: "nowrap",
            }}
        >
            {label}
        </Tag>
    );
};

export interface PriorityMetaConfig {
    label: string;
    color: string;
    bg: string;
    border: string;
    textColor: string;
    dotColor: string;
}

export const TASK_PRIORITY_META: Record<TaskPriorityType, PriorityMetaConfig> = {
    LOW: {
        label: "Thấp",
        color: "success",
        bg: "#f0fdf4",
        border: "#bbf7d0",
        textColor: "#15803d",
        dotColor: "#22c55e",
    },
    MEDIUM: {
        label: "Trung bình",
        color: "gold",
        bg: "#fffbeb",
        border: "#fde68a",
        textColor: "#b45309",
        dotColor: "#eab308",
    },
    HIGH: {
        label: "Cao",
        color: "orange",
        bg: "#fff7ed",
        border: "#fed7aa",
        textColor: "#c2410c",
        dotColor: "#f97316",
    },
    URGENT: {
        label: "Khẩn cấp",
        color: "error",
        bg: "#fef2f2",
        border: "#fecaca",
        textColor: "#b91c1c",
        dotColor: "#ef4444",
    },
};

export const renderTaskPriorityTag = (priority: TaskPriorityType) => {
    const meta = TASK_PRIORITY_META[priority] || {
        label: priority,
    };

    return (
        <span className="task-priority-badge" data-priority={priority}>
            <span className="task-priority-badge__dot" aria-hidden="true" />
            <span>{meta.label}</span>
        </span>
    );
};

export interface RoleTabOption {
    key: string;
    label: string;
    icon?: React.ReactNode;
}

export const TASK_ROLE_TABS: RoleTabOption[] = [
    { key: "ALL", label: "Tất cả các vai trò" },
    { key: "MY_ASSIGNED", label: "Đang thực hiện" },
    { key: "MY_COLLABORATING", label: "Đang hỗ trợ" },
    { key: "MY_CREATED", label: "Thiết lập bởi tôi" },
    { key: "MY_OBSERVING", label: "Đang theo dõi" },
];

export const PRIORITY_COLORS: Record<TaskPriorityType, string> = {
    LOW: "#22c55e",
    MEDIUM: "#eab308",
    HIGH: "#f97316",
    URGENT: "#ef4444",
};

export const renderTaskPriorityIndicator = (priority: TaskPriorityType) => {
    const color = PRIORITY_COLORS[priority] || "#94a3b8";
    const label = TASK_PRIORITY_META[priority]?.label || priority;

    return (
        <Tooltip title={`Độ ưu tiên: ${label}`}>
            <span
                style={{
                    display: "inline-block",
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    backgroundColor: color,
                    boxShadow: `0 0 0 2px ${color}33`,
                    marginRight: 4,
                }}
            />
        </Tooltip>
    );
};

export const renderParticipantAvatarStack = (
    task: any,
    options?: { showAssigneeName?: boolean }
) => {
    const showAssigneeName = options?.showAssigneeName ?? false;
    const members: { name: string; avatar?: string; role: string; color: string; isBadge?: boolean }[] = [];

    if (task.assigneeName) {
        members.push({
            name: task.assigneeName,
            avatar: task.assigneeAvatar,
            role: "Người thực hiện",
            color: "#3b82f6",
        });
    }

    if (task.collaborators && Array.isArray(task.collaborators) && task.collaborators.length > 0) {
        task.collaborators.forEach((c: any) => {
            if (c.userName && c.userName !== task.assigneeName) {
                members.push({
                    name: c.userName,
                    role: "Người phối hợp",
                    color: "#06b6d4",
                });
            }
        });
    } else if (task.collaboratorCount && task.collaboratorCount > 0) {
        members.push({
            name: `+${task.collaboratorCount}`,
            role: `${task.collaboratorCount} người phối hợp`,
            color: "#0284c7",
            isBadge: true,
        });
    }

    if (members.length === 0) {
        return <span style={{ fontSize: 12, color: "#94a3b8" }}>Chưa phân công</span>;
    }

    const avatarGroup = (
        <Avatar.Group size="small" max={{ count: 4, style: { color: "#f56a00", backgroundColor: "#fde3cf", fontSize: 11 } }}>
            {members.map((m, idx) => (
                <Tooltip key={idx} title={`${m.name}${m.isBadge ? "" : ` (${m.role})`}`}>
                    <Avatar
                        src={m.avatar}
                        style={{
                            backgroundColor: m.isBadge ? "#e0f2fe" : m.color,
                            color: m.isBadge ? "#0284c7" : "#ffffff",
                            fontSize: 11,
                            fontWeight: 600,
                        }}
                    >
                        {m.isBadge ? m.name : m.name.charAt(0).toUpperCase()}
                    </Avatar>
                </Tooltip>
            ))}
        </Avatar.Group>
    );

    if (!showAssigneeName || !task.assigneeName) {
        return avatarGroup;
    }

    return (
        <Space size={6} align="center">
            {avatarGroup}
            <span style={{ fontSize: 13, color: "#1e293b", fontWeight: 500 }}>{task.assigneeName}</span>
        </Space>
    );
};

export const renderTaskChecklistProgress = (
    progress: number = 0,
    checklistDoneCount: number = 0,
    checklistTotalCount: number = 0,
    options?: { width?: number | string }
) => {
    if (!checklistTotalCount) return null;
    const isCompleted = checklistDoneCount === checklistTotalCount;
    return (
        <div style={{ marginTop: 4, display: "inline-flex", alignItems: "center", gap: 8 }}>
            <Progress
                percent={progress}
                size="small"
                showInfo={false}
                strokeColor={isCompleted ? "#52c41a" : "#1677ff"}
                trailColor="#f1f5f9"
                style={{ width: options?.width ?? 80, margin: 0 }}
            />
            <span style={{ fontSize: 11, color: "#64748b", fontWeight: 500, whiteSpace: "nowrap" }}>
                {checklistDoneCount}/{checklistTotalCount} ({progress}%)
            </span>
        </div>
    );
};
