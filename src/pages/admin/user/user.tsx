import { useEffect, useRef, useState } from "react";
import { Space, Tag, Popconfirm, message, Badge } from "antd";
import { EditOutlined, EyeOutlined } from "@ant-design/icons";
import type { ProColumns, ActionType } from "@ant-design/pro-components";
import queryString from "query-string";
import dayjs from "dayjs";

import PageContainer from "@/components/common/data-table/PageContainer";
import DataTable from "@/components/common/data-table";
import SearchFilter from "@/components/common/filter/SearchFilter";
import AdvancedFilterSelect from "@/components/common/filter/AdvancedFilterSelect";
import DateRangeFilter from "@/components/common/filter/DateRangeFilter";

import type { IUser } from "@/types/backend";
import Access from "@/components/share/access";
import { ALL_PERMISSIONS } from "@/config/permissions";
import { PAGINATION_CONFIG } from "@/config/pagination";
import { useUsersQuery } from "@/hooks/useUsers";
import { useRolesQuery } from "@/hooks/useRoles";

import ModalUser from "@/pages/admin/user/modal.user";
import ViewDetailUser from "@/pages/admin/user/view.user";

const UserPage = () => {
    const [openModal, setOpenModal] = useState(false);
    const [dataInit, setDataInit] = useState<IUser | null>(null);
    const [openViewDetail, setOpenViewDetail] = useState(false);

    const [roleFilter, setRoleFilter] = useState<string | null>(null);
    const [activeFilter, setActiveFilter] = useState<boolean | null>(null);
    const [createdAtFilter, setCreatedAtFilter] = useState<string | null>(null);
    const [searchValue, setSearchValue] = useState<string>("");

    const [roleOptions, setRoleOptions] = useState<
        { label: string; value: string; color?: string }[]
    >([]);

    const [query, setQuery] = useState<string>(
        `page=${PAGINATION_CONFIG.DEFAULT_PAGE}&size=${PAGINATION_CONFIG.DEFAULT_PAGE_SIZE}&sort=createdAt,desc`
    );

    const tableRef = useRef<ActionType>(null);
    const { data, isFetching, refetch } = useUsersQuery(query);
    const { data: rolesData } = useRolesQuery("page=1&size=100");

    useEffect(() => {
        if (rolesData?.result) {
            const list = rolesData.result.map((r: any) => ({
                label: r.name,
                value: r.name,
                color: "blue",
            }));
            setRoleOptions(list);
        }
    }, [rolesData]);

    useEffect(() => {
        const q: any = {
            page: PAGINATION_CONFIG.DEFAULT_PAGE,
            size: PAGINATION_CONFIG.DEFAULT_PAGE_SIZE,
            sort: "createdAt,desc",
        };

        const filters: string[] = [];
        if (searchValue) filters.push(`(name~'${searchValue}' or email~'${searchValue}')`);
        if (roleFilter) filters.push(`role.name='${roleFilter}'`);
        if (activeFilter !== null) filters.push(`active=${activeFilter}`);
        if (createdAtFilter) filters.push(createdAtFilter);

        if (filters.length > 0) q.filter = filters.join(" and ");
        setQuery(queryString.stringify(q, { encode: false }));
    }, [searchValue, roleFilter, activeFilter, createdAtFilter]);

    const meta = data?.meta ?? {
        page: PAGINATION_CONFIG.DEFAULT_PAGE,
        pageSize: PAGINATION_CONFIG.DEFAULT_PAGE_SIZE,
        total: 0,
    };
    const users = data?.result ?? [];

    const buildQuery = (params: any, sort: any) => {
        const q: any = {
            page: params.current,
            size: params.pageSize || PAGINATION_CONFIG.DEFAULT_PAGE_SIZE,
        };

        const filters: string[] = [];
        if (searchValue) filters.push(`(name~'${searchValue}' or email~'${searchValue}')`);
        if (roleFilter) filters.push(`role.name='${roleFilter}'`);
        if (activeFilter !== null) filters.push(`active=${activeFilter}`);
        if (createdAtFilter) filters.push(createdAtFilter);

        if (filters.length > 0) q.filter = filters.join(" and ");

        let temp = queryString.stringify(q, { encode: false });

        let sortBy = "sort=createdAt,desc";
        if (sort?.name) sortBy = sort.name === "ascend" ? "sort=name,asc" : "sort=name,desc";
        else if (sort?.email)
            sortBy = sort.email === "ascend" ? "sort=email,asc" : "sort=email,desc";

        return `${temp}&${sortBy}`;
    };

    const reloadTable = () => refetch();

    const columns: ProColumns<IUser>[] = [
        {
            title: "STT",
            key: "index",
            width: 60,
            align: "center",
            render: (_text, _record, index) =>
                index + 1 + ((meta.page || 1) - 1) * (meta.pageSize || 10),
        },
        {
            title: "Avatar",
            dataIndex: "avatar",
            width: 90,
            align: "center",
            render: (_, record) => {
                const backendURL = import.meta.env.VITE_BACKEND_URL;
                const avatarUrl = record.avatar
                    ? `${backendURL}/storage/AVATAR/${record.avatar}`
                    : null;

                const displayName = record.name || record.email || "";
                const initials = displayName
                    .split(" ")
                    .filter(Boolean)
                    .map((word) => word[0]?.toUpperCase())
                    .slice(0, 2)
                    .join("");

                if (avatarUrl) {
                    return (
                        <img
                            src={avatarUrl}
                            alt="avatar"
                            style={{
                                width: 40,
                                height: 40,
                                borderRadius: "50%",
                                objectFit: "cover",
                                border: "1px solid #ddd",
                            }}
                        />
                    );
                }

                const bgColors = ["#1677ff", "#fa8c16", "#52c41a", "#13c2c2", "#eb2f96"];
                const bg =
                    bgColors[(displayName.charCodeAt(0) + displayName.length) % bgColors.length];

                return (
                    <div
                        style={{
                            width: 40,
                            height: 40,
                            borderRadius: "50%",
                            backgroundColor: bg,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "#fff",
                            fontWeight: 600,
                            textTransform: "uppercase",
                            fontSize: 14,
                        }}
                    >
                        {initials || "U"}
                    </div>
                );
            },
        },
        { title: "Tên hiển thị", dataIndex: "name", sorter: true },
        { title: "Email", dataIndex: "email", sorter: true },
        {
            title: "Vai trò",
            dataIndex: ["role", "name"],
            render: (_, record) =>
                record.role?.name ? (
                    <Tag color="blue">{record.role.name}</Tag>
                ) : (
                    <Tag>Chưa có vai trò</Tag>
                ),
        },
        {
            title: "Trạng thái",
            dataIndex: "active",
            align: "center",
            render: (_, record) =>
                record.active ? (
                    <Badge status="success" text="Đang hoạt động" />
                ) : (
                    <Badge status="error" text="Ngừng hoạt động" />
                ),
        },

        {
            title: "Hành động",
            align: "center",
            width: 140,
            render: (_, entity) => (
                <Space>
                    <Access permission={ALL_PERMISSIONS.USERS.GET_BY_ID} hideChildren>
                        <EyeOutlined
                            style={{ fontSize: 18, color: "#1677ff", cursor: "pointer" }}
                            onClick={() => {
                                setDataInit(entity);
                                setOpenViewDetail(true);
                            }}
                        />
                    </Access>

                    <Access permission={ALL_PERMISSIONS.USERS.UPDATE} hideChildren>
                        <EditOutlined
                            style={{ fontSize: 18, color: "#fa8c16", cursor: "pointer" }}
                            onClick={() => {
                                setDataInit(entity);
                                setOpenModal(true);
                            }}
                        />
                    </Access>
                </Space>
            ),
        },
    ];

    return (
        <PageContainer
            title="Quản lý người dùng"
            filter={
                <div className="flex flex-col gap-3">
                    <SearchFilter
                        searchPlaceholder="Tìm theo tên hoặc email..."
                        addLabel="Thêm người dùng"
                        showFilterButton={false}
                        onSearch={(val) => setSearchValue(val)}
                        onReset={reloadTable}
                        onAddClick={() => {
                            setDataInit(null);
                            setOpenModal(true);
                        }}
                    />

                    <div className="flex flex-wrap gap-3 items-center">
                        <AdvancedFilterSelect
                            fields={[
                                {
                                    key: "role",
                                    label: "Vai trò",
                                    options: roleOptions,
                                },
                                {
                                    key: "active",
                                    label: "Trạng thái",
                                    options: [
                                        { label: "Đang hoạt động", value: true, color: "green" },
                                        { label: "Ngừng hoạt động", value: false, color: "red" },
                                    ],
                                },
                            ]}
                            onChange={(filters) => {
                                setRoleFilter(filters.role || null);
                                setActiveFilter(
                                    filters.active !== undefined ? filters.active : null
                                );
                            }}
                        />
                        <DateRangeFilter
                            fieldName="createdAt"
                            onChange={(filter) => setCreatedAtFilter(filter)}
                        />
                    </div>
                </div>
            }
        >
            <Access permission={ALL_PERMISSIONS.USERS.GET_PAGINATE}>
                <DataTable<IUser>
                    actionRef={tableRef}
                    rowKey="id"
                    loading={isFetching}
                    columns={columns}
                    dataSource={users}
                    request={async (params, sort) => {
                        const q = buildQuery(params, sort);
                        setQuery(q);
                        return Promise.resolve({
                            data: users,
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
                                người dùng
                            </div>
                        ),
                    }}
                    rowSelection={false}
                />
            </Access>

            <ModalUser
                openModal={openModal}
                setOpenModal={setOpenModal}
                dataInit={dataInit}
                setDataInit={setDataInit}
            />

            <ViewDetailUser
                onClose={setOpenViewDetail}
                open={openViewDetail}
                dataInit={dataInit}
                setDataInit={setDataInit}
            />
        </PageContainer>
    );
};

export default UserPage;
