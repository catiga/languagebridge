'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FaUserCircle } from 'react-icons/fa';

export default function Navbar() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);

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

  const navLinks = [
    { href: '/', label: 'Home' },
    { href: '/courses', label: 'Courses' },
    { href: '/teachers', label: 'Teachers' },
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

  const NavLink = ({ href, label }: { href: string; label: string }) => (
    <Link href={href}>
      <span className={`relative transition-colors duration-300 font-medium ${linkColor}`}>
        {label}
        {pathname === href && (
          <span className={`absolute bottom-[-6px] left-1/2 -translate-x-1/2 h-[3px] w-3/5 rounded-full ${scrolled ? 'bg-blue-600' : 'bg-cyan-400'}`}></span>
        )}
      </span>
    </Link>
  );

  return (
    <nav className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ease-in-out ${navClass}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link href="/">
              <span className={`text-2xl font-bold transition-colors duration-300 ${logoColor}`}>
                LangBridge
              </span>
            </Link>
          </div>
          <div className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => (
              <NavLink key={link.href} {...link} />
            ))}
          </div>
          <div className="hidden md:flex items-center">
            <Link href="/profile">
              <FaUserCircle className={`transition-colors duration-300 ${iconColor}`} size={28} />
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}