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
      await callRequestPasswordCode(email);
    } catch (error) {
      // bỏ qua lỗi để không lộ thông tin
    }

    // luôn hiển thị giống nhau
    message.success({
      content: "Nếu email tồn tại, mã xác nhận sẽ được gửi!",
      duration: 4,
    });

    // luôn chuyển trang
    navigate(
      `/confirm-reset-password?email=${encodeURIComponent(email)}&mode=${mode}`
    );

    setIsSubmit(false);
  };

  return (
    <div className="login-root">
      {/* ── LEFT — desktop only ── */}
      <div className="login-left">
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
        <div className="left-content">
          <div className="logo-clean-container">
            <img
              src="/logo/LOGOFINAL.webp"
              alt="LOTUS HRM"
            />
          </div>
        </div>
      </div>

      {/* ── RIGHT ── */}
      <div className="login-right">
        {/* MOBILE BANNER */}
        <div className="mobile-banner">
          <svg className="geo-svg" viewBox="0 0 700 900" preserveAspectRatio="xMidYMid slice">
            <circle cx="680" cy="-60" r="340" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
            <circle cx="680" cy="-60" r="500" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
            <circle cx="20" cy="960" r="340" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
            <circle cx="20" cy="960" r="500" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
            <polygon points="-20,640 400,-20 700,-20 700,140 280,900 -20,900" fill="rgba(255,255,255,0.035)" />
            <rect x="600" y="740" width="14" height="14" fill="rgba(255,255,255,0.18)" transform="rotate(45 607 747)" />
            <rect x="55" y="75" width="9" height="9" fill="rgba(255,255,255,0.13)" transform="rotate(45 59 79)" />
          </svg>
          <div className="mobile-aurora mobile-aurora-one" />
          <div className="mobile-aurora mobile-aurora-two" />
          <div className="mobile-banner-inner">
            <div className="mb-logo-clean">
              <img
                src="/logo/LOGOFINAL.webp"
                alt="LOTUS HRM"
              />
            </div>
          </div>
        </div>

        {/* ── Form ── */}
        <div className="form-container">
          <div className="form-brand">
            <div className="brand-dot" />
            <span className="brand-name">Lotus HRM</span>
          </div>

          
          <div className="form-heading">
            <div className={`auth-flow-icon ${mode}`} aria-hidden="true">{content.icon}</div>
            <h2 className="form-title">{content.title}</h2>
            <p className="form-sub">{content.sub}</p>
          </div>

          <Form layout="vertical" onFinish={onFinish}>
            <Form.Item
              label={<span className="f-label">Email</span>}
              name="email"
              rules={[
                { required: true, message: "Email không được để trống!" },
                { type: "email", message: "Email không đúng định dạng!" },
              ]}
              help=""
            >
              <Input
                prefix={<MailOutlined className="input-icon" />}
                placeholder="Nhập email của bạn"
                size="large"
                className="login-input"
              />
            </Form.Item>

            <Form.Item style={{ marginBottom: 0, marginTop: 8 }}>
              <Button
                type="primary"
                htmlType="submit"
                loading={isSubmit}
                block
                size="large"
                className="submit-btn"
              >
                {content.btnText}
              </Button>
            </Form.Item>
          </Form>

          <div className="back-row">
            <Link to="/login" className="back-link">Quay lại trang đăng nhập</Link>
          </div>


          <div className="form-footer">© 2026 Lotus HRM · By Team TEC.</div>
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Inter:wght@400;500;600&family=Playfair+Display:wght@600;700&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        input, select, textarea { font-size: 16px !important; }

        .login-root {
          min-height: 100vh; min-height: 100dvh;
          display: flex; font-family: 'Inter', sans-serif;
          overflow: hidden;
          position: relative;
          background:
            linear-gradient(90deg, rgba(128, 11, 74, 0.15) 0%, rgba(219, 39, 119, 0.02) 50%, rgba(128, 11, 74, 0.08) 100%),
            url('/logo/tranglogin.webp') left center / cover no-repeat;
        }

        /* ── LEFT ── */
        .login-left {
          flex: 1; position: relative;
          background: transparent;
          display: flex; align-items: center; justify-content: flex-start;
          overflow: hidden;
        }
        .geo-svg {
          position: absolute; inset: 0;
          width: 100%; height: 100%; pointer-events: none;
        }
        .left-content {
          position: absolute; z-index: 10;
          left: 50%;
          top: 50%;
          transform: translate(-50%, -50%);
          display: flex; flex-direction: column;
          align-items: center; gap: 0;
          animation: fadeUp 0.7s cubic-bezier(0.22,1,0.36,1) both;
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translate(-50%, calc(-50% + 24px)); }
          to   { opacity: 1; transform: translate(-50%, -50%); }
        }
        .logo-clean-container {
          display: grid;
          place-items: center;
          width: clamp(154px, 17vw, 236px);
          aspect-ratio: 1;
          padding: 13%;
          border-radius: 50%;
          background: #fff;
          box-shadow: 0 26px 55px rgba(92,15,46,.27), inset 0 0 0 12px #fce6ef;
        }
        .logo-clean-container img { width: 100%; height: 100%; object-fit: contain; }
        .hrm-block { display: flex; align-items: flex-end; }
        .hrm-letter {
          font-family: 'Bebas Neue', sans-serif;
          font-size: 156px; line-height: 0.9; color: #fff; letter-spacing: 6px;
          text-shadow: 0 8px 40px rgba(190,24,93,0.25);
          animation: letterDrop 0.55s cubic-bezier(0.22,1,0.36,1) both;
        }
        @keyframes letterDrop {
          from { opacity: 0; transform: translateY(-16px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        /* ── MOBILE BANNER — ẩn mặc định ── */
        .mobile-banner { display: none; }

        /* ── RIGHT ── */
        .login-right {
          flex: 1; display: flex;
          align-items: center; justify-content: center;
          padding: 60px 48px; background: transparent;
          position: relative; overflow-y: auto;
        }
        .login-right::before {
          display: none;
        }
        .form-container {
          width: 100%; max-width: 440px;
          padding: 42px 42px 36px;
          border-radius: 28px;
          background: rgba(255, 255, 255, 0.45);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          border: 1px solid rgba(255, 255, 255, 0.5);
          box-shadow: 0 24px 64px rgba(128, 11, 74, 0.15);
          animation: slideUp 0.6s cubic-bezier(0.22,1,0.36,1) 0.08s both;
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        /* Brand */
        .form-brand { display: flex; align-items: center; gap: 8px; margin-bottom: 40px; }
        .brand-dot { width: 8px; height: 8px; border-radius: 50%; background: #ec4899; }
        .brand-name { font-size: 13px; font-weight: 600; color: #9ca3af; letter-spacing: 0.5px; text-transform: uppercase; }

        /* Heading */
        .form-heading { margin-bottom: 36px; }
        .form-title {
          font-family: 'Playfair Display', serif;
          font-size: 36px; font-weight: 700; color: #111827;
          letter-spacing: -0.5px; margin-bottom: 8px; line-height: 1.15;
        }
        .form-sub { font-size: 14px; color: #4b5563; line-height: 1.5; }

        /* Inputs */
        .f-label { font-size: 12px; font-weight: 600; color: #374151; letter-spacing: 0.4px; }
        .login-input {
          border-radius: 10px !important; height: 48px !important;
          border-color: #ffffff !important;
          background: #ffffff !important;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.04) !important;
          font-size: 16px !important; font-family: 'Inter', sans-serif !important;
          color: #111827 !important; transition: all 0.18s ease !important;
        }
        .login-input::placeholder, .login-input input::placeholder {
          color: #9ca3af !important;
          opacity: 1 !important;
        }
        .login-input:hover {
          border-color: #f3f4f6 !important;
          background: #ffffff !important;
        }
        .input-icon { color: #71717a !important; font-size: 14px !important; transition: color 0.18s !important; }

        /* Forgot */
        .forgot-row { text-align: right; margin: -6px 0 24px; }
        .forgot-link { font-size: 13px !important; font-weight: 500 !important; color: #ec4899 !important; text-decoration: none; transition: color 0.18s; }
        .forgot-link:hover { color: #be185d !important; }

        /* Submit */
        .submit-btn {
          height: 50px !important; border-radius: 10px !important;
          background: linear-gradient(135deg, #ec4899 0%, #db2777 100%) !important;
          border: none !important; font-family: 'Inter', sans-serif !important;
          font-size: 15px !important; font-weight: 600 !important;
          letter-spacing: 0.3px !important; transition: all 0.25s ease !important;
          box-shadow: 0 4px 16px rgba(236,72,153,0.3) !important;
        }
        .submit-btn:hover { transform: translateY(-1px) !important; box-shadow: 0 8px 28px rgba(236,72,153,0.45) !important; filter: brightness(1.04) !important; }
        .submit-btn:active { transform: translateY(0) !important; }

        /* ── Activate row ── */
        .activate-row {
          display: flex; align-items: center; justify-content: center;
          gap: 6px; margin-top: 20px;
        }
        .activate-label { font-size: 13px; color: #4b5563; }
        .activate-link {
          font-size: 13px; font-weight: 600;
          color: #ec4899 !important; text-decoration: none;
          border-bottom: 1.5px solid #fbb6ce;
          padding-bottom: 1px;
          transition: color 0.18s, border-color 0.18s;
        }
        .activate-link:hover { color: #be185d !important; border-color: #ec4899; }
        .back-row { display: flex; justify-content: center; margin-top: 28px; }
        .back-link {
          display: inline-flex; align-items: center; justify-content: center;
          padding: 8px 18px; border-radius: 24px;
          font-size: 13.5px; font-weight: 600; color: #db2777 !important;
          background: rgba(236, 72, 153, 0.06);
          text-decoration: none; transition: all 0.2s ease;
        }
        .back-link:hover { background: rgba(236, 72, 153, 0.12); color: #be185d !important; }

        /* Footer */
        .form-footer { margin-top: 28px; font-size: 11.5px; color: #4b5563; text-align: center; letter-spacing: 0.2px; }

        /* ── Ant overrides ── */
        .ant-form-item { margin-bottom: 20px !important; }
        .ant-form-item-label { padding-bottom: 6px !important; }

        /* Ẩn hoàn toàn inline error message và khoảng trống thừa */
        .ant-form-item-explain,
        .ant-form-item-explain-error,
        .ant-form-item-margin-offset { display: none !important; }

        .ant-input-affix-wrapper:focus,
        .ant-input-affix-wrapper-focused {
          border-color: rgba(236, 72, 153, 0.5) !important;
          box-shadow: 0 0 0 3px rgba(236, 72, 153, 0.15), inset 0 1px 4px rgba(255, 255, 255, 0.1) !important;
          background: rgba(255, 255, 255, 0.18) !important;
        }
        .ant-input-affix-wrapper-focused .input-icon { color: #ec4899 !important; }
        .ant-input, .ant-input-password input { font-size: 16px !important; background: transparent !important; color: inherit !important; }
        *:focus-visible { outline: none !important; }

        /* ── Fix autofill màu xanh của Chrome ── */
        input:-webkit-autofill,
        input:-webkit-autofill:hover,
        input:-webkit-autofill:focus,
        input:-webkit-autofill:active {
          -webkit-box-shadow: 0 0 0 1000px #fafafa inset !important;
          -webkit-text-fill-color: #111827 !important;
          transition: background-color 9999s ease-in-out 0s;
        }
        .ant-input-affix-wrapper:has(input:-webkit-autofill) {
          background: #fafafa !important;
          border-color: #e5e7eb !important;
        }

        /* ── TABLET + MOBILE ≤ 1024px ── */
        @media (max-width: 1024px) {
          .login-root { flex-direction: column; overflow-y: auto; }
          .login-left { display: none; }
          .login-right {
            flex: 1; flex-direction: column;
            padding: 0; align-items: stretch; justify-content: flex-start;
          }
          .login-right::before { display: none; }

          .login-right {
            background: linear-gradient(180deg, #fdf2f8 0%, #fce7f3 100%);
          }
          .mobile-banner {
            display: flex; position: relative;
            background: linear-gradient(135deg, #ec4899 0%, #9d174d 100%);
            height: 320px;
            align-items: center; justify-content: center;
            overflow: hidden; flex-shrink: 0;
            border-bottom-left-radius: 34px;
            border-bottom-right-radius: 34px;
            box-shadow: 0 16px 32px rgba(190,24,93,0.15);
          }
          .mobile-banner::before {
            display: none;
          }
          .mobile-banner::after {
            content: "";
            position: absolute;
            left: 28px;
            right: 28px;
            bottom: 18px;
            height: 1px;
            background: linear-gradient(90deg, transparent, rgba(255,255,255,0.55), transparent);
            opacity: 0.75;
          }
          .mobile-aurora {
            position: absolute;
            border-radius: 999px;
            filter: blur(12px);
            pointer-events: none;
            opacity: 0.52;
          }
          .mobile-aurora-one {
            width: 180px;
            height: 76px;
            left: -34px;
            bottom: 44px;
            background: rgba(255,255,255,0.18);
            transform: rotate(-18deg);
          }
          .mobile-aurora-two {
            width: 150px;
            height: 64px;
            right: -38px;
            top: 46px;
            background: rgba(255,255,255,0.15);
            transform: rotate(24deg);
          }
          .mobile-banner .geo-svg polygon {
            display: none;
          }
          .mobile-banner-inner {
            position: relative; z-index: 10;
            display: flex; flex-direction: column;
            align-items: center; justify-content: center;
            animation: mobileFadeUp 0.7s cubic-bezier(0.22,1,0.36,1) both;
          }
          @keyframes mobileFadeUp {
            from { opacity: 0; transform: translateY(25px); }
            to   { opacity: 1; transform: translateY(5px); }
          }
          .breathe-ring,
          .orbit { display: none; }
          @keyframes breathe {
            0%, 100% { transform: scale(1);    opacity: 0.5; }
            50%       { transform: scale(1.07); opacity: 0.15; }
          }
          .mb-logo-clean {
            position: relative;
            width: 132px;
            height: 132px;
            border-radius: 50%;
            background: #ffffff;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 13%;
            box-shadow: 0 26px 55px rgba(92,15,46,.27), inset 0 0 0 10px #fce6ef;
            border: none;
          }
          .mb-logo-clean::before { display: none; }
          .mb-logo-clean img {
            width: 100%;
            height: auto;
            object-fit: contain;
          }
          .form-brand { display: none; }
          .form-container {
            position: relative;
            z-index: 20;
            width: min(520px, calc(100% - 32px));
            max-width: 520px;
            margin: -34px auto 0;
            padding: 30px 28px 32px;
            border-radius: 24px;
            background: rgba(255,255,255,0.96);
            border: 1px solid rgba(251,207,232,0.9);
            box-shadow: 0 22px 54px rgba(190,24,93,0.13);
          }
          .form-heading { margin-bottom: 24px; }
          .form-title {
            font-family: 'Playfair Display', serif;
            font-size: 34px;
            font-weight: 700;
            letter-spacing: -0.4px;
            line-height: 1.08;
          }
          .form-sub { font-size: 13.5px; color: #94a3b8; line-height: 1.45; }
          .f-label { font-size: 12.5px; font-weight: 700; }
          .login-input {
            border-radius: 16px !important;
            background: #fff !important;
            border-color: #f3d3e4 !important;
            box-shadow: 0 8px 24px rgba(148,163,184,0.09) !important;
          }
          .forgot-row { margin: -4px 0 20px; }
          .submit-btn {
            border-radius: 16px !important;
            box-shadow: 0 12px 28px rgba(236,72,153,0.32) !important;
          }
          .activate-row {
            padding-top: 2px;
            flex-wrap: wrap;
          }
        }

        /* ── MOBILE ≤ 640px ── */
        @media (max-width: 640px) {
          .mobile-banner  { height: 274px; }
          .mb-logo-ring-o { width: 180px; height: 180px; }
          .mb-logo-ring-i { width: 154px; height: 154px; }
          .mb-logo-circ   { width: 132px; height: 132px; padding: 12px; }
          .form-container { width: calc(100% - 24px); padding: 24px 20px 30px; margin-top: -34px; }
          .form-title     { font-size: 31px; }
          .login-input    { height: 44px !important; }
          .submit-btn     { height: 46px !important; font-size: 14px !important; }
        }

        /* ── SMALL MOBILE ≤ 390px ── */
        @media (max-width: 390px) {
          .mobile-banner  { height: 254px; border-bottom-left-radius: 28px; border-bottom-right-radius: 28px; }
          .mb-logo-ring-o { width: 164px; height: 164px; }
          .mb-logo-ring-i { width: 140px; height: 140px; }
          .mb-logo-circ   { width: 120px; height: 120px; padding: 11px; }
          .form-container { width: calc(100% - 24px); padding: 22px 16px 28px; border-radius: 22px; margin-top: -30px; }
          .form-title     { font-size: 29px; }
        }

        /* Shared auth-flow sizing: keeps activation and password recovery aligned. */
        .auth-flow-icon {
          width: 38px;
          height: 38px;
          display: grid;
          place-items: center;
          margin-bottom: 16px;
          border-radius: 12px;
          color: #be185d;
          background: #fce7f3;
          font-size: 18px;
        }
        .auth-flow-icon.activate { color: #9d174d; background: #fdf2f8; }
        .form-container { margin-block: clamp(24px, 5vh, 56px); }

        @media (max-width: 1024px) {
          .mobile-banner { height: clamp(208px, 28vw, 272px); }
          .form-container {
            width: min(560px, calc(100% - 32px));
            margin: -30px auto 32px;
            padding: clamp(26px, 4vw, 34px) clamp(22px, 4vw, 32px) 32px;
          }
          .form-title { font-size: clamp(30px, 4vw, 34px); }
          .form-sub { max-width: 46ch; }
        }

        @media (max-width: 640px) {
          .mobile-banner { height: 206px; border-bottom-left-radius: 30px; border-bottom-right-radius: 30px; }
          .mb-logo-clean { width: 104px; height: 104px; padding: 13px; }
          .form-container { width: calc(100% - 24px); margin: -24px auto 24px; }
          .auth-flow-icon { width: 34px; height: 34px; margin-bottom: 14px; border-radius: 10px; font-size: 16px; }
          .form-heading { margin-bottom: 22px; }
          .form-title { font-size: clamp(27px, 8vw, 31px); }
          .form-footer { margin-top: 24px; }
        }

        @media (max-width: 360px) {
          .mobile-banner { height: 184px; }
          .form-container { width: calc(100% - 16px); padding: 22px 16px 26px; }
          .back-link { padding-inline: 14px; font-size: 13px; }
        }

        /* Match the login screen: no image backdrop on recovery/activation flows. */
        .login-root {
          background: #f8f7f5;
        }
        .login-left {
          background:
            radial-gradient(circle at 10% 10%, rgba(255, 255, 255, 0.08) 0%, transparent 45%),
            radial-gradient(circle at 90% 90%, rgba(220, 62, 124, 0.2) 0%, transparent 50%),
            linear-gradient(135deg, #dc3e7c 0%, #ad285b 50%, #801440 100%);
        }
        .login-right {
          background-color: #fff8fb;
          background-image: radial-gradient(rgba(220, 62, 124, .08) .7px, transparent .7px);
          background-size: 11px 11px;
        }
        .form-container {
          background: rgba(255, 255, 255, .94);
          border-color: #f1dce5;
          box-shadow: 0 24px 60px rgba(141, 32, 76, .12);
        }

        @media (max-width: 1024px) {
          .login-right {
            background-color: #fff8fb;
            background-image: radial-gradient(rgba(220, 62, 124, .08) .7px, transparent .7px);
          }
          .mobile-banner {
            background:
              radial-gradient(circle at 10% 10%, rgba(255, 255, 255, .08) 0%, transparent 45%),
              linear-gradient(135deg, #dc3e7c 0%, #ad285b 52%, #801440 100%);
          }
        }

        /* Use the same form language and responsive breakpoint as the login page. */
        .form-container {
          max-width: 414px;
          padding: 46px 42px 38px;
          border-radius: 22px;
        }
        .form-container::before {
          content: "";
          position: absolute;
          top: 0;
          left: 42px;
          width: 58px;
          height: 4px;
          border-radius: 0 0 4px 4px;
          background: #dc3e7c;
        }
        .form-brand, .auth-flow-icon { display: none; }
        .form-heading { margin-bottom: 32px; }
        .form-title {
          font-family: Arial, "Helvetica Neue", sans-serif;
          font-size: clamp(32px, 3vw, 39px);
          font-weight: 600;
          line-height: 1.05;
          letter-spacing: -.04em;
          color: #352530;
        }
        .form-sub { margin-top: 9px; color: #93838b; font-size: 13px; line-height: 1.5; }
        .f-label { color: #504a50; font-size: 12px; font-weight: 700; }
        .login-input {
          height: 52px !important;
          padding-inline: 15px !important;
          border: 1px solid #eee3e8 !important;
          border-radius: 10px !important;
          background: #fffafd !important;
          box-shadow: none !important;
        }
        .login-input:hover { border-color: #eab1c7 !important; }
        .submit-btn {
          height: 52px !important;
          border-radius: 10px !important;
          background: #dc3e7c !important;
          box-shadow: 0 14px 24px rgba(174,40,91,.2) !important;
        }
        .submit-btn:hover { background: #ad285b !important; transform: translateY(-2px) !important; }
        .back-row { margin-top: 22px; }
        .back-link { padding: 0; border-radius: 0; color: #ad285b !important; background: transparent; font-size: 13px; }
        .form-footer { color: #b2abb0; font-size: 11px; margin-top: 32px; }

        @media (min-width: 851px) and (max-width: 1024px) {
          .login-root { flex-direction: row; overflow: hidden; }
          .login-left { display: flex; }
          .login-right { padding: clamp(32px, 6vw, 64px); align-items: center; justify-content: center; }
          .mobile-banner { display: none; }
          .form-container { margin: 0; }
        }

        @media (max-width: 850px) {
          .mobile-banner { height: 290px; border-radius: 0 0 48px 48px; }
          .form-container { width: min(395px, calc(100% - 40px)); margin: -70px auto 32px; padding: 38px 28px 30px; border-radius: 28px; }
          .form-container::before { display: none; }
          .form-title { font-size: 32px; }
        }

        @media (max-width: 480px) {
          .mobile-banner { height: 250px; border-radius: 0 0 40px 40px; }
          .form-container { width: calc(100% - 32px); margin-top: -60px; padding: 32px 22px 26px; border-radius: 24px; }
          .form-title { font-size: 28px; }
        }
      `}</style>
    </div>
  );
};

export default ForgotPassword;
