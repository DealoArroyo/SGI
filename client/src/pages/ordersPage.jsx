import {
  Button,
  Card,
  Col,
  Descriptions,
  Divider,
  Form,
  Input,
  InputNumber,
  message,
  Modal,
  Popconfirm,
  Row,
  Select,
  Space,
  Statistic,
  Table,
  Tag,
  Typography,
} from "antd";
import { useCallback, useEffect, useMemo, useState } from "react";
import ButtonDrawerForm from "../components/buttonDrawerForm";
import api from "../api";
import { formatMoney } from "../components/helperMoney";

const { Search } = Input;

const STATUS_LABELS = {
  borrador: "Borrador",
  confirmado: "Confirmado",
  entregado: "Entregado",
  cancelado: "Cancelado",
};

const STATUS_COLORS = {
  borrador: "orange",
  confirmado: "blue",
  entregado: "green",
  cancelado: "red",
};

const normalizeNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

function PedidoFormFields({ clientes, productos }) {
  const form = Form.useFormInstance();
  const items = Form.useWatch("items", form) || [];

  const subtotalPreview = items.reduce((acc, item) => {
    const cantidad = normalizeNumber(item?.cantidad);
    const precioUnitario = normalizeNumber(item?.precio_unitario);
    return acc + cantidad * precioUnitario;
  }, 0);

  const impuestoPreview = subtotalPreview * 0.16;
  const totalPreview = subtotalPreview + impuestoPreview;

  return (
    <>
      <Row gutter={16}>
        <Col xs={24} md={12}>
          <Form.Item
            name="cliente_id"
            label="Cliente"
            rules={[{ required: true, message: "Selecciona un cliente" }]}
          >
            <Select
              showSearch
              optionFilterProp="label"
              placeholder="Selecciona cliente"
              options={clientes.map((cliente) => ({
                label: `${cliente.nombre} (${cliente.correo || "sin correo"})`,
                value: cliente.id,
              }))}
            />
          </Form.Item>
        </Col>

        <Col xs={24} md={12}>
          <Form.Item name="notas" label="Notas (opcional)">
            <Input placeholder="Notas internas del pedido" />
          </Form.Item>
        </Col>
      </Row>

      <Typography.Title level={5}>Items del pedido</Typography.Title>

      <Form.List name="items" initialValue={[{ cantidad: 1 }]}> 
        {(fields, { add, remove }) => (
          <Space direction="vertical" style={{ width: "100%" }} size="middle">
            {fields.map(({ key, name, ...restField }) => (
              <Row gutter={12} key={key} align="middle">
                <Col xs={24} md={10}>
                  <Form.Item
                    {...restField}
                    name={[name, "producto_id"]}
                    label="Producto"
                    rules={[{ required: true, message: "Selecciona producto" }]}
                  >
                    <Select
                      showSearch
                      optionFilterProp="label"
                      placeholder="Selecciona producto"
                      options={productos.map((product) => ({
                        label: `${product.sku} - ${product.nombre}`,
                        value: product.id,
                      }))}
                      onChange={(selectedProductId) => {
                        const selectedProduct = productos.find(
                          (product) => product.id === selectedProductId
                        );

                        if (!selectedProduct) return;

                        const currentItems = form.getFieldValue("items") || [];
                        const nextItems = [...currentItems];
                        nextItems[name] = {
                          ...nextItems[name],
                          precio_unitario: normalizeNumber(selectedProduct.precio_venta),
                          cantidad: nextItems[name]?.cantidad || 1,
                        };

                        form.setFieldsValue({ items: nextItems });
                      }}
                    />
                  </Form.Item>
                </Col>

                <Col xs={12} md={5}>
                  <Form.Item
                    {...restField}
                    name={[name, "cantidad"]}
                    label="Cantidad"
                    rules={[{ required: true, message: "Captura cantidad" }]}
                  >
                    <InputNumber min={1} style={{ width: "100%" }} />
                  </Form.Item>
                </Col>

                <Col xs={12} md={5}>
                  <Form.Item
                    {...restField}
                    name={[name, "precio_unitario"]}
                    label="Precio"
                    rules={[{ required: true, message: "Captura precio" }]}
                  >
                    <InputNumber min={0} step={0.01} style={{ width: "100%" }} />
                  </Form.Item>
                </Col>

                <Col xs={24} md={4}>
                  <Button danger onClick={() => remove(name)} block>
                    Quitar
                  </Button>
                </Col>
              </Row>
            ))}

            <Button onClick={() => add({ cantidad: 1 })}>
              Agregar item
            </Button>
          </Space>
        )}
      </Form.List>

      <Divider style={{ margin: "16px 0" }} />

      <Space size="large" wrap>
        <Typography.Text>Subtotal: {formatMoney(subtotalPreview)}</Typography.Text>
        <Typography.Text>Impuesto (16%): {formatMoney(impuestoPreview)}</Typography.Text>
        <Typography.Text strong>Total estimado: {formatMoney(totalPreview)}</Typography.Text>
      </Space>
    </>
  );
}

export default function PedidoList() {
  const [pedidos, setPedidos] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [productos, setProductos] = useState([]);

  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState("todos");
  const [loading, setLoading] = useState(false);

  const [confirmingIds, setConfirmingIds] = useState(new Set());
  const [deliveringIds, setDeliveringIds] = useState(new Set());
  const [cancelingIds, setCancelingIds] = useState(new Set());

  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [pedidoDetalle, setPedidoDetalle] = useState(null);

  const [messageApi, contextHolder] = message.useMessage();

  const fetchPedidos = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get("/pedidos", { withCredentials: true });
      setPedidos(res.data || []);
    } catch (error) {
      console.error(error);
      messageApi.error("Error al cargar pedidos");
    } finally {
      setLoading(false);
    }
  }, [messageApi]);

  const fetchCatalogos = useCallback(async () => {
    try {
      const [clientesRes, productosRes] = await Promise.all([
        api.get("/clientes", { withCredentials: true }),
        api.get("/productos/inquilino", { withCredentials: true }),
      ]);

      setClientes(clientesRes.data || []);
      setProductos(productosRes.data || []);
    } catch (error) {
      console.error(error);
      messageApi.error("No se pudieron cargar clientes/productos");
    }
  }, [messageApi]);

  useEffect(() => {
    fetchPedidos();
    fetchCatalogos();
  }, [fetchCatalogos, fetchPedidos]);

  const openDetail = async (id) => {
    setDetailOpen(true);
    setDetailLoading(true);

    try {
      const res = await api.get(`/pedidos/${id}`, {
        withCredentials: true,
      });
      setPedidoDetalle(res.data);
    } catch (error) {
      console.error(error);
      messageApi.error("No se pudo cargar el detalle del pedido");
      setDetailOpen(false);
    } finally {
      setDetailLoading(false);
    }
  };

  const confirmarPedido = async (id) => {
    try {
      setConfirmingIds((prev) => new Set(prev).add(id));
      await api.post(`/pedidos/${id}/confirmar`, {}, { withCredentials: true });
      messageApi.success("Pedido confirmado");
      await fetchPedidos();
    } catch (error) {
      console.error(error);
      const msg = error?.response?.data?.error || "Error al confirmar pedido";
      messageApi.error(msg);
    } finally {
      setConfirmingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  const cancelarPedido = async (id) => {
    try {
      setCancelingIds((prev) => new Set(prev).add(id));
      await api.delete(`/pedidos/${id}`, { withCredentials: true });
      messageApi.success("Pedido cancelado");
      await fetchPedidos();
    } catch (error) {
      console.error(error);
      const msg = error?.response?.data?.error || "Error al cancelar pedido";
      messageApi.error(msg);
    } finally {
      setCancelingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  const entregarPedido = async (id) => {
    try {
      setDeliveringIds((prev) => new Set(prev).add(id));
      await api.post(`/pedidos/${id}/entregar`, {}, { withCredentials: true });
      messageApi.success("Pedido entregado");
      await fetchPedidos();
    } catch (error) {
      console.error(error);
      const msg = error?.response?.data?.error || "Error al entregar pedido";
      messageApi.error(msg);
    } finally {
      setDeliveringIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  const resumen = useMemo(() => {
    const initial = {
      total: 0,
      borrador: 0,
      confirmado: 0,
      entregado: 0,
      cancelado: 0,
    };

    return pedidos.reduce((acc, pedido) => {
      acc.total += 1;
      acc[pedido.estado] = (acc[pedido.estado] || 0) + 1;
      return acc;
    }, initial);
  }, [pedidos]);

  const pedidosFiltrados = useMemo(() => {
    const qLower = q.trim().toLowerCase();

    return pedidos.filter((pedido) => {
      const matchStatus =
        statusFilter === "todos" ? true : pedido.estado === statusFilter;

      if (!matchStatus) return false;
      if (!qLower) return true;

      const folio = `${pedido.folio || ""}`.toLowerCase();
      const cliente = `${pedido.cliente || pedido.cliente_id || ""}`.toLowerCase();

      return folio.includes(qLower) || cliente.includes(qLower);
    });
  }, [pedidos, q, statusFilter]);

  const columns = [
    {
      title: "Folio",
      dataIndex: "folio",
      key: "folio",
    },
    {
      title: "Cliente",
      key: "cliente",
      render: (_, record) => record.cliente || record.cliente_id || "—",
    },
    {
      title: "Fecha",
      dataIndex: "fecha",
      key: "fecha",
      render: (fecha) => {
        if (!fecha) return "—";
        try {
          return new Date(fecha).toLocaleString("es-MX");
        } catch {
          return fecha;
        }
      },
    },
    {
      title: "Total",
      dataIndex: "total",
      key: "total",
      render: (total) => formatMoney(total),
    },
    {
      title: "Estado",
      dataIndex: "estado",
      key: "estado",
      render: (estado) => (
        <Tag color={STATUS_COLORS[estado] || "default"}>
          {STATUS_LABELS[estado] || estado}
        </Tag>
      ),
    },
    {
      title: "Acciones",
      key: "acciones",
      render: (_, record) => {
        const canConfirm = record.estado === "borrador";
        const canDeliver = record.estado === "confirmado";
        const canCancel = ["borrador", "confirmado"].includes(record.estado);

        return (
          <Space>
            <Button onClick={() => openDetail(record.id)}>Ver</Button>

            <Button
              type="primary"
              disabled={!canConfirm}
              loading={confirmingIds.has(record.id)}
              onClick={() => confirmarPedido(record.id)}
            >
              Confirmar
            </Button>

            <Button
              type="dashed"
              disabled={!canDeliver}
              loading={deliveringIds.has(record.id)}
              onClick={() => entregarPedido(record.id)}
            >
              Entregar
            </Button>

            <Popconfirm
              title="¿Cancelar pedido?"
              description="Liberará reservas de stock"
              onConfirm={() => cancelarPedido(record.id)}
              disabled={!canCancel}
            >
              <Button
                danger
                disabled={!canCancel}
                loading={cancelingIds.has(record.id)}
              >
                Cancelar
              </Button>
            </Popconfirm>
          </Space>
        );
      },
    },
  ];

  return (
    <div>
      {contextHolder}

      <Typography.Title level={3} style={{ marginTop: 0 }}>
        Pedidos
      </Typography.Title>

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={12} md={6}>
          <Card>
            <Statistic title="Total" value={resumen.total} />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card>
            <Statistic title="Borradores" value={resumen.borrador} />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card>
            <Statistic title="Confirmados" value={resumen.confirmado} />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card>
            <Statistic title="Cancelados" value={resumen.cancelado} />
          </Card>
        </Col>
      </Row>

      <Space wrap style={{ marginBottom: 12 }}>
        <Search
          placeholder="Buscar por folio o cliente"
          allowClear
          enterButton
          onSearch={(value) => setQ(value)}
          onChange={(event) => setQ(event.target.value)}
          value={q}
          style={{ width: 340 }}
        />

        <Select
          style={{ width: 180 }}
          value={statusFilter}
          onChange={setStatusFilter}
          options={[
            { label: "Todos", value: "todos" },
            { label: "Borrador", value: "borrador" },
            { label: "Confirmado", value: "confirmado" },
            { label: "Entregado", value: "entregado" },
            { label: "Cancelado", value: "cancelado" },
          ]}
        />

        <ButtonDrawerForm
          buttonText="Nuevo pedido"
          drawerTitle="Nuevo pedido"
          submitText="Crear pedido"
          onSubmit={async (values) => {
            const items = (values.items || [])
              .filter((item) => item?.producto_id && normalizeNumber(item?.cantidad) > 0)
              .map((item) => ({
                producto_id: item.producto_id,
                cantidad: normalizeNumber(item.cantidad),
                precio_unitario: normalizeNumber(item.precio_unitario),
              }));

            if (!values.cliente_id || items.length === 0) {
              messageApi.error("Debes seleccionar cliente y al menos un item");
              throw new Error("Pedido incompleto");
            }

            try {
              await api.post(
                "/pedidos",
                {
                  cliente_id: values.cliente_id,
                  notas: values.notas,
                  items,
                },
                { withCredentials: true }
              );

              messageApi.success("Pedido creado correctamente");
              await fetchPedidos();
            } catch (error) {
              console.error(error);
              const msg = error?.response?.data?.error || "No se pudo crear el pedido";
              messageApi.error(msg);
              throw error;
            }
          }}
        >
          <PedidoFormFields clientes={clientes} productos={productos} />
        </ButtonDrawerForm>
      </Space>

      <Divider />

      <Table
        rowKey="id"
        columns={columns}
        dataSource={pedidosFiltrados}
        loading={loading}
        pagination={{ pageSize: 10 }}
        scroll={{ x: "max-content" }}
      />

      <Modal
        title={`Detalle de pedido ${pedidoDetalle?.folio ? `(${pedidoDetalle.folio})` : ""}`}
        open={detailOpen}
        onCancel={() => {
          setDetailOpen(false);
          setPedidoDetalle(null);
        }}
        footer={null}
        width={900}
      >
        <Card loading={detailLoading} bordered={false}>
          {pedidoDetalle && (
            <Space direction="vertical" style={{ width: "100%" }} size="middle">
              <Descriptions bordered size="small" column={2}>
                <Descriptions.Item label="Folio">{pedidoDetalle.folio || "-"}</Descriptions.Item>
                <Descriptions.Item label="Estado">
                  <Tag color={STATUS_COLORS[pedidoDetalle.estado] || "default"}>
                    {STATUS_LABELS[pedidoDetalle.estado] || pedidoDetalle.estado}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="Cliente ID">
                  {pedidoDetalle.cliente_nombre || pedidoDetalle.cliente_id || "-"}
                </Descriptions.Item>
                <Descriptions.Item label="Creado por">
                  {pedidoDetalle.usuario_creador_nombre ||
                    pedidoDetalle.usuario_creador_id ||
                    "-"}
                </Descriptions.Item>
                <Descriptions.Item label="Fecha de creación">
                  {pedidoDetalle.fecha_creacion
                    ? new Date(pedidoDetalle.fecha_creacion).toLocaleString("es-MX")
                    : pedidoDetalle.fecha
                      ? new Date(pedidoDetalle.fecha).toLocaleString("es-MX")
                      : "-"}
                </Descriptions.Item>
                <Descriptions.Item label="Entregado por">
                  {pedidoDetalle.usuario_entrega_nombre ||
                    pedidoDetalle.usuario_entrega_id ||
                    "-"}
                </Descriptions.Item>
                <Descriptions.Item label="Fecha de entrega">
                  {pedidoDetalle.fecha_entrega
                    ? new Date(pedidoDetalle.fecha_entrega).toLocaleString("es-MX")
                    : "-"}
                </Descriptions.Item>
                <Descriptions.Item label="Subtotal">
                  {formatMoney(pedidoDetalle.subtotal)}
                </Descriptions.Item>
                <Descriptions.Item label="Impuesto">
                  {formatMoney(pedidoDetalle.impuesto)}
                </Descriptions.Item>
                <Descriptions.Item label="Total">
                  {formatMoney(pedidoDetalle.total)}
                </Descriptions.Item>
                <Descriptions.Item label="Notas">
                  {pedidoDetalle.notas || "Sin notas"}
                </Descriptions.Item>
              </Descriptions>

              <Table
                rowKey="id"
                size="small"
                pagination={false}
                dataSource={pedidoDetalle.items || []}
                columns={[
                  { title: "Producto", dataIndex: "nombre" },
                  { title: "Cantidad", dataIndex: "cantidad" },
                  {
                    title: "Precio unitario",
                    dataIndex: "precio_unitario",
                    render: (value) => formatMoney(value),
                  },
                  {
                    title: "Subtotal",
                    dataIndex: "subtotal",
                    render: (value) => formatMoney(value),
                  },
                ]}
              />
            </Space>
          )}
        </Card>
      </Modal>
    </div>
  );
}
