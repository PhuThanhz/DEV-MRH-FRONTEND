// ============================================================
//  AdvancedFilterSelect.tsx  (Main + Desktop)
//  Giao diện DESKTOP — Dropdown submenu
//  Chỉnh sửa UI/UX desktop tại đây (SearchableSubmenu)
//  Logic chung (filter, cache, state) cũng nằm ở đây
// ============================================================

import React from "react";
import { Dropdown, Tag, Button, Spin, Input, Tooltip } from "antd";  // ← bỏ Space
import {
    FilterOutlined,
    CloseCircleOutlined,
    SearchOutlined,
    LockOutlined,
} from "@ant-design/icons";
import type { MenuProps } from "antd";
import type { FilterField, FilterOption } from "./AdvancedFilterSelect.types";
import MobileBottomSheet from "./AdvancedFilterSelect.mobile";

export type { FilterField, FilterOption } from "./AdvancedFilterSelect.types";

// ─── Hook detect mobile (< 768px) ────────────────────────────────────────────
const useIsMobile = () => {
    const [isMobile, setIsMobile] = React.useState(
        typeof window !== "undefined" && window.innerWidth < 768
    );
    React.useEffect(() => {
        const handler = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener("resize", handler);
        return () => window.removeEventListener("resize", handler);
    }, []);
    return isMobile;
};

// ─── Desktop: Submenu có ô tìm kiếm ──────────────────────────────────────────
const SearchableSubmenu: React.FC<{
    field: FilterField;
    options: FilterOption[];
    isLoading: boolean;
    onSelect: (fieldKey: string, value: any) => void;
    selectedValue?: any;
}> = ({ field, options, isLoading, onSelect }) => {
    const [searchText, setSearchText] = React.useState("");

    const filteredOptions = options.filter((opt) =>
        opt.label.toLowerCase().includes(searchText.toLowerCase())
    );

    return (
        <div style={{ minWidth: 200, maxWidth: 320, width: "max-content" }}>
            <div style={{ padding: "8px 10px", borderBottom: "1px solid #f0f0f0" }}>
                <Input
                    prefix={<SearchOutlined style={{ color: "#bfbfbf", fontSize: 13 }} />}
                    placeholder={`Tìm ${field.label.toLowerCase()}...`}
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    onKeyDown={(e) => e.stopPropagation()}
                    allowClear
                    size="small"
                    style={{ borderRadius: 6, fontSize: 13 }}
                    autoFocus
                />
            </div>

            <div style={{ maxHeight: 260, overflowY: "auto", overflowX: "hidden", padding: "4px 0" }}>
                {isLoading ? (
                    <div style={{ textAlign: "center", padding: "16px 0" }}>
                        <Spin size="small" />
                    </div>
                ) : filteredOptions.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "14px 0", color: "#bfbfbf", fontSize: 13 }}>
                        Không tìm thấy kết quả
                    </div>
                ) : (
                    filteredOptions.map((opt) => (
                        <div
                            key={opt.value}
                            onClick={(e) => { e.stopPropagation(); onSelect(field.key, opt.value); }}
                            style={{ padding: "6px 12px", cursor: "pointer", transition: "background 0.15s" }}
                            onMouseEnter={(e) =>
                                ((e.currentTarget as HTMLDivElement).style.background = "#f5f5f5")
                            }
                            onMouseLeave={(e) =>
                                ((e.currentTarget as HTMLDivElement).style.background = "transparent")
                            }
                        >
                            <Tag
                                color={opt.color || "blue"}
                                style={{
                                    margin: 0, cursor: "pointer",
                                    whiteSpace: "normal", wordBreak: "break-word",
                                    lineHeight: "1.4", maxWidth: "100%", display: "inline-block",
                                }}
                            >
                                {opt.label}
                            </Tag>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

// ─── Props ────────────────────────────────────────────────────────────────────
interface Props {
    fields: FilterField[];
    onChange: (filters: Record<string, any>) => void;
    resetSignal?: number;
    buttonLabel?: string;
}

// ─── Main Component ───────────────────────────────────────────────────────────
const AdvancedFilterSelect: React.FC<Props> = ({
    fields,
    onChange,
    resetSignal,
    buttonLabel = "Bộ lọc",
}) => {
    const isMobile = useIsMobile();

    const [activeFilters, setActiveFilters] = React.useState<Record<string, any>>({});
    const [cache, setCache] = React.useState<Record<string, FilterOption[]>>({});
    const [loading, setLoading] = React.useState<Record<string, boolean>>({});
    const [dropdownOpen, setDropdownOpen] = React.useState(false);
    const [sheetOpen, setSheetOpen] = React.useState(false);

    React.useEffect(() => {
        if (resetSignal !== undefined) {
            setActiveFilters({});
            setCache({});
            onChange({});
        }
    }, [resetSignal]);

    const getCacheKey = (field: FilterField) =>
        field.dependsOn
            ? `${field.key}__${activeFilters[field.dependsOn] ?? ""}`
            : `${field.key}__standalone`;

    const getOptions = (field: FilterField): FilterOption[] => {
        if (field.asyncOptions) return cache[getCacheKey(field)] ?? [];
        return field.options ?? [];
    };

    React.useEffect(() => {
        fields.forEach((field) => {
            if (!field.asyncOptions || !field.dependsOn) return;
            const parentVal = activeFilters[field.dependsOn];
            if (!parentVal) return;
            const cacheKey = getCacheKey(field);
            if (cache[cacheKey]) return;
            setLoading((prev) => ({ ...prev, [field.key]: true }));
            field.asyncOptions!(parentVal)
                .then((opts) => setCache((prev) => ({ ...prev, [cacheKey]: opts })))
                .finally(() => setLoading((prev) => ({ ...prev, [field.key]: false })));
        });
    }, [activeFilters]);

    const fetchIfNeeded = (field: FilterField) => {
        if (!field.asyncOptions) return;
        if (field.dependsOn && !activeFilters[field.dependsOn]) return;
        const cacheKey = getCacheKey(field);
        if (cache[cacheKey]) return;
        const dependValue = field.dependsOn ? activeFilters[field.dependsOn] : null;
        setLoading((prev) => ({ ...prev, [field.key]: true }));
        field.asyncOptions!(dependValue)
            .then((opts) => setCache((prev) => ({ ...prev, [cacheKey]: opts })))
            .finally(() => setLoading((prev) => ({ ...prev, [field.key]: false })));
    };

    const handleSelect = (fieldKey: string, value: any) => {
        const newFilters = { ...activeFilters, [fieldKey]: value };
        fields.forEach((f) => {
            if (f.dependsOn === fieldKey) delete newFilters[f.key];
        });
        setActiveFilters(newFilters);
        onChange(newFilters);
        setDropdownOpen(false);
    };

    const handleClear = (fieldKey: string) => {
        const newFilters = { ...activeFilters };
        delete newFilters[fieldKey];
        fields.forEach((f) => {
            if (f.dependsOn === fieldKey) {
                delete newFilters[f.key];
                setCache((prev) => {
                    const next = { ...prev };
                    Object.keys(next).forEach((k) => {
                        if (k.startsWith(`${f.key}__`)) delete next[k];
                    });
                    return next;
                });
            }
        });
        setActiveFilters(newFilters);
        onChange(newFilters);
    };

    const handleClearAll = () => {
        setActiveFilters({});
        setCache({});
        onChange({});
    };

    const menuItems: MenuProps["items"] = fields.map((field) => {
        const isDisabled = !!field.dependsOn && !activeFilters[field.dependsOn];
        const parentField = fields.find((f) => f.key === field.dependsOn);
        const opts = getOptions(field);
        const isLoading = loading[field.key];
        const isSearchable = field.searchable !== false;

        const labelNode = isDisabled ? (
            <Tooltip
                title={`Vui lòng chọn ${parentField?.label ?? "mục cha"} trước`}
                placement="right"
            >
                <span style={{ display: "flex", alignItems: "center", gap: 6, color: "#c0c0c0" }}>
                    {field.icon && <span>{field.icon}</span>}
                    <span>{field.label}</span>
                    <LockOutlined style={{ fontSize: 10 }} />
                </span>
            </Tooltip>
        ) : (
            <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                {field.icon && <span>{field.icon}</span>}
                <span>{field.label}</span>
                {activeFilters[field.key] !== undefined && (
                    <span style={{
                        width: 6, height: 6, borderRadius: "50%",
                        background: "#1677ff", display: "inline-block", flexShrink: 0,
                    }} />
                )}
            </span>
        );

        if (isSearchable) {
            return {
                key: field.key,
                disabled: isDisabled,
                label: labelNode,
                children: [{
                    key: `${field.key}__searchable_panel`,
                    label: (
                        <SearchableSubmenu
                            field={field}
                            options={opts}
                            isLoading={isLoading}
                            onSelect={handleSelect}
                            selectedValue={activeFilters[field.key]}
                        />
                    ),
                    style: { padding: 0, margin: 0, background: "transparent" },
                }],
                onTitleClick: () => fetchIfNeeded(field),
            };
        }

        const children: MenuProps["items"] = isLoading
            ? [{ key: `${field.key}__loading`, label: <div style={{ textAlign: "center", padding: "8px 0" }}><Spin size="small" /></div>, disabled: true }]
            : opts.length === 0
                ? [{ key: `${field.key}__empty`, label: <span style={{ color: "#bfbfbf", fontSize: 13 }}>Không có dữ liệu</span>, disabled: true }]
                : opts.map((opt) => ({
                    key: `${field.key}__${opt.value}`,
                    label: <Tag color={opt.color || "blue"} style={{ margin: 0 }}>{opt.label}</Tag>,
                    onClick: () => handleSelect(field.key, opt.value),
                }));

        return { key: field.key, disabled: isDisabled, label: labelNode, children, onTitleClick: () => fetchIfNeeded(field) };
    });

    const activeCount = Object.keys(activeFilters).length;

    const FilterBtn = (
        <Button
            icon={<FilterOutlined />}
            style={activeCount > 0 ? { borderColor: "#1677ff", color: "#1677ff" } : {}}
            onClick={isMobile ? () => setSheetOpen(true) : undefined}
        >
            {buttonLabel}
            {activeCount > 0 && (
                <span style={{
                    display: "inline-flex", alignItems: "center", justifyContent: "center",
                    width: 18, height: 18, borderRadius: "50%",
                    background: "#1677ff", color: "#fff",
                    fontSize: 11, fontWeight: 600, marginLeft: 4,
                }}>
                    {activeCount}
                </span>
            )}
        </Button>
    );

    return (
        <>
            {/* ← đổi <Space wrap> thành div flex, các thứ khác giữ nguyên */}
            <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
                {isMobile ? FilterBtn : (
                    <Dropdown
                        menu={{ items: menuItems, triggerSubMenuAction: "click" }}
                        trigger={["click"]}
                        open={dropdownOpen}
                        onOpenChange={(open) => setDropdownOpen(open)}
                        overlayStyle={{ maxWidth: "calc(100vw - 16px)" }}
                    >
                        {FilterBtn}
                    </Dropdown>
                )}

                {Object.entries(activeFilters).map(([key, val]) => {
                    const field = fields.find((f) => f.key === key);
                    if (!field) return null;
                    const option = getOptions(field).find((o) => o.value === val);
                    const labelText = option?.label ?? val;
                    const MAX_LEN = 24;
                    const displayLabel = String(labelText).length > MAX_LEN
                        ? String(labelText).slice(0, MAX_LEN) + "…"
                        : labelText;
                    return (
                        <Tag
                            key={key}
                            closable
                            onClose={() => handleClear(key)}
                            color={option?.color || "blue"}
                            title={String(labelText)}
                            style={{
                                padding: "3px 8px", fontSize: 13, borderRadius: 6,
                                maxWidth: "calc(100vw - 80px)",
                                display: "inline-flex", alignItems: "center",
                            }}
                        >
                            <span style={{ opacity: 0.7, marginRight: 3, fontSize: 12, flexShrink: 0 }}>
                                {field.label}:
                            </span>
                            <strong style={{
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                            }}>
                                {displayLabel}
                            </strong>
                        </Tag>
                    );
                })}

                {activeCount > 0 && (
                    <Button
                        size="small"
                        type="text"
                        icon={<CloseCircleOutlined />}
                        style={{ color: "#ff4d4f" }}
                        onClick={handleClearAll}
                    >
                        Xóa tất cả
                    </Button>
                )}
            </div>

            <MobileBottomSheet
                open={sheetOpen}
                onClose={() => setSheetOpen(false)}
                fields={fields}
                activeFilters={activeFilters}
                onSelect={handleSelect}
                onClearAll={handleClearAll}
                getOptions={getOptions}
                loading={loading}
                fetchIfNeeded={fetchIfNeeded}
            />
        </>
    );
};

export default AdvancedFilterSelect;