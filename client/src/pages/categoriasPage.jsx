import { useState, useEffect } from "react";
import { message, Divider } from "antd";
import api from "../api";
import ButtonDrawerArea from "../components/buttonDrawerArea.jsx";
import CardCategoria from "../components/cardCategoria.jsx";
import { useParams } from "react-router-dom";

export default function Inventario() {
  const [categorias, setCategorias] = useState([]);
  const { id } = useParams();
  const [messageApi, contextHolder] = message.useMessage();

  useEffect(() => {
    const fetchCategorias = async () => {

      if (!id) return;

      try {
        const { data } = await api.get(`/categorias/area/${id}`, {
          withCredentials: true
        });
        setCategorias(data);
      } catch (error) {
        console.error("Error obteniendo categorías:", error);
        messageApi.error("No se pudieron cargar las categorías");
      }
    };

    fetchCategorias();
  }, [id, messageApi]);

  const handleCategoriaAdded = (newCategoria) => {
    setCategorias(prev => [...prev, newCategoria]);
    messageApi.success("Categoria creada correctamente");
  };

  const handleCategoriaDeleted = (id) => {
    setCategorias(prev => prev.filter(categoria => categoria.id !== id));
  };

  return (
    <div>
      {contextHolder}

      <ButtonDrawerArea onAreaAdded={handleCategoriaAdded} />

      <Divider />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {categorias.map(categoria => (
          <CardCategoria
            key={categoria.id}
            id={categoria.id}
            nombre={categoria.nombre}
            descripcion={categoria.descripcion}
            color={categoria.color}
            onDelete={handleCategoriaDeleted}
          />
        ))}
      </div>
    </div>
  );
}
