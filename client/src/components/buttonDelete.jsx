import api from "../api";
import { message, Popconfirm, Button } from "antd";
import { DeleteOutlined } from "@ant-design/icons";

const ButtonDelete = ({ id, onDelete, resource, label }) => {

    const handleDelete = async () => {
        if (!id) {
        message.error("ID inválido");
        return;
    }

    try {
      await api.delete(`/${resource}/${id}`, {
        withCredentials: true
      });

      message.success(`${label.charAt(0).toUpperCase() + label.slice(1)} eliminada`);
      onDelete(id);
    } catch (error) {
      console.error(`Error eliminando ${label}:`, error);
      message.error(`No se pudo eliminar el/la ${label}`);
    }
  };

  return (
    <div>
        <Popconfirm
            title={`¿Eliminar ${label}?`}
            description="Esta acción no se puede deshacer"
            onConfirm={handleDelete}
            okText="Sí"
            cancelText="No"
        >
            <Button
              danger
              shape="circle"
              type="text"
              size="small"
              className="inventory-card-delete-btn"
              icon={<DeleteOutlined />}
              aria-label={`Eliminar ${label}`}
            />
        </Popconfirm>
    </div>
  )
}

export default ButtonDelete;
