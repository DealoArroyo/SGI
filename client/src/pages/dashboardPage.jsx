import { useState, useEffect } from "react";
import api from "../api";
import { useNavigate } from "react-router-dom";
import MenuUsuario from "../components/menu";

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    api.get("/perfil")
      .then((res) => {
        setUser(res.data.user);
      })
      .catch(() => {
        navigate("/login");
      });
  }, [navigate]);

  if (!user) return <h2>Cargando...</h2>;

  return (
    <div>
      <MenuUsuario />
    </div>
  );
}