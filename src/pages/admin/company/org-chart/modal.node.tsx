import { useEffect, useState, useRef, useCallback } from "react";
import { Modal, Form, Input, Select, Switch } from "antd";
import {
    UserOutlined,
    TagOutlined,
    ApartmentOutlined,
    FileTextOutlined,
    ClusterOutlined,
    ThunderboltOutlined,
    PlusOutlined,
    DeleteOutlined,
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
    parentIndex: number | null;       // index dòng trong bảng
    existingParentId: number | null;  // id thực từ DB (node hiện có)
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
    id: uid(), title: "", levelCode: "", holderName: "", parentIndex: null, existingParentId: null, ...overrides,
});

const DEPTH_PALETTE = [
    { dot: "#e8637a" }, { dot: "#3b82f6" }, { dot: "#10b981" },
    { dot: "#f59e0b" }, { dot: "#8b5cf6" }, { dot: "#ec4899" },
];

// MỚI
const getDepth = (rows: BulkRow[], rowIndex: number, memo = new Map<number, number>()): number => {
    if (memo.has(rowIndex)) return memo.get(rowIndex)!;
    const row = rows[rowIndex];
    // Nếu cha là node hiện có (DB) → depth = 1
    if (row.existingParentId != null) { memo.set(rowIndex, 1); return 1; }
    if (row.parentIndex === null || row.parentIndex >= rowIndex) { memo.set(rowIndex, 0); return 0; }
    const d = 1 + getDepth(rows, row.parentIndex, memo);
    memo.set(rowIndex, d);
    return d;
};

const kbdStyle: React.CSSProperties = {
    background: "#fff", border: "1px solid #d1d5db", borderRadius: 4,
    padding: "1px 5px", fontSize: 10, fontFamily: "monospace", fontWeight: 700,
};

// ─────────────────────────────────────────────────────────
// Shared styles
// ─────────────────────────────────────────────────────────
const labelStyle: React.CSSProperties = { fontWeight: 600, fontSize: 13, color: "#374151" };
const prefixStyle: React.CSSProperties = { color: "#d1d5db", fontSize: 13 };
const inputStyle: React.CSSProperties = { borderRadius: 10, borderColor: "#e5e7eb", fontSize: 13 };

// ─────────────────────────────────────────────────────────
// Single-node form (unchanged)
// ─────────────────────────────────────────────────────────
const SingleNodeForm = ({ form, nodes, jdOptions, isEditing }: {
    form: any; nodes: any[];
    jdOptions: { value: number; label: string }[];
    isEditing: boolean;
}) => (
    <Form form={form} layout="vertical">
        <Form.Item name="title" label={<span style={labelStyle}>Tên chức danh</span>}
            rules={[{ required: true, message: "Vui lòng nhập tên chức danh" }]} style={{ marginBottom: 16 }}>
            <Input prefix={<UserOutlined style={prefixStyle} />} placeholder="VD: CEO, Trưởng phòng Kinh doanh..."
                size="large" style={inputStyle} />
        </Form.Item>

        <div style={{ display: "flex", gap: 14, marginBottom: 16 }}>
            <Form.Item name="levelCode" label={<span style={labelStyle}>Mã cấp bậc</span>} style={{ flex: 1, marginBottom: 0 }}>
                <Input prefix={<TagOutlined style={prefixStyle} />} placeholder="M1, S2, C-Level..."
                    size="large" style={inputStyle} />
            </Form.Item>
            <Form.Item name="holderName" label={<span style={labelStyle}>Người phụ trách</span>} style={{ flex: 1, marginBottom: 0 }}>
                <Input prefix={<UserOutlined style={prefixStyle} />} placeholder="Nguyễn Văn A..."
                    size="large" style={inputStyle} />
            </Form.Item>
        </div>

        <Form.Item name="parentId" label={<span style={labelStyle}>Cấp trên</span>} style={{ marginBottom: 16 }}>
            <Select allowClear placeholder="Chọn cấp trên (nếu có)" size="large" style={{ fontSize: 13 }}
                suffixIcon={<ClusterOutlined style={{ color: "#d1d5db" }} />}
                options={nodes.map((n: any) => ({ value: Number(n.id), label: n.data?.title ?? `Node ${n.id}` }))} />
        </Form.Item>

        <Form.Item name="jobDescriptionId" label={<span style={labelStyle}>Gắn JD</span>} style={{ marginBottom: 16 }}>
            <Select allowClear placeholder="Chọn JD đã ban hành" size="large" style={{ fontSize: 13 }}
                suffixIcon={<FileTextOutlined style={{ color: "#d1d5db" }} />} options={jdOptions} />
        </Form.Item>

        <Form.Item style={{ marginBottom: 4 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "#fdf2f8", border: "1px solid #fbcfe8", borderRadius: 12, padding: "12px 16px" }}>
                <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#9d174d" }}>Vị trí mục tiêu</div>
                    <div style={{ fontSize: 12, color: "#be185d", marginTop: 2, opacity: 0.7 }}>Đánh dấu đây là vị trí hướng đến</div>
                </div>
                <Form.Item name="isGoal" valuePropName="checked" noStyle>
                    <Switch style={{ marginLeft: 16 }} />
                </Form.Item>
            </div>
        </Form.Item>
    </Form>
);

// ─────────────────────────────────────────────────────────
// Bulk Table Editor — Excel-like
// ─────────────────────────────────────────────────────────
const BulkTableEditor = ({ rows, setRows, existingNodes }: {
    rows: BulkRow[];
    setRows: React.Dispatch<React.SetStateAction<BulkRow[]>>;
    existingNodes: any[];
}) => {
    const inputRefs = useRef<Map<string, HTMLInputElement | null>>(new Map());
    const depthMemo = new Map<number, number>();
    const depths = rows.map((_, i) => getDepth(rows, i, depthMemo));

    const updateRow = useCallback((id: string, field: keyof BulkRow, value: any) => {
        setRows((prev) => prev.map((r) => r.id === id ? { ...r, [field]: value } : r));
    }, [setRows]);

    const addRowAfter = useCallback((afterIndex: number) => {
        const above = rows[afterIndex];
        const newRow = emptyRow({
            levelCode: above?.levelCode ?? "",        // ✅ auto-copy mã cấp bậc
            parentIndex: above?.parentIndex ?? null,  // ✅ auto-copy cùng cha
        });
        setRows((prev) => {
            const next = [...prev];
            next.splice(afterIndex + 1, 0, newRow);
            // Cập nhật parentIndex của các row phía sau bị lệch index
            return next.map((r, i) => {
                if (i <= afterIndex + 1) return r;
                if (r.parentIndex !== null && r.parentIndex > afterIndex) {
                    return { ...r, parentIndex: r.parentIndex + 1 };
                }
                return r;
            });
        });
        setTimeout(() => inputRefs.current.get(`title-${newRow.id}`)?.focus(), 30);
    }, [rows, setRows]);

    const deleteRow = useCallback((index: number) => {
        if (rows.length === 1) return;
        setRows((prev) =>
            prev.filter((_, i) => i !== index).map((r) => {
                if (r.parentIndex === null) return r;
                if (r.parentIndex === index) return { ...r, parentIndex: null };
                if (r.parentIndex > index) return { ...r, parentIndex: r.parentIndex - 1 };
                return r;
            })
        );
        // Focus dòng trên
        const above = rows[index - 1] ?? rows[index + 1];
        if (above) setTimeout(() => inputRefs.current.get(`title-${above.id}`)?.focus(), 30);
    }, [rows, setRows]);

    const handleKeyDown = useCallback((
        e: React.KeyboardEvent<HTMLInputElement>,
        rowIndex: number,
        field: "title" | "levelCode" | "holderName",
    ) => {
        if (e.key === "Enter") { e.preventDefault(); addRowAfter(rowIndex); }
        if (e.key === "Tab" && !e.shiftKey && field === "holderName") {
            e.preventDefault(); addRowAfter(rowIndex);
        }
        if (e.key === "Backspace" && (e.target as HTMLInputElement).value === "" && rows.length > 1) {
            e.preventDefault(); deleteRow(rowIndex);
        }
    }, [addRowAfter, deleteRow, rows.length]);

    // MỚI
    const getParentOptions = (rowIndex: number) => [
        ...existingNodes.map((n) => ({
            value: `ex-${n.id}`,
            label: `📌 ${n.data?.title ?? `Node ${n.id}`}`,
        })),
        ...rows.slice(0, rowIndex)
            .map((r, i) => r.title.trim() ? { value: `row-${i}`, label: `↳ Dòng ${i + 1}: ${r.title}` } : null)
            .filter(Boolean) as { value: string; label: string }[],
    ];
    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
            {/* Header */}
            <div style={{
                display: "grid", gridTemplateColumns: "36px 1fr 88px 1fr 148px 32px",
                gap: 4, padding: "7px 10px",
                background: "#f3f4f6", borderRadius: "10px 10px 0 0",
                border: "1px solid #e5e7eb", borderBottom: "none",
            }}>
                {["#", "Tên chức danh *", "Mã cấp", "Người phụ trách", "Cấp trên", ""].map((h, i) => (
                    <div key={i} style={{ fontSize: 10.5, fontWeight: 700, color: "#6b7280", letterSpacing: "0.05em", textTransform: "uppercase" }}>
                        {h}
                    </div>
                ))}
            </div>

            {/* Rows */}
            <div style={{
                border: "1px solid #e5e7eb", borderRadius: "0 0 10px 10px", overflow: "hidden", maxHeight: 480, overflowY: "auto"
            }}>
                {rows.map((row, rowIndex) => {
                    const depth = depths[rowIndex];
                    const dot = DEPTH_PALETTE[depth % DEPTH_PALETTE.length].dot;
                    const isEmpty = !row.title.trim();

                    return (
                        <div key={row.id} style={{
                            display: "grid", gridTemplateColumns: "36px 1fr 88px 1fr 148px 32px",
                            gap: 4, padding: "5px 10px",
                            borderBottom: rowIndex < rows.length - 1 ? "1px solid #f3f4f6" : "none",
                            background: rowIndex % 2 === 0 ? "#fff" : "#fafafa",
                            alignItems: "center",
                        }}>
                            {/* # */}
                            <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
                                <div style={{ width: 6, height: 6, borderRadius: "50%", background: isEmpty ? "#e5e7eb" : dot, flexShrink: 0 }} />
                                <span style={{ fontSize: 10, color: "#9ca3af", fontFamily: "monospace", fontWeight: 600 }}>{rowIndex + 1}</span>
                            </div>

                            {/* Title với indent */}
                            <div style={{ paddingLeft: depth * 14, display: "flex", alignItems: "center", gap: 3, overflow: "hidden" }}>
                                {depth > 0 && <span style={{ color: "#d1d5db", fontSize: 11, flexShrink: 0 }}>└</span>}
                                <input
                                    ref={(el) => { inputRefs.current.set(`title-${row.id}`, el); }}
                                    value={row.title}
                                    onChange={(e) => updateRow(row.id, "title", e.target.value)}
                                    onKeyDown={(e) => handleKeyDown(e, rowIndex, "title")}
                                    placeholder={`Vị trí ${rowIndex + 1}...`}
                                    style={{
                                        width: "100%", border: "none", outline: "none", fontSize: 13,
                                        fontWeight: row.title ? 500 : 400,
                                        color: row.title ? "#111827" : "#9ca3af",
                                        background: "transparent", padding: "3px 0",
                                    }}
                                />
                            </div>

                            {/* Level code */}
                            <input
                                ref={(el) => { inputRefs.current.set(`level-${row.id}`, el); }}
                                value={row.levelCode}
                                onChange={(e) => updateRow(row.id, "levelCode", e.target.value)}
                                onKeyDown={(e) => handleKeyDown(e, rowIndex, "levelCode")}
                                placeholder="M1..."
                                style={{
                                    width: "100%", border: "none", outline: "none", fontSize: 11,
                                    color: "#e8637a", fontWeight: 600, fontFamily: "monospace",
                                    background: "transparent", padding: "3px 0",
                                }}
                            />

                            {/* Holder */}
                            <input
                                ref={(el) => { inputRefs.current.set(`holder-${row.id}`, el); }}
                                value={row.holderName}
                                onChange={(e) => updateRow(row.id, "holderName", e.target.value)}
                                onKeyDown={(e) => handleKeyDown(e, rowIndex, "holderName")}
                                placeholder="Tên người..."
                                style={{
                                    width: "100%", border: "none", outline: "none", fontSize: 12,
                                    color: "#374151", background: "transparent", padding: "3px 0",
                                }}
                            />

                            {/* Parent */}
                            <Select
                                allowClear size="small"
                                placeholder="Chọn cha"
                                value={
                                    row.existingParentId != null ? `ex-${row.existingParentId}`
                                        : row.parentIndex != null ? `row-${row.parentIndex}`
                                            : undefined
                                }
                                onChange={(v: string | undefined) => {
                                    if (!v) {
                                        updateRow(row.id, "parentIndex", null);
                                        updateRow(row.id, "existingParentId", null);
                                    } else if (v.startsWith("ex-")) {
                                        updateRow(row.id, "existingParentId", Number(v.replace("ex-", "")));
                                        updateRow(row.id, "parentIndex", null);
                                    } else {
                                        updateRow(row.id, "parentIndex", Number(v.replace("row-", "")));
                                        updateRow(row.id, "existingParentId", null);
                                    }
                                }}
                                style={{ fontSize: 11, width: "100%" }}
                                options={getParentOptions(rowIndex)}
                                popupMatchSelectWidth={240}
                            />

                            {/* Delete */}
                            <button
                                onClick={() => deleteRow(rowIndex)}
                                disabled={rows.length === 1}
                                style={{
                                    width: 22, height: 22, borderRadius: "50%", border: "none",
                                    background: "transparent",
                                    cursor: rows.length === 1 ? "not-allowed" : "pointer",
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                    color: rows.length === 1 ? "#e5e7eb" : "#f87171",
                                    padding: 0,
                                }}
                            >
                                <DeleteOutlined style={{ fontSize: 11 }} />
                            </button>
                        </div>
                    );
                })}
            </div>

            {/* Add row */}
            <button
                onClick={() => addRowAfter(rows.length - 1)}
                style={{
                    marginTop: 6, width: "100%", height: 32, border: "1.5px dashed #e5e7eb",
                    borderRadius: 8, background: "transparent", cursor: "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    gap: 6, color: "#9ca3af", fontSize: 12, fontWeight: 500,
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = "#e8637a"; (e.currentTarget as HTMLButtonElement).style.color = "#e8637a"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = "#e5e7eb"; (e.currentTarget as HTMLButtonElement).style.color = "#9ca3af"; }}
            >
                <PlusOutlined style={{ fontSize: 10 }} />
                Thêm dòng
                <span style={{ fontSize: 10, opacity: 0.6 }}>(hoặc Enter ở cuối dòng)</span>
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

    const validRowCount = rows.filter((r) => r.title.trim()).length;
    const isBulk = mode === "bulk";

    const handleOk = async () => {
        if (!isBulk) {
            const values = await form.validateFields();
            onSubmit(values);
            form.resetFields();
        } else {
            if (validRowCount === 0) return;
            // MỚI
            onBulkSubmit?.(
                rows.filter((r) => r.title.trim()).map((r) => ({
                    title: r.title.trim(),
                    levelCode: r.levelCode,
                    holderName: r.holderName || undefined,
                    parentIndex: r.parentIndex,
                    existingParentId: r.existingParentId,
                }))
            );
        }
    };

    const handleCancel = () => { form.resetFields(); onClose(); };

    return (
        <Modal
            title={null} open={open} onCancel={handleCancel} onOk={handleOk}
            okText={isEditing ? "Lưu thay đổi" : isBulk ? `Tạo ${validRowCount > 0 ? validRowCount + " " : ""}node` : "Tạo mới"}
            cancelText="Hủy" destroyOnHidden
            okButtonProps={{
                disabled: isBulk && validRowCount === 0,
                style: {
                    background: "linear-gradient(135deg, #be185d, #e8637a)",
                    borderColor: "transparent", fontWeight: 600,
                    boxShadow: "0 2px 10px rgba(232,99,122,.35)",
                    height: 40, borderRadius: 10, fontSize: 14, minWidth: 110,
                    opacity: isBulk && validRowCount === 0 ? 0.5 : 1,
                },
            }}
            cancelButtonProps={{ style: { height: 40, borderRadius: 10, fontSize: 14 } }}
            styles={{
                content: { borderRadius: 20, padding: 0, overflow: "hidden", boxShadow: "0 24px 60px rgba(0,0,0,0.12)" },
                body: { padding: 0 },
                footer: { padding: "14px 28px 22px", borderTop: "1px solid #f3f4f6", background: "#fafafa" },
            }}
            width={isBulk ? 960 : 620}
        >
            {/* HEADER */}
            <div style={{ background: "linear-gradient(135deg, #9d174d 0%, #db2777 55%, #f472b6 100%)", padding: "24px 32px 20px", position: "relative", overflow: "hidden" }}>
                <div style={{ position: "absolute", top: -30, right: -30, width: 130, height: 130, borderRadius: "50%", background: "rgba(255,255,255,0.07)", pointerEvents: "none" }} />

                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", position: "relative", zIndex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <div style={{ width: 40, height: 40, borderRadius: 12, background: "rgba(255,255,255,0.18)", border: "1px solid rgba(255,255,255,0.28)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            {isBulk ? <ThunderboltOutlined style={{ fontSize: 18, color: "#fff" }} /> : <ApartmentOutlined style={{ fontSize: 18, color: "#fff" }} />}
                        </div>
                        <div>
                            <div style={{ fontWeight: 800, fontSize: 17, color: "#fff", letterSpacing: "-0.3px" }}>
                                {isEditing ? "Chỉnh sửa vị trí" : isBulk ? `Tạo hàng loạt${validRowCount > 0 ? ` — ${validRowCount} node` : ""}` : "Thêm vị trí mới"}
                            </div>

                        </div>
                    </div>

                    {!isEditing && (
                        <div style={{ display: "flex", background: "rgba(255,255,255,0.15)", borderRadius: 8, padding: 3, gap: 2 }}>
                            {([
                                { key: "single" as const, label: "Một node", icon: <ApartmentOutlined /> },
                                { key: "bulk" as const, label: "Hàng loạt", icon: <ThunderboltOutlined /> },
                            ]).map((tab) => (
                                <button key={tab.key} onClick={() => setMode(tab.key)} style={{
                                    display: "flex", alignItems: "center", gap: 5, padding: "5px 12px",
                                    borderRadius: 6, border: "none", cursor: "pointer", fontSize: 12, fontWeight: 600,
                                    background: mode === tab.key ? "rgba(255,255,255,0.95)" : "transparent",
                                    color: mode === tab.key ? "#be185d" : "rgba(255,255,255,0.85)",
                                    transition: "all 0.15s ease",
                                }}>
                                    {tab.icon} {tab.label}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* BODY */}
            <div style={{ padding: isBulk ? "20px 24px 8px" : "22px 32px 4px" }}>
                {mode === "single"
                    ? <SingleNodeForm form={form} nodes={nodes} jdOptions={jdOptions} isEditing={isEditing} />
                    : <BulkTableEditor rows={rows} setRows={setRows} existingNodes={nodes} />
                }
            </div>
        </Modal>
    );
};

export default ModalNode;