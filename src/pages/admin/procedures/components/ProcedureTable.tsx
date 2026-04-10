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
import { Dropdown, Grid } from "antd";
import { MoreOutlined } from "@ant-design/icons";
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

        if (companyId) parts.push(`department.company.id:${companyId}`);
        if (departmentId) parts.push(`department.id:${departmentId}`);

        if (search) parts.push(`procedureName~'${search}'`);
        if (status) parts.push(`status='${status}'`);
        if (createdAt) parts.push(createdAt);

        if (!companyId && cmpId) parts.push(`department.company.id:${cmpId}`);
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
            width: 55,
            align: "center",
            render: (_, __, index) =>
                index + 1 + ((meta.page || 1) - 1) * (meta.pageSize || 10),
        },
        {
            title: "Mã quy trình",
            dataIndex: "procedureCode",
            align: "center",
            width: 150,
            render: (_, record) => (
                <Tag color="purple">{record.procedureCode ?? "--"}</Tag>
            ),
        },
        {
            title: <span style={{ whiteSpace: "nowrap" }}>Mã công ty</span>,
            dataIndex: "companyCode",
            align: "center",
            width: 100,
            hideInTable: !!companyId || !!departmentId,
            render: (_, record) => <Tag color="blue">{record.companyCode}</Tag>,
        },
        {
            title: "Công ty",
            dataIndex: "companyName",
            width: 220,                     // ← bỏ align: "center"
            ellipsis: { showTitle: true },
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
            width: 150,
            hideInTable: type === "COMPANY",
            render: (_, record) => (
                <Tag color="geekblue">{record.sectionName || "--"}</Tag>
            ),
        },
        {
            title: "Tên quy trình",
            dataIndex: "procedureName",
            sorter: true,
            width: 250,                     // ← bỏ align: "center"
            ellipsis: { showTitle: true },
            render: (_, record) => (
                <Tooltip title={record.procedureName}>
                    <span>{record.procedureName}</span>
                </Tooltip>
            ),
        },
        {
            title: "Trạng thái",
            dataIndex: "status",
            align: "center",
            width: 140,
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
            width: 85,
        },
        {
            title: "Version",
            dataIndex: "version",
            align: "center",
            width: 80,
            hideInTable: type === "COMPANY",
            render: (_, record) => <Tag color="blue">v{record.version ?? 1}</Tag>,
        },
        {
            title: "Ngày ban hành",
            dataIndex: "issuedDate",
            align: "center",
            width: 130,
            render: (_, record) =>
                record.issuedDate
                    ? dayjs(record.issuedDate).format("DD-MM-YYYY")
                    : "--",
        },
        {
            title: "Hành động",
            align: "center",
            width: 100,
            fixed: "right",
            render: (_, record) => {

                const menuItems = [
                    {
                        key: "edit",
                        icon: <EditOutlined style={{ color: "#fa8c16" }} />,
                        label: (
                            <Access permission={permission.update} hideChildren>
                                <Tooltip title="Chỉnh sửa">
                                    <span
                                        onClick={() => {
                                            setDataInit(record);
                                            setOpenModal(true);
                                        }}
                                    >
                                        Chỉnh sửa
                                    </span>
                                </Tooltip>
                            </Access>
                        ),
                    },
                    {
                        key: "revise",
                        icon: (
                            <Tag
                                color="green"
                                style={{
                                    margin: 0,
                                    borderRadius: 6,
                                    padding: "0 6px",
                                    fontSize: 12,
                                }}
                            >
                                v{(record.version ?? 1) + 1}
                            </Tag>
                        ),
                        label: (
                            <Access permission={permission.revise} hideChildren>
                                <Tooltip title={`Tạo phiên bản v${(record.version ?? 1) + 1}`}>
                                    <span
                                        onClick={() => {
                                            setDataInit(record);
                                            setOpenRevise(true);
                                        }}
                                    >
                                        Tạo version v{(record.version ?? 1) + 1}
                                    </span>
                                </Tooltip>
                            </Access>
                        ),
                    },
                    {
                        key: "delete",
                        icon: <DeleteOutlined style={{ color: "red" }} />,
                        label: (
                            <Access permission={permission.delete} hideChildren>
                                <Popconfirm
                                    title="Xác nhận xoá quy trình này?"
                                    onConfirm={() => deleteMutation.mutateAsync(record.id!)}
                                    okText="Xoá"
                                    cancelText="Huỷ"
                                    placement="topRight"
                                >
                                    <Tooltip title="Xóa">
                                        <span style={{ color: "red" }}>Xóa</span>
                                    </Tooltip>
                                </Popconfirm>
                            </Access>
                        ),
                    },
                ];

                return (
                    <Space size="small">
                        <Access permission={permission.view} hideChildren>
                            <Tooltip title="Xem chi tiết">
                                <EyeOutlined
                                    style={{ fontSize: 18, color: "#1677ff", cursor: "pointer" }}
                                    onClick={() => {
                                        setDataInit(record);
                                        setOpenView(true);
                                    }}
                                />
                            </Tooltip>
                        </Access>

                        <Dropdown
                            menu={{ items: menuItems }}
                            trigger={["click"]}
                        >
                            <MoreOutlined style={{ fontSize: 20, cursor: "pointer" }} />
                        </Dropdown>
                    </Space>
                );
            }
        },
    ];

    // ===================== FILTER FIELDS =====================
    const filterFields: FilterField[] = [

        ...(!companyId && !departmentId ? [{
            key: "companyId",
            label: "Công ty",
            asyncOptions: async () => {
                const res = await callFetchCompany("page=1&size=500&sort=name,asc");
                const list: ICompany[] = (res?.data as any)?.result ?? [];
                return list.map((c) => ({
                    label: c.name,
                    value: c.id,
                    color: "blue",
                }));
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

        {
            key: "sectionId",
            label: "Bộ phận",
            ...(departmentId
                ? {
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
                scroll={{ x: 1400 }}
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