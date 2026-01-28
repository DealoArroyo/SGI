import { BrowserRouter, Routes, Route } from "react-router-dom";
import LoginPage from "./pages/loginPage.jsx";
import PrivateRoute from "./components/privateRoute.jsx";
import MenuUsuario from "./components/menu.jsx";

// Páginas
import Dashboard from "./pages/homePage.jsx";
import InventarioLayout from "./pages/inventarioLayout.jsx";
import InventarioPage from "./pages/inventoryPage.jsx";
import CategoriaPage from "./pages/categoriasPage.jsx";
import PaginaDetalle from "./pages/productosCategoriaPage.jsx";
import Productos from "./pages/productsPage.jsx";
import UsuariosDelInquilino from "./pages/usersPage.jsx";
import Configuracion from "./pages/settingsPage.jsx";
import Pedidos from "./pages/ordersPage.jsx";
import Ventas from "./pages/salesPage.jsx";
import CalendarioPage from "./pages/calendarioPage.jsx";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* LOGIN */}
        <Route path="/login" element={<LoginPage />} />

        {/* RUTAS PRIVADAS */}
        <Route element={<PrivateRoute />}>
          {/* LAYOUT PRINCIPAL */}
          <Route element={<MenuUsuario />}>
            <Route index element={<Dashboard />} />

            {/* INVENTARIO */}
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
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
