"use client";
import React from 'react';

const mockHistory = [
  { date: '2024-05-01', type: 'Self Assessment', score: 85 },
  { date: '2024-05-03', type: 'Exam', score: 90 },
  { date: '2024-05-05', type: 'Practice', score: 92 },
  { date: '2024-05-07', type: 'Self Assessment', score: 88 },
];

export default function HistoryPanel() {
  return (
    <div className="p-6">
      <div className="mb-4 text-blue-700 font-semibold">History</div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm border">
          <thead>
            <tr className="bg-gray-50">
              <th className="px-3 py-2 border">Date</th>
              <th className="px-3 py-2 border">Type</th>
              <th className="px-3 py-2 border">Score</th>
            </tr>
          </thead>
          <tbody>
            {mockHistory.map((h,i)=>(
              <tr key={i} className="border-b">
                <td className="px-3 py-2 border text-center">{h.date}</td>
                <td className="px-3 py-2 border text-center">{h.type}</td>
                <td className="px-3 py-2 border text-center font-bold text-blue-700">{h.score}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-6">
        <div className="mb-2 font-medium">Progress Chart (mock)</div>
        <div className="w-full h-32 bg-gradient-to-r from-blue-100 to-blue-200 rounded flex items-end gap-2 p-4">
          {mockHistory.map((h,i)=>(
            <div key={i} className="flex-1 flex flex-col items-center">
              <div className="w-6 bg-blue-500 rounded-t" style={{height:`${h.score}px`}}></div>
              <div className="text-xs mt-1">{h.date.slice(5)}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 