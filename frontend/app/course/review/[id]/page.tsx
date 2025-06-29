"use client";
import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { apiClient } from '../../../utils/api';
import { toast } from 'react-toastify';

export default function CourseReviewPage() {
  const params = useParams();
  const courseId = params?.id;
  const [course, setCourse] = useState<any>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!courseId) return;
    setLoading(true);
    Promise.all([
      apiClient.get('/spwapi/auth/course/detail', { uc_id: courseId }),
      apiClient.get('/spwapi/auth/course/review/list', { course_id: courseId })
    ]).then(([courseRes, reviewRes]) => {
      if (courseRes && courseRes.code === 0) setCourse(courseRes.data);
      if (reviewRes && reviewRes.code === 0) setReviews(reviewRes.data || []);
    }).finally(() => setLoading(false));
  }, [courseId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) {
      toast.error('Please enter your review.');
      return;
    }
    setSubmitting(true);
    try {
      const res = await apiClient.post('/spwapi/auth/course/review/add', { course_id: courseId, content });
      if (res && res.code === 0) {
        toast.success('Review submitted!');
        setContent('');
        setReviews(prev => [{ ...res.data, content }, ...prev]);
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
  if (!course) return <div className="text-center py-12 text-gray-500">Course not found.</div>;

  return (
    <div className="max-w-2xl mx-auto py-10 px-4">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Course Review</h1>
      <div className="bg-white rounded-xl shadow p-6 mb-8">
        <div className="flex items-center gap-4 mb-4">
          <img src={course.course_picture || '/default-course-image.svg'} alt={course.name} className="w-20 h-20 rounded-lg object-cover border" />
          <div>
            <div className="text-xl font-bold text-gray-800">{course.name}</div>
            <div className="text-gray-600">Teacher: {course.teacher_name || '-'}</div>
            <div className="text-gray-500 text-sm mt-1">{course.introduction}</div>
          </div>
        </div>
        <div className="flex flex-wrap gap-6 text-gray-600 text-sm">
          <div><b>Language:</b> {course.language}</div>
          <div><b>Level:</b> {course.level}</div>
          <div><b>Duration:</b> {course.duration} min</div>
        </div>
      </div>
      <div className="mb-8">
        <h2 className="text-lg font-bold mb-3 text-gray-700">Reviews</h2>
        {reviews.length === 0 ? (
          <div className="text-gray-400">No reviews yet.</div>
        ) : (
          <ul className="space-y-4">
            {reviews.map((r, idx) => (
              <li key={idx} className="bg-gray-50 rounded-lg p-4 shadow-sm">
                <div className="text-gray-800 font-semibold mb-1">{r.user_name || 'Anonymous'}</div>
                <div className="text-gray-600 text-sm mb-1">{r.created_at ? new Date(r.created_at).toLocaleString() : ''}</div>
                <div className="text-gray-700">{r.content}</div>
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
          value={content}
          onChange={e => setContent(e.target.value)}
          disabled={submitting}
        />
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