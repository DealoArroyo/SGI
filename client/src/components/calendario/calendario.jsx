import { useState, useEffect } from "react";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  addMonths,
  subMonths,
  isSameMonth,
  isSameDay
} from "date-fns";
import { es } from "date-fns/locale";
import {
  Button,
  Card,
  Drawer,
  Form,
  Input,
  Popconfirm,
  message,
  Row,
  Col
} from "antd";
import {
  LeftOutlined,
  RightOutlined,
  PlusOutlined,
  DeleteOutlined
} from "@ant-design/icons";
import api from "../../api";

/* 🔹 Utilidad calendario */
const getCalendarRange = (currentMonth) => {
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  return {
    start: startOfWeek(monthStart),
    end: endOfWeek(monthEnd),
    monthStart,
  };
};

export default function AgendaCalendar() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [openDrawer, setOpenDrawer] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [agendas, setAgendas] = useState([]);

  const { start, end, monthStart } = getCalendarRange(currentMonth);

  useEffect(() => {
    fetchAgendas();
  }, []);

  const fetchAgendas = async () => {
    const res = await api.get("/agendas");
    setAgendas(
      res.data.map(a => ({
        ...a,
        date: new Date(a.fecha)
      }))
    );
  };

  /* 🔹 Crear agenda */
  const onFinish = async (values) => {
    await api.post("/agendas", {
      titulo: values.title,
      fecha: format(selectedDate, "yyyy-MM-dd"),
    });

    message.success("Agenda creada");
    setOpenDrawer(false);
    fetchAgendas();
  };

  /* 🔹 Eliminar agenda */
  const eliminarAgenda = async (id) => {
    await api.delete(`/agendas/${id}`);
    message.success("Agenda eliminada correctamente");
    fetchAgendas();
  };

  /* 🔹 Render días */
  const days = [];
  let day = start;

  while (day <= end) {
    const cloneDay = day;
    const formattedDate = format(day, "d");

    days.push(
      <Col span={3} key={day}>
        <Card
          size="small"
          hoverable
          style={{
            minHeight: 100,
            background: isSameMonth(day, monthStart)
              ? "#fff"
              : "#f5f5f5",
            border:
              selectedDate && isSameDay(day, selectedDate)
                ? "2px solid #1677ff"
                : "1px solid #e0e0e0",
          }}
          onClick={() => {
            setSelectedDate(cloneDay);
            setOpenDrawer(true);
          }}
        >
          <strong>{formattedDate}</strong>

          {agendas
            .filter((a) => isSameDay(a.date, cloneDay))
            .map((agenda) => (
              <div
                key={agenda.id}
                onClick={(e) => e.stopPropagation()} // ✅ CLAVE
                style={{
                  marginTop: 6,
                  padding: 4,
                  background: "#e6f4ff",
                  borderRadius: 4,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span style={{ fontSize: 12 }}>{agenda.titulo}</span>

                <Popconfirm
                  title="¿Eliminar agenda?"
                  onConfirm={(e) => {
                    e?.stopPropagation();
                    eliminarAgenda(agenda.id);
                  }}
                  onCancel={(e) => e?.stopPropagation()}
                >
                  <DeleteOutlined
                    onClick={(e) => e.stopPropagation()} // ✅ CLAVE
                    style={{ color: "red", fontSize: 12 }}
                  />
                </Popconfirm>
              </div>
            ))}
        </Card>
      </Col>
    );

    day = addDays(day, 1);
  }

  /* 🔹 Mes en español */
  const mes = format(currentMonth, "MMMM yyyy", { locale: es });
  const mesCapitalizado = mes.charAt(0).toUpperCase() + mes.slice(1);

  return (
    <>
      {/* 🔹 Header */}
      <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
        <Button
          icon={<LeftOutlined />}
          onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
        />

        <h2 style={{ margin: 0 }}>{mesCapitalizado}</h2>

        <Button
          icon={<RightOutlined />}
          onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
        />
      </Row>

      {/* 🔹 Calendario */}
      <Row gutter={[8, 8]}>{days}</Row>

      {/* 🔹 Drawer animado */}
      <Drawer
        title={`Nueva agenda — ${
          selectedDate ? format(selectedDate, "dd/MM/yyyy") : ""
        }`}
        open={openDrawer}
        onClose={() => setOpenDrawer(false)}
        placement="right"
        width={380}
        destroyOnClose
      >
        <Form layout="vertical" onFinish={onFinish}>
          <Form.Item
            label="Título"
            name="title"
            rules={[{ required: true, message: "Escribe un título" }]}
          >
            <Input placeholder="Ej. Reunión, cita médica..." />
          </Form.Item>

          <Button
            type="primary"
            htmlType="submit"
            icon={<PlusOutlined />}
            block
          >
            Guardar agenda
          </Button>
        </Form>
      </Drawer>
    </>
  );
}
