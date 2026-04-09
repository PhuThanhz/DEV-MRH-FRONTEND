import React, { useState } from "react";
import { Dropdown } from "antd";
import { BellOutlined } from "@ant-design/icons";
import { useNotifications } from "@/hooks/useNotifications";
import NotificationList from "./NotificationList";

const NotificationBell: React.FC = () => {
    const [open, setOpen] = useState(false);
    const { items, unreadItems, unreadCount, markAllRead, markOneRead } = useNotifications();

    const unreadIds = unreadItems.map((i) => i.jdId);

    return (
        <Dropdown
            open={open}
            onOpenChange={setOpen}
            trigger={["click"]}
            placement="bottomRight"
            overlayStyle={{ zIndex: 10000, padding: 0, borderRadius: 10, overflow: "hidden" }}
            getPopupContainer={() => document.body}
            dropdownRender={() => (
                <NotificationList
                    items={items}
                    unreadIds={unreadIds}
                    onMarkAllRead={markAllRead}
                    onItemClick={(id) => {
                        markOneRead(id);
                        setOpen(false);
                    }}
                    onClose={() => setOpen(false)}
                />
            )}
        >
            <button
                style={{
                    position: "relative",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: 36,
                    height: 36,
                    borderRadius: "50%",
                    background: "rgba(255,255,255,0.1)",
                    border: "1px solid rgba(255,255,255,0.25)",
                    cursor: "pointer",
                    transition: "all 0.2s",
                }}
                onMouseEnter={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.2)";
                }}
                onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.1)";
                }}
            >
                <BellOutlined style={{ color: "#fff", fontSize: 16 }} />

                {unreadCount > 0 && (
                    <>
                        <span style={{
                            position: "absolute",
                            top: -4,
                            right: -4,
                            minWidth: 18,
                            height: 18,
                            padding: "0 4px",
                            background: "#E8356D",
                            color: "#fff",
                            borderRadius: 99,
                            fontSize: 10,
                            fontWeight: 700,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            border: "2px solid #ec4899",
                            lineHeight: 1,
                            zIndex: 1,
                        }}>
                            {unreadCount > 9 ? "9+" : unreadCount}
                        </span>
                        <span style={{
                            position: "absolute",
                            top: -4,
                            right: -4,
                            width: 18,
                            height: 18,
                            borderRadius: "50%",
                            background: "#E8356D",
                            opacity: 0.4,
                            animation: "bell-pulse 1.5s ease-out infinite",
                        }} />
                    </>
                )}

                <style>{`
                    @keyframes bell-pulse {
                        0%   { transform: scale(1);   opacity: 0.4; }
                        100% { transform: scale(2.2); opacity: 0;   }
                    }
                `}</style>
            </button>
        </Dropdown>
    );
};

export default NotificationBell;