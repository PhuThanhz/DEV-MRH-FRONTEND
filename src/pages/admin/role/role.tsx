import { useState, useEffect, useRef } from "react";
import { Button, Popconfirm, Space, Tag } from "antd";
import { PlusOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";
import type { ActionType, ProColumns } from "@ant-design/pro-components";
import dayjs from "dayjs";
import queryString from "query-string";

import PageContainer from "@/components/common/data-table/PageContainer";
import DataTable from "@/components/common/data-table";
import SearchFilter from "@/components/common/filter/SearchFilter";

import type { IPermission, IRole } from "@/types/backend";
import { useRolesQuery, useDeleteRoleMutation } from "@/hooks/useRoles";
import { usePermissionsQuery } from "@/hooks/usePermissions";
import ModalRole from "@/pages/admin/role/modal.role";

import Access from "@/components/share/access";
import { ALL_PERMISSIONS } from "@/config/permissions";
import { PAGINATION_CONFIG } from "@/config/pagination";
import { sfLike } from "spring-filter-query-builder";
import { groupByPermission } from "@/config/utils";

const RolePage = () => {
    const [openModal, setOpenModal] = useState(false);
    const [listPermissions, setListPermissions] = useState<{ module: string; permissions: IPermission[]; }[] | null>(null);
    const [singleRole, setSingleRole] = useState<IRole | null>(null);

    const [query, setQuery] = useState<string>(
        `page=${PAGINATION_CONFIG.DEFAULT_PAGE}&size=${PAGINATION_CONFIG.DEFAULT_PAGE_SIZE}&sort=createdAt,desc`
    );

    const tableRef = useRef<ActionType>(null);

    // React Query
    const { data, isFetching, refetch } = useRolesQuery(query);
    const deleteRoleMutation = useDeleteRoleMutation();
    const { data: permissionsData } = usePermissionsQuery("page=1&size=500");

    useEffect(() => {
        if (permissionsData?.result) {
            setListPermissions(groupByPermission(permissionsData.result));
        }
    }, [permissionsData]);

    /** Xóa role */
    const handleDeleteRole = async (id?: string) => {
        if (!id) return;
        await deleteRoleMutation.mutateAsync(id, {
            onSuccess: () => refetch(),
        });
    };

    /** Tạo query filter */
    const buildQuery = (params: any, sort: any) => {
        const q: any = {
            page: params.current,
            size: params.pageSize || PAGINATION_CONFIG.DEFAULT_PAGE_SIZE,
        };

        if (params.name) q.filter = sfLike("name", params.name);

        let temp = queryString.stringify(q, { encode: false });
        let sortBy = "";

        if (sort?.name)
            sortBy = sort.name === "ascend" ? "sort=name,asc" : "sort=name,desc";
        else if (sort?.createdAt)
            sortBy = sort.createdAt === "ascend" ? "sort=createdAt,asc" : "sort=createdAt,desc";
        else
            sortBy = "sort=createdAt,desc";

        return `${temp}&${sortBy}`;
    };

    const meta = data?.meta ?? {
        page: PAGINATION_CONFIG.DEFAULT_PAGE,
        pageSize: PAGINATION_CONFIG.DEFAULT_PAGE_SIZE,
        total: 0,
    };
    const roles = data?.result ?? [];

    /** Reload bảng */
    const reloadTable = () => {
        setQuery(
            `page=${PAGINATION_CONFIG.DEFAULT_PAGE}&size=${PAGINATION_CONFIG.DEFAULT_PAGE_SIZE}&sort=createdAt,desc`
        );
    };

    /** Cấu hình cột */
    const columns: ProColumns<IRole>[] = [
        {
            title: "STT",
            key: "index",
            width: 60,
            align: "center",
            render: (_text, _record, index) =>
                index + 1 + ((meta.page || 1) - 1) * (meta.pageSize || 10),
            hideInSearch: true,
        },
        {
            title: "Tên vai trò",
            dataIndex: "name",
            sorter: true,
        },
        {
            title: "Trạng thái",
            dataIndex: "active",
            hideInSearch: true,
            render: (_, record) => (
                <Tag color={record.active ? "green" : "red"}>
                    {record.active ? "Đang hoạt động" : "Ngừng hoạt động"}
                </Tag>
            ),
        },
        {
            title: "Ngày tạo",
            dataIndex: "createdAt",
            sorter: true,
            hideInSearch: true,
            render: (_, record) =>
                record.createdAt ? dayjs(record.createdAt).format("DD-MM-YYYY HH:mm") : "-",
        },
        {
            title: "Ngày cập nhật",
            dataIndex: "updatedAt",
            sorter: true,
            hideInSearch: true,
            render: (_, record) =>
                record.updatedAt ? dayjs(record.updatedAt).format("DD-MM-YYYY HH:mm") : "-",
        },
        {
            title: "Hành động",
            hideInSearch: true,
            width: 120,
            align: "center",
            render: (_, entity) => (
                <Space>
                    <Access permission={ALL_PERMISSIONS.ROLES.UPDATE} hideChildren>
                        <Button
                            type="default"
                            size="small"
                            icon={<EditOutlined style={{ color: "#fa8c16" }} />}
                            onClick={() => {
                                setSingleRole(entity);
                                setOpenModal(true);
                            }}
                            style={{
                                borderRadius: 8,
                                borderColor: "#fa8c16",
                                color: "#fa8c16",
                                display: "flex",
                                alignItems: "center",
                                gap: 6,
                                fontWeight: 500,
                            }}
                        >
                            Cập nhật quyền
                        </Button>
                    </Access>


                    <Access permission={ALL_PERMISSIONS.ROLES.DELETE} hideChildren>
                        <Popconfirm
                            title="Xác nhận xóa vai trò"
                            description="Bạn có chắc chắn muốn xóa vai trò này?"
                            okText="Xóa"
                            cancelText="Hủy"
                            onConfirm={() => handleDeleteRole(entity.id)}
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
            title="Quản lý vai trò"
            filter={
                <SearchFilter
                    searchPlaceholder="Tìm kiếm vai trò..."
                    addLabel="Thêm vai trò"
                    onSearch={(val) =>
                        setQuery(
                            `page=${PAGINATION_CONFIG.DEFAULT_PAGE}&size=${PAGINATION_CONFIG.DEFAULT_PAGE_SIZE}&filter=${sfLike(
                                "name",
                                val
                            )}`
                        )
                    }
                    onReset={reloadTable}
                    onAddClick={() => {
                        setSingleRole(null);
                        setOpenModal(true);
                    }}
                    showFilterButton={false}
                />
            }
        >
            <Access permission={ALL_PERMISSIONS.ROLES.GET_PAGINATE}>
                <DataTable<IRole>
                    actionRef={tableRef}
                    rowKey="id"
                    loading={isFetching}
                    columns={columns}
                    dataSource={roles}
                    request={async (params, sort) => {
                        const q = buildQuery(params, sort);
                        setQuery(q);
                        return Promise.resolve({
                            data: roles,
                            success: true,
                            total: meta.total,
                        });
                    }}
                    pagination={{
                        defaultPageSize: PAGINATION_CONFIG.DEFAULT_PAGE_SIZE,
                        current: meta.page,
                        pageSize: meta.pageSize,
                        showSizeChanger: true,
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
                                vai trò
                            </div>
                        ),
                    }}
                    rowSelection={false}
                />
            </Access>

            {listPermissions && (
                <ModalRole
                    openModal={openModal}
                    setOpenModal={setOpenModal}
                    reloadTable={refetch}
                    listPermissions={listPermissions}
                    singleRole={singleRole}
                    setSingleRole={setSingleRole}
                />
            )}
        </PageContainer>
    );
};

export default RolePage;
