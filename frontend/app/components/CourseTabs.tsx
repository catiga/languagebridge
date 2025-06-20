'use client';
import React, { useState, useMemo, useEffect } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { Calendar as BigCalendar, dateFnsLocalizer, Event } from 'react-big-calendar';
import format from 'date-fns/format';
import parse from 'date-fns/parse';
import startOfWeek from 'date-fns/startOfWeek';
import getDay from 'date-fns/getDay';
import enUS from 'date-fns/locale/en-US';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import SystemCourses from './SystemCourses'; // 导入新组件
import { apiClient } from '../utils/api';
import { toast } from 'react-toastify';

// 假数据
const students = [
  { id: 1, name: 'Li Si' },
  { id: 2, name: 'Wang Wu' },
];
const timetableData = [
  { id: 1, date: '2024-07-20', time: '19:00', course: 'Spoken English', studentId: 1, student: 'Li Si', teacher: 'Teacher A', status: 'Upcoming' },
  { id: 2, date: '2024-07-21', time: '20:00', course: 'Grammar', studentId: 2, student: 'Wang Wu', teacher: 'Teacher B', status: 'Upcoming' },
  { id: 3, date: '2024-07-20', time: '20:00', course: 'Reading', studentId: 2, student: 'Wang Wu', teacher: 'Teacher C', status: 'Upcoming' },
];

// big-calendar 本地化
const locales = { 'en-US': enUS };
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 1 }),
  getDay,
  locales,
});

// 转换为 big-calendar 事件格式
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

function MyCourses() {
  return (
    <div className="bg-white rounded-xl shadow-md p-8 mb-6">
      <h3 className="text-xl font-bold mb-4">My Courses</h3>
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-gray-100">
            <th className="py-2 px-4">Course</th>
            <th className="py-2 px-4">Student</th>
            <th className="py-2 px-4">Teacher</th>
            <th className="py-2 px-4">Time</th>
            <th className="py-2 px-4">Status</th>
            <th className="py-2 px-4">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="py-2 px-4">Spoken English</td>
            <td className="py-2 px-4">Li Si</td>
            <td className="py-2 px-4">Teacher A</td>
            <td className="py-2 px-4">2024-07-20 19:00</td>
            <td className="py-2 px-4">Upcoming</td>
            <td className="py-2 px-4">
              <button className="text-blue-600 hover:underline mr-2">Enter</button>
              <button className="text-yellow-600 hover:underline">Rate</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

function TimetableListView({ filtered }: { filtered: typeof timetableData }) {
  return (
    <div className="bg-white rounded-xl shadow-md p-8 mb-6">
      <h3 className="text-xl font-bold mb-4">Timetable (List View)</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-100">
              <th className="py-2 px-4">Date</th>
              <th className="py-2 px-4">Time</th>
              <th className="py-2 px-4">Course</th>
              <th className="py-2 px-4">Student</th>
              <th className="py-2 px-4">Teacher</th>
              <th className="py-2 px-4">Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(item => (
              <tr key={item.id}>
                <td className="py-2 px-4">{item.date}</td>
                <td className="py-2 px-4">{item.time}</td>
                <td className="py-2 px-4">{item.course}</td>
                <td className="py-2 px-4">{item.student}</td>
                <td className="py-2 px-4">{item.teacher}</td>
                <td className="py-2 px-4">{item.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function TimetableCalendarView({ filtered }: { filtered: typeof timetableData }) {
  const [selectedDateCourses, setSelectedDateCourses] = useState<any[] | null>(null);

  // 生成课程日期集合
  const courseMap: Record<string, any[]> = {};
  filtered.forEach(item => {
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

function TimetableWeekView({ filtered }: { filtered: typeof timetableData }) {
  // 转换为 big-calendar 事件
  const events = useMemo(() => toEvents(filtered), [filtered]);
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

function CourseHistory() {
  return (
    <div className="bg-white rounded-xl shadow-md p-8 mb-6">
      <h3 className="text-xl font-bold mb-4">Course History</h3>
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-gray-100">
            <th className="py-2 px-4">Course</th>
            <th className="py-2 px-4">Student</th>
            <th className="py-2 px-4">Teacher</th>
            <th className="py-2 px-4">Time</th>
            <th className="py-2 px-4">Attendance</th>
            <th className="py-2 px-4">Rating</th>
            <th className="py-2 px-4">Feedback</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="py-2 px-4">Spoken English</td>
            <td className="py-2 px-4">Li Si</td>
            <td className="py-2 px-4">Teacher A</td>
            <td className="py-2 px-4">2024-07-10 19:00</td>
            <td className="py-2 px-4">Present</td>
            <td className="py-2 px-4">5 stars</td>
            <td className="py-2 px-4">
              <button className="text-blue-600 hover:underline">Feedback</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

const statusTabs = [
  { key: 'all', label: 'All' },
  { key: '00', label: 'Active' },
  { key: '01', label: 'Inactive' },
  { key: '02', label: 'Completed' },
  // 你可以根据实际 user_course_status 增加更多
];

export default function CourseTabs({ onLoading }: { onLoading?: (loading: boolean) => void }) {
  const [activeTab, setActiveTab] = useState<'mycourses' | 'timetable' | 'history' | 'systemcourses'>('mycourses');
  const [viewMode, setViewMode] = useState<'list' | 'calendar' | 'week'>('list');
  const [selectedStudent, setSelectedStudent] = useState<number | null>(null);
  const [myCourses, setMyCourses] = useState<any[]>([]);
  const [myCoursesLoading, setMyCoursesLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');

  // 过滤数据
  const filtered = timetableData.filter(item => !selectedStudent || item.studentId === selectedStudent);

  // 拉取我的课程
  useEffect(() => {
    if (activeTab === 'mycourses') {
      fetchMyCourses();
    }
    // eslint-disable-next-line
  }, [activeTab]);

  const fetchMyCourses = async () => {
    setMyCoursesLoading(true);
    onLoading && onLoading(true);
    try {
      const res = await apiClient.get('/spwapi/auth/course/list');
      if (res && res.code === 0 && Array.isArray(res.data)) {
        setMyCourses(res.data);
      } else {
        setMyCourses([]);
        toast.error(res?.msg || 'Failed to fetch courses.');
      }
    } catch (e: any) {
      setMyCourses([]);
      toast.error(e?.message || 'Failed to fetch courses.');
    } finally {
      setMyCoursesLoading(false);
      onLoading && onLoading(false);
    }
  };

  const filteredCourses = statusFilter === 'all'
    ? myCourses
    : myCourses.filter(c => c.user_course_status === statusFilter);

  return (
    <div>
      <div className="flex border-b mb-4 space-x-6">
        <button className={activeTab === 'systemcourses' ? 'border-b-2 border-blue-600 font-bold px-4 py-2' : 'px-4 py-2'} onClick={() => setActiveTab('systemcourses')}>All Courses</button>
        <button
          className={`px-4 py-2 ${activeTab === 'mycourses' ? 'border-b-2 border-blue-600 font-bold' : ''}`}
          onClick={() => setActiveTab('mycourses')}
        >
          My Courses
        </button>
        <button className={activeTab === 'timetable' ? 'border-b-2 border-blue-600 font-bold px-4 py-2' : 'px-4 py-2'} onClick={() => setActiveTab('timetable')}>Timetable</button>
        <button className={activeTab === 'history' ? 'border-b-2 border-blue-600 font-bold px-4 py-2' : 'px-4 py-2'} onClick={() => setActiveTab('history')}>Course History</button>
      </div>
      {activeTab === 'timetable' && (
        <div className="mb-4 flex items-center space-x-4">
          <label>Student:</label>
          <select
            className="border px-2 py-1 rounded"
            value={selectedStudent ?? ''}
            onChange={e => setSelectedStudent(e.target.value ? Number(e.target.value) : null)}
          >
            <option value="">All</option>
            {students.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
          <button
            className={`px-3 py-1 rounded ${viewMode === 'list' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
            onClick={() => setViewMode('list')}
          >List View</button>
          <button
            className={`px-3 py-1 rounded ${viewMode === 'calendar' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
            onClick={() => setViewMode('calendar')}
          >Calendar View</button>
          <button
            className={`px-3 py-1 rounded ${viewMode === 'week' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
            onClick={() => setViewMode('week')}
          >Week View</button>
        </div>
      )}
      {activeTab === 'mycourses' && (
        <div className="bg-white rounded-xl shadow-md p-6 mt-4">
          <h2 className="text-xl font-bold mb-4">My Courses</h2>
          {/* 状态筛选Tab */}
          <div className="flex gap-4 mb-4">
            {statusTabs.map(tab => (
              <button
                key={tab.key}
                className={`px-3 py-1 rounded ${statusFilter === tab.key ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}
                onClick={() => setStatusFilter(tab.key)}
              >
                {tab.label}
              </button>
            ))}
          </div>
          {myCoursesLoading ? (
            <div className="py-8 text-center text-gray-500">Loading...</div>
          ) : myCourses.length === 0 ? (
            <div className="py-8 text-center text-gray-500">No courses found.</div>
          ) : (
            <table className="min-w-full">
              <thead>
                <tr className="bg-gray-100">
                  <th className="py-2 px-4 text-left font-semibold">Course Name</th>
                  <th className="py-2 px-4 text-left font-semibold">Introduction</th>
                  <th className="py-2 px-4 text-left font-semibold">Language</th>
                  <th className="py-2 px-4 text-left font-semibold">Level</th>
                  <th className="py-2 px-4 text-left font-semibold">Price</th>
                  <th className="py-2 px-4 text-left font-semibold">Goal</th>
                  <th className="py-2 px-4 text-left font-semibold">Join Time</th>
                  <th className="py-2 px-4 text-left font-semibold">Status</th>
                  <th className="py-2 px-4 text-left font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCourses.map((course) => (
                  <tr key={course.user_course_id} className="hover:bg-gray-50">
                    <td className="py-2 px-4">{course.course_name}</td>
                    <td className="py-2 px-4">{course.introduction}</td>
                    <td className="py-2 px-4">{course.language}</td>
                    <td className="py-2 px-4">{course.level}</td>
                    <td className="py-2 px-4">${course.display_price}</td>
                    <td className="py-2 px-4">{course.goal}</td>
                    <td className="py-2 px-4">
                      {course.user_course_add_time
                        ? new Date(course.user_course_add_time).toLocaleString()
                        : '-'}
                    </td>
                    <td className="py-2 px-4">
                      {course.user_course_status === '00' ? 'inactive' : course.user_course_status}
                    </td>
                    <td className="py-2 px-4">
                      <div className="flex gap-2">
                        <button
                          className="text-blue-600 hover:underline"
                          onClick={() => {
                            window.open(`/mycourses/${course.course_id}`, '_blank');
                          }}
                        >
                          Details
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
      {activeTab === 'systemcourses' && <SystemCourses />}
      {activeTab === 'timetable' && viewMode === 'list' && <TimetableListView filtered={filtered} />}
      {activeTab === 'timetable' && viewMode === 'calendar' && <TimetableCalendarView filtered={filtered} />}
      {activeTab === 'timetable' && viewMode === 'week' && <TimetableWeekView filtered={filtered} />}
      {activeTab === 'history' && <CourseHistory />}
    </div>
  );
} 