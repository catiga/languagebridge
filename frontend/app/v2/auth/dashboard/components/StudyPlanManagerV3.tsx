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
  FaList
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

export default function StudyPlanManagerV3({ studentId, studentName, onClose }: StudyPlanManagerV3Props) {
  const [learningGoal, setLearningGoal] = useState<LearningGoal | null>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'summary' | 'tasks' | 'progress'>('summary');

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
        toast.success('Task completed!');
        fetchStudyPlan();
      } else {
        toast.error(response?.msg || 'Failed to update task');
      }
    } catch (error) {
      console.error('Failed to update task status:', error);
      toast.error('Failed to update task');
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
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
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
          <div className="flex space-x-1 bg-white rounded-lg p-1">
            {[
              { key: 'summary', label: 'Summary', icon: FaEye },
              { key: 'tasks', label: 'Tasks', icon: FaList },
              { key: 'progress', label: 'Progress', icon: FaChartBar }
            ].map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setView(key as any)}
                className={`flex-1 flex items-center justify-center space-x-2 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                  view === key
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Icon size={14} />
                <span>{label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 内容区域 */}
        <div className="overflow-y-auto max-h-[calc(90vh-140px)]">
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
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">All Tasks</h3>
                <div className="space-y-3">
                  {learningGoal.tasks?.map((task) => (
                    <div
                      key={task.id}
                      className={`flex items-center justify-between p-4 rounded-xl border transition-all ${
                        task.status === 'done' 
                          ? 'bg-green-50 border-green-200' 
                          : 'bg-white border-gray-200 hover:shadow-md'
                      }`}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-3 mb-2">
                          <span className="text-sm">{priorityConfig[task.priority as keyof typeof priorityConfig].icon}</span>
                          <div className={`px-2 py-1 rounded text-xs font-medium ${priorityConfig[task.priority as keyof typeof priorityConfig].color}`}>
                            {priorityConfig[task.priority as keyof typeof priorityConfig].label}
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
                        {task.status !== 'done' && (
                          <button
                            onClick={() => updateTaskStatus(task.id, 'done')}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                          >
                            <FaCheck size={16} />
                          </button>
                        )}
                        {task.status === 'done' && (
                          <div className="text-green-600 p-2">
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
        </div>
      </div>
    </div>
  );
} 