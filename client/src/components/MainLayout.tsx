// 基础布局组件 - 侧边栏导航

import React, { useState } from 'react';
import { Layout, Menu, Breadcrumb, theme } from 'antd';
import { DashboardOutlined, FolderOutlined, LaptopOutlined, HomeOutlined } from '@ant-design/icons';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';

const { Header, Sider, Content } = Layout;

/**
 * 菜单项定义
 */
const menuItems: any[] = [
  {
    key: '/',
    icon: <DashboardOutlined />,
    label: 'Dashboard',
  },
  {
    key: '/files',
    icon: <FolderOutlined />,
    label: 'Files',
  },
  {
    key: '/terminal',
    icon: <LaptopOutlined />,
    label: 'Terminal',
  },
];

/**
 * 路由与面包屑映射
 */
const routeMap: Record<string, string> = {
  '/': 'Dashboard',
  '/files': 'Files',
  '/terminal': 'Terminal',
};

/**
 * 主布局组件
 */
const MainLayout: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  /**
   * 菜单点击处理
   */
  const handleMenuClick = ({ key }: { key: string }) => {
    navigate(key);
  };

  /**
   * 生成面包屑路径
   */
  const breadcrumbItems = location.pathname
    .split('/')
    .filter(Boolean)
    .map((path, index) => {
      const fullPath = `/${path}`;
      return {
        key: fullPath,
        title: routeMap[fullPath] || path,
        href: fullPath,
      };
    });

  // 如果是根路径，添加 Home 图标
  if (location.pathname === '/') {
    breadcrumbItems.unshift({
      key: 'home',
      title: <HomeOutlined />,
      href: '/',
    });
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      {/* 侧边栏 */}
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={(value) => setCollapsed(value)}
        theme="dark"
        width={200}
      >
        <div
          style={{
            height: 32,
            margin: 16,
            background: 'rgba(255, 255, 255, 0.2)',
            borderRadius: 6,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontWeight: 'bold',
            fontSize: collapsed ? 0 : 14,
            overflow: 'hidden',
          }}
        >
          {collapsed ? 'OC' : 'OpenClaw'}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={handleMenuClick}
        />
      </Sider>

      {/* 主体内容区 */}
      <Layout style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
        {/* 顶部导航栏 - 面包屑 */}
        <Header
          style={{
            padding: '0 24px',
            background: colorBgContainer,
            display: 'flex',
            alignItems: 'center',
            flexShrink: 0,
          }}
        >
          <Breadcrumb
            items={breadcrumbItems}
            onClick={(e) => {
              e.preventDefault();
              const target = e.target as HTMLElement;
              if (target.tagName === 'A') {
                const href = (target as HTMLAnchorElement).getAttribute('href');
                if (href) navigate(href);
              }
            }}
            style={{ fontSize: 16 }}
          />
        </Header>

        {/* 内容区域 */}
        <Content
          style={{
            margin: '0 28px 28px 28px',
            padding: 0,
            background: '#1e1e1e',
            borderRadius: borderRadiusLG,
            flex: 1,
            overflow: 'auto',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

export default MainLayout;
