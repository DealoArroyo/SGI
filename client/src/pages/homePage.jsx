import { useState, useEffect } from "react";
import { useNavigate, Outlet } from "react-router-dom";
import api from "../api";

export default function Inicio() {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    api.get("/auth/perfil", { withCredentials: true })
      .then(res => setUser(res.data.user))
      .catch(() => navigate("/login"));
  }, [navigate]);

  if (!user) return <h2>Cargando...</h2>;

  return <Outlet />;
}
