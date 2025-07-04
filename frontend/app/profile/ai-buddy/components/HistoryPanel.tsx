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
          setError(res?.msg || '加载失败');
        }
      })
      .catch((err: any) => {
        setError(err?.message || '加载失败');
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-6">
      <div className="mb-4 text-blue-700 font-semibold">历史记录</div>
      {loading ? (
        <div className="py-12 text-center text-blue-500">加载中...</div>
      ) : error ? (
        <div className="py-12 text-center text-red-500">{error}</div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm border">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-3 py-2 border">日期</th>
                  <th className="px-3 py-2 border">类型</th>
                  <th className="px-3 py-2 border">分数</th>
                </tr>
              </thead>
              <tbody>
                {history.length === 0 ? (
                  <tr><td colSpan={3} className="text-center py-6 text-gray-400">暂无记录</td></tr>
                ) : (
                  history.map((h, i) => (
                    <tr key={i} className="border-b">
                      <td className="px-3 py-2 border text-center">{h.add_time.slice(0, 10)}</td>
                      <td className="px-3 py-2 border text-center">自测</td>
                      <td className="px-3 py-2 border text-center font-bold text-blue-700">{h.score}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="mt-6">
            <div className="mb-2 font-medium">进度图表</div>
            <div className="w-full h-32 bg-gradient-to-r from-blue-100 to-blue-200 rounded flex items-end gap-2 p-4">
              {history.length === 0 ? (
                <div className="text-gray-400 w-full text-center">暂无数据</div>
              ) : (
                history.map((h, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center">
                    <div className="w-6 bg-blue-500 rounded-t" style={{ height: `${Math.max(10, h.score)}px` }}></div>
                    <div className="text-xs mt-1">{h.add_time.slice(5, 10)}</div>
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