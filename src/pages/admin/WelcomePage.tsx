import { useAppSelector } from "@/redux/hooks";

const WelcomePage = () => {
    const user = useAppSelector((state) => state.account?.user);
    const name = user?.name || user?.email || "bạn";

    return (
        <div
            style={{
                position: "relative",
                minHeight: "86vh",
                width: "100%",
                background: "#ffffff",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "center",
                overflow: "hidden",
            }}
        >
            {/* Background blobs */}
            <div style={{
                position: "absolute",
                top: "-120px", right: "-120px",
                width: "600px", height: "600px",
                background: "radial-gradient(circle, rgba(236,72,153,0.07) 0%, transparent 65%)",
                borderRadius: "50%",
                pointerEvents: "none",
            }} />
            <div style={{
                position: "absolute",
                bottom: "-120px", left: "-80px",
                width: "500px", height: "500px",
                background: "radial-gradient(circle, rgba(244,114,182,0.05) 0%, transparent 65%)",
                borderRadius: "50%",
                pointerEvents: "none",
            }} />

            {/* Main content */}
            <div className="wlc-main">

                {/* Logo tròn */}
                <div
                    className="wlc-logo-wrap"
                    style={{ animation: "fadeInScale 0.9s cubic-bezier(0.34,1.56,0.64,1) both" }}
                >
                    <img
                        src="/logo/LOGOFINAL.png"
                        alt="LOTUS HRM"
                        style={{ width: "100%", height: "auto", objectFit: "contain", display: "block" }}
                    />
                </div>

                {/* Tag line */}
                <p className="wlc-tag" style={{ animation: "fadeInUp 0.6s ease-out 0.3s both" }}>
                    BỘ HỒ SƠ QUẢN TRỊ NHÂN SỰ
                </p>

                {/* Divider */}
                <div className="wlc-rule" style={{ animation: "scaleX 0.6s ease-out 0.45s both" }} />

                {/* Big title — chỉ HRM */}
                <div style={{ animation: "fadeInUp 0.8s ease-out 0.55s both", textAlign: "center" }}>
                    <h1 className="wlc-title">
                        <span className="wlc-hrm">HRM</span>
                    </h1>
                </div>

                {/* Greeting */}
                <p className="wlc-greeting" style={{ animation: "fadeIn 0.8s ease-out 0.8s both" }}>
                    Chào mừng&nbsp;<strong>{name}</strong>&nbsp;đến với hệ thống
                </p>

            </div>

            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@700;900&family=DM+Sans:wght@300;400;500&display=swap');

                .wlc-main {
                    position: relative;
                    z-index: 10;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: clamp(10px, 1.8vw, 20px);
                    padding: clamp(20px, 4vw, 48px);
                    text-align: center;
                    max-width: 100vw;
                    box-sizing: border-box;
                }

                .wlc-logo-wrap {
                    width: clamp(100px, 13vw, 148px);
                    height: clamp(100px, 13vw, 148px);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: #fff;
                    border-radius: 50%;
                    padding: clamp(14px, 2vw, 24px);
                    border: 1.5px solid rgba(236,72,153,0.22);
                    box-shadow:
                        0 0 0 6px rgba(236,72,153,0.05),
                        0 8px 32px rgba(236,72,153,0.12);
                    box-sizing: border-box;
                }

                .wlc-tag {
                    margin: 0;
                    font-family: 'DM Sans', sans-serif;
                    font-size: clamp(9px, 0.9vw, 11px);
                    font-weight: 500;
                    letter-spacing: 4px;
                    text-transform: uppercase;
                    color: #e879a8;
                    opacity: 0.75;
                }

                .wlc-rule {
                    width: clamp(36px, 6vw, 64px);
                    height: 1.5px;
                    background: linear-gradient(90deg, transparent, #ec4899 40%, #ec4899 60%, transparent);
                    transform-origin: center;
                }

                .wlc-title {
                    margin: 0;
                    font-family: 'Montserrat', 'Helvetica Neue', Arial, sans-serif;
                    font-size: clamp(56px, 11vw, 110px);
                    font-weight: 900;
                    letter-spacing: clamp(1px, 0.4vw, 3px);
                    line-height: 1;
                    white-space: nowrap;
                }

                .wlc-hrm {
                    background: linear-gradient(130deg, #be185d 0%, #ec4899 60%, #f472b6 100%);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                }

                .wlc-greeting {
                    margin: 0;
                    font-family: 'DM Sans', sans-serif;
                    font-size: clamp(13px, 1.4vw, 16px);
                    font-weight: 300;
                    color: #a8a29e;
                    letter-spacing: 0.2px;
                }

                .wlc-greeting strong {
                    font-weight: 600;
                    color: #db2777;
                }

                @keyframes fadeInScale {
                    from { opacity: 0; transform: scale(0.80); }
                    to   { opacity: 1; transform: scale(1); }
                }
                @keyframes fadeInUp {
                    from { opacity: 0; transform: translateY(16px); }
                    to   { opacity: 1; transform: translateY(0); }
                }
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to   { opacity: 1; }
                }
                @keyframes scaleX {
                    from { opacity: 0; transform: scaleX(0); }
                    to   { opacity: 1; transform: scaleX(1); }
                }

                @media (max-width: 480px) {
                    .wlc-title { white-space: normal; }
                }
            `}</style>
        </div>
    );
};

export default WelcomePage;