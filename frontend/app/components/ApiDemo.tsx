'use client';

import { useState } from 'react';
import { apiClient } from '../utils/api';

export default function ApiDemo() {
  const [response, setResponse] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const testApi = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await apiClient.get('/spwapi/welcome');
      setResponse(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : '发生错误');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h3 className="text-2xl font-bold mb-4">API 调用示例</h3>
      <button
        onClick={testApi}
        disabled={loading}
        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:bg-gray-400"
      >
        {loading ? '加载中...' : '测试 API'}
      </button>

      {error && (
        <div className="mt-4 p-4 bg-red-100 text-red-700 rounded">
          {error}
        </div>
      )}

      {response && (
        <div className="mt-4">
          <h4 className="font-semibold mb-2">响应结果：</h4>
          <pre className="bg-gray-100 p-4 rounded overflow-auto">
            {JSON.stringify(response, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
} 