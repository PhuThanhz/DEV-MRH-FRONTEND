import React, { useState, useRef, useCallback, useEffect } from "react";
import { Input, Button, Popover, Form, Badge } from "antd";
import {
    FilterOutlined,
    SearchOutlined,
    PlusOutlined,
    ReloadOutlined,
} from "@ant-design/icons";
import Access from "@/components/share/access";

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
    /** Dùng để tải trước dữ liệu của form khi người dùng có ý định thêm mới. */
    onAddPreload?: () => void;
    addLabel?: string | React.ReactNode;
    showAddButton?: boolean;
    showFilterButton?: boolean;
    showResetButton?: boolean;
    addPermission?: { method: string; apiPath: string; module: string };
    /** Số filter đang active (để hiện badge trên nút Bộ lọc) */
    activeFilterCount?: number;
    /** Debounce delay khi gõ tìm kiếm (ms). Mặc định 400ms */
    debounceMs?: number;
    guideSearchId?: string;
    guideAddId?: string;
    extraButtons?: React.ReactNode;
    searchValue?: string;
}

const BTN_H = 40;
const BTN_RADIUS = 10;

const SearchFilter: React.FC<SearchFilterProps> = ({
    searchPlaceholder = "Tìm kiếm...",
    filterFields = [],
    onSearch,
    onFilterApply,
    onReset,
    onAddClick,
    onAddPreload,
    addLabel = "Thêm mới",
    showAddButton = true,
    showFilterButton = true,
    showResetButton = false,
    addPermission,
    activeFilterCount = 0,
    debounceMs = 400,
    guideSearchId,
    guideAddId,
    extraButtons,
    searchValue: externalSearchValue = "",
}) => {
    const [open, setOpen] = useState(false);
    const [form] = Form.useForm();
    const [searchValue, setSearchValue] = useState(externalSearchValue);
    const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Sync external value changes
    useEffect(() => {
        setSearchValue(externalSearchValue);
    }, [externalSearchValue]);

    // Cleanup timer on unmount
    useEffect(() => {
        return () => {
            if (debounceTimer.current) clearTimeout(debounceTimer.current);
        };
    }, []);

    // ── Auto-search với debounce ──────────────────────────────────────────
    const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setSearchValue(value);
        if (debounceTimer.current) clearTimeout(debounceTimer.current);
        debounceTimer.current = setTimeout(() => {
            onSearch?.(value);
        }, debounceMs);
    }, [onSearch, debounceMs]);

    const handleSearchClear = useCallback(() => {
        setSearchValue("");
        if (debounceTimer.current) clearTimeout(debounceTimer.current);
        onSearch?.("");
    }, [onSearch]);

    // ── Filter popover ────────────────────────────────────────────────────
    const handleApply = () => {
        const values = form.getFieldsValue();
        onFilterApply?.(values);
        setOpen(false);
    };

    const filterPopoverContent = (
        <div style={{ width: 256 }}>
            <Form layout="vertical" form={form}>
                {filterFields.map((f) => (
                    <Form.Item
                        key={f.name}
                        label={f.label}
                        name={f.name}
                        style={{ marginBottom: 12 }}
                    >
                        <Input placeholder={f.placeholder || `Nhập ${f.label.toLowerCase()}...`} />
                    </Form.Item>
                ))}
                <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                    <Button onClick={onReset} style={{ flex: 1 }}>Đặt lại</Button>
                    <Button type="primary" onClick={handleApply} style={{ flex: 1 }}>Áp dụng</Button>
                </div>
            </Form>
        </div>
    );

    // ── Add button ────────────────────────────────────────────────────────
    const AddBtn = React.isValidElement(addLabel) ? addLabel : (
        <Button
            data-guide-id={guideAddId}
            icon={<PlusOutlined />}
            onClick={onAddClick}
            style={{
                height: BTN_H,
                borderRadius: BTN_RADIUS,
                backgroundColor: "#ff5fa2",
                color: "#fff",
                border: "none",
                fontWeight: 600,
                fontSize: 14,
                boxShadow: "0 2px 8px rgba(255, 95, 162, 0.35)",
                paddingInline: 18,
                display: "flex",
                alignItems: "center",
                gap: 6,
                whiteSpace: "nowrap",
                flexShrink: 0,
                transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => {
                onAddPreload?.();
                e.currentTarget.style.backgroundColor = "#ff4b97";
                e.currentTarget.style.boxShadow = "0 4px 14px rgba(255, 95, 162, 0.5)";
                e.currentTarget.style.transform = "translateY(-1px)";
            }}
            onFocus={onAddPreload}
            onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "#ff5fa2";
                e.currentTarget.style.boxShadow = "0 2px 8px rgba(255, 95, 162, 0.35)";
                e.currentTarget.style.transform = "translateY(0)";
            }}
        >
            {addLabel}
        </Button>
    );

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 8, width: "100%" }}>

            {/* Row duy nhất: Search + Reset + Bộ lọc (với badge) + Thêm */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>

                {/* Search input — auto-search debounce */}
                <div
                    data-guide-id={guideSearchId}
                    style={{
                        flex: 1,
                        minWidth: 0,
                    }}
                >
                    <Input
                        placeholder={searchPlaceholder}
                        prefix={<SearchOutlined style={{ color: "#9ca3af" }} />}
                        value={searchValue}
                        onChange={handleSearchChange}
                        onPressEnter={() => {
                            if (debounceTimer.current) clearTimeout(debounceTimer.current);
                            onSearch?.(searchValue);
                        }}
                        onClear={handleSearchClear}
                        style={{
                            height: BTN_H,
                            borderRadius: BTN_RADIUS,
                            width: "100%",
                            fontSize: 14,
                        }}
                        allowClear
                    />
                </div>

                {/* Reset — ẩn mặc định */}
                {showResetButton && (
                    <Button
                        icon={<ReloadOutlined />}
                        onClick={onReset}
                        style={{
                            height: BTN_H,
                            borderRadius: BTN_RADIUS,
                            fontSize: 13,
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                            paddingInline: 14,
                            flexShrink: 0,
                        }}
                    >
                        Đặt lại
                    </Button>
                )}

                {/* Bộ lọc với badge đếm filter đang active */}
                {showFilterButton && (
                    <Popover
                        open={open}
                        onOpenChange={setOpen}
                        trigger="click"
                        placement="bottomRight"
                        content={filterPopoverContent}
                    >
                        <Badge count={activeFilterCount} size="small" offset={[-2, 2]}>
                            <Button
                                icon={<FilterOutlined />}
                                style={{
                                    height: BTN_H,
                                    borderRadius: BTN_RADIUS,
                                    fontSize: 14,
                                    display: "flex",
                                    alignItems: "center",
                                    paddingInline: 14,
                                    flexShrink: 0,
                                    ...(activeFilterCount > 0 ? {
                                        borderColor: "#ec4899",
                                        color: "#ec4899",
                                        background: "#fff0f6",
                                    } : {}),
                                }}
                            >
                                Bộ lọc
                            </Button>
                        </Badge>
                    </Popover>
                )}

                {/* Nút bổ sung */}
                {extraButtons}

                {/* Nút thêm mới */}
                {showAddButton && (
                    addPermission
                        ? <Access permission={addPermission} hideChildren>{AddBtn}</Access>
                        : AddBtn
                )}
            </div>
        </div>
    );
};

export default SearchFilter;
