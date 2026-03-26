import { Suspense, lazy } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { App as AntdApp, ConfigProvider, theme } from "antd";
import PrivateRoute from "./components/privateRoute.jsx";
import MenuUsuario from "./components/menu.jsx";
import PageLoader from "./components/pageLoader.jsx";

// Páginas
const LoginPage = lazy(() => import("./pages/loginPage.jsx"));
const Dashboard = lazy(() => import("./pages/homePage.jsx"));
const InventarioLayout = lazy(() => import("./pages/inventarioLayout.jsx"));
const InventarioPage = lazy(() => import("./pages/inventoryPage.jsx"));
const CategoriaPage = lazy(() => import("./pages/categoriasPage.jsx"));
const PaginaDetalle = lazy(() => import("./pages/productosCategoriaPage.jsx"));
const Productos = lazy(() => import("./pages/productsPage.jsx"));
const UsuariosDelInquilino = lazy(() => import("./pages/usersPage.jsx"));
const Configuracion = lazy(() => import("./pages/settingsPage.jsx"));
const Pedidos = lazy(() => import("./pages/ordersPage.jsx"));
const Ventas = lazy(() => import("./pages/salesPage.jsx"));
const CalendarioPage = lazy(() => import("./pages/calendarioPage.jsx"));
const ClientesPage = lazy(() => import("./pages/clientesPage.jsx"));
import { useThemeMode } from "./context/themeContext.jsx";

function App() {
  const { isDarkMode } = useThemeMode();

  return (
    <ConfigProvider
      theme={{
        algorithm: isDarkMode ? theme.darkAlgorithm : theme.defaultAlgorithm,
      }}
    >
      <AntdApp>
        <BrowserRouter>
          <Suspense fallback={<PageLoader label="Cargando pantalla" />}>
            <Routes>
              <Route path="/login" element={<LoginPage />} />

              <Route element={<PrivateRoute />}>
                <Route element={<MenuUsuario />}>
                  <Route index element={<Dashboard />} />

                  <Route path="inventario" element={<InventarioLayout />}>
                    <Route index element={<InventarioPage />} />
                    <Route path=":areaId" element={<CategoriaPage />} />
                    <Route
                      path=":areaId/:categoriaId"
                      element={<PaginaDetalle />}
                    />
                  </Route>

                  <Route path="productos" element={<Productos />} />
                  <Route path="usuarios" element={<UsuariosDelInquilino />} />
                  <Route path="configuracion" element={<Configuracion />} />
                  <Route path="pedidos" element={<Pedidos />} />
                  <Route path="ventas" element={<Ventas />} />
                  <Route path="calendario" element={<CalendarioPage />} />
                  <Route path="clientes" element={<ClientesPage />} />
                </Route>
              </Route>
            </Routes>
          </Suspense>
        </BrowserRouter>
      </AntdApp>
    </ConfigProvider>
  );
}

export default App;
