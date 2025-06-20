'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '../utils/api';
import { toast } from 'react-toastify';

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
      const res = await apiClient.get('/spwapi/course/fetch', { pn: page, ps: PAGE_SIZE });
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
      const res = await apiClient.post('/spwapi/courses/signup', { courseId });
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
      <h3 className="text-xl font-bold mb-4">System Courses</h3>
      {loading ? (
        <div className="text-center py-10">Loading...</div>
      ) : (
        <>
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-100">
                <th className="py-2 px-4">Course Name</th>
                <th className="py-2 px-4">Introduction</th>
                <th className="py-2 px-4">Language</th>
                <th className="py-2 px-4">Level</th>
                <th className="py-2 px-4">Price</th>
                <th className="py-2 px-4">Goal</th>
                <th className="py-2 px-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {courses.map(course => (
                <tr key={course.id}>
                  <td className="py-2 px-4">{course.name}</td>
                  <td className="py-2 px-4">{course.introduction}</td>
                  <td className="py-2 px-4">{course.language}</td>
                  <td className="py-2 px-4">{course.level}</td>
                  <td className="py-2 px-4">${course.display_price}</td>
                  <td className="py-2 px-4">{course.goal}</td>
                  <td className="py-2 px-4">
                    <button className="text-gray-600 hover:underline mr-4" onClick={() => handleDetails(course.id)}>Details</button>
                    <button
                      className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 disabled:bg-blue-300 flex items-center"
                      onClick={() => handleSignUp(course.id)}
                      disabled={signUpLoadingId === course.id}
                    >
                      {signUpLoadingId === course.id ? (
                        <>
                          <svg className="animate-spin h-4 w-4 mr-1" viewBox="0 0 24 24">...</svg>
                          Signing Up...
                        </>
                      ) : 'Sign Up'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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