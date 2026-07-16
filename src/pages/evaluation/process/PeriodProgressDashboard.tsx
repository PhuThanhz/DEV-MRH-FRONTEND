import React, { useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
    Card,
    Col,
    Row,
    Table,
    Typography,
    Button,
    Progress,
    Tag,
    Alert,
    Empty,
    Spin,
    Space
} from "antd";
import {
    ArrowLeftOutlined,
    WarningOutlined,
    CheckCircleOutlined,
    ClockCircleOutlined,
    UserOutlined,
    FileTextOutlined,
    TeamOutlined,
    BellOutlined,
    CalendarOutlined,
    SwapOutlined,
    ExportOutlined,
    BarChartOutlined,
    AuditOutlined,
    SafetyCertificateOutlined
} from "@ant-design/icons";
import PageContainer from "@/components/common/data-table/PageContainer";
import { usePeriodProgressQuery } from "@/hooks/useEvaluations";
import { callFetchEvaluationGradeDistribution, callFetchEvaluationPeriodById } from "@/config/api";
import dayjs from "dayjs";

const { Title, Text } = Typography;

const PeriodProgressDashboard: React.FC = () => {
    const { periodId } = useParams<{ periodId: string }>();
    const navigate = useNavigate();

    // Fetch Period info
    const { data: period, isLoading: isPeriodLoading } = useQuery({
        queryKey: ["evaluation-period", periodId],
        queryFn: async () => {
            if (!periodId) return null;
            const res = await callFetchEvaluationPeriodById(Number(periodId));
            return res?.data || null;
        },
        enabled: !!periodId
    });

    // Fetch progress data
    const { data: progressData, isLoading: isProgressLoading, error } = usePeriodProgressQuery(Number(periodId));

    const { data: gradeDistribution = [], isLoading: isGradeLoading } = useQuery({
        queryKey: ["evaluation-grade-distribution", periodId],
        queryFn: async () => {
            if (!periodId) return [];
            const res = await callFetchEvaluationGradeDistribution(Number(periodId));
            return res?.data || [];
        },
        enabled: !!periodId,
    });

    const isLoading = isPeriodLoading || isProgressLoading;

    const getRecordDetailPath = (recordId: number, status: string) => {
        if (status === "EMPLOYEE_DRAFTING" || status === "REVISION_NEEDED") {
            return `/admin/evaluation/my-records/${recordId}?readonly=true&from=progress`;
        }
        if (status === "PENDING_MANAGER_REVIEW" || status === "MANAGER_REVIEWING") {
            return `/admin/evaluation/manager/records/${recordId}`;
        }
        if (status === "PENDING_APPROVAL") {
            return `/admin/evaluation/approval/records/${recordId}`;
        }
        return `/admin/evaluation/my-records/${recordId}?readonly=true&from=progress`;
    };

    const kpi = progressData?.kpiProgress;
    const activeRecordCount = Math.max(0, (kpi?.totalRecords ?? 0) - (kpi?.cancelledCount ?? 0));
    const inProgressCount = (kpi?.draftingCount ?? 0) + (kpi?.pendingManagerCount ?? 0) + (kpi?.pendingApprovalCount ?? 0);
    const selfReviewCompleted = Math.max(0, activeRecordCount - (kpi?.draftingCount ?? 0));
    const managerReviewCompleted = (kpi?.completedCount ?? 0) + (kpi?.pendingApprovalCount ?? 0);
    const managerReviewEligible = Math.max(0, activeRecordCount - (kpi?.draftingCount ?? 0));
    const approvalEligible = (kpi?.completedCount ?? 0) + (kpi?.pendingApprovalCount ?? 0);
    const overallCompletion = activeRecordCount > 0 ? Math.round(((kpi?.completedCount ?? 0) / activeRecordCount) * 100) : 0;
    const statusRows = kpi ? [
        { label: "Nhân viên đang tự đánh giá", value: kpi.draftingCount, color: "#2563eb" },
        { label: "Chờ quản lý chấm", value: kpi.pendingManagerCount, color: "#7c3aed" },
        { label: "Chờ duyệt cấp trên", value: kpi.pendingApprovalCount, color: "#0891b2" },
        { label: "Đã hoàn thành", value: kpi.completedCount, color: "#16a34a" },
        { label: "Đã hủy", value: kpi.cancelledCount, color: "#94a3b8" },
    ].filter(item => item.value > 0) : [];
    const phaseRows = kpi ? [
        { label: "Nhân viên tự đánh giá", caption: "Hoàn thành phần tự đánh giá", done: selfReviewCompleted, total: activeRecordCount, color: "#2563eb" },
        { label: "Quản lý chấm điểm", caption: "Hoàn thành phần chấm điểm", done: managerReviewCompleted, total: managerReviewEligible, color: "#7c3aed" },
        { label: "Duyệt cấp trên", caption: "Hoàn thành bước duyệt cấp trên", done: kpi.completedCount, total: approvalEligible, color: "#16a34a" },
    ] : [];

    const departmentWatchList = useMemo(() => {
        const departments = progressData?.departmentProgress || [];
        return departments
            .map(dept => {
                const active = Math.max(0, dept.totalRecords - dept.cancelledCount);
                const completion = active ? Math.round((dept.completedCount / active) * 100) : 0;
                const stuck = dept.draftingCount + dept.pendingManagerCount + dept.pendingApprovalCount;
                return { ...dept, active, completion, stuck };
            })
            .filter(dept => dept.overdueCount > 0 || (dept.active > 0 && dept.completion < 80))
            .sort((a, b) => b.overdueCount - a.overdueCount || a.completion - b.completion)
            .slice(0, 5);
    }, [progressData?.departmentProgress]);

    const normalizedGradeDistribution = useMemo(() => {
        const gradeOrder = ["A", "B", "C", "D", "E"];
        const counts = new Map<string, number>();
        gradeDistribution.forEach(row => {
            const grade = row?.[0] || "Chưa xếp loại";
            counts.set(grade, Number(row?.[1] || 0));
        });
        return gradeOrder
            .filter(grade => counts.has(grade))
            .map(grade => ({ grade, count: counts.get(grade) || 0 }));
    }, [gradeDistribution]);

    const totalGraded = normalizedGradeDistribution.reduce((sum, item) => sum + item.count, 0);
    const excellentCount = normalizedGradeDistribution
        .filter(item => item.grade === "A" || item.grade === "B")
        .reduce((sum, item) => sum + item.count, 0);
    const lowGradeCount = normalizedGradeDistribution
        .filter(item => item.grade === "D" || item.grade === "E")
        .reduce((sum, item) => sum + item.count, 0);
    const excellentRate = totalGraded ? Math.round((excellentCount / totalGraded) * 100) : 0;
    const lowGradeRate = totalGraded ? Math.round((lowGradeCount / totalGraded) * 100) : 0;
    const calibrationAlerts = [
        totalGraded === 0 ? "Chưa có dữ liệu xếp loại để hiệu chỉnh." : null,
        totalGraded > 0 && excellentRate >= 70 ? "Tỷ lệ A/B cao, nên rà soát calibration giữa phòng ban." : null,
        totalGraded > 0 && lowGradeRate >= 30 ? "Tỷ lệ D/E cao, cần kiểm tra nguyên nhân hiệu suất hoặc tiêu chí chấm." : null,
        departmentWatchList.length > 0 ? "Có phòng ban cần HR/Admin theo dõi sát tiến độ." : null,
    ].filter(Boolean);

    if (error) {
        return (
            <PageContainer title="Không thể tải tiến độ kỳ đánh giá">
                <Alert
                    message="Lỗi hệ thống"
                    description={error instanceof Error ? error.message : "Đã có lỗi xảy ra khi tải dữ liệu tiến độ."}
                    type="error"
                    showIcon
                    action={
                        <Button type="primary" onClick={() => window.location.reload()}>
                            Tải lại trang
                        </Button>
                    }
                />
            </PageContainer>
        );
    }

    // Columns for department progress table
    const deptColumns = [
        {
            title: "Tên phòng ban",
            dataIndex: "departmentName",
            key: "departmentName",
            render: (text: string) => <Text style={{ fontWeight: 600 }}>{text}</Text>
        },
        {
            title: "Tổng số",
            dataIndex: "totalRecords",
            key: "totalRecords",
            align: "center" as const,
            render: (val: number) => <Tag color="blue" style={{ fontSize: 13, minWidth: 40, textAlign: 'center' }}>{val}</Tag>
        },
        {
            title: "NV Đang Đánh Giá",
            dataIndex: "draftingCount",
            key: "draftingCount",
            align: "center" as const
        },
        {
            title: "QL Chấm Điểm",
            dataIndex: "pendingManagerCount",
            key: "pendingManagerCount",
            align: "center" as const
        },
        {
            title: "Duyệt cấp trên",
            dataIndex: "pendingApprovalCount",
            key: "pendingApprovalCount",
            align: "center" as const
        },
        {
            title: "Hoàn Thành",
            dataIndex: "completedCount",
            key: "completedCount",
            align: "center" as const,
            render: (val: number) => <span style={{ color: "#52c41a", fontWeight: "bold" }}>{val}</span>
        },
        {
            title: "Đã Hủy",
            dataIndex: "cancelledCount",
            key: "cancelledCount",
            align: "center" as const,
            render: (val: number) => val > 0 ? <span style={{ color: "#8c8c8c" }}>{val}</span> : "0"
        },
        {
            title: "Trễ Hạn",
            dataIndex: "overdueCount",
            key: "overdueCount",
            align: "center" as const,
            render: (val: number) => val > 0 ? <Tag color="red" style={{ fontWeight: "bold" }}>{val}</Tag> : "0"
        }
    ];

    // Columns for overdue records table
    const overdueColumns = [
        {
            title: "Nhân viên",
            key: "employee",
            render: (_: any, record: any) => (
                <div style={{ display: "flex", flexDirection: "column" }}>
                    <Text style={{ fontWeight: 600 }}>{record.employeeName}</Text>
                    <Text type="secondary" style={{ fontSize: 12 }}>{record.employeeEmail}</Text>
                </div>
            )
        },
        {
            title: "Bước đang kẹt",
            dataIndex: "statusLabel",
            key: "statusLabel",
            render: (text: string, record: any) => {
                let color = "orange";
                if (record.status === "EMPLOYEE_DRAFTING") color = "blue";
                if (record.status === "PENDING_APPROVAL") color = "purple";
                return <Tag color={color}>{text}</Tag>;
            }
        },
        {
            title: "Hạn chót",
            dataIndex: "deadline",
            key: "deadline",
            render: (val: string) => dayjs(val).format("DD/MM/YYYY HH:mm")
        },
        {
            title: "Số ngày trễ",
            dataIndex: "overdueDays",
            key: "overdueDays",
            align: "center" as const,
            render: (val: number) => (
                <span style={{ color: "#cf1322", fontWeight: "bold" }}>
                    {val} ngày
                </span>
            )
        },
        {
            title: "Thao tác",
            key: "action",
            align: "center" as const,
            render: (_: any, record: any) => (
                <Button
                    type="primary"
                    size="small"
                    onClick={() => navigate(getRecordDetailPath(record.recordId, record.status))}
                >
                    Xử lý nhanh
                </Button>
            )
        }
    ];

    return (
        <PageContainer
            title={
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <Button
                        type="text"
                        icon={<ArrowLeftOutlined />}
                        onClick={() => navigate("/admin/evaluation/periods")}
                        aria-label="Quay lại danh sách kỳ đánh giá"
                    />
                    <span>Tiến độ kỳ đánh giá</span>
                </div>
            }
        >
            <Spin spinning={isLoading}>
            <div className="period-progress-page">
                <style>{`
                    .period-progress-page { max-width: 1440px; margin: 0 auto; padding: 4px 16px 32px; }
                    .progress-hero { display: flex; justify-content: space-between; gap: 24px; align-items: flex-end; padding: 24px 28px; margin-bottom: 18px; border: 1px solid #e9edf5; border-radius: 16px; background: linear-gradient(112deg, #fff7fb 0%, #ffffff 48%, #f7f9ff 100%); }
                    .progress-eyebrow { color: #a21caf; font-size: 11px; font-weight: 800; letter-spacing: .1em; text-transform: uppercase; }
                    .progress-hero h1 { margin: 5px 0 8px; color: #172033; font-size: clamp(22px, 2vw, 30px); line-height: 1.2; letter-spacing: -.02em; }
                    .progress-meta { display: flex; flex-wrap: wrap; gap: 8px 16px; color: #64748b; font-size: 13px; }
                    .progress-overall { min-width: 180px; text-align: right; }
                    .progress-overall__value { color: #172033; font-size: 32px; font-weight: 760; letter-spacing: -.04em; line-height: 1; }
                    .metric-card, .progress-panel, .admin-control-card { border: 1px solid #e8edf5 !important; border-radius: 14px !important; box-shadow: 0 6px 20px rgba(15, 23, 42, .035) !important; }
                    .metric-card .ant-card-body { padding: 18px 20px !important; }
                    .metric-card__top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; color: #64748b; font-size: 13px; font-weight: 650; }
                    .metric-card__value { color: #172033; font-size: 30px; line-height: 1; font-weight: 760; letter-spacing: -.03em; }
                    .metric-card__note { margin-top: 8px; color: #94a3b8; font-size: 12px; }
                    .progress-panel .ant-card-head { min-height: 56px; padding: 0 20px; border-bottom-color: #edf1f6; }
                    .progress-panel .ant-card-head-title { padding: 16px 0; color: #273449; font-weight: 720; }
                    .status-row { display: grid; grid-template-columns: minmax(0, 1fr) 46px; gap: 12px; align-items: center; padding: 11px 0; border-bottom: 1px solid #f0f3f7; }
                    .status-row:last-child { border-bottom: 0; }
                    .status-row__label { display: flex; align-items: center; gap: 9px; color: #475569; font-size: 13px; }
                    .status-dot { width: 8px; height: 8px; border-radius: 50%; flex: 0 0 auto; }
                    .phase-row { display: grid; grid-template-columns: 28px minmax(0, 1fr); gap: 12px; padding: 4px 0 18px; }
                    .phase-index { width: 28px; height: 28px; display: grid; place-items: center; border-radius: 50%; background: #f1f5f9; color: #475569; font-size: 12px; font-weight: 750; }
                    .phase-row__head { display: flex; justify-content: space-between; gap: 12px; align-items: baseline; }
                    .phase-row__title { color: #273449; font-size: 14px; font-weight: 720; }
                    .phase-row__caption { margin-top: 2px; color: #94a3b8; font-size: 12px; }
                    .overdue-strip { display: flex; justify-content: space-between; gap: 16px; align-items: center; padding: 12px 16px; margin-bottom: 18px; border: 1px solid #fecaca; border-radius: 12px; background: #fff8f7; color: #991b1b; }
                    .admin-control-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; margin-bottom: 18px; }
                    .admin-control-card .ant-card-body { padding: 16px !important; }
                    .admin-control-card__head { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 10px; }
                    .admin-control-card__icon { width: 34px; height: 34px; display: grid; place-items: center; border-radius: 11px; }
                    .admin-control-card__title { color: #172033; font-size: 14px; font-weight: 760; }
                    .admin-control-card__desc { color: #64748b; font-size: 12px; line-height: 1.5; min-height: 36px; }
                    .admin-control-card__footer { margin-top: 12px; display: flex; justify-content: space-between; align-items: center; gap: 8px; }
                    .grade-row { display: grid; grid-template-columns: 38px minmax(0, 1fr) 42px; gap: 10px; align-items: center; padding: 8px 0; }
                    .grade-badge { width: 30px; height: 30px; border-radius: 50%; display: grid; place-items: center; font-weight: 800; font-size: 13px; }
                    .watch-row { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 10px; padding: 10px 0; border-bottom: 1px solid #f1f5f9; }
                    .watch-row:last-child { border-bottom: 0; }
                    .audit-list { display: grid; gap: 10px; }
                    .audit-item { display: flex; justify-content: space-between; gap: 12px; align-items: center; padding: 10px 12px; border-radius: 10px; background: #f8fafc; border: 1px solid #edf2f7; }
                    .audit-item__label { color: #334155; font-size: 13px; font-weight: 650; }
                    .audit-item__note { color: #94a3b8; font-size: 12px; margin-top: 2px; }
                    @media (max-width: 1100px) { .admin-control-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
                    @media (max-width: 767px) { .progress-hero { padding: 20px; align-items: flex-start; flex-direction: column; } .progress-overall { text-align: left; } }
                    @media (max-width: 640px) { .admin-control-grid { grid-template-columns: 1fr; } }
                `}</style>

                {period && (
                    <section className="progress-hero">
                        <div>
                            <div className="progress-eyebrow">Báo cáo vận hành kỳ đánh giá</div>
                            <h1>{period.name}</h1>
                            <div className="progress-meta">
                                <span><TeamOutlined /> {activeRecordCount} nhân sự đang tham gia</span>
                                {period.approvalDeadline && <span>Hạn duyệt cấp trên: {dayjs(period.approvalDeadline).format("DD/MM/YYYY HH:mm")}</span>}
                            </div>
                        </div>
                        <div className="progress-overall">
                            <Tag color={period.status === "ACTIVE" ? "processing" : period.status === "CLOSED" ? "default" : "default"} style={{ margin: 0, borderRadius: 999, fontWeight: 650 }}>
                                {period.status === "ACTIVE" ? "Đang mở" : period.status === "CLOSED" ? "Đã đóng" : "Bản nháp"}
                            </Tag>
                            <div className="progress-overall__value" style={{ marginTop: 10 }}>{overallCompletion}%</div>
                            <div style={{ color: "#64748b", fontSize: 12, marginTop: 5 }}>hoàn thành toàn kỳ</div>
                        </div>
                    </section>
                )}

                {kpi && (
                    <>
                        {kpi.overdueCount > 0 && (
                            <div className="overdue-strip" role="alert">
                                <span><WarningOutlined style={{ marginRight: 8 }} />Có <strong>{kpi.overdueCount}</strong> hồ sơ đã trễ hạn và cần được xử lý.</span>
                                <span style={{ fontSize: 12, color: "#b91c1c" }}>Xem danh sách ở bên dưới</span>
                            </div>
                        )}

                        <Row gutter={[14, 14]} style={{ marginBottom: 18 }}>
                            {[
                                { label: "Tổng nhân sự", value: activeRecordCount, note: kpi.cancelledCount ? `${kpi.cancelledCount} hồ sơ đã hủy` : "Hồ sơ đang được theo dõi", icon: <UserOutlined />, color: "#475569" },
                                { label: "Đang xử lý", value: inProgressCount, note: `${activeRecordCount ? Math.round((inProgressCount / activeRecordCount) * 100) : 0}% trong kỳ`, icon: <ClockCircleOutlined />, color: "#2563eb" },
                                { label: "Đã hoàn thành", value: kpi.completedCount, note: `${overallCompletion}% hoàn tất`, icon: <CheckCircleOutlined />, color: "#16a34a" },
                                { label: "Quá hạn", value: kpi.overdueCount, note: kpi.overdueCount ? "Cần can thiệp" : "Không có hồ sơ quá hạn", icon: <WarningOutlined />, color: kpi.overdueCount ? "#dc2626" : "#64748b" },
                            ].map(metric => (
                                <Col xs={12} lg={6} key={metric.label}>
                                    <Card className="metric-card" bordered={false}>
                                        <div className="metric-card__top"><span>{metric.label}</span><span style={{ color: metric.color }}>{metric.icon}</span></div>
                                        <div className="metric-card__value" style={{ color: metric.label === "Quá hạn" && metric.value ? metric.color : undefined }}>{metric.value}</div>
                                        <div className="metric-card__note">{metric.note}</div>
                                    </Card>
                                </Col>
                            ))}
                        </Row>

                        <div className="admin-control-grid">
                            {[
                                {
                                    title: "Theo dõi toàn kỳ",
                                    desc: "HR/Admin giám sát toàn bộ hồ sơ, trạng thái và tỷ lệ hoàn thành theo phòng ban.",
                                    icon: <SafetyCertificateOutlined />,
                                    color: "#2563eb",
                                    value: `${overallCompletion}%`,
                                    action: "Đang giám sát",
                                },
                                {
                                    title: "Nhắc hạn & gia hạn",
                                    desc: "Ưu tiên xử lý hồ sơ quá hạn, có thể gia hạn riêng theo bước khi cần.",
                                    icon: <BellOutlined />,
                                    color: "#dc2626",
                                    value: kpi.overdueCount,
                                    action: kpi.overdueCount ? "Cần can thiệp" : "Ổn định",
                                },
                                {
                                    title: "Can thiệp phân công",
                                    desc: "Hỗ trợ điều chuyển quản lý chấm/duyệt khi cấu trúc nhân sự bị sai.",
                                    icon: <SwapOutlined />,
                                    color: "#7c3aed",
                                    value: departmentWatchList.length,
                                    action: "Theo dõi phòng ban",
                                },
                                {
                                    title: "Báo cáo kết quả",
                                    desc: "Truy cập báo cáo tổng hợp để xuất Excel/PDF và đối chiếu kết quả cuối kỳ.",
                                    icon: <ExportOutlined />,
                                    color: "#16a34a",
                                    value: kpi.completedCount,
                                    action: "Mở báo cáo",
                                    onClick: () => navigate("/admin/evaluation/summary"),
                                },
                            ].map(item => (
                                <Card className="admin-control-card" bordered={false} key={item.title}>
                                    <div className="admin-control-card__head">
                                        <div className="admin-control-card__icon" style={{ background: `${item.color}14`, color: item.color }}>
                                            {item.icon}
                                        </div>
                                        <Tag color={item.color === "#dc2626" && Number(item.value) > 0 ? "error" : "default"} style={{ margin: 0, borderRadius: 999, fontWeight: 700 }}>
                                            {item.value}
                                        </Tag>
                                    </div>
                                    <div className="admin-control-card__title">{item.title}</div>
                                    <div className="admin-control-card__desc">{item.desc}</div>
                                    <div className="admin-control-card__footer">
                                        <span style={{ color: item.color, fontSize: 12, fontWeight: 750 }}>{item.action}</span>
                                        {item.onClick && <Button type="link" size="small" onClick={item.onClick} style={{ padding: 0 }}>Xem</Button>}
                                    </div>
                                </Card>
                            ))}
                        </div>

                        <Row gutter={[14, 14]} style={{ marginBottom: 18 }}>
                            <Col xs={24} lg={9}>
                                <Card className="progress-panel" title="Phân bổ hồ sơ" bordered={false}>
                                    <div style={{ color: "#94a3b8", fontSize: 12, marginBottom: 4 }}>Theo trạng thái xử lý hiện tại</div>
                                    {statusRows.length ? statusRows.map(item => (
                                        <div className="status-row" key={item.label}>
                                            <div>
                                                <div className="status-row__label"><span className="status-dot" style={{ background: item.color }} />{item.label}</div>
                                                <Progress percent={activeRecordCount ? Math.round((item.value / activeRecordCount) * 100) : 0} showInfo={false} strokeColor={item.color} trailColor="#edf1f6" size="small" style={{ margin: "8px 0 0 17px", width: "calc(100% - 17px)" }} />
                                            </div>
                                            <strong style={{ color: "#273449", textAlign: "right" }}>{item.value}</strong>
                                        </div>
                                    )) : <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Chưa có hồ sơ để phân bổ" />}
                                </Card>
                            </Col>

                            <Col xs={24} lg={15}>
                                <Card className="progress-panel" title="Hành trình hoàn thành" bordered={false}>
                                    <div style={{ color: "#94a3b8", fontSize: 12, marginBottom: 16 }}>Theo dõi mức hoàn tất ở mỗi chặng, không chỉ tổng số cuối kỳ.</div>
                                    {phaseRows.map((phase, index) => {
                                        const percent = phase.total ? Math.round((phase.done / phase.total) * 100) : 0;
                                        return (
                                            <div className="phase-row" key={phase.label}>
                                                <div className="phase-index" style={{ color: phase.color }}>{index + 1}</div>
                                                <div>
                                                    <div className="phase-row__head"><div><div className="phase-row__title">{phase.label}</div><div className="phase-row__caption">{phase.caption}</div></div><strong style={{ color: "#273449" }}>{phase.done}/{phase.total}</strong></div>
                                                    <Progress percent={percent} strokeColor={phase.color} trailColor="#edf1f6" strokeWidth={8} format={value => `${value}%`} style={{ marginTop: 10 }} />
                                                </div>
                                            </div>
                                        );
                                    })}
                                </Card>
                            </Col>
                        </Row>

                        <Row gutter={[14, 14]} style={{ marginBottom: 18 }}>
                            <Col xs={24} lg={9}>
                                <Card
                                    className="progress-panel"
                                    title={<span><BarChartOutlined style={{ marginRight: 8, color: "#2563eb" }} />Calibration sơ bộ</span>}
                                    bordered={false}
                                    loading={isGradeLoading}
                                >
                                    <div style={{ color: "#94a3b8", fontSize: 12, marginBottom: 12 }}>
                                        So sánh phân phối xếp loại để phát hiện xu hướng chấm quá cao/thấp trước khi chốt kỳ.
                                    </div>
                                    {normalizedGradeDistribution.length ? normalizedGradeDistribution.map(item => {
                                        const percent = totalGraded ? Math.round((item.count / totalGraded) * 100) : 0;
                                        const gradeColor = item.grade === "A" ? "#16a34a" : item.grade === "B" ? "#2563eb" : item.grade === "C" ? "#f59e0b" : "#dc2626";
                                        return (
                                            <div className="grade-row" key={item.grade}>
                                                <div className="grade-badge" style={{ background: `${gradeColor}14`, color: gradeColor, border: `1px solid ${gradeColor}30` }}>{item.grade}</div>
                                                <Progress percent={percent} showInfo={false} strokeColor={gradeColor} trailColor="#edf1f6" size="small" />
                                                <strong style={{ color: "#273449", textAlign: "right" }}>{item.count}</strong>
                                            </div>
                                        );
                                    }) : <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Chưa có dữ liệu xếp loại" />}
                                    {calibrationAlerts.length > 0 && (
                                        <Alert
                                            type={excellentRate >= 70 || lowGradeRate >= 30 ? "warning" : "info"}
                                            showIcon
                                            style={{ marginTop: 14, borderRadius: 10 }}
                                            message="Gợi ý kiểm tra"
                                            description={calibrationAlerts[0]}
                                        />
                                    )}
                                </Card>
                            </Col>

                            <Col xs={24} lg={7}>
                                <Card
                                    className="progress-panel"
                                    title={<span><TeamOutlined style={{ marginRight: 8, color: "#7c3aed" }} />Phòng ban cần chú ý</span>}
                                    bordered={false}
                                >
                                    <div style={{ color: "#94a3b8", fontSize: 12, marginBottom: 8 }}>
                                        Ưu tiên phòng ban có hồ sơ quá hạn hoặc tỷ lệ hoàn thành thấp.
                                    </div>
                                    {departmentWatchList.length ? departmentWatchList.map(dept => (
                                        <div className="watch-row" key={dept.departmentId}>
                                            <div>
                                                <div style={{ color: "#273449", fontWeight: 720, fontSize: 13 }}>{dept.departmentName || "Chưa cập nhật phòng ban"}</div>
                                                <div style={{ color: "#94a3b8", fontSize: 12, marginTop: 2 }}>
                                                    {dept.completedCount}/{dept.active} hoàn tất · {dept.stuck} đang xử lý
                                                </div>
                                            </div>
                                            <Space size={4} direction="vertical" align="end">
                                                <Tag color={dept.overdueCount ? "error" : "processing"} style={{ margin: 0, borderRadius: 999 }}>{dept.completion}%</Tag>
                                                {dept.overdueCount > 0 && <span style={{ color: "#dc2626", fontSize: 11, fontWeight: 700 }}>{dept.overdueCount} quá hạn</span>}
                                            </Space>
                                        </div>
                                    )) : <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Không có phòng ban cần cảnh báo" />}
                                </Card>
                            </Col>

                            <Col xs={24} lg={8}>
                                <Card
                                    className="progress-panel"
                                    title={<span><AuditOutlined style={{ marginRight: 8, color: "#0f766e" }} />Kiểm soát audit</span>}
                                    bordered={false}
                                >
                                    <div className="audit-list">
                                        {[
                                            { label: "Lịch sử trạng thái", note: "Ghi nhận nộp, chấm, duyệt, trả lại", ready: true },
                                            { label: "Audit thay đổi điểm", note: "Theo dõi ai sửa điểm và thời điểm sửa", ready: true },
                                            { label: "Lý do gia hạn", note: "Lưu lý do khi HR/Admin gia hạn hạn chót", ready: true },
                                            { label: "Điều chuyển người xử lý", note: "Lưu lý do khi đổi quản lý chấm/duyệt", ready: true },
                                            { label: "Nhân viên xác nhận kết quả", note: "Có bước xác nhận sau khi hoàn tất", ready: true },
                                        ].map(item => (
                                            <div className="audit-item" key={item.label}>
                                                <div>
                                                    <div className="audit-item__label">{item.label}</div>
                                                    <div className="audit-item__note">{item.note}</div>
                                                </div>
                                                <Tag color={item.ready ? "success" : "warning"} style={{ margin: 0, borderRadius: 999 }}>
                                                    {item.ready ? "Đã có" : "Cần bổ sung"}
                                                </Tag>
                                            </div>
                                        ))}
                                    </div>
                                </Card>
                            </Col>
                        </Row>

                        {progressData.overdueRecords && progressData.overdueRecords.length > 0 && (
                            <Card
                                className="progress-panel"
                                title={<span style={{ color: "#b91c1c" }}><WarningOutlined style={{ marginRight: 8 }} />Hồ sơ cần xử lý ({progressData.overdueRecords.length})</span>}
                                bordered={false}
                                style={{
                                    marginBottom: 18,
                                    borderColor: "#fecaca",
                                    background: "#fffdfd"
                                }}
                            >
                                <Table
                                    dataSource={progressData.overdueRecords}
                                    columns={overdueColumns}
                                    rowKey="recordId"
                                    pagination={{ pageSize: 5 }}
                                    size="middle"
                                />
                            </Card>
                        )}

                        <Card
                            className="progress-panel"
                            title={<span><FileTextOutlined style={{ marginRight: 8, color: "#64748b" }} />Tiến độ theo phòng ban</span>}
                            bordered={false}
                        >
                            <Table
                                dataSource={progressData.departmentProgress}
                                columns={deptColumns}
                                rowKey="departmentId"
                                pagination={{ pageSize: 10 }}
                                size="middle"
                            />
                        </Card>
                    </>
                )}
            </div>
            </Spin>
        </PageContainer>
    );
};

export default PeriodProgressDashboard;
