'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { apiClient } from '../../utils/api';
import { toast, ToastContainer } from 'react-toastify';
import { FaStar } from 'react-icons/fa';

// 数据结构定义
interface CourseDetail {
  id: number;
  name: string;
  introduction: string;
  detail: string;
  language: string;
  level: number;
  display_price: string;
  goal: string;
}
interface Teacher {
  id: number;
  name: string;
  avatar: string;
  bio: string;
}
interface Review {
  id: number;
  user: string;
  avatar: string;
  rating: number;
  comment: string;
  date: string;
}

export default function CourseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.id as string;

  const [course, setCourse] = useState<CourseDetail | null>(null);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [joinLoading, setJoinLoading] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);

  useEffect(() => {
    if (!courseId) return;

    const fetchCourseData = async () => {
      setLoading(true);
      try {
        // 并发请求
        const [courseRes, teachersRes, reviewsRes] = await Promise.all([
          apiClient.get(`/spwapi/course/detail`, { course_id: courseId }),
          apiClient.get(`/spwapi/course/teachers`, { course_id: courseId }),
          apiClient.get(`/spwapi/course/reviews`, { course_id: courseId }),
        ]);

        if (
          courseRes &&
          courseRes.code === 0 &&
          courseRes.data &&
          courseRes.data.id
        ) {
          setCourse(courseRes.data);
        } else {
          setCourse(null);
          toast.error(courseRes?.msg || 'Failed to fetch course details.');
        }

        if (teachersRes && teachersRes.code === 0) {
          setTeachers(Array.isArray(teachersRes.data) ? teachersRes.data : []);
        }

        if (reviewsRes && reviewsRes.code === 0) {
          setReviews(Array.isArray(reviewsRes.data) ? reviewsRes.data : []);
        }

      } catch (error: any) {
        toast.error(error.message || "An error occurred while fetching data.");
      } finally {
        setLoading(false);
      }
    };

    fetchCourseData();
  }, [courseId]);

  // 返回到系统课程tab
  const handleBack = () => {
    router.push('/profile?tab=systemcourses');
  };

  // 加入课程处理
  const handleJoinCourse = async () => {
    setJoinLoading(true);
    try {
      const res = await apiClient.get('/spwapi/auth/course/join', { course_id: course?.id });
      if (res && res.code === 0) {
        toast.success('Successfully joined the course!');
      } else {
        toast.error(res?.msg || 'Failed to join the course.');
      }
    } catch (e: any) {
      toast.error(e?.message || 'Failed to join the course.');
    } finally {
      setJoinLoading(false);
      setShowJoinModal(false);
    }
  };

  if (loading) {
    return <div className="text-center py-20">Loading course details...</div>;
  }

  if (!course) {
    return <div className="text-center py-20">Course not found.</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <ToastContainer position="top-center" autoClose={2000} />
      {/* 返回按钮和加入我的课程按钮 */}
      <div className="flex justify-between items-center mb-6">
        <button
          className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300"
          onClick={handleBack}
        >
          &larr; Back to System Courses
        </button>
        <button
          className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
          onClick={() => setShowJoinModal(true)}
          disabled={joinLoading}
        >
          {joinLoading ? 'Joining...' : 'Join Course'}
        </button>
      </div>

      {/* 加入课程确认弹窗 */}
      {showJoinModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
          <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-sm">
            <h2 className="text-xl font-semibold mb-4">Confirm Join</h2>
            <p className="mb-6">Are you sure you want to join this course?</p>
            <div className="flex justify-end gap-4">
              <button
                className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300"
                onClick={() => setShowJoinModal(false)}
                disabled={joinLoading}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
                onClick={handleJoinCourse}
                disabled={joinLoading}
              >
                {joinLoading ? 'Joining...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 1. 课程基本信息 */}
      <div className="bg-white rounded-xl shadow-md p-8 mb-8">
        <h1 className="text-4xl font-bold mb-4">{course.name}</h1>
        <p className="text-lg text-gray-600 mb-6">{course.introduction}</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <InfoCard title="Language" value={course.language} />
          <InfoCard title="Level" value={course.level.toString()} />
          <InfoCard title="Price" value={`$${course.display_price}`} />
          <InfoCard title="Goal" value={course.goal} />
        </div>
        <div className="prose max-w-none">
          <h3 className="text-2xl font-semibold mb-2">Course Details</h3>
          <p>{course.detail}</p>
        </div>
      </div>

      {/* 2. 老师列表 */}
      <TeacherList teachers={teachers} />

      {/* 3. 评价列表 */}
      <ReviewList reviews={reviews} />
    </div>
  );
}

// 小组件，用于展示单项信息
const InfoCard = ({ title, value }: { title: string, value: string }) => (
  <div className="bg-gray-50 p-4 rounded-lg text-center">
    <p className="text-sm text-gray-500">{title}</p>
    <p className="text-xl font-semibold">{value}</p>
  </div>
);

// 老师列表组件
const TeacherList = ({ teachers }: { teachers: Teacher[] }) => (
  <div className="bg-white rounded-xl shadow-md p-8 mb-8">
    <h3 className="text-2xl font-semibold mb-4">Meet Your Teachers</h3>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {(Array.isArray(teachers) ? teachers : []).map(teacher => (
        <div key={teacher.id} className="flex items-center space-x-4 bg-gray-50 p-4 rounded-lg">
          <img src={teacher.avatar || '/default-avatar.svg'} alt={teacher.name} className="w-16 h-16 rounded-full"/>
          <div>
            <h4 className="font-bold">{teacher.name}</h4>
            <p className="text-sm text-gray-600">{teacher.bio}</p>
          </div>
        </div>
      ))}
    </div>
  </div>
);

// 评价列表组件
const ReviewList = ({ reviews }: { reviews: Review[] }) => (
  <div className="bg-white rounded-xl shadow-md p-8">
    <h3 className="text-2xl font-semibold mb-4">Student Reviews</h3>
    <div className="space-y-6">
      {(Array.isArray(reviews) ? reviews : []).map(review => (
        <div key={review.id} className="border-b pb-4">
          <div className="flex items-center mb-2">
            <img src={review.avatar || '/default-avatar.svg'} alt={review.user} className="w-10 h-10 rounded-full mr-3"/>
            <div>
              <p className="font-semibold">{review.user}</p>
              <p className="text-xs text-gray-500">{new Date(review.date).toLocaleDateString()}</p>
            </div>
          </div>
          <div className="flex items-center mb-2">
            {[...Array(5)].map((_, i) => (
              <FaStar key={i} className={i < review.rating ? 'text-yellow-400' : 'text-gray-300'} />
            ))}
          </div>
          <p className="text-gray-700">{review.comment}</p>
        </div>
      ))}
    </div>
  </div>
); 