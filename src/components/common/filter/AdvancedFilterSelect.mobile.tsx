// ============================================================
//  AdvancedFilterSelect.mobile.tsx
//  Giao diện MOBILE — Bottom Sheet trượt lên từ dưới
//  Chỉnh sửa UI/UX mobile tại đây
// ============================================================

import React from "react";
import { Spin, Input } from "antd";
import {
    FilterOutlined,
    SearchOutlined,
    LockOutlined,
    RightOutlined,
    LeftOutlined,
    CloseOutlined,
    CheckOutlined,
} from "@ant-design/icons";
import type { FilterField, FilterOption } from "./AdvancedFilterSelect.types";

interface MobileBottomSheetProps {
    open: boolean;
    onClose: () => void;
    fields: FilterField[];
    activeFilters: Record<string, any>;
    onSelect: (fieldKey: string, value: any) => void;
    onClearAll: () => void;
    getOptions: (field: FilterField) => FilterOption[];
    loading: Record<string, boolean>;
    fetchIfNeeded: (field: FilterField) => void;
}

const MobileBottomSheet: React.FC<MobileBottomSheetProps> = ({
    open,
    onClose,
    fields,
    activeFilters,
    onSelect,
    onClearAll,
    getOptions,
    loading,
    fetchIfNeeded,
}) => {
    const [activeField, setActiveField] = React.useState<string | null>(null);
    const [searchText, setSearchText] = React.useState("");

    React.useEffect(() => {
        if (open) {
            setActiveField(null);
            setSearchText("");
        }
    }, [open]);

    const currentField = fields.find((f) => f.key === activeField);
    const currentOptions = currentField ? getOptions(currentField) : [];
    const filteredOptions = currentOptions.filter((opt) =>
        opt.label.toLowerCase().includes(searchText.toLowerCase())
    );

    const handleFieldClick = (field: FilterField) => {
        const isDisabled = !!field.dependsOn && !activeFilters[field.dependsOn];
        if (isDisabled) return;
        fetchIfNeeded(field);
        setActiveField(field.key);
        setSearchText("");
    };

    const handleOptionSelect = (fieldKey: string, value: any) => {
        onSelect(fieldKey, value);
        setActiveField(null);
    };

    const activeCount = Object.keys(activeFilters).length;

    if (!open) return null;

    return (
        <>
            {/* Overlay */}
            <div
                onClick={onClose}
                style={{
                    position: "fixed", inset: 0,
                    background: "rgba(0,0,0,0.5)",
                    zIndex: 1000,
                }}
            />

            {/* Sheet */}
            <div style={{
                position: "fixed", left: 0, right: 0, bottom: 0,
                zIndex: 1001,
                background: "#fff",
                borderRadius: "20px 20px 0 0",
                boxShadow: "0 -8px 32px rgba(0,0,0,0.15)",
                display: "flex", flexDirection: "column",
                maxHeight: "85vh",
                overflow: "hidden",
                animation: "mobileSheetSlideUp 0.28s cubic-bezier(0.32, 0.72, 0, 1)",
            }}>

                {/* Handle bar */}
                <div style={{ display: "flex", justifyContent: "center", paddingTop: 12, paddingBottom: 4 }}>
                    <div style={{ width: 40, height: 4, borderRadius: 2, background: "#d9d9d9" }} />
                </div>

                {/* Header */}
                <div style={{
                    display: "flex", alignItems: "center",
                    padding: "10px 20px 14px", gap: 10,
                    borderBottom: "1px solid #f0f0f0",
                }}>
                    {activeField ? (
                        <button
                            onClick={() => { setActiveField(null); setSearchText(""); }}
                            style={{
                                border: "none", background: "none",
                                padding: "4px 6px 4px 0",
                                cursor: "pointer", color: "#1677ff",
                                display: "flex", alignItems: "center",
                                fontSize: 16,
                            }}
                        >
                            <LeftOutlined />
                        </button>
                    ) : (
                        <div style={{
                            width: 32, height: 32, borderRadius: 8,
                            background: "#e6f4ff",
                            display: "flex", alignItems: "center", justifyContent: "center",
                        }}>
                            <FilterOutlined style={{ color: "#1677ff", fontSize: 15 }} />
                        </div>
                    )}

                    <span style={{ fontWeight: 700, fontSize: 17, flex: 1, color: "#111" }}>
                        {activeField ? currentField?.label : "Bộ lọc"}
                    </span>

                    <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                        {!activeField && activeCount > 0 && (
                            <button
                                onClick={onClearAll}
                                style={{
                                    border: "1px solid #ffccc7",
                                    background: "#fff2f0",
                                    color: "#ff4d4f", fontSize: 13,
                                    cursor: "pointer",
                                    padding: "4px 10px",
                                    borderRadius: 6,
                                    fontWeight: 500,
                                }}
                            >
                                Xóa tất cả
                            </button>
                        )}
                        <button
                            onClick={onClose}
                            style={{
                                border: "none",
                                background: "#f5f5f5",
                                padding: 0,
                                cursor: "pointer", color: "#8c8c8c",
                                display: "flex", alignItems: "center", justifyContent: "center",
                                width: 32, height: 32, borderRadius: "50%",
                            }}
                        >
                            <CloseOutlined style={{ fontSize: 14 }} />
                        </button>
                    </div>
                </div>

                {/* Body */}
                <div style={{ flex: 1, overflowY: "auto", WebkitOverflowScrolling: "touch" } as React.CSSProperties}>

                    {/* ── Màn hình 1: Danh sách field ── */}
                    {!activeField && (
                        <div style={{ padding: "8px 0" }}>
                            {fields.map((field) => {
                                const isDisabled = !!field.dependsOn && !activeFilters[field.dependsOn];
                                const parentField = fields.find((f) => f.key === field.dependsOn);
                                const selectedOpt = getOptions(field).find(
                                    (o) => o.value === activeFilters[field.key]
                                );
                                const hasValue = activeFilters[field.key] !== undefined;

                                return (
                                    <div
                                        key={field.key}
                                        onClick={() => handleFieldClick(field)}
                                        style={{
                                            display: "flex", alignItems: "center",
                                            padding: "15px 20px",
                                            cursor: isDisabled ? "not-allowed" : "pointer",
                                            opacity: isDisabled ? 0.4 : 1,
                                            borderBottom: "1px solid #fafafa",
                                            transition: "background 0.1s",
                                            userSelect: "none",
                                        }}
                                        onTouchStart={(e) => {
                                            if (!isDisabled)
                                                (e.currentTarget as HTMLDivElement).style.background = "#f5f5f5";
                                        }}
                                        onTouchEnd={(e) => {
                                            setTimeout(() => {
                                                (e.currentTarget as HTMLDivElement).style.background = "";
                                            }, 150);
                                        }}
                                    >
                                        {/* Icon + Label */}
                                        <span style={{ display: "flex", alignItems: "center", gap: 10, flex: 1, minWidth: 0 }}>
                                            {field.icon && (
                                                <span style={{ color: "#8c8c8c", fontSize: 16, flexShrink: 0 }}>
                                                    {field.icon}
                                                </span>
                                            )}
                                            <span style={{ fontSize: 15, color: "#222", fontWeight: 500 }}>
                                                {field.label}
                                            </span>
                                            {isDisabled && (
                                                <span style={{ fontSize: 11, color: "#bfbfbf", flexShrink: 0 }}>
                                                    (chọn {parentField?.label} trước)
                                                </span>
                                            )}
                                        </span>

                                        {/* Giá trị đã chọn + icon */}
                                        <span style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0, marginLeft: 8 }}>
                                            {hasValue && selectedOpt && (
                                                <span style={{
                                                    fontSize: 13, color: "#1677ff",
                                                    fontWeight: 500,
                                                    maxWidth: 130,
                                                    overflow: "hidden", textOverflow: "ellipsis",
                                                    whiteSpace: "nowrap",
                                                }}>
                                                    {selectedOpt.label}
                                                </span>
                                            )}
                                            {!isDisabled
                                                ? <RightOutlined style={{ fontSize: 12, color: "#c0c0c0" }} />
                                                : <LockOutlined style={{ fontSize: 12, color: "#c0c0c0" }} />
                                            }
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* ── Màn hình 2: Options của field ── */}
                    {activeField && currentField && (
                        <div>
                            {/* Ô tìm kiếm */}
                            {currentField.searchable !== false && (
                                <div style={{ padding: "12px 16px", background: "#fafafa", borderBottom: "1px solid #f0f0f0" }}>
                                    <Input
                                        prefix={<SearchOutlined style={{ color: "#bfbfbf" }} />}
                                        placeholder={`Tìm ${currentField.label.toLowerCase()}...`}
                                        value={searchText}
                                        onChange={(e) => setSearchText(e.target.value)}
                                        allowClear
                                        size="large"
                                        style={{ borderRadius: 10, fontSize: 15 }}
                                        autoFocus
                                    />
                                </div>
                            )}

                            {/* Số kết quả */}
                            {!loading[activeField] && filteredOptions.length > 0 && (
                                <div style={{ padding: "8px 20px 4px", fontSize: 12, color: "#8c8c8c" }}>
                                    {filteredOptions.length} kết quả
                                </div>
                            )}

                            {/* Danh sách options */}
                            {loading[activeField] ? (
                                <div style={{ textAlign: "center", padding: "48px 0" }}>
                                    <Spin size="large" />
                                </div>
                            ) : filteredOptions.length === 0 ? (
                                <div style={{
                                    textAlign: "center", padding: "48px 0",
                                    color: "#bfbfbf", fontSize: 15,
                                }}>
                                    Không tìm thấy kết quả
                                </div>
                            ) : (
                                <div style={{ padding: "4px 0 24px" }}>
                                    {filteredOptions.map((opt) => {
                                        const isSelected = activeFilters[activeField] === opt.value;
                                        return (
                                            <div
                                                key={opt.value}
                                                onClick={() => handleOptionSelect(activeField, opt.value)}
                                                style={{
                                                    display: "flex", alignItems: "center",
                                                    padding: "14px 20px",
                                                    cursor: "pointer",
                                                    background: isSelected ? "#e6f4ff" : "#fff",
                                                    borderBottom: "1px solid #f5f5f5",
                                                    transition: "background 0.1s",
                                                    userSelect: "none",
                                                }}
                                                onTouchStart={(e) => {
                                                    if (!isSelected)
                                                        (e.currentTarget as HTMLDivElement).style.background = "#f0f0f0";
                                                }}
                                                onTouchEnd={(e) => {
                                                    if (!isSelected)
                                                        setTimeout(() => {
                                                            (e.currentTarget as HTMLDivElement).style.background = "";
                                                        }, 150);
                                                }}
                                            >
                                                {/* Tên option */}
                                                <span style={{
                                                    flex: 1,
                                                    fontSize: 15,
                                                    color: isSelected ? "#1677ff" : "#222",
                                                    fontWeight: isSelected ? 600 : 400,
                                                    lineHeight: "1.5",
                                                    wordBreak: "break-word",
                                                }}>
                                                    {opt.label}
                                                </span>

                                                {/* Tick khi đã chọn */}
                                                {isSelected && (
                                                    <span style={{
                                                        width: 22, height: 22,
                                                        borderRadius: "50%",
                                                        background: "#1677ff",
                                                        display: "flex", alignItems: "center", justifyContent: "center",
                                                        flexShrink: 0, marginLeft: 12,
                                                    }}>
                                                        <CheckOutlined style={{ color: "#fff", fontSize: 11 }} />
                                                    </span>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            <style>{`
                @keyframes mobileSheetSlideUp {
                    from { transform: translateY(100%); opacity: 0.6; }
                    to   { transform: translateY(0);    opacity: 1; }
                }
            `}</style>
        </>
    );
};

export default MobileBottomSheet;