import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Button,
  Cascader,
  Col,
  Divider,
  Form,
  Input,
  InputNumber,
  message,
  Popconfirm,
  Row,
  Select,
  Space,
  Table,
} from "antd";
import api from "../api";
import ButtonDrawerForm from "../components/buttonDrawerForm";
import { formatMoney } from "../components/helperMoney";

const getCategoryOptions = (areas = [], categoriesByArea = {}) => {
  return areas
    .filter((area) => area?.id)
    .map((area) => {
      const categories = categoriesByArea[area.id] || [];

      return {
        value: area.id,
        label: area.nombre,
        children: categories
          .filter((cat) => cat?.id)
          .map((cat) => ({
            value: cat.id,
            label: cat.nombre,
          })),
      };
    })
    .filter((option) => option.children.length > 0);
};

export default function Productos() {
  const [productos, setProductos] = useState([]);
  const [unidades, setUnidades] = useState([]);
  const [categoryOptions, setCategoryOptions] = useState([]);
  const [searchValue, setSearchValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deletingAll, setDeletingAll] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();

  const fetchProductos = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/productos/inquilino", {
        withCredentials: true,
      });
      setProductos(res.data || []);
    } catch (error) {
      console.error(error);
      messageApi.error("No se pudieron cargar los productos");
    } finally {
      setLoading(false);
    }
  }, [messageApi]);

  const fetchFormOptions = useCallback(async () => {
    try {
      const [areasRes, unidadesRes] = await Promise.all([
        api.get("/areas", { withCredentials: true }),
        api.get("/unidades-medida", { withCredentials: true }),
      ]);

      const areas = areasRes.data || [];
      setUnidades(unidadesRes.data || []);

      const categoriesRequests = areas
        .filter((area) => area?.id)
        .map(async (area) => {
          const res = await api.get(`/categorias/area/${area.id}`, {
            withCredentials: true,
          });

          return { areaId: area.id, categories: res.data || [] };
        });

      const categoriesResults = await Promise.all(categoriesRequests);
      const categoriesByArea = categoriesResults.reduce((acc, current) => {
        acc[current.areaId] = current.categories;
        return acc;
      }, {});

      setCategoryOptions(getCategoryOptions(areas, categoriesByArea));
    } catch (error) {
      console.error(error);
      messageApi.error("No se pudieron cargar áreas, categorías o unidades");
    }
  }, [messageApi]);

  useEffect(() => {
    fetchProductos();
    fetchFormOptions();
  }, [fetchFormOptions, fetchProductos]);

  const handleProductDeleted = async (id) => {
    try {
      await api.delete(`/productos/${id}`, {
        withCredentials: true,
      });
      setProductos((prev) => prev.filter((product) => product.id !== id));
      messageApi.success("Producto eliminado");
    } catch (error) {
      console.error(error);
      messageApi.error("Error al eliminar el producto");
    }
  };

  const handleDeleteAllProducts = async () => {
    if (productos.length === 0) {
      messageApi.info("No hay productos para eliminar");
      return;
    }

    setDeletingAll(true);
    try {
      await Promise.all(
        productos.map((product) =>
          api.delete(`/productos/${product.id}`, {
            withCredentials: true,
          })
        )
      );

      setProductos([]);
      messageApi.success("Todos los productos fueron eliminados");
    } catch (error) {
      console.error(error);
      messageApi.error(
        "No fue posible eliminar todos los productos. Revisa permisos e intenta de nuevo"
      );
      await fetchProductos();
    } finally {
      setDeletingAll(false);
    }
  };

  const filteredProducts = useMemo(() => {
    const term = searchValue.trim().toLowerCase();

    if (!term) {
      return productos;
    }

    return productos.filter((product) => {
      return [
        product.sku,
        product.nombre,
        product.area,
        product.categoria,
        product.unidad_medida,
      ]
        .filter(Boolean)
        .some((value) => value.toString().toLowerCase().includes(term));
    });
  }, [productos, searchValue]);

  const columns = [
    {
      title: "SKU",
      dataIndex: "sku",
    },
    {
      title: "Nombre",
      dataIndex: "nombre",
    },
    {
      title: "Cantidad",
      dataIndex: "cantidad",
    },
    {
      title: "Unidad",
      dataIndex: "unidad_medida",
    },
    {
      title: "Categoría",
      dataIndex: "categoria",
    },
    {
      title: "Área",
      dataIndex: "area",
    },
    {
      title: "Costo",
      dataIndex: "costo_producto",
      render: formatMoney,
    },
    {
      title: "Venta",
      dataIndex: "precio_venta",
      render: formatMoney,
    },
    {
      title: "Ganancia",
      dataIndex: "ganancia",
      render: formatMoney,
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
      ),
    },
  ];

  return (
    <div>
      {contextHolder}

      <Space wrap>
        <ButtonDrawerForm
          buttonText="Agregar producto"
          drawerTitle="Nuevo producto"
          submitText={submitting ? "Guardando..." : "Crear"}
          onSubmit={async (values) => {
            const categoriaPath = values?.categoria_path || [];
            const id_categoria = categoriaPath[1];

            if (!id_categoria) {
              messageApi.error("Selecciona una categoría");
              throw new Error("Categoria no seleccionada");
            }

            const payload = {
              nombre: values.nombre,
              cantidad: values.cantidad,
              precio_venta: values.precio_venta,
              costo_producto: values.costo_producto,
              id_unidad_medida: values.id_unidad_medida,
              id_categoria,
              detalles: values.detalles || "",
            };

            setSubmitting(true);
            try {
              await api.post("/productos", payload, {
                withCredentials: true,
              });
              await fetchProductos();
              messageApi.success("Producto guardado correctamente");
            } catch (error) {
              console.error(error);
              messageApi.error("El producto no se pudo guardar");
              throw error;
            } finally {
              setSubmitting(false);
            }
          }}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="nombre"
                label="Nombre"
                rules={[{ required: true, message: "Captura el nombre" }]}
              >
                <Input placeholder="Ej. Café molido" />
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item
                name="categoria_path"
                label="Categoría"
                rules={[{ required: true, message: "Selecciona una categoría" }]}
              >
                <Cascader
                  options={categoryOptions}
                  placeholder="Selecciona área y categoría"
                  showSearch
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="cantidad"
                label="Cantidad"
                rules={[{ required: true, message: "Captura la cantidad" }]}
              >
                <InputNumber min={1} style={{ width: "100%" }} />
              </Form.Item>
            </Col>

            <Col span={8}>
              <Form.Item
                name="costo_producto"
                label="Costo"
                rules={[{ required: true, message: "Captura el costo" }]}
              >
                <InputNumber min={0} step={0.01} style={{ width: "100%" }} />
              </Form.Item>
            </Col>

            <Col span={8}>
              <Form.Item
                name="precio_venta"
                label="Precio de venta"
                rules={[{ required: true, message: "Captura el precio de venta" }]}
              >
                <InputNumber min={0} step={0.01} style={{ width: "100%" }} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="id_unidad_medida"
                label="Unidad de medida"
                rules={[{ required: true, message: "Selecciona una unidad" }]}
              >
                <Select
                  placeholder="Selecciona unidad"
                  options={unidades.map((um) => ({
                    label: um.descripcion,
                    value: um.id,
                  }))}
                />
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item name="detalles" label="Detalles (opcional)">
                <Input placeholder="Notas del producto" />
              </Form.Item>
            </Col>
          </Row>
        </ButtonDrawerForm>

        <Popconfirm
          title="¿Eliminar todos los productos?"
          description="Esta acción no se puede deshacer"
          onConfirm={handleDeleteAllProducts}
          okText="Sí, eliminar"
          cancelText="Cancelar"
        >
          <Button danger loading={deletingAll}>
            Eliminar todos
          </Button>
        </Popconfirm>
      </Space>

      <Divider />

      <Input
        allowClear
        value={searchValue}
        onChange={(event) => setSearchValue(event.target.value)}
        placeholder="Buscar por SKU, nombre, área, categoría o unidad"
      />

      <Divider />

      <Table
        loading={loading}
        columns={columns}
        dataSource={filteredProducts}
        rowKey="id"
        pagination={{ pageSize: 10, showSizeChanger: false }}
        scroll={{ x: "max-content", y: 420 }}
      />
    </div>
  );
}
