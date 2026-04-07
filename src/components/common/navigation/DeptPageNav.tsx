import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { CloseOutlined } from "@ant-design/icons";

interface DeptPage {
    label: string;
    pathTemplate: string;
    visible?: boolean;
}

const DEFAULT_PAGES: DeptPage[] = [
    {
        label: "Sơ đồ tổ chức",
        pathTemplate: "/admin/departments/:departmentId/org-chart",
    },
    {
        label: "Mục tiêu - Nhiệm vụ",
        pathTemplate: "/admin/departments/:departmentId/objectives-tasks",
    },
    {
        label: "Quy trình phòng ban",
        pathTemplate: "/admin/departments/:departmentId/procedures",
    },
    {
        label: "Phân quyền",
        pathTemplate: "/admin/departments/:departmentId/permissions",
    },
    {
        label: "Lộ trình thăng tiến",
        pathTemplate: "/admin/departments/:departmentId/career-paths",
    },
    {
        label: "Khung lương",
        pathTemplate: "/admin/departments/:departmentId/salary-range",
    },
    {
        label: "Bản đồ chức danh",
        pathTemplate: "/admin/departments/:departmentId/org-chart?modal=position-chart",
    },
];

function toRegex(template: string) {
    const escaped = template.replace(/:[^/]+/g, "([^/]+)");
    return new RegExp(`^${escaped}(/.*)?$`);
}

function extractDepartmentId(pathname: string): string | null {
    const match = pathname.match(/\/departments\/([^/]+)/);
    return match ? match[1] : null;
}

function resolvePath(template: string, departmentId: string): string {
    return template.replace(":departmentId", departmentId);
}

interface DeptPageNavProps {
    pages?: DeptPage[];
}

const ACCENT = "#e8637a";

const DeptPageNav = ({ pages = DEFAULT_PAGES }: DeptPageNavProps) => {
    const location = useLocation();
    const navigate = useNavigate();
    const [open, setOpen] = useState(false);

    const departmentId = extractDepartmentId(location.pathname);
    if (!departmentId) return null;

    const visiblePages = pages.filter((p) => p.visible !== false);
    if (visiblePages.length === 0) return null;

    const currentIndex = visiblePages.findIndex(({ pathTemplate }) =>
        toRegex(pathTemplate).test(location.pathname)
    );
    if (currentIndex === -1) return null;

    const handleNavigate = (page: DeptPage) => {
        setOpen(false);
        navigate({
            pathname: resolvePath(page.pathTemplate, departmentId),
            search: location.search,
        });
    };

    // Tên trang hiện tại để hiện trên badge linh vật
    const currentLabel = visiblePages[currentIndex]?.label ?? "";

    return (
        <div
            style={{
                position: "fixed",
                bottom: 0,
                right: -30,
                zIndex: 1000,
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-end",
                transition: "right 0.35s ease",
            }}
            onMouseEnter={(e) => {
                if (!open) (e.currentTarget as HTMLDivElement).style.right = "-10px";
            }}
            onMouseLeave={(e) => {
                if (!open) (e.currentTarget as HTMLDivElement).style.right = "-30px";
            }}
        >
            {/* ── Dropdown menu ── */}
            {open && (
                <div
                    style={{
                        position: "absolute",
                        bottom: 145,
                        right: 20,
                        background: "#fff",
                        border: "0.5px solid #e8e8e8",
                        borderRadius: 12,
                        overflow: "hidden",
                        boxShadow: "0 8px 24px rgba(0,0,0,0.10)",
                        minWidth: 210,
                    }}
                >
                    {/* Header */}
                    <div
                        style={{
                            padding: "8px 14px",
                            fontSize: 10,
                            fontWeight: 700,
                            letterSpacing: ".08em",
                            textTransform: "uppercase",
                            color: ACCENT,
                            background: "#fdf0f2",
                            borderBottom: `1px solid rgba(232,99,122,0.15)`,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                        }}
                    >
                        <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            {/* mini grid icon */}
                            <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                                <rect x="0" y="0" width="5" height="5" rx="1.2" fill={ACCENT} />
                                <rect x="7" y="0" width="5" height="5" rx="1.2" fill={ACCENT} opacity=".5" />
                                <rect x="0" y="7" width="5" height="5" rx="1.2" fill={ACCENT} opacity=".5" />
                                <rect x="7" y="7" width="5" height="5" rx="1.2" fill={ACCENT} opacity=".3" />
                            </svg>
                            Chuyển trang
                        </span>
                        <CloseOutlined
                            style={{ fontSize: 10, cursor: "pointer", color: "#bbb" }}
                            onClick={(e) => {
                                e.stopPropagation();
                                setOpen(false);
                            }}
                        />
                    </div>

                    {/* Nav items */}
                    {visiblePages.map((page, index) => {
                        const isActive = index === currentIndex;
                        return (
                            <div
                                key={page.pathTemplate}
                                onClick={() => !isActive && handleNavigate(page)}
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 10,
                                    padding: "9px 14px",
                                    fontSize: 13,
                                    cursor: isActive ? "default" : "pointer",
                                    color: isActive ? ACCENT : "#555",
                                    fontWeight: isActive ? 600 : 400,
                                    background: isActive ? "#fdf0f2" : "#fff",
                                    borderBottom: "0.5px solid #f5f5f5",
                                    transition: "background .12s",
                                }}
                                onMouseEnter={(e) => {
                                    if (!isActive)
                                        (e.currentTarget as HTMLDivElement).style.background = "#fafafa";
                                }}
                                onMouseLeave={(e) => {
                                    if (!isActive)
                                        (e.currentTarget as HTMLDivElement).style.background = "#fff";
                                }}
                            >
                                {/* Step number */}
                                <span
                                    style={{
                                        width: 20,
                                        height: 20,
                                        borderRadius: 6,
                                        flexShrink: 0,
                                        background: isActive ? ACCENT : "#f0f0f0",
                                        color: isActive ? "#fff" : "#aaa",
                                        fontSize: 10,
                                        fontWeight: 700,
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                    }}
                                >
                                    {index + 1}
                                </span>
                                {page.label}

                                {/* Active arrow */}
                                {isActive && (
                                    <span style={{ marginLeft: "auto", color: ACCENT, fontSize: 10 }}>◀</span>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* ── Linh vật ── */}
            <div
                style={{
                    position: "relative",
                    width: 140,
                    cursor: "pointer",
                    userSelect: "none",
                    filter: open
                        ? "brightness(1.06) drop-shadow(0 0 10px rgba(232,99,122,0.35))"
                        : "drop-shadow(0 6px 14px rgba(192,57,43,0.18))",
                    transition: "filter 0.28s ease, transform 0.28s ease",
                    transform: open ? "scale(1.04)" : "scale(1)",
                }}
                onClick={() => setOpen((v) => !v)}
            >
                {/* Badge: tên trang hiện tại */}
                <div
                    style={{
                        position: "absolute",
                        top: 18,
                        left: -12,
                        background: "#fff",
                        color: ACCENT,
                        fontSize: 10,
                        fontWeight: 700,
                        fontFamily: "'Segoe UI', Arial, sans-serif",
                        padding: "3px 8px",
                        borderRadius: 20,
                        border: `1.5px solid ${ACCENT}`,
                        boxShadow: "0 2px 8px rgba(232,99,122,0.18)",
                        display: "flex",
                        alignItems: "center",
                        gap: 5,
                        whiteSpace: "nowrap",
                        zIndex: 2,
                        pointerEvents: "none",
                        maxWidth: 130,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                    }}
                >
                    {/* Dot */}
                    <span
                        style={{
                            width: 6,
                            height: 6,
                            borderRadius: "50%",
                            background: ACCENT,
                            flexShrink: 0,
                        }}
                    />
                    {currentLabel}
                </div>

                {/* Close indicator khi menu đang mở */}
                {open && (
                    <div
                        style={{
                            position: "absolute",
                            top: 8,
                            right: 8,
                            width: 20,
                            height: 20,
                            borderRadius: "50%",
                            background: "rgba(0,0,0,0.35)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            zIndex: 3,
                            pointerEvents: "none",
                        }}
                    >
                        <CloseOutlined style={{ fontSize: 10, color: "#fff" }} />
                    </div>
                )}

                <img
                    src="/logo/logolinhvat.png"
                    alt="Chuyển trang"
                    draggable={false}
                    style={{
                        width: 140,
                        height: "auto",
                        display: "block",
                        position: "relative",
                        zIndex: 1,
                    }}
                />
            </div>
        </div>
    );
};

export default DeptPageNav;