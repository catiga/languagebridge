'use client';

import React, { useState, useEffect } from 'react';
import { apiClient } from '../../../../utils/api';
import { toast } from 'react-toastify';
import { 
  FaTimes, 
  FaCheck, 
  FaClock,
  FaCalendarAlt,
  FaStar,
  FaChartBar,
  FaPlay,
  FaPause,
  FaStop,
  FaEye,
  FaList,
  FaCalendar,
  FaCalendarDay,
  FaCalendarWeek,
  FaEdit
} from 'react-icons/fa';

interface Task {
  id: number;
  student_id: number;
  exe_date: string;
  start_time: string;
  end_time: string;
  duration: number;
  priority: number;
  content: string;
  note: string;
  add_time: string;
  status: string;
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
  tasks: Task[];
  goal_period_type: string;
  target_level: number;
  init_level: number;
  status: string;
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

interface StudyPlanManagerV3Props {
  studentId: number;
  studentName: string;
  onClose: () => void;
}

const priorityConfig = {
  1: { label: 'High', color: 'bg-red-100 text-red-800', icon: '🔴' },
  2: { label: 'Medium', color: 'bg-yellow-100 text-yellow-800', icon: '🟡' },
  3: { label: 'Low', color: 'bg-green-100 text-green-800', icon: '🟢' }
};

const statusConfig = {
  '00': { label: 'Created', color: 'bg-gray-100 text-gray-800' },
  '10': { label: 'Ongoing', color: 'bg-blue-100 text-blue-800' },
  '20': { label: 'Unfinished', color: 'bg-red-100 text-red-800' },
  '50': { label: 'Fully Complete', color: 'bg-green-100 text-green-800' },
  '51': { label: 'Few Complete', color: 'bg-orange-100 text-orange-800' },
  '52': { label: 'Mostly Complete', color: 'bg-yellow-100 text-yellow-800' },
  '53': { label: 'Partially Complete', color: 'bg-purple-100 text-purple-800' },
  '54': { label: 'Lately Complete', color: 'bg-teal-100 text-teal-800' }
};

export default function StudyPlanManagerV3({ studentId, studentName, onClose }: StudyPlanManagerV3Props) {
  const [learningGoal, setLearningGoal] = useState<LearningGoal | null>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'summary' | 'tasks' | 'progress' | 'courses'>('summary');
  const [calendarView, setCalendarView] = useState<'list' | 'month' | 'week' | 'day'>('list');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDebug, setShowDebug] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showTaskListModal, setShowTaskListModal] = useState(false);
  const [selectedTasks, setSelectedTasks] = useState<Set<number>>(new Set());
  const [recommendedCourses, setRecommendedCourses] = useState<RecommendedCourse[]>([]);
  const [coursesLoading, setCoursesLoading] = useState(false);

  useEffect(() => {
    fetchStudyPlan();
    fetchRecommendedCourses();
  }, [studentId]);

  // 当切换到courses tab时，重新获取推荐课程
  useEffect(() => {
    if (view === 'courses') {
      console.log('Switched to courses tab, fetching recommended courses...');
      fetchRecommendedCourses();
    }
  }, [view]);

  const fetchStudyPlan = async () => {
    try {
      const response = await apiClient.get(`/spwapi/auth/planner/pull?student_id=${studentId}`) as any;
      if (response && response.code === 0 && Array.isArray(response.data) && response.data.length > 0) {
        setLearningGoal(response.data[0]);
      }
    } catch (error) {
      console.error('Failed to fetch study plan:', error);
      toast.error('Failed to load study plan');
    } finally {
      setLoading(false);
    }
  };

  const fetchRecommendedCourses = async () => {
    setCoursesLoading(true);
    try {
      console.log('=== Fetching recommended courses ===');
      console.log('Student ID:', studentId);
      
      // 首先获取学生的评估ID
      const assessmentUrl = `/spwapi/auth/aiagent/assessment/latest?student_id=${studentId}`;
      console.log('Assessment URL:', assessmentUrl);
      
      const assessmentResponse = await apiClient.get(assessmentUrl) as any;
      console.log('Assessment response:', assessmentResponse);
      
      if (assessmentResponse && assessmentResponse.code === 0 && assessmentResponse.data) {
        const assessmentId = assessmentResponse.data.id;
        console.log('Assessment ID:', assessmentId);
        
        if (!assessmentId) {
          console.error('No assessment ID found in response');
          setRecommendedCourses([]);
          return;
        }
        
        // 使用评估ID获取推荐课程
        const coursesUrl = `/spwapi/auth/aiagent/planner/course/recommend?assessment_id=${assessmentId}`;
        console.log('Courses URL:', coursesUrl);
        
        const coursesResponse = await apiClient.get(coursesUrl) as any;
        console.log('Courses response:', coursesResponse);
        
        if (coursesResponse && coursesResponse.code === 0) {
          console.log('Courses data:', coursesResponse.data);
          setRecommendedCourses(coursesResponse.data || []);
        } else {
          console.error('Failed to fetch recommended courses:', coursesResponse?.msg);
          setRecommendedCourses([]);
        }
      } else {
        console.error('Failed to fetch assessment:', assessmentResponse?.msg);
        console.error('Assessment response code:', assessmentResponse?.code);
        setRecommendedCourses([]);
      }
    } catch (error) {
      console.error('Failed to fetch recommended courses:', error);
      setRecommendedCourses([]);
    } finally {
      setCoursesLoading(false);
    }
  };

  const updateTaskStatus = async (taskId: number, newStatus: string, note?: string) => {
    setIsSaving(true);
    try {
      const response = await apiClient.post('/spwapi/auth/planner/task/update', {
        id: taskId,
        status: newStatus,
        note: note || ''
      }) as any;
      
      if (response && response.code === 0) {
        toast.success('Task updated successfully!');
        fetchStudyPlan();
        setShowEditModal(false);
        setEditingTask(null);
      } else {
        toast.error(response?.msg || 'Failed to update task');
      }
    } catch (error) {
      console.error('Failed to update task status:', error);
      toast.error('Failed to update task');
    } finally {
      setIsSaving(false);
    }
  };

  const getProgressStats = () => {
    if (!learningGoal?.tasks) return { completed: 0, total: 0, percentage: 0 };
    
    const total = learningGoal.tasks.length;
    const completed = learningGoal.tasks.filter(task => task.status === 'done').length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    
    return { completed, total, percentage };
  };

  const getUpcomingTasks = () => {
    if (!learningGoal?.tasks) return [];
    
    const today = new Date().toISOString().split('T')[0];
    return learningGoal.tasks
      .filter(task => task.exe_date >= today && task.status !== 'done')
      .sort((a, b) => new Date(a.exe_date).getTime() - new Date(b.exe_date).getTime())
      .slice(0, 3);
  };

  const getOverdueTasks = () => {
    if (!learningGoal?.tasks) return [];
    
    const today = new Date().toISOString().split('T')[0];
    return learningGoal.tasks
      .filter(task => task.exe_date < today && task.status !== 'done')
      .sort((a, b) => new Date(a.exe_date).getTime() - new Date(b.exe_date).getTime())
      .slice(0, 3);
  };

  // 日历相关函数
  const getTasksForDate = (date: Date): Task[] => {
    if (!learningGoal?.tasks) return [];
    
    // 使用本地时区的日期字符串，避免时区偏移问题
    const dateStr = date.toLocaleDateString('en-CA'); // YYYY-MM-DD format
    const isoDateStr = date.toISOString().split('T')[0];
    
    return learningGoal.tasks
      .filter(task => {
        // 处理多种日期格式
        const taskDate = task.exe_date;
        
        // 如果是ISO格式（带时区），提取日期部分并转换为本地时区
        if (taskDate.includes('T')) {
          const taskDateOnly = taskDate.split('T')[0];
          // 将ISO日期转换为本地时区进行比较
          const taskDateLocal = new Date(taskDate).toLocaleDateString('en-CA');
          return taskDateLocal === dateStr || taskDateOnly === dateStr;
        }
        
        // 其他格式匹配
        return taskDate === dateStr || taskDate === isoDateStr || taskDate === date.toLocaleDateString();
      })
      .sort((a, b) => new Date(a.exe_date).getTime() - new Date(b.exe_date).getTime());
  };

  const getSortedTasks = (): Task[] => {
    if (!learningGoal?.tasks) return [];
    
    return learningGoal.tasks
      .sort((a, b) => new Date(a.exe_date).getTime() - new Date(b.exe_date).getTime());
  };

  const getMonthDays = (date: Date): Date[] => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const days: Date[] = [];
    const currentDate = new Date(startDate);
    
    while (currentDate <= lastDay || currentDate.getDay() !== 0) {
      days.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return days;
  };

  const getWeekDays = (date: Date): Date[] => {
    const days: Date[] = [];
    const startOfWeek = new Date(date);
    startOfWeek.setDate(date.getDate() - date.getDay());
    
    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      days.push(day);
    }
    
    return days;
  };

  const navigateDate = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    
    switch (calendarView) {
      case 'month':
        newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
        break;
      case 'week':
        newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
        break;
      case 'day':
        newDate.setDate(newDate.getDate() + (direction === 'next' ? 1 : -1));
        break;
    }
    
    setCurrentDate(newDate);
  };

  const canEditTask = (taskDate: string): boolean => {
    // 允许编辑今天和未来的任务
    return true;
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setShowEditModal(true);
  };

  const handleQuickComplete = async (task: Task) => {
    // 获取最新的note值
    const currentTask = learningGoal?.tasks.find(t => t.id === task.id);
    const note = currentTask?.note || task.note || 'Task completed';
    await updateTaskStatus(task.id, '50', note);
  };

  const handleDateClick = (date: Date) => {
    const tasks = getTasksForDate(date);
    if (tasks.length > 0) {
      // 如果有任务，显示任务列表模态框
      setSelectedDate(date);
      setShowTaskListModal(true);
      setSelectedTasks(new Set()); // 重置选择
    } else {
      // 如果没有任务，显示提示
      toast.info(`No tasks scheduled for ${date.toLocaleDateString()}`);
    }
  };

  const handleBulkAction = async (action: 'complete' | 'status', status?: string) => {
    if (selectedTasks.size === 0) {
      toast.warning('Please select at least one task');
      return;
    }

    const tasks = getTasksForDate(selectedDate!);
    const selectedTaskList = tasks.filter(task => selectedTasks.has(task.id));

    if (action === 'complete') {
      const note = prompt('Add a completion note for all selected tasks (max 50 characters, optional):', '');
      if (note !== null) {
        const trimmedNote = note.slice(0, 50); // 限制50字
        for (const task of selectedTaskList) {
          await updateTaskStatus(task.id, '50', trimmedNote || 'Task completed');
        }
        setSelectedTasks(new Set());
        toast.success(`${selectedTaskList.length} tasks marked as completed`);
      }
    } else if (action === 'status' && status) {
      for (const task of selectedTaskList) {
        await updateTaskStatus(task.id, status, task.note);
      }
      setSelectedTasks(new Set());
      toast.success(`${selectedTaskList.length} tasks status updated`);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl p-8 max-w-md w-full mx-4 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h3 className="text-lg font-semibold text-gray-900">Loading Study Plan</h3>
        </div>
      </div>
    );
  }

  if (!learningGoal) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl p-8 max-w-md w-full mx-4 text-center">
          <div className="text-4xl mb-4">📚</div>
          <h3 className="text-lg font-semibold mb-2">No Study Plan Found</h3>
          <p className="text-gray-600 mb-6">
            No active study plan found for {studentName}.
          </p>
          <button
            onClick={onClose}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  const progressStats = getProgressStats();
  const upcomingTasks = getUpcomingTasks();
  const overdueTasks = getOverdueTasks();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-5xl w-full max-h-[95vh] overflow-hidden">
        {/* 简化的头部 */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Study Plan</h2>
              <p className="text-blue-100 mt-1">{studentName}</p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-blue-100 transition-colors p-2"
            >
              <FaTimes size={20} />
            </button>
          </div>
        </div>

        {/* 简化的视图切换 */}
        <div className="bg-gray-50 px-6 py-4">
          <div className="grid grid-cols-4 gap-1 bg-white rounded-lg p-1">
            {[
              { key: 'summary', label: 'Summary', icon: FaEye },
              { key: 'tasks', label: 'Tasks', icon: FaList },
              { key: 'progress', label: 'Progress', icon: FaChartBar },
              { key: 'courses', label: 'Courses', icon: FaStar }
            ].map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setView(key as any)}
                className={`flex items-center justify-center space-x-2 py-2 px-2 rounded-md text-sm font-medium transition-colors ${
                  view === key
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Icon size={14} />
                <span className="hidden sm:inline">{label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 内容区域 */}
        <div className="overflow-y-auto max-h-[calc(90vh-180px)]">
          {view === 'summary' && (
            <div className="p-6 space-y-6">
              {/* 学习目标卡片 */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                      {learningGoal.title}
                    </h3>
                    <p className="text-gray-600 mb-4 line-clamp-2">{learningGoal.description}</p>
                    <div className="flex space-x-6 text-sm">
                      <div>
                        <span className="text-gray-500">Start:</span>
                        <div className="font-semibold">{new Date(learningGoal.start_date).toLocaleDateString()}</div>
                      </div>
                      <div>
                        <span className="text-gray-500">End:</span>
                        <div className="font-semibold">{new Date(learningGoal.end_date).toLocaleDateString()}</div>
                      </div>
                      <div>
                        <span className="text-gray-500">Target:</span>
                        <div className="font-semibold">Level {learningGoal.target_level}</div>
                      </div>
                    </div>
                  </div>
                  <div className="text-right ml-6">
                    <div className="text-4xl font-bold text-blue-600 mb-1">
                      {progressStats.percentage}%
                    </div>
                    <div className="text-sm text-gray-500">Complete</div>
                    <div className="w-20 h-2 bg-gray-200 rounded-full mt-3">
                      <div
                        className="bg-blue-500 h-2 rounded-full transition-all"
                        style={{ width: `${progressStats.percentage}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 快速统计 */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-white rounded-xl p-4 border border-gray-200 text-center hover:shadow-md transition-shadow">
                  <div className="text-2xl font-bold text-green-600 mb-1">{progressStats.completed}</div>
                  <div className="text-sm text-gray-600">Completed</div>
                </div>
                <div className="bg-white rounded-xl p-4 border border-gray-200 text-center hover:shadow-md transition-shadow">
                  <div className="text-2xl font-bold text-blue-600 mb-1">{progressStats.total}</div>
                  <div className="text-sm text-gray-600">Total</div>
                </div>
                <div className="bg-white rounded-xl p-4 border border-gray-200 text-center hover:shadow-md transition-shadow">
                  <div className="text-2xl font-bold text-orange-600 mb-1">{upcomingTasks.length}</div>
                  <div className="text-sm text-gray-600">Upcoming</div>
                </div>
              </div>

              {/* 任务概览 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* 即将到来的任务 */}
                <div className="bg-white rounded-xl p-4 border border-gray-200">
                  <div className="flex items-center mb-4">
                    <FaClock className="text-blue-600 mr-2" />
                    <h4 className="font-semibold text-gray-900">Upcoming Tasks</h4>
                  </div>
                  <div className="space-y-3">
                    {upcomingTasks.length > 0 ? (
                      upcomingTasks.map((task) => (
                        <div key={task.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-gray-900 truncate">
                              {task.content}
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              {new Date(task.exe_date).toLocaleDateString()}
                            </div>
                          </div>
                          <button
                            onClick={() => updateTaskStatus(task.id, 'done')}
                            className="ml-3 p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                          >
                            <FaCheck size={14} />
                          </button>
                        </div>
                      ))
                    ) : (
                      <div className="text-center text-gray-500 py-6">
                        <div className="text-2xl mb-2">✅</div>
                        <div>No upcoming tasks</div>
                      </div>
                    )}
                  </div>
                </div>

                {/* 逾期任务 */}
                <div className="bg-white rounded-xl p-4 border border-gray-200">
                  <div className="flex items-center mb-4">
                    <FaTimes className="text-red-600 mr-2" />
                    <h4 className="font-semibold text-gray-900">Overdue Tasks</h4>
                  </div>
                  <div className="space-y-3">
                    {overdueTasks.length > 0 ? (
                      overdueTasks.map((task) => (
                        <div key={task.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-gray-900 truncate">
                              {task.content}
                            </div>
                            <div className="text-xs text-red-500 mt-1">
                              {new Date(task.exe_date).toLocaleDateString()}
                            </div>
                          </div>
                          <button
                            onClick={() => updateTaskStatus(task.id, 'done')}
                            className="ml-3 p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                          >
                            <FaCheck size={14} />
                          </button>
                        </div>
                      ))
                    ) : (
                      <div className="text-center text-gray-500 py-6">
                        <div className="text-2xl mb-2">🎉</div>
                        <div>No overdue tasks</div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {view === 'tasks' && (
            <div className="p-6">
              {/* 日历视图切换 */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Task Calendar</h3>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setShowDebug(!showDebug)}
                      className="px-3 py-2 bg-gray-600 text-white rounded-lg text-sm hover:bg-gray-700 transition-colors"
                    >
                      {showDebug ? 'Hide Debug' : 'Show Debug'}
                    </button>
                    {[
                      { key: 'list', label: 'List', icon: FaList },
                      { key: 'month', label: 'Month', icon: FaCalendar },
                      { key: 'week', label: 'Week', icon: FaCalendarWeek },
                      { key: 'day', label: 'Day', icon: FaCalendarDay }
                    ].map(({ key, label, icon: Icon }) => (
                      <button
                        key={key}
                        onClick={() => setCalendarView(key as any)}
                        className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                          calendarView === key
                            ? 'bg-blue-600 text-white shadow-sm'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        <Icon size={14} />
                        <span>{label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 日期导航 */}
                <div className="flex items-center justify-between mb-4">
                  <button
                    onClick={() => navigateDate('prev')}
                    className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    ← Previous
                  </button>
                  <div className="text-lg font-semibold text-gray-900">
                    {calendarView === 'month' && currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                    {calendarView === 'week' && `Week of ${currentDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`}
                    {calendarView === 'day' && currentDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    {calendarView === 'list' && 'All Tasks'}
                  </div>
                  <button
                    onClick={() => navigateDate('next')}
                    className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    Next →
                  </button>
                </div>
              </div>

              {/* 调试信息 */}
              {showDebug && (
                <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <h4 className="font-semibold text-yellow-800 mb-2">Debug Information</h4>
                  <div className="text-sm text-yellow-700 space-y-1">
                    <div>Total Tasks: {learningGoal?.tasks?.length || 0}</div>
                    <div>Current Date: {currentDate.toISOString().split('T')[0]}</div>
                    <div>Tasks for today: {getTasksForDate(new Date()).length}</div>
                    <div>Tasks for current month: {getTasksForDate(currentDate).length}</div>
                    <div className="mt-2">
                      <strong>Sample Tasks:</strong>
                      {learningGoal?.tasks?.slice(0, 3).map(task => (
                        <div key={task.id} className="ml-4">
                          ID: {task.id}, Date: {task.exe_date}, Content: {task.content}
                        </div>
                      ))}
                    </div>
                    <div className="mt-2">
                      <strong>Date Format Test:</strong>
                      <div className="ml-4">
                        {learningGoal?.tasks?.slice(0, 1).map(task => {
                          const taskDate = task.exe_date;
                          const dateOnly = taskDate.includes('T') ? taskDate.split('T')[0] : taskDate;
                          return (
                            <div key={task.id}>
                              Original: {taskDate} → Date Only: {dateOnly}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                    <div className="mt-2">
                      <strong>Specific Date Test (2025-08-06):</strong>
                      <div className="ml-4">
                        {(() => {
                          const testDate = new Date('2025-08-06');
                          const tasksForDate = getTasksForDate(testDate);
                          return (
                            <div>
                              Tasks found: {tasksForDate.length}
                              {tasksForDate.slice(0, 2).map(task => (
                                <div key={task.id} className="ml-2">
                                  - {task.content}
                                </div>
                              ))}
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                    <div className="mt-2">
                      <strong>Timezone Debug:</strong>
                      <div className="ml-4">
                        {(() => {
                          const testDate = new Date('2025-08-06');
                          const isoStr = testDate.toISOString().split('T')[0];
                          const localStr = testDate.toLocaleDateString('en-CA');
                          return (
                            <div>
                              <div>Date: 2025-08-06</div>
                              <div>ISO: {isoStr}</div>
                              <div>Local: {localStr}</div>
                              <div>Timezone: {Intl.DateTimeFormat().resolvedOptions().timeZone}</div>
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                    <div className="mt-2">
                      <strong>Date Comparison Test:</strong>
                      <div className="ml-4">
                        {(() => {
                          const date6 = new Date('2025-08-06');
                          const date7 = new Date('2025-08-07');
                          const tasks6 = getTasksForDate(date6);
                          const tasks7 = getTasksForDate(date7);
                          return (
                            <div>
                              <div>Aug 6 tasks: {tasks6.length}</div>
                              <div>Aug 7 tasks: {tasks7.length}</div>
                              {tasks6.slice(0, 1).map(task => (
                                <div key={task.id} className="ml-2">
                                  Aug 6: {task.content} (Date: {task.exe_date})
                                </div>
                              ))}
                              {tasks7.slice(0, 1).map(task => (
                                <div key={task.id} className="ml-2">
                                  Aug 7: {task.content} (Date: {task.exe_date})
                                </div>
                              ))}
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 日历内容 */}
              {calendarView === 'list' && (
                <div className="space-y-3">
                  {getSortedTasks().map((task) => (
                    <div
                      key={task.id}
                      className={`flex items-center justify-between p-4 rounded-xl border transition-all ${
                        statusConfig[task.status as keyof typeof statusConfig]?.color || 'bg-white border-gray-200'
                      } hover:shadow-md`}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-3 mb-2">
                          <span className="text-sm">{priorityConfig[task.priority as keyof typeof priorityConfig].icon}</span>
                          <div className={`px-2 py-1 rounded text-xs font-medium ${priorityConfig[task.priority as keyof typeof priorityConfig].color}`}>
                            {priorityConfig[task.priority as keyof typeof priorityConfig].label}
                          </div>
                          <div className={`px-2 py-1 rounded text-xs font-medium ${statusConfig[task.status as keyof typeof statusConfig]?.color || 'bg-gray-100 text-gray-800'}`}>
                            {statusConfig[task.status as keyof typeof statusConfig]?.label || task.status}
                          </div>
                          <span className="text-sm text-gray-500">
                            {new Date(task.exe_date).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="font-medium text-gray-900">{task.content}</div>
                        {task.note && (
                          <div className="text-sm text-gray-600 mt-1">{task.note}</div>
                        )}
                      </div>
                      <div className="flex items-center space-x-2 ml-4">
                        {canEditTask(task.exe_date) && (
                          <div className="flex items-center space-x-1">
                            {task.status !== '50' && (
                              <button
                                onClick={() => handleQuickComplete(task)}
                                className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                title="Mark as completed"
                              >
                                <FaCheck size={16} />
                              </button>
                            )}
                            <button
                              onClick={() => handleEditTask(task)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Edit task"
                            >
                              <FaEdit size={16} />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {calendarView === 'month' && (
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  {/* 星期标题 */}
                  <div className="grid grid-cols-7 bg-gray-50 border-b border-gray-200">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                      <div key={day} className="p-3 text-center text-sm font-medium text-gray-600">
                        {day}
                      </div>
                    ))}
                  </div>
                  
                  {/* 日历网格 */}
                  <div className="grid grid-cols-7">
                    {getMonthDays(currentDate).map((date, index) => {
                      const tasks = getTasksForDate(date);
                      const isToday = date.toDateString() === new Date().toDateString();
                      const isCurrentMonth = date.getMonth() === currentDate.getMonth();
                      
                      return (
                        <div
                          key={index}
                          className={`min-h-[140px] p-2 border-r border-b border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors ${
                            isCurrentMonth ? 'bg-white' : 'bg-gray-50'
                          } ${isToday ? 'bg-blue-50' : ''}`}
                          onClick={() => handleDateClick(date)}
                        >
                          <div className={`text-sm font-medium mb-1 ${
                            isToday ? 'text-blue-600' : isCurrentMonth ? 'text-gray-900' : 'text-gray-400'
                          }`}>
                            {date.getDate()}
                          </div>
                          <div className="space-y-1 max-h-[100px] overflow-y-auto">
                            {tasks.slice(0, 4).map(task => (
                              <div
                                key={task.id}
                                className={`text-xs p-1 rounded cursor-pointer ${
                                  statusConfig[task.status as keyof typeof statusConfig]?.color || 'bg-gray-100'
                                } ${canEditTask(task.exe_date) ? 'hover:bg-opacity-80' : ''}`}
                                onClick={() => canEditTask(task.exe_date) && handleEditTask(task)}
                                title={task.content}
                              >
                                <div className="truncate font-medium">{task.content}</div>
                                <div className="text-xs opacity-75 mt-1">
                                  {priorityConfig[task.priority as keyof typeof priorityConfig]?.icon} {task.start_time}
                                </div>
                              </div>
                            ))}
                            {tasks.length > 4 && (
                              <div className="text-xs text-gray-500 text-center">
                                +{tasks.length - 4} more
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {calendarView === 'week' && (
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  {/* 星期标题 */}
                  <div className="grid grid-cols-7 bg-gray-50 border-b border-gray-200">
                    {getWeekDays(currentDate).map(date => (
                      <div key={date.toDateString()} className="p-3 text-center">
                        <div className="text-sm font-medium text-gray-600">
                          {date.toLocaleDateString('en-US', { weekday: 'short' })}
                        </div>
                        <div className={`text-lg font-bold ${
                          date.toDateString() === new Date().toDateString() ? 'text-blue-600' : 'text-gray-900'
                        }`}>
                          {date.getDate()}
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* 周视图内容 */}
                  <div className="grid grid-cols-7 min-h-[500px]">
                    {getWeekDays(currentDate).map(date => {
                      const tasks = getTasksForDate(date);
                      const isToday = date.toDateString() === new Date().toDateString();
                      
                      return (
                        <div
                          key={date.toDateString()}
                          className={`p-3 border-r border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors ${
                            isToday ? 'bg-blue-50' : 'bg-white'
                          }`}
                          onClick={() => handleDateClick(date)}
                        >
                          <div className="space-y-2 max-h-[450px] overflow-y-auto">
                            {tasks.map(task => (
                              <div
                                key={task.id}
                                className={`p-2 rounded text-sm cursor-pointer ${
                                  statusConfig[task.status as keyof typeof statusConfig]?.color || 'bg-gray-100'
                                } ${canEditTask(task.exe_date) ? 'hover:bg-opacity-80' : ''}`}
                                onClick={() => canEditTask(task.exe_date) && handleEditTask(task)}
                              >
                                <div className="flex items-center space-x-1 mb-1">
                                  <span className="text-xs">{priorityConfig[task.priority as keyof typeof priorityConfig]?.icon}</span>
                                  <div className="font-medium truncate flex-1">{task.content}</div>
                                </div>
                                <div className="text-xs opacity-75">{task.start_time} - {task.end_time}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {calendarView === 'day' && (
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <div className="space-y-4">
                    {getTasksForDate(currentDate).map(task => (
                      <div
                        key={task.id}
                        className={`p-4 rounded-lg border ${
                          statusConfig[task.status as keyof typeof statusConfig]?.color || 'bg-gray-100 border-gray-200'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-3">
                            <span className="text-sm">{priorityConfig[task.priority as keyof typeof priorityConfig].icon}</span>
                            <div className={`px-2 py-1 rounded text-xs font-medium ${priorityConfig[task.priority as keyof typeof priorityConfig].color}`}>
                              {priorityConfig[task.priority as keyof typeof priorityConfig].label}
                            </div>
                            <div className={`px-2 py-1 rounded text-xs font-medium ${statusConfig[task.status as keyof typeof statusConfig]?.color || 'bg-gray-100 text-gray-800'}`}>
                              {statusConfig[task.status as keyof typeof statusConfig]?.label || task.status}
                            </div>
                          </div>
                          <div className="text-sm text-gray-500">
                            {task.start_time} - {task.end_time}
                          </div>
                        </div>
                        <div className="font-medium text-gray-900 mb-2">{task.content}</div>
                        {task.note && (
                          <div className="text-sm text-gray-600 mb-2">{task.note}</div>
                        )}
                        {canEditTask(task.exe_date) && (
                          <button
                            onClick={() => handleEditTask(task)}
                            className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors"
                          >
                            Edit Task
                          </button>
                        )}
                      </div>
                    ))}
                    {getTasksForDate(currentDate).length === 0 && (
                      <div className="text-center text-gray-500 py-8">
                        <div className="text-2xl mb-2">📅</div>
                        <div>No tasks scheduled for this day</div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {view === 'progress' && (
            <div className="p-6">
              <div className="bg-white rounded-xl p-6 border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">Progress Overview</h3>
                
                {/* 进度统计 */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-600 mb-1">{progressStats.completed}</div>
                    <div className="text-sm text-gray-600">Completed</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-gray-600 mb-1">{progressStats.total - progressStats.completed}</div>
                    <div className="text-sm text-gray-600">Remaining</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-600 mb-1">{progressStats.percentage}%</div>
                    <div className="text-sm text-gray-600">Progress</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-orange-600 mb-1">{upcomingTasks.length}</div>
                    <div className="text-sm text-gray-600">Upcoming</div>
                  </div>
                </div>

                {/* 进度条 */}
                <div className="mb-8">
                  <div className="flex justify-between text-sm text-gray-600 mb-3">
                    <span>Overall Progress</span>
                    <span>{progressStats.percentage}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-4">
                    <div
                      className="bg-gradient-to-r from-blue-500 to-purple-500 h-4 rounded-full transition-all"
                      style={{ width: `${progressStats.percentage}%` }}
                    ></div>
                  </div>
                </div>

                {/* 状态分布 */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-green-50 rounded-xl p-4 border border-green-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-2xl font-bold text-green-800">
                          {learningGoal.tasks?.filter(t => t.status === 'done').length || 0}
                        </div>
                        <div className="text-sm text-green-600">Completed</div>
                      </div>
                      <FaCheck className="text-green-600" size={28} />
                    </div>
                  </div>
                  <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-2xl font-bold text-blue-800">
                          {learningGoal.tasks?.filter(t => t.status !== 'done').length || 0}
                        </div>
                        <div className="text-sm text-blue-600">In Progress</div>
                      </div>
                      <FaPlay className="text-blue-600" size={28} />
                    </div>
                  </div>
                  <div className="bg-orange-50 rounded-xl p-4 border border-orange-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-2xl font-bold text-orange-800">
                          {overdueTasks.length}
                        </div>
                        <div className="text-sm text-orange-600">Overdue</div>
                      </div>
                      <FaPause className="text-orange-600" size={28} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {view === 'courses' && (
            <div className="p-6">
              <div className="mb-6">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">🎯 Personalized Course Recommendations</h3>
                <div className="flex items-center space-x-2 mb-4">
                  <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">AI-Powered</span>
                  <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-xs font-medium">Personalized</span>
                </div>
                
                {/* 智能学习路径信息框 */}
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-semibold text-blue-900 mb-1">Smart Learning Path</h4>
                      <p className="text-sm text-blue-700">
                        Our AI analyzes your assessment results to recommend courses tailored to your unique needs and goals.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* 课程列表 */}
              {coursesLoading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading personalized recommendations...</p>
                </div>
              ) : recommendedCourses.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {recommendedCourses.map((course) => (
                    <div key={course.id} className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 border border-gray-200 overflow-hidden">
                      {/* 课程图片 */}
                      {course.course_picture && (
                        <div className="relative h-48 bg-gradient-to-br from-blue-500 to-purple-600 rounded-t-xl overflow-hidden">
                          <img 
                            src={course.course_picture} 
                            alt={course.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                          <div className="absolute top-3 right-3">
                            <div className="bg-white bg-opacity-90 backdrop-blur-sm px-2 py-1 rounded-full text-xs font-medium text-gray-700">
                              Level {course.level}
                            </div>
                          </div>
                          <div className="absolute bottom-3 left-3">
                            <div className="bg-black bg-opacity-50 backdrop-blur-sm px-2 py-1 rounded-full text-xs font-medium text-white">
                              {course.duration} weeks
                            </div>
                          </div>
                        </div>
                      )}
                      
                      <div className="p-5">
                        {/* 课程标题和描述 */}
                        <div className="mb-4">
                          <h4 className="font-bold text-gray-900 text-lg mb-2 line-clamp-2 leading-tight">{course.name}</h4>
                          <p className="text-sm text-gray-600 line-clamp-3 leading-relaxed">{course.introduction}</p>
                        </div>
                        
                        {/* 课程目标 */}
                        <div className="mb-4">
                          <div className="flex items-center">
                            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                              🎯
                            </div>
                            <div className="ml-3">
                              <p className="text-sm font-medium text-gray-900">Course Goal</p>
                              <p className="text-xs text-gray-500">{course.goal}</p>
                            </div>
                          </div>
                        </div>
                        
                        {/* 课程信息 */}
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center space-x-4">
                            <div className="flex items-center text-gray-500">
                              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <span className="text-sm">{course.session_number} sessions</span>
                            </div>
                            <div className="flex items-center text-gray-500">
                              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                              </svg>
                              <span className="text-sm">{course.language}</span>
                            </div>
                          </div>
                        </div>
                        
                        {/* 价格和按钮 */}
                        <div className="flex items-center justify-between">
                          <div className="text-right">
                            <div className="text-2xl font-bold text-green-600">${parseFloat(course.display_price)}</div>
                            <div className="text-xs text-gray-500">One-time payment</div>
                          </div>
                          <button 
                            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-2 px-6 rounded-lg text-sm font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-200 transform hover:scale-105 shadow-md"
                            onClick={() => {
                              window.open(`/courses/${course.id}`, '_blank');
                            }}
                          >
                            Enroll Now
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-gray-500 py-8">
                  <div className="text-2xl mb-2">📚</div>
                  <div>No recommended courses available at the moment</div>
                  <p className="text-sm mt-1">Complete your assessment to get personalized course recommendations</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 任务编辑模态框 */}
      {showEditModal && editingTask && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-t-xl">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Edit Task</h3>
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingTask(null);
                  }}
                  className="text-white hover:text-blue-100 transition-colors"
                >
                  <FaTimes size={20} />
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Task Content</label>
                <div className="p-3 bg-gray-50 rounded-lg text-gray-900">
                  {editingTask.content}
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
                <div className="p-3 bg-gray-50 rounded-lg text-gray-900">
                  {new Date(editingTask.exe_date).toLocaleDateString()}
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(statusConfig).map(([value, config]) => (
                    <button
                      key={value}
                      onClick={() => setEditingTask({ ...editingTask, status: value })}
                      className={`p-3 rounded-lg border-2 text-left transition-all ${
                        editingTask.status === value
                          ? `${config.color} border-blue-500`
                          : 'bg-white border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="font-medium text-sm">{config.label}</div>
                      <div className="text-xs opacity-75 mt-1">
                        {value === '00' && 'Task has been created'}
                        {value === '10' && 'Task is currently in progress'}
                        {value === '20' && 'Task was not completed'}
                        {value === '50' && 'Task is fully completed'}
                        {value === '51' && 'Task is partially completed (few items)'}
                        {value === '52' && 'Task is mostly completed'}
                        {value === '53' && 'Task is partially completed'}
                        {value === '54' && 'Task was completed recently'}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Note <span className="text-gray-500">(Optional)</span>
                </label>
                <textarea
                  value={editingTask.note || ''}
                  onChange={(e) => {
                    const value = e.target.value.slice(0, 50); // 限制50字
                    setEditingTask({ ...editingTask, note: value });
                  }}
                  placeholder="Add notes about task completion, difficulties encountered, or any other relevant information..."
                  rows={3}
                  maxLength={50}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
                <div className="text-xs text-gray-500 mt-1 text-right">
                  {(editingTask.note || '').length}/50 characters
                </div>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingTask(null);
                  }}
                  disabled={isSaving}
                  className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  onClick={() => updateTaskStatus(editingTask.id, editingTask.status, editingTask.note)}
                  disabled={isSaving}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {isSaving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Saving...
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 任务列表模态框 */}
      {showTaskListModal && selectedDate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-t-xl">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">
                  Tasks for {selectedDate.toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </h3>
                <button
                  onClick={() => {
                    setShowTaskListModal(false);
                    setSelectedDate(null);
                  }}
                  className="text-white hover:text-blue-100 transition-colors"
                >
                  <FaTimes size={20} />
                </button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto max-h-[calc(80vh-120px)] relative">

              <div className="space-y-4">
                                  {getTasksForDate(selectedDate).map(task => (
                    <div
                      key={task.id}
                      className={`p-4 rounded-lg border ${
                        statusConfig[task.status as keyof typeof statusConfig]?.color || 'bg-gray-100 border-gray-200'
                      }`}
                    >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <span className="text-sm">{priorityConfig[task.priority as keyof typeof priorityConfig].icon}</span>
                        <div className={`px-2 py-1 rounded text-xs font-medium ${priorityConfig[task.priority as keyof typeof priorityConfig].color}`}>
                          {priorityConfig[task.priority as keyof typeof priorityConfig].label}
                        </div>
                        <div className={`px-2 py-1 rounded text-xs font-medium ${statusConfig[task.status as keyof typeof statusConfig]?.color || 'bg-gray-100 text-gray-800'}`}>
                          {statusConfig[task.status as keyof typeof statusConfig]?.label || task.status}
                        </div>
                      </div>
                      <div className="text-sm text-gray-500">
                        {task.start_time} - {task.end_time}
                      </div>
                    </div>
                    
                    <div className="font-medium text-gray-900 mb-3">{task.content}</div>
                    
                    {/* 可编辑的笔记区域 */}
                    <div className="mb-3">
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-sm font-medium text-gray-700">Note:</label>
                        <span className="text-xs text-gray-500">
                          {(task.note || '').length}/50
                        </span>
                      </div>
                      <textarea
                        value={task.note || ''}
                        onChange={(e) => {
                          const value = e.target.value.slice(0, 50); // 限制50字
                          // 直接更新本地状态，不立即调用API
                          if (learningGoal) {
                            const updatedTasks = learningGoal.tasks.map(t => 
                              t.id === task.id ? { ...t, note: value } : t
                            );
                            setLearningGoal({ ...learningGoal, tasks: updatedTasks });
                          }
                        }}
                        onBlur={(e) => {
                          // 失去焦点时才调用API保存
                          const value = e.target.value.slice(0, 50);
                          updateTaskStatus(task.id, task.status, value);
                        }}
                        placeholder="Add a note for this task..."
                        rows={2}
                        maxLength={50}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-sm"
                      />
                    </div>
                    
                    {canEditTask(task.exe_date) && (
                      <div className="flex space-x-2">
                        {/* 状态选择器 */}
                        <div className="relative group">
                          <button
                            className="px-3 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-700 transition-colors flex items-center space-x-1"
                                                    onClick={() => {
                          const currentStatus = task.status;
                          const statusEntries = Object.entries(statusConfig);
                          const currentIndex = statusEntries.findIndex(([value]) => value === currentStatus);
                          const nextIndex = (currentIndex + 1) % statusEntries.length;
                          const nextStatus = statusEntries[nextIndex][0];
                          // 获取最新的note值
                          const currentTask = learningGoal?.tasks.find(t => t.id === task.id);
                          updateTaskStatus(task.id, nextStatus, currentTask?.note || task.note);
                        }}
                            onMouseEnter={(e) => {
                              const button = e.currentTarget;
                              const rect = button.getBoundingClientRect();
                              const dropdown = button.parentElement?.querySelector('.status-dropdown') as HTMLElement;
                              if (dropdown) {
                                // 计算下拉菜单位置
                                const spaceBelow = window.innerHeight - rect.bottom;
                                const spaceAbove = rect.top;
                                const dropdownHeight = 320; // 估算下拉菜单高度
                                
                                if (spaceBelow >= dropdownHeight || spaceBelow > spaceAbove) {
                                  // 向下展开
                                  dropdown.style.top = `${rect.bottom + 4}px`;
                                  dropdown.style.left = `${rect.left}px`;
                                } else {
                                  // 向上展开
                                  dropdown.style.bottom = `${window.innerHeight - rect.top + 4}px`;
                                  dropdown.style.left = `${rect.left}px`;
                                }
                              }
                            }}
                          >
                            <span>{statusConfig[task.status as keyof typeof statusConfig]?.label || task.status}</span>
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </button>
                          
                          {/* 状态选择下拉菜单 */}
                          <div className="status-dropdown fixed w-48 bg-white border border-gray-200 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                            {Object.entries(statusConfig).map(([value, config]) => (
                              <button
                                key={value}
                                onClick={() => {
                                  // 获取最新的note值
                                  const currentTask = learningGoal?.tasks.find(t => t.id === task.id);
                                  updateTaskStatus(task.id, value, currentTask?.note || task.note);
                                }}
                                className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 transition-colors ${
                                  task.status === value ? 'bg-blue-50 text-blue-600' : 'text-gray-700'
                                } ${value === '00' ? 'rounded-t-lg' : ''} ${value === '54' ? 'rounded-b-lg' : ''}`}
                              >
                                <div className="font-medium">{config.label}</div>
                                <div className="text-xs opacity-75 mt-1">
                                  {value === '00' && 'Task has been created'}
                                  {value === '10' && 'Task is currently in progress'}
                                  {value === '20' && 'Task was not completed'}
                                  {value === '50' && 'Task is fully completed'}
                                  {value === '51' && 'Task is partially completed (few items)'}
                                  {value === '52' && 'Task is mostly completed'}
                                  {value === '53' && 'Task is partially completed'}
                                  {value === '54' && 'Task was completed recently'}
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* 快速完成按钮 */}
                        {task.status !== '50' && (
                          <button
                            onClick={() => handleQuickComplete(task)}
                            className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 transition-colors"
                          >
                            Complete
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
              
              {getTasksForDate(selectedDate).length === 0 && (
                <div className="text-center text-gray-500 py-8">
                  <div className="text-2xl mb-2">📅</div>
                  <div>No tasks scheduled for this day</div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
} 