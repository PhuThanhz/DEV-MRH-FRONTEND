import { useState, useEffect, useRef } from "react";
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

const getAccountDropdownWidth = (triggerWidth = 0) => {
    const viewportWidth = window.innerWidth;
    const availableWidth = Math.max(272, viewportWidth - 24);
    return Math.min(availableWidth, Math.max(292, Math.ceil(triggerWidth)));
};

const Header = () => {
    const navigate = useNavigate();
    const dispatch = useAppDispatch();
    const isAuthenticated = useAppSelector((state) => state.account.isAuthenticated);
    const user = useAppSelector((state) => state.account.user);
    const backendURL = import.meta.env.VITE_BACKEND_URL;

    const [openMobileMenu, setOpenMobileMenu] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);
    const [dropdownWidth, setDropdownWidth] = useState(292);
    const triggerRef = useRef<HTMLDivElement>(null);
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
        ? `${backendURL}/api/v1/files/public?fileName=${encodeURIComponent(user.avatar)}&folder=avatar&t=${Date.now()}`
        : undefined;

    // Lấy initials từ tên
    const getInitials = (name?: string) =>
        name
            ? name.split(" ").filter(Boolean).map((w) => w[0]).slice(0, 2).join("").toUpperCase()
            : "US";

    // Lấy role label
    const getRoleLabel = () => {
        if (user.role?.permissions?.length) return "Quản trị viên";
        return "Người dùng";
    };

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
            key: "manage-account",
            label: (
                <div
                    className="flex items-center gap-3 py-1.5 px-2 text-gray-700 hover:text-pink-600 transition-colors cursor-pointer text-[15px] font-medium min-w-[220px]"
                    onClick={() => setOpenAccountModal(true)}
                >
                    <ContactsOutlined className="text-[18px] text-pink-500" />
                    <span>Quản lý tài khoản</span>
                </div>
            ),
        },
        ...(user.role?.permissions?.length
            ? [
                {
                    key: "admin",
                    label: (
                        <Link to="/admin" className="flex items-center gap-3 py-1.5 px-2 text-gray-700 hover:text-pink-600 transition-colors text-[15px] font-medium">
                            <FireOutlined className="text-[18px] text-orange-500" />
                            <span>Trang quản trị</span>
                        </Link>
                    ),
                },
            ]
            : []),
        { type: "divider" as const },
        {
            key: "logout",
            label: (
                <div
                    onClick={handleLogout}
                    className="flex items-center gap-3 py-1.5 px-2 cursor-pointer text-red-500 hover:text-red-600 transition-colors text-[15px] font-medium"
                >
                    <LogoutOutlined className="text-[18px] text-red-500" />
                    <span>Đăng xuất</span>
                </div>
            ),
        },
    ];

    const customDropdownRender = () => (
        <div style={{
            width: dropdownWidth,
            maxWidth: "calc(100vw - 24px)",
            background: "#ffffff",
            borderRadius: 12,
            overflow: "hidden",
            border: "1px solid #e5e7eb",
            boxShadow: "0 4px 6px -1px rgba(0,0,0,0.07), 0 10px 25px -5px rgba(0,0,0,0.08)",
        }}>
            {/* ── Identity strip ── */}
            <div style={{ padding: "14px 16px", borderBottom: "1px solid #f3f4f6" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ position: "relative", flexShrink: 0 }}>
                        <Avatar
                            size={40}
                            src={avatarSrc}
                            style={{
                                background: "linear-gradient(135deg, #ec4899, #a855f7)",
                                fontWeight: 700, fontSize: 14, color: "#fff",
                            }}
                        >
                            {!user?.avatar && getInitials(user?.name)}
                        </Avatar>
                        <span style={{
                            position: "absolute", bottom: 0, right: 0,
                            width: 9, height: 9, borderRadius: "50%",
                            background: "#22c55e", border: "2px solid #fff",
                        }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                            fontSize: 14, fontWeight: 700, color: "#111827", lineHeight: 1.35,
                            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                        }}>
                            {user?.name || "User"}
                        </div>
                        <div style={{
                            fontSize: 12, color: "#9ca3af", marginTop: 2,
                            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                        }}>
                            {user?.email || ""}
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Menu Items ── */}
            <div style={{ padding: "6px 8px 3px" }}>
                <div
                    onClick={() => { setMenuOpen(false); setOpenAccountModal(true); }}
                    style={{
                        display: "flex", alignItems: "center", gap: 10,
                        padding: "10px 10px", borderRadius: 8, cursor: "pointer",
                        transition: "background 0.1s", minHeight: 44,
                    }}
                    onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background = "#f9fafb"; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = "transparent"; }}
                >
                    <div style={{ width: 23, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <ContactsOutlined style={{ fontSize: 16, color: "#9ca3af" }} />
                    </div>
                    <span style={{ fontSize: 14, color: "#374151", fontWeight: 500 }}>Hồ sơ cá nhân</span>
                </div>

                {user.role?.permissions?.length ? (
                    <Link
                        to="/admin"
                        onClick={() => setMenuOpen(false)}
                        style={{
                            display: "flex", alignItems: "center", gap: 10,
                            padding: "10px 10px", borderRadius: 8, textDecoration: "none",
                            transition: "background 0.1s", minHeight: 44,
                        }}
                        onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.background = "#f9fafb"; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.background = "transparent"; }}
                    >
                        <div style={{ width: 23, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                            <FireOutlined style={{ fontSize: 16, color: "#9ca3af" }} />
                        </div>
                        <span style={{ fontSize: 14, color: "#374151", fontWeight: 500 }}>Trang quản trị</span>
                    </Link>
                ) : null}
            </div>

            {/* ── Divider ── */}
            <div style={{ height: 1, background: "#f3f4f6", margin: "4px 8px" }} />

            {/* ── Logout ── */}
            <div style={{ padding: "3px 8px 10px" }}>
                <div
                    onClick={handleLogout}
                    style={{
                        display: "flex", alignItems: "center", gap: 10,
                        padding: "10px 10px", borderRadius: 8, cursor: "pointer",
                        transition: "background 0.1s", minHeight: 44,
                    }}
                    onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background = "#fff1f2"; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = "transparent"; }}
                >
                    <div style={{ width: 23, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <LogoutOutlined style={{ fontSize: 16, color: "#f43f5e" }} />
                    </div>
                    <span style={{ fontSize: 14, color: "#f43f5e", fontWeight: 500 }}>Đăng xuất</span>
                </div>
            </div>
        </div>
    );

    const itemsMobile = [...itemsDropdown];

    const onClick: MenuProps["onClick"] = (e) => {
        setCurrent(e.key);
        setOpenMobileMenu(false);
    };



    return (
        <>
            <header className="bg-gradient-to-r from-pink-500 via-rose-400 to-pink-600 text-white shadow-xl sticky top-0 z-[1000] border-b border-white/10 overflow-hidden transition-all duration-300">
                {/* GPU-accelerated wave overlay */}
                <div className="absolute inset-0 opacity-10 overflow-hidden pointer-events-none">
                    <svg className="absolute top-0 left-0 w-[200%] h-full animate-wave-flow" viewBox="0 0 2400 60" preserveAspectRatio="none">
                        <path d="M0,30 Q150,10 300,30 T600,30 T900,30 T1200,30 T1500,30 T1800,30 T2100,30 T2400,30" stroke="white" strokeWidth="2" fill="none" />
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
                                <img src="/logo/LOGOFINAL.webp" alt="Logo" className="w-full h-full object-contain" />
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
                                        <span className="
                                            absolute inset-0 -translate-x-full
                                            bg-gradient-to-r from-transparent via-white/20 to-transparent
                                            group-hover:translate-x-full
                                            transition-transform duration-500
                                        " />
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
                                    popupRender={customDropdownRender}
                                    trigger={["click"]}
                                    open={menuOpen}
                                    onOpenChange={(open) => {
                                        setMenuOpen(open);
                                        if (open && triggerRef.current) {
                                            setDropdownWidth(getAccountDropdownWidth(triggerRef.current.getBoundingClientRect().width));
                                        }
                                    }}
                                    placement="bottomRight"
                                    overlayClassName="animate-dropdown-slide"
                                    overlayStyle={{ zIndex: 10000 }}
                                    getPopupContainer={() => document.body}
                                >
                                    {/* ✨ PILL USER - PREMIUM */}
                                    <div
                                        ref={triggerRef}
                                        className="
                                            flex items-center gap-3 cursor-pointer
                                            px-2.5 py-1.5 rounded-full
                                            border border-white/25
                                            bg-white/10 backdrop-blur-sm
                                            hover:bg-white/20 hover:border-white/40
                                            active:scale-95
                                            transition-all duration-200
                                            select-none
                                        "
                                        style={{ minWidth: 0, minHeight: 44 }}
                                    >
                                        {/* Separator dọc */}
                                        <div className="flex flex-col items-end gap-0.5 pl-2">
                                            <span className="text-sm font-semibold text-white leading-tight tracking-wide">
                                                {user?.name || "User"}
                                            </span>

                                        </div>

                                        {/* Divider */}
                                        <div className="w-px h-7 bg-white/20 flex-shrink-0" />

                                        {/* Avatar */}
                                        <div className="relative flex-shrink-0">
                                            <Avatar
                                                size={36}
                                                src={avatarSrc}
                                                style={{
                                                    backgroundColor: avatarSrc ? "transparent" : "rgba(255,255,255,0.2)",
                                                    border: "1.5px solid rgba(255,255,255,0.55)",
                                                    fontWeight: 700,
                                                    fontSize: 13,
                                                    color: "#fff",
                                                    flexShrink: 0,
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
                            )}
                        </div>
                    </div>
                ) : (
                    // Mobile header
                    <div className="relative z-10 flex items-center justify-between h-[72px] px-4 gap-4">
                        <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate("/")}>
                            <div className="relative w-[54px] h-[54px] bg-white rounded-[14px] p-1.5 flex items-center justify-center shadow-[0_4px_12px_rgba(236,72,153,0.35)] border border-pink-100">
                                <img src="/logo/LOGOFINAL.webp" alt="Logo" className="w-full h-full object-contain" />
                            </div>
                            <div className="flex flex-col leading-tight mt-0.5">
                                <span className="text-[18px] font-black text-white drop-shadow-md tracking-wide">Bộ Hồ Sơ</span>
                                <span className="text-[11.5px] font-bold text-pink-50 drop-shadow-sm uppercase tracking-wider mt-0.5">Quản Trị Nhân Sự</span>
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
                    @keyframes wave-flow {
                        0% { transform: translate3d(0, 0, 0); }
                        100% { transform: translate3d(-50%, 0, 0); }
                    }
                    .animate-wave-flow {
                        animation: wave-flow 25s linear infinite;
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
                closable={false}
                title={null}
                placement="bottom"
                onClose={() => setOpenMobileMenu(false)}
                open={openMobileMenu && isAuthenticated}
                height="auto"
                styles={{
                    content: { borderTopLeftRadius: 32, borderTopRightRadius: 32, paddingBottom: 24 },
                    body: { padding: 0 }
                }}
            >
                {/* Drag Handle */}
                <div className="w-full flex justify-center pt-4 pb-2" onClick={() => setOpenMobileMenu(false)}>
                    <div className="w-12 h-1.5 bg-gray-200 rounded-full" />
                </div>

                <div className="px-5 pb-2">
                    {/* Identity Strip */}
                    <div className="flex items-center gap-4 bg-gradient-to-br from-pink-50/80 to-rose-50/50 p-4 rounded-[20px] border border-pink-100/50 mb-5 shadow-sm">
                        <div className="relative flex-shrink-0">
                            <Avatar
                                size={52}
                                src={avatarSrc}
                                className="flex items-center justify-center font-bold text-[18px] border-[3px] border-white shadow-md"
                                style={{ background: "linear-gradient(135deg, #ec4899, #f43f5e)" }}
                            >
                                {!user?.avatar && getInitials(user?.name)}
                            </Avatar>
                            <span className="absolute bottom-1 right-0 w-3.5 h-3.5 rounded-full bg-green-500 border-[2.5px] border-white shadow-sm" />
                        </div>
                        <div className="flex flex-col flex-1 min-w-0">
                            <span className="text-[17px] font-black text-gray-800 leading-tight truncate">{user?.name || "Người Dùng"}</span>
                            <span className="text-[12.5px] font-medium text-gray-500 mt-0.5 truncate">{user?.email || "Chưa cập nhật email"}</span>
                            <div className="mt-1.5 inline-flex items-center px-2.5 py-0.5 rounded-full bg-white text-pink-600 text-[10px] font-extrabold border border-pink-100 uppercase tracking-wider shadow-sm self-start">
                                {getRoleLabel()}
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col gap-2.5">
                        <div
                            onClick={() => { setOpenMobileMenu(false); setOpenAccountModal(true); }}
                            className="flex items-center gap-4 p-4 rounded-[18px] cursor-pointer transition-all active:scale-[0.98] bg-white border border-gray-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)]"
                        >
                            <div className="w-12 h-12 rounded-[14px] bg-pink-50 flex items-center justify-center text-pink-500">
                                <ContactsOutlined className="text-[20px]" />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[15px] font-bold text-gray-700 leading-tight">Hồ sơ cá nhân</span>
                            </div>
                        </div>

                        {user.role?.permissions?.length ? (
                            <Link
                                to="/admin"
                                onClick={() => setOpenMobileMenu(false)}
                                className="flex items-center gap-4 p-4 rounded-[18px] cursor-pointer transition-all active:scale-[0.98] bg-white border border-gray-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)] no-underline"
                            >
                                <div className="w-12 h-12 rounded-[14px] bg-orange-50 flex items-center justify-center text-orange-500">
                                    <FireOutlined className="text-[20px]" />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[15px] font-bold text-gray-700 leading-tight">Trang quản trị</span>
                                </div>
                            </Link>
                        ) : null}

                        <div className="h-[1px] bg-gray-100 my-2 mx-4" />

                        <div
                            onClick={handleLogout}
                            className="flex items-center gap-4 p-4 rounded-[18px] cursor-pointer transition-all active:scale-[0.98] bg-rose-50/50 border border-rose-100/50"
                        >
                            <div className="w-12 h-12 rounded-[14px] bg-white flex items-center justify-center text-rose-500 shadow-sm">
                                <LogoutOutlined className="text-[20px]" />
                            </div>
                            <span className="text-[15px] font-bold text-rose-600">Đăng xuất</span>
                        </div>
                    </div>
                </div>
            </Drawer>

            <ManageAccount
                open={openAccountModal}
                onClose={setOpenAccountModal}
            />
        </>
    );
};

export default Header;
