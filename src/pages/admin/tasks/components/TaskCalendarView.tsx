import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import {
    Avatar,
    Button,
    Calendar,
    Card,
    DatePicker,
    Popover,
    Result,
    Spin,
    Tag,
    Tooltip,
    Typography,
} from "antd";
import {
    DownOutlined,
    LeftOutlined,
    RightOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import type { Dayjs } from "dayjs";
import isoWeek from "dayjs/plugin/isoWeek";
import "dayjs/locale/vi";
import type { IResTaskDTO } from "@/types/backend";
import { useTaskCalendarQuery } from "@/hooks/useTasks";
import {
    renderTaskPriorityTag,
    renderTaskStatusTag,
} from "../taskMeta";
import {
    TaskSegmentedControl,
    type TaskSegmentOption,
} from "./common/TaskSegmentedControl";

dayjs.extend(isoWeek);
dayjs.locale("vi");

const { Text } = Typography;

interface Props {
    activeTab: string;
    filter?: string;
    onSelectTask: (task: IResTaskDTO) => void;
}

type CalendarViewMode = "day" | "week" | "month" | "year";

const MAX_CELL_TASKS = 2;
const MAX_WEEK_CELL_TASKS = 8;

const WEEKDAY_LABELS = [
    "Thứ Hai",
    "Thứ Ba",
    "Thứ Tư",
    "Thứ Năm",
    "Thứ Sáu",
    "Thứ Bảy",
    "Chủ Nhật",
];

const VIEW_OPTIONS: TaskSegmentOption<CalendarViewMode>[] = [
    { label: "Ngày", value: "day" },
    { label: "Tuần", value: "week" },
    { label: "Tháng", value: "month" },
    { label: "Năm", value: "year" },
];

const PERIOD_NAVIGATION_LABELS: Record<
    CalendarViewMode,
    { current: string; previous: string; next: string }
> = {
    day: { current: "Hôm nay", previous: "Ngày trước", next: "Ngày sau" },
    week: { current: "Tuần này", previous: "Tuần trước", next: "Tuần sau" },
    month: { current: "Tháng này", previous: "Tháng trước", next: "Tháng sau" },
    year: { current: "Năm nay", previous: "Năm trước", next: "Năm sau" },
};

const capitalizeFirst = (value: string) =>
    value ? value.charAt(0).toUpperCase() + value.slice(1) : value;

const formatWeekRange = (start: Dayjs, end: Dayjs) => {
    if (start.isSame(end, "month")) {
        return `${start.format("D")} – ${end.format("D [tháng] M [năm] YYYY")}`;
    }
    if (start.isSame(end, "year")) {
        return `${start.format("D [tháng] M")} – ${end.format("D [tháng] M [năm] YYYY")}`;
    }
    return `${start.format("D [tháng] M [năm] YYYY")} – ${end.format("D [tháng] M [năm] YYYY")}`;
};

export const TaskCalendarView: React.FC<Props> = React.memo(({
    activeTab,
    filter,
    onSelectTask,
}) => {
    const [viewMode, setViewMode] = useState<CalendarViewMode>("month");
    const [anchorDate, setAnchorDate] = useState<Dayjs>(() => dayjs());
    const calendarRef = useRef<FullCalendar | null>(null);
    const calendarHostRef = useRef<HTMLDivElement | null>(null);

    const visibleRange = useMemo(() => {
        if (viewMode === "day") {
            return {
                from: anchorDate.startOf("day"),
                to: anchorDate.endOf("day"),
            };
        }
        if (viewMode === "week") {
            return {
                from: anchorDate.startOf("isoWeek"),
                to: anchorDate.endOf("isoWeek"),
            };
        }
        if (viewMode === "year") {
            return {
                from: anchorDate.startOf("year"),
                to: anchorDate.endOf("year"),
            };
        }
        return {
            from: anchorDate.startOf("month").startOf("isoWeek"),
            to: anchorDate.endOf("month").endOf("isoWeek"),
        };
    }, [anchorDate, viewMode]);

    const {
        data: tasks = [],
        isLoading,
        isFetching,
        isError,
        refetch: refetchCalendar,
    } = useTaskCalendarQuery(
        visibleRange.from.toISOString(),
        visibleRange.to.toISOString(),
        activeTab,
        filter
    );

    const tasksByDate = useMemo(() => {
        const map: Record<string, IResTaskDTO[]> = {};
        tasks.forEach((task) => {
            if (!task.dueDate) return;
            const dateKey = dayjs(task.dueDate).format("YYYY-MM-DD");
            if (!map[dateKey]) map[dateKey] = [];
            map[dateKey].push(task);
        });

        Object.values(map).forEach((dateTasks) => {
            dateTasks.sort((left, right) => {
                const rightCreatedAt = right.createdAt ? dayjs(right.createdAt).valueOf() : 0;
                const leftCreatedAt = left.createdAt ? dayjs(left.createdAt).valueOf() : 0;
                return rightCreatedAt - leftCreatedAt || Number(right.id) - Number(left.id);
            });
        });
        return map;
    }, [tasks]);

    const tasksByMonth = useMemo(() => {
        const map: Record<string, number> = {};
        tasks.forEach((task) => {
            if (!task.dueDate) return;
            const key = dayjs(task.dueDate).format("YYYY-MM");
            map[key] = (map[key] || 0) + 1;
        });
        return map;
    }, [tasks]);

    const getTasksByDate = useCallback(
        (date: Dayjs) => tasksByDate[date.format("YYYY-MM-DD")] || [],
        [tasksByDate]
    );

    const shiftPeriod = (direction: -1 | 1) => {
        const amount = direction;
        if (viewMode === "day") setAnchorDate((date) => date.add(amount, "day"));
        else if (viewMode === "week") setAnchorDate((date) => date.add(amount, "week"));
        else if (viewMode === "month") setAnchorDate((date) => date.add(amount, "month"));
        else setAnchorDate((date) => date.add(amount, "year"));
    };

    const periodMeta = useMemo(() => {
        if (viewMode === "day") {
            return {
                eyebrow: "Lịch trong ngày",
                title: capitalizeFirst(anchorDate.format("dddd, D [tháng] M [năm] YYYY")),
                subtitle: `${getTasksByDate(anchorDate).length} tác vụ đến hạn`,
            };
        }
        if (viewMode === "week") {
            const start = anchorDate.startOf("isoWeek");
            const end = anchorDate.endOf("isoWeek");
            const taskCount = Array.from({ length: 7 }, (_, index) =>
                getTasksByDate(start.add(index, "day")).length
            ).reduce((total, count) => total + count, 0);
            return {
                eyebrow: `Tuần ${start.isoWeek()}`,
                title: formatWeekRange(start, end),
                subtitle: `${taskCount} tác vụ đến hạn trong tuần`,
            };
        }
        if (viewMode === "month") {
            const key = anchorDate.format("YYYY-MM");
            return {
                eyebrow: "Lịch theo tháng",
                title: `Tháng ${anchorDate.month() + 1} năm ${anchorDate.year()}`,
                subtitle: `${tasksByMonth[key] || 0} tác vụ đến hạn`,
            };
        }
        const yearTaskCount = tasks.filter(
            (task) => task.dueDate && dayjs(task.dueDate).year() === anchorDate.year()
        ).length;
        return {
            eyebrow: "Tổng quan năm",
            title: `Năm ${anchorDate.year()}`,
            subtitle: `${yearTaskCount} tác vụ đến hạn`,
        };
    }, [anchorDate, getTasksByDate, tasks, tasksByMonth, viewMode]);

/* Hallmark · component: TaskCalendarView · genre: modern-minimal · theme: lotus-clean */

    const renderTaskChip = useCallback(
        (task: IResTaskDTO) => {
            const isOverdue = task.overdue;
            const isUrgent = task.priority === "URGENT";
            const isHigh = task.priority === "HIGH";
            const isLow = task.priority === "LOW";

            let chipStyle = {
                bg: "#f0f9ff",
                color: "#0369a1",
                borderColor: "#0284c7",
                dotColor: "#0284c7",
            };

            if (isOverdue || isUrgent) {
                chipStyle = {
                    bg: "#fff1f2",
                    color: "#be123c",
                    borderColor: "#e11d48",
                    dotColor: "#e11d48",
                };
            } else if (isHigh) {
                chipStyle = {
                    bg: "#fff7ed",
                    color: "#c2410c",
                    borderColor: "#f97316",
                    dotColor: "#f97316",
                };
            } else if (isLow) {
                chipStyle = {
                    bg: "#f8fafc",
                    color: "#475569",
                    borderColor: "#64748b",
                    dotColor: "#64748b",
                };
            }

            const assigneeInitial = task.assigneeName ? task.assigneeName.charAt(0).toUpperCase() : "?";
            const dueTimeFormatted = task.dueDate ? dayjs(task.dueDate).format("HH:mm") : null;

            return (
                <Popover
                    key={task.id}
                    title={
                        <Text strong style={{ fontSize: 13, color: "#0f172a" }}>
                            {task.title}
                        </Text>
                    }
                    content={
                        <div className="task-calendar-popover" style={{ width: 230, padding: "4px 0" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                                {renderTaskPriorityTag(task.priority)}
                                {renderTaskStatusTag(task.status, task.overdue)}
                            </div>
                            {task.jobDescriptionTaskTitle && (
                                <div style={{ fontSize: 11, color: "#64748b", margin: "4px 0" }}>
                                    <span style={{ color: "#94a3b8", fontWeight: 700 }}>JD:</span>{" "}
                                    {task.jobDescriptionTaskItemContent
                                        ? `${task.jobDescriptionTaskTitle} — ${task.jobDescriptionTaskItemContent}`
                                        : task.jobDescriptionTaskTitle}
                                </div>
                            )}
                            {task.assigneeName && (
                                <div className="task-calendar-popover__assignee" style={{ fontSize: 11, color: "#475569", marginTop: 4, display: "flex", alignItems: "center", justifyContent: "flex-start", gap: 6 }}>
                                    <Avatar size={18} style={{ backgroundColor: "#be123c", fontSize: 9, fontWeight: 700, flexShrink: 0 }}>
                                        {assigneeInitial}
                                    </Avatar>
                                    <span style={{ fontWeight: 650, color: "#1e293b" }}>{task.assigneeName}</span>
                                </div>
                            )}
                        </div>
                    }
                >
                    <button
                        type="button"
                        className="task-calendar-chip"
                        onClick={(event) => {
                            event.stopPropagation();
                            onSelectTask(task);
                        }}
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                            backgroundColor: chipStyle.bg,
                            color: chipStyle.color,
                            borderLeft: `3px solid ${chipStyle.borderColor}`,
                            borderRadius: 6,
                            padding: "4px 8px",
                            width: "100%",
                            marginBottom: 4,
                            borderTop: "none",
                            borderRight: "none",
                            borderBottom: "none",
                            cursor: "pointer",
                        }}
                    >
                        <span
                            style={{
                                width: 6,
                                height: 6,
                                borderRadius: "50%",
                                backgroundColor: chipStyle.dotColor,
                                flexShrink: 0,
                            }}
                        />
                        <span className="task-calendar-chip__title" style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontSize: 11, fontWeight: 600 }}>
                            {task.title}
                        </span>
                        {dueTimeFormatted && dueTimeFormatted !== "00:00" && (
                            <span style={{ fontSize: 9.5, opacity: 0.85, fontVariantNumeric: "tabular-nums", flexShrink: 0, fontWeight: 700 }}>
                                {dueTimeFormatted}
                            </span>
                        )}
                    </button>
                </Popover>
            );
        },
        [onSelectTask]
    );

    const renderDayBox = useCallback(
        (
            date: Dayjs,
            options?: {
                maxVisible?: number;
                showWeekdayLabel?: boolean;
                showEmptyState?: boolean;
                muted?: boolean;
            }
        ) => {
            const maxVisible = options?.maxVisible ?? MAX_CELL_TASKS;
            const isToday = date.isSame(dayjs(), "day");
            const isWeekend = date.day() === 0 || date.day() === 6;
            const dayTasks = getTasksByDate(date);
            const visibleTasks = dayTasks.slice(0, maxVisible);
            const hiddenCount = Math.max(0, dayTasks.length - maxVisible);

            const dayClassNames = [
                "task-calendar-day-cell",
                isToday ? "is-today" : "",
                isWeekend ? "is-weekend" : "",
                options?.muted ? "is-muted" : "",
                options?.showWeekdayLabel ? "is-week-view" : "",
            ]
                .filter(Boolean)
                .join(" ");

            const fullList = (
                <div className="task-calendar-more-popover">
                    <Text strong>
                        {capitalizeFirst(date.format("dddd, D [tháng] M [năm] YYYY"))}
                    </Text>
                    <Text type="secondary">{dayTasks.length} tác vụ đến hạn</Text>
                    <div>{dayTasks.map((task) => renderTaskChip(task))}</div>
                </div>
            );

            return (
                <div className={dayClassNames}>
                    <div className="task-calendar-day-cell__header">
                        {options?.showWeekdayLabel ? (
                            <div style={{ width: "100%", marginBottom: 4 }}>
                                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 4, marginBottom: 2 }}>
                                    <span className="task-calendar-day-cell__weekday">
                                        {WEEKDAY_LABELS[date.isoWeekday() - 1]}
                                    </span>
                                    {isToday && (
                                        <span className="task-calendar-day-cell__today">Hôm nay</span>
                                    )}
                                </div>
                                <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
                                    <span className="task-calendar-day-cell__number">{date.date()}</span>
                                    <span className="task-calendar-day-cell__month">thg {date.month() + 1}</span>
                                </div>
                            </div>
                        ) : (
                            <>
                                <span className="task-calendar-day-cell__number">{date.date()}</span>
                                {isToday && (
                                    <span className="task-calendar-day-cell__today">Hôm nay</span>
                                )}
                            </>
                        )}
                    </div>

                    <div className="task-calendar-day-cell__tasks">
                        {visibleTasks.map((task) => renderTaskChip(task))}
                        {hiddenCount > 0 && (
                            <Popover content={fullList} trigger="click" placement="top">
                                <Button
                                    type="text"
                                    size="small"
                                    className="task-calendar-more-button"
                                    onClick={(event) => event.stopPropagation()}
                                >
                                    +{hiddenCount} tác vụ khác
                                </Button>
                            </Popover>
                        )}
                        {dayTasks.length === 0 && options?.showEmptyState && (
                            <span className="task-calendar-day-cell__empty">
                                Không có tác vụ
                            </span>
                        )}
                    </div>
                </div>
            );
        },
        [getTasksByDate, renderTaskChip]
    );

    const yearFullCellRender = useCallback(
        (current: Dayjs, info: { type: string; originNode: React.ReactElement }) => {
            if (info.type !== "month") return info.originNode;
            const count = tasksByMonth[current.format("YYYY-MM")] || 0;
            const isCurrentMonth = current.isSame(dayjs(), "month");

            return (
                <div className={`task-calendar-year-cell${isCurrentMonth ? " is-current" : ""}`}>
                    <span>Tháng</span>
                    <strong>{current.month() + 1}</strong>
                    <Text type="secondary">
                        {count > 0 ? `${count} tác vụ` : "Không có tác vụ"}
                    </Text>
                </div>
            );
        },
        [tasksByMonth]
    );

    const renderWeekView = () => {
        const start = anchorDate.startOf("isoWeek");
        const days = Array.from({ length: 7 }, (_, index) => start.add(index, "day"));
        return (
            <div className="task-calendar-week-grid">
                {days.map((date) => (
                    <div key={date.format("YYYY-MM-DD")}>
                        {renderDayBox(date, {
                            maxVisible: MAX_WEEK_CELL_TASKS,
                            showWeekdayLabel: true,
                            showEmptyState: true,
                        })}
                    </div>
                ))}
            </div>
        );
    };

    const renderDayTaskCard = (task: IResTaskDTO) => {
        const assigneeInitial = task.assigneeName ? task.assigneeName.charAt(0).toUpperCase() : "?";
        const dueTimeFormatted = task.dueDate ? dayjs(task.dueDate).format("HH:mm") : null;

        return (
            <Card
                key={task.id}
                size="small"
                hoverable
                className={`task-calendar-day-task${task.overdue ? " is-overdue" : ""}`}
                onClick={() => onSelectTask(task)}
                style={{
                    borderRadius: 12,
                    border: task.overdue ? "1.5px solid #fecdd3" : "1px solid #e2e8f0",
                    background: task.overdue ? "#fff1f2" : "#ffffff",
                    padding: "14px 18px",
                    boxShadow: "0 2px 8px -4px rgba(15,23,42,0.06)",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                }}
            >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <span className="task-code-badge">
                            TV-{String(task.id).padStart(3, "0")}
                        </span>
                        <Text strong style={{ fontSize: 14.5, color: "#0f172a" }}>
                            {task.title}
                        </Text>
                    </div>
                    {renderTaskPriorityTag(task.priority)}
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        {renderTaskStatusTag(task.status, task.overdue)}
                        {dueTimeFormatted && dueTimeFormatted !== "00:00" && (
                            <Tag color="cyan" style={{ fontSize: 11, margin: 0, padding: "2px 8px", borderRadius: 6, fontWeight: 600 }}>
                                ⏰ Hạn: {dueTimeFormatted} ({dayjs(task.dueDate).format("DD/MM/YYYY")})
                            </Tag>
                        )}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "#475569" }}>
                        <Avatar size={22} style={{ backgroundColor: "#be123c", color: "#ffffff", fontSize: 10, fontWeight: 700 }}>
                            {assigneeInitial}
                        </Avatar>
                        <span style={{ fontWeight: 600 }}>{task.assigneeName || "Chưa phân công"}</span>
                    </div>
                </div>
            </Card>
        );
    };

    const renderDayView = () => {
        const dayTasks = getTasksByDate(anchorDate);
        const activeTasks = tasks.filter(
            (t) => t.status === "IN_PROGRESS" || t.status === "PENDING_REVIEW" || t.status === "REWORK"
        );

        if (dayTasks.length > 0) {
            return (
                <div className="task-calendar-day-list" style={{ display: "grid", gap: 12, padding: "12px 0" }}>
                    <div style={{ marginBottom: 4 }}>
                        <Text strong style={{ fontSize: 14, color: "#1e293b" }}>
                            📋 Tác vụ đến hạn ngày {anchorDate.format("DD/MM/YYYY")} ({dayTasks.length} tác vụ)
                        </Text>
                    </div>
                    {dayTasks.map((task) => renderDayTaskCard(task))}
                </div>
            );
        }

        return (
            <div style={{ padding: "12px 0" }}>
                <div
                    style={{
                        padding: "16px 20px",
                        background: "#f8fafc",
                        border: "1px dashed #cbd5e1",
                        borderRadius: 12,
                        textAlign: "center",
                        marginBottom: 20,
                    }}
                >
                    <Text strong style={{ color: "#475569", fontSize: 13.5, display: "block", marginBottom: 2 }}>
                        Không có tác vụ đến hạn vào ngày {anchorDate.format("DD/MM/YYYY")}
                    </Text>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                        Dưới đây là danh sách các tác vụ đang được triển khai trong hệ thống:
                    </Text>
                </div>

                {activeTasks.length > 0 && (
                    <div className="task-calendar-day-list" style={{ display: "grid", gap: 12 }}>
                        <div style={{ marginBottom: 4 }}>
                            <Text strong style={{ fontSize: 13.5, color: "#334155" }}>
                                ⚡ Tác vụ đang thực hiện / cần xử lý ({activeTasks.length} tác vụ)
                            </Text>
                        </div>
                        {activeTasks.map((task) => renderDayTaskCard(task))}
                    </div>
                )}
            </div>
        );
    };

    const fullCalendarEvents = useMemo(() => {
        return tasks
            .filter((task) => task.dueDate)
            .map((task) => {
                const isUrgent = task.priority === "HIGH" || task.priority === "URGENT" || task.overdue;
                return {
                    id: String(task.id),
                    title: task.title,
                    start: dayjs(task.dueDate).format("YYYY-MM-DDTHH:mm:ss"),
                    backgroundColor: task.overdue ? "#fff1f2" : isUrgent ? "#fff7ed" : "#f0f9ff",
                    borderColor: task.overdue ? "#fecdd3" : isUrgent ? "#fed7aa" : "#bae6fd",
                    textColor: task.overdue ? "#be123c" : isUrgent ? "#c2410c" : "#0369a1",
                    extendedProps: { task },
                };
            });
    }, [tasks]);

    useEffect(() => {
        if (!calendarRef.current || viewMode !== "month") return;
        const api = calendarRef.current.getApi();
        api.gotoDate(anchorDate.toDate());
        api.updateSize();
    }, [anchorDate, viewMode]);

    useEffect(() => {
        if (viewMode !== "month" || !calendarHostRef.current) return;

        const host = calendarHostRef.current;
        let animationFrame = 0;
        const updateCalendarSize = () => {
            cancelAnimationFrame(animationFrame);
            animationFrame = requestAnimationFrame(() => {
                calendarRef.current?.getApi().updateSize();
            });
        };

        updateCalendarSize();
        const resizeObserver = new ResizeObserver(updateCalendarSize);
        resizeObserver.observe(host);
        if (host.parentElement) resizeObserver.observe(host.parentElement);
        window.addEventListener("resize", updateCalendarSize);

        return () => {
            cancelAnimationFrame(animationFrame);
            resizeObserver.disconnect();
            window.removeEventListener("resize", updateCalendarSize);
        };
    }, [viewMode]);

    return (
        <Card size="small" className="task-calendar-card">
            <header className="task-calendar-toolbar">
                <div className="task-calendar-period">
                    <div>
                        <Text className="task-calendar-period__eyebrow">
                            {periodMeta.eyebrow}
                        </Text>
                        {viewMode === "year" ? (
                            <DatePicker
                                picker="year"
                                value={anchorDate}
                                format="[Năm] YYYY"
                                allowClear={false}
                                suffixIcon={<DownOutlined />}
                                className="task-calendar-year-picker"
                                aria-label="Chọn năm hiển thị"
                                onChange={(date) => {
                                    if (date) setAnchorDate(date.startOf("year"));
                                }}
                            />
                        ) : (
                            <Text strong className="task-calendar-period__title">
                                {periodMeta.title}
                            </Text>
                        )}
                        <Text type="secondary" className="task-calendar-period__subtitle">
                            {periodMeta.subtitle}
                        </Text>
                        {isFetching && !isLoading ? (
                            <Text
                                type="secondary"
                                className="task-calendar-period__syncing"
                            >
                                Đang cập nhật dữ liệu…
                            </Text>
                        ) : null}
                    </div>
                </div>

                <div className="task-calendar-controls">
                    <TaskSegmentedControl
                        className="task-calendar-view-switch"
                        value={viewMode}
                        onChange={setViewMode}
                        options={VIEW_OPTIONS}
                        ariaLabel="Chọn khoảng thời gian hiển thị"
                    />
                    <div className="task-calendar-navigation">
                        <Tooltip title={PERIOD_NAVIGATION_LABELS[viewMode].previous}>
                            <Button
                                icon={<LeftOutlined />}
                                onClick={() => shiftPeriod(-1)}
                                aria-label={PERIOD_NAVIGATION_LABELS[viewMode].previous}
                            />
                        </Tooltip>
                        <Button
                            className="task-calendar-today-button"
                            onClick={() => setAnchorDate(dayjs())}
                        >
                            {PERIOD_NAVIGATION_LABELS[viewMode].current}
                        </Button>
                        <Tooltip title={PERIOD_NAVIGATION_LABELS[viewMode].next}>
                            <Button
                                icon={<RightOutlined />}
                                onClick={() => shiftPeriod(1)}
                                aria-label={PERIOD_NAVIGATION_LABELS[viewMode].next}
                            />
                        </Tooltip>
                    </div>
                </div>
            </header>

            <div
                className="task-calendar-content"
                data-view={viewMode}
                aria-busy={isLoading || isFetching}
            >
                {isError ? (
                    <Result
                        status="error"
                        title="Không tải được dữ liệu lịch"
                        subTitle="Dữ liệu chưa được thay bằng nội dung giả. Vui lòng tải lại từ máy chủ."
                        extra={
                            <Button onClick={() => refetchCalendar()}>
                                Tải lại
                            </Button>
                        }
                    />
                ) : isLoading ? (
                    <div className="task-calendar-loading" role="status">
                        <Spin />
                        <Text type="secondary">Đang tải tác vụ từ hệ thống…</Text>
                    </div>
                ) : (
                    <>
                        {viewMode === "day" && renderDayView()}
                        {viewMode === "week" && renderWeekView()}
                        {viewMode === "month" && (
                            <div
                                ref={calendarHostRef}
                                className="task-calendar-month-host"
                            >
                                <FullCalendar
                                    ref={calendarRef}
                                    plugins={[dayGridPlugin, interactionPlugin]}
                                    initialView="dayGridMonth"
                                    headerToolbar={false}
                                    events={fullCalendarEvents}
                                    locale="vi"
                                    firstDay={1}
                                    height="auto"
                                    dayMaxEvents={3}
                                    moreLinkClick="popover"
                                    moreLinkContent={(args) =>
                                        `+${args.num} tác vụ`
                                    }
                                    eventClick={(info) => {
                                        const task = info.event.extendedProps?.task;
                                        if (task) onSelectTask(task);
                                    }}
                                    eventContent={(eventInfo) => {
                                        const task: IResTaskDTO = eventInfo.event.extendedProps?.task;
                                        const isUrgent = task?.priority === "HIGH" || task?.priority === "URGENT" || task?.overdue;
                                        const dotColor = task?.overdue ? "#ef4444" : isUrgent ? "#f97316" : "#2563eb";
                                        return (
                                            <div className="task-calendar-fc-event">
                                                <span
                                                    className="task-calendar-fc-event__dot"
                                                    style={{ backgroundColor: dotColor }}
                                                />
                                                <span className="task-calendar-fc-event__title">
                                                    {eventInfo.event.title}
                                                </span>
                                            </div>
                                        );
                                    }}
                                />
                            </div>
                        )}
                        {viewMode === "year" && (
                            <Calendar
                                className="task-year-calendar"
                                value={anchorDate}
                                onSelect={(date) => {
                                    setAnchorDate(date);
                                    setViewMode("month");
                                }}
                                mode="year"
                                headerRender={() => null}
                                fullCellRender={yearFullCellRender}
                            />
                        )}
                    </>
                )}
            </div>
        </Card>
    );
});

export default TaskCalendarView;
