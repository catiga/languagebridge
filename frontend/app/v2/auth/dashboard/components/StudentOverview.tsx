'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '../../../../utils/api';
import { toast } from 'react-toastify';

// 等级映射
const LEVEL_MAP: { [key: number]: string } = {
  1: "Beginner (KET)",
  2: "Intermediate (PET)", 
  3: "TOEFL Junior",
  4: "IELTS Practice",
  5: "Advanced"
};

// 格式化等级显示
const formatLevel = (level: number): string => {
  if (level === 0) return "Needs Assessment";
  return LEVEL_MAP[level] || `Level ${level}`;
};

// 获取状态显示文本
const getStatusText = (status: string): string => {
  switch (status) {
    case '00': return 'Not Started';
    case '01': return 'Assessment Error';
    case '02': return 'Waiting AI Assessment';
    case '05': return 'AI Processing';
    case '06': return 'Assessment Complete';
    case '10': return 'In Progress';
    case '20': return 'Finished';
    default: return 'Unknown';
  }
};

// 获取状态颜色
const getStatusColor = (status: string): string => {
  switch (status) {
    case '00': return 'bg-gray-100 text-gray-800';
    case '01': return 'bg-red-100 text-red-800';
    case '02': return 'bg-orange-100 text-orange-800';
    case '05': return 'bg-yellow-100 text-yellow-800';
    case '06': return 'bg-green-100 text-green-800';
    case '10': return 'bg-blue-100 text-blue-800';
    case '20': return 'bg-green-100 text-green-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

interface Student {
  id: number;
  name: string;
  avatar?: string;
  level?: number;
  target_level?: number;
  has_goal?: boolean;
  goal_status?: string;
  learning_goal?: string;
  progress_percentage?: number;
  last_study_date?: string;
  total_study_hours?: number;
}

export default function StudentOverview() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      // 使用现有的member list接口
      const res = await apiClient.post('/spwapi/auth/profile/member/list') as any;
      if (res && res.code === 0 && res.data) {
        const studentList = res.data.map((member: any) => ({
          id: member.id,
          name: member.name,
          avatar: member.avatar,
          level: member.current_level || 0,
          target_level: member.target_level || 0,
          has_goal: member.has_goal || false,
          goal_status: member.goal_status || "",
          learning_goal: member.learning_goal || "",
          progress_percentage: 0, // 这里可以后续添加真实的进度计算
          last_study_date: member.last_study_date || new Date().toISOString(),
          total_study_hours: 0 // 这里可以后续添加真实的学习时长统计
        }));
        setStudents(studentList);
      } else {
        // 如果没有数据，设置为空数组
        setStudents([]);
      }
    } catch (error) {
      console.error('Failed to fetch students:', error);
      // 如果获取失败，设置为空数组
      setStudents([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddStudent = () => {
    router.push('/v2/auth/students/add');
  };

  const handleStudentClick = (studentId: number) => {
    router.push(`/v2/auth/students/${studentId}`);
  };

  const handleManualAIAssessment = async (studentId: number) => {
    try {
      // 这里需要获取学生的学习计划ID，但由于StudentOverview组件没有详细的学习计划数据
      // 我们可以跳转到详细页面或者显示提示信息
      toast.info('Please go to the student detail page to trigger AI assessment');
      router.push(`/v2/auth/students/${studentId}`);
    } catch (error) {
      console.error('Failed to trigger AI assessment:', error);
      toast.error('Failed to trigger AI assessment');
    }
  };

  const handleSetTarget = (studentId: number) => {
    router.push(`/v2/auth/students/${studentId}/target`);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-20 bg-gray-200 rounded"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">My Students</h2>
        <button
          onClick={handleAddStudent}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          + Add Student
        </button>
      </div>

      {students.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-6xl mb-4">👨‍🎓</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No students yet
          </h3>
          <p className="text-gray-600 mb-4">
            Add your first student to start their learning journey
          </p>
          <button
            onClick={handleAddStudent}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            Add Your First Student
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {students.map((student) => (
            <div
              key={student.id}
              className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => handleStudentClick(student.id)}
            >
              <div className="flex items-center mb-3">
                <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center mr-3">
                  {student.avatar ? (
                    <img
                      src={student.avatar}
                      alt={student.name}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  ) : (
                    <span className="text-xl">👤</span>
                  )}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{student.name}</h3>
                                      <p className="text-sm text-gray-600">
                      {student.has_goal ? 
                        (student.goal_status === '05' ? 
                          `AI Processing → ${student.learning_goal || formatLevel(student.target_level || 0)}` : 
                          student.goal_status === '02' || student.goal_status === '01' ? 
                            `Waiting AI Assessment → ${student.learning_goal || formatLevel(student.target_level || 0)}` : 
                          student.goal_status === '00' ? 
                            `Needs Assessment → ${student.learning_goal || formatLevel(student.target_level || 0)}` : 
                            `${formatLevel(student.level || 0)} → ${student.learning_goal || formatLevel(student.target_level || 0)}`
                        ) : 
                        "No Learning Goal Set"
                      }
                    </p>
                </div>
              </div>

              {student.progress_percentage !== undefined && (
                <div className="mb-3">
                  <div className="flex justify-between text-sm text-gray-600 mb-1">
                    <span>Progress</span>
                    <span>{student.progress_percentage}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all"
                      style={{ width: `${student.progress_percentage}%` }}
                    ></div>
                  </div>
                </div>
              )}

              <div className="flex justify-between items-center text-sm text-gray-600">
                <span>
                  {student.total_study_hours || 0}h studied
                </span>
                {student.last_study_date && (
                  <span>
                    Last: {new Date(student.last_study_date).toLocaleDateString()}
                  </span>
                )}
              </div>

              <div className="mt-3 pt-3 border-t border-gray-100">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSetTarget(student.id);
                  }}
                  className="w-full bg-gray-100 text-gray-700 py-2 rounded text-sm hover:bg-gray-200 transition-colors"
                >
                  Set Target Level
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 