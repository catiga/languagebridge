'use client';

import React, { useState, useEffect } from 'react';
import ProfileLayout from '../ProfileLayout';
import { motion } from 'framer-motion';
import { apiClient } from '@/app/utils/api';
import { toast } from 'react-toastify';
import { FaSpinner } from 'react-icons/fa';
import { ApiResponse } from '@/app/utils/interfaces';

interface UserSetting {
  key: string;
  value: string;
}

const SettingRow = ({
  label,
  description,
  children,
}: {
  label: string;
  description: string;
  children: React.ReactNode;
}) => (
  <div className="flex justify-between items-center py-6 border-b border-gray-200 last:border-b-0">
    <div>
      <h3 className="text-lg font-semibold text-gray-800">{label}</h3>
      <p className="text-sm text-gray-500 max-w-md">{description}</p>
    </div>
    <div>{children}</div>
  </div>
);

const ToggleSwitch = ({
  enabled,
  onChange,
  disabled = false,
}: {
  enabled: boolean;
  onChange: (enabled: boolean) => void;
  disabled?: boolean;
}) => (
  <button
    type="button"
    className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
      enabled ? 'bg-blue-600' : 'bg-gray-200'
    } ${disabled ? 'cursor-not-allowed opacity-50' : ''}`}
    onClick={() => !disabled && onChange(!enabled)}
    disabled={disabled}
  >
    <span
      aria-hidden="true"
      className={`inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
        enabled ? 'translate-x-5' : 'translate-x-0'
      }`}
    />
  </button>
);

const PasscodeInput = ({ value, onChange, disabled }: { value: string; onChange: (v: string) => void; disabled?: boolean }) => (
  <input
    type="password"
    inputMode="numeric"
    pattern="\\d{6}"
    maxLength={6}
    minLength={6}
    className="w-32 px-4 py-2 border rounded-lg text-lg text-center tracking-widest"
    placeholder="******"
    value={value}
    onChange={e => {
      const v = e.target.value.replace(/[^0-9]/g, '').slice(0, 6);
      onChange(v);
    }}
    disabled={disabled}
    autoComplete="off"
  />
);

export default function ProfileSettingPage() {
  const [settings, setSettings] = useState<{ [key: string]: string }>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const notificationEnabled = settings['notifications.email.enabled'] === 'true';
  const [passcodeInput, setPasscodeInput] = useState(settings['security.passcode'] || '');
  useEffect(() => {
    setPasscodeInput(settings['security.passcode'] || '');
  }, [settings['security.passcode']]);
  const [passcodeError, setPasscodeError] = useState('');
  const [passcodeSaving, setPasscodeSaving] = useState(false);
  const handlePasscodeSave = async () => {
    if (!/^\d{6}$/.test(passcodeInput)) {
      setPasscodeError('Passcode must be 6 digits.');
      return;
    }
    setPasscodeSaving(true);
    setPasscodeError('');
    try {
      const res = await apiClient.post<ApiResponse<null>>('/spwapi/auth/security/set', {
        passcode: passcodeInput
      });
      if (res.code === 0) {
        setSettings((prev) => ({ ...prev, 'security.passcode': passcodeInput }));
        toast.success('Security passcode updated!');
      } else {
        setPasscodeError(res.msg || 'Failed to update passcode.');
      }
    } catch (error: any) {
      setPasscodeError(error.message || 'An error occurred.');
    } finally {
      setPasscodeSaving(false);
    }
  };

  useEffect(() => {
    const fetchSettings = async () => {
      setIsLoading(true);
      try {
        const res = await apiClient.get<ApiResponse<UserSetting[]>>('/spwapi/auth/settings/fetch');
        if (res.code === 0 && Array.isArray(res.data)) {
          const settingsMap = res.data.reduce((acc: { [key: string]: string }, setting: UserSetting) => {
            acc[setting.key] = setting.value;
            return acc;
          }, {} as { [key: string]: string });
          
          if (settingsMap['notifications.email.enabled'] === undefined) {
            settingsMap['notifications.email.enabled'] = 'true'; // Default to true
          }
          setSettings(settingsMap);
        } else {
          toast.error(res.msg || 'Failed to fetch settings.');
        }
      } catch (error: any) {
        toast.error(error.message || 'An error occurred while fetching settings.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleSettingChange = async (key: string, value: string) => {
    setIsSaving(true);
    try {
      const res = await apiClient.post<ApiResponse<null>>('/spwapi/auth/settings/update', {
        settings: [{ key, value }],
      });
      if (res.code === 0) {
        setSettings((prev) => ({ ...prev, [key]: value }));
        toast.success('Settings updated successfully!');
      } else {
        toast.error(res.msg || 'Failed to update settings.');
      }
    } catch (error: any) {
      toast.error(error.message || 'An error occurred while updating settings.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <ProfileLayout>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="p-4 sm:p-6 md:p-8"
      >
        <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Settings</h1>
          <p className="text-gray-600 mb-8">Manage your account and notification preferences.</p>
          
          {isLoading ? (
            <div className="flex justify-center items-center py-10">
              <FaSpinner className="animate-spin text-blue-500 text-3xl" />
            </div>
          ) : (
            <div>
              <SettingRow
                label="Email Notifications"
                description="Receive emails about course recommendations, important updates, and platform announcements."
              >
                <ToggleSwitch
                  enabled={notificationEnabled}
                  onChange={(enabled) => handleSettingChange('notifications.email.enabled', String(enabled))}
                  disabled={isSaving}
                />
              </SettingRow>
              {settings['security.passcode'] !== undefined && (
                <SettingRow
                  label="Security Passcode"
                  description="Set a 6-digit numeric passcode for security verification."
                >
                  <div className="flex flex-col items-end gap-2">
                    <div className="flex items-center gap-2">
                      <PasscodeInput value={passcodeInput} onChange={setPasscodeInput} disabled={passcodeSaving} />
                      <button
                        className="ml-2 px-5 py-2 bg-blue-600 text-white rounded-lg font-bold disabled:opacity-50"
                        disabled={passcodeSaving || passcodeInput === settings['security.passcode'] || !/^\d{6}$/.test(passcodeInput)}
                        onClick={handlePasscodeSave}
                      >Confirm</button>
                    </div>
                    {passcodeError && <div className="text-red-500 text-sm">{passcodeError}</div>}
                  </div>
                </SettingRow>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </ProfileLayout>
  );
} 