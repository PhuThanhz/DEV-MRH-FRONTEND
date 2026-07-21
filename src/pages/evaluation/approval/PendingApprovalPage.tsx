import { useState } from "react";
import { Table, Tag, Button, Tooltip, Empty, Popconfirm, Tabs } from "antd";
import {
    FileTextOutlined,
    EyeOutlined,
    ClockCircleOutlined,
    CheckCircleOutlined,
    SyncOutlined,
    StopOutlined,
    TrophyOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { notify } from "@/components/common/notification/notify";
import { usePendingApprovalRecordsQuery, useApprovalRecordsQuery, useBatchApproveRecordsMutation } from "@/hooks/useEvaluations";
import PageContainer from "@/components/common/data-table/PageContainer";
import SearchFilter from "@/components/common/filter/SearchFilter";
import AdvancedFilterSelect from "@/components/common/filter/AdvancedFilterSelect";
import Access from "@/components/share/access";
import { ALL_PERMISSIONS } from "@/config/permissions";
import { useQueryClient } from "@tanstack/react-query";
import ApprovalDetailPage from "./ApprovalDetailPage";
import ConfirmModal from "@/components/common/modal/ConfirmModal";

type RecordStatus =
    | "NOT_STARTED"
    | "EMPLOYEE_DRAFTING"
    | "PENDING_MANAGER_REVIEW"
    | "MANAGER_REVIEWING"
    | "PENDING_APPROVAL"
    | "COMPLETED";

const STATUS_CONFIG: Record<RecordStatus, { text: string; color: string; icon: React.ReactNode; tagColor: string }> = {
    NOT_STARTED: { text: "Chưa bắt đầu", color: "#8c8c8c", icon: <StopOutlined />, tagColor: "default" },
    EMPLOYEE_DRAFTING: { text: "Đang tự đánh giá", color: "#1677ff", icon: <SyncOutlined spin />, tagColor: "processing" },
    PENDING_MANAGER_REVIEW: { text: "Chờ Quản lý đánh giá", color: "#fa8c16", icon: <ClockCircleOutlined />, tagColor: "warning" },
    MANAGER_REVIEWING: { text: "Quản lý đang đánh giá", color: "#722ed1", icon: <SyncOutlined spin />, tagColor: "purple" },
    PENDING_APPROVAL: { text: "Chờ phê duyệt kết quả", color: "#13c2c2", icon: <ClockCircleOutlined />, tagColor: "cyan" },
    COMPLETED: { text: "Hoàn tất đánh giá", color: "#52c41a", icon: <CheckCircleOutlined />, tagColor: "success" },
};

const GRADE_CONFIG: Record<string, { color: string; bg: string; label: string }> = {
    A: { color: "#389e0d", bg: "#f6ffed", label: "Xuất sắc" },
    B: { color: "#1677ff", bg: "#e6f4ff", label: "Tốt" },
    C: { color: "#d46b08", bg: "#fff7e6", label: "Khá" },
    D: { color: "#cf1322", bg: "#fff1f0", label: "Trung bình" },
    E: { color: "#8c8c8c", bg: "#f5f5f5", label: "Yếu" },
};

interface IProps {
    isTab?: boolean;
}

const PendingApprovalPage = ({ isTab }: IProps) => {
    const _isTab = isTab;
    const [activeTab, setActiveTab] = useState("pending");
    const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
    const [searchText, setSearchText] = useState("");
    const [advancedFilters, setAdvancedFilters] = useState<Record<string, any>>({});
    const [selectedCard, setSelectedCard] = useState<string | null>(null);
    const [activeDetailRecord, setActiveDetailRecord] = useState<any | null>(null);
    const [openBatchApproveModal, setOpenBatchApproveModal] = useState(false);

    const qc = useQueryClient();
    const pendingQuery = usePendingApprovalRecordsQuery(activeTab === "pending");
    const approvalQuery = useApprovalRecordsQuery(activeTab === "history");
    const batchApproveMutation = useBatchApproveRecordsMutation();

    const records: any[] = activeTab === "pending" ? (pendingQuery.data || []) : (approvalQuery.data || []);
    const loading = activeTab === "pending" ? pendingQuery.isLoading : approvalQuery.isLoading;
    const batchApproving = batchApproveMutation.isPending;

    const closeDetailDrawer = () => {
        setActiveDetailRecord(null);
        qc.invalidateQueries({ queryKey: ["pending-approval-evaluation-records"] });
        qc.invalidateQueries({ queryKey: ["approval-evaluation-records"] });
        qc.invalidateQueries({ queryKey: ["all-evaluation-records"] });
        qc.invalidateQueries({ queryKey: ["evaluation-task-counts"] });
    };

    const handleBatchApprove = async () => {
        if (selectedRowKeys.length === 0) return;
        batchApproveMutation.mutate(selectedRowKeys as number[], {
            onSuccess: (res: any) => {
                const data = res?.data;
                const successCount = data?.successIds?.length ?? selectedRowKeys.length;
                const failedCount = data?.failedRecords?.length ?? 0;
                
                if (failedCount > 0) {
                    notify.warning(
                        `${failedCount} bản đánh giá chưa được xử lý. ${successCount} bản đã phê duyệt thành công.`,
                        { title: "Phê duyệt hàng loạt chưa hoàn tất" },
                    );
                } else {
                    notify.success(`Đã phê duyệt kết quả đánh giá thành công ${successCount} bản đánh giá`);
                }
                setSelectedRowKeys([]);
            },
            onError: (err: any) => {
                notify.error(err?.response?.data?.message || "Không thể phê duyệt các bản đánh giá đã chọn. Vui lòng thử lại.");
            }
        });
    };

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
            title: "Nhân viên",
            dataIndex: "employee",
            key: "employee",
            render: (val: any) => (
                <div>
                    <div style={{ fontWeight: 700, color: "#1e293b", fontSize: 13 }}>{val?.fullName || val?.username || val?.email}</div>
                    <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>
                        {val?.jobTitle || "Chưa cập nhật chức danh"} {val?.positionLevel ? `(${val?.positionLevel})` : ""}
                    </div>
                </div>
            ),
        },
        {
            title: "Kỳ đánh giá",
            dataIndex: ["period", "name"],
            key: "period",
            render: (val: string, record: any) => (
                <div>
                    <div style={{ fontWeight: 700, color: "#1e293b", fontSize: 13 }}>{val || record.periodName}</div>
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
            render: (val: string) => (
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <FileTextOutlined style={{ color: "#3b82f6", fontSize: 13 }} />
                    <span style={{ fontSize: 12, fontWeight: 500, color: "#374151" }}>{val}</span>
                </div>
            ),
        },
        {
            title: "Trạng thái",
            dataIndex: "status",
            key: "status",
            width: 170,
            align: "center" as const,
            render: (val: RecordStatus, record: any) => {
                const empDeadline = record.effectiveEmployeeDeadline ?? record.employeeDeadlineOverride ?? record.period?.employeeDeadline;
                const isEmpPending = record.status === "EMPLOYEE_DRAFTING" || record.status === "REVISION_NEEDED";
                const isEmpOverdue = isEmpPending && empDeadline && dayjs().isAfter(dayjs(empDeadline));

                const mgrDeadline = record.effectiveManagerDeadline ?? record.managerDeadlineOverride ?? record.period?.managerDeadline;
                const isMgrPending = record.status === "PENDING_MANAGER_REVIEW" || record.status === "MANAGER_REVIEWING";
                const isMgrOverdue = isMgrPending && mgrDeadline && dayjs().isAfter(dayjs(mgrDeadline));

                const appDeadline = record.effectiveApprovalDeadline ?? record.approvalDeadlineOverride ?? record.period?.approvalDeadline;
                const isAppPending = record.status === "PENDING_APPROVAL";
                const isAppOverdue = isAppPending && appDeadline && dayjs().isAfter(dayjs(appDeadline));

                if (isEmpOverdue) {
                    return (
                        <Tag
                            color="error"
                            icon={<ClockCircleOutlined />}
                            style={{ borderRadius: 20, fontWeight: 600, fontSize: 11, padding: "2px 10px" }}
                        >
                            Quá hạn tự đánh giá
                        </Tag>
                    );
                }

                if (isMgrOverdue) {
                    return (
                        <Tag
                            color="error"
                            icon={<ClockCircleOutlined />}
                            style={{ borderRadius: 20, fontWeight: 600, fontSize: 11, padding: "2px 10px" }}
                        >
                            Quá hạn chấm điểm
                        </Tag>
                    );
                }

                if (isAppOverdue) {
                    return (
                        <Tag
                            color="error"
                            icon={<ClockCircleOutlined />}
                            style={{ borderRadius: 20, fontWeight: 600, fontSize: 11, padding: "2px 10px" }}
                        >
                            Quá hạn phê duyệt
                        </Tag>
                    );
                }

                const cfg = STATUS_CONFIG[val] ?? STATUS_CONFIG.NOT_STARTED;
                return (
                    <Tag
                        color={cfg.tagColor}
                        icon={cfg.icon}
                        style={{ borderRadius: 20, fontWeight: 600, fontSize: 11, padding: "2px 10px" }}
                    >
                        {cfg.text}
                    </Tag>
                );
            },
        },
        {
            title: <div style={{ whiteSpace: "nowrap" }}>Điểm NV đánh giá</div>,
            dataIndex: "employeeTotalScore",
            key: "employeeTotalScore",
            width: 120,
            align: "center" as const,
            render: (val: number | null) => (
                <span style={{ fontWeight: 700, color: val ? "#1677ff" : "#d9d9d9", fontSize: 14 }}>
                    {val != null ? val.toFixed(2) : "—"}
                </span>
            ),
        },
        {
            title: <div style={{ whiteSpace: "nowrap" }}>Điểm quản lý</div>,
            dataIndex: "managerTotalScore",
            key: "managerTotalScore",
            width: 120,
            align: "center" as const,
            render: (val: number | null) => (
                <span style={{ fontWeight: 700, color: val ? "#7c3aed" : "#d9d9d9", fontSize: 14 }}>
                    {val != null ? val.toFixed(2) : "—"}
                </span>
            ),
        },
        {
            title: "Xếp loại",
            dataIndex: "finalGrade",
            key: "finalGrade",
            width: 100,
            align: "center" as const,
            render: (val: string | null) => {
                if (!val) return <span style={{ color: "#d9d9d9" }}>—</span>;
                const cfg = GRADE_CONFIG[val] ?? { color: "#8c8c8c", bg: "#f5f5f5", label: val };
                return (
                    <Tooltip title={cfg.label}>
                        <span style={{
                            display: "inline-flex", alignItems: "center", justifyContent: "center",
                            width: 32, height: 32, borderRadius: "50%",
                            background: cfg.bg, border: `2px solid ${cfg.color}`,
                            color: cfg.color, fontWeight: 800, fontSize: 15
                        }}>
                            {val}
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
                const deadline = record.effectiveApprovalDeadline ?? record.approvalDeadlineOverride ?? record.period?.approvalDeadline;
                if (!deadline) return <span style={{ color: "#d9d9d9" }}>—</span>;
                
                const isPendingAction = record.status === "PENDING_APPROVAL";
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
            render: (val: string | null) => {
                if (!val) {
                    return <span style={{ fontSize: 12, color: "#d9d9d9" }}>—</span>;
                }
                return (
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", color: "#374151" }}>
                        <span style={{ fontSize: 13 }}>{dayjs(val).format("DD/MM/YYYY")}</span>
                        <span style={{ fontSize: 11, color: "#8c8c8c", marginTop: 2 }}>
                            {dayjs(val).format("HH:mm")}
                        </span>
                    </div>
                );
            },
        },
        {
            title: "Hành động",
            key: "action",
            align: "center" as const,
            width: 140,
            fixed: "right" as const,
            render: (_: any, record: any) => (
                <Button
                    type="primary"
                    size="small"
                    icon={<EyeOutlined />}
                    onClick={() => setActiveDetailRecord(record)}
                    style={{
                        borderRadius: 6,
                        fontWeight: 600,
                        background: record.status === "PENDING_APPROVAL" ? "#1677ff" : "#ffffff",
                        color: record.status === "PENDING_APPROVAL" ? "#ffffff" : "#334155",
                        border: record.status === "PENDING_APPROVAL" ? "none" : "1px solid #cbd5e1",
                        fontSize: 12,
                        height: 28,
                    }}
                >
                    {record.status === "PENDING_APPROVAL" ? "Phê duyệt kết quả" : "Xem chi tiết"}
                </Button>
            ),
        },
    ];

    const pending = records.filter(r => r.status === "PENDING_APPROVAL").length;
    const completed = records.filter(r => r.status === "COMPLETED").length;
    const returned = records.filter(r => r.status === "REVISION_NEEDED").length;

    const baseRecords = records.filter(record => {
        return (
            (record.period?.name || record.periodName || "").toLowerCase().includes(searchText.toLowerCase()) ||
            (record.template?.name || "").toLowerCase().includes(searchText.toLowerCase()) ||
            (record.employee?.fullName || "").toLowerCase().includes(searchText.toLowerCase())
        );
    });

    const filteredRecords = baseRecords.filter(r => {
        if (activeTab === "history") {
            if (r.status !== "COMPLETED" && r.status !== "REVISION_NEEDED") return false;
        }

        if (advancedFilters.status) {
            if (advancedFilters.status === "EMPLOYEE_DRAFTING" && r.status !== "PENDING_APPROVAL") return false;
            if (advancedFilters.status === "PROCESSING") return false;
            if (advancedFilters.status === "COMPLETED" && r.status !== "COMPLETED") return false;
        }

        if (advancedFilters.periodId) {
            const rPeriodId = r.period?.id || r.periodId;
            if (rPeriodId !== advancedFilters.periodId) return false;
        }

        if (advancedFilters.departmentId) {
            if (r.employee?.departmentId !== advancedFilters.departmentId) return false;
        }

        if (advancedFilters.overdue === "overdue") {
            const deadline = r.effectiveApprovalDeadline ?? r.approvalDeadlineOverride ?? r.period?.approvalDeadline;
            const isPendingAction = r.status === "PENDING_APPROVAL";
            const isOverdue = isPendingAction && deadline && dayjs().isAfter(dayjs(deadline));
            if (!isOverdue) return false;
        }

        return true;
    });

    // Lọc theo card được chọn
    const cardFilteredRecords = selectedCard ? filteredRecords.filter(r => {
        if (selectedCard === "pending") return r.status === "PENDING_APPROVAL";
        if (selectedCard === "returned") return r.status === "REVISION_NEEDED";
        if (selectedCard === "completed") return r.status === "COMPLETED";
        return true;
    }) : filteredRecords;

    const content = (
        <>
            <style>{`
                .my-eval-table .ant-table-thead > tr > th {
                    background: #f8fafc !important;
                    color: #475569 !important;
                    font-size: 12px !important;
                    font-weight: 600 !important;
                    border-bottom: 1px solid #e2e8f0 !important;
                    padding: 12px 16px !important;
                }
                .my-eval-table .ant-table-tbody > tr > td {
                    border-bottom: 1px solid #f1f5f9 !important;
                    padding: 12px 16px !important;
                    font-size: 13px !important;
                }
                .my-eval-table .ant-table-tbody > tr:hover > td {
                    background: #f8fafc !important;
                }
                .my-eval-table .ant-pagination {
                    margin: 16px 20px !important;
                }
                .custom-pink-tabs .ant-tabs-tab.ant-tabs-tab-active .ant-tabs-tab-btn {
                    color: #db2777 !important; /* Premium pink */
                    font-weight: 600 !important;
                }
                .custom-pink-tabs .ant-tabs-ink-bar {
                    background: #db2777 !important;
                }
                .custom-pink-tabs .ant-tabs-tab:hover .ant-tabs-tab-btn {
                    color: #f472b6 !important;
                }
            `}</style>

            {/* Summary Cards */}
            <div style={{ display: "flex", gap: 16, marginBottom: 24, flexWrap: "wrap" }}>
                {[
                    {
                        label: "Chờ phê duyệt kết quả",
                        value: pending,
                        color: "#1677ff",
                        key: "pending",
                        icon: (
                            <div style={{ background: "#e6f4ff", padding: "10px", borderRadius: "8px", display: "flex" }}>
                                <SyncOutlined style={{ fontSize: 20, color: "#1677ff" }} />
                            </div>
                        ),
                    },
                    {
                        label: "Yêu cầu điều chỉnh",
                        value: returned,
                        color: "#722ed1",
                        key: "returned",
                        icon: (
                            <div style={{ background: "#f9f0ff", padding: "10px", borderRadius: "8px", display: "flex" }}>
                                <ClockCircleOutlined style={{ fontSize: 20, color: "#722ed1" }} />
                            </div>
                        ),
                    },
                    {
                        label: "Hoàn tất",
                        value: completed,
                        color: "#389e0d",
                        key: "completed",
                        icon: (
                            <div style={{ background: "#f6ffed", padding: "10px", borderRadius: "8px", display: "flex" }}>
                                <TrophyOutlined style={{ fontSize: 20, color: "#389e0d" }} />
                            </div>
                        ),
                    },
                ].map(item => (
                    <div
                        key={item.label}
                        onClick={() => setSelectedCard(prev => prev === item.key ? null : item.key)}
                        style={{
                            flex: 1, minWidth: 180,
                            background: selectedCard === item.key ? "#f0f7ff" : "#ffffff",
                            border: selectedCard === item.key ? `2px solid ${item.color}` : "1px solid #e2e8f0",
                            borderRadius: 8,
                            padding: "16px 20px",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            cursor: "pointer",
                            transition: "all 0.2s",
                        }}
                    >
                        <div>
                            <div style={{ fontSize: 13, fontWeight: 600, color: "#64748b" }}>
                                {item.label}
                            </div>
                            <div style={{ fontSize: 28, fontWeight: 700, color: "#0f172a", marginTop: 4 }}>
                                {item.value}
                            </div>
                        </div>
                        {item.icon}
                    </div>
                ))}
            </div>

            {/* Table */}
            <div style={{
                background: "#fff",
                borderRadius: 8,
                border: "1px solid #e2e8f0",
                overflow: "hidden",
            }}>
                <Tabs
                    activeKey={activeTab}
                    onChange={setActiveTab}
                    className="custom-pink-tabs"
                    tabBarStyle={{ padding: "0 20px", paddingTop: "12px", marginBottom: 0, background: "#fff" }}
                    items={[
                        { key: "pending", label: "Cần chấm & duyệt" },
                        { key: "history", label: "Lịch sử xử lý" },
                    ]}
                />
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
                                {activeTab === "pending" ? "Hồ sơ chờ phê duyệt kết quả" : "Hồ sơ đã phê duyệt"}
                            </div>
                            <div style={{ fontSize: 13, color: "#64748b", marginTop: 2 }}>
                                {activeTab === "pending" ? "Các bản đánh giá thuộc trách nhiệm của Cấp phê duyệt" : "Các bản đánh giá đã phê duyệt hoặc yêu cầu điều chỉnh"}
                            </div>
                        </div>
                    </div>
                    <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                        <AdvancedFilterSelect 
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
                                }
                            ]}
                            onChange={(filters) => setAdvancedFilters(filters)} 
                        />
                        <div style={{ width: 280 }}>
                            <SearchFilter
                                searchPlaceholder="Tìm kiếm nhân viên, kỳ đánh giá..."
                                onSearch={(val) => setSearchText(val)}
                                showFilterButton={false}
                                showAddButton={false}
                            />
                        </div>
                    </div>
                </div>
                
                {activeTab === "pending" && selectedRowKeys.length > 0 && (
                    <div style={{ padding: "12px 20px", background: "#f8faff", borderBottom: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontSize: 13, color: "#475569" }}>
                            Đã chọn <strong style={{ color: "#1677ff" }}>{selectedRowKeys.length}</strong> bản đánh giá
                        </span>
                        <Access permission={ALL_PERMISSIONS.EVALUATION.BATCH_APPROVE_RECORDS} hideChildren>
                            <Button type="primary" loading={batchApproveMutation.isPending} onClick={() => setOpenBatchApproveModal(true)}>
                                Duyệt hàng loạt
                            </Button>
                        </Access>
                    </div>
                )}
                <Table
                    rowSelection={activeTab === "pending" ? {
                        selectedRowKeys,
                        onChange: (keys) => setSelectedRowKeys(keys),
                        getCheckboxProps: (record: any) => ({
                            disabled: record.status !== "PENDING_APPROVAL",
                        }),
                    } : undefined}
                    className="my-eval-table"
                    columns={columns}
                    dataSource={cardFilteredRecords}
                    rowKey="id"
                    loading={loading}
                    pagination={{ pageSize: 10, size: "small" }}
                    size="middle"
                    scroll={{ x: "max-content" }}
                    locale={{
                        emptyText: (
                            <Empty
                                image={Empty.PRESENTED_IMAGE_SIMPLE}
                                description={
                                    activeTab === "pending"
                                        ? "Không có hồ sơ nào đang chờ phê duyệt kết quả."
                                        : "Chưa có lịch sử phê duyệt kết quả."
                                }
                                style={{ margin: "40px 0" }}
                            />
                        )
                    }}
                />
                {activeDetailRecord && (
                    <ApprovalDetailPage
                        recordId={activeDetailRecord.id}
                        onClose={closeDetailDrawer}
                    />
                )}
            </div>

        <ConfirmModal
            open={openBatchApproveModal}
            variant="success"
            title={`Phê duyệt ${selectedRowKeys.length} bản đánh giá?`}
            description="Tất cả các bản được chọn sẽ được phê duyệt và kết quả được gửi tới nhân viên."
            okText="Phê duyệt ngay"
            onConfirm={async () => {
                setOpenBatchApproveModal(false);
                await handleBatchApprove();
            }}
            onCancel={() => setOpenBatchApproveModal(false)}
            loading={batchApproveMutation.isPending}
        />
        </>
    );

    return isTab ? content : (
        <Access permission={ALL_PERMISSIONS.EVALUATION.GET_PENDING_APPROVAL_RECORDS}>
            <PageContainer title="Phê duyệt đánh giá">{content}</PageContainer>
        </Access>
    );
};

export default PendingApprovalPage;
