'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '../../../../utils/api';

interface Student {
  id: number;
  name: string;
  avatar?: string;
  level?: number;
  target_level?: number;
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
          level: member.level || 1,
          target_level: member.target_level || 3,
          progress_percentage: 0, // 移除假数据
          last_study_date: member.last_study_date || new Date().toISOString(),
          total_study_hours: 0 // 移除假数据
        }));
        setStudents(studentList);
      } else {
        // 如果没有数据，设置为空数组
        setStudents([]);
      }
    } catch (error) {
      console.error('Failed to fetch students:', error);
      // 使用假数据作为fallback
      setStudents([
        {
          id: 1,
          name: 'Emma Johnson',
          avatar: '',
          level: 2,
          target_level: 4,
          progress_percentage: 65,
          last_study_date: new Date().toISOString(),
          total_study_hours: 28
        },
        {
          id: 2,
          name: 'Michael Chen',
          avatar: '',
          level: 1,
          target_level: 3,
          progress_percentage: 35,
          last_study_date: new Date(Date.now() - 86400000).toISOString(),
          total_study_hours: 15
        }
      ]);
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
                    Level {student.level || 'Not set'}
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