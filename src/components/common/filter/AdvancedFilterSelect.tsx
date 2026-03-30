import React from "react";
import { Dropdown, Button } from "antd";
import {
    FilterOutlined,
    CloseCircleOutlined,
    CheckOutlined,
    LeftOutlined,
    CloseOutlined,
} from "@ant-design/icons";

export interface FilterField {
    key: string;
    label: string;
    icon?: React.ReactNode;
    type?: "options" | "async-select" | "number";
    options?: { label: string; value: any; color?: string }[];
    loadOptions?: () => Promise<{ label: string; value: any }[]>;
    dependsOn?: string;
    loadOptionsWithDep?: (depValue: any) => Promise<{ label: string; value: any }[]>;
}

interface AdvancedFilterSelectProps {
    fields: FilterField[];
    onChange: (filters: Record<string, any>) => void;
    resetSignal?: number;
    buttonLabel?: string;
}

// ── Chuẩn kích thước duy nhất cho MỌI chip trong dropdown ──
const CHIP: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    height: 22,
    padding: "0px 8px",
    fontSize: 12,
    fontWeight: 500,
    borderRadius: 4,
    lineHeight: "20px",
    border: "1px solid",
    cursor: "pointer",
    userSelect: "none" as const,
    transition: "all 0.12s",
    gap: 4,
    whiteSpace: "nowrap" as const,
    boxSizing: "border-box" as const,
};

// ── Active tag chip — hiển thị filter đã chọn bên ngoài ──
const TAG_CHIP: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    height: 26,
    maxWidth: 320,
    padding: "0 6px 0 8px",
    fontSize: 12,
    fontWeight: 500,
    borderRadius: 5,
    border: "1px solid",
    cursor: "default",
    userSelect: "none" as const,
    transition: "all 0.12s",
    gap: 0,
    boxSizing: "border-box" as const,
    overflow: "hidden",
};

const AdvancedFilterSelect: React.FC<AdvancedFilterSelectProps> = ({
    fields,
    onChange,
    resetSignal,
    buttonLabel = "Bộ lọc",
}) => {
    const [activeFilters, setActiveFilters] = React.useState<Record<string, any>>({});
    const [open, setOpen] = React.useState(false);
    const [activeField, setActiveField] = React.useState<string | null>(null);
    const [asyncOptions, setAsyncOptions] = React.useState<
        Record<string, { label: string; value: any }[]>
    >({});
    const [loading, setLoading] = React.useState(false);

    React.useEffect(() => {
        if (resetSignal !== undefined) {
            setActiveFilters({});
            onChange({});
        }
    }, [resetSignal]);

    const handleOpenChange = (isOpen: boolean) => {
        setOpen(isOpen);
        if (!isOpen) setActiveField(null);
    };

    const handleClickField = async (field: FilterField) => {
        setActiveField(field.key);
        if (
            field.type === "async-select" &&
            field.loadOptions &&
            !asyncOptions[field.key]?.length
        ) {
            setLoading(true);
            const opts = await field.loadOptions();
            setAsyncOptions((prev) => ({ ...prev, [field.key]: opts }));
            setLoading(false);
        }
    };

    const handleSelect = (fieldKey: string, value: any) => {
        const newFilters = { ...activeFilters, [fieldKey]: value };
        setActiveFilters(newFilters);
        onChange(newFilters);
        setOpen(false);
        setActiveField(null);
    };

    const handleClear = (fieldKey: string) => {
        const newFilters = { ...activeFilters };
        delete newFilters[fieldKey];
        setActiveFilters(newFilters);
        onChange(newFilters);
    };

    const handleClearAll = () => {
        setActiveFilters({});
        setAsyncOptions({});
        onChange({});
    };

    const activeCount = Object.keys(activeFilters).length;

    // ── Màu chip theo loại & giá trị (dùng trong dropdown) ──
    const getColors = (optValue: any, isAsync: boolean) => {
        if (isAsync || (optValue !== 0 && optValue !== 1)) {
            return {
                color: "#1677ff", bg: "#e6f4ff", border: "#91caff",
                selBg: "#1677ff", selBorder: "#1677ff", selColor: "#fff",
                hoverBg: "#bae0ff", hoverBorder: "#1677ff",
            };
        }
        if (optValue === 1) {
            return {
                color: "#389e0d", bg: "#f6ffed", border: "#b7eb8f",
                selBg: "#d9f7be", selBorder: "#52c41a", selColor: "#389e0d",
                hoverBg: "#d9f7be", hoverBorder: "#52c41a",
            };
        }
        return {
            color: "#cf1322", bg: "#fff2f0", border: "#ffccc7",
            selBg: "#ffd6d6", selBorder: "#ff4d4f", selColor: "#cf1322",
            hoverBg: "#ffd6d6", hoverBorder: "#ff4d4f",
        };
    };

    // ── Màu tag chip bên ngoài — nhạt hơn, dễ nhìn hơn ──
    const getTagColors = (optValue: any, isAsync: boolean) => {
        if (isAsync || (optValue !== 0 && optValue !== 1)) {
            return {
                bg: "#e6f4ff",
                border: "#91caff",
                labelColor: "#888",
                valueColor: "#0958d9",
                closeColor: "#1677ff",
            };
        }
        if (optValue === 1) {
            return {
                bg: "#f6ffed",
                border: "#b7eb8f",
                labelColor: "#888",
                valueColor: "#389e0d",
                closeColor: "#52c41a",
            };
        }
        return {
            bg: "#fff2f0",
            border: "#ffccc7",
            labelColor: "#888",
            valueColor: "#cf1322",
            closeColor: "#ff4d4f",
        };
    };

    // ===== MAIN MENU =====
    const mainMenu = (
        <div
            style={{
                background: "#fff",
                borderRadius: 8,
                boxShadow: "0 6px 20px rgba(0,0,0,0.12)",
                minWidth: 180,
                overflow: "hidden",
                border: "1px solid #f0f0f0",
                padding: "4px 0",
            }}
        >
            {fields.map((field) => {
                const isActive = activeFilters[field.key] !== undefined;
                return (
                    <div
                        key={field.key}
                        onClick={() => handleClickField(field)}
                        style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            padding: "7px 14px",
                            cursor: "pointer",
                            fontSize: 13,
                            color: isActive ? "#1677ff" : "#333",
                            fontWeight: isActive ? 600 : 400,
                            background: isActive ? "#f0f7ff" : "transparent",
                            borderLeft: isActive ? "3px solid #1677ff" : "3px solid transparent",
                            transition: "all 0.12s",
                        }}
                        onMouseEnter={(e) => {
                            if (!isActive) e.currentTarget.style.background = "#fafafa";
                        }}
                        onMouseLeave={(e) => {
                            if (!isActive) e.currentTarget.style.background = "transparent";
                        }}
                    >
                        <span>{field.label}</span>
                        {isActive ? (
                            <CheckOutlined style={{ color: "#1677ff", fontSize: 11 }} />
                        ) : (
                            <span style={{ color: "#ccc", fontSize: 13 }}>›</span>
                        )}
                    </div>
                );
            })}
        </div>
    );

    // ===== SUB MENU =====
    const currentField = fields.find((f) => f.key === activeField);

    const subMenu = currentField ? (
        <div
            style={{
                background: "#fff",
                borderRadius: 8,
                boxShadow: "0 6px 20px rgba(0,0,0,0.12)",
                minWidth: 220,
                overflow: "hidden",
                border: "1px solid #f0f0f0",
            }}
        >
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "8px 10px",
                    borderBottom: "1px solid #f0f0f0",
                    background: "#fafafa",
                }}
            >
                <span
                    onClick={() => setActiveField(null)}
                    style={{
                        cursor: "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        width: 22,
                        height: 22,
                        borderRadius: 4,
                        background: "#fff",
                        border: "1px solid #e8e8e8",
                        color: "#666",
                        fontSize: 10,
                        transition: "all 0.12s",
                        flexShrink: 0,
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.background = "#1677ff";
                        e.currentTarget.style.color = "#fff";
                        e.currentTarget.style.borderColor = "#1677ff";
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.background = "#fff";
                        e.currentTarget.style.color = "#666";
                        e.currentTarget.style.borderColor = "#e8e8e8";
                    }}
                >
                    <LeftOutlined />
                </span>
                <span style={{ fontWeight: 600, fontSize: 12, color: "#1a1a1a" }}>
                    {currentField.label}
                </span>
            </div>

            <div
                style={{
                    padding: "7px 8px 8px",
                    maxHeight: 280,
                    overflowY: "auto",
                    display: "flex",
                    flexDirection: "column",
                    gap: 4,
                }}
            >
                {loading ? (
                    <div style={{ padding: "12px 0", color: "#aaa", fontSize: 12, textAlign: "center" }}>
                        Đang tải...
                    </div>
                ) : currentField.type === "async-select" ? (
                    (asyncOptions[currentField.key] ?? []).map((opt) => {
                        const isSelected = activeFilters[currentField.key] === opt.value;
                        const c = getColors(opt.value, true);
                        return (
                            <div
                                key={opt.value}
                                onClick={() => handleSelect(currentField.key, opt.value)}
                                style={{
                                    ...CHIP,
                                    background: isSelected ? c.selBg : c.bg,
                                    borderColor: isSelected ? c.selBorder : c.border,
                                    color: isSelected ? c.selColor : c.color,
                                    fontWeight: isSelected ? 600 : 500,
                                }}
                                onMouseEnter={(e) => {
                                    if (!isSelected) {
                                        e.currentTarget.style.background = c.hoverBg;
                                        e.currentTarget.style.borderColor = c.hoverBorder;
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    if (!isSelected) {
                                        e.currentTarget.style.background = c.bg;
                                        e.currentTarget.style.borderColor = c.border;
                                    }
                                }}
                            >
                                {opt.label}
                                {isSelected && <CheckOutlined style={{ fontSize: 10 }} />}
                            </div>
                        );
                    })
                ) : (
                    currentField.options?.map((opt) => {
                        const isSelected = activeFilters[currentField.key] === opt.value;
                        const c = getColors(opt.value, false);
                        return (
                            <div
                                key={opt.value}
                                onClick={() =>
                                    isSelected
                                        ? handleClear(currentField.key)
                                        : handleSelect(currentField.key, opt.value)
                                }
                                style={{
                                    ...CHIP,
                                    background: isSelected ? c.selBg : c.bg,
                                    borderColor: isSelected ? c.selBorder : c.border,
                                    color: isSelected ? c.selColor : c.color,
                                    fontWeight: isSelected ? 600 : 500,
                                }}
                                onMouseEnter={(e) => {
                                    if (!isSelected) {
                                        e.currentTarget.style.background = c.hoverBg;
                                        e.currentTarget.style.borderColor = c.hoverBorder;
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    if (!isSelected) {
                                        e.currentTarget.style.background = c.bg;
                                        e.currentTarget.style.borderColor = c.border;
                                    }
                                }}
                            >
                                {opt.label}
                                {isSelected && (
                                    <CheckOutlined style={{ color: c.selColor, fontSize: 10 }} />
                                )}
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    ) : null;

    // ===== RENDER =====
    return (
        <div style={{ display: "inline-flex", flexDirection: "column", gap: 6, alignItems: "flex-start" }}>
            {/* Button + Xóa tất cả */}
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <Dropdown
                    open={open}
                    onOpenChange={handleOpenChange}
                    dropdownRender={() => (activeField ? subMenu! : mainMenu)}
                    trigger={["click"]}
                >
                    <Button
                        icon={<FilterOutlined />}
                        style={{
                            borderRadius: 6,
                            fontWeight: 500,
                            fontSize: 13,
                            height: 32,
                            paddingInline: 12,
                            borderColor: activeCount > 0 ? "#1677ff" : undefined,
                            color: activeCount > 0 ? "#1677ff" : undefined,
                            background: activeCount > 0 ? "#f0f7ff" : undefined,
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 6,
                        }}
                    >
                        {buttonLabel}
                        {activeCount > 0 && (
                            <span
                                style={{
                                    background: "#1677ff",
                                    color: "#fff",
                                    borderRadius: 10,
                                    fontSize: 11,
                                    fontWeight: 700,
                                    padding: "0 5px",
                                    lineHeight: "17px",
                                    marginLeft: 2,
                                }}
                            >
                                {activeCount}
                            </span>
                        )}
                    </Button>
                </Dropdown>

                {activeCount > 0 && (
                    <Button
                        type="text"
                        icon={<CloseCircleOutlined />}
                        onClick={handleClearAll}
                        style={{
                            color: "#ff4d4f",
                            fontSize: 12,
                            fontWeight: 500,
                            height: 22,
                            paddingInline: 6,
                            borderRadius: 4,
                            display: "inline-flex",
                            alignItems: "center",
                        }}
                    >
                        Xóa tất cả
                    </Button>
                )}
            </div>

            {/* ✅ Active tags — gọn + đẹp, nền nhạt, truncate tên dài */}
            {activeCount > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 4, alignItems: "flex-start", maxWidth: 480 }}>
                    {Object.entries(activeFilters).map(([key, val]) => {
                        const field = fields.find((f) => f.key === key);
                        const option = field?.options?.find((o) => o.value === val);
                        const asyncOpt = asyncOptions[key]?.find((o) => o.value === val);
                        const displayLabel = option?.label || asyncOpt?.label || String(val);
                        const isAsync = field?.type === "async-select";
                        const c = getTagColors(val, isAsync);

                        return (
                            <div
                                key={key}
                                style={{
                                    ...TAG_CHIP,
                                    background: c.bg,
                                    borderColor: c.border,
                                }}
                            >
                                {/* Label field */}
                                <span
                                    style={{
                                        color: c.labelColor,
                                        fontWeight: 400,
                                        fontSize: 11,
                                        flexShrink: 0,
                                        marginRight: 3,
                                    }}
                                >
                                    {field?.label}:
                                </span>

                                {/* Value — truncate nếu dài */}
                                <span
                                    title={displayLabel}
                                    style={{
                                        color: c.valueColor,
                                        fontWeight: 600,
                                        fontSize: 12,
                                        overflow: "hidden",
                                        textOverflow: "ellipsis",
                                        whiteSpace: "nowrap",
                                        maxWidth: 220,
                                        marginRight: 5,
                                    }}
                                >
                                    {displayLabel}
                                </span>

                                {/* Close button */}
                                <span
                                    onClick={() => handleClear(key)}
                                    style={{
                                        display: "inline-flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        width: 14,
                                        height: 14,
                                        borderRadius: 2,
                                        cursor: "pointer",
                                        color: c.closeColor,
                                        opacity: 0.5,
                                        fontSize: 9,
                                        flexShrink: 0,
                                        transition: "opacity 0.12s",
                                    }}
                                    onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
                                    onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.5")}
                                >
                                    <CloseOutlined />
                                </span>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default AdvancedFilterSelect;