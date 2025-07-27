'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '../../../../utils/api';

interface UserInfo {
  id: number;
  name: string;
  email: string;
  interests?: string[];
  level?: number;
}

interface UserTag {
  id: number;
  tag_id: number;
  tag_name: string;
  add_time: string;
}

interface Tag {
  id: number;
  name: string;
  desc: string;
}

export default function WelcomeSection() {
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [userTags, setUserTags] = useState<UserTag[]>([]);
  const [availableTags, setAvailableTags] = useState<Tag[]>([]);
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dataLoaded, setDataLoaded] = useState(false);

  useEffect(() => {
    fetchUserInfo();
  }, []);

  useEffect(() => {
    // 只在展开时获取数据
    if (isExpanded && !dataLoaded) {
      fetchAvailableTags();
    }
  }, [isExpanded, dataLoaded]);

  const fetchUserInfo = async () => {
    try {
      // 获取用户信息和兴趣数据
      const [profileRes, interestRes] = await Promise.all([
        apiClient.post('/spwapi/auth/profile/retrieve') as Promise<any>,
        apiClient.get('/spwapi/auth/interest/fetch') as Promise<any>
      ]);

      if (profileRes && profileRes.code === 0 && profileRes.data) {
        const userData = {
          id: profileRes.data.id || 1,
          name: profileRes.data.nick_name || profileRes.data.email || 'User',
          email: profileRes.data.email || '',
          interests: [],
          level: profileRes.data.level || 1
        };

        // 处理兴趣数据
        if (interestRes && interestRes.code === 0 && interestRes.data) {
          setUserTags(interestRes.data);
          userData.interests = interestRes.data.map((tag: UserTag) => tag.tag_name);
        }

        setUserInfo(userData);
      }
    } catch (error) {
      console.error('Failed to fetch user info:', error);
      // 使用假数据作为fallback
      setUserInfo({
        id: 1,
        name: 'John Doe',
        email: 'john@example.com',
        interests: ['English Learning', 'Programming'],
        level: 1
      });
      setUserTags([
        { id: 1, tag_id: 1, tag_name: 'English Learning', add_time: new Date().toISOString() },
        { id: 2, tag_id: 2, tag_name: 'Programming', add_time: new Date().toISOString() }
      ]);
    }
  };

  const fetchAvailableTags = async () => {
    try {
      setLoading(true);
      setError(null);

      const tagsRes = await apiClient.get('/spwapi/public/tags') as any;

      if (tagsRes && tagsRes.code === 0 && tagsRes.data) {
        setAvailableTags(tagsRes.data);
        // 设置当前选中的标签
        setSelectedTagIds(userTags.map(tag => tag.tag_id));
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
        setSelectedTagIds(userTags.map(tag => tag.tag_id));
      }
    } catch (error) {
      console.error('Failed to fetch available tags:', error);
      setError('Failed to load available interests. Please try again.');
      
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
      setSelectedTagIds(userTags.map(tag => tag.tag_id));
    } finally {
      setLoading(false);
      setDataLoaded(true);
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
        // 更新成功后收起面板
        setIsExpanded(false);
        setDataLoaded(false); // 重置数据加载状态
        console.log('Interests updated successfully');
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
      'Sports & Fitness': '🏃‍♂️',
      'Speaking Practice': '🗣️',
      'Listening Practice': '👂',
      'Reading & Writing': '📝',
      'IELTS Preparation': '📚',
      'TOEFL Preparation': '📖',
      'Business English': '💼',
      'Kids English': '👶'
    };
    return iconMap[tagName] || '📌';
  };

  if (!userInfo) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome back, {userInfo.name}! 👋
          </h1>
          <p className="text-gray-600 mt-1">
            Let's continue your learning journey
          </p>
        </div>
        {userInfo.level && (
          <div className="text-right">
            <div className="text-sm text-gray-500">Current Level</div>
            <div className="text-2xl font-bold text-blue-600">Level {userInfo.level}</div>
          </div>
        )}
      </div>

      {/* Interests Section */}
      <div className="border-t pt-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Your Learning Interests</h3>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-blue-600 hover:text-blue-700 text-sm font-medium"
          >
            {isExpanded ? 'Hide' : 'Manage Interests'}
          </button>
        </div>

        {userTags.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {userTags.map((tag) => (
              <span
                key={tag.id}
                className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800"
              >
                <span className="mr-1">{getTagIcon(tag.tag_name)}</span>
                {tag.tag_name}
              </span>
            ))}
          </div>
        ) : (
          <div className="text-center py-6">
            <div className="text-3xl mb-3">🎯</div>
            <h4 className="text-base font-medium text-gray-900 mb-2">
              No interests selected yet
            </h4>
            <p className="text-gray-600 mb-3 text-sm">
              Select your learning interests to get personalized recommendations
            </p>
            <button
              onClick={() => setIsExpanded(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm"
            >
              Select Interests
            </button>
          </div>
        )}

        {/* Expanded Interest Management */}
        {isExpanded && (
          <div className="mt-6 border-t pt-6">
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            {loading ? (
              <div className="animate-pulse">
                <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {[...Array(8)].map((_, i) => (
                    <div key={i} className="h-20 bg-gray-200 rounded"></div>
                  ))}
                </div>
              </div>
            ) : (
              <>
                {/* Available Interests */}
                <div>
                  <h4 className="text-base font-medium text-gray-900 mb-4">
                    Select Your Interests ({selectedTagIds.length} selected)
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {availableTags.map((tag) => {
                      const isSelected = selectedTagIds.includes(tag.id);
                      return (
                        <div
                          key={tag.id}
                          className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                            isSelected
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                          onClick={() => handleTagToggle(tag.id)}
                        >
                          <div className="flex items-center mb-2">
                            <span className="text-2xl mr-2">{getTagIcon(tag.name)}</span>
                            <div className="flex-1">
                              <h5 className="font-medium text-gray-900 text-sm">{tag.name}</h5>
                            </div>
                            {isSelected && (
                              <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                              </div>
                            )}
                          </div>
                          <p className="text-xs text-gray-600 line-clamp-2">{tag.desc}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Update Button */}
                <div className="mt-6 flex justify-end">
                  <button
                    onClick={handleUpdateInterests}
                    disabled={updating || selectedTagIds.length === 0}
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {updating ? 'Updating...' : `Update ${selectedTagIds.length} Interest${selectedTagIds.length !== 1 ? 's' : ''}`}
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
} 