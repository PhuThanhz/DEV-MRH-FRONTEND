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
    message,
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
} from "@ant-design/icons";
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
    callFetchAccountingDocumentCategoryActive,
    callFetchAccountingDossierCategoryActive,
    callUploadSingleFile,
} from "@/config/api";
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

    const { data: departments = [], isFetching: loadingDepartments } =
        useDepartmentsByCompanyQuery(selectedCompanyId);
    const { data: sections = [], isFetching: loadingSections } =
        useSectionsByDepartmentQuery(selectedDepartmentId);

    const [categories, setCategories] = useState<any[]>([]);
    const [dossierCategories, setDossierCategories] = useState<IAccountingDossierCategory[]>([]);
    const [loadingCats, setLoadingCats] = useState(false);
    const [loadingDossierCats, setLoadingDossierCats] = useState(false);

    useEffect(() => {
        if (!open) return;
        setLoadingCats(true);
        callFetchAccountingDocumentCategoryActive()
            .then((res) => setCategories((res as any)?.data || []))
            .catch(() => setCategories([]))
            .finally(() => setLoadingCats(false));
        setLoadingDossierCats(true);
        callFetchAccountingDossierCategoryActive()
            .then((res) => setDossierCategories((res as any)?.data || []))
            .catch(() => setDossierCategories([]))
            .finally(() => setLoadingDossierCats(false));
    }, [open]);

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
        <Modal
            className="accounting-dossier-form-modal"
            open={open}
            title={initialValues?.id ? "Cập nhật bộ chứng từ" : "Tạo bộ chứng từ"}
            width={getModalWidth(900)}
            centered
            destroyOnClose
            onCancel={handleCancel}
            footer={[
                <Button key="cancel" onClick={handleCancel}>
                    Hủy
                </Button>,
                <Button
                    key="submit"
                    type="primary"
                    loading={loading}
                    onClick={() => form.submit()}
                >
                    Lưu nháp
                </Button>,
            ]}
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
            >
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
                        <Col xs={24} md={12}>
                            <Form.Item
                                label="Mẫu bộ chứng từ"
                                name="dossierCategoryId"
                                rules={[{ required: true, message: "Vui lòng chọn mẫu bộ chứng từ" }]}
                            >
                                <Select
                                    showSearch
                                    loading={loadingDossierCats}
                                    placeholder="Chọn mẫu do admin/kế toán khai báo"
                                    optionFilterProp="label"
                                    options={dossierCategories.map((item) => ({
                                        value: item.id,
                                        label: `${item.categoryName}${item.version ? ` (v${item.version})` : ""}`,
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
                                    rules={[
                                        {
                                            required: true,
                                            validator: (_rule, value) => (value ? Promise.resolve() : Promise.reject()),
                                            message: "Vui lòng nhập tên danh mục",
                                        },
                                    ]}
                                >
                                    <Input placeholder="VD: Hồ sơ thanh toán phát sinh" />
                                </Form.Item>
                            </Col>
                            <Col xs={24} md={8}>
                                <Form.Item
                                    label="Đề xuất lưu thành mẫu"
                                    name="syncCategoryRequested"
                                    valuePropName="checked"
                                >
                                    <Switch />
                                </Form.Item>
                            </Col>
                        </>
                    )}
                    <Col span={24}>
                        <Form.Item
                            label="Nội dung"
                            name="content"
                            rules={[
                                { required: true, message: "Vui lòng nhập nội dung" },
                                { max: 1000, message: "Nội dung tối đa 1000 ký tự" },
                            ]}
                        >
                            <Input.TextArea
                                rows={2}
                                placeholder="Nhập nội dung bộ chứng từ"
                                showCount
                                maxLength={1000}
                            />
                        </Form.Item>
                    </Col>

                    {!initialValues?.id && selectedCategoryMode === "UNSTRUCTURED" && (
                        <Col span={24}>
                            <div className="font-semibold mb-2 mt-4 text-gray-700">Danh sách chứng từ phát sinh</div>
                            <Form.List name="documents">
                                {(fields, { add, remove }) => (
                                    <>
                                        {fields.map(({ key, name, ...restField }) => {
                                            return (
                                                <Row key={key} gutter={16} className="mb-2 items-start bg-gray-50 p-2 rounded">
                                                    <Col span={7}>
                                                        <Form.Item
                                                            {...restField}
                                                            name={[name, 'accountingCategoryId']}
                                                            rules={[{ required: true, message: 'Chọn loại' }]}
                                                            className="mb-0"
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
                                                    </Col>
                                                    <Col span={8}>
                                                        <Form.Item
                                                            {...restField}
                                                            name={[name, 'documentName']}
                                                            rules={[{ required: true, message: 'Nhập tên' }]}
                                                            className="mb-0"
                                                        >
                                                            <Input placeholder="Tên chứng từ" />
                                                        </Form.Item>
                                                    </Col>
                                                    <Col span={7}>
                                                        <Form.Item noStyle shouldUpdate>
                                                            {() => {
                                                                const rowFileUrls = splitFileUrls(form.getFieldValue(["documents", name, "fileUrl"]));
                                                                return (
                                                                    <>
                                                                        <Form.Item
                                                                            {...restField}
                                                                            name={[name, 'fileUrl']}
                                                                            hidden
                                                                        >
                                                                            <Input />
                                                                        </Form.Item>
                                                                        <Form.Item className="mb-0">
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
                                                                                                        message.success(`Đã tải: ${getFileDisplayName(uploadedFileName)}`);
                                                                                                    } else {
                                                                                                        message.error(`Lỗi tải file: ${selectedFile.name}`);
                                                                                                    }
                                                                                                }
                                                                                            } catch (e) {
                                                                                                message.error("Lỗi tải file");
                                                                                            }
                                                                                            return Upload.LIST_IGNORE;
                                                                                        }}
                                                                                    >
                                                                                        <UploadOutlined style={{ cursor: "pointer", color: "#1677ff" }} />
                                                                                    </Upload>
                                                                                }
                                                                            />
                                                                        </Form.Item>
                                                                        {rowFileUrls.length > 0 && (
                                                                            <div className="mt-1 flex flex-wrap gap-1">
                                                                                {rowFileUrls.map((url) => (
                                                                                    <Tooltip key={url} title={url}>
                                                                                        <Tag color="blue" className="max-w-[190px] truncate">
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
                                                    </Col>
                                                    <Col span={2} className="flex justify-center mt-1">
                                                        <Button danger type="text" icon={<DeleteOutlined />} onClick={() => remove(name)} />
                                                    </Col>
                                                    <Form.Item noStyle shouldUpdate>
                                                        {() => {
                                                            const rowCategoryId = form.getFieldValue(["documents", name, "accountingCategoryId"]);
                                                            const rowCategory = categories.find((item) => item.id === rowCategoryId);
                                                            if (!isInvoiceCategory(rowCategory)) {
                                                                return null;
                                                            }

                                                            return (
                                                                <Col span={24}>
                                                                    <details className="mt-2 rounded border border-blue-100 bg-blue-50/40 px-3 py-2">
                                                                        <summary className="cursor-pointer select-none text-sm font-semibold text-blue-700">
                                                                            Thông tin hóa đơn
                                                                        </summary>
                                                                        <Row gutter={[8, 0]} className="mt-2">
                                                                            <Col xs={24} md={4}>
                                                                                <Form.Item
                                                                                    {...restField}
                                                                                    name={[name, "invoiceDate"]}
                                                                                    label="Ngày hóa đơn"
                                                                                    className="mb-1"
                                                                                >
                                                                                    <DatePicker className="w-full" format="DD/MM/YYYY" />
                                                                                </Form.Item>
                                                                            </Col>
                                                                            <Col xs={24} md={5}>
                                                                                <Form.Item
                                                                                    {...restField}
                                                                                    name={[name, "invoiceNumber"]}
                                                                                    label="Số hóa đơn"
                                                                                    className="mb-1"
                                                                                >
                                                                                    <Input placeholder="VD: 00012345" />
                                                                                </Form.Item>
                                                                            </Col>
                                                                            <Col xs={24} md={7}>
                                                                                <Form.Item
                                                                                    {...restField}
                                                                                    name={[name, "invoiceContent"]}
                                                                                    label="Nội dung hóa đơn"
                                                                                    className="mb-1"
                                                                                >
                                                                                    <Input placeholder="Nội dung" />
                                                                                </Form.Item>
                                                                            </Col>
                                                                            <Col xs={24} md={4}>
                                                                                <Form.Item
                                                                                    {...restField}
                                                                                    name={[name, "partnerName"]}
                                                                                    label="Đối tác"
                                                                                    className="mb-1"
                                                                                >
                                                                                    <Input placeholder="Tên đối tác" />
                                                                                </Form.Item>
                                                                            </Col>
                                                                            <Col xs={24} md={4}>
                                                                                <Form.Item
                                                                                    {...restField}
                                                                                    name={[name, "partnerType"]}
                                                                                    label="Loại đối tác"
                                                                                    className="mb-1"
                                                                                >
                                                                                    <Select
                                                                                        allowClear
                                                                                        options={[
                                                                                            { value: "SUPPLIER", label: "Nhà cung cấp" },
                                                                                            { value: "CUSTOMER", label: "Khách hàng" },
                                                                                            { value: "OTHER", label: "Khác" },
                                                                                        ]}
                                                                                    />
                                                                                </Form.Item>
                                                                            </Col>
                                                                            <Col xs={24} md={5}>
                                                                                <Form.Item
                                                                                    {...restField}
                                                                                    name={[name, "amount"]}
                                                                                    label="Số tiền"
                                                                                    className="mb-1"
                                                                                >
                                                                                    <InputNumber className="w-full" min={0} precision={2} />
                                                                                </Form.Item>
                                                                            </Col>
                                                                            <Col xs={24} md={3}>
                                                                                <Form.Item
                                                                                    {...restField}
                                                                                    name={[name, "currency"]}
                                                                                    label="Tiền tệ"
                                                                                    className="mb-1"
                                                                                    initialValue="VND"
                                                                                >
                                                                                    <Select
                                                                                        options={[
                                                                                            { value: "VND", label: "VND" },
                                                                                            { value: "USD", label: "USD" },
                                                                                        ]}
                                                                                    />
                                                                                </Form.Item>
                                                                            </Col>
                                                                            <Col xs={24} md={16}>
                                                                                <Form.Item
                                                                                    {...restField}
                                                                                    name={[name, "externalLink"]}
                                                                                    label="Link bên ngoài"
                                                                                    className="mb-0"
                                                                                >
                                                                                    <Input placeholder="Link hóa đơn điện tử hoặc NAS" />
                                                                                </Form.Item>
                                                                            </Col>
                                                                        </Row>
                                                                    </details>
                                                                </Col>
                                                            );
                                                        }}
                                                    </Form.Item>
                                                </Row>
                                            );
                                        })}
                                        <Form.Item className="mb-0 mt-2">
                                            <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                                                Thêm dòng chứng từ
                                            </Button>
                                        </Form.Item>
                                    </>
                                )}
                            </Form.List>
                        </Col>
                    )}
                    {initialValues?.id && (
                        <Col span={24}>
                            {initialValues.qrCode && (
                                <div className="mb-4 rounded border border-pink-100 bg-pink-50/30 p-4 flex flex-col sm:flex-row items-center gap-6">
                                    <div className="flex flex-col items-center shrink-0">
                                        <img
                                            src={`data:image/png;base64,${initialValues.qrCode}`}
                                            alt="Mã QR"
                                            className="w-28 h-28 border border-gray-200 rounded-lg bg-white p-1"
                                        />
                                        <span className="text-[10px] text-gray-500 mt-1 font-medium">Mã QR Bộ chứng từ</span>
                                    </div>
                                    <div className="flex-1 text-center sm:text-left">
                                        <h4 className="text-sm font-semibold text-gray-800 mb-1">Mã hệ thống: {initialValues.dossierCode || `BCT-${initialValues.id}`}</h4>
                                        <p className="text-xs text-gray-500 mb-3">Tải mã QR để dán lên bộ chứng từ hoặc In trực tiếp Phiếu bìa hồ sơ khổ A4 theo đúng biểu mẫu kế toán Lotus.</p>
                                        <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
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
                                                Tải ảnh QR
                                            </Button>
                                            <Button
                                                type="primary"
                                                icon={<PrinterOutlined />}
                                                onClick={() => window.print()}
                                                size="small"
                                                style={{ background: "#be185d", borderColor: "#be185d" }}
                                            >
                                                In phiếu bìa A4
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Phiếu in ấn ẩn (chỉ hiển thị khi in) */}
                            <DossierCoverSheet dossier={initialValues} />

                            <div className="mt-4 rounded border border-gray-200 bg-gray-50 p-3">
                                <DossierDocumentList
                                    dossier={initialValues}
                                    editable={editableStatuses.includes(initialValues.status)}
                                    reviewable={false}
                                />
                            </div>
                        </Col>
                    )}
                </Row>
            </Form>
        </Modal>
    );
};

export default AccountingDossierModal;
