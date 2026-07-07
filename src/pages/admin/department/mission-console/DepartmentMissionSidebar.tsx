import React, { useMemo, useState } from "react";
import { Input, Skeleton, Tag, Tooltip, Select } from "antd";
import {
    CheckCircleFilled,
    ExclamationCircleFilled,
    MinusCircleFilled,
    SearchOutlined,
    BuildOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import "dayjs/locale/vi";
import { useDepartmentsQuery } from "@/hooks/useDepartments";
import { useDepartmentMissionSummaryQuery } from "@/hooks/useDepartmentObjectives";
import type { IDepartment, IDepartmentMissionSummary } from "@/types/backend";

dayjs.extend(relativeTime);
dayjs.locale("vi");

export interface DepartmentMissionSidebarProps {
    selectedDeptId?: number;
    onSelectDept: (deptId: number, deptName: string) => void;
}

type StatusType = "EMPTY" | "REVIEW" | "OK";

const getStatus = (summary?: IDepartmentMissionSummary): StatusType => {
    if (!summary) return "EMPTY";
    const total = (summary.objectiveCount ?? 0) + (summary.taskCount ?? 0);
    if (total === 0) return "EMPTY";
    const dateToCheck = summary.lastUpdatedAt || summary.issueDate;
    if (dateToCheck && dayjs().diff(dayjs(dateToCheck), "month") >= 6) return "REVIEW";
    return "OK";
};

const STATUS_CONFIG: Record<StatusType, { label: string; color: string; bgColor: string; borderColor: string; icon: React.ReactNode }> = {
    OK: {
        label: "Đã ban hành",
        color: "#15803d",
        bgColor: "#f0fdf4",
        borderColor: "#86efac",
        icon: <CheckCircleFilled style={{ color: "#22c55e" }} />,
    },
    REVIEW: {
        label: "Cần rà soát",
        color: "#92400e",
        bgColor: "#fffbeb",
        borderColor: "#fcd34d",
        icon: <ExclamationCircleFilled style={{ color: "#f59e0b" }} />,
    },
    EMPTY: {
        label: "Chưa thiết lập",
        color: "#6b7280",
        bgColor: "#f9fafb",
        borderColor: "#e5e7eb",
        icon: <MinusCircleFilled style={{ color: "#9ca3af" }} />,
    },
};

const DepartmentMissionSidebar: React.FC<DepartmentMissionSidebarProps> = ({
    selectedDeptId,
    onSelectDept,
}) => {
    const { data: deptData, isLoading: deptLoading } = useDepartmentsQuery("page=1&size=200");
    const { data: summaryData } = useDepartmentMissionSummaryQuery();

    const [searchText, setSearchText] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("ALL");
    const [companyFilter, setCompanyFilter] = useState<string>("ALL");

    // Build a lookup map from departmentId → summary
    const summaryMap = useMemo(() => {
        const map = new Map<number, IDepartmentMissionSummary>();
        summaryData?.forEach((s) => map.set(Number(s.departmentId), s));
        return map;
    }, [summaryData]);

    const allDepts: IDepartment[] = deptData?.result ?? [];

    // Company options for filter
    const companyOptions = useMemo(() => {
        const map = new Map<string, string>();
        allDepts.forEach((d) => {
            if (d.company?.id && d.company?.name) {
                map.set(String(d.company.id), d.company.name);
            }
        });
        return Array.from(map.entries()).map(([value, label]) => ({ value, label }));
    }, [allDepts]);

    // Filter + annotate with status
    const filteredDepts = useMemo(() => {
        return allDepts
            .map((dept) => {
                const summary = summaryMap.get(dept.id);
                const status = getStatus(summary);
                return { dept, summary, status };
            })
            .filter(({ dept, status }) => {
                const matchSearch =
                    !searchText ||
                    dept.name?.toLowerCase().includes(searchText.toLowerCase());

                const matchStatus =
                    statusFilter === "ALL" || status === statusFilter;

                const matchCompany =
                    companyFilter === "ALL" ||
                    String(dept.company?.id) === companyFilter;

                return matchSearch && matchStatus && matchCompany;
            });
    }, [allDepts, summaryMap, searchText, statusFilter, companyFilter]);

    // Group by company
    const groupedByCompany = useMemo(() => {
        const groups = new Map<string, { companyName: string; items: typeof filteredDepts }>();
        filteredDepts.forEach((entry) => {
            const key = String(entry.dept.company?.id ?? "other");
            const name = entry.dept.company?.name ?? "Không rõ công ty";
            if (!groups.has(key)) {
                groups.set(key, { companyName: name, items: [] });
            }
            groups.get(key)!.items.push(entry);
        });
        return Array.from(groups.values());
    }, [filteredDepts]);

    if (deptLoading) {
        return (
            <div className="p-4 space-y-3">
                {[1, 2, 3, 4].map((i) => (
                    <Skeleton key={i} active paragraph={{ rows: 2 }} />
                ))}
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col bg-white">
            {/* ── HEADER ── */}
            <div className="px-4 pt-4 pb-3 border-b border-gray-100">
                <div className="flex items-center justify-between mb-3">
                    <span className="text-[13px] font-semibold text-gray-700 flex items-center gap-1.5">
                        <BuildOutlined className="text-[#e8637a]" />
                        Danh sách phòng ban
                        <span className="ml-1 text-[11px] font-normal text-gray-400 bg-gray-100 rounded-full px-1.5 py-0.5">
                            {filteredDepts.length}
                        </span>
                    </span>
                </div>

                {/* Search */}
                <Input
                    prefix={<SearchOutlined className="text-gray-400 text-[13px]" />}
                    placeholder="Tìm phòng ban..."
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    allowClear
                    size="small"
                    className="rounded-lg mb-2"
                    style={{ fontSize: 13 }}
                />

                {/* Filters row */}
                <div className="flex gap-2">
                    <Select
                        size="small"
                        value={companyFilter}
                        onChange={setCompanyFilter}
                        style={{ flex: 1, fontSize: 12 }}
                        popupMatchSelectWidth={false}
                        options={[
                            { value: "ALL", label: "Tất cả công ty" },
                            ...companyOptions,
                        ]}
                    />
                    <Select
                        size="small"
                        value={statusFilter}
                        onChange={setStatusFilter}
                        style={{ flex: 1, fontSize: 12 }}
                        popupMatchSelectWidth={false}
                        options={[
                            { value: "ALL", label: "Tất cả trạng thái" },
                            { value: "OK", label: "Đã ban hành" },
                            { value: "REVIEW", label: "Cần rà soát" },
                            { value: "EMPTY", label: "Chưa thiết lập" },
                        ]}
                    />
                </div>
            </div>

            {/* ── LIST ── */}
            <div className="flex-1 overflow-y-auto">
                {filteredDepts.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-40 text-gray-400 text-sm">
                        <BuildOutlined className="text-3xl mb-2 opacity-30" />
                        Không tìm thấy phòng ban nào
                    </div>
                ) : (
                    groupedByCompany.map(({ companyName, items }) => (
                        <div key={companyName}>
                            {/* Company group label */}
                            {groupedByCompany.length > 1 && (
                                <div className="px-4 py-2 bg-gray-50 border-b border-gray-100 sticky top-0 z-10">
                                    <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">
                                        {companyName}
                                    </span>
                                </div>
                            )}

                            {items.map(({ dept, summary, status }) => {
                                const isSelected = selectedDeptId === dept.id;
                                const cfg = STATUS_CONFIG[status];

                                return (
                                    <button
                                        key={dept.id}
                                        onClick={() => onSelectDept(dept.id, dept.name)}
                                        className={`w-full text-left px-4 py-3 border-b border-gray-50 transition-all relative group
                                            ${isSelected
                                                ? "bg-[#fff5f6] border-l-[3px] border-l-[#e8637a]"
                                                : "bg-white border-l-[3px] border-l-transparent hover:bg-gray-50"
                                            }`}
                                        style={{ display: "block" }}
                                    >
                                        {/* Dept name */}
                                        <div className={`text-[13px] font-semibold mb-1.5 leading-snug ${isSelected ? "text-[#e8637a]" : "text-gray-800"}`}>
                                            {dept.name}
                                        </div>

                                        {/* Stats row */}
                                        <div className="flex items-center gap-3 text-[11px] text-gray-500 mb-2">
                                            <span>
                                                <span className="font-semibold text-gray-700">{summary?.objectiveCount ?? 0}</span> mục tiêu
                                            </span>
                                            <span className="text-gray-200">|</span>
                                            <span>
                                                <span className="font-semibold text-gray-700">{summary?.taskCount ?? 0}</span> nhiệm vụ
                                            </span>
                                        </div>

                                        {/* Status + date */}
                                        <div className="flex items-center justify-between">
                                            <Tag
                                                icon={cfg.icon}
                                                style={{
                                                    fontSize: 11,
                                                    lineHeight: "18px",
                                                    padding: "0 6px",
                                                    margin: 0,
                                                    background: cfg.bgColor,
                                                    color: cfg.color,
                                                    border: `1px solid ${cfg.borderColor}`,
                                                    borderRadius: 6,
                                                    display: "inline-flex",
                                                    alignItems: "center",
                                                    gap: 4,
                                                }}
                                            >
                                                {cfg.label}
                                            </Tag>

                                            {summary?.lastUpdatedAt && (
                                                <Tooltip title={dayjs(summary.lastUpdatedAt).format("DD/MM/YYYY HH:mm")}>
                                                    <span className="text-[10px] text-gray-400">
                                                        {dayjs(summary.lastUpdatedAt).fromNow()}
                                                    </span>
                                                </Tooltip>
                                            )}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default DepartmentMissionSidebar;
