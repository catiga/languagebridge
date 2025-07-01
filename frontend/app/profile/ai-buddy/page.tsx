"use client";
import React, { useState } from 'react';
import ProfileLayout from '../ProfileLayout';
import SelfTestPanel from './components/SelfTestPanel';
import PracticePanel from './components/PracticePanel';
import HistoryPanel from './components/HistoryPanel';
import { FaRobot, FaPenFancy, FaPuzzlePiece, FaChartLine } from 'react-icons/fa';

function AIBanner() {
  return (
    <div className="flex items-center gap-5 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 rounded-2xl shadow-lg px-8 py-6 mb-8 animate-fade-in">
      <div className="bg-white/30 rounded-full p-3 shadow-lg">
        <FaRobot className="text-5xl text-white animate-bounce" />
      </div>
      <div>
        <div className="text-2xl md:text-3xl font-extrabold text-white drop-shadow mb-1">AI Buddy</div>
        <div className="text-white/90 text-lg font-medium mb-1">Welcome back! Ready to level up your English today?</div>
        <div className="text-indigo-100 text-sm italic">Your personal AI-powered English learning assistant</div>
      </div>
    </div>
  );
}

const tabs = [
  { key: 'selftest', label: 'Self Assessment', icon: <FaPenFancy /> },
  { key: 'practice', label: 'Practice', icon: <FaPuzzlePiece /> },
  { key: 'history', label: 'History', icon: <FaChartLine /> },
];

function ComingSoonCard() {
  return (
    <div className="mt-8 p-4 bg-gradient-to-r from-yellow-100 via-yellow-50 to-white border-l-4 border-yellow-400 rounded-xl shadow flex items-center gap-4 animate-fade-in">
      <div className="text-3xl">🤖</div>
      <div>
        <div className="font-bold text-yellow-700 mb-1">AI Conversation (Coming Soon)</div>
        <div className="text-yellow-800 text-sm">Immersive English conversation, stay tuned!</div>
      </div>
    </div>
  );
}

export default function AiBuddyPage() {
  const [tab, setTab] = useState('selftest');
  return (
    <ProfileLayout>
      <AIBanner />
      <div className="h-8 md:h-12" />
      <div className="flex justify-center relative z-10 mb-[-32px]">
        <div className="flex gap-4 bg-white/90 rounded-2xl shadow-lg px-6 py-3 border border-blue-100">
          {tabs.map(t => (
            <button
              key={t.key}
              type="button"
              className={`flex items-center gap-2 px-6 py-2 rounded-xl font-bold text-lg transition-all border shadow-sm
                ${tab===t.key ? 'bg-gradient-to-r from-blue-600 to-indigo-500 text-white scale-105 shadow-lg' : 'bg-white/80 text-blue-700 border-blue-100 hover:bg-blue-50 hover:scale-105'}`}
              style={{boxShadow: tab===t.key ? '0 4px 24px 0 rgba(80,80,255,0.15)' : undefined}}
              onClick={() => setTab(t.key)}
            >
              <span className="text-xl">{t.icon}</span>
              {t.label}
            </button>
          ))}
        </div>
      </div>
      <div className="w-full max-w-4xl mx-auto mt-12">
        <div className="bg-white/80 rounded-2xl shadow-2xl p-8 min-h-[340px] animate-fade-in border-t border-blue-100">
          <div className="w-full">
            {tab==='selftest' && <SelfTestPanel />}
            {tab==='practice' && <PracticePanel />}
            {tab==='history' && <HistoryPanel />}
          </div>
        </div>
        <ComingSoonCard />
      </div>
    </ProfileLayout>
  );
} 