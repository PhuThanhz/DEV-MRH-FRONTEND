import React, { useEffect, useState } from 'react';
import { Layout, Menu } from 'antd';
import { AppstoreOutlined, UserOutlined, ApiOutlined, ExceptionOutlined, BugOutlined } from '@ant-design/icons';
import { Link } from 'react-router-dom';
import { useAppSelector } from '@/redux/hooks';
import { ALL_PERMISSIONS } from '@/config/permissions';

const { Sider } = Layout;

interface IProps {
    collapsed: boolean;
    setCollapsed: (val: boolean) => void;
    activeMenu: string;
    setActiveMenu: (val: string) => void;
}

const SliderAdmin: React.FC<IProps> = ({ collapsed, setCollapsed, activeMenu, setActiveMenu }) => {
    const permissions = useAppSelector(state => state.account.user.role.permissions);
    const [menuItems, setMenuItems] = useState<any[]>([]);

    useEffect(() => {
        const ACL_ENABLE = import.meta.env.VITE_ACL_ENABLE;
        if (permissions?.length || ACL_ENABLE === 'false') {
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

            const full = [
                {
                    label: <Link to='/admin'>Dashboard</Link>,
                    key: '/admin',
                    icon: <AppstoreOutlined />
                },
                ...(viewUser || ACL_ENABLE === 'false' ? [{
                    label: <Link to='/admin/user'>User</Link>,
                    key: '/admin/user',
                    icon: <UserOutlined />
                }] : []),
                ...(viewPermission || ACL_ENABLE === 'false' ? [{
                    label: <Link to='/admin/permission'>Permission</Link>,
                    key: '/admin/permission',
                    icon: <ApiOutlined />
                }] : []),
                ...(viewRole || ACL_ENABLE === 'false' ? [{
                    label: <Link to='/admin/role'>Role</Link>,
                    key: '/admin/role',
                    icon: <ExceptionOutlined />
                }] : [])
            ];

            setMenuItems(full);
        }
    }, [permissions]);

    return (
        <Sider theme='light' collapsible collapsed={collapsed} onCollapse={setCollapsed}>
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
    );
};

export default SliderAdmin;
