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

    return (
        <PageContainer title={`Cơ cấu thu nhập – ${departmentName}`}>
            <Card
                className="salary-range-card"
                bordered={false}
            >
                {isFetching ? (
                    <div style={{ textAlign: "center", padding: 80 }}>
                        <Spin size="large" />
                    </div>
                ) : (
                    <Tabs
                        type="card"
                        defaultActiveKey="MONTH"
                        className="salary-tabs"
                        items={[
                            {
                                key: "MONTH",
                                label: "Theo tháng công (HĐLĐ)",
                                children: (
                                    <div className="table-container">
                                        <div className="table-wrapper">
                                            <table className="salary-table">
                                                <thead>
                                                    <tr>
                                                        <th className="sticky-col" rowSpan={2}>Cấp chức danh</th>
                                                        <th className="sticky-col-2" rowSpan={2}>Chức danh</th>
                                                        <th rowSpan={2}>Bậc</th>
                                                        <th colSpan={6} className="group-header income-group">Thu nhập cố định</th>
                                                        <th colSpan={4} className="group-header kpi-group">KPI Thưởng</th>
                                                        <th rowSpan={2}>Hành động</th>
                                                    </tr>
                                                    <tr>
                                                        <th className="sub-header">Lương</th>
                                                        <th className="sub-header">Phụ cấp</th>
                                                        <th className="sub-header">Tiền ăn</th>
                                                        <th className="sub-header">Xăng xe</th>
                                                        <th className="sub-header">Điện thoại</th>
                                                        <th className="sub-header">Khác</th>
                                                        <th className="sub-header kpi-sub">KPI A</th>
                                                        <th className="sub-header kpi-sub">KPI B</th>
                                                        <th className="sub-header kpi-sub">KPI C</th>
                                                        <th className="sub-header kpi-sub">KPI D</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {localGroups.length === 0 ? (
                                                        <tr>
                                                            <td colSpan={14} className="empty-state">Không có dữ liệu</td>
                                                        </tr>
                                                    ) : (
                                                        localGroups.map((jt) =>
                                                            jt.rows.map((row: any, idx: number) => (
                                                                <tr key={`M-${jt.jobTitleId}-${row.gradeId}`}>
                                                                    {idx === 0 && (
                                                                        <>
                                                                            <td rowSpan={jt.rows.length} className="sticky-col band-col">
                                                                                <span className="band-badge">{jt.band}{jt.level}</span>
                                                                            </td>
                                                                            <td rowSpan={jt.rows.length} className="sticky-col-2 job-title-col">
                                                                                {jt.jobTitleName}
                                                                            </td>
                                                                        </>
                                                                    )}
                                                                    <td className="grade-col">Bậc {row.gradeLevel}</td>
                                                                    <EditableRowMonth
                                                                        jobTitleId={jt.jobTitleId}
                                                                        gradeId={row.gradeId}
                                                                        ownerLevel={jt.source}
                                                                        structure={row.structure}
                                                                        onSaved={(newStruct) =>
                                                                            updateLocalStructure(jt.jobTitleId, row.gradeId, newStruct)
                                                                        }
                                                                    />
                                                                </tr>
                                                            ))
                                                        )
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                ),
                            },
                            {
                                key: "HOUR",
                                label: "Theo giờ công",
                                children: (
                                    <div className="table-container">
                                        <div className="table-wrapper">
                                            <table className="salary-table">
                                                <thead>
                                                    <tr>
                                                        <th className="sticky-col" rowSpan={2}>Cấp chức danh</th>
                                                        <th className="sticky-col-2" rowSpan={2}>Chức danh</th>
                                                        <th rowSpan={2}>Bậc</th>
                                                        <th colSpan={6} className="group-header income-group">Thu nhập theo giờ</th>
                                                        <th colSpan={4} className="group-header kpi-group">KPI Thưởng</th>
                                                        <th rowSpan={2}>Hành động</th>
                                                    </tr>
                                                    <tr>
                                                        <th className="sub-header">Lương giờ</th>
                                                        <th className="sub-header">Phụ cấp giờ</th>
                                                        <th className="sub-header">Tiền ăn giờ</th>
                                                        <th className="sub-header">Xăng xe giờ</th>
                                                        <th className="sub-header">Điện thoại giờ</th>
                                                        <th className="sub-header">Khác giờ</th>
                                                        <th className="sub-header kpi-sub">KPI A</th>
                                                        <th className="sub-header kpi-sub">KPI B</th>
                                                        <th className="sub-header kpi-sub">KPI C</th>
                                                        <th className="sub-header kpi-sub">KPI D</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {localGroups.length === 0 ? (
                                                        <tr>
                                                            <td colSpan={14} className="empty-state">Không có dữ liệu</td>
                                                        </tr>
                                                    ) : (
                                                        localGroups.map((jt) =>
                                                            jt.rows.map((row: any, idx: number) => (
                                                                <tr key={`H-${jt.jobTitleId}-${row.gradeId}`}>
                                                                    {idx === 0 && (
                                                                        <>
                                                                            <td rowSpan={jt.rows.length} className="sticky-col band-col">
                                                                                <span className="band-badge">{jt.band}{jt.level}</span>
                                                                            </td>
                                                                            <td rowSpan={jt.rows.length} className="sticky-col-2 job-title-col">
                                                                                {jt.jobTitleName}
                                                                            </td>
                                                                        </>
                                                                    )}
                                                                    <td className="grade-col">Bậc {row.gradeLevel}</td>
                                                                    <EditableRowHour
                                                                        jobTitleId={jt.jobTitleId}
                                                                        gradeId={row.gradeId}
                                                                        ownerLevel={jt.source}
                                                                        structure={row.structure}
                                                                        onSaved={(newStruct) =>
                                                                            updateLocalStructure(jt.jobTitleId, row.gradeId, newStruct)
                                                                        }
                                                                    />
                                                                </tr>
                                                            ))
                                                        )
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                ),
                            },
                        ]}
                    />
                )}

                <style>
                    {`
                        .salary-range-card {
                            border-radius: 12px;
                            box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03), 0 2px 8px rgba(0, 0, 0, 0.02);
                        }

                        .salary-range-card .ant-card-body {
                            padding: 0;
                        }

                        .salary-tabs .ant-tabs-nav {
                            margin: 0;
                            padding: 16px 20px 0;
                            background: #fafafa;
                            border-bottom: 1px solid #e0e0e0;
                        }

                        .salary-tabs .ant-tabs-tab {
                            border-radius: 8px 8px 0 0;
                            background: white;
                            border: none;
                            padding: 10px 20px;
                            font-size: 14px;
                            font-weight: 500;
                            color: #595959;
                            transition: all 0.2s ease;
                        }

                        .salary-tabs .ant-tabs-tab:hover {
                            color: #262626;
                        }

                        .salary-tabs .ant-tabs-tab-active {
                            background: white;
                            color: #262626;
                        }

                        .salary-tabs .ant-tabs-content-holder {
                            background: white;
                            padding: 20px;
                        }

                        .table-container {
                            border: 1px solid #e0e0e0;
                            border-radius: 10px;
                            overflow: hidden;
                            background: white;
                        }

                        .table-wrapper {
                            overflow-x: auto;
                            overflow-y: auto;
                            max-height: 70vh;
                        }

                        .table-wrapper::-webkit-scrollbar {
                            width: 8px;
                            height: 8px;
                        }

                        .table-wrapper::-webkit-scrollbar-track {
                            background: transparent;
                        }

                        .table-wrapper::-webkit-scrollbar-thumb {
                            background: #d0d0d0;
                            border-radius: 4px;
                        }

                        .table-wrapper::-webkit-scrollbar-thumb:hover {
                            background: #bfbfbf;
                        }

                        .salary-table {
                            width: 100%;
                            border-collapse: collapse;
                            font-size: 13px;
                            min-width: 1600px;
                            background: white;
                        }

                        .salary-table th,
                        .salary-table td {
                            border: 1px solid #e8e8e8;
                            padding: 12px 10px;
                            text-align: center;
                            background: white;
                        }

                        .salary-table thead th {
                            background: #fafafa;
                            font-weight: 600;
                            color: #595959;
                            position: sticky;
                            top: 0;
                            z-index: 10;
                            white-space: nowrap;
                            border-bottom: 1.5px solid #d9d9d9;
                        }

                        .salary-table thead th.group-header {
                            background: #f5f5f5;
                            color: #595959;
                            font-size: 12px;
                            font-weight: 700;
                            padding: 10px;
                            text-transform: uppercase;
                            letter-spacing: 0.3px;
                            border-bottom: 2px solid #d0d0d0;
                        }

                        .salary-table thead th.group-header.income-group {
                            border-left: 2px solid #eb2f96;
                        }

                        .salary-table thead th.group-header.kpi-group {
                            border-left: 2px solid #ffadd2;
                        }

                        .salary-table thead th.sub-header {
                            background: #fafafa;
                            font-size: 12px;
                            font-weight: 600;
                            color: #8c8c8c;
                            padding: 9px 8px;
                        }

                        .salary-table thead th.sub-header.kpi-sub {
                            color: #eb2f96;
                        }

                        .sticky-col {
                            position: sticky;
                            left: 0;
                            z-index: 11 !important;
                            background: white;
                            box-shadow: 2px 0 4px rgba(0, 0, 0, 0.04);
                            border-right: 1.5px solid #e0e0e0;
                        }

                        .sticky-col-2 {
                            position: sticky;
                            left: 130px;
                            z-index: 11 !important;
                            background: white;
                            box-shadow: 2px 0 4px rgba(0, 0, 0, 0.04);
                            border-right: 1.5px solid #e0e0e0;
                        }

                        .salary-table thead .sticky-col,
                        .salary-table thead .sticky-col-2 {
                            background: #fafafa;
                            z-index: 12 !important;
                        }

                        .salary-table tbody tr:hover td {
                            background: #fafafa;
                        }

                        .salary-table tbody tr:hover .sticky-col,
                        .salary-table tbody tr:hover .sticky-col-2 {
                            background: #f5f5f5;
                        }

                        .band-col {
                            min-width: 130px;
                            font-weight: 600;
                        }

                        .band-badge {
                            display: inline-block;
                            padding: 5px 14px;
                            background: linear-gradient(135deg, #ffc1e3 0%, #ff85c0 100%);
                            color: white;
                            border-radius: 6px;
                            font-size: 12px;
                            font-weight: 600;
                            letter-spacing: 0.5px;
                        }

                        .job-title-col {
                            min-width: 200px;
                            text-align: left;
                            padding-left: 16px;
                            font-weight: 600;
                            color: #262626;
                        }

                        .grade-col {
                            min-width: 90px;
                            font-weight: 500;
                            color: #595959;
                        }

                        .empty-state {
                            padding: 60px 20px !important;
                            color: #8c8c8c;
                            font-size: 14px;
                            background: #fafafa !important;
                        }

                        @media (max-width: 1200px) {
                            .salary-table {
                                font-size: 12px;
                            }
                            .salary-table th,
                            .salary-table td {
                                padding: 9px 8px;
                            }
                            .sticky-col-2 {
                                left: 110px;
                            }
                        }

                        @media print {
                            .table-wrapper {
                                overflow: visible;
                                max-height: none;
                            }
                            .sticky-col,
                            .sticky-col-2 {
                                position: static;
                                box-shadow: none;
                            }
                        }
                    `}
                </style>
            </Card>
        </PageContainer>
    );
};

export default SalaryRangePage;