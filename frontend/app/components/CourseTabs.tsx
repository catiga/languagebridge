'use client';
import React, { useState, useMemo, useEffect } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { Calendar as BigCalendar, dateFnsLocalizer, Event } from 'react-big-calendar';
import { format } from 'date-fns/format';
import { parse } from 'date-fns/parse';
import { startOfWeek } from 'date-fns/startOfWeek';
import { getDay } from 'date-fns/getDay';
import { enUS } from 'date-fns/locale/en-US';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import SystemCourses from './SystemCourses'; // 导入新组件
import { apiClient } from '../utils/api';
import { toast } from 'react-toastify';
import TimetableListView from '../timetable/components/TimetableListView';
import TimetableWeekView from '../timetable/components/TimetableWeekView';
import { FaStar, FaChalkboardTeacher, FaPlayCircle, FaCheckCircle, FaPauseCircle } from 'react-icons/fa';
import { useSearchParams, useRouter } from 'next/navigation';

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
  { key: 'ongoing', label: 'Ongoing' },
  { key: 'complete', label: 'Complete' },
  { key: 'inactive', label: 'Inactive' },
];

export default function CourseTabs({ onLoading }: { onLoading?: (loading: boolean) => void }) {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab');
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'mycourses' | 'timetable' | 'history' | 'systemcourses'>(
    tabParam === 'systemcourses' ? 'systemcourses' :
    tabParam === 'timetable' ? 'timetable' :
    tabParam === 'history' ? 'history' :
    'mycourses'
  );
  const [viewMode, setViewMode] = useState<'list' | 'week'>('list');
  const [selectedStudent, setSelectedStudent] = useState<number | null>(null);
  const [myCourses, setMyCourses] = useState<any[]>([]);
  const [myCoursesLoading, setMyCoursesLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');

  // 监听tab参数变化，动态切换tab
  useEffect(() => {
    if (tabParam && tabParam !== activeTab) {
      setActiveTab(
        tabParam === 'systemcourses' ? 'systemcourses' :
        tabParam === 'timetable' ? 'timetable' :
        tabParam === 'history' ? 'history' :
        'mycourses'
      );
    }
  }, [tabParam]);

  // 拉取我的课程
  useEffect(() => {
    if (activeTab === 'mycourses') {
      fetchMyCourses(statusFilter);
    }
    // eslint-disable-next-line
  }, [activeTab, statusFilter]);

  // 默认切到 Timetable 时跳转到 List View
  useEffect(() => {
    if (activeTab === 'timetable') {
      setViewMode('list');
    }
  }, [activeTab]);

  const fetchMyCourses = async (status = 'all') => {
    setMyCoursesLoading(true);
    onLoading && onLoading(true);
    try {
      const res: any = await apiClient.get('/spwapi/auth/course/list', { status });
      if (res && res.code === 0) {
        if ( Array.isArray(res.data)) {
          setMyCourses(res.data);
        } else {
          setMyCourses([]);  
        }
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

  // 后端已做过滤，前端不再二次过滤
  const filteredCourses = myCourses;

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
          <button
            className={`px-3 py-1 rounded ${viewMode === 'list' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
            onClick={() => setViewMode('list')}
          >List View</button>
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
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
              {filteredCourses.map((course) => (
                <div
                  key={course.user_course_id}
                  className="relative bg-gradient-to-br from-green-50 to-blue-50 rounded-2xl shadow-lg overflow-hidden transition-all duration-300 group hover:shadow-green-200 hover:-translate-y-2 cursor-pointer flex flex-col"
                  onClick={() => router.push(`/mycourses/${course.course_id}`)}
                >
                  <div className="relative w-full h-40">
                    <img src={course.course_picture ? course.course_picture : '/default-course-image.svg'} alt={course.course_name} className="w-full h-full object-cover" />
                    <span className="absolute top-3 right-3">
                      {course.uc_status === 'ongoing' && <FaPlayCircle className="text-blue-500 text-2xl" title="Ongoing" />}
                      {course.uc_status === 'complete' && <FaCheckCircle className="text-green-500 text-2xl" title="Complete" />}
                      {course.uc_status === 'inactive' && <FaPauseCircle className="text-gray-400 text-2xl" title="Inactive" />}
                      {(!course.uc_status || course.uc_status === 'all') && <FaStar className="text-yellow-400 text-2xl" title="All" />}
                    </span>
                  </div>
                  <div className="p-4 flex-1 flex flex-col">
                    <h4 className="text-lg font-bold text-gray-900 truncate mb-1">{course.course_name}</h4>
                    <p className="text-sm text-gray-600 mb-2 line-clamp-2">{course.introduction}</p>
                    <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                      <span className="bg-cyan-100 text-cyan-700 px-2 py-0.5 rounded">{course.language}</span>
                      <span className="bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded">Level {course.level}</span>
                      
                    </div>
                    <div className="flex items-center justify-between mt-auto">
                      <span className="text-xs text-gray-500">{course.goal}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-2 text-xs text-gray-400">
                      <span>Joined: {course.user_course_add_time ? new Date(course.user_course_add_time).toLocaleDateString() : '-'}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      {activeTab === 'systemcourses' && <SystemCourses />}
      {activeTab === 'timetable' && viewMode === 'list' && <TimetableListView />}
      {activeTab === 'timetable' && viewMode === 'week' && <TimetableWeekView />}
      {activeTab === 'history' && <CourseHistory />}
    </div>
  );
}
