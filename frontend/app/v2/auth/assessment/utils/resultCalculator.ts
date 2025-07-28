interface Question {
  id?: number;
  type: 'single_choice' | 'multiple_choice' | 'cloze' | 'writing';
  question: string;
  options?: string[];
  answer: string;
  explanation: string;
  points?: number;
  time_limit?: number;
}

interface Answer {
  question_id: number | undefined;
  answer: string | string[];
  time_spent: number;
}

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

// 题目分类映射
const questionCategories = {
  'single_choice': 'Grammar',
  'multiple_choice': 'Vocabulary',
  'cloze': 'Grammar',
  'writing': 'Writing'
};

// 计算单个题目的得分
const calculateQuestionScore = (question: Question, userAnswer: Answer): number => {
  if (!userAnswer.answer || userAnswer.answer === '') {
    return 0;
  }

  const correctAnswer = question.answer;
  const userAnswerStr = Array.isArray(userAnswer.answer) ? userAnswer.answer.join(';') : userAnswer.answer;

  switch (question.type) {
    case 'single_choice':
      return userAnswerStr === correctAnswer ? (question.points || 5) : 0;
    
    case 'multiple_choice':
      const correctAnswers = correctAnswer.split(';').sort();
      const userAnswers = userAnswerStr.split(';').sort();
      
      if (correctAnswers.length !== userAnswers.length) {
        return 0;
      }
      
      const isCorrect = correctAnswers.every((ans, index) => ans === userAnswers[index]);
      return isCorrect ? (question.points || 10) : 0;
    
    case 'cloze':
      // 对于完形填空，允许部分匹配（忽略大小写和空格）
      const normalizedCorrect = correctAnswer.toLowerCase().trim();
      const normalizedUser = userAnswerStr.toLowerCase().trim();
      return normalizedUser === normalizedCorrect ? (question.points || 5) : 0;
    
    case 'writing':
      // 对于写作题，基于字数、语法和内容评分
      const wordCount = userAnswerStr.split(/\s+/).length;
      if (wordCount < 10) return 0;
      if (wordCount < 20) return Math.floor((question.points || 20) * 0.5);
      if (wordCount < 30) return Math.floor((question.points || 20) * 0.7);
      return question.points || 20;
    
    default:
      return 0;
  }
};

// 根据总分计算等级
const calculateLevel = (percentage: number): number => {
  if (percentage >= 90) return 5;
  if (percentage >= 80) return 4;
  if (percentage >= 70) return 3;
  if (percentage >= 60) return 2;
  return 1;
};

// 生成个性化建议
const generateRecommendations = (detailedAnalysis: any[], level: number): string[] => {
  const recommendations: string[] = [];
  
  // 基于各科目表现生成建议
  detailedAnalysis.forEach(analysis => {
    if (analysis.percentage < 70) {
      switch (analysis.category) {
        case 'Grammar':
          recommendations.push('Focus on improving grammar rules, especially complex sentence structures');
          break;
        case 'Vocabulary':
          recommendations.push('Expand your vocabulary, particularly in business and academic contexts');
          break;
        case 'Reading Comprehension':
          recommendations.push('Practice reading comprehension with more challenging texts');
          break;
        case 'Writing':
          recommendations.push('Work on writing skills, including organization and clarity');
          break;
      }
    }
  });

  // 基于整体等级生成建议
  if (level <= 2) {
    recommendations.push('Consider starting with basic English courses to build a strong foundation');
  } else if (level <= 3) {
    recommendations.push('Continue practicing with intermediate-level materials');
  } else {
    recommendations.push('Challenge yourself with advanced materials to reach higher proficiency');
  }

  // 通用建议
  recommendations.push('Practice English regularly through reading, writing, and conversation');
  recommendations.push('Use language learning apps and resources to supplement your studies');

  return recommendations.slice(0, 4); // 限制建议数量
};

// 生成详细分析
const generateDetailedAnalysis = (questions: Question[], answers: Answer[]): any[] => {
  const categoryScores: { [key: string]: { score: number; maxScore: number; count: number } } = {};
  
  // 初始化分类分数
  Object.values(questionCategories).forEach(category => {
    categoryScores[category] = { score: 0, maxScore: 0, count: 0 };
  });

  // 计算每个分类的分数
  questions.forEach(question => {
    const category = questionCategories[question.type as keyof typeof questionCategories];
    const answer = answers.find(a => a.question_id === question.id);
    const maxScore = question.points || 5;
    
    if (categoryScores[category]) {
      categoryScores[category].maxScore += maxScore;
      categoryScores[category].count += 1;
      
      if (answer) {
        categoryScores[category].score += calculateQuestionScore(question, answer);
      }
    }
  });

  // 生成详细分析
  return Object.entries(categoryScores).map(([category, data]) => {
    const percentage = data.maxScore > 0 ? Math.round((data.score / data.maxScore) * 100) : 0;
    
    let feedback = '';
    if (percentage >= 90) {
      feedback = `Excellent performance in ${category.toLowerCase()}. Keep up the great work!`;
    } else if (percentage >= 80) {
      feedback = `Good ${category.toLowerCase()} skills with room for improvement in advanced areas.`;
    } else if (percentage >= 70) {
      feedback = `Solid foundation in ${category.toLowerCase()}, but needs more practice with complex concepts.`;
    } else {
      feedback = `Basic ${category.toLowerCase()} understanding needs improvement. Focus on fundamental concepts.`;
    }

    return {
      category,
      score: data.score,
      max_score: data.maxScore,
      percentage,
      feedback
    };
  });
};

// 主计算函数
export const calculateAssessmentResult = (
  questions: Question[],
  answers: Answer[],
  totalTimeSpent: number,
  totalTime: number,
  studentId: number,
  planId: number,
  examId: number
): AssessmentResult => {
  // 计算总分
  let totalScore = 0;
  let maxScore = 0;
  
  questions.forEach(question => {
    const answer = answers.find(a => a.question_id === question.id);
    const questionMaxScore = question.points || 5;
    
    maxScore += questionMaxScore;
    if (answer) {
      totalScore += calculateQuestionScore(question, answer);
    }
  });

  const percentage = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;
  const passed = percentage >= 70;
  const level = calculateLevel(percentage);

  // 生成详细分析
  const detailedAnalysis = generateDetailedAnalysis(questions, answers);
  
  // 生成建议
  const recommendations = generateRecommendations(detailedAnalysis, level);

  return {
    id: examId,
    student_id: studentId,
    plan_id: planId,
    total_score: totalScore,
    max_score: maxScore,
    percentage,
    time_spent: totalTimeSpent,
    total_time: totalTime,
    passed,
    level_assessment: level,
    recommendations,
    detailed_analysis: detailedAnalysis,
    submitted_at: new Date().toISOString()
  };
}; 