'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import CourseStatus00Panel from './CourseStatus00Panel';
import CourseStatus01Panel from './CourseStatus01Panel';
import CourseStatus10Panel from './CourseStatus10Panel';
import CourseStatus20Panel from './CourseStatus20Panel';
import { apiClient } from '../../utils/api';

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

  if (loading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;
  if (!course) return <div>No course found.</div>;

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
      return <div>Unknown status</div>;
  }
}