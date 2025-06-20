'use client';
import React, { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Sidebar from '../components/Sidebar';
import ProfileInfo from '../components/ProfileInfo';
import MemberList from '../components/MemberList';
import CourseTabs from '../components/CourseTabs';

export default function ProfilePage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const tabParam = searchParams.get('tab');
  // tab映射
  const tabMap: Record<string, string> = {
    profile: 'profile',
    students: 'members',
    courses: 'courses',
    systemcourses: 'courses', // systemcourses 也是 courses tab
  };

  // 1. loading state
  const [loading, setLoading] = useState(false);

  // 2. tab state
  const [menu, setMenu] = useState(() => {
    if (tabParam === 'systemcourses') return 'courses';
    return tabMap[tabParam || 'profile'] || 'profile';
  });

  // 2. 监听tab参数变化，自动切换tab
  useEffect(() => {
    if (tabParam === 'systemcourses') {
      setMenu('courses');
    } else if (tabParam && tabMap[tabParam]) {
      setMenu(tabMap[tabParam]);
    }
  }, [tabParam]);

  // 3. 切换tab时同步URL参数
  const handleMenuChange = (newMenu: string) => {
    setMenu(newMenu);
    let tabValue = newMenu;
    if (newMenu === 'courses' && tabParam === 'systemcourses') {
      tabValue = 'systemcourses';
    }
    router.replace(`/profile?tab=${tabValue}`);
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
      <Sidebar menu={menu} setMenu={handleMenuChange} />
      <div className="flex-1 p-8">
        {menu === 'profile' && <ProfileInfo onLoading={setLoading} />}
        {menu === 'members' && <MemberList onLoading={setLoading} />}
        {menu === 'courses' && <CourseTabs onLoading={setLoading} tabParam={tabParam} />}
        {/* 其它菜单项可继续扩展 */}
      </div>
    </div>
  );
} 