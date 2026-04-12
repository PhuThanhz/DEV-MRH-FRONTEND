import { useRef, useState } from "react";
import { Button, Popconfirm, Space } from "antd";
import {
    EditOutlined,
    DeleteOutlined,
} from "@ant-design/icons";
import type { ProColumns, ActionType } from "@ant-design/pro-components";
import queryString from "query-string";

import PageContainer from "@/components/common/data-table/PageContainer";
import DataTable from "@/components/common/data-table";
import SearchFilter from "@/components/common/filter/SearchFilter";

import type { IPermission } from "@/types/backend";
import Access from "@/components/share/access";
import { ALL_PERMISSIONS } from "@/config/permissions";
import { PAGINATION_CONFIG } from "@/config/pagination";
import { colorMethod } from "@/config/utils";

import {
    usePermissionsQuery,
    useDeletePermissionMutation,
} from "@/hooks/usePermissions";
import ModalPermission from "@/pages/admin/permission/modal.permission";
import ViewDetailPermission from "@/pages/admin/permission/view.permission";

const PermissionPage = () => {
    const [openModal, setOpenModal] = useState(false);
    const [dataInit, setDataInit] = useState<IPermission | null>(null);
    const [openViewDetail, setOpenViewDetail] = useState(false);

    const [query, setQuery] = useState<string>(
        `page=${PAGINATION_CONFIG.DEFAULT_PAGE}&size=${PAGINATION_CONFIG.DEFAULT_PAGE_SIZE}&sort=${PAGINATION_CONFIG.DEFAULT_SORT}`
    );

    const tableRef = useRef<ActionType>(null);

    const { data, isFetching } = usePermissionsQuery(query);
    const deleteMutation = useDeletePermissionMutation();

    const meta = data?.meta ?? {
        page: PAGINATION_CONFIG.DEFAULT_PAGE,
        pageSize: PAGINATION_CONFIG.DEFAULT_PAGE_SIZE,
        total: 0,
    };
    const permissions = data?.result ?? [];

    const handleDelete = async (id?: string) => {
        if (!id) return;
        await deleteMutation.mutateAsync(id, {
            onSuccess: () => reloadTable(),
        });
    };

    const reloadTable = () => {
        setQuery(
            `page=${PAGINATION_CONFIG.DEFAULT_PAGE}&size=${PAGINATION_CONFIG.DEFAULT_PAGE_SIZE}&sort=${PAGINATION_CONFIG.DEFAULT_SORT}`
        );
    };

    const buildQuery = (params: any, sort: any) => {
        const q: any = {
            page: params.current,
            size: params.pageSize || PAGINATION_CONFIG.DEFAULT_PAGE_SIZE,
        };

        if (params.name) {
            q.filter = `name ~ '${params.name}'`;
        }

        let temp = queryString.stringify(q, { encode: false });

        const sortableFields = ["name", "apiPath", "method", "module"];
        let sortBy = "";

        if (sort) {
            for (const field of sortableFields) {
                if (sort[field]) {
                    sortBy = `sort=${field},${sort[field] === "ascend" ? "asc" : "desc"}`;
                    break;
                }
            }
        }

        if (!sortBy) temp += `&sort=updatedAt,desc`;
        else temp += `&${sortBy}`;

        return temp;
    };

    const columns: ProColumns<IPermission>[] = [
        {
            title: "STT",
            key: "index",
            width: 60,
            align: "center",
            render: (_text, _record, index) =>
                index + 1 + ((meta.page || 1) - 1) * (meta.pageSize || PAGINATION_CONFIG.DEFAULT_PAGE_SIZE),
            hideInSearch: true,
        },
        {
            title: "Tên quyền",
            dataIndex: "name",
            sorter: true,
        },
        {
            title: "API Path",
            dataIndex: "apiPath",
            sorter: true,
        },
        {
            title: "Phương thức",
            dataIndex: "method",
            sorter: true,
            render: (_, record) => (
                <span style={{ fontWeight: 600, color: colorMethod(record.method || "") }}>
                    {record.method || "-"}
                </span>
            ),
        },
        {
            title: "Module",
            dataIndex: "module",
            sorter: true,
        },
        {
            title: "Hành động",
            hideInSearch: true,
            width: 120,
            align: "center",
            fixed: "right",                             // ← đồng bộ
            render: (_, entity) => (
                <Space size={4} align="center">
                    <Access permission={ALL_PERMISSIONS.PERMISSIONS.UPDATE} hideChildren>
                        <Button
                            type="text"
                            size="small"
                            icon={<EditOutlined style={{ color: "#fa8c16", fontSize: 16 }} />}
                            onClick={() => {
                                setDataInit(entity);
                                setOpenModal(true);
                            }}
                        />
                    </Access>

                    <Access permission={ALL_PERMISSIONS.PERMISSIONS.DELETE} hideChildren>
                        <Popconfirm
                            title="Xác nhận xóa quyền"
                            description="Bạn có chắc chắn muốn xóa quyền này không?"
                            okText="Xóa"
                            cancelText="Hủy"
                            okButtonProps={{ danger: true }}
                            placement="topRight"                // ← đồng bộ
                            onConfirm={() => handleDelete(entity.id!)}
                        >
                            <Button
                                type="text"
                                size="small"
                                icon={<DeleteOutlined style={{ color: "#ff4d4f", fontSize: 16 }} />}
                            />
                        </Popconfirm>
                    </Access>
                </Space>
            ),
        },
    ];

    return (
        <PageContainer
            title="Quản lý quyền hạn"
            filter={
                <SearchFilter
                    searchPlaceholder="Tìm kiếm quyền..."
                    addLabel="Thêm quyền"
                    showFilterButton={false}
                    onSearch={(val) =>
                        setQuery(
                            `page=${PAGINATION_CONFIG.DEFAULT_PAGE}&size=${PAGINATION_CONFIG.DEFAULT_PAGE_SIZE}&filter=name~'${val}'`
                        )
                    }
                    onReset={() => reloadTable()}
                    onAddClick={() => {
                        setDataInit(null);
                        setOpenModal(true);
                    }}
                />
            }
        >
            <Access permission={ALL_PERMISSIONS.PERMISSIONS.GET_PAGINATE}>
                <DataTable<IPermission>
                    actionRef={tableRef}
                    rowKey="id"
                    loading={isFetching}
                    columns={columns}
                    dataSource={permissions}
                    scroll={{ x: "max-content" }}       // ← đồng bộ
                    request={async (params, sort) => {
                        const q = buildQuery(params, sort);
                        setQuery(q);
                        return Promise.resolve({
                            data: permissions,
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
                                quyền
                            </div>
                        ),
                    }}
                    rowSelection={false}
                />
            </Access>

            <ModalPermission
                openModal={openModal}
                setOpenModal={setOpenModal}
                reloadTable={reloadTable}
                dataInit={dataInit}
                setDataInit={setDataInit}
            />

            <ViewDetailPermission
                onClose={setOpenViewDetail}
                open={openViewDetail}
                dataInit={dataInit}
                setDataInit={setDataInit}
            />
        </PageContainer>
    );
};

export default PermissionPage;