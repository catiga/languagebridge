"use client";
import React, { useEffect, useState } from "react";
import { apiClient } from "@/app/utils/api";
import { ApiResponse, Teacher, CourseDetail } from "@/app/utils/interfaces";
import { FaVideo, FaUser, FaBookOpen, FaClock, FaCheckCircle } from "react-icons/fa";
import ProfileLayout from "../ProfileLayout";
import ApplyTrialLessonModal from "./ApplyTrialLessonModal";
import { toast } from "react-toastify";
import dayjs from "dayjs";

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
  // 可扩展更多字段
}

const statusMap: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  "00": { label: "Created", color: "bg-gray-100 text-gray-700", icon: <FaClock /> },
  "10": { label: "Waiting Confirm", color: "bg-yellow-100 text-yellow-700", icon: <FaClock /> },
  "20": { label: "Confirmed", color: "bg-green-100 text-green-700", icon: <FaCheckCircle /> },
  "30": { label: "Finished", color: "bg-blue-100 text-blue-700", icon: <FaVideo /> },
};

export default function TrialLessonsPage() {
  const [list, setList] = useState<TrialLesson[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [courseMap, setCourseMap] = useState<Record<number, CourseDetail>>({});
  const [teacherMap, setTeacherMap] = useState<Record<number, Teacher>>({});
  const [confirmingId, setConfirmingId] = useState<number | null>(null);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [confirmModal, setConfirmModal] = useState<{ open: boolean; id: number | null }>({ open: false, id: null });
  const [enterLoadingId, setEnterLoadingId] = useState<number | null>(null);

  useEffect(() => {
    fetchList();
    fetchCourses();
    fetchTeachers();
  }, []);

  const fetchList = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get<ApiResponse<TrialLesson[]>>("/spwapi/auth/trial/lesson/fetch");
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

  // 拉取所有课程信息用于映射
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
  // 拉取所有老师信息用于映射
  const fetchTeachers = async () => {
    try {
      const res = await apiClient.get<ApiResponse<{ list: Teacher[] }>>("/spwapi/teacher/fetch", { pn: 1, ps: 100 });
      if (res.code === 0 && res.data?.list) {
        const map: Record<number, Teacher> = {};
        res.data.list.forEach(t => { map[t.id] = t; });
        setTeacherMap(map);
      }
    } catch {}
  };

  // 用户确认试听课
  const handleConfirm = async (id: number) => {
    setConfirmingId(id);
    setConfirmLoading(true);
    try {
      const res: any = await apiClient.get("/spwapi/auth/trial/lesson/confirm", { trial_id: id });
      if (res.code === 0) {
        toast.success("Confirmed successfully!");
        fetchList();
      } else {
        toast.error(res.msg || "Failed to confirm");
      }
    } catch (e: any) {
      toast.error(e?.message || "Network error");
    } finally {
      setConfirmingId(null);
      setConfirmLoading(false);
      setConfirmModal({ open: false, id: null });
    }
  };

  return (
    <ProfileLayout>
      <div className="max-w-4xl mx-auto py-10">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold flex items-center gap-3 text-blue-700">
            <FaVideo className="text-blue-500" /> Trial Lessons
          </h1>
          <button
            className="px-5 py-2 rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 text-white font-bold shadow hover:scale-105 transition"
            onClick={() => setShowModal(true)}
          >
            + Apply for Trial Lesson
          </button>
        </div>
        {loading ? (
          <div className="text-center text-gray-500 py-10">Loading...</div>
        ) : list.length === 0 ? (
          <div className="text-center text-gray-400 py-16 text-lg">No trial lesson applications yet.</div>
        ) : (
          <div className="grid gap-6">
            {list.map((item) => {
              const course = courseMap[item.course_id];
              const teacher = teacherMap[item.teacher_id];
              return (
                <div key={item.id} className="bg-white rounded-2xl shadow p-6 flex flex-col md:flex-row items-center gap-6 border border-gray-100">
                  <div className="flex-1 w-full">
                    <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-6 mb-2">
                      <span className="font-bold text-lg text-gray-800 flex items-center gap-2">
                        <FaBookOpen className="text-blue-400" /> {course ? course.name : `Course #${item.course_id}`}
                      </span>
                      <span className="text-gray-500 flex items-center gap-2">
                        <FaUser className="text-cyan-400" /> {teacher ? teacher.name : `Teacher #${item.teacher_id}`}
                      </span>
                    </div>
                    <div className="text-sm text-gray-500 mb-2">Applied at: {item.add_time ? new Date(item.add_time).toLocaleString() : '-'}</div>
                    {item.status === "30" && item.comment && (
                      <div className="mt-2 text-sm text-gray-700">Feedback: {item.comment}</div>
                    )}
                  </div>
                  <div className="flex flex-col items-center min-w-[140px]">
                    <span className={`px-3 py-1 rounded-full font-bold text-sm mb-2 flex items-center gap-1 ${statusMap[item.status]?.color || "bg-gray-100 text-gray-500"}`}>
                      {statusMap[item.status]?.icon} {statusMap[item.status]?.label || item.status}
                    </span>
                    {item.status === "10" && (
                      <>
                        <button
                          className="mt-2 px-4 py-1.5 rounded-lg bg-gradient-to-r from-green-500 to-blue-500 text-white font-bold text-sm shadow hover:scale-105 transition flex items-center justify-center"
                          onClick={() => setConfirmModal({ open: true, id: item.id })}
                          disabled={confirmLoading && confirmingId === item.id}
                        >
                          {confirmLoading && confirmingId === item.id && <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></span>}
                          {confirmLoading && confirmingId === item.id ? "Confirming..." : "Confirm"}
                        </button>
                        {/* 确认弹窗 */}
                        {confirmModal.open && confirmModal.id === item.id && (
                          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
                            <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md relative animate-fade-in">
                              <button className="absolute top-4 right-4 text-gray-400 hover:text-gray-700" onClick={() => setConfirmModal({ open: false, id: null })}>&times;</button>
                              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">Confirm Trial Lesson</h3>
                              <div className="mb-6 text-gray-700">Are you sure you want to confirm this trial lesson?</div>
                              <button
                                className="w-full py-3 rounded-xl bg-blue-600 text-white font-bold text-lg shadow hover:bg-blue-700 transition disabled:bg-blue-300 flex items-center justify-center"
                                onClick={() => handleConfirm(item.id)}
                                disabled={confirmLoading}
                              >
                                {confirmLoading && <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></span>}
                                {confirmLoading ? "Confirming..." : "Confirm"}
                              </button>
                            </div>
                          </div>
                        )}
                      </>
                    )}
                    {item.status === "20" && (
                      <>
                        {/* 进入课程按钮逻辑 */}
                        {(() => {
                          const now = dayjs();
                          const apply = dayjs(item.apply_time || item.add_time);
                          const canEnter = now.isAfter(apply.subtract(10, 'minute')) && now.isBefore(apply.add(2, 'hour'));
                          return (
                            <button
                              className={`mt-2 px-4 py-1.5 rounded-lg bg-gradient-to-r from-purple-500 to-blue-500 text-white font-bold text-sm shadow hover:scale-105 transition flex items-center justify-center ${canEnter ? '' : 'opacity-50 cursor-not-allowed'}`}
                              onClick={() => {
                                if (!canEnter) return;
                                setEnterLoadingId(item.id);
                                window.open(`/course/meeting/${item.id}`, '_blank', 'noopener,noreferrer');
                                setTimeout(() => setEnterLoadingId(null), 1000);
                              }}
                              disabled={!canEnter || enterLoadingId === item.id}
                            >
                              {enterLoadingId === item.id && <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></span>}
                              {canEnter ? (enterLoadingId === item.id ? "Entering..." : "Enter Lesson") : "Not Available"}
                            </button>
                          );
                        })()}
                      </>
                    )}
                    {item.status === "30" && (
                      <span className="text-xs text-blue-600 mt-1">Finished</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
        <ApplyTrialLessonModal open={showModal} onClose={() => setShowModal(false)} courseId={0} courseName={""} teachers={[]} globalMode />
      </div>
    </ProfileLayout>
  );
} 