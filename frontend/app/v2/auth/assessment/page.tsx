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
import { calculateAssessmentResult } from './utils/resultCalculator';

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
      setLoading(false); // Stop initial loading, start generating animation

      let attempts = 0;
      const maxAttempts = 60; // 最多等待5分钟 (60 * 5秒)
      const pollInterval = 5000; // 5秒轮询一次

      const pollForAssessment = async (): Promise<any> => {
        attempts++;
        
        try {
          const response = await apiClient.get(`/spwapi/auth/aiagent/assessment/generate?overview_id=${overviewId}`) as any;
          
          console.log(`Poll attempt ${attempts}:`, response);
          
          if (response && response.code === 0 && response.data) {
            // 生成成功
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
            
            // 这里可以更新进度信息（如果需要的话）
            console.log(`AI is processing... Attempt ${attempts}/${maxAttempts}: ${progressMessages[messageIndex]}`);
            
            // 等待后继续轮询
            await new Promise(resolve => setTimeout(resolve, pollInterval));
            return pollForAssessment();
          } else {
            // 其他错误
            throw new Error(response?.msg || 'Failed to generate assessment');
          }
        } catch (error) {
          if (attempts >= maxAttempts) {
            throw error;
          }
          
          // 网络错误或其他临时错误，继续重试
          console.warn(`Poll attempt ${attempts} failed:`, error);
          await new Promise(resolve => setTimeout(resolve, pollInterval));
          return pollForAssessment();
        }
      };

      const response = await pollForAssessment();

      // 处理成功返回的数据
      toast.success('Assessment generated successfully!');

      const aiReply = response.data.ai_reply;
      const questions = aiReply?.questions || [];

      const processedQuestions = questions.map((q: any, index: number) => ({
        ...q,
        id: index + 1,
        points: q.type === 'writing' ? 20 : q.type === 'multiple_choice' ? 10 : 5,
        time_limit: q.type === 'writing' ? 300 : undefined
      }));

              const generatedAssessment: Assessment = {
          id: response.data.exam_id || 1,
          title: "AI-Generated English Assessment",
          description: "Personalized assessment created based on your learning goals",
          total_time: 30,
          passing_score: 70,
          questions: processedQuestions
        };

      setAssessment(generatedAssessment);
      setTotalTimeLeft(generatedAssessment.total_time * 60);

    } catch (error) {
      console.error('Failed to generate assessment:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to generate assessment. Please try again.');

      // Fallback to mock data if generation fails
      const fallbackAssessment: Assessment = {
        id: 1,
        title: "English Level Assessment",
        description: "Comprehensive assessment to evaluate your current English proficiency level",
        total_time: 30,
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
      // 计算考试结果
      const totalTimeSpent = assessment ? (assessment.total_time * 60 - totalTimeLeft) : 0;
      const totalTime = assessment ? assessment.total_time * 60 : 0;
      
      const result = calculateAssessmentResult(
        assessment?.questions || [],
        answers,
        totalTimeSpent,
        totalTime,
        Number(studentId),
        Number(planId),
        assessment?.id || 1
      );

      // 准备提交给后台的数据
      const examQuestions = assessment?.questions.map(question => {
        const userAnswer = answers.find(a => a.question_id === question.id);
        const userAnswerStr = userAnswer ? 
          (Array.isArray(userAnswer.answer) ? userAnswer.answer.join(';') : userAnswer.answer) : '';
        
        // 判断答案是否正确
        let isCorrect = false;
        switch (question.type) {
          case 'single_choice':
            isCorrect = userAnswerStr === question.answer;
            break;
          case 'multiple_choice':
            const correctAnswers = question.answer.split(';').sort();
            const userAnswers = userAnswerStr.split(';').sort();
            isCorrect = correctAnswers.length === userAnswers.length && 
                       correctAnswers.every((ans, index) => ans === userAnswers[index]);
            break;
          case 'cloze':
            const normalizedCorrect = question.answer.toLowerCase().trim();
            const normalizedUser = userAnswerStr.toLowerCase().trim();
            isCorrect = normalizedUser === normalizedCorrect;
            break;
          case 'writing':
            // 写作题基于字数判断
            const wordCount = userAnswerStr.split(/\s+/).length;
            isCorrect = wordCount >= 10; // 至少10个单词算正确
            break;
        }

        return {
          type: question.type,
          question: question.question,
          options: question.options || [],
          answer: question.answer,
          explanation: question.explanation,
          user_answer: userAnswerStr,
          correct: isCorrect
        };
      }) || [];

      // 调用后台接口保存考试记录
      const submitData = {
        exam_id: assessment?.id || 1,
        questions: examQuestions
      };

      console.log('Submitting to backend:', submitData);
      
      try {
        const response = await apiClient.post('/spwapi/auth/aiagent/selfassessment/exam/mark', submitData) as any;
        
        if (response && response.code === 0) {
          toast.success('Assessment submitted and saved successfully!');
        } else {
          console.warn('Backend save failed, but continuing with result display:', response?.msg);
          toast.warning('Assessment completed, but save failed. Results still available.');
        }
      } catch (backendError) {
        console.error('Backend save error:', backendError);
        toast.warning('Assessment completed, but save failed. Results still available.');
      }
      
      setIsSubmitted(true);
      
      // 将结果数据传递给结果页面
      const resultData = encodeURIComponent(JSON.stringify(result));
      const resultUrl = `/v2/auth/assessment/result?student_id=${studentId}&plan_id=${planId}&result_id=${result.id}&result_data=${resultData}`;
      
      // 跳转到结果页面
      setTimeout(() => {
        if (window.opener) {
          router.push(resultUrl);
        } else {
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
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-xl border-l-4 border-blue-500">
              <p className="text-xl font-semibold text-gray-900 leading-relaxed">{currentQuestion.question}</p>
            </div>
            <div className="space-y-3">
              {currentQuestion.options?.map((option, index) => (
                <label key={index} className="flex items-center space-x-4 p-4 border-2 border-gray-200 rounded-xl hover:bg-gray-50 hover:border-blue-300 cursor-pointer transition-all duration-200">
                  <input
                    type="radio"
                    name={`question-${currentQuestion.id}`}
                    value={option}
                    checked={currentAnswer === option}
                    onChange={(e) => handleAnswerChange(e.target.value)}
                    className="w-5 h-5 text-blue-600 border-gray-300 focus:ring-blue-500 focus:ring-2"
                  />
                  <span className="text-gray-900 font-medium">{option}</span>
                </label>
              ))}
            </div>
          </div>
        );

      case 'multiple_choice':
        const selectedAnswers = Array.isArray(currentAnswer) ? currentAnswer : [];
        return (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-6 rounded-xl border-l-4 border-purple-500">
              <p className="text-xl font-semibold text-gray-900 leading-relaxed">{currentQuestion.question}</p>
            </div>
            <div className="space-y-3">
              {currentQuestion.options?.map((option, index) => (
                <label key={index} className="flex items-center space-x-4 p-4 border-2 border-gray-200 rounded-xl hover:bg-gray-50 hover:border-purple-300 cursor-pointer transition-all duration-200">
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
                    className="w-5 h-5 text-purple-600 border-gray-300 focus:ring-purple-500 focus:ring-2"
                  />
                  <span className="text-gray-900 font-medium">{option}</span>
                </label>
              ))}
            </div>
          </div>
        );

      case 'cloze':
        return (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-xl border-l-4 border-green-500">
              <p className="text-xl font-semibold text-gray-900 leading-relaxed">{currentQuestion.question}</p>
            </div>
            <input
              type="text"
              value={currentAnswer as string}
              onChange={(e) => handleAnswerChange(e.target.value)}
              placeholder="Type your answer here..."
              className="w-full p-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-300 text-lg transition-all duration-200"
            />
          </div>
        );

      case 'writing':
        return (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-orange-50 to-red-50 p-6 rounded-xl border-l-4 border-orange-500">
              <p className="text-xl font-semibold text-gray-900 leading-relaxed">{currentQuestion.question}</p>
            </div>
            <textarea
              value={currentAnswer as string}
              onChange={(e) => handleAnswerChange(e.target.value)}
              placeholder="Write your answer here..."
              className="w-full h-40 p-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-300 resize-none text-lg transition-all duration-200"
            />
            {currentQuestion.time_limit && (
              <div className="flex items-center space-x-2 text-orange-600 bg-orange-50 px-4 py-2 rounded-lg">
                <FaClock className="w-4 h-4" />
                <span className="font-semibold">Time limit: {formatTime(currentQuestion.time_limit)}</span>
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
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center space-x-4">
            <span className="text-lg font-bold text-gray-900">
              Question {currentQuestionIndex + 1} of {assessment.questions.length}
            </span>
            <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold">
              {answeredCount} answered
            </span>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-gray-900">{Math.round(progress)}%</div>
            <div className="text-sm text-gray-600">Complete</div>
          </div>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3 shadow-inner">
          <div
            className="bg-gradient-to-r from-blue-500 to-purple-600 h-3 rounded-full transition-all duration-500 ease-out shadow-lg"
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Enhanced Header */}
      <div className="bg-white/80 backdrop-blur-sm shadow-lg border-b border-gray-200/50 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center space-x-6">
              <button
                onClick={() => router.back()}
                className="p-3 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-all duration-200"
              >
                <FaArrowLeft className="w-5 h-5" />
              </button>
              <div className="border-l border-gray-200 pl-6">
                <h1 className="text-xl font-bold text-gray-900 mb-1">
                  {assessment?.title || 'Assessment'}
                </h1>
                <p className="text-sm text-gray-600">
                  {studyPlan?.title && `Study Plan: ${studyPlan.title}`}
                </p>
              </div>
            </div>

            {/* Enhanced Timer */}
            {isStarted && (
              <div className="flex items-center space-x-6">
                {isPaused && (
                  <div className="flex items-center space-x-2 bg-orange-100 text-orange-700 px-3 py-2 rounded-full">
                    <FaExclamationTriangle className="w-4 h-4" />
                    <span className="text-sm font-semibold">PAUSED</span>
                  </div>
                )}
                <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-2 rounded-lg shadow-lg">
                  <div className="flex items-center space-x-2">
                    <FaClock className="w-4 h-4" />
                    <span className="text-lg font-mono font-bold">
                      {formatTime(totalTimeLeft)}
                    </span>
                  </div>
                </div>
                {questionTimeLeft > 0 && (
                  <div className="bg-blue-100 text-blue-700 px-3 py-2 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium">Question:</span>
                      <span className="text-sm font-mono font-bold">
                        {formatTime(questionTimeLeft)}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Enhanced Study Plan Info */}
        {studyPlan && (
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl border border-white/50 p-8 mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900 flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <span className="text-white text-sm font-bold">📚</span>
                </div>
                Study Plan Information
              </h2>
              <span className={`px-4 py-2 rounded-full text-sm font-semibold shadow-sm ${
                studyPlan.status === '00' ? 'bg-orange-100 text-orange-700 border border-orange-200' :
                studyPlan.status === '10' ? 'bg-blue-100 text-blue-700 border border-blue-200' :
                'bg-green-100 text-green-700 border border-green-200'
              }`}>
                {studyPlan.status === '00' ? 'Needs Assessment' :
                 studyPlan.status === '10' ? 'In Progress' : 'Completed'}
              </span>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2 flex items-center space-x-2">
                    <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                    Goal
                  </h3>
                  <p className="text-gray-700 bg-gray-50 p-3 rounded-lg border-l-4 border-blue-500">
                    {studyPlan.goal}
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2 flex items-center space-x-2">
                    <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                    Target Level
                  </h3>
                  <p className="text-gray-700 bg-gray-50 p-3 rounded-lg border-l-4 border-purple-500">
                    Level {studyPlan.init_level} → Level {studyPlan.target_level}
                  </p>
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2 flex items-center space-x-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  Description
                </h3>
                <p className="text-gray-700 bg-gray-50 p-3 rounded-lg border-l-4 border-green-500">
                  {studyPlan.description}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Assessment Content */}
        {!isStarted ? (
          /* Enhanced Start Screen */
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-2xl p-12 text-center max-w-4xl mx-auto">
            <div className="w-24 h-24 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-8 shadow-lg">
              <FaPlay className="text-white text-4xl ml-1" />
            </div>
            <h2 className="text-4xl font-bold text-gray-900 mb-6">Ready to Start?</h2>
            <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto leading-relaxed">
              This assessment will help us understand your current English level and create a personalized study plan.
              You will have <span className="font-semibold text-blue-600">{assessment?.total_time} minutes</span> to complete all questions.
            </p>
            
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-8 mb-8 text-left border border-blue-100">
              <h3 className="font-bold text-gray-900 mb-4 text-lg flex items-center space-x-2">
                <span className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm">ℹ️</span>
                </span>
                Assessment Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <ul className="space-y-3 text-gray-700">
                  <li className="flex items-center space-x-3">
                    <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                    <span>Total time: <span className="font-semibold">{assessment?.total_time} minutes</span></span>
                  </li>
                  <li className="flex items-center space-x-3">
                    <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                    <span>Questions: <span className="font-semibold">{assessment?.questions.length}</span></span>
                  </li>
                  <li className="flex items-center space-x-3">
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    <span>Passing score: <span className="font-semibold">{assessment?.passing_score}%</span></span>
                  </li>
                </ul>
                <ul className="space-y-3 text-gray-700">
                  <li className="flex items-center space-x-3">
                    <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                    <span>You can pause anytime</span>
                  </li>
                  <li className="flex items-center space-x-3">
                    <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                    <span>Auto-submit when time runs out</span>
                  </li>
                </ul>
              </div>
            </div>

            <button
              onClick={startAssessment}
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-12 py-4 rounded-xl font-bold text-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 shadow-lg"
            >
              Start Assessment
            </button>
          </div>
        ) : (
          /* Enhanced Question Screen */
          <div className="grid grid-cols-1 xl:grid-cols-5 gap-8">
            {/* Main Content */}
            <div className="xl:col-span-4">
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/50 p-8">
                {/* Enhanced Progress */}
                {renderProgress()}

                {/* Question */}
                <div className="mb-8">
                  {renderQuestion()}
                </div>

                {/* Enhanced Navigation */}
                <div className="flex items-center justify-between pt-8 border-t border-gray-200">
                  <div className="flex items-center space-x-4">
                    <button
                      onClick={handlePreviousQuestion}
                      disabled={currentQuestionIndex === 0}
                      className="px-6 py-3 text-gray-600 bg-white border-2 border-gray-200 rounded-xl hover:bg-gray-50 hover:border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium"
                    >
                      ← Previous
                    </button>
                    
                    <button
                      onClick={togglePause}
                      className="px-6 py-3 text-gray-600 bg-white border-2 border-gray-200 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 font-medium"
                    >
                      {isPaused ? <FaPlay className="w-4 h-4" /> : <FaPause className="w-4 h-4" />}
                      {isPaused ? ' Resume' : ' Pause'}
                    </button>
                  </div>

                  <div className="flex items-center space-x-4">
                    <button
                      onClick={handleSubmit}
                      disabled={submitting}
                      className="px-8 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl hover:from-red-600 hover:to-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-semibold shadow-lg"
                    >
                      {submitting ? 'Submitting...' : 'Submit Assessment'}
                    </button>
                    
                    {currentQuestionIndex < (assessment?.questions.length || 0) - 1 ? (
                      <button
                        onClick={handleNextQuestion}
                        className="px-8 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all duration-200 font-semibold shadow-lg"
                      >
                        Next Question →
                      </button>
                    ) : (
                      <button
                        onClick={handleSubmit}
                        disabled={submitting}
                        className="px-8 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl hover:from-green-600 hover:to-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-semibold shadow-lg"
                      >
                        {submitting ? 'Submitting...' : 'Finish Assessment'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Enhanced Sidebar - Question Navigator */}
            <div className="xl:col-span-1">
              {assessment && (
                <div className="sticky top-24">
                  <QuestionNavigator
                    questions={assessment.questions}
                    currentIndex={currentQuestionIndex}
                    answers={answers}
                    onQuestionClick={handleQuestionClick}
                  />
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 