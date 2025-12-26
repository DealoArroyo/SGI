import { Popconfirm, Button, message } from "antd";
import { DeleteOutlined } from "@ant-design/icons";
import api from "../api";

const CardArea = ({ id, nombre, descripcion, color, onDelete }) => {

  const handleDelete = async () => {
    if (!id) {
      message.error("ID inválido");
      return;
    }

    try {
      await api.delete(`/areas/${id}`, {
        withCredentials: true
      });

      message.success("Área eliminada");
      onDelete(id);
    } catch (error) {
      console.error("Error eliminando área:", error);
      message.error("No se pudo eliminar el área");
    }
  };

  return (
    <div
      className="bg-white rounded-lg p-4 shadow-lg flex justify-between border-l-8"
      style={{ borderLeftColor: color }}
    >

        <div>
            <h3 className="font-semibold">{nombre}</h3>
            <p className="text-gray-600">{descripcion}</p>
        </div>

        <div>
            <Popconfirm
            title="¿Eliminar área?"
            description="Esta acción no se puede deshacer"
            onConfirm={handleDelete}
            okText="Sí"
            cancelText="No"
            >
              <Button danger shape="circle" type="primary" icon={<DeleteOutlined />} />
            </Popconfirm>
        </div>
    </div>
  );
};

export default CardArea;
