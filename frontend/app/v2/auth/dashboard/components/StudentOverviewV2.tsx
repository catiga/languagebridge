'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '../../../../utils/api';
import { toast } from 'react-toastify';
import LearningGoalModal from './LearningGoalModal';
import StudyPlanStats from './StudyPlanStats';

interface Student {
  id: number;
  name: string;
  avatar?: string;
  current_level?: number;
  target_level?: number;
  has_goal?: boolean;
  goal_status?: string;
  learning_goal?: string;
  goal_description?: string;
  assessment_status: 'not_started' | 'in_progress' | 'completed';
  progress_percentage?: number;
  last_study_date?: string;
  total_study_hours?: number;
  upcoming_lessons?: number;
  completed_tasks?: number;
  total_tasks?: number;
  active_goals?: any[];
}

export default function StudentOverviewV2() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [selectedStudentForGoal, setSelectedStudentForGoal] = useState<Student | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      const res = await apiClient.post('/spwapi/auth/profile/member/list') as any;
      if (res && res.code === 0 && res.data) {
        const studentList = await Promise.all(res.data.map(async (member: any) => {
          let learningGoals: any[] = [];
          let tasks: any[] = [];
          
          try {
            const plannerRes = await apiClient.get(`/spwapi/auth/planner/pull?student_id=${member.id}`) as any;
            if (plannerRes && plannerRes.code === 0 && Array.isArray(plannerRes.data)) {
              learningGoals = plannerRes.data;
              for (const goal of plannerRes.data) {
                if (Array.isArray(goal.tasks)) {
                  tasks.push(...goal.tasks);
                }
              }
            }
          } catch (error) {
            console.error('Failed to fetch planner data for student:', member.id, error);
          }

          const completedTasks = tasks.filter((task: any) => task.status === 'done').length;
          const totalTasks = tasks.length;
          const progressPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
          
          return {
            id: member.id,
            name: member.name,
            avatar: member.avatar,
            current_level: member.current_level || 0,
            target_level: member.target_level || 0,
            has_goal: member.has_goal || false,
            goal_status: member.goal_status || "",
            assessment_status: member.has_goal ? 
              (member.goal_status === '06' ? 'completed' : 
               member.goal_status === '05' ? 'in_progress' : 'not_started') : 'not_started',
            progress_percentage: progressPercentage,
            last_study_date: new Date().toISOString().slice(0, 10),
            total_study_hours: 0,
            upcoming_lessons: 0,
            completed_tasks: completedTasks,
            total_tasks: totalTasks,
            active_goals: learningGoals
          };
        }));
        
        setStudents(studentList);
      }
    } catch (error) {
      console.error('Failed to fetch students:', error);
      toast.error('Failed to load students');
    } finally {
      setLoading(false);
    }
  };

  const handleStudentClick = (student: Student) => {
    setSelectedStudent(student);
  };

  const handleSetGoal = (student: Student) => {
    setSelectedStudentForGoal(student);
    setShowGoalModal(true);
  };

  const handleGoalSaved = (goal: any) => {
    setStudents(prev => prev.map(student => 
      student.id === goal.student_id 
        ? { 
            ...student, 
            learning_goal: goal.title,
            goal_description: goal.description,
            active_goals: [...(student.active_goals || []), goal]
          }
        : student
    ));
    
    if (selectedStudent?.id === goal.student_id) {
      setSelectedStudent(prev => prev ? {
        ...prev,
        learning_goal: goal.title,
        goal_description: goal.description,
        active_goals: [...(prev.active_goals || []), goal]
      } : null);
    }
  };

  const getPlanStatusColor = (status: string) => {
    switch (status) {
      case '20': return 'bg-green-100 text-green-800';
      case '10': return 'bg-blue-100 text-blue-800';
      case '00': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPlanStatusText = (status: string) => {
    switch (status) {
      case '20': return 'Completed';
      case '10': return 'In Progress';
      case '00': return 'Needs Assessment';
      default: return 'Unknown';
    }
  };

  // 渲染学生状态对应的组件
  const renderStudentStatusComponent = () => {
    if (!selectedStudent) return null;

    const goalStatus = selectedStudent.goal_status;
    const hasGoal = selectedStudent.has_goal;
    const activeGoals = selectedStudent.active_goals || [];

    if (!hasGoal) {
      return (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-200">
          <div className="text-center">
            <div className="text-4xl mb-4">🎯</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Learning Goal Set</h3>
            <p className="text-gray-600 mb-4">
              Set a learning goal to start {selectedStudent.name}'s learning journey
            </p>
            <button
              onClick={() => handleSetGoal(selectedStudent)}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Set Learning Goal
            </button>
          </div>
        </div>
      );
    }

    switch (goalStatus) {
      case '00': // 需要评估
        return (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-lg p-6 border border-orange-200">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">Assessment Required</h3>
                  <p className="text-gray-600">Complete an assessment to generate a personalized study plan</p>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-bold text-orange-600">0%</span>
                  <div className="text-sm text-gray-500">Progress</div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg p-6 border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Recommended Courses</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border border-gray-200 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-2">Beginner English</h4>
                  <p className="text-sm text-gray-600 mb-3">Start with basic vocabulary and grammar</p>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">Duration: 4 weeks</span>
                    <button className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700">
                      Start
                    </button>
                  </div>
                </div>
                <div className="border border-gray-200 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-2">KET Preparation</h4>
                  <p className="text-sm text-gray-600 mb-3">Prepare for Cambridge KET exam</p>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">Duration: 8 weeks</span>
                    <button className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700">
                      Start
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case '10': // 进行中
        return (
          <div className="space-y-6">
            {activeGoals.length > 0 && (
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6 border border-blue-200">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">Study Plan Progress</h3>
                    <p className="text-gray-600">{activeGoals[0].title}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-bold text-blue-600">{selectedStudent.progress_percentage || 0}%</span>
                    <div className="text-sm text-gray-500">Complete</div>
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div className="text-center">
                    <div className="text-lg font-semibold text-gray-900">{selectedStudent.completed_tasks || 0}</div>
                    <div className="text-sm text-gray-600">Completed Tasks</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-semibold text-gray-900">{selectedStudent.total_tasks || 0}</div>
                    <div className="text-sm text-gray-600">Total Tasks</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-semibold text-gray-900">{selectedStudent.total_study_hours || 0}h</div>
                    <div className="text-sm text-gray-600">Study Hours</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-semibold text-gray-900">{selectedStudent.upcoming_lessons || 0}</div>
                    <div className="text-sm text-gray-600">Upcoming</div>
                  </div>
                </div>
              </div>
            )}

            {activeGoals.length > 0 && (
              <StudyPlanStats 
                overviewId={activeGoals[0].id} 
                studentName={selectedStudent.name} 
              />
            )}

            <div className="bg-white rounded-lg p-6 border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-gray-600">Completed vocabulary exercise</span>
                  <span className="text-xs text-gray-400">2 hours ago</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="text-sm text-gray-600">Started grammar lesson</span>
                  <span className="text-xs text-gray-400">1 day ago</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                  <span className="text-sm text-gray-600">Assessment completed</span>
                  <span className="text-xs text-gray-400">3 days ago</span>
                </div>
              </div>
            </div>
          </div>
        );

      case '20': // 已完成
        return (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-6 border border-green-200">
              <div className="text-center">
                <div className="text-4xl mb-4">🎉</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Learning Goal Achieved!</h3>
                <p className="text-gray-600 mb-4">
                  Congratulations! {selectedStudent.name} has completed their learning goal.
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div className="text-center">
                    <div className="text-lg font-semibold text-gray-900">{selectedStudent.completed_tasks || 0}</div>
                    <div className="text-sm text-gray-600">Tasks Completed</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-semibold text-gray-900">{selectedStudent.total_study_hours || 0}h</div>
                    <div className="text-sm text-gray-600">Total Study Time</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-semibold text-gray-900">100%</div>
                    <div className="text-sm text-gray-600">Goal Progress</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-semibold text-gray-900">A+</div>
                    <div className="text-sm text-gray-600">Final Grade</div>
                  </div>
                </div>
              </div>
            </div>

            {activeGoals.length > 0 && (
              <StudyPlanStats 
                overviewId={activeGoals[0].id} 
                studentName={selectedStudent.name} 
              />
            )}

            <div className="bg-white rounded-lg p-6 border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">What's Next?</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border border-gray-200 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-2">Advanced Level</h4>
                  <p className="text-sm text-gray-600 mb-3">Continue to the next level</p>
                  <button className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700">
                    Start Advanced
                  </button>
                </div>
                <div className="border border-gray-200 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-2">New Goal</h4>
                  <p className="text-sm text-gray-600 mb-3">Set a new learning objective</p>
                  <button 
                    onClick={() => handleSetGoal(selectedStudent)}
                    className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
                  >
                    Set New Goal
                  </button>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return (
          <div className="bg-gradient-to-r from-gray-50 to-slate-50 rounded-lg p-6 border border-gray-200">
            <div className="text-center">
              <div className="text-4xl mb-4">📚</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Ready to Start</h3>
              <p className="text-gray-600 mb-4">
                {selectedStudent.name} is ready to begin their learning journey
              </p>
              <button
                onClick={() => handleSetGoal(selectedStudent)}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Set Learning Goal
              </button>
            </div>
          </div>
        );
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
    <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Student Learning Center</h2>
          <p className="text-gray-600 text-sm mt-1">
            Manage your students' learning journey and track their progress
          </p>
        </div>
        <button className="bg-blue-600 text-white px-3 py-1.5 rounded text-sm hover:bg-blue-700 transition-colors">
          + Add Student
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 左侧：学生列表 */}
        <div className="lg:col-span-1">
          <h3 className="text-md font-semibold text-gray-900 mb-3">My Students</h3>
          <div className="space-y-3">
            {students.map((student) => (
              <div
                key={student.id}
                onClick={() => handleStudentClick(student)}
                className={`p-4 rounded-lg border cursor-pointer transition-all ${
                  selectedStudent?.id === student.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                    <span className="text-gray-600 font-medium">
                      {student.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-gray-900 truncate">{student.name}</h4>
                    <p className="text-sm text-gray-600 truncate">
                      {student.learning_goal || 'No Learning Goal Set'}
                    </p>
                    <div className="flex items-center justify-between mt-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        student.has_goal 
                          ? getPlanStatusColor(student.goal_status || '00')
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {student.has_goal 
                          ? getPlanStatusText(student.goal_status || '00')
                          : 'Not Started'
                        }
                      </span>
                      <span className="text-xs text-gray-500">
                        {student.progress_percentage || 0}% complete
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 右侧：选中学生详情 */}
        <div className="lg:col-span-2">
          {selectedStudent ? (
            <div className="space-y-6">
              {/* 学生头部信息 */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xl font-bold">
                        {selectedStudent.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900">{selectedStudent.name}</h3>
                      <p className="text-gray-600">
                        {selectedStudent.learning_goal || 'No Learning Goal Set'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-blue-600">
                      {selectedStudent.progress_percentage || 0}%
                    </div>
                    <div className="text-sm text-gray-500">Overall Progress</div>
                    <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium mt-2 ${
                      selectedStudent.has_goal 
                        ? getPlanStatusColor(selectedStudent.goal_status || '00')
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {selectedStudent.has_goal 
                        ? getPlanStatusText(selectedStudent.goal_status || '00')
                        : 'Not Started'
                      }
                    </span>
                  </div>
                </div>
              </div>

              {/* 状态对应的组件 */}
              {renderStudentStatusComponent()}
            </div>
          ) : (
            <div className="bg-gray-50 rounded-lg p-8 text-center">
              <div className="text-4xl mb-4">👥</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Select a Student</h3>
              <p className="text-gray-600">Choose a student from the list to view their details and progress</p>
            </div>
          )}
        </div>
      </div>

      {/* Learning Goal Modal */}
      <LearningGoalModal
        isOpen={showGoalModal}
        onClose={() => setShowGoalModal(false)}
        student={selectedStudentForGoal}
        onGoalSaved={handleGoalSaved}
      />
    </div>
  );
} 