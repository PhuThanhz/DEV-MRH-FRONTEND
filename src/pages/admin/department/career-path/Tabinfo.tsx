import { Typography } from "antd";
import {
    CheckOutlined,
    WarningOutlined,
    RightOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";

import type { IEmployeeCareerPath, IEmployeeCareerPathStepProgress } from "@/types/backend";
import { T, Badge, Card, SectionLabel } from "./ModalEmployeeDetail";

const { Text } = Typography;

// ── Info row ─────────────────────────────────────────────────────────
const InfoRow = ({
    label, value, noBorder,
}: { label: string; value?: React.ReactNode; noBorder?: boolean }) => (
    <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        padding: "9px 0",
        borderBottom: noBorder ? "none" : `1px solid ${T.line}`,
        gap: 12,
    }}>
        <Text style={{
            fontSize: 12, color: T.ink4, fontWeight: 500,
            flexShrink: 0, width: 152,
            lineHeight: 1.4,
        }}>
            {label}
        </Text>
        <div style={{ flex: 1, textAlign: "right", minWidth: 0 }}>
            {typeof value === "string" || typeof value === "number"
                ? <Text style={{ fontSize: 13, color: T.ink2, fontWeight: 500 }}>{value || "—"}</Text>
                : value ?? <Text style={{ fontSize: 13, color: T.ink5 }}>—</Text>
            }
        </div>
    </div>
);

// ── Timeline step node ────────────────────────────────────────────────
const StepNode = ({
    step, isLast,
}: { step: IEmployeeCareerPathStepProgress; isLast: boolean }) => {
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
                    transition: "all 0.2s",
                    boxShadow: isCurrent ? `0 0 0 4px ${T.accSoft}` : "none",
                }}>
                    {isCompleted
                        ? <CheckOutlined style={{ fontSize: 11, color: T.slate }} />
                        : isCurrent
                            ? <div style={{ width: 8, height: 8, borderRadius: "50%", background: T.acc }} />
                            : <div style={{ width: 5, height: 5, borderRadius: "50%", background: T.ink6 }} />
                    }
                </div>
                {!isLast && (
                    <div style={{
                        width: 2, flex: 1, marginTop: 5,
                        background: isCompleted
                            ? `linear-gradient(to bottom, ${T.slateBord}, ${T.ink6})`
                            : T.line,
                        borderRadius: 2,
                    }} />
                )}
            </div>

            {/* Content */}
            <div style={{
                flex: 1, paddingBottom: isLast ? 0 : 16, paddingTop: 3,
                opacity: isPending ? 0.5 : 1,
            }}>
                <div style={{
                    display: "flex", alignItems: "center",
                    gap: 6, flexWrap: "wrap", marginBottom: 3,
                }}>
                    <Text style={{
                        fontSize: 10, fontWeight: 700, color: dotColor,
                        letterSpacing: 0.6, textTransform: "uppercase",
                    }}>
                        Vị trí {step.stepOrder}
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
                        <Badge color={T.green} bg={T.greenSoft} border={T.greenBord}>
                            ✓ Đã bổ nhiệm
                        </Badge>
                    )}
                </div>

                <Text style={{
                    fontSize: 13,
                    fontWeight: isCurrent ? 600 : isCompleted ? 500 : 400,
                    color: isCurrent ? T.ink : isCompleted ? T.ink2 : T.ink5,
                    display: "block", lineHeight: 1.4, marginBottom: 4,
                }}>
                    {step.jobTitleName ?? "—"}
                </Text>

                <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                    {step.durationMonths && (
                        <Text style={{ fontSize: 11, color: T.ink5 }}>
                            Dự kiến: <strong style={{ color: T.ink4 }}>{step.durationMonths} tháng</strong>
                        </Text>
                    )}
                    {isCompleted && step.promotedAt && (
                        <Text style={{ fontSize: 11, color: T.ink4 }}>
                            Bổ nhiệm: {dayjs(step.promotedAt).format("DD/MM/YYYY")}
                        </Text>
                    )}
                    {isCompleted && step.actualMonths != null && (
                        <Text style={{ fontSize: 11, color: T.ink5 }}>
                            Thực tế: {step.actualMonths} tháng
                        </Text>
                    )}
                </div>
            </div>
        </div>
    );
};

// ── Progress Bar ──────────────────────────────────────────────────────
const ProgressBar = ({ current, total }: { current: number; total: number }) => {
    const pct = Math.round((current / total) * 100);
    return (
        <div style={{ display: "flex", alignItems: "center", gap: 10, justifyContent: "flex-end" }}>
            <div style={{
                width: 96, height: 6, background: T.s2,
                borderRadius: 99, overflow: "hidden",
            }}>
                <div style={{
                    width: `${pct}%`, height: "100%",
                    background: `linear-gradient(90deg, ${T.acc}, ${T.violet})`,
                    borderRadius: 99,
                    transition: "width 0.6s cubic-bezier(.4,0,.2,1)",
                }} />
            </div>
            <Text style={{
                fontSize: 12, fontWeight: 700, color: T.ink3,
                fontVariantNumeric: "tabular-nums", minWidth: 36, textAlign: "right",
            }}>
                {current}/{total}
            </Text>
        </div>
    );
};

// ── Tab Info — 2 cột ─────────────────────────────────────────────────
export const TabInfo = ({ dataInit }: { dataInit: IEmployeeCareerPath }) => {
    const expectedDate = dataInit.stepStartedAt && dataInit.durationMonths
        ? dayjs(dataInit.stepStartedAt).add(dataInit.durationMonths, "month")
        : null;

    return (
        <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>

            {/* ── Cột trái: thông tin ── */}
            <div style={{ flex: "0 0 348px", display: "flex", flexDirection: "column", gap: 12 }}>
                {/* Card: Lộ trình & vị trí */}
                <Card>
                    <SectionLabel>Lộ trình & vị trí</SectionLabel>

                    <InfoRow
                        label="Tên lộ trình"
                        value={
                            <Text style={{ fontSize: 13, fontWeight: 700, color: T.acc }}>
                                {dataInit.template?.name ?? "—"}
                            </Text>
                        }
                    />
                    <InfoRow
                        label="Vị trí hiện tại"
                        value={
                            dataInit.currentStep ? (
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
                            ) : undefined
                        }
                    />
                    <InfoRow
                        label="Vị trí kế tiếp"
                        value={
                            dataInit.nextStep ? (
                                <div style={{ display: "flex", alignItems: "center", gap: 6, justifyContent: "flex-end" }}>
                                    <RightOutlined style={{ fontSize: 10, color: T.ink5 }} />
                                    <Text style={{ fontSize: 13, color: T.ink2, fontWeight: 500 }}>
                                        {dataInit.nextStep.jobTitleName}
                                    </Text>
                                    {dataInit.nextStep.positionLevelCode && (
                                        <Badge color={T.violet} bg={T.violetSoft} border={T.violetBord}>
                                            {dataInit.nextStep.positionLevelCode}
                                        </Badge>
                                    )}
                                </div>
                            ) : undefined
                        }
                    />
                    <InfoRow
                        label="Tiến độ lộ trình"
                        value={
                            dataInit.currentStepOrder && dataInit.totalSteps ? (
                                <ProgressBar
                                    current={dataInit.currentStepOrder}
                                    total={dataInit.totalSteps}
                                />
                            ) : undefined
                        }
                    />
                </Card>

                {/* Card: Thời gian */}
                <Card>
                    <SectionLabel>Thời gian</SectionLabel>

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
                                <div style={{ display: "flex", alignItems: "center", gap: 7, justifyContent: "flex-end" }}>
                                    <Text style={{
                                        fontSize: 13, fontWeight: 600,
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
                        noBorder
                        value={
                            expectedDate ? (
                                <div style={{ display: "flex", alignItems: "center", gap: 6, justifyContent: "flex-end" }}>
                                    <Text style={{
                                        fontSize: 13, fontWeight: 500,
                                        color: dataInit.overdue ? T.red : T.ink2,
                                    }}>
                                        {expectedDate.format("DD/MM/YYYY")}
                                    </Text>
                                    {dataInit.overdue && (
                                        <WarningOutlined style={{ fontSize: 13, color: T.red }} />
                                    )}
                                </div>
                            ) : undefined
                        }
                    />
                </Card>

                {/* Note */}
                {dataInit.note && (
                    <div style={{
                        padding: "12px 14px",
                        background: `linear-gradient(135deg, ${T.s1}, ${T.s2})`,
                        borderRadius: 12,
                        border: `1px solid ${T.ink6}`,
                    }}>
                        <Text style={{
                            fontSize: 10, color: T.ink5, fontWeight: 700,
                            display: "block", marginBottom: 5, letterSpacing: 0.9, textTransform: "uppercase",
                        }}>
                            Ghi chú
                        </Text>
                        <Text style={{ fontSize: 12.5, color: T.ink3, lineHeight: 1.6 }}>
                            {dataInit.note}
                        </Text>
                    </div>
                )}
            </div>

            {/* ── Cột phải: timeline ── */}
            <div style={{ flex: 1, minWidth: 0 }}>
                {dataInit.allSteps && dataInit.allSteps.length > 0 && (
                    <Card style={{
                        maxHeight: 500,
                        overflowY: "auto",
                        scrollbarWidth: "thin",
                        scrollbarColor: `${T.ink6} transparent`,
                    }}>
                        <SectionLabel>Toàn bộ lộ trình</SectionLabel>
                        {[...dataInit.allSteps].reverse().map((step, i) => (
                            <StepNode
                                key={step.stepOrder}
                                step={step}
                                isLast={i === dataInit.allSteps!.length - 1}
                            />
                        ))}
                    </Card>
                )}
            </div>
        </div>
    );
};