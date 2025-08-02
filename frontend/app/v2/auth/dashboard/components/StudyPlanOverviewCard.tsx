'use client';

import React from 'react';
import { FaCalendarAlt, FaClock, FaCheck, FaTimes, FaFlag, FaChartLine } from 'react-icons/fa';

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
  quizs: any[];
}

interface StudyPlanOverviewCardProps {
  learningGoal: LearningGoal;
  studentName: string;
  onViewDetails: () => void;
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

export default function StudyPlanOverviewCard({ learningGoal, studentName, onViewDetails }: StudyPlanOverviewCardProps) {
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
      .slice(0, 3);
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

  const progressStats = getProgressStats();
  const upcomingTasks = getUpcomingTasks();
  const overdueTasks = getOverdueTasks();

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <FaChartLine className="mr-2 text-blue-600" />
            Study Plan Overview
          </h3>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[learningGoal.status as keyof typeof statusColors]}`}>
            {statusLabels[learningGoal.status as keyof typeof statusLabels]}
          </span>
        </div>
        <p className="text-sm text-gray-600">{studentName} • {learningGoal.title}</p>
      </div>

      {/* Progress Section */}
      <div className="p-4">
        <div className="mb-4">
          <div className="flex justify-between text-sm text-gray-600 mb-1">
            <span>Overall Progress</span>
            <span>{progressStats.percentage}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all"
              style={{ width: `${progressStats.percentage}%` }}
            ></div>
          </div>
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>{progressStats.completed} completed</span>
            <span>{progressStats.total} total tasks</span>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="text-center">
            <div className="text-lg font-bold text-blue-600">{progressStats.completed}</div>
            <div className="text-xs text-gray-600">Completed</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-yellow-600">{upcomingTasks.length}</div>
            <div className="text-xs text-gray-600">Upcoming</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-red-600">{overdueTasks.length}</div>
            <div className="text-xs text-gray-600">Overdue</div>
          </div>
        </div>

        {/* Timeline Info */}
        <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
          <div className="flex items-center">
            <FaCalendarAlt className="mr-1" />
            <span>
              {new Date(learningGoal.start_date).toLocaleDateString()} - {new Date(learningGoal.end_date).toLocaleDateString()}
            </span>
          </div>
          <div className="flex items-center">
            <FaFlag className="mr-1" />
            <span>Level {learningGoal.target_level}</span>
          </div>
        </div>

        {/* Upcoming Tasks Preview */}
        {upcomingTasks.length > 0 && (
          <div className="mb-4">
            <h4 className="text-sm font-medium text-gray-900 mb-2 flex items-center">
              <FaClock className="mr-1 text-blue-500" />
              Next Tasks
            </h4>
            <div className="space-y-2">
              {upcomingTasks.map((task) => (
                <div key={task.id} className="flex items-center justify-between p-2 bg-gray-50 rounded text-xs">
                  <div className="flex-1 min-w-0">
                    <p className="text-gray-900 truncate">{task.content}</p>
                    <p className="text-gray-500">{new Date(task.exe_date).toLocaleDateString()}</p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ml-2 ${priorityColors[task.priority as keyof typeof priorityColors]}`}>
                    {priorityLabels[task.priority as keyof typeof priorityLabels]}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Overdue Tasks Alert */}
        {overdueTasks.length > 0 && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <FaTimes className="text-red-500 mr-2" />
                <span className="text-sm font-medium text-red-800">
                  {overdueTasks.length} overdue task{overdueTasks.length > 1 ? 's' : ''}
                </span>
              </div>
              <span className="text-xs text-red-600">
                {new Date(overdueTasks[0].exe_date).toLocaleDateString()}
              </span>
            </div>
          </div>
        )}

        {/* Action Button */}
        <button
          onClick={onViewDetails}
          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-2 px-4 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 font-medium text-sm"
        >
          View Full Study Plan
        </button>
      </div>
    </div>
  );
} 