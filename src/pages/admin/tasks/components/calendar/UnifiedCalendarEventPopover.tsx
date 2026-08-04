import React from "react";
import { Popover, Tag, Typography } from "antd";
import type { IUnifiedCalendarEventDTO } from "@/types/backend";
import {
    CALENDAR_PRIORITY_MAP,
    getCalendarEventLabel,
} from "./unifiedCalendarMeta";

const { Text } = Typography;

interface Props {
    event: IUnifiedCalendarEventDTO;
    children: React.ReactElement;
}

export const UnifiedCalendarEventPopover: React.FC<Props> = React.memo(
    ({ event, children }) => {
        const priority = CALENDAR_PRIORITY_MAP.get(
            event.priority || "MEDIUM"
        );

        return (
            <Popover
                placement="topLeft"
                title={
                    <div className="unified-event-popover__header">
                        <span className="unified-event-popover__title">
                            {event.title}
                        </span>
                        {priority ? (
                            <Tag color={priority.color}>{priority.label}</Tag>
                        ) : null}
                    </div>
                }
                content={
                    <div className="unified-event-popover">
                        <div
                            className="unified-event-popover__meta"
                            data-module={event.module}
                        >
                            <span />
                            {getCalendarEventLabel(event)}
                        </div>
                        {event.description ? (
                            <p>{event.description}</p>
                        ) : (
                            <p className="is-muted">Không có mô tả bổ sung.</p>
                        )}
                        {event.module === "TASK" && event.targetId ? (
                            <Text className="unified-event-popover__hint">
                                Nhấn để xem chi tiết tác vụ
                            </Text>
                        ) : null}
                    </div>
                }
            >
                {children}
            </Popover>
        );
    }
);

UnifiedCalendarEventPopover.displayName = "UnifiedCalendarEventPopover";

