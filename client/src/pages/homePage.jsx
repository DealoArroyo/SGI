import { useState, useEffect } from "react";
import api from "../api";
import { useNavigate } from "react-router-dom";
import MenuUsuario from "../components/menu";
import { Outlet } from "react-router-dom";

export default function Inicio() {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    api.get("/auth/perfil")
      .then((res) => {
        setUser(res.data.user);
      })
      .catch(() => {
        navigate("/login");
      });
  }, [navigate]);

  if (!user) return <h2>Cargando...</h2>;

  return (
    <MenuUsuario>
      <Outlet />
    </MenuUsuario>
  );
}