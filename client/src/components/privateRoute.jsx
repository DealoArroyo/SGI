import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import api from "../api";

export default function PrivateRoute({ children }) {
  const [isAuth, setIsAuth] = useState(null); // null = cargando

  useEffect(() => {
    api.get("/perfil")
      .then(() => setIsAuth(true))  // usuario válido
      .catch(() => setIsAuth(false)); // token no válido o no existe
  }, []);

  if (isAuth === null) {
    return <p>Cargando...</p>; // pantalla temporal
  }

  return isAuth ? children : <Navigate to="/login" />;
}
