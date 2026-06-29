import React, { useEffect, useMemo, useRef, useState } from "react";
import { Empty, Input, Modal, Tag, Tooltip } from "antd";
import { SearchOutlined, StarFilled, StarOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { useQuickAccess } from "@/hooks/useQuickAccess";
import { getModalWidth } from "@/utils/responsive";
import type { QuickAccessItem } from "@/config/quickAccess";

interface CommandPaletteProps {
    open: boolean;
    onClose: () => void;
}

const CommandPalette: React.FC<CommandPaletteProps> = ({ open, onClose }) => {
    const navigate = useNavigate();
    const inputRef = useRef<any>(null);
    const {
        query,
        setQuery,
        searchResults,
        recentItems,
        favoriteItems,
        isFavorite,
        toggleFavorite,
    } = useQuickAccess();
    const [activeIndex, setActiveIndex] = useState(0);

    const displayedItems = useMemo(() => {
        if (query.trim()) return searchResults.slice(0, 12);
        const pinnedIds = new Set<string>();
        const merged: QuickAccessItem[] = [];
        favoriteItems.forEach((item) => {
            pinnedIds.add(item.id);
            merged.push(item);
        });
        recentItems.forEach((item) => {
            if (!pinnedIds.has(item.id)) merged.push(item);
        });
        return merged.length ? merged.slice(0, 12) : searchResults.slice(0, 8);
    }, [favoriteItems, query, recentItems, searchResults]);

    useEffect(() => {
        if (!open) return;
        setActiveIndex(0);
        window.setTimeout(() => inputRef.current?.focus?.(), 40);
    }, [open]);

    const goTo = (item: QuickAccessItem) => {
        navigate(item.path);
        onClose();
    };

    const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.key === "ArrowDown") {
            event.preventDefault();
            setActiveIndex((index) => Math.min(displayedItems.length - 1, index + 1));
        }
        if (event.key === "ArrowUp") {
            event.preventDefault();
            setActiveIndex((index) => Math.max(0, index - 1));
        }
        if (event.key === "Enter" && displayedItems[activeIndex]) {
            event.preventDefault();
            goTo(displayedItems[activeIndex]);
        }
    };

    return (
        <Modal
            open={open}
            onCancel={onClose}
            footer={null}
            width={getModalWidth(640)}
            centered
            closeIcon={null}
            styles={{
                content: { padding: 0, overflow: "hidden", borderRadius: 18 },
                body: { padding: 0 },
            }}
        >
            <div className="bg-white">
                <div className="px-5 pt-5 pb-4 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-[12px] bg-pink-50 text-pink-600 flex items-center justify-center">
                            <SearchOutlined style={{ fontSize: 18 }} />
                        </div>
                        <Input
                            ref={inputRef}
                            value={query}
                            onChange={(event) => setQuery(event.target.value)}
                            onKeyDown={handleKeyDown}
                            variant="borderless"
                            placeholder="Tìm nhân viên, phòng ban, văn bản, quy trình..."
                            className="text-[16px] font-semibold"
                            style={{ padding: 0 }}
                        />
                        <Tag className="m-0 rounded-md text-gray-500 border-gray-200">Esc</Tag>
                    </div>
                </div>

                <div className="px-3 py-3 max-h-[430px] overflow-y-auto">
                    {!query.trim() && (
                        <div className="px-2 pb-2 flex items-center gap-2">
                            {favoriteItems.length > 0 && (
                                <span className="text-[11px] font-bold uppercase tracking-wider text-pink-500">
                                    Ghim nhanh
                                </span>
                            )}
                            {recentItems.length > 0 && (
                                <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                                    Gần đây
                                </span>
                            )}
                        </div>
                    )}

                    {displayedItems.length === 0 ? (
                        <div className="py-12">
                            <Empty
                                image={Empty.PRESENTED_IMAGE_SIMPLE}
                                description={<span className="text-gray-500">Không tìm thấy lối tắt phù hợp</span>}
                            />
                        </div>
                    ) : (
                        <div className="flex flex-col gap-1">
                            {displayedItems.map((item, index) => {
                                const active = index === activeIndex;
                                return (
                                    <div
                                        key={item.id}
                                        onMouseEnter={() => setActiveIndex(index)}
                                        onClick={() => goTo(item)}
                                        className={`group flex items-center gap-3 px-3 py-3 rounded-[12px] cursor-pointer transition-all ${active ? "bg-pink-50/80" : "hover:bg-gray-50"
                                            }`}
                                    >
                                        <div className={`w-10 h-10 rounded-[12px] flex items-center justify-center ${active ? "bg-white text-pink-600 shadow-sm" : "bg-gray-50 text-gray-500"
                                            }`}>
                                            {item.icon}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <span className="text-[14px] font-bold text-gray-900 truncate">
                                                    {item.title}
                                                </span>
                                                <Tag className="m-0 rounded-md border-pink-100 bg-pink-50 text-pink-600 text-[10px]">
                                                    {item.module}
                                                </Tag>
                                            </div>
                                            <div className="text-[12px] text-gray-500 truncate mt-0.5">
                                                {item.subtitle}
                                            </div>
                                        </div>
                                        <Tooltip title={isFavorite(item.id) ? "Bỏ ghim" : "Ghim nhanh"}>
                                            <button
                                                onClick={(event) => {
                                                    event.stopPropagation();
                                                    toggleFavorite(item);
                                                }}
                                                className="w-8 h-8 rounded-full border-none bg-transparent text-gray-300 hover:text-pink-500 hover:bg-white cursor-pointer transition-colors"
                                            >
                                                {isFavorite(item.id) ? <StarFilled /> : <StarOutlined />}
                                            </button>
                                        </Tooltip>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                <div className="px-5 py-3 border-t border-gray-100 bg-gray-50 flex items-center justify-between text-[12px] text-gray-500">
                    <span>Dùng ↑ ↓ để chọn, Enter để mở</span>
                    <span>Cmd/Ctrl + K</span>
                </div>
            </div>
        </Modal>
    );
};

export default CommandPalette;
