import { Button, Form, Input } from "antd";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { callLogin } from "config/api";
import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { setUserLoginInfo } from "@/redux/slice/accountSlide";
import { useAppSelector } from "@/redux/hooks";
import { LockOutlined, MailOutlined } from "@ant-design/icons";
import { notify } from "@/components/common/notification/notify";

const LoginPage = () => {
  const [isSubmit, setIsSubmit] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const isAuthenticated = useAppSelector((state) => state.account.isAuthenticated);
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const callback = params.get("callback");

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/admin", { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const onFinish = async (values: { username: string; password: string }) => {
    const { username, password } = values;
    setIsSubmit(true);
    try {
      const res = await callLogin(username, password);
      if (res?.data) {
        localStorage.setItem("access_token", res.data.access_token);
        dispatch(setUserLoginInfo(res.data.user));
        notify.created("Đăng nhập thành công");
        const redirectTo = callback && callback.startsWith("/") ? callback : "/";
        navigate(redirectTo, { replace: true });
      } else {
        notify.error("Đăng nhập thất bại");
      }
    } catch (error: any) {
      const msg = Array.isArray(error?.message)
        ? error.message[0]
        : error?.message || "Tài khoản hoặc mật khẩu không đúng. Vui lòng thử lại!";
      notify.error(msg);
    } finally {
      setIsSubmit(false);
    }
  };

  // ── Thay inline error bằng toast notification ──
  const onFinishFailed = ({ errorFields }: any) => {
    const firstError = errorFields[0]?.errors[0];
    if (firstError) notify.error(firstError);
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
          <div className="logo-ring-outer">
            <div className="logo-ring-inner">
              <div className="logo-circle">
                <img
                  src="/logo/LOGOFINAL.png"
                  alt="LOTUS HRM"
                  style={{ width: "100%", height: "auto", objectFit: "contain", filter: "brightness(0) invert(1)" }}
                />
              </div>
            </div>
          </div>
          <div className="hrm-block">
            <span className="hrm-letter" style={{ animationDelay: "0.05s" }}>H</span>
            <span className="hrm-letter" style={{ animationDelay: "0.12s" }}>R</span>
            <span className="hrm-letter" style={{ animationDelay: "0.19s" }}>M</span>
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
          <div className="mobile-banner-inner">
            <div className="breathe-ring" />
            <div className="mb-logo-ring-o">
              <div className="mb-logo-ring-i">
                <div className="mb-logo-circ">
                  <img
                    src="/logo/LOGOFINAL.png"
                    alt="LOTUS HRM"
                    style={{ width: "100%", height: "auto", objectFit: "contain", filter: "brightness(0) invert(1)" }}
                  />
                </div>
              </div>
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
            <h2 className="form-title">Đăng nhập</h2>
            <p className="form-sub">Nhập thông tin tài khoản để tiếp tục</p>
          </div>

          {/* ── onFinishFailed → toast, help="" → ẩn inline error ── */}
          <Form layout="vertical" onFinish={onFinish} onFinishFailed={onFinishFailed}>
            <Form.Item
              label={<span className="f-label">Email</span>}
              name="username"
              rules={[{ required: true, message: "Email không được để trống!" }]}
              help=""
            >
              <Input
                prefix={<MailOutlined className="input-icon" />}
                placeholder="vd: email@lotusgroup.com.vn"
                size="large"
                className="login-input"
              />
            </Form.Item>

            <Form.Item
              label={<span className="f-label">Mật khẩu</span>}
              name="password"
              rules={[{ required: true, message: "Mật khẩu không được để trống!" }]}
              help=""
            >
              <Input.Password
                prefix={<LockOutlined className="input-icon" />}
                placeholder="••••••••"
                size="large"
                className="login-input"
              />
            </Form.Item>

            {/* Quên mật khẩu — right aligned */}
            <div className="forgot-row">
              <Link to="/forgot-password" className="forgot-link">
                Quên mật khẩu?
              </Link>
            </div>

            <Form.Item style={{ marginBottom: 0 }}>
              <Button
                type="primary"
                htmlType="submit"
                loading={isSubmit}
                block
                size="large"
                className="submit-btn"
              >
                Đăng nhập
              </Button>
            </Form.Item>
          </Form>

          {/* ── Kích hoạt tài khoản ── */}
          <div className="activate-row">
            <span className="activate-label">Lần đầu đăng nhập?</span>
            <Link to="/forgot-password?mode=activate" className="activate-link">
              Kích hoạt tài khoản
            </Link>
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
        }

        /* ── LEFT ── */
        .login-left {
          flex: 1; position: relative;
          background: linear-gradient(150deg, #f472b6 0%, #ec4899 45%, #db2777 100%);
          display: flex; align-items: center; justify-content: center;
          overflow: hidden;
        }
        .geo-svg {
          position: absolute; inset: 0;
          width: 100%; height: 100%; pointer-events: none;
        }
        .left-content {
          position: relative; z-index: 10;
          display: flex; flex-direction: column;
          align-items: center; gap: 36px;
          animation: fadeUp 0.7s cubic-bezier(0.22,1,0.36,1) both;
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .logo-ring-outer {
          width: 196px; height: 196px; border-radius: 50%;
          border: 1px solid rgba(255,255,255,0.22);
          display: flex; align-items: center; justify-content: center;
        }
        .logo-ring-inner {
          width: 168px; height: 168px; border-radius: 50%;
          border: 1px solid rgba(255,255,255,0.15);
          display: flex; align-items: center; justify-content: center;
        }
        .logo-circle {
          width: 136px; height: 136px; border-radius: 50%;
          background: rgba(255,255,255,0.14); backdrop-filter: blur(16px);
          border: 1.5px solid rgba(255,255,255,0.45);
          box-shadow: 0 0 0 5px rgba(255,255,255,0.07), 0 20px 50px rgba(190,24,93,0.25);
          display: flex; align-items: center; justify-content: center;
          padding: 20px;
        }
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
          padding: 60px 48px; background: #ffffff;
          position: relative; overflow-y: auto;
        }
        .login-right::before {
          content: ''; position: absolute;
          left: 0; top: 12%; bottom: 12%; width: 1px;
          background: linear-gradient(180deg, transparent, #fce7f3 30%, #f9a8d4 50%, #fce7f3 70%, transparent);
        }
        .form-container {
          width: 100%; max-width: 400px;
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
        .form-sub { font-size: 14px; color: #9ca3af; line-height: 1.5; }

        /* Inputs */
        .f-label { font-size: 12px; font-weight: 600; color: #374151; letter-spacing: 0.4px; }
        .login-input {
          border-radius: 10px !important; height: 48px !important;
          border-color: #e5e7eb !important; background: #fafafa !important;
          font-size: 16px !important; font-family: 'Inter', sans-serif !important;
          color: #111827 !important; transition: all 0.18s ease !important;
        }
        .login-input:hover { border-color: #f9a8d4 !important; background: #fff !important; }
        .input-icon { color: #d1d5db !important; font-size: 14px !important; transition: color 0.18s !important; }

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
        .activate-label { font-size: 13px; color: #9ca3af; }
        .activate-link {
          font-size: 13px; font-weight: 600;
          color: #ec4899 !important; text-decoration: none;
          border-bottom: 1.5px solid #fbb6ce;
          padding-bottom: 1px;
          transition: color 0.18s, border-color 0.18s;
        }
        .activate-link:hover { color: #be185d !important; border-color: #ec4899; }

        /* Footer */
        .form-footer { margin-top: 28px; font-size: 11.5px; color: #d1d5db; text-align: center; letter-spacing: 0.2px; }

        /* ── Ant overrides ── */
        .ant-form-item { margin-bottom: 20px !important; }
        .ant-form-item-label { padding-bottom: 6px !important; }

        /* Ẩn hoàn toàn inline error message và khoảng trống thừa */
        .ant-form-item-explain,
        .ant-form-item-explain-error,
        .ant-form-item-margin-offset { display: none !important; }

        .ant-input-affix-wrapper:focus,
        .ant-input-affix-wrapper-focused {
          border-color: #ec4899 !important;
          box-shadow: 0 0 0 3px rgba(236,72,153,0.1) !important;
          background: #fff !important;
        }
        .ant-input-affix-wrapper-focused .input-icon { color: #ec4899 !important; }
        .ant-input, .ant-input-password input { font-size: 16px !important; }
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

          .mobile-banner {
            display: flex; position: relative;
            background: linear-gradient(150deg, #f472b6 0%, #ec4899 45%, #db2777 100%);
            height: 280px;
            align-items: center; justify-content: center;
            overflow: hidden; flex-shrink: 0;
          }
          .mobile-banner-inner {
            position: relative; z-index: 10;
            display: flex; flex-direction: column;
            align-items: center; justify-content: center;
            animation: fadeUp 0.7s cubic-bezier(0.22,1,0.36,1) both;
          }
          .breathe-ring {
            position: absolute;
            width: 240px; height: 240px; border-radius: 50%;
            border: 1.5px solid rgba(255,255,255,0.25);
            animation: breathe 4s ease-in-out infinite;
            pointer-events: none;
          }
          @keyframes breathe {
            0%, 100% { transform: scale(1);    opacity: 0.5; }
            50%       { transform: scale(1.07); opacity: 0.15; }
          }
          .mb-logo-ring-o {
            width: 186px; height: 186px; border-radius: 50%;
            border: 1px solid rgba(255,255,255,0.22);
            display: flex; align-items: center; justify-content: center;
          }
          .mb-logo-ring-i {
            width: 160px; height: 160px; border-radius: 50%;
            border: 1px solid rgba(255,255,255,0.15);
            display: flex; align-items: center; justify-content: center;
          }
          .mb-logo-circ {
            width: 136px; height: 136px; border-radius: 50%;
            background: rgba(255,255,255,0.16);
            backdrop-filter: blur(16px);
            border: 2px solid rgba(255,255,255,0.5);
            box-shadow: 0 0 0 5px rgba(255,255,255,0.07), 0 16px 48px rgba(190,24,93,0.25);
            display: flex; align-items: center; justify-content: center;
            padding: 20px;
            animation: fadeUp 0.7s cubic-bezier(0.22,1,0.36,1) 0.15s both,
                       float 4s ease-in-out 0.9s infinite;
          }
          @keyframes float {
            0%, 100% { transform: translateY(0);    box-shadow: 0 0 0 5px rgba(255,255,255,0.07), 0 16px 48px rgba(190,24,93,0.25); }
            50%       { transform: translateY(-7px); box-shadow: 0 0 0 5px rgba(255,255,255,0.07), 0 24px 56px rgba(190,24,93,0.35); }
          }
          .form-brand { display: none; }
          .form-container { padding: 28px 32px 40px; max-width: 100%; }
          .form-heading { margin-bottom: 28px; }
        }

        /* ── MOBILE ≤ 640px ── */
        @media (max-width: 640px) {
          .mobile-banner  { height: 260px; }
          .breathe-ring   { width: 210px; height: 210px; }
          .mb-logo-ring-o { width: 166px; height: 166px; }
          .mb-logo-ring-i { width: 142px; height: 142px; }
          .mb-logo-circ   { width: 120px; height: 120px; padding: 18px; }
          .form-container { padding: 24px 20px 36px; }
          .form-title     { font-size: 30px; }
          .login-input    { height: 44px !important; }
          .submit-btn     { height: 46px !important; font-size: 14px !important; }
        }

        /* ── SMALL MOBILE ≤ 390px ── */
        @media (max-width: 390px) {
          .mobile-banner  { height: 235px; }
          .breathe-ring   { width: 185px; height: 185px; }
          .mb-logo-ring-o { width: 148px; height: 148px; }
          .mb-logo-ring-i { width: 126px; height: 126px; }
          .mb-logo-circ   { width: 106px; height: 106px; padding: 16px; }
          .form-container { padding: 20px 16px 32px; }
          .form-title     { font-size: 26px; }
        }
      `}</style>
    </div>
  );
};

export default LoginPage;