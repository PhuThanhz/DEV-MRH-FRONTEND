import { useEffect, useRef, useState } from "react";
import { Space, Tag, Badge, Popconfirm } from "antd";
import {
    EditOutlined,
    EyeOutlined,
    PoweroffOutlined,
} from "@ant-design/icons";
import type { ProColumns, ActionType } from "@ant-design/pro-components";
import queryString from "query-string";

import PageContainer from "@/components/common/data-table/PageContainer";
import DataTable from "@/components/common/data-table";
import SearchFilter from "@/components/common/filter/SearchFilter";
import AdvancedFilterSelect from "@/components/common/filter/AdvancedFilterSelect";

import type { IDocumentCategory } from "@/types/backend";
import Access from "@/components/share/access";
import { ALL_PERMISSIONS } from "@/config/permissions";
import { PAGINATION_CONFIG } from "@/config/pagination";
import {
    useDocumentCategoriesQuery,
    useToggleActiveDocumentCategoryMutation,
} from "@/hooks/useDocumentCategories";

import ModalDocumentCategory from "./modal.document-category";
import ViewDetailDocumentCategory from "./view.document-category";
import ActionButton from "@/components/common/ui/ActionButton";

const DocumentCategoryPage = () => {
    const [openModal, setOpenModal] = useState(false);
    const [dataInit, setDataInit] = useState<IDocumentCategory | null>(null);
    const [openViewDetail, setOpenViewDetail] = useState(false);

    const [searchValue, setSearchValue] = useState("");
    const [activeFilter, setActiveFilter] = useState<boolean | null>(null);
    const [mappingFilter, setMappingFilter] = useState<boolean | null>(null);

    const [query, setQuery] = useState(
        `page=${PAGINATION_CONFIG.DEFAULT_PAGE}&size=${PAGINATION_CONFIG.DEFAULT_PAGE_SIZE}&sort=createdAt,desc`
    );

    const tableRef = useRef<ActionType>(null);
    const { data, isFetching, refetch } = useDocumentCategoriesQuery(query);
    const toggleMutation = useToggleActiveDocumentCategoryMutation();

    useEffect(() => {
        const q: any = {
            page: PAGINATION_CONFIG.DEFAULT_PAGE,
            size: PAGINATION_CONFIG.DEFAULT_PAGE_SIZE,
            sort: "createdAt,desc",
        };
        const filters: string[] = [];
        if (searchValue)
            filters.push(
                `(categoryCode~'${searchValue}' or categoryName~'${searchValue}')`
            );
        if (activeFilter !== null) filters.push(`active=${activeFilter}`);
        if (mappingFilter !== null)
            filters.push(`mappingProcedure=${mappingFilter}`);
        if (filters.length > 0) q.filter = filters.join(" and ");
        setQuery(queryString.stringify(q, { encode: false }));
    }, [searchValue, activeFilter, mappingFilter]);

    const meta = data?.meta ?? {
        page: PAGINATION_CONFIG.DEFAULT_PAGE,
        pageSize: PAGINATION_CONFIG.DEFAULT_PAGE_SIZE,
        total: 0,
    };
    const categories = data?.result ?? [];

    const buildQuery = (params: any, sort: any) => {
        const q: any = {
            page: params.current,
            size: params.pageSize || PAGINATION_CONFIG.DEFAULT_PAGE_SIZE,
        };
        const filters: string[] = [];
        if (searchValue)
            filters.push(
                `(categoryCode~'${searchValue}' or categoryName~'${searchValue}')`
            );
        if (activeFilter !== null) filters.push(`active=${activeFilter}`);
        if (mappingFilter !== null)
            filters.push(`mappingProcedure=${mappingFilter}`);
        if (filters.length > 0) q.filter = filters.join(" and ");

        const temp = queryString.stringify(q, { encode: false });
        let sortBy = "sort=createdAt,desc";
        if (sort?.categoryCode)
            sortBy =
                sort.categoryCode === "ascend"
                    ? "sort=categoryCode,asc"
                    : "sort=categoryCode,desc";
        else if (sort?.categoryName)
            sortBy =
                sort.categoryName === "ascend"
                    ? "sort=categoryName,asc"
                    : "sort=categoryName,desc";
        return `${temp}&${sortBy}`;
    };

    const columns: ProColumns<IDocumentCategory>[] = [
        {
            title: "STT",
            key: "index",
            width: 60,
            align: "center",
            render: (_text, _record, index) =>
                index + 1 + ((meta.page || 1) - 1) * (meta.pageSize || 10),
        },
        {
            title: "Mã danh mục",
            dataIndex: "categoryCode",
            sorter: true,
            width: 140,
            align: "center",
            render: (val) => (
                <Tag style={{
                    borderRadius: 4, padding: "0px 8px", fontSize: 12,
                    fontWeight: 500, height: 22, lineHeight: "20px",
                    border: "1px solid #AFA9EC", background: "#EEEDFE",
                    color: "#3C3489", fontFamily: "monospace",
                }}>
                    {val}
                </Tag>
            ),
        },
        {
            title: "Tên danh mục",
            dataIndex: "categoryName",
            sorter: true,
            render: (val) => <span style={{ fontWeight: 500 }}>{val}</span>,
        },
        {
            title: "Ký hiệu",
            dataIndex: "symbol",
            width: 110,
            align: "center",
            render: (val) =>
                val ? (
                    <Tag style={{
                        borderRadius: 4, padding: "0px 8px", fontSize: 12,
                        fontWeight: 500, height: 22, lineHeight: "20px",
                        border: "1px solid #91caff", background: "#e6f4ff", color: "#0958d9",
                    }}>
                        {val}
                    </Tag>
                ) : (
                    <span style={{ color: "#bfbfbf" }}>—</span>
                ),
        },
        {
            title: "Mapping quy trình",
            dataIndex: "mappingProcedure",
            width: 160,
            align: "center",
            render: (val) =>
                val ? (
                    <Tag style={{
                        borderRadius: 4, padding: "0px 8px", fontSize: 12,
                        fontWeight: 500, height: 22, lineHeight: "20px",
                        border: "1px solid #b7eb8f", background: "#f6ffed", color: "#389e0d",
                    }}>
                        Có mapping
                    </Tag>
                ) : (
                    <Tag style={{
                        borderRadius: 4, padding: "0px 8px", fontSize: 12,
                        fontWeight: 500, height: 22, lineHeight: "20px",
                        border: "1px solid #e5e7eb", background: "#f9fafb", color: "#9ca3af",
                    }}>
                        Không
                    </Tag>
                ),
        },
        {
            title: "Liên công ty",
            dataIndex: "isCrossCompany",
            width: 130,
            align: "center",
            render: (val) =>
                val ? (
                    <Tag style={{
                        borderRadius: 4, padding: "0px 8px", fontSize: 12,
                        fontWeight: 500, height: 22, lineHeight: "20px",
                        border: "1px solid #87e8de", background: "#e6fffb", color: "#08979c",
                    }}>
                        Liên công ty
                    </Tag>
                ) : (
                    <Tag style={{
                        borderRadius: 4, padding: "0px 8px", fontSize: 12,
                        fontWeight: 500, height: 22, lineHeight: "20px",
                        border: "1px solid #e5e7eb", background: "#f9fafb", color: "#9ca3af",
                    }}>
                        Nội bộ
                    </Tag>
                ),
        },
        {
            title: "Trạng thái",
            dataIndex: "active",
            width: 150,
            align: "center",
            render: (_, record) => {
                const isActive = record.active === true;
                return (
                    <Tag style={{
                        borderRadius: 4, padding: "0px 8px", fontSize: 12,
                        fontWeight: 500, height: 22, lineHeight: "20px",
                        border: `1px solid ${isActive ? "#b7eb8f" : "#ffccc7"}`,
                        background: isActive ? "#f6ffed" : "#fff2f0",
                        color: isActive ? "#389e0d" : "#cf1322",
                    }}>
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
            render: (_, entity) => (
                <Space size={4}>
                    <Access
                        permission={ALL_PERMISSIONS.DOCUMENT_CATEGORIES.GET_BY_ID}
                        hideChildren
                    >
                        <ActionButton
                            variant="view"
                            tooltip="Xem chi tiết"
                            icon={<EyeOutlined />}
                            data-guide-id="document-category-detail-button"
                            onClick={() => {
                                setDataInit(entity);
                                setOpenViewDetail(true);
                            }}
                            aria-label="Xem chi tiết"
                        />
                    </Access>

                    <Access
                        permission={ALL_PERMISSIONS.DOCUMENT_CATEGORIES.UPDATE}
                        hideChildren
                    >
                        <ActionButton
                            variant="edit"
                            tooltip="Chỉnh sửa"
                            icon={<EditOutlined />}
                            data-guide-id="document-category-edit-button"
                            onClick={() => {
                                setDataInit(entity);
                                setOpenModal(true);
                            }}
                            aria-label="Chỉnh sửa"
                        />
                    </Access>

                    <Access
                        permission={ALL_PERMISSIONS.DOCUMENT_CATEGORIES.TOGGLE_ACTIVE}
                        hideChildren
                    >
                        <Popconfirm
                            title={
                                entity.active
                                    ? "Xác nhận tắt danh mục này?"
                                    : "Xác nhận bật danh mục này?"
                            }
                            okText="Xác nhận"
                            cancelText="Huỷ"
                            placement="topRight"
                            onConfirm={() =>
                                entity.id && toggleMutation.mutate(entity.id)
                            }
                        >
                            <ActionButton
                                variant={entity.active ? "danger" : "success"}
                                tooltip={entity.active ? "Ngừng hoạt động" : "Kích hoạt"}
                                icon={<PoweroffOutlined />}
                                data-guide-id="document-category-status-button"
                                aria-label={entity.active ? "Ngừng hoạt động" : "Kích hoạt"}
                            />
                        </Popconfirm>
                    </Access>
                </Space>
            ),
        },
    ];

    return (
        <PageContainer
            title="Danh mục loại văn bản"
            filter={
                <div className="flex flex-col gap-3">
                    <SearchFilter
                        searchPlaceholder="Tìm theo mã hoặc tên danh mục..."
                        addLabel="Thêm danh mục"
                        showFilterButton={false}
                        onSearch={(val) => setSearchValue(val)}
                        onReset={() => refetch()}
                        onAddClick={() => {
                            setDataInit(null);
                            setOpenModal(true);
                        }}
                        addPermission={ALL_PERMISSIONS.DOCUMENT_CATEGORIES.CREATE}
                        guideSearchId="document-category-search-input"
                        guideAddId="document-category-add-button"
                    />
                    <div className="flex flex-wrap gap-3 items-center">
                        <AdvancedFilterSelect
                            fields={[
                                {
                                    key: "active",
                                    label: "Trạng thái",
                                    options: [
                                        {
                                            label: "Đang hoạt động",
                                            value: true,
                                            color: "green",
                                        },
                                        {
                                            label: "Ngừng hoạt động",
                                            value: false,
                                            color: "red",
                                        },
                                    ],
                                },
                                {
                                    key: "mappingProcedure",
                                    label: "Mapping quy trình",
                                    options: [
                                        { label: "Có mapping", value: true, color: "blue" },
                                        { label: "Không mapping", value: false, color: "default" },
                                    ],
                                },
                            ]}
                            onChange={(filters) => {
                                setActiveFilter(
                                    filters.active !== undefined ? filters.active : null
                                );
                                setMappingFilter(
                                    filters.mappingProcedure !== undefined
                                        ? filters.mappingProcedure
                                        : null
                                );
                            }}
                        />
                    </div>
                </div>
            }
        >
            <Access permission={ALL_PERMISSIONS.DOCUMENT_CATEGORIES.GET_PAGINATE}>
                <DataTable<IDocumentCategory>
                    actionRef={tableRef}
                    rowKey="id"
                    loading={isFetching}
                    columns={columns}
                    dataSource={categories}
                    scroll={{ x: "max-content" }}
                    request={async (params, sort) => {
                        const q = buildQuery(params, sort);
                        setQuery(q);
                        return Promise.resolve({
                            data: categories,
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
                                danh mục
                            </div>
                        ),
                    }}
                    rowSelection={false}
                />
            </Access>

            <ModalDocumentCategory
                openModal={openModal}
                setOpenModal={setOpenModal}
                dataInit={dataInit}
                setDataInit={setDataInit}
            />

            <ViewDetailDocumentCategory
                open={openViewDetail}
                onClose={setOpenViewDetail}
                dataInit={dataInit}
                setDataInit={setDataInit}
            />
        </PageContainer>
    );
};

export default DocumentCategoryPage;
