import { useState, useEffect } from "react";
import { Table } from "antd";
import api from "../api";

export default function UsuariosDelInquilino() {
  const [usuarios, setUsuarios] = useState([]);

  useEffect(() => {
    const fetchUsuarios = async () => {
      try {
        const res = await api.get("/usuarios/inquilino", {
          withCredentials: true
        });
        setUsuarios(res.data.usuarios);
      } catch (error) {
        console.error("Error obteniendo usuarios:", error);
      }
    };

    fetchUsuarios();
  }, []);

  const columns = [
    { title: "ID", dataIndex: "id" },
    { title: "Nombre", dataIndex: "nombre" },
    { title: "Correo", dataIndex: "correo" },
    { title: "Rol", dataIndex: "rol" }
  ];

  return (
    <Table
      columns={columns}
      dataSource={usuarios}
      rowKey="id"
    />
  );
}
