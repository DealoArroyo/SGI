import { useState, useEffect, useRef } from "react";
import { SearchOutlined, DeleteOutlined } from '@ant-design/icons';
import { message, Table, Divider, Input, Space, Button, Popconfirm } from "antd";
import Highlighter from 'react-highlight-words';
import api from "../api";
import axios from "axios";
import ButtonDrawer from "../components/buttonDrawer.jsx";

export default function UsuariosDelInquilino() {
  const [usuarios, setUsuarios] = useState([]);
  const [messageApi, contextHolder] = message.useMessage();
  const [searchText, setSearchText] = useState('');
  const [searchedColumn, setSearchedColumn] = useState('');
  const [usuarioActual, setUsuarioActual] = useState(null);
  const searchInput = useRef(null);

  const handleSearch = (selectedKeys, confirm, dataIndex) => {
    confirm();
    setSearchText(selectedKeys[0]);
    setSearchedColumn(dataIndex);
  };

  const handleReset = clearFilters => {
    clearFilters();
    setSearchText('');
  };

  const getColumnSearchProps = dataIndex => ({
    filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters, close }) => (
      <div style={{ padding: 8 }} onKeyDown={e => e.stopPropagation()}>
        <Input
          ref={searchInput}
          placeholder={`Buscar ${dataIndex}`}
          value={selectedKeys[0]}
          onChange={e => setSelectedKeys(e.target.value ? [e.target.value] : [])}
          onPressEnter={() => handleSearch(selectedKeys, confirm, dataIndex)}
          style={{ marginBottom: 8, display: 'block' }}
        />
        <Space>
          <Button
            type="primary"
            onClick={() => handleSearch(selectedKeys, confirm, dataIndex)}
            icon={<SearchOutlined />}
            size="small"
            style={{ width: 90 }}
          >
            Buscar
          </Button>
          <Button
            onClick={() => clearFilters && handleReset(clearFilters)}
            size="small"
            style={{ width: 90 }}
          >
            Borrar
          </Button>
          <Button
            type="link"
            size="small"
            onClick={() => {
              confirm({ closeDropdown: false });
              setSearchText(selectedKeys[0]);
              setSearchedColumn(dataIndex);
            }}
          >
            Filtrar
          </Button>
          <Button type="link" size="small" onClick={close}>
            Cancelar
          </Button>
        </Space>
      </div>
    ),
    filterIcon: filtered => <SearchOutlined style={{ color: filtered ? '#1677ff' : undefined }} />,
    onFilter: (value, record) =>
      record[dataIndex]?.toString().toLowerCase().includes(value.toLowerCase()),
    filterDropdownProps: {
      onOpenChange(open) {
        if (open) {
          setTimeout(() => searchInput.current?.select(), 100);
        }
      },
    },
    render: text =>
      searchedColumn === dataIndex ? (
        <Highlighter
          highlightStyle={{ backgroundColor: '#ffc069', padding: 0 }}
          searchWords={[searchText]}
          autoEscape
          textToHighlight={text ? text.toString() : ''}
        />
      ) : (
        text
      ),
  });

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

    const fetchPerfil = async () => {
      try {
        const res = await api.get("http://localhost:3000/api/auth/perfil", {
          withCredentials: true
        });
        setUsuarioActual(res.data.user);   // ← Guardar usuario actual
      } catch (error) {
        console.error("Error obteniendo perfil:", error);
      }
    };

    fetchUsuarios();
    fetchPerfil();
  }, []);

  const handleUserAdded = (newUser) => {
    try {
      setUsuarios(prev => [...prev, newUser]);
      success();
    } catch (error) {
      console.error("Error al crear usuario", error);
      warning();
    }
  };

  // 🔥 NUEVO: eliminar usuario del backend + quitarlo de la tabla
  const handleUserDeleted = async (id) => {
    try {
      await axios.delete(`http://localhost:3000/api/usuarios/${id}`, {
        withCredentials: true
      });

      setUsuarios(prev => prev.filter(u => u.id !== id));
      message.success("Usuario eliminado");
    } catch (error) {
      console.error(error);
      message.error("Error al eliminar el usuario");
    }
  };

  // 🔥 Aquí agregamos la columna con el botón de eliminar
  const columns = [
    { 
      title: "Nombre",
      dataIndex: "nombre",
      ...getColumnSearchProps('nombre'),
    },
    { 
      title: "Correo", 
      dataIndex: "correo",
      ...getColumnSearchProps('correo'),
    },
    {
      title: "Rol",
      dataIndex: "rol",
      filters: [
        { text: 'Administrador', value: 'Administrador' },
        { text: 'Usuario', value: 'Usuario' }
      ],
      onFilter: (value, record) => record.rol.indexOf(value) === 0,
    },
    {
      title: "Acciones",
      dataIndex: "acciones",
      render: (_, record) => {
        if (!usuarioActual) return null; // mientras carga

        if (record.id === usuarioActual.id) {
          return <span style={{ opacity: 0.5 }}></span>;
        }

        return (
          <Popconfirm
            title="¿Eliminar usuario?"
            onConfirm={() => handleUserDeleted(record.id)}
          >
            <Button danger icon={<DeleteOutlined />}>Eliminar</Button>
          </Popconfirm>
        );
      }
    }
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
