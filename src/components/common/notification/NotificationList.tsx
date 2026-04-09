import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "antd";
import { InboxOutlined } from "@ant-design/icons";
import type { IJdInbox } from "@/types/backend";

interface Props {
    items: IJdInbox[];
    unreadIds: number[];
    onMarkAllRead: () => void;
    onItemClick: (id: number) => void;
    onClose: () => void;
}

const NotificationList: React.FC<Props> = ({
    items,
    unreadIds,
    onMarkAllRead,
    onItemClick,
    onClose,
}) => {
    const navigate = useNavigate();

    const handleClickItem = (item: IJdInbox) => {
        onItemClick(item.jdId);
        onClose();
        navigate("/admin/job-descriptions?tab=inbox");
    };

    if (items.length === 0) {
        return (
            <div style={{
                padding: "32px 16px",
                textAlign: "center",
                color: "#9ca3af",
                fontSize: 13,
                background: "#fff",
                borderRadius: 10,
                minWidth: 260,
            }}>
                <InboxOutlined style={{ fontSize: 32, display: "block", margin: "0 auto 8px" }} />
                Không có thông báo mới
            </div>
        );
    }

    return (
        <div style={{ width: 300, background: "#fff", borderRadius: 10 }}>
            {/* Header */}
            <div style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "10px 14px 8px",
                borderBottom: "0.5px solid #f0f0f0",
            }}>
                <span style={{ fontWeight: 600, fontSize: 13, color: "#111" }}>
                    Thông báo
                </span>
                {unreadIds.length > 0 && (
                    <Button
                        type="link"
                        size="small"
                        style={{ fontSize: 12, padding: 0, color: "#E8356D" }}
                        onClick={onMarkAllRead}
                    >
                        Đánh dấu tất cả đã đọc
                    </Button>
                )}
            </div>

            {/* List */}
            <div style={{ maxHeight: 360, overflowY: "auto" }}>
                {items.map((item) => {
                    const isUnread = unreadIds.includes(item.jdId);
                    return (
                        <div
                            key={item.jdId}
                            onClick={() => handleClickItem(item)}
                            style={{
                                display: "flex",
                                alignItems: "flex-start",
                                gap: 10,
                                padding: "10px 14px",
                                cursor: "pointer",
                                background: isUnread ? "#fff5f7" : "#fff",
                                borderBottom: "0.5px solid #f5f5f5",
                                transition: "background 0.15s",
                            }}
                            onMouseEnter={(e) => {
                                (e.currentTarget as HTMLDivElement).style.background = "#fce7ed";
                            }}
                            onMouseLeave={(e) => {
                                (e.currentTarget as HTMLDivElement).style.background = isUnread ? "#fff5f7" : "#fff";
                            }}
                        >
                            <span style={{
                                marginTop: 5,
                                flexShrink: 0,
                                width: 7,
                                height: 7,
                                borderRadius: "50%",
                                background: isUnread ? "#E8356D" : "#d1d5db",
                            }} />

                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{
                                    fontSize: 13,
                                    fontWeight: isUnread ? 600 : 400,
                                    color: "#111827",
                                    marginBottom: 2,
                                    whiteSpace: "nowrap",
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                }}>
                                    JD cần duyệt:{" "}
                                    <span style={{ color: "#E8356D" }}>
                                        {item.code ?? `#${item.jdId}`}
                                    </span>
                                </div>
                                <div style={{ fontSize: 12, color: "#6b7280" }}>
                                    Gửi bởi: {item.fromUser?.name ?? "—"}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Footer */}
            <div
                onClick={() => {
                    onClose();
                    navigate("/admin/job-descriptions?tab=inbox");
                }}
                style={{
                    padding: "9px 14px",
                    textAlign: "center",
                    fontSize: 12,
                    color: "#E8356D",
                    fontWeight: 500,
                    cursor: "pointer",
                    borderTop: "0.5px solid #f0f0f0",
                    transition: "background 0.15s",
                }}
                onMouseEnter={(e) => {
                    (e.currentTarget as HTMLDivElement).style.background = "#fff5f7";
                }}
                onMouseLeave={(e) => {
                    (e.currentTarget as HTMLDivElement).style.background = "#fff";
                }}
            >
                Xem tất cả JD cần xử lý →
            </div>
        </div>
    );
};

export default NotificationList;