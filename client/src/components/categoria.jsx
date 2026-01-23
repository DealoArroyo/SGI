import { useEffect, useState } from "react";
import { useParams, useLocation } from "react-router-dom";
import api from "../api";

export default function Categoria() {
  const { id } = useParams(); // id_categoria
  const location = useLocation();
  const nombreCategoria = location.state?.nombre;

  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProductos = async () => {
      try {
        const { data } = await api.get(`/productos/categoria/${id}`);
        setProductos(data);
      } catch (error) {
        console.error("Error obteniendo productos:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProductos();
  }, [id]);

  if (loading) return <p>Cargando productos...</p>;

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold mb-4">
        Productos de {nombreCategoria || "la categoría"}
      </h1>

      {productos.length === 0 ? (
        <p className="text-gray-500">No hay productos en esta categoría</p>
      ) : (
        <div className="grid gap-4">
          {productos.map((p) => (
            <div
              key={p.producto_id}
              className="bg-white p-4 rounded-lg shadow"
            >
              <h3 className="font-semibold">{p.producto_nombre}</h3>
              <p className="text-gray-600">{p.producto_detalles}</p>

              <div className="mt-2 text-sm text-gray-500">
                <span>Precio: ${p.producto_precio_venta}</span>
                <span className="ml-4">
                  Unidad: {p.unidad_medida || "—"}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
