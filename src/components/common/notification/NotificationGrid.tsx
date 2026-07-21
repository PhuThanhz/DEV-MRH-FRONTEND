import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Dropdown, Modal, Tooltip } from "antd";
import { useAppSelector } from "@/redux/hooks";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import "dayjs/locale/vi";

dayjs.extend(relativeTime);
dayjs.locale("vi");
import {
    BellOutlined,
    CheckOutlined,
    CloseOutlined,
    DeleteOutlined,
    EyeOutlined,
    MoreOutlined,
    NotificationOutlined,
    RightOutlined,
    SoundOutlined,
} from "@ant-design/icons";

import { DOCUMENT_NOTIFICATION_MODULES, KNOWN_NOTIFICATION_MODULES, PENDING_ACTION_MODULES, PROCEDURE_NOTIFICATION_MODULES } from "@/config/notificationModules";
import type { UnifiedNotification } from "@/hooks/useNotifications";
import { resolveNotificationActionLink } from "./notificationNavigation";

interface NotificationGridProps {
    items: UnifiedNotification[];
    onClose: () => void;
    markOneRead: (item: UnifiedNotification) => void;
    deleteOne?: (item: UnifiedNotification) => Promise<void>;
    markAllRead?: () => void;
    markAllReadByModules?: (modules: string[]) => void;
    isLoading?: boolean;
    soundEnabled?: boolean;
    toggleSound?: () => void;
    onOpenFullCenter: () => void;
}

const NotificationGrid: React.FC<NotificationGridProps> = ({ items, onClose, markOneRead, deleteOne, markAllRead, markAllReadByModules, isLoading, soundEnabled, toggleSound, onOpenFullCenter }) => {
    const navigate = useNavigate();
    const { user } = useAppSelector((state) => state.account);
    const permissions = user?.role?.permissions || [];

    const hasPermission = (requiredPermission: any) => {
        if (user?.role?.name?.toUpperCase() === "SUPER_ADMIN") return true;

        return permissions.some(
            (item: any) =>
                item.apiPath === requiredPermission.apiPath &&
                item.method === requiredPermission.method &&
                item.module === requiredPermission.module
        );
    };

    const allowedModules = PENDING_ACTION_MODULES.filter(module => (
        module.requiredPermissions.length === 0
        || module.requiredPermissions.some(hasPermission)
    ));
    const businessModules = allowedModules
        .filter(module => module.id !== "system_alerts")
        .map(module => ({ module, count: module.filterUnread(items) }));
    const systemModule = allowedModules.find(module => module.id === "system_alerts");
    const systemUnreadCount = systemModule?.filterUnread(items) ?? 0;

    const moduleToneClasses: Record<string, { icon: string; glow: string }> = {
        jd_approval: {
            icon: "bg-blue-50 border-blue-100 text-blue-600",
            glow: "hover:bg-blue-50/35 hover:border-blue-200 hover:shadow-[0_12px_28px_-20px_rgba(37,99,235,0.5)]",
        },
        evaluation: {
            icon: "bg-emerald-50 border-emerald-100 text-emerald-600",
            glow: "hover:bg-emerald-50/35 hover:border-emerald-200 hover:shadow-[0_12px_28px_-20px_rgba(5,150,105,0.5)]",
        },
        accounting_dossiers: {
            icon: "bg-orange-50 border-orange-100 text-orange-600",
            glow: "hover:bg-orange-50/35 hover:border-orange-200 hover:shadow-[0_12px_28px_-20px_rgba(234,88,12,0.45)]",
        },
        procedures: {
            icon: "bg-violet-50 border-violet-100 text-violet-600",
            glow: "hover:bg-violet-50/35 hover:border-violet-200 hover:shadow-[0_12px_28px_-20px_rgba(124,58,237,0.45)]",
        },
        career_paths: {
            icon: "bg-cyan-50 border-cyan-100 text-cyan-600",
            glow: "hover:bg-cyan-50/35 hover:border-cyan-200 hover:shadow-[0_12px_28px_-20px_rgba(8,145,178,0.45)]",
        },
        documents: {
            icon: "bg-rose-50 border-rose-100 text-rose-600",
            glow: "hover:bg-rose-50/35 hover:border-rose-200 hover:shadow-[0_12px_28px_-20px_rgba(225,29,72,0.4)]",
        },
    };

    const handleActionClick = (action: any) => {
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
            navigate(resolveNotificationActionLink(notif.actionLink)!);
        } else {
            // Fallback: Tìm link chung của Module
            const moduleConfig = PENDING_ACTION_MODULES.find(m => m.moduleKey === notif.module);
            if (moduleConfig && moduleConfig.link !== "#") {
                navigate(moduleConfig.link);
            }
        }
    };

    const handleDeleteNotification = (notif: UnifiedNotification) => {
        if (notif.type !== "app" || !deleteOne) return;

        Modal.confirm({
            title: "Xoá thông báo?",
            content: "Thông báo sẽ bị xoá khỏi lịch sử của bạn và không thể khôi phục.",
            okText: "Xoá",
            cancelText: "Huỷ",
            okButtonProps: { danger: true },
            centered: true,
            onOk: () => deleteOne(notif),
        });
    };

    const handleNotificationMenuAction = (key: string, notif: UnifiedNotification) => {
        if (key === "open") {
            handleHistoryItemClick(notif);
            return;
        }
        if (key === "read" && !notif.isRead) {
            markOneRead(notif);
            return;
        }
        if (key === "delete") {
            handleDeleteNotification(notif);
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
        <div className="bg-white rounded-[22px] shadow-[0_24px_60px_-24px_rgba(71,85,105,0.28)] overflow-hidden flex flex-col border border-slate-200/80 fixed left-3 right-3 top-[70px] w-auto sm:relative sm:left-auto sm:right-auto sm:top-auto sm:w-[440px] max-h-[calc(100vh-96px)]">
            <div className="px-4 pt-4 pb-0 flex flex-col gap-3 relative border-b border-slate-200 bg-white">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-500 shadow-[0_6px_18px_-12px_rgba(225,29,72,0.8)]">
                            <BellOutlined style={{ fontSize: "17px" }} />
                        </div>
                        <div className="min-w-0 flex items-center gap-2">
                            <h3 className="text-[16px] font-bold m-0 tracking-tight text-slate-800 leading-tight">
                                Thông báo
                            </h3>
                            {unreadCount > 0 && (
                                <span className="h-5 px-2 rounded-md bg-rose-50 text-rose-600 border border-rose-100 text-[10.5px] font-bold flex items-center justify-center leading-none tabular-nums whitespace-nowrap">
                                    {unreadCount > 99 ? "99+" : unreadCount} chưa đọc
                                </span>
                            )}
                        </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <Dropdown
                            trigger={["click"]}
                            placement="bottomRight"
                            menu={{
                                items: [
                                    {
                                        key: "read-all",
                                        icon: <CheckOutlined />,
                                        label: "Đánh dấu tất cả đã đọc",
                                        disabled: unreadCount === 0 || !markAllRead,
                                    },
                                    {
                                        key: "sound",
                                        icon: <SoundOutlined />,
                                        label: soundEnabled ? "Tắt âm thanh" : "Bật âm thanh",
                                        disabled: !toggleSound,
                                    },
                                    { type: "divider" },
                                    {
                                        key: "center",
                                        icon: <NotificationOutlined />,
                                        label: "Mở trung tâm thông báo",
                                    },
                                ],
                                onClick: ({ key, domEvent }) => {
                                    domEvent.stopPropagation();
                                    if (key === "read-all") handleMarkReadClick();
                                    if (key === "sound") toggleSound?.();
                                    if (key === "center") onOpenFullCenter();
                                },
                            }}
                        >
                            <Tooltip title="Tuỳ chọn thông báo" placement="bottom">
                                <button
                                    type="button"
                                    aria-label="Tuỳ chọn thông báo"
                                    onClick={(event) => event.stopPropagation()}
                                    className="w-8 h-8 flex items-center justify-center rounded-lg bg-white hover:bg-slate-50 text-slate-500 hover:text-slate-700 border border-slate-200 transition-colors cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-rose-200"
                                >
                                    <MoreOutlined />
                                </button>
                            </Tooltip>
                        </Dropdown>
                        <Tooltip title="Đóng" placement="bottom">
                            <button
                                type="button"
                                aria-label="Đóng thông báo"
                                onClick={(event) => {
                                    event.stopPropagation();
                                    onClose();
                                }}
                                className="w-8 h-8 flex items-center justify-center rounded-lg bg-white hover:bg-rose-50 text-slate-400 hover:text-rose-500 border border-slate-200 hover:border-rose-100 transition-colors cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-rose-200"
                            >
                                <CloseOutlined />
                            </button>
                        </Tooltip>
                    </div>
                </div>

                <div className="bg-slate-100 p-1 rounded-lg flex relative z-10 mb-3 mt-1 border border-slate-200">
                    <button
                        onClick={() => handleBackToGrid()}
                        className={`flex-1 py-2 px-3 text-[12.5px] rounded-md transition-colors z-10 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-rose-200 ${activeTab === 'grid' ? 'text-rose-600 bg-white border border-rose-100 font-semibold shadow-sm' : 'text-slate-500 hover:text-slate-700 bg-transparent border border-transparent font-medium'}`}
                    >
                        Cần xử lý
                    </button>
                    <button
                        onClick={() => setActiveTab('list')}
                        className={`flex-1 py-2 px-3 text-[12.5px] rounded-md transition-colors z-10 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-rose-200 ${activeTab === 'list' ? 'text-rose-600 bg-white border border-rose-100 font-semibold shadow-sm' : 'text-slate-500 hover:text-slate-700 bg-transparent border border-transparent font-medium'}`}
                    >
                        Lịch sử thông báo
                    </button>
                </div>
            </div>

            <div className="bg-slate-50/35">
                {activeTab === 'grid' ? (
                    <div className="px-4 pt-3.5 pb-4 max-h-[400px] overflow-y-auto custom-scrollbar">
                        <div className="mb-2.5">
                            <p className="m-0 text-[12.5px] font-semibold text-slate-700">Công việc theo nghiệp vụ</p>
                            <p className="m-0 mt-0.5 text-[11px] leading-relaxed text-slate-500">Chọn nhóm để xem thông báo liên quan.</p>
                        </div>
                        {businessModules.length > 0 ? (
                            <div className="grid grid-cols-1 min-[390px]:grid-cols-2 gap-2">
                                {businessModules.map(({ module, count }) => {
                                    const tone = moduleToneClasses[module.id] ?? moduleToneClasses.jd_approval;
                                    return (
                                        <button
                                            key={module.id}
                                            type="button"
                                            className={`group relative min-h-[76px] px-3 py-2.5 flex items-center gap-2.5 rounded-[14px] bg-white border border-slate-200/90 text-left transition-all duration-200 hover:-translate-y-px cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-rose-200 ${tone.glow}`}
                                            onClick={() => handleActionClick(module)}
                                        >
                                            <span className={`relative w-10 h-10 flex-shrink-0 rounded-xl border flex items-center justify-center transition-transform duration-200 group-hover:scale-[1.03] ${tone.icon}`}>
                                                {module.icon}
                                                {count > 0 && (
                                                    <span className="absolute -top-2 -right-2 min-w-[19px] h-[19px] px-1 rounded-full bg-rose-500 text-white ring-[3px] ring-white shadow-sm flex items-center justify-center text-[9.5px] font-bold leading-none tabular-nums">
                                                        {count > 99 ? "99+" : count}
                                                    </span>
                                                )}
                                            </span>
                                            <span className="min-w-0 flex-1">
                                                <span className="block text-[11.5px] font-semibold text-slate-700 leading-snug text-pretty">{module.label}</span>
                                                <span className={`block mt-1 text-[10px] font-medium ${count > 0 ? "text-rose-500" : "text-slate-400"}`}>
                                                    {count > 0 ? `${count > 99 ? "99+" : count} chưa đọc` : "Không có tin mới"}
                                                </span>
                                            </span>
                                            <RightOutlined className="text-[8px] text-slate-300 transition-transform group-hover:translate-x-0.5 group-hover:text-slate-400" />
                                        </button>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="py-8 px-5 rounded-xl bg-slate-50 border border-slate-200 text-center">
                                <div className="w-9 h-9 mx-auto rounded-lg bg-white border border-slate-200 text-slate-400 flex items-center justify-center">
                                    <BellOutlined style={{ fontSize: 15 }} />
                                </div>
                                <p className="m-0 mt-3 text-[13px] font-semibold text-slate-700">Không có thông báo mới</p>
                                <p className="m-0 mt-1 text-[11.5px] text-slate-500">Các thông báo đã đọc vẫn có trong lịch sử.</p>
                            </div>
                        )}
                        {systemModule && systemUnreadCount > 0 && (
                            <button
                                type="button"
                                onClick={() => handleActionClick(systemModule)}
                                className="mt-2.5 w-full min-h-[48px] px-3 flex items-center gap-3 rounded-xl bg-slate-50/80 border border-slate-200 text-left transition-all hover:bg-slate-100 hover:border-slate-300 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-rose-200"
                            >
                                <span className="w-8 h-8 rounded-lg bg-white border border-slate-200 text-slate-500 flex items-center justify-center">
                                    {systemModule.icon}
                                </span>
                                <span className="flex-1 text-[12px] font-semibold text-slate-600">Thông báo hệ thống</span>
                                <span className="min-w-[20px] h-5 px-1.5 rounded-full bg-rose-500 text-white ring-2 ring-white shadow-sm flex items-center justify-center text-[9.5px] font-bold tabular-nums">{systemUnreadCount > 99 ? "99+" : systemUnreadCount}</span>
                                <RightOutlined className="text-slate-400 text-[10px]" />
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="flex flex-col">
                        {/* Search Bar & Filters */}
                        <div className="px-4 py-3 bg-white border-b border-slate-100 z-10 flex items-center gap-2">
                            <div className="relative group flex-1 min-w-0">
                                <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-hover:text-rose-500 transition-colors w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                                <input
                                    type="text"
                                    placeholder="Tìm kiếm thông báo"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full h-10 pl-10 pr-8 bg-slate-50 border border-slate-200 rounded-[10px] text-[12.5px] font-medium text-slate-700 outline-none focus:bg-white focus:border-rose-300 focus:ring-[3px] focus:ring-rose-100/70 transition-all placeholder:text-slate-400"
                                />
                                {searchTerm && (
                                    <svg
                                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 cursor-pointer hover:text-slate-600 w-4 h-4"
                                        viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                                        onClick={() => setSearchTerm("")}
                                    ><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                                )}
                            </div>
                            <button
                                type="button"
                                aria-pressed={showUnreadOnly}
                                title="Chỉ hiển thị thông báo chưa đọc"
                                onClick={() => setShowUnreadOnly(!showUnreadOnly)}
                                className={`h-10 flex-shrink-0 flex items-center gap-1.5 px-3 rounded-[10px] text-[11px] font-semibold transition-all border outline-none cursor-pointer focus-visible:ring-2 focus-visible:ring-rose-200 ${showUnreadOnly ? 'bg-rose-50 text-rose-600 border-rose-200' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50 hover:text-slate-700'}`}
                            >
                                <span className={`w-1.5 h-1.5 rounded-full ${showUnreadOnly ? 'bg-rose-500' : 'bg-slate-300'}`} />
                                Chưa đọc
                            </button>
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
                                        <BellOutlined style={{ fontSize: 16 }} />
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
                                        <section key={groupName} className="pb-1">
                                            <div className="px-4 py-2.5 text-[10.5px] font-bold text-slate-500 bg-slate-50/95 uppercase tracking-[0.12em] sticky top-0 z-10 border-b border-slate-100">
                                                {groupName}
                                            </div>
                                            <div className="px-3 pt-2 flex flex-col gap-2">
                                                {groupItems.map((notif) => {
                                                    const itemMenu = [
                                                        {
                                                            key: "open",
                                                            icon: <EyeOutlined />,
                                                            label: "Mở chi tiết",
                                                        },
                                                        ...(!notif.isRead ? [{
                                                            key: "read",
                                                            icon: <CheckOutlined />,
                                                            label: "Đánh dấu đã đọc",
                                                        }] : []),
                                                        ...(notif.type === "app" && deleteOne ? [
                                                            { type: "divider" as const },
                                                            {
                                                                key: "delete",
                                                                icon: <DeleteOutlined />,
                                                                label: "Xoá thông báo",
                                                                danger: true,
                                                            },
                                                        ] : []),
                                                    ];

                                                    return (
                                                        <article
                                                            key={notif.id}
                                                            role="button"
                                                            tabIndex={0}
                                                            className={`group relative px-3.5 py-3 rounded-[14px] border cursor-pointer transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-rose-200 ${!notif.isRead ? 'bg-rose-50/35 border-rose-100 hover:border-rose-200 hover:bg-rose-50/55' : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/60'}`}
                                                            onClick={() => handleHistoryItemClick(notif)}
                                                            onKeyDown={(event) => {
                                                                if (event.key === "Enter" || event.key === " ") {
                                                                    event.preventDefault();
                                                                    handleHistoryItemClick(notif);
                                                                }
                                                            }}
                                                        >
                                                            <div className="flex items-start gap-3">
                                                                <span className={`mt-1.5 w-2 h-2 rounded-full flex-shrink-0 ${!notif.isRead ? 'bg-rose-500 ring-4 ring-rose-100' : 'bg-slate-300'}`} />
                                                                <div className="flex-1 min-w-0">
                                                                    <div className="flex items-start gap-2">
                                                                        <p className={`flex-1 text-[13px] m-0 leading-[1.45] line-clamp-3 text-pretty ${!notif.isRead ? 'font-semibold text-slate-800' : 'font-medium text-slate-600'}`}>
                                                                            {notif.subtitle}
                                                                        </p>
                                                                        <Dropdown
                                                                            trigger={["click"]}
                                                                            placement="bottomRight"
                                                                            menu={{
                                                                                items: itemMenu,
                                                                                onClick: ({ key, domEvent }) => {
                                                                                    domEvent.stopPropagation();
                                                                                    handleNotificationMenuAction(key, notif);
                                                                                },
                                                                            }}
                                                                        >
                                                                            <button
                                                                                type="button"
                                                                                aria-label={`Tuỳ chọn cho thông báo: ${notif.subtitle}`}
                                                                                onClick={(event) => event.stopPropagation()}
                                                                                className="-mt-1 -mr-1 w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-white border border-transparent hover:border-slate-200 transition-colors cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-rose-200"
                                                                            >
                                                                                <MoreOutlined />
                                                                            </button>
                                                                        </Dropdown>
                                                                    </div>
                                                                    <div className="flex items-center justify-between gap-3 mt-2">
                                                                        <p className={`text-[9.5px] font-bold m-0 uppercase tracking-[0.08em] truncate ${!notif.isRead ? 'text-rose-500' : 'text-slate-400'}`}>
                                                                            {notif.title}
                                                                        </p>
                                                                        {notif.createdAt && (
                                                                            <time className="text-[10.5px] text-slate-400 font-medium whitespace-nowrap" dateTime={notif.createdAt}>
                                                                                {dayjs(notif.createdAt).fromNow()}
                                                                            </time>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </article>
                                                    );
                                                })}
                                            </div>
                                        </section>
                                    );
                                })
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Footer */}
            {!isListEmpty && (
                <div className="px-4 py-3 bg-white border-t border-slate-100">
                    <button
                        onClick={onOpenFullCenter}
                        className="w-full py-2 bg-slate-50 border border-slate-200 rounded-[10px] text-[12px] font-semibold text-slate-600 hover:text-rose-600 hover:border-rose-100 hover:bg-rose-50/50 transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-rose-200"
                    >
                        Mở trung tâm thông báo
                    </button>
                </div>
            )}
        </div>
    );
};

export default NotificationGrid;
