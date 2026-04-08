import { useEffect, useRef, useState } from "react";
import { Space, Tag, Popconfirm, Tooltip } from "antd";
import { EyeOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";
import type { ProColumns, ActionType } from "@ant-design/pro-components";
import queryString from "query-string";
import dayjs from "dayjs";

import DataTable from "@/components/common/data-table";
import SearchFilter from "@/components/common/filter/SearchFilter";
import AdvancedFilterSelect from "@/components/common/filter/AdvancedFilterSelect";
import DateRangeFilter from "@/components/common/filter/DateRangeFilter";
import type { FilterField } from "@/components/common/filter/AdvancedFilterSelect";

import ModalProcedure from "../modal.procedure";
import ModalRevise from "../components/modal.revise";
import ViewProcedure from "../view.procedure";

import {
    useProceduresQuery,
    useDeleteProcedureMutation,
} from "@/hooks/useProcedure";

import {
    callFetchCompany,
    callFetchDepartmentsByCompany,
    callFetchSectionsByDepartment,
} from "@/config/api";
import Access from "@/components/share/access";
import type { IProcedure, ProcedureType, ICompany, IDepartment, ISection } from "@/types/backend";
import { PAGINATION_CONFIG } from "@/config/pagination";
import { ALL_PERMISSIONS } from "@/config/permissions";

const statusMap: Record<string, { label: string; color: string }> = {
    NEED_CREATE: { label: "Cần xây dựng mới", color: "orange" },
    IN_PROGRESS: { label: "Đang hiệu lực", color: "green" },
    NEED_UPDATE: { label: "Đang cập nhật", color: "gold" },
    TERMINATED: { label: "Hết hiệu lực", color: "red" },
};

interface IProps {
    type: ProcedureType;
    companyId?: number;
    departmentId?: number;
}

const ProcedureTable = ({ type, companyId, departmentId }: IProps) => {
    const tableRef = useRef<ActionType>(null);

    const [openModal, setOpenModal] = useState(false);
    const [openView, setOpenView] = useState(false);
    const [openRevise, setOpenRevise] = useState(false);
    const [dataInit, setDataInit] = useState<IProcedure | null>(null);

    const [statusFilter, setStatusFilter] = useState<string | null>(null);
    const [createdAtFilter, setCreatedAtFilter] = useState<string | null>(null);
    const [searchValue, setSearchValue] = useState("");
    const [companyIdFilter, setCompanyIdFilter] = useState<number | null>(companyId ?? null);
    const [departmentIdFilter, setDepartmentIdFilter] = useState<number | null>(departmentId ?? null);
    const [sectionIdFilter, setSectionIdFilter] = useState<number | null>(null);
    const [planYearFilter, setPlanYearFilter] = useState<number | null>(null);
    const [resetSignal, setResetSignal] = useState(0);

    const [query, setQuery] = useState(
        `page=${PAGINATION_CONFIG.DEFAULT_PAGE}&size=${PAGINATION_CONFIG.DEFAULT_PAGE_SIZE}&sort=createdAt,desc`
    );

    const { data, isFetching, refetch } = useProceduresQuery(type, query);
    const deleteMutation = useDeleteProcedureMutation(type);

    const meta = data?.meta ?? {
        page: PAGINATION_CONFIG.DEFAULT_PAGE,
        pageSize: PAGINATION_CONFIG.DEFAULT_PAGE_SIZE,
        total: 0,
    };
    const procedures = data?.result ?? [];

    // ===================== BUILD FILTERS =====================
    // Dùng ID thay vì name để filter chính xác hơn
    const buildFilters = (
        search: string,
        status: string | null,
        createdAt: string | null,
        cmpId: number | null,
        deptId: number | null,
        sectId: number | null,
        planYear: number | null,
    ) => {
        const parts: string[] = [];

        // Props cố định (được truyền từ ngoài vào)
        if (companyId) parts.push(`department.company.id:${companyId}`);
        if (departmentId) parts.push(`department.id:${departmentId}`);

        // Bộ lọc người dùng chọn
        if (search) parts.push(`procedureName~'${search}'`);
        if (status) parts.push(`status='${status}'`);
        if (createdAt) parts.push(createdAt);

        // Chỉ filter theo company nếu không bị fix cứng từ props
        if (!companyId && cmpId) parts.push(`department.company.id:${cmpId}`);

        // Chỉ filter theo department nếu không bị fix cứng từ props
        if (!departmentId && deptId) parts.push(`department.id:${deptId}`);

        if (sectId) parts.push(`section.id:${sectId}`);
        if (planYear) parts.push(`planYear=${planYear}`);

        return parts;
    };

    // ===================== AUTO BUILD QUERY =====================
    useEffect(() => {
        const q: any = {
            page: PAGINATION_CONFIG.DEFAULT_PAGE,
            size: PAGINATION_CONFIG.DEFAULT_PAGE_SIZE,
            sort: "createdAt,desc",
        };
        const filters = buildFilters(
            searchValue, statusFilter, createdAtFilter,
            companyIdFilter, departmentIdFilter, sectionIdFilter, planYearFilter
        );
        if (filters.length > 0) q.filter = filters.join(" and ");
        setQuery(queryString.stringify(q, { encode: false }));
    }, [
        searchValue, statusFilter, createdAtFilter,
        companyIdFilter, departmentIdFilter, sectionIdFilter, planYearFilter,
        type, companyId, departmentId,
    ]);

    // ===================== BUILD QUERY FOR TABLE =====================
    const buildQuery = (params: any, sort: any) => {
        const q: any = {
            page: params.current,
            size: params.pageSize || PAGINATION_CONFIG.DEFAULT_PAGE_SIZE,
        };
        const filters = buildFilters(
            searchValue, statusFilter, createdAtFilter,
            companyIdFilter, departmentIdFilter, sectionIdFilter, planYearFilter
        );
        if (filters.length > 0) q.filter = filters.join(" and ");

        let sortBy = "sort=createdAt,desc";
        if (sort?.procedureName)
            sortBy = sort.procedureName === "ascend"
                ? "sort=procedureName,asc"
                : "sort=procedureName,desc";

        return `${queryString.stringify(q, { encode: false })}&${sortBy}`;
    };

    // ===================== RESET =====================
    const handleReset = () => {
        setSearchValue("");
        setStatusFilter(null);
        setCreatedAtFilter(null);
        setCompanyIdFilter(companyId ?? null);
        setDepartmentIdFilter(departmentId ?? null);
        setSectionIdFilter(null);
        setPlanYearFilter(null);
        setResetSignal((s) => s + 1);
        refetch();
    };

    // ===================== PERMISSION =====================
    const permission = {
        view: type === "COMPANY" ? ALL_PERMISSIONS.PROCEDURE_COMPANY.GET_BY_ID
            : type === "DEPARTMENT" ? ALL_PERMISSIONS.PROCEDURE_DEPARTMENT.GET_BY_ID
                : ALL_PERMISSIONS.PROCEDURE_CONFIDENTIAL.GET_BY_ID,
        update: type === "COMPANY" ? ALL_PERMISSIONS.PROCEDURE_COMPANY.UPDATE
            : type === "DEPARTMENT" ? ALL_PERMISSIONS.PROCEDURE_DEPARTMENT.UPDATE
                : ALL_PERMISSIONS.PROCEDURE_CONFIDENTIAL.UPDATE,
        revise: type === "COMPANY" ? ALL_PERMISSIONS.PROCEDURE_COMPANY.REVISE
            : type === "DEPARTMENT" ? ALL_PERMISSIONS.PROCEDURE_DEPARTMENT.REVISE
                : ALL_PERMISSIONS.PROCEDURE_CONFIDENTIAL.REVISE,
        delete: type === "COMPANY" ? ALL_PERMISSIONS.PROCEDURE_COMPANY.DELETE
            : type === "DEPARTMENT" ? ALL_PERMISSIONS.PROCEDURE_DEPARTMENT.DELETE
                : ALL_PERMISSIONS.PROCEDURE_CONFIDENTIAL.DELETE,
        create: type === "COMPANY" ? ALL_PERMISSIONS.PROCEDURE_COMPANY.CREATE
            : type === "DEPARTMENT" ? ALL_PERMISSIONS.PROCEDURE_DEPARTMENT.CREATE
                : ALL_PERMISSIONS.PROCEDURE_CONFIDENTIAL.CREATE,
    };

    // ===================== COLUMNS =====================
    const columns: ProColumns<IProcedure>[] = [
        {
            title: "STT",
            width: 60,
            align: "center",
            render: (_, __, index) =>
                index + 1 + ((meta.page || 1) - 1) * (meta.pageSize || 10),
        },
        {
            title: "Mã quy trình",
            dataIndex: "procedureCode",
            align: "center",
            width: 130,
            render: (_, record) => (
                <Tag color="purple">{record.procedureCode ?? "--"}</Tag>
            ),
        },
        {
            title: "Mã công ty",
            dataIndex: "companyCode",
            align: "center",
            width: 120,
            hideInTable: !!companyId || !!departmentId,
            render: (_, record) => <Tag color="blue">{record.companyCode}</Tag>,
        },
        {
            title: "Công ty",
            dataIndex: "companyName",
            align: "center",
            width: 180,
            hideInTable: !!companyId || !!departmentId,
        },
        {
            title: "Phòng ban",
            dataIndex: "departmentName",
            width: 180,
            align: "center",
            hideInTable: !!departmentId,
            render: (_, record) => (
                <Tag color="cyan">{record.departmentName || "--"}</Tag>
            ),
        },
        {
            title: "Bộ phận",
            dataIndex: "sectionName",
            align: "center",
            width: 160,
            render: (_, record) => (
                <Tag color="geekblue">{record.sectionName || "--"}</Tag>
            ),
        },
        {
            title: "Tên quy trình",
            dataIndex: "procedureName",
            sorter: true,
            render: (_, record) => <span>{record.procedureName}</span>,
        },
        {
            title: "Trạng thái",
            dataIndex: "status",
            align: "center",
            render: (_, record) => {
                const s = statusMap[record.status ?? ""] ?? {
                    label: record.status,
                    color: "default",
                };
                return <Tag color={s.color}>{s.label}</Tag>;
            },
        },
        {
            title: "Năm KH",
            dataIndex: "planYear",
            align: "center",
            width: 100,
        },
        {
            title: "Version",
            dataIndex: "version",
            align: "center",
            width: 80,
            render: (_, record) => <Tag color="blue">v{record.version ?? 1}</Tag>,
        },
        {
            title: "Ngày ban hành",
            dataIndex: "issuedDate",
            align: "center",
            width: 120,
            render: (_, record) =>
                record.issuedDate
                    ? dayjs(record.issuedDate).format("DD-MM-YYYY")
                    : "--",
        },
        {
            title: "Hành động",
            align: "center",
            width: 200,
            render: (_, record) => (
                <Space size="small">
                    {/* 👁️ XEM */}
                    <Access permission={permission.view} hideChildren>
                        <Tooltip title="Xem chi tiết">
                            <EyeOutlined
                                style={{ fontSize: 18, color: "#1677ff", cursor: "pointer" }}
                                onClick={() => { setDataInit(record); setOpenView(true); }}
                            />
                        </Tooltip>
                    </Access>

                    {/* ✏️ SỬA */}
                    <Access permission={permission.update} hideChildren>
                        <Tooltip title="Chỉnh sửa">
                            <EditOutlined
                                style={{ fontSize: 18, color: "#fa8c16", cursor: "pointer" }}
                                onClick={() => { setDataInit(record); setOpenModal(true); }}
                            />
                        </Tooltip>
                    </Access>

                    {/* 🔁 TẠO PHIÊN BẢN MỚI */}
                    <Access permission={permission.revise} hideChildren>
                        <Tooltip title={`Tạo phiên bản v${(record.version ?? 1) + 1}`}>
                            <Tag
                                color="green"
                                style={{
                                    cursor: "pointer",
                                    borderRadius: 6,
                                    padding: "2px 8px",
                                    fontWeight: 500,
                                    margin: 0,
                                }}
                                onClick={() => { setDataInit(record); setOpenRevise(true); }}
                            >
                                v{(record.version ?? 1) + 1}
                            </Tag>
                        </Tooltip>
                    </Access>

                    {/* 🗑️ XOÁ */}
                    <Access permission={permission.delete} hideChildren>
                        <Popconfirm
                            title="Xác nhận xoá quy trình này?"
                            onConfirm={() => deleteMutation.mutateAsync(record.id!)}
                            okText="Xoá"
                            cancelText="Huỷ"
                            placement="topRight"
                        >
                            <Tooltip title="Xóa">
                                <DeleteOutlined
                                    style={{ fontSize: 18, color: "red", cursor: "pointer" }}
                                />
                            </Tooltip>
                        </Popconfirm>
                    </Access>
                </Space>
            ),
        },
    ];

    // ===================== FILTER FIELDS =====================
    // Đúng với FilterField interface: chỉ dùng options | asyncOptions | dependsOn
    // Value luôn là ID (number) để filter chính xác, label hiển thị tên
    const filterFields: FilterField[] = [

        // --- CÔNG TY: chỉ hiện khi không bị fix cứng từ props ---
        ...(!companyId && !departmentId ? [{
            key: "companyId",
            label: "Công ty",
            asyncOptions: async () => {
                const res = await callFetchCompany("page=1&size=500&sort=name,asc");
                const list: ICompany[] = (res?.data as any)?.result ?? [];
                return list.map((c) => ({
                    label: c.name,
                    value: c.id,          // value = ID
                    color: "blue",
                }));
            },
        }] as FilterField[] : []),

        // --- PHÒNG BAN: chỉ hiện khi không bị fix cứng từ props ---
        ...(!departmentId ? [{
            key: "departmentId",
            label: "Phòng ban",
            // Nếu đã có companyId từ props → fetch thẳng, không cần dependsOn
            // Nếu không → phụ thuộc vào companyId người dùng chọn
            ...(companyId
                ? {
                    asyncOptions: async () => {
                        const res = await callFetchDepartmentsByCompany(companyId);
                        const list: IDepartment[] = (res?.data as any) ?? [];
                        return list.map((d) => ({
                            label: d.name,
                            value: d.id,
                            color: "cyan",
                        }));
                    },
                }
                : {
                    dependsOn: "companyId",
                    asyncOptions: async (parentCompanyId: number) => {
                        if (!parentCompanyId) return [];
                        const res = await callFetchDepartmentsByCompany(parentCompanyId);
                        const list: IDepartment[] = (res?.data as any) ?? [];
                        return list.map((d) => ({
                            label: d.name,
                            value: d.id,
                            color: "cyan",
                        }));
                    },
                }),
        }] as FilterField[] : []),

        // --- BỘ PHẬN: phụ thuộc vào departmentId ---
        // Nếu departmentId fix cứng từ props → dùng đó để fetch
        // Nếu không → phụ thuộc vào departmentId người dùng chọn
        {
            key: "sectionId",
            label: "Bộ phận",
            ...(departmentId
                ? {
                    // departmentId cố định từ props → fetch thẳng không cần dependsOn
                    asyncOptions: async () => {
                        const res = await callFetchSectionsByDepartment(departmentId);
                        const list: ISection[] = (res?.data as any) ?? [];
                        return list.map((s) => ({
                            label: s.name,
                            value: s.id,
                            color: "geekblue",
                        }));
                    },
                }
                : {
                    dependsOn: "departmentId",
                    asyncOptions: async (parentDeptId: number) => {
                        if (!parentDeptId) return [];
                        const res = await callFetchSectionsByDepartment(parentDeptId);
                        const list: ISection[] = (res?.data as any) ?? [];
                        return list.map((s) => ({
                            label: s.name,
                            value: s.id,
                            color: "geekblue",
                        }));
                    },
                }),
        },

        // --- TRẠNG THÁI ---
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

        // --- NĂM KẾ HOẠCH ---
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
        <>
            <div className="flex flex-col gap-3 mb-4">
                <SearchFilter
                    searchPlaceholder="Tìm theo tên quy trình..."
                    addLabel="Thêm quy trình"
                    showFilterButton={false}
                    onSearch={setSearchValue}
                    onReset={handleReset}
                    onAddClick={() => {
                        setDataInit(null);
                        setOpenModal(true);
                    }}
                    addPermission={permission.create}
                />
                <div className="flex flex-wrap gap-3 items-center">
                    <AdvancedFilterSelect
                        resetSignal={resetSignal}
                        fields={filterFields}
                        onChange={(filters) => {
                            // Value đã là ID (number) nên map thẳng vào state
                            setCompanyIdFilter(filters.companyId ?? (companyId ?? null));
                            setDepartmentIdFilter(filters.departmentId ?? (departmentId ?? null));
                            setSectionIdFilter(filters.sectionId ?? null);
                            setStatusFilter(filters.status ?? null);
                            setPlanYearFilter(filters.planYear ?? null);
                        }}
                    />
                    <DateRangeFilter
                        fieldName="createdAt"
                        onChange={(filter) => setCreatedAtFilter(filter)}
                    />
                </div>
            </div>

            <DataTable<IProcedure>
                actionRef={tableRef}
                rowKey="id"
                loading={isFetching}
                columns={columns}
                dataSource={procedures}
                request={async (params, sort) => {
                    const q = buildQuery(params, sort);
                    setQuery(q);
                    return { data: procedures, success: true, total: meta.total };
                }}
                pagination={{
                    current: meta.page,
                    pageSize: meta.pageSize,
                    total: meta.total,
                    showQuickJumper: true,
                    showTotal: (total, range) => (
                        <div style={{ fontSize: 13 }}>
                            <span style={{ fontWeight: 500 }}>{range[0]}–{range[1]}</span>{" "}
                            trên{" "}
                            <span style={{ fontWeight: 600, color: "#1677ff" }}>
                                {total.toLocaleString()}
                            </span>{" "}
                            quy trình
                        </div>
                    ),
                }}
                rowSelection={false}
            />

            <ModalProcedure
                defaultType={type}
                open={openModal}
                onClose={() => setOpenModal(false)}
                dataInit={dataInit}
                refetch={refetch}
                {...(companyId ? { fixedCompanyId: companyId } : {})}
            />

            <ModalRevise
                type={type}
                open={openRevise}
                onClose={() => setOpenRevise(false)}
                dataInit={dataInit}
                refetch={refetch}
            />

            <ViewProcedure
                type={type}
                open={openView}
                onClose={() => setOpenView(false)}
                dataInit={dataInit}
                refetch={refetch}
            />
        </>
    );
};

export default ProcedureTable;