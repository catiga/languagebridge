'use client';
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FaTachometerAlt, FaUser, FaBookOpen, FaCalendarAlt, FaCog, FaUsers, FaVideo } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const menu = [
  { key: 'overview', label: 'Overview', icon: <FaTachometerAlt />, path: '/profile/overview', color: 'from-pink-400 to-pink-300' },
  { key: 'info', label: 'Profile', icon: <FaUser />, path: '/profile/info', color: 'from-blue-400 to-blue-300' },
  { key: 'courses', label: 'My Courses', icon: <FaBookOpen />, path: '/profile/courses', color: 'from-green-400 to-green-300' },
  { key: 'trial-lessons', label: 'Trial Lessons', icon: <FaVideo />, path: '/profile/trial-lessons', color: 'from-purple-400 to-blue-300' },
  { key: 'students', label: 'Students', icon: <FaUsers />, path: '/profile/students', color: 'from-blue-400 to-green-300' },
  { key: 'schedule', label: 'Schedule', icon: <FaCalendarAlt />, path: '/profile/schedule', color: 'from-yellow-400 to-yellow-300' },
  { key: 'study-planner', label: 'Study Planner', icon: <span className="text-2xl">📅</span>, path: '/profile/study-planner', color: 'from-blue-300 to-purple-200' },
  { key: 'ai-buddy', label: 'AI Buddy', icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 2a10 10 0 100 20 10 10 0 000-20zm0 4a2 2 0 110 4 2 2 0 010-4zm0 12a8 8 0 01-6.32-3.16c.03-2.67 4-4.14 6.32-4.14s6.29 1.47 6.32 4.14A8 8 0 0112 20z" /></svg>, path: '/profile/ai-buddy', color: 'from-yellow-300 to-yellow-200' },
  { key: 'setting', label: 'Settings', icon: <FaCog />, path: '/profile/setting', color: 'from-purple-400 to-purple-300' },
];

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const handleAIBuddyClick = (e: React.MouseEvent) => {
    e.preventDefault();
    toast.info('AI Buddy is coming soon!');
  };
  return (
    <div className="min-h-screen flex bg-gradient-to-br from-blue-50 via-pink-50 to-yellow-50">
      {/* Left Sidebar */}
      <nav className="w-64 min-h-screen py-10 px-4 flex flex-col gap-4 bg-white/80 shadow-2xl rounded-r-3xl">
        <div className="mb-8 text-2xl font-extrabold text-gray-700 tracking-wide text-center">Dashboard</div>
        {menu.map(item => {
          const active = pathname === item.path;
          const isAIBuddy = item.key === 'ai-buddy';
          return (
            <Link
              key={item.key}
              href={item.path}
              className={`flex items-center gap-3 px-5 py-3 rounded-2xl font-bold text-lg transition-all duration-200 shadow-md hover:scale-105
                ${active
                  ? `bg-gradient-to-r ${item.color} text-white`
                  : isAIBuddy
                    ? 'bg-yellow-50 text-yellow-700'
                    : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                }`}
              style={{ boxShadow: active ? '0 4px 24px 0 rgba(0,0,0,0.08)' : undefined }}
            >
              <span className={`text-xl ${
                active ? 'text-white' : isAIBuddy ? 'text-yellow-500' : 'text-blue-400'
              }`}>
                {item.icon}
              </span>
              {item.label}
              {isAIBuddy && !active && (
                <span className="ml-2 px-2 py-0.5 text-xs bg-yellow-200 text-yellow-800 rounded">Beta</span>
              )}
            </Link>
          );
        })}
      </nav>
      {/* Main Content */}
      <main className="flex-1 p-6 md:p-12 flex flex-col items-stretch">
        <AnimatePresence mode="wait">
          <motion.div
            key={pathname}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -30 }}
            transition={{ duration: 0.5, type: 'spring' }}
            className="flex-1"
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
} 