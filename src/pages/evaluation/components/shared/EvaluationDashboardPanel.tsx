import {
    ClockCircleOutlined,
    SyncOutlined,
    CheckCircleOutlined,
    TrophyOutlined,
    RedoOutlined,
    TeamOutlined,
} from "@ant-design/icons";
import { useManagerDashboardQuery, useApproverDashboardQuery } from "@/hooks/useEvaluations";

interface KpiItem {
    label: string;
    value: number;
    color: string;
    bg: string;
    icon: React.ReactNode;
}

const GRADE_CONFIG: Record<string, { color: string; bg: string; label: string }> = {
    A: { color: "#389e0d", bg: "#f6ffed", label: "Xuất sắc" },
    B: { color: "#1677ff", bg: "#e6f4ff", label: "Tốt" },
    C: { color: "#d46b08", bg: "#fff7e6", label: "Khá" },
    D: { color: "#cf1322", bg: "#fff1f0", label: "Trung bình" },
    E: { color: "#8c8c8c", bg: "#f5f5f5", label: "Yếu" },
};

const KpiCards = ({ items }: { items: KpiItem[] }) => (
    <div style={{ display: "flex", gap: 16, marginBottom: 20, flexWrap: "wrap" }}>
        {items.map(item => (
            <div
                key={item.label}
                style={{
                    flex: 1, minWidth: 150,
                    background: "#ffffff",
                    border: "1px solid #e2e8f0",
                    borderRadius: 8,
                    padding: "16px 20px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                }}
            >
                <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#64748b" }}>{item.label}</div>
                    <div style={{ fontSize: 28, fontWeight: 700, color: "#0f172a", marginTop: 4 }}>{item.value}</div>
                </div>
                <div style={{ background: item.bg, padding: "10px", borderRadius: "8px", display: "flex" }}>
                    {item.icon}
                </div>
            </div>
        ))}
    </div>
);

export const ManagerDashboardPanel = ({ periodId }: { periodId?: number }) => {
    const { data, isLoading } = useManagerDashboardQuery(periodId);
    if (isLoading || !data) return null;

    const items: KpiItem[] = [
        { label: "Tổng nhân viên", value: data.totalEmployees, color: "#0f172a", bg: "#f1f5f9", icon: <TeamOutlined style={{ fontSize: 20, color: "#475569" }} /> },
        { label: "Chưa bắt đầu", value: data.notStartedCount, color: "#8c8c8c", bg: "#f5f5f5", icon: <ClockCircleOutlined style={{ fontSize: 20, color: "#8c8c8c" }} /> },
        { label: "Chờ chấm", value: data.pendingReviewCount, color: "#1677ff", bg: "#e6f4ff", icon: <SyncOutlined style={{ fontSize: 20, color: "#1677ff" }} /> },
        { label: "Đã gửi duyệt", value: data.reviewedCount, color: "#13c2c2", bg: "#e6fffb", icon: <ClockCircleOutlined style={{ fontSize: 20, color: "#13c2c2" }} /> },
        { label: "Hoàn tất", value: data.approvedCount, color: "#389e0d", bg: "#f6ffed", icon: <CheckCircleOutlined style={{ fontSize: 20, color: "#389e0d" }} /> },
        { label: "Cần sửa lại", value: data.revisionNeededCount, color: "#cf1322", bg: "#fff1f0", icon: <RedoOutlined style={{ fontSize: 20, color: "#cf1322" }} /> },
    ];

    return <KpiCards items={items} />;
};

export const ApproverDashboardPanel = ({ periodId }: { periodId?: number }) => {
    const { data, isLoading } = useApproverDashboardQuery(periodId);
    if (isLoading || !data) return null;

    const items: KpiItem[] = [
        { label: "Tổng nhân viên", value: data.totalEmployees, color: "#0f172a", bg: "#f1f5f9", icon: <TeamOutlined style={{ fontSize: 20, color: "#475569" }} /> },
        { label: "Chờ phê duyệt", value: data.pendingApprovalCount, color: "#13c2c2", bg: "#e6fffb", icon: <ClockCircleOutlined style={{ fontSize: 20, color: "#13c2c2" }} /> },
        { label: "Đã hoàn tất", value: data.completedCount, color: "#389e0d", bg: "#f6ffed", icon: <CheckCircleOutlined style={{ fontSize: 20, color: "#389e0d" }} /> },
        { label: "Đã trả lại", value: data.revisionNeededCount, color: "#cf1322", bg: "#fff1f0", icon: <RedoOutlined style={{ fontSize: 20, color: "#cf1322" }} /> },
    ];

    const grades = Object.entries(data.gradeDistribution || {});

    return (
        <>
            <KpiCards items={items} />
            {grades.length > 0 && (
                <div style={{
                    background: "#fff", border: "1px solid #e2e8f0", borderRadius: 8,
                    padding: "16px 20px", marginBottom: 20,
                }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                        <TrophyOutlined style={{ color: "#d48806" }} />
                        <span style={{ fontSize: 14, fontWeight: 600, color: "#0f172a" }}>Phân bổ xếp loại (đã hoàn tất)</span>
                    </div>
                    <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                        {grades.map(([grade, count]) => {
                            const cfg = GRADE_CONFIG[grade] ?? { color: "#8c8c8c", bg: "#f5f5f5", label: grade };
                            return (
                                <div key={grade} style={{
                                    display: "flex", alignItems: "center", gap: 10,
                                    background: cfg.bg, border: `1px solid ${cfg.color}33`,
                                    borderRadius: 8, padding: "10px 16px", minWidth: 120,
                                }}>
                                    <span style={{
                                        display: "inline-flex", alignItems: "center", justifyContent: "center",
                                        width: 32, height: 32, borderRadius: "50%",
                                        background: "#fff", border: `2px solid ${cfg.color}`,
                                        color: cfg.color, fontWeight: 800, fontSize: 15,
                                    }}>{grade}</span>
                                    <div>
                                        <div style={{ fontSize: 20, fontWeight: 700, color: "#0f172a" }}>{count}</div>
                                        <div style={{ fontSize: 11, color: "#64748b" }}>{cfg.label}</div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </>
    );
};
