import React from "react";
import {
    AppstoreOutlined,
    CalendarOutlined,
    ClockCircleOutlined,
    TableOutlined,
} from "@ant-design/icons";
import {
    TaskSegmentedControl,
    type TaskSegmentOption,
} from "./TaskSegmentedControl";

export type TaskWorkspaceViewMode =
    | "table"
    | "kanban"
    | "deadline"
    | "calendar";

const VIEW_OPTIONS: TaskSegmentOption<TaskWorkspaceViewMode>[] = [
    { label: "Danh sách", value: "table", icon: <TableOutlined /> },
    { label: "Bảng trạng thái", value: "kanban", icon: <AppstoreOutlined /> },
    { label: "Hạn chót", value: "deadline", icon: <ClockCircleOutlined /> },
    { label: "Lịch", value: "calendar", icon: <CalendarOutlined /> },
];

interface Props {
    value: TaskWorkspaceViewMode;
    onChange: (value: TaskWorkspaceViewMode) => void;
}

export const TaskWorkspaceViewSwitcher: React.FC<Props> = ({
    value,
    onChange,
}) => (
    <TaskSegmentedControl
        value={value}
        onChange={onChange}
        options={VIEW_OPTIONS}
        className="task-view-switcher"
        ariaLabel="Chọn cách hiển thị tác vụ"
    />
);

export default TaskWorkspaceViewSwitcher;
