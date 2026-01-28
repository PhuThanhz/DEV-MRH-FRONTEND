import React, { useState, useEffect } from 'react';
import {
    AppstoreOutlined,
    ExceptionOutlined,
    ApiOutlined,
    UserOutlined,
    MenuFoldOutlined,
    MenuUnfoldOutlined,
    BugOutlined,
} from '@ant-design/icons';
import { Layout, Menu, Dropdown, Space, message, Avatar, Button } from 'antd';
import { Outlet, useLocation, useNavigate, Link } from "react-router-dom";
import { callLogout } from 'config/api';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { isMobile } from 'react-device-detect';
import type { MenuProps } from 'antd';
import { setLogoutAction } from '@/redux/slice/accountSlide';
import { ALL_PERMISSIONS } from '@/config/permissions';

const { Content, Sider } = Layout;

const LayoutAdmin = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const dispatch = useAppDispatch();

    const [collapsed, setCollapsed] = useState(false);
    const [activeMenu, setActiveMenu] = useState('');

    const user = useAppSelector(state => state.account.user);
    const permissions = useAppSelector(
        state => state.account.user?.role?.permissions
    );

    const [menuItems, setMenuItems] = useState<MenuProps['items']>([]);

    const isAclDisabled = import.meta.env.VITE_ACL_ENABLE === 'false';

    useEffect(() => {
        if (permissions?.length || isAclDisabled) {

            const viewUser = permissions?.find(item =>
                item.apiPath === ALL_PERMISSIONS.USERS.GET_PAGINATE.apiPath &&
                item.method === ALL_PERMISSIONS.USERS.GET_PAGINATE.method
            );

            const viewRole = permissions?.find(item =>
                item.apiPath === ALL_PERMISSIONS.ROLES.GET_PAGINATE.apiPath &&
                item.method === ALL_PERMISSIONS.ROLES.GET_PAGINATE.method
            );

            const viewPermission = permissions?.find(item =>
                item.apiPath === ALL_PERMISSIONS.PERMISSIONS.GET_PAGINATE.apiPath &&
                item.method === ALL_PERMISSIONS.PERMISSIONS.GET_PAGINATE.method
            );

            const items: MenuProps['items'] = [
                {
                    label: <Link to="/admin">Dashboard</Link>,
                    key: '/admin',
                    icon: <AppstoreOutlined />,
                },

                ...(viewUser || isAclDisabled ? [{
                    label: <Link to="/admin/user">User</Link>,
                    key: '/admin/user',
                    icon: <UserOutlined />,
                }] : []),

                ...(viewPermission || isAclDisabled ? [{
                    label: <Link to="/admin/permission">Permission</Link>,
                    key: '/admin/permission',
                    icon: <ApiOutlined />,
                }] : []),

                ...(viewRole || isAclDisabled ? [{
                    label: <Link to="/admin/role">Role</Link>,
                    key: '/admin/role',
                    icon: <ExceptionOutlined />,
                }] : []),
            ];

            setMenuItems(items);
        }
    }, [permissions, isAclDisabled]);

    useEffect(() => {
        if (location.pathname.startsWith('/admin/user')) {
            setActiveMenu('/admin/user');
        } else if (location.pathname.startsWith('/admin/role')) {
            setActiveMenu('/admin/role');
        } else if (location.pathname.startsWith('/admin/permission')) {
            setActiveMenu('/admin/permission');
        } else {
            setActiveMenu(location.pathname);
        }
    }, [location]);

    const handleLogout = async () => {
        const res = await callLogout();
        if (res && +res.statusCode === 200) {
            dispatch(setLogoutAction());
            message.success('Đăng xuất thành công');
            navigate('/');
        }
    };

    const itemsDropdown: MenuProps['items'] = [
        {
            label: <Link to="/">Trang chủ</Link>,
            key: 'home',
        },
        {
            label: (
                <span style={{ cursor: 'pointer' }} onClick={handleLogout}>
                    Đăng xuất
                </span>
            ),
            key: 'logout',
        },
    ];

    return (
        <Layout style={{ minHeight: '100vh' }} className="layout-admin">
            {!isMobile ? (
                <Sider
                    theme="light"
                    collapsible
                    collapsed={collapsed}
                    onCollapse={setCollapsed}
                >
                    <div style={{ height: 32, margin: 16, textAlign: 'center' }}>
                        <BugOutlined /> ADMIN
                    </div>
                    <Menu
                        selectedKeys={[activeMenu]}
                        mode="inline"
                        items={menuItems}
                        onClick={(e) => setActiveMenu(e.key)}
                    />
                </Sider>
            ) : (
                <Menu
                    selectedKeys={[activeMenu]}
                    items={menuItems}
                    onClick={(e) => setActiveMenu(e.key)}
                    mode="horizontal"
                />
            )}

            <Layout>
                {!isMobile && (
                    <div
                        className="admin-header"
                        style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            marginRight: 20,
                        }}
                    >
                        <Button
                            type="text"
                            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
                            onClick={() => setCollapsed(!collapsed)}
                            style={{ fontSize: 16, width: 64, height: 64 }}
                        />

                        <Dropdown menu={{ items: itemsDropdown }} trigger={['click']}>
                            <Space style={{ cursor: 'pointer' }}>
                                Welcome {user?.name}
                                <Avatar>
                                    {user?.name?.substring(0, 2)?.toUpperCase()}
                                </Avatar>
                            </Space>
                        </Dropdown>
                    </div>
                )}

                <Content style={{ padding: 15 }}>
                    <Outlet />
                </Content>
            </Layout>
        </Layout>
    );
};

export default LayoutAdmin;
