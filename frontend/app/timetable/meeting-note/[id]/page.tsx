"use client";
import React, { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { apiClient } from '../../../utils/api';
import { toast } from 'react-toastify';

// NoteItem类型适配后端返回
interface NoteItem {
  id: number;
  note: string;
  add_time: string;
  source: string; // '0'学生, '1'老师
}

interface MeetingRecord {
  id: number;
  lesson_date: string;
  start_time: string;
  end_time: string;
  teacher_name?: string;
  course_name?: string;
  student_name?: string;
}

interface CourseDetail {
  id: number;
  name: string;
  introduction: string;
  detail: string;
  course_picture?: string;
  teacher_name?: string;
  student_name?: string;
  booked_trans: MeetingRecord[];
}

export default function MeetingNotePage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const uc_id = params.id;
  const btid = searchParams.get('btid');
  const [loading, setLoading] = useState(true);
  const [courseDetail, setCourseDetail] = useState<CourseDetail | null>(null);
  const [meetingList, setMeetingList] = useState<MeetingRecord[]>([]);
  const [selectedMeeting, setSelectedMeeting] = useState<MeetingRecord | null>(null);
  const [notes, setNotes] = useState<NoteItem[]>([]);

  // 拉取课程详情和meeting列表
  useEffect(() => {
    if (!uc_id) return;
    const fetchDetail = async () => {
      setLoading(true);
      try {
        const res = await apiClient.get('/spwapi/auth/course/detail', { uc_id }) as any;
        if (res && res.code === 0 && res.data) {
          setCourseDetail(res.data);
          setMeetingList(res.data.booked_trans || []);
          // 优先用btid定位meeting
          let initialMeeting = null;
          if (btid) {
            initialMeeting = (res.data.booked_trans || []).find((m: any) => String(m.id) === String(btid));
          }
          if (!initialMeeting && res.data.booked_trans && res.data.booked_trans.length > 0) {
            initialMeeting = res.data.booked_trans[0];
          }
          setSelectedMeeting(initialMeeting && initialMeeting.id ? initialMeeting : null);
        } else {
          setCourseDetail(null);
          setMeetingList([]);
          setSelectedMeeting(null);
        }
      } catch (e: any) {
        toast.error(e?.message || 'Failed to fetch course detail');
        setCourseDetail(null);
        setMeetingList([]);
        setSelectedMeeting(null);
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [uc_id, btid]);

  // 拉取课堂笔记
  useEffect(() => {
    const realBtid = selectedMeeting?.id || btid;
    if (!realBtid) return;
    setLoading(true);
    apiClient.get('/spwapi/auth/course/meeting/note/fetchAll', { btid: realBtid })
      .then((res: any) => {
        if (res && res.code === 0 && Array.isArray(res.data)) {
          setNotes(res.data);
        } else {
          setNotes([]);
        }
      })
      .catch((e: any) => {
        toast.error(e?.message || 'Failed to fetch meeting notes');
        setNotes([]);
      })
      .finally(() => setLoading(false));
  }, [selectedMeeting, btid]);

  return (
    <div className="max-w-2xl mx-auto mt-8 bg-white rounded-2xl shadow-lg p-8 min-h-[60vh]">
      <h2 className="text-2xl font-bold mb-6 text-blue-700">Class Notes</h2>
      {loading && <div className="text-center text-gray-400 py-10">Loading...</div>}
      {!loading && courseDetail && (
        <div className="mb-6 flex gap-6 items-center">
          {courseDetail.course_picture && (
            <img src={courseDetail.course_picture} alt="course" className="w-20 h-20 object-cover rounded-xl border" />
          )}
          <div>
            <div className="text-lg font-semibold mb-1">{courseDetail.name}</div>
            <div className="text-gray-600 mb-1">Teacher: {courseDetail.teacher_name}</div>
            <div className="text-gray-600 mb-1">Student: {courseDetail.student_name}</div>
            <div className="text-gray-500 text-sm mt-1 line-clamp-2">{courseDetail.introduction}</div>
          </div>
        </div>
      )}
      {/* 上课时间切换 */}
      {!loading && meetingList.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-6">
          {meetingList.map((m, idx) => (
            <button
              key={m.id}
              className={`px-4 py-2 rounded-lg border text-sm font-medium transition
                ${selectedMeeting?.id === m.id ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-800 border-blue-300 hover:bg-blue-50 hover:border-blue-400'}`}
              onClick={() => setSelectedMeeting(m)}
            >
              {m.lesson_date?.slice(0,10)} {m.start_time?.slice(0,5)}-{m.end_time?.slice(0,5)}
            </button>
          ))}
        </div>
      )}
      {/* 笔记列表，局部滚动 */}
      {!loading && (
        notes.length === 0 ? (
          <div className="text-center text-gray-400 py-10">No class notes found.</div>
        ) : (
          <div className="space-y-4 max-h-80 overflow-y-auto pr-2">
            {notes.map(note => (
              <div key={note.id} className="bg-gray-50 rounded-lg p-4 shadow flex flex-col gap-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`px-2 py-0.5 rounded text-xs font-bold ${note.source === '1' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>{note.source === '1' ? 'Teacher' : 'Student'}</span>
                  <span className="text-xs text-gray-500">{note.add_time}</span>
                </div>
                <div className="text-gray-800 text-base whitespace-pre-line">{note.note}</div>
              </div>
            ))}
          </div>
        )
      )}
    </div>
  );
} 