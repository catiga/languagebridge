'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { apiClient } from '../../../utils/api';
import { toast } from 'react-toastify';
import { 
  FaClock, 
  FaCheck, 
  FaTimes, 
  FaPlay, 
  FaPause, 
  FaStop,
  FaArrowLeft,
  FaSave,
  FaExclamationTriangle
} from 'react-icons/fa';
import QuestionNavigator from './components/QuestionNavigator';
import GeneratingAssessment from './components/GeneratingAssessment';

interface Question {
  id?: number;
  type: 'single_choice' | 'multiple_choice' | 'cloze' | 'writing';
  question: string;
  options?: string[];
  answer: string;
  explanation: string;
  points?: number;
  time_limit?: number; // 单个题目时间限制（秒）
}

interface Assessment {
  id: number;
  title: string;
  description: string;
  total_time: number; // 总时间（分钟）
  questions: Question[];
  passing_score: number;
}

interface StudyPlan {
  id: number;
  title: string;
  description: string;
  goal: string;
  target_level: number;
  init_level: number;
  status: string;
}

interface Answer {
  question_id: number | undefined;
  answer: string | string[];
  time_spent: number; // 答题用时（秒）
}

export default function AssessmentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const studentId = searchParams.get('student_id');
  const planId = searchParams.get('plan_id');

  // 状态管理
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [studyPlan, setStudyPlan] = useState<StudyPlan | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [isStarted, setIsStarted] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // 计时相关
  const [totalTimeLeft, setTotalTimeLeft] = useState(0); // 总剩余时间（秒）
  const [questionTimeLeft, setQuestionTimeLeft] = useState(0); // 当前题目剩余时间（秒）
  const [questionStartTime, setQuestionStartTime] = useState(0);
  const totalTimerRef = useRef<NodeJS.Timeout | null>(null);
  const questionTimerRef = useRef<NodeJS.Timeout | null>(null);

  // 获取考试数据和学习计划信息
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // 获取学习计划信息
        if (planId) {
          const planRes = await apiClient.get(`/spwapi/auth/planner/view?overview_id=${planId}`) as any;
          if (planRes && planRes.code === 0 && planRes.data.length > 0) {
            setStudyPlan(planRes.data[0]);
          }
        }

        // 生成考试题目
        if (planId) {
          await generateAssessment(planId);
        }
      } catch (error) {
        console.error('Failed to fetch assessment data:', error);
        toast.error('Failed to load assessment');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [planId]);

  // 生成考试题目
  const generateAssessment = async (overviewId: string) => {
    try {
      setGenerating(true);
      setLoading(false);
      
      // 调用生成接口
      const response = await apiClient.get(`/spwapi/auth/aiagent/assessment/generate?overview_id=${overviewId}`) as any;
      
      if (response && response.code === 0 && response.data) {
        toast.success('Assessment generated successfully!');
        
        // 处理返回的数据结构
        const aiReply = response.data.ai_reply;
        const questions = aiReply?.questions || [];
        
        console.log('Raw questions from API:', questions);
        
        // 为每个题目添加ID和分数
        const processedQuestions = questions.map((q: any, index: number) => ({
          ...q,
          id: index + 1,
          points: q.type === 'writing' ? 20 : q.type === 'multiple_choice' ? 10 : 5,
          time_limit: q.type === 'writing' ? 300 : undefined
        }));
        
        console.log('Processed questions:', processedQuestions);
        
        // 设置考试数据
        const generatedAssessment: Assessment = {
          id: response.data.exam_id || 1,
          title: "AI-Generated English Assessment",
          description: "Personalized assessment created based on your learning goals",
          total_time: 60,
          passing_score: 70,
          questions: processedQuestions
        };

        setAssessment(generatedAssessment);
        setTotalTimeLeft(generatedAssessment.total_time * 60);
      } else {
        throw new Error(response?.msg || 'Failed to generate assessment');
      }
    } catch (error) {
      console.error('Failed to generate assessment:', error);
      toast.error('Failed to generate assessment. Please try again.');
      
              // 如果生成失败，使用默认题目
        const fallbackAssessment: Assessment = {
          id: 1,
          title: "English Level Assessment",
          description: "Comprehensive assessment to evaluate your current English proficiency level",
          total_time: 60,
          passing_score: 70,
          questions: [
            {
              id: 1,
              type: 'single_choice',
              question: "Choose the correct form of the verb: 'She _____ to the store yesterday.'",
              options: ["go", "goes", "went", "going"],
              answer: "went",
              explanation: "The correct form is 'went' for past tense.",
              points: 5
            },
            {
              id: 2,
              type: 'multiple_choice',
              question: "Which of the following are correct English expressions?",
              options: ["How are you?", "What's up?", "I'm fine, thank you.", "Good morning!"],
              answer: "How are you?;What's up?;I'm fine, thank you.;Good morning!",
              explanation: "All of these are common English expressions.",
              points: 10
            },
            {
              id: 3,
              type: 'cloze',
              question: "Complete the sentence: 'The weather is _____ today, so I think I'll stay inside.'",
              options: ["sunny", "rainy", "cold", "warm"],
              answer: "rainy",
              explanation: "The context suggests bad weather, so 'rainy' is appropriate.",
              points: 5
            },
            {
              id: 4,
              type: 'writing',
              question: "Write a short paragraph (50-100 words) about your favorite hobby. Explain why you enjoy it and how often you do it.",
              answer: "",
              explanation: "This task evaluates your writing skills and ability to express personal preferences.",
              points: 20,
              time_limit: 300
            }
          ]
        };

      setAssessment(fallbackAssessment);
      setTotalTimeLeft(fallbackAssessment.total_time * 60);
    } finally {
      setGenerating(false);
    }
  };

  // 开始考试
  const startAssessment = () => {
    setIsStarted(true);
    setQuestionStartTime(Date.now());
    
    // 开始总计时
    totalTimerRef.current = setInterval(() => {
      setTotalTimeLeft(prev => {
        if (prev <= 1) {
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // 开始题目计时
    startQuestionTimer();
  };

  // 开始题目计时
  const startQuestionTimer = () => {
    const currentQuestion = assessment?.questions[currentQuestionIndex];
    if (currentQuestion?.time_limit) {
      setQuestionTimeLeft(currentQuestion.time_limit);
      questionTimerRef.current = setInterval(() => {
        setQuestionTimeLeft(prev => {
          if (prev <= 1) {
            handleNextQuestion();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
  };

  // 暂停/恢复考试
  const togglePause = () => {
    if (isPaused) {
      // 恢复考试
      setIsPaused(false);
      startQuestionTimer();
      totalTimerRef.current = setInterval(() => {
        setTotalTimeLeft(prev => {
          if (prev <= 1) {
            handleSubmit();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      // 暂停考试
      setIsPaused(true);
      if (totalTimerRef.current) clearInterval(totalTimerRef.current);
      if (questionTimerRef.current) clearInterval(questionTimerRef.current);
    }
  };

  // 处理答案变化
  const handleAnswerChange = (answer: string | string[]) => {
    const currentQuestion = assessment?.questions[currentQuestionIndex];
    if (!currentQuestion) return;

    const timeSpent = Math.floor((Date.now() - questionStartTime) / 1000);
    
    setAnswers(prev => {
      const existingIndex = prev.findIndex(a => a.question_id === currentQuestion.id);
      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex] = { question_id: currentQuestion.id, answer, time_spent: timeSpent };
        return updated;
      } else {
        return [...prev, { question_id: currentQuestion.id, answer, time_spent: timeSpent }];
      }
    });
  };

  // 下一题
  const handleNextQuestion = () => {
    if (!assessment) return;

    // 停止当前题目计时
    if (questionTimerRef.current) {
      clearInterval(questionTimerRef.current);
    }

    // 记录当前题目用时
    const currentQuestion = assessment.questions[currentQuestionIndex];
    const timeSpent = Math.floor((Date.now() - questionStartTime) / 1000);
    
    setAnswers(prev => {
      const existingIndex = prev.findIndex(a => a.question_id === currentQuestion.id);
      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex] = { ...updated[existingIndex], time_spent: timeSpent };
        return updated;
      }
      return prev;
    });

    // 移动到下一题
    if (currentQuestionIndex < assessment.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setQuestionStartTime(Date.now());
      startQuestionTimer();
    } else {
      // 最后一题，自动提交
      handleSubmit();
    }
  };

  // 上一题
  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
      setQuestionStartTime(Date.now());
      startQuestionTimer();
    }
  };

  const handleQuestionClick = (index: number) => {
    setCurrentQuestionIndex(index);
    setQuestionStartTime(Date.now());
    startQuestionTimer();
  };

  // 提交考试
  const handleSubmit = async () => {
    if (submitting) return;
    
    setSubmitting(true);
    
    // 停止所有计时器
    if (totalTimerRef.current) clearInterval(totalTimerRef.current);
    if (questionTimerRef.current) clearInterval(questionTimerRef.current);

    try {
      // 提交答案到后端
      const submitData = {
        assessment_id: assessment?.id,
        student_id: studentId,
        plan_id: planId,
        answers: answers,
        total_time_spent: assessment ? (assessment.total_time * 60 - totalTimeLeft) : 0
      };

      // 这里应该调用实际的提交接口
      console.log('Submitting assessment:', submitData);
      
      // 模拟提交
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setIsSubmitted(true);
      toast.success('Assessment submitted successfully!');
      
      // 跳转到结果页面
      setTimeout(() => {
        const resultUrl = `/v2/auth/assessment/result?student_id=${studentId}&plan_id=${planId}&result_id=1`;
        // 如果是在新窗口中打开的，则在当前窗口跳转
        if (window.opener) {
          router.push(resultUrl);
        } else {
          // 如果不在新窗口中，则在新窗口打开结果页面
          window.open(resultUrl, '_blank', 'width=1200,height=800,scrollbars=yes,resizable=yes');
        }
      }, 2000);
      
    } catch (error) {
      console.error('Failed to submit assessment:', error);
      toast.error('Failed to submit assessment');
    } finally {
      setSubmitting(false);
    }
  };

  // 格式化时间
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // 获取当前答案
  const getCurrentAnswer = () => {
    const currentQuestion = assessment?.questions[currentQuestionIndex];
    if (!currentQuestion) return '';
    
    const answer = answers.find(a => a.question_id === currentQuestion.id);
    return answer?.answer || '';
  };

  // 渲染题目
  const renderQuestion = () => {
    const currentQuestion = assessment?.questions[currentQuestionIndex];
    if (!currentQuestion) {
      console.log('No current question found:', { currentQuestionIndex, questions: assessment?.questions });
      return (
        <div className="text-center py-8">
          <p className="text-gray-600">No question available</p>
        </div>
      );
    }

    console.log('Rendering question:', currentQuestion);

    const currentAnswer = getCurrentAnswer();

    switch (currentQuestion.type) {
      case 'single_choice':
        return (
          <div className="space-y-3">
            <p className="text-lg font-medium text-gray-900">{currentQuestion.question}</p>
            <div className="space-y-2">
              {currentQuestion.options?.map((option, index) => (
                <label key={index} className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                  <input
                    type="radio"
                    name={`question-${currentQuestion.id}`}
                    value={option}
                    checked={currentAnswer === option}
                    onChange={(e) => handleAnswerChange(e.target.value)}
                    className="text-blue-600"
                  />
                  <span className="text-gray-700">{option}</span>
                </label>
              ))}
            </div>
          </div>
        );

      case 'multiple_choice':
        const selectedAnswers = Array.isArray(currentAnswer) ? currentAnswer : [];
        return (
          <div className="space-y-3">
            <p className="text-lg font-medium text-gray-900">{currentQuestion.question}</p>
            <div className="space-y-2">
              {currentQuestion.options?.map((option, index) => (
                <label key={index} className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                  <input
                    type="checkbox"
                    value={option}
                    checked={selectedAnswers.includes(option)}
                    onChange={(e) => {
                      const newAnswers = e.target.checked
                        ? [...selectedAnswers, option]
                        : selectedAnswers.filter(a => a !== option);
                      handleAnswerChange(newAnswers);
                    }}
                    className="text-blue-600"
                  />
                  <span className="text-gray-700">{option}</span>
                </label>
              ))}
            </div>
          </div>
        );

      case 'cloze':
        return (
          <div className="space-y-3">
            <p className="text-lg font-medium text-gray-900">{currentQuestion.question}</p>
            <input
              type="text"
              value={currentAnswer as string}
              onChange={(e) => handleAnswerChange(e.target.value)}
              placeholder="Type your answer here..."
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        );

      case 'writing':
        return (
          <div className="space-y-3">
            <p className="text-lg font-medium text-gray-900">{currentQuestion.question}</p>
            <textarea
              value={currentAnswer as string}
              onChange={(e) => handleAnswerChange(e.target.value)}
              placeholder="Write your answer here..."
              className="w-full h-32 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
            {currentQuestion.time_limit && (
              <div className="text-sm text-gray-600">
                Time limit: {formatTime(currentQuestion.time_limit)}
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  // 渲染进度条
  const renderProgress = () => {
    if (!assessment) return null;

    const progress = ((currentQuestionIndex + 1) / assessment.questions.length) * 100;
    const answeredCount = answers.length;

    return (
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700">
            Question {currentQuestionIndex + 1} of {assessment.questions.length}
          </span>
          <span className="text-sm text-gray-600">
            {answeredCount} answered
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading assessment...</p>
        </div>
      </div>
    );
  }

  if (generating) {
    return <GeneratingAssessment studyPlan={studyPlan || undefined} />;
  }

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center max-w-md">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FaCheck className="text-green-600 text-2xl" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Assessment Submitted!</h2>
          <p className="text-gray-600 mb-4">Your answers have been successfully submitted.</p>
          <p className="text-sm text-gray-500">Redirecting to dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.back()}
                className="p-2 text-gray-400 hover:text-gray-600"
              >
                <FaArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-lg font-semibold text-gray-900">
                  {assessment?.title || 'Assessment'}
                </h1>
                <p className="text-sm text-gray-600">
                  {studyPlan?.title && `Study Plan: ${studyPlan.title}`}
                </p>
              </div>
            </div>

            {/* Timer */}
            {isStarted && (
              <div className="flex items-center space-x-4">
                {isPaused && (
                  <div className="flex items-center space-x-2 text-orange-600">
                    <FaExclamationTriangle className="w-4 h-4" />
                    <span className="text-sm font-medium">PAUSED</span>
                  </div>
                )}
                <div className="flex items-center space-x-2">
                  <FaClock className="w-4 h-4 text-gray-400" />
                  <span className="text-lg font-mono font-semibold text-gray-900">
                    {formatTime(totalTimeLeft)}
                  </span>
                </div>
                {questionTimeLeft > 0 && (
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-600">Question:</span>
                    <span className="text-sm font-mono font-semibold text-blue-600">
                      {formatTime(questionTimeLeft)}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Study Plan Info */}
        {studyPlan && (
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6 mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-2">Study Plan Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Goal</h3>
                <p className="text-gray-700">{studyPlan.goal}</p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Description</h3>
                <p className="text-gray-700">{studyPlan.description}</p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Target Level</h3>
                <p className="text-gray-700">Level {studyPlan.init_level} → Level {studyPlan.target_level}</p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Status</h3>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  studyPlan.status === '00' ? 'bg-orange-100 text-orange-800' :
                  studyPlan.status === '10' ? 'bg-blue-100 text-blue-800' :
                  'bg-green-100 text-green-800'
                }`}>
                  {studyPlan.status === '00' ? 'Needs Assessment' :
                   studyPlan.status === '10' ? 'In Progress' : 'Completed'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Assessment Content */}
        {!isStarted ? (
          /* Start Screen */
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <FaPlay className="text-blue-600 text-3xl" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Ready to Start?</h2>
            <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
              This assessment will help us understand your current English level and create a personalized study plan.
              You will have {assessment?.total_time} minutes to complete all questions.
            </p>
            
            <div className="bg-gray-50 rounded-lg p-6 mb-6 text-left">
              <h3 className="font-semibold text-gray-900 mb-3">Assessment Details:</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• Total time: {assessment?.total_time} minutes</li>
                <li>• Questions: {assessment?.questions.length}</li>
                <li>• Passing score: {assessment?.passing_score}%</li>
                <li>• You can pause the assessment at any time</li>
                <li>• Time will automatically submit when time runs out</li>
              </ul>
            </div>

            <button
              onClick={startAssessment}
              className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              Start Assessment
            </button>
          </div>
        ) : (
          /* Question Screen */
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-3">
              <div className="bg-white rounded-lg shadow-lg p-8">
                {/* Progress */}
                {renderProgress()}

                {/* Question */}
                <div className="mb-8">
                  {renderQuestion()}
                </div>

                {/* Navigation */}
                <div className="flex items-center justify-between pt-6 border-t">
                  <div className="flex items-center space-x-4">
                    <button
                      onClick={handlePreviousQuestion}
                      disabled={currentQuestionIndex === 0}
                      className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    
                    <button
                      onClick={togglePause}
                      className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                      {isPaused ? <FaPlay className="w-4 h-4" /> : <FaPause className="w-4 h-4" />}
                      {isPaused ? ' Resume' : ' Pause'}
                    </button>
                  </div>

                  <div className="flex items-center space-x-4">
                    <button
                      onClick={handleSubmit}
                      disabled={submitting}
                      className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {submitting ? 'Submitting...' : 'Submit Assessment'}
                    </button>
                    
                    {currentQuestionIndex < (assessment?.questions.length || 0) - 1 ? (
                      <button
                        onClick={handleNextQuestion}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                      >
                        Next Question
                      </button>
                    ) : (
                      <button
                        onClick={handleSubmit}
                        disabled={submitting}
                        className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {submitting ? 'Submitting...' : 'Finish Assessment'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Sidebar - Question Navigator */}
            <div className="lg:col-span-1">
              {assessment && (
                <QuestionNavigator
                  questions={assessment.questions}
                  currentIndex={currentQuestionIndex}
                  answers={answers}
                  onQuestionClick={handleQuestionClick}
                />
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 