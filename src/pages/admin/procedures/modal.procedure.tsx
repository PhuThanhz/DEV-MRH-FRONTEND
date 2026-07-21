import React, { useEffect, useState } from "react";
import {
    ModalForm,
    ProFormText,
    ProFormSelect,
    ProFormSwitch,
} from "@ant-design/pro-components";
import { Col, Form, Row, Upload, Input, DatePicker } from "antd";
import {
    UploadOutlined, BankOutlined, ApartmentOutlined, LockOutlined,
} from "@ant-design/icons";
import type { UploadFile, UploadProps } from "antd";
import { notify } from "@/components/common/notification/notify";

import {
    callFetchCompany,
    callFetchDepartmentsByCompany,
    callFetchSectionsByDepartment,
    callUploadSingleFile,
    callShareProcedure,

} from "@/config/api";

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
import { getModalWidth } from "@/utils/responsive";

const PINK = "#e91e8c";
const PINK_HOVER = "#c4177a";

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
    <div style={{
        display: "flex", gap: 6, flexWrap: "wrap",
        background: "#f3f4f6", borderRadius: 10, padding: 4,
    }}>
        {options.map((opt) => {
            const isActive = value === opt.key;
            return (
                <button
                    key={opt.key}
                    type="button"
                    disabled={disabled}
                    onClick={() => !disabled && onChange(opt.key)}
                    style={{
                        flex: 1,
                        minWidth: 80,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 6,
                        padding: "7px 12px",
                        borderRadius: 7,
                        border: "none",
                        background: isActive
                            ? "linear-gradient(135deg,#f5317f,#ff6aaa)"
                            : "transparent",
                        color: isActive ? "#fff" : "#6b7280",
                        fontSize: 13,
                        fontWeight: isActive ? 600 : 500,
                        cursor: disabled ? "not-allowed" : "pointer",
                        opacity: disabled ? 0.55 : 1,
                        transition: "all 0.18s ease",
                        letterSpacing: "-0.01em",
                        whiteSpace: "nowrap",
                        boxShadow: isActive
                            ? "0 2px 8px rgba(245,49,127,0.30)"
                            : "none",
                    }}
                >
                    {opt.icon}
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
            <div style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                padding: "6px 14px", borderRadius: 9,
                border: `1.5px solid ${only.activeBorder}`,
                background: only.activeBg,
                color: only.activeColor,
                fontSize: 13, fontWeight: 600,
            }}>
                {only.icon} {only.label}
            </div>
        );
    }

    return <TypeSelector value={value} onChange={onChange} disabled={disabled} options={visibleOptions} />;
};

const Divider = () => (
    <div style={{ height: 1, background: "#f5f5f7", margin: "4px 0" }} />
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

            // ✅ FIX UUID: Set companyId VÀ departmentId TRƯỚC khi setFieldsValue
            // để UserSelectField có companyId ngay từ đầu → load userMap đúng
            // → tags hiển thị tên thay vì UUID
            const resolvedCompanyId =
                dataInit?.departments?.[0]?.companyId  // ✅ lấy từ departments
                ?? dataInit.companyId
                ?? fixedCompanyId
                ?? null; const resolvedDepartmentId = dataInit.departmentId ?? fixedDepartmentId ?? null;

            setCompanyId(resolvedCompanyId);
            setDepartmentId(resolvedDepartmentId);
            setSelectedUserCount(userIds.length);

            form.setFieldsValue({
                procedureCode: dataInit.procedureCode ?? "",
                departmentId: dataInit.departmentId,
                // ✅ THÊM — set lại danh sách phòng ban khi edit
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
        }
    }, [open, dataInit]);

    const handleTypeChange = (val: ProcedureType) => {
        setProcedureType(val);
        setCompanyId(fixedCompanyId ?? null);
        setDepartmentId(fixedDepartmentId ?? null);
        setSelectedUserCount(0);
        form.setFieldValue("companyId", undefined);
        form.setFieldValue("departmentId", undefined);
        form.setFieldValue("departmentIds", undefined); // ✅ THÊM
        form.setFieldValue("sectionId", undefined);
        form.setFieldValue("userIds", []);
        form.setFieldValue("procedureCode", "");
        setFileList([]);
    };

    const handleReset = () => {
        form.resetFields();
        setFileList([]);
        setCompanyId(fixedCompanyId ?? null);
        setDepartmentId(fixedDepartmentId ?? null);
        setProcedureType(defaultType);
        setSelectedUserCount(0);
        onClose();
    };

    // ─────────────────────────────────────────────
    // SYNC SHARE / REVOKE khi EDIT quy trình CONFIDENTIAL
    //
    // Flow:
    // 1. Lấy access list hiện tại từ server (những người đang có quyền)
    // 2. So sánh với danh sách mới user chọn trong form
    // 3. Share những người mới thêm vào
    // 4. Revoke từng người bị bỏ ra
    // ─────────────────────────────────────────────


    // ─────────────────────────────────────────────
    // SUBMIT FORM
    //
    // FIX DUPLICATE LOG:
    // - CREATE: backend handleCreate đã gọi saveAccessList(logShare=false)
    //   → KHÔNG ghi log → frontend gọi callShareProcedure để ghi log 1 lần duy nhất ✅
    // - EDIT: gọi syncAccessList để so sánh cũ/mới và share/revoke tương ứng
    // ─────────────────────────────────────────────
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
            // ✅ Phân biệt theo type
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
            // EDIT: backend syncAccessList tự xử lý share/revoke + ghi log
            await updateMutation.mutateAsync({ id: dataInit.id, data: payload });
        } else {
            // CREATE: backend đã tự SHARE + ghi log
            // frontend KHÔNG cần gọi callShareProcedure nữa
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

    const loadCompanies = async () => {
        const res = await callFetchCompany("page=1&size=500");
        return res?.data?.result?.map((c: ICompany) => ({ label: c.name, value: c.id })) || [];
    };

    const loadDepartments = async ({ companyId }: any) => {
        if (!companyId) return [];
        const res = await callFetchDepartmentsByCompany(companyId);
        return (res?.data ?? []).map((d: IDepartment) => ({ label: d.name, value: d.id }));
    };

    const loadSections = async ({ departmentId }: any) => {
        if (!departmentId) return [];
        const res = await callFetchSectionsByDepartment(departmentId);
        return (res?.data ?? []).map((s: ISection) => ({ label: s.name, value: s.id }));
    };

    const uploadProps: UploadProps = {
        multiple: true,
        fileList,
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
        onRemove: (file) => {
            setFileList((prev) => prev.filter((f) => f.uid !== file.uid));
            const removed = (file as any).response ?? file.name;
            const current: string[] = form.getFieldValue("fileUrls") ?? [];
            form.setFieldValue("fileUrls", current.filter((u) => u !== removed));
        },
    };

    const isLoading = createMutation.isPending || updateMutation.isPending || uploading;

    return (
        <ModalForm
            title={
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontSize: 16, fontWeight: 600, color: "#1c1c1e", letterSpacing: "-0.025em" }}>
                        {isEdit ? "Cập nhật quy trình" : "Tạo quy trình mới"}
                    </span>
                    <span style={{
                        display: "inline-flex", alignItems: "center", gap: 5,
                        fontSize: 11, fontWeight: 500,
                        padding: "3px 9px", borderRadius: 999,
                        background: activeType.activeBg,
                        color: activeType.activeColor,
                        border: `1px solid ${activeType.activeBorder}`,
                    }}>
                        {activeType.icon} {activeType.label}
                    </span>
                </div>
            }
            open={open}
            form={form}
            onFinish={submitForm}
            width={getModalWidth(820)}
            layout="vertical"
            submitter={{
                searchConfig: {
                    submitText: isEdit ? "Cập nhật" : "Tạo quy trình",
                    resetText: "Huỷ",
                },
                resetButtonProps: { style: { borderRadius: 8 } },
                submitButtonProps: {
                    loading: isLoading,
                    disabled: uploading,
                    style: {
                        borderRadius: 8,
                        background: PINK,
                        borderColor: PINK,
                        fontWeight: 500,
                    },
                    onMouseEnter: (e: React.MouseEvent<HTMLButtonElement>) => {
                        (e.currentTarget as HTMLButtonElement).style.background = PINK_HOVER;
                        (e.currentTarget as HTMLButtonElement).style.borderColor = PINK_HOVER;
                    },
                    onMouseLeave: (e: React.MouseEvent<HTMLButtonElement>) => {
                        (e.currentTarget as HTMLButtonElement).style.background = PINK;
                        (e.currentTarget as HTMLButtonElement).style.borderColor = PINK;
                    },
                },
            }}
            modalProps={{
                onCancel: handleReset,
                destroyOnHidden: true,
                maskClosable: false,
                className: "procedure-form-modal",
                styles: { body: { padding: "20px 24px" } },
            }}
        >
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

                <Form.Item name="fileUrls" hidden>
                    <Input />
                </Form.Item>

                <Form.Item label="Loại quy trình" style={{ marginBottom: 0 }}>
                    <TypeSelectorFiltered
                        value={procedureType}
                        onChange={handleTypeChange}
                        disabled={isEdit}
                    />
                </Form.Item>

                <Divider />

                {/* Row 1: Công ty + Phòng ban + Bộ phận */}
                <Row gutter={12}>
                    {!fixedCompanyId && (
                        <Col xs={24} md={8} lg={8}>
                            {isEdit ? (
                                <Form.Item label="Công ty" style={{ marginBottom: 0 }}>
                                    <Input value={
                                        dataInit?.departments?.[0]?.companyName
                                        ?? dataInit?.companyName ?? ""
                                    } disabled style={{ background: "#f9fafb", borderColor: "#e5e7eb", borderRadius: 8 }} />
                                </Form.Item>
                            ) : (
                                <ProFormSelect
                                    name="companyId" label="Công ty"
                                    request={loadCompanies}
                                    rules={[{ required: true, message: "Chọn công ty" }]}
                                    fieldProps={{
                                        showSearch: true, optionFilterProp: "label",
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
                    <Col xs={24} md={fixedCompanyId ? 12 : 8} lg={fixedCompanyId ? 12 : 8}>
                        {fixedDepartmentId ? (
                            <Form.Item label="Phòng ban" style={{ marginBottom: 0 }}>
                                <Input value={`Phòng ban #${fixedDepartmentId}`} disabled
                                    style={{ background: "#f9fafb", borderColor: "#e5e7eb", borderRadius: 8 }} />
                            </Form.Item>
                        ) : isEdit && procedureType !== "DEPARTMENT" ? (
                            <Form.Item label="Phòng ban" style={{ marginBottom: 0 }}>
                                <Input value={dataInit?.departmentName ?? ""} disabled
                                    style={{ background: "#f9fafb", borderColor: "#e5e7eb", borderRadius: 8 }} />
                            </Form.Item>
                        ) : procedureType === "DEPARTMENT" ? (
                            <ProFormSelect
                                name="departmentIds" label="Phòng ban"
                                request={loadDepartments} params={{ companyId }}
                                rules={[{ required: true, message: "Chọn ít nhất 1 phòng ban" }]}
                                fieldProps={{
                                    mode: "multiple", allowClear: true,
                                    showSearch: true, optionFilterProp: "label",
                                    tagRender: (props) => {
                                        const { label, onClose } = props;
                                        return (
                                            <span style={{
                                                display: "inline-flex", alignItems: "center", gap: 4,
                                                margin: "2px 3px", padding: "2px 10px",
                                                borderRadius: 6, background: "#f5f5f5",
                                                border: "1px solid #e5e7eb", color: "#374151",
                                                fontSize: 12, fontWeight: 500,
                                            }}>
                                                {label}
                                                <span onClick={onClose} style={{ cursor: "pointer", color: "#9ca3af", fontSize: 14, lineHeight: 1, marginLeft: 2 }}>×</span>
                                            </span>
                                        );
                                    },
                                }}
                            />
                        ) : (
                            <ProFormSelect
                                name="departmentId" label="Phòng ban"
                                request={loadDepartments} params={{ companyId }}
                                rules={[{ required: procedureType === "CONFIDENTIAL", message: "Chọn phòng ban" }]}
                                fieldProps={{
                                    allowClear: true,
                                    onChange: (val) => {
                                        setDepartmentId(val as number);
                                        form.setFieldValue("sectionId", null);
                                    },
                                }}
                            />
                        )}
                    </Col>
                    <Col xs={24} md={8} lg={fixedCompanyId ? 12 : 8}>
                        <ProFormSelect
                            name="sectionId" label="Bộ phận"
                            request={loadSections}
                            params={{ departmentId: departmentId ?? fixedDepartmentId ?? dataInit?.departmentId }}
                            fieldProps={{ allowClear: true }}
                        />
                    </Col>
                </Row>

                {/* Row 2: Mã + Tên + Trạng thái + Năm + Ngày */}
                <Row gutter={12}>
                    <Col xs={24} md={8} lg={5}>
                        <ProFormText
                            name="procedureCode" label="Mã quy trình"
                            rules={[{ required: true, message: "Nhập mã" }]}
                            placeholder="VD: QT-001"
                            fieldProps={{ style: { textTransform: "uppercase" } }}
                        />
                    </Col>
                    <Col xs={24} md={16} lg={6}>
                        <ProFormText
                            name="procedureName" label="Tên quy trình"
                            rules={[{ required: true, message: "Nhập tên quy trình" }]}
                            placeholder="Nhập tên quy trình..."
                        />
                    </Col>
                    <Col xs={24} md={8} lg={5}>
                        <ProFormSelect
                            name="status" label="Trạng thái"
                            valueEnum={{
                                NEED_CREATE: "Cần xây dựng",
                                IN_PROGRESS: "Đang hiệu lực",
                                NEED_UPDATE: "Đang cập nhật",
                                TERMINATED: "Hết hiệu lực",
                            }}
                        />
                    </Col>
                    <Col xs={24} md={8} lg={3}>
                        <ProFormText name="planYear" label="Năm" fieldProps={{ type: "number" }} placeholder="2026" />
                    </Col>
                    <Col xs={24} md={8} lg={5}>
                        <Form.Item name="issuedDate" label="Ngày ban hành">
                            <DatePicker style={{ width: "100%" }} format="DD/MM/YYYY" placeholder="Chọn ngày" />
                        </Form.Item>
                    </Col>
                </Row>

                <Col xs={24} lg={6} style={{ display: "none" }}>
                    <ProFormSwitch name="active" label="Kích hoạt" initialValue={true} />
                </Col>

                <Divider />

                {/* Row 3: File + Ghi chú / UserSelect */}
                <Row gutter={12} align="top">
                    <Col xs={24} md={procedureType === "CONFIDENTIAL" ? 10 : 24} lg={procedureType === "CONFIDENTIAL" ? 10 : 14}>
                        <Form.Item label="File quy trình" style={{ marginBottom: 0 }}>
                            <Upload {...uploadProps}>
                                <div style={{
                                    border: "1.5px dashed #e5e7eb", borderRadius: 10,
                                    padding: "10px 14px", display: "flex", alignItems: "center", gap: 10,
                                    cursor: "pointer", background: uploading ? "#f0fdf4" : "#fafafa",
                                    transition: "border-color .15s",
                                }}
                                    onMouseEnter={e => { if (!uploading) (e.currentTarget as HTMLDivElement).style.borderColor = PINK; }}
                                    onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = "#e5e7eb"; }}
                                >
                                    <UploadOutlined style={{ fontSize: 18, color: uploading ? "#16a34a" : PINK, flexShrink: 0 }} />
                                    <div>
                                        <div style={{ fontSize: 13, fontWeight: 500, color: uploading ? "#16a34a" : "#374151" }}>
                                            {uploading ? "Đang tải lên..." : "Đính kèm file"}
                                        </div>
                                        <div style={{ fontSize: 11, color: "#9ca3af" }}>PDF · Word · Excel</div>
                                    </div>
                                </div>
                            </Upload>
                        </Form.Item>
                    </Col>
                    <Col xs={24} md={procedureType === "CONFIDENTIAL" ? 14 : 24} lg={procedureType === "CONFIDENTIAL" ? 14 : 10}>
                        {procedureType === "CONFIDENTIAL" ? (
                            <UserSelectField
                                companyId={companyId}
                                selectedUserCount={selectedUserCount}
                                onCountChange={setSelectedUserCount}
                            />
                        ) : (
                            <Form.Item label="Ghi chú" style={{ marginBottom: 0 }}>
                                <ProFormText name="note" noStyle placeholder="Ghi chú nếu cần..." />
                            </Form.Item>
                        )}
                    </Col>
                </Row>

                {procedureType === "CONFIDENTIAL" && (
                    <Row gutter={12}>
                        <Col xs={24}>
                            <Form.Item label="Ghi chú" style={{ marginBottom: 0 }}>
                                <ProFormText name="note" noStyle placeholder="Ghi chú nếu cần..." />
                            </Form.Item>
                        </Col>
                    </Row>
                )}

            </div>
        </ModalForm>
    );
};

export default ModalProcedure;
