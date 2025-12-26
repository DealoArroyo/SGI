import { useParams, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { Divider } from "antd";
import api from "../api";

export default function CategoriasPage() {
  const { areaId } = useParams();
  const location = useLocation();

  const [categorias, setCategorias] = useState([]);
  const [areaNombre, setAreaNombre] = useState(
    location.state?.areaNombre || ""
  );

  useEffect(() => {
    const fetchCategorias = async () => {
      try {
        const res = await api.get(
          `http://localhost:3000/api/categorias/inquilino`,
          { withCredentials: true }
        );
        setCategorias(res.data);
      } catch (error) {
        console.error("Error cargando categorías", error);
      }
    };

    fetchCategorias();
  }, [areaId, areaNombre]);

  return (
    <div>
      <h2 className="text-xl font-semibold">
        Categorías de {areaNombre}
      </h2>

      <Divider />

      {categorias.map(cat => (
        <div
          key={cat.id}
          className="border rounded p-3 mb-2"
        >
          {cat.nombre}
        </div>
      ))}
    </div>
  );
}
