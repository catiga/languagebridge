'use client';

import React, { useState, useEffect } from 'react';
import { apiClient } from '../../../../utils/api';
import { toast } from 'react-toastify';
import { 
  FaChartBar, 
  FaCheckCircle, 
  FaClock, 
  FaExclamationTriangle,
  FaPlay,
  FaPause,
  FaStar,
  FaCalendarCheck,
  FaCalendarTimes
} from 'react-icons/fa';

interface StudyPlanStats {
  Create: number;
  Ongoing: number;
  Unfinished: number;
  FullyComplete: number;
  FewComplete: number;
  MostlyComplete: number;
  PartiallyComplete: number;
  LatelyComplete: number;
}

interface StudyPlanStatsProps {
  overviewId: number;
  studentName: string;
}

const statusConfig = {
  Create: {
    label: 'Created',
    icon: FaCalendarCheck,
    color: 'bg-gray-500',
    bgColor: 'bg-gray-50',
    textColor: 'text-gray-700'
  },
  Ongoing: {
    label: 'Ongoing',
    icon: FaPlay,
    color: 'bg-blue-500',
    bgColor: 'bg-blue-50',
    textColor: 'text-blue-700'
  },
  Unfinished: {
    label: 'Unfinished',
    icon: FaExclamationTriangle,
    color: 'bg-red-500',
    bgColor: 'bg-red-50',
    textColor: 'text-red-700'
  },
  FullyComplete: {
    label: 'Fully Complete',
    icon: FaCheckCircle,
    color: 'bg-green-500',
    bgColor: 'bg-green-50',
    textColor: 'text-green-700'
  },
  FewComplete: {
    label: 'Few Complete',
    icon: FaPause,
    color: 'bg-orange-500',
    bgColor: 'bg-orange-50',
    textColor: 'text-orange-700'
  },
  MostlyComplete: {
    label: 'Mostly Complete',
    icon: FaStar,
    color: 'bg-yellow-500',
    bgColor: 'bg-yellow-50',
    textColor: 'text-yellow-700'
  },
  PartiallyComplete: {
    label: 'Partially Complete',
    icon: FaClock,
    color: 'bg-purple-500',
    bgColor: 'bg-purple-50',
    textColor: 'text-purple-700'
  },
  LatelyComplete: {
    label: 'Lately Complete',
    icon: FaCalendarCheck,
    color: 'bg-teal-500',
    bgColor: 'bg-teal-50',
    textColor: 'text-teal-700'
  }
};

export default function StudyPlanStats({ overviewId, studentName }: StudyPlanStatsProps) {
  const [stats, setStats] = useState<StudyPlanStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, [overviewId]);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get(`/spwapi/auth/planner/stat?overview_id=${overviewId}`) as any;
      
      if (response && response.code === 0) {
        setStats(response.data);
      } else {
        toast.error(response?.msg || 'Failed to load statistics');
      }
    } catch (error) {
      console.error('Failed to fetch study plan stats:', error);
      toast.error('Failed to load statistics');
    } finally {
      setLoading(false);
    }
  };

  const getTotalTasks = () => {
    if (!stats) return 0;
    return Object.values(stats).reduce((sum, count) => sum + count, 0);
  };

  const getCompletionRate = () => {
    const total = getTotalTasks();
    if (total === 0) return 0;
    
    const completed = stats!.FullyComplete + stats!.MostlyComplete + stats!.PartiallyComplete + stats!.LatelyComplete;
    return Math.round((completed / total) * 100);
  };

  const getProgressColor = (rate: number) => {
    if (rate >= 80) return 'bg-green-500';
    if (rate >= 60) return 'bg-yellow-500';
    if (rate >= 40) return 'bg-orange-500';
    return 'bg-red-500';
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="text-center text-gray-500">
          <FaChartBar className="mx-auto text-4xl mb-2" />
          <p>No statistics available</p>
        </div>
      </div>
    );
  }

  const totalTasks = getTotalTasks();
  const completionRate = getCompletionRate();

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <FaChartBar className="mr-2 text-blue-600" />
            Study Plan Statistics
          </h3>
          <p className="text-sm text-gray-600">{studentName}</p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-gray-900">{totalTasks}</div>
          <div className="text-sm text-gray-600">Total Tasks</div>
        </div>
      </div>

      {/* Progress Overview */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Overall Progress</span>
          <span className="text-sm font-medium text-gray-900">{completionRate}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className={`h-2 rounded-full transition-all duration-300 ${getProgressColor(completionRate)}`}
            style={{ width: `${completionRate}%` }}
          ></div>
        </div>
      </div>

      {/* Statistics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Object.entries(stats).map(([key, count]) => {
          const config = statusConfig[key as keyof typeof statusConfig];
          const Icon = config.icon;
          const percentage = totalTasks > 0 ? Math.round((count / totalTasks) * 100) : 0;
          
          return (
            <div 
              key={key}
              className={`${config.bgColor} rounded-lg p-4 border border-gray-200 hover:shadow-md transition-shadow`}
            >
              <div className="flex items-center justify-between mb-2">
                <Icon className={`${config.color} text-white p-2 rounded-lg`} size={20} />
                <span className={`text-xs font-medium ${config.textColor}`}>
                  {percentage}%
                </span>
              </div>
              <div className={`text-2xl font-bold ${config.textColor}`}>
                {count}
              </div>
              <div className={`text-xs ${config.textColor} opacity-75`}>
                {config.label}
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
        {/* Active Tasks */}
        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
          <div className="flex items-center">
            <FaPlay className="text-blue-600 mr-2" />
            <div>
              <div className="text-lg font-semibold text-blue-900">
                {stats.Ongoing}
              </div>
              <div className="text-sm text-blue-700">Active Tasks</div>
            </div>
          </div>
        </div>

        {/* Completed Tasks */}
        <div className="bg-green-50 rounded-lg p-4 border border-green-200">
          <div className="flex items-center">
            <FaCheckCircle className="text-green-600 mr-2" />
            <div>
              <div className="text-lg font-semibold text-green-900">
                {stats.FullyComplete + stats.MostlyComplete + stats.PartiallyComplete + stats.LatelyComplete}
              </div>
              <div className="text-sm text-green-700">Completed Tasks</div>
            </div>
          </div>
        </div>

        {/* Pending Tasks */}
        <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
          <div className="flex items-center">
            <FaClock className="text-orange-600 mr-2" />
            <div>
              <div className="text-lg font-semibold text-orange-900">
                {stats.Create + stats.Unfinished}
              </div>
              <div className="text-sm text-orange-700">Pending Tasks</div>
            </div>
          </div>
        </div>
      </div>

      {/* Refresh Button */}
      <div className="mt-6 text-center">
        <button
          onClick={fetchStats}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm"
        >
          Refresh Statistics
        </button>
      </div>
    </div>
  );
} 