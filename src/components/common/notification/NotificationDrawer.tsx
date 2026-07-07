import React, { useState } from "react";
import { Drawer, Spin, Avatar, Empty } from "antd";
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
            navigate(item.actionLink);
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
            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar" onScroll={handleScroll}>
                <div className="flex items-center justify-between mb-5">
                    <span className="text-[13px] font-bold text-slate-800 uppercase tracking-wide">
                        {activeTab === 'unread' ? 'Đang chờ bạn xử lý' : 'Cập nhật gần đây'}
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
                    <div className="flex flex-col gap-3">
                        {filteredItems.map((item) => {
                            const isSystem = item.title === "Thông báo hệ thống";
                            const displayTitle = isSystem ? "Hệ thống Lotus HRM" : item.title;

                            return (
                                <div
                                    key={item.id}
                                    onClick={() => handleItemClick(item)}
                                    className={`relative p-5 pl-6 rounded-[12px] transition-all cursor-pointer group overflow-hidden ${!item.isRead ? 'bg-white border border-slate-200 shadow-[0_2px_10px_rgba(15,23,42,0.04)] hover:border-slate-300 hover:shadow-[0_4px_16px_rgba(15,23,42,0.07)]' : 'bg-white/60 border border-slate-100 hover:bg-white hover:shadow-sm'}`}
                                >
                                    {!item.isRead && (
                                        <span className="absolute left-0 top-0 bottom-0 w-1 bg-rose-500" />
                                    )}
                                    <div className="flex gap-4">
                                        <Avatar
                                            size={44}
                                            src={isSystem ? "https://ui-avatars.com/api/?name=LT&background=1e293b&color=fff&bold=true" : `https://ui-avatars.com/api/?name=${encodeURIComponent(displayTitle)}&background=f1f5f9&color=64748b`}
                                            className={`flex-shrink-0 shadow-sm ${item.isRead ? 'grayscale-[40%]' : ''}`}
                                        />

                                        <div className="flex-1 min-w-0 pt-0.5">
                                            <h4 className={`text-[14.5px] m-0 leading-tight truncate pr-32 ${!item.isRead ? 'font-bold text-slate-900' : 'font-semibold text-slate-500'}`}>
                                                {displayTitle}
                                            </h4>

                                            <p className={`text-[13.5px] m-0 mt-1.5 mb-3.5 leading-relaxed ${!item.isRead ? 'text-slate-600' : 'text-slate-400'}`} dangerouslySetInnerHTML={{ __html: item.subtitle.replace(/\n/g, '<br/>') }} />

                                            {item.actionLink && (
                                                <div className="flex gap-2 mt-2">
                                                    <button
                                                        className={`px-5 py-1.5 text-[13px] font-semibold rounded-[8px] transition-colors ${!item.isRead ? 'bg-slate-900 hover:bg-slate-800 text-white shadow-sm' : 'bg-white border border-slate-200 hover:bg-slate-50 text-slate-600'}`}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            navigate(item.actionLink!);
                                                            onClose();
                                                        }}
                                                    >
                                                        Chi tiết
                                                    </button>
                                                    {!item.isRead && (
                                                        <button
                                                            className="px-5 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 text-slate-700 text-[13px] font-semibold rounded-[8px] transition-colors"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                markOneRead(item);
                                                            }}
                                                        >
                                                            Đã hiểu
                                                        </button>
                                                    )}
                                                </div>
                                            )}

                                            <div className="absolute top-5 right-5 flex items-center gap-2">
                                                <span className="text-[12px] text-slate-400 font-medium">
                                                    {item.createdAt ? dayjs(item.createdAt).format("DD/MM, HH:mm") : ""}
                                                </span>
                                                {item.type === "app" && (
                                                    <button
                                                        title="Xoá thông báo"
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
