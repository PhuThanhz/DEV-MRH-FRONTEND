import { Modal, Descriptions, Badge, Typography, Card, Space, Tag, Row, Col, Divider } from "antd";
import dayjs from "dayjs";

const { Title, Text } = Typography;

interface ViewJobDescriptionProps {
    open: boolean;
    onClose: () => void;
    dataInit: any; // bạn có thể định nghĩa interface chi tiết hơn nếu muốn type-safe
}

const ViewJobDescription = ({ open, onClose, dataInit }: ViewJobDescriptionProps) => {
    if (!dataInit || !open) return null;

    const badgeStatus =
        dataInit.status === "PUBLIC"
            ? "success"
            : dataInit.status === "IN_REVIEW"
                ? "processing"
                : "default";

    const statusText =
        dataInit.status === "PUBLIC"
            ? "Đã ban hành"
            : dataInit.status === "IN_REVIEW"
                ? "Đang xét duyệt"
                : "Nháp";

    const handleClose = () => {
        onClose();
    };

    return (
        <Modal
            open={open}
            onCancel={handleClose}
            footer={null}
            width={1200}
            style={{ top: 20 }}
            styles={{ body: { padding: "32px" } }}
            destroyOnClose
        >
            {/* HEADER */}
            <div style={{ marginBottom: 32 }}>
                <Space direction="vertical" size={8} style={{ width: "100%" }}>
                    <Tag
                        color={
                            badgeStatus === "success" ? "green" : badgeStatus === "processing" ? "blue" : "default"
                        }
                        style={{ fontSize: 14, padding: "4px 12px" }}
                    >
                        {statusText}
                    </Tag>
                    <Title level={3} style={{ margin: 0, lineHeight: 1.2 }}>
                        {dataInit.title || "Chưa có tiêu đề"}
                    </Title>
                    <Text type="secondary">Bảng mô tả công việc</Text>
                </Space>
            </div>

            <Divider style={{ margin: "24px 0" }} />

            {/* I. THÔNG TIN CHUNG */}
            <div style={{ marginBottom: 40 }}>
                <Title level={4} style={{ marginBottom: 20 }}>
                    I. Thông tin chung
                </Title>
                <Descriptions bordered column={2} size="middle" labelStyle={{ width: "180px" }}>
                    <Descriptions.Item label="Chức vụ">{dataInit.title || "--"}</Descriptions.Item>
                    <Descriptions.Item label="Bậc chức danh">{dataInit.levelCode || "--"}</Descriptions.Item>

                    <Descriptions.Item label="Phòng ban/Bộ phận">{dataInit.department || "--"}</Descriptions.Item>
                    <Descriptions.Item label="Trực thuộc">{dataInit.source || "--"}</Descriptions.Item>

                    <Descriptions.Item label="Cấp quản lý trực tiếp">{dataInit.reportTo || "--"}</Descriptions.Item>
                    <Descriptions.Item label="Lần ban hành">{dataInit.version || "1"}</Descriptions.Item>

                    <Descriptions.Item label="Ngày hiệu lực">
                        {dataInit.effectiveDate ? dayjs(dataInit.effectiveDate).format("DD/MM/YYYY") : "--"}
                    </Descriptions.Item>
                    <Descriptions.Item label="Tình trạng">
                        <Badge status={badgeStatus} text={statusText} />
                    </Descriptions.Item>

                    <Descriptions.Item label="Ngày tạo">
                        {dataInit.createdAt ? dayjs(dataInit.createdAt).format("DD/MM/YYYY HH:mm") : "--"}
                    </Descriptions.Item>
                    <Descriptions.Item label="Người tạo">{dataInit.createdBy || "--"}</Descriptions.Item>

                    <Descriptions.Item label="Ngày ban hành" span={2}>
                        {dataInit.status === "PUBLIC" && dataInit.issuedDate
                            ? dayjs(dataInit.issuedDate).format("DD/MM/YYYY")
                            : <Text type="secondary">Chưa ban hành</Text>}
                    </Descriptions.Item>
                </Descriptions>
            </div>

            {/* II. MÔ TẢ CÔNG VIỆC */}
            <div style={{ marginBottom: 40 }}>
                <Title level={4} style={{ marginBottom: 20 }}>
                    II. Mô tả công việc
                </Title>
                <Card>
                    <Space direction="vertical" size={12} style={{ width: "100%" }}>
                        {dataInit.content?.desc?.length > 0 ? (
                            dataInit.content.desc.map((line: string, idx: number) => (
                                <Text key={idx}>
                                    <span style={{ marginRight: 12, color: "#1890ff" }}>•</span>
                                    {line}
                                </Text>
                            ))
                        ) : (
                            <Text type="secondary">Chưa có mô tả công việc</Text>
                        )}
                    </Space>
                </Card>
            </div>

            {/* III. YÊU CẦU ĐỐI VỚI VỊ TRÍ */}
            <div style={{ marginBottom: 40 }}>
                <Title level={4} style={{ marginBottom: 20 }}>
                    III. Yêu cầu đối với vị trí
                </Title>

                <Space direction="vertical" size={20} style={{ width: "100%" }}>
                    {[
                        { title: "1. Kiến thức", data: dataInit.content?.knowledge },
                        { title: "2. Kinh nghiệm", data: dataInit.content?.experience },
                        { title: "3. Kỹ năng", data: dataInit.content?.skills },
                        { title: "4. Phẩm chất", data: dataInit.content?.qualities },
                        { title: "5. Yêu cầu khác", data: dataInit.content?.others },
                    ].map((section, index) => (
                        <Card key={index} title={section.title} size="small">
                            <Space direction="vertical" size={10} style={{ width: "100%" }}>
                                {section.data?.length > 0 ? (
                                    section.data.map((line: string, idx: number) => (
                                        <Text key={idx}>
                                            <span style={{ marginRight: 12, color: "#52c41a" }}>•</span>
                                            {line}
                                        </Text>
                                    ))
                                ) : (
                                    <Text type="secondary">Không có yêu cầu</Text>
                                )}
                            </Space>
                        </Card>
                    ))}
                </Space>
            </div>

            {/* IV. CHỮ KÝ */}
            <div>
                <Title level={4} style={{ marginBottom: 20 }}>
                    IV. Người giao việc / Người nhận việc
                </Title>
                <Row gutter={24}>
                    <Col span={12}>
                        <Card title="Người giao việc" size="small">
                            <Space direction="vertical" size={8}>
                                <Text strong style={{ fontSize: 16 }}>
                                    {dataInit.assigner?.title || "--"}
                                </Text>
                                <Text>{dataInit.assigner?.name || "--"}</Text>
                            </Space>
                        </Card>
                    </Col>
                    <Col span={12}>
                        <Card title="Người nhận việc" size="small">
                            <Space direction="vertical" size={8}>
                                <Text strong style={{ fontSize: 16 }}>
                                    {dataInit.receiver?.title || "--"}
                                </Text>
                                <Text>{dataInit.receiver?.name || "--"}</Text>
                            </Space>
                        </Card>
                    </Col>
                </Row>
            </div>
        </Modal>
    );
};

export default ViewJobDescription;