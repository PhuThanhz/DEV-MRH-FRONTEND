import { useEffect, useRef, useState } from "react";
import { Space, Tag, Badge, Popconfirm } from "antd";
import {
    EditOutlined,
    EyeOutlined,
    DeleteOutlined,
    PoweroffOutlined,
} from "@ant-design/icons";
import type { ProColumns, ActionType } from "@ant-design/pro-components";
import queryString from "query-string";
import dayjs from "dayjs";

import PageContainer from "@/components/common/data-table/PageContainer";
import DataTable from "@/components/common/data-table";
import SearchFilter from "@/components/common/filter/SearchFilter";
import AdvancedFilterSelect from "@/components/common/filter/AdvancedFilterSelect";
import DateRangeFilter from "@/components/common/filter/DateRangeFilter";

import type { IDocument } from "@/types/backend";
import Access from "@/components/share/access";
import { ALL_PERMISSIONS } from "@/config/permissions";
import { PAGINATION_CONFIG } from "@/config/pagination";
import {
    useDocumentsQuery,
    useToggleActiveDocumentMutation,
    useDeleteDocumentMutation,
} from "@/hooks/useDocuments";
import { useDocumentCategoriesActiveQuery } from "@/hooks/useDocumentCategories";

import ModalDocument from "./modal.document";
import ViewDetailDocument from "./view.document";

const STATUS_COLOR: Record<string, string> = {
    NEED_CREATE: "default",
    IN_PROGRESS: "processing",
    NEED_UPDATE: "warning",
    TERMINATED: "error",
};

const STATUS_LABEL: Record<string, string> = {
    NEED_CREATE: "Cần tạo",
    IN_PROGRESS: "Đang hiệu lực",
    NEED_UPDATE: "Cần cập nhật",
    TERMINATED: "Đã huỷ",
};

const DocumentPage = () => {
    const [openModal, setOpenModal] = useState(false);
    const [dataInit, setDataInit] = useState<IDocument | null>(null);
    const [openViewDetail, setOpenViewDetail] = useState(false);

    const [searchValue, setSearchValue] = useState("");
    const [activeFilter, setActiveFilter] = useState<boolean | null>(null);
    const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
    const [issuedDateFilter, setIssuedDateFilter] = useState<string | null>(null);

    const [query, setQuery] = useState(
        `page=${PAGINATION_CONFIG.DEFAULT_PAGE}&size=${PAGINATION_CONFIG.DEFAULT_PAGE_SIZE}&sort=createdAt,desc`
    );

    const tableRef = useRef<ActionType>(null);
    const { data, isFetching, refetch } = useDocumentsQuery(query);
    const toggleMutation = useToggleActiveDocumentMutation();
    const deleteMutation = useDeleteDocumentMutation();
    const { data: categoriesActive } = useDocumentCategoriesActiveQuery();

    const categoryOptions =
        categoriesActive?.map((c) => ({
            label: c.categoryName,
            value: String(c.id),
            color: "blue",
        })) ?? [];

    useEffect(() => {
        const q: any = {
            page: PAGINATION_CONFIG.DEFAULT_PAGE,
            size: PAGINATION_CONFIG.DEFAULT_PAGE_SIZE,
            sort: "createdAt,desc",
        };
        const filters: string[] = [];
        if (searchValue)
            filters.push(
                `(documentCode~'${searchValue}' or documentName~'${searchValue}')`
            );
        if (activeFilter !== null) filters.push(`active=${activeFilter}`);
        if (categoryFilter) filters.push(`category.id=${categoryFilter}`);
        if (issuedDateFilter) filters.push(issuedDateFilter);
        if (filters.length > 0) q.filter = filters.join(" and ");
        setQuery(queryString.stringify(q, { encode: false }));
    }, [searchValue, activeFilter, categoryFilter, issuedDateFilter]);

    const meta = data?.meta ?? {
        page: PAGINATION_CONFIG.DEFAULT_PAGE,
        pageSize: PAGINATION_CONFIG.DEFAULT_PAGE_SIZE,
        total: 0,
    };
    const documents = data?.result ?? [];

    const buildQuery = (params: any, sort: any) => {
        const q: any = {
            page: params.current,
            size: params.pageSize || PAGINATION_CONFIG.DEFAULT_PAGE_SIZE,
        };
        const filters: string[] = [];
        if (searchValue)
            filters.push(
                `(documentCode~'${searchValue}' or documentName~'${searchValue}')`
            );
        if (activeFilter !== null) filters.push(`active=${activeFilter}`);
        if (categoryFilter) filters.push(`category.id=${categoryFilter}`);
        if (issuedDateFilter) filters.push(issuedDateFilter);
        if (filters.length > 0) q.filter = filters.join(" and ");

        let temp = queryString.stringify(q, { encode: false });
        let sortBy = "sort=createdAt,desc";
        if (sort?.documentCode)
            sortBy =
                sort.documentCode === "ascend"
                    ? "sort=documentCode,asc"
                    : "sort=documentCode,desc";
        else if (sort?.documentName)
            sortBy =
                sort.documentName === "ascend"
                    ? "sort=documentName,asc"
                    : "sort=documentName,desc";
        return `${temp}&${sortBy}`;
    };

    const columns: ProColumns<IDocument>[] = [
        {
            title: "STT",
            key: "index",
            width: 60,
            align: "center",
            render: (_text, _record, index) =>
                index + 1 + ((meta.page || 1) - 1) * (meta.pageSize || 10),
        },
        {
            title: "Mã văn bản",
            dataIndex: "documentCode",
            sorter: true,
            width: 150,
            render: (_, record) => <Tag color="blue">{record.documentCode}</Tag>,
        },
        {
            title: "Trạng thái",
            dataIndex: "status",
            width: 140,
            align: "center",
            render: (_, record) =>
                record.status ? (
                    <Tag color={STATUS_COLOR[record.status] || "default"}>
                        {STATUS_LABEL[record.status] || record.status}
                    </Tag>
                ) : "—",
        },
        {
            title: "Ngày ban hành",
            dataIndex: "issuedDate",
            width: 140,
            align: "center",
            render: (_, record) =>
                record.issuedDate ? dayjs(record.issuedDate).format("DD/MM/YYYY") : "—",
        },
        {
            title: "Kích hoạt",
            dataIndex: "active",
            width: 120,
            align: "center",
            render: (_, record) =>
                record.active ? (
                    <Badge status="success" text="Hoạt động" />
                ) : (
                    <Badge status="error" text="Tắt" />
                ),
        },
        {
            title: "Hành động",
            align: "center",
            width: 160,
            render: (_, entity) => (
                <Space>
                    <Access
                        permission={ALL_PERMISSIONS.DOCUMENTS.GET_BY_ID}
                        hideChildren
                    >
                        <EyeOutlined
                            style={{ fontSize: 18, color: "#1677ff", cursor: "pointer" }}
                            onClick={() => {
                                setDataInit(entity);
                                setOpenViewDetail(true);
                            }}
                        />
                    </Access>

                    <Access
                        permission={ALL_PERMISSIONS.DOCUMENTS.UPDATE}
                        hideChildren
                    >
                        <EditOutlined
                            style={{ fontSize: 18, color: "#fa8c16", cursor: "pointer" }}
                            onClick={() => {
                                setDataInit(entity);
                                setOpenModal(true);
                            }}
                        />
                    </Access>

                    <Access
                        permission={ALL_PERMISSIONS.DOCUMENTS.TOGGLE_ACTIVE}
                        hideChildren
                    >
                        <Popconfirm
                            title={
                                entity.active
                                    ? "Xác nhận tắt văn bản này?"
                                    : "Xác nhận bật văn bản này?"
                            }
                            okText="Xác nhận"
                            cancelText="Huỷ"
                            onConfirm={() =>
                                entity.id && toggleMutation.mutate(entity.id)
                            }
                        >
                            <PoweroffOutlined
                                style={{
                                    fontSize: 18,
                                    color: entity.active ? "#52c41a" : "#d9d9d9",
                                    cursor: "pointer",
                                }}
                            />
                        </Popconfirm>
                    </Access>

                    <Access
                        permission={ALL_PERMISSIONS.DOCUMENTS.DELETE}
                        hideChildren
                    >
                        <Popconfirm
                            title="Xác nhận xoá văn bản này?"
                            okText="Xoá"
                            cancelText="Huỷ"
                            okButtonProps={{ danger: true }}
                            onConfirm={() =>
                                entity.id && deleteMutation.mutate(entity.id)
                            }
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
            title="Quản lý văn bản"
            filter={
                <div className="flex flex-col gap-3">
                    <SearchFilter
                        searchPlaceholder="Tìm theo mã hoặc tên văn bản..."
                        addLabel="Thêm văn bản"
                        showFilterButton={false}
                        onSearch={(val) => setSearchValue(val)}
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
                                    key: "category",
                                    label: "Loại văn bản",
                                    options: categoryOptions,
                                },
                                {
                                    key: "active",
                                    label: "Trạng thái",
                                    options: [
                                        { label: "Hoạt động", value: true, color: "green" },
                                        { label: "Tắt", value: false, color: "red" },
                                    ],
                                },
                            ]}
                            onChange={(filters) => {
                                setCategoryFilter(filters.category || null);
                                setActiveFilter(
                                    filters.active !== undefined ? filters.active : null
                                );
                            }}
                        />
                        <DateRangeFilter
                            fieldName="issuedDate"
                            onChange={(filter) => setIssuedDateFilter(filter)}
                        />
                    </div>
                </div>
            }
        >
            <Access permission={ALL_PERMISSIONS.DOCUMENTS.GET_PAGINATE}>
                <DataTable<IDocument>
                    actionRef={tableRef}
                    rowKey="id"
                    loading={isFetching}
                    columns={columns}
                    dataSource={documents}
                    request={async (params, sort) => {
                        const q = buildQuery(params, sort);
                        setQuery(q);
                        return Promise.resolve({
                            data: documents,
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
                        showTotal: (total, range) => (
                            <div style={{ fontSize: 13 }}>
                                <span style={{ fontWeight: 500 }}>
                                    {range[0]}–{range[1]}
                                </span>{" "}
                                trên{" "}
                                <span style={{ fontWeight: 600, color: "#1677ff" }}>
                                    {total.toLocaleString()}
                                </span>{" "}
                                văn bản
                            </div>
                        ),
                    }}
                    rowSelection={false}
                />
            </Access>

            <ModalDocument
                openModal={openModal}
                setOpenModal={setOpenModal}
                dataInit={dataInit}
                setDataInit={setDataInit}
            />

            <ViewDetailDocument
                open={openViewDetail}
                onClose={setOpenViewDetail}
                dataInit={dataInit}
                setDataInit={setDataInit}
            />
        </PageContainer>
    );
};

export default DocumentPage;