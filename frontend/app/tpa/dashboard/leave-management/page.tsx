'use client';
import React, { useEffect, useState } from 'react';
import { apiClient } from '../../../utils/api';
import { toast } from 'react-toastify';
import ConfirmModal from '../../../components/ConfirmModal';

interface LeaveRequest {
  id: number;
  book_id: number;
  pending_date: string;
  pending_start_time: string;
  pending_end_time: string;
  source: number;
  add_time: string;
  status: string;
  user_id: number;
  user_name: string;
  lesson_date: string;
  start_time: string;
  end_time: string;
  course_id: number;
  course_name: string;
}

const PAGE_SIZE = 10;

export default function LeaveManagementPage() {
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1, total: 0 });
  const [statusFilter, setStatusFilter] = useState<'all' | '00' | '10' | '20'>('all');
  const [selectedRequests, setSelectedRequests] = useState<number[]>([]);
  const [actionLoading, setActionLoading] = useState(false);
  const [confirmModal, setConfirmModal] = useState<{
    visible: boolean;
    action: 'approve' | 'reject';
    requestIds: number[];
  }>({ visible: false, action: 'approve', requestIds: [] });

  // 新增：右侧详情面板状态
  const [detailPanel, setDetailPanel] = useState<{
    visible: boolean;
    data: LeaveRequest | null;
  }>({
    visible: false,
    data: null,
  });

  // 新增：操作确认弹窗状态
  const [actionConfirm, setActionConfirm] = useState<{
    visible: boolean;
    action: 'approve' | 'reject';
    leaveId: number | null;
  }>({ visible: false, action: 'approve', leaveId: null });

  // 状态映射
  const statusMap: Record<string, { label: string; color: string; bgColor: string }> = {
    '00': { label: 'Pending', color: 'text-yellow-800', bgColor: 'bg-yellow-100' },
    '10': { label: 'Rejected', color: 'text-red-800', bgColor: 'bg-red-100' },
    '20': { label: 'Confirmed', color: 'text-green-800', bgColor: 'bg-green-100' },
  };

  // 获取leave申请列表
  const fetchLeaveRequests = async (page: number) => {
    setLoading(true);
    try {
      const params: any = { pn: page, ps: PAGE_SIZE };
      if (statusFilter !== 'all') params.status = statusFilter;
      const res = await apiClient.get('/spwapi/tpa/auth/course/time/leaveList', params) as any;
      
      if (res && res.code === 0 && res.data) {
        setLeaveRequests(res.data.list || []);
        setPagination({
          currentPage: res.data.pn || page,
          totalPages: res.data.total_pages || 1,
          total: res.data.total || 0,
        });
      } else {
        setLeaveRequests([]);
        toast.error(res?.msg || 'Failed to fetch leave requests');
      }
    } catch (e: any) {
      setLeaveRequests([]);
      toast.error(e?.message || 'Failed to fetch leave requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaveRequests(pagination.currentPage);
  }, [pagination.currentPage, statusFilter]);

  // 处理申请
  const handleLeaveAction = async (action: 'approve' | 'reject', leaveId: number) => {
    setActionLoading(true);
    try {
      const url =
        action === 'approve'
          ? `/spwapi/tpa/auth/course/time/leaveConfirm?leave_id=${leaveId}`
          : `/spwapi/tpa/auth/course/time/leaveReject?leave_id=${leaveId}`;
      const res = await apiClient.post(url, {}) as any;
      if (res && res.code === 0) {
        toast.success(`Successfully ${action === 'approve' ? 'confirmed' : 'rejected'} leave request`);
        setSelectedRequests([]);
        fetchLeaveRequests(pagination.currentPage);
      } else {
        toast.error(res?.msg || `Failed to ${action} leave request`);
      }
    } catch (e: any) {
      toast.error(e?.message || `Failed to ${action} leave request`);
    } finally {
      setActionLoading(false);
      setActionConfirm({ visible: false, action: 'approve', leaveId: null });
      closeDetailPanel();
    }
  };

  // 批量操作
  const handleBatchAction = (action: 'approve' | 'reject') => {
    if (selectedRequests.length === 0) {
      toast.warning('Please select requests to process');
      return;
    }
    setConfirmModal({
      visible: true,
      action,
      requestIds: selectedRequests,
    });
  };

  // 全选/取消全选
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const pendingIds = leaveRequests
        .filter(req => req.status === '00')
        .map(req => req.id);
      setSelectedRequests(pendingIds);
    } else {
      setSelectedRequests([]);
    }
  };

  // 新增：点击行显示详情
  const handleRowClick = (request: LeaveRequest) => {
    setDetailPanel({
      visible: true,
      data: request,
    });
  };

  // 新增：关闭详情面板
  const closeDetailPanel = () => {
    setDetailPanel({
      visible: false,
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

  const pendingCount = leaveRequests.filter(req => req.status === '00').length;
  const hasSelected = selectedRequests.length > 0;

  // 新增：弹出确认弹窗
  const showActionConfirm = (action: 'approve' | 'reject', leaveId: number) => {
    setActionConfirm({ visible: true, action, leaveId });
  };

  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Leave Management</h1>
          <p className="text-gray-600 mt-1">Manage student leave requests and schedule changes</p>
        </div>
                  <div className="flex items-center gap-3">
            {pendingCount > 0 && (
              <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">
                {pendingCount} Pending
              </span>
            )}
            <div className="flex items-center text-blue-600 text-sm">
              <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <span>Click any row to view details</span>
            </div>
          </div>
      </div>

      {/* 状态筛选 */}
      <div className="flex gap-4 mb-6">
        {[
          { key: 'all', label: 'All' },
          { key: '00', label: 'Pending' },
          { key: '10', label: 'Rejected' },
          { key: '20', label: 'Confirmed' },
        ].map(tab => (
          <button
            key={tab.key}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              statusFilter === tab.key 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
            onClick={() => setStatusFilter(tab.key as 'all' | '00' | '10' | '20')}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 批量操作栏 */}
      {statusFilter === '00' && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={selectedRequests.length === pendingCount && pendingCount > 0}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                  className="rounded border-gray-300"
                />
                <span className="text-sm font-medium text-gray-700">
                  Select All ({selectedRequests.length}/{pendingCount})
                </span>
              </label>
            </div>
            {hasSelected && (
              <div className="flex gap-2">
                <button
                  onClick={() => handleBatchAction('approve')}
                  disabled={actionLoading}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 text-sm font-medium"
                >
                  {actionLoading ? 'Processing...' : `Approve (${selectedRequests.length})`}
                </button>
                <button
                  onClick={() => handleBatchAction('reject')}
                  disabled={actionLoading}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 text-sm font-medium"
                >
                  {actionLoading ? 'Processing...' : `Reject (${selectedRequests.length})`}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 申请列表 */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 mt-2">Loading leave requests...</p>
        </div>
      ) : leaveRequests.length === 0 ? (
        <div className="text-center py-12">
          <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="text-gray-500 text-lg">No leave requests found</p>
          <p className="text-gray-400 text-sm mt-1">When students request schedule changes, they will appear here</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                {statusFilter === '00' && (
                  <th className="py-3 px-4">
                    <input
                      type="checkbox"
                      checked={selectedRequests.length === pendingCount && pendingCount > 0}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                      className="rounded border-gray-300"
                    />
                  </th>
                )}
                <th className="py-3 px-4 font-semibold text-gray-700">Course Info</th>
                <th className="py-3 px-4 font-semibold text-gray-700">Original Schedule</th>
                <th className="py-3 px-4 font-semibold text-gray-700">Proposed Schedule</th>
                <th className="py-3 px-4 font-semibold text-gray-700">Requester</th>
                <th className="py-3 px-4 font-semibold text-gray-700">Request Date</th>
                <th className="py-3 px-4 font-semibold text-gray-700">Status</th>
                {statusFilter === '00' && (
                  <th className="py-3 px-4 font-semibold text-gray-700">Actions</th>
                )}
              </tr>
            </thead>
            <tbody>
              {leaveRequests.map(request => {
                const status = statusMap[request.status];
                const isSelected = selectedRequests.includes(request.id);
                const isPending = request.status === '00';
                
                return (
                  <tr 
                    key={request.id} 
                    className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => handleRowClick(request)}
                    title="Click to view details"
                  >
                    {statusFilter === '00' && (
                      <td className="py-3 px-4">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedRequests(prev => [...prev, request.id]);
                            } else {
                              setSelectedRequests(prev => prev.filter(id => id !== request.id));
                            }
                          }}
                          className="rounded border-gray-300"
                        />
                      </td>
                    )}
                    <td className="py-3 px-4">
                      <div className="font-medium">{request.course_name}</div>
                      <div className="text-xs text-gray-500">ID: {request.course_id} | Book: {request.book_id}</div>
                    </td>
                    <td className="py-3 px-4 text-sm">
                      <div>{formatDate(request.lesson_date)}</div>
                      <div className="text-gray-500">
                        {request.start_time?.slice(0, 5)} - {request.end_time?.slice(0, 5)}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm">
                      <div>{formatDate(request.pending_date)}</div>
                      <div className="text-gray-500">
                        {request.pending_start_time?.slice(0, 5)} - {request.pending_end_time?.slice(0, 5)}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex flex-col gap-1">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          request.source === 0 ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
                        }`}>
                          {request.source === 0 ? 'Student' : 'Teacher'}
                        </span>
                        <span className="text-xs text-gray-600">{request.user_name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">
                      {formatDateTime(request.add_time)}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${status.color} ${status.bgColor}`}>
                        {status.label}
                      </span>
                    </td>
                    {statusFilter === '00' && (
                      <td className="py-3 px-4">
                        <div className="flex gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              showActionConfirm('approve', request.id);
                            }}
                            disabled={actionLoading}
                            className="px-3 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700 disabled:opacity-50"
                          >
                            Approve
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              showActionConfirm('reject', request.id);
                            }}
                            disabled={actionLoading}
                            className="px-3 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700 disabled:opacity-50"
                          >
                            Reject
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* 分页 */}
      {pagination.totalPages > 1 && (
        <div className="flex justify-center items-center mt-6">
          <button
            onClick={() => setPagination(prev => ({ ...prev, currentPage: prev.currentPage - 1 }))}
            disabled={pagination.currentPage <= 1}
            className="px-3 py-1 mx-1 rounded bg-gray-200 disabled:opacity-50"
          >
            &laquo; Prev
          </button>
          {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map(page => (
            <button
              key={page}
              className={`px-3 py-1 mx-1 rounded ${pagination.currentPage === page ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
              onClick={() => setPagination(prev => ({ ...prev, currentPage: page }))}
            >
              {page}
            </button>
          ))}
          <button
            onClick={() => setPagination(prev => ({ ...prev, currentPage: prev.currentPage + 1 }))}
            disabled={pagination.currentPage >= pagination.totalPages}
            className="px-3 py-1 mx-1 rounded bg-gray-200 disabled:opacity-50"
          >
            Next &raquo;
          </button>
          <span className="ml-4 text-gray-500 text-sm">
            Total {pagination.total} requests
          </span>
        </div>
      )}

      {/* 右侧详情面板 */}
      {detailPanel.visible && detailPanel.data && (
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
                      <span className="text-gray-600">Course ID:</span>
                      <span className="font-medium">#{detailPanel.data.course_id}</span>
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

                {/* 课程信息 */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h5 className="font-semibold text-gray-800 mb-3">Course Information</h5>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Course Name:</span>
                      <span className="font-medium">{detailPanel.data.course_name}</span>
                    </div>
                  </div>
                </div>

                {/* 申请人信息 */}
                <div className="bg-purple-50 p-4 rounded-lg">
                  <h5 className="font-semibold text-purple-800 mb-3">Requester Information</h5>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Requester:</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        detailPanel.data.source === 0 ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
                      }`}>
                        {detailPanel.data.source === 0 ? 'Student' : 'Teacher'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Name:</span>
                      <span className="font-medium">{detailPanel.data.user_name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">User ID:</span>
                      <span className="font-medium">#{detailPanel.data.user_id}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Request Date:</span>
                      <span className="font-medium">{formatDate(detailPanel.data.add_time)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Request Time:</span>
                      <span className="font-medium">{formatDateTime(detailPanel.data.add_time)}</span>
                    </div>
                  </div>
                </div>

                {/* 原始时间安排 */}
                <div className="bg-red-50 p-4 rounded-lg">
                  <h5 className="font-semibold text-red-800 mb-3">Original Schedule</h5>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Date:</span>
                      <span className="font-medium">{formatDate(detailPanel.data.lesson_date)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Time:</span>
                      <span className="font-medium">
                        {detailPanel.data.start_time?.slice(0, 5)} - {detailPanel.data.end_time?.slice(0, 5)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 提议时间安排 */}
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

                {/* 操作按钮 - 仅当状态为Pending时显示 */}
                {detailPanel.data.status === '00' && (
                  <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                    <h5 className="font-semibold text-yellow-800 mb-3">Actions</h5>
                    <div className="flex gap-3">
                      <button
                        onClick={() => showActionConfirm('approve', detailPanel.data!.id)}
                        disabled={actionLoading}
                        className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 font-medium"
                      >
                        {actionLoading ? 'Processing...' : 'Confirm'}
                      </button>
                      <button
                        onClick={() => showActionConfirm('reject', detailPanel.data!.id)}
                        disabled={actionLoading}
                        className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 font-medium"
                      >
                        {actionLoading ? 'Processing...' : 'Reject'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 确认弹窗 */}
      <ConfirmModal
        isOpen={confirmModal.visible}
        title={`Confirm ${confirmModal.action === 'approve' ? 'Approval' : 'Rejection'}`}
        content={`Are you sure you want to ${confirmModal.action} ${confirmModal.requestIds.length} leave request(s)? This action cannot be undone.`}
        confirmText={actionLoading ? 'Processing...' : `Confirm ${confirmModal.action === 'approve' ? 'Approval' : 'Rejection'}`}
        cancelText="Cancel"
        onCancel={() => setConfirmModal({ visible: false, action: 'approve', requestIds: [] })}
        onConfirm={() => handleLeaveAction(confirmModal.action, confirmModal.requestIds[0])} // Assuming only one selected for batch
        loading={actionLoading}
      />
      {/* 自定义操作确认弹窗 */}
      <ConfirmModal
        isOpen={actionConfirm.visible}
        title={`Confirm ${actionConfirm.action === 'approve' ? 'Approval' : 'Rejection'}`}
        content={`Are you sure you want to ${actionConfirm.action === 'approve' ? 'confirm' : 'reject'} this leave request? This action cannot be undone.`}
        confirmText={actionLoading ? 'Processing...' : `Confirm ${actionConfirm.action === 'approve' ? 'Approval' : 'Rejection'}`}
        cancelText="Cancel"
        onCancel={() => setActionConfirm({ visible: false, action: 'approve', leaveId: null })}
        onConfirm={() => actionConfirm.leaveId && handleLeaveAction(actionConfirm.action, actionConfirm.leaveId)}
        loading={actionLoading}
      />
    </div>
  );
} 