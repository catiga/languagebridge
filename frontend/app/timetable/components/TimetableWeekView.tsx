'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { Calendar as BigCalendar, dateFnsLocalizer, Event } from 'react-big-calendar';
import format from 'date-fns/format';
import parse from 'date-fns/parse';
import startOfWeek from 'date-fns/startOfWeek';
import endOfWeek from 'date-fns/endOfWeek';
import getDay from 'date-fns/getDay';
import enUS from 'date-fns/locale/en-US';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { apiClient } from '../../utils/api';
import { toast } from 'react-toastify';

interface CourseTimeItem {
  id: number;
  lesson_date: string;
  start_time: string;
  end_time: string;
  status: string;
  course_name: string;  // 后台直接返回
  teacher_name: string; // 后台直接返回
  student_name: string; // 后台直接返回
}

const locales = { 'en-US': enUS };
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: (date) => startOfWeek(date, { weekStartsOn: 1 }), // Monday
  getDay,
  locales,
});

export default function TimetableWeekView() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(false);
  const [date, setDate] = useState(new Date());

  // 根据日期范围获取数据
  const fetchEventsForRange = useCallback(async (rangeDate: Date) => {
    setLoading(true);
    const startDate = format(startOfWeek(rangeDate, { weekStartsOn: 1 }), 'yyyy-MM-dd');
    const endDate = format(endOfWeek(rangeDate, { weekStartsOn: 1 }), 'yyyy-MM-dd');

    try {
      const res = await apiClient.get('/spwapi/auth/course/time/range', {
        start_date: startDate,
        end_date: endDate,
      });

      if (res && res.code === 0 && Array.isArray(res.data)) {
        const newEvents = res.data.map((item: CourseTimeItem) => {
          const lessonDate = item.lesson_date.slice(0, 10);
          const start = new Date(`${lessonDate}T${item.start_time}`);
          const end = new Date(`${lessonDate}T${item.end_time}`);

          return {
            id: item.id,
            title: `${item.course_name || 'Course'} - ${item.student_name || 'Student'}`,
            start,
            end,
            resource: { teacher: item.teacher_name || 'Teacher' },
          };
        });
        setEvents(newEvents);
      } else {
        setEvents([]);
        toast.error(res?.msg || '获取周课表失败');
      }
    } catch (e: any) {
      setEvents([]);
      toast.error(e?.message || '获取周课表失败');
    } finally {
      setLoading(false);
    }
  }, []);

  // 当日期变化时，获取数据
  useEffect(() => {
    fetchEventsForRange(date);
  }, [date, fetchEventsForRange]);

  const handleNavigate = (newDate: Date) => {
    setDate(newDate);
  };

  return (
    <div className="bg-white rounded-xl shadow-md p-4 mb-6 relative">
      <h3 className="text-xl font-bold mb-4">Timetable (Week View)</h3>
      {loading && (
        <div className="absolute inset-0 bg-white bg-opacity-50 flex items-center justify-center z-10">
          <div className="text-blue-600">Loading week...</div>
        </div>
      )}
      <BigCalendar
        localizer={localizer}
        events={events}
        date={date}
        onNavigate={handleNavigate}
        defaultView="week"
        views={['week']}
        style={{ height: 600 }}
        startAccessor="start"
        endAccessor="end"
        titleAccessor="title"
        tooltipAccessor={event => `${event.title}\nTeacher: ${event.resource.teacher}`}
        eventPropGetter={() => ({
          style: {
            backgroundColor: '#2563eb',
            color: 'white',
            borderRadius: '4px',
            border: 'none',
            padding: '2px 4px',
          },
        })}
      />
    </div>
  );
} 