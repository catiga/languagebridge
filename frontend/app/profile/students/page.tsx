"use client";
import React, { useState } from 'react';
import ProfileLayout from '../ProfileLayout';
import StudentList from '../../components/MemberList';

export default function StudentsPage() {
  const [loading, setLoading] = useState(false);
  return (
    <ProfileLayout>
      <div className="min-h-[60vh] flex flex-col items-center justify-center py-4">
        <StudentList onLoading={setLoading} />
        {loading && (
          <div className="fixed inset-0 bg-black/10 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-lg p-8 flex flex-col items-center">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
              <div className="text-blue-700 font-semibold">Loading...</div>
            </div>
          </div>
        )}
      </div>
    </ProfileLayout>
  );
} 