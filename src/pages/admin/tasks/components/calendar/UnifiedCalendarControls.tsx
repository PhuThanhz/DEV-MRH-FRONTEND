import React from "react";
import { Button, DatePicker, Segmented } from "antd";
import {
    CalendarOutlined,
    LeftOutlined,
    RightOutlined,
} from "@ant-design/icons";
import type { Dayjs } from "dayjs";
import type {
    CalendarLegendItem,
    CalendarPriorityItem,
    CalendarView,
} from "./unifiedCalendarMeta";

interface ToolbarProps {
    periodLabel: string;
    isFetching: boolean;
    view: CalendarView;
    selectedDate: Dayjs;
    onShift: (direction: -1 | 1) => void;
    onToday: () => void;
    onViewChange: (view: CalendarView) => void;
    onSelectYear: (date: Dayjs) => void;
}

export const UnifiedCalendarToolbar: React.FC<ToolbarProps> = React.memo(
    ({
        periodLabel,
        isFetching,
        view,
        selectedDate,
        onShift,
        onToday,
        onViewChange,
        onSelectYear,
    }) => (
        <header className="unified-calendar-toolbar">
            <div className="unified-calendar-toolbar__period">
                <CalendarOutlined />
                <div>
                    <span>Lịch làm việc</span>
                    <strong>{periodLabel}</strong>
                </div>
                {isFetching ? (
                    <span className="unified-calendar-loading">
                        Đang tải…
                    </span>
                ) : null}
            </div>

            <div className="unified-calendar-toolbar__actions">
                <div className="unified-calendar-navigation">
                    <Button
                        type="text"
                        icon={<LeftOutlined />}
                        aria-label="Khoảng thời gian trước"
                        onClick={() => onShift(-1)}
                    />
                    <Button
                        className="unified-calendar-today-button"
                        onClick={onToday}
                    >
                        Hôm nay
                    </Button>
                    <Button
                        type="text"
                        icon={<RightOutlined />}
                        aria-label="Khoảng thời gian tiếp theo"
                        onClick={() => onShift(1)}
                    />
                    {view === "year" ? (
                        <DatePicker
                            className="unified-calendar-year-picker"
                            picker="year"
                            value={selectedDate}
                            allowClear={false}
                            onChange={(date) => date && onSelectYear(date)}
                            aria-label="Chọn năm"
                        />
                    ) : null}
                </div>
                <Segmented
                    className="unified-calendar-mode"
                    value={view}
                    options={[
                        { label: "Ngày", value: "day" },
                        { label: "Tuần", value: "week" },
                        { label: "Tháng", value: "month" },
                        { label: "Năm", value: "year" },
                    ]}
                    onChange={(nextView) =>
                        onViewChange(nextView as CalendarView)
                    }
                />
            </div>
        </header>
    )
);

UnifiedCalendarToolbar.displayName = "UnifiedCalendarToolbar";

interface FilterProps {
    modules: CalendarLegendItem[];
    priorities: CalendarPriorityItem[];
    activeModules: string[];
    activePriorities: string[];
    onToggleModule: (key: string) => void;
    onTogglePriority: (key: string) => void;
    onClear: () => void;
}

export const UnifiedCalendarFilters: React.FC<FilterProps> = React.memo(
    ({
        modules,
        priorities,
        activeModules,
        activePriorities,
        onToggleModule,
        onTogglePriority,
        onClear,
    }) => {
        const hasFilters =
            activeModules.length > 0 || activePriorities.length > 0;

        return (
            <section
                className="unified-calendar-legend"
                aria-label="Bộ lọc loại hoạt động và mức độ ưu tiên"
            >
                {modules.length > 0 ? (
                    <>
                        <div className="unified-calendar-legend__group">
                            <span className="unified-calendar-legend__label">
                                Loại công việc
                            </span>
                            <div className="unified-calendar-legend__items">
                                {modules.map((item) => {
                                    const isActive =
                                        activeModules.length === 0 ||
                                        activeModules.includes(item.key);
                                    return (
                                        <button
                                            type="button"
                                            key={item.key}
                                            className={`unified-calendar-legend__item ${isActive ? "is-active" : ""}`}
                                            data-module={item.key}
                                            aria-pressed={isActive}
                                            onClick={() =>
                                                onToggleModule(item.key)
                                            }
                                        >
                                            <i />
                                            <span>{item.label}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                        <div className="unified-calendar-legend__divider" />
                    </>
                ) : null}

                <div className="unified-calendar-legend__group">
                    <span className="unified-calendar-legend__label">
                        Mức độ khẩn cấp
                    </span>
                    <div className="unified-calendar-legend__items">
                        {priorities.map((priority) => {
                            const isActive =
                                activePriorities.length === 0 ||
                                activePriorities.includes(priority.key);
                            return (
                                <button
                                    type="button"
                                    key={priority.key}
                                    className={`unified-calendar-legend__priority-item ${isActive ? "is-active" : ""}`}
                                    aria-pressed={isActive}
                                    onClick={() =>
                                        onTogglePriority(priority.key)
                                    }
                                >
                                    <i
                                        style={{
                                            backgroundColor: priority.color,
                                        }}
                                    />
                                    <span>{priority.label}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {hasFilters ? (
                    <Button
                        type="text"
                        size="small"
                        className="unified-calendar-filter-reset"
                        onClick={onClear}
                    >
                        Xóa lọc
                    </Button>
                ) : null}
            </section>
        );
    }
);

UnifiedCalendarFilters.displayName = "UnifiedCalendarFilters";

