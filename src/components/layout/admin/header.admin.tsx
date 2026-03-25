import React, { useState } from "react";
import { Button, Dropdown, Avatar, Badge, message } from "antd";
import {
    LogoutOutlined,
    HomeOutlined,
    BellOutlined,
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
    const [bellOpen, setBellOpen] = useState(false);

    // =============================================
    // 🔔 THÔNG BÁO — kết nối logic của bạn vào đây
    // Thay `notifications` bằng data thật từ API/redux
    // Thay `unreadCount` bằng số thông báo chưa đọc thật
    // =============================================
    const notifications: { id: number; title: string; desc: string; read: boolean }[] = [
        // Ví dụ data mẫu — xoá khi có API thật:
        { id: 1, title: "Hồ sơ mới", desc: "Nguyễn Văn A vừa nộp hồ sơ", read: false },
        { id: 2, title: "Cập nhật hệ thống", desc: "Phiên bản 2.1.0 đã sẵn sàng", read: false },
        { id: 3, title: "Duyệt thành công", desc: "Hồ sơ #1023 đã được duyệt", read: true },
    ];
    const unreadCount = notifications.filter((n) => !n.read).length;
    // =============================================

    const avatarSrc = user?.avatar
        ? `${backendURL}/uploads/avatar/${user.avatar}`
        : undefined;

    const getInitials = (name?: string) =>
        name
            ? name.split(" ").filter(Boolean).map((w) => w[0]).slice(0, 2).join("").toUpperCase()
            : "AD";

    const getRoleLabel = () => {
        if (user?.role?.permissions?.length) return "Quản trị viên";
        return "Admin";
    };

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
                <Link
                    to="/"
                    className="flex items-center gap-2 text-gray-700 hover:text-pink-600 transition-colors"
                >
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

    /** ======== Dropdown chuông thông báo ======== */
    const bellDropdownItems = notifications.length > 0
        ? [
            ...notifications.map((n) => ({
                key: String(n.id),
                label: (
                    <div className="flex items-start gap-3 py-1 px-1 max-w-[260px]">
                        {/* Chấm đọc/chưa đọc */}
                        <span
                            className="mt-1.5 flex-shrink-0 w-2 h-2 rounded-full"
                            style={{ background: n.read ? "#d1d5db" : "#ec4899" }}
                        />
                        <div className="flex flex-col gap-0.5">
                            <span className="text-sm font-semibold text-gray-800">{n.title}</span>
                            <span className="text-xs text-gray-500">{n.desc}</span>
                        </div>
                    </div>
                ),
            })),
            { type: "divider" as const },
            {
                key: "view-all",
                label: (
                    // TODO: thay href bằng route thật của bạn
                    <div className="text-center text-xs text-pink-500 font-medium py-0.5 cursor-pointer hover:text-pink-700 transition-colors">
                        Xem tất cả thông báo
                    </div>
                ),
            },
        ]
        : [
            {
                key: "empty",
                label: (
                    <div className="text-center text-sm text-gray-400 py-3 px-4">
                        Không có thông báo mới
                    </div>
                ),
                disabled: true,
            },
        ];

    return (
        <header className="bg-gradient-to-r from-pink-500 via-rose-400 to-pink-600 text-white shadow-xl sticky top-0 z-40 border-b-2 border-white/20 overflow-hidden transition-all duration-300">
            {/* Gradient overlay động */}
            <div className="absolute inset-0 bg-gradient-to-r from-pink-600/20 via-rose-500/20 to-pink-600/20 animate-gradient-flow pointer-events-none" />

            {/* Subtle wave pattern */}
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
                    <Dropdown
                        menu={{ items: bellDropdownItems }}
                        trigger={["click"]}
                        open={bellOpen}
                        onOpenChange={setBellOpen}
                        placement="bottomRight"
                        overlayStyle={{ zIndex: 10000, minWidth: 280 }}
                        getPopupContainer={() => document.body}
                    >
                        <button
                            className="
                                relative flex items-center justify-center
                                w-9 h-9 rounded-full
                                bg-white/10 border border-white/25
                                hover:bg-white/20 hover:border-white/40
                                active:scale-95
                                transition-all duration-200
                                cursor-pointer
                            "
                        >
                            <BellOutlined className="text-white text-base" />
                            {unreadCount > 0 && (
                                <span
                                    className="absolute -top-1 -right-1 flex items-center justify-center
                                        min-w-[18px] h-[18px] px-1 rounded-full
                                        bg-red-500 text-white font-bold"
                                    style={{ fontSize: 10, lineHeight: 1 }}
                                >
                                    {unreadCount > 9 ? "9+" : unreadCount}
                                </span>
                            )}
                        </button>
                    </Dropdown>

                    {/* ✨ PILL USER — Premium */}
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
                        <div
                            className="
                                flex items-center gap-3 cursor-pointer
                                px-2 py-1.5 rounded-full
                                border border-white/25
                                bg-white/10 backdrop-blur-sm
                                hover:bg-white/20 hover:border-white/40
                                active:scale-95
                                transition-all duration-200
                                select-none
                            "
                        >
                            {/* Tên + role — ẩn trên mobile */}
                            {!isMobile && (
                                <>
                                    <div className="flex flex-col items-end gap-0.5 pl-2">
                                        <span className="text-sm font-semibold text-white leading-tight tracking-wide">
                                            {user?.name || "Admin"}
                                        </span>
                                        <span className="text-[10px] text-white/60 uppercase tracking-widest leading-tight">
                                            {getRoleLabel()}
                                        </span>
                                    </div>
                                    {/* Divider dọc */}
                                    <div className="w-px h-7 bg-white/20 flex-shrink-0" />
                                </>
                            )}

                            {/* Avatar */}
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
                                {/* Online dot */}
                                <span
                                    className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-pink-500"
                                    style={{ boxShadow: "0 0 0 1px rgba(52,211,153,0.4)" }}
                                />
                            </div>

                            {/* Chevron */}
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