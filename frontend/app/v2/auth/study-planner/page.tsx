'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import StudyPlannerPage from '../../../profile/study-planner/page';

export default function V2StudyPlannerPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const studentId = searchParams.get('student_id');

  useEffect(() => {
    // 如果没有student_id参数，重定向到dashboard
    if (!studentId) {
      router.push('/v2/auth/dashboard');
    }
  }, [studentId, router]);

  if (!studentId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Loading Study Planner
          </h2>
          <p className="text-gray-600">
            Preparing your personalized study plan...
          </p>
        </div>
      </div>
    );
  }

  // 直接使用现有的Study Planner组件
  return <StudyPlannerPage />;
} 