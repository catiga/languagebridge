'use client';
import React from 'react';

interface SidebarProps {
  menu: string;
  setMenu: (menu: string) => void;
}

const menuList = [
  { key: 'profile', label: '个人信息' },
  { key: 'members', label: '成员管理' },
  { key: 'courses', label: '课程管理' },
  // 可继续扩展
];

export default function Sidebar({ menu, setMenu }: SidebarProps) {
  return (
    <div className="w-64 bg-white shadow-lg rounded-r-xl p-6">
      <ul className="space-y-4">
        {menuList.map(item => (
          <li
            key={item.key}
            className={`cursor-pointer px-2 py-2 rounded-md ${menu === item.key ? 'bg-blue-100 text-blue-600 font-bold' : 'text-gray-700 hover:bg-gray-100'}`}
            onClick={() => setMenu(item.key)}
          >
            {item.label}
          </li>
        ))}
      </ul>
    </div>
  );
} 