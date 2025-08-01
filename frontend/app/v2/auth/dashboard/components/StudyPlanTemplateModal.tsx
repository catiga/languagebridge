'use client';

import React, { useState, useEffect } from 'react';
import { apiClient } from '../../../../utils/api';
import { toast } from 'react-toastify';
import { 
  FaTimes, 
  FaCalendarAlt,
  FaClock,
  FaCheckCircle,
  FaLightbulb,
  FaExclamationTriangle,
  FaPlay,
  FaInfoCircle,
  FaEdit,
  FaTrash,
  FaPlus,
  FaSave,
  FaStar,
  FaRegStar
} from 'react-icons/fa';

interface StudyPlanTask {
  id: string;
  content: string;
  priority: 'low' | 'medium' | 'high';
}

interface StudyPlanTemplate {
  week: number;
  objective: string;
  tasks: StudyPlanTask[];
}

interface StudyPlanTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  studentId: number;
  overviewId: number;
  studentName: string;
}

export default function StudyPlanTemplateModal({ 
  isOpen, 
  onClose, 
  studentId, 
  overviewId, 
  studentName 
}: StudyPlanTemplateModalProps) {
  const [loading, setLoading] = useState(false);
  const [studyPlanTemplate, setStudyPlanTemplate] = useState<StudyPlanTemplate[]>([]);
  const [estimatedDuration, setEstimatedDuration] = useState<number>(0);
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [generating, setGenerating] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [editingWeek, setEditingWeek] = useState<number | null>(null);
  const [editingObjective, setEditingObjective] = useState<string>('');
  const [editingTasks, setEditingTasks] = useState<StudyPlanTask[]>([]);

  useEffect(() => {
    if (isOpen && overviewId) {
      fetchStudyPlanTemplate();
    }
  }, [isOpen, overviewId]);

  // 计算结束日期 - 使用estimatedDuration而不是模板天数
  useEffect(() => {
    if (startDate && estimatedDuration > 0) {
      const start = new Date(startDate);
      const end = new Date(start);
      end.setDate(start.getDate() + estimatedDuration - 1);
      setEndDate(end.toISOString().split('T')[0]);
    }
  }, [startDate, estimatedDuration]);

  const fetchStudyPlanTemplate = async () => {
    try {
      setLoading(true);
      
      const response = await apiClient.get(`/spwapi/auth/aiagent/assessment/view?overview_id=${overviewId}`) as any;
      
      if (response && response.code === 0 && response.data && response.data.length > 0) {
        const data = response.data[0];
        
        if (data.assessments && data.assessments.length > 0) {
          const assessment = data.assessments[0];
          setEstimatedDuration(assessment.estimated_duration_days);
          
          // 解析学习计划模板
          try {
            if (assessment.study_plan_tpl) {
              const parsedTemplate = JSON.parse(assessment.study_plan_tpl) as any[];
              
              // 处理新格式的模板数据
              const convertedTemplate: StudyPlanTemplate[] = parsedTemplate.map((week, index) => {
                // 处理tasks - 支持新格式（对象数组）和旧格式（字符串数组）
                let tasks: StudyPlanTask[] = [];
                
                if (Array.isArray(week.tasks)) {
                  if (week.tasks.length > 0 && typeof week.tasks[0] === 'object') {
                    // 新格式：对象数组，包含id, content, priority
                    tasks = week.tasks.map((task: any) => ({
                      id: task.id || `${index}-${Math.random()}`,
                      content: task.content || '',
                      priority: task.priority || 'medium'
                    }));
                  } else {
                    // 旧格式：字符串数组
                    tasks = week.tasks.map((task: string, taskIndex: number) => ({
                      id: `${index}-${taskIndex}`,
                      content: task,
                      priority: 'medium' as const
                    }));
                  }
                }
                
                return {
                  week: week.week || index + 1,
                  objective: week.objective || '',
                  tasks: tasks
                };
              });
              
              setStudyPlanTemplate(convertedTemplate);
            }
          } catch (error) {
            console.error('Failed to parse study plan template:', error);
            toast.error('Failed to load study plan template');
          }
        }
      } else {
        toast.error(response?.msg || 'Failed to load study plan template');
      }
    } catch (error) {
      console.error('Failed to fetch study plan template:', error);
      toast.error('Failed to load study plan template');
    } finally {
      setLoading(false);
    }
  };

  const handleGeneratePlan = async () => {
    if (!startDate) {
      toast.error('Please select a start date');
      return;
    }

    try {
      setGenerating(true);
      
      // 准备完整数据 - 包含模板JSON、开始日期和结束日期
      const generateData = {
        overview_id: overviewId,
        template: studyPlanTemplate,  // 提交当前编辑的模板
        start_date: startDate,
        end_date: endDate
      };
      
      // 调用生成学习计划接口
      const response = await apiClient.post(`/spwapi/auth/aiagent/assessment/studyplan/generate`, generateData) as any;
      
      if (response && response.code === 0) {
        const totalDays = response.data?.total_days || 0;
        const totalWeeks = response.data?.total_weeks || 0;
        toast.success(`Study plan generated successfully! ${totalDays} days (${totalWeeks} weeks) plan created.`);
        onClose();
      } else {
        toast.error(response?.msg || 'Failed to generate study plan');
      }
    } catch (error) {
      console.error('Failed to generate study plan:', error);
      toast.error('Failed to generate study plan');
    } finally {
      setGenerating(false);
    }
  };



  const handleUpdateTemplate = async () => {
    try {
      setUpdating(true);
      
      // 准备模板数据 - 只提交模板JSON，不包含start_date
      const templateData = {
        overview_id: overviewId,
        template: studyPlanTemplate
      };
      
      const response = await apiClient.post(`/spwapi/auth/aiagent/assessment/studyplan/template/update`, templateData) as any;
      
      if (response && response.code === 0) {
        toast.success('Study plan template updated successfully!');
      } else {
        toast.error(response?.msg || 'Failed to update template');
      }
    } catch (error) {
      console.error('Failed to update template:', error);
      toast.error('Failed to update template');
    } finally {
      setUpdating(false);
    }
  };

  const startEditing = (week: StudyPlanTemplate) => {
    setEditingWeek(week.week);
    setEditingObjective(week.objective);
    setEditingTasks([...week.tasks]);
  };

  const cancelEditing = () => {
    setEditingWeek(null);
    setEditingObjective('');
    setEditingTasks([]);
  };

  const saveEditing = () => {
    if (editingWeek !== null) {
      const updatedTemplate = studyPlanTemplate.map(week => 
        week.week === editingWeek 
          ? { ...week, objective: editingObjective, tasks: editingTasks }
          : week
      );
      setStudyPlanTemplate(updatedTemplate);
      cancelEditing();
    }
  };

  const addTask = (weekIndex: number) => {
    const newTask: StudyPlanTask = {
      id: `${Date.now()}-${Math.random()}`,
      content: '',
      priority: 'medium'
    };
    
    const updatedTemplate = [...studyPlanTemplate];
    updatedTemplate[weekIndex].tasks.push(newTask);
    setStudyPlanTemplate(updatedTemplate);
  };

  const updateTask = (weekIndex: number, taskIndex: number, field: keyof StudyPlanTask, value: string | 'low' | 'medium' | 'high') => {
    const updatedTemplate = [...studyPlanTemplate];
    updatedTemplate[weekIndex].tasks[taskIndex] = {
      ...updatedTemplate[weekIndex].tasks[taskIndex],
      [field]: value
    };
    setStudyPlanTemplate(updatedTemplate);
  };

  const deleteTask = (weekIndex: number, taskIndex: number) => {
    const updatedTemplate = [...studyPlanTemplate];
    updatedTemplate[weekIndex].tasks.splice(taskIndex, 1);
    setStudyPlanTemplate(updatedTemplate);
  };

  const addWeek = () => {
    const newWeek: StudyPlanTemplate = {
      week: studyPlanTemplate.length + 1,
      objective: '',
      tasks: []
    };
    setStudyPlanTemplate([...studyPlanTemplate, newWeek]);
  };

  const deleteWeek = (weekIndex: number) => {
    const updatedTemplate = studyPlanTemplate.filter((_, index) => index !== weekIndex);
    // 重新编号周数
    const renumberedTemplate = updatedTemplate.map((week, index) => ({
      ...week,
      week: index + 1
    }));
    setStudyPlanTemplate(renumberedTemplate);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600';
      case 'medium': return 'text-yellow-600';
      case 'low': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high': return <FaStar className="text-red-600" />;
      case 'medium': return <FaStar className="text-yellow-600" />;
      case 'low': return <FaRegStar className="text-green-600" />;
      default: return <FaRegStar className="text-gray-400" />;
    }
  };

  const getWeekColor = (week: number) => {
    const colors = ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-orange-500', 'bg-red-500'];
    return colors[(week - 1) % colors.length];
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Study Plan Template Editor</h2>
            <p className="text-gray-600 mt-1">Student: {studentName}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <FaTimes size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Template Notice */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-start">
              <FaInfoCircle className="text-blue-600 mr-3 mt-1 flex-shrink-0" />
              <div>
                <h3 className="text-blue-800 font-semibold mb-2">Study Plan Template Editor</h3>
                <p className="text-blue-700 text-sm leading-relaxed">
                  Edit your study plan template below. You can modify objectives, add/remove tasks, and set priorities. 
                  When ready, choose to either update the template or generate an actual study plan with dates.
                </p>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600">Loading study plan template...</span>
            </div>
          ) : studyPlanTemplate.length > 0 ? (
            <div className="space-y-6">
              {/* Plan Overview */}
              <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">Plan Overview</h3>
                    <p className="text-gray-600">AI-recommended study plan based on assessment results</p>
                  </div>
                  <div className="text-right">
                                      <div className="text-3xl font-bold text-indigo-600">
                    {studyPlanTemplate.length} Weeks
                  </div>
                  <div className="text-gray-500">
                    Estimated Duration: {estimatedDuration} days ({Math.ceil(estimatedDuration / 7)} weeks)
                  </div>
                  </div>
                </div>
              </div>

              {/* Study Plan Template */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">Weekly Objectives</h3>
                  <button
                    onClick={addWeek}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center"
                  >
                    <FaPlus className="mr-2" />
                    Add Week
                  </button>
                </div>
                
                {studyPlanTemplate.map((week, weekIndex) => (
                  <div key={weekIndex} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center">
                        <div className={`w-10 h-10 ${getWeekColor(week.week)} text-white rounded-full flex items-center justify-center text-sm font-bold mr-4`}>
                          {week.week}
                        </div>
                        <div className="flex-1">
                          {editingWeek === week.week ? (
                            <input
                              type="text"
                              value={editingObjective}
                              onChange={(e) => setEditingObjective(e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="Enter objective..."
                            />
                          ) : (
                            <h4 className="text-lg font-semibold text-gray-900">{week.objective}</h4>
                          )}
                          <p className="text-sm text-gray-500">Week {week.week} of {studyPlanTemplate.length}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {editingWeek === week.week ? (
                          <>
                            <button
                              onClick={saveEditing}
                              className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 transition-colors"
                            >
                              Save
                            </button>
                            <button
                              onClick={cancelEditing}
                              className="bg-gray-600 text-white px-3 py-1 rounded text-sm hover:bg-gray-700 transition-colors"
                            >
                              Cancel
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => startEditing(week)}
                              className="text-blue-600 hover:text-blue-800 transition-colors"
                            >
                              <FaEdit size={16} />
                            </button>
                            <button
                              onClick={() => deleteWeek(weekIndex)}
                              className="text-red-600 hover:text-red-800 transition-colors"
                            >
                              <FaTrash size={16} />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h5 className="font-medium text-gray-700 flex items-center">
                          <FaLightbulb className="text-yellow-500 mr-2" />
                          Tasks ({week.tasks.length})
                        </h5>
                        <button
                          onClick={() => addTask(weekIndex)}
                          className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 transition-colors flex items-center"
                        >
                          <FaPlus className="mr-1" size={12} />
                          Add Task
                        </button>
                      </div>
                      
                      <div className="space-y-2">
                        {week.tasks.map((task, taskIndex) => (
                          <div key={task.id} className="flex items-start bg-gray-50 rounded-lg p-3">
                            <div className="flex items-center space-x-2 mr-3">
                              <select
                                value={task.priority}
                                onChange={(e) => updateTask(weekIndex, taskIndex, 'priority', e.target.value as 'low' | 'medium' | 'high')}
                                className="text-xs border border-gray-300 rounded px-1 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
                              >
                                <option value="low">Low</option>
                                <option value="medium">Medium</option>
                                <option value="high">High</option>
                              </select>
                              {getPriorityIcon(task.priority)}
                            </div>
                            <input
                              type="text"
                              value={task.content}
                              onChange={(e) => updateTask(weekIndex, taskIndex, 'content', e.target.value)}
                              className="flex-1 text-sm text-gray-700 bg-transparent border-none focus:outline-none focus:ring-0"
                              placeholder="Enter task content..."
                            />
                            <button
                              onClick={() => deleteTask(weekIndex, taskIndex)}
                              className="text-red-600 hover:text-red-800 transition-colors ml-2"
                            >
                              <FaTrash size={14} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Action Buttons Section */}
              <div className="bg-gradient-to-r from-blue-50 to-green-50 border border-blue-200 rounded-lg p-6">
                <div className="flex items-center mb-4">
                  <FaInfoCircle className="text-blue-600 mr-2" />
                  <h3 className="text-lg font-semibold text-gray-800">Template Actions</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Update Template Section */}
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                    <div className="flex items-center mb-3">
                      <FaSave className="text-orange-600 mr-2" />
                      <h4 className="font-semibold text-orange-800">Update Template</h4>
                    </div>
                    <p className="text-orange-700 text-sm mb-4">
                      Save your current template changes without generating a study plan. 
                      This only updates the template for future use.
                    </p>
                    <button
                      onClick={handleUpdateTemplate}
                      disabled={updating}
                      className="w-full bg-orange-600 text-white px-4 py-3 rounded-lg hover:bg-orange-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center"
                    >
                      {updating ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Updating Template...
                        </>
                      ) : (
                        <>
                          <FaSave className="mr-2" />
                          Update Template
                        </>
                      )}
                    </button>
                  </div>

                  {/* Generate Study Plan Section */}
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center mb-3">
                      <FaPlay className="text-green-600 mr-2" />
                      <h4 className="font-semibold text-green-800">Generate Study Plan</h4>
                    </div>
                    <p className="text-green-700 text-sm mb-4">
                      Create an actual study plan with specific dates using the current template. 
                      This will generate a complete schedule.
                    </p>
                    
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Start Date
                        </label>
                        <input
                          type="date"
                          value={startDate}
                          onChange={(e) => setStartDate(e.target.value)}
                          min={new Date().toISOString().split('T')[0]}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          End Date (Calculated)
                        </label>
                        <input
                          type="date"
                          value={endDate}
                          disabled
                          className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-600 text-sm"
                        />
                      </div>
                      <button
                        onClick={handleGeneratePlan}
                        disabled={!startDate || generating}
                        className="w-full bg-green-600 text-white px-4 py-3 rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center"
                      >
                        {generating ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Generating Plan...
                          </>
                        ) : (
                          <>
                            <FaCheckCircle className="mr-2" />
                            Generate Study Plan
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Additional Info */}
                <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <div className="flex items-start">
                    <FaInfoCircle className="text-blue-600 mr-2 mt-1 flex-shrink-0" />
                    <div className="text-blue-800 text-sm">
                      <p className="font-medium mb-1">What's the difference?</p>
                      <ul className="list-disc list-inside space-y-1">
                        <li><strong>Update Template:</strong> Only saves your template changes for future use</li>
                        <li><strong>Generate Study Plan:</strong> Creates an actual study schedule with specific dates</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📚</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No Study Plan Template Found
              </h3>
              <p className="text-gray-600">
                The study plan template could not be loaded. Please try again later.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700 transition-colors"
          >
            Close
          </button>
        </div>

        {/* Floating Action Buttons */}
        <div className="fixed bottom-6 right-6 flex flex-col space-y-3 z-50">
          {/* Update Template Floating Button */}
          <button
            onClick={handleUpdateTemplate}
            disabled={updating}
            className="bg-orange-600 text-white p-4 rounded-full shadow-lg hover:bg-orange-700 transition-all duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed group"
            title="Update Template"
          >
            {updating ? (
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
            ) : (
              <FaSave size={24} />
            )}
            <div className="absolute right-full mr-3 bg-gray-800 text-white text-sm px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
              Update Template
            </div>
          </button>

          {/* Generate Plan Floating Button */}
          <button
            onClick={() => {
              if (!startDate) {
                toast.error('Please select a start date first');
                return;
              }
              handleGeneratePlan();
            }}
            disabled={generating || !startDate}
            className="bg-green-600 text-white p-4 rounded-full shadow-lg hover:bg-green-700 transition-all duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed group"
            title="Generate Study Plan"
          >
            {generating ? (
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
            ) : (
              <FaPlay size={24} />
            )}
            <div className="absolute right-full mr-3 bg-gray-800 text-white text-sm px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
              Generate Study Plan
            </div>
          </button>
        </div>
      </div>
    </div>
  );
} 