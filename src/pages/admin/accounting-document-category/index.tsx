import { useEffect, useRef, useState } from "react";
import { Space, Tag, Popconfirm } from "antd";
import {
    EditOutlined,
    PoweroffOutlined,
    DeleteOutlined,
} from "@ant-design/icons";
import type { ProColumns, ActionType } from "@ant-design/pro-components";
import queryString from "query-string";

import PageContainer from "@/components/common/data-table/PageContainer";
import DataTable from "@/components/common/data-table";
import SearchFilter from "@/components/common/filter/SearchFilter";
import AdvancedFilterSelect from "@/components/common/filter/AdvancedFilterSelect";

import type { IAccountingDocumentCategory } from "@/types/backend";
import Access from "@/components/share/access";
import { ALL_PERMISSIONS } from "@/config/permissions";
import { PAGINATION_CONFIG } from "@/config/pagination";
import {
    useAccountingDocumentCategoriesQuery,
    useToggleActiveAccountingDocumentCategoryMutation,
    useDeleteAccountingDocumentCategoryMutation,
} from "@/hooks/useAccountingDocumentCategories";

import ModalAccountingDocumentCategory from "./modal.accounting-document-category";

const AccountingDocumentCategoryPage = () => {
    const [openModal, setOpenModal] = useState(false);
    const [dataInit, setDataInit] = useState<IAccountingDocumentCategory | null>(null);

    const [searchValue, setSearchValue] = useState("");
    const [activeFilter, setActiveFilter] = useState<boolean | null>(null);

    const [query, setQuery] = useState(
        `page=${PAGINATION_CONFIG.DEFAULT_PAGE}&size=${PAGINATION_CONFIG.DEFAULT_PAGE_SIZE}&sort=createdAt,desc`
    );

    const tableRef = useRef<ActionType>(null);
    const { data, isFetching, refetch } = useAccountingDocumentCategoriesQuery(query);
    const toggleMutation = useToggleActiveAccountingDocumentCategoryMutation();
    const deleteMutation = useDeleteAccountingDocumentCategoryMutation();

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
        if (filters.length > 0) q.filter = filters.join(" and ");
        setQuery(queryString.stringify(q, { encode: false }));
    }, [searchValue, activeFilter]);

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

    const columns: ProColumns<IAccountingDocumentCategory>[] = [
        {
            title: "STT",
            key: "index",
            width: 60,
            align: "center",
            render: (_text, _record, index) =>
                index + 1 + ((meta.page || 1) - 1) * (meta.pageSize || 10),
        },
        {
            title: "Mã loại chứng từ",
            dataIndex: "categoryCode",
            sorter: true,
            width: 160,
            align: "center",
            render: (val) => (
                <Tag
                    style={{
                        borderRadius: 4,
                        padding: "0px 8px",
                        fontSize: 12,
                        fontWeight: 500,
                        height: 22,
                        lineHeight: "20px",
                        border: "1px solid #91caff",
                        background: "#e6f4ff",
                        color: "#0958d9",
                        fontFamily: "monospace",
                    }}
                >
                    {val}
                </Tag>
            ),
        },
        {
            title: "Tên loại chứng từ",
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
                    <Tag
                        style={{
                            borderRadius: 4,
                            padding: "0px 8px",
                            fontSize: 12,
                            fontWeight: 500,
                            height: 22,
                            lineHeight: "20px",
                            border: "1px solid #b7eb8f",
                            background: "#f6ffed",
                            color: "#389e0d",
                        }}
                    >
                        {val}
                    </Tag>
                ) : (
                    <span style={{ color: "#bfbfbf" }}>—</span>
                ),
        },
        {
            title: "Mô tả",
            dataIndex: "description",
            ellipsis: true,
            render: (val) =>
                val ? (
                    <span style={{ color: "#6b7280", fontSize: 13 }}>{val}</span>
                ) : (
                    <span style={{ color: "#d1d5db" }}>—</span>
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
            width: 130,
            fixed: "right",
            render: (_, entity) => (
                <Space size={8}>
                    <Access
                        permission={ALL_PERMISSIONS.ACCOUNTING_DOCUMENT_CATEGORIES.UPDATE}
                        hideChildren
                    >
                        <EditOutlined
                            data-guide-id="accounting-document-category-edit-button"
                            style={{ fontSize: 18, color: "#fa8c16", cursor: "pointer" }}
                            onClick={() => {
                                setDataInit(entity);
                                setOpenModal(true);
                            }}
                        />
                    </Access>

                    <Access
                        permission={ALL_PERMISSIONS.ACCOUNTING_DOCUMENT_CATEGORIES.TOGGLE_ACTIVE}
                        hideChildren
                    >
                        <Popconfirm
                            title={
                                entity.active
                                    ? "Xác nhận tắt loại chứng từ này?"
                                    : "Xác nhận bật loại chứng từ này?"
                            }
                            okText="Xác nhận"
                            cancelText="Huỷ"
                            placement="topRight"
                            onConfirm={() =>
                                entity.id && toggleMutation.mutate(entity.id)
                            }
                        >
                            <PoweroffOutlined
                                data-guide-id="accounting-document-category-status-button"
                                style={{
                                    fontSize: 18,
                                    color: entity.active ? "#52c41a" : "#d9d9d9",
                                    cursor: "pointer",
                                }}
                            />
                        </Popconfirm>
                    </Access>

                    <Access
                        permission={ALL_PERMISSIONS.ACCOUNTING_DOCUMENT_CATEGORIES.DELETE}
                        hideChildren
                    >
                        <Popconfirm
                            title="Xác nhận xóa loại chứng từ này?"
                            description="Không thể xóa nếu đang có chứng từ sử dụng loại này."
                            okText="Xóa"
                            cancelText="Huỷ"
                            okButtonProps={{ danger: true }}
                            placement="topRight"
                            onConfirm={() =>
                                entity.id && deleteMutation.mutate(entity.id)
                            }
                        >
                            <DeleteOutlined
                                data-guide-id="accounting-document-category-delete-button"
                                style={{
                                    fontSize: 18,
                                    color: "#ff4d4f",
                                    cursor: "pointer",
                                }}
                            />
                        </Popconfirm>
                    </Access>
                </Space>
            ),
        },
    ];

    return (
        <PageContainer
            title="Loại chứng từ kế toán"
            filter={
                <div className="flex flex-col gap-3">
                    <SearchFilter
                        searchPlaceholder="Tìm theo mã hoặc tên loại chứng từ..."
                        addLabel="Thêm loại chứng từ"
                        showFilterButton={false}
                        onSearch={(val) => setSearchValue(val)}
                        onReset={() => refetch()}
                        onAddClick={() => {
                            setDataInit(null);
                            setOpenModal(true);
                        }}
                        addPermission={ALL_PERMISSIONS.ACCOUNTING_DOCUMENT_CATEGORIES.CREATE}
                        guideSearchId="accounting-document-category-search-input"
                        guideAddId="accounting-document-category-add-button"
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
                            ]}
                            onChange={(filters) => {
                                setActiveFilter(
                                    filters.active !== undefined ? filters.active : null
                                );
                            }}
                        />
                    </div>
                </div>
            }
        >
            <Access permission={ALL_PERMISSIONS.ACCOUNTING_DOCUMENT_CATEGORIES.GET_PAGINATE}>
                <DataTable<IAccountingDocumentCategory>
                    actionRef={tableRef}
                    rowKey="id"
                    loading={isFetching}
                    columns={columns}
                    dataSource={categories}
                    scroll={{ x: 900 }}
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
                                loại chứng từ
                            </div>
                        ),
                    }}
                    rowSelection={false}
                />
            </Access>

            <ModalAccountingDocumentCategory
                openModal={openModal}
                setOpenModal={setOpenModal}
                dataInit={dataInit}
                setDataInit={setDataInit}
            />
        </PageContainer>
    );
};

export default AccountingDocumentCategoryPage;
