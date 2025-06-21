'use client';

import { usePathname } from 'next/navigation';
import Navbar from './Navbar';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  // 如果路径以 /profile 开头，则不渲染 Navbar
  const showNavbar = !pathname.startsWith('/profile');

  return (
    <>
      {showNavbar && <Navbar />}
      <main>{children}</main>
    </>
  );
} 