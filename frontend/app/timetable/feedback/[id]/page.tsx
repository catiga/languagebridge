"use client";
import React, { useEffect, useState, useRef } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { apiClient } from '../../../utils/api';
import { toast } from 'react-toastify';

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

interface FeedbackItem {
  id: number;
  book_id: number;
  teacher_id: number;
  user_id: number;
  comment: string;
  rate: number;
  add_time: string;
  flag: number;
  direction: number; // 1=学生，其他=老师
}

export default function FeedbackPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const uc_id = params.id;
  const btid = searchParams.get('btid');
  const [loading, setLoading] = useState(true);
  const [courseDetail, setCourseDetail] = useState<CourseDetail | null>(null);
  const [meetingList, setMeetingList] = useState<MeetingRecord[]>([]);
  const [selectedMeeting, setSelectedMeeting] = useState<MeetingRecord | null>(null);
  const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>([]);
  const [reviewContent, setReviewContent] = useState('');
  const [reviewRate, setReviewRate] = useState<number | null>(null);
  const [reviewLoading, setReviewLoading] = useState(false);
  const reviewRef = useRef<HTMLTextAreaElement>(null);

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

  // 拉取feedback
  useEffect(() => {
    const realBtid = selectedMeeting?.id || btid;
    if (!realBtid) return;
    setLoading(true);
    apiClient.get('/spwapi/auth/course/review/fetch', { btid: realBtid })
      .then((res: any) => {
        if (res && res.code === 0 && Array.isArray(res.data)) {
          setFeedbacks(res.data);
        } else {
          setFeedbacks([]);
        }
      })
      .catch((e: any) => {
        toast.error(e?.message || 'Failed to fetch feedback');
        setFeedbacks([]);
      })
      .finally(() => setLoading(false));
  }, [selectedMeeting, btid]);

  // 提交评价
  const handleSubmitReview = async () => {
    if (!selectedMeeting?.id) return;
    if (!reviewContent.trim()) {
      toast.error('Please enter your review.');
      reviewRef.current?.focus();
      return;
    }
    if (!reviewRate) {
      toast.error('Please select your satisfaction.');
      return;
    }
    setReviewLoading(true);
    try {
      const res = await apiClient.post('/spwapi/auth/course/review/add', {
        comment: reviewContent,
        rate: reviewRate,
        btid: selectedMeeting.id,
      }) as any;
      if (res && res.code === 0) {
        toast.success('Review submitted!');
        setReviewContent('');
        setReviewRate(null);
        // 刷新评价列表
        const realBtid = selectedMeeting.id;
        const feedbackRes = await apiClient.get('/spwapi/auth/course/review/fetch', { btid: realBtid }) as any;
        if (feedbackRes && feedbackRes.code === 0 && Array.isArray(feedbackRes.data)) {
          setFeedbacks(feedbackRes.data);
        }
      } else {
        toast.error(res?.msg || 'Failed to submit review');
      }
    } catch (e: any) {
      toast.error(e?.message || 'Failed to submit review');
    } finally {
      setReviewLoading(false);
    }
  };

  // 满意度选项
  const rateOptions = [
    { value: 1, label: 'Very Bad', icon: '😞' },
    { value: 2, label: 'Bad', icon: '😕' },
    { value: 3, label: 'Good', icon: '😊' },
    { value: 4, label: 'Very Good', icon: '😃' },
    { value: 5, label: 'Excellent', icon: '🤩' },
  ];

  return (
    <div className="max-w-2xl mx-auto mt-8 bg-white rounded-2xl shadow-lg p-8 min-h-[60vh]">
      <h2 className="text-2xl font-bold mb-6 text-blue-700">Feedback</h2>
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
      {/* feedback列表，局部滚动 */}
      {!loading && (
        feedbacks.length === 0 ? (
          <div className="text-center text-gray-400 py-10">No feedback found.</div>
        ) : (
          <div className="space-y-4 max-h-80 overflow-y-auto pr-2 mb-8">
            {feedbacks.map(fb => (
              <div key={fb.id} className="bg-gray-50 rounded-lg p-4 shadow flex flex-col gap-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`px-2 py-0.5 rounded text-xs font-bold ${fb.direction === 1 ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>{fb.direction === 1 ? 'Student' : 'Teacher'}</span>
                  <span className="text-xs text-gray-500">{fb.add_time}</span>
                  {typeof fb.rate === 'number' && (
                    <span className="ml-2 flex items-center gap-1">
                      {Array.from({ length: fb.rate }).map((_, i) => (
                        <span key={i} className="text-yellow-400 text-base">★</span>
                      ))}
                      <span className="text-xs text-orange-500 font-bold ml-1">{fb.rate}</span>
                    </span>
                  )}
                </div>
                <div className="text-gray-800 text-base whitespace-pre-line">{fb.comment}</div>
              </div>
            ))}
          </div>
        )
      )}
      {/* 新增评价表单 */}
      <div className="bg-white rounded-xl shadow p-6 mt-6">
        <div className="font-bold text-lg mb-3">Add Your Review</div>
        <textarea
          ref={reviewRef}
          className="w-full border rounded px-4 py-3 mb-4 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-200"
          rows={4}
          placeholder="Write your review here..."
          value={reviewContent}
          onChange={e => setReviewContent(e.target.value)}
          disabled={reviewLoading}
        />
        <div className="mb-4">
          <div className="font-semibold mb-2">Satisfaction:</div>
          <div className="flex items-center gap-2">
            {rateOptions.map(opt => (
              <button
                key={opt.value}
                type="button"
                className={`w-10 h-10 flex items-center justify-center rounded-full border-2 text-2xl transition
                  ${reviewRate === opt.value ? 'border-yellow-400 bg-yellow-100' : 'border-gray-200 bg-white hover:border-yellow-300'}`}
                onClick={() => setReviewRate(opt.value)}
                disabled={reviewLoading}
              >
                <span>{opt.icon}</span>
              </button>
            ))}
            {reviewRate && (
              <span className="ml-4 text-base font-bold text-yellow-700">{rateOptions.find(r => r.value === reviewRate)?.label}</span>
            )}
          </div>
        </div>
        <button
          className="px-6 py-2 rounded bg-blue-600 text-white font-bold hover:bg-blue-700 transition disabled:opacity-50"
          onClick={handleSubmitReview}
          disabled={reviewLoading || !reviewContent.trim() || !reviewRate}
        >
          {reviewLoading ? 'Submitting...' : 'Submit Review'}
        </button>
      </div>
    </div>
  );
} 