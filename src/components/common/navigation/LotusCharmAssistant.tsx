import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ArrowUpOutlined, CloseOutlined, SearchOutlined, BellOutlined, RightOutlined, UserAddOutlined, ApartmentOutlined, FileAddOutlined, SolutionOutlined, IdcardOutlined, ClusterOutlined, BankOutlined, FileDoneOutlined, FileTextOutlined, StarFilled, StarOutlined, PlayCircleOutlined } from "@ant-design/icons";
import { useAppSelector } from "@/redux/hooks";
import { Badge, Input, Modal } from "antd";
import { ALL_PERMISSIONS } from "@/config/permissions";
import { useNotifications } from "@/hooks/useNotifications";
import { useQuickAccess } from "@/hooks/useQuickAccess";
import type { QuickAccessItem } from "@/config/quickAccess";
import { getFilteredGuidesForPath, LOTUS_GUIDES } from "@/components/common/guide/guideRegistry";
import { useLotusGuide } from "@/components/common/guide/LotusGuideProvider";
import useGuidePermission from "@/hooks/useGuidePermission";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import "dayjs/locale/vi";

dayjs.extend(relativeTime);
dayjs.locale("vi");

const ACCENT = "#e8637a";

const LotusCharmAssistant = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [open, setOpen] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);
    const [isGuideOpen, setIsGuideOpen] = useState(false);
    const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
    const [guideSearchQuery, setGuideSearchQuery] = useState("");
    const [activeGuideModule, setActiveGuideModule] = useState<string | null>(null);

    React.useEffect(() => {
        if (isGuideOpen && !activeGuideModule) {
            const matched = LOTUS_GUIDES.find(g =>
                g.routePattern
                    ? g.routePattern.test(location.pathname)
                    : location.pathname.startsWith(g.routePrefix)
            );
            const defaultModule = matched?.module || LOTUS_GUIDES[0]?.module;
            setActiveGuideModule(defaultModule);
        }
    }, [isGuideOpen, location.pathname, activeGuideModule]);

    // Check if we are inside a department
    const match = location.pathname.match(/\/departments\/([^/]+)/);
    const departmentId = match ? match[1] : null;

    const { user } = useAppSelector((state) => state.account);
    const firstName = user?.name?.trim() ? user.name.trim().split(" ").pop() : "bạn";

    const { hasPermission, canStartGuide } = useGuidePermission();

    const DEPARTMENT_MODULES_RAW = React.useMemo(() => departmentId ? [
        { label: "Sơ đồ tổ chức", path: `/admin/departments/${departmentId}/org-chart`, icon: <ClusterOutlined />, requiredPermission: ALL_PERMISSIONS.DEPARTMENTS.GET_PAGINATE },
        { label: "Mục tiêu - Nhiệm vụ", path: `/admin/departments/${departmentId}/objectives-tasks`, icon: <SolutionOutlined />, requiredPermission: ALL_PERMISSIONS.DEPARTMENT_OBJECTIVES.VIEW },
        { label: "Quy trình phòng ban", path: `/admin/departments/${departmentId}/procedures`, icon: <ApartmentOutlined />, requiredPermission: null },
        { label: "Phân quyền", path: `/admin/departments/${departmentId}/permissions`, icon: <UserAddOutlined />, requiredPermission: null },
        { label: "Lộ trình thăng tiến", path: `/admin/departments/${departmentId}/career-paths`, icon: <RightOutlined />, requiredPermission: ALL_PERMISSIONS.CAREER_PATHS.GET_BY_DEPARTMENT },
        { label: "Khung lương", path: `/admin/departments/${departmentId}/salary-range`, icon: <BankOutlined />, requiredPermission: null },
        { label: "Bản đồ chức danh", path: `/admin/departments/${departmentId}/org-chart?modal=position-chart`, icon: <IdcardOutlined />, requiredPermission: null },
    ] : [], [departmentId]);

    const DEPARTMENT_MODULES = React.useMemo(
        () => DEPARTMENT_MODULES_RAW.filter(m => hasPermission(m.requiredPermission)),
        [DEPARTMENT_MODULES_RAW, hasPermission]
    );
    const { items: notifications, unreadCount, markOneRead } = useNotifications();
    const { recentItems, favoriteItems, isFavorite, toggleFavorite } = useQuickAccess();
    const { startGuide } = useLotusGuide();

    const handleNavigate = (path: string) => {
        setOpen(false);
        navigate(path);
    };

    const quickShortcutItems = React.useMemo(() => {
        const seen = new Set<string>();
        const merged: QuickAccessItem[] = [];
        favoriteItems.slice(0, 3).forEach((item) => {
            seen.add(item.id);
            merged.push(item);
        });
        recentItems.slice(0, 5).forEach((item) => {
            if (!seen.has(item.id)) merged.push(item);
        });
        return merged.slice(0, 3);
    }, [favoriteItems, recentItems]);

    const currentGuides = React.useMemo(
        () => getFilteredGuidesForPath(location.pathname, canStartGuide).slice(0, 5),
        [location.pathname, canStartGuide]
    );

    const [isHovered, setIsHovered] = useState(false);
    const [searchValue, setSearchValue] = useState("");

    const ALL_MODULES_RAW = React.useMemo(() => [
        { label: "Nhân sự", path: "/admin/employees", icon: <UserAddOutlined />, keywords: ["nhan su", "nhan vien", "employee", "hr"], requiredPermission: ALL_PERMISSIONS.EMPLOYEES.GET_PAGINATE },
        { label: "Quy trình làm việc", path: "/admin/procedures", icon: <ApartmentOutlined />, keywords: ["quy trinh", "procedure", "workflow"], requiredPermission: ALL_PERMISSIONS.PROCEDURES.GET_PAGINATE },
        { label: "Chứng từ kế toán", path: "/admin/accounting-documents", icon: <FileAddOutlined />, keywords: ["chung tu", "ke toan", "accounting", "hoa don"], requiredPermission: ALL_PERMISSIONS.ACCOUNTING_DOCUMENTS.GET_PAGINATE },
        { label: "Đánh giá & KPI", path: "/admin/evaluation/process", icon: <SolutionOutlined />, keywords: ["danh gia", "kpi", "evaluation", "nang luc"], requiredPermission: null },
        { label: "Chức danh", path: "/admin/job-titles", icon: <IdcardOutlined />, keywords: ["chuc danh", "job title", "vi tri"], requiredPermission: ALL_PERMISSIONS.JOB_TITLES.GET_PAGINATE },
        { label: "Phòng ban", path: "/admin/departments", icon: <ClusterOutlined />, keywords: ["so do", "to chuc", "phong ban", "department"], requiredPermission: ALL_PERMISSIONS.DEPARTMENTS.GET_PAGINATE },
        { label: "Công ty", path: "/admin/company", icon: <BankOutlined />, keywords: ["cong ty", "doanh nghiep", "company"], requiredPermission: ALL_PERMISSIONS.COMPANIES.GET_PAGINATE },
        { label: "Ổ đĩa cá nhân", path: "/admin/personal-drive", icon: <FileDoneOutlined />, keywords: ["o dia", "ca nhan", "drive", "tai lieu"], requiredPermission: ALL_PERMISSIONS.DOCUMENT_FOLDERS.GET_TREE },
        { label: "Văn bản", path: "/admin/documents", icon: <FileTextOutlined />, keywords: ["van ban", "tai lieu", "document"], requiredPermission: ALL_PERMISSIONS.DOCUMENTS.GET_PAGINATE },
    ], []);

    const ALL_MODULES = React.useMemo(
        () => ALL_MODULES_RAW.filter(m => hasPermission(m.requiredPermission)),
        [ALL_MODULES_RAW, hasPermission]
    );

    const handleReadNotification = async (noti: any) => {
        if (!noti.isRead) {
            await markOneRead(noti);
        }
        if (noti.actionLink) {
            handleNavigate(noti.actionLink);
        }
    };

    const filteredModules = React.useMemo(() => {
        const normalizedQuery = searchValue.trim().toLowerCase();
        if (!normalizedQuery) return [];
        return ALL_MODULES.filter(m =>
            m.label.toLowerCase().includes(normalizedQuery) ||
            m.keywords.some(k => k.toLowerCase().includes(normalizedQuery))
        );
    }, [ALL_MODULES, searchValue]);

    if (isMinimized) {
        return (
            <button
                aria-label="Mở trợ lý Lotus-chan"
                onClick={() => {
                    setIsMinimized(false);
                    setOpen(true);
                }}
                style={{
                    position: "fixed",
                    right: 26,
                    bottom: 26,
                    width: 46,
                    height: 46,
                    borderRadius: "50%",
                    border: "1px solid rgba(255,255,255,0.72)",
                    background: "linear-gradient(135deg, #f25c88, #e63d72)",
                    color: "#fff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: "0 14px 28px rgba(232,99,122,0.24)",
                    cursor: "pointer",
                    zIndex: 9999,
                }}
            >
                <ArrowUpOutlined style={{ fontSize: 19 }} />
                {unreadCount > 0 && (
                    <span
                        style={{
                            position: "absolute",
                            top: -2,
                            right: -2,
                            minWidth: 17,
                            height: 17,
                            padding: "0 4px",
                            borderRadius: 99,
                            background: "#e8637a",
                            color: "#fff",
                            fontSize: 10,
                            fontWeight: 800,
                            lineHeight: "17px",
                            border: "2px solid #fff",
                        }}
                    >
                        {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                )}
            </button>
        );
    }

    return (
        <div
            style={{
                position: "fixed",
                bottom: -5,
                right: 15,
                zIndex: 9999,
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-end",
                transition: "transform 0.35s ease",
            }}
            onMouseEnter={(e) => {
                if (!open) {
                    (e.currentTarget as HTMLDivElement).style.transform = "translateY(-5px)";
                    setIsHovered(true);
                }
            }}
            onMouseLeave={(e) => {
                if (!open) {
                    (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)";
                    setIsHovered(false);
                }
            }}
        >
            {/* ── Dropdown menu ── */}
            {open && (
                <div
                    style={{
                        position: "absolute",
                        bottom: 132,
                        right: 22,
                        width: 318,
                        maxWidth: "calc(100vw - 28px)",
                        maxHeight: "min(560px, calc(100vh - 168px))",
                        background: "#fff",
                        border: "1px solid #e5e7eb",
                        borderRadius: 16,
                        boxShadow: "0 12px 34px rgba(15,23,42,0.14), 0 4px 14px rgba(232,99,122,0.10)",
                        transformOrigin: "bottom right",
                        animation: "scaleIn 0.18s ease-out forwards",
                        display: "flex",
                        flexDirection: "column",
                        overflow: "hidden"
                    }}
                >
                    <style>
                        {`
                        @keyframes scaleIn {
                            from { transform: scale(0.92) translateY(10px); opacity: 0; }
                            to { transform: scale(1) translateY(0); opacity: 1; }
                        }
                        .glass-input .ant-input {
                            background: transparent !important;
                            border: none !important;
                            box-shadow: none !important;
                            font-size: 14px;
                            color: #333;
                            font-weight: 500;
                        }
                        .glass-input .ant-input::placeholder {
                            color: #a0a0a0;
                            font-weight: 400;
                        }
                        .glass-input .ant-input-affix-wrapper {
                            background: transparent !important;
                            border: none !important;
                            box-shadow: none !important;
                            padding: 0;
                        }
                        `}
                    </style>

                    {/* Premium Header & Search Combined */}
                    <div style={{
                        padding: "14px 16px",
                        borderBottom: "1px solid #f3f4f6",
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        background: "#fff"
                    }}>
                        <SearchOutlined style={{ fontSize: 18, color: ACCENT }} />
                        <Input
                            className="glass-input"
                            placeholder="Bạn cần tìm gì hôm nay?"
                            value={searchValue}
                            onChange={(e) => setSearchValue(e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                            variant="borderless"
                            style={{ flex: 1, padding: 0 }}
                        />
                        <div
                            style={{
                                width: 28,
                                height: 28,
                                borderRadius: "50%",
                                background: "#f3f4f6",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                cursor: "pointer",
                                transition: "all 0.2s ease"
                            }}
                            onClick={(e) => {
                                e.stopPropagation();
                                setOpen(false);
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.background = "rgba(0,0,0,0.08)";
                                e.currentTarget.style.transform = "scale(1.05)";
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.background = "rgba(0,0,0,0.03)";
                                e.currentTarget.style.transform = "scale(1)";
                            }}
                        >
                            <CloseOutlined style={{ fontSize: 12, color: "#666" }} />
                        </div>
                    </div>

                    <div style={{ padding: "14px 8px 14px 14px", flex: 1, display: "flex", flexDirection: "column", overflowY: "auto" }}>
                        {/* Search Results */}
                        {searchValue.trim() !== "" && (
                            <div style={{ paddingRight: 8 }}>
                                <div style={{
                                    fontSize: 11,
                                    fontWeight: 700,
                                    color: "#a0a0a0",
                                    padding: "0 8px 12px",
                                    textTransform: "uppercase",
                                    letterSpacing: 1.2
                                }}>
                                    KẾT QUẢ TÌM KIẾM ({filteredModules.length})
                                </div>
                                <div style={{ maxHeight: 280, overflowY: "auto", paddingRight: 4 }}>
                                    {filteredModules.map((action, index) => (
                                        <div
                                            key={index}
                                            onClick={() => handleNavigate(action.path)}
                                            style={{
                                                display: "flex",
                                                alignItems: "center",
                                                gap: 14,
                                                padding: "12px 16px",
                                                fontSize: 14,
                                                cursor: "pointer",
                                                color: "#333",
                                                fontWeight: 500,
                                                borderRadius: 12,
                                                transition: "all 0.2s ease",
                                                marginBottom: 4
                                            }}
                                            onMouseEnter={(e) => {
                                                (e.currentTarget as HTMLDivElement).style.background = "rgba(0,0,0,0.04)";
                                            }}
                                            onMouseLeave={(e) => {
                                                (e.currentTarget as HTMLDivElement).style.background = "transparent";
                                            }}
                                        >
                                            <div style={{
                                                color: ACCENT,
                                                fontSize: 18,
                                                width: 36,
                                                height: 36,
                                                background: "rgba(232,99,122,0.1)",
                                                borderRadius: 10,
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center"
                                            }}>
                                                {action.icon}
                                            </div>
                                            {action.label}
                                        </div>
                                    ))}
                                    {filteredModules.length === 0 && (
                                        <div style={{ textAlign: "center", padding: "40px 0", color: "#a0a0a0", fontSize: 14 }}>
                                            Không tìm thấy kết quả phù hợp.
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Quick Access */}
                        {searchValue.trim() === "" && !departmentId && (
                            <div style={{ paddingRight: 8, marginBottom: 14 }}>
                                <div style={{
                                    fontSize: 11,
                                    fontWeight: 700,
                                    color: "#a0a0a0",
                                    padding: "0 8px 10px",
                                    textTransform: "uppercase",
                                    letterSpacing: 1.2,
                                    display: "flex",
                                    justifyContent: "space-between",
                                }}>
                                    <span>ĐIỀU HƯỚNG NHANH</span>
                                    <span style={{ color: "#cbd5e1", fontSize: 10 }}>Cmd/Ctrl K</span>
                                </div>
                                {quickShortcutItems.length > 0 ? (
                                    <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                                        {quickShortcutItems.map((item) => (
                                            <div
                                                key={item.id}
                                                onClick={() => handleNavigate(item.path)}
                                                style={{
                                                    display: "flex",
                                                    alignItems: "center",
                                                    gap: 10,
                                                    padding: "8px 10px",
                                                    borderRadius: 12,
                                                    cursor: "pointer",
                                                    transition: "all 0.2s ease",
                                                }}
                                                onMouseEnter={(e) => {
                                                    (e.currentTarget as HTMLDivElement).style.background = "rgba(232,99,122,0.06)";
                                                }}
                                                onMouseLeave={(e) => {
                                                    (e.currentTarget as HTMLDivElement).style.background = "transparent";
                                                }}
                                            >
                                                <div style={{
                                                    width: 30,
                                                    height: 30,
                                                    borderRadius: 10,
                                                    background: "rgba(232,99,122,0.09)",
                                                    color: ACCENT,
                                                    display: "flex",
                                                    alignItems: "center",
                                                    justifyContent: "center",
                                                    fontSize: 15,
                                                }}>
                                                    {item.icon}
                                                </div>
                                                <div style={{ flex: 1, minWidth: 0 }}>
                                                    <div style={{ fontSize: 13, fontWeight: 700, color: "#1f2937", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                                        {item.title}
                                                    </div>
                                                    <div style={{ fontSize: 11, color: "#94a3b8", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", marginTop: 1 }}>
                                                        {item.module}
                                                    </div>
                                                </div>
                                                <button
                                                    aria-label={isFavorite(item.id) ? "Bỏ ghim nhanh" : "Ghim nhanh"}
                                                    onClick={(event) => {
                                                        event.stopPropagation();
                                                        toggleFavorite(item);
                                                    }}
                                                    style={{
                                                        width: 28,
                                                        height: 28,
                                                        border: 0,
                                                        borderRadius: "50%",
                                                        background: isFavorite(item.id) ? "rgba(232,99,122,0.10)" : "transparent",
                                                        color: isFavorite(item.id) ? ACCENT : "#cbd5e1",
                                                        cursor: "pointer",
                                                    }}
                                                >
                                                    {isFavorite(item.id) ? <StarFilled /> : <StarOutlined />}
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div style={{
                                        padding: "12px",
                                        borderRadius: 14,
                                        background: "#f8fafc",
                                        border: "1px solid #edf2f7",
                                        color: "#64748b",
                                        fontSize: 12,
                                        lineHeight: 1.5,
                                    }}>
                                        Gõ để tìm nhanh hoặc dùng Cmd/Ctrl + K. Mục vừa mở sẽ tự hiện ở đây.
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Department Navigation (if in department) */}
                        {searchValue.trim() === "" && departmentId && (
                            <div style={{ paddingRight: 8, marginBottom: 24 }}>
                                <div style={{
                                    fontSize: 11,
                                    fontWeight: 700,
                                    color: "#a0a0a0",
                                    padding: "0 8px 12px",
                                    textTransform: "uppercase",
                                    letterSpacing: 1.2
                                }}>
                                    CHUYỂN TRANG PHÒNG BAN
                                </div>
                                <div style={{ paddingRight: 4 }}>
                                    {DEPARTMENT_MODULES.map((action, index) => {
                                        const basePath = action.path.split('?')[0];
                                        const query = action.path.split('?')[1] || '';
                                        const isActive = location.pathname === basePath && location.search.replace('?', '') === query;
                                        return (
                                            <div
                                                key={index}
                                                onClick={() => handleNavigate(action.path)}
                                                style={{
                                                    display: "flex",
                                                    alignItems: "center",
                                                    gap: 10,
                                                    padding: "8px 12px",
                                                    fontSize: 13,
                                                    cursor: isActive ? "default" : "pointer",
                                                    color: isActive ? ACCENT : "#333",
                                                    fontWeight: isActive ? 600 : 500,
                                                    borderRadius: 8,
                                                    background: isActive ? "rgba(232,99,122,0.08)" : "transparent",
                                                    transition: "all 0.2s ease",
                                                    marginBottom: 2
                                                }}
                                                onMouseEnter={(e) => {
                                                    if (!isActive) (e.currentTarget as HTMLDivElement).style.background = "rgba(0,0,0,0.03)";
                                                }}
                                                onMouseLeave={(e) => {
                                                    if (!isActive) (e.currentTarget as HTMLDivElement).style.background = "transparent";
                                                }}
                                            >
                                                <div style={{
                                                    color: isActive ? ACCENT : "#666",
                                                    fontSize: 14,
                                                    width: 26,
                                                    height: 26,
                                                    background: isActive ? "transparent" : "rgba(0,0,0,0.03)",
                                                    borderRadius: 6,
                                                    display: "flex",
                                                    alignItems: "center",
                                                    justifyContent: "center"
                                                }}>
                                                    {action.icon}
                                                </div>
                                                {action.label}
                                                {isActive && <div style={{ marginLeft: "auto", fontSize: 10 }}>◀</div>}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Notifications */}
                        {searchValue.trim() === "" && notifications.length > 0 && (
                            <div style={{ paddingRight: 8 }}>
                                <div style={{
                                    fontSize: 11,
                                    fontWeight: 700,
                                    color: "#a0a0a0",
                                    padding: "0 8px 12px",
                                    textTransform: "uppercase",
                                    letterSpacing: 1.2,
                                    display: "flex",
                                    justifyContent: "space-between"
                                }}>
                                    <span>THÔNG BÁO GẦN ĐÂY</span>
                                    {unreadCount > 0 && (
                                        <span style={{ color: ACCENT }}>{unreadCount} MỚI</span>
                                    )}
                                </div>
                                <div style={{ maxHeight: 180, overflowY: "auto", paddingRight: 4 }}>
                                    {notifications.slice(0, 8).map((noti: any) => (
                                        <div
                                            key={noti.id}
                                            onClick={() => handleReadNotification(noti)}
                                            style={{
                                                padding: "12px 16px",
                                                borderRadius: 16,
                                                display: "flex",
                                                gap: 14,
                                                cursor: "pointer",
                                                transition: "all 0.2s ease",
                                                background: noti.isRead ? "transparent" : "rgba(232,99,122,0.05)",
                                                marginBottom: 4,
                                            }}
                                            onMouseEnter={(e) => {
                                                (e.currentTarget as HTMLDivElement).style.background = noti.isRead ? "rgba(0,0,0,0.03)" : "rgba(232,99,122,0.08)";
                                            }}
                                            onMouseLeave={(e) => {
                                                (e.currentTarget as HTMLDivElement).style.background = noti.isRead ? "transparent" : "rgba(232,99,122,0.05)";
                                            }}
                                        >
                                            <div style={{ marginTop: 2 }}>
                                                <Badge dot={!noti.isRead} color={ACCENT} offset={[-4, 4]}>
                                                    <div style={{
                                                        width: 40,
                                                        height: 40,
                                                        borderRadius: "50%",
                                                        background: noti.isRead ? "rgba(0,0,0,0.04)" : "rgba(232,99,122,0.1)",
                                                        display: "flex",
                                                        alignItems: "center",
                                                        justifyContent: "center",
                                                        color: noti.isRead ? "#888" : ACCENT,
                                                        fontSize: 16
                                                    }}>
                                                        <BellOutlined />
                                                    </div>
                                                </Badge>
                                            </div>
                                            <div style={{ flex: 1 }}>
                                                <div style={{
                                                    fontSize: 14,
                                                    color: noti.isRead ? "#555" : "#222",
                                                    fontWeight: noti.isRead ? 400 : 600,
                                                    lineHeight: 1.4,
                                                    letterSpacing: 0.2
                                                }}>
                                                    {noti.subtitle || noti.title || "Thông báo hệ thống"}
                                                </div>
                                                <div style={{ fontSize: 12, color: "#a0a0a0", marginTop: 4, fontWeight: 500 }}>
                                                    {dayjs(noti.createdAt || new Date()).fromNow()}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Hỗ trợ & Feedback */}
                        {searchValue.trim() === "" && (
                            <div style={{ marginTop: 16, paddingTop: 16, borderTop: "1px solid rgba(0,0,0,0.06)", display: "flex", gap: 10 }}>
                                <div
                                    onClick={() => { setIsGuideOpen(true); setOpen(false); }}
                                    style={{ flex: 1, padding: "10px", textAlign: "center", background: "rgba(232,99,122,0.05)", borderRadius: 12, cursor: "pointer", color: ACCENT, fontWeight: 600, fontSize: 13, transition: "all 0.2s" }}
                                    onMouseEnter={(e) => e.currentTarget.style.background = "rgba(232,99,122,0.1)"}
                                    onMouseLeave={(e) => e.currentTarget.style.background = "rgba(232,99,122,0.05)"}
                                >
                                    Hướng dẫn
                                </div>
                                <div
                                    onClick={() => { setIsFeedbackOpen(true); setOpen(false); }}
                                    style={{ flex: 1, padding: "10px", textAlign: "center", background: "rgba(232,99,122,0.05)", borderRadius: 12, cursor: "pointer", color: ACCENT, fontWeight: 600, fontSize: 13, transition: "all 0.2s" }}
                                    onMouseEnter={(e) => e.currentTarget.style.background = "rgba(232,99,122,0.1)"}
                                    onMouseLeave={(e) => e.currentTarget.style.background = "rgba(232,99,122,0.05)"}
                                >
                                    Góp ý
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ── Linh vật ── */}
            <div
                data-guide-id="lotus-assistant-entry"
                style={{
                    position: "relative",
                    width: 138,
                    height: "auto",
                    borderRadius: 0,
                    background: "transparent",
                    color: "#fff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    userSelect: "none",
                    filter: open
                        ? "brightness(1.06) drop-shadow(0 0 10px rgba(232,99,122,0.35))"
                        : "drop-shadow(0 6px 14px rgba(192,57,43,0.18))",
                    transition: "all 0.28s ease",
                    transform: open ? "scale(1.04)" : "scale(1)",
                }}
                onClick={() => setOpen((v) => !v)}
            >
                {!open && isHovered && (
                    <div
                        style={{
                            position: "absolute",
                            top: -24,
                            right: 22,
                            display: "flex",
                            alignItems: "center",
                            padding: 4,
                            borderRadius: 999,
                            background: "rgba(255,255,255,0.94)",
                            border: "1px solid rgba(255,228,236,0.95)",
                            boxShadow: "0 10px 22px rgba(232,99,122,0.14)",
                            backdropFilter: "blur(10px)",
                            WebkitBackdropFilter: "blur(10px)",
                            zIndex: 4,
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            aria-label="Thu gọn trợ lý"
                            onClick={() => {
                                setOpen(false);
                                setIsHovered(false);
                                setIsMinimized(true);
                            }}
                            style={{
                                width: 24,
                                height: 24,
                                borderRadius: "50%",
                                border: "none",
                                background: "#fff7fa",
                                color: "#d94c67",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                cursor: "pointer",
                            }}
                        >
                            <CloseOutlined style={{ fontSize: 11 }} />
                        </button>
                    </div>
                )}

                {/* Lời thoại kêu gọi (Speech Bubble) hiển thị khi menu đang đóng VÀ có hover */}
                {(!open && isHovered) && (
                    <div
                        style={{
                            position: "absolute",
                            right: 130, // Đặt bên trái linh vật
                            bottom: 60, // Căn ngang mặt linh vật
                            padding: "8px 16px",
                            background: unreadCount > 0 ? "#ff4d4f" : "#fff",
                            color: unreadCount > 0 ? "#fff" : "#333",
                            borderRadius: "16px 16px 0 16px",
                            boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                            fontSize: 13,
                            fontWeight: 500,
                            whiteSpace: "nowrap",
                            pointerEvents: "none", // Để không chặn click
                            animation: "bounce 2s infinite ease-in-out",
                            zIndex: 2,
                        }}
                    >
                        {unreadCount > 0
                            ? `Bạn có ${unreadCount} thông báo mới!`
                            : `Xin chào ${firstName}!`}

                        {/* Mũi nhọn của bong bóng thoại */}
                        <div
                            style={{
                                position: "absolute",
                                bottom: 0,
                                right: -8,
                                width: 0,
                                height: 0,
                                borderTop: "10px solid transparent",
                                borderLeft: `10px solid ${unreadCount > 0 ? "#ff4d4f" : "#fff"}`,
                                borderBottom: "10px solid transparent",
                            }}
                        />
                    </div>
                )}

                <Badge count={unreadCount} offset={[-24, 18]} size="small" color={ACCENT}>
                    <img
                        src="/logo/logolinhvat.png"
                        alt="Trợ lý Lotus-chan"
                        draggable={false}
                        style={{
                            width: 138,
                            height: "auto",
                            display: "block",
                            position: "relative",
                            zIndex: 1,
                        }}
                    />
                </Badge>
            </div>
            <style>{`
                @keyframes bounce {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-5px); }
                }
            `}</style>

            {/* Modals for Feedback and Guide */}
            <Modal
                title={null}
                open={isFeedbackOpen}
                onCancel={() => setIsFeedbackOpen(false)}
                footer={null}
                width={700}
                style={{ top: 20 }}
                styles={{
                    content: { padding: 0, borderRadius: 12, overflow: "hidden" },
                    body: { padding: 0, height: "90vh" }
                }}
                closeIcon={<CloseOutlined style={{ color: '#fff', background: 'rgba(0,0,0,0.3)', padding: '6px', borderRadius: '50%', fontSize: '14px' }} />}
                destroyOnHidden
            >
                <iframe
                    src="https://docs.google.com/forms/d/e/1FAIpQLSd0FxYa-whqyDLkUy12Yz56SmlSJS3EIpYptaCz5owHSxsDzA/viewform?embedded=true"
                    width="100%"
                    height="100%"
                    frameBorder="0"
                    marginHeight={0}
                    marginWidth={0}
                    title="Feedback Form"
                    style={{ background: "#f0ebf8", display: "block" }}
                >
                    Đang tải form...
                </iframe>
            </Modal>

            <Modal
                title={<div style={{ display: "none" }}></div>}
                open={isGuideOpen}
                onCancel={() => {
                    setIsGuideOpen(false);
                    setGuideSearchQuery("");
                }}
                footer={null}
                width={900}
                style={{ top: 40 }}
                styles={{
                    content: { padding: 0, borderRadius: 20, overflow: "hidden", display: "flex", flexDirection: "column", boxShadow: "0 24px 48px rgba(0,0,0,0.12), 0 0 0 1px rgba(255,255,255,0.5) inset" },
                    body: { padding: 0, height: "min(70vh, 600px)" },
                    mask: { backdropFilter: "blur(8px)", backgroundColor: "rgba(15, 23, 42, 0.4)" }
                }}
                closeIcon={
                    <div style={{ width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", background: "#f1f5f9", borderRadius: "50%" }}>
                        <CloseOutlined style={{ color: '#64748b', fontSize: '14px' }} />
                    </div>
                }
                destroyOnHidden
            >
                <div style={{ display: "flex", height: "min(70vh, 600px)" }}>
                    {/* SIDEBAR TRÁI */}
                    <div style={{ width: 260, background: "linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)", borderRight: "1px solid #f1f5f9", display: "flex", flexDirection: "column", zIndex: 2 }}>
                        <div style={{ padding: "32px 24px 24px" }}>
                            <div style={{ color: ACCENT, fontSize: 11, fontWeight: 900, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
                                <span style={{ width: 6, height: 6, borderRadius: "50%", background: ACCENT, boxShadow: `0 0 8px ${ACCENT}` }} />
                                Lotus Hướng Dẫn
                            </div>
                            <div style={{ color: "#0f172a", fontSize: 22, fontWeight: 900, letterSpacing: "-0.5px" }}>
                                Trung tâm hỗ trợ
                            </div>
                        </div>
                        <div style={{ flex: 1, overflowY: "auto", padding: "0 16px 20px" }}>
                            <div style={{ color: "#94a3b8", fontSize: 11, fontWeight: 800, letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 12, paddingLeft: 12 }}>
                                Danh mục
                            </div>

                            {/* TAB VIDEO LIBRARY */}
                            <div
                                onClick={() => {
                                    setActiveGuideModule("VIDEO_LIBRARY");
                                    setGuideSearchQuery("");
                                }}
                                style={{
                                    padding: "12px 16px",
                                    borderRadius: 12,
                                    background: activeGuideModule === "VIDEO_LIBRARY" && !guideSearchQuery ? "linear-gradient(90deg, rgba(232,99,122,0.08) 0%, rgba(232,99,122,0.01) 100%)" : "transparent",
                                    color: activeGuideModule === "VIDEO_LIBRARY" && !guideSearchQuery ? ACCENT : "#64748b",
                                    fontWeight: activeGuideModule === "VIDEO_LIBRARY" && !guideSearchQuery ? 800 : 600,
                                    fontSize: 14,
                                    cursor: "pointer",
                                    transition: "all 0.2s ease",
                                    borderLeft: activeGuideModule === "VIDEO_LIBRARY" && !guideSearchQuery ? `3px solid ${ACCENT}` : "3px solid transparent",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                    marginBottom: 16
                                }}
                                onMouseEnter={(e) => {
                                    if (!(activeGuideModule === "VIDEO_LIBRARY" && !guideSearchQuery)) {
                                        e.currentTarget.style.background = "#f1f5f9";
                                        e.currentTarget.style.color = "#334155";
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    if (!(activeGuideModule === "VIDEO_LIBRARY" && !guideSearchQuery)) {
                                        e.currentTarget.style.background = "transparent";
                                        e.currentTarget.style.color = "#64748b";
                                    }
                                }}
                            >
                                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                    <PlayCircleOutlined style={{ fontSize: 18 }} />
                                    <span>Thư viện Video</span>
                                </div>
                                {activeGuideModule === "VIDEO_LIBRARY" && !guideSearchQuery ?
                                    <div style={{ width: 4, height: 4, borderRadius: "50%", background: ACCENT }} />
                                    : <div style={{ fontSize: 10, background: "linear-gradient(135deg, #e8637a 0%, #f43f5e 100%)", color: "#fff", padding: "2px 6px", borderRadius: 4, fontWeight: 800, boxShadow: "0 2px 4px rgba(232,99,122,0.2)" }}>NEW</div>
                                }
                            </div>

                            <div style={{ height: 1, background: "linear-gradient(90deg, #f1f5f9 0%, transparent 100%)", margin: "0 12px 16px" }} />
                            {Object.entries(
                                LOTUS_GUIDES
                                    .filter(canStartGuide)
                                    .reduce((acc, guide) => {
                                        if (!acc[guide.module]) acc[guide.module] = [];
                                        acc[guide.module].push(guide);
                                        return acc;
                                    }, {} as Record<string, typeof LOTUS_GUIDES>)
                            ).map(([moduleName]) => {
                                const isActive = activeGuideModule === moduleName && !guideSearchQuery;
                                return (
                                    <div
                                        key={moduleName}
                                        onClick={() => {
                                            setActiveGuideModule(moduleName);
                                            setGuideSearchQuery("");
                                        }}
                                        style={{
                                            padding: "12px 16px",
                                            borderRadius: 12,
                                            background: isActive ? "linear-gradient(90deg, rgba(232,99,122,0.08) 0%, rgba(232,99,122,0.01) 100%)" : "transparent",
                                            color: isActive ? ACCENT : "#64748b",
                                            fontWeight: isActive ? 800 : 600,
                                            fontSize: 14,
                                            cursor: "pointer",
                                            transition: "all 0.2s ease",
                                            borderLeft: isActive ? `3px solid ${ACCENT}` : "3px solid transparent",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "space-between",
                                            marginBottom: 6
                                        }}
                                        onMouseEnter={(e) => {
                                            if (!isActive) {
                                                e.currentTarget.style.background = "#f1f5f9";
                                                e.currentTarget.style.color = "#334155";
                                            }
                                        }}
                                        onMouseLeave={(e) => {
                                            if (!isActive) {
                                                e.currentTarget.style.background = "transparent";
                                                e.currentTarget.style.color = "#64748b";
                                            }
                                        }}
                                    >
                                        <span>{moduleName}</span>
                                        {isActive && <div style={{ width: 4, height: 4, borderRadius: "50%", background: ACCENT }} />}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* NỘI DUNG PHẢI */}
                    <div style={{ flex: 1, display: "flex", flexDirection: "column", background: "#fcfcfd", minWidth: 0, position: "relative" }}>
                        <div style={{ padding: "32px 32px 16px", zIndex: 10, background: "#fcfcfd" }}>
                            <Input
                                prefix={<SearchOutlined style={{ color: "#94a3b8", fontSize: 18, marginRight: 6 }} />}
                                placeholder="Tìm kiếm tính năng, phòng ban, công ty..."
                                size="large"
                                variant="filled"
                                value={guideSearchQuery}
                                onChange={(e) => setGuideSearchQuery(e.target.value)}
                                style={{
                                    borderRadius: 16,
                                    background: "#ffffff",
                                    border: "1px solid #e2e8f0",
                                    padding: "12px 20px",
                                    fontSize: 15,
                                    boxShadow: "0 2px 6px rgba(0,0,0,0.02), inset 0 2px 4px rgba(0,0,0,0.01)",
                                    transition: "all 0.3s ease"
                                }}
                                onFocus={(e) => {
                                    e.target.style.borderColor = ACCENT;
                                    e.target.style.boxShadow = `0 0 0 3px rgba(232,99,122,0.1)`;
                                }}
                                onBlur={(e) => {
                                    e.target.style.borderColor = "#e2e8f0";
                                    e.target.style.boxShadow = "0 2px 6px rgba(0,0,0,0.02), inset 0 2px 4px rgba(0,0,0,0.01)";
                                }}
                            />
                        </div>

                        <div style={{ flex: 1, overflowY: "auto", padding: "8px 32px 32px" }}>
                            {activeGuideModule === "VIDEO_LIBRARY" && guideSearchQuery.trim() === "" ? (
                                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", padding: "40px 20px", textAlign: "center" }}>
                                    <div style={{ position: "relative", marginBottom: 32, marginTop: 40 }}>
                                        <div style={{ width: 320, height: 180, borderRadius: 20, background: "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)", border: "1px solid #e2e8f0", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 20px 40px rgba(0,0,0,0.05)", overflow: "hidden" }}>
                                            <div style={{ width: "100%", height: "100%", background: "url('https://www.transparenttextures.com/patterns/cubes.png')", opacity: 0.3, position: "absolute", top: 0, left: 0 }} />
                                            <div style={{ width: 72, height: 72, borderRadius: "50%", background: "#ffffff", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 12px 24px rgba(232,99,122,0.2)", color: ACCENT, fontSize: 36, zIndex: 1, transition: "all 0.3s ease", cursor: "pointer" }}
                                                onMouseEnter={(e) => { e.currentTarget.style.transform = "scale(1.1)"; }}
                                                onMouseLeave={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
                                            >
                                                <PlayCircleOutlined />
                                            </div>
                                        </div>
                                        <div style={{ position: "absolute", top: -16, right: -16, background: "linear-gradient(135deg, #e8637a 0%, #f43f5e 100%)", color: "#fff", padding: "6px 16px", borderRadius: 8, fontSize: 13, fontWeight: 900, letterSpacing: 0.5, boxShadow: "0 6px 16px rgba(232,99,122,0.3)", transform: "rotate(6deg)" }}>
                                            SẮP RA MẮT
                                        </div>
                                    </div>
                                    <h3 style={{ color: "#0f172a", fontSize: 24, fontWeight: 900, marginBottom: 16 }}>Thư viện Video hướng dẫn</h3>
                                    <p style={{ color: "#64748b", fontSize: 15, lineHeight: 1.6, maxWidth: 500 }}>
                                        Video hướng dẫn sẽ được cập nhật trong thời gian sắp tới. Bạn có thể quay lại mục này để xem các nội dung mới khi Lotus hoàn thiện.
                                    </p>
                                </div>
                            ) : guideSearchQuery.trim() !== "" ? (
                                <div>
                                    <div style={{ color: "#64748b", fontSize: 12, fontWeight: 800, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 16 }}>
                                        Kết quả tìm kiếm
                                    </div>
                                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 16 }}>
                                        {LOTUS_GUIDES.filter(canStartGuide)
                                            .filter(guide => guide.title.toLowerCase().includes(guideSearchQuery.toLowerCase()) || guide.module.toLowerCase().includes(guideSearchQuery.toLowerCase()))
                                            .map((guide) => (
                                                <div
                                                    key={guide.id}
                                                    onClick={() => {
                                                        setIsGuideOpen(false);
                                                        setGuideSearchQuery("");
                                                        startGuide(guide.id);
                                                    }}
                                                    style={{
                                                        display: "flex",
                                                        alignItems: "center",
                                                        gap: 16,
                                                        padding: 20,
                                                        borderRadius: 16,
                                                        background: "#ffffff",
                                                        border: "1px solid #f1f5f9",
                                                        cursor: "pointer",
                                                        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                                                        boxShadow: "0 4px 12px rgba(0,0,0,0.03)"
                                                    }}
                                                    onMouseEnter={(e) => {
                                                        e.currentTarget.style.borderColor = "rgba(232,99,122,0.3)";
                                                        e.currentTarget.style.boxShadow = "0 12px 24px rgba(232,99,122,0.12)";
                                                        e.currentTarget.style.transform = "translateY(-3px)";
                                                    }}
                                                    onMouseLeave={(e) => {
                                                        e.currentTarget.style.borderColor = "#f1f5f9";
                                                        e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.03)";
                                                        e.currentTarget.style.transform = "none";
                                                    }}
                                                >
                                                    <div style={{ width: 48, height: 48, borderRadius: 14, background: "linear-gradient(135deg, rgba(232,99,122,0.12) 0%, rgba(232,99,122,0.04) 100%)", color: ACCENT, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>
                                                        {guide.icon}
                                                    </div>
                                                    <div style={{ flex: 1, minWidth: 0 }}>
                                                        <div style={{ color: "#0f172a", fontSize: 15, fontWeight: 800, lineHeight: 1.4, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{guide.title}</div>
                                                        <div style={{ color: "#64748b", fontSize: 13, fontWeight: 600, marginTop: 6, display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                                                            <span>{guide.steps.length} bước</span>
                                                            <span style={{ color: "#e2e8f0" }}>•</span>
                                                            <span>{guide.module}</span>
                                                        </div>
                                                    </div>

                                                </div>
                                            ))}
                                    </div>
                                </div>
                            ) : (
                                <>
                                    {currentGuides.length > 0 && activeGuideModule === (LOTUS_GUIDES.find(g => g.routePattern ? g.routePattern.test(location.pathname) : location.pathname.startsWith(g.routePrefix))?.module || LOTUS_GUIDES[0]?.module) && (
                                        <div style={{ marginBottom: 24 }}>
                                            <div style={{ color: "#64748b", fontSize: 12, fontWeight: 800, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 12 }}>
                                                Gợi ý cho bạn
                                            </div>
                                            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                                                {currentGuides.map((guide) => (
                                                    <div
                                                        key={guide.id}
                                                        onClick={() => {
                                                            setIsGuideOpen(false);
                                                            startGuide(guide.id);
                                                        }}
                                                        style={{
                                                            display: "flex",
                                                            alignItems: "center",
                                                            gap: 10,
                                                            padding: "10px 20px",
                                                            borderRadius: 99,
                                                            background: "#ffffff",
                                                            border: "1px solid #e2e8f0",
                                                            cursor: "pointer",
                                                            transition: "all 0.3s ease",
                                                            boxShadow: "0 2px 4px rgba(0,0,0,0.02)"
                                                        }}
                                                        onMouseEnter={(e) => {
                                                            e.currentTarget.style.borderColor = ACCENT;
                                                            e.currentTarget.style.boxShadow = "0 8px 16px rgba(232,99,122,0.12)";
                                                            e.currentTarget.style.transform = "translateY(-2px)";
                                                        }}
                                                        onMouseLeave={(e) => {
                                                            e.currentTarget.style.borderColor = "#e2e8f0";
                                                            e.currentTarget.style.boxShadow = "0 2px 4px rgba(0,0,0,0.02)";
                                                            e.currentTarget.style.transform = "none";
                                                        }}
                                                    >
                                                        <div style={{ color: ACCENT, display: "flex", alignItems: "center", fontSize: 16 }}>
                                                            {guide.icon}
                                                        </div>
                                                        <div style={{ color: "#334155", fontSize: 14, fontWeight: 800 }}>
                                                            {guide.title}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {activeGuideModule && (() => {
                                        const guidesInModule = LOTUS_GUIDES.filter(g => g.module === activeGuideModule && canStartGuide(g));

                                        const subGroups = guidesInModule.reduce((subAcc, g) => {
                                            const sub = g.subModule || 'Chức năng chung';
                                            if (!subAcc[sub]) subAcc[sub] = [];
                                            subAcc[sub].push(g);
                                            return subAcc;
                                        }, {} as Record<string, typeof LOTUS_GUIDES>);

                                        const subGroupEntries = Object.entries(subGroups);
                                        const hideSubHeader = subGroupEntries.length === 1;

                                        return (
                                            <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                                                {subGroupEntries.map(([subModuleName, subGuides]) => (
                                                    <div key={subModuleName}>
                                                        {!hideSubHeader && (
                                                            <div style={{
                                                                color: "#64748b",
                                                                fontSize: 12,
                                                                fontWeight: 800,
                                                                letterSpacing: 0.5,
                                                                marginBottom: 16,
                                                                display: "flex",
                                                                alignItems: "center",
                                                                gap: 10,
                                                                textTransform: "uppercase"
                                                            }}>
                                                                {subModuleName}
                                                                <div style={{ flex: 1, height: 1, background: "#e2e8f0" }} />
                                                            </div>
                                                        )}
                                                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 16 }}>
                                                            {subGuides.map((guide) => (
                                                                <div
                                                                    key={guide.id}
                                                                    onClick={() => {
                                                                        setIsGuideOpen(false);
                                                                        startGuide(guide.id);
                                                                    }}
                                                                    style={{
                                                                        display: "flex",
                                                                        alignItems: "center",
                                                                        gap: 16,
                                                                        padding: 20,
                                                                        borderRadius: 16,
                                                                        background: "#ffffff",
                                                                        border: "1px solid #f1f5f9",
                                                                        cursor: "pointer",
                                                                        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                                                                        boxShadow: "0 4px 12px rgba(0,0,0,0.03)"
                                                                    }}
                                                                    onMouseEnter={(e) => {
                                                                        e.currentTarget.style.borderColor = "rgba(232,99,122,0.3)";
                                                                        e.currentTarget.style.boxShadow = "0 12px 24px rgba(232,99,122,0.12)";
                                                                        e.currentTarget.style.transform = "translateY(-3px)";
                                                                    }}
                                                                    onMouseLeave={(e) => {
                                                                        e.currentTarget.style.borderColor = "#f1f5f9";
                                                                        e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.03)";
                                                                        e.currentTarget.style.transform = "none";
                                                                    }}
                                                                >
                                                                    <div style={{ width: 48, height: 48, borderRadius: 14, background: "linear-gradient(135deg, rgba(232,99,122,0.12) 0%, rgba(232,99,122,0.04) 100%)", color: ACCENT, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>
                                                                        {guide.icon}
                                                                    </div>
                                                                    <div style={{ flex: 1, minWidth: 0 }}>
                                                                        <div style={{ color: "#0f172a", fontSize: 15, fontWeight: 800, lineHeight: 1.4, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{guide.title}</div>
                                                                        <div style={{ color: "#64748b", fontSize: 13, fontWeight: 600, marginTop: 6, display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                                                                            <span>{guide.steps.length} bước</span>
                                                                        </div>
                                                                    </div>

                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        );
                                    })()}
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default LotusCharmAssistant;
