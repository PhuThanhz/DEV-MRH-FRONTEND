import React, { useState } from "react";
import { Dropdown } from "antd";
import { BellOutlined } from "@ant-design/icons";
import { useNotifications } from "@/hooks/useNotifications";
import NotificationGrid from "./NotificationGrid";
import NotificationDrawer from "./NotificationDrawer";

interface IProps {
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
}

const NotificationBell: React.FC<IProps> = ({ open: openProp, onOpenChange }) => {
    const [openInternal, setOpenInternal] = useState(false);
    const open = openProp ?? openInternal;
    const setOpen = (val: boolean) => {
        onOpenChange ? onOpenChange(val) : setOpenInternal(val);
    };
    const [drawerOpen, setDrawerOpen] = useState(false);
    const { items, unreadCount, markAllRead, markAllReadByModules, markOneRead, deleteOne, isLoading, soundEnabled, toggleSound } = useNotifications();

    return (
        <>
            <Dropdown
                open={open}
                onOpenChange={setOpen}
                trigger={["click"]}
                placement="bottomRight"
                overlayStyle={{ padding: 0, borderRadius: 10, overflow: "hidden" }}
                getPopupContainer={() => document.body}
                popupRender={() => (
                    <NotificationGrid
                        items={items}
                        onClose={() => setOpen(false)}
                        markOneRead={markOneRead}
                        deleteOne={deleteOne}
                        markAllRead={markAllRead}
                        markAllReadByModules={markAllReadByModules}
                        isLoading={isLoading}
                        soundEnabled={soundEnabled}
                        toggleSound={toggleSound}
                        onOpenFullCenter={() => {
                            setOpen(false);
                            setDrawerOpen(true);
                        }}
                    />
                )}
            >
                <button
                    type="button"
                    data-guide-id="notification-bell"
                    aria-label={unreadCount > 0 ? `Thông báo, ${unreadCount} chưa đọc` : "Thông báo"}
                    aria-expanded={open}
                    className={`relative flex h-9 w-9 items-center justify-center rounded-full border text-white transition-colors duration-200 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-white/90 focus-visible:ring-offset-2 focus-visible:ring-offset-pink-600 ${open
                        ? "border-white/60 bg-white/20"
                        : "border-white/30 bg-white/10 hover:border-white/50 hover:bg-white/20"
                        }`}
                >
                    <BellOutlined style={{ color: "#fff", fontSize: 16 }} />

                    {unreadCount > 0 && (
                        <span className="absolute -right-1.5 -top-1.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full border-2 border-white bg-rose-600 px-1 text-[9px] font-bold leading-none text-white shadow-sm tabular-nums">
                            {unreadCount > 9 ? "9+" : unreadCount}
                        </span>
                    )}
                </button>
            </Dropdown>
            <NotificationDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
        </>
    );
};

export default NotificationBell;
