import { useState, useEffect } from "react";
import { Table } from "antd";
import api from "../api";
import ButtonDrawer from "../components/buttonDrawer.jsx";

export default function UsuariosDelInquilino() {
  const [usuarios, setUsuarios] = useState([]);

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

  const columns = [
    { title: "Nombre", dataIndex: "nombre" },
    { title: "Correo", dataIndex: "correo" },
    { title: "Rol", dataIndex: "rol" }
  ];

  return (
    <div>
      <ButtonDrawer />
      <Table
        columns={columns}
        dataSource={usuarios}
        rowKey="id"
      />
    </div>
  );
}
