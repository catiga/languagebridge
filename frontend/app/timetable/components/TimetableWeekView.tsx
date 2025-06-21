'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { Calendar as BigCalendar, dateFnsLocalizer, Event as BigCalendarEvent, ToolbarProps } from 'react-big-calendar';
import format from 'date-fns/format';
import parse from 'date-fns/parse';
import startOfWeek from 'date-fns/startOfWeek';
import endOfWeek from 'date-fns/endOfWeek';
import getDay from 'date-fns/getDay';
import enUS from 'date-fns/locale/en-US';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { apiClient } from '../../utils/api';
import { toast } from 'react-toastify';
import { motion, AnimatePresence } from 'framer-motion';
import { FaChalkboardTeacher, FaUserGraduate, FaTimes, FaVideo, FaChevronLeft, FaChevronRight } from 'react-icons/fa';

// --- Interfaces ---
interface CourseTimeItem {
  id: number;
  lesson_date: string;
  start_time: string;
  end_time: string;
  status: string;
  course_name: string;
  teacher_name: string;
  student_name: string;
}

interface CustomEvent extends BigCalendarEvent {
  id?: number | string;
  resource: {
    teacher: string;
    student: string;
    courseName: string;
  };
}

// --- Localizer Setup ---
const locales = { 'en-US': enUS };
const localizer = dateFnsLocalizer({ format, parse, startOfWeek: (date) => startOfWeek(date, { weekStartsOn: 1 }), getDay, locales });

// --- FIXED In-Calendar Event Component ---
const CustomEventComponent = ({ event }: { event: CustomEvent }) => {
  const timeFormat = (date: Date | undefined) => date ? format(date, 'p') : '';

  return (
    <div className="w-full h-full flex flex-col text-left text-[11px] leading-snug p-1 overflow-hidden">
      <p className="font-semibold whitespace-nowrap">{`${timeFormat(event.start)} - ${timeFormat(event.end)}`}</p>
      <p className="truncate opacity-90">{event.resource.courseName}</p>
    </div>
  );
};

// --- REDESIGNED Custom Toolbar Component ---
const CustomToolbar = (toolbar: ToolbarProps) => {
  const goToBack = () => toolbar.onNavigate('PREV');
  const goToNext = () => toolbar.onNavigate('NEXT');
  const goToCurrent = () => toolbar.onNavigate('TODAY');

  const start = startOfWeek(toolbar.date, { weekStartsOn: 1 });
  const end = endOfWeek(toolbar.date, { weekStartsOn: 1 });

  // Format the date range label
  const label = start.getMonth() === end.getMonth()
    ? `${format(start, 'MMMM d')} - ${format(end, 'd, yyyy')}`
    : `${format(start, 'MMM d')} - ${format(end, 'MMM d, yyyy')}`;

  return (
    <div className="flex justify-between items-center mb-4 p-2">
      <h3 className="text-xl font-bold text-gray-800">{label}</h3>
      <div className="flex items-center gap-2">
        <button onClick={goToBack} className="p-2 rounded-md hover:bg-slate-100 transition-colors" aria-label="Previous week"><FaChevronLeft /></button>
        <button onClick={goToNext} className="p-2 rounded-md hover:bg-slate-100 transition-colors" aria-label="Next week"><FaChevronRight /></button>
        <button onClick={goToCurrent} className="ml-4 px-4 py-2 text-sm font-semibold text-gray-600 border border-gray-300 rounded-md hover:bg-gray-100 transition-colors">Today</button>
      </div>
    </div>
  );
};

// --- UPDATED Event Details Modal ---
const EventDetailsModal = ({ event, onClose }: { event: CustomEvent; onClose: () => void; }) => {
  
  const handleJoinClassroom = () => {
    if (!event.id) {
      toast.error("Lesson ID is missing.");
      return;
    }
    // Simply open the new dedicated meeting page in a new tab
    const meetingPageUrl = `/course/meet/${event.id}`;
    window.open(meetingPageUrl, '_blank', 'noopener,noreferrer');
    onClose(); // Close the modal
  };

  const modalVariants = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.9 }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <motion.div variants={modalVariants} initial="hidden" animate="visible" exit="exit" onClick={(e) => e.stopPropagation()} className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8">
        <div className="flex justify-between items-start">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">{event.resource.courseName}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><FaTimes size={20} /></button>
        </div>
        <p className="text-md text-gray-500 mb-6">{format(event.start!, "eeee, MMMM d, yyyy 'at' h:mm a")}</p>
        <div className="space-y-4 text-gray-700">
          <div className="flex items-center"><FaChalkboardTeacher className="w-5 h-5 mr-3 text-blue-500" /> <span><strong>Teacher:</strong> {event.resource.teacher}</span></div>
          <div className="flex items-center"><FaUserGraduate className="w-5 h-5 mr-3 text-blue-500" /> <span><strong>Student:</strong> {event.resource.student}</span></div>
        </div>
        <button
          onClick={handleJoinClassroom}
          className="w-full mt-8 bg-gradient-to-r from-blue-600 to-blue-500 text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-blue-500/40 transition-all duration-300 transform hover:-translate-y-0.5"
        >
          <FaVideo />
          Enter Classroom
        </button>
      </motion.div>
    </motion.div>
  );
};


export default function TimetableWeekView() {
  const [events, setEvents] = useState<CustomEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [date, setDate] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState<CustomEvent | null>(null);

  const fetchEventsForRange = useCallback(async (rangeDate: Date) => {
    setLoading(true);
    const startDate = format(startOfWeek(rangeDate, { weekStartsOn: 1 }), 'yyyy-MM-dd');
    const endDate = format(endOfWeek(rangeDate, { weekStartsOn: 1 }), 'yyyy-MM-dd');
    try {
      const res = await apiClient.get('/spwapi/auth/course/time/range', { start_date: startDate, end_date: endDate });
      if (res && res.code === 0 && Array.isArray(res.data)) {
        const newEvents: CustomEvent[] = res.data.map((item: CourseTimeItem) => ({
          id: item.id,
          title: '',
          start: new Date(`${item.lesson_date.slice(0, 10)}T${item.start_time}`),
          end: new Date(`${item.lesson_date.slice(0, 10)}T${item.end_time}`),
          resource: { teacher: item.teacher_name, student: item.student_name, courseName: item.course_name },
        }));
        setEvents(newEvents);
      } else if (res?.msg) {
        toast.error(res.msg);
      }
    } catch (e: any) {
      if (e.message) toast.error(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEventsForRange(date);
  }, [date, fetchEventsForRange]);
  
  const handleSelectEvent = useCallback((event: BigCalendarEvent) => {
    setSelectedEvent(event as CustomEvent);
  }, []);

  // --- FIXED Event Prop Getter for Colors ---
  const eventPropGetter = useCallback((event: CustomEvent) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Set to start of today for accurate comparison

    const eventStart = event.start || new Date(0);
    const eventEnd = event.end || new Date(0);

    const isTodayEvent =
      eventStart.getFullYear() === today.getFullYear() &&
      eventStart.getMonth() === today.getMonth() &&
      eventStart.getDate() === today.getDate();

    if (isTodayEvent) {
      return { className: 'rbc-event-today' };
    }

    if (eventEnd < today) {
      return { className: 'rbc-event-past' };
    }
    
    return { className: 'rbc-event-future' };
  }, []);

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
        className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 mb-6 relative"
      >
        {/* --- Global Styles for Calendar --- */}
        <style jsx global>{`
          .rbc-event { padding: 2px 6px; border: none; border-radius: 6px; color: white; transition: all 0.3s; cursor: pointer; }
          .rbc-event-past { background-color: #94a3b8; /* slate-400 */ }
          .rbc-event-future { background-color: #0284c7; /* sky-600 */ }
          .rbc-event-today { 
            background-color: #f59e0b; /* amber-500 */ 
            box-shadow: 0 0 12px 0px rgba(245, 158, 11, 0.5);
          }
          .rbc-event:hover { transform: scale(1.03); filter: brightness(1.1); }
          .rbc-event:focus { outline: none; }
          .rbc-day-slot .rbc-time-slot { border-top-color: #f1f5f9; }
          .rbc-header { border-bottom: 2px solid #e2e8f0; padding: 10px 5px; text-transform: capitalize; font-weight: 600; }
          .rbc-today { background-color: #fefce8; /* yellow-50 */ }
        `}</style>

        <BigCalendar
          localizer={localizer}
          events={events}
          date={date}
          onNavigate={setDate}
          onSelectEvent={handleSelectEvent}
          defaultView="week"
          views={['week']}
          style={{ height: 650 }}
          components={{
            event: CustomEventComponent,
            toolbar: CustomToolbar,
          }}
          tooltipAccessor={(e: CustomEvent) => `${e.resource.courseName}\nTeacher: ${e.resource.teacher}`}
        />
      </motion.div>

      <AnimatePresence>
        {selectedEvent && <EventDetailsModal event={selectedEvent} onClose={() => setSelectedEvent(null)} />}
      </AnimatePresence>
    </>
  );
} 