"use client";
import React, { useState, useEffect } from "react";
import ProfileLayout from '../ProfileLayout';
import { useRef } from "react";
import { apiClient } from '../../utils/api';
import * as yup from 'yup';
import ConfirmModal from '../../components/ConfirmModal';
import { toast } from 'react-toastify';
import { FaUser, FaLink } from 'react-icons/fa';

// 课程选项如需后续对接接口再补充
const courseOptions: any[] = [];
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

interface StageGoal {
  id: number;
  title: string;
  description: string;
  goal: string;
  startDate: string;
  endDate: string;
  student_id?: string | number;
  student_name?: string;
}

// 执行人类型：自己或member
type Executor = { id: string; name: string };

export default function StudyPlannerPage() {
  const [members, setMembers] = useState<Executor[]>([]);
  const [executorId, setExecutorId] = useState<string>('0');
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
  // 绑定学生弹窗相关状态
  const [bindModalOpen, setBindModalOpen] = useState(false);
  const [bindPlanId, setBindPlanId] = useState<number | null>(null);
  const [bindLoading, setBindLoading] = useState(false);
  const [bindSelected, setBindSelected] = useState<string>('');
  const [confirmOpen, setConfirmOpen] = useState(false);
  // 在StudyPlannerPage组件内，state增加删除相关
  const [deleteStageId, setDeleteStageId] = useState<number | null>(null);
  const [deleteStageLoading, setDeleteStageLoading] = useState(false);

  // 拉取成员列表
  useEffect(() => {
    apiClient.post('/spwapi/auth/profile/member/list').then((res: any) => {
      if (res && res.code === 0 && Array.isArray(res.data)) {
        setMembers(res.data.map((m: any) => ({ id: String(m.id), name: m.name })));
      }
    });
  }, []);

  // 只显示当前阶段目标下的任务
  const filteredTasks = tasks.filter(t => t.stageGoalId === currentStageGoalId);
  const currentStageGoal = stageGoals.find(g => g.id === currentStageGoalId) || null;

  // useEffect等其它逻辑必须在currentStageGoal声明之后

  // 拉取阶段目标和任务
  useEffect(() => {
    let ignore = false;
    setLoading(true);
    // 拉取当前执行人的学习计划
    let url = '/spwapi/auth/planner/pull';
    if (executorId !== '0') {
      url += `?student_id=${executorId}`;
    }
    apiClient.get(url).then((res: any) => {
      if (ignore) return;
      if (res && res.code === 0 && Array.isArray(res.data) && res.data.length > 0) {
        // 字段名转换
        const goals = res.data.map((g: any) => ({
          ...g,
          startDate: g.start_date,
          endDate: g.end_date,
        }));
        setStageGoals(goals);
        setCurrentStageGoalId(goals[0].id);
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
        // 默认选中周期内的今天或startDate
        const today = new Date().toISOString().slice(0, 10);
        if (today >= goals[0].startDate && today <= goals[0].endDate) {
          setSelectedDate(today);
        } else {
          setSelectedDate(goals[0].startDate);
        }
        // 拉取统计数据
        fetchStats(goals[0].id);
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
  }, [executorId]);

  // 拉取统计数据
  const fetchStats = async (overviewId: number) => {
    if (!overviewId) return;
    setStatsLoading(true);
    try {
      const res = await apiClient.get(`/spwapi/auth/planner/stat?overview_id=${overviewId}`) as any;
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

  // 切换阶段目标时拉取统计数据
  useEffect(() => {
    if (currentStageGoalId) {
      fetchStats(currentStageGoalId);
    }
  }, [currentStageGoalId]);

  // 切换到Day视图时，selectedDate自动设为周期内的今天或startDate
  useEffect(() => {
    if (view === 'day' && currentStageGoal) {
      const today = new Date().toISOString().slice(0, 10);
      if (today >= currentStageGoal.startDate && today <= currentStageGoal.endDate) {
        setSelectedDate(today);
      } else {
        setSelectedDate(currentStageGoal.startDate);
      }
    }
  }, [view, currentStageGoal]);

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

  // 加载中
  if (loading) {
    return (
      <ProfileLayout>
        <div className="flex items-center justify-center min-h-[60vh] text-blue-600 text-xl font-bold">Loading...</div>
      </ProfileLayout>
    );
  }

  // 页面主渲染区域，Executor选择卡片始终在顶部
  return (
    <ProfileLayout>
      <div className="max-w-5xl mx-auto mt-6 min-h-[70vh]">
        {/* Executor选择区域：独立卡片，始终顶部固定 */}
        <div className="bg-white/90 rounded-2xl shadow p-5 mb-6 flex flex-col gap-2 sticky top-0 z-20">
          <div className="flex items-center gap-3 mb-2">
            <span className="font-bold text-lg text-blue-700 flex items-center"><FaUser className="mr-1" /> Executor:</span>
          </div>
          <div className="flex flex-wrap gap-3">
            <label className={`cursor-pointer px-4 py-2 rounded-xl border-2 transition-all font-semibold flex items-center gap-2 shadow-sm ${executorId === '0' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-blue-700 border-blue-200 hover:border-blue-400'}`}
              style={{minWidth: 80}}
            >
              <input type="radio" className="hidden" value="0" checked={executorId === '0'} onChange={() => setExecutorId('0')} />
              <FaUser className="w-4 h-4" /> All
            </label>
            {members.map(m => (
              <label key={m.id} className={`cursor-pointer px-4 py-2 rounded-xl border-2 transition-all font-semibold flex items-center gap-2 shadow-sm ${executorId === String(m.id) ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-blue-700 border-blue-200 hover:border-blue-400'}`}
                style={{minWidth: 80}}
              >
                <input type="radio" className="hidden" value={m.id} checked={executorId === String(m.id)} onChange={() => setExecutorId(String(m.id))} />
                <FaUser className="w-4 h-4" /> {m.name}
              </label>
            ))}
          </div>
        </div>
        {/* 阶段目标区域或无计划提示 */}
        {stageGoals.length === 0 ? (
          <div className="max-w-xl mx-auto mt-24 bg-white/90 rounded-3xl shadow-xl p-8 flex flex-col items-center">
            <h2 className="text-2xl font-bold mb-4 text-blue-700">No Study Plan Found</h2>
            <div className="text-gray-600 mb-6 text-center">You have not created any study plan yet.<br/>Click the button below to create your first stage goal and start your learning journey!</div>
            <button className="px-6 py-3 rounded-full bg-blue-600 text-white font-bold text-lg shadow hover:bg-blue-700 transition" onClick={() => setShowAddStage(true)}>+ Create Stage Goal</button>
            {showAddStage && <AddStageGoalModal onClose={() => setShowAddStage(false)} onSubmit={handleAddStageGoal} />}
          </div>
        ) : (
          // ...原有有计划时的内容...
          <>
            {/* 阶段目标切换与展示区域：独立卡片 */}
            <div className="bg-white/80 rounded-2xl shadow-xl p-6 mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg text-blue-700">Stage Goal:</span>
                <select className="border rounded px-3 py-2" value={currentStageGoalId ?? ''} onChange={e => setCurrentStageGoalId(Number(e.target.value))}>
                  {stageGoals.map(g => <option key={g.id} value={g.id}>{g.title}</option>)}
                </select>
                <button className="ml-2 px-3 py-1 rounded bg-blue-100 text-blue-700 font-semibold hover:bg-blue-200" onClick={() => setShowAddStage(true)}>+ New</button>
              </div>
              {currentStageGoal && (
                <div className="bg-blue-50 rounded-xl px-4 py-2 text-sm text-gray-700 max-w-xl flex items-center gap-4">
                  <div>
                    <div><b>Theme:</b> {currentStageGoal.title}</div>
                    <div><b>Description:</b> {currentStageGoal.description}</div>
                    <div><b>Goal:</b> {currentStageGoal.goal}</div>
                    <div><b>Period:</b> {currentStageGoal.startDate} ~ {currentStageGoal.endDate}</div>
                    {/* Executor信息展示保持原样 */}
                    <div className="flex items-center gap-2 mt-2">
                      <b>Executor:</b>
                      {currentStageGoal.student_id && members.length > 0 ? (
                        (() => {
                          const stu = members.find(m => String(m.id) === String(currentStageGoal.student_id));
                          if (stu) {
                            return (
                              <span className="inline-flex items-center px-3 py-1 rounded-full bg-green-100 text-green-700 font-bold text-base shadow-sm gap-2">
                                <FaUser className="w-4 h-4 text-green-500" />
                                {stu.name}
                                <span className="ml-2 px-2 py-0.5 rounded bg-green-500 text-white text-xs font-bold">Bound</span>
                              </span>
                            );
                          }
                          return <span className="text-red-500 font-bold">Unknown</span>;
                        })()
                      ) : (
                        <span className="inline-flex items-center px-3 py-1 rounded-full bg-gray-100 text-gray-400 font-bold text-base shadow-sm gap-2">
                          <FaUser className="w-4 h-4" />
                          Not bound
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 ml-auto">
                  <button
                      className="px-3 py-1.5 bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold rounded shadow flex items-center gap-1 text-sm hover:scale-105 transition"
                    onClick={() => {
                      setBindPlanId(currentStageGoal.id);
                      setBindSelected(currentStageGoal.student_id ? String(currentStageGoal.student_id) : '');
                      setBindModalOpen(true);
                    }}
                  >
                    <FaLink className="mr-1 w-4 h-4" /> Bind Student
                  </button>
                    <button
                      className="px-3 py-1.5 bg-gradient-to-r from-red-500 to-pink-500 text-white font-semibold rounded shadow flex items-center gap-1 text-sm hover:scale-105 transition"
                      onClick={() => setDeleteStageId(currentStageGoal.id)}
                    >
                      Delete Stage
                    </button>
                  </div>
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
                  onAddTask={(date: string) => setAddTaskDate(date)}
                  periodStart={currentStageGoal.startDate}
                  periodEnd={currentStageGoal.endDate}
                />
              )}
              {view === "week" && <WeekView tasks={filteredTasks} selectedDate={selectedDate} setSelectedDate={setSelectedDate} />}
              {view === "day" && (
                <DayView
                  tasks={filteredTasks}
                  selectedDate={selectedDate}
                  setSelectedDate={setSelectedDate}
                  periodStart={currentStageGoal?.startDate}
                  periodEnd={currentStageGoal?.endDate}
                  onUpdateTask={(updatedTask: any) => setTasks(ts => ts.map(t => t.id === updatedTask.id ? updatedTask : t))}
                  onDeleteTask={(id: number) => setTasks(ts => ts.filter(t => t.id !== id))}
                />
              )}
            </div>
            {/* Statistics */}
            <div className="mt-8">
              <StatsPanel stats={stats} loading={statsLoading} />
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
          </>
        )}
      </div>
      {bindModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
          <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md relative">
            <button type="button" className="absolute top-3 right-3 text-gray-400 hover:text-gray-700 text-2xl" onClick={() => setBindModalOpen(false)}>&times;</button>
            <h2 className="text-xl font-bold mb-4 text-blue-700">Bind Student</h2>
            <div className="mb-4">Please select a student to bind to this plan:</div>
            <div className="space-y-2 mb-6">
              {members.length === 0 && <div className="text-gray-400">No students available</div>}
              {members.map(m => (
                <label key={m.id} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="bind-student"
                    value={m.id}
                    checked={bindSelected === m.id}
                    onChange={() => setBindSelected(m.id)}
                    className="accent-blue-600"
                  />
                  <span>{m.name}</span>
                </label>
              ))}
            </div>
            <div className="flex justify-end gap-4">
              <button className="px-4 py-2 rounded bg-gray-200" onClick={() => setBindModalOpen(false)} disabled={bindLoading}>Cancel</button>
              <button
                className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
                disabled={bindLoading || !bindSelected}
                onClick={() => setConfirmOpen(true)}
              >{bindLoading ? 'Binding...' : 'Confirm'}</button>
            </div>
          </div>
        </div>
      )}
      {/* 带样式的确认弹窗 */}
      <ConfirmModal
        isOpen={confirmOpen}
        title="Bind Student"
        content={`Are you sure you want to bind this plan to the selected student?`}
        confirmText="Bind"
        cancelText="Cancel"
        loading={bindLoading}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={async () => {
          if (!bindPlanId || !bindSelected) return;
          setBindLoading(true);
          try {
            // GET接口，参数overview_id, student_id
            const res = await apiClient.get(`/spwapi/auth/planner/bind?overview_id=${bindPlanId}&student_id=${bindSelected}`) as { code?: number; msg?: string };
            if (res && res.code === 0) {
              toast.success('Student bound successfully');
              setBindModalOpen(false);
              setConfirmOpen(false);
              // 重新拉取计划数据
              let url = '/spwapi/auth/planner/pull';
              if (executorId !== '0') url += `?student_id=${executorId}`;
              const newRes = await apiClient.get(url) as { code?: number; data?: any[] };
              if (newRes && newRes.code === 0 && Array.isArray(newRes.data)) {
                setStageGoals(newRes.data.map((g: any) => ({ ...g, startDate: g.start_date, endDate: g.end_date })));
              }
            } else {
              toast.error(res?.msg || 'Failed to bind student');
            }
          } catch (e: any) {
            toast.error(e?.message || 'Failed to bind student');
          } finally {
            setBindLoading(false);
          }
        }}
      />
      {/* 阶段删除确认弹窗 */}
      <ConfirmModal
        isOpen={!!deleteStageId}
        title="Delete Stage Goal"
        content="Are you sure you want to delete this stage goal? All related tasks will also be deleted. This action cannot be undone."
        confirmText={deleteStageLoading ? 'Deleting...' : 'Delete'}
        cancelText="Cancel"
        loading={deleteStageLoading}
        onCancel={() => setDeleteStageId(null)}
        onConfirm={async () => {
          if (!deleteStageId) return;
          setDeleteStageLoading(true);
          try {
            const res = await apiClient.get(`/spwapi/auth/planner/delete?overview_id=${deleteStageId}`) as any;
            if (res && res.code === 0) {
              toast.success('Stage goal deleted successfully');
              // 删除后刷新列表
              let url = '/spwapi/auth/planner/pull';
              if (executorId !== '0') url += `?student_id=${executorId}`;
              const newRes = await apiClient.get(url) as { code?: number; data?: any[] };
              if (newRes && newRes.code === 0 && Array.isArray(newRes.data)) {
                setStageGoals(newRes.data.map((g: any) => ({ ...g, startDate: g.start_date, endDate: g.end_date })));
                setCurrentStageGoalId(newRes.data.length > 0 ? newRes.data[0].id : null);
              }
              setDeleteStageId(null);
            } else {
              toast.error(res?.msg || 'Failed to delete stage goal');
            }
          } catch (e: any) {
            toast.error(e?.message || 'Failed to delete stage goal');
          } finally {
            setDeleteStageLoading(false);
          }
        }}
      />
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
  // 任务状态颜色映射
  const statusColor: Record<string, string> = {
    '00': 'text-gray-500', // create
    '10': 'text-blue-500', // ongoing
    '20': 'text-orange-500', // unfinished
    '50': 'text-green-600', // fully complete
    '51': 'text-yellow-500', // a few complete
    '52': 'text-teal-500', // mostly complete
    '53': 'text-purple-500', // just partially complete
    '54': 'text-pink-500', // lately complete
  };
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
  // 任务状态颜色映射
  const statusColor: Record<string, string> = {
    '00': 'text-gray-500', '10': 'text-blue-500', '20': 'text-orange-500', '50': 'text-green-600', '51': 'text-yellow-500', '52': 'text-teal-500', '53': 'text-purple-500', '54': 'text-pink-500',
  };
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
                  <div key={t.id} className="flex items-center text-xs w-full">
                    <span className="inline-block w-10 text-left text-gray-400">{t.start_time || '-'}</span>
                    <span className={`ml-1 truncate font-medium ${statusColor[t.status] || 'text-gray-400'}`}>{t.title}</span>
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
  const canEdit = selectedDate <= today; // 今天及以前的任务可以编辑
  
  // 任务状态颜色映射
  const statusColor: Record<string, string> = {
    '00': 'text-gray-500', '10': 'text-blue-500', '20': 'text-orange-500', '50': 'text-green-600', '51': 'text-yellow-500', '52': 'text-teal-500', '53': 'text-purple-500', '54': 'text-pink-500',
  };
  
  // 状态选项
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
  const [deletingTask, setDeletingTask] = useState<any>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [editLoading, setEditLoading] = useState(false);

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
                  <button 
                    className="px-3 py-1 rounded bg-red-100 text-red-700 text-sm hover:bg-red-200"
                    onClick={() => setDeletingTask(t)}
                  >
                    Delete
                  </button>
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
            setEditLoading(true);
            try {
              // 调用后端接口
              const res = await apiClient.post('/spwapi/auth/planner/task/update', {
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
            } finally {
              setEditLoading(false);
            }
          }}
          loading={editLoading}
        />
      )}
      {/* 删除确认弹窗 */}
      <ConfirmModal
        isOpen={!!deletingTask}
        title="Delete Task"
        content="Are you sure you want to delete this task? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        loading={deleteLoading}
        onCancel={() => setDeletingTask(null)}
        onConfirm={async () => {
          if (!deletingTask) return;
          setDeleteLoading(true);
          try {
            const res = await apiClient.get(`/spwapi/auth/planner/task/delete?id=${deletingTask.id}`) as any;
            if (res && res.code === 0) {
              toast.success('Task deleted successfully');
              onDeleteTask(deletingTask.id);
              setDeletingTask(null);
            } else {
              toast.error(res?.msg || 'Failed to delete task');
            }
          } catch (e: any) {
            toast.error(e?.message || 'Failed to delete task');
          } finally {
            setDeleteLoading(false);
          }
        }}
      />
    </div>
  );
}

// 新增编辑任务弹窗组件
function EditTaskModal({ task, statusOptions, onClose, onSubmit, loading }: any) {
  const [status, setStatus] = useState(task.status || '00');
  const [note, setNote] = useState(task.note || '');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await onSubmit({
        ...task,
        status,
        note
      });
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

function nextStatus(status: string) {
  // 按照产品需求顺序循环
  const order = ["not_started", "reserved", "done", "partial", "little", "not_done"];
  const idx = order.indexOf(status);
  return order[(idx + 1) % order.length];
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
  // 新的后端返回字段
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