import { useRef, useState, useMemo } from "react";
import type { ProColumns, ActionType } from "@ant-design/pro-components";
import { Tag, Button, Tooltip, Skeleton } from "antd";
import {
    ArrowLeftOutlined,
    EyeOutlined,
    CheckCircleFilled,
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

type ScoreFilterValue = "all" | "full" | "partial" | "empty";

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
const StatCard = ({
    label,
    value,
    color,
    loading,
}: {
    label: string;
    value: number;
    color?: string;
    loading?: boolean;
}) => (
    <div
        style={{
            background: "#fafafa",
            border: "0.5px solid #f0f0f0",
            borderRadius: 10,
            padding: "12px 16px",
            flex: "1 1 100px",   // ← co giãn, min 100px, wrap khi cần
            minWidth: 0,          // ← cho phép shrink dưới content width
        }}
    >
        <div style={{ fontSize: 11, color: "#8c8c8c", marginBottom: 4, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {label}
        </div>
        {loading ? (
            <Skeleton.Input active size="small" style={{ width: 48, height: 24 }} />
        ) : (
            <div style={{ fontSize: 22, fontWeight: 600, color: color ?? "#262626" }}>
                {value}
            </div>
        )}
    </div>
);

/** Score filter chip */
const ScoreChip = ({
    label,
    dotColor,
    count,
    active,
    activeStyle,
    onClick,
}: {
    label: string;
    dotColor?: string;
    count?: number;
    active: boolean;
    activeStyle: React.CSSProperties;
    onClick: () => void;
}) => (
    <button
        onClick={onClick}
        style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 5,
            fontSize: 12,
            fontWeight: 500,
            border: "0.5px solid",
            borderRadius: 8,
            padding: "0 10px",
            height: 32,
            cursor: "pointer",
            transition: "all .15s",
            whiteSpace: "nowrap",   // ← chip không bị xuống dòng giữa chừng
            flexShrink: 0,
            ...(active
                ? activeStyle
                : {
                    background: "#fff",
                    borderColor: "#d9d9d9",
                    color: "#595959",
                }),
        }}
    >
        {dotColor && (
            <span
                style={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    background: dotColor,
                    flexShrink: 0,
                    display: "inline-block",
                }}
            />
        )}
        {label}
        {count !== undefined && (
            <span
                style={{
                    background: active ? "rgba(0,0,0,0.15)" : "#f0f0f0",
                    color: active ? "inherit" : "#595959",
                    borderRadius: 99,
                    fontSize: 10,
                    fontWeight: 600,
                    padding: "0 5px",
                    minWidth: 16,
                    textAlign: "center",
                    lineHeight: "16px",
                }}
            >
                {count}
            </span>
        )}
    </button>
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

                    {/* Back button */}
                    <button
                        onClick={() => navigate("/admin")}
                        style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 6,
                            fontSize: 12,
                            fontWeight: 500,
                            color: "#595959",
                            background: "#fafafa",
                            border: "0.5px solid #e0e0e0",
                            borderRadius: 8,
                            padding: "4px 10px",
                            cursor: "pointer",
                            width: "fit-content",
                        }}
                    >
                        <ArrowLeftOutlined style={{ fontSize: 11 }} />
                        Về Dashboard
                    </button>

                    {/* Stat cards — wrap khi màn nhỏ */}
                    <div
                        style={{
                            display: "flex",
                            gap: 8,
                            flexWrap: "wrap",   // ← xuống hàng khi không đủ chỗ
                        }}
                    >
                        <StatCard label="Tổng phòng ban" value={totalDept} loading={isLoading} />
                        <StatCard label="Hoàn chỉnh (7/7)" value={totalFull} color="#389e0d" loading={isLoading} />
                        <StatCard label="Còn thiếu hạng mục" value={missingCount} color="#cf1322" loading={isLoading} />
                    </div>

                    {/* Search + reset */}
                    <SearchFilter
                        searchPlaceholder="Tìm tên phòng ban..."
                        showFilterButton={false}
                        showAddButton={false}
                        onSearch={setSearchValue}
                        onReset={handleReset}
                    />

                    {/* Score filter chips — wrap khi màn nhỏ */}
                    <div
                        style={{
                            display: "flex",
                            gap: 6,
                            flexWrap: "wrap",   // ← chip tự xuống hàng
                            alignItems: "center",
                        }}
                    >
                        <ScoreChip
                            label="Tất cả"
                            active={scoreFilter === "all"}
                            activeStyle={{ background: "#EEEDFE", borderColor: "#AFA9EC", color: "#534AB7" }}
                            onClick={() => setScoreFilter("all")}
                        />
                        <ScoreChip
                            label="Hoàn chỉnh"
                            dotColor="#52c41a"
                            count={countFull}
                            active={scoreFilter === "full"}
                            activeStyle={{ background: "#f6ffed", borderColor: "#b7eb8f", color: "#389e0d" }}
                            onClick={() => setScoreFilter("full")}
                        />
                        <ScoreChip
                            label="Đang bổ sung"
                            dotColor="#faad14"
                            count={countPartial}
                            active={scoreFilter === "partial"}
                            activeStyle={{ background: "#fffbe6", borderColor: "#ffe58f", color: "#d48806" }}
                            onClick={() => setScoreFilter("partial")}
                        />
                        <ScoreChip
                            label="Chưa có hồ sơ"
                            dotColor="#ff4d4f"
                            count={countEmpty}
                            active={scoreFilter === "empty"}
                            activeStyle={{ background: "#fff1f0", borderColor: "#ffccc7", color: "#cf1322" }}
                            onClick={() => setScoreFilter("empty")}
                        />
                    </div>

                    {/* Filter theo công ty */}
                    <AdvancedFilterSelect
                        resetSignal={resetSignal}
                        fields={[
                            {
                                key: "company",
                                label: "Công ty",
                                options: companyOptions,
                            },
                        ]}
                        onChange={(filters) => {
                            setCompanyFilter(filters.company || null);
                        }}
                    />
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