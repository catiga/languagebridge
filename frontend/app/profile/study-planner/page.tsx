"use client";
import React, { useState, useEffect } from "react";
import ProfileLayout from '../ProfileLayout';
import { useRef } from "react";
import { apiClient } from '../../utils/api';
import * as yup from 'yup';

const dummyTasks = [
  { id: 1, title: "Finish KET grammar exercises", date: "2024-06-10", category: "Writing", priority: "High", status: "not_started" },
  { id: 2, title: "Listening practice 30min", date: "2024-06-10", category: "Listening", priority: "Medium", status: "done" },
  { id: 3, title: "Memorize 20 words", date: "2024-06-11", category: "Vocabulary", priority: "Low", status: "partial" },
  { id: 4, title: "Read a short story", date: "2024-06-12", category: "Reading", priority: "High", status: "little" },
  { id: 5, title: "Practice speaking", date: "2024-06-12", category: "Speaking", priority: "Medium", status: "not_done" },
  { id: 6, title: "Review notes", date: "2024-06-13", category: "Review", priority: "Low", status: "reserved" },
  { id: 7, title: "Write a diary", date: "2024-06-14", category: "Writing", priority: "High", status: "done" },
  { id: 8, title: "Grammar quiz", date: "2024-06-15", category: "Grammar", priority: "Medium", status: "not_started" },
  { id: 9, title: "Watch English video", date: "2024-06-15", category: "Listening", priority: "Low", status: "partial" },
  { id: 10, title: "Group discussion", date: "2024-06-16", category: "Speaking", priority: "High", status: "done" },
  { id: 11, title: "Mock test", date: "2024-06-16", category: "Test", priority: "High", status: "not_done" },
  { id: 12, title: "Vocabulary review", date: "2024-06-17", category: "Vocabulary", priority: "Medium", status: "done" },
];

const courseOptions = [
  { id: 1, name: "PET English Exam" },
  { id: 2, name: "KET Grammar" },
  { id: 3, name: "IELTS Speaking" },
];
const categoryOptions = ["Listening", "Writing", "Reading", "Speaking", "Vocabulary", "Grammar", "Test", "Review"];
const priorityOptions = ["High", "Medium", "Low"];
const statusOptions = [
  { value: "not_started", label: "Not started" },
  { value: "reserved", label: "Reschedule" },
  { value: "done", label: "Very good" },
  { value: "partial", label: "Medium" },
  { value: "little", label: "Little done" },
  { value: "not_done", label: "Not done" },
];

const viewTabs = [
  { key: "month", label: "Month" },
  { key: "week", label: "Week" },
  { key: "day", label: "Day" },
];

const statusMap = {
  done: { label: "Very good", emoji: "✅" },
  partial: { label: "Medium", emoji: "🟡" },
  little: { label: "Little done", emoji: "🔸" },
  not_done: { label: "Not done", emoji: "❌" },
  reserved: { label: "Reschedule", emoji: "⏳" },
  not_started: { label: "Not started", emoji: "🕒" },
};

const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

// 新增阶段目标类型和dummy数据
interface StageGoal {
  id: number;
  title: string;
  description: string;
  goal: string;
  startDate: string;
  endDate: string;
}

const dummyStageGoals: StageGoal[] = [
  {
    id: 1,
    title: "Summer English Sprint",
    description: "Focus on improving listening and writing skills.",
    goal: "Finish 20 listening practices and 10 essays.",
    startDate: "2024-06-01",
    endDate: "2024-06-30"
  },
  {
    id: 2,
    title: "Exam Preparation",
    description: "Prepare for PET exam.",
    goal: "Complete all PET mock tests.",
    startDate: "2024-07-01",
    endDate: "2024-07-31"
  }
];

export default function StudyPlannerPage() {
  const [view, setView] = useState("month");
  const [selectedDate, setSelectedDate] = useState("2024-06-10");
  const [stageGoals, setStageGoals] = useState<StageGoal[]>(dummyStageGoals);
  const [currentStageGoalId, setCurrentStageGoalId] = useState<number | null>(stageGoals.length > 0 ? stageGoals[0].id : null);
  const [showAddStage, setShowAddStage] = useState(false);
  const [tasks, setTasks] = useState(dummyTasks.map(t => ({ ...t, stageGoalId: dummyStageGoals[0].id })));
  const [showAdd, setShowAdd] = useState(false);
  const [loading, setLoading] = useState(true);
  const [addTaskDate, setAddTaskDate] = useState<string | null>(null);

  // 拉取阶段目标和任务
  useEffect(() => {
    let ignore = false;
    setLoading(true);
    apiClient.get('/spwapi/auth/planner/pull').then((res: any) => {
      if (ignore) return;
      if (res && res.code === 0 && Array.isArray(res.data)) {
        // 字段名转换
        const goals = res.data.map((g: any) => ({
          ...g,
          startDate: g.start_date,
          endDate: g.end_date,
        }));
        setStageGoals(goals);
        if (goals.length > 0) {
          setCurrentStageGoalId(goals[0].id);
        } else {
          setCurrentStageGoalId(null);
        }
        // 合并所有tasks
        const allTasks: any[] = [];
        for (const g of res.data) {
          if (Array.isArray(g.tasks)) {
            for (const t of g.tasks) {
              allTasks.push({
                ...t,
                date: t.exe_date ? t.exe_date.slice(0, 10) : '',
                stageGoalId: g.id,
                title: t.content,
              });
            }
          }
        }
        setTasks(allTasks);
      }
    }).finally(() => {
      if (!ignore) setLoading(false);
    });
    return () => { ignore = true; };
  }, []);

  // 任务数据增加stageGoalId
  // const [tasks, setTasks] = useState(dummyTasks.map(t => ({ ...t, stageGoalId: dummyStageGoals[0].id })));
  // const [showAdd, setShowAdd] = useState(false);

  // 任务状态变更
  const updateTaskStatus = (id: number, status: string) => {
    setTasks(ts => ts.map(t => t.id === id ? { ...t, status } : t));
  };
  // 删除任务
  const deleteTask = (id: number) => {
    setTasks(ts => ts.filter(t => t.id !== id));
  };

  // 只显示当前阶段目标下的任务
  const filteredTasks = tasks.filter(t => t.stageGoalId === currentStageGoalId);
  const currentStageGoal = stageGoals.find(g => g.id === currentStageGoalId) || null;

  // 添加阶段目标
  const handleAddStageGoal = (goal: Omit<StageGoal, 'id'>) => {
    const newGoal: StageGoal = { ...goal, id: Math.max(0, ...stageGoals.map(g => g.id)) + 1 };
    setStageGoals(gs => [...gs, newGoal]);
    setCurrentStageGoalId(newGoal.id);
    setShowAddStage(false);
  };

  // 添加任务时自动带上当前阶段目标id
  const handleAddTask = (task: any) => {
    setTasks(ts => [
      ...ts,
      { ...task, id: Math.max(0, ...ts.map(t => t.id)) + 1, stageGoalId: currentStageGoalId }
    ]);
    setShowAdd(false);
  };

  // 若无阶段目标，显示创建表单
  if (loading) {
    return (
      <ProfileLayout>
        <div className="flex items-center justify-center min-h-[60vh] text-blue-600 text-xl font-bold">Loading...</div>
      </ProfileLayout>
    );
  }

  if (stageGoals.length === 0) {
    return (
      <ProfileLayout>
        <div className="max-w-xl mx-auto mt-24 bg-white/90 rounded-3xl shadow-xl p-8 flex flex-col items-center">
          <h2 className="text-2xl font-bold mb-4 text-blue-700">Create Your First Stage Goal</h2>
          <AddStageGoalModal onClose={() => {}} onSubmit={handleAddStageGoal} />
        </div>
      </ProfileLayout>
    );
  }

  return (
    <ProfileLayout>
      <div className="max-w-5xl mx-auto mt-6 bg-white/80 rounded-3xl shadow-xl p-6 min-h-[70vh]">
        {/* 阶段目标切换与展示 */}
        <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-lg text-blue-700">Stage Goal:</span>
            <select className="border rounded px-3 py-2" value={currentStageGoalId ?? ''} onChange={e => setCurrentStageGoalId(Number(e.target.value))}>
              {stageGoals.map(g => <option key={g.id} value={g.id}>{g.title}</option>)}
            </select>
            <button className="ml-2 px-3 py-1 rounded bg-blue-100 text-blue-700 font-semibold hover:bg-blue-200" onClick={() => setShowAddStage(true)}>+ New</button>
          </div>
          {currentStageGoal && (
            <div className="bg-blue-50 rounded-xl px-4 py-2 text-sm text-gray-700 max-w-xl">
              <div><b>Theme:</b> {currentStageGoal.title}</div>
              <div><b>Description:</b> {currentStageGoal.description}</div>
              <div><b>Goal:</b> {currentStageGoal.goal}</div>
              <div><b>Period:</b> {currentStageGoal.startDate} ~ {currentStageGoal.endDate}</div>
            </div>
          )}
        </div>
        {/* 视图切换与主内容 */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-blue-700 flex items-center gap-2">
            <span className="text-2xl">📅</span> Study Planner
          </h1>
          <div className="flex gap-2">
            {viewTabs.map(tab => (
              <button
                key={tab.key}
                className={`px-4 py-2 rounded-full font-semibold transition-all duration-200 ${view === tab.key ? "bg-gradient-to-r from-blue-400 to-purple-400 text-white shadow" : "bg-gray-100 text-gray-700 hover:bg-blue-100"}`}
                onClick={() => setView(tab.key)}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <button className="px-4 py-2 rounded-full bg-blue-600 text-white font-bold shadow hover:bg-blue-700 transition" onClick={() => setShowAdd(true)}>+ Add Task</button>
        </div>
        {/* View Content */}
        <div className="mt-4">
          {view === "month" && currentStageGoal && (
            <MonthView
              tasks={filteredTasks}
              selectedDate={selectedDate}
              setSelectedDate={setSelectedDate}
              onAddTask={date => setAddTaskDate(date)}
              periodStart={currentStageGoal.startDate}
              periodEnd={currentStageGoal.endDate}
            />
          )}
          {view === "week" && <WeekView tasks={filteredTasks} selectedDate={selectedDate} setSelectedDate={setSelectedDate} />}
          {view === "day" && <DayView tasks={filteredTasks} selectedDate={selectedDate} setTasks={setTasks} updateTaskStatus={updateTaskStatus} deleteTask={deleteTask} />}
        </div>
        {/* Statistics */}
        <div className="mt-8">
          <StatsPanel tasks={filteredTasks} />
        </div>
        {(showAdd || addTaskDate) && (
          <AddTaskModal
            onClose={() => { setShowAdd(false); setAddTaskDate(null); }}
            onSubmit={async (task: any) => {
              // priority: High=1, Medium=2, Low=3
              const priorityMap: any = { High: 1, Medium: 2, Low: 3 };
              const payload = {
                overview_id: currentStageGoalId,
                exe_date: addTaskDate || task.date,
                start_time: task.start_time,
                end_time: task.end_time,
                duration: 0,
                priority: priorityMap[task.priority] || 2,
                content: task.title,
                note: task.note || "",
                repeat: task.repeat === 'whole_period',
              };
              await apiClient.post('/spwapi/auth/planner/task/add', payload);
              handleAddTask({ ...task, date: addTaskDate || task.date });
              setShowAdd(false); setAddTaskDate(null);
            }}
            date={addTaskDate || undefined}
          />
        )}
        {showAddStage && <AddStageGoalModal onClose={() => setShowAddStage(false)} onSubmit={handleAddStageGoal} />}
      </div>
    </ProfileLayout>
  );
}

function MonthView({ tasks, selectedDate, setSelectedDate, onAddTask, periodStart, periodEnd }: any) {
  // 只渲染当前阶段目标的日期区间
  const start = new Date(periodStart);
  const end = new Date(periodEnd);
  const days: string[] = [];
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    days.push(d.toISOString().slice(0, 10));
  }
  if (days.length === 0) {
    return <div className="text-gray-400 text-center py-8">No days in this period</div>;
  }
  // 计算首日是周几
  const firstDay = new Date(days[0]).getDay();
  const firstDayIdx = (firstDay + 6) % 7; // 0=Mon
  const grid: (null | string)[] = Array(firstDayIdx).fill(null).concat(days);
  while (grid.length % 7 !== 0) grid.push(null);
  return (
    <div className="rounded-xl bg-gradient-to-br from-blue-50 to-purple-50 p-6 shadow flex flex-col items-center">
      <div className="text-lg font-bold mb-2">{periodStart} ~ {periodEnd}</div>
      <div className="grid grid-cols-7 gap-2 w-full mb-2">
        {weekDays.map(d => <div key={d} className="text-center text-gray-500 font-semibold">{d}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-2 w-full">
        {grid.map((date, idx) => {
          if (!date) return <div key={idx} />;
          const dayTasks = tasks.filter((t: any) => t.date === date);
          const done = dayTasks.filter((t: any) => t.status === "done").length;
          return (
            <button
              key={date}
              className={`rounded-lg p-2 flex flex-col items-center border transition-all min-h-[60px] ${selectedDate === date ? "bg-blue-200 border-blue-500" : "bg-white border-gray-200 hover:bg-blue-50"}`}
              onClick={() => { setSelectedDate(date); onAddTask(date); }}
            >
              <span className="font-semibold">{Number(date.slice(-2))}</span>
              <span className="text-xs mt-1">{dayTasks.length > 0 ? `${dayTasks.length} tasks` : ""}</span>
              <span className="text-xs mt-1">
                {done === dayTasks.length && dayTasks.length > 0 ? "✅" : dayTasks.length > 0 ? "🕒" : ""}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function WeekView({ tasks, selectedDate, setSelectedDate }: any) {
  // 以selectedDate为本周，展示周一到周日
  const dateObj = new Date(selectedDate);
  const dayIdx = (dateObj.getDay() + 6) % 7; // 0=Mon
  const monday = new Date(dateObj);
  monday.setDate(dateObj.getDate() - dayIdx);
  const weekDates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d.toISOString().slice(0, 10);
  });
  return (
    <div className="rounded-xl bg-gradient-to-br from-blue-50 to-purple-50 p-6 shadow">
      <div className="flex justify-between mb-2">
        {weekDays.map((d, i) => (
          <div key={d} className="text-center font-semibold text-gray-500 flex-1">{d}<br /><span className="text-xs">{weekDates[i].slice(-2)}</span></div>
        ))}
      </div>
      <div className="flex gap-2">
        {weekDates.map((date, i) => {
          const dayTasks = tasks.filter((t: any) => t.date === date);
          return (
            <div key={date} className="flex-1 min-h-[80px] bg-white rounded-lg shadow p-2 flex flex-col gap-2">
              {dayTasks.length === 0 ? <div className="text-xs text-gray-300 text-center">No tasks</div> :
                dayTasks.map((t: any) => (
                  <div key={t.id} className="flex items-center gap-2 text-xs rounded px-2 py-1 border border-gray-100 bg-blue-50">
                    <span>{statusMap[t.status as keyof typeof statusMap]?.emoji}</span>
                    <span className="font-semibold">{t.title}</span>
                  </div>
                ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function DayView({ tasks, selectedDate, setTasks, updateTaskStatus, deleteTask }: any) {
  const dayTasks = tasks.filter((t: any) => t.date === selectedDate);
  return (
    <div>
      <div className="text-lg font-bold mb-4">Tasks for {selectedDate}</div>
      {dayTasks.length === 0 ? (
        <div className="text-gray-400">No tasks</div>
      ) : (
        <ul className="space-y-4">
          {dayTasks.map((t: any) => (
            <li key={t.id} className="rounded-xl bg-white shadow p-4 flex items-center gap-4">
              <span className="text-2xl">{statusMap[t.status as keyof typeof statusMap]?.emoji}</span>
              <div className="flex-1">
                <div className="font-bold text-lg">{t.title}</div>
                <div className="text-xs text-gray-500 mt-1">Category: {t.category} | Priority: {t.priority}</div>
                <div className="text-xs text-gray-400 mt-1">Status: {statusMap[t.status as keyof typeof statusMap]?.label}</div>
              </div>
              <button className="px-3 py-1 rounded bg-blue-100 text-blue-700 font-semibold hover:bg-blue-200" onClick={() => updateTaskStatus(t.id, nextStatus(t.status))}>Change Status</button>
              <button className="px-3 py-1 rounded bg-gray-100 text-gray-500 hover:bg-gray-200">Edit</button>
              <button className="px-3 py-1 rounded bg-red-100 text-red-500 hover:bg-red-200" onClick={() => deleteTask(t.id)}>Delete</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function nextStatus(status: string) {
  // 按照产品需求顺序循环
  const order = ["not_started", "reserved", "done", "partial", "little", "not_done"];
  const idx = order.indexOf(status);
  return order[(idx + 1) % order.length];
}

function StatsPanel({ tasks }: any) {
  const total = tasks.length;
  const done = tasks.filter((t: any) => t.status === "done").length;
  const partial = tasks.filter((t: any) => t.status === "partial").length;
  const little = tasks.filter((t: any) => t.status === "little").length;
  const notDone = tasks.filter((t: any) => t.status === "not_done").length;
  const reserved = tasks.filter((t: any) => t.status === "reserved").length;
  const notStarted = tasks.filter((t: any) => t.status === "not_started").length;
  return (
    <div className="rounded-xl bg-gradient-to-r from-green-100 to-blue-100 p-6 flex items-center gap-8">
      <div>
        <div className="text-2xl font-bold">{total}</div>
        <div className="text-gray-500">Total tasks this month</div>
      </div>
      <div>
        <div className="text-2xl font-bold">{done}</div>
        <div className="text-gray-500">Very good</div>
      </div>
      <div>
        <div className="text-2xl font-bold">{partial}</div>
        <div className="text-gray-500">Medium</div>
      </div>
      <div>
        <div className="text-2xl font-bold">{little}</div>
        <div className="text-gray-500">Little done</div>
      </div>
      <div>
        <div className="text-2xl font-bold">{notDone}</div>
        <div className="text-gray-500">Not done</div>
      </div>
      <div>
        <div className="text-2xl font-bold">{reserved}</div>
        <div className="text-gray-500">Reschedule</div>
      </div>
      <div>
        <div className="text-2xl font-bold">{notStarted}</div>
        <div className="text-gray-500">Not started</div>
      </div>
      <div className="ml-auto text-green-700 font-bold text-lg">{total > 0 ? `Completion rate ${(done / total * 100).toFixed(0)}%` : ""}</div>
    </div>
  );
}

type AddTaskModalProps = { onClose: () => void, onSubmit: (task: any) => void, date?: string | null };
function AddTaskModal(props: AddTaskModalProps) {
  const { onClose, onSubmit, date } = props;
  const [title, setTitle] = useState("");
  const [taskDate, setTaskDate] = useState((date ?? new Date().toISOString().slice(0, 10)));
  const [category, setCategory] = useState(categoryOptions[0]);
  const [priority, setPriority] = useState(priorityOptions[0]);
  const [repeat, setRepeat] = useState("none");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (date) setTaskDate(date);
  }, [date]);

  const schema = yup.object().shape({
    title: yup.string().required('Title is required'),
    date: yup.string().required('Date is required'),
    category: yup.string().required('Category is required'),
    priority: yup.string().required('Priority is required'),
    repeat: yup.string().required('Repeat is required'),
    start_time: yup.string().required('Start time is required'),
    end_time: yup.string(),
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      await schema.validate({ title, date: taskDate, category, priority, repeat, start_time: startTime, end_time: endTime });
    } catch (err: any) {
      setError(err.message);
      return;
    }
    onSubmit({ title, date: taskDate, category, priority, repeat, start_time: startTime, end_time: endTime, note });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
      <form className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-lg relative" onSubmit={handleSubmit}>
        <button type="button" className="absolute top-3 right-3 text-gray-400 hover:text-gray-700 text-2xl" onClick={onClose}>&times;</button>
        <h2 className="text-2xl font-bold mb-4 text-blue-700">Add New Task</h2>
        {error && <div className="mb-2 text-red-500 text-sm">{error}</div>}
        <div className="grid grid-cols-1 gap-4 mb-3">
          <div>
            <label className="block font-semibold mb-1">Title<span className="text-red-500">*</span></label>
            <input className="w-full border rounded px-3 py-2" value={title} onChange={e => setTitle(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold mb-1">Date<span className="text-red-500">*</span></label>
              <input type="date" className="w-full border rounded px-3 py-2" value={taskDate} onChange={e => setTaskDate(e.target.value)} disabled={!!date} />
            </div>
            <div>
              <label className="block font-semibold mb-1">Repeat<span className="text-red-500">*</span></label>
              <select className="w-full border rounded px-3 py-2" value={repeat} onChange={e => setRepeat(e.target.value)}>
                <option value="none">None</option>
                <option value="whole_period">Whole Period</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold mb-1">Category<span className="text-red-500">*</span></label>
              <select className="w-full border rounded px-3 py-2" value={category} onChange={e => setCategory(e.target.value)}>
                {categoryOptions.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block font-semibold mb-1">Priority<span className="text-red-500">*</span></label>
              <select className="w-full border rounded px-3 py-2" value={priority} onChange={e => setPriority(e.target.value)}>
                {priorityOptions.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold mb-1">Start Time<span className="text-red-500">*</span></label>
              <input type="time" className="w-full border rounded px-3 py-2" value={startTime} onChange={e => setStartTime(e.target.value)} />
            </div>
            <div>
              <label className="block font-semibold mb-1">End Time</label>
              <input type="time" className="w-full border rounded px-3 py-2" value={endTime} onChange={e => setEndTime(e.target.value)} />
            </div>
          </div>
          <div>
            <label className="block font-semibold mb-1">Note</label>
            <textarea className="w-full border rounded px-3 py-2" value={note} onChange={e => setNote(e.target.value)} rows={3} maxLength={200} />
          </div>
        </div>
        <div className="flex justify-end gap-4 mt-6">
          <button type="button" className="px-4 py-2 rounded bg-gray-200" onClick={onClose}>Cancel</button>
          <button type="submit" className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700">Add</button>
        </div>
      </form>
    </div>
  );
}

function AddStageGoalModal({ onClose, onSubmit }: { onClose: () => void, onSubmit: (goal: Omit<StageGoal, 'id'>) => void }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [goal, setGoal] = useState("");
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [endDate, setEndDate] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const schema = yup.object().shape({
    title: yup.string().required('Theme/Title is required'),
    description: yup.string().required('Description is required'),
    goal: yup.string().required('Goal is required'),
    startDate: yup.string().required('Start date is required'),
    endDate: yup.string().required('End date is required')
      .test('is-after', 'End date must be after start date', function(value) {
        const { startDate } = this.parent;
        return !value || !startDate || value >= startDate;
      }),
  });

  function formatDate(date: string) {
    if (!date) return "";
    return date.replace(/\//g, "-").replace(/^(\d{4})[-/](\d{2})[-/](\d{2})$/, "$1-$2-$3");
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      await schema.validate({ title, description, goal, startDate, endDate });
    } catch (err: any) {
      setError(err.message);
      return;
    }
    setLoading(true);
    try {
      const payload = {
        title,
        description,
        goal,
        start_date: formatDate(startDate),
        end_date: formatDate(endDate),
      };
      let res;
      if (typeof apiClient !== 'undefined') {
        res = await apiClient.post('/spwapi/auth/planner/add', payload) as any;
        if (res && (res as any).code !== 0) throw new Error((res as any).msg || 'Failed');
      } else {
        res = await fetch('/planner/add', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error('Failed');
      }
      onSubmit({ title, description, goal, startDate: formatDate(startDate), endDate: formatDate(endDate) });
    } catch (err: any) {
      setError(err?.message || "Failed to create stage goal");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
      <form className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-lg relative" onSubmit={handleSubmit}>
        <button type="button" className="absolute top-3 right-3 text-gray-400 hover:text-gray-700 text-2xl" onClick={onClose}>&times;</button>
        <h2 className="text-2xl font-bold mb-4 text-blue-700">Create Stage Goal</h2>
        {error && <div className="mb-2 text-red-500 text-sm">{error}</div>}
        <div className="mb-3">
          <label className="block font-semibold mb-1">Theme/Title<span className="text-red-500">*</span></label>
          <input className="w-full border rounded px-3 py-2" value={title} onChange={e => setTitle(e.target.value)} />
        </div>
        <div className="mb-3">
          <label className="block font-semibold mb-1">Description<span className="text-red-500">*</span></label>
          <textarea className="w-full border rounded px-3 py-2" value={description} onChange={e => setDescription(e.target.value)} rows={2} />
        </div>
        <div className="mb-3">
          <label className="block font-semibold mb-1">Goal<span className="text-red-500">*</span></label>
          <input className="w-full border rounded px-3 py-2" value={goal} onChange={e => setGoal(e.target.value)} />
        </div>
        <div className="mb-3 flex gap-4">
          <div className="flex-1">
            <label className="block font-semibold mb-1">Start Date<span className="text-red-500">*</span></label>
            <input type="date" className="w-full border rounded px-3 py-2" value={startDate} onChange={e => setStartDate(e.target.value)} />
          </div>
          <div className="flex-1">
            <label className="block font-semibold mb-1">End Date<span className="text-red-500">*</span></label>
            <input type="date" className="w-full border rounded px-3 py-2" value={endDate} onChange={e => setEndDate(e.target.value)} />
          </div>
        </div>
        <div className="flex justify-end gap-4 mt-6">
          <button type="button" className="px-4 py-2 rounded bg-gray-200" onClick={onClose} disabled={loading}>Cancel</button>
          <button type="submit" className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700" disabled={loading}>{loading ? "Creating..." : "Create"}</button>
        </div>
      </form>
    </div>
  );
} 