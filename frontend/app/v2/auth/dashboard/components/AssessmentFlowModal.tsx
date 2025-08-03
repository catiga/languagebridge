'use client';

import React, { useState, useEffect } from 'react';
import { apiClient } from '../../../../utils/api';
import { toast } from 'react-toastify';
import { 
  FaTimes, 
  FaPlay, 
  FaPause, 
  FaCheck, 
  FaClock,
  FaRefresh,
  FaEye,
  FaEdit,
  FaPlus,
  FaTrash,
  FaStar,
  FaSave
} from 'react-icons/fa';

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

export default function AssessmentFlowModal({ 
  isOpen, 
  onClose, 
  student, 
  onStatusChange 
}: AssessmentFlowModalProps) {
  const [currentStep, setCurrentStep] = useState<'generating' | 'exam' | 'evaluating' | 'result' | 'template'>('generating');
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<{[key: number]: string}>({});
  const [timeLeft, setTimeLeft] = useState(1800); // 30分钟
  const [isStarted, setIsStarted] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [evaluating, setEvaluating] = useState(false);
  const [examId, setExamId] = useState<number>(0);
  const [studyPlanTemplate, setStudyPlanTemplate] = useState<StudyPlanTemplate[]>([]);
  const [startDate, setStartDate] = useState('');
  const [showTemplateEditor, setShowTemplateEditor] = useState(false);
  const [assessmentResult, setAssessmentResult] = useState<any>(null);
  const [learningGoal, setLearningGoal] = useState<any>(null);
  const [editingTask, setEditingTask] = useState<{weekIndex: number, dayIndex: number, taskIndex: number} | null>(null);
  const [editingContent, setEditingContent] = useState('');

  useEffect(() => {
    if (isOpen && student) {
      // 重置所有状态
      setAnswers({});
      setCurrentQuestionIndex(0);
      setIsStarted(false);
      setIsSubmitted(false);
      setTimeLeft(1800); // 重置为30分钟
      setExamId(0);
      setAssessmentResult(null);
      setLearningGoal(null);
      setEditingTask(null);
      setEditingContent('');
      handleStatusBasedAction();
    }
  }, [isOpen, student]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isStarted && timeLeft > 0 && !isSubmitted) {
      timer = setTimeout(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            handleSubmit();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearTimeout(timer);
  }, [isStarted, timeLeft, isSubmitted]);

  const handleStatusBasedAction = async () => {
    const status = student.goal_status;
    
    switch (status) {
      case '00':
      case '02':
        // 开始生成评估题目
        await generateAssessment();
        break;
      case '01':
        // AI评估错误，重新评估
        await retryEvaluation();
        break;
      case '05':
        // AI正在评估，显示评估中状态
        setCurrentStep('evaluating');
        break;
      case '06':
        // 评估完成，显示结果和模板
        await loadAssessmentResult();
        break;
      default:
        break;
    }
  };

  const generateAssessment = async () => {
    try {
      setGenerating(true);
      setCurrentStep('generating');
      
      let attempts = 0;
      const maxAttempts = 60; // 最多等待5分钟
      const pollInterval = 5000; // 5秒轮询一次

      const pollForAssessment = async (): Promise<any> => {
        attempts++;
        
        try {
          // 确保有overview_id
          const overviewId = student.active_goals?.[0]?.id;
          if (!overviewId) {
            throw new Error('No overview ID found for student');
          }

          const response = await apiClient.get(`/spwapi/auth/aiagent/assessment/generate?overview_id=${overviewId}`) as any;
          
          if (response && response.code === 0 && response.data) {
            return response;
          } else if (response && response.code === 17) {
            // AI正在处理中，继续等待
            if (attempts >= maxAttempts) {
              throw new Error('Assessment generation timeout. Please try again later.');
            }
            
            // 更新生成状态信息
            const progressMessages = [
              'Analyzing your learning goals...',
              'Generating personalized questions...',
              'Optimizing difficulty levels...',
              'Finalizing assessment content...',
              'Almost ready...'
            ];
            const messageIndex = Math.min(Math.floor(attempts / 10), progressMessages.length - 1);
            
            console.log(`AI is processing... Attempt ${attempts}/${maxAttempts}: ${progressMessages[messageIndex]}`);
            
            await new Promise(resolve => setTimeout(resolve, pollInterval));
            return pollForAssessment();
          } else {
            throw new Error(response?.msg || 'Failed to generate assessment');
          }
        } catch (error) {
          if (attempts >= maxAttempts) throw error;
          
          await new Promise(resolve => setTimeout(resolve, pollInterval));
          return pollForAssessment();
        }
      };

      const response = await pollForAssessment();
      toast.success('Assessment generated successfully!');

      console.log('Assessment generation response:', response);
      console.log('Response data:', response.data);
      console.log('Exam ID from response:', response.data.exam_id);

      const aiReply = response.data.ai_reply;
      const questions = aiReply?.questions || [];

      const processedQuestions = questions.map((q: any, index: number) => ({
        ...q,
        id: index + 1,
        points: q.type === 'writing' ? 20 : q.type === 'multiple_choice' ? 10 : 5,
        time_limit: q.type === 'writing' ? 300 : undefined
      }));

      const examIdFromResponse = response.data.exam_id;
      console.log('Setting exam ID to:', examIdFromResponse);

      const generatedAssessment: Assessment = {
        id: examIdFromResponse || 1,
        title: "AI-Generated English Assessment",
        description: "Personalized assessment created based on your learning goals",
        total_time: 30,
        passing_score: 70,
        questions: processedQuestions
      };

      setAssessment(generatedAssessment);
      setExamId(examIdFromResponse || 1);
      setTimeLeft(generatedAssessment.total_time * 60);
      setCurrentStep('exam');

    } catch (error) {
      console.error('Failed to generate assessment:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to generate assessment');
    } finally {
      setGenerating(false);
    }
  };

  const startEvaluation = async () => {
    try {
      setEvaluating(true);
      const response = await apiClient.get(`/spwapi/auth/aiagent/assessment/evaluate?overview_id=${student.active_goals?.[0]?.id}`) as any;
      
      if (response && response.code === 0) {
        toast.success('Evaluation started successfully');
        setCurrentStep('evaluating');
        // 开始轮询状态变化
        pollStatusChange();
      } else {
        toast.error(response?.msg || 'Failed to start evaluation');
      }
    } catch (error) {
      console.error('Failed to start evaluation:', error);
      toast.error('Failed to start evaluation');
    } finally {
      setEvaluating(false);
    }
  };

  const retryEvaluation = async () => {
    await startEvaluation();
  };

  const pollStatusChange = () => {
    const interval = setInterval(async () => {
      try {
        const response = await apiClient.get(`/spwapi/auth/planner/pull?student_id=${student.id}`) as any;
        if (response && response.code === 0 && response.data.length > 0) {
          const goal = response.data[0];
          if (goal.status === '06') {
            clearInterval(interval);
            onStatusChange();
            await loadAssessmentResult();
          }
        }
      } catch (error) {
        console.error('Failed to poll status:', error);
      }
    }, 5000); // 每5秒检查一次

    // 5分钟后停止轮询
    setTimeout(() => clearInterval(interval), 300000);
  };

  const loadAssessmentResult = async () => {
    try {
      setLoading(true);
      
      // 获取评估结果
      const response = await apiClient.get(`/spwapi/auth/aiagent/assessment/view?overview_id=${student.active_goals?.[0]?.id}`) as any;
      
      if (response && response.code === 0 && response.data && response.data.length > 0) {
        console.log('Assessment result:', response.data[0]);
        const assessmentData = response.data[0];
        setAssessmentResult(assessmentData);
        
        // 解析评估结果中的题目数据
        if (assessmentData.result) {
          try {
            const questions = JSON.parse(assessmentData.result);
            console.log('Parsed questions:', questions);
            setAssessmentResult({ ...assessmentData, questions });
          } catch (e) {
            console.error('Failed to parse assessment result:', e);
            setAssessmentResult(assessmentData);
          }
        }
        
        // 从评估数据中获取学习计划模板
        if (assessmentData.assessments && assessmentData.assessments.length > 0) {
          const assessment = assessmentData.assessments[0];
          console.log('Assessment details:', assessment);
          
          // 设置学习目标信息
          setLearningGoal({
            title: student.active_goals?.[0]?.title || 'Learning Goal',
            description: student.active_goals?.[0]?.description || '',
            start_date: student.active_goals?.[0]?.start_date || '',
            end_date: student.active_goals?.[0]?.end_date || '',
            init_level: assessment.init_level || 1,
            target_level: assessment.init_level + 2 || 3,
            assess_score: assessment.assess_score || 0,
            assess_max_score: assessment.assess_max_score || 15,
            assess_level_estimate: assessment.assess_level_estimate || 'Beginner',
            estimated_duration_days: assessment.estimated_duration_days || 49,
            assess_over_all_comment: assessment.assess_over_all_comment || '',
            assess_strengths: assessment.assess_strengths || '',
            assess_weaknesses: assessment.assess_weaknesses || '',
            assess_suggestions: assessment.assess_suggestions || '',
            learning_tags: assessment.learning_tags || ''
          });
          
          // 解析学习计划模板
          if (assessment.study_plan_tpl) {
            try {
              const template = JSON.parse(assessment.study_plan_tpl);
              console.log('Study plan template:', template);
              setStudyPlanTemplate(template);
            } catch (e) {
              console.error('Failed to parse study plan template:', e);
              setStudyPlanTemplate([]);
            }
          } else {
            setStudyPlanTemplate([]);
          }
        }
      } else {
        toast.error('Failed to load assessment result');
        return;
      }
      
      setCurrentStep('result');
    } catch (error) {
      console.error('Failed to load assessment result:', error);
      toast.error('Failed to load assessment result');
    } finally {
      setLoading(false);
    }
  };

  const handleStartExam = () => {
    setIsStarted(true);
    setAnswers({}); // 重置答案状态
    setCurrentQuestionIndex(0); // 重置到第一题
  };

  const handleAnswerChange = (questionId: number, answer: string) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
  };

  const handleSubmit = async () => {
    if (isSubmitted) return;
    
    setIsSubmitted(true);
    
    try {
      // 构造符合 ExamMarkRequest 格式的数据
      const processedQuestions = assessment?.questions.map((question, index) => {
        const userAnswer = answers[question.id] || '';
        let isCorrect = false;

        // 根据题目类型判断答案是否正确
        switch (question.type) {
          case 'single_choice':
            isCorrect = userAnswer === question.answer;
            break;
          case 'multiple_choice':
            // 多选题答案用分号分隔，需要比较数组
            const userAnswers = userAnswer.split(';').filter(a => a.trim() !== '');
            const correctAnswers = question.answer?.split(';').filter(a => a.trim() !== '') || [];
            isCorrect = userAnswers.length === correctAnswers.length && 
                       userAnswers.every(ans => correctAnswers.includes(ans));
            break;
          case 'cloze':
            // 填空题答案不区分大小写
            isCorrect = userAnswer.toLowerCase().trim() === question.answer?.toLowerCase().trim();
            break;
          case 'writing':
            // 写作题只要有内容就算正确（简化处理）
            isCorrect = userAnswer.trim().length > 0;
            break;
          default:
            isCorrect = false;
        }

        return {
          id: question.id,
          type: question.type,
          question: question.question,
          options: question.options || [],
          answer: question.answer || '',
          user_answer: userAnswer,
          correct: isCorrect
        };
      }) || [];

          const submitData = {
      exam_id: examId,
      questions: processedQuestions
    };

    console.log('Current examId state:', examId);
    console.log('Submitting assessment data:', submitData);

      const response = await apiClient.post('/spwapi/auth/aiagent/selfassessment/exam/mark', submitData) as any;
      
      if (response && response.code === 0) {
        toast.success('Assessment submitted successfully!');
        setCurrentStep('evaluating');
        pollStatusChange();
      } else {
        toast.error(response?.msg || 'Failed to submit assessment');
      }
    } catch (error) {
      console.error('Failed to submit assessment:', error);
      toast.error('Failed to submit assessment');
    }
  };

  const handleUpdateTemplate = async () => {
    try {
      const response = await apiClient.post('/spwapi/auth/aiagent/assessment/studyplan/template/update', {
        overview_id: student.active_goals?.[0]?.id,
        template: studyPlanTemplate
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

  const handleGenerateStudyPlan = async () => {
    if (!startDate) {
      toast.error('Please select a start date');
      return;
    }

    try {
      const response = await apiClient.post('/spwapi/auth/aiagent/assessment/studyplan/generate', {
        overview_id: student.active_goals?.[0]?.id,
        template: studyPlanTemplate,
        start_date: startDate
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
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const renderGeneratingStep = () => (
    <div className="text-center py-12">
      <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-6"></div>
      <h3 className="text-xl font-semibold text-gray-900 mb-4">Generating Assessment</h3>
      <p className="text-gray-600 mb-6">AI is creating personalized questions for you...</p>
      <div className="space-y-4">
        <div className="text-sm text-blue-600 font-medium">Analyzing your learning goals...</div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div className="bg-blue-600 h-2 rounded-full animate-pulse" style={{ width: '60%' }}></div>
        </div>
        <div className="text-xs text-gray-500">This may take a few minutes...</div>
      </div>
    </div>
  );

  const renderExamStep = () => {
    if (!assessment) return null;
    
    if (!isStarted) {
      return (
        <div className="text-center py-12">
          <div className="text-4xl mb-6">📝</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Assessment Ready</h3>
          <p className="text-gray-600 mb-6">
            You have {assessment.questions.length} questions to complete in 30 minutes.
          </p>
          <div className="space-y-4 mb-8">
            <div className="text-sm text-gray-600">
              <strong>Instructions:</strong>
            </div>
            <div className="text-sm text-gray-600 space-y-2">
              <div>• You have 30 minutes to complete all questions</div>
              <div>• Answer all questions to the best of your ability</div>
              <div>• You can navigate between questions</div>
              <div>• The assessment will auto-submit when time runs out</div>
            </div>
          </div>
          <button
            onClick={handleStartExam}
            className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Start Assessment
          </button>
        </div>
      );
    }
    
    const currentQuestion = assessment.questions[currentQuestionIndex];
    
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div className="text-sm text-gray-600">
            Question {currentQuestionIndex + 1} of {assessment.questions.length}
          </div>
          <div className="text-sm font-semibold text-red-600">
            Time Left: {formatTime(timeLeft)}
          </div>
        </div>
        
        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {currentQuestion.question}
            </h3>
            <div className="text-sm text-gray-500">
              Points: {currentQuestion.points}
            </div>
          </div>
          
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
                    className="text-blue-600"
                  />
                  <span className="text-gray-900">{option}</span>
                </label>
              ))}
            </div>
          )}
          
          {currentQuestion.type === 'multiple_choice' && currentQuestion.options && (
            <div className="space-y-3">
              {currentQuestion.options.map((option, index) => {
                const currentAnswers = answers[currentQuestion.id] ? answers[currentQuestion.id].split(';').filter(a => a.trim() !== '') : [];
                const isChecked = currentAnswers.includes(option);
                
                return (
                  <label key={index} className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      value={option}
                      checked={isChecked}
                      onChange={(e) => {
                        let newAnswers = [...currentAnswers];
                        if (e.target.checked) {
                          if (!newAnswers.includes(option)) {
                            newAnswers.push(option);
                          }
                        } else {
                          newAnswers = newAnswers.filter(a => a !== option);
                        }
                        handleAnswerChange(currentQuestion.id, newAnswers.join(';'));
                      }}
                      className="text-blue-600"
                    />
                    <span className="text-gray-900">{option}</span>
                  </label>
                );
              })}
            </div>
          )}
          
          {currentQuestion.type === 'cloze' && (
            <div>
              <input
                type="text"
                value={answers[currentQuestion.id] || ''}
                onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter your answer..."
              />
            </div>
          )}
          
          {currentQuestion.type === 'writing' && (
            <div>
              <textarea
                value={answers[currentQuestion.id] || ''}
                onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-32 resize-vertical"
                placeholder="Write your answer here..."
                rows={6}
              />
            </div>
          )}
        </div>
        
        <div className="flex justify-between">
          <button
            onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
            disabled={currentQuestionIndex === 0}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50"
          >
            Previous
          </button>
          
          {currentQuestionIndex === assessment.questions.length - 1 ? (
            <button
              onClick={handleSubmit}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              Submit Assessment
            </button>
          ) : (
            <button
              onClick={() => setCurrentQuestionIndex(prev => Math.min(assessment.questions.length - 1, prev + 1))}
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
      if (student && student.id) {
        pollStatusChange();
      } else {
        toast.error('Student information not available');
      }
    };

    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-yellow-600 mx-auto mb-6"></div>
        <h3 className="text-xl font-semibold text-gray-900 mb-4">AI is Evaluating</h3>
        <p className="text-gray-600 mb-6">Please wait while AI analyzes your answers...</p>
        <button
          onClick={handleCheckStatus}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <FaRefresh className="inline mr-2" />
          Check Status
        </button>
      </div>
    );
  };

  const renderResultStep = () => (
    <div className="space-y-6">
      {/* 评估完成标题 */}
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-6 border border-green-200">
        <div className="text-center">
          <div className="text-4xl mb-4">🎉</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Assessment Completed!</h3>
          <p className="text-gray-600">Your assessment has been evaluated successfully.</p>
        </div>
      </div>

      {/* 学习目标信息 */}
      {learningGoal && (
        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">Learning Goal</h4>
          <div className="space-y-3">
            <div>
              <span className="font-medium text-gray-700">Title:</span>
              <span className="ml-2 text-gray-900">{learningGoal.title}</span>
            </div>
            <div>
              <span className="font-medium text-gray-700">Description:</span>
              <span className="ml-2 text-gray-900">{learningGoal.description}</span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="font-medium text-gray-700">Start Date:</span>
                <span className="ml-2 text-gray-900">{learningGoal.start_date}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">End Date:</span>
                <span className="ml-2 text-gray-900">{learningGoal.end_date}</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="font-medium text-gray-700">Current Level:</span>
                <span className="ml-2 text-gray-900">Level {learningGoal.init_level}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Target Level:</span>
                <span className="ml-2 text-gray-900">Level {learningGoal.target_level}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 评估结果摘要 */}
      {learningGoal && (
        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">Assessment Summary</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{learningGoal.assess_score}/{learningGoal.assess_max_score}</div>
              <div className="text-sm text-gray-600">Score</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{learningGoal.assess_level_estimate}</div>
              <div className="text-sm text-gray-600">Level Estimate</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">{learningGoal.estimated_duration_days || 49}</div>
              <div className="text-sm text-gray-600">Days to Target</div>
            </div>
          </div>
          
          {learningGoal.assess_over_all_comment && (
            <div className="mb-4">
              <h5 className="font-medium text-gray-900 mb-2">Overall Assessment</h5>
              <p className="text-gray-700 bg-gray-50 p-3 rounded">{learningGoal.assess_over_all_comment}</p>
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {learningGoal.assess_strengths && (
              <div>
                <h5 className="font-medium text-green-700 mb-2">Strengths</h5>
                <div className="text-sm text-gray-700">
                  {learningGoal.assess_strengths.split('|').map((strength: string, index: number) => (
                    <div key={index} className="flex items-center mb-1">
                      <span className="text-green-500 mr-2">✓</span>
                      {strength.trim()}
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {learningGoal.assess_weaknesses && (
              <div>
                <h5 className="font-medium text-orange-700 mb-2">Areas for Improvement</h5>
                <div className="text-sm text-gray-700">
                  {learningGoal.assess_weaknesses.split('|').map((weakness: string, index: number) => (
                    <div key={index} className="flex items-center mb-1">
                      <span className="text-orange-500 mr-2">•</span>
                      {weakness.trim()}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          {learningGoal.assess_suggestions && (
            <div className="mt-4">
              <h5 className="font-medium text-blue-700 mb-2">Recommendations</h5>
              <div className="text-sm text-gray-700">
                {learningGoal.assess_suggestions.split('|').map((suggestion: string, index: number) => (
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

      {/* 学习计划模板预览 */}
      {studyPlanTemplate && studyPlanTemplate.length > 0 && (
        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">Study Plan Template</h4>
          <div className="space-y-4">
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
                  {week.tasks && week.tasks.length > 2 && (
                    <div className="text-sm text-gray-500 italic">
                      +{week.tasks.length - 2} more tasks...
                    </div>
                  )}
                </div>
              </div>
            ))}
            {studyPlanTemplate.length > 3 && (
              <div className="text-center text-gray-500 italic">
                +{studyPlanTemplate.length - 3} more weeks...
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* 操作按钮 */}
      <div className="flex justify-center">
        <button
          onClick={() => setCurrentStep('template')}
          className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <FaEdit className="inline mr-2" />
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

    const handleUpdateTemplate = async () => {
      try {
        const response = await apiClient.post('/spwapi/auth/aiagent/assessment/studyplan/template/update', {
          overview_id: student.active_goals?.[0]?.id,
          study_plan_tpl: JSON.stringify(studyPlanTemplate)
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

    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Study Plan Template</h3>
            <button
              onClick={handleUpdateTemplate}
              className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
            >
              <FaSave className="inline mr-2" />
              Update Template
            </button>
          </div>
          
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
        
        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Generate Study Plan</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <button
              onClick={handleGenerateStudyPlan}
              className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <FaPlay className="inline mr-2" />
              Generate Study Plan
            </button>
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