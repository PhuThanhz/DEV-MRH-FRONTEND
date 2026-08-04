import React, { useMemo, useState } from "react";
import { Space, Modal, Input, message } from "antd";
import {
    DndContext,
    PointerSensor,
    TouchSensor,
    useSensor,
    useSensors,
} from "@dnd-kit/core";
import type { DragEndEvent } from "@dnd-kit/core";
import type { IResApprovalDelegationDTO, IResTaskDTO } from "@/types/backend";
import {
    getTaskViewerContext,
    canTransitionTask,
    type TaskPerms,
} from "../taskContext";
import {
    useUpdateTaskStatusMutation,
    useApproveTaskMutation,
} from "@/hooks/useTasks";
import { useDelegationsToMeQuery } from "@/hooks/useApprovalDelegations";
import { TaskSubmitResultModal } from "./TaskSubmitResultModal";
import { TaskBoardLoadMore } from "./common/TaskBoardSummary";
import {
    AuditOutlined,
    CheckCircleOutlined,
    ClockCircleOutlined,
    ExclamationCircleOutlined,
    SyncOutlined,
} from "@ant-design/icons";
import {
    TaskKanbanColumn,
    type TaskKanbanColumnConfig,
} from "./common/TaskKanbanColumn";
import { TaskKanbanScroller } from "./common/TaskKanbanScroller";

interface Props {
    tasks: IResTaskDTO[];
    onSelectTask: (task: IResTaskDTO) => void;
    user: any;
    perms: TaskPerms;
    hasMore?: boolean;
    onLoadMore?: () => void;
    totalElements?: number;
}

const STATUS_KANBAN_COLUMNS: TaskKanbanColumnConfig[] = [
    {
        id: "TODO",
        title: "Chưa Thực Hiện",
        color: "#64748b",
        icon: <ClockCircleOutlined style={{ color: "#64748b", fontSize: 15 }} />,
    },
    {
        id: "IN_PROGRESS",
        title: "Đang Thực Hiện",
        color: "#3b82f6",
        icon: <SyncOutlined style={{ color: "#3b82f6", fontSize: 15 }} />,
    },
    {
        id: "PENDING_REVIEW",
        title: "Chờ Nghiệm Thu",
        color: "#fa8c16",
        icon: <AuditOutlined style={{ color: "#fa8c16", fontSize: 15 }} />,
    },
    {
        id: "COMPLETED",
        title: "Hoàn Thành",
        color: "#52c41a",
        icon: <CheckCircleOutlined style={{ color: "#52c41a", fontSize: 15 }} />,
    },
];

const getColumnIdForStatus = (status: string): string => {
    if (status === "IN_PROGRESS" || status === "REWORK") {
        return "IN_PROGRESS";
    }
    return status;
};

export const TaskKanbanView: React.FC<Props> = React.memo(({
    tasks,
    onSelectTask,
    user,
    perms,
    hasMore,
    onLoadMore,
    totalElements,
}) => {
    const updateStatusMutation = useUpdateTaskStatusMutation();
    const approveMutation = useApproveTaskMutation();

    // Modals states
    const [submitModalTaskId, setSubmitModalTaskId] = useState<number | null>(null);
    const [reworkModalTask, setReworkModalTask] = useState<IResTaskDTO | null>(null);
    const [reworkReason, setReworkReason] = useState<string>("");
    const [approveConfirmTask, setApproveConfirmTask] = useState<IResTaskDTO | null>(null);

    // Fetch delegations to me for approval check
    const { data: delegationsData } = useDelegationsToMeQuery();
    const myDelegations: IResApprovalDelegationDTO[] = delegationsData || [];

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

    // Group tasks into 4 status columns (REWORK goes to IN_PROGRESS column, CANCELLED excluded)
    const columnsData = useMemo(() => {
        const grouped: Record<string, IResTaskDTO[]> = {
            TODO: [],
            IN_PROGRESS: [],
            PENDING_REVIEW: [],
            COMPLETED: [],
        };

        tasks.forEach((t) => {
            if (t.status === "TODO") {
                grouped.TODO.push(t);
            } else if (t.status === "IN_PROGRESS" || t.status === "REWORK") {
                grouped.IN_PROGRESS.push(t);
            } else if (t.status === "PENDING_REVIEW") {
                grouped.PENDING_REVIEW.push(t);
            } else if (t.status === "COMPLETED") {
                grouped.COMPLETED.push(t);
            }
        });

        return grouped;
    }, [tasks]);

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;
        if (!over) return;

        const targetColId = String(over.id);
        const taskId = Number(active.id);
        const taskObj = tasks.find((t) => t.id === taskId);
        if (!taskObj) return;

        // Nếu thả lại đúng cột hiện tại -> return sớm (no-op)
        const currentColId = getColumnIdForStatus(taskObj.status);
        if (currentColId === targetColId) return;

        const viewerCtx = getTaskViewerContext(user, taskObj, perms, myDelegations);

        // Check if transition is allowed based on role and task state
        const allowed = canTransitionTask(viewerCtx, taskObj.status, targetColId);
        if (!allowed) {
            message.warning("Bạn không có quyền chuyển trạng thái tác vụ này theo luồng chọn.");
            return;
        }

        // Perform transition logic based on source & target status
        if (taskObj.status === "TODO" && targetColId === "IN_PROGRESS") {
            // Start task immediately via status API
            await updateStatusMutation.mutateAsync({ id: taskId, status: "IN_PROGRESS" });
        } else if (
            (taskObj.status === "IN_PROGRESS" || taskObj.status === "REWORK") &&
            targetColId === "PENDING_REVIEW"
        ) {
            // Open Submit Result Modal
            setSubmitModalTaskId(taskId);
        } else if (taskObj.status === "PENDING_REVIEW" && targetColId === "COMPLETED") {
            // Open Approve confirmation modal
            setApproveConfirmTask(taskObj);
        } else if (taskObj.status === "PENDING_REVIEW" && targetColId === "IN_PROGRESS") {
            // Open Rework modal
            setReworkModalTask(taskObj);
        }
    };

    const handleConfirmApprove = async () => {
        if (!approveConfirmTask) return;
        await approveMutation.mutateAsync({
            id: approveConfirmTask.id,
            data: { decision: "APPROVE" },
        });
        setApproveConfirmTask(null);
    };

    const handleConfirmRework = async () => {
        if (!reworkModalTask) return;
        if (!reworkReason.trim()) {
            message.error("Vui lòng nhập lý do yêu cầu làm lại.");
            return;
        }
        await approveMutation.mutateAsync({
            id: reworkModalTask.id,
            data: { decision: "REWORK", reworkReason: reworkReason.trim() },
        });
        setReworkModalTask(null);
        setReworkReason("");
    };

    return (
        <>
            <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
                <div className="task-board">
                    <TaskKanbanScroller>
                        {STATUS_KANBAN_COLUMNS.map((col) => (
                            <TaskKanbanColumn
                                key={col.id}
                                column={col}
                                tasks={columnsData[col.id] || []}
                                onSelectTask={onSelectTask}
                                minWidth={260}
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

            {/* Modal Nộp báo cáo kết quả (PENDING_REVIEW) */}
            <TaskSubmitResultModal
                open={!!submitModalTaskId}
                taskId={submitModalTaskId}
                onClose={() => setSubmitModalTaskId(null)}
            />

            {/* Modal Xác nhận Nghiệm thu (COMPLETED) */}
            <Modal
                title={
                    <Space>
                        <CheckCircleOutlined style={{ color: "#52c41a", fontSize: 20 }} />
                        <span>Xác nhận Nghiệm thu Tác vụ</span>
                    </Space>
                }
                open={!!approveConfirmTask}
                onOk={handleConfirmApprove}
                onCancel={() => setApproveConfirmTask(null)}
                confirmLoading={approveMutation.isPending}
                okText="Nghiệm thu (COMPLETED)"
                okButtonProps={{ style: { backgroundColor: "#52c41a" } }}
                cancelText="Hủy"
                destroyOnHidden
            >
                <p>
                    Bạn có chắc chắn muốn nghiệm thu tác vụ{" "}
                    <strong>#{approveConfirmTask?.id} - {approveConfirmTask?.title}</strong>? Tác vụ sẽ chuyển sang trạng thái <strong>HOÀN THÀNH</strong>.
                </p>
            </Modal>

            {/* Modal Trả bài Yêu cầu làm lại (REWORK) */}
            <Modal
                title={
                    <Space>
                        <ExclamationCircleOutlined style={{ color: "#ff4d4f", fontSize: 20 }} />
                        <span>Yêu cầu Làm lại Tác vụ</span>
                    </Space>
                }
                open={!!reworkModalTask}
                onOk={handleConfirmRework}
                onCancel={() => {
                    setReworkModalTask(null);
                    setReworkReason("");
                }}
                confirmLoading={approveMutation.isPending}
                okText="Trả lại (REWORK)"
                okButtonProps={{ danger: true }}
                cancelText="Hủy"
                destroyOnHidden
            >
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    <p style={{ margin: 0 }}>
                        Nhập nhận xét / lý do trả lại tác vụ <strong>#{reworkModalTask?.id} - {reworkModalTask?.title}</strong> để người thực hiện điều chỉnh:
                    </p>
                    <Input.TextArea
                        rows={4}
                        placeholder="Ví dụ: Tài liệu thiếu mục B.4, đề nghị bổ sung trước 17h chiều..."
                        value={reworkReason}
                        onChange={(e) => setReworkReason(e.target.value)}
                    />
                </div>
            </Modal>
        </>
    );
});

export default TaskKanbanView;
