import { useState, useEffect } from "react";
import { message, Divider } from "antd";
import api from "../api";
import ButtonDrawerArea from "../components/buttonDrawerArea.jsx";
import CardArea from "../components/cardArea.jsx";
import PageLoader from "../components/pageLoader.jsx";

export default function Inventario() {
  const [areas, setAreas] = useState([]);
  const [userRole, setUserRole] = useState("");
  const [loading, setLoading] = useState(true);
  const [messageApi, contextHolder] = message.useMessage();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [areasRes, perfilRes] = await Promise.all([
          api.get("/areas", {
            withCredentials: true
          }),
          api.get("/auth/perfil", {
            withCredentials: true
          })
        ]);
        setAreas(areasRes.data || []);
        setUserRole(perfilRes.data?.user?.rol || "");
      } catch (error) {
        console.error("Error obteniendo áreas:", error);
        messageApi.error("No se pudieron cargar las áreas");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [messageApi]);

  const handleAreaAdded = (newArea) => {
    setAreas(prev => [...prev, newArea]);
    messageApi.success("Área creada correctamente");
  };

  const handleAreaDeleted = (id) => {
    setAreas(prev => prev.filter(area => area.id !== id));
  };

  return (
    <div>
      {contextHolder}

      <ButtonDrawerArea onAreaAdded={handleAreaAdded} />

      <Divider />

      {loading ? (
        <PageLoader label="Cargando inventario" />
      ) : areas.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 p-10 text-center bg-slate-50">
          <p className="text-slate-700 font-medium">No hay áreas registradas</p>
          <p className="text-slate-500 text-sm mt-1">
            Crea tu primera área para organizar categorías y productos.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
          {areas.map(area => (
            <CardArea
              key={area.id}
              id={area.id}
              nombre={area.nombre}
              descripcion={area.descripcion}
              color={area.color}
              canDelete={userRole === "Administrador"}
              onDelete={handleAreaDeleted}
            />
          ))}
        </div>
      )}
    </div>
  );
}
