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

// 新增：请假详情接口
interface LeaveDetail {
  id: number;
  book_id: number;
  pending_date: string;
  pending_start_time: string;
  pending_end_time: string;
  source: number;
  add_time: string;
  status: string;
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
  
  // 新增：右侧详情面板状态
  const [detailPanel, setDetailPanel] = useState<{
    visible: boolean;
    loading: boolean;
    data: LeaveDetail | null;
  }>({
    visible: false,
    loading: false,
    data: null,
  });
  
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

  // 新增：获取请假详情
  const fetchLeaveDetail = async (bookId: number) => {
    setDetailPanel(prev => ({ ...prev, loading: true }));
    try {
      const res = await apiClient.get('/spwapi/auth/course/time/leaveDetail', { book_id: bookId }) as any;
      if (res && res.code === 0 && res.data && Array.isArray(res.data) && res.data.length > 0) {
        setDetailPanel({
          visible: true,
          loading: false,
          data: res.data[0], // 取第一个元素
        });
      } else {
        toast.error(res?.msg || 'No leave details found');
        setDetailPanel(prev => ({ ...prev, loading: false }));
      }
    } catch (e: any) {
      toast.error(e?.message || 'Failed to fetch leave details');
      setDetailPanel(prev => ({ ...prev, loading: false }));
    }
  };

  // 新增：点击Pending Leave行
  const handlePendingLeaveClick = (item: CourseTimeItem) => {
    if (item.status === '100') {
      fetchLeaveDetail(item.id);
    }
  };

  // 新增：关闭详情面板
  const closeDetailPanel = () => {
    setDetailPanel({
      visible: false,
      loading: false,
      data: null,
    });
  };

  // 格式化日期时间
  const formatDateTime = (dateTimeString: string) => {
    try {
      const date = new Date(dateTimeString);
      return date.toLocaleString('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });
    } catch {
      return dateTimeString;
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
    } catch {
      return dateString;
    }
  };

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
    { key: '100', label: 'Pending Leave' },
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
          {/* 提示信息 */}
          {statusFilter === 'all' && data.some(item => item.status === '100') && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center text-blue-800 text-sm">
                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <span>Click on any "Pending Leave" row to view detailed information</span>
              </div>
            </div>
          )}
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
          {/* 详情面板 */}
          {detailPanel.visible && (
            <div className="fixed inset-0 z-50 flex justify-end bg-black bg-opacity-30">
              <div className="bg-white shadow-lg w-full max-w-md h-full overflow-y-auto transform transition-transform duration-300 ease-in-out">
                <div className="p-6 border-b border-gray-200 flex justify-between items-center">
                  <h4 className="text-xl font-bold">Leave Request Details</h4>
                  <button
                    onClick={closeDetailPanel}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <div className="p-6">
                  {detailPanel.loading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                      <span className="ml-2 text-gray-600">Loading...</span>
                    </div>
                  ) : detailPanel.data ? (
                    <div className="space-y-6">
                      {/* 基本信息 */}
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <h5 className="font-semibold text-blue-800 mb-3">Basic Information</h5>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Request ID:</span>
                            <span className="font-medium">#{detailPanel.data.id}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Booking ID:</span>
                            <span className="font-medium">#{detailPanel.data.book_id}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Status:</span>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              detailPanel.data.status === '00' ? 'bg-yellow-100 text-yellow-800' : 
                              detailPanel.data.status === '10' ? 'bg-red-100 text-red-800' : 
                              detailPanel.data.status === '20' ? 'bg-green-100 text-green-800' : 
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {detailPanel.data.status === '00' ? 'Pending Leave' : 
                               detailPanel.data.status === '10' ? 'Leave Rejected' : 
                               detailPanel.data.status === '20' ? 'Leave Confirmed' : 'Unknown'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* 申请时间信息 */}
                      <div className="bg-purple-50 p-4 rounded-lg">
                        <h5 className="font-semibold text-purple-800 mb-3">Request Details</h5>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Request Date:</span>
                            <span className="font-medium">{formatDate(detailPanel.data.add_time)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Request Time:</span>
                            <span className="font-medium">{formatDateTime(detailPanel.data.add_time)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Requester:</span>
                            <span className="font-medium">{detailPanel.data.source === 0 ? 'Student' : 'Teacher'}</span>
                          </div>
                        </div>
                      </div>

                      {/* 新的时间安排 */}
                      <div className="bg-green-50 p-4 rounded-lg">
                        <h5 className="font-semibold text-green-800 mb-3">Proposed Schedule</h5>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Date:</span>
                            <span className="font-medium">{formatDate(detailPanel.data.pending_date)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Time:</span>
                            <span className="font-medium">
                              {detailPanel.data.pending_start_time?.slice(0, 5)} - {detailPanel.data.pending_end_time?.slice(0, 5)}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* 状态信息 */}
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h5 className="font-semibold text-gray-800 mb-3">Leave Status</h5>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Status Code:</span>
                            <span className="font-medium">{detailPanel.data.status}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Status:</span>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              detailPanel.data.status === '00' ? 'bg-yellow-100 text-yellow-800' : 
                              detailPanel.data.status === '10' ? 'bg-red-100 text-red-800' : 
                              detailPanel.data.status === '20' ? 'bg-green-100 text-green-800' : 
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {detailPanel.data.status === '00' ? 'Pending' : 
                               detailPanel.data.status === '10' ? 'Rejected' : 
                               detailPanel.data.status === '20' ? 'Confirmed' : 'Unknown'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <svg className="w-12 h-12 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <p>No leave request details available.</p>
                    </div>
                  )}
                </div>
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
                    <tr 
                      key={item.id} 
                      className={`${isRequesting ? 'bg-yellow-50 border-l-4 border-yellow-400 cursor-pointer hover:bg-yellow-100 transition-all duration-200' : ''} ${!isRequesting ? 'hover:bg-gray-50' : ''}`}
                      onClick={(e) => {
                        // 如果点击的是按钮，不触发行点击
                        if ((e.target as HTMLElement).closest('button')) {
                          return;
                        }
                        // 只有Pending Leave状态的行才能点击
                        if (isRequesting) {
                          handlePendingLeaveClick(item);
                        }
                      }}
                      title={isRequesting ? "Click to view leave request details" : ""}
                    >
                      {/* <td className="py-2 px-4">{item.booking_no}</td> */}
                    <td className="py-2 px-4">{item.course_name}</td>
                    <td className="py-2 px-4">{item.student_name}</td>
                    <td className="py-2 px-4">{item.teacher_name}</td>
                    <td className="py-2 px-4">{item.lesson_date?.slice(0, 10)}</td>
                    <td className="py-2 px-4">{item.start_time?.slice(0, 5)} - {item.end_time?.slice(0, 5)}</td>
                      <td className="py-2 px-4">
                        <div className="flex items-center">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            isRequesting 
                              ? 'bg-yellow-100 text-yellow-800 animate-pulse' 
                              : 'bg-green-100 text-green-800'
                          }`}>
                            {statusMap[item.status] || item.status}
                            {isRequesting && (
                              <svg className="ml-1 w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                              </svg>
                            )}
                          </span>
                          {isRequesting && (
                            <span className="ml-2 text-xs text-gray-500 italic">(Click to view details)</span>
                          )}
                        </div>
                      </td>
                      <td className="py-2 px-4">
                        <div className="flex flex-row gap-1 items-center">
                          <button
                            className="px-2 py-0.5 border border-green-400 text-green-500 rounded-md text-xs font-normal hover:bg-green-50 transition-colors whitespace-nowrap"
                            onClick={(e) => {
                              e.stopPropagation();
                              window.open(`/timetable/meeting-note/${item.uc_id}?btid=${item.id}`, '_blank');
                            }}
                          >
                            Class Notes
                          </button>
                          <button
                            className="px-2 py-0.5 border border-blue-400 text-blue-500 rounded-md text-xs font-normal hover:bg-blue-50 transition-colors whitespace-nowrap"
                            onClick={(e) => {
                              e.stopPropagation();
                              window.open(`/timetable/feedback/${item.uc_id}?btid=${item.id}`, '_blank');
                            }}
                          >
                            Feedback
                          </button>
                          {isTodayOrFuture && !isRequesting && (
                            <button
                              className="px-2 py-0.5 border border-yellow-400 text-yellow-500 rounded-md text-xs font-normal hover:bg-yellow-50 transition-colors whitespace-nowrap"
                              onClick={(e) => {
                                e.stopPropagation();
                                openLeaveModal(item);
                              }}
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