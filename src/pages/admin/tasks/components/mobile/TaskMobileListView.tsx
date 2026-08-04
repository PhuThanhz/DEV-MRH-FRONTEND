import React from "react";
import { Card, Pagination, Empty } from "antd";
import type { IResTaskDTO } from "@/types/backend";
import { TaskCard } from "../common/TaskCard";

interface Props {
    tasks: IResTaskDTO[];
    onSelectTask: (task: IResTaskDTO) => void;
    totalElements: number;
    page: number;
    pageSize: number;
    onPageChange: (page: number, pageSize: number) => void;
    loading?: boolean;
}

export const TaskMobileListView: React.FC<Props> = ({
    tasks,
    onSelectTask,
    totalElements,
    page,
    pageSize,
    onPageChange,
}) => {
    if (tasks.length === 0) {
        return (
            <Card size="small" style={{ borderRadius: 12, padding: "24px 0", textAlign: "center" }}>
                <Empty description="Không tìm thấy tác vụ nào" />
            </Card>
        );
    }

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {tasks.map((task) => (
                <TaskCard key={task.id} task={task} onSelectTask={onSelectTask} />
            ))}

            {/* Mobile Simple Pagination */}
            {totalElements > pageSize && (
                <div style={{ display: "flex", justifyContent: "center", marginTop: 12, marginBottom: 8 }}>
                    <Pagination
                        simple
                        size="small"
                        current={page}
                        pageSize={pageSize}
                        total={totalElements}
                        onChange={onPageChange}
                    />
                </div>
            )}
        </div>
    );
};

export default TaskMobileListView;
