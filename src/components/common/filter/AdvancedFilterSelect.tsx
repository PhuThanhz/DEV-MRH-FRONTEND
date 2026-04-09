import React from "react";
import { Dropdown, Tag, Space, Button, Spin, Input, Tooltip } from "antd";
import { FilterOutlined, CloseCircleOutlined, SearchOutlined, LockOutlined, CheckOutlined } from "@ant-design/icons";
import type { MenuProps } from "antd";

export interface FilterOption {
    label: string;
    value: any;
    color?: string;
}

export interface FilterField {
    key: string;
    label: string;
    icon?: React.ReactNode;
    options?: FilterOption[];
    dependsOn?: string;
    asyncOptions?: (dependValue: any) => Promise<FilterOption[]>;
    searchable?: boolean;
}

interface Props {
    fields: FilterField[];
    onChange: (filters: Record<string, any>) => void;
    resetSignal?: number;
    buttonLabel?: string;
}

// Component submenu có ô search
const SearchableSubmenu: React.FC<{
    field: FilterField;
    options: FilterOption[];
    isLoading: boolean;
    onSelect: (fieldKey: string, value: any) => void;
    selectedValue?: any;
}> = ({ field, options, isLoading, onSelect, selectedValue }) => {
    const [searchText, setSearchText] = React.useState("");

    const filteredOptions = options.filter((opt) =>
        opt.label.toLowerCase().includes(searchText.toLowerCase())
    );

    return (
        <div style={{ minWidth: 180, maxWidth: 320, width: "max-content" }}>
            {/* Search box */}
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

            {/* Options list */}
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
                    filteredOptions.map((opt) => {
                        const isSelected = selectedValue === opt.value;
                        return (
                            <div
                                key={opt.value}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onSelect(field.key, opt.value);
                                }}
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                    padding: "6px 12px",
                                    cursor: "pointer",
                                    background: isSelected ? "#e6f4ff" : "transparent",
                                    transition: "background 0.15s",
                                }}
                                onMouseEnter={(e) => {
                                    if (!isSelected)
                                        (e.currentTarget as HTMLDivElement).style.background = "#f5f5f5";
                                }}
                                onMouseLeave={(e) => {
                                    if (!isSelected)
                                        (e.currentTarget as HTMLDivElement).style.background = "transparent";
                                }}
                            >
                                <Tag
                                    color={opt.color || "blue"}
                                    style={{
                                        margin: 0,
                                        cursor: "pointer",
                                        whiteSpace: "normal",
                                        wordBreak: "break-word",
                                        lineHeight: "1.4",
                                        maxWidth: "90%",
                                    }}
                                >
                                    {opt.label}
                                </Tag>
                                {isSelected && (
                                    <CheckOutlined style={{ color: "#1677ff", fontSize: 12, flexShrink: 0 }} />
                                )}
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
};

const AdvancedFilterSelect: React.FC<Props> = ({
    fields,
    onChange,
    resetSignal,
    buttonLabel = "Bộ lọc",
}) => {
    const [activeFilters, setActiveFilters] = React.useState<Record<string, any>>({});
    const [cache, setCache] = React.useState<Record<string, FilterOption[]>>({});
    const [loading, setLoading] = React.useState<Record<string, boolean>>({});

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
            field
                .asyncOptions!(parentVal)
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
        field
            .asyncOptions!(dependValue)
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

    const menuItems: MenuProps["items"] = fields.map((field) => {
        const isDisabled = !!field.dependsOn && !activeFilters[field.dependsOn];
        const parentField = fields.find((f) => f.key === field.dependsOn);
        const opts = getOptions(field);
        const isLoading = loading[field.key];
        const isSearchable = field.searchable !== false;

        // Label gọn gàng: disabled thì icon khoá + tooltip, không hiện text xấu
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
                    <span
                        style={{
                            width: 6,
                            height: 6,
                            borderRadius: "50%",
                            background: "#1677ff",
                            display: "inline-block",
                            flexShrink: 0,
                        }}
                    />
                )}
            </span>
        );

        if (isSearchable) {
            return {
                key: field.key,
                disabled: isDisabled,
                label: labelNode,
                children: [
                    {
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
                    },
                ],
                onTitleClick: () => fetchIfNeeded(field),
            };
        }

        // Fallback: submenu không có search
        const children: MenuProps["items"] = isLoading
            ? [{ key: `${field.key}__loading`, label: <div style={{ textAlign: "center", padding: "8px 0" }}><Spin size="small" /></div>, disabled: true }]
            : opts.length === 0
                ? [{ key: `${field.key}__empty`, label: <span style={{ color: "#bfbfbf", fontSize: 13 }}>Không có dữ liệu</span>, disabled: true }]
                : opts.map((opt) => ({
                    key: `${field.key}__${opt.value}`,
                    label: <Tag color={opt.color || "blue"} style={{ margin: 0 }}>{opt.label}</Tag>,
                    onClick: () => handleSelect(field.key, opt.value),
                }));

        return {
            key: field.key,
            disabled: isDisabled,
            label: labelNode,
            children,
            onTitleClick: () => fetchIfNeeded(field),
        };
    });

    const activeCount = Object.keys(activeFilters).length;

    return (
        <Space wrap>
            <Dropdown menu={{ items: menuItems, triggerSubMenuAction: "click" }} trigger={["click"]}>
                <Button
                    icon={<FilterOutlined />}
                    style={activeCount > 0 ? { borderColor: "#1677ff", color: "#1677ff" } : {}}
                >
                    {buttonLabel}
                    {activeCount > 0 && (
                        <span
                            style={{
                                display: "inline-flex",
                                alignItems: "center",
                                justifyContent: "center",
                                width: 18,
                                height: 18,
                                borderRadius: "50%",
                                background: "#1677ff",
                                color: "#fff",
                                fontSize: 11,
                                fontWeight: 600,
                                marginLeft: 4,
                            }}
                        >
                            {activeCount}
                        </span>
                    )}
                </Button>
            </Dropdown>

            {/* Tags filter đã chọn */}
            {Object.entries(activeFilters).map(([key, val]) => {
                const field = fields.find((f) => f.key === key);
                if (!field) return null;
                const option = getOptions(field).find((o) => o.value === val);
                return (
                    <Tag
                        key={key}
                        closable
                        onClose={() => handleClear(key)}
                        color={option?.color || "blue"}
                        style={{ padding: "3px 8px", fontSize: 13, borderRadius: 6 }}
                    >
                        <span style={{ opacity: 0.7, marginRight: 3, fontSize: 12 }}>
                            {field.label}:
                        </span>
                        <strong>{option?.label ?? val}</strong>
                    </Tag>
                );
            })}

            {activeCount > 0 && (
                <Button
                    size="small"
                    type="text"
                    icon={<CloseCircleOutlined />}
                    style={{ color: "#ff4d4f" }}
                    onClick={() => {
                        setActiveFilters({});
                        setCache({});
                        onChange({});
                    }}
                >
                    Xóa tất cả
                </Button>
            )}
        </Space>
    );
};

export default AdvancedFilterSelect;