"use client";
import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { apiClient } from '@/app/utils/api';
import { CourseDetail, Teacher, Review, ApiResponse } from '@/app/utils/interfaces';
import Image from 'next/image';
import {
  FaArrowLeft, FaChalkboardTeacher, FaClock, FaDollarSign, FaLanguage, FaStar, FaUserGraduate,
  FaBullseye, FaBookOpen, FaComments, FaGlobeAmericas, FaMapMarkerAlt
} from 'react-icons/fa';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import ProfileLayout from '../../ProfileLayout';
import { motion } from 'framer-motion';
import ConfirmModal from '@/app/components/ConfirmModal';

export default function ProfileCourseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { id } = params;

  const [course, setCourse] = useState<CourseDetail | null>(null);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'details' | 'teachers' | 'reviews'>('details');
  const [isJoining, setIsJoining] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    if (id) {
      const fetchCourseData = async () => {
        setIsLoading(true);
        try {
          const [courseRes, teachersRes, reviewsRes] = await Promise.all([
            apiClient.get<ApiResponse<CourseDetail>>(`/spwapi/auth/course/detail?course_id=${id}`),
            apiClient.get<ApiResponse<Teacher[]>>(`/spwapi/course/teachers?course_id=${id}`),
            apiClient.get<ApiResponse<Review[]>>(`/spwapi/course/reviews?course_id=${id}`),
          ]);

          if (courseRes.code === 0 && courseRes.data) {
            setCourse(courseRes.data);
          } else {
            toast.error(courseRes.msg || 'Failed to fetch course details.');
          }

          if (teachersRes.code === 0 && teachersRes.data) {
            setTeachers(teachersRes.data);
          }
          if (reviewsRes.code === 0 && reviewsRes.data) {
            setReviews(reviewsRes.data);
          }
        } catch (error) {
          toast.error('An error occurred while fetching course data.');
        } finally {
          setIsLoading(false);
        }
      };
      fetchCourseData();
    }
  }, [id]);

  // 课程报名逻辑
  const handleJoinCourse = async () => {
    if (!course) return;
    if (course.joined) return;
    setShowConfirm(true);
  };

  const handleConfirmJoin = async () => {
    if (!course) return;
    setIsJoining(true);
    try {
      const res = await apiClient.get<ApiResponse<any>>(`/spwapi/auth/course/join?course_id=${course.id}`);
      if (res.code === 0) {
        toast.success('Successfully joined the course!');
        setCourse({ ...course, joined: true });
      } else {
        toast.error(res.msg || 'Failed to join the course.');
      }
    } catch (e) {
      toast.error('Network error, please try again.');
    } finally {
      setIsJoining(false);
      setShowConfirm(false);
    }
  };

  if (isLoading) {
    return (
      <ProfileLayout>
        <div className="flex justify-center items-center h-96 bg-gray-50">
          <div className="animate-spin rounded-full h-24 w-24 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </ProfileLayout>
    );
  }

  if (!course) {
    return (
      <ProfileLayout>
        <div className="flex flex-col justify-center items-center h-96 bg-gray-50 text-center px-4">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Course Not Found</h2>
          <p className="text-gray-600 mb-8">We couldn't find the course you were looking for. It might have been removed or the link is incorrect.</p>
          <button
            onClick={() => router.push('/courses')}
            className="flex items-center px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-all shadow-md hover:shadow-lg"
          >
            <FaArrowLeft className="mr-2" />
            Back to All Courses
          </button>
        </div>
      </ProfileLayout>
    );
  }

  const tabContent = {
    details: (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h3 className="text-2xl font-bold text-gray-800 mb-4">About this course</h3>
        <p className="text-gray-600 whitespace-pre-line leading-relaxed">{course.detail}</p>
        <h3 className="text-2xl font-bold text-gray-800 mt-8 mb-4">What you will learn</h3>
        <p className="text-gray-600 whitespace-pre-line leading-relaxed">{course.goal}</p>
      </motion.div>
    ),
    teachers: (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h3 className="text-2xl font-bold text-gray-800 mb-6">Meet Your Instructors</h3>
        <div className="space-y-8">
          {teachers.length > 0 ? teachers.map(teacher => (
            <div key={teacher.id} className="bg-white p-6 rounded-2xl shadow-md border border-gray-100">
              <div className="flex flex-col sm:flex-row items-start space-y-4 sm:space-y-0 sm:space-x-6">
                <Image src={teacher.avatar || '/default-avatar.svg'} alt={teacher.name} width={80} height={80} className="rounded-full flex-shrink-0"/>
                <div className="flex-1">
                  <h4 className="font-bold text-xl text-gray-900">{teacher.first_name} {teacher.last_name}</h4>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500 mt-1">
                      <span className="flex items-center"><FaGlobeAmericas className="mr-1.5 text-gray-400"/>From {teacher.nationality_name}</span>
                      <span className="flex items-center"><FaMapMarkerAlt className="mr-1.5 text-gray-400"/>Lives in {teacher.living_country_name}</span>
                  </div>
                  <p className="text-gray-700 mt-3 text-sm">{teacher.detail}</p>
                </div>
              </div>
              <div className="mt-6">
                  <h5 className="font-semibold text-gray-800 mb-3 text-sm">Certificates</h5>
                  {teacher.certificates && teacher.certificates.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {teacher.certificates.map((cert, index) => (
                              <div key={index} className="border border-gray-200 rounded-lg p-3 bg-gray-50/50 flex items-center space-x-3 hover:shadow-sm transition-shadow">
                                  <a href={cert.document} target="_blank" rel="noopener noreferrer" className="flex-shrink-0">
                                     <Image src={cert.document} alt={cert.title} width={48} height={48} className="rounded-md object-cover"/>
                                  </a>
                                  <div>
                                      <p className="font-bold text-sm text-gray-800">{cert.title}</p>
                                      <p className="text-xs text-gray-600">{cert.issue_org} ({new Date(cert.get_date).getFullYear()})</p>
                                  </div>
                              </div>
                          ))}
                      </div>
                  ) : (
                      <p className="text-sm text-gray-500 italic">No certificates provided.</p>
                  )}
              </div>
            </div>
          )) : <p className="text-gray-500">Teacher information is not available yet.</p>}
        </div>
      </motion.div>
    ),
    reviews: (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h3 className="text-2xl font-bold text-gray-800 mb-6">Student Feedback</h3>
        <div className="space-y-6">
            {reviews.length > 0 ? reviews.map(review => (
            <div key={review.id} className="border-b border-gray-200 pb-4">
                <div className="flex items-center mb-2">
                <Image src={review.avatar || '/default-avatar.svg'} alt={review.user} width={40} height={40} className="rounded-full mr-3"/>
                <div>
                    <p className="font-semibold text-gray-800">{review.user}</p>
                    <p className="text-xs text-gray-500">{new Date(review.date).toLocaleDateString()}</p>
                </div>
                </div>
                <div className="flex items-center my-2">
                {[...Array(5)].map((_, i) => (
                    <FaStar key={i} className={i < review.rating ? 'text-yellow-400' : 'text-gray-300'} />
                ))}
                </div>
                <p className="text-gray-600">{review.comment}</p>
            </div>
            )) : <p className="text-gray-500">There are no reviews for this course yet.</p>}
        </div>
        </motion.div>
    ),
  };

  return (
    <ProfileLayout>
      <ToastContainer position="top-center" autoClose={3000} hideProgressBar={false} />
      <ConfirmModal
        isOpen={showConfirm}
        title="Join Course"
        content="Are you sure you want to join this course?"
        confirmText="Join"
        cancelText="Cancel"
        onConfirm={handleConfirmJoin}
        onCancel={() => setShowConfirm(false)}
        loading={isJoining}
      />
      <div className="max-w-5xl mx-auto flex flex-col md:flex-row gap-8 mt-8">
        {/* 左侧主内容 */}
        <div className="flex-1 bg-white rounded-2xl shadow-lg p-8">
          <button
            onClick={() => router.back()}
            className="flex items-center mb-6 text-blue-600 hover:underline"
          >
            <FaArrowLeft className="mr-2" /> Back to Courses
          </button>
          <h1 className="text-3xl font-bold mb-2">{course.name}</h1>
          <p className="text-gray-600 mb-4">{course.introduction}</p>
          {/* Tab切换 */}
          <div className="flex gap-6 border-b mb-6">
            <button
              className={`pb-2 border-b-2 ${activeTab === 'details' ? 'border-blue-600 text-blue-600 font-bold' : 'border-transparent text-gray-500'}`}
              onClick={() => setActiveTab('details')}
            >
              <FaBookOpen className="inline mr-1" /> Details
            </button>
            <button
              className={`pb-2 border-b-2 ${activeTab === 'teachers' ? 'border-blue-600 text-blue-600 font-bold' : 'border-transparent text-gray-500'}`}
              onClick={() => setActiveTab('teachers')}
            >
              <FaChalkboardTeacher className="inline mr-1" /> Teachers
            </button>
            <button
              className={`pb-2 border-b-2 ${activeTab === 'reviews' ? 'border-blue-600 text-blue-600 font-bold' : 'border-transparent text-gray-500'}`}
              onClick={() => setActiveTab('reviews')}
            >
              <FaComments className="inline mr-1" /> Reviews
            </button>
          </div>
          <div className="min-h-[200px]">{tabContent[activeTab]}</div>
        </div>
        {/* 右侧信息卡 */}
        <div className="w-full md:w-80 flex-shrink-0">
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 flex flex-col items-center">
            <div className="w-full h-48 rounded-xl overflow-hidden bg-gray-100 flex items-center justify-center mb-4">
              <img
                src={course.course_picture ? course.course_picture : '/default-course-image.svg'}
                alt={course.name}
                className="w-full h-full object-cover"
              />
            </div>
            {/* 价格和报名按钮可根据需要保留或隐藏 */}
            {/* <div className="text-2xl font-bold text-blue-600 mb-2">${course.display_price} <span className="text-base font-normal text-gray-500">/ course</span></div> */}
            <button
              className={`w-full bg-blue-600 text-white font-bold py-3 rounded-lg mb-4 hover:bg-blue-700 transition-all ${course.joined ? 'opacity-60 cursor-not-allowed' : ''}`}
              onClick={handleJoinCourse}
              disabled={!!course.joined || isJoining}
            >
              {course.joined ? 'Already Joined' : (isJoining ? 'Joining...' : 'Join Course')}
            </button>
            <div className="flex flex-col gap-2 w-full text-sm text-gray-600">
              <div className="flex items-center gap-2"><FaClock className="text-blue-400" /> {course.duration} minutes per session</div>
              <div className="flex items-center gap-2"><FaUserGraduate className="text-green-400" /> {course.session_number} sessions included</div>
              <div className="flex items-center gap-2"><FaLanguage className="text-purple-400" /> Conducted in {course.language}</div>
              <div className="flex items-center gap-2"><FaBullseye className="text-yellow-400" /> Level {course.level}</div>
            </div>
          </div>
        </div>
      </div>
    </ProfileLayout>
  );
} 