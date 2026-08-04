import React from "react";
import { Tag, Typography } from "antd";
import { LockOutlined } from "@ant-design/icons";
import { useDroppable } from "@dnd-kit/core";
import type { IResTaskDTO } from "@/types/backend";
import { DraggableTaskCard } from "./TaskCard";

const { Title } = Typography;

export interface TaskKanbanColumnConfig {
    id: string;
    title: string;
    color: string;
    icon: React.ReactElement<{ style?: React.CSSProperties }>;
    allowDrop?: boolean;
    lockedLabel?: string;
}

interface TaskKanbanColumnProps {
    column: TaskKanbanColumnConfig;
    tasks: IResTaskDTO[];
    onSelectTask: (task: IResTaskDTO) => void;
    minWidth?: number;
    maxWidth?: number;
    emptyText?: string;
}

export const TaskKanbanColumn: React.FC<TaskKanbanColumnProps> = React.memo(
    ({
        column,
        tasks,
        onSelectTask,
        minWidth = 255,
        maxWidth,
        emptyText = "Chưa có tác vụ nào",
    }) => {
        const allowDrop = column.allowDrop !== false;
        const { setNodeRef, isOver } = useDroppable({
            id: column.id,
            disabled: !allowDrop,
        });
        const isHoverActive = isOver && allowDrop;

        return (
            <section
                ref={setNodeRef}
                className="kanban-column"
                aria-label={`${column.title}, ${tasks.length} tác vụ`}
                style={{
                    flex: `1 1 ${minWidth}px`,
                    minWidth,
                    maxWidth,
                    display: "flex",
                    overflow: "hidden",
                    flexDirection: "column",
                    border: `1px solid ${isHoverActive ? column.color : "#e2e8f0"}`,
                    borderTop: `3.5px solid ${column.color}`,
                    borderRadius: 14,
                    background: isHoverActive ? "#f1f5f9" : "#f8fafc",
                    boxShadow: isHoverActive
                        ? `0 12px 24px -6px ${column.color}25`
                        : "0 1px 3px rgba(15, 23, 42, 0.03)",
                    transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
                }}
            >
                <header
                    style={{
                        display: "flex",
                        padding: "12px 14px",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 10,
                        borderBottom: "1px solid #edf2f7",
                        background: "#ffffff",
                    }}
                >
                    <div
                        style={{
                            display: "flex",
                            minWidth: 0,
                            alignItems: "center",
                            gap: 8,
                        }}
                    >
                        <div
                            aria-hidden="true"
                            style={{
                                display: "flex",
                                width: 30,
                                height: 30,
                                alignItems: "center",
                                justifyContent: "center",
                                flexShrink: 0,
                                border: `1px solid ${column.color}22`,
                                borderRadius: 9,
                                color: column.color,
                                background: `${column.color}10`,
                            }}
                        >
                            {column.icon}
                        </div>
                        <Title
                            level={5}
                            ellipsis
                            style={{
                                minWidth: 0,
                                margin: 0,
                                color: "#0f172a",
                                fontSize: 13.5,
                                fontWeight: 700,
                                letterSpacing: "-0.01em",
                            }}
                        >
                            {column.title}
                        </Title>
                    </div>

                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            flexShrink: 0,
                            gap: 6,
                        }}
                    >
                        {!allowDrop && column.lockedLabel ? (
                            <Tag
                                icon={<LockOutlined style={{ fontSize: 10 }} />}
                                style={{
                                    margin: 0,
                                    padding: "1px 6px",
                                    borderColor: "#fecaca",
                                    borderRadius: 6,
                                    color: "#dc2626",
                                    background: "#fee2e2",
                                    fontSize: 10,
                                    fontWeight: 650,
                                }}
                            >
                                {column.lockedLabel}
                            </Tag>
                        ) : null}
                        <span
                            aria-label={`${tasks.length} tác vụ`}
                            style={{
                                display: "inline-flex",
                                minWidth: 24,
                                height: 22,
                                padding: "0 8px",
                                alignItems: "center",
                                justifyContent: "center",
                                border: `1px solid ${
                                    tasks.length > 0 ? `${column.color}30` : "#e2e8f0"
                                }`,
                                borderRadius: 11,
                                color: tasks.length > 0 ? column.color : "#94a3b8",
                                background: tasks.length > 0
                                    ? `${column.color}14`
                                    : "#f1f5f9",
                                fontSize: 11.5,
                                fontWeight: 700,
                                fontVariantNumeric: "tabular-nums",
                                lineHeight: 1,
                            }}
                        >
                            {tasks.length}
                        </span>
                    </div>
                </header>

                <div
                    className="kanban-column__body"
                    style={{
                        display: "flex",
                        flex: 1,
                        minHeight: 0,
                        padding: "12px 10px",
                        flexDirection: "column",
                        overflowY: "auto",
                    }}
                >
                    {tasks.map((task) => (
                        <DraggableTaskCard
                            key={task.id}
                            task={task}
                            onSelectTask={onSelectTask}
                        />
                    ))}

                    {tasks.length === 0 ? (
                        <div
                            className="kanban-column__empty"
                            style={{
                                display: "flex",
                                marginTop: 4,
                                padding: "36px 16px",
                                alignItems: "center",
                                justifyContent: "center",
                                flexDirection: "column",
                                gap: 10,
                                border: `1.5px dashed ${column.color}35`,
                                borderRadius: 12,
                                background: "#ffffff",
                                textAlign: "center",
                            }}
                        >
                            <div
                                aria-hidden="true"
                                style={{
                                    display: "flex",
                                    width: 38,
                                    height: 38,
                                    alignItems: "center",
                                    justifyContent: "center",
                                    border: `1px solid ${column.color}20`,
                                    borderRadius: 10,
                                    color: column.color,
                                    background: `${column.color}10`,
                                    fontSize: 17,
                                }}
                            >
                                {React.cloneElement(column.icon, {
                                    style: { fontSize: 17, color: column.color },
                                })}
                            </div>
                            <span
                                style={{
                                    color: "#64748b",
                                    fontSize: 12,
                                    fontWeight: 550,
                                }}
                            >
                                {emptyText}
                            </span>
                        </div>
                    ) : null}
                </div>
            </section>
        );
    }
);

TaskKanbanColumn.displayName = "TaskKanbanColumn";
