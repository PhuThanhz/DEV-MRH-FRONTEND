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

import type { IDepartment, ICompany } from "@/types/backend";
import { PAGINATION_CONFIG } from "@/config/pagination";
import { callFetchCompany } from "@/config/api";
import DepartmentJobTitleTab from "./tab.department-job-title";
import { Modal } from "antd";
import {
    useDepartmentsQuery,
    useDeleteDepartmentMutation,
} from "@/hooks/useDepartments";

import ModalDepartment from "./modal.department";
import ViewDepartment from "./view.department";
import PermissionViewModal from "./permissions/components/PermissionViewModal";
import PositionChartModal from "@/pages/admin/department/position-chart/PositionChartModal";

import { PATHS } from "@/constants/paths";
import Access from "@/components/share/access";
import useAccess from "@/hooks/useAccess";
import { ALL_PERMISSIONS } from "@/config/permissions";

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
    const [openJobTitle, setOpenJobTitle] = useState(false);
    // ===================== PERMISSION CHECKS =====================
    const canViewOrgChart = useAccess(ALL_PERMISSIONS.ORG_CHARTS.GET_PAGINATE);
    const canViewObjectives = useAccess(ALL_PERMISSIONS.DEPARTMENT_OBJECTIVES.VIEW);
    const canViewProcedures = useAccess(
        ALL_PERMISSIONS.PROCEDURE_DEPARTMENT.GET_PAGINATE
    ); const canViewPermissions = useAccess(ALL_PERMISSIONS.PERMISSION_ASSIGNMENT.GET_MATRIX);
    const canViewCareerPaths = useAccess(ALL_PERMISSIONS.CAREER_PATHS.GET_BY_DEPARTMENT);
    const canViewSalary = useAccess(ALL_PERMISSIONS.SALARY_RANGE.VIEW)
        || useAccess(ALL_PERMISSIONS.SALARY_RANGE.VIEW_MY); const canViewPositionChart = useAccess(
            ALL_PERMISSIONS.POSITION_CHART.VIEW
        );
    const canDeleteDepartment = useAccess(ALL_PERMISSIONS.DEPARTMENTS.DELETE);
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
     * ===================== BUILD DROPDOWN ITEMS =====================
     */
    const buildDropdownItems = (record: IDepartment) => {
        const items: any[] = [];

        if (canViewOrgChart) items.push({
            key: "org-chart",
            icon: <ApartmentOutlined style={{ color: "#eb2f96" }} />,
            label: <span>Sơ đồ tổ chức</span>,
            onClick: () => navigate(
                `/admin/departments/${record.id}/org-chart?departmentName=${encodeURIComponent(record.name)}`
            ),
        });

        if (canViewObjectives) items.push({
            key: "objectives-tasks",
            icon: <AimOutlined style={{ color: "#eb2f96" }} />,
            label: <span>Mục tiêu - Nhiệm vụ</span>,
            onClick: () => navigate(
                PATHS.ADMIN.DEPARTMENT_OBJECTIVES.replace(":departmentId", String(record.id))
                + `?departmentName=${encodeURIComponent(record.name)}`
            ),
        });

        if (canViewProcedures) items.push({
            key: "department-procedures",
            icon: <FileTextOutlined style={{ color: "#eb2f96" }} />,
            label: <span>Quy trình phòng ban</span>,
            onClick: () => navigate(
                PATHS.ADMIN.DEPARTMENT_PROCEDURES.replace(":departmentId", String(record.id))
                + `?departmentName=${encodeURIComponent(record.name)}`
            ),
        });

        if (canViewPermissions) items.push({
            key: "permissions",
            icon: <LockOutlined style={{ color: "#eb2f96" }} />,
            label: <span>Phân quyền</span>,
            onClick: () => {
                setSelectedDepartment({
                    id: record.id!,
                    name: record.name,
                    companyName: record.company?.name || "",
                });
                setOpenPermissionModal(true);
            },
        });

        if (canViewCareerPaths) items.push({
            key: "career-paths",
            icon: <RiseOutlined style={{ color: "#eb2f96" }} />,
            label: <span>Lộ trình thăng tiến</span>,
            onClick: () => navigate(
                `/admin/departments/${record.id}/career-paths?departmentName=${encodeURIComponent(record.name)}`
            ),
        });

        if (canViewSalary) items.push({
            key: "salary",
            icon: <DollarOutlined style={{ color: "#eb2f96" }} />,
            label: <span>Khung lương</span>,
            onClick: () => navigate(
                `/admin/departments/${record.id}/salary-range?departmentName=${encodeURIComponent(record.name)}`
            ),
        });

        if (canViewPositionChart) items.push({
            key: "position-chart",
            icon: <TeamOutlined style={{ color: "#eb2f96" }} />,
            label: <span>Bản đồ chức danh</span>,
            onClick: () => {
                setSelectedDepartment({
                    id: record.id!,
                    name: record.name,
                    companyName: record.company?.name || "",
                });
                setOpenPositionChartModal(true);
            },
        });

        // Chỉ thêm divider khi có item phía trên và có quyền xóa
        if (items.length > 0 && canDeleteDepartment) {
            items.push({ type: "divider" });
        }

        // Nút xóa chỉ hiển thị khi có quyền DELETE
        if (canDeleteDepartment) {
            items.push({
                key: "delete",
                icon: <DeleteOutlined style={{ color: "#ff4d4f" }} />,
                danger: true,
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
            });
        }

        return items;
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
            align: "center",
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
            render: (_, record) => {
                const dropdownItems = buildDropdownItems(record);

                return (
                    <Space size="middle">

                        {/* Xem chi tiết */}
                        <Access permission={ALL_PERMISSIONS.DEPARTMENTS.GET_BY_ID} hideChildren>
                            <Button
                                type="text"
                                icon={<EyeOutlined style={{ color: "#1677ff", fontSize: 18 }} />}
                                onClick={() => {
                                    setDataInit(record);
                                    setOpenView(true);
                                }}
                            />
                        </Access>
                        <Access
                            permission={ALL_PERMISSIONS.DEPARTMENT_JOB_TITLES.GET_PAGINATE}
                            hideChildren
                        >
                            <Tag
                                color="cyan"
                                style={{
                                    cursor: "pointer",
                                    borderRadius: 6,
                                    padding: "2px 10px",
                                    fontWeight: 500,
                                }}
                                onClick={() => {
                                    setDataInit(record);
                                    setOpenJobTitle(true);
                                }}
                            >
                                Cấu hình chức danh
                            </Tag>
                        </Access>
                        {/* Sửa */}
                        <Access permission={ALL_PERMISSIONS.DEPARTMENTS.UPDATE} hideChildren>
                            <Button
                                type="text"
                                icon={<EditOutlined style={{ color: "#fa8c16", fontSize: 18 }} />}
                                onClick={() => {
                                    setDataInit(record);
                                    setOpenModal(true);
                                }}
                            />
                        </Access>
                        {/* Dropdown chỉ hiển thị khi có ít nhất một quyền */}
                        {dropdownItems.length > 0 && (
                            <Dropdown
                                menu={{ items: dropdownItems }}
                                trigger={["click"]}
                                placement="bottomRight"
                            >
                                <Button
                                    icon={<MoreOutlined style={{ fontSize: 18 }} />}
                                    type="text"
                                />
                            </Dropdown>
                        )}
                    </Space>
                );
            },
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
                        addPermission={ALL_PERMISSIONS.DEPARTMENTS.CREATE}  // 👈 thêm dòng này

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
                                key: "status",
                                label: "Trạng thái",
                                options: [
                                    { label: "Hoạt động", value: 1, color: "green" },
                                    { label: "Ngừng hoạt động", value: 0, color: "red" },
                                ],
                            },
                        ]}
                        onChange={(val) => {
                            setCompanyIdFilter(val.companyId ?? null);
                            setStatusFilter(val.status ?? null);
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
            {openJobTitle && dataInit?.id && (
                <Modal
                    title={`Chức danh phòng ban: ${dataInit.name}`}
                    open={openJobTitle}
                    onCancel={() => setOpenJobTitle(false)}
                    footer={null}
                    width="80vw"
                    destroyOnClose
                >
                    <DepartmentJobTitleTab
                        departmentId={dataInit.id}
                        companyId={dataInit.company?.id}
                    />
                </Modal>
            )}


            {selectedDepartment && (
                <Modal
                    open={openPermissionModal}
                    onCancel={() => setOpenPermissionModal(false)}
                    footer={null}
                    width="90vw"
                    destroyOnClose
                    title={`Phân quyền — ${selectedDepartment.name}`}
                >
                    <PermissionViewModal
                        departmentId={selectedDepartment.id}   // ✅ QUAN TRỌNG
                        departmentName={selectedDepartment.name}
                    />
                </Modal>
            )}
            {/* ← THÊM ĐOẠN NÀY */}
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