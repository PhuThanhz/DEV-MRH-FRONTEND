import React, { useCallback, useMemo, useState } from "react";
import {
    Button,
    Card,
    Empty,
    Result,
    Spin,
} from "antd";
import type { Dayjs } from "dayjs";
import dayjs from "dayjs";
import "dayjs/locale/vi";
import { useNavigate } from "react-router-dom";
import PageContainer from "@/components/common/data-table/PageContainer";
import { useMyCalendarActionsQuery } from "@/hooks/useUnifiedCalendar";
import { useAppSelector } from "@/redux/hooks";
import useAccess from "@/hooks/useAccess";
import { ALL_PERMISSIONS } from "@/config/permissions";
import { callFetchTaskById } from "@/config/api";
import { notify } from "@/components/common/notification/notify";
import type {
    IResTaskDTO,
    IUnifiedCalendarEventDTO,
} from "@/types/backend";
import { TaskDetailDrawer } from "./components/TaskDetailDrawer";
import { TaskFormDrawer } from "./components/TaskFormDrawer";
import {
    UnifiedCalendarFilters,
    UnifiedCalendarToolbar,
} from "./components/calendar/UnifiedCalendarControls";
import { UnifiedCalendarDayView } from "./components/calendar/UnifiedCalendarDayView";
import { UnifiedCalendarEventListModal } from "./components/calendar/UnifiedCalendarEventListModal";
import { UnifiedCalendarMonthView } from "./components/calendar/UnifiedCalendarMonthView";
import { UnifiedCalendarWeekView } from "./components/calendar/UnifiedCalendarWeekView";
import { UnifiedCalendarYearView } from "./components/calendar/UnifiedCalendarYearView";
import {
    CALENDAR_MODULE_ITEMS,
    CALENDAR_PRIORITY_ITEMS,
    getCalendarPriorityScore,
    getWeekStart,
    type CalendarLegendItem,
    type CalendarView,
} from "./components/calendar/unifiedCalendarMeta";
import "./MyUnifiedCalendarPage.css";

dayjs.locale("vi");

const MyUnifiedCalendarPage: React.FC = () => {
    const navigate = useNavigate();
    const user = useAppSelector((state) => state.account.user);
    const [selectedDate, setSelectedDate] = useState<Dayjs>(() => dayjs());
    const [calendarView, setCalendarView] = useState<CalendarView>("month");
    const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);
    const [selectedTask, setSelectedTask] = useState<IResTaskDTO | null>(null);
    const [detailDrawerOpen, setDetailDrawerOpen] = useState(false);
    const [formDrawerOpen, setFormDrawerOpen] = useState(false);
    const [eventListDate, setEventListDate] = useState<Dayjs | null>(null);
    const [eventListEvents, setEventListEvents] = useState<
        IUnifiedCalendarEventDTO[]
    >([]);
    const [activeModules, setActiveModules] = useState<string[]>([]);
    const [activePriorities, setActivePriorities] = useState<string[]>([]);

    const fromStr =
        calendarView === "year"
            ? selectedDate.startOf("year").format("YYYY-MM-DD")
            : calendarView === "week"
              ? getWeekStart(selectedDate).format("YYYY-MM-DD")
            : calendarView === "day"
              ? selectedDate.format("YYYY-MM-DD")
              : selectedDate.startOf("month").format("YYYY-MM-DD");
    const toStr =
        calendarView === "year"
            ? selectedDate.endOf("year").format("YYYY-MM-DD")
            : calendarView === "week"
              ? getWeekStart(selectedDate).add(6, "day").format("YYYY-MM-DD")
            : calendarView === "day"
              ? selectedDate.format("YYYY-MM-DD")
              : selectedDate.endOf("month").format("YYYY-MM-DD");

    const {
        data: events = [],
        isError,
        isFetching,
        isLoading,
        refetch,
    } = useMyCalendarActionsQuery(fromStr, toStr);

    const canCreatePerm = useAccess(ALL_PERMISSIONS.TASKS.CREATE);
    const canUpdatePerm = useAccess(ALL_PERMISSIONS.TASKS.UPDATE);
    const canUpdateStatusPerm = useAccess(ALL_PERMISSIONS.TASKS.UPDATE_STATUS);
    const canCancelPerm = useAccess(ALL_PERMISSIONS.TASKS.CANCEL);
    const canDeletePerm = useAccess(ALL_PERMISSIONS.TASKS.DELETE);
    const canSubmitResultPerm = useAccess(ALL_PERMISSIONS.TASKS.SUBMIT_RESULT);
    const canApprovePerm = useAccess(ALL_PERMISSIONS.TASKS.APPROVE);
    const canRequestExtensionPerm = useAccess(ALL_PERMISSIONS.TASKS.REQUEST_EXTENSION);
    const canDecideExtensionPerm = useAccess(ALL_PERMISSIONS.TASKS.DECIDE_EXTENSION);

    const perms = useMemo(
        () => ({
            create: canCreatePerm,
            update: canUpdatePerm,
            updateStatus: canUpdateStatusPerm,
            cancel: canCancelPerm,
            delete: canDeletePerm,
            submitResult: canSubmitResultPerm,
            approve: canApprovePerm,
            requestExtension: canRequestExtensionPerm,
            decideExtension: canDecideExtensionPerm,
        }),
        [
            canApprovePerm,
            canCancelPerm,
            canCreatePerm,
            canDeletePerm,
            canSubmitResultPerm,
            canUpdatePerm,
            canUpdateStatusPerm,
            canRequestExtensionPerm,
            canDecideExtensionPerm,
        ]
    );

    const availableModuleItems = useMemo(() => {
        const moduleKeys = new Set(events.map((event) => event.module));
        const knownItems = CALENDAR_MODULE_ITEMS.filter((item) =>
            moduleKeys.has(item.key)
        );
        const knownKeys = new Set(knownItems.map((item) => item.key));
        const unknownItems = Array.from(moduleKeys)
            .filter((key) => !knownKeys.has(key))
            .map<CalendarLegendItem>((key) => ({
                key,
                label:
                    events.find((event) => event.module === key)?.label ||
                    events.find((event) => event.module === key)?.tagLabel ||
                    key,
            }));

        return [...knownItems, ...unknownItems];
    }, [events]);

    const filteredEvents = useMemo(
        () =>
            events.filter((event) => {
                const matchesModule =
                    activeModules.length === 0 ||
                    activeModules.includes(event.module);
                const eventPriority = event.priority || "MEDIUM";
                const matchesPriority =
                    activePriorities.length === 0 ||
                    activePriorities.includes(eventPriority);
                return matchesModule && matchesPriority;
            }),
        [activeModules, activePriorities, events]
    );

    const eventsByDate = useMemo(() => {
        const grouped = new Map<string, IUnifiedCalendarEventDTO[]>();
        filteredEvents.forEach((event) => {
            const dateVal = event.eventDate || event.dueDate;
            if (!dateVal) return;
            const dateKey = dayjs(dateVal).format("YYYY-MM-DD");
            const dateEvents = grouped.get(dateKey) ?? [];
            dateEvents.push(event);
            grouped.set(dateKey, dateEvents);
        });
        grouped.forEach((dateEvents) => {
            dateEvents.sort(
                (left, right) => {
                    const diffPriority =
                        getCalendarPriorityScore(right.priority) -
                        getCalendarPriorityScore(left.priority);
                    if (diffPriority !== 0) return diffPriority;
                    return (
                        dayjs(left.eventDate || left.dueDate).valueOf() -
                        dayjs(right.eventDate || right.dueDate).valueOf()
                    );
                }
            );
        });
        return grouped;
    }, [filteredEvents]);

    const eventsByMonth = useMemo(() => {
        const grouped = new Map<string, number>();
        filteredEvents.forEach((event) => {
            const dateVal = event.eventDate || event.dueDate;
            if (!dateVal) return;
            const monthKey = dayjs(dateVal).format("YYYY-MM");
            grouped.set(monthKey, (grouped.get(monthKey) ?? 0) + 1);
        });
        return grouped;
    }, [filteredEvents]);

    const periodLabel =
        calendarView === "day"
            ? selectedDate.format("dddd, D [tháng] M [năm] YYYY")
            : calendarView === "week"
              ? `${getWeekStart(selectedDate).format("D/M")} – ${getWeekStart(selectedDate).add(6, "day").format("D/M/YYYY")}`
            : calendarView === "month"
              ? `Tháng ${selectedDate.month() + 1}, ${selectedDate.year()}`
              : `Năm ${selectedDate.year()}`;

    const handleEventClick = useCallback((event: IUnifiedCalendarEventDTO) => {
        if (event.module === "TASK" && event.targetId) {
            setSelectedTaskId(Number(event.targetId));
            setDetailDrawerOpen(true);
            return;
        }

        const destination = event.targetUrl || event.actionLink;
        if (destination) {
            navigate(destination);
        }
    }, [navigate]);

    const handleEditTask = useCallback(async () => {
        if (!selectedTaskId) return;

        try {
            const response = await callFetchTaskById(selectedTaskId);
            if (!response?.data) {
                notify.error("Không tìm thấy dữ liệu tác vụ");
                return;
            }
            setSelectedTask(response.data as IResTaskDTO);
            setDetailDrawerOpen(false);
            setFormDrawerOpen(true);
        } catch {
            notify.error("Không thể tải tác vụ để chỉnh sửa");
        }
    }, [selectedTaskId]);

    const openEventList = useCallback(
        (date: Dayjs, dayEvents: IUnifiedCalendarEventDTO[]) => {
            setEventListDate(date);
            setEventListEvents(dayEvents);
        },
        []
    );

    const closeEventList = useCallback(() => {
        setEventListDate(null);
        setEventListEvents([]);
    }, []);

    const handleEventListSelect = useCallback(
        (event: IUnifiedCalendarEventDTO) => {
            closeEventList();
            handleEventClick(event);
        },
        [closeEventList, handleEventClick]
    );

    const toggleModule = useCallback((moduleKey: string) => {
        setActiveModules((current) =>
            current.includes(moduleKey)
                ? current.filter((key) => key !== moduleKey)
                : [...current, moduleKey]
        );
    }, []);

    const togglePriority = useCallback((priorityKey: string) => {
        setActivePriorities((current) =>
            current.includes(priorityKey)
                ? current.filter((key) => key !== priorityKey)
                : [...current, priorityKey]
        );
    }, []);

    const clearFilters = useCallback(() => {
        setActiveModules([]);
        setActivePriorities([]);
    }, []);

    const shiftPeriod = useCallback((direction: -1 | 1) => {
        const unit =
            calendarView === "day"
                ? "day"
                : calendarView === "week"
                  ? "week"
                  : calendarView === "month"
                  ? "month"
                  : "year";
        setSelectedDate((current) => current.add(direction, unit));
    }, [calendarView]);

    const handleToday = useCallback(() => {
        setSelectedDate(dayjs());
    }, []);

    const handleSelectWeekDate = useCallback((date: Dayjs) => {
        setSelectedDate(date);
        setCalendarView("day");
    }, []);

    const handleSelectMonth = useCallback((date: Dayjs) => {
        setSelectedDate(date);
        setCalendarView("month");
    }, []);

    const handleSelectYear = useCallback((date: Dayjs) => {
        setSelectedDate((current) => current.year(date.year()));
    }, []);

    const handleCloseForm = useCallback(() => {
        setFormDrawerOpen(false);
        setSelectedTask(null);
        void refetch();
    }, [refetch]);

    const hasActiveFilters =
        activeModules.length > 0 || activePriorities.length > 0;

    return (
        <PageContainer
            title="Lịch Công Việc Của Tôi"
            contentClassName="unified-calendar-page-shell"
        >
            <Card className="unified-calendar-card" bordered={false}>
                <UnifiedCalendarToolbar
                    periodLabel={periodLabel}
                    isFetching={isFetching && !isLoading}
                    view={calendarView}
                    selectedDate={selectedDate}
                    onShift={shiftPeriod}
                    onToday={handleToday}
                    onViewChange={setCalendarView}
                    onSelectYear={handleSelectYear}
                />

                <UnifiedCalendarFilters
                    modules={availableModuleItems}
                    priorities={CALENDAR_PRIORITY_ITEMS}
                    activeModules={activeModules}
                    activePriorities={activePriorities}
                    onToggleModule={toggleModule}
                    onTogglePriority={togglePriority}
                    onClear={clearFilters}
                />

                {isError ? (
                    <Result
                        className="unified-calendar-state"
                        status="warning"
                        title="Không thể tải lịch làm việc"
                        subTitle="Kiểm tra kết nối và thử lại."
                        extra={
                            <Button onClick={() => void refetch()}>
                                Thử lại
                            </Button>
                        }
                    />
                ) : isLoading ? (
                    <div className="unified-calendar-state" aria-live="polite">
                        <Spin />
                        <span>Đang tải lịch làm việc…</span>
                    </div>
                ) : (
                    <>
                        {filteredEvents.length === 0 ? (
                            <div className="unified-calendar-empty" role="status">
                                <Empty
                                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                                    description={
                                        hasActiveFilters
                                            ? "Không có hoạt động phù hợp bộ lọc"
                                            : "Chưa có hoạt động trong khoảng thời gian này"
                                    }
                                />
                            </div>
                        ) : null}

                        {calendarView === "day" ? (
                            <UnifiedCalendarDayView
                                selectedDate={selectedDate}
                                periodLabel={periodLabel}
                                events={
                                    eventsByDate.get(
                                        selectedDate.format("YYYY-MM-DD")
                                    ) ?? []
                                }
                                onSelectEvent={handleEventClick}
                                onShowEvents={openEventList}
                            />
                        ) : calendarView === "week" ? (
                            <UnifiedCalendarWeekView
                                selectedDate={selectedDate}
                                eventsByDate={eventsByDate}
                                onSelectDate={handleSelectWeekDate}
                                onSelectEvent={handleEventClick}
                            />
                        ) : calendarView === "year" ? (
                            <UnifiedCalendarYearView
                                selectedDate={selectedDate}
                                eventsByDate={eventsByDate}
                                eventsByMonth={eventsByMonth}
                                onSelectMonth={handleSelectMonth}
                            />
                        ) : (
                            <UnifiedCalendarMonthView
                                selectedDate={selectedDate}
                                eventsByDate={eventsByDate}
                                eventsByMonth={eventsByMonth}
                                onChange={setSelectedDate}
                                onSelectEvent={handleEventClick}
                                onShowEvents={openEventList}
                            />
                        )}
                    </>
                )}
            </Card>

            <TaskDetailDrawer
                open={detailDrawerOpen}
                taskId={selectedTaskId}
                onClose={() => setDetailDrawerOpen(false)}
                onEdit={handleEditTask}
                user={user}
                perms={perms}
            />

            <TaskFormDrawer
                open={formDrawerOpen}
                task={selectedTask}
                onClose={handleCloseForm}
            />

            <UnifiedCalendarEventListModal
                open={eventListDate !== null}
                date={eventListDate}
                events={eventListEvents}
                onClose={closeEventList}
                onSelectEvent={handleEventListSelect}
            />
        </PageContainer>
    );
};

export default MyUnifiedCalendarPage;
