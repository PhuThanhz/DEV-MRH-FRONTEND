import React from "react";
import { Avatar, Card, Progress, Space, Tag, Typography } from "antd";
import { ApartmentOutlined, UserOutlined } from "@ant-design/icons";
import { renderTaskPriorityTag, renderTaskStatusTag } from "../taskMeta";
import { formatDateTime } from "../taskUtils";

const { Text } = Typography;

type ReportViewMode = "employee" | "department" | "task";

interface Props {
    viewMode: ReportViewMode;
    record: any;
    onView: () => void;
}

const performanceTag = (pct: number) => {
    if (pct >= 90) return <Tag color="success">Xuất sắc</Tag>;
    if (pct >= 70) return <Tag color="processing">Đạt yêu cầu</Tag>;
    return <Tag color="warning">Cần cải thiện</Tag>;
};

const kpiColor = (pct: number) => (pct >= 80 ? "#52c41a" : pct >= 50 ? "#faad14" : "#ff4d4f");

export const SummaryReportMobileCard: React.FC<Props> = ({ viewMode, record, onView }) => {
    if (viewMode === "task") {
        return (
            <Card size="small" style={{ borderRadius: 12 }} onClick={onView} hoverable>
                <Text strong style={{ display: "block", marginBottom: 6, color: "#1e293b" }}>{record.title}</Text>
                <Space size={6} style={{ marginBottom: 6 }}>
                    <Avatar src={record.assigneeAvatar} icon={<UserOutlined />} size="small" style={{ backgroundColor: "#1890ff" }} />
                    <Text style={{ fontSize: 13 }}>{record.assigneeName || "Chưa phân công"}</Text>
                </Space>
                <div style={{ marginBottom: 6 }}>
                    <Text type="secondary" style={{ fontSize: 12 }}>{record.departmentName || "--"}</Text>
                </div>
                <Space size={6} wrap style={{ marginBottom: 6 }}>
                    {renderTaskStatusTag(record.status, record.overdue)}
                    {renderTaskPriorityTag(record.priority)}
                    <Tag color={record.isOnTime ? "green" : "red"}>{record.isOnTime ? "Đúng hạn" : "⚠️ Trễ hạn"}</Tag>
                </Space>
                <Text type="secondary" style={{ fontSize: 12, display: "block" }}>
                    Hoàn thành: {formatDateTime(record.completedAt)}
                </Text>
            </Card>
        );
    }

    const isEmployee = viewMode === "employee";
    const pct = Math.round(record.onTimePercentage || 0);

    return (
        <Card size="small" style={{ borderRadius: 12 }} onClick={onView} hoverable>
            <Space size={6} style={{ marginBottom: 6 }}>
                {isEmployee ? (
                    <Avatar src={record.assigneeAvatar} icon={<UserOutlined />} size="small" style={{ backgroundColor: "#1890ff" }} />
                ) : (
                    <ApartmentOutlined style={{ color: "#1890ff" }} />
                )}
                <Text strong>{isEmployee ? (record.assigneeName || "Chưa phân công") : record.departmentName}</Text>
            </Space>
            {isEmployee && record.departmentName && (
                <Text type="secondary" style={{ fontSize: 12, display: "block", marginBottom: 6 }}>
                    {record.departmentName}{record.companyName ? ` · ${record.companyName}` : ""}
                </Text>
            )}
            {!isEmployee && record.companyName && (
                <Text type="secondary" style={{ fontSize: 12, display: "block", marginBottom: 6 }}>
                    {record.companyName}
                </Text>
            )}
            <Space size={4} wrap style={{ marginBottom: 8 }}>
                <Tag color="blue">{record.taskCount} tác vụ</Tag>
                {performanceTag(pct)}
            </Space>
            <Progress percent={pct} size="small" strokeColor={kpiColor(pct)} />
        </Card>
    );
};

export default SummaryReportMobileCard;
