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
      className="bg-white rounded-2xl shadow-lg p-6 flex flex-col items-center transition-all duration-300 hover:shadow-xl hover:-translate-y-1 cursor-pointer group border border-gray-100 max-w-sm w-full mx-auto min-h-[360px]"
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
        <h3 className="text-xl font-bold text-gray-900 mb-2 truncate w-full">{teacher.name}</h3>
        <div className="flex flex-col gap-1 items-center text-sm text-gray-600 mb-3">
          <span><span className="font-semibold text-gray-700">Nationality:</span> {teacher.nationality_name || '—'}</span>
          <span><span className="font-semibold text-gray-700">Location:</span> {teacher.living_country_name || '—'}</span>
          <span><span className="font-semibold text-gray-700">Native Language:</span> {teacher.first_language || '—'}</span>
        </div>
        <div className="text-gray-700 text-sm mb-4 min-h-[40px] line-clamp-2 font-medium break-words text-left w-full">{teacher.introduction}</div>
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
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-pink-50 to-yellow-50 flex flex-col">
      {/* Hero Section */}
      <section className="w-full py-20 bg-gradient-to-r from-blue-500 via-pink-400 to-yellow-400 text-white text-center">
        <h1 className="text-4xl md:text-5xl font-extrabold mb-4 drop-shadow">Meet Our Trusted, Professional Teachers</h1>
        <p className="text-lg md:text-2xl mb-8 max-w-2xl mx-auto drop-shadow">
          All our teachers are strictly selected, identity-verified, and passionate about education. We are committed to providing a safe, high-quality, and inspiring learning environment for every student.
        </p>
        <div className="flex justify-center gap-6 mb-4">
          <Link href="/tpa/register">
            <button className="px-8 py-3 rounded-full bg-white text-blue-600 font-bold text-lg shadow-lg hover:bg-blue-100 transition-all duration-200">Become a Teacher</button>
          </Link>
          <Link href="/tpa/login">
            <button className="px-8 py-3 rounded-full bg-white text-pink-600 font-bold text-lg shadow-lg hover:bg-pink-100 transition-all duration-200">Teacher Login</button>
          </Link>
        </div>
      </section>

      {/* Trust & Quality Section */}
      <section className="max-w-5xl mx-auto py-16 px-4 grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="flex flex-col items-center">
          <div className="bg-blue-100 text-blue-600 rounded-full p-4 mb-3">
            {/* 身份核验icon */}
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="#2563EB" strokeWidth="2" fill="#dbeafe" /><path stroke="#2563EB" strokeWidth="2" strokeLinecap="round" d="M12 8v4l2 2" /></svg>
          </div>
          <h3 className="font-bold text-lg mb-1">Identity Verification</h3>
          <p className="text-gray-600 text-center">All teachers must pass strict identity checks to ensure safety and trust.</p>
        </div>
        <div className="flex flex-col items-center">
          <div className="bg-pink-100 text-pink-600 rounded-full p-4 mb-3">
            {/* 资质审核icon */}
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 2a10 10 0 100 20 10 10 0 000-20zm0 4a2 2 0 110 4 2 2 0 010-4zm0 12a8 8 0 01-6.32-3.16c.03-2.67 4-4.14 6.32-4.14s6.29 1.47 6.32 4.14A8 8 0 0112 20z" stroke="#ec4899" strokeWidth="2" fill="#fce7f3" /></svg>
          </div>
          <h3 className="font-bold text-lg mb-1">Credentials Review</h3>
          <p className="text-gray-600 text-center">We review every teacher's qualifications and teaching experience.</p>
        </div>
        <div className="flex flex-col items-center">
          <div className="bg-yellow-100 text-yellow-600 rounded-full p-4 mb-3">
            {/* 社区评价icon */}
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" stroke="#f59e42" strokeWidth="2" fill="#fef9c3" /></svg>
          </div>
          <h3 className="font-bold text-lg mb-1">Community Ratings</h3>
          <p className="text-gray-600 text-center">Real feedback from students and parents helps us maintain the highest standards.</p>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="bg-white py-16">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-center mb-8 text-blue-700">What Parents & Students Say</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mb-3">
                <span className="text-2xl font-bold text-blue-600">A</span>
              </div>
              <p className="text-gray-700 text-center italic mb-2">"The teachers are so patient and professional. My child loves every lesson!"</p>
              <span className="text-sm text-gray-500">— Mrs. Wang, Parent</span>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 rounded-full bg-pink-100 flex items-center justify-center mb-3">
                <span className="text-2xl font-bold text-pink-600">B</span>
              </div>
              <p className="text-gray-700 text-center italic mb-2">"I feel safe and motivated. The platform really cares about students."</p>
              <span className="text-sm text-gray-500">— Lily, Student</span>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 rounded-full bg-yellow-100 flex items-center justify-center mb-3">
                <span className="text-2xl font-bold text-yellow-600">C</span>
              </div>
              <p className="text-gray-700 text-center italic mb-2">"The teacher selection is very strict. I trust this platform for my family."</p>
              <span className="text-sm text-gray-500">— Mr. Smith, Parent</span>
            </div>
          </div>
        </div>
      </section>

      {/* Platform Commitment */}
      <section className="py-12 bg-gradient-to-r from-blue-100 via-pink-50 to-yellow-50 text-center">
        <h2 className="text-xl font-bold text-blue-700 mb-2">Our Commitment</h2>
        <p className="text-gray-700 max-w-2xl mx-auto">
          We are dedicated to every learner's growth and safety. Join us to experience the difference.
        </p>
      </section>

      {/* Bottom CTA */}
      <section className="py-10 text-center">
        <div className="flex justify-center gap-6">
          <Link href="/tpa/register">
            <button className="px-8 py-3 rounded-full bg-blue-600 text-white font-bold text-lg shadow-lg hover:bg-blue-700 transition-all duration-200">Become a Teacher</button>
          </Link>
          <Link href="/tpa/login">
            <button className="px-8 py-3 rounded-full bg-pink-600 text-white font-bold text-lg shadow-lg hover:bg-pink-700 transition-all duration-200">Teacher Login</button>
          </Link>
        </div>
      </section>
    </div>
  );
} 