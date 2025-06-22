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

type Tab = 'overview' | 'profile' | 'certificates' | 'courses' | 'students' | 'schedule' | 'analytics' | 'notifications' | 'settings';

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
      case 'overview':
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
                      <div className={`w-10 h-10 ${activity.color} rounded-full flex items-center justify-center`}>
                        {activity.icon}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{activity.title}</h4>
                        <p className="text-sm text-gray-600">{activity.description}</p>
                      </div>
                      <span className="text-xs text-gray-500">{activity.time}</span>
                    </motion.div>
                  ))}
                </div>
              </motion.div>

              {/* Quick Actions */}
              <motion.div
                initial={{ x: 50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20"
              >
                <h3 className="text-lg font-semibold text-gray-900 mb-6">Quick Actions</h3>
                <div className="grid grid-cols-1 gap-4">
                  {[
                    { title: 'Create New Course', icon: FaPlus, color: 'from-green-500 to-emerald-500', action: () => console.log('Create new course function') },
                    { title: 'View Students', icon: FaUsers, color: 'from-blue-500 to-cyan-500', action: () => console.log('View students function') },
                    { title: 'Schedule Course', icon: FaCalendarAltIcon, color: 'from-purple-500 to-pink-500', action: () => console.log('Schedule course function') },
                    { title: 'View Reviews', icon: FaStarIcon, color: 'from-yellow-500 to-orange-500', action: () => console.log('View reviews function') },
                  ].map((action, index) => (
                    <motion.button
                      key={action.title}
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.1 * index + 0.4 }}
                      whileHover={{ scale: 1.05, y: -2 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={action.action}
                      className="flex items-center p-4 bg-gradient-to-r text-white font-medium rounded-xl shadow-md hover:shadow-lg transition-all"
                    >
                      <action.icon className="w-5 h-5 mr-3" />
                      {action.title}
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            </div>

            {/* Achievements */}
            <motion.div
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20"
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Achievement Badges</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { name: 'Excellent Teacher', icon: FaTrophy, color: 'from-yellow-400 to-orange-500', earned: true },
                  { name: '100 Lessons', icon: FaGraduationCap, color: 'from-blue-400 to-purple-500', earned: true },
                  { name: '5-Star Rating', icon: FaStarIcon, color: 'from-yellow-400 to-orange-500', earned: true },
                  { name: 'International Certified', icon: FaCertificate, color: 'from-green-400 to-emerald-500', earned: false },
                ].map((badge, index) => (
                  <motion.div
                    key={badge.name}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.1 * index }}
                    whileHover={{ scale: 1.05 }}
                    className={`text-center p-4 rounded-xl transition-all duration-300 ${
                      badge.earned 
                        ? 'bg-gradient-to-r ' + badge.color + ' text-white shadow-lg' 
                        : 'bg-gray-100 text-gray-400'
                    }`}
                  >
                    <badge.icon className="w-8 h-8 mx-auto mb-2" />
                    <p className="text-sm font-medium">{badge.name}</p>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        );
    }
  };

  return (
    <DashboardLayout
      activeTab={activeTab}
      onTabChange={(tab) => setActiveTab(tab as Tab)}
    >
      {renderContent()}
    </DashboardLayout>
  );
} 