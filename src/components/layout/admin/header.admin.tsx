import React, { useState } from "react";
import { Button, Dropdown, Space, Avatar, message } from "antd";
import {
    LogoutOutlined,
    HomeOutlined,
} from "@ant-design/icons";
import { Link, useNavigate } from "react-router-dom";
import { isMobile } from "react-device-detect";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { callLogout } from "@/config/api";
import { setLogoutAction } from "@/redux/slice/accountSlide";
import { PATHS } from "@/constants/paths";

interface IProps {
    collapsed: boolean;
    setCollapsed: (val: boolean) => void;
    mobileOpen: boolean;
    setMobileOpen: (val: boolean) => void;
}

const HeaderAdmin: React.FC<IProps> = ({
    collapsed,
    setCollapsed,
    mobileOpen,
    setMobileOpen,
}) => {
    const user = useAppSelector((s) => s.account.user);
    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    const backendURL = import.meta.env.VITE_BACKEND_URL;

    const [menuOpen, setMenuOpen] = useState(false);

    const avatarSrc = user?.avatar
        ? `${backendURL}/storage/AVATAR/${user.avatar}`
        : undefined;

    /** ======== Logout ======== */
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

    /** ======== Dropdown menu user ======== */
    const menuItems = [
        {
            key: "home",
            label: (
                <Link to="/" className="flex items-center gap-2">
                    <HomeOutlined /> Trang chủ
                </Link>
            ),
        },
        {
            key: "logout",
            label: (
                <div
                    onClick={handleLogout}
                    className="flex items-center gap-2 cursor-pointer text-red-500"
                >
                    <LogoutOutlined /> Đăng xuất
                </div>
            ),
        },
    ];

    return (
        <header
            className="bg-white shadow-sm sticky top-0 z-40 border-b border-gray-200 transition-all duration-300"
        >
            <div className="flex items-center justify-between h-16 px-4 sm:px-6 w-full gap-4">
                {/* ===== LEFT: Toggle menu ===== */}
                <Button
                    type="text"
                    onClick={() =>
                        window.innerWidth < 1024
                            ? setMobileOpen(!mobileOpen)
                            : setCollapsed(!collapsed)
                    }
                    className="flex items-center justify-center w-11 h-11 rounded-lg hover:bg-gray-100 transition-all"
                    style={{ border: "none" }}
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={2.5}
                        stroke="currentColor"
                        className="w-6 h-6 text-gray-700"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M3.5 6.5h17M3.5 12h17m-17 5.5h17"
                        />
                    </svg>
                </Button>

                {/* ===== RIGHT: User Dropdown ===== */}
                <Space size={isMobile ? 10 : 20} align="center">
                    <Dropdown
                        menu={{ items: menuItems }}
                        trigger={["click"]}
                        open={menuOpen}
                        onOpenChange={setMenuOpen}
                        placement="bottomRight"
                    >
                        <Space className="cursor-pointer hover:bg-gray-100 rounded-lg px-3 py-2 transition-all">
                            {!isMobile && (
                                <span className="text-sm font-medium text-gray-700 truncate max-w-[150px]">
                                    {user?.name || "Admin"}
                                </span>
                            )}
                            <Avatar
                                size={isMobile ? 32 : 38}
                                src={avatarSrc}
                                className="border border-gray-300"
                                style={{
                                    backgroundColor: avatarSrc ? "transparent" : "#1677ff",
                                    fontWeight: 600,
                                    color: "#fff",
                                }}
                            >
                                {!user?.avatar &&
                                    (user?.name
                                        ? user.name
                                            .split(" ")
                                            .filter(Boolean)
                                            .map((word) => word[0])
                                            .slice(0, 2)
                                            .join("")
                                            .toUpperCase()
                                        : "U")}
                            </Avatar>
                        </Space>
                    </Dropdown>
                </Space>
            </div>
        </header>
    );
};

export default HeaderAdmin;
