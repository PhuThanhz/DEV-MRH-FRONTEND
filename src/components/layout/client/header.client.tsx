import { useState, useEffect } from "react";
import {
    ContactsOutlined,
    FireOutlined,
    LogoutOutlined,
} from "@ant-design/icons";
import { Avatar, Drawer, Dropdown, Menu, Space, message, Button } from "antd";
import type { MenuProps } from "antd";
import { isMobile } from "react-device-detect";
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
    const backendURL = import.meta.env.VITE_BACKEND_URL;

    const [openMobileMenu, setOpenMobileMenu] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);
    const [current, setCurrent] = useState("/");
    const location = useLocation();

    useEffect(() => {
        setCurrent(location.pathname);
    }, [location]);

    const avatarSrc = user?.avatar
        ? `${backendURL}/storage/AVATAR/${user.avatar}`
        : undefined;

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
                <span
                    className="flex items-center gap-2 text-gray-700 hover:text-pink-600 transition-colors"
                    onClick={() => navigate("/account")}
                >
                    <ContactsOutlined /> Quản lý tài khoản
                </span>
            ),
            key: "manage-account",
        },
        ...(user.role?.permissions?.length
            ? [
                {
                    key: "admin",
                    label: (
                        <Link to="/admin" className="flex items-center gap-2 text-gray-700 hover:text-pink-600 transition-colors">
                            <FireOutlined /> Trang Quản Trị
                        </Link>
                    ),
                },
            ]
            : []),
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

    const itemsMobile = [...itemsDropdown];

    const onClick: MenuProps["onClick"] = (e) => {
        setCurrent(e.key);
        setOpenMobileMenu(false);
    };

    return (
        <>
            {/* Header container */}
            <header className="bg-gradient-to-r from-pink-500 via-rose-400 to-pink-600 text-white shadow-xl sticky top-0 z-[1000] border-b-2 border-white/20 overflow-hidden transition-all duration-300">
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

                {!isMobile ? (
                    <div className="relative z-10 flex items-center justify-between h-16 px-4 sm:px-6 max-w-[1200px] mx-auto gap-4">
                        {/* Left Section: Logo + Brand */}
                        <div
                            className="flex items-center gap-3 cursor-pointer group"
                            onClick={() => navigate("/")}
                        >
                            {/* Logo Image với border trắng */}
                            <div className="relative w-12 h-12 bg-white rounded-xl p-1.5 flex items-center justify-center group-hover:scale-105 transition-all duration-300 shadow-lg">
                                <img
                                    src="/logo/LOGOFINAL.png"
                                    alt="Logo"
                                    className="w-full h-full object-contain"
                                />
                            </div>

                            {/* Text */}
                            <div className="flex flex-col leading-tight">
                                <span className="text-base font-bold text-white drop-shadow-md group-hover:text-pink-50 transition-colors">
                                    Bộ Hồ Sơ
                                </span>
                                <span className="text-xs font-medium text-white/90 drop-shadow-sm">
                                    Quản Trị Nhân Sự
                                </span>
                            </div>
                        </div>

                        {/* Right Section: User / Login */}
                        <div>
                            {!isAuthenticated ? (
                                <Link
                                    to="/login"
                                    className="text-white font-medium px-6 py-2 rounded-xl hover:bg-white/15 backdrop-blur-sm transition-all duration-300 inline-block"
                                >
                                    Đăng Nhập
                                </Link>
                            ) : (
                                <Dropdown
                                    menu={{ items: itemsDropdown }}
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
                                                {user?.name || "User"}
                                            </span>
                                        )}
                                        <div className="relative">
                                            <Avatar
                                                size={42}
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
                                                        : "US")}
                                            </Avatar>
                                            {/* Online status dot with ping */}
                                            <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-400 rounded-full border-2 border-pink-500 shadow-sm">
                                                <span className="absolute inset-0 bg-emerald-400 rounded-full animate-ping opacity-75"></span>
                                            </span>
                                        </div>
                                    </Space>
                                </Dropdown>
                            )}
                        </div>
                    </div>
                ) : (
                    // Mobile header
                    <div className="relative z-10 flex items-center justify-between h-16 px-4 gap-4">
                        <div
                            className="flex items-center gap-2 cursor-pointer"
                            onClick={() => navigate("/")}
                        >
                            {/* Logo Mobile với border trắng */}
                            <div className="relative w-10 h-10 bg-white rounded-lg p-1 flex items-center justify-center shadow-lg">
                                <img
                                    src="/logo/LOGOFINAL.png"
                                    alt="Logo"
                                    className="w-full h-full object-contain"
                                />
                            </div>

                            {/* Text Mobile */}
                            <div className="flex flex-col leading-tight">
                                <span className="text-sm font-bold text-white drop-shadow-md">
                                    Bộ Hồ Sơ
                                </span>
                                <span className="text-[10px] font-medium text-white/90 drop-shadow-sm">
                                    Quản Trị Nhân Sự
                                </span>
                            </div>
                        </div>
                        <Button
                            type="text"
                            onClick={() => setOpenMobileMenu(true)}
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
                    </div>
                )}

                {/* Inline styles cho animation */}
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