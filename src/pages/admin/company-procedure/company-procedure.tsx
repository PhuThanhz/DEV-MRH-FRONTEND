import { useEffect, useRef, useState } from "react";
import { Space, Tag } from "antd";
import { EditOutlined, EyeOutlined, FileTextOutlined } from "@ant-design/icons";
import type { ProColumns, ActionType } from "@ant-design/pro-components";
import queryString from "query-string";
import dayjs from "dayjs";

import PageContainer from "@/components/common/data-table/PageContainer";
import DataTable from "@/components/common/data-table";
import SearchFilter from "@/components/common/filter/SearchFilter";
import AdvancedFilterSelect from "@/components/common/filter/AdvancedFilterSelect";
import DateRangeFilter from "@/components/common/filter/DateRangeFilter";

import type { ICompanyProcedure } from "@/types/backend";
import Access from "@/components/share/access";
import { ALL_PERMISSIONS } from "@/config/permissions";
import { PAGINATION_CONFIG } from "@/config/pagination";
import { useCompanyProceduresQuery } from "@/hooks/useCompanyProcedures";

import ModalCompanyProcedure from "@/pages/admin/company-procedure/modal.company-procedure";
import ViewDetailCompanyProcedure from "@/pages/admin/company-procedure/view.company-procedure";

const CompanyProcedurePage = () => {
    const [openModal, setOpenModal] = useState(false);
    const [dataInit, setDataInit] = useState<ICompanyProcedure | null>(null);
    const [openViewDetail, setOpenViewDetail] = useState(false);

    const [statusFilter, setStatusFilter] = useState<string | null>(null);
    const [createdAtFilter, setCreatedAtFilter] = useState<string | null>(null);
    const [searchValue, setSearchValue] = useState<string>("");

    const [query, setQuery] = useState<string>(
        `page=${PAGINATION_CONFIG.DEFAULT_PAGE}&size=${PAGINATION_CONFIG.DEFAULT_PAGE_SIZE}&sort=createdAt,desc`
    );

    const tableRef = useRef<ActionType>(null);
    const { data, isFetching, refetch } = useCompanyProceduresQuery(query);

    // ==================== FILTER ====================
    useEffect(() => {
        const q: any = {
            page: PAGINATION_CONFIG.DEFAULT_PAGE,
            size: PAGINATION_CONFIG.DEFAULT_PAGE_SIZE,
            sort: "createdAt,desc",
        };

        const filters: string[] = [];
        if (searchValue) filters.push(`(procedureName~'${searchValue}')`);
        if (statusFilter) filters.push(`status='${statusFilter}'`);
        if (createdAtFilter) filters.push(createdAtFilter);

        if (filters.length > 0) q.filter = filters.join(" and ");
        setQuery(queryString.stringify(q, { encode: false }));
    }, [searchValue, statusFilter, createdAtFilter]);

    const meta = data?.meta ?? {
        page: PAGINATION_CONFIG.DEFAULT_PAGE,
        pageSize: PAGINATION_CONFIG.DEFAULT_PAGE_SIZE,
        total: 0,
    };
    const procedures = data?.result ?? [];

    // ==================== QUERY BUILD ====================
    const buildQuery = (params: any, sort: any) => {
        const q: any = {
            page: params.current,
            size: params.pageSize || PAGINATION_CONFIG.DEFAULT_PAGE_SIZE,
        };

        const filters: string[] = [];
        if (searchValue) filters.push(`(procedureName~'${searchValue}')`);
        if (statusFilter) filters.push(`status='${statusFilter}'`);
        if (createdAtFilter) filters.push(createdAtFilter);

        if (filters.length > 0) q.filter = filters.join(" and ");

        let temp = queryString.stringify(q, { encode: false });
        let sortBy = "sort=createdAt,desc";
        if (sort?.procedureName)
            sortBy =
                sort.procedureName === "ascend"
                    ? "sort=procedureName,asc"
                    : "sort=procedureName,desc";
        return `${temp}&${sortBy}`;
    };

    const reloadTable = () => refetch();

    // ==================== COLUMNS ====================
    const columns: ProColumns<ICompanyProcedure>[] = [
        {
            title: "STT",
            key: "index",
            width: 60,
            align: "center",
            render: (_text, _record, index) =>
                index + 1 + ((meta.page || 1) - 1) * (meta.pageSize || 10),
        },
        {
            title: "Mã công ty",
            dataIndex: "companyCode",
            align: "center",
            width: 120,
        },
        {
            title: "Công ty",
            dataIndex: "companyName",
            width: 200,
        },
        {
            title: "Phòng ban",
            dataIndex: "departmentName",
            width: 200,
        },
        {
            title: "Bộ phận phụ trách",
            dataIndex: "sectionName",
            width: 200,
        },
        {
            title: "Tên quy trình",
            dataIndex: "procedureName",
            sorter: true,
            width: 250,
            render: (_, record) =>
                record.fileUrl ? (
                    <a
                        href={record.fileUrl}
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
            title: "Tình trạng",
            dataIndex: "status",
            align: "center",
            render: (_, record) => {
                const colorMap: Record<string, string> = {
                    NEED_CREATE: "orange",
                    IN_PROGRESS: "blue",
                    NEED_UPDATE: "purple",
                    TERMINATED: "red",
                };
                const labelMap: Record<string, string> = {
                    NEED_CREATE: "Cần xây dựng mới",
                    IN_PROGRESS: "Đang xây dựng",
                    NEED_UPDATE: "Cần cập nhật",
                    TERMINATED: "Chấm dứt",
                };
                return (
                    <Tag color={colorMap[record.status] || "default"}>
                        {labelMap[record.status] || record.status}
                    </Tag>
                );
            },
        },
        {
            title: "Kế hoạch theo năm",
            dataIndex: "planYear",
            align: "center",
            width: 150,
        },
        {
            title: "Ghi chú",
            dataIndex: "note",
            render: (text) => (text ? text : "--"),
        },
        {
            title: "Ngày ban hành",
            dataIndex: "createdAt",
            align: "center",
            width: 140,
            render: (val: unknown) =>
                (typeof val === "string" || typeof val === "number") && val
                    ? dayjs(val).format("DD-MM-YYYY")
                    : "--",
        },
        {
            title: "Hành động",
            align: "center",
            width: 120,
            render: (_, entity) => (
                <Space>
                    <Access
                        permission={ALL_PERMISSIONS.COMPANY_PROCEDURES.GET_BY_ID}
                        hideChildren
                    >
                        <EyeOutlined
                            style={{
                                fontSize: 18,
                                color: "#1677ff",
                                cursor: "pointer",
                            }}
                            onClick={() => {
                                setDataInit(entity);
                                setOpenViewDetail(true);
                            }}
                        />
                    </Access>

                    <Access
                        permission={ALL_PERMISSIONS.COMPANY_PROCEDURES.UPDATE}
                        hideChildren
                    >
                        <EditOutlined
                            style={{
                                fontSize: 18,
                                color: "#fa8c16",
                                cursor: "pointer",
                            }}
                            onClick={() => {
                                setDataInit(entity);
                                setOpenModal(true);
                            }}
                        />
                    </Access>
                </Space>
            ),
        },
    ];

    // ==================== RENDER ====================
    return (
        <PageContainer
            title="Quản lý quy trình công ty"
            filter={
                <div className="flex flex-col gap-3">
                    <SearchFilter
                        searchPlaceholder="Tìm theo tên quy trình..."
                        addLabel="Thêm quy trình"
                        showFilterButton={false}
                        onSearch={(val) => setSearchValue(val)}
                        onReset={reloadTable}
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
                            onChange={(filters) => {
                                setStatusFilter(filters.status || null);
                            }}
                        />
                        <DateRangeFilter
                            fieldName="createdAt"
                            onChange={(filter) => setCreatedAtFilter(filter)}
                        />
                    </div>
                </div>
            }
        >
            <Access permission={ALL_PERMISSIONS.COMPANY_PROCEDURES.GET_PAGINATE}>
                <DataTable<ICompanyProcedure>
                    actionRef={tableRef}
                    rowKey="id"
                    loading={isFetching}
                    columns={columns}
                    dataSource={procedures}
                    request={async (params, sort) => {
                        const q = buildQuery(params, sort);
                        setQuery(q);
                        return Promise.resolve({
                            data: procedures,
                            success: true,
                            total: meta.total,
                        });
                    }}
                    pagination={{
                        defaultPageSize: PAGINATION_CONFIG.DEFAULT_PAGE_SIZE,
                        current: meta.page,
                        pageSize: meta.pageSize,
                        total: meta.total,
                        showQuickJumper: true,
                    }}
                    rowSelection={false}
                />
            </Access>

            <ModalCompanyProcedure
                openModal={openModal}
                setOpenModal={setOpenModal}
                dataInit={dataInit}
                setDataInit={setDataInit}
            />

            <ViewDetailCompanyProcedure
                onClose={setOpenViewDetail}
                open={openViewDetail}
                dataInit={dataInit}
                setDataInit={setDataInit}
            />
        </PageContainer>
    );
};

export default CompanyProcedurePage;
