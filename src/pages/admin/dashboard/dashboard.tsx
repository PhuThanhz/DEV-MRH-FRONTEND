import { useRef, useState, useMemo } from "react";
import type { ProColumns, ActionType } from "@ant-design/pro-components";
import { Tag, Button, Tooltip, Skeleton } from "antd";
import {
    ArrowLeftOutlined,
    EyeOutlined,
    CheckCircleFilled,
    ClusterOutlined,
    ExclamationCircleFilled,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";

import PageContainer from "@/components/common/data-table/PageContainer";
import DataTable from "@/components/common/data-table";
import SearchFilter from "@/components/common/filter/SearchFilter";
import AdvancedFilterSelect from "@/components/common/filter/AdvancedFilterSelect";

import type { IDepartmentCompleteness } from "@/types/backend";
import { useDepartmentCompletenessQuery } from "@/hooks/useDashboard";
import ViewDepartmentCompleteness from "./view.departmentcompleteness";

/* ─────────────────────────────────────────────────────────────
   Constants
───────────────────────────────────────────────────────────── */
const CRITERIA: { key: keyof IDepartmentCompleteness; label: string }[] = [
    { key: "jobTitleMap", label: "Chức danh" },
    { key: "careerPath", label: "Lộ trình" },
    { key: "salaryGrade", label: "Bậc lương" },
    { key: "objectives", label: "Mục tiêu" },
    { key: "departmentProcedure", label: "Quy trình" },
    { key: "orgChart", label: "Sơ đồ TC" },
    { key: "permissions", label: "Phân quyền" },
];

type ScoreFilterValue = "all" | "full" | "partial" | "empty" | "missing";

/* ─────────────────────────────────────────────────────────────
   Sub-components
───────────────────────────────────────────────────────────── */

/** Badge điểm tròn */
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
                lineHeight: "22px",
                whiteSpace: "nowrap",
            }}
        >
            {score}/7
        </Tag>
    );
};

/** Progress bar + badge gộp lại */
const ScoreCell = ({ record }: { record: IDepartmentCompleteness }) => {
    const pct = Math.round((record.score / 7) * 100);
    const barColor =
        record.score === 7 ? "#52c41a"
            : record.score === 0 ? "#e8e8e8"
                : record.score < 4 ? "#faad14"
                    : "#1677ff";
    return (
        <div style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "center" }}>
            <div
                style={{
                    width: 52,
                    height: 5,
                    background: "#f0f0f0",
                    borderRadius: 99,
                    overflow: "hidden",
                    flexShrink: 0,
                    border: "0.5px solid #e0e0e0",
                }}
            >
                <div
                    style={{
                        width: `${pct}%`,
                        height: "100%",
                        background: barColor,
                        borderRadius: 99,
                        transition: "width .4s",
                    }}
                />
            </div>
            <ScoreBadge score={record.score} />
        </div>
    );
};

/** Cột hạng mục thiếu */
const MissingTagsCell = ({ record }: { record: IDepartmentCompleteness }) => {
    const missing = CRITERIA.filter((c) => !record[c.key]);

    if (missing.length === 0) {
        return (
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <CheckCircleFilled style={{ color: "#52c41a", fontSize: 13 }} />
                <span style={{ fontSize: 12, color: "#52c41a", fontWeight: 600 }}>
                    Đầy đủ hồ sơ
                </span>
            </div>
        );
    }

    return (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
            {CRITERIA.map((c) => {
                const done = !!record[c.key];
                return (
                    <Tag
                        key={String(c.key)}
                        style={{
                            margin: 0,
                            fontSize: 11,
                            fontWeight: 600,
                            borderRadius: 4,
                            padding: "1px 7px",
                            lineHeight: "18px",
                            background: done ? "#f6ffed" : "#fff1f0",
                            color: done ? "#389e0d" : "#cf1322",
                            border: `1px solid ${done ? "#b7eb8f" : "#ffccc7"}`,
                        }}
                    >
                        {c.label}
                    </Tag>
                );
            })}
        </div>
    );
};

/** Cột mức ưu tiên */
const PriorityCell = ({ score }: { score: number }) => {
    if (score === 7)
        return (
            <Tag style={{ borderRadius: 4, fontSize: 11, fontWeight: 600, background: "#f6ffed", color: "#389e0d", border: "1px solid #b7eb8f", margin: 0, whiteSpace: "nowrap" }}>
                Đủ hồ sơ
            </Tag>
        );
    if (score === 0)
        return (
            <Tag style={{ borderRadius: 4, fontSize: 11, fontWeight: 600, background: "#fff1f0", color: "#cf1322", border: "1px solid #ffccc7", margin: 0, whiteSpace: "nowrap" }}>
                Khẩn
            </Tag>
        );
    if (score < 4)
        return (
            <Tag style={{ borderRadius: 4, fontSize: 11, fontWeight: 600, background: "#fff1f0", color: "#d46b08", border: "1px solid #ffd591", margin: 0, whiteSpace: "nowrap" }}>
                Cần bổ sung
            </Tag>
        );
    return (
        <Tag style={{ borderRadius: 4, fontSize: 11, fontWeight: 600, background: "#fffbe6", color: "#d48806", border: "1px solid #ffe58f", margin: 0, whiteSpace: "nowrap" }}>
            Bổ sung thêm
        </Tag>
    );
};

/** Stat card nhỏ — responsive: flex-1, minWidth 0, wrap từ parent */
const Ico = ({ d, size = 20 }: { d: string; size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d={d} />
    </svg>
);

const StatCard = ({
    label,
    value,
    accentColor,
    iconPath,
    loading,
    sub,
    subCls,
}: {
    label: string;
    value: number | string;
    accentColor: string;
    iconPath: string;
    loading?: boolean;
    sub?: string;
    subCls?: string;
}) => (
    <div
        style={{
            background: "#fff",
            borderRadius: 16,
            border: "1px solid #f0f0f0",
            padding: "20px 18px",
            boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
            transition: "all 0.18s",
            cursor: "default",
            display: "flex",
            alignItems: "center",
            gap: 14,
            flex: "1 1 250px",
            minWidth: 0,
        }}
        onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateY(-2px)";
            e.currentTarget.style.boxShadow = "0 6px 20px rgba(242,84,125,0.10)";
        }}
        onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow = "0 1px 4px rgba(0,0,0,0.04)";
        }}
    >
        {/* Icon */}
        <div style={{
            width: 48, height: 48, borderRadius: 13, background: "#fff0f4",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "#f2547d", flexShrink: 0
        }}>
            <Ico d={iconPath} size={20} />
        </div>

        {/* Body */}
        <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 11, color: "#8c8c8c", marginBottom: 4, fontWeight: 500, letterSpacing: "0.02em" }}>
                {label}
            </div>
            {loading ? (
                <Skeleton.Input active size="small" style={{ width: 60, height: 28 }} />
            ) : (
                <div style={{ fontSize: 28, fontWeight: 700, color: "#1a1a1a", letterSpacing: "-0.03em", lineHeight: 1 }}>
                    {value}
                </div>
            )}
            {/* Tag/Sub */}
            {sub && (
                <div style={{
                    fontSize: 11,
                    color: subCls === "danger" ? "#cf1322" : subCls === "warn" ? "#d46b08" : "#389e0d",
                    background: subCls === "danger" ? "#fff1f0" : subCls === "warn" ? "#fff7e6" : "#f6ffed",
                    borderRadius: 20, padding: "2px 8px", marginTop: 5,
                    display: "inline-block", fontWeight: 600
                }}>
                    {sub}
                </div>
            )}
        </div>

        {/* Accent Bar */}
        <div style={{
            width: 3, height: 44, borderRadius: 99, flexShrink: 0,
            background: `linear-gradient(180deg, ${accentColor} 0%, ${accentColor}33 100%)`
        }} />
    </div>
);


/* ─────────────────────────────────────────────────────────────
   Main Component
───────────────────────────────────────────────────────────── */
const DepartmentProfilePage = () => {
    const navigate = useNavigate();
    const tableRef = useRef<ActionType>(null);

    const { data: completeness, isLoading, refetch } = useDepartmentCompletenessQuery();

    const [searchValue, setSearchValue] = useState("");
    const [companyFilter, setCompanyFilter] = useState<string | null>(null);
    const [scoreFilter, setScoreFilter] = useState<ScoreFilterValue>("all");
    const [resetSignal, setResetSignal] = useState(0);

    const [openView, setOpenView] = useState(false);
    const [selectedRecord, setSelectedRecord] = useState<IDepartmentCompleteness | null>(null);

    /* ── Danh sách công ty duy nhất từ data ── */
    const companyOptions = useMemo(() => {
        if (!completeness) return [];
        const seen = new Set<string>();
        return completeness.reduce<{ label: string; value: string }[]>((acc, d) => {
            if (!seen.has(d.companyName)) {
                seen.add(d.companyName);
                acc.push({ label: d.companyName, value: d.companyName });
            }
            return acc;
        }, []);
    }, [completeness]);

    /* ── Count theo từng bucket ── */
    const countFull = useMemo(() => completeness?.filter((d) => d.score === 7).length ?? 0, [completeness]);
    const countPartial = useMemo(() => completeness?.filter((d) => d.score > 0 && d.score < 7).length ?? 0, [completeness]);
    const countEmpty = useMemo(() => completeness?.filter((d) => d.score === 0).length ?? 0, [completeness]);

    /* ── Filter client-side ── */
    const dataSource = useMemo(() => {
        if (!completeness) return [];
        let list = [...completeness];

        if (searchValue.trim())
            list = list.filter((d) =>
                d.departmentName.toLowerCase().includes(searchValue.trim().toLowerCase())
            );

        if (companyFilter)
            list = list.filter((d) => d.companyName === companyFilter);

        if (scoreFilter === "full") list = list.filter((d) => d.score === 7);
        else if (scoreFilter === "partial") list = list.filter((d) => d.score > 0 && d.score < 7);
        else if (scoreFilter === "empty") list = list.filter((d) => d.score === 0);

        return list;
    }, [completeness, searchValue, companyFilter, scoreFilter]);

    /* ── Stats (toàn bộ data) ── */
    const totalDept = completeness?.length ?? 0;
    const totalFull = countFull;
    const missingCount = totalDept - totalFull;

    /* ── Reset ── */
    const handleReset = () => {
        setSearchValue("");
        setCompanyFilter(null);
        setScoreFilter("all");
        setResetSignal((s) => s + 1);
        refetch();
    };

    /* ─────────────────────────────────────────────────────────
       Columns
    ───────────────────────────────────────────────────────── */
    const columns: ProColumns<IDepartmentCompleteness>[] = [
        {
            title: "STT",
            key: "index",
            width: 52,
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
            title: "Hạng mục còn thiếu",
            key: "missing",
            width: 320,            // ← đặt width cố định tránh cột co quá hẹp
            render: (_, record) => <MissingTagsCell record={record} />,
        },
        {
            title: "Ưu tiên",
            key: "priority",
            align: "center",
            width: 120,
            render: (_, record) => <PriorityCell score={record.score} />,
        },
        {
            title: "Điểm",
            dataIndex: "score",
            align: "center",
            width: 160,
            sorter: (a, b) => a.score - b.score,
            render: (_, record) => <ScoreCell record={record} />,
        },
        {
            title: "Hành động",
            key: "action",
            align: "center",
            width: 100,
            fixed: "right",        // ← sticky bên phải
            render: (_, record) => (
                <Tooltip title="Xem chi tiết hồ sơ">
                    <Button
                        type="text"
                        icon={<EyeOutlined style={{ color: "#1677ff", fontSize: 16 }} />}
                        onClick={() => {
                            setSelectedRecord(record);
                            setOpenView(true);
                        }}
                    />
                </Tooltip>
            ),
        },
    ];

    /* ─────────────────────────────────────────────────────────
       Render
    ───────────────────────────────────────────────────────── */
    return (
        <PageContainer
            title="Hồ sơ phòng ban"
            filter={
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    {/* Stat cards */}
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 16, marginBottom: 8 }}>
                        <StatCard
                            iconPath="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8z"
                            accentColor="#1677ff"
                            label="Tổng phòng ban"
                            value={totalDept}
                            sub="Tất cả hồ sơ"
                            subCls="success"
                            loading={isLoading}
                        />
                        <StatCard
                            iconPath="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
                            accentColor="#52c41a"
                            label="Hoàn chỉnh (7/7)"
                            value={totalFull}
                            sub={totalFull > 0 ? "Đạt chuẩn 100%" : "Chưa có"}
                            subCls={totalFull > 0 ? "success" : "warn"}
                            loading={isLoading}
                        />
                        <StatCard
                            iconPath="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                            accentColor="#faad14"
                            label="Còn thiếu hạng mục"
                            value={missingCount}
                            sub={missingCount > 0 ? "Cần bổ sung gấp" : "Tốt, không thiếu"}
                            subCls={missingCount > 0 ? "danger" : "success"}
                            loading={isLoading}
                        />
                    </div>

                    <div className="flex flex-col gap-3">
                        <SearchFilter
                            searchPlaceholder="Tìm tên phòng ban..."
                            showFilterButton={false}
                            showAddButton={false}
                            onSearch={setSearchValue}
                            onReset={handleReset}
                        />
                        <AdvancedFilterSelect
                            resetSignal={resetSignal}
                            fields={[
                                {
                                    key: "company",
                                    label: "Công ty",
                                    options: companyOptions,
                                },
                                {
                                    key: "score",
                                    label: "Tình trạng",
                                    options: [
                                        { label: `Tất cả`, value: "all" },
                                        { label: `Hoàn chỉnh (${countFull})`, value: "full", color: "green" },
                                        { label: `Đang bổ sung (${countPartial})`, value: "partial", color: "orange" },
                                        { label: `Chưa có hồ sơ (${countEmpty})`, value: "empty", color: "red" }
                                    ]
                                }
                            ]}
                            onChange={(filters) => {
                                setCompanyFilter(filters.company || null);
                                if (filters.score) {
                                    setScoreFilter(filters.score);
                                } else {
                                    setScoreFilter("all");
                                }
                            }}
                        />
                    </div>
                </div>
            }
        >
            <DataTable<IDepartmentCompleteness>
                actionRef={tableRef}
                rowKey="departmentId"
                loading={isLoading}
                columns={columns}
                dataSource={dataSource}
                scroll={{ x: "max-content" }}  // ← scroll ngang thay vì vỡ layout
                pagination={{
                    defaultPageSize: 10,
                    showQuickJumper: true,
                    showSizeChanger: true,
                    pageSizeOptions: ["10", "20", "50"],
                    showTotal: (total, range) => (
                        <span style={{ fontSize: 13, color: "#8c8c8c" }}>
                            <b style={{ color: "#262626", fontWeight: 600 }}>
                                {range[0]}–{range[1]}
                            </b>{" "}
                            trên{" "}
                            <b style={{ color: "#1677ff", fontWeight: 600 }}>
                                {total.toLocaleString()}
                            </b>{" "}
                            phòng ban
                        </span>
                    ),
                }}
                rowSelection={false}
            />

            {selectedRecord && (
                <ViewDepartmentCompleteness
                    open={openView}
                    onClose={() => {
                        setOpenView(false);
                        setSelectedRecord(null);
                    }}
                    record={selectedRecord}
                    criteria={CRITERIA}
                />
            )}
        </PageContainer>
    );
};

export default DepartmentProfilePage;