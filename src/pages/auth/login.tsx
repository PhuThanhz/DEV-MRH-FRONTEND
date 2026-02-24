import { Button, Form, Input, message, notification } from "antd";
import { Link, useLocation } from "react-router-dom";
import { callLogin } from "config/api";
import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { setUserLoginInfo } from "@/redux/slice/accountSlide";
import { useAppSelector } from "@/redux/hooks";
import { LockOutlined, MailOutlined } from "@ant-design/icons";

const LoginPage = () => {
    const [isSubmit, setIsSubmit] = useState(false);
    const dispatch = useDispatch();
    const isAuthenticated = useAppSelector((state) => state.account.isAuthenticated);

    const location = useLocation();
    const params = new URLSearchParams(location.search);
    const callback = params.get("callback");

    useEffect(() => {
        if (isAuthenticated) {
            window.location.href = "/";
        }
    }, [isAuthenticated]);

    const onFinish = async (values: any) => {
        const { username, password } = values;
        setIsSubmit(true);

        const res = await callLogin(username, password);

        setIsSubmit(false);

        if (res?.data) {
            localStorage.setItem("access_token", res.data.access_token);
            dispatch(setUserLoginInfo(res.data.user));
            message.success("Đăng nhập tài khoản thành công!");
            window.location.href = callback || "/";
        } else {
            notification.error({
                message: "Có lỗi xảy ra",
                description: Array.isArray(res?.message) ? res.message[0] : res?.message,
                duration: 5,
            });
        }
    };

    return (
        <div
            style={{
                minHeight: "100vh",
                display: "flex",
                background: "#f9fafb",
            }}
        >
            {/* LEFT SIDE */}
            <div
                style={{
                    flex: 1,
                    background: "linear-gradient(135deg, #fff 0%, #fdf2f8 50%, #fce7f3 100%)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "80px 60px",
                    position: "relative",
                }}
                className="login-left-side"
            >
                <div
                    className="brand-container"
                    style={{
                        width: "100%",
                        maxWidth: "480px",
                        textAlign: "center",
                        position: "relative",
                        zIndex: 10,
                    }}
                >
                    {/* Logo */}
                    <div
                        style={{
                            marginBottom: "48px",
                            display: "inline-block",
                        }}
                    >
                        <div
                            style={{
                                width: "160px",
                                height: "160px",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                background: "rgba(255, 255, 255, 0.9)",
                                backdropFilter: "blur(20px)",
                                borderRadius: "50%",
                                padding: "24px",
                                boxShadow: "0 10px 40px rgba(236, 72, 153, 0.25)",
                                border: "2px solid rgba(255, 255, 255, 0.6)",
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
                    </div>

                    {/* HRM text */}
                    <h1
                        style={{
                            background: "linear-gradient(135deg, #ec4899 0%, #f472b6 100%)",
                            WebkitBackgroundClip: "text",
                            WebkitTextFillColor: "transparent",
                            fontSize: "80px",
                            fontWeight: 900,
                            letterSpacing: "6px",
                            lineHeight: 1.1,
                            marginBottom: "48px",
                        }}
                    >
                        HRM
                    </h1>

                    <div
                        style={{
                            width: "150px",
                            height: "3px",
                            background: "linear-gradient(90deg, transparent 0%, #ec4899 50%, transparent 100%)",
                            borderRadius: "2px",
                            margin: "0 auto",
                            boxShadow: "0 0 10px rgba(236, 72, 153, 0.3)",
                        }}
                    />
                </div>
            </div>

            {/* RIGHT SIDE - Form */}
            <div
                style={{
                    flex: 1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "60px 40px",
                    background: "#ffffff",
                }}
            >
                <div
                    style={{
                        width: "100%",
                        maxWidth: "420px",
                    }}
                >
                    <div
                        style={{
                            background: "rgba(255, 255, 255, 0.7)",
                            backdropFilter: "blur(30px)",
                            borderRadius: "24px",
                            padding: "48px 40px",
                            boxShadow: "0 8px 32px rgba(0, 0, 0, 0.06)",
                            border: "1px solid rgba(255, 255, 255, 0.4)",
                        }}
                    >
                        <div style={{ marginBottom: "40px" }}>
                            <h2
                                style={{
                                    fontSize: "32px",
                                    fontWeight: 700,
                                    color: "#111827",
                                    marginBottom: "8px",
                                }}
                            >
                                Đăng nhập
                            </h2>
                            <p style={{ fontSize: "16px", color: "#6b7280" }}>
                                Nhập thông tin tài khoản của bạn
                            </p>
                        </div>

                        <Form layout="vertical" onFinish={onFinish}>
                            <Form.Item
                                label={<span style={{ fontWeight: 600, color: "#374151" }}>Email</span>}
                                name="username"
                                rules={[{ required: true, message: "Email không được để trống!" }]}
                            >
                                <Input
                                    prefix={<MailOutlined style={{ color: "#ec4899" }} />}
                                    placeholder="email@congty.com"
                                    size="large"
                                    style={{
                                        borderRadius: "12px",
                                        height: "52px",
                                        background: "rgba(255, 255, 255, 0.8)",
                                        border: "1px solid rgba(236, 72, 153, 0.2)",
                                    }}
                                />
                            </Form.Item>

                            <Form.Item
                                label={<span style={{ fontWeight: 600, color: "#374151" }}>Mật khẩu</span>}
                                name="password"
                                rules={[{ required: true, message: "Mật khẩu không được để trống!" }]}
                            >
                                <Input.Password
                                    prefix={<LockOutlined style={{ color: "#ec4899" }} />}
                                    placeholder="••••••••"
                                    size="large"
                                    style={{
                                        borderRadius: "12px",
                                        height: "52px",
                                        background: "rgba(255, 255, 255, 0.8)",
                                        border: "1px solid rgba(236, 72, 153, 0.2)",
                                    }}
                                />
                            </Form.Item>

                            <div style={{ textAlign: "right", marginBottom: "24px" }}>
                                <Link
                                    to="/forgot-password"
                                    style={{
                                        color: "#ec4899",
                                        fontWeight: 500,
                                    }}
                                >
                                    Quên mật khẩu?
                                </Link>
                            </div>

                            <Form.Item>
                                <Button
                                    type="primary"
                                    htmlType="submit"
                                    loading={isSubmit}
                                    block
                                    size="large"
                                    style={{
                                        height: "52px",
                                        borderRadius: "12px",
                                        background: "linear-gradient(135deg, #ec4899 0%, #f472b6 100%)",
                                        border: "none",
                                        fontSize: "16px",
                                        fontWeight: 600,
                                        boxShadow: "0 4px 20px rgba(236, 72, 153, 0.3)",
                                    }}
                                >
                                    Đăng nhập
                                </Button>
                            </Form.Item>
                        </Form>
                    </div>
                </div>
            </div>

            {/* CSS override focus xanh + responsive */}
            <style>{`
                @media (max-width: 1024px) {
                    .login-left-side { display: none !important; }
                }

                /* Fix viền xanh focus của browser & Antd */
                *:focus-visible {
                    outline: none !important;
                }

                .ant-input:focus,
                .ant-input-affix-wrapper:focus,
                .ant-input-affix-wrapper-focused,
                .ant-input-password .ant-input:focus,
                .ant-input-affix-wrapper-focused .ant-input {
                    border-color: #ec4899 !important;
                    box-shadow: 0 0 0 3px rgba(236, 72, 153, 0.15) !important;
                    outline: none !important;
                }

                .ant-input-affix-wrapper-focused,
                .ant-input-affix-wrapper:focus {
                    box-shadow: 0 0 0 3px rgba(236, 72, 153, 0.15) !important;
                }

                /* Hover button */
                .ant-btn-primary:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 6px 28px rgba(236, 72, 153, 0.4) !important;
                }

                a:hover {
                    color: #db2777 !important;
                    text-decoration: underline;
                }
            `}</style>
        </div>
    );
};

export default LoginPage;