import { useEffect, useRef, useState } from "react";
import { Space, Tag, Button, Dropdown } from "antd";
import {
    EditOutlined,
    EyeOutlined,
    MoreOutlined,
    SettingOutlined,
} from "@ant-design/icons";

import type { ProColumns, ActionType } from "@ant-design/pro-components";
import type { MenuProps } from "antd";
import queryString from "query-string";

import PageContainer from "@/components/common/data-table/PageContainer";
import DataTable from "@/components/common/data-table";
import SearchFilter from "@/components/common/filter/SearchFilter";
import AdvancedFilterSelect from "@/components/common/filter/AdvancedFilterSelect";

import type { ISection, ICompany, IDepartment } from "@/types/backend";
import { PAGINATION_CONFIG } from "@/config/pagination";
import { callFetchCompany, callFetchDepartmentsByCompany } from "@/config/api";
import { useSectionsQuery } from "@/hooks/useSections";

import ModalSection from "./modal.section";
import ViewDetailSection from "./view.section";
import { ALL_PERMISSIONS } from "@/config/permissions";
import Access from "@/components/share/access";
import useAccess from "@/hooks/useAccess";
import SectionJobTitleTab from "./tab.section-job-title";
import { Modal } from "antd";

const SectionPage = () => {
    const [openModal, setOpenModal] = useState(false);
    const [dataInit, setDataInit] = useState<ISection | null>(null);
    const [openViewDetail, setOpenViewDetail] = useState(false);
    const [openJobTitle, setOpenJobTitle] = useState(false);

    const [searchValue, setSearchValue] = useState("");
    const [companyIdFilter, setCompanyIdFilter] = useState<number | null>(null);
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

    // ===================== PERMISSION CHECKS =====================
    const canViewJobTitles = useAccess(ALL_PERMISSIONS.SECTION_JOB_TITLES.GET_PAGINATE);

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
        if (sort?.name)
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

    // ===================== COLUMNS =====================
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
            width: 120,
            fixed: "right",             // ← sticky bên phải khi scroll ngang
            render: (_, record) => {
                const items: MenuProps["items"] = [];

                // ── Cấu hình chức danh ── (vào dropdown)
                if (canViewJobTitles) {
                    items.push({
                        key: "job-title",
                        icon: <SettingOutlined style={{ color: "#13c2c2" }} />,
                        label: "Cấu hình chức danh",
                        onClick: () => {
                            setDataInit(record);
                            setOpenJobTitle(true);
                        },
                    });
                }

                return (
                    <Space size={4} align="center">
                        {/* Xem chi tiết */}
                        <Access permission={ALL_PERMISSIONS.SECTIONS.GET_BY_ID} hideChildren>
                            <Button
                                type="text"
                                size="small"
                                icon={<EyeOutlined style={{ color: "#1677ff", fontSize: 16 }} />}
                                onClick={() => {
                                    setDataInit(record);
                                    setOpenViewDetail(true);
                                }}
                            />
                        </Access>

                        {/* Chỉnh sửa */}
                        <Access permission={ALL_PERMISSIONS.SECTIONS.UPDATE} hideChildren>
                            <Button
                                type="text"
                                size="small"
                                icon={<EditOutlined style={{ color: "#fa8c16", fontSize: 16 }} />}
                                onClick={() => {
                                    setDataInit(record);
                                    setOpenModal(true);
                                }}
                            />
                        </Access>

                        {/* Dropdown 3 chấm */}
                        {items.length > 0 && (
                            <Dropdown
                                menu={{ items }}
                                trigger={["click"]}
                                placement="bottomRight"
                            >
                                <Button
                                    type="text"
                                    size="small"
                                    icon={<MoreOutlined style={{ color: "#595959", fontSize: 16 }} />}
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
                        addPermission={ALL_PERMISSIONS.SECTIONS.CREATE}
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
            <DataTable<ISection>
                actionRef={tableRef}
                rowKey="id"
                loading={isFetching}
                columns={columns}
                dataSource={sections}
                scroll={{ x: "max-content" }}   // ← bắt buộc để fixed: "right" hoạt động
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
                onSuccess={() => refetch()}
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