import { lazy, Suspense, useState } from "react";
import { Button, Tooltip, Drawer, Timeline, Empty, Badge, Popconfirm } from "antd";
import { useNavigate } from "react-router-dom";
import {
    FileTextOutlined,
    EyeOutlined,
    ClockCircleOutlined,
    SyncOutlined,
    TrophyOutlined,
    FileExcelOutlined,
    HistoryOutlined,
    EditOutlined,
    CheckCircleOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import {
    useAllEvaluationRecordsQuery,
    useMyEvaluationRecordsQuery,
    useEvaluationRecordHistoryQuery,
} from "@/hooks/useEvaluations";
import { callEmployeeConfirmRecord } from "@/config/api";
import { notify } from "@/components/common/notification/notify";
import PageContainer from "@/components/common/data-table/PageContainer";
import AdvancedFilterSelect from "@/components/common/filter/AdvancedFilterSelect";
import Access from "@/components/share/access";
import { ALL_PERMISSIONS } from "@/config/permissions";
import EvaluationStatusTag, { type EvaluationStatus } from "../components/EvaluationStatusTag";
import DataTable from "@/components/common/data-table";
import SearchFilter from "@/components/common/filter/SearchFilter";
import ActionButton from "@/components/common/ui/ActionButton";
import TabBar, { type TabItem } from "@/components/common/tabs/TabBar";

const MyEvaluationDetailDrawer = lazy(() => import("./MyEvaluationDetailPage"));

const GRADE_CONFIG: Record<string, { color: string; bg: string; label: string }> = {
    A: { color: "#389e0d", bg: "#f6ffed", label: "Xuất sắc" },
    B: { color: "#1677ff", bg: "#e6f4ff", label: "Tốt" },
    C: { color: "#d46b08", bg: "#fff7e6", label: "Khá" },
    D: { color: "#cf1322", bg: "#fff1f0", label: "Trung bình" },
    E: { color: "#8c8c8c", bg: "#f5f5f5", label: "Yếu" },
};

const getNumericScore = (value: unknown) => {
    if (value === null || value === undefined || value === "") return null;
    const score = typeof value === "number" ? value : Number(value);
    return Number.isFinite(score) ? score : null;
};

const isEmployeePhaseOpen = (record: any) => {
    const start = record.period?.employeeStartDate;
    const deadline = record.effectiveEmployeeDeadline ?? record.employeeDeadlineOverride ?? record.period?.employeeDeadline;
    return (!start || !dayjs().isBefore(dayjs(start))) && (!deadline || !dayjs().isAfter(dayjs(deadline)));
};

const getDisplayStatus = (record: any): EvaluationStatus => {
    const start = record.period?.employeeStartDate;
    if ((record.status === "EMPLOYEE_DRAFTING" || record.status === "REVISION_NEEDED") && start && dayjs().isBefore(dayjs(start))) {
        return "NOT_STARTED";
    }
    return record.status;
};

const isEmployeeActionable = (record: any) =>
    (record.status === "NOT_STARTED" || record.status === "EMPLOYEE_DRAFTING" || record.status === "REVISION_NEEDED") && isEmployeePhaseOpen(record);

const isEmployeePending = (record: any) =>
    ["NOT_STARTED", "EMPLOYEE_DRAFTING", "REVISION_NEEDED"].includes(record.status);

const STATUS_LABELS: Record<string, string> = {
    NOT_STARTED: "Chưa bắt đầu",
    EMPLOYEE_DRAFTING: "Đang tự đánh giá",
    PENDING_MANAGER_REVIEW: "Chờ Quản lý đánh giá",
    MANAGER_REVIEWING: "Quản lý đang đánh giá",
    PENDING_APPROVAL: "Chờ phê duyệt kết quả",
    REVISION_NEEDED: "Yêu cầu điều chỉnh",
    COMPLETED: "Hoàn tất đánh giá",
};

interface IProps {
    isTab?: boolean;
    viewMode?: "mine" | "all";
}

type EvaluationStatusTab = "EMPLOYEE_DRAFTING" | "PROCESSING" | "COMPLETED";

const MyEvaluationPage = ({ isTab, viewMode = "mine" }: IProps) => {
    const _isTab = isTab;
    const navigate = useNavigate();
    const [searchText, setSearchText] = useState("");
    const [advancedFilters, setAdvancedFilters] = useState<Record<string, any>>({});
    const [activeStatusTab, setActiveStatusTab] = useState<EvaluationStatusTab>("EMPLOYEE_DRAFTING");
    const [historyRecord, setHistoryRecord] = useState<any | null>(null);
    const [selectedEvaluationId, setSelectedEvaluationId] = useState<number | null>(null);
    const [confirmingId, setConfirmingId] = useState<number | null>(null);
    const isAllView = viewMode === "all";
    const myRecordsQuery = useMyEvaluationRecordsQuery(!isAllView);
    const allRecordsQuery = useAllEvaluationRecordsQuery(isAllView);
    const records = (isAllView ? allRecordsQuery.data : myRecordsQuery.data) || [];
    const loading = isAllView ? allRecordsQuery.isLoading : myRecordsQuery.isLoading;
    const historyQuery = useEvaluationRecordHistoryQuery(historyRecord?.id || 0);

    const closeEvaluationDetail = () => {
        setSelectedEvaluationId(null);
        void myRecordsQuery.refetch();
    };

    const handleQuickConfirm = async (recordId: number) => {
        setConfirmingId(recordId);
        try {
            await callEmployeeConfirmRecord(recordId);
            notify.success("Đã xác nhận kết quả đánh giá thành công!");
            void myRecordsQuery.refetch();
        } catch {
            notify.error("Xác nhận thất bại, vui lòng thử lại.");
        } finally {
            setConfirmingId(null);
        }
    };

    const exportFilteredRecords = async () => {
        if (filteredRecords.length === 0) {
            notify.warning("Không có dữ liệu để xuất Excel");
            return;
        }
        const module = await import("xlsx-js-style");
        const XLSXStyle = module.default ?? module;
        const rows = filteredRecords.map((record: any, index: number) => ({
            STT: index + 1,
            "Mã nhân viên": record.employee?.employeeCode || record.employeeCode || "",
            "Tên nhân viên": record.employee?.fullName || record.employee?.username || "",
            "Email": record.employee?.email || "",
            "Công ty": record.employee?.companyName || "",
            "Phòng ban": record.employee?.departmentName || "",
            "Kỳ đánh giá": record.period?.name || record.periodName || "",
            "Biểu mẫu": record.template?.name || "",
            "Trạng thái": STATUS_LABELS[record.status] || record.status || "",
            "Điểm nhân viên": getNumericScore(record.employeeTotalScore) ?? "",
            "Điểm quản lý": getNumericScore(record.managerTotalScore) ?? "",
            "Xếp loại": record.finalGrade || "",
            "Hạn tự đánh giá": (record.effectiveEmployeeDeadline ?? record.employeeDeadlineOverride ?? record.period?.employeeDeadline)
                ? dayjs(record.effectiveEmployeeDeadline ?? record.employeeDeadlineOverride ?? record.period?.employeeDeadline).format("DD/MM/YYYY HH:mm") : "",
            "Ngày hoàn tất": record.completedAt ? dayjs(record.completedAt).format("DD/MM/YYYY HH:mm") : "",
        }));
        const worksheet = XLSXStyle.utils.json_to_sheet(rows);
        worksheet["!cols"] = [6, 15, 24, 28, 22, 22, 24, 24, 28, 15, 15, 12, 18, 20].map(wch => ({ wch }));
        const workbook = XLSXStyle.utils.book_new();
        XLSXStyle.utils.book_append_sheet(workbook, worksheet, "Danh_sach_danh_gia");
        XLSXStyle.writeFile(workbook, `Danh_sach_danh_gia_${dayjs().format("YYYYMMDD_HHmm")}.xlsx`);
        notify.success("Đã xuất Excel theo dữ liệu đang lọc");
    };

    const columns: any[] = [
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
            render: (_: any, record: any) => (
                <div>
                    <div style={{ fontWeight: 700, color: "#1e293b", fontSize: 13 }}>
                        {record.employee?.fullName || record.employee?.name || record.employee?.username || "Chưa rõ nhân sự"}
                    </div>
                    <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>
                        {[record.employee?.jobTitle, record.employee?.departmentName].filter(Boolean).join(" · ") || "Chưa cập nhật chức danh"}
                    </div>
                </div>
            ),
        },
        {
            title: "Kỳ đánh giá",
            dataIndex: ["period", "name"],
            key: "period",
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
            render: (_val: any, record: any) => {
                const displayStatus = getDisplayStatus(record);

                const deadline = record.effectiveEmployeeDeadline ?? record.employeeDeadlineOverride ?? record.period?.employeeDeadline;
                const isPendingAction = isEmployeePending(record);
                const isOverdue = isPendingAction && deadline && dayjs().isAfter(dayjs(deadline));

                if (isOverdue) {
                    return <EvaluationStatusTag status="OVERDUE_EMPLOYEE" />;
                }

                return <EvaluationStatusTag status={displayStatus} />;
            },
        },
        {
            title: <span style={{ display: "inline-flex", minWidth: 132, whiteSpace: "nowrap" }}>Điểm NV đánh giá</span>,
            dataIndex: "employeeTotalScore",
            key: "employeeTotalScore",
            width: 178,
            align: "center" as const,
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
            width: 130,
            align: "center" as const,
            render: (_: any, record: any) => {
                if (record.status !== "COMPLETED") return <span style={{ color: "#d9d9d9" }}>—</span>;
                const score = getNumericScore(record.managerTotalScore);
                return (
                    <span style={{ fontWeight: 700, color: score !== null ? "#7c3aed" : "#d9d9d9", fontSize: 14 }}>
                        {score !== null ? score.toFixed(2) : "—"}
                    </span>
                );
            }
        },
        {
            title: "Xếp loại",
            dataIndex: "finalGrade",
            key: "finalGrade",
            width: 100,
            align: "center" as const,
            render: (_: any, record: any) => {
                const grade = record.finalGrade;
                if (record.status !== "COMPLETED" || !grade) return <span style={{ color: "#d9d9d9" }}>—</span>;
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
            render: (_: any, record: any) => {
                const deadline = record.effectiveEmployeeDeadline ?? record.employeeDeadlineOverride ?? record.period?.employeeDeadline;
                if (!deadline) return <span style={{ color: "#d9d9d9" }}>—</span>;

                const isPendingAction = record.status === "EMPLOYEE_DRAFTING" || record.status === "REVISION_NEEDED";
                const isOverdue = isPendingAction && dayjs().isAfter(dayjs(deadline));
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
            width: isAllView ? 175 : 120,
            fixed: "right",
            render: (_: any, record: any) => {
                const isFuture = record.period?.employeeStartDate && dayjs().isBefore(dayjs(record.period.employeeStartDate));
                const isActionable = isEmployeeActionable(record);
                const needsConfirm = !isAllView && record.status === "COMPLETED" && !record.completedAt;
                const openDetail = () => {
                    if (isFuture) return;
                    if (!isAllView) {
                        setSelectedEvaluationId(record.id);
                        return;
                    }
                    navigate(`/admin/evaluation/${record.status === "PENDING_APPROVAL" ? "approval" : "manager"}/records/${record.id}${isTab ? "?from=process" : ""}`);
                };
                const detailButton = (
                    <Button
                        type={isActionable ? "primary" : "default"}
                        size="small"
                        icon={isActionable ? <EditOutlined /> : <EyeOutlined />}
                        onClick={openDetail}
                        disabled={isFuture}
                        style={{
                            borderRadius: 6,
                            fontWeight: 650,
                            background: isActionable ? "#e8637a" : (isFuture ? "#f1f5f9" : "#ffffff"),
                            color: isActionable ? "#ffffff" : (isFuture ? "#94a3b8" : "#475569"),
                            border: isActionable ? "none" : "1px solid #cbd5e1",
                            fontSize: 12,
                            height: 28,
                        }}
                    >
                        {isFuture ? "Chưa mở" : (isActionable ? "Chấm điểm" : "Chi tiết")}
                    </Button>
                );

                if (!isAllView) return (
                    <div style={{ display: "flex", flexDirection: "column", gap: 5, alignItems: "center" }}>
                        {needsConfirm && (
                            <Access permission={ALL_PERMISSIONS.EVALUATION.EMPLOYEE_CONFIRM} hideChildren>
                                <Popconfirm
                                    title="Xác nhận đã xem kết quả đánh giá?"
                                    onConfirm={() => handleQuickConfirm(record.id)}
                                    okText="Xác nhận"
                                    cancelText="Hủy"
                                >
                                    <Button
                                        size="small"
                                        loading={confirmingId === record.id}
                                        icon={<CheckCircleOutlined />}
                                        style={{
                                            borderRadius: 6,
                                            fontWeight: 700,
                                            background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                                            border: "none",
                                            color: "#fff",
                                            fontSize: 11,
                                            height: 26,
                                            boxShadow: "0 2px 6px rgba(16,185,129,0.35)",
                                            width: "100%",
                                            maxWidth: 140,
                                        }}
                                    >
                                        Xác nhận đã xem
                                    </Button>
                                </Popconfirm>
                            </Access>
                        )}
                        {detailButton}
                    </div>
                );

                return (
                    <div className="evaluation-action-group" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                        {detailButton}
                        <Access permission={ALL_PERMISSIONS.EVALUATION.GET_RECORD_HISTORY} hideChildren>
                            <ActionButton
                                variant="progress"
                                tooltip="Lịch sử xử lý"
                                icon={<HistoryOutlined />}
                                aria-label="Lịch sử xử lý"
                                onClick={() => setHistoryRecord(record)}
                            />
                        </Access>
                    </div>
                );
            },
        },
    ];

    if (isAllView) {
        columns.splice(3, 0, {
            title: "Đơn vị",
            key: "organization",
            width: 190,
            render: (_: any, record: any) => (
                <div>
                    <div style={{ color: "#334155", fontSize: 12, fontWeight: 600 }}>
                        {record.employee?.companyName || "Chưa xác định công ty"}
                    </div>
                    <div style={{ color: "#94a3b8", fontSize: 11, marginTop: 2 }}>
                        {record.employee?.departmentName || "Chưa xác định phòng ban"}
                    </div>
                </div>
            ),
        });
    }

    const baseRecords = records.filter(r =>
        (r.period?.name || "").toLowerCase().includes(searchText.toLowerCase()) ||
        (r.template?.name || "").toLowerCase().includes(searchText.toLowerCase()) ||
        (r.employee?.fullName || r.employee?.username || "").toLowerCase().includes(searchText.toLowerCase()) ||
        (r.employee?.employeeCode || (r as any).employeeCode || "").toLowerCase().includes(searchText.toLowerCase()) ||
        (r.employee?.email || "").toLowerCase().includes(searchText.toLowerCase()) ||
        (r.employee?.companyName || "").toLowerCase().includes(searchText.toLowerCase()) ||
        (r.employee?.departmentName || "").toLowerCase().includes(searchText.toLowerCase())
    );

    const pending = baseRecords.filter(isEmployeePending).length;
    const completed = baseRecords.filter(r => r.status === "COMPLETED").length;
    const inProgress = baseRecords.filter(r =>
        ["PENDING_MANAGER_REVIEW", "MANAGER_REVIEWING", "PENDING_APPROVAL"].includes(r.status)
    ).length;

    const statusTabs: TabItem<EvaluationStatusTab>[] = [
        {
            key: "EMPLOYEE_DRAFTING",
            label: (
                <Badge 
                    count={pending} 
                    color={activeStatusTab === "EMPLOYEE_DRAFTING" ? "#e8637a" : "#e2e8f0"} 
                    style={{ 
                        color: activeStatusTab === "EMPLOYEE_DRAFTING" ? "#ffffff" : "#475569",
                        fontWeight: 700,
                        fontSize: 10,
                        border: "1.5px solid #ffffff",
                        boxShadow: "0 1px 3px rgba(15, 23, 42, 0.15)",
                    }}
                    offset={[8, -8]}
                >
                    <span>{isAllView ? "Đang tự đánh giá" : "Cần tự đánh giá"}</span>
                </Badge>
            ),
            icon: <SyncOutlined />,
        },
        {
            key: "PROCESSING",
            label: (
                <Badge 
                    count={inProgress} 
                    color={activeStatusTab === "PROCESSING" ? "#e8637a" : "#e2e8f0"} 
                    style={{ 
                        color: activeStatusTab === "PROCESSING" ? "#ffffff" : "#475569",
                        fontWeight: 700,
                        fontSize: 10,
                        border: "1.5px solid #ffffff",
                        boxShadow: "0 1px 3px rgba(15, 23, 42, 0.15)",
                    }}
                    offset={[8, -8]}
                >
                    <span>Đang chờ xử lý</span>
                </Badge>
            ),
            icon: <ClockCircleOutlined />,
        },
        {
            key: "COMPLETED",
            label: (
                <Badge 
                    count={completed} 
                    color={activeStatusTab === "COMPLETED" ? "#e8637a" : "#e2e8f0"} 
                    style={{ 
                        color: activeStatusTab === "COMPLETED" ? "#ffffff" : "#475569",
                        fontWeight: 700,
                        fontSize: 10,
                        border: "1.5px solid #ffffff",
                        boxShadow: "0 1px 3px rgba(15, 23, 42, 0.15)",
                    }}
                    offset={[8, -8]}
                >
                    <span>Hoàn tất</span>
                </Badge>
            ),
            icon: <TrophyOutlined />,
        },
    ];

    const filteredRecords = baseRecords.filter(r => {
        if (activeStatusTab === "EMPLOYEE_DRAFTING") {
            if (!isEmployeePending(r)) return false;
        }
        if (activeStatusTab === "PROCESSING" && !["PENDING_MANAGER_REVIEW", "MANAGER_REVIEWING", "PENDING_APPROVAL"].includes(r.status)) return false;
        if (activeStatusTab === "COMPLETED" && r.status !== "COMPLETED") return false;

        if (advancedFilters.periodId) {
            const rPeriodId = r.period?.id || r.periodId;
            if (rPeriodId !== advancedFilters.periodId) return false;
        }

        if (advancedFilters.companyId && r.employee?.companyId !== advancedFilters.companyId) return false;
        if (advancedFilters.departmentId && r.employee?.departmentId !== advancedFilters.departmentId) return false;

        return true;
    });

    const content = (
        <div style={{ padding: isTab ? "8px 0" : 0 }}>
            <style>{`
                .evaluation-action-group {
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    gap: 7px;
                    min-width: 164px;
                }
                .evaluation-admin-modal .ant-select-focused .ant-select-selector,
                .evaluation-admin-modal .ant-picker-focused,
                .evaluation-admin-modal .ant-input:focus,
                .evaluation-admin-modal .ant-input-focused {
                    border-color: #e8356d !important;
                    box-shadow: 0 0 0 2px rgba(232, 53, 109, 0.10) !important;
                }
                .evaluation-admin-modal .evaluation-modal-alert.ant-alert-info {
                    background: #fff5f8;
                    border-color: #ffc7d8;
                }
                .evaluation-admin-modal .evaluation-modal-alert.ant-alert-info .ant-alert-icon {
                    color: #e8356d;
                }
                .evaluation-admin-modal .evaluation-modal-alert .ant-alert-message {
                    color: #7a2944;
                }
                .evaluation-current-evaluator {
                    margin-top: 7px;
                    padding: 8px 10px;
                    background: #fff7fa;
                    border-left: 3px solid #f3a5bd;
                    border-radius: 4px;
                }
                .evaluation-current-evaluator__name { color: #334155; font-size: 12px; font-weight: 700; }
                .evaluation-current-evaluator__meta { margin-top: 2px; color: #64748b; font-size: 11px; }
                .evaluation-role-segmented.ant-segmented {
                    width: 100%;
                    padding: 3px;
                    background: #f6f7f9;
                    border: 1px solid #e5e7eb;
                    border-radius: 6px;
                }
                .evaluation-role-segmented .ant-segmented-group { width: 100%; }
                .evaluation-role-segmented .ant-segmented-item {
                    flex: 1;
                    min-height: 34px;
                    color: #64748b;
                    font-size: 12px;
                    font-weight: 600;
                }
                .evaluation-role-segmented .ant-segmented-item-selected {
                    color: #e8356d;
                    box-shadow: 0 1px 3px rgba(15, 23, 42, 0.08);
                }
                .evaluation-person-picker.ant-btn {
                    width: 100%;
                    height: auto;
                    min-height: 52px;
                    padding: 8px 10px;
                    border-radius: 6px;
                    text-align: left;
                    display: flex;
                    align-items: center;
                    justify-content: flex-start;
                    white-space: normal;
                }
                .evaluation-person-picker.ant-btn:hover,
                .evaluation-person-picker.ant-btn:focus-visible {
                    color: #334155 !important;
                    border-color: #e8356d !important;
                    box-shadow: 0 0 0 2px rgba(232, 53, 109, 0.10);
                }
                .evaluation-person-picker--error.ant-btn { border-color: #ff4d4f; }
                .evaluation-person-picker__icon {
                    width: 32px;
                    min-width: 32px;
                    height: 32px;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    color: #e8356d;
                    background: #fff0f5;
                    border-radius: 5px;
                }
                .evaluation-person-picker__content { flex: 1; min-width: 0; margin: 0 9px; }
                .evaluation-person-picker__name {
                    color: #1e293b;
                    font-size: 12px;
                    font-weight: 700;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                }
                .evaluation-person-picker__meta {
                    margin-top: 2px;
                    color: #64748b;
                    font-size: 11px;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                }
                .evaluation-status-toolbar {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    gap: 16px;
                    flex-wrap: wrap;
                }

                @media (max-width: 768px) {
                    .evaluation-status-toolbar {
                        align-items: stretch;
                    }
                    .evaluation-status-toolbar__filters {
                        width: 100%;
                    }
                }
            `}</style>
            <div style={{ marginBottom: 20, display: "flex", flexDirection: "column", gap: 14 }}>
                <SearchFilter
                    searchPlaceholder={isAllView
                        ? "Tìm nhân viên, mã NV, công ty, phòng ban, kỳ đánh giá..."
                        : "Tìm kỳ đánh giá hoặc biểu mẫu..."}
                    onSearch={setSearchText}
                    showFilterButton={false}
                    showAddButton={false}
                />
                <div className="evaluation-status-toolbar">
                    <TabBar tabs={statusTabs} activeKey={activeStatusTab} onChange={setActiveStatusTab} />
                    <div className="evaluation-status-toolbar__filters" style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <AdvancedFilterSelect
                            fields={[
                                {
                                    key: "periodId",
                                    label: "Kỳ đánh giá",
                                    options: Array.from(
                                        new Map(records.filter(r => r.period?.id).map(r => [r.period!.id, { label: r.period!.name, value: r.period!.id }])).values()
                                    ),
                                },
                                ...(isAllView ? [
                                    {
                                        key: "companyId",
                                        label: "Công ty",
                                        options: Array.from(new Map(
                                            records.filter(r => r.employee?.companyId).map(r => [
                                                r.employee.companyId,
                                                { label: r.employee.companyName || "Chưa đặt tên", value: r.employee.companyId },
                                            ])
                                        ).values()),
                                    },
                                    {
                                        key: "departmentId",
                                        label: "Phòng ban",
                                        options: Array.from(new Map(
                                            records
                                                .filter(r => r.employee?.departmentId && (!advancedFilters.companyId || r.employee.companyId === advancedFilters.companyId))
                                                .map(r => [
                                                    r.employee.departmentId,
                                                    { label: r.employee.departmentName || "Chưa đặt tên", value: r.employee.departmentId },
                                                ])
                                        ).values()),
                                    },
                                ] : []),
                            ]}
                            onChange={setAdvancedFilters}
                        />
                        {isAllView && (
                            <Button icon={<FileExcelOutlined />} onClick={exportFilteredRecords} style={{ color: "#15803d", borderColor: "#86efac", borderRadius: 6, fontWeight: 600 }}>
                                Xuất Excel
                            </Button>
                        )}
                    </div>
                </div>
            </div>

            {/* Table */}
            <div style={{
                background: "#fff",
                borderRadius: 8,
                border: "1px solid #e2e8f0",
                overflow: "hidden",
            }}>
                <div style={{ padding: "16px 20px", borderBottom: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{
                            display: "inline-flex", background: "#eff6ff", color: "#1677ff",
                            padding: "6px", borderRadius: 6
                        }}>
                            <FileTextOutlined style={{ fontSize: 16 }} />
                        </div>
                        <div>
                            <div style={{ fontSize: 15, fontWeight: 600, color: "#0f172a" }}>
                                {activeStatusTab === "EMPLOYEE_DRAFTING" ? (isAllView ? "Hồ sơ đang ở bước nhân viên tự đánh giá" : "Hồ sơ cần tự đánh giá") :
                                    activeStatusTab === "PROCESSING" ? "Hồ sơ đang chờ xử lý" :
                                        "Danh sách đã hoàn tất"}
                            </div>
                            <div style={{ fontSize: 13, color: "#64748b", marginTop: 2 }}>
                                {activeStatusTab === "EMPLOYEE_DRAFTING" ? (isAllView ? "Các hồ sơ nhân viên chưa nộp hoặc đang tự đánh giá" : "Các bản đánh giá thuộc trách nhiệm tự đánh giá của bạn") :
                                    activeStatusTab === "PROCESSING" ? "Các bản đã nộp và đang chờ Quản lý đánh giá hoặc Cấp phê duyệt xử lý" :
                                        "Các bản đánh giá đã có kết quả chính thức"}
                            </div>
                        </div>
                    </div>
                </div>
                <DataTable<any>
                    columns={columns}
                    dataSource={filteredRecords}
                    rowKey="id"
                    loading={loading}
                    pagination={{
                        pageSize: 10,
                        showTotal: (total, range) => `${range[0]}–${range[1]} trên ${total} hồ sơ`,
                    }}
                    scroll={{ x: "max-content" }}
                />
            </div>

            {selectedEvaluationId != null && (
                <Suspense fallback={null}>
                    <MyEvaluationDetailDrawer
                        recordId={selectedEvaluationId}
                        onClose={closeEvaluationDetail}
                    />
                </Suspense>
            )}

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
                    <Timeline items={(historyQuery.data || []).map((item: any) => ({
                        color: item.toStatus === "COMPLETED" ? "green" : item.toStatus === "REVISION_NEEDED" ? "red" : "blue",
                        children: (
                            <div style={{ paddingBottom: 8 }}>
                                <div style={{ fontWeight: 700, color: "#334155", fontSize: 13 }}>{item.performedBy?.fullName || item.performedBy?.username || "Hệ thống"}</div>
                                <div style={{ color: "#475569", fontSize: 12, marginTop: 3 }}>
                                    {item.fromStatus ? (STATUS_LABELS[item.fromStatus] || item.fromStatus) : "Khởi tạo"} → {STATUS_LABELS[item.toStatus] || item.toStatus}
                                </div>
                                {item.note && <div style={{ color: "#64748b", fontSize: 12, marginTop: 5 }}>{item.note}</div>}
                                <div style={{ color: "#94a3b8", fontSize: 11, marginTop: 5 }}>{item.performedAt ? dayjs(item.performedAt).format("DD/MM/YYYY HH:mm") : "—"}</div>
                            </div>
                        ),
                    }))} />
                )}
            </Drawer>

        </div>
    );

    return (
        <Access permission={isAllView ? ALL_PERMISSIONS.EVALUATION.GET_ALL_RECORDS : ALL_PERMISSIONS.EVALUATION.GET_MY_RECORDS}>
            {isTab ? content : <PageContainer title={isAllView ? "Tất cả đánh giá" : "Đánh giá của tôi"}>{content}</PageContainer>}
        </Access>
    );
};

export default MyEvaluationPage;
