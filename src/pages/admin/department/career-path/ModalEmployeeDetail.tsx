import { Modal, Typography, Avatar, Tabs } from "antd";
import {
    ProfileOutlined,
    HistoryOutlined,
    WarningOutlined,
    PauseCircleOutlined,
    ClockCircleOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";

import type { IEmployeeCareerPath } from "@/types/backend";
import { TabInfo } from "./Tabinfo";
import { TabHistory } from "./Tabhistory";

const { Text, Title } = Typography;

// ── Design tokens ────────────────────────────────────────────────────
export const T = {
    ink: "#0d0d10",
    ink2: "#232329",
    ink3: "#4a4a54",
    ink4: "#8a8a96",
    ink5: "#b8b8c2",
    ink6: "#dcdce6",
    white: "#ffffff",
    s1: "#f7f7fa",
    s2: "#efeff4",
    line: "rgba(0,0,0,0.06)",
    lineMed: "rgba(0,0,0,0.10)",

    acc: "#2563eb",
    accSoft: "rgba(37,99,235,0.06)",
    accBord: "rgba(37,99,235,0.16)",
    accHover: "rgba(37,99,235,0.12)",

    violet: "#6d28d9",
    violetSoft: "rgba(109,40,217,0.06)",
    violetBord: "rgba(109,40,217,0.16)",

    amber: "#b45309",
    amberSoft: "rgba(180,83,9,0.06)",
    amberBord: "rgba(180,83,9,0.18)",

    red: "#dc2626",
    redSoft: "rgba(220,38,38,0.06)",
    redBord: "rgba(220,38,38,0.16)",

    green: "#16a34a",
    greenSoft: "rgba(22,163,74,0.06)",
    greenBord: "rgba(22,163,74,0.16)",

    slate: "#475569",
    slateSoft: "rgba(71,85,105,0.06)",
    slateBord: "rgba(71,85,105,0.16)",
};

export const AVATAR_PALETTE = [
    "#2563eb", "#6d28d9", "#0891b2", "#0d9488",
    "#b45309", "#dc2626", "#db2777",
];
export const avatarColor = (name?: string) =>
    name ? AVATAR_PALETTE[name.charCodeAt(0) % AVATAR_PALETTE.length] : AVATAR_PALETTE[0];

// ── Shared: Badge ────────────────────────────────────────────────────
export const Badge = ({
    children, color, bg, border,
}: { children: React.ReactNode; color: string; bg: string; border: string }) => (
    <span style={{
        display: "inline-flex", alignItems: "center", gap: 4,
        padding: "3px 9px", borderRadius: 6,
        background: bg, border: `1px solid ${border}`,
        fontSize: 11, fontWeight: 600, color,
        letterSpacing: 0.2, whiteSpace: "nowrap",
        lineHeight: 1.4,
    }}>
        {children}
    </span>
);

// ── Shared: Card ─────────────────────────────────────────────────────
export const Card = ({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) => (
    <div style={{
        background: T.white,
        borderRadius: 14,
        border: `1px solid ${T.line}`,
        padding: "16px 18px",
        boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
        ...style,
    }}>
        {children}
    </div>
);

// ── Shared: SectionLabel ─────────────────────────────────────────────
export const SectionLabel = ({ children }: { children: React.ReactNode }) => (
    <Text style={{
        fontSize: 10, fontWeight: 700, color: T.ink5,
        letterSpacing: 1.1, textTransform: "uppercase",
        display: "block", marginBottom: 14,
    }}>
        {children}
    </Text>
);

// ── Status config ────────────────────────────────────────────────────
const STATUS_MAP = {
    0: {
        label: "Đang phát triển",
        color: T.acc, bg: T.accSoft, border: T.accBord,
        icon: <ClockCircleOutlined style={{ fontSize: 11 }} />,
    },
    2: {
        label: "Tạm dừng",
        color: T.amber, bg: T.amberSoft, border: T.amberBord,
        icon: <PauseCircleOutlined style={{ fontSize: 11 }} />,
    },
};
const getStatus = (s?: number) =>
    STATUS_MAP[s as keyof typeof STATUS_MAP] ?? STATUS_MAP[0];

// ── Main modal ───────────────────────────────────────────────────────
interface IProps {
    open: boolean;
    onClose: () => void;
    dataInit?: IEmployeeCareerPath | null;
}

const ModalEmployeeDetail = ({ open, onClose, dataInit }: IProps) => {
    const st = getStatus(dataInit?.progressStatus);

    const tabItems = [
        {
            key: "info",
            label: (
                <span style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 13 }}>
                    <ProfileOutlined style={{ fontSize: 13 }} />
                    Lộ trình
                </span>
            ),
            children: dataInit ? <TabInfo dataInit={dataInit} /> : null,
        },
        {
            key: "history",
            label: (
                <span style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 13 }}>
                    <HistoryOutlined style={{ fontSize: 13 }} />
                    Quá trình công tác
                </span>
            ),
            children: (
                <TabHistory userId={open && dataInit?.user?.id ? dataInit.user.id : undefined} />
            ),
        },
    ];

    return (
        <Modal
            open={open}
            onCancel={onClose}
            footer={null}
            width={980}
            centered
            destroyOnClose
            styles={{
                content: {
                    padding: 0,
                    borderRadius: 18,
                    overflow: "hidden",
                    boxShadow: "0 24px 64px rgba(0,0,0,0.14), 0 4px 16px rgba(0,0,0,0.08)",
                },
                body: { padding: 0 },
                mask: { backdropFilter: "blur(4px)", background: "rgba(0,0,0,0.35)" },
            }}
        >
            {!dataInit ? null : (
                <div style={{ display: "flex", flexDirection: "column", minHeight: 0 }}>

                    {/* ── Header ── */}
                    <div style={{
                        padding: "22px 28px 18px",
                        borderBottom: `1px solid ${T.line}`,
                        background: T.white,
                        position: "relative",
                    }}>


                        <div style={{ display: "flex", alignItems: "center", gap: 16, paddingTop: 2 }}>
                            {/* Avatar */}
                            <Avatar
                                size={54}
                                style={{
                                    background: `linear-gradient(135deg, ${avatarColor(dataInit.user?.name)}, ${avatarColor(dataInit.user?.name)}cc)`,
                                    fontSize: 20, fontWeight: 700, flexShrink: 0,
                                    borderRadius: 14,
                                    boxShadow: `0 4px 12px ${avatarColor(dataInit.user?.name)}40`,
                                }}
                            >
                                {dataInit.user?.name?.charAt(0)?.toUpperCase() ?? "?"}
                            </Avatar>

                            {/* Name + info */}
                            <div style={{ flex: 1, minWidth: 0 }}>
                                {/* Row 1: tên + trạng thái */}
                                <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 3 }}>
                                    <Title level={4} style={{ margin: 0, color: T.ink, fontSize: 17, fontWeight: 700, lineHeight: 1.2 }}>
                                        {dataInit.user?.name ?? "—"}
                                    </Title>
                                    <div style={{
                                        display: "inline-flex", alignItems: "center", gap: 5,
                                        padding: "3px 10px", borderRadius: 7,
                                        background: st.bg, border: `1px solid ${st.border}`,
                                        fontSize: 11, fontWeight: 600, color: st.color,
                                    }}>
                                        {st.icon}&nbsp;{st.label}
                                    </div>
                                </div>

                                {/* Row 2: email */}
                                <Text style={{ fontSize: 12.5, color: T.ink4, display: "block", marginBottom: 8 }}>
                                    {dataInit.user?.email ?? "—"}
                                </Text>

                                {/* Row 3: vị trí hiện tại → kế tiếp */}
                                <div style={{
                                    display: "inline-flex", alignItems: "center", gap: 8,
                                    padding: "5px 12px", borderRadius: 8,
                                    background: T.s1, border: `1px solid ${T.ink6}`,
                                    flexWrap: "wrap",
                                }}>
                                    <Text style={{ fontSize: 11, color: T.ink5, fontWeight: 600, letterSpacing: 0.4, textTransform: "uppercase" }}>
                                        Hiện tại
                                    </Text>
                                    <Text style={{ fontSize: 13, fontWeight: 600, color: T.ink2 }}>
                                        {dataInit.currentStep?.jobTitleName ?? "—"}
                                    </Text>
                                    {dataInit.currentStep?.positionLevelCode && (
                                        <Badge color={T.acc} bg={T.accSoft} border={T.accBord}>
                                            {dataInit.currentStep.positionLevelCode}
                                        </Badge>
                                    )}
                                    {dataInit.nextStep?.jobTitleName && (
                                        <>
                                            <span style={{ fontSize: 11, color: T.ink5 }}>→</span>
                                            <Text style={{ fontSize: 12.5, color: T.ink4, fontWeight: 500 }}>
                                                {dataInit.nextStep.jobTitleName}
                                            </Text>
                                            {dataInit.nextStep?.positionLevelCode && (
                                                <Badge color={T.violet} bg={T.violetSoft} border={T.violetBord}>
                                                    {dataInit.nextStep.positionLevelCode}
                                                </Badge>
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Progress pill */}
                            {dataInit.currentStepOrder && dataInit.totalSteps && (
                                <div style={{
                                    flexShrink: 0, textAlign: "center",
                                    padding: "8px 18px", borderRadius: 12,
                                    background: T.accSoft,
                                    border: `1px solid ${T.accBord}`,
                                }}>
                                    <Text style={{
                                        fontSize: 22, fontWeight: 800, color: T.acc,
                                        lineHeight: 1, display: "block", fontVariantNumeric: "tabular-nums",
                                    }}>
                                        {dataInit.currentStepOrder}
                                        <Text style={{ fontSize: 14, color: `${T.acc}99`, fontWeight: 500 }}>
                                            /{dataInit.totalSteps}
                                        </Text>
                                    </Text>
                                    <Text style={{ fontSize: 10, color: T.acc, fontWeight: 600, letterSpacing: 0.6, textTransform: "uppercase" }}>
                                        Vị trí
                                    </Text>
                                </div>
                            )}
                        </div>

                        {/* Overdue banner */}
                        {dataInit.overdue && (
                            <div style={{
                                display: "flex", alignItems: "center", gap: 8,
                                marginTop: 12, padding: "9px 14px",
                                background: T.redSoft, border: `1px solid ${T.redBord}`,
                                borderRadius: 10, fontSize: 12.5, color: T.red, fontWeight: 500,
                            }}>
                                <WarningOutlined style={{ fontSize: 14 }} />
                                Nhân viên này đã vượt quá thời gian dự kiến ở vị trí hiện tại
                            </div>
                        )}
                    </div>

                    {/* ── Tabs body ── */}
                    <div style={{
                        padding: "4px 28px 24px",
                        background: T.s1,
                        minHeight: 380,
                        flex: 1,
                    }}>
                        <Tabs
                            items={tabItems}
                            size="middle"
                            style={{ marginTop: 0 }}
                            tabBarStyle={{ marginBottom: 16 }}
                        />
                    </div>

                    {/* ── Audit footer ── */}
                    <div style={{
                        padding: "10px 28px",
                        borderTop: `1px solid ${T.line}`,
                        background: T.white,
                        display: "flex", justifyContent: "space-between", alignItems: "center",
                        flexWrap: "wrap", gap: 4,
                    }}>
                        <Text style={{ fontSize: 11, color: T.ink5 }}>
                            Tạo bởi{" "}
                            <strong style={{ color: T.ink4, fontWeight: 600 }}>{dataInit.createdBy || "—"}</strong>
                            {dataInit.createdAt && (
                                <span> · {dayjs(dataInit.createdAt).format("DD/MM/YYYY HH:mm")}</span>
                            )}
                        </Text>
                        {dataInit.updatedAt && (
                            <Text style={{ fontSize: 11, color: T.ink5 }}>
                                Cập nhật bởi{" "}
                                <strong style={{ color: T.ink4, fontWeight: 600 }}>{dataInit.updatedBy || "—"}</strong>
                                {" · "}{dayjs(dataInit.updatedAt).format("DD/MM/YYYY HH:mm")}
                            </Text>
                        )}
                    </div>
                </div>
            )}
        </Modal>
    );
};

export default ModalEmployeeDetail;