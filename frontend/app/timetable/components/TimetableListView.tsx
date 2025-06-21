'use client';
import React, { useEffect, useState } from 'react';
import { apiClient } from '../../utils/api';
import { toast } from 'react-toastify';

interface CourseTimeItem {
  id: number;
  booking_no: string;
  teacher_id: number;
  course_id: number;
  user_id: number;
  lesson_date: string;
  start_time: string;
  end_time: string;
  status: string;
  teacher_name: string;
  course_name: string;
}

const PAGE_SIZE = 10;

export default function TimetableListView() {
  const [data, setData] = useState<CourseTimeItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1, total: 0 });
  const [teacherMap, setTeacherMap] = useState<Record<number, string>>({});
  const [courseMap, setCourseMap] = useState<Record<number, string>>({});
  const [studentMap, setStudentMap] = useState<Record<number, string>>({});

  // 状态码映射
  const statusMap: Record<string, string> = {
    '000': 'Upcoming',
    '001': 'Completed',
    // 可根据实际补充
  };

  // 拉取主数据
  useEffect(() => {
    const fetchData = async (page: number) => {
      setLoading(true);
      try {
        // 增加 pn, ps 分页参数
        const res = await apiClient.get('/spwapi/auth/course/time/list', { pn: page, ps: PAGE_SIZE });
        
        // 按分页结构解析
        if (res && res.code === 0 && res.data) {
          setData(res.data.list || []);
          setPagination({
            currentPage: res.data.pn || page,
            totalPages: res.data.total_pages || 1,
            total: res.data.total || 0,
          });
        } else {
          setData([]);
          toast.error(res?.msg || '获取课程时间表失败');
        }
      } catch (e: any) {
        setData([]);
        toast.error(e?.message || '获取课程时间表失败');
      } finally {
        setLoading(false);
      }
    };
    fetchData(pagination.currentPage);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination.currentPage]);

  // 拉取老师、课程、学生映射
  useEffect(() => {
    // 假设接口分别为 /spwapi/course/teachers, /spwapi/course/list, /spwapi/user/list
    Promise.all([
      apiClient.get('/spwapi/course/teachers'), // [{id, name}]
      apiClient.get('/spwapi/course/list'),     // [{id, name}]
      apiClient.get('/spwapi/user/list'),       // [{id, name}]
    ]).then(([teachersRes, coursesRes, studentsRes]) => {
      if (teachersRes.code === 0 && Array.isArray(teachersRes.data)) {
        setTeacherMap(Object.fromEntries(teachersRes.data.map((t: any) => [t.id, t.name])));
      }
      if (coursesRes.code === 0 && Array.isArray(coursesRes.data)) {
        setCourseMap(Object.fromEntries(coursesRes.data.map((c: any) => [c.id, c.name])));
      }
      if (studentsRes.code === 0 && Array.isArray(studentsRes.data)) {
        setStudentMap(Object.fromEntries(studentsRes.data.map((s: any) => [s.id, s.name])));
      }
    });
  }, []);

  const handlePageChange = (page: number) => {
    if (page < 1 || page > pagination.totalPages || page === pagination.currentPage) return;
    setPagination(p => ({ ...p, currentPage: page }));
  };

  return (
    <div className="bg-white rounded-xl shadow-md p-8 mb-6">
      <h3 className="text-xl font-bold mb-4">Timetable (List View)</h3>
      {loading ? (
        <div className="text-center py-10">Loading...</div>
      ) : (
        <>
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-100">
                <th className="py-2 px-4">Booking No</th>
                <th className="py-2 px-4">Course</th>
                <th className="py-2 px-4">Teacher</th>
                <th className="py-2 px-4">Date</th>
                <th className="py-2 px-4">Time</th>
                <th className="py-2 px-4">Status</th>
              </tr>
            </thead>
            <tbody>
              {data.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-gray-500">No data</td>
                </tr>
              ) : (
                data.map(item => (
                  <tr key={item.id}>
                    <td className="py-2 px-4">{item.booking_no}</td>
                    <td className="py-2 px-4">{item.course_name?.slice(0, 10)}...</td>
                    <td className="py-2 px-4">{item.teacher_name}</td>
                    <td className="py-2 px-4">{item.lesson_date?.slice(0, 10)}</td>
                    <td className="py-2 px-4">{item.start_time?.slice(0, 5)} - {item.end_time?.slice(0, 5)}</td>
                    <td className="py-2 px-4">{statusMap[item.status] || item.status}</td>
                  </tr>
                ))
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