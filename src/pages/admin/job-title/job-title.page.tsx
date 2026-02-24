import { useEffect, useRef, useState } from "react";
import { Space, Tag, Badge } from "antd";
import { EditOutlined, EyeOutlined } from "@ant-design/icons";
import type { ProColumns, ActionType } from "@ant-design/pro-components";
import queryString from "query-string";

import PageContainer from "@/components/common/data-table/PageContainer";
import DataTable from "@/components/common/data-table";
import SearchFilter from "@/components/common/filter/SearchFilter";
import AdvancedFilterSelect from "@/components/common/filter/AdvancedFilterSelect";
import DateRangeFilter from "@/components/common/filter/DateRangeFilter";

import type { IJobTitle } from "@/types/backend";
import { PAGINATION_CONFIG } from "@/config/pagination";
import { ALL_PERMISSIONS } from "@/config/permissions";

import { useJobTitlesQuery } from "@/hooks/useJobTitles";

import ModalJobTitle from "./modal.job-title";
import ViewDetailJobTitle from "./view.job-title";
import Access from "@/components/share/access";

const JobTitlePage = () => {
    const [openModal, setOpenModal] = useState(false);
    const [dataInit, setDataInit] = useState<IJobTitle | null>(null);
    const [openViewDetail, setOpenViewDetail] = useState(false);

    const [activeFilter, setActiveFilter] = useState<boolean | null>(null);
    const [createdAtFilter, setCreatedAtFilter] = useState<string | null>(null);
    const [searchValue, setSearchValue] = useState("");

    const tableRef = useRef<ActionType>(null);

    const [query, setQuery] = useState(
        `page=${PAGINATION_CONFIG.DEFAULT_PAGE}&size=${PAGINATION_CONFIG.DEFAULT_PAGE_SIZE}&sort=createdAt,desc`
    );

    const { data, isFetching, refetch } = useJobTitlesQuery(query);

    const meta = data?.meta ?? { page: 1, pageSize: 10, total: 0 };
    const list = data?.result ?? [];

    /* ===================== AUTO BUILD QUERY ===================== */
    useEffect(() => {
        const q: any = {
            page: PAGINATION_CONFIG.DEFAULT_PAGE,
            size: PAGINATION_CONFIG.DEFAULT_PAGE_SIZE,
            sort: "createdAt,desc"
        };

        const filters: string[] = [];

        if (searchValue)
            filters.push(`(nameVi~'${searchValue}' or nameEn~'${searchValue}')`);

        if (activeFilter !== null)
            filters.push(`active=${activeFilter}`);

        if (createdAtFilter)
            filters.push(createdAtFilter);

        if (filters.length > 0)
            q.filter = filters.join(" and ");

        setQuery(queryString.stringify(q, { encode: false }));
    }, [searchValue, activeFilter, createdAtFilter]);

    /* ===================== BUILD QUERY FOR TABLE ===================== */
    const buildQuery = (params: any, sort: any) => {
        const q: any = {
            page: params.current,
            size: params.pageSize,
        };

        const filters: string[] = [];

        if (searchValue)
            filters.push(`(nameVi~'${searchValue}' or nameEn~'${searchValue}')`);

        if (activeFilter !== null)
            filters.push(`active=${activeFilter}`);

        if (createdAtFilter)
            filters.push(createdAtFilter);

        if (filters.length > 0)
            q.filter = filters.join(" and ");

        let sortBy = "sort=createdAt,desc";

        if (sort?.nameVi)
            sortBy = sort.nameVi === "ascend" ? "sort=nameVi,asc" : "sort=nameVi,desc";

        return `${queryString.stringify(q, { encode: false })}&${sortBy}`;
    };

    /* ===================== COLUMNS ===================== */
    const columns: ProColumns<IJobTitle>[] = [
        {
            title: "STT",
            width: 60,
            align: "center",
            render: (_, __, idx) => idx + 1 + (meta.page - 1) * meta.pageSize,
        },
        { title: "Tên VI", dataIndex: "nameVi", sorter: true },
        { title: "Tên EN", dataIndex: "nameEn" },
        {
            title: "Bậc",
            dataIndex: ["positionLevel", "code"],
            render: (_) => <Tag color="purple">{_}</Tag>,
        },
        {
            title: "Trạng thái",
            dataIndex: "active",
            render: (_, r) =>
                r.active ? (
                    <Badge status="success" text="Đang hoạt động" />
                ) : (
                    <Badge status="error" text="Ngừng hoạt động" />
                ),
        },
        {
            title: "Hành động",
            align: "center",
            width: 120,
            render: (_, record) => (
                <Space>
                    <Access permission={ALL_PERMISSIONS.JOB_TITLES.GET_BY_ID} hideChildren>
                        <EyeOutlined
                            style={{ fontSize: 18, color: "#1677ff", cursor: "pointer" }}
                            onClick={() => {
                                setDataInit(record);
                                setOpenViewDetail(true);
                            }}
                        />
                    </Access>

                    <Access permission={ALL_PERMISSIONS.JOB_TITLES.UPDATE} hideChildren>
                        <EditOutlined
                            style={{ fontSize: 18, color: "#fa8c16", cursor: "pointer" }}
                            onClick={() => {
                                setDataInit(record);
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
            title="Quản lý chức danh"
            filter={
                <div className="flex flex-col gap-3">
                    <SearchFilter
                        searchPlaceholder="Tìm theo tên VI hoặc EN..."
                        addLabel="Thêm chức danh"
                        onSearch={(val) => setSearchValue(val)}
                        onReset={() => refetch()}
                        onAddClick={() => {
                            setDataInit(null);
                            setOpenModal(true);
                        }}
                    />

                    <div className="flex gap-3">
                        <AdvancedFilterSelect
                            fields={[
                                {
                                    key: "active",
                                    label: "Trạng thái",
                                    options: [
                                        { label: "Đang hoạt động", value: true, color: "green" },
                                        { label: "Ngừng hoạt động", value: false, color: "red" },
                                    ],
                                },
                            ]}
                            onChange={(val) =>
                                setActiveFilter(
                                    val.active !== undefined ? val.active : null
                                )
                            }
                        />

                        <DateRangeFilter
                            fieldName="createdAt"
                            onChange={(val) => setCreatedAtFilter(val)}
                        />
                    </div>
                </div>
            }
        >
            <DataTable<IJobTitle>
                actionRef={tableRef}
                rowKey="id"
                loading={isFetching}
                columns={columns}
                dataSource={list}
                request={async (params, sort) => {
                    const q = buildQuery(params, sort);
                    setQuery(q);
                    return {
                        data: list,
                        success: true,
                        total: meta.total,
                    };
                }}
                pagination={{
                    current: meta.page,
                    pageSize: meta.pageSize,
                    total: meta.total,
                    showQuickJumper: true,
                }}
            />

            <ModalJobTitle
                openModal={openModal}
                setOpenModal={setOpenModal}
                dataInit={dataInit}
                setDataInit={setDataInit}
            />

            <ViewDetailJobTitle
                open={openViewDetail}
                onClose={setOpenViewDetail}
                dataInit={dataInit}
                setDataInit={setDataInit}
            />
        </PageContainer>
    );
};

export default JobTitlePage;
