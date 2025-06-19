'use client';
import React, { useState } from 'react';
import Sidebar from '../components/Sidebar';
import ProfileInfo from '../components/ProfileInfo';
import MemberList from '../components/MemberList';
import CourseTabs from '../components/CourseTabs';

export default function ProfilePage() {
  const [menu, setMenu] = useState('profile');
  const [loading, setLoading] = useState(false);

  // 控制子组件加载时的 loading 状态
  const handleLoading = (isLoading: boolean) => {
    setLoading(isLoading);
  };

  return (
    <div className="flex min-h-screen bg-gray-50 relative">
      {/* 全局 loading 遮罩 */}
      {loading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-20">
          <div className="bg-white px-6 py-4 rounded shadow flex items-center space-x-2">
            <svg className="animate-spin h-6 w-6 text-blue-600" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
            </svg>
            <span className="text-blue-600 font-medium">Loading...</span>
          </div>
        </div>
      )}
      <Sidebar menu={menu} setMenu={setMenu} />
      <div className="flex-1 p-8">
        {menu === 'profile' && <ProfileInfo onLoading={handleLoading} />}
        {menu === 'members' && <MemberList onLoading={handleLoading} />}
        {menu === 'courses' && <CourseTabs onLoading={handleLoading} />}
        {/* 其它菜单项可继续扩展 */}
      </div>
    </div>
  );
} 