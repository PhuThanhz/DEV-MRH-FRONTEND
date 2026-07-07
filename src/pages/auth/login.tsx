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
      const status = error?.statusCode ?? error?.status ?? error?.response?.status;
      const hasResponse = status !== undefined && status !== null;

      let msg: string;
      if (!hasResponse) {
        msg = "Mất kết nối máy chủ. Vui lòng kiểm tra mạng và thử lại.";
      } else if (status === 401 || status === 400) {
        msg = "Email hoặc mật khẩu không đúng.";
      } else if (status === 429) {
        msg = "Bạn thử quá nhiều lần. Vui lòng đợi ít phút rồi thử lại.";
      } else if (status >= 500) {
        msg = "Hệ thống đang gặp sự cố. Vui lòng thử lại sau.";
      } else {
        msg = Array.isArray(error?.message)
          ? error.message[0]
          : error?.message || "Tài khoản hoặc mật khẩu không đúng. Vui lòng thử lại!";
      }
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
          <div className="logo-clean-container">
            <img
              src="/logo/LOGOFINAL.png"
              alt="LOTUS HRM"
              style={{ width: "100%", height: "auto", objectFit: "contain", filter: "brightness(0) invert(1)" }}
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
                src="/logo/LOGOFINAL.png"
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
                placeholder="Nhập email của bạn"
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
          --login-logo-x: 59.4vh;
          --login-logo-y: 52.5vh;
          --login-logo-size: 21vh;
          min-height: 100vh; min-height: 100dvh;
          display: flex; font-family: 'Inter', sans-serif;
          overflow: hidden;
          position: relative;
          background:
            linear-gradient(90deg, rgba(128, 11, 74, 0.15) 0%, rgba(219, 39, 119, 0.02) 50%, rgba(128, 11, 74, 0.08) 100%),
            url('/logo/tranglogin.png') left center / cover no-repeat;
        }

        /* ── LEFT ── */
        .login-left {
          flex: 1.08; position: relative;
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
          left: var(--login-logo-x);
          top: var(--login-logo-y);
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
          width: var(--login-logo-size);
          display: flex;
          align-items: center;
          justify-content: center;
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

        @media (min-width: 1025px) and (max-height: 760px) and (max-aspect-ratio: 849 / 463) {
          .login-root {
            --login-logo-x: 59.2vh;
            --login-logo-y: 52.9vh;
            --login-logo-size: 20.5vh;
          }
        }

        @media (min-width: 1025px) and (min-height: 900px) and (max-aspect-ratio: 849 / 463) {
          .login-root {
            --login-logo-x: 59.4vh;
            --login-logo-y: 52.5vh;
            --login-logo-size: 21vh;
          }
        }

        @media (min-aspect-ratio: 849 / 463) and (max-aspect-ratio: 21 / 9) {
          .login-root {
            --login-logo-x: 32.4vw;
            --login-logo-y: calc(50vh + 1.35vw);
            --login-logo-size: 11.4vw;
          }
        }

        @media (min-aspect-ratio: 21 / 9) and (max-aspect-ratio: 32 / 9) {
          .login-root {
            --login-logo-x: 32.4vw;
            --login-logo-y: calc(50vh + 1.35vw);
            --login-logo-size: 11.4vw;
          }
        }

        @media (min-aspect-ratio: 32 / 9) {
          .login-root {
            --login-logo-x: 32.4vw;
            --login-logo-y: calc(50vh + 1.35vw);
            --login-logo-size: 11.2vw;
          }
        }

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
            width: 125px;
            height: 125px;
            border-radius: 50%;
            background: #ffffff;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 16px;
            box-shadow: 0 12px 24px rgba(157, 23, 77, 0.15);
            border: none;
          }
          .mb-logo-clean::before {
            content: "";
            position: absolute;
            inset: -8px;
            border-radius: 50%;
            border: 1.5px solid rgba(255, 255, 255, 0.4);
            background: rgba(255, 255, 255, 0.15);
            pointer-events: none;
          }
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
      `}</style>
    </div>
  );
};

export default LoginPage;
