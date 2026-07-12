import React, { useState } from "react";
import { Card, Col, Row, Typography, Space, Button, Select, Tooltip, Progress } from "antd";
import { Pie, Column } from "@/components/common/chart/LazyChart";
import {
    useAccountingDossierStorageSummaryQuery,
    useAccountingDossierPendingByRoleQuery,
    useAccountingDossierReportByStatusQuery,
    useAccountingDossierReportByDepartmentQuery,
    useRefreshExpiredAccountingDossierStorageMutation
} from "@/hooks/useAccountingDossiers";
import { useCompaniesQuery } from "@/hooks/useCompanies";
import { 
    FileProtectOutlined, 
    ClockCircleOutlined, 
    SyncOutlined, 
    InboxOutlined, 
    CloudServerOutlined,
    InfoCircleOutlined,
    BankOutlined,
    FileTextOutlined
} from "@ant-design/icons";
import useAccess from "@/hooks/useAccess";
import { ALL_PERMISSIONS } from "@/config/permissions";

const { Title, Text } = Typography;

const mapRoleName = (role: string) => {
    const mapping: Record<string, string> = {
        "DEPARTMENT_MANAGER": "Trưởng Bộ Phận",
        "ACCOUNTANT": "Nhân viên Kế toán",
        "DIRECTOR": "Ban Giám đốc",
        "CHIEF_ACCOUNTANT": "Kế toán Trưởng",
    };
    return mapping[role.toUpperCase()] || role;
};

const mapStatusName = (status: string) => {
    const mapping: Record<string, string> = {
        "DRAFT": "Nháp",
        "ACTIVE": "Đang hoạt động",
        "SUBMITTED": "Đã gửi duyệt",
        "IN_REVIEW": "Đang xét duyệt",
        "APPROVED": "Đã phê duyệt",
        "REJECTED": "Bị từ chối",
        "TERMINATED": "Đã chấm dứt",
        "ARCHIVED": "Đã lưu kho",
        "RETURN_REQUESTED": "Yêu cầu hoàn trả",
    };
    return mapping[status.toUpperCase()] || status;
};

// Bảng màu hồng/trắng/xám hài hoà với hệ thống
const PINK_COLOR_PALETTE = [
    "#E8356D", // Hồng chủ đạo
    "#ff6b9d", // Hồng sáng
    "#ff9ebb", // Hồng phấn
    "#ffd1df", // Hồng sữa
    "#64748b", // Xám slate
    "#94a3b8"  // Xám nhạt
];

const StorageDashboard = () => {
    const [selectedCompanyId, setSelectedCompanyId] = useState<number | undefined>(undefined);
    
    // Fetch companies list
    const { data: companyData } = useCompaniesQuery("page=1&size=100&sort=name,asc&filter=status:1");
    const companies = companyData?.result || [];

    const canRefreshExpiredStorage = useAccess(ALL_PERMISSIONS.ACCOUNTING_DOSSIERS.REFRESH_EXPIRED_STORAGE);
    const { data: summary, isLoading: isLoadingSummary, refetch: refetchSummary } = useAccountingDossierStorageSummaryQuery(selectedCompanyId);
    const { data: pendingByRole, isLoading: isLoadingPending } = useAccountingDossierPendingByRoleQuery(selectedCompanyId);
    const { data: byStatus, isLoading: isLoadingStatus } = useAccountingDossierReportByStatusQuery(selectedCompanyId);
    const { data: byDept, isLoading: isLoadingDept } = useAccountingDossierReportByDepartmentQuery(selectedCompanyId);

    const refreshMutation = useRefreshExpiredAccountingDossierStorageMutation();

    const handleRefresh = async () => {
        await refreshMutation.mutateAsync();
        refetchSummary();
    };

    const statusChartData = (byStatus || []).map(item => ({
        type: mapStatusName(item.label || item.key),
        value: item.count
    }));

    const deptChartData = (byDept || []).map(item => ({
        department: item.label || item.key,
        count: item.count
    }));

    return (
        <div style={{ padding: "12px 0", background: "transparent" }}>
            <style>{`
                .premium-card {
                    background: #ffffff !important;
                    border: 1px solid #eef0f4 !important;
                    border-radius: 12px !important;
                    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.015) !important;
                    transition: all 0.25s ease !important;
                    overflow: hidden;
                }
                .premium-card:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 12px 20px rgba(232, 53, 109, 0.04) !important;
                    border-color: rgba(232, 53, 109, 0.15) !important;
                }
                .metric-title {
                    color: #8e8e93 !important;
                    font-size: 13px !important;
                    font-weight: 550 !important;
                }
                .metric-value {
                    font-size: 28px !important;
                    font-weight: 700 !important;
                    color: #1c1c1e !important;
                }
                .chart-card .ant-card-head {
                    border-bottom: 1px solid #f2f2f7 !important;
                    padding: 16px 20px !important;
                }
                .chart-card .ant-card-head-title {
                    font-size: 15px !important;
                    font-weight: 700 !important;
                    color: #1c1c1e !important;
                }
                .clean-header {
                    background: #ffffff;
                    border-radius: 12px;
                    padding: 20px 24px;
                    border: 1px solid #eef0f4;
                    margin-bottom: 24px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    flex-wrap: wrap;
                    gap: 16px;
                }
            `}</style>

            {/* Clean Header Section */}
            <div className="clean-header">
                <Space direction="vertical" size={2}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ width: 4, height: 16, background: "#E8356D", borderRadius: 2 }} />
                        <Title level={4} style={{ margin: 0, color: "#1c1c1e", fontWeight: 700 }}>
                            Báo cáo & Thống kê lưu trữ
                        </Title>
                        <Tooltip title="Thống kê tổng quan trạng thái, phòng ban và tiến độ duyệt chứng từ">
                            <InfoCircleOutlined style={{ color: "#aeaeb2", fontSize: 13, cursor: "pointer" }} />
                        </Tooltip>
                    </div>
                    <Text type="secondary" style={{ fontSize: 12.5, color: "#8e8e93" }}>
                        Theo dõi vòng đời tài liệu và tối ưu hóa quy trình phê duyệt
                    </Text>
                </Space>
                
                <Space size={12} wrap>
                    <Select
                        placeholder="Tất cả công ty"
                        allowClear
                        showSearch
                        optionFilterProp="label"
                        value={selectedCompanyId}
                        onChange={(val) => setSelectedCompanyId(val)}
                        style={{ width: 280, height: 40 }}
                        popupMatchSelectWidth={false}
                        dropdownStyle={{ borderRadius: 8 }}
                        suffixIcon={<BankOutlined style={{ color: "#aeaeb2" }} />}
                        options={[
                            { label: "Tất cả công ty", value: undefined },
                            ...companies.map(c => ({ label: c.name, value: c.id }))
                        ]}
                    />
                    {canRefreshExpiredStorage && (
                        <Button
                            type="primary"
                            icon={<SyncOutlined />}
                            onClick={handleRefresh}
                            loading={refreshMutation.isPending}
                            style={{ 
                                background: "#E8356D",
                                borderColor: "#E8356D",
                                height: 40,
                                borderRadius: 8,
                                fontWeight: 600,
                                fontSize: 13,
                                boxShadow: "0 2px 6px rgba(232, 53, 109, 0.15)"
                            }}
                        >
                            Quét hạn lưu trữ
                        </Button>
                    )}
                </Space>
            </div>

            {/* Summary Row */}
            <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                <Col xs={24} sm={12} md={6}>
                    <Card bordered={false} className="premium-card" bodyStyle={{ padding: "20px 24px" }}>
                        <StatisticCard
                            title="Tổng bộ hồ sơ"
                            value={summary?.total || 0}
                            icon={<FileProtectOutlined style={{ color: "#E8356D", fontSize: 20 }} />}
                            iconBg="#fff0f6"
                            badgeText="Hồ sơ hệ thống"
                            badgeColor="#E8356D"
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} md={6}>
                    <Card bordered={false} className="premium-card" bodyStyle={{ padding: "20px 24px" }}>
                        <StatisticCard
                            title="Đang lưu trữ"
                            value={summary?.inRetention || 0}
                            icon={<InboxOutlined style={{ color: "#E8356D", fontSize: 20 }} />}
                            iconBg="#fff0f6"
                            badgeText="Trong thời hạn"
                            badgeColor="#E8356D"
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} md={6}>
                    <Card bordered={false} className="premium-card" bodyStyle={{ padding: "20px 24px" }}>
                        <StatisticCard
                            title="Hết hạn lưu trữ"
                            value={summary?.expired || 0}
                            icon={<ClockCircleOutlined style={{ color: "#dc2626", fontSize: 20 }} />}
                            iconBg="#fef2f2"
                            badgeText="Cần xử lý"
                            badgeColor="#dc2626"
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} md={6}>
                    <Card bordered={false} className="premium-card" bodyStyle={{ padding: "20px 24px" }}>
                        <StatisticCard
                            title="Đã lưu kho vĩnh viễn"
                            value={summary?.archived || 0}
                            icon={<CloudServerOutlined style={{ color: "#E8356D", fontSize: 20 }} />}
                            iconBg="#fff0f6"
                            badgeText="Lưu trữ kho"
                            badgeColor="#E8356D"
                        />
                    </Card>
                </Col>
            </Row>

            {/* Bento Grid Charts Section */}
            <Row gutter={[20, 20]}>
                <Col xs={24} md={12}>
                    <Card 
                        title="Trạng thái hồ sơ nghiệp vụ" 
                        bordered={false} 
                        loading={isLoadingStatus}
                        className="premium-card chart-card"
                        bodyStyle={{ padding: "24px", minHeight: 330 }}
                    >
                        {statusChartData.length > 0 ? (
                            <div style={{ height: 280, display: "flex", alignItems: "center", justifyContent: "center" }}>
                                <Pie
                                    data={statusChartData}
                                    angleField="value"
                                    colorField="type"
                                    innerRadius={0.65}
                                    height={260}
                                    color={PINK_COLOR_PALETTE}
                                    legend={{
                                        color: {
                                            position: 'bottom',
                                            layout: 'horizontal',
                                            itemMarker: 'circle',
                                        }
                                    }}
                                    label={{
                                        text: 'value',
                                        style: {
                                            fontWeight: 'bold',
                                            fill: '#fff'
                                        }
                                    }}
                                    tooltip={{
                                        formatter: (datum: any) => ({ name: datum.type, value: `${datum.value} hồ sơ` })
                                    }}
                                />
                            </div>
                        ) : (
                            <div style={{ height: 280, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12 }}>
                                <FileTextOutlined style={{ fontSize: 32, color: "#d1d1d6" }} />
                                <Text type="secondary" style={{ fontSize: 13 }}>Chưa có dữ liệu thống kê trạng thái</Text>
                            </div>
                        )}
                    </Card>
                </Col>
                
                <Col xs={24} md={12}>
                    <Card 
                        title="Hồ sơ tồn đọng chờ duyệt theo vai trò" 
                        bordered={false} 
                        loading={isLoadingPending}
                        className="premium-card chart-card"
                        bodyStyle={{ padding: "24px", minHeight: 330 }}
                    >
                        {(pendingByRole || []).length > 0 ? (
                            <div style={{ display: "flex", flexDirection: "column", gap: 20, paddingTop: 6 }}>
                                {(pendingByRole || []).map((record) => {
                                    const maxCount = Math.max(...(pendingByRole || []).map(r => r.count), 1);
                                    const percent = Math.round((record.count / maxCount) * 100);
                                    return (
                                        <div key={record.key} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                                <span style={{ fontWeight: 600, color: "#3a3a3c", fontSize: 13.5 }}>
                                                    {mapRoleName(record.label)}
                                                </span>
                                                <span style={{ fontWeight: 700, color: "#E8356D", background: "#fff0f6", padding: "3px 10px", borderRadius: 8, fontSize: 11.5 }}>
                                                    {record.count} hồ sơ
                                                </span>
                                            </div>
                                            <Progress 
                                                percent={percent} 
                                                showInfo={false}
                                                strokeColor="#E8356D"
                                                trailColor="#f2f2f7"
                                                strokeWidth={6}
                                                style={{ margin: 0 }}
                                            />
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div style={{ height: 280, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12 }}>
                                <ClockCircleOutlined style={{ fontSize: 32, color: "#d1d1d6" }} />
                                <Text type="secondary" style={{ fontSize: 13 }}>Không có hồ sơ nào đang chờ duyệt</Text>
                            </div>
                        )}
                    </Card>
                </Col>

                <Col xs={24}>
                    <Card 
                        title="Tổng lượng chứng từ phát sinh theo phòng ban" 
                        bordered={false} 
                        loading={isLoadingDept}
                        className="premium-card chart-card"
                        bodyStyle={{ padding: "24px" }}
                    >
                        {deptChartData.length > 0 ? (
                            <Column
                                data={deptChartData}
                                xField="department"
                                yField="count"
                                height={280}
                                style={{
                                    fill: "#E8356D",
                                    radiusTopLeft: 6,
                                    radiusTopRight: 6
                                }}
                                axis={{
                                    y: { title: false },
                                    x: { title: false }
                                }}
                                label={{
                                    text: (d: any) => d.count,
                                    position: 'top',
                                    style: { fill: '#48484a', fontWeight: 600 }
                                }}
                                tooltip={{
                                    formatter: (datum: any) => ({ name: 'Số lượng', value: `${datum.count} hồ sơ` })
                                }}
                            />
                        ) : (
                            <div style={{ padding: "40px 0", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
                                <FileTextOutlined style={{ fontSize: 32, color: "#d1d1d6" }} />
                                <Text type="secondary" style={{ fontSize: 13 }}>Chưa có dữ liệu thống kê phòng ban</Text>
                            </div>
                        )}
                    </Card>
                </Col>
            </Row>
        </div>
    );
};

const StatisticCard = ({ 
    title, 
    value, 
    icon, 
    iconBg, 
    badgeText, 
    badgeColor 
}: { 
    title: string, 
    value: number, 
    icon: React.ReactNode, 
    iconBg: string,
    badgeText?: string,
    badgeColor?: string
}) => (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ 
                display: "flex", 
                alignItems: "center", 
                justifyContent: "center", 
                width: 44, 
                height: 44, 
                borderRadius: "10px", 
                background: iconBg,
            }}>
                {icon}
            </div>
            {badgeText && (
                <span style={{ 
                    fontSize: 10.5, 
                    fontWeight: 600, 
                    color: badgeColor, 
                    background: `${badgeColor}12`, 
                    padding: "2px 8px", 
                    borderRadius: "6px" 
                }}>
                    {badgeText}
                </span>
            )}
        </div>
        
        <div>
            <div className="metric-title" style={{ marginBottom: 2 }}>{title}</div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
                <span className="metric-value">{value}</span>
                <span style={{ fontSize: 12, color: "#8e8e93", fontWeight: 550 }}>hồ sơ</span>
            </div>
        </div>
    </div>
);

export default StorageDashboard;
