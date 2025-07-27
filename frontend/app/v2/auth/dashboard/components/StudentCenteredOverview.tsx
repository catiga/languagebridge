'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '../../../../utils/api';

interface Student {
  id: number;
  name: string;
  avatar?: string;
  current_level?: number;
  target_level?: number;
  assessment_status: 'not_started' | 'in_progress' | 'completed';
  progress_percentage?: number;
  last_study_date?: string;
  total_study_hours?: number;
  upcoming_lessons?: number;
  completed_tasks?: number;
  total_tasks?: number;
}

export default function StudentCenteredOverview() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
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
          current_level: member.level || 1,
          target_level: member.target_level || 3,
          assessment_status: member.assessment_status || 'not_started',
          progress_percentage: Math.floor(Math.random() * 100),
          last_study_date: member.last_study_date || new Date().toISOString(),
          total_study_hours: Math.floor(Math.random() * 50) + 10,
          upcoming_lessons: Math.floor(Math.random() * 5) + 1,
          completed_tasks: Math.floor(Math.random() * 20) + 5,
          total_tasks: Math.floor(Math.random() * 30) + 20
        }));
        setStudents(studentList);
        if (studentList.length > 0) {
          setSelectedStudent(studentList[0]);
        }
      } else {
        // 使用假数据
        const mockStudents = [
          {
            id: 1,
            name: 'Emma Johnson',
            avatar: '',
            current_level: 2,
            target_level: 4,
            assessment_status: 'completed' as const,
            progress_percentage: 65,
            last_study_date: new Date().toISOString(),
            total_study_hours: 28,
            upcoming_lessons: 3,
            completed_tasks: 15,
            total_tasks: 25
          },
          {
            id: 2,
            name: 'Michael Chen',
            avatar: '',
            current_level: 1,
            target_level: 3,
            assessment_status: 'in_progress' as const,
            progress_percentage: 35,
            last_study_date: new Date(Date.now() - 86400000).toISOString(),
            total_study_hours: 15,
            upcoming_lessons: 1,
            completed_tasks: 8,
            total_tasks: 20
          }
        ];
        setStudents(mockStudents);
        setSelectedStudent(mockStudents[0]);
      }
    } catch (error) {
      console.error('Failed to fetch students:', error);
      // 使用假数据作为fallback
      const mockStudents = [
        {
          id: 1,
          name: 'Emma Johnson',
          avatar: '',
          current_level: 2,
          target_level: 4,
          assessment_status: 'completed' as const,
          progress_percentage: 65,
          last_study_date: new Date().toISOString(),
          total_study_hours: 28,
          upcoming_lessons: 3,
          completed_tasks: 15,
          total_tasks: 25
        },
        {
          id: 2,
          name: 'Michael Chen',
          avatar: '',
          current_level: 1,
          target_level: 3,
          assessment_status: 'in_progress' as const,
          progress_percentage: 35,
          last_study_date: new Date(Date.now() - 86400000).toISOString(),
          total_study_hours: 15,
          upcoming_lessons: 1,
          completed_tasks: 8,
          total_tasks: 20
        }
      ];
      setStudents(mockStudents);
      setSelectedStudent(mockStudents[0]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddStudent = () => {
    router.push('/v2/auth/students/add');
  };

  const handleStudentClick = (student: Student) => {
    setSelectedStudent(student);
  };

  const handleAssessment = (studentId: number) => {
    router.push(`/v2/auth/assessment?student_id=${studentId}`);
  };

  const handleStudyPlanner = (studentId: number) => {
    router.push(`/v2/auth/study-planner?student_id=${studentId}`);
  };

  const handleProgress = (studentId: number) => {
    router.push(`/v2/auth/progress?student_id=${studentId}`);
  };

  const getAssessmentStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getAssessmentStatusText = (status: string) => {
    switch (status) {
      case 'completed': return 'Completed';
      case 'in_progress': return 'In Progress';
      default: return 'Not Started';
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-32 bg-gray-200 rounded"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Student Learning Center</h2>
          <p className="text-gray-600 mt-1">
            Manage your students' learning journey and track their progress
          </p>
        </div>
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Student List */}
          <div className="lg:col-span-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">My Students</h3>
            <div className="space-y-3">
              {students.map((student) => (
                <div
                  key={student.id}
                  className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    selectedStudent?.id === student.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => handleStudentClick(student)}
                >
                  <div className="flex items-center mb-2">
                    <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center mr-3">
                      {student.avatar ? (
                        <img
                          src={student.avatar}
                          alt={student.name}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <span className="text-lg">👤</span>
                      )}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900">{student.name}</h4>
                      <p className="text-sm text-gray-600">
                        Level {student.current_level} → {student.target_level}
                      </p>
                    </div>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className={`px-2 py-1 rounded-full text-xs ${getAssessmentStatusColor(student.assessment_status)}`}>
                      {getAssessmentStatusText(student.assessment_status)}
                    </span>
                    <span className="text-gray-600">
                      {student.progress_percentage}% complete
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Selected Student Details */}
          {selectedStudent && (
            <div className="lg:col-span-2">
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center">
                    <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mr-4">
                      {selectedStudent.avatar ? (
                        <img
                          src={selectedStudent.avatar}
                          alt={selectedStudent.name}
                          className="w-16 h-16 rounded-full object-cover"
                        />
                      ) : (
                        <span className="text-2xl">👤</span>
                      )}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">{selectedStudent.name}</h3>
                      <p className="text-gray-600">
                        Current Level: {selectedStudent.current_level} | Target: {selectedStudent.target_level}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-500">Overall Progress</div>
                    <div className="text-3xl font-bold text-blue-600">{selectedStudent.progress_percentage}%</div>
                  </div>
                </div>

                {/* Progress Bars */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <div className="flex justify-between text-sm text-gray-600 mb-2">
                      <span>Level Progress</span>
                      <span>{selectedStudent.current_level}/{selectedStudent.target_level}</span>
                    </div>
                                         <div className="w-full bg-gray-200 rounded-full h-3">
                       <div
                         className="bg-blue-600 h-3 rounded-full transition-all"
                         style={{ width: `${((selectedStudent.current_level || 1) / (selectedStudent.target_level || 1)) * 100}%` }}
                       ></div>
                     </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm text-gray-600 mb-2">
                      <span>Task Completion</span>
                      <span>{selectedStudent.completed_tasks}/{selectedStudent.total_tasks}</span>
                    </div>
                                         <div className="w-full bg-gray-200 rounded-full h-3">
                       <div
                         className="bg-green-600 h-3 rounded-full transition-all"
                         style={{ width: `${((selectedStudent.completed_tasks || 0) / (selectedStudent.total_tasks || 1)) * 100}%` }}
                       ></div>
                     </div>
                  </div>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{selectedStudent.total_study_hours}h</div>
                    <div className="text-sm text-gray-600">Study Hours</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{selectedStudent.upcoming_lessons}</div>
                    <div className="text-sm text-gray-600">Upcoming Lessons</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">{selectedStudent.completed_tasks}</div>
                    <div className="text-sm text-gray-600">Tasks Completed</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">
                      {selectedStudent.last_study_date ? 
                        new Date(selectedStudent.last_study_date).toLocaleDateString() : 'N/A'}
                    </div>
                    <div className="text-sm text-gray-600">Last Study</div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={() => handleAssessment(selectedStudent.id)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      selectedStudent.assessment_status === 'completed'
                        ? 'bg-green-100 text-green-700 hover:bg-green-200'
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                  >
                    {selectedStudent.assessment_status === 'completed' ? 'View Assessment' : 'Take Assessment'}
                  </button>
                  <button
                    onClick={() => handleStudyPlanner(selectedStudent.id)}
                    className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors"
                  >
                    Study Planner
                  </button>
                  <button
                    onClick={() => handleProgress(selectedStudent.id)}
                    className="bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-orange-700 transition-colors"
                  >
                    View Progress
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
} 