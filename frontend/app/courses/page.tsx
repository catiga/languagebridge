'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaStar, FaChalkboardTeacher, FaUserGraduate, FaPenFancy, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import { apiClient } from '@/app/utils/api';
import { ApiResponse } from '@/app/utils/interfaces';
import { useRouter } from 'next/navigation';

interface Course {
  id: number;
  name: string;
  introduction: string;
  teacher_name?: string;
  teacher_avatar?: string;
  rating?: number;
  reviewCount?: number;
  display_price: string;
  level: number | string;
  course_picture?: string;
}

interface CourseListResponse {
  list: Course[];
  pn: number;
  ps: number;
  total: number;
  total_pages: number;
}

// --- Course Card Component ---
const CourseCard = ({ course }: { course: Course }) => {
  const router = useRouter();
  const levelMap: { [key: number]: string } = {
    1: 'Beginner', 2: 'Intermediate', 3: 'Advanced',
  };

  return (
    <motion.div
      className="bg-white rounded-2xl shadow-lg overflow-hidden transition-all duration-300 group hover:shadow-cyan-500/30 hover:shadow-2xl hover:-translate-y-2 cursor-pointer"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 400, damping: 15 }}
      onClick={() => router.push(`/courses/${course.id}`)}
    >
      <div className="relative w-full h-48">
        <img src={course.course_picture || '/default-avatar.svg'} alt={course.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
      </div>
      <div className="p-5">
        <h3 className="text-lg font-bold text-gray-900 truncate mb-2">{course.name}</h3>
        <p className="text-sm text-gray-500 h-10 overflow-hidden mb-4">{course.introduction}</p>
        <div className="flex justify-between items-center border-t pt-3">
          <span className="text-sm font-semibold text-cyan-700 bg-cyan-100 px-2 py-1 rounded-md">{typeof course.level === 'number' ? levelMap[course.level] : course.level}</span>
           <div className="flex items-center text-sm text-gray-600">
            <FaStar className="text-yellow-400 mr-1" />
            <span className="font-bold text-gray-800">5.0</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const Pagination = ({ currentPage, totalPages, onPageChange }: { currentPage: number, totalPages: number, onPageChange: (page: number) => void}) => {
  if (totalPages <= 1) return null;
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <div className="flex justify-center items-center space-x-2 mt-12">
      <button onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1} className="p-2 rounded-full bg-white shadow-md hover:bg-gray-100 disabled:opacity-50">
        <FaChevronLeft/>
      </button>
      {pages.map(p => (
        <button key={p} onClick={() => onPageChange(p)} className={`w-10 h-10 rounded-full font-medium transition-colors ${currentPage === p ? 'bg-blue-600 text-white shadow-lg' : 'bg-white hover:bg-gray-100'}`}>
          {p}
        </button>
      ))}
      <button onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages} className="p-2 rounded-full bg-white shadow-md hover:bg-gray-100 disabled:opacity-50">
        <FaChevronRight/>
      </button>
    </div>
  )
}

// --- Main Courses Page ---
export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);

  useEffect(() => {
    const fetchCourses = async (page = 1) => {
      setIsLoading(true);
      try {
        const res = await apiClient.get<ApiResponse<CourseListResponse>>('/spwapi/course/fetch', { pn: page });
        if (res.code === 0 && res.data) {
          setCourses(res.data.list || []);
          setCurrentPage(res.data.pn);
          setTotalPages(res.data.total_pages);
        } else {
          setCourses([]);
          setTotalPages(0);
        }
      } catch (error) {
        console.error("Failed to fetch courses", error);
        setCourses([]);
        setTotalPages(0);
      } finally {
        setIsLoading(false);
      }
    };
    fetchCourses(currentPage);
  }, [currentPage]);

  return (
    <div className="bg-slate-50">
      {/* Header Section */}
      <header className="bg-white pt-24 pb-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-50 to-blue-100 opacity-50"></div>
        <div className="max-w-4xl mx-auto text-center px-4 relative">
          <motion.h1 
            className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-cyan-600 to-blue-700 bg-clip-text text-transparent tracking-tight"
            initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}
          >
            Explore Our Curated Courses
          </motion.h1>
          <motion.p 
            className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2, duration: 0.7 }}
          >
            New courses are added every week. Find the perfect one to achieve your goals.
          </motion.p>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {isLoading ? (
          <div className="text-center text-gray-500 py-10">Loading courses...</div>
        ) : (
          <>
            <main className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {courses.map(course => (
                <CourseCard key={course.id} course={course} />
              ))}
            </main>
            <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
          </>
        )}
      </div>
      
      {/* How It Works & CTA sections remain the same */}
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

      <section className="bg-blue-600 text-white">
        <div className="max-w-4xl mx-auto px-4 py-16 text-center">
          <h2 className="text-3xl font-bold">Share Your Knowledge.</h2>
          <p className="mt-3 text-lg text-blue-100">Become a teacher on LangBridge and reach a global audience of eager learners.</p>
          <a href="/tpa/register" className="mt-8 inline-block bg-white text-blue-600 font-bold py-3 px-8 rounded-full hover:bg-gray-100 transition-colors duration-300">
            Apply to Teach
          </a>
        </div>
      </section>
    </div>
  );
} 