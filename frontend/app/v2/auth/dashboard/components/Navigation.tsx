'use client';

import { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';

interface NavItem {
  id: string;
  label: string;
  icon: string;
  path: string;
  badge?: string;
}

const navItems: NavItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: '🏠',
    path: '/v2/auth/dashboard'
  },
  {
    id: 'students',
    label: 'Students',
    icon: '👨‍🎓',
    path: '/v2/auth/students'
  },
  {
    id: 'assessment',
    label: 'Assessment',
    icon: '🤖',
    path: '/v2/auth/assessment',
    badge: 'NEW'
  },
  {
    id: 'study-planner',
    label: 'Study Planner',
    icon: '📅',
    path: '/v2/auth/study-planner'
  },
  {
    id: 'progress',
    label: 'Progress',
    icon: '📊',
    path: '/v2/auth/progress'
  },
  {
    id: 'courses',
    label: 'Courses',
    icon: '📚',
    path: '/v2/auth/courses'
  },
  {
    id: 'trial-lessons',
    label: 'Trial Lessons',
    icon: '🎯',
    path: '/v2/auth/trial-lessons'
  },
  {
    id: 'interests',
    label: 'Interests',
    icon: '🏷️',
    path: '/v2/auth/interests'
  },
  {
    id: 'profile',
    label: 'Profile',
    icon: '👤',
    path: '/v2/auth/profile'
  }
];

export default function Navigation() {
  const router = useRouter();
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleNavClick = (path: string) => {
    router.push(path);
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      {/* Desktop Navigation */}
      <nav className="hidden md:flex space-x-1">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => handleNavClick(item.path)}
            className={`
              flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors relative
              ${pathname === item.path
                ? 'bg-blue-100 text-blue-700'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }
            `}
          >
            <span className="mr-2">{item.icon}</span>
            {item.label}
            {item.badge && (
              <span className="ml-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                {item.badge}
              </span>
            )}
          </button>
        ))}
      </nav>

      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="md:hidden p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Mobile Navigation */}
      {isMobileMenuOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50">
          <div className="px-4 py-2 space-y-1">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.path)}
                className={`
                  w-full flex items-center px-4 py-3 rounded-lg text-sm font-medium transition-colors
                  ${pathname === item.path
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }
                `}
              >
                <span className="mr-3">{item.icon}</span>
                {item.label}
                {item.badge && (
                  <span className="ml-auto bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                    {item.badge}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  );
} 