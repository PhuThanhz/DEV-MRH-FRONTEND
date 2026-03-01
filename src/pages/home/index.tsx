import { useNavigate } from "react-router-dom";

const HomePage = () => {
    const navigate = useNavigate();

    return (
        <div
            style={{
                position: "fixed",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                width: "100%",
                height: "100%",
                background: "linear-gradient(135deg, #ffffff 0%, #fff5f7 50%, #ffe4e6 100%)",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "center",
                overflow: "hidden",
                margin: 0,
                padding: 0,
            }}
        >
            {/* Subtle animated grid */}
            <div
                style={{
                    position: "absolute",
                    inset: 0,
                    backgroundImage:
                        "linear-gradient(rgba(236, 72, 153, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(236, 72, 153, 0.03) 1px, transparent 1px)",
                    backgroundSize: "60px 60px",
                    pointerEvents: "none",
                    animation: "gridMove 30s linear infinite",
                    opacity: 0.4,
                }}
            />

            {/* Gradient orbs */}
            <div
                className="gradient-orb-1"
                style={{
                    position: "absolute",
                    top: "10%",
                    right: "15%",
                    width: "400px",
                    height: "400px",
                    background: "radial-gradient(circle, rgba(236, 72, 153, 0.08) 0%, transparent 70%)",
                    borderRadius: "50%",
                    filter: "blur(60px)",
                    animation: "floatOrb 20s ease-in-out infinite",
                    pointerEvents: "none",
                }}
            />
            <div
                className="gradient-orb-2"
                style={{
                    position: "absolute",
                    bottom: "15%",
                    left: "10%",
                    width: "450px",
                    height: "450px",
                    background: "radial-gradient(circle, rgba(244, 114, 182, 0.06) 0%, transparent 70%)",
                    borderRadius: "50%",
                    filter: "blur(70px)",
                    animation: "floatOrb 25s ease-in-out infinite 5s",
                    pointerEvents: "none",
                }}
            />

            {/* Main Content Container */}
            <div className="main-content">
                {/* Logo Section */}
                <div
                    style={{
                        position: "relative",
                        animation: "fadeInScale 1s ease-out",
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                    }}
                >
                    <div className="logo-container">
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

                    {/* Orbital ring */}
                    <div className="orbital-ring" />

                    {/* Pulsing ring */}
                    <div
                        style={{
                            position: "absolute",
                            inset: "-10px",
                            borderRadius: "50%",
                            border: "2px solid rgba(236, 72, 153, 0.2)",
                            animation: "pulseRing 3s ease-out infinite",
                            zIndex: 0,
                        }}
                    />
                </div>

                {/* HRM Text Section */}
                <div className="hrm-text-container">
                    <h1 className="hrm-text">HRM</h1>
                </div>

                {/* Elegant divider */}
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "clamp(12px, 3vw, 20px)",
                        animation: "fadeIn 1s ease-out 1.8s both",
                    }}
                >
                    <div
                        style={{
                            width: "clamp(40px, 8vw, 80px)",
                            height: "2px",
                            background: "linear-gradient(90deg, transparent 0%, #ec4899 100%)",
                        }}
                    />
                    <div
                        style={{
                            width: "8px",
                            height: "8px",
                            background: "#ec4899",
                            borderRadius: "50%",
                            boxShadow: "0 0 15px rgba(236, 72, 153, 0.6)",
                            animation: "pulse 2s ease-in-out infinite",
                            flexShrink: 0,
                        }}
                    />
                    <div
                        style={{
                            width: "clamp(40px, 8vw, 80px)",
                            height: "2px",
                            background: "linear-gradient(90deg, #ec4899 0%, transparent 100%)",
                        }}
                    />
                </div>
            </div>

            {/* Floating particles */}
            {[...Array(12)].map((_, i) => (
                <div
                    key={i}
                    className="particle"
                    style={{
                        position: "absolute",
                        width: `${(i % 3) + 2}px`,
                        height: `${(i % 3) + 2}px`,
                        background: "#ec4899",
                        borderRadius: "50%",
                        left: `${(i * 8.5) % 100}%`,
                        top: `${(i * 13.7) % 100}%`,
                        animation: `floatParticle ${15 + (i % 5) * 3}s ease-in-out infinite ${(i % 5)}s`,
                        opacity: 0.1 + (i % 3) * 0.1,
                        boxShadow: "0 0 8px rgba(236, 72, 153, 0.4)",
                        pointerEvents: "none",
                    }}
                />
            ))}

            {/* Animation styles */}
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@700;900&display=swap');

                /* ===================== */
                /*   CSS Custom Props    */
                /* ===================== */
                :root {
                    --logo-size: clamp(100px, 20vw, 180px);
                    --orbital-size: clamp(140px, 28vw, 240px);
                    --hrm-font-size: clamp(52px, 13vw, 120px);
                    --hrm-letter-spacing: clamp(6px, 1.5vw, 20px);
                    --content-gap: clamp(24px, 4vw, 50px);
                }

                /* ===================== */
                /*   Main Layout         */
                /* ===================== */
                .main-content {
                    position: relative;
                    z-index: 10;
                    text-align: center;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: var(--content-gap);
                    padding: clamp(16px, 4vw, 40px) clamp(16px, 5vw, 40px);
                    max-width: 100vw;
                    box-sizing: border-box;
                }

                /* ===================== */
                /*   Logo               */
                /* ===================== */
                .logo-container {
                    position: relative;
                    width: var(--logo-size);
                    height: var(--logo-size);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: rgba(255, 255, 255, 0.7);
                    backdrop-filter: blur(20px);
                    border-radius: 50%;
                    padding: clamp(14px, 3.5vw, 28px);
                    border: 2px solid rgba(236, 72, 153, 0.2);
                    box-shadow: 0 20px 60px rgba(236, 72, 153, 0.15),
                                inset 0 0 40px rgba(255, 255, 255, 0.8);
                    z-index: 1;
                    box-sizing: border-box;
                }

                .orbital-ring {
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    width: var(--orbital-size);
                    height: var(--orbital-size);
                    transform: translate(-50%, -50%);
                    border: 2px solid rgba(236, 72, 153, 0.15);
                    border-radius: 50%;
                    border-top-color: #ec4899;
                    animation: rotate 15s linear infinite;
                    z-index: 0;
                }

                /* ===================== */
                /*   HRM Text           */
                /* ===================== */
                .hrm-text-container {
                    position: relative;
                    padding: 0 clamp(8px, 2vw, 20px);
                    width: 100%;
                    max-width: min(90vw, 600px);
                    box-sizing: border-box;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 12px;
                }

                .hrm-underline {
                    width: 60%;
                    height: 3px;
                    background: linear-gradient(90deg, transparent 0%, #ec4899 50%, transparent 100%);
                    border-radius: 2px;
                    animation: fadeIn 1s ease-out 1s both;
                    opacity: 0.7;
                }

                .hrm-text {
                    position: relative;
                    margin: 0;
                    font-size: var(--hrm-font-size);
                    font-weight: 700;
                    letter-spacing: var(--hrm-letter-spacing);
                    font-family: 'Montserrat', 'Helvetica Neue', Arial, sans-serif;
                    background: linear-gradient(135deg, #db2777 0%, #ec4899 50%, #f472b6 100%);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                    animation: fadeInUp 1s ease-out 0.3s both, textShine 3s ease-in-out infinite;
                    line-height: 1;
                    filter: drop-shadow(0 10px 30px rgba(236, 72, 153, 0.2));
                    z-index: 1;
                    white-space: nowrap;
                }



                /* ===================== */
                /*   Keyframes          */
                /* ===================== */
                @keyframes fadeInScale {
                    from { opacity: 0; transform: scale(0.7); }
                    to   { opacity: 1; transform: scale(1); }
                }

                @keyframes fadeInUp {
                    from { opacity: 0; transform: translateY(40px); }
                    to   { opacity: 1; transform: translateY(0); }
                }

                @keyframes fadeIn {
                    from { opacity: 0; }
                    to   { opacity: 1; }
                }

                @keyframes pulse {
                    0%, 100% { opacity: 0.6; transform: scale(1); }
                    50%      { opacity: 1;   transform: scale(1.2); }
                }

                @keyframes pulseRing {
                    0%   { transform: scale(1);   opacity: 0.5; }
                    50%  { transform: scale(1.1); opacity: 0.2; }
                    100% { transform: scale(1.2); opacity: 0; }
                }

                @keyframes rotate {
                    from { transform: translate(-50%, -50%) rotate(0deg); }
                    to   { transform: translate(-50%, -50%) rotate(360deg); }
                }

                @keyframes textShine {
                    0%, 100% { filter: drop-shadow(0 10px 30px rgba(236, 72, 153, 0.2)); }
                    50%      { filter: drop-shadow(0 10px 40px rgba(236, 72, 153, 0.35)); }
                }

                @keyframes gridMove {
                    0%   { transform: translateY(0); }
                    100% { transform: translateY(60px); }
                }

                @keyframes floatOrb {
                    0%, 100% { transform: translate(0, 0); }
                    50%      { transform: translate(-20px, -30px); }
                }

                @keyframes floatParticle {
                    0%, 100% { transform: translate(0, 0);    opacity: 0.1; }
                    50%      { transform: translate(30px, -60px); opacity: 0.4; }
                }

                /* ===================== */
                /*   Responsive          */
                /* ===================== */

                /* Tablet portrait */
                @media (max-width: 768px) {
                    :root {
                        --logo-size: clamp(90px, 22vw, 140px);
                        --orbital-size: clamp(125px, 30vw, 195px);
                        --hrm-font-size: clamp(52px, 16vw, 96px);
                        --hrm-letter-spacing: clamp(6px, 2vw, 14px);
                        --content-gap: clamp(20px, 4vw, 36px);
                    }

                    .gradient-orb-1,
                    .gradient-orb-2 {
                        width: 250px !important;
                        height: 250px !important;
                    }

                    .particle {
                        display: none;
                    }
                }

                /* Mobile portrait */
                @media (max-width: 480px) {
                    :root {
                        --logo-size: clamp(80px, 26vw, 120px);
                        --orbital-size: clamp(112px, 36vw, 165px);
                        --hrm-font-size: clamp(48px, 18vw, 80px);
                        --hrm-letter-spacing: clamp(5px, 2.5vw, 12px);
                        --content-gap: clamp(18px, 5vw, 28px);
                    }

                    .gradient-orb-1 {
                        top: 5% !important;
                        right: 5% !important;
                        width: 180px !important;
                        height: 180px !important;
                    }

                    .gradient-orb-2 {
                        bottom: 5% !important;
                        left: 5% !important;
                        width: 180px !important;
                        height: 180px !important;
                    }
                }

                /* Very small mobile (320px) */
                @media (max-width: 360px) {
                    :root {
                        --hrm-font-size: 44px;
                        --hrm-letter-spacing: 4px;
                        --logo-size: 80px;
                        --orbital-size: 110px;
                    }
                }

                /* Landscape mobile (height constrained) */
                @media (max-height: 500px) and (orientation: landscape) {
                    :root {
                        --logo-size: 70px;
                        --orbital-size: 100px;
                        --hrm-font-size: clamp(36px, 10vh, 60px);
                        --hrm-letter-spacing: 8px;
                        --content-gap: 12px;
                    }

                    .main-content {
                        flex-direction: row;
                        flex-wrap: wrap;
                        justify-content: center;
                        padding: 8px 20px;
                    }

                    .gradient-orb-1,
                    .gradient-orb-2 {
                        width: 150px !important;
                        height: 150px !important;
                    }

                    .particle {
                        display: none;
                    }
                }

                /* Tall narrow screens (e.g. Galaxy Fold) */
                @media (max-width: 320px) {
                    :root {
                        --hrm-font-size: 40px;
                        --hrm-letter-spacing: 3px;
                        --logo-size: 70px;
                        --orbital-size: 98px;
                        --content-gap: 16px;
                    }
                }
            `}</style>
        </div>
    );
};

export default HomePage;