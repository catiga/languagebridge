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
}

// --- Teacher Card Component ---
const TeacherCard = ({ teacher }: { teacher: Teacher }) => {
  const router = useRouter();
  
  return (
    <motion.div
      className="bg-white rounded-xl shadow-lg text-center p-6 transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 cursor-pointer"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      onClick={() => router.push(`/teachers/${teacher.id}`)}
    >
      <img src={teacher.avatar || '/default-avatar.svg'} alt={teacher.name} className="w-28 h-28 rounded-full mx-auto mb-4 border-4 border-gray-100 shadow-md" />
      <h3 className="text-xl font-bold text-gray-900">{teacher.name}</h3>
      <p className="text-sm text-gray-500 mb-3 h-10 overflow-hidden">{teacher.introduction}</p>
      <div className="flex flex-wrap justify-center gap-2 mb-4 h-6">
        {teacher.specialties?.map(spec => (
          <span key={spec} className="bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">{spec}</span>
        ))}
      </div>
      <div className="flex justify-center items-center text-gray-600 mb-5">
        {teacher.rating && <><FaStar className="text-yellow-400 mr-1" /> <span className="font-bold text-gray-800 mr-3">{teacher.rating.toFixed(1)}</span></>}
        {teacher.lessonsTaught && <span>({teacher.lessonsTaught.toLocaleString()} lessons)</span>}
      </div>
      <button className="w-full bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors duration-300">
        View Profile
      </button>
    </motion.div>
  );
};


// --- Main Teachers Page ---
export default function TeachersPage() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchTeachers = async () => {
      try {
        const res = await apiClient.get<ApiResponse<Teacher[]>>('/spwapi/teacher/fetch_all');
        if (res.code === 0 && Array.isArray(res.data)) {
          setTeachers(res.data);
        } else {
          setTeachers([]);
        }
      } catch (error) {
        console.error("Failed to fetch teachers", error);
        setTeachers([]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchTeachers();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-pink-50 to-yellow-50 pb-16">
      <div className="max-w-3xl mx-auto pt-10 px-4">
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
          ) : (
            <main className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {teachers.map(teacher => (
                <TeacherCard key={teacher.id} teacher={teacher} />
              ))}
            </main>
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