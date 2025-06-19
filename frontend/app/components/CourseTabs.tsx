'use client';
import React, { useState } from 'react';

function MyCourses() {
  return (
    <div className="bg-white rounded-xl shadow-md p-8 mb-6">
      <h3 className="text-xl font-bold mb-4">我的课程</h3>
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-gray-100">
            <th className="py-2 px-4">课程名</th>
            <th className="py-2 px-4">成员</th>
            <th className="py-2 px-4">老师</th>
            <th className="py-2 px-4">上课时间</th>
            <th className="py-2 px-4">状态</th>
            <th className="py-2 px-4">操作</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="py-2 px-4">英语口语提升</td>
            <td className="py-2 px-4">李四</td>
            <td className="py-2 px-4">外教A</td>
            <td className="py-2 px-4">2024-07-20 19:00</td>
            <td className="py-2 px-4">未开始</td>
            <td className="py-2 px-4">
              <button className="text-blue-600 hover:underline mr-2">进入教室</button>
              <button className="text-yellow-600 hover:underline">评价</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

function Timetable() {
  return (
    <div className="bg-white rounded-xl shadow-md p-8 mb-6">
      <h3 className="text-xl font-bold mb-4">时间表</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-100">
              <th className="py-2 px-4">日期</th>
              <th className="py-2 px-4">时间</th>
              <th className="py-2 px-4">课程名</th>
              <th className="py-2 px-4">成员</th>
              <th className="py-2 px-4">老师</th>
              <th className="py-2 px-4">状态</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="py-2 px-4">2024-07-20</td>
              <td className="py-2 px-4">19:00</td>
              <td className="py-2 px-4">英语口语提升</td>
              <td className="py-2 px-4">李四</td>
              <td className="py-2 px-4">外教A</td>
              <td className="py-2 px-4">未开始</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

function CourseHistory() {
  return (
    <div className="bg-white rounded-xl shadow-md p-8 mb-6">
      <h3 className="text-xl font-bold mb-4">上课历史</h3>
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-gray-100">
            <th className="py-2 px-4">课程名</th>
            <th className="py-2 px-4">成员</th>
            <th className="py-2 px-4">老师</th>
            <th className="py-2 px-4">上课时间</th>
            <th className="py-2 px-4">出勤</th>
            <th className="py-2 px-4">评分</th>
            <th className="py-2 px-4">反馈</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="py-2 px-4">英语口语提升</td>
            <td className="py-2 px-4">李四</td>
            <td className="py-2 px-4">外教A</td>
            <td className="py-2 px-4">2024-07-10 19:00</td>
            <td className="py-2 px-4">出勤</td>
            <td className="py-2 px-4">5星</td>
            <td className="py-2 px-4">
              <button className="text-blue-600 hover:underline">反馈</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

export default function CourseTabs() {
  const [tab, setTab] = useState('mycourses');
  return (
    <div>
      <div className="flex border-b mb-4 space-x-6">
        <button className={tab==='mycourses' ? 'border-b-2 border-blue-600 font-bold px-4 py-2' : 'px-4 py-2'} onClick={()=>setTab('mycourses')}>我的课程</button>
        <button className={tab==='timetable' ? 'border-b-2 border-blue-600 font-bold px-4 py-2' : 'px-4 py-2'} onClick={()=>setTab('timetable')}>时间表</button>
        <button className={tab==='history' ? 'border-b-2 border-blue-600 font-bold px-4 py-2' : 'px-4 py-2'} onClick={()=>setTab('history')}>上课历史</button>
      </div>
      {tab === 'mycourses' && <MyCourses />}
      {tab === 'timetable' && <Timetable />}
      {tab === 'history' && <CourseHistory />}
    </div>
  );
} 