import { useState, useEffect } from "react";
import {
    ContactsOutlined,
    FireOutlined,
    LogoutOutlined,
} from "@ant-design/icons";
import { Avatar, Drawer, Dropdown, Menu, Space, message, Button } from "antd";
import type { MenuProps } from "antd";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { callLogout } from "@/config/api";
import { setLogoutAction } from "@/redux/slice/accountSlide";
import { PATHS } from "@/constants/paths";
import ManageAccount from "@/components/common/modal/manage.account";


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
    const [openAccountModal, setOpenAccountModal] = useState(false);

    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    useEffect(() => {
        setCurrent(location.pathname);
    }, [location]);

    useEffect(() => {
        setOpenMobileMenu(false);
    }, [location]);

    const avatarSrc = user?.avatar
        ? `${backendURL}/uploads/avatar/${user.avatar}?t=${Date.now()}`
        : undefined;

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
                    onClick={() => setOpenAccountModal(true)}
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
            <header className="bg-gradient-to-r from-pink-500 via-rose-400 to-pink-600 text-white shadow-xl sticky top-0 z-[1000] border-b-2 border-white/20 transition-all duration-300">
                {/* Gradient overlay động */}
                <div className="absolute inset-0 bg-gradient-to-r from-pink-600/20 via-rose-500/20 to-pink-600/20 animate-gradient-flow pointer-events-none"></div>

                {/* Subtle wave pattern */}
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
                        {/* Left: Logo */}
                        <div
                            className="flex items-center gap-3 cursor-pointer group"
                            onClick={() => navigate("/")}
                        >
                            <div className="relative w-12 h-12 bg-white rounded-xl p-1.5 flex items-center justify-center group-hover:scale-105 transition-all duration-300 shadow-lg">
                                <img src="/logo/LOGOFINAL.png" alt="Logo" className="w-full h-full object-contain" />
                            </div>
                            <div className="flex flex-col leading-tight">
                                <span className="text-base font-bold text-white drop-shadow-md group-hover:text-pink-50 transition-colors">
                                    Bộ Hồ Sơ
                                </span>
                                <span className="text-xs font-medium text-white/90 drop-shadow-sm">
                                    Quản Trị Nhân Sự
                                </span>
                            </div>
                        </div>

                        {/* Right: User / Login */}
                        <div>
                            {!isAuthenticated ? (
                                // ⭐ Nút Đăng Nhập desktop
                                <Link to="/login">
                                    <button className="
                                        group relative flex items-center gap-2
                                        px-5 py-2 rounded-xl
                                        bg-white/15 backdrop-blur-sm
                                        border border-white/30
                                        text-white font-medium text-sm
                                        hover:bg-white hover:text-pink-500
                                        active:scale-95
                                        transition-all duration-200
                                        shadow-sm hover:shadow-md
                                        overflow-hidden
                                    ">
                                        {/* Shimmer effect on hover */}
                                        <span className="
                                            absolute inset-0 -translate-x-full
                                            bg-gradient-to-r from-transparent via-white/20 to-transparent
                                            group-hover:translate-x-full
                                            transition-transform duration-500
                                        " />
                                        {/* Icon */}
                                        <svg
                                            className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-0.5"
                                            viewBox="0 0 24 24" fill="none"
                                            stroke="currentColor" strokeWidth="2"
                                        >
                                            <path strokeLinecap="round" strokeLinejoin="round"
                                                d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9"
                                            />
                                        </svg>
                                        <span className="relative">Đăng Nhập</span>
                                    </button>
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
                                    getPopupContainer={() => document.body}
                                >
                                    <Space
                                        align="center"
                                        className="cursor-pointer p-2 pr-4 rounded-2xl hover:bg-white/15 backdrop-blur-sm transition-all duration-300 group active:scale-95"
                                    >
                                        <span className="text-sm font-medium text-white drop-shadow-md group-hover:text-pink-50 transition-colors">
                                            {user?.name || "User"}
                                        </span>
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
                                                        ? user.name.split(" ").filter(Boolean).map((w) => w[0]).slice(0, 2).join("").toUpperCase()
                                                        : "US")}
                                            </Avatar>
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
                        <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate("/")}>
                            <div className="relative w-10 h-10 bg-white rounded-lg p-1 flex items-center justify-center shadow-lg">
                                <img src="/logo/LOGOFINAL.png" alt="Logo" className="w-full h-full object-contain" />
                            </div>
                            <div className="flex flex-col leading-tight">
                                <span className="text-sm font-bold text-white drop-shadow-md">Bộ Hồ Sơ</span>
                                <span className="text-[10px] font-medium text-white/90 drop-shadow-sm">Quản Trị Nhân Sự</span>
                            </div>
                        </div>

                        {isAuthenticated && (
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
                                    className="w-6 h-6 text-white"
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.5 6.5h17M3.5 12h17m-17 5.5h17" />
                                </svg>
                            </Button>
                        )}

                        {/* ⭐ Nút Đăng Nhập mobile */}
                        {!isAuthenticated && (
                            <Link to="/login">
                                <button className="
                                    group relative flex items-center gap-1.5
                                    px-4 py-1.5 rounded-xl
                                    bg-white/15 backdrop-blur-sm
                                    border border-white/30
                                    text-white font-medium text-sm
                                    hover:bg-white hover:text-pink-500
                                    active:scale-95
                                    transition-all duration-200
                                    overflow-hidden
                                ">
                                    <span className="
                                        absolute inset-0 -translate-x-full
                                        bg-gradient-to-r from-transparent via-white/20 to-transparent
                                        group-hover:translate-x-full
                                        transition-transform duration-500
                                    " />
                                    <svg
                                        className="w-3.5 h-3.5"
                                        viewBox="0 0 24 24" fill="none"
                                        stroke="currentColor" strokeWidth="2"
                                    >
                                        <path strokeLinecap="round" strokeLinejoin="round"
                                            d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9"
                                        />
                                    </svg>
                                    <span className="relative">Đăng Nhập</span>
                                </button>
                            </Link>
                        )}
                    </div>
                )}

                <style>{`
                    @keyframes gradient-flow {
                        0%, 100% { background-position: 0% 50%; }
                        50% { background-position: 100% 50%; }
                    }
                    .animate-gradient-flow {
                        animation: gradient-flow 18s ease infinite;
                        background-size: 200% 200%;
                    }
                    .animate-ping {
                        animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;
                    }
                    @keyframes ping {
                        75%, 100% { transform: scale(2); opacity: 0; }
                    }
                `}</style>
            </header>

            <Drawer
                title="Chức năng"
                placement="right"
                onClose={() => setOpenMobileMenu(false)}
                open={openMobileMenu && isAuthenticated}
                width={240}
            >
                <Menu
                    onClick={onClick}
                    selectedKeys={[current]}
                    mode="vertical"
                    items={itemsMobile}
                />
            </Drawer>

            <ManageAccount
                open={openAccountModal}
                onClose={setOpenAccountModal}
            />
        </>
    );
};

export default Header;