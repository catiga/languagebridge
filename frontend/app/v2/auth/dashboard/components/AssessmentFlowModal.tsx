'use client';

import React, { useState, useEffect } from 'react';
import { FaTimes, FaPlay, FaCheck, FaEdit, FaTrash, FaPlus, FaSave } from 'react-icons/fa';
import { apiClient } from '../../../../utils/api';
import { toast } from 'react-toastify';

interface AssessmentFlowModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: any;
  onStatusChange: () => void;
}

interface Question {
  id: number;
  type: string;
  question: string;
  options?: string[];
  answer?: string;
  explanation?: string;
  points: number;
  time_limit?: number;
}

interface Assessment {
  id: number;
  title: string;
  description: string;
  total_time: number;
  passing_score: number;
  questions: Question[];
}

interface StudyPlanTemplate {
  week: number;
  objective: string;
  tasks: {
    content: string;
    id: string;
    priority: string;
  }[];
}

// 后端期望的 DailyPlan 格式
interface DailyPlan {
  week: number;
  objective: string;
  tasks: {
    content: string;
    id: string;
    priority: string;
  }[];
}

export default function AssessmentFlowModal({ 
  isOpen, 
  onClose, 
  student, 
  onStatusChange 
}: AssessmentFlowModalProps) {
  const [currentStep, setCurrentStep] = useState<'generating' | 'exam' | 'evaluating' | 'result' | 'template'>('generating');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [examId, setExamId] = useState<number | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<{[key: number]: string}>({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isStarted, setIsStarted] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(1800); // 30 minutes
  const [assessmentResult, setAssessmentResult] = useState<any>(null);
  const [learningGoal, setLearningGoal] = useState<any>(null);
  const [studyPlanTemplate, setStudyPlanTemplate] = useState<StudyPlanTemplate[]>([]);
  const [editingTask, setEditingTask] = useState<{weekIndex: number, dayIndex: number, taskIndex: number} | null>(null);
  const [editingContent, setEditingContent] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // 重置状态当模态框打开或学生改变时
  useEffect(() => {
    if (isOpen && student) {
      setCurrentStep('generating');
      setIsGenerating(false);
      setGenerationProgress(0);
      setExamId(null);
      setQuestions([]);
      setAnswers({});
      setCurrentQuestionIndex(0);
      setIsStarted(false);
      setIsSubmitted(false);
      setTimeLeft(1800);
      setAssessmentResult(null);
      setLearningGoal(null);
      setStudyPlanTemplate([]);
      setEditingTask(null);
      setEditingContent('');
      setStartDate('');
      setEndDate('');
    }
  }, [isOpen, student]);

  // 根据学生状态决定初始步骤
  useEffect(() => {
    if (student && student.active_goals?.[0]) {
      const goal = student.active_goals[0];
      if (goal.status === '00') {
        setCurrentStep('generating');
      } else if (goal.status === '05') {
        setCurrentStep('evaluating');
      } else if (goal.status === '06') {
        setCurrentStep('result');
        loadAssessmentResult();
      } else if (goal.status === '10') {
        setCurrentStep('template');
        loadAssessmentResult();
      }
    }
  }, [student]);

  const handleStatusBasedAction = async () => {
    if (!student || !student.active_goals?.[0]) return;

    const goal = student.active_goals[0];
    
    switch (goal.status) {
      case '00':
        await generateAssessment();
        break;
      case '01':
      case '02':
        await startEvaluation();
        break;
      case '05':
        // 已经在evaluating状态，不需要额外操作
        break;
      case '06':
        setCurrentStep('result');
        await loadAssessmentResult();
        break;
      case '10':
        setCurrentStep('template');
        await loadAssessmentResult();
        break;
      default:
        console.log('Unknown status:', goal.status);
    }
  };

  const generateAssessment = async () => {
    if (!student || !student.active_goals?.[0]) return;

    setIsGenerating(true);
    setCurrentStep('generating');
    setGenerationProgress(0);

    try {
      const response = await apiClient.get('/spwapi/auth/aiagent/assessment/generate', {
        overview_id: student.active_goals[0].id
      }) as any;

      if (response && response.code === 0) {
        setExamId(response.data.exam_id);
        setQuestions(response.data.ai_reply.questions);
        setCurrentStep('exam');
        setIsGenerating(false);
      } else {
        toast.error(response?.msg || 'Failed to generate assessment');
        setIsGenerating(false);
      }
    } catch (error) {
      console.error('Failed to generate assessment:', error);
      toast.error('Failed to generate assessment');
      setIsGenerating(false);
    }
  };

  const startEvaluation = async () => {
    if (!student || !student.active_goals?.[0]) return;

    setCurrentStep('evaluating');
    
    try {
      const response = await apiClient.get('/spwapi/auth/aiagent/assessment/evaluate', {
        overview_id: student.active_goals[0].id
      }) as any;

      if (response && response.code === 0) {
        // 开始轮询状态变化
        const pollForStatusChange = async (): Promise<any> => {
          try {
            const statusResponse = await apiClient.get('/spwapi/auth/planner/pull', {
              student_id: student.id
            }) as any;

            if (statusResponse && statusResponse.code === 0) {
              const goal = statusResponse.data[0];
              if (goal.status === '06') {
                setCurrentStep('result');
                await loadAssessmentResult();
                return;
              } else if (goal.status === '01') {
                toast.error('Assessment evaluation failed');
                setCurrentStep('result');
                return;
              }
            }

            // 继续轮询
            setTimeout(pollForStatusChange, 2000);
          } catch (error) {
            console.error('Failed to poll status:', error);
            setTimeout(pollForStatusChange, 2000);
          }
        };

        pollForStatusChange();
      } else {
        toast.error(response?.msg || 'Failed to start evaluation');
      }
    } catch (error) {
      console.error('Failed to start evaluation:', error);
      toast.error('Failed to start evaluation');
    }
  };

  const retryEvaluation = async () => {
    await startEvaluation();
  };

  const pollStatusChange = () => {
    if (!student || !student.id) return;
    
    const pollForStatusChange = async () => {
      try {
        const response = await apiClient.get('/spwapi/auth/planner/pull', {
          student_id: student.id
        }) as any;

        if (response && response.code === 0) {
          const goal = response.data[0];
          if (goal.status === '06') {
            setCurrentStep('result');
            await loadAssessmentResult();
            onStatusChange();
          } else if (goal.status === '01') {
            toast.error('Assessment evaluation failed');
            setCurrentStep('result');
          }
        }
      } catch (error) {
        console.error('Failed to poll status:', error);
      }
    };

    pollForStatusChange();
  };

  const loadAssessmentResult = async () => {
    if (!student || !student.active_goals?.[0]) return;

    try {
      const response = await apiClient.get('/spwapi/auth/aiagent/assessment/view', {
        overview_id: student.active_goals[0].id
      }) as any;

      if (response && response.code === 0) {
        const assessmentData = response.data[0];
        
        // 解析评估结果中的题目数据
        if (assessmentData.result) {
          try {
            const questions = JSON.parse(assessmentData.result);
            setAssessmentResult({ ...assessmentData, questions });
          } catch (e) {
            console.error('Failed to parse assessment result:', e);
            setAssessmentResult(assessmentData);
          }
        } else {
          setAssessmentResult(assessmentData);
        }

        // 解析学习计划模板
        if (assessmentData.assessments && assessmentData.assessments[0]?.study_plan_tpl) {
          try {
            const template = JSON.parse(assessmentData.assessments[0].study_plan_tpl);
            setStudyPlanTemplate(template);
          } catch (e) {
            console.error('Failed to parse study plan template:', e);
            setStudyPlanTemplate([]);
          }
        }

        // 设置学习目标信息
        if (assessmentData.assessments && assessmentData.assessments[0]) {
          const assessment = assessmentData.assessments[0];
          setLearningGoal({
            score: assessment.assess_score,
            max_score: assessment.assess_max_score,
            level_estimate: assessment.assess_level_estimate,
            overall_comment: assessment.assess_over_all_comment,
            strengths: assessment.assess_strengths,
            weaknesses: assessment.assess_weaknesses,
            suggestions: assessment.assess_suggestions,
            estimated_duration_days: assessment.estimated_duration_days
          });
        }
      } else {
        toast.error(response?.msg || 'Failed to load assessment result');
      }
    } catch (error) {
      console.error('Failed to load assessment result:', error);
      toast.error('Failed to load assessment result');
    }
  };

  const handleStartExam = () => {
    setIsStarted(true);
    setCurrentQuestionIndex(0);
    setAnswers({});
  };

  const handleAnswerChange = (questionId: number, answer: string) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
  };

  const handleSubmit = async () => {
    if (!examId) {
      toast.error('No exam ID available');
      return;
    }

    setIsSubmitted(true);

    try {
      const response = await apiClient.post('/spwapi/auth/aiagent/selfassessment/exam/mark', {
        exam_id: examId,
        answers: answers
      }) as any;

      if (response && response.code === 0) {
        setCurrentStep('evaluating');
        toast.success('Assessment submitted successfully');
        
        // 开始轮询状态变化
        const pollForStatusChange = async () => {
          try {
            const statusResponse = await apiClient.get('/spwapi/auth/planner/pull', {
              student_id: student.id
            }) as any;

            if (statusResponse && statusResponse.code === 0) {
              const goal = statusResponse.data[0];
              if (goal.status === '06') {
                setCurrentStep('result');
                await loadAssessmentResult();
                onStatusChange();
                return;
              } else if (goal.status === '01') {
                toast.error('Assessment evaluation failed');
                setCurrentStep('result');
                return;
              }
            }

            // 继续轮询
            setTimeout(pollForStatusChange, 2000);
          } catch (error) {
            console.error('Failed to poll status:', error);
            setTimeout(pollForStatusChange, 2000);
          }
        };

        pollForStatusChange();
      } else {
        toast.error(response?.msg || 'Failed to submit assessment');
        setIsSubmitted(false);
      }
    } catch (error) {
      console.error('Failed to submit assessment:', error);
      toast.error('Failed to submit assessment');
      setIsSubmitted(false);
    }
  };

  const handleUpdateTemplate = async () => {
    try {
      // 将 studyPlanTemplate 转换为后端期望的 DailyPlan 格式
      const dailyPlans: DailyPlan[] = studyPlanTemplate.map(week => ({
        week: week.week,
        objective: week.objective,
        tasks: week.tasks.map(task => ({
          content: task.content,
          id: task.id,
          priority: task.priority
        }))
      }));

      console.log('Sending template data:', dailyPlans);

      const response = await apiClient.post('/spwapi/auth/aiagent/assessment/studyplan/template/update', {
        overview_id: student.active_goals?.[0]?.id,
        template: dailyPlans
      }) as any;
      
      if (response && response.code === 0) {
        toast.success('Study plan template updated successfully!');
      } else {
        toast.error(response?.msg || 'Failed to update template');
      }
    } catch (error) {
      console.error('Failed to update template:', error);
      toast.error('Failed to update template');
    }
  };

  const calculateEndDate = (startDateStr: string, durationDays: number) => {
    if (!startDateStr || !durationDays) return '';
    
    const startDate = new Date(startDateStr);
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + durationDays - 1); // 减1是因为包含开始日期
    
    return endDate.toISOString().split('T')[0]; // 返回 YYYY-MM-DD 格式
  };

  const handleStartDateChange = (date: string) => {
    setStartDate(date);
    if (learningGoal && learningGoal.estimated_duration_days) {
      const calculatedEndDate = calculateEndDate(date, learningGoal.estimated_duration_days);
      setEndDate(calculatedEndDate);
    }
  };

  const handleGenerateStudyPlan = async () => {
    if (!startDate || !endDate) {
      toast.error('Please select a start date');
      return;
    }

    try {
      const response = await apiClient.post('/spwapi/auth/aiagent/assessment/studyplan/generate', {
        overview_id: student.active_goals?.[0]?.id,
        start_date: startDate,
        end_date: endDate
      }) as any;

      if (response && response.code === 0) {
        toast.success('Study plan generated successfully!');
        onStatusChange();
        onClose();
      } else {
        toast.error(response?.msg || 'Failed to generate study plan');
      }
    } catch (error) {
      console.error('Failed to generate study plan:', error);
      toast.error('Failed to generate study plan');
    }
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const renderGeneratingStep = () => (
    <div className="text-center py-12">
      <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <div className="w-8 h-8 bg-blue-600 rounded-full animate-pulse"></div>
      </div>
      <h3 className="text-xl font-semibold text-gray-900 mb-2">Generating AI Assessment</h3>
      <p className="text-gray-600 mb-4">Our AI is analyzing the student's profile and creating personalized questions...</p>
      <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
        <div 
          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
          style={{ width: `${generationProgress}%` }}
        ></div>
      </div>
      <p className="text-sm text-gray-500">{generationProgress}% Complete</p>
    </div>
  );

  const renderExamStep = () => {
    if (!isStarted) {
      return (
        <div className="text-center py-12">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Assessment Ready</h3>
          <p className="text-gray-600 mb-6">
            The AI has generated {questions.length} personalized questions for {student?.name}.
            You have 30 minutes to complete this assessment.
          </p>
          <button
            onClick={handleStartExam}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <FaPlay className="inline mr-2" />
            Start Assessment
          </button>
        </div>
      );
    }

    if (isSubmitted) {
      return (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FaCheck className="w-8 h-8 text-green-600" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Assessment Submitted</h3>
          <p className="text-gray-600">Your answers have been submitted. AI is now evaluating your responses...</p>
        </div>
      );
    }

    const currentQuestion = questions[currentQuestionIndex];
    if (!currentQuestion) return null;

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between bg-gray-50 p-4 rounded-lg">
          <div className="text-sm text-gray-600">
            Question {currentQuestionIndex + 1} of {questions.length}
          </div>
          <div className="text-sm font-medium text-red-600">
            Time Left: {formatTime(timeLeft)}
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">{currentQuestion.question}</h3>
          
          {currentQuestion.type === 'single_choice' && currentQuestion.options && (
            <div className="space-y-3">
              {currentQuestion.options.map((option, index) => (
                <label key={index} className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="radio"
                    name={`question-${currentQuestion.id}`}
                    value={option}
                    checked={answers[currentQuestion.id] === option}
                    onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
                    className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                  />
                  <span className="text-gray-900">{option}</span>
                </label>
              ))}
            </div>
          )}

          {currentQuestion.type === 'multiple_choice' && currentQuestion.options && (
            <div className="space-y-3">
              {currentQuestion.options.map((option, index) => (
                <label key={index} className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    value={option}
                    checked={answers[currentQuestion.id]?.includes(option) || false}
                    onChange={(e) => {
                      const currentAnswers = answers[currentQuestion.id]?.split(';').filter(Boolean) || [];
                      if (e.target.checked) {
                        currentAnswers.push(option);
                      } else {
                        const index = currentAnswers.indexOf(option);
                        if (index > -1) {
                          currentAnswers.splice(index, 1);
                        }
                      }
                      handleAnswerChange(currentQuestion.id, currentAnswers.join(';'));
                    }}
                    className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                  />
                  <span className="text-gray-900">{option}</span>
                </label>
              ))}
            </div>
          )}

          {currentQuestion.type === 'cloze' && (
            <div className="space-y-3">
              <input
                type="text"
                value={answers[currentQuestion.id] || ''}
                onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
                placeholder="Enter your answer..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}

          {currentQuestion.type === 'writing' && (
            <div className="space-y-3">
              <textarea
                value={answers[currentQuestion.id] || ''}
                onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
                placeholder="Write your answer here..."
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}
        </div>

        <div className="flex justify-between">
          <button
            onClick={() => setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))}
            disabled={currentQuestionIndex === 0}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          
          {currentQuestionIndex === questions.length - 1 ? (
            <button
              onClick={handleSubmit}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              Submit Assessment
            </button>
          ) : (
            <button
              onClick={() => setCurrentQuestionIndex(Math.min(questions.length - 1, currentQuestionIndex + 1))}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Next
            </button>
          )}
        </div>
      </div>
    );
  };

  const renderEvaluatingStep = () => {
    const handleCheckStatus = () => {
      pollStatusChange();
    };

    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <div className="w-8 h-8 bg-purple-600 rounded-full animate-spin"></div>
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">AI is Evaluating</h3>
        <p className="text-gray-600 mb-6">
          Our AI is analyzing your assessment responses and generating personalized recommendations...
        </p>
        <button
          onClick={handleCheckStatus}
          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
        >
          Check Status
        </button>
      </div>
    );
  };

  const renderResultStep = () => (
    <div className="space-y-6">
      {/* Assessment Summary */}
      {learningGoal && (
        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Assessment Results</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{learningGoal.score}/{learningGoal.max_score}</div>
              <div className="text-sm text-gray-600">Score</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{learningGoal.level_estimate}</div>
              <div className="text-sm text-gray-600">Level Estimate</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">{learningGoal.estimated_duration_days}</div>
              <div className="text-sm text-gray-600">Days to Target</div>
            </div>
          </div>

          {learningGoal.overall_comment && (
            <div className="mb-6">
              <h4 className="font-medium text-gray-900 mb-2">Overall Assessment</h4>
              <p className="text-gray-700 bg-gray-50 p-4 rounded-lg">{learningGoal.overall_comment}</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {learningGoal.strengths && (
              <div>
                <h4 className="font-medium text-green-700 mb-2">Strengths</h4>
                <div className="text-sm text-gray-700">
                  {learningGoal.strengths.split('|').map((strength: string, index: number) => (
                    <div key={index} className="flex items-center mb-1">
                      <span className="text-green-500 mr-2">✓</span>
                      {strength.trim()}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {learningGoal.weaknesses && (
              <div>
                <h4 className="font-medium text-orange-700 mb-2">Areas for Improvement</h4>
                <div className="text-sm text-gray-700">
                  {learningGoal.weaknesses.split('|').map((weakness: string, index: number) => (
                    <div key={index} className="flex items-center mb-1">
                      <span className="text-orange-500 mr-2">•</span>
                      {weakness.trim()}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {learningGoal.suggestions && (
            <div className="mt-6">
              <h4 className="font-medium text-blue-700 mb-2">Recommendations</h4>
              <div className="text-sm text-gray-700">
                {learningGoal.suggestions.split('|').map((suggestion: string, index: number) => (
                  <div key={index} className="flex items-center mb-1">
                    <span className="text-blue-500 mr-2">→</span>
                    {suggestion.trim()}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Study Plan Template Preview */}
      {studyPlanTemplate && studyPlanTemplate.length > 0 && (
        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Study Plan Template Preview</h3>
          <p className="text-gray-600 mb-4">Here's a preview of your personalized study plan template:</p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {studyPlanTemplate.slice(0, 3).map((week: any, weekIndex: number) => (
              <div key={weekIndex} className="border border-gray-200 rounded-lg p-4">
                <h5 className="font-semibold text-gray-900 mb-2">Week {week.week}</h5>
                <p className="text-gray-600 mb-3 text-sm">{week.objective}</p>
                <div className="space-y-2">
                  {week.tasks && week.tasks.slice(0, 2).map((task: any, taskIndex: number) => (
                    <div key={taskIndex} className="flex items-center space-x-3 p-2 bg-gray-50 rounded">
                      <span className="text-sm text-gray-900 flex-1">{task.content}</span>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        task.priority === 'high' ? 'bg-red-100 text-red-800' :
                        task.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {task.priority}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          
          {studyPlanTemplate.length > 3 && (
            <p className="text-sm text-gray-500 mt-4 text-center">
              + {studyPlanTemplate.length - 3} more weeks with {studyPlanTemplate.slice(3).reduce((acc: number, week: any) => acc + (week.tasks?.length || 0), 0)} additional tasks
            </p>
          )}
        </div>
      )}

      <div className="flex justify-center">
        <button
          onClick={() => setCurrentStep('template')}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          View & Edit Study Plan Template
        </button>
      </div>
    </div>
  );

  const renderTemplateStep = () => {
    const handleEditTask = (weekIndex: number, taskIndex: number, content: string) => {
      setEditingTask({ weekIndex, dayIndex: 0, taskIndex });
      setEditingContent(content);
    };

    const handleSaveTask = () => {
      if (editingTask) {
        const newTemplate = [...studyPlanTemplate];
        newTemplate[editingTask.weekIndex].tasks[editingTask.taskIndex].content = editingContent;
        setStudyPlanTemplate(newTemplate);
        setEditingTask(null);
        setEditingContent('');
      }
    };

    const handleAddTask = (weekIndex: number) => {
      const newTemplate = [...studyPlanTemplate];
      const newTask = {
        id: `task-${Date.now()}`,
        content: 'New task',
        priority: 'medium'
      };
      newTemplate[weekIndex].tasks.push(newTask);
      setStudyPlanTemplate(newTemplate);
    };

    const handleDeleteTask = (weekIndex: number, taskIndex: number) => {
      const newTemplate = [...studyPlanTemplate];
      newTemplate[weekIndex].tasks.splice(taskIndex, 1);
      setStudyPlanTemplate(newTemplate);
    };

    const handlePriorityChange = (weekIndex: number, taskIndex: number, priority: string) => {
      const newTemplate = [...studyPlanTemplate];
      newTemplate[weekIndex].tasks[taskIndex].priority = priority;
      setStudyPlanTemplate(newTemplate);
    };

    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Study Plan Template</h3>
          
          <div className="space-y-6">
            {studyPlanTemplate && studyPlanTemplate.length > 0 ? (
              studyPlanTemplate.map((week, weekIndex) => (
                <div key={weekIndex} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h4 className="font-semibold text-gray-900">Week {week.week}</h4>
                      <p className="text-gray-600 text-sm">{week.objective}</p>
                    </div>
                    <button
                      onClick={() => handleAddTask(weekIndex)}
                      className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                    >
                      <FaPlus className="inline mr-1" />
                      Add Task
                    </button>
                  </div>
                  
                  <div className="space-y-2">
                    {week.tasks && week.tasks.map((task, taskIndex) => (
                      <div key={taskIndex} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                        {editingTask && 
                         editingTask.weekIndex === weekIndex && 
                         editingTask.taskIndex === taskIndex ? (
                          <div className="flex-1 flex space-x-2">
                            <input
                              type="text"
                              value={editingContent}
                              onChange={(e) => setEditingContent(e.target.value)}
                              className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="Enter task content..."
                            />
                            <select
                              value={task.priority}
                              onChange={(e) => handlePriorityChange(weekIndex, taskIndex, e.target.value)}
                              className="px-2 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                              <option value="high">High</option>
                              <option value="medium">Medium</option>
                              <option value="low">Low</option>
                            </select>
                            <button
                              onClick={handleSaveTask}
                              className="px-3 py-2 bg-green-600 text-white rounded-md text-sm hover:bg-green-700"
                            >
                              <FaCheck className="inline" />
                            </button>
                            <button
                              onClick={() => setEditingTask(null)}
                              className="px-3 py-2 bg-gray-600 text-white rounded-md text-sm hover:bg-gray-700"
                            >
                              <FaTimes className="inline" />
                            </button>
                          </div>
                        ) : (
                          <>
                            <span className="flex-1 text-sm text-gray-900">{task.content}</span>
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              task.priority === 'high' ? 'bg-red-100 text-red-800' :
                              task.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-green-100 text-green-800'
                            }`}>
                              {task.priority}
                            </span>
                            <button
                              onClick={() => handleEditTask(weekIndex, taskIndex, task.content)}
                              className="px-2 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                              title="Edit task"
                            >
                              <FaEdit className="inline" />
                            </button>
                            <button
                              onClick={() => handleDeleteTask(weekIndex, taskIndex)}
                              className="px-2 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                              title="Delete task"
                            >
                              <FaTrash className="inline" />
                            </button>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>No study plan template available.</p>
              </div>
            )}
          </div>
        </div>
        
        <div className="space-y-4">
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4 relative overflow-hidden">
            {/* AI 装饰元素 */}
            <div className="absolute top-0 right-0 w-12 h-12 opacity-10">
              <div className="w-full h-full bg-gradient-to-br from-blue-400 to-indigo-600 rounded-full animate-pulse"></div>
            </div>
            
            <div className="relative z-10">
              <div className="flex items-center mb-2">
                <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mr-2">
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                </div>
                <h4 className="font-medium text-blue-900">AI Template Manager</h4>
              </div>
              <p className="text-sm text-blue-700 mb-3">
                💾 Save your customized template to our AI system. This preserves your modifications for future use and AI learning.
              </p>
              <button
                onClick={handleUpdateTemplate}
                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 transform hover:scale-105 shadow-md hover:shadow-lg"
              >
                <FaSave className="inline mr-2" />
                Save to AI System
              </button>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4 relative overflow-hidden">
            {/* AI 装饰元素 */}
            <div className="absolute top-0 right-0 w-16 h-16 opacity-10">
              <div className="w-full h-full bg-gradient-to-br from-green-400 to-emerald-600 rounded-full animate-pulse"></div>
            </div>
            <div className="absolute bottom-0 left-0 w-8 h-8 opacity-5">
              <div className="w-full h-full bg-gradient-to-br from-blue-400 to-cyan-600 rounded-full animate-ping"></div>
            </div>
            
            <div className="relative z-10">
              <div className="flex items-center mb-2">
                <div className="w-6 h-6 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center mr-2">
                  <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                </div>
                <h4 className="font-medium text-green-900">AI-Powered Study Plan Generator</h4>
              </div>
              <p className="text-sm text-green-700 mb-3">
                🤖 Our AI analyzes your assessment results and creates a personalized study plan with optimal timing and task distribution. This will generate real, actionable tasks for the student.
              </p>
            
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => handleStartDateChange(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                
                {startDate && endDate && (
                  <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 rounded-lg p-3 relative overflow-hidden">
                    {/* AI 计算装饰 */}
                    <div className="absolute top-0 right-0 w-12 h-12 opacity-5">
                      <div className="w-full h-full bg-gradient-to-br from-blue-400 to-cyan-600 rounded-full animate-spin"></div>
                    </div>
                    
                    <div className="relative z-10">
                      <div className="flex items-center mb-1">
                        <div className="w-4 h-4 bg-gradient-to-r from-blue-500 to-cyan-600 rounded-full flex items-center justify-center mr-2">
                          <div className="w-1 h-1 bg-white rounded-full"></div>
                        </div>
                        <div className="text-sm text-blue-700 font-medium">AI-Optimized Duration</div>
                      </div>
                      <div className="text-sm font-semibold text-blue-900 mb-1">
                        {startDate} to {endDate}
                      </div>
                      <div className="text-xs text-blue-600 font-medium">
                        ✨ Optimized for {learningGoal?.estimated_duration_days || 0} days based on assessment analysis
                      </div>
                    </div>
                  </div>
                )}
                
                <button
                  onClick={handleGenerateStudyPlan}
                  className="w-full px-4 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl relative overflow-hidden group"
                >
                  {/* AI 按钮装饰 */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-0 group-hover:opacity-20 transition-opacity duration-300 transform -skew-x-12 -translate-x-full group-hover:translate-x-full"></div>
                  
                  <div className="relative z-10 flex items-center justify-center">
                    <div className="w-5 h-5 bg-white rounded-full flex items-center justify-center mr-2 animate-pulse">
                      <FaPlay className="text-green-600 text-xs" />
                    </div>
                    <span className="font-medium">🤖 Generate AI-Powered Study Plan</span>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Assessment Flow</h2>
              <p className="text-blue-100 mt-1">{student?.name}</p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-blue-100 transition-colors p-2"
            >
              <FaTimes size={20} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-100px)] p-6">
          {currentStep === 'generating' && renderGeneratingStep()}
          {currentStep === 'exam' && renderExamStep()}
          {currentStep === 'evaluating' && renderEvaluatingStep()}
          {currentStep === 'result' && renderResultStep()}
          {currentStep === 'template' && renderTemplateStep()}
        </div>
      </div>
    </div>
  );
} 