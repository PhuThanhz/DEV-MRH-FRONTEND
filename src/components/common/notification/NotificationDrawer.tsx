import React, { useState } from "react";
import { Drawer, Spin, Empty } from "antd";
import {
    CheckOutlined,
    SearchOutlined,
    CloseOutlined,
    BellOutlined,
    DeleteOutlined
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import "dayjs/locale/vi";

import type { UnifiedNotification } from "@/hooks/useNotifications";
import { useNotificationHistory } from "@/hooks/useNotificationHistory";
import { getModalWidth } from "@/utils/responsive";
import { resolveNotificationActionLink } from "./notificationNavigation";

dayjs.extend(relativeTime);
dayjs.locale("vi");

interface NotificationDrawerProps {
    open: boolean;
    onClose: () => void;
}

const NotificationDrawer: React.FC<NotificationDrawerProps> = ({ open, onClose }) => {
    const navigate = useNavigate();
    const {
        items,
        unreadCount,
        markAllRead,
        markOneRead,
        deleteOne,
        isLoading,
        isLoadingMore,
        hasMore,
        loadMore,
    } = useNotificationHistory(open);
    const [searchTerm, setSearchTerm] = useState("");
    const [activeTab, setActiveTab] = useState<string>("all");

    const handleItemClick = (item: UnifiedNotification) => {
        if (!item.isRead) {
            markOneRead(item);
        }
        if (item.actionLink) {
            navigate(resolveNotificationActionLink(item.actionLink)!);
            onClose();
        }
    };

    let filteredItems = items;
    if (activeTab === "unread") {
        filteredItems = filteredItems.filter(i => !i.isRead);
    }
    if (searchTerm) {
        filteredItems = filteredItems.filter(i =>
            i.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            i.subtitle?.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }

    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        const target = e.currentTarget;
        if (target.scrollHeight - target.scrollTop <= target.clientHeight + 80) {
            loadMore();
        }
    };

    return (
        <Drawer
            placement="right"
            width={getModalWidth(700)}
            onClose={onClose}
            open={open}
            closable={false}
            styles={{
                body: { padding: 0, backgroundColor: "#f6f8fa", display: "flex", flexDirection: "column" },
                header: { display: "none" },
                content: { borderRadius: "24px 0 0 24px", overflow: "hidden" },
                mask: { backdropFilter: "blur(2px)" },
            }}
        >
            {/* Header */}
            <div className="flex items-center px-6 py-4 bg-white border-b border-slate-200 sticky top-0 z-20">
                <button
                    onClick={onClose}
                    className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-500 transition-colors"
                >
                    <CloseOutlined style={{ fontSize: 16 }} />
                </button>

                <div className="flex items-center gap-2.5 ml-4 flex-shrink-0">
                    <div className="w-8 h-8 rounded-[9px] bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600">
                        <BellOutlined style={{ fontSize: 15 }} />
                    </div>
                    <span className="text-[16px] font-bold text-slate-900 tracking-tight">Thông báo</span>
                </div>

                {/* Tabs centered */}
                <div className="flex-1 flex justify-center px-4">
                    <div className="flex bg-slate-100 p-1 rounded-[8px]">
                        <button
                            onClick={() => setActiveTab('all')}
                            className={`px-6 py-1.5 rounded-[6px] text-[13px] font-bold transition-all ${activeTab === 'all' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            Tất cả
                        </button>
                        <button
                            onClick={() => setActiveTab('unread')}
                            className={`px-6 py-1.5 rounded-[6px] text-[13px] font-bold transition-all flex items-center gap-1.5 ${activeTab === 'unread' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            Chưa đọc
                            {unreadCount > 0 && (
                                <span className="bg-rose-600 text-white text-[10px] px-1.5 py-0.5 rounded-full leading-none">
                                    {unreadCount}
                                </span>
                            )}
                        </button>
                    </div>
                </div>

                {/* Search */}
                <div className="relative w-[220px] flex-shrink-0">
                    <input
                        type="text"
                        placeholder="Lọc và tìm kiếm"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-[8px] pl-3 pr-8 py-1.5 text-[13px] font-medium text-slate-700 outline-none focus:bg-white focus:border-slate-400 focus:ring-2 focus:ring-slate-200 transition-all placeholder-slate-400"
                    />
                    <SearchOutlined className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                </div>
            </div>

            {/* List Content */}
            <div className="flex-1 overflow-y-auto p-5 custom-scrollbar" onScroll={handleScroll}>
                <div className="flex items-center justify-between mb-4">
                    <span className="text-[13px] font-bold text-slate-800 uppercase tracking-wide">
                        {activeTab === 'unread' ? 'Thông báo chưa đọc' : 'Cập nhật gần đây'}
                    </span>
                    <button
                        onClick={markAllRead}
                        disabled={unreadCount === 0}
                        className={`text-[12px] font-semibold flex items-center gap-1.5 transition-colors ${unreadCount > 0 ? 'text-slate-700 hover:text-rose-600 cursor-pointer' : 'text-slate-300 cursor-not-allowed'}`}
                    >
                        <CheckOutlined /> Đánh dấu đã đọc
                    </button>
                </div>

                {isLoading ? (
                    <div className="flex justify-center py-10">
                        <Spin />
                    </div>
                ) : filteredItems.length > 0 ? (
                    <div className="flex flex-col gap-2.5">
                        {filteredItems.map((item) => {
                            const isSystem = item.title === "Thông báo hệ thống";
                            const displayTitle = isSystem ? "Hệ thống Lotus HRM" : item.title;

                            return (
                                <div
                                    key={item.id}
                                    onClick={() => handleItemClick(item)}
                                    className={`relative px-5 py-4 rounded-[14px] transition-all cursor-pointer group overflow-hidden ${!item.isRead ? 'bg-white border border-slate-200 shadow-[0_6px_20px_-18px_rgba(15,23,42,0.28)] hover:border-rose-100 hover:shadow-[0_10px_26px_-20px_rgba(225,29,72,0.28)]' : 'bg-white/65 border border-slate-100 hover:bg-white hover:border-slate-200'}`}
                                >
                                    {!item.isRead && (
                                        <span className="absolute left-0 top-3 bottom-3 w-[3px] rounded-r-full bg-rose-400/75" />
                                    )}
                                    <div className="flex gap-3.5">
                                        <div className={`w-9 h-9 flex-shrink-0 rounded-[10px] border flex items-center justify-center text-[12px] font-bold ${item.isRead ? "border-slate-200 bg-slate-50 text-slate-400" : "border-rose-100 bg-rose-50/60 text-rose-500"}`}>
                                            {isSystem ? "LT" : displayTitle.slice(0, 1).toLocaleUpperCase("vi-VN")}
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between gap-3">
                                                <h4 className={`flex-1 min-w-0 text-[14px] m-0 leading-tight truncate ${!item.isRead ? 'font-bold text-slate-800' : 'font-semibold text-slate-500'}`}>
                                                    {displayTitle}
                                                </h4>
                                                <div className="flex items-center gap-1.5 flex-shrink-0 -mt-1">
                                                    <time className="text-[11px] text-slate-400 font-medium tabular-nums whitespace-nowrap" dateTime={item.createdAt}>
                                                        {item.createdAt ? dayjs(item.createdAt).format("DD/MM, HH:mm") : ""}
                                                    </time>
                                                    {item.type === "app" && (
                                                        <button
                                                            type="button"
                                                            title="Xoá thông báo"
                                                            aria-label="Xoá thông báo"
                                                            className="w-7 h-7 flex items-center justify-center rounded-full text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                deleteOne(item);
                                                            }}
                                                        >
                                                            <DeleteOutlined style={{ fontSize: 14 }} />
                                                        </button>
                                                    )}
                                                </div>
                                            </div>

                                            <p className={`text-[13px] m-0 mt-1.5 leading-relaxed whitespace-pre-line ${!item.isRead ? 'text-slate-600' : 'text-slate-400'}`}>
                                                {item.subtitle}
                                            </p>

                                            {item.actionLink && (
                                                <div className="flex items-center gap-1.5 mt-3">
                                                    <button
                                                        className="px-3.5 py-1.5 text-[12px] font-semibold rounded-[8px] border border-rose-100/90 bg-rose-50/65 hover:bg-rose-100/70 hover:border-rose-200/80 text-rose-600 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-200"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            if (!item.isRead) {
                                                                markOneRead(item);
                                                            }
                                                            navigate(resolveNotificationActionLink(item.actionLink)!);
                                                            onClose();
                                                        }}
                                                    >
                                                        Xem chi tiết
                                                    </button>
                                                    {!item.isRead && (
                                                        <button
                                                            className="px-3 py-1.5 bg-transparent border border-transparent hover:bg-slate-50 text-slate-500 hover:text-slate-700 text-[12px] font-semibold rounded-[8px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-200"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                markOneRead(item);
                                                            }}
                                                        >
                                                            Đánh dấu đã đọc
                                                        </button>
                                                    )}
                                                </div>
                                            )}

                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                        {hasMore && (
                            <div className="flex justify-center py-2">
                                <button
                                    onClick={loadMore}
                                    disabled={isLoadingMore}
                                    className="px-4 py-2 rounded-[8px] border border-slate-200 bg-white text-[13px] font-semibold text-slate-600 hover:text-slate-900 hover:border-slate-300 disabled:text-slate-400 disabled:cursor-not-allowed transition-colors"
                                >
                                    {isLoadingMore ? "Đang tải..." : "Tải thêm"}
                                </button>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-32 bg-transparent">
                        <Empty
                            description={<span className="text-[14px] text-gray-500 font-medium mt-2 block">Không có thông báo nào</span>}
                            image={Empty.PRESENTED_IMAGE_SIMPLE}
                        />
                    </div>
                )}
            </div>
        </Drawer>
    );
};

export default NotificationDrawer;
