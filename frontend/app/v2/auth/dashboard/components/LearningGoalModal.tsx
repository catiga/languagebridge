'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { apiClient } from '../../../../utils/api';
import { toast } from 'react-toastify';
import { 
  FaBullseye, 
  FaCalendarAlt, 
  FaGraduationCap, 
  FaTimes,
  FaSave,
  FaSpinner
} from 'react-icons/fa';

interface LearningGoal {
  id?: number;
  student_id: number;
  goal_type: 'long_term' | 'medium_term' | 'short_term';
  title: string;
  description: string;
  target_date: string;
  target_level?: number;
  current_level?: number;
  status: 'active' | 'completed' | 'paused';
  created_at?: string;
  updated_at?: string;
}

interface LearningGoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: any;
  onGoalSaved: (goal: LearningGoal) => void;
}

const goalTypeOptions = [
  {
    value: 'long_term',
    label: 'Long-term Goal',
    description: 'I want to complete this in 6-12 months',
    icon: FaBullseye,
    color: 'from-purple-500 to-purple-600'
  },
  {
    value: 'medium_term',
    label: 'Medium-term Goal',
    description: 'I want to complete this in 2-6 months',
    icon: FaCalendarAlt,
    color: 'from-blue-500 to-blue-600'
  },
  {
    value: 'short_term',
    label: 'Short-term Goal',
    description: 'I want to complete this in 2-8 weeks',
    icon: FaGraduationCap,
    color: 'from-green-500 to-green-600'
  }
];

export default function LearningGoalModal({ 
  isOpen, 
  onClose, 
  student, 
  onGoalSaved 
}: LearningGoalModalProps) {
  const [formData, setFormData] = useState<Partial<LearningGoal>>({
    goal_type: 'medium_term',
    title: '',
    description: '',
    target_date: '',
    target_level: 3,
    current_level: student?.current_level || 1,
    status: 'active'
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [existingGoals, setExistingGoals] = useState<LearningGoal[]>([]);
  const [showAssessmentInfo, setShowAssessmentInfo] = useState(false);

  useEffect(() => {
    if (isOpen && student) {
      fetchExistingGoals();
      setFormData(prev => ({
        ...prev,
        student_id: student.id,
        current_level: student.current_level || 1
      }));
    }
  }, [isOpen, student]);

  const fetchExistingGoals = async () => {
    try {
      const res = await apiClient.get(`/spwapi/auth/planner/pull?student_id=${student.id}`) as any;
      if (res && res.code === 0 && Array.isArray(res.data)) {
        const goals = res.data.map((stageGoal: any) => ({
          id: stageGoal.id,
          student_id: student.id,
          goal_type: 'medium_term',
          title: stageGoal.title,
          description: stageGoal.description,
          target_date: stageGoal.end_date,
          target_level: 3,
          current_level: 1,
          status: 'active',
          created_at: stageGoal.created_at || new Date().toISOString()
        }));
        setExistingGoals(goals);
      } else {
        setExistingGoals([]);
      }
    } catch (error) {
      console.error('Failed to fetch existing goals:', error);
      setExistingGoals([]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title?.trim() || !formData.description?.trim() || !formData.target_date) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsLoading(true);
    try {
      const stageGoalData = {
        title: formData.title,
        description: formData.description,
        goal: formData.description,
        start_date: new Date().toISOString().split('T')[0],
        end_date: formData.target_date,
        goal_period_type: formData.goal_type,
        target_level: formData.target_level,
        init_level: 1,
        student_id: student.id
      };

      const res = await apiClient.post('/spwapi/auth/planner/add', stageGoalData) as any;
      if (res && res.code === 0) {
        toast.success('Learning goal created successfully! You can now take the AI assessment to get personalized recommendations.');
        
        const newGoal: LearningGoal = {
          id: res.data.id,
          student_id: res.data.student_id,
          goal_type: formData.goal_type!,
          title: res.data.title,
          description: res.data.description,
          target_date: res.data.end_date,
          target_level: formData.target_level,
          current_level: formData.current_level,
          status: 'active',
          created_at: res.data.add_time
        };
        
        onGoalSaved(newGoal);
        setShowAssessmentInfo(true);
      } else {
        toast.error(res?.msg || 'Failed to create learning goal');
      }
    } catch (error: any) {
      toast.error(error?.message || 'Failed to create learning goal');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: keyof LearningGoal, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const getGoalTypeInfo = (type: string) => {
    return goalTypeOptions.find(option => option.value === type) || goalTypeOptions[1];
  };

  if (!isOpen) return null;

  return (
    <>
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                    <FaBullseye className="text-xl" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">Set Learning Goal</h2>
                    <p className="text-blue-100">Create a personalized learning path for {student?.name}</p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-white hover:bg-opacity-20 rounded-full transition-colors"
                >
                  <FaTimes className="text-xl" />
                </button>
              </div>
            </div>

            <div className="flex h-[calc(90vh-120px)]">
              {/* Left Side - Form */}
              <div className="flex-1 p-6 overflow-y-auto">
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Goal Type Selection */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      Goal Type *
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {goalTypeOptions.map((option) => {
                        const Icon = option.icon;
                        const isSelected = formData.goal_type === option.value;
                        return (
                          <motion.button
                            key={option.value}
                            type="button"
                            onClick={() => handleInputChange('goal_type', option.value)}
                            className={`p-4 rounded-xl border-2 transition-all duration-200 text-left ${
                              isSelected
                                ? `border-transparent bg-gradient-to-r ${option.color} text-white shadow-lg`
                                : 'border-gray-200 hover:border-gray-300 bg-gray-50 hover:bg-gray-100'
                            }`}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            <Icon className={`text-2xl mb-2 ${isSelected ? 'text-white' : 'text-gray-600'}`} />
                            <div className="font-semibold mb-1">{option.label}</div>
                            <div className={`text-sm ${isSelected ? 'text-blue-100' : 'text-gray-600'}`}>
                              {option.description}
                            </div>
                          </motion.button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Goal Title */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Goal Title *
                    </label>
                    <input
                      type="text"
                      value={formData.title || ''}
                      onChange={(e) => handleInputChange('title', e.target.value)}
                      placeholder="e.g., Master Business English for International Meetings"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>

                  {/* Goal Description */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Detailed Description *
                    </label>
                    <textarea
                      value={formData.description || ''}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                      placeholder="Describe what you want to achieve, specific skills to develop, and how this goal will help your learning journey..."
                      rows={4}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                      required
                    />
                  </div>

                  {/* Target Date and Level */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Target Date *
                      </label>
                      <input
                        type="date"
                        value={formData.target_date || ''}
                        onChange={(e) => handleInputChange('target_date', e.target.value)}
                        min={new Date().toISOString().split('T')[0]}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Your expected completion date (AI may adjust based on assessment)
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Target Level
                      </label>
                      <select
                        value={formData.target_level || 3}
                        onChange={(e) => handleInputChange('target_level', parseInt(e.target.value))}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value={1}>Level 1 - Beginner</option>
                        <option value={2}>Level 2 - Elementary</option>
                        <option value={3}>Level 3 - Intermediate</option>
                        <option value={4}>Level 4 - Upper Intermediate</option>
                        <option value={5}>Level 5 - Advanced</option>
                      </select>
                      <p className="text-xs text-gray-500 mt-1">
                        Your expected level (AI may adjust based on assessment)
                      </p>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <div className="pt-4">
                    <motion.button
                      type="submit"
                      disabled={isLoading}
                      className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-6 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      {isLoading ? (
                        <div className="flex items-center justify-center space-x-2">
                          <FaSpinner className="animate-spin" />
                          <span>Creating Goal...</span>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center space-x-2">
                          <FaSave />
                          <span>Create Learning Goal</span>
                        </div>
                      )}
                    </motion.button>
                  </div>
                </form>
              </div>

              {/* Right Side - Existing Goals */}
              <div className="w-80 bg-gray-50 p-6 border-l border-gray-200 overflow-y-auto">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Existing Goals</h3>
                {existingGoals.length === 0 ? (
                  <div className="text-center text-gray-500 py-8">
                    <FaBullseye className="text-4xl mx-auto mb-3 text-gray-300" />
                    <p>No goals set yet</p>
                    <p className="text-sm">Create your first learning goal to get started</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {existingGoals.map((goal) => {
                      const goalInfo = getGoalTypeInfo(goal.goal_type);
                      const Icon = goalInfo.icon;
                      return (
                        <div
                          key={goal.id}
                          className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm"
                        >
                          <div className="flex items-start space-x-3">
                            <div className={`w-8 h-8 rounded-full bg-gradient-to-r ${goalInfo.color} flex items-center justify-center flex-shrink-0`}>
                              <Icon className="text-white text-sm" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-semibold text-gray-900 text-sm mb-1 line-clamp-2">
                                {goal.title}
                              </h4>
                              <p className="text-xs text-gray-600 mb-2 line-clamp-2">
                                {goal.description}
                              </p>
                              <div className="flex items-center justify-between text-xs text-gray-500">
                                <span>Target: {new Date(goal.target_date).toLocaleDateString()}</span>
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  goal.status === 'active' ? 'bg-green-100 text-green-800' :
                                  goal.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                                  'bg-yellow-100 text-yellow-800'
                                }`}>
                                  {goal.status}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      </AnimatePresence>

      {/* AI Assessment Information Modal */}
      <AnimatePresence>
        {showAssessmentInfo && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-lg p-6 max-w-md w-full mx-4"
            >
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Learning Goal Created!
                </h3>
                
                <p className="text-sm text-gray-600 mb-4">
                  Your learning goal has been created successfully. To get personalized recommendations and adjust your learning path, you can now take the AI assessment.
                </p>
                
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                  <h4 className="font-medium text-blue-900 mb-2">What the AI Assessment will do:</h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Evaluate your current skill level</li>
                    <li>• Adjust your target level if needed</li>
                    <li>• Optimize your learning timeline</li>
                    <li>• Provide personalized study recommendations</li>
                  </ul>
                </div>
                
                <div className="flex space-x-3">
                  <button
                    onClick={() => {
                      setShowAssessmentInfo(false);
                      onClose();
                    }}
                    className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => {
                      setShowAssessmentInfo(false);
                      onClose();
                      // TODO: Navigate to AI assessment page
                      // router.push(`/v2/auth/assessment/${student.id}`);
                    }}
                    className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition-colors"
                  >
                    Take Assessment
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
} 