/* ===================== PROCESS ACTIONS ===================== */

import { useEffect, useRef, useState } from "react";
import { Space, Tag } from "antd";
import { EditOutlined, EyeOutlined } from "@ant-design/icons";
import type { ProColumns, ActionType } from "@ant-design/pro-components";
import queryString from "query-string";

import PageContainer from "@/components/common/data-table/PageContainer";
import DataTable from "@/components/common/data-table";
import SearchFilter from "@/components/common/filter/SearchFilter";

import Access from "@/components/share/access";
import { ALL_PERMISSIONS } from "@/config/permissions";
import { PAGINATION_CONFIG } from "@/config/pagination";
import type { IProcessAction } from "@/types/backend";
import { useProcessActionsQuery } from "@/hooks/useProcessActions";

import ModalProcessAction from "./modal.process-action";
import ViewProcessAction from "./view.process-action";

const ProcessActionPage = () => {
    const [openModal, setOpenModal] = useState(false);
    const [openView, setOpenView] = useState(false);
    const [dataInit, setDataInit] = useState<IProcessAction | null>(null);
    const [searchValue, setSearchValue] = useState("");

    const [query, setQuery] = useState(
        `page=${PAGINATION_CONFIG.DEFAULT_PAGE}&size=${PAGINATION_CONFIG.DEFAULT_PAGE_SIZE}&sort=createdAt,desc`
    );

    const tableRef = useRef<ActionType>(null);
    const { data, isFetching, refetch } = useProcessActionsQuery(query);

    /* ===================== BUILD QUERY ===================== */
    useEffect(() => {
        const q: any = {
            page: PAGINATION_CONFIG.DEFAULT_PAGE,
            size: PAGINATION_CONFIG.DEFAULT_PAGE_SIZE,
            sort: "createdAt,desc",
        };

        if (searchValue) {
            q.filter = `(code~'${searchValue}' or name~'${searchValue}')`;
        }

        setQuery(queryString.stringify(q, { encode: false }));
    }, [searchValue]);

    const meta = data?.meta ?? {
        page: 1,
        pageSize: 10,
        total: 0,
    };

    /* ===================== COLUMNS ===================== */
    const columns: ProColumns<IProcessAction>[] = [
        {
            title: "STT",
            key: "index",
            width: 60,
            align: "center",
            render: (_, __, index) =>
                index + 1 + ((meta.page || 1) - 1) * (meta.pageSize || 10),
        },
        {
            title: "Mã hành động",
            dataIndex: "code",
            sorter: true,
            width: 180,
            render: (text) => (
                <Tag color="purple" style={{ fontFamily: "monospace" }}>
                    {text}
                </Tag>
            ),
        },
        {
            title: "Tên hành động",
            dataIndex: "name",
            sorter: true,
            width: 250,
            render: (text) => <span style={{ fontWeight: 500 }}>{text}</span>,
        },
        {
            title: "Trạng thái",
            dataIndex: "active",
            width: 150,
            align: "center",
            render: (_, record) =>
                record.active ? (
                    <Tag color="green">Hoạt động</Tag>
                ) : (
                    <Tag color="red">Ngừng hoạt động</Tag>
                ),
        },
        {
            title: "Hành động",
            align: "center",
            width: 120,
            render: (_, entity) => (
                <Space>
                    <Access permission={ALL_PERMISSIONS.PROCESS_ACTIONS.GET_BY_ID} hideChildren>
                        <EyeOutlined
                            style={{
                                fontSize: 18,
                                color: "#1677ff",
                                cursor: "pointer",
                            }}
                            onClick={() => {
                                setDataInit(entity);
                                setOpenView(true);
                            }}
                        />
                    </Access>

                    <Access permission={ALL_PERMISSIONS.PROCESS_ACTIONS.UPDATE} hideChildren>
                        <EditOutlined
                            style={{
                                fontSize: 18,
                                color: "#fa8c16",
                                cursor: "pointer",
                            }}
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
            title="Quản lý Raci"
            filter={
                <SearchFilter
                    searchPlaceholder="Tìm kiếm theo mã hoặc tên hành động..."
                    addLabel="Thêm hành động"
                    showFilterButton={false}
                    onSearch={setSearchValue}
                    onReset={() => setSearchValue("")}
                    onAddClick={() => {
                        setDataInit(null);
                        setOpenModal(true);
                    }}
                />
            }
        >
            <Access permission={ALL_PERMISSIONS.PROCESS_ACTIONS.GET_PAGINATE}>
                <DataTable<IProcessAction>
                    actionRef={tableRef}
                    rowKey="id"
                    loading={isFetching}
                    columns={columns}
                    dataSource={data?.result ?? []}
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
            <ModalProcessAction
                openModal={openModal}
                setOpenModal={setOpenModal}
                dataInit={dataInit}
                setDataInit={setDataInit}
            />

            <ViewProcessAction
                open={openView}
                onClose={setOpenView}
                dataInit={dataInit}
                setDataInit={setDataInit}
            />
        </PageContainer>
    );
};

export default ProcessActionPage;