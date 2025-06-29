"use client";
import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { apiClient } from "@/app/utils/api";

interface ReviewDetail {
  id: number;
  course_name: string;
  student_name: string;
  lesson_date: string;
  start_time: string;
  review?: {
    rating: number;
    comment: string;
  };
}

export default function TeacherCourseReviewPage() {
  const { id } = useParams();
  const [detail, setDetail] = useState<ReviewDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    setLoading(true);
    apiClient.get<any>(`/spwapi/tpa/auth/course/history/detail`, { id }).then(res => {
      if (res && res.code === 0 && res.data) {
        setDetail(res.data);
        if (res.data.review) {
          setRating(res.data.review.rating);
          setComment(res.data.review.comment);
        }
      }
    }).finally(() => setLoading(false));
  }, [id]);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const res = await apiClient.post<any>(`/spwapi/tpa/auth/course/history/review`, {
        id,
        rating,
        comment,
      });
      if (res && res.code === 0) {
        setSuccess(true);
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Loading...</div>;
  if (!detail) return <div className="p-8 text-center text-gray-500">No data found.</div>;

  return (
    <div className="max-w-xl mx-auto bg-white rounded-2xl shadow-lg p-8 mt-8">
      <h2 className="text-2xl font-bold mb-4">Course Review</h2>
      <div className="mb-4">
        <div className="font-semibold text-lg">{detail.course_name}</div>
        <div className="text-gray-500 text-sm mb-1">Student: {detail.student_name}</div>
        <div className="text-gray-500 text-sm">Time: {detail.lesson_date} {detail.start_time}</div>
      </div>
      <div className="mb-4">
        <div className="font-medium mb-2">Rating:</div>
        <div className="flex gap-2 mb-2">
          {[1,2,3,4,5].map(star => (
            <button
              key={star}
              type="button"
              className={star <= rating ? "text-yellow-400 text-2xl" : "text-gray-300 text-2xl"}
              onClick={() => setRating(star)}
              disabled={!!detail.review}
            >★</button>
          ))}
        </div>
      </div>
      <div className="mb-4">
        <div className="font-medium mb-2">Comment:</div>
        <textarea
          className="w-full border border-gray-200 rounded-lg p-3 min-h-[80px]"
          value={comment}
          onChange={e => setComment(e.target.value)}
          disabled={!!detail.review}
        />
      </div>
      {success ? (
        <div className="text-green-600 font-bold text-center">Review submitted successfully!</div>
      ) : (
        <button
          className="w-full py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-all disabled:opacity-50"
          onClick={handleSubmit}
          disabled={submitting || !!detail.review || rating === 0}
        >
          {submitting ? "Submitting..." : detail.review ? "Already Reviewed" : "Submit Review"}
        </button>
      )}
    </div>
  );
} 