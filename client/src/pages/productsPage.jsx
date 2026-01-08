import { useState, useEffect, useRef } from "react";
import { SearchOutlined, DeleteOutlined } from "@ant-design/icons";
import {
  message,
  Table,
  Divider,
  Input,
  Space,
  Button,
  Popconfirm,
  Row,
  Col,
  Form,
  Select
} from "antd";
import Highlighter from "react-highlight-words";
import api from "../api";
import ButtonDrawerForm from "../components/buttonDrawerForm";

const { Option } = Select;

export default function Productos() {
  const [productos, setProductos] = useState([]);
  const [unidades, setUnidades] = useState([]);
  const [messageApi, contextHolder] = message.useMessage();
  const [searchText, setSearchText] = useState("");
  const [searchedColumn, setSearchedColumn] = useState("");
  const searchInput = useRef(null);

  /* =========================
     Mensajes
  ========================= */
  const success = () =>
    messageApi.success("Producto agregado correctamente");

  const warning = () =>
    messageApi.error("El producto no se pudo agregar");

  /* =========================
     Fetchs
  ========================= */
  const fetchProductos = async () => {
    const res = await api.get("/productos/inquilino", {
      withCredentials: true
    });
    setProductos(res.data);
  };

  const fetchUnidades = async () => {
    const res = await api.get("/unidades-medida", {
      withCredentials: true
    });
    console.log("Unidades recibidas:", res.data);
    setUnidades(res.data);
  };

  useEffect(() => {
    fetchProductos();
    fetchUnidades();
  }, []);

  /* =========================
     Eliminar
  ========================= */
  const handleProductDeleted = async (id) => {
    try {
      await api.delete(`/productos/${id}`, {
        withCredentials: true
      });
      await fetchProductos();
      message.success("Producto eliminado");
    } catch (error) {
      console.error(error);
      message.error("Error al eliminar el producto");
    }
  };

  /* =========================
     Buscador
  ========================= */
  const handleSearch = (selectedKeys, confirm, dataIndex) => {
    confirm();
    setSearchText(selectedKeys[0]);
    setSearchedColumn(dataIndex);
  };

  const getColumnSearchProps = (dataIndex) => ({
    filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, close }) => (
      <div style={{ padding: 8 }}>
        <Input
          ref={searchInput}
          placeholder={`Buscar ${dataIndex}`}
          value={selectedKeys[0]}
          onChange={(e) =>
            setSelectedKeys(e.target.value ? [e.target.value] : [])
          }
          onPressEnter={() =>
            handleSearch(selectedKeys, confirm, dataIndex)
          }
          style={{ marginBottom: 8 }}
        />
        <Space>
          <Button
            type="primary"
            size="small"
            icon={<SearchOutlined />}
            onClick={() =>
              handleSearch(selectedKeys, confirm, dataIndex)
            }
          >
            Buscar
          </Button>
          <Button size="small" onClick={close}>
            Cancelar
          </Button>
        </Space>
      </div>
    ),
    filterIcon: (filtered) => (
      <SearchOutlined
        style={{ color: filtered ? "#1677ff" : undefined }}
      />
    ),
    onFilter: (value, record) =>
      record[dataIndex]
        ?.toString()
        .toLowerCase()
        .includes(value.toLowerCase()),
    render: (text) =>
      searchedColumn === dataIndex ? (
        <Highlighter
          highlightStyle={{ backgroundColor: "#ffc069", padding: 0 }}
          searchWords={[searchText]}
          autoEscape
          textToHighlight={text?.toString() || ""}
        />
      ) : (
        text
      )
  });

  /* =========================
     Columnas
  ========================= */
  const columns = [
    {
      title: "Nombre",
      dataIndex: "nombre",
      ...getColumnSearchProps("nombre")
    },
    {
      title: "Detalles",
      dataIndex: "detalles"
    },
    {
      title: "Precio Venta",
      dataIndex: "precio_venta"
    },
    {
      title: "Costo",
      dataIndex: "costo_producto"
    },
    {
      title: "Unidad de Medida",
      dataIndex: "unidad_medida"
    },
    {
      title: "Acciones",
      render: (_, record) => (
        <Popconfirm
          title="¿Eliminar producto?"
          onConfirm={() => handleProductDeleted(record.id)}
        >
          <Button danger>Eliminar</Button>
        </Popconfirm>
      )
    }
  ];

  /* =========================
     Render
  ========================= */
  return (
    <div>
      {contextHolder}

      <ButtonDrawerForm
        buttonText="Agregar producto"
        drawerTitle="Nuevo producto"
        submitText="Crear"
        onSubmit={async (values) => {
          try {
            await api.post("/productos", values, {
              withCredentials: true
            });
            await fetchProductos(); // 🔥 CLAVE
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
              rules={[{ required: true }]}
            >
              <Input />
            </Form.Item>
          </Col>

          <Col span={12}>
            <Form.Item
              name="precio_venta"
              label="Precio de Venta"
              rules={[{ required: true }]}
            >
              <Input />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="costo_producto"
              label="Costo"
              rules={[{ required: true }]}
            >
              <Input />
            </Form.Item>
          </Col>

          <Col span={12}>
            <Form.Item
              name="id_unidad_medida"
              label="Unidad de Medida"
              rules={[{ required: true }]}
            >
              <Select placeholder="Selecciona unidad">
                {unidades.map((um) => (
                    <Select.Option key={um.id} value={um.id}>
                    {um.descripcion}
                    </Select.Option>
                ))}
                </Select>
            </Form.Item>
          </Col>
        </Row>

        <Form.Item
          name="detalles"
          label="Detalles"
          rules={[{ required: true }]}
        >
          <Input />
        </Form.Item>
      </ButtonDrawerForm>

      <Divider />

      <Table
        columns={columns}
        dataSource={productos}
        rowKey="id"
      />
    </div>
  );
}
