"use client";
import { useState } from "react";
import TeacherCourseHistoryPanel from "../components/TeacherCourseHistoryPanel";

export default function TeacherCoursesPage() {
  const [activeTab, setActiveTab] = useState<"upcoming" | "history">("history");
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Course Management</h1>
      <div className="flex border-b mb-4 space-x-6">
        <button className={activeTab === "upcoming" ? "border-b-2 border-blue-600 font-bold px-4 py-2" : "px-4 py-2"} onClick={() => setActiveTab("upcoming")}>Upcoming Classes</button>
        <button className={activeTab === "history" ? "border-b-2 border-blue-600 font-bold px-4 py-2" : "px-4 py-2"} onClick={() => setActiveTab("history")}>Course History</button>
      </div>
      {activeTab === "history" && <TeacherCourseHistoryPanel />}
      {/* 未来可加UpcomingClassesPanel */}
    </div>
  );
} 