'use client';
import React, { useEffect, useState } from 'react';
import { apiClient } from '../../utils/api';
import { toast } from 'react-toastify';
import ConfirmModal from '../../components/ConfirmModal';
import { useRouter } from 'next/navigation';

interface CourseTimeItem {
  id: number;
  booking_no: string;
  lesson_date: string;
  start_time: string;
  end_time: string;
  status: string;
  teacher_name: string;
  course_name: string;
  student_name: string; // 假设后台也返回了学生姓名
  teacher_id: number; // 新增
  course_id: number; // 新增
  uc_id: number; // 新增
}

interface LeaveModalState {
  visible: boolean;
  courseId?: number;
  bookId?: number;
  teacherId?: number;
  date?: string;
  time?: string;
  note?: string;
  courseIdForApi?: number; // 新增，避免和上面courseId混淆
}

interface AvailableSlot {
  LessonDate: string;
  StartTime: string;
  EndTime: string;
  Enable: boolean;
}

const PAGE_SIZE = 10;

export default function TimetableListView() {
  const [data, setData] = useState<CourseTimeItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1, total: 0 });
  const [leaveModal, setLeaveModal] = useState<LeaveModalState>({ visible: false });
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [leaveLoading, setLeaveLoading] = useState(false);
  const [availableSlots, setAvailableSlots] = useState<AvailableSlot[]>([]);
  const [slotLoading, setSlotLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'all' | '000' | '100'>('all');
  const router = useRouter();

  // 状态码映射
  const statusMap: Record<string, string> = {
    '000': 'Normal',
    '100': 'Pending Leave',
    // 可根据实际补充
  };

  // 拉取主数据
  useEffect(() => {
    const fetchData = async (page: number) => {
      setLoading(true);
      try {
        const params: any = { pn: page, ps: PAGE_SIZE };
        if (statusFilter !== 'all') params.status = statusFilter;
        const res = await apiClient.get('/spwapi/auth/course/time/list', params);
        
        if (res && res.code === 0 && res.data) {
          setData(res.data.list || []);
          setPagination({
            currentPage: res.data.pn || page,
            totalPages: res.data.total_pages || 1,
            total: res.data.total || 0,
          });
        } else {
          setData([]);
          toast.error(res?.msg || 'Failed to fetch timetable');
        }
      } catch (e: any) {
        setData([]);
        toast.error(e?.message || 'Failed to fetch timetable');
      } finally {
        setLoading(false);
      }
    };
    fetchData(pagination.currentPage);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination.currentPage, statusFilter]);

  // 拉取可用时间段
  const fetchAvailableSlots = async (teacherId: number, date: string, courseId?: number) => {
    setSlotLoading(true);
    try {
      const res = await apiClient.get('/spwapi/auth/teacher/available/fetch', {
        teacher_id: teacherId,
        select_date: date,
        course_id: courseId,
      }) as any;
      if (res && res.code === 0 && Array.isArray(res.data)) {
        //setAvailableSlots(res.data.filter((s: AvailableSlot) => s.Enable));
        setAvailableSlots(res.data);
      } else {
        setAvailableSlots([]);
      }
    } catch {
      setAvailableSlots([]);
    } finally {
      setSlotLoading(false);
    }
  };

  // 日期选择时自动拉取可用时间段
  const handleDateChange = (date: string) => {
    setLeaveModal(m => ({ ...m, date, time: '' }));
    setAvailableSlots([]);
    if (leaveModal.teacherId && date) {
      fetchAvailableSlots(leaveModal.teacherId, date, leaveModal.courseIdForApi);
    }
  };

  const handlePageChange = (page: number) => {
    if (page < 1 || page > pagination.totalPages || page === pagination.currentPage) return;
    setPagination(p => ({ ...p, currentPage: page }));
  };

  // 关闭请假弹窗
  const closeLeaveModal = () => {
    setLeaveModal({ visible: false });
    setConfirmVisible(false);
  };

  // 打开请假弹窗
  const openLeaveModal = (item: CourseTimeItem) => {
    setLeaveModal({
      visible: true,
      courseId: item.id,
      bookId: item.id, // 新增bookId字段
      teacherId: item.teacher_id, // 新增
      courseIdForApi: item.course_id, // 新增
      date: '',
      time: '',
      note: '',
    });
    setConfirmVisible(false);
  };

  const isLeaveFormValid = leaveModal.date && leaveModal.time;
  const [leaveError, setLeaveError] = useState<string | null>(null);

  // 点击submit弹出确认框
  const handleLeaveSubmit = () => {
    if (!leaveModal.date || !leaveModal.time) {
      setLeaveError('Date and time are required.');
      return;
    }
    setLeaveError(null);
    setConfirmVisible(true);
  };

  // 真正提交到后端
  const handleLeaveConfirm = async () => {
    if (!leaveModal.date || !leaveModal.time || !leaveModal.bookId) {
      toast.error('Please fill in all required fields.');
      return;
    }
    setLeaveLoading(true);
    try {
      const [new_start_time, new_end_time] = leaveModal.time.split('-');
      const payload = {
        note: leaveModal.note || '',
        new_date: leaveModal.date,
        new_start_time: new_start_time.trim(),
        new_end_time: new_end_time ? new_end_time.trim() : undefined,
        book_id: leaveModal.bookId,
      };
      const res = await apiClient.post('/spwapi/auth/course/time/requestLeave', payload) as any;
      if (res && res.code === 0) {
        toast.success('Request submitted successfully!');
        closeLeaveModal();
      } else {
        toast.error(res?.msg || 'Request failed');
      }
    } catch (e: any) {
      toast.error(e?.message || 'Request failed');
    } finally {
      setLeaveLoading(false);
    }
  };

  // 状态筛选按钮
  const statusTabs = [
    { key: 'all', label: 'All' },
    { key: '000', label: 'Normal' },
    { key: '100', label: 'Requesting Leave' },
  ];

  return (
    <div className="bg-white rounded-xl shadow-md p-8 mb-6">
      <h3 className="text-xl font-bold mb-4">Timetable (List View)</h3>
      {loading ? (
        <div className="text-center py-10">Loading...</div>
      ) : (
        <>
          {/* 状态筛选Tab */}
          <div className="flex gap-4 mb-4">
            {statusTabs.map(tab => (
              <button
                key={tab.key}
                className={`px-3 py-1 rounded ${statusFilter === tab.key ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}
                onClick={() => setStatusFilter(tab.key as 'all' | '000' | '100')}
              >
                {tab.label}
              </button>
            ))}
          </div>
          {/* 请假弹窗 */}
          {leaveModal.visible && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
              <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-lg relative">
                <h4 className="text-2xl font-bold mb-6">Request Leave</h4>
                <div className="mb-5">
                  <label className="block text-base mb-2 font-semibold">New Date<span className="text-red-500">*</span></label>
                  <input
                    type="date"
                    className="w-full border rounded px-3 py-2 text-base"
                    value={leaveModal.date || ''}
                    onChange={e => handleDateChange(e.target.value)}
                  />
                </div>
                <div className="mb-5">
                  <label className="block text-base mb-2 font-semibold">New Time<span className="text-red-500">*</span></label>
                  {slotLoading ? (
                    <div className="text-gray-400 py-4 text-center">Loading...</div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                      {availableSlots.length === 0 && (
                        <div className="col-span-full text-gray-400 text-center">No available slots</div>
                      )}
                      {availableSlots.map((slot, idx) => {
                        const value = slot.StartTime + '-' + slot.EndTime;
                        const selected = leaveModal.time === value;
                        const start = slot.StartTime.slice(0,5);
                        const end = slot.EndTime.slice(0,5);
                        if (slot.Enable) {
                          return (
                            <button
                              key={idx}
                              type="button"
                              className={`w-full px-2 py-1 rounded-lg border text-sm font-medium transition flex justify-center items-center
                                ${selected ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-800 border-blue-300 hover:bg-blue-50 hover:border-blue-400'}
                              `}
                              onClick={() => setLeaveModal(m => ({ ...m, time: value }))}
                              style={{whiteSpace: 'nowrap'}}
                            >
                              {start} - {end}
                            </button>
                          );
                        } else {
                          return (
                            <div
                              key={idx}
                              className="w-full px-2 py-1 rounded-lg border border-gray-200 bg-gray-100 text-gray-400 text-sm font-medium flex justify-center items-center line-through cursor-not-allowed select-none opacity-60"
                              style={{ pointerEvents: 'none', whiteSpace: 'nowrap' }}
                            >
                              {start} - {end}
                            </div>
                          );
                        }
                      })}
                    </div>
                  )}
                </div>
                <div className="mb-5">
                  <label className="block text-base mb-2 font-semibold">Note</label>
                  <textarea
                    className="w-full border rounded px-3 py-2 text-base"
                    rows={2}
                    value={leaveModal.note || ''}
                    onChange={e => setLeaveModal(m => ({ ...m, note: e.target.value }))}
                    placeholder="Enter your note (optional)"
                  />
                </div>
                {leaveError && <div className="text-xs text-red-500 mb-2">{leaveError}</div>}
                <div className="flex justify-end gap-3 mt-6">
                  <button
                    className="px-4 py-2 text-base rounded border border-gray-300 hover:bg-gray-100"
                    onClick={closeLeaveModal}
                    disabled={leaveLoading}
                  >Cancel</button>
                  <button
                    className="px-4 py-2 text-base rounded border border-yellow-400 text-yellow-600 hover:bg-yellow-50 disabled:opacity-50"
                    onClick={handleLeaveSubmit}
                    disabled={!isLeaveFormValid || leaveLoading}
                  >Submit</button>
                </div>
                {/* 系统统一风格确认弹窗 */}
                <ConfirmModal
                  isOpen={confirmVisible}
                  title="Confirm Leave Request"
                  content="Are you sure to submit this leave request?"
                  confirmText={leaveLoading ? 'Submitting...' : 'Confirm'}
                  cancelText="Cancel"
                  onCancel={() => setConfirmVisible(false)}
                  onConfirm={handleLeaveConfirm}
                  loading={leaveLoading}
                />
              </div>
            </div>
          )}
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-100">
                {/* <th className="py-2 px-4">Booking No</th> */}
                <th className="py-2 px-4">Course</th>
                <th className="py-2 px-4">Student</th>
                <th className="py-2 px-4">Teacher</th>
                <th className="py-2 px-4">Date</th>
                <th className="py-2 px-4">Time</th>
                <th className="py-2 px-4">Status</th>
                <th className="py-2 px-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-gray-500">No data</td>
                </tr>
              ) : (
                data.map(item => {
                  // 判断是否为今天及以后的课程
                  const isTodayOrFuture = (() => {
                    const today = new Date();
                    today.setHours(0,0,0,0);
                    const lessonDate = new Date(item.lesson_date);
                    lessonDate.setHours(0,0,0,0);
                    return lessonDate >= today;
                  })();
                  const isRequesting = item.status === '100';
                  return (
                    <tr key={item.id} className={isRequesting ? 'bg-yellow-50 border-l-4 border-yellow-400' : ''}>
                      {/* <td className="py-2 px-4">{item.booking_no}</td> */}
                      <td className="py-2 px-4">{item.course_name}</td>
                      <td className="py-2 px-4">{item.student_name}</td>
                      <td className="py-2 px-4">{item.teacher_name}</td>
                      <td className="py-2 px-4">{item.lesson_date?.slice(0, 10)}</td>
                      <td className="py-2 px-4">{item.start_time?.slice(0, 5)} - {item.end_time?.slice(0, 5)}</td>
                      <td className="py-2 px-4">{statusMap[item.status] || item.status}</td>
                      <td className="py-2 px-4">
                        <div className="flex flex-row gap-1 items-center">
                          <button
                            className="px-2 py-0.5 border border-green-400 text-green-500 rounded-md text-xs font-normal hover:bg-green-50 transition-colors whitespace-nowrap"
                            onClick={() => window.open(`/timetable/meeting-note/${item.uc_id}?btid=${item.id}`, '_blank')}
                          >
                            Class Notes
                          </button>
                          <button
                            className="px-2 py-0.5 border border-blue-400 text-blue-500 rounded-md text-xs font-normal hover:bg-blue-50 transition-colors whitespace-nowrap"
                            onClick={() => window.open(`/timetable/feedback/${item.uc_id}?btid=${item.id}`, '_blank')}
                          >
                            Feedback
                          </button>
                          {isTodayOrFuture && !isRequesting && (
                            <button
                              className="px-2 py-0.5 border border-yellow-400 text-yellow-500 rounded-md text-xs font-normal hover:bg-yellow-50 transition-colors whitespace-nowrap"
                              onClick={() => openLeaveModal(item)}
                            >Request Leave</button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
          {/* Pagination */}
          <div className="flex justify-center items-center mt-6">
            <button
              onClick={() => handlePageChange(pagination.currentPage - 1)}
              disabled={pagination.currentPage <= 1}
              className="px-3 py-1 mx-1 rounded bg-gray-200 disabled:opacity-50"
            >
              &laquo; Prev
            </button>
            {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map(page => (
              <button
                key={page}
                className={`px-3 py-1 mx-1 rounded ${pagination.currentPage === page ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
                onClick={() => handlePageChange(page)}
              >
                {page}
              </button>
            ))}
            <button
              onClick={() => handlePageChange(pagination.currentPage + 1)}
              disabled={pagination.currentPage >= pagination.totalPages}
              className="px-3 py-1 mx-1 rounded bg-gray-200 disabled:opacity-50"
            >
              Next &raquo;
            </button>
            <span className="ml-4 text-gray-500 text-sm">
              Total {pagination.total} items
            </span>
          </div>
        </>
      )}
    </div>
  );
} 