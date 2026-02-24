// src/pages/admin/section/section-salary-grade/drawer.section-salary-grade.tsx

import { useState } from "react";
import {
    Drawer,
    Table,
    Badge,
    Button,
    Space,
    Popconfirm,
    Typography,
    Spin,
    Card,
    Tag,
    Empty,
    Modal,
    Form,
    InputNumber,
} from "antd";

import { DeleteOutlined, UndoOutlined } from "@ant-design/icons";

import {
    useSectionSalaryGradesQuery,
    useCreateSectionSalaryGradeMutation,
    useDeleteSectionSalaryGradeMutation,
    useRestoreSectionSalaryGradeMutation,
} from "@/hooks/useSectionSalaryGrades";

import type { ISectionSalaryGrade } from "@/types/backend";
import type { ColumnsType } from "antd/es/table";

const { Title, Text } = Typography;

const pinkButtonStyle = {
    backgroundColor: "#ff5fa2",
    color: "#fff",
    border: "none",
    borderRadius: 10,
    padding: "10px 22px",
    fontSize: 16,
    fontWeight: 600,
    boxShadow: "0 2px 6px rgba(255, 95, 162, 0.35)",
    transition: "all 0.2s ease",
};

interface Props {
    open: boolean;
    onClose: () => void;
    sectionJobTitleId: number;
    jobTitleName: string;
    onSuccess?: () => void;
}

const DrawerSectionSalaryGrade = ({
    open,
    onClose,
    sectionJobTitleId,
    jobTitleName,
    onSuccess,
}: Props) => {
    const [openModal, setOpenModal] = useState(false);
    const [form] = Form.useForm();

    const { data = [], isLoading, isFetching, refetch } =
        useSectionSalaryGradesQuery(sectionJobTitleId);

    const { mutate: createGrade, isPending: creating } =
        useCreateSectionSalaryGradeMutation();

    const { mutate: deleteGrade, isPending: deleting } =
        useDeleteSectionSalaryGradeMutation();

    const { mutate: restoreGrade, isPending: restoring } =
        useRestoreSectionSalaryGradeMutation();

    const suggestedGrade =
        data.length > 0 ? Math.max(...data.map((g) => g.gradeLevel ?? 0)) + 1 : 1;

    /* ================= CREATE ================= */
    const handleCreate = (values: { gradeLevel: number }) => {
        createGrade(
            { sectionJobTitleId, gradeLevel: values.gradeLevel },
            {
                onSuccess: () => {
                    form.resetFields();
                    setOpenModal(false);
                    refetch();
                    onSuccess?.();
                },
            }
        );
    };

    /* ================= DELETE ================= */
    const handleDelete = (record: ISectionSalaryGrade) => {
        deleteGrade(
            { id: record.id, sectionJobTitleId },
            {
                onSuccess: () => {
                    refetch();
                    onSuccess?.();
                },
            }
        );
    };

    /* ================= RESTORE ================= */
    const handleRestore = (record: ISectionSalaryGrade) => {
        restoreGrade(
            { id: record.id, sectionJobTitleId },
            {
                onSuccess: () => {
                    refetch();
                    onSuccess?.();
                },
            }
        );
    };

    /* ================= TABLE ================= */
    const columns: ColumnsType<ISectionSalaryGrade> = [
        {
            title: "STT",
            width: 60,
            align: "center",
            render: (_, __, idx) => idx + 1,
        },
        {
            title: "Bậc lương",
            dataIndex: "gradeLevel",
            width: 120,
            render: (level) => (
                <Tag
                    color="magenta"
                    style={{
                        padding: "4px 14px",
                        fontSize: 14,
                        borderRadius: 8,
                        fontWeight: 600,
                    }}
                >
                    Bậc {level}
                </Tag>
            ),
        },
        {
            title: "Trạng thái",
            dataIndex: "active",
            width: 120,
            align: "center",
            render: (active) => (
                <Badge status={active ? "success" : "error"} text={active ? "Hoạt động" : "Đã xoá"} />
            ),
        },
        {
            title: "Thao tác",
            width: 120,
            align: "center",
            render: (_, record) => (
                <Space>
                    {record.active ? (
                        <Popconfirm
                            title="Bạn chắc chắn muốn xoá?"
                            onConfirm={() => handleDelete(record)}
                            okButtonProps={{ danger: true }}
                        >
                            <Button
                                type="text"
                                danger
                                size="small"
                                icon={<DeleteOutlined />}
                                loading={deleting}
                            />
                        </Popconfirm>
                    ) : (
                        <Button
                            type="text"
                            size="small"
                            icon={<UndoOutlined style={{ color: "#1677ff" }} />}
                            loading={restoring}
                            onClick={() => handleRestore(record)}
                        />
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
                destroyOnClose
                width={850}
                title={
                    <Space direction="vertical" size={0}>
                        <Title level={4}>Quản lý bậc lương (Section)</Title>
                        <Text type="secondary">
                            Chức danh: <Text strong>{jobTitleName}</Text>
                        </Text>
                    </Space>
                }
            >
                <Card bordered={false}>
                    {isLoading || isFetching ? (
                        <Spin size="large" />
                    ) : (
                        <Table
                            rowKey="id"
                            columns={columns}
                            dataSource={data}
                            pagination={false}
                            locale={{
                                emptyText: <Empty description="Không có dữ liệu" />,
                            }}
                        />
                    )}
                </Card>

                {/* NÚT THÊM DƯỚI BÊN PHẢI */}
                <div
                    style={{
                        width: "100%",
                        marginTop: 20,
                        display: "flex",
                        justifyContent: "flex-end",
                    }}
                >
                    <Button
                        style={pinkButtonStyle}
                        onClick={() => setOpenModal(true)}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#ff4b97")}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#ff5fa2")}
                    >
                        + Thêm bậc lương
                    </Button>
                </div>
            </Drawer>

            {/* MODAL CREATE */}
            <Modal
                title="Thêm bậc lương mới"
                open={openModal}
                onCancel={() => {
                    form.resetFields();
                    setOpenModal(false);
                }}
                onOk={() => form.submit()}
                confirmLoading={creating}
                okText="Tạo mới"
                cancelText="Huỷ"
            >
                <Form
                    layout="vertical"
                    form={form}
                    initialValues={{ gradeLevel: suggestedGrade }}
                    onFinish={handleCreate}
                >
                    <Form.Item
                        name="gradeLevel"
                        label="Bậc lương"
                        rules={[{ required: true, message: "Vui lòng nhập bậc lương" }]}
                    >
                        <InputNumber min={1} style={{ width: "100%" }} />
                    </Form.Item>
                </Form>
            </Modal>
        </>
    );
};

export default DrawerSectionSalaryGrade;
