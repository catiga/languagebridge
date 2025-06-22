'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FaTachometerAlt,
  FaUserCircle,
  FaCertificate,
  FaBook,
  FaUsers,
  FaCalendarAlt,
  FaCalendarWeek,
  FaChartBar,
  FaCog,
  FaBell,
  FaSignOutAlt,
  FaChevronLeft,
  FaChevronRight,
  FaGraduationCap
} from 'react-icons/fa';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Cookies from 'js-cookie';

interface DashboardLayoutProps {
  children: React.ReactNode;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const menuItems = [
  { id: 'overview', label: 'Overview', icon: FaTachometerAlt },
  { id: 'profile', label: 'Profile', icon: FaUserCircle },
  { id: 'certificates', label: 'Certificates', icon: FaCertificate },
  { id: 'courses', label: 'Courses', icon: FaBook },
  { id: 'students', label: 'Students', icon: FaUsers },
  { id: 'schedule', label: 'Time Slots', icon: FaCalendarAlt },
  { id: 'schedule2', label: 'Schedule', icon: FaCalendarWeek },
  { id: 'analytics', label: 'Analytics', icon: FaChartBar },
];

const bottomMenuItems = [
  { id: 'settings', label: 'Settings', icon: FaCog },
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
    <div className="min-h-screen bg-gray-50">
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} />

      {/* Sidebar */}
      <motion.aside
        layout
        initial={{ x: -256 }}
        animate={{ x: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className={`fixed top-0 left-0 h-full bg-white border-r border-gray-200 z-40 flex flex-col ${sidebarCollapsed ? 'w-20' : 'w-64'}`}
      >
        <div className={`flex items-center justify-between p-4 border-b border-gray-200 ${sidebarCollapsed ? 'h-20' : ''}`}>
          {!sidebarCollapsed && (
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg">
                <FaGraduationCap className="text-white h-6 w-6" />
              </div>
              <span className="font-bold text-lg text-gray-800">Teacher</span>
            </div>
          )}
          <button onClick={() => setSidebarCollapsed(!sidebarCollapsed)} className="p-2 rounded-md hover:bg-gray-100">
            {sidebarCollapsed ? <FaChevronRight className="text-gray-600"/> : <FaChevronLeft className="text-gray-600" />}
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {menuItems.map(item => (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`w-full flex items-center p-3 rounded-lg transition-colors ${
                activeTab === item.id ? 'bg-blue-500 text-white shadow-md' : 'text-gray-600 hover:bg-gray-100'
              } ${sidebarCollapsed ? 'justify-center' : ''}`}
            >
              <item.icon className={`h-5 w-5 ${!sidebarCollapsed ? 'mr-3' : ''}`} />
              {!sidebarCollapsed && <span>{item.label}</span>}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-200">
           <div className="space-y-2">
            {bottomMenuItems.map(item => (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                 className={`w-full flex items-center p-3 rounded-lg transition-colors ${
                  activeTab === item.id ? 'bg-blue-500 text-white shadow-md' : 'text-gray-600 hover:bg-gray-100'
                } ${sidebarCollapsed ? 'justify-center' : ''}`}
              >
                <item.icon className={`h-5 w-5 ${!sidebarCollapsed ? 'mr-3' : ''}`} />
                {!sidebarCollapsed && <span>{item.label}</span>}
              </button>
            ))}
          </div>
          <button
              onClick={handleLogout}
              className={`w-full flex items-center p-3 mt-2 rounded-lg transition-colors text-red-500 hover:bg-red-50 ${sidebarCollapsed ? 'justify-center' : ''}`}
            >
            <FaSignOutAlt className={`h-5 w-5 ${!sidebarCollapsed ? 'mr-3' : ''}`} />
            {!sidebarCollapsed && <span>Logout</span>}
          </button>
        </div>
      </motion.aside>

      {/* Main Content */}
      <main className={`transition-all duration-300 ${sidebarCollapsed ? 'ml-20' : 'ml-64'}`}>
        <header className="sticky top-0 bg-white/70 backdrop-blur-sm border-b border-gray-200 p-4 z-30">
          <div className="flex justify-between items-center">
            {/* Can be used for breadcrumbs or page titles */}
            <h1 className="text-xl font-semibold text-gray-800 capitalize">{activeTab}</h1>
            <div className="flex items-center space-x-4">
              <button
                onClick={toggleOnlineStatus}
                className={`flex items-center space-x-2 px-3 py-1.5 rounded-full text-sm font-medium ${
                  isOnline ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-700'
                }`}
              >
                <span className={`h-2 w-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-gray-500'}`}></span>
                <span>{isOnline ? 'Online' : 'Offline'}</span>
              </button>
              {/* <button className="relative text-gray-500 hover:text-gray-800">
                <FaBell className="h-5 w-5" />
                <span className="absolute top-0 right-0 h-2 w-2 bg-red-500 rounded-full"></span>
              </button> */}
            </div>
          </div>
        </header>

        <div className="p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
} 