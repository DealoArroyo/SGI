import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import LoginPage from "./pages/loginPage.jsx";
import Dashboard from './pages/homePage.jsx';
import PrivateRoute from './components/privateRoute.jsx';
import Inventario from './pages/inventoryPage.jsx';
import CategoriaPage from './pages/categoriasPage.jsx';
import Productos from './pages/productsPage.jsx';
import UsuariosDelInquilino from './pages/usersPage.jsx';
import Configuracion from './pages/settingsPage.jsx';
import Pedidos from './pages/ordersPage.jsx';
import Ventas from './pages/salesPage.jsx';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path='/login' element={<LoginPage />} />
        
        <Route path='/' element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          }>

            <Route 
              path='inventario' 
              element={<Inventario />} 
            />
            <Route 
              path='inventario/:id' 
              element={<CategoriaPage />} 
            />
            <Route 
              path='productos' 
              element={<Productos />} 
            />
            <Route 
              path='usuarios' 
              element={<UsuariosDelInquilino />} 
            />
            <Route 
              path='configuracion' 
              element={<Configuracion />} 
            />
            <Route 
              path='pedidos' 
              element={<Pedidos />} 
            />
            <Route 
              path='ventas' 
              element={<Ventas />} 
            />
            

          </Route>
        
        <Route path='/' element={<LoginPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
