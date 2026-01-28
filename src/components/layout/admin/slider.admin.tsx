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
    const permissions = useAppSelector(
        (state) => state.account.user.role.permissions
    );
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

    /** ======== Responsive ======== */
    useEffect(() => {
        const handleResize = () => {
            const mobile = window.innerWidth < 1024;
            setIsMobile(mobile);
            if (mobile) setMobileOpen(false);
        };
        handleResize();
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    /** ======== Logo ======== */
    const Logo = (
        <div
            style={{
                height: 64,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderBottom: "1px solid #f0f0f0",
            }}
        >
            <img
                src="/logo/logo.png"
                alt="NCT Network"
                style={{
                    width: collapsed && !isMobile ? 32 : 40,
                    transition: "width 0.3s",
                }}
            />
            {!collapsed && !isMobile && (
                <span style={{ marginLeft: 8, fontWeight: 600 }}>NCT Network</span>
            )}
        </div>
    );

    /** ======== Menu chính ======== */
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
                paddingTop: 8,
            }}
        />
    );

    /** ======== Nút Scanner ======== */
    const ScannerButton =
        showScannerButton && (
            <div
                style={{
                    position: "fixed",
                    left: "50%",
                    bottom: 24,
                    transform: "translateX(-50%)",
                    zIndex: 2000,
                }}
            >
                <Button
                    type="primary"
                    shape="circle"
                    size="large"
                    icon={<QrcodeOutlined style={{ fontSize: 28 }} />}
                    style={{
                        width: 64,
                        height: 64,
                        boxShadow: "0 8px 24px rgba(37,99,235,0.3)",
                    }}
                    onClick={() =>
                        window.dispatchEvent(new CustomEvent("openScannerModal"))
                    }
                />
            </div>
        );

    /** ======== Mobile ======== */
    if (isMobile) {
        return (
            <>
                <Drawer
                    placement="left"
                    open={mobileOpen}
                    onClose={() => setMobileOpen(false)}
                    width={260}
                    bodyStyle={{ padding: 0, background: "#fff" }}
                    closeIcon={null}
                >
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            padding: "1px 16px",
                            borderBottom: "1px solid #f0f0f0",
                        }}
                    >
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <img src="/logo/logo.png" alt="NCT Network" style={{ width: 40 }} />
                            <span style={{ fontWeight: 600 }}>NCT Network</span>
                        </div>
                        <Button
                            type="text"
                            icon={<CloseOutlined />}
                            onClick={() => setMobileOpen(false)}
                        />
                    </div>
                    {MenuList}
                </Drawer>

                {ScannerButton}
            </>
        );
    }

    /** ======== Desktop ======== */
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
        </>
    );
};

export default SliderAdmin;
