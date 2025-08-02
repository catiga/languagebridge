'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import WelcomeSection from './components/WelcomeSection';
import StudentCenteredOverview from './components/StudentCenteredOverview';
import RecommendedCourses from './components/RecommendedCourses';
import QuickActions from './components/QuickActions';
import RealLearningStats from './components/RealLearningStats';
import FeatureUnlock from './components/FeatureUnlock';
import Navigation from './components/Navigation';

export default function V2Dashboard() {
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // 模拟加载时间
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Loading Your Dashboard
          </h2>
          <p className="text-gray-600">
            Preparing your personalized learning experience...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Navigation />
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => router.push('/v2/auth/profile')}
                  className="text-white hover:text-blue-100 transition-colors text-sm font-medium"
                >
                  Profile
                </button>
                <div className="w-px h-4 bg-white bg-opacity-30"></div>
                <button
                  onClick={() => router.push('/logout')}
                  className="text-white hover:text-blue-100 transition-colors text-sm font-medium"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Welcome Section */}
          <WelcomeSection />

          {/* Student Centered Overview - 核心功能 */}
          <StudentCenteredOverview />

          {/* Learning Stats - 学习统计 */}
          <RealLearningStats />

          {/* Quick Actions - 快捷操作 */}
          <QuickActions />

          {/* Recommended Courses - 推荐课程 */}
          <RecommendedCourses showRecommendations={false} />

          {/* Feature Unlock - 功能解锁提示 */}
          <FeatureUnlock />
        </div>
      </div>

      {/* Footer */}
      <div className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-gray-600">
            <p>© 2024 EnglishBridge. All rights reserved.</p>
            <p className="mt-2 text-sm">
              Empowering your learning journey with AI-driven personalized education
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
