import React from "react";
import { Empty, Modal, Tag } from "antd";
import { FireOutlined } from "@ant-design/icons";
import type { Dayjs } from "dayjs";
import type { IUnifiedCalendarEventDTO } from "@/types/backend";
import {
    CALENDAR_PRIORITY_MAP,
    getCalendarEventLabel,
    getCalendarEventTime,
} from "./unifiedCalendarMeta";
import { useResponsiveModalWidth } from "@/utils/responsive";

interface Props {
    open: boolean;
    date: Dayjs | null;
    events: IUnifiedCalendarEventDTO[];
    onClose: () => void;
    onSelectEvent: (event: IUnifiedCalendarEventDTO) => void;
}

export const UnifiedCalendarEventListModal: React.FC<Props> = React.memo(
    ({ open, date, events, onClose, onSelectEvent }) => {
        const modalWidth = useResponsiveModalWidth(560);
        return (
            <Modal
                className="unified-event-list-modal"
                open={open}
                title={date ? `Hoạt động ngày ${date.format("DD/MM/YYYY")}` : "Danh sách hoạt động"}
                footer={null}
                width={modalWidth}
            onCancel={onClose}
            destroyOnHidden
        >
            {events.length > 0 ? (
                <div className="unified-event-list">
                    {events.map((event) => {
                        const priority = CALENDAR_PRIORITY_MAP.get(
                            event.priority || "MEDIUM"
                        );
                        const eventTime = getCalendarEventTime(event);

                        return (
                            <button
                                type="button"
                                key={event.id}
                                className="unified-event-list__item"
                                data-module={event.module}
                                onClick={() => onSelectEvent(event)}
                            >
                                <span className="unified-event-list__module-bar" />
                                <span className="unified-event-list__content">
                                    <strong>{event.title}</strong>
                                    <small>
                                        {eventTime !== "00:00" ? `${eventTime} · ` : ""}
                                        {getCalendarEventLabel(event)}
                                    </small>
                                </span>
                                {event.priority === "URGENT" ? (
                                    <FireOutlined className="unified-urgent-icon" />
                                ) : null}
                                {priority ? (
                                    <Tag color={priority.color}>{priority.label}</Tag>
                                ) : null}
                            </button>
                        );
                    })}
                </div>
            ) : (
                <Empty description="Không có hoạt động" image={Empty.PRESENTED_IMAGE_SIMPLE} />
            )}
        </Modal>
        );
    }
);

UnifiedCalendarEventListModal.displayName = "UnifiedCalendarEventListModal";

