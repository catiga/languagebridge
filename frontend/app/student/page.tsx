"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FaBookOpen, FaStar, FaStickyNote, FaRobot, FaCalendarAlt, FaRocket } from "react-icons/fa";
import Image from "next/image";
import Cookies from "js-cookie";
import { motion } from "framer-motion";
import { apiClient } from "../utils/api";

const funColors = [
  "from-pink-400 via-pink-300 to-pink-200",
  "from-blue-400 via-blue-300 to-blue-200",
  "from-green-400 via-green-300 to-green-200",
  "from-yellow-400 via-yellow-300 to-yellow-200",
];

export default function StudentPortalPage() {
  const [studentInfo, setStudentInfo] = useState<any>(null);
  const [parentNo, setParentNo] = useState("");
  const [weekLessons, setWeekLessons] = useState<any[]>([]);
  const [cardStats, setCardStats] = useState({
    my_course_count: 0,
    lesson_upcoming_count: 0,
    lesson_past_count: 0,
    total_student_count: 0,
  });
  const router = useRouter();

  useEffect(() => {
    let info: any = null;
    if (typeof window !== "undefined") {
      const raw = localStorage.getItem("studentInfo") || sessionStorage.getItem("studentInfo") || Cookies.get("studentInfo");
      if (raw) {
        try { info = JSON.parse(raw); } catch {}
      }
      setStudentInfo(info);
      setParentNo(localStorage.getItem("parentNo") || Cookies.get("parentNo") || "");
    }
    // 拉取学生portal首页数据
    async function fetchOverview() {
      try {
        const res: any = await apiClient.get("/spwapi/student/auth/overview");
        if (res && res.code === 0 && res.data) {
          setCardStats({
            my_course_count: res.data.my_course_count,
            lesson_upcoming_count: res.data.lesson_upcoming_count,
            lesson_past_count: res.data.lesson_past_count,
            total_student_count: res.data.total_student_count,
          });
          setWeekLessons(res.data.current_week_courses || []);
          setStudentInfo(res.data.updated_student || info);
        }
      } catch {}
    }
    fetchOverview();
  }, []);

  // 卡片数据动态渲染
  const cardData = [
    {
      label: "My Courses",
      icon: <FaBookOpen size={32} />,
      color: "from-pink-400 to-pink-300",
      desc: `${cardStats.my_course_count} total`,
      btn: "View",
      onClick: () => router.push("/student/courses"),
    },
    {
      label: "Upcoming Lessons",
      icon: <FaRocket size={32} />,
      color: "from-blue-400 to-blue-300",
      desc: `${cardStats.lesson_upcoming_count} upcoming`,
      btn: "See",
      onClick: () => router.push("/student/courses"),
    },
    {
      label: "Completed Lessons",
      icon: <FaStar size={32} />,
      color: "from-green-400 to-green-300",
      desc: `${cardStats.lesson_past_count} done`,
      btn: "History",
      onClick: () => router.push("/student/courses?tab=history"),
    },
    {
      label: "Classmates",
      icon: <FaStickyNote size={32} />,
      color: "from-yellow-400 to-yellow-300",
      desc: `${cardStats.total_student_count} students`,
      btn: "List",
      onClick: () => router.push("/student/classmates"),
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-pink-50 to-yellow-50 pb-10">
      {/* 移除顶部AI助手气泡和AI头像，只保留如下： */}
      <div className="flex flex-col items-center mt-10 mb-4">
        <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-white shadow-lg mb-2 bg-white">
          <Image src={studentInfo?.avatar || "/default-avatar.svg"} alt="avatar" width={96} height={96} />
        </div>
        <div className="text-lg font-bold text-gray-800 mb-1 tracking-wide flex items-center gap-2">
          {studentInfo?.Name || studentInfo?.Email || "Student"}
        </div>
        <div className="text-xs text-gray-500 mb-1 flex flex-wrap items-center justify-center gap-2">
          <span>Student No: {studentInfo?.StudentID || "-"}</span>
          <span className="mx-2">|</span>
          <span>Parent No: {parentNo || "-"}</span>
        </div>
      </div>

      {/* 趣味功能卡片区 */}
      <div className="max-w-4xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8 px-2">
        {cardData.map((card, idx) => (
          <motion.div
            key={card.label}
            className={`rounded-2xl shadow-lg p-4 flex flex-col items-center bg-gradient-to-br ${card.color} text-white relative group cursor-pointer hover:scale-105 transition-all duration-200`}
            whileHover={{ scale: 1.08 }}
            transition={{ type: "spring", stiffness: 300 }}
            onClick={card.onClick}
          >
            <div className="mb-2 text-3xl">{card.icon}</div>
            <div className="text-lg font-bold mb-1 drop-shadow">{card.label}</div>
            <div className="text-sm mb-2 opacity-90">{card.desc}</div>
            <button className="mt-auto px-4 py-1.5 rounded-full bg-white/80 text-blue-700 font-bold text-xs shadow hover:bg-white/100 transition-all duration-150 group-hover:scale-110">
              {card.btn}
            </button>
            {/* AI小星星动画 */}
            {card.label === "AI Test" && (
              <span className="absolute top-2 right-2 animate-pulse text-yellow-200 text-xl">★</span>
            )}
          </motion.div>
        ))}
      </div>

      {/* 本周课表预览 */}
      <div className="max-w-4xl mx-auto bg-white/90 rounded-2xl shadow-lg p-4 mt-4">
        <h2 className="text-lg font-bold text-blue-700 mb-3 flex items-center gap-2"><FaCalendarAlt className="text-blue-400" /> Weekly Schedule Preview</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 justify-items-center">
          {weekLessons.length === 0 ? (
            <div className="text-gray-400 text-sm text-center py-6 col-span-full">No lessons scheduled this week.</div>
          ) : (
            weekLessons.map((lesson, i) => {
              // 计算是否可进入课堂
              let canEnter = false;
              let cardClass = "bg-blue-50 border border-blue-100";
              try {
                const now = new Date();
                const lessonDate = new Date(lesson.lesson_date);
                const [h, m, s] = lesson.start_time.split(":");
                lessonDate.setHours(Number(h), Number(m), Number(s || 0), 0);
                const start = new Date(lessonDate.getTime() - 10 * 60 * 1000); // 前10分钟
                const end = new Date(lessonDate.getTime() + 2 * 60 * 60 * 1000); // 后2小时
                if (now >= start && now <= end) {
                  canEnter = true;
                  cardClass = "bg-gradient-to-r from-blue-200 via-purple-100 to-pink-100 border-2 border-blue-400 shadow-lg";
                }
              } catch {}
              return (
                <motion.div
                  key={lesson.book_id || lesson.id || i}
                  className={`w-full h-full min-h-[60px] flex items-center justify-between rounded-xl px-4 py-2 font-semibold shadow mb-1 transition ${cardClass}`}
                  whileHover={{ scale: 1.04 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-base mb-0.5 truncate">{lesson.course_name}</div>
                    <div className="text-xs mb-0.5">
                      {lesson.start_time} - {lesson.end_time} | {lesson.lesson_date?.slice(0, 10)}
                    </div>
                    <div className="text-xs text-gray-500">Teacher: {lesson.teacher_name}</div>
                  </div>
                  {canEnter && (
                    <button
                      className="ml-3 px-3 py-1 bg-gradient-to-r from-blue-500 to-purple-400 text-white font-semibold rounded-lg shadow hover:scale-105 transition-all duration-200 flex items-center gap-1 text-xs whitespace-nowrap"
                      onClick={() => router.push(`/student/lesson/${lesson.book_id || lesson.id}`)}
                    >
                      <FaRocket className="mr-1 w-3 h-3" /> Enter
                    </button>
                  )}
                </motion.div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
} 