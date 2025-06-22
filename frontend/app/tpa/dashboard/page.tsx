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
  FaStar as FaStarIcon
} from 'react-icons/fa';
import Cookies from 'js-cookie';
import DashboardLayout from './components/DashboardLayout';
import ProfileManagement from './components/ProfileManagement';
import CertificateManagement from './components/CertificateManagement';
import CourseManagement from './components/CourseManagement';
import TimeSlotManagement from './components/TimeSlotManagement';
import TeacherScheduleWeekView from './components/TeacherScheduleWeekView';
import SettingPanel from './components/SettingPanel';

interface DashboardStats {
  totalStudents: number;
  totalLessons: number;
  averageRating: number;
  totalEarnings: number;
  activeCourses: number;
  pendingBookings: number;
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

type Tab = 'overview' | 'profile' | 'certificates' | 'courses' | 'students' | 'schedule' | 'analytics' | 'settings' | 'schedule2';

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
    <div className="flex flex-wrap gap-4 mt-2">
      <button onClick={() => onAction('courses')} className="bg-blue-500 hover:bg-blue-600 text-white px-5 py-2 rounded-xl shadow font-medium">Add Course</button>
      <button onClick={() => onAction('schedule')} className="bg-purple-500 hover:bg-purple-600 text-white px-5 py-2 rounded-xl shadow font-medium">Set Time Slots</button>
      <button onClick={() => onAction('certificates')} className="bg-green-500 hover:bg-green-600 text-white px-5 py-2 rounded-xl shadow font-medium">Manage Certificates</button>
      <button onClick={() => onAction('profile')} className="bg-gray-500 hover:bg-gray-600 text-white px-5 py-2 rounded-xl shadow font-medium">Go to Profile</button>
    </div>
  );
}

export default function TeacherDashboard() {
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [stats] = useState<DashboardStats>({
    totalStudents: 127,
    totalLessons: 342,
    averageRating: 4.8,
    totalEarnings: 2847,
    activeCourses: 8,
    pendingBookings: 12,
  });

  const [recentActivities] = useState<RecentActivity[]>([
    {
      id: 1,
      type: 'lesson',
      title: 'English Speaking Course',
      description: 'Completed lesson 15 with Sarah Johnson',
      time: '2 hours ago',
      icon: <FaPlayIcon className="w-4 h-4" />,
      color: 'bg-green-100 text-green-600'
    },
    {
      id: 2,
      type: 'booking',
      title: 'New Booking',
      description: 'Mike Chen booked IELTS course for next Wednesday',
      time: '4 hours ago',
      icon: <FaCalendarAltIcon className="w-4 h-4" />,
      color: 'bg-blue-100 text-blue-600'
    },
    {
      id: 3,
      type: 'review',
      title: 'New Review',
      description: 'Emma Wilson gave you a 5-star rating',
      time: '6 hours ago',
      icon: <FaStarIcon className="w-4 h-4" />,
      color: 'bg-yellow-100 text-yellow-600'
    },
    {
      id: 4,
      type: 'certificate',
      title: 'Certificate Updated',
      description: 'Your TESOL certificate has been updated',
      time: '1 day ago',
      icon: <FaCertificate className="w-4 h-4" />,
      color: 'bg-purple-100 text-purple-600'
    },
  ]);

  useEffect(() => {
    // Check teacher login status
    const teacherToken = Cookies.get('teacherToken');
    if (!teacherToken) {
      window.location.href = '/tpa/login';
    }
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
            <WelcomeBanner teacherName="catiga03" avatarUrl={undefined} />
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              <StatsCard label="Total Students" value={stats.totalStudents} icon={FaUsers} color="border-blue-400" />
              <StatsCard label="Total Lessons" value={stats.totalLessons} icon={FaBookOpen} color="border-green-400" />
              <StatsCard label="Average Rating" value={stats.averageRating} icon={FaStarIcon} color="border-yellow-400" />
              <StatsCard label="Total Earnings" value={`$${stats.totalEarnings}`} icon={FaPlayIcon} color="border-purple-400" />
              <StatsCard label="Active Courses" value={stats.activeCourses} icon={FaPlayIcon} color="border-indigo-400" />
              <StatsCard label="Pending Bookings" value={stats.pendingBookings} icon={FaCalendarAltIcon} color="border-pink-400" />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <SchedulePreview lessons={[]} />
              <RecentActivities activities={recentActivities} />
            </div>
            <QuickActions onAction={(tab) => setActiveTab(tab as Tab)} />
          </div>
        );
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
                { label: 'Average Rating', value: stats.averageRating, icon: FaStarIcon, color: 'from-yellow-500 to-orange-500' },
                { label: 'Total Earnings', value: `$${stats.totalEarnings}`, icon: FaPlayIcon, color: 'from-purple-500 to-pink-500' },
                { label: 'Active Courses', value: stats.activeCourses, icon: FaPlayIcon, color: 'from-indigo-500 to-purple-500' },
                { label: 'Pending Bookings', value: stats.pendingBookings, icon: FaCalendarAltIcon, color: 'from-red-500 to-pink-500' },
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
                  {recentActivities.map((activity, index) => (
                    <motion.div
                      key={activity.id}
                      initial={{ x: 50, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: 0.1 * index }}
                      whileHover={{ x: 5 }}
                      className="flex items-center space-x-4 p-4 bg-gray-50/50 rounded-xl hover:bg-gray-100/50 transition-colors"
                    >
                      {/* 这里应有内容，暂时留空或补充实际内容 */}
                    </motion.div>
                  ))}
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