"use client";
import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { apiClient } from "@/app/utils/api";
import { toast } from "react-toastify";
import { FaRegSadTear, FaRegFrown, FaRegMeh, FaRegSmile, FaRegGrinBeam, FaRegGrinStars } from "react-icons/fa";

const RATE_LABELS = [
  "Very Bad", "Poor", "Fair", "Good", "Very Good", "Excellent"
];
const RATE_ICONS = [
  <FaRegSadTear className="text-3xl" />, <FaRegFrown className="text-3xl" />, <FaRegMeh className="text-3xl" />, <FaRegSmile className="text-3xl" />, <FaRegGrinBeam className="text-3xl" />, <FaRegGrinStars className="text-3xl" />
];

interface ReviewDetail {
  id: number;
  course_name?: string;
  name?: string;
  introduction?: string;
  detail?: string;
  language?: string;
  level?: number;
  goal?: string;
  course_picture?: string;
  student_name?: string;
  lesson_date?: string;
  start_time?: string;
  review?: {
    rating: number;
    comment: string;
  };
}

export default function TeacherCourseReviewPage() {
  const { id } = useParams();
  const [course, setCourse] = useState<any>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState("");
  const [rate, setRate] = useState(3);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    Promise.all([
      apiClient.get("/spwapi/tpa/auth/course/detail", { uc_id: id }) as Promise<any>,
      apiClient.get("/spwapi/tpa/auth/course/review/fetch", { btid: id }) as Promise<any>
    ]).then(([courseRes, reviewRes]) => {
      if (courseRes && courseRes.code === 0) setCourse(courseRes.data);
      if (reviewRes && reviewRes.code === 0) setReviews(reviewRes.data || []);
    }).finally(() => setLoading(false));
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) {
      toast.error("Please enter your review.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await apiClient.post(`/spwapi/tpa/auth/course/review/add?btid=${id}`, { comment, rate });
      if (res && res.code === 0) {
        toast.success("Review submitted!");
        setComment("");
        setRate(5);
        // 重新获取评价列表
        const listRes = await apiClient.get("/spwapi/tpa/auth/course/review/fetch", { btid: id });
        if (listRes && listRes.code === 0) setReviews(listRes.data || []);
      } else {
        toast.error(res?.msg || "Failed to submit review.");
      }
    } catch (e: any) {
      toast.error(e?.message || "Failed to submit review.");
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
              src={course.course_picture || "/default-course-image.svg"}
              alt={course.name || course.course_name}
              className="w-24 h-24 rounded-lg object-cover border shadow-sm flex-shrink-0"
            />
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">{course.name || course.course_name}</h2>
              {course.introduction && (
                <p className="text-gray-700 text-sm leading-relaxed mb-3">{course.introduction}</p>
              )}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><span className="font-semibold text-gray-600">Language:</span> {course.language}</div>
                <div><span className="font-semibold text-gray-600">Level:</span> {course.level}</div>
                <div><span className="font-semibold text-gray-600">Duration:</span> {course.duration} min</div>
                <div><span className="font-semibold text-gray-600">Price:</span> ${course.price || course.display_price || 'N/A'}</div>
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
                          weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
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
      {/* 评价列表 */}
      <div className="mb-8">
        <h2 className="text-lg font-bold mb-3 text-gray-700">Reviews</h2>
        {reviews.length === 0 ? (
          <div className="text-gray-400">No reviews yet.</div>
        ) : (
          <ul className="space-y-4">
            {reviews.map((r, idx) => (
              <li key={idx} className="bg-gray-50 rounded-lg p-4 shadow-sm">
                <div className="text-gray-800 font-semibold mb-1">{r.user_name || r.teacher_name || 'Anonymous'}</div>
                <div className="text-gray-600 text-sm mb-1">{r.add_time ? new Date(r.add_time).toLocaleString() : ''}</div>
                <div className="text-gray-700">{r.comment}</div>
                <div className="text-yellow-500 mt-1 flex items-center gap-2">Satisfaction: {RATE_ICONS[r.rate]} <span>{RATE_LABELS[r.rate] || r.rate}</span></div>
              </li>
            ))}
          </ul>
        )}
      </div>
      {/* 评价表单 */}
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