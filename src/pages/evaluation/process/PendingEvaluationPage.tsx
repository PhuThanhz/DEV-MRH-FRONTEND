import { useState, useMemo } from "react";
import { Button, Tooltip, Empty, Popconfirm, Drawer, Timeline, Tag } from "antd";
import { useNavigate } from "react-router-dom";
import {
    EyeOutlined,
    HistoryOutlined,
    TeamOutlined,
    UserSwitchOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { notify } from "@/components/common/notification/notify";
import {
    usePendingManagerRecordsQuery,
    useManagerRecordsQuery,
    usePendingApprovalRecordsQuery,
    useApprovalRecordsQuery,
    useBatchApproveRecordsMutation,
    useEvaluationRecordHistoryQuery,
} from "@/hooks/useEvaluations";
import { callManagerSubmitRecord } from "@/config/api";
import { useQueryClient } from "@tanstack/react-query";
import PageContainer from "@/components/common/data-table/PageContainer";
import SearchFilter from "@/components/common/filter/SearchFilter";
import AdvancedFilterSelect from "@/components/common/filter/AdvancedFilterSelect";
import Access from "@/components/share/access";
import { ALL_PERMISSIONS } from "@/config/permissions";
import EvaluationStatusTag, { type EvaluationStatus } from "../components/EvaluationStatusTag";
import { useAppSelector } from "@/redux/hooks";
import DataTable from "@/components/common/data-table";
import TabBar, { type TabItem } from "@/components/common/tabs/TabBar";

type WorkView = "pending" | "history";

const GRADE_CONFIG: Record<string, { color: string; bg: string; label: string }> = {
    A: { color: "#389e0d", bg: "#f6ffed", label: "Xuất sắc" },
    B: { color: "#1677ff", bg: "#e6f4ff", label: "Tốt" },
    C: { color: "#d46b08", bg: "#fff7e6", label: "Khá" },
    D: { color: "#cf1322", bg: "#fff1f0", label: "Trung bình" },
    E: { color: "#8c8c8c", bg: "#f5f5f5", label: "Yếu" },
};

const getRecordDeadline = (record: any) => record.evalRole === "MANAGER"
    ? (record.effectiveManagerDeadline ?? record.managerDeadlineOverride ?? record.period?.managerDeadline)
    : (record.effectiveApprovalDeadline ?? record.approvalDeadlineOverride ?? record.period?.approvalDeadline);

const isRecordActionable = (record: any) => record.evalRole === "MANAGER"
    ? record.status === "PENDING_MANAGER_REVIEW" || record.status === "MANAGER_REVIEWING"
    : record.status === "PENDING_APPROVAL";

const isRecordOverdue = (record: any) => {
    const deadline = getRecordDeadline(record);
    return Boolean(isRecordActionable(record) && deadline && dayjs().isAfter(dayjs(deadline)));
};

const getOverdueStatus = (record: any): EvaluationStatus | null => {
    if (!isRecordOverdue(record)) return null;
    return record.evalRole === "MANAGER" ? "OVERDUE_MANAGER" : "OVERDUE_APPROVAL";
};

const getNumericScore = (value: unknown) => {
    if (value === null || value === undefined || value === "") return null;
    const score = typeof value === "number" ? value : Number(value);
    return Number.isFinite(score) ? score : null;
};

interface IProps {
    isTab?: boolean;
}

const PendingEvaluationPage = ({ isTab }: IProps) => {
    const navigate = useNavigate();
    const [workView, setWorkView] = useState<WorkView>("pending");
    const [searchText, setSearchText] = useState("");
    const [advancedFilters, setAdvancedFilters] = useState<Record<string, any>>({});
    const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
    const [batchSubmitting, setBatchSubmitting] = useState(false);
    const [filterResetSignal, setFilterResetSignal] = useState(0);
    const [historyRecord, setHistoryRecord] = useState<any | null>(null);

    const qc = useQueryClient();
    const pendingManagerQuery = usePendingManagerRecordsQuery(workView === "pending");
    const pendingApprovalQuery = usePendingApprovalRecordsQuery(workView === "pending");
    const managerHistoryQuery = useManagerRecordsQuery(workView === "history");
    const approvalHistoryQuery = useApprovalRecordsQuery(workView === "history");
    const batchApproveMutation = useBatchApproveRecordsMutation();
    const historyQuery = useEvaluationRecordHistoryQuery(historyRecord?.id || 0);

    const managerRaw = (workView === "pending" ? pendingManagerQuery.data : managerHistoryQuery.data) || [];
    const approvalRaw = (workView === "pending" ? pendingApprovalQuery.data : approvalHistoryQuery.data) || [];

    const pendingWorkCount = useMemo(() => {
        const managerCount = (pendingManagerQuery.data || []).filter((record: any) =>
            record.status === "PENDING_MANAGER_REVIEW" || record.status === "MANAGER_REVIEWING"
        ).length;
        const approvalCount = (pendingApprovalQuery.data || []).filter((record: any) =>
            record.status === "PENDING_APPROVAL"
        ).length;
        return managerCount + approvalCount;
    }, [pendingApprovalQuery.data, pendingManagerQuery.data]);

    const processedWorkCount = useMemo(() => {
        const isProcessed = (record: any) => ["COMPLETED", "REVISION_NEEDED"].includes(record.status);
        return (managerHistoryQuery.data || []).filter(isProcessed).length
            + (approvalHistoryQuery.data || []).filter(isProcessed).length;
    }, [approvalHistoryQuery.data, managerHistoryQuery.data]);

    const records = useMemo(() => {
        const mappedManager = managerRaw.map((r: any) => ({
            ...r,
            evalRole: "MANAGER" as const,
            workItemKey: `MANAGER-${r.id}`,
        }));
        const mappedApproval = approvalRaw.map((r: any) => ({
            ...r,
            evalRole: "APPROVER" as const,
            workItemKey: `APPROVER-${r.id}`,
        }));
        return [...mappedManager, ...mappedApproval];
    }, [managerRaw, approvalRaw]);

    const loading = workView === "pending"
        ? (pendingManagerQuery.isLoading || pendingApprovalQuery.isLoading)
        : (managerHistoryQuery.isLoading || approvalHistoryQuery.isLoading);

    const batchApproving = batchApproveMutation.isPending;

    const workViewTabs = useMemo<TabItem<WorkView>[]>(() => [
        {
            key: "pending",
            label: (
                <span className="evaluation-work-tab-label">
                    Cần xử lý
                    {pendingWorkCount > 0 && <span className="evaluation-work-tab-badge">{pendingWorkCount > 99 ? "99+" : pendingWorkCount}</span>}
                </span>
            ),
        },
        {
            key: "history",
            label: (
                <span className="evaluation-work-tab-label">
                    Đã xử lý
                    {processedWorkCount > 0 && <span className="evaluation-work-tab-badge">{processedWorkCount > 99 ? "99+" : processedWorkCount}</span>}
                </span>
            ),
        },
    ], [pendingWorkCount, processedWorkCount]);

    const handleWorkViewChange = (value: WorkView) => {
        setWorkView(value);
        setSelectedRowKeys([]);
        setAdvancedFilters({});
        setFilterResetSignal(current => current + 1);
    };

    const recordByKey = useMemo(() => new Map(records.map(record => [record.workItemKey, record])), [records]);

    const selectedManagerRecords = useMemo(() => {
        return selectedRowKeys
            .map(key => recordByKey.get(key))
            .filter(record => record?.evalRole === "MANAGER" && isRecordActionable(record));
    }, [recordByKey, selectedRowKeys]);

    const selectedApproverRecords = useMemo(() => {
        return selectedRowKeys
            .map(key => recordByKey.get(key))
            .filter(record => record?.evalRole === "APPROVER" && isRecordActionable(record));
    }, [recordByKey, selectedRowKeys]);

    const selectedApproverIds = useMemo(() => {
        return selectedApproverRecords.map(record => record.id as number);
    }, [selectedApproverRecords]);

    const selectedActionableCount = selectedManagerRecords.length + selectedApproverRecords.length;

    const clearProcessedSelection = (processedRecords: any[]) => {
        const processedKeys = new Set(processedRecords.map(record => record.workItemKey));
        setSelectedRowKeys(previous => previous.filter(key => !processedKeys.has(String(key))));
    };

    const handleBatchSubmit = async () => {
        if (selectedManagerRecords.length === 0) return;
        setBatchSubmitting(true);
        let successCount = 0;
        const failed: string[] = [];
        for (const record of selectedManagerRecords) {
            try {
                await callManagerSubmitRecord(record.id);
                successCount++;
            } catch (err: any) {
                const name = record.employee?.fullName || record.employee?.username || record.id;
                failed.push(`${name}: ${err?.response?.data?.message || "lỗi"}`);
            }
        }
        qc.invalidateQueries({ queryKey: ["pending-manager-evaluation-records"] });
        qc.invalidateQueries({ queryKey: ["manager-evaluation-records"] });
        qc.invalidateQueries({ queryKey: ["all-evaluation-records"] });
        qc.invalidateQueries({ queryKey: ["evaluation-task-counts"] });
        if (successCount > 0) notify.success(`Đã nộp ${successCount} bản đánh giá`);
        if (failed.length > 0) notify.warning(`${failed.length} bản chưa nộp: ${failed.join("; ")}`);
        clearProcessedSelection(selectedManagerRecords);
        setBatchSubmitting(false);
    };

    const handleBatchApprove = async () => {
        if (selectedApproverIds.length === 0) return;
        batchApproveMutation.mutate(selectedApproverIds, {
            onSuccess: (res: any) => {
                const data = res?.data;
                const successCount = data?.successIds?.length ?? selectedApproverIds.length;
                const failedCount = data?.failedRecords?.length ?? 0;
                if (failedCount > 0) {
                    notify.warning(`Duyệt xong: Thành công ${successCount}, thất bại ${failedCount}.`);
                } else {
                    notify.success(`Đã chấm & duyệt cuối thành công ${successCount} bản đánh giá`);
                }
                clearProcessedSelection(selectedApproverRecords);
            },
            onError: (err: any) => {
                notify.error(err?.response?.data?.message || "Có lỗi xảy ra khi phê duyệt hàng loạt");
            }
        });
    };

    const statusFilters = useMemo(() => {
        const labels: Record<string, string> = {
            PENDING_MANAGER_REVIEW: "Chờ quản lý chấm",
            MANAGER_REVIEWING: "Quản lý đang chấm",
            PENDING_APPROVAL: "Chờ duyệt cuối",
            COMPLETED: "Hoàn tất",
            REVISION_NEEDED: "Yêu cầu chỉnh sửa",
        };
        const present = Array.from(new Set(records.map(r => r.status).filter(Boolean)));
        return present
            .filter(status => status in labels)
            .map(status => ({ text: labels[status], value: status }));
    }, [records]);

    const columns = [
        {
            title: "STT",
            key: "stt",
            width: 50,
            align: "center" as const,
            render: (_: any, __: any, idx: number) => (
                <span style={{ fontWeight: 600, color: "#94a3b8", fontSize: 12 }}>{idx + 1}</span>
            ),
        },
        {
            title: "Mã nhân viên",
            dataIndex: ["employee", "employeeCode"],
            key: "employeeCode",
            width: 120,
            render: (_: any, record: any) => (
                <span style={{ color: "#475569", fontSize: 12, fontWeight: 600 }}>
                    {record.employee?.employeeCode || record.employeeCode || "—"}
                </span>
            ),
        },
        {
            title: "Tên nhân viên",
            dataIndex: ["employee", "fullName"],
            key: "employeeName",
            width: 190,
            sorter: (a: any, b: any) => (a.employee?.fullName || a.employee?.username || "").localeCompare(b.employee?.fullName || b.employee?.username || "", "vi"),
            render: (_: any, record: any) => (
                <div>
                    <div style={{ fontWeight: 700, color: "#1e293b", fontSize: 13 }}>
                        {record.employee?.fullName || record.employee?.username || "Chưa rõ nhân sự"}
                    </div>
                    <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>
                        {record.employee?.jobTitle || "Chưa cập nhật chức danh"}
                    </div>
                </div>
            ),
        },
        {
            title: "Vai trò xử lý",
            key: "evaluationRole",
            width: 155,
            align: "center" as const,
            render: (_: any, record: any) => {
                const isDirectManager = record.evalRole === "MANAGER";
                return (
                    <Tag
                        icon={isDirectManager ? <TeamOutlined /> : <UserSwitchOutlined />}
                        color={isDirectManager ? "blue" : "cyan"}
                        style={{ margin: 0, borderRadius: 5, fontWeight: 600, fontSize: 11 }}
                    >
                        {isDirectManager ? "Quản lý trực tiếp" : "Quản lý gián tiếp"}
                    </Tag>
                );
            },
        },
        {
            title: "Kỳ đánh giá",
            dataIndex: ["period", "name"],
            key: "period",
            sorter: (a: any, b: any) => (a.period?.name || a.periodName || "").localeCompare(b.period?.name || b.periodName || "", "vi"),
            render: (_: any, record: any) => (
                <div>
                    <div style={{ fontWeight: 700, color: "#1e293b", fontSize: 13 }}>
                        {record.period?.name || record.periodName || "—"}
                    </div>
                    {record.period?.description && (
                        <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>{record.period.description}</div>
                    )}
                </div>
            ),
        },
        {
            title: "Biểu mẫu",
            dataIndex: ["template", "name"],
            key: "template",
            render: (_: any, record: any) => (
                <span style={{ fontSize: 12, fontWeight: 500, color: "#374151" }}>
                    {record.template?.name || "—"}
                </span>
            ),
        },
        {
            title: "Trạng thái",
            dataIndex: "status",
            key: "status",
            width: 170,
            align: "center" as const,
            filters: statusFilters,
            onFilter: (value: any, record: any) => record.status === value,
            render: (_: any, record: any) => {
                const overdueStatus = getOverdueStatus(record);
                return <EvaluationStatusTag status={overdueStatus ?? record.status} />;
            },
        },
        {
            title: "Điểm NV đánh giá",
            dataIndex: "employeeTotalScore",
            key: "employeeTotalScore",
            width: 160,
            align: "center" as const,
            sorter: (a: any, b: any) => (getNumericScore(a.employeeTotalScore) ?? -1) - (getNumericScore(b.employeeTotalScore) ?? -1),
            render: (_: any, record: any) => {
                const score = getNumericScore(record.employeeTotalScore);
                return (
                    <span style={{ fontWeight: 700, color: score !== null ? "#1677ff" : "#d9d9d9", fontSize: 14 }}>
                        {score !== null ? score.toFixed(2) : "—"}
                    </span>
                );
            },
        },
        {
            title: "Điểm quản lý",
            dataIndex: "managerTotalScore",
            key: "managerTotalScore",
            width: 120,
            align: "center" as const,
            sorter: (a: any, b: any) => (getNumericScore(a.managerTotalScore) ?? -1) - (getNumericScore(b.managerTotalScore) ?? -1),
            render: (_: any, record: any) => {
                const score = getNumericScore(record.managerTotalScore);
                return (
                    <span style={{ fontWeight: 700, color: score !== null ? "#7c3aed" : "#d9d9d9", fontSize: 14 }}>
                        {score !== null ? score.toFixed(2) : "—"}
                    </span>
                );
            },
        },
        {
            title: "Xếp loại",
            dataIndex: "finalGrade",
            key: "finalGrade",
            width: 100,
            align: "center" as const,
            render: (_: any, record: any) => {
                const grade = record.finalGrade;
                if (!grade) return <span style={{ color: "#d9d9d9" }}>—</span>;
                const cfg = GRADE_CONFIG[grade] ?? { color: "#8c8c8c", bg: "#f5f5f5", label: grade };
                return (
                    <Tooltip title={cfg.label}>
                        <span style={{
                            display: "inline-flex", alignItems: "center", justifyContent: "center",
                            width: 32, height: 32, borderRadius: "50%",
                            background: cfg.bg, border: `2px solid ${cfg.color}`,
                            color: cfg.color, fontWeight: 800, fontSize: 15
                        }}>
                            {grade}
                        </span>
                    </Tooltip>
                );
            },
        },
        {
            title: "Hạn chót",
            key: "deadline",
            width: 130,
            align: "center" as const,
            sorter: (a: any, b: any) => {
                const da = getRecordDeadline(a);
                const db = getRecordDeadline(b);
                return (da ? dayjs(da).valueOf() : Infinity) - (db ? dayjs(db).valueOf() : Infinity);
            },
            render: (_: any, record: any) => {
                const deadline = getRecordDeadline(record);
                if (!deadline) return <span style={{ color: "#d9d9d9" }}>—</span>;

                const isOverdue = isRecordOverdue(record);
                const color = isOverdue ? "#cf1322" : "#374151";
                const fontWeight = isOverdue ? 600 : 400;

                return (
                    <span style={{ fontSize: 12, color, fontWeight }}>
                        {dayjs(deadline).format("DD/MM/YYYY")}
                        {isOverdue && <div style={{ fontSize: 10, marginTop: 2 }}>(Quá hạn)</div>}
                    </span>
                );
            },
        },
        {
            title: "Ngày hoàn tất",
            dataIndex: "completedAt",
            key: "completedAt",
            width: 130,
            sorter: (a: any, b: any) =>
                (a.completedAt ? dayjs(a.completedAt).valueOf() : 0) - (b.completedAt ? dayjs(b.completedAt).valueOf() : 0),
            render: (_: any, record: any) => (
                <span style={{ fontSize: 12, color: record.completedAt ? "#374151" : "#d9d9d9" }}>
                    {record.completedAt ? dayjs(record.completedAt).format("DD/MM/YYYY") : "—"}
                </span>
            ),
        },
        {
            title: "Hành động",
            key: "action",
            align: "center" as const,
            width: 120,
            render: (_: any, record: any) => {
                const isManager = record.evalRole === "MANAGER";
                const path = isManager
                    ? `/admin/evaluation/manager/records/${record.id}`
                    : `/admin/evaluation/approval/records/${record.id}`;
                const label = isManager
                    ? (record.status === "PENDING_MANAGER_REVIEW"
                        ? "Chấm điểm"
                        : record.status === "MANAGER_REVIEWING" ? "Tiếp tục chấm" : "Xem chi tiết")
                    : (record.status === "PENDING_APPROVAL" ? "Duyệt cuối" : "Xem chi tiết");
                const isHighlight = isManager
                    ? record.status === "PENDING_MANAGER_REVIEW" || record.status === "MANAGER_REVIEWING"
                    : record.status === "PENDING_APPROVAL";

                return (
                    <div style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                        <Tooltip title="Xem lịch sử xử lý">
                            <Button
                                size="small"
                                icon={<HistoryOutlined />}
                                aria-label="Xem lịch sử xử lý"
                                onClick={() => setHistoryRecord(record)}
                                style={{ width: 28, height: 28, padding: 0, borderRadius: 6 }}
                            />
                        </Tooltip>
                        <Button
                            type="primary"
                            size="small"
                            icon={<EyeOutlined />}
                            onClick={() => navigate(path)}
                            style={{
                                borderRadius: 6,
                                fontWeight: 600,
                                background: isHighlight ? "#1677ff" : "#ffffff",
                                color: isHighlight ? "#ffffff" : "#334155",
                                border: isHighlight ? "none" : "1px solid #cbd5e1",
                                fontSize: 12,
                                height: 28,
                            }}
                        >
                            {label}
                        </Button>
                    </div>
                );
            },
        },
    ];

    const displayColumns = columns.filter(col => {
        if (workView === "history" && col.key === "deadline") return false;
        if (workView === "pending" && col.key === "completedAt") return false;
        return true;
    });

    const baseRecords = useMemo(() => {
        const query = searchText.trim().toLocaleLowerCase("vi");
        if (!query) return records;

        return records.filter(record => [
            record.period?.name || record.periodName,
            record.template?.name,
            record.employee?.fullName,
            record.employee?.username,
            record.employee?.employeeCode || record.employeeCode,
        ].some(value => (value || "").toLocaleLowerCase("vi").includes(query)));
    }, [records, searchText]);

    const filteredRecords = useMemo(() => baseRecords.filter(record => {
        if (workView === "history" && !["COMPLETED", "REVISION_NEEDED"].includes(record.status)) {
            return false;
        }

        if (advancedFilters.periodId && (record.period?.id || record.periodId) !== advancedFilters.periodId) {
            return false;
        }

        if (advancedFilters.departmentId && record.employee?.departmentId !== advancedFilters.departmentId) {
            return false;
        }

        if (advancedFilters.overdue === "overdue" && !isRecordOverdue(record)) {
            return false;
        }

        if (advancedFilters.taskType === "manager" && record.evalRole !== "MANAGER") {
            return false;
        }
        if (advancedFilters.taskType === "approver" && record.evalRole !== "APPROVER") {
            return false;
        }

        return true;
    }), [workView, advancedFilters, baseRecords]);

    const content = (
        <div style={{ padding: isTab ? "8px 0" : 0 }}>
            <div style={{ marginBottom: 20, display: "flex", flexDirection: "column", gap: 14 }}>
                <SearchFilter
                    searchPlaceholder="Tìm nhân viên, mã NV, kỳ đánh giá..."
                    onSearch={setSearchText}
                    showFilterButton={false}
                    showAddButton={false}
                />
                <div className="evaluation-work-toolbar">
                    <TabBar tabs={workViewTabs} activeKey={workView} onChange={handleWorkViewChange} />
                    <div className="evaluation-work-toolbar__filters">
                        <AdvancedFilterSelect
                            resetSignal={filterResetSignal}
                            fields={[
                                {
                                    key: "periodId",
                                    label: "Kỳ đánh giá",
                                    options: Array.from(
                                        new Map(records.filter(r => r.period?.id).map(r => [r.period.id, { label: r.period.name || r.periodName, value: r.period.id }])).values()
                                    ),
                                },
                                {
                                    key: "departmentId",
                                    label: "Phòng ban",
                                    options: Array.from(
                                        new Map(
                                            records
                                                .filter(r => r.employee?.departmentId)
                                                .map(r => [
                                                    r.employee.departmentId,
                                                    { label: r.employee.departmentName, value: r.employee.departmentId }
                                                ])
                                        ).values()
                                    ),
                                },
                                {
                                    key: "overdue",
                                    label: "Quá hạn",
                                    options: [
                                        { label: "Tất cả", value: "" },
                                        { label: "Chỉ quá hạn", value: "overdue" }
                                    ]
                                },
                                {
                                    key: "taskType",
                                    label: "Vai trò xử lý",
                                    options: [
                                        { label: "Tất cả", value: "" },
                                        { label: "Quản lý trực tiếp", value: "manager" },
                                        { label: "Quản lý gián tiếp", value: "approver" }
                                    ]
                                }
                            ]}
                            onChange={setAdvancedFilters}
                        />
                    </div>
                </div>
            </div>

            <style>{`
                .evaluation-work-toolbar {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    gap: 16px;
                    padding: 2px 0 0;
                    flex-wrap: wrap;
                }
                .evaluation-work-toolbar__filters {
                    margin-left: auto;
                    display: inline-flex;
                    align-items: center;
                    justify-content: flex-end;
                }
                .evaluation-work-tab-label {
                    display: inline-flex;
                    align-items: center;
                    gap: 7px;
                }
                .evaluation-work-tab-badge {
                    min-width: 20px;
                    height: 20px;
                    padding: 0 6px;
                    border-radius: 5px;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    background: #e2e8f0;
                    color: #475569;
                    font-size: 11px;
                    font-weight: 700;
                    font-variant-numeric: tabular-nums;
                }
                .tab-bar__item--active .evaluation-work-tab-badge {
                    background: #ffe4ed;
                    color: #d62f68;
                }
                @media (max-width: 768px) {
                    .evaluation-work-toolbar {
                        align-items: stretch;
                    }
                    .evaluation-work-toolbar__filters {
                        width: 100%;
                    }
                    .evaluation-work-toolbar__filters {
                        margin-left: 0;
                        justify-content: flex-start;
                    }
                }
            `}</style>

            {/* Table */}
            <div style={{
                background: "#fff",
                borderRadius: 8,
                border: "1px solid #e2e8f0",
                overflow: "hidden",
            }}>
                {workView === "pending" && selectedActionableCount > 0 && (
                    <div style={{ padding: "12px 20px", background: "#f8faff", borderBottom: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontSize: 13, color: "#475569" }}>
                            Đã chọn <strong style={{ color: "#1677ff" }}>{selectedActionableCount}</strong> bản đánh giá có thể xử lý
                        </span>
                        <div style={{ display: "flex", gap: 8 }}>
                            {selectedManagerRecords.length > 0 && (
                                <Access permission={ALL_PERMISSIONS.EVALUATION.MANAGER_SUBMIT} hideChildren>
                                    <Popconfirm
                                        title={`Nộp ${selectedManagerRecords.length} bản đã chấm?`}
                                        description="Gửi lên cấp trên phê duyệt. Những bản chưa chấm đủ điểm sẽ không được nộp."
                                        onConfirm={handleBatchSubmit}
                                        okText="Nộp"
                                        cancelText="Hủy"
                                        okButtonProps={{ loading: batchSubmitting }}
                                    >
                                        <Button type="primary" loading={batchSubmitting}>
                                            Nộp {selectedManagerRecords.length} bản đã chấm
                                        </Button>
                                    </Popconfirm>
                                </Access>
                            )}

                            {selectedApproverRecords.length > 0 && (
                                <Access permission={ALL_PERMISSIONS.EVALUATION.BATCH_APPROVE_RECORDS} hideChildren>
                                    <Popconfirm
                                        title={`Duyệt cuối ${selectedApproverRecords.length} bản đánh giá?`}
                                        description="Kết quả sẽ được duyệt hoàn tất và công bố tới nhân viên."
                                        onConfirm={handleBatchApprove}
                                        okText="Duyệt"
                                        cancelText="Hủy"
                                        okButtonProps={{ loading: batchApproving }}
                                    >
                                        <Button type="primary" color="purple" variant="solid" loading={batchApproving}>
                                            Duyệt cuối {selectedApproverRecords.length} bản
                                        </Button>
                                    </Popconfirm>
                                </Access>
                            )}
                        </div>
                    </div>
                )}

                <DataTable<any>
                    rowSelection={workView === "pending" ? {
                        selectedRowKeys,
                        onChange: (keys) => setSelectedRowKeys(keys),
                        getCheckboxProps: (record: any) => ({
                            disabled: !isRecordActionable(record),
                        }),
                    } : undefined}
                    columns={displayColumns}
                    dataSource={filteredRecords}
                    rowKey="workItemKey"
                    loading={loading}
                    pagination={{
                        pageSize: 10,
                        showTotal: (total, range) => `${range[0]}–${range[1]} trên ${total} hồ sơ`,
                    }}
                    scroll={{ x: "max-content" }}
                />
            </div>

            <Drawer
                title={historyRecord ? `Lịch sử đánh giá - ${historyRecord.employee?.fullName || historyRecord.employee?.username || "Nhân viên"}` : "Lịch sử đánh giá"}
                open={!!historyRecord}
                onClose={() => setHistoryRecord(null)}
                width={520}
                destroyOnHidden
            >
                {historyQuery.isLoading ? (
                    <div style={{ color: "#64748b", padding: "16px 0" }}>Đang tải lịch sử...</div>
                ) : (historyQuery.data || []).length === 0 ? (
                    <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Chưa có lịch sử xử lý" />
                ) : (
                    <Timeline
                        items={(historyQuery.data || []).map((item: any) => ({
                            color: item.toStatus === "COMPLETED" ? "green" : item.toStatus === "REVISION_NEEDED" ? "red" : "blue",
                            children: (
                                <div style={{ paddingBottom: 8 }}>
                                    <div style={{ fontWeight: 700, color: "#334155", fontSize: 13 }}>
                                        {item.performedBy?.fullName || item.performedBy?.username || "Hệ thống"}
                                    </div>
                                    <div style={{ color: "#64748b", fontSize: 12, marginTop: 3 }}>
                                        {item.fromStatus ? <EvaluationStatusTag status={item.fromStatus} /> : "Khởi tạo"}
                                        <span style={{ margin: "0 6px" }}>→</span>
                                        <EvaluationStatusTag status={item.toStatus} />
                                    </div>
                                    {item.note && <div style={{ color: "#475569", fontSize: 12, marginTop: 6 }}>{item.note}</div>}
                                    <div style={{ color: "#94a3b8", fontSize: 11, marginTop: 5 }}>
                                        {item.performedAt ? dayjs(item.performedAt).format("DD/MM/YYYY HH:mm") : "—"}
                                    </div>
                                </div>
                            ),
                        }))}
                    />
                )}
            </Drawer>
        </div>
    );

    return isTab ? content : (
        <AccessAny
            permissions={[
                ALL_PERMISSIONS.EVALUATION.GET_PENDING_MANAGER_RECORDS,
                ALL_PERMISSIONS.EVALUATION.GET_PENDING_APPROVAL_RECORDS,
            ]}
        >
            <PageContainer title="Danh sách việc cần xử lý">{content}</PageContainer>
        </AccessAny>
    );
};

const AccessAny = ({ permissions, children }: { permissions: any[]; children: React.ReactNode }) => {
    const grantedPermissions = useAppSelector(state => state.account.user.role.permissions);
    const roleName = useAppSelector(state => state.account.user.role?.name?.toUpperCase() || "");
    const allow = useMemo(() => {
        if (import.meta.env.VITE_ACL_ENABLE === "false") return true;
        if (roleName === "SUPER_ADMIN") return true;
        if (!grantedPermissions?.length) return false;
        return permissions.some(permission =>
            grantedPermissions.some(item =>
                item.apiPath === permission.apiPath &&
                item.method?.toUpperCase() === permission.method?.toUpperCase() &&
                item.module === permission.module
            )
        );
    }, [grantedPermissions, permissions, roleName]);

    return allow ? <>{children}</> : (
        <Empty description="Bạn không có quyền truy cập thông tin này" style={{ padding: 40 }} />
    );
};

export default PendingEvaluationPage;
