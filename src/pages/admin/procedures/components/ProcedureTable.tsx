import { useEffect, useRef, useState } from "react";
import { Space, Tag, Popconfirm, Tooltip } from "antd";
import { EyeOutlined, EditOutlined, DeleteOutlined, FileTextOutlined } from "@ant-design/icons";
import type { ProColumns, ActionType } from "@ant-design/pro-components";
import queryString from "query-string";
import dayjs from "dayjs";

import DataTable from "@/components/common/data-table";
import SearchFilter from "@/components/common/filter/SearchFilter";
import AdvancedFilterSelect from "@/components/common/filter/AdvancedFilterSelect";
import DateRangeFilter from "@/components/common/filter/DateRangeFilter";

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
    const [companyFilter, setCompanyFilter] = useState<string | null>(null);
    const [departmentFilter, setDepartmentFilter] = useState<string | null>(null);
    const [sectionFilter, setSectionFilter] = useState<string | null>(null);
    const [planYearFilter, setPlanYearFilter] = useState<number | null>(null);
    const [cachedDepartmentId, setCachedDepartmentId] = useState<number | null>(null);
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
        company: string | null,
        department: string | null,
        section: string | null,
        planYear: number | null,
    ) => {
        const parts: string[] = [];
        if (companyId) parts.push(`department.company.id:${companyId}`);
        if (departmentId) parts.push(`department.id:${departmentId}`);
        if (search) parts.push(`procedureName~'${search}'`);
        if (status) parts.push(`status='${status}'`);
        if (createdAt) parts.push(createdAt);
        if (company) parts.push(`department.company.name~'${company}'`);
        if (department) parts.push(`department.name~'${department}'`);
        if (section) parts.push(`section.name~'${section}'`);
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
            companyFilter, departmentFilter, sectionFilter, planYearFilter
        );
        if (filters.length > 0) q.filter = filters.join(" and ");
        setQuery(queryString.stringify(q, { encode: false }));
    }, [
        searchValue, statusFilter, createdAtFilter,
        companyFilter, departmentFilter, sectionFilter, planYearFilter,
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
            companyFilter, departmentFilter, sectionFilter, planYearFilter
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
        setCompanyFilter(null);
        setDepartmentFilter(null);
        setSectionFilter(null);
        setPlanYearFilter(null);
        setCachedDepartmentId(null);
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
            render: (_, record) =>
                record.fileUrls && record.fileUrls.length > 0 ? (
                    <a
                        href={`/api/v1/files?fileName=${encodeURIComponent(record.fileUrls[0])}&folder=procedures`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: "#1677ff", fontWeight: 500 }}
                    >
                        <FileTextOutlined style={{ marginRight: 6 }} />
                        {record.procedureName}
                    </a>
                ) : (
                    <span>{record.procedureName}</span>
                ),
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
            dataIndex: "createdAt",
            align: "center",
            width: 120,
            render: (_, record) =>
                record.createdAt
                    ? dayjs(record.createdAt).format("DD-MM-YYYY")
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

                    {/* 🔁 TẠO PHIÊN BẢN MỚI — dùng Tag thay icon */}
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
    const filterFields: any[] = [
        ...(!companyId && !departmentId ? [{
            key: "company",
            label: "Công ty",
            type: "async-select",
            loadOptions: async () => {
                const res = await callFetchCompany("page=1&size=500");
                const list: ICompany[] = (res?.data as any)?.result ?? [];
                return list.map((c) => ({ label: c.name, value: c.name }));
            },
        }] : []),
        ...(!departmentId ? [{
            key: "department",
            label: "Phòng ban",
            type: "async-select",
            ...(companyId ? {
                loadOptions: async () => {
                    const res = await callFetchDepartmentsByCompany(companyId);
                    const list: IDepartment[] = (res?.data as any) ?? [];
                    return list.map((d) => ({ label: d.name, value: d.name }));
                },
            } : {
                dependsOn: "company",
                loadOptionsWithDep: async (companyName: string) => {
                    const res = await callFetchCompany("page=1&size=500");
                    const list: ICompany[] = (res?.data as any)?.result ?? [];
                    const company = list.find((c) => c.name === companyName);
                    if (!company?.id) return [];
                    const dRes = await callFetchDepartmentsByCompany(company.id);
                    const dList: IDepartment[] = (dRes?.data as any) ?? [];
                    return dList.map((d) => ({ label: d.name, value: d.name }));
                },
            }),
        }] : []),
        {
            key: "section",
            label: "Bộ phận",
            type: "async-select",
            dependsOn: "department",
            loadOptionsWithDep: async (_: string) => {
                const id = cachedDepartmentId ?? departmentId;
                if (!id) return [];
                const res = await callFetchSectionsByDepartment(id);
                const list: ISection[] = (res?.data as any) ?? [];
                return list.map((s) => ({ label: s.name, value: s.name }));
            },
        },
        {
            key: "planYear",
            label: "Năm KH",
            type: "number",
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
                        onChange={async (filters) => {
                            setCompanyFilter(filters.company || null);
                            setDepartmentFilter(filters.department || null);
                            setSectionFilter(filters.section || null);
                            setPlanYearFilter(filters.planYear || null);
                            setStatusFilter(filters.status || null);

                            if (filters.department) {
                                if (companyId) {
                                    const dRes = await callFetchDepartmentsByCompany(companyId);
                                    const dList: IDepartment[] = (dRes?.data as any) ?? [];
                                    const found = dList.find((d) => d.name === filters.department);
                                    setCachedDepartmentId(found?.id ?? null);
                                } else if (filters.company) {
                                    const res = await callFetchCompany("page=1&size=500");
                                    const list: ICompany[] = (res?.data as any)?.result ?? [];
                                    const company = list.find((c) => c.name === filters.company);
                                    if (company?.id) {
                                        const dRes = await callFetchDepartmentsByCompany(company.id);
                                        const dList: IDepartment[] = (dRes?.data as any) ?? [];
                                        const found = dList.find((d) => d.name === filters.department);
                                        setCachedDepartmentId(found?.id ?? null);
                                    }
                                }
                            } else {
                                setCachedDepartmentId(null);
                            }
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