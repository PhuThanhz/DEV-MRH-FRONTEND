import React, { useState } from "react";
import { 
    Button, Space, Tag, Form, Input, Select, Radio,
    DatePicker, Modal, Alert, Empty, Tooltip, Avatar, Divider, Card
} from "antd";
import { 
    PlusOutlined, CheckCircleOutlined, StopOutlined,
    UserSwitchOutlined, ClockCircleOutlined, CalendarOutlined,
    ArrowRightOutlined, HistoryOutlined, CommentOutlined,
    SafetyCertificateOutlined, FieldTimeOutlined, EyeOutlined,
    FileSearchOutlined, ApartmentOutlined, UserOutlined, AuditOutlined
} from "@ant-design/icons";
import type { ProColumns } from "@ant-design/pro-components";
import { useQueryClient } from "@tanstack/react-query";
import { notify } from "@/components/common/notification/notify";
import { callCreateDelegation } from "@/config/api";
import PageContainer from "@/components/common/data-table/PageContainer";
import DataTable from "@/components/common/data-table";
import SearchFilter from "@/components/common/filter/SearchFilter";
import AdvancedFilterSelect from "@/components/common/filter/AdvancedFilterSelect";
import LotusDetailDrawer from "@/components/common/drawer/LotusDetailDrawer";
import UserSelectField from "@/pages/admin/procedures/components/UserSelectField";
import { useAppSelector } from "@/redux/hooks";
import { useUsersQuery } from "@/hooks/useUsers";
import { useCompaniesQuery } from "@/hooks/useCompanies";
import { useDepartmentsByCompanyQuery, useDepartmentsQuery } from "@/hooks/useDepartments";
import { 
    useFetchDelegationsQuery,
    useActivateDelegationMutation,
    useRevokeDelegationMutation
} from "@/hooks/useAccountingDossiers";
import { formatDateTime } from "../accounting-dossiers/dossierUtils";
import { useResponsiveModalWidth } from "@/utils/responsive";
import { PAGINATION_CONFIG } from "@/config/pagination";
import dayjs from "dayjs";
import useAccess from "@/hooks/useAccess";
import { ALL_PERMISSIONS } from "@/config/permissions";
import ActionButton from "@/components/common/ui/ActionButton";
import { ACCOUNTING_WORKFLOW_STATUS_META } from "@/constants/statusMeta/accountingWorkflowMeta";

interface IDelegation {
    id: number;
    delegatorUserId: string;
    delegatorName?: string;
    delegatorEmail?: string;
    delegateUserId: string;
    delegateName?: string;
    delegateEmail?: string;
    companyId?: number;
    scopeType?: string;
    scopeRefId?: number;
    validFrom: string;
    validTo: string;
    reason?: string;
    status: "DRAFT" | "ACTIVE" | "REVOKED" | "EXPIRED";
    createdAt: string;
    createdBy?: string;
    revokedAt?: string;
    revokedBy?: string;
}

const AVATAR_GRADIENTS = [
    "linear-gradient(135deg, #1677ff 0%, #0958d9 100%)",
    "linear-gradient(135deg, #722ed1 0%, #531dab 100%)",
    "linear-gradient(135deg, #eb2f96 0%, #c41d7f 100%)",
    "linear-gradient(135deg, #fa8c16 0%, #d46b08 100%)",
    "linear-gradient(135deg, #13c2c2 0%, #08979c 100%)",
    "linear-gradient(135deg, #52c41a 0%, #389e0d 100%)",
];

const getAvatarStyle = (str: string) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const bg = AVATAR_GRADIENTS[Math.abs(hash) % AVATAR_GRADIENTS.length];
    return { background: bg, color: "#fff", fontWeight: 600, flexShrink: 0 };
};

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
    const [selectedCompanyId, setSelectedCompanyId] = useState<number | null>(null);
    const [scopeType, setScopeType] = useState<"COMPANY" | "DEPARTMENT">("COMPANY");
    const [viewDetailRecord, setViewDetailRecord] = useState<IDelegation | null>(null);

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
    const [companyFilter, setCompanyFilter] = useState<string | null>(null);
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(PAGINATION_CONFIG?.DEFAULT_PAGE_SIZE || 10);
    const [filterResetSignal, setFilterResetSignal] = useState(0);
    const currentUser = useAppSelector((state) => state.account.user);
    const isSuperAdmin = (currentUser.role?.name?.toUpperCase() || "") === "SUPER_ADMIN";

    // Fetch lists
    const delegationQuery = `page=${page}&size=${pageSize}${searchValue.trim() ? `&keyword=${encodeURIComponent(searchValue.trim())}` : ""}${statusFilter ? `&status=${statusFilter}` : ""}${companyFilter ? `&companyId=${companyFilter}` : ""}`;
    const { data: delegationData, isFetching, refetch } = useFetchDelegationsQuery(delegationQuery);
    const delegations = delegationData?.result || [];
    const meta = delegationData?.meta || { page, pageSize, total: 0 };
    const { data: userData } = useUsersQuery("size=1000");
    const users = userData?.result || [];
    const { data: companyData } = useCompaniesQuery("size=1000");
    const companies = companyData?.result || [];
    const { data: allDepartmentsData } = useDepartmentsQuery("size=1000");
    const allDepartments = allDepartmentsData?.result || [];
    const { data: companyDepartments = [] } = useDepartmentsByCompanyQuery(selectedCompanyId || 0);

    // Mutations
    const activateMutation = useActivateDelegationMutation();
    const revokeMutation = useRevokeDelegationMutation();

    const handleOpenCreate = () => {
        form.resetFields();
        const userCompId = (currentUser as any)?.company?.id || (companies.length > 0 ? companies[0].id : null);
        const initialCompId = userCompId ? Number(userCompId) : null;
        setSelectedCompanyId(initialCompId);
        setScopeType("COMPANY");
        form.setFieldsValue({
            companyId: initialCompId ? String(initialCompId) : undefined,
            scopeType: "COMPANY",
            departmentId: undefined,
            assignorId: currentUser.id ? [String(currentUser.id)] : [],
            delegateId: [],
            startDate: dayjs(),
            endDate: dayjs().add(7, "day")
        });
        setAssignorCount(currentUser.id ? 1 : 0);
        setDelegateCount(0);
        setModalOpen(true);
    };

    const handleSetPresetDuration = (days: number) => {
        const start = form.getFieldValue("startDate") || dayjs();
        form.setFieldsValue({
            startDate: start,
            endDate: dayjs(start).add(days, "day")
        });
    };

    const handleSubmit = async (values: any) => {
        setSubmitting(true);
        try {
            const compId = values.companyId ? Number(values.companyId) : selectedCompanyId;
            if (!compId) {
                throw new Error("Vui lòng chọn công ty áp dụng ủy quyền");
            }
            if (values.scopeType === "DEPARTMENT" && !values.departmentId) {
                throw new Error("Vui lòng chọn phòng ban áp dụng ủy quyền");
            }

            const payload = {
                delegatorUserId: Array.isArray(values.assignorId) ? values.assignorId[0] : values.assignorId,
                delegateUserId: Array.isArray(values.delegateId) ? values.delegateId[0] : values.delegateId,
                companyId: compId,
                scopeType: values.scopeType || "COMPANY",
                scopeRefId: values.scopeType === "DEPARTMENT" ? Number(values.departmentId) : compId,
                validFrom: values.startDate.toISOString(),
                validTo: values.endDate.toISOString(),
                reason: values.reason,
                activateImmediately: true,
            };
            
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

    const getEffectiveStatus = (delegation: IDelegation) => {
        if ((delegation.status === "ACTIVE" || delegation.status === "DRAFT")
            && dayjs(delegation.validTo).isBefore(dayjs())) return "EXPIRED";
        return delegation.status;
    };

    const filteredDelegations = delegations;

    const renderUserCell = (userId: string, defaultRoleLabel: string, record?: IDelegation, isDelegator?: boolean) => {
        const name = isDelegator ? record?.delegatorName : record?.delegateName;
        const u = users.find(item => String(item.id) === String(userId));
        const displayName = name || u?.name || u?.email || `User #${userId}`;

        const initial = displayName.charAt(0).toUpperCase();
        const avatarStyle = getAvatarStyle(displayName);

        return (
            <Space size={10} align="center">
                <Avatar size={34} style={avatarStyle}>
                    {initial}
                </Avatar>
                <span style={{ fontWeight: 600, color: "#111827", fontSize: 13 }}>{displayName}</span>
            </Space>
        );
    };

    const renderValidityCell = (entity: IDelegation) => {
        const now = dayjs();
        const from = dayjs(entity.validFrom);
        const to = dayjs(entity.validTo);
        const isExpired = to.isBefore(now);
        const isUpcoming = from.isAfter(now);
        const isActive = (entity.status === "ACTIVE" || entity.status === "DRAFT") && !isExpired && !isUpcoming;

        let timeTag = null;
        if (entity.status === "REVOKED") {
            timeTag = <Tag color="default" style={{ borderRadius: 6, margin: 0 }}>Đã thu hồi</Tag>;
        } else if (isExpired) {
            timeTag = <Tag color="default" style={{ borderRadius: 6, margin: 0 }}>Đã hết hạn</Tag>;
        } else if (isUpcoming) {
            const hoursLeft = from.diff(now, "hour");
            const daysLeft = from.diff(now, "day");
            const badgeText = daysLeft > 0 ? `Bắt đầu sau ${daysLeft} ngày` : `Bắt đầu sau ${hoursLeft} giờ`;
            timeTag = <Tag color="processing" icon={<ClockCircleOutlined />} style={{ borderRadius: 6, margin: 0 }}>{badgeText}</Tag>;
        } else if (isActive) {
            const daysLeft = to.diff(now, "day");
            const hoursLeft = to.diff(now, "hour");
            const badgeText = daysLeft > 0 ? `Còn ${daysLeft} ngày` : `Còn ${hoursLeft} giờ`;
            timeTag = <Tag color="success" icon={<FieldTimeOutlined />} style={{ borderRadius: 6, margin: 0 }}>{badgeText}</Tag>;
        }

        return (
            <div style={{ display: "flex", flexDirection: "column", gap: 3, fontSize: 12 }}>
                <div style={{ color: "#374151", fontWeight: 500 }}>
                    {formatDateTime(entity.validFrom)} → {formatDateTime(entity.validTo)}
                </div>
                {timeTag && <div>{timeTag}</div>}
            </div>
        );
    };

    const getScopeLabel = (entity: IDelegation) => {
        const c = companies.find((item) => String(item.id) === String(entity.companyId));
        const companyName = c ? c.name : (entity.companyId ? `Công ty #${entity.companyId}` : "Toàn hệ thống");

        if (entity.scopeType === "DEPARTMENT" && entity.scopeRefId) {
            const dept = allDepartments.find((d) => Number(d.id) === Number(entity.scopeRefId));
            return (
                <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.3 }}>
                    <span style={{ fontWeight: 600, color: "#1f2937", fontSize: 13 }}>{companyName}</span>
                    <span style={{ color: "#2563eb", fontSize: 12, display: "flex", alignItems: "center", gap: 4, marginTop: 2 }}>
                        <ApartmentOutlined /> {dept ? dept.name : `Phòng ban #${entity.scopeRefId}`}
                    </span>
                </div>
            );
        }

        return (
            <span style={{ fontWeight: 600, color: "#1f2937", fontSize: 13 }}>
                {companyName}
            </span>
        );
    };

    const columns: ProColumns<IDelegation>[] = [
        {
            title: "Công ty áp dụng",
            dataIndex: "companyId",
            key: "companyId",
            width: 220,
            render: (dom, entity) => getScopeLabel(entity)
        },
        {
            title: "Người ủy quyền",
            dataIndex: "delegatorUserId",
            key: "delegatorUserId",
            width: 200,
            render: (dom, entity) => renderUserCell(entity.delegatorUserId, "Người ủy quyền", entity, true)
        },
        {
            title: "Chuyển quyền",
            key: "direction",
            width: 60,
            align: "center",
            render: () => (
                <div style={{
                    width: 28,
                    height: 28,
                    borderRadius: "50%",
                    background: "#f0f5ff",
                    color: "#2563eb",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.06)"
                }}>
                    <ArrowRightOutlined style={{ fontSize: 13 }} />
                </div>
            )
        },
        {
            title: "Người nhận ủy quyền",
            dataIndex: "delegateUserId",
            key: "delegateUserId",
            width: 200,
            render: (dom, entity) => renderUserCell(entity.delegateUserId, "Người nhận ủy quyền", entity, false)
        },
        {
            title: "Hiệu lực",
            key: "validity",
            width: 220,
            render: (dom, entity) => renderValidityCell(entity)
        },
        {
            title: "Trạng thái",
            dataIndex: "status",
            key: "status",
            width: 130,
            align: "center" as const,
            render: (dom, entity) => {
                const effectiveStatus = getEffectiveStatus(entity);
                if (effectiveStatus === "EXPIRED") {
                    return (
                        <Tag icon={<HistoryOutlined />} color={ACCOUNTING_WORKFLOW_STATUS_META.EXPIRED.color} style={{ borderRadius: 6, padding: "2px 8px" }}>
                            {ACCOUNTING_WORKFLOW_STATUS_META.EXPIRED.label}
                        </Tag>
                    );
                }
                if (effectiveStatus === "ACTIVE" && dayjs(entity.validFrom).isAfter(dayjs())) {
                    return (
                        <Tag icon={<ClockCircleOutlined />} color="processing" style={{ borderRadius: 6, padding: "2px 8px" }}>
                            Sắp hiệu lực
                        </Tag>
                    );
                }
                if (effectiveStatus === "ACTIVE") {
                    return (
                        <Tag icon={<CheckCircleOutlined />} color={ACCOUNTING_WORKFLOW_STATUS_META.ACTIVE.color} style={{ borderRadius: 6, padding: "2px 8px" }}>
                            {ACCOUNTING_WORKFLOW_STATUS_META.ACTIVE.label}
                        </Tag>
                    );
                }
                if (entity.status === "REVOKED") {
                    return (
                        <Tag icon={<StopOutlined />} color={ACCOUNTING_WORKFLOW_STATUS_META.REVOKED.color} style={{ borderRadius: 6, padding: "2px 8px" }}>
                            {ACCOUNTING_WORKFLOW_STATUS_META.REVOKED.label}
                        </Tag>
                    );
                }
                return (
                    <Tag color={ACCOUNTING_WORKFLOW_STATUS_META.DRAFT.color} style={{ borderRadius: 6, padding: "2px 8px" }}>
                        {ACCOUNTING_WORKFLOW_STATUS_META.DRAFT.label}
                    </Tag>
                );
            }
        },
        {
            title: "Hành động",
            key: "actions",
            width: 120,
            align: "center" as const,
            fixed: "right" as const,
            render: (dom, entity) => {
                const effectiveStatus = getEffectiveStatus(entity);
                const canActivateDelegation = effectiveStatus === "DRAFT" && canActivate;
                const canRevokeDelegation = effectiveStatus === "ACTIVE" && canRevoke;

                return (
                    <Space size={4}>
                        <ActionButton
                            variant="view"
                            tooltip="Xem chi tiết"
                            aria-label="Xem chi tiết"
                            icon={<EyeOutlined />}
                            onClick={(e) => {
                                e.stopPropagation();
                                setViewDetailRecord(entity);
                            }}
                        />
                        {canActivateDelegation && (
                            <ActionButton
                                variant="success"
                                tooltip="Kích hoạt ủy quyền"
                                aria-label="Kích hoạt ủy quyền"
                                icon={<CheckCircleOutlined />}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleActivate(entity.id);
                                }}
                            />
                        )}
                        {canRevokeDelegation && (
                            <ActionButton
                                variant="danger"
                                tooltip="Thu hồi ủy quyền ngay"
                                aria-label="Thu hồi ủy quyền"
                                icon={<StopOutlined />}
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
            title="Ủy quyền phê duyệt Kế toán & Tài chính"
            filter={
                <div style={{ display: "grid", gap: 12 }}>
                    <SearchFilter
                        searchPlaceholder="Tìm người ủy quyền, người nhận hoặc lý do..."
                        showFilterButton={false}
                        addLabel={canCreate ? "Tạo ủy quyền" : undefined}
                        onAddClick={canCreate ? handleOpenCreate : undefined}
                        onSearch={(value) => { setPage(1); setSearchValue(value); }}
                        onReset={() => {
                            setSearchValue("");
                            setStatusFilter(null);
                            setCompanyFilter(null);
                            setPage(1);
                            setFilterResetSignal((current) => current + 1);
                            refetch();
                        }}
                    />
                    <AdvancedFilterSelect
                        resetSignal={filterResetSignal}
                        fields={[
                            {
                                key: "companyId",
                                label: "Công ty",
                                options: companies.map((c) => ({
                                    label: c.name,
                                    value: String(c.id),
                                })),
                            },
                            {
                                key: "status",
                                label: "Trạng thái",
                                options: (["DRAFT", "ACTIVE", "REVOKED", "EXPIRED"] as const).map((value) => ({
                                    label: ACCOUNTING_WORKFLOW_STATUS_META[value].label,
                                    value,
                                    color: ACCOUNTING_WORKFLOW_STATUS_META[value].color,
                                })),
                            },
                        ]}
                        onChange={(filters) => { 
                            setPage(1); 
                            setStatusFilter(filters.status ?? null); 
                            setCompanyFilter(filters.companyId ?? null);
                        }}
                    />
                </div>
            }
        >
            {filteredDelegations.length === 0 && !isFetching ? (
                <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description={delegations.length ? "Không có ủy quyền nào khớp bộ lọc hiện tại" : "Chưa có ủy quyền phê duyệt nào"}
                    style={{ padding: "48px 0", background: "#fff", borderRadius: 12, border: "1px solid #edf0f5" }}
                >
                    {delegations.length ? (
                        <Button type="link" onClick={() => { setSearchValue(""); setStatusFilter(null); setCompanyFilter(null); setFilterResetSignal((current) => current + 1); }}>Xóa bộ lọc</Button>
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
                    onRow={(record) => ({
                        onClick: () => setViewDetailRecord(record),
                        style: { cursor: "pointer" }
                    })}
                    pagination={{ 
                        current: meta.page, 
                        pageSize: meta.pageSize, 
                        total: meta.total, 
                        showQuickJumper: true,
                        onChange: (nextPage: number, nextPageSize: number) => { setPage(nextPage); setPageSize(nextPageSize); } 
                    }}
                    scroll={{ x: "max-content" }}
                />
            )}

            {/* Create Delegation Drawer */}
            <LotusDetailDrawer
                open={modalOpen}
                onClose={() => setModalOpen(false)}
                destroyOnClose={true}
            >
                <div className="flex flex-col h-full bg-white rounded-t-3xl overflow-hidden">
                    {/* Drawer Header */}
                    <div className="px-7 py-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-50/80 via-white to-white shrink-0">
                        <div className="flex items-center gap-3.5">
                            <div className="w-11 h-11 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center text-xl font-semibold shadow-2xs">
                                <UserSwitchOutlined />
                            </div>
                            <div>
                                <h2 className="text-base font-bold text-slate-800 m-0">Tạo ủy quyền phê duyệt</h2>
                                <p className="text-xs text-slate-500 m-0 mt-0.5">Ủy quyền thẩm quyền phê duyệt chứng từ Kế toán & Tài chính theo từng Công ty & Phòng ban</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 pr-8">
                            <Button onClick={() => setModalOpen(false)}>
                                Hủy
                            </Button>
                            <Button 
                                type="primary" 
                                loading={submitting}
                                onClick={() => form.submit()}
                                icon={<CheckCircleOutlined />}
                            >
                                Lưu và kích hoạt
                            </Button>
                        </div>
                    </div>

                    {/* Drawer Form Body */}
                    <div className="flex-1 overflow-y-auto px-7 py-6">
                        <Form
                            form={form}
                            layout="vertical"
                            onFinish={handleSubmit}
                        >
                            <Alert
                                type="info"
                                showIcon
                                icon={<SafetyCertificateOutlined style={{ color: "#1677ff" }} />}
                                message="Ủy quyền quyền phê duyệt chứng từ theo Công ty & Phòng ban"
                                description="Phạm vi ủy quyền gắn liền với Công ty và Phạm vi được chọn. Người nhận ủy quyền chỉ được phép duyệt các chứng từ Kế toán & Tài chính thuộc đúng phạm vi đó trong thời gian hiệu lực."
                                style={{ marginBottom: 20, borderRadius: 10 }}
                            />
                            
                            <Form.Item
                                name="companyId"
                                label="Công ty áp dụng ủy quyền"
                                rules={[{ required: true, message: "Vui lòng chọn công ty áp dụng ủy quyền" }]}
                            >
                                <Select
                                    placeholder="Chọn công ty áp dụng..."
                                    options={companies.map((c) => ({
                                        label: `${c.name} (${c.code || "CTY"})`,
                                        value: String(c.id),
                                    }))}
                                    onChange={(val) => {
                                        const newId = val ? Number(val) : null;
                                        setSelectedCompanyId(newId);
                                        form.setFieldsValue({ departmentId: undefined, delegateId: [] });
                                        setDelegateCount(0);
                                    }}
                                    showSearch
                                    optionFilterProp="label"
                                    size="large"
                                />
                            </Form.Item>

                            <div style={{ height: 8 }} />

                            <Form.Item
                                name="scopeType"
                                label="Phạm vi ủy quyền"
                                rules={[{ required: true }]}
                            >
                                <Radio.Group
                                    onChange={(e) => {
                                        setScopeType(e.target.value);
                                        if (e.target.value === "COMPANY") {
                                            form.setFieldsValue({ departmentId: undefined });
                                        }
                                    }}
                                    value={scopeType}
                                >
                                    <Radio value="COMPANY">Toàn công ty</Radio>
                                    <Radio value="DEPARTMENT">Phòng ban cụ thể</Radio>
                                </Radio.Group>
                            </Form.Item>

                            {scopeType === "DEPARTMENT" && (
                                <Form.Item
                                    name="departmentId"
                                    label="Phòng ban áp dụng"
                                    rules={[{ required: true, message: "Vui lòng chọn phòng ban áp dụng ủy quyền" }]}
                                >
                                    <Select
                                        placeholder="Chọn phòng ban..."
                                        options={companyDepartments.map((d) => ({
                                            label: d.name,
                                            value: Number(d.id),
                                        }))}
                                        showSearch
                                        optionFilterProp="label"
                                        size="large"
                                    />
                                </Form.Item>
                            )}

                            <div style={{ height: 8 }} />

                            <UserSelectField
                                companyId={selectedCompanyId}
                                selectedUserCount={assignorCount}
                                onCountChange={setAssignorCount}
                                isCrossCompany={isSuperAdmin}
                                maxSelect={1}
                                name="assignorId"
                                label="Người ủy quyền (Giao quyền)"
                                emptyText="Chọn người ủy quyền..."
                                accentColor="#1677ff"
                                disabled={!isSuperAdmin}
                                rules={[{ required: true, message: "Vui lòng chọn người ủy quyền" }]}
                            />

                            <div style={{ height: 16 }} />

                            <UserSelectField
                                companyId={selectedCompanyId}
                                selectedUserCount={delegateCount}
                                onCountChange={setDelegateCount}
                                isCrossCompany={false}
                                maxSelect={1}
                                name="delegateId"
                                label="Người nhận ủy quyền (Nội bộ công ty đã chọn)"
                                emptyText={selectedCompanyId ? "Chọn người nhận ủy quyền trong công ty..." : "Vui lòng chọn công ty trước"}
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

                            <div style={{ height: 20 }} />

                            {/* Quick Duration Shortcuts */}
                            <div style={{ marginBottom: 12, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                <span style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>Thời gian hiệu lực</span>
                                <Space size={6}>
                                    <span style={{ fontSize: 12, color: "#6b7280" }}>Chọn nhanh:</span>
                                    <Button size="small" type="dashed" onClick={() => handleSetPresetDuration(7)}>7 ngày</Button>
                                    <Button size="small" type="dashed" onClick={() => handleSetPresetDuration(14)}>14 ngày</Button>
                                    <Button size="small" type="dashed" onClick={() => handleSetPresetDuration(30)}>30 ngày</Button>
                                </Space>
                            </div>

                            <div style={{ display: "flex", gap: 12 }}>
                                <Form.Item
                                    name="startDate"
                                    label="Thời điểm bắt đầu"
                                    rules={[{ required: true, message: "Chọn ngày bắt đầu" }]}
                                    style={{ flex: 1 }}
                                >
                                    <DatePicker showTime format="DD/MM/YYYY HH:mm" style={{ width: "100%" }} size="large" />
                                </Form.Item>

                                <Form.Item
                                    name="endDate"
                                    label="Thời điểm kết thúc"
                                    rules={[
                                        { required: true, message: "Chọn ngày kết thúc" },
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
                                    <DatePicker showTime format="DD/MM/YYYY HH:mm" style={{ width: "100%" }} size="large" />
                                </Form.Item>
                            </div>

                            <Form.Item
                                name="reason"
                                label="Lý do ủy quyền"
                                rules={[{ required: true, message: "Vui lòng nhập lý do ủy quyền" }]}
                            >
                                <Input.TextArea rows={3} placeholder="VD: Trưởng phòng đi công tác tác nghiệp từ ngày X đến ngày Y..." />
                            </Form.Item>
                        </Form>
                    </div>
                </div>
            </LotusDetailDrawer>

            {/* View Delegation Detail Drawer */}
            <LotusDetailDrawer
                open={!!viewDetailRecord}
                onClose={() => setViewDetailRecord(null)}
                destroyOnClose={true}
            >
                {viewDetailRecord && (() => {
                    const rec = viewDetailRecord;
                    const c = companies.find((item) => String(item.id) === String(rec.companyId));
                    const companyName = c ? c.name : (rec.companyId ? `Công ty #${rec.companyId}` : "Toàn công ty");
                    const dept = rec.scopeType === "DEPARTMENT" && rec.scopeRefId
                        ? allDepartments.find((d) => Number(d.id) === Number(rec.scopeRefId))
                        : null;
                    
                    const delegatorUser = users.find((u) => String(u.id) === String(rec.delegatorUserId));
                    const delegateUser = users.find((u) => String(u.id) === String(rec.delegateUserId));
                    
                    const delegatorName = rec.delegatorName || delegatorUser?.name || delegatorUser?.email || `User #${rec.delegatorUserId}`;
                    const delegateName = rec.delegateName || delegateUser?.name || delegateUser?.email || `User #${rec.delegateUserId}`;
                    
                    const effectiveStatus = getEffectiveStatus(rec);
                    const canAct = effectiveStatus === "DRAFT" && canActivate;
                    const canRev = effectiveStatus === "ACTIVE" && canRevoke;

                    const creatorUser = rec.createdBy ? users.find((u) => u.email === rec.createdBy || String(u.id) === String(rec.createdBy)) : null;
                    const revokerUser = rec.revokedBy ? users.find((u) => u.email === rec.revokedBy || String(u.id) === String(rec.revokedBy)) : null;

                    return (
                        <div className="flex flex-col h-full bg-slate-50/50 rounded-t-3xl overflow-hidden">
                            {/* Detail Header */}
                            <div className="px-7 py-5 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
                                <div className="flex items-center gap-3.5">
                                    <div className="w-11 h-11 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-xl font-semibold shadow-2xs">
                                        <FileSearchOutlined />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h2 className="text-base font-bold text-slate-800 m-0">Chi tiết ủy quyền phê duyệt</h2>
                                            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 font-mono">#{rec.id}</span>
                                        </div>
                                        <p className="text-xs text-slate-500 m-0 mt-0.5">Mã số ủy quyền #{rec.id} • Thẩm quyền chứng từ Kế toán & Tài chính</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 pr-8">
                                    {canAct && (
                                        <Button
                                            type="primary"
                                            icon={<CheckCircleOutlined />}
                                            onClick={() => {
                                                const id = rec.id;
                                                setViewDetailRecord(null);
                                                handleActivate(id);
                                            }}
                                        >
                                            Kích hoạt ủy quyền
                                        </Button>
                                    )}
                                    {canRev && (
                                        <Button
                                            danger
                                            icon={<StopOutlined />}
                                            onClick={() => {
                                                const id = rec.id;
                                                setViewDetailRecord(null);
                                                handleRevoke(id);
                                            }}
                                        >
                                            Thu hồi ủy quyền
                                        </Button>
                                    )}
                                </div>
                            </div>

                            {/* Detail Content Body */}
                            <div className="flex-1 overflow-y-auto px-7 py-6 space-y-6">
                                {/* Flow Visualization Card */}
                                <Card bodyStyle={{ padding: "20px 24px" }} style={{ borderRadius: 16, border: "1px solid #e2e8f0", boxShadow: "0 2px 8px rgba(0,0,0,0.02)" }}>
                                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
                                        {/* Delegator User Card */}
                                        <div style={{ flex: 1, padding: 14, borderRadius: 12, background: "#f8fafc", border: "1px solid #f1f5f9" }}>
                                            <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: "#64748b", marginBottom: 8 }}>
                                                Giao quyền (Người ủy quyền)
                                            </div>
                                            {renderUserCell(rec.delegatorUserId, "Người ủy quyền", rec, true)}
                                        </div>

                                        {/* Center Arrow */}
                                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                                            <div style={{
                                                width: 36, height: 36, borderRadius: "50%",
                                                background: "#eff6ff", color: "#2563eb",
                                                display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16
                                            }}>
                                                <ArrowRightOutlined />
                                            </div>
                                            <Tag color={effectiveStatus === "ACTIVE" ? "success" : effectiveStatus === "EXPIRED" ? "default" : "processing"} style={{ margin: 0, borderRadius: 6 }}>
                                                {ACCOUNTING_WORKFLOW_STATUS_META[effectiveStatus]?.label || effectiveStatus}
                                            </Tag>
                                        </div>

                                        {/* Delegate User Card */}
                                        <div style={{ flex: 1, padding: 14, borderRadius: 12, background: "#f8fafc", border: "1px solid #f1f5f9" }}>
                                            <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: "#64748b", marginBottom: 8 }}>
                                                Duyệt thay (Người nhận ủy quyền)
                                            </div>
                                            {renderUserCell(rec.delegateUserId, "Người nhận ủy quyền", rec, false)}
                                        </div>
                                    </div>
                                </Card>

                                {/* Grid: Scope & Validity */}
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                                    <Card title={<Space><AuditOutlined style={{ color: "#2563eb" }} /> <span style={{ fontSize: 14, fontWeight: 650 }}>Phạm vi áp dụng</span></Space>} style={{ borderRadius: 14, border: "1px solid #e2e8f0" }}>
                                        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                                            <div>
                                                <div style={{ fontSize: 12, color: "#64748b" }}>Công ty áp dụng:</div>
                                                <div style={{ fontSize: 14, fontWeight: 600, color: "#0f172a", marginTop: 2 }}>{companyName}</div>
                                            </div>
                                            <div>
                                                <div style={{ fontSize: 12, color: "#64748b" }}>Phạm vi thẩm quyền:</div>
                                                <div style={{ fontSize: 13, fontWeight: 600, color: dept ? "#2563eb" : "#059669", marginTop: 2, display: "flex", alignItems: "center", gap: 6 }}>
                                                    {dept ? <><ApartmentOutlined /> Phòng ban: {dept.name}</> : "Toàn bộ công ty"}
                                                </div>
                                            </div>
                                        </div>
                                    </Card>

                                    <Card title={<Space><CalendarOutlined style={{ color: "#059669" }} /> <span style={{ fontSize: 14, fontWeight: 650 }}>Thời gian hiệu lực</span></Space>} style={{ borderRadius: 14, border: "1px solid #e2e8f0" }}>
                                        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                                            <div style={{ fontSize: 13, color: "#334155" }}>
                                                <strong>Bắt đầu:</strong> {formatDateTime(rec.validFrom)}
                                            </div>
                                            <div style={{ fontSize: 13, color: "#334155" }}>
                                                <strong>Kết thúc:</strong> {formatDateTime(rec.validTo)}
                                            </div>
                                            <div style={{ marginTop: 4 }}>
                                                {renderValidityCell(rec)}
                                            </div>
                                        </div>
                                    </Card>
                                </div>

                                {/* Delegation Reason */}
                                <Card title={<Space><CommentOutlined style={{ color: "#d97706" }} /> <span style={{ fontSize: 14, fontWeight: 650 }}>Lý do ủy quyền</span></Space>} style={{ borderRadius: 14, border: "1px solid #e2e8f0" }}>
                                    <div style={{ fontSize: 14, color: "#1e293b", background: "#f8fafc", padding: 14, borderRadius: 10, borderLeft: "4px solid #3b82f6", lineHeight: 1.6 }}>
                                        {rec.reason || "Không ghi chú lý do"}
                                    </div>
                                </Card>

                                {/* Audit Trail & History Logs */}
                                <Card title={<Space><HistoryOutlined style={{ color: "#64748b" }} /> <span style={{ fontSize: 14, fontWeight: 650 }}>Nhật ký khởi tạo & Thao tác</span></Space>} style={{ borderRadius: 14, border: "1px solid #e2e8f0" }}>
                                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, fontSize: 13 }}>
                                        <div style={{ background: "#f8fafc", padding: 12, borderRadius: 10 }}>
                                            <div style={{ fontSize: 11, color: "#64748b", textTransform: "uppercase", fontWeight: 700, marginBottom: 4 }}>Khởi tạo ủy quyền</div>
                                            <div style={{ fontWeight: 600, color: "#0f172a" }}>
                                                {creatorUser?.name || rec.createdBy || rec.delegatorName || "Hệ thống"}
                                            </div>
                                            <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>
                                                Vào lúc: {rec.createdAt ? formatDateTime(rec.createdAt) : "N/A"}
                                            </div>
                                        </div>

                                        {rec.status === "REVOKED" ? (
                                            <div style={{ background: "#fef2f2", padding: 12, borderRadius: 10 }}>
                                                <div style={{ fontSize: 11, color: "#991b1b", textTransform: "uppercase", fontWeight: 700, marginBottom: 4 }}>Thu hồi ủy quyền</div>
                                                <div style={{ fontWeight: 600, color: "#7f1d1d" }}>
                                                    {revokerUser?.name || rec.revokedBy || "N/A"}
                                                </div>
                                                <div style={{ fontSize: 12, color: "#991b1b", marginTop: 2 }}>
                                                    Vào lúc: {rec.revokedAt ? formatDateTime(rec.revokedAt) : "N/A"}
                                                </div>
                                            </div>
                                        ) : (
                                            <div style={{ background: "#f8fafc", padding: 12, borderRadius: 10 }}>
                                                <div style={{ fontSize: 11, color: "#64748b", textTransform: "uppercase", fontWeight: 700, marginBottom: 4 }}>Trạng thái hiện tại</div>
                                                <div style={{ fontWeight: 600, color: "#0f172a" }}>
                                                    {ACCOUNTING_WORKFLOW_STATUS_META[effectiveStatus]?.label || effectiveStatus}
                                                </div>
                                                <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>
                                                    Không có thu hồi thủ công
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </Card>
                            </div>
                        </div>
                    );
                })()}
            </LotusDetailDrawer>

            {/* Confirm Action Modal */}
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
                <div style={{ paddingBlock: 12, fontSize: 14, color: "#374151" }}>
                    {confirmModal?.content}
                </div>
            </Modal>
        </PageContainer>
    );
};

export default DelegationsPage;
