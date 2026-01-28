import React, { useState } from "react";
import { Input, Button, Popover, Form } from "antd";
import {
    FilterOutlined,
    SearchOutlined,
    PlusOutlined,
    ReloadOutlined,
} from "@ant-design/icons";

interface FilterField {
    name: string;
    label: string;
    placeholder?: string;
}

interface SearchFilterProps {
    searchPlaceholder?: string;
    filterFields?: FilterField[];
    onSearch?: (value: string) => void;
    onFilterApply?: (filters: Record<string, any>) => void;
    onReset?: () => void;
    onAddClick?: () => void;
    addLabel?: string | React.ReactNode;
    showAddButton?: boolean;
    showFilterButton?: boolean;
    showResetButton?: boolean;
}

const SearchFilter: React.FC<SearchFilterProps> = ({
    searchPlaceholder = "Search...",
    filterFields = [],
    onSearch,
    onFilterApply,
    onReset,
    onAddClick,
    addLabel = "Add Item",
    showAddButton = true,
    showFilterButton = true,
    showResetButton = true,
}) => {
    const [open, setOpen] = useState(false);
    const [form] = Form.useForm();

    const handleApply = () => {
        const values = form.getFieldsValue();
        onFilterApply?.(values);
        setOpen(false);
    };

    const content = (
        <div className="w-64">
            <Form layout="vertical" form={form}>
                {filterFields.map((f) => (
                    <Form.Item
                        key={f.name}
                        label={f.label}
                        name={f.name}
                        className="mb-3 text-sm font-medium"
                    >
                        <Input placeholder={f.placeholder || `Nhập ${f.label.toLowerCase()}...`} />
                    </Form.Item>
                ))}
                <div className="flex justify-between gap-2 mt-2">
                    <Button onClick={onReset} className="flex-1">
                        Reset
                    </Button>
                    <Button type="primary" onClick={handleApply} className="flex-1">
                        Apply
                    </Button>
                </div>
            </Form>
        </div>
    );

    return (
        <div className="flex flex-col gap-3 bg-transparent w-full">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 w-full flex-wrap">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 flex-1 min-w-[250px]">
                    <Input
                        placeholder={searchPlaceholder}
                        prefix={<SearchOutlined className="text-gray-400" />}
                        onPressEnter={(e) => onSearch?.((e.target as HTMLInputElement).value)}
                        className="h-10 rounded-md flex-1"
                    />

                    <div className="flex flex-row items-center gap-2 sm:gap-3 flex-wrap justify-start sm:justify-end">
                        {showFilterButton && (
                            <Popover
                                open={open}
                                onOpenChange={setOpen}
                                trigger="click"
                                placement="bottomRight"
                                content={content}
                            >
                                <Button
                                    icon={<FilterOutlined />}
                                    className="h-9 text-sm flex items-center justify-center px-4 w-auto"
                                >
                                    Bộ Lọc
                                </Button>
                            </Popover>
                        )}

                        {showResetButton && (
                            <Button
                                icon={<ReloadOutlined />}
                                onClick={onReset}
                                className="h-9 text-sm flex items-center justify-center px-4 w-auto"
                            />
                        )}

                        {showAddButton && (
                            <div className="flex items-center gap-2">
                                {React.isValidElement(addLabel) ? (
                                    addLabel
                                ) : (
                                    <Button
                                        type="primary"
                                        icon={<PlusOutlined />}
                                        onClick={onAddClick}
                                        className="h-9 text-sm flex items-center justify-center px-4 w-auto sm:ml-0"
                                    >
                                        {addLabel}
                                    </Button>
                                )}
                            </div>
                        )}

                    </div>
                </div>
            </div>
        </div>
    );
};

export default SearchFilter;
