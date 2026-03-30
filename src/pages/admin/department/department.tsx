import { useEffect, useRef, useState } from "react";
import { Space, Popconfirm, Button, Dropdown, Tag } from "antd";
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
    FileTextOutlined,
    TeamOutlined,
} from "@ant-design/icons";
import type { ProColumns, ActionType } from "@ant-design/pro-components";
import queryString from "query-string";
import { useNavigate } from "react-router-dom";

import PageContainer from "@/components/common/data-table/PageContainer";
import DataTable from "@/components/common/data-table";
import SearchFilter from "@/components/common/filter/SearchFilter";
import AdvancedFilterSelect from "@/components/common/filter/AdvancedFilterSelect";

import type { IDepartment } from "@/types/backend";
import { PAGINATION_CONFIG } from "@/config/pagination";
import { callFetchCompany } from "@/config/api";

import {
    useDepartmentsQuery,
    useDeleteDepartmentMutation,
} from "@/hooks/useDepartments";

import ModalDepartment from "./modal.department";
import ViewDepartment from "./view.department";
import PermissionViewModal from "./permissions/ components/PermissionViewModal";
import PositionChartModal from "@/pages/admin/department/position-chart/PositionChartModal";

import { PATHS } from "@/constants/paths";

const DepartmentPage = () => {
    const navigate = useNavigate();

    const [openModal, setOpenModal] = useState(false);
    const [openView, setOpenView] = useState(false);
    const [dataInit, setDataInit] = useState<IDepartment | null>(null);

    const [openPermissionModal, setOpenPermissionModal] = useState(false);
    const [openPositionChartModal, setOpenPositionChartModal] = useState(false);

    const [selectedDepartment, setSelectedDepartment] = useState<{
        id: number;
        name: string;
        companyName: string;
    } | null>(null);

    const [searchValue, setSearchValue] = useState("");
    const [companyIdFilter, setCompanyIdFilter] = useState<number | null>(null);
    const [statusFilter, setStatusFilter] = useState<number | null>(null);
    const [resetSignal, setResetSignal] = useState(0);

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

    /*
     * ===================== BUILD FILTERS =====================
     */
    const buildFilters = (
        search: string,
        companyId: number | null,
        status: number | null,
    ) => {
        const parts: string[] = [];

        if (search)
            parts.push(`(code~'${search}' or name~'${search}')`);

        if (companyId)
            parts.push(`company.id:${companyId}`);

        if (status !== null)
            parts.push(`status=${status}`);

        return parts;
    };

    /*
     * ===================== AUTO BUILD QUERY =====================
     */
    useEffect(() => {
        const q: any = {
            page: PAGINATION_CONFIG.DEFAULT_PAGE,
            size: PAGINATION_CONFIG.DEFAULT_PAGE_SIZE,
            sort: "createdAt,desc",
        };

        const filters = buildFilters(searchValue, companyIdFilter, statusFilter);
        if (filters.length > 0) q.filter = filters.join(" and ");

        setQuery(queryString.stringify(q, { encode: false }));
    }, [searchValue, companyIdFilter, statusFilter]);

    /*
     * ===================== BUILD QUERY FOR TABLE =====================
     */
    const buildQuery = (params: any, sort: any) => {
        const q: any = {
            page: params.current,
            size: params.pageSize || PAGINATION_CONFIG.DEFAULT_PAGE_SIZE,
        };

        const filters = buildFilters(searchValue, companyIdFilter, statusFilter);
        if (filters.length > 0) q.filter = filters.join(" and ");

        let sortBy = "sort=createdAt,desc";
        if (sort?.code)
            sortBy = sort.code === "ascend" ? "sort=code,asc" : "sort=code,desc";
        else if (sort?.name)
            sortBy = sort.name === "ascend" ? "sort=name,asc" : "sort=name,desc";

        return `${queryString.stringify(q, { encode: false })}&${sortBy}`;
    };

    /*
     * ===================== RESET =====================
     */
    const handleReset = () => {
        setSearchValue("");
        setCompanyIdFilter(null);
        setStatusFilter(null);
        setResetSignal((s) => s + 1);
        refetch();
    };

    const handleDelete = async (id: number) => {
        try {
            await deleteMutation.mutateAsync(id);
            refetch();
        } catch { }
    };

    /*
     * ===================== COLUMNS =====================
     */
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
            align: "center",  // 👈 thêm dòng này

            render: (_, record) => (
                <Tag
                    style={{
                        borderRadius: 4,
                        padding: "0px 8px",
                        fontSize: 12,
                        fontWeight: 500,
                        height: 22,
                        lineHeight: "20px",
                        border: "1px solid #AFA9EC",
                        background: "#EEEDFE",
                        color: "#3C3489",
                    }}
                >
                    {record.code}
                </Tag>
            ),
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
            render: (_, record) => {
                const isActive = record.status === 1;

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
            width: 180,
            fixed: "right",
            render: (_, record) => (
                <Space size="middle">
                    <Button
                        type="text"
                        icon={<EyeOutlined style={{ color: "#1677ff", fontSize: 18 }} />}
                        onClick={() => {
                            setDataInit(record);
                            setOpenView(true);
                        }}
                    />
                    <Button
                        type="text"
                        icon={<EditOutlined style={{ color: "#fa8c16", fontSize: 18 }} />}
                        onClick={() => {
                            setDataInit(record);
                            setOpenModal(true);
                        }}
                    />
                    <Dropdown
                        menu={{
                            items: [
                                {
                                    key: "org-chart",
                                    icon: <ApartmentOutlined style={{ color: "#eb2f96" }} />,
                                    label: "Sơ đồ tổ chức",
                                    onClick: () =>
                                        navigate(
                                            `/admin/departments/${record.id}/org-chart?departmentName=${encodeURIComponent(record.name)}`
                                        ),
                                },
                                {
                                    key: "objectives-tasks",
                                    icon: <AimOutlined style={{ color: "#eb2f96" }} />,
                                    label: "Mục tiêu - Nhiệm vụ",
                                    onClick: () =>
                                        navigate(
                                            PATHS.ADMIN.DEPARTMENT_OBJECTIVES.replace(
                                                ":departmentId",
                                                String(record.id)
                                            ) + `?departmentName=${encodeURIComponent(record.name)}`
                                        ),
                                },
                                {
                                    key: "department-procedures",
                                    icon: <FileTextOutlined style={{ color: "#eb2f96" }} />,
                                    label: "Quy trình phòng ban",
                                    onClick: () =>
                                        navigate(
                                            PATHS.ADMIN.DEPARTMENT_PROCEDURES.replace(
                                                ":departmentId",
                                                String(record.id)
                                            ) + `?departmentName=${encodeURIComponent(record.name)}`
                                        ),
                                },
                                {
                                    key: "permissions",
                                    icon: <LockOutlined style={{ color: "#eb2f96" }} />,
                                    label: "Phân quyền",
                                    onClick: () => {
                                        setSelectedDepartment({
                                            id: record.id!,
                                            name: record.name,
                                            companyName: record.company?.name || "",
                                        });
                                        setOpenPermissionModal(true);
                                    },
                                },
                                {
                                    key: "career-paths",
                                    icon: <RiseOutlined style={{ color: "#eb2f96" }} />,
                                    label: "Lộ trình thăng tiến",
                                    onClick: () =>
                                        navigate(
                                            `/admin/departments/${record.id}/career-paths?departmentName=${encodeURIComponent(record.name)}`
                                        ),
                                },
                                {
                                    key: "salary",
                                    icon: <DollarOutlined style={{ color: "#eb2f96" }} />,
                                    label: "Khung lương",
                                    onClick: () =>
                                        navigate(
                                            `/admin/salary-range/${record.id}?departmentName=${encodeURIComponent(record.name)}`
                                        ),
                                },
                                {
                                    key: "position-chart",
                                    icon: <TeamOutlined style={{ color: "#eb2f96" }} />,
                                    label: "Bản đồ chức danh",
                                    onClick: () => {
                                        setSelectedDepartment({
                                            id: record.id!,
                                            name: record.name,
                                            companyName: record.company?.name || "",
                                        });
                                        setOpenPositionChartModal(true);
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
                <div className="flex flex-col gap-3">
                    <SearchFilter
                        searchPlaceholder="Tìm theo mã hoặc tên..."
                        addLabel="Thêm phòng ban"
                        showFilterButton={false}
                        onSearch={setSearchValue}
                        onReset={handleReset}
                        onAddClick={() => {
                            setDataInit(null);
                            setOpenModal(true);
                        }}
                    />

                    <AdvancedFilterSelect
                        resetSignal={resetSignal}
                        fields={[
                            {
                                key: "companyId",
                                label: "Công ty",
                                type: "async-select",
                                loadOptions: async () => {
                                    const res = await callFetchCompany(
                                        "page=1&size=100&sort=name,asc"
                                    );
                                    return (res?.data?.result ?? []).map((c: any) => ({
                                        label: c.name,
                                        value: c.id,
                                    }));
                                },
                            },
                            {
                                key: "status",
                                label: "Trạng thái",
                                options: [
                                    { label: "Hoạt động", value: 1, color: "green" },
                                    { label: "Ngừng hoạt động", value: 0, color: "red" },
                                ],
                            },
                        ]}
                        onChange={(val) => {
                            setCompanyIdFilter(
                                val.companyId !== undefined ? val.companyId : null
                            );
                            setStatusFilter(
                                val.status !== undefined ? val.status : null
                            );
                        }}
                    />
                </div>
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

            <ModalDepartment
                openModal={openModal}
                setOpenModal={setOpenModal}
                dataInit={dataInit}
                setDataInit={setDataInit}
            />

            <ViewDepartment
                open={openView}
                onClose={setOpenView}
                dataInit={dataInit}
                setDataInit={setDataInit}
            />

            {selectedDepartment && (
                <PermissionViewModal
                    open={openPermissionModal}
                    onClose={() => setOpenPermissionModal(false)}
                    departmentName={selectedDepartment.name}
                />
            )}

            {selectedDepartment && (
                <PositionChartModal
                    open={openPositionChartModal}
                    onClose={() => setOpenPositionChartModal(false)}
                    departmentId={selectedDepartment.id}
                    departmentName={selectedDepartment.name}
                    companyName={selectedDepartment.companyName}
                />
            )}
        </PageContainer>
    );
};

export default DepartmentPage;