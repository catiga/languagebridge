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
  FaInfoCircle
} from 'react-icons/fa';

interface StudyPlanTemplate {
  day: number;
  objective: string;
  tasks: string[];
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
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    if (isOpen && overviewId) {
      fetchStudyPlanTemplate();
    }
  }, [isOpen, overviewId]);

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
              const parsedTemplate = JSON.parse(assessment.study_plan_tpl) as StudyPlanTemplate[];
              setStudyPlanTemplate(parsedTemplate);
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
      
      // 调用生成学习计划接口
      const response = await apiClient.post(`/spwapi/auth/planner/generate`, {
        overview_id: overviewId,
        start_date: startDate
      }) as any;
      
      if (response && response.code === 0) {
        toast.success('Study plan generated successfully!');
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

  const getDayColor = (day: number) => {
    const colors = ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-orange-500', 'bg-red-500'];
    return colors[(day - 1) % colors.length];
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Recommended Study Plan Template</h2>
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
                <h3 className="text-blue-800 font-semibold mb-2">This is a Study Plan Template</h3>
                <p className="text-blue-700 text-sm leading-relaxed">
                  This is a recommended study plan template based on the student's assessment results. 
                  To create an actual study plan, please select a start date below and click "Generate Study Plan". 
                  The actual plan will be created with specific dates and can be tracked in the study planner.
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
                      {studyPlanTemplate.length} Days
                    </div>
                    <div className="text-gray-500">
                      Estimated Duration: {estimatedDuration} days
                    </div>
                  </div>
                </div>
              </div>

              {/* Study Plan Template */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Daily Objectives</h3>
                {studyPlanTemplate.map((day, index) => (
                  <div key={index} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                    <div className="flex items-center mb-4">
                      <div className={`w-10 h-10 ${getDayColor(day.day)} text-white rounded-full flex items-center justify-center text-sm font-bold mr-4`}>
                        {day.day}
                      </div>
                      <div className="flex-1">
                        <h4 className="text-lg font-semibold text-gray-900">{day.objective}</h4>
                        <p className="text-sm text-gray-500">Day {day.day} of {studyPlanTemplate.length}</p>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <h5 className="font-medium text-gray-700 flex items-center">
                        <FaLightbulb className="text-yellow-500 mr-2" />
                        Tasks ({day.tasks.length})
                      </h5>
                      <div className="space-y-2">
                        {day.tasks.map((task, taskIndex) => (
                          <div key={taskIndex} className="flex items-start bg-gray-50 rounded-lg p-3">
                            <div className="w-2 h-2 bg-indigo-400 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                            <p className="text-sm text-gray-700 leading-relaxed">{task}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Generate Plan Section */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                <div className="flex items-center mb-4">
                  <FaPlay className="text-green-600 mr-2" />
                  <h3 className="text-lg font-semibold text-green-800">Generate Actual Study Plan</h3>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select Start Date
                    </label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-600">
                      <FaExclamationTriangle className="inline mr-1 text-yellow-500" />
                      This will create a real study plan with specific dates
                    </div>
                    <button
                      onClick={handleGeneratePlan}
                      disabled={!startDate || generating}
                      className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center"
                    >
                      {generating ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Generating...
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
      </div>
    </div>
  );
} 