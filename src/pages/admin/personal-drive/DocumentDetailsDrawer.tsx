import React from "react";
import { Drawer, Space, Descriptions, Tag, Button, Empty } from "antd";
import {
    InfoCircleOutlined,
    FileOutlined,
    EyeOutlined,
    DownloadOutlined,
} from "@ant-design/icons";
import type { IDocument } from "@/types/backend";
import dayjs from "dayjs";
import { getFileIcon, buildDocumentFileUrl } from "./utils";
import { downloadFile } from "@/config/file-utils";
import { useResponsiveModalWidth } from "@/utils/responsive";

interface DocumentDetailsDrawerProps {
    open: boolean;
    selectedDocDetails: IDocument | null;
    onClose: () => void;
    onPreview: (url: string, title: string) => void;
}

const ACCOUNTING_DOC_CATEGORY_CODE = "ACCOUNTING_DOC";

export const DocumentDetailsDrawer: React.FC<DocumentDetailsDrawerProps> = ({
    open,
    selectedDocDetails,
    onClose,
    onPreview,
}) => {
    const drawerWidth = useResponsiveModalWidth(420);

    const handleDownload = async () => {
        const raw = selectedDocDetails?.fileUrls?.[0];
        if (raw) {
            const secureUrl = buildDocumentFileUrl(raw, false);
            const displayName = raw.split("/").pop() ?? raw;
            await downloadFile(secureUrl, displayName);
        }
    };

    return (
        <Drawer
            title={
                <Space>
                    <InfoCircleOutlined style={{ color: "#3b82f6" }} />
                    <span>Chi tiết tài liệu</span>
                </Space>
            }
            placement="right"
            width={drawerWidth}
            onClose={onClose}
            open={open}
            destroyOnHidden
        >
            {selectedDocDetails ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                    <div
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            padding: "24px 16px",
                            background: "#f8fafc",
                            borderRadius: 12,
                            border: "1px solid #f1f5f9",
                            textAlign: "center",
                        }}
                    >
                        <div style={{ marginBottom: 12 }}>
                            {selectedDocDetails.fileUrls?.[0] ? (
                                getFileIcon(selectedDocDetails.fileUrls[0])
                            ) : (
                                <FileOutlined style={{ fontSize: 48, color: "#94a3b8" }} />
                            )}
                        </div>
                        <h4 style={{ fontSize: 15, fontWeight: 600, color: "#1e293b", margin: 0, wordBreak: "break-all" }}>
                            {selectedDocDetails.documentName}
                        </h4>
                    </div>

                    <Descriptions title="Thông tin chi tiết" column={1} size="small" bordered>
                        <Descriptions.Item label="Mã tài liệu">
                            <span style={{ fontFamily: "monospace", fontWeight: 600, color: "#475569" }}>
                                {selectedDocDetails.documentCode}
                            </span>
                        </Descriptions.Item>
                        <Descriptions.Item label="Danh mục">
                            {selectedDocDetails.category?.categoryCode === ACCOUNTING_DOC_CATEGORY_CODE ? (
                                <Tag style={{ backgroundColor: "#fff0f6", color: "#c41d7f", border: "1px solid #ffadd2", borderRadius: 4, margin: 0 }}>
                                    Kế toán: {selectedDocDetails.accountingCategory?.categoryName || "Chứng từ kế toán"}
                                </Tag>
                            ) : selectedDocDetails.category?.categoryName ? (
                                <Tag style={{ backgroundColor: "#eff6ff", color: "#1d4ed8", border: "1px solid #bfdbfe", borderRadius: 4, margin: 0 }}>
                                    {selectedDocDetails.category.categoryName}
                                </Tag>
                            ) : (
                                <span style={{ color: "#94a3b8", fontStyle: "italic" }}>Chưa phân loại</span>
                            )}
                        </Descriptions.Item>
                        <Descriptions.Item label="Ngày tải lên">
                            {dayjs(selectedDocDetails.createdAt).format("DD/MM/YYYY HH:mm")}
                        </Descriptions.Item>
                        <Descriptions.Item label="Người tải lên">
                            {selectedDocDetails.createdBy || "Hệ thống"}
                        </Descriptions.Item>
                        <Descriptions.Item label="Ghi chú">
                            <span style={{ whiteSpace: "pre-line" }}>
                                {selectedDocDetails.note || <span style={{ color: "#94a3b8", fontStyle: "italic" }}>Không có ghi chú</span>}
                            </span>
                        </Descriptions.Item>
                    </Descriptions>

                    <div style={{ marginTop: 10, display: "flex", gap: 12 }}>
                        {selectedDocDetails.fileUrls?.[0] && (
                            <>
                                <Button
                                    type="primary"
                                    icon={<EyeOutlined />}
                                    style={{ flex: 1 }}
                                    onClick={() => {
                                        const firstFile = selectedDocDetails.fileUrls?.[0] || "";
                                        onPreview(buildDocumentFileUrl(firstFile, true), selectedDocDetails.documentName);
                                    }}
                                >
                                    Xem trước tệp
                                </Button>
                                <Button icon={<DownloadOutlined />} onClick={handleDownload}>
                                    Tải về
                                </Button>
                            </>
                        )}
                    </div>
                </div>
            ) : (
                <Empty description="Không tìm thấy thông tin tài liệu" />
            )}
        </Drawer>
    );
};

export default React.memo(DocumentDetailsDrawer);
