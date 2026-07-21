import {
    CheckCircleOutlined,
    ClockCircleOutlined,
    StopOutlined,
    SyncOutlined,
} from "@ant-design/icons";
import { Tag } from "antd";

export type EvaluationStatus =
    | "NOT_STARTED"
    | "EMPLOYEE_DRAFTING"
    | "PENDING_MANAGER_REVIEW"
    | "MANAGER_REVIEWING"
    | "PENDING_APPROVAL"
    | "COMPLETED"
    | "REVISION_NEEDED"
    | "OVERDUE_EMPLOYEE"
    | "OVERDUE_MANAGER"
    | "OVERDUE_APPROVAL";

const STATUS_CONFIG: Record<
    EvaluationStatus,
    { text: string; color: string; icon: React.ReactNode }
> = {
    NOT_STARTED: { text: "Chưa bắt đầu", color: "default", icon: <StopOutlined /> },
    EMPLOYEE_DRAFTING: { text: "Đang tự đánh giá", color: "processing", icon: <SyncOutlined spin /> },
    PENDING_MANAGER_REVIEW: { text: "Chờ Quản lý đánh giá", color: "warning", icon: <ClockCircleOutlined /> },
    MANAGER_REVIEWING: { text: "Quản lý đang đánh giá", color: "purple", icon: <SyncOutlined spin /> },
    PENDING_APPROVAL: { text: "Chờ phê duyệt kết quả", color: "cyan", icon: <ClockCircleOutlined /> },
    COMPLETED: { text: "Hoàn tất đánh giá", color: "success", icon: <CheckCircleOutlined /> },
    REVISION_NEEDED: { text: "Yêu cầu điều chỉnh", color: "error", icon: <ClockCircleOutlined /> },
    OVERDUE_EMPLOYEE: { text: "Quá hạn tự đánh giá", color: "error", icon: <ClockCircleOutlined /> },
    OVERDUE_MANAGER: { text: "Quá hạn Quản lý đánh giá", color: "error", icon: <ClockCircleOutlined /> },
    OVERDUE_APPROVAL: { text: "Quá hạn phê duyệt kết quả", color: "error", icon: <ClockCircleOutlined /> },
};

interface EvaluationStatusTagProps {
    status?: string | null;
}

const EvaluationStatusTag = ({ status }: EvaluationStatusTagProps) => {
    const normalizedStatus = status && status in STATUS_CONFIG
        ? status as EvaluationStatus
        : "NOT_STARTED";
    const config = STATUS_CONFIG[normalizedStatus];

    return (
        <Tag
            color={config.color}
            icon={config.icon}
            style={{
                borderRadius: 6,
                fontSize: 11,
                fontWeight: 650,
                lineHeight: "20px",
                marginInlineEnd: 0,
                paddingInline: 8,
                whiteSpace: "nowrap",
            }}
        >
            {config.text}
        </Tag>
    );
};

export default EvaluationStatusTag;
