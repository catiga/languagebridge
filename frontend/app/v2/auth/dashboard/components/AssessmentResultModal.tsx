'use client';

import React, { useState, useEffect } from 'react';
import { apiClient } from '../../../../utils/api';
import { toast } from 'react-toastify';
import { 
  FaTimes, 
  FaCheckCircle, 
  FaTimesCircle, 
  FaChartBar, 
  FaStar,
  FaClock,
  FaBullseye,
  FaLightbulb,
  FaArrowUp,
  FaArrowDown
} from 'react-icons/fa';

interface AssessmentResult {
  id: number;
  add_time: string;
  agent_record_id: number;
  user_id: number;
  score: string;
  result: string;
  assessments: ExamQuizAssessment[];
}

interface ExamQuizAssessment {
  id: number;
  add_time: string;
  overview_id: number;
  quiz_record_id: number;
  user_id: number;
  student_id: number;
  init_level: number;
  init_sub_level: number;
  estimated_duration_days: number;
  assess_score: string;
  assess_max_score: string;
  assess_level_estimate: string;
  assess_over_all_comment: string;
  assess_strengths: string;
  assess_weaknesses: string;
  assess_suggestions: string;
  assess_writing_evaluation: string;
  study_plan_tpl: string;
}

interface WritingEvaluation {
  task1: WritingTaskScore;
  task2: WritingTaskScore;
}

interface WritingTaskScore {
  coherence: string;
  grammar: string;
  score: number;
}

interface DailyPlan {
  day: number;
  objective: string;
  tasks: string[];
}

interface QuizQuestion {
  type: string;
  question: string;
  options: string[];
  answer: string;
  explanation: string;
  user_answer: string;
  correct: boolean;
}

interface AssessmentResultModalProps {
  isOpen: boolean;
  onClose: () => void;
  studentId: number;
  overviewId: number;
  studentName: string;
}

const LEVEL_MAP: { [key: number]: string } = {
  1: "Beginner (KET)",
  2: "Intermediate (PET)", 
  3: "TOEFL Junior",
  4: "IELTS Practice",
  5: "Advanced"
};

export default function AssessmentResultModal({ 
  isOpen, 
  onClose, 
  studentId, 
  overviewId, 
  studentName 
}: AssessmentResultModalProps) {
  const [loading, setLoading] = useState(false);
  const [assessmentData, setAssessmentData] = useState<AssessmentResult | null>(null);
  const [assessment, setAssessment] = useState<ExamQuizAssessment | null>(null);
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [writingEvaluation, setWritingEvaluation] = useState<WritingEvaluation | null>(null);
  const [studyPlan, setStudyPlan] = useState<DailyPlan[]>([]);

  useEffect(() => {
    if (isOpen && overviewId) {
      fetchAssessmentData();
    }
  }, [isOpen, overviewId]);

  const fetchAssessmentData = async () => {
    try {
      setLoading(true);
      console.log('Fetching assessment data for overview_id:', overviewId);
      
      const response = await apiClient.get(`/spwapi/auth/aiagent/assessment/view?overview_id=${overviewId}`) as any;
      
      console.log('Assessment API response:', response);
      
      if (response && response.code === 0 && response.data && response.data.length > 0) {
        const data = response.data[0];
        setAssessmentData(data);
        
        // 解析quiz问题数据
        try {
          if (data.result) {
            const parsedQuestions = JSON.parse(data.result) as QuizQuestion[];
            setQuizQuestions(parsedQuestions);
          }
        } catch (error) {
          console.error('Failed to parse quiz questions:', error);
        }
        
        // 获取详细的评测信息
        if (data.assessments && data.assessments.length > 0) {
          const assessmentDetail = data.assessments[0];
          setAssessment(assessmentDetail);
          
          // 解析写作评估数据
          try {
            if (assessmentDetail.assess_writing_evaluation) {
              const parsedWriting = JSON.parse(assessmentDetail.assess_writing_evaluation) as WritingEvaluation;
              setWritingEvaluation(parsedWriting);
            }
          } catch (error) {
            console.error('Failed to parse writing evaluation:', error);
          }
          
          // 解析学习计划数据
          try {
            if (assessmentDetail.study_plan_tpl) {
              const parsedStudyPlan = JSON.parse(assessmentDetail.study_plan_tpl) as DailyPlan[];
              setStudyPlan(parsedStudyPlan);
            }
          } catch (error) {
            console.error('Failed to parse study plan:', error);
          }
        }
      } else {
        toast.error(response?.msg || 'Failed to load assessment data');
      }
    } catch (error) {
      console.error('Failed to fetch assessment data:', error);
      toast.error('Failed to load assessment data');
    } finally {
      setLoading(false);
    }
  };

  const formatLevel = (level: number): string => {
    return LEVEL_MAP[level] || `Level ${level}`;
  };

  const getScoreColor = (score: number, maxScore: number) => {
    const percentage = (score / maxScore) * 100;
    if (percentage >= 80) return 'text-green-600';
    if (percentage >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBgColor = (score: number, maxScore: number) => {
    const percentage = (score / maxScore) * 100;
    if (percentage >= 80) return 'bg-green-100';
    if (percentage >= 60) return 'bg-yellow-100';
    return 'bg-red-100';
  };

  const parseSuggestions = (suggestions: string): string[] => {
    return suggestions.split('|').filter(s => s.trim().length > 0);
  };

  const getQuestionTypeLabel = (type: string): string => {
    switch (type) {
      case 'single_choice': return 'Single Choice';
      case 'multiple_choice': return 'Multiple Choice';
      case 'cloze': return 'Cloze Test';
      case 'writing': return 'Writing Task';
      default: return type;
    }
  };

  const getQuestionTypeColor = (type: string): string => {
    switch (type) {
      case 'single_choice': return 'bg-blue-100 text-blue-800';
      case 'multiple_choice': return 'bg-green-100 text-green-800';
      case 'cloze': return 'bg-purple-100 text-purple-800';
      case 'writing': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Assessment Results</h2>
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
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600">Loading assessment data...</span>
            </div>
          ) : assessmentData ? (
            <div className="space-y-6">
              {/* Overall Score */}
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">Overall Assessment</h3>
                    <p className="text-gray-600">Comprehensive evaluation of student's English proficiency</p>
                  </div>
                  <div className="text-right">
                    <div className={`text-3xl font-bold ${getScoreColor(Number(assessment?.assess_score || assessmentData.score), Number(assessment?.assess_max_score || 100))}`}>
                      {assessment?.assess_score || assessmentData.score}
                    </div>
                    <div className="text-gray-500">
                      / {assessment?.assess_max_score || 100} points
                    </div>
                    <div className="text-sm text-gray-500 mt-1">
                      Raw Score: {assessmentData.score}/100
                    </div>
                    <div className="text-sm text-gray-500">
                      Level: {assessment?.assess_level_estimate || 'Not assessed'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Level Assessment */}
              {assessment && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <div className="flex items-center mb-4">
                      <FaBullseye className="text-blue-600 mr-2" />
                      <h3 className="text-lg font-semibold text-gray-900">Current Level</h3>
                    </div>
                    <div className="text-2xl font-bold text-blue-600 mb-2">
                      {formatLevel(assessment.init_level)}
                    </div>
                    <p className="text-gray-600 text-sm mb-2">
                      {assessment.assess_level_estimate || `Level ${assessment.init_level} assessment`}
                    </p>
                    <p className="text-gray-500 text-xs">
                      Sub-level: {assessment.init_sub_level}/10
                    </p>
                  </div>

                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <div className="flex items-center mb-4">
                      <FaClock className="text-green-600 mr-2" />
                      <h3 className="text-lg font-semibold text-gray-900">Estimated Duration</h3>
                    </div>
                    <div className="text-2xl font-bold text-green-600 mb-2">
                      {assessment.estimated_duration_days} days
                    </div>
                    <p className="text-gray-600 text-sm">
                      To reach target level
                    </p>
                  </div>
                </div>
              )}

              {/* Overall Comment */}
              {assessment?.assess_over_all_comment && (
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <div className="flex items-center mb-4">
                    <FaChartBar className="text-purple-600 mr-2" />
                    <h3 className="text-lg font-semibold text-gray-900">Overall Evaluation</h3>
                  </div>
                  <p className="text-gray-700 leading-relaxed">
                    {assessment.assess_over_all_comment}
                  </p>
                </div>
              )}

              {/* Strengths and Weaknesses */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {assessment?.assess_strengths && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                    <div className="flex items-center mb-4">
                      <FaArrowUp className="text-green-600 mr-2" />
                      <h3 className="text-lg font-semibold text-green-800">Strengths</h3>
                    </div>
                    <div className="space-y-2">
                      {parseSuggestions(assessment.assess_strengths).map((strength, index) => (
                        <div key={index} className="flex items-start">
                          <div className="w-2 h-2 bg-green-400 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                          <p className="text-green-700 leading-relaxed">{strength}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {assessment?.assess_weaknesses && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                    <div className="flex items-center mb-4">
                      <FaArrowDown className="text-red-600 mr-2" />
                      <h3 className="text-lg font-semibold text-red-800">Areas for Improvement</h3>
                    </div>
                    <div className="space-y-2">
                      {parseSuggestions(assessment.assess_weaknesses).map((weakness, index) => (
                        <div key={index} className="flex items-start">
                          <div className="w-2 h-2 bg-red-400 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                          <p className="text-red-700 leading-relaxed">{weakness}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Suggestions */}
              {assessment?.assess_suggestions && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                  <div className="flex items-center mb-4">
                    <FaLightbulb className="text-blue-600 mr-2" />
                    <h3 className="text-lg font-semibold text-blue-800">Recommendations</h3>
                  </div>
                  <div className="space-y-2">
                    {parseSuggestions(assessment.assess_suggestions).map((suggestion, index) => (
                      <div key={index} className="flex items-start">
                        <div className="w-2 h-2 bg-blue-400 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                        <p className="text-blue-700 leading-relaxed">{suggestion}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Writing Evaluation */}
              {writingEvaluation && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                  <div className="flex items-center mb-4">
                    <FaStar className="text-yellow-600 mr-2" />
                    <h3 className="text-lg font-semibold text-yellow-800">Writing Evaluation</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white rounded-lg p-4">
                      <h4 className="font-semibold text-gray-900 mb-3">Task 1</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Coherence:</span>
                          <span className="font-medium">{writingEvaluation.task1.coherence}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Grammar:</span>
                          <span className="font-medium">{writingEvaluation.task1.grammar}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Score:</span>
                          <span className="font-medium text-blue-600">{writingEvaluation.task1.score}/5</span>
                        </div>
                      </div>
                    </div>
                    <div className="bg-white rounded-lg p-4">
                      <h4 className="font-semibold text-gray-900 mb-3">Task 2</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Coherence:</span>
                          <span className="font-medium">{writingEvaluation.task2.coherence}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Grammar:</span>
                          <span className="font-medium">{writingEvaluation.task2.grammar}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Score:</span>
                          <span className="font-medium text-blue-600">{writingEvaluation.task2.score}/5</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Quiz Questions */}
              {quizQuestions.length > 0 && (
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Quiz Questions ({quizQuestions.length})</h3>
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {quizQuestions.map((question, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${getQuestionTypeColor(question.type)}`}>
                            {getQuestionTypeLabel(question.type)}
                          </span>
                          <div className="flex items-center">
                            {question.correct ? (
                              <FaCheckCircle className="text-green-500 mr-1" />
                            ) : (
                              <FaTimesCircle className="text-red-500 mr-1" />
                            )}
                            <span className={`text-sm font-medium ${question.correct ? 'text-green-600' : 'text-red-600'}`}>
                              {question.correct ? 'Correct' : 'Incorrect'}
                            </span>
                          </div>
                        </div>
                        
                        <div className="mb-3">
                          <p className="font-medium text-gray-900 mb-2">{question.question}</p>
                          
                          {question.options && question.options.length > 0 && (
                            <div className="space-y-1">
                              {question.options.map((option, optIndex) => (
                                <div key={optIndex} className="text-sm text-gray-600">
                                  • {option}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-gray-500">Correct Answer:</span>
                            <div className="font-medium text-green-600">{question.answer}</div>
                          </div>
                          <div>
                            <span className="text-gray-500">Student Answer:</span>
                            <div className={`font-medium ${question.correct ? 'text-green-600' : 'text-red-600'}`}>
                              {question.user_answer}
                            </div>
                          </div>
                        </div>
                        
                        {question.explanation && (
                          <div className="mt-3 p-3 bg-gray-50 rounded">
                            <span className="text-gray-500 text-sm">Explanation:</span>
                            <p className="text-sm text-gray-700 mt-1">{question.explanation}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Study Plan */}
              {studyPlan.length > 0 && (
                <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-6">
                  <div className="flex items-center mb-4">
                    <FaClock className="text-indigo-600 mr-2" />
                    <h3 className="text-lg font-semibold text-indigo-800">Recommended Study Plan ({assessment?.estimated_duration_days} days)</h3>
                  </div>
                  <div className="space-y-4 max-h-64 overflow-y-auto">
                    {studyPlan.map((day, index) => (
                      <div key={index} className="bg-white rounded-lg p-4 border border-indigo-100">
                        <div className="flex items-center mb-3">
                          <div className="w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3">
                            {day.day}
                          </div>
                          <h4 className="font-semibold text-gray-900">{day.objective}</h4>
                        </div>
                        <div className="space-y-2">
                          {day.tasks.map((task, taskIndex) => (
                            <div key={taskIndex} className="flex items-start">
                              <div className="w-2 h-2 bg-indigo-400 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                              <p className="text-sm text-gray-700">{task}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Assessment Details */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Assessment Details</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Assessment ID:</span>
                    <div className="font-medium">{assessmentData.id}</div>
                  </div>
                  <div>
                    <span className="text-gray-500">Date:</span>
                    <div className="font-medium">
                      {new Date(assessmentData.add_time).toLocaleDateString()}
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-500">Time:</span>
                    <div className="font-medium">
                      {new Date(assessmentData.add_time).toLocaleTimeString()}
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-500">Status:</span>
                    <div className="font-medium text-green-600">Completed</div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📊</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No Assessment Data Found
              </h3>
              <p className="text-gray-600">
                The assessment data could not be loaded. Please try again later.
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