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
                gap: 16,
                background: "#fff",
            }}
        >
            {/* Ring + icon */}
            <div
                style={{
                    position: "relative",
                    width: 72,
                    height: 72,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                }}
            >
                <svg
                    viewBox="0 0 72 72"
                    fill="none"
                    style={{
                        position: "absolute",
                        inset: 0,
                        animation: "spin 1.8s linear infinite",
                    }}
                >
                    {/* Track */}
                    <circle cx="36" cy="36" r="31" stroke="#FBEAF0" strokeWidth="5" />
                    {/* Arc đổi màu */}
                    <circle
                        cx="36"
                        cy="36"
                        r="31"
                        stroke="#D4537E"
                        strokeWidth="5"
                        strokeLinecap="round"
                        strokeDasharray="200"
                        style={{
                            animation: "dash 1.8s ease-in-out infinite",
                            transformOrigin: "center",
                        }}
                    />
                </svg>

                {/* Icon giữa */}
                <div
                    style={{
                        width: 36,
                        height: 36,
                        borderRadius: "50%",
                        background: "#FBEAF0",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        animation: "breathe 1.8s ease-in-out infinite",
                    }}
                >
                    <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="#993556"
                        strokeWidth="1.8"
                    >
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                        <circle cx="12" cy="7" r="4" />
                    </svg>
                </div>
            </div>

            {/* Text */}
            <p
                style={{
                    margin: 0,
                    fontSize: 13,
                    color: "#D4537E",
                    animation: "txt 1.8s ease-in-out infinite",
                }}
            >
                {message}
            </p>

            <style>{`
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
                @keyframes dash {
                    0%   { stroke-dashoffset: 200; stroke: #D4537E; }
                    50%  { stroke-dashoffset: 40;  stroke: #ED93B1; }
                    100% { stroke-dashoffset: 200; stroke: #D4537E; }
                }
                @keyframes breathe {
                    0%, 100% { transform: scale(0.92); }
                    50%      { transform: scale(1.08); }
                }
                @keyframes txt {
                    0%, 100% { opacity: 0.4; }
                    50%      { opacity: 1;   }
                }
            `}</style>
        </div>
    );
};

export default Loading;