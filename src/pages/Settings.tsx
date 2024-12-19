import React from 'react';
import { User, Bell, Lock, Palette, Globe } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

const Settings = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-6 text-gray-900 dark:text-gray-100">Settings</h1>
      
      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center gap-3 mb-6">
              <User className="h-5 w-5 text-indigo-500" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Profile Settings</h2>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  className="w-full rounded-lg border bg-white px-3 py-2 text-sm"
                  placeholder="John Doe"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  className="w-full rounded-lg border bg-white px-3 py-2 text-sm"
                  placeholder="john@example.com"
                />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center gap-3 mb-6">
              <Bell className="h-5 w-5 text-indigo-500" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Notification Preferences</h2>
            </div>
            
            <div className="space-y-4">
              <label className="flex items-center">
                <input type="checkbox" className="rounded border-gray-300" />
                <span className="ml-2 text-gray-700 dark:text-gray-300">Email notifications</span>
              </label>
              
              <label className="flex items-center">
                <input type="checkbox" className="rounded border-gray-300" />
                <span className="ml-2 text-gray-700 dark:text-gray-300">Push notifications</span>
              </label>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center gap-3 mb-6">
              <Palette className="h-5 w-5 text-indigo-500" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Appearance</h2>
            </div>
            
            <div className="space-y-4">
              <label className="flex items-center justify-between">
                <span className="text-gray-700 dark:text-gray-300">Dark Mode</span>
                <button
                  onClick={toggleTheme}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full ${
                    theme === 'dark' ? 'bg-indigo-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                      theme === 'dark' ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </label>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center gap-3 mb-6">
              <Lock className="h-5 w-5 text-indigo-500" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Security</h2>
            </div>
            
            <div className="space-y-4">
              <button className="w-full bg-indigo-500 text-white rounded-lg px-4 py-2 hover:bg-indigo-600 transition-colors">
                Change Password
              </button>
              
              <button className="w-full bg-indigo-500 text-white rounded-lg px-4 py-2 hover:bg-indigo-600 transition-colors">
                Enable 2FA
              </button>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center gap-3 mb-6">
              <Globe className="h-5 w-5 text-indigo-500" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Language & Region</h2>
            </div>
            
            <div className="space-y-4">
              <select className="w-full rounded-lg border bg-white px-3 py-2 text-sm">
                <option>English (US)</option>
                <option>Spanish</option>
                <option>French</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;