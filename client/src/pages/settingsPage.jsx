import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Button,
  Card,
  Col,
  Descriptions,
  Divider,
  Input,
  InputNumber,
  List,
  message,
  Popconfirm,
  Row,
  Space,
  Statistic,
  Select,
  Switch,
  Tag,
  Typography,
} from "antd";
import { useNavigate } from "react-router-dom";
import api from "../api";
import { formatMoney } from "../components/helperMoney";
import { useThemeMode } from "../context/themeContext.jsx";

const LOW_STOCK_KEY = "sgi_low_stock_limit";
const NAV_MODE_KEY = "sgi_nav_mode";

const toNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

export default function Configuracion() {
  const [messageApi, contextHolder] = message.useMessage();
  const { isDarkMode, toggleTheme } = useThemeMode();
  const [loading, setLoading] = useState(true);
  const [cleaningNoStock, setCleaningNoStock] = useState(false);
  const [cleaningAll, setCleaningAll] = useState(false);

  const [perfil, setPerfil] = useState(null);
  const [areas, setAreas] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [productos, setProductos] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [twoFactorSetup, setTwoFactorSetup] = useState(null);
  const [otpSetupCode, setOtpSetupCode] = useState("");
  const [otpDisableCode, setOtpDisableCode] = useState("");
  const [processing2FA, setProcessing2FA] = useState(false);
  const [navMode, setNavMode] = useState(() => {
    const stored = localStorage.getItem(NAV_MODE_KEY);
    return stored === "recortado" ? "recortado" : "normal";
  });

  const [stockMinimo, setStockMinimo] = useState(() => {
    const stored = localStorage.getItem(LOW_STOCK_KEY);
    const parsed = Number(stored);
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : 5;
  });

  const navigate = useNavigate();

  const handleNavModeChange = (value) => {
    const next = value === "recortado" ? "recortado" : "normal";
    setNavMode(next);
    localStorage.setItem(NAV_MODE_KEY, next);
    window.dispatchEvent(new Event("sgi-nav-mode-change"));
  };

  const fetchConfigData = useCallback(async () => {
    setLoading(true);

    try {
      const [perfilRes, areasRes, productosRes, usuariosRes, twoFaRes] = await Promise.all([
        api.get("/auth/perfil", { withCredentials: true }),
        api.get("/areas", { withCredentials: true }),
        api.get("/productos/inquilino", { withCredentials: true }),
        api
          .get("/usuarios/inquilino", { withCredentials: true })
          .catch(() => ({ data: [] })),
        api
          .get("/auth/2fa/status", { withCredentials: true })
          .catch(() => ({ data: { enabled: false } })),
      ]);

      const areasData = areasRes.data || [];
      const categoriasPromises = areasData.map((area) =>
        api
          .get(`/categorias/area/${area.id}`, { withCredentials: true })
          .then((res) => res.data || [])
          .catch(() => [])
      );

      const categoriasPorArea = await Promise.all(categoriasPromises);

      setPerfil(perfilRes.data?.user || null);
      setAreas(areasData);
      setCategorias(categoriasPorArea.flat());
      setProductos(productosRes.data || []);
      setUsuarios(usuariosRes.data || []);
      setTwoFactorEnabled(Boolean(twoFaRes?.data?.enabled));
    } catch (error) {
      console.error(error);
      messageApi.error("No se pudo cargar la configuración");
    } finally {
      setLoading(false);
    }
  }, [messageApi]);

  useEffect(() => {
    fetchConfigData();
  }, [fetchConfigData]);

  useEffect(() => {
    localStorage.setItem(LOW_STOCK_KEY, String(stockMinimo));
  }, [stockMinimo]);

  const totales = useMemo(() => {
    const totalStock = productos.reduce(
      (acc, product) => acc + toNumber(product.cantidad),
      0
    );

    const costoInventario = productos.reduce(
      (acc, product) =>
        acc + toNumber(product.cantidad) * toNumber(product.costo_producto),
      0
    );

    const valorVentaInventario = productos.reduce(
      (acc, product) =>
        acc + toNumber(product.cantidad) * toNumber(product.precio_venta),
      0
    );

    return {
      totalProductos: productos.length,
      totalStock,
      costoInventario,
      valorVentaInventario,
      utilidadPotencial: valorVentaInventario - costoInventario,
    };
  }, [productos]);

  const productosStockBajo = useMemo(
    () => productos.filter((p) => toNumber(p.cantidad) <= stockMinimo),
    [productos, stockMinimo]
  );

  const exportarProductosCsv = () => {
    if (productos.length === 0) {
      messageApi.info("No hay productos para exportar");
      return;
    }

    const headers = [
      "id",
      "sku",
      "nombre",
      "area",
      "categoria",
      "unidad_medida",
      "cantidad",
      "costo_producto",
      "precio_venta",
      "ganancia",
    ];

    const escapeCsv = (value) => {
      const text = `${value ?? ""}`;
      if (text.includes('"') || text.includes(",") || text.includes("\n")) {
        return `"${text.replaceAll('"', '""')}"`;
      }
      return text;
    };

    const rows = productos.map((product) =>
      [
        product.id,
        product.sku,
        product.nombre,
        product.area,
        product.categoria,
        product.unidad_medida,
        product.cantidad,
        product.costo_producto,
        product.precio_venta,
        product.ganancia,
      ]
        .map(escapeCsv)
        .join(",")
    );

    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([`\uFEFF${csv}`], {
      type: "text/csv;charset=utf-8;",
    });

    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `productos_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(link.href);

    messageApi.success("Exportación completada");
  };

  const eliminarProductos = async (list, onStart, onEnd, successText) => {
    if (!list.length) {
      messageApi.info("No hay productos para eliminar");
      return;
    }

    onStart(true);
    try {
      await Promise.all(
        list.map((product) =>
          api.delete(`/productos/${product.id}`, {
            withCredentials: true,
          })
        )
      );

      await fetchConfigData();
      messageApi.success(successText);
    } catch (error) {
      console.error(error);
      messageApi.error("No se pudieron eliminar los productos seleccionados");
    } finally {
      onEnd(false);
    }
  };

  const iniciarSetup2FA = async () => {
    setProcessing2FA(true);
    try {
      const res = await api.post("/auth/2fa/setup", {}, { withCredentials: true });
      setTwoFactorSetup(res.data);
      setOtpSetupCode("");
      messageApi.success("Setup 2FA generado. Registra el secreto en tu app.");
    } catch (error) {
      console.error(error);
      messageApi.error(error?.response?.data?.error || "No se pudo iniciar 2FA");
    } finally {
      setProcessing2FA(false);
    }
  };

  const activar2FA = async () => {
    if (!otpSetupCode) {
      messageApi.warning("Ingresa el código OTP para activar");
      return;
    }

    setProcessing2FA(true);
    try {
      await api.post(
        "/auth/2fa/enable",
        { otp_code: otpSetupCode },
        { withCredentials: true }
      );
      setTwoFactorEnabled(true);
      setTwoFactorSetup(null);
      setOtpSetupCode("");
      messageApi.success("2FA activado correctamente");
    } catch (error) {
      console.error(error);
      messageApi.error(error?.response?.data?.error || "No se pudo activar 2FA");
    } finally {
      setProcessing2FA(false);
    }
  };

  const desactivar2FA = async () => {
    if (!otpDisableCode) {
      messageApi.warning("Ingresa el código OTP actual");
      return;
    }

    setProcessing2FA(true);
    try {
      await api.post(
        "/auth/2fa/disable",
        { otp_code: otpDisableCode },
        { withCredentials: true }
      );
      setTwoFactorEnabled(false);
      setOtpDisableCode("");
      setTwoFactorSetup(null);
      messageApi.success("2FA desactivado");
    } catch (error) {
      console.error(error);
      messageApi.error(error?.response?.data?.error || "No se pudo desactivar 2FA");
    } finally {
      setProcessing2FA(false);
    }
  };

  return (
    <div>
      {contextHolder}

      <Typography.Title level={3} style={{ marginTop: 0 }}>
        Configuración
      </Typography.Title>

      <Typography.Paragraph type="secondary">
        Control general de tu cuenta, salud del catálogo y tareas de mantenimiento.
      </Typography.Paragraph>

      <Row gutter={[16, 16]}>
        <Col xs={24}>
          <Card title="Apariencia">
            <Space direction="vertical" style={{ width: "100%" }} size="middle">
              <Space style={{ width: "100%", justifyContent: "space-between" }}>
                <div>
                  <Typography.Text strong>Modo oscuro</Typography.Text>
                  <div>
                    <Typography.Text type="secondary">
                      Activa un tema oscuro para reducir fatiga visual.
                    </Typography.Text>
                  </div>
                </div>
                <Switch checked={isDarkMode} onChange={toggleTheme} />
              </Space>
              <Space style={{ width: "100%", justifyContent: "space-between" }}>
                <div>
                  <Typography.Text strong>Estilo del menú</Typography.Text>
                  <div>
                    <Typography.Text type="secondary">
                      Elige si quieres un menú normal o recortado.
                    </Typography.Text>
                  </div>
                </div>
                <Select
                  value={navMode}
                  onChange={handleNavModeChange}
                  options={[
                    { value: "normal", label: "Normal" },
                    { value: "recortado", label: "Recortado" },
                  ]}
                  style={{ minWidth: 160 }}
                />
              </Space>
            </Space>
          </Card>
        </Col>
      </Row>

      <Divider />

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={10}>
          <Card title="Cuenta" loading={loading}>
            <Descriptions column={1} size="small" bordered>
              <Descriptions.Item label="Nombre">
                {perfil?.nombre || "-"}
              </Descriptions.Item>
              <Descriptions.Item label="Correo">
                {perfil?.correo || "-"}
              </Descriptions.Item>
              <Descriptions.Item label="Rol">
                <Tag color={perfil?.rol === "Administrador" ? "geekblue" : "default"}>
                  {perfil?.rol || "-"}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Inquilino">
                {perfil?.inquilino || "-"}
              </Descriptions.Item>
            </Descriptions>

            <Divider style={{ margin: "16px 0" }} />

            <Space wrap>
              <Button onClick={() => navigate("/usuarios")}>Ir a usuarios</Button>
              <Button onClick={() => navigate("/inventario")}>Ir a inventario</Button>
              <Button type="primary" onClick={() => navigate("/productos")}>Ir a productos</Button>
            </Space>
          </Card>
        </Col>

        <Col xs={24} lg={14}>
          <Row gutter={[16, 16]}>
            <Col xs={12}>
              <Card loading={loading}>
                <Statistic title="Productos" value={totales.totalProductos} />
              </Card>
            </Col>
            <Col xs={12}>
              <Card loading={loading}>
                <Statistic title="Stock total" value={totales.totalStock} />
              </Card>
            </Col>
            <Col xs={12}>
              <Card loading={loading}>
                <Statistic
                  title="Costo inventario"
                  value={totales.costoInventario}
                  formatter={(value) => formatMoney(toNumber(value))}
                />
              </Card>
            </Col>
            <Col xs={12}>
              <Card loading={loading}>
                <Statistic
                  title="Valor de venta"
                  value={totales.valorVentaInventario}
                  formatter={(value) => formatMoney(toNumber(value))}
                />
              </Card>
            </Col>
            <Col xs={24}>
              <Card loading={loading}>
                <Space size="large" wrap>
                  <Statistic title="Áreas" value={areas.length} />
                  <Statistic title="Categorías" value={categorias.length} />
                  <Statistic title="Usuarios" value={usuarios.length} />
                  <Statistic
                    title="Utilidad potencial"
                    value={totales.utilidadPotencial}
                    formatter={(value) => formatMoney(toNumber(value))}
                    valueStyle={{
                      color: toNumber(totales.utilidadPotencial) >= 0 ? "#3f8600" : "#cf1322",
                    }}
                  />
                </Space>
              </Card>
            </Col>
          </Row>
        </Col>
      </Row>

      <Divider />

      <Row gutter={[16, 16]}>
        <Col xs={24}>
          <Card title="Seguridad: autenticación de 2 pasos (2FA)">
            <Space direction="vertical" size="middle" style={{ width: "100%" }}>
              <Alert
                type={twoFactorEnabled ? "success" : "warning"}
                showIcon
                message={twoFactorEnabled ? "2FA activo" : "2FA inactivo"}
                description={
                  twoFactorEnabled
                    ? "Tu cuenta requiere código OTP para iniciar sesión."
                    : "Activa 2FA para reducir riesgo de acceso no autorizado."
                }
              />

              {!twoFactorEnabled ? (
                <Space direction="vertical" size="middle" style={{ width: "100%" }}>
                  <Button loading={processing2FA} onClick={iniciarSetup2FA}>
                    Generar secreto 2FA
                  </Button>

                  {twoFactorSetup && (
                    <Card size="small" title="Paso 1: registra tu secreto en la app autenticadora">
                      <Space direction="vertical" style={{ width: "100%" }} size="small">
                        <Typography.Text copyable>{twoFactorSetup.secret}</Typography.Text>
                        <Typography.Text type="secondary">
                          Si tu app soporta URL otpauth, también puedes usar esta:
                        </Typography.Text>
                        <Typography.Text copyable style={{ wordBreak: "break-all" }}>
                          {twoFactorSetup.otpauth_url}
                        </Typography.Text>
                      </Space>
                    </Card>
                  )}

                  {twoFactorSetup && (
                    <Card size="small" title="Paso 2: confirma con tu código OTP actual">
                      <Space>
                        <Input
                          placeholder="Código 6 dígitos"
                          value={otpSetupCode}
                          onChange={(event) => setOtpSetupCode(event.target.value)}
                          maxLength={6}
                          style={{ width: 180 }}
                        />
                        <Button
                          type="primary"
                          loading={processing2FA}
                          onClick={activar2FA}
                        >
                          Activar 2FA
                        </Button>
                      </Space>
                    </Card>
                  )}
                </Space>
              ) : (
                <Card size="small" title="Desactivar 2FA (requiere código actual)">
                  <Space>
                    <Input
                      placeholder="Código 6 dígitos"
                      value={otpDisableCode}
                      onChange={(event) => setOtpDisableCode(event.target.value)}
                      maxLength={6}
                      style={{ width: 180 }}
                    />
                    <Button danger loading={processing2FA} onClick={desactivar2FA}>
                      Desactivar 2FA
                    </Button>
                  </Space>
                </Card>
              )}
            </Space>
          </Card>
        </Col>
      </Row>

      <Divider />

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card title="Alerta de stock bajo" loading={loading}>
            <Space direction="vertical" style={{ width: "100%" }} size="middle">
              <Space>
                <Typography.Text>Umbral mínimo:</Typography.Text>
                <InputNumber
                  min={0}
                  value={stockMinimo}
                  onChange={(value) => setStockMinimo(Number(value) || 0)}
                />
              </Space>

              {productosStockBajo.length > 0 ? (
                <Alert
                  type="warning"
                  showIcon
                  message={`${productosStockBajo.length} producto(s) con stock en o por debajo del límite`}
                />
              ) : (
                <Alert
                  type="success"
                  showIcon
                  message="No hay productos en nivel crítico"
                />
              )}

              <List
                size="small"
                bordered
                dataSource={productosStockBajo.slice(0, 8)}
                locale={{ emptyText: "Sin productos críticos" }}
                renderItem={(item) => (
                  <List.Item>
                    <Space style={{ width: "100%", justifyContent: "space-between" }}>
                      <Typography.Text>{item.nombre}</Typography.Text>
                      <Tag color="orange">Stock: {toNumber(item.cantidad)}</Tag>
                    </Space>
                  </List.Item>
                )}
              />
            </Space>
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card title="Mantenimiento" loading={loading}>
            <Space direction="vertical" style={{ width: "100%" }} size="middle">
              <Button onClick={exportarProductosCsv}>Exportar catálogo a CSV</Button>

              <Popconfirm
                title="¿Eliminar productos sin stock?"
                description="Borrará los productos con cantidad 0 o menor"
                onConfirm={() =>
                  eliminarProductos(
                    productos.filter((p) => toNumber(p.cantidad) <= 0),
                    setCleaningNoStock,
                    setCleaningNoStock,
                    "Productos sin stock eliminados"
                  )
                }
              >
                <Button danger loading={cleaningNoStock}>
                  Eliminar productos sin stock
                </Button>
              </Popconfirm>

              <Popconfirm
                title="¿Eliminar todos los productos?"
                description="Esta acción no se puede deshacer"
                onConfirm={() =>
                  eliminarProductos(
                    productos,
                    setCleaningAll,
                    setCleaningAll,
                    "Todos los productos fueron eliminados"
                  )
                }
              >
                <Button danger type="primary" loading={cleaningAll}>
                  Vaciar catálogo completo
                </Button>
              </Popconfirm>

              <Alert
                type="info"
                showIcon
                message="Recomendación"
                description="Exporta CSV antes de ejecutar limpiezas masivas para conservar respaldo."
              />
            </Space>
          </Card>
        </Col>
      </Row>
    </div>
  );
}
