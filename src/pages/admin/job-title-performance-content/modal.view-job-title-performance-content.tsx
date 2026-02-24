// src/pages/admin/job-title-performance-content/modal.view-job-title-performance-content.tsx

import { Modal, Descriptions, Tag, Badge, Divider } from "antd";
import type { IJobTitlePerformanceContent } from "@/types/backend";

interface Props {
    open: boolean;
    onClose: () => void;
    data?: IJobTitlePerformanceContent | null;
}

const ViewJobTitlePerformanceContentModal = ({ open, onClose, data }: Props) => {
    if (!data) return null;

    return (
        <Modal
            open={open}
            onCancel={onClose}
            footer={null}
            width={1000}
            centered
            title={
                <>
                    Chi tiết tiêu chí đánh giá - <Tag color="blue">Bậc {data.salaryGradeNumber}</Tag>
                </>
            }
        >
            <Descriptions bordered column={1} size="middle">
                <Descriptions.Item label="Trạng thái">
                    {data.active ? (
                        <Badge status="success" text="Hoạt động" />
                    ) : (
                        <Badge status="error" text="Vô hiệu" />
                    )}
                </Descriptions.Item>
            </Descriptions>

            <Divider orientation="left" style={{ margin: "24px 0 16px" }}>
                Nội dung chi tiết
            </Divider>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
                <div>
                    <strong style={{ color: "#1890ff", fontSize: 15 }}>Nội dung A</strong>
                    <div
                        style={{
                            marginTop: 8,
                            padding: 16,
                            background: "#f6f8fa",
                            borderRadius: 8,
                            border: "1px solid #e0e0e0",
                            whiteSpace: "pre-line",
                            wordBreak: "break-word",
                            lineHeight: 1.7,
                            minHeight: 120,
                        }}
                    >
                        {data.contentA || "—"}
                    </div>
                </div>

                <div>
                    <strong style={{ color: "#1890ff", fontSize: 15 }}>Nội dung B</strong>
                    <div
                        style={{
                            marginTop: 8,
                            padding: 16,
                            background: "#f6f8fa",
                            borderRadius: 8,
                            border: "1px solid #e0e0e0",
                            whiteSpace: "pre-line",
                            wordBreak: "break-word",
                            lineHeight: 1.7,
                            minHeight: 120,
                        }}
                    >
                        {data.contentB || "—"}
                    </div>
                </div>

                <div>
                    <strong style={{ color: "#1890ff", fontSize: 15 }}>Nội dung C</strong>
                    <div
                        style={{
                            marginTop: 8,
                            padding: 16,
                            background: "#f6f8fa",
                            borderRadius: 8,
                            border: "1px solid #e0e0e0",
                            whiteSpace: "pre-line",
                            wordBreak: "break-word",
                            lineHeight: 1.7,
                            minHeight: 120,
                        }}
                    >
                        {data.contentC || "—"}
                    </div>
                </div>

                <div>
                    <strong style={{ color: "#1890ff", fontSize: 15 }}>Nội dung D</strong>
                    <div
                        style={{
                            marginTop: 8,
                            padding: 16,
                            background: "#f6f8fa",
                            borderRadius: 8,
                            border: "1px solid #e0e0e0",
                            whiteSpace: "pre-line",
                            wordBreak: "break-word",
                            lineHeight: 1.7,
                            minHeight: 120,
                        }}
                    >
                        {data.contentD || "—"}
                    </div>
                </div>
            </div>
        </Modal>
    );
};

export default ViewJobTitlePerformanceContentModal;