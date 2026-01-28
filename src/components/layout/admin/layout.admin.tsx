import React, { useEffect, useState } from "react";
import { Layout } from "antd";
import { Outlet, useLocation } from "react-router-dom";
import SliderAdmin from "./slider.admin";
import HeaderAdmin from "./header.admin";
import { useAppSelector } from "@/redux/hooks";
import NotPermitted from "@/components/share/not-permitted";
import Loading from "@/components/common/loading/loading";

const { Content } = Layout;

const LayoutAdmin = () => {
    const location = useLocation();
    const [collapsed, setCollapsed] = useState(false);
    const [activeMenu, setActiveMenu] = useState("");
    const [mobileOpen, setMobileOpen] = useState(false);

    const { isAuthenticated, isLoading, user } = useAppSelector(
        (state) => state.account
    );

    const roleName = user?.role?.name?.toUpperCase() || "";

    useEffect(() => {
        setActiveMenu(location.pathname);
    }, [location]);

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
        <Layout style={{ minHeight: "100vh", background: "#f8f9fa" }}>
            <SliderAdmin
                collapsed={collapsed}
                setCollapsed={setCollapsed}
                activeMenu={activeMenu}
                setActiveMenu={setActiveMenu}
                mobileOpen={mobileOpen}
                setMobileOpen={setMobileOpen}
            />

            <Layout style={{ background: "#f8f9fa", transition: "all 0.3s" }}>
                <HeaderAdmin
                    collapsed={collapsed}
                    setCollapsed={setCollapsed}
                    mobileOpen={mobileOpen}
                    setMobileOpen={setMobileOpen}
                />
                <Content
                    style={{
                        margin: 0,
                        padding: "16px",
                        background: "transparent",
                        minHeight: "calc(100vh - 64px)",
                    }}
                >
                    <Outlet />
                </Content>
            </Layout>

        </Layout>
    );
};

export default LayoutAdmin;
