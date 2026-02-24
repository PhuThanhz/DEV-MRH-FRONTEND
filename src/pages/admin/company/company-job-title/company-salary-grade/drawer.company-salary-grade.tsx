// src/pages/admin/company/company-job-title/company-salary-grade/drawer.company-salary-grade.tsx

import { useState } from "react";
import {
    Drawer,
    Table,
    Badge,
    Button,
    Space,
    Popconfirm,
    Modal,
    Form,
    InputNumber,
    Spin,
    Typography,
    Card,
    Tag,
    Empty,
} from "antd";

import {
    useCompanySalaryGradesQuery,
    useCreateCompanySalaryGradeMutation,
    useDeleteCompanySalaryGradeMutation,
    useRestoreCompanySalaryGradeMutation,
} from "@/hooks/useCompanySalaryGrades";

import { DeleteOutlined, UndoOutlined } from "@ant-design/icons";

import type { ICompanySalaryGrade } from "@/types/backend";
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
    companyJobTitleId: number;
    jobTitleName: string;
    onSuccess?: () => void;
}

const DrawerCompanySalaryGrade = ({
    open,
    onClose,
    companyJobTitleId,
    jobTitleName,
    onSuccess,
}: Props) => {
    const [openModal, setOpenModal] = useState(false);
    const [form] = Form.useForm();

    const { data = [], isLoading, isFetching, refetch } =
        useCompanySalaryGradesQuery(companyJobTitleId);

    const { mutate: createGrade, isPending: creating } =
        useCreateCompanySalaryGradeMutation();

    const { mutate: deleteGrade, isPending: deleting } =
        useDeleteCompanySalaryGradeMutation();

    const { mutate: restoreGrade, isPending: restoring } =
        useRestoreCompanySalaryGradeMutation();

    const suggestedGrade =
        data.length > 0 ? Math.max(...data.map((g) => g.gradeLevel ?? 0)) + 1 : 1;

    /* CREATE */
    const handleCreate = (values: { gradeLevel: number }) => {
        createGrade(
            { companyJobTitleId, gradeLevel: values.gradeLevel },
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

    /* DELETE */
    const handleDelete = (record: ICompanySalaryGrade) => {
        deleteGrade(
            { id: record.id, companyJobTitleId },
            { onSuccess: () => refetch() }
        );
    };

    /* RESTORE */
    const handleRestore = (record: ICompanySalaryGrade) => {
        restoreGrade(
            { id: record.id, companyJobTitleId },
            { onSuccess: () => refetch() }
        );
    };

    /* COLUMNS */
    const columns: ColumnsType<ICompanySalaryGrade> = [
        {
            title: "STT",
            width: 60,
            align: "center",
            render: (_, __, idx) => idx + 1,
        },
        {
            title: "Bậc lương",
            dataIndex: "gradeLevel",
            width: 140,
            render: (level) => (
                <Tag color="magenta" style={{ padding: "4px 14px", fontWeight: 600 }}>
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
                        >
                            <Button
                                type="text"
                                danger
                                icon={<DeleteOutlined />}
                                loading={deleting}
                            />
                        </Popconfirm>
                    ) : (
                        <Button
                            type="text"
                            icon={<UndoOutlined style={{ color: "#1677ff" }} />}
                            onClick={() => handleRestore(record)}
                            loading={restoring}
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
                        <Title level={4}>Bậc lương – Công ty</Title>
                        <Text type="secondary">Chức danh: <strong>{jobTitleName}</strong></Text>
                    </Space>
                }
            >
                <Card bordered={false}>
                    {isLoading || isFetching ? (
                        <Spin size="large" />
                    ) : (
                        <Table
                            rowKey={(row) => row.id ?? `temp-${Math.random()}`}
                            columns={columns}
                            dataSource={data}
                            pagination={false}
                            locale={{ emptyText: <Empty description="Không có dữ liệu" /> }}
                        />
                    )}
                </Card>

                <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 20 }}>
                    <Button style={pinkButtonStyle} onClick={() => setOpenModal(true)}>
                        + Thêm bậc lương
                    </Button>
                </div>
            </Drawer>

            {/* MODAL */}
            <Modal
                title="Thêm bậc lương mới"
                open={openModal}
                onCancel={() => setOpenModal(false)}
                onOk={() => form.submit()}
                confirmLoading={creating}
            >
                <Form
                    form={form}
                    layout="vertical"
                    initialValues={{ gradeLevel: suggestedGrade }}
                    onFinish={handleCreate}
                >
                    <Form.Item
                        name="gradeLevel"
                        label="Bậc lương"
                        rules={[{ required: true }]}
                    >
                        <InputNumber min={1} style={{ width: "100%" }} />
                    </Form.Item>
                </Form>
            </Modal>
        </>
    );
};

export default DrawerCompanySalaryGrade;
