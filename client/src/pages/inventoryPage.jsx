import { useState, useEffect } from "react";
import { message, Divider } from "antd";
import api from "../api";
import ButtonDrawerArea from "../components/buttonDrawerArea.jsx";
import CardArea from "../components/cardArea.jsx";

export default function Inventario() {
  const [areas, setAreas] = useState([]);
  const [messageApi, contextHolder] = message.useMessage();

  useEffect(() => {
    const fetchAreas = async () => {
      try {
        const { data } = await api.get("/areas", {
          withCredentials: true
        });
        setAreas(data);
      } catch (error) {
        console.error("Error obteniendo áreas:", error);
        messageApi.error("No se pudieron cargar las áreas");
      }
    };

    fetchAreas();
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

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {areas.map(area => (
          <CardArea
            key={area.id}
            id={area.id}
            nombre={area.nombre}
            descripcion={area.descripcion}
            color={area.color}
            onDelete={handleAreaDeleted}
          />
        ))}
      </div>
    </div>
  );
}
