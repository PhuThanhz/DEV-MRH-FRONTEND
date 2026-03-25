import { Button, Form, Input, message, notification } from "antd";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useState } from "react";
import { MailOutlined, SafetyCertificateOutlined, KeyOutlined } from "@ant-design/icons";
import { callRequestPasswordCode } from "config/api";

const ForgotPassword = () => {
  const [isSubmit, setIsSubmit] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Đọc ?mode=activate hoặc mặc định là reset
  const mode = new URLSearchParams(location.search).get("mode") === "activate" ? "activate" : "reset";

  const content = {
    activate: {
      icon: <SafetyCertificateOutlined className="ap-icon" />,
      iconClass: "ap-icon-wrap activate",
      title: "Kích hoạt tài khoản",
      sub: "Nhập địa chỉ email được cấp để nhận mã xác nhận và thiết lập mật khẩu lần đầu.",
      btnText: "Gửi mã kích hoạt",
      successMsg: "Mã kích hoạt đã được gửi đến email của bạn!",
    },
    reset: {
      icon: <KeyOutlined className="ap-icon" />,
      iconClass: "ap-icon-wrap reset",
      title: "Quên mật khẩu?",
      sub: "Nhập địa chỉ email đã đăng ký để nhận mã xác nhận và đặt lại mật khẩu.",
      btnText: "Gửi mã xác nhận",
      successMsg: "Mã xác nhận đã được gửi đến email của bạn!",
    },
  }[mode];

  const onFinish = async (values: { email: string }) => {
    const { email } = values;
    setIsSubmit(true);
    try {
      const res = await callRequestPasswordCode(email);

      if (res?.data?.success) {
        const realMode = res.data.mode;

        message.success({
          content:
            realMode === "activate"
              ? "Tài khoản chưa kích hoạt. Vui lòng kiểm tra email!"
              : "Mã đặt lại mật khẩu đã được gửi!",
          duration: 4,
        });

        navigate(
          `/confirm-reset-password?email=${encodeURIComponent(email)}&mode=${realMode}`
        );
      }
    } catch (error: any) {
      notification.error({
        message: "Gửi thất bại",
        description: error?.message || "Không thể gửi email lúc này. Vui lòng thử lại sau.",
        duration: 5,
      });
    } finally {
      setIsSubmit(false);
    }
  };

  return (
    <div className="ap-root">
      {/* LEFT */}
      <div className="ap-left">
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
        <div className="ap-left-content">
          <div className="ap-logo-outer">
            <div className="ap-logo-inner">
              <div className="ap-logo-circle">
                <img src="/logo/LOGOFINAL.png" alt="LOTUS HRM" className="ap-logo-img" />
              </div>
            </div>
          </div>
          <div className="ap-hrm-block">
            <span className="ap-hrm-letter" style={{ animationDelay: "0.05s" }}>H</span>
            <span className="ap-hrm-letter" style={{ animationDelay: "0.12s" }}>R</span>
            <span className="ap-hrm-letter" style={{ animationDelay: "0.19s" }}>M</span>
          </div>
        </div>
      </div>

      {/* RIGHT */}
      <div className="ap-right">
        <div className="ap-card">

          {/* Brand */}
          <div className="ap-brand">
            <div className="ap-brand-dot" />
            <span className="ap-brand-name">Lotus HRM</span>
          </div>

          {/* Icon + Heading — dynamic theo mode */}
          <div className="ap-heading">
            <div className={content.iconClass}>
              {content.icon}
            </div>
            <h2 className="ap-title">{content.title}</h2>
            <p className="ap-sub">{content.sub}</p>
          </div>

          {/* Form */}
          <Form layout="vertical" onFinish={onFinish}>
            <Form.Item
              label={<span className="ap-label">Email đăng nhập</span>}
              name="email"
              rules={[
                { required: true, message: "Email không được để trống!" },
                { type: "email", message: "Email không đúng định dạng!" },
              ]}
            >
              <Input
                prefix={<MailOutlined className="ap-input-icon" />}
                placeholder="email@lotusgroup.com.vn"
                size="large"
                className="ap-input"
              />
            </Form.Item>

            <Form.Item style={{ marginBottom: 0, marginTop: 8 }}>
              <Button
                type="primary"
                htmlType="submit"
                loading={isSubmit}
                block
                size="large"
                className="ap-btn"
              >
                {content.btnText}
              </Button>
            </Form.Item>
          </Form>

          {/* Footer */}
          <div className="ap-footer">
            <Link to="/login" className="ap-back">
              ← Quay lại trang đăng nhập
            </Link>
            <p className="ap-copy">© 2026 Lotus HRM · By Team TEC.</p>
          </div>
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Inter:wght@400;500;600&family=Playfair+Display:wght@600;700&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .ap-root { min-height: 100vh; display: flex; font-family: 'Inter', sans-serif; }

        /* ── LEFT ── */
        .ap-left {
          flex: 1; position: relative;
          background: linear-gradient(150deg, #f472b6 0%, #ec4899 45%, #db2777 100%);
          display: flex; align-items: center; justify-content: center; overflow: hidden;
        }
        .geo-svg { position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none; }
        .ap-left-content {
          position: relative; z-index: 10;
          display: flex; flex-direction: column; align-items: center; gap: 36px;
          animation: fadeUp 0.7s cubic-bezier(0.22,1,0.36,1) both;
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .ap-logo-outer { width: 196px; height: 196px; border-radius: 50%; border: 1px solid rgba(255,255,255,0.22); display: flex; align-items: center; justify-content: center; }
        .ap-logo-inner { width: 168px; height: 168px; border-radius: 50%; border: 1px solid rgba(255,255,255,0.15); display: flex; align-items: center; justify-content: center; }
        .ap-logo-circle {
          width: 136px; height: 136px; border-radius: 50%;
          background: rgba(255,255,255,0.14); backdrop-filter: blur(16px);
          border: 1.5px solid rgba(255,255,255,0.45);
          box-shadow: 0 0 0 5px rgba(255,255,255,0.07), 0 20px 50px rgba(190,24,93,0.25);
          display: flex; align-items: center; justify-content: center; padding: 20px;
        }
        .ap-logo-img { width: 100%; height: auto; object-fit: contain; filter: brightness(0) invert(1); }
        .ap-hrm-block { display: flex; align-items: flex-end; }
        .ap-hrm-letter {
          font-family: 'Bebas Neue', sans-serif; font-size: 156px; line-height: 0.9;
          color: #fff; letter-spacing: 6px; text-shadow: 0 8px 40px rgba(190,24,93,0.25);
          animation: letterDrop 0.55s cubic-bezier(0.22,1,0.36,1) both;
        }
        @keyframes letterDrop {
          from { opacity: 0; transform: translateY(-16px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        /* ── RIGHT ── */
        .ap-right {
          flex: 1; display: flex; align-items: center; justify-content: center;
          padding: 60px 48px; background: #ffffff; position: relative; overflow-y: auto;
        }
        .ap-right::before {
          content: ''; position: absolute; left: 0; top: 12%; bottom: 12%; width: 1px;
          background: linear-gradient(180deg, transparent, #fce7f3 30%, #f9a8d4 50%, #fce7f3 70%, transparent);
        }
        .ap-card { width: 100%; max-width: 420px; animation: slideUp 0.6s cubic-bezier(0.22,1,0.36,1) 0.08s both; }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        /* Brand */
        .ap-brand { display: flex; align-items: center; gap: 8px; margin-bottom: 40px; }
        .ap-brand-dot { width: 8px; height: 8px; border-radius: 50%; background: #ec4899; }
        .ap-brand-name { font-size: 13px; font-weight: 600; color: #9ca3af; letter-spacing: 0.5px; text-transform: uppercase; }

        /* Heading */
        .ap-heading { margin-bottom: 36px; }
        .ap-icon-wrap {
          width: 56px; height: 56px; border-radius: 16px;
          display: flex; align-items: center; justify-content: center;
          margin-bottom: 20px;
        }

        /* activate = hồng, reset = tím xanh */
        .ap-icon-wrap.activate {
          background: linear-gradient(135deg, #fce7f3, #fdf2f8);
          border: 1.5px solid #f9a8d4;
        }
        .ap-icon-wrap.activate .ap-icon { color: #ec4899; }

        .ap-icon-wrap.reset {
          background: linear-gradient(135deg, #eff6ff, #f5f3ff);
          border: 1.5px solid #bfdbfe;
        }
        .ap-icon-wrap.reset .ap-icon { color: #6366f1; }

        .ap-icon { font-size: 26px; }
        .ap-title {
          font-family: 'Playfair Display', serif; font-size: 32px; font-weight: 700;
          color: #111827; letter-spacing: -0.5px; margin-bottom: 10px; line-height: 1.2;
        }
        .ap-sub { font-size: 14px; color: #6b7280; line-height: 1.65; }

        /* Input */
        .ap-label { font-size: 12px; font-weight: 600; color: #374151; letter-spacing: 0.4px; }
        .ap-input {
          border-radius: 10px !important; height: 48px !important;
          border-color: #e5e7eb !important; background: #fafafa !important;
          font-size: 14px !important; font-family: 'Inter', sans-serif !important;
          color: #111827 !important; transition: all 0.18s ease !important;
        }
        .ap-input:hover { border-color: #f9a8d4 !important; background: #fff !important; }
        .ap-input-icon { color: #d1d5db !important; font-size: 14px !important; }

        /* Button */
        .ap-btn {
          height: 50px !important; border-radius: 10px !important;
          background: linear-gradient(135deg, #ec4899 0%, #db2777 100%) !important;
          border: none !important; font-family: 'Inter', sans-serif !important;
          font-size: 15px !important; font-weight: 600 !important;
          letter-spacing: 0.3px !important; transition: all 0.25s ease !important;
          box-shadow: 0 4px 16px rgba(236,72,153,0.3) !important;
        }
        .ap-btn:hover { transform: translateY(-2px) !important; box-shadow: 0 10px 30px rgba(236,72,153,0.45) !important; filter: brightness(1.05) !important; }

        /* Footer */
        .ap-footer { margin-top: 32px; text-align: center; }
        .ap-back {
          display: inline-block; font-size: 14px; font-weight: 500;
          color: #ec4899; text-decoration: none; transition: all 0.22s ease;
        }
        .ap-back:hover { color: #be185d; }
        .ap-copy { margin-top: 16px; font-size: 11.5px; color: #d1d5db; }

        /* Ant overrides */
        .ant-form-item { margin-bottom: 20px !important; }
        .ant-form-item-label { padding-bottom: 6px !important; }
        .ant-input-affix-wrapper:focus,
        .ant-input-affix-wrapper-focused {
          border-color: #ec4899 !important;
          box-shadow: 0 0 0 3px rgba(236,72,153,0.12) !important;
          background: #fff !important;
        }
        .ant-input-affix-wrapper-focused .ap-input-icon { color: #ec4899 !important; }
        *:focus-visible { outline: none !important; }

        @media (max-width: 1024px) {
          .ap-left { display: none; }
          .ap-right { flex: 1; }
          .ap-right::before { display: none; }
        }
        @media (max-width: 480px) {
          .ap-right { padding: 40px 24px; }
          .ap-title { font-size: 26px; }
        }
      `}</style>
    </div>
  );
};

export default ForgotPassword;