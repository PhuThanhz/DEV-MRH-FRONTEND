import { Card, Col, Row, Table, Typography, Space, Button } from "antd";
import { Pie, Column } from "@/components/common/chart/LazyChart";
import {
    useAccountingDossierStorageSummaryQuery,
    useAccountingDossierPendingByRoleQuery,
    useAccountingDossierReportByStatusQuery,
    useAccountingDossierReportByDepartmentQuery,
    useRefreshExpiredAccountingDossierStorageMutation
} from "@/hooks/useAccountingDossiers";
import { FileProtectOutlined, ClockCircleOutlined, SyncOutlined, InboxOutlined } from "@ant-design/icons";

const { Title, Text } = Typography;

const StorageDashboard = () => {
    const { data: summary, isLoading: isLoadingSummary, refetch: refetchSummary } = useAccountingDossierStorageSummaryQuery();
    const { data: pendingByRole, isLoading: isLoadingPending } = useAccountingDossierPendingByRoleQuery();
    const { data: byStatus, isLoading: isLoadingStatus } = useAccountingDossierReportByStatusQuery();
    const { data: byDept, isLoading: isLoadingDept } = useAccountingDossierReportByDepartmentQuery();

    const refreshMutation = useRefreshExpiredAccountingDossierStorageMutation();

    const handleRefresh = async () => {
        await refreshMutation.mutateAsync();
        refetchSummary();
    };

    const statusChartData = (byStatus || []).map(item => ({
        type: item.label || item.key,
        value: item.count
    }));

    const deptChartData = (byDept || []).map(item => ({
        department: item.label || item.key,
        count: item.count
    }));

    return (
        <div style={{ padding: "16px 0" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <Title level={4} style={{ margin: 0 }}>Tổng quan lưu trữ</Title>
                <Button
                    type="primary"
                    icon={<SyncOutlined />}
                    onClick={handleRefresh}
                    loading={refreshMutation.isPending}
                >
                    Cập nhật hết hạn
                </Button>
            </div>

            <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                <Col xs={24} sm={12} md={6}>
                    <Card bordered={false} style={{ height: "100%", background: "#f0f5ff" }}>
                        <StatisticCard
                            title="Tổng hồ sơ"
                            value={summary?.total || 0}
                            icon={<FileProtectOutlined style={{ color: "#1677ff", fontSize: 24 }} />}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} md={6}>
                    <Card bordered={false} style={{ height: "100%", background: "#f6ffed" }}>
                        <StatisticCard
                            title="Đang lưu trữ"
                            value={summary?.inRetention || 0}
                            icon={<InboxOutlined style={{ color: "#52c41a", fontSize: 24 }} />}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} md={6}>
                    <Card bordered={false} style={{ height: "100%", background: "#fff2e8" }}>
                        <StatisticCard
                            title="Hết hạn lưu trữ"
                            value={summary?.expired || 0}
                            icon={<ClockCircleOutlined style={{ color: "#fa541c", fontSize: 24 }} />}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} md={6}>
                    <Card bordered={false} style={{ height: "100%", background: "#f9f0ff" }}>
                        <StatisticCard
                            title="Đã lưu kho (Archive)"
                            value={summary?.archived || 0}
                            icon={<InboxOutlined style={{ color: "#722ed1", fontSize: 24 }} />}
                        />
                    </Card>
                </Col>
            </Row>

            <Row gutter={[16, 16]}>
                <Col xs={24} md={12}>
                    <Card title="Hồ sơ theo trạng thái nghiệp vụ" bordered={false} loading={isLoadingStatus}>
                        {statusChartData.length > 0 ? (
                            <Pie
                                data={statusChartData}
                                angleField="value"
                                colorField="type"
                                radius={0.8}
                                innerRadius={0.64}
                                label={{ type: 'outer', content: '{name} {percentage}' }}
                                legend={{ position: 'bottom' }}
                            />
                        ) : <Text type="secondary">Chưa có dữ liệu</Text>}
                    </Card>
                </Col>
                <Col xs={24} md={12}>
                    <Card title="Chờ duyệt theo vai trò" bordered={false} loading={isLoadingPending}>
                        <Table
                            dataSource={pendingByRole || []}
                            rowKey="key"
                            pagination={false}
                            size="small"
                            columns={[
                                { title: 'Vai trò', dataIndex: 'label', key: 'label' },
                                { title: 'Số lượng hồ sơ', dataIndex: 'count', key: 'count', align: 'right' as const, render: (val) => <strong>{val}</strong> }
                            ]}
                        />
                    </Card>
                </Col>
                <Col xs={24}>
                    <Card title="Hồ sơ theo phòng ban" bordered={false} loading={isLoadingDept}>
                        {deptChartData.length > 0 ? (
                            <Column
                                data={deptChartData}
                                xField="department"
                                yField="count"
                                label={{ position: 'middle', style: { fill: '#FFFFFF', opacity: 0.6 } }}
                                xAxis={{ label: { autoHide: true, autoRotate: false } }}
                                color="#1677ff"
                            />
                        ) : <Text type="secondary">Chưa có dữ liệu</Text>}
                    </Card>
                </Col>
            </Row>
        </div>
    );
};

const StatisticCard = ({ title, value, icon }: { title: string, value: number, icon: React.ReactNode }) => (
    <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <div>{icon}</div>
        <div>
            <div style={{ color: "#8c8c8c", fontSize: 14 }}>{title}</div>
            <div style={{ fontSize: 24, fontWeight: "bold", color: "#262626" }}>{value}</div>
        </div>
    </div>
);

export default StorageDashboard;
