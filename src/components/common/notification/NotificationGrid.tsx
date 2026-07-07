import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Tooltip, Empty } from "antd";
import { useAppSelector } from "@/redux/hooks";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import "dayjs/locale/vi";

dayjs.extend(relativeTime);
dayjs.locale("vi");
import {
    BellFilled,
    RightOutlined
} from "@ant-design/icons";

import type { NotificationModuleConfig } from "@/config/notificationModules";
import { DOCUMENT_NOTIFICATION_MODULES, KNOWN_NOTIFICATION_MODULES, PENDING_ACTION_MODULES, PROCEDURE_NOTIFICATION_MODULES } from "@/config/notificationModules";
import type { UnifiedNotification } from "@/hooks/useNotifications";

const MODULE_COLOR_MAP: Record<NonNullable<NotificationModuleConfig["color"]>, { bg: string; border: string; text: string; hoverBg: string; hoverBorder: string }> = {
    blue: { bg: "#eff6ff", border: "#bfdbfe", text: "#1d4ed8", hoverBg: "#dbeafe", hoverBorder: "#93c5fd" },
    emerald: { bg: "#ecfdf5", border: "#a7f3d0", text: "#065f46", hoverBg: "#d1fae5", hoverBorder: "#6ee7b7" },
    amber: { bg: "#fffbeb", border: "#fde68a", text: "#92400e", hoverBg: "#fef3c7", hoverBorder: "#fcd34d" },
    violet: { bg: "#f5f3ff", border: "#ddd6fe", text: "#5b21b6", hoverBg: "#ede9fe", hoverBorder: "#c4b5fd" },
    cyan: { bg: "#ecfeff", border: "#a5f3fc", text: "#155e75", hoverBg: "#cffafe", hoverBorder: "#67e8f9" },
    slate: { bg: "#f8fafc", border: "#cbd5e1", text: "#475569", hoverBg: "#f1f5f9", hoverBorder: "#94a3b8" },
};

interface NotificationGridProps {
    items: UnifiedNotification[];
    onClose: () => void;
    markOneRead: (item: UnifiedNotification) => void;
    markAllRead?: () => void;
    markAllReadByModules?: (modules: string[]) => void;
    isLoading?: boolean;
    soundEnabled?: boolean;
    toggleSound?: () => void;
    onOpenFullCenter: () => void;
}

const NotificationGrid: React.FC<NotificationGridProps> = ({ items, onClose, markOneRead, markAllRead, markAllReadByModules, isLoading, soundEnabled, toggleSound, onOpenFullCenter }) => {
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
                    if (filterModule === "COMPANY_PROCEDURES") {
                        return PROCEDURE_NOTIFICATION_MODULES.includes(i.module || "");
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

    const handleMarkReadClick = () => {
        if (activeTab === 'list' && filterModule && markAllReadByModules) {
            const modules = Array.from(new Set(
                filteredItems
                    .filter(item => item.type === "app" && item.module)
                    .map(item => item.module as string)
            ));

            filteredItems
                .filter(item => item.type === "jd" && !item.isRead)
                .forEach(markOneRead);

            markAllReadByModules(modules);
            return;
        }

        markAllRead?.();
    };

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
        <div className="bg-white rounded-3xl shadow-[0_25px_60px_-15px_rgba(15,23,42,0.3),0_0_40px_rgba(15,23,42,0.03)] overflow-hidden flex flex-col border border-slate-200/80 fixed left-3 right-3 top-[70px] w-auto sm:relative sm:left-auto sm:right-auto sm:top-auto sm:w-[390px] max-h-[calc(100vh-96px)] z-[9999]">
            <div className="px-4 pt-4 pb-0 flex flex-col gap-3 relative border-b border-slate-100 bg-white">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-xl bg-rose-50/50 border border-rose-100/60 flex items-center justify-center text-rose-500 shadow-inner">
                            <BellFilled style={{ fontSize: "14px" }} />
                        </div>
                        <div className="min-w-0 flex items-center gap-2">
                            <h3 className="text-[15.5px] font-bold m-0 tracking-tight text-slate-950 leading-tight">
                                Thông báo
                            </h3>
                            {unreadCount > 0 && (
                                <span className="min-w-[20px] h-5 px-1.5 rounded-full bg-rose-50 text-rose-600 border border-rose-100/60 text-[11px] font-bold flex items-center justify-center leading-none">
                                    {unreadCount > 99 ? "99+" : unreadCount}
                                </span>
                            )}
                        </div>
                    </div>
                    <div className="flex items-center gap-1">
                        {unreadCount > 0 && markAllRead && (
                            <Tooltip title="Đánh dấu tất cả đã đọc" placement="bottom">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleMarkReadClick();
                                    }}
                                    className="w-8 h-8 flex items-center justify-center rounded-full bg-white hover:bg-rose-50 text-slate-400 hover:text-rose-600 border border-slate-200 transition-all cursor-pointer outline-none shadow-sm hover:shadow"
                                >
                                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
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
                                    className="w-8 h-8 flex items-center justify-center rounded-full bg-white hover:bg-rose-50 text-slate-400 hover:text-rose-600 border border-slate-200 transition-all cursor-pointer outline-none shadow-sm hover:shadow"
                                >
                                    {soundEnabled ? (
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path><path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path></svg>
                                    ) : (
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><line x1="23" y1="9" x2="17" y2="15"></line><line x1="17" y1="9" x2="23" y2="15"></line></svg>
                                    )}
                                </button>
                            </Tooltip>
                        )}
                    </div>
                </div>

                <div className="bg-slate-100/80 p-1.5 rounded-xl flex relative z-10 mb-3 mt-1 border border-slate-200/40">
                    <button
                        onClick={() => handleBackToGrid()}
                        className={`flex-1 py-2 px-3 text-[12.5px] rounded-lg transition-all duration-300 z-10 cursor-pointer ${activeTab === 'grid' ? 'text-slate-900 bg-white shadow-sm font-semibold' : 'text-slate-500 hover:text-slate-800 bg-transparent font-medium'}`}
                    >
                        Công việc cần xử lý
                    </button>
                    <button
                        onClick={() => setActiveTab('list')}
                        className={`flex-1 py-2 px-3 text-[12.5px] rounded-lg transition-all duration-300 z-10 cursor-pointer ${activeTab === 'list' ? 'text-slate-900 bg-white shadow-sm font-semibold' : 'text-slate-500 hover:text-slate-800 bg-transparent font-medium'}`}
                    >
                        Lịch sử thông báo
                    </button>
                </div>
            </div>

            <div className="bg-white">
                {activeTab === 'grid' ? (
                    <div className="px-4 py-4 max-h-[340px] overflow-y-auto custom-scrollbar">
                        <div className="grid grid-cols-3 gap-3">
                            {allowedModules.map((action, idx) => {
                                const count = action.filterUnread(items);
                                // Premium icon palettes with custom matching color-glow shadows
                                const palettes = [
                                    { bg: "linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)", border: "rgba(59,130,246,0.15)", icon: "#2563eb", badge: "#2563eb", hoverShadow: "rgba(59,130,246,0.12)" }, // blue
                                    { bg: "linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)", border: "rgba(16,185,129,0.15)", icon: "#10b981", badge: "#10b981", hoverShadow: "rgba(16,185,129,0.12)" }, // green
                                    { bg: "linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)", border: "rgba(249,115,22,0.15)", icon: "#f97316", badge: "#f97316", hoverShadow: "rgba(249,115,22,0.12)" }, // orange
                                    { bg: "linear-gradient(135deg, #faf5ff 0%, #f3e8ff 100%)", border: "rgba(139,92,246,0.15)", icon: "#8b5cf6", badge: "#8b5cf6", hoverShadow: "rgba(139,92,246,0.12)" }, // violet
                                    { bg: "linear-gradient(135deg, #ecfeff 0%, #cffafe 100%)", border: "rgba(6,182,212,0.15)", icon: "#06b6d4", badge: "#06b6d4", hoverShadow: "rgba(6,182,212,0.12)" }, // cyan
                                    { bg: "linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)", border: "rgba(100,116,139,0.15)", icon: "#64748b", badge: "#64748b", hoverShadow: "rgba(100,116,139,0.12)" }, // slate
                                ];
                                const p = palettes[idx % palettes.length];
                                return (
                                    <Tooltip key={action.id} title={action.label} placement="top">
                                        <button
                                            className="relative flex flex-col items-center justify-between gap-2.5 w-full py-4 px-2 bg-white border border-slate-100 rounded-2xl text-center transition-all duration-300 hover:border-slate-200 hover:-translate-y-1 hover:shadow-lg cursor-pointer outline-none group"
                                            style={{
                                                boxShadow: "0 2px 8px rgba(0,0,0,0.02)",
                                            }}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.boxShadow = `0 12px 24px -10px ${p.hoverShadow}`;
                                                e.currentTarget.style.borderColor = p.border;
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.02)";
                                                e.currentTarget.style.borderColor = "var(--color-slate-100, #f1f5f9)";
                                            }}
                                            onClick={() => handleActionClick(action)}
                                        >
                                            {count > 0 && (
                                                <span
                                                    className="absolute top-2.5 right-2.5 min-w-[18px] h-[18px] px-1 rounded-full text-white text-[9.5px] font-extrabold flex items-center justify-center leading-none shadow-sm animate-pulse"
                                                    style={{ background: p.badge }}
                                                >
                                                    {count > 99 ? "99+" : count}
                                                </span>
                                            )}
                                            <div
                                                className="w-11 h-11 rounded-xl flex items-center justify-center text-[20px] transition-transform duration-300 group-hover:scale-110 shadow-sm"
                                                style={{ background: p.bg, border: `1px solid ${p.border}`, color: p.icon }}
                                            >
                                                {action.icon}
                                            </div>
                                            <span className="text-[11.5px] font-semibold text-slate-600 group-hover:text-slate-900 leading-snug text-center line-clamp-2 transition-colors" style={{ maxWidth: "100%" }}>
                                                {action.label}
                                            </span>
                                        </button>
                                    </Tooltip>
                                );
                            })}
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col">
                        {/* Search Bar & Filters */}
                        <div className="px-4 pt-3 pb-3 bg-white border-b border-slate-100 z-10 flex flex-col gap-3">
                            <div className="relative group w-full">
                                <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-hover:text-rose-500 transition-colors w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                                <input
                                    type="text"
                                    placeholder="Tìm kiếm thông báo"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-8 py-2.5 bg-slate-50 border border-slate-200 rounded-[10px] text-[13px] font-medium text-slate-700 outline-none focus:bg-white focus:border-rose-300 focus:ring-[3px] focus:ring-rose-100/70 transition-all placeholder:text-slate-400"
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
                                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-[11px] font-bold transition-all border outline-none cursor-pointer ${showUnreadOnly ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50 hover:text-slate-800 shadow-sm'}`}
                                >
                                    <div className={`w-1.5 h-1.5 rounded-full ${showUnreadOnly ? 'bg-white' : 'bg-slate-300'}`}></div>
                                    Chưa đọc
                                </button>
                            </div>
                        </div>

                        <div className="max-h-[300px] overflow-y-auto custom-scrollbar flex flex-col relative" onScroll={handleScroll}>
                            {filterModule && (
                                <div className="sticky top-0 bg-white px-4 py-2.5 border-b border-slate-100 flex items-center justify-between z-20">
                                    <div className="flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-rose-500"></div>
                                        <span className="text-[13px] font-semibold text-slate-700">
                                            {PENDING_ACTION_MODULES.find(m => m.moduleKey === filterModule)?.label || "Đã lọc"}
                                        </span>
                                    </div>
                                    <button
                                        onClick={handleBackToGrid}
                                        className="flex items-center gap-1.5 px-2.5 py-1 rounded border border-slate-200 bg-white text-[11px] font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-all shadow-sm cursor-pointer outline-none"
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
                                >
                                    <div className="w-10 h-10 rounded-[12px] bg-slate-100 text-slate-400 flex items-center justify-center mb-3 border border-slate-200">
                                        <BellFilled style={{ fontSize: 16 }} />
                                    </div>
                                    <span className="text-slate-700 font-bold text-[14px]">Không có thông báo trong mục này.</span>
                                    <span className="text-slate-400 text-[12px] mt-1 leading-relaxed max-w-[220px]">
                                        Bạn có thể quay lại danh sách cần xử lý hoặc mở trung tâm thông báo.
                                    </span>
                                    <div className="flex items-center gap-2 mt-3">
                                        <button
                                            onClick={handleBackToGrid}
                                            className="px-3.5 py-1.5 rounded-[9px] bg-rose-500 text-white text-[12px] font-semibold border border-rose-500 hover:bg-rose-600 transition-colors cursor-pointer outline-none"
                                        >
                                            Công việc cần xử lý
                                        </button>
                                        <button
                                            onClick={onOpenFullCenter}
                                            className="px-3.5 py-1.5 rounded-[9px] bg-white text-slate-600 text-[12px] font-semibold border border-slate-200 hover:border-slate-300 hover:text-slate-900 transition-colors cursor-pointer outline-none"
                                        >
                                            Mở trung tâm
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                Object.entries(groupedItems).map(([groupName, groupItems]) => {
                                    if (groupItems.length === 0) return null;
                                    return (
                                        <div key={groupName} className="mb-0">
                                            <div className="px-4 py-2 text-[11px] font-bold text-slate-500 bg-slate-50 uppercase tracking-widest sticky top-0 z-10 border-b border-slate-100">
                                                {groupName}
                                            </div>
                                            {groupItems.map((notif) => (
                                                <div
                                                    key={notif.id}
                                                    className={`relative px-4 py-3.5 border-b border-slate-100 hover:bg-slate-50 cursor-pointer transition-colors ${!notif.isRead ? 'bg-white' : 'bg-slate-50/60'}`}
                                                    onClick={() => handleHistoryItemClick(notif)}
                                                >
                                                    {!notif.isRead && (
                                                        <span className="absolute left-0 top-0 bottom-0 w-[3px] bg-rose-500"></span>
                                                    )}
                                                    <div className="flex gap-3">
                                                        <div className="mt-1">
                                                            {!notif.isRead ? (
                                                                <div className="w-2 h-2 rounded-full bg-rose-500 mt-1"></div>
                                                            ) : (
                                                                <div className="w-2 h-2 rounded-full bg-slate-300 mt-1"></div>
                                                            )}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className={`text-[13.5px] m-0 mb-1 leading-tight line-clamp-2 ${!notif.isRead ? 'font-bold text-slate-900' : 'font-medium text-slate-600'}`}>
                                                                {notif.subtitle}
                                                            </p>
                                                            <div className="flex items-center justify-between mt-1.5">
                                                                <p className="text-[10px] text-slate-400 font-bold m-0 uppercase tracking-wide">
                                                                    {notif.title}
                                                                </p>
                                                                {notif.createdAt && (
                                                                    <span className="text-[10.5px] text-slate-400 font-medium">
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
                <div className="p-4 bg-slate-50/50 border-t border-slate-100/80">
                    <button
                        onClick={onOpenFullCenter}
                        className="w-full py-2.5 bg-white border border-slate-200 rounded-xl text-[13px] font-semibold text-slate-700 hover:text-rose-600 hover:border-rose-100 hover:bg-rose-50/30 hover:shadow-sm transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer outline-none"
                    >
                        Mở trung tâm thông báo
                    </button>
                </div>
            )}
        </div>
    );
};

export default NotificationGrid;
