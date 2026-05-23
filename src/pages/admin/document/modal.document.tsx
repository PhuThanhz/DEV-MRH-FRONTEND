import { useEffect, useState } from "react";
import { Form, Input, Select, DatePicker, Row, Col, Upload, message } from "antd";
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
    { label: "Công ty", value: "COMPANY" },
    { label: "Phòng ban", value: "DEPARTMENT" },
    { label: "Bảo mật", value: "CONFIDENTIAL" },
];

const STATUS_OPTIONS = [
    { label: "Cần tạo", value: "NEED_CREATE" },
    { label: "Đang hiệu lực", value: "IN_PROGRESS" },
    { label: "Cần cập nhật", value: "NEED_UPDATE" },
    { label: "Đã huỷ", value: "TERMINATED" },
];

const ModalDocument = ({
    openModal,
    setOpenModal,
    dataInit,
    setDataInit,
}: Props) => {
    const [form] = Form.useForm();
    const isEdit = !!dataInit?.id;

    const [showProcedureFields, setShowProcedureFields] = useState(false);
    const [isCrossCompany, setIsCrossCompany] = useState(false);
    const [procedureType, setProcedureType] = useState<DocumentProcedureType | null>(null);
    const [selectedCompanyId, setSelectedCompanyId] = useState<number | null>(null);
    const [selectedDepartmentId, setSelectedDepartmentId] = useState<number | null>(null);
    const [fileList, setFileList] = useState<UploadFile[]>([]);
    const [uploading, setUploading] = useState(false);
    const [userCount, setUserCount] = useState(0);

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

    const resetCascadeFields = () => {
        setSelectedCompanyId(null);
        setSelectedDepartmentId(null);
        setUserCount(0);
        form.setFieldsValue({
            companyId: undefined,
            departmentId: undefined,
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
        setSelectedCompanyId(null);
        setSelectedDepartmentId(null);
        setUserCount(0);
    };

    useEffect(() => {
        if (openModal) {
            if (dataInit) {
                const isMappingProcedure = dataInit.category?.mappingProcedure ?? false;
                setShowProcedureFields(isMappingProcedure);
                setIsCrossCompany(dataInit.category?.isCrossCompany ?? false);

                const pType = dataInit.procedureType ?? null;
                setProcedureType(pType);

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
                    userIds: !isMappingProcedure ? existingUserIds : undefined,
                });
            } else {
                resetAll();
                form.setFieldValue("fileUrls", []);
            }
        }
    }, [openModal, dataInit]);

    const handleCategoryChange = (categoryId: number) => {
        const selected = categoryOptions.find((c) => c.value === categoryId);
        const hasMappingProcedure = selected?.mappingProcedure ?? false;
        setShowProcedureFields(hasMappingProcedure);
        setIsCrossCompany(selected?.isCrossCompany ?? false);
        setProcedureType(null);
        resetCascadeFields();
        form.setFieldsValue({ procedureType: undefined });
    };

    const handleProcedureTypeChange = (val: DocumentProcedureType) => {
        setProcedureType(val);
        resetCascadeFields();
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

        if (isCrossCompany && (!values.userIds || values.userIds.length === 0)) {
            message.error("Vui lòng chọn danh sách người nhận cho văn bản liên công ty");
            return;
        }

        if (showProcedureFields && procedureType) {
            payload.procedureType = procedureType;

            if (procedureType === "COMPANY" || procedureType === "CONFIDENTIAL") {
                payload.departmentId = values.departmentId || undefined;
                payload.sectionId = values.sectionId || undefined;
            }

            if (procedureType === "DEPARTMENT") {
                payload.departmentIds = values.departmentIds || undefined;
                payload.sectionId = values.sectionId || undefined;
            }

            if (procedureType === "CONFIDENTIAL") {
                payload.userIds = values.userIds?.length ? values.userIds : undefined;
            }
        } else {
            payload.departmentId = values.departmentId || undefined;
            payload.sectionId = values.sectionId || undefined;
            payload.userIds = values.userIds?.length ? values.userIds : undefined;
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

        return (
            <>
                <Row gutter={16}>
                    <Col span={12}>
                        <Form.Item
                            label="Công ty"
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

                    {(procedureType === "COMPANY" || procedureType === "CONFIDENTIAL") && (
                        <Col span={12}>
                            <Form.Item
                                label="Phòng ban"
                                name="departmentId"
                                rules={[{ required: true, message: "Vui lòng chọn phòng ban" }]}
                            >
                                <Select
                                    placeholder="Chọn phòng ban"
                                    options={departmentOptions}
                                    onChange={handleDepartmentChange}
                                    disabled={!selectedCompanyId}
                                    showSearch
                                    optionFilterProp="label"
                                />
                            </Form.Item>
                        </Col>
                    )}

                    {procedureType === "DEPARTMENT" && (
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

    const renderNonProcedureLocationFields = () => {
        if (showProcedureFields) return null;

        return (
            <>
                <Row gutter={16}>
                    <Col span={12}>
                        <Form.Item label="Công ty" name="companyId">
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
                    <Col span={12}>
                        <Form.Item label="Phòng ban" name="departmentId">
                            <Select
                                placeholder="Chọn phòng ban"
                                options={departmentOptions}
                                onChange={handleDepartmentChange}
                                disabled={!selectedCompanyId}
                                allowClear
                                showSearch
                                optionFilterProp="label"
                            />
                        </Form.Item>
                    </Col>
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
                    <Col span={12}>
                        <UserSelectField
                            companyId={selectedCompanyId}
                            selectedUserCount={userCount}
                            onCountChange={setUserCount}
                            isCrossCompany={isCrossCompany}
                        />
                    </Col>
                </Row>
            </>
        );
    };

    const isLoading = createMutation.isPending || updateMutation.isPending || uploading;

    return (
        <ModalForm
            title={isEdit ? "Cập nhật văn bản" : "Thêm văn bản"}
            open={openModal}
            form={form}
            modalProps={{
                destroyOnClose: true,
                onCancel: () => {
                    setOpenModal(false);
                    setDataInit(null);
                    resetAll();
                },
                width: 760,
            }}
            submitter={{
                searchConfig: {
                    submitText: isEdit ? "Cập nhật" : "Tạo mới",
                    resetText: "Huỷ",
                },
                submitButtonProps: {
                    loading: isLoading,
                    disabled: uploading,
                },
            }}
            onFinish={handleSubmit}
        >
            <Form.Item name="fileUrls" hidden>
                <Input />
            </Form.Item>

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

            {showProcedureFields && (
                <Row gutter={16}>
                    <Col span={12}>
                        <Form.Item
                            label="Loại quy trình"
                            name="procedureType"
                            rules={[{ required: true, message: "Vui lòng chọn loại quy trình" }]}
                        >
                            <Select
                                placeholder="Chọn loại quy trình"
                                options={PROCEDURE_TYPE_OPTIONS}
                                onChange={handleProcedureTypeChange}
                            />
                        </Form.Item>
                    </Col>
                </Row>
            )}

            {renderProcedureLocationFields()}
            {renderNonProcedureLocationFields()}

            {/* ✅ Bỏ planYear, chỉ còn Trạng thái + Ngày ban hành */}
            <Row gutter={16}>
                <Col span={12}>
                    <Form.Item label="Trạng thái" name="status">
                        <Select
                            placeholder="Chọn trạng thái"
                            options={STATUS_OPTIONS}
                            allowClear
                        />
                    </Form.Item>
                </Col>
                <Col span={12}>
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
        </ModalForm>
    );
};

export default ModalDocument;