import { useEffect, useState, useMemo } from "react";
import { Table, Tag, Tooltip, Empty, Card, Select, Button, Row, Col } from "antd";
import {
    TeamOutlined,
    StopOutlined,
    SyncOutlined,
    ClockCircleOutlined,
    CheckCircleOutlined,
    CloseCircleOutlined,
    EyeOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { notify } from "@/components/common/notification/notify";
import { 
    callFetchCompletedSummary, 
    callFetchEvaluationPeriods,
    callFetchCompany,
    callFetchDepartmentsByCompany
} from "@/config/api";
import PageContainer from "@/components/common/data-table/PageContainer";
import dayjs from "dayjs";
import { Pie, Column } from "@ant-design/charts";

const GRADE_CONFIG: Record<string, { color: string; bg: string; label: string }> = {
    A: { color: "#389e0d", bg: "#f6ffed", label: "Xuất sắc" },
    B: { color: "#1677ff", bg: "#e6f4ff", label: "Tốt" },
    C: { color: "#d46b08", bg: "#fff7e6", label: "Khá" },
    D: { color: "#cf1322", bg: "#fff1f0", label: "Trung bình" },
    E: { color: "#8c8c8c", bg: "#f5f5f5", label: "Yếu" },
};

const STATUS_CONFIG: Record<string, { text: string; color: string; icon: React.ReactNode; tagColor: string }> = {
    NOT_STARTED: { text: "Chưa bắt đầu", color: "#8c8c8c", icon: <StopOutlined />, tagColor: "default" },
    EMPLOYEE_DRAFTING: { text: "Đang tự chấm", color: "#1677ff", icon: <SyncOutlined spin />, tagColor: "processing" },
    PENDING_MANAGER_REVIEW: { text: "Chờ QL chấm", color: "#fa8c16", icon: <ClockCircleOutlined />, tagColor: "warning" },
    MANAGER_REVIEWING: { text: "QL đang chấm", color: "#722ed1", icon: <SyncOutlined spin />, tagColor: "purple" },
    PENDING_APPROVAL: { text: "Chờ phê duyệt", color: "#13c2c2", icon: <ClockCircleOutlined />, tagColor: "cyan" },
    REVISION_NEEDED: { text: "Yêu cầu sửa đổi", color: "#f5222d", icon: <CloseCircleOutlined />, tagColor: "error" },
    COMPLETED: { text: "Hoàn tất", color: "#52c41a", icon: <CheckCircleOutlined />, tagColor: "success" },
};

const CompletedEvaluationsPage = () => {
    const navigate = useNavigate();
    const [records, setRecords] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    
    const [periods, setPeriods] = useState<any[]>([]);
    const [companies, setCompanies] = useState<any[]>([]);
    const [departments, setDepartments] = useState<any[]>([]);
    
    const [selectedPeriod, setSelectedPeriod] = useState<number | undefined>();
    const [selectedCompany, setSelectedCompany] = useState<number | undefined>();
    const [selectedDepartment, setSelectedDepartment] = useState<number | undefined>();

    const fetchPeriods = async () => {
        try {
            const res = await callFetchEvaluationPeriods("page=1&size=100");
            if (res?.data?.result) {
                setPeriods(res.data.result);
                if (res.data.result.length > 0) {
                    setSelectedPeriod(res.data.result[0].id);
                }
            }
        } catch {
            notify.error("Lỗi tải danh sách kỳ đánh giá");
        }
    };

    const fetchCompanies = async () => {
        try {
            const res = await callFetchCompany("page=1&size=100");
            if (res?.data?.result) {
                setCompanies(res.data.result);
            }
        } catch {
            notify.error("Lỗi tải danh sách công ty");
        }
    };

    const fetchDepartments = async (companyId: number) => {
        try {
            const res = await callFetchDepartmentsByCompany(companyId);
            if (res?.data) {
                setDepartments(res.data);
            }
        } catch {
            notify.error("Lỗi tải danh sách phòng ban");
        }
    };

    const fetchSummary = async () => {
        setLoading(true);
        try {
            const res = await callFetchCompletedSummary(selectedPeriod, selectedDepartment, selectedCompany);
            if (res?.data) {
                setRecords(res.data);
            }
        } catch {
            notify.error("Lỗi tải báo cáo tổng hợp");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPeriods();
        fetchCompanies();
    }, []);

    useEffect(() => {
        if (selectedCompany) {
            fetchDepartments(selectedCompany);
            setSelectedDepartment(undefined);
        } else {
            setDepartments([]);
            setSelectedDepartment(undefined);
        }
    }, [selectedCompany]);

    useEffect(() => {
        if (selectedPeriod) {
            fetchSummary();
        }
    }, [selectedPeriod, selectedCompany, selectedDepartment]);

    const statusData = useMemo(() => {
        const counts: Record<string, number> = {};
        records.forEach(r => {
            counts[r.status] = (counts[r.status] || 0) + 1;
        });
        return Object.entries(counts).map(([status, count]) => ({
            type: STATUS_CONFIG[status]?.text || status,
            value: count
        }));
    }, [records]);

    const gradeData = useMemo(() => {
        const counts: Record<string, number> = { A: 0, B: 0, C: 0, D: 0, E: 0 };
        records.filter(r => r.status === 'COMPLETED').forEach(r => {
            if (r.finalGrade) {
                counts[r.finalGrade] = (counts[r.finalGrade] || 0) + 1;
            }
        });
        return Object.entries(counts).map(([grade, count]) => ({
            grade: grade,
            count: count,
            color: GRADE_CONFIG[grade]?.color || '#1677ff'
        }));
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
            title: "Nhân viên",
            dataIndex: "employeeName",
            key: "employeeName",
            render: (val: string, record: any) => (
                <div>
                    <div style={{ fontWeight: 700, color: "#1e293b", fontSize: 13 }}>{val}</div>
                    <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>{record.jobTitle} - {record.departmentName}</div>
                </div>
            ),
        },
        {
            title: "Kỳ đánh giá",
            dataIndex: "periodName",
            key: "periodName",
            render: (val: string) => <span style={{ fontWeight: 600, color: "#334155" }}>{val}</span>,
        },
        {
            title: "Tự chấm",
            dataIndex: "employeeTotalScore",
            key: "employeeTotalScore",
            align: "center" as const,
            render: (val: number | null) => (
                <span style={{ fontWeight: 700, color: val ? "#1677ff" : "#d9d9d9", fontSize: 14 }}>
                    {val != null ? val.toFixed(2) : "—"}
                </span>
            ),
        },
        {
            title: "Quản lý chấm",
            dataIndex: "managerTotalScore",
            key: "managerTotalScore",
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
            title: "Trạng thái",
            dataIndex: "status",
            key: "status",
            align: "center" as const,
            render: (val: string) => {
                const cfg = STATUS_CONFIG[val] ?? STATUS_CONFIG.NOT_STARTED;
                return (
                    <Tag color={cfg.tagColor} style={{ display: "inline-flex", alignItems: "center", gap: 4, fontWeight: 600 }}>
                        {cfg.icon}
                        {cfg.text}
                    </Tag>
                );
            },
        },
        {
            title: "Ngày phê duyệt",
            dataIndex: "completedAt",
            key: "completedAt",
            render: (val: string | null) => (
                <span style={{ fontSize: 12, color: val ? "#374151" : "#d9d9d9" }}>
                    {val ? dayjs(val).format("DD/MM/YYYY HH:mm") : "—"}
                </span>
            ),
        },
        {
            title: "Hành động",
            key: "actions",
            align: "center" as const,
            render: (_: any, record: any) => (
                <Button
                    type="link"
                    icon={<EyeOutlined />}
                    onClick={() => navigate(`/admin/evaluation/my-records/${record.recordId}`)}
                    style={{ fontWeight: 600, padding: 0 }}
                >
                    Chi tiết
                </Button>
            ),
        },
    ];

    return (
        <PageContainer title="Tổng hợp Kết quả đánh giá">
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
            `}</style>
            
            <Card style={{ marginBottom: 24, borderRadius: 12, borderColor: "#e2e8f0" }} bodyStyle={{ padding: 16 }}>
                <Row gutter={[24, 16]}>
                    <Col xs={24} md={8}>
                        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                            <span style={{ fontWeight: 600, color: "#334155" }}>Kỳ đánh giá:</span>
                            <Select
                                style={{ width: "100%" }}
                                value={selectedPeriod}
                                onChange={setSelectedPeriod}
                                options={periods.map(p => ({ label: p.name, value: p.id }))}
                                placeholder="Chọn kỳ đánh giá"
                                popupMatchSelectWidth={false}
                            />
                        </div>
                    </Col>
                    <Col xs={24} md={8}>
                        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                            <span style={{ fontWeight: 600, color: "#334155" }}>Công ty:</span>
                            <Select
                                style={{ width: "100%" }}
                                value={selectedCompany}
                                onChange={setSelectedCompany}
                                options={companies.map(c => ({ label: c.name, value: c.id }))}
                                placeholder="Tất cả công ty"
                                allowClear
                                popupMatchSelectWidth={false}
                            />
                        </div>
                    </Col>
                    <Col xs={24} md={8}>
                        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                            <span style={{ fontWeight: 600, color: "#334155" }}>Phòng ban:</span>
                            <Select
                                style={{ width: "100%" }}
                                value={selectedDepartment}
                                onChange={setSelectedDepartment}
                                options={departments.map(d => ({ label: d.name, value: d.id }))}
                                placeholder="Tất cả phòng ban"
                                disabled={!selectedCompany}
                                allowClear
                                popupMatchSelectWidth={false}
                            />
                        </div>
                    </Col>
                </Row>
            </Card>

            <Row gutter={[24, 24]} style={{ marginBottom: 24 }}>
                <Col xs={24} md={8}>
                    <Card title="Tổng quan trạng thái" style={{ height: '100%', borderRadius: 12, borderColor: "#e2e8f0" }}>
                        {statusData.length > 0 ? (
                            <Pie 
                                data={statusData}
                                angleField="value"
                                colorField="type"
                                radius={0.8}
                                innerRadius={0.6}
                                label={{
                                    text: 'value',
                                    style: {
                                        fontWeight: 'bold',
                                    },
                                }}
                                legend={{
                                    color: {
                                        title: false,
                                        position: 'bottom',
                                        rowPadding: 5,
                                    },
                                }}
                                height={250}
                            />
                        ) : (
                            <Empty description="Không có dữ liệu" />
                        )}
                    </Card>
                </Col>
                <Col xs={24} md={16}>
                    <Card title="Phân bổ Xếp loại (Đã hoàn tất)" style={{ height: '100%', borderRadius: 12, borderColor: "#e2e8f0" }}>
                        {gradeData.some(g => g.count > 0) ? (
                            <Column 
                                data={gradeData}
                                xField="grade"
                                yField="count"
                                colorField="grade"
                                scale={{ color: { range: ['#389e0d', '#1677ff', '#d46b08', '#cf1322', '#8c8c8c'] } }}
                                label={{
                                    text: 'count',
                                    position: 'top',
                                    style: { fill: '#1e293b', fontWeight: 600 }
                                }}
                                legend={false}
                                height={250}
                            />
                        ) : (
                            <Empty description="Chưa có dữ liệu xếp loại" />
                        )}
                    </Card>
                </Col>
            </Row>

            <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0", overflow: "hidden" }}>
                <Table
                    className="my-eval-table"
                    columns={columns}
                    dataSource={records}
                    rowKey="recordId"
                    loading={loading}
                    pagination={{ pageSize: 20 }}
                    size="middle"
                    locale={{ emptyText: <Empty description="Chưa có dữ liệu tổng hợp" /> }}
                />
            </div>
        </PageContainer>
    );
};

export default CompletedEvaluationsPage;
