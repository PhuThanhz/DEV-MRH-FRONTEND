import { Modal, Typography, Space, Tag } from "antd";
import { CheckCircleOutlined } from "@ant-design/icons";
import type { IJdInbox } from "@/types/backend";

const { Text } = Typography;

interface Props {
    open: boolean;
    record: IJdInbox | null;
    loading?: boolean;
    onConfirm: () => void;
    onCancel: () => void;
}

const ModalIssueJd = ({ open, record, loading, onConfirm, onCancel }: Props) => {
    const code = (record as any)?.code ?? "";

    return (
        <Modal
            open={open}
            title={
                <Space>
                    <CheckCircleOutlined style={{ color: "#1677ff" }} />
                    <span>Xác nhận ban hành JD</span>
                </Space>
            }
            okText="Xác nhận ban hành"
            cancelText="Hủy"
            okButtonProps={{ loading, type: "primary" }}
            onOk={onConfirm}
            onCancel={onCancel}
            width={460}
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

                <Text>
                    Sau khi ban hành, tài liệu sẽ chuyển sang trạng thái{" "}
                    <Tag icon={<CheckCircleOutlined />} color="success">
                        Đã ban hành
                    </Tag>{" "}
                    và sẽ <Text strong>không thể chỉnh sửa</Text> thêm.
                </Text>
            </Space>
        </Modal>
    );
};

export default ModalIssueJd;