'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '../../../../utils/api';

interface Course {
  id: number;
  title: string;
  description: string;
  teacher_name: string;
  teacher_avatar?: string;
  level: string;
  duration: string;
  rating?: number;
  price?: number;
  is_trial_available: boolean;
  category: string;
  thumbnail?: string;
  student_count?: number;
}

interface RecommendedCoursesProps {
  showRecommendations?: boolean;
}

export default function RecommendedCourses({ showRecommendations = true }: RecommendedCoursesProps) {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const router = useRouter();

  useEffect(() => {
    fetchRecommendedCourses();
  }, []);

  const fetchRecommendedCourses = async () => {
    try {
      // 首先获取当前学生的ID（这里需要从context或props获取）
      // 暂时使用假数据，实际应该从用户context获取
      const studentId = 1; // 这里需要从用户context获取
      
      // 获取学生的最新评估ID
      const assessmentResponse = await apiClient.get(`/spwapi/auth/aiagent/assessment/latest?student_id=${studentId}`) as any;
      if (assessmentResponse && assessmentResponse.code === 0 && assessmentResponse.data) {
        const assessmentId = assessmentResponse.data.id;
        
        // 使用评估ID获取推荐课程
        const coursesResponse = await apiClient.get(`/spwapi/auth/aiagent/planner/course/recommend?assessment_id=${assessmentId}`) as any;
        if (coursesResponse && coursesResponse.code === 0) {
          const courseList = coursesResponse.data.map((course: any) => ({
            id: course.id,
            title: course.title,
            description: course.description,
            teacher_name: course.teacher_name,
            teacher_avatar: course.teacher_avatar,
            level: course.level,
            duration: course.duration,
            rating: course.rating,
            price: course.price,
            is_trial_available: true,
            category: 'english',
            thumbnail: course.image_url,
            student_count: course.student_count
          }));
          setCourses(courseList);
        } else {
          console.error('Failed to fetch recommended courses:', coursesResponse?.msg);
          setCourses([]);
        }
      } else {
        console.error('Failed to fetch assessment:', assessmentResponse?.msg);
        setCourses([]);
      }
    } catch (error) {
      console.error('Failed to fetch recommended courses:', error);
      setCourses([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCourseClick = (courseId: number) => {
    router.push(`/v2/auth/courses/${courseId}`);
  };

  const handleTrialClick = (courseId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    router.push(`/v2/auth/courses/${courseId}/trial`);
  };

  const categories = [
    { id: 'all', name: 'All Courses' },
    { id: 'english', name: 'English' },
    { id: 'programming', name: 'Programming' },
    { id: 'chinese', name: 'Chinese' },
    { id: 'business', name: 'Business' },
    { id: 'academic', name: 'Academic' }
  ];

  const filteredCourses = selectedCategory === 'all' 
    ? courses 
    : courses.filter(course => course.category === selectedCategory);

  if (!showRecommendations) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
        <div className="text-center py-6">
          <div className="text-3xl mb-3">📚</div>
          <h3 className="text-base font-medium text-gray-900 mb-2">
            Complete Student Assessment First
          </h3>
          <p className="text-gray-600 text-sm">
            Set learning goals and complete assessments to get personalized course recommendations
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
        <div className="animate-pulse">
          <div className="h-5 bg-gray-200 rounded w-1/3 mb-3"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-40 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-1">🎯 Personalized Course Recommendations</h2>
          <p className="text-gray-600 text-sm">
            Curated based on your current learning level and assessment results
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-medium">
            AI-Powered
          </div>
          <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-medium">
            Personalized
          </div>
        </div>
      </div>
      
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg border border-blue-100 mb-6">
        <div className="flex items-center space-x-3">
          <div className="text-blue-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">Smart Learning Path</p>
            <p className="text-xs text-gray-600">These courses are specifically selected to help you progress efficiently in your English learning journey</p>
          </div>
        </div>
      </div>

      {/* Category Filter */}
      <div className="flex flex-wrap gap-2 mb-6">
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => setSelectedCategory(category.id)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              selectedCategory === category.id
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {category.name}
          </button>
        ))}
      </div>

      {filteredCourses.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-6xl mb-4">📚</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No courses available
          </h3>
          <p className="text-gray-600">
            Complete your profile to get personalized recommendations
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.map((course) => (
            <div
              key={course.id}
              className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1"
            >
              {/* 课程图片 */}
              {course.thumbnail && (
                <div className="relative h-48 bg-gradient-to-br from-blue-500 to-purple-600 rounded-t-xl overflow-hidden">
                  <img 
                    src={course.thumbnail} 
                    alt={course.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                  <div className="absolute top-3 right-3">
                    <div className="bg-white bg-opacity-90 backdrop-blur-sm px-2 py-1 rounded-full text-xs font-medium text-gray-700">
                      {course.level}
                    </div>
                  </div>
                  <div className="absolute bottom-3 left-3">
                    <div className="bg-black bg-opacity-50 backdrop-blur-sm px-2 py-1 rounded-full text-xs font-medium text-white">
                      {course.duration}
                    </div>
                  </div>
                </div>
              )}
              
              <div className="p-5">
                {/* 课程标题和描述 */}
                <div className="mb-4">
                  <h4 className="font-bold text-gray-900 text-lg mb-2 line-clamp-2 leading-tight">{course.title}</h4>
                  <p className="text-sm text-gray-600 line-clamp-3 leading-relaxed">{course.description}</p>
                </div>
                
                {/* 教师信息 */}
                {course.teacher_name && (
                  <div className="flex items-center mb-4">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                      {course.teacher_name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-900">{course.teacher_name}</p>
                      <p className="text-xs text-gray-500">Expert Instructor</p>
                    </div>
                  </div>
                )}
                
                {/* 评分和学员数 */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-4">
                    {course.rating && (
                      <div className="flex items-center">
                        <div className="flex items-center">
                          {[...Array(5)].map((_, i) => (
                            <svg key={i} className={`w-4 h-4 ${i < Math.floor(course.rating!) ? 'text-yellow-400' : 'text-gray-300'}`} fill="currentColor" viewBox="0 0 20 20">
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                          ))}
                        </div>
                        <span className="text-sm font-medium text-gray-700 ml-1">{course.rating}</span>
                      </div>
                    )}
                    {course.student_count && (
                      <div className="flex items-center text-gray-500">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                        </svg>
                        <span className="text-sm">{course.student_count.toLocaleString()}</span>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* 价格和按钮 */}
                <div className="flex items-center justify-between">
                  <div className="text-right">
                    <div className="text-2xl font-bold text-green-600">${course.price}</div>
                    <div className="text-xs text-gray-500">One-time payment</div>
                  </div>
                  <button 
                    className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-2 px-6 rounded-lg text-sm font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-200 transform hover:scale-105 shadow-md"
                    onClick={() => handleCourseClick(course.id)}
                  >
                    Enroll Now
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 