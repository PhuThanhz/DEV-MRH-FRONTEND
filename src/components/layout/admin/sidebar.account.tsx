import React, { useState } from "react";
import { Avatar, Dropdown } from "antd";
import {
    ContactsOutlined,
    HomeOutlined,
    LogoutOutlined,
} from "@ant-design/icons";
import { Link, useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { callLogout } from "@/config/api";
import { setLogoutAction } from "@/redux/slice/accountSlide";
import { PATHS } from "@/constants/paths";
import ManageAccount from "@/components/common/modal/manage.account";
import { notify } from "@/components/common/notification/notify";
import { useAvatarSrc } from "@/hooks/useAvatarSrc";

interface SidebarAccountProps {
    collapsed?: boolean;
}

const getInitials = (name?: string) =>
    name
        ? name.split(" ").filter(Boolean).map((word) => word[0]).slice(0, 2).join("").toUpperCase()
        : "AD";

const getShortName = (name?: string) => {
    if (!name) return "Tài khoản";
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length <= 2) return name;
    return parts.slice(-2).join(" ");
};

const SidebarAccount: React.FC<SidebarAccountProps> = ({ collapsed = false }) => {
    const user = useAppSelector((state) => state.account.user);
    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    const [menuOpen, setMenuOpen] = useState(false);
    const [openAccountModal, setOpenAccountModal] = useState(false);
    const { src: avatarSrc, onError: handleAvatarError } = useAvatarSrc(user?.avatar);

    const displayName = user?.name || "Tài khoản";
    const shortName = getShortName(user?.name);
    const roleLabel = (user?.role?.name || "Admin").replaceAll("_", " ");
    const secondaryLabel = roleLabel.toLocaleLowerCase() === displayName.toLocaleLowerCase()
        ? user?.email || roleLabel
        : roleLabel;

    const handleLogout = () => {
        const logoutRequest = callLogout();
        navigate(PATHS.LOGIN, { replace: true, flushSync: true });

        window.setTimeout(() => {
            localStorage.removeItem("access_token");
            sessionStorage.clear();
            dispatch(setLogoutAction());
            notify.success("Đăng xuất thành công");
        }, 0);

        void logoutRequest.catch(() => undefined);
    };

    const dropdownContent = () => (
        <div className="sidebar-account-dropdown">
            <div className="sidebar-account-identity">
                <div className="sidebar-account-avatar-wrap">
                    <Avatar
                        size={42}
                        src={avatarSrc}
                        onError={handleAvatarError}
                        style={{
                            background: "linear-gradient(135deg, #ec4899, #a855f7)",
                            fontWeight: 700,
                            fontSize: 14,
                            color: "#fff",
                        }}
                    >
                        {!avatarSrc && getInitials(user?.name)}
                    </Avatar>
                    <span className="sidebar-account-online-dot" />
                </div>

                <div className="sidebar-account-identity-copy">
                    <div className="sidebar-account-identity-name" title={displayName}>{displayName}</div>
                    <div className="sidebar-account-identity-email" title={user?.email || roleLabel}>{user?.email || roleLabel}</div>
                </div>
            </div>

            <div className="sidebar-account-dropdown-section">
                <button
                    type="button"
                    className="sidebar-account-action"
                    onClick={() => {
                        setMenuOpen(false);
                        setOpenAccountModal(true);
                    }}
                >
                    <span className="sidebar-account-action-icon">
                        <ContactsOutlined />
                    </span>
                    <span>Hồ sơ cá nhân</span>
                </button>

                <Link
                    to="/"
                    className="sidebar-account-action"
                    onClick={() => setMenuOpen(false)}
                >
                    <span className="sidebar-account-action-icon">
                        <HomeOutlined />
                    </span>
                    <span>Trang chủ</span>
                </Link>
            </div>

            <div className="sidebar-account-dropdown-divider" />

            <div className="sidebar-account-dropdown-section sidebar-account-logout-section">
                <button
                    type="button"
                    className="sidebar-account-action sidebar-account-logout"
                    onClick={handleLogout}
                >
                    <span className="sidebar-account-action-icon">
                        <LogoutOutlined />
                    </span>
                    <span>Đăng xuất</span>
                </button>
            </div>
        </div>
    );

    return (
        <>
            <div className={`sidebar-account-footer${collapsed ? " is-collapsed" : ""}`}>
                <Dropdown
                    popupRender={dropdownContent}
                    trigger={["click"]}
                    open={menuOpen}
                    onOpenChange={setMenuOpen}
                    placement="topLeft"
                    overlayClassName="sidebar-account-popup"
                    overlayStyle={{ zIndex: 10000 }}
                    getPopupContainer={() => document.body}
                >
                    <button
                        type="button"
                        className="sidebar-account-trigger"
                        title={displayName}
                        aria-label={`Mở menu tài khoản của ${displayName}`}
                        aria-expanded={menuOpen}
                    >
                        <span className="sidebar-account-trigger-avatar">
                            <Avatar
                                size={38}
                                src={avatarSrc}
                                onError={handleAvatarError}
                                style={{
                                    backgroundColor: avatarSrc ? "transparent" : "#e8637a",
                                    fontWeight: 700,
                                    fontSize: 13,
                                    color: "#fff",
                                }}
                            >
                                {!avatarSrc && getInitials(user?.name)}
                            </Avatar>
                            <span className="sidebar-account-online-dot" />
                        </span>

                        {!collapsed && (
                            <>
                                <span className="sidebar-account-trigger-copy">
                                    <span className="sidebar-account-trigger-name" title={displayName}>{shortName}</span>
                                    <span className="sidebar-account-trigger-role" title={secondaryLabel}>{secondaryLabel}</span>
                                </span>
                                <svg
                                    className={`sidebar-account-chevron${menuOpen ? " is-open" : ""}`}
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2.25"
                                    aria-hidden="true"
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 15l6-6 6 6" />
                                </svg>
                            </>
                        )}
                    </button>
                </Dropdown>
            </div>

            <ManageAccount
                open={openAccountModal}
                onClose={setOpenAccountModal}
            />

            <style>{`
                .sidebar-account-footer {
                    flex: 0 0 auto;
                    padding: 10px 12px;
                    background: #fff;
                    border-top: 1px solid #f0f0f0;
                }
                .sidebar-account-footer.is-collapsed {
                    padding-inline: 10px;
                }
                .sidebar-account-trigger {
                    width: 100%;
                    min-height: 48px;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    padding: 5px 8px;
                    border: 1px solid transparent;
                    border-radius: 10px;
                    background: transparent;
                    color: #1f2937;
                    text-align: left;
                    cursor: pointer;
                    transition: background-color 0.18s ease, border-color 0.18s ease, transform 0.18s ease;
                }
                .sidebar-account-trigger:hover,
                .sidebar-account-trigger[aria-expanded="true"] {
                    background: rgba(232, 99, 122, 0.08);
                    border-color: rgba(232, 99, 122, 0.12);
                }
                .sidebar-account-trigger:active {
                    transform: scale(0.985);
                }
                .sidebar-account-trigger:focus-visible {
                    outline: 2px solid rgba(232, 99, 122, 0.45);
                    outline-offset: 2px;
                }
                .sidebar-account-footer.is-collapsed .sidebar-account-trigger {
                    justify-content: center;
                    padding-inline: 0;
                }
                .sidebar-account-trigger-avatar,
                .sidebar-account-avatar-wrap {
                    position: relative;
                    display: inline-flex;
                    flex: 0 0 auto;
                }
                .sidebar-account-online-dot {
                    position: absolute;
                    right: -1px;
                    bottom: 0;
                    width: 10px;
                    height: 10px;
                    border-radius: 50%;
                    background: #22c55e;
                    border: 2px solid #fff;
                }
                .sidebar-account-trigger-copy {
                    min-width: 0;
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    gap: 1px;
                }
                .sidebar-account-trigger-name,
                .sidebar-account-trigger-role {
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                }
                .sidebar-account-trigger-name {
                    color: #1f2937;
                    font-size: 13px;
                    font-weight: 650;
                    line-height: 1.25;
                }
                .sidebar-account-trigger-role {
                    color: #9ca3af;
                    font-size: 10px;
                    font-weight: 500;
                    line-height: 1.3;
                    text-transform: uppercase;
                    letter-spacing: 0.35px;
                }
                .sidebar-account-chevron {
                    width: 15px;
                    height: 15px;
                    flex: 0 0 auto;
                    color: #9ca3af;
                    transition: transform 0.18s ease;
                }
                .sidebar-account-chevron.is-open {
                    transform: rotate(180deg);
                }
                .sidebar-account-dropdown {
                    width: min(292px, calc(100vw - 24px));
                    overflow: hidden;
                    border: 1px solid #e5e7eb;
                    border-radius: 12px;
                    background: #fff;
                    box-shadow: 0 4px 6px -1px rgba(0,0,0,0.07), 0 10px 25px -5px rgba(0,0,0,0.08);
                }
                .sidebar-account-identity {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 14px 16px;
                    border-bottom: 1px solid #f3f4f6;
                }
                .sidebar-account-identity-copy {
                    min-width: 0;
                    flex: 1;
                }
                .sidebar-account-identity-name,
                .sidebar-account-identity-email {
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                }
                .sidebar-account-identity-name {
                    color: #111827;
                    font-size: 14px;
                    font-weight: 700;
                    line-height: 1.35;
                }
                .sidebar-account-identity-email {
                    margin-top: 2px;
                    color: #9ca3af;
                    font-size: 12px;
                }
                .sidebar-account-dropdown-section {
                    padding: 6px 8px 3px;
                }
                .sidebar-account-logout-section {
                    padding-block: 3px 10px;
                }
                .sidebar-account-action {
                    width: 100%;
                    min-height: 44px;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    padding: 10px;
                    border: 0;
                    border-radius: 8px;
                    background: transparent;
                    color: #374151;
                    font-size: 14px;
                    font-weight: 500;
                    text-align: left;
                    text-decoration: none;
                    cursor: pointer;
                    transition: background-color 0.12s ease;
                }
                .sidebar-account-action:hover {
                    background: #f9fafb;
                    color: #374151;
                }
                .sidebar-account-action:focus-visible {
                    outline: 2px solid rgba(232, 99, 122, 0.4);
                    outline-offset: -2px;
                }
                .sidebar-account-action-icon {
                    width: 23px;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    flex: 0 0 auto;
                    color: #9ca3af;
                    font-size: 16px;
                }
                .sidebar-account-dropdown-divider {
                    height: 1px;
                    margin: 4px 8px;
                    background: #f3f4f6;
                }
                .sidebar-account-logout,
                .sidebar-account-logout .sidebar-account-action-icon {
                    color: #f43f5e;
                }
                .sidebar-account-logout:hover {
                    background: #fff1f2;
                    color: #f43f5e;
                }
                .sidebar-account-popup {
                    animation: sidebar-account-popup-in 0.18s ease-out;
                }
                @keyframes sidebar-account-popup-in {
                    from { opacity: 0; transform: translateY(6px) scale(0.98); }
                    to { opacity: 1; transform: translateY(0) scale(1); }
                }
                @media (prefers-reduced-motion: reduce) {
                    .sidebar-account-popup { animation: none !important; }
                    .sidebar-account-trigger,
                    .sidebar-account-chevron { transition: none !important; }
                }
            `}</style>
        </>
    );
};

export default SidebarAccount;
