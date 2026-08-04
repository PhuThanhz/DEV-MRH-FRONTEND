import React, { useMemo } from "react";
import {
    DndContext,
    PointerSensor,
    TouchSensor,
    useSensor,
    useSensors,
} from "@dnd-kit/core";
import type { DragEndEvent } from "@dnd-kit/core";
import dayjs from "dayjs";
import type { IResTaskDTO } from "@/types/backend";
import { useUpdateTaskDueDateMutation } from "@/hooks/useTasks";
import {
    InboxOutlined,
    ClockCircleOutlined,
    FireOutlined,
    CalendarOutlined,
    ScheduleOutlined,
} from "@ant-design/icons";
import { TaskBoardLoadMore } from "./common/TaskBoardSummary";
import {
    TaskKanbanColumn,
    type TaskKanbanColumnConfig,
} from "./common/TaskKanbanColumn";
import { TaskKanbanScroller } from "./common/TaskKanbanScroller";
import "./TaskDeadlineKanbanView.css";

interface Props {
    tasks: IResTaskDTO[];
    onSelectTask: (task: IResTaskDTO) => void;
    hasMore?: boolean;
    onLoadMore?: () => void;
    totalElements?: number;
}

const DEADLINE_KANBAN_COLUMNS: TaskKanbanColumnConfig[] = [
    {
        id: "overdue",
        title: "Quá hạn",
        color: "#ef4444",
        allowDrop: false,
        lockedLabel: "Chặn thả",
        icon: <ClockCircleOutlined style={{ color: "#ef4444", fontSize: 15 }} />,
    },
    {
        id: "today",
        title: "Hạn hôm nay",
        color: "#10b981",
        allowDrop: true,
        icon: <FireOutlined style={{ color: "#10b981", fontSize: 15 }} />,
    },
    {
        id: "this_week",
        title: "Hạn tuần này",
        color: "#3b82f6",
        allowDrop: true,
        icon: <CalendarOutlined style={{ color: "#3b82f6", fontSize: 15 }} />,
    },
    {
        id: "next_week",
        title: "Hạn tuần sau",
        color: "#0284c7",
        allowDrop: true,
        icon: <ScheduleOutlined style={{ color: "#0284c7", fontSize: 15 }} />,
    },
    {
        id: "no_deadline",
        title: "Không có hạn chót",
        color: "#64748b",
        allowDrop: true,
        icon: <InboxOutlined style={{ color: "#64748b", fontSize: 15 }} />,
    },
];

export const TaskDeadlineKanbanView: React.FC<Props> = React.memo(({
    tasks,
    onSelectTask,
    hasMore,
    onLoadMore,
    totalElements,
}) => {
    const updateTaskDueDateMutation = useUpdateTaskDueDateMutation();

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        }),
        useSensor(TouchSensor, {
            activationConstraint: {
                delay: 200,
                tolerance: 6,
            },
        })
    );

    const columnsData = useMemo(() => {
        const today = dayjs().startOf("day");
        const endOfToday = dayjs().endOf("day");
        const endOfWeek = dayjs().endOf("week");
        const grouped: Record<string, IResTaskDTO[]> = {
            overdue: [],
            today: [],
            this_week: [],
            next_week: [],
            no_deadline: [],
        };

        tasks.forEach((t) => {
            if (!t.dueDate) {
                grouped.no_deadline.push(t);
            } else if (t.overdue || (t.dueDate && dayjs(t.dueDate).isBefore(today) && t.status !== "COMPLETED")) {
                grouped.overdue.push(t);
            } else if (t.dueDate && dayjs(t.dueDate).isBefore(endOfToday)) {
                grouped.today.push(t);
            } else if (t.dueDate && dayjs(t.dueDate).isBefore(endOfWeek)) {
                grouped.this_week.push(t);
            } else {
                grouped.next_week.push(t);
            }
        });

        return grouped;
    }, [tasks]);

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;
        if (!over) return;

        const targetColId = String(over.id);
        if (targetColId === "overdue") return;

        const taskId = Number(active.id);
        const taskObj = tasks.find((t) => t.id === taskId);
        if (!taskObj) return;

        let newDueDate: string | null = null;

        if (targetColId === "no_deadline") {
            newDueDate = null;
        } else {
            const currentDueDate = taskObj.dueDate ? dayjs(taskObj.dueDate) : null;
            const hour = currentDueDate ? currentDueDate.hour() : 17;
            const minute = currentDueDate ? currentDueDate.minute() : 0;
            const second = currentDueDate ? currentDueDate.second() : 0;

            let newDate = dayjs();

            if (targetColId === "today") {
                newDate = dayjs().hour(hour).minute(minute).second(second);
            } else if (targetColId === "this_week") {
                newDate = dayjs().day(5).hour(hour).minute(minute).second(second);
            } else if (targetColId === "next_week") {
                newDate = dayjs().add(1, "week").day(5).hour(hour).minute(minute).second(second);
            }

            newDueDate = newDate.toISOString();
        }

        await updateTaskDueDateMutation.mutateAsync({
            id: taskId,
            dueDate: newDueDate,
        });
    };

    return (
        <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
            <div className="task-board deadline-board">
                <TaskKanbanScroller>
                    {DEADLINE_KANBAN_COLUMNS.map((col) => (
                        <TaskKanbanColumn
                            key={col.id}
                            column={col}
                            tasks={columnsData[col.id] || []}
                            onSelectTask={onSelectTask}
                            minWidth={255}
                            maxWidth={320}
                        />
                    ))}
                </TaskKanbanScroller>
                {hasMore && onLoadMore && (
                    <TaskBoardLoadMore
                        visibleCount={tasks.length}
                        totalCount={totalElements || tasks.length}
                        onClick={onLoadMore}
                    />
                )}
            </div>
        </DndContext>
    );
});

export default TaskDeadlineKanbanView;
