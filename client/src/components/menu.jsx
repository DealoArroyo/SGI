import { useEffect, useState } from "react";
import {
  ProductOutlined,
  TruckOutlined,
  PieChartOutlined,
  BookOutlined,
  UsergroupAddOutlined,
  SettingOutlined,
  LogoutOutlined,
  CalendarOutlined,
  TeamOutlined
} from "@ant-design/icons";
import { Breadcrumb, Layout, theme } from "antd";
import {
  Link,
  useLocation,
  useNavigate,
  Outlet
} from "react-router-dom";
import api from "../api";

const { Content, Sider } = Layout;
const SIDER_WIDTH = 220;
const SIDER_COLLAPSED_WIDTH = 80;
const NAV_MODE_KEY = "sgi_nav_mode";

const MenuUsuario = () => {
  const [navMode, setNavMode] = useState(() => {
    const stored = localStorage.getItem(NAV_MODE_KEY);
    return stored === "recortado" ? "recortado" : "normal";
  });
  const [user, setUser] = useState(null);
  const [breadcrumbItems, setBreadcrumbItems] = useState([]);

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
      setBreadcrumbItems([]);
    }
  }, [location.pathname]);

  useEffect(() => {
    const syncNavMode = () => {
      const stored = localStorage.getItem(NAV_MODE_KEY);
      setNavMode(stored === "recortado" ? "recortado" : "normal");
    };
    window.addEventListener("sgi-nav-mode-change", syncNavMode);
    return () => window.removeEventListener("sgi-nav-mode-change", syncNavMode);
  }, []);


  // ======================
  // LOGOUT
  // ======================
  const handleLogout = async () => {
    try {
      await api.post("/auth/logout", {}, { withCredentials: true });
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
      label: "Dashboard",
      colorClass: "is-green",
    },
    {
      key: "/productos",
      icon: <ProductOutlined />,
      label: "Productos",
      colorClass: "is-amber",
    },
    {
      key: "/inventario",
      icon: <BookOutlined />,
      label: "Inventario",
      colorClass: "is-purple",
    },
    {
      key: "/pedidos",
      icon: <TruckOutlined />,
      label: "Pedidos",
      colorClass: "is-slate",
    },
    {
      key: "/clientes",
      icon: <TeamOutlined />,
      label: "Clientes",
      colorClass: "is-blue",
    },
    {
      key: "/calendario",
      icon: <CalendarOutlined />,
      label: "Calendario",
      colorClass: "is-teal",
    },
    ...(user?.rol === "Administrador"
      ? [{
          key: "/usuarios",
          icon: <UsergroupAddOutlined />,
          label: "Usuarios",
          colorClass: "is-indigo",
        }]
      : []),
    {
      key: "/configuracion",
      icon: <SettingOutlined />,
      label: "Configuración",
      colorClass: "is-slate",
    },
    {
      key: "logout",
      icon: <LogoutOutlined />,
      label: "Cerrar sesión",
      colorClass: "is-danger",
    },
  ];

  const mainItems = menuItems.filter((item) => item.key !== "logout" && item.key !== "/configuracion");
  const bottomItems = menuItems.filter((item) => item.key === "/configuracion" || item.key === "logout");
  const selectedKey = location.pathname.startsWith("/inventario")
    ? "/inventario"
    : location.pathname;
  const isCollapsed = navMode === "recortado";

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
    "/calendario": "Calendario",
    "/clientes": "Clientes"
  };

  const basePath = "/" + location.pathname.split("/")[1];
  const baseLabel = breadcrumbMap[basePath];

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Sider
        width={SIDER_WIDTH}
        collapsedWidth={SIDER_COLLAPSED_WIDTH}
        collapsible={false}
        collapsed={isCollapsed}
        trigger={null}
        className="side-nav"
        style={{
          overflow: "hidden",
          height: "100vh",
          position: "fixed",
          insetInlineStart: 0,
          top: 0,
          bottom: 0,
          zIndex: 1000,
          background: "transparent",
        }}
      >
        <div className={`side-nav-shell ${isCollapsed ? "is-collapsed" : ""}`}>
          <div className="side-nav-panel">
            <div className="side-nav-main">
              {mainItems.map((item) => {
                const isActive = selectedKey === item.key;
                return (
                  <Link
                    key={item.key}
                    to={item.key}
                    className={`side-nav-item ${isActive ? "is-active" : ""}`}
                    data-tooltip={isCollapsed ? item.label : undefined}
                  >
                    <span className={`side-nav-icon ${item.colorClass}`}>{item.icon}</span>
                    {!isCollapsed && <span className="side-nav-label">{item.label}</span>}
                  </Link>
                );
              })}
            </div>
          </div>

          <div className="side-nav-footer">
            {bottomItems.map((item) => {
              const isActive = selectedKey === item.key;
              const isLogout = item.key === "logout";
                return (
                  <button
                    key={item.key}
                    type="button"
                    className={`side-nav-item ${isActive ? "is-active" : ""} ${isLogout ? "is-logout" : ""}`}
                    data-tooltip={isCollapsed ? item.label : undefined}
                    onClick={() => {
                      if (isLogout) {
                        handleLogout();
                        return;
                    }
                    navigate(item.key);
                  }}
                >
                  <span className={`side-nav-icon ${item.colorClass}`}>{item.icon}</span>
                  {!isCollapsed && (
                    <span className="side-nav-label">{item.label}</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </Sider>

      <Layout
        style={{
          marginLeft: isCollapsed ? SIDER_COLLAPSED_WIDTH : SIDER_WIDTH,
          transition: "margin-left 0.2s ease",
        }}
      >
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

            {breadcrumbItems.map((item) => (
              <Breadcrumb.Item key={item.path || item.title}>
                {item.path ? <Link to={item.path}>{item.title}</Link> : item.title}
              </Breadcrumb.Item>
            ))}
          </Breadcrumb>

          <div
            style={{
              padding: 24,
              minHeight: 600,
              background: colorBgContainer,
              borderRadius: borderRadiusLG,
            }}
          >
            <Outlet context={{ setBreadcrumbItems }} />
          </div>
        </Content>
      </Layout>
    </Layout>
  );
};

export default MenuUsuario;
