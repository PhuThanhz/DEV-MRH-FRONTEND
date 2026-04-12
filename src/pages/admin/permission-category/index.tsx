import { useEffect, useRef, useState } from "react";
import { Space, Tag, Popconfirm } from "antd";
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
import AdvancedFilterSelect from "@/components/common/filter/AdvancedFilterSelect";

import { PAGINATION_CONFIG } from "@/config/pagination";
import { ALL_PERMISSIONS } from "@/config/permissions";
import Access from "@/components/share/access";

import type { IPermissionCategory, ICompany, IDepartment } from "@/types/backend";
import {
    usePermissionCategoryQuery,
    useDeletePermissionCategoryMutation,
} from "@/hooks/usePermissionCategory";
import { callFetchCompany, callFetchDepartmentsByCompany } from "@/config/api";

import ModalCategory from "./modal.permission-category";
import ViewCategory from "./view.permission-category";
import DrawerPermissionContent from "./content/drawer.permission-content";

const PermissionCategoryPage = () => {
    const [openModal, setOpenModal] = useState(false);
    const [openView, setOpenView] = useState(false);

    const [openContentDrawer, setOpenContentDrawer] = useState(false);
    const [selectedCategory, setSelectedCategory] =
        useState<IPermissionCategory | null>(null);

    const [dataInit, setDataInit] = useState<IPermissionCategory | null>(null);

    const [searchValue, setSearchValue] = useState("");
    const [companyIdFilter, setCompanyIdFilter] = useState<number | null>(null);
    const [departmentIdFilter, setDepartmentIdFilter] = useState<number | null>(null);
    const [statusFilter, setStatusFilter] = useState<number | null>(null);
    const [resetSignal, setResetSignal] = useState(0);

    const [query, setQuery] = useState(
        `page=${PAGINATION_CONFIG.DEFAULT_PAGE}&size=${PAGINATION_CONFIG.DEFAULT_PAGE_SIZE}&sort=createdAt,desc`
    );

    const tableRef = useRef<ActionType>(null);

    const { data, isFetching, refetch } = usePermissionCategoryQuery(query);
    const deleteMutation = useDeletePermissionCategoryMutation();

    const meta = data?.meta ?? {
        page: PAGINATION_CONFIG.DEFAULT_PAGE,
        pageSize: PAGINATION_CONFIG.DEFAULT_PAGE_SIZE,
        total: 0,
    };

    const categories = data?.result ?? [];

    // ===================== BUILD FILTERS =====================
    const buildFilters = (
        search: string,
        companyId: number | null,
        departmentId: number | null,
        status: number | null,
    ) => {
        const parts: string[] = [];
        if (search) parts.push(`(name~'${search}' or code~'${search}')`);
        if (companyId) parts.push(`department.company.id:${companyId}`);
        if (departmentId) parts.push(`department.id:${departmentId}`);
        if (status !== null) parts.push(`status=${status}`);
        return parts;
    };

    // ===================== AUTO BUILD QUERY =====================
    useEffect(() => {
        const q: any = {
            page: PAGINATION_CONFIG.DEFAULT_PAGE,
            size: PAGINATION_CONFIG.DEFAULT_PAGE_SIZE,
            sort: "createdAt,desc",
        };
        const filters = buildFilters(searchValue, companyIdFilter, departmentIdFilter, statusFilter);
        if (filters.length > 0) q.filter = filters.join(" and ");
        setQuery(queryString.stringify(q, { encode: false }));
    }, [searchValue, companyIdFilter, departmentIdFilter, statusFilter]);

    // ===================== BUILD QUERY FOR TABLE =====================
    const buildQuery = (params: any, sort: any) => {
        const q: any = {
            page: params.current,
            size: params.pageSize || PAGINATION_CONFIG.DEFAULT_PAGE_SIZE,
        };
        const filters = buildFilters(searchValue, companyIdFilter, departmentIdFilter, statusFilter);
        if (filters.length > 0) q.filter = filters.join(" and ");

        let sortBy = "sort=createdAt,desc";
        if (sort?.code)
            sortBy = sort.code === "ascend" ? "sort=code,asc" : "sort=code,desc";
        else if (sort?.name)
            sortBy = sort.name === "ascend" ? "sort=name,asc" : "sort=name,desc";

        return `${queryString.stringify(q, { encode: false })}&${sortBy}`;
    };

    // ===================== RESET =====================
    const handleReset = () => {
        setSearchValue("");
        setCompanyIdFilter(null);
        setDepartmentIdFilter(null);
        setStatusFilter(null);
        setResetSignal((s) => s + 1);
        refetch();
    };

    // ===================== DELETE =====================
    const handleDelete = async (id: number) => {
        try {
            await deleteMutation.mutateAsync(id);
            refetch();
        } catch { }
    };

    // ===================== COLUMNS =====================
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
            align: "center",
            width: 150,
            render: (text) => (
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
                        fontFamily: "monospace",
                    }}
                >
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
            title: "Công ty",
            dataIndex: "companyName",
            width: 200,
            render: (_, record) =>
                record.companyName ? (
                    <Tag
                        style={{
                            borderRadius: 4,
                            padding: "0px 8px",
                            fontSize: 12,
                            fontWeight: 500,
                            height: 22,
                            lineHeight: "20px",
                            border: "1px solid #d3adf7",
                            background: "#f9f0ff",
                            color: "#531dab",
                        }}
                    >
                        {record.companyName}
                    </Tag>
                ) : (
                    <span style={{ color: "var(--color-text-secondary)" }}>--</span>
                ),
        },
        {
            title: "Phòng ban",
            dataIndex: "departmentName",
            width: 200,
            render: (_, record) =>
                record.departmentName ? (
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
                        }}
                    >
                        {record.departmentName}
                    </Tag>
                ) : (
                    <span style={{ color: "var(--color-text-secondary)" }}>--</span>
                ),
        },
        {
            title: "Trạng thái",
            dataIndex: "active",
            width: 150,
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
            width: 160,
            align: "center",
            fixed: "right",             // ← sticky bên phải khi scroll ngang
            render: (_, entity) => (
                <Space size={4}>
                    {/* VIEW */}
                    <Access permission={ALL_PERMISSIONS.PERMISSION_CATEGORY.GET_BY_ID} hideChildren>
                        <EyeOutlined
                            style={{ fontSize: 18, color: "#1677ff", cursor: "pointer" }}
                            onClick={() => {
                                setDataInit(entity);
                                setOpenView(true);
                            }}
                        />
                    </Access>

                    {/* CONTENT */}
                    <Access permission={ALL_PERMISSIONS.PERMISSION_CONTENT.GET_PAGINATE} hideChildren>
                        <FileTextOutlined
                            style={{ fontSize: 18, color: "#52c41a", cursor: "pointer" }}
                            onClick={() => {
                                setSelectedCategory(entity);
                                setOpenContentDrawer(true);
                            }}
                        />
                    </Access>

                    {/* EDIT */}
                    <Access permission={ALL_PERMISSIONS.PERMISSION_CATEGORY.UPDATE} hideChildren>
                        <EditOutlined
                            style={{ fontSize: 18, color: "#fa8c16", cursor: "pointer" }}
                            onClick={() => {
                                setDataInit(entity);
                                setOpenModal(true);
                            }}
                        />
                    </Access>

                    {/* DELETE */}
                    <Access permission={ALL_PERMISSIONS.PERMISSION_CATEGORY.DELETE} hideChildren>
                        <Popconfirm
                            title="Ngưng sử dụng danh mục này?"
                            onConfirm={() => entity.id && handleDelete(entity.id)}
                            okText="Xác nhận"
                            cancelText="Huỷ"
                            placement="topRight"
                        >
                            <StopOutlined
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
            title="Quản lý danh mục phân quyền"
            filter={
                <div className="flex flex-col gap-3">
                    <SearchFilter
                        searchPlaceholder="Tìm kiếm theo tên hoặc mã danh mục..."
                        addLabel="Thêm danh mục"
                        showFilterButton={false}
                        onSearch={setSearchValue}
                        onReset={handleReset}
                        onAddClick={() => {
                            setDataInit(null);
                            setOpenModal(true);
                        }}
                        addPermission={ALL_PERMISSIONS.PERMISSION_CATEGORY.CREATE}
                    />
                    <AdvancedFilterSelect
                        resetSignal={resetSignal}
                        fields={[
                            {
                                key: "companyId",
                                label: "Công ty",
                                asyncOptions: async () => {
                                    const res = await callFetchCompany("page=1&size=100&sort=name,asc");
                                    return (res.data?.result ?? []).map((c: ICompany) => ({
                                        label: c.name,
                                        value: c.id,
                                    }));
                                },
                            },
                            {
                                key: "departmentId",
                                label: "Phòng ban",
                                dependsOn: "companyId",
                                asyncOptions: async (companyId) => {
                                    const res = await callFetchDepartmentsByCompany(companyId);
                                    return (res.data ?? []).map((d: IDepartment) => ({
                                        label: d.name,
                                        value: d.id,
                                    }));
                                },
                            },
                            {
                                key: "status",
                                label: "Trạng thái",
                                options: [
                                    { label: "Đang hoạt động", value: 1, color: "green" },
                                    { label: "Ngừng hoạt động", value: 0, color: "red" },
                                ],
                            },
                        ]}
                        onChange={(val) => {
                            setCompanyIdFilter(val.companyId ?? null);
                            setDepartmentIdFilter(val.departmentId ?? null);
                            setStatusFilter(val.status ?? null);
                        }}
                    />
                </div>
            }
        >
            <Access permission={ALL_PERMISSIONS.PERMISSION_CATEGORY.GET_PAGINATE}>
                <DataTable<IPermissionCategory>
                    actionRef={tableRef}
                    rowKey="id"
                    loading={isFetching}
                    columns={columns}
                    dataSource={categories}
                    scroll={{ x: "max-content" }}   // ← bắt buộc để fixed: "right" hoạt động
                    request={async (params, sort) => {
                        const q = buildQuery(params, sort);
                        setQuery(q);
                        return {
                            data: categories,
                            success: true,
                            total: meta.total,
                        };
                    }}
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
                onSuccess={() => refetch()}
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