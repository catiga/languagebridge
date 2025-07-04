"use client";
import React, { useEffect, useState } from 'react';
import { apiClient } from '@/app/utils/api';

interface HistoryItem {
  add_time: string;
  score: number;
  arid: number;
  input: string;
  category_path: string;
  category_level: string;
}

export default function HistoryPanel() {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    apiClient
      .get('/spwapi/auth/aiagent/exam/history')
      .then((res: any) => {
        if (res && res.code === 0 && Array.isArray(res.data)) {
          setHistory(res.data);
        } else {
          setError(res?.msg || 'Failed to load');
        }
      })
      .catch((err: any) => {
        setError(err?.message || 'Failed to load');
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-6 bg-gradient-to-br from-[#181F3A] via-[#232B4D] to-[#3B1F5E] rounded-2xl shadow-2xl border border-[#2B3460] max-w-2xl mx-auto">
      <div className="mb-4 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 text-2xl font-extrabold tracking-wide drop-shadow-lg select-none flex items-center gap-2">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" className="inline-block"><circle cx="12" cy="12" r="10" fill="url(#g1)"/><defs><linearGradient id="g1" x1="0" y1="0" x2="24" y2="24" gradientUnits="userSpaceOnUse"><stop stopColor="#60A5FA"/><stop offset="1" stopColor="#A78BFA"/></linearGradient></defs></svg>
        Exam History
      </div>
      {loading ? (
        <div className="py-12 text-center">
          <div className="inline-flex items-center gap-2 animate-pulse">
            <span className="w-3 h-3 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full animate-bounce"></span>
            <span className="text-blue-300 font-mono tracking-widest">Loading...</span>
          </div>
        </div>
      ) : error ? (
        <div className="py-12 text-center">
          <span className="text-pink-400 font-semibold bg-pink-100/10 px-4 py-2 rounded shadow">{error}</span>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto rounded-xl shadow-lg bg-white/5 backdrop-blur border border-[#2B3460]">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="bg-gradient-to-r from-blue-900/60 to-purple-900/60 text-white">
                  <th className="px-3 py-2 font-semibold">Date</th>
                  <th className="px-3 py-2 font-semibold">Type</th>
                  <th className="px-3 py-2 font-semibold">Score</th>
                </tr>
              </thead>
              <tbody>
                {history.length === 0 ? (
                  <tr><td colSpan={3} className="text-center py-6 text-gray-400">No records yet</td></tr>
                ) : (
                  history.map((h, i) => (
                    <tr key={i} className="border-b border-[#232B4D] hover:bg-gradient-to-r hover:from-blue-900/20 hover:to-purple-900/20 transition">
                      <td className="px-3 py-2 text-center text-blue-200 font-mono">{h.add_time.slice(0, 10)}</td>
                      <td className="px-3 py-2 text-center text-purple-300 font-semibold">Self-Assessment</td>
                      <td className="px-3 py-2 text-center font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400 text-lg">{h.score}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="mt-8">
            <div className="mb-2 font-medium text-blue-200 tracking-wide">Progress Chart</div>
            <div className="w-full h-36 bg-gradient-to-r from-[#232B4D] to-[#3B1F5E] rounded-xl flex items-end gap-2 p-4 shadow-inner border border-[#2B3460]">
              {history.length === 0 ? (
                <div className="text-gray-400 w-full text-center">No data</div>
              ) : (
                history.map((h, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center">
                    <div className="w-6 rounded-t-xl bg-gradient-to-t from-blue-500 via-purple-500 to-pink-400 shadow-lg" style={{ height: `${Math.max(10, h.score)}px` }}></div>
                    <div className="text-xs mt-1 text-blue-100 font-mono">{h.add_time.slice(5, 10)}</div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
} 