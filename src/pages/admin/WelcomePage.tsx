import { Typography, Button, Space } from "antd";
import { useNavigate } from "react-router-dom";

const { Title, Text } = Typography;

const WelcomePage = () => {
    const navigate = useNavigate();

    return (
        <div style={{
            height: "100%",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            textAlign: "center",
            padding: 24
        }}>
            <Title level={3}>Chào mừng bạn</Title>

            <Text type="secondary" style={{ marginBottom: 20 }}>
                Bạn không có quyền truy cập Dashboard. Hãy chọn chức năng bên dưới.
            </Text>

            <Space>
                <Button type="primary" onClick={() => navigate("/admin/employees")}>
                    Nhân viên
                </Button>

                <Button onClick={() => navigate("/admin/companies")}>
                    Công ty
                </Button>
            </Space>
        </div>
    );
};

export default WelcomePage;