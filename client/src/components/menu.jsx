import React, { useEffect, useState } from "react";
import {
  ProductOutlined,
  TruckOutlined,
  PieChartOutlined,
  BookOutlined,
  UsergroupAddOutlined,
  SettingOutlined,
  LogoutOutlined,
  CalendarOutlined
} from "@ant-design/icons";
import { Breadcrumb, Layout, Menu, theme } from "antd";
import {
  Link,
  useLocation,
  useNavigate,
  Outlet
} from "react-router-dom";
import api from "../api";

const { Content, Sider } = Layout;

const MenuUsuario = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [user, setUser] = useState(null);
  const [breadcrumbExtra, setBreadcrumbExtra] = useState(null);

  const location = useLocation();
  const navigate = useNavigate();

  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  // ======================
  // PERFIL
  // ======================
  useEffect(() => {
    api.get("/auth/perfil", { withCredentials: true })
      .then(res => setUser(res.data.user));
  }, []);

  // ======================
  // LIMPIAR BREADCRUMB EXTRA
  // ======================
  useEffect(() => {
    if (!location.pathname.startsWith("/inventario/")) {
      setBreadcrumbExtra(null);
    }
  }, [location.pathname]);

  // ======================
  // LOGOUT
  // ======================
  const handleLogout = async () => {
    try {
      await api.post("/logout", {}, { withCredentials: true });
    } catch (error) {
      console.error("Error cerrando sesión", error);
    } finally {
      navigate("/login", { replace: true });
      window.location.reload();
    }
  };

  // ======================
  // MENU
  // ======================
  const menuItems = [
    {
      key: "/",
      icon: <PieChartOutlined />,
      label: <Link to="/">Dashboard</Link>,
    },
    {
      key: "/productos",
      icon: <ProductOutlined />,
      label: <Link to="/productos">Productos</Link>,
    },
    {
      key: "/inventario",
      icon: <BookOutlined />,
      label: <Link to="/inventario">Inventario</Link>,
    },
    {
      key: "/calendario",
      icon: <CalendarOutlined />,
      label: <Link to="/calendario">Calendario</Link>,
    },
    {
      key: "/pedidos",
      icon: <TruckOutlined />,
      label: <Link to="/pedidos">Pedidos</Link>,
    },
    ...(user?.rol === "Administrador"
      ? [{
          key: "/usuarios",
          icon: <UsergroupAddOutlined />,
          label: <Link to="/usuarios">Usuarios</Link>,
        }]
      : []),
    {
      key: "/configuracion",
      icon: <SettingOutlined />,
      label: <Link to="/configuracion">Configuración</Link>,
    },
    {
      key: "logout",
      icon: <LogoutOutlined style={{ color: "red" }} />,
      label: <span onClick={handleLogout}>Cerrar sesión</span>,
    },
  ];

  // ======================
  // BREADCRUMB BASE DINÁMICO
  // ======================
  const breadcrumbMap = {
    "/": "Dashboard",
    "/productos": "Productos",
    "/inventario": "Inventario",
    "/pedidos": "Pedidos",
    "/usuarios": "Usuarios",
    "/configuracion": "Configuración",
    "/calendario": "Calendario"
  };

  const basePath = "/" + location.pathname.split("/")[1];
  const baseLabel = breadcrumbMap[basePath];

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Sider collapsible collapsed={collapsed} onCollapse={setCollapsed}>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[
            location.pathname.startsWith("/inventario")
              ? "/inventario"
              : location.pathname
          ]}
          items={menuItems}
        />
      </Sider>

      <Layout>
        <Content style={{ margin: "0 16px" }}>
          {/* ======================
              BREADCRUMB
             ====================== */}
          <Breadcrumb style={{ margin: "16px 0" }}>
            {baseLabel && (
              <Breadcrumb.Item>
                {basePath === "/" ? (
                  baseLabel
                ) : (
                  <Link to={basePath}>{baseLabel}</Link>
                )}
              </Breadcrumb.Item>
            )}

            {breadcrumbExtra && (
              <Breadcrumb.Item>{breadcrumbExtra}</Breadcrumb.Item>
            )}
          </Breadcrumb>

          <div
            style={{
              padding: 24,
              minHeight: 600,
              background: colorBgContainer,
              borderRadius: borderRadiusLG,
            }}
          >
            <Outlet context={{ setBreadcrumbExtra }} />
          </div>
        </Content>
      </Layout>
    </Layout>
  );
};

export default MenuUsuario;
