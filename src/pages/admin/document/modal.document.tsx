import { useEffect, useState, type ReactNode } from "react";
import type { MouseEvent } from "react";
import { Form, Input, Select, DatePicker, Row, Col, Upload, message, ConfigProvider, Tabs, Tag, Tooltip } from "antd";
import { ModalForm } from "@ant-design/pro-components";
import {
    FileTextOutlined, LockOutlined, TeamOutlined, BankOutlined, UserOutlined,
    FilePdfOutlined, FileWordOutlined, FileExcelOutlined, FileUnknownOutlined,
    CloudUploadOutlined, CloseCircleFilled, SyncOutlined
} from "@ant-design/icons";
import type { UploadFile, UploadProps } from "antd";
import dayjs from "dayjs";

import type { IDocument, IDocumentRequest, DocumentProcedureType } from "@/types/backend";
import {
    useCreateDocumentMutation,
    useUpdateDocumentMutation,
    useGetNextDocumentCodeQuery,
} from "@/hooks/useDocuments";
import { useDocumentCategoriesActiveQuery } from "@/hooks/useDocumentCategories";
import { useCompaniesQuery } from "@/hooks/useCompanies";
import { useDepartmentsByCompanyQuery } from "@/hooks/useDepartments";
import { useSectionsByDepartmentQuery } from "@/hooks/useSections";
import { callUploadSingleFile } from "@/config/api";
import UserSelectField from "@/pages/admin/procedures/components/UserSelectField";

interface Props {
    openModal: boolean;
    setOpenModal: (v: boolean) => void;
    dataInit: IDocument | null;
    setDataInit: (v: IDocument | null) => void;
}

const PROCEDURE_TYPE_OPTIONS = [
    { label: "Cấp công ty", value: "COMPANY" },
    { label: "Cấp phòng ban", value: "DEPARTMENT" },
    { label: "Bảo mật (giới hạn người xem)", value: "CONFIDENTIAL" },
];

type AudienceScope = "PRIVATE" | "SELECTED_USERS" | "DEPARTMENT" | "COMPANY";

const AUDIENCE_OPTIONS: { label: string; value: AudienceScope; icon: ReactNode; desc: string }[] = [
    { label: "Riêng tư", value: "PRIVATE", icon: <LockOutlined />, desc: "Chỉ người có quyền phù hợp" },
    { label: "Chọn người xem", value: "SELECTED_USERS", icon: <UserOutlined />, desc: "Chỉ định từng người" },
    { label: "Cả phòng ban", value: "DEPARTMENT", icon: <TeamOutlined />, desc: "Toàn bộ phòng ban" },
    { label: "Cả công ty", value: "COMPANY", icon: <BankOutlined />, desc: "Toàn bộ công ty" },
];

const STATUS_OPTIONS = [
    { label: "Cần tạo", value: "NEED_CREATE" },
    { label: "Đang hiệu lực", value: "IN_PROGRESS" },
    { label: "Cần cập nhật", value: "NEED_UPDATE" },
    { label: "Hết hiệu lực", value: "TERMINATED" },
];

// ─── File helpers (mirror file-section.procedure) ─────────────────────────────
const FILE_CFG: Record<string, { icon: ReactNode; bg: string; border: string; badge: string; label: string }> = {
    pdf: { icon: <FilePdfOutlined style={{ fontSize: 20, color: "#ff4d4f" }} />, bg: "#fff1f0", border: "#ffccc7", badge: "#ff4d4f", label: "PDF" },
    doc: { icon: <FileWordOutlined style={{ fontSize: 20, color: "#1677ff" }} />, bg: "#e6f4ff", border: "#91caff", badge: "#1677ff", label: "DOC" },
    docx: { icon: <FileWordOutlined style={{ fontSize: 20, color: "#1677ff" }} />, bg: "#e6f4ff", border: "#91caff", badge: "#1677ff", label: "DOCX" },
    xls: { icon: <FileExcelOutlined style={{ fontSize: 20, color: "#52c41a" }} />, bg: "#f6ffed", border: "#b7eb8f", badge: "#52c41a", label: "XLS" },
    xlsx: { icon: <FileExcelOutlined style={{ fontSize: 20, color: "#52c41a" }} />, bg: "#f6ffed", border: "#b7eb8f", badge: "#52c41a", label: "XLSX" },
};
const getFileCfg = (name: string) => {
    const ext = name.split(".").pop()?.toLowerCase() ?? "";
    return FILE_CFG[ext] ?? {
        icon: <FileUnknownOutlined style={{ fontSize: 20, color: "#8c8c8c" }} />,
        bg: "#fafafa", border: "#d9d9d9", badge: "#8c8c8c",
        label: ext.toUpperCase() || "FILE",
    };
};
const decodeDocFileName = (name: string) => {
    const n = name.replace(/^\d{10,}-/, "");
    const dot = n.lastIndexOf(".");
    const base = dot !== -1 ? n.slice(0, dot) : n;
    const ext = dot !== -1 ? n.slice(dot) : "";
    let decoded = base;
    try { decoded = decodeURIComponent(base); } catch { /* noop */ }
    return decoded.replace(/_/g, " ").trim() + ext;
};

const FileTileUpload = ({ file, onRemove }: { file: UploadFile; onRemove: () => void }) => {
    const cfg = getFileCfg(file.name);
    const pretty = decodeDocFileName(file.name);
    const short = pretty.length > 18 ? pretty.slice(0, 15) + "…" : pretty;
    return (
        <Tooltip title={pretty} placement="top">
            <div style={{
                position: "relative", display: "flex", flexDirection: "column",
                alignItems: "center", gap: 6, padding: "10px 8px 8px",
                background: "#fafafa", borderRadius: 10,
                border: "1px solid #e8e8e8", cursor: "default",
                minWidth: 0, transition: "border-color .15s",
            }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = "#91caff")}
                onMouseLeave={e => (e.currentTarget.style.borderColor = "#e8e8e8")}
            >
                {/* Remove button */}
                <button
                    type="button"
                    onClick={onRemove}
                    style={{
                        position: "absolute", top: -7, right: -7,
                        background: "none", border: "none", padding: 0,
                        cursor: "pointer", lineHeight: 1, zIndex: 1,
                        color: "#bfbfbf",
                    }}
                    onMouseEnter={e => (e.currentTarget.style.color = "#ff4d4f")}
                    onMouseLeave={e => (e.currentTarget.style.color = "#bfbfbf")}
                >
                    <CloseCircleFilled style={{ fontSize: 16, background: "#fff", borderRadius: "50%" }} />
                </button>

                {/* Icon */}
                <div style={{
                    width: 44, height: 50, borderRadius: 8,
                    background: cfg.bg, border: `1px solid ${cfg.border}`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    position: "relative", flexShrink: 0,
                }}>
                    {cfg.icon}
                    <span style={{
                        position: "absolute", bottom: -3, right: -3,
                        fontSize: 7, fontWeight: 700, padding: "1px 4px",
                        borderRadius: 3, background: cfg.badge, color: "#fff",
                        letterSpacing: "0.04em", lineHeight: "13px",
                    }}>
                        {cfg.label}
                    </span>
                </div>

                {/* Name */}
                <span style={{ fontSize: 10.5, color: "#374151", textAlign: "center", lineHeight: 1.3, maxWidth: 80, wordBreak: "break-word" }}>
                    {short}
                </span>
            </div>
        </Tooltip>
    );
};

const ModalDocument = ({
    openModal,
    setOpenModal,
    dataInit,
    setDataInit,
}: Props) => {
    const [form] = Form.useForm();
    const isEdit = !!dataInit?.id;

    const [activeTab, setActiveTab] = useState("info");
    const [showProcedureFields, setShowProcedureFields] = useState(false);
    const [isCrossCompany, setIsCrossCompany] = useState(false);
    const [procedureType, setProcedureType] = useState<DocumentProcedureType | null>(null);
    const [audienceScope, setAudienceScope] = useState<AudienceScope>("SELECTED_USERS");
    const [selectedCompanyId, setSelectedCompanyId] = useState<number | null>(null);
    const [selectedDepartmentId, setSelectedDepartmentId] = useState<number | null>(null);
    const [fileList, setFileList] = useState<UploadFile[]>([]);
    const [uploading, setUploading] = useState(false);
    const [userCount, setUserCount] = useState(0);
    const [excludedUserCount, setExcludedUserCount] = useState(0);
    const selectedCategoryId = Form.useWatch("categoryId", form);
    const selectedIssuedDate = Form.useWatch("issuedDate", form);
    const issuedYear = selectedIssuedDate ? dayjs(selectedIssuedDate).year() : null;
    const [isDocumentCodeTouched, setIsDocumentCodeTouched] = useState(false);

    const createMutation = useCreateDocumentMutation();
    const updateMutation = useUpdateDocumentMutation();

    const { data: nextDocumentCode } = useGetNextDocumentCodeQuery(
        selectedCompanyId,
        selectedCategoryId,
        issuedYear
    );

    useEffect(() => {
        if (!isEdit && nextDocumentCode && !isDocumentCodeTouched) {
            form.setFieldValue("documentCode", nextDocumentCode);
        }
    }, [nextDocumentCode, isEdit, form, isDocumentCodeTouched]);

    const { data: categoriesActive } = useDocumentCategoriesActiveQuery();
    const { data: companies } = useCompaniesQuery("page=1&size=100&sort=name,asc");
    const { data: departments } = useDepartmentsByCompanyQuery(selectedCompanyId!);
    const { data: sections } = useSectionsByDepartmentQuery(selectedDepartmentId!);

    const categoryOptions =
        categoriesActive?.map((c) => ({
            label: `[${c.symbol || c.categoryCode}] ${c.categoryName}`,
            value: c.id!,
            mappingProcedure: c.mappingProcedure,
            isCrossCompany: c.isCrossCompany,
        })) ?? [];

    const companyOptions =
        companies?.result?.map((c) => ({
            label: c.name,
            value: c.id!,
        })) ?? [];

    const departmentOptions =
        departments?.map((d) => ({
            label: d.name,
            value: d.id,
        })) ?? [];

    const sectionOptions =
        sections?.map((s) => ({
            label: s.name,
            value: s.id!,
        })) ?? [];

    const selectedCategory = categoryOptions.find((c) => c.value === selectedCategoryId);

    const resetCascadeFields = () => {
        // Keep selectedCompanyId and form.companyId intact so auto-generation isn't lost
        setSelectedDepartmentId(null);
        setUserCount(0);
        form.setFieldsValue({
            departmentId: undefined,
            targetCompanyIds: undefined,
            departmentIds: undefined,
            excludedDepartmentIds: undefined,
            excludedUserIds: undefined,
            sectionId: undefined,
            userIds: undefined,
        });
    };

    const resetAll = () => {
        form.resetFields();
        setFileList([]);
        setShowProcedureFields(false);
        setIsCrossCompany(false);
        setProcedureType(null);
        setAudienceScope("SELECTED_USERS");
        setSelectedCompanyId(null);
        setSelectedDepartmentId(null);
        setUserCount(0);
        setExcludedUserCount(0);
        setActiveTab("info");
        setIsDocumentCodeTouched(false);
    };

    useEffect(() => {
        if (openModal) {
            if (dataInit) {
                const isCross = dataInit.category?.isCrossCompany ?? false;
                setShowProcedureFields(dataInit.category?.mappingProcedure ?? false);
                setIsCrossCompany(isCross);

                const pType = dataInit.procedureType ?? null;
                setProcedureType(pType);
                setAudienceScope(
                    pType === "CONFIDENTIAL"
                        ? "SELECTED_USERS"
                        : pType === "DEPARTMENT"
                            ? "DEPARTMENT"
                            : pType === "COMPANY"
                                ? "COMPANY"
                                : (pType == null && (dataInit.userIds?.length ?? 0) > 0)
                                    ? "SELECTED_USERS"  // procedureType null nhưng có access list
                                    : "PRIVATE"
                );

                const companyId = dataInit.department?.companyId ?? null;
                const departmentId = dataInit.department?.id ?? null;
                setSelectedCompanyId(companyId);
                setSelectedDepartmentId(departmentId);

                const existingUserIds = dataInit.userIds ?? [];
                setUserCount(existingUserIds.length);
                setExcludedUserCount(dataInit.excludedUserIds?.length ?? 0);

                const urls: string[] = dataInit.fileUrls ?? [];
                setFileList(
                    urls.map((name, i) => ({
                        uid: String(i),
                        name,
                        status: "done" as const,
                        url: `/api/v1/files?fileName=${encodeURIComponent(name)}&folder=documents`,
                        response: name,
                    }))
                );

                form.setFieldsValue({
                    documentCode: dataInit.documentCode,
                    documentName: dataInit.documentName,
                    categoryId: dataInit.category?.id,
                    procedureType: pType,
                    companyId: companyId,
                    departmentId: departmentId,
                    sectionId: dataInit.section?.id,
                    departmentIds: dataInit.departmentIds?.length ? dataInit.departmentIds : (pType === "DEPARTMENT" && departmentId ? [departmentId] : undefined),
                    status: dataInit.status,
                    issuedDate: dataInit.issuedDate ? dayjs(dataInit.issuedDate) : undefined,
                    note: dataInit.note,
                    fileUrls: urls,
                    userIds: existingUserIds,
                    excludedDepartmentIds: dataInit.excludedDepartmentIds,
                    excludedUserIds: dataInit.excludedUserIds,
                    targetCompanyIds: dataInit.targetCompanyIds,
                });
            } else {
                resetAll();
                form.setFieldValue("fileUrls", []);
                form.setFieldValue("status", "IN_PROGRESS");
            }
        }
    }, [openModal, dataInit]);

    const handleCategoryChange = (categoryId: number) => {
        const selected = categoryOptions.find((c) => c.value === categoryId);
        const isCross = selected?.isCrossCompany ?? false;
        setShowProcedureFields(selected?.mappingProcedure ?? false);
        setIsCrossCompany(isCross);
        setProcedureType(null);
        setAudienceScope(isCross ? "COMPANY" : "SELECTED_USERS");
        resetCascadeFields();
        form.setFieldsValue({ procedureType: undefined });
    };

    const handleProcedureTypeChange = (val: DocumentProcedureType) => {
        setProcedureType(val);
        resetCascadeFields();
    };

    const handleAudienceChange = (val: AudienceScope) => {
        // Văn bản liên công ty bắt buộc phải có người nhận — không cho phép scope Riêng tư
        if (isCrossCompany && val === "PRIVATE") {
            message.warning("Văn bản liên công ty phải chọn người nhận hoặc công ty được xem");
            return;
        }
        setAudienceScope(val);
        setUserCount(0);
        form.setFieldsValue({
            userIds: undefined,
            sectionId: undefined,
            targetCompanyIds: undefined,
            departmentIds: undefined,
            excludedDepartmentIds: undefined,
            excludedUserIds: undefined,
            ...(val === "PRIVATE" || val === "SELECTED_USERS"
                ? { departmentId: undefined }
                : {}),
        });
        if (val === "PRIVATE") {
            setSelectedDepartmentId(null);
        }
    };

    const handleCompanyChange = (companyId: number) => {
        setSelectedCompanyId(companyId);
        setSelectedDepartmentId(null);
        setUserCount(0);
        form.setFieldsValue({
            departmentId: undefined,
            departmentIds: undefined,
            excludedDepartmentIds: undefined,
            excludedUserIds: undefined,
            sectionId: undefined,
            userIds: undefined,
        });
        setExcludedUserCount(0);
    };

    const handleDepartmentChange = (departmentId: number) => {
        setSelectedDepartmentId(departmentId);
        form.setFieldsValue({ sectionId: undefined });
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
                message.error("Chỉ chấp nhận file PDF, Word, Excel!");
                return Upload.LIST_IGNORE;
            }

            const tempUid = file.uid || `${Date.now()}-${Math.random()}`;
            setFileList((prev) => [...prev, { uid: tempUid, name: file.name, status: "uploading" }]);

            try {
                setUploading(true);
                const res = await callUploadSingleFile(file, "documents");
                const fileName = res?.data?.fileName;
                if (!fileName) throw new Error("Upload thất bại");

                setFileList((prev) =>
                    prev.map((f) =>
                        f.uid === tempUid
                            ? {
                                ...f,
                                status: "done" as const,
                                url: `/api/v1/files?fileName=${encodeURIComponent(fileName)}&folder=documents`,
                                response: fileName,
                            }
                            : f
                    )
                );

                const current: string[] = form.getFieldValue("fileUrls") ?? [];
                form.setFieldValue("fileUrls", [...current, fileName]);
                message.success(`Upload ${file.name} thành công!`);
            } catch {
                setFileList((prev) => prev.filter((f) => f.uid !== tempUid));
                message.error("Upload file thất bại!");
            } finally {
                setUploading(false);
            }

            return false;
        },
    };

    const handleSubmit = async (values: any) => {
        // Khi edit, form.getFieldValue("userIds") có thể là undefined nếu người dùng không
        // vào tab phân quyền — fallback về danh sách hiện tại từ dataInit để tránh mất access list.
        const resolvedUserIds: string[] | undefined =
            values.userIds !== undefined
                ? values.userIds
                : isEdit
                    ? (dataInit?.userIds ?? undefined)
                    : undefined;
        const resolvedExcludedDepartmentIds: number[] | undefined =
            values.excludedDepartmentIds !== undefined
                ? (values.excludedDepartmentIds?.length ? values.excludedDepartmentIds : [])
                : isEdit ? (dataInit?.excludedDepartmentIds ?? undefined) : undefined;
        const resolvedExcludedUserIds: string[] | undefined =
            values.excludedUserIds !== undefined
                ? (values.excludedUserIds?.length ? values.excludedUserIds : [])
                : isEdit ? (dataInit?.excludedUserIds ?? undefined) : undefined;
        const resolvedTargetCompanyIds: number[] | undefined =
            values.targetCompanyIds !== undefined
                ? (values.targetCompanyIds?.length ? values.targetCompanyIds : [])
                : isEdit ? (dataInit?.targetCompanyIds ?? undefined) : undefined;

        // Guard: văn bản liên công ty không được để scope Riêng tư
        if (isCrossCompany && !showProcedureFields && audienceScope === "PRIVATE") {
            message.error("Văn bản liên công ty phải chọn người nhận hoặc công ty được xem");
            return;
        }

        const payload: IDocumentRequest = {
            documentCode: values.documentCode?.trim().toUpperCase(),
            documentName: values.documentName?.trim(),
            categoryId: values.categoryId,
            status: values.status,
            issuedDate: values.issuedDate ? dayjs(values.issuedDate).toISOString() : undefined,
            note: values.note,
            fileUrls: values.fileUrls ?? [],
        };

        if (!showProcedureFields && audienceScope === "SELECTED_USERS" && (!resolvedUserIds || resolvedUserIds.length === 0)) {
            message.error(isCrossCompany
                ? "Vui lòng chọn người được xem cho văn bản liên công ty"
                : "Vui lòng chọn người được xem hoặc đổi phạm vi xem");
            return;
        }

        if (!showProcedureFields && audienceScope === "DEPARTMENT" && (!values.departmentIds || values.departmentIds.length === 0)) {
            message.error("Vui lòng chọn phòng ban được xem");
            return;
        }

        if (!showProcedureFields && audienceScope === "COMPANY") {
            if (isCrossCompany) {
                if (!resolvedTargetCompanyIds || resolvedTargetCompanyIds.length === 0) {
                    message.error("Vui lòng chọn ít nhất 1 công ty được xem");
                    return;
                }
            }
        }

        if (showProcedureFields && procedureType) {
            payload.procedureType = procedureType;

            if (procedureType === "COMPANY" || procedureType === "CONFIDENTIAL" || (procedureType === "DEPARTMENT" && !selectedCategory?.mappingProcedure)) {
                if (!values.departmentId) {
                    message.error("Vui lòng chọn phòng ban phụ trách / ban hành");
                    return;
                }
                payload.departmentId = values.departmentId;
                payload.sectionId = values.sectionId || undefined;

                if (procedureType === "COMPANY" && isCrossCompany) {
                    if (!resolvedTargetCompanyIds || resolvedTargetCompanyIds.length === 0) {
                        message.error("Vui lòng chọn ít nhất 1 công ty được xem");
                        return;
                    }
                    payload.targetCompanyIds = resolvedTargetCompanyIds;
                }
            }

            if (procedureType === "DEPARTMENT" && selectedCategory?.mappingProcedure) {
                if (!values.departmentId) {
                    message.error("Vui lòng chọn phòng ban ban hành");
                    return;
                }
                payload.departmentIds = values.departmentIds || undefined;
                payload.departmentId = values.departmentId;
                payload.sectionId = values.sectionId || undefined;
            }

            if (procedureType === "CONFIDENTIAL") {
                if (!resolvedUserIds || resolvedUserIds.length === 0) {
                    message.error("Vui lòng chọn người được xem cho văn bản bảo mật");
                    return;
                }
                payload.userIds = resolvedUserIds;
            } else if (resolvedUserIds?.length) {
                payload.userIds = resolvedUserIds;
            }
        } else {
            if (!values.departmentId) {
                message.error("Vui lòng chọn phòng ban ban hành");
                return;
            }
            payload.departmentId = values.departmentId;
            payload.sectionId = values.sectionId || undefined;
            
            if (audienceScope === "COMPANY") {
                if (isCrossCompany) {
                    payload.targetCompanyIds = resolvedTargetCompanyIds;
                    payload.procedureType = "COMPANY";
                } else {
                    payload.procedureType = "COMPANY";
                }
            }
            if (audienceScope === "DEPARTMENT") {
                payload.procedureType = "DEPARTMENT";
                payload.departmentIds = values.departmentIds || undefined;
            }
            if (audienceScope === "SELECTED_USERS") {
                payload.procedureType = "CONFIDENTIAL";
                payload.userIds = resolvedUserIds?.length ? resolvedUserIds : undefined;
            } else if (resolvedUserIds?.length) {
                payload.userIds = resolvedUserIds;
            }
        }

        payload.excludedDepartmentIds = resolvedExcludedDepartmentIds;
        payload.excludedUserIds = resolvedExcludedUserIds;

        if (isEdit && dataInit?.id) {
            await updateMutation.mutateAsync({ id: dataInit.id, data: payload });
        } else {
            await createMutation.mutateAsync(payload);
        }

        setOpenModal(false);
        setDataInit(null);
        resetAll();
    };

    const renderProcedureLocationFields = () => {
        if (!showProcedureFields || !procedureType) return null;

        return (
            <>
                <Row gutter={16}>
                    <Col span={12}>
                        <Form.Item
                            label="Đơn vị ban hành"
                            name="companyId"
                            rules={[{ required: true, message: "Vui lòng chọn công ty ban hành" }]}
                        >
                            <Select
                                placeholder="Chọn công ty ban hành"
                                options={companyOptions}
                                onChange={handleCompanyChange}
                                showSearch
                                optionFilterProp="label"
                            />
                        </Form.Item>
                    </Col>

                    {procedureType === "COMPANY" && isCrossCompany && (
                        <Col span={12}>
                            <Form.Item
                                label="Công ty áp dụng (Liên công ty)"
                                name="targetCompanyIds"
                                rules={[{ required: true, message: "Vui lòng chọn ít nhất 1 công ty áp dụng" }]}
                            >
                                <Select
                                    mode="multiple"
                                    maxTagCount="responsive"
                                    placeholder="Chọn các công ty..."
                                    options={companyOptions}
                                    allowClear
                                    showSearch
                                    optionFilterProp="label"
                                />
                            </Form.Item>
                        </Col>
                    )}

                    <Col span={12}>
                        <Form.Item
                            label="Phòng ban ban hành"
                            name="departmentId"
                            rules={[{ required: true, message: "Vui lòng chọn phòng ban ban hành" }]}
                        >
                            <Select
                                placeholder="Chọn phòng ban ban hành"
                                options={departmentOptions}
                                onChange={handleDepartmentChange}
                                disabled={!selectedCompanyId}
                                showSearch
                                optionFilterProp="label"
                                allowClear
                            />
                        </Form.Item>
                    </Col>

                    {procedureType === "DEPARTMENT" && selectedCategory?.mappingProcedure && (
                        <Col span={12}>
                            <Form.Item
                                label="Phòng ban áp dụng"
                                name="departmentIds"
                                rules={[{ required: true, message: "Vui lòng chọn ít nhất 1 phòng ban áp dụng" }]}
                            >
                                <Select
                                    placeholder="Chọn phòng ban được xem"
                                    options={departmentOptions}
                                    mode="multiple"
                                    maxTagCount="responsive"
                                    disabled={!selectedCompanyId}
                                    showSearch
                                    optionFilterProp="label"
                                    allowClear
                                />
                            </Form.Item>
                        </Col>
                    )}
                </Row>

                <Row gutter={16}>
                    <Col span={12}>
                        <Form.Item label="Bộ phận" name="sectionId">
                            <Select
                                placeholder="Chọn bộ phận (tuỳ chọn)"
                                options={sectionOptions}
                                disabled={!selectedDepartmentId}
                                allowClear
                                showSearch
                                optionFilterProp="label"
                            />
                        </Form.Item>
                    </Col>

                    {procedureType === "CONFIDENTIAL" && (
                        <Col span={12}>
                            <UserSelectField
                                companyId={selectedCompanyId}
                                selectedUserCount={userCount}
                                onCountChange={setUserCount}
                                isCrossCompany={isCrossCompany}
                            />
                        </Col>
                    )}
                </Row>
            </>
        );
    };

    const renderAudienceFields = () => {
        if (showProcedureFields) return null;

        const needsUsers = audienceScope === "SELECTED_USERS";

        return (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {/* Phạm vi xem — card buttons */}
                <div>
                    <div style={{ fontSize: 12.5, fontWeight: 600, color: "#374151", marginBottom: 8 }}>
                        Phạm vi xem <span style={{ color: "#ef4444" }}>*</span>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
                        {AUDIENCE_OPTIONS.map((opt) => {
                            const active = audienceScope === opt.value;
                            const disabled = isCrossCompany && opt.value === "PRIVATE";
                            return (
                                <button
                                    key={opt.value}
                                    type="button"
                                    disabled={disabled}
                                    onClick={() => !disabled && handleAudienceChange(opt.value)}
                                    style={{
                                        display: "flex", flexDirection: "column", alignItems: "center",
                                        gap: 4, padding: "10px 8px",
                                        borderRadius: 10,
                                        border: active ? "1.5px solid #f5317f" : "1.5px solid #e5e7eb",
                                        background: active ? "#fff1f6" : disabled ? "#f9fafb" : "#fff",
                                        color: active ? "#be185d" : disabled ? "#d1d5db" : "#6b7280",
                                        cursor: disabled ? "not-allowed" : "pointer",
                                        transition: "all 0.15s",
                                        fontSize: 18,
                                    }}
                                >
                                    <span style={{ fontSize: 16, lineHeight: 1 }}>{opt.icon}</span>
                                    <span style={{ fontSize: 12, fontWeight: active ? 600 : 500, color: active ? "#be185d" : disabled ? "#d1d5db" : "#374151", lineHeight: 1.2 }}>{opt.label}</span>
                                    <span style={{ fontSize: 10.5, color: active ? "#f9a8d4" : "#9ca3af", textAlign: "center", lineHeight: 1.3 }}>{opt.desc}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 12 }}>
                    <Form.Item label="Công ty ban hành" name="companyId"
                        rules={[{ required: true, message: "Vui lòng chọn công ty" }]}
                        style={{ marginBottom: 0 }}
                    >
                        <Select placeholder="Chọn công ty" options={companyOptions}
                            onChange={handleCompanyChange} allowClear showSearch optionFilterProp="label" />
                    </Form.Item>

                    {isCrossCompany && audienceScope === "COMPANY" && (
                        <Form.Item label="Công ty được xem" name="targetCompanyIds"
                            rules={[{ required: true, message: "Vui lòng chọn ít nhất 1 công ty" }]}
                            style={{ marginBottom: 0 }}
                        >
                            <Select mode="multiple" maxTagCount="responsive" placeholder="Chọn các công ty..."
                                options={companyOptions} allowClear showSearch optionFilterProp="label" />
                        </Form.Item>
                    )}

                    <Form.Item label="Phòng ban ban hành" name="departmentId"
                        rules={[{ required: true, message: "Vui lòng chọn phòng ban ban hành" }]}
                        style={{ marginBottom: 0 }}
                    >
                        <Select placeholder="Chọn phòng ban ban hành" options={departmentOptions}
                            onChange={handleDepartmentChange} disabled={!selectedCompanyId}
                            allowClear showSearch optionFilterProp="label" />
                    </Form.Item>

                    <Form.Item label="Bộ phận" name="sectionId" style={{ marginBottom: 0 }}>
                        <Select placeholder="Chọn bộ phận (tuỳ chọn)"
                            options={sectionOptions} disabled={!selectedDepartmentId}
                            allowClear showSearch optionFilterProp="label" />
                    </Form.Item>

                    {audienceScope === "DEPARTMENT" && (
                        <Form.Item label="Phòng ban được xem" name="departmentIds"
                            rules={[{ required: true, message: "Vui lòng chọn phòng ban được xem" }]}
                            style={{ marginBottom: 0 }}
                        >
                            <Select mode="multiple" maxTagCount="responsive" placeholder="Chọn phòng ban được xem"
                                options={departmentOptions} disabled={!selectedCompanyId}
                                allowClear showSearch optionFilterProp="label" />
                        </Form.Item>
                    )}

                    {needsUsers && (
                        <UserSelectField
                            companyId={selectedCompanyId}
                            selectedUserCount={userCount}
                            onCountChange={setUserCount}
                            isCrossCompany={isCrossCompany}
                        />
                    )}
                </div>
            </div>
        );
    };

    const renderAdvancedAccessFields = () => {
        const hasPrimaryUserPicker =
            (!showProcedureFields && audienceScope === "SELECTED_USERS") ||
            (showProcedureFields && procedureType === "CONFIDENTIAL");
        const showAdvanced =
            showProcedureFields ? !!procedureType : audienceScope !== "PRIVATE";

        if (!showAdvanced) return null;

        const hasExclusions = (excludedUserCount > 0) ||
            (form.getFieldValue("excludedDepartmentIds")?.length > 0);

        return (
            <details
                open={hasExclusions}
                style={{ borderRadius: 8, border: "1px solid #e5e7eb", background: "#fafafa" }}
            >
                <summary style={{
                    padding: "8px 12px",
                    cursor: "pointer",
                    fontSize: 12.5,
                    fontWeight: 600,
                    color: "#6b7280",
                    listStyle: "none",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    userSelect: "none",
                }}>
                    <span>Điều chỉnh nâng cao</span>
                    <span style={{ fontSize: 11, fontWeight: 400, color: "#9ca3af" }}>
                        {hasExclusions ? "Đang có loại trừ" : "Bổ sung / loại trừ người xem"}
                    </span>
                </summary>

                <div style={{ padding: "0 12px 12px", display: "flex", flexDirection: "column", gap: 10, borderTop: "1px solid #f0f0f0", paddingTop: 12 }}>
                    {!hasPrimaryUserPicker && (
                        <UserSelectField
                            label="Bổ sung cá nhân được xem"
                            emptyText="Nhấn để chọn cá nhân bổ sung..."
                            accentColor="#1677ff"
                            companyId={selectedCompanyId}
                            selectedUserCount={userCount}
                            onCountChange={setUserCount}
                            isCrossCompany={isCrossCompany}
                        />
                    )}
                    <Row gutter={12}>
                        <Col span={12}>
                            <Form.Item label="Phòng ban loại trừ" name="excludedDepartmentIds" style={{ marginBottom: 0 }}>
                                <Select
                                    mode="multiple" maxTagCount="responsive"
                                    placeholder="Chọn phòng ban loại trừ"
                                    options={departmentOptions}
                                    disabled={!selectedCompanyId}
                                    allowClear showSearch optionFilterProp="label"
                                />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <div className="document-inline-user-field">
                                <UserSelectField
                                    name="excludedUserIds"
                                    label="Cá nhân loại trừ"
                                    emptyText="Nhấn để chọn cá nhân loại trừ..."
                                    accentColor="#64748b"
                                    companyId={selectedCompanyId}
                                    selectedUserCount={excludedUserCount}
                                    onCountChange={setExcludedUserCount}
                                    isCrossCompany={isCrossCompany}
                                />
                            </div>
                        </Col>
                    </Row>
                </div>
            </details>
        );
    };

    const isLoading = createMutation.isPending || updateMutation.isPending || uploading;

    const ACCENT = "#f5317f";
    const ACCENT_HOVER = "#d4206a";
    const scopeBadge =
        showProcedureFields && procedureType
            ? PROCEDURE_TYPE_OPTIONS.find((opt) => opt.value === procedureType)?.label
            : AUDIENCE_OPTIONS.find((opt) => opt.value === audienceScope)?.label;

    return (
        <ConfigProvider
            theme={{
                token: { colorPrimary: ACCENT },
                components: {
                    Button: { colorPrimary: ACCENT, colorPrimaryHover: ACCENT_HOVER },
                    Select: { colorPrimary: "#1677ff", colorPrimaryHover: "#4096ff", controlItemBgActive: "#e6f4ff" },
                    Tabs: { inkBarColor: ACCENT, itemActiveColor: ACCENT, itemSelectedColor: ACCENT },
                }
            }}
        >
            <ModalForm
                title={
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontSize: 15, fontWeight: 700, color: "#111827" }}>
                            {isEdit ? "Cập nhật văn bản" : "Thêm văn bản mới"}
                        </span>
                        {scopeBadge && (
                            <Tag color="volcano" style={{ fontSize: 11, fontWeight: 500, margin: 0, borderRadius: 6 }}>
                                {scopeBadge}
                            </Tag>
                        )}
                    </div>
                }
                open={openModal}
                form={form}
                layout="vertical"
                modalProps={{
                    className: "document-form-modal",
                    destroyOnHidden: true,
                    onCancel: () => {
                        setOpenModal(false);
                        setDataInit(null);
                        resetAll();
                    },
                    maskClosable: false,
                    width: 820,
                    styles: { body: { padding: "20px 24px" } },
                }}
                submitter={{
                    searchConfig: {
                        submitText: isEdit ? "Cập nhật" : "Tạo mới",
                        resetText: "Huỷ",
                    },
                    resetButtonProps: { style: { borderRadius: 8 } },
                    submitButtonProps: {
                        loading: isLoading,
                        disabled: uploading,
                        style: {
                            borderRadius: 8,
                            background: ACCENT,
                            borderColor: ACCENT,
                            fontWeight: 500,
                        },
                        onMouseEnter: (e: MouseEvent<HTMLButtonElement>) => {
                            (e.currentTarget as HTMLButtonElement).style.background = ACCENT_HOVER;
                            (e.currentTarget as HTMLButtonElement).style.borderColor = ACCENT_HOVER;
                        },
                        onMouseLeave: (e: MouseEvent<HTMLButtonElement>) => {
                            (e.currentTarget as HTMLButtonElement).style.background = ACCENT;
                            (e.currentTarget as HTMLButtonElement).style.borderColor = ACCENT;
                        },
                    },
                }}
                onFinish={handleSubmit}
            >
                <style>{`
                .document-form-tabs > .ant-tabs-nav::before { border-bottom: 1px solid #f3f4f6 !important; }
                .document-form-tabs > .ant-tabs-nav { margin-bottom: 20px; }
                .document-form-tabs .ant-tabs-tab { padding: 8px 0; font-size: 13.5px; }
                .document-form-tabs .ant-tabs-tab-btn { display: flex; align-items: center; gap: 6px; color: #9ca3af; font-weight: 500; }
                .document-form-tabs .ant-tabs-tab-active .ant-tabs-tab-btn { color: #f5317f !important; font-weight: 600; }
                .document-form-tabs .ant-tabs-ink-bar { background: #f5317f; height: 2.5px; border-radius: 2px; }
                .document-form-tabs .ant-tabs-tabpane:focus-visible { outline: none !important; }
                .document-inline-user-field .ant-form-item { margin-bottom: 0 !important; }
                .document-inline-user-field .ant-form-item-control-input { min-height: 32px !important; }
                .document-inline-user-field .ant-form-item-control-input-content > div:first-child { min-height: 32px !important; padding: 4px 11px !important; border-radius: 6px !important; }
                .document-inline-user-field .ant-form-item-extra { min-height: 0 !important; margin-top: 4px; font-size: 12px; }
                details summary::-webkit-details-marker { display: none; }
            `}</style>

                <Form.Item name="fileUrls" hidden>
                    <Input />
                </Form.Item>

                <Tabs
                    activeKey={activeTab}
                    onChange={setActiveTab}
                    className="document-form-tabs"
                    items={[
                        {
                            key: "info",
                            label: (
                                <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                    <FileTextOutlined style={{ fontSize: 13 }} /> Thông tin
                                </span>
                            ),
                            forceRender: true,
                            children: (
                                <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                                    {/* Row 1: Mã + Loại */}
                                    <Row gutter={16}>
                                        <Col span={8}>
                                            <Form.Item
                                                label="Mã văn bản"
                                                name="documentCode"
                                                rules={[{ required: true, message: "Nhập mã hoặc chọn Công ty (tab Phân quyền) để tự sinh" }, { max: 100, message: "Tối đa 100 ký tự" }]}
                                                extra={!isEdit ? <span style={{ fontSize: 12, color: '#8c8c8c' }}>Tự động sinh khi chọn đủ: Công ty (tab Phân quyền), Loại, Năm</span> : null}
                                            >
                                                <Input
                                                    placeholder="VD: 01/2026/BC-MLV"
                                                    disabled={isEdit}
                                                    style={{ textTransform: "uppercase" }}
                                                    onChange={() => setIsDocumentCodeTouched(true)}
                                                    suffix={!isEdit && !isDocumentCodeTouched && <Tooltip title="Mã tự động sinh"><SyncOutlined style={{ color: '#1677ff' }} /></Tooltip>}
                                                />
                                            </Form.Item>
                                        </Col>
                                        <Col span={16}>
                                            <Form.Item label="Loại văn bản" name="categoryId"
                                                rules={[{ required: true, message: "Vui lòng chọn loại văn bản" }]}
                                            >
                                                <Select placeholder="Chọn loại văn bản" options={categoryOptions}
                                                    onChange={handleCategoryChange} showSearch optionFilterProp="label" />
                                            </Form.Item>
                                        </Col>
                                    </Row>

                                    {/* Tên văn bản */}
                                    <Form.Item label="Tên văn bản" name="documentName"
                                        rules={[{ required: true, message: "Vui lòng nhập tên văn bản" }, { max: 250, message: "Tối đa 250 ký tự" }]}
                                    >
                                        <Input placeholder="VD: Quy chế nhân sự 2024" />
                                    </Form.Item>

                                    {/* Row 2: Trạng thái + Ngày ban hành */}
                                    <Row gutter={16}>
                                        {isEdit && (
                                            <Col span={12}>
                                                <Form.Item label="Trạng thái" name="status">
                                                    <Select placeholder="Chọn trạng thái" options={STATUS_OPTIONS} allowClear />
                                                </Form.Item>
                                            </Col>
                                        )}
                                        <Col span={isEdit ? 12 : 24}>
                                            <Form.Item label="Ngày ban hành" name="issuedDate">
                                                <DatePicker format="DD/MM/YYYY" style={{ width: "100%" }} placeholder="Chọn ngày ban hành" />
                                            </Form.Item>
                                        </Col>
                                    </Row>

                                    {/* Row 3: Ghi chú */}
                                    <Form.Item label="Ghi chú" name="note" style={{ marginBottom: 0 }}>
                                        <Input.TextArea
                                            placeholder="Mô tả ngắn hoặc ghi chú thêm..."
                                            autoSize={{ minRows: 2, maxRows: 3 }}
                                            style={{ resize: "none" }}
                                        />
                                    </Form.Item>

                                    {/* File đính kèm */}
                                    <Form.Item label="File đính kèm" style={{ marginBottom: 0 }}>
                                        <Upload
                                            {...uploadProps}
                                            showUploadList={false}
                                        >
                                            <div style={{
                                                border: "1.5px dashed #e5e7eb",
                                                borderRadius: 10, padding: "12px 16px",
                                                display: "flex", alignItems: "center", gap: 12,
                                                cursor: "pointer", background: uploading ? "#f0fdf4" : "#fafafa",
                                                transition: "border-color .15s, background .15s",
                                            }}
                                                onMouseEnter={e => { if (!uploading) (e.currentTarget as HTMLDivElement).style.borderColor = "#f5317f"; }}
                                                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = "#e5e7eb"; }}
                                            >
                                                <CloudUploadOutlined style={{ fontSize: 22, color: uploading ? "#16a34a" : "#f5317f", flexShrink: 0 }} />
                                                <div>
                                                    <div style={{ fontSize: 13, fontWeight: 500, color: uploading ? "#16a34a" : "#374151" }}>
                                                        {uploading ? "Đang tải lên..." : "Nhấn để đính kèm file"}
                                                    </div>
                                                    <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 1 }}>PDF · Word · Excel</div>
                                                </div>
                                            </div>
                                        </Upload>

                                        {/* File tiles */}
                                        {fileList.length > 0 && (
                                            <div style={{
                                                display: "grid",
                                                gridTemplateColumns: "repeat(auto-fill, minmax(90px, 1fr))",
                                                gap: 8, marginTop: 10,
                                            }}>
                                                {fileList.map((f) => (
                                                    <FileTileUpload
                                                        key={f.uid}
                                                        file={f}
                                                        onRemove={() => {
                                                            setFileList(prev => prev.filter(x => x.uid !== f.uid));
                                                            const removed = (f as any).response ?? f.name;
                                                            const current: string[] = form.getFieldValue("fileUrls") ?? [];
                                                            form.setFieldValue("fileUrls", current.filter(u => u !== removed));
                                                        }}
                                                    />
                                                ))}
                                            </div>
                                        )}
                                    </Form.Item>
                                </div>
                            ),
                        },
                        {
                            key: "access",
                            label: (
                                <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                    <LockOutlined style={{ fontSize: 13 }} /> Phân quyền
                                </span>
                            ),
                            forceRender: true,
                            children: (
                                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                                    {/* Banner nhỏ thay Alert to */}
                                    {(showProcedureFields || selectedCategory?.isCrossCompany) && (
                                        <div style={{
                                            display: "flex", alignItems: "center", gap: 8,
                                            padding: "8px 12px", borderRadius: 8,
                                            background: showProcedureFields ? "#eff6ff" : "#fffbeb",
                                            border: `1px solid ${showProcedureFields ? "#bfdbfe" : "#fde68a"}`,
                                            fontSize: 12.5, color: showProcedureFields ? "#1d4ed8" : "#92400e",
                                        }}>
                                            <span style={{ fontSize: 14 }}>{showProcedureFields ? "ℹ️" : "⚠️"}</span>
                                            {showProcedureFields
                                                ? "Văn bản quy trình — chọn phạm vi áp dụng bên dưới."
                                                : "Văn bản liên công ty — bắt buộc chọn người nhận hoặc công ty được xem."
                                            }
                                        </div>
                                    )}

                                    {showProcedureFields && (
                                        <Form.Item
                                            label="Quy trình áp dụng cho"
                                            name="procedureType"
                                            rules={[{ required: true, message: "Vui lòng chọn cấp áp dụng" }]}
                                            style={{ marginBottom: 0 }}
                                        >
                                            <Select
                                                placeholder="Chọn cấp áp dụng"
                                                options={PROCEDURE_TYPE_OPTIONS}
                                                onChange={handleProcedureTypeChange}
                                                style={{ maxWidth: 320 }}
                                            />
                                        </Form.Item>
                                    )}

                                    {renderProcedureLocationFields()}
                                    {renderAudienceFields()}
                                    {renderAdvancedAccessFields()}
                                </div>
                            ),
                        },
                    ]}
                />
            </ModalForm>
        </ConfigProvider>
    );
};

export default ModalDocument;
