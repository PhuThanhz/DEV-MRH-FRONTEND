import { Modal, Tag, Typography, Space, Avatar } from "antd";
import { StopOutlined } from "@ant-design/icons";
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

    const initials = record.rejectorName
        ?.split(" ")
        .slice(-2)
        .map((w) => w[0])
        .join("")
        .toUpperCase() ?? "?";

    // ✅ Bỏ prefix [TRẢ VỀ] nếu có, chỉ lấy nội dung thực
    const displayComment = record.rejectComment?.startsWith("[TRẢ VỀ]")
        ? record.rejectComment.replace("[TRẢ VỀ] ", "")
        : (record.rejectComment ?? "—");

    return (
        <Modal
            open={open}
            onCancel={onClose}
            footer={null}
            width={460}
            title={
                <Space>
                    <StopOutlined style={{ color: "#ff4d4f" }} />
                    <span>Lý do từ chối</span>
                </Space>
            }
            destroyOnClose
        >
            <Space direction="vertical" size="middle" style={{ width: "100%", padding: "4px 0 8px" }}>

                {record.rejectorName && (
                    <Space align="center">
                        <Avatar style={{
                            background: "#fff2f0",
                            color: "#cf1322",
                            border: "1px solid #ffccc7",
                            fontWeight: 600,
                        }}>
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
                    <Text type="secondary" style={{
                        fontSize: 11,
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                        display: "block",
                        marginBottom: 6,
                    }}>
                        Nội dung từ chối
                    </Text>
                    <div style={{
                        background: "#fff2f0",
                        border: "1px solid #ffccc7",
                        borderRadius: 8,
                        padding: "12px 14px",
                        fontSize: 13,
                        lineHeight: 1.8,
                        whiteSpace: "pre-wrap",
                        color: "#791F1F",
                    }}>
                        {displayComment}
                    </div>
                </div>

                {record.updatedAt && (
                    <Text type="secondary" style={{ fontSize: 12 }}>
                        Từ chối lúc: {dayjs(record.updatedAt).format("HH:mm · DD/MM/YYYY")}
                    </Text>
                )}
            </Space>
        </Modal>
    );
};

export default ModalRejectReasonJd;