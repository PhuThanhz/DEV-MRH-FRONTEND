import { Drawer, Table, Tag, Space, Popconfirm, Button } from "antd";
import { useState, useEffect } from "react"; {/* ← thêm useEffect */ }
import type { Dispatch, SetStateAction } from "react";
import { EyeOutlined, EditOutlined, DeleteOutlined, SafetyOutlined, PlusOutlined } from "@ant-design/icons";

import type {
    IPermissionCategory,
    IPermissionContent,
    IPermissionContentDetail,
    IPermissionContentForm,
} from "@/types/backend";

import {
    usePermissionContentQuery,
    useDeletePermissionContentMutation,
} from "@/hooks/usePermissionContent";

import ModalPermissionContent from "./modal.permission-content";
import ViewPermissionContent from "./view.permission-content";
import PermissionMatrixDrawer from "./permission-matrix.drawer";

import Access from "@/components/share/access";
import { ALL_PERMISSIONS } from "@/config/permissions";

interface IProps {
    open: boolean;
    setOpen: Dispatch<SetStateAction<boolean>>;
    category: IPermissionCategory | null;
}

const DrawerPermissionContent = ({ open, setOpen, category }: IProps) => {
    /* ===================== STATE ===================== */
    const [openModal, setOpenModal] = useState(false);
    const [openView, setOpenView] = useState(false);
    const [openMatrix, setOpenMatrix] = useState(false);

    const [dataForm, setDataForm] = useState<IPermissionContentForm | null>(null);
    const [dataView, setDataView] = useState<IPermissionContentDetail | null>(null);
    const [selectedContentId, setSelectedContentId] = useState<number | null>(null);

    // ── Detect mobile ──────────────────────────────────────────────────────────
    const [isMobile, setIsMobile] = useState(() => window.innerWidth < 640);
    useEffect(() => {
        const handler = () => setIsMobile(window.innerWidth < 640);
        window.addEventListener("resize", handler);
        return () => window.removeEventListener("resize", handler);
    }, []);

    /* ===================== QUERY ===================== */
    const query =
        category?.id != null
            ? `page=1&size=100&categoryId=${category.id}`
            : "";

    const { data, isFetching } = usePermissionContentQuery(query);
    const deleteMutation = useDeletePermissionContentMutation();

    const rows: IPermissionContent[] = data?.result ?? [];

    /* ===================== HANDLERS ===================== */
    const handleAdd = () => {
        if (!category?.id) return;
        setDataForm({ name: "", categoryId: category.id });
        setOpenModal(true);
    };

    /* ===================== COLUMNS ===================== */
    const columns = [
        {
            title: "STT",
            key: "index",
            width: 55,
            align: "center" as const,
            render: (_: any, __: any, index: number) => index + 1,
        },
        {
            title: "Tên nội dung",
            dataIndex: "name",
            render: (text: string) => (
                <span style={{ fontWeight: 500 }}>{text}</span>
            ),
        },
        {
            title: "Trạng thái",
            dataIndex: "active",
            width: 120,
            align: "center" as const,
            render: (v: boolean) =>
                v ? (
                    <Tag color="green">Hoạt động</Tag>
                ) : (
                    <Tag color="red">Ngưng</Tag>
                ),
        },
        {
            title: "Hành động",
            width: 160,
            align: "center" as const,
            render: (_: any, record: IPermissionContent) => (
                <Space size={4}>
                    <Access permission={ALL_PERMISSIONS.PERMISSION_CONTENT.GET_BY_ID} hideChildren>
                        <Button
                            type="text"
                            size="small"
                            icon={<EyeOutlined style={{ color: "#1677ff", fontSize: 16 }} />}
                            onClick={() => {
                                if (!record.id) return;
                                setDataView(record as IPermissionContentDetail);
                                setOpenView(true);
                            }}
                        />
                    </Access>

                    <Access permission={ALL_PERMISSIONS.PERMISSION_CONTENT.UPDATE} hideChildren>
                        <Button
                            type="text"
                            size="small"
                            icon={<EditOutlined style={{ color: "#fa8c16", fontSize: 16 }} />}
                            onClick={() => {
                                if (!record.id || !category?.id) return;
                                setDataForm({
                                    id: record.id,
                                    name: record.name,
                                    categoryId: category.id,
                                });
                                setOpenModal(true);
                            }}
                        />
                    </Access>

                    <Button
                        type="text"
                        size="small"
                        icon={<SafetyOutlined style={{ color: "#52c41a", fontSize: 16 }} />}
                        onClick={() => {
                            if (!record.id) return;
                            setSelectedContentId(record.id);
                            setOpenMatrix(true);
                        }}
                    />

                    <Access permission={ALL_PERMISSIONS.PERMISSION_CONTENT.DELETE} hideChildren>
                        <Popconfirm
                            title="Xoá nội dung này?"
                            description="Bạn có chắc chắn muốn xoá nội dung này không?"
                            okText="Xác nhận"
                            cancelText="Hủy"
                            okButtonProps={{ danger: true }}
                            onConfirm={() => record.id && deleteMutation.mutate(record.id)}
                        >
                            <Button
                                type="text"
                                size="small"
                                icon={<DeleteOutlined style={{ color: "#ff4d4f", fontSize: 16 }} />}
                            />
                        </Popconfirm>
                    </Access>
                </Space>
            ),
        },
    ];

    return (
        <>
            <Drawer
                title={
                    <span style={{ fontSize: 16, fontWeight: 600 }}>
                        Nội dung thuộc danh mục:{" "}
                        <Tag color="magenta" style={{ marginLeft: 8 }}>
                            {category?.name ?? ""}
                        </Tag>
                    </span>
                }
                width={isMobile ? "100vw" : Math.min(900, window.innerWidth - 48)}
                open={open}
                onClose={() => setOpen(false)}
                destroyOnClose
                styles={{ body: { padding: "16px 24px" } }}
            >
                <div style={{ marginBottom: 16, textAlign: "right" }}>
                    <Access permission={ALL_PERMISSIONS.PERMISSION_CONTENT.CREATE} hideChildren>
                        <Button
                            type="primary"
                            icon={<PlusOutlined />}
                            onClick={handleAdd}
                            disabled={!category?.id}
                            style={{ backgroundColor: "#eb2f96", borderColor: "#eb2f96" }}
                        >
                            Thêm nội dung
                        </Button>
                    </Access>
                </div>

                <Table<IPermissionContent>
                    rowKey="id"
                    loading={isFetching}
                    dataSource={rows}
                    columns={columns}
                    pagination={false}
                    bordered
                    size="middle"
                    scroll={{ x: "max-content" }}
                />
            </Drawer>

            <ModalPermissionContent
                open={openModal}
                setOpen={setOpenModal}
                dataInit={dataForm}
                setDataInit={setDataForm}
            />

            <ViewPermissionContent
                open={openView}
                setOpen={setOpenView}
                dataInit={dataView}
            />

            <PermissionMatrixDrawer
                open={openMatrix}
                setOpen={setOpenMatrix}
                contentId={selectedContentId}
            />
        </>
    );
};

export default DrawerPermissionContent;