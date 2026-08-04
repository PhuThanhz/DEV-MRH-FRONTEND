import React, { useState } from "react";
import { Button, Form, Input, Modal, Space, Tooltip, Typography, Upload } from "antd";
import {
    FileDoneOutlined,
    CloudUploadOutlined,
    FileImageOutlined,
    FilePdfOutlined,
    FileWordOutlined,
    FileExcelOutlined,
    FileZipOutlined,
    FileTextOutlined,
    DeleteOutlined,
} from "@ant-design/icons";
import { useSubmitTaskResultMutation } from "@/hooks/useTasks";
import { useUploadTaskAttachmentFileMutation } from "@/hooks/useTaskAttachments";
import { notify } from "@/components/common/notification/notify";
import { useResponsiveModalWidth } from "@/utils/responsive";

const { Text } = Typography;
const { Dragger } = Upload;

const formatFileSize = (bytes?: number): string => {
    if (!bytes || bytes <= 0) return "0 KB";
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const cleanFileName = (fileName: string): string =>
    fileName?.replace(/^\d+[-_]/, "") || "Tệp đính kèm";

const getFileIconAndBg = (fileName: string) => {
    const ext = fileName?.split(".").pop()?.toLowerCase() || "";
    if (["png", "jpg", "jpeg", "gif", "webp", "svg"].includes(ext)) {
        return {
            icon: <FileImageOutlined style={{ fontSize: 18, color: "#ec4899" }} />,
            bgColor: "#fce7f3",
        };
    }
    if (ext === "pdf") {
        return {
            icon: <FilePdfOutlined style={{ fontSize: 18, color: "#ef4444" }} />,
            bgColor: "#fee2e2",
        };
    }
    if (["doc", "docx"].includes(ext)) {
        return {
            icon: <FileWordOutlined style={{ fontSize: 18, color: "#2563eb" }} />,
            bgColor: "#dbeafe",
        };
    }
    if (["xls", "xlsx", "csv"].includes(ext)) {
        return {
            icon: <FileExcelOutlined style={{ fontSize: 18, color: "#16a34a" }} />,
            bgColor: "#dcfce7",
        };
    }
    if (["zip", "rar", "7z"].includes(ext)) {
        return {
            icon: <FileZipOutlined style={{ fontSize: 18, color: "#d97706" }} />,
            bgColor: "#fef3c7",
        };
    }
    return {
        icon: <FileTextOutlined style={{ fontSize: 18, color: "#64748b" }} />,
        bgColor: "#f1f5f9",
    };
};

interface Props {
    open: boolean;
    taskId: number | null;
    onClose: () => void;
}

interface ReportFormValues {
    resultSummary: string;
    deliverables?: string;
    issues?: string;
}

interface UploadedReportFile {
    uid: string;
    name: string;
    status: "done";
    fileName: string;
    folder: string;
    fileSize: number;
}

const trimOptional = (value?: string) => value?.trim() || undefined;

export const TaskSubmitResultModal: React.FC<Props> = ({ open, taskId, onClose }) => {
    const modalWidth = useResponsiveModalWidth(680);
    const [form] = Form.useForm<ReportFormValues>();
    const [fileList, setFileList] = useState<UploadedReportFile[]>([]);

    const submitMutation = useSubmitTaskResultMutation();
    const uploadMutation = useUploadTaskAttachmentFileMutation();

    const resetAndClose = () => {
        form.resetFields();
        setFileList([]);
        onClose();
    };

    const handleUpload = async (file: File & { uid: string }) => {
        if (file.size > 50 * 1024 * 1024) {
            notify.error("Mỗi tệp báo cáo tối đa 50 MB", {
                title: "Tệp vượt quá dung lượng cho phép",
            });
            return Upload.LIST_IGNORE;
        }

        try {
            const res = await uploadMutation.mutateAsync({
                file,
                folder: "documents",
            });
            const uploadedFileName = res?.data?.fileName;
            if (uploadedFileName) {
                setFileList((prev) => [
                    ...prev,
                    {
                        uid: file.uid,
                        name: file.name,
                        status: "done",
                        fileName: uploadedFileName,
                        folder: "documents",
                        fileSize: file.size,
                    },
                ]);
                notify.success(`Đã tải lên ${file.name}`);
            } else {
                notify.error("Không thể tải tệp báo cáo");
            }
        } catch (error: any) {
            notify.error(error?.message || "Vui lòng thử lại", {
                title: "Không thể tải tệp báo cáo",
            });
        }
        return false;
    };

    const handleRemove = (file: { uid: string }) => {
        setFileList((prev) => prev.filter((item) => item.uid !== file.uid));
    };

    const handleSubmit = async () => {
        try {
            const values = await form.validateFields();
            if (!taskId) return;

            await submitMutation.mutateAsync({
                id: taskId,
                data: {
                    resultSummary: values.resultSummary.trim(),
                    deliverables: trimOptional(values.deliverables),
                    issues: trimOptional(values.issues),
                    attachments: fileList.map((file) => ({
                        fileName: file.fileName,
                        folder: file.folder,
                        fileSize: file.fileSize,
                    })),
                },
            });

            resetAndClose();
        } catch {
            // Ant Design hiển thị lỗi xác thực ngay tại trường nhập liệu.
        }
    };

    return (
        <Modal
            className="task-report-modal"
            title={
                <div className="task-report-modal__title">
                    <span className="task-report-modal__title-icon">
                        <FileDoneOutlined />
                    </span>
                    <span>
                        <Text strong>Nộp kết quả</Text>
                        <Text type="secondary">
                            Tóm tắt công việc và gửi người giao việc nghiệm thu.
                        </Text>
                    </span>
                </div>
            }
            open={open}
            onCancel={resetAndClose}
            onOk={handleSubmit}
            confirmLoading={submitMutation.isPending || uploadMutation.isPending}
            okText="Gửi nghiệm thu"
            cancelText="Hủy"
            okButtonProps={{
                className: "task-report-modal__submit",
                disabled: uploadMutation.isPending,
            }}
            cancelButtonProps={{ className: "task-report-modal__cancel" }}
            width={modalWidth}
            centered
            destroyOnHidden
        >
            <Form
                form={form}
                layout="vertical"
                className="task-report-form"
                requiredMark={false}
                validateTrigger={["onBlur", "onSubmit"]}
            >
                <Form.Item
                    name="resultSummary"
                    label={
                        <span className="task-report-form__label">
                            <b>Kết quả thực hiện</b>
                            <span className="task-report-form__required" aria-hidden="true">*</span>
                        </span>
                    }
                    rules={[
                        { required: true, whitespace: true, message: "Vui lòng nhập kết quả thực hiện" },
                    ]}
                >
                    <Input.TextArea
                        rows={4}
                        maxLength={4000}
                        placeholder="Mô tả ngắn gọn phần đã hoàn thành và kết quả đạt được..."
                    />
                </Form.Item>

                <section className="task-report-form__evidence" aria-labelledby="task-report-evidence-title">
                    <div className="task-report-form__section-heading">
                        <b id="task-report-evidence-title">Minh chứng bàn giao</b>
                        <span className="task-report-form__optional">Không bắt buộc</span>
                    </div>

                    <Form.Item label="Tệp đính kèm" className="task-report-form__upload-item">
                        <Dragger
                            className="task-report-uploader"
                            beforeUpload={handleUpload}
                            onRemove={handleRemove}
                            fileList={fileList as any}
                            multiple
                            disabled={uploadMutation.isPending}
                            itemRender={(_, file) => {
                                const fileObj = file as any;
                                const fileName = fileObj.fileName || fileObj.name || "Tệp đính kèm";
                                const fileSize = fileObj.fileSize || fileObj.size || 0;
                                const { icon, bgColor } = getFileIconAndBg(fileName);

                                return (
                                    <div
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "space-between",
                                            padding: "5px 10px",
                                            marginTop: 6,
                                            background: "#ffffff",
                                            border: "1px solid #e2e8f0",
                                            borderRadius: 8,
                                            boxShadow: "0 1px 2px rgba(15, 23, 42, 0.03)",
                                            transition: "all 0.15s ease",
                                        }}
                                    >
                                        <Space align="center" size={8} style={{ minWidth: 0, flex: 1 }}>
                                            <div
                                                style={{
                                                    width: 28,
                                                    height: 28,
                                                    borderRadius: 6,
                                                    background: bgColor,
                                                    display: "grid",
                                                    placeItems: "center",
                                                    flexShrink: 0,
                                                }}
                                            >
                                                {icon}
                                            </div>
                                            <div style={{ minWidth: 0, flex: 1, display: "flex", alignItems: "center", gap: 6 }}>
                                                <Text
                                                    ellipsis
                                                    style={{
                                                        fontSize: 12.5,
                                                        fontWeight: 600,
                                                        color: "#0f172a",
                                                        lineHeight: 1.2,
                                                    }}
                                                >
                                                    {cleanFileName(fileName)}
                                                </Text>
                                                <Text type="secondary" style={{ fontSize: 11, color: "#64748b", flexShrink: 0 }}>
                                                    ({formatFileSize(fileSize)})
                                                </Text>
                                            </div>
                                        </Space>
                                        <Tooltip title="Xóa tệp">
                                            <Button
                                                type="text"
                                                danger
                                                icon={<DeleteOutlined style={{ fontSize: 13 }} />}
                                                onClick={() => handleRemove(file as any)}
                                                style={{ borderRadius: 6, width: 26, height: 26, padding: 0 }}
                                            />
                                        </Tooltip>
                                    </div>
                                );
                            }}
                        >
                            <div className="task-report-uploader__content">
                                <CloudUploadOutlined className="task-report-uploader__icon" />
                                <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                    <Text strong style={{ fontSize: 12.5, color: "#0f172a" }}>Chọn hoặc kéo thả tệp</Text>
                                    <Text type="secondary" style={{ fontSize: 11, color: "#64748b" }}>(Tối đa 50 MB/tệp)</Text>
                                </span>
                            </div>
                        </Dragger>
                    </Form.Item>

                    <Form.Item name="deliverables" label="Liên kết hoặc nơi lưu" style={{ marginTop: 16, marginBottom: 0 }}>
                        <Input.TextArea
                            rows={2}
                            maxLength={2500}
                            placeholder="Dán liên kết tài liệu hoặc ghi nơi lưu sản phẩm..."
                        />
                    </Form.Item>
                </section>

                <Form.Item
                    name="issues"
                    label={
                        <span className="task-report-form__label">
                            <b>Ghi chú cho người nghiệm thu</b>
                            <span className="task-report-form__optional">Không bắt buộc</span>
                        </span>
                    }
                >
                    <Input.TextArea
                        rows={2}
                        maxLength={2000}
                        placeholder="Nội dung còn lại, rủi ro hoặc việc cần tiếp tục theo dõi..."
                    />
                </Form.Item>
            </Form>
        </Modal>
    );
};
