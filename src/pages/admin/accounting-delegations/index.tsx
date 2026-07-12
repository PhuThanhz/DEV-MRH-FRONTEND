import React, { useMemo, useState } from "react";
import { 
    Button, Space, Tag, Form, Input, 
    DatePicker, Select, Modal, Alert, Empty
} from "antd";
import { 
    PlusOutlined, CheckCircleOutlined, StopOutlined
} from "@ant-design/icons";
import type { ProColumns } from "@ant-design/pro-components";
import { useQueryClient } from "@tanstack/react-query";
import { notify } from "@/components/common/notification/notify";
import { callCreateDelegation } from "@/config/api";
import PageContainer from "@/components/common/data-table/PageContainer";
import DataTable from "@/components/common/data-table";
import SearchFilter from "@/components/common/filter/SearchFilter";
import AdvancedFilterSelect from "@/components/common/filter/AdvancedFilterSelect";
import UserSelectField from "@/pages/admin/procedures/components/UserSelectField";
import { useAppSelector } from "@/redux/hooks";
import { useUsersQuery } from "@/hooks/useUsers";
import { 
    useFetchDelegationsQuery,
    useActivateDelegationMutation,
    useRevokeDelegationMutation
} from "@/hooks/useAccountingDossiers";
import { formatDateTime } from "../accounting-dossiers/dossierUtils";
import { PAGINATION_CONFIG } from "@/config/pagination";
import dayjs from "dayjs";
import useAccess from "@/hooks/useAccess";
import { ALL_PERMISSIONS } from "@/config/permissions";

interface IDelegation {
    id: number;
    delegatorUserId: string;
    delegatorName?: string;
    delegatorEmail?: string;
    delegateUserId: string;
    delegateName?: string;
    delegateEmail?: string;
    validFrom: string;
    validTo: string;
    reason?: string;
    status: "DRAFT" | "ACTIVE" | "REVOKED" | "EXPIRED";
    createdAt: string;
}

const DelegationsPage = () => {
    const canCreate   = useAccess(ALL_PERMISSIONS.ACCOUNTING_DELEGATIONS.CREATE);
    const canActivate = useAccess(ALL_PERMISSIONS.ACCOUNTING_DELEGATIONS.ACTIVATE);
    const canRevoke   = useAccess(ALL_PERMISSIONS.ACCOUNTING_DELEGATIONS.REVOKE);
    const [form] = Form.useForm();
    const queryClient = useQueryClient();
    const [modalOpen, setModalOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [assignorCount, setAssignorCount] = useState(0);
    const [delegateCount, setDelegateCount] = useState(0);
    const [confirmModal, setConfirmModal] = useState<{
        open: boolean;
        title: string;
        content: string;
        okText: string;
        onOk: () => Promise<void>;
        confirmLoading?: boolean;
    } | null>(null);
    const [searchValue, setSearchValue] = useState("");
    const [statusFilter, setStatusFilter] = useState<string | null>(null);
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(PAGINATION_CONFIG?.DEFAULT_PAGE_SIZE || 10);
    const [filterResetSignal, setFilterResetSignal] = useState(0);
    const currentUser = useAppSelector((state) => state.account.user);
    const isSuperAdmin = (currentUser.role?.name?.toUpperCase() || "") === "SUPER_ADMIN";

    // Fetch lists
    const delegationQuery = `page=${page}&size=${pageSize}${searchValue.trim() ? `&keyword=${encodeURIComponent(searchValue.trim())}` : ""}${statusFilter ? `&status=${statusFilter}` : ""}`;
    const { data: delegationData, isFetching, refetch } = useFetchDelegationsQuery(delegationQuery);
    const delegations = delegationData?.result || [];
    const meta = delegationData?.meta || { page, pageSize, total: 0 };
    const { data: userData } = useUsersQuery("size=1000");
    const users = userData?.result || [];

    // Mutations
    const activateMutation = useActivateDelegationMutation();
    const revokeMutation = useRevokeDelegationMutation();

    const handleOpenCreate = () => {
        form.resetFields();
        form.setFieldsValue({
            assignorId: currentUser.id ? [String(currentUser.id)] : [],
            delegateId: [],
            startDate: dayjs(),
            endDate: dayjs().add(7, "day")
        });
        setAssignorCount(currentUser.id ? 1 : 0);
        setDelegateCount(0);
        setModalOpen(true);
    };

    const handleSubmit = async (values: any) => {
        setSubmitting(true);
        try {
            const payload = {
                delegatorUserId: Array.isArray(values.assignorId) ? values.assignorId[0] : values.assignorId,
                delegateUserId: Array.isArray(values.delegateId) ? values.delegateId[0] : values.delegateId,
                validFrom: values.startDate.toISOString(),
                validTo: values.endDate.toISOString(),
                reason: values.reason,
                activateImmediately: true,
            };
            
            // 1. Create delegation (usually in DRAFT status)
            const res = await callCreateDelegation(payload);
            const createdDelegation = res?.data;
            if (!createdDelegation?.id) {
                throw new Error("Không thể tạo ủy quyền");
            }

            notify.success("Tạo và kích hoạt ủy quyền thành công");
            setModalOpen(false);
            queryClient.invalidateQueries({ queryKey: ["accounting-approval-delegations"] });
            refetch();
        } catch (error: any) {
            const errStr = error?.response?.data?.message 
                ? (Array.isArray(error.response.data.message) ? error.response.data.message.join("; ") : error.response.data.message)
                : (error?.message || "Lỗi khi tạo và kích hoạt ủy quyền");
            notify.error(errStr);
        } finally {
            setSubmitting(false);
        }
    };

    const handleActivate = (id: number) => {
        setConfirmModal({
            open: true,
            title: "Kích hoạt ủy quyền",
            content: "Xác nhận kích hoạt ủy quyền phê duyệt này?",
            okText: "Kích hoạt",
            onOk: async () => {
                await activateMutation.mutateAsync(id);
                refetch();
            }
        });
    };

    const handleRevoke = (id: number) => {
        setConfirmModal({
            open: true,
            title: "Thu hồi ủy quyền",
            content: "Bạn có chắc chắn muốn thu hồi ủy quyền này ngay lập tức?",
            okText: "Thu hồi",
            onOk: async () => {
                await revokeMutation.mutateAsync(id);
                refetch();
            }
        });
    };

    const getUserLabel = (userId: string) => {
        const u = users.find(item => String(item.id) === String(userId));
        if (!u) return `User #${userId}`;
        const roleStr = u.role?.name ? ` - ${u.role.name}` : "";
        return `${u.name || u.email} (${u.email}${roleStr})`;
    };

    const getEffectiveStatus = (delegation: IDelegation) => {
        if ((delegation.status === "ACTIVE" || delegation.status === "DRAFT")
            && dayjs(delegation.validTo).isBefore(dayjs())) return "EXPIRED";
        return delegation.status;
    };

    const filteredDelegations = delegations;

    const renderUserCell = (userId: string, subLabel: string, record?: IDelegation, isDelegator?: boolean) => {
        const name = isDelegator ? record?.delegatorName : record?.delegateName;
        const email = isDelegator ? record?.delegatorEmail : record?.delegateEmail;
        const u = users.find(item => String(item.id) === String(userId));
        return (
            <Space direction="vertical" size={1} style={{ lineHeight: 1.35 }}>
                <span style={{ fontWeight: 650, color: "#172033" }}>{name || u?.name || u?.email || `User #${userId}`}</span>
                <span style={{ color: "#7b8494", fontSize: 12 }}>{subLabel} {email || u?.email ? `(${email || u?.email})` : ""}</span>
            </Space>
        );
    };

    const columns: ProColumns<IDelegation>[] = [
        {
            title: "Người ủy quyền",
            dataIndex: "delegatorUserId",
            key: "delegatorUserId",
            width: 250,
            render: (dom, entity) => renderUserCell(entity.delegatorUserId, "Người ủy quyền", entity, true)
        },
        {
            title: "Người nhận ủy quyền",
            dataIndex: "delegateUserId",
            key: "delegateUserId",
            width: 250,
            render: (dom, entity) => renderUserCell(entity.delegateUserId, "Người nhận ủy quyền", entity, false)
        },
        {
            title: "Hiệu lực",
            key: "validity",
            width: 170,
            render: (dom, entity) => (
                <Space direction="vertical" size={2} style={{ fontSize: 13 }}>
                    <span>{formatDateTime(entity.validFrom)}</span>
                    <span style={{ color: "#6b7280" }}>đến {formatDateTime(entity.validTo)}</span>
                </Space>
            )
        },
        {
            title: "Lý do",
            dataIndex: "reason",
            key: "reason",
            width: 200,
            ellipsis: true,
            render: (dom, entity) => (
                <span style={{ color: entity.reason ? "#374151" : "#9ca3af" }}>
                    {entity.reason || "Không ghi chú"}
                </span>
            )
        },
        {
            title: "Trạng thái",
            dataIndex: "status",
            key: "status",
            width: 120,
            align: "center" as const,
            render: (dom, entity) => {
                const effectiveStatus = getEffectiveStatus(entity);
                if (effectiveStatus === "EXPIRED") return <Tag color="error">Hết hạn</Tag>;
                if (effectiveStatus === "ACTIVE" && dayjs(entity.validFrom).isAfter(dayjs())) {
                    return <Tag color="processing">Sắp hiệu lực</Tag>;
                }
                if (effectiveStatus === "ACTIVE") return <Tag color="success">Đang hiệu lực</Tag>;
                if (entity.status === "REVOKED") return <Tag color="default">Đã thu hồi</Tag>;
                if (entity.status === "EXPIRED") return <Tag color="error">Hết hạn</Tag>;
                return <Tag color="warning">Nháp</Tag>;
            }
        },
        {
            title: "Hành động",
            key: "actions",
            width: 120,
            align: "center" as const,
            render: (dom, entity) => {
                const effectiveStatus = getEffectiveStatus(entity);
                const canActivateDelegation = effectiveStatus === "DRAFT" && canActivate;
                const canRevokeDelegation = effectiveStatus === "ACTIVE" && canRevoke;

                if (!canActivateDelegation && !canRevokeDelegation) {
                    const inactiveMessage = effectiveStatus === "EXPIRED"
                        ? "Ủy quyền đã hết hạn"
                        : effectiveStatus === "REVOKED"
                            ? "Ủy quyền đã được thu hồi"
                            : "Bạn không có quyền thao tác";
                    return (
                        <span
                            title={inactiveMessage}
                            aria-label={inactiveMessage}
                            style={{ color: "#98a2b3", fontSize: 13 }}
                        >
                            Không có thao tác
                        </span>
                    );
                }

                return (
                    <Space size={2}>
                    {canActivateDelegation && (
                        <Button 
                            type="text" 
                            size="small" 
                            title="Kích hoạt"
                            aria-label="Kích hoạt ủy quyền"
                            icon={<CheckCircleOutlined style={{ color: "#16794c", fontSize: 17 }} />} 
                            onClick={(e) => {
                                e.stopPropagation();
                                handleActivate(entity.id);
                            }}
                        />
                    )}
                    {canRevokeDelegation && (
                        <Button 
                            type="text"
                            size="small" 
                            title="Thu hồi"
                            aria-label="Thu hồi ủy quyền"
                            icon={<StopOutlined style={{ color: "#dc2626", fontSize: 17 }} />} 
                            onClick={(e) => {
                                e.stopPropagation();
                                handleRevoke(entity.id);
                            }}
                        />
                    )}
                </Space>
                );
            }
        }
    ];

    return (
        <PageContainer 
            title="Ủy quyền phê duyệt"
            filter={
                <div style={{ display: "grid", gap: 10 }}>
                    <SearchFilter
                        searchPlaceholder="Tìm người ủy quyền, người nhận hoặc lý do..."
                        showFilterButton={false}
                        addLabel={canCreate ? "Tạo ủy quyền" : undefined}
                        onAddClick={canCreate ? handleOpenCreate : undefined}
                        onSearch={(value) => { setPage(1); setSearchValue(value); }}
                        onReset={() => {
                            setSearchValue("");
                            setStatusFilter(null);
                            setPage(1);
                            setFilterResetSignal((current) => current + 1);
                            refetch();
                        }}
                    />
                    <AdvancedFilterSelect
                        resetSignal={filterResetSignal}
                        fields={[{
                            key: "status",
                            label: "Trạng thái",
                            options: [
                                { label: "Nháp", value: "DRAFT", color: "orange" },
                                { label: "Đang hiệu lực", value: "ACTIVE", color: "green" },
                                { label: "Đã thu hồi", value: "REVOKED", color: "default" },
                                { label: "Hết hạn", value: "EXPIRED", color: "red" },
                            ]
                        }]}
                        onChange={(filters) => { setPage(1); setStatusFilter(filters.status ?? null); }}
                    />
                </div>
            }
        >
            {filteredDelegations.length === 0 && !isFetching ? (
                <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description={delegations.length ? "Không có ủy quyền nào khớp bộ lọc hiện tại" : "Chưa có ủy quyền phê duyệt nào"}
                    style={{ padding: "44px 0", background: "#fff", borderRadius: 12, border: "1px solid #edf0f5" }}
                >
                    {delegations.length ? (
                        <Button type="link" onClick={() => { setSearchValue(""); setStatusFilter(null); setFilterResetSignal((current) => current + 1); }}>Xóa bộ lọc</Button>
                    ) : canCreate ? (
                        <Button type="primary" icon={<PlusOutlined />} onClick={handleOpenCreate}>Tạo ủy quyền đầu tiên</Button>
                    ) : null}
                </Empty>
            ) : (
                <DataTable<IDelegation>
                    dataSource={filteredDelegations}
                    columns={columns}
                    rowKey="id"
                    loading={isFetching}
                    search={false}
                    options={false}
                    pagination={{ current: meta.page, pageSize: meta.pageSize, total: meta.total, showQuickJumper: true,
                        onChange: (nextPage: number, nextPageSize: number) => { setPage(nextPage); setPageSize(nextPageSize); } }}
                    scroll={{ x: "max-content" }}
                />
            )}

            <Modal
                title="Tạo ủy quyền"
                open={modalOpen}
                onCancel={() => setModalOpen(false)}
                width={560}
                centered
                destroyOnClose
                footer={[
                    <Button key="cancel" onClick={() => setModalOpen(false)}>
                        Hủy
                    </Button>,
                    <Button 
                        key="submit"
                        type="primary" 
                        loading={submitting}
                        onClick={() => form.submit()}
                    >
                        Lưu và kích hoạt
                    </Button>
                ]}
            >
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleSubmit}
                >
                    <Alert
                        type="info"
                        showIcon
                        message="Ủy quyền chỉ áp dụng cho hồ sơ thuộc công ty của người ủy quyền, trong thời gian hiệu lực. Mọi thao tác vẫn lưu rõ người ủy quyền và người thực hiện."
                        style={{ marginBottom: 16 }}
                    />
                    <UserSelectField
                        companyId={null}
                        selectedUserCount={assignorCount}
                        onCountChange={setAssignorCount}
                        isCrossCompany={true}
                        maxSelect={1}
                        name="assignorId"
                        label="Người ủy quyền"
                        emptyText="Chọn người ủy quyền..."
                        accentColor="#1677ff"
                        disabled={!isSuperAdmin}
                        rules={[{ required: true, message: "Chọn người ủy quyền" }]}
                    />

                    <div style={{ height: 16 }} />

                    <UserSelectField
                        companyId={null}
                        selectedUserCount={delegateCount}
                        onCountChange={setDelegateCount}
                        isCrossCompany={true}
                        maxSelect={1}
                        name="delegateId"
                        label="Người duyệt thay"
                        emptyText="Chọn người duyệt thay..."
                        accentColor="#1677ff"
                        rules={[
                            { required: true, message: "Vui lòng chọn người nhận ủy quyền" },
                            ({ getFieldValue }: any) => ({
                                validator(_: any, value: any) {
                                    const val = Array.isArray(value) ? value[0] : value;
                                    const assignorVal = Array.isArray(getFieldValue("assignorId")) ? getFieldValue("assignorId")[0] : getFieldValue("assignorId");
                                    if (!val || assignorVal !== val) {
                                        return Promise.resolve();
                                    }
                                    return Promise.reject(new Error("Người nhận ủy quyền không được trùng với người ủy quyền"));
                                },
                            }),
                        ]}
                    />

                    <div style={{ height: 16 }} />

                    <div style={{ display: "flex", gap: 12 }}>
                        <Form.Item
                            name="startDate"
                            label="Bắt đầu"
                            rules={[{ required: true }]}
                            style={{ flex: 1 }}
                        >
                            <DatePicker showTime format="DD/MM/YYYY HH:mm" style={{ width: "100%" }} />
                        </Form.Item>

                        <Form.Item
                            name="endDate"
                            label="Kết thúc"
                            rules={[
                                { required: true },
                                ({ getFieldValue }) => ({
                                    validator(_, value) {
                                        if (!value || !getFieldValue("startDate") || value.isAfter(getFieldValue("startDate"))) {
                                            return Promise.resolve();
                                        }
                                        return Promise.reject(new Error("Thời gian kết thúc phải sau thời gian bắt đầu"));
                                    },
                                }),
                            ]}
                            style={{ flex: 1 }}
                        >
                            <DatePicker showTime format="DD/MM/YYYY HH:mm" style={{ width: "100%" }} />
                        </Form.Item>
                    </div>

                    <Form.Item
                        name="reason"
                        label="Lý do ủy quyền"
                        rules={[{ required: true, message: "Vui lòng nhập lý do" }]}
                    >
                        <Input.TextArea rows={3} placeholder="VD: Đi công tác từ ngày X đến ngày Y." />
                    </Form.Item>
                </Form>
            </Modal>

            <Modal
                title={confirmModal?.title}
                open={!!confirmModal?.open}
                confirmLoading={confirmModal?.confirmLoading}
                onOk={async () => {
                    if (!confirmModal) return;
                    setConfirmModal(prev => prev ? { ...prev, confirmLoading: true } : null);
                    try {
                        await confirmModal.onOk();
                        setConfirmModal(null);
                    } catch (e) {
                        console.error(e);
                        setConfirmModal(prev => prev ? { ...prev, confirmLoading: false } : null);
                    }
                }}
                onCancel={() => setConfirmModal(null)}
                okText={confirmModal?.okText || "Xác nhận"}
                cancelText="Hủy"
                okButtonProps={{ 
                    danger: confirmModal?.okText === "Thu hồi",
                    loading: confirmModal?.confirmLoading
                }}
            >
                <div style={{ paddingBlock: 12 }}>
                    {confirmModal?.content}
                </div>
            </Modal>
        </PageContainer>
    );
};

export default DelegationsPage;
