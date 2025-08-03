'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '../../../../utils/api';
import { toast } from 'react-toastify';
import LearningGoalModal from './LearningGoalModal';
import AssessmentResultModal from './AssessmentResultModal';
import StudyPlanTemplateModal from './StudyPlanTemplateModal';
import StudyPlanManager from './StudyPlanManager';
import StudyPlanStats from './StudyPlanStats';
import AssessmentFlowModal from './AssessmentFlowModal';

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
  const [showStudyPlanManager, setShowStudyPlanManager] = useState(false);
  const [selectedStudentForManager, setSelectedStudentForManager] = useState<Student | null>(null);

  const [showStatsModal, setShowStatsModal] = useState(false);
  const [selectedStudentForStats, setSelectedStudentForStats] = useState<Student | null>(null);
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
            last_study_date: startDate,
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

  const handleAddStudent = () => {
    // TODO: Implement add student functionality
    console.log('Add student clicked');
  };

  const handleStudentClick = (student: Student) => {
    setSelectedStudent(student);
  };

  const handleAssessment = (studentId: number) => {
    const student = students.find(s => s.id === studentId);
    if (!student) return;

    // 检查是否有学习目标
    if (!student.has_goal) {
      toast.error('Please set a learning goal first');
      return;
    }

    // 检查评估状态
    if (student.assessment_status === 'completed') {
      // 如果已完成，显示结果
      setSelectedStudentForAssessment(student);
      setShowAssessmentModal(true);
    } else if (student.assessment_status === 'in_progress') {
      // 如果正在进行中，显示进度
      toast.info('Assessment is in progress. Please wait for completion.');
    } else {
      // 如果未开始，开始新的评估
      const assessmentUrl = `${process.env.NEXT_PUBLIC_API_BASE_URL}/spwapi/auth/assessment/start?student_id=${studentId}`;
      
      // 打开新窗口进行评估
      const assessmentWindow = window.open(assessmentUrl, '_blank', 'width=1200,height=800');
      
      if (assessmentWindow) {
        // 监听窗口关闭事件
        const checkClosed = setInterval(() => {
          if (assessmentWindow.closed) {
            clearInterval(checkClosed);
            // 刷新学生数据
            fetchStudents();
          }
        }, 1000);
      } else {
        toast.error('Please allow pop-ups to start the assessment');
      }
    }
  };

  const handleManualAIAssessment = async (studentId: number) => {
    try {
      const response = await apiClient.post('/spwapi/auth/aiagent/assessment', {
        student_id: studentId
      }) as any;
      
      if (response && response.code === 0) {
        toast.success('AI assessment started successfully');
        // 刷新学生数据
        fetchStudents();
      } else {
        toast.error(response?.msg || 'Failed to start AI assessment');
      }
    } catch (error) {
      console.error('Failed to start AI assessment:', error);
      toast.error('Failed to start AI assessment');
    }
  };

  const handleGenerateStudyPlan = async (studentId: number) => {
    try {
      const response = await apiClient.post('/spwapi/auth/aiagent/generate-study-plan', {
        student_id: studentId
      }) as any;
      
      if (response && response.code === 0) {
        toast.success('Study plan generation started successfully');
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
    setSelectedStudentForStudyPlan(students.find(s => s.id === studentId) || null);
    setShowStudyPlanModal(true);
  };

  const handleStudyPlanManager = (student: Student) => {
    setSelectedStudentForManager(student);
    setShowStudyPlanManager(true);
  };



  const handleProgress = (studentId: number) => {
    // 跳转到Progress页面
    router.push(`/v2/auth/progress?student_id=${studentId}`);
  };

  const handleViewStats = (student: Student) => {
    if (student.active_goals && student.active_goals.length > 0) {
      const goal = student.active_goals[0];
      setSelectedStudentForStats(student);
      setShowStatsModal(true);
    } else {
      toast.error('No active study plan found for this student');
    }
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

  // 渲染学生状态对应的组件
  const renderStudentStatusComponent = () => {
    if (!selectedStudent) return null;

    const goalStatus = selectedStudent.goal_status;
    const hasGoal = selectedStudent.has_goal;
    const activeGoals = selectedStudent.active_goals || [];

    if (!hasGoal) {
      // 没有学习目标 - 显示设置目标组件
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
            {/* 评估组件 */}
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
              <div className="flex gap-3">
                <button
                  onClick={() => handleAssessment(selectedStudent.id)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Take Assessment
                </button>
                <button
                  onClick={() => handleManualAIAssessment(selectedStudent.id)}
                  className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors"
                >
                  AI Assessment
                </button>
              </div>
            </div>

            {/* 推荐课程 */}
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
            {/* 学习计划概览 */}
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
                <div className="flex gap-3">
                  <button
                    onClick={() => handleStudyPlanCalendar(selectedStudent)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    View Calendar
                  </button>
                  <button
                    onClick={() => handleStudyPlanManager(selectedStudent)}
                    className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    Manage Plan
                  </button>
                </div>
              </div>
            )}

            {/* 统计信息 */}
            {activeGoals.length > 0 && (
              <StudyPlanStats 
                overviewId={activeGoals[0].id} 
                studentName={selectedStudent.name} 
              />
            )}

            {/* 最近活动 */}
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
            {/* 完成状态 */}
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
                <div className="flex gap-3 justify-center">
                  <button
                    onClick={() => handleAssessment(selectedStudent.id)}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                  >
                    View Final Report
                  </button>
                  <button
                    onClick={() => handleProgress(selectedStudent.id)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Download Certificate
                  </button>
                </div>
              </div>
            </div>

            {/* 最终统计 */}
            {activeGoals.length > 0 && (
              <StudyPlanStats 
                overviewId={activeGoals[0].id} 
                studentName={selectedStudent.name} 
              />
            )}

            {/* 推荐下一步 */}
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
        <button
          onClick={handleAddStudent}
          className="bg-blue-600 text-white px-3 py-1.5 rounded text-sm hover:bg-blue-700 transition-colors"
        >
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

      {/* Study Plan Manager */}
      {showStudyPlanCalendar && selectedStudentForCalendar && (
        <StudyPlanCalendar
          studentId={selectedStudentForCalendar.id}
          studentName={selectedStudentForCalendar.name}
          onClose={() => {
            setShowStudyPlanCalendar(false);
            setSelectedStudentForCalendar(null);
          }}
        />
      )}

      {showStudyPlanManager && selectedStudentForManager && (
        <StudyPlanManager
          studentId={selectedStudentForManager.id}
          studentName={selectedStudentForManager.name}
          onClose={() => {
            setShowStudyPlanManager(false);
            setSelectedStudentForManager(null);
          }}
        />
      )}

      {/* Study Plan Statistics Modal */}
      {showStatsModal && selectedStudentForStats && selectedStudentForStats.active_goals && selectedStudentForStats.active_goals.length > 0 && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-teal-600 to-blue-600 text-white p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold">Study Plan Statistics</h2>
                  <p className="text-teal-100">{selectedStudentForStats.name}</p>
                </div>
                <button
                  onClick={() => {
                    setShowStatsModal(false);
                    setSelectedStudentForStats(null);
                  }}
                  className="text-white hover:text-teal-100 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            {/* Content */}
            <div className="overflow-y-auto max-h-[calc(90vh-100px)]">
              <StudyPlanStats 
                overviewId={selectedStudentForStats.active_goals[0].id} 
                studentName={selectedStudentForStats.name} 
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}