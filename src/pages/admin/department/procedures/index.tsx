import { useEffect, useRef, useState } from "react";
import { Tag } from "antd";
import { EyeOutlined, FileTextOutlined } from "@ant-design/icons";
import type { ProColumns, ActionType } from "@ant-design/pro-components";
import queryString from "query-string";
import dayjs from "dayjs";
import { useParams, useSearchParams } from "react-router-dom";

import PageContainer from "@/components/common/data-table/PageContainer";
import DataTable from "@/components/common/data-table";
import SearchFilter from "@/components/common/filter/SearchFilter";
import AdvancedFilterSelect from "@/components/common/filter/AdvancedFilterSelect";
import ViewProcedure from "@/pages/admin/procedures/view.procedure";

import { useDepartmentProceduresWithFilterQuery } from "@/hooks/useProcedure";

import type { IProcedure } from "@/types/backend";
import { PAGINATION_CONFIG } from "@/config/pagination";

// Trạng thái hiển thị cho người dùng phòng ban
const STATUS_MAP = {
    NEED_CREATE: { label: "Cần xây dựng mới", color: "orange" },
    IN_PROGRESS: { label: "Đang hiệu lực", color: "green" },
    NEED_UPDATE: { label: "Đang cập nhật", color: "gold" },
    TERMINATED: { label: "Hết hiệu lực", color: "red" },
};

// Dùng chung để build filter string
const buildFilters = (
    departmentId: string | undefined,
    searchValue: string,
    statusFilter: string | null
): string[] => {
    const filters: string[] = [];
    if (departmentId) filters.push(`department.id:${departmentId}`);
    if (searchValue) filters.push(`procedureName~'${searchValue}'`);
    if (statusFilter) filters.push(`status='${statusFilter}'`);
    return filters;
};

const DepartmentProceduresPage = () => {
    const { departmentId } = useParams<{ departmentId: string }>();
    const [searchParams] = useSearchParams();
    const departmentName = searchParams.get("departmentName");

    const tableRef = useRef<ActionType>(null);
    const [openView, setOpenView] = useState(false);
    const [dataInit, setDataInit] = useState<IProcedure | null>(null);
    const [statusFilter, setStatusFilter] = useState<string | null>(null);
    const [searchValue, setSearchValue] = useState("");

    // Query khởi tạo — filter ngay theo departmentId
    const [query, setQuery] = useState(() => {
        const q: Record<string, any> = {
            page: PAGINATION_CONFIG.DEFAULT_PAGE,
            size: PAGINATION_CONFIG.DEFAULT_PAGE_SIZE,
            sort: "createdAt,desc",
        };
        const filters = buildFilters(departmentId, "", null);
        if (filters.length) q.filter = filters.join(" and ");
        return queryString.stringify(q, { encode: false });
    });

    const { data, isFetching, refetch } = useDepartmentProceduresWithFilterQuery(query);

    const meta = data?.meta ?? {
        page: PAGINATION_CONFIG.DEFAULT_PAGE,
        pageSize: PAGINATION_CONFIG.DEFAULT_PAGE_SIZE,
        total: 0,
    };
    const procedures = data?.result ?? [];

    // Cập nhật query khi filter thay đổi
    useEffect(() => {
        const filters = buildFilters(departmentId, searchValue, statusFilter);
        const q: Record<string, any> = {
            page: PAGINATION_CONFIG.DEFAULT_PAGE,
            size: PAGINATION_CONFIG.DEFAULT_PAGE_SIZE,
            sort: "createdAt,desc",
        };
        if (filters.length) q.filter = filters.join(" and ");
        setQuery(queryString.stringify(q, { encode: false }));
    }, [searchValue, statusFilter, departmentId]);

    // Query khi phân trang / sort từ DataTable
    const buildPageQuery = (params: any): string => {
        const filters = buildFilters(departmentId, searchValue, statusFilter);
        const q: Record<string, any> = {
            page: params.current,
            size: params.pageSize || PAGINATION_CONFIG.DEFAULT_PAGE_SIZE,
        };
        if (filters.length) q.filter = filters.join(" and ");
        return `${queryString.stringify(q, { encode: false })}&sort=createdAt,desc`;
    };

    const handleView = (record: IProcedure) => {
        setDataInit(record);
        setOpenView(true);
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
            title: "Bộ phận",
            dataIndex: "sectionName",
            width: 160,
        },
        {
            title: "Tên quy trình",
            dataIndex: "procedureName",
            render: (_, record) => (
                <span
                    onClick={() => handleView(record)}
                    style={{ color: "#1677ff", fontWeight: 500, cursor: "pointer" }}
                >
                    <FileTextOutlined style={{ marginRight: 6 }} />
                    {record.procedureName}
                </span>
            ),
        },
        {
            title: "Trạng thái",
            dataIndex: "status",
            align: "center",
            width: 160,
            render: (_, record) => {
                const s = STATUS_MAP[record.status as keyof typeof STATUS_MAP] ?? {
                    label: record.status ?? "--",
                    color: "default",
                };
                return (
                    <Tag color={s.color} style={{ borderRadius: 4, fontWeight: 500 }}>
                        {s.label}
                    </Tag>
                );
            },
        },
        {
            title: "Năm KH",
            dataIndex: "planYear",
            align: "center",
            width: 100,
        },
        {
            title: "Phiên bản",
            dataIndex: "version",
            align: "center",
            width: 90,
            render: (val) => <Tag color="blue">v{val ?? 1}</Tag>,
        },
        {
            title: "Ngày ban hành",
            dataIndex: "createdAt",
            align: "center",
            width: 130,
            render: (val: unknown) =>
                typeof val === "string" && val
                    ? dayjs(val).format("DD-MM-YYYY")
                    : "--",
        },
        {
            title: "Xem",
            align: "center",
            width: 70,
            render: (_, record) => (
                <EyeOutlined
                    title="Xem chi tiết"
                    style={{ fontSize: 18, color: "#1677ff", cursor: "pointer" }}
                    onClick={() => handleView(record)}
                />
            ),
        },
    ];

    return (
        <>
            <PageContainer
                title={`Quy trình phòng ban${departmentName ? " — " + departmentName : ""}`}
                filter={
                    <div className="flex flex-col gap-3">
                        <SearchFilter
                            searchPlaceholder="Tìm theo tên quy trình..."
                            showFilterButton={false}
                            showAddButton={false}   // Người dùng phòng ban không được thêm
                            onSearch={setSearchValue}
                            onReset={() => {
                                setSearchValue("");
                                setStatusFilter(null);
                                refetch();
                            }}
                        />
                        <div className="flex flex-wrap gap-3 items-center">
                            <AdvancedFilterSelect
                                fields={[
                                    {
                                        key: "status",
                                        label: "Trạng thái",
                                        options: [
                                            { label: "Đang hiệu lực", value: "IN_PROGRESS", color: "green" },
                                            { label: "Hết hiệu lực", value: "TERMINATED", color: "red" },
                                            { label: "Đang cập nhật", value: "NEED_UPDATE", color: "orange" },
                                            { label: "Cần xây dựng mới", value: "NEED_CREATE", color: "default" },
                                        ],
                                    },
                                ]}
                                onChange={(filters) => setStatusFilter(filters.status || null)}
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
                    request={async (params) => {
                        const q = buildPageQuery(params);
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
                                <span style={{ fontWeight: 500 }}>{range[0]}–{range[1]}</span>
                                {" "}trên{" "}
                                <span style={{ fontWeight: 600, color: "#1677ff" }}>
                                    {total.toLocaleString()}
                                </span>
                                {" "}quy trình
                            </div>
                        ),
                    }}
                    rowSelection={false}
                />
            </PageContainer>

            <ViewProcedure
                type="DEPARTMENT"
                open={openView}
                onClose={() => { setOpenView(false); setDataInit(null); }}
                dataInit={dataInit}
            />
        </>
    );
};

export default DepartmentProceduresPage;