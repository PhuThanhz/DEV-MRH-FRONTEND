import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { DatePicker, Button, Card, Row, Col, Progress, Table, Tag, Typography, Space, Input, Avatar, Modal, Select, Segmented, Pagination, Empty } from "antd";
import { DownloadOutlined, SearchOutlined, ApartmentOutlined, UserOutlined, CheckSquareOutlined, CheckCircleOutlined, UnorderedListOutlined, EyeOutlined, CheckOutlined, ReloadOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import PageContainer from "@/components/common/data-table/PageContainer";
import AdvancedFilterSelect from "@/components/common/filter/AdvancedFilterSelect";
import type { FilterField } from "@/components/common/filter/AdvancedFilterSelect";
import { Pie, Column } from "@/components/common/chart/LazyChart";
import { useTaskSummaryReportQuery, useExportTaskSummaryReportMutation } from "@/hooks/useTaskSummaryReport";
import { useCompaniesQuery } from "@/hooks/useCompanies";
import { useDepartmentsByCompanyQuery, useDepartmentsQuery } from "@/hooks/useDepartments";
import { useUsersCrossCompanyQuery } from "@/hooks/useUsers";
import { useIsMobile } from "@/hooks/useIsMobile";
import { callFetchUser } from "@/config/api";
import type { ITaskSummaryReportFilters } from "@/config/api";
import type { IResTaskDTO } from "@/types/backend";
import useAccess from "@/hooks/useAccess";
import { useAppSelector } from "@/redux/hooks";
import { ALL_PERMISSIONS } from "@/config/permissions";
import { formatDateTime } from "./taskUtils";
import { TASK_PRIORITY_META, renderTaskPriorityTag, renderTaskStatusTag } from "./taskMeta";
import { TaskDetailDrawer } from "./components/TaskDetailDrawer";
import { TaskFormDrawer } from "./components/TaskFormDrawer";
import { SummaryReportMobileCard } from "./components/SummaryReportMobileCard";
import ActionButton from "@/components/common/ui/ActionButton";
import StatCard from "@/components/common/ui/StatCard";

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;


const TaskSummaryReportPage: React.FC = () => {
    const canExportPerm = useAccess(ALL_PERMISSIONS.TASKS.EXPORT_SUMMARY_REPORT);

    const user = useAppSelector((state) => state.account.user);
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
            canCreatePerm,
            canUpdatePerm,
            canUpdateStatusPerm,
            canCancelPerm,
            canDeletePerm,
            canSubmitResultPerm,
            canApprovePerm,
            canRequestExtensionPerm,
            canDecideExtensionPerm,
        ]
    );

    const [searchParams, setSearchParams] = useSearchParams();
    const isMobile = useIsMobile();

    const [detailDrawerOpen, setDetailDrawerOpen] = useState(false);
    const [formDrawerOpen, setFormDrawerOpen] = useState(false);
    const [selectedTask, setSelectedTask] = useState<IResTaskDTO | null>(null);
    const [viewMode, setViewMode] = useState<"employee" | "department" | "task">(
        () => (searchParams.get("view") as "employee" | "department" | "task") || "employee"
    );
    const [mobilePage, setMobilePage] = useState(1);
    const mobilePageSize = 10;

    useEffect(() => {
        setMobilePage(1);
    }, [viewMode]);

    const handleDetailClick = useCallback((task: IResTaskDTO) => {
        setSelectedTask(task);
        setDetailDrawerOpen(true);
    }, []);

    const [dateRange, setDateRange] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null]>(() => {
        const fromParam = searchParams.get("from");
        const toParam = searchParams.get("to");
        if (fromParam && toParam) {
            return [dayjs(fromParam), dayjs(toParam)];
        }
        return [dayjs().startOf("month"), dayjs().endOf("month")];
    });
    const [selectedFilters, setSelectedFilters] = useState<Record<string, any>>(() => {
        const initial: Record<string, any> = {};
        ["priority", "isOnTime", "createdBy", "isJdTask"].forEach((key) => {
            const value = searchParams.get(key);
            if (value) initial[key] = value;
        });
        return initial;
    });
    const [searchInput, setSearchInput] = useState<string>(() => searchParams.get("search") || "");
    const [searchTitle, setSearchTitle] = useState<string>(() => searchParams.get("search") || "");
    const [companyId, setCompanyId] = useState<number | undefined>(() => {
        const v = searchParams.get("companyId");
        return v ? Number(v) : undefined;
    });
    const [departmentId, setDepartmentId] = useState<number | undefined>(() => {
        const v = searchParams.get("departmentId");
        return v ? Number(v) : undefined;
    });
    const [assigneeId, setAssigneeId] = useState<string | undefined>(
        () => searchParams.get("assigneeId") || undefined
    );

    const { data: companiesData } = useCompaniesQuery("page=1&size=100&sort=name,asc");
    const { data: allDepartmentsData } = useDepartmentsQuery("page=1&size=500&sort=name,asc", !companyId);
    const { data: companyDepartmentsData } = useDepartmentsByCompanyQuery(companyId || 0);

    const assigneeQueryString = useMemo(() => {
        const parts = ["page=1", "size=300", "sort=name,asc"];
        if (companyId) parts.push(`companyId=${companyId}`);
        if (departmentId) parts.push(`departmentId=${departmentId}`);
        return parts.join("&");
    }, [companyId, departmentId]);
    const { data: assigneeData } = useUsersCrossCompanyQuery(assigneeQueryString);

    const companyOptions = useMemo(
        () => (companiesData?.result || []).map((c) => ({ label: c.name, value: c.id })),
        [companiesData]
    );
    const departmentOptions = useMemo(() => {
        if (companyId) {
            return (companyDepartmentsData || []).map((d) => ({ label: d.name, value: d.id }));
        }
        return (allDepartmentsData?.result || []).map((d) => ({
            label: `${d.name}${d.companyName ? ` (${d.companyName})` : ""}`,
            value: d.id,
        }));
    }, [companyId, companyDepartmentsData, allDepartmentsData]);

    const assigneeOptions = useMemo(
        () => ((assigneeData as any)?.result || []).map((u: any) => ({ label: u.name || u.email, value: u.id })),
        [assigneeData]
    );

    const handleCompanyChange = useCallback((value: number | undefined) => {
        setCompanyId(value);
        setDepartmentId(undefined);
        setAssigneeId(undefined);
    }, []);

    const handleDepartmentChange = useCallback((value: number | undefined) => {
        setDepartmentId(value);
        setAssigneeId(undefined);
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => {
            setSearchTitle(searchInput.trim());
        }, 400);
        return () => clearTimeout(timer);
    }, [searchInput]);

    const fromStr = dateRange?.[0] ? dateRange[0].format("YYYY-MM-DD") : undefined;
    const toStr = dateRange?.[1] ? dateRange[1].format("YYYY-MM-DD") : undefined;

    const filters: ITaskSummaryReportFilters = useMemo(() => ({
        from: fromStr,
        to: toStr,
        companyId,
        departmentId,
        assigneeId,
        priority: selectedFilters.priority,
        title: searchTitle || undefined,
        isOnTime: selectedFilters.isOnTime !== undefined ? selectedFilters.isOnTime === "true" : undefined,
        createdBy: selectedFilters.createdBy,
        isJdTask: selectedFilters.isJdTask !== undefined ? selectedFilters.isJdTask === "true" : undefined,
    }), [fromStr, toStr, companyId, departmentId, assigneeId, selectedFilters, searchTitle]);

    const { data: report, isLoading, isFetching, dataUpdatedAt, refetch } = useTaskSummaryReportQuery(filters);
    const exportMutation = useExportTaskSummaryReportMutation();

    // Đồng bộ bộ lọc lên URL để F5/chia sẻ link không mất trạng thái
    useEffect(() => {
        const params: Record<string, string> = {};
        if (filters.from) params.from = filters.from;
        if (filters.to) params.to = filters.to;
        if (filters.companyId) params.companyId = String(filters.companyId);
        if (filters.departmentId) params.departmentId = String(filters.departmentId);
        if (filters.assigneeId) params.assigneeId = filters.assigneeId;
        if (filters.title) params.search = filters.title;
        if (selectedFilters.priority) params.priority = selectedFilters.priority;
        if (selectedFilters.isOnTime !== undefined) params.isOnTime = String(selectedFilters.isOnTime);
        if (selectedFilters.createdBy) params.createdBy = selectedFilters.createdBy;
        if (selectedFilters.isJdTask !== undefined) params.isJdTask = String(selectedFilters.isJdTask);
        params.view = viewMode;
        setSearchParams(params, { replace: true });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filters, selectedFilters, viewMode]);

    const departmentGroups = useMemo(() => report?.departmentGroups || [], [report]);

    const allEmployeeGroups = useMemo(() => {
        if (!report?.departmentGroups) return [];
        const empMap = new Map<string, any>();
        for (const dept of report.departmentGroups) {
            for (const emp of dept.employeeGroups || []) {
                const key = `${emp.assigneeId || "unassigned"}_${dept.departmentId}`;
                empMap.set(key, {
                    ...emp,
                    departmentName: dept.departmentName,
                    companyName: dept.companyName,
                });
            }
        }
        return Array.from(empMap.values());
    }, [report]);

    const allTasks = useMemo(() => {
        if (!report?.departmentGroups) return [];
        const tasks: any[] = [];
        for (const dept of report.departmentGroups) {
            for (const emp of dept.employeeGroups || []) {
                for (const t of emp.tasks || []) {
                    tasks.push({
                        ...t,
                        assigneeName: emp.assigneeName,
                        assigneeAvatar: emp.assigneeAvatar,
                        departmentName: dept.departmentName,
                        companyName: dept.companyName,
                    });
                }
            }
        }
        return tasks;
    }, [report]);

    const priorityChartData = useMemo(() => {
        const counts: Record<string, number> = {};
        for (const t of allTasks) {
            const p = t.priority || "MEDIUM";
            counts[p] = (counts[p] || 0) + 1;
        }
        return Object.entries(counts).map(([priority, value]) => ({
            name: TASK_PRIORITY_META[priority as keyof typeof TASK_PRIORITY_META]?.label || priority,
            priority,
            value,
        }));
    }, [allTasks]);

    const topDepartmentChartData = useMemo(() => {
        return [...departmentGroups]
            .sort((a, b) => (b.taskCount || 0) - (a.taskCount || 0))
            .slice(0, 5)
            .map((d) => ({ name: d.departmentName, value: d.taskCount }));
    }, [departmentGroups]);

    const filterFields: FilterField[] = useMemo(() => [
        {
            key: "priority",
            label: "Độ ưu tiên",
            options: Object.entries(TASK_PRIORITY_META).map(([value, meta]) => ({
                label: meta.label,
                value,
                color: meta.color,
            })),
        },
        {
            key: "isOnTime",
            label: "Tiến độ đúng hạn",
            options: [
                { label: "Đúng hạn", value: "true", color: "green" },
                { label: "⚠️ Trễ hạn", value: "false", color: "red" },
            ],
        },
        {
            key: "createdBy",
            label: "Người giao việc",
            asyncOptions: async () => {
                const res = await callFetchUser("page=1&size=100");
                return (res?.data?.result || []).map((u: any) => ({
                    label: u.name || u.email,
                    value: u.id,
                    color: "purple",
                }));
            },
            searchable: true,
        },
        {
            key: "isJdTask",
            label: "Loại công việc",
            options: [
                { label: "Trong JD", value: "true", color: "blue" },
                { label: "Ngoài JD", value: "false", color: "orange" },
            ],
        },
    ], []);

    const handleExportExcel = async () => {
        try {
            const blob = await exportMutation.mutateAsync(filters);
            const url = window.URL.createObjectURL(new Blob([blob as any]));
            const link = document.createElement("a");
            link.href = url;
            const fileName = `bao-cao-tong-ket-cong-viec_${dayjs().format("YYYY-MM-DD")}.xlsx`;
            link.setAttribute("download", fileName);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (err) {
            // Error handled in hook
        }
    };

    const taskColumns = [
        {
            title: "Tên tác vụ",
            dataIndex: "title",
            key: "title",
            minWidth: 200,
            fixed: "left" as const,
            render: (text: string, record: any) => (
                <a onClick={() => handleDetailClick(record)} style={{ fontWeight: 600, color: "#1e293b" }}>{text}</a>
            ),
        },
        {
            title: "Người thực hiện",
            dataIndex: "assigneeName",
            key: "assigneeName",
            width: 170,
            onHeaderCell: () => ({ style: { whiteSpace: "nowrap" } }),
            render: (name: string, record: any) => (
                <Space size={6}>
                    <Avatar src={record.assigneeAvatar} icon={<UserOutlined />} size="small" style={{ backgroundColor: "#1890ff" }} />
                    <Text strong style={{ fontSize: 13, whiteSpace: "nowrap" }}>{name || record.assigneeEmail || "Chưa phân công"}</Text>
                </Space>
            ),
        },
        {
            title: "Phòng ban",
            dataIndex: "departmentName",
            key: "departmentName",
            width: 160,
            onHeaderCell: () => ({ style: { whiteSpace: "nowrap" } }),
            render: (text: string) => <Text style={{ whiteSpace: "nowrap" }}>{text || "--"}</Text>,
        },
        {
            title: "Loại công việc",
            key: "isJdTask",
            width: 140,
            align: "center" as const,
            onHeaderCell: () => ({ style: { whiteSpace: "nowrap" } }),
            render: (_: any, record: any) => (
                <Tag color={record.isJdTask !== false ? "blue" : "orange"}>
                    {record.isJdTask !== false ? "Trong JD" : "Ngoài JD"}
                </Tag>
            ),
        },
        {
            title: "Trạng thái",
            dataIndex: "status",
            key: "status",
            width: 130,
            align: "center" as const,
            onHeaderCell: () => ({ style: { whiteSpace: "nowrap" } }),
            render: (status: any, record: any) => renderTaskStatusTag(status, record.overdue),
        },
        {
            title: "Độ ưu tiên",
            dataIndex: "priority",
            key: "priority",
            width: 110,
            align: "center" as const,
            onHeaderCell: () => ({ style: { whiteSpace: "nowrap" } }),
            sorter: (a: any, b: any) => (a.priority || "").localeCompare(b.priority || ""),
            render: (priority: any) => renderTaskPriorityTag(priority),
        },
        {
            title: "Ngày bắt đầu",
            dataIndex: "startDate",
            key: "startDate",
            width: 140,
            align: "center" as const,
            onHeaderCell: () => ({ style: { whiteSpace: "nowrap" } }),
            sorter: (a: any, b: any) => dayjs(a.startDate).valueOf() - dayjs(b.startDate).valueOf(),
            render: (date: string) => <span style={{ whiteSpace: "nowrap" }}>{formatDateTime(date)}</span>,
        },
        {
            title: "Hạn chót",
            dataIndex: "dueDate",
            key: "dueDate",
            width: 140,
            align: "center" as const,
            onHeaderCell: () => ({ style: { whiteSpace: "nowrap" } }),
            sorter: (a: any, b: any) => dayjs(a.dueDate).valueOf() - dayjs(b.dueDate).valueOf(),
            render: (date: string) => <span style={{ whiteSpace: "nowrap" }}>{formatDateTime(date)}</span>,
        },
        {
            title: "Ngày hoàn thành",
            dataIndex: "completedAt",
            key: "completedAt",
            width: 140,
            align: "center" as const,
            onHeaderCell: () => ({ style: { whiteSpace: "nowrap" } }),
            sorter: (a: any, b: any) => dayjs(a.completedAt).valueOf() - dayjs(b.completedAt).valueOf(),
            render: (date: string) => <span style={{ whiteSpace: "nowrap" }}>{formatDateTime(date)}</span>,
        },
        {
            title: "Đúng hạn",
            dataIndex: "isOnTime",
            key: "isOnTime",
            width: 110,
            align: "center" as const,
            onHeaderCell: () => ({ style: { whiteSpace: "nowrap" } }),
            sorter: (a: any, b: any) => Number(a.isOnTime) - Number(b.isOnTime),
            render: (isOnTime: boolean) => (
                <Tag color={isOnTime ? "green" : "red"}>
                    {isOnTime ? "Đúng hạn" : "⚠️ Trễ hạn"}
                </Tag>
            ),
        },
        {
            title: <span style={{ whiteSpace: "nowrap" }}>Hành động</span>,
            key: "actions",
            align: "center" as const,
            width: 120,
            fixed: "right" as const,
            onHeaderCell: () => ({ style: { whiteSpace: "nowrap" } }),
            render: (_: any, record: IResTaskDTO) => (
                <ActionButton
                    variant="view"
                    tooltip="Xem chi tiết tác vụ"
                    icon={<EyeOutlined style={{ fontSize: 16 }} />}
                    aria-label="Xem chi tiết"
                    onClick={() => handleDetailClick(record)}
                />
            ),
        },
    ];

    const employeeColumns = [
        {
            title: "Nhân viên",
            dataIndex: "assigneeName",
            key: "assigneeName",
            fixed: "left" as const,
            render: (text: string, record: any) => (
                <Space>
                    <Avatar src={record.assigneeAvatar} icon={<UserOutlined />} size="small" style={{ backgroundColor: "#1890ff" }} />
                    <Text strong>{text || "Chưa phân công"}</Text>
                </Space>
            ),
        },
        {
            title: "Phòng ban / Đơn vị",
            key: "deptCompany",
            render: (_: any, record: any) => (
                <div>
                    <Text strong style={{ fontSize: 13, color: "#1e293b" }}>{record.departmentName || "--"}</Text>
                    {record.companyName && (
                        <Text type="secondary" style={{ display: "block", fontSize: 11 }}>{record.companyName}</Text>
                    )}
                </div>
            ),
        },
        {
            title: "Tổng tác vụ",
            dataIndex: "taskCount",
            key: "taskCount",
            width: 120,
            align: "center" as const,
            sorter: (a: any, b: any) => (a.taskCount || 0) - (b.taskCount || 0),
            render: (count: number) => <Tag color="blue">{count} tác vụ</Tag>,
        },
        {
            title: "Phân loại Tiến độ",
            key: "progressBreakdown",
            width: 220,
            align: "center" as const,
            render: (_: any, record: any) => {
                const total = record.taskCount || 0;
                const onTime = record.onTimeCount ?? Math.round((total * (record.onTimePercentage || 0)) / 100);
                const late = Math.max(0, total - onTime);
                return (
                    <Space size={4}>
                        <Tag color="green">{onTime} đúng hạn</Tag>
                        {late > 0 ? <Tag color="volcano">⚠️ {late} trễ hạn</Tag> : <Tag color="default">0 trễ</Tag>}
                    </Space>
                );
            },
        },
        {
            title: "Tiến độ KPI",
            dataIndex: "onTimePercentage",
            key: "kpiProgress",
            width: 180,
            sorter: (a: any, b: any) => (a.onTimePercentage || 0) - (b.onTimePercentage || 0),
            render: (pct: number) => {
                const val = Math.round(pct || 0);
                const color = val >= 80 ? "#52c41a" : (val >= 50 ? "#faad14" : "#ff4d4f");
                return <Progress percent={val} size="small" strokeColor={color} />;
            },
        },
        {
            title: "Đánh giá cá nhân",
            key: "performanceGrade",
            width: 140,
            align: "center" as const,
            render: (_: any, record: any) => {
                const pct = record.onTimePercentage || 0;
                if (pct >= 90) return <Tag color="success">Xuất sắc</Tag>;
                if (pct >= 70) return <Tag color="processing">Đạt yêu cầu</Tag>;
                return <Tag color="warning">Cần cải thiện</Tag>;
            },
        },
        {
            title: <span style={{ whiteSpace: "nowrap" }}>Hành động</span>,
            key: "actions",
            align: "center" as const,
            width: 120,
            fixed: "right" as const,
            onHeaderCell: () => ({ style: { whiteSpace: "nowrap" } }),
            render: (_: any, record: any) => (
                <ActionButton
                    variant="view"
                    tooltip="Xem chi tiết tác vụ"
                    icon={<EyeOutlined style={{ fontSize: 16 }} />}
                    aria-label="Xem chi tiết"
                    onClick={() => {
                        const tasks: IResTaskDTO[] = record.tasks || [];
                        if (tasks.length > 0) {
                            handleDetailClick(tasks[0]);
                        }
                    }}
                />
            ),
        },
    ];

    const departmentColumns = [
        {
            title: "Phòng ban",
            dataIndex: "departmentName",
            key: "departmentName",
            fixed: "left" as const,
            render: (text: string) => (
                <Space>
                    <ApartmentOutlined style={{ color: "#1890ff" }} />
                    <Text strong>{text}</Text>
                </Space>
            ),
        },
        {
            title: "Công ty",
            dataIndex: "companyName",
            key: "companyName",
            render: (text: string) => text || "--",
        },
        {
            title: "Tổng tác vụ",
            dataIndex: "taskCount",
            key: "taskCount",
            width: 120,
            align: "center" as const,
            sorter: (a: any, b: any) => (a.taskCount || 0) - (b.taskCount || 0),
            render: (count: number) => <Tag color="blue">{count} tác vụ</Tag>,
        },
        {
            title: "Phân loại Tiến độ",
            key: "progressBreakdown",
            width: 220,
            align: "center" as const,
            render: (_: any, record: any) => {
                const total = record.taskCount || 0;
                const onTime = record.onTimeCount ?? Math.round((total * (record.onTimePercentage || 0)) / 100);
                const late = Math.max(0, total - onTime);
                return (
                    <Space size={4}>
                        <Tag color="green">{onTime} đúng hạn</Tag>
                        {late > 0 ? <Tag color="volcano">⚠️ {late} trễ hạn</Tag> : <Tag color="default">0 trễ</Tag>}
                    </Space>
                );
            },
        },
        {
            title: "Tiến độ KPI",
            dataIndex: "onTimePercentage",
            key: "kpiProgress",
            width: 180,
            sorter: (a: any, b: any) => (a.onTimePercentage || 0) - (b.onTimePercentage || 0),
            render: (pct: number) => {
                const val = Math.round(pct || 0);
                const color = val >= 80 ? "#52c41a" : (val >= 50 ? "#faad14" : "#ff4d4f");
                return <Progress percent={val} size="small" strokeColor={color} />;
            },
        },
        {
            title: "Đánh giá phòng ban",
            key: "performanceGrade",
            width: 150,
            align: "center" as const,
            render: (_: any, record: any) => {
                const pct = record.onTimePercentage || 0;
                if (pct >= 90) return <Tag color="success">Xuất sắc</Tag>;
                if (pct >= 70) return <Tag color="processing">Đạt yêu cầu</Tag>;
                return <Tag color="warning">Cần cải thiện</Tag>;
            },
        },
        {
            title: <span style={{ whiteSpace: "nowrap" }}>Hành động</span>,
            key: "actions",
            align: "center" as const,
            width: 120,
            fixed: "right" as const,
            onHeaderCell: () => ({ style: { whiteSpace: "nowrap" } }),
            render: (_: any, record: any) => (
                <ActionButton
                    variant="view"
                    tooltip="Xem chi tiết tác vụ"
                    icon={<EyeOutlined style={{ fontSize: 16 }} />}
                    aria-label="Xem chi tiết"
                    onClick={() => {
                        const allTasks: IResTaskDTO[] = (record.employeeGroups || []).flatMap((eg: any) => eg.tasks || []);
                        if (allTasks.length > 0) {
                            handleDetailClick(allTasks[0]);
                        }
                    }}
                />
            ),
        },
    ];

    return (
        <PageContainer
            title="Báo Cáo Tổng Kết & KPI Tác Vụ"
            extra={
                <Space wrap align="center">
                    {dataUpdatedAt ? (
                        <Text type="secondary" style={{ fontSize: 12 }}>
                            Cập nhật lúc {dayjs(dataUpdatedAt).format("HH:mm:ss DD/MM/YYYY")}
                        </Text>
                    ) : null}
                    <Button
                        icon={<ReloadOutlined />}
                        onClick={() => refetch()}
                        loading={isFetching}
                        style={{ borderRadius: 8, height: 36 }}
                    >
                        Làm mới
                    </Button>
                    {canExportPerm ? (
                        <Button
                            icon={<DownloadOutlined />}
                            onClick={handleExportExcel}
                            loading={exportMutation.isPending}
                            style={{
                                borderRadius: 8,
                                height: 36,
                                color: "#389e0d",
                                borderColor: "#b7eb8f",
                                backgroundColor: "#f6ffed",
                            }}
                        >
                            Xuất File Excel (.xlsx)
                        </Button>
                    ) : null}
                </Space>
            }
        >
            {report ? (
                <div>
                    {/* 1. Overall Stat Cards at the very top */}
                    <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
                        <Col xs={24} sm={12} md={6}>
                            <StatCard
                                title="Tổng số tác vụ"
                                value={report.totalTaskCount}
                                variant="purple"
                                icon={<UnorderedListOutlined />}
                            />
                        </Col>
                        <Col xs={24} sm={12} md={6}>
                            <StatCard
                                title="Đã hoàn thành"
                                value={report.completedTaskCount}
                                variant="completion"
                                icon={<CheckSquareOutlined />}
                            />
                        </Col>
                        <Col xs={24} sm={12} md={6}>
                            <StatCard
                                title="Hoàn thành đúng hạn"
                                value={report.onTimeTaskCount}
                                variant="average"
                                icon={<CheckCircleOutlined />}
                            />
                        </Col>
                        <Col xs={24} sm={12} md={6}>
                            <StatCard
                                title="Tỷ lệ đúng hạn khóa"
                                value={`${Math.round(report.onTimePercentage || 0)}%`}
                                variant="excellent"
                                icon={<CheckOutlined />}
                            />
                        </Col>
                    </Row>

                    {/* 2. Advanced Search & Filter Bar */}
                    <Card size="small" style={{ marginBottom: 20, borderRadius: 12 }}>
                        <Row gutter={[12, 12]} align="bottom" wrap>
                            <Col xs={24} sm={12} md="auto">
                                <Text strong style={{ display: "block", marginBottom: 4, fontSize: 12 }}>
                                    Khoảng thời gian
                                </Text>
                                <RangePicker
                                    value={dateRange as any}
                                    onChange={(val) => setDateRange(val as any)}
                                    style={{ height: 36, width: "100%" }}
                                    format="DD/MM/YYYY"
                                    presets={[
                                        { label: "Hôm nay", value: [dayjs().startOf("day"), dayjs().endOf("day")] },
                                        { label: "Tuần này", value: [dayjs().startOf("week"), dayjs().endOf("week")] },
                                        { label: "Tháng này", value: [dayjs().startOf("month"), dayjs().endOf("month")] },
                                        {
                                            label: "Quý này",
                                            value: [
                                                dayjs().startOf("month").subtract(dayjs().month() % 3, "month"),
                                                dayjs().startOf("month").subtract(dayjs().month() % 3, "month").add(2, "month").endOf("month"),
                                            ],
                                        },
                                        { label: "Năm nay", value: [dayjs().startOf("year"), dayjs().endOf("year")] },
                                    ]}
                                />
                            </Col>
                            <Col xs={24} sm={12} md="auto">
                                <Text strong style={{ display: "block", marginBottom: 4, fontSize: 12 }}>
                                    Công ty
                                </Text>
                                <Select
                                    allowClear
                                    showSearch
                                    placeholder="Tất cả công ty"
                                    style={{ height: 36, width: "100%", minWidth: 200 }}
                                    popupMatchSelectWidth={false}
                                    options={companyOptions}
                                    value={companyId}
                                    onChange={handleCompanyChange}
                                    optionFilterProp="label"
                                />
                            </Col>
                            <Col xs={24} sm={12} md="auto">
                                <Text strong style={{ display: "block", marginBottom: 4, fontSize: 12 }}>
                                    Phòng ban
                                </Text>
                                <Select
                                    allowClear
                                    showSearch
                                    placeholder="Tất cả phòng ban"
                                    style={{ height: 36, width: "100%", minWidth: 220 }}
                                    popupMatchSelectWidth={false}
                                    options={departmentOptions}
                                    value={departmentId}
                                    onChange={handleDepartmentChange}
                                    optionFilterProp="label"
                                />
                            </Col>
                            <Col xs={24} sm={12} md="auto">
                                <Text strong style={{ display: "block", marginBottom: 4, fontSize: 12 }}>
                                    Người thực hiện
                                </Text>
                                <Select
                                    allowClear
                                    showSearch
                                    placeholder="Tất cả người thực hiện"
                                    style={{ height: 36, width: "100%", minWidth: 200 }}
                                    popupMatchSelectWidth={false}
                                    options={assigneeOptions}
                                    value={assigneeId}
                                    onChange={(value) => setAssigneeId(value)}
                                    optionFilterProp="label"
                                />
                            </Col>
                            <Col xs={24} sm={24} flex="1 1 220px">
                                <Text strong style={{ display: "block", marginBottom: 4, fontSize: 12 }}>
                                    Tìm kiếm
                                </Text>
                                <Input
                                    placeholder="Tìm theo tên tác vụ..."
                                    prefix={<SearchOutlined style={{ color: "#9ca3af" }} />}
                                    allowClear
                                    style={{ height: 36, width: "100%" }}
                                    value={searchInput}
                                    onChange={(e) => setSearchInput(e.target.value)}
                                />
                            </Col>
                            <Col xs={24} sm={12} md="auto">
                                <Text strong style={{ display: "block", marginBottom: 4, fontSize: 12 }}>
                                    Bộ lọc
                                </Text>
                                <AdvancedFilterSelect
                                    fields={filterFields}
                                    onChange={(newFilters) => setSelectedFilters(newFilters)}
                                />
                            </Col>
                        </Row>
                    </Card>

                    {/* 2b. Biểu đồ trực quan */}
                    <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
                        <Col xs={24} md={12}>
                            <Card size="small" title="Phân bố theo Độ ưu tiên" style={{ borderRadius: 12 }}>
                                <Pie
                                    data={priorityChartData}
                                    angleField="value"
                                    colorField="name"
                                    height={220}
                                    label={{ text: "value" }}
                                />
                            </Card>
                        </Col>
                        <Col xs={24} md={12}>
                            <Card size="small" title="Top 5 Phòng ban theo Tổng tác vụ" style={{ borderRadius: 12 }}>
                                <Column
                                    data={topDepartmentChartData}
                                    xField="name"
                                    yField="value"
                                    height={220}
                                />
                            </Card>
                        </Col>
                    </Row>

                    {/* 3. Rich Summary Table with Segmented View Mode */}
                    <Card size="small" style={{ borderRadius: 12 }}>
                        <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", justifyContent: "space-between", alignItems: isMobile ? "stretch" : "center", marginBottom: 16, flexWrap: "wrap", gap: 12 }}>
                            <Text strong style={{ fontSize: 14 }}>
                                Chi tiết báo cáo công việc
                            </Text>
                            <Segmented
                                value={viewMode}
                                onChange={(val) => setViewMode(val as any)}
                                size={isMobile ? "small" : "middle"}
                                style={isMobile ? { width: "100%" } : undefined}
                                block={isMobile}
                                options={[
                                    { label: isMobile ? "Nhân viên" : "Theo Nhân viên", value: "employee" },
                                    { label: isMobile ? "Phòng ban" : "Theo Phòng ban", value: "department" },
                                    { label: isMobile ? "Tác vụ" : "Danh sách Tác vụ", value: "task" },
                                ]}
                            />
                        </div>

                        {(() => {
                            const activeDataSource =
                                viewMode === "employee" ? allEmployeeGroups
                                    : viewMode === "department" ? departmentGroups
                                        : allTasks;
                            const emptyText =
                                viewMode === "employee" ? "Chưa có dữ liệu nhân viên trong kỳ này."
                                    : viewMode === "department" ? "Chưa có tác vụ hoàn thành trong kỳ này."
                                        : "Chưa có tác vụ nào trong kỳ này.";

                            if (isMobile) {
                                const start = (mobilePage - 1) * mobilePageSize;
                                const pageData = activeDataSource.slice(start, start + mobilePageSize);
                                return activeDataSource.length === 0 ? (
                                    <Empty description={emptyText} />
                                ) : (
                                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                                        {pageData.map((record: any, idx: number) => (
                                            <SummaryReportMobileCard
                                                key={`${record.id || record.assigneeId || record.departmentId || "row"}_${idx}`}
                                                viewMode={viewMode}
                                                record={record}
                                                onView={() => {
                                                    if (viewMode === "task") {
                                                        handleDetailClick(record);
                                                    } else {
                                                        const tasks: IResTaskDTO[] =
                                                            record.tasks || (record.employeeGroups || []).flatMap((eg: any) => eg.tasks || []);
                                                        if (tasks.length > 0) handleDetailClick(tasks[0]);
                                                    }
                                                }}
                                            />
                                        ))}
                                        {activeDataSource.length > mobilePageSize && (
                                            <div style={{ display: "flex", justifyContent: "center", marginTop: 12 }}>
                                                <Pagination
                                                    simple
                                                    size="small"
                                                    current={mobilePage}
                                                    pageSize={mobilePageSize}
                                                    total={activeDataSource.length}
                                                    onChange={(p) => setMobilePage(p)}
                                                />
                                            </div>
                                        )}
                                    </div>
                                );
                            }

                            if (viewMode === "employee") {
                                return (
                                    <Table
                                        key="employee"
                                        rowKey={(r: any) => `${r.assigneeId || "unassigned"}_${r.departmentId}`}
                                        columns={employeeColumns}
                                        dataSource={allEmployeeGroups}
                                        pagination={{ pageSize: 20, showSizeChanger: true }}
                                        scroll={{ x: 900 }}
                                        locale={{ emptyText }}
                                    />
                                );
                            }

                            if (viewMode === "department") {
                                return (
                                    <Table
                                        key="department"
                                        rowKey="departmentId"
                                        columns={departmentColumns}
                                        dataSource={departmentGroups}
                                        pagination={{ pageSize: 20, showSizeChanger: true }}
                                        scroll={{ x: 900 }}
                                        locale={{ emptyText }}
                                    />
                                );
                            }

                            return (
                                <Table
                                    key="task"
                                    rowKey="id"
                                    columns={taskColumns}
                                    dataSource={allTasks}
                                    pagination={{ pageSize: 20, showSizeChanger: true }}
                                    locale={{ emptyText }}
                                    scroll={{ x: 1300 }}
                                />
                            );
                        })()}
                    </Card>
                </div>
            ) : (
                <Card style={{ textAlign: "center", padding: 40 }}>
                    {isLoading ? <p>Đang tổng hợp báo cáo...</p> : <p>Không tìm thấy dữ liệu báo cáo</p>}
                </Card>
            )}

            <TaskDetailDrawer
                open={detailDrawerOpen}
                taskId={selectedTask?.id || null}
                onClose={() => setDetailDrawerOpen(false)}
                onEdit={() => {
                    setDetailDrawerOpen(false);
                    setFormDrawerOpen(true);
                }}
                user={user}
                perms={perms}
            />

            <TaskFormDrawer
                open={formDrawerOpen}
                task={selectedTask}
                onClose={() => {
                    setFormDrawerOpen(false);
                    refetch();
                }}
            />
        </PageContainer>
    );
};

export default TaskSummaryReportPage;
