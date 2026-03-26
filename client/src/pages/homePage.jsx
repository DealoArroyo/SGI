import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Card,
  Col,
  message,
  List,
  Progress,
  Row,
  Space,
  Spin,
  Statistic,
  Tag,
  Typography,
} from "antd";
import api from "../api";
import { formatMoney } from "../components/helperMoney";

const toNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

export default function PanelPrincipal() {
  const [messageApi, contextHolder] = message.useMessage();
  const [loading, setLoading] = useState(true);
  const [resumen, setResumen] = useState(null);
  const [pedidos, setPedidos] = useState([]);
  const [productos, setProductos] = useState([]);
  const [clientes, setClientes] = useState([]);

  const showChartDetail = (title, detail) => {
    messageApi.info({
      content: `${title}: ${detail}`,
      duration: 4,
    });
  };

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    try {
      const [resumenRes, pedidosRes, productosRes, clientesRes] = await Promise.all([
        api.get("/pedidos/resumen", { withCredentials: true }),
        api.get("/pedidos", { withCredentials: true }),
        api.get("/productos/inquilino", { withCredentials: true }),
        api.get("/clientes", { withCredentials: true }),
      ]);

      setResumen(resumenRes.data || null);
      setPedidos(pedidosRes.data || []);
      setProductos(productosRes.data || []);
      setClientes(clientesRes.data || []);
    } catch (error) {
      console.error("Error al cargar dashboard", error);
      setResumen(null);
      setPedidos([]);
      setProductos([]);
      setClientes([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const now = useMemo(() => new Date(), []);
  const monthLabel = now.toLocaleDateString("es-MX", {
    month: "long",
    year: "numeric",
  });

  const stockCritico = useMemo(
    () => productos.filter((p) => toNumber(p.cantidad) <= 5),
    [productos]
  );

  const pedidosRecientes = useMemo(() => {
    return [...pedidos]
      .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
      .slice(0, 5);
  }, [pedidos]);

  const pedidosConfirmados = useMemo(
    () => pedidos.filter((p) => ["confirmado", "entregado"].includes(p.estado)),
    [pedidos]
  );

  const pedidosMesActual = useMemo(() => {
    return pedidosConfirmados.filter((pedido) => {
      const fecha = new Date(pedido.fecha);
      return (
        fecha.getFullYear() === now.getFullYear() &&
        fecha.getMonth() === now.getMonth()
      );
    });
  }, [pedidosConfirmados, now]);

  const toDateKey = (dateValue) => {
    const d = new Date(dateValue);
    if (Number.isNaN(d.getTime())) return "";
    const y = d.getFullYear();
    const m = `${d.getMonth() + 1}`.padStart(2, "0");
    const day = `${d.getDate()}`.padStart(2, "0");
    return `${y}-${m}-${day}`;
  };

  const ventasDiarias = useMemo(() => {
    const map = new Map();
    pedidosConfirmados.forEach((pedido) => {
      const key = toDateKey(pedido.fecha);
      if (!key) return;
      map.set(key, (map.get(key) || 0) + toNumber(pedido.total));
    });

    const days = 14;
    const result = [];
    for (let i = days - 1; i >= 0; i -= 1) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const key = toDateKey(d);
      const label = d.toLocaleDateString("es-MX", { day: "2-digit", month: "short" });
      result.push({
        key,
        label,
        value: toNumber(map.get(key) || 0),
      });
    }
    return result;
  }, [pedidosConfirmados, now]);

  const ventasDiariasConVentas = useMemo(() => {
    return ventasDiarias.filter((item) => item.value > 0).slice(-5);
  }, [ventasDiarias]);

  const ventasDiaSemana = useMemo(() => {
    const labels = ["Lun", "Mar", "Mie", "Jue", "Vie", "Sab", "Dom"];
    const totals = Array(7).fill(0);
    pedidosConfirmados.forEach((pedido) => {
      const d = new Date(pedido.fecha);
      if (Number.isNaN(d.getTime())) return;
      const index = (d.getDay() + 6) % 7;
      totals[index] += toNumber(pedido.total);
    });
    return labels.map((label, index) => ({
      key: label,
      label,
      value: totals[index],
    }));
  }, [pedidosConfirmados]);

  const stockDistribucion = useMemo(() => {
    let critico = 0;
    let bajo = 0;
    let sano = 0;
    productos.forEach((producto) => {
      const qty = toNumber(producto.cantidad);
      if (qty <= 5) {
        critico += 1;
      } else if (qty <= 20) {
        bajo += 1;
      } else {
        sano += 1;
      }
    });
    const total = critico + bajo + sano;
    return { critico, bajo, sano, total };
  }, [productos]);

  const pedidosPorEstado = useMemo(() => {
    const estados = ["borrador", "confirmado", "entregado", "cancelado"];
    return estados.map((estado) => ({
      estado,
      total: pedidos.filter((p) => p.estado === estado).length,
    }));
  }, [pedidos]);

  const piePedidosEstado = useMemo(
    () => [
      { label: "Borrador", value: toNumber(pedidosPorEstado[0]?.total), color: "var(--dash-pie-1)" },
      { label: "Confirmado", value: toNumber(pedidosPorEstado[1]?.total), color: "var(--dash-pie-2)" },
      { label: "Entregado", value: toNumber(pedidosPorEstado[2]?.total), color: "var(--dash-pie-3)" },
      { label: "Cancelado", value: toNumber(pedidosPorEstado[3]?.total), color: "var(--dash-pie-4)" },
    ],
    [pedidosPorEstado]
  );

  const pieInventario = useMemo(
    () => [
      { label: "Critico", value: stockDistribucion.critico, color: "var(--dash-pie-5)" },
      { label: "Bajo", value: stockDistribucion.bajo, color: "var(--dash-pie-6)" },
      { label: "Sano", value: stockDistribucion.sano, color: "var(--dash-pie-7)" },
    ],
    [stockDistribucion]
  );

  const topClientes = useMemo(() => {
    const map = new Map();
    pedidosMesActual.forEach((pedido) => {
      const nombre = pedido.cliente || "Sin cliente";
      map.set(nombre, (map.get(nombre) || 0) + toNumber(pedido.total));
    });
    return [...map.entries()]
      .map(([nombre, total]) => ({ nombre, total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);
  }, [pedidosMesActual]);

  const crecimiento = toNumber(resumen?.crecimiento_ventas_pct);
  const ingresosMes = toNumber(resumen?.ingresos_mes_actual);
  const ticketPromedio = toNumber(resumen?.ticket_promedio_mes);
  const clientesActivosMes = toNumber(resumen?.clientes_activos_mes);
  const topProductosMes = resumen?.top_productos_mes || [];

  const totalUltimos14 = ventasDiarias.reduce((acc, item) => acc + item.value, 0);
  const totalMesActual = topClientes.reduce((acc, item) => acc + item.total, 0);
  const maxVentasDia = ventasDiarias.reduce(
    (acc, item) => (item.value > acc ? item.value : acc),
    0
  );
  const maxPedidosEstado = pedidosPorEstado.reduce(
    (acc, item) => (item.total > acc ? item.total : acc),
    0
  );
  const maxVentasDiaSemana = ventasDiaSemana.reduce(
    (acc, item) => (item.value > acc ? item.value : acc),
    0
  );
  const maxVentasProducto = topProductosMes.reduce(
    (acc, item) => {
      const total = toNumber(item.ventas_total);
      return total > acc ? total : acc;
    },
    0
  );

  const clientesConCompra = Math.min(clientesActivosMes, clientes.length);
  const clientesSinCompra = Math.max(clientes.length - clientesConCompra, 0);
  const pieClientes = useMemo(
    () => [
      { label: "Con compra", value: clientesConCompra, color: "var(--dash-pie-1)" },
      { label: "Sin compra", value: clientesSinCompra, color: "var(--dash-pie-4)" },
    ],
    [clientesConCompra, clientesSinCompra]
  );

  const pieVentasCliente = useMemo(() => {
    if (topClientes.length === 0) {
      return [
        { label: "Sin ventas", value: 0, color: "var(--dash-pie-1)" },
      ];
    }
    const top = topClientes.slice(0, 5);
    const topTotal = top.reduce((acc, item) => acc + item.total, 0);
    const otros = Math.max(totalMesActual - topTotal, 0);
    const palette = [
      "var(--dash-pie-1)",
      "var(--dash-pie-2)",
      "var(--dash-pie-3)",
      "var(--dash-pie-4)",
      "var(--dash-pie-5)",
    ];
    const items = top.map((item, index) => ({
      label: item.nombre,
      value: item.total,
      color: palette[index % palette.length],
    }));
    if (otros > 0) {
      items.push({ label: "Otros", value: otros, color: "var(--dash-pie-6)" });
    }
    return items;
  }, [topClientes, totalMesActual]);

  const LineChart = ({ data, height = 200, id = "ventas" }) => {
    const hasData = data.some((d) => d.value > 0);
    const max = Math.max(...data.map((d) => d.value), 1);
    const labels = data.map((d) => d.label).join(" · ");
    const chartRef = useRef(null);
    const [hoverInfo, setHoverInfo] = useState(null);
    const points = data
      .map((d, index) => {
        const x = (index / (data.length - 1 || 1)) * 100;
        const y = 100 - (d.value / max) * 85 - 7;
        return `${x},${y}`;
      })
      .join(" ");
    const areaPoints = `${points} 100,100 0,100`;

    return (
      <div
        className="dashboard-chart dash-line-wrap"
        ref={chartRef}
        onMouseLeave={() => setHoverInfo(null)}
        onMouseMove={(event) => {
          if (!chartRef.current) return;
          const rect = chartRef.current.getBoundingClientRect();
          const x = event.clientX - rect.left;
          const ratio = Math.min(Math.max(x / rect.width, 0), 1);
          const index = Math.round(ratio * (data.length - 1));
          const item = data[index];
          if (!item) return;
          const y = 100 - (item.value / max) * 85 - 7;
          setHoverInfo({
            index,
            label: item.label,
            value: item.value,
            x: ratio * 100,
            y,
          });
        }}
      >
        <svg
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          style={{ width: "100%", height }}
          role="img"
          aria-label={`Ventas diarias: ${labels}`}
        >
          <defs>
            <linearGradient id={`${id}-fill`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--dash-chart-line)" stopOpacity="0.35" />
              <stop offset="100%" stopColor="var(--dash-chart-line)" stopOpacity="0" />
            </linearGradient>
            <filter id={`${id}-glow`} x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="1.8" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          <rect
            x="0"
            y="0"
            width="100"
            height="100"
            fill="var(--dash-chart-bg)"
            rx="6"
          />
          {[20, 40, 60, 80].map((y) => (
            <line
              key={y}
              x1="0"
              x2="100"
              y1={y}
              y2={y}
              stroke="var(--dash-chart-grid)"
              strokeWidth="0.6"
            />
          ))}
          {hasData ? (
            <>
              <polygon points={areaPoints} fill={`url(#${id}-fill)`} />
              <polyline
                points={points}
                fill="none"
                stroke="var(--dash-chart-line)"
                strokeWidth="4.5"
                opacity="0.15"
                vectorEffect="non-scaling-stroke"
                filter={`url(#${id}-glow)`}
              />
              <polyline
                points={points}
                fill="none"
                stroke="var(--dash-chart-line)"
                strokeWidth="2.4"
                vectorEffect="non-scaling-stroke"
              />
              {hoverInfo ? (
                <>
                  <line
                    x1={hoverInfo.x}
                    x2={hoverInfo.x}
                    y1="8"
                    y2="100"
                    stroke="var(--dash-chart-line)"
                    strokeWidth="0.6"
                    strokeDasharray="2 2"
                  />
                  <circle
                    cx={hoverInfo.x}
                    cy={hoverInfo.y}
                    r="2.6"
                    fill="var(--dash-chart-line)"
                  />
                  <circle
                    cx={hoverInfo.x}
                    cy={hoverInfo.y}
                    r="6"
                    fill="var(--dash-chart-line)"
                    opacity="0.15"
                  />
                </>
              ) : null}
            </>
          ) : (
            <text
              x="50"
              y="50"
              textAnchor="middle"
              fill="var(--dash-chart-muted)"
              fontSize="6"
            >
              Sin ventas en el periodo
            </text>
          )}
        </svg>
        {hoverInfo ? (
          <div
            className="dash-tooltip"
            style={{ left: `${hoverInfo.x}%`, top: `${hoverInfo.y}%` }}
          >
            <div className="dash-tooltip-title">{hoverInfo.label}</div>
            <div className="dash-tooltip-value">{formatMoney(hoverInfo.value)}</div>
          </div>
        ) : null}
        <div className="dash-line-labels">
          {data.map((item) => (
            <div key={item.key} className="dash-line-label">
              {item.label}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const BarChart = ({ data, maxValue, valueFormatter, onSelect }) => (
    <div className="dashboard-chart">
      <Space direction="vertical" style={{ width: "100%" }} size="small">
        {data.map((item) => {
          const value = item.total ?? item.value;
          const label = item.estado || item.label;
          const detail = valueFormatter ? valueFormatter(value) : `${value}`;
          return (
            <button
              key={item.estado || item.key}
              type="button"
              className="dash-bar-button"
              onClick={() => onSelect?.(item)}
              title={`${label}: ${detail}`}
            >
              <Space style={{ width: "100%", justifyContent: "space-between" }}>
                <Typography.Text>{label}</Typography.Text>
                <Typography.Text strong>
                  {valueFormatter ? valueFormatter(value) : value}
                </Typography.Text>
              </Space>
              <div className="dash-bar-track">
                <div
                  className="dash-bar-fill"
                  style={{
                    width: `${maxValue ? (value / maxValue) * 100 : 0}%`,
                  }}
                />
              </div>
            </button>
          );
        })}
      </Space>
    </div>
  );

  const PieChart = ({ data, size = 160, cutout = 56, onSelect }) => {
    const total = data.reduce((acc, item) => acc + item.value, 0);
    const radius = size / 2;
    const strokeWidth = radius - cutout;
    const circumference = 2 * Math.PI * (radius - strokeWidth / 2);

    let offset = 0;
    return (
      <div className="dashboard-chart" style={{ display: "grid", gap: 12 }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <circle
            cx={radius}
            cy={radius}
            r={radius - strokeWidth / 2}
            stroke="var(--dash-bar-track)"
            strokeWidth={strokeWidth}
            fill="none"
          />
          {total > 0
            ? data.map((item) => {
                const value = item.value / total;
                const length = circumference * value;
                const dash = `${length} ${circumference - length}`;
                const sliceOffset = circumference * offset;
                offset += value;
                return (
                  <circle
                    key={item.label}
                    cx={radius}
                    cy={radius}
                    r={radius - strokeWidth / 2}
                    stroke={item.color}
                    strokeWidth={strokeWidth}
                    strokeDasharray={dash}
                    strokeDashoffset={-sliceOffset}
                    fill="none"
                    strokeLinecap="butt"
                    transform={`rotate(-90 ${radius} ${radius})`}
                    className="dash-pie-slice"
                    onClick={() => onSelect?.(item)}
                  >
                    <title>{`${item.label}: ${item.value}`}</title>
                  </circle>
                );
              })
            : null}
          {total === 0 ? (
            <text
              x={radius}
              y={radius}
              textAnchor="middle"
              dominantBaseline="middle"
              fill="var(--dash-chart-muted)"
              fontSize="12"
            >
              Sin datos
            </text>
          ) : (
            <text
              x={radius}
              y={radius}
              textAnchor="middle"
              dominantBaseline="middle"
              fill="var(--dash-chart-muted)"
              fontSize="12"
            >
              {total}
            </text>
          )}
        </svg>
        <Space direction="vertical" size={6}>
          {data.map((item) => (
            <Space key={item.label} style={{ justifyContent: "space-between", width: "100%" }}>
              <Space>
                <span className="dash-legend-dot" style={{ background: item.color }} />
                <Typography.Text>{item.label}</Typography.Text>
              </Space>
              <Typography.Text strong>{item.value}</Typography.Text>
            </Space>
          ))}
        </Space>
      </div>
    );
  };

  if (loading) {
    return (
      <div style={{ display: "grid", placeItems: "center", minHeight: 300 }}>
        <Spin />
      </div>
    );
  }

  return (
    <div>
      {contextHolder}
      <Space direction="vertical" size="middle" style={{ width: "100%" }}>
        <div>
          <Typography.Title level={3} style={{ margin: 0 }}>
            Dashboard
          </Typography.Title>
          <Typography.Text type="secondary">
            Datos reales de tu operación en {monthLabel}.
          </Typography.Text>
        </div>

        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic title="Ingresos del mes" value={ingresosMes} formatter={(v) => formatMoney(v)} />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Crecimiento mensual"
                value={crecimiento}
                precision={1}
                suffix="%"
                valueStyle={{ color: crecimiento >= 0 ? "#3f8600" : "#cf1322" }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Ticket promedio"
                value={ticketPromedio}
                formatter={(v) => formatMoney(v)}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic title="Clientes activos mes" value={clientesActivosMes} />
            </Card>
          </Col>
        </Row>

        <Row gutter={[16, 16]}>
          <Col xs={24} lg={16}>
            <Card
              title="Ventas diarias (ultimos 14 dias)"
              extra={<Typography.Text type="secondary">Total {formatMoney(totalUltimos14)}</Typography.Text>}
            >
              <Space direction="vertical" size="middle" style={{ width: "100%" }}>
                <LineChart data={ventasDiarias} id="ventas-diarias" />
                <div>
                  <Typography.Text type="secondary">Vista en barras</Typography.Text>
                  <div style={{ marginTop: 8 }}>
                    {ventasDiariasConVentas.length === 0 ? (
                      <Alert
                        showIcon
                        type="info"
                        message="Sin ventas recientes"
                        description="Esta vista solo muestra los dias con ventas."
                      />
                    ) : (
                      <BarChart
                        data={ventasDiariasConVentas}
                        maxValue={maxVentasDia}
                        valueFormatter={(value) => formatMoney(value)}
                        onSelect={(item) =>
                          showChartDetail(
                            "Ventas diarias",
                            `${item.label}: ${formatMoney(item.value)}`
                          )
                        }
                      />
                    )}
                  </div>
                </div>
                <Space style={{ width: "100%", justifyContent: "space-between" }}>
                  <Typography.Text type="secondary">Maximo en un dia</Typography.Text>
                  <Typography.Text strong>{formatMoney(maxVentasDia)}</Typography.Text>
                </Space>
              </Space>
            </Card>
          </Col>
          <Col xs={24} lg={8}>
            <Card title="Pedidos por estado">
              <BarChart
                data={pedidosPorEstado}
                maxValue={maxPedidosEstado}
                onSelect={(item) =>
                  showChartDetail("Pedidos por estado", `${item.estado}: ${item.total}`)
                }
              />
            </Card>
          </Col>
        </Row>

        <Row gutter={[16, 16]}>
          <Col xs={24} lg={24}>
            <Card title="Ventas por dia de semana">
              <BarChart
                data={ventasDiaSemana}
                maxValue={maxVentasDiaSemana}
                valueFormatter={(value) => formatMoney(value)}
                onSelect={(item) =>
                  showChartDetail("Ventas por dia", `${item.label}: ${formatMoney(item.value)}`)
                }
              />
            </Card>
          </Col>
        </Row>

        <Row gutter={[16, 16]}>
          <Col xs={24} lg={12}>
            <Card title="Distribucion de pedidos">
              <PieChart
                data={piePedidosEstado}
                onSelect={(item) =>
                  showChartDetail("Distribucion de pedidos", `${item.label}: ${item.value}`)
                }
              />
            </Card>
          </Col>
          <Col xs={24} lg={12}>
            <Card title="Distribucion de inventario">
              <Space direction="vertical" size="middle" style={{ width: "100%" }}>
                <PieChart
                  data={pieInventario}
                  onSelect={(item) =>
                    showChartDetail("Distribucion de inventario", `${item.label}: ${item.value}`)
                  }
                />
                <div>
                  <Typography.Text strong>Productos en estado critico</Typography.Text>
                  <List
                    size="small"
                    bordered
                    locale={{ emptyText: "Sin productos en estado critico" }}
                    dataSource={stockCritico.slice(0, 5)}
                    renderItem={(item) => (
                      <List.Item>
                        <Space style={{ width: "100%", justifyContent: "space-between" }}>
                          <Typography.Text>{item.nombre}</Typography.Text>
                          <Tag color="orange">{toNumber(item.cantidad)} uds</Tag>
                        </Space>
                      </List.Item>
                    )}
                  />
                </div>
              </Space>
            </Card>
          </Col>
        </Row>

        <Row gutter={[16, 16]}>
          <Col xs={24} lg={12}>
            <Card title="Clientes con compra vs sin compra">
              <PieChart
                data={pieClientes}
                onSelect={(item) =>
                  showChartDetail("Clientes", `${item.label}: ${item.value}`)
                }
              />
            </Card>
          </Col>
          <Col xs={24} lg={12}>
            <Card title="Ventas por cliente (mes)">
              <PieChart
                data={pieVentasCliente}
                onSelect={(item) =>
                  showChartDetail("Ventas por cliente", `${item.label}: ${formatMoney(item.value)}`)
                }
              />
            </Card>
          </Col>
        </Row>

        <Row gutter={[16, 16]}>
          <Col xs={24} lg={24}>
            <Card title="Top productos vendidos (mes)">
              {topProductosMes.length === 0 ? (
                <Alert
                  showIcon
                  type="info"
                  message="Aun no hay productos con ventas"
                  description="En cuanto se confirmen pedidos con productos, se mostraran aqui."
                />
              ) : (
                <BarChart
                  data={topProductosMes.map((item) => ({
                    key: item.id,
                    label: item.nombre,
                    value: toNumber(item.ventas_total),
                  }))}
                  maxValue={maxVentasProducto}
                  valueFormatter={(value) => formatMoney(value)}
                  onSelect={(item) =>
                    showChartDetail("Top productos", `${item.label}: ${formatMoney(item.value)}`)
                  }
                />
              )}
            </Card>
          </Col>
        </Row>

        <Row gutter={[16, 16]}>
          <Col xs={24} lg={12}>
            <Card title="Top clientes del mes">
              {topClientes.length === 0 ? (
                <Alert
                  showIcon
                  type="info"
                  message="Aun no hay ventas confirmadas"
                  description="Cuando confirmes pedidos en el mes, se mostraran aqui automaticamente."
                />
              ) : (
                <Space direction="vertical" size="middle" style={{ width: "100%" }}>
                  {topClientes.map((cliente) => (
                    <div key={cliente.nombre}>
                      <Space style={{ width: "100%", justifyContent: "space-between" }}>
                        <Typography.Text>{cliente.nombre}</Typography.Text>
                        <Typography.Text strong>{formatMoney(cliente.total)}</Typography.Text>
                      </Space>
                      <Progress
                        showInfo={false}
                        percent={totalMesActual ? (cliente.total / totalMesActual) * 100 : 0}
                        strokeColor="#fa8c16"
                      />
                    </div>
                  ))}
                </Space>
              )}
            </Card>
          </Col>
          <Col xs={24} lg={12}>
            <Card title="Resumen operativo">
              <Space direction="vertical" size="middle" style={{ width: "100%" }}>
                <Statistic title="Pedidos confirmados/entregados" value={pedidosConfirmados.length} />
                <Statistic title="Clientes con compra este mes" value={clientesActivosMes} />
                <div className="dashboard-chart">
                  <Typography.Text strong>Inventario por nivel</Typography.Text>
                  <div className="dash-stack">
                    <div
                      className="dash-stack-seg dash-stack-critical"
                      style={{
                        width: `${stockDistribucion.total ? (stockDistribucion.critico / stockDistribucion.total) * 100 : 0}%`,
                      }}
                    />
                    <div
                      className="dash-stack-seg dash-stack-low"
                      style={{
                        width: `${stockDistribucion.total ? (stockDistribucion.bajo / stockDistribucion.total) * 100 : 0}%`,
                      }}
                    />
                    <div
                      className="dash-stack-seg dash-stack-ok"
                      style={{
                        width: `${stockDistribucion.total ? (stockDistribucion.sano / stockDistribucion.total) * 100 : 0}%`,
                      }}
                    />
                  </div>
                  <Space size="middle" style={{ marginTop: 8 }}>
                    <Typography.Text type="secondary">Critico: {stockDistribucion.critico}</Typography.Text>
                    <Typography.Text type="secondary">Bajo: {stockDistribucion.bajo}</Typography.Text>
                    <Typography.Text type="secondary">Sano: {stockDistribucion.sano}</Typography.Text>
                  </Space>
                </div>
                <Alert
                  showIcon
                  type="info"
                  message={
                    resumen?.ultima_fecha_pedido
                      ? `Ultimo pedido: ${new Date(resumen.ultima_fecha_pedido).toLocaleDateString("es-MX")}`
                      : "Aun no hay pedidos registrados"
                  }
                  description="Este indicador se actualiza en cuanto se registre un nuevo pedido."
                />
              </Space>
            </Card>
          </Col>
        </Row>

      </Space>
    </div>
  );
}
