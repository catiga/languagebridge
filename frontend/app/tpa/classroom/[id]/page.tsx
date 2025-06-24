'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { apiClient } from '@/app/utils/api';
import { FaBook, FaChalkboardTeacher, FaUserGraduate, FaClock } from 'react-icons/fa';

export default function TeacherClassroomPage() {
  const params = useParams();
  const { id } = params;
  const [details, setDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    apiClient.get('/spwapi/tpa/auth/course/meeting/fetch', { btid: id })
      .then(res => {
        if (res && res.code === 0 && res.data) {
          setDetails(res.data);
        } else {
          setError(res?.msg || 'Failed to get lesson details.');
        }
      })
      .catch(e => setError(e?.message || 'Network error.'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="flex items-center justify-center h-screen">Loading...</div>;
  if (error || !details) return <div className="flex items-center justify-center h-screen text-red-500">{error || 'Could not load classroom.'}</div>;

  return (
    <div className="flex h-screen bg-gray-200 font-sans">
      {/* 左侧信息栏 */}
      <aside className="w-80 bg-white shadow-lg flex flex-col p-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-8">Classroom</h1>
        <div className="space-y-6">
          <div className="p-4 bg-slate-100 rounded-lg">
            <div className="flex items-center text-gray-700 mb-2">
              <FaBook className="w-5 h-5 mr-3 text-blue-500" />
              <h2 className="font-bold">Course</h2>
            </div>
            <p className="text-lg text-gray-900 ml-8">{details.course_name}</p>
          </div>
          <div className="p-4 bg-slate-100 rounded-lg">
            <div className="flex items-center text-gray-700 mb-2">
              <FaChalkboardTeacher className="w-5 h-5 mr-3 text-green-500" />
              <h2 className="font-bold">Teacher</h2>
            </div>
            <p className="text-lg text-gray-900 ml-8">{details.teacher_name}</p>
          </div>
          <div className="p-4 bg-slate-100 rounded-lg">
            <div className="flex items-center text-gray-700 mb-2">
              <FaUserGraduate className="w-5 h-5 mr-3 text-purple-500" />
              <h2 className="font-bold">Student</h2>
            </div>
            <p className="text-lg text-gray-900 ml-8">{details.student_name || 'Student'}</p>
          </div>
          <div className="p-4 bg-slate-100 rounded-lg">
            <div className="flex items-center text-gray-700 mb-2">
              <FaClock className="w-5 h-5 mr-3 text-orange-500" />
              <h2 className="font-bold">Time</h2>
            </div>
            <p className="text-lg text-gray-900 ml-8">{details.lesson_date} {details.start_time} - {details.end_time}</p>
          </div>
        </div>
      </aside>
      {/* 右侧iframe */}
      <main className="flex-1 flex bg-gray-800">
        <iframe
          src={details.meeting_uri}
          title="Online Classroom"
          className="w-full h-full border-0"
          allow="camera; microphone; fullscreen; speaker; display-capture"
        ></iframe>
      </main>
    </div>
  );
} 