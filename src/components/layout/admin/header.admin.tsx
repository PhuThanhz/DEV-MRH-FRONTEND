import React, { useState } from "react";
import { Button, Dropdown, Avatar, message } from "antd";
import {
    LogoutOutlined,
    HomeOutlined,
    ContactsOutlined,
} from "@ant-design/icons";
import { Link, useNavigate } from "react-router-dom";
import { isMobile } from "react-device-detect";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { callLogout } from "@/config/api";
import { setLogoutAction } from "@/redux/slice/accountSlide";
import { PATHS } from "@/constants/paths";
import ManageAccount from "@/components/common/modal/manage.account";
import NotificationBell from "@/components/common/notification/NotificationBell";

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
    const [openAccountModal, setOpenAccountModal] = useState(false);

    const avatarSrc = user?.avatar
        ? `${backendURL}/uploads/avatar/${user.avatar}`
        : undefined;

    const getInitials = (name?: string) =>
        name
            ? name.split(" ").filter(Boolean).map((w) => w[0]).slice(0, 2).join("").toUpperCase()
            : "AD";

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

    const menuItems = [
        {
            key: "manage-account",
            label: (
                <span
                    className="flex items-center gap-2 text-gray-700 hover:text-pink-600 transition-colors cursor-pointer"
                    onClick={() => {
                        setMenuOpen(false);
                        setOpenAccountModal(true);
                    }}
                >
                    <ContactsOutlined /> Quản lý tài khoản
                </span>
            ),
        },
        {
            key: "home",
            label: (
                <Link
                    to="/"
                    className="flex items-center gap-2 text-gray-700 hover:text-pink-600 transition-colors"
                >
                    <HomeOutlined /> Trang chủ
                </Link>
            ),
        },
        { type: "divider" as const },
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
        <>
            <header className="bg-gradient-to-r from-pink-500 via-rose-400 to-pink-600 text-white shadow-xl sticky top-0 z-40 border-b-2 border-white/20 overflow-hidden transition-all duration-300">
                <div className="absolute inset-0 bg-gradient-to-r from-pink-600/20 via-rose-500/20 to-pink-600/20 animate-gradient-flow pointer-events-none" />

                <div className="absolute inset-0 opacity-10 overflow-hidden pointer-events-none">
                    <svg className="absolute top-0 left-0 w-full h-full" viewBox="0 0 1200 60">
                        <path d="M0,30 Q150,10 300,30 T600,30 T900,30 T1200,30" stroke="white" strokeWidth="2" fill="none">
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

                    {/* LEFT: Toggle sidebar */}
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
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3.5 6.5h17M3.5 12h17m-17 5.5h17" />
                        </svg>
                    </Button>

                    {/* RIGHT: Bell + User */}
                    <div className="flex items-center gap-3">

                        {/* 🔔 Chuông thông báo */}
                        <NotificationBell />

                        {/* ✨ PILL USER */}
                        <Dropdown
                            menu={{ items: menuItems }}
                            trigger={["click"]}
                            open={menuOpen}
                            onOpenChange={setMenuOpen}
                            placement="bottomRight"
                            overlayClassName="animate-dropdown-slide"
                            overlayStyle={{ zIndex: 10000 }}
                            getPopupContainer={() => document.body}
                        >
                            <div className="
                                flex items-center gap-3 cursor-pointer
                                px-2 py-1.5 rounded-full
                                border border-white/25
                                bg-white/10 backdrop-blur-sm
                                hover:bg-white/20 hover:border-white/40
                                active:scale-95
                                transition-all duration-200
                                select-none
                            ">
                                {!isMobile && (
                                    <>
                                        <div className="flex flex-col items-end gap-0.5 pl-2">
                                            <span className="text-sm font-semibold text-white leading-tight tracking-wide">
                                                {user?.name || "Admin"}
                                            </span>
                                        </div>
                                        <div className="w-px h-7 bg-white/20 flex-shrink-0" />
                                    </>
                                )}

                                <div className="relative flex-shrink-0">
                                    <Avatar
                                        size={isMobile ? 32 : 34}
                                        src={avatarSrc}
                                        style={{
                                            backgroundColor: avatarSrc ? "transparent" : "rgba(255,255,255,0.2)",
                                            border: "1.5px solid rgba(255,255,255,0.55)",
                                            fontWeight: 700,
                                            fontSize: 12,
                                            color: "#fff",
                                        }}
                                    >
                                        {!user?.avatar && getInitials(user?.name)}
                                    </Avatar>
                                    <span
                                        className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-pink-500"
                                        style={{ boxShadow: "0 0 0 1px rgba(52,211,153,0.4)" }}
                                    />
                                </div>

                                <svg
                                    className="w-3.5 h-3.5 text-white/50 flex-shrink-0 mr-1"
                                    viewBox="0 0 24 24" fill="none"
                                    stroke="currentColor" strokeWidth="2.5"
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                                </svg>
                            </div>
                        </Dropdown>
                    </div>
                </div>

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
                `}</style>
            </header>

            <ManageAccount
                open={openAccountModal}
                onClose={setOpenAccountModal}
            />
        </>
    );
};

export default HeaderAdmin;