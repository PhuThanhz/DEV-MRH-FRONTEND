import React from "react";
import { Typography } from "antd";

const { Text } = Typography;

export interface TaskBoardMetric {
    value: number;
    label: string;
    tone?: "default" | "danger" | "warning" | "success";
}

interface Props {
    title: string;
    hint: string;
    metrics?: TaskBoardMetric[];
}

export const TaskBoardSummary: React.FC<Props> = ({ title, hint, metrics }) => (
    <header className="task-board-summary">
        <div className="task-board-summary__copy">
            <Text strong>{title}</Text>
            <Text type="secondary">{hint}</Text>
        </div>
        {metrics && metrics.length > 0 && (
            <div className="task-board-summary__metrics">
                {metrics.map((metric) => (
                    <span key={`${metric.label}-${metric.value}`} data-tone={metric.tone || "default"}>
                        <b>{metric.value}</b>
                        {metric.label}
                    </span>
                ))}
            </div>
        )}
    </header>
);

interface LoadMoreProps {
    visibleCount: number;
    totalCount: number;
    onClick: () => void;
}

export const TaskBoardLoadMore: React.FC<LoadMoreProps> = ({
    visibleCount,
    totalCount,
    onClick,
}) => (
    <div className="task-board-load-more">
        <button type="button" onClick={onClick}>
            Tải thêm tác vụ
            <span>
                {visibleCount}/{totalCount}
            </span>
        </button>
    </div>
);
