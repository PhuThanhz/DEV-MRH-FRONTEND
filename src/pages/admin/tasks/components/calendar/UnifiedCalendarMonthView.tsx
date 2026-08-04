import React, { useCallback } from "react";
import { Calendar } from "antd";
import { FireOutlined } from "@ant-design/icons";
import type { Dayjs } from "dayjs";
import type { IUnifiedCalendarEventDTO } from "@/types/backend";
import {
    CALENDAR_PRIORITY_MAP,
    getCalendarEventTime,
} from "./unifiedCalendarMeta";
import { UnifiedCalendarEventPopover } from "./UnifiedCalendarEventPopover";

interface Props {
    selectedDate: Dayjs;
    eventsByDate: Map<string, IUnifiedCalendarEventDTO[]>;
    eventsByMonth: Map<string, number>;
    onChange: (date: Dayjs) => void;
    onSelectEvent: (event: IUnifiedCalendarEventDTO) => void;
    onShowEvents: (
        date: Dayjs,
        events: IUnifiedCalendarEventDTO[]
    ) => void;
}

export const UnifiedCalendarMonthView: React.FC<Props> = React.memo(
    ({
        selectedDate,
        eventsByDate,
        eventsByMonth,
        onChange,
        onSelectEvent,
        onShowEvents,
    }) => {
        const cellRender = useCallback(
            (current: Dayjs, info: { type: string }) => {
                if (info.type === "month") {
                    const count =
                        eventsByMonth.get(current.format("YYYY-MM")) ?? 0;
                    return count > 0 ? (
                        <span className="unified-calendar-month-count">
                            {count} hoạt động
                        </span>
                    ) : null;
                }

                if (info.type !== "date") return null;
                const dayEvents =
                    eventsByDate.get(current.format("YYYY-MM-DD")) ?? [];
                if (dayEvents.length === 0) return null;

                const visibleEvents = dayEvents.slice(0, 3);
                const hiddenCount = dayEvents.length - visibleEvents.length;

                return (
                    <ul className="unified-calendar-events">
                        {visibleEvents.map((event) => {
                            const eventTime = getCalendarEventTime(event);
                            const isUrgent = event.priority === "URGENT";
                            const priority = CALENDAR_PRIORITY_MAP.get(
                                event.priority || "MEDIUM"
                            );

                            return (
                                <li key={event.id}>
                                    <UnifiedCalendarEventPopover event={event}>
                                        <button
                                            type="button"
                                            className={`unified-calendar-event ${isUrgent ? "is-urgent" : ""}`}
                                            data-module={event.module}
                                            data-priority={
                                                event.priority || "MEDIUM"
                                            }
                                            onClick={(clickEvent) => {
                                                clickEvent.stopPropagation();
                                                onSelectEvent(event);
                                            }}
                                        >
                                            <span
                                                className="unified-calendar-event__priority-bar"
                                                style={{
                                                    backgroundColor:
                                                        priority?.color ||
                                                        "#1890ff",
                                                }}
                                            />
                                            {isUrgent ? (
                                                <FireOutlined className="unified-urgent-icon" />
                                            ) : null}
                                            <span className="unified-calendar-event__title">
                                                {event.title}
                                            </span>
                                            {eventTime !== "00:00" ? (
                                                <time>{eventTime}</time>
                                            ) : null}
                                        </button>
                                    </UnifiedCalendarEventPopover>
                                </li>
                            );
                        })}
                        {hiddenCount > 0 ? (
                            <li>
                                <button
                                    type="button"
                                    className="unified-calendar-events__more"
                                    onClick={(clickEvent) => {
                                        clickEvent.stopPropagation();
                                        onShowEvents(current, dayEvents);
                                    }}
                                >
                                    +{hiddenCount} hoạt động
                                </button>
                            </li>
                        ) : null}
                    </ul>
                );
            },
            [eventsByDate, eventsByMonth, onSelectEvent, onShowEvents]
        );

        return (
            <Calendar
                className="unified-calendar"
                value={selectedDate}
                mode="month"
                onChange={onChange}
                onPanelChange={onChange}
                cellRender={cellRender}
                headerRender={() => null}
            />
        );
    }
);

UnifiedCalendarMonthView.displayName = "UnifiedCalendarMonthView";

