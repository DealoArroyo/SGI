import React, { useState } from 'react';
import {
  ProductOutlined,
  TruckOutlined,
  PieChartOutlined,
  BookOutlined,
  UsergroupAddOutlined,
  SettingOutlined,
  LogoutOutlined
} from '@ant-design/icons';
import { Breadcrumb, Layout, Menu, theme } from 'antd';
import Productos from '../pages/productsPage.jsx';
import Inventario from '../pages/inventoryPage.jsx';
import Pedidos from '../pages/ordersPage.jsx';
import Usuarios from '../pages/usersPage.jsx';
import Configuracion from '../pages/settingsPage.jsx';
import Ventas from '../pages/salesPage.jsx';

import api from "../api";
import { useNavigate } from "react-router-dom";

const { Header, Content, Footer, Sider } = Layout;

function getItem(label, key, icon, children) {
  return { key, icon, children, label };
}

const items = [
  getItem('Dashboard', '1', <PieChartOutlined style={{ color: 'green' }} />),
  getItem('Productos', '2', <ProductOutlined style={{ color: '#874d00' }} />),
  getItem('Inventario', '3', <BookOutlined style={{ color: '#9254de' }} />),
  getItem('Pedidos', '4', <TruckOutlined style={{ color: '#13c2c2' }} />),
  getItem('Usuarios', '5', <UsergroupAddOutlined style={{ color: '#1890ff' }} />),
  getItem('Configuración', '6', <SettingOutlined style={{ color: '#f0f0f0' }} />),
  getItem('Cerrar sesión', '7', <LogoutOutlined style={{ color: 'red' }} />),
];

const MenuUsuario = () => {
  const [selectedView, setSelectedView] = useState("1");
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();

  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  const handleMenuClick = async (e) => {
    if (e.key === "7") {
      try {
        await api.post("/logout", {}, { withCredentials: true });
      } catch (error) {
        console.error("Error cerrando sesión:", error);
      } 

      navigate("/login");
      return; 
    }

    setSelectedView(e.key);
  };

  const renderContent = () => {
    switch (selectedView) {
      case '2': return <Productos />;
      case '3': return <Inventario />;
      case '4': return <Pedidos />;
      case '5': return <Usuarios />;
      case '6': return <Configuracion />;
      default: return <Ventas />;
    }
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider collapsible collapsed={collapsed} onCollapse={setCollapsed}>
        <Menu
          theme="dark"
          defaultSelectedKeys={['1']}
          mode="inline"
          items={items}
          onClick={handleMenuClick} 
        />
      </Sider>

      <Layout>
        <Content style={{ margin: '0 16px' }}>
          <Breadcrumb style={{ margin: '16px 0' }} />

          <div
            style={{
              padding: 24,
              minHeight: 500,
              background: colorBgContainer,
              borderRadius: borderRadiusLG,
            }}
          >
            {renderContent()}
          </div>
        </Content>

        <Footer style={{ textAlign: 'center' }}>
          Ant Design ©{new Date().getFullYear()} Created by Ant UED
        </Footer>
      </Layout>
    </Layout>
  );
};

export default MenuUsuario;
