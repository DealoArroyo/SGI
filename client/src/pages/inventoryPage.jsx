import { useState, useEffect } from "react";
import { message, Divider } from "antd";
import api from "../api";
import axios from "axios";
import ButtonDrawerArea from "../components/buttonDrawerArea.jsx";
import CardArea from "../components/cardArea.jsx";

export default function Inventario() {
  const [areas, setAreas] = useState([]);
  const [messageApi, contextHolder] = message.useMessage();

  const success = () => {
    messageApi.open({
      type: "success",
      content: "Área agregada correctamente"
    });
  };

  const warning = () => {
    messageApi.open({
      type: "error",
      content: "Área no se pudo agregar"
    });
  };

  useEffect(() => {
    const fetchAreas = async () => {
      try {
        const res = await api.get("http://localhost:3000/api/areas", {
          withCredentials: true
        });
        setAreas(res.data);
      } catch (error) {
        console.error("Error obteniendo áreas:", error);
      }
    };

    fetchAreas();
  }, []);

  const handleAreaAdded = (newArea) => {
    try {
      setAreas(prev => [...prev, newArea]);
      success();
    } catch (error) {
      console.error("Error al crear área", error);
      warning();
    }
  };

  return (
    <div>
      {contextHolder}
      <ButtonDrawerArea onAreaAdded={handleAreaAdded} />

      <Divider />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {areas.map((area) => (
          <CardArea
            key={area.id}
            nombre={area.nombre}
          />
        ))}
      </div>
    </div>
  );
};
