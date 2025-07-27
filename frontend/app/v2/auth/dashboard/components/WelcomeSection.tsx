'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '../../../../utils/api';
import { toast } from 'react-toastify';
import { useRouter } from 'next/navigation';

interface UserInfo {
  id: number;
  user_no: string;
  name: string;
  email: string;
  status?: string;
  avatar?: string;
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
  const router = useRouter();
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [userTags, setUserTags] = useState<UserTag[]>([]);
  const [availableTags, setAvailableTags] = useState<Tag[]>([]);
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailCode, setEmailCode] = useState('');
  const [sendingCode, setSendingCode] = useState(false);
  const [verifyingCode, setVerifyingCode] = useState(false);

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
          user_no: profileRes.data.user_no || '',
          name: profileRes.data.nick_name || profileRes.data.email || 'User',
          email: profileRes.data.email || '',
          status: profileRes.data.status || '00',
          avatar: profileRes.data.avatar || '',
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
        user_no: '2507253026',
        name: 'Jackie',
        email: 'catiga03@gmail.com',
        status: '00',
        avatar: '',
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

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setUploadingAvatar(true);
      
      // 检查文件类型和大小
      if (!file.type.startsWith('image/')) {
        throw new Error('Please select an image file');
      }
      
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        throw new Error('Image size should be less than 5MB');
      }

      // 压缩图片
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = async () => {
        const maxSize = 256;
        let { width, height } = img;
        
        if (width > height) {
          if (width > maxSize) {
            height = (height * maxSize) / width;
            width = maxSize;
          }
        } else {
          if (height > maxSize) {
            width = (width * maxSize) / height;
            height = maxSize;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        
        ctx?.drawImage(img, 0, 0, width, height);
        
        canvas.toBlob(async (blob) => {
          if (!blob) return;
          
          // 上传到imgbb.com
          const formData = new FormData();
          formData.append('image', blob);
          
          const apiKey = 'bbf086ea0c965eeb43bb982b048f1d1b';
          const response = await fetch(`https://api.imgbb.com/1/upload?key=${apiKey}`, {
            method: 'POST',
            body: formData
          });
          
          const result = await response.json();
          
          if (result.success) {
            // 更新用户头像
            const updateRes = await apiClient.post('/spwapi/auth/profile/update', {
              avatar: result.data.url
            }) as any;
            
            if (updateRes && updateRes.code === 0) {
              setUserInfo(prev => prev ? { ...prev, avatar: result.data.url } : null);
            } else {
              throw new Error(updateRes?.msg || 'Failed to update profile');
            }
          } else {
            throw new Error('Image upload failed: ' + (result.error?.message || ''));
          }
        }, 'image/jpeg', 0.8);
      };
      
      img.src = URL.createObjectURL(file);
      
    } catch (error) {
      console.error('Failed to upload avatar:', error);
      setError('Failed to upload avatar. Please try again.');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSendEmailCode = async () => {
    if (!userInfo) return;
    setSendingCode(true);
    try {
      const res = await apiClient.post('/spwapi/auth/email/send', { email: userInfo.email }) as any;
      if (res && res.code === 0) {
        toast.success('Verification code sent!');
      } else {
        toast.error(res?.msg || 'Failed to send code');
      }
    } catch (e: any) {
      toast.error(e?.message || 'Failed to send code');
    } finally {
      setSendingCode(false);
    }
  };

  const handleVerifyEmailCode = async () => {
    if (!userInfo || !emailCode) {
      toast.error('Please enter the verification code');
      return;
    }
    setVerifyingCode(true);
    try {
      const res = await apiClient.post('/spwapi/auth/email/check', { 
        email: userInfo.email, 
        code: emailCode 
      }) as any;
      if (res && res.code === 0) {
        toast.success('Email verified!');
        setUserInfo(prev => prev ? { ...prev, status: '20' } : null);
        setShowEmailModal(false);
        setEmailCode('');
      } else {
        toast.error(res?.msg || 'Verification failed');
      }
    } catch (e: any) {
      toast.error(e?.message || 'Verification failed');
    } finally {
      setVerifyingCode(false);
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
    <div className="bg-gradient-to-r from-blue-50 via-purple-50 to-yellow-50 rounded-lg shadow-sm p-4 mb-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          {/* User Avatar */}
          <div className="relative">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center border-2 border-blue-200 shadow-sm">
              {userInfo.avatar ? (
                <img
                  src={userInfo.avatar}
                  alt={userInfo.name}
                  className="w-14 h-14 rounded-full object-cover"
                />
              ) : (
                <span className="text-2xl text-blue-600">👤</span>
              )}
            </div>
            <label className="absolute -bottom-1 -right-1 w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs hover:bg-blue-700 transition-colors cursor-pointer">
              {uploadingAvatar ? (
                <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                '📷'
              )}
              <input
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                className="hidden"
              />
            </label>
          </div>

          {/* User Info */}
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-1">
              <h1 className="text-xl font-bold text-gray-900">
                Hi, {userInfo.name}!
              </h1>
              {userInfo.status === '20' && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  ✓ Verified
                </span>
              )}
              {userInfo.status === '00' && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                  ⚠ Unverified
                </span>
              )}
            </div>
            <p className="text-gray-600 text-sm mb-1">
              Welcome to your learning dashboard 🎉
            </p>
            <div className="flex items-center space-x-3 text-xs text-gray-500">
              <span>{userInfo.email}</span>
              <div className="w-px h-3 bg-gray-300"></div>
              <span>User No: {userInfo.user_no}</span>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center space-x-2">
          {userInfo.status === '00' && (
            <button 
              onClick={() => setShowEmailModal(true)}
              className="text-blue-600 hover:text-blue-700 text-xs font-medium px-3 py-1 bg-white rounded-full border border-blue-200 hover:bg-blue-50 transition-colors"
            >
              Verify Email
            </button>
          )}
          <button
            onClick={() => router.push('/v2/auth/settings')}
            className="text-gray-600 hover:text-gray-700 text-xs font-medium px-3 py-1 bg-white rounded-full border border-gray-200 hover:bg-gray-50 transition-colors"
          >
            Settings
          </button>
        </div>
      </div>

      {/* Interests Section */}
      <div className="border-t border-gray-200 pt-3 mt-3">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold text-gray-900">Learning Interests</h3>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-blue-600 hover:text-blue-700 text-xs font-medium"
          >
            {isExpanded ? 'Hide' : 'Manage'}
          </button>
        </div>

        {userTags.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {userTags.slice(0, 3).map((tag) => (
              <span
                key={tag.id}
                className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-white bg-opacity-80 text-blue-700 border border-blue-200"
              >
                <span className="mr-1">{getTagIcon(tag.tag_name)}</span>
                {tag.tag_name}
              </span>
            ))}
            {userTags.length > 3 && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-white bg-opacity-60 text-gray-600 border border-gray-200">
                +{userTags.length - 3} more
              </span>
            )}
          </div>
        ) : (
          <div className="text-center py-3">
            <div className="text-xl mb-1">🎯</div>
            <p className="text-gray-600 text-xs mb-2">
              Select your learning interests
            </p>
            <button
              onClick={() => setIsExpanded(true)}
              className="bg-blue-600 text-white px-2 py-1 rounded text-xs hover:bg-blue-700"
            >
              Select Interests
            </button>
          </div>
        )}

        {/* Expanded Interest Management */}
        {isExpanded && (
          <div className="mt-3 border-t border-gray-200 pt-3">
            {error && (
              <div className="mb-2 p-2 bg-red-50 border border-red-200 rounded text-xs">
                <p className="text-red-600">{error}</p>
              </div>
            )}

            {loading ? (
              <div className="animate-pulse">
                <div className="h-3 bg-gray-200 rounded w-1/4 mb-2"></div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                  {[...Array(8)].map((_, i) => (
                    <div key={i} className="h-14 bg-gray-200 rounded"></div>
                  ))}
                </div>
              </div>
            ) : (
              <>
                {/* Available Interests */}
                <div>
                  <h4 className="text-xs font-medium text-gray-900 mb-2">
                    Select Your Interests ({selectedTagIds.length} selected)
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                    {availableTags.map((tag) => {
                      const isSelected = selectedTagIds.includes(tag.id);
                      return (
                        <div
                          key={tag.id}
                          className={`p-2 border-2 rounded-lg cursor-pointer transition-all ${
                            isSelected
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                          onClick={() => handleTagToggle(tag.id)}
                        >
                          <div className="flex items-center mb-1">
                            <span className="text-sm mr-1">{getTagIcon(tag.name)}</span>
                            <div className="flex-1">
                              <h5 className="font-medium text-gray-900 text-xs">{tag.name}</h5>
                            </div>
                            {isSelected && (
                              <div className="w-3 h-3 bg-blue-500 rounded-full flex items-center justify-center">
                                <svg className="w-1.5 h-1.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                              </div>
                            )}
                          </div>
                          <p className="text-xs text-gray-600 line-clamp-1">{tag.desc}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Update Button */}
                <div className="mt-3 flex justify-end">
                  <button
                    onClick={handleUpdateInterests}
                    disabled={updating || selectedTagIds.length === 0}
                    className="bg-blue-600 text-white px-3 py-1 rounded text-xs hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {updating ? 'Updating...' : `Update ${selectedTagIds.length} Interest${selectedTagIds.length !== 1 ? 's' : ''}`}
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Email Verification Modal */}
      {showEmailModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Verify Your Email
              </h3>
              <button
                onClick={() => setShowEmailModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600 mb-2">
                  We'll send a verification code to: <strong>{userInfo.email}</strong>
                </p>
                <p className="text-xs text-red-600 mb-3">
                  ⚠ Your email is currently unverified. Please verify it to access all features.
                </p>
                <button
                  onClick={handleSendEmailCode}
                  disabled={sendingCode}
                  className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {sendingCode ? 'Sending...' : 'Send Verification Code'}
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Verification Code
                </label>
                <input
                  type="text"
                  value={emailCode}
                  onChange={(e) => setEmailCode(e.target.value)}
                  placeholder="Enter 6-digit code"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  maxLength={6}
                />
              </div>

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowEmailModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleVerifyEmailCode}
                  disabled={!emailCode || verifyingCode}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {verifyingCode ? 'Verifying...' : 'Verify'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 