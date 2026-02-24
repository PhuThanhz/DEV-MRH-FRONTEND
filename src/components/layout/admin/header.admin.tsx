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
                <Link to="/" className="flex items-center gap-2 text-gray-700 hover:text-pink-600 transition-colors">
                    <HomeOutlined /> Trang chủ
                </Link>
            ),
        },
        {
            key: "logout",
            label: (
                <div
                    onClick={handleLogout}
                    className="flex items-center gap-2 cursor-pointer text-red-500 hover:text-red-600 transition-colors"
                >
                    <LogoutOutlined /> Đăng xuất
                </div>
            ),
        },
    ];

    return (
        <header className="bg-gradient-to-r from-pink-500 via-rose-400 to-pink-600 text-white shadow-xl sticky top-0 z-40 border-b-2 border-white/20 overflow-hidden transition-all duration-300">
            {/* Gradient overlay động */}
            <div className="absolute inset-0 bg-gradient-to-r from-pink-600/20 via-rose-500/20 to-pink-600/20 animate-gradient-flow pointer-events-none"></div>

            {/* Subtle wave pattern Nhật Bản */}
            <div className="absolute inset-0 opacity-10 overflow-hidden pointer-events-none">
                <svg className="absolute top-0 left-0 w-full h-full" viewBox="0 0 1200 60">
                    <path
                        d="M0,30 Q150,10 300,30 T600,30 T900,30 T1200,30"
                        stroke="white"
                        strokeWidth="2"
                        fill="none"
                    >
                        <animate
                            attributeName="d"
                            values="M0,30 Q150,10 300,30 T600,30 T900,30 T1200,30; M0,30 Q150,50 300,30 T600,30 T900,30 T1200,30; M0,30 Q150,10 300,30 T600,30 T900,30 T1200,30"
                            dur="12s"
                            repeatCount="indefinite"
                        />
                    </path>
                </svg>
            </div>

            <div className="relative z-10 flex items-center justify-between h-16 px-4 sm:px-6 w-full gap-4">
                {/* LEFT: Toggle menu */}
                <Button
                    type="text"
                    onClick={() =>
                        window.innerWidth < 1024
                            ? setMobileOpen(!mobileOpen)
                            : setCollapsed(!collapsed)
                    }
                    className="flex items-center justify-center w-11 h-11 rounded-xl hover:bg-white/20 transition-all duration-300 backdrop-blur-sm group active:scale-95"
                    style={{ border: "none" }}
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={2.5}
                        stroke="currentColor"
                        className="w-6 h-6 text-white group-hover:rotate-90 transition-transform duration-300"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M3.5 6.5h17M3.5 12h17m-17 5.5h17"
                        />
                    </svg>
                </Button>

                {/* RIGHT: User Dropdown */}
                <Dropdown
                    menu={{ items: menuItems }}
                    trigger={["click"]}
                    open={menuOpen}
                    onOpenChange={setMenuOpen}
                    placement="bottomRight"
                    overlayClassName="animate-dropdown-slide"
                    overlayStyle={{ zIndex: 10000 }}
                >
                    <Space
                        align="center"
                        className="cursor-pointer p-2 pr-4 rounded-2xl hover:bg-white/15 backdrop-blur-sm transition-all duration-300 group active:scale-95"
                    >
                        {!isMobile && (
                            <span className="text-sm font-medium text-white drop-shadow-md group-hover:text-pink-50 transition-colors">
                                {user?.name || "Admin"}
                            </span>
                        )}
                        <div className="relative">
                            <Avatar
                                size={isMobile ? 36 : 42}
                                src={avatarSrc}
                                className="border-2 border-white/60 shadow-lg group-hover:border-white group-hover:scale-105 transition-all duration-300"
                                style={{
                                    backgroundColor: avatarSrc ? "transparent" : "#ec4899",
                                    fontWeight: 700,
                                    color: "#fff",
                                    boxShadow: "0 4px 15px rgba(236,72,153,0.3)",
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
                                        : "AD")}
                            </Avatar>
                            {/* Online status dot with ping */}
                            <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-400 rounded-full border-2 border-pink-500 shadow-sm">
                                <span className="absolute inset-0 bg-emerald-400 rounded-full animate-ping opacity-75"></span>
                            </span>
                        </div>
                    </Space>
                </Dropdown>
            </div>

            {/* Inline styles cho animation (giống header Lotus) */}
            <style>{`
                @keyframes gradient-flow {
                    0%, 100% { background-position: 0% 50%; }
                    50% { background-position: 100% 50%; }
                }
                .animate-gradient-flow {
                    animation: gradient-flow 18s ease infinite;
                    background-size: 200% 200%;
                }
                @keyframes dropdown-slide {
                    from { opacity: 0; transform: translateY(-10px) scale(0.95); }
                    to { opacity: 1; transform: translateY(0) scale(1); }
                }
                .animate-ping {
                    animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;
                }
                @keyframes ping {
                    75%, 100% { transform: scale(2); opacity: 0; }
                }
            `}</style>
        </header>
    );
};

export default HeaderAdmin; 