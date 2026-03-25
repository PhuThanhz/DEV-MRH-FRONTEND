import { Modal } from "antd";
import { useState } from "react";
import type { ICareerPathTemplate, ICareerPathTemplateStep } from "@/types/backend";

interface IProps {
    open: boolean;
    onClose: () => void;
    dataInit?: ICareerPathTemplate | null;
}

// ── Design tokens ─────────────────────────────────────────────────
const T = {
    ink: "#0a0a0b",
    ink2: "#2c2c2e",
    ink3: "#636366",
    ink4: "#aeaeb2",
    ink5: "#d1d1d6",
    white: "#ffffff",
    s1: "#fafafa",
    s2: "#f5f5f7",
    line: "rgba(0,0,0,0.06)",
    lineMed: "rgba(0,0,0,0.10)",
    lineStr: "rgba(0,0,0,0.15)",
    acc: "#0066ff",
    accSoft: "rgba(0,102,255,0.07)",
    accBord: "rgba(0,102,255,0.18)",
    green: "#1a7a3a",
    greenBg: "rgba(26,122,58,0.06)",
    greenBd: "rgba(26,122,58,0.18)",
    red: "#c0392b",
    redBg: "rgba(192,57,43,0.06)",
    redBd: "rgba(192,57,43,0.18)",
};

const STEP_HUE = [
    { dot: "#0066ff", chip: "#0066ff", chipBg: "rgba(0,102,255,0.07)", chipBorder: "rgba(0,102,255,0.18)", stripe: "#0066ff" },
    { dot: "#5856d6", chip: "#5856d6", chipBg: "rgba(88,86,214,0.07)", chipBorder: "rgba(88,86,214,0.18)", stripe: "#5856d6" },
    { dot: "#007aff", chip: "#007aff", chipBg: "rgba(0,122,255,0.07)", chipBorder: "rgba(0,122,255,0.18)", stripe: "#007aff" },
    { dot: "#34aadc", chip: "#34aadc", chipBg: "rgba(52,170,220,0.07)", chipBorder: "rgba(52,170,220,0.18)", stripe: "#34aadc" },
    { dot: "#4cd964", chip: "#1e8c3e", chipBg: "rgba(52,199,89,0.07)", chipBorder: "rgba(52,199,89,0.18)", stripe: "#34c759" },
    { dot: "#ff9500", chip: "#9c5a00", chipBg: "rgba(255,149,0,0.07)", chipBorder: "rgba(255,149,0,0.18)", stripe: "#ff9500" },
    { dot: "#ff6b00", chip: "#ab3d00", chipBg: "rgba(255,107,0,0.07)", chipBorder: "rgba(255,107,0,0.18)", stripe: "#ff6b00" },
    { dot: "#ff3b30", chip: "#c0251b", chipBg: "rgba(255,59,48,0.07)", chipBorder: "rgba(255,59,48,0.18)", stripe: "#ff3b30" },
    { dot: "#af52de", chip: "#7a28b8", chipBg: "rgba(175,82,222,0.07)", chipBorder: "rgba(175,82,222,0.18)", stripe: "#af52de" },
];
const getHue = (i: number) => STEP_HUE[i % STEP_HUE.length];

// ── Connector ─────────────────────────────────────────────────────
const Connector = ({ color }: { color: string }) => (
    <div style={{
        width: 1, height: 8, marginLeft: 22,
        background: `linear-gradient(to bottom, ${color}44, transparent)`,
    }} />
);

// ── StairCard (view-only, no actions) ────────────────────────────
const StairCard = ({
    step,
    index,
    totalRanks,
}: {
    step: ICareerPathTemplateStep;
    index: number;
    totalRanks: number;
}) => {
    const [hov, setHov] = useState(false);
    const h = getHue(index);
    const indent = ((totalRanks - 1 - index) / Math.max(totalRanks - 1, 1)) * 22;
    const isLast = index === totalRanks - 1;

    return (
        <div style={{ display: "flex", alignItems: "stretch", paddingLeft: `${indent}%`, marginBottom: 5 }}>
            <div style={{
                width: 3, flexShrink: 0,
                borderRadius: "3px 0 0 3px",
                background: h.stripe,
                opacity: hov ? 1 : 0.35,
                transition: "opacity 0.15s",
            }} />
            <div
                onMouseEnter={() => setHov(true)}
                onMouseLeave={() => setHov(false)}
                style={{
                    flex: 1, display: "flex", alignItems: "center", gap: 12,
                    padding: "10px 14px",
                    background: hov ? T.s1 : T.white,
                    border: `1px solid ${hov ? T.lineMed : T.line}`,
                    borderLeft: "none",
                    borderRadius: "0 10px 10px 0",
                    transition: "background 0.15s, border-color 0.15s, box-shadow 0.15s",
                    boxShadow: hov
                        ? "0 2px 12px rgba(0,0,0,0.07)"
                        : "0 1px 2px rgba(0,0,0,0.03)",
                    minWidth: 0,
                }}
            >
                <span style={{
                    width: 28, flexShrink: 0,
                    fontSize: 11, fontWeight: 600,
                    color: hov ? T.ink3 : T.ink4,
                    letterSpacing: 0.2, textAlign: "right",
                    fontVariantNumeric: "tabular-nums",
                    transition: "color 0.15s", userSelect: "none",
                }}>
                    {String(step.stepOrder).padStart(2, "0")}
                </span>

                <div style={{
                    width: 7, height: 7, borderRadius: "50%", flexShrink: 0,
                    background: h.dot, opacity: hov ? 1 : 0.55,
                    transition: "opacity 0.15s",
                    boxShadow: hov ? `0 0 0 3px ${h.chipBg}` : "none",
                }} />

                <span style={{
                    flex: 1, fontSize: 13.5,
                    fontWeight: hov ? 600 : 500,
                    color: hov ? T.ink : T.ink2,
                    letterSpacing: -0.2, lineHeight: "18px",
                    transition: "color 0.15s",
                    minWidth: 0,
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                }}>
                    {step.jobTitleName ?? `Bước ${step.stepOrder}`}
                </span>

                {step.description && (
                    <span style={{
                        fontSize: 11.5, color: T.ink4,
                        maxWidth: 200, overflow: "hidden",
                        textOverflow: "ellipsis", whiteSpace: "nowrap",
                        flexShrink: 1,
                    }}>
                        {step.description}
                    </span>
                )}

                {step.durationMonths ? (
                    <div style={{
                        flexShrink: 0, padding: "2px 8px", borderRadius: 5,
                        background: hov ? h.chipBg : T.s2,
                        border: `1px solid ${hov ? h.chipBorder : T.line}`,
                        fontSize: 11, fontWeight: 600,
                        color: hov ? h.chip : T.ink3,
                        transition: "all 0.15s",
                    }}>
                        {step.durationMonths} tháng
                    </div>
                ) : isLast ? (
                    <div style={{
                        flexShrink: 0, padding: "2px 8px", borderRadius: 5,
                        background: hov ? h.chipBg : T.s2,
                        border: `1px solid ${hov ? h.chipBorder : T.line}`,
                        fontSize: 11, fontWeight: 600,
                        color: hov ? h.chip : T.ink3,
                        transition: "all 0.15s",
                    }}>
                        Cấp đỉnh
                    </div>
                ) : null}

                {step.positionLevelCode && (
                    <div style={{
                        flexShrink: 0, padding: "2px 9px", borderRadius: 5,
                        background: hov ? h.chipBg : T.s2,
                        border: `1px solid ${hov ? h.chipBorder : T.line}`,
                        fontSize: 11, fontWeight: 700,
                        color: hov ? h.chip : T.ink3,
                        letterSpacing: 0.5, transition: "all 0.15s",
                        fontVariantNumeric: "tabular-nums",
                    }}>
                        {step.positionLevelCode}
                    </div>
                )}
            </div>
        </div>
    );
};

// ── Full stair ladder (always fully expanded in modal) ────────────
const StairLadderFull = ({ steps }: { steps: ICareerPathTemplateStep[] }) => {
    const sorted = [...steps].sort((a, b) => a.stepOrder - b.stepOrder);
    const totalRanks = sorted.length;

    return (
        <div>
            {/* Header */}
            <div style={{
                display: "flex", alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 14,
            }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ width: 16, height: 1, background: T.lineStr }} />
                    <span style={{
                        fontSize: 10, fontWeight: 600, color: T.ink4,
                        letterSpacing: 0.9, textTransform: "uppercase",
                    }}>
                        Cấp cao nhất
                    </span>
                </div>
                <span style={{ fontSize: 11, color: T.ink5, fontWeight: 500 }}>
                    {sorted.length} bước
                </span>
            </div>

            {sorted.map((step, i) => (
                <div key={step.id ?? step.stepOrder}>
                    <StairCard step={step} index={i} totalRanks={totalRanks} />
                    {i < sorted.length - 1 && <Connector color={getHue(i).dot} />}
                </div>
            ))}

            <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 12 }}>
                <div style={{ width: 16, height: 1, background: T.line }} />
                <span style={{ fontSize: 10, color: T.ink5, fontWeight: 500 }}>
                    Cấp khởi đầu
                </span>
            </div>
        </div>
    );
};

// ── Collapsible section ───────────────────────────────────────────
const Section = ({
    title,
    accentColor,
    defaultOpen = true,
    children,
    badge,
}: {
    title: string;
    accentColor: string;
    defaultOpen?: boolean;
    children: React.ReactNode;
    badge?: React.ReactNode;
}) => {
    const [open, setOpen] = useState(defaultOpen);

    return (
        <div style={{
            border: `1px solid ${open ? T.lineMed : T.line}`,
            borderRadius: 12, overflow: "hidden",
            transition: "border-color 0.15s",
        }}>
            <div
                onClick={() => setOpen(!open)}
                style={{
                    display: "flex", alignItems: "center", gap: 10,
                    padding: "12px 16px",
                    cursor: "pointer",
                    background: open ? T.s1 : T.white,
                    borderBottom: open ? `1px solid ${T.line}` : "none",
                    transition: "background 0.15s",
                    userSelect: "none",
                }}
            >
                <div style={{
                    width: 7, height: 7, borderRadius: "50%",
                    background: accentColor,
                    opacity: open ? 1 : 0.4,
                    transition: "opacity 0.15s", flexShrink: 0,
                }} />
                <span style={{
                    flex: 1, fontSize: 13, fontWeight: 600,
                    color: open ? T.ink : T.ink3,
                    letterSpacing: -0.1, transition: "color 0.15s",
                }}>
                    {title}
                </span>
                {badge}
                <svg
                    width="14" height="14" viewBox="0 0 14 14" fill="none"
                    style={{
                        flexShrink: 0,
                        transform: open ? "rotate(180deg)" : "rotate(0deg)",
                        transition: "transform 0.2s cubic-bezier(.4,0,.2,1)",
                        color: T.ink4,
                    }}
                >
                    <path d="M3 5.5L7 9L11 5.5" stroke="currentColor"
                        strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                </svg>
            </div>
            {open && (
                <div style={{ padding: "16px", background: T.white }}>
                    {children}
                </div>
            )}
        </div>
    );
};

// ── Info row ──────────────────────────────────────────────────────
const InfoRow = ({ label, value }: { label: string; value?: React.ReactNode }) => (
    <div style={{
        display: "grid", gridTemplateColumns: "160px 1fr", gap: 12,
        alignItems: "flex-start", padding: "9px 0",
        borderBottom: `1px solid ${T.line}`,
    }}>
        <span style={{ fontSize: 12.5, color: T.ink4, fontWeight: 500, paddingTop: 1 }}>
            {label}
        </span>
        <span style={{ fontSize: 13, color: value ? T.ink2 : T.ink5, lineHeight: "20px" }}>
            {value || "—"}
        </span>
    </div>
);

// ── Main component ────────────────────────────────────────────────
const ViewCareerPathTemplate = ({ open, onClose, dataInit }: IProps) => {
    if (!dataInit) return null;

    const sortedSteps = [...(dataInit.steps ?? [])].sort((a, b) => a.stepOrder - b.stepOrder);
    const isActive = dataInit.active;

    return (
        <Modal
            title={null}
            open={open}
            onCancel={onClose}
            footer={null}
            width={700}
            destroyOnClose
            styles={{
                content: { padding: 0, borderRadius: 16, overflow: "hidden" },
                mask: { backdropFilter: "blur(2px)" },
            }}
        >
            {/* ── Modal header ── */}
            <div style={{
                padding: "20px 24px 16px",
                borderBottom: `1px solid ${T.line}`,
                background: T.white,
                display: "flex", alignItems: "flex-start",
                justifyContent: "space-between", gap: 12,
            }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                        display: "flex", alignItems: "center",
                        gap: 8, flexWrap: "wrap", marginBottom: 4,
                    }}>
                        <span style={{
                            fontSize: 18, fontWeight: 700,
                            color: T.ink, letterSpacing: -0.4, lineHeight: "24px",
                        }}>
                            {dataInit.name}
                        </span>
                        {isActive ? (
                            <span style={{
                                padding: "2px 8px", borderRadius: 20,
                                fontSize: 11, fontWeight: 600,
                                background: T.greenBg, border: `1px solid ${T.greenBd}`,
                                color: T.green,
                            }}>
                                Đang hoạt động
                            </span>
                        ) : (
                            <span style={{
                                padding: "2px 8px", borderRadius: 20,
                                fontSize: 11, fontWeight: 600,
                                background: T.redBg, border: `1px solid ${T.redBd}`,
                                color: T.red,
                            }}>
                                Tạm tắt
                            </span>
                        )}
                    </div>
                    {dataInit.description && (
                        <span style={{ fontSize: 13, color: T.ink4, lineHeight: "18px" }}>
                            {dataInit.description}
                        </span>
                    )}
                </div>
                <button
                    onClick={onClose}
                    style={{
                        width: 30, height: 30, borderRadius: 8,
                        border: `1px solid ${T.line}`,
                        background: T.s2, cursor: "pointer",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        flexShrink: 0, color: T.ink4,
                        fontSize: 18, fontWeight: 300, lineHeight: 1,
                    }}
                >
                    ×
                </button>
            </div>

            {/* ── Scrollable body ── */}
            <div style={{
                maxHeight: "calc(80vh - 110px)",
                overflowY: "auto",
                padding: "16px 24px 24px",
                background: T.s2,
                display: "flex", flexDirection: "column", gap: 10,
            }}>

                {/* 1. Thông tin chung */}
                <Section title="Thông tin chung" accentColor={T.acc} defaultOpen={true}>
                    <InfoRow label="Tên lộ trình" value={dataInit.name} />
                    <InfoRow label="Mô tả" value={dataInit.description} />
                    <InfoRow
                        label="Trạng thái"
                        value={
                            isActive ? (
                                <span style={{
                                    padding: "2px 8px", borderRadius: 20,
                                    fontSize: 11, fontWeight: 600,
                                    background: T.greenBg, border: `1px solid ${T.greenBd}`,
                                    color: T.green,
                                }}>Đang hoạt động</span>
                            ) : (
                                <span style={{
                                    padding: "2px 8px", borderRadius: 20,
                                    fontSize: 11, fontWeight: 600,
                                    background: T.redBg, border: `1px solid ${T.redBd}`,
                                    color: T.red,
                                }}>Tạm tắt</span>
                            )
                        }
                    />
                    {dataInit.createdBy && (
                        <InfoRow label="Tạo bởi" value={dataInit.createdBy} />
                    )}
                    {dataInit.updatedAt && (
                        <InfoRow
                            label="Cập nhật lần cuối"
                            value={new Date(dataInit.updatedAt).toLocaleDateString("vi-VN")}
                        />
                    )}
                </Section>

                {/* 2. Lộ trình bậc thang */}
                <Section
                    title="Lộ trình thăng tiến"
                    accentColor="#5856d6"
                    defaultOpen={true}
                    badge={
                        <span style={{
                            padding: "2px 8px", borderRadius: 5,
                            fontSize: 11, fontWeight: 600,
                            background: T.accSoft,
                            border: `1px solid ${T.accBord}`,
                            color: T.acc,
                        }}>
                            {sortedSteps.length} bước
                        </span>
                    }
                >
                    {sortedSteps.length > 0 ? (
                        <StairLadderFull steps={sortedSteps} />
                    ) : (
                        <div style={{
                            padding: "32px 0", textAlign: "center",
                            color: T.ink5, fontSize: 13,
                        }}>
                            Chưa có bước nào được định nghĩa
                        </div>
                    )}
                </Section>

            </div>
        </Modal>
    );
};

export default ViewCareerPathTemplate;