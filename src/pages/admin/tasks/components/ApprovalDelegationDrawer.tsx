import React from "react";
import {
    Form,
    Select,
    DatePicker,
    Input,
    Button,
    Table,
    Tag,
    Popconfirm,
    Card,
    Typography,
    Space,
    Avatar,
} from "antd";
import { DeleteOutlined, PlusOutlined, UserSwitchOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import {
    useCreateApprovalDelegationMutation,
    useMyApprovalDelegationsQuery,
    useRevokeApprovalDelegationMutation,
} from "@/hooks/useApprovalDelegations";
import { useUsersQuery } from "@/hooks/useUsers";
import LotusDetailDrawer from "@/components/common/drawer/LotusDetailDrawer";
import { formatDateTime } from "../taskUtils";
import "../TaskWorkspace.css";

const { Title, Text } = Typography;

interface Props {
    open: boolean;
    onClose: () => void;
}

export const ApprovalDelegationDrawer: React.FC<Props> = ({ open, onClose }) => {
    const [form] = Form.useForm();
    const { data: delegations = [], isLoading } = useMyApprovalDelegationsQuery();
    const { data: usersData } = useUsersQuery("page=1&size=500", open);

    const usersList = usersData?.result || [];

    const createMutation = useCreateApprovalDelegationMutation();
    const revokeMutation = useRevokeApprovalDelegationMutation();

    const handleCreate = async () => {
        try {
            const values = await form.validateFields();
            const dateRange = values.dateRange;
            const validFrom = dateRange?.[0] ? dateRange[0].toISOString() : new Date().toISOString();
            const validTo = dateRange?.[1] ? dateRange[1].toISOString() : new Date().toISOString();

            await createMutation.mutateAsync({
                module: "TASK",
                delegateUserId: values.delegateUserId,
                validFrom,
                validTo,
                reason: values.reason,
            });

            form.resetFields();
        } catch (err) {
            // Form validation or mutation failed
        }
    };

    const handleRevoke = async (id: number) => {
        await revokeMutation.mutateAsync(id);
    };

    const columns = [
        {
            title: "Người được ủy quyền",
            dataIndex: "delegateName",
            key: "delegateName",
            render: (text: string, record: any) => {
                const displayName = text || record.delegateUserId || "N/A";
                return (
                    <Space size={8}>
                        <Avatar
                            size="small"
                            style={{
                                backgroundColor: "#fff1f2",
                                color: "#be123c",
                                border: "1px solid #fecdd3",
                                fontSize: 11,
                                fontWeight: 700,
                            }}
                        >
                            {displayName.charAt(0)?.toUpperCase()}
                        </Avatar>
                        <span style={{ fontWeight: 600, color: "#1e293b" }}>{displayName}</span>
                    </Space>
                );
            },
        },
        {
            title: "Từ ngày",
            dataIndex: "validFrom",
            key: "validFrom",
            render: (val: string) => (
                <span style={{ fontSize: 12.5, color: "#475467" }}>{formatDateTime(val)}</span>
            ),
        },
        {
            title: "Đến ngày",
            dataIndex: "validTo",
            key: "validTo",
            render: (val: string) => (
                <span style={{ fontSize: 12.5, color: "#475467" }}>{formatDateTime(val)}</span>
            ),
        },
        {
            title: "Trạng thái",
            dataIndex: "status",
            key: "status",
            align: "center" as const,
            render: (status: string) => {
                if (status === "ACTIVE") {
                    return (
                        <Tag color="success" style={{ borderRadius: 6, fontWeight: 600, padding: "1px 8px" }}>
                            Đang hiệu lực
                        </Tag>
                    );
                }
                if (status === "REVOKED") {
                    return (
                        <Tag color="default" style={{ borderRadius: 6, fontWeight: 600, padding: "1px 8px" }}>
                            Đã thu hồi
                        </Tag>
                    );
                }
                if (status === "EXPIRED") {
                    return (
                        <Tag color="warning" style={{ borderRadius: 6, fontWeight: 600, padding: "1px 8px" }}>
                            Đã hết hạn
                        </Tag>
                    );
                }
                return <Tag style={{ borderRadius: 6 }}>{status}</Tag>;
            },
        },
        {
            title: "Hành động",
            key: "action",
            align: "center" as const,
            render: (_: any, record: any) => {
                if (record.status !== "ACTIVE") return <span style={{ color: "#94a3b8" }}>--</span>;
                return (
                    <Popconfirm
                        title="Bạn có chắc chắn muốn thu hồi ủy quyền này?"
                        onConfirm={() => handleRevoke(record.id)}
                        okText="Thu hồi"
                        cancelText="Hủy"
                        okButtonProps={{ danger: true }}
                    >
                        <Button
                            type="text"
                            danger
                            icon={<DeleteOutlined />}
                            style={{ borderRadius: 6, fontWeight: 600, fontSize: 12 }}
                        >
                            Thu hồi
                        </Button>
                    </Popconfirm>
                );
            },
        },
    ];

    return (
        <LotusDetailDrawer open={open} onClose={onClose} destroyOnClose>
            <div className="task-detail-shell">
                {/* Header Bar Hallmark Style */}
                <div
                    className="task-detail-header"
                    style={{
                        padding: "18px 24px",
                        borderBottom: "1px solid #f1f5f9",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        background: "linear-gradient(180deg, #fff1f2 0%, #ffffff 60px, #ffffff 100%)",
                        borderTopLeftRadius: 24,
                        borderTopRightRadius: 24,
                    }}
                >
                    <Space align="center" className="task-detail-heading">
                        <div className="task-detail-heading__icon">
                            <UserSwitchOutlined />
                        </div>
                        <div className="task-detail-heading__copy">
                            <Text className="task-detail-eyebrow">ỦY QUYỀN DUYỆT TÁC VỤ</Text>
                            <Title level={4} style={{ margin: 0 }}>
                                Quản lý ủy quyền duyệt tác vụ
                            </Title>
                            <Text type="secondary" style={{ fontSize: 12 }}>
                                Ủy quyền cho nhân viên khác phê duyệt công việc khi vắng mặt
                            </Text>
                        </div>
                    </Space>
                    <Button onClick={onClose} className="task-secondary-button">
                        Đóng
                    </Button>
                </div>

                {/* Drawer Body Hallmark Style */}
                <div className="task-detail-body" style={{ padding: "20px 24px 28px" }}>
                    <Card
                        className="task-form-card"
                        title={
                            <Space align="center">
                                <PlusOutlined style={{ color: "var(--task-accent)" }} />
                                <span style={{ fontWeight: 680, color: "var(--task-ink)" }}>
                                    Tạo mới ủy quyền duyệt
                                </span>
                            </Space>
                        }
                        size="small"
                        style={{ marginBottom: 20 }}
                    >
                        <Form form={form} layout="vertical" className="task-form">
                            <Form.Item
                                name="delegateUserId"
                                label="Người nhận ủy quyền"
                                rules={[{ required: true, message: "Vui lòng chọn người nhận ủy quyền" }]}
                            >
                                <Select
                                    showSearch
                                    placeholder="Chọn nhân viên ủy quyền"
                                    optionFilterProp="children"
                                >
                                    {usersList.map((u) => (
                                        <Select.Option key={u.id} value={u.id}>
                                            <Space size={8}>
                                                <Avatar
                                                    size="small"
                                                    style={{
                                                        backgroundColor: "#fff1f2",
                                                        color: "#be123c",
                                                        border: "1px solid #fecdd3",
                                                        fontSize: 10,
                                                        fontWeight: 700,
                                                    }}
                                                >
                                                    {(u.name || u.email)?.charAt(0)?.toUpperCase()}
                                                </Avatar>
                                                <span style={{ fontWeight: 550, color: "#1e293b" }}>{u.name}</span>
                                                <span style={{ color: "#64748b", fontSize: 11 }}>({u.email})</span>
                                            </Space>
                                        </Select.Option>
                                    ))}
                                </Select>
                            </Form.Item>

                            <Form.Item
                                name="dateRange"
                                label="Khoảng thời gian ủy quyền"
                                rules={[{ required: true, message: "Vui lòng chọn thời gian hiệu lực" }]}
                            >
                                <DatePicker.RangePicker
                                    showTime
                                    style={{ width: "100%" }}
                                    format="DD/MM/YYYY HH:mm"
                                    disabledDate={(current) => current && current.isBefore(dayjs().startOf("day"))}
                                />
                            </Form.Item>

                            <Form.Item name="reason" label="Lý do ủy quyền">
                                <Input.TextArea rows={2} placeholder="Nghỉ phép, công tác..." />
                            </Form.Item>

                            <Button
                                type="primary"
                                icon={<PlusOutlined />}
                                onClick={handleCreate}
                                loading={createMutation.isPending}
                                block
                                className="task-primary-button"
                                style={{ height: 40, fontSize: 13.5, fontWeight: 650 }}
                            >
                                Tạo ủy quyền
                            </Button>
                        </Form>
                    </Card>

                    <Card
                        className="task-form-card"
                        title={
                            <Space align="center">
                                <UserSwitchOutlined style={{ color: "var(--task-accent)" }} />
                                <span style={{ fontWeight: 680, color: "var(--task-ink)" }}>
                                    Danh sách ủy quyền của tôi
                                </span>
                            </Space>
                        }
                        size="small"
                    >
                        <Table
                            dataSource={delegations}
                            columns={columns}
                            rowKey="id"
                            loading={isLoading}
                            pagination={false}
                            size="small"
                        />
                    </Card>
                </div>
            </div>
        </LotusDetailDrawer>
    );
};
