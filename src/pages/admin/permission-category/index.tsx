import { useEffect, useRef, useState } from "react";
import { Space, Tag, Popconfirm, Card } from "antd";
import {
    EyeOutlined,
    EditOutlined,
    StopOutlined,
    FileTextOutlined,
} from "@ant-design/icons";
import type { ProColumns, ActionType } from "@ant-design/pro-components";
import queryString from "query-string";

import PageContainer from "@/components/common/data-table/PageContainer";
import DataTable from "@/components/common/data-table";
import SearchFilter from "@/components/common/filter/SearchFilter";

import { PAGINATION_CONFIG } from "@/config/pagination";
import { ALL_PERMISSIONS } from "@/config/permissions";
import Access from "@/components/share/access";

import type { IPermissionCategory } from "@/types/backend";
import {
    usePermissionCategoryQuery,
    useDeletePermissionCategoryMutation,
} from "@/hooks/usePermissionCategory";

import ModalCategory from "./modal.permission-category";
import ViewCategory from "./view.permission-category";
import DrawerPermissionContent from "./content/drawer.permission-content";

const PermissionCategoryPage = () => {
    const [openModal, setOpenModal] = useState(false);
    const [openView, setOpenView] = useState(false);

    // Drawer nội dung
    const [openContentDrawer, setOpenContentDrawer] = useState(false);
    const [selectedCategory, setSelectedCategory] =
        useState<IPermissionCategory | null>(null);

    const [dataInit, setDataInit] = useState<IPermissionCategory | null>(null);
    const [searchValue, setSearchValue] = useState("");

    const [query, setQuery] = useState(
        `page=${PAGINATION_CONFIG.DEFAULT_PAGE}&size=${PAGINATION_CONFIG.DEFAULT_PAGE_SIZE}&sort=createdAt,desc`
    );

    const tableRef = useRef<ActionType>(null);

    const { data, isFetching } = usePermissionCategoryQuery(query);
    const deleteMutation = useDeletePermissionCategoryMutation();

    const meta = data?.meta ?? {
        page: PAGINATION_CONFIG.DEFAULT_PAGE,
        pageSize: PAGINATION_CONFIG.DEFAULT_PAGE_SIZE,
        total: 0,
    };

    const categories = data?.result ?? [];

    /* ===================== BUILD QUERY ===================== */
    useEffect(() => {
        const q: any = {
            page: PAGINATION_CONFIG.DEFAULT_PAGE,
            size: PAGINATION_CONFIG.DEFAULT_PAGE_SIZE,
            sort: "createdAt,desc",
        };

        if (searchValue) {
            q.filter = `(name~'${searchValue}' or code~'${searchValue}')`;
        }

        setQuery(queryString.stringify(q, { encode: false }));
    }, [searchValue]);

    /* ===================== COLUMNS ===================== */
    const columns: ProColumns<IPermissionCategory>[] = [
        {
            title: "STT",
            key: "index",
            width: 60,
            align: "center",
            render: (_, __, index) =>
                index + 1 + ((meta.page || 1) - 1) * (meta.pageSize || 10),
        },
        {
            title: "Mã danh mục",
            dataIndex: "code",
            sorter: true,
            width: 150,
            render: (text) => (
                <Tag color="magenta" style={{ fontFamily: "monospace" }}>
                    {text}
                </Tag>
            ),
        },
        {
            title: "Tên danh mục",
            dataIndex: "name",
            sorter: true,
            width: 250,
            render: (text) => <span style={{ fontWeight: 500 }}>{text}</span>,
        },
        {
            title: "Phòng ban",
            dataIndex: "departmentName",
            width: 200,
            render: (_, record) =>
                record.departmentName ? (
                    <Tag color="blue">{record.departmentName}</Tag>
                ) : (
                    <span>--</span>
                ),
        },
        {
            title: "Trạng thái",
            dataIndex: "active",
            width: 130,
            align: "center",
            render: (_, record) =>
                record.active ? (
                    <Tag color="green">Hoạt động</Tag>
                ) : (
                    <Tag color="red">Ngưng</Tag>
                ),
        },
        {
            title: "Hành động",
            width: 200,
            align: "center",
            render: (_, entity) => (
                <Space>
                    {/* VIEW */}
                    <Access
                        permission={ALL_PERMISSIONS.PERMISSION_CATEGORY.GET_BY_ID}
                        hideChildren
                    >
                        <EyeOutlined
                            style={{
                                fontSize: 18,
                                color: "#1677ff",
                                cursor: "pointer",
                            }}
                            onClick={() => {
                                setDataInit(entity);
                                setOpenView(true);
                            }}
                        />
                    </Access>

                    {/* CONTENT */}
                    <Access
                        permission={ALL_PERMISSIONS.PERMISSION_CONTENT.GET_PAGINATE}
                        hideChildren
                    >
                        <FileTextOutlined
                            style={{
                                fontSize: 18,
                                color: "#52c41a",
                                cursor: "pointer",
                            }}
                            onClick={() => {
                                setSelectedCategory(entity);
                                setOpenContentDrawer(true);
                            }}
                        />
                    </Access>

                    {/* EDIT */}
                    <Access
                        permission={ALL_PERMISSIONS.PERMISSION_CATEGORY.UPDATE}
                        hideChildren
                    >
                        <EditOutlined
                            style={{
                                fontSize: 18,
                                color: "#fa8c16",
                                cursor: "pointer",
                            }}
                            onClick={() => {
                                setDataInit(entity);
                                setOpenModal(true);
                            }}
                        />
                    </Access>

                    {/* DELETE */}
                    <Access
                        permission={ALL_PERMISSIONS.PERMISSION_CATEGORY.DELETE}
                        hideChildren
                    >
                        <Popconfirm
                            title="Ngưng sử dụng danh mục này?"
                            onConfirm={() =>
                                entity.id && deleteMutation.mutate(entity.id)
                            }
                        >
                            <StopOutlined
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
            title="Quản lý danh mục phân quyền"
            filter={
                <SearchFilter
                    searchPlaceholder="Tìm kiếm theo tên hoặc mã danh mục..."
                    addLabel="Thêm danh mục"
                    showFilterButton={false}
                    onSearch={setSearchValue}
                    onReset={() => setSearchValue("")}
                    onAddClick={() => {
                        setDataInit(null);
                        setOpenModal(true);
                    }}
                />
            }
        >
            <Access permission={ALL_PERMISSIONS.PERMISSION_CATEGORY.GET_PAGINATE}>
                <DataTable<IPermissionCategory>
                    actionRef={tableRef}
                    rowKey="id"
                    loading={isFetching}
                    columns={columns}
                    dataSource={categories}
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
            <ModalCategory
                open={openModal}
                setOpen={setOpenModal}
                dataInit={dataInit}
                setDataInit={setDataInit}
            />

            <ViewCategory
                open={openView}
                setOpen={setOpenView}
                dataInit={dataInit}
                setDataInit={setDataInit}
            />

            {/* ===== DRAWER CONTENT ===== */}
            <DrawerPermissionContent
                open={openContentDrawer}
                setOpen={setOpenContentDrawer}
                category={selectedCategory}
            />
        </PageContainer>
    );
};

export default PermissionCategoryPage;