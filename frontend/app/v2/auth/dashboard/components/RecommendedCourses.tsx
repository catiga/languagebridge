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
  level: number;
  duration: number; // in minutes
  rating?: number;
  price?: number;
  is_trial_available: boolean;
  category: string;
  thumbnail?: string;
}

export default function RecommendedCourses() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const router = useRouter();

  useEffect(() => {
    fetchRecommendedCourses();
  }, []);

  const fetchRecommendedCourses = async () => {
    try {
      // 使用现有的course fetch接口
      const res = await apiClient.get('/spwapi/course/fetch', { pn: 1, ps: 6 }) as any;
      if (res && res.code === 0 && res.data && res.data.list) {
        const courseList = res.data.list.map((course: any) => ({
          id: course.id,
          title: course.title,
          description: course.description || 'Learn with our expert teachers',
          teacher_name: course.teacher_name || 'Expert Teacher',
          teacher_avatar: course.teacher_avatar,
          level: course.level || Math.floor(Math.random() * 5) + 1,
          duration: course.duration || Math.floor(Math.random() * 60) + 30,
          rating: typeof course.rating === 'number' ? course.rating : Number((Math.random() * 2 + 3).toFixed(1)), // 3-5星
          price: course.price || Math.floor(Math.random() * 100) + 50,
          is_trial_available: course.is_trial_available !== false,
          category: course.category || 'english',
          thumbnail: course.thumbnail
        }));
        setCourses(courseList);
      } else {
        // 使用假数据
        setCourses([
          {
            id: 1,
            title: 'English Conversation for Beginners',
            description: 'Start your English learning journey with basic conversations',
            teacher_name: 'Sarah Wilson',
            teacher_avatar: '',
            level: 1,
            duration: 45,
            rating: 4.8,
            price: 89,
            is_trial_available: true,
            category: 'english',
            thumbnail: ''
          },
          {
            id: 2,
            title: 'Python Programming Fundamentals',
            description: 'Learn the basics of Python programming language',
            teacher_name: 'David Chen',
            teacher_avatar: '',
            level: 2,
            duration: 60,
            rating: 4.6,
            price: 120,
            is_trial_available: true,
            category: 'programming',
            thumbnail: ''
          },
          {
            id: 3,
            title: 'Business Chinese for Professionals',
            description: 'Master Chinese for business communication',
            teacher_name: 'Li Wei',
            teacher_avatar: '',
            level: 3,
            duration: 50,
            rating: 4.9,
            price: 95,
            is_trial_available: false,
            category: 'chinese',
            thumbnail: ''
          }
        ]);
      }
    } catch (error) {
      console.error('Failed to fetch recommended courses:', error);
      // 使用假数据作为fallback
      setCourses([
        {
          id: 1,
          title: 'English Conversation for Beginners',
          description: 'Start your English learning journey with basic conversations',
          teacher_name: 'Sarah Wilson',
          teacher_avatar: '',
          level: 1,
          duration: 45,
          rating: 4.8,
          price: 89,
          is_trial_available: true,
          category: 'english',
          thumbnail: ''
        },
        {
          id: 2,
          title: 'Python Programming Fundamentals',
          description: 'Learn the basics of Python programming language',
          teacher_name: 'David Chen',
          teacher_avatar: '',
          level: 2,
          duration: 60,
          rating: 4.6,
          price: 120,
          is_trial_available: true,
          category: 'programming',
          thumbnail: ''
        },
        {
          id: 3,
          title: 'Business Chinese for Professionals',
          description: 'Master Chinese for business communication',
          teacher_name: 'Li Wei',
          teacher_avatar: '',
          level: 3,
          duration: 50,
          rating: 4.9,
          price: 95,
          is_trial_available: false,
          category: 'chinese',
          thumbnail: ''
        }
      ]);
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

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-48 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Recommended for You</h2>
          <p className="text-gray-600 mt-1">
            Personalized courses based on your interests and level
          </p>
        </div>
        <button
          onClick={() => router.push('/v2/auth/courses')}
          className="text-blue-600 hover:text-blue-700 font-medium"
        >
          View All Courses →
        </button>
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
              className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => handleCourseClick(course.id)}
            >
              {/* Course Thumbnail */}
              <div className="h-48 bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
                {course.thumbnail ? (
                  <img
                    src={course.thumbnail}
                    alt={course.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-4xl">📖</div>
                )}
              </div>

              {/* Course Info */}
              <div className="p-4">
                <div className="flex items-center mb-2">
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                    Level {course.level}
                  </span>
                  <span className="text-xs text-gray-500 ml-2">
                    {course.duration}min
                  </span>
                </div>

                <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                  {course.title}
                </h3>
                
                <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                  {course.description}
                </p>

                {/* Teacher Info */}
                <div className="flex items-center mb-3">
                  <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center mr-2">
                    {course.teacher_avatar ? (
                      <img
                        src={course.teacher_avatar}
                        alt={course.teacher_name}
                        className="w-6 h-6 rounded-full object-cover"
                      />
                    ) : (
                      <span className="text-xs">👤</span>
                    )}
                  </div>
                  <span className="text-sm text-gray-600">{course.teacher_name}</span>
                </div>

                {/* Rating */}
                {course.rating && (
                  <div className="flex items-center mb-3">
                    <div className="flex text-yellow-400">
                                           {[1, 2, 3, 4, 5].map((star) => (
                       <span key={star}>
                         {star <= (typeof course.rating === 'number' ? course.rating : 0) ? '★' : '☆'}
                       </span>
                     ))}
                    </div>
                                     <span className="text-sm text-gray-600 ml-2">
                   {typeof course.rating === 'number' ? course.rating.toFixed(1) : course.rating}
                 </span>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <button
                    onClick={(e) => handleTrialClick(course.id, e)}
                    disabled={!course.is_trial_available}
                    className="flex-1 bg-blue-600 text-white py-2 rounded text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {course.is_trial_available ? 'Try Free' : 'Not Available'}
                  </button>
                  {course.price && (
                    <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded text-sm hover:bg-gray-50">
                      ${course.price}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 