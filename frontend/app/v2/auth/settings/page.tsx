'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { apiClient } from '../../../utils/api';
import { toast } from 'react-toastify';
import Navigation from '../dashboard/components/Navigation';
import { 
  FaBell, 
  FaShieldAlt, 
  FaPalette, 
  FaGlobe, 
  FaUserSecret, 
  FaEye, 
  FaEyeSlash,
  FaSpinner,
  FaCheck,
  FaTimes,
  FaCog,
  FaMoon,
  FaSun,
  FaDesktop
} from 'react-icons/fa';

interface UserSetting {
  key: string;
  value: string;
}

interface SettingsData {
  'notifications.email.enabled': string;
  'notifications.push.enabled': string;
  'security.passcode': string;
  'security.two_factor': string;
  'appearance.theme': string;
  'appearance.language': string;
  'privacy.profile_visibility': string;
  'privacy.data_sharing': string;
}

export default function V2SettingsPage() {
  const router = useRouter();
  const [settings, setSettings] = useState<SettingsData>({
    'notifications.email.enabled': 'true',
    'notifications.push.enabled': 'true',
    'security.passcode': '',
    'security.two_factor': 'false',
    'appearance.theme': 'system',
    'appearance.language': 'en',
    'privacy.profile_visibility': 'public',
    'privacy.data_sharing': 'true'
  });
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [passcodeInput, setPasscodeInput] = useState('');
  const [showPasscode, setShowPasscode] = useState(false);
  const [passcodeError, setPasscodeError] = useState('');
  const [passcodeSaving, setPasscodeSaving] = useState(false);
  const [activeSection, setActiveSection] = useState('notifications');

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setIsLoading(true);
    try {
      const res = await apiClient.get('/spwapi/auth/settings/fetch') as any;
      if (res && res.code === 0 && Array.isArray(res.data)) {
        const settingsMap = res.data.reduce((acc: any, setting: UserSetting) => {
          acc[setting.key] = setting.value;
          return acc;
        }, {} as SettingsData);
        
        // Set defaults for missing settings
        const defaultSettings = {
          'notifications.email.enabled': 'true',
          'notifications.push.enabled': 'true',
          'security.passcode': '',
          'security.two_factor': 'false',
          'appearance.theme': 'system',
          'appearance.language': 'en',
          'privacy.profile_visibility': 'public',
          'privacy.data_sharing': 'true'
        };
        
        setSettings({ ...defaultSettings, ...settingsMap });
        setPasscodeInput(settingsMap['security.passcode'] || '');
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error);
      toast.error('Failed to load settings');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSettingChange = async (key: keyof SettingsData, value: string) => {
    setIsSaving(true);
    try {
      const res = await apiClient.post('/spwapi/auth/settings/update', {
        settings: [{ key, value }],
      }) as any;
      
      if (res && res.code === 0) {
        setSettings(prev => ({ ...prev, [key]: value }));
        toast.success('Setting updated successfully!');
      } else {
        toast.error(res?.msg || 'Failed to update setting');
      }
    } catch (error: any) {
      toast.error(error?.message || 'Failed to update setting');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePasscodeSave = async () => {
    if (!/^\d{6}$/.test(passcodeInput)) {
      setPasscodeError('Passcode must be 6 digits');
      return;
    }
    
    setPasscodeSaving(true);
    setPasscodeError('');
    
    try {
      const res = await apiClient.post('/spwapi/auth/security/set', {
        passcode: passcodeInput
      }) as any;
      
      if (res && res.code === 0) {
        setSettings(prev => ({ ...prev, 'security.passcode': passcodeInput }));
        toast.success('Security passcode updated!');
      } else {
        setPasscodeError(res?.msg || 'Failed to update passcode');
      }
    } catch (error: any) {
      setPasscodeError(error?.message || 'Failed to update passcode');
    } finally {
      setPasscodeSaving(false);
    }
  };

  const sections = [
    {
      id: 'notifications',
      title: 'Notifications',
      icon: FaBell,
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200'
    },
    {
      id: 'security',
      title: 'Security',
      icon: FaShieldAlt,
      color: 'from-red-500 to-red-600',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200'
    },
    {
      id: 'appearance',
      title: 'Appearance',
      icon: FaPalette,
      color: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200'
    },
    {
      id: 'privacy',
      title: 'Privacy',
      icon: FaUserSecret,
      color: 'from-green-500 to-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200'
    }
  ];

  const ToggleSwitch = ({ enabled, onChange, disabled = false }: {
    enabled: boolean;
    onChange: (enabled: boolean) => void;
    disabled?: boolean;
  }) => (
    <motion.button
      type="button"
      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
        enabled ? 'bg-gradient-to-r from-blue-500 to-blue-600' : 'bg-gray-200'
      } ${disabled ? 'cursor-not-allowed opacity-50' : ''}`}
      onClick={() => !disabled && onChange(!enabled)}
      disabled={disabled}
      whileTap={{ scale: 0.95 }}
    >
      <motion.span
        aria-hidden="true"
        className="inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out"
        animate={{ x: enabled ? 20 : 0 }}
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
      />
    </motion.button>
  );

  const SettingCard = ({ title, description, children }: {
    title: string;
    description: string;
    children: React.ReactNode;
  }) => (
    <motion.div
      className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200"
      whileHover={{ y: -2 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
          <p className="text-sm text-gray-600">{description}</p>
        </div>
        <div className="ml-4">{children}</div>
      </div>
    </motion.div>
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        >
          <FaSpinner className="text-4xl text-blue-500" />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header - 与Dashboard完全一致 */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Navigation />
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => router.push('/v2/auth/profile')}
                  className="text-white hover:text-blue-100 transition-colors text-sm font-medium"
                >
                  Profile
                </button>
                <div className="w-px h-4 bg-white bg-opacity-30"></div>
                <button
                  onClick={() => router.push('/logout')}
                  className="text-white hover:text-blue-100 transition-colors text-sm font-medium"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header with Back Button */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8"
        >
          <div className="flex items-center space-x-4">
            <motion.button
              onClick={() => router.push('/v2/auth/dashboard')}
              className="flex items-center space-x-2 px-4 py-2 bg-white rounded-lg shadow-sm border border-gray-200 hover:bg-gray-50 transition-all duration-200"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span className="text-gray-700 font-medium">Back to Dashboard</span>
            </motion.button>
            
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <FaCog className="text-xl text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
                <p className="text-gray-600">Customize your learning experience</p>
              </div>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm p-4 sticky top-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Categories</h2>
              <nav className="space-y-2">
                {sections.map((section) => {
                  const Icon = section.icon;
                  return (
                    <motion.button
                      key={section.id}
                      onClick={() => setActiveSection(section.id)}
                      className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-all duration-200 ${
                        activeSection === section.id
                          ? `bg-gradient-to-r ${section.color} text-white shadow-lg`
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Icon className="text-lg" />
                      <span className="font-medium">{section.title}</span>
                    </motion.button>
                  );
                })}
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeSection}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                {/* Notifications Section */}
                {activeSection === 'notifications' && (
                  <>
                    <SettingCard
                      title="Email Notifications"
                      description="Receive emails about course recommendations, important updates, and platform announcements."
                    >
                      <ToggleSwitch
                        enabled={settings['notifications.email.enabled'] === 'true'}
                        onChange={(enabled) => handleSettingChange('notifications.email.enabled', String(enabled))}
                        disabled={isSaving}
                      />
                    </SettingCard>

                    <SettingCard
                      title="Push Notifications"
                      description="Get real-time notifications about lessons, assignments, and important updates."
                    >
                      <ToggleSwitch
                        enabled={settings['notifications.push.enabled'] === 'true'}
                        onChange={(enabled) => handleSettingChange('notifications.push.enabled', String(enabled))}
                        disabled={isSaving}
                      />
                    </SettingCard>
                  </>
                )}

                {/* Security Section */}
                {activeSection === 'security' && (
                  <>
                    <SettingCard
                      title="Security Passcode"
                      description="Set a 6-digit numeric passcode for additional security verification."
                    >
                      <div className="flex items-center space-x-3">
                        <div className="relative">
                          <input
                            type={showPasscode ? 'text' : 'password'}
                            value={passcodeInput}
                            onChange={(e) => setPasscodeInput(e.target.value)}
                            placeholder="••••••"
                            maxLength={6}
                            className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center font-mono"
                            disabled={passcodeSaving}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPasscode(!showPasscode)}
                            className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          >
                            {showPasscode ? <FaEyeSlash size={14} /> : <FaEye size={14} />}
                          </button>
                        </div>
                        <motion.button
                          onClick={handlePasscodeSave}
                          disabled={passcodeSaving || passcodeInput === settings['security.passcode'] || !/^\d{6}$/.test(passcodeInput)}
                          className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          {passcodeSaving ? <FaSpinner className="animate-spin" /> : 'Save'}
                        </motion.button>
                      </div>
                      {passcodeError && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="text-red-500 text-sm mt-2"
                        >
                          {passcodeError}
                        </motion.div>
                      )}
                    </SettingCard>

                    <SettingCard
                      title="Two-Factor Authentication"
                      description="Add an extra layer of security to your account with 2FA."
                    >
                      <ToggleSwitch
                        enabled={settings['security.two_factor'] === 'true'}
                        onChange={(enabled) => handleSettingChange('security.two_factor', String(enabled))}
                        disabled={isSaving}
                      />
                    </SettingCard>
                  </>
                )}

                {/* Appearance Section */}
                {activeSection === 'appearance' && (
                  <>
                    <SettingCard
                      title="Theme"
                      description="Choose your preferred color scheme and appearance."
                    >
                      <div className="flex items-center space-x-3">
                        {[
                          { value: 'light', icon: FaSun, label: 'Light' },
                          { value: 'dark', icon: FaMoon, label: 'Dark' },
                          { value: 'system', icon: FaDesktop, label: 'System' }
                        ].map((theme) => {
                          const Icon = theme.icon;
                          return (
                            <motion.button
                              key={theme.value}
                              onClick={() => handleSettingChange('appearance.theme', theme.value)}
                              className={`flex items-center space-x-2 px-3 py-2 rounded-lg border-2 transition-all duration-200 ${
                                settings['appearance.theme'] === theme.value
                                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                                  : 'border-gray-200 hover:border-gray-300'
                              }`}
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                            >
                              <Icon size={16} />
                              <span className="text-sm font-medium">{theme.label}</span>
                            </motion.button>
                          );
                        })}
                      </div>
                    </SettingCard>

                    <SettingCard
                      title="Language"
                      description="Select your preferred language for the interface."
                    >
                      <select
                        value={settings['appearance.language']}
                        onChange={(e) => handleSettingChange('appearance.language', e.target.value)}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="en">English</option>
                        <option value="zh">中文</option>
                        <option value="es">Español</option>
                        <option value="fr">Français</option>
                      </select>
                    </SettingCard>
                  </>
                )}

                {/* Privacy Section */}
                {activeSection === 'privacy' && (
                  <>
                    <SettingCard
                      title="Profile Visibility"
                      description="Control who can see your profile and learning progress."
                    >
                      <select
                        value={settings['privacy.profile_visibility']}
                        onChange={(e) => handleSettingChange('privacy.profile_visibility', e.target.value)}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="public">Public</option>
                        <option value="friends">Friends Only</option>
                        <option value="private">Private</option>
                      </select>
                    </SettingCard>

                    <SettingCard
                      title="Data Sharing"
                      description="Allow us to use your data to improve our services and provide personalized recommendations."
                    >
                      <ToggleSwitch
                        enabled={settings['privacy.data_sharing'] === 'true'}
                        onChange={(enabled) => handleSettingChange('privacy.data_sharing', String(enabled))}
                        disabled={isSaving}
                      />
                    </SettingCard>
                  </>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
} 