import { useEffect, useState } from "react";
import { Table, Tag, Button, Tooltip, Empty, Tabs, Input } from "antd";
import { useNavigate } from "react-router-dom";
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
import { SearchOutlined } from "@ant-design/icons";
import { callFetchPendingManagerRecords, callFetchManagerRecords } from "@/config/api";
import PageContainer from "@/components/common/data-table/PageContainer";
import SearchFilter from "@/components/common/filter/SearchFilter";
import AdvancedFilterSelect from "@/components/common/filter/AdvancedFilterSelect";

type RecordStatus =
    | "NOT_STARTED"
    | "EMPLOYEE_DRAFTING"
    | "PENDING_MANAGER_REVIEW"
    | "MANAGER_REVIEWING"
    | "PENDING_APPROVAL"
    | "COMPLETED";

const STATUS_CONFIG: Record<RecordStatus, { text: string; color: string; icon: React.ReactNode; tagColor: string }> = {
    NOT_STARTED: { text: "Chưa bắt đầu", color: "#8c8c8c", icon: <StopOutlined />, tagColor: "default" },
    EMPLOYEE_DRAFTING: { text: "NV đang đánh giá", color: "#1677ff", icon: <SyncOutlined spin />, tagColor: "processing" },
    PENDING_MANAGER_REVIEW: { text: "Chờ quản lý chấm", color: "#fa8c16", icon: <ClockCircleOutlined />, tagColor: "warning" },
    MANAGER_REVIEWING: { text: "Quản lý đang chấm", color: "#722ed1", icon: <SyncOutlined spin />, tagColor: "purple" },
    PENDING_APPROVAL: { text: "Chờ phê duyệt", color: "#13c2c2", icon: <ClockCircleOutlined />, tagColor: "cyan" },
    COMPLETED: { text: "Hoàn tất", color: "#52c41a", icon: <CheckCircleOutlined />, tagColor: "success" },
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

const PendingManagerEvaluationPage = ({ isTab }: IProps) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const _isTab = isTab;
    const navigate = useNavigate();
    const [records, setRecords] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState("pending");
    const [searchText, setSearchText] = useState("");
    const [advancedFilters, setAdvancedFilters] = useState<Record<string, any>>({});

    const fetchRecords = async (tab: string) => {
        setLoading(true);
        try {
            const res = tab === "pending"
                ? await callFetchPendingManagerRecords()
                : await callFetchManagerRecords();
            if (res?.data) {
                setRecords(res.data);
            }
        } catch {
            notify.error("Lỗi tải danh sách bản đánh giá");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRecords(activeTab);
    }, [activeTab]);

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

                if (isEmpOverdue) {
                    return (
                        <Tag
                            color="error"
                            icon={<ClockCircleOutlined />}
                            style={{ borderRadius: 20, fontWeight: 600, fontSize: 11, padding: "2px 10px" }}
                        >
                            Trễ hạn tự đánh giá
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
                            Trễ hạn chấm điểm
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
            title: "Điểm NV đánh giá",
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
            title: "Điểm quản lý",
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
                const deadline = record.effectiveManagerDeadline ?? record.managerDeadlineOverride ?? record.period?.managerDeadline;
                if (!deadline) return <span style={{ color: "#d9d9d9" }}>—</span>;
                
                const isPendingAction = record.status === "PENDING_MANAGER_REVIEW" || record.status === "MANAGER_REVIEWING";
                const isOverdue = isPendingAction && dayjs().isAfter(dayjs(deadline));
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
            render: (val: string | null) => (
                <span style={{ fontSize: 12, color: val ? "#374151" : "#d9d9d9" }}>
                    {val ? dayjs(val).format("DD/MM/YYYY") : "—"}
                </span>
            ),
        },
        {
            title: "Hành động",
            key: "action",
            align: "center" as const,
            width: 100,
            render: (_: any, record: any) => (
                <Button
                    type="primary"
                    size="small"
                    icon={<EyeOutlined />}
                    onClick={() => navigate(`/admin/evaluation/manager/records/${record.id}`)}
                    style={{
                        borderRadius: 6,
                        fontWeight: 600,
                        background: record.status === "PENDING_MANAGER_REVIEW" ? "#1677ff" : "#ffffff",
                        color: record.status === "PENDING_MANAGER_REVIEW" ? "#ffffff" : "#334155",
                        border: record.status === "PENDING_MANAGER_REVIEW" ? "none" : "1px solid #cbd5e1",
                        fontSize: 12,
                        height: 28,
                    }}
                >
                    {record.status === "PENDING_MANAGER_REVIEW" ? "Chấm điểm" : "Xem chi tiết"}
                </Button>
            ),
        },
    ];

    const baseRecords = records.filter(r => 
        (r.period?.name || r.periodName || "").toLowerCase().includes(searchText.toLowerCase()) ||
        (r.template?.name || "").toLowerCase().includes(searchText.toLowerCase()) ||
        (r.employee?.fullName || "").toLowerCase().includes(searchText.toLowerCase())
    );

    const filteredRecords = baseRecords.filter(r => {
        if (activeTab === "history") {
            if (r.status !== "PENDING_APPROVAL" && r.status !== "COMPLETED") return false;
        }

        if (advancedFilters.status) {
            if (advancedFilters.status === "EMPLOYEE_DRAFTING" && r.status !== "PENDING_MANAGER_REVIEW") return false;
            if (advancedFilters.status === "PROCESSING" && r.status !== "MANAGER_REVIEWING") return false;
            if (advancedFilters.status === "COMPLETED" && !["PENDING_APPROVAL", "COMPLETED"].includes(r.status)) return false;
        }

        if (advancedFilters.periodId) {
            const rPeriodId = r.period?.id || r.periodId;
            if (rPeriodId !== advancedFilters.periodId) return false;
        }

        return true;
    });

    const pending = baseRecords.filter(r => r.status === "PENDING_MANAGER_REVIEW").length;
    const inProgress = baseRecords.filter(r => r.status === "MANAGER_REVIEWING").length;
    const completed = baseRecords.filter(r => ["PENDING_APPROVAL", "COMPLETED"].includes(r.status)).length;

    const content = (
        <div style={{ padding: isTab ? "8px 0" : 0 }}>
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
            `}</style>

            {/* Summary Cards */}
            <div style={{ display: "flex", gap: 16, marginBottom: 24, flexWrap: "wrap" }}>
                {[
                    {
                        label: "Chờ duyệt",
                        value: pending,
                        color: "#1677ff",
                        icon: (
                            <div style={{ background: "#e6f4ff", padding: "10px", borderRadius: "8px", display: "flex" }}>
                                <SyncOutlined style={{ fontSize: 20, color: "#1677ff" }} />
                            </div>
                        ),
                    },
                    {
                        label: "Đang xử lý",
                        value: inProgress,
                        color: "#722ed1",
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
                        icon: (
                            <div style={{ background: "#f6ffed", padding: "10px", borderRadius: "8px", display: "flex" }}>
                                <TrophyOutlined style={{ fontSize: 20, color: "#389e0d" }} />
                            </div>
                        ),
                    },
                ].map(item => (
                    <div
                        key={item.label}
                        style={{
                            flex: 1, minWidth: 180,
                            background: "#ffffff",
                            border: "1px solid #e2e8f0",
                            borderRadius: 8,
                            padding: "16px 20px",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
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
                    items={[
                        { key: "pending", label: "Chờ chấm điểm" },
                        { key: "history", label: "Đã xử lý (Lịch sử)" }
                    ]}
                    style={{ padding: "0 20px" }}
                />
                <div style={{ padding: "16px 20px", borderBottom: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{
                            display: "inline-flex", background: "#eff6ff", color: "#1677ff",
                            padding: "6px", borderRadius: 6
                        }}>
                            <FileTextOutlined style={{ fontSize: 16 }} />
                        </div>
                        <div>
                            <div style={{ fontSize: 15, fontWeight: 600, color: "#0f172a" }}>
                                {activeTab === "pending" ? "Danh sách cần chấm điểm" : "Lịch sử đánh giá nhân viên"}
                            </div>
                            <div style={{ fontSize: 13, color: "#64748b", marginTop: 2 }}>
                                {activeTab === "pending" ? "Các bản đánh giá đang đợi bạn xử lý" : "Tất cả các bản đánh giá bạn đã tham gia xử lý"}
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
                <Table
                    className="my-eval-table"
                    columns={columns}
                    dataSource={filteredRecords}
                    rowKey="id"
                    loading={loading}
                    pagination={{ pageSize: 10, size: "small" }}
                    size="middle"
                    scroll={{ x: "max-content" }}
                    locale={{
                        emptyText: (
                            <Empty
                                image={Empty.PRESENTED_IMAGE_SIMPLE}
                                description="Chưa có bản đánh giá nào"
                                style={{ margin: "40px 0" }}
                            />
                        )
                    }}
                />
            </div>
        </div>
    );

    return isTab ? content : <PageContainer title="Danh sách đánh giá (Quản lý trực tiếp)">{content}</PageContainer>;
};

export default PendingManagerEvaluationPage;
