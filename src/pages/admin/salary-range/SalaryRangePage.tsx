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
import { useDepartmentByIdQuery } from "@/hooks/useDepartments";
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
    const paramDeptName = searchParams.get("departmentName");

    // Fetch department details to ensure we always have the name
    const { data: deptData } = useDepartmentByIdQuery(departmentId ? Number(departmentId) : undefined);

    // Use URL param first, then fetched data, then empty string
    const departmentName = paramDeptName || deptData?.name || "";

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
                <th className="sticky-col th-meta" rowSpan={2}>Chức danh</th>
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
                                    <td rowSpan={jt.rows.length} className="sticky-col job-title-col">
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
        <PageContainer title={departmentName ? `Cơ cấu thu nhập – ${departmentName}` : "Cơ cấu thu nhập"}>
            <Card className="salary-range-card" data-guide-id="dept-salary-range-content" variant="borderless">

                {/* Badge hiển thị khi user chỉ xem khung lương của mình */}
                {(!canViewMatrix && canViewMy) && (
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
                        border-radius: 12px;
                        background: #ffffff;
                        box-shadow: 0 6px 24px -8px rgba(0,0,0,0.08);
                        border: 1px solid #f0f0f0;
                        overflow: hidden;
                    }
                    .salary-range-card .ant-card-body { padding: 0; }
                    .loading-wrapper {
                        display: flex; flex-direction: column;
                        align-items: center; justify-content: center;
                        padding: 120px 0; gap: 16px;
                    }
                    .loading-text { color: #8c8c8c; font-size: 15px; margin: 0; font-weight: 500; }
                    
                    /* TABS - PREMIUM LOTUS THEME */
                    .salary-tabs > .ant-tabs-nav {
                        margin: 24px 0 24px 24px; padding: 4px;
                        background: #f5f5f5;
                        border-radius: 8px;
                        display: inline-flex;
                        width: fit-content;
                    }
                    .salary-tabs > .ant-tabs-nav::before { border: none; }
                    .salary-tabs .ant-tabs-tab {
                        padding: 8px 24px !important;
                        margin: 0 !important;
                        font-size: 14px; font-weight: 500;
                        color: #595959 !important;
                        border-radius: 6px;
                        transition: all 0.3s ease;
                    }
                    .salary-tabs .ant-tabs-tab:hover { color: #262626 !important; }
                    .salary-tabs .ant-tabs-tab-active {
                        background: #ffffff !important;
                        color: #eb2f96 !important;
                        box-shadow: 0 2px 8px rgba(0,0,0,0.08);
                    }
                    .salary-tabs .ant-tabs-tab-active .ant-tabs-tab-btn {
                        color: #eb2f96 !important; font-weight: 600;
                    }
                    .salary-tabs .ant-tabs-ink-bar { display: none !important; }
                    .salary-tabs .ant-tabs-content-holder {
                        background: #ffffff; padding: 0 24px 24px;
                    }
                    .tab-label { display: inline-flex; align-items: center; gap: 8px; }
                    
                    /* TABLE STYLING - MODERN ANTD EQUIVALENT */
                    .table-container {
                        border: 1px solid #f0f0f0;
                        border-radius: 8px;
                        overflow: hidden; background: white;
                    }
                    .table-wrapper {
                        overflow-x: auto; overflow-y: auto; max-height: 68vh;
                    }
                    .table-wrapper::-webkit-scrollbar { width: 8px; height: 8px; }
                    .table-wrapper::-webkit-scrollbar-track { background: #fafafa; }
                    .table-wrapper::-webkit-scrollbar-thumb { background: #d9d9d9; border-radius: 4px; }
                    .table-wrapper::-webkit-scrollbar-thumb:hover { background: #bfbfbf; }
                    
                    .salary-table {
                        width: 100%; border-collapse: separate; border-spacing: 0;
                        font-size: 14px; min-width: 1600px; background: white;
                    }
                    .salary-table th, .salary-table td {
                        border-right: 1px solid #f0f0f0;
                        border-bottom: 1px solid #f0f0f0;
                        padding: 16px; text-align: center; background: white;
                        color: #262626;
                        font-variant-numeric: tabular-nums;
                    }
                    .salary-table th:last-child, .salary-table td:last-child {
                        border-right: none;
                    }
                    
                    /* HEADERS - CLEAN AND AIRY */
                    .salary-table thead {
                        position: sticky; top: 0; z-index: 20;
                    }
                    .salary-table thead th {
                        font-weight: 600;
                        color: #262626;
                        background: #fafafa;
                        white-space: nowrap;
                        /* Fix header border missing in sticky mode */
                        box-shadow: inset 0 -1px 0 #f0f0f0, inset -1px 0 0 #f0f0f0;
                        border: none; /* Replace actual borders with box-shadow for sticky rendering */
                    }
                    .salary-table thead th.sub-header {
                        color: #595959; font-size: 13px;
                    }
                    
                    /* STICKY COLUMNS */
                    .sticky-col {
                        position: sticky; left: 0; z-index: 11 !important;
                        background: white; 
                        box-shadow: inset -1px 0 0 #f0f0f0; /* Use box-shadow instead of border */
                        border: none;
                    }
                    .salary-table thead .sticky-col {
                        background: #fafafa; z-index: 21 !important;
                        box-shadow: inset -1px 0 0 #f0f0f0, inset 0 -1px 0 #f0f0f0;
                    }
                    
                    .data-row td { transition: background 0.2s; }
                    .data-row:hover td { background: #fafafa; }
                    
                    /* BADGES AND TYPOGRAPHY */
                    .job-title-col { min-width: 200px; max-width: 250px; text-align: left; padding-left: 24px !important; }
                    .job-title-text { font-weight: 600; color: #262626; font-size: 14px; }
                    
                    .grade-col { min-width: 120px; }
                    .grade-pill {
                        display: inline-block; padding: 4px 14px; border-radius: 6px;
                        font-size: 12px; font-weight: 600; white-space: nowrap;
                        border: 1px solid transparent;
                    }
                    
                    /* EMPTY STATE */
                    .empty-state { padding: 0 !important; background: #ffffff !important; border: none !important; }
                    .empty-inner {
                        display: flex; flex-direction: column; align-items: center; justify-content: center;
                        gap: 16px; padding: 100px 20px; color: #bfbfbf; font-size: 14px;
                    }
                    
                    /* INPUT COLUMNS */
                    .num-col { min-width: 130px; font-size: 14px; color: #262626; }
                    
                    @media (max-width: 1200px) {
                        .salary-table { font-size: 13px; }
                        .salary-table th, .salary-table td { padding: 12px; }
                    }
                    @media (max-width: 768px) {
                        .salary-tabs > .ant-tabs-nav { margin: 16px 12px; }
                        .salary-tabs .ant-tabs-content-holder { padding: 0 12px 16px; }
                        
                        .salary-table th, .salary-table td { padding: 10px; }
                        .job-title-col { min-width: 120px; max-width: 140px; padding-left: 12px !important; }
                        .grade-col { min-width: 90px; }
                        .num-col { min-width: 110px; }
                        .grade-pill { padding: 2px 8px; font-size: 11px; }
                    }
                    @media print {
                        .table-wrapper { overflow: visible; max-height: none; }
                        .sticky-col { position: static; box-shadow: none; border-right: 1px solid #f0f0f0 !important; }
                    }
                `}</style>
            </Card>
            <DeptPageNav pages={deptNavPages} />
        </PageContainer>
    );
};

export default SalaryRangePage;