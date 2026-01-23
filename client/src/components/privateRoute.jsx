import { useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router-dom";
import api from "../api";

export default function PrivateRoute() {
  const [isAuth, setIsAuth] = useState(null);

  useEffect(() => {
    api.get("/auth/perfil", { withCredentials: true })
      .then(() => setIsAuth(true))
      .catch(() => setIsAuth(false));
  }, []);

  if (isAuth === null) {
    return <p>Cargando...</p>;
  }

  return isAuth ? <Outlet /> : <Navigate to="/login" replace />;
}
