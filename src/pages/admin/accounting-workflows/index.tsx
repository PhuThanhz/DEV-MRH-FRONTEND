import React, { useState, useEffect, useMemo } from "react";
import { 
    Button, Space, Tag, Form, Input, InputNumber, 
    Select, Switch, Card, Modal, Alert, Divider, Popconfirm, Empty, DatePicker
} from "antd";
import {
    PlusOutlined, EditOutlined, CheckCircleOutlined,
    StopOutlined, FileSearchOutlined, DeleteOutlined, ApartmentOutlined, BankOutlined, CopyOutlined, RedoOutlined,
    EyeOutlined
} from "@ant-design/icons";
import type { ProColumns } from "@ant-design/pro-components";
import PageContainer from "@/components/common/data-table/PageContainer";
import DataTable from "@/components/common/data-table";
import SearchFilter from "@/components/common/filter/SearchFilter";
import AdvancedFilterSelect from "@/components/common/filter/AdvancedFilterSelect";
import { callFetchAccountingDossierCategories, callFetchCompany } from "@/config/api";
import { useDepartmentsQuery } from "@/hooks/useDepartments";
import { useUsersQuery } from "@/hooks/useUsers";
import { useJobTitlesQuery } from "@/hooks/useJobTitles";
import { usePositionLevelsQuery } from "@/hooks/usePositionLevels";
import { useCompaniesQuery } from "@/hooks/useCompanies";
import { 
    useFetchWorkflowTemplatesQuery,
    useCreateWorkflowTemplateMutation,
    useUpdateWorkflowTemplateDraftMutation,
    usePublishWorkflowTemplateMutation,
    useDeactivateWorkflowTemplateMutation,
    useReactivateWorkflowTemplateMutation,
    useCopyWorkflowTemplateToDraftMutation
} from "@/hooks/useAccountingDossiers";
import { callValidateWorkflowTemplate } from "@/config/api";
import { PAGINATION_CONFIG } from "@/config/pagination";
import { notify } from "@/components/common/notification/notify";
import useAccess from "@/hooks/useAccess";
import { ALL_PERMISSIONS } from "@/config/permissions";
import dayjs from "dayjs";

interface IWorkflowTemplate {
    id: number;
    code: string;
    name: string;
    companyId: number;
    priority: number;
    version?: number;
    dossierCategoryId?: number;
    defaultTemplate: boolean;
    status: "DRAFT" | "ACTIVE" | "INACTIVE";
    effectiveFrom?: string;
    effectiveTo?: string;
    scopes: any[];
    steps: any[];
}

const STATUS_META = {
    ACTIVE: { color: "success", label: "Đang dùng" },
    INACTIVE: { color: "default", label: "Ngưng dùng" },
    DRAFT: { color: "warning", label: "Nháp" },
};

const STRATEGY_LABEL: Record<string, string> = {
    REQUESTER_MANAGER: "Quản lý trực tiếp của người lập",
    COMPANY_ROLE: "Nhóm xử lý theo vai trò",
    COMPANY_DIRECTOR: "Giám đốc công ty",
    SPECIFIC_USER: "Chọn cố định một người",
    USER_SELECTABLE: "Người lập tự chọn người duyệt khi gửi hồ sơ",
    POSITION: "Theo chức danh / cấp bậc",
};

const STRATEGY_OPTIONS = Object.entries(STRATEGY_LABEL).map(([value, label]) => ({
    value,
    label,
    disabled: false,
}));

const ACCOUNTANT_PERMISSION = "Phê duyệt bộ chứng từ kế toán - Kế toán";
const CHIEF_ACCOUNTANT_PERMISSION = "Phê duyệt bộ chứng từ kế toán - Kế toán trưởng";
const ACCENT = "#e8637a";
const ACCENT_HOVER = "#d4506a";
const ACCENT_LIGHT = "#fff0f3";
const ACCENT_BORDER = "#ffd6dd";

const WORKFLOW_FORM_TABS = [
    { key: "general", label: "Thông tin & phạm vi" },
    { key: "steps", label: "Bước duyệt" },
] as const;

const APPLY_MODE_OPTIONS = [
    {
        value: "COMPANY",
        label: "Toàn công ty",
        description: "Áp dụng cho công ty đã chọn",
        icon: <BankOutlined />
    },
    {
        value: "DEPARTMENTS",
        label: "Một số phòng ban",
        description: "Chọn phạm vi phòng ban riêng",
        icon: <ApartmentOutlined />
    }
] as const;

const GENERAL_FORM_FIELDS = ["code", "name", "companyId", "applyMode", "departmentScopeIds", "effectiveFrom", "effectiveTo"];

const normalizeRoleName = (value?: string) =>
    (value || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/\s+/g, "")
        .toUpperCase();

const getRoleMatchedUsers = (users: any[], permissionName?: string) => {
    if (!permissionName) return [];
    return users.filter((user) => {
        const roleName = normalizeRoleName(user?.role?.name);
        if (permissionName === CHIEF_ACCOUNTANT_PERMISSION) {
            return roleName.includes("KETOANTRUONG") || roleName.includes("CHIEFACCOUNTANT");
        }
        if (permissionName === ACCOUNTANT_PERMISSION) {
            return (roleName.includes("KETOAN") || roleName.includes("ACCOUNTANT"))
                && !roleName.includes("KETOANTRUONG")
                && !roleName.includes("CHIEFACCOUNTANT");
        }
        return false;
    });
};

const formatSla = (minutes?: number) => {
    if (!minutes) return "Chưa đặt";
    if (minutes % 1440 === 0) return `${minutes / 1440} ngày`;
    if (minutes % 60 === 0) return `${minutes / 60} giờ`;
    return `${minutes} phút`;
};

const inferStepKey = (step: any) => {
    if (step.approverStrategy === "REQUESTER_MANAGER") return "REQUESTER_MANAGER";
    if (step.approverStrategy === "COMPANY_DIRECTOR") return "DIRECTOR";
    if (step.approverStrategy === "COMPANY_ROLE") {
        return step.approverRefId?.includes("Kế toán trưởng") ? "CHIEF_ACCOUNTANT" : "ACCOUNTANT";
    }
    return step.stepKey || "CUSTOM_STEP";
};

const WorkflowTemplatesPage = () => {
    const [form] = Form.useForm();
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [editingRecord, setEditingRecord] = useState<IWorkflowTemplate | null>(null);
    const [viewingRecord, setViewingRecord] = useState<IWorkflowTemplate | null>(null);
    const [referenceDataRequested, setReferenceDataRequested] = useState(false);
    const { data: companiesData } = useCompaniesQuery("page=1&size=200&sort=name,asc");
    const companies = companiesData?.result || [];
    const [dossierCategories, setDossierCategories] = useState<any[]>([]);
    const [activeWorkflowTab, setActiveWorkflowTab] = useState("general");
    const [activeStepIndex, setActiveStepIndex] = useState(0);
    const [validatingTemplateId, setValidatingTemplateId] = useState<number | null>(null);
    const [validationResult, setValidationResult] = useState<{ templateId: number; errors: string[] } | null>(null);
    const canCreateDraft = useAccess(ALL_PERMISSIONS.ACCOUNTING_WORKFLOWS.CREATE_DRAFT);
    const canUpdateDraft = useAccess(ALL_PERMISSIONS.ACCOUNTING_WORKFLOWS.UPDATE_DRAFT);
    const canValidate = useAccess(ALL_PERMISSIONS.ACCOUNTING_WORKFLOWS.VALIDATE);
    const canPublish = useAccess(ALL_PERMISSIONS.ACCOUNTING_WORKFLOWS.PUBLISH);
    const canDeactivate = useAccess(ALL_PERMISSIONS.ACCOUNTING_WORKFLOWS.DEACTIVATE);
    const canReactivate = useAccess(ALL_PERMISSIONS.ACCOUNTING_WORKFLOWS.REACTIVATE);
    const canCopyDraft = useAccess(ALL_PERMISSIONS.ACCOUNTING_WORKFLOWS.COPY_DRAFT);

    // Search and filters state
    const [searchValue, setSearchValue] = useState("");
    const [statusFilter, setStatusFilter] = useState<string | null>(null);
    const [companyFilter, setCompanyFilter] = useState<number | null>(null);
    const [filterResetSignal, setFilterResetSignal] = useState(0);

    // Fetch lists
    const { data: templates = [], isFetching, refetch } = useFetchWorkflowTemplatesQuery();
    // Chỉ lấy các danh mục lớn khi người dùng sắp thao tác với form hoặc xem cấu hình chi tiết.
    const shouldLoadReferenceData = drawerOpen || !!viewingRecord || referenceDataRequested;
    const { data: deptData } = useDepartmentsQuery("size=1000", shouldLoadReferenceData);
    const { data: userData } = useUsersQuery("size=1000", shouldLoadReferenceData);
    const { data: jobTitleData } = useJobTitlesQuery("size=1000", shouldLoadReferenceData);
    const { data: positionLevelData } = usePositionLevelsQuery("size=1000", shouldLoadReferenceData);

    const departments = deptData?.result || [];
    const users = userData?.result || [];
    const jobTitles = jobTitleData?.result || [];
    const positionLevels = positionLevelData?.result || [];

    // Mutations
    const createMutation = useCreateWorkflowTemplateMutation();
    const updateMutation = useUpdateWorkflowTemplateDraftMutation();
    const publishMutation = usePublishWorkflowTemplateMutation();
    const deactivateMutation = useDeactivateWorkflowTemplateMutation();
    const reactivateMutation = useReactivateWorkflowTemplateMutation();
    const copyToDraftMutation = useCopyWorkflowTemplateToDraftMutation();



    useEffect(() => {
        if (!shouldLoadReferenceData) return;
        callFetchAccountingDossierCategories("page=1&size=1000")
            .then((res: any) => setDossierCategories(res?.data?.result || []))
            .catch(() => setDossierCategories([]));
    }, [shouldLoadReferenceData]);

    // Filter templates locally
    const filteredTemplates = useMemo(() => {
        return templates.filter((item) => {
            const matchesSearch = !searchValue || 
                item.code.toLowerCase().includes(searchValue.toLowerCase()) || 
                item.name.toLowerCase().includes(searchValue.toLowerCase());
            const matchesStatus = !statusFilter || item.status === statusFilter;
            const matchesCompany = !companyFilter || Number(item.companyId) === Number(companyFilter);
            return matchesSearch && matchesStatus && matchesCompany;
        });
    }, [templates, searchValue, statusFilter, companyFilter]);

    const activeDefaultTemplates = templates.filter((template) => template.status === "ACTIVE" && template.defaultTemplate);
    const defaultConflictingCompanyIds = Object.entries(
        activeDefaultTemplates.reduce<Record<string, number>>((counts, template) => {
            const key = String(template.companyId ?? "GLOBAL");
            counts[key] = (counts[key] || 0) + 1;
            return counts;
        }, {})
    )
        .filter(([, count]) => count > 1)
        .map(([companyId]) => companyId);

    const handleOpenCreate = () => {
        setReferenceDataRequested(true);
        setEditingRecord(null);
        setActiveWorkflowTab("general");
        setActiveStepIndex(0);
        form.resetFields();
        form.setFieldsValue({
            priority: 10,
            defaultTemplate: false,
            applyMode: "COMPANY",
            departmentScopeIds: [],
            includeChildren: false,
            steps: [
                { stepKey: "REQUESTER_MANAGER", stepName: "Trưởng bộ phận duyệt", stepOrder: 1, approverStrategy: "REQUESTER_MANAGER", approvalRule: "ANY_ONE", required: true, slaValue: 1, slaUnit: "days" },
                { stepKey: "ACCOUNTANT", stepName: "Kế toán kiểm tra", stepOrder: 2, approverStrategy: "COMPANY_ROLE", approverRefId: "Phê duyệt bộ chứng từ kế toán - Kế toán", approvalRule: "ANY_ONE", required: true, slaValue: 1, slaUnit: "days" },
                { stepKey: "CHIEF_ACCOUNTANT", stepName: "Kế toán trưởng duyệt", stepOrder: 3, approverStrategy: "COMPANY_ROLE", approverRefId: "Phê duyệt bộ chứng từ kế toán - Kế toán trưởng", approvalRule: "ANY_ONE", required: true, slaValue: 1, slaUnit: "days" },
                { stepKey: "DIRECTOR", stepName: "Giám đốc phê duyệt", stepOrder: 4, approverStrategy: "COMPANY_DIRECTOR", approvalRule: "ANY_ONE", required: true, slaValue: 1, slaUnit: "days" }
            ]
        });
        setDrawerOpen(true);
    };

    const handleOpenEdit = (record: IWorkflowTemplate) => {
        setReferenceDataRequested(true);
        setEditingRecord(record);
        setActiveWorkflowTab("general");
        setActiveStepIndex(0);
        const departmentScopes = record.scopes
            .filter(s => s.scopeType === "DEPARTMENT")
            .map(s => ({
                scopeId: s.scopeId,
                includeChildren: s.includeChildren
            }));
        form.resetFields();
        form.setFieldsValue({
            code: record.code,
            name: record.name,
            companyId: record.companyId,
            priority: record.priority,
            dossierCategoryId: record.dossierCategoryId,
            defaultTemplate: record.defaultTemplate,
            effectiveFrom: record.effectiveFrom ? dayjs(record.effectiveFrom) : null,
            effectiveTo: record.effectiveTo ? dayjs(record.effectiveTo) : null,
            applyMode: departmentScopes.length > 0 ? "DEPARTMENTS" : "COMPANY",
            departmentScopeIds: departmentScopes.map(scope => scope.scopeId),
            includeChildren: departmentScopes.length === 0 ? true : departmentScopes.some(scope => scope.includeChildren),
            steps: record.steps.map(s => {
                let slaValue = s.slaMinutes || 1440;
                let slaUnit = "minutes";
                if (slaValue % 1440 === 0) {
                    slaValue = slaValue / 1440;
                    slaUnit = "days";
                } else if (slaValue % 60 === 0) {
                    slaValue = slaValue / 60;
                    slaUnit = "hours";
                }
                return {
                    stepKey: s.stepKey,
                    stepName: s.stepName,
                    stepOrder: s.stepOrder,
                    approverStrategy: s.approverStrategy,
                    approverRefId: s.approverRefId,
                    positionReferenceType: s.positionReferenceType,
                    positionResolverScope: s.positionResolverScope,
                    approvalRule: s.approvalRule,
                    required: s.required,
                    slaValue,
                    slaUnit
                };
            })
        });
        setDrawerOpen(true);
    };

    const handleCopyToDraft = async (record: IWorkflowTemplate) => {
        const res = await copyToDraftMutation.mutateAsync(record.id);
        handleOpenEdit(res.data as IWorkflowTemplate);
    };

    const handleSubmit = async () => {
        try {
            try {
                await form.validateFields(GENERAL_FORM_FIELDS);
            } catch {
                setActiveWorkflowTab("general");
                return;
            }
            const values = form.getFieldsValue(true);
            if (values.applyMode === "DEPARTMENTS" && (!values.departmentScopeIds || values.departmentScopeIds.length === 0)) {
                setActiveWorkflowTab("general");
                return;
            }
            const scopes = values.applyMode === "DEPARTMENTS"
                ? (values.departmentScopeIds || []).map((scopeId: number) => ({
                    scopeType: "DEPARTMENT",
                    scopeId,
                    includeChildren: false
                }))
                : [{
                    scopeType: "COMPANY",
                    scopeId: values.companyId,
                    includeChildren: true
                }];
            const payload = {
                ...values,
                effectiveFrom: values.effectiveFrom ? values.effectiveFrom.toISOString() : null,
                effectiveTo: values.effectiveTo ? values.effectiveTo.toISOString() : null,
                scopes,
                steps: (values.steps || []).map((step: any, index: number) => {
                    let slaMinutes = step.slaValue || 60;
                    if (step.slaUnit === "days") {
                        slaMinutes = slaMinutes * 1440;
                    } else if (step.slaUnit === "hours") {
                        slaMinutes = slaMinutes * 60;
                    }
                    const s = {
                        ...step,
                        stepOrder: step.stepOrder || index + 1,
                        stepKey: inferStepKey(step),
                        slaMinutes
                    };
                    delete s.slaValue;
                    delete s.slaUnit;
                    return s;
                })
            };
            delete payload.applyMode;
            delete payload.departmentScopeIds;
            delete payload.includeChildren;

            if (editingRecord) {
                await updateMutation.mutateAsync({ id: editingRecord.id, data: payload });
            } else {
                await createMutation.mutateAsync(payload);
            }
            setDrawerOpen(false);
            refetch();
        } catch (error) {
            // Error managed by mutation
        }
    };

    const handleGoToSteps = async () => {
        try {
            await form.validateFields(GENERAL_FORM_FIELDS);
            setActiveWorkflowTab("steps");
        } catch {
            setActiveWorkflowTab("general");
        }
    };

    const handleFormFinishFailed = (info: any) => {
        const firstErrorName = info?.errorFields?.[0]?.name?.[0];
        if (GENERAL_FORM_FIELDS.includes(firstErrorName)) {
            setActiveWorkflowTab("general");
        } else {
            setActiveWorkflowTab("steps");
        }
    };

    const handleValidate = async (id: number) => {
        if (!id) {
            notify.error("Không xác định được luồng duyệt cần kiểm tra.");
            return;
        }
        setValidatingTemplateId(id);
        try {
            const res = await callValidateWorkflowTemplate(id);
            const errors = Array.isArray(res?.data) ? res.data : [];
            setValidationResult({ templateId: id, errors });
        } catch (e: any) {
            const message = e?.message || e?.error || "Không thể kết nối máy chủ để kiểm tra luồng duyệt.";
            notify.error("Không thể kiểm tra tính hợp lệ: " + message);
        } finally {
            setValidatingTemplateId(null);
        }
    };

    const getCompanyLabel = (companyId: number) => {
        return companies.find(c => c.id === companyId)?.name || `Công ty #${companyId}`;
    };

    const columns: ProColumns<IWorkflowTemplate>[] = [
        {
            title: "Mã luồng",
            dataIndex: "code",
            key: "code",
            width: 190,
            render: (code, record) => (
                <Tag color="magenta" style={{ fontSize: 13, padding: "4px 8px", borderRadius: 6, margin: 0 }}>
                    {code as string}{record.version ? ` · v${record.version}` : ""}
                </Tag>
            )
        },
        {
            title: "Luồng duyệt",
            dataIndex: "name",
            key: "name",
            render: (name, record) => (
                <Space direction="vertical" size={2}>
                    <span style={{ fontWeight: 650, color: "#172033" }}>{name as string}</span>
                    <Space size={5} wrap>
                        <Tag color="blue" style={{ marginInlineEnd: 0 }}>{record.steps?.length || 0} bước duyệt</Tag>
                        <Tag color={record.defaultTemplate ? "magenta" : "cyan"} style={{ marginInlineEnd: 0 }}>
                            {record.defaultTemplate ? "Luồng mặc định" : "Luồng theo phòng ban"}
                        </Tag>
                    </Space>
                </Space>
            )
        },
        {
            title: "Phạm vi áp dụng",
            dataIndex: "companyId",
            key: "companyId",
            render: (cid, record) => {
                const departmentScopes = record.scopes?.filter((scope) => scope.scopeType === "DEPARTMENT") || [];
                return (
                    <Space direction="vertical" size={2}>
                        <span>{cid ? getCompanyLabel(cid as number) : "Toàn hệ thống"}</span>
                        <span style={{ color: "#6b7280", fontSize: 12 }}>
                            {departmentScopes.length
                                ? `${departmentScopes.length} phòng ban được chọn`
                                : record.defaultTemplate ? "Áp dụng khi không có luồng riêng" : "Toàn công ty"}
                        </span>
                    </Space>
                );
            }
        },
        {
            title: "Ưu tiên",
            dataIndex: "priority",
            key: "priority",
            width: 100,
            align: "center" as const
        },
        {
            title: "Trạng thái",
            dataIndex: "status",
            key: "status",
            width: 130,
            align: "center" as const,
            render: (status, record) => {
                if (status === "ACTIVE" && record.effectiveFrom && dayjs(record.effectiveFrom).isAfter(dayjs())) {
                    return <Tag color="processing">Sắp áp dụng</Tag>;
                }
                const meta = STATUS_META[status as keyof typeof STATUS_META] || STATUS_META.DRAFT;
                return <Tag color={meta.color}>{meta.label}</Tag>;
            }
        },
        {
            title: "Hành động",
            key: "actions",
            width: 142,
            align: "center" as const,
            fixed: "right",
            render: (_, record) => (
                <Space size={2} align="center">
                    <Button
                        aria-label={`Xem cấu hình ${record.name}`}
                        title="Xem cấu hình"
                        type="text"
                        size="small"
                        icon={<EyeOutlined style={{ color: "#1677ff", fontSize: 16 }} />}
                        onClick={() => setViewingRecord(record)}
                    />
                    {record.status === "DRAFT" && canUpdateDraft && (
                        <Button
                            aria-label={`Sửa nháp ${record.name}`}
                            title="Sửa nháp"
                            type="text"
                            size="small"
                            icon={<EditOutlined style={{ color: "#fa8c16", fontSize: 16 }} />}
                            onClick={() => handleOpenEdit(record)}
                        />
                    )}
                    {record.status === "DRAFT" && canValidate && (
                        <Button
                            aria-label={`Kiểm tra ${record.name}`}
                            title="Kiểm tra cấu hình"
                            type="text"
                            size="small"
                            loading={validatingTemplateId === record.id}
                            icon={<FileSearchOutlined style={{ color: "#1677ff", fontSize: 16 }} />}
                            onClick={() => void handleValidate(record.id)}
                        />
                    )}
                    {record.status !== "DRAFT" && canCopyDraft && (
                        <Button
                            aria-label={`Sao chép ${record.name} thành nháp`}
                            title="Sao chép thành nháp"
                            type="text"
                            size="small"
                            loading={copyToDraftMutation.isPending}
                            icon={<CopyOutlined style={{ color: "#7c3aed", fontSize: 16 }} />}
                            onClick={() => void handleCopyToDraft(record)}
                        />
                    )}
                    {record.status === "DRAFT" && canPublish && (
                        <Popconfirm
                            title="Áp dụng luồng duyệt này?"
                            description="Luồng sẽ áp dụng cho bộ chứng từ mới khớp phạm vi. Hồ sơ đang chạy không bị thay đổi."
                            okText="Áp dụng"
                            cancelText="Hủy"
                            placement="topRight"
                            onConfirm={async () => {
                                await publishMutation.mutateAsync(record.id);
                                refetch();
                            }}
                        >
                            <Button
                                aria-label={`Áp dụng ${record.name}`}
                                title="Áp dụng"
                                type="text"
                                size="small"
                                loading={publishMutation.isPending}
                                icon={<CheckCircleOutlined style={{ color: "#52c41a", fontSize: 16 }} />}
                            />
                        </Popconfirm>
                    )}
                    {record.status === "ACTIVE" && canDeactivate && (
                        <Popconfirm
                            title="Ngưng áp dụng luồng duyệt này?"
                            description="Luồng sẽ không áp dụng cho hồ sơ mới. Hồ sơ đã gửi vẫn giữ lịch sử hiện tại."
                            okText="Ngưng áp dụng"
                            cancelText="Hủy"
                            okButtonProps={{ danger: true }}
                            placement="topRight"
                            onConfirm={async () => {
                                await deactivateMutation.mutateAsync(record.id);
                                refetch();
                            }}
                        >
                            <Button
                                aria-label={`Ngưng áp dụng ${record.name}`}
                                title="Ngưng áp dụng"
                                type="text"
                                size="small"
                                danger
                                loading={deactivateMutation.isPending}
                                icon={<StopOutlined style={{ fontSize: 16 }} />}
                            />
                        </Popconfirm>
                    )}
                    {record.status === "INACTIVE" && canReactivate && (
                        <Popconfirm
                            title="Kích hoạt lại luồng duyệt này?"
                            description="Luồng sẽ được áp dụng cho các hồ sơ mới nếu không xung đột với luồng đang dùng."
                            okText="Kích hoạt lại"
                            cancelText="Hủy"
                            placement="topRight"
                            onConfirm={async () => {
                                await reactivateMutation.mutateAsync(record.id);
                                refetch();
                            }}
                        >
                            <Button
                                aria-label={`Kích hoạt lại ${record.name}`}
                                title="Kích hoạt lại"
                                type="text"
                                size="small"
                                loading={reactivateMutation.isPending}
                                icon={<RedoOutlined style={{ color: "#16794c", fontSize: 16 }} />}
                            />
                        </Popconfirm>
                    )}
                </Space>
            )
        }
    ];

    return (
        <PageContainer
            title="Cấu hình luồng duyệt"
            filter={
                <div style={{ display: "grid", gap: 10 }}>
                    <div style={{ width: "100%", minWidth: 280 }}>
                        <SearchFilter
                            searchPlaceholder="Tìm mã hoặc tên luồng..."
                            showFilterButton={false}
                            addLabel="Tạo luồng"
                            addPermission={ALL_PERMISSIONS.ACCOUNTING_WORKFLOWS.CREATE_DRAFT}
                            onAddClick={handleOpenCreate}
                            onAddPreload={() => setReferenceDataRequested(true)}
                            onSearch={(val) => setSearchValue(val)}
                            onReset={() => {
                                setSearchValue("");
                                setStatusFilter(null);
                                setCompanyFilter(null);
                                setFilterResetSignal((current) => current + 1);
                                refetch();
                            }}
                        />
                    </div>
                    <div style={{ display: "flex", alignItems: "center" }}>
                        <AdvancedFilterSelect
                            fields={[
                                {
                                    key: "status",
                                    label: "Trạng thái",
                                    options: [
                                        { label: "Bản nháp", value: "DRAFT", color: "orange" },
                                        { label: "Hoạt động", value: "ACTIVE", color: "green" },
                                        { label: "Hết hiệu lực", value: "INACTIVE", color: "red" }
                                    ]
                                },
                                {
                                    key: "companyId",
                                    label: "Công ty",
                                    searchable: true,
                                    options: companies.map((company) => ({
                                        label: company.name,
                                        value: company.id,
                                        color: "blue"
                                    }))
                                }
                            ]}
                            resetSignal={filterResetSignal}
                            onChange={(filters) => {
                                setStatusFilter(filters.status !== undefined ? filters.status : null);
                                setCompanyFilter(filters.companyId !== undefined ? Number(filters.companyId) : null);
                            }}
                        />
                    </div>
                </div>
            }
        >
            <div style={{ display: "grid", gap: 10, marginBottom: defaultConflictingCompanyIds.length > 0 ? 14 : 0 }}>
                {defaultConflictingCompanyIds.length > 0 && (
                    <Alert
                        type="warning"
                        showIcon
                        message="Có nhiều luồng mặc định cùng một công ty"
                        description="Nên chỉ giữ một luồng mặc định cho mỗi công ty. Hãy ngưng các luồng thừa hoặc tách chúng theo phòng ban để tránh cấu hình khó kiểm soát."
                    />
                )}
            </div>
            {filteredTemplates.length === 0 && !isFetching ? (
                <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description={templates.length ? "Không có luồng nào khớp bộ lọc hiện tại" : "Chưa có luồng duyệt nào"}
                    style={{ padding: "44px 0", background: "#fff", borderRadius: 12, border: "1px solid #edf0f5" }}
                >
                    {templates.length ? (
                        <Button type="link" onClick={() => { setSearchValue(""); setStatusFilter(null); }}>Xóa bộ lọc</Button>
                    ) : canCreateDraft ? (
                        <Button type="primary" icon={<PlusOutlined />} onClick={handleOpenCreate} style={{ background: ACCENT, borderColor: ACCENT }}>Tạo luồng đầu tiên</Button>
                    ) : null}
                </Empty>
            ) : (
                <DataTable<IWorkflowTemplate>
                    dataSource={filteredTemplates}
                    columns={columns}
                    rowKey="id"
                    loading={isFetching}
                    search={false}
                    options={false}
                    scroll={{ x: "max-content" }}
                    pagination={{ pageSize: PAGINATION_CONFIG?.DEFAULT_PAGE_SIZE || 10 }}
                    expandable={{
                    expandedRowRender: (record) => (
                        <div style={{ padding: "10px 20px 14px", background: "#fbfcfe" }}>
                            <div style={{ display: "grid", gridTemplateColumns: "minmax(180px, 260px) 1fr", gap: 18 }}>
                                <section>
                                    <div style={{ fontWeight: 650, color: "#1f2937", marginBottom: 8 }}>Phạm vi áp dụng</div>
                                    {record.scopes.length === 0 ? (
                                        <Tag>Toàn hệ thống</Tag>
                                    ) : (
                                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                                        {record.scopes.map((s, idx) => (
                                            <Tag key={idx} color={s.scopeType === "COMPANY" ? "blue" : "cyan"} style={{ marginBottom: 4 }}>
                                                {s.scopeType === "COMPANY" ? "Công ty" : "Phòng ban"} · {
                                                    s.scopeType === "COMPANY" 
                                                        ? getCompanyLabel(s.scopeId)
                                                        : departments.find((d: any) => d.id === s.scopeId)?.name || s.scopeId
                                                } {s.includeChildren && " + cấp dưới"}
                                            </Tag>
                                        ))}
                                    </div>
                                    )}
                                </section>
                                <section>
                                    <div style={{ fontWeight: 650, color: "#1f2937", marginBottom: 8 }}>Các bước duyệt</div>
                                    <div style={{ display: "grid", gap: 8 }}>
                                    {record.steps.map((step, idx) => (
                                        <div key={idx} style={{ display: "grid", gridTemplateColumns: "46px 1fr auto", alignItems: "center", gap: 10, padding: "9px 12px", background: "#fff", borderRadius: 8, border: "1px solid #edf0f5" }}>
                                            <div style={{ width: 30, height: 30, borderRadius: 8, background: "#eef4ff", color: "#1d4ed8", display: "grid", placeItems: "center", fontWeight: 700 }}>
                                                {step.stepOrder}
                                            </div>
                                            <div style={{ minWidth: 0 }}>
                                                <div style={{ fontWeight: 650, color: "#111827" }}>{step.stepName}</div>
                                                <div style={{ color: "#6b7280", fontSize: 12, marginTop: 2 }}>
                                                    {STRATEGY_LABEL[step.approverStrategy] || step.approverStrategy}
                                                    {step.approverRefId ? ` · ${step.approverRefId}` : ""}
                                                </div>
                                            </div>
                                            <Space size={4} wrap>
                                                <Tag color="orange">{formatSla(step.slaMinutes)}</Tag>
                                                <Tag color={step.required ? "success" : "default"}>{step.required ? "Bắt buộc" : "Tùy chọn"}</Tag>
                                            </Space>
                                        </div>
                                    ))}
                                    </div>
                                </section>
                            </div>
                        </div>
                    ),
                        rowExpandable: () => true
                    }}
                />
            )}

            <Modal
                open={!!viewingRecord}
                onCancel={() => setViewingRecord(null)}
                title={viewingRecord ? `Xem cấu hình · ${viewingRecord.name}` : "Xem cấu hình luồng duyệt"}
                footer={
                    <Space>
                        {canValidate && viewingRecord && (
                            <Button
                                icon={<FileSearchOutlined />}
                                loading={validatingTemplateId === viewingRecord.id}
                                onClick={() => void handleValidate(viewingRecord.id)}
                            >
                                Kiểm tra cấu hình
                            </Button>
                        )}
                        <Button onClick={() => setViewingRecord(null)}>Đóng</Button>
                    </Space>
                }
                width={760}
            >
                {viewingRecord && (
                    <div style={{ display: "grid", gap: 18 }}>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 12, alignItems: "center" }}>
                            <div>
                                <div style={{ color: "#6b7280", fontSize: 12 }}>Mã luồng</div>
                                <div style={{ fontWeight: 700, color: "#172033" }}>{viewingRecord.code}</div>
                            </div>
                            <Tag color={STATUS_META[viewingRecord.status].color}>{STATUS_META[viewingRecord.status].label}</Tag>
                        </div>
                        <div>
                            <div style={{ fontWeight: 650, color: "#1f2937", marginBottom: 8 }}>Phạm vi áp dụng</div>
                            <Space size={[6, 6]} wrap>
                                {viewingRecord.scopes?.length ? viewingRecord.scopes.map((scope, index) => (
                                    <Tag key={`${scope.scopeType}-${scope.scopeId}-${index}`} color={scope.scopeType === "COMPANY" ? "blue" : "cyan"}>
                                        {scope.scopeType === "COMPANY"
                                            ? `Công ty · ${getCompanyLabel(scope.scopeId)}`
                                            : `Phòng ban · ${departments.find((department: any) => department.id === scope.scopeId)?.name || scope.scopeId}`}
                                    </Tag>
                                )) : <Tag>Toàn hệ thống</Tag>}
                            </Space>
                        </div>
                        <div>
                            <div style={{ fontWeight: 650, color: "#1f2937", marginBottom: 8 }}>Các bước duyệt</div>
                            <div style={{ display: "grid", gap: 8 }}>
                                {viewingRecord.steps?.map((step, index) => (
                                    <div key={`${step.stepKey}-${index}`} style={{ display: "grid", gridTemplateColumns: "34px 1fr auto", gap: 10, alignItems: "center", padding: "9px 12px", border: "1px solid #edf0f5", borderRadius: 8 }}>
                                        <span style={{ fontWeight: 700, color: "#1d4ed8" }}>{step.stepOrder}</span>
                                        <div>
                                            <div style={{ fontWeight: 650 }}>{step.stepName}</div>
                                            <div style={{ color: "#6b7280", fontSize: 12 }}>{STRATEGY_LABEL[step.approverStrategy] || step.approverStrategy}</div>
                                        </div>
                                        <Tag color="orange">{formatSla(step.slaMinutes)}</Tag>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </Modal>

            <Modal
                open={!!validationResult}
                onCancel={() => setValidationResult(null)}
                title={validationResult?.errors.length ? "Kết quả kiểm tra luồng duyệt" : "Luồng duyệt hợp lệ"}
                footer={<Button onClick={() => setValidationResult(null)} style={{ borderColor: ACCENT_BORDER, color: ACCENT_HOVER }}>Đã hiểu</Button>}
                centered
                width={560}
            >
                {validationResult?.errors.length ? (
                    <div>
                        <Alert
                            type="error"
                            showIcon
                            message={`Có ${validationResult.errors.length} điểm cần cấu hình lại`}
                            description="Luồng chưa thể được kích hoạt cho đến khi xử lý các mục bên dưới."
                            style={{ marginBottom: 16 }}
                        />
                        <div style={{ display: "grid", gap: 8 }}>
                            {validationResult.errors.map((error, index) => (
                                <div key={index} style={{ display: "flex", gap: 10, padding: "10px 12px", borderRadius: 8, border: "1px solid #ffd6dd", background: "#fff7f8", color: "#9f2944", fontSize: 13 }}>
                                    <span style={{ fontWeight: 700 }}>{index + 1}.</span>
                                    <span>{error}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <Alert
                        type="success"
                        showIcon
                        message="Cấu hình luồng đã hợp lệ"
                        description="Bạn có thể kích hoạt để áp dụng luồng này cho các hồ sơ mới phù hợp điều kiện."
                        style={{ marginBottom: 4 }}
                    />
                )}
            </Modal>

            <Modal
                title={editingRecord ? "Sửa luồng duyệt" : "Tạo luồng duyệt"}
                open={drawerOpen}
                onCancel={() => setDrawerOpen(false)}
                width="min(1120px, calc(100vw - 32px))"
                style={{ top: 18 }}
                styles={{
                    body: {
                        maxHeight: "calc(100vh - 178px)",
                        overflowY: "auto",
                        paddingTop: 12
                    }
                }}
                footer={
                    <Space>
                        <Button onClick={() => setDrawerOpen(false)}>Hủy</Button>
                        {activeWorkflowTab === "general" ? (
                            <Button
                                type="primary"
                                onClick={handleGoToSteps}
                                style={{ background: ACCENT, borderColor: ACCENT }}
                            >
                                Tiếp theo
                            </Button>
                        ) : (
                            <>
                                <Button onClick={() => setActiveWorkflowTab("general")}>
                                    Quay lại
                                </Button>
                                <Button
                                    type="primary"
                                    onClick={() => form.submit()}
                                    loading={createMutation.isPending || updateMutation.isPending}
                                    style={{ background: ACCENT, borderColor: ACCENT }}
                                >
                                    Lưu nháp
                                </Button>
                            </>
                        )}
                    </Space>
                }
            >
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleSubmit}
                    onFinishFailed={handleFormFinishFailed}
                >
                    <Alert
                        type="info"
                        showIcon
                        message="Chọn công ty, phạm vi áp dụng và các bước duyệt."
                        style={{ marginBottom: 16 }}
                    />

                    <div style={{
                        display: "flex",
                        gap: 4,
                        marginBottom: 16,
                        background: "#fff",
                        borderRadius: 12,
                        padding: 5,
                        border: "1px solid #eef0f5",
                        boxShadow: "0 1px 4px rgba(0,0,0,.04)",
                        overflowX: "auto",
                        WebkitOverflowScrolling: "touch",
                        scrollbarWidth: "none",
                        msOverflowStyle: "none",
                    } as React.CSSProperties}>
                        {WORKFLOW_FORM_TABS.map((tab) => {
                            const isActive = activeWorkflowTab === tab.key;
                            return (
                                <button
                                    type="button"
                                    key={tab.key}
                                    onClick={() => {
                                        setActiveWorkflowTab(tab.key);
                                    }}
                                    style={{
                                        flex: 1,
                                        padding: "9px 12px",
                                        borderRadius: 8,
                                        fontSize: 13,
                                        fontWeight: isActive ? 700 : 500,
                                        color: isActive ? "#fff" : "#6b7280",
                                        background: isActive ? ACCENT : "transparent",
                                        border: "none",
                                        cursor: "pointer",
                                        transition: "all 0.18s ease",
                                        boxShadow: isActive ? "0 2px 8px rgba(232,99,122,.35)" : "none",
                                        whiteSpace: "nowrap",
                                        minWidth: "fit-content",
                                    }}
                                >
                                    {tab.label}
                                </button>
                            );
                        })}
                    </div>

                    {activeWorkflowTab === "general" && (
                        <>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: 12 }}>
                        <Form.Item
                            name="code"
                            label="Mã luồng"
                            rules={[{ required: true, message: "Vui lòng nhập mã luồng" }]}
                        >
                            <Input placeholder="WF-HR-01" disabled={!!editingRecord} />
                        </Form.Item>
                        <Form.Item
                            name="name"
                            label="Tên luồng"
                            rules={[{ required: true, message: "Vui lòng nhập tên luồng" }]}
                        >
                            <Input placeholder="Luồng duyệt chứng từ chi phí nhân sự" />
                        </Form.Item>
                        <Form.Item
                            name="companyId"
                            label="Công ty áp dụng"
                            rules={[{ required: true, message: "Chọn công ty áp dụng" }]}
                        >
                            <Select 
                                placeholder="Chọn công ty"
                                popupMatchSelectWidth={false}
                                dropdownStyle={{ minWidth: 400 }}
                                showSearch
                                optionFilterProp="children"
                            >
                                {companies.map(c => <Select.Option key={c.id} value={c.id}>{c.name}</Select.Option>)}
                            </Select>
                        </Form.Item>
                        <Form.Item
                            name="priority"
                            label="Độ ưu tiên"
                            tooltip="Số nhỏ hơn sẽ được ưu tiên khi nhiều luồng cùng khớp hồ sơ."
                            rules={[{ required: true, message: "Nhập độ ưu tiên" }]}
                        >
                            <InputNumber min={1} max={999} style={{ width: "100%" }} />
                        </Form.Item>
                        <Form.Item
                            name="dossierCategoryId"
                            label="Loại chứng từ"
                            tooltip="Để trống để áp dụng cho mọi loại chứng từ trong phạm vi."
                        >
                            <Select
                                allowClear
                                placeholder="Tất cả loại chứng từ"
                                showSearch
                                optionFilterProp="label"
                                options={dossierCategories.map((category: any) => ({
                                    value: category.id,
                                    label: category.name || category.code || `Loại #${category.id}`
                                }))}
                            />
                        </Form.Item>
                        <Form.Item name="effectiveFrom" label="Bắt đầu hiệu lực">
                            <DatePicker showTime format="DD/MM/YYYY HH:mm" style={{ width: "100%" }} />
                        </Form.Item>
                        <Form.Item
                            name="effectiveTo"
                            label="Kết thúc hiệu lực"
                            rules={[({ getFieldValue }) => ({
                                validator(_, value) {
                                    const from = getFieldValue("effectiveFrom");
                                    return !value || !from || value.isAfter(from)
                                        ? Promise.resolve()
                                        : Promise.reject(new Error("Thời điểm kết thúc phải sau thời điểm bắt đầu"));
                                }
                            })]}
                        >
                            <DatePicker showTime format="DD/MM/YYYY HH:mm" style={{ width: "100%" }} />
                        </Form.Item>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 12, alignItems: "start" }}>
                        <Form.Item
                            name="defaultTemplate"
                            label="Dùng làm luồng mặc định của công ty"
                            tooltip="Bật nếu đây là luồng dự phòng khi hồ sơ không khớp phòng ban riêng nào."
                            valuePropName="checked"
                        >
                            <Switch />
                        </Form.Item>
                    </div>

                    <Divider style={{ margin: "8px 0 16px" }} />

                    <Card
                        size="small"
                        title="Áp dụng cho"
                        style={{
                            marginTop: 0,
                            borderRadius: 10,
                            borderColor: "#edf0f5",
                            boxShadow: "0 1px 3px rgba(15,23,42,.03)"
                        }}
                        styles={{
                            header: {
                                minHeight: 44,
                                paddingInline: 16,
                                fontWeight: 700,
                                borderBottomColor: "#f0f2f6"
                            },
                            body: { padding: 16 }
                        }}
                    >
                        <Form.Item name="applyMode" style={{ marginBottom: 14 }}>
                            <Form.Item noStyle shouldUpdate={(prev, cur) => prev.applyMode !== cur.applyMode}>
                                {({ getFieldValue, setFieldValue }) => {
                                    const applyMode = getFieldValue("applyMode") || "COMPANY";
                                    return (
                                        <div
                                            role="radiogroup"
                                            aria-label="Phạm vi áp dụng luồng duyệt"
                                            style={{
                                                display: "grid",
                                                gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                                                gap: 8,
                                                padding: 4,
                                                borderRadius: 12,
                                                background: "#f8fafc",
                                                border: "1px solid #edf0f5",
                                                maxWidth: 620
                                            }}
                                        >
                                            {APPLY_MODE_OPTIONS.map((option) => {
                                                const isSelected = applyMode === option.value;
                                                return (
                                                    <button
                                                        key={option.value}
                                                        type="button"
                                                        role="radio"
                                                        aria-checked={isSelected}
                                                        onClick={() => setFieldValue("applyMode", option.value)}
                                                        style={{
                                                            minHeight: 58,
                                                            border: `1px solid ${isSelected ? ACCENT_BORDER : "transparent"}`,
                                                            borderRadius: 10,
                                                            padding: "9px 12px",
                                                            display: "grid",
                                                            gridTemplateColumns: "28px 1fr",
                                                            gap: 10,
                                                            alignItems: "center",
                                                            textAlign: "left",
                                                            cursor: "pointer",
                                                            color: isSelected ? "#9f2944" : "#4b5563",
                                                            background: isSelected
                                                                ? "linear-gradient(180deg, #fff7f9 0%, #fff0f3 100%)"
                                                                : "#fff",
                                                            boxShadow: isSelected
                                                                ? "0 6px 14px rgba(232,99,122,.16)"
                                                                : "0 1px 2px rgba(15,23,42,.04)",
                                                            transition: "all .18s ease"
                                                        }}
                                                    >
                                                        <span
                                                            style={{
                                                                width: 28,
                                                                height: 28,
                                                                borderRadius: 8,
                                                                display: "grid",
                                                                placeItems: "center",
                                                                color: isSelected ? "#fff" : "#8b95a5",
                                                                background: isSelected ? ACCENT : "#eef2f7",
                                                                fontSize: 15
                                                            }}
                                                        >
                                                            {option.icon}
                                                        </span>
                                                        <span style={{ minWidth: 0 }}>
                                                            <span style={{ display: "block", fontWeight: 750, lineHeight: 1.25 }}>
                                                                {option.label}
                                                            </span>
                                                            <span style={{ display: "block", fontSize: 12, color: isSelected ? "#b4475d" : "#7b8494", marginTop: 2 }}>
                                                                {option.description}
                                                            </span>
                                                        </span>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    );
                                }}
                            </Form.Item>
                        </Form.Item>

                        <Form.Item noStyle shouldUpdate={(prev, cur) => prev.applyMode !== cur.applyMode}>
                            {({ getFieldValue }) => {
                                const applyMode = getFieldValue("applyMode");
                                if (applyMode !== "DEPARTMENTS") {
                                    return (
                                        <Alert
                                            type="success"
                                            showIcon
                                            message="Luồng này áp dụng cho toàn bộ công ty đã chọn ở trên."
                                        />
                                    );
                                }
                                return (
                                    <Form.Item
                                        name="departmentScopeIds"
                                        label="Phòng ban áp dụng"
                                        rules={[{ required: true, message: "Chọn ít nhất một phòng ban" }]}
                                        style={{ marginBottom: 0 }}
                                    >
                                        <Select
                                            mode="multiple"
                                            allowClear
                                            showSearch
                                            maxTagCount="responsive"
                                            placeholder="Chọn một hoặc nhiều phòng ban"
                                            optionFilterProp="label"
                                            options={departments
                                                .filter((d: any) => !getFieldValue("companyId")
                                                    || Number(d.company?.id ?? d.companyId) === Number(getFieldValue("companyId")))
                                                .map((d: any) => ({ value: d.id, label: d.name }))}
                                        />
                                    </Form.Item>
                                );
                            }}
                        </Form.Item>
                    </Card>

                        </>
                    )}

                    {activeWorkflowTab === "steps" && (
                    <Card size="small" title="Các bước duyệt" style={{ marginTop: 16, borderRadius: 8 }}>
                        <Form.List name="steps">
                            {(fields, { add, remove }) => {
                                const selectedStepIndex = Math.min(activeStepIndex, Math.max(fields.length - 1, 0));
                                return (
                                <div style={{ display: "grid", gridTemplateColumns: "240px minmax(0, 1fr)", gap: 14, alignItems: "start" }}>
                                    <div style={{ border: "1px solid #edf0f5", borderRadius: 8, padding: 8, background: "#fbfcfe", maxHeight: 420, overflowY: "auto" }}>
                                        <div style={{ color: "#6b7280", fontSize: 12, fontWeight: 650, margin: "2px 6px 8px" }}>
                                            Danh sách bước ({fields.length})
                                        </div>
                                        <div style={{ display: "grid", gap: 6 }}>
                                            {fields.map(({ key, name }) => (
                                                <Form.Item
                                                    key={key}
                                                    noStyle
                                                    shouldUpdate={(prevValues, currentValues) => {
                                                        return prevValues.steps?.[name]?.stepName !== currentValues.steps?.[name]?.stepName
                                                            || prevValues.steps?.[name]?.approverStrategy !== currentValues.steps?.[name]?.approverStrategy;
                                                    }}
                                                >
                                                    {({ getFieldValue }) => {
                                                        const stepName = getFieldValue(["steps", name, "stepName"]) || `Bước ${name + 1}`;
                                                        const strategy = getFieldValue(["steps", name, "approverStrategy"]);
                                                        const isActive = name === selectedStepIndex;
                                                        return (
                                                            <Button
                                                                onClick={() => setActiveStepIndex(name)}
                                                                style={{
                                                                    height: "auto",
                                                                    minHeight: 54,
                                                                    padding: "8px 10px",
                                                                    textAlign: "left",
                                                                    display: "block",
                                                                    whiteSpace: "normal",
                                                                    borderRadius: 8,
                                                                    boxShadow: isActive ? "0 2px 8px rgba(232,99,122,.22)" : "none",
                                                                    background: isActive ? ACCENT_LIGHT : "#fff",
                                                                    borderColor: isActive ? ACCENT_BORDER : "#edf0f5",
                                                                    color: isActive ? ACCENT_HOVER : "#374151"
                                                                }}
                                                            >
                                                                <div style={{ fontWeight: 700, lineHeight: 1.25 }}>Bước {name + 1}</div>
                                                                <div style={{ fontSize: 12, lineHeight: 1.3, opacity: isActive ? 0.9 : 0.65, marginTop: 3 }}>
                                                                    {stepName}
                                                                </div>
                                                                {strategy && (
                                                                    <div style={{ fontSize: 11, lineHeight: 1.3, opacity: isActive ? 0.82 : 0.55, marginTop: 3 }}>
                                                                        {STRATEGY_LABEL[strategy] || strategy}
                                                                    </div>
                                                                )}
                                                            </Button>
                                                        );
                                                    }}
                                                </Form.Item>
                                            ))}
                                        </div>
                                        <Button
                                            type="dashed"
                                            onClick={() => {
                                                add({
                                                    stepOrder: fields.length + 1,
                                                    stepName: "Bước duyệt mới",
                                                    approverStrategy: "SPECIFIC_USER",
                                                    approvalRule: "ANY_ONE",
                                                    required: true,
                                                    slaValue: 1,
                                                    slaUnit: "days"
                                                });
                                                setActiveStepIndex(fields.length);
                                            }}
                                            block
                                            icon={<PlusOutlined />}
                                            style={{ marginTop: 8 }}
                                        >
                                            Thêm bước
                                        </Button>
                                    </div>
                                    <div style={{ minWidth: 0 }}>
                                    {fields.map(({ key, name, ...restField }) => (
                                        <div key={key} style={{ display: name === selectedStepIndex ? "block" : "none", padding: 14, border: "1px solid #eef1f6", borderRadius: 8, background: "#fbfcfe" }}>
                                            <Space style={{ display: "flex", width: "100%", justifyContent: "space-between" }} align="center">
                                                <strong>Bước {name + 1}</strong>
                                                <Button
                                                    type="text"
                                                    danger
                                                    icon={<DeleteOutlined />}
                                                    onClick={() => {
                                                        remove(name);
                                                        setActiveStepIndex(Math.max(0, Math.min(selectedStepIndex, fields.length - 2)));
                                                    }}
                                                />
                                            </Space>

                                            <div style={{ display: "grid", gridTemplateColumns: "84px minmax(220px, 1fr) minmax(260px, 1fr)", gap: 12, marginTop: 10 }}>
                                                <Form.Item
                                                    {...restField}
                                                    name={[name, "stepOrder"]}
                                                    label="Thứ tự"
                                                    rules={[{ required: true }]}
                                                >
                                                    <InputNumber min={1} style={{ width: "100%" }} />
                                                </Form.Item>

                                                <Form.Item
                                                    {...restField}
                                                    name={[name, "stepName"]}
                                                    label="Tên hiển thị"
                                                    rules={[{ required: true }]}
                                                >
                                                    <Input placeholder="VD: Trưởng phòng duyệt" />
                                                </Form.Item>

                                                <Form.Item
                                                    {...restField}
                                                    name={[name, "approverStrategy"]}
                                                    label="Cách chọn người duyệt"
                                                    rules={[{ required: true }]}
                                                >
                                                    <Select placeholder="Chọn cách tìm">
                                                        {STRATEGY_OPTIONS.map(({ value, label, disabled }) => (
                                                            <Select.Option key={value} value={value} disabled={disabled}>{label}</Select.Option>
                                                        ))}
                                                    </Select>
                                                </Form.Item>
                                            </div>

                                            <div style={{ display: "grid", gridTemplateColumns: "minmax(240px, 1fr) 100px 200px", gap: 12, alignItems: "start" }}>
                                                 <Form.Item
                                                     noStyle
                                                     shouldUpdate={(prevValues, currentValues) => {
                                                         return prevValues.steps?.[name]?.approverStrategy !== currentValues.steps?.[name]?.approverStrategy
                                                             || prevValues.steps?.[name]?.positionReferenceType !== currentValues.steps?.[name]?.positionReferenceType
                                                             || prevValues.companyId !== currentValues.companyId;
                                                     }}
                                                 >
                                                     {({ getFieldValue }) => {
                                                         const strategy = getFieldValue(["steps", name, "approverStrategy"]);
                                                         const selectedCompanyId = getFieldValue("companyId");
                                                         const selectedCompany = companies.find(c => c.id === selectedCompanyId);
                                                         const targetCompanyName = selectedCompany?.name?.toLowerCase().trim();

                                                         const filteredUsers = users.filter((u: any) => {
                                                             if (!targetCompanyName) return true;
                                                             return u.positions?.some((p: any) => p.companyName?.toLowerCase().trim() === targetCompanyName);
                                                         });

                                                         if (strategy === "COMPANY_ROLE") {
                                                             return (
                                                                 <div>
                                                                     <Form.Item
                                                                         {...restField}
                                                                         name={[name, "approverRefId"]}
                                                                         label="Nhóm xử lý"
                                                                         rules={[{ required: true, message: "Chọn nhóm xử lý" }]}
                                                                         style={{ marginBottom: 8 }}
                                                                     >
                                                                         <Select placeholder="Chọn nhóm">
                                                                             <Select.Option value={ACCOUNTANT_PERMISSION}>Kế toán</Select.Option>
                                                                             <Select.Option value={CHIEF_ACCOUNTANT_PERMISSION}>Kế toán trưởng</Select.Option>
                                                                         </Select>
                                                                     </Form.Item>
                                                                     <Form.Item
                                                                         noStyle
                                                                         shouldUpdate={(prevValues, currentValues) => {
                                                                             return prevValues.steps?.[name]?.approverRefId !== currentValues.steps?.[name]?.approverRefId;
                                                                         }}
                                                                     >
                                                                         {({ getFieldValue }) => {
                                                                             const permissionName = getFieldValue(["steps", name, "approverRefId"]);
                                                                             const matchedUsers = getRoleMatchedUsers(users, permissionName);
                                                                             if (!permissionName) return null;
                                                                             return (
                                                                                 <div style={{ fontSize: 12, color: "#6b7280" }}>
                                                                                     <div style={{ marginBottom: 4 }}>
                                                                                         Người thuộc nhóm này ({matchedUsers.length}):
                                                                                     </div>
                                                                                     {matchedUsers.length > 0 ? (
                                                                                         <Space size={4} wrap>
                                                                                             {matchedUsers.slice(0, 6).map((user) => (
                                                                                                 <Tag key={user.id} color="blue" style={{ marginInlineEnd: 0 }}>
                                                                                                     {user.name || user.email}
                                                                                                 </Tag>
                                                                                             ))}
                                                                                             {matchedUsers.length > 6 && <Tag>+{matchedUsers.length - 6}</Tag>}
                                                                                         </Space>
                                                                                     ) : (
                                                                                         <span style={{ color: "#dc2626" }}>
                                                                                             Chưa thấy người dùng có vai trò phù hợp trong danh sách.
                                                                                         </span>
                                                                                     )}
                                                                                 </div>
                                                                             );
                                                                         }}
                                                                     </Form.Item>
                                                                 </div>
                                                             );
                                                         }
                                                         if (strategy === "SPECIFIC_USER") {
                                                             return (
                                                                 <Form.Item
                                                                     {...restField}
                                                                     name={[name, "approverRefId"]}
                                                                     label="Người duyệt"
                                                                     rules={[{ required: true, message: "Vui lòng chọn người duyệt" }]}
                                                                 >
                                                                     <Select 
                                                                         placeholder="Chọn người duyệt" 
                                                                         showSearch 
                                                                         optionFilterProp="label"
                                                                         popupMatchSelectWidth={false}
                                                                         dropdownStyle={{ minWidth: 450 }}
                                                                     >
                                                                         {filteredUsers.map((u: any) => {
                                                                             const pos = u.positions?.[0];
                                                                             const getPosLevel = (p: any) => {
                                                                                 if (!p) return "";
                                                                                 return p.positionLevelCode || p.levelCode || p.positionLevel || (p.levelNumber ? `Cấp ${p.levelNumber}` : '') || p.band || '';
                                                                             };
                                                                             const posLevel = getPosLevel(pos);
                                                                             const jobTitle = pos ? (pos.jobTitleNameVi || pos.jobTitleName || "Chưa rõ chức danh") : "Chưa rõ chức danh";
                                                                             const displayJob = posLevel ? `${jobTitle} (${posLevel})` : jobTitle;
                                                                             const posInfo = pos ? ` - ${displayJob} (${pos.companyName || "Chưa rõ công ty"})` : "";
                                                                             const labelText = `${u.name} (${u.email})${posInfo}`;
                                                                             return (
                                                                                 <Select.Option key={u.id} value={u.id} label={labelText}>
                                                                                     <div style={{ display: "flex", flexDirection: "column", padding: "4px 0" }}>
                                                                                         <span style={{ fontWeight: 500 }}>{u.name} ({u.email})</span>
                                                                                         {pos && (
                                                                                             <span style={{ fontSize: 11, color: "#8c8c8c", marginTop: 2 }}>
                                                                                                 {displayJob} | {pos.departmentName || "Phòng ban khác"} | {pos.companyName}
                                                                                             </span>
                                                                                         )}
                                                                                     </div>
                                                                                 </Select.Option>
                                                                             );
                                                                         })}
                                                                     </Select>
                                                                 </Form.Item>
                                                             );
                                                         }
                                                         if (strategy === "POSITION") {
                                                             const referenceType = getFieldValue(["steps", name, "positionReferenceType"]);
                                                             const isJobTitle = referenceType === "JOB_TITLE";
                                                             const referenceOptions = isJobTitle
                                                                 ? jobTitles.map((item: any) => ({ value: String(item.id), label: item.nameVi || item.nameEn }))
                                                                 : positionLevels.map((item: any) => ({ value: String(item.id), label: item.code }));
                                                             return (
                                                                 <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                                                                     <Form.Item
                                                                         {...restField}
                                                                         name={[name, "positionReferenceType"]}
                                                                         label="Loại tham chiếu"
                                                                         rules={[{ required: true, message: "Chọn chức danh hoặc cấp bậc" }]}
                                                                         style={{ marginBottom: 8 }}
                                                                     >
                                                                         <Select
                                                                             placeholder="Chọn loại"
                                                                             onChange={() => form.setFieldValue(["steps", name, "approverRefId"], undefined)}
                                                                             options={[
                                                                                 { value: "JOB_TITLE", label: "Chức danh" },
                                                                                 { value: "POSITION_LEVEL", label: "Cấp bậc" }
                                                                             ]}
                                                                         />
                                                                     </Form.Item>
                                                                     <Form.Item
                                                                         {...restField}
                                                                         name={[name, "approverRefId"]}
                                                                         label="Giá trị tham chiếu"
                                                                         rules={[{ required: true, message: "Chọn giá trị tham chiếu" }]}
                                                                         style={{ marginBottom: 8 }}
                                                                     >
                                                                         <Select
                                                                             placeholder={isJobTitle ? "Chọn chức danh" : "Chọn cấp bậc"}
                                                                             disabled={!referenceType}
                                                                             showSearch
                                                                             optionFilterProp="label"
                                                                             options={referenceOptions}
                                                                         />
                                                                     </Form.Item>
                                                                     <Form.Item
                                                                         {...restField}
                                                                         name={[name, "positionResolverScope"]}
                                                                         label="Phạm vi tìm người"
                                                                         rules={[{ required: true, message: "Chọn phạm vi tìm người" }]}
                                                                         style={{ marginBottom: 8, gridColumn: "span 2" }}
                                                                     >
                                                                         <Select
                                                                             placeholder="Chọn phạm vi"
                                                                             options={[
                                                                                 { value: "COMPANY", label: "Công ty áp dụng" },
                                                                                 { value: "REQUESTER_DEPARTMENT", label: "Phòng ban người lập" },
                                                                                 { value: "APPLIED_DEPARTMENT", label: "Phòng ban áp dụng" }
                                                                             ]}
                                                                         />
                                                                     </Form.Item>
                                                                     <div style={{ gridColumn: "1 / -1", padding: "8px 10px", borderRadius: 7, background: ACCENT_LIGHT, border: `1px solid ${ACCENT_BORDER}`, color: "#9f3d51", fontSize: 12 }}>
                                                                         Nếu có nhiều người khớp, bước duyệt sẽ vào hàng đợi để một người phù hợp nhận xử lý; hệ thống không tự chọn ngầm một người.
                                                                     </div>
                                                                 </div>
                                                             );
                                                         }
                                                         return <div />;
                                                     }}
                                                 </Form.Item>

                                                 <Form.Item
                                                     {...restField}
                                                     name={[name, "required"]}
                                                     valuePropName="checked"
                                                     label="Bắt buộc"
                                                 >
                                                     <Switch />
                                                 </Form.Item>

                                                 <div style={{ display: "flex", flexDirection: "column" }}>
                                                     <Form.Item label="Hạn xử lý" required style={{ marginBottom: 4 }}>
                                                         <Space.Compact style={{ width: "100%" }}>
                                                             <Form.Item
                                                                 {...restField}
                                                                 name={[name, "slaValue"]}
                                                                 noStyle
                                                                 rules={[{ required: true, message: "Nhập số" }]}
                                                             >
                                                                 <InputNumber min={1} style={{ flex: 1 }} />
                                                             </Form.Item>
                                                             <Form.Item
                                                                 {...restField}
                                                                 name={[name, "slaUnit"]}
                                                                 noStyle
                                                                 rules={[{ required: true }]}
                                                             >
                                                                 <Select style={{ width: 95 }} popupMatchSelectWidth={false}>
                                                                     <Select.Option value="minutes">phút</Select.Option>
                                                                     <Select.Option value="hours">giờ</Select.Option>
                                                                     <Select.Option value="days">ngày</Select.Option>
                                                                 </Select>
                                                             </Form.Item>
                                                         </Space.Compact>
                                                     </Form.Item>
                                                     <Form.Item
                                                         noStyle
                                                         shouldUpdate={(prevValues, currentValues) => {
                                                             return prevValues.steps?.[name]?.slaValue !== currentValues.steps?.[name]?.slaValue
                                                                 || prevValues.steps?.[name]?.slaUnit !== currentValues.steps?.[name]?.slaUnit;
                                                         }}
                                                     >
                                                         {({ getFieldValue }) => {
                                                             const val = getFieldValue(["steps", name, "slaValue"]);
                                                             const unit = getFieldValue(["steps", name, "slaUnit"]);
                                                             if (!val) return null;
                                                             let mins = val;
                                                             if (unit === "days") mins = val * 1440;
                                                             else if (unit === "hours") mins = val * 60;
                                                             return (
                                                                 <span style={{ fontSize: 11, color: "#8c8c8c", marginTop: -2, display: "block" }}>
                                                                     Quy đổi: {mins.toLocaleString()} phút
                                                                 </span>
                                                             );
                                                         }}
                                                     </Form.Item>
                                                 </div>
                                            </div>
                                        </div>
                                    ))}
                                    </div>
                                </div>
                                );
                            }}
                        </Form.List>
                    </Card>
                    )}
                </Form>
            </Modal>
        </PageContainer>
    );
};

export default WorkflowTemplatesPage;
