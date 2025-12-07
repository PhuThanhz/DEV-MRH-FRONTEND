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
import type { ISourceGroup, IModelPaginate } from "@/types/backend";
import { callFetchSourceGroups, callDeleteSourceGroup } from "@/config/api";
import ModalSourceGroup from "./modal.source-group";

const SourceGroupPage = () => {
    const [openModal, setOpenModal] = useState<boolean>(false);
    const [singleGroup, setSingleGroup] = useState<ISourceGroup | null>(null);
    const [data, setData] = useState<ISourceGroup[]>([]);
    const [meta, setMeta] = useState({
        page: 1,
        pageSize: 10,
        total: 0,
    });
    const [loading, setLoading] = useState<boolean>(false);
    const [currentQuery, setCurrentQuery] = useState<string>("page=1&size=10&sort=updatedAt,desc");

    const tableRef = useRef<ActionType>(null!);
    const navigate = useNavigate();

    // ======================
    // Fetch Source Groups
    // ======================
    const fetchGroups = async (query: string) => {
        try {
            setLoading(true);
            const res = await callFetchSourceGroups(query);
            if (res?.data) {
                const result: IModelPaginate<ISourceGroup> = res.data;
                setData(result.result || []);
                setMeta({
                    page: result.meta.page,
                    pageSize: result.meta.pageSize,
                    total: result.meta.total,
                });
                setCurrentQuery(query); // ✅ lưu query hiện tại để reload khi cần
            }
        } catch (err: any) {
            notification.error({
                message: "Không thể tải danh sách nhóm",
                description: err.message || "Đã xảy ra lỗi khi tải dữ liệu",
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchGroups(currentQuery);
    }, []);

    // ======================
    // Delete Group
    // ======================
    const handleDeleteGroup = async (id: number | undefined) => {
        if (!id) return;
        try {
            const res = await callDeleteSourceGroup(id);
            if (res && (res.statusCode === 200 || res.statusCode === 200)) {
                message.success("Xóa nhóm thành công");
                await fetchGroups(currentQuery); // ✅ gọi lại API ngay sau khi xóa
            } else {
                notification.error({
                    message: "Không thể xóa nhóm này",
                    description: res?.message || "Lỗi không xác định",
                });
            }
        } catch (err) {
            notification.error({
                message: "Lỗi khi xóa nhóm",
                description: (err as any)?.message || "Đã xảy ra lỗi hệ thống",
            });
        }
    };

    // ======================
    // Columns Config
    // ======================
    const columns: ProColumns<ISourceGroup>[] = [
        {
            title: "STT",
            key: "index",
            width: 60,
            align: "center",
            render: (_, __, index) => (
                <>{index + 1 + (meta.page - 1) * meta.pageSize}</>
            ),
            hideInSearch: true,
        },
        {
            title: "Tên Group",
            dataIndex: "name",
            sorter: true,
            render: (_, record) => <Tag color="blue">{record.name}</Tag>,
        },
        {
            title: "Tổng link",
            dataIndex: "totalLinks",
            align: "center",
            render: (_, record) => <Tag color="purple">{record.totalLinks}</Tag>,
        },
        {
            title: "Ngày tạo",
            dataIndex: "createdAt",
            sorter: true,
            render: (_, record) =>
                record.createdAt ? dayjs(record.createdAt).format("DD-MM-YYYY HH:mm:ss") : "-",
            hideInSearch: true,
        },
        {
            title: "Ngày cập nhật",
            dataIndex: "updatedAt",
            sorter: true,
            render: (_, record) =>
                record.updatedAt ? dayjs(record.updatedAt).format("DD-MM-YYYY HH:mm:ss") : "-",
            hideInSearch: true,
        },
        {
            title: "Hành động",
            width: 120,
            align: "center",
            hideInSearch: true,
            render: (_, entity) => (
                <Space>
                    <Access permission={ALL_PERMISSIONS.SOURCE_GROUPS.GET_PAGINATE} hideChildren>
                        <EyeOutlined
                            style={{ fontSize: 20, color: "#1677ff", cursor: "pointer" }}
                            onClick={() => navigate(`/admin/source-group/${entity.id}`)}
                        />
                    </Access>
                    <Access permission={ALL_PERMISSIONS.SOURCE_GROUPS.UPDATE} hideChildren>
                        <EditOutlined
                            style={{ fontSize: 20, color: "#fa8c16", cursor: "pointer" }}
                            onClick={() => {
                                setSingleGroup(entity);
                                setOpenModal(true);
                            }}
                        />
                    </Access>
                    <Access permission={ALL_PERMISSIONS.SOURCE_GROUPS.DELETE} hideChildren>
                        <Popconfirm
                            placement="leftTop"
                            title="Xác nhận xóa nhóm?"
                            description="Bạn có chắc chắn muốn xóa nhóm này?"
                            onConfirm={() => handleDeleteGroup(entity.id)}
                            okText="Xác nhận"
                            cancelText="Hủy"
                        >
                            <DeleteOutlined
                                style={{ fontSize: 20, color: "#ff4d4f", cursor: "pointer" }}
                            />
                        </Popconfirm>
                    </Access>
                </Space>
            ),
        },
    ];

    // ======================
    // Build Query
    // ======================
    const buildQuery = (params: any, sort: any, filter: any) => {
        const q: any = {
            page: params.current,
            size: params.pageSize,
        };

        let sortBy = "";
        if (sort?.name)
            sortBy = sort.name === "ascend" ? "sort=name,asc" : "sort=name,desc";
        else if (sort?.createdAt)
            sortBy = sort.createdAt === "ascend" ? "sort=createdAt,asc" : "sort=createdAt,desc";
        else if (sort?.updatedAt)
            sortBy = sort.updatedAt === "ascend" ? "sort=updatedAt,asc" : "sort=updatedAt,desc";
        else sortBy = "sort=updatedAt,desc";

        return `${queryString.stringify(q)}&${sortBy}`;
    };

    // ======================
    // Render
    // ======================
    return (
        <div>
            <Access permission={ALL_PERMISSIONS.SOURCE_GROUPS.GET_PAGINATE}>
                <DataTable<ISourceGroup>
                    actionRef={tableRef}
                    headerTitle="Danh sách Source Groups"
                    rowKey="id"
                    loading={loading}
                    columns={columns}
                    dataSource={data}
                    request={async (params, sort, filter): Promise<any> => {
                        const query = buildQuery(params, sort, filter);
                        await fetchGroups(query);
                    }}
                    scroll={{ x: true }}
                    pagination={{
                        current: meta.page,
                        pageSize: meta.pageSize,
                        showSizeChanger: true,
                        total: meta.total,
                        showTotal: (total, range) => (
                            <div>
                                {range[0]}-{range[1]} trên {total} rows
                            </div>
                        ),
                    }}
                    rowSelection={false}
                    toolBarRender={(_action, _rows): any => [
                        <Access key="create" permission={ALL_PERMISSIONS.SOURCE_GROUPS.CREATE}>
                            <Button
                                icon={<PlusOutlined />}
                                type="primary"
                                onClick={() => {
                                    setSingleGroup(null);
                                    setOpenModal(true);
                                }}
                            >
                                Tạo Group
                            </Button>
                        </Access>,
                    ]}
                />
            </Access>

            <ModalSourceGroup
                openModal={openModal}
                setOpenModal={setOpenModal}
                reloadTable={() => fetchGroups(currentQuery)}
                singleGroup={singleGroup}
                setSingleGroup={setSingleGroup}
            />
        </div>
    );
};

export default SourceGroupPage;
