import React, { useEffect, useRef, useState } from "react";
import { Button, Space, Tag, Tooltip } from "antd";
import {
    EyeOutlined,
    EditOutlined,
    ExclamationCircleFilled,
    CheckCircleFilled,
    MinusCircleFilled,
    PlusCircleOutlined,
    FileAddOutlined,
} from "@ant-design/icons";
import type { ProColumns, ActionType } from "@ant-design/pro-components";
import queryString from "query-string";

import PageContainer from "@/components/common/data-table/PageContainer";
import DataTable from "@/components/common/data-table";
import SearchFilter from "@/components/common/filter/SearchFilter";
import AdvancedFilterSelect from "@/components/common/filter/AdvancedFilterSelect";

import { useDepartmentsQuery } from "@/hooks/useDepartments";
import { useDepartmentMissionSummaryQuery } from "@/hooks/useDepartmentObjectives";
import type { IDepartment, IDepartmentMissionSummary, ICompany } from "@/types/backend";
import { PAGINATION_CONFIG } from "@/config/pagination";
import { callFetchCompany } from "@/config/api";

import LotusDetailDrawer from "@/components/common/drawer/LotusDetailDrawer";
import DepartmentMissionDetail from "../objectives-tasks/components/DepartmentMissionDetail";
import { Modal } from "antd";
import { ALL_PERMISSIONS } from "@/config/permissions";
import useAccess from "@/hooks/useAccess";

const { confirm } = Modal;

type MissionStatus = "PUBLISHED" | "DRAFT" | "REVIEW" | "EMPTY";

const getMissionStatus = (summary?: IDepartmentMissionSummary): MissionStatus => {
    if (!summary) return "EMPTY";
    const total = (summary.objectiveCount ?? 0) + (summary.taskCount ?? 0);
    if (total === 0) return "EMPTY";
    if (summary.missionStatus !== "PUBLISHED") return "DRAFT";
    const dateToCheck = summary.lastUpdatedAt || summary.issueDate;
    if (dateToCheck) {
        const diff = Math.floor(
            (Date.now() - new Date(dateToCheck).getTime()) / (1000 * 60 * 60 * 24 * 30)
        );
        if (diff >= 6) return "REVIEW";
    }
    return "PUBLISHED";
};

const STATUS_BADGE: Record<
    MissionStatus,
    {
        label: string;
        icon: React.ReactNode;
        style: React.CSSProperties;
    }
> = {
    PUBLISHED: {
        label: "Đã ban hành",
        icon: <CheckCircleFilled />,
        style: {
            border: "1px solid #b7eb8f",
            background: "#f6ffed",
            color: "#389e0d",
        },
    },
    REVIEW: {
        label: "Cần rà soát",
        icon: <ExclamationCircleFilled />,
        style: {
            border: "1px solid #ffe58f",
            background: "#fffbe6",
            color: "#d48806",
        },
    },
    DRAFT: {
        label: "Bản nháp",
        icon: <EditOutlined />,
        style: {
            border: "1px solid #91caff",
            background: "#e6f4ff",
            color: "#1677ff",
        },
    },
    EMPTY: {
        label: "Chưa thiết lập",
        icon: <MinusCircleFilled />,
        style: {
            border: "1px solid #ffccc7",
            background: "#fff2f0",
            color: "#cf1322",
        },
    },
};

const StatusBadge = ({ status }: { status: MissionStatus }) => {
    const item = STATUS_BADGE[status];

    return (
        <Tag
            icon={item.icon}
            style={{
                ...item.style,
                margin: 0,
                borderRadius: 4,
                padding: "0px 8px",
                fontSize: 12,
                fontWeight: 500,
                height: 22,
                lineHeight: "20px",
                minWidth: 116,
                textAlign: "center",
            }}
        >
            {item.label}
        </Tag>
    );
};

const MetricChip = ({ value, tone }: { value: number; tone: "blue" | "violet" }) => {
    const activeStyle: React.CSSProperties =
        tone === "blue"
            ? { border: "1px solid #91caff", background: "#e6f4ff", color: "#1677ff" }
            : { border: "1px solid #d3adf7", background: "#f9f0ff", color: "#722ed1" };

    return (
        <Tag
            style={{
                ...(value > 0
                    ? activeStyle
                    : { border: "1px solid #d9d9d9", background: "#fafafa", color: "#8c8c8c" }),
                margin: 0,
                borderRadius: 4,
                padding: "0px 10px",
                fontSize: 12,
                fontWeight: 600,
                height: 22,
                lineHeight: "20px",
                minWidth: 38,
                textAlign: "center",
            }}
        >
            {value}
        </Tag>
    );
};

const MissionConsolePage: React.FC = () => {
    const tableRef = useRef<ActionType>(null);

    const [searchValue, setSearchValue] = useState("");
    const [companyIdFilter, setCompanyIdFilter] = useState<number | null>(null);
    const [statusFilter, setStatusFilter] = useState<string | null>(null);
    const [resetSignal, setResetSignal] = useState(0);

    const [query, setQuery] = useState(
        `page=${PAGINATION_CONFIG.DEFAULT_PAGE}&size=${PAGINATION_CONFIG.DEFAULT_PAGE_SIZE}&sort=name,asc`
    );

    // Detail drawer state
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [selectedDept, setSelectedDept] = useState<IDepartment | null>(null);
    const [startInEditMode, setStartInEditMode] = useState(false);
    const [editModeSignal, setEditModeSignal] = useState(0);
    const [showDetailActions, setShowDetailActions] = useState(false);
    const [isDirty, setIsDirty] = useState(false);
    const [prepareVersionAfterSaveSignal, setPrepareVersionAfterSaveSignal] = useState(0);
    const [prepareVersionDeptId, setPrepareVersionDeptId] = useState<number | null>(null);

    const { data, isFetching, refetch } = useDepartmentsQuery(query);
    const { data: summaryData } = useDepartmentMissionSummaryQuery();
    const canSetupMission = useAccess(ALL_PERMISSIONS.DEPARTMENT_OBJECTIVES.CREATE);

    // Build summary lookup
    const summaryMap = React.useMemo(() => {
        const map = new Map<number, IDepartmentMissionSummary>();
        summaryData?.forEach((s) => map.set(Number(s.departmentId), s));
        return map;
    }, [summaryData]);

    const meta = data?.meta ?? {
        page: PAGINATION_CONFIG.DEFAULT_PAGE,
        pageSize: PAGINATION_CONFIG.DEFAULT_PAGE_SIZE,
        total: 0,
    };
    const departments = data?.result ?? [];

    const buildFilters = (search: string, companyId: number | null) => {
        const parts: string[] = [];
        if (search) parts.push(`(name~'${search}')`);
        if (companyId) parts.push(`company.id:${companyId}`);
        return parts;
    };

    useEffect(() => {
        const q: any = {
            page: PAGINATION_CONFIG.DEFAULT_PAGE,
            size: PAGINATION_CONFIG.DEFAULT_PAGE_SIZE,
            sort: "name,asc",
        };
        const filters = buildFilters(searchValue, companyIdFilter);
        if (filters.length > 0) q.filter = filters.join(" and ");
        setQuery(queryString.stringify(q, { encode: false }));
    }, [searchValue, companyIdFilter]);

    const buildQuery = (params: any, sort: any) => {
        const q: any = {
            page: params.current,
            size: params.pageSize || PAGINATION_CONFIG.DEFAULT_PAGE_SIZE,
            sort: "name,asc",
        };
        if (sort?.name) q.sort = sort.name === "ascend" ? "name,asc" : "name,desc";
        const filters = buildFilters(searchValue, companyIdFilter);
        if (filters.length > 0) q.filter = filters.join(" and ");
        return queryString.stringify(q, { encode: false });
    };

    const handleReset = () => {
        setSearchValue("");
        setCompanyIdFilter(null);
        setStatusFilter(null);
        setResetSignal((s) => s + 1);
        refetch();
    };

    const openDetail = (dept: IDepartment, startEdit = false) => {
        const proceed = () => {
            setSelectedDept(dept);
            setStartInEditMode(startEdit);
            setShowDetailActions(startEdit);
            setIsDirty(false);
            setPrepareVersionDeptId(null);
            if (!startEdit) {
                setEditModeSignal(0);
            }
            setDrawerOpen(true);
            if (startEdit) {
                setEditModeSignal((signal) => signal + 1);
            }
        };

        if (isDirty && selectedDept?.id !== dept.id) {
            confirm({
                title: "Có thay đổi chưa lưu",
                icon: <ExclamationCircleFilled style={{ color: "#faad14" }} />,
                content: "Nếu chuyển phòng ban khác, các thay đổi chưa lưu sẽ bị mất. Bạn có chắc muốn tiếp tục?",
                okText: "Đồng ý", cancelText: "Huỷ",
                onOk() { proceed(); },
            });
        } else {
            proceed();
        }
    };

    const openVersionReview = (dept: IDepartment) => {
        const proceed = () => {
            setSelectedDept(dept);
            setStartInEditMode(true);
            setShowDetailActions(true);
            setIsDirty(false);
            setPrepareVersionDeptId(dept.id);
            setDrawerOpen(true);
            setPrepareVersionAfterSaveSignal((signal) => signal + 1);
        };

        if (isDirty && selectedDept?.id !== dept.id) {
            confirm({
                title: "Có thay đổi chưa lưu",
                icon: <ExclamationCircleFilled style={{ color: "#faad14" }} />,
                content: "Nếu tạo version cho phòng ban khác, các thay đổi chưa lưu sẽ bị mất. Bạn có chắc muốn tiếp tục?",
                okText: "Đồng ý", cancelText: "Huỷ",
                onOk() { proceed(); },
            });
        } else {
            proceed();
        }
    };

    const closeDetail = () => {
        if (isDirty) {
            confirm({
                title: "Có thay đổi chưa lưu",
                icon: <ExclamationCircleFilled style={{ color: "#faad14" }} />,
                content: "Đóng sẽ mất các thay đổi chưa lưu. Bạn có chắc muốn đóng?",
                okText: "Đóng",
                cancelText: "Ở lại",
                onOk() {
                    setDrawerOpen(false);
                    setIsDirty(false);
                    setStartInEditMode(false);
                    setShowDetailActions(false);
                    setPrepareVersionDeptId(null);
                },
            });
            return;
        }

        setDrawerOpen(false);
        setStartInEditMode(false);
        setShowDetailActions(false);
        setPrepareVersionDeptId(null);
    };

    // Filter table data client-side for mission status (since backend doesn't support this filter)
    const displayedDepts = React.useMemo(() => {
        if (!statusFilter || statusFilter === "ALL") return departments;
        return departments.filter((dept) => {
            const summary = summaryMap.get(dept.id);
            return getMissionStatus(summary) === statusFilter;
        });
    }, [departments, summaryMap, statusFilter]);

    const columns: ProColumns<IDepartment>[] = [
        {
            title: "STT",
            width: 52,
            align: "center",
            render: (_, __, index) =>
                (
                    <span className="text-[13px] font-medium text-slate-500">
                        {index + 1 + ((meta.page || 1) - 1) * (meta.pageSize || 20)}
                    </span>
                ),
        },
        {
            title: "Tên phòng ban",
            dataIndex: "name",
            sorter: true,
            width: 300,
            ellipsis: true,
            render: (_, record) => (
                <button
                    className="max-w-full text-left text-[14px] font-semibold leading-6 text-slate-800 transition-colors hover:text-[#e84373]"
                    onClick={(e) => {
                        e.stopPropagation();
                        openDetail(record);
                    }}
                >
                    {record.name}
                </button>
            ),
        },
        {
            title: "Công ty",
            width: 420,
            ellipsis: true,
            render: (_, record) => (
                <Tooltip title={record.company?.name}>
                    <span className="block max-w-[390px] truncate text-[13px] font-medium uppercase tracking-[0.01em] text-slate-500">
                        {record.company?.name || "—"}
                    </span>
                </Tooltip>
            ),
        },
        {
            title: "Mục tiêu",
            width: 104,
            align: "center",
            render: (_, record) => {
                const summary = summaryMap.get(record.id);
                const count = summary?.objectiveCount ?? 0;
                return <MetricChip value={count} tone="blue" />;
            },
        },
        {
            title: "Nhiệm vụ",
            width: 104,
            align: "center",
            render: (_, record) => {
                const summary = summaryMap.get(record.id);
                const count = summary?.taskCount ?? 0;
                return <MetricChip value={count} tone="violet" />;
            },
        },
        {
            title: "Trạng thái thiết lập",
            width: 172,
            align: "center",
            render: (_, record) => {
                const summary = summaryMap.get(record.id);
                const status = getMissionStatus(summary);
                return <StatusBadge status={status} />;
            },
        },
        {
            title: "Version",
            width: 96,
            align: "center",
            render: (_, record) => {
                const summary = summaryMap.get(record.id);
                if (summary?.missionStatus !== "PUBLISHED" || !summary.version) {
                    return <span style={{ color: "#bfbfbf", fontSize: 13 }}>—</span>;
                }
                return (
                    <Tag color="blue" style={{ margin: 0, borderRadius: 4, fontWeight: 600 }}>
                        v{summary.version}
                    </Tag>
                );
            },
        },
        {
            title: "Ngày ban hành",
            width: 130,
            align: "center",
            render: (_, record) => {
                const summary = summaryMap.get(record.id);
                if (!summary?.issueDate) return <span style={{ color: "#bfbfbf", fontSize: 13 }}>—</span>;
                return (
                    <span style={{ color: "#595959", fontSize: 13, fontWeight: 500 }}>
                        {new Date(summary.issueDate).toLocaleDateString("vi-VN")}
                    </span>
                );
            },
        },
        {
            title: "Hành động",
            width: 140,
            align: "center",
            fixed: "right",
            render: (_, record) => {
                const summary = summaryMap.get(record.id);
                const status = getMissionStatus(summary);
                const isEmpty = status === "EMPTY";

                return (
                    <Space size={4} align="center">
                        <Button
                            type="text"
                            size="small"
                            icon={<EyeOutlined style={{ color: "#1677ff", fontSize: 16 }} />}
                            onClick={(e) => {
                                e.stopPropagation();
                                openDetail(record);
                            }}
                        />
                        {canSetupMission && (
                            <>
                                <Button
                                    type="text"
                                    size="small"
                                    title={isEmpty ? "Thiết lập" : "Chỉnh sửa"}
                                    icon={
                                        isEmpty
                                            ? <PlusCircleOutlined style={{ color: "#52c41a", fontSize: 16 }} />
                                            : <EditOutlined style={{ color: "#fa8c16", fontSize: 16 }} />
                                    }
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        openDetail(record, true);
                                    }}
                                />
                                {!isEmpty && (
                                    <Button
                                        type="text"
                                        size="small"
                                        title="Tạo version"
                                        icon={<FileAddOutlined style={{ color: "#1677ff", fontSize: 16 }} />}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            openVersionReview(record);
                                        }}
                                    />
                                )}
                            </>
                        )}
                    </Space>
                );
            },
        },
    ];

    return (
        <PageContainer
            title="Quản trị Mục tiêu & Nhiệm vụ Phòng ban"
            filter={
                <div className="flex flex-col gap-3">
                    <SearchFilter
                        searchPlaceholder="Tìm theo tên phòng ban..."
                        showAddButton={false}
                        showFilterButton={false}
                        onSearch={setSearchValue}
                        onReset={handleReset}
                    />
                    <AdvancedFilterSelect
                        resetSignal={resetSignal}
                        fields={[
                            {
                                key: "companyId",
                                label: "Công ty",
                                asyncOptions: async () => {
                                    const res = await callFetchCompany("page=1&size=100&sort=name,asc");
                                    return (res.data?.result ?? []).map((c: ICompany) => ({
                                        label: c.name,
                                        value: c.id,
                                    }));
                                },
                            },
                            {
                                key: "missionStatus",
                                label: "Trạng thái thiết lập",
                                options: [
                                    { label: "Đã ban hành", value: "PUBLISHED", color: "green" },
                                    { label: "Cần rà soát", value: "REVIEW", color: "gold" },
                                    { label: "Bản nháp", value: "DRAFT", color: "blue" },
                                    { label: "Chưa thiết lập", value: "EMPTY", color: "default" },
                                ],
                            },
                        ]}
                        onChange={(val) => {
                            setCompanyIdFilter(val.companyId ?? null);
                            setStatusFilter(val.missionStatus ?? null);
                        }}
                    />
                </div>
            }
        >
            <DataTable<IDepartment>
                actionRef={tableRef}
                rowKey="id"
                loading={isFetching}
                columns={columns}
                dataSource={displayedDepts}
                scroll={{ x: "max-content" }}
                request={async (params, sort) => {
                    const q = buildQuery(params, sort);
                    setQuery(q);
                    return {
                        data: displayedDepts,
                        success: true,
                        total: meta.total,
                    };
                }}
                pagination={{
                    defaultPageSize: PAGINATION_CONFIG.DEFAULT_PAGE_SIZE,
                    current: meta.page,
                    pageSize: meta.pageSize,
                    total: meta.total,
                }}
                onRow={(record) => ({
                    onClick: () => openDetail(record),
                    style: { cursor: "pointer" },
                })}
            />

            {/* Detail Drawer */}
            <LotusDetailDrawer
                open={drawerOpen}
                onClose={closeDetail}
                destroyOnClose
            >
                <DepartmentMissionDetail
                    departmentId={selectedDept?.id}
                    departmentName={selectedDept?.name}
                    startInEditMode={startInEditMode}
                    editModeSignal={editModeSignal}
                    showEditAction={showDetailActions}
                    showHistoryAction={!showDetailActions}
                    showVersionAction={false}
                    prepareVersionAfterSaveSignal={
                        prepareVersionDeptId === selectedDept?.id ? prepareVersionAfterSaveSignal : undefined
                    }
                    onDirtyChange={setIsDirty}
                />
            </LotusDetailDrawer>
        </PageContainer>
    );
};

export default MissionConsolePage;
