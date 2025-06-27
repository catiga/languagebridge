"use client";
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ToastContainer, toast } from 'react-toastify';
import { apiClient } from '../../utils/api';
import ConfirmModal from '../../components/ConfirmModal';

export default function CourseStatus01Panel({ course, params }: { course: any, params: { course_id: string } }) {
  const router = useRouter();
  const [teachers, setTeachers] = useState<any[]>([]);
  const [teacherLoading, setTeacherLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);

  useEffect(() => {
    setTeacherLoading(true);
    apiClient
      .get('/spwapi/course/teachers', { course_id: params.course_id })
      .then((res: any) => {
        if (res && res.code === 0 && Array.isArray(res.data)) {
          setTeachers(res.data);
        } else {
          setTeachers([]);
        }
      })
      .finally(() => setTeacherLoading(false));
  }, [params.course_id]);

  const handleCancel = async () => {
    setShowConfirm(true);
  };
  const doCancel = async () => {
    setCancelLoading(true);
    try {
      const res: any = await apiClient.get('/spwapi/auth/course/cancel', { uc_id: course.uc_id });
      if (res && res.code === 0) {
        toast.success('Cancelled successfully!');
        setTimeout(() => {
          router.push('/profile/courses');
        }, 1200);
      } else {
        toast.error(res?.msg || 'Cancel failed');
      }
    } catch (e: any) {
      toast.error(e?.message || 'Cancel failed');
    } finally {
      setCancelLoading(false);
      setShowConfirm(false);
    }
  };
  const handlePay = () => {
    // TODO: 跳转到支付页面或弹窗
    toast.info('Go to payment (mock)');
  };

  // 找到当前老师
  const teacher = teachers.find(t => t.id === (course.booked_trans?.[0]?.teacher_id));

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-md p-8 mt-8">
      {/* 课程图片和基本信息 */}
      <div className="mb-8 p-6 rounded-xl shadow bg-gray-50 flex gap-6 items-center">
        <img
          src={course.course_picture || '/default-course-image.svg'}
          alt={course.name}
          className="w-24 h-24 rounded-xl object-cover border"
        />
        <div className="flex-1">
          <h2 className="text-3xl font-bold mb-2">{course.name}</h2>
          <div className="text-gray-700 mb-2">{course.introduction}</div>
          <div className="flex flex-wrap gap-6 text-gray-600 text-sm">
            <div><b>Language:</b> {course.language}</div>
            <div><b>Level:</b> {course.level}</div>
            <div><b>Price/Week:</b> ${course.display_price || course.price_per_week || ''}</div>
            <div><b>Duration:</b> {course.duration} min</div>
          </div>
        </div>
      </div>
      {/* 老师和时间信息 */}
      <div className="mb-6 p-6 rounded-xl shadow bg-white border border-gray-200">
        <div className="font-semibold mb-4 text-lg tracking-wide">Teacher:</div>
        {teacherLoading ? (
          <div className="py-2 text-blue-600">Loading teacher info...</div>
        ) : teacher ? (
          <div className="flex items-center gap-4 mb-4">
            <img src={teacher.avatar || '/default-avatar.svg'} alt={teacher.name} className="w-16 h-16 rounded-full object-cover border" />
            <div>
              <div className="font-bold text-lg text-gray-800">{teacher.name}</div>
              <div className="text-xs text-gray-500 mt-1">{teacher.introduction}</div>
              <div className="flex flex-wrap gap-2 mt-2 text-xs text-gray-500">
                <span className="bg-cyan-100 text-cyan-700 px-2 py-0.5 rounded">Nationality: {teacher.nationality_name || '-'}</span>
                <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded">Living: {teacher.living_country_name || '-'}</span>
                <span className="bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded">First Language: {teacher.first_language || '-'}</span>
                <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded">Teacher No: {teacher.teacher_no || '-'}</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="mb-4">{course.teacher_name || '-'}</div>
        )}
        <div className="font-semibold mb-2">Class Time:</div>
        <ul className="list-disc pl-6 text-gray-700">
          {Array.isArray(course.booked_trans) && course.booked_trans.length > 0 ? course.booked_trans.map((item: any, idx: number) => (
            <li key={idx}>{item.lesson_date?.slice(0, 10)} {item.start_time?.slice(0, 5)} - {item.end_time?.slice(0, 5)}</li>
          )) : <li>-</li>}
        </ul>
      </div>
      {/* 操作按钮 */}
      <div className="flex justify-end gap-4 mt-6">
        <button className="px-4 py-2 rounded bg-gray-200" onClick={handleCancel}>Cancel</button>
        <button className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700" onClick={handlePay}>Pay</button>
      </div>
      <ConfirmModal
        isOpen={showConfirm}
        title="Cancel Course"
        content="Are you sure you want to cancel this course? This action cannot be undone."
        confirmText="Confirm"
        cancelText="Cancel"
        loading={cancelLoading}
        onConfirm={doCancel}
        onCancel={() => setShowConfirm(false)}
      />
      <ToastContainer position="top-center" autoClose={2000} />
    </div>
  );
} 