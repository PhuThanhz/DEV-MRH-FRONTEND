import dayjs from "dayjs";

export const formatDateTime = (dateStr?: string | null): string => {
    if (!dateStr) return "--";
    const d = dayjs(dateStr);
    if (!d.isValid()) return "--";
    return d.format("DD/MM/YYYY HH:mm");
};

export const formatDateOnly = (dateStr?: string | null): string => {
    if (!dateStr) return "--";
    const d = dayjs(dateStr);
    if (!d.isValid()) return "--";
    return d.format("DD/MM/YYYY");
};

export interface RelativeDateMeta {
    text: string;
    status: "overdue" | "today" | "tomorrow" | "upcoming" | "future" | "none";
}

export const getRelativeDueDateMeta = (dateStr?: string | null, isCompleted?: boolean): RelativeDateMeta => {
    if (!dateStr) return { text: "--", status: "none" };
    const d = dayjs(dateStr);
    if (!d.isValid()) return { text: "--", status: "none" };

    if (isCompleted) {
        return { text: d.format("DD/MM/YYYY"), status: "future" };
    }

    const today = dayjs().startOf("day");
    const endOfToday = dayjs().endOf("day");
    const endOfTomorrow = dayjs().add(1, "day").endOf("day");

    if (d.isBefore(today)) {
        const diffDays = Math.max(1, today.diff(d.startOf("day"), "day"));
        return { text: `Trễ ${diffDays} ngày`, status: "overdue" };
    } else if (d.isBefore(endOfToday)) {
        const timeStr = d.format("HH:mm");
        return { text: timeStr !== "00:00" && timeStr !== "23:59" ? `Hôm nay ${timeStr}` : "Hôm nay", status: "today" };
    } else if (d.isBefore(endOfTomorrow)) {
        return { text: "Ngày mai", status: "tomorrow" };
    } else {
        const diffDays = d.startOf("day").diff(today, "day");
        if (diffDays <= 7) {
            return { text: `Còn ${diffDays} ngày`, status: "upcoming" };
        }
        return { text: d.format("DD/MM/YYYY"), status: "future" };
    }
};

export const formatFileSize = (bytes?: number): string => {
    if (!bytes || bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};
