import React from "react";
import { Empty } from "antd";
import { FolderOpenOutlined } from "@ant-design/icons";

interface EmptyStateProps {
    type?: "no-folder-selected" | "no-documents" | "simple";
    title?: string;
    description?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
    type = "simple",
    title,
    description,
}) => {
    if (type === "no-folder-selected") {
        return (
            <div
                style={{
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    alignItems: "center",
                    height: "100%",
                    minHeight: 450,
                    background: "#f8fafc",
                    borderRadius: 16,
                    border: "1px dashed #cbd5e1",
                    padding: 24,
                    textAlign: "center",
                }}
            >
                <div
                    style={{
                        width: 80,
                        height: 80,
                        borderRadius: "50%",
                        backgroundColor: "#eff6ff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        marginBottom: 20,
                        boxShadow: "0 10px 15px -3px rgba(59, 130, 246, 0.1)",
                    }}
                >
                    <FolderOpenOutlined style={{ fontSize: 36, color: "#3b82f6" }} />
                </div>
                <h3 style={{ fontSize: 16, fontWeight: 600, color: "#1e293b", marginBottom: 8 }}>
                    {title || "Chọn thư mục làm việc"}
                </h3>
                <p style={{ fontSize: 13, color: "#64748b", maxWidth: 320, margin: 0, lineHeight: 1.6 }}>
                    {description || "Vui lòng chọn một thư mục từ danh sách bên trái để bắt đầu quản lý và lưu trữ tài liệu cá nhân của bạn."}
                </p>
            </div>
        );
    }

    if (type === "no-documents") {
        return <Empty description={description || "Không có tài liệu nào"} style={{ margin: "50px 0" }} />;
    }

    return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={description} />;
};

export default React.memo(EmptyState);
