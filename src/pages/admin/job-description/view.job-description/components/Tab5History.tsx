import dayjs from "dayjs";
import { Table, Tag, Badge } from "antd";
import type { ColumnsType } from "antd/es/table";
import type { IJDFlowLog } from "@/types/backend";

const ACTION_CONFIG: Record<string, { label: string; color: string; badgeStatus: "processing" | "success" | "error" | "warning" | "default" }> = {
    SUBMIT: { label: "Gửi duyệt", color: "blue", badgeStatus: "processing" },
    SUBMIT_TO_FINAL: { label: "Gửi ban hành", color: "geekblue", badgeStatus: "processing" },
    APPROVE: { label: "Đã duyệt", color: "success", badgeStatus: "success" },
    APPROVE_FINAL: { label: "Duyệt cuối", color: "cyan", badgeStatus: "success" },
    REJECT: { label: "Từ chối", color: "error", badgeStatus: "error" },
    ISSUE: { label: "Ban hành", color: "purple", badgeStatus: "success" },
};

interface Props {
    logs?: IJDFlowLog[];
}

const Tab5History = ({ logs }: Props) => {
    if (!logs?.length) return (
        <div style={{
            background: "#fff", borderRadius: 14, padding: 60,
            textAlign: "center", color: "#bbb", border: "1px solid #f0f0f0",
            fontSize: 14,
        }}>
            Chưa có lịch sử duyệt
        </div>
    );

    const columns: ColumnsType<IJDFlowLog> = [
        {
            title: "STT",
            width: 56,
            align: "center",
            render: (_, __, index) => (
                <span style={{ fontSize: 12, color: "#9ca3af" }}>{index + 1}</span>
            ),
        },
        {
            title: "Hành động",
            width: 150,
            render: (_, record) => {
                const cfg = ACTION_CONFIG[record.action];
                if (!cfg) return <Tag>{record.action}</Tag>;
                return (
                    <Tag
                        color={cfg.color}
                        style={{ fontWeight: 600, fontSize: 12, borderRadius: 6, padding: "1px 10px" }}
                    >
                        {cfg.label}
                    </Tag>
                );
            },
        },
        {
            title: "Người thực hiện",
            width: 160,
            render: (_, record) => (
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <Badge
                        status={ACTION_CONFIG[record.action]?.badgeStatus ?? "default"}
                    />
                    <span style={{ fontSize: 13, fontWeight: 500, color: "#111" }}>
                        {record.fromUser?.name ?? "—"}
                    </span>
                </div>
            ),
        },
        {
            title: "Người nhận",
            width: 160,
            render: (_, record) => (
                record.toUser ? (
                    <span style={{ fontSize: 13, color: "#374151" }}>
                        {record.toUser.name}
                    </span>
                ) : (
                    <span style={{ color: "#d9d9d9" }}>—</span>
                )
            ),
        },
        {
            title: "Thời gian",
            width: 150,
            render: (_, record) => (
                <span style={{ fontSize: 12, color: "#6b7280" }}>
                    {record.createdAt
                        ? dayjs(record.createdAt).format("DD/MM/YYYY HH:mm")
                        : "—"}
                </span>
            ),
        },
        {
            title: "Ghi chú",
            render: (_, record) => (
                record.comment ? (
                    <span style={{
                        fontSize: 12, color: "#6b7280",
                        fontStyle: "italic",
                        background: "#fafafa",
                        border: "1px solid #f0f0f0",
                        borderRadius: 6,
                        padding: "3px 10px",
                        display: "inline-block",
                    }}>
                        {record.comment}
                    </span>
                ) : (
                    <span style={{ color: "#d9d9d9" }}>—</span>
                )
            ),
        },
    ];

    return (
        <div style={{
            background: "#fff", borderRadius: 14,
            border: "1px solid #f0f0f0",
            overflow: "hidden",
            boxShadow: "0 2px 10px rgba(0,0,0,.04)",
        }}>
            <Table
                columns={columns}
                dataSource={logs}
                rowKey="id"
                pagination={false}
                size="middle"
                style={{ fontFamily: "'Outfit','Nunito','Segoe UI',sans-serif" }}
                rowClassName={(_, index) =>
                    index % 2 === 0 ? "" : "ant-table-row-striped"
                }
            />
        </div>
    );
};

export default Tab5History;