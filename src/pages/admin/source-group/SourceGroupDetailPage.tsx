import { useEffect, useState } from "react";
import {
    Table,
    Tag,
    Space,
    Button,
    Popconfirm,
    message,
    notification,
    Typography,
    Card,
    Spin,
} from "antd";
import {
    DeleteOutlined,
    ArrowLeftOutlined,
    ReloadOutlined,
    PlayCircleOutlined,
    PlusOutlined,
    EditOutlined,
    EyeOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { useNavigate, useParams } from "react-router-dom";
import type { ColumnsType } from "antd/es/table";
import { ModalForm, ProFormTextArea } from "@ant-design/pro-components";

import type { ISourceLink, ISourceGroup } from "@/types/backend";
import {
    callFetchLinksByGroup,
    callDeleteLinkFromGroup,
    callProcessGroupLinks,
    callAddLinkToGroup,
} from "@/config/api";
import ModalUpdateLink from "./modal.update-link";
import ModalViewLink from "./modal.view-link";

const { Title } = Typography;

const SourceGroupDetailPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [links, setLinks] = useState<ISourceLink[]>([]);
    const [groupInfo, setGroupInfo] = useState<ISourceGroup | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [openAddLink, setOpenAddLink] = useState<boolean>(false);
    const [openEditModal, setOpenEditModal] = useState<boolean>(false);
    const [openViewModal, setOpenViewModal] = useState<boolean>(false);
    const [currentLink, setCurrentLink] = useState<ISourceLink | null>(null);
    const [processing, setProcessing] = useState<boolean>(false);

    // ============================================================
    // Lấy danh sách link theo group ID
    // ============================================================
    const fetchLinks = async () => {
        if (!id) return;
        try {
            setLoading(true);
            const query = "page=1&size=10&sort=createdAt,desc";
            const res = await callFetchLinksByGroup(+id, query);
            if (res?.data) {
                setLinks(res.data.result || []);
                setGroupInfo({ id: +id, name: `Group #${id}` });
            }
        } catch (err: any) {
            notification.error({
                message: "Không thể tải danh sách link",
                description: err.message || "Đã xảy ra lỗi khi tải dữ liệu",
            });
        } finally {
            setLoading(false);
        }
    };

    // ============================================================
    // Xóa link khỏi group
    // ============================================================
    const handleDeleteLink = async (linkId: number) => {
        if (!id) return;
        try {
            const res = await callDeleteLinkFromGroup(+id, linkId);
            if (res.statusCode === 200 || res.statusCode === 204) {
                message.success("Đã xóa link khỏi nhóm thành công");
                fetchLinks();
            } else {
                notification.error({
                    message: "Không thể xóa link này",
                });
            }
        } catch {
            notification.error({
                message: "Xóa link thất bại",
                description: "Đã xảy ra lỗi trong quá trình xử lý",
            });
        }
    };

    // ============================================================
    // Gửi yêu cầu xử lý tải toàn bộ link trong group
    // ============================================================
    const handleProcessGroup = async () => {
        if (!id) return;
        try {
            setProcessing(true);
            const res = await callProcessGroupLinks(+id);
            if (res.statusCode === 200) {
                message.success("Đã gửi yêu cầu xử lý toàn bộ link trong nhóm!");
            } else {
                notification.error({
                    message: "Không thể xử lý nhóm này",
                    description: res.message || "",
                });
            }
        } catch (err: any) {
            notification.error({
                message: "Lỗi xử lý group",
                description: err.message || "Đã xảy ra lỗi không xác định",
            });
        } finally {
            setProcessing(false);
        }
    };

    // ============================================================
    // Thêm link mới vào group (hỗ trợ dán nhiều link cùng lúc)
    // ============================================================
    const handleAddLink = async (values: any) => {
        if (!id) return;
        try {
            const res = await callAddLinkToGroup(+id, { url: values.url });
            if (res.data) {
                message.success("Đã thêm link vào nhóm thành công!");
                fetchLinks();
                setOpenAddLink(false);
            }
        } catch (err: any) {
            notification.error({
                message: "Không thể thêm link",
                description: err.message || "Đã xảy ra lỗi khi thêm link",
            });
        }
    };

    useEffect(() => {
        fetchLinks();
    }, [id]);

    // ============================================================
    // Cấu hình cột bảng
    // ============================================================
    const columns: ColumnsType<ISourceLink> = [
        {
            title: "STT",
            key: "index",
            width: 60,
            align: "center",
            render: (_, __, index) => index + 1,
        },
        {
            title: "URL",
            dataIndex: "url",
            ellipsis: true,
            render: (t) => (
                <a href={t} target="_blank" rel="noopener noreferrer">
                    {t}
                </a>
            ),
        },
        { title: "Người đăng", dataIndex: "name" },
        { title: "User ID", dataIndex: "userId", width: 140, ellipsis: true },
        {
            title: "Trạng thái",
            dataIndex: "status",
            align: "center",
            width: 120,
            render: (t) => {
                const color =
                    t === "SUCCESS" ? "green" : t === "FAILED" ? "red" : "default";
                return <Tag color={color}>{t || "UNKNOWN"}</Tag>;
            },
        },
        {
            title: "Mô tả (Caption)",
            dataIndex: "caption",
            ellipsis: true,
            render: (t) => t || "-",
        },
        {
            title: "File",
            dataIndex: "contentGenerated",
            ellipsis: true,
            render: (t) => t || "-",
        },
        {
            title: "Ngày tạo",
            dataIndex: "createdAt",
            width: 180,
            render: (t) => (t ? dayjs(t).format("DD-MM-YYYY HH:mm:ss") : "-"),
        },
        {
            title: "Hành động",
            align: "center",
            width: 140,
            fixed: "right",
            render: (_, record) => (
                <Space>
                    <EyeOutlined
                        style={{ color: "#1677ff", fontSize: 16, cursor: "pointer" }}
                        onClick={() => {
                            setCurrentLink(record);
                            setOpenViewModal(true);
                        }}
                    />
                    <EditOutlined
                        style={{ color: "#fa8c16", fontSize: 16, cursor: "pointer" }}
                        onClick={() => {
                            setCurrentLink(record);
                            setOpenEditModal(true);
                        }}
                    />
                    <Popconfirm
                        title="Xóa link này khỏi group?"
                        okText="Xác nhận"
                        cancelText="Hủy"
                        onConfirm={() => handleDeleteLink(record.id)}
                    >
                        <DeleteOutlined
                            style={{ color: "#ff4d4f", cursor: "pointer", fontSize: 16 }}
                        />
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    // ============================================================
    // Render
    // ============================================================
    return (
        <div style={{ padding: 24 }}>
            <Card bordered={false}>
                <Space style={{ marginBottom: 20, flexWrap: "wrap" }}>
                    <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>
                        Quay lại
                    </Button>
                    <Button icon={<ReloadOutlined />} onClick={() => fetchLinks()}>
                        Làm mới
                    </Button>
                    <Button
                        icon={<PlayCircleOutlined />}
                        type="primary"
                        loading={processing}
                        disabled={processing}
                        onClick={() => handleProcessGroup()}
                    >
                        {processing ? "Đang xử lý..." : "Xử lý toàn bộ link"}
                    </Button>
                    <Button
                        icon={<PlusOutlined />}
                        type="dashed"
                        onClick={() => setOpenAddLink(true)}
                        disabled={processing}
                    >
                        Thêm link
                    </Button>
                </Space>

                <Title level={4}>
                    Danh sách link của nhóm:{" "}
                    <span style={{ color: "#1677ff" }}>{groupInfo?.name}</span>
                </Title>

                <Spin spinning={loading}>
                    <Table
                        bordered
                        rowKey="id"
                        columns={columns}
                        dataSource={links}
                        pagination={{
                            pageSize: 10,
                            showSizeChanger: true,
                            showTotal: (total, range) => (
                                <div>
                                    {range[0]}–{range[1]} trên {total} link
                                </div>
                            ),
                        }}
                        scroll={{ x: 1300 }}
                    />
                </Spin>
            </Card>

            {/* Modal thêm link */}
            <ModalForm
                title="Thêm Link vào Group"
                open={openAddLink}
                onOpenChange={setOpenAddLink}
                modalProps={{
                    destroyOnClose: true,
                    maskClosable: false,
                }}
                onFinish={handleAddLink}
            >
                <ProFormTextArea
                    name="url"
                    label="Danh sách Link (URL)"
                    placeholder={`Dán các link vào đây, mỗi link một dòng...\nVí dụ:\nhttps://threads.net/abc\nhttps://threads.net/xyz`}
                    rules={[{ required: true, message: "Vui lòng nhập ít nhất 1 URL hợp lệ" }]}
                    fieldProps={{
                        autoSize: { minRows: 6, maxRows: 12 },
                    }}
                />
            </ModalForm>

            {/* Modal cập nhật caption */}
            <ModalUpdateLink
                open={openEditModal}
                setOpen={setOpenEditModal}
                link={currentLink}
                onSuccess={fetchLinks}
            />

            {/* Modal xem chi tiết */}
            <ModalViewLink
                open={openViewModal}
                setOpen={setOpenViewModal}
                link={currentLink}
            />
        </div>
    );
};

export default SourceGroupDetailPage;
