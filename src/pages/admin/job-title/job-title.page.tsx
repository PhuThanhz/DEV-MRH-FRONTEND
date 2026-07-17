import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Space, Tag, Button } from "antd";              // ← thêm Button, bỏ Badge
import type { TablePaginationConfig } from "antd";
import { EditOutlined, EyeOutlined } from "@ant-design/icons";
import type { ProColumns, ActionType } from "@ant-design/pro-components";
import queryString from "query-string";

import PageContainer from "@/components/common/data-table/PageContainer";
import DataTable from "@/components/common/data-table";
import SearchFilter from "@/components/common/filter/SearchFilter";
import AdvancedFilterSelect from "@/components/common/filter/AdvancedFilterSelect";

import type { IJobTitle, ICompany } from "@/types/backend";
import { PAGINATION_CONFIG } from "@/config/pagination";
import { ALL_PERMISSIONS } from "@/config/permissions";
import { callFetchCompany } from "@/config/api";

import { useJobTitlesQuery } from "@/hooks/useJobTitles";

import ModalJobTitle from "./modal.job-title";
import ViewDetailJobTitle from "./view.job-title";
import Access from "@/components/share/access";

const escapeFilterValue = (value: string) => value.trim().replace(/\\/g, "\\\\").replace(/'/g, "\\'");

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

    const { data, isFetching } = useJobTitlesQuery(query);

    const meta = data?.meta ?? { page: 1, pageSize: 10, total: 0 };
    const list = data?.result ?? [];

    const buildQuery = useCallback((
        page = PAGINATION_CONFIG.DEFAULT_PAGE,
        size = PAGINATION_CONFIG.DEFAULT_PAGE_SIZE,
        sortBy = PAGINATION_CONFIG.DEFAULT_SORT,
    ) => {
        const q: any = {
            page,
            size,
            sort: sortBy,
        };

        const filters: string[] = [];
        const search = escapeFilterValue(searchValue);
        if (search)
            filters.push(`(nameVi~'${search}' or nameEn~'${search}')`);
        if (activeFilter !== null)
            filters.push(`active=${activeFilter}`);
        if (companyIdFilter)
            filters.push(`positionLevel.company.id:${companyIdFilter}`);

        if (filters.length > 0) q.filter = filters.join(" and ");

        return queryString.stringify(q, { encode: false });
    }, [searchValue, activeFilter, companyIdFilter]);

    useEffect(() => {
        setQuery(buildQuery());
    }, [buildQuery]);

    const handleTableChange = useCallback((pagination: TablePaginationConfig, _filters: any, sorter: any) => {
        const activeSorter = Array.isArray(sorter) ? sorter[0] : sorter;
        const sortBy = activeSorter?.field === "nameVi"
            ? activeSorter.order === "ascend" ? "nameVi,asc" : "nameVi,desc"
            : PAGINATION_CONFIG.DEFAULT_SORT;

        setQuery(buildQuery(
            pagination.current || PAGINATION_CONFIG.DEFAULT_PAGE,
            pagination.pageSize || PAGINATION_CONFIG.DEFAULT_PAGE_SIZE,
            sortBy,
        ));
    }, [buildQuery]);

    // ===================== RESET =====================
    const handleReset = () => {
        setSearchValue("");
        setActiveFilter(null);
        setCompanyIdFilter(null);
        setResetSignal((s) => s + 1);
    };

    // ===================== COLUMNS =====================
    const columns: ProColumns<IJobTitle>[] = useMemo(() => [
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
            title: "Công ty",
            render: (_, record) =>
                record.positionLevel?.companyName
                    ? <Tag color="blue">{record.positionLevel.companyName}</Tag>
                    : <span style={{ color: "#bbb" }}>—</span>,
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
            fixed: "right",
            render: (_, record) => (
                <Space size={4} align="center">
                    <Access permission={ALL_PERMISSIONS.JOB_TITLES.GET_BY_ID} hideChildren>
                        <Button
                            data-guide-id="job-title-detail-button"
                            type="text"
                            size="small"
                            icon={<EyeOutlined style={{ color: "#1677ff", fontSize: 16 }} />}
                            onClick={() => {
                                setDataInit(record);
                                setOpenViewDetail(true);
                            }}
                        />
                    </Access>

                    <Access permission={ALL_PERMISSIONS.JOB_TITLES.UPDATE} hideChildren>
                        <Button
                            data-guide-id="job-title-edit-button"
                            type="text"
                            size="small"
                            icon={<EditOutlined style={{ color: "#fa8c16", fontSize: 16 }} />}
                            onClick={() => {
                                setDataInit(record);
                                setOpenModal(true);
                            }}
                        />
                    </Access>
                </Space>
            ),
        },
    ], [meta.page, meta.pageSize]);

    const filterFields = useMemo(() => [
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
    ], []);

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
                        addPermission={ALL_PERMISSIONS.JOB_TITLES.CREATE}
                        guideSearchId="job-title-search-input"
                        guideAddId="job-title-add-button"
                    />
                    <AdvancedFilterSelect
                        resetSignal={resetSignal}
                        fields={filterFields}
                        onChange={(val) => {
                            setActiveFilter(val.active !== undefined ? val.active : null);
                            setCompanyIdFilter(val.companyId !== undefined ? val.companyId : null);
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
                scroll={{ x: "max-content" }}           // ← bắt buộc để fixed: "right" hoạt động
                onChange={handleTableChange}
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
