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
  FaStop
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

interface StudyPlanManagerV2Props {
  studentId: number;
  studentName: string;
  onClose: () => void;
}

const priorityColors = {
  1: 'bg-red-100 text-red-800',
  2: 'bg-yellow-100 text-yellow-800',
  3: 'bg-green-100 text-green-800'
};

const priorityLabels = {
  1: 'High',
  2: 'Medium', 
  3: 'Low'
};

const statusColors = {
  '00': 'bg-gray-100 text-gray-800',
  '10': 'bg-blue-100 text-blue-800',
  '20': 'bg-green-100 text-green-800'
};

const statusLabels = {
  '00': 'Not Started',
  '10': 'In Progress',
  '20': 'Completed'
};

export default function StudyPlanManagerV2({ studentId, studentName, onClose }: StudyPlanManagerV2Props) {
  const [learningGoal, setLearningGoal] = useState<LearningGoal | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'tasks' | 'progress'>('overview');

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
        fetchStudyPlan();
      } else {
        toast.error(response?.msg || 'Failed to update task status');
      }
    } catch (error) {
      console.error('Failed to update task status:', error);
      toast.error('Failed to update task status');
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
      .slice(0, 5); // 只显示最近5个任务
  };

  const getOverdueTasks = () => {
    if (!learningGoal?.tasks) return [];
    
    const today = new Date().toISOString().split('T')[0];
    return learningGoal.tasks
      .filter(task => task.exe_date < today && task.status !== 'done')
      .sort((a, b) => new Date(a.exe_date).getTime() - new Date(b.exe_date).getTime());
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h3 className="text-lg font-semibold text-center">Loading Study Plan</h3>
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
              No active study plan found for {studentName}.
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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* 简化的头部 */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Study Plan</h2>
              <p className="text-blue-100">{studentName}</p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-blue-100 transition-colors"
            >
              <FaTimes size={24} />
            </button>
          </div>
        </div>

        {/* 简化的导航 */}
        <div className="border-b border-gray-200">
          <div className="flex space-x-8 px-6">
            {[
              { key: 'overview', label: 'Overview', icon: FaChartBar },
              { key: 'tasks', label: 'Tasks', icon: FaCalendarAlt },
              { key: 'progress', label: 'Progress', icon: FaStar }
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

        {/* 内容区域 */}
        <div className="overflow-y-auto max-h-[calc(90vh-140px)]">
          {activeTab === 'overview' && (
            <div className="p-6">
              {/* 学习目标卡片 */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 mb-6 border border-blue-200">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      {learningGoal.title}
                    </h3>
                    <p className="text-gray-600 mb-4">{learningGoal.description}</p>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Start:</span>
                        <div className="font-medium">{new Date(learningGoal.start_date).toLocaleDateString()}</div>
                      </div>
                      <div>
                        <span className="text-gray-500">End:</span>
                        <div className="font-medium">{new Date(learningGoal.end_date).toLocaleDateString()}</div>
                      </div>
                      <div>
                        <span className="text-gray-500">Target:</span>
                        <div className="font-medium">Level {learningGoal.target_level}</div>
                      </div>
                    </div>
                  </div>
                  <div className="text-right ml-6">
                    <div className="text-3xl font-bold text-blue-600 mb-1">
                      {progressStats.percentage}%
                    </div>
                    <div className="text-sm text-gray-500">Complete</div>
                    <div className="w-24 h-2 bg-gray-200 rounded-full mt-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full transition-all"
                        style={{ width: `${progressStats.percentage}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 快速统计 */}
              <div className="grid grid-cols-3 gap-6 mb-6">
                <div className="bg-white rounded-lg p-4 border border-gray-200 text-center">
                  <div className="text-2xl font-bold text-green-600">{progressStats.completed}</div>
                  <div className="text-sm text-gray-600">Completed Tasks</div>
                </div>
                <div className="bg-white rounded-lg p-4 border border-gray-200 text-center">
                  <div className="text-2xl font-bold text-blue-600">{progressStats.total}</div>
                  <div className="text-sm text-gray-600">Total Tasks</div>
                </div>
                <div className="bg-white rounded-lg p-4 border border-gray-200 text-center">
                  <div className="text-2xl font-bold text-orange-600">{upcomingTasks.length}</div>
                  <div className="text-sm text-gray-600">Upcoming</div>
                </div>
              </div>

              {/* 任务概览 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* 即将到来的任务 */}
                <div className="bg-white rounded-lg p-4 border border-gray-200">
                  <div className="flex items-center mb-4">
                    <FaClock className="text-blue-600 mr-2" />
                    <h4 className="font-semibold text-gray-900">Upcoming Tasks</h4>
                  </div>
                  <div className="space-y-3">
                    {upcomingTasks.length > 0 ? (
                      upcomingTasks.map((task) => (
                        <div key={task.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                          <div className="flex-1">
                            <div className="text-sm font-medium text-gray-900 truncate">
                              {task.content}
                            </div>
                            <div className="text-xs text-gray-500">
                              {new Date(task.exe_date).toLocaleDateString()}
                            </div>
                          </div>
                          <button
                            onClick={() => updateTaskStatus(task.id, 'done')}
                            className="ml-2 p-1 text-green-600 hover:bg-green-50 rounded"
                          >
                            <FaCheck size={14} />
                          </button>
                        </div>
                      ))
                    ) : (
                      <div className="text-center text-gray-500 py-4">
                        No upcoming tasks
                      </div>
                    )}
                  </div>
                </div>

                {/* 逾期任务 */}
                <div className="bg-white rounded-lg p-4 border border-gray-200">
                  <div className="flex items-center mb-4">
                    <FaTimes className="text-red-600 mr-2" />
                    <h4 className="font-semibold text-gray-900">Overdue Tasks</h4>
                  </div>
                  <div className="space-y-3">
                    {overdueTasks.length > 0 ? (
                      overdueTasks.map((task) => (
                        <div key={task.id} className="flex items-center justify-between p-3 bg-red-50 rounded">
                          <div className="flex-1">
                            <div className="text-sm font-medium text-gray-900 truncate">
                              {task.content}
                            </div>
                            <div className="text-xs text-red-500">
                              {new Date(task.exe_date).toLocaleDateString()}
                            </div>
                          </div>
                          <button
                            onClick={() => updateTaskStatus(task.id, 'done')}
                            className="ml-2 p-1 text-green-600 hover:bg-green-50 rounded"
                          >
                            <FaCheck size={14} />
                          </button>
                        </div>
                      ))
                    ) : (
                      <div className="text-center text-gray-500 py-4">
                        No overdue tasks
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'tasks' && (
            <div className="p-6">
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">All Tasks</h3>
                <div className="space-y-3">
                  {learningGoal.tasks?.map((task) => (
                    <div
                      key={task.id}
                      className={`flex items-center justify-between p-4 rounded-lg border ${
                        task.status === 'done' 
                          ? 'bg-green-50 border-green-200' 
                          : 'bg-white border-gray-200'
                      }`}
                    >
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <div className={`px-2 py-1 rounded text-xs font-medium ${priorityColors[task.priority as keyof typeof priorityColors]}`}>
                            {priorityLabels[task.priority as keyof typeof priorityLabels]}
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
                      <div className="flex items-center space-x-2">
                        {task.status !== 'done' && (
                          <button
                            onClick={() => updateTaskStatus(task.id, 'done')}
                            className="p-2 text-green-600 hover:bg-green-50 rounded"
                          >
                            <FaCheck size={16} />
                          </button>
                        )}
                        {task.status === 'done' && (
                          <div className="text-green-600">
                            <FaCheck size={16} />
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'progress' && (
            <div className="p-6">
              <div className="bg-white rounded-lg p-6 border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">Progress Overview</h3>
                
                {/* 进度统计 */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{progressStats.completed}</div>
                    <div className="text-sm text-gray-600">Completed</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-600">{progressStats.total - progressStats.completed}</div>
                    <div className="text-sm text-gray-600">Remaining</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{progressStats.percentage}%</div>
                    <div className="text-sm text-gray-600">Progress</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">{upcomingTasks.length}</div>
                    <div className="text-sm text-gray-600">Upcoming</div>
                  </div>
                </div>

                {/* 进度条 */}
                <div className="mb-6">
                  <div className="flex justify-between text-sm text-gray-600 mb-2">
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

                {/* 状态分布 */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-lg font-semibold text-green-800">
                          {learningGoal.tasks?.filter(t => t.status === 'done').length || 0}
                        </div>
                        <div className="text-sm text-green-600">Completed</div>
                      </div>
                      <FaCheck className="text-green-600" size={24} />
                    </div>
                  </div>
                  <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-lg font-semibold text-blue-800">
                          {learningGoal.tasks?.filter(t => t.status !== 'done').length || 0}
                        </div>
                        <div className="text-sm text-blue-600">In Progress</div>
                      </div>
                      <FaPlay className="text-blue-600" size={24} />
                    </div>
                  </div>
                  <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-lg font-semibold text-orange-800">
                          {overdueTasks.length}
                        </div>
                        <div className="text-sm text-orange-600">Overdue</div>
                      </div>
                      <FaPause className="text-orange-600" size={24} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 