import { useEffect, useRef } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Header from "./header.client";
import Footer from "./footer.client";

const LayoutClient = () => {
    const location = useLocation();
    const rootRef = useRef<HTMLDivElement>(null);
    const isHomePage = location.pathname === "/";

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
                overflowX: "hidden",
            }}
        >
            <Header />

            <div
                style={{
                    flex: 1,
                    width: "100%",
                    maxWidth: isHomePage ? "100%" : 1200,
                    margin: "0 auto",
                    padding: isHomePage ? 0 : "16px 12px 40px",
                    boxSizing: "border-box",
                    position: "relative",
                }}
            >
                <Outlet />
            </div>

            <Footer />
        </div>
    );
};

export default LayoutClient;