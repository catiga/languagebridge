'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface UnlockTask {
  id: string;
  title: string;
  description: string;
  icon: string;
  isCompleted: boolean;
  action: string;
  route: string;
}

export default function FeatureUnlock() {
  const [tasks] = useState<UnlockTask[]>([
    {
      id: 'add-student',
      title: 'Add Your First Student',
      description: 'Add a student to start managing their learning journey',
      icon: '👨‍🎓',
      isCompleted: false,
      action: 'Add Student',
      route: '/v2/auth/students/add'
    },
    {
      id: 'complete-assessment',
      title: 'Complete Student Assessment',
      description: 'Assess your student\'s current level to get personalized recommendations',
      icon: '🤖',
      isCompleted: false,
      action: 'Start Assessment',
      route: '/v2/auth/assessment'
    },
    {
      id: 'create-study-plan',
      title: 'Create Study Plan',
      description: 'Set up a personalized learning plan for your student',
      icon: '📅',
      isCompleted: false,
      action: 'Create Plan',
      route: '/v2/auth/study-planner'
    },
    {
      id: 'book-trial-lesson',
      title: 'Book Trial Lesson',
      description: 'Book a trial lesson to experience our teaching quality',
      icon: '🎓',
      isCompleted: false,
      action: 'Book Trial',
      route: '/v2/auth/trial-lessons'
    }
  ]);

  const router = useRouter();

  const handleTaskAction = (task: UnlockTask) => {
    router.push(task.route);
  };

  const completedTasks = tasks.filter(task => task.isCompleted).length;
  const totalTasks = tasks.length;

  return (
    <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6 mb-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Unlock More Features</h2>
          <p className="text-gray-600 mt-1">
            Complete these tasks to unlock advanced features and get personalized recommendations
          </p>
        </div>
        <div className="text-right">
          <div className="text-sm text-gray-500">Progress</div>
          <div className="text-2xl font-bold text-blue-600">
            {completedTasks}/{totalTasks}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {tasks.map((task) => (
          <div
            key={task.id}
            className={`p-4 rounded-lg border-2 transition-all ${
              task.isCompleted
                ? 'border-green-200 bg-green-50'
                : 'border-gray-200 bg-white hover:border-blue-300 hover:shadow-md'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-3">
                <div className={`text-2xl ${task.isCompleted ? 'opacity-50' : ''}`}>
                  {task.icon}
                </div>
                <div className="flex-1">
                  <h3 className={`font-semibold ${
                    task.isCompleted ? 'text-green-700 line-through' : 'text-gray-900'
                  }`}>
                    {task.title}
                  </h3>
                  <p className={`text-sm mt-1 ${
                    task.isCompleted ? 'text-green-600' : 'text-gray-600'
                  }`}>
                    {task.description}
                  </p>
                </div>
              </div>
              {task.isCompleted ? (
                <div className="text-green-500">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              ) : (
                <button
                  onClick={() => handleTaskAction(task)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 transition-colors"
                >
                  {task.action}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {completedTasks === totalTasks && (
        <div className="mt-6 p-4 bg-green-100 rounded-lg text-center">
          <div className="text-green-600 font-semibold mb-2">
            🎉 Congratulations! All features unlocked!
          </div>
          <p className="text-green-700 text-sm">
            You now have access to all advanced features and personalized recommendations.
          </p>
        </div>
      )}

      {completedTasks < totalTasks && (
        <div className="mt-6 text-center">
          <div className="text-sm text-gray-600 mb-2">
            Complete {totalTasks - completedTasks} more task{totalTasks - completedTasks !== 1 ? 's' : ''} to unlock all features
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all"
              style={{ width: `${(completedTasks / totalTasks) * 100}%` }}
            ></div>
          </div>
        </div>
      )}
    </div>
  );
} 