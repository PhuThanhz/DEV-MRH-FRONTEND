import { useEffect, useState } from "react";
import { Table, Tag, Button, Tooltip, Badge, Empty, Card, Typography, Space } from "antd";
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
import { callFetchMyEvaluationRecords } from "@/config/api";
import PageContainer from "@/components/common/data-table/PageContainer";

const { Title, Text } = Typography;

type RecordStatus =
    | "NOT_STARTED"
    | "EMPLOYEE_DRAFTING"
    | "PENDING_MANAGER_REVIEW"
    | "MANAGER_REVIEWING"
    | "PENDING_APPROVAL"
    | "COMPLETED";

const STATUS_CONFIG: Record<RecordStatus, { text: string; color: string; icon: React.ReactNode; tagColor: string }> = {
    NOT_STARTED: { text: "Chưa bắt đầu", color: "#8c8c8c", icon: <StopOutlined />, tagColor: "default" },
    EMPLOYEE_DRAFTING: { text: "Đang tự chấm", color: "#1677ff", icon: <SyncOutlined spin />, tagColor: "processing" },
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

const MyEvaluationPage = () => {
    const navigate = useNavigate();
    const [records, setRecords] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    const fetchRecords = async () => {
        setLoading(true);
        try {
            const res = await callFetchMyEvaluationRecords();
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
        fetchRecords();
    }, []);

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
            render: (val: RecordStatus) => {
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
            title: "Điểm tự chấm",
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
                    onClick={() => navigate(`/admin/evaluation/my-records/${record.id}`)}
                    style={{
                        borderRadius: 6,
                        fontWeight: 600,
                        background: record.status === "EMPLOYEE_DRAFTING" ? "#1677ff" : "#ffffff",
                        color: record.status === "EMPLOYEE_DRAFTING" ? "#ffffff" : "#334155",
                        border: record.status === "EMPLOYEE_DRAFTING" ? "none" : "1px solid #cbd5e1",
                        boxShadow: record.status === "EMPLOYEE_DRAFTING" ? "0 2px 6px rgba(22,119,255,0.2)" : "0 1px 2px rgba(0,0,0,0.05)",
                        fontSize: 12,
                        height: 28,
                    }}
                >
                    {record.status === "EMPLOYEE_DRAFTING" ? "Chấm điểm" : "Xem chi tiết"}
                </Button>
            ),
        },
    ];

    const pending = records.filter(r => r.status === "EMPLOYEE_DRAFTING").length;
    const completed = records.filter(r => r.status === "COMPLETED").length;
    const inProgress = records.filter(r =>
        ["PENDING_MANAGER_REVIEW", "MANAGER_REVIEWING", "PENDING_APPROVAL"].includes(r.status)
    ).length;

    return (
        <PageContainer title="Đánh giá của tôi">
            <style>{`
                .my-eval-table .ant-table-thead > tr > th {
                    background: rgba(241, 245, 249, 0.7) !important;
                    color: #475569 !important;
                    font-size: 11px !important;
                    font-weight: 700 !important;
                    text-transform: uppercase !important;
                    letter-spacing: 0.5px !important;
                    border-bottom: 1px solid #e2e8f0 !important;
                }
                .my-eval-table .ant-table-tbody > tr > td {
                    border-bottom: 1px solid #f1f5f9 !important;
                    padding: 12px 16px !important;
                }
                .my-eval-table .ant-table-tbody > tr:hover > td {
                    background: #f8faff !important;
                }
            `}</style>

            {/* Summary Cards */}
            <div style={{ display: "flex", gap: 16, marginBottom: 24, flexWrap: "wrap" }}>
                {[
                    {
                        label: "Cần tự chấm",
                        value: pending,
                        color: "#1677ff",
                        bg: "#ffffff",
                        border: "#e2e8f0",
                        icon: (
                            <div style={{ background: "#e6f4ff", padding: "10px", borderRadius: "10px", display: "flex" }}>
                                <SyncOutlined style={{ fontSize: 20, color: "#1677ff" }} />
                            </div>
                        ),
                    },
                    {
                        label: "Đang xử lý",
                        value: inProgress,
                        color: "#722ed1",
                        bg: "#ffffff",
                        border: "#e2e8f0",
                        icon: (
                            <div style={{ background: "#f9f0ff", padding: "10px", borderRadius: "10px", display: "flex" }}>
                                <ClockCircleOutlined style={{ fontSize: 20, color: "#722ed1" }} />
                            </div>
                        ),
                    },
                    {
                        label: "Hoàn tất",
                        value: completed,
                        color: "#389e0d",
                        bg: "#ffffff",
                        border: "#e2e8f0",
                        icon: (
                            <div style={{ background: "#f6ffed", padding: "10px", borderRadius: "10px", display: "flex" }}>
                                <TrophyOutlined style={{ fontSize: 20, color: "#389e0d" }} />
                            </div>
                        ),
                    },
                ].map(item => (
                    <Card
                        key={item.label}
                        style={{
                            flex: 1, minWidth: 180,
                            background: item.bg,
                            border: `1px solid ${item.border}`,
                            borderRadius: 12,
                            boxShadow: "0 2px 8px rgba(0,0,0,0.03)"
                        }}
                        styles={{ body: { padding: "16px 20px" } }}
                    >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <div>
                                <div style={{ fontSize: 12, fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                                    {item.label}
                                </div>
                                <div style={{ fontSize: 28, fontWeight: 800, color: "#0f172a", lineHeight: "1.2", marginTop: 6 }}>
                                    {item.value}
                                </div>
                            </div>
                            {item.icon}
                        </div>
                    </Card>
                ))}
            </div>

            {/* Table */}
            <div style={{
                background: "#fff",
                borderRadius: 12,
                border: "1px solid #e2e8f0",
                overflow: "hidden",
                boxShadow: "0 2px 8px rgba(0,0,0,0.04)"
            }}>
                <div style={{ padding: "16px 20px", borderBottom: "1px solid #f1f5f9", display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{
                        display: "inline-flex", background: "#eff6ff", color: "#1d4ed8",
                        padding: "6px", borderRadius: 8
                    }}>
                        <FileTextOutlined style={{ fontSize: 16 }} />
                    </div>
                    <div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a" }}>Lịch sử bản đánh giá</div>
                        <div style={{ fontSize: 12, color: "#64748b" }}>Tất cả các kỳ đánh giá HQCV bạn tham gia</div>
                    </div>
                </div>
                <Table
                    className="my-eval-table"
                    columns={columns}
                    dataSource={records}
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
        </PageContainer>
    );
};

export default MyEvaluationPage;
