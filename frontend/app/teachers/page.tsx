'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaStar, FaCertificate, FaUsers, FaUserCheck } from 'react-icons/fa';
import { apiClient } from '@/app/utils/api';
import { ApiResponse } from '@/app/utils/interfaces';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Teacher {
  id: number;
  name: string;
  introduction: string; // Using introduction as headline
  nationality: string; // e.g., "USA"
  living_country: string; // e.g., "UK"
  avatar: string;
  // Assuming these will be added later
  specialties?: string[]; 
  rating?: number;
  lessonsTaught?: number;
  nationality_name?: string;
  living_country_name?: string;
  teacher_no?: string;
  first_language?: string;
  detail?: string;
}

// --- Teacher Card Component ---
const TeacherCard = ({ teacher }: { teacher: Teacher }) => {
  const router = useRouter();
  
  return (
    <motion.div
      className="bg-white rounded-2xl shadow-lg p-7 flex flex-col items-center transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 cursor-pointer group border border-gray-100 max-w-xs w-full mx-auto min-h-[340px]"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      onClick={() => router.push(`/teachers/${teacher.id}`)}
    >
      <img
        src={teacher.avatar || '/default-avatar.svg'}
        alt={teacher.name}
        className="w-24 h-24 rounded-full object-cover border-4 border-blue-100 shadow mb-4 group-hover:scale-105 transition-transform duration-300"
      />
      <div className="w-full text-center">
        <h3 className="text-lg font-bold text-gray-900 mb-1 truncate">{teacher.name}</h3>
        <div className="flex flex-col gap-1 items-center text-xs text-gray-500 mb-2">
          <span><span className="font-semibold text-gray-700">Nationality:</span> {teacher.nationality_name || '—'}</span>
          <span><span className="font-semibold text-gray-700">Location:</span> {teacher.living_country_name || '—'}</span>
          <span><span className="font-semibold text-gray-700">Native Language:</span> {teacher.first_language || '—'}</span>
        </div>
        <div className="text-gray-700 text-sm mb-3 min-h-[32px] line-clamp-2 font-medium break-words">{teacher.introduction}</div>
      </div>
      <button
        className="mt-auto w-full bg-gradient-to-r from-blue-600 to-blue-500 text-white font-bold py-2 px-4 rounded-lg hover:shadow-lg hover:bg-blue-700 transition-all duration-200"
        onClick={e => { e.stopPropagation(); router.push(`/teachers/${teacher.id}`); }}
      >
        View Profile
      </button>
    </motion.div>
  );
};


// --- Main Teachers Page ---
export default function TeachersPage() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pageNo, setPageNo] = useState(1);
  const [pageSize] = useState(12);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    const fetchTeachers = async () => {
      setIsLoading(true);
      try {
        const res = await apiClient.get<any>('/spwapi/teacher/fetch', { pn: pageNo, ps: pageSize });
        if (res.code === 0 && res.data?.list) {
          setTeachers(res.data.list);
          setTotal(res.data.total || 0);
        } else {
          setTeachers([]);
          setTotal(0);
        }
      } catch (error) {
        setTeachers([]);
        setTotal(0);
      } finally {
        setIsLoading(false);
      }
    };
    fetchTeachers();
  }, [pageNo, pageSize]);

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-pink-50 to-yellow-50 pb-16">
      <div className="pt-10 px-4">
        <div className="flex justify-center mb-8">
          <Link href="/tpa/login" passHref legacyBehavior>
            <a className="inline-block px-8 py-3 rounded-full bg-gradient-to-r from-blue-500 via-pink-400 to-yellow-400 text-white text-lg font-bold shadow-lg hover:scale-105 hover:shadow-2xl transition-all duration-200">
              Login as Teacher
            </a>
          </Link>
        </div>
        {/* Header Section */}
        <header className="bg-white pt-24 pb-12">
          <div className="max-w-4xl mx-auto text-center px-4">
            <motion.h1 
              className="text-4xl md:text-5xl font-bold text-gray-900 tracking-tight"
              initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}
            >
              Meet Our Professional Tutors
            </motion.h1>
            <motion.p 
              className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2, duration: 0.7 }}
            >
              Find an expert who matches your learning style and goals.
            </motion.p>
          </div>
        </header>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {isLoading ? (
            <div className="text-center text-gray-500">Loading teachers...</div>
          ) : teachers.length === 0 ? (
            <div className="text-center text-gray-400">No teachers found.</div>
          ) : (
            <main className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-10">
              {teachers.map(teacher => (
                <TeacherCard key={teacher.id} teacher={teacher} />
              ))}
            </main>
          )}
          {/* 分页按钮 */}
          {totalPages > 1 && (
            <div className="flex justify-center mt-8 gap-2">
              <button
                className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300 disabled:opacity-50"
                onClick={() => setPageNo(p => Math.max(1, p - 1))}
                disabled={pageNo === 1}
              >Prev</button>
              <span className="px-3 py-2 text-gray-700">Page {pageNo} / {totalPages}</span>
              <button
                className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300 disabled:opacity-50"
                onClick={() => setPageNo(p => Math.min(totalPages, p + 1))}
                disabled={pageNo === totalPages}
              >Next</button>
            </div>
          )}
        </div>
        
        {/* Our Commitment Section */}
        <section className="py-20 bg-white">
          <div className="max-w-6xl mx-auto px-4 text-center">
              <h2 className="text-3xl md:text-4xl font-bold mb-12">Our Commitment to Quality</h2>
              <div className="grid md:grid-cols-3 gap-10">
                {[
                  { icon: FaUserCheck, title: "1. Identity Verification", desc: "We confirm the identity of every teacher to ensure a safe and trusted environment." },
                  { icon: FaCertificate, title: "2. Expertise Review", desc: "Our team reviews teaching credentials and experience to guarantee high-quality instruction." },
                  { icon: FaUsers, title: "3. Community-Driven Ratings", desc: "Honest, transparent reviews from students like you help maintain the highest standards." }
                ].map((item) => (
                  <div key={item.title} className="flex flex-col items-center">
                    <div className="flex items-center justify-center h-20 w-20 rounded-full bg-blue-100 text-blue-600 mb-5">
                      <item.icon className="w-10 h-10" />
                    </div>
                    <h3 className="text-xl font-bold mb-2">{item.title}</h3>
                    <p className="text-gray-600 text-center">{item.desc}</p>
                  </div>
                ))}
              </div>
          </div>
        </section>

        {/* Become a Teacher CTA */}
        <section className="bg-blue-600 text-white">
          <div className="max-w-4xl mx-auto px-4 py-16 text-center">
            <h2 className="text-3xl font-bold">Share Your Knowledge.</h2>
            <p className="mt-3 text-lg text-blue-100">Join our global community of educators and empower learners worldwide.</p>
            <a href="/tpa/register" className="mt-8 inline-block bg-white text-blue-600 font-bold py-3 px-8 rounded-full hover:bg-gray-100 transition-colors duration-300">
              Apply to Teach
            </a>
          </div>
        </section>
      </div>
    </div>
  );
} 