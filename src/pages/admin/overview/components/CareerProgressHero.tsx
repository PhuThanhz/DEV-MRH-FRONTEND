import React from "react";
import { RightOutlined, CheckOutlined, ClockCircleOutlined, WarningOutlined, RocketOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import type { IEmployeeCareerPath, IEmployeeCareerPathStepProgress } from "@/types/backend";

const PINK = "#ec4899";
const PINK_DEEP = "#be185d";

const wrapStyle: React.CSSProperties = {
    background: "#fff",
    borderRadius: 20,
    border: "1px solid #f0e6ec",
    boxShadow: "0 8px 32px rgba(236,72,153,0.06)",
    padding: "clamp(18px, 3vw, 28px)",
    boxSizing: "border-box",
};

const headerRowStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: 12,
    marginBottom: 20,
    flexWrap: "wrap",
};

const titleStyle: React.CSSProperties = {
    margin: 0,
    fontSize: 18,
    fontWeight: 800,
    color: "#111827",
    display: "flex",
    alignItems: "center",
    gap: 10,
};

const progressMetaStyle: React.CSSProperties = {
    marginLeft: "auto",
    display: "flex",
    alignItems: "center",
    gap: 10,
    flexWrap: "wrap",
};

const chipBase: React.CSSProperties = {
    fontSize: 12,
    fontWeight: 700,
    padding: "4px 10px",
    borderRadius: 999,
    whiteSpace: "nowrap",
};

const railStyle: React.CSSProperties = {
    display: "flex",
    gap: 0,
    overflowX: "auto",
    paddingBottom: 8,
};

const STATUS = {
    COMPLETED: { dot: "#22c55e", ring: "rgba(34,197,94,0.15)", label: "Đã qua", text: "#15803d" },
    CURRENT: { dot: PINK, ring: "rgba(236,72,153,0.15)", label: "Hiện tại", text: PINK_DEEP },
    UPCOMING: { dot: "#cbd5e1", ring: "rgba(148,163,184,0.12)", label: "Sắp tới", text: "#64748b" },
} as const;

const emptyWrapStyle: React.CSSProperties = {
    ...wrapStyle,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    textAlign: "center",
    gap: 12,
    padding: "40px 24px",
};

interface Props {
    data?: IEmployeeCareerPath | null;
    isLoading?: boolean;
    isError?: boolean;
    departmentId?: number;
}

const StepNode = React.memo(({ step, isLast }: { step: IEmployeeCareerPathStepProgress; isLast: boolean }) => {
    const st = STATUS[step.stepStatus] ?? STATUS.UPCOMING;
    return (
        <div style={{ display: "flex", alignItems: "flex-start", minWidth: 150, flex: "0 0 auto" }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 150 }}>
                <div
                    style={{
                        width: 34,
                        height: 34,
                        borderRadius: "50%",
                        background: st.dot,
                        boxShadow: `0 0 0 5px ${st.ring}`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#fff",
                        fontSize: 14,
                        fontWeight: 800,
                    }}
                >
                    {step.stepStatus === "COMPLETED" ? <CheckOutlined /> : step.stepOrder}
                </div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#1f2937", marginTop: 12, textAlign: "center", padding: "0 8px", lineBreak: "anywhere" }}>
                    {step.jobTitleName}
                </div>
                <span style={{ ...chipBase, color: st.text, background: st.ring, marginTop: 6 }}>{st.label}</span>
            </div>
            {!isLast && (
                <div style={{ flex: 1, height: 2, background: "#e2e8f0", marginTop: 16, minWidth: 40 }} />
            )}
        </div>
    );
});

const CareerProgressHero = ({ data, isLoading, isError, departmentId }: Props) => {
    const navigate = useNavigate();

    if (isLoading) {
        return (
            <div style={emptyWrapStyle}>
                <div style={{ fontSize: 14, color: "#9ca3af" }}>Đang tải lộ trình thăng tiến...</div>
            </div>
        );
    }

    if (isError || !data || !data.allSteps || data.allSteps.length === 0) {
        return (
            <div style={emptyWrapStyle}>
                <div
                    style={{
                        width: 56,
                        height: 56,
                        borderRadius: "50%",
                        background: "rgba(236,72,153,0.08)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: PINK,
                        fontSize: 24,
                    }}
                >
                    <RocketOutlined />
                </div>
                <div style={{ fontSize: 15, fontWeight: 700, color: "#374151" }}>Chưa có lộ trình thăng tiến</div>
                <div style={{ fontSize: 13, color: "#9ca3af", maxWidth: 360 }}>
                    Bạn chưa được gán lộ trình thăng tiến. Liên hệ quản lý hoặc phòng nhân sự để được thiết lập.
                </div>
                {departmentId && (
                    <button
                        onClick={() => navigate(`/admin/departments/${departmentId}/career-paths`)}
                        style={{
                            marginTop: 4,
                            border: "1px solid " + PINK,
                            background: "#fff",
                            color: PINK_DEEP,
                            fontWeight: 700,
                            fontSize: 13,
                            padding: "8px 16px",
                            borderRadius: 10,
                            cursor: "pointer",
                        }}
                    >
                        Xem lộ trình của phòng
                    </button>
                )}
            </div>
        );
    }

    const steps = data.allSteps;
    const cur = data.currentStepOrder ?? 0;
    const total = data.totalSteps ?? steps.length;

    return (
        <div style={wrapStyle}>
            <div style={headerRowStyle}>
                <h3 style={titleStyle}>
                    <RocketOutlined style={{ color: PINK }} />
                    Lộ trình thăng tiến của tôi
                </h3>
                <div style={progressMetaStyle}>
                    {data.overdue && (
                        <span style={{ ...chipBase, color: "#b91c1c", background: "rgba(239,68,68,0.10)", display: "inline-flex", alignItems: "center", gap: 5 }}>
                            <WarningOutlined /> Quá hạn dự kiến
                        </span>
                    )}
                    {data.progressStatusLabel && (
                        <span style={{ ...chipBase, color: PINK_DEEP, background: "rgba(236,72,153,0.10)" }}>
                            {data.progressStatusLabel}
                        </span>
                    )}
                    <span style={{ ...chipBase, color: "#334155", background: "#f1f5f9" }}>
                        Bậc {cur}/{total}
                    </span>
                </div>
            </div>

            <div style={railStyle}>
                {steps.map((s, i) => (
                    <StepNode key={s.careerPathId ?? i} step={s} isLast={i === steps.length - 1} />
                ))}
            </div>

            {(data.currentStep || data.nextStep) && (
                <div
                    style={{
                        marginTop: 18,
                        paddingTop: 16,
                        borderTop: "1px dashed #f0e6ec",
                        display: "flex",
                        alignItems: "center",
                        gap: 16,
                        flexWrap: "wrap",
                    }}
                >
                    {data.currentStep && (
                        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                            <span style={{ fontSize: 11, color: "#9ca3af", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.4 }}>
                                Đang ở
                            </span>
                            <span style={{ fontSize: 14, fontWeight: 700, color: PINK_DEEP }}>
                                {data.currentStep.jobTitleName}
                            </span>
                            {typeof data.daysInCurrentStep === "number" && (
                                <span style={{ fontSize: 12, color: "#9ca3af" }}>{data.daysInCurrentStep} ngày ở bậc này</span>
                            )}
                        </div>
                    )}

                    {data.nextStep && (
                        <>
                            <RightOutlined style={{ color: "#d1d5db" }} />
                            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                                <span style={{ fontSize: 11, color: "#9ca3af", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.4 }}>
                                    Bậc tiếp theo
                                </span>
                                <span style={{ fontSize: 14, fontWeight: 700, color: "#1f2937" }}>
                                    {data.nextStep.jobTitleName}
                                </span>
                                {data.nextStep.durationMonths && (
                                    <span style={{ fontSize: 12, color: "#64748b", display: "inline-flex", alignItems: "center", gap: 4 }}>
                                        <ClockCircleOutlined /> Thời gian dự kiến: {data.nextStep.durationMonths} tháng
                                    </span>
                                )}
                            </div>
                        </>
                    )}
                </div>
            )}
        </div>
    );
};

export default CareerProgressHero;
