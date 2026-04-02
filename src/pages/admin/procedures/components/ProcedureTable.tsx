import { useEffect, useRef, useState } from "react";
import { Space, Tag } from "antd";
import { EyeOutlined, EditOutlined, DeleteOutlined, FileTextOutlined, RetweetOutlined } from "@ant-design/icons";
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

import type { IProcedure, ProcedureType, ICompany, IDepartment, ISection } from "@/types/backend";
import { PAGINATION_CONFIG } from "@/config/pagination";

const statusMap: Record<string, { label: string; color: string }> = {
    NEED_CREATE: { label: "Cần xây dựng mới", color: "orange" },
    IN_PROGRESS: { label: "Đang hiệu lực", color: "green" },
    NEED_UPDATE: { label: "Đang cập nhật", color: "gold" },
    TERMINATED: { label: "Hết hiệu lực", color: "red" },
};
interface IProps {
    type: ProcedureType;
}

const ProcedureTable = ({ type }: IProps) => {
    const tableRef = useRef<ActionType>(null);

    const [openModal, setOpenModal] = useState(false);
    const [openView, setOpenView] = useState(false);
    const [openRevise, setOpenRevise] = useState(false);
    const [dataInit, setDataInit] = useState<IProcedure | null>(null);

    const [statusFilter, setStatusFilter] = useState<string | null>(null);
    const [createdAtFilter, setCreatedAtFilter] = useState<string | null>(null);
    const [searchValue, setSearchValue] = useState("");

    // ← filter mới
    const [companyFilter, setCompanyFilter] = useState<string | null>(null);
    const [departmentFilter, setDepartmentFilter] = useState<string | null>(null);
    const [sectionFilter, setSectionFilter] = useState<string | null>(null);
    const [planYearFilter, setPlanYearFilter] = useState<number | null>(null);

    // ← cache departmentId để load bộ phận
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

    useEffect(() => {
        const q: any = {
            page: PAGINATION_CONFIG.DEFAULT_PAGE,
            size: PAGINATION_CONFIG.DEFAULT_PAGE_SIZE,
            sort: "createdAt,desc",
        };
        const filters: string[] = [];
        if (searchValue) filters.push(`procedureName~'${searchValue}'`);
        if (statusFilter) filters.push(`status='${statusFilter}'`);
        if (createdAtFilter) filters.push(createdAtFilter);
        if (companyFilter) filters.push(`department.company.name~'${companyFilter}'`);
        if (departmentFilter) filters.push(`department.name~'${departmentFilter}'`);
        if (sectionFilter) filters.push(`section.name~'${sectionFilter}'`);
        if (planYearFilter) filters.push(`planYear=${planYearFilter}`);
        if (filters.length > 0) q.filter = filters.join(" and ");
        setQuery(queryString.stringify(q, { encode: false }));
    }, [searchValue, statusFilter, createdAtFilter, companyFilter, departmentFilter, sectionFilter, planYearFilter, type]);

    const buildQuery = (params: any, sort: any) => {
        const q: any = {
            page: params.current,
            size: params.pageSize || PAGINATION_CONFIG.DEFAULT_PAGE_SIZE,
        };
        const filters: string[] = [];
        if (searchValue) filters.push(`procedureName~'${searchValue}'`);
        if (statusFilter) filters.push(`status='${statusFilter}'`);
        if (createdAtFilter) filters.push(createdAtFilter);
        if (companyFilter) filters.push(`department.company.name~'${companyFilter}'`);
        if (departmentFilter) filters.push(`department.name~'${departmentFilter}'`);
        if (sectionFilter) filters.push(`section.name~'${sectionFilter}'`);
        if (planYearFilter) filters.push(`planYear=${planYearFilter}`);
        if (filters.length > 0) q.filter = filters.join(" and ");
        let temp = queryString.stringify(q, { encode: false });
        let sortBy = "sort=createdAt,desc";
        if (sort?.procedureName)
            sortBy = sort.procedureName === "ascend"
                ? "sort=procedureName,asc"
                : "sort=procedureName,desc";
        return `${temp}&${sortBy}`;
    };

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
            render: (code) => <Tag color="blue">{code}</Tag>,
        },
        {
            title: "Công ty",
            dataIndex: "companyName",
            align: "center",

            width: 180,
        },
        {
            title: "Phòng ban",
            dataIndex: "departmentName",
            width: 180,
            align: "center",
            render: (name) => (
                <Tag color="cyan">
                    {name || "--"}
                </Tag>
            ),
        },
        {
            title: "Bộ phận",
            dataIndex: "sectionName",
            align: "center",
            width: 160,
            render: (v) => <Tag color="geekblue">{v || "--"}</Tag>,
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
            render: (val) => <Tag color="blue">v{val ?? 1}</Tag>,
        },
        {
            title: "Ngày ban hành",
            dataIndex: "createdAt",
            align: "center",
            width: 120,
            render: (val: unknown) =>
                typeof val === "string" && val
                    ? dayjs(val).format("DD-MM-YYYY")
                    : "--",
        },
        {
            title: "Hành động",
            align: "center",
            width: 160,
            render: (_, record) => (
                <Space>
                    <EyeOutlined
                        title="Xem chi tiết"
                        style={{ fontSize: 18, color: "#1677ff", cursor: "pointer" }}
                        onClick={() => { setDataInit(record); setOpenView(true); }}
                    />
                    <EditOutlined
                        title="Chỉnh sửa"
                        style={{ fontSize: 18, color: "#fa8c16", cursor: "pointer" }}
                        onClick={() => { setDataInit(record); setOpenModal(true); }}
                    />
                    <RetweetOutlined
                        title={`Cập nhật phiên bản v${(record.version ?? 1) + 1}`}
                        style={{ fontSize: 18, color: "#52c41a", cursor: "pointer" }}
                        onClick={() => { setDataInit(record); setOpenRevise(true); }}
                    />
                    <DeleteOutlined
                        title="Xóa"
                        style={{ fontSize: 18, color: "red", cursor: "pointer" }}
                        onClick={() => deleteMutation.mutateAsync(record.id!)}
                    />
                </Space>
            ),
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
                    onReset={() => {
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
                    }}
                    onAddClick={() => {
                        setDataInit(null);
                        setOpenModal(true);
                    }}
                />
                <div className="flex flex-wrap gap-3 items-center">
                    <AdvancedFilterSelect
                        resetSignal={resetSignal}
                        fields={[
                            {
                                key: "company",
                                label: "Công ty",
                                type: "async-select",
                                loadOptions: async () => {
                                    const res = await callFetchCompany("page=1&size=500");
                                    const paginate = res?.data as any;
                                    const list: ICompany[] = paginate?.result ?? [];
                                    return list.map((c) => ({ label: c.name, value: c.name }));
                                },
                            },
                            {
                                key: "department",
                                label: "Phòng ban",
                                type: "async-select",
                                dependsOn: "company",
                                loadOptionsWithDep: async (companyCode: string) => {
                                    const res = await callFetchCompany("page=1&size=500");
                                    const paginate = res?.data as any;
                                    const list: ICompany[] = paginate?.result ?? [];
                                    const company = list.find((c) => c.name === companyCode);
                                    if (!company?.id) return [];
                                    const dRes = await callFetchDepartmentsByCompany(company.id);
                                    const dList: IDepartment[] = (dRes?.data as any) ?? [];
                                    return dList.map((d) => ({ label: d.name, value: d.name }));
                                },
                            },
                            {
                                key: "section",
                                label: "Bộ phận",
                                type: "async-select",
                                dependsOn: "department",
                                loadOptionsWithDep: async (_departmentName: string) => {
                                    if (!cachedDepartmentId) return [];
                                    const res = await callFetchSectionsByDepartment(cachedDepartmentId);
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
                            }
                        ]}
                        onChange={async (filters) => {
                            setCompanyFilter(filters.company || null);
                            setDepartmentFilter(filters.department || null);
                            setSectionFilter(filters.section || null);
                            setPlanYearFilter(filters.planYear || null);
                            setStatusFilter(filters.status || null);

                            // ← cache departmentId khi chọn phòng ban
                            if (filters.department && filters.company) {
                                const res = await callFetchCompany("page=1&size=500");
                                const paginate = res?.data as any;
                                const list: ICompany[] = paginate?.result ?? [];
                                const company = list.find((c) => c.name === filters.company); if (company?.id) {
                                    const dRes = await callFetchDepartmentsByCompany(company.id);
                                    const dList: IDepartment[] = (dRes?.data as any) ?? [];
                                    const found = dList.find((d) => d.name === filters.department);
                                    setCachedDepartmentId(found?.id ?? null);
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