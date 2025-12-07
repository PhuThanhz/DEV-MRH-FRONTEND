import React from 'react';
import { Button, Dropdown, Space, Avatar, message } from 'antd';
import { MenuFoldOutlined, MenuUnfoldOutlined } from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { callLogout } from '@/config/api';
import { setLogoutAction } from '@/redux/slice/accountSlide';

interface IProps {
    collapsed: boolean;
    setCollapsed: (val: boolean) => void;
}

const HeaderAdmin: React.FC<IProps> = ({ collapsed, setCollapsed }) => {
    const user = useAppSelector(state => state.account.user);
    const dispatch = useAppDispatch();
    const navigate = useNavigate();

    const handleLogout = async () => {
        const res = await callLogout();
        if (res && +res.statusCode === 200) {
            dispatch(setLogoutAction({}));
            message.success('Đăng xuất thành công');
            navigate('/');
        }
    };

    const itemsDropdown = [
        {
            label: <Link to={'/'}>Trang chủ</Link>,
            key: 'home',
        },
        {
            label: <label
                style={{ cursor: 'pointer' }}
                onClick={() => handleLogout()}
            >Đăng xuất</label>,
            key: 'logout',
        },
    ];

    return (
        <div
            className='admin-header'
            style={{
                display: "flex",
                justifyContent: "space-between",
                marginRight: 20,
                alignItems: "center",
            }}
        >
            <Button
                type="text"
                icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
                onClick={() => setCollapsed(!collapsed)}
                style={{
                    fontSize: '16px',
                    width: 64,
                    height: 64,
                }}
            />

            <Dropdown menu={{ items: itemsDropdown }} trigger={['click']}>
                <Space style={{ cursor: "pointer" }}>
                    Welcome {user?.name}
                    <Avatar>{user?.name?.substring(0, 2)?.toUpperCase()}</Avatar>
                </Space>
            </Dropdown>
        </div>
    );
};

export default HeaderAdmin;
