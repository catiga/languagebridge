'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { apiClient } from '../../utils/api';
import { CourseDetail, Teacher, Review, ApiResponse } from '../../utils/interfaces';
import Image from 'next/image';
import {
  FaArrowLeft, FaChalkboardTeacher, FaClock, FaDollarSign, FaLanguage, FaStar, FaUserGraduate,
  FaBullseye, FaBookOpen, FaComments, FaGlobeAmericas, FaMapMarkerAlt
} from 'react-icons/fa';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import LoginModal from '../../components/LoginModal';
import { motion } from 'framer-motion';
import dynamic from "next/dynamic";

const ApplyTrialLessonModal = dynamic(() => import("@/app/profile/trial-lessons/ApplyTrialLessonModal"), { ssr: false });

export default function CourseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { id } = params;

  const [course, setCourse] = useState<CourseDetail | null>(null);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('details');
  const [isJoining, setIsJoining] = useState(false);
  const [showTrialModal, setShowTrialModal] = useState(false);

  useEffect(() => {
    if (id) {
      const fetchCourseData = async () => {
        setIsLoading(true);
        try {
          const [courseRes, teachersRes, reviewsRes] = await Promise.all([
            apiClient.get<ApiResponse<CourseDetail>>(`/spwapi/course/detail?course_id=${id}`),
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

  const handleJoinCourse = async () => {
    const token = (typeof window !== 'undefined') ? (localStorage.getItem('token') || sessionStorage.getItem('token')) : null;
    if (!token) {
      setIsLoginModalOpen(true);
      return;
    }
    if (!course) return;
    setIsJoining(true);
    try {
      const res = await apiClient.get<ApiResponse<any>>(`/spwapi/auth/course/join?course_id=${course.id}`);
      if (res.code === 0) {
        toast.success('Successfully joined the course! Redirecting...');
        setTimeout(() => {
          router.push('/profile?tab=courses');
        }, 1500);
      } else {
        toast.error(res.msg || 'Failed to join the course.');
      }
    } catch (e) {
      toast.error('Network error, please try again.');
    } finally {
      setIsJoining(false);
    }
  };
  
  const handleLoginSuccess = () => {
    toast.info('Welcome! Please click "Join Course" again to enroll.');
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="flex flex-col justify-center items-center h-screen bg-gray-50 text-center px-4">
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
    <>
      <ToastContainer position="top-center" autoClose={3000} hideProgressBar={false} />
      <LoginModal isOpen={isLoginModalOpen} onClose={() => setIsLoginModalOpen(false)} onLoginSuccess={handleLoginSuccess} />
      
      <div className="bg-gray-50 min-h-screen">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-6">
            <button
              onClick={() => router.push('/courses')}
              className="flex items-center text-gray-600 hover:text-blue-600 font-medium"
            >
              <FaArrowLeft className="mr-2" />
              Back to Courses
            </button>
          </div>

          <div className="lg:grid lg:grid-cols-3 lg:gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2">
                <div className="bg-white rounded-2xl shadow-lg p-8">
                    <h1 className="text-4xl font-extrabold text-gray-900 mb-3">{course.name}</h1>
                    <p className="text-lg text-gray-600 mb-8">{course.introduction}</p>

                    <div className="border-b border-gray-200 mb-6">
                        <nav className="-mb-px flex space-x-6">
                            <TabButton icon={<FaBookOpen/>} text="Details" active={activeTab === 'details'} onClick={() => setActiveTab('details')} />
                            <TabButton icon={<FaChalkboardTeacher/>} text="Teachers" active={activeTab === 'teachers'} onClick={() => setActiveTab('teachers')} />
                            <TabButton icon={<FaComments/>} text="Reviews" active={activeTab === 'reviews'} onClick={() => setActiveTab('reviews')} />
                        </nav>
                    </div>
                    <div>{tabContent[activeTab as keyof typeof tabContent]}</div>
                </div>
            </div>

            {/* Sticky Sidebar */}
            <div className="lg:col-span-1 mt-8 lg:mt-0">
                <div className="sticky top-8 bg-white rounded-2xl shadow-lg overflow-hidden">
                    <div className="relative h-56 w-full">
                        <Image
                        src={course.course_picture || '/default-course-image.svg'}
                        alt={course.name}
                        layout="fill"
                        objectFit="cover"
                        />
                    </div>
                    <div className="p-6">
                        <div className="flex items-baseline justify-center mb-6">
                            <span className="text-4xl font-bold text-gray-900">${course.display_price}</span>
                            <span className="ml-2 text-gray-500">/ course</span>
                        </div>

                        <button
                            onClick={handleJoinCourse}
                            className="w-full px-6 py-4 bg-blue-600 text-white text-lg rounded-xl font-bold hover:bg-blue-700 transition-transform transform hover:scale-105 disabled:bg-blue-300 flex items-center justify-center"
                            disabled={isJoining}
                        >
                            {isJoining && <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></span>}
                            {isJoining ? 'Joining...' : 'Join Course'}
                        </button>
                        
                        <ul className="mt-6 space-y-3 text-gray-600">
                            <InfoRow icon={<FaClock/>} text={`${course.duration} minutes per session`} />
                            <InfoRow icon={<FaUserGraduate/>} text={`${course.session_number} sessions included`} />
                            <InfoRow icon={<FaLanguage/>} text={`Conducted in ${course.language}`} />
                            <InfoRow icon={<FaBullseye/>} text={`Level ${course.level}`} />
                        </ul>
                        <button
                            className="w-full px-6 py-3 mb-4 rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 text-white font-bold text-lg shadow hover:scale-105 transition"
                            onClick={() => setShowTrialModal(true)}
                        >
                            Apply for Trial Lesson
                        </button>
                        <ApplyTrialLessonModal
                            open={showTrialModal}
                            onClose={() => setShowTrialModal(false)}
                            courseId={course.id}
                            courseName={course.name}
                            teachers={teachers}
                        />
                    </div>
                </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

const InfoRow = ({ icon, text }: { icon: React.ReactNode; text: string }) => (
    <li className="flex items-center">
      <div className="text-blue-500 mr-3">{icon}</div>
      <span>{text}</span>
    </li>
);

const TabButton = ({ icon, text, active, onClick }: { icon: React.ReactNode; text: string; active: boolean; onClick: () => void; }) => (
    <button
      onClick={onClick}
      className={`flex items-center px-1 py-4 border-b-2 font-medium text-sm transition-colors
        ${
          active
            ? 'border-blue-500 text-blue-600'
            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
        }`}
    >
      <div className="mr-2">{icon}</div>
      {text}
    </button>
); 