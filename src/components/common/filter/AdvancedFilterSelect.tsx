import React from "react";
import { Dropdown, Menu, Tag, Space, Button, Input } from "antd";
import {
    FilterOutlined,
    CloseCircleOutlined,
    DownOutlined,
    SearchOutlined,
} from "@ant-design/icons";

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
    const [activeFilters, setActiveFilters] = React.useState<Record<string, any>>(
        {}
    );
    const [openDropdownKey, setOpenDropdownKey] = React.useState<string | null>(
        null
    );
    const [searchText, setSearchText] = React.useState<string>("");

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
        setSearchText("");
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

    // Menu chính
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
                onClick: () => {
                    setOpenDropdownKey(field.key);
                    setSearchText("");
                },
            }))}
        />
    );

    const currentField = fields.find((f) => f.key === openDropdownKey);

    // Lọc option theo search
    const filteredOptions =
        currentField?.options?.filter((opt) =>
            opt.label.toLowerCase().includes(searchText.toLowerCase())
        ) || [];

    const subMenu = currentField ? (
        <div style={{ width: 260 }}>
            <Input
                placeholder={`Tìm ${currentField.label.toLowerCase()}...`}
                prefix={<SearchOutlined />}
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                style={{ marginBottom: 8 }}
                allowClear
            />
            <Menu
                style={{ maxHeight: 250, overflowY: "auto" }}
                items={filteredOptions.map((opt) => ({
                    key: `${currentField.key}-${opt.value}`,
                    label: (
                        <Tag color={opt.color || "default"} style={{ margin: 0 }}>
                            {opt.label}
                        </Tag>
                    ),
                    onClick: () => handleSelect(currentField.key, opt.value),
                }))}
            />
        </div>
    ) : null;

    return (
        <Space wrap>
            {openDropdownKey && subMenu ? (
                <Dropdown
                    open
                    dropdownRender={() => subMenu}
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

            {/* Hiển thị filter đã chọn */}
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
