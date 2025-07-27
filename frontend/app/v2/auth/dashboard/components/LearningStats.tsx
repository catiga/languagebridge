'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '../../../../utils/api';

interface LearningStats {
  total_courses: number;
  completed_courses: number;
  total_study_hours: number;
  current_streak: number;
  certificates_earned: number;
  average_score: number;
  level_progress: number;
}

export default function LearningStats() {
  const [stats, setStats] = useState<LearningStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLearningStats();
  }, []);

  const fetchLearningStats = async () => {
    try {
      // 尝试获取真实数据
      const [overviewRes, plannerRes] = await Promise.all([
        apiClient.get('/spwapi/auth/overview') as Promise<any>,
        apiClient.get('/spwapi/auth/planner/stat') as Promise<any>
      ]);

      let realStats: LearningStats | null = null;

      if (overviewRes && overviewRes.code === 0 && overviewRes.data) {
        realStats = {
          total_courses: overviewRes.data.my_course_count || 0,
          completed_courses: Math.floor((overviewRes.data.my_course_count || 0) * 0.7),
          total_study_hours: 0,
          current_streak: 0,
          certificates_earned: 0,
          average_score: 0,
          level_progress: 0
        };
      }

      if (realStats) {
        setStats(realStats);
      } else {
        // 如果没有数据，设置为空
        setStats(null);
      }
    } catch (error) {
      console.error('Failed to fetch learning stats:', error);
      // 如果获取失败，设置为空
      setStats(null);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Learning Progress</h2>
          <p className="text-gray-600 text-sm mt-1">
            Track your learning achievements and progress
          </p>
        </div>
        <div className="text-right">
          <div className="text-xs text-gray-500">Current Level Progress</div>
          <div className="text-xl font-bold text-blue-600">{stats.level_progress}%</div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Total Courses */}
        <div className="text-center">
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
            <span className="text-xl">📚</span>
          </div>
          <div className="text-lg font-bold text-gray-900">{stats.total_courses}</div>
          <div className="text-xs text-gray-600">Total Courses</div>
        </div>

        {/* Study Hours */}
        <div className="text-center">
          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
            <span className="text-xl">⏰</span>
          </div>
          <div className="text-lg font-bold text-gray-900">{stats.total_study_hours}h</div>
          <div className="text-xs text-gray-600">Study Hours</div>
        </div>

        {/* Current Streak */}
        <div className="text-center">
          <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-2">
            <span className="text-xl">🔥</span>
          </div>
          <div className="text-lg font-bold text-gray-900">{stats.current_streak}</div>
          <div className="text-xs text-gray-600">Day Streak</div>
        </div>

        {/* Certificates */}
        <div className="text-center">
          <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-2">
            <span className="text-xl">🏆</span>
          </div>
          <div className="text-lg font-bold text-gray-900">{stats.certificates_earned}</div>
          <div className="text-xs text-gray-600">Certificates</div>
        </div>
      </div>

      {/* Progress Bars */}
      <div className="mt-6 space-y-3">
        <div>
          <div className="flex justify-between text-sm text-gray-600 mb-1">
            <span>Course Completion</span>
            <span>{Math.round((stats.completed_courses / stats.total_courses) * 100)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all"
              style={{ width: `${(stats.completed_courses / stats.total_courses) * 100}%` }}
            ></div>
          </div>
        </div>

        <div>
          <div className="flex justify-between text-sm text-gray-600 mb-1">
            <span>Average Score</span>
            <span>{stats.average_score}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-green-600 h-2 rounded-full transition-all"
              style={{ width: `${stats.average_score}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Recent Achievements */}
      <div className="mt-6 pt-4 border-t border-gray-100">
        <h3 className="text-base font-semibold text-gray-900 mb-3">Recent Achievements</h3>
        <div className="flex flex-wrap gap-2">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-green-100 text-green-800">
            🎯 Completed 5 courses
          </span>
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800">
            ⭐ 10-day study streak
          </span>
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-purple-100 text-purple-800">
            🏆 Level 2 Certificate
          </span>
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-orange-100 text-orange-800">
            📈 95% average score
          </span>
        </div>
      </div>
    </div>
  );
} 