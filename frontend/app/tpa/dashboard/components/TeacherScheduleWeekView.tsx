'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaChevronLeft, FaChevronRight, FaTimes, FaVideo, FaChalkboardTeacher, FaUserGraduate } from 'react-icons/fa';
import { apiClient } from '@/app/utils/api';
import { ApiResponse } from '@/app/utils/interfaces';
import { toast } from 'react-toastify';

const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const hourStart = 8;
const hourEnd = 20;
const timeSlots = Array.from({ length: hourEnd - hourStart + 1 }, (_, i) => hourStart + i);

function getMonday(date: Date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - ((day === 0 ? 7 : day) - 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}
function formatDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
function formatDisplayDate(date: Date) {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
function pad(num: number) { return num < 10 ? `0${num}` : num; }
function to12Hour(time: string) {
  const [h, m] = time.split(':');
  let hour = parseInt(h);
  const min = m;
  const ampm = hour >= 12 ? 'PM' : 'AM';
  hour = hour % 12 || 12;
  return `${hour}:${min} ${ampm}`;
}

// --- Modal Component ---
const LessonDetailsModal = ({ lesson, onClose }: { lesson: any; onClose: () => void; }) => {
  // Time check logic
  const now = new Date();
  const lessonDateTime = new Date(`${lesson.lesson_date.slice(0, 10)}T${lesson.start_time}`);
  let status: 'canEnter' | 'expired' | 'notStarted' | 'notInTimeWindow' = 'notStarted';
  let tip = '';

  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const lessonDay = new Date(lessonDateTime.getFullYear(), lessonDateTime.getMonth(), lessonDateTime.getDate());

  if (lessonDay < today) {
    status = 'expired';
    tip = 'This class has ended or expired.';
  } else if (lessonDay > today) {
    status = 'notStarted';
    tip = 'This class has not started yet.';
  } else {
    // Today, check the time window
    const diffMinutes = (now.getTime() - lessonDateTime.getTime()) / 60000;
    if (diffMinutes >= -120 && diffMinutes <= 120) {
      status = 'canEnter';
      tip = '';
    } else {
      status = 'notInTimeWindow';
      tip = 'You can only enter the classroom within 2 hours before or after the start time.';
    }
  }

  const handleJoinClassroom = () => {
    if (status !== 'canEnter') return;
    if (!lesson.id) {
        toast.error("Lesson ID is missing.");
        return;
    }
    const meetingPageUrl = `/tpa/classroom/${lesson.id}`;
    window.open(meetingPageUrl, '_blank', 'noopener,noreferrer');
    onClose();
  };
  
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <motion.div initial={{ opacity: 0.9, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} onClick={(e) => e.stopPropagation()} className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8">
        <div className="flex justify-between items-start">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">{lesson.course_name}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><FaTimes size={20} /></button>
        </div>
        <p className="text-md text-gray-500 mb-6">{new Date(lessonDateTime).toLocaleString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true })}</p>
        <div className="space-y-4 text-gray-700">
          <div className="flex items-center"><FaChalkboardTeacher className="w-5 h-5 mr-3 text-blue-500" /> <span><strong>Teacher:</strong> {lesson.teacher_name}</span></div>
          <div className="flex items-center"><FaUserGraduate className="w-5 h-5 mr-3 text-blue-500" /> <span><strong>Student:</strong> {lesson.student_name}</span></div>
        </div>
        <button
          onClick={handleJoinClassroom}
          className={`w-full mt-8 font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-all duration-300 transform
            ${status === 'canEnter' ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white hover:shadow-lg hover:shadow-blue-500/40 hover:-translate-y-0.5' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}
          disabled={status !== 'canEnter'}
        >
          <FaVideo />
          Enter Classroom
        </button>
        {tip && (
          <div className="mt-4 text-center text-red-500 text-sm">{tip}</div>
        )}
      </motion.div>
    </motion.div>
  );
};

export default function TeacherScheduleWeekView() {
  const [currentMonday, setCurrentMonday] = useState(getMonday(new Date()));
  const [lessons, setLessons] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedLesson, setSelectedLesson] = useState<any | null>(null);

  const startDate = formatDate(currentMonday);
  const endDate = formatDate(new Date(currentMonday.getTime() + 6 * 24 * 60 * 60 * 1000));

  // 生成本周7天的日期对象
  const weekDates = Array.from({ length: 7 }, (_, i) => new Date(currentMonday.getTime() + i * 24 * 60 * 60 * 1000));

  useEffect(() => {
    fetchSchedule();
    // eslint-disable-next-line
  }, [startDate, endDate]);

  async function fetchSchedule() {
    setIsLoading(true);
    try {
      const res = await apiClient.get<ApiResponse<any[]>>('/spwapi/tpa/auth/schedule/time/range', {
        start_date: startDate,
        end_date: endDate,
      });
      if (res.code === 0 && Array.isArray(res.data)) {
        setLessons(res.data);
      } else {
        setLessons([]);
      }
    } catch (e) {
      setLessons([]);
    } finally {
      setIsLoading(false);
    }
  }

  function gotoPrevWeek() {
    setCurrentMonday(prev => new Date(prev.getTime() - 7 * 24 * 60 * 60 * 1000));
  }
  function gotoNextWeek() {
    setCurrentMonday(prev => new Date(prev.getTime() + 7 * 24 * 60 * 60 * 1000));
  }

  // 按天分组课时
  const lessonsByDay: { [key: string]: any[] } = {};
  weekDates.forEach(date => {
    lessonsByDay[formatDate(date)] = [];
  });
  lessons.forEach(lesson => {
    const day = lesson.lesson_date.slice(0, 10);
    if (lessonsByDay[day]) lessonsByDay[day].push(lesson);
  });

  // 计算课时块的top和height（每小时40px）
  function getBlockStyle(start: string, end: string) {
    const [sh, sm] = start.split(':').map(Number);
    const [eh, em] = end.split(':').map(Number);
    const startMins = (sh - hourStart) * 60 + sm;
    const endMins = (eh - hourStart) * 60 + em;
    const top = (startMins / 60) * 40;
    const height = ((endMins - startMins) / 60) * 40;
    return { top: `${top}px`, height: `${height}px` };
  }

  return (
    <>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <div className="bg-white p-6 md:p-8 rounded-2xl shadow-lg">
          <div className="flex items-center justify-between mb-6">
            {/* <h2 className="text-2xl font-bold text-gray-800">This Week's Schedule</h2> */}
            <div className="flex items-center space-x-2 ml-auto">
              <button onClick={gotoPrevWeek} className="p-2 rounded-full bg-gray-100 hover:bg-gray-200"><FaChevronLeft /></button>
              <span className="font-medium text-gray-700 text-sm">{formatDisplayDate(weekDates[0])} - {formatDisplayDate(weekDates[6])}</span>
              <button onClick={gotoNextWeek} className="p-2 rounded-full bg-gray-100 hover:bg-gray-200"><FaChevronRight /></button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <div className="flex">
              {/* 时间轴 */}
              <div className="flex flex-col w-16 text-xs text-gray-400 pt-8">
                {timeSlots.map(h => (
                  <div key={h} style={{ height: 40 }} className="h-10 flex items-start justify-end pr-2 select-none">
                    {h}:00
                  </div>
                ))}
              </div>
              {/* 主体网格 */}
              <div className="flex-1 grid grid-cols-7 gap-2 relative" style={{ minWidth: 700 }}>
                {weekDates.map((date, colIdx) => {
                  const dayKey = formatDate(date);
                  const dayLessons = lessonsByDay[dayKey] || [];
                  return (
                    <div key={dayKey} className="relative border-l border-gray-200" style={{ minHeight: 40 * (hourEnd - hourStart + 1) }}>
                      {/* 顶部日期 */}
                      <div className="text-center text-xs font-semibold text-gray-600 mb-2 pt-1">
                        {weekDays[colIdx]}<br />
                        <span className="text-gray-400">{date.getDate()}</span>
                      </div>
                      {/* 课时块 */}
                      {dayLessons.map((lesson, i) => (
                        <div
                          key={lesson.id || i}
                          onClick={() => setSelectedLesson(lesson)}
                          className="absolute left-1 right-1 bg-blue-500 text-white rounded-lg shadow-md px-2 py-1 text-xs cursor-pointer hover:bg-blue-600 transition-all border border-blue-400"
                          style={getBlockStyle(lesson.start_time, lesson.end_time)}
                          title={lesson.course_name}
                        >
                          <div className="font-semibold text-xs">
                            {to12Hour(lesson.start_time)} - {to12Hour(lesson.end_time)}
                          </div>
                          <div className="truncate text-xs">{lesson.course_name}</div>
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
          {isLoading && <div className="text-center py-8 text-gray-400">Loading schedule...</div>}
          {!isLoading && lessons.length === 0 && (
            <div className="text-center py-8 text-gray-400">No lessons scheduled this week.</div>
          )}
        </div>
      </motion.div>

      <AnimatePresence>
        {selectedLesson && <LessonDetailsModal lesson={selectedLesson} onClose={() => setSelectedLesson(null)} />}
      </AnimatePresence>
    </>
  );
} 