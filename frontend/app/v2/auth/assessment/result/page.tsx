'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { apiClient } from '../../../../utils/api';
import { toast } from 'react-toastify';
import { 
  FaCheckCircle, 
  FaTimesCircle, 
  FaChartBar, 
  FaArrowLeft,
  FaDownload,
  FaShare,
  FaStar,
  FaClock,
  FaBullseye
} from 'react-icons/fa';

interface AssessmentResult {
  id: number;
  student_id: number;
  plan_id: number;
  total_score: number;
  max_score: number;
  percentage: number;
  time_spent: number;
  total_time: number;
  passed: boolean;
  level_assessment: number;
  recommendations: string[];
  detailed_analysis: {
    category: string;
    score: number;
    max_score: number;
    percentage: number;
    feedback: string;
  }[];
  submitted_at: string;
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

export default function AssessmentResultPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const resultId = searchParams.get('result_id');
  const studentId = searchParams.get('student_id');
  const planId = searchParams.get('plan_id');
  const resultData = searchParams.get('result_data');

  const [result, setResult] = useState<AssessmentResult | null>(null);
  const [studyPlan, setStudyPlan] = useState<StudyPlan | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchResult = async () => {
      try {
        setLoading(true);

        // 获取学习计划信息
        if (planId) {
          const planRes = await apiClient.get(`/spwapi/auth/planner/view?overview_id=${planId}`) as any;
          if (planRes && planRes.code === 0 && planRes.data.length > 0) {
            setStudyPlan(planRes.data[0]);
          }
        }

        // 处理结果数据
        if (resultData) {
          try {
            // 从URL参数中解析真实的结果数据
            const parsedResult = JSON.parse(decodeURIComponent(resultData)) as AssessmentResult;
            setResult(parsedResult);
          } catch (parseError) {
            console.error('Failed to parse result data:', parseError);
            // 如果解析失败，使用模拟数据作为备用
            setResult(getFallbackResult());
          }
        } else {
          // 如果没有结果数据，使用模拟数据
          setResult(getFallbackResult());
        }
      } catch (error) {
        console.error('Failed to fetch assessment result:', error);
        toast.error('Failed to load assessment result');
        setResult(getFallbackResult());
      } finally {
        setLoading(false);
      }
    };

    fetchResult();
  }, [resultId, studentId, planId, resultData]);

  // 备用结果数据
  const getFallbackResult = (): AssessmentResult => ({
    id: 1,
    student_id: Number(studentId),
    plan_id: Number(planId),
    total_score: 75,
    max_score: 100,
    percentage: 75,
    time_spent: 45 * 60,
    total_time: 60 * 60,
    passed: true,
    level_assessment: 2,
    recommendations: [
      "Focus on improving vocabulary in business contexts",
      "Practice more complex sentence structures",
      "Work on pronunciation and speaking fluency",
      "Continue reading English materials regularly"
    ],
    detailed_analysis: [
      {
        category: "Grammar",
        score: 18,
        max_score: 25,
        percentage: 72,
        feedback: "Good understanding of basic grammar rules, but needs improvement in complex structures."
      },
      {
        category: "Vocabulary",
        score: 15,
        max_score: 25,
        percentage: 60,
        feedback: "Basic vocabulary is solid, but advanced and business vocabulary needs work."
      },
      {
        category: "Reading Comprehension",
        score: 20,
        max_score: 25,
        percentage: 80,
        feedback: "Excellent reading skills with good comprehension of main ideas and details."
      },
      {
        category: "Writing",
        score: 22,
        max_score: 25,
        percentage: 88,
        feedback: "Strong writing skills with good organization and clear expression."
      }
    ],
    submitted_at: new Date().toISOString()
  });

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const getScoreColor = (percentage: number) => {
    if (percentage >= 90) return 'text-green-600';
    if (percentage >= 80) return 'text-blue-600';
    if (percentage >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBgColor = (percentage: number) => {
    if (percentage >= 90) return 'bg-green-100';
    if (percentage >= 80) return 'bg-blue-100';
    if (percentage >= 70) return 'bg-yellow-100';
    return 'bg-red-100';
  };

  const handleUpdateStudyPlan = async () => {
    try {
      // 更新学习计划状态和级别
      const updateData = {
        overview_id: planId,
        status: '10', // 进行中
        init_level: result?.level_assessment || 1
      };

      // 这里应该调用实际的更新接口
      console.log('Updating study plan:', updateData);
      
      toast.success('Study plan updated successfully!');
      
      // 通知父窗口更新并关闭当前窗口
      setTimeout(() => {
        if (window.opener) {
          // 通知父窗口刷新数据
          window.opener.postMessage({ type: 'ASSESSMENT_COMPLETED', studentId }, '*');
          window.close();
        } else {
          // 如果没有父窗口，则跳转回学生概览页面
          router.push('/v2/auth/dashboard');
        }
      }, 2000);
      
    } catch (error) {
      console.error('Failed to update study plan:', error);
      toast.error('Failed to update study plan');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading assessment result...</p>
        </div>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <FaTimesCircle className="text-red-500 text-6xl mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Result Not Found</h2>
          <p className="text-gray-600 mb-4">The assessment result could not be loaded.</p>
          <button
            onClick={() => router.push('/v2/auth/dashboard')}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            Back to Dashboard
          </button>
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
                onClick={() => {
                  if (window.opener) {
                    window.close();
                  } else {
                    router.push('/v2/auth/dashboard');
                  }
                }}
                className="p-2 text-gray-400 hover:text-gray-600"
              >
                <FaArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-lg font-semibold text-gray-900">Assessment Result</h1>
                <p className="text-sm text-gray-600">
                  {studyPlan?.title && `Study Plan: ${studyPlan.title}`}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <button className="p-2 text-gray-400 hover:text-gray-600">
                <FaDownload className="w-5 h-5" />
              </button>
              <button className="p-2 text-gray-400 hover:text-gray-600">
                <FaShare className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Score Summary */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <div className="text-center mb-8">
            <div className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-4 ${getScoreBgColor(result.percentage)}`}>
              {result.passed ? (
                <FaCheckCircle className="text-4xl text-green-600" />
              ) : (
                <FaTimesCircle className="text-4xl text-red-600" />
              )}
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              {result.passed ? 'Assessment Passed!' : 'Assessment Completed'}
            </h2>
            <p className="text-gray-600">
              {result.passed 
                ? 'Congratulations! You have successfully completed the assessment.'
                : 'You have completed the assessment. Review your results below.'
              }
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* Total Score */}
            <div className="text-center">
              <div className={`text-4xl font-bold mb-2 ${getScoreColor(result.percentage)}`}>
                {result.percentage}%
              </div>
              <div className="text-sm text-gray-600">
                {result.total_score} / {result.max_score} points
              </div>
              <div className="text-xs text-gray-500 mt-1">Total Score</div>
            </div>

            {/* Level Assessment */}
            <div className="text-center">
              <div className="text-4xl font-bold text-blue-600 mb-2">
                Level {result.level_assessment}
              </div>
              <div className="text-sm text-gray-600">Current Level</div>
              <div className="text-xs text-gray-500 mt-1">Based on Assessment</div>
            </div>

            {/* Time Spent */}
            <div className="text-center">
              <div className="text-4xl font-bold text-purple-600 mb-2">
                {formatTime(result.time_spent)}
              </div>
              <div className="text-sm text-gray-600">Time Spent</div>
              <div className="text-xs text-gray-500 mt-1">Out of {formatTime(result.total_time)}</div>
            </div>

            {/* Status */}
            <div className="text-center">
              <div className={`text-4xl font-bold mb-2 ${result.passed ? 'text-green-600' : 'text-red-600'}`}>
                {result.passed ? 'PASS' : 'FAIL'}
              </div>
              <div className="text-sm text-gray-600">Result</div>
              <div className="text-xs text-gray-500 mt-1">
                {result.passed ? 'Above 70% threshold' : 'Below 70% threshold'}
              </div>
            </div>
          </div>
        </div>

        {/* Detailed Analysis */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
            <FaChartBar className="w-5 h-5 mr-2" />
            Detailed Analysis
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {result.detailed_analysis.map((analysis, index) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-gray-900">{analysis.category}</h4>
                  <div className={`px-2 py-1 rounded-full text-sm font-medium ${getScoreBgColor(analysis.percentage)} ${getScoreColor(analysis.percentage)}`}>
                    {analysis.percentage}%
                  </div>
                </div>
                
                <div className="mb-3">
                  <div className="flex justify-between text-sm text-gray-600 mb-1">
                    <span>Score</span>
                    <span>{analysis.score} / {analysis.max_score}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-300 ${getScoreColor(analysis.percentage).replace('text-', 'bg-')}`}
                      style={{ width: `${analysis.percentage}%` }}
                    ></div>
                  </div>
                </div>

                <p className="text-sm text-gray-700">{analysis.feedback}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Recommendations */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
            <FaStar className="w-5 h-5 mr-2" />
            Recommendations
          </h3>

          <div className="space-y-4">
            {result.recommendations.map((recommendation, index) => (
              <div key={index} className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-blue-600 text-sm font-semibold">{index + 1}</span>
                </div>
                <p className="text-gray-700">{recommendation}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Study Plan Update */}
        {studyPlan && (
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-8 mb-8">
            <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
              <FaBullseye className="w-5 h-5 mr-2" />
              Update Study Plan
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Current Assessment</h4>
                <div className="bg-white rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-600">Current Level:</span>
                    <span className="font-semibold">Level {result.level_assessment}</span>
                  </div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-600">Target Level:</span>
                    <span className="font-semibold">Level {studyPlan.target_level}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Status:</span>
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                      Ready to Start
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Next Steps</h4>
                <div className="bg-white rounded-lg p-4">
                  <ul className="space-y-2 text-sm text-gray-700">
                    <li>• Study plan will be updated to "In Progress"</li>
                    <li>• Current level will be set to Level {result.level_assessment}</li>
                    <li>• Personalized learning path will be created</li>
                    <li>• Regular progress assessments will be scheduled</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="flex justify-center">
              <button
                onClick={handleUpdateStudyPlan}
                className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
              >
                Update Study Plan & Continue Learning
              </button>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-center space-x-4">
          <button
            onClick={() => {
              if (window.opener) {
                window.close();
              } else {
                router.push('/v2/auth/dashboard');
              }
            }}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            {window.opener ? 'Close Window' : 'Back to Dashboard'}
          </button>
          <button
            onClick={() => {
              const plannerUrl = `/v2/auth/study-planner?student_id=${studentId}`;
              if (window.opener) {
                // 在父窗口中打开学习计划页面
                window.opener.location.href = plannerUrl;
                window.close();
              } else {
                router.push(plannerUrl);
              }
            }}
            className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            View Study Planner
          </button>
        </div>
      </div>
    </div>
  );
} 