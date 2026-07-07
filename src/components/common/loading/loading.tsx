import React from "react";

const Loading: React.FC<{ message?: string }> = ({
    message = "Đang tải...",
}) => {
    return (
        <div
            style={{
                height: "100vh",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 20,
                background: "#ffffff",
            }}
        >
            {/* Premium Single-Ring Spinner Container */}
            <div
                style={{
                    position: "relative",
                    width: 96,
                    height: 96,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                }}
            >
                {/* SVG Single-Ring Spinner */}
                <svg
                    viewBox="0 0 100 100"
                    style={{
                        position: "absolute",
                        width: "100%",
                        height: "100%",
                        animation: "spin 1.2s linear infinite",
                        transformOrigin: "center",
                    }}
                >
                    {/* ONLY one elegant rotating arc with rounded caps */}
                    <circle
                        cx="50"
                        cy="50"
                        r="44"
                        stroke="#D4537E"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeDasharray="100 180"
                        fill="none"
                    />
                </svg>

                {/* Lotus Logo in the center */}
                <img
                    src="/logo/LOGOFINAL.png"
                    alt="Lotus"
                    style={{
                        width: 60,
                        height: 60,
                        objectFit: "contain",
                        zIndex: 2,
                    }}
                />
            </div>

            {/* Soft, minimal text */}
            <p
                style={{
                    margin: 0,
                    fontSize: "12px",
                    color: "#8c8c8c",
                    fontWeight: 500,
                    letterSpacing: "0.2px",
                }}
            >
                {message}
            </p>

            <style>{`
                @keyframes spin {
                    100% {
                        transform: rotate(360deg);
                    }
                }
            `}</style>
        </div>
    );
};

export default Loading;