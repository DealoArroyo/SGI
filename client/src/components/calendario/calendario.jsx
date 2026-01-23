import React, { useState } from 'react';
import { 
  format, addMonths, subMonths, startOfMonth, endOfMonth, 
  startOfWeek, endOfWeek, isSameMonth, isSameDay, addDays,
} from 'date-fns';

const Calendario = () => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [events, setEvents] = useState({});
  const [showModal, setShowModal] = useState(false);
  const [newEventText, setNewEventText] = useState("");

  // Funciones de navegación
  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

  // Generar los días del calendario
  const renderDays = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const rows = [];
    let days = [];
    let day = startDate;

    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        const formattedDate = format(day, "yyyy-MM-dd");
        const isSelected = isSameDay(day, selectedDate);
        const isCurrentMonth = isSameMonth(day, monthStart);
        
        const cloneDay = day;
        days.push(
          <div
            key={formattedDate}
            className={`min-h-[100px] border p-2 cursor-pointer transition-colors ${
              !isCurrentMonth ? "bg-gray-50 text-gray-400" : "bg-white"
            } ${isSelected ? "border-blue-500 bg-blue-50" : "border-gray-200"}`}
            onClick={() => {
              setSelectedDate(cloneDay);
              setShowModal(true);
            }}
          >
            <span className="font-semibold">{format(day, "d")}</span>
            <div className="mt-1">
              {events[formattedDate]?.map((ev, idx) => (
                <div key={idx} className="text-xs bg-blue-600 text-white p-1 rounded mb-1 truncate">
                  {ev}
                </div>
              ))}
            </div>
          </div>
        );
        day = addDays(day, 1);
      }
      rows.push(<div className="grid grid-cols-7" key={day}>{days}</div>);
      days = [];
    }
    return rows;
  };

  const handleAddEvent = () => {
    const dateKey = format(selectedDate, "yyyy-MM-dd");
    const updatedEvents = { ...events };
    if (!updatedEvents[dateKey]) updatedEvents[dateKey] = [];
    updatedEvents[dateKey].push(newEventText);
    setEvents(updatedEvents);
    setNewEventText("");
    setShowModal(false);
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-gray-800">
          {format(currentMonth, "MMMM yyyy")}
        </h2>
        <div className="space-x-2">
          <button onClick={prevMonth} className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300">Ant.</button>
          <button onClick={nextMonth} className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300">Sig.</button>
        </div>
      </div>

      {/* Días de la semana */}
      <div className="grid grid-cols-7 mb-2 text-center font-bold text-gray-600">
        {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map(d => <div key={d}>{d}</div>)}
      </div>

      {/* Cuerpo del Calendario */}
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        {renderDays()}
      </div>

      {/* Modal Simple para Eventos */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-sm">
            <h3 className="text-lg font-bold mb-4">Agregar evento para {format(selectedDate, "dd/MM/yyyy")}</h3>
            <input 
              type="text"
              className="w-full border border-gray-200 p-2 rounded-lg mb-4 focus:outline-blue-500"
              placeholder="Detalle del evento"
              value={newEventText}
              onChange={(e) => setNewEventText(e.target.value)}
            />
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 text-gray-600">Cancelar</button>
              <button onClick={handleAddEvent} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Guardar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Calendario;