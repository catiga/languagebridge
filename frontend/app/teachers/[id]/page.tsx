"use client";

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { apiClient } from '@/app/utils/api';
import { FaCertificate, FaGlobe, FaLanguage, FaMapMarkerAlt } from 'react-icons/fa';

export default function TeacherProfilePage() {
  const params = useParams();
  const teacherNo = params.id;
  const [teacher, setTeacher] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDetail() {
      setLoading(true);
      try {
        const res = await apiClient.get<any>('/spwapi/teacher/detail', { teacher_no: teacherNo });
        if (res.code === 0 && res.data) {
          setTeacher(res.data);
        } else {
          setTeacher(null);
        }
      } catch {
        setTeacher(null);
      } finally {
        setLoading(false);
      }
    }
    if (teacherNo) fetchDetail();
  }, [teacherNo]);

  if (loading) return <div className="text-center py-20 text-gray-400">Loading...</div>;
  if (!teacher) return <div className="text-center py-20 text-gray-400">Teacher not found.</div>;

  const t = teacher;
  return (
    <div className="max-w-3xl mx-auto py-10 px-4">
      {/* Top Info */}
      <div className="flex flex-col items-center mb-8">
        <img src={t.avatar || '/default-avatar.svg'} alt={t.name} className="w-32 h-32 rounded-full object-cover border-4 border-blue-100 shadow mb-3" />
        <h1 className="text-2xl font-bold text-gray-900">{t.name}</h1>
        <div className="flex gap-4 text-gray-500 mt-2">
          <span><FaGlobe className="inline mr-1" />{t.nationality_name}</span>
          <span><FaMapMarkerAlt className="inline mr-1" />{t.living_country_name}</span>
          <span><FaLanguage className="inline mr-1" />{t.first_language}</span>
        </div>
        {t.introduction && <div className="mt-2 text-gray-700">{t.introduction}</div>}
      </div>

      {/* Detail */}
      {t.detail && (
        <div className="bg-white rounded-xl shadow p-6 mb-8">
          <h2 className="text-lg font-bold mb-2">About</h2>
          <div className="text-gray-700 whitespace-pre-line">{t.detail}</div>
        </div>
      )}

      {/* Certificates */}
      {Array.isArray(t.certificates) && t.certificates.length > 0 && (
        <div className="bg-white rounded-xl shadow p-6 mb-8">
          <h2 className="text-lg font-bold mb-2 flex items-center"><FaCertificate className="mr-2" />Certificates</h2>
          <ul className="space-y-2">
            {t.certificates.map((cert: any) => (
              <li key={cert.title} className="flex flex-col md:flex-row md:items-center md:gap-4">
                <span className="font-semibold">{cert.title}</span>
                <span className="text-gray-500 text-sm">{cert.issue_org}</span>
                <span className="text-gray-400 text-xs">{cert.get_date}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Courses */}
      {Array.isArray(t.courses) && t.courses.length > 0 && (
        <div className="bg-white rounded-xl shadow p-6 mb-8">
          <h2 className="text-lg font-bold mb-4">Courses</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {t.courses.map((course: any) => (
              <div key={course.id} className="border rounded-lg p-4 flex flex-col">
                <img src={course.course_picture || '/default-course-image.svg'} alt={course.name} className="w-full h-32 object-cover rounded mb-2" />
                <div className="font-bold text-gray-800">{course.name}</div>
                <div className="text-gray-500 text-sm mb-1">{course.language} | Level: {course.level}</div>
                <div className="text-gray-600 text-xs line-clamp-2 mb-2">{course.introduction}</div>
                <span className="text-xs text-gray-400">Sessions: {course.session_number}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
} 