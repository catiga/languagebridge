'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FaStar, FaSearch, FaCertificate, FaUsers, FaUserCheck } from 'react-icons/fa';

// Mock data for teachers
const mockTeachers = [
  { id: 1, name: 'Eleanor Vance', country: 'USA', flag: '🇺🇸', headline: 'Certified IELTS & TOEFL expert with 10+ years experience.', specialties: ['IELTS', 'TOEFL', 'Academic'], rating: 4.9, lessonsTaught: 2500, avatar: 'https://i.pravatar.cc/150?u=a1' },
  { id: 2, name: 'James O\'Connell', country: 'Ireland', flag: '🇮🇪', headline: 'Friendly and patient tutor for conversational English.', specialties: ['Conversation', 'Beginner'], rating: 4.8, lessonsTaught: 1800, avatar: 'https://i.pravatar.cc/150?u=a2' },
  { id: 3, name: 'Sofia Rossi', country: 'UK', flag: '🇬🇧', headline: 'Helping business professionals master negotiation & presentations.', specialties: ['Business', 'Advanced', 'Speaking'], rating: 5.0, lessonsTaught: 3100, avatar: 'https://i.pravatar.cc/150?u=a3' },
  { id: 4, name: 'Ben Carter', country: 'Canada', flag: '🇨🇦', headline: 'Let\'s make learning English fun and effective!', specialties: ['General', 'Intermediate'], rating: 4.9, lessonsTaught: 1500, avatar: 'https://i.pravatar.cc/150?u=a4' },
  // ... add more mock teachers
];

// --- Teacher Card Component ---
const TeacherCard = ({ teacher }: { teacher: typeof mockTeachers[0] }) => {
  return (
    <motion.div
      className="bg-white rounded-xl shadow-lg text-center p-6 transition-all duration-300 hover:shadow-2xl hover:-translate-y-1"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <img src={teacher.avatar} alt={teacher.name} className="w-28 h-28 rounded-full mx-auto mb-4 border-4 border-gray-100 shadow-md" />
      <h3 className="text-xl font-bold text-gray-900">{teacher.name} <span title={teacher.country}>{teacher.flag}</span></h3>
      <p className="text-sm text-gray-500 mb-3">{teacher.headline}</p>
      <div className="flex flex-wrap justify-center gap-2 mb-4">
        {teacher.specialties.map(spec => (
          <span key={spec} className="bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">{spec}</span>
        ))}
      </div>
      <div className="flex justify-center items-center text-gray-600 mb-5">
        <FaStar className="text-yellow-400 mr-1" />
        <span className="font-bold text-gray-800 mr-3">{teacher.rating.toFixed(1)}</span>
        <span>({teacher.lessonsTaught.toLocaleString()} lessons)</span>
      </div>
      <button className="w-full bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors duration-300">
        View Profile
      </button>
    </motion.div>
  );
};


// --- Main Teachers Page ---
export default function TeachersPage() {
  const [teachers, setTeachers] = useState(mockTeachers);

  return (
    <div className="bg-gray-50">
      {/* Header Section */}
      <header className="bg-white pt-24 pb-16">
        <div className="max-w-4xl mx-auto text-center px-4">
          <motion.h1 
            className="text-4xl md:text-5xl font-bold text-gray-900 tracking-tight"
            initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}
          >
            Meet Our Global Community of Educators
          </motion.h1>
          <motion.p 
            className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2, duration: 0.7 }}
          >
            Find an expert who matches your learning style, goals, and schedule. Every teacher is vetted and reviewed by our community.
          </motion.p>
          <motion.div 
            className="mt-8 max-w-xl mx-auto relative"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4, duration: 0.7 }}
          >
            <FaSearch className="absolute top-1/2 left-4 -translate-y-1/2 text-gray-400" />
            <input type="text" placeholder="Search by name or specialty..." className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-full focus:ring-2 focus:ring-blue-500" />
          </motion.div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Filters Sidebar */}
          <aside className="lg:col-span-1 bg-white p-6 rounded-xl shadow-md h-fit">
            <h3 className="text-xl font-bold mb-6">Find a Teacher</h3>
            <div className="space-y-6">
               <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Specialty</label>
                <select className="w-full p-2 border border-gray-300 rounded-md">
                  <option>Any</option>
                  <option>Business</option>
                  <option>IELTS/TOEFL</option>
                  <option>Conversational</option>
                  <option>Beginner</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Rating</label>
                <select className="w-full p-2 border border-gray-300 rounded-md">
                  <option>Any</option>
                  <option>4.5 & up</option>
                  <option>4.0 & up</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Native Speaker</label>
                <select className="w-full p-2 border border-gray-300 rounded-md">
                  <option>Any</option>
                  <option>Yes</option>
                  <option>No</option>
                </select>
              </div>
            </div>
          </aside>

          {/* Teachers Grid */}
          <main className="lg:col-span-3 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {teachers.map(teacher => (
              <TeacherCard key={teacher.id} teacher={teacher} />
            ))}
          </main>
        </div>
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
          <a href="/register/teacher" className="mt-8 inline-block bg-white text-blue-600 font-bold py-3 px-8 rounded-full hover:bg-gray-100 transition-colors duration-300">
            Apply to Teach
          </a>
        </div>
      </section>
    </div>
  );
} 