import { useEffect, useRef, useState } from "react";
import { Space, Tag } from "antd";
import { EditOutlined, EyeOutlined } from "@ant-design/icons";
import type { ProColumns, ActionType } from "@ant-design/pro-components";
import queryString from "query-string";

import PageContainer from "@/components/common/data-table/PageContainer";
import DataTable from "@/components/common/data-table";
import SearchFilter from "@/components/common/filter/SearchFilter";
import AdvancedFilterSelect from "@/components/common/filter/AdvancedFilterSelect";

import Access from "@/components/share/access";
import { ALL_PERMISSIONS } from "@/config/permissions";
import { PAGINATION_CONFIG } from "@/config/pagination";
import type { IProcessAction } from "@/types/backend";
import { useProcessActionsQuery } from "@/hooks/useProcessActions";

import ModalProcessAction from "./modal.process-action";
import ViewProcessAction from "./view.process-action";

const ProcessActionPage = () => {
    const [openModal, setOpenModal] = useState(false);
    const [openView, setOpenView] = useState(false);
    const [dataInit, setDataInit] = useState<IProcessAction | null>(null);

    const [searchValue, setSearchValue] = useState("");
    const [statusFilter, setStatusFilter] = useState<number | null>(null);
    const [resetSignal, setResetSignal] = useState(0);

    const [query, setQuery] = useState(
        `page=${PAGINATION_CONFIG.DEFAULT_PAGE}&size=${PAGINATION_CONFIG.DEFAULT_PAGE_SIZE}&sort=createdAt,desc`
    );

    const tableRef = useRef<ActionType>(null);
    const { data, isFetching, refetch } = useProcessActionsQuery(query);

    const meta = data?.meta ?? {
        page: PAGINATION_CONFIG.DEFAULT_PAGE,
        pageSize: PAGINATION_CONFIG.DEFAULT_PAGE_SIZE,
        total: 0,
    };

    // ===================== BUILD FILTERS =====================
    const buildFilters = (
        search: string,
        status: number | null,
    ) => {
        const parts: string[] = [];
        if (search) parts.push(`(code~'${search}' or name~'${search}')`);
        if (status !== null) parts.push(`active=${status}`);
        return parts;
    };

    // ===================== AUTO BUILD QUERY =====================
    useEffect(() => {
        const q: any = {
            page: PAGINATION_CONFIG.DEFAULT_PAGE,
            size: PAGINATION_CONFIG.DEFAULT_PAGE_SIZE,
            sort: "createdAt,desc",
        };
        const filters = buildFilters(searchValue, statusFilter);
        if (filters.length > 0) q.filter = filters.join(" and ");
        setQuery(queryString.stringify(q, { encode: false }));
    }, [searchValue, statusFilter]);

    // ===================== BUILD QUERY FOR TABLE =====================
    const buildQuery = (params: any, sort: any) => {
        const q: any = {
            page: params.current,
            size: params.pageSize || PAGINATION_CONFIG.DEFAULT_PAGE_SIZE,
        };
        const filters = buildFilters(searchValue, statusFilter);
        if (filters.length > 0) q.filter = filters.join(" and ");

        let sortBy = "sort=createdAt,desc";
        if (sort?.code)
            sortBy = sort.code === "ascend" ? "sort=code,asc" : "sort=code,desc";
        else if (sort?.name)
            sortBy = sort.name === "ascend" ? "sort=name,asc" : "sort=name,desc";

        return `${queryString.stringify(q, { encode: false })}&${sortBy}`;
    };

    // ===================== RESET =====================
    const handleReset = () => {
        setSearchValue("");
        setStatusFilter(null);
        setResetSignal((s) => s + 1);
        refetch();
    };

    // ===================== COLUMNS =====================
    const columns: ProColumns<IProcessAction>[] = [
        {
            title: "STT",
            key: "index",
            width: 60,
            align: "center",
            render: (_, __, index) =>
                index + 1 + ((meta.page || 1) - 1) * (meta.pageSize || 10),
        },
        {
            title: "Mã hành động",
            dataIndex: "code",
            sorter: true,
            align: "center",
            width: 180,
            render: (text) => (
                <Tag
                    style={{
                        borderRadius: 4,
                        padding: "0px 8px",
                        fontSize: 12,
                        fontWeight: 500,
                        height: 22,
                        lineHeight: "20px",
                        border: "1px solid #AFA9EC",
                        background: "#EEEDFE",
                        color: "#3C3489",
                        fontFamily: "monospace",
                    }}
                >
                    {text}
                </Tag>
            ),
        },
        {
            title: "Tên hành động",
            dataIndex: "name",
            sorter: true,
            width: 250,
            render: (text) => <span style={{ fontWeight: 500 }}>{text}</span>,
        },
        {
            title: "Trạng thái",
            dataIndex: "active",
            width: 150,
            align: "center",
            render: (_, record) => {
                const isActive = record.active;
                return (
                    <Tag
                        style={{
                            borderRadius: 4,
                            padding: "0px 8px",
                            fontSize: 12,
                            fontWeight: 500,
                            height: 22,
                            lineHeight: "20px",
                            border: `1px solid ${isActive ? "#b7eb8f" : "#ffccc7"}`,
                            background: isActive ? "#f6ffed" : "#fff2f0",
                            color: isActive ? "#389e0d" : "#cf1322",
                        }}
                    >
                        {isActive ? "Hoạt động" : "Ngừng hoạt động"}
                    </Tag>
                );
            },
        },
        {
            title: "Hành động",
            align: "center",
            width: 120,
            render: (_, entity) => (
                <Space>
                    <Access permission={ALL_PERMISSIONS.PROCESS_ACTIONS.GET_BY_ID} hideChildren>
                        <EyeOutlined
                            style={{ fontSize: 18, color: "#1677ff", cursor: "pointer" }}
                            onClick={() => {
                                setDataInit(entity);
                                setOpenView(true);
                            }}
                        />
                    </Access>

                    <Access permission={ALL_PERMISSIONS.PROCESS_ACTIONS.UPDATE} hideChildren>
                        <EditOutlined
                            style={{ fontSize: 18, color: "#fa8c16", cursor: "pointer" }}
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

    return (
        <PageContainer
            title="Quản lý Raci"
            filter={
                <div className="flex flex-col gap-3">
                    <SearchFilter
                        searchPlaceholder="Tìm kiếm theo mã hoặc tên hành động..."
                        addLabel="Thêm hành động"
                        showFilterButton={false}
                        onSearch={setSearchValue}
                        onReset={handleReset}
                        onAddClick={() => {
                            setDataInit(null);
                            setOpenModal(true);
                        }}
                        addPermission={ALL_PERMISSIONS.PROCESS_ACTIONS.CREATE}
                    />
                    <AdvancedFilterSelect
                        resetSignal={resetSignal}
                        fields={[
                            {
                                key: "status",
                                label: "Trạng thái",
                                options: [
                                    { label: "Hoạt động", value: 1, color: "green" },
                                    { label: "Ngừng hoạt động", value: 0, color: "red" },
                                ],
                            },
                        ]}
                        onChange={(val) => {
                            setStatusFilter(val.status ?? null);
                        }}
                    />
                </div>
            }
        >
            <Access permission={ALL_PERMISSIONS.PROCESS_ACTIONS.GET_PAGINATE}>
                <DataTable<IProcessAction>
                    actionRef={tableRef}
                    rowKey="id"
                    loading={isFetching}
                    columns={columns}
                    dataSource={data?.result ?? []}
                    request={async (params, sort) => {
                        const q = buildQuery(params, sort);
                        setQuery(q);
                        return {
                            data: data?.result ?? [],
                            success: true,
                            total: meta.total,
                        };
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

            {/* ===== MODALS ===== */}
            <ModalProcessAction
                openModal={openModal}
                setOpenModal={setOpenModal}
                dataInit={dataInit}
                setDataInit={setDataInit}
            />

            <ViewProcessAction
                open={openView}
                onClose={setOpenView}
                dataInit={dataInit}
                setDataInit={setDataInit}
            />
        </PageContainer>
    );
};

export default ProcessActionPage;