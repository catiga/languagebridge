"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiClient } from "../utils/api";

interface CourseHistoryItem {
  id: number;
  course_name: string;
  teacher_name: string;
  lesson_date: string;
  start_time: string;
  // 可根据实际接口补充字段
}

const PAGE_SIZE = 10;

function formatDateTime(dateStr: string, timeStr: string) {
  // 兼容ISO字符串和普通日期
  let dateObj: Date | null = null;
  if (dateStr) {
    // 先尝试直接new Date
    dateObj = new Date(dateStr);
    if (isNaN(dateObj.getTime())) {
      // 兼容yyyy-MM-dd格式
      dateObj = new Date(dateStr.replace(/-/g, '/'));
    }
  }
  if (dateObj && !isNaN(dateObj.getTime())) {
    let datePart = dateObj.getFullYear() + '-' + String(dateObj.getMonth() + 1).padStart(2, '0') + '-' + String(dateObj.getDate()).padStart(2, '0');
    let timePart = timeStr ? timeStr.slice(0,5) : '';
    return `${datePart} ${timePart}`;
  }
  // fallback
  return `${dateStr} ${timeStr ? timeStr.slice(0,5) : ''}`;
}

const CourseHistoryPanel: React.FC = () => {
  const [list, setList] = useState<CourseHistoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [pn, setPn] = useState(1);
  const [total, setTotal] = useState(0);
  const router = useRouter();

  useEffect(() => {
    setLoading(true);
    apiClient
      .get<any>("/spwapi/auth/course/histories", { pn, ps: PAGE_SIZE })
      .then((res) => {
        if (res && res.code === 0 && res.data) {
          setList(res.data.list || []);
          setTotal(res.data.total || 0);
        } else {
          setList([]);
          setTotal(0);
        }
      })
      .catch(() => {
        setList([]);
        setTotal(0);
      })
      .finally(() => setLoading(false));
  }, [pn]);

  const handleDetail = (id: number) => {
    window.open(`/course/review/${id}`, '_blank');
  };

  return (
    <div className="bg-white rounded-xl shadow-md p-6 mt-4">
      <h2 className="text-xl font-bold mb-4">Course History</h2>
      {loading ? (
        <div className="py-8 text-center text-gray-500">Loading...</div>
      ) : list.length === 0 ? (
        <div className="py-8 text-center text-gray-500">No course history found.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-100">
                <th className="py-2 px-4">Course Name</th>
                <th className="py-2 px-4">Teacher</th>
                <th className="py-2 px-4">Time</th>
                <th className="py-2 px-4">Action</th>
              </tr>
            </thead>
            <tbody>
              {list.map((item) => {
                // 格式化时间
                const displayTime = formatDateTime(item.lesson_date, item.start_time);
                return (
                  <tr key={item.id} className="border-b hover:bg-gray-50">
                    <td className="py-2 px-4">{item.course_name}</td>
                    <td className="py-2 px-4">{item.teacher_name}</td>
                    <td className="py-2 px-4">{displayTime}</td>
                    <td className="py-2 px-4">
                      <button
                        className="text-blue-600 hover:underline"
                        onClick={() => handleDetail(item.id)}
                      >
                        View / Review
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      {/* 分页 */}
      {total > PAGE_SIZE && (
        <div className="flex justify-end items-center gap-2 mt-4">
          <button
            className="px-3 py-1 rounded bg-gray-200 disabled:opacity-50"
            onClick={() => setPn((p) => Math.max(1, p - 1))}
            disabled={pn === 1}
          >
            Previous
          </button>
          <span>
            Page {pn} / {Math.ceil(total / PAGE_SIZE)}
          </span>
          <button
            className="px-3 py-1 rounded bg-gray-200 disabled:opacity-50"
            onClick={() => setPn((p) => p + 1)}
            disabled={pn >= Math.ceil(total / PAGE_SIZE)}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default CourseHistoryPanel; 