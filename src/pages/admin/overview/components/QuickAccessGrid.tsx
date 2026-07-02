import { memo, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
    ApartmentOutlined,
    ClusterOutlined,
    TrophyOutlined,
    AimOutlined,
    SafetyCertificateOutlined,
    FileProtectOutlined,
    DollarOutlined,
    BankOutlined,
    FileTextOutlined,
    IdcardOutlined,
    RightOutlined,
} from "@ant-design/icons";
import { useAppSelector } from "@/redux/hooks";
import { ALL_PERMISSIONS } from "@/config/permissions";
import type { IUserPosition } from "@/types/backend";

type Perm = { method: string; apiPath: string; module: string };

interface QuickAccessGridProps {
    position?: IUserPosition;
    onOpenProfile: () => void;
}

interface CardDef {
    key: string;
    label: string;
    subtitle?: string;
    icon: React.ReactNode;
    hue: string;
    grad: string;
    to?: string;
    onClick?: boolean;
    gate?: Perm;
}

/* ─────────────── Section header ─────────────── */
const SectionTitle = ({ children, count }: { children: React.ReactNode; count?: number }) => (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
        <div style={{
            width: 3, height: 14, borderRadius: 99,
            background: "#ec4899",
            flexShrink: 0,
        }} />
        <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.5, textTransform: "uppercase", color: "#6b7280" }}>
            {children}
        </span>
        {count !== undefined && (
            <span style={{
                marginLeft: 8,
                fontSize: 10, fontWeight: 700,
                background: "#f3f4f6",
                color: "#4b5563",
                borderRadius: 99, padding: "1px 8px",
            }}>
                {count}
            </span>
        )}
    </div>
);

/* ─────────────── Access Card ─────────────── */
const PremiumCard = ({ card, onClick }: { card: CardDef; onClick: () => void }) => {
    return (
        <button
            key={card.key}
            type="button"
            onClick={onClick}
            style={{
                position: "relative",
                display: "flex",
                alignItems: "center",
                gap: 14,
                padding: "14px 16px",
                borderRadius: 12,
                background: "#ffffff",
                border: "1px solid #e5e7eb",
                cursor: "pointer",
                textAlign: "left",
                width: "100%",
                overflow: "hidden",
                transition: "border-color 0.15s, box-shadow 0.15s",
                boxShadow: "0 1px 2px rgba(0,0,0,0.02)",
            }}
            onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "#ec4899";
                e.currentTarget.style.boxShadow = "0 4px 12px rgba(236,72,153,0.05)";
                const iconBox = e.currentTarget.querySelector(".icon-box") as HTMLDivElement;
                if (iconBox) {
                    iconBox.style.background = "#fdf2f8";
                    iconBox.style.color = "#ec4899";
                }
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "#e5e7eb";
                e.currentTarget.style.boxShadow = "0 1px 2px rgba(0,0,0,0.02)";
                const iconBox = e.currentTarget.querySelector(".icon-box") as HTMLDivElement;
                if (iconBox) {
                    iconBox.style.background = "#f3f4f6";
                    iconBox.style.color = "#4b5563";
                }
            }}
        >
            {/* Icon box - clean, flat & neutral by default */}
            <div
                className="icon-box"
                style={{
                    flexShrink: 0,
                    width: 40, height: 40,
                    borderRadius: 8,
                    background: "#f3f4f6",
                    color: "#4b5563",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 18,
                    transition: "background 0.15s, color 0.15s",
                }}
            >
                {card.icon}
            </div>

            {/* Label */}
            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#1f2937", lineHeight: 1.3, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {card.label}
                </div>
                {card.subtitle && (
                    <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 1 }}>{card.subtitle}</div>
                )}
            </div>

            {/* Arrow chevron */}
            <RightOutlined style={{ fontSize: 10, color: "#9ca3af", flexShrink: 0 }} />
        </button>
    );
};

/* ─────────────── Main Component ─────────────── */
const QuickAccessGrid = ({ position, onOpenProfile }: QuickAccessGridProps) => {
    const navigate = useNavigate();
    const permissions = useAppSelector((s) => s.account.user?.role?.permissions || []);
    const roleName = useAppSelector((s) => s.account.user?.role?.name?.toUpperCase() || "");

    const isAclDisabled = import.meta.env.VITE_ACL_ENABLE === "false" || roleName === "SUPER_ADMIN";

    const hasPerm = useCallback(
        (gate?: Perm) => {
            if (!gate) return true;
            if (isAclDisabled) return true;
            return permissions.some(
                (p: any) => p.apiPath === gate.apiPath && p.method === gate.method && p.module === gate.module
            );
        },
        [permissions, isAclDisabled]
    );

    const deptId = position?.department?.id;
    const companyId = position?.company?.id;

    const deptCards = useMemo<CardDef[]>(() => {
        if (!deptId) return [];
        return [
            {
                key: "dept-org",
                label: "Sơ đồ tổ chức phòng",
                subtitle: "Cơ cấu nhân sự phòng ban",
                icon: <ApartmentOutlined />,
                hue: "#3b82f6",
                grad: "linear-gradient(135deg,#3b82f6,#06b6d4)",
                to: `/admin/departments/${deptId}/org-chart`,
                gate: ALL_PERMISSIONS.DEPARTMENTS.GET_PAGINATE,
            },
            {
                key: "dept-position-chart",
                label: "Bản đồ chức danh",
                subtitle: "Phân cấp vị trí phòng ban",
                icon: <ClusterOutlined />,
                hue: "#6366f1",
                grad: "linear-gradient(135deg,#6366f1,#a855f7)",
                to: `/admin/departments/${deptId}/position-chart`,
            },
            {
                key: "dept-career",
                label: "Lộ trình thăng tiến",
                subtitle: "Lộ trình thăng tiến của phòng",
                icon: <TrophyOutlined />,
                hue: "#f59e0b",
                grad: "linear-gradient(135deg,#f59e0b,#ef4444)",
                to: `/admin/departments/${deptId}/career-paths`,
                gate: ALL_PERMISSIONS.CAREER_PATHS.GET_BY_DEPARTMENT,
            },
            {
                key: "dept-objectives",
                label: "Mục tiêu & nhiệm vụ",
                subtitle: "OKR & KPI phòng ban",
                icon: <AimOutlined />,
                hue: "#10b981",
                grad: "linear-gradient(135deg,#10b981,#0d9488)",
                to: `/admin/departments/${deptId}/objectives-tasks`,
                gate: ALL_PERMISSIONS.DEPARTMENT_OBJECTIVES.VIEW,
            },
            {
                key: "dept-permissions",
                label: "Bảng phân quyền phòng",
                subtitle: "Quản lý quyền truy cập",
                icon: <SafetyCertificateOutlined />,
                hue: "#8b5cf6",
                grad: "linear-gradient(135deg,#8b5cf6,#ec4899)",
                to: `/admin/departments/${deptId}/permissions`,
            },
            {
                key: "dept-procedures",
                label: "Quy trình phòng ban",
                subtitle: "SOP & tài liệu nội bộ",
                icon: <FileProtectOutlined />,
                hue: "#0ea5e9",
                grad: "linear-gradient(135deg,#0ea5e9,#38bdf8)",
                to: `/admin/departments/${deptId}/procedures`,
            },
            {
                key: "dept-salary",
                label: "Khung lương",
                subtitle: "Chính sách lương phòng ban",
                icon: <DollarOutlined />,
                hue: "#f97316",
                grad: "linear-gradient(135deg,#f97316,#fb923c)",
                to: `/admin/departments/${deptId}/salary-range`,
            },
        ];
    }, [deptId]);

    const companyCards = useMemo<CardDef[]>(() => {
        if (!companyId) return [];
        return [
            {
                key: "company-org",
                label: "Sơ đồ tổ chức công ty",
                subtitle: "Cơ cấu tổ chức toàn công ty",
                icon: <BankOutlined />,
                hue: "#3b82f6",
                grad: "linear-gradient(135deg,#3b82f6,#2563eb)",
                to: `/admin/companies/${companyId}/org-chart`,
                gate: ALL_PERMISSIONS.COMPANIES.GET_PAGINATE,
            },
            {
                key: "company-procedures",
                label: "Quy trình công ty",
                subtitle: "SOP & quy định toàn cục",
                icon: <FileTextOutlined />,
                hue: "#0ea5e9",
                grad: "linear-gradient(135deg,#0ea5e9,#0284c7)",
                to: `/admin/companies/${companyId}/procedures`,
            },
        ];
    }, [companyId]);

    const onCardClick = useCallback(
        (card: CardDef) => {
            if (card.onClick) { onOpenProfile(); return; }
            if (card.to) navigate(card.to);
        },
        [navigate, onOpenProfile]
    );

    const visibleDeptCards = deptCards.filter((c) => hasPerm(c.gate));
    const visibleCompanyCards = companyCards.filter((c) => hasPerm(c.gate));

    const profileCard: CardDef = {
        key: "profile",
        label: "Hồ sơ cá nhân",
        subtitle: "Xem & chỉnh sửa thông tin cá nhân",
        icon: <IdcardOutlined />,
        hue: "#ec4899",
        grad: "linear-gradient(135deg,#ec4899,#a855f7)",
        onClick: true,
    };

    const GRID: React.CSSProperties = {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
        gap: 14,
    };

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
            {visibleDeptCards.length > 0 && (
                <section>
                    <SectionTitle count={visibleDeptCards.length}>Phòng ban</SectionTitle>
                    <div style={GRID}>
                        {visibleDeptCards.map((card) => (
                            <PremiumCard key={card.key} card={card} onClick={() => onCardClick(card)} />
                        ))}
                    </div>
                </section>
            )}

            {visibleCompanyCards.length > 0 && (
                <section>
                    <SectionTitle count={visibleCompanyCards.length}>Công ty</SectionTitle>
                    <div style={GRID}>
                        {visibleCompanyCards.map((card) => (
                            <PremiumCard key={card.key} card={card} onClick={() => onCardClick(card)} />
                        ))}
                    </div>
                </section>
            )}

            <section>
                <SectionTitle>Khác</SectionTitle>
                <div style={GRID}>
                    <PremiumCard card={profileCard} onClick={() => onCardClick(profileCard)} />
                </div>
            </section>
        </div>
    );
};

export default memo(QuickAccessGrid);
