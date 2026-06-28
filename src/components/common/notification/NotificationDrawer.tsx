import React, { useState } from "react";
import { Drawer, Spin, Avatar, Empty } from "antd";
import {
    CheckOutlined,
    SoundOutlined,
    NotificationOutlined,
    SearchOutlined,
    CloseOutlined,
    EllipsisOutlined,
    BellOutlined
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import "dayjs/locale/vi";

import { useNotifications } from "@/hooks/useNotifications";
import type { UnifiedNotification } from "@/hooks/useNotifications";

dayjs.extend(relativeTime);
dayjs.locale("vi");

interface NotificationDrawerProps {
    open: boolean;
    onClose: () => void;
}

const NotificationDrawer: React.FC<NotificationDrawerProps> = ({ open, onClose }) => {
    const navigate = useNavigate();
    const { items, unreadCount, markAllRead, markOneRead, isLoading, soundEnabled, toggleSound } = useNotifications();
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

    return (
        <Drawer
            placement="right"
            width={700}
            onClose={onClose}
            open={open}
            closable={false}
            bodyStyle={{ padding: 0, backgroundColor: "#f6f8fa", display: "flex", flexDirection: "column" }}
            headerStyle={{ display: "none" }}
            drawerStyle={{ borderRadius: "24px 0 0 24px", overflow: "hidden" }}
            maskStyle={{ backdropFilter: "blur(2px)" }}
        >
            {/* Custom Header matching Bitrix */}
            <div className="flex items-center px-6 py-4 bg-white border-b border-gray-200 sticky top-0 z-20">
                <button
                    onClick={onClose}
                    className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500 transition-colors"
                >
                    <CloseOutlined style={{ fontSize: 16 }} />
                </button>

                <div className="flex items-center gap-2 ml-4 flex-shrink-0">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center shadow-md shadow-pink-200">
                        <BellOutlined style={{ color: "white", fontSize: 16 }} />
                    </div>
                    <span className="text-[16px] font-extrabold text-gray-800">Thông báo</span>
                </div>

                {/* Tabs centered */}
                <div className="flex-1 flex justify-center px-4">
                    <div className="flex bg-gray-100/80 p-1 rounded-[8px]">
                        <button
                            onClick={() => setActiveTab('all')}
                            className={`px-6 py-1.5 rounded-[6px] text-[13px] font-bold transition-all ${activeTab === 'all' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            Tất cả
                        </button>
                        <button
                            onClick={() => setActiveTab('unread')}
                            className={`px-6 py-1.5 rounded-[6px] text-[13px] font-bold transition-all flex items-center gap-1.5 ${activeTab === 'unread' ? 'bg-white text-gray-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            Chưa đọc
                            {unreadCount > 0 && (
                                <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full leading-none">
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
                        className="w-full bg-gray-50 border border-gray-200 rounded-[8px] pl-3 pr-8 py-1.5 text-[13px] font-medium outline-none focus:bg-white focus:border-blue-400 focus:ring-1 focus:ring-blue-400 transition-all placeholder-gray-400"
                    />
                    <SearchOutlined className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                </div>
            </div>

            {/* List Content */}
            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                <div className="flex items-center justify-between mb-5">
                    <span className="text-[13px] font-bold text-gray-800 uppercase tracking-wide">
                        {activeTab === 'unread' ? 'Đang chờ bạn xử lý' : 'Cập nhật gần đây'}
                    </span>
                    <button
                        onClick={markAllRead}
                        disabled={unreadCount === 0}
                        className={`text-[12px] font-semibold flex items-center gap-1.5 transition-colors ${unreadCount > 0 ? 'text-blue-600 hover:text-blue-800 cursor-pointer' : 'text-gray-400 cursor-not-allowed'}`}
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
                                    className={`relative p-5 rounded-[12px] transition-all cursor-pointer group ${!item.isRead ? 'bg-[#f0f7ff] border border-blue-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)] hover:border-blue-200' : 'bg-white border border-gray-100 opacity-80 hover:opacity-100 hover:shadow-sm'}`}
                                >
                                    <div className="flex gap-4">
                                        <Avatar
                                            size={44}
                                            src={isSystem ? "https://ui-avatars.com/api/?name=LT&background=0284c7&color=fff&bold=true" : `https://ui-avatars.com/api/?name=${encodeURIComponent(displayTitle)}&background=f1f5f9&color=64748b`}
                                            className={`flex-shrink-0 shadow-sm ${item.isRead ? 'grayscale-[50%]' : ''}`}
                                        />

                                        <div className="flex-1 min-w-0 pt-0.5">
                                            <h4 className={`text-[14.5px] m-0 leading-tight truncate pr-20 ${!item.isRead ? 'font-bold text-gray-900' : 'font-semibold text-gray-600'}`}>
                                                {displayTitle}
                                            </h4>

                                            <p className={`text-[13.5px] m-0 mt-1.5 mb-3.5 leading-relaxed ${!item.isRead ? 'text-gray-700' : 'text-gray-500'}`} dangerouslySetInnerHTML={{ __html: item.subtitle.replace(/\n/g, '<br/>') }} />

                                            {item.actionLink && (
                                                <div className="flex gap-2 mt-2">
                                                    <button
                                                        className={`px-5 py-1.5 text-[13px] font-semibold rounded-[6px] transition-colors ${!item.isRead ? 'bg-[#0066cc] hover:bg-[#0052a3] text-white shadow-sm' : 'bg-gray-50 border border-gray-200 hover:bg-gray-100 text-gray-600'}`}
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
                                                            className="px-5 py-1.5 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 text-[13px] font-semibold rounded-[6px] transition-colors"
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

                                            <div className="absolute top-5 right-5">
                                                <span className="text-[12px] text-gray-400 font-medium">
                                                    {item.createdAt ? dayjs(item.createdAt).format("DD/MM, HH:mm") : ""}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
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
