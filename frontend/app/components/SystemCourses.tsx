'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '../utils/api';
import { toast } from 'react-toastify';
import { FaStar, FaChalkboardTeacher } from 'react-icons/fa';
import { ApiResponse } from '../utils/interfaces';

// 课程数据结构
interface SystemCourse {
  id: number;
  name: string;
  introduction: string;
  language: string;
  level: number;
  display_price: string;
  goal: string;
}

const PAGE_SIZE = 10; // 每页显示10条

export default function SystemCourses() {
  const [courses, setCourses] = useState<SystemCourse[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1 });
  const [signUpLoadingId, setSignUpLoadingId] = useState<number | null>(null);
  const router = useRouter();

  // 获取课程列表
  const fetchCourses = async (page: number) => {
    setLoading(true);
    try {
      const res = await apiClient.get<ApiResponse<any>>('/spwapi/course/fetch', { pn: page, ps: PAGE_SIZE });
      if (res && res.code === 0 && res.data) {
        setCourses(res.data.list || []);
        setPagination({
          currentPage: res.data.pn || page,
          totalPages: res.data.total_pages || 1,
        });
      } else {
        toast.error(res?.msg || 'Failed to fetch courses');
      }
    } catch (e: any) {
      toast.error(e?.message || 'Failed to fetch courses');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses(pagination.currentPage);
  }, [pagination.currentPage]);

  // 查看详情
  const handleDetails = (courseId: number) => {
    router.push(`/courses/${courseId}`);
  };

  // 报名课程
  const handleSignUp = async (courseId: number) => {
    setSignUpLoadingId(courseId);
    try {
      const res = await apiClient.post<ApiResponse<any>>('/spwapi/courses/signup', { courseId });
      if (res && res.code === 0) {
        toast.success('Signed up successfully! The course has been added to "My Courses".');
      } else {
        toast.error(res?.msg || 'Sign up failed.');
      }
    } catch (e: any) {
      toast.error(e?.message || 'Sign up failed.');
    } finally {
      setSignUpLoadingId(null);
    }
  };

  const handlePageChange = (page: number) => {
    if (page < 1 || page > pagination.totalPages || page === pagination.currentPage) return;
    setPagination(p => ({ ...p, currentPage: page }));
  };

  return (
    <div className="bg-white rounded-xl shadow-md p-8 mb-6">
      <h3 className="text-xl font-bold mb-4">All Courses</h3>
      {loading ? (
        <div className="text-center py-10">Loading...</div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
            {courses.map(course => (
              <div
                key={course.id}
                className="relative bg-gradient-to-br from-blue-50 to-pink-50 rounded-2xl shadow-lg overflow-hidden transition-all duration-300 group hover:shadow-blue-200 hover:-translate-y-2 cursor-pointer flex flex-col"
                onClick={() => handleDetails(course.id)}
              >
                <div className="relative w-full h-40">
                  <img src={'/default-avatar.svg'} alt={course.name} className="w-full h-full object-cover" />
                  <span className="absolute top-3 right-3 text-xs font-bold text-white bg-blue-500 px-2 py-1 rounded-full shadow">ALL</span>
                </div>
                <div className="p-4 flex-1 flex flex-col">
                  <h4 className="text-lg font-bold text-gray-900 truncate mb-1">{course.name}</h4>
                  <p className="text-sm text-gray-600 mb-2 line-clamp-2">{course.introduction}</p>
                  <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                    <span className="bg-cyan-100 text-cyan-700 px-2 py-0.5 rounded">{course.language}</span>
                    <span className="bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded">Level {course.level}</span>
                  </div>
                  <div className="flex items-center justify-between mt-auto">
                    <span className="text-base font-bold text-blue-600">${course.display_price}</span>
                    <span className="text-xs text-gray-500">{course.goal}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          {/* Pagination */}
          <div className="flex justify-center items-center mt-6">
            <button
              onClick={() => handlePageChange(pagination.currentPage - 1)}
              disabled={pagination.currentPage <= 1}
              className="px-3 py-1 mx-1 rounded bg-gray-200 disabled:opacity-50"
            >
              &laquo; Prev
            </button>
            {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map(page => (
              <button
                key={page}
                className={`px-3 py-1 mx-1 rounded ${pagination.currentPage === page ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
                onClick={() => handlePageChange(page)}
              >
                {page}
              </button>
            ))}
            <button
              onClick={() => handlePageChange(pagination.currentPage + 1)}
              disabled={pagination.currentPage >= pagination.totalPages}
              className="px-3 py-1 mx-1 rounded bg-gray-200 disabled:opacity-50"
            >
              Next &raquo;
            </button>
          </div>
        </>
      )}
    </div>
  );
} 