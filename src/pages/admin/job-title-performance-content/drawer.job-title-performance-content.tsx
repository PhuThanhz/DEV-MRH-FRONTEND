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
    Tooltip,
} from "antd";
import { EyeOutlined, EditOutlined, DeleteOutlined, RedoOutlined } from "@ant-design/icons";

import ModalJobTitlePerformanceContent from "./modal.job-title-performance-content";
import ViewJobTitlePerformanceContentModal from "./modal.view-job-title-performance-content";
import SearchFilter from "@/components/common/filter/SearchFilter"; // 👈 đường dẫn tuỳ project bạn

import {
    useJobTitlePerformanceContentQuery,
    useCreateJobTitlePerformanceContentMutation,
    useUpdateJobTitlePerformanceContentMutation,
    useDisableJobTitlePerformanceContentMutation,
    useRestoreJobTitlePerformanceContentMutation,
} from "@/hooks/useJobTitlePerformanceContent";

import { useSalaryGradesByOwnerLevel } from "@/hooks/useSalaryGradesByOwnerLevel";

import Access from "@/components/share/access";
import { ALL_PERMISSIONS } from "@/config/permissions";

import type {
    IJobTitlePerformanceContent,
    IReqJobTitlePerformanceContent,
} from "@/types/backend";

import type { ColumnsType } from "antd/es/table";

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
                    setOpenCreate(false);
                    refetch();
                    onSuccess?.();
                },
            }
        );
    };

    const handleUpdate = (values: IReqJobTitlePerformanceContent) => {
        if (!selected) return;
        updateItem(
            { id: selected.id, payload: { ...values, ownerLevel, ownerJobTitleId } },
            {
                onSuccess: () => {
                    setOpenUpdate(false);
                    setSelected(null);
                    refetch();
                    onSuccess?.();
                },
            }
        );
    };

    const handleDisable = (id: number) => {
        disableItem({ id }, { onSuccess: () => refetch() });
    };

    const handleRestore = (id: number) => {
        restoreItem({ id }, { onSuccess: () => refetch() });
    };

    const columns: ColumnsType<IJobTitlePerformanceContent> = [
        {
            title: "STT",
            width: 60,
            align: "center",
            render: (_, __, index) => (
                <Text type="secondary" style={{ fontSize: 13 }}>{index + 1}</Text>
            ),
        },
        {
            title: "Bậc lương",
            dataIndex: "salaryGradeNumber",
            width: 140,
            render: (v) => (
                <Tag color="blue" style={{ fontWeight: 600, fontSize: 13 }}>
                    Bậc {v}
                </Tag>
            ),
        },
        {
            title: "Trạng thái",
            dataIndex: "active",
            width: 140,
            align: "center",
            render: (active) =>
                active ? (
                    <Badge status="success" text={<Text style={{ fontSize: 13 }}>Hoạt động</Text>} />
                ) : (
                    <Badge status="error" text={<Text type="secondary" style={{ fontSize: 13 }}>Vô hiệu</Text>} />
                ),
        },
        {
            title: "Thao tác",
            width: 160,
            align: "center",
            render: (_, record) => (
                <Space size={4}>
                    <Access permission={ALL_PERMISSIONS.JOB_TITLE_PERFORMANCE_CONTENT.UPDATE} hideChildren>
                        <Tooltip title="Chỉnh sửa">
                            <Button
                                type="text"
                                icon={<EditOutlined />}
                                style={{ color: "#fa8c16" }}
                                onClick={() => {
                                    setSelected(record);
                                    setOpenUpdate(true);
                                }}
                            />
                        </Tooltip>
                    </Access>

                    {record.active ? (
                        <Access permission={ALL_PERMISSIONS.JOB_TITLE_PERFORMANCE_CONTENT.DISABLE} hideChildren>
                            <Tooltip title="Vô hiệu hoá">
                                <Popconfirm
                                    title="Xác nhận vô hiệu hoá tiêu chí này?"
                                    okText="Vô hiệu"
                                    cancelText="Huỷ"
                                    okButtonProps={{ danger: true }}
                                    onConfirm={() => handleDisable(record.id)}
                                >
                                    <Button
                                        type="text"
                                        icon={<DeleteOutlined />}
                                        danger
                                        loading={disabling}
                                    />
                                </Popconfirm>
                            </Tooltip>
                        </Access>
                    ) : (
                        <Access permission={ALL_PERMISSIONS.JOB_TITLE_PERFORMANCE_CONTENT.RESTORE} hideChildren>
                            <Tooltip title="Khôi phục">
                                <Popconfirm
                                    title="Khôi phục tiêu chí này?"
                                    okText="Khôi phục"
                                    cancelText="Huỷ"
                                    onConfirm={() => handleRestore(record.id)}
                                >
                                    <Button
                                        type="text"
                                        icon={<RedoOutlined />}
                                        style={{ color: "#52c41a" }}
                                        loading={restoring}
                                    />
                                </Popconfirm>
                            </Tooltip>
                        </Access>
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
                    <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                        <Title level={4} style={{ margin: 0 }}>
                            Tiêu chí đánh giá hiệu suất
                        </Title>
                        <Text type="secondary" style={{ fontSize: 13, fontWeight: 400 }}>
                            Chức danh: {ownerJobTitleName}
                        </Text>
                    </div>
                }
            >
                {/* Thanh SearchFilter thay thế nút Thêm ở extra */}
                <div style={{ marginBottom: 16 }}>
                    <SearchFilter
                        searchPlaceholder="Tìm theo bậc lương..."
                        showFilterButton={false}
                        showResetButton
                        onSearch={(val) => console.log("search", val)}
                        onReset={() => refetch()}
                        onAddClick={() => setOpenCreate(true)}
                        addLabel="Thêm tiêu chí"
                        addPermission={ALL_PERMISSIONS.JOB_TITLE_PERFORMANCE_CONTENT.CREATE}
                    />
                </div>

                <Card styles={{ body: { padding: 0 } }} style={{ borderRadius: 10, overflow: "hidden" }}>
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
                            locale={{
                                emptyText: (
                                    <Empty
                                        description="Chưa có tiêu chí nào"
                                        style={{ padding: "40px 0" }}
                                    />
                                ),
                            }}
                            rowClassName={(record) => (!record.active ? "row-disabled" : "")}
                            expandable={{
                                expandIcon: ({ expanded, onExpand, record }) => (
                                    <Tooltip title={expanded ? "Ẩn nội dung" : "Xem nội dung"}>
                                        <Button
                                            type="text"
                                            size="small"
                                            icon={<EyeOutlined />}
                                            style={{ color: expanded ? "#1677ff" : "#8c8c8c" }}
                                            onClick={(e) => onExpand(record, e)}
                                        />
                                    </Tooltip>
                                ),
                                expandedRowRender: (record) => (
                                    <div style={{ padding: "20px 32px", background: "#fafbfc" }}>
                                        <div
                                            style={{
                                                display: "grid",
                                                gridTemplateColumns: "1fr 1fr",
                                                gap: 16,
                                            }}
                                        >
                                            {["A", "B", "C", "D"].map((label) => (
                                                <div key={label}>
                                                    <Text
                                                        strong
                                                        style={{
                                                            color: "#1890ff",
                                                            display: "block",
                                                            marginBottom: 6,
                                                            fontSize: 13,
                                                        }}
                                                    >
                                                        Nội dung {label}
                                                    </Text>
                                                    <div
                                                        style={{
                                                            whiteSpace: "pre-line",
                                                            wordBreak: "break-word",
                                                            lineHeight: 1.7,
                                                            padding: "12px 14px",
                                                            background: "#fff",
                                                            border: "1px solid #e8e8e8",
                                                            borderRadius: 8,
                                                            minHeight: 80,
                                                            fontSize: 13,
                                                            color: "#444",
                                                        }}
                                                    >
                                                        {(record[
                                                            `content${label}` as keyof IJobTitlePerformanceContent
                                                        ] as string) || (
                                                                <Text type="secondary" italic>
                                                                    Chưa có nội dung
                                                                </Text>
                                                            )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ),
                            }}
                        />
                    )}
                </Card>

                <style>{`
                    .row-disabled td {
                        opacity: 0.45;
                    }
                `}</style>
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