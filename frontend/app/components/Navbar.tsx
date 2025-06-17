'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { FaBars, FaTimes } from 'react-icons/fa';

const Navbar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  return (
    <nav className="bg-white shadow-md sticky top-0 z-50">
      <div className="container mx-auto px-6 py-3">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <Link href="/" className="text-2xl font-bold text-blue-600">
              EnglishBridge
            </Link>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex space-x-8">
            <Link href="/" className="text-gray-700 hover:text-blue-600 font-medium">
              首页
            </Link>
            <Link href="/courses" className="text-gray-700 hover:text-blue-600 font-medium">
              课程
            </Link>
            <Link href="/teachers" className="text-gray-700 hover:text-blue-600 font-medium">
              教师
            </Link>
            <Link href="/about" className="text-gray-700 hover:text-blue-600 font-medium">
              关于我们
            </Link>
            <Link href="/contact" className="text-gray-700 hover:text-blue-600 font-medium">
              联系我们
            </Link>
          </div>

          <div className="hidden md:flex items-center space-x-4">
            <Link href="/login" className="text-gray-700 hover:text-blue-600 font-medium">
              登录
            </Link>
            <Link 
              href="/register" 
              className="bg-blue-600 text-white px-4 py-2 rounded-full hover:bg-blue-700 transition duration-300"
            >
              免费注册
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button 
              className="text-gray-700 focus:outline-none"
              onClick={toggleMenu}
            >
              {isOpen ? <FaTimes size={24} /> : <FaBars size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <div className="md:hidden mt-4">
            <div className="flex flex-col space-y-3">
              <Link 
                href="/" 
                className="text-gray-700 hover:text-blue-600 font-medium py-2"
                onClick={() => setIsOpen(false)}
              >
                首页
              </Link>
              <Link 
                href="/courses" 
                className="text-gray-700 hover:text-blue-600 font-medium py-2"
                onClick={() => setIsOpen(false)}
              >
                课程
              </Link>
              <Link 
                href="/teachers" 
                className="text-gray-700 hover:text-blue-600 font-medium py-2"
                onClick={() => setIsOpen(false)}
              >
                教师
              </Link>
              <Link 
                href="/about" 
                className="text-gray-700 hover:text-blue-600 font-medium py-2"
                onClick={() => setIsOpen(false)}
              >
                关于我们
              </Link>
              <Link 
                href="/contact" 
                className="text-gray-700 hover:text-blue-600 font-medium py-2"
                onClick={() => setIsOpen(false)}
              >
                联系我们
              </Link>
              <div className="flex space-x-4 pt-2">
                <Link 
                  href="/login" 
                  className="text-gray-700 hover:text-blue-600 font-medium"
                  onClick={() => setIsOpen(false)}
                >
                  登录
                </Link>
                <Link 
                  href="/register" 
                  className="bg-blue-600 text-white px-4 py-2 rounded-full hover:bg-blue-700 transition duration-300"
                  onClick={() => setIsOpen(false)}
                >
                  免费注册
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar; 