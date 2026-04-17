import { useState } from "react";
import { Modal, Input, Typography, Space, Alert } from "antd";
import { RollbackOutlined, StopOutlined } from "@ant-design/icons";
import type { IJdInbox } from "@/types/backend";

const { Text } = Typography;

interface Props {
    open: boolean;
    record: IJdInbox | null;
    loading?: boolean;
    isResubmit?: boolean;
    onConfirm: (reason: string) => void;
    onCancel: () => void;
}

const ModalRejectJd = ({ open, record, loading, isResubmit = false, onConfirm, onCancel }: Props) => {
    const [reason, setReason] = useState("");
    const code = (record as any)?.code ?? "";
    const maxLength = 500;

    const handleConfirm = () => {
        if (!reason.trim()) return;
        onConfirm(reason);
        setReason("");
    };

    const handleCancel = () => {
        setReason("");
        onCancel();
    };

    const title = isResubmit ? "Trả lại JD" : "Từ chối JD";
    const confirmLabel = isResubmit ? "Xác nhận trả lại" : "Xác nhận từ chối";
    const note = isResubmit
        ? "JD sẽ được trả về người đã gửi cho bạn. Họ có thể chỉnh sửa hoặc từ chối tiếp."
        : "Lý do từ chối sẽ được gửi đến người tạo JD để họ có thể chỉnh sửa và gửi lại.";

    return (
        <Modal
            open={open}
            title={
                <Space>
                    {isResubmit
                        ? <RollbackOutlined style={{ color: "#fa8c16" }} />
                        : <StopOutlined style={{ color: "#ff4d4f" }} />
                    }
                    <span>{title}</span>
                </Space>
            }
            okText={confirmLabel}
            cancelText="Hủy"
            okButtonProps={{
                danger: !isResubmit,
                disabled: !reason.trim(),
                loading,
                style: isResubmit ? { background: "#fa8c16", borderColor: "#fa8c16" } : {},
            }}
            onOk={handleConfirm}
            onCancel={handleCancel}
            width={480}
            centered
            destroyOnClose
        >
            <Space direction="vertical" size="middle" style={{ width: "100%", padding: "8px 0" }}>
                {code && (
                    <Space>
                        <Text type="secondary">Mã JD:</Text>
                        <Text strong>{code}</Text>
                    </Space>
                )}

                <div>
                    <Text strong style={{ display: "block", marginBottom: 6 }}>
                        Lý do {isResubmit ? "trả lại" : "từ chối"}{" "}
                        <Text type="danger">*</Text>
                    </Text>

                    {/* Bọc trong div position: relative để đặt counter bên ngoài textarea */}
                    <div style={{ position: "relative" }}>
                        <Input.TextArea
                            rows={5}
                            placeholder={
                                isResubmit
                                    ? "Ví dụ: Cần xem xét lại, chưa đủ điều kiện trình duyệt tiếp..."
                                    : "Ví dụ: Mô tả chức danh chưa rõ ràng, cần bổ sung thêm yêu cầu kinh nghiệm..."
                            }
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            maxLength={maxLength}
                            showCount={false}
                            style={{ resize: "none", paddingBottom: 24 }}
                        />
                        {/* Counter nằm ngoài textarea, không đè nội dung */}
                        <Text
                            type={reason.length >= maxLength * 0.9 ? "danger" : "secondary"}
                            style={{
                                position: "absolute",
                                bottom: 6,
                                right: 10,
                                fontSize: 11,
                                pointerEvents: "none",
                                lineHeight: 1,
                            }}
                        >
                            {reason.length} / {maxLength}
                        </Text>
                    </div>
                </div>

                <Alert message={note} type="warning" showIcon />
            </Space>
        </Modal>
    );
};

export default ModalRejectJd;