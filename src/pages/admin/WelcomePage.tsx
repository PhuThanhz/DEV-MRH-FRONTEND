import { useAppSelector } from "@/redux/hooks";

const WelcomePage = () => {
    const user = useAppSelector((state) => state.account?.user);
    const name = user?.name || user?.email || "bạn";

    return (
        <div style={{
            minHeight: "86vh",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            textAlign: "center",
            position: "relative",
            overflow: "hidden",
            borderRadius: 20,
            background: "#fdf8f6",
            fontFamily: "'DM Sans', sans-serif",
        }}>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=DM+Sans:wght@300;400;500;600&display=swap');

                @keyframes riseIn {
                    from { opacity: 0; transform: translateY(20px); }
                    to   { opacity: 1; transform: translateY(0); }
                }
                @keyframes breathe {
                    0%,100% { transform: scale(1); opacity: 0.8; }
                    50%      { transform: scale(1.12); opacity: 1; }
                }
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to   { transform: rotate(360deg); }
                }
                @keyframes blink {
                    0%,100% { opacity: 0.6; transform: scale(1); }
                    50%      { opacity: 1;   transform: scale(1.6); }
                }
            `}</style>

            {/* Orb 1 — top right */}
            <div style={{
                position: "absolute", top: -80, right: -80,
                width: 380, height: 380, borderRadius: "50%",
                background: "radial-gradient(circle at 40% 40%, #fbcfe8 0%, #fce7f3 40%, transparent 72%)",
                pointerEvents: "none",
            }} />

            {/* Orb 2 — bottom left */}
            <div style={{
                position: "absolute", bottom: -80, left: -60,
                width: 300, height: 300, borderRadius: "50%",
                background: "radial-gradient(circle at 60% 60%, #f9a8d4 0%, #fce7f3 45%, transparent 72%)",
                pointerEvents: "none",
            }} />

            {/* Orb 3 — center glow */}
            <div style={{
                position: "absolute", top: "40%", left: "50%",
                transform: "translate(-50%, -50%)",
                width: 500, height: 300, borderRadius: "50%",
                background: "radial-gradient(ellipse, rgba(253,242,248,0.7) 0%, transparent 70%)",
                pointerEvents: "none",
            }} />

            {/* Top line */}
            <div style={{
                position: "absolute", top: 0, left: 0, right: 0, height: 2,
                background: "linear-gradient(90deg, transparent, #f9a8d4 25%, #ec4899 50%, #f9a8d4 75%, transparent)",
                borderRadius: "20px 20px 0 0",
                pointerEvents: "none",
            }} />

            {/* Corner marks */}
            <div style={{ position: "absolute", top: 24, left: 24, width: 28, height: 28, borderTop: "1px solid rgba(236,72,153,0.25)", borderLeft: "1px solid rgba(236,72,153,0.25)", pointerEvents: "none" }} />
            <div style={{ position: "absolute", top: 24, right: 24, width: 28, height: 28, borderTop: "1px solid rgba(236,72,153,0.25)", borderRight: "1px solid rgba(236,72,153,0.25)", pointerEvents: "none" }} />
            <div style={{ position: "absolute", bottom: 24, left: 24, width: 28, height: 28, borderBottom: "1px solid rgba(236,72,153,0.25)", borderLeft: "1px solid rgba(236,72,153,0.25)", pointerEvents: "none" }} />
            <div style={{ position: "absolute", bottom: 24, right: 24, width: 28, height: 28, borderBottom: "1px solid rgba(236,72,153,0.25)", borderRight: "1px solid rgba(236,72,153,0.25)", pointerEvents: "none" }} />

            {/* Content */}
            <div style={{
                position: "relative", zIndex: 1,
                display: "flex", flexDirection: "column", alignItems: "center",
                padding: "0 24px",
                animation: "riseIn 1s cubic-bezier(.22,1,.36,1) both",
            }}>

                {/* Logo */}
                <div style={{ position: "relative", width: 120, height: 120, marginBottom: 44 }}>
                    {/* Halo */}
                    <div style={{
                        position: "absolute", inset: -20, borderRadius: "50%",
                        background: "radial-gradient(circle, rgba(236,72,153,0.12) 0%, transparent 68%)",
                        animation: "breathe 5s ease-in-out infinite",
                    }} />
                    {/* Spinning ring */}
                    <svg
                        style={{ position: "absolute", inset: -14, animation: "spin 20s linear infinite" }}
                        viewBox="0 0 148 148" fill="none"
                    >
                        <circle cx="74" cy="74" r="70"
                            stroke="url(#rg)" strokeWidth="1"
                            strokeDasharray="180 240" strokeLinecap="round"
                        />
                        <defs>
                            <linearGradient id="rg" x1="0" y1="0" x2="148" y2="148" gradientUnits="userSpaceOnUse">
                                <stop offset="0%" stopColor="#ec4899" stopOpacity="0.5" />
                                <stop offset="100%" stopColor="#f9a8d4" stopOpacity="0.08" />
                            </linearGradient>
                        </defs>
                    </svg>
                    {/* Circle */}
                    <div style={{
                        position: "absolute", inset: 0, borderRadius: "50%",
                        background: "#fff",
                        border: "1px solid rgba(236,72,153,0.18)",
                        boxShadow: "0 0 0 8px rgba(236,72,153,0.04), 0 12px 40px rgba(236,72,153,0.14), 0 2px 8px rgba(0,0,0,0.05)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        zIndex: 1, overflow: "hidden", padding: 18,
                    }}>
                        <img src="/logo/LOGOFINAL.png" alt="Logo" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                    </div>
                </div>

                {/* Badge */}
                <div style={{
                    display: "inline-flex", alignItems: "center", gap: 7,
                    padding: "5px 15px", borderRadius: 100,
                    background: "rgba(252,231,243,0.9)",
                    border: "1px solid rgba(236,72,153,0.2)",
                    marginBottom: 22,
                    animation: "riseIn 1s cubic-bezier(.22,1,.36,1) 0.18s both",
                }}>
                    <div style={{
                        width: 5, height: 5, borderRadius: "50%",
                        background: "#ec4899", flexShrink: 0,
                        animation: "blink 2.2s ease-in-out infinite",
                    }} />
                    <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: "2.2px", textTransform: "uppercase", color: "#9d174d" }}>
                        Bộ hồ sơ quản trị nhân sự
                    </span>
                </div>

                {/* Headline */}
                <h1 style={{
                    margin: 0,
                    fontFamily: "'Instrument Serif', serif",
                    fontSize: "clamp(40px, 7vw, 68px)",
                    fontWeight: 400, lineHeight: 1.05, letterSpacing: "-1px",
                    color: "#1c1917",
                    animation: "riseIn 1s cubic-bezier(.22,1,.36,1) 0.28s both",
                }}>
                    Chào mừng,{" "}
                    <em style={{
                        fontStyle: "italic",
                        background: "linear-gradient(130deg, #9d174d 0%, #ec4899 55%, #f472b6 100%)",
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                        backgroundClip: "text",
                    }}>
                        {name}
                    </em>
                    {" "}đã trở lại
                </h1>
            </div>
        </div>
    );
};

export default WelcomePage;