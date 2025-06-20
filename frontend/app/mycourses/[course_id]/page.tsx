'use client';

import React, { useEffect, useState } from 'react';
import { apiClient } from '../../utils/api';

const weekDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const payOptions = [
  { value: 1, label: '1 Week' },
  { value: 4, label: '4 Weeks' },
  { value: 12, label: '12 Weeks' },
];

export default function MyCourseDetailPage({ params }: { params: { course_id: string } }) {
  const [course, setCourse] = useState<any>(null);
  const [courseLoading, setCourseLoading] = useState(false);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [teacherLoading, setTeacherLoading] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState<number | null>(null);
  const [slots, setSlots] = useState<{ [day: string]: { enabled: boolean; start: string; end: string } }>({});
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [selectedTimes, setSelectedTimes] = useState<{ [day: string]: string }>({});
  const [payWeeks, setPayWeeks] = useState(1);
  const [showPay, setShowPay] = useState(false);
  const [periodStartDate, setPeriodStartDate] = useState<string>('');
  const [periodEndDate, setPeriodEndDate] = useState<string>('');

  // 1. 获取课程详情并立即获取老师列表
  useEffect(() => {
    if (!params.course_id) return;
    setCourseLoading(true);
    apiClient
      .get('/spwapi/course/detail', { course_id: params.course_id })
      .then(res => {
        if (res && res.code === 0 && res.data) {
          const detail = {
            ...res.data,
            course_id: res.data.id || res.data.course_id,
            course_name: res.data.name || res.data.course_name,
            duration: res.data.duration || 60,
            price_per_week: res.data.price_per_week || 8,
          };
          setCourse(detail);

          // 课程详情拿到后立即获取老师列表
          setTeacherLoading(true);
          apiClient
            .get('/spwapi/course/teachers', { course_id: detail.course_id })
            .then(res2 => {
              if (res2 && res2.code === 0 && Array.isArray(res2.data)) {
                setTeachers(res2.data);
                // 默认选中第一个老师
                if (res2.data.length > 0) setSelectedTeacher(res2.data[0].id);
              } else {
                setTeachers([]);
              }
            })
            .finally(() => setTeacherLoading(false));
        }
      })
      .finally(() => setCourseLoading(false));
  }, [params.course_id]);

  // 2. 获取老师可用时间段（只有选择了合法日期后才调用）
  useEffect(() => {
    if (
      !selectedTeacher ||
      !course?.course_id ||
      !periodStartDate ||
      !periodEndDate ||
      daysBetween(periodStartDate, periodEndDate) < 30
    ) {
      setSlots({});
      return;
    }
    setSlotsLoading(true);
    apiClient
      .get('/spwapi/course/teacher/slots', {
        teacher_id: selectedTeacher,
        course_id: course.course_id,
        start_date: periodStartDate,
        end_date: periodEndDate,
      })
      .then(res => {
        if (res && res.code === 0 && Array.isArray(res.data)) {
          // 转换为 { Monday: { enabled, start, end } ... }
          const slotMap: { [day: string]: { enabled: boolean; start: string; end: string } } = {};
          res.data.forEach((item: any) => {
            const dayIdx = item.week_day - 1; // 0=Monday
            if (dayIdx >= 0 && dayIdx < 7) {
              slotMap[weekDays[dayIdx]] = {
                enabled: !!item.enabled,
                start: item.start_time.slice(0, 5), // "09:00"
                end: item.end_time.slice(0, 5),     // "22:00"
              };
            }
          });
          setSlots(slotMap);
        } else {
          setSlots({});
        }
        setSelectedTimes({});
      })
      .finally(() => setSlotsLoading(false));
  }, [selectedTeacher, course?.course_id, periodStartDate, periodEndDate]);

  // 计算总价
  const totalPrice = payWeeks * (course?.price_per_week || 0);

  // 动画样式
  const teacherCardClass = (id: number) =>
    `flex-shrink-0 w-40 mx-2 p-4 rounded-xl shadow-lg bg-white transition-all duration-300 transform ${
      selectedTeacher === id ? 'scale-105 border-2 border-blue-500' : 'opacity-60 hover:scale-105'
    } cursor-pointer`;

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-md p-8 mt-8">
      {/* 课程信息区块 */}
      <div className="mb-8 p-6 rounded-xl shadow bg-gray-50">
        <h2 className="text-3xl font-bold mb-2">{course?.course_name || 'Loading...'}</h2>
        <div className="text-gray-700 mb-2">{course?.introduction}</div>
        <div className="flex flex-wrap gap-6 text-gray-600 text-sm">
          <div><b>Language:</b> {course?.language}</div>
          <div><b>Level:</b> {course?.level}</div>
          <div><b>Price/Week:</b> ${course?.price_per_week}</div>
          <div><b>Duration:</b> {course?.duration} min</div>
        </div>
      </div>

      {/* 老师选择区块 */}
      <div className="mb-8 p-6 rounded-xl shadow bg-white border border-gray-200">
        <div className="font-semibold mb-6 text-lg tracking-wide">Select Teacher:</div>
        {teacherLoading ? (
          <div className="py-4 text-center text-blue-600">Loading teachers...</div>
        ) : (
          <>
            <div className="flex overflow-x-auto pb-2 gap-6">
              {teachers.map(t => (
                <div
                  key={t.id}
                  className={
                    `flex flex-col items-center justify-center flex-shrink-0 w-44 h-56 mx-2 p-4 rounded-3xl shadow-xl bg-white border-2 transition-all duration-300 cursor-pointer relative ` +
                    (selectedTeacher === t.id
                      ? 'border-transparent bg-gradient-to-br from-blue-200 via-purple-200 to-pink-200 scale-105 shadow-2xl ring-4 ring-blue-400'
                      : 'border-gray-200 opacity-70 hover:scale-105 hover:shadow-lg')
                  }
                  onClick={() => setSelectedTeacher(t.id)}
                  style={{ minWidth: 176 }}
                >
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-400 to-purple-400 flex items-center justify-center mb-3 shadow-md">
                    <img
                      src={t.avatar || '/default-avatar.svg'}
                      alt={t.name}
                      className="w-16 h-16 rounded-full object-cover border-4 border-white"
                    />
                  </div>
                  <div className="text-center">
                    <div className="font-bold text-lg text-gray-800">{t.name}</div>
                    <div className="text-xs text-gray-500 mt-1">{t.bio || t.introduction}</div>
                  </div>
                  {selectedTeacher === t.id && (
                    <div className="absolute top-2 right-2 bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full shadow">Selected</div>
                  )}
                </div>
              ))}
            </div>
            {teachers.length > 1 && (
              <div className="flex justify-center mt-4">
                <span className="font-semibold text-transparent bg-clip-text bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 select-none text-base">
                  &#8592; Swipe to select teacher &#8594;
                </span>
              </div>
            )}
          </>
        )}
      </div>

      {/* 时间段选择区块 */}
      <div className="mb-4 p-6 rounded-xl shadow bg-white border border-gray-200">
        <span className="font-semibold">Select Period:</span>
        <div className="flex items-center gap-4 mt-2 mb-4">
          <label>
            Start Date:
            <input
              type="date"
              className="ml-2 border rounded px-2 py-1"
              min={getTomorrow()}
              value={periodStartDate}
              onChange={e => {
                setPeriodStartDate(e.target.value);
                // 自动修正结束日期
                if (periodEndDate && daysBetween(e.target.value, periodEndDate) < 30) {
                  setPeriodEndDate('');
                }
              }}
            />
          </label>
          <label>
            End Date:
            <input
              type="date"
              className="ml-2 border rounded px-2 py-1"
              min={periodStartDate ? addDays(periodStartDate, 30) : getTomorrow()}
              value={periodEndDate}
              onChange={e => setPeriodEndDate(e.target.value)}
              disabled={!periodStartDate}
            />
          </label>
        </div>
        <span className="font-semibold">Select Class Time for Each Day:</span>
        {slotsLoading ? (
          <div className="py-4 text-center text-blue-600">Loading available slots...</div>
        ) : (
          <div className="grid grid-cols-2 gap-4 mt-2">
            {weekDays.map((day, idx) => {
              const slot = slots[day];
              if (!slot || !slot.enabled) {
                return (
                  <div key={day}>
                    <div className="mb-1">{day}</div>
                    <div className="text-gray-400 text-sm">No available time</div>
                  </div>
                );
              }
              // 生成整点和半点区间
              const times: string[] = [];
              const [h1, m1] = slot.start.split(':').map(Number);
              const [h2, m2] = slot.end.split(':').map(Number);
              const start = h1 * 60 + m1;
              const end = h2 * 60 + m2;
              const duration = course?.duration || 60;
              for (let t = start; t + duration <= end; t += 30) {
                const sh = String(Math.floor(t / 60)).padStart(2, '0');
                const sm = String(t % 60).padStart(2, '0');
                const eh = String(Math.floor((t + duration) / 60)).padStart(2, '0');
                const em = String((t + duration) % 60).padStart(2, '0');
                times.push(`${sh}:${sm} - ${eh}:${em}`);
              }
              return (
                <div key={day}>
                  <div className="mb-1">{day}</div>
                  <div className="flex flex-wrap gap-2">
                    {times.map(time => (
                      <button
                        key={time}
                        className={`px-3 py-1 rounded border ${
                          selectedTimes[day] === time ? 'bg-blue-600 text-white' : 'bg-gray-100'
                        }`}
                        onClick={() =>
                          setSelectedTimes(prev => ({ ...prev, [day]: time }))
                        }
                      >
                        {time}
                      </button>
                    ))}
                    <button
                      className={`px-3 py-1 rounded border ${!selectedTimes[day] ? 'bg-gray-300' : 'bg-gray-100'}`}
                      onClick={() => setSelectedTimes(prev => ({ ...prev, [day]: '' }))}
                    >
                      None
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        <div className="text-xs text-gray-500 mt-2">
          Only full hour and half hour slots are supported. Duration: {course?.duration || 60} min
        </div>
      </div>

      {/* 付款周期 */}
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
          Confirm
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

// 工具函数
function getTomorrow() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
}
function addDays(dateStr: string, days: number) {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}
function daysBetween(start: string, end: string) {
  return Math.floor((new Date(end).getTime() - new Date(start).getTime()) / (1000 * 60 * 60 * 24));
} 