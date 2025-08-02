'use client';

import React, { useState, useEffect } from 'react';
import { apiClient } from '../../../../utils/api';
import { toast } from 'react-toastify';

interface LearningStats {
  total_courses: number;
  completed_courses: number;
  total_study_hours: number;
  current_streak: number;
  certificates_earned: number;
  average_score: number;
  level_progress: number;
  total_students: number;
  active_students: number;
  completed_goals: number;
  total_goals: number;
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  type: 'course' | 'streak' | 'certificate' | 'score';
  achieved_at: string;
  icon: string;
  color: string;
}

export default function RealLearningStats() {
  const [stats, setStats] = useState<LearningStats | null>(null);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRealData();
  }, []);

  const fetchRealData = async () => {
    try {
      setLoading(true);
      
      // 获取真实数据
      const [memberRes, courseRes] = await Promise.all([
        apiClient.post('/spwapi/auth/profile/member/list') as Promise<any>,
        apiClient.get('/spwapi/auth/course/list') as Promise<any>
      ]);

      let realStats: LearningStats = {
        total_courses: 0,
        completed_courses: 0,
        total_study_hours: 0,
        current_streak: 0,
        certificates_earned: 0,
        average_score: 0,
        level_progress: 0,
        total_students: 0,
        active_students: 0,
        completed_goals: 0,
        total_goals: 0
      };

      // 处理学生数据
      if (memberRes && memberRes.code === 0 && memberRes.data) {
        const students = memberRes.data;
        realStats.total_students = students.length;
        realStats.active_students = students.filter((s: any) => s.has_goal).length;
        
        // 计算学习目标统计
        let totalGoals = 0;
        let completedGoals = 0;
        let totalStudyHours = 0;
        let totalCompletedTasks = 0;
        let totalTasks = 0;

        for (const student of students) {
          try {
            const plannerRes = await apiClient.get(`/spwapi/auth/planner/pull?student_id=${student.id}`) as any;
            if (plannerRes && plannerRes.code === 0 && Array.isArray(plannerRes.data)) {
              const goals = plannerRes.data;
              totalGoals += goals.length;
              
              for (const goal of goals) {
                if (goal.status === '20') { // 已完成
                  completedGoals++;
                }
                
                if (Array.isArray(goal.tasks)) {
                  totalTasks += goal.tasks.length;
                  totalCompletedTasks += goal.tasks.filter((task: any) => task.status === 'done').length;
                }
              }
            }
          } catch (error) {
            console.error('Failed to fetch planner data for student:', student.id, error);
          }
        }

        realStats.completed_goals = completedGoals;
        realStats.total_goals = totalGoals;
        realStats.total_study_hours = Math.round(totalCompletedTasks * 0.5); // 假设每个任务0.5小时
      }

      // 处理课程数据
      if (courseRes && courseRes.code === 0 && courseRes.data) {
        const courses = courseRes.data;
        realStats.total_courses = courses.length;
        realStats.completed_courses = courses.filter((c: any) => c.status === 'completed').length;
      }

      // 计算进度
      realStats.level_progress = realStats.total_goals > 0 
        ? Math.round((realStats.completed_goals / realStats.total_goals) * 100) 
        : 0;

      // 计算平均分数（基于完成的任务）
      realStats.average_score = realStats.total_tasks > 0 
        ? Math.round((realStats.totalCompletedTasks / realStats.totalTasks) * 100) 
        : 0;

      setStats(realStats);

      // 生成真实成就
      const realAchievements: Achievement[] = [];
      
      if (realStats.completed_courses > 0) {
        realAchievements.push({
          id: 'courses',
          title: `Completed ${realStats.completed_courses} courses`,
          description: 'Successfully finished learning courses',
          type: 'course',
          achieved_at: new Date().toISOString(),
          icon: '✅',
          color: 'bg-green-100 text-green-800'
        });
      }

      if (realStats.total_study_hours > 0) {
        realAchievements.push({
          id: 'hours',
          title: `${realStats.total_study_hours}h study time`,
          description: 'Accumulated study hours',
          type: 'streak',
          achieved_at: new Date().toISOString(),
          icon: '⏰',
          color: 'bg-blue-100 text-blue-800'
        });
      }

      if (realStats.completed_goals > 0) {
        realAchievements.push({
          id: 'goals',
          title: `${realStats.completed_goals} goals achieved`,
          description: 'Completed learning objectives',
          type: 'certificate',
          achieved_at: new Date().toISOString(),
          icon: '🎯',
          color: 'bg-purple-100 text-purple-800'
        });
      }

      if (realStats.average_score > 70) {
        realAchievements.push({
          id: 'score',
          title: `${realStats.average_score}% average score`,
          description: 'Excellent performance',
          type: 'score',
          achieved_at: new Date().toISOString(),
          icon: '📊',
          color: 'bg-yellow-100 text-yellow-800'
        });
      }

      setAchievements(realAchievements);

    } catch (error) {
      console.error('Failed to fetch real learning stats:', error);
      toast.error('Failed to load learning statistics');
      setStats(null);
      setAchievements([]);
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

  if (!stats) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div className="text-center">
          <div className="text-4xl mb-4">📚</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Learning Data Available</h3>
          <p className="text-gray-600">Start adding students and creating learning goals to see your progress</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
      <div className="flex items-center justify-between mb-6">
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

      {/* 主要统计指标 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="text-center">
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
            <span className="text-xl">📚</span>
          </div>
          <div className="text-lg font-bold text-gray-900">{stats.total_courses}</div>
          <div className="text-xs text-gray-600">Total Courses</div>
        </div>
        <div className="text-center">
          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
            <span className="text-xl">⏰</span>
          </div>
          <div className="text-lg font-bold text-gray-900">{stats.total_study_hours}h</div>
          <div className="text-xs text-gray-600">Study Hours</div>
        </div>
        <div className="text-center">
          <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-2">
            <span className="text-xl">🔥</span>
          </div>
          <div className="text-lg font-bold text-gray-900">{stats.current_streak}</div>
          <div className="text-xs text-gray-600">Day Streak</div>
        </div>
        <div className="text-center">
          <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-2">
            <span className="text-xl">🏆</span>
          </div>
          <div className="text-lg font-bold text-gray-900">{stats.certificates_earned}</div>
          <div className="text-xs text-gray-600">Certificates</div>
        </div>
      </div>

      {/* 进度条 */}
      <div className="space-y-4 mb-6">
        <div>
          <div className="flex justify-between text-sm text-gray-600 mb-1">
            <span>Course Completion</span>
            <span>{stats.total_courses > 0 ? Math.round((stats.completed_courses / stats.total_courses) * 100) : 0}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${stats.total_courses > 0 ? (stats.completed_courses / stats.total_courses) * 100 : 0}%` }}
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
              className="bg-green-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${stats.average_score}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* 真实成就 */}
      {achievements.length > 0 && (
        <div className="mb-6">
          <h3 className="text-md font-semibold text-gray-900 mb-3">Recent Achievements</h3>
          <div className="flex flex-wrap gap-2">
            {achievements.map((achievement) => (
              <div
                key={achievement.id}
                className={`px-3 py-2 rounded-full text-sm font-medium ${achievement.color} flex items-center space-x-2 cursor-pointer hover:opacity-80 transition-opacity`}
              >
                <span>{achievement.icon}</span>
                <span>{achievement.title}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 快速操作 */}
      <div className="mb-6">
        <h3 className="text-md font-semibold text-gray-900 mb-3">Quick Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="bg-blue-50 rounded-lg p-3 text-center cursor-pointer hover:bg-blue-100 transition-colors">
            <div className="text-2xl mb-1">👥</div>
            <div className="text-xs font-medium text-gray-900">Student Management</div>
            <div className="text-xs text-gray-500">Add and manage your students</div>
          </div>
          <div className="bg-purple-50 rounded-lg p-3 text-center cursor-pointer hover:bg-purple-100 transition-colors relative">
            <div className="absolute top-1 right-1 bg-red-500 text-white text-xs px-1 rounded">NEW</div>
            <div className="text-2xl mb-1">🤖</div>
            <div className="text-xs font-medium text-gray-900">AI Assessment</div>
            <div className="text-xs text-gray-500">Assess student levels</div>
          </div>
          <div className="bg-green-50 rounded-lg p-3 text-center cursor-pointer hover:bg-green-100 transition-colors">
            <div className="text-2xl mb-1">📅</div>
            <div className="text-xs font-medium text-gray-900">Study Planner</div>
            <div className="text-xs text-gray-500">Create learning plans</div>
          </div>
          <div className="bg-orange-50 rounded-lg p-3 text-center cursor-pointer hover:bg-orange-100 transition-colors">
            <div className="text-2xl mb-1">📊</div>
            <div className="text-xs font-medium text-gray-900">Progress Tracker</div>
            <div className="text-xs text-gray-500">Monitor progress</div>
          </div>
          <div className="bg-blue-50 rounded-lg p-3 text-center cursor-pointer hover:bg-blue-100 transition-colors">
            <div className="text-2xl mb-1">📁</div>
            <div className="text-xs font-medium text-gray-900">Interest Management</div>
            <div className="text-xs text-gray-500">Update preferences</div>
          </div>
          <div className="bg-pink-50 rounded-lg p-3 text-center cursor-pointer hover:bg-pink-100 transition-colors">
            <div className="text-2xl mb-1">🎯</div>
            <div className="text-xs font-medium text-gray-900">Trial Lessons</div>
            <div className="text-xs text-gray-500">Book trial lessons</div>
          </div>
        </div>
      </div>

      {/* 底部统计 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600">{stats.completed_courses}</div>
          <div className="text-sm text-gray-600">Courses Completed</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600">{stats.total_study_hours}</div>
          <div className="text-sm text-gray-600">Hours Studied</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600">{stats.certificates_earned}</div>
          <div className="text-sm text-gray-600">Certificates Earned</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600">{stats.current_streak}</div>
          <div className="text-sm text-gray-600">Days Streak</div>
        </div>
      </div>
    </div>
  );
} 