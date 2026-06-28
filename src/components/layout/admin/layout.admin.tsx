import React, { useEffect, useState } from "react";
import { Layout } from "antd";
import { Outlet, useLocation } from "react-router-dom";
import SliderAdmin from "./slider.admin";
import HeaderAdmin from "./header.admin";
import { useAppSelector } from "@/redux/hooks";
import NotPermitted from "@/components/share/not-permitted";
import Loading from "@/components/common/loading/loading";
import QrScannerModal from "@/components/common/qr/QrScannerModal";
import LotusCharmAssistant from "@/components/common/navigation/LotusCharmAssistant";
import { NotificationProvider } from "@/hooks/useNotifications";
import CommandPalette from "@/components/common/navigation/CommandPalette";
import { useTrackRecentQuickAccess } from "@/hooks/useQuickAccess";
import { LotusGuideProvider } from "@/components/common/guide/LotusGuideProvider";

const { Content } = Layout;

const LayoutAdmin = () => {
    const location = useLocation();
    const [collapsed, setCollapsed] = useState(false);
    const [activeMenu, setActiveMenu] = useState("");
    const [mobileOpen, setMobileOpen] = useState(false);
    const [openScanner, setOpenScanner] = useState(false);
    const [commandOpen, setCommandOpen] = useState(false);
    useTrackRecentQuickAccess();

    const { isAuthenticated, isLoading, user } = useAppSelector(
        (state) => state.account
    );

    const roleName = user?.role?.name?.toUpperCase() || "";

    useEffect(() => {
        setActiveMenu(location.pathname);
    }, [location]);

    useEffect(() => {
        const handler = () => setOpenScanner(true);
        window.addEventListener("openScannerModal", handler);
        return () => window.removeEventListener("openScannerModal", handler);
    }, []);

    useEffect(() => {
        const handler = (event: KeyboardEvent) => {
            const target = event.target as HTMLElement | null;
            const isTyping = target?.tagName === "INPUT" || target?.tagName === "TEXTAREA" || target?.isContentEditable;
            if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
                event.preventDefault();
                setCommandOpen(true);
                return;
            }
            if (event.key === "/" && !isTyping) {
                event.preventDefault();
                setCommandOpen(true);
            }
        };
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, []);

    if (isLoading) return <Loading />;

    if (!isAuthenticated)
        return (
            <NotPermitted message="Bạn chưa đăng nhập hoặc phiên đăng nhập đã hết hạn." />
        );

    const isAdmin = roleName.includes("ADMIN");
    const isEmployee = roleName === "EMPLOYEE";

    if (!isAdmin && !isEmployee) {
        return (
            <NotPermitted message="Bạn không có quyền truy cập nội dung này." />
        );
    }

    return (
        <NotificationProvider>
            <LotusGuideProvider>
                <Layout style={{ minHeight: "100vh", background: "#f8f9fa" }}>
                    <SliderAdmin
                        collapsed={collapsed}
                        setCollapsed={setCollapsed}
                        activeMenu={activeMenu}
                        setActiveMenu={setActiveMenu}
                        mobileOpen={mobileOpen}
                        setMobileOpen={setMobileOpen}
                    />

                    <Layout style={{ background: "#f8f9fa" }}>
                        <HeaderAdmin
                            collapsed={collapsed}
                            setCollapsed={setCollapsed}
                            mobileOpen={mobileOpen}
                            setMobileOpen={setMobileOpen}
                        />
                        <Content
                            style={{
                                margin: 0,
                                padding: "clamp(10px, 2vw, 16px)",
                                paddingBottom: "120px",
                                background: "transparent",
                                minHeight: "calc(100vh - 64px)",
                            }}
                        >
                            <Outlet />
                        </Content>
                    </Layout>

                    <QrScannerModal
                        open={openScanner}
                        onClose={() => setOpenScanner(false)}
                    />

                    {/* Global Assistant Mascot */}
                    <LotusCharmAssistant />
                    <CommandPalette open={commandOpen} onClose={() => setCommandOpen(false)} />
                </Layout>
            </LotusGuideProvider>
        </NotificationProvider>
    );
};

export default LayoutAdmin;
