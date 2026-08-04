import React, { useMemo } from "react";
import { Tag } from "antd";
import type { Dayjs } from "dayjs";
import dayjs from "dayjs";
import type { IUnifiedCalendarEventDTO } from "@/types/backend";

interface Props {
    selectedDate: Dayjs;
    eventsByDate: Map<string, IUnifiedCalendarEventDTO[]>;
    eventsByMonth: Map<string, number>;
    onSelectMonth: (date: Dayjs) => void;
}

export const UnifiedCalendarYearView: React.FC<Props> = React.memo(
    ({ selectedDate, eventsByDate, eventsByMonth, onSelectMonth }) => {
        const months = useMemo(
            () =>
                Array.from({ length: 12 }, (_, monthIndex) =>
                    dayjs().year(selectedDate.year()).month(monthIndex)
                ),
            [selectedDate]
        );
        const today = dayjs();

        return (
            <div className="unified-year-grid">
                {months.map((monthDate) => {
                    const monthIndex = monthDate.month();
                    const monthKey = monthDate.format("YYYY-MM");
                    const count = eventsByMonth.get(monthKey) ?? 0;
                    const isCurrentMonth = today.isSame(monthDate, "month");
                    const isSelectedMonth =
                        !isCurrentMonth && selectedDate.month() === monthIndex;
                    const daysInMonth = monthDate.daysInMonth();
                    const firstDayOfWeek =
                        (monthDate.startOf("month").day() + 6) % 7;

                    return (
                        <button
                            type="button"
                            key={monthKey}
                            className={`unified-year-card ${isCurrentMonth ? "is-current" : ""} ${isSelectedMonth ? "is-selected" : ""}`}
                            onClick={() => onSelectMonth(monthDate)}
                            aria-label={`Xem tháng ${monthIndex + 1}, có ${count} hoạt động`}
                        >
                            <span className="unified-year-card__header">
                                <span className="unified-year-card__title">
                                    Tháng {monthIndex + 1}
                                </span>
                                {count > 0 ? (
                                    <Tag
                                        className="unified-year-card__badge"
                                        color={isCurrentMonth ? "magenta" : "blue"}
                                    >
                                        {count} hoạt động
                                    </Tag>
                                ) : (
                                    <span className="unified-year-card__empty-tag">
                                        Chưa có HĐ
                                    </span>
                                )}
                            </span>

                            <span className="unified-year-card__mini-weekdays" aria-hidden="true">
                                <span>T2</span>
                                <span>T3</span>
                                <span>T4</span>
                                <span>T5</span>
                                <span>T6</span>
                                <span>T7</span>
                                <span>CN</span>
                            </span>

                            <span className="unified-year-card__mini-days" aria-hidden="true">
                                {Array.from({ length: firstDayOfWeek }).map((_, index) => (
                                    <span key={`empty-${index}`} className="mini-day empty" />
                                ))}
                                {Array.from({ length: daysInMonth }).map((_, index) => {
                                    const dayNumber = index + 1;
                                    const dateKey = `${monthKey}-${String(dayNumber).padStart(2, "0")}`;
                                    const dayEvents = eventsByDate.get(dateKey) ?? [];
                                    const hasEvents = dayEvents.length > 0;
                                    const hasUrgent = dayEvents.some(
                                        (event) => event.priority === "URGENT"
                                    );
                                    const isToday = today.isSame(
                                        monthDate.date(dayNumber),
                                        "day"
                                    );

                                    return (
                                        <span
                                            key={dayNumber}
                                            className={`mini-day ${hasEvents ? "has-events" : ""} ${hasUrgent ? "has-urgent" : ""} ${isToday ? "is-today" : ""}`}
                                        >
                                            {dayNumber}
                                            {hasEvents ? (
                                                <i className="mini-event-dot" />
                                            ) : null}
                                        </span>
                                    );
                                })}
                            </span>
                        </button>
                    );
                })}
            </div>
        );
    }
);

UnifiedCalendarYearView.displayName = "UnifiedCalendarYearView";

