import { useState, useEffect } from "react";
import {
    ContactsOutlined,
    FireOutlined,
    LogoutOutlined,
    MenuFoldOutlined,
    TwitterOutlined,
} from "@ant-design/icons";
import { Avatar, Drawer, Dropdown, Menu, Space, message, ConfigProvider } from "antd";
import type { MenuProps } from "antd";
import { isMobile } from "react-device-detect";
import { FaReact } from "react-icons/fa";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { callLogout } from "@/config/api";
import { setLogoutAction } from "@/redux/slice/accountSlide";
import { PATHS } from "@/constants/paths";

const Header = () => {
    const navigate = useNavigate();
    const dispatch = useAppDispatch();
    const isAuthenticated = useAppSelector((state) => state.account.isAuthenticated);
    const user = useAppSelector((state) => state.account.user);

    const [openMobileMenu, setOpenMobileMenu] = useState(false);
    const [current, setCurrent] = useState("/");
    const location = useLocation();

    useEffect(() => {
        setCurrent(location.pathname);
    }, [location]);

    const items: MenuProps["items"] = [
        {
            label: <Link to="/">Trang Chủ</Link>,
            key: "/",
            icon: <TwitterOutlined />,
        },
    ];

    const onClick: MenuProps["onClick"] = (e) => {
        setCurrent(e.key);
    };

    /** ===== Logout ===== */
    const handleLogout = async () => {
        try {
            await callLogout();
        } finally {
            localStorage.removeItem("access_token");
            sessionStorage.clear();
            dispatch(setLogoutAction());
            navigate(PATHS.HOME, { replace: true });
            message.success("Đăng xuất thành công");
        }
    };

    const itemsDropdown: MenuProps["items"] = [
        {
            label: (
                <span style={{ cursor: "pointer" }} onClick={() => navigate("/account")}>
                    Quản lý tài khoản
                </span>
            ),
            key: "manage-account",
            icon: <ContactsOutlined />,
        },
        ...(user.role?.permissions?.length
            ? [
                {
                    label: <Link to="/admin">Trang Quản Trị</Link>,
                    key: "admin",
                    icon: <FireOutlined />,
                },
            ]
            : []),
        {
            label: (
                <span style={{ cursor: "pointer" }} onClick={handleLogout}>
                    Đăng xuất
                </span>
            ),
            key: "logout",
            icon: <LogoutOutlined />,
        },
    ];

    const itemsMobile = [...items, ...itemsDropdown];

    return (
        <>
            {/* Header container */}
            <div
                style={{
                    width: "100%",
                    background: "#222831",
                    color: "#fff",
                    padding: "0.5rem 1rem",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                    position: "sticky",
                    top: 0,
                    zIndex: 1000,
                }}
            >
                {!isMobile ? (
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            maxWidth: 1200,
                            margin: "0 auto",
                        }}
                    >
                        {/* Left Section: Brand + Menu */}
                        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
                            <FaReact
                                size={26}
                                color="#61dafb"
                                style={{ cursor: "pointer" }}
                                onClick={() => navigate("/")}
                                title="React Home"
                            />

                            <ConfigProvider
                                theme={{
                                    token: {
                                        colorPrimary: "#61dafb",
                                        colorBgContainer: "#222831",
                                        colorText: "#ccc",
                                    },
                                }}
                            >
                                <Menu
                                    selectedKeys={[current]}
                                    mode="horizontal"
                                    items={items}
                                    style={{
                                        background: "transparent",
                                        borderBottom: "none",
                                        color: "#ccc",
                                    }}
                                    onClick={onClick}
                                />
                            </ConfigProvider>
                        </div>

                        {/* Right Section: User / Login */}
                        <div>
                            {!isAuthenticated ? (
                                <Link to="/login" style={{ color: "#fff" }}>
                                    Đăng Nhập
                                </Link>
                            ) : (
                                <Dropdown menu={{ items: itemsDropdown }} trigger={["click"]}>
                                    <Space style={{ cursor: "pointer", color: "#fff" }}>
                                        <span>Welcome {user?.name}</span>
                                        <Avatar size={32}>
                                            {user?.name?.substring(0, 2)?.toUpperCase()}
                                        </Avatar>
                                    </Space>
                                </Dropdown>
                            )}
                        </div>
                    </div>
                ) : (
                    // Mobile header
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                        }}
                    >
                        <span
                            style={{
                                fontSize: 18,
                                fontWeight: 600,
                                color: "#61dafb",
                            }}
                            onClick={() => navigate("/")}
                        >
                            Your App
                        </span>
                        <MenuFoldOutlined
                            style={{ fontSize: 20, cursor: "pointer", color: "#fff" }}
                            onClick={() => setOpenMobileMenu(true)}
                        />
                    </div>
                )}
            </div>

            {/* Drawer cho mobile */}
            <Drawer
                title="Chức năng"
                placement="right"
                onClose={() => setOpenMobileMenu(false)}
                open={openMobileMenu}
                width={240}
            >
                <Menu
                    onClick={onClick}
                    selectedKeys={[current]}
                    mode="vertical"
                    items={itemsMobile}
                />
            </Drawer>
        </>
    );
};

export default Header;
