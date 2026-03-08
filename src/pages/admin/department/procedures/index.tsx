import { useEffect, useRef, useState } from "react";
import { Space, Tag, Button } from "antd";
import {
    EyeOutlined,
    EditOutlined,
    DeleteOutlined,
    PlusOutlined,
} from "@ant-design/icons";
import type { ProColumns, ActionType } from "@ant-design/pro-components";
import queryString from "query-string";

import { useParams, useSearchParams } from "react-router-dom";

import PageContainer from "@/components/common/data-table/PageContainer";
import DataTable from "@/components/common/data-table";
import SearchFilter from "@/components/common/filter/SearchFilter";
import AdvancedFilterSelect from "@/components/common/filter/AdvancedFilterSelect";

import ModalProcedure from "./modal.procedure";
import ViewProcedure from "./view.procedure";

import {
    useDepartmentProceduresQuery,
    useDeleteDepartmentProcedureMutation,
} from "@/hooks/useDepartmentProcedures";

import type { IDepartmentProcedure } from "@/types/backend";
import { PAGINATION_CONFIG } from "@/config/pagination";

const DepartmentProcedurePage = () => {


    const tableRef = useRef<ActionType>(null);

    const { departmentId } = useParams();
    const [searchParams] = useSearchParams();
    const departmentName = searchParams.get("departmentName");

    const [openModal, setOpenModal] = useState(false);
    const [openView, setOpenView] = useState(false);
    const [dataInit, setDataInit] = useState<IDepartmentProcedure | null>(null);

    const [statusFilter, setStatusFilter] = useState<string | null>(null);
    const [searchValue, setSearchValue] = useState<string>("");

    const [query, setQuery] = useState(
        `page=${PAGINATION_CONFIG.DEFAULT_PAGE}&size=${PAGINATION_CONFIG.DEFAULT_PAGE_SIZE}&sort=createdAt,desc&filter=departmentId:${departmentId}`
    );

    const { data, isFetching, refetch } = useDepartmentProceduresQuery(query);
    const deleteMutation = useDeleteDepartmentProcedureMutation();

    const meta = data?.meta ?? {
        page: 1,
        pageSize: PAGINATION_CONFIG.DEFAULT_PAGE_SIZE,
        total: 0,
    };

    const procedures = data?.result ?? [];

    useEffect(() => {

        const q: any = {
            page: PAGINATION_CONFIG.DEFAULT_PAGE,
            size: PAGINATION_CONFIG.DEFAULT_PAGE_SIZE,
            sort: "createdAt,desc",
        };

        const filters: string[] = [`departmentId:${departmentId}`];

        if (searchValue) {
            filters.push(`procedureName~'${searchValue}'`);
        }

        if (statusFilter) {
            filters.push(`status='${statusFilter}'`);
        }

        if (filters.length > 0) {
            q.filter = filters.join(" and ");
        }

        setQuery(queryString.stringify(q, { encode: false }));

    }, [searchValue, statusFilter, departmentId]);

    const handleDelete = async (id: number) => {
        await deleteMutation.mutateAsync(id);
        refetch();
    };

    const buildQuery = (params: any) => {

        const q: any = {
            page: params.current,
            size: params.pageSize || PAGINATION_CONFIG.DEFAULT_PAGE_SIZE,
        };

        const filters: string[] = [`departmentId:${departmentId}`];

        if (searchValue) {
            filters.push(`procedureName~'${searchValue}'`);
        }

        if (statusFilter) {
            filters.push(`status='${statusFilter}'`);
        }

        if (filters.length > 0) {
            q.filter = filters.join(" and ");
        }

        return `${queryString.stringify(q, { encode: false })}&sort=createdAt,desc`;
    };

    const columns: ProColumns<IDepartmentProcedure>[] = [

        {
            title: "STT",
            width: 60,
            align: "center",
            render: (_, __, index) =>
                index + 1 + ((meta.page || 1) - 1) * (meta.pageSize || 10),
        },

        {
            title: "Tên quy trình",
            dataIndex: "procedureName",
        },

        {
            title: "Phòng ban",
            dataIndex: "departmentName",
        },

        {
            title: "Bộ phận",
            dataIndex: "sectionName",
        },

        {
            title: "Năm kế hoạch",
            dataIndex: "planYear",
            align: "center",
        },

        {
            title: "Trạng thái",
            dataIndex: "status",
            align: "center",
            render: (_, record) => {

                const colorMap: Record<string, string> = {
                    NEED_CREATE: "orange",
                    IN_PROGRESS: "blue",
                    NEED_UPDATE: "purple",
                    TERMINATED: "red",
                };

                return (
                    <Tag color={colorMap[record.status] || "default"}>
                        {record.status}
                    </Tag>
                );
            },
        },

        {
            title: "Hành động",
            align: "center",
            width: 140,
            render: (_, record) => (
                <Space>

                    <EyeOutlined
                        style={{ fontSize: 18, color: "#1677ff", cursor: "pointer" }}
                        onClick={() => {
                            setDataInit(record);
                            setOpenView(true);
                        }}
                    />

                    <EditOutlined
                        style={{ fontSize: 18, color: "#fa8c16", cursor: "pointer" }}
                        onClick={() => {
                            setDataInit(record);
                            setOpenModal(true);
                        }}
                    />

                    <DeleteOutlined
                        style={{ fontSize: 18, color: "red", cursor: "pointer" }}
                        onClick={() => handleDelete(record.id!)}
                    />

                </Space>
            ),
        },
    ];

    return (

        <PageContainer
            title={`Quy trình phòng ban ${departmentName ? "- " + departmentName : ""}`}

            filter={

                <div className="flex flex-col gap-3">

                    <SearchFilter
                        searchPlaceholder="Tìm theo tên quy trình..."
                        addLabel="Thêm quy trình"
                        showFilterButton={false}
                        onSearch={(val) => setSearchValue(val)}
                        onReset={() => refetch()}
                        onAddClick={() => {
                            setDataInit({
                                departmentId: Number(departmentId),
                            } as IDepartmentProcedure);
                            setOpenModal(true);
                        }}
                    />

                    <div className="flex flex-wrap gap-3 items-center">

                        <AdvancedFilterSelect
                            fields={[
                                {
                                    key: "status",
                                    label: "Trạng thái",
                                    options: [
                                        { label: "Cần tạo", value: "NEED_CREATE", color: "orange" },
                                        { label: "Đang thực hiện", value: "IN_PROGRESS", color: "blue" },
                                        { label: "Cần cập nhật", value: "NEED_UPDATE", color: "purple" },
                                        { label: "Kết thúc", value: "TERMINATED", color: "red" },
                                    ],
                                },
                            ]}
                            onChange={(filters) => {
                                setStatusFilter(filters.status || null);
                            }}
                        />

                    </div>

                </div>

            }
        >

            <DataTable<IDepartmentProcedure>

                actionRef={tableRef}
                rowKey="id"
                loading={isFetching}
                columns={columns}
                dataSource={procedures}

                request={async (params) => {

                    const q = buildQuery(params);
                    setQuery(q);

                    return {
                        data: procedures,
                        success: true,
                        total: meta.total,
                    };
                }}

                pagination={{
                    current: meta.page,
                    pageSize: meta.pageSize,
                    total: meta.total,
                    showQuickJumper: true,

                    showTotal: (total, range) => (
                        <div style={{ fontSize: 13 }}>
                            <span style={{ fontWeight: 500 }}>
                                {range[0]}–{range[1]}
                            </span>{" "}
                            trên{" "}
                            <span style={{ fontWeight: 600, color: "#1677ff" }}>
                                {total.toLocaleString()}
                            </span>{" "}
                            quy trình
                        </div>
                    ),
                }}

            />

            <ModalProcedure
                open={openModal}
                onClose={() => setOpenModal(false)}
                dataInit={dataInit}
                refetch={refetch}
            />

            <ViewProcedure
                open={openView}
                onClose={() => setOpenView(false)}
                dataInit={dataInit}
            />

        </PageContainer>

    );

};

export default DepartmentProcedurePage;
