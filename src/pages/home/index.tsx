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
                width: "100vw",
                height: "100vh",
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
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundImage: "linear-gradient(rgba(236, 72, 153, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(236, 72, 153, 0.03) 1px, transparent 1px)",
                    backgroundSize: "60px 60px",
                    pointerEvents: "none",
                    animation: "gridMove 30s linear infinite",
                    opacity: 0.4,
                }}
            />

            {/* Gradient orbs - very subtle */}
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
                    animation: "float 20s ease-in-out infinite",
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
                    animation: "float 25s ease-in-out infinite 5s",
                    pointerEvents: "none",
                }}
            />

            {/* Main Content Container */}
            <div
                style={{
                    position: "relative",
                    zIndex: 10,
                    textAlign: "center",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "clamp(30px, 5vw, 50px)",
                    padding: "20px",
                }}
            >
                {/* Logo Section */}
                <div
                    style={{
                        position: "relative",
                        animation: "fadeInScale 1s ease-out",
                    }}
                >
                    {/* Logo container with glass effect */}
                    <div
                        className="logo-container"
                        style={{
                            position: "relative",
                            width: "clamp(120px, 25vw, 180px)",
                            height: "clamp(120px, 25vw, 180px)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            background: "rgba(255, 255, 255, 0.7)",
                            backdropFilter: "blur(20px)",
                            borderRadius: "50%",
                            padding: "clamp(18px, 4vw, 28px)",
                            border: "2px solid rgba(236, 72, 153, 0.2)",
                            boxShadow: "0 20px 60px rgba(236, 72, 153, 0.15), inset 0 0 40px rgba(255, 255, 255, 0.8)",
                            zIndex: 1,
                        }}
                    >
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
                    <div
                        className="orbital-ring"
                        style={{
                            position: "absolute",
                            top: "50%",
                            left: "50%",
                            width: "clamp(160px, 33vw, 240px)",
                            height: "clamp(160px, 33vw, 240px)",
                            transform: "translate(-50%, -50%)",
                            border: "2px solid rgba(236, 72, 153, 0.15)",
                            borderRadius: "50%",
                            borderTopColor: "#ec4899",
                            animation: "rotate 15s linear infinite",
                            zIndex: 0,
                        }}
                    />

                    {/* Pulsing ring */}
                    <div
                        style={{
                            position: "absolute",
                            top: "-10px",
                            left: "-10px",
                            right: "-10px",
                            bottom: "-10px",
                            borderRadius: "50%",
                            border: "2px solid rgba(236, 72, 153, 0.2)",
                            animation: "pulseRing 3s ease-out infinite",
                            zIndex: 0,
                        }}
                    />
                </div>

                {/* HRM Text Section */}
                <div
                    className="hrm-text-container"
                    style={{
                        position: "relative",
                        padding: "0 20px",
                        width: "100%",
                        maxWidth: "90vw",
                    }}
                >
                    {/* Main HRM text with new font */}
                    <h1
                        className="hrm-text"
                        style={{
                            position: "relative",
                            margin: 0,
                            fontSize: "clamp(60px, 15vw, 120px)",
                            fontWeight: 700,
                            letterSpacing: "clamp(8px, 2vw, 20px)",
                            fontFamily: "'Montserrat', 'Helvetica Neue', Arial, sans-serif",
                            background: "linear-gradient(135deg, #db2777 0%, #ec4899 50%, #f472b6 100%)",
                            WebkitBackgroundClip: "text",
                            WebkitTextFillColor: "transparent",
                            animation: "fadeInUp 1s ease-out 0.3s both, textShine 3s ease-in-out infinite",
                            lineHeight: 1,
                            filter: "drop-shadow(0 10px 30px rgba(236, 72, 153, 0.2))",
                            zIndex: 1,
                        }}
                    >
                        HRM
                    </h1>

                    {/* Decorative corners */}
                    <div
                        className="corner corner-tl"
                        style={{
                            position: "absolute",
                            top: "clamp(-20px, -3vw, -30px)",
                            left: "0",
                            width: "clamp(30px, 5vw, 50px)",
                            height: "clamp(30px, 5vw, 50px)",
                            borderTop: "3px solid #ec4899",
                            borderLeft: "3px solid #ec4899",
                            animation: "fadeIn 1s ease-out 1s both",
                            opacity: 0.6,
                        }}
                    />
                    <div
                        className="corner corner-tr"
                        style={{
                            position: "absolute",
                            top: "clamp(-20px, -3vw, -30px)",
                            right: "0",
                            width: "clamp(30px, 5vw, 50px)",
                            height: "clamp(30px, 5vw, 50px)",
                            borderTop: "3px solid #ec4899",
                            borderRight: "3px solid #ec4899",
                            animation: "fadeIn 1s ease-out 1.2s both",
                            opacity: 0.6,
                        }}
                    />
                    <div
                        className="corner corner-bl"
                        style={{
                            position: "absolute",
                            bottom: "clamp(-20px, -3vw, -30px)",
                            left: "0",
                            width: "clamp(30px, 5vw, 50px)",
                            height: "clamp(30px, 5vw, 50px)",
                            borderBottom: "3px solid #ec4899",
                            borderLeft: "3px solid #ec4899",
                            animation: "fadeIn 1s ease-out 1.4s both",
                            opacity: 0.6,
                        }}
                    />
                    <div
                        className="corner corner-br"
                        style={{
                            position: "absolute",
                            bottom: "clamp(-20px, -3vw, -30px)",
                            right: "0",
                            width: "clamp(30px, 5vw, 50px)",
                            height: "clamp(30px, 5vw, 50px)",
                            borderBottom: "3px solid #ec4899",
                            borderRight: "3px solid #ec4899",
                            animation: "fadeIn 1s ease-out 1.6s both",
                            opacity: 0.6,
                        }}
                    />
                </div>

                {/* Elegant divider */}
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "clamp(15px, 3vw, 20px)",
                        animation: "fadeIn 1s ease-out 1.8s both",
                    }}
                >
                    <div
                        style={{
                            width: "clamp(50px, 10vw, 80px)",
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
                        }}
                    />
                    <div
                        style={{
                            width: "clamp(50px, 10vw, 80px)",
                            height: "2px",
                            background: "linear-gradient(90deg, #ec4899 0%, transparent 100%)",
                        }}
                    />
                </div>
            </div>

            {/* Floating particles - minimal */}
            {[...Array(12)].map((_, i) => (
                <div
                    key={i}
                    className="particle"
                    style={{
                        position: "absolute",
                        width: `${Math.random() * 3 + 2}px`,
                        height: `${Math.random() * 3 + 2}px`,
                        background: "#ec4899",
                        borderRadius: "50%",
                        left: `${Math.random() * 100}%`,
                        top: `${Math.random() * 100}%`,
                        animation: `floatParticle ${Math.random() * 15 + 15}s ease-in-out infinite ${Math.random() * 5}s`,
                        opacity: Math.random() * 0.3 + 0.1,
                        boxShadow: "0 0 8px rgba(236, 72, 153, 0.4)",
                    }}
                />
            ))}

            {/* Animation styles */}
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@700;900&display=swap');

                @keyframes fadeInScale {
                    from {
                        opacity: 0;
                        transform: scale(0.7);
                    }
                    to {
                        opacity: 1;
                        transform: scale(1);
                    }
                }

                @keyframes fadeInUp {
                    from {
                        opacity: 0;
                        transform: translateY(40px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                @keyframes fadeIn {
                    from {
                        opacity: 0;
                    }
                    to {
                        opacity: 1;
                    }
                }

                @keyframes pulse {
                    0%, 100% {
                        opacity: 0.6;
                        transform: scale(1);
                    }
                    50% {
                        opacity: 1;
                        transform: scale(1.2);
                    }
                }

                @keyframes pulseRing {
                    0% {
                        transform: scale(1);
                        opacity: 0.5;
                    }
                    50% {
                        transform: scale(1.1);
                        opacity: 0.2;
                    }
                    100% {
                        transform: scale(1.2);
                        opacity: 0;
                    }
                }

                @keyframes rotate {
                    from {
                        transform: translate(-50%, -50%) rotate(0deg);
                    }
                    to {
                        transform: translate(-50%, -50%) rotate(360deg);
                    }
                }

                @keyframes textShine {
                    0%, 100% {
                        filter: drop-shadow(0 10px 30px rgba(236, 72, 153, 0.2));
                    }
                    50% {
                        filter: drop-shadow(0 10px 40px rgba(236, 72, 153, 0.35));
                    }
                }

                @keyframes gridMove {
                    0% {
                        transform: translateY(0);
                    }
                    100% {
                        transform: translateY(60px);
                    }
                }

                @keyframes float {
                    0%, 100% {
                        transform: translate(0, 0);
                    }
                    50% {
                        transform: translate(-20px, -30px);
                    }
                }

                @keyframes floatParticle {
                    0%, 100% {
                        transform: translate(0, 0);
                        opacity: 0.1;
                    }
                    50% {
                        transform: translate(30px, -60px);
                        opacity: 0.4;
                    }
                }

                /* Responsive adjustments */
                @media (max-width: 768px) {
                    .gradient-orb-1,
                    .gradient-orb-2 {
                        width: 250px !important;
                        height: 250px !important;
                    }

                    .particle {
                        display: none;
                    }
                }

                @media (max-width: 480px) {
                    .gradient-orb-1 {
                        top: 5% !important;
                        right: 5% !important;
                        width: 200px !important;
                        height: 200px !important;
                    }

                    .gradient-orb-2 {
                        bottom: 5% !important;
                        left: 5% !important;
                        width: 200px !important;
                        height: 200px !important;
                    }

                    .corner {
                        border-width: 2px !important;
                    }
                }

                /* Landscape mobile */
                @media (max-height: 600px) and (orientation: landscape) {
                    .logo-container {
                        width: 100px !important;
                        height: 100px !important;
                    }

                    .orbital-ring {
                        width: 140px !important;
                        height: 140px !important;
                    }

                    .hrm-text {
                        font-size: 70px !important;
                        letter-spacing: 10px !important;
                    }
                }
            `}</style>
        </div>
    );
};

export default HomePage;