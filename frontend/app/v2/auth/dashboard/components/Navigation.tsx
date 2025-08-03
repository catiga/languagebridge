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
    id: 'courses',
    label: 'Courses',
    icon: '📚',
    path: '/v2/auth/courses'
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: '⚙️',
    path: '/v2/auth/settings'
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
      {/* Logo and Desktop Navigation */}
      <div className="flex items-center space-x-6">
        {/* Desktop Navigation */}
        <nav className="hidden md:flex space-x-1">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => handleNavClick(item.path)}
            className={`
              flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 relative
              ${pathname === item.path
                ? 'bg-white bg-opacity-20 text-white shadow-md'
                : 'text-white text-opacity-80 hover:text-white hover:bg-white hover:bg-opacity-10'
              }
            `}
          >
            <span className="mr-2">{item.icon}</span>
            {item.label}
            {item.badge && (
              <span className="ml-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full font-bold">
                {item.badge}
              </span>
            )}
          </button>
        ))}
        </nav>
      </div>

      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="md:hidden p-2 rounded-lg text-white hover:text-blue-100 hover:bg-white hover:bg-opacity-10 transition-colors"
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
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }
                `}
              >
                <span className="mr-3">{item.icon}</span>
                {item.label}
                {item.badge && (
                  <span className="ml-auto bg-red-500 text-white text-xs px-2 py-1 rounded-full font-bold">
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