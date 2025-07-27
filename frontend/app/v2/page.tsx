'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function V2Root() {
  const router = useRouter();

  useEffect(() => {
    // 重定向到v2 dashboard
    router.push('/v2/auth/dashboard');
  }, [router]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Redirecting to Dashboard
        </h2>
        <p className="text-gray-600">
          Please wait while we redirect you...
        </p>
      </div>
    </div>
  );
} 