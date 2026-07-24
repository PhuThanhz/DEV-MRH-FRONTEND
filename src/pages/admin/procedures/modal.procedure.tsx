import React, { useEffect, useState } from "react";
import {
    ProFormText,
    ProFormSelect,
    ProFormSwitch,
} from "@ant-design/pro-components";
import { Col, Form, Row, Upload, Input, DatePicker, Button, Typography, Tag, Space } from "antd";
import {
    UploadOutlined, BankOutlined, ApartmentOutlined, LockOutlined,
    SaveOutlined, FileTextOutlined, DownOutlined, UpOutlined,
    CompressOutlined, ExpandOutlined, PaperClipOutlined, SafetyCertificateOutlined,
    FilePdfOutlined, DeleteOutlined, CloudUploadOutlined, CheckCircleOutlined,
} from "@ant-design/icons";
import type { UploadFile, UploadProps } from "antd";
import { notify } from "@/components/common/notification/notify";
import LotusDetailDrawer from "@/components/common/drawer/LotusDetailDrawer";

import { callUploadSingleFile } from "@/config/api";
import { useCompaniesQuery } from "@/hooks/useCompanies";
import { useDepartmentsByCompanyQuery } from "@/hooks/useDepartments";
import { useSectionsByDepartmentQuery } from "@/hooks/useSections";

import type {
    IProcedure, IProcedureRequest, ProcedureType,
    ICompany, IDepartment, ISection,
} from "@/types/backend";

import {
    useCreateProcedureMutation,
    useUpdateProcedureMutation,
} from "@/hooks/useProcedure";
import dayjs from "dayjs";
import UserSelectField from "./components/UserSelectField";
import useAccess from "@/hooks/useAccess";
import { ALL_PERMISSIONS } from "@/config/permissions";

const { Text } = Typography;

const ACCENT = "#e8637a";
const ACCENT_HOVER = "#d94c66";

const TYPE_OPTIONS = [
    {
        key: "COMPANY" as ProcedureType,
        label: "Công ty",
        icon: <BankOutlined />,
        activeBg: "#eff6ff",
        activeColor: "#1d4ed8",
        activeBorder: "#bfdbfe",
    },
    {
        key: "DEPARTMENT" as ProcedureType,
        label: "Phòng ban",
        icon: <ApartmentOutlined />,
        activeBg: "#f0fdf4",
        activeColor: "#15803d",
        activeBorder: "#bbf7d0",
    },
    {
        key: "CONFIDENTIAL" as ProcedureType,
        label: "Bảo mật",
        icon: <LockOutlined />,
        activeBg: "#fff1f2",
        activeColor: "#be123c",
        activeBorder: "#fecdd3",
    },
] as const;

const TypeSelector: React.FC<{
    value: ProcedureType;
    onChange: (v: ProcedureType) => void;
    disabled?: boolean;
    options?: typeof TYPE_OPTIONS[number][];
}> = ({ value, onChange, disabled, options = [...TYPE_OPTIONS] }) => (
    <div className="inline-flex gap-1.5 p-1 bg-slate-100 rounded-xl w-full">
        {options.map((opt) => {
            const isActive = value === opt.key;
            return (
                <button
                    key={opt.key}
                    type="button"
                    disabled={disabled}
                    onClick={() => !disabled && onChange(opt.key)}
                    className="flex-1 flex items-center justify-center gap-2 py-1.5 px-3 rounded-lg text-[13px] transition-all duration-150"
                    style={{
                        background: isActive ? "#ffffff" : "transparent",
                        color: isActive ? opt.activeColor : "#64748b",
                        fontWeight: isActive ? 600 : 500,
                        boxShadow: isActive ? "0 1px 3px rgba(0,0,0,0.06)" : "none",
                        border: isActive ? `1px solid ${opt.activeBorder}` : "1px solid transparent",
                        cursor: disabled ? "not-allowed" : "pointer",
                        opacity: disabled ? 0.6 : 1,
                    }}
                >
                    <span style={{ color: isActive ? opt.activeColor : "#94a3b8" }}>{opt.icon}</span>
                    {opt.label}
                </button>
            );
        })}
    </div>
);

type ProcedureTabType = "COMPANY" | "DEPARTMENT" | "CONFIDENTIAL";

const TYPE_PERMISSION_MAP: Record<ProcedureTabType, { method: string; apiPath: string; module: string }> = {
    COMPANY: ALL_PERMISSIONS.PROCEDURE_COMPANY.CREATE,
    DEPARTMENT: ALL_PERMISSIONS.PROCEDURE_DEPARTMENT.CREATE,
    CONFIDENTIAL: ALL_PERMISSIONS.PROCEDURE_CONFIDENTIAL.CREATE,
};

const TypeSelectorFiltered: React.FC<{
    value: ProcedureType;
    onChange: (v: ProcedureType) => void;
    disabled?: boolean;
}> = ({ value, onChange, disabled }) => {
    const canCompany = useAccess(TYPE_PERMISSION_MAP.COMPANY);
    const canDepartment = useAccess(TYPE_PERMISSION_MAP.DEPARTMENT);
    const canConfidential = useAccess(TYPE_PERMISSION_MAP.CONFIDENTIAL);

    const accessMap: Partial<Record<ProcedureType, boolean>> = {
        COMPANY: canCompany,
        DEPARTMENT: canDepartment,
        CONFIDENTIAL: canConfidential,
    };

    const visibleOptions = TYPE_OPTIONS.filter((opt) => accessMap[opt.key]);

    if (visibleOptions.length === 1) {
        const only = visibleOptions[0];
        return (
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg border text-[13px] font-semibold"
                style={{
                    borderColor: only.activeBorder,
                    background: only.activeBg,
                    color: only.activeColor,
                }}
            >
                {only.icon} {only.label}
            </div>
        );
    }

    return <TypeSelector value={value} onChange={onChange} disabled={disabled} options={visibleOptions} />;
};

const CollapsibleCard: React.FC<{
    title: string;
    summary?: React.ReactNode;
    isCollapsed: boolean;
    onToggle: () => void;
    children: React.ReactNode;
}> = ({ title, summary, isCollapsed, onToggle, children }) => (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden transition-all duration-200">
        <div
            onClick={onToggle}
            className="p-5 sm:px-6 flex items-center justify-between cursor-pointer hover:bg-slate-50/70 transition-colors select-none"
        >
            <div className="flex items-center gap-3 min-w-0 flex-1 pr-2">
                <span className="text-[13px] font-bold uppercase tracking-wider text-gray-900 flex items-center gap-2 shrink-0">
                    <span className="w-1.5 h-3 bg-[#e8637a] rounded-full inline-block" />
                    {title}
                </span>
                {isCollapsed && summary && (
                    <span className="text-xs text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-md font-medium truncate max-w-[280px]">
                        {summary}
                    </span>
                )}
            </div>

            <div className="flex items-center gap-1.5 text-slate-400 hover:text-slate-600 text-xs shrink-0 font-medium">
                <span>{isCollapsed ? "Mở rộng" : "Thu gọn"}</span>
                <span
                    className="transition-transform duration-200 inline-block text-[10px]"
                    style={{ transform: isCollapsed ? "rotate(180deg)" : "rotate(0deg)" }}
                >
                    ▼
                </span>
            </div>
        </div>

        {!isCollapsed && (
            <div className="px-5 sm:px-6 pb-6 pt-2 border-t border-gray-50 space-y-4">
                {children}
            </div>
        )}
    </div>
);

interface IProps {
    open: boolean;
    onClose: () => void;
    dataInit: IProcedure | null;
    refetch: () => void;
    fixedCompanyId?: number;
    fixedDepartmentId?: number;
    defaultType?: ProcedureType;
}

const ModalProcedure: React.FC<IProps> = ({
    open,
    onClose,
    dataInit,
    refetch,
    fixedCompanyId,
    fixedDepartmentId,
    defaultType = "COMPANY",
}) => {
    const [form] = Form.useForm();
    const [fileList, setFileList] = useState<UploadFile[]>([]);
    const [uploading, setUploading] = useState(false);
    const [companyId, setCompanyId] = useState<number | null>(null);
    const [departmentId, setDepartmentId] = useState<number | null>(null);
    const [procedureType, setProcedureType] = useState<ProcedureType>(defaultType);
    const [selectedUserCount, setSelectedUserCount] = useState(0);

    const { data: companiesData } = useCompaniesQuery("page=1&size=500", open);
    const companyOptions = (companiesData?.result ?? []).map((c: ICompany) => ({ label: c.name, value: c.id, title: c.name }));

    const { data: departmentsData = [] } = useDepartmentsByCompanyQuery(open && companyId ? companyId : 0);
    const departmentOptions = departmentsData.map((d: IDepartment) => ({ label: d.name, value: d.id, title: d.name }));

    const activeDeptId = departmentId ?? fixedDepartmentId ?? dataInit?.departmentId ?? null;
    const { data: sectionsData = [] } = useSectionsByDepartmentQuery(open && activeDeptId ? activeDeptId : 0);
    const sectionOptions = sectionsData.map((s: ISection) => ({ label: s.name, value: s.id, title: s.name }));

    const [collapsed, setCollapsed] = useState<Record<string, boolean>>({
        sec1: false,
        sec2: false,
        sec3: false,
    });

    const isEdit = Boolean(dataInit?.id);
    const createMutation = useCreateProcedureMutation(procedureType);
    const updateMutation = useUpdateProcedureMutation(procedureType);
    const activeType = TYPE_OPTIONS.find((t) => t.key === procedureType)!;

    useEffect(() => {
        if (!open) return;

        if (dataInit?.id) {
            setProcedureType(defaultType);
            const userIds = (dataInit as any).userIds ?? [];
            const urls = dataInit.fileUrls ?? [];

            const resolvedCompanyId =
                dataInit?.departments?.[0]?.companyId
                ?? dataInit.companyId
                ?? fixedCompanyId
                ?? null;
            const resolvedDepartmentId = dataInit.departmentId ?? fixedDepartmentId ?? null;

            setCompanyId(resolvedCompanyId);
            setDepartmentId(resolvedDepartmentId);
            setSelectedUserCount(userIds.length);

            form.setFieldsValue({
                procedureCode: dataInit.procedureCode ?? "",
                departmentId: dataInit.departmentId,
                departmentIds: (dataInit?.departments as any[])?.map((d: any) => d.id) ?? [],
                sectionId: dataInit.sectionId,
                procedureName: dataInit.procedureName,
                status: dataInit.status,
                planYear: dataInit.planYear,
                issuedDate: dataInit.issuedDate ? dayjs(dataInit.issuedDate) : null,
                note: dataInit.note,
                fileUrls: urls,
                active: dataInit.active,
                userIds,
            });

            setFileList(
                urls.map((name: string, i: number) => ({
                    uid: String(i),
                    name,
                    status: "done" as const,
                    url: `/api/v1/files?fileName=${encodeURIComponent(name)}&folder=procedures`,
                    response: name,
                }))
            );
        } else {
            form.resetFields();
            setFileList([]);
            setProcedureType(defaultType);
            setCompanyId(fixedCompanyId ?? null);
            setDepartmentId(fixedDepartmentId ?? null);
            setSelectedUserCount(0);
            if (fixedDepartmentId) form.setFieldValue("departmentId", fixedDepartmentId);
            form.setFieldValue("active", true);
            form.setFieldValue("fileUrls", []);
            setCollapsed({ sec1: false, sec2: false, sec3: false });
        }
    }, [open, dataInit]);

    const toggleSection = (key: string) => {
        setCollapsed((prev) => ({ ...prev, [key]: !prev[key] }));
    };

    const toggleAll = () => {
        const allCollapsed = Object.values(collapsed).every(Boolean);
        setCollapsed({
            sec1: !allCollapsed,
            sec2: !allCollapsed,
            sec3: !allCollapsed,
        });
    };

    const handleTypeChange = (val: ProcedureType) => {
        setProcedureType(val);
        setCompanyId(fixedCompanyId ?? null);
        setDepartmentId(fixedDepartmentId ?? null);
        setSelectedUserCount(0);
        form.resetFields([
            "companyId",
            "departmentId",
            "departmentIds",
            "sectionId",
            "userIds",
            "procedureCode",
            "fileUrls",
        ]);
        setFileList([]);
    };

    const handleReset = () => {
        form.resetFields();
        setFileList([]);
        setCompanyId(fixedCompanyId ?? null);
        setDepartmentId(fixedDepartmentId ?? null);
        setProcedureType(defaultType);
        setSelectedUserCount(0);
        setCollapsed({ sec1: false, sec2: false, sec3: false });
        onClose();
    };

    const submitForm = async (values: any) => {
        const newUserIds: string[] =
            procedureType === "CONFIDENTIAL" ? (values.userIds ?? []) : [];

        const payload: IProcedureRequest = {
            procedureCode: (values.procedureCode ?? "").trim().toUpperCase(),
            procedureName: values.procedureName,
            status: values.status,
            planYear: values.planYear ? Number(values.planYear) : undefined,
            issuedDate: values.issuedDate ? dayjs(values.issuedDate).toISOString() : undefined,
            fileUrls: values.fileUrls ?? [],
            note: values.note,
            active: values.active ?? true,
            departmentId: procedureType !== "DEPARTMENT"
                ? (values.departmentId ?? fixedDepartmentId ?? dataInit?.departmentId ?? null)
                : null,
            departmentIds: procedureType === "DEPARTMENT"
                ? (values.departmentIds ?? [])
                : null,
            sectionId: values.sectionId ?? null,
            userIds: newUserIds,
        };

        if (isEdit && dataInit?.id) {
            await updateMutation.mutateAsync({ id: dataInit.id, data: payload });
        } else {
            await createMutation.mutateAsync(payload);

            if (newUserIds.length > 0) {
                notify.success(`Tạo và chia sẻ cho ${newUserIds.length} người`);
            } else {
                notify.success("Tạo quy trình thành công");
            }
        }

        refetch();
        handleReset();
    };



    const uploadProps: UploadProps = {
        multiple: true,
        fileList,
        showUploadList: false,
        accept: ".pdf,.doc,.docx,.xls,.xlsx",
        beforeUpload: async (file) => {
            const allowed = [
                "application/pdf",
                "application/msword",
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                "application/vnd.ms-excel",
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            ];
            if (!allowed.includes(file.type)) {
                notify.warning("Chỉ chấp nhận tệp PDF, Word, Excel.");
                return Upload.LIST_IGNORE;
            }

            const tempUid = file.uid || `${Date.now()}-${Math.random()}`;
            setFileList((prev) => [...prev, { uid: tempUid, name: file.name, status: "uploading" }]);

            try {
                setUploading(true);
                const res = await callUploadSingleFile(file, "procedures");
                const fileName = res?.data?.fileName;
                if (!fileName) throw new Error("Upload thất bại");

                setFileList((prev) =>
                    prev.map((f) =>
                        f.uid === tempUid
                            ? {
                                ...f,
                                status: "done" as const,
                                url: `/api/v1/files?fileName=${encodeURIComponent(fileName)}&folder=procedures`,
                                response: fileName,
                            }
                            : f
                    )
                );

                const current: string[] = form.getFieldValue("fileUrls") ?? [];
                form.setFieldValue("fileUrls", [...current, fileName]);
                notify.success(`Tải tệp ${file.name} thành công.`);
            } catch {
                setFileList((prev) => prev.filter((f) => f.uid !== tempUid));
                notify.error("Không thể tải tệp lên.");
            } finally {
                setUploading(false);
            }

            return false;
        },
    };

    const handleRemoveFile = (fileUid: string, fileName?: string) => {
        setFileList((prev) => prev.filter((f) => f.uid !== fileUid));
        const removed = fileName ?? fileUid;
        const current: string[] = form.getFieldValue("fileUrls") ?? [];
        form.setFieldValue("fileUrls", current.filter((u) => u !== removed));
    };

    const isLoading = createMutation.isPending || updateMutation.isPending || uploading;
    const allCollapsed = Object.values(collapsed).every(Boolean);

    const watchedCode = Form.useWatch("procedureCode", form);
    const watchedName = Form.useWatch("procedureName", form);
    const watchedFileUrls = Form.useWatch("fileUrls", form) ?? fileList;

    const summarySec1 = `${activeType.label}`;
    const summarySec2 = watchedCode || watchedName ? `${watchedCode ?? ""} ${watchedName ? "• " + watchedName : ""}` : "Chưa điền thông tin";
    const summarySec3 = fileList.length > 0 ? `${fileList.length} tệp đính kèm` : "Chưa có đính kèm";

    return (
        <LotusDetailDrawer
            open={open}
            onClose={handleReset}
            destroyOnClose={true}
            keyboard={false}
            maskClosable={false}
        >
            <Form
                form={form}
                layout="vertical"
                onFinish={submitForm}
                className="flex flex-col h-full bg-[#f8f9fb]"
            >
                {/* ── HEADER ── */}
                <div className="bg-white border-b border-gray-100 p-5 sm:px-8 flex items-start justify-between gap-4 flex-wrap shrink-0">
                    <div className="min-w-0 flex-1">
                        <Text className="text-[11px] uppercase font-semibold flex items-center gap-1.5" style={{ color: ACCENT }}>
                            <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: ACCENT }} />
                            Tài liệu & Quy định
                        </Text>
                        <div className="mt-2 flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1">
                            <h2 className="m-0 min-w-0 text-[26px] sm:text-[30px] font-bold leading-9 text-gray-950">
                                {isEdit ? "Cập nhật quy trình" : "Tạo quy trình mới"}
                            </h2>
                            <Tag
                                className="!m-0 shrink-0 border-0"
                                style={{
                                    background: activeType.activeBg,
                                    color: activeType.activeColor,
                                    borderRadius: 6,
                                    fontSize: 13,
                                    fontWeight: 600,
                                    lineHeight: "24px",
                                    padding: "0 10px",
                                }}
                            >
                                {activeType.icon} <span className="ml-1">{activeType.label}</span>
                            </Tag>
                        </div>
                    </div>

                    <Space size={10} className="shrink-0 pt-1">
                        <Button
                            onClick={toggleAll}
                            icon={allCollapsed ? <ExpandOutlined /> : <CompressOutlined />}
                            className="!rounded-lg !px-4 !h-10 !text-[13px] !border-slate-200"
                        >
                            {allCollapsed ? "Mở rộng tất cả" : "Thu gọn tất cả"}
                        </Button>

                        <Button
                            onClick={handleReset}
                            className="!rounded-lg !px-5 !h-10 !text-[13px]"
                        >
                            Huỷ
                        </Button>
                        <Button
                            type="primary"
                            htmlType="submit"
                            loading={isLoading}
                            disabled={uploading}
                            className="!rounded-lg !px-6 !h-10 !text-[13px] !font-semibold !shadow-sm flex items-center gap-1.5"
                            style={{
                                background: ACCENT,
                                borderColor: ACCENT,
                            }}
                            onMouseEnter={(e: React.MouseEvent<HTMLButtonElement>) => {
                                (e.currentTarget as HTMLButtonElement).style.background = ACCENT_HOVER;
                                (e.currentTarget as HTMLButtonElement).style.borderColor = ACCENT_HOVER;
                            }}
                            onMouseLeave={(e: React.MouseEvent<HTMLButtonElement>) => {
                                (e.currentTarget as HTMLButtonElement).style.background = ACCENT;
                                (e.currentTarget as HTMLButtonElement).style.borderColor = ACCENT;
                            }}
                        >
                            <SaveOutlined />
                            {isEdit ? "Cập nhật quy trình" : "Lưu quy trình"}
                        </Button>
                    </Space>
                </div>

                {/* ── BODY (BALANCED 2-COLUMN SPLIT WORKSPACE) ── */}
                <div className="p-5 sm:px-8 sm:py-7 pb-14 bg-[#f8f9fb] flex-1 min-h-0 overflow-auto">
                    <Form.Item name="fileUrls" hidden>
                        <Input />
                    </Form.Item>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                        {/* LEFT COLUMN: FORM INPUTS (7 cols) */}
                        <div className="lg:col-span-7 space-y-5">
                            {/* CARD 1: PHẠM VI ÁP DỤNG */}
                            <CollapsibleCard
                                title="Phạm vi & Đơn vị áp dụng"
                                summary={summarySec1}
                                isCollapsed={collapsed.sec1}
                                onToggle={() => toggleSection("sec1")}
                            >
                                <Form.Item label="Loại quy trình" className="!mb-5">
                                    <TypeSelectorFiltered
                                        value={procedureType}
                                        onChange={handleTypeChange}
                                        disabled={isEdit}
                                    />
                                </Form.Item>

                                <Row gutter={[16, 16]}>
                                    {!fixedCompanyId && (
                                        <Col xs={24} lg={12}>
                                            {isEdit ? (
                                                <Form.Item label="Công ty" style={{ marginBottom: 0 }}>
                                                    <Input
                                                        value={
                                                            dataInit?.departments?.[0]?.companyName
                                                            ?? dataInit?.companyName ?? ""
                                                        }
                                                        disabled
                                                        className="!bg-gray-50 !border-gray-200 !rounded-lg"
                                                    />
                                                </Form.Item>
                                            ) : (
                                                <ProFormSelect
                                                    name="companyId"
                                                    label="Công ty"
                                                    options={companyOptions}
                                                    rules={[{ required: true, message: "Chọn công ty" }]}
                                                    fieldProps={{
                                                        showSearch: true,
                                                        optionFilterProp: "label",
                                                        popupMatchSelectWidth: false,
                                                        styles: { popup: { root: { minWidth: 450, maxWidth: 800 } } },
                                                        optionRender: (option) => (
                                                            <div className="py-1 text-[13px] leading-relaxed whitespace-normal break-words font-medium text-slate-800">
                                                                {option.label}
                                                            </div>
                                                        ),
                                                        onChange: (val) => {
                                                            setCompanyId(val as number);
                                                            setDepartmentId(null);
                                                            setSelectedUserCount(0);
                                                            form.setFieldValue("departmentId", null);
                                                            form.setFieldValue("sectionId", null);
                                                            form.setFieldValue("userIds", []);
                                                        },
                                                    }}
                                                />
                                            )}
                                        </Col>
                                    )}
                                    <Col xs={24} lg={fixedCompanyId ? 12 : 12}>
                                        {fixedDepartmentId ? (
                                            <Form.Item label="Phòng ban" style={{ marginBottom: 0 }}>
                                                <Input
                                                    value={`Phòng ban #${fixedDepartmentId}`}
                                                    disabled
                                                    className="!bg-gray-50 !border-gray-200 !rounded-lg"
                                                />
                                            </Form.Item>
                                        ) : isEdit && procedureType !== "DEPARTMENT" ? (
                                            <Form.Item label="Phòng ban" style={{ marginBottom: 0 }}>
                                                <Input
                                                    value={dataInit?.departmentName ?? ""}
                                                    disabled
                                                    className="!bg-gray-50 !border-gray-200 !rounded-lg"
                                                />
                                            </Form.Item>
                                        ) : procedureType === "DEPARTMENT" ? (
                                            <ProFormSelect
                                                name="departmentIds"
                                                label="Phòng ban"
                                                options={departmentOptions}
                                                rules={[{ required: true, message: "Chọn ít nhất 1 phòng ban" }]}
                                                fieldProps={{
                                                    mode: "multiple",
                                                    allowClear: true,
                                                    showSearch: true,
                                                    optionFilterProp: "label",
                                                    popupMatchSelectWidth: false,
                                                    styles: { popup: { root: { minWidth: 350, maxWidth: 650 } } },
                                                    optionRender: (option) => (
                                                        <div className="py-1 text-[13px] leading-relaxed whitespace-normal break-words font-medium text-slate-800">
                                                            {option.label}
                                                        </div>
                                                    ),
                                                    tagRender: (props) => {
                                                        const { label, onClose } = props;
                                                        return (
                                                            <span className="inline-flex items-center gap-1.5 m-0.5 px-2.5 py-0.5 rounded-md bg-gray-100 border border-gray-200 text-gray-700 text-[12px] font-medium">
                                                                {label}
                                                                <span onClick={onClose} className="cursor-pointer text-gray-400 hover:text-gray-600 text-sm font-bold">×</span>
                                                            </span>
                                                        );
                                                    },
                                                }}
                                            />
                                        ) : (
                                            <ProFormSelect
                                                name="departmentId"
                                                label="Phòng ban"
                                                options={departmentOptions}
                                                rules={[{ required: procedureType === "CONFIDENTIAL", message: "Chọn phòng ban" }]}
                                                fieldProps={{
                                                    allowClear: true,
                                                    showSearch: true,
                                                    optionFilterProp: "label",
                                                    popupMatchSelectWidth: false,
                                                    styles: { popup: { root: { minWidth: 350, maxWidth: 650 } } },
                                                    optionRender: (option) => (
                                                        <div className="py-1 text-[13px] leading-relaxed whitespace-normal break-words font-medium text-slate-800">
                                                            {option.label}
                                                        </div>
                                                    ),
                                                    onChange: (val) => {
                                                        setDepartmentId(val as number);
                                                        form.setFieldValue("sectionId", null);
                                                    },
                                                }}
                                            />
                                        )}
                                    </Col>
                                    <Col xs={24} lg={12}>
                                        <ProFormSelect
                                            name="sectionId"
                                            label="Bộ phận"
                                            options={sectionOptions}
                                            fieldProps={{
                                                allowClear: true,
                                                showSearch: true,
                                                optionFilterProp: "label",
                                                popupMatchSelectWidth: false,
                                                styles: { popup: { root: { minWidth: 300, maxWidth: 550 } } },
                                                optionRender: (option) => (
                                                    <div className="py-1 text-[13px] leading-relaxed whitespace-normal break-words font-medium text-slate-800">
                                                        {option.label}
                                                    </div>
                                                ),
                                            }}
                                        />
                                    </Col>
                                </Row>
                            </CollapsibleCard>

                            {/* CARD 2: THÔNG TIN CHI TIẾT QUY TRÌNH & GHI CHÚ */}
                            <CollapsibleCard
                                title="Mã hiệu & Tên quy trình"
                                summary={summarySec2}
                                isCollapsed={collapsed.sec2}
                                onToggle={() => toggleSection("sec2")}
                            >
                                <Row gutter={[16, 16]}>
                                    <Col xs={24} md={8}>
                                        <ProFormText
                                            name="procedureCode"
                                            label="Mã quy trình"
                                            rules={[{ required: true, message: "Nhập mã quy trình" }]}
                                            placeholder="VD: QT-001"
                                            fieldProps={{ style: { textTransform: "uppercase" } }}
                                        />
                                    </Col>
                                    <Col xs={24} md={16}>
                                        <ProFormText
                                            name="procedureName"
                                            label="Tên quy trình"
                                            rules={[{ required: true, message: "Nhập tên quy trình" }]}
                                            placeholder="Nhập tên quy trình..."
                                        />
                                    </Col>
                                </Row>

                                <Row gutter={[16, 16]}>
                                    <Col xs={24} md={8}>
                                        <ProFormSelect
                                            name="status"
                                            label="Trạng thái"
                                            valueEnum={{
                                                NEED_CREATE: "Cần xây dựng",
                                                IN_PROGRESS: "Đang hiệu lực",
                                                NEED_UPDATE: "Đang cập nhật",
                                                TERMINATED: "Hết hiệu lực",
                                            }}
                                        />
                                    </Col>
                                    <Col xs={24} md={8}>
                                        <ProFormText name="planYear" label="Năm kế hoạch" fieldProps={{ type: "number" }} placeholder="2026" />
                                    </Col>
                                    <Col xs={24} md={8}>
                                        <Form.Item name="issuedDate" label="Ngày ban hành" style={{ marginBottom: 0 }}>
                                            <DatePicker style={{ width: "100%" }} format="DD/MM/YYYY" placeholder="Chọn ngày" />
                                        </Form.Item>
                                    </Col>
                                </Row>

                                <Form.Item label="Ghi chú & Mô tả" style={{ marginTop: 8, marginBottom: 0 }}>
                                    <Input.TextArea
                                        rows={3}
                                        placeholder="Ghi chú hoặc hướng dẫn vận hành bổ sung cho quy trình này..."
                                        className="!rounded-lg"
                                    />
                                </Form.Item>
                            </CollapsibleCard>
                        </div>

                        {/* RIGHT COLUMN: UPLOAD & PERMISSIONS (5 cols) */}
                        <div className="lg:col-span-5 space-y-5">
                            {/* CARD 3: TÀI LIỆU ĐÍNH KÈM & BẢO MẬT */}
                            <CollapsibleCard
                                title="Tài liệu đính kèm"
                                summary={summarySec3}
                                isCollapsed={collapsed.sec3}
                                onToggle={() => toggleSection("sec3")}
                            >
                                <Form.Item label="File quy trình chính thức" style={{ marginBottom: 0 }}>
                                    <Upload {...uploadProps} className="w-full block" style={{ width: "100%" }}>
                                        <div
                                            className="w-full border-2 border-dashed border-slate-200/90 rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer bg-slate-50/50 hover:bg-white hover:border-[#e8637a] hover:shadow-sm transition-all duration-200 group"
                                        >
                                            <div className="w-12 h-12 rounded-2xl bg-pink-50 text-[#e8637a] flex items-center justify-center text-xl shadow-xs mb-3 group-hover:scale-105 transition-transform">
                                                <CloudUploadOutlined />
                                            </div>
                                            <div className="text-[13px] font-bold text-slate-800 group-hover:text-[#e8637a] transition-colors">
                                                {uploading ? "Đang tải tệp lên hệ thống..." : "Kéo thả tệp hoặc nhấp để tải lên"}
                                            </div>
                                            <div className="text-[11px] text-slate-400 mt-1">
                                                Tải lên văn bản (.pdf, .docx, .xlsx)
                                            </div>
                                            <div className="flex gap-1.5 justify-center mt-3">
                                                <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-500 font-mono text-[10px] font-semibold">PDF</span>
                                                <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-500 font-mono text-[10px] font-semibold">DOCX</span>
                                                <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-500 font-mono text-[10px] font-semibold">XLSX</span>
                                            </div>
                                        </div>
                                    </Upload>

                                    {/* UPLOADED FILES LIST */}
                                    {fileList.length > 0 && (
                                        <div className="mt-3.5 space-y-2">
                                            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                                                Tệp đã đính kèm ({fileList.length})
                                            </div>
                                            {fileList.map((file) => {
                                                const fileName = file.response ?? file.name;
                                                return (
                                                    <div
                                                        key={file.uid}
                                                        className="flex items-center justify-between p-3 rounded-xl bg-white border border-slate-200/80 shadow-2xs hover:border-slate-300 transition-all"
                                                    >
                                                        <div className="flex items-center gap-2.5 min-w-0 flex-1 pr-2">
                                                            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center text-sm shrink-0">
                                                                <FileTextOutlined />
                                                            </div>
                                                            <div className="min-w-0 flex-1">
                                                                <div className="text-[13px] font-medium text-slate-800 truncate" title={fileName}>
                                                                    {fileName}
                                                                </div>
                                                                <div className="text-[11px] text-slate-400 flex items-center gap-1">
                                                                    <CheckCircleOutlined className="text-emerald-500 text-[10px]" />
                                                                    <span>Sẵn sàng</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <Button
                                                            type="text"
                                                            danger
                                                            size="small"
                                                            icon={<DeleteOutlined />}
                                                            onClick={() => handleRemoveFile(file.uid, fileName)}
                                                            className="shrink-0 hover:!bg-red-50"
                                                        />
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </Form.Item>

                                {procedureType === "CONFIDENTIAL" && (
                                    <div className="pt-4 mt-2 border-t border-slate-100 space-y-3">
                                        <div className="flex items-center gap-2 mb-1">
                                            <SafetyCertificateOutlined className="text-[#e8637a]" />
                                            <span className="text-xs font-bold uppercase tracking-wider text-slate-800">
                                                Phân quyền xem bảo mật
                                            </span>
                                        </div>
                                        <UserSelectField
                                            companyId={companyId}
                                            selectedUserCount={selectedUserCount}
                                            onCountChange={setSelectedUserCount}
                                        />
                                    </div>
                                )}
                            </CollapsibleCard>
                        </div>
                    </div>
                </div>
            </Form>
        </LotusDetailDrawer>
    );
};

export default ModalProcedure;
