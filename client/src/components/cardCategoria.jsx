import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import ButtonDelete from "./buttonDelete";

const CardCategoria = ({ id, nombre, descripcion, color, onDelete }) => {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/categoria/${id}`, {
      state: { nombre }
    });
  };
  useEffect(() => {
        const fetchUser = async () => {
            try {
                const { data } = await api.get("/auth/perfil", { withCredentials: true });
                setUser(data.user);
            } catch (error) {
                console.error("Error obteniendo perfil:", error);
            }
        };
        fetchUser();
    }, []);

  return (
    <div
      onClick={handleClick}
      className="bg-white rounded-lg p-4 shadow-lg flex justify-between border-l-8"
      style={{ borderLeftColor: color }}
    >

        <div>
            <h3 className="font-semibold">{nombre}</h3>
            <p className="text-gray-600">{descripcion}</p>
        </div>

        {user?.rol === "Administrador" && (
            <div 
              className="flex items-center"
              onClick={(e) => e.stopPropagation()}>
                <ButtonDelete 
                    id={id} 
                    onDelete={(onDelete)}
                    resource="categorias"
                    label="categoría" 
                />
            </div>
        )}
    </div>
  );
};

export default CardCategoria;
