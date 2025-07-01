'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { FaUserCircle } from 'react-icons/fa';
import Image from 'next/image';

export default function Navbar() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userInfo, setUserInfo] = useState<{ avatar?: string; name?: string; email?: string } | null>(null);
  const router = useRouter();

  const isHomePage = pathname === '/';

  useEffect(() => {
    if (!isHomePage) {
      setScrolled(true); // On non-home pages, navbar is always in "scrolled" state
      return;
    }

    const handleScroll = () => {
      const isScrolled = window.scrollY > 10;
      setScrolled(isScrolled);
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Check on mount

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [isHomePage]);

  // 检查token
  useEffect(() => {
    const checkLogin = () => {
      const token = (typeof window !== 'undefined') ? (localStorage.getItem('token') || sessionStorage.getItem('token')) : null;
      setIsLoggedIn(!!token);
      let info = null;
      try {
        const raw = (typeof window !== 'undefined') ? (localStorage.getItem('userInfo') || sessionStorage.getItem('userInfo')) : null;
        if (raw) info = JSON.parse(raw);
      } catch {}
      setUserInfo(info);
    };
    checkLogin();
    window.addEventListener('userChanged', checkLogin);
    return () => window.removeEventListener('userChanged', checkLogin);
  }, []);

  const navLinks = [
    { href: '/', label: 'Home' },
    { href: '/courses', label: 'Courses' },
    { href: '/teachers', label: 'Teachers', recruit: true },
    { href: '/about', label: 'About Us' },
    { href: '/contact', label: 'Contact Us' },
  ];

  // Dynamic classes based on page and scroll state
  const navClass = scrolled
    ? `bg-white/80 backdrop-blur-lg border-b border-gray-200/80 shadow-sm`
    : isHomePage
    ? 'bg-transparent'
    : 'bg-white border-b border-gray-200';
  
  const linkColor = scrolled ? 'text-gray-800 hover:text-blue-600' : 'text-white';
  const logoColor = scrolled ? 'text-gray-900' : 'text-white';
  const iconColor = scrolled ? 'text-gray-600 hover:text-blue-600' : 'text-gray-200 hover:text-white';

  const NavLink = ({ href, label, recruit }: { href: string; label: string; recruit?: boolean }) => (
    <Link href={href}>
      <span className={`relative transition-colors duration-300 font-medium ${linkColor}`}
        style={{ display: 'inline-block', paddingRight: recruit ? '32px' : undefined }}>
        {label}
        {recruit && (
          <span
            className="absolute -top-2 -right-6 flex items-center px-1.5 py-0.5 text-[10px] bg-pink-500 text-white rounded-full font-bold animate-bounce shadow"
            style={{ lineHeight: '1', minWidth: '36px', height: '18px' }}
            title="We are recruiting teachers!"
          >
            <svg className="inline w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path d="M12 2v2m6.364 1.636l-1.414 1.414M22 12h-2M19.364 19.364l-1.414-1.414M12 22v-2M4.636 19.364l1.414-1.414M2 12h2M4.636 4.636l1.414 1.414" stroke="#fff" strokeWidth="2" strokeLinecap="round"/>
              <circle cx="12" cy="12" r="5" fill="#f472b6" />
            </svg>
            Recruiting
          </span>
        )}
        {pathname === href && (
          <span className={`absolute bottom-[-6px] left-1/2 -translate-x-1/2 h-[3px] w-3/5 rounded-full ${scrolled ? 'bg-blue-600' : 'bg-cyan-400'}`}></span>
        )}
      </span>
    </Link>
  );

  // 退出登录逻辑
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userInfo');
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('userInfo');
    if (typeof window !== 'undefined' && window.Cookies) {
      window.Cookies.remove('token', { path: '/' });
      window.Cookies.remove('userInfo', { path: '/' });
    }
    setMenuOpen(false);
    window.dispatchEvent(new Event('userChanged'));
    router.push('/');
  };

  return (
    <nav className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ease-in-out ${navClass}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link href="/">
              <span className="flex items-center gap-2">
                <svg width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="18" cy="18" r="18" fill="#2563EB"/>
                  <path d="M10 24C10 18 18 12 26 24" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
                  <circle cx="18" cy="15" r="4" fill="#fff"/>
                  <ellipse cx="18" cy="27" rx="7" ry="2.5" fill="#fff" fillOpacity=".7"/>
                </svg>
                <span className={`text-2xl font-bold transition-colors duration-300 ${logoColor}`}>LangBridge</span>
              </span>
            </Link>
          </div>
          <div className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => (
              <NavLink key={link.href} {...link} />
            ))}
          </div>
          <div className="hidden md:flex items-center">
            {isLoggedIn ? (
              <div className="relative">
                    <button
                  onClick={() => setMenuOpen((v) => !v)}
                  className="focus:outline-none"
                  aria-label="User menu"
                >
                  {userInfo?.avatar && userInfo.avatar.trim() !== '' ? (
                    <Image src={userInfo.avatar} alt="avatar" width={36} height={36} className="rounded-full object-cover border-2 border-blue-400" />
                  ) : (
                    <FaUserCircle className={`transition-colors duration-300 ${iconColor}`} size={32} />
                  )}
                    </button>
                {menuOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg py-2 z-50 animate-fade-in">
                    {/* 用户信息行 */}
                    <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-3">
                      {userInfo?.avatar && userInfo.avatar.trim() !== '' ? (
                        <Image src={userInfo.avatar} alt="avatar" width={36} height={36} className="rounded-full object-cover border border-blue-200" />
                      ) : (
                        <FaUserCircle className="text-blue-400" size={28} />
                      )}
                      <div className="flex flex-col">
                        <span className="font-semibold text-gray-800 text-sm">{userInfo?.name || userInfo?.email || 'User'}</span>
                        {userInfo?.email && userInfo?.name && (
                          <span className="text-xs text-gray-500">{userInfo.email}</span>
                        )}
                      </div>
                    </div>
                    <Link href="/profile/overview" className="block px-4 py-2 text-gray-700 hover:bg-blue-50" onClick={() => setMenuOpen(false)}>
                      Profile
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 rounded-b-xl"
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link
                  href="/login"
                  className={`px-5 py-2 rounded-lg font-bold transition-colors duration-200 bg-gradient-to-r from-blue-500 to-pink-500 text-white shadow-lg hover:scale-105 hover:from-blue-600 hover:to-pink-600 animate-pulse`}
                >
                  Login
                </Link>
                <Link href="/register" className={`ml-2 px-4 py-2 rounded-lg font-bold transition-colors duration-200 ${scrolled ? 'bg-pink-500 text-white hover:bg-pink-600' : 'bg-white/80 text-pink-500 hover:bg-pink-600 hover:text-white'}`}>Register</Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}