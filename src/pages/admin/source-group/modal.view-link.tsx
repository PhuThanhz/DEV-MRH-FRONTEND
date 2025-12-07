import { Modal, Descriptions, Tag, Typography } from "antd";
import type { ISourceLink } from "@/types/backend";

const { Paragraph, Text } = Typography;

interface IProps {
    open: boolean;
    setOpen: (v: boolean) => void;
    link: ISourceLink | null;
}

const ModalViewLink = ({ open, setOpen, link }: IProps) => {
    const backendUrl = import.meta.env.VITE_BACKEND_URL;

    const getFileSrc = () => {
        if (!link?.contentGenerated) return null;
        return `${backendUrl}/storage/threads_video/${link.contentGenerated}`;
    };

    return (
        <Modal
            open={open}
            onCancel={() => setOpen(false)}
            onOk={() => setOpen(false)}
            title="Chi tiết Link"
            centered
            width={700}
            footer={null}
        >
            {link ? (
                <Descriptions bordered column={1} size="middle">
                    <Descriptions.Item label="ID">{link.id}</Descriptions.Item>

                    <Descriptions.Item label="URL">
                        <a href={link.url} target="_blank" rel="noopener noreferrer">
                            {link.url}
                        </a>
                    </Descriptions.Item>

                    <Descriptions.Item label="Người đăng">
                        {link.name || "-"}
                    </Descriptions.Item>

                    <Descriptions.Item label="User ID">
                        {link.userId || "-"}
                    </Descriptions.Item>

                    <Descriptions.Item label="Trạng thái">
                        <Tag
                            color={
                                link.status === "SUCCESS"
                                    ? "green"
                                    : link.status === "FAILED"
                                        ? "red"
                                        : "default"
                            }
                        >
                            {link.status || "UNKNOWN"}
                        </Tag>
                    </Descriptions.Item>

                    <Descriptions.Item label="Mô tả (Caption)">
                        <Paragraph>{link.caption || "-"}</Paragraph>
                    </Descriptions.Item>

                    <Descriptions.Item label="File / Nội dung">
                        {link.contentGenerated ? (
                            link.contentGenerated.endsWith(".mp4") ? (
                                <video
                                    width="100%"
                                    height={300}
                                    controls
                                    src={getFileSrc() || ""}
                                >
                                    Trình duyệt không hỗ trợ video
                                </video>
                            ) : (
                                <Text>{getFileSrc()}</Text>
                            )
                        ) : (
                            "-"
                        )}
                    </Descriptions.Item>

                    <Descriptions.Item label="Ngày tạo">
                        {link.createdAt
                            ? new Date(link.createdAt).toLocaleString()
                            : "-"}
                    </Descriptions.Item>

                    <Descriptions.Item label="Cập nhật lúc">
                        {link.updatedAt
                            ? new Date(link.updatedAt).toLocaleString()
                            : "-"}
                    </Descriptions.Item>
                </Descriptions>
            ) : (
                <p>Không có dữ liệu link</p>
            )}
        </Modal>
    );
};

export default ModalViewLink;
