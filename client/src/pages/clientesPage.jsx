import { useEffect, useState, useRef } from "react";
import {
  Table,
  Button,
  Popconfirm,
  Divider,
  Input,
  Space,
  message,
  Row,
  Col,
  Form
} from "antd";
import { SearchOutlined, DeleteOutlined } from "@ant-design/icons";
import Highlighter from "react-highlight-words";
import api from "../api";
import ButtonDrawerForm from "../components/buttonDrawerForm";

export default function ClientesPage() {
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [messageApi, contextHolder] = message.useMessage();
  const [searchedColumn, setSearchedColumn] = useState("");
  const searchInput = useRef(null);

  useEffect(() => {
    obtenerClientes();
  }, []);

  const obtenerClientes = async () => {
    try {
      setLoading(true);
      const res = await api.get("/clientes", { withCredentials: true });
      setClientes(res.data);
    } catch {
      message.error("Error al cargar clientes");
    } finally {
      setLoading(false);
    }
  };

  const eliminarCliente = async (id) => {
    try {
      await api.delete(`/clientes/${id}`, { withCredentials: true });
      message.success("Cliente removido");
      obtenerClientes();
    } catch {
      message.error("No se pudo remover");
    }
  };

  const success = () =>
    messageApi.success("Cliente agregado correctamente");

  const warning = () =>
    messageApi.warning("Hubo un problema al agregar el cliente");

  const getColumnSearchProps = (dataIndex) => ({
    filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => (
      <div style={{ padding: 8 }}>
        <Input
          ref={searchInput}
          placeholder={`Buscar ${dataIndex}`}
          value={selectedKeys[0]}
          onChange={(e) =>
            setSelectedKeys(e.target.value ? [e.target.value] : [])
          }
          onPressEnter={() => handleSearch(selectedKeys, confirm, dataIndex)}
          style={{ marginBottom: 8 }}
        />
        <Space>
          <Button
            type="primary"
            size="small"
            icon={<SearchOutlined />}
            onClick={() => handleSearch(selectedKeys, confirm, dataIndex)}
          >
            Buscar
          </Button>
          <Button size="small" onClick={() => handleReset(clearFilters)}>
            Reset
          </Button>
        </Space>
      </div>
    ),
    filterIcon: (filtered) => (
      <SearchOutlined style={{ color: filtered ? "#1677ff" : undefined }} />
    ),
    onFilter: (value, record) =>
      record[dataIndex]?.toLowerCase().includes(value.toLowerCase()),
    render: (text) =>
      searchedColumn === dataIndex ? (
        <Highlighter
          highlightStyle={{ backgroundColor: "#ffc069", padding: 0 }}
          searchWords={[searchText]}
          autoEscape
          textToHighlight={text || ""}
        />
      ) : (
        text
      ),
  });

  const handleSearch = (selectedKeys, confirm, dataIndex) => {
    confirm();
    setSearchText(selectedKeys[0]);
    setSearchedColumn(dataIndex);
  };

  const handleReset = (clearFilters) => {
    clearFilters();
    setSearchText("");
  };

  const columns = [
    {
      title: "Nombre",
      dataIndex: "nombre",
      key: "nombre",
      ...getColumnSearchProps("nombre"),
    },
    {
      title: "Correo",
      dataIndex: "correo",
      key: "correo",
      ...getColumnSearchProps("correo"),
    },
    {
      title: "Teléfono",
      dataIndex: "telefono",
      key: "telefono",
      ...getColumnSearchProps("telefono"),
    },
    {
      title: "Acciones",
      render: (_, record) => (
        <Popconfirm
          title="¿Borrar cliente?"
          onConfirm={() => eliminarCliente(record.id)}
          okText="Sí"
          cancelText="No"
        >
          <Button danger icon={<DeleteOutlined />}>Eliminar</Button>
        </Popconfirm>
      ),
    },
  ];

  return (
    <>
      {contextHolder}  
      
      <ButtonDrawerForm
        buttonText="Agregar cliente"
        drawerTitle="Nuevo cliente"
        submitText="Crear"
        onSubmit={async (values) => {
            try {
                await api.post("/clientes", values, {
                    withCredentials: true
                });
                await obtenerClientes();
                success();
            } catch (error) {
                console.error(error);
                warning();
            }
        }}
        >
            <Row gutter={16}>
                <Col span={12}>
                    <Form.Item
                        name="nombre"
                        label="Nombre"
                        rules={[{ requried: true }]}
                    >
                        <Input />
                    </Form.Item>
                </Col>

                <Col span={12}>
                    <Form.Item
                        name="correo"
                        label="Correo"
                        rules={[{ requried: true }]}
                    >
                        <Input />
                    </Form.Item>
                </Col>
            </Row>

            <Row gutter={16}>
                <Col span={12}>
                    <Form.Item
                        name="telefono"
                        label="Telefono"
                        rules={[{ requried: true }]}
                    >
                        <Input />
                    </Form.Item>
                </Col>
            </Row>
        </ButtonDrawerForm>

      <Divider />

      <Table
        rowKey="id"
        columns={columns}
        dataSource={clientes}
        loading={loading}
        bordered
      />
    </>
  );
}
