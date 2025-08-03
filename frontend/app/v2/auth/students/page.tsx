'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '../../../utils/api';
import { toast } from 'react-toastify';
import { 
  FaGraduationCap,
  FaBullseye,
  FaChartBar,
  FaClock,
  FaCheckCircle,
  FaExclamationTriangle,
  FaUserPlus,
  FaPlay,
  FaEye,
  FaEdit,
  FaCalendar,
  FaBook,
  FaTrophy,
  FaLightbulb,
  FaTarget,
  FaList,
  FaStar,
  FaChartLine,
  FaCog,
  FaArrowLeft
} from 'react-icons/fa';
import LearningGoalModal from '../dashboard/components/LearningGoalModal';
import StudyPlanManagerV3 from '../dashboard/components/StudyPlanManagerV3';
import AssessmentFlowModal from '../dashboard/components/AssessmentFlowModal';

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
  email?: string;
  phone?: string;
  join_date?: string;
  status?: string;
}

interface RecommendedCourse {
  id: number;
  name: string;
  introduction: string;
  detail: string;
  language: string;
  level: number;
  cost_price: string;
  display_price: string;
  goal: string;
  update_time: string;
  add_time: string;
  status: string;
  flag: number;
  duration: number;
  session_number: number;
  course_picture: string;
}

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [recommendedCourses, setRecommendedCourses] = useState<RecommendedCourse[]>([]);
  const [coursesLoading, setCoursesLoading] = useState(false);
  
  // Modals
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [selectedStudentForGoal, setSelectedStudentForGoal] = useState<Student | null>(null);
  const [showStudyPlanManager, setShowStudyPlanManager] = useState(false);
  const [selectedStudentForManager, setSelectedStudentForManager] = useState<Student | null>(null);
  const [showAssessmentFlow, setShowAssessmentFlow] = useState(false);
  const [selectedStudentForAssessment, setSelectedStudentForAssessment] = useState<Student | null>(null);
  
  const router = useRouter();

  useEffect(() => {
    fetchStudents();
  }, []);

  useEffect(() => {
    if (selectedStudent) {
      fetchRecommendedCourses();
    }
  }, [selectedStudent]);

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
          
          const currentGoal = learningGoals.length > 0 ? learningGoals[0] : null;
          const goalStatus = currentGoal ? currentGoal.status : "";
          const hasGoal = learningGoals.length > 0;
          
          return {
            id: member.id,
            name: member.name,
            avatar: member.avatar,
            current_level: member.current_level || 0,
            target_level: member.target_level || 0,
            has_goal: hasGoal,
            goal_status: goalStatus,
            learning_goal: currentGoal ? currentGoal.title : "",
            goal_description: currentGoal ? currentGoal.description : "",
            assessment_status: hasGoal ? 
              (goalStatus === '06' ? 'completed' : 
               goalStatus === '05' ? 'in_progress' : 'not_started') : 'not_started',
            progress_percentage: progressPercentage,
            last_study_date: new Date().toISOString().slice(0, 10),
            total_study_hours: 0,
            upcoming_lessons: 0,
            completed_tasks: completedTasks,
            total_tasks: totalTasks,
            active_goals: learningGoals,
            email: member.email || '',
            phone: member.phone || '',
            join_date: member.add_time || new Date().toISOString().slice(0, 10),
            status: member.status || 'active'
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

  const fetchRecommendedCourses = async () => {
    if (!selectedStudent) return;
    
    setCoursesLoading(true);
    try {
      // 首先获取assessment_id
      const assessmentUrl = `/spwapi/auth/aiagent/assessment/latest?student_id=${selectedStudent.id}`;
      const assessmentResponse = await apiClient.get(assessmentUrl) as any;
      
      if (assessmentResponse && assessmentResponse.code === 0 && assessmentResponse.data) {
        const assessmentId = assessmentResponse.data.id;
        
        // 然后获取推荐课程
        const coursesUrl = `/spwapi/auth/aiagent/planner/course/recommend?assessment_id=${assessmentId}`;
        const coursesResponse = await apiClient.get(coursesUrl) as any;
        
        if (coursesResponse && coursesResponse.code === 0 && coursesResponse.data) {
          setRecommendedCourses(coursesResponse.data);
        } else {
          setRecommendedCourses([]);
        }
      } else {
        setRecommendedCourses([]);
      }
    } catch (error) {
      console.error('Failed to fetch recommended courses:', error);
      setRecommendedCourses([]);
    } finally {
      setCoursesLoading(false);
    }
  };

  const handleStudentSelect = (student: Student) => {
    setSelectedStudent(student);
    setActiveTab('overview');
  };

  const handleSetGoal = (student: Student) => {
    setSelectedStudentForGoal(student);
    setShowGoalModal(true);
  };

  const handleStudyPlanManager = (student: Student) => {
    setSelectedStudentForManager(student);
    setShowStudyPlanManager(true);
  };

  const handleAssessmentFlow = (student: Student) => {
    setSelectedStudentForAssessment(student);
    setShowAssessmentFlow(true);
  };

  const handleGoalSaved = (goal: any) => {
    toast.success('Learning goal saved successfully!');
    setShowGoalModal(false);
    fetchStudents();
  };

  const getPlanStatusColor = (status: string) => {
    switch (status) {
      case '00': return 'bg-gray-100 text-gray-800';
      case '01': return 'bg-red-100 text-red-800';
      case '02': return 'bg-orange-100 text-orange-800';
      case '05': return 'bg-blue-100 text-blue-800';
      case '06': return 'bg-green-100 text-green-800';
      case '10': return 'bg-blue-100 text-blue-800';
      case '20': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPlanStatusText = (status: string) => {
    switch (status) {
      case '00': return 'Ready for Assessment';
      case '01': return 'AI Error';
      case '02': return 'Assessment Required';
      case '05': return 'In Progress';
      case '06': return 'Completed';
      case '10': return 'Ongoing';
      case '20': return 'Completed';
      default: return 'Not Started';
    }
  };

  const getAssessmentStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'not_started': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getAssessmentStatusText = (status: string) => {
    switch (status) {
      case 'completed': return 'Completed';
      case 'in_progress': return 'In Progress';
      case 'not_started': return 'Not Started';
      default: return 'Not Started';
    }
  };

  const getTabsForStudent = (student: Student) => {
    const baseTabs = [
      { id: 'overview', label: 'Overview', icon: FaEye },
      { id: 'profile', label: 'Profile', icon: FaCog }
    ];

    if (student.assessment_status === 'not_started') {
      return [
        ...baseTabs,
        { id: 'assessment', label: 'Assessment', icon: FaPlay },
        { id: 'goals', label: 'Learning Goals', icon: FaTarget }
      ];
    } else if (student.assessment_status === 'in_progress') {
      return [
        ...baseTabs,
        { id: 'studyplan', label: 'Study Plan', icon: FaBook },
        { id: 'progress', label: 'Progress', icon: FaChartLine },
        { id: 'courses', label: 'Recommended Courses', icon: FaStar }
      ];
    } else if (student.assessment_status === 'completed') {
      return [
        ...baseTabs,
        { id: 'achievement', label: 'Achievement', icon: FaTrophy },
        { id: 'courses', label: 'Recommended Courses', icon: FaStar },
        { id: 'goals', label: 'New Goals', icon: FaTarget }
      ];
    }

    return baseTabs;
  };

  const stats = {
    total: students.length,
    active: students.filter(s => s.status === 'active').length,
    withGoals: students.filter(s => s.has_goal).length,
    completed: students.filter(s => s.assessment_status === 'completed').length,
    averageProgress: students.length > 0 
      ? Math.round(students.reduce((sum, s) => sum + (s.progress_percentage || 0), 0) / students.length)
      : 0
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Loading Students</h2>
          <p className="text-gray-600">Fetching student data...</p>
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
              <h1 className="text-white text-xl font-bold">Student Management</h1>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <FaGraduationCap className="text-blue-600" size={20} />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Total Students</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <FaCheckCircle className="text-green-600" size={20} />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Active</p>
                <p className="text-2xl font-bold text-gray-900">{stats.active}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <FaBullseye className="text-purple-600" size={20} />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">With Goals</p>
                <p className="text-2xl font-bold text-gray-900">{stats.withGoals}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 rounded-lg">
                <FaChartBar className="text-orange-600" size={20} />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-gray-900">{stats.completed}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-indigo-100 rounded-lg">
                <FaClock className="text-indigo-600" size={20} />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Avg Progress</p>
                <p className="text-2xl font-bold text-gray-900">{stats.averageProgress}%</p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex gap-6">
          {/* Left Sidebar - Student List */}
          <div className="w-1/3">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Students</h2>
              </div>
              <div className="max-h-96 overflow-y-auto">
                {students.map((student) => (
                  <div
                    key={student.id}
                    className={`p-4 border-b border-gray-100 cursor-pointer transition-colors ${
                      selectedStudent?.id === student.id ? 'bg-blue-50 border-blue-200' : 'hover:bg-gray-50'
                    }`}
                    onClick={() => handleStudentSelect(student)}
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${
                        student.assessment_status === 'completed' ? 'bg-gradient-to-br from-green-500 to-emerald-600' :
                        student.assessment_status === 'in_progress' ? 'bg-gradient-to-br from-blue-500 to-purple-600' :
                        'bg-gradient-to-br from-gray-500 to-gray-600'
                      }`}>
                        {student.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">{student.name}</h3>
                        <p className="text-sm text-gray-500">Level {student.current_level || 0}</p>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getAssessmentStatusColor(student.assessment_status)}`}>
                        {getAssessmentStatusText(student.assessment_status)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Side - Student Details */}
          <div className="flex-1">
            {selectedStudent ? (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                {/* Student Header */}
                <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className={`w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-xl ${
                        selectedStudent.assessment_status === 'completed' ? 'bg-gradient-to-br from-green-500 to-emerald-600' :
                        selectedStudent.assessment_status === 'in_progress' ? 'bg-gradient-to-br from-blue-500 to-purple-600' :
                        'bg-gradient-to-br from-gray-500 to-gray-600'
                      }`}>
                        {selectedStudent.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-gray-900">{selectedStudent.name}</h2>
                        <p className="text-gray-600">Level {selectedStudent.current_level || 0} • Joined {new Date(selectedStudent.join_date || '').toLocaleDateString()}</p>
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getAssessmentStatusColor(selectedStudent.assessment_status)}`}>
                      {getAssessmentStatusText(selectedStudent.assessment_status)}
                    </span>
                  </div>
                </div>

                {/* Tabs */}
                <div className="border-b border-gray-200">
                  <div className="flex space-x-1 px-6">
                    {getTabsForStudent(selectedStudent).map((tab) => {
                      const Icon = tab.icon;
                      return (
                        <button
                          key={tab.id}
                          onClick={() => setActiveTab(tab.id)}
                          className={`px-4 py-3 text-sm font-medium rounded-t-lg flex items-center space-x-2 transition-colors ${
                            activeTab === tab.id
                              ? 'bg-white text-blue-600 border-b-2 border-blue-600'
                              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          <Icon size={16} />
                          <span>{tab.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Tab Content */}
                <div className="p-6">
                  {activeTab === 'overview' && (
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-3">Learning Goal</h3>
                        <div className="bg-gray-50 rounded-lg p-4">
                          <p className="text-gray-700">
                            {selectedStudent.learning_goal || 'No learning goal set'}
                          </p>
                          {selectedStudent.goal_description && (
                            <p className="text-sm text-gray-500 mt-2">{selectedStudent.goal_description}</p>
                          )}
                        </div>
                      </div>

                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-3">Progress Overview</h3>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="bg-blue-50 rounded-lg p-4">
                            <div className="flex items-center space-x-2 mb-2">
                              <FaChartLine className="text-blue-600" size={16} />
                              <span className="font-medium text-gray-900">Progress</span>
                            </div>
                            <p className="text-2xl font-bold text-blue-600">{selectedStudent.progress_percentage || 0}%</p>
                          </div>
                          <div className="bg-purple-50 rounded-lg p-4">
                            <div className="flex items-center space-x-2 mb-2">
                              <FaList className="text-purple-600" size={16} />
                              <span className="font-medium text-gray-900">Tasks</span>
                            </div>
                            <p className="text-2xl font-bold text-purple-600">{selectedStudent.completed_tasks || 0}/{selectedStudent.total_tasks || 0}</p>
                          </div>
                        </div>
                      </div>

                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-3">Quick Actions</h3>
                        <div className="flex space-x-3">
                          {selectedStudent.assessment_status === 'not_started' && (
                            <>
                              <button
                                onClick={() => handleAssessmentFlow(selectedStudent)}
                                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                              >
                                <FaPlay size={14} />
                                <span>Start Assessment</span>
                              </button>
                              {!selectedStudent.has_goal && (
                                <button
                                  onClick={() => handleSetGoal(selectedStudent)}
                                  className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors flex items-center space-x-2"
                                >
                                  <FaEdit size={14} />
                                  <span>Set Goal</span>
                                </button>
                              )}
                            </>
                          )}
                          {selectedStudent.assessment_status === 'in_progress' && (
                            <>
                              <button
                                onClick={() => handleStudyPlanManager(selectedStudent)}
                                className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center space-x-2"
                              >
                                <FaBook size={14} />
                                <span>View Study Plan</span>
                              </button>
                              <button
                                onClick={() => handleAssessmentFlow(selectedStudent)}
                                className="bg-blue-100 text-blue-700 px-4 py-2 rounded-lg hover:bg-blue-200 transition-colors flex items-center space-x-2"
                              >
                                <FaPlay size={14} />
                                <span>Continue Assessment</span>
                              </button>
                            </>
                          )}
                          {selectedStudent.assessment_status === 'completed' && (
                            <>
                              <button
                                onClick={() => handleStudyPlanManager(selectedStudent)}
                                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
                              >
                                <FaTrophy size={14} />
                                <span>View Achievement</span>
                              </button>
                              <button
                                onClick={() => handleSetGoal(selectedStudent)}
                                className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors flex items-center space-x-2"
                              >
                                <FaEdit size={14} />
                                <span>Set New Goal</span>
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === 'profile' && (
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-3">Personal Information</h3>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Name</label>
                            <p className="mt-1 text-gray-900">{selectedStudent.name}</p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Email</label>
                            <p className="mt-1 text-gray-900">{selectedStudent.email || 'Not provided'}</p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Phone</label>
                            <p className="mt-1 text-gray-900">{selectedStudent.phone || 'Not provided'}</p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Join Date</label>
                            <p className="mt-1 text-gray-900">{new Date(selectedStudent.join_date || '').toLocaleDateString()}</p>
                          </div>
                        </div>
                      </div>

                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-3">Learning Information</h3>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Current Level</label>
                            <p className="mt-1 text-gray-900">{selectedStudent.current_level || 0}</p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Target Level</label>
                            <p className="mt-1 text-gray-900">{selectedStudent.target_level || 0}</p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Total Study Hours</label>
                            <p className="mt-1 text-gray-900">{selectedStudent.total_study_hours || 0} hours</p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Last Study Date</label>
                            <p className="mt-1 text-gray-900">{new Date(selectedStudent.last_study_date || '').toLocaleDateString()}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === 'assessment' && selectedStudent.assessment_status === 'not_started' && (
                    <div className="text-center py-12">
                      <div className="text-4xl mb-4">🎯</div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Ready for Assessment</h3>
                      <p className="text-gray-600 mb-6">Start the AI assessment to evaluate {selectedStudent.name}'s current level and create a personalized learning plan.</p>
                      <button
                        onClick={() => handleAssessmentFlow(selectedStudent)}
                        className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2 mx-auto"
                      >
                        <FaPlay size={16} />
                        <span>Start Assessment</span>
                      </button>
                    </div>
                  )}

                  {activeTab === 'goals' && (
                    <div className="space-y-6">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-gray-900">Learning Goals</h3>
                        <button
                          onClick={() => handleSetGoal(selectedStudent)}
                          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                        >
                          <FaEdit size={14} />
                          <span>{selectedStudent.has_goal ? 'Edit Goal' : 'Set Goal'}</span>
                        </button>
                      </div>
                      
                      {selectedStudent.has_goal ? (
                        <div className="bg-gray-50 rounded-lg p-6">
                          <h4 className="font-semibold text-gray-900 mb-2">{selectedStudent.learning_goal}</h4>
                          <p className="text-gray-600 mb-4">{selectedStudent.goal_description}</p>
                          <div className="flex items-center space-x-4">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPlanStatusColor(selectedStudent.goal_status || '')}`}>
                              {getPlanStatusText(selectedStudent.goal_status || '')}
                            </span>
                            <span className="text-sm text-gray-500">Created on {new Date(selectedStudent.join_date || '').toLocaleDateString()}</span>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-12">
                          <div className="text-4xl mb-4">🎯</div>
                          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Learning Goal Set</h3>
                          <p className="text-gray-600 mb-6">Set a learning goal to help {selectedStudent.name} stay focused and motivated.</p>
                          <button
                            onClick={() => handleSetGoal(selectedStudent)}
                            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2 mx-auto"
                          >
                            <FaEdit size={16} />
                            <span>Set Learning Goal</span>
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {activeTab === 'studyplan' && selectedStudent.assessment_status === 'in_progress' && (
                    <div className="text-center py-12">
                      <div className="text-4xl mb-4">📚</div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Study Plan Management</h3>
                      <p className="text-gray-600 mb-6">View and manage {selectedStudent.name}'s personalized study plan with tasks, progress tracking, and recommended courses.</p>
                      <button
                        onClick={() => handleStudyPlanManager(selectedStudent)}
                        className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors flex items-center space-x-2 mx-auto"
                      >
                        <FaBook size={16} />
                        <span>Open Study Plan</span>
                      </button>
                    </div>
                  )}

                  {activeTab === 'progress' && selectedStudent.assessment_status === 'in_progress' && (
                    <div className="space-y-6">
                      <h3 className="text-lg font-semibold text-gray-900">Learning Progress</h3>
                      
                      <div className="bg-blue-50 rounded-lg p-6">
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="font-semibold text-gray-900">Overall Progress</h4>
                          <span className="text-2xl font-bold text-blue-600">{selectedStudent.progress_percentage || 0}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
                          <div
                            className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full transition-all"
                            style={{ width: `${selectedStudent.progress_percentage || 0}%` }}
                          ></div>
                        </div>
                        <div className="grid grid-cols-3 gap-4 text-center">
                          <div>
                            <p className="text-2xl font-bold text-gray-900">{selectedStudent.completed_tasks || 0}</p>
                            <p className="text-sm text-gray-600">Tasks Completed</p>
                          </div>
                          <div>
                            <p className="text-2xl font-bold text-gray-900">{selectedStudent.total_tasks || 0}</p>
                            <p className="text-sm text-gray-600">Total Tasks</p>
                          </div>
                          <div>
                            <p className="text-2xl font-bold text-gray-900">{selectedStudent.total_study_hours || 0}</p>
                            <p className="text-sm text-gray-600">Study Hours</p>
                          </div>
                        </div>
                      </div>

                      <div className="bg-purple-50 rounded-lg p-6">
                        <h4 className="font-semibold text-gray-900 mb-4">Recent Activity</h4>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-gray-700">Last study session</span>
                            <span className="text-gray-500">{new Date(selectedStudent.last_study_date || '').toLocaleDateString()}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-gray-700">Learning goal status</span>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPlanStatusColor(selectedStudent.goal_status || '')}`}>
                              {getPlanStatusText(selectedStudent.goal_status || '')}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === 'achievement' && selectedStudent.assessment_status === 'completed' && (
                    <div className="space-y-6">
                      <div className="text-center">
                        <div className="text-6xl mb-4">🏆</div>
                        <h3 className="text-2xl font-bold text-gray-900 mb-2">Congratulations!</h3>
                        <p className="text-gray-600 mb-6">{selectedStudent.name} has successfully completed their learning goal.</p>
                      </div>

                      <div className="bg-green-50 rounded-lg p-6">
                        <h4 className="font-semibold text-gray-900 mb-4">Achievement Summary</h4>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="text-center">
                            <p className="text-3xl font-bold text-green-600">{selectedStudent.progress_percentage || 0}%</p>
                            <p className="text-sm text-gray-600">Final Progress</p>
                          </div>
                          <div className="text-center">
                            <p className="text-3xl font-bold text-green-600">{selectedStudent.completed_tasks || 0}</p>
                            <p className="text-sm text-gray-600">Tasks Completed</p>
                          </div>
                        </div>
                      </div>

                      <div className="bg-blue-50 rounded-lg p-6">
                        <h4 className="font-semibold text-gray-900 mb-4">Learning Goal Achieved</h4>
                        <div className="bg-white rounded-lg p-4">
                          <h5 className="font-medium text-gray-900 mb-2">{selectedStudent.learning_goal}</h5>
                          <p className="text-gray-600">{selectedStudent.goal_description}</p>
                        </div>
                      </div>

                      <div className="text-center">
                        <button
                          onClick={() => handleSetGoal(selectedStudent)}
                          className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2 mx-auto"
                        >
                          <FaEdit size={16} />
                          <span>Set New Learning Goal</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {activeTab === 'courses' && (
                    <div className="space-y-6">
                      <h3 className="text-lg font-semibold text-gray-900">Recommended Courses</h3>
                      
                      {coursesLoading ? (
                        <div className="text-center py-12">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                          <p className="text-gray-600">Loading recommended courses...</p>
                        </div>
                      ) : recommendedCourses.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {recommendedCourses.map((course) => (
                            <div key={course.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                              <div className="flex items-start space-x-4">
                                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-lg">
                                  {course.name.charAt(0).toUpperCase()}
                                </div>
                                <div className="flex-1">
                                  <h4 className="font-semibold text-gray-900 mb-1">{course.name}</h4>
                                  <p className="text-sm text-gray-600 mb-2 line-clamp-2">{course.introduction}</p>
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                                      <span>{course.language}</span>
                                      <span>Level {course.level}</span>
                                      <span>{course.session_number} sessions</span>
                                    </div>
                                    <span className="font-semibold text-green-600">${parseFloat(course.display_price)}</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-12">
                          <div className="text-4xl mb-4">📚</div>
                          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Recommended Courses</h3>
                          <p className="text-gray-600">No courses are currently recommended for {selectedStudent.name}.</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
                <div className="text-4xl mb-4">👥</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Select a Student</h3>
                <p className="text-gray-600">Choose a student from the list to view their details and manage their learning journey.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      <LearningGoalModal
        isOpen={showGoalModal}
        onClose={() => setShowGoalModal(false)}
        student={selectedStudentForGoal}
        onGoalSaved={handleGoalSaved}
      />

      {showStudyPlanManager && selectedStudentForManager && (
        <StudyPlanManagerV3
          studentId={selectedStudentForManager.id}
          studentName={selectedStudentForManager.name}
          onClose={() => setShowStudyPlanManager(false)}
        />
      )}

      {showAssessmentFlow && selectedStudentForAssessment && (
        <AssessmentFlowModal
          isOpen={showAssessmentFlow}
          onClose={() => setShowAssessmentFlow(false)}
          student={selectedStudentForAssessment}
          onStatusChange={fetchStudents}
        />
      )}
    </div>
  );
} 