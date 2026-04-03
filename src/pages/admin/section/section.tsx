import { useEffect, useRef, useState } from "react";
import { Space, Tag, Badge, Button, Dropdown } from "antd";
import {
    EditOutlined,
    EyeOutlined,
    MoreOutlined,
    DollarOutlined,
    ApartmentOutlined,
    RiseOutlined,
    AimOutlined,
    LockOutlined,
} from "@ant-design/icons";

import type { ProColumns, ActionType } from "@ant-design/pro-components";
import type { MenuProps } from "antd";
import queryString from "query-string";

import PageContainer from "@/components/common/data-table/PageContainer";
import DataTable from "@/components/common/data-table";
import SearchFilter from "@/components/common/filter/SearchFilter";
import AdvancedFilterSelect from "@/components/common/filter/AdvancedFilterSelect";

import type { ISection } from "@/types/backend";
import { PAGINATION_CONFIG } from "@/config/pagination";
import { callFetchCompany, callFetchDepartmentsByCompany } from "@/config/api";
import { useSectionsQuery } from "@/hooks/useSections";

import ModalSection from "./modal.section";
import ViewDetailSection from "./view.section";
import { ALL_PERMISSIONS } from "@/config/permissions";
import Access from "@/components/share/access";
import useAccess from "@/hooks/useAccess";
import { useNavigate } from "react-router-dom";
import { FileTextOutlined } from "@ant-design/icons";
import SectionJobTitleTab from "./tab.section-job-title";
import { Modal } from "antd";
const SectionPage = () => {
    const navigate = useNavigate();

    const [openModal, setOpenModal] = useState(false);
    const [dataInit, setDataInit] = useState<ISection | null>(null);
    const [openViewDetail, setOpenViewDetail] = useState(false);

    const [searchValue, setSearchValue] = useState("");
    const [departmentIdFilter, setDepartmentIdFilter] = useState<number | null>(null);
    const [statusFilter, setStatusFilter] = useState<number | null>(null);
    const [resetSignal, setResetSignal] = useState(0);

    const tableRef = useRef<ActionType>(null);

    const [query, setQuery] = useState(
        `page=${PAGINATION_CONFIG.DEFAULT_PAGE}&size=${PAGINATION_CONFIG.DEFAULT_PAGE_SIZE}&sort=createdAt,desc`
    );

    const { data, isFetching, refetch } = useSectionsQuery(query);

    const meta = data?.meta ?? { page: 1, pageSize: 10, total: 0 };
    const sections = data?.result ?? [];
    const [openJobTitle, setOpenJobTitle] = useState(false);
    /*
     * ===================== BUILD FILTERS =====================
     */
    const buildFilters = (
        search: string,
        departmentId: number | null,
        status: number | null,
    ) => {
        const parts: string[] = [];

        if (search)
            parts.push(`(name~'${search}' or code~'${search}')`);

        if (departmentId)
            parts.push(`department.id:${departmentId}`);

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

        const filters = buildFilters(searchValue, departmentIdFilter, statusFilter);
        if (filters.length > 0) q.filter = filters.join(" and ");

        setQuery(queryString.stringify(q, { encode: false }));
    }, [searchValue, departmentIdFilter, statusFilter]);

    /*
     * ===================== BUILD QUERY FOR TABLE =====================
     */
    const buildQuery = (params: any, sort: any) => {
        const q: any = {
            page: params.current,
            size: params.pageSize || PAGINATION_CONFIG.DEFAULT_PAGE_SIZE,
        };

        const filters = buildFilters(searchValue, departmentIdFilter, statusFilter);
        if (filters.length > 0) q.filter = filters.join(" and ");

        let sortBy = "sort=createdAt,desc";
        if (sort?.name)
            sortBy = sort.name === "ascend" ? "sort=name,asc" : "sort=name,desc";

        return `${queryString.stringify(q, { encode: false })}&${sortBy}`;
    };

    /*
     * ===================== RESET =====================
     */
    const handleReset = () => {
        setSearchValue("");
        setDepartmentIdFilter(null);
        setStatusFilter(null);
        setResetSignal((s) => s + 1);
        refetch();
    };

    /*
     * ===================== COLUMNS =====================
     */
    const columns: ProColumns<ISection>[] = [
        {
            title: "STT",
            width: 60,
            align: "center",
            render: (_, __, idx) => idx + 1 + (meta.page - 1) * meta.pageSize,
        },
        {
            title: "Mã bộ phận",
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
                        border: "1px solid #FFD591",
                        background: "#FFF7E6",
                        color: "#D46B08",
                    }}
                >
                    {record.code}
                </Tag>
            ),
        },
        { title: "Tên bộ phận", dataIndex: "name", sorter: true },
        {
            title: "Phòng ban",
            dataIndex: ["department", "name"],
            align: "center",
            render: (v) => <Tag color="cyan">{v || "--"}</Tag>,
        },
        {
            title: "Trạng thái",
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
            width: 180,
            fixed: "right",
            render: (_, record) => {
                const items: MenuProps["items"] = [
                    // {
                    //     key: "salary",
                    //     icon: <DollarOutlined style={{ color: "#eb2f96" }} />,
                    //     label: "Khung lương",
                    //     onClick: () =>
                    //         navigate(
                    //             `/admin/sections/${record.id}/salary-range?sectionName=${encodeURIComponent(record.name)}`
                    //         ),
                    // },
                    // {
                    //     key: "org-chart",
                    //     icon: <ApartmentOutlined style={{ color: "#eb2f96" }} />,
                    //     label: "Sơ đồ tổ chức",
                    //     onClick: () =>
                    //         navigate(
                    //             `/admin/sections/${record.id}/org-chart?sectionName=${encodeURIComponent(record.name)}`
                    //         ),
                    // },
                    // {
                    //     key: "career-paths",
                    //     icon: <RiseOutlined style={{ color: "#eb2f96" }} />,
                    //     label: "Lộ trình thăng tiến",
                    //     onClick: () =>
                    //         navigate(
                    //             `/admin/sections/${record.id}/career-paths?sectionName=${encodeURIComponent(record.name)}`
                    //         ),
                    // },
                    // {
                    //     key: "objectives-tasks",
                    //     icon: <AimOutlined style={{ color: "#eb2f96" }} />,
                    //     label: "Mục tiêu nhiệm vụ",
                    //     onClick: () =>
                    //         navigate(
                    //             `/admin/sections/${record.id}/objectives-tasks?sectionName=${encodeURIComponent(record.name)}`
                    //         ),
                    // },
                    // {
                    //     key: "permissions",
                    //     icon: <LockOutlined style={{ color: "#eb2f96" }} />,
                    //     label: "Bản phân quyền",
                    //     onClick: () =>
                    //         navigate(
                    //             `/admin/sections/${record.id}/permissions?sectionName=${encodeURIComponent(record.name)}`
                    //         ),
                    // },
                ];

                return (
                    <Space size="middle">
                        <Access permission={ALL_PERMISSIONS.SECTIONS.GET_BY_ID} hideChildren>
                            <Button
                                type="text"
                                icon={<EyeOutlined style={{ color: "#1677ff", fontSize: 18 }} />}
                                onClick={() => {
                                    setDataInit(record);
                                    setOpenViewDetail(true);
                                }}
                            />
                        </Access>
                        <Access
                            permission={ALL_PERMISSIONS.SECTION_JOB_TITLES.GET_PAGINATE}
                            hideChildren
                        >
                            <Button
                                type="text"
                                icon={<FileTextOutlined style={{ color: "#13c2c2", fontSize: 18 }} />}
                                onClick={() => {
                                    setDataInit(record);
                                    setOpenJobTitle(true);
                                }}
                            />
                        </Access>
                        <Access permission={ALL_PERMISSIONS.SECTIONS.UPDATE} hideChildren>
                            <Button
                                type="text"
                                icon={<EditOutlined style={{ color: "#fa8c16", fontSize: 18 }} />}
                                onClick={() => {
                                    setDataInit(record);
                                    setOpenModal(true);
                                }}
                            />
                        </Access>
                        {/* <Dropdown menu={{ items }} trigger={["click"]} placement="bottomRight">
                            <Button
                                type="text"
                                icon={<MoreOutlined style={{ color: "#595959", fontSize: 18 }} />}
                                className="hover:bg-pink-50 hover:text-pink-600"
                            />
                        </Dropdown> */}
                    </Space>
                );
            },
        },
    ];

    return (
        <PageContainer
            title="Quản lý bộ phận"
            filter={
                <div className="flex flex-col gap-3">
                    <SearchFilter
                        searchPlaceholder="Tìm mã hoặc tên bộ phận..."
                        addLabel="Thêm bộ phận"
                        showFilterButton={false}
                        onSearch={(v) => setSearchValue(v)}
                        onReset={handleReset}
                        onAddClick={() => {
                            setDataInit(null);
                            setOpenModal(true);
                        }}
                        addPermission={ALL_PERMISSIONS.SECTIONS.CREATE}  // 👈 thêm dòng này

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
                                key: "departmentId",
                                label: "Phòng ban",
                                type: "async-select",
                                dependsOn: "companyId",
                                loadOptionsWithDep: async (companyId: number) => {
                                    const res = await callFetchDepartmentsByCompany(companyId);
                                    return (res?.data ?? []).map((d: any) => ({
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
                            setDepartmentIdFilter(
                                val.departmentId !== undefined ? val.departmentId : null
                            );
                            setStatusFilter(
                                val.status !== undefined ? val.status : null
                            );
                        }}
                    />
                </div>
            }
        >
            <DataTable<ISection>
                actionRef={tableRef}
                rowKey="id"
                loading={isFetching}
                columns={columns}
                dataSource={sections}
                request={async (params, sort) => {
                    const q = buildQuery(params, sort);
                    setQuery(q);
                    return {
                        data: sections,
                        success: true,
                        total: meta.total,
                    };
                }}
                pagination={{
                    current: meta.page,
                    pageSize: meta.pageSize,
                    total: meta.total,
                }}
            />

            <ModalSection
                openModal={openModal}
                setOpenModal={setOpenModal}
                dataInit={dataInit}
                setDataInit={setDataInit}
            />

            <ViewDetailSection
                open={openViewDetail}
                onClose={setOpenViewDetail}
                dataInit={dataInit}
                setDataInit={setDataInit}
            />
            {openJobTitle && dataInit?.id && (
                <Modal
                    title={`Chức danh bộ phận: ${dataInit.name}`}
                    open={openJobTitle}
                    onCancel={() => setOpenJobTitle(false)}
                    footer={null}
                    width="80vw"
                    destroyOnClose
                >
                    <SectionJobTitleTab
                        sectionId={dataInit.id}
                        departmentId={dataInit.department?.id}
                    />
                </Modal>
            )}
        </PageContainer>
    );
};

export default SectionPage;