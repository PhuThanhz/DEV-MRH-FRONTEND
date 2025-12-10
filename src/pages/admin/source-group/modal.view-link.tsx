import { Modal, Descriptions, Tag, Typography, Image } from "antd";
import type { ISourceLink } from "@/types/backend";

const { Paragraph, Text } = Typography;

interface IProps {
    open: boolean;
    setOpen: (v: boolean) => void;
    link: ISourceLink | null;
}

const ModalViewLink = ({ open, setOpen, link }: IProps) => {
    const backendUrl = import.meta.env.VITE_BACKEND_URL;

    // ✅ Lấy đường dẫn file từ backend
    const getFileSrc = () => {
        if (!link?.contentGenerated) return null;
        return `${backendUrl}/storage/threads_video/${link.contentGenerated}`;
    };

    // ✅ Xác định loại file (video / image / other)
    const getFileType = (fileName?: string) => {
        if (!fileName) return "unknown";
        const lower = fileName.toLowerCase();
        if (lower.endsWith(".mp4")) return "video";
        if (
            lower.endsWith(".jpg") ||
            lower.endsWith(".jpeg") ||
            lower.endsWith(".png") ||
            lower.endsWith(".gif") ||
            lower.endsWith(".webp")
        )
            return "image";
        return "other";
    };

    const fileType = getFileType(link?.contentGenerated ?? undefined);

    return (
        <Modal
            open={open}
            onCancel={() => setOpen(false)}
            onOk={() => setOpen(false)}
            title="Chi tiết Link"
            centered
            width={750}
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
                            <>
                                {fileType === "video" && (
                                    <video
                                        width="100%"
                                        height={300}
                                        controls
                                        src={getFileSrc() || ""}
                                        style={{ borderRadius: 8 }}
                                    >
                                        Trình duyệt không hỗ trợ video
                                    </video>
                                )}

                                {fileType === "image" && (
                                    <Image
                                        width="100%"
                                        src={getFileSrc() || ""}
                                        alt="Ảnh Threads"
                                        style={{ borderRadius: 8, maxHeight: 400, objectFit: "contain" }}
                                    />
                                )}

                                {fileType === "other" && (
                                    <Text copyable>{getFileSrc()}</Text>
                                )}
                            </>
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
