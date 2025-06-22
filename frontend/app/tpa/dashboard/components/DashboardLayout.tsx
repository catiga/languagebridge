'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaUser, 
  FaCertificate, 
  FaBookOpen, 
  FaUsers, 
  FaCog, 
  FaChartLine, 
  FaCalendarAlt, 
  FaBell,
  FaSignOutAlt,
  FaGraduationCap,
  FaChevronLeft,
  FaChevronRight
} from 'react-icons/fa';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Cookies from 'js-cookie';

interface DashboardLayoutProps {
  children: React.ReactNode;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const menuItems = [
  { id: 'overview', name: 'Overview', icon: FaChartLine, color: 'from-blue-500 to-cyan-500' },
  { id: 'profile', name: 'Profile', icon: FaUser, color: 'from-pink-500 to-rose-500' },
  { id: 'certificates', name: 'Certificates', icon: FaCertificate, color: 'from-purple-500 to-indigo-500' },
  { id: 'courses', name: 'Courses', icon: FaBookOpen, color: 'from-blue-500 to-cyan-500' },
  { id: 'students', name: 'Students', icon: FaUsers, color: 'from-green-500 to-emerald-500' },
  { id: 'schedule', name: 'Schedule', icon: FaCalendarAlt, color: 'from-orange-500 to-red-500' },
  { id: 'analytics', name: 'Analytics', icon: FaChartLine, color: 'from-teal-500 to-blue-500' },
  { id: 'notifications', name: 'Notifications', icon: FaBell, color: 'from-yellow-500 to-orange-500' },
  { id: 'settings', name: 'Settings', icon: FaCog, color: 'from-gray-500 to-slate-500' },
];

export default function DashboardLayout({ children, activeTab, onTabChange }: DashboardLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isOnline, setIsOnline] = useState(true);

  const handleLogout = () => {
    Cookies.remove('teacherToken', { path: '/' });
    Cookies.remove('teacherInfo', { path: '/' });
    Cookies.remove('userType', { path: '/' });
    localStorage.removeItem('teacherToken');
    localStorage.removeItem('teacherInfo');
    localStorage.removeItem('userType');
    sessionStorage.removeItem('teacherToken');
    sessionStorage.removeItem('teacherInfo');
    sessionStorage.removeItem('userType');
    window.location.href = '/tpa/login';
  };

  const toggleOnlineStatus = () => {
    setIsOnline(!isOnline);
    toast.success(isOnline ? 'Set to offline' : 'Set to online');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
      <ToastContainer position="top-right" />
      
      {/* Header */}
      <motion.header 
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-white/80 backdrop-blur-md border-b border-white/20 shadow-lg fixed top-0 left-0 right-0 z-50"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center"
              >
                <FaGraduationCap className="w-6 h-6 text-white" />
              </motion.div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Teacher Dashboard
                </h1>
                <p className="text-sm text-gray-600">Welcome back, Educator!</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={toggleOnlineStatus}
                className={`flex items-center space-x-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                  isOnline 
                    ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-gray-500'}`} />
                <span>{isOnline ? 'Online' : 'Offline'}</span>
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="relative p-2 text-gray-600 hover:text-blue-600 transition-colors"
              >
                <FaBell className="w-5 h-5" />
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleLogout}
                className="flex items-center space-x-2 px-4 py-2 bg-red-100 text-red-700 rounded-full hover:bg-red-200 transition-colors"
              >
                <FaSignOutAlt className="w-4 h-4" />
                <span>Logout</span>
              </motion.button>
            </div>
          </div>
        </div>
      </motion.header>

      <div className="flex pt-20">
        {/* Sidebar */}
        <motion.aside
          initial={{ x: -300, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className={`bg-white/80 backdrop-blur-md shadow-lg border-r border-white/20 transition-all duration-300 ${
            sidebarCollapsed ? 'w-16' : 'w-64'
          } fixed left-0 top-20 h-full z-40`}
        >
          <div className="p-4">
            <div className="flex justify-between items-center mb-6">
              {!sidebarCollapsed && <h3 className="text-lg font-semibold text-gray-900">Menu</h3>}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="p-2 text-gray-600 hover:text-blue-600 transition-colors"
              >
                {sidebarCollapsed ? <FaChevronRight /> : <FaChevronLeft />}
              </motion.button>
            </div>
            
            <div className="space-y-2">
              {menuItems.map((item, index) => (
                <motion.button
                  key={item.id}
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.05 * index }}
                  whileHover={{ x: 5, scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => onTabChange(item.id)}
                  className={`w-full flex items-center space-x-3 p-3 rounded-xl transition-all duration-300 ${
                    activeTab === item.id 
                      ? 'bg-gradient-to-r ' + item.color + ' text-white shadow-lg' 
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <item.icon className="w-5 h-5 flex-shrink-0" />
                  {!sidebarCollapsed && <span className="font-medium">{item.name}</span>}
                </motion.button>
              ))}
            </div>
          </div>
        </motion.aside>

        {/* Main Content */}
        <motion.main
          initial={{ x: 50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className={`flex-1 transition-all duration-300 ${
            sidebarCollapsed ? 'ml-16' : 'ml-64'
          }`}
        >
          <div className="p-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                {children}
              </motion.div>
            </AnimatePresence>
          </div>
        </motion.main>
      </div>
    </div>
  );
} 