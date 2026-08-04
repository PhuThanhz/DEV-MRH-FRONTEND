import { Button, Form, Input } from "antd";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { callLogin } from "config/api";
import { useEffect, useRef, useState } from "react";
import { useDispatch } from "react-redux";
import { setUserLoginInfo } from "@/redux/slice/accountSlide";
import { useAppSelector } from "@/redux/hooks";
import { LockOutlined, MailOutlined } from "@ant-design/icons";
import { notify } from "@/components/common/notification/notify";

const LOGIN_COOLDOWN_MS = 1200;
const LOGIN_ERROR_COOLDOWN_MS = 3000;

const LoginPage = () => {
  const [isSubmit, setIsSubmit] = useState(false);
  const [isSuccessTransition, setIsSuccessTransition] = useState(false);
  const submitLockRef = useRef(false);
  const cooldownUntilRef = useRef(0);
  const unlockTimerRef = useRef<number | null>(null);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const isAuthenticated = useAppSelector((state) => state.account.isAuthenticated);
  const location = useLocation();
  const callback = new URLSearchParams(location.search).get("callback");
  const postLoginPath = callback?.startsWith("/") && !callback.startsWith("//")
    ? callback
    : "/admin";

  useEffect(() => {
    if (isAuthenticated && !isSuccessTransition) navigate(postLoginPath, { replace: true });
  }, [isAuthenticated, isSuccessTransition, navigate, postLoginPath]);

  useEffect(() => () => {
    if (unlockTimerRef.current !== null) {
      window.clearTimeout(unlockTimerRef.current);
    }
  }, []);

  const onFinish = async (values: { username: string; password: string }) => {
    const now = Date.now();
    if (submitLockRef.current || now < cooldownUntilRef.current) return;

    submitLockRef.current = true;
    setIsSubmit(true);

    try {
      const res = await callLogin(values.username, values.password);
      if (res?.data) {
        const loginData = res.data;
        localStorage.setItem("access_token", loginData.access_token);
        sessionStorage.setItem("just_logged_in", "true");
        setIsSuccessTransition(true);

        notify.success("Bạn đã đăng nhập vào Lotus HRM.", {
          id: "login-status",
          title: "Đăng nhập thành công",
        });

        window.setTimeout(() => {
          dispatch(setUserLoginInfo(loginData.user));
          navigate(postLoginPath, { replace: true });
        }, 420);
      } else {
        cooldownUntilRef.current = Date.now() + LOGIN_COOLDOWN_MS;
        notify.error("Không nhận được thông tin phiên đăng nhập. Vui lòng thử lại.", {
          id: "login-status",
          title: "Đăng nhập không thành công",
        });
      }
    } catch (error: any) {
      const status = error?.statusCode ?? error?.status ?? error?.response?.status;
      let msg: string;
      if (status === undefined || status === null) {
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
          : error?.message || "Tài khoản hoặc mật khẩu không đúng. Vui lòng thử lại.";
      }

      const cooldownMs = status === undefined || status === null || status === 429 || status >= 500
        ? LOGIN_ERROR_COOLDOWN_MS
        : LOGIN_COOLDOWN_MS;
      cooldownUntilRef.current = Date.now() + cooldownMs;
      const title = status === undefined || status === null
        ? "Không thể kết nối hệ thống"
        : status === 429
          ? "Tạm thời chưa thể đăng nhập"
          : status >= 500
            ? "Dịch vụ đăng nhập gián đoạn"
            : "Đăng nhập không thành công";
      notify.error(msg, { id: "login-status", title });
    } finally {
      const remainingCooldown = Math.max(0, cooldownUntilRef.current - Date.now());
      unlockTimerRef.current = window.setTimeout(() => {
        submitLockRef.current = false;
        setIsSubmit(false);
        unlockTimerRef.current = null;
      }, remainingCooldown);
    }
  };

  const onFinishFailed = ({ errorFields }: any) => {
    const firstError = errorFields[0]?.errors[0];
    if (firstError) {
      notify.warning(firstError, {
        toastId: "login-validation",
        title: "Thông tin đăng nhập chưa đầy đủ",
      });
    }
  };

  return (
    <main className={`login-page ${isSuccessTransition ? "login-split-active" : ""}`}>
      <section className="login-panel">
        <div className="login-form-wrap">
          <header className="login-heading">
            <h2>Đăng nhập</h2>
            <p>Nhập thông tin tài khoản để tiếp tục</p>
          </header>

          <Form layout="vertical" onFinish={onFinish} onFinishFailed={onFinishFailed} requiredMark={false} disabled={isSubmit}>
            <Form.Item
              label="Email"
              name="username"
              rules={[{ required: true, message: "Vui lòng nhập email." }]}
              help=""
            >
              <Input
                type="email"
                prefix={<MailOutlined />}
                placeholder="Nhập email của bạn"
                size="large"
                autoComplete="username"
              />
            </Form.Item>

            <Form.Item
              label="Mật khẩu"
              name="password"
              rules={[{ required: true, message: "Vui lòng nhập mật khẩu." }]}
              help=""
            >
              <Input.Password
                prefix={<LockOutlined />}
                placeholder="••••••••"
                size="large"
                autoComplete="current-password"
              />
            </Form.Item>

            <div className="login-actions">
              <Link to="/forgot-password">Quên mật khẩu?</Link>
            </div>

            <Form.Item className="submit-item">
              <Button type="primary" htmlType="submit" loading={isSubmit} disabled={isSubmit} block size="large">
                Đăng nhập
              </Button>
            </Form.Item>
          </Form>

          <div className="account-activation">
            <span>Lần đầu đăng nhập?</span>
            <Link to="/forgot-password?mode=activate">Kích hoạt tài khoản</Link>
          </div>

          <footer className="login-footer">© 2026 Lotus HRM · By Team TEC.</footer>
        </div>
      </section>

      <section className="login-brand" aria-label="Lotus HRM">
        <div className="css-geometric-bg">
          <svg className="geo-svg" viewBox="0 0 700 900" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
            <circle cx="680" cy="-60" r="340" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
            <circle cx="680" cy="-60" r="500" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
            <circle cx="20" cy="960" r="340" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
            <circle cx="20" cy="960" r="500" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
            <polygon points="-20,640 400,-20 700,-20 700,140 280,900 -20,900" fill="rgba(255,255,255,0.035)" />
            <rect x="600" y="740" width="14" height="14" fill="rgba(255,255,255,0.18)" transform="rotate(45 607 747)" />
            <rect x="55" y="75" width="9" height="9" fill="rgba(255,255,255,0.13)" transform="rotate(45 59 79)" />
            <rect x="630" y="290" width="6" height="6" fill="rgba(255,255,255,0.16)" transform="rotate(45 633 293)" />
          </svg>
        </div>

        <div className="brand-copy">
          <div className="hero-logo-frame">
            <img src="/logo/LOGOFINAL.webp" alt="Lotus Group" />
          </div>
          <div className="brand-caption">HRM</div>
        </div>
      </section>

      <style>{`
        .login-page {
          --ink: #36202d;
          --muted: #93838b;
          --line: #eee3e8;
          --accent: #dc3e7c;
          --accent-deep: #ad285b;
          height: 100vh;
          height: 100dvh;
          min-height: 0;
          display: grid;
          grid-template-columns: 50% 50%;
          overflow: hidden;
          color: var(--ink);
          background: #f8f7f5;
          font-family: "Avenir Next", "Segoe UI", sans-serif;
        }
        .login-page *, .login-page *::before, .login-page *::after { box-sizing: border-box; }
        
        .login-panel { 
          grid-column: 2; 
          min-width: 0; 
          height: 100%; 
          min-height: 0; 
          padding: clamp(20px, 4vw, 64px); 
          display: flex; 
          flex-direction: column; 
          justify-content: center; 
          align-items: center;
          overflow-y: auto; 
          overscroll-behavior: contain; 
          background-color: #fff8fb; 
          background-image: radial-gradient(rgba(220,62,124,.08) .7px, transparent .7px); 
          background-size: 11px 11px; 
        }
        
        .login-form-wrap { 
          position: relative; 
          width: min(90%, 420px); 
          margin: auto; 
          padding: clamp(28px, 4vh, 46px) clamp(24px, 3.5vw, 42px) clamp(24px, 3.5vh, 38px); 
          border: 1px solid #f1dce5; 
          border-radius: clamp(16px, 2vw, 24px); 
          background: rgba(255,255,255,.95); 
          box-shadow: 0 24px 60px rgba(141,32,76,.12); 
        }
        .login-form-wrap::before { 
          content: ""; 
          position: absolute; 
          top: 0; 
          left: clamp(24px, 3.5vw, 42px); 
          width: 58px; 
          height: 4px; 
          border-radius: 0 0 4px 4px; 
          background: var(--accent); 
        }
        
        .login-heading { margin-bottom: clamp(20px, 3vh, 32px); }
        .login-heading h2 { 
          margin: 0; 
          color: #352530; 
          font-family: Arial, "Helvetica Neue", sans-serif; 
          font-size: clamp(28px, 2.6vw, 38px); 
          line-height: 1.1; 
          letter-spacing: -.03em; 
          font-weight: 600; 
        }
        .login-heading p { margin: 8px 0 0; color: var(--muted); font-size: clamp(12px, 1.1vw, 13.5px); line-height: 1.5; }
        
        .login-page .ant-form-item { margin-bottom: clamp(14px, 2.2vh, 20px); }
        .login-page .ant-form-item-label { padding-bottom: 6px; }
        .login-page .ant-form-item-label > label { color: #504a50; font-size: 12px; font-weight: 700; }
        
        .login-page .ant-input-affix-wrapper { 
          height: clamp(44px, 5dvh, 52px); 
          padding-inline: 15px; 
          border: 1px solid var(--line); 
          border-radius: 10px; 
          background: #fffafd; 
          box-shadow: none; 
          transition: border-color .2s, box-shadow .2s; 
        }
        .login-page .ant-input-affix-wrapper:hover { border-color: #eab1c7; }
        .login-page .ant-input-affix-wrapper-focused { border-color: var(--accent); box-shadow: 0 0 0 4px rgba(207,92,137,.12); }
        .login-page .ant-input-affix-wrapper .anticon { color: #aaa1a8; font-size: 15px; }
        .login-page .ant-input { font-size: 14px; background: transparent; }
        .login-page .ant-input::placeholder { color: #b3abb1; }
        .login-page .ant-form-item-explain, .login-page .ant-form-item-margin-offset { display: none; }
        
        .login-actions { display: flex; justify-content: flex-end; margin: -2px 0 clamp(16px, 2.5vh, 26px); }
        .login-actions a, .account-activation a { color: var(--accent-deep); font-size: 13px; font-weight: 700; text-decoration: none; }
        .login-actions a:hover, .account-activation a:hover { color: #2e2993; }
        
        .login-page .submit-item { margin: 0; }
        .login-page .submit-item .ant-btn { 
          height: clamp(44px, 5dvh, 52px); 
          border: 0; 
          border-radius: 10px; 
          background: var(--accent); 
          font-family: inherit; 
          font-size: 14px; 
          font-weight: 700; 
          box-shadow: 0 14px 24px rgba(174,40,91,.2); 
          transition: transform .2s, background .2s, box-shadow .2s; 
        }
        .login-page .submit-item .ant-btn:hover { background: var(--accent-deep) !important; transform: translateY(-2px); box-shadow: 0 18px 30px rgba(98,93,231,.29); }
        .login-page .submit-item .ant-btn:active { transform: translateY(0); }
        
        .account-activation { 
          display: flex; 
          align-items: center; 
          justify-content: center; 
          gap: 7px; 
          margin-top: clamp(14px, 2.2vh, 22px); 
          color: #8f858b; 
          font-family: Arial, "Helvetica Neue", sans-serif; 
          font-size: 12px; 
          font-weight: 400; 
          letter-spacing: .005em; 
        }
        .account-activation a { color: var(--accent-deep); font-family: inherit; font-size: 12px; font-weight: 600; text-decoration: underline; text-decoration-color: rgba(168,59,101,.35); text-underline-offset: 3px; }
        .login-footer { color: #b2abb0; font-size: 11px; letter-spacing: .02em; text-align: center; margin-top: clamp(18px, 3vh, 32px); }

        .login-brand {
          grid-column: 1; grid-row: 1; position: relative; isolation: isolate;
          min-width: 0; height: 100%; min-height: 0; overflow: hidden; display: grid; place-items: center; padding: clamp(24px, 4vw, 48px);
          background: #ad285b;
        }
        .login-brand::before {
          content: "";
          position: absolute;
          inset: 0;
          background: 
            radial-gradient(circle at 10% 10%, rgba(255, 255, 255, 0.08) 0%, transparent 45%),
            radial-gradient(circle at 90% 90%, rgba(220, 62, 124, 0.2) 0%, transparent 50%),
            linear-gradient(135deg, #dc3e7c 0%, #ad285b 50%, #801440 100%);
          z-index: -2;
        }

        .css-geometric-bg {
          position: absolute;
          inset: 0;
          z-index: -1;
          pointer-events: none;
          overflow: hidden;
        }
        .geo-svg { position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none; }

        .brand-copy { 
          position: relative; 
          z-index: 1; 
          display: flex; 
          flex-direction: column; 
          align-items: center; 
          justify-content: center; 
          gap: clamp(14px, 2.5vh, 24px); 
          width: min(65%, 385px); 
        }
        .brand-copy::before, .brand-copy::after { display: none; }
        .hero-logo-frame { 
          position: relative; 
          z-index: 1; 
          display: grid; 
          place-items: center; 
          width: 65%; 
          aspect-ratio: 1; 
          padding: 13%; 
          border-radius: 50%; 
          background: #fff; 
          box-shadow: 0 26px 55px rgba(92,15,46,.27), inset 0 0 0 12px #fce6ef; 
        }
        .hero-logo-frame img { width: 100%; height: 100%; object-fit: contain; }
        .brand-caption {
          margin-top: clamp(12px, 2vh, 34px);
          font-family: Georgia, "Playfair Display", "Times New Roman", serif;
          font-size: clamp(60px, 6vw, 120px);
          font-weight: 900;
          line-height: .82;
          letter-spacing: .08em;
          text-transform: uppercase;
          background: linear-gradient(180deg, #ffffff 12%, #ffe3ed 58%, #f4a2c0 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          filter: drop-shadow(0 7px 15px rgba(92, 15, 46, .42));
          text-align: center;
          text-shadow: 0 1px 0 rgba(255,255,255,.28);
        }
        .login-page *:focus-visible { outline: 3px solid rgba(207,92,137,.34); outline-offset: 3px; }

        /* ── RESPONSIVE FLUID SCALING (MOBILE / TABLET PORTRAIT) ── */
        @media (max-width: 900px) {
          .login-page {
            display: flex;
            flex-direction: column;
            background: linear-gradient(to bottom, #fff8fb 0%, #fbeff3 100%);
            height: auto;
            min-height: 100dvh;
            overflow-y: auto;
          }
          .login-brand {
            order: 1;
            flex: 0 0 auto;
            height: clamp(190px, 28dvh, 290px);
            min-height: 180px;
            padding: clamp(16px, 4vw, 32px);
            border-radius: 0 0 clamp(32px, 8vw, 48px) clamp(32px, 8vw, 48px);
            box-shadow: 0 10px 30px rgba(173, 40, 91, 0.12);
          }
          .brand-copy {
            width: clamp(120px, 35vw, 170px);
            gap: clamp(8px, 1.5vh, 16px);
          }
          .hero-logo-frame {
            width: 100%;
            padding: 12%;
            box-shadow: 0 16px 36px rgba(92,15,46,.22), inset 0 0 0 8px #fce6ef;
          }
          .brand-caption {
            display: none;
          }
          .login-panel {
            order: 2;
            flex: 1 1 auto;
            height: auto;
            min-height: 0;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: flex-start;
            padding: 0 clamp(16px, 4vw, 24px) clamp(24px, 4vh, 40px);
            margin-top: clamp(-55px, -6dvh, -35px);
            z-index: 10;
            overflow: visible;
            background: transparent;
          }
          .login-form-wrap {
            width: min(92%, 420px);
            padding: clamp(26px, 5.5vw, 38px) clamp(20px, 4.5vw, 30px) clamp(22px, 4.5vw, 30px);
            border-radius: clamp(18px, 4vw, 28px);
            box-shadow: 0 18px 45px rgba(174, 40, 91, 0.1);
            background: rgba(255,255,255,0.96);
            backdrop-filter: blur(12px);
          }
          .login-form-wrap::before {
            display: none;
          }
          .login-heading {
            margin-bottom: clamp(18px, 3.5vh, 28px);
          }
          .login-heading h2 {
            font-size: clamp(24px, 6vw, 32px);
          }
          .account-activation {
            margin-top: clamp(14px, 2.5vh, 20px);
          }
        }

        /* ── SHORT SCREEN / LANDSCAPE LAPTOPS OPTIMIZATION ── */
        @media (min-width: 901px) and (max-height: 700px) {
          .login-panel {
            padding: 16px;
          }
          .login-form-wrap {
            width: min(92%, 390px);
            padding: 24px 30px 20px;
          }
          .login-heading {
            margin-bottom: 16px;
          }
          .login-heading h2 {
            font-size: 28px;
          }
          .login-page .ant-form-item {
            margin-bottom: 12px;
          }
          .login-page .ant-input-affix-wrapper,
          .login-page .submit-item .ant-btn {
            height: 44px;
          }
          .login-actions {
            margin: 0 0 14px;
          }
          .account-activation {
            margin-top: 12px;
          }
          .login-footer {
            margin-top: 14px;
          }
        }

        /* ── ULTRA SILKY SMOOTH SPLIT DOOR REVEAL ── */
        .login-split-active {
          pointer-events: none;
          background: linear-gradient(135deg, #fff5f8 0%, #f8f9fa 50%, #fbeff3 100%) !important;
        }
        .login-split-active .login-brand {
          animation: splitLeft 0.42s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          will-change: transform;
        }
        .login-split-active .login-panel {
          animation: splitRight 0.42s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          will-change: transform;
        }
        .login-split-active .login-form-wrap {
          animation: fadeZoomOut 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          will-change: transform, opacity, filter;
        }

        @keyframes splitLeft {
          0% { transform: translateX(0); }
          100% { transform: translateX(-100%); }
        }
        @keyframes splitRight {
          0% { transform: translateX(0); }
          100% { transform: translateX(100%); }
        }
        @keyframes fadeZoomOut {
          0% { transform: scale(1); opacity: 1; filter: blur(0px); }
          100% { transform: scale(0.95); opacity: 0; filter: blur(4px); }
        }

        @media (max-width: 900px) {
          .login-split-active .login-brand {
            animation: splitUpMobile 0.42s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          }
          .login-split-active .login-panel {
            animation: splitDownMobile 0.42s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          }
        }

        @keyframes splitUpMobile {
          0% { transform: translateY(0); }
          100% { transform: translateY(-100%); }
        }
        @keyframes splitDownMobile {
          0% { transform: translateY(0); }
          100% { transform: translateY(100%); }
        }
      `}</style>
    </main>
  );
};

export default LoginPage;
