'use client';
import React, { useState } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';

// 假数据，可后续替换为API
const timetableData = [
  { id: 1, date: '2024-07-20', time: '19:00', course: 'Spoken English', studentId: 1, student: 'Li Si', teacher: 'Teacher A', status: 'Upcoming' },
  { id: 2, date: '2024-07-21', time: '20:00', course: 'Grammar', studentId: 2, student: 'Wang Wu', teacher: 'Teacher B', status: 'Upcoming' },
  { id: 3, date: '2024-07-20', time: '20:00', course: 'Reading', studentId: 2, student: 'Wang Wu', teacher: 'Teacher C', status: 'Upcoming' },
];

export default function TimetableCalendarView() {
  const [selectedDateCourses, setSelectedDateCourses] = useState<any[] | null>(null);

  // 生成课程日期集合
  const courseMap: Record<string, any[]> = {};
  timetableData.forEach(item => {
    if (!courseMap[item.date]) courseMap[item.date] = [];
    courseMap[item.date].push(item);
  });

  return (
    <div className="bg-white rounded-xl shadow-md p-8 mb-6">
      <h3 className="text-xl font-bold mb-4">Timetable (Calendar View)</h3>
      <Calendar
        tileContent={({ date, view }) => {
          const d = date.toISOString().slice(0, 10);
          const courses = courseMap[d] || [];
          if (courses.length) {
            return (
              <div className="mt-1 flex flex-col items-start">
                {courses.map(c => (
                  <div
                    key={c.id}
                    className="text-xs bg-blue-100 text-blue-700 rounded px-1 py-0.5 mb-0.5 w-full truncate"
                    title={`${c.time} ${c.course} (${c.student})`}
                  >
                    {c.time} {c.course}
                  </div>
                ))}
              </div>
            );
          }
          return null;
        }}
        onClickDay={date => {
          const d = date.toISOString().slice(0, 10);
          const courses = courseMap[d] || [];
          setSelectedDateCourses(courses.length ? courses : null);
        }}
      />
      {/* 课程弹窗 */}
      {selectedDateCourses && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-30 z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
            <h4 className="text-lg font-bold mb-2">Courses on {selectedDateCourses[0].date}</h4>
            <ul>
              {selectedDateCourses.map(c => (
                <li key={c.id} className="mb-2">
                  <span className="font-semibold">{c.time}</span> - {c.course} ({c.student}) with {c.teacher}
                </li>
              ))}
            </ul>
            <div className="flex justify-end mt-4">
              <button
                className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
                onClick={() => setSelectedDateCourses(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 