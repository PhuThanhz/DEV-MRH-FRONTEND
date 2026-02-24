import React, { useEffect, useState } from "react";
import { Layout, Menu, Drawer, Button } from "antd";
import { CloseOutlined, QrcodeOutlined } from "@ant-design/icons";
import { useAppSelector } from "@/redux/hooks";
import { generateMenuItems } from "./menuItems";

const { Sider } = Layout;

interface IProps {
    collapsed: boolean;
    setCollapsed: (val: boolean) => void;
    activeMenu: string;
    setActiveMenu: (val: string) => void;
    mobileOpen?: boolean;
    setMobileOpen?: (val: boolean) => void;
}

const SliderAdmin: React.FC<IProps> = ({
    collapsed,
    setCollapsed,
    activeMenu,
    setActiveMenu,
    mobileOpen = false,
    setMobileOpen = () => { },
}) => {
    const permissions = useAppSelector((state) => state.account.user.role.permissions);
    const [menuItems, setMenuItems] = useState<any[]>([]);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
    const [showScannerButton, setShowScannerButton] = useState<boolean>(
        localStorage.getItem("showScannerButton") === "true"
    );

    useEffect(() => {
        setMenuItems(generateMenuItems(permissions));
    }, [permissions]);

    useEffect(() => {
        const handleToggle = (e: any) => {
            setShowScannerButton(e.detail);
        };
        window.addEventListener("toggleScannerVisibility", handleToggle);
        return () => window.removeEventListener("toggleScannerVisibility", handleToggle);
    }, []);

    useEffect(() => {
        const handleResize = () => {
            const mobile = window.innerWidth < 1024;
            setIsMobile(mobile);
            if (mobile) setMobileOpen(false);
        };
        handleResize();
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, [setMobileOpen]);

    // Logo với HRM và tagline
    const Logo = (
        <div
            className="logo-container"
            style={{
                height: 64,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderBottom: "1px solid #f0f0f0",
                background: "rgba(255, 250, 252, 0.8)",
                transition: "all 0.3s ease",
                position: "relative",
                overflow: "hidden",
            }}
        >
            {collapsed && !isMobile ? (
                // Khi collapse: chỉ logo nhỏ
                <img
                    src="/logo/LOGOFINAL.png"
                    alt="LOTUS HRM"
                    style={{
                        width: 36,
                        height: "auto",
                        objectFit: "contain",
                    }}
                />
            ) : (
                // Không collapse: logo + tên + tagline
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <img
                        src="/logo/LOGOFINAL.png"
                        alt="LOTUS HRM"
                        style={{
                            width: 42,
                            height: "auto",
                            objectFit: "contain",
                        }}
                    />
                    <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                        <span
                            style={{
                                fontSize: 18,
                                fontWeight: 700,
                                color: "#d63384",
                                letterSpacing: "0.5px",
                                lineHeight: 1.2,
                            }}
                        >
                            LOTUS HRM
                        </span>
                        <span
                            style={{
                                fontSize: 10,
                                fontWeight: 500,
                                color: "#f472b6",
                                letterSpacing: "0.3px",
                                lineHeight: 1.2,
                            }}
                        >
                            Bộ hồ sơ quản trị nhân sự
                        </span>
                    </div>
                </div>
            )}

            {/* Overlay hồng nhạt khi hover */}
            <div
                className="logo-overlay"
                style={{
                    position: "absolute",
                    inset: 0,
                    background: "rgba(255, 105, 180, 0)",
                    transition: "background 0.3s ease",
                    pointerEvents: "none",
                }}
            />
        </div>
    );

    const filteredMenuItems = collapsed
        ? menuItems.filter((item) => item.type !== "group")
        : menuItems;

    const MenuList = (
        <Menu
            selectedKeys={[activeMenu]}
            mode="inline"
            items={filteredMenuItems}
            onClick={(e) => {
                setActiveMenu(e.key);
                if (isMobile) setMobileOpen(false);
            }}
            style={{
                border: "none",
                background: "transparent",
                paddingTop: 12,
            }}
            className="sidebar-menu-pink"
        />
    );

    const ScannerButton = showScannerButton && (
        <div
            style={{
                position: "fixed",
                left: "50%",
                bottom: 32,
                transform: "translateX(-50%)",
                zIndex: 2000,
            }}
        >
            <Button
                type="primary"
                shape="circle"
                size="large"
                icon={<QrcodeOutlined style={{ fontSize: 32 }} />}
                style={{
                    width: 72,
                    height: 72,
                    boxShadow: "0 12px 32px rgba(255, 105, 180, 0.3)",
                }}
                onClick={() => window.dispatchEvent(new CustomEvent("openScannerModal"))}
            />
        </div>
    );

    if (isMobile) {
        return (
            <>
                <Drawer
                    placement="left"
                    open={mobileOpen}
                    onClose={() => setMobileOpen(false)}
                    width={280}
                    bodyStyle={{ padding: 0, background: "#fff" }}
                    closeIcon={null}
                >
                    <div
                        style={{
                            height: 64,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            padding: "0 16px",
                            borderBottom: "1px solid #f0f0f0",
                            background: "rgba(255, 245, 247, 0.9)",
                            position: "relative",
                        }}
                    >
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <img
                                src="/logo/LOGOFINAL.png"
                                alt="LOTUS HRM"
                                style={{ width: 40, height: "auto" }}
                            />
                            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                                <span
                                    style={{
                                        fontSize: 16,
                                        fontWeight: 700,
                                        color: "#d63384",
                                    }}
                                >
                                    LOTUS HRM
                                </span>
                                <span
                                    style={{
                                        fontSize: 9,
                                        fontWeight: 500,
                                        color: "#f472b6",
                                    }}
                                >
                                    Quản trị nhân sự
                                </span>
                            </div>
                        </div>

                        <Button
                            type="text"
                            icon={<CloseOutlined />}
                            onClick={() => setMobileOpen(false)}
                            style={{
                                color: "#d63384",
                            }}
                        />

                        <div
                            className="logo-overlay"
                            style={{
                                position: "absolute",
                                inset: 0,
                                background: "rgba(255, 105, 180, 0)",
                                transition: "background 0.3s ease",
                                pointerEvents: "none",
                            }}
                        />
                    </div>

                    {MenuList}
                </Drawer>

                {ScannerButton}

                {/* CSS cho menu hover và selected màu hồng */}
                <style>{`
                    /* Menu hover màu hồng nhẹ */
                    .sidebar-menu-pink .ant-menu-item:hover {
                        background-color: rgba(236, 72, 153, 0.08) !important;
                    }

                    .sidebar-menu-pink .ant-menu-submenu-title:hover {
                        background-color: rgba(236, 72, 153, 0.08) !important;
                    }

                    /* Menu item selected màu hồng */
                    .sidebar-menu-pink .ant-menu-item-selected {
                        background-color: rgba(236, 72, 153, 0.12) !important;
                        color: #ec4899 !important;
                        font-weight: 600;
                    }

                    .sidebar-menu-pink .ant-menu-item-selected::after {
                        border-right: 3px solid #ec4899 !important;
                    }

                    /* Icon color khi selected */
                    .sidebar-menu-pink .ant-menu-item-selected .ant-menu-item-icon {
                        color: #ec4899 !important;
                    }

                    /* Submenu selected */
                    .sidebar-menu-pink .ant-menu-submenu-selected > .ant-menu-submenu-title {
                        color: #ec4899 !important;
                    }

                    /* Logo hover effect */
                    .logo-container:hover .logo-overlay {
                        background: rgba(236, 72, 153, 0.05) !important;
                    }

                    /* Smooth transitions */
                    .sidebar-menu-pink .ant-menu-item,
                    .sidebar-menu-pink .ant-menu-submenu-title {
                        transition: all 0.3s ease !important;
                    }
                `}</style>
            </>
        );
    }

    return (
        <>
            <Sider
                theme="light"
                collapsible
                collapsed={collapsed}
                onCollapse={setCollapsed}
                width={260}
                collapsedWidth={80}
                trigger={null}
                style={{
                    position: "sticky",
                    top: 0,
                    height: "100vh",
                    background: "#fff",
                    borderRight: "1px solid #f0f0f0",
                }}
            >
                {Logo}
                <div style={{ overflowY: "auto", height: "calc(100vh - 64px)" }}>
                    {MenuList}
                </div>
            </Sider>

            {ScannerButton}

            {/* CSS cho menu hover và selected màu hồng */}
            <style>{`
                /* Menu hover màu hồng nhẹ */
                .sidebar-menu-pink .ant-menu-item:hover {
                    background-color: rgba(236, 72, 153, 0.08) !important;
                }

                .sidebar-menu-pink .ant-menu-submenu-title:hover {
                    background-color: rgba(236, 72, 153, 0.08) !important;
                }

                /* Menu item selected màu hồng */
                .sidebar-menu-pink .ant-menu-item-selected {
                    background-color: rgba(236, 72, 153, 0.12) !important;
                    color: #ec4899 !important;
                    font-weight: 600;
                }

                .sidebar-menu-pink .ant-menu-item-selected::after {
                    border-right: 3px solid #ec4899 !important;
                }

                /* Icon color khi selected */
                .sidebar-menu-pink .ant-menu-item-selected .ant-menu-item-icon {
                    color: #ec4899 !important;
                }

                /* Submenu selected */
                .sidebar-menu-pink .ant-menu-submenu-selected > .ant-menu-submenu-title {
                    color: #ec4899 !important;
                }

                /* Logo hover effect */
                .logo-container:hover .logo-overlay {
                    background: rgba(236, 72, 153, 0.05) !important;
                }

                /* Smooth transitions */
                .sidebar-menu-pink .ant-menu-item,
                .sidebar-menu-pink .ant-menu-submenu-title {
                    transition: all 0.3s ease !important;
                }
            `}</style>
        </>
    );
};

export default SliderAdmin;