'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { FaSearch, FaChalkboardTeacher, FaChevronLeft, FaChevronRight, FaSpinner, FaUnlink } from 'react-icons/fa';
import { apiClient } from '@/app/utils/api';
import { ApiResponse } from '@/app/utils/interfaces';
import { toast } from 'react-toastify';

interface Course {
  id: number;
  name: string;
  introduction: string;
  detail: string;
  language: string;
  level: number;
  cost_price: string;
  display_price: string;
  goal: string;
  update_time: string;
  add_time: string;
  status: string;
  flag: number;
  duration: number;
  session_number: number;
  cover_image_url?: string; // This is not in the API response, making it optional
}

interface CourseListResponse {
  list: Course[];
  pn: number;
  ps: number;
  total: number;
  total_pages: number;
}

function CourseCard({ course, onBind, onUnbind, isBinding, isUnbinding, variant = 'discover' }: { course: Course; onBind?: (course: Course) => void; onUnbind?: (course: Course) => void; isBinding?: boolean; isUnbinding?: boolean; variant?: 'discover' | 'mine' }) {
  const [imgError, setImgError] = useState(false);

  const handleAction = () => {
    if (variant === 'discover' && onBind) {
      onBind(course);
    }
    if (variant === 'mine' && onUnbind) {
      onUnbind(course);
    }
  }

  const isLoading = isBinding || isUnbinding;

  return (
    <motion.div
      className="bg-white rounded-2xl shadow-lg overflow-hidden group transform hover:-translate-y-2 transition-transform duration-300"
      whileHover={{ scale: 1.03 }}
      layout
    >
      <div className="relative h-40 w-full bg-gray-200 flex items-center justify-center">
        {course.cover_image_url && !imgError ? (
          <Image
            src={course.cover_image_url}
            alt={course.name}
            layout="fill"
            objectFit="cover"
            onError={() => setImgError(true)}
            className="transition-transform duration-500 group-hover:scale-110"
          />
        ) : (
          <FaChalkboardTeacher className="text-gray-400 text-5xl" />
        )}
      </div>
      <div className="p-5">
        <h3 className="text-lg font-bold text-gray-800 truncate">{course.name}</h3>
        <p className="text-sm text-gray-600 mt-1 h-10 overflow-hidden">{course.introduction}</p>
        <div className="mt-4 flex justify-end">
          <button
            onClick={handleAction}
            disabled={isLoading}
            className={`font-semibold px-4 py-2 rounded-lg text-sm transition-colors w-28 flex justify-center items-center disabled:cursor-not-allowed ${
              variant === 'discover' 
                ? 'bg-indigo-500 text-white hover:bg-indigo-600 disabled:bg-indigo-300' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {isLoading ? (
              <FaSpinner className="animate-spin" />
            ) : (
              variant === 'discover' ? 'I can teach' : 'Unbind'
            )}
          </button>
        </div>
      </div>
    </motion.div>
  )
}

export default function CourseManagement() {
  const [activeTab, setActiveTab] = useState('discover');
  
  // State for Discover Courses
  const [courses, setCourses] = useState<Course[]>([]);
  const [discoverCurrentPage, setDiscoverCurrentPage] = useState(1);
  const [discoverTotalPages, setDiscoverTotalPages] = useState(0);
  const [isDiscoverLoading, setIsDiscoverLoading] = useState(true);

  // State for My Courses
  const [myCourses, setMyCourses] = useState<Course[]>([]);
  const [isMyCoursesLoading, setIsMyCoursesLoading] = useState(true);

  // State for Binding
  const [confirmingBindCourse, setConfirmingBindCourse] = useState<Course | null>(null);
  const [bindingCourseId, setBindingCourseId] = useState<number | null>(null);

  // State for Unbinding
  const [confirmingUnbindCourse, setConfirmingUnbindCourse] = useState<Course | null>(null);
  const [unbindingCourseId, setUnbindingCourseId] = useState<number | null>(null);

  useEffect(() => {
    if (activeTab === 'discover') {
      fetchSystemCourses(discoverCurrentPage);
    } else if (activeTab === 'my-courses') {
      fetchMyCourses();
    }
  }, [activeTab, discoverCurrentPage]);

  const fetchSystemCourses = async (page = 1) => {
    setIsDiscoverLoading(true);
    try {
      const res = await apiClient.get<ApiResponse<CourseListResponse>>('/spwapi/course/fetch', { pn: page });
      if (res.code === 0 && res.data && Array.isArray(res.data.list)) {
        setCourses(res.data.list);
        setDiscoverCurrentPage(res.data.pn);
        setDiscoverTotalPages(res.data.total_pages);
      } else {
        toast.error(`Error fetching courses: ${res.msg || 'Unknown error'}`);
        setCourses([]);
        setDiscoverTotalPages(0);
      }
    } catch (error) {
      console.error("Error fetching system courses:", error);
      toast.error("An unexpected network error occurred.");
      setCourses([]);
      setDiscoverTotalPages(0);
    } finally {
      setIsDiscoverLoading(false);
    }
  };

  const fetchMyCourses = async () => {
    setIsMyCoursesLoading(true);
    try {
      const res = await apiClient.get<ApiResponse<Course[]>>('/spwapi/tpa/auth/course/mine');
      if (res.code === 0 && Array.isArray(res.data)) {
        setMyCourses(res.data);
      } else {
        toast.error(`Error fetching my courses: ${res.msg || 'Unknown error'}`);
        setMyCourses([]);
      }
    } catch (error) {
      console.error("Error fetching my courses:", error);
      toast.error("An unexpected network error occurred while fetching your courses.");
      setMyCourses([]);
    } finally {
      setIsMyCoursesLoading(false);
    }
  };

  const handleBindRequest = (course: Course) => {
    setConfirmingBindCourse(course);
  };

  const handleUnbindRequest = (course: Course) => {
    setConfirmingUnbindCourse(course);
  };

  const executeBind = async () => {
    if (!confirmingBindCourse) return;

    const courseToBind = confirmingBindCourse;
    setBindingCourseId(courseToBind.id);
    setConfirmingBindCourse(null);

    try {
      const res = await apiClient.get<ApiResponse<null>>('/spwapi/tpa/auth/course/bind', { course_id: courseToBind.id });
      if (res.code === 0) {
        toast.success(`You are now able to teach "${courseToBind.name}"!`);
        // Refresh my courses list
        fetchMyCourses();
      } else {
        toast.error(`Failed to bind course: ${res.msg}`);
      }
    } catch (error) {
      console.error("Failed to bind course:", error);
      toast.error("An unexpected error occurred. Please try again.");
    } finally {
      setBindingCourseId(null);
    }
  };

  const executeUnbind = async () => {
    if (!confirmingUnbindCourse) return;

    const courseToUnbind = confirmingUnbindCourse;
    setUnbindingCourseId(courseToUnbind.id);
    setConfirmingUnbindCourse(null);

    try {
      const res = await apiClient.get<ApiResponse<null>>('/spwapi/tpa/auth/course/unbind', { course_id: courseToUnbind.id });
      if (res.code === 0) {
        toast.success(`Successfully unlinked from "${courseToUnbind.name}".`);
        fetchMyCourses(); // Refresh the list
      } else {
        toast.error(`Failed to unlink course: ${res.msg}`);
      }
    } catch (error) {
      console.error("Failed to unlink course:", error);
      toast.error("An unexpected error occurred while unlinking.");
    } finally {
      setUnbindingCourseId(null);
    }
  };

  const renderDiscoverCourses = () => {
    if (isDiscoverLoading) {
      return <div className="text-center p-8">Loading courses...</div>;
    }

    if (courses.length === 0) {
      return <div className="text-center p-8 text-gray-500">No courses found to discover.</div>
    }

    return (
      <AnimatePresence>
        <motion.div
          key={discoverCurrentPage}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 p-4">
            {courses.map(course => (
              <CourseCard 
                key={course.id} 
                course={course}
                onBind={handleBindRequest}
                onUnbind={handleUnbindRequest}
                isBinding={bindingCourseId === course.id}
                isUnbinding={unbindingCourseId === course.id}
                variant="discover"
              />
            ))}
          </div>

          {discoverTotalPages > 1 && (
            <Pagination
              currentPage={discoverCurrentPage}
              totalPages={discoverTotalPages}
              onPageChange={(page) => setDiscoverCurrentPage(page)}
            />
          )}
        </motion.div>
      </AnimatePresence>
    );
  };

  const renderMyCourses = () => {
    if (isMyCoursesLoading) {
      return <div className="text-center p-8">Loading your courses...</div>;
    }

    if (myCourses.length === 0) {
      return <div className="text-center p-8 text-gray-500">You have not added any courses yet.</div>
    }

    return (
       <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 p-4">
            {myCourses.map(course => (
              <CourseCard 
                key={course.id} 
                course={course}
                onUnbind={handleUnbindRequest}
                isUnbinding={unbindingCourseId === course.id}
                variant="mine"
              />
            ))}
          </div>
        </motion.div>
      </AnimatePresence>
    );
  };
  
  const selectTab = (tab: string) => {
    setActiveTab(tab);
  };

  return (
    <div className="p-4 md:p-6">
      <div className="flex border-b border-gray-200">
        <TabButton
          title="Discover Courses"
          isActive={activeTab === 'discover'}
          onClick={() => selectTab('discover')}
        />
        <TabButton
          title="My Courses"
          isActive={activeTab === 'my-courses'}
          onClick={() => selectTab('my-courses')}
        />
      </div>

      <div className="mt-6">
        {activeTab === 'discover' ? renderDiscoverCourses() : renderMyCourses()}
      </div>

      <ConfirmActionModal 
        isOpen={confirmingBindCourse !== null}
        onClose={() => setConfirmingBindCourse(null)}
        onConfirm={executeBind}
        courseName={confirmingBindCourse?.name || ''}
        actionType="bind"
      />

      <ConfirmActionModal 
        isOpen={confirmingUnbindCourse !== null}
        onClose={() => setConfirmingUnbindCourse(null)}
        onConfirm={executeUnbind}
        courseName={confirmingUnbindCourse?.name || ''}
        actionType="unbind"
      />
    </div>
  );
}

interface TabButtonProps {
    title: string;
    isActive: boolean;
    onClick: () => void;
}

const TabButton: React.FC<TabButtonProps> = ({ title, isActive, onClick }) => {
    return (
        <button
            onClick={onClick}
            className={`px-4 py-2 -mb-px text-sm font-medium border-b-2 transition-colors duration-200
                ${isActive
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
            `}
        >
            {title}
        </button>
    );
};

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

const Pagination: React.FC<PaginationProps> = ({ currentPage, totalPages, onPageChange }) => {
  const pageNumbers = [];
  // Logic to create a window of page numbers, e.g., [1, '...', 4, 5, 6, '...', 10]
  // For simplicity, we'll show a limited set of numbers
  const pagesToShow = 5;
  let startPage = Math.max(1, currentPage - Math.floor(pagesToShow / 2));
  let endPage = Math.min(totalPages, startPage + pagesToShow - 1);
  
  if (endPage - startPage + 1 < pagesToShow) {
    startPage = Math.max(1, endPage - pagesToShow + 1);
  }

  for (let i = startPage; i <= endPage; i++) {
    pageNumbers.push(i);
  }

  return (
    <div className="flex justify-center items-center space-x-2 mt-8">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="p-2 rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <FaChevronLeft />
      </button>
      
      {startPage > 1 && (
        <>
          <button onClick={() => onPageChange(1)} className="px-4 py-2 text-sm rounded-md hover:bg-gray-100">1</button>
          {startPage > 2 && <span className="px-4 py-2 text-sm text-gray-500">...</span>}
        </>
      )}

      {pageNumbers.map(number => (
        <button
          key={number}
          onClick={() => onPageChange(number)}
          className={`px-4 py-2 text-sm rounded-md ${currentPage === number ? 'bg-indigo-500 text-white' : 'hover:bg-gray-100'}`}
        >
          {number}
        </button>
      ))}

      {endPage < totalPages && (
        <>
          {endPage < totalPages - 1 && <span className="px-4 py-2 text-sm text-gray-500">...</span>}
          <button onClick={() => onPageChange(totalPages)} className="px-4 py-2 text-sm rounded-md hover:bg-gray-100">{totalPages}</button>
        </>
      )}

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="p-2 rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <FaChevronRight />
      </button>
    </div>
  );
};

interface ConfirmActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  courseName: string;
  actionType: 'bind' | 'unbind';
}

const ConfirmActionModal: React.FC<ConfirmActionModalProps> = ({ isOpen, onClose, onConfirm, courseName, actionType }) => {
  const messages = {
    bind: {
      title: 'Confirm Action',
      message: `Are you sure you want to add <span class="font-semibold text-indigo-600">${courseName}</span> to your list of teachable courses?`,
      confirmText: 'Confirm'
    },
    unbind: {
      title: 'Confirm Unlink',
      message: `Are you sure you want to remove <span class="font-semibold text-red-600">${courseName}</span> from your courses? This will not delete the course from the system.`,
      confirmText: 'Confirm Unlink'
    }
  }

  const currentAction = messages[actionType];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-50 p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -50, opacity: 0 }}
            className="bg-white rounded-2xl p-8 shadow-xl w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-bold text-gray-800">{currentAction.title}</h3>
            <p className="text-gray-600 mt-2 mb-6" dangerouslySetInnerHTML={{ __html: currentAction.message }} />
            <div className="flex justify-end space-x-4">
              <motion.button
                type="button"
                whileHover={{ scale: 1.05 }}
                onClick={onClose}
                className="px-6 py-2 bg-gray-100 text-gray-700 rounded-xl font-medium"
              >
                Cancel
              </motion.button>
              <motion.button
                type="button"
                whileHover={{ scale: 1.05 }}
                onClick={onConfirm}
                className={`px-6 py-2 text-white rounded-xl font-medium ${
                  actionType === 'bind' ? 'bg-indigo-600' : 'bg-red-600'
                }`}
              >
                {currentAction.confirmText}
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}; 