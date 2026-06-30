import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { createPortal } from "react-dom";
import { AutoComplete, Modal, Form, Input, Select, Tooltip, Popover, Segmented } from "antd";
import {
    UserOutlined,
    TagOutlined,
    ApartmentOutlined,
    FileTextOutlined,
    ThunderboltOutlined,
    PlusOutlined,
    DeleteOutlined,
    ReadOutlined,
} from "@ant-design/icons";
import { getModalWidth } from "@/utils/responsive";

// ─────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────
interface InitialValues {
    title: string;
    levelCode: string;
    holderName?: string;
    isGoal?: boolean;
    parentId?: number | null;
    jobDescriptionId?: number | null;
    nodeKind?: NodeKind;
}

export type NodeKind = "department" | "position";
export type AddNodeMode = "single" | "bulk";

export interface SmartJobTitleOption {
    value: number;
    title: string;
    levelCode?: string;
    source?: string;
    jdId?: number | null;
    jdLabel?: string;
}

export interface SmartJdOption {
    value: number;
    label: string;
    jobTitleName?: string | null;
}

export interface BulkNodeItem {
    title: string;
    levelCode: string;
    holderName?: string;
    parentIndex: number | null;
    existingParentId: number | null;
    jobDescriptionId?: number | null;
}

interface BulkRow {
    id: string;
    jobTitleId: number | null;
    title: string;
    levelCode: string;
    holderName: string;
    parentIndex: number | null;
    existingParentId: number | null;
    jobDescriptionId: number | null;
}

interface Props {
    open: boolean;
    onClose: () => void;
    onSubmit: (values: any) => void;
    onBulkSubmit?: (items: BulkNodeItem[]) => void;
    nodes: any[];
    initialValues?: InitialValues;
    isEditing?: boolean;
    jdOptions?: SmartJdOption[];
    jobTitleOptions?: SmartJobTitleOption[];
    initialMode?: AddNodeMode;
    initialNodeKind?: NodeKind;
}

// ─────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────
let _uid = 0;
const uid = () => `r${++_uid}`;

const emptyRow = (overrides: Partial<BulkRow> = {}): BulkRow => ({
    id: uid(),
    jobTitleId: null,
    title: "",
    levelCode: "",
    holderName: "",
    parentIndex: null,
    existingParentId: null,
    jobDescriptionId: null,
    ...overrides,
});

const DEPTH_COLORS = ["#e8637a", "#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#06b6d4"];

const getDepth = (rows: BulkRow[], idx: number, memo = new Map<number, number>()): number => {
    if (memo.has(idx)) return memo.get(idx)!;
    const r = rows[idx];
    if (r.existingParentId != null) { memo.set(idx, 1); return 1; }
    if (r.parentIndex === null || r.parentIndex >= idx) { memo.set(idx, 0); return 0; }
    const d = 1 + getDepth(rows, r.parentIndex, memo);
    memo.set(idx, d);
    return d;
};

const normalize = (value?: string | null) => (value ?? "").trim().toLowerCase();

const inferNodeKind = (value?: Partial<InitialValues | BulkRow> | null): NodeKind => {
    if (!value) return "position";
    return value.levelCode?.trim() || value.holderName?.trim() || value.jobDescriptionId
        ? "position"
        : "department";
};

const getBulkParentKey = (row: BulkRow) => {
    if (row.existingParentId != null) return `existing-${row.existingParentId}`;
    if (row.parentIndex != null) return `row-${row.parentIndex}`;
    return "root";
};

const validateBulkRows = (rows: BulkRow[], existingNodes: any[]) => {
    const errors = new Map<string, string[]>();
    const existingIds = new Set(existingNodes.map((node) => Number(node.id)));
    const addError = (rowId: string, message: string) => {
        errors.set(rowId, [...(errors.get(rowId) ?? []), message]);
    };

    rows.forEach((row, index) => {
        const title = row.title.trim();
        const hasTypedValue = title || row.levelCode.trim() || row.holderName.trim() || row.jobDescriptionId;

        if (!title && hasTypedValue) addError(row.id, "Thiếu tên phòng ban/chức danh");
        if (row.existingParentId != null && !existingIds.has(row.existingParentId)) addError(row.id, "Cấp trên không còn tồn tại");
        if (row.parentIndex != null) {
            if (row.parentIndex < 0 || row.parentIndex >= rows.length) addError(row.id, "Dòng cấp trên không hợp lệ");
            else if (row.parentIndex >= index) addError(row.id, "Cấp trên phải là dòng phía trên để tránh vòng lặp");
            else if (!rows[row.parentIndex]?.title.trim()) addError(row.id, "Dòng cấp trên đang thiếu tên");
        }
    });

    const seen = new Map<string, string[]>();
    rows.forEach((row) => {
        const title = normalize(row.title);
        if (!title) return;
        const key = `${getBulkParentKey(row)}::${title}`;
        seen.set(key, [...(seen.get(key) ?? []), row.id]);
    });
    seen.forEach((ids) => {
        if (ids.length <= 1) return;
        ids.forEach((id) => addError(id, "Trùng tên trong cùng cấp"));
    });

    return errors;
};

const buildJobTitleOptions = (
    jobTitleOptions: SmartJobTitleOption[],
    jdOptions: SmartJdOption[],
) => {
    const jdByTitle = new Map<string, SmartJdOption>();
    jdOptions.forEach((jd) => {
        if (jd.jobTitleName) jdByTitle.set(normalize(jd.jobTitleName), jd);
    });

    return jobTitleOptions.map((option) => {
        const matchedJd = option.jdId
            ? jdOptions.find((jd) => jd.value === option.jdId)
            : jdByTitle.get(normalize(option.title));

        return {
            ...option,
            jdId: option.jdId ?? matchedJd?.value ?? null,
            jdLabel: option.jdLabel ?? matchedJd?.label,
        };
    });
};

// ─────────────────────────────────────────────────────────
// Design tokens
// ─────────────────────────────────────────────────────────
const P = {
    pink50: "#fff0f6",
    pink100: "#ffe3ed",
    pink200: "#ffc1d5",
    pink500: "#ec4899",
    pink600: "#db2777",
    pink700: "#be185d",
    gray50: "#f9fafb",
    gray100: "#f3f4f6",
    gray200: "#e5e7eb",
    gray300: "#d1d5db",
    gray400: "#9ca3af",
    gray500: "#6b7280",
    gray600: "#4b5563",
    gray700: "#374151",
    gray800: "#1f2937",
    gray900: "#111827",
    white: "#ffffff",
};

// ─────────────────────────────────────────────────────────
// Mode Toggle
// ─────────────────────────────────────────────────────────
const ModeToggle = ({ mode, onChange }: { mode: "single" | "bulk"; onChange: (m: "single" | "bulk") => void }) => (
    <div className="org-node-mode-toggle" data-guide-id="org-node-mode-toggle" style={{ display: "inline-flex", background: P.gray100, border: `1px solid ${P.gray200}`, borderRadius: 8, padding: 3, gap: 2 }}>
        {([
            { key: "single" as const, label: "Một vị trí", icon: <ApartmentOutlined /> },
            { key: "bulk" as const, label: "Hàng loạt", icon: <ThunderboltOutlined /> },
        ]).map((tab) => {
            const active = mode === tab.key;
            return (
                <button
                    key={tab.key}
                    data-guide-id={`org-node-mode-${tab.key}`}
                    onClick={() => onChange(tab.key)}
                    style={{
                        display: "flex", alignItems: "center", gap: 5,
                        padding: "5px 14px", borderRadius: 6, border: "none", cursor: "pointer",
                        fontSize: 12, fontWeight: active ? 700 : 500, whiteSpace: "nowrap",
                        background: active ? P.white : "transparent",
                        color: active ? P.pink700 : P.gray500,
                        boxShadow: active ? "0 1px 4px rgba(0,0,0,0.10)" : "none",
                        transition: "all 0.15s",
                    }}
                >
                    {tab.icon} {tab.label}
                </button>
            );
        })}
    </div>
);

const LevelBadge = ({ code }: { code?: string }) => (
    <span style={{
        minWidth: 38,
        textAlign: "center",
        fontSize: 11,
        lineHeight: "20px",
        height: 20,
        padding: "0 7px",
        borderRadius: 6,
        background: code ? P.pink50 : P.gray100,
        color: code ? P.pink700 : P.gray400,
        border: `1px solid ${code ? P.pink100 : P.gray200}`,
        fontFamily: "monospace",
        fontWeight: 700,
        flexShrink: 0,
    }}>
        {code || "--"}
    </span>
);

const JobTitleOptionView = ({ option }: { option: SmartJobTitleOption }) => (
    <div style={{ display: "flex", alignItems: "center", gap: 9, minWidth: 0 }}>
        <div style={{
            width: 24, height: 24, borderRadius: 7,
            background: P.gray50, border: `1px solid ${P.gray200}`,
            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
        }}>
            <ApartmentOutlined style={{ fontSize: 12, color: P.gray500 }} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: P.gray800, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {option.title}
            </div>
            <div style={{ fontSize: 11, color: P.gray400, marginTop: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {option.source || "Chức danh"}{option.jdLabel ? ` · ${option.jdLabel}` : ""}
            </div>
        </div>
        <LevelBadge code={option.levelCode} />
    </div>
);

const JobTitleCatalog = ({ options }: { options: SmartJobTitleOption[] }) => {
    const grouped = useMemo(() => {
        const map = new Map<string, SmartJobTitleOption[]>();
        options.forEach((option) => {
            const key = option.levelCode || "Chưa có mã";
            map.set(key, [...(map.get(key) ?? []), option]);
        });
        return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
    }, [options]);

    return (
        <div style={{ width: 320, maxHeight: 360, overflowY: "auto" }}>
            {grouped.length === 0 ? (
                <div style={{ color: P.gray400, fontSize: 12, padding: 10 }}>Chưa có danh mục chức danh</div>
            ) : grouped.map(([levelCode, items]) => (
                <div key={levelCode} style={{ padding: "8px 0", borderBottom: `1px solid ${P.gray100}` }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                        <LevelBadge code={levelCode === "Chưa có mã" ? undefined : levelCode} />
                        <span style={{ fontSize: 12, fontWeight: 700, color: P.gray700 }}>
                            {items.length} chức danh
                        </span>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                        {items.map((item) => (
                            <div key={`${item.value}-${item.source}`} style={{ display: "flex", alignItems: "center", gap: 6, paddingLeft: 4 }}>
                                <span style={{ width: 4, height: 4, borderRadius: "50%", background: P.pink500, flexShrink: 0 }} />
                                <span style={{ fontSize: 12, color: P.gray700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                    {item.title}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
};

const CatalogButton = ({ options }: { options: SmartJobTitleOption[] }) => (
    <Popover
        placement="leftTop"
        trigger="hover"
        title={<span style={{ fontSize: 13, fontWeight: 700 }}>Bảng cấp bậc & chức danh</span>}
        content={<JobTitleCatalog options={options} />}
    >
        <button
            type="button"
            style={{
                width: 34, height: 34, borderRadius: 8,
                border: `1px solid ${P.gray200}`,
                background: P.white,
                cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: P.gray500,
            }}
        >
            <ReadOutlined style={{ fontSize: 15 }} />
        </button>
    </Popover>
);

// ─────────────────────────────────────────────────────────
// Single-node form
// ─────────────────────────────────────────────────────────
const SingleNodeForm = ({ form, nodes, jdOptions, jobTitleOptions, isEditing, nodeKind, onNodeKindChange }: {
    form: any; nodes: any[];
    jdOptions: SmartJdOption[];
    jobTitleOptions: SmartJobTitleOption[];
    isEditing: boolean;
    nodeKind: NodeKind;
    onNodeKindChange: (kind: NodeKind) => void;
}) => {
    const lbl = (text: string) => (
        <span style={{ fontSize: 11, fontWeight: 600, color: P.gray400, letterSpacing: "0.05em", textTransform: "uppercase" as const }}>
            {text}
        </span>
    );
    const inp: React.CSSProperties = { borderRadius: 8, borderColor: P.gray200, fontSize: 13 };
    const isDepartment = nodeKind === "department";
    const hasSmartOptions = jobTitleOptions.length > 0 && !isEditing && !isDepartment;

    const smartOptions = useMemo(
        () => jobTitleOptions.map((option) => ({
            value: option.title,
            label: <JobTitleOptionView option={option} />,
            option,
        })),
        [jobTitleOptions],
    );

    const handleJobTitleSelect = (_value: string, optionData: any) => {
        const selected = optionData?.option as SmartJobTitleOption | undefined;
        if (!selected) return;
        form.setFieldsValue({
            title: selected.title,
            jobTitleId: selected.value,
            levelCode: selected.levelCode ?? "",
            jobDescriptionId: selected.jdId ?? undefined,
        });
    };

    return (
        <Form form={form} layout="vertical" requiredMark={false}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 14 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: P.gray500, letterSpacing: "0.05em", textTransform: "uppercase" }}>
                    Loại mục
                </span>
                <Segmented
                    data-guide-id="org-node-kind-toggle"
                    size="small"
                    value={nodeKind}
                    onChange={(value) => {
                        const nextKind = value as NodeKind;
                        onNodeKindChange(nextKind);
                        if (nextKind === "department") {
                            form.setFieldsValue({
                                levelCode: "",
                                holderName: "",
                                jobDescriptionId: undefined,
                                jobTitleId: undefined,
                            });
                        }
                    }}
                    options={[
                        { label: "Phòng ban", value: "department" },
                        { label: "Chức danh", value: "position" },
                    ]}
                    style={{ padding: 3, borderRadius: 8, background: P.gray100 }}
                />
            </div>

            <div style={{ display: "flex", gap: 8, alignItems: "flex-end", marginBottom: 14 }}>
                <Form.Item
                    name="title"
                    label={lbl(isDepartment ? "Tên phòng ban" : "Tên chức danh")}
                    rules={[{ required: true, message: isDepartment ? "Vui lòng nhập tên phòng ban" : "Vui lòng nhập tên chức danh" }]}
                    style={{ flex: 1, marginBottom: 0 }}
                >
                    {hasSmartOptions ? (
                        <AutoComplete
                            size="large"
                            options={smartOptions}
                            filterOption={(input, opt) => {
                                const option = opt?.option as SmartJobTitleOption | undefined;
                                return `${option?.title ?? ""} ${option?.levelCode ?? ""} ${option?.source ?? ""}`
                                    .toLowerCase()
                                    .includes(input.toLowerCase());
                            }}
                            onSelect={handleJobTitleSelect}
                            onChange={(value) => {
                                form.setFieldsValue({
                                    title: value,
                                    jobTitleId: undefined,
                                    jobDescriptionId: undefined,
                                });
                            }}
                            style={{ fontSize: 13 }}
                        >
                            <Input
                                placeholder="Tìm chức danh hoặc nhập tay..."
                                size="large"
                                style={inp}
                            />
                        </AutoComplete>
                    ) : (
                        <Input
                            placeholder={isDepartment ? "VD: Phòng Kinh doanh, Ban Kiểm soát..." : "VD: Trưởng phòng Kinh doanh..."}
                            size="large" style={inp}
                        />
                    )}
                </Form.Item>
                {hasSmartOptions && <CatalogButton options={jobTitleOptions} />}
            </div>

            {!isDepartment && (
                <div style={{ display: "flex", gap: 12, marginBottom: 14 }}>
                    <Form.Item name="levelCode" label={lbl("Mã cấp bậc")} style={{ flex: 1, marginBottom: 0 }}>
                        <Input prefix={<TagOutlined style={{ color: P.gray300 }} />} placeholder="Tự động theo chức danh..." size="large" style={inp} />
                    </Form.Item>
                    <Form.Item name="holderName" label={lbl("Người đảm nhiệm")} style={{ flex: 1, marginBottom: 0 }}>
                        <Input prefix={<UserOutlined style={{ color: P.gray300 }} />} placeholder="Tên người phụ trách..." size="large" style={inp} />
                    </Form.Item>
                </div>
            )}

            <Form.Item name="parentId" label={lbl("Thuộc đơn vị / cấp trên")} style={{ marginBottom: 14 }}>
                <Select
                    allowClear showSearch size="large"
                    placeholder="Chọn đơn vị hoặc vị trí cấp trên..."
                    filterOption={(input, opt) => (opt?.label as string ?? "").toLowerCase().includes(input.toLowerCase())}
                    options={nodes.map((n: any) => ({ value: Number(n.id), label: n.data?.title ?? `Node ${n.id}` }))}
                    optionRender={(opt) => (
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <ApartmentOutlined style={{ color: P.gray400, fontSize: 12 }} />
                            <span style={{ fontSize: 13 }}>{opt.label}</span>
                        </div>
                    )}
                    style={{ fontSize: 13 }}
                />
            </Form.Item>

            {!isDepartment && (
                <Form.Item name="jobDescriptionId" label={lbl("Mô tả công việc (JD)")} style={{ marginBottom: 14 }}>
                    <Select
                        allowClear showSearch size="large"
                        placeholder="Chọn JD đã ban hành..."
                        suffixIcon={<FileTextOutlined style={{ color: P.gray300 }} />}
                        options={jdOptions} style={{ fontSize: 13 }}
                    />
                </Form.Item>
            )}
        </Form>
    );
};

// ─────────────────────────────────────────────────────────
// Parent Cell — Portal-based dropdown (tránh bị clip bởi overflow:hidden)
// ─────────────────────────────────────────────────────────
const ParentCell = ({
    rowIndex,
    row,
    rows,
    existingNodes,
    onSelect,
}: {
    rowIndex: number;
    row: BulkRow;
    rows: BulkRow[];
    existingNodes: any[];
    onSelect: (existingId: number | null, parentIndex: number | null) => void;
}) => {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState("");
    const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0, width: 0 });
    const triggerRef = useRef<HTMLDivElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Tính toán vị trí dropdown dựa trên trigger rect
    const updatePosition = useCallback(() => {
        if (!triggerRef.current) return;
        const rect = triggerRef.current.getBoundingClientRect();
        const dropdownWidth = 260;
        const viewportWidth = window.innerWidth;

        // Flip left nếu không đủ chỗ bên phải
        let left = rect.left;
        if (left + dropdownWidth > viewportWidth - 8) {
            left = rect.right - dropdownWidth;
        }

        setDropdownPos({
            top: rect.bottom + 4,
            left,
            width: dropdownWidth,
        });
    }, []);

    // Mở dropdown
    const handleOpen = () => {
        updatePosition();
        setOpen(true);
        setSearch("");
    };

    // Focus search khi mở
    useEffect(() => {
        if (open) setTimeout(() => inputRef.current?.focus(), 20);
    }, [open]);

    // Close on outside click
    useEffect(() => {
        if (!open) return;
        const handler = (e: MouseEvent) => {
            const target = e.target as Node;
            if (
                triggerRef.current?.contains(target) ||
                dropdownRef.current?.contains(target)
            ) return;
            setOpen(false);
        };
        // Scroll trong bảng → đóng dropdown và cập nhật vị trí
        const onScroll = () => setOpen(false);
        document.addEventListener("mousedown", handler);
        document.addEventListener("scroll", onScroll, true);
        return () => {
            document.removeEventListener("mousedown", handler);
            document.removeEventListener("scroll", onScroll, true);
        };
    }, [open]);

    // Current label
    let currentLabel = "";
    if (row.existingParentId != null) {
        const n = existingNodes.find((n) => Number(n.id) === row.existingParentId);
        currentLabel = n?.data?.title ?? `Node ${row.existingParentId}`;
    } else if (row.parentIndex != null) {
        currentLabel = rows[row.parentIndex]?.title || `Dòng ${row.parentIndex + 1}`;
    }

    // Build option groups
    const lowerSearch = search.toLowerCase();
    const fromDB = existingNodes
        .filter((n) => (n.data?.title ?? "").toLowerCase().includes(lowerSearch))
        .map((n) => ({ id: `ex-${n.id}`, label: n.data?.title ?? `Node ${n.id}` }));

    const fromTable = rows
        .slice(0, rowIndex)
        .map((r, i) => r.title.trim() ? { id: `row-${i}`, label: r.title, num: i + 1 } : null)
        .filter((r): r is NonNullable<typeof r> => r !== null && r.label.toLowerCase().includes(lowerSearch));

    const handleSelect = (id: string) => {
        if (id.startsWith("ex-")) {
            onSelect(Number(id.replace("ex-", "")), null);
        } else {
            onSelect(null, Number(id.replace("row-", "")));
        }
        setOpen(false);
    };

    const handleClear = (e: React.MouseEvent) => {
        e.stopPropagation();
        onSelect(null, null);
    };

    const hasValue = currentLabel !== "";
    const noResults = fromDB.length === 0 && fromTable.length === 0;

    return (
        <>
            {/* Trigger button */}
            <div
                ref={triggerRef}
                onClick={() => open ? setOpen(false) : handleOpen()}
                style={{
                    display: "flex", alignItems: "center", gap: 6,
                    padding: "5px 10px", borderRadius: 7, cursor: "pointer",
                    border: `1.5px solid ${open ? P.pink500 : hasValue ? P.pink200 : P.gray200}`,
                    background: open ? P.pink50 : hasValue ? "#fff8fb" : P.white,
                    transition: "all 0.15s", minHeight: 32, userSelect: "none",
                    boxShadow: open ? `0 0 0 3px rgba(236,72,153,0.08)` : "none",
                }}
            >
                {hasValue ? (
                    <>
                        <div style={{
                            width: 18, height: 18, borderRadius: 5, background: P.pink100,
                            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                        }}>
                            <ApartmentOutlined style={{ fontSize: 10, color: P.pink600 }} />
                        </div>
                        <span style={{
                            fontSize: 12, color: P.gray800, fontWeight: 500,
                            flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                        }}>
                            {currentLabel}
                        </span>
                        <span
                            onClick={handleClear}
                            style={{
                                fontSize: 11, color: P.gray400, cursor: "pointer",
                                flexShrink: 0, lineHeight: 1, padding: "2px 3px", borderRadius: 3,
                                transition: "all 0.1s",
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.color = "#ef4444"; e.currentTarget.style.background = "#fef2f2"; }}
                            onMouseLeave={(e) => { e.currentTarget.style.color = P.gray400; e.currentTarget.style.background = "transparent"; }}
                        >
                            ✕
                        </span>
                    </>
                ) : (
                    <>
                        <span style={{ fontSize: 12, color: P.gray400, flex: 1 }}>Chọn cấp trên...</span>
                        <svg
                            width="10" height="6" viewBox="0 0 10 6" fill="none"
                            style={{ flexShrink: 0, transition: "transform 0.15s", transform: open ? "rotate(180deg)" : "none" }}
                        >
                            <path d="M1 1l4 4 4-4" stroke={P.gray300} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </>
                )}
            </div>

            {/* Dropdown via Portal — thoát khỏi overflow:hidden của table */}
            {open && createPortal(
                <div
                    ref={dropdownRef}
                    style={{
                        position: "fixed",
                        top: dropdownPos.top,
                        left: dropdownPos.left,
                        width: dropdownPos.width,
                        zIndex: 99999,
                        background: P.white,
                        border: `1px solid ${P.gray200}`,
                        borderRadius: 10,
                        boxShadow: "0 12px 32px rgba(0,0,0,0.14), 0 2px 8px rgba(0,0,0,0.06)",
                        overflow: "hidden",
                    }}
                >
                    {/* Search */}
                    <div style={{ padding: "8px 10px", borderBottom: `1px solid ${P.gray100}` }}>
                        <div style={{
                            display: "flex", alignItems: "center", gap: 7,
                            background: P.gray50, border: `1px solid ${P.gray200}`,
                            borderRadius: 7, padding: "6px 10px",
                        }}>
                            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                                <circle cx="5" cy="5" r="3.5" stroke={P.gray400} strokeWidth="1.3" />
                                <path d="M8 8l2 2" stroke={P.gray400} strokeWidth="1.3" strokeLinecap="round" />
                            </svg>
                            <input
                                ref={inputRef}
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                onKeyDown={(e) => { if (e.key === "Escape") setOpen(false); }}
                                placeholder="Tìm kiếm vị trí..."
                                style={{
                                    border: "none", outline: "none", background: "transparent",
                                    fontSize: 12.5, color: P.gray800, width: "100%", fontFamily: "inherit",
                                }}
                            />
                            {search && (
                                <span
                                    onClick={() => setSearch("")}
                                    style={{ fontSize: 10, color: P.gray400, cursor: "pointer", flexShrink: 0 }}
                                >
                                    ✕
                                </span>
                            )}
                        </div>
                    </div>

                    <div style={{ maxHeight: 240, overflowY: "auto" }}>
                        {noResults && (
                            <div style={{
                                padding: "24px 14px", textAlign: "center",
                                color: P.gray400, fontSize: 12,
                            }}>
                                <div style={{ fontSize: 20, marginBottom: 6 }}>🔍</div>
                                Không tìm thấy kết quả
                            </div>
                        )}

                        {fromDB.length > 0 && (
                            <div>
                                <SectionLabel>Vị trí hiện có</SectionLabel>
                                {fromDB.map((opt) => (
                                    <OptionItem
                                        key={opt.id}
                                        label={opt.label}
                                        isSelected={row.existingParentId != null && `ex-${row.existingParentId}` === opt.id}
                                        badge={null}
                                        onClick={() => handleSelect(opt.id)}
                                    />
                                ))}
                            </div>
                        )}

                        {fromTable.length > 0 && (
                            <div style={{ borderTop: fromDB.length > 0 ? `1px solid ${P.gray100}` : "none" }}>
                                <SectionLabel>Trong bảng này</SectionLabel>
                                {fromTable.map((opt) => (
                                    <OptionItem
                                        key={opt.id}
                                        label={opt.label}
                                        isSelected={row.parentIndex != null && `row-${row.parentIndex}` === opt.id}
                                        badge={`#${opt.num}`}
                                        onClick={() => handleSelect(opt.id)}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                </div>,
                document.body,
            )}
        </>
    );
};

const SectionLabel = ({ children }: { children: React.ReactNode }) => (
    <div style={{
        padding: "8px 14px 4px",
        fontSize: 10, fontWeight: 700, color: P.gray400,
        letterSpacing: "0.08em", textTransform: "uppercase" as const,
    }}>
        {children}
    </div>
);

const OptionItem = ({ label, isSelected, badge, onClick }: {
    label: string; isSelected: boolean; badge: string | null; onClick: () => void;
}) => {
    const [hovered, setHovered] = useState(false);
    return (
        <div
            onClick={onClick}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            style={{
                display: "flex", alignItems: "center", gap: 8,
                padding: "7px 14px", cursor: "pointer",
                background: isSelected ? P.pink50 : hovered ? P.gray50 : P.white,
                transition: "background 0.1s",
            }}
        >
            <div style={{
                width: 20, height: 20, borderRadius: 5, flexShrink: 0,
                background: isSelected ? P.pink100 : P.gray100,
                display: "flex", alignItems: "center", justifyContent: "center",
            }}>
                <ApartmentOutlined style={{ fontSize: 10, color: isSelected ? P.pink600 : P.gray500 }} />
            </div>
            <span style={{
                fontSize: 12.5, color: isSelected ? P.pink700 : P.gray800,
                fontWeight: isSelected ? 600 : 400,
                flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            }}>
                {label}
            </span>
            {badge && (
                <span style={{
                    fontSize: 10, color: P.gray400, background: P.gray100,
                    borderRadius: 4, padding: "1px 5px", fontFamily: "monospace", fontWeight: 600,
                }}>
                    {badge}
                </span>
            )}
            {isSelected && (
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ flexShrink: 0 }}>
                    <path d="M2 6l3 3 5-5" stroke={P.pink600} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            )}
        </div>
    );
};

// ─────────────────────────────────────────────────────────
// Bulk Table Editor
// ─────────────────────────────────────────────────────────
const BulkTableEditor = ({ rows, setRows, existingNodes, jobTitleOptions, errors }: {
    rows: BulkRow[];
    setRows: React.Dispatch<React.SetStateAction<BulkRow[]>>;
    existingNodes: any[];
    jobTitleOptions: SmartJobTitleOption[];
    errors: Map<string, string[]>;
}) => {
    const inputRefs = useRef<Map<string, HTMLInputElement | null>>(new Map());
    const depthMemo = new Map<number, number>();
    const depths = rows.map((_, i) => getDepth(rows, i, depthMemo));

    const updateRow = useCallback(
        (id: string, field: keyof BulkRow, value: any) =>
            setRows((prev) => prev.map((r) => (r.id === id ? { ...r, [field]: value } : r))),
        [setRows],
    );

    const applyJobTitleToRow = useCallback((rowId: string, value: number) => {
        const selected = jobTitleOptions.find((option) => option.value === value);
        if (!selected) return;
        setRows((prev) => prev.map((row) => row.id === rowId ? {
            ...row,
            jobTitleId: selected.value,
            title: selected.title,
            levelCode: selected.levelCode ?? "",
            jobDescriptionId: selected.jdId ?? null,
        } : row));
    }, [jobTitleOptions, setRows]);

    const smartOptions = useMemo(
        () => jobTitleOptions.map((option) => ({
            value: option.title,
            label: <JobTitleOptionView option={option} />,
            option,
        })),
        [jobTitleOptions],
    );

    const addRowAfter = useCallback(
        (afterIndex: number) => {
            const above = rows[afterIndex];
            const newRow = emptyRow({
                parentIndex: above?.parentIndex ?? null,
                existingParentId: above?.existingParentId ?? null,
            });
            setRows((prev) => {
                const next = [...prev];
                next.splice(afterIndex + 1, 0, newRow);
                return next.map((r, i) => {
                    if (i <= afterIndex + 1) return r;
                    if (r.parentIndex !== null && r.parentIndex > afterIndex)
                        return { ...r, parentIndex: r.parentIndex + 1 };
                    return r;
                });
            });
            setTimeout(() => inputRefs.current.get(`title-${newRow.id}`)?.focus(), 30);
        },
        [rows, setRows],
    );

    const deleteRow = useCallback(
        (index: number) => {
            if (rows.length === 1) return;
            setRows((prev) =>
                prev.filter((_, i) => i !== index).map((r) => {
                    if (r.parentIndex === null) return r;
                    if (r.parentIndex === index) return { ...r, parentIndex: null };
                    if (r.parentIndex > index) return { ...r, parentIndex: r.parentIndex - 1 };
                    return r;
                }),
            );
            const target = rows[index - 1] ?? rows[index + 1];
            if (target) setTimeout(() => inputRefs.current.get(`title-${target.id}`)?.focus(), 30);
        },
        [rows, setRows],
    );

    // FIX: prevent default on Enter/Tab/Backspace to avoid double-newline or form submission
    const handleKeyDown = useCallback(
        (e: React.KeyboardEvent<HTMLInputElement>, rowIndex: number, field: "title" | "levelCode" | "holderName") => {
            if (e.key === "Enter") {
                e.preventDefault();
                e.stopPropagation();
                addRowAfter(rowIndex);
                return;
            }
            if (e.key === "Tab" && !e.shiftKey && field === "holderName") {
                e.preventDefault();
                e.stopPropagation();
                addRowAfter(rowIndex);
                return;
            }
            if (e.key === "Backspace" && (e.target as HTMLInputElement).value === "" && rows.length > 1) {
                e.preventDefault();
                e.stopPropagation();
                deleteRow(rowIndex);
            }
        },
        [addRowAfter, deleteRow, rows.length],
    );

    const hasSmartOptions = jobTitleOptions.length > 0;
    const COLS = "30px minmax(260px,1fr) 74px 128px 190px 28px";
    const cellBase: React.CSSProperties = {
        width: "100%", border: "none", outline: "none",
        background: "transparent", padding: "2px 0",
        fontFamily: "inherit", fontSize: 13, color: P.gray800,
    };

    return (
        <div>
            {/* Table header */}
            <div style={{
                display: "grid", gridTemplateColumns: COLS, gap: 8,
                padding: "8px 14px", background: P.gray100,
                borderRadius: "10px 10px 0 0",
                border: `1px solid ${P.gray200}`, borderBottom: "none",
            }}>
                {["#", "Tên phòng ban / chức danh *", "Mã cấp", "Người đảm nhiệm", "Thuộc đơn vị / cấp trên", ""].map((h, i) => (
                    <div
                        key={i}
                        style={{
                            fontSize: 10,
                            fontWeight: 700,
                            color: P.gray500,
                            letterSpacing: "0.07em",
                            textTransform: "uppercase",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                        }}
                    >
                        {i === 1 && hasSmartOptions ? (
                            <Tooltip title="Gõ để tìm trong danh mục, hoặc nhập tay tên phòng ban/chức danh mới.">
                                <span>{h}</span>
                            </Tooltip>
                        ) : h}
                    </div>
                ))}
            </div>

            {/* Rows */}
            <div style={{ border: `1px solid ${P.gray200}`, borderRadius: "0 0 10px 10px", maxHeight: 400, overflowY: "auto" }}>
                {rows.map((row, i) => {
                    const depth = depths[i];
                    const dotColor = row.title.trim() ? DEPTH_COLORS[depth % DEPTH_COLORS.length] : P.gray300;
                    const isLast = i === rows.length - 1;
                    const rowErrors = errors.get(row.id) ?? [];
                    const hasError = rowErrors.length > 0;
                    return (
                        <div
                            key={row.id}
                            style={{
                                display: "grid", gridTemplateColumns: COLS, gap: 8,
                                padding: hasError ? "7px 14px 8px" : "7px 14px",
                                borderBottom: isLast ? "none" : `1px solid ${P.gray100}`,
                                background: hasError ? "#fff7f7" : i % 2 === 0 ? P.white : P.gray50,
                                alignItems: "start",
                            }}
                        >
                            {/* # + dot */}
                            <div style={{ display: "flex", alignItems: "center", gap: 5, minHeight: 32 }}>
                                <div style={{ width: 7, height: 7, borderRadius: "50%", background: dotColor, flexShrink: 0 }} />
                                <span style={{ fontSize: 10, color: P.gray500, fontFamily: "monospace", fontWeight: 600 }}>{i + 1}</span>
                            </div>

                            {/* Title + indent */}
                            <div style={{ paddingLeft: depth * 14, display: "flex", flexDirection: "column", gap: 3, overflow: "hidden", minWidth: 0 }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0 }}>
                                    {depth > 0 && <span style={{ color: P.gray300, fontSize: 11, flexShrink: 0 }}>└</span>}
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        {hasSmartOptions ? (
                                            <AutoComplete
                                                size="small"
                                                value={row.title}
                                                options={smartOptions}
                                                filterOption={(input, opt) => {
                                                    const option = opt?.option as SmartJobTitleOption | undefined;
                                                    return `${option?.title ?? ""} ${option?.levelCode ?? ""} ${option?.source ?? ""}`
                                                        .toLowerCase()
                                                        .includes(input.toLowerCase());
                                                }}
                                                onSelect={(_value, optionData: any) => {
                                                    const selected = optionData?.option as SmartJobTitleOption | undefined;
                                                    if (selected) applyJobTitleToRow(row.id, selected.value);
                                                }}
                                                onChange={(value) => {
                                                    setRows((prev) => prev.map((r) => r.id === row.id ? {
                                                        ...r,
                                                        title: value,
                                                        jobTitleId: null,
                                                        jobDescriptionId: null,
                                                    } : r));
                                                }}
                                                style={{ width: "100%" }}
                                                popupMatchSelectWidth={320}
                                            >
                                                <input
                                                    ref={(el) => { inputRefs.current.set(`title-${row.id}`, el); }}
                                                    onKeyDown={(e) => handleKeyDown(e, i, "title")}
                                                    placeholder={`Phòng ban hoặc chức danh ${i + 1}...`}
                                                    style={{ ...cellBase, fontWeight: row.title ? 500 : 400, color: row.title ? P.gray900 : P.gray400 }}
                                                />
                                            </AutoComplete>
                                        ) : (
                                            <input
                                                ref={(el) => { inputRefs.current.set(`title-${row.id}`, el); }}
                                                value={row.title}
                                                onChange={(e) => updateRow(row.id, "title", e.target.value)}
                                                onKeyDown={(e) => handleKeyDown(e, i, "title")}
                                                placeholder={`Phòng ban hoặc chức danh ${i + 1}...`}
                                                style={{ ...cellBase, fontWeight: row.title ? 500 : 400, color: row.title ? P.gray900 : P.gray400 }}
                                            />
                                        )}
                                    </div>
                                </div>
                                {hasError && (
                                    <div style={{ color: "#dc2626", fontSize: 11, fontWeight: 600, lineHeight: 1.35 }}>
                                        {rowErrors.join(" · ")}
                                    </div>
                                )}
                            </div>

                            {/* Level code */}
                            <input
                                ref={(el) => { inputRefs.current.set(`level-${row.id}`, el); }}
                                value={row.levelCode}
                                onChange={(e) => updateRow(row.id, "levelCode", e.target.value)}
                                onKeyDown={(e) => handleKeyDown(e, i, "levelCode")}
                                placeholder="M1..."
                                style={{ ...cellBase, fontSize: 11, fontWeight: 700, fontFamily: "monospace", color: P.pink600 }}
                            />

                            {/* Holder */}
                            <input
                                ref={(el) => { inputRefs.current.set(`holder-${row.id}`, el); }}
                                value={row.holderName}
                                onChange={(e) => updateRow(row.id, "holderName", e.target.value)}
                                onKeyDown={(e) => handleKeyDown(e, i, "holderName")}
                                placeholder="Để trống nếu là phòng ban..."
                                style={{ ...cellBase, fontSize: 12, color: P.gray700 }}
                            />

                            {/* Parent — custom inline dropdown */}
                            <ParentCell
                                rowIndex={i}
                                row={row}
                                rows={rows}
                                existingNodes={existingNodes}
                                onSelect={(existingId, parentIndex) => {
                                    updateRow(row.id, "existingParentId", existingId);
                                    updateRow(row.id, "parentIndex", parentIndex);
                                }}
                            />

                            {/* Delete */}
                            <Tooltip title={rows.length === 1 ? "" : "Xóa dòng"} mouseEnterDelay={0.6}>
                                <button
                                    onClick={() => deleteRow(i)}
                                    disabled={rows.length === 1}
                                    style={{
                                        width: 24, height: 24, borderRadius: 6, border: "none",
                                        background: "transparent",
                                        cursor: rows.length === 1 ? "not-allowed" : "pointer",
                                        display: "flex", alignItems: "center", justifyContent: "center",
                                        color: rows.length === 1 ? P.gray200 : P.gray400,
                                        padding: 0, transition: "all 0.12s",
                                    }}
                                    onMouseEnter={(e) => {
                                        if (rows.length > 1) {
                                            e.currentTarget.style.color = "#ef4444";
                                            e.currentTarget.style.background = "#fef2f2";
                                        }
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.color = P.gray400;
                                        e.currentTarget.style.background = "transparent";
                                    }}
                                >
                                    <DeleteOutlined style={{ fontSize: 12 }} />
                                </button>
                            </Tooltip>
                        </div>
                    );
                })}
            </div>

            {/* Add row */}
            <button
                onClick={() => addRowAfter(rows.length - 1)}
                style={{
                    marginTop: 8, width: "100%", height: 36,
                    border: `1.5px dashed ${P.gray200}`, borderRadius: 8,
                    background: "transparent", cursor: "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    gap: 6, color: P.gray400, fontSize: 12, fontWeight: 500, transition: "all 0.15s",
                }}
                onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = P.pink500;
                    e.currentTarget.style.color = P.pink600;
                    e.currentTarget.style.background = P.pink50;
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = P.gray200;
                    e.currentTarget.style.color = P.gray400;
                    e.currentTarget.style.background = "transparent";
                }}
            >
                <PlusOutlined style={{ fontSize: 11 }} />
                Thêm dòng
                <span style={{ color: P.gray300, fontWeight: 400, fontSize: 11 }}>· hoặc nhấn Enter</span>
            </button>
        </div>
    );
};

// ─────────────────────────────────────────────────────────
// Main Modal
// ─────────────────────────────────────────────────────────
const ModalNode = ({
    open, onClose, onSubmit, onBulkSubmit,
    nodes, initialValues, isEditing = false, jdOptions = [], jobTitleOptions = [],
    initialMode = "single", initialNodeKind = "position",
}: Props) => {
    const [form] = Form.useForm();
    const [mode, setMode] = useState<"single" | "bulk">("single");
    const [nodeKind, setNodeKind] = useState<NodeKind>("position");
    const [rows, setRows] = useState<BulkRow[]>([emptyRow()]);
    const smartJobTitleOptions = useMemo(
        () => buildJobTitleOptions(jobTitleOptions, jdOptions),
        [jobTitleOptions, jdOptions],
    );

    useEffect(() => {
        if (open) {
            form.resetFields();
            setMode(initialMode);
            setNodeKind(initialValues?.nodeKind ?? (initialValues ? inferNodeKind(initialValues) : initialNodeKind));
            if (initialValues) {
                form.setFieldsValue(initialValues);
                if (isEditing || (initialValues.parentId && initialMode !== "bulk")) {
                    setMode("single");
                }
            }
            if (!isEditing) {
                setRows([
                    emptyRow(initialMode === "bulk" && initialValues?.parentId
                        ? { existingParentId: initialValues.parentId, parentIndex: null }
                        : undefined),
                ]);
            }
        }
    }, [open, isEditing, initialValues, form, initialMode, initialNodeKind]);

    const validCount = rows.filter((r) => r.title.trim()).length;
    const isBulk = mode === "bulk";
    const bulkErrors = useMemo(() => validateBulkRows(rows, nodes), [rows, nodes]);
    const hasBulkErrors = isBulk && validCount > 0 && bulkErrors.size > 0;

    const handleOk = async () => {
        if (!isBulk) {
            const values = await form.validateFields();
            onSubmit({
                ...values,
                levelCode: nodeKind === "department" ? "" : values.levelCode,
                holderName: nodeKind === "department" ? null : values.holderName,
                jobDescriptionId: nodeKind === "department" ? null : values.jobDescriptionId,
                isGoal: false,
            });
            form.resetFields();
        } else {
            if (validCount === 0 || hasBulkErrors) return;
            onBulkSubmit?.(
                rows.filter((r) => r.title.trim()).map((r) => ({
                    title: r.title.trim(),
                    levelCode: r.levelCode.trim(),
                    holderName: r.holderName.trim() || undefined,
                    parentIndex: r.parentIndex,
                    existingParentId: r.existingParentId,
                    jobDescriptionId: r.jobDescriptionId ?? null,
                })),
            );
        }
    };

    const okLabel = isEditing
        ? "Lưu thay đổi"
        : isBulk
            ? `Tạo ${validCount > 0 ? `${validCount} mục` : "hàng loạt"}`
            : nodeKind === "department" ? "Tạo phòng ban" : "Tạo chức danh";

    return (
        <Modal
            className="org-node-form-modal"
            title={null}
            open={open}
            onCancel={() => { form.resetFields(); onClose(); }}
            onOk={handleOk}
            okText={okLabel}
            cancelText="Hủy"
            destroyOnHidden
            okButtonProps={{
                disabled: isBulk && (validCount === 0 || hasBulkErrors),
                style: {
                    background: isBulk && (validCount === 0 || hasBulkErrors)
                        ? P.gray200
                        : "linear-gradient(135deg, #be185d 0%, #db2777 60%, #ec4899 100%)",
                    borderColor: "transparent",
                    color: "#fff",
                    fontWeight: 600,
                    height: 38,
                    borderRadius: 8,
                    fontSize: 13,
                    minWidth: 120,
                    boxShadow: isBulk && (validCount === 0 || hasBulkErrors) ? "none" : "0 2px 8px rgba(219,39,119,0.3)",
                    opacity: isBulk && (validCount === 0 || hasBulkErrors) ? 0.6 : 1,
                },
            }}
            cancelButtonProps={{
                style: { height: 38, borderRadius: 8, fontSize: 13, borderColor: P.gray200, color: P.gray600 },
            }}
            styles={{
                content: {
                    borderRadius: 14, padding: 0, overflow: "hidden",
                    boxShadow: "0 20px 60px rgba(0,0,0,0.12), 0 4px 12px rgba(0,0,0,0.06)",
                },
                body: { padding: 0 },
                footer: {
                    padding: "12px 24px 18px",
                    borderTop: `1px solid ${P.gray100}`,
                    background: P.gray50,
                    margin: 0,
                },
            }}
            width={isBulk ? getModalWidth(920) : getModalWidth(560)}
        >
            <style>{`
                .org-node-form-modal .org-node-mode-toggle button {
                    font-size: 13px !important;
                    line-height: 20px !important;
                }
                .org-node-form-modal .ant-form-item-label > label,
                .org-node-form-modal .ant-form-item-label label span {
                    font-size: 12px !important;
                    line-height: 18px !important;
                }
                .org-node-form-modal .ant-form-item-label {
                    height: 24px !important;
                    padding: 0 0 6px !important;
                    display: flex !important;
                    align-items: center !important;
                }
                .org-node-form-modal .ant-form-item-label > label {
                    height: 18px !important;
                    display: inline-flex !important;
                    align-items: center !important;
                    margin: 0 !important;
                }
                .org-node-form-modal .ant-input,
                .org-node-form-modal .ant-input-affix-wrapper input,
                .org-node-form-modal .ant-select-selection-item,
                .org-node-form-modal .ant-select-selection-placeholder {
                    font-size: 14px !important;
                    line-height: 22px !important;
                }
                .org-node-form-modal .ant-input-lg,
                .org-node-form-modal .ant-input-affix-wrapper-lg,
                .org-node-form-modal .ant-select-lg .ant-select-selector {
                    min-height: 40px !important;
                    height: 40px !important;
                    border-radius: 10px !important;
                }
                .org-node-form-modal .ant-input-affix-wrapper {
                    display: inline-flex !important;
                    align-items: center !important;
                }
                .org-node-form-modal .ant-input-prefix,
                .org-node-form-modal .ant-input-suffix,
                .org-node-form-modal .ant-select-arrow {
                    display: inline-flex !important;
                    align-items: center !important;
                    justify-content: center !important;
                }
                .org-node-form-modal .ant-select-selector {
                    display: flex !important;
                    align-items: center !important;
                }
                .org-node-form-modal .ant-select-lg .ant-select-selection-search-input {
                    height: 38px !important;
                    font-size: 14px !important;
                }
                .org-node-form-modal .ant-select-selection-search {
                    display: flex !important;
                    align-items: center !important;
                }
                .org-node-form-modal .ant-segmented {
                    font-size: 13px !important;
                    border-radius: 10px !important;
                }
                .org-node-form-modal .ant-segmented-item-label {
                    min-height: 30px !important;
                    line-height: 30px !important;
                    padding: 0 12px !important;
                    font-size: 13px !important;
                    display: inline-flex !important;
                    align-items: center !important;
                    justify-content: center !important;
                }
            `}</style>
            {/* ── HEADER ── */}
            <div style={{ padding: "18px 24px 16px", borderBottom: `1px solid ${P.gray100}`, background: P.white }}>
                {/* Row 1: icon + title */}
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: !isEditing ? 14 : 0 }}>
                    <div style={{
                        width: 38, height: 38, borderRadius: 9,
                        background: P.pink50, border: `1px solid ${P.pink100}`,
                        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                    }}>
                        {isBulk
                            ? <ThunderboltOutlined style={{ fontSize: 16, color: P.pink600 }} />
                            : <ApartmentOutlined style={{ fontSize: 16, color: P.pink600 }} />
                        }
                    </div>
                    <div>
                        <div style={{ fontWeight: 700, fontSize: 15, color: P.gray900, lineHeight: 1.3 }}>
                            {isEditing
                                ? nodeKind === "department" ? "Chỉnh sửa phòng ban" : "Chỉnh sửa chức danh"
                                : isBulk
                                    ? `Tạo hàng loạt${validCount > 0 ? ` · ${validCount} mục` : ""}`
                                    : nodeKind === "department" ? "Thêm phòng ban mới" : "Thêm chức danh mới"
                            }
                        </div>
                        <div style={{ fontSize: 12, color: P.gray400, marginTop: 2 }}>
                            {isEditing
                                ? "Cập nhật thông tin trong sơ đồ tổ chức"
                                : isBulk
                                    ? "Nhập nhiều phòng ban/chức danh cùng lúc vào sơ đồ"
                                    : "Tạo một mục trong sơ đồ tổ chức"
                            }
                        </div>
                    </div>
                </div>

                {/* Row 2: mode toggle */}
                {!isEditing && (
                    <ModeToggle mode={mode} onChange={setMode} />
                )}
            </div>

            {/* ── BODY ── */}
            <div style={{ padding: isBulk ? "20px 24px 8px" : "20px 24px 4px", background: P.white }}>
                {mode === "single"
                    ? <SingleNodeForm form={form} nodes={nodes} jdOptions={jdOptions} jobTitleOptions={smartJobTitleOptions} isEditing={isEditing} nodeKind={nodeKind} onNodeKindChange={setNodeKind} />
                    : <BulkTableEditor rows={rows} setRows={setRows} existingNodes={nodes} jobTitleOptions={smartJobTitleOptions} errors={bulkErrors} />
                }
            </div>
        </Modal>
    );
};

export default ModalNode;
