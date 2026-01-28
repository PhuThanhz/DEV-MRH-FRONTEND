import React from "react";
import { Dropdown, Menu, Tag, Space, Button } from "antd";
import { FilterOutlined, CloseCircleOutlined, DownOutlined } from "@ant-design/icons";

export interface FilterField {
    key: string;
    label: string;
    icon?: React.ReactNode;
    options?: { label: string; value: any; color?: string }[];
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

    // Reset filters khi có tín hiệu resetSignal
    React.useEffect(() => {
        if (resetSignal !== undefined) {
            setActiveFilters({});
            onChange({});
        }
    }, [resetSignal]);

    const handleSelect = (fieldKey: string, value: any) => {
        const newFilters = { ...activeFilters, [fieldKey]: value };
        setActiveFilters(newFilters);
        onChange(newFilters);
        setOpenDropdownKey(null);
    };

    const handleClear = (fieldKey: string) => {
        const newFilters = { ...activeFilters };
        delete newFilters[fieldKey];
        setActiveFilters(newFilters);
        onChange(newFilters);
    };

    const handleClearAll = () => {
        setActiveFilters({});
        onChange({});
    };

    const mainMenu = (
        <Menu
            items={fields.map((field) => ({
                key: field.key,
                label: (
                    <Space>
                        {field.icon}
                        {field.label}
                    </Space>
                ),
                onClick: () => setOpenDropdownKey(field.key),
            }))}
        />
    );

    const currentField = fields.find((f) => f.key === openDropdownKey);
    const subMenu = currentField ? (
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
    ) : null;

    return (
        <Space wrap>
            {openDropdownKey && subMenu ? (
                <Dropdown
                    open
                    menu={{ items: subMenu.props.items }}
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
                <Dropdown menu={{ items: mainMenu.props.items }} trigger={["click"]}>
                    <Button icon={<FilterOutlined />}>{buttonLabel}</Button>
                </Dropdown>
            )}

            {Object.entries(activeFilters).map(([key, val]) => {
                const field = fields.find((f) => f.key === key);
                const option = field?.options?.find((o) => o.value === val);
                return (
                    <Tag
                        key={key}
                        closable
                        onClose={() => handleClear(key)}
                        color={option?.color}
                        style={{ padding: "4px 8px", fontSize: 13 }}
                    >
                        {field?.label}: <strong>{option?.label || val}</strong>
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
