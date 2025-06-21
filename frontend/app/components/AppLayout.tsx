'use client';

import { usePathname } from 'next/navigation';
import Navbar from './Navbar';
import React from 'react';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Determine background color based on path
  const pageBackgroundColor = pathname === '/' ? 'bg-gray-900' : 'bg-gray-50';
  
  // All pages with a navbar need top padding
  const mainContentPadding = 'pt-16';

  return (
    <div className={pageBackgroundColor}>
      <Navbar />
      <main className={mainContentPadding}>
        {children}
      </main>
    </div>
  );
} 