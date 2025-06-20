'use client';
import React, { useEffect, useState } from 'react';
import { apiClient } from '../utils/api';

export default function CourseDetailModal({ course, onClose }: { course: any, onClose: () => void }) {
  const [availableSlots, setAvailableSlots] = useState<any[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<string>('');

  useEffect(() => {
    if (course) {
      // 拉取老师可用时间段
      apiClient.get('/spwapi/auth/teacher/available', { course_id: course.course_id })
        .then(res => {
          if (res && res.code === 0 && Array.isArray(res.data)) {
            setAvailableSlots(res.data);
          }
        });
    }
  }, [course]);

  // 课程时长（分钟），假设 course.duration
  const duration = course.duration || 60;

  // 渲染时间段选择
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
      <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-lg">
        <h2 className="text-2xl font-bold mb-4">{course.course_name} Details</h2>
        {/* 其它课程详情字段... */}
        <div className="mb-4">
          <div className="font-semibold mb-2">Select Available Time Slot:</div>
          <div className="grid grid-cols-2 gap-2">
            {availableSlots.map(slot => (
              <button
                key={slot}
                className={`px-3 py-2 rounded border ${selectedSlot === slot ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}
                onClick={() => setSelectedSlot(slot)}
              >
                {slot}
              </button>
            ))}
          </div>
          <div className="text-xs text-gray-500 mt-2">
            Only full hour and half hour slots are supported. Duration: {duration} min
          </div>
        </div>
        <div className="flex justify-end gap-4 mt-6">
          <button className="px-4 py-2 rounded bg-gray-200" onClick={onClose}>Close</button>
          {/* 你可以加预约/确认按钮 */}
        </div>
      </div>
    </div>
  );
} 