import { useMemo } from "react";
import { Skeleton } from "antd";
import { Pie } from "@ant-design/charts";
import { useNavigate } from "react-router-dom";
import PageContainer from "@/components/common/data-table/PageContainer";
import { useDashboardSummaryQuery, useDepartmentCompletenessQuery } from "@/hooks/useDashboard";

/* ─────────────────────────── STYLES ─────────────────────────── */
const S = `
  /* ── Section label ── */
  .db-sec {
    font-size: 11px;
    font-weight: 600;
    letter-spacing: .07em;
    text-transform: uppercase;
    color: #bfbfbf;
    margin-bottom: 12px;
  }

  /* ── KPI grid: 4 cols → 2 cols → 1 col ── */
  .db-grid {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 14px;
    margin-bottom: 24px;
  }

  /* ── KPI card ── */
  .db-kpi {
    background: #fff;
    border-radius: 16px;
    border: 1px solid #f0f0f0;
    padding: 20px 18px;
    box-shadow: 0 1px 4px rgba(0,0,0,.04);
    transition: box-shadow .18s, transform .18s;
    cursor: default;
    display: flex;
    align-items: center;
    gap: 14px;
    min-width: 0;
  }
  .db-kpi:hover { box-shadow: 0 6px 20px rgba(242,84,125,.10); transform: translateY(-2px); }
  .db-kpi.clickable { cursor: pointer; }

  .db-kpi-icon {
    width: 48px; height: 48px;
    border-radius: 13px;
    background: #fff0f4;
    display: flex; align-items: center; justify-content: center;
    color: #f2547d; flex-shrink: 0;
  }
  .db-kpi-body { flex: 1; min-width: 0; }
  .db-kpi-label { font-size: 11px; color: #8c8c8c; margin-bottom: 4px; font-weight: 500; letter-spacing: .02em; }
  .db-kpi-num   { font-size: 28px; font-weight: 700; color: #1a1a1a; letter-spacing: -.03em; line-height: 1; }
  .db-kpi-trend {
    font-size: 11px; color: #389e0d; background: #f6ffed;
    border-radius: 20px; padding: 2px 8px; margin-top: 5px;
    display: inline-block; font-weight: 600;
  }
  .db-kpi-trend.warn   { color: #d46b08; background: #fff7e6; }
  .db-kpi-trend.danger { color: #cf1322; background: #fff1f0; }
  .db-kpi-link {
    font-size: 11px; color: #f2547d; margin-top: 5px;
    display: inline-flex; align-items: center; gap: 3px; font-weight: 500;
  }
  .db-kpi-accent {
    width: 3px; height: 44px; border-radius: 99px; flex-shrink: 0;
  }

  /* ── Skeleton placeholder ── */
  .db-skeleton-kpi {
    background: #fff;
    border-radius: 16px;
    border: 1px solid #f0f0f0;
    padding: 20px 18px;
    box-shadow: 0 1px 4px rgba(0,0,0,.04);
  }

  /* ── Bottom row: pie (1fr) + list (2fr) ── */
  .db-bottom {
    display: grid;
    grid-template-columns: 1fr 2fr;
    gap: 14px;
  }

  /* ── Card ── */
  .db-card {
    background: #fff;
    border-radius: 16px;
    border: 1px solid #f0f0f0;
    box-shadow: 0 1px 4px rgba(0,0,0,.04);
    overflow: hidden;
  }
  .db-card-head {
    padding: 14px 20px;
    border-bottom: 1px solid #f5f5f5;
    display: flex; align-items: center; justify-content: space-between; gap: 8px;
  }
  .db-card-title { font-size: 13px; font-weight: 600; color: #262626; }
  .db-card-badge {
    font-size: 11px; font-weight: 600;
    background: #fff0f4; color: #f2547d;
    border-radius: 20px; padding: 2px 10px;
    white-space: nowrap; flex-shrink: 0;
  }
  .db-card-body { padding: 18px 20px; }

  /* ── Legend ── */
  .db-legend { display: flex; justify-content: center; gap: 14px; margin-top: 6px; flex-wrap: wrap; }
  .db-legend-item { display: flex; align-items: center; gap: 5px; font-size: 11px; color: #595959; }
  .db-legend-dot { width: 7px; height: 7px; border-radius: 50%; display: inline-block; flex-shrink: 0; }

  /* ── Top-5 list ── */
  .db-top-list { display: flex; flex-direction: column; }
  .db-top-row {
    display: flex; align-items: center; justify-content: space-between;
    padding: 11px 0; border-bottom: 1px solid #f5f5f5;
  }
  .db-top-row:last-child { border-bottom: none; }
  .db-top-rank { font-size: 11px; font-weight: 700; color: #bfbfbf; width: 18px; flex-shrink: 0; }
  .db-top-rank.warn { color: #ff4d4f; }
  .db-top-info { flex: 1; min-width: 0; margin: 0 10px; }
  .db-top-name {
    font-size: 13px; font-weight: 600; color: #262626;
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  }
  .db-top-company { font-size: 11px; color: #bfbfbf; margin-top: 2px; }
  .db-top-right { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }
  .db-top-bar-wrap { width: 72px; height: 5px; background: #f5f5f5; border-radius: 99px; overflow: hidden; }
  .db-top-bar { height: 100%; border-radius: 99px; transition: width .4s ease; }

  /* ── Score badge ── */
  .db-score-badge {
    display: inline-flex; align-items: center; justify-content: center;
    font-size: 11px; font-weight: 700;
    border-radius: 20px; padding: 2px 8px; min-width: 44px;
  }
  .db-score-full   { background: #f6ffed; color: #389e0d; }
  .db-score-mid    { background: #fffbe6; color: #d48806; }
  .db-score-low    { background: #fff1f0; color: #cf1322; }

  /* ── View-all footer ── */
  .db-view-all {
    display: flex; align-items: center; justify-content: center;
    padding: 12px 20px; border-top: 1px solid #f5f5f5;
    font-size: 12px; font-weight: 600; color: #f2547d;
    cursor: pointer; gap: 4px; transition: background .15s;
  }
  .db-view-all:hover { background: #fff9fb; }

  /* ══════════════════════════════════════
     RESPONSIVE BREAKPOINTS
  ══════════════════════════════════════ */

  /* Tablet: 1024px – 1280px → 2-col KPI */
  @media (max-width: 1280px) {
    .db-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  }

  /* Tablet landscape: stack bottom cards */
  @media (max-width: 1024px) {
    .db-bottom { grid-template-columns: 1fr; }
  }

  /* Tablet portrait: tighter icon */
  @media (max-width: 768px) {
    .db-kpi-icon { width: 42px; height: 42px; border-radius: 11px; }
    .db-kpi-num  { font-size: 24px; }
    .db-top-bar-wrap { width: 56px; }
  }

  /* Mobile: 1-col KPI, compact padding */
  @media (max-width: 600px) {
    .db-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 10px;
      margin-bottom: 18px;
    }
    .db-kpi { padding: 14px 12px; gap: 10px; }
    .db-kpi-icon { width: 36px; height: 36px; border-radius: 10px; }
    .db-kpi-icon svg { width: 16px; height: 16px; }
    .db-kpi-num  { font-size: 22px; }
    .db-kpi-label { font-size: 10px; }
    .db-kpi-trend { font-size: 10px; padding: 1px 6px; }
    .db-kpi-link  { font-size: 10px; }
    .db-kpi-accent { display: none; }

    .db-skeleton-kpi { padding: 14px 12px; }

    .db-bottom { gap: 10px; }
    .db-card-head { padding: 12px 14px; }
    .db-card-body { padding: 14px; }
    .db-view-all  { padding: 10px 14px; font-size: 11px; }

    .db-top-name    { font-size: 12px; }
    .db-top-company { font-size: 10px; }
    .db-top-bar-wrap { width: 44px; }
    .db-score-badge  { min-width: 38px; font-size: 10px; padding: 1px 6px; }
  }

  /* Very small screens: single column for KPI */
  @media (max-width: 380px) {
    .db-grid { grid-template-columns: 1fr; }
    .db-kpi-num { font-size: 26px; }
  }
`;

/* ─────────────────────────── ICONS ─────────────────────────── */
const Ico = ({ d, size = 20 }: { d: string; size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d={d} />
    </svg>
);

const ArrowRight = () => (
    <svg width={12} height={12} viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 12h14M12 5l7 7-7 7" />
    </svg>
);

/* ─────────────────────────── CONSTANTS ─────────────────────────── */
const ACCENT_COLORS = ["#f2547d", "#1677ff", "#52c41a", "#faad14"];

/* ─────────────────────────── SUB COMPONENTS ─────────────────────────── */
const ScoreBadge = ({ score }: { score: number }) => {
    const cls =
        score === 7 ? "db-score-badge db-score-full"
            : score >= 4 ? "db-score-badge db-score-mid"
                : "db-score-badge db-score-low";
    return <span className={cls}>{score}/7</span>;
};

/* ─────────────────────────── MAIN PAGE ─────────────────────────── */
const DashboardPage = () => {
    const navigate = useNavigate();
    const { data, isLoading } = useDashboardSummaryQuery();
    const { data: completeness, isLoading: isLoadingComplete } = useDepartmentCompletenessQuery();

    const companyCount = data?.totalCompany ?? 0;
    const departmentCount = data?.totalDepartment ?? 0;
    const unitCount = data?.totalSection ?? 0;
    const fullCount = completeness?.filter(d => d.score === 7).length ?? 0;
    const totalDept = completeness?.length ?? 0;
    const missingCount = totalDept - fullCount;

    /* Top 5 departments with lowest score */
    const top5Missing = useMemo(() => {
        if (!completeness) return [];
        return [...completeness]
            .filter(d => d.score < 7)
            .sort((a, b) => a.score - b.score)
            .slice(0, 5);
    }, [completeness]);

    /* Pie data */
    const pieData = useMemo(() => {
        if (!completeness || completeness.length === 0) return [];
        const full = completeness.filter(d => d.score === 7).length;
        const partial = completeness.filter(d => d.score > 0 && d.score < 7).length;
        const empty = completeness.filter(d => d.score === 0).length;
        return [
            { name: "Hoàn chỉnh (7/7)", value: full, color: "#52c41a" },
            { name: "Đang bổ sung", value: partial, color: "#faad14" },
            { name: "Chưa có hồ sơ", value: empty, color: "#ff4d4f" },
        ].filter(d => d.value > 0);
    }, [completeness]);

    /* KPI – hồ sơ trend text + class */
    const hoSoTrend =
        isLoadingComplete ? "—"
            : missingCount === 0 ? "Tất cả hoàn chỉnh"
                : `Còn ${missingCount} phòng ban thiếu`;
    const hoSoTrendCls =
        missingCount === 0 ? ""
            : missingCount > 3 ? " danger"
                : " warn";

    const kpis = [
        {
            label: "Tổng công ty",
            value: companyCount,
            icon: "M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z",
            sub: "Đang hoạt động",
            subCls: "",
            onClick: undefined as (() => void) | undefined,
        },
        {
            label: "Tổng phòng ban",
            value: departmentCount,
            icon: "M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8z",
            sub: "Thuộc các công ty",
            subCls: "",
            onClick: undefined as (() => void) | undefined,
        },
        {
            label: "Tổng bộ phận",
            value: unitCount,
            icon: "M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5",
            sub: "Thuộc các phòng ban",
            subCls: "",
            onClick: undefined as (() => void) | undefined,
        },
        {
            label: "Hồ sơ hoàn chỉnh",
            value: isLoadingComplete ? "—" : `${fullCount}/${totalDept}`,
            icon: "M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z",
            sub: hoSoTrend,
            subCls: hoSoTrendCls,
            onClick: () => navigate("/admin/department-profiles"),
        },
    ];

    /* @ant-design/charts v2 – Pie config */
    const pieConfig = useMemo(() => ({
        data: pieData,
        angleField: "value",
        colorField: "name",
        innerRadius: 0.68,
        height: 210,
        legend: false as const,
        label: false as const,
        scale: {
            color: { range: pieData.map(d => d.color) },
        },
        tooltip: {
            items: [{ channel: "y" as const, name: "Phòng ban" }],
        },
        annotations: [
            {
                type: "text" as const,
                style: {
                    text: String(totalDept),
                    x: "50%", y: "44%",
                    textAlign: "center" as const,
                    fontSize: 26, fontWeight: 700, fill: "#1a1a1a",
                },
            },
            {
                type: "text" as const,
                style: {
                    text: "Phòng ban",
                    x: "50%", y: "61%",
                    textAlign: "center" as const,
                    fontSize: 11, fill: "#bfbfbf", fontWeight: 500,
                },
            },
        ],
    }), [pieData, totalDept]);

    /* ── Render ── */
    return (
        <PageContainer title="Dashboard">
            <style>{S}</style>

            {/* KPI ROW */}
            <div className="db-sec">Tổng quan hệ thống</div>
            <div className="db-grid">
                {isLoading
                    ? [0, 1, 2, 3].map(i => (
                        <div key={i} className="db-skeleton-kpi">
                            <Skeleton active paragraph={{ rows: 1 }} />
                        </div>
                    ))
                    : kpis.map((k, i) => (
                        <div
                            key={k.label}
                            className={`db-kpi${k.onClick ? " clickable" : ""}`}
                            onClick={k.onClick}
                        >
                            <div className="db-kpi-icon">
                                <Ico d={k.icon} size={20} />
                            </div>

                            <div className="db-kpi-body">
                                <div className="db-kpi-label">{k.label}</div>
                                <div className="db-kpi-num">
                                    {typeof k.value === "number"
                                        ? k.value.toLocaleString("vi-VN")
                                        : k.value}
                                </div>
                                <div className={`db-kpi-trend${k.subCls}`}>{k.sub}</div>
                                {k.onClick && (
                                    <div className="db-kpi-link">
                                        Xem chi tiết <ArrowRight />
                                    </div>
                                )}
                            </div>

                            {/* Accent bar – hidden on small mobile via CSS */}
                            <div
                                className="db-kpi-accent"
                                style={{
                                    background: `linear-gradient(180deg, ${ACCENT_COLORS[i]} 0%, ${ACCENT_COLORS[i]}33 100%)`,
                                }}
                            />
                        </div>
                    ))
                }
            </div>

            {/* BOTTOM ROW */}
            <div className="db-sec">Tình trạng hồ sơ phòng ban</div>
            <div className="db-bottom">

                {/* Pie card */}
                <div className="db-card">
                    <div className="db-card-head">
                        <span className="db-card-title">Mức độ hoàn thiện hồ sơ</span>
                        <span className="db-card-badge">
                            {isLoadingComplete ? "—" : `${totalDept} phòng ban`}
                        </span>
                    </div>
                    <div className="db-card-body">
                        {isLoadingComplete ? (
                            <Skeleton active paragraph={{ rows: 4 }} />
                        ) : pieData.length === 0 ? (
                            <div style={{ textAlign: "center", padding: "32px 0", color: "#bfbfbf", fontSize: 13 }}>
                                Chưa có dữ liệu
                            </div>
                        ) : (
                            <>
                                <Pie {...pieConfig} />
                                <div className="db-legend">
                                    {pieData.map(item => (
                                        <div key={item.name} className="db-legend-item">
                                            <span className="db-legend-dot" style={{ background: item.color }} />
                                            {item.name}
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* Top-5 missing card */}
                <div className="db-card">
                    <div className="db-card-head">
                        <span className="db-card-title">Phòng ban cần hoàn thiện hồ sơ</span>
                        <span className="db-card-badge">
                            {isLoadingComplete ? "—" : `${missingCount} phòng ban còn thiếu`}
                        </span>
                    </div>
                    <div className="db-card-body">
                        {isLoadingComplete ? (
                            <Skeleton active paragraph={{ rows: 5 }} />
                        ) : top5Missing.length === 0 ? (
                            <div style={{ textAlign: "center", padding: "32px 0", color: "#52c41a", fontSize: 13, fontWeight: 600 }}>
                                🎉 Tất cả phòng ban đã hoàn thiện hồ sơ
                            </div>
                        ) : (
                            <div className="db-top-list">
                                {top5Missing.map((dept, idx) => {
                                    const pct = Math.round((dept.score / 7) * 100);
                                    const barColor =
                                        dept.score === 0 ? "#ff4d4f"
                                            : dept.score < 4 ? "#faad14"
                                                : "#1677ff";
                                    return (
                                        <div key={dept.departmentId} className="db-top-row">
                                            <span className={`db-top-rank${dept.score <= 2 ? " warn" : ""}`}>
                                                {idx + 1}
                                            </span>
                                            <div className="db-top-info">
                                                <div className="db-top-name">{dept.departmentName}</div>
                                                <div className="db-top-company">{dept.companyName}</div>
                                            </div>
                                            <div className="db-top-right">
                                                <div className="db-top-bar-wrap">
                                                    <div
                                                        className="db-top-bar"
                                                        style={{ width: `${pct}%`, background: barColor }}
                                                    />
                                                </div>
                                                <ScoreBadge score={dept.score} />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {!isLoadingComplete && missingCount > 0 && (
                        <div
                            className="db-view-all"
                            onClick={() => navigate("/admin/department-profiles")}
                        >
                            Xem tất cả {missingCount} phòng ban còn thiếu <ArrowRight />
                        </div>
                    )}
                </div>

            </div>
        </PageContainer>
    );
};

export default DashboardPage;