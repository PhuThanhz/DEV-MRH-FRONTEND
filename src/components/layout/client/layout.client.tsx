import { useEffect, useRef } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Header from "./header.client";

const LayoutClient = () => {
    const location = useLocation();
    const rootRef = useRef<HTMLDivElement>(null);

    // Tự động scroll lên đầu trang khi đổi route
    useEffect(() => {
        if (rootRef.current) {
            rootRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [location]);

    return (
        <div
            ref={rootRef}
            style={{
                display: "flex",
                flexDirection: "column",
                minHeight: "100vh",
                backgroundColor: "#f5f5f5",
            }}
        >
            <Header />
            <div
                style={{
                    flex: 1,
                    width: "100%",
                    maxWidth: 1200,
                    margin: "0 auto",
                    padding: "16px 12px 40px",
                    boxSizing: "border-box",
                }}
            >
                <Outlet />
            </div>

            <footer
                style={{
                    textAlign: "center",
                    padding: "12px 0",
                    background: "#222831",
                    color: "#ccc",
                    fontSize: 13,
                }}
            >
                © {new Date().getFullYear()} Your App. All rights reserved.
            </footer>
        </div>
    );
};

export default LayoutClient;
