import { useEffect, useState } from "react";
import { Form, Input, DatePicker, Row, Col, Upload, Button, Select, Alert } from "antd";
import { ModalForm } from "@ant-design/pro-components";
import { UploadOutlined } from "@ant-design/icons";
import type { UploadFile, UploadProps } from "antd";
import dayjs from "dayjs";

import type { IAccountingDocumentRequest, IDocument } from "@/types/backend";
import {
    useCreateAccountingDocumentMutation,
    useUpdateAccountingDocumentMutation,
} from "@/hooks/useAccountingDocuments";
import { useAccountingDocumentCategoryActiveQuery } from "@/hooks/useAccountingDocumentCategories";
import { callUploadSingleFile } from "@/config/api";

interface Props {
    open: boolean;
    setOpen: (v: boolean) => void;
    dataInit: IDocument | null;
    setDataInit: (v: IDocument | null) => void;
}

const buildDocumentFileUrl = (fileName?: string) => {
    if (!fileName) return undefined;
    if (/^https?:\/\//i.test(fileName)) return fileName;
    const normalized = fileName.replace(/^\/+/, "");
    const path = normalized.includes("/") ? normalized : `documents/${normalized}`;
    return `${import.meta.env.VITE_BACKEND_URL}/storage/${path.split("/").map(encodeURIComponent).join("/")}`;
};

const ModalAccountingDoc = ({
    open,
    setOpen,
    dataInit,
    setDataInit,
}: Props) => {
    const [form] = Form.useForm();
    const isEdit = !!dataInit?.id;

    const [fileList, setFileList] = useState<UploadFile[]>([]);
    const [uploading, setUploading] = useState(false);

    const createMutation = useCreateAccountingDocumentMutation();
    const updateMutation = useUpdateAccountingDocumentMutation();
    const { data: accountingCategories = [], isLoading: isLoadingCategories } = useAccountingDocumentCategoryActiveQuery();

    const normalizeFileUrls = (fileUrls?: string[] | string) => {
        if (!fileUrls) return [];
        return Array.isArray(fileUrls) ? fileUrls : fileUrls.split(",").filter(Boolean);
    };

    useEffect(() => {
        if (dataInit) {
            const urls = normalizeFileUrls(dataInit.fileUrls);
            form.setFieldsValue({
                documentCode: dataInit.documentCode,
                documentName: dataInit.documentName,
                accountingCategoryId: dataInit.accountingCategory?.id,
                issuedDate: dataInit.issuedDate ? dayjs(dataInit.issuedDate) : null,
                fileUrls: urls,
            });

            if (urls.length > 0) {
                setFileList(
                    urls.map((url, i) => ({
                        uid: String(i),
                        name: url.split("/").pop() || `File_scan_${i + 1}`,
                        status: "done",
                        url: buildDocumentFileUrl(url),
                        response: { data: { fileName: url } }, // Để re-use khi upload thêm
                    }))
                );
            } else {
                setFileList([]);
            }
        } else {
            form.resetFields();
            setFileList([]);
        }
    }, [dataInit, form]);

    const handleUpload: UploadProps["customRequest"] = async ({ file, onSuccess, onError }) => {
        try {
            setUploading(true);
            const res = await callUploadSingleFile(file as File, "documents");
            if (res?.data?.fileName) {
                onSuccess?.(res);
            } else {
                onError?.(new Error("Lỗi upload"));
            }
        } catch (error) {
            onError?.(error instanceof Error ? error : new Error("Lỗi upload"));
        } finally {
            setUploading(false);
        }
    };

    const handleChange: UploadProps["onChange"] = (info) => {
        let newFileList = [...info.fileList];
        newFileList = newFileList.map((file) => {
            if (file.response?.data?.fileName) {
                file.url = buildDocumentFileUrl(file.response.data.fileName);
            }
            return file;
        });
        setFileList(newFileList);
    };

    const onFinish = async (values: {
        documentName: string;
        accountingCategoryId?: number;
        issuedDate?: dayjs.Dayjs;
    }) => {
        const fileUrls = fileList
            .map((f) => f.response?.data?.fileName)
            .filter(Boolean);

        const payload: IAccountingDocumentRequest = {
            documentCode: isEdit ? dataInit?.documentCode : undefined,
            documentName: values.documentName,
            accountingCategoryId: values.accountingCategoryId,
            issuedDate: values.issuedDate ? values.issuedDate.toISOString() : undefined,
            fileUrls,
            folderId: dataInit?.folder?.id,
        };

        if (isEdit && dataInit?.id) {
            updateMutation.mutate(
                { id: dataInit.id, data: payload },
                {
                    onSuccess: () => {
                        setOpen(false);
                        setDataInit(null);
                    },
                }
            );
        } else {
            createMutation.mutate(payload, {
                onSuccess: () => {
                    setOpen(false);
                    setDataInit(null);
                },
            });
        }
    };

    return (
        <ModalForm
            title={isEdit ? "Cập nhật chứng từ" : "Thêm mới chứng từ"}
            open={open}
            onOpenChange={(v) => {
                setOpen(v);
                if (!v) setDataInit(null);
            }}
            form={form}
            onFinish={onFinish}
            submitter={dataInit?.isLocked ? false : undefined}
            modalProps={{
                destroyOnHidden: true,
                maskClosable: false,
                okText: isEdit ? "Cập nhật" : "Tạo mới",
                cancelText: "Hủy",
                confirmLoading: createMutation.isPending || updateMutation.isPending || uploading,
                width: 600,
            }}
        >
            {dataInit?.isLocked && (
                <Alert
                    message={`Chứng từ này đã được kế toán thu thập và khoá bởi ${dataInit.lockedBy || "Kế toán"}`}
                    description="Bạn không thể chỉnh sửa chứng từ lúc này. Vui lòng liên hệ Kế toán nếu cần thay đổi."
                    type="warning"
                    showIcon
                    style={{ marginBottom: 16 }}
                />
            )}
            <fieldset disabled={dataInit?.isLocked} style={{ border: 'none', padding: 0, margin: 0 }}>
            <Row gutter={16}>
                <Col span={12}>
                    <Form.Item
                        label="Mã lưu hồ sơ (Mã chứng từ)"
                        name="documentCode"
                    >
                        <Input 
                            disabled 
                            placeholder={isEdit ? "" : "Hệ thống tự động sinh mã luỹ tiến"} 
                            style={{ color: isEdit ? "rgba(0, 0, 0, 0.88)" : undefined }}
                        />
                    </Form.Item>
                </Col>

                <Col span={12}>
                    <Form.Item
                        label="Ngày chứng từ"
                        name="issuedDate"
                        rules={[{ required: true, message: "Vui lòng chọn ngày chứng từ" }]}
                    >
                        <DatePicker style={{ width: "100%" }} format="DD/MM/YYYY" placeholder="Chọn ngày" />
                    </Form.Item>
                </Col>

                <Col span={24}>
                    <Form.Item
                        label="Loại chứng từ"
                        name="accountingCategoryId"
                        rules={[{ required: true, message: "Vui lòng chọn loại chứng từ" }]}
                    >
                        <Select
                            showSearch
                            loading={isLoadingCategories}
                            optionFilterProp="label"
                            placeholder="Chọn loại chứng từ"
                            options={accountingCategories.map((item) => ({
                                label: item.symbol ? `${item.categoryName} (${item.symbol})` : item.categoryName,
                                value: item.id,
                            }))}
                        />
                    </Form.Item>
                </Col>

                <Col span={24}>
                    <Form.Item
                        label="Nội dung / Diễn giải"
                        name="documentName"
                        rules={[{ required: true, message: "Vui lòng nhập nội dung chứng từ" }]}
                    >
                        <Input.TextArea rows={3} placeholder="Ví dụ: Đề nghị thanh toán chi phí Marketing tháng 6..." />
                    </Form.Item>
                </Col>

                <Col span={24}>
                    <Form.Item label="Tệp đính kèm (File Scan)">
                        <Upload
                            name="file"
                            multiple
                            customRequest={handleUpload}
                            fileList={fileList}
                            onChange={handleChange}
                            accept=".pdf,.png,.jpg,.jpeg,.doc,.docx,.xls,.xlsx"
                        >
                            <Button icon={<UploadOutlined />} loading={uploading}>
                                Tải file lên
                            </Button>
                        </Upload>
                    </Form.Item>
                </Col>
            </Row>
            </fieldset>
        </ModalForm>
    );
};

export default ModalAccountingDoc;
