import dayjs from "dayjs";
import type { IUnifiedCalendarEventDTO } from "@/types/backend";

export type CalendarView = "day" | "week" | "month" | "year";

export interface CalendarLegendItem {
    key: string;
    label: string;
}

export interface CalendarPriorityItem {
    key: string;
    label: string;
    color: string;
}

export const CALENDAR_MODULE_ITEMS: CalendarLegendItem[] = [
    { key: "TASK", label: "Tác vụ hằng ngày" },
    { key: "JOB_DESCRIPTION", label: "Duyệt JD" },
    { key: "ACCOUNTING", label: "Bộ chứng từ" },
    { key: "EVALUATION", label: "Đánh giá KPI" },
    { key: "LEAVE", label: "Đơn xin nghỉ" },
    { key: "MEETING", label: "Lịch họp" },
];

export const CALENDAR_PRIORITY_ITEMS: CalendarPriorityItem[] = [
    { key: "URGENT", label: "Khẩn cấp", color: "#ff4d4f" },
    { key: "HIGH", label: "Cao", color: "#fa8c16" },
    { key: "MEDIUM", label: "Trung bình", color: "#1890ff" },
    { key: "LOW", label: "Thấp", color: "#52c41a" },
];

export const CALENDAR_MODULE_MAP = new Map(
    CALENDAR_MODULE_ITEMS.map((item) => [item.key, item])
);

export const CALENDAR_PRIORITY_MAP = new Map(
    CALENDAR_PRIORITY_ITEMS.map((item) => [item.key, item])
);

export const getCalendarEventDate = (event: IUnifiedCalendarEventDTO) =>
    dayjs(event.eventDate || event.dueDate);

export const getCalendarEventTime = (event: IUnifiedCalendarEventDTO) =>
    getCalendarEventDate(event).format("HH:mm");

export const getCalendarEventLabel = (event: IUnifiedCalendarEventDTO) =>
    CALENDAR_MODULE_MAP.get(event.module)?.label ||
    event.label ||
    event.tagLabel ||
    event.module;

export const getCalendarPriorityColor = (priority?: string) => {
    switch (priority) {
        case "URGENT":
            return "#ef4444";
        case "HIGH":
            return "#f97316";
        case "LOW":
            return "#10b981";
        case "MEDIUM":
        default:
            return "#1890ff";
    }
};

export const getCalendarPriorityScore = (priority?: string) => {
    if (priority === "URGENT") return 4;
    if (priority === "HIGH") return 3;
    if (priority === "MEDIUM") return 2;
    return 1;
};

export const getWeekStart = (date: dayjs.Dayjs) =>
    date.subtract((date.day() + 6) % 7, "day").startOf("day");

