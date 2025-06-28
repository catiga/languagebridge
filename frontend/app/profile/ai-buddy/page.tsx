"use client";
import React, { useState } from 'react';
import Link from 'next/link';

const tabs = [
  { key: 'analysis', label: 'Learning Analysis' },
  { key: 'assessment', label: 'Level Assessment' },
  { key: 'mock-exam', label: 'Mock Exam' },
];

export default function AiBuddyPage() {
  const [activeTab, setActiveTab] = useState('analysis');

  return (
    <div className="max-w-3xl mx-auto py-8">
      <div className="flex items-center gap-3 mb-6">
        <h1 className="text-3xl font-bold text-gray-800">AI Learning Buddy</h1>
        <span className="px-2 py-0.5 text-xs bg-yellow-200 text-yellow-800 rounded">Beta</span>
      </div>
      <div className="flex gap-4 border-b mb-8">
        {tabs.map(tab => (
          <button
            key={tab.key}
            className={`px-4 py-2 -mb-px border-b-2 font-semibold transition-all ${activeTab === tab.key ? 'border-yellow-400 text-yellow-700' : 'border-transparent text-gray-500 hover:text-yellow-700'}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div>
        {activeTab === 'analysis' && (
          <div className="p-6 bg-white rounded-xl shadow">Learning effect analysis feature coming soon...</div>
        )}
        {activeTab === 'assessment' && (
          <div className="p-6 bg-white rounded-xl shadow">Level assessment feature coming soon...</div>
        )}
        {activeTab === 'mock-exam' && (
          <div className="p-6 bg-white rounded-xl shadow">Mock exam feature coming soon...</div>
        )}
      </div>
    </div>
  );
} 