import { useEffect, useState, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { Button, Tooltip, Empty, Popconfirm, Drawer, Timeline, Table, Badge } from "antd";
import {
    EyeOutlined,
    EditOutlined,
    HistoryOutlined,
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
import TabBar, { type TabItem } from "@/components/common/tabs/TabBar";
import ManagerEvaluationDetailPage from "../manager/ManagerEvaluationDetailPage";
import ApprovalDetailPage from "../approval/ApprovalDetailPage";
import ActionButton from "@/components/common/ui/ActionButton";
import ConfirmModal from "@/components/common/modal/ConfirmModal";

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
    const [searchParams, setSearchParams] = useSearchParams();
    const [workView, setWorkView] = useState<WorkView>("pending");
    const [searchText, setSearchText] = useState("");
    const [advancedFilters, setAdvancedFilters] = useState<Record<string, any>>({});
    const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
    const [batchSubmitting, setBatchSubmitting] = useState(false);
    const [filterResetSignal, setFilterResetSignal] = useState(0);
    const [historyRecord, setHistoryRecord] = useState<any | null>(null);
    const [activeDetailRecord, setActiveDetailRecord] = useState<any | null>(null);
    const [openBatchSubmitModal, setOpenBatchSubmitModal] = useState(false);
    const [openBatchApproveModal, setOpenBatchApproveModal] = useState(false);

    const requestedRecordId = Number(searchParams.get("recordId"));
    const requestedDetailRole = searchParams.get("detailRole");

    useEffect(() => {
        if (!Number.isInteger(requestedRecordId) || requestedRecordId <= 0) return;
        if (requestedDetailRole !== "MANAGER" && requestedDetailRole !== "APPROVER") return;
        setActiveDetailRecord({ id: requestedRecordId, evalRole: requestedDetailRole });
    }, [requestedDetailRole, requestedRecordId]);

    const qc = useQueryClient();
    const pendingManagerQuery = usePendingManagerRecordsQuery(true);
    const pendingApprovalQuery = usePendingApprovalRecordsQuery(true);
    const managerHistoryQuery = useManagerRecordsQuery(true);
    const approvalHistoryQuery = useApprovalRecordsQuery(true);
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
        const isProcessed = (record: any, role: "MANAGER" | "APPROVER") => {
            const hasRoleRecord = { ...record, evalRole: role };
            if (isRecordActionable(hasRoleRecord)) return false;
            if (record.status === "EMPLOYEE_DRAFTING" || record.status === "NOT_STARTED") return false;
            return true;
        };
        const managerCount = (managerHistoryQuery.data || []).filter((r: any) => isProcessed(r, "MANAGER")).length;
        const approvalCount = (approvalHistoryQuery.data || []).filter((r: any) => isProcessed(r, "APPROVER")).length;
        return managerCount + approvalCount;
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
                <Badge 
                    count={pendingWorkCount} 
                    color={workView === "pending" ? "#e8637a" : "#e2e8f0"} 
                    style={{ 
                        color: workView === "pending" ? "#ffffff" : "#475569",
                        fontWeight: 700,
                        fontSize: 10,
                        border: "1.5px solid #ffffff",
                        boxShadow: "0 1px 3px rgba(15, 23, 42, 0.15)",
                    }}
                    offset={[8, -8]}
                >
                    <span>Cần xử lý</span>
                </Badge>
            ),
        },
        {
            key: "history",
            label: (
                <Badge 
                    count={processedWorkCount} 
                    color={workView === "history" ? "#e8637a" : "#e2e8f0"} 
                    style={{ 
                        color: workView === "history" ? "#ffffff" : "#475569",
                        fontWeight: 700,
                        fontSize: 10,
                        border: "1.5px solid #ffffff",
                        boxShadow: "0 1px 3px rgba(15, 23, 42, 0.15)",
                    }}
                    offset={[8, -8]}
                >
                    <span>Đã xử lý</span>
                </Badge>
            ),
        },
    ], [pendingWorkCount, processedWorkCount, workView]);

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

    const closeDetailDrawer = () => {
        setActiveDetailRecord(null);
        setSearchParams(current => {
            const next = new URLSearchParams(current);
            next.delete("recordId");
            next.delete("detailRole");
            return next;
        }, { replace: true });
        qc.invalidateQueries({ queryKey: ["pending-manager-evaluation-records"] });
        qc.invalidateQueries({ queryKey: ["pending-approval-evaluation-records"] });
        qc.invalidateQueries({ queryKey: ["manager-evaluation-records"] });
        qc.invalidateQueries({ queryKey: ["approval-evaluation-records"] });
        qc.invalidateQueries({ queryKey: ["all-evaluation-records"] });
        qc.invalidateQueries({ queryKey: ["evaluation-task-counts"] });
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
                    notify.warning(
                        `${failedCount} bản đánh giá chưa được xử lý. ${successCount} bản đã phê duyệt thành công.`,
                        { title: "Duyệt hàng loạt chưa hoàn tất" },
                    );
                } else {
                    notify.success(`Đã phê duyệt kết quả thành công ${successCount} bản đánh giá`);
                }
                clearProcessedSelection(selectedApproverRecords);
            },
            onError: (err: any) => {
                notify.error(err?.response?.data?.message || "Không thể phê duyệt các bản đánh giá đã chọn. Vui lòng thử lại.");
            }
        });
    };

    const statusFilters = useMemo(() => {
        const labels: Record<string, string> = {
            PENDING_MANAGER_REVIEW: "Chờ Quản lý đánh giá",
            MANAGER_REVIEWING: "Quản lý đang đánh giá",
            PENDING_APPROVAL: "Chờ phê duyệt kết quả",
            COMPLETED: "Hoàn tất đánh giá",
            REVISION_NEEDED: "Yêu cầu điều chỉnh",
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
            title: <span className="evaluation-table-nowrap">Điểm NV đánh giá</span>,
            dataIndex: "employeeTotalScore",
            key: "employeeTotalScore",
            width: 178,
            align: "center" as const,
            sorter: (a: any, b: any) => (getNumericScore(a.employeeTotalScore) ?? -1) - (getNumericScore(b.employeeTotalScore) ?? -1),
            render: (_: any, record: any) => {
                const score = getNumericScore(record.employeeTotalScore);
                return (
                    <span style={{ fontWeight: 750, color: score !== null ? "#64748b" : "#cbd5e1", fontSize: 14 }}>
                        {score !== null ? score.toFixed(2) : "—"}
                    </span>
                );
            },
        },
        {
            title: <div style={{ whiteSpace: "nowrap" }}>Điểm quản lý</div>,
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
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", color, fontWeight }}>
                        <span style={{ fontSize: 13 }}>{dayjs(deadline).format("DD/MM/YYYY")}</span>
                        <span style={{ fontSize: 11, color: isOverdue ? "#cf1322" : "#8c8c8c", marginTop: 2 }}>
                            {dayjs(deadline).format("HH:mm")}
                        </span>
                        {isOverdue && <div style={{ fontSize: 10, marginTop: 2 }}>(Quá hạn)</div>}
                    </div>
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
            render: (_: any, record: any) => {
                if (!record.completedAt) {
                    return <span style={{ fontSize: 12, color: "#d9d9d9" }}>—</span>;
                }
                return (
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", color: "#374151" }}>
                        <span style={{ fontSize: 13 }}>{dayjs(record.completedAt).format("DD/MM/YYYY")}</span>
                        <span style={{ fontSize: 11, color: "#8c8c8c", marginTop: 2 }}>
                            {dayjs(record.completedAt).format("HH:mm")}
                        </span>
                    </div>
                );
            },
        },
        {
            title: "Hành động",
            key: "action",
            align: "center" as const,
            width: 160,
            fixed: "right" as const,
            render: (_: any, record: any) => {
                const isManager = record.evalRole === "MANAGER";
                const isHighlight = isManager
                    ? record.status === "PENDING_MANAGER_REVIEW" || record.status === "MANAGER_REVIEWING"
                    : record.status === "PENDING_APPROVAL";

                const label = isHighlight
                    ? (isManager ? "Đánh giá" : "Phê duyệt")
                    : "Chi tiết";

                return (
                    <div style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                        <ActionButton
                            variant="progress"
                            tooltip="Xem lịch sử xử lý"
                            icon={<HistoryOutlined />}
                            aria-label="Xem lịch sử xử lý"
                            onClick={() => setHistoryRecord(record)}
                        />
                        <Button
                            type={isHighlight ? "primary" : "default"}
                            size="small"
                            icon={isHighlight ? <EditOutlined /> : <EyeOutlined />}
                            onClick={() => setActiveDetailRecord(record)}
                            style={{
                                borderRadius: 6,
                                fontWeight: 650,
                                background: isHighlight ? "#e8637a" : "#ffffff",
                                color: isHighlight ? "#ffffff" : "#475569",
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
        if (workView === "history") {
            if (isRecordActionable(record)) return false;
            if (record.status === "EMPLOYEE_DRAFTING" || record.status === "NOT_STARTED") return false;
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

    const tableLoading = loading && filteredRecords.length === 0;

    const content = (
        <>
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
                                    label: "Loại việc",
                                    options: [
                                        { label: "Tất cả", value: "" },
                                        { label: "Đánh giá", value: "manager" },
                                        { label: "Phê duyệt", value: "approver" }
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

                .evaluation-table-nowrap {
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    white-space: nowrap;
                    min-width: 132px;
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
                                    <Button type="primary" loading={batchSubmitting} onClick={() => setOpenBatchSubmitModal(true)}>
                                        Nộp {selectedManagerRecords.length} bản đã đánh giá
                                    </Button>
                                </Access>
                            )}

                            {selectedApproverRecords.length > 0 && (
                                <Access permission={ALL_PERMISSIONS.EVALUATION.BATCH_APPROVE_RECORDS} hideChildren>
                                    <Button type="primary" color="purple" variant="solid" loading={batchApproving} onClick={() => setOpenBatchApproveModal(true)}>
                                        Phê duyệt {selectedApproverRecords.length} bản
                                    </Button>
                                </Access>
                            )}
                        </div>
                    </div>
                )}

                <Table
                    rowSelection={workView === "pending" ? {
                        selectedRowKeys,
                        onChange: (keys) => setSelectedRowKeys(keys),
                        getCheckboxProps: (record: any) => ({
                            disabled: !isRecordActionable(record),
                        }),
                    } : undefined}
                    className="my-eval-table"
                    columns={displayColumns}
                    dataSource={filteredRecords}
                    rowKey="workItemKey"
                    loading={tableLoading}
                    pagination={{ pageSize: 10, size: "small", showTotal: (total, range) => `${range[0]}–${range[1]} trên ${total} hồ sơ` }}
                    size="middle"
                    scroll={{ x: "max-content" }}
                    locale={{
                        emptyText: (
                            <Empty
                                image={Empty.PRESENTED_IMAGE_SIMPLE}
                                description={
                                    workView === "pending"
                                        ? "Không có hồ sơ nào đang chờ xử lý."
                                        : "Chưa có lịch sử xử lý."
                                }
                                style={{ margin: "40px 0" }}
                            />
                        ),
                    }}
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
            {activeDetailRecord?.evalRole === "MANAGER" && (
                <ManagerEvaluationDetailPage
                    recordId={activeDetailRecord.id}
                    onClose={closeDetailDrawer}
                />
            )}
            {activeDetailRecord?.evalRole === "APPROVER" && (
                <ApprovalDetailPage
                    recordId={activeDetailRecord.id}
                    onClose={closeDetailDrawer}
                />
            )}

            <ConfirmModal
                open={openBatchSubmitModal}
                variant="info"
                title={`Nộp ${selectedManagerRecords.length} bản đã đánh giá?`}
                description="Gửi lên cấp phê duyệt. Những bản chưa hoàn thành đánh giá sẽ không được nộp."
                okText="Nộp ngay"
                onConfirm={async () => {
                    setOpenBatchSubmitModal(false);
                    await handleBatchSubmit();
                }}
                onCancel={() => setOpenBatchSubmitModal(false)}
                loading={batchSubmitting}
            />

            <ConfirmModal
                open={openBatchApproveModal}
                variant="success"
                title={`Phê duyệt ${selectedApproverRecords.length} bản đánh giá?`}
                description="Kết quả sẽ được phê duyệt hoàn tất và công bố tới nhân viên."
                okText="Phê duyệt ngay"
                onConfirm={async () => {
                    setOpenBatchApproveModal(false);
                    await handleBatchApprove();
                }}
                onCancel={() => setOpenBatchApproveModal(false)}
                loading={batchApproving}
            />
        </>
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
