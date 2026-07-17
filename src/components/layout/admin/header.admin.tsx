import React, { useState, useRef } from "react";
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

const getAccountDropdownWidth = (triggerWidth = 0) => {
    const viewportWidth = window.innerWidth;
    const availableWidth = Math.max(272, viewportWidth - 24);
    return Math.min(availableWidth, Math.max(292, Math.ceil(triggerWidth)));
};

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
    const [notifOpen, setNotifOpen] = useState(false);
    const [openAccountModal, setOpenAccountModal] = useState(false);
    const [dropdownWidth, setDropdownWidth] = useState(292);
    const triggerRef = useRef<HTMLDivElement>(null);

    const avatarSrc = user?.avatar
        ? `${backendURL}/api/v1/files/public?fileName=${encodeURIComponent(user.avatar)}&folder=avatar`
        : undefined;

    const getInitials = (name?: string) =>
        name
            ? name.split(" ").filter(Boolean).map((w) => w[0]).slice(0, 2).join("").toUpperCase()
            : "AD";

    const handleLogout = () => {
        const logoutRequest = callLogout();
        navigate(PATHS.HOME, { replace: true, flushSync: true });

        window.setTimeout(() => {
            localStorage.removeItem("access_token");
            sessionStorage.clear();
            dispatch(setLogoutAction());
            message.success("Đăng xuất thành công");
        }, 0);

        void logoutRequest.catch(() => undefined);
    };

    const roleName = user?.role?.name || "Admin";

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
                            size={42}
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
                            {user?.name || "Admin"}
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
                {/* Hồ sơ cá nhân */}
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

                {/* Trang chủ */}
                <Link
                    to="/"
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
                        <HomeOutlined style={{ fontSize: 16, color: "#9ca3af" }} />
                    </div>
                    <span style={{ fontSize: 14, color: "#374151", fontWeight: 500 }}>Trang chủ</span>
                </Link>
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

    return (
        <>
            <header className="bg-gradient-to-r from-pink-500 via-rose-400 to-pink-600 text-white shadow-xl sticky top-0 z-40 border-b border-white/10 overflow-hidden transition-all duration-300">
                {/* GPU-accelerated wave overlay */}
                <div className="absolute inset-0 opacity-10 overflow-hidden pointer-events-none">
                    <svg className="absolute top-0 left-0 w-[200%] h-full animate-wave-flow" viewBox="0 0 2400 60" preserveAspectRatio="none">
                        <path d="M0,30 Q150,10 300,30 T600,30 T900,30 T1200,30 T1500,30 T1800,30 T2100,30 T2400,30" stroke="white" strokeWidth="2" fill="none" />
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
                        <NotificationBell
                            open={notifOpen}
                            onOpenChange={(open) => {
                                setNotifOpen(open);
                                if (open) setMenuOpen(false);
                            }}
                        />

                        {/* ✨ PILL USER */}
                        <Dropdown
                            popupRender={customDropdownRender}
                            trigger={["click"]}
                            open={menuOpen}
                            onOpenChange={(open) => {
                                setMenuOpen(open);
                                if (open) {
                                    setNotifOpen(false);
                                    if (triggerRef.current) {
                                        setDropdownWidth(getAccountDropdownWidth(triggerRef.current.getBoundingClientRect().width));
                                    }
                                }
                            }}
                            placement="bottomRight"
                            overlayClassName="animate-dropdown-slide"
                            overlayStyle={{ zIndex: 10000 }}
                            getPopupContainer={() => document.body}
                        >
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
                                style={{ minHeight: 44 }}
                            >
                                <div className="hidden md:flex items-center">
                                    <div className="flex flex-col items-end gap-0.5 pl-2">
                                        <span className="text-sm font-semibold text-white leading-tight tracking-wide">
                                            {user?.name || "Admin"}
                                        </span>
                                    </div>
                                    <div className="w-px h-7 bg-white/20 flex-shrink-0 ml-3 mr-1" />
                                </div>

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
                    @keyframes wave-flow {
                        0% { transform: translate3d(0, 0, 0); }
                        100% { transform: translate3d(-50%, 0, 0); }
                    }
                    .animate-wave-flow {
                        animation: wave-flow 25s linear infinite;
                    }
                    @keyframes dropdown-slide {
                        from { opacity: 0; transform: translateY(-10px) scale(0.95); }
                        to { opacity: 1; transform: translateY(0) scale(1); }
                    }
                    @media (prefers-reduced-motion: reduce) {
                        .animate-dropdown-slide,
                        .animate-wave-flow {
                            animation: none !important;
                        }
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
