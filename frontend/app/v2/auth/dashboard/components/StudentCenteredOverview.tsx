'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '../../../../utils/api';
import { toast } from 'react-toastify';
import LearningGoalModal from './LearningGoalModal';
import AssessmentResultModal from './AssessmentResultModal';
import StudyPlanTemplateModal from './StudyPlanTemplateModal';

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

interface Quiz {
  score: string;
  result: string;
  category_path: string;
  category_level: string;
  agent_record_id: number;
  overview_id: number;
  add_time: string;
}

interface LearningGoal {
  id: number;
  student_id: number;
  title: string;
  description: string;
  goal: string;
  add_time: string;
  start_date: string;
  end_date: string;
  tasks: any[] | null;
  goal_period_type: string;
  target_level: number;
  init_level: number;
  status: string;
  quizs: Quiz[];
}

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
  active_goals?: LearningGoal[];
}

export default function StudentCenteredOverview() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [selectedStudentForGoal, setSelectedStudentForGoal] = useState<Student | null>(null);
  const [showAssessmentModal, setShowAssessmentModal] = useState(false);
  const [selectedStudentForAssessment, setSelectedStudentForAssessment] = useState<Student | null>(null);
  const [showStudyPlanModal, setShowStudyPlanModal] = useState(false);
  const [selectedStudentForStudyPlan, setSelectedStudentForStudyPlan] = useState<Student | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetchStudents();
    
    // 监听来自考试窗口的消息
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'ASSESSMENT_COMPLETED') {
        // 考试完成，刷新学生数据
        fetchStudents();
        toast.success('Assessment completed! Student data has been updated.');
      }
    };

    window.addEventListener('message', handleMessage);
    
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, []);

  const fetchStudents = async () => {
    try {
      // 使用现有的member list接口
      const res = await apiClient.post('/spwapi/auth/profile/member/list') as any;
      if (res && res.code === 0 && res.data) {
        const studentList = await Promise.all(res.data.map(async (member: any) => {
          // 为每个学生获取Study Planner数据
          let stageGoals: any[] = [];
          let tasks: any[] = [];
          let stats: any = null;
          let learningGoals: LearningGoal[] = [];
          
          try {
            const plannerRes = await apiClient.get(`/spwapi/auth/planner/pull?student_id=${member.id}`) as any;
            if (plannerRes && plannerRes.code === 0 && Array.isArray(plannerRes.data)) {
              stageGoals = plannerRes.data;
              // 合并所有任务
              for (const goal of plannerRes.data) {
                if (Array.isArray(goal.tasks)) {
                  tasks.push(...goal.tasks);
                }
              }
              
              // 获取详细数据
              if (stageGoals.length > 0) {
                learningGoals = stageGoals.map((goal: any) => ({
                  id: goal.id,
                  student_id: goal.student_id,
                  title: goal.title,
                  description: goal.description,
                  goal: goal.goal,
                  add_time: goal.add_time,
                  start_date: goal.start_date,
                  end_date: goal.end_date,
                  tasks: goal.tasks || [],
                  goal_period_type: goal.goal_period_type,
                  target_level: goal.target_level,
                  init_level: goal.init_level,
                  status: goal.status,
                  quizs: goal.quizs || []
                }));
              }
            }
          } catch (error) {
            console.error('Failed to fetch planner data for student:', member.id, error);
          }

          // 计算进度百分比
          const completedTasks = tasks.filter((task: any) => task.status === 'done').length;
          const totalTasks = tasks.length;
          const progressPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

          const startDate = new Date().toISOString().slice(0, 10);
          
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
            last_study_date: member.last_study_date || startDate,
            total_study_hours: stats?.total_hours || 0,
            upcoming_lessons: stats?.upcoming_lessons || 0,
            completed_tasks: completedTasks,
            total_tasks: totalTasks,
            active_goals: learningGoals,
            learning_goal: learningGoals.length > 0 ? learningGoals[0].title : undefined,
            goal_description: learningGoals.length > 0 ? learningGoals[0].description : undefined
          };
        }));
        
        setStudents(studentList);
        if (studentList.length > 0) {
          setSelectedStudent(studentList[0]);
        }
      } else {
        // 如果没有学生数据，设置为空数组
        setStudents([]);
        setSelectedStudent(null);
      }
    } catch (error) {
      console.error('Failed to fetch students:', error);
      // 如果获取失败，设置为空数组
      setStudents([]);
      setSelectedStudent(null);
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
    // 获取当前学生信息
    const currentStudent = students.find(s => s.id === studentId);
    
    if (!currentStudent) {
      toast.error('Student not found');
      return;
    }

    // 检查是否有学习计划
    const planId = currentStudent?.active_goals && currentStudent.active_goals.length > 0 
      ? currentStudent.active_goals[0].id 
      : null;
    
    if (!planId) {
      toast.error('No learning plan found for this student');
      return;
    }

    // 设置选中的学生并打开模态框
    setSelectedStudentForAssessment(currentStudent);
    setShowAssessmentModal(true);
  };

  const handleManualAIAssessment = async (studentId: number) => {
    try {
      // 获取当前学生的学习计划ID
      const currentStudent = students.find(s => s.id === studentId);
      const planId = currentStudent?.active_goals && currentStudent.active_goals.length > 0 
        ? currentStudent.active_goals[0].id 
        : null;
      
      if (!planId) {
        toast.error('No learning plan found for this student');
        return;
      }

      // 调用手动触发AI测评接口
      const response = await apiClient.get(`/spwapi/auth/aiagent/assessment/evaluate?overview_id=${planId}`) as any;
      
      if (response && response.code === 0) {
        toast.success('AI assessment triggered successfully! Please wait for processing...');
        // 刷新学生数据
        fetchStudents();
      } else {
        toast.error(response?.msg || 'Failed to trigger AI assessment');
      }
    } catch (error) {
      console.error('Failed to trigger AI assessment:', error);
      toast.error('Failed to trigger AI assessment');
    }
  };

  const handleGenerateStudyPlan = async (studentId: number) => {
    try {
      // 获取当前学生的学习计划ID
      const currentStudent = students.find(s => s.id === studentId);
      const planId = currentStudent?.active_goals && currentStudent.active_goals.length > 0 
        ? currentStudent.active_goals[0].id 
        : null;
      
      if (!planId) {
        toast.error('No learning plan found for this student');
        return;
      }

      // 弹出开始时间选择对话框
      const startDate = prompt('Please enter the start date (YYYY-MM-DD):', new Date().toISOString().slice(0, 10));
      if (!startDate) {
        return;
      }

      // 验证日期格式
      if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate)) {
        toast.error('Invalid date format. Please use YYYY-MM-DD');
        return;
      }

      // 调用生成学习计划接口
      const response = await apiClient.post(`/spwapi/auth/aiagent/assessment/studyplan/generate`, {
        overview_id: planId,
        start_date: startDate
      }) as any;
      
      if (response && response.code === 0) {
        toast.success(`Study plan generated successfully! ${response.data?.total_days || 0} days plan created.`);
        // 刷新学生数据
        fetchStudents();
      } else {
        toast.error(response?.msg || 'Failed to generate study plan');
      }
    } catch (error) {
      console.error('Failed to generate study plan:', error);
      toast.error('Failed to generate study plan');
    }
  };

  const handleStudyPlanner = (studentId: number) => {
    // 获取当前学生信息
    const currentStudent = students.find(s => s.id === studentId);
    
    if (!currentStudent) {
      toast.error('Student not found');
      return;
    }

    // 检查是否有学习计划
    const planId = currentStudent?.active_goals && currentStudent.active_goals.length > 0 
      ? currentStudent.active_goals[0].id 
      : null;
    
    if (!planId) {
      toast.error('No learning plan found for this student');
      return;
    }

    // 设置选中的学生并打开建议学习计划模态框
    setSelectedStudentForStudyPlan(currentStudent);
    setShowStudyPlanModal(true);
  };

  const handleProgress = (studentId: number) => {
    // 跳转到Progress页面
    router.push(`/v2/auth/progress?student_id=${studentId}`);
  };

  const handleSetGoal = (student: Student) => {
    setSelectedStudentForGoal(student);
    setShowGoalModal(true);
  };

  const handleGoalSaved = (goal: any) => {
    // 更新学生数据，添加新的学习目标
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
    
    // 如果当前选中的学生就是设置目标的学生，也更新选中状态
    if (selectedStudent?.id === goal.student_id) {
      setSelectedStudent(prev => prev ? {
        ...prev,
        learning_goal: goal.title,
        goal_description: goal.description,
        active_goals: [...(prev.active_goals || []), goal]
      } : null);
    }
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

  // 新增：获取学习计划状态的颜色和文本
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
        <button
          onClick={handleAddStudent}
          className="bg-blue-600 text-white px-3 py-1.5 rounded text-sm hover:bg-blue-700 transition-colors"
        >
          + Add Student
        </button>
      </div>

      {students.length === 0 ? (
        <div className="text-center py-6">
          <div className="text-4xl mb-3">👨‍🎓</div>
          <h3 className="text-base font-medium text-gray-900 mb-2">
            No students yet
          </h3>
          <p className="text-gray-600 text-sm mb-3">
            Add your first student to start their learning journey
          </p>
          <button
            onClick={handleAddStudent}
            className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700"
          >
            Add Your First Student
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Student List */}
          <div className="lg:col-span-1">
            <h3 className="text-base font-semibold text-gray-900 mb-3">My Students</h3>
            <div className="space-y-2">
              {students.map((student) => (
                <div
                  key={student.id}
                  className={`p-3 border-2 rounded-lg cursor-pointer transition-all ${
                    selectedStudent?.id === student.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => handleStudentClick(student)}
                >
                  <div className="flex items-center mb-2">
                    <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center mr-2">
                      {student.avatar ? (
                        <img
                          src={student.avatar}
                          alt={student.name}
                          className="w-8 h-8 rounded-full object-cover"
                        />
                      ) : (
                        <span className="text-sm">👤</span>
                      )}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 text-sm">{student.name}</h4>
                      <p className="text-xs text-gray-600">
                        {student.has_goal ? 
                          (student.goal_status === '05' ? 
                            `AI Processing → ${student.learning_goal || formatLevel(student.target_level || 0)}` : 
                            student.goal_status === '02' || student.goal_status === '01' ? 
                              `Waiting AI Assessment → ${student.learning_goal || formatLevel(student.target_level || 0)}` : 
                            student.goal_status === '00' ? 
                              `Needs Assessment → ${student.learning_goal || formatLevel(student.target_level || 0)}` : 
                              `${formatLevel(student.current_level || 0)} → ${student.learning_goal || formatLevel(student.target_level || 0)}`
                          ) : 
                          "No Learning Goal Set"
                        }
                      </p>
                    </div>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <div className="flex flex-col gap-1">
                      <span className={`px-2 py-0.5 rounded-full text-xs ${getStatusColor(student.goal_status || '00')}`}>
                        {getStatusText(student.goal_status || '00')}
                      </span>
                    </div>
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
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center mr-3">
                      {selectedStudent.avatar ? (
                        <img
                          src={selectedStudent.avatar}
                          alt={selectedStudent.name}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                      ) : (
                        <span className="text-xl">👤</span>
                      )}
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">{selectedStudent.name}</h3>
                      <p className="text-sm text-gray-600">
                        {selectedStudent.has_goal ? 
                          (selectedStudent.goal_status === '05' ? 
                            `AI Processing → ${selectedStudent.learning_goal || formatLevel(selectedStudent.target_level || 0)}` : 
                            selectedStudent.goal_status === '02' || selectedStudent.goal_status === '01' ? 
                              `Waiting AI Assessment → ${selectedStudent.learning_goal || formatLevel(selectedStudent.target_level || 0)}` : 
                            selectedStudent.goal_status === '00' ? 
                              `Needs Assessment → ${selectedStudent.learning_goal || formatLevel(selectedStudent.target_level || 0)}` : 
                              `${formatLevel(selectedStudent.current_level || 0)} → ${selectedStudent.learning_goal || formatLevel(selectedStudent.target_level || 0)}`
                          ) : 
                          "No Learning Goal Set"
                        }
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-gray-500">Progress</div>
                    <div className="text-2xl font-bold text-blue-600">{selectedStudent.progress_percentage}%</div>
                  </div>
                </div>

                {/* Learning Goal */}
                {selectedStudent.learning_goal ? (
                  <>
                    <div className="mb-4 p-3 bg-white rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-semibold text-gray-900">Learning Goal</h4>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedStudent.goal_status || '00')}`}>
                          {getStatusText(selectedStudent.goal_status || '00')}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 mb-1">{selectedStudent.learning_goal}</p>
                      {selectedStudent.goal_description && (
                        <p className="text-xs text-gray-500">{selectedStudent.goal_description}</p>
                      )}
                    </div>

                    {/* Progress Bars - 只在有学习目标时显示 */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <div className="flex justify-between text-xs text-gray-600 mb-1">
                          <span>Level Progress</span>
                          <span>{selectedStudent.current_level}/{selectedStudent.target_level}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full transition-all"
                            style={{ width: `${((selectedStudent.current_level || 1) / (selectedStudent.target_level || 1)) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-xs text-gray-600 mb-1">
                          <span>Task Completion</span>
                          <span>{selectedStudent.completed_tasks}/{selectedStudent.total_tasks}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-green-600 h-2 rounded-full transition-all"
                            style={{ width: `${((selectedStudent.completed_tasks || 0) / (selectedStudent.total_tasks || 1)) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>

                    {/* Quick Stats - 只在有学习目标时显示 */}
                    <div className="grid grid-cols-4 gap-3 mb-4">
                      <div className="text-center">
                        <div className="text-lg font-bold text-blue-600">{selectedStudent.total_study_hours}h</div>
                        <div className="text-xs text-gray-600">Study Hours</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-green-600">{selectedStudent.upcoming_lessons}</div>
                        <div className="text-xs text-gray-600">Upcoming</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-purple-600">{selectedStudent.completed_tasks}</div>
                        <div className="text-xs text-gray-600">Completed</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-orange-600">
                          {selectedStudent.last_study_date ? 
                            new Date(selectedStudent.last_study_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'N/A'}
                        </div>
                        <div className="text-xs text-gray-600">Last Study</div>
                      </div>
                    </div>

                    {/* Assessment History - 只在有考试记录时显示 */}
                    {selectedStudent.active_goals && selectedStudent.active_goals.length > 0 && 
                     selectedStudent.active_goals[0].quizs && selectedStudent.active_goals[0].quizs.length > 0 && (
                      <div className="mb-4 p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
                        <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center space-x-2">
                          <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                          Assessment History
                        </h4>
                        <div className="space-y-2">
                          {selectedStudent.active_goals[0].quizs.map((quiz, index) => (
                            <div key={index} className="flex items-center justify-between p-2 bg-white rounded border">
                              <div className="flex items-center space-x-3">
                                <span className="text-sm font-medium text-gray-700">
                                  Assessment #{index + 1}
                                </span>
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  parseInt(quiz.score) >= 70 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                }`}>
                                  {quiz.score}%
                                </span>
                              </div>
                              <span className="text-xs text-gray-500">
                                {quiz.add_time ? 
                                  new Date(quiz.add_time).toLocaleDateString('en-US', { 
                                    year: 'numeric', 
                                    month: 'short', 
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  }) : 
                                  new Date().toLocaleDateString()
                                }
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  /* 没有学习目标时显示提示信息 */
                  <div className="mb-4 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg text-center">
                    <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-3">
                      <span className="text-2xl text-white">🎯</span>
                    </div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-2">No Learning Goal Set</h4>
                    <p className="text-sm text-gray-600 mb-3">
                      Set a learning goal to start tracking {selectedStudent.name}'s progress
                    </p>
                    <div className="text-xs text-gray-500 mt-2">
                      <p>• Set a clear learning objective</p>
                      <p>• Choose target level and timeline</p>
                      <p>• Start with initial assessment</p>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-2">
                  {!selectedStudent.learning_goal ? (
                    <button
                      onClick={() => handleSetGoal(selectedStudent)}
                      className="bg-blue-600 text-white px-3 py-1.5 rounded text-xs font-medium hover:bg-blue-700 transition-colors"
                    >
                      Set Learning Goal
                    </button>
                  ) : (
                    <>
                      {/* 根据学习目标状态显示不同的按钮 */}
                      {selectedStudent.has_goal && (
                        (() => {
                          const goalStatus = selectedStudent.goal_status || '00';
                          const hasQuizzes = selectedStudent.active_goals && 
                            selectedStudent.active_goals.length > 0 && 
                            selectedStudent.active_goals[0].quizs && 
                            selectedStudent.active_goals[0].quizs.length > 0;
                          
                                                    switch (goalStatus) {
                            case '00': // 需要测试
                              return (
                                <>
                                  <button
                                    onClick={() => handleAssessment(selectedStudent.id)}
                                    className="bg-orange-600 text-white px-3 py-1.5 rounded text-xs font-medium hover:bg-orange-700 transition-colors"
                                  >
                                    Take Initial Assessment
                                  </button>
                                  <button
                                    onClick={() => handleStudyPlanner(selectedStudent.id)}
                                    className="bg-gray-400 text-white px-3 py-1.5 rounded text-xs font-medium cursor-not-allowed"
                                    disabled
                                  >
                                    Study Planner (After Assessment)
                                  </button>
                                </>
                              );
                            case '01': // 测评错误
                            case '02': // 等待AI测评
                              return (
                                <>
                                  <button
                                    onClick={() => handleManualAIAssessment(selectedStudent.id)}
                                    className="bg-blue-600 text-white px-3 py-1.5 rounded text-xs font-medium hover:bg-blue-700 transition-colors"
                                  >
                                    Trigger AI Assessment
                                  </button>
                                  <button
                                    onClick={() => handleStudyPlanner(selectedStudent.id)}
                                    className="bg-gray-400 text-white px-3 py-1.5 rounded text-xs font-medium cursor-not-allowed"
                                    disabled
                                  >
                                    Study Planner (After Assessment)
                                  </button>
                                </>
                              );
                                                          case '05': // AI处理中
                              return (
                                <>
                                  <button
                                    className="bg-yellow-600 text-white px-3 py-1.5 rounded text-xs font-medium cursor-not-allowed"
                                    disabled
                                  >
                                    AI Processing Assessment...
                                  </button>
                                  <button
                                    onClick={() => handleStudyPlanner(selectedStudent.id)}
                                    className="bg-gray-400 text-white px-3 py-1.5 rounded text-xs font-medium cursor-not-allowed"
                                    disabled
                                  >
                                    Study Planner (After Assessment)
                                  </button>
                                </>
                              );
                            case '06': // 测评完成
                              return (
                                <>
                                  <button
                                    onClick={() => handleAssessment(selectedStudent.id)}
                                    className="bg-green-100 text-green-700 px-3 py-1.5 rounded text-xs font-medium hover:bg-green-200 transition-colors"
                                  >
                                    View Assessment Results
                                  </button>
                                  <button
                                    onClick={() => handleStudyPlanner(selectedStudent.id)}
                                    className="bg-blue-600 text-white px-3 py-1.5 rounded text-xs font-medium hover:bg-blue-700 transition-colors"
                                  >
                                    Edit Study Plan Template
                                  </button>
                                </>
                              );
                            case '10': // 进行中
                              return (
                                <>
                                  <button
                                    onClick={() => handleAssessment(selectedStudent.id)}
                                    className="bg-blue-600 text-white px-3 py-1.5 rounded text-xs font-medium hover:bg-blue-700 transition-colors"
                                  >
                                    Progress Assessment
                                  </button>
                                  <button
                                    onClick={() => handleStudyPlanner(selectedStudent.id)}
                                    className="bg-purple-600 text-white px-3 py-1.5 rounded text-xs font-medium hover:bg-purple-700 transition-colors"
                                  >
                                    Edit Study Plan Template
                                  </button>
                                  <button
                                    onClick={() => handleProgress(selectedStudent.id)}
                                    className="bg-green-600 text-white px-3 py-1.5 rounded text-xs font-medium hover:bg-green-700 transition-colors"
                                  >
                                    View Progress
                                  </button>
                                </>
                              );
                            case '20': // 已完成
                              return (
                                <>
                                  <button
                                    onClick={() => handleAssessment(selectedStudent.id)}
                                    className="bg-green-100 text-green-700 px-3 py-1.5 rounded text-xs font-medium hover:bg-green-200 transition-colors"
                                  >
                                    View Final Assessment
                                  </button>
                                  <button
                                    onClick={() => handleStudyPlanner(selectedStudent.id)}
                                    className="bg-purple-600 text-white px-3 py-1.5 rounded text-xs font-medium hover:bg-purple-700 transition-colors"
                                  >
                                    Edit Study Plan Template
                                  </button>
                                  <button
                                    onClick={() => handleProgress(selectedStudent.id)}
                                    className="bg-blue-600 text-white px-3 py-1.5 rounded text-xs font-medium hover:bg-blue-700 transition-colors"
                                  >
                                    View Final Report
                                  </button>
                                </>
                              );
                            default:
                              return (
                                <>
                                  <button
                                    onClick={() => handleAssessment(selectedStudent.id)}
                                    className="bg-blue-600 text-white px-3 py-1.5 rounded text-xs font-medium hover:bg-blue-700 transition-colors"
                                  >
                                    Take Assessment
                                  </button>
                                  <button
                                    onClick={() => handleStudyPlanner(selectedStudent.id)}
                                    className="bg-purple-600 text-white px-3 py-1.5 rounded text-xs font-medium hover:bg-purple-700 transition-colors"
                                  >
                                    Edit Study Plan Template
                                  </button>
                                </>
                              );
                          }
                        })()
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Learning Goal Modal */}
      <LearningGoalModal
        isOpen={showGoalModal}
        onClose={() => setShowGoalModal(false)}
        student={selectedStudentForGoal}
        onGoalSaved={handleGoalSaved}
      />

      {/* Assessment Result Modal */}
      {selectedStudentForAssessment && (
        <AssessmentResultModal
          isOpen={showAssessmentModal}
          onClose={() => {
            setShowAssessmentModal(false);
            setSelectedStudentForAssessment(null);
          }}
          studentId={selectedStudentForAssessment.id}
          overviewId={selectedStudentForAssessment.active_goals?.[0]?.id || 0}
          studentName={selectedStudentForAssessment.name}
        />
      )}

      {/* Edit Study Plan Template Modal */}
      {selectedStudentForStudyPlan && (
        <StudyPlanTemplateModal
          isOpen={showStudyPlanModal}
          onClose={() => {
            setShowStudyPlanModal(false);
            setSelectedStudentForStudyPlan(null);
          }}
          studentId={selectedStudentForStudyPlan.id}
          overviewId={selectedStudentForStudyPlan.active_goals?.[0]?.id || 0}
          studentName={selectedStudentForStudyPlan.name}
        />
      )}
    </div>
  );
}