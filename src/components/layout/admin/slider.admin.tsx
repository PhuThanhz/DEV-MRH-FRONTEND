import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Layout, Menu, Drawer, Button, Switch } from "antd";
import type { MenuProps } from "antd";
import { CloseOutlined, QrcodeOutlined } from "@ant-design/icons";
import { useAppSelector } from "@/redux/hooks";
import { generateMenuItems } from "./menuItems";
import { useQuery } from "@tanstack/react-query";
import useAccess from "@/hooks/useAccess";
import { ALL_PERMISSIONS } from "@/config/permissions";
import {
    callFetchPendingManagerRecords,
    callFetchPendingApprovalRecords,
    callFetchMyEvaluationRecords
} from "@/config/api";

const { Sider } = Layout;

interface IProps {
    collapsed: boolean;
    setCollapsed: (val: boolean) => void;
    activeMenu: string;
    setActiveMenu: (val: string) => void;
    mobileOpen?: boolean;
    setMobileOpen?: (val: boolean) => void;
}

const SliderAdmin: React.FC<IProps> = ({
    collapsed,
    setCollapsed,
    activeMenu,
    setActiveMenu,
    mobileOpen = false,
    setMobileOpen = () => { },
}) => {
    const navigate = useNavigate();
    const permissions = useAppSelector((state) => state.account.user.role.permissions);
    const roleName = useAppSelector((state) => state.account.user.role?.name || "");
    const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
    const [showScannerButton, setShowScannerButton] = useState<boolean>(() => {
        const saved = localStorage.getItem("qr-scan-enabled");
        return saved !== null ? saved === "true" : false;
    });

    const canViewMyEval = useAccess(ALL_PERMISSIONS.EVALUATION.GET_MY_RECORDS);
    const canViewManagerEval = useAccess(ALL_PERMISSIONS.EVALUATION.GET_PENDING_MANAGER_RECORDS);
    const canViewApproverEval = useAccess(ALL_PERMISSIONS.EVALUATION.GET_PENDING_APPROVAL_RECORDS);

    const pendingManagerQuery = useQuery({
        queryKey: ["pending-manager-evaluation-records"],
        queryFn: async () => {
            const res = await callFetchPendingManagerRecords();
            return res?.data || [];
        },
        select: (records: any[]) => records.length,
        enabled: canViewManagerEval,
        staleTime: 60 * 1000,
        refetchOnWindowFocus: false,
    });

    const pendingApprovalQuery = useQuery({
        queryKey: ["pending-approval-evaluation-records"],
        queryFn: async () => {
            const res = await callFetchPendingApprovalRecords();
            return res?.data || [];
        },
        select: (records: any[]) => records.length,
        enabled: canViewApproverEval,
        staleTime: 60 * 1000,
        refetchOnWindowFocus: false,
    });

    const myRecordsQuery = useQuery({
        queryKey: ["my-evaluation-records"],
        queryFn: async () => {
            const res = await callFetchMyEvaluationRecords();
            return res?.data || [];
        },
        select: (records: any[]) => records.filter(r => r.status === "EMPLOYEE_DRAFTING" || r.status === "REVISION_NEEDED").length,
        enabled: canViewMyEval,
        staleTime: 60 * 1000,
        refetchOnWindowFocus: false,
    });

    const pendingManagerCount = pendingManagerQuery.data || 0;
    const pendingApprovalCount = pendingApprovalQuery.data || 0;
    const myPendingCount = myRecordsQuery.data || 0;

    const totalTasksCount = pendingManagerCount + pendingApprovalCount + myPendingCount;

    const menuItems = useMemo(
        () => generateMenuItems(permissions, roleName, totalTasksCount),
        [permissions, roleName, totalTasksCount]
    );

    useEffect(() => {
        const handleResize = () => {
            const mobile = window.innerWidth < 1024;
            setIsMobile(mobile);
            if (mobile) setMobileOpen(false);
        };
        handleResize();
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, [setMobileOpen]);

    const Logo = (
        <div
            className="logo-container"
            style={{
                height: 64,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderBottom: "1px solid #f0f0f0",
                background: "rgba(255, 250, 252, 0.8)",
                transition: "background 0.2s ease",
                position: "relative",
                overflow: "hidden",
                cursor: "pointer",
            }}
            onClick={() => navigate("/admin")}
        >
            {collapsed && !isMobile ? (
                <img
                    src="/logo/LOGOFINAL.webp"
                    alt="LOTUS HRM"
                    style={{ width: 36, height: "auto", objectFit: "contain" }}
                />
            ) : (
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <img
                        src="/logo/LOGOFINAL.webp"
                        alt="LOTUS HRM"
                        style={{ width: 42, height: "auto", objectFit: "contain" }}
                    />
                    <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                        <span
                            style={{
                                fontSize: 18,
                                fontWeight: 700,
                                color: "#d63384",
                                letterSpacing: "0.5px",
                                lineHeight: 1.2,
                            }}
                        >
                            LOTUS HRM
                        </span>
                        <span
                            style={{
                                fontSize: 10,
                                fontWeight: 500,
                                color: "#f472b6",
                                letterSpacing: "0.3px",
                                lineHeight: 1.2,
                            }}
                        >
                            Bộ hồ sơ quản trị nhân sự
                        </span>
                    </div>
                </div>
            )}
            <div
                className="logo-overlay"
                style={{
                    position: "absolute",
                    inset: 0,
                    background: "rgba(255, 105, 180, 0)",
                    transition: "background 0.3s ease",
                    pointerEvents: "none",
                }}
            />
        </div>
    );

    const filteredMenuItems: MenuProps["items"] = (collapsed
        ? menuItems.filter((item) => item.type !== "group")
        : menuItems
    ).map((item) => {
        const normalizedItem = item.type === "subgroup" ? { ...item, type: undefined } : item;

        return normalizedItem.key === "qr-scanner-toggle"
            ? {
                ...normalizedItem,
                label: (
                    <div style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        paddingRight: 4,
                    }}>
                        <span>Quét quy trình</span>
                        <Switch
                            size="small"
                            checked={showScannerButton}
                            style={{
                                backgroundColor: showScannerButton ? "#ec4899" : undefined,
                                minWidth: 32,
                                pointerEvents: "none",
                            }}
                        />
                    </div>
                ),
            }
            : normalizedItem;
    }) as MenuProps["items"];

    const MenuList = (
        <Menu
            selectedKeys={[activeMenu]}
            mode="inline"
            items={filteredMenuItems}
            onClick={(e) => {
                if (e.key === "qr-scanner-toggle") {
                    setShowScannerButton((prev) => {
                        const next = !prev;
                        localStorage.setItem("qr-scan-enabled", String(next));
                        return next;
                    });
                    return;
                }
                setActiveMenu(e.key);
                navigate(e.key);
                if (isMobile) setMobileOpen(false);
            }}
            style={{
                border: "none",
                background: "transparent",
                paddingTop: 12,
            }}
            className="sidebar-menu-pink"
        />
    );

    const ScannerButton = showScannerButton && (
        <div
            style={{
                position: "fixed",
                left: "50%",
                bottom: 32,
                transform: "translateX(-50%)",
                zIndex: 2000,
            }}
        >
            <Button
                type="primary"
                shape="circle"
                size="large"
                icon={<QrcodeOutlined style={{ fontSize: 32 }} />}
                style={{
                    width: 72,
                    height: 72,
                    background: "#ec4899",
                    borderColor: "#ec4899",
                    boxShadow: "0 12px 32px rgba(255, 105, 180, 0.3)",
                }}
                onClick={() => window.dispatchEvent(new CustomEvent("openScannerModal"))}
            />
        </div>
    );

    const sharedStyles = `
        .sidebar-menu-pink .ant-menu-item:hover {
            background-color: rgba(236, 72, 153, 0.08) !important;
        }

        .sidebar-menu-pink .ant-menu-submenu-title:hover {
            background-color: rgba(236, 72, 153, 0.08) !important;
        }

        .sidebar-menu-pink .ant-menu-item-selected {
            background-color: rgba(236, 72, 153, 0.12) !important;
            color: #ec4899 !important;
            font-weight: 600;
        }

        .sidebar-menu-pink .ant-menu-item-selected::after {
            border-right: 3px solid #ec4899 !important;
        }

        .sidebar-menu-pink .ant-menu-item-selected .ant-menu-item-icon {
            color: #ec4899 !important;
        }

        .sidebar-menu-pink .ant-menu-submenu-selected > .ant-menu-submenu-title {
            color: #ec4899 !important;
        }

        .ant-menu-submenu-popup .ant-menu-item-selected,
        .ant-menu-submenu-popup .ant-menu-item-selected a,
        .ant-menu-submenu-popup .ant-menu-item-selected span {
            color: #ec4899 !important;
        }

        .ant-menu-submenu-popup .ant-menu-item-selected {
            background-color: transparent !important;
        }

        .ant-menu-submenu-popup .ant-menu-item:hover,
        .ant-menu-submenu-popup .ant-menu-item:hover a,
        .ant-menu-submenu-popup .ant-menu-item:hover span {
            color: #ec4899 !important;
            background-color: rgba(236, 72, 153, 0.06) !important;
        }

        .ant-menu-submenu-popup .ant-menu-item-selected::after {
            border-right: 3px solid #ec4899 !important;
        }

        .logo-container:hover .logo-overlay {
            background: rgba(236, 72, 153, 0.05) !important;
        }

        .sidebar-menu-pink .ant-menu-item,
        .sidebar-menu-pink .ant-menu-submenu-title {
            transition: background-color 0.18s ease, color 0.18s ease !important;
        }

        .sidebar-scroll::-webkit-scrollbar {
            width: 2px;
        }

        .sidebar-scroll::-webkit-scrollbar-track {
            background: transparent;
        }

        .sidebar-scroll::-webkit-scrollbar-thumb {
            background: rgba(0, 0, 0, 0.1);
            border-radius: 99px;
        }

        .sidebar-scroll:hover::-webkit-scrollbar-thumb {
            background: rgba(0, 0, 0, 0.18);
        }

        .sidebar-scroll {
            scrollbar-width: thin;
            scrollbar-color: rgba(0, 0, 0, 0.1) transparent;
        }
    `;

    if (isMobile) {
        return (
            <>
                <Drawer
                    placement="left"
                    open={mobileOpen}
                    onClose={() => setMobileOpen(false)}
                    width={280}
                    styles={{ body: { padding: 0, background: "#fff" } }}
                    closeIcon={null}
                >
                    <div
                        style={{
                            height: 64,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            padding: "0 16px",
                            borderBottom: "1px solid #f0f0f0",
                            background: "rgba(255, 245, 247, 0.9)",
                            position: "relative",
                            cursor: "pointer",
                        }}
                        onClick={() => {
                            navigate("/admin");
                            setMobileOpen(false);
                        }}
                    >
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <img
                                src="/logo/LOGOFINAL.webp"
                                alt="LOTUS HRM"
                                style={{ width: 40, height: "auto" }}
                            />
                            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                                <span style={{ fontSize: 16, fontWeight: 700, color: "#d63384" }}>
                                    LOTUS HRM
                                </span>
                                <span style={{ fontSize: 9, fontWeight: 500, color: "#f472b6" }}>
                                    Quản trị nhân sự
                                </span>
                            </div>
                        </div>

                        <Button
                            type="text"
                            icon={<CloseOutlined />}
                            onClick={() => setMobileOpen(false)}
                            style={{ color: "#d63384" }}
                        />

                        <div
                            className="logo-overlay"
                            style={{
                                position: "absolute",
                                inset: 0,
                                background: "rgba(255, 105, 180, 0)",
                                transition: "background 0.3s ease",
                                pointerEvents: "none",
                            }}
                        />
                    </div>

                    <div className="sidebar-scroll" style={{ overflowY: "auto", height: "calc(100% - 64px)" }}>
                        {MenuList}
                    </div>
                </Drawer>

                {ScannerButton}

                <style>{sharedStyles}</style>
            </>
        );
    }

    return (
        <>
            <Sider
                theme="light"
                collapsible
                collapsed={collapsed}
                onCollapse={setCollapsed}
                width={260}
                collapsedWidth={80}
                trigger={null}
                style={{
                    position: "sticky",
                    top: 0,
                    height: "100vh",
                    background: "#fff",
                    borderRight: "1px solid #f0f0f0",
                }}
            >
                {Logo}

                <div className="sidebar-scroll" style={{ overflowY: "auto", height: "calc(100vh - 64px)" }}>
                    {MenuList}
                </div>
            </Sider>

            {ScannerButton}

            <style>{sharedStyles}</style>
        </>
    );
};

export default SliderAdmin;
