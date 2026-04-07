import { useEffect, useRef, useState } from "react";
import { Space, Tag, Badge } from "antd";
import { EditOutlined, EyeOutlined } from "@ant-design/icons";
import type { ProColumns, ActionType } from "@ant-design/pro-components";
import queryString from "query-string";

import PageContainer from "@/components/common/data-table/PageContainer";
import DataTable from "@/components/common/data-table";
import SearchFilter from "@/components/common/filter/SearchFilter";
import AdvancedFilterSelect from "@/components/common/filter/AdvancedFilterSelect";

import type { IJobTitle, ICompany } from "@/types/backend"; import { PAGINATION_CONFIG } from "@/config/pagination";
import { ALL_PERMISSIONS } from "@/config/permissions";
import { callFetchCompany } from "@/config/api";

import { useJobTitlesQuery } from "@/hooks/useJobTitles";

import ModalJobTitle from "./modal.job-title";
import ViewDetailJobTitle from "./view.job-title";
import Access from "@/components/share/access";

const JobTitlePage = () => {
    const [openModal, setOpenModal] = useState(false);
    const [dataInit, setDataInit] = useState<IJobTitle | null>(null);
    const [openViewDetail, setOpenViewDetail] = useState(false);

    const [activeFilter, setActiveFilter] = useState<boolean | null>(null);
    const [companyIdFilter, setCompanyIdFilter] = useState<number | null>(null);
    const [searchValue, setSearchValue] = useState("");
    const [resetSignal, setResetSignal] = useState(0);

    const tableRef = useRef<ActionType>(null);

    const [query, setQuery] = useState(
        `page=${PAGINATION_CONFIG.DEFAULT_PAGE}&size=${PAGINATION_CONFIG.DEFAULT_PAGE_SIZE}&sort=createdAt,desc`
    );

    const { data, isFetching, refetch } = useJobTitlesQuery(query);

    const meta = data?.meta ?? { page: 1, pageSize: 10, total: 0 };
    const list = data?.result ?? [];

    /*
     * ===================== BUILD FILTERS =====================
     */
    const buildFilters = (
        search: string,
        active: boolean | null,
        companyId: number | null,
    ) => {
        const parts: string[] = [];

        if (search)
            parts.push(`(nameVi~'${search}' or nameEn~'${search}')`);

        if (active !== null)
            parts.push(`active=${active}`);

        if (companyId)
            parts.push(`positionLevel.company.id:${companyId}`);

        return parts;
    };

    /*
     * ===================== AUTO BUILD QUERY =====================
     */
    useEffect(() => {
        const q: any = {
            page: PAGINATION_CONFIG.DEFAULT_PAGE,
            size: PAGINATION_CONFIG.DEFAULT_PAGE_SIZE,
            sort: "createdAt,desc",
        };

        const filters = buildFilters(searchValue, activeFilter, companyIdFilter);
        if (filters.length > 0) q.filter = filters.join(" and ");

        setQuery(queryString.stringify(q, { encode: false }));
    }, [searchValue, activeFilter, companyIdFilter]);

    /*
     * ===================== BUILD QUERY FOR TABLE =====================
     */
    const buildQuery = (params: any, sort: any) => {
        const q: any = {
            page: params.current,
            size: params.pageSize,
        };

        const filters = buildFilters(searchValue, activeFilter, companyIdFilter);
        if (filters.length > 0) q.filter = filters.join(" and ");

        let sortBy = "sort=createdAt,desc";
        if (sort?.nameVi)
            sortBy = sort.nameVi === "ascend" ? "sort=nameVi,asc" : "sort=nameVi,desc";

        return `${queryString.stringify(q, { encode: false })}&${sortBy}`;
    };

    /*
     * ===================== RESET =====================
     */
    const handleReset = () => {
        setSearchValue("");
        setActiveFilter(null);
        setCompanyIdFilter(null);
        setResetSignal((s) => s + 1);
        refetch();
    };

    /*
     * ===================== COLUMNS =====================
     */
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
                        showFilterButton={false}
                        onSearch={(val) => setSearchValue(val)}
                        onReset={handleReset}
                        onAddClick={() => {
                            setDataInit(null);
                            setOpenModal(true);
                        }}
                        addPermission={ALL_PERMISSIONS.JOB_TITLES.CREATE}  // 👈 thêm dòng này

                    />

                    <AdvancedFilterSelect
                        resetSignal={resetSignal}
                        fields={[
                            {
                                key: "active",
                                label: "Trạng thái",
                                options: [
                                    { label: "Đang hoạt động", value: true, color: "green" },
                                    { label: "Ngừng hoạt động", value: false, color: "red" },
                                ],
                            },
                            {
                                key: "companyId",
                                label: "Công ty",
                                asyncOptions: async () => {
                                    const res = await callFetchCompany("page=1&size=100&sort=name,asc");
                                    return (res.data?.result ?? []).map((c: ICompany) => ({
                                        label: c.name,
                                        value: c.id,
                                    }));
                                },
                            },
                        ]}
                        onChange={(val) => {
                            setActiveFilter(
                                val.active !== undefined ? val.active : null
                            );
                            setCompanyIdFilter(
                                val.companyId !== undefined ? val.companyId : null
                            );
                        }}
                    />
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