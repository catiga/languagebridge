'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  FaUsers, 
  FaBookOpen, 
  FaPlus,
  FaTrophy,
  FaGraduationCap,
  FaCertificate,
  FaPlay as FaPlayIcon,
  FaCalendarAlt as FaCalendarAltIcon,
  FaStar as FaStarIcon,
  FaRobot
} from 'react-icons/fa';
import Cookies from 'js-cookie';
import DashboardLayout from './components/DashboardLayout';
import ProfileManagement from './components/ProfileManagement';
import CertificateManagement from './components/CertificateManagement';
import CourseManagement from './components/CourseManagement';
import TimeSlotManagement from './components/TimeSlotManagement';
import TeacherScheduleWeekView from './components/TeacherScheduleWeekView';
import SettingPanel from './components/SettingPanel';
import { apiClient } from '@/app/utils/api';

interface DashboardStats {
  totalStudents: number;
  totalLessons: number;
  averageRating: number;
  totalEarnings: number;
  activeCourses: number;
  pendingBookings: number;
  pastLessons: number;
}

interface RecentActivity {
  id: number;
  type: 'lesson' | 'booking' | 'review' | 'certificate';
  title: string;
  description: string;
  time: string;
  icon: React.ReactNode;
  color: string;
}

type Tab = 'overview' | 'profile' | 'certificates' | 'courses' | 'students' | 'schedule' | 'analytics' | 'settings' | 'schedule2' | 'ai';

function WeekRangeTitle() {
  // 取本地时间的本周一
  const today = new Date();
  const day = today.getDay();
  const monday = new Date(today);
  monday.setDate(today.getDate() - ((day === 0 ? 7 : day) - 1));
  monday.setHours(0, 0, 0, 0);
  const sunday = new Date(monday.getTime() + 6 * 24 * 60 * 60 * 1000);
  function formatDisplayDate(date: Date) {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
  return <>{formatDisplayDate(monday)} - {formatDisplayDate(sunday)}</>;
}

function WelcomeBanner({ teacherName, avatarUrl }: { teacherName: string, avatarUrl?: string }) {
  const today = new Date();
  const dateStr = today.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  return (
    <div className="flex items-center bg-gradient-to-r from-blue-100 to-purple-100 rounded-2xl p-6 mb-2 shadow">
      <img src={avatarUrl || '/default-avatar.svg'} alt="avatar" className="w-16 h-16 rounded-full border-4 border-white shadow mr-4" />
      <div>
        <div className="text-lg text-gray-700 mb-1">Welcome back,</div>
        <div className="text-2xl font-bold text-gray-900">{teacherName}</div>
        <div className="text-sm text-gray-400 mt-1">{dateStr}</div>
      </div>
    </div>
  );
}

function StatsCard({ label, value, icon: Icon, color }: any) {
  return (
    <div className={`flex items-center bg-white rounded-2xl shadow p-5 space-x-4 border-l-4 ${color}`}>
      <div className="bg-blue-100 p-3 rounded-xl"><Icon className="w-6 h-6 text-blue-500" /></div>
      <div>
        <div className="text-2xl font-bold text-gray-900">{value}</div>
        <div className="text-gray-500 text-sm font-medium">{label}</div>
      </div>
    </div>
  );
}

function SchedulePreview({ lessons }: { lessons: any[] }) {
  return (
    <div className="bg-white rounded-2xl shadow p-6 h-full">
      <div className="flex items-center justify-between mb-4">
        <div className="font-bold text-lg text-gray-800">This Week's Lessons</div>
      </div>
      {lessons.length === 0 ? (
        <div className="text-gray-400 text-sm text-center py-8">No lessons scheduled this week.</div>
      ) : (
        <ul className="divide-y divide-gray-100">
          {lessons.slice(0, 5).map((lesson, i) => (
            <li key={lesson.id || i} className="py-3 flex items-center space-x-3">
              <div className="flex-1">
                <div className="font-medium text-gray-800">{lesson.course_name}</div>
                <div className="text-xs text-gray-500">{lesson.start_time} - {lesson.end_time} | {lesson.lesson_date?.slice(0, 10)}</div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function RecentActivities({ activities }: { activities: any[] }) {
  return (
    <div className="bg-white rounded-2xl shadow p-6 h-full">
      <div className="font-bold text-lg text-gray-800 mb-4">Recent Activities</div>
      {activities.length === 0 ? (
        <div className="text-gray-400 text-sm text-center py-8">No recent activities.</div>
      ) : (
        <ul className="divide-y divide-gray-100">
          {activities.slice(0, 5).map((a, i) => (
            <li key={a.id || i} className="py-3 flex items-center space-x-3">
              <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full ${a.color}`}>{a.icon}</span>
              <div className="flex-1">
                <div className="font-medium text-gray-800">{a.title}</div>
                <div className="text-xs text-gray-500">{a.description}</div>
                <div className="text-xs text-gray-400">{a.time}</div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function QuickActions({ onAction }: { onAction: (tab: Tab) => void }) {
  return (
    <div className="flex flex-wrap gap-6 justify-center my-6">
      <button onClick={() => onAction('courses')} className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white px-6 py-4 rounded-2xl shadow-lg font-semibold text-lg transition-all duration-300 transform hover:-translate-y-1">
        <FaBookOpen className="w-6 h-6" /> Add Course
      </button>
      <button onClick={() => onAction('schedule')} className="flex items-center gap-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-6 py-4 rounded-2xl shadow-lg font-semibold text-lg transition-all duration-300 transform hover:-translate-y-1">
        <FaCalendarAltIcon className="w-6 h-6" /> Set Time Slots
      </button>
      <button onClick={() => onAction('certificates')} className="flex items-center gap-2 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white px-6 py-4 rounded-2xl shadow-lg font-semibold text-lg transition-all duration-300 transform hover:-translate-y-1">
        <FaCertificate className="w-6 h-6" /> Manage Certificates
      </button>
      <button onClick={() => onAction('profile')} className="flex items-center gap-2 bg-gradient-to-r from-gray-500 to-gray-700 hover:from-gray-600 hover:to-gray-800 text-white px-6 py-4 rounded-2xl shadow-lg font-semibold text-lg transition-all duration-300 transform hover:-translate-y-1">
        <FaUsers className="w-6 h-6" /> Go to Profile
      </button>
    </div>
  );
}

function AIToolsPanel() {
  const [topic, setTopic] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState('');

  const handleGenerate = async () => {
    if (!topic.trim()) return;
    setLoading(true);
    setResult('');
    // mock AI生成，实际可调用后端AI接口
    setTimeout(() => {
      setResult(`Lesson Plan for: ${topic}\n\n1. Objectives: ...\n2. Key Points: ...\n3. Activities: ...\n4. Homework: ...`);
      setLoading(false);
    }, 1500);
  };

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-lg p-8 mt-8">
      <div className="flex items-center mb-6">
        <FaRobot className="w-8 h-8 text-blue-500 mr-3" />
        <h2 className="text-2xl font-bold text-gray-900">AI Lesson Plan Generator <span className="ml-2 px-2 py-0.5 text-xs bg-yellow-200 text-yellow-800 rounded-full font-bold animate-pulse">Beta</span></h2>
      </div>
      <p className="text-gray-600 mb-4">Enter a lesson topic or goal, and AI will generate a structured English lesson plan for you.</p>
      <div className="flex gap-2 mb-4">
        <input
          type="text"
          value={topic}
          onChange={e => setTopic(e.target.value)}
          className="flex-1 px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
          placeholder="e.g. Present Perfect Tense"
        />
        <button
          onClick={handleGenerate}
          disabled={loading || !topic.trim()}
          className="px-6 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-all disabled:opacity-50"
        >
          {loading ? 'Generating...' : 'Generate'}
        </button>
      </div>
      {result && (
        <div className="bg-blue-50 rounded-lg p-4 text-gray-800 whitespace-pre-line mt-4 border border-blue-100">
          {result}
        </div>
      )}
    </div>
  );
}

export default function TeacherDashboard() {
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalLessons: 0,
    activeCourses: 0,
    pendingBookings: 0,
    pastLessons: 0,
  });
  const [teacherName, setTeacherName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>(undefined);
  const [weekLessons, setWeekLessons] = useState<any[]>([]);

  useEffect(() => {
    const teacherToken = Cookies.get('teacherToken');
    if (!teacherToken) {
      window.location.href = '/tpa/login';
    }
  }, []);

  useEffect(() => {
    async function fetchOverview() {
      try {
        const res = await apiClient.get<any>('/spwapi/tpa/auth/overview');
        if (res && res.code === 0 && res.data) {
          setStats({
            totalStudents: res.data.total_student_count,
            totalLessons: res.data.lesson_upcoming_count + res.data.lesson_past_count,
            activeCourses: res.data.my_course_count,
            pendingBookings: res.data.lesson_upcoming_count,
            pastLessons: res.data.lesson_past_count,
          });
          setWeekLessons(res.data.current_week_courses || []);
        }
      } catch (e) {}
    }
    fetchOverview();
  }, []);

  useEffect(() => {
    // 拉取教师profile，获取真实姓名和头像
    async function fetchProfile() {
      try {
        const res = await apiClient.get<any>('/spwapi/tpa/auth/profile/retrieve');
        if (res && res.code === 0 && res.data) {
          setTeacherName(res.data.name || res.data.first_name || 'Teacher');
          setAvatarUrl(res.data.avatar || '/default-avatar.svg');
        }
      } catch (e) {}
    }
    fetchProfile();
  }, []);

  const renderContent = () => {
    switch (activeTab) {
      case 'profile':
        return <ProfileManagement />;
      case 'certificates':
        return <CertificateManagement />;
      case 'courses':
        return <CourseManagement />;
      case 'schedule':
        return <TimeSlotManagement />;
      case 'schedule2':
        return <TeacherScheduleWeekView />;
      case 'settings':
        return <SettingPanel />;
      case 'overview':
        return (
          <div className="space-y-8">
            <WelcomeBanner teacherName={teacherName || 'Teacher'} avatarUrl={avatarUrl} />
            <QuickActions onAction={(tab) => setActiveTab(tab as Tab)} />
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
              <StatsCard label="Total Students" value={stats.totalStudents} icon={FaUsers} color="border-blue-400" />
              <StatsCard label="Active Courses" value={stats.activeCourses} icon={FaBookOpen} color="border-indigo-400" />
              <StatsCard label="Upcoming Lessons" value={stats.pendingBookings} icon={FaCalendarAltIcon} color="border-pink-400" />
              <StatsCard label="Past Lessons" value={stats.pastLessons} icon={FaBookOpen} color="border-green-400" />
            </div>
            <div className="bg-white rounded-2xl shadow p-6">
              <div className="font-bold text-lg text-gray-800 mb-4">This Week's Lessons</div>
              {weekLessons.length === 0 ? (
                <div className="text-gray-400 text-sm text-center py-8">No lessons scheduled this week.</div>
              ) : (
                <ul className="space-y-3">
                  {weekLessons.map((lesson, i) => {
                    const today = new Date();
                    const lessonDate = new Date(lesson.lesson_date);
                    const isPast = lessonDate < new Date(today.getFullYear(), today.getMonth(), today.getDate());
                    const isToday = lessonDate.getFullYear() === today.getFullYear() && lessonDate.getMonth() === today.getMonth() && lessonDate.getDate() === today.getDate();
                    const isFuture = lessonDate > new Date(today.getFullYear(), today.getMonth(), today.getDate());
                    let cardClass = '';
                    if (isPast) cardClass = 'bg-gray-100 text-gray-400 border border-gray-200';
                    else if (isToday) cardClass = 'bg-blue-50 border border-blue-300 shadow-blue-100 text-blue-900';
                    else if (isFuture) cardClass = 'bg-green-50 border border-green-300 text-green-900';
                    return (
                      <li key={lesson.book_id || i} className={`rounded-xl px-5 py-4 shadow-sm flex flex-col ${cardClass}`}>
                        <div className="font-semibold text-base mb-1 truncate">{lesson.course_name}</div>
                        <div className="flex items-center gap-4 text-xs">
                          <span>{lesson.start_time} - {lesson.end_time}</span>
                          <span>|</span>
                          <span>{lesson.lesson_date?.slice(0, 10)}</span>
                          {isPast && <span className="ml-2 px-2 py-0.5 rounded bg-gray-300 text-gray-600 text-xs">Past</span>}
                          {isToday && <span className="ml-2 px-2 py-0.5 rounded bg-blue-500 text-white text-xs">Today</span>}
                          {isFuture && <span className="ml-2 px-2 py-0.5 rounded bg-green-500 text-white text-xs">Upcoming</span>}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>
        );
      case 'ai':
        return <AIToolsPanel />;
      default:
        return (
          <div className="space-y-8">
            {/* Stats Cards */}
            <motion.div 
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6"
            >
              {[
                { label: 'Total Students', value: stats.totalStudents, icon: FaUsers, color: 'from-blue-500 to-cyan-500' },
                { label: 'Total Lessons', value: stats.totalLessons, icon: FaBookOpen, color: 'from-green-500 to-emerald-500' },
                { label: 'Active Courses', value: stats.activeCourses, icon: FaBookOpen, color: 'from-indigo-500 to-purple-500' },
                { label: 'Upcoming Lessons', value: stats.pendingBookings, icon: FaCalendarAltIcon, color: 'from-pink-500 to-red-500' },
              ].map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={{ y: 50, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.1 * index }}
                  whileHover={{ y: -5, scale: 1.02 }}
                  className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20 hover:shadow-xl transition-all duration-300"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                      <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                    </div>
                    <div className={`w-12 h-12 bg-gradient-to-r ${stat.color} rounded-xl flex items-center justify-center`}>
                      <stat.icon className="w-6 h-6 text-white" />
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Recent Activities */}
              <motion.div
                initial={{ x: -50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20"
              >
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">Recent Activities</h3>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="text-blue-600 hover:text-blue-700 font-medium"
                  >
                    View All
                  </motion.button>
                </div>
                <div className="space-y-4">
                  {/* 这里应有内容，暂时留空或补充实际内容 */}
                </div>
              </motion.div>
            </div>
          </div>
        );
    }
  };

  return (
    <DashboardLayout
      activeTab={activeTab}
      onTabChange={(tab) => setActiveTab(tab as Tab)}
    >
      {/* 顶部周范围标题，仅在schedule2时显示 */}
      {activeTab === 'schedule2' && (
        <div className="w-full flex justify-between items-center mb-4">
          <span className="text-2xl font-bold text-gray-800">
            {/* 这里动态获取本周范围 */}
            <WeekRangeTitle />
          </span>
        </div>
      )}
      {renderContent()}
    </DashboardLayout>
  );
}