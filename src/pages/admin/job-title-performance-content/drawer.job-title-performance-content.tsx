// src/pages/admin/job-title-performance-content/drawer.job-title-performance-content.tsx

import { useState } from "react";
import {
    Drawer,
    Table,
    Button,
    Space,
    Badge,
    Tag,
    Popconfirm,
    Card,
    Empty,
    Spin,
    Typography,
} from "antd";
import { EyeOutlined, EditOutlined } from "@ant-design/icons";

import ModalJobTitlePerformanceContent from "./modal.job-title-performance-content";
import ViewJobTitlePerformanceContentModal from "./modal.view-job-title-performance-content";

import {
    useJobTitlePerformanceContentQuery,
    useCreateJobTitlePerformanceContentMutation,
    useUpdateJobTitlePerformanceContentMutation,
    useDisableJobTitlePerformanceContentMutation,
    useRestoreJobTitlePerformanceContentMutation,
} from "@/hooks/useJobTitlePerformanceContent";

import { useSalaryGradesByOwnerLevel } from "@/hooks/useSalaryGradesByOwnerLevel";

import type {
    IJobTitlePerformanceContent,
    IReqJobTitlePerformanceContent,
} from "@/types/backend";

import type { ColumnsType } from "antd/es/table";
import { notify } from "@/components/common/notification/notify";

const { Title, Text } = Typography;

interface Props {
    open: boolean;
    onClose: () => void;
    ownerLevel: "COMPANY" | "DEPARTMENT" | "SECTION";
    ownerJobTitleId: number;
    ownerJobTitleName: string;
    onSuccess?: () => void;
}

const DrawerJobTitlePerformanceContent = ({
    open,
    onClose,
    ownerLevel,
    ownerJobTitleId,
    ownerJobTitleName,
    onSuccess,
}: Props) => {
    const [openCreate, setOpenCreate] = useState(false);
    const [openUpdate, setOpenUpdate] = useState(false);
    const [openView, setOpenView] = useState(false);
    const [selected, setSelected] = useState<IJobTitlePerformanceContent | null>(null);
    const [selectedView, setSelectedView] = useState<IJobTitlePerformanceContent | null>(null);

    const { data = [], isLoading, isFetching, refetch } =
        useJobTitlePerformanceContentQuery(ownerLevel, ownerJobTitleId);

    const { data: salaryGrades = [] } = useSalaryGradesByOwnerLevel(
        ownerLevel,
        ownerJobTitleId
    );

    const { mutate: createItem, isPending: creating } =
        useCreateJobTitlePerformanceContentMutation();

    const { mutate: updateItem, isPending: updating } =
        useUpdateJobTitlePerformanceContentMutation();

    const { mutate: disableItem, isPending: disabling } =
        useDisableJobTitlePerformanceContentMutation();

    const { mutate: restoreItem, isPending: restoring } =
        useRestoreJobTitlePerformanceContentMutation();

    const handleCreate = (values: IReqJobTitlePerformanceContent) => {
        createItem(
            { ...values, ownerLevel, ownerJobTitleId },
            {
                onSuccess: () => {
                    notify.created("Đã tạo tiêu chí");
                    setOpenCreate(false);
                    refetch();
                    onSuccess?.();
                },
                onError: (err) => notify.error(err?.message),
            }
        );
    };

    const handleUpdate = (values: IReqJobTitlePerformanceContent) => {
        if (!selected) return;
        updateItem(
            { id: selected.id, payload: { ...values, ownerLevel, ownerJobTitleId } },
            {
                onSuccess: () => {
                    notify.updated("Đã cập nhật tiêu chí");
                    setOpenUpdate(false);
                    setSelected(null);
                    refetch();
                    onSuccess?.();
                },
                onError: (err) => notify.error(err?.message),
            }
        );
    };

    const handleDisable = (id: number) => {
        disableItem(
            { id },
            {
                onSuccess: () => {
                    notify.deleted("Đã vô hiệu tiêu chí");
                    refetch();
                },
                onError: (err) => notify.error(err?.message),
            }
        );
    };

    const handleRestore = (id: number) => {
        restoreItem(
            { id },
            {
                onSuccess: () => {
                    notify.success("Đã khôi phục tiêu chí");
                    refetch();
                },
                onError: (err) => notify.error(err?.message),
            }
        );
    };

    const columns: ColumnsType<IJobTitlePerformanceContent> = [
        {
            title: "STT",
            width: 60,
            align: "center",
            render: (_, __, index) => index + 1,
        },
        {
            title: "Bậc lương",
            dataIndex: "salaryGradeNumber",
            width: 140,
            render: (v) => <Tag color="blue">Bậc {v}</Tag>,
        },
        {
            title: "Trạng thái",
            dataIndex: "active",
            width: 140,
            align: "center",
            render: (active) =>
                active ? (
                    <Badge status="success" text="Hoạt động" />
                ) : (
                    <Badge status="error" text="Vô hiệu" />
                ),
        },
        {
            title: "Thao tác",
            width: 240,
            align: "center",
            render: (_, record) => (
                <Space>
                    <Button
                        type="text"
                        icon={<EyeOutlined />}
                        size="small"
                        title="Xem chi tiết"
                        onClick={() => {
                            setSelectedView(record);
                            setOpenView(true);
                        }}
                        style={{ color: "#1890ff" }}
                    />
                    <Button
                        type="text"
                        icon={<EditOutlined />}
                        size="small"
                        title="Sửa"
                        onClick={() => {
                            setSelected(record);
                            setOpenUpdate(true);
                        }}
                    />
                    {record.active ? (
                        <Popconfirm title="Vô hiệu?" onConfirm={() => handleDisable(record.id)}>
                            <Button size="small" danger loading={disabling}>
                                Vô hiệu
                            </Button>
                        </Popconfirm>
                    ) : (
                        <Popconfirm title="Khôi phục?" onConfirm={() => handleRestore(record.id)}>
                            <Button size="small" type="primary" loading={restoring}>
                                Khôi phục
                            </Button>
                        </Popconfirm>
                    )}
                </Space>
            ),
        },
    ];

    return (
        <>
            <Drawer
                open={open}
                onClose={onClose}
                width={1000}
                destroyOnClose
                title={
                    <>
                        <Title level={4}>Tiêu chí đánh giá hiệu suất</Title>
                        <Text type="secondary">Chức danh: {ownerJobTitleName}</Text>
                    </>
                }
            >
                <Card>
                    {isLoading || isFetching ? (
                        <div style={{ textAlign: "center", padding: 60 }}>
                            <Spin size="large" />
                        </div>
                    ) : (
                        <Table
                            rowKey="id"
                            dataSource={data}
                            columns={columns}
                            pagination={false}
                            locale={{ emptyText: <Empty description="Chưa có tiêu chí nào" /> }}
                            expandable={{
                                expandedRowRender: (record) => (
                                    <div
                                        style={{
                                            padding: "24px 40px",
                                            background: "#fafbfc",
                                            borderRadius: 12,
                                            margin: "16px 0",
                                        }}
                                    >
                                        <div
                                            style={{
                                                display: "grid",
                                                gridTemplateColumns: "1fr 1fr",
                                                gap: 24,
                                                maxWidth: "100%",
                                            }}
                                        >
                                            <div>
                                                <div
                                                    style={{
                                                        fontSize: 14,
                                                        fontWeight: 600,
                                                        color: "#1890ff",
                                                        marginBottom: 8,
                                                    }}
                                                >
                                                    Nội dung A
                                                </div>
                                                <div
                                                    style={{
                                                        whiteSpace: "pre-line",
                                                        wordBreak: "break-word",
                                                        lineHeight: 1.7,
                                                        padding: 16,
                                                        background: "#fff",
                                                        border: "1px solid #e8e8e8",
                                                        borderRadius: 8,
                                                        minHeight: 100,
                                                        fontSize: 14,
                                                    }}
                                                >
                                                    {record.contentA || "—"}
                                                </div>
                                            </div>
                                            <div>
                                                <div
                                                    style={{
                                                        fontSize: 14,
                                                        fontWeight: 600,
                                                        color: "#1890ff",
                                                        marginBottom: 8,
                                                    }}
                                                >
                                                    Nội dung B
                                                </div>
                                                <div
                                                    style={{
                                                        whiteSpace: "pre-line",
                                                        wordBreak: "break-word",
                                                        lineHeight: 1.7,
                                                        padding: 16,
                                                        background: "#fff",
                                                        border: "1px solid #e8e8e8",
                                                        borderRadius: 8,
                                                        minHeight: 100,
                                                        fontSize: 14,
                                                    }}
                                                >
                                                    {record.contentB || "—"}
                                                </div>
                                            </div>
                                            <div>
                                                <div
                                                    style={{
                                                        fontSize: 14,
                                                        fontWeight: 600,
                                                        color: "#1890ff",
                                                        marginBottom: 8,
                                                    }}
                                                >
                                                    Nội dung C
                                                </div>
                                                <div
                                                    style={{
                                                        whiteSpace: "pre-line",
                                                        wordBreak: "break-word",
                                                        lineHeight: 1.7,
                                                        padding: 16,
                                                        background: "#fff",
                                                        border: "1px solid #e8e8e8",
                                                        borderRadius: 8,
                                                        minHeight: 100,
                                                        fontSize: 14,
                                                    }}
                                                >
                                                    {record.contentC || "—"}
                                                </div>
                                            </div>
                                            <div>
                                                <div
                                                    style={{
                                                        fontSize: 14,
                                                        fontWeight: 600,
                                                        color: "#1890ff",
                                                        marginBottom: 8,
                                                    }}
                                                >
                                                    Nội dung D
                                                </div>
                                                <div
                                                    style={{
                                                        whiteSpace: "pre-line",
                                                        wordBreak: "break-word",
                                                        lineHeight: 1.7,
                                                        padding: 16,
                                                        background: "#fff",
                                                        border: "1px solid #e8e8e8",
                                                        borderRadius: 8,
                                                        minHeight: 100,
                                                        fontSize: 14,
                                                    }}
                                                >
                                                    {record.contentD || "—"}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ),
                            }}
                        />
                    )}
                </Card>

                <div style={{ textAlign: "right", marginTop: 16 }}>
                    <Button type="primary" onClick={() => setOpenCreate(true)}>
                        Thêm tiêu chí mới
                    </Button>
                </div>
            </Drawer>

            <ModalJobTitlePerformanceContent
                open={openCreate}
                onClose={() => setOpenCreate(false)}
                onSubmit={handleCreate}
                salaryGrades={salaryGrades}
                loading={creating}
            />

            <ModalJobTitlePerformanceContent
                open={openUpdate}
                onClose={() => {
                    setOpenUpdate(false);
                    setSelected(null);
                }}
                onSubmit={handleUpdate}
                salaryGrades={salaryGrades}
                loading={updating}
                initialValues={selected ?? undefined}
            />

            <ViewJobTitlePerformanceContentModal
                open={openView}
                onClose={() => {
                    setOpenView(false);
                    setSelectedView(null);
                }}
                data={selectedView}
            />
        </>
    );
};

export default DrawerJobTitlePerformanceContent;