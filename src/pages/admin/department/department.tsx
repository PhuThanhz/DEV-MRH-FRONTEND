import { useEffect, useRef, useState } from "react";
import { Space, Badge, Popconfirm, Button, Dropdown } from "antd";
import type { MenuProps } from "antd";
import {
    MoreOutlined,
    EyeOutlined,
    EditOutlined,
    DeleteOutlined,
    DollarOutlined,
    ApartmentOutlined,
    RiseOutlined,
    AimOutlined,
    LockOutlined,
} from "@ant-design/icons";
import type { ProColumns, ActionType } from "@ant-design/pro-components";
import queryString from "query-string";
import { useNavigate } from "react-router-dom";

import PageContainer from "@/components/common/data-table/PageContainer";
import DataTable from "@/components/common/data-table";
import SearchFilter from "@/components/common/filter/SearchFilter";

import type { IDepartment } from "@/types/backend";
import { PAGINATION_CONFIG } from "@/config/pagination";
import {
    useDepartmentsQuery,
    useDeleteDepartmentMutation,
} from "@/hooks/useDepartments";

import ModalDepartment from "./modal.department";
import ViewDepartment from "./view.department";

/* ⭐ Thêm import modal phân quyền */
import ModalPermissionMatrix from "./access-control/ModalPermissionMatrix";

const DepartmentPage = () => {
    const navigate = useNavigate();

    const [openModal, setOpenModal] = useState(false);
    const [openView, setOpenView] = useState(false);
    const [openPermission, setOpenPermission] = useState(false);

    const [selectedDepartment, setSelectedDepartment] = useState<IDepartment | null>(null);

    const [dataInit, setDataInit] = useState<IDepartment | null>(null);
    const [searchValue, setSearchValue] = useState("");

    const [query, setQuery] = useState(
        `page=${PAGINATION_CONFIG.DEFAULT_PAGE}&size=${PAGINATION_CONFIG.DEFAULT_PAGE_SIZE}&sort=createdAt,desc`
    );

    const tableRef = useRef<ActionType>(null);
    const { data, isFetching, refetch } = useDepartmentsQuery(query);
    const deleteMutation = useDeleteDepartmentMutation();

    const meta = data?.meta ?? {
        page: PAGINATION_CONFIG.DEFAULT_PAGE,
        pageSize: PAGINATION_CONFIG.DEFAULT_PAGE_SIZE,
        total: 0,
    };
    const departments = data?.result ?? [];

    const buildQuery = (params: any, sort: any) => {
        const q: any = {
            page: params.current,
            size: params.pageSize || PAGINATION_CONFIG.DEFAULT_PAGE_SIZE,
        };

        const filters: string[] = [];
        if (searchValue)
            filters.push(`(code~'${searchValue}' or name~'${searchValue}')`);

        if (filters.length > 0) q.filter = filters.join(" and ");

        let sortBy = "sort=createdAt,desc";

        if (sort?.code)
            sortBy = sort.code === "ascend" ? "sort=code,asc" : "sort=code,desc";
        else if (sort?.name)
            sortBy = sort.name === "ascend" ? "sort=name,asc" : "sort=name,desc";

        return `${queryString.stringify(q, { encode: false })}&${sortBy}`;
    };

    useEffect(() => {
        const q: any = {
            page: PAGINATION_CONFIG.DEFAULT_PAGE,
            size: PAGINATION_CONFIG.DEFAULT_PAGE_SIZE,
            sort: "createdAt,desc",
        };

        const filters: string[] = [];
        if (searchValue)
            filters.push(`(code~'${searchValue}' or name~'${searchValue}')`);

        if (filters.length > 0) q.filter = filters.join(" and ");

        setQuery(queryString.stringify(q, { encode: false }));
    }, [searchValue]);

    const handleDelete = async (id: number) => {
        try {
            await deleteMutation.mutateAsync(id);
            refetch();
        } catch { }
    };

    const columns: ProColumns<IDepartment>[] = [
        {
            title: "STT",
            width: 60,
            align: "center",
            render: (_, __, index) =>
                index + 1 + ((meta.page || 1) - 1) * (meta.pageSize || 10),
        },
        {
            title: "Mã phòng ban",
            dataIndex: "code",
            sorter: true,
        },
        {
            title: "Tên phòng ban",
            dataIndex: "name",
            sorter: true,
        },
        {
            title: "Công ty",
            render: (_, record) => record.company?.name || "--",
        },
        {
            title: "Trạng thái",
            align: "center",
            render: (_, record) =>
                record.status === 1 ? (
                    <Badge status="success" text="Hoạt động" />
                ) : (
                    <Badge status="error" text="Ngừng hoạt động" />
                ),
        },
        {
            title: "Hành động",
            align: "center",
            width: 160,
            fixed: "right",
            render: (_, record) => (
                <Space size="middle">
                    {/* Xem chi tiết - xanh */}
                    <Button
                        type="text"
                        icon={<EyeOutlined style={{ color: "#1677ff", fontSize: 18 }} />}
                        onClick={() => {
                            setDataInit(record);
                            setOpenView(true);
                        }}
                    />

                    {/* Chỉnh sửa - cam */}
                    <Button
                        type="text"
                        icon={<EditOutlined style={{ color: "#fa8c16", fontSize: 18 }} />}
                        onClick={() => {
                            setDataInit(record);
                            setOpenModal(true);
                        }}
                    />

                    {/* More dropdown */}
                    <Dropdown
                        menu={{
                            items: [
                                {
                                    key: "salary",
                                    icon: <DollarOutlined style={{ color: "#eb2f96" }} />,
                                    label: "Quản lý lương",
                                    onClick: () =>
                                        navigate(
                                            `/admin/salary-range/${record.id}?departmentName=${encodeURIComponent(
                                                record.name
                                            )}`
                                        ),
                                },

                                {
                                    key: "org-chart",
                                    icon: <ApartmentOutlined style={{ color: "#eb2f96" }} />,
                                    label: "Sơ đồ tổ chức",
                                    onClick: () =>
                                        navigate(
                                            `/admin/departments/${record.id}/org-chart?departmentName=${encodeURIComponent(
                                                record.name
                                            )}`
                                        ),
                                },

                                {
                                    key: "career-paths",
                                    icon: <RiseOutlined style={{ color: "#eb2f96" }} />,
                                    label: "Lộ trình thăng tiến",
                                    onClick: () =>
                                        navigate(
                                            `/admin/departments/${record.id}/career-paths?departmentName=${encodeURIComponent(
                                                record.name
                                            )}`
                                        ),
                                },

                                {
                                    key: "objectives-tasks",
                                    icon: <AimOutlined style={{ color: "#eb2f96" }} />,
                                    label: "Mục tiêu nhiệm vụ",
                                    onClick: () =>
                                        navigate(
                                            `/admin/departments/${record.id}/objectives-tasks?departmentName=${encodeURIComponent(
                                                record.name
                                            )}`
                                        ),
                                },

                                /* ⭐ Thay navigate = mở modal phân quyền */
                                {
                                    key: "permissions",
                                    icon: <LockOutlined style={{ color: "#eb2f96" }} />,
                                    label: "Bản phân quyền",
                                    onClick: () => {
                                        setSelectedDepartment(record);
                                        setOpenPermission(true);
                                    },
                                },

                                { type: "divider" },

                                {
                                    key: "delete",
                                    icon: <DeleteOutlined style={{ color: "#ff4d4f" }} />,
                                    label: (
                                        <Popconfirm
                                            title="Xác nhận xoá phòng ban này?"
                                            onConfirm={() => handleDelete(record.id!)}
                                            okText="Xoá"
                                            cancelText="Huỷ"
                                            placement="topRight"
                                        >
                                            <span>Xóa phòng ban</span>
                                        </Popconfirm>
                                    ),
                                    danger: true,
                                },
                            ],
                        }}
                        trigger={["click"]}
                        placement="bottomRight"
                    >
                        <Button
                            type="text"
                            icon={<MoreOutlined style={{ fontSize: 18 }} />}
                        />
                    </Dropdown>
                </Space>
            ),
        },
    ];

    return (
        <PageContainer
            title="Quản lý phòng ban"
            filter={
                <SearchFilter
                    searchPlaceholder="Tìm theo mã hoặc tên..."
                    addLabel="Thêm phòng ban"
                    onSearch={setSearchValue}
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
            <DataTable<IDepartment>
                actionRef={tableRef}
                rowKey="id"
                loading={isFetching}
                columns={columns}
                dataSource={departments}
                request={async (params, sort) => {
                    const q = buildQuery(params, sort);
                    setQuery(q);
                    return {
                        data: departments,
                        success: true,
                        total: meta.total,
                    };
                }}
                pagination={{
                    defaultPageSize: PAGINATION_CONFIG.DEFAULT_PAGE_SIZE,
                    current: meta.page,
                    pageSize: meta.pageSize,
                    total: meta.total,
                }}
            />

            {/* Modal thêm / sửa */}
            <ModalDepartment
                openModal={openModal}
                setOpenModal={setOpenModal}
                dataInit={dataInit}
                setDataInit={setDataInit}
            />

            {/* Modal xem chi tiết */}
            <ViewDepartment
                open={openView}
                onClose={setOpenView}
                dataInit={dataInit}
                setDataInit={setDataInit}
            />

            {/* ⭐ Modal phân quyền */}
            {selectedDepartment && (
                <ModalPermissionMatrix
                    open={openPermission}
                    onClose={() => setOpenPermission(false)}
                    departmentId={selectedDepartment.id}
                    departmentName={selectedDepartment.name}
                />
            )}
        </PageContainer>
    );
};

export default DepartmentPage;