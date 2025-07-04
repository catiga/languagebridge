"use client";
import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '../../components/DashboardLayout';
import { FaUpload } from 'react-icons/fa';
import * as yup from 'yup';
import { toast } from 'react-toastify';
import { apiClient } from '@/app/utils/api';

const addCourseSchema = yup.object().shape({
  name: yup.string().required('Course name is required'),
  introduction: yup.string().required('Introduction is required'),
  detail: yup.string().required('Detail is required'),
  language: yup.string().required('Language is required'),
  level: yup.number().required('Level is required').typeError('Level is required'),
  goal: yup.string().required('Goal is required'),
  duration: yup.number().required('Duration is required').typeError('Duration is required'),
  session_number: yup.number().required('Session number is required').typeError('Session number is required'),
  course_picture: yup.string().required('Course picture is required'),
});

export default function AddCoursePage() {
  const router = useRouter();
  const [addForm, setAddForm] = useState({
    name: '',
    introduction: '',
    detail: '',
    language: '',
    level: 1,
    goal: '',
    duration: 0,
    session_number: 0,
    course_picture: '',
    pictureFile: null as File | null,
  });
  const [addErrors, setAddErrors] = useState<{[k:string]:string}>({});
  const [addLoading, setAddLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePictureClick = () => fileInputRef.current?.click();
  const handlePictureChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const uploadData = new FormData();
      uploadData.append('image', file);
      const apiKey = 'bbf086ea0c965eeb43bb982b048f1d1b';
      const response = await fetch(`https://api.imgbb.com/1/upload?key=${apiKey}`, {
        method: 'POST',
        body: uploadData,
      });
      const result = await response.json();
      if (result.success) {
        setAddForm(f => ({ ...f, course_picture: result.data.url, pictureFile: file }));
        toast.success('Image uploaded!');
      } else {
        throw new Error('Image upload failed');
      }
    } catch (err) {
      toast.error('Image upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };
  const handleRemovePicture = () => {
    setAddForm(f => ({ ...f, course_picture: '', pictureFile: null }));
  };

  const handleAddCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddLoading(true);
    setAddErrors({});
    try {
      await addCourseSchema.validate(addForm, { abortEarly: false });
      // 调用后端API保存课程
      const payload = {
        id: 0,
        name: addForm.name,
        introduction: addForm.introduction,
        detail: addForm.detail,
        language: addForm.language,
        level: Number(addForm.level),
        goal: addForm.goal,
        duration: Number(addForm.duration),
        session_number: Number(addForm.session_number),
        course_picture: addForm.course_picture,
      };
      const res: any = await apiClient.post('/spwapi/tpa/auth/course/add', payload);
      if (res.code === 0) {
        toast.success('Course added successfully!');
        router.push('/tpa/dashboard?tab=my-courses');
      } else {
        toast.error(res.msg || 'Failed to add course');
      }
    } catch (e: any) {
      if (e.name === 'ValidationError') {
        const errors: {[k:string]:string} = {};
        e.inner.forEach((err: any) => { if (err.path) errors[err.path] = err.message; });
        setAddErrors(errors);
      } else {
        toast.error('Failed to add course');
      }
    } finally {
      setAddLoading(false);
    }
  };

  return (
    <DashboardLayout activeTab="courses" onTabChange={(tab) => {
      // 跳转到dashboard主页面并切换tab
      router.push(`/tpa/dashboard?tab=${tab}`);
    }}>
      <div className="max-w-2xl mx-auto py-10">
        <div className="flex items-center mb-8">
          <button type="button" onClick={() => router.push('/tpa/dashboard?tab=my-courses')} className="mr-4 px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium shadow">
            ← Back to Course List
          </button>
          <h2 className="text-2xl font-bold text-gray-800">Add New Course</h2>
        </div>
        <form onSubmit={handleAddCourse} className="space-y-6 bg-white rounded-2xl shadow-xl p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-gray-700 font-medium mb-1">Course Name</label>
              <input className="w-full border rounded-lg px-3 py-2" value={addForm.name} onChange={e => setAddForm(f => ({ ...f, name: e.target.value }))} />
              {addErrors.name && <div className="text-red-500 text-xs mt-1">{addErrors.name}</div>}
            </div>
            <div className="md:col-span-2">
              <label className="block text-gray-700 font-medium mb-1">Introduction</label>
              <input className="w-full border rounded-lg px-3 py-2" value={addForm.introduction} onChange={e => setAddForm(f => ({ ...f, introduction: e.target.value }))} />
              {addErrors.introduction && <div className="text-red-500 text-xs mt-1">{addErrors.introduction}</div>}
            </div>
            <div className="md:col-span-2">
              <label className="block text-gray-700 font-medium mb-1">Goal</label>
              <input className="w-full border rounded-lg px-3 py-2" value={addForm.goal} onChange={e => setAddForm(f => ({ ...f, goal: e.target.value }))} />
              {addErrors.goal && <div className="text-red-500 text-xs mt-1">{addErrors.goal}</div>}
            </div>

            <div>
              <label className="block text-gray-700 font-medium mb-1">Level</label>
              <select className="w-full border rounded-lg px-3 py-2" value={addForm.level} onChange={e => setAddForm(f => ({ ...f, level: Number(e.target.value) }))}>
                <option value={1}>1 - Easiest</option>
                <option value={2}>2 - Easy</option>
                <option value={3}>3 - Medium</option>
                <option value={4}>4 - Hard</option>
                <option value={5}>5 - Hardest</option>
              </select>
              {addErrors.level && <div className="text-red-500 text-xs mt-1">{addErrors.level}</div>}
            </div>
            
            <div>
              <label className="block text-gray-700 font-medium mb-1">Language</label>
              <input className="w-full border rounded-lg px-3 py-2" value={addForm.language} onChange={e => setAddForm(f => ({ ...f, language: e.target.value }))} />
              {addErrors.language && <div className="text-red-500 text-xs mt-1">{addErrors.language}</div>}
            </div>
            
            <div>
              <label className="block text-gray-700 font-medium mb-1">Duration (minutes) / Class</label>
              <input type="number" className="w-full border rounded-lg px-3 py-2" value={addForm.duration} onChange={e => setAddForm(f => ({ ...f, duration: Number(e.target.value) }))} />
              {addErrors.duration && <div className="text-red-500 text-xs mt-1">{addErrors.duration}</div>}
            </div>
            <div>
              <label className="block text-gray-700 font-medium mb-1">Session Number</label>
              <input type="number" className="w-full border rounded-lg px-3 py-2" value={addForm.session_number} onChange={e => setAddForm(f => ({ ...f, session_number: Number(e.target.value) }))} />
              {addErrors.session_number && <div className="text-red-500 text-xs mt-1">{addErrors.session_number}</div>}
            </div>
          </div>
          {/* course picture单独一行 */}
          <div>
            <label className="block text-gray-700 font-medium mb-1">Course Picture</label>
            <div className="w-full p-6 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 relative"
              onClick={handlePictureClick}>
              {uploading ? (
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              ) : addForm.course_picture ? (
                <div className="relative group">
                  <img src={addForm.course_picture} alt="preview" className="w-32 h-24 object-cover rounded-md" />
                  <button type="button" onClick={e => { e.stopPropagation(); handleRemovePicture(); }}
                    className="absolute top-1 right-1 bg-white/80 hover:bg-red-500 hover:text-white text-gray-500 rounded-full p-1 shadow transition-all">
                  ×
                </button>
              </div>
            ) : (
              <>
                <FaUpload className="w-8 h-8 text-gray-400 mb-2" />
                <p className="text-gray-500">Click to upload course image</p>
              </>
            )}
            <input type="file" ref={fileInputRef} onChange={handlePictureChange} className="hidden" accept="image/png, image/jpeg, image/gif" />
          </div>
          {addErrors.course_picture && <div className="text-red-500 text-xs mt-1">{addErrors.course_picture}</div>}
        </div>
        {/* detail字段单独一行 */}
        <div>
          <label className="block text-gray-700 font-medium mb-1">Detail</label>
          <textarea className="w-full border rounded-lg px-3 py-2" rows={3} value={addForm.detail} onChange={e => setAddForm(f => ({ ...f, detail: e.target.value }))} />
          {addErrors.detail && <div className="text-red-500 text-xs mt-1">{addErrors.detail}</div>}
        </div>
        <button type="submit" disabled={addLoading || uploading} className="mt-8 w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-4 rounded-xl shadow disabled:opacity-60 flex items-center justify-center">
          {addLoading && <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></span>}
          {addLoading ? 'Adding...' : 'Add Course'}
        </button>
      </form>
    </div>
    </DashboardLayout>
  );
} 