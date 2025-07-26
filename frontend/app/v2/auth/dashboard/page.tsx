// frontend/app/v2/auth/dashboard/page.tsx

'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';

const DashboardPageV2: React.FC = () => {
  const router = useRouter();

  useEffect(() => {
    // Check for token in localStorage and sessionStorage
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (!token) {
      // If token is not found, redirect to login page
      router.push('/login');
    }
  }, [router]);

  // If token exists, render the dashboard content
  return (
    <div className="min-h-screen bg-gray-100">
      {/* Top Navigation Bar */}
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          {/* Logo */}
          <div className="text-xl font-bold text-gray-800">Your Logo</div>
          {/* Search Bar (Placeholder)*/}
          <div className="flex items-center">
            <input
              type="text"
              placeholder="Search..."
              className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
            {/* Search Icon (Placeholder)*/}
            <button className="ml-2 p-2 rounded-md bg-blue-600 text-white hover:bg-blue-700">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
          {/* User Info and Notifications (Placeholders)*/}
          <div className="flex items-center space-x-4">
            {/* Notification Icon */}
            <button className="p-2 rounded-md bg-gray-200 text-gray-700 hover:bg-gray-300">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h2m-2 0h-2m2 0H9m9 0a2 2 0 100-4 2 2 0 000 4zM7 17h2m-2 0H5m2 0a2 2 0 100-4 2 2 0 000 4zM12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8H4a2 2 0 01-2-2v-4a2 2 0 012-2h16a2 2 0 012 2v4a2 2 0 01-2 2h-2m-4 0h-4" />
              </svg>
            </button>
            {/* User Avatar/Name */}
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-full bg-gray-300"></div>
              <span className="text-gray-700">User Name</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Left Column (e.g., Study Planner, My Students) */}
          <div className="md:col-span-2 space-y-8">
            {/* Study Planner Module (Placeholder) */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-xl font-bold text-gray-800 mb-4">Study Planner</h3>
              {/* Study Planner Content Goes Here */}
              <p className="text-gray-600">Your upcoming lessons and tasks.</p>
            </div>

            {/* My Students Module (Placeholder) */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-xl font-bold text-gray-800 mb-4">My Students</h3>
              {/* My Students Content Goes Here */}
              <p className="text-gray-600">Manage your students and their progress.</p>
            </div>

            {/* Recommended Courses Module (Placeholder) */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-xl font-bold text-gray-800 mb-4">Recommended Courses</h3>
              {/* Recommended Courses Content Goes Here */}
              <p className="text-gray-600">Courses tailored to your interests and level.</p>
            </div>
          </div>

          {/* Right Column (e.g., Profile, Achievements, Community) */}
          <div className="md:col-span-1 space-y-8">
            {/* Profile Module (Placeholder) */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-xl font-bold text-gray-800 mb-4">Profile</h3>
              {/* Profile Content Goes Here */}
              <p className="text-gray-600">View and edit your profile.</p>
            </div>

            {/* Achievements Module (Placeholder) */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-xl font-bold text-gray-800 mb-4">Achievements & Level</h3>
              {/* Achievements Content Goes Here */}
              <p className="text-gray-600">Track your progress and unlocked achievements.</p>
            </div>

            {/* Community Module (Placeholder) */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-xl font-bold text-gray-800 mb-4">Learning Community</h3>
              {/* Community Content Goes Here */}
              <p className="text-gray-600">Connect with other learners and teachers.</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default DashboardPageV2;
