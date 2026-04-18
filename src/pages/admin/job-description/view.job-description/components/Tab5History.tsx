import { useState } from "react";
import dayjs from "dayjs";
import { Tag, Avatar, Button } from "antd";
import {
    SendOutlined, CheckCircleOutlined, CloseCircleOutlined,
    FileDoneOutlined, HistoryOutlined, UserOutlined,
    DownOutlined, UpOutlined,
} from "@ant-design/icons";
import type { IJDFlowLog } from "@/types/backend";

const ACTION_CONFIG: Record<string, {
    label: string;
    color: string;
    bg: string;
    border: string;
    icon: React.ReactNode;
    dotColor: string;
}> = {
    SUBMIT: {
        label: "Gửi duyệt", color: "#1677ff", bg: "#e6f4ff", border: "#91caff",
        icon: <SendOutlined style={{ fontSize: 13 }} />, dotColor: "#1677ff",
    },
    SUBMIT_TO_FINAL: {
        label: "Gửi ban hành", color: "#0958d9", bg: "#dbeafe", border: "#93c5fd",
        icon: <SendOutlined style={{ fontSize: 13 }} />, dotColor: "#0958d9",
    },
    APPROVE: {
        label: "Đã duyệt", color: "#389e0d", bg: "#f6ffed", border: "#b7eb8f",
        icon: <CheckCircleOutlined style={{ fontSize: 13 }} />, dotColor: "#52c41a",
    },
    APPROVE_FINAL: {
        label: "Duyệt cuối", color: "#08979c", bg: "#e6fffb", border: "#87e8de",
        icon: <CheckCircleOutlined style={{ fontSize: 13 }} />, dotColor: "#13c2c2",
    },
    REJECT: {
        label: "Từ chối", color: "#cf1322", bg: "#fff1f0", border: "#ffa39e",
        icon: <CloseCircleOutlined style={{ fontSize: 13 }} />, dotColor: "#ff4d4f",
    },
    ISSUE: {
        label: "Ban hành", color: "#531dab", bg: "#f9f0ff", border: "#d3adf7",
        icon: <FileDoneOutlined style={{ fontSize: 13 }} />, dotColor: "#722ed1",
    },
};

const SHOW_DEFAULT = 3; // Số bước hiển thị mặc định

interface Props {
    logs?: IJDFlowLog[];
}

const Tab5History = ({ logs }: Props) => {
    const [expanded, setExpanded] = useState(false);

    if (!logs?.length) return (
        <div style={{
            background: "#fff", borderRadius: 14, padding: 60,
            textAlign: "center", color: "#bbb", border: "1px solid #f0f0f0",
            fontSize: 14,
        }}>
            <HistoryOutlined style={{ fontSize: 36, marginBottom: 12, display: "block" }} />
            Chưa có lịch sử duyệt
        </div>
    );

    const sorted = [...logs].sort((a, b) =>
        dayjs(b.createdAt).valueOf() - dayjs(a.createdAt).valueOf()
    );

    const hasMore = sorted.length > SHOW_DEFAULT;
    const visible = expanded ? sorted : sorted.slice(0, SHOW_DEFAULT);
    const hiddenCount = sorted.length - SHOW_DEFAULT;

    return (
        <div style={{
            background: "#fff", borderRadius: 14,
            border: "1px solid #f0f0f0",
            padding: "20px 20px",
            boxShadow: "0 2px 10px rgba(0,0,0,.04)",
        }}>
            {/* Header */}
            <div style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                marginBottom: 16,
            }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <HistoryOutlined style={{ color: "#9ca3af", fontSize: 15 }} />
                    <span style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>
                        Lịch sử duyệt
                    </span>
                    <span style={{
                        fontSize: 11, fontWeight: 600,
                        background: "#f3f4f6", color: "#6b7280",
                        borderRadius: 20, padding: "1px 8px",
                    }}>
                        {sorted.length} bước
                    </span>
                </div>

                {hasMore && (
                    <Button
                        type="text" size="small"
                        icon={expanded ? <UpOutlined /> : <DownOutlined />}
                        onClick={() => setExpanded(!expanded)}
                        style={{ fontSize: 12, color: "#6b7280", height: 26 }}
                    >
                        {expanded ? "Thu gọn" : `Xem thêm ${hiddenCount} bước`}
                    </Button>
                )}
            </div>

            {/* Timeline */}
            <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                {visible.map((record, index) => {
                    const cfg = ACTION_CONFIG[record.action] ?? {
                        label: record.action, color: "#8c8c8c", bg: "#fafafa",
                        border: "#d9d9d9", icon: <HistoryOutlined style={{ fontSize: 13 }} />, dotColor: "#8c8c8c",
                    };

                    const isLatest = index === 0;
                    const isLast = index === visible.length - 1;

                    return (
                        <div
                            key={record.id ?? index}
                            style={{
                                display: "flex", gap: 0, alignItems: "stretch",
                                opacity: 1,
                                animation: "fadeIn 0.2s ease",
                            }}
                        >
                            {/* Cột trái: thời gian */}
                            <div style={{
                                width: 74, flexShrink: 0,
                                display: "flex", flexDirection: "column",
                                alignItems: "flex-end",
                                paddingRight: 12, paddingTop: 8,
                            }}>
                                <span style={{
                                    fontSize: 13, fontWeight: 700,
                                    color: isLatest ? cfg.color : "#374151",
                                    lineHeight: 1.2,
                                }}>
                                    {record.createdAt ? dayjs(record.createdAt).format("HH:mm") : "—"}
                                </span>
                                <span style={{ fontSize: 11, color: "#9ca3af", lineHeight: 1.5 }}>
                                    {record.createdAt ? dayjs(record.createdAt).format("DD/MM/YY") : ""}
                                </span>
                            </div>

                            {/* Cột giữa: dot + line */}
                            <div style={{
                                display: "flex", flexDirection: "column",
                                alignItems: "center", flexShrink: 0, width: 30,
                            }}>
                                <div style={{
                                    width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
                                    background: isLatest ? cfg.dotColor : "#fff",
                                    border: `2px solid ${isLatest ? cfg.dotColor : cfg.border}`,
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                    color: isLatest ? "#fff" : cfg.color,
                                    zIndex: 1,
                                    boxShadow: isLatest ? `0 0 0 3px ${cfg.bg}` : "none",
                                    marginTop: 6,
                                }}>
                                    {cfg.icon}
                                </div>
                                {!isLast && (
                                    <div style={{
                                        width: 2, flex: 1,
                                        background: "linear-gradient(to bottom, #e5e7eb, #f3f4f6)",
                                        minHeight: 16, marginTop: 2, marginBottom: 2,
                                    }} />
                                )}
                                {/* Dấu "..." khi còn ẩn */}
                                {isLast && !expanded && hasMore && (
                                    <div style={{
                                        marginTop: 6, display: "flex",
                                        flexDirection: "column", gap: 3, alignItems: "center",
                                    }}>
                                        {[0, 1, 2].map(i => (
                                            <div key={i} style={{
                                                width: 4, height: 4, borderRadius: "50%",
                                                background: "#d1d5db",
                                            }} />
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Cột phải: nội dung */}
                            <div style={{
                                flex: 1, paddingLeft: 12,
                                paddingBottom: isLast ? (hasMore && !expanded ? 12 : 0) : 12,
                                paddingTop: 2,
                            }}>
                                <div style={{
                                    background: isLatest ? cfg.bg : "#fafafa",
                                    border: `1px solid ${isLatest ? cfg.border : "#f0f0f0"}`,
                                    borderRadius: 10,
                                    padding: "10px 14px",
                                }}>
                                    {/* Tag + badge */}
                                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 7, flexWrap: "wrap" }}>
                                        <Tag style={{
                                            fontWeight: 700, fontSize: 11,
                                            borderRadius: 6, padding: "1px 8px",
                                            color: cfg.color, background: cfg.bg,
                                            border: `1px solid ${cfg.border}`,
                                            margin: 0,
                                        }}>
                                            {cfg.label}
                                        </Tag>
                                        {isLatest && (
                                            <span style={{
                                                fontSize: 10, borderRadius: 20,
                                                padding: "1px 8px",
                                                background: cfg.dotColor, color: "#fff",
                                                fontWeight: 600,
                                            }}>
                                                Mới nhất
                                            </span>
                                        )}
                                    </div>

                                    {/* From → To */}
                                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                                            <Avatar size={20} icon={<UserOutlined />}
                                                style={{ background: cfg.dotColor, flexShrink: 0, fontSize: 10 }} />
                                            <span style={{ fontSize: 12, fontWeight: 600, color: "#111" }}>
                                                {record.fromUser?.name ?? "—"}
                                            </span>
                                        </div>

                                        {record.toUser && (
                                            <>
                                                <span style={{ color: "#d1d5db", fontSize: 14 }}>→</span>
                                                <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                                                    <Avatar size={20} icon={<UserOutlined />}
                                                        style={{ background: "#e2e8f0", color: "#64748b", flexShrink: 0, fontSize: 10 }} />
                                                    <span style={{ fontSize: 12, color: "#374151" }}>
                                                        {record.toUser.name}
                                                    </span>
                                                </div>
                                            </>
                                        )}
                                    </div>

                                    {/* Comment */}
                                    {record.comment && (
                                        <div style={{
                                            marginTop: 8,
                                            fontSize: 12, color: "#6b7280",
                                            fontStyle: "italic",
                                            background: "#fff",
                                            border: "1px solid #e5e7eb",
                                            borderRadius: 6,
                                            padding: "5px 10px",
                                            lineHeight: 1.5,
                                        }}>
                                            💬 {record.comment}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Footer expand/collapse */}
            {hasMore && (
                <div style={{
                    marginTop: 8,
                    borderTop: "1px dashed #f0f0f0",
                    paddingTop: 12,
                    display: "flex", justifyContent: "center",
                }}>
                    <Button
                        type="text"
                        icon={expanded ? <UpOutlined /> : <DownOutlined />}
                        onClick={() => setExpanded(!expanded)}
                        style={{
                            fontSize: 12, color: "#6b7280",
                            height: 28,
                            borderRadius: 20,
                            background: "#f9fafb",
                            border: "1px solid #f0f0f0",
                            padding: "0 14px",
                        }}
                    >
                        {expanded
                            ? "Thu gọn bớt"
                            : `Xem thêm ${hiddenCount} bước nữa`}
                    </Button>
                </div>
            )}
        </div>
    );
};

export default Tab5History;