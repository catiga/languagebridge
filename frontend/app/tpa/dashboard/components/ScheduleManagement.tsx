'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { apiClient } from '@/app/utils/api';
import { ApiResponse } from '@/app/utils/interfaces';
import { toast } from 'react-toastify';
import { FaSpinner } from 'react-icons/fa';

interface TimeSlot {
  id: number;
  teacher_id: number;
  week_day: number;
  start_time: string;
  end_time: string;
  enabled: boolean;
  update_time: string;
}

const weekDays = ["", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const formatTimeForInput = (time: string) => time.substring(0, 5);
const formatTimeForApi = (time: string) => `${time}:00`;

export default function ScheduleManagement() {
  const [schedule, setSchedule] = useState<TimeSlot[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchSchedule();
  }, []);

  const fetchSchedule = async () => {
    setIsLoading(true);
    try {
      const res = await apiClient.get<ApiResponse<TimeSlot[]>>('/spwapi/tpa/auth/schedule/retrieve');
      if (res.code === 0 && Array.isArray(res.data)) {
        // Ensure we have a full 7-day template, even if API returns fewer
        const apiDataMap = new Map(res.data.map(slot => [slot.week_day, slot]));
        const fullSchedule = Array.from({ length: 7 }, (_, i) => {
          const weekDay = i + 1;
          const existingSlot = apiDataMap.get(weekDay);
          if (existingSlot) {
            return { ...existingSlot, enabled: !!existingSlot.enabled };
          }
          return { 
            id: 0, teacher_id: 0, week_day: weekDay, start_time: '09:00:00', end_time: '17:00:00', enabled: false, update_time: '' 
          };
        });
        setSchedule(fullSchedule);
      } else {
        toast.error(`Error fetching schedule: ${res.msg || 'Unknown error'}`);
      }
    } catch (error) {
      toast.error('An unexpected network error occurred while fetching your schedule.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTimeChange = (weekDay: number, type: 'start_time' | 'end_time', value: string) => {
    setSchedule(currentSchedule =>
      currentSchedule.map(slot =>
        slot.week_day === weekDay ? { ...slot, [type]: formatTimeForApi(value) } : slot
      )
    );
  };

  const handleToggle = (weekDay: number) => {
    setSchedule(currentSchedule =>
      currentSchedule.map(slot =>
        slot.week_day === weekDay ? { ...slot, enabled: !slot.enabled } : slot
      )
    );
  };

  const handleSave = async () => {
    setIsSaving(true);
    
    const payload = {
      slots: schedule.map(({ week_day, start_time, end_time, enabled }) => ({
        week_day,
        start_time,
        end_time,
        enable: enabled ? 1 : 0,
      })),
    };

    try {
      const res = await apiClient.post<ApiResponse<null>>('/spwapi/tpa/auth/schedule/update', payload);
      if (res.code === 0) {
        toast.success('Your schedule has been updated successfully!');
        fetchSchedule();
      } else {
        toast.error(`Failed to save schedule: ${res.msg || 'Unknown error'}`);
      }
    } catch (error) {
      toast.error('An unexpected network error occurred while saving.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div className="text-center p-8">Loading your schedule...</div>;
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
      <div className="bg-white p-6 md:p-8 rounded-2xl shadow-lg">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Set Your Weekly Availability</h2>
        <p className="text-gray-600 mb-8">This template will be used to generate available slots for students.</p>
        
        <div className="space-y-4">
          {schedule.map(slot => (
            <div key={slot.week_day} className={`p-4 rounded-lg flex flex-col md:flex-row md:items-center md:justify-between transition-colors duration-300 ${slot.enabled ? 'bg-blue-50' : 'bg-gray-100'}`}>
              <div className="flex items-center mb-4 md:mb-0">
                <span className="w-28 font-semibold text-gray-800">{weekDays[slot.week_day]}</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" checked={slot.enabled} onChange={() => handleToggle(slot.week_day)} className="sr-only peer" />
                  <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
              <div className={`flex items-center space-x-4 transition-opacity duration-300 ${slot.enabled ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
                <input
                  type="time"
                  value={formatTimeForInput(slot.start_time)}
                  onChange={e => handleTimeChange(slot.week_day, 'start_time', e.target.value)}
                  className="bg-white border border-gray-300 rounded-md px-3 py-2 w-32"
                />
                <span className="text-gray-500">-</span>
                <input
                  type="time"
                  value={formatTimeForInput(slot.end_time)}
                   onChange={e => handleTimeChange(slot.week_day, 'end_time', e.target.value)}
                  className="bg-white border border-gray-300 rounded-md px-3 py-2 w-32"
                />
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 flex justify-end">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="bg-indigo-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-indigo-700 transition-colors flex items-center justify-center disabled:bg-indigo-400"
          >
            {isSaving ? <FaSpinner className="animate-spin mr-2" /> : null}
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </motion.div>
  );
} 