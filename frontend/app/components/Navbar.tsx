'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FaBars, FaTimes } from 'react-icons/fa';
import Cookies from 'js-cookie';

const Navbar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [dropdown, setDropdown] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // 封装一个刷新用户信息的方法
    const refreshUser = () => {
      const userInfo = localStorage.getItem('userInfo') || sessionStorage.getItem('userInfo');
      if (userInfo) {
        setUser(JSON.parse(userInfo));
      } else {
        setUser(null);
      }
    };

    refreshUser();

    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'userInfo' || e.key === 'token') {
        refreshUser();
      }
    };
    window.addEventListener('storage', handleStorage);

    const handleUserChange = () => refreshUser();
    window.addEventListener('userChanged', handleUserChange);

    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('userChanged', handleUserChange);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userInfo');
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('userInfo');
    Cookies.remove('token', { path: '/' });
    Cookies.remove('userInfo', { path: '/' });
    setUser(null);
    setDropdown(false);
    router.push('/login');
    window.dispatchEvent(new Event('userChanged'));
  };

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  return (
    <nav className="bg-white shadow-md sticky top-0 z-50">
      <div className="container mx-auto px-6 py-3">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <Link href="/" className="text-2xl font-bold text-blue-600">
              LangBridge
            </Link>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex space-x-8">
            <Link href="/" className="text-gray-700 hover:text-blue-600 font-medium">Home</Link>
            <Link href="/courses" className="text-gray-700 hover:text-blue-600 font-medium">Courses</Link>
            <Link href="/teachers" className="text-gray-700 hover:text-blue-600 font-medium">Teachers</Link>
            <Link href="/about" className="text-gray-700 hover:text-blue-600 font-medium">About Us</Link>
            <Link href="/contact" className="text-gray-700 hover:text-blue-600 font-medium">Contact Us</Link>
          </div>

          <div className="hidden md:flex items-center space-x-4">
            {!user ? (
              <>
                <Link href="/login" className="text-gray-700 hover:text-blue-600 font-medium">Login</Link>
                <Link href="/register" className="bg-blue-600 text-white px-4 py-2 rounded-full hover:bg-blue-700 transition duration-300">Free to register</Link>
              </>
            ) : (
              <div className="relative inline-block">
                <img
                  src={user.avatar || '/default-avatar.svg'}
                  alt="avatar"
                  className="w-10 h-10 rounded-full cursor-pointer border-2 border-blue-500"
                  onClick={() => setDropdown(v => !v)}
                />
                {dropdown && (
                  <div className="absolute right-0 mt-2 w-40 bg-white border rounded shadow-lg z-50">
                    <button
                      className="block w-full text-left px-4 py-2 hover:bg-gray-100"
                      onClick={() => { setDropdown(false); router.push('/profile'); }}
                    >
                      个人中心
                    </button>
                    <button
                      className="block w-full text-left px-4 py-2 hover:bg-gray-100"
                      onClick={handleLogout}
                    >
                      退出
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button className="text-gray-700 focus:outline-none" onClick={toggleMenu}>
              {isOpen ? <FaTimes size={24} /> : <FaBars size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <div className="md:hidden mt-4">
            <div className="flex flex-col space-y-3">
              <Link href="/" className="text-gray-700 hover:text-blue-600 font-medium py-2" onClick={() => setIsOpen(false)}>首页</Link>
              <Link href="/courses" className="text-gray-700 hover:text-blue-600 font-medium py-2" onClick={() => setIsOpen(false)}>课程</Link>
              <Link href="/teachers" className="text-gray-700 hover:text-blue-600 font-medium py-2" onClick={() => setIsOpen(false)}>教师</Link>
              <Link href="/about" className="text-gray-700 hover:text-blue-600 font-medium py-2" onClick={() => setIsOpen(false)}>关于我们</Link>
              <Link href="/contact" className="text-gray-700 hover:text-blue-600 font-medium py-2" onClick={() => setIsOpen(false)}>联系我们</Link>
              <div className="flex space-x-4 pt-2">
                {!user ? (
                  <>
                    <Link href="/login" className="text-gray-700 hover:text-blue-600 font-medium" onClick={() => setIsOpen(false)}>登录</Link>
                    <Link href="/register" className="bg-blue-600 text-white px-4 py-2 rounded-full hover:bg-blue-700 transition duration-300" onClick={() => setIsOpen(false)}>免费注册</Link>
                  </>
                ) : (
                  <div className="relative inline-block">
                    <img
                      src={user.avatar || '/default-avatar.svg'}
                      alt="avatar"
                      className="w-10 h-10 rounded-full cursor-pointer border-2 border-blue-500"
                      onClick={() => setDropdown(v => !v)}
                    />
                    {dropdown && (
                      <div className="absolute right-0 mt-2 w-40 bg-white border rounded shadow-lg z-50">
                        <button
                          className="block w-full text-left px-4 py-2 hover:bg-gray-100"
                          onClick={() => { setDropdown(false); router.push('/profile'); setIsOpen(false); }}
                        >
                          个人中心
                        </button>
                        <button
                          className="block w-full text-left px-4 py-2 hover:bg-gray-100"
                          onClick={() => { handleLogout(); setIsOpen(false); }}
                        >
                          退出
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;