import { Button, Result } from "antd";
import { useNavigate } from "react-router-dom";

interface NotPermittedProps {
    message?: string;
}


const NotPermitted: React.FC<NotPermittedProps> = ({ message }) => {
    const navigate = useNavigate();

    return (
        <Result
            status="404" // intentionally 404 for security — không tiết lộ quyền
            title="Trang không khả dụng"
            subTitle={
                message ||
                "Rất tiếc, nội dung bạn đang tìm không khả dụng hoặc đã bị hạn chế truy cập."
            }
            extra={
                <Button type="primary" onClick={() => navigate("/", { replace: true })}>
                    Quay lại trang chính
                </Button>
            }
        />
    );
};

export default NotPermitted;
