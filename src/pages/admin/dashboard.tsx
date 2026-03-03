import React from "react";
import {
    Card,
    Col,
    Row,
    Progress,
    Typography,
    Tag,
    Button,
    Table,
} from "antd";
import { useAppSelector } from "@/redux/hooks";
import { ALL_PERMISSIONS } from "@/config/permissions";
import {
    BankOutlined,
    ApartmentOutlined,
    SafetyCertificateOutlined,
    RiseOutlined,
    FileTextOutlined,
    AimOutlined,
    UserOutlined,
    FlagOutlined,
    WarningOutlined,
} from "@ant-design/icons";
import CountUp from "react-countup";
import { Link } from "react-router-dom";

const { Title, Text } = Typography;

interface ModuleItem {
    key: string;
    title: string;
    icon: React.ReactNode;
    configured: boolean;
    progress: number;
    label: string;
    detail: string;
    missingInfo: string;
    path: string;
    actionText?: string;
}

const styles = `
@import url('https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;600;700&display=swap');

.dashboard-page {
    min-height: 100vh;
    padding: 32px;
    background: #ffffff;
    font-family: 'Be Vietnam Pro', sans-serif;
}

.dashboard-card {
    background: #ffffff !important;
    border-radius: 20px !important;
    border: 1px solid #e4e7ec !important;
    box-shadow: 0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04) !important;
    transition: box-shadow 0.2s ease, transform 0.2s ease;
    overflow: hidden;
}

.dashboard-card:hover {
    box-shadow: 0 4px 20px rgba(0,0,0,0.09) !important;
    transform: translateY(-1px);
}



/* KPI Cards */
.kpi-card {
    position: relative;
    padding: 0 !important;
    overflow: hidden;
}

.kpi-card .ant-card-body {
    padding: 24px !important;
}

.kpi-card-inner {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.kpi-card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
}

.kpi-icon-wrap {
    width: 44px;
    height: 44px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 20px;
    flex-shrink: 0;
}

.kpi-icon-blue   { background: #e6f0ff; color: #1677ff; }
.kpi-icon-orange { background: #fff4e6; color: #fa8c16; }
.kpi-icon-red    { background: #fff1f0; color: #ff4d4f; }

.kpi-label {
    font-size: 13px;
    color: #8c9196;
    font-weight: 500;
    letter-spacing: 0.01em;
}

.kpi-value {
    font-size: 32px;
    font-weight: 700;
    color: #111827;
    line-height: 1.1;
    letter-spacing: -0.5px;
}

.kpi-value-warning {
    font-size: 32px;
    font-weight: 700;
    color: #fa8c16;
    line-height: 1.1;
    letter-spacing: -0.5px;
}

.kpi-value-danger {
    font-size: 32px;
    font-weight: 700;
    color: #ff4d4f;
    line-height: 1.1;
    letter-spacing: -0.5px;
}

.kpi-suffix {
    font-size: 15px;
    font-weight: 500;
    opacity: 0.6;
    margin-left: 2px;
}

/* Decorative shape */
.kpi-card-deco {
    position: absolute;
    right: -18px;
    bottom: -18px;
    width: 80px;
    height: 80px;
    border-radius: 50%;
    opacity: 0.06;
}

.kpi-card-deco-blue   { background: #1677ff; }
.kpi-card-deco-orange { background: #fa8c16; }
.kpi-card-deco-red    { background: #ff4d4f; }

/* Overview card */
.overview-card {
    background: #ffffff !important;
    border: 1px solid #e4e7ec !important;
}

.overview-card .ant-card-body {
    padding: 28px 32px !important;
}

.overview-stat {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 7px 0;
    border-bottom: 1px solid #f3f4f6;
}

.overview-stat:last-child { border-bottom: none; }

.overview-stat-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #e5e7eb;
    flex-shrink: 0;
}

.overview-stat-dot.done { background: #22c55e; }

.overview-stat-name {
    flex: 1;
    font-size: 13px;
    color: #9ca3af;
    font-weight: 400;
}

.overview-stat-name.done {
    color: #111827;
    font-weight: 500;
}

.overview-stat-badge {
    font-size: 11px;
    border-radius: 6px;
    padding: 1px 8px;
    font-weight: 500;
}

.overview-stat-badge.done {
    color: #16a34a;
    background: #f0fdf4;
}

.overview-stat-badge.in-progress {
    color: #d97706;
    background: #fffbeb;
}

.overview-stat-badge.not-started {
    color: #9ca3af;
    background: #f9fafb;
}

.module-icon {
    font-size: 18px;
    color: #1677ff;
}

/* Animate circle stroke on load */
@keyframes stroke-in {
    from { stroke-dashoffset: 300; opacity: 0; }
    to { opacity: 1; }
}

.progress-ring-wrap .ant-progress-circle path:last-child {
    animation: stroke-in 1s cubic-bezier(0.4,0,0.2,1) forwards;
}

/* Remove white circle background inside progress ring */
.progress-ring-wrap .ant-progress-inner {
    background: transparent !important;
}

.progress-ring-wrap .ant-progress-circle-trail {
    stroke: #f1f5f9 !important;
}

/* Table */
.ant-table-thead > tr > th {
    background: #fafafa !important;
    font-weight: 600 !important;
    color: #374151 !important;
    font-size: 13px !important;
}

.section-title {
    font-size: 17px;
    font-weight: 700;
    color: #111827;
    margin-bottom: 16px !important;
}
`;

const DashboardPage = () => {
    const user = useAppSelector((state) => state.account.user);
    const permissions = user?.role?.permissions || [];
    const isSuperAdmin =
        user?.role?.name?.toUpperCase().includes("SUPER") || false;

    const hasDashboardPermission = permissions.some(
        (p: any) =>
            p?.apiPath === ALL_PERMISSIONS.DASHBOARD?.GET_OVERVIEW?.apiPath &&
            p?.method === ALL_PERMISSIONS.DASHBOARD?.GET_OVERVIEW?.method &&
            p?.module === ALL_PERMISSIONS.DASHBOARD?.GET_OVERVIEW?.module
    );

    const hasAccess =
        isSuperAdmin ||
        hasDashboardPermission ||
        import.meta.env.VITE_ACL_ENABLE === "false";

    if (!hasAccess) {
        return (
            <div className="dashboard-page">
                <style>{styles}</style>
                <Card className="dashboard-card" style={{ textAlign: "center", padding: 48 }}>
                    <Title level={4}>Truy cập bị từ chối</Title>
                    <Text type="secondary">
                        Bạn không có quyền xem trang Dashboard.
                    </Text>
                </Card>
            </div>
        );
    }

    const setupStatus = {
        company: { configured: true, progress: 100, label: "Hoàn tất", detail: "Công ty đã cấu hình", missingInfo: "" },
        departments: { configured: true, progress: 100, label: "Hoàn tất", detail: "12 phòng ban", missingInfo: "" },
        rolesAndPermissions: { configured: false, progress: 68, label: "Đang thực hiện", detail: "42/62 quyền đã gán", missingInfo: "Thiếu quyền KPI & Lương" },
        careerPath: { configured: false, progress: 25, label: "Chưa đầy đủ", detail: "2 cấp bậc", missingInfo: "Thiếu cấp quản lý cao" },
        jobDescriptions: { configured: true, progress: 85, label: "Gần hoàn tất", detail: "58/68 vị trí có JD", missingInfo: "" },
        objectivesAndKPI: { configured: false, progress: 0, label: "Chưa bắt đầu", detail: "Chưa có KPI", missingInfo: "Chưa thiết lập KPI phòng ban" },
    };

    const modules: ModuleItem[] = [
        { key: "company", title: "Thông tin Công ty", icon: <BankOutlined />, ...setupStatus.company, path: "/admin/company-setup" },
        { key: "departments", title: "Phòng ban", icon: <ApartmentOutlined />, ...setupStatus.departments, path: "/admin/departments" },
        { key: "rolesAndPermissions", title: "Phân quyền", icon: <SafetyCertificateOutlined />, ...setupStatus.rolesAndPermissions, path: "/admin/roles-permissions", actionText: "Cập nhật" },
        { key: "careerPath", title: "Lộ trình thăng tiến", icon: <RiseOutlined />, ...setupStatus.careerPath, path: "/admin/career-path", actionText: "Thiết lập" },
        { key: "jobDescriptions", title: "Mô tả công việc", icon: <FileTextOutlined />, ...setupStatus.jobDescriptions, path: "/admin/job-descriptions" },
        { key: "objectivesAndKPI", title: "Mục tiêu & KPI", icon: <AimOutlined />, ...setupStatus.objectivesAndKPI, path: "/admin/objectives-kpi", actionText: "Tạo mới" },
    ];

    const completedCount = modules.filter((m) => m.configured).length;
    const totalModules = modules.length;
    const overallProgress = Math.round((completedCount / totalModules) * 100);

    const totalDepts = 12;
    const deptsWithKPI = 4;
    const positionsWithoutJD = 10;

    const kpiData = [
        {
            title: "Tổng nhân sự",
            value: 456,
            icon: <UserOutlined />,
            suffix: "nhân sự",
            valueClass: "kpi-value",
            iconClass: "kpi-icon-blue",
            decoClass: "kpi-card-deco-blue",
        },
        {
            title: "Phòng ban có mục tiêu KPI",
            value: deptsWithKPI,
            icon: <FlagOutlined />,
            suffix: `/ ${totalDepts} phòng ban`,
            valueClass: deptsWithKPI < totalDepts ? "kpi-value-warning" : "kpi-value",
            iconClass: "kpi-icon-orange",
            decoClass: "kpi-card-deco-orange",
            extra: deptsWithKPI < totalDepts
                ? <Tag color="warning" style={{ marginTop: 4, borderRadius: 8 }}>{totalDepts - deptsWithKPI} phòng ban chưa cấu hình</Tag>
                : null,
        },
        {
            title: "Vị trí chưa có JD",
            value: positionsWithoutJD,
            icon: <WarningOutlined />,
            suffix: "vị trí",
            valueClass: positionsWithoutJD > 0 ? "kpi-value-danger" : "kpi-value",
            iconClass: "kpi-icon-red",
            decoClass: "kpi-card-deco-red",
            extra: positionsWithoutJD > 0
                ? <Tag color="error" style={{ marginTop: 4, borderRadius: 8 }}>Cần bổ sung JD</Tag>
                : null,
        },
    ];

    const columns = [
        {
            title: "Module",
            dataIndex: "title",
            render: (text: string, record: ModuleItem) => (
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span className="module-icon">{record.icon}</span>
                    <div>
                        <div style={{ fontWeight: 600 }}>{text}</div>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                            {record.detail}
                        </Text>
                    </div>
                </div>
            ),
        },
        {
            title: "Tiến độ",
            dataIndex: "progress",
            width: 180,
            render: (progress: number) => (
                <Progress percent={progress} size="small" strokeColor={progress === 100 ? "#22c55e" : progress > 0 ? "#f59e0b" : "#e5e7eb"} />
            ),
        },
        {
            title: "Trạng thái",
            dataIndex: "configured",
            width: 150,
            render: (_: any, record: ModuleItem) =>
                record.configured ? (
                    <Tag color="success" style={{ borderRadius: 8 }}>✓ Hoàn tất</Tag>
                ) : record.progress > 0 ? (
                    <Tag color="warning" style={{ borderRadius: 8 }}>Đang thực hiện</Tag>
                ) : (
                    <Tag color="default" style={{ borderRadius: 8 }}>Chưa bắt đầu</Tag>
                ),
        },
    ];

    return (
        <div className="dashboard-page">
            <style>{styles}</style>

            {/* Header */}
            <div style={{ marginBottom: 28 }}>
                <Title level={3} style={{ marginBottom: 4, fontWeight: 700, color: "#111827" }}>
                    Dashboard HRM
                </Title>
                <Text type="secondary" style={{ fontSize: 14 }}>
                    Tổng quan cấu hình hệ thống và chỉ số nhân sự
                </Text>
            </div>

            {/* Overall progress */}
            <Card className="dashboard-card overview-card" style={{ marginBottom: 24 }}>
                <Row align="middle" justify="space-between" gutter={[32, 0]}>
                    <Col flex="1">
                        <div style={{ marginBottom: 4 }}>
                            <Text style={{ fontSize: 13, color: "#9ca3af", fontWeight: 500 }}>Tiến độ cấu hình</Text>
                        </div>
                        <Title level={4} style={{ margin: "0 0 20px", fontWeight: 700, color: "#111827" }}>
                            Thiết lập hệ thống HRM
                        </Title>
                        <div>
                            {modules.map((m) => (
                                <div key={m.key} className="overview-stat">
                                    <span className={`overview-stat-dot ${m.configured ? "done" : ""}`} />
                                    <span className={`overview-stat-name ${m.configured ? "done" : ""}`}>
                                        {m.title}
                                    </span>
                                    {m.configured ? (
                                        <span className="overview-stat-badge done">✓ Hoàn tất</span>
                                    ) : m.progress > 0 ? (
                                        <span className="overview-stat-badge in-progress">{m.progress}%</span>
                                    ) : (
                                        <span className="overview-stat-badge not-started">Chưa bắt đầu</span>
                                    )}
                                </div>
                            ))}
                        </div>
                    </Col>
                    <Col>
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                            <div className="progress-ring-wrap">
                                <Progress
                                    type="circle"
                                    percent={overallProgress}
                                    size={120}
                                    strokeColor={{ "0%": "#6366f1", "100%": "#a78bfa" }}
                                    trailColor="#f1f5f9"
                                    strokeWidth={10}
                                    strokeLinecap="round"
                                    format={(pct) => (
                                        <div style={{ textAlign: "center" }}>
                                            <div style={{ fontSize: 26, fontWeight: 800, color: "#1e1b4b", lineHeight: 1, letterSpacing: "-1px" }}>{pct}%</div>
                                            <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 4, fontWeight: 500 }}>hoàn tất</div>
                                        </div>
                                    )}
                                />
                            </div>
                            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                                    <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#6366f1" }} />
                                    <Text style={{ fontSize: 12, color: "#64748b" }}>{completedCount} xong</Text>
                                </div>
                                <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                                    <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#e2e8f0" }} />
                                    <Text style={{ fontSize: 12, color: "#94a3b8" }}>{totalModules - completedCount} còn lại</Text>
                                </div>
                            </div>
                        </div>
                    </Col>
                </Row>
            </Card>

            {/* KPI Cards – 3 cards, evenly distributed */}
            <Row gutter={[20, 20]} style={{ marginBottom: 24 }}>
                {kpiData.map((item, index) => (
                    <Col xs={24} sm={12} lg={8} key={index}>
                        <Card className="dashboard-card kpi-card" style={{ height: "100%" }}>
                            {/* decorative circle */}
                            <div className={`kpi-card-deco ${item.decoClass}`} />

                            <div className="kpi-card-inner">
                                <div className="kpi-card-header">
                                    <span className="kpi-label">{item.title}</span>
                                    <div className={`kpi-icon-wrap ${item.iconClass}`}>
                                        {item.icon}
                                    </div>
                                </div>

                                <div>
                                    <span className={item.valueClass}>
                                        <CountUp
                                            end={item.value}
                                            duration={1.5}
                                            decimals={(item as any).decimals ?? 0}
                                        />
                                    </span>
                                    {item.suffix && (
                                        <span className="kpi-suffix"> {item.suffix}</span>
                                    )}
                                </div>

                                {(item as any).extra && (item as any).extra}
                            </div>
                        </Card>
                    </Col>
                ))}
            </Row>

            {/* Module table */}
            <Card className="dashboard-card" style={{ padding: 0 }}>
                <div style={{ padding: "24px 24px 0" }}>
                    <Title level={4} className="section-title">
                        Chi tiết cấu hình module
                    </Title>
                </div>
                <Table
                    columns={columns}
                    dataSource={modules}
                    pagination={false}
                    rowKey="key"
                />
            </Card>
        </div>
    );
};

export default DashboardPage;