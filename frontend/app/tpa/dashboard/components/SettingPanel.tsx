import React, { useState } from 'react';

export default function SettingPanel() {
  const [emailNotify, setEmailNotify] = useState(true);

  return (
    <div className="max-w-xl mx-auto bg-white rounded-2xl shadow-lg p-8">
      <h2 className="text-xl font-bold mb-6 text-gray-800">Settings</h2>
      <div className="flex items-center justify-between mb-4">
        <span className="text-gray-700 font-medium">Enable Email Notifications</span>
        <label className="inline-flex relative items-center cursor-pointer">
          <input
            type="checkbox"
            className="sr-only peer"
            checked={emailNotify}
            onChange={() => setEmailNotify(v => !v)}
          />
          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-400 rounded-full peer peer-checked:bg-blue-500 transition-all"></div>
          <div className="absolute left-1 top-1 bg-white w-4 h-4 rounded-full shadow-md transition-all peer-checked:translate-x-5"></div>
        </label>
      </div>
      <p className="text-gray-400 text-sm">When enabled, you will receive important notifications via email.</p>
    </div>
  );
} 