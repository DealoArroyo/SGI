import { useNavigate } from "react-router-dom";
import ButtonDelete from "./buttonDelete";
import { RightOutlined } from "@ant-design/icons";

const CardArea = ({ id, nombre, descripcion, color, canDelete, onDelete }) => {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/inventario/${id}`, {
      state: { nombre }
    });
  };

  return (
    <div
      onClick={handleClick}
      className="inventory-card group relative cursor-pointer rounded-2xl border border-slate-200 bg-white p-5 pr-12 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
    >
        <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <span
                className="inline-block h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: color || "#64748b" }}
              />
            </div>
            <h3 className="inventory-card-title font-semibold text-slate-900 truncate">{nombre}</h3>
            <p className="inventory-card-desc text-sm text-slate-600 mt-1 line-clamp-2">
              {descripcion || "Sin descripción"}
            </p>
            <div className="inventory-card-link mt-3 mb-9 inline-flex items-center gap-1 text-sm text-blue-700 group-hover:text-blue-800">
              Ver categorías <RightOutlined className="text-xs" />
            </div>
        </div>

        {canDelete && (
            <div 
              className="inventory-card-delete absolute right-3 top-3 opacity-0 transition group-hover:opacity-100 group-focus-within:opacity-100"
              onClick={(e) => e.stopPropagation()}>
                <ButtonDelete
                  id={id} 
                  onDelete={(onDelete)}
                  resource="areas"
                  label="área"
                />
            </div>
        )}
    </div>
  );
};

export default CardArea;
