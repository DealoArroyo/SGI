import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import LoginPage from "./pages/loginPage.jsx";
import Dashboard from './pages/dashboardPage.jsx';
import PrivateRoute from './components/privateRoute.jsx';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path='/login' element={<LoginPage />} />
        
        <Route 
          path='/' 
          element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          } />
        
        <Route path='/' element={<LoginPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
