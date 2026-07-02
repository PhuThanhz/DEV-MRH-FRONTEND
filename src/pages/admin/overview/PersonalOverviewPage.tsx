import { useMemo, useState } from "react";
import { useAppSelector } from "@/redux/hooks";
import { useUserPositionsQuery } from "@/hooks/useUserPositions";
import { useEmployeeCareerPathByUserQuery } from "@/hooks/useEmployeeCareerPaths";
import type { IUserPosition } from "@/types/backend";
import ManageAccount from "@/components/common/modal/manage.account";
import CareerProgressHero from "./components/CareerProgressHero";
import QuickAccessGrid from "./components/QuickAccessGrid";
import {
    RocketOutlined,
    FileProtectOutlined,
    TeamOutlined,
    IdcardOutlined,
    WarningOutlined,
} from "@ant-design/icons";

/* ─── shared tokens ─────────────────────────────────── */
const ACCENT = "#ec4899";
const CARD: React.CSSProperties = {
    background: "#ffffff",
    borderRadius: 12,
    border: "1px solid #e5e7eb",
    boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
};

/* ─── Meta row item ─────────────────────────────────── */
const MetaItem = ({ label, value }: { label: string; value?: string | null }) => {
    if (!value) return null;
    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <span style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5, color: "#9ca3af" }}>{label}</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: "#1f2937" }}>{value}</span>
        </div>
    );
};

/* ─── Stat row item ─────────────────────────────────── */
interface StatRowProps { icon: React.ReactNode; label: string; value: string | number; warn?: boolean }
const StatRow = ({ icon, label, value, warn }: StatRowProps) => (
    <div style={{
        display: "flex", alignItems: "center", gap: 14,
        padding: "14px 0",
        borderBottom: "1px solid #f3f4f6",
    }}>
        <div style={{
            width: 36, height: 36, borderRadius: 8, flexShrink: 0,
            background: warn ? "#fef2f2" : "#fdf2f8",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: warn ? "#ef4444" : ACCENT, fontSize: 16,
        }}>{icon}</div>
        <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5, color: "#9ca3af" }}>{label}</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: warn ? "#ef4444" : "#111827", marginTop: 1 }}>{value}</div>
        </div>
    </div>
);

/* ─── Geometric Background layout ───────────────────── */
const GeometricBackground = () => (
    <div style={{ position: "absolute", inset: 0, zIndex: 0, pointerEvents: "none", overflow: "hidden" }}>
        {/* Top soft rose block - matches the header pink tone gently */}
        <div style={{
            position: "absolute", top: 0, left: 0, right: 0, height: 240,
            background: "linear-gradient(180deg, #fff0f6 0%, #fdf2f8 100%)",
        }} />

        {/* Left vertical backdrop column - coordinates with the page structure */}
        <div style={{
            position: "absolute", top: 0, left: 0, width: "30%", bottom: 0,
            background: "linear-gradient(90deg, #fdf2f8 0%, rgba(253,242,248,0) 100%)",
        }} />

        {/* Bottom fuchsia glow accent panel - soft and clean */}
        <div style={{
            position: "absolute", bottom: 0, right: 0, width: "40%", height: 400,
            background: "radial-gradient(circle at bottom right, #fff0f6 0%, rgba(255,255,255,0) 70%)",
        }} />
    </div>
);

/* ─── Page ───────────────────────────────────────────── */
const PersonalOverviewPage = () => {
    const user = useAppSelector((s) => s.account.user);
    const userId = user?.id;

    const { data: positions = [], isLoading: loadingPositions } = useUserPositionsQuery(userId);
    const { data: careerPath, isLoading: loadingCareer, isError: careerError } = useEmployeeCareerPathByUserQuery(userId);

    const [openAccount, setOpenAccount] = useState(false);
    const selected: IUserPosition | undefined = useMemo(() => positions[0], [positions]);

    const userInfo = user?.userInfo;
    const contractExpire = userInfo?.contractExpireDate ?? null;
    const daysToExpiry = contractExpire
        ? Math.ceil((new Date(contractExpire).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
        : null;

    const initials = user?.name?.split(" ").slice(-2).map(w => w[0]).join("").toUpperCase() || "?";
    const curStep = careerPath?.currentStepOrder ?? null;
    const totalSteps = careerPath?.totalSteps ?? null;

    return (
        <div style={{
            position: "relative",
            minHeight: "calc(100vh - 64px)",
            background: "#fafafb",
            margin: "-16px -16px -120px -16px",
            padding: "24px 28px 100px",
            boxSizing: "border-box",
            overflow: "hidden",
        }}>
            <GeometricBackground />

            <div style={{ position: "relative", zIndex: 1, maxWidth: 1140, margin: "0 auto", display: "flex", flexDirection: "column", gap: 16 }}>

                {/* ══ PROFILE HEADER ═══════════════════════════════════════ */}
                <div style={{ ...CARD, padding: "20px 24px", display: "flex", alignItems: "center", gap: 20 }}>
                    {/* Avatar */}
                    <div style={{
                        width: 56, height: 56, borderRadius: "50%", flexShrink: 0,
                        background: "linear-gradient(135deg,#ec4899,#a855f7)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 20, fontWeight: 800, color: "#fff",
                        border: "2px solid #fff", boxShadow: "0 0 0 2px #fce7f3",
                    }}>
                        {initials}
                    </div>

                    {/* Name + title */}
                    <div style={{ flex: 1 }}>
                        <h1 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: "#111827", lineHeight: 1.2 }}>
                            {user?.name || "—"}
                        </h1>
                        <p style={{ margin: "3px 0 0", fontSize: 13, color: "#6b7280", fontWeight: 500 }}>
                            {selected?.jobTitle?.nameVi
                                ? `${selected.jobTitle.nameVi}${selected.jobTitle.band ? ` · Band ${selected.jobTitle.band}` : ""}`
                                : user?.email || ""}
                        </p>
                    </div>

                    {/* Divider */}
                    <div style={{ width: 1, height: 48, background: "#e5e7eb", flexShrink: 0 }} />

                    {/* Meta items */}
                    <div style={{ display: "flex", gap: 32, flexWrap: "wrap" }}>
                        <MetaItem label="Phòng ban" value={selected?.department?.name} />
                        <MetaItem label="Công ty" value={selected?.company?.name} />
                        <MetaItem label="Mã nhân viên" value={selected?.user?.employeeCode} />
                        <MetaItem label="Email" value={user?.email} />
                    </div>

                    {/* Edit link */}
                    <button
                        onClick={() => setOpenAccount(true)}
                        style={{
                            flexShrink: 0, marginLeft: "auto",
                            background: "transparent",
                            border: "1px solid #e5e7eb",
                            borderRadius: 8, padding: "7px 16px",
                            fontSize: 13, fontWeight: 600, color: "#374151",
                            cursor: "pointer",
                        }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = ACCENT; e.currentTarget.style.color = ACCENT; }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = "#e5e7eb"; e.currentTarget.style.color = "#374151"; }}
                    >
                        Chỉnh sửa hồ sơ
                    </button>
                </div>

                {/* ══ MAIN CONTENT: 3-col left + 1-col right ═══════════════ */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: 16, alignItems: "start" }}>

                    {/* LEFT — Career roadmap */}
                    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                        <div style={CARD}>
                            <div style={{
                                padding: "16px 20px",
                                borderBottom: "1px solid #f3f4f6",
                                display: "flex", alignItems: "center", gap: 10,
                            }}>
                                <div style={{ width: 3, height: 16, borderRadius: 99, background: ACCENT }} />
                                <h2 style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "#374151", textTransform: "uppercase", letterSpacing: 0.5 }}>
                                    Lộ trình thăng tiến
                                </h2>
                                {curStep !== null && totalSteps !== null && (
                                    <span style={{
                                        marginLeft: "auto", fontSize: 12, fontWeight: 600,
                                        color: "#fff", background: ACCENT,
                                        borderRadius: 99, padding: "2px 10px",
                                    }}>
                                        Bậc {curStep} / {totalSteps}
                                    </span>
                                )}
                            </div>
                            <div style={{ padding: "20px" }}>
                                <CareerProgressHero
                                    data={careerPath}
                                    isLoading={loadingCareer}
                                    isError={careerError}
                                    departmentId={selected?.department?.id}
                                />
                            </div>
                        </div>

                        {/* Quick access */}
                        {!loadingPositions && (
                            <div style={CARD}>
                                <div style={{
                                    padding: "16px 20px",
                                    borderBottom: "1px solid #f3f4f6",
                                    display: "flex", alignItems: "center", gap: 10,
                                }}>
                                    <div style={{ width: 3, height: 16, borderRadius: 99, background: "#6366f1" }} />
                                    <h2 style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "#374151", textTransform: "uppercase", letterSpacing: 0.5 }}>
                                        Truy cập nhanh
                                    </h2>
                                </div>
                                <div style={{ padding: "20px" }}>
                                    <QuickAccessGrid position={selected} onOpenProfile={() => setOpenAccount(true)} />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* RIGHT — Compact stat panel */}
                    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                        <div style={CARD}>
                            <div style={{ padding: "16px 20px", borderBottom: "1px solid #f3f4f6" }}>
                                <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, color: "#9ca3af" }}>Tổng quan</span>
                            </div>
                            <div style={{ padding: "0 20px" }}>
                                <StatRow
                                    icon={<IdcardOutlined />}
                                    label="Số chức vụ đang giữ"
                                    value={loadingPositions ? "…" : `${positions.length} vị trí`}
                                />
                                <StatRow
                                    icon={<RocketOutlined />}
                                    label="Bậc lộ trình"
                                    value={curStep !== null && totalSteps !== null ? `${curStep} / ${totalSteps}` : "Chưa thiết lập"}
                                />
                                <StatRow
                                    icon={<TeamOutlined />}
                                    label="Phòng ban"
                                    value={selected?.department?.name || "—"}
                                />
                                <StatRow
                                    icon={daysToExpiry !== null && daysToExpiry < 30 ? <WarningOutlined /> : <FileProtectOutlined />}
                                    label="Hạn hợp đồng còn lại"
                                    value={daysToExpiry !== null ? `${daysToExpiry} ngày` : "—"}
                                    warn={daysToExpiry !== null && daysToExpiry < 30}
                                />
                            </div>
                        </div>

                        {/* Career status */}
                        {careerPath?.progressStatusLabel && (
                            <div style={{
                                ...CARD,
                                padding: "16px 20px",
                                borderLeft: `3px solid ${ACCENT}`,
                            }}>
                                <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, color: "#9ca3af", marginBottom: 6 }}>
                                    Trạng thái lộ trình
                                </div>
                                <div style={{ fontSize: 14, fontWeight: 700, color: "#111827" }}>{careerPath.progressStatusLabel}</div>
                                {careerPath.overdue && (
                                    <div style={{ marginTop: 8, fontSize: 12, color: "#ef4444", display: "flex", alignItems: "center", gap: 5 }}>
                                        <WarningOutlined /> Quá hạn dự kiến
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <ManageAccount open={openAccount} onClose={setOpenAccount} />
        </div>
    );
};

export default PersonalOverviewPage;
