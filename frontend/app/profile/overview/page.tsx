'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { FaBookOpen, FaCalendarAlt, FaEnvelope, FaUserCircle, FaRocket, FaChalkboardTeacher } from 'react-icons/fa';
import Image from 'next/image';
import AnimatedStatCard from '../components/AnimatedStatCard';
import ProfileLayout from '../ProfileLayout';

const statColors = [
  'from-pink-400 via-pink-300 to-pink-200',
  'from-blue-400 via-blue-300 to-blue-200',
  'from-green-400 via-green-300 to-green-200',
  'from-yellow-400 via-yellow-300 to-yellow-200',
];

export default function ProfileOverviewPage() {
  // Dummy data, replace with API as needed
  const [stats, setStats] = useState([
    { icon: <FaBookOpen size={32} />, label: 'My Courses', value: 5 },
    { icon: <FaCalendarAlt size={32} />, label: 'Completed Lessons', value: 12 },
    { icon: <FaEnvelope size={32} />, label: 'Messages', value: 3 },
    { icon: <FaChalkboardTeacher size={32} />, label: 'Teachers', value: 2 },
  ]);

  return (
    <ProfileLayout>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-pink-50 to-yellow-50 pb-16">
        {/* Welcome Area */}
        <motion.div
          className="relative flex flex-col items-center justify-center py-10 mb-8 bg-gradient-to-r from-blue-200 via-pink-200 to-yellow-100 rounded-b-3xl shadow-lg"
          initial={{ opacity: 0, y: -40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, type: 'spring' }}
        >
          <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-white shadow-lg mb-4">
            <Image src="/default-avatar.svg" alt="avatar" width={112} height={112} />
          </div>
          <h1 className="text-3xl font-extrabold text-gray-800 mb-2 tracking-wide drop-shadow">Hi there!</h1>
          <p className="text-lg text-gray-600 font-medium">Welcome to your learning dashboard 🎉</p>
        </motion.div>

        {/* Stat Cards */}
        <div className="max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 mb-10 px-4">
          {stats.map((stat, idx) => (
            <AnimatedStatCard
              key={stat.label}
              icon={stat.icon}
              label={stat.label}
              value={stat.value}
              colorClass={statColors[idx % statColors.length]}
            />
          ))}
        </div>

        {/* Quick Entry */}
        <motion.div
          className="max-w-4xl mx-auto flex flex-wrap gap-4 justify-center mb-10"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, duration: 0.6, type: 'spring' }}
        >
          <QuickEntry icon={<FaRocket size={24} />} label="Go to Class" href="/courses" color="bg-gradient-to-r from-pink-300 to-pink-400" />
          <QuickEntry icon={<FaBookOpen size={24} />} label="Course List" href="/profile/courses" color="bg-gradient-to-r from-blue-300 to-blue-400" />
          <QuickEntry icon={<FaEnvelope size={24} />} label="Messages" href="/profile?tab=messages" color="bg-gradient-to-r from-green-300 to-green-400" />
        </motion.div>

        {/* Weekly Schedule Preview */}
        <motion.div
          className="max-w-4xl mx-auto bg-white/80 rounded-2xl shadow-lg p-6 mt-6"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.7, type: 'spring' }}
        >
          <h2 className="text-xl font-bold text-gray-700 mb-4">Weekly Schedule Preview</h2>
          <div className="flex flex-wrap gap-4">
            {/* Dummy schedule blocks */}
            {[1,2,3].map(i => (
              <motion.div
                key={i}
                className="rounded-xl px-6 py-3 bg-gradient-to-r from-yellow-200 via-pink-100 to-blue-100 text-gray-700 font-semibold shadow-md"
                whileHover={{ scale: 1.08 }}
                transition={{ type: 'spring', stiffness: 300 }}
              >
                Mon {i} 15:00-16:00 Spoken English
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </ProfileLayout>
  );
}

function QuickEntry({ icon, label, href, color }: { icon: React.ReactNode; label: string; href: string; color: string }) {
  return (
    <a
      href={href}
      className={`flex items-center gap-2 px-6 py-3 rounded-xl text-white font-bold shadow-md hover:scale-105 transition-transform text-lg ${color}`}
      style={{ minWidth: 120 }}
    >
      {icon}
      {label}
    </a>
  );
} 