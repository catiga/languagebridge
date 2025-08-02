'use client';

import React, { useState, useEffect } from 'react';
import { apiClient } from '../../../../utils/api';
import { toast } from 'react-toastify';
import { 
  FaCalendarAlt, 
  FaClock, 
  FaCheck, 
  FaTimes, 
  FaEdit, 
  FaPlus, 
  FaTrash,
  FaFlag,
  FaChartLine,
  FaPlay,
  FaPause,
  FaStop,
  FaEye,
  FaEyeSlash,
  FaFilter,
  FaSort,
  FaDownload,
  FaShare,
  FaBookmark,
  FaStar,
  FaChartBar
} from 'react-icons/fa';
import TaskEditModal from './TaskEditModal';
import StudyPlanStats from './StudyPlanStats';

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
  tasks: Task[];
  goal_period_type: string;
  target_level: number;
  init_level: number;
  status: string;
  quizs: Quiz[];
}

interface StudyPlanManagerProps {
  studentId: number;
  studentName: string;
  onClose: () => void;
}

const priorityColors = {
  1: 'bg-red-100 text-red-800 border-red-200',
  2: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  3: 'bg-green-100 text-green-800 border-green-200'
};

const priorityLabels = {
  1: 'High',
  2: 'Medium', 
  3: 'Low'
};

const statusColors = {
  '00': 'bg-gray-100 text-gray-800',
  '01': 'bg-red-100 text-red-800',
  '02': 'bg-orange-100 text-orange-800',
  '05': 'bg-yellow-100 text-yellow-800',
  '06': 'bg-green-100 text-green-800',
  '10': 'bg-blue-100 text-blue-800',
  '20': 'bg-green-100 text-green-800'
};

const statusLabels = {
  '00': 'Not Started',
  '01': 'Assessment Error',
  '02': 'Waiting AI Assessment',
  '05': 'AI Processing',
  '06': 'Assessment Complete',
  '10': 'In Progress',
  '20': 'Finished'
};

const taskStatusColors = {
  '00': 'bg-gray-100 text-gray-800',
  'done': 'bg-green-100 text-green-800',
  'partial': 'bg-yellow-100 text-yellow-800',
  'little': 'bg-orange-100 text-orange-800',
  'not_done': 'bg-red-100 text-red-800'
};

const taskStatusLabels = {
  '00': 'Not Started',
  'done': 'Completed',
  'partial': 'Partially Done',
  'little': 'Little Done',
  'not_done': 'Not Done'
};

export default function StudyPlanManager({ studentId, studentName, onClose }: StudyPlanManagerProps) {
  const [learningGoal, setLearningGoal] = useState<LearningGoal | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'tasks' | 'progress' | 'assessment' | 'stats'>('overview');
  const [viewMode, setViewMode] = useState<'calendar' | 'list' | 'kanban'>('calendar');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date' | 'priority' | 'status'>('date');
  const [showCompleted, setShowCompleted] = useState(true);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [showAddTask, setShowAddTask] = useState(false);

  useEffect(() => {
    fetchStudyPlan();
  }, [studentId]);

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

  const updateTaskStatus = async (taskId: number, newStatus: string) => {
    try {
      const response = await apiClient.post('/spwapi/auth/planner/task/update', {
        task_id: taskId,
        status: newStatus
      }) as any;
      
      if (response && response.code === 0) {
        toast.success('Task status updated successfully');
        fetchStudyPlan(); // 刷新数据
      } else {
        toast.error(response?.msg || 'Failed to update task status');
      }
    } catch (error) {
      console.error('Failed to update task status:', error);
      toast.error('Failed to update task status');
    }
  };

  const deleteTask = async (taskId: number) => {
    if (!confirm('Are you sure you want to delete this task?')) return;
    
    try {
      const response = await apiClient.post('/spwapi/auth/planner/task/delete', {
        task_id: taskId
      }) as any;
      
      if (response && response.code === 0) {
        toast.success('Task deleted successfully');
        fetchStudyPlan(); // 刷新数据
      } else {
        toast.error(response?.msg || 'Failed to delete task');
      }
    } catch (error) {
      console.error('Failed to delete task:', error);
      toast.error('Failed to delete task');
    }
  };

  const getFilteredTasks = () => {
    if (!learningGoal?.tasks) return [];
    
    let filtered = learningGoal.tasks;
    
    // 状态过滤
    if (filterStatus !== 'all') {
      filtered = filtered.filter(task => task.status === filterStatus);
    }
    
    // 优先级过滤
    if (filterPriority !== 'all') {
      filtered = filtered.filter(task => task.priority === parseInt(filterPriority));
    }
    
    // 完成状态过滤
    if (!showCompleted) {
      filtered = filtered.filter(task => task.status !== 'done');
    }
    
    // 排序
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'date':
          return new Date(a.exe_date).getTime() - new Date(b.exe_date).getTime();
        case 'priority':
          return a.priority - b.priority;
        case 'status':
          return a.status.localeCompare(b.status);
        default:
          return 0;
      }
    });
    
    return filtered;
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
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return learningGoal.tasks
      .filter(task => {
        const taskDate = new Date(task.exe_date);
        return taskDate >= today && task.status !== 'done';
      })
      .sort((a, b) => new Date(a.exe_date).getTime() - new Date(b.exe_date).getTime())
      .slice(0, 5);
  };

  const getOverdueTasks = () => {
    if (!learningGoal?.tasks) return [];
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return learningGoal.tasks
      .filter(task => {
        const taskDate = new Date(task.exe_date);
        return taskDate < today && task.status !== 'done';
      })
      .sort((a, b) => new Date(a.exe_date).getTime() - new Date(b.exe_date).getTime());
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h3 className="text-lg font-semibold text-center">Loading Study Plan</h3>
          <p className="text-gray-600 text-center">Please wait...</p>
        </div>
      </div>
    );
  }

  if (!learningGoal) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
          <div className="text-center">
            <div className="text-4xl mb-4">📚</div>
            <h3 className="text-lg font-semibold mb-2">No Study Plan Found</h3>
            <p className="text-gray-600 mb-4">
              No active study plan found for {studentName}. Please create a study plan first.
            </p>
            <button
              onClick={onClose}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  const progressStats = getProgressStats();
  const upcomingTasks = getUpcomingTasks();
  const overdueTasks = getOverdueTasks();
  const filteredTasks = getFilteredTasks();

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-xl max-w-7xl w-full mx-4 max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">Study Plan Manager</h2>
                <p className="text-blue-100">{studentName} • {learningGoal.title}</p>
              </div>
              <button
                onClick={onClose}
                className="text-white hover:text-blue-100 transition-colors"
              >
                <FaTimes size={24} />
              </button>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="border-b border-gray-200">
            <div className="flex space-x-8 px-6">
              {[
                { key: 'overview', label: 'Overview', icon: FaChartLine },
                { key: 'tasks', label: 'Tasks', icon: FaCalendarAlt },
                { key: 'progress', label: 'Progress', icon: FaFlag },
                { key: 'stats', label: 'Statistics', icon: FaChartBar },
                { key: 'assessment', label: 'Assessment', icon: FaStar }
              ].map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => setActiveTab(key as any)}
                  className={`flex items-center space-x-2 py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === key
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Icon size={16} />
                  <span>{label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="overflow-y-auto max-h-[calc(90vh-140px)]">
            {activeTab === 'overview' && (
              <div className="p-6 space-y-6">
                {/* Goal Information */}
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-semibold text-gray-900">Learning Goal</h3>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusColors[learningGoal.status as keyof typeof statusColors]}`}>
                      {statusLabels[learningGoal.status as keyof typeof statusLabels]}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">{learningGoal.title}</h4>
                      <p className="text-gray-600 text-sm mb-4">{learningGoal.description}</p>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Start Date:</span>
                          <span className="font-medium">{new Date(learningGoal.start_date).toLocaleDateString()}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">End Date:</span>
                          <span className="font-medium">{new Date(learningGoal.end_date).toLocaleDateString()}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Target Level:</span>
                          <span className="font-medium">Level {learningGoal.target_level}</span>
                        </div>
                      </div>
                    </div>
                    <div>
                      <div className="mb-4">
                        <div className="flex justify-between text-sm text-gray-600 mb-1">
                          <span>Overall Progress</span>
                          <span>{progressStats.percentage}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3">
                          <div
                            className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full transition-all"
                            style={{ width: `${progressStats.percentage}%` }}
                          ></div>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-center">
                        <div className="bg-white rounded-lg p-3">
                          <div className="text-2xl font-bold text-blue-600">{progressStats.completed}</div>
                          <div className="text-xs text-gray-600">Completed</div>
                        </div>
                        <div className="bg-white rounded-lg p-3">
                          <div className="text-2xl font-bold text-purple-600">{progressStats.total}</div>
                          <div className="text-xs text-gray-600">Total Tasks</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-semibold text-gray-900">Upcoming Tasks</h4>
                      <FaClock className="text-blue-500" />
                    </div>
                    <div className="space-y-3">
                      {upcomingTasks.length > 0 ? (
                        upcomingTasks.map((task) => (
                          <div key={task.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-900 truncate">{task.content}</p>
                              <p className="text-xs text-gray-500">{new Date(task.exe_date).toLocaleDateString()}</p>
                            </div>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${priorityColors[task.priority as keyof typeof priorityColors]}`}>
                              {priorityLabels[task.priority as keyof typeof priorityLabels]}
                            </span>
                          </div>
                        ))
                      ) : (
                        <p className="text-gray-500 text-sm">No upcoming tasks</p>
                      )}
                    </div>
                  </div>

                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-semibold text-gray-900">Overdue Tasks</h4>
                      <FaTimes className="text-red-500" />
                    </div>
                    <div className="space-y-3">
                      {overdueTasks.length > 0 ? (
                        overdueTasks.map((task) => (
                          <div key={task.id} className="flex items-center justify-between p-3 bg-red-50 rounded">
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-900 truncate">{task.content}</p>
                              <p className="text-xs text-red-500">{new Date(task.exe_date).toLocaleDateString()}</p>
                            </div>
                            <button
                              onClick={() => updateTaskStatus(task.id, 'done')}
                              className="px-2 py-1 bg-green-500 text-white rounded text-xs hover:bg-green-600"
                            >
                              Complete
                            </button>
                          </div>
                        ))
                      ) : (
                        <p className="text-gray-500 text-sm">No overdue tasks</p>
                      )}
                    </div>
                  </div>

                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-semibold text-gray-900">Recent Assessment</h4>
                      <FaStar className="text-yellow-500" />
                    </div>
                    {learningGoal.quizs && learningGoal.quizs.length > 0 ? (
                      <div className="space-y-3">
                        {learningGoal.quizs.slice(-1).map((quiz, index) => (
                          <div key={index} className="text-center">
                            <div className="text-3xl font-bold text-blue-600 mb-2">{quiz.score}%</div>
                            <p className="text-sm text-gray-600">
                              {new Date(quiz.add_time).toLocaleDateString()}
                            </p>
                            <button className="mt-2 text-blue-600 text-sm hover:underline">
                              View Details
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-sm">No assessment records</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'tasks' && (
              <div className="p-6">
                {/* Task Controls */}
                <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                  <div className="flex items-center space-x-4">
                    <select
                      value={viewMode}
                      onChange={(e) => setViewMode(e.target.value as any)}
                      className="border border-gray-300 rounded px-3 py-2 text-sm"
                    >
                      <option value="calendar">Calendar View</option>
                      <option value="list">List View</option>
                      <option value="kanban">Kanban View</option>
                    </select>
                    
                    <select
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value)}
                      className="border border-gray-300 rounded px-3 py-2 text-sm"
                    >
                      <option value="all">All Status</option>
                      <option value="00">Not Started</option>
                      <option value="done">Completed</option>
                      <option value="partial">Partially Done</option>
                      <option value="little">Little Done</option>
                      <option value="not_done">Not Done</option>
                    </select>
                    
                    <select
                      value={filterPriority}
                      onChange={(e) => setFilterPriority(e.target.value)}
                      className="border border-gray-300 rounded px-3 py-2 text-sm"
                    >
                      <option value="all">All Priorities</option>
                      <option value="1">High Priority</option>
                      <option value="2">Medium Priority</option>
                      <option value="3">Low Priority</option>
                    </select>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <label className="flex items-center space-x-2 text-sm">
                      <input
                        type="checkbox"
                        checked={showCompleted}
                        onChange={(e) => setShowCompleted(e.target.checked)}
                        className="rounded"
                      />
                      <span>Show Completed</span>
                    </label>
                    
                    <button
                      onClick={() => setShowAddTask(true)}
                      className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700 flex items-center space-x-2"
                    >
                      <FaPlus size={14} />
                      <span>Add Task</span>
                    </button>
                  </div>
                </div>

                {/* Task List */}
                <div className="space-y-4">
                  {filteredTasks.map((task) => (
                    <div
                      key={task.id}
                      className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${priorityColors[task.priority as keyof typeof priorityColors]}`}>
                              {priorityLabels[task.priority as keyof typeof priorityLabels]}
                            </span>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${taskStatusColors[task.status as keyof typeof taskStatusColors]}`}>
                              {taskStatusLabels[task.status as keyof typeof taskStatusLabels]}
                            </span>
                            <span className="text-sm text-gray-500">
                              {new Date(task.exe_date).toLocaleDateString()} • {task.start_time}-{task.end_time}
                            </span>
                          </div>
                          <h4 className="font-medium text-gray-900 mb-1">{task.content}</h4>
                          {task.note && (
                            <p className="text-sm text-gray-600 mb-3">{task.note}</p>
                          )}
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => updateTaskStatus(task.id, 'done')}
                            className="p-2 text-green-600 hover:bg-green-50 rounded"
                            title="Mark as completed"
                          >
                            <FaCheck size={16} />
                          </button>
                          <button
                            onClick={() => setEditingTask(task)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                            title="Edit task"
                          >
                            <FaEdit size={16} />
                          </button>
                          <button
                            onClick={() => deleteTask(task.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded"
                            title="Delete task"
                          >
                            <FaTrash size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {filteredTasks.length === 0 && (
                    <div className="text-center py-8">
                      <div className="text-4xl mb-4">📝</div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">No tasks found</h3>
                      <p className="text-gray-600">Try adjusting your filters or add a new task.</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'progress' && (
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Progress Chart */}
                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Progress Overview</h3>
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between text-sm text-gray-600 mb-1">
                          <span>Task Completion</span>
                          <span>{progressStats.percentage}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-4">
                          <div
                            className="bg-gradient-to-r from-blue-500 to-purple-500 h-4 rounded-full transition-all"
                            style={{ width: `${progressStats.percentage}%` }}
                          ></div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-4 text-center">
                        <div>
                          <div className="text-2xl font-bold text-blue-600">{progressStats.completed}</div>
                          <div className="text-xs text-gray-600">Completed</div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-yellow-600">{progressStats.total - progressStats.completed}</div>
                          <div className="text-xs text-gray-600">Remaining</div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-purple-600">{progressStats.total}</div>
                          <div className="text-xs text-gray-600">Total</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Weekly Progress */}
                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Weekly Progress</h3>
                    <div className="space-y-3">
                      {Array.from({ length: 7 }, (_, i) => {
                        const date = new Date();
                        date.setDate(date.getDate() - i);
                        const dayTasks = learningGoal.tasks?.filter(task => 
                          new Date(task.exe_date).toDateString() === date.toDateString()
                        ) || [];
                        const completedTasks = dayTasks.filter(task => task.status === 'done').length;
                        
                        return (
                          <div key={i} className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">
                              {date.toLocaleDateString('en-US', { weekday: 'short' })}
                            </span>
                            <div className="flex items-center space-x-2">
                              <div className="w-20 bg-gray-200 rounded-full h-2">
                                <div
                                  className="bg-green-500 h-2 rounded-full"
                                  style={{ width: `${dayTasks.length > 0 ? (completedTasks / dayTasks.length) * 100 : 0}%` }}
                                ></div>
                              </div>
                              <span className="text-xs text-gray-500">
                                {completedTasks}/{dayTasks.length}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'stats' && (
              <div className="p-6">
                <StudyPlanStats 
                  overviewId={learningGoal.id} 
                  studentName={studentName} 
                />
              </div>
            )}

            {activeTab === 'assessment' && (
              <div className="p-6">
                <div className="space-y-6">
                  {learningGoal.quizs && learningGoal.quizs.length > 0 ? (
                    learningGoal.quizs.map((quiz, index) => (
                      <div key={index} className="bg-white border border-gray-200 rounded-lg p-6">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-lg font-semibold text-gray-900">
                            Assessment #{learningGoal.quizs.length - index}
                          </h3>
                          <div className="flex items-center space-x-4">
                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                              parseInt(quiz.score) >= 70 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {quiz.score}%
                            </span>
                            <span className="text-sm text-gray-500">
                              {new Date(quiz.add_time).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <h4 className="font-medium text-gray-900 mb-2">Assessment Details</h4>
                            <div className="space-y-2 text-sm">
                              <div className="flex justify-between">
                                <span className="text-gray-600">Category:</span>
                                <span className="font-medium">{quiz.category_path}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Level:</span>
                                <span className="font-medium">{quiz.category_level}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Agent ID:</span>
                                <span className="font-medium">{quiz.agent_record_id}</span>
                              </div>
                            </div>
                          </div>
                          
                          <div>
                            <h4 className="font-medium text-gray-900 mb-2">Actions</h4>
                            <div className="space-y-2">
                              <button className="w-full bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700">
                                View Detailed Results
                              </button>
                              <button className="w-full bg-gray-100 text-gray-700 px-4 py-2 rounded text-sm hover:bg-gray-200">
                                Download Report
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <div className="text-4xl mb-4">📊</div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">No Assessment Records</h3>
                      <p className="text-gray-600">Complete an assessment to see your progress here.</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Task Edit Modal */}
      <TaskEditModal
        isOpen={showAddTask || !!editingTask}
        onClose={() => {
          setShowAddTask(false);
          setEditingTask(null);
        }}
        task={editingTask}
        studentId={studentId}
        onTaskSaved={fetchStudyPlan}
      />
    </>
  );
} 