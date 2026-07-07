import { useNavigate } from "react-router-dom";
import { Button } from 'antd';
import { HomeOutlined } from '@ant-design/icons';

const NotFound = () => {
    const navigate = useNavigate();

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            background: '#ffffff',
            fontFamily: "'Inter', sans-serif",
            position: 'relative',
            overflow: 'hidden',
            padding: '24px'
        }}>
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 'clamp(32px, 8vw, 80px)',
                flexWrap: 'wrap',
                maxWidth: '1000px',
                width: '100%'
            }}>
                {/* Mascot Image */}
                <img
                    src="/logo/lotuserror.webp"
                    alt="Lỗi 404"
                    style={{
                        width: 'clamp(240px, 30vw, 360px)',
                        display: 'block'
                    }}
                />

                {/* Typography & Actions */}
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    textAlign: 'left'
                }}>
                    <div style={{
                        fontSize: 'clamp(80px, 10vw, 140px)',
                        fontWeight: 900,
                        color: '#e8637a',
                        lineHeight: 1,
                        letterSpacing: '-2px',
                        marginBottom: '8px'
                    }}>
                        404
                    </div>

                    <h2 style={{
                        fontSize: 'clamp(24px, 3vw, 36px)',
                        fontWeight: 800,
                        color: '#0f172a',
                        margin: '0 0 16px 0',
                        letterSpacing: '-0.5px'
                    }}>
                        Không tìm thấy trang
                    </h2>

                    <p style={{
                        fontSize: '16px',
                        color: '#64748b',
                        margin: '0 0 32px 0',
                        maxWidth: '380px',
                        lineHeight: 1.6
                    }}>
                        Đường dẫn bạn truy cập không tồn tại, đã bị gỡ bỏ hoặc bạn không có quyền truy cập.
                    </p>

                    <Button
                        type="primary"
                        size="large"
                        icon={<HomeOutlined />}
                        onClick={() => navigate('/')}
                        style={{
                            background: '#e8637a',
                            border: 'none',
                            borderRadius: '8px',
                            padding: '0 32px',
                            height: '48px',
                            fontSize: '15px',
                            fontWeight: 600,
                            boxShadow: '0 4px 12px rgba(232,99,122,0.2)',
                            transition: 'all 0.3s ease'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.transform = "translateY(-2px)";
                            e.currentTarget.style.boxShadow = "0 8px 16px rgba(232,99,122,0.3)";
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.transform = "translateY(0)";
                            e.currentTarget.style.boxShadow = "0 4px 12px rgba(232,99,122,0.2)";
                        }}
                    >
                        Về Trang Chủ
                    </Button>
                </div>
            </div>
        </div>
    )
}

export default NotFound;