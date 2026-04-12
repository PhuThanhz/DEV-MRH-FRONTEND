import { useEffect, useRef, useState } from "react";
import { Space, Tag, Button, Popconfirm } from "antd";  // ← thêm Button, Popconfirm
import { EditOutlined, EyeOutlined, DeleteOutlined } from "@ant-design/icons";
import type { ProColumns, ActionType } from "@ant-design/pro-components";
import queryString from "query-string";

import PageContainer from "@/components/common/data-table/PageContainer";
import DataTable from "@/components/common/data-table";
import SearchFilter from "@/components/common/filter/SearchFilter";
import AdvancedFilterSelect from "@/components/common/filter/AdvancedFilterSelect";

import type { IEmployee } from "@/types/backend";
import Access from "@/components/share/access";
import { ALL_PERMISSIONS } from "@/config/permissions";
import { PAGINATION_CONFIG } from "@/config/pagination";
import { useEmployeesQuery, useDeleteEmployeeMutation } from "@/hooks/useEmployees";

import ModalEmployee from "@/pages/admin/employees/modal.employee";
import ViewDetailEmployee from "@/pages/admin/employees/view.employee";

const EmployeePage = () => {
    const [openModal, setOpenModal] = useState(false);
    const [dataInit, setDataInit] = useState<IEmployee | null>(null);
    const [openViewDetail, setOpenViewDetail] = useState(false);

    const [activeFilter, setActiveFilter] = useState<boolean | null>(null);
    const [searchValue, setSearchValue] = useState<string>("");

    const [query, setQuery] = useState<string>(
        `page=${PAGINATION_CONFIG.DEFAULT_PAGE}&size=${PAGINATION_CONFIG.DEFAULT_PAGE_SIZE}&sort=createdAt,desc`
    );

    const tableRef = useRef<ActionType>(null);

    const { data, isFetching, refetch } = useEmployeesQuery(query);
    const { mutate: deleteEmployee } = useDeleteEmployeeMutation();

    useEffect(() => {
        const q: any = {
            page: PAGINATION_CONFIG.DEFAULT_PAGE,
            size: PAGINATION_CONFIG.DEFAULT_PAGE_SIZE,
            sort: "createdAt,desc",
        };

        const filters: string[] = [];

        if (searchValue)
            filters.push(`(name~'${searchValue}' or email~'${searchValue}' or userInfo.employeeCode~'${searchValue}')`);

        if (activeFilter !== null)
            filters.push(`active=${activeFilter}`);

        if (filters.length > 0) q.filter = filters.join(" and ");

        setQuery(queryString.stringify(q, { encode: false }));
    }, [searchValue, activeFilter]);

    const meta = data?.meta ?? {
        page: PAGINATION_CONFIG.DEFAULT_PAGE,
        pageSize: PAGINATION_CONFIG.DEFAULT_PAGE_SIZE,
        total: 0,
    };

    const employees = data?.result ?? [];

    const buildQuery = (params: any, sort: any) => {
        const q: any = {
            page: params.current,
            size: params.pageSize || PAGINATION_CONFIG.DEFAULT_PAGE_SIZE,
        };

        const filters: string[] = [];

        if (searchValue)
            filters.push(`(name~'${searchValue}' or email~'${searchValue}' or userInfo.employeeCode~'${searchValue}')`);

        if (activeFilter !== null)
            filters.push(`active=${activeFilter}`);

        if (filters.length > 0) q.filter = filters.join(" and ");

        let temp = queryString.stringify(q, { encode: false });
        let sortBy = "sort=createdAt,desc";

        if (sort?.name)
            sortBy = sort.name === "ascend" ? "sort=name,asc" : "sort=name,desc";
        else if (sort?.email)
            sortBy = sort.email === "ascend" ? "sort=email,asc" : "sort=email,desc";

        return `${temp}&${sortBy}`;
    };

    const reloadTable = () => refetch();

    const handleDelete = (id: number) => {
        deleteEmployee(id, { onSuccess: reloadTable });
    };

    const columns: ProColumns<IEmployee>[] = [
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
                    ? `${backendURL}/api/v1/files?fileName=${record.avatar}&folder=avatar`
                    : null;
                const displayName = record.name || record.email || "NV";
                const initials = displayName
                    .split(" ")
                    .filter(Boolean)
                    .map((w: string) => w[0]?.toUpperCase())
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
                const bg = bgColors[(displayName.charCodeAt(0) + displayName.length) % bgColors.length];

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
                        {initials || "NV"}
                    </div>
                );
            },
        },
        { title: "Tên nhân viên", dataIndex: "name", sorter: true },
        { title: "Email", dataIndex: "email", sorter: true },
        {
            title: "Mã NV",
            dataIndex: ["userInfo", "employeeCode"],
            align: "center",
            render: (_, record) =>
                record.userInfo?.employeeCode ? (
                    <Tag color="purple">{record.userInfo.employeeCode}</Tag>
                ) : (
                    <span style={{ color: "#9ca3af" }}>--</span>
                ),
        },
        {
            title: "Vai trò",
            dataIndex: ["role", "name"],
            align: "center",
            render: (_, record) =>
                record.role?.name ? (
                    <Tag color="blue">{record.role.name}</Tag>
                ) : (
                    <Tag>Chưa có vai trò</Tag>
                ),
        },
        {
            title: "Công ty",
            align: "center",
            render: (_, record) => {
                const p = record.positions?.[0];
                return p?.companyName ? (
                    <Tag color="blue">{p.companyName}</Tag>
                ) : (
                    <span style={{ color: "#9ca3af" }}>--</span>
                );
            },
        },
        {
            title: "Phòng ban",
            align: "center",
            render: (_, record) => {
                const p = record.positions?.[0];
                return p?.departmentName ? (
                    <Tag color="green">{p.departmentName}</Tag>
                ) : (
                    <span style={{ color: "#9ca3af" }}>--</span>
                );
            },
        },
        {
            title: "Bộ phận",
            align: "center",
            render: (_, record) => {
                const p = record.positions?.[0];
                return p?.sectionName ? (
                    <Tag color="purple">{p.sectionName}</Tag>
                ) : (
                    <span style={{ color: "#9ca3af" }}>--</span>
                );
            },
        },
        {
            title: "Chức danh",
            align: "center",
            render: (_, record) => {
                const positions = record.positions;
                if (!positions || positions.length === 0)
                    return <span style={{ color: "#9ca3af" }}>--</span>;
                return (
                    <Space direction="vertical" size={2}>
                        {positions.slice(0, 2).map((p: any) => (
                            <Tag key={p.id} color="cyan" style={{ margin: 0 }}>
                                {p.jobTitleNameVi}
                            </Tag>
                        ))}
                        {positions.length > 2 && (
                            <Tag style={{ margin: 0 }}>+{positions.length - 2}</Tag>
                        )}
                    </Space>
                );
            },
        },
        {
            title: "Trạng thái",
            dataIndex: "active",
            align: "center",
            render: (_, record) => {
                const isActive = record.active;
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
            width: 120,
            fixed: "right",                             // ← đồng bộ
            render: (_, entity) => (
                <Space size={4} align="center">
                    <Access permission={ALL_PERMISSIONS.EMPLOYEES.GET_BY_ID} hideChildren>
                        <Button
                            type="text"
                            size="small"
                            icon={<EyeOutlined style={{ color: "#1677ff", fontSize: 16 }} />}
                            onClick={() => {
                                setDataInit(entity);
                                setOpenViewDetail(true);
                            }}
                        />
                    </Access>

                    <Access permission={ALL_PERMISSIONS.EMPLOYEES.UPDATE} hideChildren>
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

                    <Access permission={ALL_PERMISSIONS.EMPLOYEES.DELETE} hideChildren>
                        <Popconfirm
                            title="Xác nhận xóa nhân viên"
                            description="Hành động này không thể hoàn tác."
                            okText="Xóa"
                            cancelText="Hủy"
                            okButtonProps={{ danger: true }}
                            placement="topRight"
                            onConfirm={() => handleDelete(Number(entity.id))}
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
            title="Quản lý nhân viên"
            filter={
                <div className="flex flex-col gap-3">
                    <SearchFilter
                        searchPlaceholder="Tìm theo tên, email hoặc mã NV..."
                        addLabel="Thêm nhân viên"
                        showFilterButton={false}
                        onSearch={(val) => setSearchValue(val)}
                        onReset={reloadTable}
                        onAddClick={() => {
                            setDataInit(null);
                            setOpenModal(true);
                        }}
                        addPermission={ALL_PERMISSIONS.EMPLOYEES.CREATE}
                    />
                    <div className="flex flex-wrap gap-3 items-center">
                        <AdvancedFilterSelect
                            fields={[
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
                                setActiveFilter(
                                    filters.active !== undefined ? filters.active : null
                                );
                            }}
                        />
                    </div>
                </div>
            }
        >
            <Access permission={ALL_PERMISSIONS.EMPLOYEES.GET_PAGINATE}>
                <DataTable<IEmployee>
                    actionRef={tableRef}
                    rowKey="id"
                    loading={isFetching}
                    columns={columns}
                    dataSource={employees}
                    scroll={{ x: "max-content" }}       // ← đồng bộ
                    request={async (params, sort) => {
                        const q = buildQuery(params, sort);
                        setQuery(q);
                        return Promise.resolve({
                            data: employees,
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
                                <span style={{ fontWeight: 500 }}>{range[0]}–{range[1]}</span>{" "}
                                trên{" "}
                                <span style={{ fontWeight: 600, color: "#1677ff" }}>
                                    {total.toLocaleString()}
                                </span>{" "}
                                nhân viên
                            </div>
                        ),
                    }}
                    rowSelection={false}
                />
            </Access>

            <ModalEmployee
                openModal={openModal}
                setOpenModal={setOpenModal}
                dataInit={dataInit}
                setDataInit={setDataInit}
                onSuccess={reloadTable}
            />

            <ViewDetailEmployee
                open={openViewDetail}
                onClose={setOpenViewDetail}
                dataInit={dataInit}
                setDataInit={setDataInit}
            />
        </PageContainer>
    );
};

export default EmployeePage;