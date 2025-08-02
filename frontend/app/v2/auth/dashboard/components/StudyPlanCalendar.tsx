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
  FaChevronLeft,
  FaChevronRight,
  FaList,
  FaCalendar,
  FaCalendarDay,
  FaEye,
  FaEyeSlash,
  FaFilter,
  FaSort,
  FaDownload,
  FaShare,
  FaBookmark,
  FaStar,
  FaFlag
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

interface StudyPlanCalendarProps {
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

type ViewMode = 'month' | 'week' | 'day';

export default function StudyPlanCalendar({ studentId, studentName, onClose }: StudyPlanCalendarProps) {
  const [learningGoal, setLearningGoal] = useState<LearningGoal | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showTaskDetails, setShowTaskDetails] = useState(false);
  const [selectedTasks, setSelectedTasks] = useState<Task[]>([]);
  const [showCompleted, setShowCompleted] = useState(true);

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

  const getTasksForDate = (date: Date): Task[] => {
    if (!learningGoal?.tasks) return [];
    
    const dateString = date.toISOString().split('T')[0];
    return learningGoal.tasks.filter(task => 
      task.exe_date.startsWith(dateString)
    );
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

  const handleDateClick = (date: Date) => {
    const tasks = getTasksForDate(date);
    setSelectedDate(date);
    setSelectedTasks(tasks);
    setShowTaskDetails(true);
  };

  const navigateDate = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    
    switch (viewMode) {
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

  const getProgressStats = () => {
    if (!learningGoal?.tasks) return { completed: 0, total: 0, percentage: 0 };
    
    const total = learningGoal.tasks.length;
    const completed = learningGoal.tasks.filter(task => task.status === 'done').length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    
    return { completed, total, percentage };
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
  const days = viewMode === 'month' 
    ? getMonthDays(currentDate) 
    : viewMode === 'week' 
    ? getWeekDays(currentDate) 
    : [currentDate];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-7xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div>
                <h2 className="text-2xl font-bold">Study Plan Calendar</h2>
                <p className="text-blue-100">{studentName} • {learningGoal.title}</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 bg-white bg-opacity-20 rounded-lg p-2">
                <button
                  onClick={() => setViewMode('month')}
                  className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                    viewMode === 'month' ? 'bg-white text-blue-600' : 'text-white hover:bg-white hover:bg-opacity-20'
                  }`}
                >
                  <FaCalendar className="inline mr-1" />
                  Month
                </button>
                <button
                  onClick={() => setViewMode('week')}
                  className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                    viewMode === 'week' ? 'bg-white text-blue-600' : 'text-white hover:bg-white hover:bg-opacity-20'
                  }`}
                >
                  <FaCalendar className="inline mr-1" />
                  Week
                </button>
                <button
                  onClick={() => setViewMode('day')}
                  className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                    viewMode === 'day' ? 'bg-white text-blue-600' : 'text-white hover:bg-white hover:bg-opacity-20'
                  }`}
                >
                  <FaCalendarDay className="inline mr-1" />
                  Day
                </button>
              </div>
              <button
                onClick={onClose}
                className="text-white hover:text-blue-100 transition-colors"
              >
                <FaTimes size={24} />
              </button>
            </div>
          </div>
        </div>

        {/* Calendar Controls */}
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigateDate('prev')}
                className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded"
              >
                <FaChevronLeft size={16} />
              </button>
              <h3 className="text-lg font-semibold text-gray-900">
                {viewMode === 'month' && currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                {viewMode === 'week' && `${currentDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${new Date(currentDate.getTime() + 6 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`}
                {viewMode === 'day' && currentDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </h3>
              <button
                onClick={() => navigateDate('next')}
                className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded"
              >
                <FaChevronRight size={16} />
              </button>
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
              
              <div className="text-sm text-gray-600">
                Progress: {progressStats.completed}/{progressStats.total} ({progressStats.percentage}%)
              </div>
            </div>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="overflow-y-auto max-h-[calc(90vh-200px)]">
          {viewMode === 'month' && (
            <div className="p-6">
              {/* Month Header */}
              <div className="grid grid-cols-7 gap-1 mb-2">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <div key={day} className="p-3 text-center text-sm font-semibold text-gray-600 bg-gray-50 rounded">
                    {day}
                  </div>
                ))}
              </div>
              
              {/* Month Grid */}
              <div className="grid grid-cols-7 gap-1">
                {days.map((date, index) => {
                  const tasks = getTasksForDate(date);
                  const filteredTasks = showCompleted ? tasks : tasks.filter(task => task.status !== 'done');
                  const isCurrentMonth = date.getMonth() === currentDate.getMonth();
                  const isToday = date.toDateString() === new Date().toDateString();
                  
                  return (
                    <div
                      key={index}
                      onClick={() => handleDateClick(date)}
                      className={`min-h-[120px] p-2 border border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors ${
                        !isCurrentMonth ? 'bg-gray-100 text-gray-400' : 'bg-white'
                      } ${isToday ? 'ring-2 ring-blue-500' : ''}`}
                    >
                      <div className="text-sm font-medium mb-2">
                        {date.getDate()}
                      </div>
                      <div className="space-y-1">
                        {filteredTasks.slice(0, 3).map((task) => (
                          <div
                            key={task.id}
                            className={`text-xs p-1 rounded truncate ${
                              task.status === 'done' ? 'bg-green-100 text-green-800' :
                              task.priority === 1 ? 'bg-red-100 text-red-800' :
                              task.priority === 2 ? 'bg-yellow-100 text-yellow-800' :
                              'bg-blue-100 text-blue-800'
                            }`}
                          >
                            {task.start_time} {task.content.substring(0, 20)}...
                          </div>
                        ))}
                        {filteredTasks.length > 3 && (
                          <div className="text-xs text-gray-500 text-center">
                            +{filteredTasks.length - 3} more
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {viewMode === 'week' && (
            <div className="p-6">
              {/* Week Header */}
              <div className="grid grid-cols-7 gap-4 mb-4">
                {days.map((date) => (
                  <div key={date.toDateString()} className="text-center">
                    <div className="text-sm font-semibold text-gray-600 mb-2">
                      {date.toLocaleDateString('en-US', { weekday: 'short' })}
                    </div>
                    <div className={`text-lg font-bold p-2 rounded ${
                      date.toDateString() === new Date().toDateString() ? 'bg-blue-500 text-white' : 'text-gray-900'
                    }`}>
                      {date.getDate()}
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Week Grid */}
              <div className="grid grid-cols-7 gap-4">
                {days.map((date) => {
                  const tasks = getTasksForDate(date);
                  const filteredTasks = showCompleted ? tasks : tasks.filter(task => task.status !== 'done');
                  
                  return (
                    <div
                      key={date.toDateString()}
                      onClick={() => handleDateClick(date)}
                      className="min-h-[400px] p-3 border border-gray-200 rounded cursor-pointer hover:bg-gray-50 transition-colors"
                    >
                      <div className="space-y-2">
                        {filteredTasks.map((task) => (
                          <div
                            key={task.id}
                            className={`p-2 rounded text-sm ${
                              task.status === 'done' ? 'bg-green-100 text-green-800 border border-green-200' :
                              task.priority === 1 ? 'bg-red-100 text-red-800 border border-red-200' :
                              task.priority === 2 ? 'bg-yellow-100 text-yellow-800 border border-yellow-200' :
                              'bg-blue-100 text-blue-800 border border-blue-200'
                            }`}
                          >
                            <div className="font-medium text-xs">{task.start_time}</div>
                            <div className="text-xs mt-1">{task.content.substring(0, 30)}...</div>
                            <div className="text-xs mt-1 opacity-75">{task.note.substring(0, 20)}...</div>
                          </div>
                        ))}
                        {filteredTasks.length === 0 && (
                          <div className="text-gray-400 text-center text-sm py-8">
                            No tasks
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {viewMode === 'day' && (
            <div className="p-6">
              <div className="max-w-2xl mx-auto">
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    {currentDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                  </h3>
                </div>
                
                <div className="space-y-4">
                  {(() => {
                    const tasks = getTasksForDate(currentDate);
                    const filteredTasks = showCompleted ? tasks : tasks.filter(task => task.status !== 'done');
                    
                    if (filteredTasks.length === 0) {
                      return (
                        <div className="text-center py-12">
                          <div className="text-4xl mb-4">📅</div>
                          <h3 className="text-lg font-semibold text-gray-900 mb-2">No tasks for this day</h3>
                          <p className="text-gray-600">Enjoy your free time!</p>
                        </div>
                      );
                    }
                    
                    return filteredTasks.map((task) => (
                      <div
                        key={task.id}
                        className={`p-4 rounded-lg border ${
                          task.status === 'done' ? 'bg-green-50 border-green-200' :
                          task.priority === 1 ? 'bg-red-50 border-red-200' :
                          task.priority === 2 ? 'bg-yellow-50 border-yellow-200' :
                          'bg-blue-50 border-blue-200'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <span className="text-sm font-medium text-gray-600">
                                {task.start_time} - {task.end_time}
                              </span>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${priorityColors[task.priority as keyof typeof priorityColors]}`}>
                                {priorityLabels[task.priority as keyof typeof priorityLabels]}
                              </span>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${taskStatusColors[task.status as keyof typeof taskStatusColors]}`}>
                                {taskStatusLabels[task.status as keyof typeof taskStatusLabels]}
                              </span>
                            </div>
                            <h4 className="font-medium text-gray-900 mb-2">{task.content}</h4>
                            {task.note && (
                              <p className="text-sm text-gray-600 mb-3">{task.note}</p>
                            )}
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            {task.status !== 'done' && (
                              <button
                                onClick={() => updateTaskStatus(task.id, 'done')}
                                className="p-2 text-green-600 hover:bg-green-50 rounded"
                                title="Mark as completed"
                              >
                                <FaCheck size={16} />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ));
                  })()}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Task Details Modal */}
      {showTaskDetails && selectedDate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold">
                  Tasks for {selectedDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </h3>
                <button
                  onClick={() => setShowTaskDetails(false)}
                  className="text-white hover:text-blue-100 transition-colors"
                >
                  <FaTimes size={20} />
                </button>
              </div>
            </div>
            
            <div className="overflow-y-auto max-h-[calc(80vh-100px)] p-6">
              {selectedTasks.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-4xl mb-4">📅</div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No tasks for this day</h3>
                  <p className="text-gray-600">Enjoy your free time!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {selectedTasks.map((task) => (
                    <div
                      key={task.id}
                      className={`p-4 rounded-lg border ${
                        task.status === 'done' ? 'bg-green-50 border-green-200' :
                        task.priority === 1 ? 'bg-red-50 border-red-200' :
                        task.priority === 2 ? 'bg-yellow-50 border-yellow-200' :
                        'bg-blue-50 border-blue-200'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <span className="text-sm font-medium text-gray-600">
                              {task.start_time} - {task.end_time}
                            </span>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${priorityColors[task.priority as keyof typeof priorityColors]}`}>
                              {priorityLabels[task.priority as keyof typeof priorityLabels]}
                            </span>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${taskStatusColors[task.status as keyof typeof taskStatusColors]}`}>
                              {taskStatusLabels[task.status as keyof typeof taskStatusLabels]}
                            </span>
                          </div>
                          <h4 className="font-medium text-gray-900 mb-2">{task.content}</h4>
                          {task.note && (
                            <p className="text-sm text-gray-600 mb-3">{task.note}</p>
                          )}
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          {task.status !== 'done' && (
                            <button
                              onClick={() => updateTaskStatus(task.id, 'done')}
                              className="p-2 text-green-600 hover:bg-green-50 rounded"
                              title="Mark as completed"
                            >
                              <FaCheck size={16} />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 