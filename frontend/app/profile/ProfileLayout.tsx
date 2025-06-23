'use client';
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FaTachometerAlt, FaUser, FaBookOpen, FaCalendarAlt, FaCog } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';

const menu = [
  { key: 'overview', label: 'Overview', icon: <FaTachometerAlt />, path: '/profile/overview', color: 'from-pink-400 to-pink-300' },
  { key: 'info', label: 'Profile', icon: <FaUser />, path: '/profile/info', color: 'from-blue-400 to-blue-300' },
  { key: 'courses', label: 'My Courses', icon: <FaBookOpen />, path: '/profile/courses', color: 'from-green-400 to-green-300' },
  { key: 'schedule', label: 'Schedule', icon: <FaCalendarAlt />, path: '/profile/schedule', color: 'from-yellow-400 to-yellow-300' },
  { key: 'setting', label: 'Settings', icon: <FaCog />, path: '/profile/setting', color: 'from-purple-400 to-purple-300' },
];

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <div className="min-h-screen flex bg-gradient-to-br from-blue-50 via-pink-50 to-yellow-50">
      {/* Left Sidebar */}
      <nav className="w-64 min-h-screen py-10 px-4 flex flex-col gap-4 bg-white/80 shadow-2xl rounded-r-3xl">
        <div className="mb-8 text-2xl font-extrabold text-gray-700 tracking-wide text-center">Dashboard</div>
        {menu.map(item => {
          const active = pathname === item.path;
          return (
            <Link key={item.key} href={item.path} legacyBehavior>
              <a className={`flex items-center gap-3 px-5 py-3 rounded-2xl font-bold text-lg transition-all duration-200 shadow-md hover:scale-105 ${active ? `bg-gradient-to-r ${item.color} text-white` : 'bg-white text-gray-700 hover:bg-gray-100'}`}
                style={{ boxShadow: active ? '0 4px 24px 0 rgba(0,0,0,0.08)' : undefined }}>
                <span className="text-xl">{item.icon}</span>
                {item.label}
              </a>
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