'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import CourseStatus00Panel from './CourseStatus00Panel';
import CourseStatus01Panel from './CourseStatus01Panel';
import CourseStatus10Panel from './CourseStatus10Panel';
import CourseStatus20Panel from './CourseStatus20Panel';
import { apiClient } from '../../utils/api';

function StatusMessage({ icon, title, description, color = 'gray' }: { icon: React.ReactNode, title: string, description?: string, color?: string }) {
  return (
    <div className={`flex flex-col items-center justify-center min-h-[60vh]`}> 
      <div className={`mb-4 text-${color}-400`}>{icon}</div>
      <div className={`text-2xl font-bold mb-2 text-${color}-700`}>{title}</div>
      {description && <div className={`text-${color}-500 text-base`}>{description}</div>}
    </div>
  );
}

export default function MyCourseDetailPage() {
  const params = useParams();
  const course_id = params?.course_id;
  const [course, setCourse] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!course_id) return;
    setLoading(true);
    apiClient
      .get('/spwapi/auth/course/detail', { uc_id: course_id })
      .then((res: any) => {
        if (res && res.code === 0 && res.data) {
          setCourse(res.data);
          setError(null);
        } else {
          setError('No course found.');
        }
      })
      .catch((e: any) => setError(e?.message || 'Failed to fetch course.'))
      .finally(() => setLoading(false));
  }, [course_id]);

  useEffect(() => {
  }, [course]);

  if (loading) return (
    <StatusMessage
      icon={<svg className="animate-spin h-10 w-10 text-blue-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path></svg>}
      title="Loading course details..."
      description="Please wait while we fetch your course information."
      color="blue"
    />
  );
  if (error) return (
    <StatusMessage
      icon={<svg className="h-10 w-10 text-red-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none"/><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01" /></svg>}
      title="Oops!"
      description={error}
      color="red"
    />
  );
  if (!course) return (
    <StatusMessage
      icon={<svg className="h-10 w-10 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none"/><path strokeLinecap="round" strokeLinejoin="round" d="M9 9h6v6H9z" /></svg>}
      title="No course found."
      description="The course you are looking for does not exist or has been removed."
      color="gray"
    />
  );

  switch (course.uc_ss) {
    case '00':
      return <CourseStatus00Panel course={course} params={{ course_id: String(course.id) }} />;
    case '01':
      return <CourseStatus01Panel course={course} params={{ course_id: String(course.id) }} />;
    case '10':
      return <CourseStatus10Panel course={course} params={{ course_id: String(course.id) }} />;
    case '20':
      return <CourseStatus20Panel course={course} params={{ course_id: String(course.id) }} />;
    default:
      return <StatusMessage
        icon={<svg className="h-10 w-10 text-yellow-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none"/><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01" /></svg>}
        title="Unknown status"
        description="This course has an unknown status."
        color="yellow"
      />;
  }
}