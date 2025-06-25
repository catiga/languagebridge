'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { FaBookOpen, FaCalendarAlt, FaEnvelope, FaUserCircle, FaRocket, FaChalkboardTeacher } from 'react-icons/fa';
import Image from 'next/image';
import AnimatedStatCard from '../components/AnimatedStatCard';
import ProfileLayout from '../ProfileLayout';
import { apiClient } from '@/app/utils/api';
import type { ApiResponse } from '@/app/utils/interfaces';
import { useRouter } from 'next/navigation';

const statColors = [
  'from-pink-400 via-pink-300 to-pink-200',
  'from-blue-400 via-blue-300 to-blue-200',
  'from-green-400 via-green-300 to-green-200',
  'from-yellow-400 via-yellow-300 to-yellow-200',
];

export default function ProfileOverviewPage() {
  const [stats, setStats] = useState([
    { icon: <FaBookOpen size={32} />, label: 'My Courses', value: 0 },
    { icon: <FaCalendarAlt size={32} />, label: 'Completed Lessons', value: 0 },
    { icon: <FaEnvelope size={32} />, label: 'Messages', value: 0 },
    { icon: <FaChalkboardTeacher size={32} />, label: 'Teachers', value: 0 },
  ]);
  const [weekLessons, setWeekLessons] = useState<any[]>([]);
  const [userInfo, setUserInfo] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    async function fetchOverview() {
      try {
        const res = await apiClient.get<ApiResponse<any>>('/spwapi/auth/overview');
        if (res && res.code === 0 && res.data) {
          const teacherSet = new Set((res.data.current_week_courses || []).map((c: any) => c.teacher_name));
          setStats([
            { icon: <FaBookOpen size={32} />, label: 'My Courses', value: res.data.lesson_total_count },
            { icon: <FaCalendarAlt size={32} />, label: 'Completed Lessons', value: res.data.lesson_past_count },
            { icon: <FaEnvelope size={32} />, label: 'Messages', value: 0 },
            { icon: <FaChalkboardTeacher size={32} />, label: 'Teachers', value: teacherSet.size },
          ]);
          setWeekLessons(res.data.current_week_courses || []);
          setUserInfo(res.data.user_info || null);
        }
      } catch (e) {}
    }
    fetchOverview();
  }, []);

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
            <Image src={userInfo?.avatar && userInfo.avatar.trim() !== '' ? userInfo.avatar : '/default-avatar.svg'} alt="avatar" width={112} height={112} />
          </div>
          <h1 className="text-3xl font-extrabold text-gray-800 mb-2 tracking-wide drop-shadow flex items-center justify-center gap-3">
            Hi, {userInfo?.name || userInfo?.email || 'there'}!
            {userInfo?.status === '00' && (
              <span className="inline-block px-3 py-1 rounded-full bg-red-500 text-white text-xs font-bold animate-pulse ml-2 shadow-md" style={{letterSpacing: '1px'}}>Unverified</span>
            )}
            {userInfo?.status === '20' && (
              <span className="inline-block px-3 py-1 rounded-full bg-green-500 text-white text-xs font-bold ml-2 shadow-md">Verified</span>
            )}
          </h1>
          <p className="text-lg text-gray-600 font-medium mb-2">Welcome to your learning dashboard 🎉</p>
          {/* 个人信息行 */}
          {userInfo && (
            <div className="text-sm text-gray-500 mb-2 flex flex-wrap items-center justify-center gap-2">
              <span>{userInfo.email}</span>
              <span className="mx-2">|</span>
              <span>User No: {userInfo.user_no}</span>
            </div>
          )}
          {/* 未验证时高亮按钮 */}
          {userInfo?.status === '00' && (
            <button
              onClick={() => router.push('/profile/email')}
              className="mt-2 px-5 py-2 bg-gradient-to-r from-red-500 to-pink-500 text-white font-bold rounded-lg shadow-lg hover:scale-105 transition-all duration-200 flex items-center gap-2"
            >
              <FaEnvelope className="w-4 h-4" />
              Verify Email
            </button>
          )}
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 justify-items-center">
            {weekLessons.length === 0 ? (
              <div className="text-gray-400 text-sm text-center py-8 col-span-full">No lessons scheduled this week.</div>
            ) : (
              weekLessons.map((lesson, i) => {
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
                  <motion.div
                    key={lesson.book_id || i}
                    className={`w-full h-full min-h-[120px] flex flex-col justify-between rounded-xl px-6 py-4 font-semibold shadow-md ${cardClass}`}
                    whileHover={{ scale: 1.04 }}
                    transition={{ type: 'spring', stiffness: 300 }}
                  >
                    <div className="font-bold text-lg mb-1">{lesson.course_name}</div>
                    <div className="text-xs mb-1">
                      {lesson.start_time} - {lesson.end_time} | {lesson.lesson_date?.slice(0, 10)}
                      {isPast && <span className="ml-2 px-2 py-0.5 rounded bg-gray-300 text-gray-600 text-xs">Past</span>}
                      {isToday && <span className="ml-2 px-2 py-0.5 rounded bg-blue-500 text-white text-xs">Today</span>}
                      {isFuture && <span className="ml-2 px-2 py-0.5 rounded bg-green-500 text-white text-xs">Upcoming</span>}
                    </div>
                    <div className="text-xs text-gray-500">Teacher: {lesson.teacher_name}</div>
                  </motion.div>
                );
              })
            )}
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