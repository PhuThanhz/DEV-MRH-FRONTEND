import { Button, Form, Input, message, notification } from "antd";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useState, useEffect } from "react";
import { KeyOutlined, LockOutlined } from "@ant-design/icons";
import { callConfirmResetPassword } from "config/api";

const ConfirmResetPassword = () => {
    const [isSubmit, setIsSubmit] = useState(false);
    const [countdown, setCountdown] = useState(600); // 10 phút
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const email = searchParams.get("email") || "";
    const mode = searchParams.get("mode") || "reset";

    // Đếm ngược
    useEffect(() => {
        if (countdown <= 0) return;
        const timer = setInterval(() => {
            setCountdown((prev) => prev - 1);
        }, 1000);
        return () => clearInterval(timer);
    }, [countdown]);

    const minutes = String(Math.floor(countdown / 60)).padStart(2, "0");
    const seconds = String(countdown % 60).padStart(2, "0");
    const isExpired = countdown <= 0;

    const onFinish = async (values: { code: string; newPassword: string; confirmPassword: string }) => {
        const { code, newPassword, confirmPassword } = values;

        setIsSubmit(true);
        try {
            const res = await callConfirmResetPassword(email, code, newPassword);
            if (res?.data?.success) {
                message.success({
                    content:
                        mode === "activate"
                            ? "Kích hoạt tài khoản thành công! Đang chuyển về đăng nhập..."
                            : "Đặt mật khẩu thành công! Đang chuyển về đăng nhập...", duration: 3,
                });
                setTimeout(() => navigate("/login"), 2500);
            }
        } catch (error: any) {
            notification.error({
                message: "Xác nhận thất bại",
                description: error?.message || "Mã xác nhận không đúng hoặc đã hết hạn.",
                duration: 5,
            });
        } finally {
            setIsSubmit(false);
        }
    };

    return (
        <div className="cr-root">
            {/* LEFT */}
            <div className="cr-left">
                <svg className="geo-svg" viewBox="0 0 700 900" preserveAspectRatio="xMidYMid slice">
                    <circle cx="680" cy="-60" r="340" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
                    <circle cx="680" cy="-60" r="500" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
                    <circle cx="20" cy="960" r="340" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
                    <circle cx="20" cy="960" r="500" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
                    <polygon points="-20,640 400,-20 700,-20 700,140 280,900 -20,900" fill="rgba(255,255,255,0.035)" />
                    <rect x="600" y="740" width="14" height="14" fill="rgba(255,255,255,0.18)" transform="rotate(45 607 747)" />
                    <rect x="55" y="75" width="9" height="9" fill="rgba(255,255,255,0.13)" transform="rotate(45 59 79)" />
                    <rect x="630" y="290" width="6" height="6" fill="rgba(255,255,255,0.16)" transform="rotate(45 633 293)" />
                </svg>
                <div className="cr-left-content">
                    <div className="cr-logo-outer">
                        <div className="cr-logo-inner">
                            <div className="cr-logo-circle">
                                <img src="/logo/LOGOFINAL.png" alt="LOTUS HRM" className="cr-logo-img" />
                            </div>
                        </div>
                    </div>
                    <div className="cr-hrm-block">
                        <span className="cr-hrm-letter" style={{ animationDelay: "0.05s" }}>H</span>
                        <span className="cr-hrm-letter" style={{ animationDelay: "0.12s" }}>R</span>
                        <span className="cr-hrm-letter" style={{ animationDelay: "0.19s" }}>M</span>
                    </div>
                </div>
            </div>

            {/* RIGHT */}
            <div className="cr-right">
                <div className="cr-card">

                    {/* Brand */}
                    <div className="cr-brand">
                        <div className="cr-brand-dot" />
                        <span className="cr-brand-name">Lotus HRM</span>
                    </div>

                    {/* Heading */}
                    <div className="cr-heading">
                        <h2 className="cr-title">
                            {mode === "activate" ? "Kích hoạt tài khoản" : "Đặt lại mật khẩu"}
                        </h2>
                        <p className="cr-sub">
                            Mã đã được gửi đến{" "}
                            <strong style={{ color: "#ec4899" }}>{email}</strong>
                        </p>
                    </div>

                    {/* Countdown */}
                    <div className={`cr-timer ${isExpired ? "expired" : countdown <= 60 ? "warning" : ""}`}>
                        {isExpired ? (
                            <span>⏰ Mã đã hết hạn —{" "}
                                <Link to="/forgot-password" className="cr-resend-inline">Gửi lại</Link>
                            </span>
                        ) : (
                            <span>⏱ Mã có hiệu lực trong <b>{minutes}:{seconds}</b></span>
                        )}
                    </div>

                    {/* Form */}
                    <Form layout="vertical" onFinish={onFinish}>
                        <Form.Item
                            label={<span className="cr-label">Mã xác nhận</span>}
                            name="code"
                            rules={[
                                { required: true, message: "Vui lòng nhập mã xác nhận!" },
                                { len: 6, message: "Mã xác nhận phải đúng 6 ký tự!" }, { pattern: /^\d+$/, message: "Mã chỉ được chứa số!" },
                            ]}
                        >
                            <Input
                                placeholder="······" size="large"
                                maxLength={6} className="cr-input cr-code-input"
                                disabled={isExpired}
                            />
                        </Form.Item>

                        <Form.Item
                            label={
                                <span className="cr-label">
                                    {mode === "activate" ? "Thiết lập mật khẩu" : "Mật khẩu mới"}
                                </span>
                            }
                            name="newPassword"
                            rules={[
                                { required: true, message: "Vui lòng nhập mật khẩu mới!" },
                                { min: 6, message: "Mật khẩu phải có ít nhất 6 ký tự!" },
                            ]}
                        >
                            <Input.Password
                                prefix={<LockOutlined className="cr-icon" />}
                                placeholder="••••••••"
                                size="large"
                                className="cr-input"
                                disabled={isExpired}
                            />
                        </Form.Item>

                        <Form.Item
                            label={
                                <span className="cr-label">
                                    {mode === "activate" ? "Xác nhận mật khẩu" : "Nhập lại mật khẩu"}
                                </span>
                            }
                            name="confirmPassword"
                            rules={[
                                {
                                    required: true, message: mode === "activate"
                                        ? "Vui lòng xác nhận mật khẩu!"
                                        : "Vui lòng nhập lại mật khẩu!"
                                },
                                ({ getFieldValue }) => ({
                                    validator(_, value) {
                                        if (!value || getFieldValue("newPassword") === value) {
                                            return Promise.resolve();
                                        }
                                        return Promise.reject(new Error("Mật khẩu không khớp!"));
                                    },
                                }),
                            ]}
                        >
                            <Input.Password
                                prefix={<KeyOutlined className="cr-icon" />}
                                placeholder="••••••••"
                                size="large"
                                className="cr-input"
                                disabled={isExpired}
                            />
                        </Form.Item>

                        <Form.Item style={{ marginBottom: 0 }}>
                            <Button
                                type="primary"
                                htmlType="submit"
                                loading={isSubmit}
                                disabled={isExpired}
                                block
                                size="large"
                                className="cr-btn"
                            >
                                Xác nhận & Đặt mật khẩu
                            </Button>
                        </Form.Item>
                    </Form>

                    {/* Resend */}
                    {!isExpired && (
                        <p className="cr-resend">
                            Không nhận được mã?{" "}
                            <Link to="/forgot-password" className="cr-resend-link">
                                Gửi lại
                            </Link>
                        </p>
                    )}

                    {/* Footer */}
                    <div className="cr-footer">
                        <Link to="/login" className="cr-back">← Quay lại đăng nhập</Link>
                        <p className="cr-copy">© 2026 Lotus HRM · By Team TEC.</p>
                    </div>
                </div>
            </div>

            <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Inter:wght@400;500;600&family=Playfair+Display:wght@600;700&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .cr-root { min-height: 100vh; display: flex; font-family: 'Inter', sans-serif; }

        /* LEFT */
        .cr-left {
          flex: 1; position: relative;
          background: linear-gradient(150deg, #f472b6 0%, #ec4899 45%, #db2777 100%);
          display: flex; align-items: center; justify-content: center; overflow: hidden;
        }
        .geo-svg { position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none; }
        .cr-left-content {
          position: relative; z-index: 10;
          display: flex; flex-direction: column; align-items: center; gap: 36px;
          animation: fadeUp 0.7s cubic-bezier(0.22,1,0.36,1) both;
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .cr-logo-outer { width: 196px; height: 196px; border-radius: 50%; border: 1px solid rgba(255,255,255,0.22); display: flex; align-items: center; justify-content: center; }
        .cr-logo-inner { width: 168px; height: 168px; border-radius: 50%; border: 1px solid rgba(255,255,255,0.15); display: flex; align-items: center; justify-content: center; }
        .cr-logo-circle {
          width: 136px; height: 136px; border-radius: 50%;
          background: rgba(255,255,255,0.14); backdrop-filter: blur(16px);
          border: 1.5px solid rgba(255,255,255,0.45);
          box-shadow: 0 0 0 5px rgba(255,255,255,0.07), 0 20px 50px rgba(190,24,93,0.25);
          display: flex; align-items: center; justify-content: center; padding: 20px;
        }
        .cr-logo-img { width: 100%; height: auto; object-fit: contain; filter: brightness(0) invert(1); }
        .cr-hrm-block { display: flex; align-items: flex-end; }
        .cr-hrm-letter {
          font-family: 'Bebas Neue', sans-serif; font-size: 156px; line-height: 0.9;
          color: #fff; letter-spacing: 6px; text-shadow: 0 8px 40px rgba(190,24,93,0.25);
          animation: letterDrop 0.55s cubic-bezier(0.22,1,0.36,1) both;
        }
        @keyframes letterDrop {
          from { opacity: 0; transform: translateY(-16px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        /* RIGHT */
        .cr-right {
          flex: 1; display: flex; align-items: center; justify-content: center;
          padding: 60px 48px; background: #fff; position: relative; overflow-y: auto;
        }
        .cr-right::before {
          content: ''; position: absolute; left: 0; top: 12%; bottom: 12%; width: 1px;
          background: linear-gradient(180deg, transparent, #fce7f3 30%, #f9a8d4 50%, #fce7f3 70%, transparent);
        }
        .cr-card { width: 100%; max-width: 420px; animation: slideUp 0.6s cubic-bezier(0.22,1,0.36,1) 0.08s both; }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        .cr-brand { display: flex; align-items: center; gap: 8px; margin-bottom: 40px; }
        .cr-brand-dot { width: 8px; height: 8px; border-radius: 50%; background: #ec4899; }
        .cr-brand-name { font-size: 13px; font-weight: 600; color: #9ca3af; letter-spacing: 0.5px; text-transform: uppercase; }

        .cr-heading { margin-bottom: 20px; }
        .cr-title { font-family: 'Playfair Display', serif; font-size: 32px; font-weight: 700; color: #111827; letter-spacing: -0.5px; margin-bottom: 8px; line-height: 1.2; }
        .cr-sub { font-size: 14px; color: #6b7280; line-height: 1.6; }

        /* Timer */
        .cr-timer {
          display: inline-flex; align-items: center;
          font-size: 13px; color: #6b7280;
          background: #f9fafb; border: 1px solid #e5e7eb;
          border-radius: 8px; padding: 8px 14px;
          margin-bottom: 24px;
        }
        .cr-timer.warning { color: #d97706; background: #fffbeb; border-color: #fcd34d; }
        .cr-timer.expired { color: #dc2626; background: #fef2f2; border-color: #fca5a5; }
        .cr-resend-inline { color: #ec4899 !important; font-weight: 600; text-decoration: none; margin-left: 4px; }

        .cr-label { font-size: 12px; font-weight: 600; color: #374151; letter-spacing: 0.4px; }
        .cr-input {
          border-radius: 10px !important; height: 48px !important;
          border-color: #e5e7eb !important; background: #fafafa !important;
          font-size: 14px !important; font-family: 'Inter', sans-serif !important;
          color: #111827 !important; transition: all 0.18s ease !important;
        }
        .cr-input:hover { border-color: #f9a8d4 !important; background: #fff !important; }
        .cr-code-input { font-size: 24px !important; font-weight: 700 !important; letter-spacing: 8px !important; text-align: center !important; color: #db2777 !important; }
        .cr-icon { color: #d1d5db !important; font-size: 14px !important; }

        .cr-btn {
          height: 50px !important; border-radius: 10px !important;
          background: linear-gradient(135deg, #ec4899 0%, #db2777 100%) !important;
          border: none !important; font-family: 'Inter', sans-serif !important;
          font-size: 15px !important; font-weight: 600 !important;
          transition: all 0.25s ease !important;
          box-shadow: 0 4px 16px rgba(236,72,153,0.3) !important;
        }
        .cr-btn:hover:not(:disabled) { transform: translateY(-2px) !important; box-shadow: 0 10px 30px rgba(236,72,153,0.45) !important; }
        .cr-btn:disabled { opacity: 0.5 !important; cursor: not-allowed !important; }

        .cr-resend { margin-top: 20px; text-align: center; font-size: 13px; color: #9ca3af; }
        .cr-resend-link { color: #ec4899 !important; font-weight: 500; text-decoration: none; border-bottom: 1px solid #fbb6ce; padding-bottom: 1px; }
        .cr-resend-link:hover { color: #be185d !important; }

        .cr-footer { margin-top: 28px; text-align: center; }
        .cr-back { display: inline-block; font-size: 14px; font-weight: 500; color: #ec4899; text-decoration: none; transition: all 0.22s; }
        .cr-back:hover { color: #be185d; }
        .cr-copy { margin-top: 12px; font-size: 11.5px; color: #d1d5db; }

        .ant-form-item { margin-bottom: 20px !important; }
        .ant-form-item-label { padding-bottom: 6px !important; }
        .ant-input-affix-wrapper:focus,
        .ant-input-affix-wrapper-focused { border-color: #ec4899 !important; box-shadow: 0 0 0 3px rgba(236,72,153,0.12) !important; background: #fff !important; }
        .ant-input-affix-wrapper-focused .cr-icon { color: #ec4899 !important; }
        *:focus-visible { outline: none !important; }

        @media (max-width: 1024px) {
          .cr-left { display: none; }
          .cr-right { flex: 1; }
          .cr-right::before { display: none; }
        }
        @media (max-width: 480px) {
          .cr-right { padding: 40px 24px; }
          .cr-title { font-size: 26px; }
        }
      `}</style>
        </div>
    );
};

export default ConfirmResetPassword;