import { useEffect, useRef, useState } from "react";
import { Space, Tag } from "antd";
import { EyeOutlined, EditOutlined, DeleteOutlined, FileTextOutlined } from "@ant-design/icons";
import type { ProColumns, ActionType } from "@ant-design/pro-components";
import queryString from "query-string";
import dayjs from "dayjs";
import { useParams, useSearchParams } from "react-router-dom";

import PageContainer from "@/components/common/data-table/PageContainer";
import DataTable from "@/components/common/data-table";
import SearchFilter from "@/components/common/filter/SearchFilter";
import AdvancedFilterSelect from "@/components/common/filter/AdvancedFilterSelect";
import DateRangeFilter from "@/components/common/filter/DateRangeFilter";

import ModalProcedure from "@/pages/admin/procedures/modal.procedure";
import ViewProcedure from "@/pages/admin/procedures/view.procedure";

// ✅ Thay bằng
import {
    useCompanyProceduresWithFilterQuery,
    useDeleteProcedureMutation,
} from "@/hooks/useProcedure";

import type { IProcedure } from "@/types/backend";
import { PAGINATION_CONFIG } from "@/config/pagination";

const statusMap: Record<string, { label: string; color: string }> = {
    NEED_CREATE: { label: "Cần xây dựng mới", color: "orange" },
    IN_PROGRESS: { label: "Đang xây dựng", color: "blue" },
    NEED_UPDATE: { label: "Cần cập nhật", color: "purple" },
    TERMINATED: { label: "Chấm dứt", color: "red" },
};

const CompanyProceduresPage = () => {
    const { companyId } = useParams();
    const [searchParams] = useSearchParams();
    const companyName = searchParams.get("companyName");

    const tableRef = useRef<ActionType>(null);
    const [openModal, setOpenModal] = useState(false);
    const [openView, setOpenView] = useState(false);
    const [dataInit, setDataInit] = useState<IProcedure | null>(null);
    const [statusFilter, setStatusFilter] = useState<string | null>(null);
    const [createdAtFilter, setCreatedAtFilter] = useState<string | null>(null);
    const [searchValue, setSearchValue] = useState("");

    const buildFilterQuery = (page = PAGINATION_CONFIG.DEFAULT_PAGE) => {
        const q: any = {
            page,
            size: PAGINATION_CONFIG.DEFAULT_PAGE_SIZE,
            sort: "createdAt,desc",
        };
        const filters: string[] = [];

        // ← THÊM filter theo companyId
        if (companyId) filters.push(`department.company.id:${companyId}`);
        if (searchValue) filters.push(`procedureName~'${searchValue}'`);
        if (statusFilter) filters.push(`status='${statusFilter}'`);
        if (createdAtFilter) filters.push(createdAtFilter);
        if (filters.length > 0) q.filter = filters.join(" and ");

        return queryString.stringify(q, { encode: false });
    };

    const [query, setQuery] = useState(buildFilterQuery());

    const { data, isFetching, refetch } = useCompanyProceduresWithFilterQuery(query);
    const deleteMutation = useDeleteProcedureMutation("COMPANY");

    const meta = data?.meta ?? {
        page: PAGINATION_CONFIG.DEFAULT_PAGE,
        pageSize: PAGINATION_CONFIG.DEFAULT_PAGE_SIZE,
        total: 0,
    };
    const procedures = data?.result ?? [];

    useEffect(() => {
        setQuery(buildFilterQuery());
    }, [searchValue, statusFilter, createdAtFilter, companyId]);

    const buildQuery = (params: any, sort: any) => {
        const q: any = {
            page: params.current,
            size: params.pageSize || PAGINATION_CONFIG.DEFAULT_PAGE_SIZE,
        };
        const filters: string[] = [];

        // ← THÊM filter theo companyId
        if (companyId) filters.push(`department.company.id:${companyId}`);
        if (searchValue) filters.push(`procedureName~'${searchValue}'`);
        if (statusFilter) filters.push(`status='${statusFilter}'`);
        if (createdAtFilter) filters.push(createdAtFilter);
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
            title: "Phòng ban",
            dataIndex: "departmentName",
            width: 180,
        },
        {
            title: "Bộ phận",
            dataIndex: "sectionName",
            width: 160,
        },
        {
            title: "Tên quy trình",
            dataIndex: "procedureName",
            sorter: true,
            render: (_, record) =>
                record.fileUrls?.[0] ? (
                    <a
                        href={record.fileUrls?.[0]}
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
            render: (val) => `v${val ?? 1}`,
        },
        {
            title: "Ngày tạo",
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
            width: 120,
            render: (_, record) => (
                <Space>
                    <EyeOutlined
                        style={{ fontSize: 18, color: "#1677ff", cursor: "pointer" }}
                        onClick={() => { setDataInit(record); setOpenView(true); }}
                    />
                    <EditOutlined
                        style={{ fontSize: 18, color: "#fa8c16", cursor: "pointer" }}
                        onClick={() => { setDataInit(record); setOpenModal(true); }}
                    />
                    <DeleteOutlined
                        style={{ fontSize: 18, color: "red", cursor: "pointer" }}
                        onClick={() => deleteMutation.mutateAsync(record.id!)}
                    />
                </Space>
            ),
        },
    ];

    return (
        <PageContainer
            title={`Quy trình công ty${companyName ? " - " + companyName : ""}`}
            filter={
                <div className="flex flex-col gap-3">
                    <SearchFilter
                        searchPlaceholder="Tìm theo tên quy trình..."
                        addLabel="Thêm quy trình"
                        showFilterButton={false}
                        onSearch={setSearchValue}
                        onReset={() => refetch()}
                        onAddClick={() => {
                            setDataInit(null);
                            setOpenModal(true);
                        }}
                    />
                    <div className="flex flex-wrap gap-3 items-center">
                        <AdvancedFilterSelect
                            fields={[
                                {
                                    key: "status",
                                    label: "Trạng thái",
                                    options: [
                                        { label: "Cần xây dựng mới", value: "NEED_CREATE" },
                                        { label: "Đang xây dựng", value: "IN_PROGRESS" },
                                        { label: "Cần cập nhật", value: "NEED_UPDATE" },
                                        { label: "Chấm dứt", value: "TERMINATED" },
                                    ],
                                },
                            ]}
                            onChange={(filters) => setStatusFilter(filters.status || null)}
                        />
                        <DateRangeFilter
                            fieldName="createdAt"
                            onChange={(filter) => setCreatedAtFilter(filter)}
                        />
                    </div>
                </div>
            }
        >
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
                            <span style={{ fontWeight: 500 }}>
                                {range[0]}–{range[1]}
                            </span>{" "}
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
                defaultType="COMPANY"
                open={openModal}
                onClose={() => setOpenModal(false)}
                dataInit={dataInit}
                refetch={refetch}
                {...(companyId ? { fixedCompanyId: Number(companyId) } : {})}
            />
            <ViewProcedure
                type="COMPANY"
                open={openView}
                onClose={() => setOpenView(false)}
                dataInit={dataInit}
            />
        </PageContainer>
    );
};

export default CompanyProceduresPage;