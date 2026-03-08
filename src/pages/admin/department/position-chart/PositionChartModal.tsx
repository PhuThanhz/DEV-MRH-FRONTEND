// src/pages/admin/department/position-chart/PositionChartModal.tsx
import { Modal, Table, Typography } from "antd";
import { mockHRJobTitles } from "./mock-data";

const { Title } = Typography;

interface PositionChartModalProps {
    open: boolean;
    onClose: () => void;
    departmentName?: string;
}

const PositionChartModal: React.FC<PositionChartModalProps> = ({
    open,
    onClose,
    departmentName = "Hành chính - Nhân sự",
}) => {
    const columns = [
        {
            title: "STT",
            dataIndex: "stt",
            key: "stt",
            width: 80,
            align: "center" as const,
        },
        {
            title: "Bậc chức danh",
            dataIndex: "rank",
            key: "rank",
            width: 160,
            align: "center" as const,
        },
        {
            title: "Chức danh Tiếng Việt",
            dataIndex: "vietnameseTitle",
            key: "vietnameseTitle",
            ellipsis: true,
        },
        {
            title: "Chức danh Tiếng Anh",
            dataIndex: "englishTitle",
            key: "englishTitle",
            ellipsis: true,
        },
    ];

    return (
        <Modal
            title={null}
            open={open}
            onCancel={onClose}
            footer={null}
            width={1200} // Tăng width để bảng dài hơn, thoải mái
            centered
            bodyStyle={{
                maxHeight: "88vh",
                overflow: "auto",
                padding: "40px 48px", // Padding lớn hơn cho thoáng
                background: "#ffffff", // Nền trắng sạch sẽ ở ngoài bảng
                borderRadius: "12px",
            }}
            style={{ top: 20 }}
        >
            {/* Header tùy chỉnh */}
            <div style={{ textAlign: "center", marginBottom: 32 }}>
                <Title
                    level={4}
                    style={{
                        margin: 0,
                        color: "#db2777", // Pink-600
                        fontWeight: 800,
                        letterSpacing: "1px",
                    }}
                >
                    CÔNG TY CỔ PHẦN V LOTUS HOLDINGS
                </Title>
                <Title
                    level={5}
                    style={{
                        margin: "12px 0 24px 0",
                        color: "#831843", // Rose-800
                        fontWeight: 700,
                    }}
                >
                    BẢN ĐỒ CHỨC DANH PHÒNG HÀNH CHÍNH NHÂN SỰ
                </Title>
            </div>

            <Table
                dataSource={mockHRJobTitles}
                columns={columns}
                rowKey="id"
                pagination={false}
                size="middle"
                bordered
                scroll={{ x: "max-content" }}
                locale={{ emptyText: "Không có dữ liệu chức danh" }}
                rowClassName={() => "hover:bg-pink-50 transition-colors cursor-pointer duration-200"}
                components={{
                    header: {
                        cell: (props: any) => (
                            <th
                                {...props}
                                style={{
                                    background: "#ec4899", // Pink-500 header nổi bật
                                    color: "#ffffff",
                                    fontWeight: 700,
                                    textAlign: "center",
                                    borderBottom: "3px solid #db2777",
                                    padding: "16px 12px",
                                    fontSize: "15px",
                                }}
                            >
                                {props.children}
                            </th>
                        ),
                    },
                    body: {
                        cell: (props: any) => (
                            <td
                                {...props}
                                style={{
                                    padding: "16px 12px",
                                    verticalAlign: "middle",
                                    borderColor: "#fbcfe8", // Viền hồng nhạt
                                    fontSize: "14px",
                                    background: "#ffffff", // Cell nền trắng
                                }}
                            >
                                {props.children}
                            </td>
                        ),
                    },
                }}
            />
        </Modal>
    );
};

export default PositionChartModal;