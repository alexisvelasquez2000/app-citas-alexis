import React, { useState, useEffect } from 'react';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths
} from 'date-fns';
import { es } from 'date-fns/locale';
import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  where
} from 'firebase/firestore';
import { db } from './firebase';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  User,
  Calendar as CalendarIcon,
  X,
  Bell,
  Download,
  Printer
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import * as XLSX from 'xlsx';

function App() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [userName, setUserName] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);

  // Suscribirse a los cambios en Firestore
  useEffect(() => {
    const q = query(collection(db, "citas"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setAppointments(data);
    });

    return () => unsubscribe();
  }, []);

  const addNotification = (message, type = 'info') => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 3000);
  };

  const handleAddAppointment = async (e) => {
    e.preventDefault();
    if (!userName.trim()) return;

    try {
      await addDoc(collection(db, "citas"), {
        nombre: userName,
        fecha: format(selectedDay, 'yyyy-MM-dd'),
        timestamp: new Date()
      });
      addNotification(`¡${userName} se ha unido al día ${format(selectedDay, 'd')}!`);
      setUserName('');
      setIsModalOpen(false);
    } catch (error) {
      console.error("Error al añadir cita:", error);
      addNotification("Error al guardar", "error");
    }
  };

  const handleDeleteAppointment = async (id, name) => {
    try {
      await deleteDoc(doc(db, "citas", id));
      addNotification(`${name} se ha retirado.`);
    } catch (error) {
      console.error("Error al borrar:", error);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportExcel = () => {
    const monthName = format(currentDate, 'MMMM', { locale: es });
    const year = format(currentDate, 'yyyy');

    // Preparar datos: Solo días del mes actual que tengan citas
    const daysInMonth = eachDayOfInterval({
      start: monthStart,
      end: monthEnd
    });

    const data = daysInMonth.map(day => {
      const dayApps = getAppointmentsForDay(day);
      if (dayApps.length === 0) return null;

      const row = {
        "Día": format(day, 'd'),
        "Mes": monthName,
        "Año": year
      };

      // Agregar nombres en columnas separadas
      dayApps.forEach((app, index) => {
        row[`Persona ${index + 1}`] = app.nombre;
      });

      return row;
    }).filter(row => row !== null);

    if (data.length === 0) {
      addNotification("No hay citas para exportar en este mes", "info");
      return;
    }

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Citas");

    XLSX.writeFile(workbook, `Citas_${monthName}_${year}.xlsx`);
    addNotification("Archivo Excel generado con éxito");
  };

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  const calendarDays = eachDayOfInterval({
    start: startDate,
    end: endDate
  });

  const getAppointmentsForDay = (day) => {
    const formattedDay = format(day, 'yyyy-MM-dd');
    return appointments.filter(app => app.fecha === formattedDay);
  };

  return (
    <div className="container">
      <header className="header">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1>App Citas Alexis</h1>
          <p>Organiza tus días de forma sencilla y elegante</p>
        </motion.div>
      </header>

      <div className="month-nav no-print">
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button onClick={prevMonth} className="nav-btn"><ChevronLeft /></button>
          <button onClick={nextMonth} className="nav-btn"><ChevronRight /></button>
        </div>
        <h2>{format(currentDate, 'MMMM yyyy', { locale: es })}</h2>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button onClick={handlePrint} className="nav-btn" title="Imprimir PDF"><Printer size={20} /></button>
          <button onClick={handleExportExcel} className="nav-btn" title="Exportar Excel"><Download size={20} /></button>
        </div>
      </div>

      <div className="calendar-grid">
        {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map(day => (
          <div key={day} style={{ textAlign: 'center', fontWeight: 'bold', color: 'var(--text-muted)', paddingBottom: '1rem' }}>
            {day}
          </div>
        ))}
        {calendarDays.map((day, i) => {
          const dayAppointments = getAppointmentsForDay(day);
          return (
            <motion.div
              key={day.toString()}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.01 }}
              className={`calendar-day ${!isSameMonth(day, monthStart) ? 'other-month' : 'current-month'} ${isSameDay(day, new Date()) ? 'today' : ''}`}
              onClick={() => {
                setSelectedDay(day);
                setIsModalOpen(true);
              }}
            >
              <div className="day-number">{format(day, 'd')}</div>
              <div className="day-content">
                {dayAppointments.length > 0 && (
                  <div className="user-count">
                    <User size={12} /> {dayAppointments.length} {dayAppointments.length === 1 ? 'persona' : 'personas'}
                  </div>
                )}
                {dayAppointments.slice(0, 2).map(app => (
                  <div key={app.id} className="user-tag">{app.nombre}</div>
                ))}
                {dayAppointments.length > 2 && (
                  <div className="user-tag" style={{ opacity: 0.6 }}>+ {dayAppointments.length - 2} más</div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
            <motion.div
              className="modal"
              onClick={e => e.stopPropagation()}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                <h2>{format(selectedDay, "EEEE d 'de' MMMM", { locale: es })}</h2>
                <button className="nav-btn" onClick={() => setIsModalOpen(false)}><X /></button>
              </div>

              <form onSubmit={handleAddAppointment}>
                <div className="input-group">
                  <label>Tu nombre para este día</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="text"
                      value={userName}
                      onChange={(e) => setUserName(e.target.value)}
                      placeholder="Ej. Alexis Velasquez"
                      autoFocus
                    />
                  </div>
                </div>
                <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                  <Plus size={18} /> Unirme a este día
                </button>
              </form>

              <div className="user-list">
                <h3 style={{ fontSize: '1rem', color: 'var(--text-muted)', margin: '1.5rem 0 1rem' }}>
                  Personas anotadas ({getAppointmentsForDay(selectedDay).length})
                </h3>
                {getAppointmentsForDay(selectedDay).map(app => (
                  <motion.div
                    layout
                    key={app.id}
                    className="user-item"
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <User size={16} className="text-primary" />
                      <span>{app.nombre}</span>
                    </div>
                    <button
                      className="delete-btn"
                      onClick={() => handleDeleteAppointment(app.id, app.nombre)}
                      title="Borrarme"
                      style={{ background: 'none', border: 'none' }}
                    >
                      <Trash2 size={18} />
                    </button>
                  </motion.div>
                ))}
                {getAppointmentsForDay(selectedDay).length === 0 && (
                  <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
                    Nadie se ha anotado aún. ¡Sé el primero!
                  </p>
                )}
              </div>
            </motion.div>
          </div>
        )
        }
      </AnimatePresence >

      <div className="toast-container">
        <AnimatePresence>
          {notifications.map(n => (
            <motion.div
              key={n.id}
              initial={{ x: 100, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 100, opacity: 0 }}
              className="toast"
            >
              <Bell size={18} />
              {n.message}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div >
  );
}

export default App;
