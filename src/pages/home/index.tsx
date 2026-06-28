import React from "react";
import LotusChanRadial from "@/components/home/LotusChanRadial";

const HomePage = () => {

    return (
        <div
            style={{
                position: "relative",
                width: "100%",
                flex: 1,
                minHeight: "calc(100vh - 111px)",
                backgroundImage: "url('/logo/backgroundlotus.png')",
                backgroundSize: "cover",
                backgroundPosition: "center",
                backgroundRepeat: "no-repeat",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "center",
                margin: 0,
                padding: 0,
                overflowX: "hidden",
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
                                filter: "drop-shadow(0px 4px 8px rgba(236, 72, 153, 0.2))"
                            }}
                        />
                    </div>
                </div>

                {/* HRM Text Section */}
                <div className="hrm-text-container">
                    <h1 className="hrm-text">HUMAN RESOURCE MANAGEMENT</h1>
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

            {/* Lotus-chan Assistant FAB */}
            <div style={{ position: "fixed", bottom: 15, right: -15, zIndex: 1000 }}>
                <LotusChanRadial />
            </div>

            {/* Animation styles */}
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;700;900&family=Playfair+Display:ital,wght@0,600;1,600&display=swap');

                :root {
                    --logo-size: clamp(140px, 15vw, 240px);
                    --orbital-size: clamp(130px, 14vw, 220px);
                    --hrm-font-size: clamp(52px, 9vw, 120px);
                    --hrm-letter-spacing: clamp(10px, 2.5vw, 20px);
                    --content-gap: clamp(20px, 2.5vw, 40px);
                }

                .main-content {
                    position: relative;
                    z-index: 10;
                    text-align: center;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: var(--content-gap);
                    padding: clamp(16px, 4vw, 40px) clamp(16px, 5vw, 40px);
                    max-width: 100%;
                    box-sizing: border-box;
                }

                .logo-container {
                    position: relative;
                    width: var(--logo-size);
                    height: var(--logo-size);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: rgba(255, 255, 255, 0.85);
                    backdrop-filter: blur(20px);
                    border-radius: 50%;
                    padding: clamp(20px, 4vw, 40px);
                    border: 2px solid rgba(236, 72, 153, 0.15);
                    box-shadow: 0 15px 40px rgba(236, 72, 153, 0.15),
                                inset 0 0 30px rgba(255, 255, 255, 0.9);
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
                    height: 2px;
                    background: linear-gradient(90deg, transparent 0%, #db2777 50%, transparent 100%);
                    border-radius: 2px;
                    animation: fadeIn 1s ease-out 1s both;
                    opacity: 0.5;
                }

                .hrm-text {
                    position: relative;
                    margin: 0;
                    font-size: clamp(12px, 1.5vw, 18px);
                    font-weight: 700;
                    letter-spacing: 4px;
                    font-family: 'Montserrat', 'Helvetica Neue', Arial, sans-serif;
                    color: #9d174d;
                    text-transform: uppercase;
                    animation: fadeInUp 1s ease-out 0.3s both;
                    line-height: 1;
                    z-index: 1;
                    white-space: nowrap;
                    text-shadow: 0 4px 15px rgba(236, 72, 153, 0.3);
                }

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

                @keyframes floatLogo {
                    0%, 100% { transform: translateY(0); }
                    50%      { transform: translateY(-10px); }
                }

                @keyframes shadowScale {
                    0%, 100% { transform: translateX(-50%) scale(1); opacity: 0.6; }
                    50%      { transform: translateX(-50%) scale(0.8); opacity: 0.3; }
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

                @media (max-width: 768px) {
                    :root {
                        --logo-size: clamp(140px, 30vw, 210px);
                        --orbital-size: clamp(150px, 34vw, 225px);
                        --hrm-font-size: clamp(52px, 16vw, 96px);
                        --hrm-letter-spacing: clamp(6px, 2vw, 14px);
                        --content-gap: clamp(20px, 4vw, 36px);
                    }
                    .gradient-orb-1,
                    .gradient-orb-2 {
                        width: 250px !important;
                        height: 250px !important;
                    }
                    .logo-container {
                        padding: clamp(16px, 3vw, 28px);
                    }
                    .particle {
                        display: none;
                    }
                }

                @media (max-width: 480px) {
                    :root {
                        --logo-size: clamp(112px, 34vw, 150px);
                        --orbital-size: clamp(125px, 40vw, 180px);
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

                @media (max-width: 360px) {
                    :root {
                        --hrm-font-size: 44px;
                        --hrm-letter-spacing: 4px;
                        --logo-size: 104px;
                        --orbital-size: 122px;
                    }
                }

                @media (max-height: 500px) and (orientation: landscape) {
                    :root {
                        --logo-size: 86px;
                        --orbital-size: 108px;
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

                @media (max-width: 320px) {
                    :root {
                        --hrm-font-size: 40px;
                        --hrm-letter-spacing: 3px;
                        --logo-size: 92px;
                        --orbital-size: 110px;
                        --content-gap: 16px;
                    }
                }
            `}</style>
        </div>
    );
};

export default HomePage;
