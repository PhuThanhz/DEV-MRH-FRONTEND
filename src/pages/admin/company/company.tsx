import { useEffect, useRef, useState } from "react";
import type { ProColumns, ActionType } from "@ant-design/pro-components";
import type { MenuProps } from "antd";

import queryString from "query-string";
import {
    Space,
    Tag,
    Popconfirm,
    Badge,
    Button,
    Dropdown,
} from "antd";

import {
    EditOutlined,
    StopOutlined,
    CheckCircleOutlined,
    EyeOutlined,
    MoreOutlined,
    ApartmentOutlined,
} from "@ant-design/icons";

import PageContainer from "@/components/common/data-table/PageContainer";
import DataTable from "@/components/common/data-table";
import SearchFilter from "@/components/common/filter/SearchFilter";

import type { ICompany } from "@/types/backend";
import { PAGINATION_CONFIG } from "@/config/pagination";

import {
    useCompaniesQuery,
    useInactiveCompanyMutation,
    useActiveCompanyMutation,
} from "@/hooks/useCompanies";

import Access from "@/components/share/access";
import { ALL_PERMISSIONS } from "@/config/permissions";

import ModalCompany from "./modal.company";
import ViewCompany from "./view.company";

import { useNavigate } from "react-router-dom";

const CompanyPage = () => {
    const navigate = useNavigate();

    const [openModal, setOpenModal] = useState(false);
    const [openView, setOpenView] = useState(false);
    const [dataInit, setDataInit] = useState<ICompany | null>(null);
    const [searchValue, setSearchValue] = useState("");

    const tableRef = useRef<ActionType>(null);

    const [query, setQuery] = useState(
        `page=${PAGINATION_CONFIG.DEFAULT_PAGE}&size=${PAGINATION_CONFIG.DEFAULT_PAGE_SIZE}&sort=createdAt,desc`
    );

    const { data, isFetching, refetch } = useCompaniesQuery(query);

    const { mutate: inactiveCompany, isPending: isInactivating } =
        useInactiveCompanyMutation();
    const { mutate: activeCompany, isPending: isActivating } =
        useActiveCompanyMutation();

    useEffect(() => {
        const q: any = {
            page: PAGINATION_CONFIG.DEFAULT_PAGE,
            size: PAGINATION_CONFIG.DEFAULT_PAGE_SIZE,
            sort: "createdAt,desc",
        };

        if (searchValue) {
            q.filter = `name~'${searchValue}'`;
        }

        setQuery(queryString.stringify(q, { encode: false }));
    }, [searchValue]);

    const meta = data?.meta ?? {
        page: 1,
        pageSize: PAGINATION_CONFIG.DEFAULT_PAGE_SIZE,
        total: 0,
    };

    const companies = data?.result ?? [];

    const columns: ProColumns<ICompany>[] = [
        {
            title: "STT",
            width: 60,
            align: "center",
            render: (_, __, index) =>
                index + 1 + (meta.page - 1) * meta.pageSize,
        },
        {
            title: "Tên công ty",
            dataIndex: "name",
        },
        {
            title: "Mã công ty",
            dataIndex: "code",
            render: (_, record) => <Tag color="blue">{record.code}</Tag>,
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
            width: 200,
            fixed: "right",
            render: (_, record) => {
                const items: MenuProps["items"] = [
                    {
                        key: "org-chart",
                        icon: (
                            <ApartmentOutlined style={{ color: "#eb2f96" }} />
                        ),
                        label: "Sơ đồ tổ chức",
                        onClick: () =>
                            navigate(
                                `/admin/companies/${record.id}/org-chart?companyName=${encodeURIComponent(
                                    record.name
                                )}`
                            ),
                    },

                    { type: "divider" },

                    record.status === 1
                        ? {
                            key: "inactive",
                            icon: (
                                <StopOutlined
                                    style={{ color: "#ff4d4f" }}
                                />
                            ),
                            label: (
                                <Popconfirm
                                    title="Vô hiệu hóa công ty?"
                                    okText="Xác nhận"
                                    cancelText="Hủy"
                                    okButtonProps={{
                                        loading: isInactivating,
                                    }}
                                    onConfirm={() =>
                                        inactiveCompany(record.id!, {
                                            onSuccess: () => refetch(),
                                        })
                                    }
                                >
                                    <span style={{ color: "#ff4d4f" }}>
                                        Vô hiệu hóa
                                    </span>
                                </Popconfirm>
                            ),
                        }
                        : {
                            key: "active",
                            icon: (
                                <CheckCircleOutlined
                                    style={{ color: "#52c41a" }}
                                />
                            ),
                            label: (
                                <Popconfirm
                                    title="Kích hoạt lại công ty?"
                                    okText="Xác nhận"
                                    cancelText="Hủy"
                                    okButtonProps={{
                                        loading: isActivating,
                                    }}
                                    onConfirm={() =>
                                        activeCompany(record.id!, {
                                            onSuccess: () => refetch(),
                                        })
                                    }
                                >
                                    <span style={{ color: "#52c41a" }}>
                                        Kích hoạt
                                    </span>
                                </Popconfirm>
                            ),
                        },
                ];

                return (
                    <Space size="middle">
                        <Access
                            permission={
                                ALL_PERMISSIONS.COMPANY_JOB_TITLES
                                    .GET_BY_COMPANY
                            }
                        >
                            <Button
                                type="text"
                                icon={
                                    <EyeOutlined
                                        style={{
                                            color: "#1677ff",
                                            fontSize: 18,
                                        }}
                                    />
                                }
                                onClick={() => {
                                    setDataInit(record);
                                    setOpenView(true);
                                }}
                            />
                        </Access>

                        <Access
                            permission={ALL_PERMISSIONS.COMPANIES.UPDATE}
                        >
                            <Button
                                type="text"
                                icon={
                                    <EditOutlined
                                        style={{
                                            color: "#fa8c16",
                                            fontSize: 18,
                                        }}
                                    />
                                }
                                onClick={() => {
                                    setDataInit(record);
                                    setOpenModal(true);
                                }}
                            />
                        </Access>

                        <Dropdown
                            menu={{ items }}
                            trigger={["click"]}
                            placement="bottomRight"
                        >
                            <Button
                                type="text"
                                icon={
                                    <MoreOutlined
                                        style={{
                                            color: "#595959",
                                            fontSize: 18,
                                        }}
                                    />
                                }
                            />
                        </Dropdown>
                    </Space>
                );
            },
        },
    ];

    return (
        <PageContainer
            title="Quản lý công ty"
            filter={
                <SearchFilter
                    searchPlaceholder="Tìm theo tên công ty..."
                    addLabel="Thêm công ty"
                    showFilterButton={false}
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
            <Access
                permission={ALL_PERMISSIONS.COMPANIES.GET_PAGINATE}
            >
                <DataTable<ICompany>
                    actionRef={tableRef}
                    rowKey="id"
                    loading={isFetching}
                    columns={columns}
                    dataSource={companies}
                    pagination={{
                        current: meta.page,
                        pageSize: meta.pageSize,
                        total: meta.total,
                        showQuickJumper: true,
                    }}
                />
            </Access>

            <ModalCompany
                openModal={openModal}
                setOpenModal={setOpenModal}
                dataInit={dataInit}
                setDataInit={setDataInit}
            />

            <ViewCompany
                open={openView}
                onClose={() => setOpenView(false)}
                dataInit={dataInit}
            />
        </PageContainer>
    );
};

export default CompanyPage;
