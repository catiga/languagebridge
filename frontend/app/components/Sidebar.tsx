'use client';
import React from 'react';
import { FaUser, FaUsers, FaBook } from 'react-icons/fa';

interface SidebarProps {
  menu: string;
  setMenu: (menu: string) => void;
}

const menuList = [
  { key: 'profile', label: 'Profile', icon: FaUser },
  { key: 'members', label: 'Students', icon: FaUsers },
  { key: 'courses', label: 'Courses', icon: FaBook },
  // 可继续扩展
];

export default function Sidebar({ menu, setMenu }: SidebarProps) {
  return (
    <aside className="w-64 flex flex-col bg-white border-r border-gray-200 p-4">
      <div className="px-2 mb-8">
        <span className="text-2xl font-bold text-gray-800">LangBridge</span>
      </div>
      <nav className="flex-1">
        <ul className="space-y-2">
          {menuList.map(item => (
            <li key={item.key}>
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  setMenu(item.key);
                }}
                className={`flex items-center px-4 py-3 rounded-lg transition-all duration-300 group ${
                  menu === item.key
                    ? 'bg-blue-600 text-white font-semibold shadow-lg shadow-blue-500/30'
                    : 'text-gray-600 hover:bg-slate-100 hover:text-gray-900'
                }`}
              >
                <item.icon className={`w-5 h-5 mr-4 transition-colors ${menu === item.key ? 'text-white' : 'text-gray-400 group-hover:text-gray-600'}`} />
                <span>{item.label}</span>
              </a>
            </li>
          ))}
        </ul>
      </nav>
      <div className="mt-auto p-2">
        <div className="w-10 h-10 flex items-center justify-center bg-gray-800 text-white font-bold rounded-full">
          N
        </div>
      </div>
    </aside>
  );
} 