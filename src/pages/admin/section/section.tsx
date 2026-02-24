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

import type { ISection } from "@/types/backend";
import { PAGINATION_CONFIG } from "@/config/pagination";
import { useSectionsQuery } from "@/hooks/useSections";

import ModalSection from "./modal.section";
import ViewDetailSection from "./view.section";

import { useNavigate } from "react-router-dom";


const SectionPage = () => {
    const navigate = useNavigate();

    const [openModal, setOpenModal] = useState(false);
    const [dataInit, setDataInit] = useState<ISection | null>(null);

    const [openViewDetail, setOpenViewDetail] = useState(false);
    const [searchValue, setSearchValue] = useState("");

    const tableRef = useRef<ActionType>(null);

    const [query, setQuery] = useState(
        `page=${PAGINATION_CONFIG.DEFAULT_PAGE}&size=${PAGINATION_CONFIG.DEFAULT_PAGE_SIZE}&sort=createdAt,desc`
    );

    const { data, isFetching, refetch } = useSectionsQuery(query);

    const meta = data?.meta ?? { page: 1, pageSize: 10, total: 0 };
    const sections = data?.result ?? [];

    // NOTE: Build query khi search thay đổi
    useEffect(() => {
        const q: any = {
            page: PAGINATION_CONFIG.DEFAULT_PAGE,
            size: PAGINATION_CONFIG.DEFAULT_PAGE_SIZE,
            sort: "createdAt,desc",
        };

        const filters: string[] = [];
        if (searchValue)
            filters.push(`(name~'${searchValue}' or code~'${searchValue}')`);

        if (filters.length > 0) q.filter = filters.join(" and ");
        setQuery(queryString.stringify(q, { encode: false }));
    }, [searchValue]);

    // NOTE: Build query cho Table request
    const buildQuery = (params: any, sort: any) => {
        const q: any = {
            page: params.current,
            size: params.pageSize || PAGINATION_CONFIG.DEFAULT_PAGE_SIZE,
        };

        const filters: string[] = [];
        if (searchValue)
            filters.push(`(name~'${searchValue}' or code~'${searchValue}')`);

        if (filters.length > 0) q.filter = filters.join(" and ");

        let sortBy = "sort=createdAt,desc";
        if (sort?.name)
            sortBy = sort.name === "ascend" ? "sort=name,asc" : "sort=name,desc";

        return `${queryString.stringify(q, { encode: false })}&${sortBy}`;
    };

    // NOTE: Columns đồng bộ UI với DepartmentPage / CompanyPage
    const columns: ProColumns<ISection>[] = [
        {
            title: "STT",
            width: 60,
            align: "center",
            render: (_, __, idx) => idx + 1 + (meta.page - 1) * meta.pageSize,
        },
        { title: "Mã bộ phận", dataIndex: "code", sorter: true },
        { title: "Tên bộ phận", dataIndex: "name", sorter: true },
        {
            title: "Phòng ban",
            dataIndex: ["department", "name"],
            render: (v) => <Tag color="blue">{v}</Tag>,
        },
        {
            title: "Trạng thái",
            dataIndex: "active",
            render: (_, r) =>
                r.active ? (
                    <Badge status="success" text="Đang hoạt động" />
                ) : (
                    <Badge status="error" text="Ngừng hoạt động" />
                ),
        },
        {
            title: "Hành động",
            align: "center",
            width: 180,
            fixed: "right",
            render: (_, record) => {
                // NOTE: Dropdown More giống CompanyPage – hiện chỉ UI (chưa gắn API)
                const items: MenuProps["items"] = [
                    {
                        key: "salary",
                        icon: <DollarOutlined style={{ color: "#eb2f96" }} />,
                        label: "Khung lương",
                        onClick: () =>
                            navigate(
                                `/admin/sections/${record.id}/salary-range?sectionName=${encodeURIComponent(
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
                                `/admin/sections/${record.id}/org-chart?sectionName=${encodeURIComponent(
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
                                `/admin/sections/${record.id}/career-paths?sectionName=${encodeURIComponent(
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
                                `/admin/sections/${record.id}/objectives-tasks?sectionName=${encodeURIComponent(
                                    record.name
                                )}`
                            ),
                    },
                    {
                        key: "permissions",
                        icon: <LockOutlined style={{ color: "#eb2f96" }} />,
                        label: "Bản phân quyền",
                        onClick: () =>
                            navigate(
                                `/admin/sections/${record.id}/permissions?sectionName=${encodeURIComponent(
                                    record.name
                                )}`
                            ),
                    },
                ];

                return (
                    <Space size="middle">
                        <Button
                            type="text"
                            icon={<EyeOutlined style={{ color: "#1677ff", fontSize: 18 }} />}
                            onClick={() => {
                                setDataInit(record);
                                setOpenViewDetail(true);
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

                        <Dropdown menu={{ items }} trigger={["click"]} placement="bottomRight">
                            <Button
                                type="text"
                                icon={
                                    <MoreOutlined
                                        style={{ color: "#595959", fontSize: 18 }}
                                    />
                                }
                                className="hover:bg-pink-50 hover:text-pink-600"
                            />
                        </Dropdown>
                    </Space>
                );
            },
        },
    ];

    return (
        <PageContainer
            title="Quản lý bộ phận"
            filter={
                <SearchFilter
                    searchPlaceholder="Tìm mã hoặc tên bộ phận..."
                    addLabel="Thêm bộ phận"
                    onSearch={(v) => setSearchValue(v)}
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
        </PageContainer>
    );
};

export default SectionPage;
