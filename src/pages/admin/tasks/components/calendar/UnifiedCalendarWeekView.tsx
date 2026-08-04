import React, { useEffect, useMemo, useRef } from "react";
import type { Dayjs } from "dayjs";
import dayjs from "dayjs";
import type { IUnifiedCalendarEventDTO } from "@/types/backend";
import {
    CALENDAR_PRIORITY_MAP,
    getCalendarEventTime,
    getWeekStart,
} from "./unifiedCalendarMeta";
import { UnifiedCalendarEventPopover } from "./UnifiedCalendarEventPopover";

interface Props {
    selectedDate: Dayjs;
    eventsByDate: Map<string, IUnifiedCalendarEventDTO[]>;
    onSelectDate: (date: Dayjs) => void;
    onSelectEvent: (event: IUnifiedCalendarEventDTO) => void;
}

const HOUR_HEIGHT = 52; // Height in px for each 1-hour row
const HOURS = Array.from({ length: 24 }, (_, i) => i);

const DAY_NAMES_VI = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];

export const UnifiedCalendarWeekView: React.FC<Props> = React.memo(
    ({ selectedDate, eventsByDate, onSelectDate, onSelectEvent }) => {
        const scrollContainerRef = useRef<HTMLDivElement>(null);

        const weekDays = useMemo(() => {
            const weekStart = getWeekStart(selectedDate);
            return Array.from({ length: 7 }, (_, index) => weekStart.add(index, "day"));
        }, [selectedDate]);

        // Auto-scroll to ~07:30 on mount
        useEffect(() => {
            if (scrollContainerRef.current) {
                scrollContainerRef.current.scrollTop = 7.5 * HOUR_HEIGHT;
            }
        }, [selectedDate]);

        // Month title label for top-left (e.g. "tháng 8")
        const monthLabel = `tháng ${selectedDate.month() + 1}`;

        return (
            <section className="lark-week-view" aria-label="Lịch công việc theo tuần">
                {/* Top Header Bar */}
                <div className="lark-week-header-bar">
                    <span className="lark-week-month-title">{monthLabel}</span>
                </div>

                {/* 2D Scrollable Timeline Grid Container */}
                <div className="lark-week-grid-container" ref={scrollContainerRef}>
                    {/* Days Column Headers - Sticky inside scroll container for pixel-perfect alignment */}
                    <div className="lark-week-days-header">
                        <div className="lark-week-time-header-cell" />
                        {weekDays.map((date) => {
                            const dateKey = date.format("YYYY-MM-DD");
                            const dayNum = date.date();
                            const dayName = DAY_NAMES_VI[date.day()];
                            const isSelected = date.isSame(selectedDate, "day");
                            const isToday = date.isSame(dayjs(), "day");

                            let badgeClass = "";
                            if (isToday) {
                                badgeClass = "badge-today";
                            } else if (isSelected) {
                                badgeClass = "badge-selected";
                            }

                            return (
                                <button
                                    type="button"
                                    key={dateKey}
                                    className={`lark-week-day-header-cell ${isSelected ? "is-selected" : ""} ${isToday ? "is-today" : ""}`}
                                    onClick={() => onSelectDate(date)}
                                >
                                    <span className="lark-week-day-name">{dayName}</span>
                                    <span className={`lark-week-day-badge ${badgeClass}`}>
                                        {dayNum}
                                    </span>
                                </button>
                            );
                        })}
                    </div>

                    <div className="lark-week-grid-body" style={{ height: `${24 * HOUR_HEIGHT}px` }}>
                        {/* Time labels column on left */}
                        <div className="lark-week-time-column">
                            {HOURS.map((hour) => (
                                <div
                                    key={hour}
                                    className="lark-week-time-label"
                                    style={{ top: `${hour * HOUR_HEIGHT}px` }}
                                >
                                    {hour}:00
                                </div>
                            ))}
                        </div>

                        {/* 7 Day columns */}
                        <div className="lark-week-columns">
                            {/* Horizontal hour lines background */}
                            <div className="lark-week-grid-lines">
                                {HOURS.map((hour) => (
                                    <div
                                        key={hour}
                                        className="lark-week-hour-line"
                                        style={{ top: `${hour * HOUR_HEIGHT}px` }}
                                    />
                                ))}
                            </div>

                            {/* Columns per day */}
                            {weekDays.map((date) => {
                                const dateKey = date.format("YYYY-MM-DD");
                                const dayEvents = eventsByDate.get(dateKey) ?? [];
                                const isSelected = date.isSame(selectedDate, "day");

                                return (
                                    <div
                                        key={dateKey}
                                        className={`lark-week-day-column ${isSelected ? "is-column-active" : ""}`}
                                    >
                                        {dayEvents.map((event) => {
                                            const eventDateObj = dayjs(event.eventDate || event.dueDate);
                                            const startHour = eventDateObj.hour() + eventDateObj.minute() / 60;
                                            const timeStr = getCalendarEventTime(event);
                                            const priorityMeta = CALENDAR_PRIORITY_MAP.get(event.priority || "MEDIUM");

                                            // Determine background color
                                            let bgStyle = "#84cc16"; // Bright lime green default
                                            if (event.priority === "URGENT") {
                                                bgStyle = "#ef4444"; // Red
                                            } else if (event.priority === "HIGH") {
                                                bgStyle = "#fa8c16"; // Orange
                                            } else if (event.priority === "LOW") {
                                                bgStyle = "#10b981"; // Emerald
                                            } else if (event.priority === "MEDIUM") {
                                                bgStyle = priorityMeta?.color || "#84cc16";
                                            }

                                            // Height & top math
                                            const topPx = startHour * HOUR_HEIGHT;
                                            const durationHours = 1.25; // Default block span
                                            const heightPx = Math.max(durationHours * HOUR_HEIGHT, 42);

                                            return (
                                                <UnifiedCalendarEventPopover key={event.id} event={event}>
                                                    <button
                                                        type="button"
                                                        className="lark-week-event-card"
                                                        style={{
                                                            top: `${topPx}px`,
                                                            height: `${heightPx}px`,
                                                            backgroundColor: bgStyle,
                                                        }}
                                                        onClick={(clickEvt) => {
                                                            clickEvt.stopPropagation();
                                                            onSelectEvent(event);
                                                        }}
                                                    >
                                                        <div className="lark-week-event-title">
                                                            {event.title}
                                                        </div>
                                                        <div className="lark-week-event-time">
                                                            {timeStr !== "00:00" ? `${timeStr}` : "Cả ngày"}
                                                        </div>
                                                    </button>
                                                </UnifiedCalendarEventPopover>
                                            );
                                        })}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </section>
        );
    }
);

UnifiedCalendarWeekView.displayName = "UnifiedCalendarWeekView";
