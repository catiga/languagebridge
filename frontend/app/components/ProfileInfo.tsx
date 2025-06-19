'use client';
import React from 'react';

export default function ProfileInfo() {
  return (
    <div className="bg-white rounded-xl shadow-md p-8 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">个人信息</h2>
      <form className="space-y-6">
        <div>
          <label className="block text-gray-700 mb-2">昵称</label>
          <input className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" defaultValue="张三" />
        </div>
        <div>
          <label className="block text-gray-700 mb-2">邮箱</label>
          <input className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" defaultValue="test@example.com" />
        </div>
        <div>
          <label className="block text-gray-700 mb-2">手机号</label>
          <input className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" defaultValue="13800000000" />
        </div>
        <div>
          <label className="block text-gray-700 mb-2">国家</label>
          <input className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" defaultValue="中国" />
        </div>
        <div>
          <label className="block text-gray-700 mb-2">语言</label>
          <input className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" defaultValue="中文" />
        </div>
        <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition">保存</button>
      </form>
    </div>
  );
} 