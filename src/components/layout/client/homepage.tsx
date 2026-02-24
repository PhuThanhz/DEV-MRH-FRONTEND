import { useNavigate } from "react-router-dom";
import { Button, Card, Row, Col } from "antd";
import {
    TeamOutlined,
    FileTextOutlined,
    BarChartOutlined,
    SafetyOutlined,
    RocketOutlined,
    CheckCircleOutlined,
} from "@ant-design/icons";

const HomePage = () => {
    const navigate = useNavigate();

    const features = [
        {
            icon: <TeamOutlined style={{ fontSize: 40, color: "#ec4899" }} />,
            title: "Quản lý nhân sự",
            description: "Quản lý thông tin nhân viên một cách dễ dàng và hiệu quả",
        },
        {
            icon: <FileTextOutlined style={{ fontSize: 40, color: "#f472b6" }} />,
            title: "Hồ sơ điện tử",
            description: "Lưu trữ và quản lý hồ sơ nhân viên hoàn toàn số hóa",
        },
        {
            icon: <BarChartOutlined style={{ fontSize: 40, color: "#ec4899" }} />,
            title: "Báo cáo & Thống kê",
            description: "Theo dõi và phân tích dữ liệu nhân sự trực quan",
        },
        {
            icon: <SafetyOutlined style={{ fontSize: 40, color: "#f472b6" }} />,
            title: "Bảo mật cao",
            description: "Đảm bảo an toàn thông tin với công nghệ mã hóa hiện đại",
        },
    ];

    const benefits = [
        "Tiết kiệm thời gian xử lý hồ sơ lên đến 70%",
        "Quản lý tập trung toàn bộ dữ liệu nhân sự",
        "Tự động hóa quy trình nghiệp vụ",
        "Truy cập mọi lúc mọi nơi trên mọi thiết bị",
        "Báo cáo chi tiết và trực quan",
        "Hỗ trợ 24/7 và cập nhật liên tục",
    ];

    return (
        <div style={{ width: "100%" }}>
            {/* Hero Section */}
            <div
                style={{
                    textAlign: "center",
                    padding: "80px 20px",
                    background: "linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(253,242,248,0.95) 100%)",
                    borderRadius: "24px",
                    marginBottom: "60px",
                    position: "relative",
                    overflow: "hidden",
                    boxShadow: "0 8px 32px rgba(236, 72, 153, 0.12)",
                    backdropFilter: "blur(10px)",
                }}
            >
                {/* Decorative circles */}
                <div
                    style={{
                        position: "absolute",
                        top: "-50px",
                        right: "-50px",
                        width: "200px",
                        height: "200px",
                        background: "radial-gradient(circle, rgba(236, 72, 153, 0.1) 0%, transparent 70%)",
                        borderRadius: "50%",
                        pointerEvents: "none",
                    }}
                />
                <div
                    style={{
                        position: "absolute",
                        bottom: "-80px",
                        left: "-80px",
                        width: "250px",
                        height: "250px",
                        background: "radial-gradient(circle, rgba(244, 114, 182, 0.08) 0%, transparent 70%)",
                        borderRadius: "50%",
                        pointerEvents: "none",
                    }}
                />

                <div style={{ position: "relative", zIndex: 1 }}>
                    {/* Logo */}
                    <div
                        style={{
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            marginBottom: "24px",
                        }}
                    >
                        <div
                            style={{
                                width: "80px",
                                height: "80px",
                                background: "linear-gradient(135deg, rgba(236, 72, 153, 0.1) 0%, rgba(244, 114, 182, 0.08) 100%)",
                                borderRadius: "20px",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                padding: "16px",
                                boxShadow: "0 4px 16px rgba(236, 72, 153, 0.15)",
                            }}
                        >
                            <img
                                src="/logo/LOGOFINAL.png"
                                alt="LOTUS HRM"
                                style={{ width: "100%", height: "auto" }}
                            />
                        </div>
                    </div>

                    <h1
                        style={{
                            fontSize: "48px",
                            fontWeight: 800,
                            background: "linear-gradient(135deg, #ec4899 0%, #f472b6 100%)",
                            WebkitBackgroundClip: "text",
                            WebkitTextFillColor: "transparent",
                            backgroundClip: "text",
                            marginBottom: "16px",
                            letterSpacing: "-0.5px",
                        }}
                    >
                        LOTUS HRM
                    </h1>

                    <p
                        style={{
                            fontSize: "20px",
                            color: "#ec4899",
                            marginBottom: "32px",
                            fontWeight: 500,
                            maxWidth: "600px",
                            margin: "0 auto 32px",
                        }}
                    >
                        Hệ thống quản lý nhân sự thông minh & hiện đại
                    </p>

                    <p
                        style={{
                            fontSize: "16px",
                            color: "#666",
                            marginBottom: "40px",
                            lineHeight: 1.6,
                            maxWidth: "700px",
                            margin: "0 auto 40px",
                        }}
                    >
                        Giải pháp quản lý nhân sự toàn diện, giúp doanh nghiệp tối ưu hóa
                        quy trình làm việc và nâng cao hiệu quả quản lý
                    </p>

                    <div
                        style={{
                            display: "flex",
                            gap: "16px",
                            justifyContent: "center",
                            flexWrap: "wrap",
                        }}
                    >
                        <Button
                            type="primary"
                            size="large"
                            icon={<RocketOutlined />}
                            onClick={() => navigate("/login")}
                            style={{
                                height: "48px",
                                padding: "0 40px",
                                fontSize: "16px",
                                fontWeight: 600,
                                background: "linear-gradient(135deg, #ec4899 0%, #f472b6 100%)",
                                border: "none",
                                borderRadius: "12px",
                                boxShadow: "0 4px 16px rgba(236, 72, 153, 0.3)",
                            }}
                        >
                            Đăng nhập ngay
                        </Button>
                        <Button
                            size="large"
                            onClick={() => {
                                // Scroll to features section
                                document.getElementById("features")?.scrollIntoView({ behavior: "smooth" });
                            }}
                            style={{
                                height: "48px",
                                padding: "0 40px",
                                fontSize: "16px",
                                fontWeight: 600,
                                borderRadius: "12px",
                                borderColor: "#ec4899",
                                color: "#ec4899",
                                background: "rgba(255, 255, 255, 0.8)",
                            }}
                        >
                            Tìm hiểu thêm
                        </Button>
                    </div>
                </div>
            </div>

            {/* Features Section */}
            <div id="features" style={{ marginBottom: "60px" }}>
                <h2
                    style={{
                        textAlign: "center",
                        fontSize: "36px",
                        fontWeight: 700,
                        background: "linear-gradient(135deg, #ec4899 0%, #f472b6 100%)",
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                        backgroundClip: "text",
                        marginBottom: "48px",
                    }}
                >
                    Tính năng nổi bật
                </h2>

                <Row gutter={[24, 24]}>
                    {features.map((feature, index) => (
                        <Col xs={24} sm={12} lg={6} key={index}>
                            <Card
                                hoverable
                                style={{
                                    borderRadius: "16px",
                                    border: "1px solid rgba(236, 72, 153, 0.15)",
                                    background: "linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(253,242,248,0.95) 100%)",
                                    boxShadow: "0 4px 16px rgba(236, 72, 153, 0.08)",
                                    height: "100%",
                                    transition: "all 0.3s ease",
                                }}
                                bodyStyle={{
                                    padding: "32px 24px",
                                    textAlign: "center",
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.transform = "translateY(-8px)";
                                    e.currentTarget.style.boxShadow = "0 8px 24px rgba(236, 72, 153, 0.15)";
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.transform = "translateY(0)";
                                    e.currentTarget.style.boxShadow = "0 4px 16px rgba(236, 72, 153, 0.08)";
                                }}
                            >
                                <div
                                    style={{
                                        width: "80px",
                                        height: "80px",
                                        margin: "0 auto 20px",
                                        background: "linear-gradient(135deg, rgba(236, 72, 153, 0.08) 0%, rgba(244, 114, 182, 0.05) 100%)",
                                        borderRadius: "16px",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                    }}
                                >
                                    {feature.icon}
                                </div>
                                <h3
                                    style={{
                                        fontSize: "18px",
                                        fontWeight: 600,
                                        color: "#ec4899",
                                        marginBottom: "12px",
                                    }}
                                >
                                    {feature.title}
                                </h3>
                                <p style={{ fontSize: "14px", color: "#666", margin: 0 }}>
                                    {feature.description}
                                </p>
                            </Card>
                        </Col>
                    ))}
                </Row>
            </div>

            {/* Benefits Section */}
            <div
                style={{
                    background: "linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(253,242,248,0.95) 100%)",
                    borderRadius: "24px",
                    padding: "60px 40px",
                    marginBottom: "60px",
                    boxShadow: "0 8px 32px rgba(236, 72, 153, 0.12)",
                }}
            >
                <h2
                    style={{
                        textAlign: "center",
                        fontSize: "36px",
                        fontWeight: 700,
                        background: "linear-gradient(135deg, #ec4899 0%, #f472b6 100%)",
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                        backgroundClip: "text",
                        marginBottom: "48px",
                    }}
                >
                    Lợi ích khi sử dụng
                </h2>

                <Row gutter={[32, 24]}>
                    {benefits.map((benefit, index) => (
                        <Col xs={24} md={12} key={index}>
                            <div
                                style={{
                                    display: "flex",
                                    alignItems: "flex-start",
                                    gap: "16px",
                                }}
                            >
                                <div
                                    style={{
                                        width: "32px",
                                        height: "32px",
                                        borderRadius: "8px",
                                        background: "linear-gradient(135deg, #ec4899 0%, #f472b6 100%)",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        flexShrink: 0,
                                    }}
                                >
                                    <CheckCircleOutlined
                                        style={{ fontSize: 18, color: "#fff" }}
                                    />
                                </div>
                                <p
                                    style={{
                                        fontSize: "16px",
                                        color: "#333",
                                        margin: 0,
                                        lineHeight: 1.6,
                                    }}
                                >
                                    {benefit}
                                </p>
                            </div>
                        </Col>
                    ))}
                </Row>
            </div>

            {/* CTA Section */}
            <div
                style={{
                    textAlign: "center",
                    padding: "60px 20px",
                    background: "linear-gradient(135deg, #ec4899 0%, #f472b6 100%)",
                    borderRadius: "24px",
                    boxShadow: "0 8px 32px rgba(236, 72, 153, 0.25)",
                }}
            >
                <h2
                    style={{
                        fontSize: "32px",
                        fontWeight: 700,
                        color: "#fff",
                        marginBottom: "16px",
                    }}
                >
                    Sẵn sàng bắt đầu?
                </h2>
                <p
                    style={{
                        fontSize: "16px",
                        color: "rgba(255, 255, 255, 0.9)",
                        marginBottom: "32px",
                        maxWidth: "600px",
                        margin: "0 auto 32px",
                    }}
                >
                    Đăng nhập ngay để trải nghiệm hệ thống quản lý nhân sự hiện đại và chuyên nghiệp
                </p>
                <Button
                    size="large"
                    icon={<RocketOutlined />}
                    onClick={() => navigate("/login")}
                    style={{
                        height: "48px",
                        padding: "0 40px",
                        fontSize: "16px",
                        fontWeight: 600,
                        borderRadius: "12px",
                        background: "#fff",
                        color: "#ec4899",
                        border: "none",
                        boxShadow: "0 4px 16px rgba(0, 0, 0, 0.1)",
                    }}
                >
                    Đăng nhập ngay
                </Button>
            </div>
        </div>
    );
};

export default HomePage;