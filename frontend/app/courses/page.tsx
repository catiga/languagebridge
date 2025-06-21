'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FaStar, FaSearch, FaChalkboardTeacher, FaUserGraduate, FaPenFancy } from 'react-icons/fa';

// Mock data to represent courses from your backend
const mockCourses = [
  { id: 1, title: 'IELTS Academic English', teacher: { name: 'Dr. Angela Yu', avatar: 'https://i.pravatar.cc/40?u=1' }, rating: 4.9, reviewCount: 1250, price: 30, level: 'Advanced', category: 'Exam Prep', imageUrl: 'https://images.unsplash.com/photo-1543269865-cbf427effbad?ixlib=rb-4.0.3&q=80&w=400' },
  { id: 2, title: 'Conversational Business English', teacher: { name: 'John Smith', avatar: 'https://i.pravatar.cc/40?u=2' }, rating: 4.7, reviewCount: 890, price: 25, level: 'Intermediate', category: 'Business', imageUrl: 'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?ixlib=rb-4.0.3&q=80&w=400' },
  { id: 3, title: 'Beginner English: Zero to Hero', teacher: { name: 'Maria Garcia', avatar: 'https://i.pravatar.cc/40?u=3' }, rating: 4.8, reviewCount: 2100, price: 20, level: 'Beginner', category: 'General', imageUrl: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?ixlib=rb-4.0.3&q=80&w=400' },
  { id: 4, title: 'Public Speaking & Pronunciation', teacher: { name: 'Kenji Tanaka', avatar: 'https://i.pravatar.cc/40?u=4' }, rating: 4.9, reviewCount: 950, price: 35, level: 'Advanced', category: 'Speaking', imageUrl: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?ixlib=rb-4.0.3&q=80&w=400' },
  // ... add more mock courses
];

// --- Course Card Component ---
const CourseCard = ({ course }: { course: typeof mockCourses[0] }) => {
  return (
    <motion.div
      className="bg-white rounded-xl shadow-lg overflow-hidden transition-all duration-300 hover:shadow-2xl hover:-translate-y-1"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <img src={course.imageUrl} alt={course.title} className="w-full h-40 object-cover" />
      <div className="p-5">
        <div className="flex items-center mb-3">
          <img src={course.teacher.avatar} alt={course.teacher.name} className="w-8 h-8 rounded-full mr-3" />
          <span className="text-sm font-medium text-gray-700">{course.teacher.name}</span>
        </div>
        <h3 className="text-lg font-bold text-gray-900 truncate mb-2">{course.title}</h3>
        <div className="flex items-center text-sm text-gray-600 mb-4">
          <span className="font-bold text-yellow-500 mr-1">{course.rating.toFixed(1)}</span>
          <FaStar className="text-yellow-400 mr-2" />
          <span>({course.reviewCount} reviews)</span>
        </div>
        <div className="flex justify-between items-center border-t pt-3">
          <span className="text-sm font-semibold text-gray-500 bg-gray-100 px-2 py-1 rounded">{course.level}</span>
          <span className="text-xl font-bold text-blue-600">${course.price}</span>
        </div>
      </div>
    </motion.div>
  );
};

// --- Main Courses Page ---
export default function CoursesPage() {
  const [courses, setCourses] = useState(mockCourses);

  return (
    <div className="bg-gray-50">
      {/* Header Section */}
      <header className="bg-white pt-24 pb-16">
        <div className="max-w-4xl mx-auto text-center px-4">
          <motion.h1 
            className="text-4xl md:text-5xl font-bold text-gray-900 tracking-tight"
            initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}
          >
            Explore Our Open Learning Marketplace
          </motion.h1>
          <motion.p 
            className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2, duration: 0.7 }}
          >
            Every course is taught by a member of our global community. Rate, review, and help shape the future of learning.
          </motion.p>
          <motion.div 
            className="mt-8 max-w-xl mx-auto relative"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4, duration: 0.7 }}
          >
            <FaSearch className="absolute top-1/2 left-4 -translate-y-1/2 text-gray-400" />
            <input type="text" placeholder="Search for any course..." className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-full focus:ring-2 focus:ring-blue-500" />
          </motion.div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Filters Sidebar */}
          <aside className="lg:col-span-1 bg-white p-6 rounded-xl shadow-md h-fit">
            <h3 className="text-xl font-bold mb-6">Filter Courses</h3>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                <select className="w-full p-2 border border-gray-300 rounded-md">
                  <option>All</option>
                  <option>Business</option>
                  <option>Exam Prep</option>
                  <option>General</option>
                  <option>Speaking</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Level</label>
                <select className="w-full p-2 border border-gray-300 rounded-md">
                  <option>Any</option>
                  <option>Beginner</option>
                  <option>Intermediate</option>
                  <option>Advanced</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Rating</label>
                <select className="w-full p-2 border border-gray-300 rounded-md">
                  <option>Any</option>
                  <option>4.5 & up</option>
                  <option>4.0 & up</option>
                  <option>3.5 & up</option>
                </select>
              </div>
            </div>
          </aside>

          {/* Courses Grid */}
          <main className="lg:col-span-3 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {courses.map(course => (
              <CourseCard key={course.id} course={course} />
            ))}
          </main>
        </div>
      </div>
      
      {/* How It Works Section */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-12">How Our Ecosystem Works</h2>
            <div className="grid md:grid-cols-3 gap-10">
              {[
                { icon: FaUserGraduate, title: "1. Discover & Learn", desc: "Find the perfect course from thousands of options taught by verified experts." },
                { icon: FaChalkboardTeacher, title: "2. Grow & Master", desc: "Use our AI tools and expert instruction to achieve your learning goals." },
                { icon: FaPenFancy, title: "3. Rate & Empower", desc: "Leave a review to help fellow students and give feedback to great teachers." }
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
          <p className="mt-3 text-lg text-blue-100">Become a teacher on LangBridge and reach a global audience of eager learners.</p>
          <a href="/register/teacher" className="mt-8 inline-block bg-white text-blue-600 font-bold py-3 px-8 rounded-full hover:bg-gray-100 transition-colors duration-300">
            Apply to Teach
          </a>
        </div>
      </section>
    </div>
  );
} 