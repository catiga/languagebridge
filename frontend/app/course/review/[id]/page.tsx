"use client";
import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { apiClient } from '../../../utils/api';
import { toast } from 'react-toastify';
import { FaRegSadTear, FaRegFrown, FaRegMeh, FaRegSmile, FaRegGrinBeam, FaRegGrinStars } from 'react-icons/fa';

const RATE_LABELS = [
  'Very Bad',    // 0
  'Poor',        // 1
  'Fair',        // 2
  'Good',        // 3
  'Very Good',   // 4
  'Excellent',   // 5
];
const RATE_ICONS = [
  <FaRegSadTear className="text-3xl" />,      // 0
  <FaRegFrown className="text-3xl" />,        // 1
  <FaRegMeh className="text-3xl" />,          // 2
  <FaRegSmile className="text-3xl" />,        // 3
  <FaRegGrinBeam className="text-3xl" />,     // 4
  <FaRegGrinStars className="text-3xl" />,    // 5
];

export default function CourseReviewPage() {
  const params = useParams();
  const btid = params?.id;
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState('');
  const [rate, setRate] = useState(3);
  const [submitting, setSubmitting] = useState(false);
  const [course, setCourse] = useState<any>(null);

  // 获取课程信息和评价列表
  useEffect(() => {
    if (!btid) return;
    setLoading(true);
    Promise.all([
      apiClient.get('/spwapi/auth/course/detail', { uc_id: btid }) as Promise<any>,
      apiClient.get('/spwapi/auth/course/review/fetch', { btid }) as Promise<any>
    ]).then(([courseRes, reviewRes]) => {
      if (courseRes && (courseRes as any).code === 0) {
        setCourse((courseRes as any).data);
      }
      if (reviewRes && (reviewRes as any).code === 0) setReviews((reviewRes as any).data || []);
    }).finally(() => setLoading(false));
  }, [btid]);

  // 新增评价
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) {
      toast.error('Please enter your review.');
      return;
    }
    setSubmitting(true);
    try {
      const res = await apiClient.post(`/spwapi/auth/course/review/add?btid=${btid}`, { comment, rate }) as any;
      if (res && res.code === 0) {
        toast.success('Review submitted!');
        setComment('');
        setRate(5);
        // 重新获取评价列表
        const listRes = await apiClient.get('/spwapi/auth/course/review/fetch', { btid }) as any;
        if (listRes && listRes.code === 0) setReviews(listRes.data || []);
      } else {
        toast.error(res?.msg || 'Failed to submit review.');
      }
    } catch (e: any) {
      toast.error(e?.message || 'Failed to submit review.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="text-center py-12 text-gray-500">Loading...</div>;

  return (
    <div className="max-w-2xl mx-auto py-10 px-4">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Course Review</h1>
      
      {/* 课程基本信息 */}
      {course && (
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8 border border-gray-100">
          <div className="flex items-start gap-4">
            <img 
              src={course.course_picture || '/default-course-image.svg'} 
              alt={course.name} 
              className="w-24 h-24 rounded-lg object-cover border shadow-sm flex-shrink-0" 
            />
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">{course.name}</h2>
              <div className="text-gray-600 mb-3">
                <span className="font-semibold">Teacher:</span> {course.teacher_name || 'TBD'}
              </div>
              {course.introduction && (
                <p className="text-gray-700 text-sm leading-relaxed mb-3">{course.introduction}</p>
              )}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><span className="font-semibold text-gray-600">Language:</span> {course.language}</div>
                <div><span className="font-semibold text-gray-600">Level:</span> {course.level}</div>
                <div><span className="font-semibold text-gray-600">Duration:</span> {course.duration} min</div>
                <div><span className="font-semibold text-gray-600">Price:</span> ${course.price || 'N/A'}</div>
              </div>
            </div>
          </div>
          
          {/* 上课时间信息 */}
          {Array.isArray(course.booked_trans) && course.booked_trans.length > 0 && (
            <div className="mt-6 pt-4 border-t border-gray-200">
              <h3 className="font-semibold text-gray-700 mb-3 flex items-center">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Class Schedule
              </h3>
              <div className="space-y-2">
                {course.booked_trans.map((item: any, idx: number) => (
                  <div key={idx} className="flex items-center justify-between bg-gray-50 rounded-lg px-4 py-2">
                    <div className="flex items-center gap-3">
                      <div className="text-blue-600 font-semibold">
                        {item.lesson_date ? new Date(item.lesson_date).toLocaleDateString('en-US', { 
                          weekday: 'long', 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        }) : 'TBD'}
                      </div>
                      <div className="text-gray-500">|</div>
                      <div className="font-medium text-gray-700">
                        {item.start_time?.slice(0, 5)} - {item.end_time?.slice(0, 5)}
                      </div>
                    </div>
                    <div className="text-xs text-gray-500 bg-white px-2 py-1 rounded border">
                      Lesson {idx + 1}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
      
      <div className="mb-8">
        <h2 className="text-lg font-bold mb-3 text-gray-700">Reviews</h2>
        {reviews.length === 0 ? (
          <div className="text-gray-400">No reviews yet.</div>
        ) : (
          <ul className="space-y-4">
            {reviews.map((r, idx) => (
              <li
                key={idx}
                className={`bg-gray-50 rounded-lg p-4 shadow-sm border-l-4 ${
                  r.direction === 2 ? 'border-blue-400' : 'border-green-400'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  {r.direction === 2 ? (
                    <>
                      <span className="px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded font-bold">Teacher Review</span>
                      <span className="text-blue-400"><FaRegGrinStars /></span>
                    </>
                  ) : (
                    <>
                      <span className="px-2 py-0.5 text-xs bg-green-100 text-green-700 rounded font-bold">Student Review</span>
                      <span className="text-green-400"><FaRegSmile /></span>
                    </>
                  )}
                  <span className="text-gray-600 text-xs ml-2">{r.add_time ? new Date(r.add_time).toLocaleString() : ''}</span>
                </div>
                <div className="text-gray-700 mb-1">{r.comment}</div>
                <div className="text-yellow-500 flex items-center gap-2">
                  Satisfaction: {RATE_ICONS[r.rate]} <span>{RATE_LABELS[r.rate] || r.rate}</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow p-6">
        <h2 className="text-lg font-bold mb-3 text-gray-700">Add Your Review</h2>
        <textarea
          className="w-full min-h-[80px] border border-gray-300 rounded-lg p-3 mb-4 focus:outline-none focus:ring-2 focus:ring-blue-200"
          placeholder="Write your review here..."
          value={comment}
          onChange={e => setComment(e.target.value)}
          disabled={submitting}
        />
        <div className="mb-4">
          <label className="mr-2 font-semibold">Satisfaction:</label>
          <div className="flex gap-3 items-center mt-2">
            {[0,1,2,3,4,5].map(n => (
              <button
                type="button"
                key={n}
                className={`rounded-full p-1 border-2 ${rate === n ? 'border-yellow-400 bg-yellow-100' : 'border-gray-200 bg-gray-50'} transition`}
                onClick={() => setRate(n)}
                disabled={submitting}
                aria-label={RATE_LABELS[n]}
              >
                <span className={`text-3xl ${rate === n ? 'text-yellow-500' : 'text-gray-400'}`}>{RATE_ICONS[n]}</span>
              </button>
            ))}
            <span className="ml-3 text-sm font-semibold text-yellow-600">{RATE_LABELS[rate]}</span>
          </div>
        </div>
        <button
          type="submit"
          className="px-6 py-2 rounded bg-blue-600 text-white font-bold hover:bg-blue-700 transition disabled:opacity-60"
          disabled={submitting}
        >
          {submitting ? 'Submitting...' : 'Submit Review'}
        </button>
      </form>
    </div>
  );
} 