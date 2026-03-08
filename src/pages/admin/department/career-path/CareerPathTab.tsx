import { useState } from "react";
import { Typography, Button, Modal, message, Tooltip, Space, Skeleton } from "antd";
import {
    EditOutlined,
    EyeOutlined,
    ReloadOutlined,
    DeleteOutlined,
    FilterOutlined,
    AppstoreOutlined,
    ApartmentOutlined,
} from "@ant-design/icons";
import { useParams, useSearchParams } from "react-router-dom";

import PageContainer from "@/components/common/data-table/PageContainer";
import SearchFilter from "@/components/common/filter/SearchFilter";
import {
    useCareerPathsByDepartmentQuery,
    useCareerPathsGroupedByBandQuery,
} from "@/hooks/useCareerPaths";
import type { ICareerPath, IResCareerPathBandGroup } from "@/types/backend";
import ModalCareerPath from "./ModalCareerPath";
import ViewCareerPath from "./ViewCareerPath";

const { Text } = Typography;
type ViewMode = "department" | "band";

const parseBandNumber = (band: string): number => {
    const match = band?.match(/\d+/);
    return match ? parseInt(match[0], 10) : 999;
};
const parseLevelNumber = (code?: string | null): number => {
    if (!code) return 999;
    const match = code.match(/\d+/);
    return match ? parseInt(match[0], 10) : 999;
};

// ── Design System ─────────────────────────────────────────────────
const T = {
    // Neutrals
    ink: "#0a0a0b",
    ink2: "#2c2c2e",
    ink3: "#636366",
    ink4: "#aeaeb2",
    ink5: "#d1d1d6",

    // Surfaces
    white: "#ffffff",
    s1: "#fafafa",
    s2: "#f5f5f7",

    // Borders
    line: "rgba(0,0,0,0.06)",
    lineMed: "rgba(0,0,0,0.10)",
    lineStr: "rgba(0,0,0,0.15)",

    // Single accent — deep blue, professional
    acc: "#0066ff",
    accSoft: "rgba(0,102,255,0.07)",
    accBord: "rgba(0,102,255,0.18)",
    accText: "#0044cc",
};

// Step index → subtle hue shift (all professional, no neon)
const STEP_HUE: { dot: string; chip: string; chipBg: string; chipBorder: string; stripe: string }[] = [
    { dot: "#0066ff", chip: "#0066ff", chipBg: "rgba(0,102,255,0.07)", chipBorder: "rgba(0,102,255,0.18)", stripe: "#0066ff" },
    { dot: "#5856d6", chip: "#5856d6", chipBg: "rgba(88,86,214,0.07)", chipBorder: "rgba(88,86,214,0.18)", stripe: "#5856d6" },
    { dot: "#007aff", chip: "#007aff", chipBg: "rgba(0,122,255,0.07)", chipBorder: "rgba(0,122,255,0.18)", stripe: "#007aff" },
    { dot: "#34aadc", chip: "#34aadc", chipBg: "rgba(52,170,220,0.07)", chipBorder: "rgba(52,170,220,0.18)", stripe: "#34aadc" },
    { dot: "#4cd964", chip: "#1e8c3e", chipBg: "rgba(52,199,89,0.07)", chipBorder: "rgba(52,199,89,0.18)", stripe: "#34c759" },
    { dot: "#ff9500", chip: "#9c5a00", chipBg: "rgba(255,149,0,0.07)", chipBorder: "rgba(255,149,0,0.18)", stripe: "#ff9500" },
    { dot: "#ff6b00", chip: "#ab3d00", chipBg: "rgba(255,107,0,0.07)", chipBorder: "rgba(255,107,0,0.18)", stripe: "#ff6b00" },
    { dot: "#ff3b30", chip: "#c0251b", chipBg: "rgba(255,59,48,0.07)", chipBorder: "rgba(255,59,48,0.18)", stripe: "#ff3b30" },
    { dot: "#af52de", chip: "#7a28b8", chipBg: "rgba(175,82,222,0.07)", chipBorder: "rgba(175,82,222,0.18)", stripe: "#af52de" },
];
const getHue = (i: number) => STEP_HUE[i % STEP_HUE.length];

// ── StairCard ─────────────────────────────────────────────────────
const StairCard = ({
    item,
    index,
    total,
    onView,
    onEdit,
    onDelete,
}: {
    item: ICareerPath;
    index: number;
    total: number;
    onView: (r: ICareerPath) => void;
    onEdit: (r: ICareerPath) => void;
    onDelete: (r: ICareerPath) => void;
}) => {
    const [hov, setHov] = useState(false);
    const h = getHue(index);
    // index 0 = top rank → most indented (staircase descends left)
    const indent = ((total - 1 - index) / Math.max(total - 1, 1)) * 22;

    return (
        <div
            style={{
                display: "flex",
                alignItems: "stretch",
                paddingLeft: `${indent}%`,
                marginBottom: 5,
            }}
        >
            {/* Accent stripe */}
            <div style={{
                width: 3,
                flexShrink: 0,
                borderRadius: "3px 0 0 3px",
                background: h.stripe,
                opacity: hov ? 1 : 0.35,
                transition: "opacity 0.15s",
            }} />

            {/* Body */}
            <div
                onMouseEnter={() => setHov(true)}
                onMouseLeave={() => setHov(false)}
                style={{
                    flex: 1,
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "11px 14px 11px 14px",
                    background: hov ? T.s1 : T.white,
                    border: `1px solid ${hov ? T.lineMed : T.line}`,
                    borderLeft: "none",
                    borderRadius: "0 10px 10px 0",
                    transition: "background 0.15s, border-color 0.15s, box-shadow 0.15s",
                    boxShadow: hov
                        ? "0 2px 12px rgba(0,0,0,0.07), 0 1px 3px rgba(0,0,0,0.04)"
                        : "0 1px 2px rgba(0,0,0,0.03)",
                    cursor: "default",
                }}
            >
                {/* Step index — monospaced, muted */}
                <span style={{
                    width: 28,
                    flexShrink: 0,
                    fontSize: 11,
                    fontWeight: 600,
                    color: hov ? T.ink3 : T.ink4,
                    letterSpacing: 0.2,
                    textAlign: "right",
                    fontVariantNumeric: "tabular-nums",
                    transition: "color 0.15s",
                    userSelect: "none",
                }}>
                    {String(index + 1).padStart(2, "0")}
                </span>

                {/* Dot */}
                <div style={{
                    width: 7,
                    height: 7,
                    borderRadius: "50%",
                    flexShrink: 0,
                    background: h.dot,
                    opacity: hov ? 1 : 0.55,
                    transition: "opacity 0.15s",
                    boxShadow: hov ? `0 0 0 3px ${h.chipBg}` : "none",
                }} />

                {/* Title */}
                <Text
                    ellipsis
                    style={{
                        flex: 1,
                        fontSize: 13.5,
                        fontWeight: hov ? 600 : 500,
                        color: hov ? T.ink : T.ink2,
                        letterSpacing: -0.2,
                        lineHeight: "18px",
                        transition: "color 0.15s, font-weight 0.15s",
                        minWidth: 0,
                        display: "block",
                    }}
                >
                    {item.jobTitleName || "—"}
                </Text>

                {/* Level code */}
                <div style={{
                    flexShrink: 0,
                    padding: "2px 9px",
                    borderRadius: 5,
                    background: hov ? h.chipBg : T.s2,
                    border: `1px solid ${hov ? h.chipBorder : T.line}`,
                    fontSize: 11,
                    fontWeight: 700,
                    color: hov ? h.chip : T.ink3,
                    letterSpacing: 0.5,
                    transition: "all 0.15s",
                    fontVariantNumeric: "tabular-nums",
                }}>
                    {item.positionLevelCode ?? "—"}
                </div>

                {/* Actions */}
                <Space
                    size={2}
                    style={{
                        flexShrink: 0,
                        opacity: hov ? 1 : 0,
                        transform: hov ? "translateX(0)" : "translateX(6px)",
                        transition: "opacity 0.15s, transform 0.15s",
                        pointerEvents: hov ? "auto" : "none",
                    }}
                >
                    <Tooltip title="Xem" mouseEnterDelay={0.6}>
                        <Button
                            type="text" size="small"
                            icon={<EyeOutlined />}
                            onClick={() => onView(item)}
                            style={{ color: T.ink4, borderRadius: 6, width: 26, height: 26 }}
                        />
                    </Tooltip>
                    <Tooltip title="Sửa" mouseEnterDelay={0.6}>
                        <Button
                            type="text" size="small"
                            icon={<EditOutlined />}
                            onClick={() => onEdit(item)}
                            style={{ color: T.ink4, borderRadius: 6, width: 26, height: 26 }}
                        />
                    </Tooltip>
                    <Tooltip title="Xóa" mouseEnterDelay={0.6}>
                        <Button
                            type="text" size="small" danger
                            icon={<DeleteOutlined />}
                            onClick={() => onDelete(item)}
                            style={{ borderRadius: 6, width: 26, height: 26 }}
                        />
                    </Tooltip>
                </Space>
            </div>
        </div>
    );
};

// ── Slim connector ────────────────────────────────────────────────
const Connector = ({ color }: { color: string }) => (
    <div style={{
        width: 1,
        height: 8,
        marginLeft: 22,
        marginBottom: 0,
        background: `linear-gradient(to bottom, ${color}44, transparent)`,
    }} />
);

// ── Empty state ───────────────────────────────────────────────────
const EmptyState = ({ label }: { label: string }) => (
    <div style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "52px 24px",
        background: T.s1,
        borderRadius: 12,
        border: `1px dashed ${T.lineMed}`,
        gap: 8,
    }}>
        <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: T.s2, border: `1px solid ${T.line}`,
            display: "flex", alignItems: "center", justifyContent: "center",
        }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <rect x="2" y="2" width="12" height="12" rx="2" stroke={T.ink4} strokeWidth="1.2" />
                <path d="M5 8h6M8 5v6" stroke={T.ink4} strokeWidth="1.2" strokeLinecap="round" />
            </svg>
        </div>
        <Text style={{ fontSize: 13, color: T.ink4, fontWeight: 500 }}>{label}</Text>
    </div>
);

// ── CareerLadderFlat ──────────────────────────────────────────────
const CareerLadderFlat = ({
    paths,
    onView,
    onEdit,
    onDelete,
    showHeader = true,
}: {
    paths: ICareerPath[];
    onView: (r: ICareerPath) => void;
    onEdit: (r: ICareerPath) => void;
    onDelete: (r: ICareerPath) => void;
    showHeader?: boolean;
}) => {
    if (paths.length === 0) return <EmptyState label="Chưa có lộ trình nào" />;

    return (
        <div>
            {showHeader && (
                <div style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: 16,
                }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ width: 20, height: 1, background: T.lineStr }} />
                        <Text style={{
                            fontSize: 11,
                            fontWeight: 600,
                            color: T.ink4,
                            letterSpacing: 0.8,
                            textTransform: "uppercase",
                        }}>
                            Cấp cao nhất
                        </Text>
                    </div>
                    <Text style={{ fontSize: 11, color: T.ink5, fontWeight: 500 }}>
                        {paths.length} cấp bậc
                    </Text>
                </div>
            )}

            {paths.map((item, i) => (
                <div key={item.id}>
                    <StairCard
                        item={item} index={i} total={paths.length}
                        onView={onView} onEdit={onEdit} onDelete={onDelete}
                    />
                    {i < paths.length - 1 && <Connector color={getHue(i).dot} />}
                </div>
            ))}

            {showHeader && (
                <div style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    marginTop: 14,
                }}>
                    <div style={{ width: 20, height: 1, background: T.line }} />
                    <Text style={{ fontSize: 11, color: T.ink5, fontWeight: 500 }}>
                        Cấp khởi đầu
                    </Text>
                </div>
            )}
        </div>
    );
};

// ── CareerLadderBand ──────────────────────────────────────────────
const CareerLadderBand = ({
    groups,
    onView,
    onEdit,
    onDelete,
}: {
    groups: IResCareerPathBandGroup[];
    onView: (r: ICareerPath) => void;
    onEdit: (r: ICareerPath) => void;
    onDelete: (r: ICareerPath) => void;
}) => {
    const [openKeys, setOpenKeys] = useState<Record<string, boolean>>({});
    const toggle = (band: string) =>
        setOpenKeys((prev) => ({ ...prev, [band]: !prev[band] }));

    if (groups.length === 0) return <EmptyState label="Chưa có dữ liệu theo band" />;

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {groups.map((group, gi) => {
                const h = getHue(gi);
                const isOpen = openKeys[group.band] !== false;
                return (
                    <div
                        key={group.band}
                        style={{
                            background: T.white,
                            border: `1px solid ${isOpen ? h.chipBorder : T.line}`,
                            borderRadius: 12,
                            overflow: "hidden",
                            transition: "border-color 0.15s, box-shadow 0.15s",
                            boxShadow: isOpen
                                ? `0 4px 16px rgba(0,0,0,0.06)`
                                : "0 1px 3px rgba(0,0,0,0.04)",
                        }}
                    >
                        {/* Band header */}
                        <div
                            onClick={() => toggle(group.band)}
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 10,
                                padding: "12px 16px",
                                cursor: "pointer",
                                borderBottom: isOpen ? `1px solid ${T.line}` : "none",
                                background: isOpen ? T.s1 : T.white,
                                transition: "background 0.15s",
                                userSelect: "none",
                            }}
                        >
                            {/* Dot */}
                            <div style={{
                                width: 8, height: 8, borderRadius: "50%", flexShrink: 0,
                                background: h.dot,
                                boxShadow: isOpen ? `0 0 0 3px ${h.chipBg}` : "none",
                                transition: "box-shadow 0.15s",
                            }} />

                            {/* Band label */}
                            <div style={{
                                padding: "2px 10px",
                                borderRadius: 6,
                                background: isOpen ? h.chipBg : T.s2,
                                border: `1px solid ${isOpen ? h.chipBorder : T.line}`,
                                fontSize: 12,
                                fontWeight: 700,
                                color: isOpen ? h.chip : T.ink3,
                                letterSpacing: 0.3,
                                transition: "all 0.15s",
                            }}>
                                {group.band}
                            </div>

                            <Text style={{
                                fontSize: 12.5,
                                fontWeight: 500,
                                color: T.ink4,
                            }}>
                                {group.positions?.length ?? 0} chức danh
                            </Text>

                            <div style={{ flex: 1 }} />

                            {/* Chevron */}
                            <svg
                                width="14" height="14" viewBox="0 0 14 14"
                                style={{
                                    transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
                                    transition: "transform 0.2s cubic-bezier(.4,0,.2,1)",
                                    color: T.ink4,
                                }}
                            >
                                <path
                                    d="M3 5.5L7 9L11 5.5"
                                    stroke="currentColor"
                                    strokeWidth="1.4"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    fill="none"
                                />
                            </svg>
                        </div>

                        {isOpen && (
                            <div style={{ padding: "16px 16px 12px" }}>
                                <CareerLadderFlat
                                    paths={group.positions ?? []}
                                    onView={onView}
                                    onEdit={onEdit}
                                    onDelete={onDelete}
                                    showHeader={false}
                                />
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
};

// ── Segmented control ─────────────────────────────────────────────
const SegmentedControl = ({
    value,
    onChange,
}: {
    value: ViewMode;
    onChange: (v: ViewMode) => void;
}) => {
    const options = [
        { value: "department" as ViewMode, label: "Phòng ban", icon: <AppstoreOutlined /> },
        { value: "band" as ViewMode, label: "Cấp bậc (Band)", icon: <ApartmentOutlined /> },
    ];
    return (
        <div style={{
            display: "inline-flex",
            background: T.s2,
            borderRadius: 9,
            padding: 3,
            gap: 2,
            border: `1px solid ${T.line}`,
        }}>
            {options.map((o) => {
                const active = value === o.value;
                return (
                    <button
                        key={o.value}
                        onClick={() => onChange(o.value)}
                        style={{
                            display: "flex", alignItems: "center", gap: 5,
                            padding: "6px 14px",
                            borderRadius: 7,
                            border: "none",
                            cursor: "pointer",
                            fontSize: 12.5,
                            fontWeight: active ? 600 : 400,
                            color: active ? T.ink : T.ink3,
                            background: active ? T.white : "transparent",
                            boxShadow: active
                                ? "0 1px 4px rgba(0,0,0,0.08), 0 0 0 0.5px rgba(0,0,0,0.05)"
                                : "none",
                            transition: "all 0.15s cubic-bezier(.4,0,.2,1)",
                            letterSpacing: -0.1,
                        }}
                    >
                        <span style={{ fontSize: 12, opacity: active ? 0.8 : 0.45 }}>{o.icon}</span>
                        {o.label}
                    </button>
                );
            })}
        </div>
    );
};

// ── Main ──────────────────────────────────────────────────────────
const CareerPathTab = () => {
    const { departmentId } = useParams();
    const [searchParams] = useSearchParams();
    const departmentName = searchParams.get("departmentName") || "—";

    const [openModal, setOpenModal] = useState(false);
    const [openViewDetail, setOpenViewDetail] = useState(false);
    const [dataInit, setDataInit] = useState<ICareerPath | null>(null);
    const [searchValue, setSearchValue] = useState("");
    const [viewMode, setViewMode] = useState<ViewMode>("department");
    const [showFilter, setShowFilter] = useState(false);

    const deptQuery = useCareerPathsByDepartmentQuery(
        viewMode === "department" ? Number(departmentId) : undefined
    );
    const bandQuery = useCareerPathsGroupedByBandQuery(
        viewMode === "band" ? Number(departmentId) : undefined
    );
    const isFetching = deptQuery.isFetching || bandQuery.isFetching;

    const sortPaths = (paths: ICareerPath[]) =>
        [...paths].sort((a, b) => {
            const pA = (a.positionLevelCode ?? "").replace(/\d+/g, "").toUpperCase();
            const pB = (b.positionLevelCode ?? "").replace(/\d+/g, "").toUpperCase();
            if (pA !== pB) return pA.localeCompare(pB);
            return parseLevelNumber(a.positionLevelCode) - parseLevelNumber(b.positionLevelCode);
        });

    const sortBands = (groups: IResCareerPathBandGroup[]): IResCareerPathBandGroup[] =>
        [...groups].sort((a, b) => {
            const pA = a.band?.replace(/\d+/g, "").toUpperCase() ?? "";
            const pB = b.band?.replace(/\d+/g, "").toUpperCase() ?? "";
            if (pA !== pB) return pA.localeCompare(pB);
            return parseBandNumber(a.band) - parseBandNumber(b.band);
        });

    const filterPaths = (paths: ICareerPath[]) =>
        paths.filter((p) =>
            !searchValue || p.jobTitleName?.toLowerCase().includes(searchValue.toLowerCase())
        );

    let filteredData: ICareerPath[] = [];
    let groupedData: IResCareerPathBandGroup[] = [];

    if (viewMode === "department") {
        filteredData = sortPaths(filterPaths(deptQuery.data ?? []));
    } else {
        groupedData = sortBands(
            (bandQuery.data ?? []).map((g) => ({
                ...g,
                positions: sortPaths(filterPaths(g.positions ?? [])),
            }))
        );
    }

    const handleReset = () => {
        setSearchValue("");
        deptQuery.refetch();
        bandQuery.refetch();
    };

    const handleDelete = (r: ICareerPath) => {
        Modal.confirm({
            title: "Xác nhận xóa",
            content: `Xóa lộ trình "${r.jobTitleName}"?`,
            okText: "Xóa", okType: "danger", cancelText: "Hủy",
            onOk: () => {
                message.success("Đã xóa thành công");
                deptQuery.refetch();
                bandQuery.refetch();
            },
        });
    };

    const handleView = (r: ICareerPath) => { setDataInit(r); setOpenViewDetail(true); };
    const handleEdit = (r: ICareerPath) => { setDataInit(r); setOpenModal(true); };

    const renderContent = () => {
        if (isFetching) return <Skeleton active paragraph={{ rows: 10 }} />;
        if (viewMode === "department") {
            return (
                <div style={{
                    background: T.white,
                    border: `1px solid ${T.line}`,
                    borderRadius: 14,
                    padding: "20px 20px 16px",
                    boxShadow: "0 1px 6px rgba(0,0,0,0.05)",
                }}>
                    <CareerLadderFlat
                        paths={filteredData}
                        onView={handleView}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                    />
                </div>
            );
        }
        return (
            <CareerLadderBand
                groups={groupedData}
                onView={handleView}
                onEdit={handleEdit}
                onDelete={handleDelete}
            />
        );
    };

    return (
        <div>
            <PageContainer
                title={`Lộ trình thăng tiến — ${departmentName}`}
                extra={
                    <Button
                        icon={<ReloadOutlined />}
                        onClick={handleReset}
                        style={{
                            borderRadius: 8, borderColor: T.lineMed,
                            color: T.ink3, fontSize: 13, fontWeight: 500,
                            boxShadow: "none", height: 32,
                        }}
                    >
                        Làm mới
                    </Button>
                }
            >
                {/* Toolbar */}
                <div style={{
                    background: T.white,
                    border: `1px solid ${T.line}`,
                    borderRadius: 12,
                    padding: "14px 18px",
                    marginBottom: 12,
                    boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                }}>
                    <SearchFilter
                        searchPlaceholder="Tìm chức danh, cấp bậc…"
                        addLabel="Thêm mới"
                        showFilterButton={false}
                        onSearch={setSearchValue}
                        onReset={handleReset}
                        onAddClick={() => { setDataInit(null); setOpenModal(true); }}
                    />

                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 10 }}>
                        <button
                            onClick={() => setShowFilter(!showFilter)}
                            style={{
                                display: "flex", alignItems: "center", gap: 5,
                                padding: "5px 11px",
                                borderRadius: 7,
                                border: `1px solid ${showFilter ? T.lineMed : T.line}`,
                                background: showFilter ? T.s2 : "transparent",
                                color: showFilter ? T.ink2 : T.ink4,
                                fontSize: 12.5, fontWeight: showFilter ? 600 : 400,
                                cursor: "pointer",
                                transition: "all 0.14s",
                            }}
                        >
                            <FilterOutlined style={{ fontSize: 11 }} />
                            Chế độ xem
                        </button>
                    </div>

                    {showFilter && (
                        <div style={{
                            marginTop: 10,
                            padding: "10px 12px",
                            background: T.s1,
                            borderRadius: 9,
                            border: `1px solid ${T.line}`,
                        }}>
                            <Text style={{
                                display: "block",
                                fontSize: 10, fontWeight: 700,
                                color: T.ink5, letterSpacing: 0.9,
                                textTransform: "uppercase", marginBottom: 8,
                            }}>
                                Hiển thị theo
                            </Text>
                            <SegmentedControl value={viewMode} onChange={setViewMode} />
                        </div>
                    )}
                </div>

                {renderContent()}

                <ModalCareerPath
                    openModal={openModal} setOpenModal={setOpenModal}
                    dataInit={dataInit} setDataInit={setDataInit}
                />
                <ViewCareerPath
                    open={openViewDetail} onClose={() => setOpenViewDetail(false)}
                    dataInit={dataInit} setDataInit={setDataInit}
                />
            </PageContainer>
        </div>
    );
};

export default CareerPathTab;