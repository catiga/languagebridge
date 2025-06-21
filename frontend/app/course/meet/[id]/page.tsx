'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { apiClient } from '../../../utils/api';
import { FaBook, FaChalkboardTeacher, FaUserGraduate, FaClock } from 'react-icons/fa';
import format from 'date-fns/format';

// Updated interface to match your new API response
interface LessonDetails {
  meeting_uri: string;
  book_id: number;
  course_name: string;
  course_detail: string;
  teacher_name: string;
  teacher_detail: string;
  // NOTE: Your latest API response does not include student_name.
  // The UI will show a default value.
  student_name?: string; 
  lesson_date: string;
  start_time: string;
  end_time: string;
}

export default function MeetPage() {
  const params = useParams();
  const { id } = params;

  const [details, setDetails] = useState<LessonDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setError("No lesson ID provided.");
      setLoading(false);
      return;
    }

    const fetchMeetingInfo = async () => {
      try {
        const res = await apiClient.get('/spwapi/auth/course/meeting/fetch', { btid: id });
        if (res && res.code === 0 && res.data) {
          setDetails(res.data);
        } else {
          throw new Error(res?.msg || "Failed to get lesson details.");
        }
      } catch (e: any) {
        setError(e?.message || "An error occurred while preparing the classroom.");
      } finally {
        setLoading(false);
      }
    };

    fetchMeetingInfo();
  }, [id]);
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <div className="text-xl font-semibold text-gray-700">Loading Classroom...</div>
      </div>
    );
  }

  if (error || !details) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <div className="text-xl font-semibold text-red-500">{error || "Could not load classroom."}</div>
      </div>
    );
  }

  // This function now combines the date and time strings before formatting.
  const formatTime = (date: string, time: string) => {
    try {
      const dateTimeString = `${date}T${time}`;
      return format(new Date(dateTimeString), 'h:mm a');
    } catch {
      return 'Invalid time';
    }
  };

  const lessonDuration = details.lesson_date && details.start_time && details.end_time 
    ? `${formatTime(details.lesson_date, details.start_time)} - ${formatTime(details.lesson_date, details.end_time)}`
    : 'Time not specified';

  return (
    <div className="flex h-screen bg-gray-200 font-sans">
      {/* Left Sidebar */}
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
            <p className="text-lg text-gray-900 ml-8">{lessonDuration}</p>
          </div>
        </div>
      </aside>

      {/* Main Content - Iframe */}
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