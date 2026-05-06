import { useEffect, useState, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { Modal, Form, Input, Select, Switch, Tooltip } from "antd";
import {
    UserOutlined,
    TagOutlined,
    ApartmentOutlined,
    FileTextOutlined,
    ThunderboltOutlined,
    PlusOutlined,
    DeleteOutlined,
    StarOutlined,
} from "@ant-design/icons";

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
}

export interface BulkNodeItem {
    title: string;
    levelCode: string;
    holderName?: string;
    parentIndex: number | null;
    existingParentId: number | null;
}

interface BulkRow {
    id: string;
    title: string;
    levelCode: string;
    holderName: string;
    parentIndex: number | null;
    existingParentId: number | null;
}

interface Props {
    open: boolean;
    onClose: () => void;
    onSubmit: (values: any) => void;
    onBulkSubmit?: (items: BulkNodeItem[]) => void;
    nodes: any[];
    initialValues?: InitialValues;
    isEditing?: boolean;
    jdOptions?: { value: number; label: string }[];
}

// ─────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────
let _uid = 0;
const uid = () => `r${++_uid}`;

const emptyRow = (overrides: Partial<BulkRow> = {}): BulkRow => ({
    id: uid(),
    title: "",
    levelCode: "",
    holderName: "",
    parentIndex: null,
    existingParentId: null,
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
    <div style={{ display: "inline-flex", background: P.gray100, border: `1px solid ${P.gray200}`, borderRadius: 8, padding: 3, gap: 2 }}>
        {([
            { key: "single" as const, label: "Một vị trí", icon: <ApartmentOutlined /> },
            { key: "bulk" as const, label: "Hàng loạt", icon: <ThunderboltOutlined /> },
        ]).map((tab) => {
            const active = mode === tab.key;
            return (
                <button
                    key={tab.key}
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

// ─────────────────────────────────────────────────────────
// Single-node form
// ─────────────────────────────────────────────────────────
const SingleNodeForm = ({ form, nodes, jdOptions, isEditing }: {
    form: any; nodes: any[];
    jdOptions: { value: number; label: string }[];
    isEditing: boolean;
}) => {
    const lbl = (text: string) => (
        <span style={{ fontSize: 11, fontWeight: 600, color: P.gray400, letterSpacing: "0.05em", textTransform: "uppercase" as const }}>
            {text}
        </span>
    );
    const inp: React.CSSProperties = { borderRadius: 8, borderColor: P.gray200, fontSize: 13 };

    return (
        <Form form={form} layout="vertical" requiredMark={false}>
            <Form.Item
                name="title"
                label={lbl("Tên chức danh")}
                rules={[{ required: true, message: "Vui lòng nhập tên chức danh" }]}
                style={{ marginBottom: 14 }}
            >
                <Input
                    prefix={<UserOutlined style={{ color: P.gray300 }} />}
                    placeholder="VD: Giám đốc điều hành, Trưởng phòng Kinh doanh..."
                    size="large" style={inp}
                />
            </Form.Item>

            <div style={{ display: "flex", gap: 12, marginBottom: 14 }}>
                <Form.Item name="levelCode" label={lbl("Mã cấp bậc")} style={{ flex: 1, marginBottom: 0 }}>
                    <Input prefix={<TagOutlined style={{ color: P.gray300 }} />} placeholder="C1, M2, S3..." size="large" style={inp} />
                </Form.Item>
                <Form.Item name="holderName" label={lbl("Người phụ trách")} style={{ flex: 1, marginBottom: 0 }}>
                    <Input prefix={<UserOutlined style={{ color: P.gray300 }} />} placeholder="Nguyễn Văn A..." size="large" style={inp} />
                </Form.Item>
            </div>

            <Form.Item name="parentId" label={lbl("Cấp trên trực tiếp")} style={{ marginBottom: 14 }}>
                <Select
                    allowClear showSearch size="large"
                    placeholder="Chọn vị trí cấp trên..."
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

            <Form.Item name="jobDescriptionId" label={lbl("Mô tả công việc (JD)")} style={{ marginBottom: 14 }}>
                <Select
                    allowClear showSearch size="large"
                    placeholder="Chọn JD đã ban hành..."
                    suffixIcon={<FileTextOutlined style={{ color: P.gray300 }} />}
                    options={jdOptions} style={{ fontSize: 13 }}
                />
            </Form.Item>

            <Form.Item style={{ marginBottom: 2 }}>
                <div style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    background: P.pink50, border: `1px solid ${P.pink100}`, borderRadius: 10, padding: "12px 16px",
                }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{
                            width: 32, height: 32, borderRadius: 8,
                            background: P.pink100, display: "flex", alignItems: "center", justifyContent: "center",
                        }}>
                            <StarOutlined style={{ color: P.pink600, fontSize: 14 }} />
                        </div>
                        <div>
                            <div style={{ fontSize: 13, fontWeight: 600, color: P.gray800 }}>Vị trí mục tiêu</div>
                            <div style={{ fontSize: 12, color: P.gray500, marginTop: 1 }}>
                                Đánh dấu đây là vị trí hướng đến trong lộ trình phát triển
                            </div>
                        </div>
                    </div>
                    <Form.Item name="isGoal" valuePropName="checked" noStyle>
                        <Switch size="small" style={{ marginLeft: 12 }} />
                    </Form.Item>
                </div>
            </Form.Item>
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
const BulkTableEditor = ({ rows, setRows, existingNodes }: {
    rows: BulkRow[];
    setRows: React.Dispatch<React.SetStateAction<BulkRow[]>>;
    existingNodes: any[];
}) => {
    const inputRefs = useRef<Map<string, HTMLInputElement | null>>(new Map());
    const depthMemo = new Map<number, number>();
    const depths = rows.map((_, i) => getDepth(rows, i, depthMemo));

    const updateRow = useCallback(
        (id: string, field: keyof BulkRow, value: any) =>
            setRows((prev) => prev.map((r) => (r.id === id ? { ...r, [field]: value } : r))),
        [setRows],
    );

    const addRowAfter = useCallback(
        (afterIndex: number) => {
            const above = rows[afterIndex];
            const newRow = emptyRow({
                levelCode: above?.levelCode ?? "",
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

    const COLS = "30px 1fr 90px 150px 200px 28px";
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
                {["#", "Tên chức danh *", "Mã cấp", "Người phụ trách", "Cấp trên trực tiếp", ""].map((h, i) => (
                    <div key={i} style={{ fontSize: 10, fontWeight: 700, color: P.gray500, letterSpacing: "0.07em", textTransform: "uppercase" }}>
                        {h}
                    </div>
                ))}
            </div>

            {/* Rows */}
            <div style={{ border: `1px solid ${P.gray200}`, borderRadius: "0 0 10px 10px", maxHeight: 400, overflowY: "auto" }}>
                {rows.map((row, i) => {
                    const depth = depths[i];
                    const dotColor = row.title.trim() ? DEPTH_COLORS[depth % DEPTH_COLORS.length] : P.gray300;
                    const isLast = i === rows.length - 1;
                    return (
                        <div
                            key={row.id}
                            style={{
                                display: "grid", gridTemplateColumns: COLS, gap: 8,
                                padding: "7px 14px",
                                borderBottom: isLast ? "none" : `1px solid ${P.gray100}`,
                                background: i % 2 === 0 ? P.white : P.gray50,
                                alignItems: "center",
                            }}
                        >
                            {/* # + dot */}
                            <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                                <div style={{ width: 7, height: 7, borderRadius: "50%", background: dotColor, flexShrink: 0 }} />
                                <span style={{ fontSize: 10, color: P.gray500, fontFamily: "monospace", fontWeight: 600 }}>{i + 1}</span>
                            </div>

                            {/* Title + indent */}
                            <div style={{ paddingLeft: depth * 14, display: "flex", alignItems: "center", gap: 3, overflow: "hidden" }}>
                                {depth > 0 && <span style={{ color: P.gray300, fontSize: 11, flexShrink: 0 }}>└</span>}
                                <input
                                    ref={(el) => { inputRefs.current.set(`title-${row.id}`, el); }}
                                    value={row.title}
                                    onChange={(e) => updateRow(row.id, "title", e.target.value)}
                                    onKeyDown={(e) => handleKeyDown(e, i, "title")}
                                    placeholder={`Vị trí ${i + 1}...`}
                                    style={{ ...cellBase, fontWeight: row.title ? 500 : 400, color: row.title ? P.gray900 : P.gray400 }}
                                />
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
                                placeholder="Tên người..."
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
    nodes, initialValues, isEditing = false, jdOptions = [],
}: Props) => {
    const [form] = Form.useForm();
    const [mode, setMode] = useState<"single" | "bulk">("single");
    const [rows, setRows] = useState<BulkRow[]>([emptyRow()]);

    useEffect(() => {
        if (open) {
            if (isEditing && initialValues) { form.setFieldsValue(initialValues); setMode("single"); }
            else { form.resetFields(); }
            if (!isEditing) setRows([emptyRow()]);
        }
    }, [open, isEditing, initialValues, form]);

    const validCount = rows.filter((r) => r.title.trim()).length;
    const isBulk = mode === "bulk";

    const handleOk = async () => {
        if (!isBulk) {
            const values = await form.validateFields();
            onSubmit(values);
            form.resetFields();
        } else {
            if (validCount === 0) return;
            onBulkSubmit?.(
                rows.filter((r) => r.title.trim()).map((r) => ({
                    title: r.title.trim(),
                    levelCode: r.levelCode,
                    holderName: r.holderName || undefined,
                    parentIndex: r.parentIndex,
                    existingParentId: r.existingParentId,
                })),
            );
        }
    };

    const okLabel = isEditing
        ? "Lưu thay đổi"
        : isBulk
            ? `Tạo ${validCount > 0 ? `${validCount} vị trí` : "hàng loạt"}`
            : "Tạo vị trí";

    return (
        <Modal
            title={null}
            open={open}
            onCancel={() => { form.resetFields(); onClose(); }}
            onOk={handleOk}
            okText={okLabel}
            cancelText="Hủy"
            destroyOnHidden
            okButtonProps={{
                disabled: isBulk && validCount === 0,
                style: {
                    background: isBulk && validCount === 0
                        ? P.gray200
                        : "linear-gradient(135deg, #be185d 0%, #db2777 60%, #ec4899 100%)",
                    borderColor: "transparent",
                    color: "#fff",
                    fontWeight: 600,
                    height: 38,
                    borderRadius: 8,
                    fontSize: 13,
                    minWidth: 120,
                    boxShadow: isBulk && validCount === 0 ? "none" : "0 2px 8px rgba(219,39,119,0.3)",
                    opacity: isBulk && validCount === 0 ? 0.6 : 1,
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
            width={isBulk ? 920 : 560}
        >
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
                                ? "Chỉnh sửa vị trí"
                                : isBulk
                                    ? `Tạo hàng loạt${validCount > 0 ? ` · ${validCount} vị trí` : ""}`
                                    : "Thêm vị trí mới"
                            }
                        </div>
                        <div style={{ fontSize: 12, color: P.gray400, marginTop: 2 }}>
                            {isEditing
                                ? "Cập nhật thông tin chức danh"
                                : isBulk
                                    ? "Nhập nhiều vị trí cùng lúc vào sơ đồ"
                                    : "Tạo một vị trí trong sơ đồ tổ chức"
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
                    ? <SingleNodeForm form={form} nodes={nodes} jdOptions={jdOptions} isEditing={isEditing} />
                    : <BulkTableEditor rows={rows} setRows={setRows} existingNodes={nodes} />
                }
            </div>
        </Modal>
    );
};

export default ModalNode;