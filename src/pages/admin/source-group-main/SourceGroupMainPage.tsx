import { useEffect, useRef, useState } from "react";
import { Button, Popconfirm, Space, Tag, message, notification } from "antd";
import { DeleteOutlined, EditOutlined, EyeOutlined, PlusOutlined } from "@ant-design/icons";
import type { ActionType, ProColumns } from "@ant-design/pro-components";
import dayjs from "dayjs";
import queryString from "query-string";
import { useNavigate } from "react-router-dom";

import DataTable from "@/components/admin/data-table";
import { ALL_PERMISSIONS } from "@/config/permissions";
import Access from "@/components/share/access";
import type { ISourceGroupMain, IModelPaginate } from "@/types/backend";
import { callFetchSourceGroupMains, callDeleteSourceGroupMain } from "@/config/api";
import ModalSourceGroupMain from "./modal.source-group-main";

const SourceGroupMainPage = () => {
    const [openModal, setOpenModal] = useState<boolean>(false);
    const [singleMain, setSingleMain] = useState<ISourceGroupMain | null>(null);
    const [data, setData] = useState<ISourceGroupMain[]>([]);
    const [meta, setMeta] = useState({
        page: 1,
        pageSize: 10,
        total: 0,
    });
    const [loading, setLoading] = useState<boolean>(false);
    const [currentQuery, setCurrentQuery] = useState<string>("page=1&size=10&sort=updatedAt,desc");

    const tableRef = useRef<ActionType>(null!);
    const navigate = useNavigate();

    // ============================================================
    // Fetch danh sách SourceGroupMain
    // ============================================================
    const fetchMainGroups = async (query: string) => {
        try {
            setLoading(true);
            const res = await callFetchSourceGroupMains(query);
            if (res?.data) {
                const result: IModelPaginate<ISourceGroupMain> = res.data;
                setData(result.result || []);
                setMeta({
                    page: result.meta.page,
                    pageSize: result.meta.pageSize,
                    total: result.meta.total,
                });
                setCurrentQuery(query);
            }
        } catch (err: any) {
            notification.error({
                message: "Không thể tải danh sách nhóm chính",
                description: err.message || "Đã xảy ra lỗi khi tải dữ liệu.",
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMainGroups(currentQuery);
    }, []);

    // ============================================================
    // Xóa nhóm chính
    // ============================================================
    const handleDeleteMain = async (id: number | undefined) => {
        if (!id) return;
        try {
            const res = await callDeleteSourceGroupMain(id);
            if (res && (res.statusCode === 200 || res.statusCode === 204)) {
                message.success("Xóa nhóm chính thành công");
                await fetchMainGroups(currentQuery);
            } else {
                notification.error({
                    message: "Không thể xóa nhóm chính này",
                    description: res?.message || "Lỗi không xác định.",
                });
            }
        } catch (err: any) {
            notification.error({
                message: "Lỗi khi xóa nhóm chính",
                description: err.message || "Đã xảy ra lỗi hệ thống.",
            });
        }
    };

    // ============================================================
    // Cấu hình cột bảng
    // ============================================================
    const columns: ProColumns<ISourceGroupMain>[] = [
        {
            title: "STT",
            key: "index",
            width: 60,
            align: "center",
            render: (_, __, index) => <>{index + 1 + (meta.page - 1) * meta.pageSize}</>,
            hideInSearch: true,
        },
        {
            title: "Tên Nhóm Chính",
            dataIndex: "name",
            sorter: true,
            render: (_, record) => <Tag color="blue">{record.name}</Tag>,
        },
        {
            title: "Tổng số nhóm con",
            dataIndex: "totalGroups",
            align: "center",
            width: 150,
            render: (_, record) => (
                <Tag color={record.totalGroups && record.totalGroups > 0 ? "purple" : "default"}>
                    {record.totalGroups ?? 0}
                </Tag>
            ),
            hideInSearch: true,
        },
        {
            title: "Ngày tạo",
            dataIndex: "createdAt",
            render: (_, record) =>
                record.createdAt ? dayjs(record.createdAt).format("DD-MM-YYYY HH:mm:ss") : "-",
            hideInSearch: true,
        },
        {
            title: "Ngày cập nhật",
            dataIndex: "updatedAt",
            render: (_, record) =>
                record.updatedAt ? dayjs(record.updatedAt).format("DD-MM-YYYY HH:mm:ss") : "-",
            hideInSearch: true,
        },
        {
            title: "Hành động",
            width: 150,
            align: "center",
            hideInSearch: true,
            render: (_, entity) => (
                <Space>
                    {/* Xem danh sách nhóm con */}
                    <Access permission={ALL_PERMISSIONS.SOURCE_GROUP_MAINS.GET_GROUPS} hideChildren>
                        <EyeOutlined
                            style={{ fontSize: 20, color: "#1677ff", cursor: "pointer" }}
                            title="Xem nhóm con"
                            onClick={() => navigate(`/admin/source-group?mainId=${entity.id}`)}
                        />
                    </Access>

                    {/* Chỉnh sửa nhóm chính */}
                    <Access permission={ALL_PERMISSIONS.SOURCE_GROUP_MAINS.UPDATE} hideChildren>
                        <EditOutlined
                            style={{ fontSize: 20, color: "#fa8c16", cursor: "pointer" }}
                            title="Chỉnh sửa"
                            onClick={() => {
                                setSingleMain(entity);
                                setOpenModal(true);
                            }}
                        />
                    </Access>

                    {/* Xóa nhóm chính */}
                    <Access permission={ALL_PERMISSIONS.SOURCE_GROUP_MAINS.DELETE} hideChildren>
                        <Popconfirm
                            placement="leftTop"
                            title="Xác nhận xóa nhóm chính?"
                            description="Thao tác này sẽ xóa toàn bộ nhóm con và link bên trong!"
                            onConfirm={() => handleDeleteMain(entity.id)}
                            okText="Xác nhận"
                            cancelText="Hủy"
                        >
                            <DeleteOutlined
                                style={{ fontSize: 20, color: "#ff4d4f", cursor: "pointer" }}
                                title="Xóa nhóm chính"
                            />
                        </Popconfirm>
                    </Access>
                </Space>
            ),
        },
    ];

    // ============================================================
    // Build Query
    // ============================================================
    const buildQuery = (params: any, sort: any) => {
        const q: any = {
            page: params.current,
            size: params.pageSize,
        };

        let sortBy = "";
        if (sort?.name)
            sortBy = sort.name === "ascend" ? "sort=name,asc" : "sort=name,desc";
        else if (sort?.createdAt)
            sortBy = sort.createdAt === "ascend" ? "sort=createdAt,asc" : "sort=createdAt,desc";
        else sortBy = "sort=updatedAt,desc";

        return `${queryString.stringify(q)}&${sortBy}`;
    };

    // ============================================================
    // Render
    // ============================================================
    return (
        <div>
            <Access permission={ALL_PERMISSIONS.SOURCE_GROUP_MAINS.GET_PAGINATE} hideChildren>
                <DataTable<ISourceGroupMain>
                    actionRef={tableRef}
                    headerTitle="Danh sách Nhóm Chính (SourceGroupMain)"
                    rowKey="id"
                    loading={loading}
                    columns={columns}
                    dataSource={data}
                    request={async (params, sort): Promise<any> => {
                        const query = buildQuery(params, sort);
                        await fetchMainGroups(query);
                    }}
                    scroll={{ x: true }}
                    pagination={{
                        current: meta.page,
                        pageSize: meta.pageSize,
                        showSizeChanger: true,
                        total: meta.total,
                        showTotal: (total, range) => (
                            <div>
                                {range[0]}-{range[1]} trên {total} dòng
                            </div>
                        ),
                    }}
                    rowSelection={false}
                    toolBarRender={() => [
                        <Access key="create" permission={ALL_PERMISSIONS.SOURCE_GROUP_MAINS.CREATE} hideChildren>
                            <Button
                                icon={<PlusOutlined />}
                                type="primary"
                                onClick={() => {
                                    setSingleMain(null);
                                    setOpenModal(true);
                                }}
                            >
                                Tạo Nhóm Chính
                            </Button>
                        </Access>,
                    ]}
                />
            </Access>

            {/* Modal thêm / sửa nhóm chính */}
            <ModalSourceGroupMain
                openModal={openModal}
                setOpenModal={setOpenModal}
                reloadTable={() => fetchMainGroups(currentQuery)}
                singleMain={singleMain}
                setSingleMain={setSingleMain}
            />
        </div>
    );
};

export default SourceGroupMainPage;
