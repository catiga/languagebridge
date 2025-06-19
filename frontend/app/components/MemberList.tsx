'use client';
import React from 'react';

const mockMembers = [
  { id: 1, name: '李四', role: '学生', status: '正常' },
  { id: 2, name: '王五', role: '家长', status: '正常' },
];

export default function MemberList() {
  return (
    <div className="bg-white rounded-xl shadow-md p-8 max-w-3xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">成员管理</h2>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition">添加成员</button>
      </div>
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-gray-100">
            <th className="py-2 px-4">姓名</th>
            <th className="py-2 px-4">角色</th>
            <th className="py-2 px-4">状态</th>
            <th className="py-2 px-4">操作</th>
          </tr>
        </thead>
        <tbody>
          {mockMembers.map(member => (
            <tr key={member.id} className="border-b">
              <td className="py-2 px-4">{member.name}</td>
              <td className="py-2 px-4">{member.role}</td>
              <td className="py-2 px-4">{member.status}</td>
              <td className="py-2 px-4">
                <button className="text-blue-600 hover:underline mr-2">编辑</button>
                <button className="text-red-500 hover:underline">删除</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
} 