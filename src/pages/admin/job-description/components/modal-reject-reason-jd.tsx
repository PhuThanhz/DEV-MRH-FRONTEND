import { Modal, Tag, Typography, Space, Avatar } from "antd";
import { RollbackOutlined, StopOutlined } from "@ant-design/icons";
import dayjs from "dayjs";

const { Text } = Typography;

interface Props {
    open: boolean;
    record: {
        status?: string;
        rejectorName?: string;
        rejectorPosition?: string;
        rejectorDepartment?: string;
        rejectorPositionCode?: string;
        rejectComment?: string;
        updatedAt?: string;
    } | null;
    onClose: () => void;
}

const ModalRejectReasonJd = ({ open, record, onClose }: Props) => {
    if (!record) return null;

    const isReturned = record.status === "RETURNED";

    const initials = record.rejectorName
        ?.split(" ")
        .slice(-2)
        .map((w) => w[0])
        .join("")
        .toUpperCase() ?? "?";

    const titleText = isReturned ? "Lý do hoàn trả" : "Lý do từ chối";
    const timeText = isReturned ? "Hoàn trả lúc" : "Từ chối lúc";

    return (
        <Modal
            open={open}
            onCancel={onClose}
            footer={null}
            width={460}
            title={
                <Space>
                    {isReturned
                        ? <RollbackOutlined style={{ color: "#fa8c16" }} />
                        : <StopOutlined style={{ color: "#ff4d4f" }} />
                    }
                    <span>{titleText}</span>
                </Space>
            }
            destroyOnClose
        >
            <Space direction="vertical" size="middle" style={{ width: "100%", padding: "4px 0 8px" }}>
                {record.rejectorName && (
                    <Space align="center">
                        <Avatar
                            style={{
                                background: isReturned ? "#fff7e6" : "#fff2f0",
                                color: isReturned ? "#d46b08" : "#cf1322",
                                border: `1px solid ${isReturned ? "#ffd591" : "#ffccc7"}`,
                                fontWeight: 600,
                            }}
                        >
                            {initials}
                        </Avatar>
                        <div>
                            <Space size={6} wrap>
                                <Text strong>{record.rejectorName}</Text>
                                {record.rejectorPosition && (
                                    <Tag color="purple">{record.rejectorPosition}</Tag>
                                )}
                                {record.rejectorPositionCode && (
                                    <Tag color="blue">{record.rejectorPositionCode}</Tag>
                                )}
                            </Space>
                            {record.rejectorDepartment && (
                                <div>
                                    <Text type="secondary" style={{ fontSize: 12 }}>
                                        {record.rejectorDepartment}
                                    </Text>
                                </div>
                            )}
                        </div>
                    </Space>
                )}

                <div>
                    <Text
                        type="secondary"
                        style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: 6 }}
                    >
                        {isReturned ? "Nội dung hoàn trả" : "Nội dung từ chối"}
                    </Text>
                    <div
                        style={{
                            background: isReturned ? "#fff7e6" : "#fff2f0",
                            border: `1px solid ${isReturned ? "#ffd591" : "#ffccc7"}`,
                            borderRadius: 8,
                            padding: "12px 14px",
                            fontSize: 13,
                            lineHeight: 1.8,
                            whiteSpace: "pre-wrap",
                            color: isReturned ? "#78350f" : "#791F1F",
                        }}
                    >
                        {record.rejectComment ?? "—"}
                    </div>
                </div>

                {record.updatedAt && (
                    <Text type="secondary" style={{ fontSize: 12 }}>
                        {timeText}: {dayjs(record.updatedAt).format("HH:mm · DD/MM/YYYY")}
                    </Text>
                )}
            </Space>
        </Modal>
    );
};

export default ModalRejectReasonJd;