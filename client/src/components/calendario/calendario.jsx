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
  isSameDay,
  isBefore,
  startOfDay,
} from "date-fns";
import { es } from "date-fns/locale";
import {
  Button,
  Card,
  Drawer,
  Form,
  Input,
  Popconfirm,
  message
} from "antd";
import {
  LeftOutlined,
  RightOutlined,
  PlusOutlined,
  DeleteOutlined
} from "@ant-design/icons";
import api from "../../api";
import { useThemeMode } from "../../context/themeContext.jsx";

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
  const { isDarkMode } = useThemeMode();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [openDrawer, setOpenDrawer] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [agendas, setAgendas] = useState([]);
  const [editingAgenda, setEditingAgenda] = useState(null);
  const [form] = Form.useForm();
  const todayStart = startOfDay(new Date());
  const isSelectedPast = selectedDate
    ? isBefore(startOfDay(selectedDate), todayStart)
    : false;

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

  const openNewAgenda = (date) => {
    if (isBefore(date, todayStart)) {
      message.warning("No puedes agendar en fechas pasadas");
      return;
    }
    setSelectedDate(date);
    setEditingAgenda(null);
    form.setFieldsValue({ title: "" });
    setOpenDrawer(true);
  };

  const openEditAgenda = (agenda) => {
    setSelectedDate(agenda.date);
    setEditingAgenda(agenda);
    form.setFieldsValue({
      title: agenda.titulo
    });
    setOpenDrawer(true);
  };

  /* 🔹 Crear agenda */
  const onFinish = async (values) => {
    if (editingAgenda) {
      if (!selectedDate) {
        message.error("Selecciona una fecha válida");
        return;
      }
      if (isBefore(startOfDay(selectedDate), todayStart)) {
        message.error("No puedes guardar en fechas pasadas");
        return;
      }
      await api.put(`/agendas/${editingAgenda.id}`, {
        titulo: values.title,
        fecha: format(selectedDate, "yyyy-MM-dd"),
      });
      message.success("Agenda actualizada");
    } else {
      if (!selectedDate) {
        message.error("Selecciona una fecha válida");
        return;
      }

      if (isBefore(startOfDay(selectedDate), todayStart)) {
        message.error("No puedes guardar en fechas pasadas");
        return;
      }
      await api.post("/agendas", {
        titulo: values.title,
        fecha: format(selectedDate, "yyyy-MM-dd"),
      });
      message.success("Agenda creada");
    }

    setOpenDrawer(false);
    setEditingAgenda(null);
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
  const weekDays = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

  while (day <= end) {
    const cloneDay = day;
    const formattedDate = format(day, "d");
    const isOutside = !isSameMonth(day, monthStart);
    const isSelected = selectedDate && isSameDay(day, selectedDate);
    const isPast = isBefore(cloneDay, todayStart);
    const dayClasses = [
      "calendar-day",
      isOutside ? "calendar-day--outside" : "",
      isPast ? "calendar-day--past" : "",
      isSelected ? "calendar-day--selected" : ""
    ]
      .filter(Boolean)
      .join(" ");

    days.push(
      <Card
        key={day}
        size="small"
        hoverable={!isPast}
        className={dayClasses}
        onClick={() => {
          openNewAgenda(cloneDay);
        }}
      >
        <strong className="calendar-day-number">{formattedDate}</strong>

        {agendas
          .filter((a) => isSameDay(a.date, cloneDay))
          .map((agenda) => {
            const agendaPast = isBefore(startOfDay(agenda.date), todayStart);
            return (
            <div
              key={agenda.id}
              className={agendaPast
                ? "calendar-agenda calendar-agenda--past"
                : "calendar-agenda calendar-agenda--editable"
              }
              onClick={(e) => {
                e.stopPropagation();
                openEditAgenda(agenda);
              }}
              title={agendaPast ? "Solo lectura" : "Editar agenda"}
            >
              <div className="calendar-agenda-main">
                <span className="calendar-agenda-title">{agenda.titulo}</span>
              </div>

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
                  className="calendar-agenda-delete"
                />
              </Popconfirm>
            </div>
          );
          })}
      </Card>
    );

    day = addDays(day, 1);
  }

  /* 🔹 Mes en español */
  const mes = format(currentMonth, "MMMM yyyy", { locale: es });
  const mesCapitalizado = mes.charAt(0).toUpperCase() + mes.slice(1);

  return (
    <section className="calendar-shell">
      {/* 🔹 Header */}
      <header className="calendar-header">
        <Button
          className="calendar-nav-btn"
          icon={<LeftOutlined />}
          onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
        />

        <h2 className="calendar-title">{mesCapitalizado}</h2>

        <Button
          className="calendar-nav-btn"
          icon={<RightOutlined />}
          onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
        />
      </header>

      <div className="calendar-weekdays">
        {weekDays.map((dayLabel) => (
          <div key={dayLabel} className="calendar-weekday">
            {dayLabel}
          </div>
        ))}
      </div>

      {/* 🔹 Calendario */}
      <div className="calendar-grid">{days}</div>

      {/* 🔹 Drawer animado */}
      <Drawer
        title={`${editingAgenda ? "Editar agenda" : "Nueva agenda"} — ${
          selectedDate ? format(selectedDate, "dd/MM/yyyy") : ""
        }`}
        open={openDrawer}
        onClose={() => {
          setOpenDrawer(false);
          setEditingAgenda(null);
        }}
        placement="right"
        width={380}
        destroyOnClose
        styles={{
          body: {
            background: isDarkMode ? "#0f172a" : "#ffffff",
          },
          header: {
            background: isDarkMode ? "#0f172a" : "#ffffff",
            color: isDarkMode ? "#e2e8f0" : "#0f172a",
            borderBottom: `1px solid ${isDarkMode ? "#334155" : "#e2e8f0"}`,
          },
        }}
      >
        <Form form={form} layout="vertical" onFinish={onFinish}>
          <Form.Item
            label="Título"
            name="title"
            rules={[{ required: true, message: "Escribe un título" }]}
          >
            <Input
              placeholder="Ej. Reunión, cita médica..."
              disabled={editingAgenda ? isSelectedPast : false}
            />
          </Form.Item>

          {!isSelectedPast && (
            <Button
              type="primary"
              htmlType="submit"
              icon={<PlusOutlined />}
              block
            >
              {editingAgenda ? "Actualizar agenda" : "Guardar agenda"}
            </Button>
          )}
        </Form>
      </Drawer>
    </section>
  );
}
