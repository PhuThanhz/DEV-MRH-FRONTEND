import React, { useMemo } from "react";
import type { Dayjs } from "dayjs";
import dayjs from "dayjs";
import type { IUnifiedCalendarEventDTO } from "@/types/backend";
import {
    getCalendarEventLabel,
    getCalendarEventTime,
    getCalendarPriorityColor,
} from "./unifiedCalendarMeta";
import { UnifiedCalendarEventPopover } from "./UnifiedCalendarEventPopover";

const DAY_START_HOUR = 6;
const DAY_END_HOUR = 22;
const DAY_HOURS = Array.from(
    { length: DAY_END_HOUR - DAY_START_HOUR + 1 },
    (_, index) => DAY_START_HOUR + index
);

interface Props {
    selectedDate: Dayjs;
    periodLabel: string;
    events: IUnifiedCalendarEventDTO[];
    onSelectEvent: (event: IUnifiedCalendarEventDTO) => void;
    onShowEvents: (
        date: Dayjs,
        events: IUnifiedCalendarEventDTO[]
    ) => void;
}

export const UnifiedCalendarDayView: React.FC<Props> = React.memo(
    ({ selectedDate, periodLabel, events, onSelectEvent, onShowEvents }) => {
        const now = dayjs();
        const showCurrentTime =
            selectedDate.isSame(now, "day") &&
            now.hour() >= DAY_START_HOUR &&
            now.hour() <= DAY_END_HOUR;
        const currentTimeOffset =
            ((now.hour() - DAY_START_HOUR) * 60 + now.minute()) / 60;

        const { outsideEvents, eventsByHour } = useMemo(() => {
            const outside: IUnifiedCalendarEventDTO[] = [];
            const grouped = new Map<number, IUnifiedCalendarEventDTO[]>();

            events.forEach((event) => {
                const eventTime = dayjs(event.eventDate || event.dueDate);
                const hour = eventTime.hour();
                if (
                    getCalendarEventTime(event) === "00:00" ||
                    hour < DAY_START_HOUR ||
                    hour > DAY_END_HOUR
                ) {
                    outside.push(event);
                    return;
                }
                const hourEvents = grouped.get(hour) ?? [];
                hourEvents.push(event);
                grouped.set(hour, hourEvents);
            });

            return { outsideEvents: outside, eventsByHour: grouped };
        }, [events]);

        return (
            <section
                className="unified-day-view"
                aria-label={`Lịch ngày ${periodLabel}`}
            >
                <div className="unified-day-heading">
                    <div className="unified-day-heading__date">
                        <strong>{selectedDate.format("DD")}</strong>
                        <span>{selectedDate.format("[Tháng] M")}</span>
                    </div>
                    <div>
                        <h2>{selectedDate.format("dddd")}</h2>
                        <p>
                            {events.length > 0
                                ? `${events.length} hoạt động trong ngày`
                                : "Chưa có hoạt động trong ngày"}
                        </p>
                    </div>
                </div>

                <div className="unified-day-all-day">
                    <span className="unified-day-all-day__label">
                        Cả ngày / ngoài giờ
                    </span>
                    <div className="unified-day-all-day__content">
                        {outsideEvents.length > 0 ? (
                            outsideEvents.map((event) => {
                                const priorityColor = getCalendarPriorityColor(event.priority);
                                return (
                                    <UnifiedCalendarEventPopover
                                        key={event.id}
                                        event={event}
                                    >
                                        <button
                                            type="button"
                                            className="unified-day-event-card"
                                            style={{ borderLeftColor: priorityColor }}
                                            onClick={() => onSelectEvent(event)}
                                        >
                                            <div className="unified-day-event-card__header">
                                                <span
                                                    className="unified-day-event-card__dot"
                                                    style={{ backgroundColor: priorityColor }}
                                                />
                                                <span className="unified-day-event-card__title">
                                                    {event.title}
                                                </span>
                                            </div>
                                            <div className="unified-day-event-card__subtitle">
                                                {getCalendarEventLabel(event)}
                                            </div>
                                        </button>
                                    </UnifiedCalendarEventPopover>
                                );
                            })
                        ) : (
                            <span className="unified-day-all-day__empty">
                                Không có hoạt động ngoài khung giờ
                            </span>
                        )}
                    </div>
                </div>

                <div className="unified-day-timeline">
                    {showCurrentTime ? (
                        <div
                            className="unified-day-now"
                            style={
                                {
                                    "--current-hour-offset": currentTimeOffset,
                                } as React.CSSProperties
                            }
                        >
                            <span>{now.format("HH:mm")}</span>
                            <i />
                        </div>
                    ) : null}

                    {DAY_HOURS.map((hour) => {
                        const hourEvents = eventsByHour.get(hour) ?? [];
                        const visibleEvents = hourEvents.slice(0, 3);

                        return (
                            <div className="unified-day-hour" key={hour}>
                                <time>
                                    {String(hour).padStart(2, "0")}:00
                                </time>
                                <div className="unified-day-hour__track">
                                    <div className="unified-day-hour__events">
                                        {visibleEvents.map((event) => {
                                            const priorityColor = getCalendarPriorityColor(event.priority);
                                            const eventTime = getCalendarEventTime(event);
                                            const eventLabel = getCalendarEventLabel(event);

                                            return (
                                                <UnifiedCalendarEventPopover
                                                    key={event.id}
                                                    event={event}
                                                >
                                                    <button
                                                        type="button"
                                                        className="unified-day-event-card"
                                                        style={{ borderLeftColor: priorityColor }}
                                                        onClick={() =>
                                                            onSelectEvent(event)
                                                        }
                                                    >
                                                        <div className="unified-day-event-card__header">
                                                            <span
                                                                className="unified-day-event-card__dot"
                                                                style={{ backgroundColor: priorityColor }}
                                                            />
                                                            <span className="unified-day-event-card__title">
                                                                {event.title}
                                                            </span>
                                                        </div>
                                                        <div className="unified-day-event-card__subtitle">
                                                            {eventTime !== "00:00" ? `${eventTime} · ` : ""}
                                                            {eventLabel}
                                                        </div>
                                                    </button>
                                                </UnifiedCalendarEventPopover>
                                            );
                                        })}
                                        {hourEvents.length > visibleEvents.length ? (
                                            <button
                                                type="button"
                                                className="unified-day-hour__more"
                                                onClick={() =>
                                                    onShowEvents(
                                                        selectedDate,
                                                        hourEvents
                                                    )
                                                }
                                            >
                                                +
                                                {hourEvents.length -
                                                    visibleEvents.length}
                                            </button>
                                        ) : null}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </section>
        );
    }
);

UnifiedCalendarDayView.displayName = "UnifiedCalendarDayView";
