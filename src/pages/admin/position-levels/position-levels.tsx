import { useEffect, useRef, useState } from "react";
import { Space, Tag, Popconfirm } from "antd";
import { EditOutlined, EyeOutlined, DeleteOutlined } from "@ant-design/icons";
import type { ProColumns, ActionType } from "@ant-design/pro-components";
import queryString from "query-string";

import PageContainer from "@/components/common/data-table/PageContainer";
import DataTable from "@/components/common/data-table";
import SearchFilter from "@/components/common/filter/SearchFilter";
import AdvancedFilterSelect from "@/components/common/filter/AdvancedFilterSelect";

import type { IPositionLevel } from "@/types/backend";
import { PAGINATION_CONFIG } from "@/config/pagination";
import { callFetchCompany } from "@/config/api";

import {
    usePositionLevelsQuery,
    useDeletePositionLevelMutation,
} from "@/hooks/usePositionLevels";

import ModalPositionLevel from "./modal.position-level";
import ViewDetailPositionLevel from "./view.position-level";
import { ALL_PERMISSIONS } from "@/config/permissions";
import Access from "@/components/share/access";
const PositionLevelPage = () => {
    const [openModal, setOpenModal] = useState(false);
    const [dataInit, setDataInit] = useState<IPositionLevel | null>(null);
    const [openViewDetail, setOpenViewDetail] = useState(false);
    const [searchValue, setSearchValue] = useState("");
    const [filterValues, setFilterValues] = useState<Record<string, any>>({});
    const [resetSignal, setResetSignal] = useState(0);

    const tableRef = useRef<ActionType>(null);

    const [query, setQuery] = useState(
        `page=${PAGINATION_CONFIG.DEFAULT_PAGE}&size=${PAGINATION_CONFIG.DEFAULT_PAGE_SIZE}&sort=bandOrder,asc&sort=code,asc`
    );

    const { data, isFetching, refetch } = usePositionLevelsQuery(query);
    const deleteMutation = useDeletePositionLevelMutation();

    const meta = data?.meta ?? { page: 1, pageSize: 10, total: 0 };
    const levels = data?.result ?? [];

    const buildFilters = (search: string, filters: Record<string, any>) => {
        const parts: string[] = [];

        if (search)
            parts.push(`(code~'${search}' or band~'${search}')`);

        if (filters.companyId)
            parts.push(`company.id:'${filters.companyId}'`);

        return parts;
    };

    useEffect(() => {
        const q: any = {
            page: PAGINATION_CONFIG.DEFAULT_PAGE,
            size: PAGINATION_CONFIG.DEFAULT_PAGE_SIZE,
            sort: ["bandOrder,asc", "code,asc"],
        };

        const filters = buildFilters(searchValue, filterValues);
        if (filters.length > 0) q.filter = filters.join(" and ");

        setQuery(queryString.stringify(q, { encode: false }));
    }, [searchValue, filterValues]);

    const buildQuery = (params: any, sort: any) => {
        const q: any = {
            page: params.current,
            size: params.pageSize ?? PAGINATION_CONFIG.DEFAULT_PAGE_SIZE,
        };

        const filters = buildFilters(searchValue, filterValues);
        if (filters.length > 0) q.filter = filters.join(" and ");

        let sortBy = "sort=bandOrder,asc&sort=code,asc";
        if (sort?.code)
            sortBy = sort.code === "ascend" ? "sort=code,asc" : "sort=code,desc";

        return `${queryString.stringify(q, { encode: false })}&${sortBy}`;
    };

    const handleDelete = async (id: number) => {
        try {
            await deleteMutation.mutateAsync(id);
            refetch();
        } catch (error) {
            console.error("Xóa bậc chức danh thất bại:", error);
        }
    };

    const handleReset = () => {
        setSearchValue("");
        setFilterValues({});
        setResetSignal((s) => s + 1);
        refetch();
    };

    const columns: ProColumns<IPositionLevel>[] = [
        {
            title: "STT",
            width: 60,
            align: "center",
            render: (_, __, idx) => idx + 1 + (meta.page - 1) * meta.pageSize,
        },
        {
            title: "Mã bậc",
            dataIndex: "code",
            sorter: true,
            align: "center",
            render: (code) => <Tag color="magenta">{code}</Tag>,
        },
        {
            title: "Nhóm bậc",
            dataIndex: "band",
            align: "center",
            render: (band) => <Tag color="gold">{band}</Tag>,
        },
        {
            title: "Cấp độ",
            dataIndex: "levelNumber",
            align: "center",
            render: (v) => <Tag color="purple">Cấp {v}</Tag>,
        },
        {
            title: "Thứ tự nhóm",
            dataIndex: "bandOrder",
            align: "center",
            render: (v) => <Tag color="blue">Nhóm {v ?? "--"}</Tag>,
        },
        {
            title: "Công ty",
            dataIndex: "companyName",
            render: (v) => v ?? "--",
        },
        {
            title: "Hành động",
            align: "center",
            width: 160,
            render: (_, record) => (
                <Space size="middle">
                    <Access permission={ALL_PERMISSIONS.POSITION_LEVELS.GET_BY_ID} hideChildren>
                        <EyeOutlined
                            style={{ fontSize: 18, color: "#1677ff", cursor: "pointer" }}
                            onClick={() => {
                                setDataInit(record);
                                setOpenViewDetail(true);
                            }}
                        />
                    </Access>
                    <Access permission={ALL_PERMISSIONS.POSITION_LEVELS.UPDATE} hideChildren>
                        <EditOutlined
                            style={{ fontSize: 18, color: "#fa8c16", cursor: "pointer" }}
                            onClick={() => {
                                setDataInit(record);
                                setOpenModal(true);
                            }}
                        />
                    </Access>
                    <Access permission={ALL_PERMISSIONS.POSITION_LEVELS.DELETE} hideChildren>
                        <Popconfirm
                            title="Xác nhận xóa bậc chức danh này?"
                            description="Hành động này không thể hoàn tác."
                            onConfirm={() => handleDelete(record.id!)}
                            okText="Xóa"
                            cancelText="Hủy"
                            okButtonProps={{ danger: true }}
                        >
                            <DeleteOutlined
                                style={{ fontSize: 18, color: "#ff4d4f", cursor: "pointer" }}
                            />
                        </Popconfirm>
                    </Access>
                </Space>
            ),
        },
    ];

    return (
        <PageContainer
            title="Quản lý bậc chức danh"
            filter={
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                    <SearchFilter
                        searchPlaceholder="Tìm theo mã bậc hoặc nhóm bậc..."
                        addLabel="Thêm bậc chức danh"
                        showFilterButton={false}
                        onSearch={(v) => setSearchValue(v)}
                        onReset={handleReset}
                        onAddClick={() => {
                            setDataInit(null);
                            setOpenModal(true);
                        }}
                        addPermission={ALL_PERMISSIONS.POSITION_LEVELS.CREATE}  // 👈 thêm dòng này

                    />
                    <AdvancedFilterSelect
                        resetSignal={resetSignal}
                        onChange={(filters) => setFilterValues(filters)}
                        fields={[
                            {
                                key: "companyId",
                                label: "Công ty",
                                type: "async-select",
                                loadOptions: async () => {
                                    const res = await callFetchCompany(
                                        "page=1&size=100&sort=name,asc"
                                    );
                                    return (res?.data?.result ?? []).map((c: any) => ({
                                        label: c.name,
                                        value: c.id,
                                    }));
                                },
                            },
                        ]}
                    />
                </div>
            }
        >
            <DataTable<IPositionLevel>
                actionRef={tableRef}
                rowKey="id"
                loading={isFetching}
                columns={columns}
                dataSource={levels}
                request={async (params, sort) => {
                    const q = buildQuery(params, sort);
                    setQuery(q);
                    return {
                        data: levels,
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

            <ModalPositionLevel
                openModal={openModal}
                setOpenModal={setOpenModal}
                dataInit={dataInit}
                setDataInit={setDataInit}
            />

            <ViewDetailPositionLevel
                open={openViewDetail}
                onClose={setOpenViewDetail}
                dataInit={dataInit}
                setDataInit={setDataInit}
            />
        </PageContainer>
    );
};

export default PositionLevelPage;