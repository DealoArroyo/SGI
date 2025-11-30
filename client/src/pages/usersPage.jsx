import { useState, useEffect } from "react";
import { message, Table, Divider } from "antd";
import api from "../api";
import ButtonDrawer from "../components/buttonDrawer.jsx";

export default function UsuariosDelInquilino() {
  const [usuarios, setUsuarios] = useState([]);
  const [messageApi, contextHolder] = message.useMessage();

  const success = () => {
    messageApi.open({
      type: "success",
      content: "Usuario agregado correctamente"
    });
  };

  const warning = () => {
    messageApi.open({
      type: "error",
      content: "El usuario no se pudo agregar"
    });
  };

  useEffect(() => {
    const fetchUsuarios = async () => {
      try {
        const res = await api.get("http://localhost:3000/api/usuarios/inquilino", {
          withCredentials: true
        });
        setUsuarios(res.data);
      } catch (error) {
        console.error("Error obteniendo usuarios:", error);
      }
    };

    fetchUsuarios();
  }, []);

  const handleUserAdded = (newUser) => {
    try {
      setUsuarios((prev) => [...prev, newUser]);
      success();
    } catch (error) {
      console.error("Error al crear usuario", error);
      warning();
    }
  }

  const columns = [
    { title: "Nombre", dataIndex: "nombre" },
    { title: "Correo", dataIndex: "correo" },
    { title: "Rol", dataIndex: "rol" }
  ];

  return (
    <div>
      {contextHolder}
      <ButtonDrawer onUserAdded={handleUserAdded} />

      <Divider />

      <Table
        columns={columns}
        dataSource={usuarios}
        rowKey="id"
      />
    </div>
  );
}
