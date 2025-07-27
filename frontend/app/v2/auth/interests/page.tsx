'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '../../../utils/api';
import Navigation from '../dashboard/components/Navigation';

interface Tag {
  id: number;
  name: string;
  desc: string;
}

interface UserTag {
  id: number;
  tag_id: number;
  tag_name: string;
  add_time: string;
}

export default function InterestsPage() {
  const [availableTags, setAvailableTags] = useState<Tag[]>([]);
  const [userTags, setUserTags] = useState<UserTag[]>([]);
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    // 页面加载时立即开始获取数据
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // 并行获取系统标签和用户标签
      const [tagsRes, userTagsRes] = await Promise.all([
        apiClient.get('/spwapi/public/tags') as Promise<any>,
        apiClient.get('/spwapi/auth/interest/fetch') as Promise<any>
      ]);

      // 处理系统标签
      if (tagsRes && tagsRes.code === 0 && tagsRes.data) {
        setAvailableTags(tagsRes.data);
      } else {
        // 使用假数据作为fallback
        setAvailableTags([
          { id: 1, name: 'English Learning', desc: 'Master English speaking, writing, and comprehension' },
          { id: 2, name: 'Programming', desc: 'Learn coding and software development skills' },
          { id: 3, name: 'Chinese Learning', desc: 'Study Chinese language and culture' },
          { id: 4, name: 'Business Skills', desc: 'Develop professional business capabilities' },
          { id: 5, name: 'Academic Subjects', desc: 'Mathematics, Science, and other academic topics' },
          { id: 6, name: 'Art & Design', desc: 'Creative arts, design, and visual communication' },
          { id: 7, name: 'Music', desc: 'Learn musical instruments and theory' },
          { id: 8, name: 'Sports & Fitness', desc: 'Physical education and wellness' }
        ]);
      }

      // 处理用户标签
      if (userTagsRes && userTagsRes.code === 0 && userTagsRes.data) {
        setUserTags(userTagsRes.data);
        setSelectedTagIds(userTagsRes.data.map((tag: UserTag) => tag.tag_id));
      } else {
        setUserTags([]);
        setSelectedTagIds([]);
      }
    } catch (error) {
      console.error('Failed to fetch interest data:', error);
      setError('Failed to load interest data. Please try again.');
      
      // 使用假数据作为fallback
      setAvailableTags([
        { id: 1, name: 'English Learning', desc: 'Master English speaking, writing, and comprehension' },
        { id: 2, name: 'Programming', desc: 'Learn coding and software development skills' },
        { id: 3, name: 'Chinese Learning', desc: 'Study Chinese language and culture' },
        { id: 4, name: 'Business Skills', desc: 'Develop professional business capabilities' },
        { id: 5, name: 'Academic Subjects', desc: 'Mathematics, Science, and other academic topics' },
        { id: 6, name: 'Art & Design', desc: 'Creative arts, design, and visual communication' },
        { id: 7, name: 'Music', desc: 'Learn musical instruments and theory' },
        { id: 8, name: 'Sports & Fitness', desc: 'Physical education and wellness' }
      ]);
      setUserTags([]);
      setSelectedTagIds([]);
    } finally {
      setLoading(false);
    }
  };

  const handleTagToggle = (tagId: number) => {
    setSelectedTagIds(prev => 
      prev.includes(tagId)
        ? prev.filter(id => id !== tagId)
        : [...prev, tagId]
    );
  };

  const handleUpdateInterests = async () => {
    try {
      setUpdating(true);
      setError(null);
      setSuccess(null);

      const res = await apiClient.post('/spwapi/auth/interest/update', {
        tags: selectedTagIds
      }) as any;

      if (res && res.code === 0) {
        // 更新本地状态
        const updatedUserTags = availableTags
          .filter(tag => selectedTagIds.includes(tag.id))
          .map(tag => ({
            id: tag.id,
            tag_id: tag.id,
            tag_name: tag.name,
            add_time: new Date().toISOString()
          }));
        
        setUserTags(updatedUserTags);
        setSuccess('Your interests have been updated successfully!');
        
        // 3秒后清除成功消息
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(res?.msg || 'Failed to update interests');
      }
    } catch (error) {
      console.error('Failed to update interests:', error);
      setError('Failed to update interests. Please try again.');
    } finally {
      setUpdating(false);
    }
  };

  const getTagIcon = (tagName: string) => {
    const iconMap: { [key: string]: string } = {
      'English Learning': '🇺🇸',
      'Programming': '💻',
      'Chinese Learning': '🇨🇳',
      'Business Skills': '💼',
      'Academic Subjects': '📚',
      'Art & Design': '🎨',
      'Music': '🎵',
      'Sports & Fitness': '🏃‍♂️'
    };
    return iconMap[tagName] || '📌';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
            
            {/* Current Interests Loading */}
            <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
              <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
              <div className="flex flex-wrap gap-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-8 bg-gray-200 rounded-full w-24"></div>
                ))}
              </div>
            </div>

            {/* Available Interests Loading */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="h-6 bg-gray-200 rounded w-1/3"></div>
                <div className="h-10 bg-gray-200 rounded w-32"></div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="p-6 border-2 border-gray-200 rounded-lg">
                    <div className="flex items-center mb-3">
                      <div className="w-8 h-8 bg-gray-200 rounded mr-3"></div>
                      <div className="flex-1">
                        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      </div>
                    </div>
                    <div className="h-3 bg-gray-200 rounded w-full mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Interest Management</h1>
          <p className="text-gray-600 mt-2">
            Select your learning interests to get personalized course recommendations and improve your learning experience.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-600">{success}</p>
          </div>
        )}

        {/* Current Interests */}
        {userTags.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Your Current Interests</h2>
            <div className="flex flex-wrap gap-3">
              {userTags.map((tag) => (
                <span
                  key={tag.id}
                  className="inline-flex items-center px-4 py-2 rounded-full text-sm bg-blue-100 text-blue-800"
                >
                  <span className="mr-2">{getTagIcon(tag.tag_name)}</span>
                  {tag.tag_name}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Available Interests */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">
              Select Your Interests ({selectedTagIds.length} selected)
            </h2>
            <button
              onClick={handleUpdateInterests}
              disabled={updating}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {updating ? 'Updating...' : 'Update Interests'}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {availableTags.map((tag) => {
              const isSelected = selectedTagIds.includes(tag.id);
              return (
                <div
                  key={tag.id}
                  className={`p-6 border-2 rounded-lg cursor-pointer transition-all ${
                    isSelected
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => handleTagToggle(tag.id)}
                >
                  <div className="flex items-center mb-3">
                    <span className="text-3xl mr-3">{getTagIcon(tag.name)}</span>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{tag.name}</h3>
                    </div>
                    {isSelected && (
                      <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <p className="text-sm text-gray-600">{tag.desc}</p>
                </div>
              );
            })}
          </div>

          {/* Update Button */}
          <div className="mt-8 flex justify-end">
            <button
              onClick={handleUpdateInterests}
              disabled={updating || selectedTagIds.length === 0}
              className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-lg font-medium"
            >
              {updating ? 'Updating...' : `Update ${selectedTagIds.length} Interest${selectedTagIds.length !== 1 ? 's' : ''}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 