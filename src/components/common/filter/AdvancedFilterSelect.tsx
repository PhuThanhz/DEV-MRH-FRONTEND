import React from "react";
import { Dropdown, Tag, Space, Button, Spin } from "antd";
import { FilterOutlined, CloseCircleOutlined } from "@ant-design/icons";
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
}

interface Props {
    fields: FilterField[];
    onChange: (filters: Record<string, any>) => void;
    resetSignal?: number;
    buttonLabel?: string;
}

const AdvancedFilterSelect: React.FC<Props> = ({
    fields,
    onChange,
    resetSignal,
    buttonLabel = "Bộ lọc",
}) => {
    const [activeFilters, setActiveFilters] = React.useState<Record<string, any>>({});
    const [cache, setCache] = React.useState<Record<string, FilterOption[]>>({});
    const [loading, setLoading] = React.useState<Record<string, boolean>>({});

    // Reset khi resetSignal thay đổi
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

    // ✅ FIX: Pre-fetch options của field con ngay khi parent thay đổi
    // Không cần đợi user click vào submenu mới fetch
    React.useEffect(() => {
        fields.forEach((field) => {
            if (!field.asyncOptions || !field.dependsOn) return;

            const parentVal = activeFilters[field.dependsOn];
            if (!parentVal) return; // cha chưa chọn → bỏ qua

            const cacheKey = getCacheKey(field);
            if (cache[cacheKey]) return; // đã có cache → bỏ qua

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
        if (cache[cacheKey]) return; // đã có cache

        const dependValue = field.dependsOn ? activeFilters[field.dependsOn] : null;
        setLoading((prev) => ({ ...prev, [field.key]: true }));
        field.asyncOptions!(dependValue)
            .then((opts) => setCache((prev) => ({ ...prev, [cacheKey]: opts })))
            .finally(() => setLoading((prev) => ({ ...prev, [field.key]: false })));
    };

    const handleSelect = (fieldKey: string, value: any) => {
        const newFilters = { ...activeFilters, [fieldKey]: value };
        // Reset field con khi cha thay đổi
        fields.forEach((f) => {
            if (f.dependsOn === fieldKey) delete newFilters[f.key];
        });
        setActiveFilters(newFilters);
        onChange(newFilters);
    };

    const handleClear = (fieldKey: string) => {
        const newFilters = { ...activeFilters };
        delete newFilters[fieldKey];
        // Reset cả field con lẫn cache của field con
        fields.forEach((f) => {
            if (f.dependsOn === fieldKey) {
                delete newFilters[f.key];
                // ✅ Xóa cache của field con khi xóa cha để force re-fetch lần sau
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
        const parentLabel = fields.find((f) => f.key === field.dependsOn)?.label?.toLowerCase();
        const opts = getOptions(field);
        const isLoading = loading[field.key];

        const children: MenuProps["items"] = isLoading
            ? [
                {
                    key: `${field.key}__loading`,
                    label: (
                        <div style={{ textAlign: "center", padding: "8px 0" }}>
                            <Spin size="small" />
                        </div>
                    ),
                    disabled: true,
                },
            ]
            : opts.length === 0
                ? [
                    {
                        key: `${field.key}__empty`,
                        label: (
                            <span style={{ color: "#bfbfbf", fontSize: 13 }}>
                                Không có dữ liệu
                            </span>
                        ),
                        disabled: true,
                    },
                ]
                : opts.map((opt) => ({
                    key: `${field.key}__${opt.value}`,
                    label: (
                        <Tag color={opt.color || "blue"} style={{ margin: 0 }}>
                            {opt.label}
                        </Tag>
                    ),
                    onClick: () => handleSelect(field.key, opt.value),
                }));

        return {
            key: field.key,
            disabled: isDisabled,
            icon: field.icon,
            label:
                isDisabled && parentLabel ? (
                    <span>
                        {field.label}{" "}
                        <span style={{ fontSize: 11, color: "#bfbfbf" }}>
                            (chọn {parentLabel} trước)
                        </span>
                    </span>
                ) : (
                    field.label
                ),
            children,
            onTitleClick: () => fetchIfNeeded(field),
        };
    });

    return (
        <Space wrap>
            <Dropdown menu={{ items: menuItems }} trigger={["click"]}>
                <Button icon={<FilterOutlined />}>{buttonLabel}</Button>
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
                        style={{ padding: "4px 8px", fontSize: 13 }}
                    >
                        {field.label}: <strong>{option?.label ?? val}</strong>
                    </Tag>
                );
            })}

            {Object.keys(activeFilters).length > 0 && (
                <Button
                    size="small"
                    type="link"
                    icon={<CloseCircleOutlined />}
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