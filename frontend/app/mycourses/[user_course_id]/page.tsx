'use client';

import React, { useState } from 'react';

// 模拟老师和可预约时间段
const mockTeachers = [
  {
    id: 1,
    name: 'Teacher Alice',
    available: ['09:00', '10:00', '11:00', '14:00', '15:00'],
  },
  {
    id: 2,
    name: 'Teacher Bob',
    available: ['10:00', '11:00', '13:00', '16:00'],
  },
];

// 课程信息
const mockCourse = {
  course_name: 'IELTS English Exam',
  duration: 60, // 分钟
  price_per_week: 8, // 单周价格
};

const weekDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const payOptions = [
  { value: 1, label: '1 Week' },
  { value: 4, label: '4 Weeks' },
  { value: 12, label: '12 Weeks' },
];

export default function MyCourseDetailPage() {
  // 只保留每周预约
  const [selectedTeacher, setSelectedTeacher] = useState<number>(mockTeachers[0].id);
  const [selectedTimes, setSelectedTimes] = useState<{ [day: string]: string }>({});
  const [payWeeks, setPayWeeks] = useState(1);
  const [showPay, setShowPay] = useState(false);

  const teacher = mockTeachers.find(t => t.id === selectedTeacher);

  const handleTimeSelect = (day: string, time: string) => {
    setSelectedTimes(prev => ({ ...prev, [day]: time }));
  };

  const totalPrice = payWeeks * mockCourse.price_per_week;

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-md p-8 mt-8">
      <h2 className="text-2xl font-bold mb-4">{mockCourse.course_name} Reservation</h2>

      <div className="mb-4">
        <span className="font-semibold">Select Teacher:</span>
        <select
          className="ml-2 border px-2 py-1 rounded"
          value={selectedTeacher}
          onChange={e => {
            setSelectedTeacher(Number(e.target.value));
            setSelectedTimes({});
          }}
        >
          {mockTeachers.map(t => (
            <option key={t.id} value={t.id}>{t.name}</option>
          ))}
        </select>
      </div>

      <div className="mb-4">
        <span className="font-semibold">Select Class Time for Each Day:</span>
        <div className="grid grid-cols-2 gap-4 mt-2">
          {weekDays.map(day => (
            <div key={day}>
              <div className="mb-1">{day}</div>
              <div className="flex flex-wrap gap-2">
                {teacher?.available.map(time => (
                  <button
                    key={time}
                    className={`px-3 py-1 rounded border ${
                      selectedTimes[day] === time ? 'bg-blue-600 text-white' : 'bg-gray-100'
                    }`}
                    onClick={() => handleTimeSelect(day, time)}
                  >
                    {time} - {addMinutes(time, mockCourse.duration)}
                  </button>
                ))}
                <button
                  className={`px-3 py-1 rounded border ${!selectedTimes[day] ? 'bg-gray-300' : 'bg-gray-100'}`}
                  onClick={() => handleTimeSelect(day, '')}
                >
                  None
                </button>
              </div>
            </div>
          ))}
        </div>
        <div className="text-xs text-gray-500 mt-2">
          Only full hour and half hour slots are supported. Duration: {mockCourse.duration} min
        </div>
      </div>

      <div className="mb-4">
        <span className="font-semibold">Payment Duration:</span>
        <select
          className="ml-2 border px-2 py-1 rounded"
          value={payWeeks}
          onChange={e => setPayWeeks(Number(e.target.value))}
        >
          {payOptions.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        <span className="ml-4 font-semibold">Total: <span className="text-blue-600">${totalPrice}</span></span>
      </div>

      <div className="flex justify-end gap-4 mt-6">
        <button
          className="px-4 py-2 rounded bg-gray-200"
          onClick={() => window.close()}
        >
          Close
        </button>
        <button
          className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
          onClick={() => setShowPay(true)}
          disabled={Object.values(selectedTimes).every(v => !v)}
        >
          Confirm & Pay
        </button>
      </div>

      {/* 模拟付款弹窗 */}
      {showPay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
          <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-sm">
            <h2 className="text-xl font-semibold mb-4">Payment</h2>
            <p className="mb-4">You are about to pay <span className="text-blue-600 font-bold">${totalPrice}</span> for {payWeeks} week(s) of classes.</p>
            <div className="flex justify-end gap-4">
              <button
                className="px-4 py-2 rounded bg-gray-200"
                onClick={() => setShowPay(false)}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
                onClick={() => {
                  setShowPay(false);
                  alert('Payment successful! (mock)');
                }}
              >
                Pay Now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// 工具函数：加分钟，返回 "HH:mm"
function addMinutes(time: string, mins: number) {
  const [h, m] = time.split(':').map(Number);
  const date = new Date(2000, 0, 1, h, m + mins);
  return date.toTimeString().slice(0, 5);
} 