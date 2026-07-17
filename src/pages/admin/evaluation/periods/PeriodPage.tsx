import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { Space, Tag, Popconfirm, Button, Typography, Tooltip, Badge, Dropdown } from "antd";
import { notify } from "@/components/common/notification/notify";
import {
    EditOutlined,
    CheckCircleOutlined,
    PoweroffOutlined,
    ClockCircleOutlined,
    CheckOutlined,
    SyncOutlined,
    StopOutlined,
    WarningOutlined,
    BarChartOutlined,
    MoreOutlined,
    EyeOutlined,
    SettingOutlined,
} from "@ant-design/icons";
import useAccess from "@/hooks/useAccess";
import { useAppSelector } from "@/redux/hooks";
import type { ProColumns, ActionType } from "@ant-design/pro-components";
import type { MenuProps } from "antd";
import queryString from "query-string";
import dayjs from "dayjs";

import PageContainer from "@/components/common/data-table/PageContainer";
import DataTable from "@/components/common/data-table";
import ActionButton from "@/components/common/ui/ActionButton";
import SearchFilter from "@/components/common/filter/SearchFilter";
import AdvancedFilterSelect from "@/components/common/filter/AdvancedFilterSelect";

import type { IEvaluationPeriod } from "@/types/backend";
import Access from "@/components/share/access";
import { ALL_PERMISSIONS } from "@/config/permissions";
import { PAGINATION_CONFIG } from "@/config/pagination";
import {
    callFetchEvaluationPeriods,
    callActivateEvaluationPeriod,
    callCloseEvaluationPeriod,
} from "@/config/api";
import PeriodModal from "./PeriodModal";
import PeriodDetailDrawer from "./PeriodDetailDrawer";
import PeriodProgressDrawer from "./PeriodProgressDrawer";
import { fetchPeriodCompanyOptions, PERIOD_COMPANY_OPTIONS_QUERY_KEY } from "@/hooks/useEvaluationPeriodReferenceData";

const getDiffString = (from: dayjs.Dayjs, to: dayjs.Dayjs) => {
    const diffMs = to.diff(from);
    if (diffMs <= 0) return "0 phút";
    const diffDays = to.diff(from, "day");
    if (diffDays > 0) {
        const hours = to.diff(from, "hour") % 24;
        if (hours === 0) return `${diffDays} ngày`;
        return `${diffDays} ngày ${hours} giờ`;
    }
    const diffHours = to.diff(from, "hour");
    if (diffHours > 0) {
        const mins = to.diff(from, "minute") % 60;
        if (mins === 0) return `${diffHours} giờ`;
        return `${diffHours} giờ ${mins} phút`;
    }
    const diffMins = to.diff(from, "minute");
    return `${diffMins} phút`;
};

type PhaseType = "none" | "employee" | "manager" | "approval" | "all_closed";
type BadgeType = "draft" | "active" | "closed" | "upcoming" | "overdue" | "intime";

interface PhaseInfo {
    activePhase: PhaseType;
    phaseLabel: string;
    deadline: string;
    countdown: string;
    badgeType: BadgeType;
    badgeText: string;
    isOverdue: boolean;
}

const getPhaseInfo = (record: IEvaluationPeriod): PhaseInfo => {
    const now = dayjs();
    const start = record.employeeStartDate ? dayjs(record.employeeStartDate) : null;
    const empDeadline = record.employeeDeadline ? dayjs(record.employeeDeadline) : null;
    const mgrDeadline = record.managerDeadline ? dayjs(record.managerDeadline) : null;
    const appDeadline = record.approvalDeadline ? dayjs(record.approvalDeadline) : null;

    if (record.status === "DRAFT") {
        return { activePhase: "none", phaseLabel: "Chưa kích hoạt", deadline: "", countdown: "", badgeType: "draft", badgeText: "Bản nháp", isOverdue: false };
    }
    if (record.status === "CLOSED") {
        return { activePhase: "all_closed", phaseLabel: "Đã kết thúc", deadline: "", countdown: "", badgeType: "closed", badgeText: "Đã đóng", isOverdue: false };
    }

    if (!start || !empDeadline || !mgrDeadline || !appDeadline) {
        return { activePhase: "none", phaseLabel: "Chưa cấu hình đầy đủ", deadline: "", countdown: "", badgeType: "draft", badgeText: "Thiếu cấu hình", isOverdue: false };
    }

    if (now.isBefore(start)) {
        return { activePhase: "none", phaseLabel: "Sắp mở cổng nhân viên đánh giá", deadline: start.format("DD/MM/YYYY HH:mm"), countdown: `Mở sau ${getDiffString(now, start)}`, badgeType: "upcoming", badgeText: "Sắp mở", isOverdue: false };
    }
    if (now.isBefore(empDeadline)) {
        return { activePhase: "employee", phaseLabel: "Nhân viên đánh giá", deadline: empDeadline.format("DD/MM/YYYY HH:mm"), countdown: `Còn ${getDiffString(now, empDeadline)}`, badgeType: "active", badgeText: "Đang diễn ra", isOverdue: false };
    }
    if (now.isBefore(mgrDeadline)) {
        return { activePhase: "manager", phaseLabel: "Quản lý chấm điểm", deadline: mgrDeadline.format("DD/MM/YYYY HH:mm"), countdown: `Còn ${getDiffString(now, mgrDeadline)}`, badgeType: "intime", badgeText: "Đang diễn ra", isOverdue: false };
    }
    if (now.isBefore(appDeadline)) {
        return { activePhase: "approval", phaseLabel: "Ban lãnh đạo phê duyệt", deadline: appDeadline.format("DD/MM/YYYY HH:mm"), countdown: `Còn ${getDiffString(now, appDeadline)}`, badgeType: "intime", badgeText: "Đang diễn ra", isOverdue: false };
    }
    return { activePhase: "all_closed", phaseLabel: "Quá hạn phê duyệt", deadline: appDeadline.format("DD/MM/YYYY HH:mm"), countdown: `Trễ ${getDiffString(appDeadline, now)}`, badgeType: "overdue", badgeText: "Quá hạn", isOverdue: true };
};

const PHASE_CONFIG = {
    employee: { label: "NV đánh giá", color: "#52c41a", bg: "#f6ffed", border: "#b7eb8f" },
    manager: { label: "Quản lý chấm", color: "#1677ff", bg: "#e6f4ff", border: "#91caff" },
    approval: { label: "Lãnh đạo duyệt", color: "#722ed1", bg: "#f9f0ff", border: "#d3adf7" },
};

const PhaseStep = React.memo(({ phase, activePhase, status }: { phase: "employee" | "manager" | "approval"; activePhase: PhaseType; status: string }) => {
    const cfg = PHASE_CONFIG[phase];
    const phaseOrder = { employee: 0, manager: 1, approval: 2 };
    const activeOrder = { none: -1, employee: 0, manager: 1, approval: 2, all_closed: 3 };

    // Đây là lịch của kỳ, không phải trạng thái hoàn thành của từng nhân viên.
    // Không hiển thị dấu "đã xong" chỉ dựa theo mốc thời gian để tránh hiểu sai nghiệp vụ.
    const isPast = status === "CLOSED" || activeOrder[activePhase] > phaseOrder[phase];
    const isActive = activePhase === phase;
    const isUpcoming = !isPast && !isActive;

    let dotColor = "#d9d9d9";
    let textColor = "#bfbfbf";
    let fontWeight: "400" | "600" = "400";

    if (isPast) { dotColor = "#94a3b8"; textColor = "#64748b"; }
    if (isActive) { dotColor = cfg.color; textColor = cfg.color; fontWeight = "600"; }
    if (isUpcoming && status === "DRAFT") { dotColor = "#d9d9d9"; textColor = "#bfbfbf"; }

    return (
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <div style={{
                width: 7, height: 7, borderRadius: "50%",
                background: dotColor,
                flexShrink: 0,
                boxShadow: isActive ? `0 0 0 2px ${cfg.color}33` : "none",
            }} />
            <span style={{ fontSize: 11, color: textColor, fontWeight, whiteSpace: "nowrap" }}>
                {cfg.label}
            </span>
        </div>
    );
});

const renderTimelineCell = (record: IEvaluationPeriod) => {
    const info = getPhaseInfo(record);

    const badgeConfig: Record<BadgeType, { color: string; bg: string; border: string; icon: React.ReactNode }> = {
        draft: { color: "#8c8c8c", bg: "#fafafa", border: "#d9d9d9", icon: <ClockCircleOutlined /> },
        active: { color: "#389e0d", bg: "#f6ffed", border: "#b7eb8f", icon: <SyncOutlined /> },
        intime: { color: "#1677ff", bg: "#e6f4ff", border: "#91caff", icon: <SyncOutlined /> },
        upcoming: { color: "#d46b08", bg: "#fff7e6", border: "#ffd591", icon: <ClockCircleOutlined /> },
        closed: { color: "#595959", bg: "#f5f5f5", border: "#d9d9d9", icon: <CheckOutlined /> },
        overdue: { color: "#cf1322", bg: "#fff1f0", border: "#ffa39e", icon: <WarningOutlined /> },
    };

    const badge = badgeConfig[info.badgeType];

    const hasTimeline = !!(record.employeeStartDate && record.employeeDeadline && record.managerDeadline && record.approvalDeadline);

    const tooltipContent = hasTimeline ? (
        <div style={{ fontSize: 12, lineHeight: "22px", color: "#1e293b" }}>
            <div style={{
                fontWeight: 700,
                marginBottom: 8,
                fontSize: 12,
                borderBottom: "1px solid #e2e8f0",
                paddingBottom: 6,
                letterSpacing: "0.5px",
                textTransform: "uppercase",
                color: "#64748b"
            }}>
                Mốc thời gian
            </div>
            {[
                { label: "Mở cổng nhân viên đánh giá", date: record.employeeStartDate },
                { label: "Hạn nhân viên nộp", date: record.employeeDeadline },
                { label: "Hạn quản lý chấm", date: record.managerDeadline },
                { label: "Hạn lãnh đạo duyệt", date: record.approvalDeadline },
            ].map(({ label, date }) => (
                <div key={label} style={{ display: "flex", justifyContent: "space-between", gap: 20, marginBottom: 4 }}>
                    <span style={{ color: "#64748b" }}>{label}</span>
                    <span style={{ color: "#0f172a", fontWeight: 600, whiteSpace: "nowrap" }}>
                        {dayjs(date).format("DD/MM/YYYY HH:mm")}
                    </span>
                </div>
            ))}
        </div>
    ) : null;

    return (
        <Tooltip
            title={tooltipContent}
            color="white"
            styles={{
                root: { maxWidth: "none" },
                body: {
                    padding: "14px 18px",
                    borderRadius: "10px",
                    boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
                    border: "1px solid #e2e8f0",
                    minWidth: "320px"
                }
            }}
        >
            <div style={{ display: "flex", flexDirection: "column", gap: 6, cursor: hasTimeline ? "help" : "default", padding: "4px 0" }}>
                {/* Phase steps */}
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <PhaseStep phase="employee" activePhase={info.activePhase} status={record.status} />
                    <span style={{ color: "#d9d9d9", fontSize: 10 }}>›</span>
                    <PhaseStep phase="manager" activePhase={info.activePhase} status={record.status} />
                    <span style={{ color: "#d9d9d9", fontSize: 10 }}>›</span>
                    <PhaseStep phase="approval" activePhase={info.activePhase} status={record.status} />
                </div>

                {/* Current phase info */}
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 13, fontWeight: 500, color: "#262626" }}>{info.phaseLabel}</span>
                    {info.countdown && (
                        <span style={{
                            display: "inline-flex", alignItems: "center", gap: 3,
                            fontSize: 11, fontWeight: 600,
                            color: badge.color,
                            background: badge.bg,
                            border: `1px solid ${badge.border}`,
                            borderRadius: 4,
                            padding: "1px 7px",
                            lineHeight: "18px",
                        }}>
                            {badge.icon}
                            {info.countdown}
                        </span>
                    )}
                </div>

                {/* Deadline line */}
                {info.deadline && (
                    <span style={{ fontSize: 11, color: "#8c8c8c" }}>
                        Hạn: {info.deadline}
                    </span>
                )}
            </div>
        </Tooltip>
    );
};

const STATUS_TAG_CONFIG: Record<string, { color: string; text: string; dot: string }> = {
    DRAFT: { color: "default", text: "Bản nháp", dot: "#8c8c8c" },
    ACTIVE: { color: "processing", text: "Đang mở", dot: "#1677ff" },
    CLOSED: { color: "default", text: "Đã đóng", dot: "#8c8c8c" },
};

const StatusTag = React.memo(({ record }: { record: IEvaluationPeriod }) => {
    const cfg = STATUS_TAG_CONFIG[record.status] ?? STATUS_TAG_CONFIG.DRAFT;
    return (
        <Tag color={cfg.color} style={{ borderRadius: 4, fontWeight: 500, fontSize: 12, padding: "1px 10px" }}>
            <Badge color={cfg.dot} style={{ marginRight: 4 }} />
            {cfg.text}
        </Tag>
    );
});

const PeriodPage = () => {
    const queryClient = useQueryClient();
    const [openModal, setOpenModal] = useState(false);
    const [openDrawer, setOpenDrawer] = useState(false);
    const [dataInit, setDataInit] = useState<IEvaluationPeriod | null>(null);
    const [selectedPeriod, setSelectedPeriod] = useState<IEvaluationPeriod | null>(null);
    const [drawerReadOnly, setDrawerReadOnly] = useState(true);
    const [progressPeriodId, setProgressPeriodId] = useState<number | null>(null);
    const [searchParams, setSearchParams] = useSearchParams();
    const progressPeriodIdParam = searchParams.get("progressPeriodId");

    useEffect(() => {
        if (progressPeriodIdParam) {
            setProgressPeriodId(Number(progressPeriodIdParam));
        }
    }, [progressPeriodIdParam]);

    const handleCloseProgressDrawer = useCallback(() => {
        setProgressPeriodId(null);
        if (searchParams.has("progressPeriodId")) {
            const newParams = new URLSearchParams(searchParams);
            newParams.delete("progressPeriodId");
            setSearchParams(newParams, { replace: true });
        }
    }, [searchParams, setSearchParams]);

    const roleName = useAppSelector(state => state.account.user.role?.name?.toUpperCase() || "");
    const canAddTemplate = useAccess(ALL_PERMISSIONS.EVALUATION.ADD_TEMPLATE_TO_PERIOD);
    const canAddEmployee = useAccess(ALL_PERMISSIONS.EVALUATION.ADD_EMPLOYEE_TO_PERIOD);
    const canExtendDeadline = useAccess(ALL_PERMISSIONS.EVALUATION.EXTEND_RECORD_DEADLINE);
    const canReassignEvaluator = useAccess(ALL_PERMISSIONS.EVALUATION.REASSIGN_EVALUATOR);
    const canCancelEmployee = useAccess(ALL_PERMISSIONS.EVALUATION.CANCEL_PERIOD_EMPLOYEE);
    const canManagePeriod = roleName === "SUPER_ADMIN" || canAddTemplate || canAddEmployee || canExtendDeadline || canReassignEvaluator || canCancelEmployee;

    const [searchValue, setSearchValue] = useState("");
    const [statusFilter, setStatusFilter] = useState<string | null>(null);

    const tableRef = useRef<ActionType>(null);
    const paginationRef = useRef({
        current: 1,
        pageSize: PAGINATION_CONFIG.DEFAULT_PAGE_SIZE || 10,
    });

    const buildQuery = (params: any, sort: any) => {
        const q: any = {
            page: params.current,
            size: params.pageSize || PAGINATION_CONFIG.DEFAULT_PAGE_SIZE,
        };
        const filters: string[] = [];
        if (searchValue) filters.push(`name~'${searchValue}'`);
        if (statusFilter !== null) filters.push(`status='${statusFilter}'`);
        if (filters.length > 0) q.filter = filters.join(" and ");
        const temp = queryString.stringify(q, { encode: false });
        let sortBy = "sort=createdAt,desc";
        if (sort?.name) sortBy = sort.name === "ascend" ? "sort=name,asc" : "sort=name,desc";
        return `${temp}&${sortBy}`;
    };

    const handleActivate = useCallback(async (id: number) => {
        try {
            const res = await callActivateEvaluationPeriod(id);
            if (res?.data) {
                notify.success("Kích hoạt thành công! Bản chấm điểm đã được tự động sinh cho toàn bộ nhân viên.");
                tableRef.current?.reload();
            }
        } catch (error: any) {
            notify.error(error?.response?.data?.message || "Lỗi kích hoạt kỳ đánh giá");
        }
    }, []);

    const handleClose = useCallback(async (id: number) => {
        try {
            const res = await callCloseEvaluationPeriod(id);
            if (res?.data) {
                notify.success("Đã đóng kỳ đánh giá.");
                tableRef.current?.reload();
            }
        } catch (error: any) {
            notify.error(error?.response?.data?.message || "Lỗi đóng kỳ đánh giá");
        }
    }, []);

    const handlePeriodDrawerClose = useCallback(() => {
        const shouldReload = !drawerReadOnly;
        setOpenDrawer(false);
        setSelectedPeriod(null);
        setDrawerReadOnly(true);
        if (shouldReload) {
            window.setTimeout(() => tableRef.current?.reload(), 220);
        }
    }, [drawerReadOnly]);

    const columns: ProColumns<IEvaluationPeriod>[] = useMemo(() => [
        {
            title: "STT",
            key: "index",
            width: 55,
            align: "center",
            render: (_text, _record, index) =>
                <span style={{ color: "#8c8c8c", fontSize: 13 }}>
                    {index + 1 + (paginationRef.current.current - 1) * paginationRef.current.pageSize}
                </span>,
        },
        {
            title: "Tên kỳ đánh giá",
            dataIndex: "name",
            render: (val, record) => (
                <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                    <Button
                        type="link"
                        style={{ width: "fit-content", height: "auto", padding: 0, fontWeight: 650, fontSize: 14, color: "#1e293b", textAlign: "left" }}
                        onClick={() => { setSelectedPeriod(record); setDrawerReadOnly(true); setOpenDrawer(true); }}
                        aria-label={`Xem chi tiết kỳ đánh giá ${val}`}
                    >
                        {val}
                    </Button>
                    {record.description && (
                        <span style={{
                            fontSize: 12, color: "#8c8c8c",
                            whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 260,
                        }} title={record.description}>
                            {record.description}
                        </span>
                    )}
                </div>
            ),
        },
        {
            title: "Công ty",
            key: "company",
            width: 150,
            render: (_, record: any) => {
                const compName = record?.company?.name || record?.companyName || (typeof record?.company === 'string' ? record.company : "");
                return (
                    <Typography.Text type="secondary" style={{ fontSize: 13, fontWeight: 500 }}>
                        {compName || "Chưa gán công ty"}
                    </Typography.Text>
                );
            },
        },
        {
            title: "Trạng thái",
            dataIndex: "status",
            width: 145,
            align: "center",
            render: (_, record) => <StatusTag record={record} />,
        },
        {
            title: "Tiến trình",
            key: "timelineProgress",
            width: 380,
            render: (_, record) => renderTimelineCell(record),
        },
        {
            title: "Hành động",
            align: "center",
            width: 140,
            fixed: "right",
            render: (_, entity) => {
                const isDraft = entity.status === "DRAFT";
                const isActive = entity.status === "ACTIVE";
                const menuItems: NonNullable<MenuProps["items"]> = [
                    isDraft && {
                        key: "edit",
                        label: (
                            <Access permission={ALL_PERMISSIONS.EVALUATION.UPDATE_PERIOD} hideChildren>
                                <span>Chỉnh sửa kỳ</span>
                            </Access>
                        ),
                        icon: <EditOutlined />,
                        onClick: () => { setDataInit(entity); setOpenModal(true); },
                    },
                ].filter(Boolean) as NonNullable<MenuProps["items"]>;
                return (
                    <Space size={4}>
                        <Access permission={ALL_PERMISSIONS.EVALUATION.GET_PERIODS} hideChildren>
                            <ActionButton
                                variant="view"
                                tooltip="Xem chi tiết kỳ đánh giá"
                                icon={<EyeOutlined style={{ fontSize: 16 }} />}
                                onClick={() => { setSelectedPeriod(entity); setDrawerReadOnly(true); setOpenDrawer(true); }}
                                aria-label={`Xem chi tiết kỳ đánh giá ${entity.name}`}
                            />
                        </Access>

                        {canManagePeriod && (
                            <ActionButton
                                variant="settings"
                                tooltip="Quản trị nhân sự trong kỳ"
                                icon={<SettingOutlined style={{ fontSize: 16 }} />}
                                onClick={() => { setSelectedPeriod(entity); setDrawerReadOnly(false); setOpenDrawer(true); }}
                                aria-label={`Quản trị kỳ đánh giá ${entity.name}`}
                            />
                        )}

                        {isDraft && entity.id && (
                            <Access permission={ALL_PERMISSIONS.EVALUATION.ACTIVATE_PERIOD} hideChildren>
                                <Popconfirm
                                    title="Kích hoạt kỳ đánh giá?"
                                    description="Hệ thống sẽ tự động sinh bản chấm điểm cho toàn bộ nhân viên tham gia."
                                    onConfirm={() => handleActivate(entity.id!)}
                                    okText="Kích hoạt"
                                    cancelText="Hủy"
                                    okButtonProps={{ type: "primary" }}
                                >
                                    <ActionButton variant="success" tooltip="Kích hoạt kỳ" icon={<CheckCircleOutlined style={{ fontSize: 16 }} />} />
                                </Popconfirm>
                            </Access>
                        )}

                        {isActive && entity.id && (
                            <Access permission={ALL_PERMISSIONS.EVALUATION.CLOSE_PERIOD} hideChildren>
                                <Popconfirm
                                    title="Đóng kỳ đánh giá?"
                                    description="Toàn bộ cổng chấm điểm sẽ bị khóa. Hành động này không thể hoàn tác."
                                    onConfirm={() => handleClose(entity.id!)}
                                    okText="Đóng kỳ"
                                    cancelText="Hủy"
                                    okButtonProps={{ danger: true }}
                                >
                                    <ActionButton variant="danger" tooltip="Đóng kỳ đánh giá" icon={<PoweroffOutlined style={{ fontSize: 16 }} />} />
                                </Popconfirm>
                            </Access>
                        )}

                        {entity.status === "CLOSED" && (
                            <ActionButton tooltip="Kỳ đánh giá đã kết thúc" icon={<StopOutlined style={{ fontSize: 16 }} />} disabled />
                        )}

                        {entity.status !== "DRAFT" && entity.id && (
                            <ActionButton
                                variant="progress"
                                tooltip="Xem tiến độ kỳ đánh giá"
                                icon={<BarChartOutlined style={{ fontSize: 16 }} />}
                                onClick={() => setProgressPeriodId(entity.id!)}
                                aria-label={`Xem tiến độ kỳ đánh giá ${entity.name}`}
                            />
                        )}

                        {menuItems.length > 0 && (
                            <Dropdown menu={{ items: menuItems }} trigger={["click"]} placement="bottomRight">
                                <ActionButton
                                    icon={<MoreOutlined style={{ fontSize: 18 }} />}
                                    aria-label={`Thao tác khác cho kỳ đánh giá ${entity.name}`}
                                />
                            </Dropdown>
                        )}
                    </Space>
                );
            },
        },
    ], [canManagePeriod, handleActivate, handleClose]);

    return (
        <PageContainer
            title="Quản lý kỳ đánh giá"
            filter={
                <div className="flex flex-col gap-3">
                    <SearchFilter
                        searchPlaceholder="Tìm theo tên kỳ đánh giá..."
                        addLabel="Thêm kỳ mới"
                        showFilterButton={false}
                        showResetButton
                        searchValue={searchValue}
                        activeFilterCount={statusFilter ? 1 : 0}
                        onSearch={(val) => setSearchValue(val)}
                        onReset={() => { setSearchValue(""); setStatusFilter(null); }}
                        onAddClick={() => { setDataInit(null); setOpenModal(true); }}
                        onAddPreload={() => {
                            void queryClient.prefetchQuery({
                                queryKey: PERIOD_COMPANY_OPTIONS_QUERY_KEY,
                                queryFn: fetchPeriodCompanyOptions,
                                staleTime: 5 * 60 * 1000,
                            });
                        }}
                        addPermission={ALL_PERMISSIONS.EVALUATION.CREATE_PERIOD}
                    />
                    <AdvancedFilterSelect
                        fields={[
                            {
                                key: "status",
                                label: "Trạng thái kỳ",
                                options: [
                                    { label: "Bản nháp", value: "DRAFT", color: "default" },
                                    { label: "Đang mở", value: "ACTIVE", color: "processing" },
                                    { label: "Đã đóng", value: "CLOSED", color: "default" },
                                ],
                            },
                        ]}
                        onChange={(filters) => setStatusFilter(filters.status !== undefined ? filters.status : null)}
                    />
                </div>
            }
        >
            <Access permission={ALL_PERMISSIONS.EVALUATION.GET_PERIODS}>
                <DataTable<IEvaluationPeriod>
                    actionRef={tableRef}
                    rowKey="id"
                    columns={columns}
                    scroll={{ x: "max-content" }}
                    params={{ searchValue, statusFilter }}
                    request={async (params, sort) => {
                        const q = buildQuery(params, sort);
                        paginationRef.current = {
                            current: params.current || 1,
                            pageSize: params.pageSize || PAGINATION_CONFIG.DEFAULT_PAGE_SIZE || 10,
                        };
                        const res = await callFetchEvaluationPeriods(q);
                        if (res?.data) {
                            return {
                                data: res.data.result ?? [],
                                success: true,
                                total: res.data.meta.total ?? 0,
                            };
                        }
                        return { data: [], success: false };
                    }}
                    pagination={{
                        defaultPageSize: PAGINATION_CONFIG.DEFAULT_PAGE_SIZE,
                        showQuickJumper: true,
                        showTotal: (total, range) => (
                            <span style={{ fontSize: 13 }}>
                                <b>{range[0]}-{range[1]}</b> trên{" "}
                                <b style={{ color: "#1677ff" }}>{total.toLocaleString()}</b> kỳ đánh giá
                            </span>
                        ),
                    }}
                    rowSelection={false}
                />
            </Access>

            {openModal && (
                <PeriodModal
                    openModal={openModal}
                    setOpenModal={setOpenModal}
                    dataInit={dataInit}
                    setDataInit={setDataInit}
                    reloadTable={() => tableRef.current?.reload()}
                />
            )}

            {openDrawer && selectedPeriod && (
                <PeriodDetailDrawer
                    open={openDrawer}
                    onClose={handlePeriodDrawerClose}
                    period={selectedPeriod}
                    readOnly={drawerReadOnly}
                />
            )}

            <PeriodProgressDrawer
                open={progressPeriodId !== null}
                periodId={progressPeriodId ?? undefined}
                onClose={handleCloseProgressDrawer}
            />
        </PageContainer>
    );
};

export default PeriodPage;
