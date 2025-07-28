'use client';

import React, { useState, useEffect } from 'react';
import { FaCog, FaBrain, FaLightbulb, FaCheckCircle } from 'react-icons/fa';

interface GeneratingAssessmentProps {
  studyPlan?: {
    title: string;
    goal: string;
    target_level: number;
    init_level: number;
  };
}

export default function GeneratingAssessment({ studyPlan }: GeneratingAssessmentProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);

  const steps = [
    {
      icon: FaBrain,
      title: "Analyzing Learning Goals",
      description: "Understanding your specific learning objectives and target level",
      color: "text-blue-600"
    },
    {
      icon: FaLightbulb,
      title: "Generating Questions",
      description: "Creating personalized assessment questions based on your level",
      color: "text-purple-600"
    },
    {
      icon: FaCog,
      title: "Optimizing Difficulty",
      description: "Adjusting question difficulty to match your current proficiency",
      color: "text-green-600"
    },
    {
      icon: FaCheckCircle,
      title: "Finalizing Assessment",
      description: "Preparing your personalized assessment for launch",
      color: "text-orange-600"
    }
  ];

  useEffect(() => {
    // 模拟进度更新
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + Math.random() * 15;
      });
    }, 800);

    // 模拟步骤切换
    const stepInterval = setInterval(() => {
      setCurrentStep(prev => {
        if (prev >= steps.length - 1) {
          clearInterval(stepInterval);
          return steps.length - 1;
        }
        return prev + 1;
      });
    }, 2000);

    return () => {
      clearInterval(interval);
      clearInterval(stepInterval);
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white rounded-2xl shadow-2xl p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <FaCog className="text-white text-3xl animate-spin" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Generating Your Assessment
          </h1>
          <p className="text-gray-600">
            Creating a personalized assessment based on your learning goals
          </p>
        </div>

        {/* Study Plan Info */}
        {studyPlan && (
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 mb-8">
            <h3 className="font-semibold text-gray-900 mb-3">Your Learning Plan</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Goal:</span>
                <p className="font-medium text-gray-900">{studyPlan.title}</p>
              </div>
              <div>
                <span className="text-gray-600">Target Level:</span>
                <p className="font-medium text-gray-900">Level {studyPlan.init_level} → Level {studyPlan.target_level}</p>
              </div>
            </div>
          </div>
        )}

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">Generation Progress</span>
            <span className="text-sm font-medium text-gray-700">{Math.round(progress)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className="bg-gradient-to-r from-blue-500 to-purple-600 h-3 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>

        {/* Steps */}
        <div className="space-y-4">
          {steps.map((step, index) => {
            const Icon = step.icon;
            const isActive = index === currentStep;
            const isCompleted = index < currentStep;
            
            return (
              <div
                key={index}
                className={`flex items-center space-x-4 p-4 rounded-lg transition-all duration-300 ${
                  isActive 
                    ? 'bg-blue-50 border-2 border-blue-200' 
                    : isCompleted 
                    ? 'bg-green-50 border-2 border-green-200'
                    : 'bg-gray-50 border-2 border-gray-200'
                }`}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  isActive 
                    ? 'bg-blue-100' 
                    : isCompleted 
                    ? 'bg-green-100'
                    : 'bg-gray-100'
                }`}>
                  <Icon className={`w-5 h-5 ${
                    isActive 
                      ? 'text-blue-600 animate-pulse' 
                      : isCompleted 
                      ? 'text-green-600'
                      : 'text-gray-400'
                  }`} />
                </div>
                <div className="flex-1">
                  <h4 className={`font-medium ${
                    isActive 
                      ? 'text-blue-900' 
                      : isCompleted 
                      ? 'text-green-900'
                      : 'text-gray-500'
                  }`}>
                    {step.title}
                  </h4>
                  <p className={`text-sm ${
                    isActive 
                      ? 'text-blue-700' 
                      : isCompleted 
                      ? 'text-green-700'
                      : 'text-gray-400'
                  }`}>
                    {step.description}
                  </p>
                </div>
                {isActive && (
                  <div className="w-2 h-2 bg-blue-600 rounded-full animate-ping"></div>
                )}
                {isCompleted && (
                  <FaCheckCircle className="w-5 h-5 text-green-600" />
                )}
              </div>
            );
          })}
        </div>

        {/* Tips */}
        <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 bg-yellow-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-yellow-600 text-sm font-semibold">💡</span>
            </div>
            <div>
              <h4 className="font-medium text-yellow-900 mb-1">Why does this take time?</h4>
              <p className="text-sm text-yellow-800">
                We're using AI to analyze your learning goals and create questions that perfectly match your current level and target objectives. This ensures the assessment is truly personalized for your learning journey.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 