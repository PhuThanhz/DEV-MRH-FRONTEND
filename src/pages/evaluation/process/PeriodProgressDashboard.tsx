import React, { useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
    Table,
    Button,
    Progress,
    Alert,
    Empty,
    Spin,
} from "antd";
import {
    ArrowLeftOutlined,
    WarningOutlined,
    CheckCircleOutlined,
    ClockCircleOutlined,
    UserOutlined,
    FileTextOutlined,
    TeamOutlined,
    BarChartOutlined,
} from "@ant-design/icons";
import PageContainer from "@/components/common/data-table/PageContainer";
import { usePeriodProgressQuery } from "@/hooks/useEvaluations";
import { callFetchEvaluationGradeDistribution, callFetchEvaluationPeriodById } from "@/config/api";
import dayjs from "dayjs";



interface PeriodProgressDashboardProps {
    periodIdOverride?: number;
    onClose?: () => void;
}

const PeriodProgressDashboard: React.FC<PeriodProgressDashboardProps> = ({ periodIdOverride, onClose }) => {
    const { periodId: routePeriodId } = useParams<{ periodId: string }>();
    const navigate = useNavigate();
    const periodId = periodIdOverride ?? Number(routePeriodId);

    const { data: period, isLoading: isPeriodLoading } = useQuery({
        queryKey: ["evaluation-period", periodId],
        queryFn: async () => {
            if (!periodId) return null;
            const res = await callFetchEvaluationPeriodById(periodId);
            return res?.data || null;
        },
        enabled: !!periodId
    });

    const { data: progressData, isLoading: isProgressLoading, error } = usePeriodProgressQuery(periodId);

    const { data: gradeDistribution = [], isLoading: isGradeLoading } = useQuery({
        queryKey: ["evaluation-grade-distribution", periodId],
        queryFn: async () => {
            if (!periodId) return [];
            const res = await callFetchEvaluationGradeDistribution(periodId);
            return res?.data || [];
        },
        enabled: !!periodId,
    });

    const isLoading = isPeriodLoading || isProgressLoading;

    const getRecordDetailPath = (recordId: number, status: string) => {
        if (status === "EMPLOYEE_DRAFTING" || status === "REVISION_NEEDED") {
            return `/admin/evaluation/my-records/${recordId}?readonly=true&from=progress`;
        }
        if (status === "PENDING_MANAGER_REVIEW" || status === "MANAGER_REVIEWING") {
            return `/admin/evaluation/manager/records/${recordId}`;
        }
        if (status === "PENDING_APPROVAL") {
            return `/admin/evaluation/approval/records/${recordId}`;
        }
        return `/admin/evaluation/my-records/${recordId}?readonly=true&from=progress`;
    };

    const kpi = progressData?.kpiProgress;
    const activeRecordCount = Math.max(0, (kpi?.totalRecords ?? 0) - (kpi?.cancelledCount ?? 0));
    const inProgressCount = (kpi?.draftingCount ?? 0) + (kpi?.pendingManagerCount ?? 0) + (kpi?.pendingApprovalCount ?? 0);
    const selfReviewCompleted = Math.max(0, activeRecordCount - (kpi?.draftingCount ?? 0));
    const managerReviewCompleted = (kpi?.completedCount ?? 0) + (kpi?.pendingApprovalCount ?? 0);
    const managerReviewEligible = Math.max(0, activeRecordCount - (kpi?.draftingCount ?? 0));
    const approvalEligible = (kpi?.completedCount ?? 0) + (kpi?.pendingApprovalCount ?? 0);
    const overallCompletion = activeRecordCount > 0 ? Math.round(((kpi?.completedCount ?? 0) / activeRecordCount) * 100) : 0;

    const statusRows = kpi ? [
        { label: "Nhân viên đang tự đánh giá", value: kpi.draftingCount, color: "#1F6C9F", bg: "#E1F3FE" },
        { label: "Chờ quản lý chấm", value: kpi.pendingManagerCount, color: "#6B46C1", bg: "#EDE9FE" },
        { label: "Chờ chấm & duyệt cuối", value: kpi.pendingApprovalCount, color: "#1F6C9F", bg: "#E1F3FE" },
        { label: "Đã hoàn thành", value: kpi.completedCount, color: "#346538", bg: "#EDF3EC" },
        { label: "Đã hủy", value: kpi.cancelledCount, color: "#6B7280", bg: "#F3F4F6" },
    ].filter(item => item.value > 0) : [];

    const phaseRows = kpi ? [
        { label: "Nhân viên tự đánh giá", caption: "Hoàn thành phần tự đánh giá", done: selfReviewCompleted, total: activeRecordCount },
        { label: "Quản lý chấm điểm", caption: "Hoàn thành phần quản lý chấm điểm", done: managerReviewCompleted, total: managerReviewEligible },
        { label: "Chấm & duyệt cuối", caption: "Hoàn thành bước chấm và duyệt cuối", done: kpi.completedCount, total: approvalEligible },
    ] : [];

    const departmentWatchList = useMemo(() => {
        const departments = progressData?.departmentProgress || [];
        return departments
            .map(dept => {
                const active = Math.max(0, dept.totalRecords - dept.cancelledCount);
                const completion = active ? Math.round((dept.completedCount / active) * 100) : 0;
                const stuck = dept.draftingCount + dept.pendingManagerCount + dept.pendingApprovalCount;
                return { ...dept, active, completion, stuck };
            })
            .filter(dept => dept.overdueCount > 0 || (dept.active > 0 && dept.completion < 80))
            .sort((a, b) => b.overdueCount - a.overdueCount || a.completion - b.completion)
            .slice(0, 5);
    }, [progressData?.departmentProgress]);

    const normalizedGradeDistribution = useMemo(() => {
        const gradeOrder = ["A", "B", "C", "D", "E"];
        const counts = new Map<string, number>();
        gradeDistribution.forEach(row => {
            const grade = row?.[0] || "Chưa xếp loại";
            counts.set(grade, Number(row?.[1] || 0));
        });
        return gradeOrder
            .filter(grade => counts.has(grade))
            .map(grade => ({ grade, count: counts.get(grade) || 0 }));
    }, [gradeDistribution]);

    const totalGraded = normalizedGradeDistribution.reduce((sum, item) => sum + item.count, 0);
    const excellentCount = normalizedGradeDistribution
        .filter(item => item.grade === "A" || item.grade === "B")
        .reduce((sum, item) => sum + item.count, 0);
    const lowGradeCount = normalizedGradeDistribution
        .filter(item => item.grade === "D" || item.grade === "E")
        .reduce((sum, item) => sum + item.count, 0);
    const excellentRate = totalGraded ? Math.round((excellentCount / totalGraded) * 100) : 0;
    const lowGradeRate = totalGraded ? Math.round((lowGradeCount / totalGraded) * 100) : 0;
    const calibrationAlerts = [
        totalGraded === 0 ? "Chưa có dữ liệu xếp loại để hiệu chỉnh." : null,
        totalGraded > 0 && excellentRate >= 70 ? "Tỷ lệ A/B cao, nên rà soát calibration giữa phòng ban." : null,
        totalGraded > 0 && lowGradeRate >= 30 ? "Tỷ lệ D/E cao, cần kiểm tra nguyên nhân hiệu suất hoặc tiêu chí chấm." : null,
        departmentWatchList.length > 0 ? "Có phòng ban cần HR/Admin theo dõi sát tiến độ." : null,
    ].filter(Boolean);

    if (error) {
        return (
            <PageContainer title="Không thể tải tiến độ kỳ đánh giá">
                <Alert
                    message="Lỗi hệ thống"
                    description={error instanceof Error ? error.message : "Đã có lỗi xảy ra khi tải dữ liệu tiến độ."}
                    type="error"
                    showIcon
                    action={
                        <Button onClick={() => window.location.reload()}>
                            Tải lại trang
                        </Button>
                    }
                />
            </PageContainer>
        );
    }

    // Columns for department progress table
    const deptColumns = [
        {
            title: "Phòng ban",
            dataIndex: "departmentName",
            key: "departmentName",
            render: (text: string) => <span style={{ fontWeight: 600, color: "#111111" }}>{text}</span>
        },
        {
            title: "Tổng số",
            dataIndex: "totalRecords",
            key: "totalRecords",
            align: "center" as const,
            render: (val: number) => <span style={{ fontWeight: 600 }}>{val}</span>
        },
        {
            title: "Đang đánh giá",
            dataIndex: "draftingCount",
            key: "draftingCount",
            align: "center" as const
        },
        {
            title: "Chờ QL chấm",
            dataIndex: "pendingManagerCount",
            key: "pendingManagerCount",
            align: "center" as const
        },
        {
            title: "Chờ duyệt cuối",
            dataIndex: "pendingApprovalCount",
            key: "pendingApprovalCount",
            align: "center" as const
        },
        {
            title: "Hoàn thành",
            dataIndex: "completedCount",
            key: "completedCount",
            align: "center" as const,
            render: (val: number) => <span style={{ color: "#346538", fontWeight: 600 }}>{val}</span>
        },
        {
            title: "Đã hủy",
            dataIndex: "cancelledCount",
            key: "cancelledCount",
            align: "center" as const,
            render: (val: number) => <span style={{ color: "#787774" }}>{val}</span>
        },
        {
            title: "Trễ hạn",
            dataIndex: "overdueCount",
            key: "overdueCount",
            align: "center" as const,
            render: (val: number) => val > 0
                ? <span className="pd-badge pd-badge--red">{val}</span>
                : <span style={{ color: "#787774" }}>0</span>
        }
    ];

    const overdueColumns = [
        {
            title: "Nhân viên",
            key: "employee",
            render: (_: any, record: any) => (
                <div>
                    <div style={{ fontWeight: 600, color: "#111111" }}>{record.employeeName}</div>
                    <div style={{ fontSize: 12, color: "#787774", marginTop: 2 }}>{record.employeeEmail}</div>
                </div>
            )
        },
        {
            title: "Bước đang xử lý",
            dataIndex: "statusLabel",
            key: "statusLabel",
            render: (text: string, record: any) => {
                const isApproval = record.status === "PENDING_APPROVAL";
                const isDrafting = record.status === "EMPLOYEE_DRAFTING";
                return (
                    <span className={`pd-badge ${isDrafting ? "pd-badge--blue" : isApproval ? "pd-badge--purple" : "pd-badge--amber"}`}>
                        {text}
                    </span>
                );
            }
        },
        {
            title: "Hạn chót",
            dataIndex: "deadline",
            key: "deadline",
            render: (val: string) => <span style={{ color: "#2F3437" }}>{dayjs(val).format("DD/MM/YYYY HH:mm")}</span>
        },
        {
            title: "Số ngày trễ",
            dataIndex: "overdueDays",
            key: "overdueDays",
            align: "center" as const,
            render: (val: number) => (
                <span style={{ color: "#9F2F2D", fontWeight: 600 }}>
                    {val} ngày
                </span>
            )
        },
        {
            title: "Thao tác",
            key: "action",
            align: "center" as const,
            render: (_: any, record: any) => (
                <button
                    className="pd-btn-action"
                    onClick={() => navigate(getRecordDetailPath(record.recordId, record.status))}
                >
                    Xử lý
                </button>
            )
        }
    ];

    return (
        <PageContainer
            title={
                onClose
                    ? <span>Tiến độ kỳ đánh giá</span>
                    : (
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <Button
                                type="text"
                                icon={<ArrowLeftOutlined />}
                                onClick={() => navigate("/admin/evaluation/periods")}
                                aria-label="Quay lại danh sách kỳ đánh giá"
                            />
                            <span>Tiến độ kỳ đánh giá</span>
                        </div>
                    )
            }
        >
            <Spin spinning={isLoading}>
            <div className="pd-page">
                <style>{`
                    .pd-page {
                        font-family: 'Geist Sans', 'Helvetica Neue', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
                        color: #2F3437;
                        padding: 0 0 40px;
                    }

                    /* ── Hero ── */
                    .pd-hero {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        gap: 24px;
                        padding: 28px 32px;
                        background: #FFFFFF;
                        border: 1px solid #EAEAEA;
                        border-radius: 12px;
                        margin-bottom: 24px;
                    }
                    .pd-hero__name {
                        margin: 0 0 10px;
                        font-size: 22px;
                        font-weight: 700;
                        color: #111111;
                        letter-spacing: -0.02em;
                        line-height: 1.2;
                    }
                    .pd-hero__meta {
                        display: flex;
                        flex-wrap: wrap;
                        gap: 6px 20px;
                        color: #787774;
                        font-size: 13px;
                    }
                    .pd-hero__meta-item {
                        display: flex;
                        align-items: center;
                        gap: 6px;
                    }
                    .pd-hero__right {
                        display: flex;
                        align-items: center;
                        gap: 20px;
                        flex-shrink: 0;
                    }
                    .pd-hero__pct {
                        text-align: right;
                    }
                    .pd-hero__pct-value {
                        font-size: 34px;
                        font-weight: 700;
                        color: #111111;
                        letter-spacing: -0.03em;
                        line-height: 1;
                    }
                    .pd-hero__pct-label {
                        font-size: 11px;
                        color: #787774;
                        margin-top: 4px;
                        font-weight: 500;
                        text-transform: uppercase;
                        letter-spacing: 0.06em;
                    }

                    /* ── Status badge ── */
                    .pd-status {
                        display: inline-flex;
                        align-items: center;
                        gap: 7px;
                        padding: 5px 12px;
                        border-radius: 9999px;
                        font-size: 12px;
                        font-weight: 600;
                        letter-spacing: 0.04em;
                        text-transform: uppercase;
                        border: 1px solid;
                    }
                    .pd-status--active  { background: #EDF3EC; color: #346538; border-color: rgba(52,101,56,0.2); }
                    .pd-status--closed  { background: #F3F4F6; color: #6B7280; border-color: #E5E7EB; }
                    .pd-status--draft   { background: #FBF3DB; color: #956400; border-color: rgba(149,100,0,0.2); }
                    .pd-status__dot {
                        width: 6px; height: 6px;
                        border-radius: 50%;
                        background: currentColor;
                    }

                    /* ── Overdue strip ── */
                    .pd-overdue-strip {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        gap: 12px;
                        padding: 13px 18px;
                        margin-bottom: 20px;
                        background: #FDEBEC;
                        border: 1px solid rgba(159,47,45,0.2);
                        border-radius: 8px;
                        color: #9F2F2D;
                        font-size: 13px;
                        font-weight: 500;
                    }
                    .pd-overdue-strip strong { font-weight: 700; }

                    /* ── KPI grid ── */
                    .pd-kpi-grid {
                        display: grid;
                        grid-template-columns: repeat(4, minmax(0, 1fr));
                        gap: 16px;
                        margin-bottom: 24px;
                    }
                    .pd-kpi-card {
                        background: #FFFFFF;
                        border: 1px solid #EAEAEA;
                        border-radius: 10px;
                        padding: 20px 24px;
                        transition: box-shadow 200ms ease, transform 200ms ease;
                    }
                    .pd-kpi-card:hover {
                        box-shadow: 0 2px 8px rgba(0,0,0,0.04);
                        transform: translateY(-1px);
                    }
                    .pd-kpi-card__head {
                        display: flex;
                        align-items: center;
                        justify-content: space-between;
                        margin-bottom: 14px;
                    }
                    .pd-kpi-card__label {
                        font-size: 12.5px;
                        font-weight: 600;
                        color: #787774;
                        text-transform: uppercase;
                        letter-spacing: 0.05em;
                    }
                    .pd-kpi-card__icon {
                        width: 30px;
                        height: 30px;
                        border-radius: 6px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-size: 14px;
                    }
                    .pd-kpi-card__value {
                        font-size: 30px;
                        font-weight: 700;
                        color: #111111;
                        letter-spacing: -0.03em;
                        line-height: 1;
                        margin-bottom: 6px;
                    }
                    .pd-kpi-card__value--red { color: #9F2F2D; }
                    .pd-kpi-card__note {
                        font-size: 12px;
                        color: #787774;
                        white-space: nowrap;
                        overflow: hidden;
                        text-overflow: ellipsis;
                    }

                    /* ── Panels ── */
                    .pd-panels {
                        display: grid;
                        grid-template-columns: 1fr 1fr;
                        gap: 16px;
                        margin-bottom: 16px;
                    }
                    .pd-panels--three {
                        grid-template-columns: 5fr 7fr;
                    }
                    .pd-panel {
                        background: #FFFFFF;
                        border: 1px solid #EAEAEA;
                        border-radius: 10px;
                        overflow: hidden;
                    }
                    .pd-panel__head {
                        display: flex;
                        align-items: center;
                        gap: 8px;
                        padding: 16px 20px;
                        border-bottom: 1px solid #EAEAEA;
                        font-size: 14px;
                        font-weight: 600;
                        color: #111111;
                    }
                    .pd-panel__head-icon {
                        color: #787774;
                        font-size: 14px;
                    }
                    .pd-panel__sub {
                        font-size: 12px;
                        color: #787774;
                        font-weight: 400;
                        padding: 12px 20px 0;
                    }
                    .pd-panel__body {
                        padding: 8px 20px 20px;
                    }

                    /* ── Status rows ── */
                    .pd-status-row {
                        display: grid;
                        grid-template-columns: minmax(0,1fr) 44px;
                        gap: 10px;
                        align-items: center;
                        padding: 13px 0;
                        border-bottom: 1px solid rgba(0,0,0,0.05);
                    }
                    .pd-status-row:last-child { border-bottom: 0; padding-bottom: 4px; }
                    .pd-status-row__label {
                        display: flex;
                        align-items: center;
                        gap: 9px;
                        font-size: 13.5px;
                        color: #2F3437;
                        font-weight: 500;
                    }
                    .pd-dot {
                        width: 8px; height: 8px;
                        border-radius: 50%;
                        flex-shrink: 0;
                    }
                    .pd-status-row__count {
                        font-weight: 700;
                        color: #111111;
                        text-align: right;
                        font-size: 14px;
                    }

                    /* ── Phase rows ── */
                    .pd-phase-row {
                        display: grid;
                        grid-template-columns: 28px minmax(0,1fr);
                        gap: 12px;
                        padding: 14px 0;
                        border-bottom: 1px solid rgba(0,0,0,0.05);
                    }
                    .pd-phase-row:last-child { border-bottom: 0; }
                    .pd-phase-idx {
                        width: 28px; height: 28px;
                        border-radius: 50%;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-size: 12px;
                        font-weight: 700;
                        background: #F7F6F3;
                        color: #787774;
                        border: 1px solid #EAEAEA;
                        flex-shrink: 0;
                        margin-top: 2px;
                    }
                    .pd-phase-head {
                        display: flex;
                        justify-content: space-between;
                        align-items: baseline;
                        gap: 8px;
                        margin-bottom: 8px;
                    }
                    .pd-phase-title {
                        font-size: 14px;
                        font-weight: 600;
                        color: #111111;
                    }
                    .pd-phase-caption {
                        font-size: 12px;
                        color: #787774;
                        margin-top: 1px;
                    }
                    .pd-phase-count {
                        font-weight: 700;
                        color: #111111;
                        font-size: 13px;
                        white-space: nowrap;
                    }

                    /* ── Grade rows ── */
                    .pd-grade-row {
                        display: grid;
                        grid-template-columns: 34px minmax(0,1fr) 38px;
                        gap: 12px;
                        align-items: center;
                        padding: 10px 0;
                        border-bottom: 1px solid rgba(0,0,0,0.05);
                    }
                    .pd-grade-row:last-child { border-bottom: 0; }
                    .pd-grade-badge {
                        width: 28px; height: 28px;
                        border-radius: 6px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-size: 13px;
                        font-weight: 700;
                        border: 1px solid;
                    }
                    .pd-grade-count {
                        font-weight: 600;
                        color: #111111;
                        text-align: right;
                        font-size: 13px;
                    }

                    /* ── Watch rows ── */
                    .pd-watch-row {
                        display: grid;
                        grid-template-columns: minmax(0,1fr) auto;
                        gap: 12px;
                        align-items: center;
                        padding: 12px 0;
                        border-bottom: 1px solid rgba(0,0,0,0.05);
                    }
                    .pd-watch-row:last-child { border-bottom: 0; }
                    .pd-watch-name {
                        font-size: 13.5px;
                        font-weight: 600;
                        color: #111111;
                    }
                    .pd-watch-sub {
                        font-size: 12px;
                        color: #787774;
                        margin-top: 3px;
                    }
                    .pd-watch-right {
                        display: flex;
                        flex-direction: column;
                        align-items: flex-end;
                        gap: 3px;
                    }
                    .pd-watch-pct {
                        font-size: 13px;
                        font-weight: 700;
                        color: #111111;
                    }
                    .pd-watch-overdue {
                        font-size: 11px;
                        color: #9F2F2D;
                        font-weight: 600;
                    }

                    /* ── Generic badges ── */
                    .pd-badge {
                        display: inline-flex;
                        align-items: center;
                        padding: 2px 8px;
                        border-radius: 9999px;
                        font-size: 11.5px;
                        font-weight: 600;
                        letter-spacing: 0.03em;
                    }
                    .pd-badge--red    { background: #FDEBEC; color: #9F2F2D; }
                    .pd-badge--blue   { background: #E1F3FE; color: #1F6C9F; }
                    .pd-badge--purple { background: #EDE9FE; color: #6B46C1; }
                    .pd-badge--amber  { background: #FBF3DB; color: #956400; }
                    .pd-badge--green  { background: #EDF3EC; color: #346538; }
                    .pd-badge--gray   { background: #F3F4F6; color: #6B7280; }

                    /* ── Action button ── */
                    .pd-btn-action {
                        padding: 5px 12px;
                        background: #111111;
                        color: #FFFFFF;
                        border: none;
                        border-radius: 5px;
                        font-size: 12.5px;
                        font-weight: 600;
                        cursor: pointer;
                        transition: background 150ms ease, transform 100ms ease;
                        font-family: inherit;
                    }
                    .pd-btn-action:hover  { background: #333333; }
                    .pd-btn-action:active { transform: scale(0.97); }

                    /* ── Table overrides ── */
                    .pd-page .ant-table-wrapper {
                        border-radius: 0;
                    }
                    .pd-page .ant-table-thead > tr > th {
                        background: #FAFAFA !important;
                        color: #787774 !important;
                        font-size: 11.5px !important;
                        font-weight: 700 !important;
                        text-transform: uppercase !important;
                        letter-spacing: 0.05em !important;
                        border-bottom: 1px solid #EAEAEA !important;
                        padding: 12px 16px !important;
                    }
                    .pd-page .ant-table-tbody > tr > td {
                        padding: 13px 16px !important;
                        font-size: 13px !important;
                        border-bottom: 1px solid rgba(0,0,0,0.04) !important;
                        color: #2F3437 !important;
                    }
                    .pd-page .ant-table-tbody > tr:hover > td {
                        background: #FBFBFA !important;
                    }

                    /* ── Full-width table panel ── */
                    .pd-table-panel {
                        background: #FFFFFF;
                        border: 1px solid #EAEAEA;
                        border-radius: 10px;
                        overflow: hidden;
                        margin-bottom: 16px;
                    }
                    .pd-table-panel__head {
                        display: flex;
                        align-items: center;
                        gap: 8px;
                        padding: 16px 20px;
                        border-bottom: 1px solid #EAEAEA;
                        font-size: 14px;
                        font-weight: 600;
                        color: #111111;
                    }

                    /* ── Calibration alert override ── */
                    .pd-page .ant-alert {
                        border-radius: 8px !important;
                        margin-top: 14px;
                    }

                    /* ── Progress bar ── */
                    .pd-page .ant-progress-bg {
                        background: #111111 !important;
                    }
                    .pd-page .ant-progress-inner {
                        background: #EAEAEA !important;
                    }

                    /* ── Responsive ── */
                    @media (max-width: 1023px) {
                        .pd-kpi-grid { grid-template-columns: repeat(2, minmax(0,1fr)); }
                        .pd-panels { grid-template-columns: 1fr; }
                        .pd-panels--three { grid-template-columns: 1fr; }
                    }
                    @media (max-width: 639px) {
                        .pd-kpi-grid { grid-template-columns: 1fr; }
                        .pd-hero { flex-direction: column; align-items: flex-start; padding: 20px; }
                        .pd-hero__right { width: 100%; justify-content: space-between; }
                    }
                `}</style>

                {/* ── Hero ── */}
                {period && (
                    <header className="pd-hero">
                        <div>
                            <h1 className="pd-hero__name">{period.name}</h1>
                            <div className="pd-hero__meta">
                                <span className="pd-hero__meta-item">
                                    <TeamOutlined />
                                    {activeRecordCount} nhân sự tham gia
                                </span>
                                {period.approvalDeadline && (
                                    <span className="pd-hero__meta-item">
                                        Hạn duyệt cuối: {dayjs(period.approvalDeadline).format("DD/MM/YYYY")}
                                    </span>
                                )}
                            </div>
                        </div>
                        <div className="pd-hero__right">
                            <span className={`pd-status pd-status--${period.status === "ACTIVE" ? "active" : period.status === "CLOSED" ? "closed" : "draft"}`}>
                                <span className="pd-status__dot" />
                                {period.status === "ACTIVE" ? "Đang mở" : period.status === "CLOSED" ? "Đã đóng" : "Bản nháp"}
                            </span>
                            <div className="pd-hero__pct">
                                <div className="pd-hero__pct-value">{overallCompletion}%</div>
                                <div className="pd-hero__pct-label">Hoàn thành</div>
                            </div>
                        </div>
                    </header>
                )}

                {kpi && (
                    <>
                        {/* ── Overdue strip ── */}
                        {kpi.overdueCount > 0 && (
                            <div className="pd-overdue-strip" role="alert">
                                <span>
                                    <WarningOutlined style={{ marginRight: 8 }} />
                                    Có <strong>{kpi.overdueCount}</strong> hồ sơ đã trễ hạn cần xử lý.
                                </span>
                                <span style={{ fontSize: 12, fontWeight: 600, opacity: 0.8 }}>
                                    Xem danh sách bên dưới
                                </span>
                            </div>
                        )}

                        {/* ── KPI cards ── */}
                        <div className="pd-kpi-grid">
                            {[
                                {
                                    label: "Tổng nhân sự",
                                    value: activeRecordCount,
                                    note: kpi.cancelledCount ? `${kpi.cancelledCount} hồ sơ đã hủy` : "Đang theo dõi",
                                    icon: <UserOutlined />,
                                    iconBg: "#F7F6F3",
                                    overdue: false,
                                },
                                {
                                    label: "Đang xử lý",
                                    value: inProgressCount,
                                    note: `${activeRecordCount ? Math.round((inProgressCount / activeRecordCount) * 100) : 0}% trong kỳ`,
                                    icon: <ClockCircleOutlined />,
                                    iconBg: "#E1F3FE",
                                    overdue: false,
                                },
                                {
                                    label: "Đã hoàn thành",
                                    value: kpi.completedCount,
                                    note: `${overallCompletion}% hoàn tất`,
                                    icon: <CheckCircleOutlined />,
                                    iconBg: "#EDF3EC",
                                    overdue: false,
                                },
                                {
                                    label: "Quá hạn",
                                    value: kpi.overdueCount,
                                    note: kpi.overdueCount ? "Cần can thiệp ngay" : "Không có hồ sơ quá hạn",
                                    icon: <WarningOutlined />,
                                    iconBg: kpi.overdueCount ? "#FDEBEC" : "#F7F6F3",
                                    overdue: kpi.overdueCount > 0,
                                },
                            ].map(m => (
                                <div className="pd-kpi-card" key={m.label}>
                                    <div className="pd-kpi-card__head">
                                        <span className="pd-kpi-card__label">{m.label}</span>
                                        <span className="pd-kpi-card__icon" style={{ background: m.iconBg }}>
                                            {m.icon}
                                        </span>
                                    </div>
                                    <div className={`pd-kpi-card__value${m.overdue ? " pd-kpi-card__value--red" : ""}`}>
                                        {m.value}
                                    </div>
                                    <div className="pd-kpi-card__note">{m.note}</div>
                                </div>
                            ))}
                        </div>

                        {/* ── Two panels: status distribution + journey ── */}
                        <div className="pd-panels">
                            {/* Status distribution */}
                            <div className="pd-panel">
                                <div className="pd-panel__head">
                                    <FileTextOutlined className="pd-panel__head-icon" />
                                    Phân bổ hồ sơ
                                </div>
                                <div className="pd-panel__sub">Theo trạng thái xử lý hiện tại</div>
                                <div className="pd-panel__body">
                                    {statusRows.length ? statusRows.map(item => {
                                        const pct = activeRecordCount ? Math.round((item.value / activeRecordCount) * 100) : 0;
                                        return (
                                            <div className="pd-status-row" key={item.label}>
                                                <div>
                                                    <div className="pd-status-row__label">
                                                        <span className="pd-dot" style={{ background: item.color }} />
                                                        {item.label}
                                                    </div>
                                                    <Progress
                                                        percent={pct}
                                                        showInfo={false}
                                                        strokeColor="#111111"
                                                        trailColor="#EAEAEA"
                                                        size="small"
                                                        style={{ margin: "8px 0 0 17px", width: "calc(100% - 17px)" }}
                                                    />
                                                </div>
                                                <strong className="pd-status-row__count">{item.value}</strong>
                                            </div>
                                        );
                                    }) : <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Chưa có hồ sơ" />}
                                </div>
                            </div>

                            {/* Journey */}
                            <div className="pd-panel">
                                <div className="pd-panel__head">
                                    <CheckCircleOutlined className="pd-panel__head-icon" />
                                    Hành trình hoàn thành
                                </div>
                                <div className="pd-panel__sub">Mức hoàn tất tại từng chặng trong kỳ</div>
                                <div className="pd-panel__body">
                                    {phaseRows.map((phase, idx) => {
                                        const pct = phase.total ? Math.round((phase.done / phase.total) * 100) : 0;
                                        return (
                                            <div className="pd-phase-row" key={phase.label}>
                                                <div className="pd-phase-idx">{idx + 1}</div>
                                                <div>
                                                    <div className="pd-phase-head">
                                                        <div>
                                                            <div className="pd-phase-title">{phase.label}</div>
                                                            <div className="pd-phase-caption">{phase.caption}</div>
                                                        </div>
                                                        <span className="pd-phase-count">{phase.done}/{phase.total}</span>
                                                    </div>
                                                    <Progress
                                                        percent={pct}
                                                        strokeColor="#111111"
                                                        trailColor="#EAEAEA"
                                                        strokeWidth={7}
                                                        format={v => `${v}%`}
                                                    />
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        {/* ── Calibration + Department watch ── */}
                        <div className="pd-panels pd-panels--three" style={{ marginBottom: 16 }}>
                            {/* Calibration */}
                            <div className="pd-panel">
                                <div className="pd-panel__head">
                                    <BarChartOutlined className="pd-panel__head-icon" />
                                    Calibration sơ bộ
                                </div>
                                <div className="pd-panel__sub">Phân phối xếp loại để phát hiện xu hướng chấm lệch</div>
                                <div className="pd-panel__body" style={{ paddingTop: 12 }}>
                                    {isGradeLoading
                                        ? <Spin size="small" />
                                        : normalizedGradeDistribution.length
                                            ? normalizedGradeDistribution.map(item => {
                                                const pct = totalGraded ? Math.round((item.count / totalGraded) * 100) : 0;
                                                const gColors: Record<string, { bg: string; color: string; border: string }> = {
                                                    A: { bg: "#EDF3EC", color: "#346538", border: "rgba(52,101,56,0.25)" },
                                                    B: { bg: "#E1F3FE", color: "#1F6C9F", border: "rgba(31,108,159,0.25)" },
                                                    C: { bg: "#FBF3DB", color: "#956400", border: "rgba(149,100,0,0.25)" },
                                                    D: { bg: "#FDEBEC", color: "#9F2F2D", border: "rgba(159,47,45,0.25)" },
                                                    E: { bg: "#FDEBEC", color: "#9F2F2D", border: "rgba(159,47,45,0.25)" },
                                                };
                                                const gc = gColors[item.grade] || { bg: "#F3F4F6", color: "#6B7280", border: "#E5E7EB" };
                                                return (
                                                    <div className="pd-grade-row" key={item.grade}>
                                                        <div className="pd-grade-badge" style={{ background: gc.bg, color: gc.color, borderColor: gc.border }}>
                                                            {item.grade}
                                                        </div>
                                                        <Progress
                                                            percent={pct}
                                                            showInfo={false}
                                                            strokeColor={gc.color}
                                                            trailColor="#EAEAEA"
                                                            size="small"
                                                        />
                                                        <span className="pd-grade-count">{item.count}</span>
                                                    </div>
                                                );
                                            })
                                            : <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Chưa có dữ liệu xếp loại" />
                                    }
                                    {calibrationAlerts.length > 0 && (
                                        <Alert
                                            type={excellentRate >= 70 || lowGradeRate >= 30 ? "warning" : "info"}
                                            showIcon
                                            message={<span style={{ fontWeight: 600 }}>Gợi ý kiểm tra</span>}
                                            description={calibrationAlerts[0] as string}
                                        />
                                    )}
                                </div>
                            </div>

                            {/* Department watch */}
                            <div className="pd-panel">
                                <div className="pd-panel__head">
                                    <TeamOutlined className="pd-panel__head-icon" />
                                    Phòng ban cần chú ý
                                </div>
                                <div className="pd-panel__sub">Phòng ban có hồ sơ quá hạn hoặc tiến độ thấp</div>
                                <div className="pd-panel__body" style={{ paddingTop: 12 }}>
                                    {departmentWatchList.length
                                        ? departmentWatchList.map(dept => (
                                            <div className="pd-watch-row" key={dept.departmentId}>
                                                <div>
                                                    <div className="pd-watch-name">{dept.departmentName || "Chưa cập nhật"}</div>
                                                    <div className="pd-watch-sub">
                                                        {dept.completedCount}/{dept.active} hoàn tất · {dept.stuck} đang xử lý
                                                    </div>
                                                </div>
                                                <div className="pd-watch-right">
                                                    <span className="pd-watch-pct">{dept.completion}%</span>
                                                    {dept.overdueCount > 0 && (
                                                        <span className="pd-watch-overdue">{dept.overdueCount} quá hạn</span>
                                                    )}
                                                </div>
                                            </div>
                                        ))
                                        : <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Không có phòng ban cần cảnh báo" />
                                    }
                                </div>
                            </div>
                        </div>

                        {/* ── Overdue records table ── */}
                        {progressData.overdueRecords && progressData.overdueRecords.length > 0 && (
                            <div className="pd-table-panel">
                                <div className="pd-table-panel__head">
                                    <WarningOutlined style={{ color: "#9F2F2D" }} />
                                    <span style={{ color: "#9F2F2D" }}>
                                        Hồ sơ cần xử lý ({progressData.overdueRecords.length})
                                    </span>
                                </div>
                                <Table
                                    dataSource={progressData.overdueRecords}
                                    columns={overdueColumns}
                                    rowKey="recordId"
                                    pagination={{ pageSize: 5 }}
                                    size="middle"
                                />
                            </div>
                        )}

                        {/* ── Department progress full table ── */}
                        <div className="pd-table-panel">
                            <div className="pd-table-panel__head">
                                <FileTextOutlined style={{ color: "#787774" }} />
                                Tiến độ theo phòng ban
                            </div>
                            <Table
                                dataSource={progressData.departmentProgress}
                                columns={deptColumns}
                                rowKey="departmentId"
                                pagination={{ pageSize: 10 }}
                                size="middle"
                            />
                        </div>
                    </>
                )}
            </div>
            </Spin>
        </PageContainer>
    );
};

export default PeriodProgressDashboard;
