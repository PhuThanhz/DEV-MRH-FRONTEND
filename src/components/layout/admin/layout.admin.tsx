import React, { useEffect, useState, lazy, Suspense } from "react";
import { Layout } from "antd";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import SliderAdmin from "./slider.admin";
import HeaderAdmin from "./header.admin";
import { useAppSelector } from "@/redux/hooks";
import NotPermitted from "@/components/share/not-permitted";
import Loading from "@/components/common/loading/loading";
import { NotificationProvider } from "@/hooks/useNotifications";
import { useTrackRecentQuickAccess } from "@/hooks/useQuickAccess";
import { LotusGuideProvider } from "@/components/common/guide/LotusGuideProvider";
import { PATHS } from "@/constants/paths";

const QrScannerModal = lazy(() => import("@/components/common/qr/QrScannerModal"));
const LotusCharmAssistant = lazy(() => import("@/components/common/navigation/LotusCharmAssistant"));
const CommandPalette = lazy(() => import("@/components/common/navigation/CommandPalette"));

const { Content } = Layout;

const LayoutAdmin = () => {
    const location = useLocation();
    const [collapsed, setCollapsed] = useState(false);
    const [activeMenu, setActiveMenu] = useState("");
    const [mobileOpen, setMobileOpen] = useState(false);
    const [openScanner, setOpenScanner] = useState(false);
    const [commandOpen, setCommandOpen] = useState(false);
    const [showAssistant, setShowAssistant] = useState(false);
    const [isEntrance, setIsEntrance] = useState(false);
    useTrackRecentQuickAccess();

    const { isAuthenticated, isLoading, user } = useAppSelector(
        (state) => state.account
    );

    const roleName = user?.role?.name?.toUpperCase() || "";

    useEffect(() => {
        const justLoggedIn = sessionStorage.getItem("just_logged_in");
        if (justLoggedIn === "true") {
            setIsEntrance(true);
            const timer = window.setTimeout(() => {
                setIsEntrance(false);
                sessionStorage.removeItem("just_logged_in");
            }, 750);
            return () => window.clearTimeout(timer);
        }
    }, []);

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

    useEffect(() => {
        const loadAssistant = () => setShowAssistant(true);
        const idleCallback = window.requestIdleCallback?.(loadAssistant, { timeout: 1500 });
        const timeoutId = idleCallback === undefined
            ? window.setTimeout(loadAssistant, 700)
            : undefined;

        return () => {
            if (idleCallback !== undefined) {
                window.cancelIdleCallback?.(idleCallback);
            }
            if (timeoutId !== undefined) {
                window.clearTimeout(timeoutId);
            }
        };
    }, []);

    if (isLoading) return <Loading />;

    if (!isAuthenticated) {
        return <Navigate to={PATHS.LOGIN} replace />;
    }

    const isAdmin = roleName.includes("ADMIN");
    const isEmployee = roleName === "EMPLOYEE";
    const isDeptManager = roleName === "DEPARTMENT_MANAGER" || roleName === "ADMIN_SUB_3";
    const isAccountingRole = roleName.includes("ACCOUNTANT")
        || roleName.includes("KETOAN")
        || roleName.includes("KẾ TOÁN");
    const isDirector = roleName.includes("DIRECTOR") || roleName.includes("GIAMDOC") || roleName.includes("GIAM_DOC");

    if (!isAdmin && !isEmployee && !isDeptManager && !isAccountingRole && !isDirector) {
        return (
            <NotPermitted message="Bạn không có quyền truy cập nội dung này." />
        );
    }

    return (
        <NotificationProvider>
            <LotusGuideProvider>
                <Layout
                    className={isEntrance ? "admin-layout-entrance" : ""}
                    style={{
                        minHeight: "100vh",
                        background: "#f8f9fa",
                        overflow: isEntrance ? "hidden" : "visible",
                    }}
                >
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
                                minHeight: "calc(100vh - 56px)",
                            }}
                        >
                            <Outlet />
                        </Content>
                    </Layout>

                    {openScanner && (
                        <Suspense fallback={null}>
                            <QrScannerModal
                                open={openScanner}
                                onClose={() => setOpenScanner(false)}
                            />
                        </Suspense>
                    )}

                    {showAssistant && (
                        <Suspense fallback={null}>
                            <LotusCharmAssistant />
                        </Suspense>
                    )}
                    {commandOpen && (
                        <Suspense fallback={null}>
                            <CommandPalette open onClose={() => setCommandOpen(false)} />
                        </Suspense>
                    )}
                </Layout>

                <style>{`
                    /* STAGGERED ENTRANCE (STEP 1: SIDEBAR -> STEP 2: HEADER -> STEP 3: CONTENT) */
                    .admin-layout-entrance .ant-layout-sider {
                        animation: slideInLeft 0.38s cubic-bezier(0.16, 1, 0.3, 1) 0ms forwards;
                        will-change: transform, opacity;
                    }
                    .admin-layout-entrance header {
                        animation: slideInDown 0.34s cubic-bezier(0.16, 1, 0.3, 1) 70ms forwards;
                        animation-fill-mode: both;
                        will-change: transform, opacity;
                    }
                    .admin-layout-entrance .ant-layout-content {
                        animation: contentFadeUp 0.38s cubic-bezier(0.16, 1, 0.3, 1) 140ms forwards;
                        animation-fill-mode: both;
                        will-change: transform, opacity;
                    }

                    @keyframes slideInLeft {
                        0% { transform: translateX(-100%); opacity: 0; }
                        100% { transform: translateX(0); opacity: 1; }
                    }
                    @keyframes slideInDown {
                        0% { transform: translateY(-100%); opacity: 0; }
                        100% { transform: translateY(0); opacity: 1; }
                    }
                    @keyframes contentFadeUp {
                        0% { transform: translateY(16px) scale(0.99); opacity: 0; }
                        100% { transform: translateY(0) scale(1); opacity: 1; }
                    }
                `}</style>
            </LotusGuideProvider>
        </NotificationProvider>
    );
};

export default LayoutAdmin;
