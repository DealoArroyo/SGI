import React, { useState, useEffect } from 'react';
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

const MenuUsuario = () => {
  const [selectedView, setSelectedView] = useState("1");
  const [collapsed, setCollapsed] = useState(false);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  useEffect(() => {
  const fetchUser = async () => {
    try {
      const { data } = await api.get("/auth/perfil", { withCredentials: true });
      console.log("PERFIL:", data);
      setUser(data.user); // <--- AQUÍ EL FIX REAL
    } catch (error) {
      console.error("Error obteniendo perfil:", error);
    }
  };
  fetchUser();
}, []);



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
      case '5':
        return user?.rol === "Administrador"
          ? <Usuarios />
        : <div>No autorizado</div>;

      case '6': return <Configuracion />;
      default: return <Ventas />;
    }
  };

  const menuItems = [
    getItem('Dashboard', '1', <PieChartOutlined />),
    getItem('Productos', '2', <ProductOutlined />),
    getItem('Inventario', '3', <BookOutlined />),
    getItem('Pedidos', '4', <TruckOutlined />),

    ...(user?.rol === "Administrador"
  ? [getItem('Usuarios', '5', <UsergroupAddOutlined />)]
  : []),

    getItem('Configuración', '6', <SettingOutlined />),
    getItem('Cerrar sesión', '7', <LogoutOutlined style={{ color: 'red' }} />),
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider collapsible collapsed={collapsed} onCollapse={setCollapsed}>
        <Menu
          theme="dark"
          defaultSelectedKeys={['1']}
          mode="inline"
          items={menuItems}
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
