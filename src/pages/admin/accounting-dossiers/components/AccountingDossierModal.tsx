import React, { useEffect, useMemo, useState } from "react";
import {
    Button,
    Col,
    DatePicker,
    Form,
    Input,
    InputNumber,
    Modal,
    Row,
    Select,
    Space,
    Switch,
    Upload,
    Typography,
    Divider,
    Checkbox,
    Tooltip,
    Tag
} from "antd";
import {
    DeleteOutlined,
    PlusOutlined,
    UploadOutlined,
    InboxOutlined,
    FileTextOutlined,
    DownloadOutlined,
    PrinterOutlined,
    ApartmentOutlined,
    InfoCircleOutlined,
    CloudUploadOutlined,
    CheckCircleOutlined,
} from "@ant-design/icons";
import { notify } from "@/components/common/notification/notify";
import dayjs from "dayjs";
import type { Dayjs } from "dayjs";
import DossierCoverSheet from "./DossierCoverSheet";
import type {
    AccountingDossierCategoryMode,
    AccountingDossierStatus,
    IAccountingDossier,
    IAccountingDossierCategory,
    IAccountingDocumentCategory,
    ICompany,
} from "@/types/backend";
import {
    callUploadSingleFile,
} from "@/config/api";
import { useAccountingDocumentCategoryActiveQuery } from "@/hooks/useAccountingDocumentCategories";
import { useAccountingDossierCategoryActiveQuery } from "@/hooks/useAccountingDossiers";
import { useAppSelector } from "@/redux/hooks";
import { useDepartmentsByCompanyQuery } from "@/hooks/useDepartments";
import { useSectionsByDepartmentQuery } from "@/hooks/useSections";
import DossierDocumentList from "./DossierDocumentList";
import {
    type DossierFormValues,
    splitFileUrls,
    getFileDisplayName,
    inferDocumentNameFromFile,
    isInvoiceCategory,
} from "../dossierUtils";
import { editableStatuses } from "../dossierContext";
import { getModalWidth } from "@/utils/responsive";
import LotusDetailDrawer from "@/components/common/drawer/LotusDetailDrawer";

const AccountingDossierModal = ({
    open,
    companies,
    initialValues,
    loading,
    onCancel,
    onSubmit,
}: {
    open: boolean;
    companies: ICompany[];
    initialValues?: IAccountingDossier | null;
    loading?: boolean;
    onCancel: () => void;
    onSubmit: (values: DossierFormValues) => void;
}) => {
    const [form] = Form.useForm<DossierFormValues>();
    const selectedCompanyId = Form.useWatch("companyId", form);
    const selectedDepartmentId = Form.useWatch("departmentId", form);
    const selectedCategoryMode = Form.useWatch("categoryMode", form);
    const selectedDossierCategoryId = Form.useWatch("dossierCategoryId", form);

    const { data: departments = [], isFetching: loadingDepartments } =
        useDepartmentsByCompanyQuery(selectedCompanyId);
    const { data: sections = [], isFetching: loadingSections } =
        useSectionsByDepartmentQuery(selectedDepartmentId);

    const { data: categories = [], isLoading: loadingCats } = useAccountingDocumentCategoryActiveQuery();
    const { data: dossierCategories = [], isLoading: loadingDossierCats } = useAccountingDossierCategoryActiveQuery();

    const selectedCategory = useMemo(
        () => dossierCategories.find((c) => c.id === selectedDossierCategoryId),
        [dossierCategories, selectedDossierCategoryId]
    );

    const [uploading, setUploading] = useState(false);

    const handleBatchUpload = async (fileList: File[]) => {
        try {
            setUploading(true);
            const currentDocs = form.getFieldValue("documents") || [];
            const defaultCatId = categories[0]?.id;
            const newDocs = [...currentDocs];

            for (const selectedFile of fileList) {
                const res = await callUploadSingleFile(selectedFile, "documents");
                if (res?.data?.fileName) {
                    const uploadedFileName = res.data.fileName;
                    newDocs.push({
                        accountingCategoryId: defaultCatId,
                        documentName: inferDocumentNameFromFile(uploadedFileName),
                        documentType: "OTHER",
                        fileUrl: uploadedFileName,
                        currency: "VND",
                    });
                    notify.success(`Đã tải: ${getFileDisplayName(uploadedFileName)}`);
                } else {
                    notify.error(`Không thể tải tệp: ${selectedFile.name}`);
                }
            }
            form.setFieldValue("documents", newDocs);
        } catch (e) {
            notify.error("Không thể tải tệp");
        } finally {
            setUploading(false);
        }
    };

    useEffect(() => {
        if (!open) return;

        form.setFieldsValue({
            content: initialValues?.content || "",
            categoryMode: initialValues?.categoryMode || "TEMPLATE",
            dossierCategoryId: initialValues?.dossierCategory?.id,
            customCategoryName: initialValues?.customCategoryName || undefined,
            syncCategoryRequested: !!initialValues?.syncCategoryRequested,
            companyId: initialValues?.company?.id,
            departmentId: initialValues?.department?.id,
            sectionId: initialValues?.section?.id,
            documents: [], // always clear list when open
        });
    }, [form, initialValues, open]);

    const handleCancel = () => {
        form.resetFields();
        onCancel();
    };

    return (
        <LotusDetailDrawer
            open={open}
            onClose={handleCancel}
            destroyOnClose
            keyboard={false}
            maskClosable={false}
        >
            <Form
                form={form}
                layout="vertical"
                initialValues={{ categoryMode: "TEMPLATE", syncCategoryRequested: false }}
                onFinish={onSubmit}
                onValuesChange={(changed) => {
                    if ("companyId" in changed) {
                        form.setFieldsValue({ departmentId: undefined, sectionId: undefined });
                    }
                    if ("departmentId" in changed) {
                        form.setFieldsValue({ sectionId: undefined });
                    }
                    if (changed.categoryMode === "TEMPLATE") {
                        form.setFieldsValue({
                            dossierCategoryId: undefined,
                            customCategoryName: undefined,
                            syncCategoryRequested: false,
                            documents: [],
                        });
                    }
                    if (changed.categoryMode === "UNSTRUCTURED") {
                        form.setFieldsValue({ dossierCategoryId: undefined });
                    }
                }}
                className="flex flex-col h-full bg-[#f8f9fb]"
            >
                {/* ── HEADER ── */}
                <div className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between gap-4 shrink-0">
                    <div>
                        <Typography.Text className="text-[11px] uppercase font-semibold flex items-center gap-1.5" style={{ color: "#e8256b" }}>
                            <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: "#e8256b" }} />
                            Bộ chứng từ kế toán
                        </Typography.Text>
                        <h2 className="m-0 text-[20px] sm:text-[24px] font-bold text-gray-900 mt-0.5">
                            {initialValues?.id ? "Cập nhật bộ chứng từ" : "Tạo bộ chứng từ"}
                        </h2>
                    </div>
                    {initialValues?.dossierCode && (
                        <Tag color="magenta" className="text-sm px-3 py-1 font-semibold rounded-full m-0">
                            {initialValues.dossierCode}
                        </Tag>
                    )}
                </div>

                {/* ── BODY ── */}
                <div className="flex-1 overflow-y-auto p-5 sm:p-6 bg-[#f8f9fb]">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 w-full">
                        {/* ── LEFT COLUMN (MAIN FORM - 7 COLS) ── */}
                        <div className="lg:col-span-7 space-y-5">
                            {/* Card 1: Thông tin tổ chức & Phân loại */}
                            <div className="bg-white rounded-xl border border-gray-200/80 p-5 shadow-xs">
                                <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-100">
                                    <div className="w-7 h-7 rounded-lg bg-pink-50 flex items-center justify-center text-[#e8256b]">
                                        <ApartmentOutlined className="text-sm" />
                                    </div>
                                    <span className="font-semibold text-gray-800 text-sm">1. Phân loại & Đơn vị quản lý</span>
                                </div>
                                <Row gutter={[16, 0]}>
                                    <Col xs={24} md={12}>
                                        <Form.Item
                                            label="Công ty"
                                            name="companyId"
                                            rules={[{ required: true, message: "Vui lòng chọn công ty" }]}
                                        >
                                            <Select
                                                showSearch
                                                placeholder="Chọn công ty"
                                                optionFilterProp="label"
                                                popupMatchSelectWidth={false}
                                                options={companies.map((company) => ({
                                                    value: company.id,
                                                    label: company.name,
                                                }))}
                                            />
                                        </Form.Item>
                                    </Col>
                                    <Col xs={24} md={12}>
                                        <Form.Item
                                            label="Phòng ban"
                                            name="departmentId"
                                            rules={[{ required: true, message: "Vui lòng chọn phòng ban" }]}
                                        >
                                            <Select
                                                showSearch
                                                placeholder="Chọn phòng ban"
                                                optionFilterProp="label"
                                                popupMatchSelectWidth={false}
                                                loading={loadingDepartments}
                                                disabled={!selectedCompanyId}
                                                options={departments.map((department) => ({
                                                    value: department.id,
                                                    label: department.name,
                                                }))}
                                            />
                                        </Form.Item>
                                    </Col>
                                    <Col xs={24} md={12}>
                                        <Form.Item label="Bộ phận" name="sectionId">
                                            <Select
                                                allowClear
                                                showSearch
                                                placeholder="Chọn bộ phận"
                                                optionFilterProp="label"
                                                popupMatchSelectWidth={false}
                                                loading={loadingSections}
                                                disabled={!selectedDepartmentId}
                                                options={sections.map((section) => ({
                                                    value: section.id,
                                                    label: section.name,
                                                }))}
                                            />
                                        </Form.Item>
                                    </Col>
                                    <Col xs={24} md={12}>
                                        <Form.Item
                                            label="Danh mục bộ chứng từ"
                                            name="categoryMode"
                                            rules={[{ required: true, message: "Vui lòng chọn danh mục" }]}
                                        >
                                            <Select
                                                options={[
                                                    { value: "TEMPLATE", label: "Theo mẫu" },
                                                    { value: "UNSTRUCTURED", label: "Phi cấu trúc" },
                                                ]}
                                            />
                                        </Form.Item>
                                    </Col>

                                    {selectedCategoryMode === "TEMPLATE" && (
                                        <Col xs={24}>
                                            <Form.Item
                                                label="Mẫu bộ chứng từ"
                                                name="dossierCategoryId"
                                                rules={[{ required: true, message: "Vui lòng chọn mẫu bộ chứng từ" }]}
                                            >
                                                <Select
                                                    showSearch
                                                    placeholder="Chọn mẫu bộ chứng từ"
                                                    optionFilterProp="label"
                                                    popupMatchSelectWidth={false}
                                                    loading={loadingDossierCats}
                                                    options={dossierCategories.map((cat) => ({
                                                        value: cat.id,
                                                        label: `${cat.categoryName} (${cat.categoryCode || ""})`,
                                                    }))}
                                                />
                                            </Form.Item>
                                        </Col>
                                    )}

                                    {selectedCategoryMode === "UNSTRUCTURED" && (
                                        <>
                                            <Col xs={24} md={16}>
                                                <Form.Item
                                                    label="Tên danh mục phi cấu trúc"
                                                    name="customCategoryName"
                                                    rules={[{ required: true, message: "Vui lòng nhập tên danh mục" }]}
                                                >
                                                    <Input placeholder="VD: Hồ sơ mua sắm vật tư đột xuất..." />
                                                </Form.Item>
                                            </Col>
                                            <Col xs={24} md={8} className="flex items-center pt-2">
                                                <Form.Item name="syncCategoryRequested" valuePropName="checked" className="mb-0">
                                                    <Checkbox>Đề xuất lưu thành mẫu</Checkbox>
                                                </Form.Item>
                                            </Col>
                                        </>
                                    )}
                                </Row>
                            </div>

                            {/* Card 2: Nội dung bộ chứng từ */}
                            <div className="bg-white rounded-xl border border-gray-200/80 p-5 shadow-xs">
                                <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-100">
                                    <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                                        <FileTextOutlined className="text-sm" />
                                    </div>
                                    <span className="font-semibold text-gray-800 text-sm">2. Trích yếu & Nội dung hồ sơ</span>
                                </div>
                                <Form.Item
                                    label="Nội dung chi tiết"
                                    name="content"
                                    rules={[{ required: true, message: "Vui lòng nhập nội dung bộ chứng từ" }]}
                                    className="mb-0"
                                >
                                    <Input.TextArea
                                        rows={6}
                                        placeholder="Mô tả nội dung chi tiết mục đích khởi tạo bộ chứng từ kế toán..."
                                        showCount
                                        maxLength={1000}
                                    />
                                </Form.Item>
                            </div>
                        </div>

                        {/* ── RIGHT COLUMN (UPLOAD & ATTACHMENTS - 5 COLS) ── */}
                        <div className="lg:col-span-5 space-y-5">
                            {/* Card 3: UPLOAD TÀI LIỆU ĐÍNH KÈM (BÊN PHẢI) */}
                            <div className="bg-white rounded-xl border border-gray-200/80 p-5 shadow-xs">
                                <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
                                    <div className="flex items-center gap-2">
                                        <div className="w-7 h-7 rounded-lg bg-pink-50 flex items-center justify-center text-[#e8256b]">
                                            <CloudUploadOutlined className="text-sm" />
                                        </div>
                                        <span className="font-semibold text-gray-800 text-sm">Tài liệu & Chứng từ đính kèm</span>
                                    </div>
                                </div>

                                {!initialValues?.id && (
                                    <div className="mb-4 w-full">
                                        <Upload
                                            multiple={true}
                                            showUploadList={false}
                                            beforeUpload={async (file, fileList) => {
                                                if (file.uid !== fileList[0]?.uid) return Upload.LIST_IGNORE;
                                                await handleBatchUpload(fileList);
                                                return Upload.LIST_IGNORE;
                                            }}
                                            className="w-full block cursor-pointer [&>.ant-upload-select]:!w-full [&>.ant-upload-select]:!block [&>.ant-upload]:!w-full [&>.ant-upload]:!block"
                                            style={{ width: "100%", display: "block" }}
                                        >
                                            <div
                                                className="w-full border-2 border-dashed border-slate-200/90 rounded-2xl p-5 flex flex-col items-center justify-center text-center cursor-pointer bg-slate-50/50 hover:bg-white hover:border-[#e8256b] hover:shadow-xs transition-all group"
                                                style={{ width: "100%" }}
                                            >
                                                <div className="w-10 h-10 rounded-xl bg-pink-50 text-[#e8256b] flex items-center justify-center text-lg mb-2 group-hover:scale-105 transition-transform">
                                                    <CloudUploadOutlined />
                                                </div>
                                                <div className="text-xs font-bold text-slate-800 group-hover:text-[#e8256b] transition-colors">
                                                    {uploading ? "Đang tải tệp lên hệ thống..." : "Kéo thả tệp hoặc nhấp để chọn tải lên"}
                                                </div>
                                                <div className="text-[11px] text-slate-400 mt-0.5">
                                                    Hỗ trợ định dạng PDF, XML, XLSX, PNG, JPG (tải nhiều tệp cùng lúc)
                                                </div>
                                                <div className="flex gap-1.5 justify-center mt-2.5">
                                                    <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-500 font-mono text-[9px] font-semibold">PDF</span>
                                                    <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-500 font-mono text-[9px] font-semibold">XML</span>
                                                    <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-500 font-mono text-[9px] font-semibold">XLSX</span>
                                                    <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-500 font-mono text-[9px] font-semibold">PNG</span>
                                                </div>
                                            </div>
                                        </Upload>
                                    </div>
                                )}

                                {!initialValues?.id && selectedCategoryMode === "UNSTRUCTURED" && (
                                    <Form.List name="documents">
                                        {(fields, { add, remove }) => (
                                            <>
                                                {fields.map(({ key, name, ...restField }) => {
                                                    return (
                                                        <div key={key} className="mb-3 p-3 rounded-xl bg-slate-50/80 border border-slate-200/80 space-y-2">
                                                            <div className="flex items-center justify-between">
                                                                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Chứng từ #{name + 1}</span>
                                                                <Button danger type="text" size="small" icon={<DeleteOutlined />} onClick={() => remove(name)} />
                                                            </div>
                                                            <Form.Item
                                                                {...restField}
                                                                name={[name, 'accountingCategoryId']}
                                                                rules={[{ required: true, message: 'Chọn loại chứng từ' }]}
                                                                className="mb-2"
                                                            >
                                                                <Select
                                                                    placeholder="Loại chứng từ"
                                                                    showSearch
                                                                    optionFilterProp="label"
                                                                    onChange={() => {
                                                                        if (!form.getFieldValue(["documents", name, "currency"])) {
                                                                            form.setFieldValue(["documents", name, "currency"], "VND");
                                                                        }
                                                                    }}
                                                                    options={categories.map(c => ({ value: c.id, label: c.categoryName }))}
                                                                />
                                                            </Form.Item>
                                                            <Form.Item
                                                                {...restField}
                                                                name={[name, 'documentName']}
                                                                rules={[{ required: true, message: 'Nhập tên chứng từ' }]}
                                                                className="mb-2"
                                                            >
                                                                <Input placeholder="Tên chứng từ" />
                                                            </Form.Item>
                                                            <Form.Item noStyle shouldUpdate>
                                                                {() => {
                                                                    const rowFileUrls = splitFileUrls(form.getFieldValue(["documents", name, "fileUrl"]));
                                                                    return (
                                                                        <>
                                                                            <Form.Item {...restField} name={[name, 'fileUrl']} hidden>
                                                                                <Input />
                                                                            </Form.Item>
                                                                            <Input
                                                                                readOnly
                                                                                placeholder="Chưa có file"
                                                                                value={rowFileUrls.length ? `${rowFileUrls.length} file đã tải` : undefined}
                                                                                addonAfter={
                                                                                    <Upload
                                                                                        multiple={true}
                                                                                        showUploadList={false}
                                                                                        beforeUpload={async (file, fileList) => {
                                                                                            if (file.uid !== fileList[0]?.uid) {
                                                                                                return Upload.LIST_IGNORE;
                                                                                            }
                                                                                            try {
                                                                                                for (const selectedFile of fileList) {
                                                                                                    const res = await callUploadSingleFile(selectedFile, "documents");
                                                                                                    if (res?.data?.fileName) {
                                                                                                        const uploadedFileName = res.data.fileName;
                                                                                                        const currentVal = form.getFieldValue(["documents", name, "fileUrl"]);
                                                                                                        const currentDocName = form.getFieldValue(["documents", name, "documentName"]);
                                                                                                        const currentCategoryId = form.getFieldValue(["documents", name, "accountingCategoryId"]);
                                                                                                        if (currentVal) {
                                                                                                            add({
                                                                                                                accountingCategoryId: currentCategoryId,
                                                                                                                documentName: inferDocumentNameFromFile(uploadedFileName),
                                                                                                                documentType: "OTHER",
                                                                                                                fileUrl: uploadedFileName,
                                                                                                                currency: "VND",
                                                                                                            });
                                                                                                        } else {
                                                                                                            form.setFieldValue(["documents", name, "fileUrl"], uploadedFileName);
                                                                                                            if (!currentDocName) {
                                                                                                                form.setFieldValue(["documents", name, "documentName"], inferDocumentNameFromFile(uploadedFileName));
                                                                                                            }
                                                                                                        }
                                                                                                        notify.success(`Đã tải: ${getFileDisplayName(uploadedFileName)}`);
                                                                                                    } else {
                                                                                                        notify.error(`Không thể tải tệp: ${selectedFile.name}`);
                                                                                                    }
                                                                                                }
                                                                                            } catch (e) {
                                                                                                notify.error("Không thể tải tệp");
                                                                                            }
                                                                                            return Upload.LIST_IGNORE;
                                                                                        }}
                                                                                    >
                                                                                        <UploadOutlined style={{ cursor: "pointer", color: "#1677ff" }} />
                                                                                    </Upload>
                                                                                }
                                                                            />
                                                                            {rowFileUrls.length > 0 && (
                                                                                <div className="mt-1 flex flex-wrap gap-1">
                                                                                    {rowFileUrls.map((url) => (
                                                                                        <Tooltip key={url} title={url}>
                                                                                            <Tag color="blue" className="max-w-[200px] truncate">
                                                                                                {getFileDisplayName(url)}
                                                                                            </Tag>
                                                                                        </Tooltip>
                                                                                    ))}
                                                                                </div>
                                                                            )}
                                                                        </>
                                                                    );
                                                                }}
                                                            </Form.Item>
                                                        </div>
                                                    );
                                                })}
                                                <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />} className="mt-2">
                                                    Thêm chứng từ con
                                                </Button>
                                            </>
                                        )}
                                    </Form.List>
                                )}

                                {initialValues?.id && (
                                    <div>
                                        {initialValues.qrCode && (
                                            <div className="mb-4 rounded-lg border border-pink-100 bg-pink-50/30 p-3 flex items-center gap-4">
                                                <img
                                                    src={`data:image/png;base64,${initialValues.qrCode}`}
                                                    alt="Mã QR"
                                                    className="w-20 h-20 border border-gray-200 rounded bg-white p-1 shrink-0"
                                                />
                                                <div className="min-w-0 flex-1">
                                                    <h4 className="text-xs font-semibold text-gray-800 mb-0.5 truncate">{initialValues.dossierCode || `BCT-${initialValues.id}`}</h4>
                                                    <p className="text-[11px] text-gray-500 mb-2">Quét QR tra cứu hoặc in phiếu bìa A4.</p>
                                                    <div className="flex gap-1.5">
                                                        <Button
                                                            icon={<DownloadOutlined />}
                                                            onClick={() => {
                                                                const link = document.createElement("a");
                                                                link.href = `data:image/png;base64,${initialValues.qrCode}`;
                                                                link.download = `QR_${initialValues.dossierCode || initialValues.id}.png`;
                                                                link.click();
                                                            }}
                                                            size="small"
                                                        >
                                                            Tải QR
                                                        </Button>
                                                        <Button
                                                            type="primary"
                                                            icon={<PrinterOutlined />}
                                                            onClick={() => window.print()}
                                                            size="small"
                                                            style={{ background: "#be185d", borderColor: "#be185d" }}
                                                        >
                                                            In bìa A4
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        <DossierCoverSheet dossier={initialValues} />

                                        <div className="rounded-lg border border-gray-200 bg-gray-50/60 p-2.5">
                                            <DossierDocumentList
                                                dossier={initialValues}
                                                editable={editableStatuses.includes(initialValues.status)}
                                                reviewable={false}
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Card Thông tin mẫu & Luồng duyệt tự động */}
                            <div className="bg-white rounded-xl border border-gray-200/80 p-5 shadow-xs">
                                <div className="flex items-center gap-2 mb-3 pb-3 border-b border-gray-100">
                                    <InfoCircleOutlined style={{ color: "#e8256b" }} className="text-base" />
                                    <span className="font-semibold text-gray-800 text-sm">Luồng duyệt & Thông tin mẫu</span>
                                </div>
                                {selectedCategoryMode === "TEMPLATE" && selectedCategory ? (
                                    <div className="space-y-3">
                                        <div className="p-3 rounded-xl bg-pink-50/40 border border-pink-100">
                                            <div className="text-xs font-bold text-gray-900">{selectedCategory.categoryName}</div>
                                            <div className="text-[11px] text-gray-500 mt-0.5">
                                                {selectedCategory.description || "Danh mục áp dụng quy trình duyệt tự động theo chính sách đơn vị."}
                                            </div>
                                        </div>

                                        {selectedCategory.documentCategories && selectedCategory.documentCategories.length > 0 ? (
                                            <div>
                                                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                                                    Danh mục chứng từ yêu cầu ({selectedCategory.documentCategories.length})
                                                </div>
                                                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                                                    {selectedCategory.documentCategories.map((doc) => (
                                                        <div key={doc.id} className="flex items-center justify-between p-2 rounded-lg bg-slate-50 text-xs text-slate-700">
                                                            <div className="flex items-center gap-2 min-w-0">
                                                                <CheckCircleOutlined className="text-emerald-500 text-sm shrink-0" />
                                                                <span className="font-medium truncate">{doc.categoryName}</span>
                                                            </div>
                                                            {doc.categoryCode && (
                                                                <span className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded bg-slate-200/70 text-slate-600 shrink-0">
                                                                    {doc.categoryCode}
                                                                </span>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="text-xs text-slate-500 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-100">
                                                Mẫu bộ chứng từ chưa cấu hình danh sách chứng từ con bắt buộc. Bạn có thể tự do đính kèm các tệp liên quan ở khung phía trên.
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="text-xs text-slate-600 leading-relaxed space-y-2">
                                        <p className="m-0">
                                            Bộ chứng từ sau khi khởi tạo sẽ tự động điều hướng theo <strong>luồng phê duyệt đa cấp động</strong> của đơn vị (<em>Nhân viên ➔ Trưởng bộ phận ➔ Kế toán viên ➔ Kế toán trưởng ➔ Ban Giám đốc</em>).
                                        </p>
                                        <p className="m-0 text-[11px] text-slate-400">
                                            * Trạng thái và tiến trình duyệt chi tiết từng cấp sẽ được cập nhật theo thời gian thực ngay sau khi gửi duyệt.
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── FOOTER ── */}
                <div className="bg-white border-t border-gray-200 px-6 py-4 flex items-center justify-between shrink-0">
                    <span className="text-xs text-gray-400 hidden sm:inline-block">
                        Lotus HRM · Hệ thống quản lý bộ chứng từ kế toán
                    </span>
                    <div className="flex items-center gap-3 pr-12 sm:pr-16">
                        <Button onClick={handleCancel} style={{ borderRadius: 6, fontSize: 13, height: 38 }}>
                            Hủy
                        </Button>
                        <Button
                            type="primary"
                            loading={loading}
                            onClick={() => form.submit()}
                            style={{ background: "#e8256b", borderColor: "#e8256b", borderRadius: 6, fontSize: 13, height: 38, paddingInline: 24 }}
                        >
                            Lưu nháp
                        </Button>
                    </div>
                </div>
            </Form>
        </LotusDetailDrawer>
    );
};

export default AccountingDossierModal;
