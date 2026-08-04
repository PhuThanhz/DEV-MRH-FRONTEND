import React, { useState } from "react";
import {
    CheckOutlined,
    SearchOutlined,
    CloseOutlined,
    BellOutlined,
    DeleteOutlined,
    RightOutlined,
    SoundOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import "dayjs/locale/vi";

import type { UnifiedNotification } from "@/hooks/useNotifications";
import { useNotificationHistory } from "@/hooks/useNotificationHistory";
import LotusDetailDrawer from "@/components/common/drawer/LotusDetailDrawer";
import {
    ACCOUNTING_DOSSIER_NOTIFICATION_MODULES,
    DOCUMENT_NOTIFICATION_MODULES,
    PENDING_ACTION_MODULES,
    PROCEDURE_NOTIFICATION_MODULES,
} from "@/config/notificationModules";
import { resolveNotificationActionLink } from "./notificationNavigation";

dayjs.extend(relativeTime);
dayjs.locale("vi");

interface NotificationDrawerProps {
    open: boolean;
    onClose: () => void;
}

const resolveNotificationCategoryId = (module?: string) => {
    if (module === "JD_FLOW") return "jd_approval";
    if (module === "EVALUATION") return "evaluation";
    if (ACCOUNTING_DOSSIER_NOTIFICATION_MODULES.includes(module || "")) return "accounting_dossiers";
    if (PROCEDURE_NOTIFICATION_MODULES.includes(module || "")) return "procedures";
    if (module === "CAREER_PATHS") return "career_paths";
    if (DOCUMENT_NOTIFICATION_MODULES.includes(module || "")) return "documents";
    return "system_alerts";
};

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
        soundEnabled,
        toggleSound,
        loadMore,
    } = useNotificationHistory(open);
    const [searchTerm, setSearchTerm] = useState("");
    const [activeTab, setActiveTab] = useState<"all" | "unread">("all");
    const [activeCategory, setActiveCategory] = useState("all");

    const categoryStats = React.useMemo(() => (
        PENDING_ACTION_MODULES
            .map(category => {
                const categoryItems = items.filter(item => resolveNotificationCategoryId(item.module) === category.id);
                return {
                    ...category,
                    totalCount: categoryItems.length,
                    unreadCount: categoryItems.filter(item => !item.isRead).length,
                };
            })
            .filter(category => category.totalCount > 0)
    ), [items]);

    const todayCount = React.useMemo(() => (
        items.filter(item => item.createdAt && dayjs(item.createdAt).isSame(dayjs(), "day")).length
    ), [items]);

    const activeCategoryConfig = categoryStats.find(category => category.id === activeCategory);

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
    if (activeCategory !== "all") {
        filteredItems = filteredItems.filter(item => resolveNotificationCategoryId(item.module) === activeCategory);
    }
    if (searchTerm.trim()) {
        const normalizedSearchTerm = searchTerm.trim().toLocaleLowerCase("vi-VN");
        filteredItems = filteredItems.filter(i =>
            i.title?.toLocaleLowerCase("vi-VN").includes(normalizedSearchTerm) ||
            i.subtitle?.toLocaleLowerCase("vi-VN").includes(normalizedSearchTerm)
        );
    }

    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        const target = e.currentTarget;
        if (target.scrollHeight - target.scrollTop <= target.clientHeight + 80) {
            loadMore();
        }
    };

    return (
        <LotusDetailDrawer
            open={open}
            onClose={onClose}
            closeAriaLabel="Đóng trung tâm thông báo"
        >
            <div className="h-full min-h-0 flex flex-col bg-slate-50/70">
                <header className="flex-shrink-0 bg-white border-b border-slate-200/90">
                    <div className="w-full px-4 sm:px-6 lg:px-8 pt-4 pb-3.5">
                        <div className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-3 min-w-0">
                                <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600">
                                    <BellOutlined style={{ fontSize: 17 }} />
                                </div>
                                <div className="min-w-0">
                                    <div className="flex items-center gap-2">
                                        <h2 className="m-0 text-[18px] font-bold tracking-tight text-slate-900">Trung tâm thông báo</h2>
                                        {unreadCount > 0 && (
                                            <span className="h-5 min-w-5 px-1.5 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center tabular-nums">
                                                {unreadCount > 99 ? "99+" : unreadCount}
                                            </span>
                                        )}
                                    </div>
                                    <p className="m-0 mt-0.5 text-[11.5px] text-slate-500">Theo dõi các cập nhật và công việc cần bạn chú ý.</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    aria-pressed={soundEnabled}
                                    onClick={toggleSound}
                                    className="h-9 px-3 rounded-lg text-[11.5px] font-semibold flex items-center gap-1.5 border border-slate-200 bg-white text-slate-600 hover:border-rose-200 hover:text-rose-600 transition-colors cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-rose-200"
                                >
                                    <SoundOutlined />
                                    <span className="hidden sm:inline">{soundEnabled ? "Tắt âm thanh" : "Bật âm thanh"}</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={markAllRead}
                                    disabled={unreadCount === 0}
                                    className={`h-9 px-3 rounded-lg text-[11.5px] font-semibold flex items-center gap-1.5 border transition-colors outline-none focus-visible:ring-2 focus-visible:ring-rose-200 ${unreadCount > 0
                                        ? "bg-white border-slate-200 text-slate-600 hover:border-rose-200 hover:text-rose-600 cursor-pointer"
                                        : "bg-slate-50 border-slate-200 text-slate-300 cursor-not-allowed"
                                        }`}
                                >
                                    <CheckOutlined />
                                    <span className="hidden sm:inline">Đánh dấu tất cả đã đọc</span>
                                    <span className="sm:hidden">Đã đọc</span>
                                </button>
                            </div>
                        </div>

                        <div className="mt-3 flex flex-col sm:flex-row sm:items-center gap-2.5">
                            <div className="flex bg-slate-100/90 p-1 rounded-[10px] border border-slate-200/80 sm:w-[250px]">
                                <button
                                    type="button"
                                    onClick={() => setActiveTab("all")}
                                    className={`flex-1 py-1.5 px-3 rounded-md text-[12px] font-semibold transition-colors cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-rose-200 ${activeTab === "all"
                                        ? "bg-white border border-slate-200/80 text-slate-800 shadow-sm"
                                        : "border border-transparent text-slate-500 hover:text-slate-700"
                                        }`}
                                >
                                    Tất cả
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setActiveTab("unread")}
                                    className={`flex-1 py-1.5 px-3 rounded-md text-[12px] font-semibold transition-colors cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-rose-200 ${activeTab === "unread"
                                        ? "bg-white border border-slate-200/80 text-slate-800 shadow-sm"
                                        : "border border-transparent text-slate-500 hover:text-slate-700"
                                        }`}
                                >
                                    Chưa đọc
                                </button>
                            </div>

                            <div className="relative flex-1">
                                <SearchOutlined className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                <input
                                    type="search"
                                    aria-label="Tìm kiếm thông báo"
                                    placeholder="Tìm theo nội dung thông báo"
                                    value={searchTerm}
                                    onChange={(event) => setSearchTerm(event.target.value)}
                                    className="w-full h-10 bg-slate-50 border border-slate-200 rounded-[10px] pl-9 pr-9 text-[12.5px] font-medium text-slate-700 outline-none focus:bg-white focus:border-rose-300 focus:ring-[3px] focus:ring-rose-100/70 transition-all placeholder:text-slate-400"
                                />
                                {searchTerm && (
                                    <button
                                        type="button"
                                        aria-label="Xoá nội dung tìm kiếm"
                                        onClick={() => setSearchTerm("")}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:bg-white hover:text-slate-700 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-rose-200"
                                    >
                                        <CloseOutlined style={{ fontSize: 12 }} />
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </header>

                <main className="flex-1 min-h-0 overflow-y-auto custom-scrollbar" onScroll={handleScroll}>
                    <div className="w-full px-4 sm:px-6 lg:px-8 pt-4 pb-8">
                        <div className="lg:grid lg:grid-cols-[230px_minmax(0,1fr)] lg:gap-4 lg:items-start">
                            <aside className="hidden lg:block sticky top-4">
                                <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
                                    <div className="grid grid-cols-2 border-b border-slate-100">
                                        <div className="p-3 border-r border-slate-100">
                                            <span className="block text-[10px] font-medium text-slate-500">Đã tải</span>
                                            <strong className="block mt-0.5 text-[18px] leading-none font-bold text-slate-800 tabular-nums">{items.length}</strong>
                                        </div>
                                        <div className="p-3">
                                            <span className="block text-[10px] font-medium text-slate-500">Chưa đọc</span>
                                            <strong className="block mt-0.5 text-[18px] leading-none font-bold text-rose-600 tabular-nums">{unreadCount}</strong>
                                        </div>
                                    </div>
                                    <div className="px-3 py-2.5 border-b border-slate-100 flex items-center justify-between text-[10.5px]">
                                        <span className="text-slate-500">Phát sinh hôm nay</span>
                                        <span className="font-semibold text-slate-700 tabular-nums">{todayCount}</span>
                                    </div>

                                    <nav className="p-2" aria-label="Lọc thông báo theo nghiệp vụ">
                                        <p className="m-0 px-2 pt-1 pb-2 text-[9.5px] font-bold uppercase tracking-[0.12em] text-slate-400">Theo nghiệp vụ</p>
                                        <button
                                            type="button"
                                            onClick={() => setActiveCategory("all")}
                                            className={`w-full min-h-9 px-2.5 rounded-lg flex items-center gap-2 text-left transition-colors cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-rose-200 ${activeCategory === "all" ? "bg-rose-50 text-rose-700" : "text-slate-600 hover:bg-slate-50"}`}
                                        >
                                            <span className={`w-1.5 h-1.5 rounded-full ${activeCategory === "all" ? "bg-rose-500" : "bg-slate-300"}`} />
                                            <span className="flex-1 text-[11.5px] font-semibold">Tất cả thông báo</span>
                                            <span className="text-[10px] font-semibold tabular-nums">{items.length}</span>
                                        </button>
                                        {categoryStats.map(category => (
                                            <button
                                                key={category.id}
                                                type="button"
                                                onClick={() => setActiveCategory(category.id)}
                                                className={`mt-1 w-full min-h-10 px-2 rounded-lg flex items-center gap-2 text-left transition-colors cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-rose-200 ${activeCategory === category.id ? "bg-rose-50 text-rose-700" : "text-slate-600 hover:bg-slate-50"}`}
                                            >
                                                <span className={`w-7 h-7 flex-shrink-0 rounded-lg border flex items-center justify-center [&_.anticon]:text-[13px] ${activeCategory === category.id ? "border-rose-100 bg-white text-rose-600" : "border-slate-200 bg-slate-50 text-slate-500"}`}>
                                                    {category.icon}
                                                </span>
                                                <span className="flex-1 min-w-0 text-[11px] font-medium leading-tight line-clamp-2">{category.label}</span>
                                                <span className={`min-w-5 h-5 px-1 rounded-full flex items-center justify-center text-[9.5px] font-bold tabular-nums ${category.unreadCount > 0 ? "bg-rose-500 text-white" : "bg-slate-100 text-slate-500"}`}>
                                                    {category.unreadCount > 0 ? category.unreadCount : category.totalCount}
                                                </span>
                                            </button>
                                        ))}
                                    </nav>
                                </div>
                            </aside>

                            <section className="min-w-0">
                                <nav className="lg:hidden -mx-1 mb-3 px-1 flex gap-2 overflow-x-auto custom-scrollbar" aria-label="Lọc thông báo theo nghiệp vụ">
                                    <button
                                        type="button"
                                        onClick={() => setActiveCategory("all")}
                                        className={`h-8 flex-shrink-0 px-3 rounded-lg border text-[11px] font-semibold cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-rose-200 ${activeCategory === "all" ? "border-rose-200 bg-rose-50 text-rose-600" : "border-slate-200 bg-white text-slate-600"}`}
                                    >
                                        Tất cả
                                    </button>
                                    {categoryStats.map(category => (
                                        <button
                                            key={category.id}
                                            type="button"
                                            onClick={() => setActiveCategory(category.id)}
                                            className={`h-8 flex-shrink-0 px-3 rounded-lg border text-[11px] font-semibold cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-rose-200 ${activeCategory === category.id ? "border-rose-200 bg-rose-50 text-rose-600" : "border-slate-200 bg-white text-slate-600"}`}
                                        >
                                            {category.label}
                                            {category.unreadCount > 0 && <span className="ml-1.5 text-rose-500 tabular-nums">{category.unreadCount}</span>}
                                        </button>
                                    ))}
                                </nav>

                                <div className="flex items-center justify-between gap-4 mb-2.5">
                                    <div>
                                        <h3 className="m-0 text-[13px] font-semibold text-slate-800">
                                            {activeCategoryConfig?.label ?? (activeTab === "unread" ? "Thông báo chưa đọc" : "Cập nhật gần đây")}
                                        </h3>
                                        {!isLoading && (
                                            <p className="m-0 mt-0.5 text-[10.5px] text-slate-500">Đang hiển thị {filteredItems.length} thông báo</p>
                                        )}
                                    </div>
                                </div>

                                {isLoading ? (
                                    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white" aria-label="Đang tải thông báo">
                                        {[1, 2, 3, 4].map((item) => (
                                            <div key={item} className="min-h-[86px] px-4 py-3.5 flex gap-3 border-b border-slate-100 last:border-b-0 animate-pulse">
                                                <span className="w-9 h-9 rounded-[10px] bg-slate-100 flex-shrink-0" />
                                                <span className="flex-1 space-y-2.5 pt-0.5">
                                                    <span className="block w-1/3 h-2.5 rounded bg-slate-200" />
                                                    <span className="block w-4/5 h-2.5 rounded bg-slate-100" />
                                                    <span className="block w-1/5 h-2 rounded bg-slate-100" />
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                ) : filteredItems.length > 0 ? (
                                    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_12px_30px_-26px_rgba(15,23,42,0.35)]">
                                        {filteredItems.map((item) => {
                                            const isSystem = item.title === "Thông báo hệ thống";
                                            const displayTitle = isSystem ? "Hệ thống Lotus HRM" : item.title;
                                            const itemCategory = PENDING_ACTION_MODULES.find(category => category.id === resolveNotificationCategoryId(item.module));

                                            return (
                                                <article
                                                    key={item.id}
                                                    role="button"
                                                    tabIndex={0}
                                                    onClick={() => handleItemClick(item)}
                                                    onKeyDown={(event) => {
                                                        if (event.key === "Enter" || event.key === " ") {
                                                            event.preventDefault();
                                                            handleItemClick(item);
                                                        }
                                                    }}
                                                    className={`group relative px-4 py-3.5 flex gap-3 border-b border-slate-100 last:border-b-0 transition-colors cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-rose-200 ${!item.isRead ? "bg-rose-50/25 hover:bg-rose-50/45" : "bg-white hover:bg-slate-50/80"}`}
                                                >
                                                    {!item.isRead && <span className="absolute left-0 top-4 bottom-4 w-[3px] rounded-r-full bg-rose-500" />}
                                                    <div className={`w-9 h-9 flex-shrink-0 rounded-[10px] border flex items-center justify-center [&_.anticon]:text-[15px] ${item.isRead ? "border-slate-200 bg-slate-50 text-slate-500" : "border-rose-100 bg-rose-50 text-rose-600"}`}>
                                                        {itemCategory?.icon ?? (isSystem ? "LT" : displayTitle.slice(0, 1).toLocaleUpperCase("vi-VN"))}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-start gap-3">
                                                            <h4 className={`flex-1 min-w-0 m-0 text-[13px] leading-snug truncate ${!item.isRead ? "font-semibold text-slate-800" : "font-medium text-slate-700"}`}>
                                                                {displayTitle}
                                                            </h4>
                                                            <div className="flex-shrink-0 flex items-center gap-1">
                                                                {item.createdAt && (
                                                                    <time className="text-[10.5px] text-slate-500 font-medium tabular-nums whitespace-nowrap" dateTime={item.createdAt} title={dayjs(item.createdAt).format("DD/MM/YYYY, HH:mm")}>
                                                                        {dayjs(item.createdAt).fromNow()}
                                                                    </time>
                                                                )}
                                                                {item.type === "app" && (
                                                                    <button
                                                                        type="button"
                                                                        title="Xoá thông báo"
                                                                        aria-label="Xoá thông báo"
                                                                        className="-mt-1 -mr-1 w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-rose-600 hover:bg-white border border-transparent hover:border-rose-100 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-rose-200"
                                                                        onClick={(event) => {
                                                                            event.stopPropagation();
                                                                            deleteOne(item);
                                                                        }}
                                                                    >
                                                                        <DeleteOutlined style={{ fontSize: 13 }} />
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <p className={`m-0 mt-1 text-[12px] leading-relaxed whitespace-pre-line line-clamp-2 text-pretty ${!item.isRead ? "text-slate-700" : "text-slate-600"}`}>
                                                            {item.subtitle}
                                                        </p>
                                                        <div className="mt-2 flex items-center gap-3 min-h-5">
                                                            {item.actionLink && (
                                                                <span className="inline-flex items-center gap-1 text-[10.5px] font-semibold text-rose-600 group-hover:text-rose-700">
                                                                    Xem chi tiết
                                                                    <RightOutlined className="text-[8px] transition-transform group-hover:translate-x-0.5" />
                                                                </span>
                                                            )}
                                                            {!item.isRead && (
                                                                <button
                                                                    type="button"
                                                                    className="text-[10.5px] font-medium text-slate-500 hover:text-slate-800 cursor-pointer outline-none rounded focus-visible:ring-2 focus-visible:ring-slate-200"
                                                                    onClick={(event) => {
                                                                        event.stopPropagation();
                                                                        markOneRead(item);
                                                                    }}
                                                                >
                                                                    Đánh dấu đã đọc
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                </article>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div className="py-12 px-6 rounded-xl border border-slate-200 bg-white text-center">
                                        <div className="w-11 h-11 mx-auto rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center">
                                            <CheckOutlined style={{ fontSize: 17 }} />
                                        </div>
                                        <p className="m-0 mt-3 text-[13px] font-semibold text-slate-700">
                                            {searchTerm ? "Không tìm thấy thông báo phù hợp" : activeTab === "unread" ? "Bạn đã đọc hết thông báo" : "Không có thông báo trong nghiệp vụ này"}
                                        </p>
                                        <p className="m-0 mt-1 text-[11px] text-slate-500">
                                            {searchTerm ? "Thử tìm bằng từ khoá khác." : "Bạn có thể chọn một nhóm nghiệp vụ khác để tiếp tục."}
                                        </p>
                                        {(searchTerm || activeTab === "unread" || activeCategory !== "all") && (
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setSearchTerm("");
                                                    setActiveTab("all");
                                                    setActiveCategory("all");
                                                }}
                                                className="mt-3 px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-[11px] font-semibold text-slate-600 hover:bg-white hover:border-rose-200 hover:text-rose-600 transition-colors cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-rose-200"
                                            >
                                                Xem tất cả thông báo
                                            </button>
                                        )}
                                    </div>
                                )}

                                {hasMore && filteredItems.length > 0 && (
                                    <div className="flex justify-center pt-4">
                                        <button
                                            type="button"
                                            onClick={loadMore}
                                            disabled={isLoadingMore}
                                            className="h-9 px-4 rounded-lg border border-slate-200 bg-white text-[11.5px] font-semibold text-slate-600 hover:text-rose-600 hover:border-rose-200 disabled:text-slate-400 disabled:cursor-not-allowed transition-colors cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-rose-200"
                                        >
                                            {isLoadingMore ? "Đang tải..." : "Tải thêm thông báo"}
                                        </button>
                                    </div>
                                )}
                            </section>
                        </div>
                    </div>
                </main>
            </div>
        </LotusDetailDrawer>
    );
};

export default NotificationDrawer;
