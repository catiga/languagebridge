'use client';

import React, { useState, useEffect } from 'react';
import { apiClient } from '../../../../utils/api';
import { toast } from 'react-toastify';
import { FaTimes, FaSave, FaCalendarAlt, FaClock, FaFlag, FaStickyNote } from 'react-icons/fa';

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

interface TaskEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  task?: Task | null;
  studentId: number;
  onTaskSaved: () => void;
}

export default function TaskEditModal({ isOpen, onClose, task, studentId, onTaskSaved }: TaskEditModalProps) {
  const [formData, setFormData] = useState({
    exe_date: '',
    start_time: '09:00',
    end_time: '10:00',
    duration: 60,
    priority: 2,
    content: '',
    note: ''
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (task) {
      setFormData({
        exe_date: task.exe_date.split('T')[0],
        start_time: task.start_time,
        end_time: task.end_time,
        duration: task.duration,
        priority: task.priority,
        content: task.content,
        note: task.note
      });
    } else {
      setFormData({
        exe_date: new Date().toISOString().split('T')[0],
        start_time: '09:00',
        end_time: '10:00',
        duration: 60,
        priority: 2,
        content: '',
        note: ''
      });
    }
  }, [task]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        student_id: studentId,
        ...formData
      };

      let response;
      if (task) {
        // 更新任务
        response = await apiClient.post('/spwapi/auth/planner/task/update', {
          task_id: task.id,
          ...payload
        }) as any;
      } else {
        // 创建新任务
        response = await apiClient.post('/spwapi/auth/planner/task/add', payload) as any;
      }

      if (response && response.code === 0) {
        toast.success(task ? 'Task updated successfully' : 'Task created successfully');
        onTaskSaved();
        onClose();
      } else {
        toast.error(response?.msg || 'Failed to save task');
      }
    } catch (error) {
      console.error('Failed to save task:', error);
      toast.error('Failed to save task');
    } finally {
      setLoading(false);
    }
  };

  const handleTimeChange = (field: 'start_time' | 'end_time', value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // 自动计算持续时间
    if (field === 'start_time' || field === 'end_time') {
      const start = field === 'start_time' ? value : formData.start_time;
      const end = field === 'end_time' ? value : formData.end_time;
      
      if (start && end) {
        const startMinutes = parseInt(start.split(':')[0]) * 60 + parseInt(start.split(':')[1]);
        const endMinutes = parseInt(end.split(':')[0]) * 60 + parseInt(end.split(':')[1]);
        const duration = endMinutes - startMinutes;
        
        if (duration > 0) {
          setFormData(prev => ({
            ...prev,
            duration
          }));
        }
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">
              {task ? 'Edit Task' : 'Add New Task'}
            </h2>
            <button
              onClick={onClose}
              className="text-white hover:text-blue-100 transition-colors"
            >
              <FaTimes size={20} />
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Task Content */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Task Content *
            </label>
            <textarea
              value={formData.content}
              onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={3}
              placeholder="Describe what needs to be done..."
              required
            />
          </div>

          {/* Date and Time */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <FaCalendarAlt className="inline mr-2" />
                Execution Date *
              </label>
              <input
                type="date"
                value={formData.exe_date}
                onChange={(e) => setFormData(prev => ({ ...prev, exe_date: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <FaClock className="inline mr-2" />
                Duration (minutes)
              </label>
              <input
                type="number"
                value={formData.duration}
                onChange={(e) => setFormData(prev => ({ ...prev, duration: parseInt(e.target.value) || 0 }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                min="15"
                max="480"
              />
            </div>
          </div>

          {/* Time Range */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start Time
              </label>
              <input
                type="time"
                value={formData.start_time}
                onChange={(e) => handleTimeChange('start_time', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                End Time
              </label>
              <input
                type="time"
                value={formData.end_time}
                onChange={(e) => handleTimeChange('end_time', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Priority */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <FaFlag className="inline mr-2" />
              Priority
            </label>
            <select
              value={formData.priority}
              onChange={(e) => setFormData(prev => ({ ...prev, priority: parseInt(e.target.value) }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value={1}>High Priority</option>
              <option value={2}>Medium Priority</option>
              <option value={3}>Low Priority</option>
            </select>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <FaStickyNote className="inline mr-2" />
              Notes
            </label>
            <textarea
              value={formData.note}
              onChange={(e) => setFormData(prev => ({ ...prev, note: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={2}
              placeholder="Additional notes or instructions..."
            />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !formData.content.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              <FaSave size={14} />
              <span>{loading ? 'Saving...' : (task ? 'Update Task' : 'Create Task')}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 