const Footer = () => {
    return (
        <footer
            style={{
                padding: "14px 24px",
                paddingRight: "180px",
                background: "#ffffff",
                borderTop: "2px solid rgba(236, 72, 153, 0.2)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: 8,
                flexShrink: 0,
                fontSize: 13,
            }}
        >
            {/* Left: Logo text + copyright */}
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span
                    style={{
                        fontWeight: 700,
                        fontSize: 14,
                        background: "linear-gradient(135deg, #db2777, #ec4899)",
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                        backgroundClip: "text",
                        letterSpacing: "0.5px",
                    }}
                >
                    LOTUS HRM
                </span>
                <span style={{ color: "#e5e7eb", fontSize: 12 }}>|</span>
                <span style={{ color: "#d1d5db", fontSize: 12 }}>
                    © {new Date().getFullYear()} All rights reserved.
                </span>
            </div>

            {/* Right: TEC Team */}
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ color: "#9ca3af", fontSize: 12, fontWeight: 500 }}>
                    Developed by
                </span>
                <span
                    style={{
                        fontWeight: 700,
                        fontSize: 13,
                        background: "linear-gradient(135deg, #db2777, #ec4899)",
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                        backgroundClip: "text",
                    }}
                >
                    TEC Team
                </span>
            </div>
        </footer>
    );
};

export default Footer;