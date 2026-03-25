import { Modal, Typography, Avatar, Skeleton, Tabs } from "antd";
import {
    ClockCircleOutlined,
    PauseCircleOutlined,
    RiseOutlined,
    CheckOutlined,
    WarningOutlined,
    ArrowRightOutlined,
    UserOutlined,
    HistoryOutlined,
    ProfileOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";

import { useEmployeeCareerPathHistoryQuery } from "@/hooks/useEmployeeCareerPaths";
import type { IEmployeeCareerPath, IEmployeeCareerPathStepProgress } from "@/types/backend";

const { Text, Title } = Typography;

// ── Design tokens ───────────────────────────────────────────────────
const T = {
    ink: "#0f0f10",
    ink2: "#2a2a2e",
    ink3: "#5a5a60",
    ink4: "#9a9aa0",
    ink5: "#c8c8ce",
    ink6: "#e8e8ec",
    white: "#ffffff",
    s1: "#f8f8fa",
    s2: "#f0f0f4",
    line: "rgba(0,0,0,0.05)",
    lineMed: "rgba(0,0,0,0.09)",

    acc: "#2563eb",
    accSoft: "rgba(37,99,235,0.07)",
    accBord: "rgba(37,99,235,0.18)",

    violet: "#7c3aed",
    violetSoft: "rgba(124,58,237,0.07)",
    violetBord: "rgba(124,58,237,0.18)",

    amber: "#d97706",
    amberSoft: "rgba(217,119,6,0.07)",
    amberBord: "rgba(217,119,6,0.20)",

    red: "#dc2626",
    redSoft: "rgba(220,38,38,0.07)",
    redBord: "rgba(220,38,38,0.18)",

    slate: "#475569",
    slateSoft: "rgba(71,85,105,0.07)",
    slateBord: "rgba(71,85,105,0.18)",
};

const AVATAR_PALETTE = [
    "#2563eb", "#7c3aed", "#0891b2", "#0d9488", "#d97706", "#dc2626", "#db2777",
];
const avatarColor = (name?: string) =>
    name ? AVATAR_PALETTE[name.charCodeAt(0) % AVATAR_PALETTE.length] : AVATAR_PALETTE[0];

// ── Status config — no green ────────────────────────────────────────
const STATUS_MAP = {
    0: { label: "Đang phát triển", color: T.acc, bg: T.accSoft, border: T.accBord, icon: <ClockCircleOutlined /> },
    2: { label: "Tạm dừng", color: T.amber, bg: T.amberSoft, border: T.amberBord, icon: <PauseCircleOutlined /> },
};
const getStatus = (s?: number) =>
    STATUS_MAP[s as keyof typeof STATUS_MAP] ?? STATUS_MAP[0];

// ── Tiny badge ──────────────────────────────────────────────────────
const Badge = ({
    children, color, bg, border,
}: { children: React.ReactNode; color: string; bg: string; border: string }) => (
    <span style={{
        display: "inline-flex", alignItems: "center", gap: 4,
        padding: "2px 8px", borderRadius: 5,
        background: bg, border: `1px solid ${border}`,
        fontSize: 10, fontWeight: 700, color, letterSpacing: 0.3,
    }}>
        {children}
    </span>
);

// ── Info row ────────────────────────────────────────────────────────
const InfoRow = ({ label, value }: { label: string; value?: React.ReactNode }) => (
    <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        padding: "9px 0", borderBottom: `1px solid ${T.line}`,
    }}>
        <Text style={{ fontSize: 12, color: T.ink4, fontWeight: 500, flexShrink: 0, width: 160 }}>
            {label}
        </Text>
        <div style={{ flex: 1, textAlign: "right" }}>
            {typeof value === "string" || typeof value === "number"
                ? <Text style={{ fontSize: 13, color: T.ink2, fontWeight: 500 }}>{value || "—"}</Text>
                : value ?? <Text style={{ fontSize: 13, color: T.ink5 }}>—</Text>
            }
        </div>
    </div>
);

// ── Section label ───────────────────────────────────────────────────
const SectionLabel = ({ children }: { children: React.ReactNode }) => (
    <Text style={{
        fontSize: 10, fontWeight: 700, color: T.ink5,
        letterSpacing: 0.9, textTransform: "uppercase",
        display: "block", marginBottom: 12,
    }}>
        {children}
    </Text>
);

// ── Card wrapper ────────────────────────────────────────────────────
const Card = ({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) => (
    <div style={{
        background: T.white, borderRadius: 12,
        border: `1px solid ${T.line}`, padding: "14px 16px",
        ...style,
    }}>
        {children}
    </div>
);

// ── Timeline step ───────────────────────────────────────────────────
const StepNode = ({ step, isLast }: { step: IEmployeeCareerPathStepProgress; isLast: boolean }) => {
    const isCompleted = step.stepStatus === "COMPLETED";
    const isCurrent = step.stepStatus === "CURRENT";
    const isPending = !isCompleted && !isCurrent;

    const dotColor = isCompleted ? T.slate : isCurrent ? T.acc : T.ink5;
    const dotBg = isCompleted ? T.slateSoft : isCurrent ? T.accSoft : T.s2;
    const dotBorder = isCompleted ? T.slateBord : isCurrent ? T.accBord : T.ink6;

    return (
        <div style={{ display: "flex", gap: 12, minHeight: isLast ? 0 : 52 }}>
            {/* Dot + connector */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0 }}>
                <div style={{
                    width: 28, height: 28, borderRadius: "50%",
                    background: dotBg, border: `1.5px solid ${dotBorder}`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                    {isCompleted
                        ? <CheckOutlined style={{ fontSize: 11, color: T.slate }} />
                        : isCurrent
                            ? <div style={{ width: 8, height: 8, borderRadius: "50%", background: T.acc }} />
                            : <div style={{ width: 6, height: 6, borderRadius: "50%", background: T.ink5 }} />
                    }
                </div>
                {!isLast && (
                    <div style={{
                        width: 1.5, flex: 1, marginTop: 4,
                        background: isCompleted
                            ? `linear-gradient(to bottom, ${T.slateBord}, ${T.ink6})`
                            : T.line,
                    }} />
                )}
            </div>

            {/* Content */}
            <div style={{ flex: 1, paddingBottom: isLast ? 0 : 16, paddingTop: 2 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", marginBottom: 3 }}>
                    <Text style={{ fontSize: 10, fontWeight: 700, color: dotColor, letterSpacing: 0.5 }}>
                        GIAI ĐOẠN {step.stepOrder}
                    </Text>

                    {step.positionLevelCode && (
                        <Badge
                            color={isCurrent ? T.acc : isCompleted ? T.slate : T.ink4}
                            bg={isCurrent ? T.accSoft : isCompleted ? T.slateSoft : T.s2}
                            border={isCurrent ? T.accBord : isCompleted ? T.slateBord : T.ink6}
                        >
                            {step.positionLevelCode}
                        </Badge>
                    )}

                    {isCurrent && (
                        <Badge color={T.acc} bg={T.accSoft} border={T.accBord}>
                            Hiện tại
                        </Badge>
                    )}
                    {isCompleted && (
                        <Badge color={T.slate} bg={T.slateSoft} border={T.slateBord}>
                            Đã bổ nhiệm
                        </Badge>
                    )}
                </div>

                <Text style={{
                    fontSize: 13,
                    fontWeight: isCurrent ? 600 : isCompleted ? 500 : 400,
                    color: isCurrent ? T.ink : isCompleted ? T.ink2 : T.ink4,
                    display: "block",
                }}>
                    {step.jobTitleName ?? "—"}
                </Text>

                <div style={{ display: "flex", gap: 12, marginTop: 3, flexWrap: "wrap" }}>
                    {step.durationMonths && (
                        <Text style={{ fontSize: 11, color: T.ink5 }}>
                            Dự kiến: {step.durationMonths} tháng
                        </Text>
                    )}
                    {isCompleted && step.promotedAt && (
                        <Text style={{ fontSize: 11, color: T.ink4 }}>
                            Bổ nhiệm: {dayjs(step.promotedAt).format("DD/MM/YYYY")}
                        </Text>
                    )}
                    {isCompleted && step.actualMonths !== undefined && step.actualMonths !== null && (
                        <Text style={{ fontSize: 11, color: T.ink5 }}>
                            Thực tế: {step.actualMonths} tháng
                        </Text>
                    )}
                </div>
            </div>
        </div>
    );
};

// ── Tab: Thông tin lộ trình ─────────────────────────────────────────
const TabInfo = ({ dataInit }: { dataInit: IEmployeeCareerPath }) => {
    const expectedDate = dataInit.stepStartedAt && dataInit.durationMonths
        ? dayjs(dataInit.stepStartedAt).add(dataInit.durationMonths, "month")
        : null;

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <Card>
                <SectionLabel>Lộ trình & vị trí</SectionLabel>

                <InfoRow
                    label="Tên lộ trình"
                    value={
                        <Text style={{ fontSize: 13, fontWeight: 600, color: T.acc }}>
                            {dataInit.template?.name ?? "—"}
                        </Text>
                    }
                />

                <InfoRow
                    label="Vị trí hiện tại"
                    value={
                        dataInit.currentStep && (
                            <div style={{ display: "flex", alignItems: "center", gap: 6, justifyContent: "flex-end" }}>
                                <Text style={{ fontSize: 13, color: T.ink2, fontWeight: 500 }}>
                                    {dataInit.currentStep.jobTitleName}
                                </Text>
                                {dataInit.currentStep.positionLevelCode && (
                                    <Badge color={T.acc} bg={T.accSoft} border={T.accBord}>
                                        {dataInit.currentStep.positionLevelCode}
                                    </Badge>
                                )}
                            </div>
                        )
                    }
                />

                <InfoRow
                    label="Vị trí kế tiếp"
                    value={
                        dataInit.nextStep ? (
                            <div style={{ display: "flex", alignItems: "center", gap: 6, justifyContent: "flex-end" }}>
                                <Text style={{ fontSize: 13, color: T.ink2, fontWeight: 500 }}>
                                    {dataInit.nextStep.jobTitleName}
                                </Text>
                                {dataInit.nextStep.positionLevelCode && (
                                    <Badge color={T.violet} bg={T.violetSoft} border={T.violetBord}>
                                        {dataInit.nextStep.positionLevelCode}
                                    </Badge>
                                )}
                            </div>
                        ) : (
                            <Text style={{ fontSize: 12, color: T.ink4, fontWeight: 500 }}>—</Text>
                        )
                    }
                />

                <InfoRow
                    label="Ngày bổ nhiệm"
                    value={dataInit.stepStartedAt
                        ? dayjs(dataInit.stepStartedAt).format("DD/MM/YYYY")
                        : undefined}
                />

                <InfoRow
                    label="Thời gian đảm nhiệm"
                    value={
                        dataInit.daysInCurrentStep !== undefined ? (
                            <div style={{ display: "flex", alignItems: "center", gap: 6, justifyContent: "flex-end" }}>
                                <Text style={{
                                    fontSize: 13, fontWeight: 500,
                                    color: dataInit.overdue ? T.red : T.ink2,
                                }}>
                                    {dataInit.daysInCurrentStep} ngày
                                </Text>
                                {dataInit.overdue && (
                                    <Badge color={T.red} bg={T.redSoft} border={T.redBord}>
                                        <WarningOutlined style={{ fontSize: 9 }} /> Quá hạn
                                    </Badge>
                                )}
                            </div>
                        ) : undefined
                    }
                />

                <InfoRow
                    label="Dự kiến bổ nhiệm"
                    value={
                        expectedDate ? (
                            <Text style={{
                                fontSize: 13, fontWeight: 500,
                                color: dataInit.overdue ? T.red : T.ink2,
                            }}>
                                {expectedDate.format("DD/MM/YYYY")}
                                {dataInit.overdue && <WarningOutlined style={{ marginLeft: 6, fontSize: 12, color: T.red }} />}
                            </Text>
                        ) : undefined
                    }
                />

                <InfoRow
                    label="Tiến độ lộ trình"
                    value={
                        dataInit.currentStepOrder && dataInit.totalSteps ? (
                            <div style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "flex-end" }}>
                                <div style={{
                                    width: 88, height: 5, background: T.s2,
                                    borderRadius: 99, overflow: "hidden",
                                }}>
                                    <div style={{
                                        width: `${Math.round((dataInit.currentStepOrder / dataInit.totalSteps) * 100)}%`,
                                        height: "100%", background: T.acc, borderRadius: 99,
                                        transition: "width 0.5s ease",
                                    }} />
                                </div>
                                <Text style={{ fontSize: 12, fontWeight: 600, color: T.ink3, fontVariantNumeric: "tabular-nums" }}>
                                    {dataInit.currentStepOrder}/{dataInit.totalSteps}
                                </Text>
                            </div>
                        ) : undefined
                    }
                />

                {dataInit.note && (
                    <div style={{
                        marginTop: 12, padding: "10px 12px",
                        background: T.s1, borderRadius: 8,
                        border: `1px solid ${T.ink6}`,
                    }}>
                        <Text style={{
                            fontSize: 10, color: T.ink5, fontWeight: 700,
                            display: "block", marginBottom: 4, letterSpacing: 0.7,
                        }}>
                            GHI CHÚ
                        </Text>
                        <Text style={{ fontSize: 12.5, color: T.ink3 }}>{dataInit.note}</Text>
                    </div>
                )}
            </Card>

            {/* All steps timeline */}
            {dataInit.allSteps && dataInit.allSteps.length > 0 && (
                <Card>
                    <SectionLabel>Toàn bộ lộ trình</SectionLabel>
                    {dataInit.allSteps.map((step, i) => (
                        <StepNode
                            key={step.stepOrder}
                            step={step}
                            isLast={i === dataInit.allSteps!.length - 1}
                        />
                    ))}
                </Card>
            )}
        </div>
    );
};

// ── Tab: Quá trình công tác ─────────────────────────────────────────
const TabHistory = ({ userId }: { userId?: number }) => {
    const { data: histories = [], isFetching } =
        useEmployeeCareerPathHistoryQuery(userId);

    if (isFetching) return <Skeleton active paragraph={{ rows: 4 }} />;

    if (histories.length === 0) return (
        <div style={{
            textAlign: "center", padding: "40px 0",
            background: T.s1, borderRadius: 10,
            border: `1px dashed ${T.ink6}`,
        }}>
            <HistoryOutlined style={{ fontSize: 28, color: T.ink5, display: "block", marginBottom: 8 }} />
            <Text style={{ fontSize: 13, color: T.ink5 }}>Chưa có quá trình công tác</Text>
        </div>
    );

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {histories.map((h, i) => (
                <div
                    key={h.id ?? i}
                    style={{
                        padding: "12px 14px",
                        background: T.white,
                        border: `1px solid ${T.line}`,
                        borderRadius: 10,
                        transition: "box-shadow 0.2s",
                    }}
                >
                    {/* From → To */}
                    <div style={{
                        display: "flex", alignItems: "center",
                        gap: 6, flexWrap: "wrap", marginBottom: 6,
                    }}>
                        <Text style={{ fontSize: 12.5, fontWeight: 500, color: T.ink3 }}>
                            {h.fromPositionName ?? "—"}
                        </Text>
                        {h.fromPositionCode && (
                            <Badge color={T.ink4} bg={T.s2} border={T.ink6}>
                                {h.fromPositionCode}
                            </Badge>
                        )}

                        <ArrowRightOutlined style={{ fontSize: 11, color: T.acc }} />

                        <Text style={{ fontSize: 12.5, fontWeight: 700, color: T.acc }}>
                            {h.toPositionName ?? "—"}
                        </Text>
                        {h.toPositionCode && (
                            <Badge color={T.acc} bg={T.accSoft} border={T.accBord}>
                                {h.toPositionCode}
                            </Badge>
                        )}
                    </div>

                    {/* Meta */}
                    <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                        {h.promotedAt && (
                            <Badge color={T.ink3} bg={T.s1} border={T.line}>
                                <ClockCircleOutlined style={{ fontSize: 9 }} />
                                {dayjs(h.promotedAt).format("DD/MM/YYYY")}
                            </Badge>
                        )}
                        {h.createdBy && (
                            <Text style={{ fontSize: 11, color: T.ink5 }}>· {h.createdBy}</Text>
                        )}
                    </div>

                    {h.note && (
                        <Text style={{
                            display: "block", fontSize: 11.5, color: T.ink4,
                            marginTop: 6, fontStyle: "italic",
                        }}>
                            "{h.note}"
                        </Text>
                    )}
                </div>
            ))}
        </div>
    );
};

// ── Main ────────────────────────────────────────────────────────────
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
                <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <ProfileOutlined style={{ fontSize: 13 }} /> Lộ trình
                </span>
            ),
            children: dataInit ? <TabInfo dataInit={dataInit} /> : null,
        },
        {
            key: "history",
            label: (
                <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <HistoryOutlined style={{ fontSize: 13 }} /> Quá trình công tác
                </span>
            ),
            children: <TabHistory userId={open && dataInit?.user?.id ? dataInit.user.id : undefined} />,
        },
    ];

    return (
        <Modal
            open={open}
            onCancel={onClose}
            footer={null}
            width={620}
            centered
            destroyOnClose
            styles={{
                content: { padding: 0, borderRadius: 16, overflow: "hidden" },
                body: { padding: 0 },
            }}
        >
            {!dataInit ? null : (
                <div style={{ display: "flex", flexDirection: "column" }}>

                    {/* ── Header ── */}
                    <div style={{
                        padding: "20px 24px 16px",
                        borderBottom: `1px solid ${T.line}`,
                        background: T.white,
                    }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                            <Avatar
                                size={48}
                                style={{
                                    background: avatarColor(dataInit.user?.name),
                                    fontSize: 18, fontWeight: 700, flexShrink: 0,
                                    borderRadius: 14,
                                }}
                            >
                                {dataInit.user?.name?.charAt(0)?.toUpperCase() ?? "?"}
                            </Avatar>

                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                                    <Title level={5} style={{ margin: 0, color: T.ink, fontSize: 15 }}>
                                        {dataInit.user?.name ?? "—"}
                                    </Title>
                                    <div style={{
                                        display: "inline-flex", alignItems: "center", gap: 5,
                                        padding: "3px 9px", borderRadius: 6,
                                        background: st.bg, border: `1px solid ${st.border}`,
                                        fontSize: 11, fontWeight: 600, color: st.color,
                                    }}>
                                        {st.icon}&nbsp;{st.label}
                                    </div>
                                </div>
                                <Text style={{ fontSize: 12, color: T.ink4 }}>
                                    {dataInit.user?.email ?? "—"}
                                </Text>
                            </div>

                            {/* Progress pill */}
                            {dataInit.currentStepOrder && dataInit.totalSteps && (
                                <div style={{
                                    flexShrink: 0, textAlign: "center",
                                    padding: "6px 14px", borderRadius: 10,
                                    background: T.accSoft, border: `1px solid ${T.accBord}`,
                                }}>
                                    <Text style={{ fontSize: 18, fontWeight: 700, color: T.acc, lineHeight: 1 }}>
                                        {dataInit.currentStepOrder}
                                        <Text style={{ fontSize: 12, color: T.acc, fontWeight: 400 }}>
                                            /{dataInit.totalSteps}
                                        </Text>
                                    </Text>
                                    <Text style={{ fontSize: 10, color: T.acc, display: "block", marginTop: 1 }}>
                                        giai đoạn
                                    </Text>
                                </div>
                            )}
                        </div>
                        {/* Overdue banner */}
                        {dataInit.overdue && (
                            <div style={{
                                display: "flex", alignItems: "center", gap: 6,
                                marginTop: 10, padding: "7px 12px",
                                background: T.redSoft, border: `1px solid ${T.redBord}`,
                                borderRadius: 8, fontSize: 12, color: T.red, fontWeight: 500,
                            }}>
                                <WarningOutlined />
                                Nhân viên này đã vượt quá thời gian dự kiến ở vị trí hiện tại
                            </div>
                        )}
                    </div>
                    {/* ── Tabs ── */}
                    <div style={{ padding: "0 24px 20px", background: T.s1, minHeight: 300 }}>
                        <Tabs
                            items={tabItems}
                            size="small"
                            style={{ marginTop: 4 }}
                            tabBarStyle={{ marginBottom: 14 }}
                        />
                    </div>
                    {/* ── Audit footer ── */}
                    <div style={{
                        padding: "10px 24px",
                        borderTop: `1px solid ${T.line}`,
                        background: T.white,
                        display: "flex", justifyContent: "space-between", alignItems: "center",
                        flexWrap: "wrap", gap: 4,
                    }}>
                        <Text style={{ fontSize: 11, color: T.ink5 }}>
                            Tạo bởi{" "}
                            <strong style={{ color: T.ink4 }}>{dataInit.createdBy || "—"}</strong>
                            {dataInit.createdAt && (
                                <span> · {dayjs(dataInit.createdAt).format("DD/MM/YYYY HH:mm")}</span>
                            )}
                        </Text>
                        {dataInit.updatedAt && (
                            <Text style={{ fontSize: 11, color: T.ink5 }}>
                                Cập nhật bởi{" "}
                                <strong style={{ color: T.ink4 }}>{dataInit.updatedBy || "—"}</strong>
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