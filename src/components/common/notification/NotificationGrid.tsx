import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Badge, Tooltip, Empty } from "antd";
import { useAppSelector } from "@/redux/hooks";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import "dayjs/locale/vi";

dayjs.extend(relativeTime);
dayjs.locale("vi");
import {
    FieldTimeOutlined,
    UserSwitchOutlined,
    FileProtectOutlined,
    StarOutlined,
    SwapOutlined,
    DollarCircleOutlined,
    HistoryOutlined,
    UserAddOutlined,
    FolderOpenOutlined,
    FormOutlined,
    BellFilled
} from "@ant-design/icons";

import { DOCUMENT_NOTIFICATION_MODULES, KNOWN_NOTIFICATION_MODULES, PENDING_ACTION_MODULES } from "@/config/notificationModules";
import type { UnifiedNotification } from "@/hooks/useNotifications";

interface NotificationGridProps {
    items: UnifiedNotification[];
    onClose: () => void;
    markOneRead: (item: UnifiedNotification) => void;
    markAllRead?: () => void;
    isLoading?: boolean;
    soundEnabled?: boolean;
    toggleSound?: () => void;
    onOpenFullCenter?: () => void;
}



const NotificationGrid: React.FC<NotificationGridProps> = ({ items, onClose, markOneRead, markAllRead, isLoading, soundEnabled, toggleSound, onOpenFullCenter }) => {
    const navigate = useNavigate();
    const { user } = useAppSelector((state) => state.account);
    const permissions = user?.role?.permissions || [];

    const hasPermission = (requiredPermission: any) => {
        if (!requiredPermission) return true;
        if (user?.role?.name === "SUPER_ADMIN") return true; // Super admin bypass

        return permissions.some(
            (item: any) =>
                item.apiPath === requiredPermission.apiPath &&
                item.method === requiredPermission.method &&
                item.module === requiredPermission.module
        );
    };

    const allowedModules = PENDING_ACTION_MODULES.filter(m => hasPermission(m.requiredPermission));

    const handleActionClick = (action: any) => {
        // Tạm thời điều hướng nếu có link, nếu không thì cứ đóng popup
        // onClose();
        // navigate(link); // Mở comment khi các trang này đã sẵn sàng
        setFilterModule(action.moduleKey);
        setActiveTab('list');
    };

    const handleBackToGrid = () => {
        setFilterModule(null);
        setActiveTab('grid');
    };

    const handleHistoryItemClick = (notif: UnifiedNotification) => {
        // 1. Đánh dấu đã đọc để số 8 trên chuông tự giảm
        if (!notif.isRead) {
            markOneRead(notif);
        }

        // 2. Đóng popup
        onClose();

        // 3. Chuyển hướng tới trang liên quan
        if (notif.actionLink) {
            navigate(notif.actionLink);
        } else {
            // Fallback: Tìm link chung của Module
            const moduleConfig = PENDING_ACTION_MODULES.find(m => m.moduleKey === notif.module);
            if (moduleConfig && moduleConfig.link !== "#") {
                navigate(moduleConfig.link);
            }
        }
    };

    const [activeTab, setActiveTab] = useState<'grid' | 'list'>('grid');
    const [filterModule, setFilterModule] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [visibleCount, setVisibleCount] = useState(20);
    const [showUnreadOnly, setShowUnreadOnly] = useState(false);

    React.useEffect(() => {
        setVisibleCount(20);
        setSearchTerm("");
        setShowUnreadOnly(false);
    }, [activeTab, filterModule]);

    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        const target = e.target as HTMLDivElement;
        if (target.scrollHeight - target.scrollTop <= target.clientHeight + 50) {
            setVisibleCount(prev => prev + 20);
        }
    };

    const filteredItems = React.useMemo(() => {
        let baseItems = activeTab === 'list'
            ? (filterModule
                ? items.filter(i => {
                    if (filterModule === "SYSTEM_ALERTS") {
                        return !KNOWN_NOTIFICATION_MODULES.includes(i.module || "");
                    }
                    if (filterModule === "DOCUMENTS") {
                        return DOCUMENT_NOTIFICATION_MODULES.includes(i.module || "");
                    }
                    return i.module === filterModule;
                })
                : items)
            : [];

        if (showUnreadOnly) {
            baseItems = baseItems.filter(item => !item.isRead);
        }

        if (searchTerm.trim()) {
            const term = searchTerm.toLowerCase();
            baseItems = baseItems.filter(item =>
                item.title?.toLowerCase().includes(term) ||
                item.subtitle?.toLowerCase().includes(term)
            );
        }
        return baseItems;
    }, [items, activeTab, filterModule, searchTerm, showUnreadOnly]);

    const unreadCount = items.filter(i => !i.isRead).length;
    const isListEmpty = activeTab === 'list' && !isLoading && filteredItems.length === 0;

    const groupedItems = React.useMemo(() => {
        const groups: Record<string, UnifiedNotification[]> = {
            "Hôm nay": [],
            "Hôm qua": [],
            "Tuần này": [],
            "Cũ hơn": [],
        };
        const now = dayjs();
        const itemsToDisplay = filteredItems.slice(0, visibleCount);

        itemsToDisplay.forEach(item => {
            if (!item.createdAt) {
                groups["Cũ hơn"].push(item);
                return;
            }
            const date = dayjs(item.createdAt);
            if (date.isSame(now, 'day')) {
                groups["Hôm nay"].push(item);
            } else if (date.isSame(now.subtract(1, 'day'), 'day')) {
                groups["Hôm qua"].push(item);
            } else if (date.isAfter(now.subtract(7, 'day'))) {
                groups["Tuần này"].push(item);
            } else {
                groups["Cũ hơn"].push(item);
            }
        });
        return groups;
    }, [filteredItems, visibleCount]);

    return (
        <div className="bg-white rounded-[14px] shadow-[0_4px_6px_-1px_rgba(0,0,0,0.07),0_10px_25px_-5px_rgba(0,0,0,0.10)] overflow-hidden flex flex-col border border-gray-200 fixed left-3 right-3 top-[70px] w-auto sm:relative sm:left-auto sm:right-auto sm:top-auto sm:w-[360px] max-h-[calc(100vh-96px)] z-[9999]">
            {/* Header Area */}
            <div className="px-4 pt-4 pb-0 flex flex-col gap-3 relative border-b border-gray-100 bg-white">
                <div className="flex items-center justify-between">
                    <h3 className="text-[16px] font-extrabold m-0 tracking-tight flex items-center gap-3">
                        <div className="w-[40px] h-[40px] rounded-[12px] bg-pink-50 border border-pink-100 flex items-center justify-center shadow-sm">
                            <BellFilled style={{ color: "#e94d83", fontSize: "15px" }} />
                        </div>
                        <span className="text-gray-900 leading-none">Thông báo</span>
                        {unreadCount > 0 && (
                            <span className="bg-pink-50 text-pink-600 px-2 py-0.5 rounded-full text-[10px] font-bold border border-pink-100 ml-0.5">
                                {unreadCount} mới
                            </span>
                        )}
                    </h3>
                    <div className="flex items-center gap-1">
                        {unreadCount > 0 && markAllRead && (
                            <Tooltip title="Đánh dấu tất cả đã đọc" placement="bottom">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        markAllRead();
                                    }}
                                    className="w-8 h-8 flex items-center justify-center rounded-full bg-white hover:bg-pink-50 text-gray-400 hover:text-pink-600 border border-gray-100 transition-all cursor-pointer outline-none"
                                >
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                        <polyline points="20 6 9 17 4 12"></polyline>
                                    </svg>
                                </button>
                            </Tooltip>
                        )}
                        {toggleSound && (
                            <Tooltip title={soundEnabled ? "Tắt âm thanh" : "Bật âm thanh"} placement="bottom">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        toggleSound();
                                    }}
                                    className="w-8 h-8 flex items-center justify-center rounded-full bg-white hover:bg-gray-50 text-gray-400 border border-gray-100 transition-all cursor-pointer outline-none"
                                >
                                    {soundEnabled ? (
                                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path><path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path></svg>
                                    ) : (
                                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><line x1="23" y1="9" x2="17" y2="15"></line><line x1="17" y1="9" x2="23" y2="15"></line></svg>
                                    )}
                                </button>
                            </Tooltip>
                        )}
                    </div>
                </div>

                {/* Apple-style Segmented Control Tabs */}
                <div className="bg-gray-100/80 p-1 rounded-[10px] flex relative z-10 mb-3 mt-2">
                    <button
                        onClick={() => handleBackToGrid()}
                        className={`flex-1 py-1.5 px-3 text-[13px] rounded-[8px] transition-all duration-300 z-10 ${activeTab === 'grid' ? 'text-gray-900 bg-white shadow-sm font-bold' : 'text-gray-500 hover:text-gray-700 bg-transparent font-medium'}`}
                    >
                        Tác vụ chờ
                    </button>
                    <button
                        onClick={() => setActiveTab('list')}
                        className={`flex-1 py-1.5 px-3 text-[13px] rounded-[8px] transition-all duration-300 z-10 ${activeTab === 'list' ? 'text-gray-900 bg-white shadow-sm font-bold' : 'text-gray-500 hover:text-gray-700 bg-transparent font-medium'}`}
                    >
                        Mới cập nhật
                    </button>
                </div>
            </div>

            {/* Content Area */}
            <div className="bg-white">
                {activeTab === 'grid' ? (
                    <div className="px-4 py-4 max-h-[300px] overflow-y-auto custom-scrollbar">
                        <div className="grid grid-cols-2 gap-3">
                            {allowedModules.map((action) => {
                                const count = action.filterUnread(items);
                                return (
                                    <div
                                        key={action.id}
                                        className="flex items-center gap-3 p-3 rounded-[12px] bg-gray-50/50 hover:bg-pink-50/60 border border-transparent hover:border-pink-100 transition-all cursor-pointer group"
                                        onClick={() => handleActionClick(action)}
                                    >
                                        <div className="relative flex-shrink-0">
                                            <div className="absolute -top-1.5 -right-1.5 z-10 scale-[0.8] origin-center">
                                                <Badge
                                                    count={count}
                                                    overflowCount={99}
                                                    color="#f43f5e"
                                                    style={{
                                                        boxShadow: "0 0 0 2px white",
                                                        fontWeight: "bold",
                                                    }}
                                                />
                                            </div>
                                            <div className="w-[42px] h-[42px] rounded-[10px] flex items-center justify-center text-[18px] transition-all duration-300 bg-white border border-gray-200 shadow-sm group-hover:border-pink-200 group-hover:text-pink-600 text-pink-500">
                                                {action.icon}
                                            </div>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="text-[12.5px] font-semibold text-gray-700 leading-[1.3] group-hover:text-pink-600 transition-colors line-clamp-2">
                                                {action.label}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col">
                        {/* Search Bar & Filters */}
                        <div className="px-4 pt-3 pb-3 bg-white border-b border-gray-100 z-10 flex flex-col gap-3">
                            <div className="relative group w-full">
                                <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-hover:text-pink-500 transition-colors w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                                <input
                                    type="text"
                                    placeholder="Bạn cần tìm gì hôm nay?"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-8 py-2.5 bg-gray-50 border border-gray-200 rounded-[10px] text-[13px] font-medium text-gray-700 outline-none focus:bg-white focus:border-pink-300 focus:ring-[3px] focus:ring-pink-100/60 transition-all placeholder:text-gray-400"
                                />
                                {searchTerm && (
                                    <svg
                                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 cursor-pointer hover:text-slate-600 w-4 h-4"
                                        viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                                        onClick={() => setSearchTerm("")}
                                    ><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                                )}
                            </div>
                            <div className="flex items-center justify-end">
                                <button
                                    onClick={() => setShowUnreadOnly(!showUnreadOnly)}
                                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-[11px] font-bold transition-all border outline-none cursor-pointer ${showUnreadOnly ? 'bg-pink-50 text-pink-600 border-pink-200 shadow-[0_2px_8px_rgba(236,72,153,0.15)]' : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50 hover:text-gray-700 shadow-sm'}`}
                                >
                                    <div className={`w-1.5 h-1.5 rounded-full ${showUnreadOnly ? 'bg-pink-500 shadow-[0_0_6px_rgba(236,72,153,0.6)]' : 'bg-gray-300'}`}></div>
                                    Chỉ hiện chưa đọc
                                </button>
                            </div>
                        </div>

                        <div className="max-h-[300px] overflow-y-auto custom-scrollbar flex flex-col relative" onScroll={handleScroll}>
                            {filterModule && (
                                <div className="sticky top-0 bg-white px-4 py-2.5 border-b border-gray-100 flex items-center justify-between z-20">
                                    <div className="flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-pink-500"></div>
                                        <span className="text-[13px] font-semibold text-slate-700">
                                            {PENDING_ACTION_MODULES.find(m => m.moduleKey === filterModule)?.label || "Đã lọc"}
                                        </span>
                                    </div>
                                    <button
                                        onClick={handleBackToGrid}
                                        className="flex items-center gap-1.5 px-2.5 py-1 rounded border border-gray-200 bg-white text-[11px] font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-all shadow-sm cursor-pointer outline-none"
                                    >
                                        Bỏ lọc
                                        <span className="text-[9px] font-bold">✕</span>
                                    </button>
                                </div>
                            )}

                            {isLoading ? (
                                <div className="p-5 flex flex-col gap-4">
                                    {[1, 2, 3, 4].map((i) => (
                                        <div key={i} className="flex gap-3 animate-pulse">
                                            <div className="w-2 h-2 rounded-full bg-slate-200 mt-2"></div>
                                            <div className="flex-1">
                                                <div className="h-3 bg-slate-200 rounded w-3/4 mb-2"></div>
                                                <div className="h-3 bg-slate-100 rounded w-1/2"></div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : filteredItems.length === 0 ? (
                                <div
                                    className="flex flex-col items-center justify-center px-6 py-9 text-center relative bg-white"
                                    style={{
                                        backgroundImage: "radial-gradient(circle at 50% 50%, rgba(244, 63, 94, 0.05) 0%, rgba(255, 255, 255, 0) 65%)"
                                    }}
                                >
                                    <div className="w-10 h-10 rounded-[12px] bg-pink-50 text-pink-500 flex items-center justify-center mb-3 border border-pink-100">
                                        <BellFilled style={{ fontSize: 16 }} />
                                    </div>
                                    <span className="text-slate-700 font-bold text-[14px]">Chưa có thông báo nào.</span>
                                    <span className="text-slate-400 text-[12px] mt-1 leading-relaxed max-w-[220px]">
                                        Quay lại tác vụ chờ hoặc mở trung tâm đầy đủ.
                                    </span>
                                    <div className="flex items-center gap-2 mt-3">
                                        <button
                                            onClick={handleBackToGrid}
                                            className="px-3 py-1.5 rounded-[10px] bg-pink-50 text-pink-600 text-[12px] font-bold border border-pink-100 hover:bg-pink-100 transition-colors cursor-pointer outline-none"
                                        >
                                            Tác vụ chờ
                                        </button>
                                        <button
                                            onClick={() => {
                                                if (onOpenFullCenter) {
                                                    onOpenFullCenter();
                                                } else {
                                                    onClose();
                                                    navigate("/admin/notifications");
                                                }
                                            }}
                                            className="px-3 py-1.5 rounded-[10px] bg-white text-slate-600 text-[12px] font-bold border border-gray-200 hover:border-pink-200 hover:text-pink-600 transition-colors cursor-pointer outline-none"
                                        >
                                            Xem tất cả
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                Object.entries(groupedItems).map(([groupName, groupItems]) => {
                                    if (groupItems.length === 0) return null;
                                    return (
                                        <div key={groupName} className="mb-0">
                                            <div className="px-4 py-2 text-[11px] font-bold text-gray-500 bg-gray-50 uppercase tracking-widest sticky top-0 z-10 border-b border-gray-100">
                                                {groupName}
                                            </div>
                                            {groupItems.map((notif, idx) => (
                                                <div
                                                    key={notif.id}
                                                    className={`px-4 py-3.5 border-b border-gray-100 hover:bg-pink-50/50 cursor-pointer transition-colors ${!notif.isRead ? 'bg-white' : 'bg-gray-50/70 opacity-75'}`}
                                                    onClick={() => handleHistoryItemClick(notif)}
                                                >
                                                    <div className="flex gap-3">
                                                        <div className="mt-1">
                                                            {!notif.isRead ? (
                                                                <div className="w-2 h-2 rounded-full bg-pink-500 mt-1 shadow-[0_0_8px_rgba(236,72,153,0.6)]"></div>
                                                            ) : (
                                                                <div className="w-2 h-2 rounded-full bg-gray-300 mt-1"></div>
                                                            )}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className={`text-[13.5px] m-0 mb-1 leading-tight ${!notif.isRead ? 'font-bold text-gray-900' : 'font-medium text-gray-700'}`}>
                                                                {notif.subtitle}
                                                            </p>
                                                            <div className="flex items-center justify-between mt-1.5">
                                                                <p className="text-[10px] text-gray-400 font-bold m-0 uppercase tracking-wide">
                                                                    {notif.title}
                                                                </p>
                                                                {notif.createdAt && (
                                                                    <span className="text-[10.5px] text-gray-400 font-medium">
                                                                        {dayjs(notif.createdAt).fromNow()}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Footer */}
            {!isListEmpty && (
                <div className="p-3 bg-white border-t border-gray-100">
                    <button
                        onClick={() => {
                            if (onOpenFullCenter) {
                                onOpenFullCenter();
                            } else {
                                onClose();
                                navigate("/admin/notifications");
                            }
                        }}
                        className="w-full py-2.5 bg-white border border-gray-200 rounded-[10px] text-[13px] font-bold text-gray-700 hover:text-pink-600 hover:border-pink-200 hover:bg-pink-50/30 transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer outline-none"
                    >
                        Xem tất cả thông báo
                    </button>
                </div>
            )}
        </div>
    );
};

export default NotificationGrid;
