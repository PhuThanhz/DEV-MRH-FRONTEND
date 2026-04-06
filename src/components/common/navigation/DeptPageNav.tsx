import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { MenuOutlined, CloseOutlined } from "@ant-design/icons";

interface DeptPage {
    label: string;
    pathTemplate: string;
    /** Nếu false thì mục này bị ẩn khỏi menu. Không truyền = luôn hiện. */
    visible?: boolean;
}

// ── Danh sách trang mặc định ──────────────────────────────────────────────────
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
    }
];

// ── Helpers ───────────────────────────────────────────────────────────────────
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

// ── Props ─────────────────────────────────────────────────────────────────────
interface DeptPageNavProps {
    /**
     * Ghi đè danh sách trang + kiểm soát visible theo permission.
     * Nếu không truyền thì dùng DEFAULT_PAGES (tất cả hiện).
     *
     * Ví dụ:
     * <DeptPageNav pages={[
     *   { label: "Sơ đồ tổ chức", pathTemplate: "...", visible: hasOrgChartPerm },
     *   { label: "Phân quyền",    pathTemplate: "...", visible: hasPermPerm },
     * ]} />
     */
    pages?: DeptPage[];
}

// ── Component ─────────────────────────────────────────────────────────────────
const ACCENT = "#e8637a";

const DeptPageNav = ({ pages = DEFAULT_PAGES }: DeptPageNavProps) => {
    const location = useLocation();
    const navigate = useNavigate();
    const [open, setOpen] = useState(false);

    const departmentId = extractDepartmentId(location.pathname);
    if (!departmentId) return null;

    // Chỉ giữ các mục visible !== false
    const visiblePages = pages.filter((p) => p.visible !== false);
    if (visiblePages.length === 0) return null;

    const currentIndex = visiblePages.findIndex(({ pathTemplate }) =>
        toRegex(pathTemplate).test(location.pathname)
    );
    // Không render nếu trang hiện tại không nằm trong danh sách
    if (currentIndex === -1) return null;

    const handleNavigate = (page: DeptPage) => {
        setOpen(false);
        navigate({
            pathname: resolvePath(page.pathTemplate, departmentId),
            search: location.search, // giữ ?departmentName=...
        });
    };

    return (
        <div
            style={{
                position: "fixed",
                bottom: 90,
                right: 24,
                zIndex: 1000,
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-end",
                gap: 6,
            }}
        >
            {/* Dropdown menu */}
            {open && (
                <div
                    style={{
                        background: "#fff",
                        border: "0.5px solid #e8e8e8",
                        borderRadius: 12,
                        overflow: "hidden",
                        boxShadow: "0 4px 16px rgba(0,0,0,0.10)",
                        minWidth: 200,
                    }}
                >
                    <div
                        style={{
                            padding: "7px 14px",
                            fontSize: 10,
                            fontWeight: 600,
                            letterSpacing: ".06em",
                            textTransform: "uppercase",
                            color: "#888",
                            background: "#f8f8f8",
                            borderBottom: "0.5px solid #f0f0f0",
                        }}
                    >
                        Phòng ban
                    </div>

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
                                    fontWeight: isActive ? 500 : 400,
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
                                <span
                                    style={{
                                        width: 7,
                                        height: 7,
                                        borderRadius: "50%",
                                        flexShrink: 0,
                                        background: isActive ? ACCENT : "transparent",
                                        border: isActive ? "none" : "1.5px solid #ccc",
                                    }}
                                />
                                {page.label}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Toggle button */}
            <button
                onClick={() => setOpen((v) => !v)}
                style={{
                    width: 40,
                    height: 40,
                    borderRadius: "50%",
                    border: "none",
                    background: ACCENT,
                    color: "#fff",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: "0 2px 10px rgba(232,99,122,0.35)",
                }}
            >
                {open
                    ? <CloseOutlined style={{ fontSize: 14 }} />
                    : <MenuOutlined style={{ fontSize: 14 }} />
                }
            </button>
        </div>
    );
};

export default DeptPageNav;