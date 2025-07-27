"use client";
import React, { useState, useEffect } from "react";
import { apiClient } from '../../utils/api';
import { FaUser, FaLink } from 'react-icons/fa';
import ConfirmModal from '../../components/ConfirmModal';
import { toast } from 'react-toastify';
import * as yup from 'yup';

const categoryOptions = ["Listening", "Writing", "Reading", "Speaking", "Vocabulary", "Grammar", "Test", "Review"];
const priorityOptions = ["High", "Medium", "Low"];
const viewTabs = [
  { key: "month", label: "Month" },
  { key: "week", label: "Week" },
  { key: "day", label: "Day" },
];
const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

interface StageGoal {
  id: number;
  student_id: number;
  title: string;
  description: string;
  goal: string;
  add_time: string;
  start_date: string;
  end_date: string;
  tasks: any[] | null;
  goal_period_type: string;
  target_level: number;
  init_level: number;
  status: string;
}
type Executor = { id: string; name: string };

export default function StudentStudyPlannerInline() {
  // Remove members, executorId, bindModalOpen, bindPlanId, bindSelected, bindLoading, confirmOpen
  const [view, setView] = useState("month");
  const [selectedDate, setSelectedDate] = useState("");
  const [stageGoals, setStageGoals] = useState<StageGoal[]>([]);
  const [currentStageGoalId, setCurrentStageGoalId] = useState<number | null>(null);
  const [showAddStage, setShowAddStage] = useState(false);
  const [tasks, setTasks] = useState<any[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [loading, setLoading] = useState(true);
  const [addTaskDate, setAddTaskDate] = useState<string | null>(null);
  const [stats, setStats] = useState<any>(null);
  const [statsLoading, setStatsLoading] = useState(false);

  // Remove useEffect for fetching members and executorId logic

  const filteredTasks = tasks.filter(t => t.stageGoalId === currentStageGoalId);
  const currentStageGoal = stageGoals.find(g => g.id === currentStageGoalId) || null;

  useEffect(() => {
    let ignore = false;
    setLoading(true);
    // Only fetch the current student's plans
    let url = '/spwapi/student/auth/planner/pull';
    apiClient.get(url).then((res: any) => {
      if (ignore) return;
      if (res && res.code === 0 && Array.isArray(res.data) && res.data.length > 0) {
        setStageGoals(res.data);
        setCurrentStageGoalId(res.data[0].id);
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
        const today = new Date().toISOString().slice(0, 10);
        if (res.data[0].start_date && today >= res.data[0].start_date && today <= res.data[0].end_date) {
          setSelectedDate(today);
        } else if (res.data[0].start_date) {
          setSelectedDate(res.data[0].start_date);
        } else {
          setSelectedDate(today);
        }
        fetchStats(res.data[0].id);
      } else {
        setStageGoals([]);
        setCurrentStageGoalId(null);
        setTasks([]);
        setSelectedDate("");
        setStats(null);
      }
    }).finally(() => {
      if (!ignore) setLoading(false);
    });
    return () => { ignore = true; };
  }, []);

  const fetchStats = async (overviewId: number) => {
    if (!overviewId) return;
    setStatsLoading(true);
    try {
      const res = await apiClient.get(`/spwapi/student/auth/planner/stat?overview_id=${overviewId}`) as any;
      if (res && res.code === 0) {
        setStats(res.data);
      } else {
        setStats(null);
      }
    } catch {
      setStats(null);
    } finally {
      setStatsLoading(false);
    }
  };

  useEffect(() => {
    if (currentStageGoalId) {
      fetchStats(currentStageGoalId);
    }
  }, [currentStageGoalId]);

  // 切换到Day视图时，selectedDate自动设为周期内的今天或startDate
  useEffect(() => {
    if (view === 'day' && currentStageGoal) {
      const today = new Date().toISOString().slice(0, 10);
      if (currentStageGoal.start_date && today >= currentStageGoal.start_date && today <= currentStageGoal.end_date) {
        setSelectedDate(today);
      } else if (currentStageGoal.start_date) {
        setSelectedDate(currentStageGoal.start_date);
      } else {
        setSelectedDate(today);
      }
    }
  }, [view, currentStageGoal]);

  const updateTaskStatus = (id: number, status: string) => {
    setTasks(ts => ts.map(t => t.id === id ? { ...t, status } : t));
  };
  const deleteTask = (id: number) => {
    setTasks(ts => ts.filter(t => t.id !== id));
  };
  const handleAddStageGoal = (goal: any) => {
    const newGoal: StageGoal = { 
      ...goal, 
      id: Math.max(0, ...stageGoals.map(g => g.id)) + 1,
      student_id: 0,
      add_time: new Date().toISOString(),
      tasks: null,
      goal_period_type: 'medium_term',
      target_level: 3,
      init_level: 1,
      status: '00'
    };
    setStageGoals(gs => [...gs, newGoal]);
    setCurrentStageGoalId(newGoal.id);
    setShowAddStage(false);
  };
  const handleAddTask = (task: any) => {
    setTasks(ts => [
      ...ts,
      { ...task, id: Math.max(0, ...ts.map(t => t.id)) + 1, stageGoalId: currentStageGoalId }
    ]);
    setShowAdd(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh] text-blue-600 text-xl font-bold">Loading...</div>
    );
  }

  return (
    <div className="bg-white/90 rounded-2xl shadow-xl p-6 my-8">
      <div className="text-2xl font-bold text-blue-700 mb-4 flex items-center gap-2"><span className="text-2xl">📅</span> Study Planner</div>
      <div className="max-w-5xl mx-auto min-h-[70vh]">
        {/* Remove executor selection UI */}
        {stageGoals.length === 0 ? (
          <div className="max-w-2xl mx-auto mt-16 bg-gradient-to-br from-blue-50 to-purple-50 rounded-3xl shadow-xl p-12 flex flex-col items-center">
            <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mb-6">
              <span className="text-3xl text-white">🎯</span>
            </div>
            <h2 className="text-3xl font-bold mb-4 text-gray-800 text-center">Set Your Learning Goal</h2>
            <div className="text-gray-600 mb-8 text-center max-w-md leading-relaxed">
              Create a personalized learning plan to track your progress and achieve your English learning objectives.
            </div>
            <button 
              className="px-8 py-4 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold text-lg shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200 flex items-center gap-2" 
              onClick={() => setShowAddStage(true)}
            >
              <span className="text-xl">+</span>
              Set Learning Goal
            </button>
            {showAddStage && <AddStageGoalModal onClose={() => setShowAddStage(false)} onSubmit={handleAddStageGoal} />}
          </div>
        ) : (
          <>
            <div className="bg-white/80 rounded-2xl shadow-xl p-6 mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg text-blue-700">Stage Goal:</span>
                <select className="border rounded px-3 py-2" value={currentStageGoalId ?? ''} onChange={e => setCurrentStageGoalId(Number(e.target.value))}>
                  {stageGoals.map(g => <option key={g.id} value={g.id}>{g.title}</option>)}
                </select>
                <button className="ml-2 px-3 py-1 rounded bg-blue-100 text-blue-700 font-semibold hover:bg-blue-200" onClick={() => setShowAddStage(true)}>+ New</button>
              </div>
              {currentStageGoal && (
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl px-6 py-4 text-sm text-gray-700 max-w-2xl">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <div className="mb-2"><span className="font-semibold text-blue-700">Title:</span> {currentStageGoal.title}</div>
                      <div className="mb-2"><span className="font-semibold text-blue-700">Description:</span> {currentStageGoal.description}</div>
                      <div className="mb-2"><span className="font-semibold text-blue-700">Goal:</span> {currentStageGoal.goal}</div>
                      <div className="mb-2">
                        <span className="font-semibold text-blue-700">Period:</span> 
                        {currentStageGoal.start_date ? `${currentStageGoal.start_date} ~ ${currentStageGoal.end_date}` : `Until ${currentStageGoal.end_date}`}
                      </div>
                      <div className="mb-2">
                        <span className="font-semibold text-blue-700">Level:</span> 
                        {currentStageGoal.init_level} → {currentStageGoal.target_level}
                      </div>
                      <div className="mb-2">
                        <span className="font-semibold text-blue-700">Type:</span> 
                        <span className="capitalize ml-1">{currentStageGoal.goal_period_type.replace('_', ' ')}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
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
            <div className="mt-4">
              {view === "month" && currentStageGoal && (
                <MonthView
                  tasks={filteredTasks}
                  selectedDate={selectedDate}
                  setSelectedDate={setSelectedDate}
                  onAddTask={(date: string) => setAddTaskDate(date)}
                  periodStart={currentStageGoal.start_date}
                  periodEnd={currentStageGoal.end_date}
                />
              )}
              {view === "week" && <WeekView tasks={filteredTasks} selectedDate={selectedDate} setSelectedDate={setSelectedDate} />}
              {view === "day" && (
                <DayView
                  tasks={filteredTasks}
                  selectedDate={selectedDate}
                  setSelectedDate={setSelectedDate}
                  periodStart={currentStageGoal?.start_date}
                  periodEnd={currentStageGoal?.end_date}
                  onUpdateTask={(updatedTask: any) => setTasks(ts => ts.map(t => t.id === updatedTask.id ? updatedTask : t))}
                  onDeleteTask={(id: number) => setTasks(ts => ts.filter(t => t.id !== id))}
                />
              )}
            </div>
            <div className="mt-8">
              <StatsPanel stats={stats} loading={statsLoading} />
            </div>
            {(showAdd || addTaskDate) && (
              <AddTaskModal
                onClose={() => { setShowAdd(false); setAddTaskDate(null); }}
                onSubmit={async (task: any) => {
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
                  await apiClient.post('/spwapi/student/auth/planner/task/add', payload);
                  handleAddTask({ ...task, date: addTaskDate || task.date });
                  setShowAdd(false); setAddTaskDate(null);
                }}
                date={addTaskDate || undefined}
              />
            )}
            {showAddStage && <AddStageGoalModal onClose={() => setShowAddStage(false)} onSubmit={handleAddStageGoal} />}
          </>
        )}
      </div>
    </div>
  );
}

function MonthView({ tasks, selectedDate, setSelectedDate, onAddTask, periodStart, periodEnd }: any) {
  const [showTaskListModal, setShowTaskListModal] = useState(false);
  const [modalDate, setModalDate] = useState<string>("");
  const [showAddTaskModal, setShowAddTaskModal] = useState(false);

  const start = new Date(periodStart);
  const end = new Date(periodEnd);
  const days: string[] = [];
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    days.push(d.toISOString().slice(0, 10));
  }
  if (days.length === 0) {
    return <div className="text-gray-400 text-center py-8">No days in this period</div>;
  }
  const statusColor: Record<string, string> = {
    '00': 'text-gray-500', '10': 'text-blue-500', '20': 'text-orange-500', '50': 'text-green-600', '51': 'text-yellow-500', '52': 'text-teal-500', '53': 'text-purple-500', '54': 'text-pink-500',
  };
  const firstDay = new Date(days[0]).getDay();
  const firstDayIdx = (firstDay + 6) % 7;
  const grid: (null | string)[] = Array(firstDayIdx).fill(null).concat(days);
  while (grid.length % 7 !== 0) grid.push(null);
  return (
    <>
    <div className="rounded-xl bg-gradient-to-br from-blue-50 to-purple-50 p-6 shadow flex flex-col items-center">
      <div className="text-lg font-bold mb-2">{periodStart} ~ {periodEnd}</div>
      <div className="grid grid-cols-7 gap-2 w-full mb-2">
        {weekDays.map(d => <div key={d} className="text-center text-gray-500 font-semibold">{d}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-2 w-full">
        {grid.map((date, idx) => {
          if (!date) return <div key={idx} />;
          const dayTasks = tasks.filter((t: any) => t.date === date);
          return (
            <button
              key={date}
              className={`rounded-lg p-2 flex flex-col items-center border transition-all min-h-[60px] ${selectedDate === date ? "bg-blue-200 border-blue-500" : "bg-white border-gray-200 hover:bg-blue-50"}`}
                onClick={() => { setModalDate(date); setShowTaskListModal(true); setSelectedDate(date); }}
            >
              <span className="font-semibold">{Number(date.slice(-2))}</span>
              <div className="flex flex-col gap-1 mt-1 w-full">
                {dayTasks.map((t: any) => (
                  <div key={t.id} className="flex items-center text-xs w-full">
                    <span className="inline-block w-10 text-left text-gray-400">{t.start_time || '-'}</span>
                    <span className={`ml-1 truncate font-medium ${statusColor[t.status] || 'text-gray-400'}`}>{t.title}</span>
                  </div>
                ))}
              </div>
            </button>
          );
        })}
      </div>
    </div>
      {showTaskListModal && (
        <TaskListModal
          date={modalDate}
          tasks={tasks.filter((t: any) => t.date === modalDate)}
          onClose={() => setShowTaskListModal(false)}
          onAddTask={() => { setShowAddTaskModal(true); }}
        />
      )}
      {showAddTaskModal && (
        <AddTaskModal
          onClose={() => setShowAddTaskModal(false)}
          onSubmit={(task: any) => { onAddTask(task); setShowAddTaskModal(false); }}
          date={modalDate}
        />
      )}
    </>
  );
}

function WeekView({ tasks, selectedDate, setSelectedDate }: any) {
  const dateObj = new Date(selectedDate);
  const dayIdx = (dateObj.getDay() + 6) % 7;
  const monday = new Date(dateObj);
  monday.setDate(dateObj.getDate() - dayIdx);
  const weekDates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d.toISOString().slice(0, 10);
  });
  const statusColor: Record<string, string> = {
    '00': 'text-gray-500', '10': 'text-blue-500', '20': 'text-orange-500', '50': 'text-green-600', '51': 'text-yellow-500', '52': 'text-teal-500', '53': 'text-purple-500', '54': 'text-pink-500',
  };
  return (
    <div className="rounded-xl bg-gradient-to-br from-blue-50 to-purple-50 p-6 shadow overflow-x-auto">
      <div className="flex min-w-[1540px]">
        {weekDays.map((d, i) => (
          <div key={d} className="text-center font-semibold text-gray-500 flex-1 min-w-[220px]">
            {d}<br /><span className="text-xs">{weekDates[i].slice(-2)}</span>
          </div>
        ))}
      </div>
      <div className="flex gap-2 min-w-[1540px]">
        {weekDates.map((date, i) => {
          const dayTasks = tasks.filter((t: any) => t.date === date);
          return (
            <div key={date} className="flex-1 min-w-[220px] bg-white rounded-lg shadow p-2 flex flex-col gap-2">
              {dayTasks.length === 0 ? <div className="text-xs text-gray-300 text-center">No tasks</div> :
                dayTasks.map((t: any) => (
                  <div key={t.id} className="flex items-start text-xs w-full break-words whitespace-pre-line">
                    <span className="inline-block w-10 text-left text-gray-400 flex-shrink-0">{t.start_time || '-'}</span>
                    <span className={`ml-1 truncate font-medium break-words whitespace-pre-line ${statusColor[t.status] || 'text-gray-400'}`}>{t.title}</span>
                  </div>
                ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function DayView({ tasks, selectedDate, setSelectedDate, periodStart, periodEnd, onUpdateTask, onDeleteTask }: any) {
  const dayTasks = tasks.filter((t: any) => t.date === selectedDate);
  const today = new Date().toISOString().slice(0, 10);
  const canEdit = selectedDate <= today;
  const statusColor: Record<string, string> = {
    '00': 'text-gray-500', '10': 'text-blue-500', '20': 'text-orange-500', '50': 'text-green-600', '51': 'text-yellow-500', '52': 'text-teal-500', '53': 'text-purple-500', '54': 'text-pink-500',
  };
  const statusOptions = [
    { value: '00', label: 'Create' },
    { value: '10', label: 'Ongoing' },
    { value: '20', label: 'Unfinished' },
    { value: '50', label: 'Fully complete' },
    { value: '51', label: 'A few complete' },
    { value: '52', label: 'Mostly complete' },
    { value: '53', label: 'Just partially complete' },
    { value: '54', label: 'Lately complete' },
  ];
  const [editingTask, setEditingTask] = useState<any>(null);
  // 删除相关state和逻辑已移除

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center gap-4 mb-4">
        <div className="text-lg font-bold">Tasks for</div>
        <input
          type="date"
          className="border rounded px-3 py-2"
          value={selectedDate}
          min={periodStart}
          max={periodEnd}
          onChange={e => setSelectedDate(e.target.value)}
        />
      </div>
      {dayTasks.length === 0 ? (
        <div className="text-gray-400">No tasks</div>
      ) : (
        <ul className="space-y-4">
          {dayTasks.map((t: any) => (
            <li key={t.id} className="rounded-xl bg-white shadow p-4 flex flex-col md:flex-row md:items-center gap-2">
              <span className="inline-block w-16 text-left text-gray-400">{t.start_time || '-'}</span>
              <span className={`flex-1 font-medium ${statusColor[t.status] || 'text-gray-400'}`}>{t.title}</span>
              {t.note && <span className="text-xs text-gray-500 ml-2">{t.note}</span>}
              {canEdit && (
                <div className="flex gap-2">
                  <button 
                    className="px-3 py-1 rounded bg-blue-100 text-blue-700 text-sm hover:bg-blue-200"
                    onClick={() => setEditingTask(t)}
                  >
                    Edit
                  </button>
                  {/* 删除按钮已移除 */}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
      {editingTask && (
        <EditTaskModal
          task={editingTask}
          statusOptions={statusOptions}
          onClose={() => setEditingTask(null)}
          onSubmit={async (updatedTask: any) => {
            try {
              const res = await apiClient.post('/spwapi/student/auth/planner/task/update', {
                id: updatedTask.id,
                status: updatedTask.status,
                note: updatedTask.note || ''
              }) as any;
              if (res && res.code === 0) {
                toast.success('Task updated successfully');
                onUpdateTask(updatedTask);
                setEditingTask(null);
              } else {
                toast.error(res?.msg || 'Failed to update task');
              }
            } catch (e: any) {
              toast.error(e?.message || 'Failed to update task');
            }
          }}
          loading={false}
        />
      )}
      {/* 删除确认弹窗已移除 */}
    </div>
  );
}

function EditTaskModal({ task, statusOptions, onClose, onSubmit, loading }: any) {
  const [status, setStatus] = useState(task.status || '00');
  const [note, setNote] = useState(task.note || '');
  const [error, setError] = useState("");
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      await onSubmit({ ...task, status, note });
    } catch (err: any) {
      setError(err.message || 'Failed to update task');
    }
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
      <form className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-lg relative" onSubmit={handleSubmit}>
        <button type="button" className="absolute top-3 right-3 text-gray-400 hover:text-gray-700 text-2xl" onClick={onClose} disabled={loading}>&times;</button>
        <h2 className="text-2xl font-bold mb-4 text-blue-700">Edit Task</h2>
        {error && <div className="mb-2 text-red-500 text-sm">{error}</div>}
        <div className="mb-4">
          <div className="text-lg font-semibold text-gray-800">{task.title}</div>
          <div className="text-sm text-gray-500">{task.date} {task.start_time}</div>
        </div>
        <div className="grid grid-cols-1 gap-4 mb-6">
          <div>
            <label className="block font-semibold mb-1">Status</label>
            <select 
              className="w-full border rounded px-3 py-2" 
              value={status} 
              onChange={e => setStatus(e.target.value)}
              disabled={loading}
            >
              {statusOptions.map((option: any) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block font-semibold mb-1">Note</label>
            <textarea 
              className="w-full border rounded px-3 py-2" 
              value={note} 
              onChange={e => setNote(e.target.value)} 
              rows={3} 
              maxLength={200}
              placeholder="Add notes about this task..."
              disabled={loading}
            />
          </div>
        </div>
        <div className="flex justify-end gap-4">
          <button type="button" className="px-4 py-2 rounded bg-gray-200" onClick={onClose} disabled={loading}>
            Cancel
          </button>
          <button type="submit" className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700" disabled={loading}>
            {loading ? 'Updating...' : 'Update'}
          </button>
        </div>
      </form>
    </div>
  );
}

function StatsPanel({ stats, loading }: any) {
  if (loading) {
    return (
      <div className="rounded-xl bg-gradient-to-r from-green-100 to-blue-100 p-6 flex items-center gap-8">
        <div className="text-gray-400">Loading statistics...</div>
      </div>
    );
  }
  if (!stats) {
    return (
      <div className="rounded-xl bg-gradient-to-r from-green-100 to-blue-100 p-6 flex items-center gap-8">
        <div className="text-gray-400">No statistics available</div>
      </div>
    );
  }
  const {
    Create = 0,
    Ongoing = 0,
    Unfinished = 0,
    FullyComplete = 0,
    FewComplete = 0,
    MostlyComplete = 0,
    PartiallyComplete = 0,
    LatelyComplete = 0
  } = stats;
  const total = Create + Ongoing + Unfinished + FullyComplete + FewComplete + MostlyComplete + PartiallyComplete + LatelyComplete;
  const completion = total > 0 ? ((FullyComplete + FewComplete + MostlyComplete + PartiallyComplete + LatelyComplete) / total * 100).toFixed(0) : "0";
  return (
    <div className="rounded-xl bg-gradient-to-r from-green-100 to-blue-100 p-6 flex items-center gap-8 flex-wrap">
      <div>
        <div className="text-2xl font-bold">{total}</div>
        <div className="text-gray-500">Total tasks this period</div>
      </div>
      <div>
        <div className="text-2xl font-bold">{Create}</div>
        <div className="text-gray-500">Created (Not started)</div>
      </div>
      <div>
        <div className="text-2xl font-bold">{Ongoing}</div>
        <div className="text-gray-500">Ongoing</div>
      </div>
      <div>
        <div className="text-2xl font-bold">{Unfinished}</div>
        <div className="text-gray-500">Unfinished</div>
      </div>
      <div>
        <div className="text-2xl font-bold">{FullyComplete}</div>
        <div className="text-gray-500">Fully complete</div>
      </div>
      <div>
        <div className="text-2xl font-bold">{FewComplete}</div>
        <div className="text-gray-500">A few complete</div>
      </div>
      <div>
        <div className="text-2xl font-bold">{MostlyComplete}</div>
        <div className="text-gray-500">Mostly complete</div>
      </div>
      <div>
        <div className="text-2xl font-bold">{PartiallyComplete}</div>
        <div className="text-gray-500">Partially complete</div>
      </div>
      <div>
        <div className="text-2xl font-bold">{LatelyComplete}</div>
        <div className="text-gray-500">Lately complete</div>
      </div>
      <div className="ml-auto text-green-700 font-bold text-lg">{total > 0 ? `Completion rate ${completion}%` : ""}</div>
    </div>
  );
}

function TaskListModal({ date, tasks, onClose, onAddTask }: { date: string, tasks: any[], onClose: () => void, onAddTask: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-lg relative">
        <button type="button" className="absolute top-3 right-3 text-gray-400 hover:text-gray-700 text-2xl" onClick={onClose}>&times;</button>
        <h2 className="text-2xl font-bold mb-4 text-blue-700">Tasks for {date}</h2>
        {tasks.length === 0 ? (
          <div className="text-gray-400 mb-4">No tasks for this day.</div>
        ) : (
          <ul className="space-y-2 mb-4">
            {tasks.map((t: any) => (
              <li key={t.id} className="rounded bg-blue-50 px-4 py-2 flex flex-col">
                <span className="text-sm text-gray-500">{t.start_time || '-'} {t.end_time ? `~ ${t.end_time}` : ''}</span>
                <span className="font-medium text-gray-800 break-words whitespace-pre-line">{t.title}</span>
                {t.note && <span className="text-xs text-gray-500 mt-1">{t.note}</span>}
              </li>
            ))}
          </ul>
        )}
        <div className="flex justify-end gap-4 mt-6">
          <button type="button" className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700" onClick={onAddTask}>+ Add Task</button>
        </div>
      </div>
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

function AddStageGoalModal({ onClose, onSubmit }: { onClose: () => void, onSubmit: (goal: any) => void }) {
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
        res = await apiClient.post('/spwapi/student/auth/planner/add', payload) as any;
        if (res && (res as any).code !== 0) throw new Error((res as any).msg || 'Failed');
      } else {
        res = await fetch('/planner/add', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error('Failed');
      }
      onSubmit({ title, description, goal, start_date: formatDate(startDate), end_date: formatDate(endDate) });
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