import DataTable from "@/components/admin/data-table";
import { useRef, useState } from "react";
import type { IUser } from "@/types/backend";
import { DeleteOutlined, EditOutlined, PlusOutlined } from "@ant-design/icons";
import type { ActionType, ProColumns } from "@ant-design/pro-components";
import { Button, Popconfirm, Space, message, notification } from "antd";
import dayjs from "dayjs";
import queryString from "query-string";
import { sfLike } from "spring-filter-query-builder";
import Access from "@/components/share/access";
import { ALL_PERMISSIONS } from "@/config/permissions";
import { useGetUsersQuery, useDeleteUserMutation } from "@/redux/api/userApi";
import ModalUser from "@/components/admin/user/modal.user";
import ViewDetailUser from "@/components/admin/user/view.user";

const UserPage = () => {
    const [openModal, setOpenModal] = useState(false);
    const [dataInit, setDataInit] = useState<IUser | null>(null);
    const [openViewDetail, setOpenViewDetail] = useState(false);
    const [query, setQuery] = useState<string>("page=1&size=10&sort=updatedAt,desc");

    const { data, isFetching, refetch } = useGetUsersQuery(query);
    const [deleteUser] = useDeleteUserMutation();
    const tableRef = useRef<ActionType>(null);

    const users = data?.data?.result ?? [];
    const meta = data?.data?.meta ?? { page: 1, pageSize: 10, total: 0 };

    const handleDeleteUser = async (id?: string) => {
        if (!id) return;
        try {
            const res: any = await deleteUser(id).unwrap();
            if (+res.statusCode === 200) {
                message.success("Xóa user thành công");
                refetch();
            }
        } catch (error: any) {
            notification.error({
                message: "Có lỗi xảy ra",
                description: error?.data?.message ?? "Không xác định được lỗi",
            });
        }
    };

    const reloadTable = () => refetch();

    // 🧮 Build query string (giữ nguyên như cũ)
    const buildQuery = (params: any, sort: any, filter: any) => {
        const q: any = {
            page: params.current,
            size: params.pageSize,
            filter: "",
        };

        const clone = { ...params };
        if (clone.name) q.filter = `${sfLike("name", clone.name)}`;
        if (clone.email) {
            q.filter = clone.name
                ? q.filter + " and " + `${sfLike("email", clone.email)}`
                : `${sfLike("email", clone.email)}`;
        }

        if (!q.filter) delete q.filter;
        let temp = queryString.stringify(q);

        let sortBy = "";
        if (sort && sort.name) {
            sortBy = sort.name === "ascend" ? "sort=name,asc" : "sort=name,desc";
        }
        if (sort && sort.email) {
            sortBy = sort.email === "ascend" ? "sort=email,asc" : "sort=email,desc";
        }
        if (sort && sort.createdAt) {
            sortBy =
                sort.createdAt === "ascend"
                    ? "sort=createdAt,asc"
                    : "sort=createdAt,desc";
        }
        if (sort && sort.updatedAt) {
            sortBy =
                sort.updatedAt === "ascend"
                    ? "sort=updatedAt,asc"
                    : "sort=updatedAt,desc";
        }

        // Mặc định sort theo updatedAt
        if (Object.keys(sortBy).length === 0) {
            temp = `${temp}&sort=updatedAt,desc`;
        } else {
            temp = `${temp}&${sortBy}`;
        }

        return temp;
    };

    // 🧱 Table Columns
    const columns: ProColumns<IUser>[] = [
        {
            title: "STT",
            key: "index",
            width: 50,
            align: "center",
            render: (text, record, index) => (
                <>{(index + 1) + (meta.page - 1) * (meta.pageSize)}</>
            ),
            hideInSearch: true,
        },
        { title: "Name", dataIndex: "name", sorter: true },
        { title: "Email", dataIndex: "email", sorter: true },
        {
            title: "Role",
            dataIndex: ["role", "name"],
            sorter: true,
            hideInSearch: true,
        },
        {
            title: "Company",
            dataIndex: ["company", "name"],
            sorter: true,
            hideInSearch: true,
        },
        {
            title: "CreatedAt",
            dataIndex: "createdAt",
            render: (_, record) =>
                record.createdAt
                    ? dayjs(record.createdAt).format("DD-MM-YYYY HH:mm:ss")
                    : "",
            hideInSearch: true,
        },
        {
            title: "UpdatedAt",
            dataIndex: "updatedAt",
            render: (_, record) =>
                record.updatedAt
                    ? dayjs(record.updatedAt).format("DD-MM-YYYY HH:mm:ss")
                    : "",
            hideInSearch: true,
        },
        {
            title: "Actions",
            hideInSearch: true,
            render: (_, entity) => (
                <Space>
                    <Access permission={ALL_PERMISSIONS.USERS.UPDATE} hideChildren>
                        <EditOutlined
                            style={{ fontSize: 20, color: "#ffa500" }}
                            onClick={() => {
                                setDataInit(entity);
                                setOpenModal(true);
                            }}
                        />
                    </Access>
                    <Access permission={ALL_PERMISSIONS.USERS.DELETE} hideChildren>
                        <Popconfirm
                            placement="leftTop"
                            title="Xác nhận xóa user"
                            description="Bạn có chắc chắn muốn xóa user này ?"
                            onConfirm={() => handleDeleteUser(entity.id)}
                            okText="Xác nhận"
                            cancelText="Hủy"
                        >
                            <DeleteOutlined style={{ fontSize: 20, color: "#ff4d4f" }} />
                        </Popconfirm>
                    </Access>
                </Space>
            ),
        },
    ];

    return (
        <div>
            <Access permission={ALL_PERMISSIONS.USERS.GET_PAGINATE}>
                <DataTable<IUser>
                    actionRef={tableRef}
                    headerTitle="Danh sách Users (RTK)"
                    rowKey="id"
                    loading={isFetching}
                    columns={columns}
                    dataSource={users}
                    request={async (params, sort, filter) => {
                        const q = buildQuery(params, sort, filter);
                        setQuery(q);

                        //  return object đúng kiểu
                        return {
                            data: users ?? [],
                            success: true,
                            total: meta.total ?? 0,
                        };
                    }}
                    scroll={{ x: true }}
                    pagination={{
                        current: meta.page,
                        pageSize: meta.pageSize,
                        showSizeChanger: true,
                        total: meta.total,
                        showTotal: (total, range) => (
                            <div>
                                {range[0]}-{range[1]} trên {total} rows
                            </div>
                        ),
                    }}
                    toolBarRender={() => [
                        <Button
                            key="add"
                            icon={<PlusOutlined />}
                            type="primary"
                            onClick={() => setOpenModal(true)}
                        >
                            Thêm mới
                        </Button>,
                    ]}
                />

            </Access>

            <ModalUser
                openModal={openModal}
                setOpenModal={setOpenModal}
                reloadTable={reloadTable}
                dataInit={dataInit}
                setDataInit={setDataInit}
            />

            <ViewDetailUser
                onClose={setOpenViewDetail}
                open={openViewDetail}
                dataInit={dataInit}
                setDataInit={setDataInit}
            />
        </div>
    );
};

export default UserPage;
