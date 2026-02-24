import { Card, Col, Row, Statistic, Typography } from "antd";
import CountUp from "react-countup";
import { useAppSelector } from "@/redux/hooks";
import { ALL_PERMISSIONS } from "@/config/permissions";
import {
    UserOutlined,
    SafetyOutlined,
    KeyOutlined,
    RiseOutlined,
    TeamOutlined,
    TrophyOutlined
} from "@ant-design/icons";

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
                    minHeight: "calc(100vh - 100px)",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    alignItems: "center",
                    background: "linear-gradient(135deg, #fff 0%, #fdf2f8 50%, #fce7f3 100%)",
                    borderRadius: "24px",
                    padding: "60px 40px",
                    position: "relative",
                    overflow: "hidden",
                }}
            >
                {/* Decorative background elements */}
                <div
                    style={{
                        position: "absolute",
                        top: "-100px",
                        right: "-100px",
                        width: "400px",
                        height: "400px",
                        background: "radial-gradient(circle, rgba(236, 72, 153, 0.08) 0%, transparent 70%)",
                        borderRadius: "50%",
                        pointerEvents: "none",
                    }}
                />
                <div
                    style={{
                        position: "absolute",
                        bottom: "-150px",
                        left: "-150px",
                        width: "500px",
                        height: "500px",
                        background: "radial-gradient(circle, rgba(244, 114, 182, 0.06) 0%, transparent 70%)",
                        borderRadius: "50%",
                        pointerEvents: "none",
                    }}
                />

                {/* Floating particles effect */}
                <div
                    className="particle"
                    style={{
                        position: "absolute",
                        top: "20%",
                        left: "15%",
                        width: "8px",
                        height: "8px",
                        background: "linear-gradient(135deg, #ec4899 0%, #f472b6 100%)",
                        borderRadius: "50%",
                        opacity: 0.3,
                        animation: "float 6s ease-in-out infinite",
                    }}
                />
                <div
                    className="particle"
                    style={{
                        position: "absolute",
                        top: "60%",
                        right: "20%",
                        width: "12px",
                        height: "12px",
                        background: "linear-gradient(135deg, #f472b6 0%, #fbcfe8 100%)",
                        borderRadius: "50%",
                        opacity: 0.25,
                        animation: "float 8s ease-in-out infinite 1s",
                    }}
                />
                <div
                    className="particle"
                    style={{
                        position: "absolute",
                        bottom: "25%",
                        left: "25%",
                        width: "10px",
                        height: "10px",
                        background: "linear-gradient(135deg, #fbcfe8 0%, #f9a8d4 100%)",
                        borderRadius: "50%",
                        opacity: 0.2,
                        animation: "float 7s ease-in-out infinite 2s",
                    }}
                />

                {/* Logo with premium styling */}
                <div
                    style={{
                        position: "relative",
                        marginBottom: "32px",
                        animation: "fadeInScale 0.8s ease-out",
                    }}
                >
                    <div
                        style={{
                            width: "140px",
                            height: "140px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            background: "linear-gradient(135deg, rgba(236, 72, 153, 0.08) 0%, rgba(244, 114, 182, 0.05) 100%)",
                            borderRadius: "50%",
                            padding: "20px",
                            boxShadow: "0 8px 32px rgba(236, 72, 153, 0.15), 0 0 0 1px rgba(236, 72, 153, 0.1)",
                            position: "relative",
                            zIndex: 1,
                        }}
                    >
                        <img
                            src="/logo/LOGOFINAL.png"
                            alt="LOTUS HRM"
                            style={{
                                width: "100%",
                                height: "auto",
                                objectFit: "contain",
                            }}
                        />
                    </div>
                    {/* Pulsing ring effect */}
                    <div
                        style={{
                            position: "absolute",
                            inset: "-12px",
                            borderRadius: "50%",
                            border: "2px solid rgba(236, 72, 153, 0.2)",
                            animation: "pulse-ring 3s ease-out infinite",
                        }}
                    />
                </div>

                {/* Welcome text */}
                <Title
                    level={1}
                    style={{
                        textAlign: "center",
                        marginBottom: "16px",
                        background: "linear-gradient(135deg, #ec4899 0%, #f472b6 100%)",
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                        backgroundClip: "text",
                        fontSize: "42px",
                        fontWeight: 800,
                        letterSpacing: "-0.5px",
                        animation: "fadeInUp 0.8s ease-out 0.2s both",
                    }}
                >
                    Chào mừng đến với LOTUS HRM
                </Title>

                <Text
                    style={{
                        fontSize: "18px",
                        color: "#ec4899",
                        textAlign: "center",
                        fontWeight: 500,
                        letterSpacing: "0.3px",
                        animation: "fadeInUp 0.8s ease-out 0.4s both",
                    }}
                >
                    Bộ hồ sơ quản trị nhân sự
                </Text>

                {/* Subtle tagline */}
                <Text
                    type="secondary"
                    style={{
                        fontSize: "14px",
                        textAlign: "center",
                        marginTop: "8px",
                        opacity: 0.7,
                        animation: "fadeInUp 0.8s ease-out 0.6s both",
                    }}
                >
                    Hệ thống quản lý nhân sự tiện dụng & hiện đại
                </Text>

                {/* Decorative divider */}
                <div
                    style={{
                        marginTop: "32px",
                        width: "120px",
                        height: "4px",
                        background: "linear-gradient(90deg, transparent 0%, #ec4899 50%, transparent 100%)",
                        borderRadius: "2px",
                        animation: "fadeIn 0.8s ease-out 0.8s both",
                    }}
                />

                {/* Animation styles */}
                <style>{`
                    @keyframes fadeInScale {
                        from {
                            opacity: 0;
                            transform: scale(0.8);
                        }
                        to {
                            opacity: 1;
                            transform: scale(1);
                        }
                    }

                    @keyframes fadeInUp {
                        from {
                            opacity: 0;
                            transform: translateY(20px);
                        }
                        to {
                            opacity: 1;
                            transform: translateY(0);
                        }
                    }

                    @keyframes fadeIn {
                        from {
                            opacity: 0;
                        }
                        to {
                            opacity: 1;
                        }
                    }

                    @keyframes pulse-ring {
                        0% {
                            transform: scale(1);
                            opacity: 0.5;
                        }
                        50% {
                            transform: scale(1.1);
                            opacity: 0.2;
                        }
                        100% {
                            transform: scale(1.2);
                            opacity: 0;
                        }
                    }

                    @keyframes float {
                        0%, 100% {
                            transform: translateY(0) translateX(0);
                        }
                        33% {
                            transform: translateY(-20px) translateX(10px);
                        }
                        66% {
                            transform: translateY(-10px) translateX(-10px);
                        }
                    }
                `}</style>
            </div>
        );
    }

    const statsConfig = [
        {
            title: "Tổng người dùng",
            value: mockData.userCount,
            icon: <TeamOutlined style={{ fontSize: "32px" }} />,
            gradient: "linear-gradient(135deg, #ec4899 0%, #f472b6 100%)",
            bgGradient: "linear-gradient(135deg, rgba(236, 72, 153, 0.08) 0%, rgba(244, 114, 182, 0.05) 100%)",
        },
        {
            title: "Tổng vai trò",
            value: mockData.roleCount,
            icon: <TrophyOutlined style={{ fontSize: "32px" }} />,
            gradient: "linear-gradient(135deg, #f472b6 0%, #f9a8d4 100%)",
            bgGradient: "linear-gradient(135deg, rgba(244, 114, 182, 0.08) 0%, rgba(249, 168, 212, 0.05) 100%)",
        },
        {
            title: "Tổng quyền hạn",
            value: mockData.permissionCount,
            icon: <KeyOutlined style={{ fontSize: "32px" }} />,
            gradient: "linear-gradient(135deg, #f9a8d4 0%, #fbcfe8 100%)",
            bgGradient: "linear-gradient(135deg, rgba(249, 168, 212, 0.08) 0%, rgba(251, 207, 232, 0.05) 100%)",
        },
    ];

    return (
        <div style={{ position: "relative" }}>
            {/* Header section */}
            <div
                style={{
                    marginBottom: "32px",
                    padding: "32px",
                    background: "linear-gradient(135deg, #fff 0%, #fdf2f8 50%, #fce7f3 100%)",
                    borderRadius: "24px",
                    boxShadow: "0 4px 20px rgba(236, 72, 153, 0.08)",
                    position: "relative",
                    overflow: "hidden",
                }}
            >
                {/* Background decoration */}
                <div
                    style={{
                        position: "absolute",
                        top: "-50px",
                        right: "-50px",
                        width: "200px",
                        height: "200px",
                        background: "radial-gradient(circle, rgba(236, 72, 153, 0.06) 0%, transparent 70%)",
                        borderRadius: "50%",
                        pointerEvents: "none",
                    }}
                />

                <div style={{ position: "relative", zIndex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "12px" }}>
                        <div
                            style={{
                                width: "56px",
                                height: "56px",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                background: "linear-gradient(135deg, rgba(236, 72, 153, 0.08) 0%, rgba(244, 114, 182, 0.05) 100%)",
                                borderRadius: "16px",
                                padding: "12px",
                                boxShadow: "0 4px 12px rgba(236, 72, 153, 0.12)",
                            }}
                        >
                            <img
                                src="/logo/LOGOFINAL.png"
                                alt="LOTUS"
                                style={{ width: "100%", height: "auto" }}
                            />
                        </div>
                        <div>
                            <Title
                                level={2}
                                style={{
                                    margin: 0,
                                    background: "linear-gradient(135deg, #ec4899 0%, #f472b6 100%)",
                                    WebkitBackgroundClip: "text",
                                    WebkitTextFillColor: "transparent",
                                    backgroundClip: "text",
                                    fontSize: "28px",
                                    fontWeight: 700,
                                }}
                            >
                                Tổng quan hệ thống
                            </Title>
                            <Text style={{ color: "#f472b6", fontSize: "14px", fontWeight: 500 }}>
                                Bộ hồ sơ quản trị nhân sự
                            </Text>
                        </div>
                    </div>
                </div>
            </div>

            {/* Statistics cards */}
            <Row gutter={[24, 24]}>
                {statsConfig.map((stat, index) => (
                    <Col span={24} md={8} key={index}>
                        <Card
                            bordered={false}
                            style={{
                                borderRadius: "20px",
                                background: stat.bgGradient,
                                border: "1px solid rgba(236, 72, 153, 0.1)",
                                boxShadow: "0 4px 20px rgba(236, 72, 153, 0.08)",
                                overflow: "hidden",
                                position: "relative",
                                transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                            }}
                            className="stat-card"
                            hoverable
                        >
                            {/* Card decoration */}
                            <div
                                style={{
                                    position: "absolute",
                                    top: "-30px",
                                    right: "-30px",
                                    width: "120px",
                                    height: "120px",
                                    background: "radial-gradient(circle, rgba(236, 72, 153, 0.08) 0%, transparent 70%)",
                                    borderRadius: "50%",
                                    pointerEvents: "none",
                                }}
                            />

                            <div style={{ position: "relative", zIndex: 1 }}>
                                <div
                                    style={{
                                        marginBottom: "16px",
                                        display: "inline-flex",
                                        padding: "12px",
                                        borderRadius: "14px",
                                        background: "rgba(255, 255, 255, 0.6)",
                                        boxShadow: "0 2px 8px rgba(236, 72, 153, 0.12)",
                                    }}
                                >
                                    <div style={{ background: stat.gradient, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
                                        {stat.icon}
                                    </div>
                                </div>

                                <Statistic
                                    title={
                                        <span style={{
                                            color: "#ec4899",
                                            fontSize: "15px",
                                            fontWeight: 600,
                                            letterSpacing: "0.3px"
                                        }}>
                                            {stat.title}
                                        </span>
                                    }
                                    value={stat.value}
                                    formatter={formatter}
                                    valueStyle={{
                                        background: stat.gradient,
                                        WebkitBackgroundClip: "text",
                                        WebkitTextFillColor: "transparent",
                                        backgroundClip: "text",
                                        fontSize: "36px",
                                        fontWeight: 800,
                                    }}
                                />
                            </div>
                        </Card>
                    </Col>
                ))}
            </Row>

            {/* Card hover effects */}
            <style>{`
                .stat-card {
                    animation: fadeInUp 0.6s ease-out both;
                    animation-delay: calc(var(--index, 0) * 0.1s);
                }

                .stat-card:hover {
                    transform: translateY(-8px);
                    box-shadow: 0 12px 32px rgba(236, 72, 153, 0.15) !important;
                }

                .stat-card:nth-child(1) { --index: 0; }
                .stat-card:nth-child(2) { --index: 1; }
                .stat-card:nth-child(3) { --index: 2; }

                @keyframes fadeInUp {
                    from {
                        opacity: 0;
                        transform: translateY(30px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
            `}</style>
        </div>
    );
};

export default DashboardPage;