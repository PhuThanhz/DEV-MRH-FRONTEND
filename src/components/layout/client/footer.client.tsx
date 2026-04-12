const Footer = () => {
    return (
        <footer
            style={{
                padding: "12px 16px",
                background: "#ffffff",
                borderTop: "2px solid rgba(236, 72, 153, 0.2)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: 6,
                flexShrink: 0,
                fontSize: 13,
                // Loại bỏ paddingRight cứng 180px — gây lệch trên mobile
            }}
        >
            {/* Left: Logo text + copyright */}
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    flexWrap: "wrap",
                    minWidth: 0,
                }}
            >
                <span
                    style={{
                        fontWeight: 700,
                        fontSize: 14,
                        background: "linear-gradient(135deg, #db2777, #ec4899)",
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                        backgroundClip: "text",
                        letterSpacing: "0.5px",
                        whiteSpace: "nowrap",
                    }}
                >
                    LOTUS HRM
                </span>
                <span style={{ color: "#e5e7eb", fontSize: 12 }}>|</span>
                <span
                    style={{
                        color: "#d1d5db",
                        fontSize: 11,
                        whiteSpace: "nowrap",
                    }}
                >
                    © {new Date().getFullYear()} All rights reserved.
                </span>
            </div>

            {/* Right: TEC Team */}
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                    flexShrink: 0,
                }}
            >
                <span
                    style={{
                        color: "#9ca3af",
                        fontSize: 11,
                        fontWeight: 500,
                        whiteSpace: "nowrap",
                    }}
                >
                    Developed by
                </span>
                <span
                    style={{
                        fontWeight: 700,
                        fontSize: 12,
                        background: "linear-gradient(135deg, #db2777, #ec4899)",
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                        backgroundClip: "text",
                        whiteSpace: "nowrap",
                    }}
                >
                    TEC Team
                </span>
            </div>
        </footer>
    );
};

export default Footer;