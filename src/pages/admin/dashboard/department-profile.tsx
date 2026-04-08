import { useRef, useState, useMemo } from "react";
import type { ProColumns, ActionType } from "@ant-design/pro-components";
import { Tag } from "antd";
import { useNavigate } from "react-router-dom";

import PageContainer from "@/components/common/data-table/PageContainer";
import DataTable from "@/components/common/data-table";
import SearchFilter from "@/components/common/filter/SearchFilter";
import AdvancedFilterSelect from "@/components/common/filter/AdvancedFilterSelect";

import type { IDepartmentCompleteness } from "@/types/backend";
import { useDepartmentCompletenessQuery } from "@/hooks/useDashboard";

/* ─────────────────────── Score badge ─────────────────────── */
const ScoreBadge = ({ score }: { score: number }) => {
    const style =
        score === 7
            ? { background: "#f6ffed", color: "#389e0d", border: "1px solid #b7eb8f" }
            : score >= 4
                ? { background: "#fffbe6", color: "#d48806", border: "1px solid #ffe58f" }
                : { background: "#fff1f0", color: "#cf1322", border: "1px solid #ffccc7" };
    return (
        <Tag
            style={{
                ...style,
                fontWeight: 700,
                borderRadius: 20,
                padding: "0 10px",
                fontSize: 12,
                margin: 0,
            }}
        >
            {score}/7
        </Tag>
    );
};

/* ─────────────────────── 7 criteria ─────────────────────── */
const CRITERIA: { key: keyof IDepartmentCompleteness; label: string }[] = [
    { key: "jobTitleMap", label: "Chức danh" },
    { key: "careerPath", label: "Lộ trình" },
    { key: "salaryGrade", label: "Bậc lương" },
    { key: "objectives", label: "Mục tiêu" },
    { key: "departmentProcedure", label: "Quy trình" },
    { key: "orgChart", label: "Sơ đồ TC" },
    { key: "permissions", label: "Phân quyền" },
];

/* ─────────────────────── Missing tags cell ─────────────────────── */
// Chỉ highlight mục THIẾU, mục có rồi thì ẩn đi — bớt rối mắt
const MissingTagsCell = ({ record }: { record: IDepartmentCompleteness }) => {
    const missing = CRITERIA.filter(c => !record[c.key]);

    if (missing.length === 0) {
        return (
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{
                    width: 7, height: 7, borderRadius: "50%",
                    background: "#52c41a", display: "inline-block", flexShrink: 0,
                }} />
                <span style={{ fontSize: 12, color: "#52c41a", fontWeight: 600 }}>
                    Đầy đủ hồ sơ
                </span>
            </div>
        );
    }

    return (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
            {missing.map(c => (
                <Tag
                    key={String(c.key)}
                    style={{
                        margin: 0,
                        fontSize: 11,
                        fontWeight: 600,
                        borderRadius: 4,
                        padding: "1px 7px",
                        background: "#fff1f0",
                        color: "#cf1322",
                        border: "1px solid #ffccc7",
                    }}
                >
                    {c.label}
                </Tag>
            ))}
        </div>
    );
};

/* ─────────────────────── Back arrow ─────────────────────── */
const ArrowLeft = () => (
    <svg width={13} height={13} viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M19 12H5M12 19l-7-7 7-7" />
    </svg>
);

/* ─────────────────────── Component ─────────────────────── */
const DepartmentProfilePage = () => {
    const navigate = useNavigate();
    const tableRef = useRef<ActionType>(null);

    const { data: completeness, isLoading, refetch } = useDepartmentCompletenessQuery();

    const [searchValue, setSearchValue] = useState("");
    const [companyFilter, setCompanyFilter] = useState<string | null>(null);
    const [scoreFilter, setScoreFilter] = useState<string | null>(null);

    /* Danh sách công ty duy nhất */
    const companyOptions = useMemo(() => {
        if (!completeness) return [];
        const seen = new Set<string>();
        const result: { label: string; value: string }[] = [];
        completeness.forEach(d => {
            if (!seen.has(d.companyName)) {
                seen.add(d.companyName);
                result.push({ label: d.companyName, value: d.companyName });
            }
        });
        return result;
    }, [completeness]);

    /* Filter client-side */
    const dataSource = useMemo(() => {
        if (!completeness) return [];
        let list = [...completeness];

        if (searchValue.trim())
            list = list.filter(d =>
                d.departmentName.toLowerCase().includes(searchValue.trim().toLowerCase())
            );

        if (companyFilter)
            list = list.filter(d => d.companyName === companyFilter);

        if (scoreFilter === "full")
            list = list.filter(d => d.score === 7);
        else if (scoreFilter === "partial")
            list = list.filter(d => d.score > 0 && d.score < 7);
        else if (scoreFilter === "empty")
            list = list.filter(d => d.score === 0);

        return list;
    }, [completeness, searchValue, companyFilter, scoreFilter]);

    /* Stats */
    const totalFull = completeness?.filter(d => d.score === 7).length ?? 0;
    const totalDept = completeness?.length ?? 0;
    const missingCount = totalDept - totalFull;

    /* Columns — chỉ 4 cột, gọn hơn nhiều */
    const columns: ProColumns<IDepartmentCompleteness>[] = [
        {
            title: "STT",
            key: "index",
            width: 56,
            align: "center",
            render: (_text, _record, index) => (
                <span style={{ fontSize: 12, color: "#bfbfbf", fontWeight: 600 }}>
                    {index + 1}
                </span>
            ),
        },
        {
            title: "Phòng ban",
            dataIndex: "departmentName",
            width: 220,
            render: (_, record) => (
                <div>
                    <div style={{ fontWeight: 600, color: "#262626", fontSize: 13 }}>
                        {record.departmentName}
                    </div>
                    <div style={{ fontSize: 11, color: "#bfbfbf", marginTop: 2 }}>
                        {record.companyName}
                    </div>
                </div>
            ),
        },
        {
            title: "Mục còn thiếu trong bộ hồ sơ",
            key: "missing",
            render: (_, record) => <MissingTagsCell record={record} />,
        },
        {
            title: "Điểm",
            dataIndex: "score",
            align: "center",
            width: 150,
            sorter: (a, b) => a.score - b.score,
            render: (_, record) => {
                const pct = Math.round((record.score / 7) * 100);
                const barColor =
                    record.score === 7 ? "#52c41a"
                        : record.score === 0 ? "#e8e8e8"
                            : record.score < 4 ? "#faad14"
                                : "#1677ff";
                return (
                    <div style={{
                        display: "flex", alignItems: "center",
                        gap: 8, justifyContent: "center",
                    }}>
                        <div style={{
                            width: 56, height: 5, background: "#f0f0f0",
                            borderRadius: 99, overflow: "hidden", flexShrink: 0,
                        }}>
                            <div style={{
                                width: `${pct}%`, height: "100%",
                                background: barColor, borderRadius: 99,
                                transition: "width .4s",
                            }} />
                        </div>
                        <ScoreBadge score={record.score} />
                    </div>
                );
            },
        },
    ];

    return (
        <PageContainer
            title="Hồ sơ phòng ban"
            filter={
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    <button
                        onClick={() => navigate("/admin")}
                        style={{
                            display: "inline-flex", alignItems: "center", gap: 6,
                            fontSize: 12, fontWeight: 600, color: "#f2547d",
                            background: "none", border: "none", padding: 0,
                            cursor: "pointer", width: "fit-content",
                        }}
                    >
                        <ArrowLeft /> Về Dashboard
                    </button>

                    <SearchFilter
                        searchPlaceholder="Tìm tên phòng ban..."
                        showFilterButton={false}
                        showAddButton={false}
                        onSearch={(val) => setSearchValue(val)}
                        onReset={() => {
                            setSearchValue("");
                            setCompanyFilter(null);
                            setScoreFilter(null);
                            refetch();
                        }}
                    />

                    <AdvancedFilterSelect
                        fields={[
                            {
                                key: "company",
                                label: "Công ty",
                                options: companyOptions,
                            },
                            {
                                key: "score",
                                label: "Trạng thái hồ sơ",
                                options: [
                                    { label: "Hoàn chỉnh (7/7)", value: "full", color: "green" },
                                    { label: "Đang bổ sung", value: "partial", color: "orange" },
                                    { label: "Chưa có hồ sơ", value: "empty", color: "red" },
                                ],
                            },
                        ]}
                        onChange={(filters) => {
                            setCompanyFilter(filters.company || null);
                            setScoreFilter(filters.score || null);
                        }}
                    />

                    {/* Summary */}
                    {!isLoading && (
                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                            <Tag style={{ borderRadius: 20, fontWeight: 600, fontSize: 11 }}>
                                Tổng: {totalDept} phòng ban
                            </Tag>
                            <Tag color="success" style={{ borderRadius: 20, fontWeight: 600, fontSize: 11 }}>
                                Hoàn chỉnh: {totalFull}
                            </Tag>
                            <Tag color="error" style={{ borderRadius: 20, fontWeight: 600, fontSize: 11 }}>
                                Còn thiếu: {missingCount}
                            </Tag>
                        </div>
                    )}
                </div>
            }
        >
            <DataTable<IDepartmentCompleteness>
                actionRef={tableRef}
                rowKey="departmentId"
                loading={isLoading}
                columns={columns}
                dataSource={dataSource}
                request={async () => ({
                    data: dataSource,
                    success: true,
                    total: dataSource.length,
                })}
                pagination={{
                    defaultPageSize: 10,
                    showQuickJumper: true,
                    showTotal: (total, range) => (
                        <div style={{ fontSize: 13 }}>
                            <span style={{ fontWeight: 500 }}>{range[0]}–{range[1]}</span>
                            {" "}trên{" "}
                            <span style={{ fontWeight: 600, color: "#1677ff" }}>
                                {total.toLocaleString()}
                            </span>{" "}
                            phòng ban
                        </div>
                    ),
                }}
                rowSelection={false}
            />
        </PageContainer>
    );
};

export default DepartmentProfilePage;