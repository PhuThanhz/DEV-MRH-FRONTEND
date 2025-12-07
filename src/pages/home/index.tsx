import { Card, Typography } from "antd";

const { Title, Paragraph } = Typography;

const HomePage = () => {
    return (
        <div style={{ padding: 24 }}>
            <Card bordered={false}>
                <Title level={3}>Chào mừng đến trang quản trị</Title>
                <Paragraph>
                    Đây là trang chính của hệ thống. Bạn có thể xem thống kê, quản lý người dùng,
                    nhóm nguồn hoặc thực hiện các thao tác khác tại đây.
                </Paragraph>
            </Card>
        </div>
    );
};

export default HomePage;
