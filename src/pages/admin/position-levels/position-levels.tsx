import { useEffect, useRef, useState } from "react";
import { Space, Tag, Badge, Popconfirm, Button } from "antd";
import { EditOutlined, EyeOutlined, DeleteOutlined } from "@ant-design/icons";
import type { ProColumns, ActionType } from "@ant-design/pro-components";
import queryString from "query-string";

import PageContainer from "@/components/common/data-table/PageContainer";
import DataTable from "@/components/common/data-table";
import SearchFilter from "@/components/common/filter/SearchFilter";

import type { IPositionLevel } from "@/types/backend";
import { PAGINATION_CONFIG } from "@/config/pagination";

import { usePositionLevelsQuery } from "@/hooks/usePositionLevels";
import { useDeletePositionLevelMutation } from "@/hooks/usePositionLevels"; // Thêm hook delete (tạo nếu chưa có)

import ModalPositionLevel from "./modal.position-level";
import ViewDetailPositionLevel from "./view.position-level";

const PositionLevelPage = () => {
    const [openModal, setOpenModal] = useState(false);
    const [dataInit, setDataInit] = useState<IPositionLevel | null>(null);
    const [openViewDetail, setOpenViewDetail] = useState(false);

    const [searchValue, setSearchValue] = useState("");

    const tableRef = useRef<ActionType>(null);

    const [query, setQuery] = useState(
        `page=${PAGINATION_CONFIG.DEFAULT_PAGE}&size=${PAGINATION_CONFIG.DEFAULT_PAGE_SIZE}&sort=createdAt,desc`
    );

    const { data, isFetching, refetch } = usePositionLevelsQuery(query);
    const deleteMutation = useDeletePositionLevelMutation(); // Hook xóa

    const meta = data?.meta ?? { page: 1, pageSize: 10, total: 0 };
    const levels = data?.result ?? [];

    // AUTO BUILD QUERY WHEN SEARCH CHANGE
    useEffect(() => {
        const q: any = {
            page: PAGINATION_CONFIG.DEFAULT_PAGE,
            size: PAGINATION_CONFIG.DEFAULT_PAGE_SIZE,
            sort: "createdAt,desc",
        };

        const filters: string[] = [];

        if (searchValue)
            filters.push(`(code~'${searchValue}' or band~'${searchValue}')`);

        if (filters.length > 0) q.filter = filters.join(" and ");

        setQuery(queryString.stringify(q, { encode: false }));
    }, [searchValue]);

    // BUILD QUERY INSIDE TABLE
    const buildQuery = (params: any, sort: any) => {
        const q: any = {
            page: params.current,
            size: params.pageSize ?? PAGINATION_CONFIG.DEFAULT_PAGE_SIZE,
        };

        const filters: string[] = [];

        if (searchValue)
            filters.push(`(code~'${searchValue}' or band~'${searchValue}')`);

        if (filters.length > 0) q.filter = filters.join(" and ");

        let sortBy = "sort=createdAt,desc";

        if (sort?.code)
            sortBy = sort.code === "ascend" ? "sort=code,asc" : "sort=code,desc";

        return `${queryString.stringify(q, { encode: false })}&${sortBy}`;
    };

    // HANDLE DELETE
    const handleDelete = async (id: number) => {
        try {
            await deleteMutation.mutateAsync(id);
            refetch();
        } catch (error) {
            console.error("Xóa bậc chức danh thất bại:", error);
        }
    };

    // COLUMNS (bỏ cột Trạng thái, thêm nút Xóa)
    const columns: ProColumns<IPositionLevel>[] = [
        {
            title: "STT",
            width: 60,
            align: "center",
            render: (_, __, idx) => idx + 1 + (meta.page - 1) * meta.pageSize,
        },
        { title: "Code", dataIndex: "code", sorter: true },
        { title: "Band", dataIndex: "band" },
        {
            title: "Level",
            dataIndex: "levelNumber",
            render: (v) => <Tag color="purple">{v}</Tag>,
        },
        {
            title: "Hành động",
            align: "center",
            width: 160, // tăng width để chứa thêm nút Xóa
            render: (_, record) => (
                <Space size="middle">
                    {/* Xem chi tiết */}
                    <EyeOutlined
                        style={{ fontSize: 18, color: "#1677ff", cursor: "pointer" }}
                        onClick={() => {
                            setDataInit(record);
                            setOpenViewDetail(true);
                        }}
                    />

                    {/* Chỉnh sửa */}
                    <EditOutlined
                        style={{ fontSize: 18, color: "#fa8c16", cursor: "pointer" }}
                        onClick={() => {
                            setDataInit(record);
                            setOpenModal(true);
                        }}
                    />

                    {/* Xóa - có Popconfirm xác nhận */}
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
                </Space>
            ),
        },
    ];

    return (
        <PageContainer
            title="Quản lý bậc chức danh"
            filter={
                <SearchFilter
                    searchPlaceholder="Tìm theo code hoặc band..."
                    addLabel="Thêm bậc chức danh"
                    onSearch={(v) => setSearchValue(v)}
                    onReset={() => {
                        setSearchValue("");
                        refetch();
                    }}
                    onAddClick={() => {
                        setDataInit(null);
                        setOpenModal(true);
                    }}
                />
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