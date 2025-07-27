'use client';

import { useRouter } from 'next/navigation';

interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  route: string;
  isNew?: boolean;
}

const quickActions: QuickAction[] = [
  {
    id: 'student-management',
    title: 'Student Management',
    description: 'Add and manage your students',
    icon: '👨‍🎓',
    color: 'bg-blue-500',
    route: '/v2/auth/students'
  },
  {
    id: 'ai-assessment',
    title: 'AI Assessment',
    description: 'Assess student levels and set learning goals',
    icon: '🤖',
    color: 'bg-purple-500',
    route: '/v2/auth/assessment',
    isNew: true
  },
  {
    id: 'study-planner',
    title: 'Study Planner',
    description: 'Create and manage learning plans for students',
    icon: '📅',
    color: 'bg-green-500',
    route: '/v2/auth/study-planner'
  },
  {
    id: 'progress-tracker',
    title: 'Progress Tracker',
    description: 'Monitor student learning progress and achievements',
    icon: '📊',
    color: 'bg-orange-500',
    route: '/v2/auth/progress'
  },
  {
    id: 'interest-management',
    title: 'Interest Management',
    description: 'Update your learning interests and preferences',
    icon: '🏷️',
    color: 'bg-indigo-500',
    route: '/v2/auth/interests'
  },
  {
    id: 'trial-lessons',
    title: 'Trial Lessons',
    description: 'Book trial lessons for your students',
    icon: '🎯',
    color: 'bg-pink-500',
    route: '/v2/auth/trial-lessons'
  }
];

export default function QuickActions() {
  const router = useRouter();

  const handleActionClick = (action: QuickAction) => {
    router.push(action.route);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Quick Actions</h2>
          <p className="text-gray-600 mt-1">
            Access your most used features
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {quickActions.map((action) => (
          <div
            key={action.id}
            className="group cursor-pointer"
            onClick={() => handleActionClick(action)}
          >
            <div className="relative">
              <div className={`
                w-full aspect-square rounded-lg flex flex-col items-center justify-center
                ${action.color} text-white group-hover:scale-105 transition-transform
                shadow-sm group-hover:shadow-md
              `}>
                <div className="text-3xl mb-2">{action.icon}</div>
                <h3 className="text-sm font-medium text-center px-2">
                  {action.title}
                </h3>
              </div>
              
              {action.isNew && (
                <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                  NEW
                </div>
              )}
            </div>
            
            <p className="text-xs text-gray-600 mt-2 text-center line-clamp-2">
              {action.description}
            </p>
          </div>
        ))}
      </div>

      {/* Additional Quick Stats */}
      <div className="mt-8 pt-6 border-t border-gray-100">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">6</div>
            <div className="text-sm text-gray-600">Courses Completed</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">48</div>
            <div className="text-sm text-gray-600">Hours Studied</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">5</div>
            <div className="text-sm text-gray-600">Certificates Earned</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">12</div>
            <div className="text-sm text-gray-600">Days Streak</div>
          </div>
        </div>
      </div>
    </div>
  );
} 