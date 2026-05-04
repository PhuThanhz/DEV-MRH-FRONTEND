import { Button, Flex, Tooltip } from "antd";
import { PrinterOutlined, CloseOutlined } from "@ant-design/icons";

import SearchFilter from "@/components/common/filter/SearchFilter";
import AdvancedFilterSelect from "@/components/common/filter/AdvancedFilterSelect";
import DateRangeFilter from "@/components/common/filter/DateRangeFilter";
import type { FilterField } from "@/components/common/filter/AdvancedFilterSelect";
import {
    callFetchCompany,
    callFetchDepartmentsByCompany,
    callFetchSectionsByDepartment,
} from "@/config/api";
import type { ICompany, IDepartment, ISection, ProcedureType } from "@/types/backend";

interface ProcedureToolbarProps {
    type: ProcedureType;
    companyId?: number;
    departmentId?: number;
    printMode: boolean;
    selectedCount: number;
    resetSignal: number;
    permission: Record<string, any>;
    onSearch: (value: string) => void;
    onReset: () => void;
    onAddClick: () => void;
    onPrintClick: () => void;
    onExitPrintMode: () => void;
    onFilterChange: (filters: Record<string, any>) => void;
    onDateRangeChange: (filter: string | null) => void;
}

const ProcedureToolbar = ({
    type,
    companyId,
    departmentId,
    printMode,
    selectedCount,
    resetSignal,
    permission,
    onSearch,
    onReset,
    onAddClick,
    onPrintClick,
    onExitPrintMode,
    onFilterChange,
    onDateRangeChange,
}: ProcedureToolbarProps) => {
    const filterFields: FilterField[] = [
        ...(!companyId && !departmentId ? [{
            key: "companyId",
            label: "Công ty",
            asyncOptions: async () => {
                const res = await callFetchCompany("page=1&size=500&sort=name,asc");
                const list: ICompany[] = (res?.data as any)?.result ?? [];
                return list.map((c) => ({ label: c.name, value: c.id, color: "blue" }));
            },
        }] as FilterField[] : []),

        ...(!departmentId ? [{
            key: "departmentId",
            label: "Phòng ban",
            ...(companyId
                ? {
                    asyncOptions: async () => {
                        const res = await callFetchDepartmentsByCompany(companyId);
                        const list: IDepartment[] = (res?.data as any) ?? [];
                        return list.map((d) => ({ label: d.name, value: d.id, color: "cyan" }));
                    },
                }
                : {
                    dependsOn: "companyId",
                    asyncOptions: async (parentCompanyId: number) => {
                        if (!parentCompanyId) return [];
                        const res = await callFetchDepartmentsByCompany(parentCompanyId);
                        const list: IDepartment[] = (res?.data as any) ?? [];
                        return list.map((d) => ({ label: d.name, value: d.id, color: "cyan" }));
                    },
                }),
        }] as FilterField[] : []),

        {
            key: "sectionId",
            label: "Bộ phận",
            ...(departmentId
                ? {
                    asyncOptions: async () => {
                        const res = await callFetchSectionsByDepartment(departmentId);
                        const list: ISection[] = (res?.data as any) ?? [];
                        return list.map((s) => ({ label: s.name, value: s.id, color: "geekblue" }));
                    },
                }
                : {
                    dependsOn: "departmentId",
                    asyncOptions: async (parentDeptId: number) => {
                        if (!parentDeptId) return [];
                        const res = await callFetchSectionsByDepartment(parentDeptId);
                        const list: ISection[] = (res?.data as any) ?? [];
                        return list.map((s) => ({ label: s.name, value: s.id, color: "geekblue" }));
                    },
                }),
        },

        {
            key: "status",
            label: "Trạng thái",
            options: [
                { label: "Cần xây dựng mới", value: "NEED_CREATE", color: "orange" },
                { label: "Đang hiệu lực", value: "IN_PROGRESS", color: "green" },
                { label: "Đang cập nhật", value: "NEED_UPDATE", color: "gold" },
                { label: "Hết hiệu lực", value: "TERMINATED", color: "red" },
            ],
        },

        {
            key: "planYear",
            label: "Năm KH",
            options: Array.from({ length: 10 }, (_, i) => {
                const year = new Date().getFullYear() - 2 + i;
                return { label: String(year), value: year, color: "purple" };
            }),
        },
    ];

    return (
        <div className="flex flex-col gap-3 mb-4">
            {/* Row 1: Search + Print buttons */}
            <Flex align="center" gap={8}>
                <div style={{ flex: 1 }}>
                    <SearchFilter
                        searchPlaceholder="Tìm theo tên quy trình..."
                        addLabel="Thêm quy trình"
                        showFilterButton={false}
                        onSearch={onSearch}
                        onReset={onReset}
                        onAddClick={onAddClick}
                        addPermission={permission.create}
                    />
                </div>

                {/* Nút Huỷ — chỉ hiện khi đang ở printMode */}
                {printMode && (
                    <Button
                        icon={<CloseOutlined />}
                        onClick={onExitPrintMode}
                        style={{
                            height: 36, borderRadius: 8,
                            border: "1.5px solid #d1d5db",
                            color: "#6b7280", background: "white", fontWeight: 500,
                        }}
                    >
                        Huỷ
                    </Button>
                )}

                {/* Nút In QR */}
                <Tooltip
                    title={printMode && selectedCount === 0 ? "Chọn ít nhất 1 quy trình" : ""}
                    placement="bottom"
                >
                    <Button
                        icon={
                            <PrinterOutlined style={{
                                color: printMode && selectedCount > 0 ? "white" : "#e8256b",
                            }} />
                        }
                        onClick={onPrintClick}
                        onMouseDown={e => e.currentTarget.blur()}
                        style={{
                            height: 36, borderRadius: 8, fontWeight: 500, whiteSpace: "nowrap",
                            background: printMode && selectedCount > 0
                                ? "linear-gradient(135deg,#f0226e,#ff5fa0)"
                                : "white",
                            border: "1.5px solid #e8256b",
                            color: printMode && selectedCount > 0 ? "white" : "#e8256b",
                            opacity: printMode && selectedCount === 0 ? 0.55 : 1,
                            boxShadow: printMode && selectedCount > 0
                                ? "0 2px 8px rgba(240,34,110,0.25)"
                                : "none",
                            transition: "all 0.2s",
                        }}
                    >
                        {printMode && selectedCount > 0 ? `In QR (${selectedCount})` : "In QR"}
                    </Button>
                </Tooltip>
            </Flex>



            {/* Row 2: Filters */}
            <div className="flex flex-wrap gap-3 items-center">
                <AdvancedFilterSelect
                    resetSignal={resetSignal}
                    fields={filterFields}
                    onChange={(filters) => onFilterChange(filters)}
                />
                <DateRangeFilter
                    fieldName="createdAt"
                    onChange={onDateRangeChange}
                />
            </div>
        </div>
    );
};

export default ProcedureToolbar;