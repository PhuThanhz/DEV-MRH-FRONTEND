import { Button, Form, Input, message, notification } from "antd";
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { MailOutlined } from "@ant-design/icons";
// import { callForgotPassword } from "config/api";  // uncomment khi có API thật

const ForgotPassword = () => {
    const [isSubmit, setIsSubmit] = useState(false);
    const navigate = useNavigate();

    const onFinish = async (values: { email: string }) => {
        const { email } = values;
        setIsSubmit(true);

        try {
            // const res = await callForgotPassword(email);
            // Giả lập delay API
            await new Promise((resolve) => setTimeout(resolve, 1400));

            // Thông báo thành công
            message.success({
                content: "Hướng dẫn khôi phục mật khẩu đã được gửi đến email của bạn. Vui lòng kiểm tra hộp thư (và cả thư rác nhé)!",
                duration: 5,
            });

            // Tự động chuyển về trang đăng nhập sau 3 giây
            setTimeout(() => {
                navigate("/login");
            }, 3000);
        } catch (error: any) {
            notification.error({
                message: "Gửi thất bại",
                description:
                    error?.message ||
                    "Không thể gửi email lúc này. Vui lòng thử lại sau hoặc liên hệ hỗ trợ.",
                duration: 5,
            });
        } finally {
            setIsSubmit(false);
        }
    };

    return (
        <div className="login-root">
            {/* LEFT - giữ nguyên y chang Login */}
            <div className="login-left">
                <svg
                    className="geo-svg"
                    viewBox="0 0 700 900"
                    preserveAspectRatio="xMidYMid slice"
                >
                    <circle
                        cx="680"
                        cy="-60"
                        r="340"
                        fill="none"
                        stroke="rgba(255,255,255,0.1)"
                        strokeWidth="1"
                    />
                    <circle
                        cx="680"
                        cy="-60"
                        r="500"
                        fill="none"
                        stroke="rgba(255,255,255,0.06)"
                        strokeWidth="1"
                    />
                    <circle
                        cx="20"
                        cy="960"
                        r="340"
                        fill="none"
                        stroke="rgba(255,255,255,0.08)"
                        strokeWidth="1"
                    />
                    <circle
                        cx="20"
                        cy="960"
                        r="500"
                        fill="none"
                        stroke="rgba(255,255,255,0.05)"
                        strokeWidth="1"
                    />
                    <polygon
                        points="-20,640 400,-20 700,-20 700,140 280,900 -20,900"
                        fill="rgba(255,255,255,0.035)"
                    />
                    <rect
                        x="600"
                        y="740"
                        width="14"
                        height="14"
                        fill="rgba(255,255,255,0.18)"
                        transform="rotate(45 607 747)"
                    />
                    <rect
                        x="55"
                        y="75"
                        width="9"
                        height="9"
                        fill="rgba(255,255,255,0.13)"
                        transform="rotate(45 59 79)"
                    />
                    <rect
                        x="630"
                        y="290"
                        width="6"
                        height="6"
                        fill="rgba(255,255,255,0.16)"
                        transform="rotate(45 633 293)"
                    />
                </svg>

                <div className="left-content">
                    <div className="logo-ring-outer">
                        <div className="logo-ring-inner">
                            <div className="logo-circle">
                                <img
                                    src="/logo/LOGOFINAL.png"
                                    alt="LOTUS HRM"
                                    className="logo-img"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="hrm-block">
                        <span className="hrm-letter" style={{ animationDelay: "0.05s" }}>
                            H
                        </span>
                        <span className="hrm-letter" style={{ animationDelay: "0.12s" }}>
                            R
                        </span>
                        <span className="hrm-letter" style={{ animationDelay: "0.19s" }}>
                            M
                        </span>
                    </div>
                </div>
            </div>

            {/* RIGHT - Form Quên mật khẩu */}
            <div className="login-right">
                <div className="form-container">
                    <div className="form-brand">
                        <div className="brand-dot" />
                        <span className="brand-name">Lotus HRM</span>
                    </div>

                    <div className="form-heading" style={{ marginBottom: 48 }}>
                        <h2 className="form-title">Quên mật khẩu?</h2>
                    </div>

                    <Form
                        layout="vertical"
                        onFinish={onFinish}
                        className="the-form"
                        initialValues={{ email: "" }}
                    >
                        <Form.Item
                            label={<span className="f-label">Email đăng nhập</span>}
                            name="email"
                            rules={[
                                { required: true, message: "Email không được để trống!" },
                                { type: "email", message: "Email không đúng định dạng!" },
                            ]}
                        >
                            <Input
                                prefix={<MailOutlined className="input-icon" />}
                                placeholder="email@lotusgroup.com.vn"
                                size="large"
                                className="login-input"
                            />
                        </Form.Item>

                        <Form.Item style={{ marginBottom: 0 }}>
                            <Button
                                type="primary"
                                htmlType="submit"
                                loading={isSubmit}
                                block
                                size="large"
                                className="submit-btn"
                            >
                                Gửi hướng dẫn khôi phục
                            </Button>
                        </Form.Item>
                    </Form>

                    <div className="form-footer">
                        <Link to="/login" className="back-to-login">
                            ← Quay lại trang đăng nhập
                        </Link>
                        <div className="copyright">© 2026 Lotus HRM · By Team TEC.</div>
                    </div>
                </div>
            </div>

            {/* STYLE - giữ nguyên đẹp xịn */}
            <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Inter:wght@400;500;600&family=Playfair+Display:wght@600;700&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .login-root {
          min-height: 100vh;
          display: flex;
          font-family: 'Inter', sans-serif;
        }

        .login-left {
          flex: 1;
          position: relative;
          background: linear-gradient(150deg, #f472b6 0%, #ec4899 45%, #db2777 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
        }

        .geo-svg {
          position: absolute;
          inset: 0;
          width: 100%; height: 100%;
          pointer-events: none;
        }

        .left-content {
          position: relative;
          z-index: 10;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 36px;
          animation: fadeUp 0.7s cubic-bezier(0.22,1,0.36,1) both;
        }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        .logo-ring-outer {
          width: 196px; height: 196px;
          border-radius: 50%;
          border: 1px solid rgba(255,255,255,0.22);
          display: flex; align-items: center; justify-content: center;
        }
        .logo-ring-inner {
          width: 168px; height: 168px;
          border-radius: 50%;
          border: 1px solid rgba(255,255,255,0.15);
          display: flex; align-items: center; justify-content: center;
        }
        .logo-circle {
          width: 136px; height: 136px;
          border-radius: 50%;
          background: rgba(255,255,255,0.14);
          backdrop-filter: blur(16px);
          border: 1.5px solid rgba(255,255,255,0.45);
          box-shadow: 0 0 0 5px rgba(255,255,255,0.07), 0 20px 50px rgba(190,24,93,0.25);
          display: flex; align-items: center; justify-content: center;
          padding: 20px;
        }
        .logo-img {
          width: 100%; height: auto;
          object-fit: contain;
          filter: brightness(0) invert(1);
        }

        .hrm-block {
          display: flex;
          align-items: flex-end;
        }
        .hrm-letter {
          font-family: 'Bebas Neue', sans-serif;
          font-size: 156px;
          line-height: 0.9;
          color: #fff;
          letter-spacing: 6px;
          text-shadow: 0 8px 40px rgba(190,24,93,0.25);
          animation: letterDrop 0.55s cubic-bezier(0.22,1,0.36,1) both;
        }

        @keyframes letterDrop {
          from { opacity: 0; transform: translateY(-16px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        .login-right {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 60px 48px;
          background: #ffffff;
          position: relative;
        }

        .login-right::before {
          content: '';
          position: absolute;
          left: 0; top: 12%; bottom: 12%;
          width: 1px;
          background: linear-gradient(180deg, transparent, #fce7f3 30%, #f9a8d4 50%, #fce7f3 70%, transparent);
        }

        .form-container {
          width: 100%;
          max-width: 400px;
          animation: slideUp 0.6s cubic-bezier(0.22,1,0.36,1) 0.08s both;
        }

        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        .form-brand {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 40px;
        }
        .brand-dot {
          width: 8px; height: 8px;
          border-radius: 50%;
          background: #ec4899;
        }
        .brand-name {
          font-size: 13px;
          font-weight: 600;
          color: #9ca3af;
          letter-spacing: 0.5px;
          text-transform: uppercase;
        }

        .form-heading { margin-bottom: 48px; }

        .form-title {
          font-family: 'Playfair Display', serif;
          font-size: 36px;
          font-weight: 700;
          color: #111827;
          letter-spacing: -0.5px;
          margin-bottom: 0;
          line-height: 1.15;
        }

        .f-label {
          font-size: 12px;
          font-weight: 600;
          color: #374151;
          letter-spacing: 0.4px;
        }

        .login-input {
          border-radius: 10px !important;
          height: 48px !important;
          border-color: #e5e7eb !important;
          background: #fafafa !important;
          font-size: 14px !important;
          font-family: 'Inter', sans-serif !important;
          color: #111827 !important;
          transition: all 0.18s ease !important;
        }
        .login-input:hover {
          border-color: #f9a8d4 !important;
          background: #fff !important;
        }
        .input-icon {
          color: #d1d5db !important;
          font-size: 14px !important;
          transition: color 0.18s !important;
        }

        .back-to-login {
          display: block;
          text-align: center;
          margin: 28px 0 20px;
          font-size: 14px;
          font-weight: 500;
          color: #ec4899;
          text-decoration: none;
          transition: all 0.22s ease;
        }
        .back-to-login:hover {
          color: #be185d;
          transform: translateX(-6px);
        }

        .submit-btn {
          height: 50px !important;
          border-radius: 10px !important;
          background: linear-gradient(135deg, #ec4899 0%, #db2777 100%) !important;
          border: none !important;
          font-family: 'Inter', sans-serif !important;
          font-size: 15px !important;
          font-weight: 600 !important;
          letter-spacing: 0.3px !important;
          transition: all 0.25s ease !important;
          box-shadow: 0 4px 16px rgba(236,72,153,0.3) !important;
        }
        .submit-btn:hover {
          transform: translateY(-2px) !important;
          box-shadow: 0 10px 30px rgba(236,72,153,0.45) !important;
          filter: brightness(1.05) !important;
        }

        .form-footer {
          text-align: center;
          margin-top: 32px;
          font-size: 12px;
          color: #d1d5db;
        }
        .copyright {
          margin-top: 12px;
          font-size: 11.5px;
          color: #d1d5db;
          font-weight: 400;
        }

        .ant-form-item { margin-bottom: 20px !important; }
        .ant-form-item-label { padding-bottom: 6px !important; }

        .ant-input-affix-wrapper:focus,
        .ant-input-affix-wrapper-focused {
          border-color: #ec4899 !important;
          box-shadow: 0 0 0 3px rgba(236,72,153,0.12) !important;
          background: #fff !important;
        }
        .ant-input-affix-wrapper-focused .input-icon { color: #ec4899 !important; }

        *:focus-visible { outline: none !important; }

        @media (max-width: 1024px) {
          .login-left { display: none; }
          .login-right { flex: 1; }
          .login-right::before { display: none; }
        }
        @media (max-width: 480px) {
          .login-right { padding: 40px 24px; }
          .form-title { font-size: 32px; }
        }
      `}</style>
        </div>
    );
};

export default ForgotPassword;