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
import { useEffect } from "react";
import { DeleteOutlined, UndoOutlined } from "@ant-design/icons";
import AppButton from "@/components/common/ui/AppButton";
import {
    useDepartmentSalaryGradesQuery,
    useCreateDepartmentSalaryGradeMutation,
    useDeleteDepartmentSalaryGradeMutation,
    useRestoreDepartmentSalaryGradeMutation,
} from "@/hooks/useDepartmentSalaryGrades";

import Access from "@/components/share/access";
import { ALL_PERMISSIONS } from "@/config/permissions";

import type { IDepartmentSalaryGrade } from "@/types/backend";
import type { ColumnsType } from "antd/es/table";

const { Title, Text } = Typography;



interface Props {
    open: boolean;
    onClose: () => void;
    departmentJobTitleId: number;
    jobTitleName: string;
    onSuccess?: () => void;
}

const DrawerDepartmentSalaryGrade = ({
    open,
    onClose,
    departmentJobTitleId,
    jobTitleName,
    onSuccess,
}: Props) => {
    const [openModal, setOpenModal] = useState(false);
    const [form] = Form.useForm();

    const { data = [], isLoading, isFetching, refetch } =
        useDepartmentSalaryGradesQuery(departmentJobTitleId);

    const { mutate: createGrade, isPending: creating } =
        useCreateDepartmentSalaryGradeMutation();

    const { mutate: deleteGrade, isPending: deleting } =
        useDeleteDepartmentSalaryGradeMutation();

    const { mutate: restoreGrade, isPending: restoring } =
        useRestoreDepartmentSalaryGradeMutation();

    const suggestedGrade =
        data.length > 0 ? Math.max(...data.map((g) => g.gradeLevel ?? 0)) + 1 : 1;

    const handleCreate = (values: { gradeLevel: number }) => {
        createGrade(
            { departmentJobTitleId, gradeLevel: values.gradeLevel },
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

    const handleDelete = (record: IDepartmentSalaryGrade) => {
        deleteGrade(
            { id: record.id, departmentJobTitleId },
            {
                onSuccess: () => {
                    refetch();
                    onSuccess?.();
                },
            }
        );
    };

    const handleRestore = (record: IDepartmentSalaryGrade) => {
        restoreGrade(
            { id: record.id, departmentJobTitleId },
            {
                onSuccess: () => {
                    refetch();
                    onSuccess?.();
                },
            }
        );
    };

    const columns: ColumnsType<IDepartmentSalaryGrade> = [
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
                <Badge
                    status={active ? "success" : "error"}
                    text={active ? "Hoạt động" : "Đã xoá"}
                />
            ),
        },
        {
            title: "Thao tác",
            width: 120,
            align: "center",
            render: (_, record) => (
                <Space>
                    {record.active ? (
                        <Access permission={ALL_PERMISSIONS.DEPARTMENT_SALARY_GRADES.DELETE} hideChildren>
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
                        </Access>
                    ) : (
                        <Access permission={ALL_PERMISSIONS.DEPARTMENT_SALARY_GRADES.RESTORE} hideChildren>
                            <Button
                                type="text"
                                size="small"
                                icon={<UndoOutlined style={{ color: "#1677ff" }} />}
                                loading={restoring}
                                onClick={() => handleRestore(record)}
                            />
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
                destroyOnClose
                width={850}
                title={
                    <Space direction="vertical" size={0}>
                        <Title level={4}>Quản lý bậc lương (Department)</Title>
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

                <Access permission={ALL_PERMISSIONS.DEPARTMENT_SALARY_GRADES.CREATE} hideChildren>
                    <div
                        style={{
                            width: "100%",
                            marginTop: 20,
                            display: "flex",
                            justifyContent: "flex-end",
                        }}
                    >
                        <AppButton onClick={() => setOpenModal(true)}>
                            Thêm bậc lương
                        </AppButton>
                    </div>
                </Access>
            </Drawer>

            <Modal
                title="Thêm bậc lương mới"
                open={openModal}
                onCancel={() => {
                    form.resetFields();
                    setOpenModal(false);
                }}
                destroyOnClose
                centered
                footer={[
                    <AppButton
                        key="cancel"
                        appVariant="outline"
                        onClick={() => {
                            form.resetFields();
                            setOpenModal(false);
                        }}
                    >
                        Huỷ
                    </AppButton>,

                    <AppButton
                        key="submit"
                        loading={creating}
                        onClick={() => form.submit()}
                    >
                        Tạo mới
                    </AppButton>,
                ]}
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

export default DrawerDepartmentSalaryGrade;