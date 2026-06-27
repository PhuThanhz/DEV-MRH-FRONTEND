import { useEffect, useState } from "react";
import { Alert, Form, Input, Select, DatePicker, Row, Col, Upload, message, Radio, Divider, Tabs, ConfigProvider, Button } from "antd";
import { ModalForm } from "@ant-design/pro-components";
import { UploadOutlined } from "@ant-design/icons";
import type { UploadFile, UploadProps } from "antd";
import dayjs from "dayjs";

import type { IDocument, IDocumentRequest, DocumentProcedureType } from "@/types/backend";
import {
    useCreateDocumentMutation,
    useUpdateDocumentMutation,
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
    { label: "Bảo mật", value: "CONFIDENTIAL" },
];

type AudienceScope = "PRIVATE" | "SELECTED_USERS" | "DEPARTMENT" | "COMPANY";

const AUDIENCE_OPTIONS = [
    { label: "Chỉ người tạo", value: "PRIVATE" },
    { label: "Bảo mật", value: "SELECTED_USERS" },
    { label: "Cả phòng ban", value: "DEPARTMENT" },
    { label: "Cả công ty", value: "COMPANY" },
];

const STATUS_OPTIONS = [
    { label: "Cần tạo", value: "NEED_CREATE" },
    { label: "Đang hiệu lực", value: "IN_PROGRESS" },
    { label: "Cần cập nhật", value: "NEED_UPDATE" },
    { label: "Hết hiệu lực", value: "TERMINATED" },
];

const ModalDocument = ({
    openModal,
    setOpenModal,
    dataInit,
    setDataInit,
}: Props) => {
    const [form] = Form.useForm();
    const isEdit = !!dataInit?.id;

    const [activeTab, setActiveTab] = useState("1");
    const [showProcedureFields, setShowProcedureFields] = useState(false);
    const [isCrossCompany, setIsCrossCompany] = useState(false);
    const [procedureType, setProcedureType] = useState<DocumentProcedureType | null>(null);
    const [audienceScope, setAudienceScope] = useState<AudienceScope>("SELECTED_USERS");
    const [selectedCompanyId, setSelectedCompanyId] = useState<number | null>(null);
    const [selectedDepartmentId, setSelectedDepartmentId] = useState<number | null>(null);
    const [fileList, setFileList] = useState<UploadFile[]>([]);
    const [uploading, setUploading] = useState(false);
    const [userCount, setUserCount] = useState(0);
    const selectedCategoryId = Form.useWatch("categoryId", form);

    const createMutation = useCreateDocumentMutation();
    const updateMutation = useUpdateDocumentMutation();

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
        setSelectedCompanyId(null);
        setSelectedDepartmentId(null);
        setUserCount(0);
        form.setFieldsValue({
            companyId: undefined,
            departmentId: undefined,
            targetCompanyIds: undefined,
            departmentIds: undefined,
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
        setActiveTab("1");
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
                                : "PRIVATE"
                );

                const companyId = dataInit.department?.companyId ?? null;
                const departmentId = dataInit.department?.id ?? null;
                setSelectedCompanyId(companyId);
                setSelectedDepartmentId(departmentId);

                const existingUserIds = dataInit.userIds ?? [];
                setUserCount(existingUserIds.length);

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
                    status: dataInit.status,
                    issuedDate: dataInit.issuedDate ? dayjs(dataInit.issuedDate) : undefined,
                    note: dataInit.note,
                    fileUrls: urls,
                    userIds: (!dataInit.category?.mappingProcedure && pType !== "COMPANY" && pType !== "DEPARTMENT") ? existingUserIds : (pType === "CONFIDENTIAL" ? existingUserIds : undefined),
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
        setAudienceScope(val);
        setUserCount(0);
        form.setFieldsValue({
            userIds: undefined,
            sectionId: undefined,
            targetCompanyIds: undefined,
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
            sectionId: undefined,
            userIds: undefined,
        });
    };

    const handleDepartmentChange = (departmentId: number) => {
        setSelectedDepartmentId(departmentId);
        form.setFieldsValue({ sectionId: undefined });
    };

    const uploadProps: UploadProps = {
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

            const tempUid = Date.now().toString();
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
        onRemove: (file) => {
            setFileList((prev) => prev.filter((f) => f.uid !== file.uid));
            const removed = (file as any).response ?? file.name;
            const current: string[] = form.getFieldValue("fileUrls") ?? [];
            form.setFieldValue("fileUrls", current.filter((u) => u !== removed));
        },
    };

    const handleSubmit = async (values: any) => {
        const payload: IDocumentRequest = {
            documentCode: values.documentCode?.trim().toUpperCase(),
            documentName: values.documentName?.trim(),
            categoryId: values.categoryId,
            status: values.status,
            issuedDate: values.issuedDate ? dayjs(values.issuedDate).toISOString() : undefined,
            note: values.note,
            fileUrls: values.fileUrls ?? [],
        };

        if (!showProcedureFields && audienceScope === "SELECTED_USERS" && (!values.userIds || values.userIds.length === 0)) {
            message.error(isCrossCompany
                ? "Vui lòng chọn người được xem cho văn bản liên công ty"
                : "Vui lòng chọn người được xem hoặc đổi phạm vi xem");
            return;
        }

        if (!showProcedureFields && audienceScope === "DEPARTMENT" && !values.departmentId) {
            message.error("Vui lòng chọn phòng ban được xem");
            return;
        }

        if (!showProcedureFields && audienceScope === "COMPANY") {
            if (isCrossCompany) {
                if (!values.targetCompanyIds || values.targetCompanyIds.length === 0) {
                    message.error("Vui lòng chọn ít nhất 1 công ty được xem");
                    return;
                }
            } else if (!values.companyId) {
                message.error("Vui lòng chọn công ty được xem");
                return;
            }
        }

        if (showProcedureFields && procedureType) {
            payload.procedureType = procedureType;

            if (procedureType === "COMPANY" || procedureType === "CONFIDENTIAL" || (procedureType === "DEPARTMENT" && !selectedCategory?.mappingProcedure)) {
                let deptId = values.departmentId;
                if (procedureType === "COMPANY" && !deptId && departmentOptions.length > 0) {
                    const defaultDept = departmentOptions.find(d => 
                        d.label.toLowerCase().includes("ban giám đốc") || 
                        d.label.toLowerCase().includes("hội đồng quản trị") ||
                        d.label.toLowerCase().includes("tổng giám đốc")
                    ) || departmentOptions[0];
                    deptId = defaultDept.value;
                }
                payload.departmentId = deptId || undefined;
                payload.sectionId = values.sectionId || undefined;
            }

            if (procedureType === "DEPARTMENT" && selectedCategory?.mappingProcedure) {
                payload.departmentIds = values.departmentIds || undefined;
                payload.sectionId = values.sectionId || undefined;
            }

            if (procedureType === "CONFIDENTIAL") {
                payload.userIds = values.userIds?.length ? values.userIds : undefined;
            }
        } else {
            payload.departmentId = values.departmentId || undefined;
            payload.sectionId = values.sectionId || undefined;
            if (audienceScope === "COMPANY") {
                if (isCrossCompany) {
                    payload.targetCompanyIds = values.targetCompanyIds;
                    payload.procedureType = "COMPANY";
                } else {
                    if (!payload.departmentId) {
                        if (departmentOptions.length === 0) {
                            message.error("Công ty này chưa có phòng ban để gắn văn bản");
                            return;
                        }
                        const defaultDept = departmentOptions.find(d =>
                            d.label.toLowerCase().includes("ban giám đốc") ||
                            d.label.toLowerCase().includes("hội đồng quản trị") ||
                            d.label.toLowerCase().includes("tổng giám đốc")
                        ) || departmentOptions[0];
                        payload.departmentId = defaultDept.value;
                    }
                    payload.procedureType = "COMPANY";
                }
            }
            if (audienceScope === "DEPARTMENT") {
                payload.procedureType = "DEPARTMENT";
            }
            if (audienceScope === "SELECTED_USERS") {
                payload.procedureType = "CONFIDENTIAL";
                payload.userIds = values.userIds?.length ? values.userIds : undefined;
            }
        }

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

        const singleDepartmentLabel =
            procedureType === "COMPANY" ? "Phòng ban phụ trách" : "Phòng ban áp dụng";

        return (
            <>
                <Row gutter={16}>
                    <Col span={12}>
                        <Form.Item
                            label="Đơn vị áp dụng"
                            name="companyId"
                            rules={[{ required: true, message: "Vui lòng chọn công ty" }]}
                        >
                            <Select
                                placeholder="Chọn công ty"
                                options={companyOptions}
                                onChange={handleCompanyChange}
                                showSearch
                                optionFilterProp="label"
                            />
                        </Form.Item>
                    </Col>

                    {(procedureType === "COMPANY" || procedureType === "CONFIDENTIAL" || (procedureType === "DEPARTMENT" && !selectedCategory?.mappingProcedure)) && (
                        <Col span={12}>
                            <Form.Item
                                label={procedureType === "DEPARTMENT" ? "Phòng ban áp dụng" : singleDepartmentLabel}
                                name="departmentId"
                                rules={[{ required: procedureType !== "COMPANY", message: "Vui lòng chọn phòng ban" }]}
                                // extra removed per user request
                            >
                                <Select
                                    placeholder="Chọn phòng ban"
                                    options={departmentOptions}
                                    onChange={handleDepartmentChange}
                                    disabled={!selectedCompanyId}
                                    showSearch
                                    optionFilterProp="label"
                                    allowClear
                                />
                            </Form.Item>
                        </Col>
                    )}

                    {procedureType === "DEPARTMENT" && selectedCategory?.mappingProcedure && (
                        <Col span={12}>
                            <Form.Item
                                label="Phòng ban"
                                name="departmentIds"
                                rules={[{ required: true, message: "Vui lòng chọn ít nhất 1 phòng ban" }]}
                            >
                                <Select
                                    placeholder="Chọn phòng ban"
                                    options={departmentOptions}
                                    mode="multiple"
                                    disabled={!selectedCompanyId}
                                    showSearch
                                    optionFilterProp="label"
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

        const needsCompany = audienceScope === "SELECTED_USERS" || audienceScope === "DEPARTMENT" || audienceScope === "COMPANY";
        const needsDepartment = audienceScope === "DEPARTMENT";
        const needsUsers = audienceScope === "SELECTED_USERS";
        const companyLabel = audienceScope === "COMPANY" ? "Công ty được xem" : "Công ty";
        const departmentLabel = audienceScope === "DEPARTMENT" ? "Phòng ban được xem" : "Phòng ban ban hành";

        return (
            <>
                <Divider orientation="left" orientationMargin={0}>Ai được xem?</Divider>

                <Form.Item
                    label="Phạm vi xem"
                    required
                    extra={
                        audienceScope === "PRIVATE"
                            ? "Chỉ người tạo và quản trị viên có quyền phù hợp xem được văn bản."
                            : audienceScope === "SELECTED_USERS"
                                ? "Chọn từng người được xem văn bản. Phù hợp với văn bản liên công ty hoặc cần giới hạn người xem."
                                : audienceScope === "DEPARTMENT"
                                    ? "Người thuộc phòng ban được chọn sẽ xem được văn bản."
                                    : "Người thuộc công ty được chọn sẽ xem được văn bản."
                    }
                >
                    <Radio.Group
                        optionType="button"
                        buttonStyle="solid"
                        options={AUDIENCE_OPTIONS}
                        value={audienceScope}
                        onChange={(e) => handleAudienceChange(e.target.value)}
                    />
                </Form.Item>

                {isCrossCompany && audienceScope === "SELECTED_USERS" && (
                    <Alert
                        type="warning"
                        showIcon
                        style={{ marginBottom: 16 }}
                        message="Loại văn bản liên công ty"
                        description="Văn bản liên công ty dạng bảo mật yêu cầu chọn đích danh từng người nhận."
                    />
                )}

                {isCrossCompany && audienceScope === "COMPANY" && (
                    <Row gutter={16}>
                        <Col span={24}>
                            <Form.Item
                                label="Chọn các công ty được xem"
                                name="targetCompanyIds"
                                rules={[{ required: true, message: "Vui lòng chọn ít nhất 1 công ty" }]}
                            >
                                <Select
                                    mode="multiple"
                                    maxTagCount="responsive"
                                    placeholder="Chọn các công ty..."
                                    options={companyOptions}
                                    allowClear
                                    showSearch
                                    optionFilterProp="label"
                                    style={{ width: '100%' }}
                                />
                            </Form.Item>
                        </Col>
                    </Row>
                )}

                <Row gutter={16}>
                    {needsCompany && !isCrossCompany && (
                    <Col span={12}>
                        <Form.Item
                            label={companyLabel}
                            name="companyId"
                            rules={[{ required: audienceScope === "COMPANY", message: "Vui lòng chọn công ty" }]}
                        >
                            <Select
                                placeholder="Chọn công ty"
                                options={companyOptions}
                                onChange={handleCompanyChange}
                                allowClear
                                showSearch
                                optionFilterProp="label"
                            />
                        </Form.Item>
                    </Col>
                    )}
                    {audienceScope !== "PRIVATE" && (!isCrossCompany || audienceScope !== "COMPANY") && (
                    <Col span={12}>
                        <Form.Item
                            label={departmentLabel}
                            name="departmentId"
                            rules={[{ required: needsDepartment, message: "Vui lòng chọn phòng ban" }]}
                            extra={audienceScope === "COMPANY" ? "Có thể bỏ trống. Hệ thống sẽ tự gắn phòng ban phụ trách đầu tiên của công ty." : undefined}
                        >
                            <Select
                                placeholder={needsDepartment ? "Chọn phòng ban được xem" : "Chọn phòng ban (tuỳ chọn)"}
                                options={departmentOptions}
                                onChange={handleDepartmentChange}
                                disabled={!selectedCompanyId}
                                allowClear
                                showSearch
                                optionFilterProp="label"
                            />
                        </Form.Item>
                    </Col>
                    )}
                </Row>

                {(audienceScope === "DEPARTMENT" || (audienceScope === "COMPANY" && !isCrossCompany)) && (
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
                    </Row>
                )}

                {needsUsers && (
                    <Row gutter={16}>
                        {!isCrossCompany && (
                            <Col span={12}>
                                <Form.Item label="Phòng ban gợi ý" name="departmentId">
                                    <Select
                                        placeholder="Chọn phòng ban để lọc người dùng (tuỳ chọn)"
                                        options={departmentOptions}
                                        onChange={handleDepartmentChange}
                                        disabled={!selectedCompanyId}
                                        allowClear
                                        showSearch
                                        optionFilterProp="label"
                                    />
                                </Form.Item>
                            </Col>
                        )}
                        <Col span={isCrossCompany ? 24 : 12}>
                            <UserSelectField
                                companyId={selectedCompanyId}
                                selectedUserCount={userCount}
                                onCountChange={setUserCount}
                                isCrossCompany={isCrossCompany}
                            />
                        </Col>
                    </Row>
                )}
            </>
        );
    };

    const isLoading = createMutation.isPending || updateMutation.isPending || uploading;

    const ACCENT = "#f5317f";
    const ACCENT_HOVER = "#d4206a";

    return (
        <ConfigProvider
            theme={{
                token: {
                    colorPrimary: ACCENT,
                },
                components: {
                    Button: {
                        colorPrimary: ACCENT,
                        colorPrimaryHover: ACCENT_HOVER,
                    },
                    Tabs: {
                        colorPrimary: ACCENT,
                    },
                    Select: {
                        colorPrimary: "#1677ff",
                        colorPrimaryHover: "#4096ff",
                        controlItemBgActive: "#e6f4ff",
                    }
                }
            }}
        >
        <ModalForm
            title={isEdit ? "Cập nhật văn bản" : "Thêm văn bản"}
            open={openModal}
            form={form}
            modalProps={{
                destroyOnHidden: true,
                onCancel: () => {
                    setOpenModal(false);
                    setDataInit(null);
                    resetAll();
                },
                width: 860,
            }}
            submitter={{
                render: (props) => {
                    if (activeTab === "1") {
                        return [
                            <Button key="cancel" onClick={() => props.onReset?.()}>
                                Huỷ
                            </Button>,
                            <Button
                                key="next"
                                type="primary"
                                onClick={async () => {
                                    try {
                                        await form.validateFields(["documentCode", "categoryId", "documentName", "status", "issuedDate"]);
                                        setActiveTab("2");
                                    } catch (e) {
                                        // Form validation failed on tab 1
                                    }
                                }}
                            >
                                Tiếp tục
                            </Button>,
                        ];
                    }
                    return [
                        <Button key="cancel" onClick={() => props.onReset?.()}>
                            Huỷ
                        </Button>,
                        <Button key="back" onClick={() => setActiveTab("1")}>
                            Quay lại
                        </Button>,
                        <Button
                            key="submit"
                            type="primary"
                            onClick={() => props.form?.submit()}
                            loading={isLoading}
                            disabled={uploading}
                        >
                            {isEdit ? "Cập nhật" : "Tạo mới"}
                        </Button>,
                    ];
                },
            }}
            onFinish={handleSubmit}
        >
            <Form.Item name="fileUrls" hidden>
                <Input />
            </Form.Item>

            <Tabs
                activeKey={activeTab}
                onChange={setActiveTab}
                items={[
                    {
                        key: "1",
                        label: "Thông tin chung",
                        children: (
                            <div style={{ paddingTop: 16 }}>
                                <Row gutter={16}>
                                    <Col span={12}>
                                        <Form.Item
                                            label="Mã văn bản"
                                            name="documentCode"
                                            rules={[
                                                { required: true, message: "Vui lòng nhập mã văn bản" },
                                                { max: 100, message: "Tối đa 100 ký tự" }
                                            ]}
                                        >
                                            <Input
                                                placeholder="VD: QC-NS-001"
                                                disabled={isEdit}
                                                style={{ textTransform: "uppercase" }}
                                            />
                                        </Form.Item>
                                    </Col>
                                    <Col span={12}>
                                        <Form.Item
                                            label="Loại văn bản"
                                            name="categoryId"
                                            rules={[{ required: true, message: "Vui lòng chọn loại văn bản" }]}
                                        >
                                            <Select
                                                placeholder="Chọn loại văn bản"
                                                options={categoryOptions}
                                                onChange={handleCategoryChange}
                                                showSearch
                                                optionFilterProp="label"
                                            />
                                        </Form.Item>
                                    </Col>
                                </Row>

                                <Form.Item
                                    label="Tên văn bản"
                                    name="documentName"
                                    rules={[
                                        { required: true, message: "Vui lòng nhập tên văn bản" },
                                        { max: 250, message: "Tối đa 250 ký tự" },
                                    ]}
                                >
                                    <Input placeholder="VD: Quy chế nhân sự" />
                                </Form.Item>

                                <Row gutter={16}>
                                    {isEdit && (
                                        <Col span={12}>
                                            <Form.Item label="Trạng thái" name="status">
                                                <Select
                                                    placeholder="Chọn trạng thái"
                                                    options={STATUS_OPTIONS}
                                                    allowClear
                                                />
                                            </Form.Item>
                                        </Col>
                                    )}
                                    <Col span={isEdit ? 12 : 24}>
                                        <Form.Item label="Ngày ban hành" name="issuedDate">
                                            <DatePicker
                                                format="DD/MM/YYYY"
                                                style={{ width: "100%" }}
                                                placeholder="Chọn ngày ban hành"
                                            />
                                        </Form.Item>
                                    </Col>
                                </Row>

                                <Form.Item label="Ghi chú" name="note">
                                    <Input placeholder="Ghi chú thêm..." />
                                </Form.Item>

                                <Form.Item label="File văn bản">
                                    <Upload {...uploadProps}>
                                        <div style={{
                                            height: 32,
                                            border: "1px dashed #d1d5db",
                                            borderRadius: 8,
                                            padding: "0 12px",
                                            display: "flex",
                                            alignItems: "center",
                                            gap: 6,
                                            cursor: "pointer",
                                            background: "#fafafa",
                                            color: "#6b7280",
                                            fontSize: 12,
                                            whiteSpace: "nowrap",
                                        }}>
                                            <UploadOutlined style={{ fontSize: 12 }} />
                                            {uploading ? "Đang upload..." : "Thêm file PDF, Word, Excel"}
                                            <span style={{ color: "#9ca3af" }}>(PDF, Word, Excel)</span>
                                        </div>
                                    </Upload>
                                </Form.Item>
                            </div>
                        )
                    },
                    {
                        key: "2",
                        label: "Phân quyền & Phạm vi",
                        children: (
                            <div style={{ paddingTop: 16 }}>
                                {showProcedureFields && (
                                    <Alert
                                        type="info"
                                        showIcon
                                        style={{ marginBottom: 16 }}
                                        message="Văn bản quy trình"
                                        description="Loại văn bản này sẽ được liên kết với module quy trình. Bạn chỉ cần chọn phạm vi áp dụng bên dưới."
                                    />
                                )}

                                {!showProcedureFields && selectedCategory?.isCrossCompany && (
                                    <Alert
                                        type="warning"
                                        showIcon
                                        style={{ marginBottom: 16 }}
                                        message="Văn bản liên công ty"
                                        description="Văn bản này cần chọn danh sách người nhận để cấp quyền xem và theo dõi trạng thái đã đọc."
                                    />
                                )}

                                {showProcedureFields && (
                                    <Row gutter={16}>
                                        <Col span={12}>
                                            <Form.Item
                                                label="Quy trình áp dụng cho"
                                                name="procedureType"
                                                rules={[{ required: true, message: "Vui lòng chọn cấp áp dụng" }]}
                                            >
                                                <Select
                                                    placeholder="Chọn cấp áp dụng"
                                                    options={PROCEDURE_TYPE_OPTIONS}
                                                    onChange={handleProcedureTypeChange}
                                                />
                                            </Form.Item>
                                        </Col>
                                    </Row>
                                )}

                                {renderProcedureLocationFields()}
                                {renderAudienceFields()}
                            </div>
                        )
                    }
                ]}
            />
        </ModalForm>
        </ConfigProvider>
    );
};

export default ModalDocument;
