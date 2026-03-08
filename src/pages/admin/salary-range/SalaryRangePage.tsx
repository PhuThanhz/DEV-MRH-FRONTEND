import { useParams, useSearchParams } from "react-router-dom";
import { Card, Spin, Tabs } from "antd";
import { useState, useEffect } from "react";

import PageContainer from "@/components/common/data-table/PageContainer";
import { useSalaryMatrixQuery } from "@/hooks/useSalaryStructure";

import EditableRowMonth from "./EditableRowMonth";
import EditableRowHour from "./EditableRowHour";

import type { ISalaryMatrix } from "@/types/backend";

/* ===== Group matrix theo jobTitle ===== */
const groupMatrix = (matrix: ISalaryMatrix[]) =>
    matrix.map((jt) => ({
        ...jt,
        rows: jt.grades.map((g) => ({
            gradeId: g.gradeId,
            gradeLevel: g.gradeLevel,
            structure: g.structure,
        })),
    }));

const SalaryRangePage = () => {
    const { departmentId } = useParams();
    const [searchParams] = useSearchParams();
    const departmentName = searchParams.get("departmentName") ?? "";

    const { data: matrix, isFetching } = useSalaryMatrixQuery(Number(departmentId));

    const [localGroups, setLocalGroups] = useState<any[]>([]);

    useEffect(() => {
        if (matrix) setLocalGroups(groupMatrix(matrix));
    }, [matrix]);

    const updateLocalStructure = (jobTitleId: number, gradeId: number, newStruct: any) => {
        setLocalGroups((prev) =>
            prev.map((jt) =>
                jt.jobTitleId !== jobTitleId
                    ? jt
                    : {
                        ...jt,
                        rows: jt.rows.map((r: any) =>
                            r.gradeId !== gradeId ? r : { ...r, structure: newStruct }
                        ),
                    }
            )
        );
    };

    const tableHeader = (type: "MONTH" | "HOUR") => (
        <thead>
            <tr>
                <th className="sticky-col th-first" rowSpan={2}>Cấp chức danh</th>
                <th className="sticky-col-2 th-first" rowSpan={2}>Chức danh</th>
                <th className="th-first" rowSpan={2}>Bậc</th>
                <th colSpan={6} className="group-header income-group">
                    {type === "MONTH" ? "Thu nhập cố định" : "Thu nhập theo giờ"}
                </th>
                <th colSpan={4} className="group-header kpi-group">KPI Thưởng</th>
                <th className="th-first" rowSpan={2}>Hành động</th>
            </tr>
            <tr>
                {type === "MONTH" ? (
                    <>
                        <th className="sub-header">Lương</th>
                        <th className="sub-header">Phụ cấp</th>
                        <th className="sub-header">Tiền ăn</th>
                        <th className="sub-header">Xăng xe</th>
                        <th className="sub-header">Điện thoại</th>
                        <th className="sub-header">Khác</th>
                    </>
                ) : (
                    <>
                        <th className="sub-header">Lương giờ</th>
                        <th className="sub-header">Phụ cấp giờ</th>
                        <th className="sub-header">Tiền ăn giờ</th>
                        <th className="sub-header">Xăng xe giờ</th>
                        <th className="sub-header">Điện thoại giờ</th>
                        <th className="sub-header">Khác giờ</th>
                    </>
                )}
                <th className="sub-header kpi-sub">KPI A</th>
                <th className="sub-header kpi-sub">KPI B</th>
                <th className="sub-header kpi-sub">KPI C</th>
                <th className="sub-header kpi-sub">KPI D</th>
            </tr>
        </thead>
    );

    const tableBody = (type: "MONTH" | "HOUR") => (
        <tbody>
            {localGroups.length === 0 ? (
                <tr>
                    <td colSpan={14} className="empty-state">
                        <div className="empty-inner">
                            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#d9d9d9" strokeWidth="1.5">
                                <rect x="3" y="3" width="18" height="18" rx="3" />
                                <path d="M9 9h6M9 12h6M9 15h4" />
                            </svg>
                            <span>Không có dữ liệu</span>
                        </div>
                    </td>
                </tr>
            ) : (
                localGroups.map((jt) =>
                    jt.rows.map((row: any, idx: number) => (
                        <tr key={`${type}-${jt.jobTitleId}-${row.gradeId}`} className="data-row">
                            {idx === 0 && (
                                <>
                                    <td rowSpan={jt.rows.length} className="sticky-col band-col">
                                        <span className="band-badge">{jt.band}{jt.level}</span>
                                    </td>
                                    <td rowSpan={jt.rows.length} className="sticky-col-2 job-title-col">
                                        <span className="job-title-text">{jt.jobTitleName}</span>
                                    </td>
                                </>
                            )}
                            <td className="grade-col">
                                <span className="grade-pill">Bậc {row.gradeLevel}</span>
                            </td>
                            {type === "MONTH" ? (
                                <EditableRowMonth
                                    jobTitleId={jt.jobTitleId}
                                    gradeId={row.gradeId}
                                    ownerLevel={jt.source}
                                    structure={row.structure}
                                    onSaved={(newStruct) =>
                                        updateLocalStructure(jt.jobTitleId, row.gradeId, newStruct)
                                    }
                                />
                            ) : (
                                <EditableRowHour
                                    jobTitleId={jt.jobTitleId}
                                    gradeId={row.gradeId}
                                    ownerLevel={jt.source}
                                    structure={row.structure}
                                    onSaved={(newStruct) =>
                                        updateLocalStructure(jt.jobTitleId, row.gradeId, newStruct)
                                    }
                                />
                            )}
                        </tr>
                    ))
                )
            )}
        </tbody>
    );

    return (
        <PageContainer title={`Cơ cấu thu nhập – ${departmentName}`}>
            <Card className="salary-range-card" bordered={false}>
                {isFetching ? (
                    <div className="loading-wrapper">
                        <Spin size="large" />
                        <p className="loading-text">Đang tải dữ liệu...</p>
                    </div>
                ) : (
                    <Tabs
                        type="card"
                        defaultActiveKey="MONTH"
                        className="salary-tabs"
                        items={[
                            {
                                key: "MONTH",
                                label: (
                                    <span className="tab-label">
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: 6, verticalAlign: 'middle' }}>
                                            <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
                                        </svg>
                                        Theo tháng công (HĐLĐ)
                                    </span>
                                ),
                                children: (
                                    <div className="table-container">
                                        <div className="table-wrapper">
                                            <table className="salary-table">
                                                {tableHeader("MONTH")}
                                                {tableBody("MONTH")}
                                            </table>
                                        </div>
                                    </div>
                                ),
                            },
                            {
                                key: "HOUR",
                                label: (
                                    <span className="tab-label">
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: 6, verticalAlign: 'middle' }}>
                                            <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
                                        </svg>
                                        Theo giờ công
                                    </span>
                                ),
                                children: (
                                    <div className="table-container">
                                        <div className="table-wrapper">
                                            <table className="salary-table">
                                                {tableHeader("HOUR")}
                                                {tableBody("HOUR")}
                                            </table>
                                        </div>
                                    </div>
                                ),
                            },
                        ]}
                    />
                )}

                <style>{`
                    /* ── Card wrapper ── */
                    .salary-range-card {
                        border-radius: 12px;
                        background: #ffffff;
                        box-shadow:
                            0 0 0 1px rgba(0,0,0,0.06),
                            0 2px 4px rgba(0,0,0,0.04),
                            0 8px 24px rgba(0,0,0,0.06);
                        overflow: hidden;
                    }
                    .salary-range-card .ant-card-body {
                        padding: 0;
                    }

                    /* ── Loading ── */
                    .loading-wrapper {
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        justify-content: center;
                        padding: 100px 0;
                        gap: 14px;
                    }
                    .loading-text {
                        color: #bbb;
                        font-size: 13px;
                        margin: 0;
                        letter-spacing: 0.2px;
                    }

                    /* ── Tabs nav ── */
                    .salary-tabs .ant-tabs-nav {
                        margin: 0;
                        padding: 16px 20px 0;
                        background: #f5f5f7;
                        border-bottom: 1px solid #e8e8ea;
                    }
                    .salary-tabs .ant-tabs-nav::before { border-bottom: none; }
                    .salary-tabs .ant-tabs-tab {
                        border-radius: 8px 8px 0 0 !important;
                        background: #eeeef0 !important;
                        border: 1px solid #e2e2e4 !important;
                        border-bottom: none !important;
                        padding: 9px 18px !important;
                        font-size: 13px;
                        font-weight: 400;
                        color: #999 !important;
                        margin-right: 3px;
                        transition: all 0.15s ease;
                    }
                    .salary-tabs .ant-tabs-tab:hover {
                        color: #444 !important;
                        background: #f2f2f4 !important;
                    }
                    .salary-tabs .ant-tabs-tab-active {
                        background: #ffffff !important;
                        color: #1d1d1f !important;
                        border-color: #e2e2e4 !important;
                        font-weight: 500;
                    }
                    .salary-tabs .ant-tabs-tab-active .ant-tabs-tab-btn {
                        color: #1d1d1f !important;
                    }
                    .salary-tabs .ant-tabs-ink-bar { display: none; }
                    .salary-tabs .ant-tabs-content-holder {
                        background: #ffffff;
                        padding: 20px;
                    }
                    .tab-label {
                        display: inline-flex;
                        align-items: center;
                        gap: 6px;
                    }

                    /* ── Table container ── */
                    .table-container {
                        border: 1px solid #e8e8ea;
                        border-radius: 10px;
                        overflow: hidden;
                        background: white;
                    }
                    .table-wrapper {
                        overflow-x: auto;
                        overflow-y: auto;
                        max-height: 68vh;
                    }
                    .table-wrapper::-webkit-scrollbar { width: 5px; height: 5px; }
                    .table-wrapper::-webkit-scrollbar-track { background: transparent; }
                    .table-wrapper::-webkit-scrollbar-thumb {
                        background: #d8d8da;
                        border-radius: 999px;
                    }
                    .table-wrapper::-webkit-scrollbar-thumb:hover { background: #c2c2c4; }

                    /* ── Table base ── */
                    .salary-table {
                        width: 100%;
                        border-collapse: collapse;
                        font-size: 13px;
                        min-width: 1600px;
                        background: white;
                    }
                    .salary-table th,
                    .salary-table td {
                        border: 1px solid #f0f0f2;
                        padding: 11px 14px;
                        text-align: center;
                        background: white;
                    }

                    /* ── Header rows ── */
                    .salary-table thead th {
                        background: #f5f5f7;
                        font-weight: 500;
                        color: #505050;
                        position: sticky;
                        top: 0;
                        z-index: 10;
                        white-space: nowrap;
                        font-size: 12.5px;
                    }
                    .salary-table thead th.th-first {
                        border-bottom: 1px solid #e5e5e7;
                    }
                    .salary-table thead th.group-header {
                        font-size: 10px;
                        font-weight: 600;
                        letter-spacing: 0.8px;
                        text-transform: uppercase;
                        padding: 9px 14px;
                        color: #888;
                        background: #f5f5f7;
                        border-bottom: 1px solid #e5e5e7;
                    }
                    .salary-table thead th.group-header.income-group {
                        border-left: 2px solid #f4c0cc;
                        color: #c07888;
                    }
                    .salary-table thead th.group-header.kpi-group {
                        border-left: 2px solid #e8ccd4;
                        color: #b09098;
                    }
                    .salary-table thead th.sub-header {
                        background: #fafafa;
                        font-size: 11px;
                        font-weight: 400;
                        color: #aaa;
                        border-bottom: 1px solid #e8e8ea;
                    }
                    .salary-table thead th.sub-header.kpi-sub {
                        color: #c0a0a8;
                    }

                    /* ── Sticky columns ── */
                    .sticky-col {
                        position: sticky;
                        left: 0;
                        z-index: 11 !important;
                        background: white;
                        border-right: 1px solid #ebebed !important;
                        box-shadow: 2px 0 8px rgba(0,0,0,0.04);
                    }
                    .sticky-col-2 {
                        position: sticky;
                        left: 130px;
                        z-index: 11 !important;
                        background: white;
                        border-right: 1px solid #ebebed !important;
                        box-shadow: 2px 0 8px rgba(0,0,0,0.04);
                    }
                    .salary-table thead .sticky-col,
                    .salary-table thead .sticky-col-2 {
                        background: #f5f5f7;
                        z-index: 12 !important;
                    }

                    /* ── Body rows ── */
                    .data-row { transition: background 0.1s ease; }
                    .data-row:hover td { background: #fafafa !important; }
                    .data-row:hover .sticky-col,
                    .data-row:hover .sticky-col-2 { background: #f5f5f7 !important; }

                    /* ── Band badge ── */
                    .band-col { min-width: 130px; }
                    .band-badge {
                        display: inline-flex;
                        align-items: center;
                        justify-content: center;
                        padding: 3px 12px;
                        background: #fff5f7;
                        color: #b87888;
                        border: 1px solid #f0d4da;
                        border-radius: 5px;
                        font-size: 11px;
                        font-weight: 600;
                        letter-spacing: 0.5px;
                        white-space: nowrap;
                    }

                    /* ── Job title ── */
                    .job-title-col {
                        min-width: 200px;
                        text-align: left;
                        padding-left: 16px;
                    }
                    .job-title-text {
                        font-weight: 500;
                        color: #1d1d1f;
                        font-size: 13px;
                    }

                    /* ── Grade pill ── */
                    .grade-col { min-width: 90px; }
                    .grade-pill {
                        display: inline-block;
                        padding: 2px 10px;
                        background: #f5f5f7;
                        color: #888;
                        border-radius: 4px;
                        font-size: 12px;
                        font-weight: 400;
                        border: 1px solid #e8e8ea;
                    }

                    /* ── Empty state ── */
                    .empty-state {
                        padding: 0 !important;
                        background: #fafafa !important;
                    }
                    .empty-inner {
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        justify-content: center;
                        gap: 10px;
                        padding: 72px 20px;
                        color: #ccc;
                        font-size: 13px;
                        font-weight: 400;
                    }

                    /* ── Responsive ── */
                    @media (max-width: 1200px) {
                        .salary-table { font-size: 12px; }
                        .salary-table th, .salary-table td { padding: 9px 8px; }
                        .sticky-col-2 { left: 110px; }
                    }

                    /* ── Print ── */
                    @media print {
                        .table-wrapper { overflow: visible; max-height: none; }
                        .sticky-col, .sticky-col-2 { position: static; box-shadow: none; }
                    }
                `}</style>
            </Card>
        </PageContainer>
    );
};

export default SalaryRangePage;