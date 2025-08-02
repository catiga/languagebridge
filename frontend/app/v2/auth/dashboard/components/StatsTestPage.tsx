'use client';

import React, { useState } from 'react';
import StudyPlanStats from './StudyPlanStats';

export default function StatsTestPage() {
  const [overviewId, setOverviewId] = useState(1);
  const [studentName, setStudentName] = useState('Test Student');

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-4">Study Plan Statistics Test</h1>
        <div className="flex gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Overview ID
            </label>
            <input
              type="number"
              value={overviewId}
              onChange={(e) => setOverviewId(parseInt(e.target.value) || 1)}
              className="border border-gray-300 rounded px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Student Name
            </label>
            <input
              type="text"
              value={studentName}
              onChange={(e) => setStudentName(e.target.value)}
              className="border border-gray-300 rounded px-3 py-2"
            />
          </div>
        </div>
      </div>
      
      <StudyPlanStats 
        overviewId={overviewId} 
        studentName={studentName} 
      />
    </div>
  );
} 