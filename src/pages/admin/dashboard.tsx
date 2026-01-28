import { Card, Col, Row, Statistic, Typography } from "antd";
import CountUp from "react-countup";
import { useAppSelector } from "@/redux/hooks";
import { ALL_PERMISSIONS } from "@/config/permissions";

const { Title, Text } = Typography;

const DashboardPage = () => {
    const permissions = useAppSelector((s) => s.account.user.role.permissions);

    const hasAccess =
        permissions?.some(
            (p: any) =>
                p.apiPath === ALL_PERMISSIONS.DASHBOARD.GET_OVERVIEW.apiPath &&
                p.method === ALL_PERMISSIONS.DASHBOARD.GET_OVERVIEW.method &&
                p.module === ALL_PERMISSIONS.DASHBOARD.GET_OVERVIEW.module
        ) || import.meta.env.VITE_ACL_ENABLE === "false";

    const mockData = {
        userCount: 1280,
        roleCount: 14,
        permissionCount: 56,
    };

    const formatter = (value: number | string) => (
        <CountUp end={Number(value)} separator="," />
    );

    if (!hasAccess) {
        return (
            <div
                style={{
                    minHeight: "100%",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    alignItems: "center",
                    background: "none",
                }}
            >
                <img
                    src="/logo/logo.png"
                    alt="Logo"
                    style={{ width: 100, marginBottom: 24, opacity: 0.9 }}
                />
                <Title level={2} style={{ textAlign: "center", marginBottom: 8 }}>
                    Chào mừng bạn đến với hệ thống quản trị
                </Title>
                <Text type="secondary">Hệ thống quản lý & bảo trì thiết bị thông minh</Text>
            </div>
        );
    }

    return (
        <Row gutter={[20, 20]}>
            <Col span={24} md={8}>
                <Card bordered={false}>
                    <Statistic
                        title="Tổng người dùng"
                        value={mockData.userCount}
                        formatter={formatter}
                    />
                </Card>
            </Col>
            <Col span={24} md={8}>
                <Card bordered={false}>
                    <Statistic
                        title="Tổng vai trò"
                        value={mockData.roleCount}
                        formatter={formatter}
                    />
                </Card>
            </Col>
            <Col span={24} md={8}>
                <Card bordered={false}>
                    <Statistic
                        title="Tổng quyền hạn"
                        value={mockData.permissionCount}
                        formatter={formatter}
                    />
                </Card>
            </Col>
        </Row>
    );
};

export default DashboardPage;
