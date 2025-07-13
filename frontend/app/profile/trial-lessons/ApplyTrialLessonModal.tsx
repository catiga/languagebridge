"use client";
import React, { useState } from "react";
import { Teacher } from "@/app/utils/interfaces";
import { apiClient } from "@/app/utils/api";
import { toast } from "react-toastify";
import { FaTimes, FaUser, FaBookOpen, FaVideo } from "react-icons/fa";
import { useEffect } from "react";
import { ApiResponse, CourseDetail } from "@/app/utils/interfaces";

interface ApplyTrialLessonModalProps {
  open: boolean;
  onClose: () => void;
  courseId: number;
  courseName: string;
  teachers: Teacher[];
  globalMode?: boolean;
}

export default function ApplyTrialLessonModal({ open, onClose, courseId, courseName, teachers, globalMode }: ApplyTrialLessonModalProps) {
  const [selectedTeacher, setSelectedTeacher] = useState<number | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<number | null>(courseId || null);
  const [courseList, setCourseList] = useState<CourseDetail[]>([]);
  const [teacherList, setTeacherList] = useState<Teacher[]>(teachers || []);
  const [submitting, setSubmitting] = useState(false);
  const [loadingCourses, setLoadingCourses] = useState(false);
  const [loadingTeachers, setLoadingTeachers] = useState(false);

  useEffect(() => {
    if (globalMode && open) {
      setLoadingCourses(true);
      apiClient.get<ApiResponse<{ list: CourseDetail[] }>>("/spwapi/course/fetch", { pn: 1, ps: 100 })
        .then(res => {
          if (res.code === 0 && res.data?.list) setCourseList(res.data.list);
          else setCourseList([]);
        })
        .finally(() => setLoadingCourses(false));
    }
  }, [globalMode, open]);

  useEffect(() => {
    if (globalMode && selectedCourse) {
      setLoadingTeachers(true);
      apiClient.get<ApiResponse<Teacher[]>>(`/spwapi/course/teachers?course_id=${selectedCourse}`)
        .then(res => {
          if (res.code === 0 && res.data) setTeacherList(res.data);
          else setTeacherList([]);
        })
        .finally(() => setLoadingTeachers(false));
    }
  }, [globalMode, selectedCourse]);

  const handleSubmit = async () => {
    if (!selectedTeacher || (!selectedCourse && globalMode)) {
      toast.error("Please select a course and teacher.");
      return;
    }
    setSubmitting(true);
    try {
      const res: any = await apiClient.post("/spwapi/auth/trial/lesson/apply", {
        course_id: globalMode ? selectedCourse : courseId,
        teacher_id: selectedTeacher,
      });
      if (res.code === 0) {
        toast.success("Trial lesson application submitted!");
        onClose();
      } else {
        toast.error(res.msg || "Failed to apply for trial lesson.");
      }
    } catch (e: any) {
      toast.error(e?.message || "Network error.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-lg relative animate-fade-in">
        <button className="absolute top-4 right-4 text-gray-400 hover:text-gray-700" onClick={onClose}>
          <FaTimes size={20} />
        </button>
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2 text-blue-700">
          <FaVideo className="text-blue-500" /> Apply for Trial Lesson
        </h2>
        {globalMode && (
          <div className="mb-6">
            <div className="font-semibold text-gray-700 mb-2">Select a Course</div>
            {loadingCourses ? (
              <div className="text-gray-400 italic">Loading courses...</div>
            ) : (
              <select
                className="w-full border rounded-lg px-3 py-2 mb-2"
                value={selectedCourse || ''}
                onChange={e => setSelectedCourse(Number(e.target.value))}
              >
                <option value="">-- Select --</option>
                {courseList.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            )}
          </div>
        )}
        <div className="mb-6">
          <div className="font-semibold text-gray-700 mb-2">Select a Teacher</div>
          {loadingTeachers ? (
            <div className="text-gray-400 italic">Loading teachers...</div>
          ) : teacherList.length === 0 ? (
            <div className="text-gray-400 italic">No teachers available for this course.</div>
          ) : (
            teacherList.map((t) => (
              <label key={t.id} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${selectedTeacher === t.id ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-blue-300"}`}>
                <img src={t.avatar || "/default-avatar.svg"} alt={t.name} className="w-10 h-10 rounded-full object-cover border border-gray-200" />
                <div className="flex-1">
                  <div className="font-bold text-gray-800">{t.name}</div>
                  <div className="text-xs text-gray-500 line-clamp-1">{t.introduction}</div>
                </div>
                <input type="radio" name="teacher" value={t.id} checked={selectedTeacher === t.id} onChange={() => setSelectedTeacher(t.id)} className="accent-blue-500" />
              </label>
            ))
          )}
        </div>
        <button
          className="w-full py-3 rounded-xl bg-blue-600 text-white font-bold text-lg shadow hover:bg-blue-700 transition disabled:bg-blue-300"
          onClick={handleSubmit}
          disabled={submitting || !selectedTeacher || (globalMode && !selectedCourse)}
        >
          {submitting ? "Submitting..." : "Submit Application"}
        </button>
      </div>
    </div>
  );
} 