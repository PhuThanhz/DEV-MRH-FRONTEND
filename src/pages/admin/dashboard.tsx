import { Typography, Skeleton } from "antd";
import { Pie } from "@ant-design/plots";
import PageContainer from "@/components/common/data-table/PageContainer";
import { useDashboardSummaryQuery } from "@/hooks/useDashboard";

const { Text } = Typography;

const S = `
  /* ── KPI Grid ── */
  .db-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 16px;
    margin-bottom: 28px;
  }

  /* ── KPI Card ── */
  .db-kpi {
    background: #fff;
    border-radius: 16px;
    border: 1px solid #f0f0f0;
    padding: 24px;
    box-shadow: 0 1px 4px rgba(0,0,0,.04);
    transition: box-shadow .18s, transform .18s;
    cursor: default;
    display: flex;
    align-items: center;
    gap: 18px;
  }
  .db-kpi:hover {
    box-shadow: 0 6px 20px rgba(242,84,125,.10);
    transform: translateY(-2px);
  }
  .db-kpi-icon {
    width: 52px; height: 52px;
    border-radius: 14px;
    background: linear-gradient(135deg, #fff0f4 0%, #ffe4ed 100%);
    display: flex; align-items: center; justify-content: center;
    color: #f2547d; flex-shrink: 0;
  }
  .db-kpi-label {
    font-size: 12px; color: #8c8c8c;
    margin-bottom: 6px;
    font-weight: 500;
    letter-spacing: .02em;
  }
  .db-kpi-num {
    font-size: 32px; font-weight: 700;
    color: #1a1a1a; letter-spacing: -.04em; line-height: 1;
  }
  .db-kpi-trend {
    font-size: 11px; color: #389e0d;
    background: #f6ffed; border-radius: 20px;
    padding: 2px 8px; margin-top: 6px;
    display: inline-block; font-weight: 600;
  }

  /* ── Bottom Grid ── */
  .db-bottom {
    display: grid;
    grid-template-columns: 1fr 2fr;
    gap: 16px;
  }

  /* ── Generic Card ── */
  .db-card {
    background: #fff;
    border-radius: 16px;
    border: 1px solid #f0f0f0;
    box-shadow: 0 1px 4px rgba(0,0,0,.04);
    overflow: hidden;
  }
  .db-card-head {
    padding: 16px 22px;
    border-bottom: 1px solid #f5f5f5;
    display: flex; align-items: center; justify-content: space-between;
  }
  .db-card-title { font-size: 13px; font-weight: 600; color: #262626; }
  .db-card-badge {
    font-size: 11px; font-weight: 600;
    background: #fff0f4; color: #f2547d;
    border-radius: 20px; padding: 2px 10px;
  }
  .db-card-body { padding: 20px 22px; }

  /* ── Section label ── */
  .db-sec {
    font-size: 11px; font-weight: 600; letter-spacing: .07em;
    text-transform: uppercase; color: #bfbfbf;
    margin-bottom: 12px;
  }

  /* ── Stat list ── */
  .db-stat-list { display: flex; flex-direction: column; gap: 0; }
  .db-stat-row {
    display: flex; align-items: center; justify-content: space-between;
    padding: 16px 0;
    border-bottom: 1px solid #f5f5f5;
  }
  .db-stat-row:last-child { border-bottom: none; }
  .db-stat-left { display: flex; align-items: center; gap: 12px; }
  .db-stat-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
  .db-stat-name { font-size: 13px; color: #262626; font-weight: 500; }
  .db-stat-sub  { font-size: 11px; color: #bfbfbf; margin-top: 2px; }
  .db-stat-val  { font-size: 20px; font-weight: 700; color: #1a1a1a; min-width: 32px; text-align: right; }

  /* ── Skeleton wrapper ── */
  .db-skeleton-kpi {
    background: #fff; border-radius: 16px; border: 1px solid #f0f0f0;
    padding: 24px; box-shadow: 0 1px 4px rgba(0,0,0,.04);
  }

  /* ── Responsive ── */
  @media (max-width: 1024px) {
    .db-bottom { grid-template-columns: 1fr; }
  }
  @media (max-width: 768px) {
    .db-grid { grid-template-columns: 1fr; gap: 12px; }
    .db-bottom { grid-template-columns: 1fr; gap: 12px; }
    .db-kpi { padding: 18px; }
    .db-kpi-num { font-size: 26px; }
  }
`;

const Ico = ({ d, size = 22 }: { d: string; size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="1.8"
        strokeLinecap="round" strokeLinejoin="round">
        <path d={d} />
    </svg>
);

const DOT_COLORS = ["#f2547d", "#1677ff", "#52c41a"];

const DashboardPage = () => {
    const { data, isLoading } = useDashboardSummaryQuery();

    const companyCount = data?.totalCompany ?? 0;
    const departmentCount = data?.totalDepartment ?? 0;
    const unitCount = data?.totalSection ?? 0;
    const total = companyCount + departmentCount + unitCount;

    const kpis = [
        {
            label: "Tổng công ty",
            value: companyCount,
            icon: "M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z",
            sub: "Đang hoạt động",
        },
        {
            label: "Tổng phòng ban",
            value: departmentCount,
            icon: "M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8z",
            sub: "Thuộc các công ty",
        },
        {
            label: "Tổng bộ phận",
            value: unitCount,
            icon: "M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5",
            sub: "Thuộc các phòng ban",
        },
    ];

    const statItems = [
        { name: "Công ty", sub: "Đơn vị cấp cao nhất", value: companyCount, color: "#f2547d" },
        { name: "Phòng ban", sub: "Thuộc công ty", value: departmentCount, color: "#1677ff" },
        { name: "Bộ phận", sub: "Thuộc phòng ban", value: unitCount, color: "#52c41a" },
    ];

    const pieConfig = {
        data: statItems.map(i => ({ type: i.name, value: i.value })),
        angleField: "value",
        colorField: "type",
        color: DOT_COLORS,
        innerRadius: 0.68,
        height: 240,
        label: false,
        legend: false,
        statistic: {
            title: {
                style: { fontSize: "11px", color: "#bfbfbf", fontWeight: "500" },
                content: "Tổng đơn vị",
            },
            content: {
                style: {
                    fontSize: "28px", fontWeight: "700",
                    color: "#1a1a1a", letterSpacing: "-.03em",
                },
                content: `${total}`,
            },
        },
    };

    return (
        <PageContainer title="Dashboard">
            <style>{S}</style>

            {/* ── KPI ── */}
            <div className="db-sec">Tổng quan hệ thống</div>
            <div className="db-grid">
                {isLoading
                    ? [0, 1, 2].map(i => (
                        <div key={i} className="db-skeleton-kpi">
                            <Skeleton active paragraph={{ rows: 1 }} />
                        </div>
                    ))
                    : kpis.map((k, i) => (
                        <div key={k.label} className="db-kpi">
                            <div className="db-kpi-icon">
                                <Ico d={k.icon} size={22} />
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div className="db-kpi-label">{k.label}</div>
                                <div className="db-kpi-num">{k.value.toLocaleString()}</div>
                                <div className="db-kpi-trend">{k.sub}</div>
                            </div>
                            <div style={{
                                width: 4, height: 48, borderRadius: 99, flexShrink: 0,
                                background: `linear-gradient(180deg, ${DOT_COLORS[i]} 0%, ${DOT_COLORS[i]}33 100%)`,
                            }} />
                        </div>
                    ))
                }
            </div>

            {/* ── Bottom ── */}
            <div className="db-sec">Phân tích cơ cấu</div>
            <div className="db-bottom">

                {/* Pie */}
                <div className="db-card">
                    <div className="db-card-head">
                        <span className="db-card-title">Tỉ lệ đơn vị</span>
                        <span className="db-card-badge">
                            {isLoading ? "—" : `${total} đơn vị`}
                        </span>
                    </div>
                    <div className="db-card-body">
                        {isLoading
                            ? <Skeleton active paragraph={{ rows: 4 }} />
                            : <Pie {...pieConfig} />
                        }
                    </div>
                </div>

                {/* Stat list */}
                <div className="db-card">
                    <div className="db-card-head">
                        <span className="db-card-title">Chi tiết theo loại</span>
                        <span className="db-card-badge">3 loại đơn vị</span>
                    </div>
                    <div className="db-card-body">
                        {isLoading
                            ? <Skeleton active paragraph={{ rows: 3 }} />
                            : (
                                <div className="db-stat-list">
                                    {statItems.map(item => {
                                        const pct = total > 0
                                            ? Math.round((item.value / total) * 100)
                                            : 0;
                                        return (
                                            <div key={item.name} className="db-stat-row">
                                                <div className="db-stat-left">
                                                    <span className="db-stat-dot"
                                                        style={{ background: item.color }} />
                                                    <div>
                                                        <div className="db-stat-name">{item.name}</div>
                                                        <div className="db-stat-sub">{item.sub}</div>
                                                    </div>
                                                </div>
                                                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                                                    {/* progress bar */}
                                                    <div style={{
                                                        width: 120, height: 6, background: "#f5f5f5",
                                                        borderRadius: 99, overflow: "hidden",
                                                    }}>
                                                        <div style={{
                                                            width: `${pct}%`, height: "100%",
                                                            background: item.color, borderRadius: 99,
                                                            transition: "width .4s ease",
                                                        }} />
                                                    </div>
                                                    <Text type="secondary"
                                                        style={{ fontSize: 12, minWidth: 32, textAlign: "right" }}>
                                                        {pct}%
                                                    </Text>
                                                    <div className="db-stat-val">
                                                        {item.value.toLocaleString()}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )
                        }
                    </div>
                </div>
            </div>
        </PageContainer>
    );
};

export default DashboardPage;