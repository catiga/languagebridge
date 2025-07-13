"use client";
import React, { useEffect, useState } from "react";
import { apiClient } from "@/app/utils/api";
import { ApiResponse, Teacher, CourseDetail } from "@/app/utils/interfaces";
import { FaVideo, FaUser, FaBookOpen, FaClock, FaCheckCircle, FaCalendarAlt } from "react-icons/fa";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
dayjs.extend(utc);
import { toast } from "react-toastify";

interface TrialLesson {
  id: number;
  teacher_id: number;
  user_id: number;
  add_time: string;
  course_id: number;
  apply_time: string | null;
  status: string;
  comment: string;
  rate: number;
}

const statusMap: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  "00": { label: "Created", color: "bg-gray-100 text-gray-700", icon: <FaClock /> },
  "10": { label: "Waiting Confirm", color: "bg-yellow-100 text-yellow-700", icon: <FaClock /> },
  "20": { label: "Confirmed", color: "bg-green-100 text-green-700", icon: <FaCheckCircle /> },
  "30": { label: "Finished", color: "bg-blue-100 text-blue-700", icon: <FaVideo /> },
};

export default function TrialLessonsPanel() {
  const [list, setList] = useState<TrialLesson[]>([]);
  const [loading, setLoading] = useState(false);
  const [courseMap, setCourseMap] = useState<Record<number, CourseDetail>>({});
  const [showAssign, setShowAssign] = useState<{ open: boolean; id: number | null }>({ open: false, id: null });
  const [assignTime, setAssignTime] = useState<string>("");
  const [assigning, setAssigning] = useState(false);

  useEffect(() => {
    fetchList();
    fetchCourses();
  }, []);

  const fetchList = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get<ApiResponse<TrialLesson[]>>("/spwapi/tpa/auth/trial/lesson/fetch");
      if (res.code === 0 && Array.isArray(res.data)) {
        setList(res.data);
      } else {
        setList([]);
      }
    } catch {
      setList([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchCourses = async () => {
    try {
      const res = await apiClient.get<ApiResponse<{ list: CourseDetail[] }>>("/spwapi/course/fetch", { pn: 1, ps: 100 });
      if (res.code === 0 && res.data?.list) {
        const map: Record<number, CourseDetail> = {};
        res.data.list.forEach(c => { map[c.id] = c; });
        setCourseMap(map);
      }
    } catch {}
  };

  const handleAssign = async () => {
    if (!showAssign.id || !assignTime) return;
    setAssigning(true);
    try {
      // 格式化为 ISO 8601（带Z，Go原生支持）
      const formattedTime = dayjs(assignTime).utc().format("YYYY-MM-DDTHH:mm:ss[Z]");
      const res: any = await apiClient.post("/spwapi/tpa/auth/trial/lesson/assign", {
        id: showAssign.id,
        apply_time: formattedTime,
      });
      if (res.code === 0) {
        toast.success("Assigned successfully!");
        setShowAssign({ open: false, id: null });
        setAssignTime("");
        fetchList();
      } else {
        toast.error(res.msg || "Failed to assign time");
      }
    } catch (e: any) {
      toast.error(e?.message || "Network error");
    } finally {
      setAssigning(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow p-8 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-6 flex items-center gap-2"><FaVideo className="text-blue-500" /> Trial Lessons</h2>
      {loading ? (
        <div className="text-center text-gray-500 py-10">Loading...</div>
      ) : list.length === 0 ? (
        <div className="text-gray-400 text-lg text-center py-16">No trial lesson requests yet.</div>
      ) : (
        <div className="grid gap-6">
          {list.map(item => (
            <div key={item.id} className="bg-gray-50 rounded-xl shadow p-5 flex flex-col md:flex-row items-center gap-6 border border-gray-100">
              <div className="flex-1 w-full">
                <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-6 mb-2">
                  <span className="font-bold text-lg text-gray-800 flex items-center gap-2">
                    <FaBookOpen className="text-blue-400" /> {courseMap[item.course_id]?.name || `Course #${item.course_id}`}
                  </span>
                  <span className="text-gray-500 flex items-center gap-2">
                    <FaUser className="text-cyan-400" /> Student #{item.user_id}
                  </span>
                </div>
                <div className="text-sm text-gray-500 mb-2">Applied at: {item.add_time ? dayjs(item.add_time).format("YYYY-MM-DD HH:mm") : '-'}</div>
                {item.status === "30" && item.comment && (
                  <div className="mt-2 text-sm text-gray-700">Feedback: {item.comment}</div>
                )}
              </div>
              <div className="flex flex-col items-center min-w-[140px]">
                <span className={`px-3 py-1 rounded-full font-bold text-sm mb-2 flex items-center gap-1 ${statusMap[item.status]?.color || "bg-gray-100 text-gray-500"}`}>
                  {statusMap[item.status]?.icon} {statusMap[item.status]?.label || item.status}
                </span>
                {item.status === "00" || item.status === "10" ? (
                  <button
                    className="mt-2 px-4 py-1.5 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500 text-white font-bold text-sm shadow hover:scale-105 transition"
                    onClick={() => setShowAssign({ open: true, id: item.id })}
                  >
                    Assign Time
                  </button>
                ) : null}
                {item.status === "20" && (
                  <span className="text-xs text-green-600 mt-1">Confirmed</span>
                )}
                {item.status === "30" && (
                  <span className="text-xs text-blue-600 mt-1">Finished</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      {/* 分配时间弹窗 */}
      {showAssign.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md relative animate-fade-in">
            <button className="absolute top-4 right-4 text-gray-400 hover:text-gray-700" onClick={() => setShowAssign({ open: false, id: null })}>&times;</button>
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2"><FaCalendarAlt className="text-blue-500" /> Assign Trial Lesson Time</h3>
            <input
              type="datetime-local"
              className="w-full border rounded-lg px-3 py-2 mb-4"
              value={assignTime}
              onChange={e => setAssignTime(e.target.value)}
              min={dayjs().format("YYYY-MM-DDTHH:mm")}
            />
            <button
              className="w-full py-3 rounded-xl bg-blue-600 text-white font-bold text-lg shadow hover:bg-blue-700 transition disabled:bg-blue-300 flex items-center justify-center"
              onClick={handleAssign}
              disabled={assigning || !assignTime}
            >
              {assigning && <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></span>}
              {assigning ? "Assigning..." : "Confirm Assignment"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
} 