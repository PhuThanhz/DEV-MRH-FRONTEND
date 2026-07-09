import { useRef, useState, useMemo, useEffect } from "react";
import type { ProColumns, ActionType } from "@ant-design/pro-components";
import { Tag, Button, Tooltip, Skeleton } from "antd";
import {
    EyeOutlined,
    CheckCircleFilled,
    ArrowLeftOutlined,
} from "@ant-design/icons";
import { useNavigate, useSearchParams } from "react-router-dom";

import PageContainer from "@/components/common/data-table/PageContainer";
import DataTable from "@/components/common/data-table";
import SearchFilter from "@/components/common/filter/SearchFilter";
import AdvancedFilterSelect from "@/components/common/filter/AdvancedFilterSelect";
import Breadcrumb from "@/components/common/navigation/Breadcrumb";

import type { IDepartmentCompleteness } from "@/types/backend";
import { useDepartmentCompletenessQuery } from "@/hooks/useDashboard";
import ViewDepartmentCompleteness from "./view.departmentcompleteness";
import useAccess from "@/hooks/useAccess";
import { ALL_PERMISSIONS } from "@/config/permissions";
import { useIsMobile } from "@/hooks/useIsMobile";
import {
    getScoreStyle,
    BADGE_BASE_STYLE,
    CRITERIA_MAP,
    PRIORITIZED_KEYS,
} from "./departmentProfileCriteria";

/* ────────────────────────────────────────────── */
const CRITERIA = PRIORITIZED_KEYS.map(key => ({
    key,
    label: CRITERIA_MAP[key].label
}));

type ScoreFilterValue = "all" | "full" | "partial" | "empty";

/* ─────────────────────────────────────────────────────────────
   Sub-components
───────────────────────────────────────────────────────────── */

/** Badge điểm tròn */
const ScoreBadge = ({ score }: { score: number }) => {
    const style = getScoreStyle(score);
    return (
        <Tag
            style={{
                ...BADGE_BASE_STYLE,
                background: style.bg,
                color: style.color,
                border: `1px solid ${style.border}`,
            }}
        >
            {score}/7
        </Tag>
    );
};

/** Progress bar + badge gộp lại */
const ScoreCell = ({ record }: { record: IDepartmentCompleteness }) => {
    const pct = Math.round((record.score / 7) * 100);
    const style = getScoreStyle(record.score);
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
                        background: style.barColor,
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
    const missing = PRIORITIZED_KEYS.filter((key) => !record[key]);

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

    const MAX_VISIBLE = 3;
    const visible = missing.slice(0, MAX_VISIBLE);
    const hidden = missing.slice(MAX_VISIBLE);

    const tagStyle: React.CSSProperties = {
        margin: 0,
        fontSize: 11,
        fontWeight: 500,
        borderRadius: 6,
        padding: "1px 8px",
        lineHeight: "20px",
        background: "#fff5f5",
        color: "#e04858",
        border: "1px solid #ffd6d6",
    };

    return (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {visible.map((key) => (
                <Tag key={String(key)} style={tagStyle}>
                    {CRITERIA_MAP[key].label}
                </Tag>
            ))}
            {hidden.length > 0 && (
                <Tooltip
                    title={
                        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                            {hidden.map((key) => (
                                <span key={String(key)}>• {CRITERIA_MAP[key].label}</span>
                            ))}
                        </div>
                    }
                >
                    <Tag
                        style={{
                            ...tagStyle,
                            background: "#fafafa",
                            color: "#8c8c8c",
                            border: "1px solid #e8e8e8",
                            cursor: "default",
                        }}
                    >
                        +{hidden.length}
                    </Tag>
                </Tooltip>
            )}
        </div>
    );
};



const Ico = ({ d, size = 20 }: { d: string; size?: number }) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        <path d={d} />
    </svg>
);

/** Stat card nhỏ — responsive: flex-1, minWidth 0, wrap từ parent */
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
    value: number;
    accentColor: string;
    iconPath: string;
    loading?: boolean;
    sub?: string;
    subCls?: "success" | "warn" | "danger";
}) => (
    <div
        style={{
            background: "#fff",
            border: "1px solid #f0f0f0",
            borderRadius: 16,
            padding: "20px 18px",
            boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
            display: "flex",
            alignItems: "center",
            gap: 14,
            flex: "1 1 260px",
            minWidth: 0,
        }}
    >
        <div
            style={{
                width: 48,
                height: 48,
                borderRadius: 13,
                background: "#fff0f4",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#f2547d",
                flexShrink: 0,
            }}
        >
            <Ico d={iconPath} size={20} />
        </div>

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
            {sub && (
                <div
                    style={{
                        fontSize: 11,
                        color: subCls === "danger" ? "#cf1322" : subCls === "warn" ? "#d46b08" : "#389e0d",
                        background: subCls === "danger" ? "#fff1f0" : subCls === "warn" ? "#fff7e6" : "#f6ffed",
                        borderRadius: 20,
                        padding: "2px 8px",
                        marginTop: 5,
                        display: "inline-block",
                        fontWeight: 600,
                    }}
                >
                    {sub}
                </div>
            )}
        </div>

        <div
            style={{
                width: 3,
                height: 44,
                borderRadius: 99,
                flexShrink: 0,
                background: `linear-gradient(180deg, ${accentColor} 0%, ${accentColor}33 100%)`,
            }}
        />
    </div>
);

/* ─────────────────────────────────────────────────────────────
   Main Component
───────────────────────────────────────────────────────────── */
const DepartmentProfilePage = () => {
    const navigate = useNavigate();
    const isMobile = useIsMobile();
    const tableRef = useRef<ActionType>(null);
    const [searchParams, setSearchParams] = useSearchParams();

    const { data: completeness, isLoading, refetch } = useDepartmentCompletenessQuery();

    const [searchValue, setSearchValue] = useState(() => searchParams.get("search") || "");
    const [companyFilter, setCompanyFilter] = useState<string | null>(() => searchParams.get("company"));
    const [scoreFilter, setScoreFilter] = useState<ScoreFilterValue>(() => (searchParams.get("status") as ScoreFilterValue) || "all");
    const [missingFilter, setMissingFilter] = useState<string | null>(() => searchParams.get("missing"));
    const [resetSignal, setResetSignal] = useState(0);

    const [openView, setOpenView] = useState(false);
    const [selectedRecord, setSelectedRecord] = useState<IDepartmentCompleteness | null>(null);

    // Sync query parameters on load
    useEffect(() => {
        if (completeness) {
            const idParam = searchParams.get("departmentId");
            if (idParam) {
                const id = Number(idParam);
                const rec = completeness.find((d) => d.departmentId === id);
                if (rec) {
                    setSelectedRecord(rec);
                    setOpenView(true);
                }
            }
        }
    }, [completeness, searchParams]);

    // Refetch data on mount
    useEffect(() => {
        refetch();
    }, [refetch]);

    const handleCloseView = () => {
        setOpenView(false);
        setSelectedRecord(null);
        const newParams = new URLSearchParams(searchParams);
        newParams.delete("departmentId");
        setSearchParams(newParams, { replace: true });
        refetch();
    };

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

        if (missingFilter) {
            list = list.filter((d) => !d[missingFilter as keyof IDepartmentCompleteness]);
        }

        // Default sorting: lowest score first (score asc)
        list.sort((a, b) => a.score - b.score);

        return list;
    }, [completeness, searchValue, companyFilter, scoreFilter, missingFilter]);

    /* ── Stats (toàn bộ data) ── */
    const totalDept = completeness?.length ?? 0;
    const totalFull = countFull;
    const missingCount = totalDept - totalFull;

    /* ── Reset ── */
    const handleReset = () => {
        setSearchValue("");
        setCompanyFilter(null);
        setScoreFilter("all");
        setMissingFilter(null);
        setResetSignal((s) => s + 1);
        setSearchParams(new URLSearchParams(), { replace: true });
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
            width: isMobile ? 60 : 150,
            fixed: "right",        // ← sticky bên phải
            render: (_, record) => {
                const labelText = "Xem chi tiết";
                const tooltipText = "Xem chi tiết hồ sơ phòng ban";

                const openDetail = () => {
                    setSelectedRecord(record);
                    setOpenView(true);
                    const newParams = new URLSearchParams(searchParams);
                    newParams.set("departmentId", String(record.departmentId));
                    setSearchParams(newParams, { replace: true });
                };

                return (
                    <Tooltip title={tooltipText}>
                        <Button
                            type="text"
                            size="small"
                            icon={<EyeOutlined style={{ color: "#1677ff", fontSize: 16 }} />}
                            onClick={openDetail}
                            aria-label={tooltipText}
                        />
                    </Tooltip>
                );
            },
        },
    ];

    /* ─────────────────────────────────────────────────────────
       Render
    ───────────────────────────────────────────────────────── */
    return (
        <PageContainer
            title="Hồ sơ phòng ban"
            extra={
                <Button
                    type="default"
                    icon={<ArrowLeftOutlined style={{ transition: "transform 0.2s" }} className="back-btn-icon" />}
                    onClick={() => navigate("/admin")}
                    style={{
                        fontWeight: 600,
                        borderRadius: 20,
                        border: "1px solid #e2e8f0",
                        background: "#ffffff",
                        color: "#475569",
                        boxShadow: "0 2px 6px rgba(0, 0, 0, 0.03)",
                        display: "inline-flex",
                        alignItems: "center",
                        height: 34,
                        padding: "0 16px",
                        transition: "all 0.2s ease",
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.color = "#f2547d";
                        e.currentTarget.style.borderColor = "#f2547d";
                        e.currentTarget.style.background = "#fff0f4";
                        const icon = e.currentTarget.querySelector(".back-btn-icon") as HTMLElement;
                        if (icon) icon.style.transform = "translateX(-3px)";
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.color = "#475569";
                        e.currentTarget.style.borderColor = "#e2e8f0";
                        e.currentTarget.style.background = "#ffffff";
                        const icon = e.currentTarget.querySelector(".back-btn-icon") as HTMLElement;
                        if (icon) icon.style.transform = "translateX(0)";
                    }}
                >
                    {!isMobile && "Quay lại Tổng quan"}
                </Button>
            }
            filter={
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>

                    {/* Stat cards — wrap khi màn nhỏ */}
                    <div
                        style={{
                            display: "flex",
                            gap: 16,
                            flexWrap: "wrap",   // ← xuống hàng khi không đủ chỗ
                        }}
                    >
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

                    {/* Search + reset */}
                    <SearchFilter
                        searchPlaceholder="Tìm tên phòng ban..."
                        showFilterButton={false}
                        showAddButton={false}
                        searchValue={searchValue}
                        onSearch={(val) => {
                            setSearchValue(val);
                            const newParams = new URLSearchParams(searchParams);
                            if (val.trim()) newParams.set("search", val.trim());
                            else newParams.delete("search");
                            setSearchParams(newParams, { replace: true });
                        }}
                        onReset={handleReset}
                        extraButtons={
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
                                        searchable: false,
                                        options: [
                                            { label: "Tất cả", value: "all", color: "blue" },
                                            { label: `Hoàn chỉnh (${countFull})`, value: "full", color: "green" },
                                            { label: `Đang bổ sung (${countPartial})`, value: "partial", color: "orange" },
                                            { label: `Chưa có hồ sơ (${countEmpty})`, value: "empty", color: "red" },
                                        ],
                                    },
                                    {
                                        key: "missing",
                                        label: "Hạng mục thiếu",
                                        searchable: false,
                                        options: [
                                            { label: "Tất cả", value: "all" },
                                            ...CRITERIA.map((c) => ({
                                                label: c.label,
                                                value: String(c.key),
                                            })),
                                        ],
                                    },
                                ]}
                                onChange={(filters) => {
                                    setCompanyFilter(filters.company || null);
                                    setScoreFilter((filters.score as ScoreFilterValue) || "all");
                                    setMissingFilter(filters.missing && filters.missing !== "all" ? filters.missing : null);
                                    
                                    const newParams = new URLSearchParams(searchParams);
                                    if (filters.company) newParams.set("company", filters.company);
                                    else newParams.delete("company");

                                    if (filters.score && filters.score !== "all") newParams.set("status", filters.score);
                                    else newParams.delete("status");

                                    if (filters.missing && filters.missing !== "all") newParams.set("missing", filters.missing);
                                    else newParams.delete("missing");

                                    setSearchParams(newParams, { replace: true });
                                }}
                            />
                        }
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
                    onClose={handleCloseView}
                    record={selectedRecord}
                    criteria={CRITERIA}
                />
            )}
        </PageContainer>
    );
};

export default DepartmentProfilePage;
