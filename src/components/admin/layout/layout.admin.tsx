import React, { useEffect, useState } from 'react';
import { Layout } from 'antd';
import { Outlet, useLocation } from 'react-router-dom';
import { isMobile } from 'react-device-detect';
import SliderAdmin from './slider.admin';
import HeaderAdmin from './header.admin';

const { Content } = Layout;

const LayoutAdmin = () => {
    const location = useLocation();
    const [collapsed, setCollapsed] = useState(false);
    const [activeMenu, setActiveMenu] = useState('');

    useEffect(() => {
        setActiveMenu(location.pathname);
    }, [location]);

    return (
        <Layout style={{ minHeight: '100vh' }} className="layout-admin">
            {!isMobile && (
                <SliderAdmin
                    collapsed={collapsed}
                    setCollapsed={setCollapsed}
                    activeMenu={activeMenu}
                    setActiveMenu={setActiveMenu}
                />
            )}
            <Layout>
                {!isMobile && (
                    <HeaderAdmin collapsed={collapsed} setCollapsed={setCollapsed} />
                )}
                <Content style={{ padding: '15px' }}>
                    <Outlet />
                </Content>
            </Layout>
        </Layout>
    );
};

export default LayoutAdmin;
