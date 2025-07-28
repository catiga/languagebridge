'use client';

import React from 'react';
import { FaCheck, FaCircle, FaQuestion } from 'react-icons/fa';

interface Question {
  id?: number;
  type: string;
  question: string;
  points?: number;
}

interface Answer {
  question_id: number | undefined;
  answer: string | string[];
  time_spent: number;
}

interface QuestionNavigatorProps {
  questions: Question[];
  currentIndex: number;
  answers: Answer[];
  onQuestionClick: (index: number) => void;
}

export default function QuestionNavigator({
  questions,
  currentIndex,
  answers,
  onQuestionClick
}: QuestionNavigatorProps) {
  const getQuestionStatus = (questionIndex: number) => {
    const question = questions[questionIndex];
    const answer = answers.find(a => a.question_id === question.id);
    
    if (questionIndex === currentIndex) {
      return 'current';
    } else if (answer) {
      return 'answered';
    } else {
      return 'unanswered';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'current':
        return <FaCircle className="w-4 h-4 text-blue-600" />;
      case 'answered':
        return <FaCheck className="w-4 h-4 text-green-600" />;
      case 'unanswered':
        return <FaQuestion className="w-4 h-4 text-gray-400" />;
      default:
        return <FaQuestion className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'current':
        return 'bg-blue-50 border-blue-200 text-blue-900';
      case 'answered':
        return 'bg-green-50 border-green-200 text-green-900';
      case 'unanswered':
        return 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-600';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border p-4">
      <h3 className="text-sm font-semibold text-gray-900 mb-3">Question Navigator</h3>
      <div className="grid grid-cols-5 gap-2">
        {questions.map((question, index) => {
          const status = getQuestionStatus(index);
          return (
            <button
              key={question.id}
              onClick={() => onQuestionClick(index)}
              className={`
                p-2 rounded-lg border text-xs font-medium transition-colors
                ${getStatusClass(status)}
                ${status === 'current' ? 'ring-2 ring-blue-500' : ''}
              `}
              title={`Question ${index + 1}: ${question.type} (${question.points} points)`}
            >
              <div className="flex flex-col items-center space-y-1">
                {getStatusIcon(status)}
                <span>{index + 1}</span>
              </div>
            </button>
          );
        })}
      </div>
      
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="flex items-center justify-between text-xs text-gray-600">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1">
              <FaCircle className="w-3 h-3 text-blue-600" />
              <span>Current</span>
            </div>
            <div className="flex items-center space-x-1">
              <FaCheck className="w-3 h-3 text-green-600" />
              <span>Answered</span>
            </div>
            <div className="flex items-center space-x-1">
              <FaQuestion className="w-3 h-3 text-gray-400" />
              <span>Unanswered</span>
            </div>
          </div>
          <div className="text-right">
            <div className="font-medium">
              {answers.length} / {questions.length} answered
            </div>
            <div className="text-gray-500">
              {Math.round((answers.length / questions.length) * 100)}% complete
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 