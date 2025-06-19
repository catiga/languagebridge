'use client';
import React, { useState } from 'react';
import Sidebar from '../components/Sidebar';
import ProfileInfo from '../components/ProfileInfo';
import MemberList from '../components/MemberList';
import CourseTabs from '../components/CourseTabs';

export default function ProfilePage() {
  const [menu, setMenu] = useState('profile');
  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar menu={menu} setMenu={setMenu} />
      <div className="flex-1 p-8">
        {menu === 'profile' && <ProfileInfo />}
        {menu === 'members' && <MemberList />}
        {menu === 'courses' && <CourseTabs />}
        {/* 其它菜单项可继续扩展 */}
      </div>
    </div>
  );
} 