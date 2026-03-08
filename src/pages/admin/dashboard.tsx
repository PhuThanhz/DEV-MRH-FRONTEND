import { useRef } from "react";
import { Table, Progress, Typography, Row, Col, Card } from "antd";
import { Pie, Column } from "@ant-design/plots";

import PageContainer from "@/components/common/data-table/PageContainer";

const { Text } = Typography;

interface Company { id: string; name: string; }
interface DepartmentSetup {
    organizationChart: boolean;
    objectives: boolean;
    permissions: boolean;
    careerPath: boolean;
    salaryFramework: boolean;
    jobMap: boolean;
    processCatalog: boolean;
}
interface Department {
    key: string;
    companyId: string;
    name: string;
    unitCount: number;
    totalProfile: number;
    completedProfile: number;
    setup: DepartmentSetup;
}

/* ── inline style overrides ── */
const S = `
  /* ── KPI Grid ── */
  .db-grid {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: 12px;
    margin-bottom: 24px;
  }

  /* ── Chart Grid ── */
  .db-chart-grid {
    display: grid;
    grid-template-columns: 5fr 7fr;
    gap: 12px;
    margin-bottom: 24px;
  }

  /* ── KPI Card ── */
  .db-kpi {
    background: #fff;
    border-radius: 14px;
    border: 1px solid #f0f0f0;
    padding: 20px;
    box-shadow: 0 1px 4px rgba(0,0,0,.04);
    transition: box-shadow .18s, transform .18s;
    cursor: default;
    min-width: 0;
  }
  .db-kpi:hover { box-shadow: 0 4px 16px rgba(0,0,0,.07); transform: translateY(-1px); }

  .db-kpi-top    { display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px; }
  .db-kpi-icon   { width: 32px; height: 32px; border-radius: 8px; background: #fff0f4; display: flex; align-items: center; justify-content: center; color: #f2547d; flex-shrink: 0; }
  .db-kpi-label  { font-size: 12px; color: #8c8c8c; margin-bottom: 4px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .db-kpi-num    { font-size: 28px; font-weight: 700; color: #1a1a1a; letter-spacing: -.03em; line-height: 1; }

  /* ── Generic Card ── */
  .db-card {
    background: #fff;
    border-radius: 14px;
    border: 1px solid #f0f0f0;
    box-shadow: 0 1px 4px rgba(0,0,0,.04);
    overflow: hidden;
  }
  .db-card-head  {
    padding: 14px 20px;
    border-bottom: 1px solid #f5f5f5;
    display: flex; align-items: center; justify-content: space-between;
    flex-wrap: wrap; gap: 8px;
  }
  .db-card-title { font-size: 13px; font-weight: 600; color: #262626; }
  .db-card-badge {
    font-size: 11px; font-weight: 600;
    background: #fff0f4; color: #f2547d;
    border-radius: 20px; padding: 2px 9px;
    white-space: nowrap;
  }
  .db-card-body  { padding: 16px 20px; }

  /* ── Table overrides ── */
  .db-table .ant-table-thead > tr > th {
    background: #fafafa !important;
    font-size: 11px !important;
    font-weight: 600 !important;
    text-transform: uppercase !important;
    letter-spacing: .05em !important;
    color: #bfbfbf !important;
    border-bottom: 1px solid #f0f0f0 !important;
    white-space: nowrap;
  }
  .db-table .ant-table-tbody > tr > td {
    border-bottom: 1px solid #f5f5f5 !important;
    vertical-align: middle !important;
  }
  .db-table .ant-table-tbody > tr:last-child > td { border-bottom: none !important; }
  .db-table .ant-table-tbody > tr:hover > td { background: #fff8fa !important; }
  .db-table .ant-progress-inner { background: #f5f5f5 !important; border-radius: 99px !important; }
  .db-table .ant-progress-bg    { border-radius: 99px !important; }

  /* Horizontal scroll wrapper for table on mobile */
  .db-table-scroll { overflow-x: auto; -webkit-overflow-scrolling: touch; }

  /* ── Chips ── */
  .db-chip {
    display: inline-block;
    background: #f5f5f5; color: #595959;
    border-radius: 5px; font-size: 11px; font-weight: 500;
    padding: 2px 8px; margin: 2px;
  }
  .db-chip-ok {
    display: inline-flex; align-items: center; gap: 4px;
    background: #f6ffed; color: #389e0d;
    border-radius: 5px; font-size: 11.5px; font-weight: 600;
    padding: 3px 10px;
    white-space: nowrap;
  }
  .db-dots { display: flex; gap: 4px; margin-top: 8px; flex-wrap: wrap; }
  .db-dot  { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }
  .db-dot.on  { background: #f2547d; }
  .db-dot.off { background: #e8e8e8; }

  /* ── Section label ── */
  .db-sec {
    font-size: 11px; font-weight: 600; letter-spacing: .06em;
    text-transform: uppercase; color: #bfbfbf;
    margin-bottom: 10px;
  }
  .db-pct-row { display: flex; justify-content: space-between; margin-bottom: 6px; }

  /* ════════════════════════════════
     RESPONSIVE BREAKPOINTS
     ════════════════════════════════ */

  /* Tablet – ≤ 1024px */
  @media (max-width: 1024px) {
    .db-grid {
      grid-template-columns: repeat(3, 1fr);
    }
    .db-chart-grid {
      grid-template-columns: 1fr;
    }
    .db-kpi-num { font-size: 24px; }
  }

  /* Large mobile – ≤ 768px */
  @media (max-width: 768px) {
    .db-grid {
      grid-template-columns: repeat(2, 1fr);
      gap: 10px;
    }
    .db-chart-grid {
      grid-template-columns: 1fr;
      gap: 10px;
    }
    .db-kpi {
      padding: 14px;
      border-radius: 12px;
    }
    .db-kpi-num { font-size: 22px; }
    .db-kpi-label { font-size: 11px; }
    .db-card-body { padding: 12px 14px; }
    .db-card-head { padding: 12px 14px; }
    .db-card-title { font-size: 12px; }
  }

  /* Small mobile – ≤ 480px */
  @media (max-width: 480px) {
    .db-grid {
      grid-template-columns: 1fr 1fr;
      gap: 8px;
    }
    .db-kpi {
      padding: 12px;
      border-radius: 10px;
    }
    .db-kpi-top { margin-bottom: 10px; }
    .db-kpi-icon { width: 28px; height: 28px; }
    .db-kpi-num { font-size: 20px; }
    .db-kpi-label { font-size: 10px; }
    .db-chart-grid { gap: 8px; }
    .db-card-body { padding: 10px 12px; }
    .db-card-head { padding: 10px 12px; }
    .db-sec { font-size: 10px; }

    /* Shrink table font on very small screens */
    .db-table .ant-table-tbody > tr > td { font-size: 12px !important; }
    .db-table .ant-table-thead > tr > th { font-size: 10px !important; }
  }
`;

const Ico = ({ d, size = 14 }: { d: string; size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d={d} />
    </svg>
);

const sparks = [
    [6, 10, 7, 14, 9, 16, 12, 18],
    [8, 12, 8, 10, 14, 10, 16, 14],
    [10, 8, 14, 12, 10, 14, 12, 16],
    [6, 8, 12, 10, 14, 12, 16, 18],
    [14, 10, 12, 8, 10, 12, 10, 14],
];

const DashboardPage = () => {

    const companies: Company[] = [
        { id: "c1", name: "CÔNG TY CỔ PHẦN V LOTUS HOLDINGS" }
    ];

    const departments: Department[] = [
        {
            key: "d1", companyId: "c1",
            name: "Phòng Hành chính - Nhân sự",
            unitCount: 4, totalProfile: 7, completedProfile: 1,
            setup: {
                organizationChart: true,
                objectives: false, permissions: false,
                careerPath: false, salaryFramework: false,
                jobMap: false, processCatalog: false
            }
        }
    ];

    const setupFields: Record<keyof DepartmentSetup, string> = {
        organizationChart: "Sơ đồ tổ chức",
        objectives: "Mục tiêu – Nhiệm vụ",
        permissions: "Phân quyền",
        careerPath: "Lộ trình thăng tiến",
        salaryFramework: "Khung lương",
        jobMap: "Bảng đồ chức danh",
        processCatalog: "Danh mục quy trình"
    };
    const TOTAL = 7;
    const setupKeys = Object.keys(setupFields) as (keyof DepartmentSetup)[];

    const getCompleted = (s: DepartmentSetup) => Object.values(s).filter(Boolean).length;
    const getMissing = (s: DepartmentSetup) => setupKeys.filter(k => !s[k]).map(k => setupFields[k]);

    const companyCount = companies.length;
    const departmentCount = departments.length;
    const unitCount = departments.reduce((a, d) => a + d.unitCount, 0);
    const completedProfile = departments.reduce((a, d) => a + d.completedProfile, 0);
    const totalProfile = departments.reduce((a, d) => a + d.totalProfile, 0);
    const missingProfile = totalProfile - completedProfile;
    const overallPct = Math.round((completedProfile / totalProfile) * 100);

    /* ── charts ── */
    const pieConfig = {
        data: [
            { type: "Hoàn thành", value: completedProfile },
            { type: "Còn thiếu", value: missingProfile }
        ],
        angleField: "value", colorField: "type",
        color: ["#f2547d", "#f5f5f5"],
        innerRadius: 0.72, height: 210, label: false,
        legend: { position: "bottom" as const },
        statistic: {
            title: { style: { fontSize: "11px", color: "#bfbfbf", fontWeight: "500" }, content: "Hoàn thành" },
            content: { style: { fontSize: "26px", fontWeight: "700", color: "#1a1a1a", letterSpacing: "-.03em" }, content: `${overallPct}%` }
        }
    };

    const columnConfig = {
        data: departments.map(d => ({ name: d.name.replace("Phòng ", ""), value: getCompleted(d.setup) })),
        xField: "name", yField: "value", height: 210, color: "#f2547d",
        columnStyle: { radius: [5, 5, 0, 0] },
        yAxis: {
            max: TOTAL,
            grid: { line: { style: { stroke: "#f5f5f5", lineWidth: 1 } } },
            label: { style: { fontSize: 11, fill: "#bfbfbf" } }
        },
        xAxis: { label: { style: { fontSize: 12, fill: "#595959" } } },
        label: { position: "top", style: { fontSize: 12, fontWeight: 600, fill: "#f2547d" } }
    };

    /* ── table columns ── */
    const cols = [
        {
            title: "Công ty",
            dataIndex: "companyId",
            render: (id: string) => {
                const co = companies.find(c => c.id === id);
                return <Text type="secondary" style={{ fontSize: 13 }}>{co?.name}</Text>;
            }
        },
        {
            title: "Phòng ban",
            dataIndex: "name",
            render: (_: any, r: Department) => (
                <div>
                    <div style={{ fontWeight: 600, fontSize: 13.5, color: "#1a1a1a" }}>{r.name}</div>
                    <Text type="secondary" style={{ fontSize: 11 }}>{r.unitCount} bộ phận</Text>
                </div>
            )
        },
        {
            title: "Bộ hồ sơ (7 mục)",
            width: 220,
            render: (_: any, r: Department) => {
                const c = getCompleted(r.setup);
                const p = Math.round((c / TOTAL) * 100);
                return (
                    <div>
                        <div className="db-pct-row">
                            <Text type="secondary" style={{ fontSize: 12 }}>{c} / {TOTAL} mục</Text>
                            <Text style={{ fontSize: 12, fontWeight: 600, color: p === 100 ? "#389e0d" : "#f2547d" }}>{p}%</Text>
                        </div>
                        <Progress percent={p} size="small" showInfo={false}
                            strokeColor={p === 100 ? "#52c41a" : "#f2547d"} trailColor="#f5f5f5" />
                        <div className="db-dots">
                            {setupKeys.map(k => (
                                <span key={k} className={`db-dot ${r.setup[k] ? "on" : "off"}`} title={setupFields[k]} />
                            ))}
                        </div>
                    </div>
                );
            }
        },
        {
            title: "Mục còn thiếu",
            render: (_: any, r: Department) => {
                const m = getMissing(r.setup);
                return m.length === 0
                    ? <span className="db-chip-ok">
                        <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                            <circle cx="6" cy="6" r="6" fill="#52c41a" />
                            <path d="M3.5 6L5.2 7.8L8.5 4.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        Đã hoàn tất
                    </span>
                    : <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                        {m.map(i => <span key={i} className="db-chip">{i}</span>)}
                    </div>;
            }
        }
    ];

    const kpis = [
        { label: "Công ty", value: companyCount, icon: "M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" },
        { label: "Phòng ban", value: departmentCount, icon: "M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8z" },
        { label: "Bộ phận", value: unitCount, icon: "M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" },
        { label: "Hồ sơ hoàn thành", value: completedProfile, icon: "M9 11l3 3L22 4M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" },
        { label: "Hồ sơ còn thiếu", value: missingProfile, icon: "M12 9v4M12 17h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" },
    ];

    return (
        <PageContainer title="Dashboard">
            <style>{S}</style>

            {/* KPI */}
            <div className="db-sec">Tổng quan</div>
            <div className="db-grid">
                {kpis.map((k, i) => (
                    <div key={k.label} className="db-kpi">
                        <div className="db-kpi-top">
                            <div className="db-kpi-icon"><Ico d={k.icon} size={15} /></div>
                            <div style={{ display: "flex", alignItems: "flex-end", gap: 2, height: 18 }}>
                                {sparks[i].map((h, j) => (
                                    <span key={j} style={{ display: "block", width: 3, height: h, borderRadius: 2, background: "#e8e8e8" }} />
                                ))}
                            </div>
                        </div>
                        <div className="db-kpi-label">{k.label}</div>
                        <div className="db-kpi-num">{k.value}</div>
                    </div>
                ))}
            </div>

            {/* Charts */}
            <div className="db-sec">Phân tích</div>
            <div className="db-chart-grid">
                <div className="db-card">
                    <div className="db-card-head">
                        <span className="db-card-title">Tỉ lệ hoàn thành hồ sơ</span>
                        <span className="db-card-badge">{completedProfile}/{totalProfile}</span>
                    </div>
                    <div className="db-card-body"><Pie {...pieConfig} /></div>
                </div>
                <div className="db-card">
                    <div className="db-card-head">
                        <span className="db-card-title">Tiến độ theo phòng ban</span>
                        <span className="db-card-badge">7 mục / phòng</span>
                    </div>
                    <div className="db-card-body"><Column {...columnConfig} /></div>
                </div>
            </div>

            {/* Table */}
            <div className="db-sec">Chi tiết</div>
            <div className="db-card db-table">
                {/* Scroll wrapper for horizontal overflow on mobile */}
                <div className="db-table-scroll">
                    <Table
                        columns={cols}
                        dataSource={departments}
                        rowKey="key"
                        pagination={false}
                        size="middle"
                        scroll={{ x: 700 }}
                    />
                </div>
            </div>

        </PageContainer>
    );
};

export default DashboardPage;