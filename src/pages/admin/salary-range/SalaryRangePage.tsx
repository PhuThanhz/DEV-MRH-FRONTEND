import { useParams, useSearchParams } from "react-router-dom";
import { Card, Spin, Tabs, Tag } from "antd";
import { useState, useEffect } from "react";

import PageContainer from "@/components/common/data-table/PageContainer";
import { useSalaryMatrixQuery, useMyDepartmentMatrixQuery } from "@/hooks/useSalaryStructure";
import useAccess from "@/hooks/useAccess";
import { ALL_PERMISSIONS } from "@/config/permissions";

import EditableRowMonth from "./EditableRowMonth";
import EditableRowHour from "./EditableRowHour";
import ReadOnlyRowMonth from "./ReadOnlyRowMonth";
import ReadOnlyRowHour from "./ReadOnlyRowHour";
import { useDeptNavPages } from "@/hooks/useDeptNavPages";

import type { ISalaryMatrix } from "@/types/backend";
import DeptPageNav from "@/components/common/navigation/DeptPageNav";

const GRADE_COLORS = [
    { bg: "#fff0f6", border: "#ffadd2", color: "#c41d7f" },
    { bg: "#fff0f6", border: "#ffadd2", color: "#c41d7f" },
    { bg: "#fff0f6", border: "#ffadd2", color: "#c41d7f" },
    { bg: "#fff0f6", border: "#ffadd2", color: "#c41d7f" },
    { bg: "#fff0f6", border: "#ffadd2", color: "#c41d7f" },
    { bg: "#fff0f6", border: "#ffadd2", color: "#c41d7f" },
];

const getGradeStyle = (level: number) =>
    GRADE_COLORS[Math.min(level - 1, GRADE_COLORS.length - 1)];

const groupMatrix = (matrix: ISalaryMatrix[]) =>
    matrix.map((jt) => ({
        ...jt,
        rows: jt.grades.map((g) => ({
            gradeId: g.gradeId,
            gradeLevel: g.gradeLevel,
            structure: g.structure ?? {},
        })),
    }));

const SalaryRangePage = () => {
    const { departmentId } = useParams();
    const [searchParams] = useSearchParams();
    const departmentName = searchParams.get("departmentName") ?? "";

    // ── Check quyền
    const canViewMatrix = useAccess(ALL_PERMISSIONS.SALARY_RANGE.VIEW);
    const canViewMy = useAccess(ALL_PERMISSIONS.SALARY_RANGE.VIEW_MY);

    // isReadOnly = user thường / trưởng phòng — chỉ xem, không edit
    const isReadOnly = !canViewMatrix && canViewMy;
    const deptNavPages = useDeptNavPages();

    // ── Fetch data theo quyền
    const { data: matrix, isFetching: fetchingMatrix } =
        useSalaryMatrixQuery(canViewMatrix ? Number(departmentId) : undefined);

    const { data: myMatrix, isFetching: fetchingMy } =
        useMyDepartmentMatrixQuery(!canViewMatrix && canViewMy ? Number(departmentId) : undefined);

    const isFetching = canViewMatrix ? fetchingMatrix : fetchingMy;

    const [localGroups, setLocalGroups] = useState<any[]>([]);

    useEffect(() => {
        const data = canViewMatrix ? matrix : myMatrix;

        if (!data || !Array.isArray(data)) return;

        console.log("DATA:", data); // debug

        setLocalGroups(groupMatrix(data));
    }, [matrix, myMatrix, canViewMatrix]);

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
                <th className="sticky-col-2 th-meta" rowSpan={2}>Chức danh</th>
                <th className="th-meta" rowSpan={2}>Bậc lương chức danh</th>
                <th colSpan={6} className="group-header income-group">
                    {type === "MONTH" ? "Thu nhập cố định" : "Thu nhập theo giờ"}
                </th>
                <th colSpan={4} className="group-header kpi-group">Thưởng hiệu quả công việc</th>
                {!isReadOnly && <th className="th-meta" rowSpan={2}>Hành động</th>}
            </tr>
            <tr>
                {type === "MONTH" ? (
                    <>
                        <th className="sub-header income-sub">Mức lương</th>
                        <th className="sub-header income-sub">Phụ cấp chức vụ/ chức danh</th>
                        <th className="sub-header income-sub">Tiền ăn giữa ca (theo ngày/giờ công)</th>
                        <th className="sub-header income-sub">Hỗ trợ xăng xe</th>
                        <th className="sub-header income-sub">Hỗ trợ điện thoại</th>
                        <th className="sub-header income-sub">Khoản hỗ trợ khác (theo quy định)</th>
                    </>
                ) : (
                    <>
                        <th className="sub-header income-sub">Lương giờ</th>
                        <th className="sub-header income-sub">Phụ cấp giờ</th>
                        <th className="sub-header income-sub">Tiền ăn giờ</th>
                        <th className="sub-header income-sub">Xăng xe giờ</th>
                        <th className="sub-header income-sub">Điện thoại giờ</th>
                        <th className="sub-header income-sub">Khác giờ</th>
                    </>
                )}
                <th className="sub-header kpi-sub">A</th>
                <th className="sub-header kpi-sub">B</th>
                <th className="sub-header kpi-sub">C</th>
                <th className="sub-header kpi-sub">D</th>
            </tr>
        </thead>
    );

    const tableBody = (type: "MONTH" | "HOUR") => (
        <tbody>
            {localGroups.length === 0 ? (
                <tr>
                    <td colSpan={isReadOnly ? 12 : 13} className="empty-state">
                        <div className="empty-inner">
                            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#d9d9d9" strokeWidth="1.5">
                                <rect x="3" y="3" width="18" height="18" rx="3" />
                                <path d="M9 9h6M9 12h6M9 15h4" />
                            </svg>
                            <span>Không có dữ liệu</span>
                        </div>
                    </td>
                </tr>
            ) : (
                localGroups.map((jt) =>
                    jt.rows.map((row: any, idx: number) => {
                        const gradeStyle = getGradeStyle(row.gradeLevel);
                        return (
                            <tr key={`${type}-${jt.jobTitleId}-${row.gradeId}`} className="data-row">
                                {idx === 0 && (
                                    <td rowSpan={jt.rows.length} className="sticky-col-2 job-title-col">
                                        <span className="job-title-text">{jt.jobTitleName}</span>
                                    </td>
                                )}
                                <td className="grade-col">
                                    <span
                                        className="grade-pill"
                                        style={{
                                            background: gradeStyle.bg,
                                            borderColor: gradeStyle.border,
                                            color: gradeStyle.color,
                                        }}
                                    >
                                        Bậc {row.gradeLevel}
                                    </span>
                                </td>

                                {isReadOnly ? (
                                    type === "MONTH" ? (
                                        <ReadOnlyRowMonth structure={row.structure} />
                                    ) : (
                                        <ReadOnlyRowHour structure={row.structure} />
                                    )
                                ) : (
                                    type === "MONTH" ? (
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
                                    )
                                )}
                            </tr>
                        );
                    })
                )
            )}
        </tbody>
    );

    const tabIcon = {
        MONTH: (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="4" width="18" height="18" rx="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
        ),
        HOUR: (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
            </svg>
        ),
    };

    return (
        <PageContainer title={`Cơ cấu thu nhập – ${departmentName}`}>
            <Card className="salary-range-card" bordered={false}>

                {/* Badge hiển thị khi user chỉ xem khung lương của mình */}
                {isReadOnly && (
                    <div style={{ padding: "12px 20px 0" }}>
                        <Tag color="blue" style={{ fontSize: 12 }}>
                            Khung lương của tôi
                        </Tag>
                    </div>
                )}

                {isFetching ? (
                    <div className="loading-wrapper">
                        <Spin size="large" />
                        <p className="loading-text">Đang tải dữ liệu...</p>
                    </div>
                ) : (
                    <Tabs
                        defaultActiveKey="MONTH"
                        className="salary-tabs"
                        items={[
                            {
                                key: "MONTH",
                                label: <span className="tab-label">{tabIcon.MONTH} Theo tháng công (HĐLĐ)</span>,
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
                                label: <span className="tab-label">{tabIcon.HOUR} Theo giờ công</span>,
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
                    .salary-range-card {
                        border-radius: 10px;
                        background: #ffffff;
                        box-shadow: 0 0 0 1px rgba(0,0,0,0.08), 0 2px 8px rgba(0,0,0,0.04);
                        overflow: hidden;
                    }
                    .salary-range-card .ant-card-body { padding: 0; }
                    .loading-wrapper {
                        display: flex; flex-direction: column;
                        align-items: center; justify-content: center;
                        padding: 100px 0; gap: 12px;
                    }
                    .loading-text { color: #9a9a9e; font-size: 13px; margin: 0; }
                    .salary-tabs > .ant-tabs-nav {
                        margin: 0; padding: 0 20px;
                        background: #ffffff;
                        border-bottom: 2px solid #f0f0f0;
                    }
                    .salary-tabs > .ant-tabs-nav::before { border: none; }
                    .salary-tabs .ant-tabs-tab {
                        padding: 14px 4px !important;
                        margin: 0 20px 0 0 !important;
                        font-size: 13px; font-weight: 500;
                        color: #8c8c8c !important;
                        border: none !important;
                        background: transparent !important;
                        transition: color 0.2s;
                    }
                    .salary-tabs .ant-tabs-tab:hover { color: #262626 !important; }
                    .salary-tabs .ant-tabs-tab-active .ant-tabs-tab-btn {
                        color: #262626 !important; font-weight: 600;
                    }
                    .salary-tabs .ant-tabs-ink-bar {
                        background: #262626 !important; height: 2px !important;
                    }
                    .salary-tabs .ant-tabs-content-holder {
                        background: #f5f5f5; padding: 16px 20px 20px;
                    }
                    .tab-label { display: inline-flex; align-items: center; gap: 7px; }
                    .table-container {
                        border: 1px solid #e8e8e8; border-radius: 6px;
                        overflow: hidden; background: white;
                        box-shadow: 0 1px 3px rgba(0,0,0,0.04);
                    }
                    .table-wrapper {
                        overflow-x: auto; overflow-y: auto; max-height: 68vh;
                    }
                    .table-wrapper::-webkit-scrollbar { width: 6px; height: 6px; }
                    .table-wrapper::-webkit-scrollbar-track { background: #f5f5f5; }
                    .table-wrapper::-webkit-scrollbar-thumb { background: #d9d9d9; border-radius: 999px; }
                    .table-wrapper::-webkit-scrollbar-thumb:hover { background: #bfbfbf; }
                    .salary-table {
                        width: 100%; border-collapse: collapse;
                        font-size: 13px; min-width: 1600px; background: white;
                    }
                    .salary-table th, .salary-table td {
                        border: 1px solid #bfbfbf;
                        padding: 10px 13px; text-align: center; background: white;
                    }
                    .salary-table thead th.th-meta {
                        background: #fafafa; color: #262626; font-weight: 600;
                        font-size: 13px; position: sticky; top: 0; z-index: 10;
                        white-space: nowrap; border-color: #e8e8e8;
                        border-bottom: 2px solid #e8e8e8;
                    }
                    .salary-table thead th.group-header {
                        font-size: 11px; font-weight: 700; letter-spacing: 0.8px;
                        text-transform: uppercase; padding: 9px 13px;
                        position: sticky; top: 0; z-index: 10; white-space: nowrap;
                    }
                    .salary-table thead th.group-header.income-group {
                        background: #fafafa; color: #000000; font-weight: 700;
                        border-bottom: 1px solid #e8e8e8;
                    }
                    .salary-table thead th.group-header.kpi-group {
                        background: #fafafa; color: #000000; font-weight: 700;
                        border-bottom: 1px solid #e8e8e8;
                    }
                    .salary-table thead th.sub-header {
                        font-size: 12px; font-weight: 500; position: sticky;
                        top: 0; z-index: 10; white-space: nowrap;
                        padding: 8px 13px; border-bottom: 2px solid #e8e8e8;
                    }
                    .salary-table thead th.sub-header.income-sub {
                        background: #fafafa; color: #262626; font-weight: 600;
                    }
                    .salary-table thead th.sub-header.kpi-sub {
                        background: #f0f0f0; color: #262626; font-weight: 600;
                    }
                    .sticky-col {
                        position: sticky; left: 0; z-index: 11 !important;
                        background: white; border-right: 1px solid #e8e8e8 !important;
                        box-shadow: 2px 0 4px rgba(0,0,0,0.04);
                    }
                    .sticky-col-2 {
                        position: sticky; left: 0; z-index: 11 !important;
                        background: white; border-right: 1px solid #e8e8e8 !important;
                        box-shadow: 2px 0 4px rgba(0,0,0,0.04);
                    }
                    .salary-table thead .sticky-col,
                    .salary-table thead .sticky-col-2 {
                        background: #fafafa; z-index: 12 !important;
                    }
                    .data-row td { transition: none; }
                    .band-col { min-width: 130px; }
                    .band-badge {
                        display: inline-flex; align-items: center; justify-content: center;
                        padding: 3px 10px; background: #fafafa; color: #434343;
                        border: 1px solid #d9d9d9; border-radius: 4px;
                        font-size: 12px; font-weight: 600; letter-spacing: 0.4px; white-space: nowrap;
                    }
                    .job-title-col { min-width: 200px; text-align: left; padding-left: 16px; }
                    .job-title-text { font-weight: 500; color: #262626; font-size: 13px; }
                    .grade-col { min-width: 90px; }
                    .grade-pill {
                        display: inline-block; padding: 2px 10px; border-radius: 4px;
                        font-size: 12px; font-weight: 600;
                        border: 1px solid transparent; white-space: nowrap;
                    }
                    .empty-state {
                        padding: 0 !important; background: #fafafa !important; border: none !important;
                    }
                    .empty-inner {
                        display: flex; flex-direction: column;
                        align-items: center; justify-content: center;
                        gap: 10px; padding: 72px 20px; color: #bfbfbf; font-size: 13px;
                    }
                    .num-col { min-width: 110px; font-size: 13px; color: #262626; }
                    .num-col.kpi { background: #fafafa !important; }
                    @media (max-width: 1200px) {
                        .salary-table { font-size: 12px; }
                        .salary-table th, .salary-table td { padding: 8px; }
                        .sticky-col-2 { left: 110px; }
                    }
                    @media print {
                        .table-wrapper { overflow: visible; max-height: none; }
                        .sticky-col, .sticky-col-2 { position: static; box-shadow: none; }
                    }
                `}</style>
            </Card>
            <DeptPageNav pages={deptNavPages} />
        </PageContainer>
    );
};

export default SalaryRangePage;