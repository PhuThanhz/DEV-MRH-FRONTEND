import React from "react";
import { Dropdown, Menu, Tag, Space, Button, Select, InputNumber } from "antd";
import { FilterOutlined, CloseCircleOutlined, DownOutlined } from "@ant-design/icons";

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

const AdvancedFilterSelect: React.FC<AdvancedFilterSelectProps> = ({
    fields,
    onChange,
    resetSignal,
    buttonLabel = "Bộ lọc",
}) => {
    const [activeFilters, setActiveFilters] = React.useState<Record<string, any>>({});
    const [openDropdownKey, setOpenDropdownKey] = React.useState<string | null>(null);
    const [asyncOptions, setAsyncOptions] = React.useState<Record<string, { label: string; value: any }[]>>({});
    const [loadingKey, setLoadingKey] = React.useState<string | null>(null);

    React.useEffect(() => {
        if (resetSignal !== undefined) {
            setActiveFilters({});
            onChange({});
        }
    }, [resetSignal]);

    const handleOpenField = async (field: FilterField) => {
        setOpenDropdownKey(field.key);

        if (field.type === "async-select") {
            if (field.dependsOn) {
                const depVal = activeFilters[field.dependsOn];
                if (!depVal) return;
                setLoadingKey(field.key);
                const opts = await field.loadOptionsWithDep?.(depVal) ?? [];
                setAsyncOptions((prev) => ({ ...prev, [field.key]: opts }));
                setLoadingKey(null);
            } else if (field.loadOptions) {
                setLoadingKey(field.key);
                const opts = await field.loadOptions();
                setAsyncOptions((prev) => ({ ...prev, [field.key]: opts }));
                setLoadingKey(null);
            }
        }
    };

    const handleSelect = (fieldKey: string, value: any) => {
        const newFilters = { ...activeFilters, [fieldKey]: value };

        fields.forEach((f) => {
            if (f.dependsOn === fieldKey) {
                delete newFilters[f.key];
                setAsyncOptions((prev) => ({ ...prev, [f.key]: [] }));
            }
        });

        setActiveFilters(newFilters);
        onChange(newFilters);
        setOpenDropdownKey(null);
    };

    const handleClear = (fieldKey: string) => {
        const newFilters = { ...activeFilters };
        delete newFilters[fieldKey];

        fields.forEach((f) => {
            if (f.dependsOn === fieldKey) {
                delete newFilters[f.key];
            }
        });

        setActiveFilters(newFilters);
        onChange(newFilters);
    };

    const handleClearAll = () => {
        setActiveFilters({});
        setAsyncOptions({});
        onChange({});
    };

    const currentField = fields.find((f) => f.key === openDropdownKey);

    const renderSubContent = () => {
        if (!currentField) return null;

        if (currentField.type === "number") {
            return (
                <div style={{ padding: "12px 14px", minWidth: 200 }}>
                    <div style={{ fontSize: 12, color: "#999", marginBottom: 8, fontWeight: 500 }}>
                        {currentField.label}
                    </div>
                    <InputNumber
                        autoFocus
                        placeholder="Nhập năm..."
                        style={{ width: "100%" }}
                        min={2000}
                        max={2100}
                        onChange={(val) => {
                            if (val) handleSelect(currentField.key, val);
                        }}
                        onPressEnter={() => setOpenDropdownKey(null)}
                    />
                </div>
            );
        }

        if (currentField.type === "async-select") {
            const opts = asyncOptions[currentField.key] ?? [];
            const depVal = currentField.dependsOn ? activeFilters[currentField.dependsOn] : undefined;
            const isDisabled = currentField.dependsOn && !depVal;

            return (
                // TĂNG minWidth lên 320 để hiển thị đủ tên công ty
                <div style={{ padding: "12px 14px", minWidth: 320 }}>
                    <div style={{ fontSize: 12, color: "#999", marginBottom: 8, fontWeight: 500 }}>
                        {currentField.label}
                        {isDisabled && (
                            <span style={{ color: "#ffaa00", marginLeft: 6 }}>
                                (Chọn {fields.find((f) => f.key === currentField.dependsOn)?.label} trước)
                            </span>
                        )}
                    </div>
                    <Select
                        autoFocus
                        showSearch
                        allowClear
                        placeholder={`Chọn ${currentField.label}...`}
                        style={{ width: "100%" }}
                        loading={loadingKey === currentField.key}
                        disabled={!!isDisabled}
                        options={opts}
                        optionFilterProp="label"
                        // Tăng maxTagTextLength để hiển thị đủ tên
                        optionLabelProp="label"
                        onChange={(val) => {
                            if (val !== undefined && val !== null) {
                                handleSelect(currentField.key, val);
                            } else {
                                handleClear(currentField.key);
                            }
                        }}
                        // Dropdown của Select cũng đủ rộng
                        popupMatchSelectWidth={false}
                        dropdownStyle={{ minWidth: 320 }}
                    />
                </div>
            );
        }

        // default: options tĩnh
        return (
            <Menu
                items={
                    currentField.options?.map((opt) => ({
                        key: `${currentField.key}-${opt.value}`,
                        label: (
                            <Space>
                                <Tag color={opt.color || "default"}>{opt.label}</Tag>
                            </Space>
                        ),
                        onClick: () => handleSelect(currentField.key, opt.value),
                    })) || []
                }
            />
        );
    };

    const mainMenuItems = fields.map((field) => ({
        key: field.key,
        label: (
            <Space>
                {field.icon}
                {field.label}
                {field.dependsOn && !activeFilters[field.dependsOn] && (
                    <span style={{ fontSize: 11, color: "#bbb" }}>
                        (chọn {fields.find((f) => f.key === field.dependsOn)?.label} trước)
                    </span>
                )}
            </Space>
        ),
        onClick: () => handleOpenField(field),
    }));

    return (
        <Space wrap>
            {openDropdownKey ? (
                <Dropdown
                    open
                    dropdownRender={() => (
                        <div style={{
                            background: "#fff",
                            borderRadius: 10,
                            boxShadow: "0 6px 20px rgba(0,0,0,0.12)",
                            overflow: "hidden",
                        }}>
                            {renderSubContent()}
                        </div>
                    )}
                    trigger={["click"]}
                    onOpenChange={(open) => {
                        if (!open) setOpenDropdownKey(null);
                    }}
                >
                    <Button icon={<FilterOutlined />}>
                        {currentField?.label} <DownOutlined />
                    </Button>
                </Dropdown>
            ) : (
                <Dropdown menu={{ items: mainMenuItems }} trigger={["click"]}>
                    <Button icon={<FilterOutlined />}>{buttonLabel}</Button>
                </Dropdown>
            )}

            {Object.entries(activeFilters).map(([key, val]) => {
                const field = fields.find((f) => f.key === key);
                const option = field?.options?.find((o) => o.value === val);
                const asyncOpt = asyncOptions[key]?.find((o) => o.value === val);
                const displayLabel = option?.label || asyncOpt?.label || val;
                return (
                    <Tag
                        key={key}
                        closable
                        onClose={() => handleClear(key)}
                        color={option?.color}
                        style={{ padding: "4px 10px", fontSize: 13, borderRadius: 6 }}
                    >
                        {field?.label}: <strong>{displayLabel}</strong>
                    </Tag>
                );
            })}

            {Object.keys(activeFilters).length > 0 && (
                <Button
                    size="small"
                    type="link"
                    icon={<CloseCircleOutlined />}
                    onClick={handleClearAll}
                >
                    Xóa tất cả
                </Button>
            )}
        </Space>
    );
};

export default AdvancedFilterSelect;