import { useState } from 'react';
import {
    EditOutlined,
    ToolOutlined,
    SyncOutlined,
    BellOutlined,
    SettingOutlined,
    LogoutOutlined,
    CheckCircleOutlined,
    FileTextOutlined,
    HomeOutlined
} from '@ant-design/icons';
import { Card, Row, Col, Avatar, Space, Modal } from 'antd';
import styles from 'styles/client.module.scss';
import { useNavigate } from 'react-router-dom';
import { useAppSelector } from '@/redux/hooks';

interface MenuCard {
    id: string;
    title: string;
    icon: React.ReactNode;
    color: string;
    path: string;
    description?: string;
}

const HomePage = () => {
    const navigate = useNavigate();
    const user = useAppSelector(state => state.account.user);
    const [selectedCard, setSelectedCard] = useState<string | null>(null);

    const menuCards: MenuCard[] = [
        {
            id: 'collection',
            title: 'Xác Nhận Phân Công',
            icon: <EditOutlined />,
            color: '#FDB44B',
            path: '/collection',
            description: 'Nhập và thu thập dữ liệu khảo sát'
        },
        {
            id: 'propose',
            title: 'Cập Nhật Khảo Sát',
            icon: <ToolOutlined />,
            color: '#E74C3C',
            path: '/propose',
            description: 'Tạo đề xuất công việc sửa chữa'
        },
        {
            id: 'synchronized',
            title: 'Tạo Kế Hoặch Bảo Trì',
            icon: <SyncOutlined />,
            color: '#16A085',
            path: '/synchronized',
            description: 'Đồng bộ dữ liệu với server'
        },
        {
            id: 'config',
            title: 'Cập Nhật Sữa Chữa',
            icon: <SettingOutlined />,
            color: '#C0392B',
            path: '/config',
            description: 'Cài đặt hệ thống'
        },
        {
            id: 'notification',
            title: 'Thông Báo',
            icon: <BellOutlined />,
            color: '#95C623',
            path: '/notification',
            description: 'Xem thông báo và cập nhật'
        },
        {
            id: 'signout',
            title: 'Đăng Xuất',
            icon: <LogoutOutlined />,
            color: '#3498DB',
            path: '/logout',
            description: 'Thoát khỏi hệ thống'
        },
    ];

    const quickAccessCards: MenuCard[] = [
        {
            id: 'confirm-job',
            title: 'Xác Nhận Phân Công',
            icon: <CheckCircleOutlined />,
            color: '#9B59B6',
            path: '/job',
            description: 'Xác nhận công việc được phân'
        },
        {
            id: 'survey',
            title: 'Cập Nhật Khảo Sát',
            icon: <FileTextOutlined />,
            color: '#E67E22',
            path: '/survey',
            description: 'Cập nhật kết quả khảo sát'
        },
        {
            id: 'maintenance',
            title: 'Kế Hoạch Bảo Trì',
            icon: <ToolOutlined />,
            color: '#1ABC9C',
            path: '/maintenance',
            description: 'Lập kế hoạch bảo trì định kỳ'
        },
        {
            id: 'repair',
            title: 'Cập Nhật Sửa Chữa',
            icon: <EditOutlined />,
            color: '#34495E',
            path: '/repair',
            description: 'Cập nhật tiến độ sửa chữa'
        },
    ];

    const handleCardClick = (card: MenuCard) => {
        if (card.id === 'signout') {
            Modal.confirm({
                title: 'Xác nhận đăng xuất',
                content: 'Bạn có chắc chắn muốn đăng xuất khỏi hệ thống?',
                okText: 'Đăng xuất',
                cancelText: 'Hủy',
                onOk: () => {
                    // Handle logout logic here
                    navigate('/login');
                }
            });
        } else {
            setSelectedCard(card.id);
            setTimeout(() => {
                navigate(card.path);
            }, 300);
        }
    };

    return (
        <div className={`${styles["container"]} ${styles["home-section"]}`}>
            {/* Main Menu Cards */}
            <div className={styles["menu-section"]}>
                <h3 className={styles["section-title"]}>Chức Năng Chính</h3>
                <Row gutter={[16, 16]}>
                    {menuCards.map((card) => (
                        <Col xs={12} sm={12} md={8} lg={6} key={card.id}>
                            <Card
                                className={`${styles["menu-card"]} ${selectedCard === card.id ? styles["card-active"] : ""
                                    }`}
                                style={{
                                    backgroundColor: card.color,
                                    borderColor: card.color
                                }}
                                hoverable
                                onClick={() => handleCardClick(card)}
                            >
                                <div className={styles["card-content"]}>
                                    <div className={styles["card-icon"]}>
                                        {card.icon}
                                    </div>
                                    <div className={styles["card-title"]}>
                                        {card.title}
                                    </div>
                                </div>
                            </Card>
                        </Col>
                    ))}
                </Row>
            </div>
        </div>
    );
};

export default HomePage;