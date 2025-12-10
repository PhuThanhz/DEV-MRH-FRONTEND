import { useEffect, useRef, useState } from "react";
import { Button, Popconfirm, Space, Tag, message, notification } from "antd";
import { DeleteOutlined, EditOutlined, EyeOutlined, PlusOutlined } from "@ant-design/icons";
import type { ActionType, ProColumns } from "@ant-design/pro-components";
import dayjs from "dayjs";
import { useLocation, useNavigate } from "react-router-dom";

import DataTable from "@/components/admin/data-table";
import { ALL_PERMISSIONS } from "@/config/permissions";
import Access from "@/components/share/access";
import type { ISourceGroup } from "@/types/backend";
import { callFetchGroupsByMainId, callDeleteSourceGroup } from "@/config/api";
import ModalSourceGroup from "./modal.source-group";

const SourceGroupPage = () => {
    const [openModal, setOpenModal] = useState(false);
    const [singleGroup, setSingleGroup] = useState<ISourceGroup | null>(null);
    const [data, setData] = useState<ISourceGroup[]>([]);
    const [loading, setLoading] = useState(false);

    const tableRef = useRef<ActionType>(null!);
    const navigate = useNavigate();
    const location = useLocation();

    // ============================================================
    // Lấy mainId từ query (VD: /admin/source-group?mainId=5)
    // ============================================================
    const params = new URLSearchParams(location.search);
    const mainId = Number(params.get("mainId"));

    // ============================================================
    // Fetch danh sách nhóm con
    // ============================================================
    const fetchGroupsByMain = async () => {
        if (!mainId) {
            notification.warning({
                message: "Thiếu thông tin nhóm chính",
                description: "Không tìm thấy mainId trong URL.",
            });
            return;
        }

        try {
            setLoading(true);
            const res = await callFetchGroupsByMainId(mainId);
            if (res?.data && Array.isArray(res.data)) {
                setData(res.data);
            } else {
                notification.error({
                    message: "Không thể tải danh sách nhóm con",
                    description: res?.message || "Dữ liệu không hợp lệ từ server.",
                });
            }
        } catch (err: any) {
            notification.error({
                message: "Lỗi khi tải danh sách nhóm con",
                description: err.message || "Đã xảy ra lỗi hệ thống.",
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchGroupsByMain();
    }, [mainId]);

    // ============================================================
    // Xóa nhóm con
    // ============================================================
    const handleDeleteGroup = async (id?: number) => {
        if (!id) return;
        try {
            const res = await callDeleteSourceGroup(id);
            if (res && (res.statusCode === 200 || res.statusCode === 204)) {
                message.success("Xóa nhóm con thành công");
                await fetchGroupsByMain();
            } else {
                notification.error({
                    message: "Không thể xóa nhóm con này",
                    description: res?.message || "Lỗi không xác định.",
                });
            }
        } catch (err) {
            notification.error({
                message: "Lỗi khi xóa nhóm con",
                description: (err as any)?.message || "Đã xảy ra lỗi hệ thống.",
            });
        }
    };

    // ============================================================
    // Cấu hình cột bảng
    // ============================================================
    const columns: ProColumns<ISourceGroup>[] = [
        {
            title: "STT",
            key: "index",
            width: 60,
            align: "center",
            render: (_, __, index) => <>{index + 1}</>,
            hideInSearch: true,
        },
        {
            title: "Tên Nhóm Con",
            dataIndex: "name",
            render: (_, record) => <Tag color="blue">{record.name}</Tag>,
        },
        {
            title: "Nhóm Chính",
            dataIndex: "mainGroupName",
            align: "center",
            render: (_, record) => (
                <Tag color="geekblue">{record.mainGroupName || "Không xác định"}</Tag>
            ),
            hideInSearch: true,
        },
        {
            title: "Tổng link",
            dataIndex: "totalLinks",
            align: "center",
            render: (_, record) => (
                <Tag color={record.totalLinks && record.totalLinks > 0 ? "purple" : "default"}>
                    {record.totalLinks ?? 0}
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
                    {/* Xem danh sách link trong nhóm */}
                    <Access permission={ALL_PERMISSIONS.SOURCE_LINKS.GET_BY_GROUP} hideChildren>
                        <EyeOutlined
                            style={{ fontSize: 20, color: "#1677ff", cursor: "pointer" }}
                            title="Xem danh sách link"
                            onClick={() => navigate(`/admin/source-group/${entity.id}`)}
                        />
                    </Access>

                    {/* Cập nhật tên nhóm con */}
                    <Access permission={ALL_PERMISSIONS.SOURCE_GROUPS.UPDATE} hideChildren>
                        <EditOutlined
                            style={{ fontSize: 20, color: "#fa8c16", cursor: "pointer" }}
                            title="Đổi tên nhóm con"
                            onClick={() => {
                                setSingleGroup(entity);
                                setOpenModal(true);
                            }}
                        />
                    </Access>

                    {/* Xóa nhóm con */}
                    <Access permission={ALL_PERMISSIONS.SOURCE_GROUPS.DELETE} hideChildren>
                        <Popconfirm
                            placement="leftTop"
                            title="Xác nhận xóa nhóm con?"
                            description="Thao tác này sẽ xóa toàn bộ link bên trong nhóm!"
                            onConfirm={() => handleDeleteGroup(entity.id)}
                            okText="Xác nhận"
                            cancelText="Hủy"
                        >
                            <DeleteOutlined
                                style={{ fontSize: 20, color: "#ff4d4f", cursor: "pointer" }}
                                title="Xóa nhóm con"
                            />
                        </Popconfirm>
                    </Access>
                </Space>
            ),
        },
    ];

    // ============================================================
    // Render
    // ============================================================
    return (
        <div>
            <Access permission={ALL_PERMISSIONS.SOURCE_GROUP_MAINS.GET_GROUPS} hideChildren>
                <DataTable<ISourceGroup>
                    actionRef={tableRef}
                    headerTitle={`Danh sách Nhóm Con trong Nhóm Chính (ID: ${mainId || "-"})`}
                    rowKey="id"
                    loading={loading}
                    columns={columns}
                    dataSource={data}
                    pagination={false}
                    scroll={{ x: true }}
                    toolBarRender={() => [
                        <Access key="create" permission={ALL_PERMISSIONS.SOURCE_GROUP_MAINS.CREATE_GROUP_IN_MAIN}>
                            <Button
                                icon={<PlusOutlined />}
                                type="primary"
                                onClick={() => {
                                    setSingleGroup(null);
                                    setOpenModal(true);
                                }}
                            >
                                Tạo Nhóm Con
                            </Button>
                        </Access>,
                    ]}
                />
            </Access>

            {/* Modal thêm / sửa nhóm con */}
            <ModalSourceGroup
                openModal={openModal}
                setOpenModal={setOpenModal}
                reloadTable={() => fetchGroupsByMain()}
                singleGroup={singleGroup}
                setSingleGroup={setSingleGroup}
                mainId={mainId}
            />
        </div>
    );
};

export default SourceGroupPage;
