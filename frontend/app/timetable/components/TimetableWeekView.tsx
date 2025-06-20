'use client';
import React, { useMemo } from 'react';
import { Calendar as BigCalendar, dateFnsLocalizer, Event } from 'react-big-calendar';
import format from 'date-fns/format';
import parse from 'date-fns/parse';
import startOfWeek from 'date-fns/startOfWeek';
import getDay from 'date-fns/getDay';
import enUS from 'date-fns/locale/en-US';
import 'react-big-calendar/lib/css/react-big-calendar.css';

// 假数据，可后续替换为API
const timetableData = [
  { id: 1, date: '2024-07-20', time: '19:00', course: 'Spoken English', studentId: 1, student: 'Li Si', teacher: 'Teacher A', status: 'Upcoming' },
  { id: 2, date: '2024-07-21', time: '20:00', course: 'Grammar', studentId: 2, student: 'Wang Wu', teacher: 'Teacher B', status: 'Upcoming' },
  { id: 3, date: '2024-07-20', time: '20:00', course: 'Reading', studentId: 2, student: 'Wang Wu', teacher: 'Teacher C', status: 'Upcoming' },
];

const locales = { 'en-US': enUS };
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 1 }),
  getDay,
  locales,
});

function toEvents(data: typeof timetableData): Event[] {
  return data.map(item => {
    const [hour, minute] = item.time.split(':').map(Number);
    const start = new Date(item.date);
    start.setHours(hour, minute, 0, 0);
    // 假设每节课1小时
    const end = new Date(start.getTime() + 60 * 60 * 1000);
    return {
      id: item.id,
      title: `${item.course} (${item.student})`,
      start,
      end,
      resource: item,
    };
  });
}

export default function TimetableWeekView() {
  const events = useMemo(() => toEvents(timetableData), []);
  return (
    <div className="bg-white rounded-xl shadow-md p-4 mb-6">
      <h3 className="text-xl font-bold mb-4">Timetable (Week View)</h3>
      <BigCalendar
        localizer={localizer}
        events={events}
        defaultView="week"
        views={['week']}
        style={{ height: 500 }}
        startAccessor="start"
        endAccessor="end"
        titleAccessor="title"
        eventPropGetter={() => ({
          style: {
            backgroundColor: '#2563eb',
            color: 'white',
            borderRadius: '4px',
            border: 'none',
            padding: '2px 4px',
          }
        })}
        tooltipAccessor={event => `${event.title}\n${event.resource.teacher}`}
      />
    </div>
  );
} 